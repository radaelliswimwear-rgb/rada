// Cierra el cupón de la venta de validación: lo DESACTIVA (no lo borra, para conservar el registro de uso) y reporta usos.
// Uso: node coupon-close.mjs [--order "#1003"]   (si se da --order, etiqueta el pedido con validacion-meta-envio-amiga)
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > -1 ? process.argv[i + 1] : d; };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "cpc-"));
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
const sec = JSON.parse(fs.readFileSync(path.join(DIR, "coupon-secret.json"), "utf8"));
const before = gql(`query($id: ID!) { codeDiscountNode(id: $id) { codeDiscount { ... on DiscountCodeBasic { title status asyncUsageCount usageLimit } } } }`, { id: sec.discountNodeId });
const d = gql(`mutation($id: ID!) { discountCodeDeactivate(id: $id) { codeDiscountNode { id codeDiscount { ... on DiscountCodeBasic { status endsAt } } } userErrors { field message } } }`, { id: sec.discountNodeId }, true);
console.log(JSON.stringify({ before: before.codeDiscountNode.codeDiscount, deactivated: d.discountCodeDeactivate }, null, 1));
const ord = arg("order");
if (ord) {
  const o = gql(`query($q: String!) { orders(first: 1, query: $q) { nodes { id name tags } } }`, { q: `name:${ord}` }).orders.nodes[0];
  if (!o) throw new Error("pedido no encontrado");
  const tags = Array.from(new Set([...(o.tags || []), "validacion-meta-envio-amiga", "excluir-baseline-pauta"]));
  const u = gql(`mutation($id: ID!, $tags: [String!]) { orderUpdate(input: {id: $id, tags: $tags}) { order { id name tags } userErrors { field message } } }`, { id: o.id, tags }, true);
  console.log(JSON.stringify(u.orderUpdate, null, 1));
}
