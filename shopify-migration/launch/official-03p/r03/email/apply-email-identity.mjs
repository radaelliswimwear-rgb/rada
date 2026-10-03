// Identidad de correo publico (ai-handoff/deferred-public-email-identity.md; aprobado por la duena en el chat 2026-10-03):
// todo lo visible a clientes usa info@radaelliswimwear.com; el Gmail queda solo como correo administrativo/propietario/recuperacion.
// Reemplaza el Gmail en las politicas nativas y paginas publicas; la politica de privacidad pasa de «Google (Gmail)» a «Hostinger (correo electronico)» como proveedor de correo.
// Respalda los cuerpos anteriores en revert-email.json. Uso: node apply-email-identity.mjs --dry | node apply-email-identity.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const DRY = process.argv.includes("--dry");
const NEW = "info@radaelliswimwear.com";
const has = (b) => /radaelliswimwear@gmail\.com/i.test(b);
const count = (b) => (b.match(/radaelliswimwear@gmail\.com/gi) || []).length;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "eid-"));
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
const errs = (p) => (p?.userErrors || []).map((e) => `${(e.field || []).join(".")} ${e.message}`);
const transform = (b) => b
  .replace("<strong>Google (Gmail)</strong>: el servicio de correo donde recibimos los mensajes que envías a", "<strong>Hostinger (correo electrónico)</strong>: el servicio de correo donde recibimos los mensajes que envías a")
  .replace(/radaelliswimwear@gmail\.com/gi, NEW);
const cur = gql(`query { shop { shopPolicies { type body } } pages(first: 50) { nodes { id handle title body } } }`);
const revert = { when: new Date().toISOString(), policies: {}, pages: {} };
const jobs = [];
for (const p of cur.shop.shopPolicies) { const t = transform(p.body); if (t !== p.body) { revert.policies[p.type] = p.body; jobs.push({ kind: "policy", type: p.type, body: t, hits: count(p.body) }); } }
for (const p of cur.pages.nodes) { const t = transform(p.body); if (t !== p.body) { revert.pages[p.handle] = { id: p.id, title: p.title, body: p.body }; jobs.push({ kind: "page", handle: p.handle, id: p.id, body: t, hits: count(p.body) }); } }
fs.writeFileSync(path.join(DIR, "revert-email.json"), JSON.stringify(revert, null, 1), "utf8");
console.log(JSON.stringify({ dry: DRY, jobs: jobs.map((j) => ({ kind: j.kind, name: j.type || j.handle, hits: j.hits })) }));
if (DRY) process.exit(0);
const out = {};
for (const j of jobs) {
  if (j.kind === "policy") {
    const r = gql(`mutation($p: ShopPolicyInput!) { shopPolicyUpdate(shopPolicy: $p) { shopPolicy { type } userErrors { field message } } }`, { p: { type: j.type, body: j.body } }, true);
    out["policy_" + j.type] = { ok: !!r.shopPolicyUpdate?.shopPolicy, errors: errs(r.shopPolicyUpdate) };
  } else {
    const r = gql(`mutation($id: ID!, $p: PageUpdateInput!) { pageUpdate(id: $id, page: $p) { page { handle } userErrors { field message } } }`, { id: j.id, p: { body: j.body } }, true);
    out["page_" + j.handle] = { ok: !!r.pageUpdate?.page, errors: errs(r.pageUpdate) };
  }
}
const rb = gql(`query { shop { shopPolicies { type body } } pages(first: 50) { nodes { handle body } } }`);
out.remainingGmail = [...rb.shop.shopPolicies.filter((p) => has(p.body)).map((p) => "policy:" + p.type), ...rb.pages.nodes.filter((p) => has(p.body)).map((p) => "page:" + p.handle)];
console.log(JSON.stringify(out, null, 1));
