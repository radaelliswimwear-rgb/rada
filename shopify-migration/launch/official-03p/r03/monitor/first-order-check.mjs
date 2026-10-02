#!/usr/bin/env node
// Verificación de SOLO LECTURA del primer pedido real (Lane H). No imprime datos personales: solo estados, banderas y cifras.
// Uso:  node first-order-check.mjs            -> el pedido más reciente que NO tenga etiqueta "interno" ni sea test
//       node first-order-check.mjs "#1003"    -> un pedido concreto
// Revisa: estado de pago y de cumplimiento, pasarela, total/IVA (debe ser 0), envío cobrado vs las 5 tarifas fijas (o 0 si total >= 299.900),
//         dirección/teléfono completos (solo sí/no), SKU y cantidad, descuento de inventario contra baseline.json, etiquetas.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const STORE = "wgcvpd-ib.myshopify.com";
const RATES = [9900, 12900, 17900, 21900, 44900];
const FREE_FROM = 299900;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "foc-"));
let n = 0;
function gql(query) {
  const q = path.join(TMP, `q${++n}.graphql`); fs.writeFileSync(q, query);
  const r = spawnSync(process.platform === "win32" ? "shopify.cmd" : "shopify", ["store", "execute", "--store", STORE, "--query-file", q, "--json", "--no-color"], { encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error("consulta falló: " + ((r.stderr || "") + out).slice(0, 2500));
  return JSON.parse(out.slice(i));
}
const want = process.argv[2];
const ORDER_FIELDS = `id name createdAt test cancelledAt tags displayFinancialStatus displayFulfillmentStatus paymentGatewayNames
  currentTotalPriceSet { shopMoney { amount currencyCode } } totalTaxSet { shopMoney { amount } } totalDiscountsSet { shopMoney { amount } }
  shippingLine { title originalPriceSet { shopMoney { amount } } }
  shippingAddress { address1 city provinceCode zip phone }
  transactions { kind status gateway test amountSet { shopMoney { amount } } }
  customerJourneySummary { ready firstVisit { landingPage source sourceType utmParameters { source medium campaign content term } } lastVisit { landingPage utmParameters { source medium campaign content } } }
  lineItems(first: 20) { nodes { sku quantity title variant { id inventoryQuantity } requiresShipping } }`;
const d = gql(`query { orders(first: 15, sortKey: CREATED_AT, reverse: true${want ? `, query: "name:${want.replace(/"/g, "")}"` : ""}) { nodes { ${ORDER_FIELDS} } } }`);
const list = d.orders.nodes;
const o = want ? list[0] : list.find((x) => !x.test && !(x.tags || []).includes("interno") && !x.cancelledAt);
if (!o) { console.log(want ? `No se encontró el pedido ${want}.` : "Todavía no hay un pedido real (sin etiqueta interno, no test, no cancelado). Nada que verificar."); process.exit(0); }
let base = null; try { base = JSON.parse(fs.readFileSync(path.join(HERE, "baseline.json"), "utf8")).admin.inventory.perSku; } catch { /* sin baseline */ }
const rows = []; const add = (id, ok, detail, soft) => rows.push({ id, status: ok ? "OK" : (soft ? "WARN" : "FALLA"), detail });
const total = Number(o.currentTotalPriceSet.shopMoney.amount), tax = Number(o.totalTaxSet.shopMoney.amount), ship = o.shippingLine ? Number(o.shippingLine.originalPriceSet.shopMoney.amount) : null;
add("pago", ["PAID", "PARTIALLY_REFUNDED"].includes(o.displayFinancialStatus), `estado ${o.displayFinancialStatus}; pasarela ${(o.paymentGatewayNames || []).join(",")}`);
add("pago-real", !o.test && (o.transactions || []).some((t) => t.kind === "SALE" && t.status === "SUCCESS" && !t.test), `transacción SALE/SUCCESS real: ${(o.transactions || []).filter((t) => t.kind === "SALE").map((t) => `${t.status}${t.test ? "/test" : ""}`).join(",") || "ninguna"}`);
add("moneda", o.currentTotalPriceSet.shopMoney.currencyCode === "COP", o.currentTotalPriceSet.shopMoney.currencyCode);
add("iva-cero", tax === 0, `impuesto del pedido = ${tax} (debe ser 0 mientras seas NO RESPONSABLE DE IVA)`);
const needsShip = o.lineItems.nodes.some((l) => l.requiresShipping);
if (needsShip) {
  const okShip = ship !== null && (RATES.includes(ship) || (ship === 0 && total >= FREE_FROM));
  add("envio-cobrado", okShip, `envío cobrado ${ship === null ? "sin línea de envío" : ship}; tarifas válidas ${RATES.join("/")} o 0 si el total ≥ ${FREE_FROM}`);
  const a = o.shippingAddress || {};
  add("direccion-completa", !!(a.address1 && a.city && a.provinceCode && a.phone), `calle ${!!a.address1} · ciudad ${!!a.city} · departamento ${!!a.provinceCode} · teléfono ${!!a.phone} · código postal ${!!a.zip} (el postal puede faltar)`);
}
for (const l of o.lineItems.nodes) {
  const s = l.sku || "(sin SKU)";
  if (!l.variant) { add(`sku ${s}`, false, "la variante ya no existe (producto borrado)", true); continue; }
  const b = base && l.sku ? base[l.sku] : undefined; const now = l.variant.inventoryQuantity;
  add(`inventario ${s}`, b === undefined ? true : now <= b, b === undefined ? `stock ahora ${now}; sin baseline para comparar` : `baseline ${b} → ahora ${now} (cantidad del pedido ${l.quantity}; si hubo otros pedidos la diferencia puede ser mayor)`, b === undefined);
  add(`stock-no-negativo ${s}`, now >= 0, `stock ahora ${now}`);
}
{
  const j = o.customerJourneySummary, f = j && j.firstVisit, l = j && j.lastVisit;
  const u = (x) => (x && x.utmParameters ? ["source", "medium", "campaign", "content", "term"].filter((k) => x.utmParameters[k]).map((k) => `${k}=${x.utmParameters[k]}`).join("&") : "");
  add("atribucion", true, j ? `listo ${j.ready} · primera visita: ${f ? `${f.source || "?"} · ${f.landingPage || "?"} · utm[${u(f) || "ninguna"}]` : "sin dato"} · ultima visita utm[${u(l) || "ninguna"}] (compararla con la campana de Meta; sin utm = directo/organico)` : "Shopify aun no entrega el recorrido (ready=false o sin dato); reintentar en unos minutos");
}
add("fulfillment", true, `cumplimiento: ${o.displayFulfillmentStatus} (sin guía comprada no debe estar CUMPLIDO)`);
add("etiquetas", true, `etiquetas: ${(o.tags || []).join(",") || "ninguna"}`);
console.log(`Pedido ${o.name} · ${o.createdAt} · total ${total} COP · ${o.lineItems.nodes.reduce((a, l) => a + l.quantity, 0)} unidad(es)`);
for (const r of rows) console.log(`${r.status.padEnd(5)} ${r.id.padEnd(26)} ${r.detail}`);
const bad = rows.filter((r) => r.status === "FALLA").length, warn = rows.filter((r) => r.status === "WARN").length;
console.log(`\nResultado: ${bad ? "REVISAR (" + bad + " falla/s)" : warn ? "OK con avisos (" + warn + ")" : "OK"} · siguiente paso: comprar la guía en Envia SOLO si es un pedido real y pagado (la compra es de la dueña).`);
process.exit(bad ? 1 : 0);
