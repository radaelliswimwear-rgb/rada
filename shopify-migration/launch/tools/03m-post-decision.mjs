#!/usr/bin/env node
/**
 * 03M — comandos deterministas para aplicar, en cuanto la dueña decida, lo que hoy es OWNER DECISION (inventario y talla XL).
 * NO inventa cantidades ni decide la XL: sin hoja completada o sin decisión, no escribe nada.
 *
 *   node launch/tools/03m-post-decision.mjs inventory --sheet <hoja-completada.csv>            # valida (seco)
 *   node launch/tools/03m-post-decision.mjs inventory --sheet <hoja.csv> --apply               # escribe (exige permisos read/write_inventory y read_locations: repetir `shopify store auth` con ellos)
 *   node launch/tools/03m-post-decision.mjs unlimited                                          # documenta «vender sin límite»: no hay nada que escribir (ya es el estado)
 *   node launch/tools/03m-post-decision.mjs xl --decision keep|delete [--apply]                # aplica la decisión D1 (import/xl-decision.json)
 *
 * La hoja es import/inventory-template.csv con la columna `cantidad_a_cargar` completada (0 = agotado). Se rechaza si falta
 * alguna fila, sobra alguna, un SKU no coincide con el CSV de importación, o una cantidad no es un entero >= 0.
 * Los datos de clientas, pedidos, cupones y suscriptores NO se migran con este script: requieren decisión escrita (D3).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCSV } from "./03k-catalog-package-check.mjs";
import { gql } from "./03l-migrate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ARGS = process.argv.slice(2);
const CMD = ARGS[0];
const APPLY = ARGS.includes("--apply");
const arg = (n) => { const i = ARGS.indexOf(n); return i >= 0 ? ARGS[i + 1] : null; };
const rd = (p) => fs.readFileSync(path.isAbsolute(p) ? p : path.join(ROOT, p), "utf8");
const table = (p) => { const [h, ...r] = parseCSV(rd(p)); return r.map((row) => Object.fromEntries(h.map((k, i) => [k.replace(/^﻿/, ""), row[i] ?? ""]))); };

export function validateSheet(sheet, importRows) {
  const errs = [];
  const skus = new Set(importRows.filter((r) => r["SKU"]).map((r) => r["SKU"]));
  const seen = new Set();
  for (const r of sheet) {
    if (!skus.has(r.sku)) errs.push(`SKU desconocido: ${r.sku}`);
    if (seen.has(r.sku)) errs.push(`SKU repetido: ${r.sku}`);
    seen.add(r.sku);
    const q = (r.cantidad_a_cargar || "").trim();
    if (q === "") errs.push(`${r.sku}: cantidad vacía`);
    else if (!/^\d+$/.test(q)) errs.push(`${r.sku}: cantidad no válida (${q})`);
  }
  for (const s of skus) if (!seen.has(s)) errs.push(`falta la fila de ${s}`);
  return errs;
}

function inventory() {
  const sheetPath = arg("--sheet");
  if (!sheetPath) { console.log("Sin hoja completada: no se escribe nada. Uso: inventory --sheet <hoja.csv>"); process.exit(2); }
  const sheet = table(sheetPath);
  const errs = validateSheet(sheet, table("import/shopify-products-03c.csv"));
  if (errs.length) { console.log("HOJA NO VÁLIDA:\n - " + errs.slice(0, 15).join("\n - ")); process.exit(1); }
  console.log(`Hoja válida: ${sheet.length} filas, total de unidades ${sheet.reduce((a, r) => a + Number(r.cantidad_a_cargar), 0)}.`);
  if (!APPLY) { console.log("Modo seco: agregue --apply para escribir (requiere permisos de inventario)."); return; }
  const loc = gql(`query { locations(first: 5) { nodes { id name isActive } } }`).locations.nodes.find((l) => l.isActive);
  if (!loc) throw new Error("sin sucursal activa");
  const bySku = new Map();
  let after = null;
  for (;;) {
    const q = gql(`query($after: String) { productVariants(first: 100, after: $after) { nodes { sku inventoryItem { id } } pageInfo { hasNextPage endCursor } } }`, { after });
    q.productVariants.nodes.forEach((v) => bySku.set(v.sku, v.inventoryItem.id));
    if (!q.productVariants.pageInfo.hasNextPage) break;
    after = q.productVariants.pageInfo.endCursor;
  }
  // 1) activar seguimiento; 2) fijar cantidades
  for (const r of sheet) gql(`mutation($id: ID!) { inventoryItemUpdate(id: $id, input: {tracked: true}) { userErrors { message } } }`, { id: bySku.get(r.sku) }, true);
  // API reciente: sin ignoreCompareQuantity; changeFromQuantity null = fijar sin comparar; la mutación exige @idempotent.
  const res = gql(`mutation($input: InventorySetQuantitiesInput!, $k: String!) { inventorySetQuantities(input: $input) @idempotent(key: $k) { userErrors { field message } } }`,
    { k: "03o-inventory-sheet-v1", input: { name: "available", reason: "correction", quantities: sheet.map((r) => ({ inventoryItemId: bySku.get(r.sku), locationId: loc.id, quantity: Number(r.cantidad_a_cargar), changeFromQuantity: null })) } }, true);
  console.log(JSON.stringify(res.inventorySetQuantities));
}

function xl() {
  const d = arg("--decision");
  const spec = JSON.parse(rd("import/xl-decision.json"));
  if (!["keep", "delete"].includes(d)) { console.log("Falta --decision keep|delete: la XL sigue PENDING_OWNER, no se escribe nada."); process.exit(2); }
  if (d === "keep") { console.log("Decisión keep: la variante " + spec.sku + " se conserva (98/98). Nada que borrar; cargar su inventario con la hoja."); return; }
  console.log("Decisión delete: se elimina " + spec.sku + " (97/97). IRREVERSIBLE: rompe SKU y enlaces.");
  if (!APPLY) { console.log("Modo seco: agregue --apply."); return; }
  const p = gql(`query { productByIdentifier(identifier: {handle: "${spec.handle}"}) { id variants(first: 10) { nodes { id sku } } } }`).productByIdentifier;
  const v = p.variants.nodes.find((x) => x.sku === spec.sku);
  if (!v) { console.log("La variante ya no existe."); return; }
  console.log(JSON.stringify(gql(`mutation($p: ID!, $v: [ID!]!) { productVariantsBulkDelete(productId: $p, variantsIds: $v) { userErrors { message } } }`, { p: p.id, v: [v.id] }, true).productVariantsBulkDelete));
}

if (process.argv[1] && process.argv[1].endsWith("03m-post-decision.mjs")) {
  if (CMD === "inventory") inventory();
  else if (CMD === "unlimited") console.log("«Vender sin límite»: las 98 variantes ya están sin seguimiento de inventario, así que nunca se agotan. No hay nada que escribir; solo dejar la decisión por escrito (AC-12).");
  else if (CMD === "xl") xl();
  else { console.log("uso: inventory --sheet <csv> [--apply] | unlimited | xl --decision keep|delete [--apply]"); process.exit(2); }
}
