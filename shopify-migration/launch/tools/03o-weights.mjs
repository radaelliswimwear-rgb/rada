#!/usr/bin/env node
/**
 * 03O — peso de envío de las variantes (dato de la dueña, nunca inventado).
 *
 *   node launch/tools/03o-weights.mjs status                       # cuenta variantes por peso actual
 *   node launch/tools/03o-weights.mjs apply --grams 500 [--yes]    # sin --yes solo muestra lo que haría
 *
 * Modelo elegido por la dueña: UN peso empacado estándar para toda prenda (500 g, «aproximadamente»).
 * Escribe inventoryItem.measurement.weight con productVariantsBulkUpdate (permiso write_products). Idempotente.
 */
import { gql } from "./03l-migrate.mjs";

const ARGS = process.argv.slice(2);
const CMD = ARGS[0];
const arg = (n) => { const i = ARGS.indexOf(n); return i >= 0 ? ARGS[i + 1] : null; };

function allVariants() {
  const out = [];
  let after = null;
  for (;;) {
    const q = gql(`query($after: String) { products(first: 25, after: $after) { nodes { id handle variants(first: 100) { nodes { id sku inventoryItem { measurement { weight { value unit } } } } } } pageInfo { hasNextPage endCursor } } }`, { after });
    for (const p of q.products.nodes) for (const v of p.variants.nodes) out.push({ productId: p.id, handle: p.handle, id: v.id, sku: v.sku, w: v.inventoryItem?.measurement?.weight });
    if (!q.products.pageInfo.hasNextPage) break;
    after = q.products.pageInfo.endCursor;
  }
  return out;
}

const toGrams = (w) => (!w ? 0 : w.unit === "GRAMS" ? w.value : w.unit === "KILOGRAMS" ? w.value * 1000 : w.unit === "POUNDS" ? w.value * 453.592 : w.unit === "OUNCES" ? w.value * 28.3495 : NaN);

if (CMD === "status") {
  const vs = allVariants();
  const by = {};
  for (const v of vs) { const g = Math.round(toGrams(v.w) * 10) / 10; by[g] = (by[g] || 0) + 1; }
  console.log(JSON.stringify({ variantes: vs.length, porPesoEnGramos: by }));
} else if (CMD === "apply") {
  const grams = Number(arg("--grams"));
  if (!Number.isFinite(grams) || grams <= 0) { console.log("Falta --grams <número>: no se inventa ningún peso."); process.exit(2); }
  const vs = allVariants();
  const todo = vs.filter((v) => Math.abs(toGrams(v.w) - grams) > 0.01);
  console.log(`Variantes: ${vs.length}; por actualizar a ${grams} g: ${todo.length}`);
  if (!ARGS.includes("--yes")) { console.log("Modo seco: agregue --yes para escribir."); process.exit(0); }
  const byProduct = new Map();
  for (const v of todo) { if (!byProduct.has(v.productId)) byProduct.set(v.productId, []); byProduct.get(v.productId).push(v); }
  let errs = 0;
  for (const [productId, list] of byProduct) {
    const r = gql(`mutation($p: ID!, $v: [ProductVariantsBulkInput!]!) { productVariantsBulkUpdate(productId: $p, variants: $v) { userErrors { field message } } }`,
      { p: productId, v: list.map((v) => ({ id: v.id, inventoryItem: { measurement: { weight: { value: grams, unit: "GRAMS" } } } })) }, true);
    const ue = r.productVariantsBulkUpdate.userErrors;
    if (ue.length) { errs += ue.length; console.log(JSON.stringify({ productId, ue })); }
  }
  console.log(JSON.stringify({ actualizadas: todo.length, erroresDeUsuario: errs }));
} else {
  console.log("uso: status | apply --grams N [--yes]");
  process.exit(2);
}
