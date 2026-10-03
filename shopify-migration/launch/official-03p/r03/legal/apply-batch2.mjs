// 03R legal lote 2 (resolucion legal aprobada por ChatGPT 2026-10-03, `ai-handoff/legal-returns-policy-approved.md`; la duena pidio implementarla en el chat):
// REFUND_POLICY (politica nativa) <- refund-policy-approved.html; SHIPPING_POLICY + pagina envios; TERMS_OF_SERVICE + pagina terminos; pagina garantia <- garantia-page-approved.html.
// Respalda el texto anterior en revert-batch2.json y verifica por lectura (sha). Uso: node apply-batch2.mjs --dry | node apply-batch2.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const DRY = process.argv.includes("--dry");
const DATE = "3 de octubre de 2026";
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8").replace("[FECHA DE PUBLICACIÓN]", DATE).replace("2 de octubre de 2026", DATE);
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "leg2-"));
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
const JOBS = [
  { policy: "REFUND_POLICY", file: "refund-policy-approved.html" },
  { policy: "SHIPPING_POLICY", page: "envios", file: "shipping-policy.html" },
  { policy: "TERMS_OF_SERVICE", page: "terminos", file: "terms-of-service.html" },
  { page: "garantia", file: "garantia-page-approved.html" },
];
for (const j of JOBS) { j.body = read(j.file); if (/\[[A-ZÁÉÍÓÚÑ ]{4,}/.test(j.body)) throw new Error("marcador sin resolver en " + j.file); }
const cur = gql(`query { shop { shopPolicies { type body } } pages(first: 30) { nodes { id handle title body } } }`);
const pages = Object.fromEntries(cur.pages.nodes.map((p) => [p.handle, p]));
const revert = { when: new Date().toISOString(), policies: {}, pages: {} };
for (const j of JOBS) {
  if (j.policy) revert.policies[j.policy] = (cur.shop.shopPolicies.find((x) => x.type === j.policy) || {}).body ?? null;
  if (j.page) { const pg = pages[j.page]; if (!pg) throw new Error("no existe la pagina " + j.page); revert.pages[j.page] = { id: pg.id, title: pg.title, body: pg.body }; }
}
fs.writeFileSync(path.join(DIR, "revert-batch2.json"), JSON.stringify(revert, null, 1), "utf8");
console.log(JSON.stringify({ dry: DRY, plan: JOBS.map((j) => ({ policy: j.policy || null, page: j.page || null, newLen: j.body.length, oldPolicyLen: j.policy ? (revert.policies[j.policy] || "").length : null, oldPageLen: j.page ? pages[j.page].body.length : null })) }));
if (DRY) process.exit(0);
const out = {};
for (const j of JOBS) {
  if (j.policy) {
    const r = gql(`mutation($p: ShopPolicyInput!) { shopPolicyUpdate(shopPolicy: $p) { shopPolicy { type url } userErrors { field message } } }`, { p: { type: j.policy, body: j.body } }, true);
    out["policy_" + j.policy] = { ok: !!r.shopPolicyUpdate?.shopPolicy, errors: errs(r.shopPolicyUpdate) };
  }
  if (j.page) {
    const r2 = gql(`mutation($id: ID!, $p: PageUpdateInput!) { pageUpdate(id: $id, page: $p) { page { id handle } userErrors { field message } } }`, { id: pages[j.page].id, p: { body: j.body } }, true);
    out["page_" + j.page] = { ok: !!r2.pageUpdate?.page, errors: errs(r2.pageUpdate) };
  }
}
const rb = gql(`query { shop { shopPolicies { type body } } pages(first: 30) { nodes { handle body } } }`);
out.readBack = JOBS.map((j) => ({
  policy: j.policy || null, policyShaOk: j.policy ? sha((rb.shop.shopPolicies.find((x) => x.type === j.policy) || {}).body || "") === sha(j.body) : null,
  page: j.page || null, pageLenDiff: j.page ? ((rb.pages.nodes.find((x) => x.handle === j.page) || {}).body || "").length - j.body.length : null,
}));
console.log(JSON.stringify(out, null, 1));
