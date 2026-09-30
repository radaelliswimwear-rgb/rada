#!/usr/bin/env node
// 03O — compara el inventario real de la tienda con import/inventory-sheet-03o.csv (seguimiento activo y cantidad exacta por SKU).
//   node launch/tools/03o-inventory-verify.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gql } from "./03l-migrate.mjs";
import { parseCSV } from "./03k-catalog-package-check.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const [h, ...rows] = parseCSV(fs.readFileSync(path.join(ROOT, "import/inventory-sheet-03o.csv"), "utf8").replace(/^﻿/, ""));
const ix = Object.fromEntries(h.map((k, i) => [k, i]));
const want = new Map(rows.filter((r) => r[ix.sku]).map((r) => [r[ix.sku], Number(r[ix.cantidad_a_cargar])]));
let after = null, n = 0, tracked = 0, ok = 0, total = 0;
const bad = [];
for (;;) {
  const q = gql(`query($after: String) { productVariants(first: 100, after: $after) { nodes { sku inventoryItem { tracked inventoryLevels(first: 5) { nodes { quantities(names: ["available"]) { quantity } } } } } pageInfo { hasNextPage endCursor } } }`, { after });
  for (const v of q.productVariants.nodes) {
    n++;
    const qty = v.inventoryItem.inventoryLevels.nodes.reduce((a, l) => a + (l.quantities[0]?.quantity || 0), 0);
    total += qty;
    if (v.inventoryItem.tracked) tracked++;
    if (v.inventoryItem.tracked && qty === want.get(v.sku)) ok++; else bad.push(`${v.sku}:${qty}/${want.get(v.sku)}`);
  }
  if (!q.productVariants.pageInfo.hasNextPage) break;
  after = q.productVariants.pageInfo.endCursor;
}
console.log(JSON.stringify({ variantes: n, conSeguimiento: tracked, coincidenConLaHoja: ok, unidadesTotales: total, discrepancias: bad.slice(0, 10) }));
process.exit(ok === n && n === want.size ? 0 : 1);
