// Cupón PRIVADO de un solo uso para la venta real de validación (ai-handoff/owner-live-window-coupon-sale.md).
// Deja el SUBTOTAL del producto elegido en exactamente COP 55.000 antes del envío, sin cambiar el precio público.
// Uso:  node coupon-create.mjs --variant <gid://shopify/ProductVariant/ID | SKU> [--target 55000] [--dry]
// Solo crea el descuento (código no predecible, 1 uso global, 1 uso por cliente, no combinable, limitado a esa variante).
// El código se guarda SOLO en coupon-secret.json local (NO se sube a GitHub); en el handoff solo va un hash.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes("--dry");
const TARGET = Number(arg("target", "55000"));
const VAR = arg("variant");
if (!VAR) throw new Error("falta --variant");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "cpn-"));
let n = 0;
function gql(query, variables, mutation) {
  const q = path.join(TMP, `q${++n}.graphql`), v = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(q, query); fs.writeFileSync(v, JSON.stringify(variables || {}));
  const a = ["store", "execute", "--store", STORE, "--query-file", q, "--variable-file", v, "--json", "--no-color"];
  if (mutation) a.push("--allow-mutations");
  const r = spawnSync("shopify.cmd", a, { encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error("gql fallo: " + ((r.stderr || "") + out).slice(0, 800));
  return JSON.parse(out.slice(i));
}
// 1) localizar la variante (por gid o por SKU)
let v;
if (VAR.startsWith("gid://")) {
  v = gql(`query($id: ID!) { productVariant(id: $id) { id sku title price inventoryQuantity product { id title status } } }`, { id: VAR }).productVariant;
} else {
  const r = gql(`query($q: String!) { productVariants(first: 3, query: $q) { nodes { id sku title price inventoryQuantity product { id title status } } } }`, { q: `sku:${VAR}` });
  if (r.productVariants.nodes.length !== 1) throw new Error("SKU ambiguo o inexistente: " + r.productVariants.nodes.length);
  v = r.productVariants.nodes[0];
}
if (!v) throw new Error("variante no encontrada");
const price = Number(v.price);
const off = price - TARGET;
if (!(off > 0)) throw new Error(`el precio (${price}) no es mayor que el objetivo (${TARGET})`);
if (v.product.status !== "ACTIVE") throw new Error("el producto no esta ACTIVO");
const code = "RS" + crypto.randomBytes(6).toString("base64url").replace(/[-_]/g, "x").toUpperCase().slice(0, 8);
const plan = { variant: v.id, sku: v.sku, product: v.product.title, size: v.title, price, stock: v.inventoryQuantity, target: TARGET, discountAmount: off, usageLimit: 1, appliesOncePerCustomer: true, combinesWith: "ninguno", codeHash: crypto.createHash("sha256").update(code).digest("hex").slice(0, 12) };
console.log(JSON.stringify({ dry: DRY, plan }, null, 1));
if (DRY) process.exit(0);
const input = {
  title: `Validacion Meta/envio amiga ${new Date().toISOString().slice(0, 10)} (1 uso)`,
  code,
  startsAt: new Date().toISOString(),
  usageLimit: 1,
  appliesOncePerCustomer: true,
  combinesWith: { productDiscounts: false, orderDiscounts: false, shippingDiscounts: false },
  customerSelection: { all: true },
  customerGets: {
    value: { discountAmount: { amount: String(off), appliesOnEachItem: false } },
    items: { products: { productVariantsToAdd: [v.id] } },
  },
};
const r = gql(`mutation($d: DiscountCodeBasicInput!) { discountCodeBasicCreate(basicCodeDiscount: $d) { codeDiscountNode { id codeDiscount { ... on DiscountCodeBasic { title status usageLimit codes(first: 1) { nodes { code } } } } } userErrors { field message code } } }`, { d: input }, true);
const res = r.discountCodeBasicCreate;
if (res.userErrors && res.userErrors.length) { console.log(JSON.stringify(res.userErrors)); process.exit(1); }
fs.writeFileSync(path.join(DIR, "coupon-secret.json"), JSON.stringify({ code, discountNodeId: res.codeDiscountNode.id, variant: v.id, sku: v.sku, price, target: TARGET, discountAmount: off, createdAt: new Date().toISOString() }, null, 1));
console.log(JSON.stringify({ created: true, discountNodeId: res.codeDiscountNode.id, status: res.codeDiscountNode.codeDiscount.status, codeHash: plan.codeHash, note: "el codigo esta en coupon-secret.json (local); entregarlo a la duena por el chat" }, null, 1));
