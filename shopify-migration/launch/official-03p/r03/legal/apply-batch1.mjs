// 03R legal batch 1 (aprobado por la duena en el chat 2026-10-02): Envios + Terminos + Contacto/PQR.
// Actualiza la politica nativa (SHIPPING_POLICY, TERMS_OF_SERVICE, CONTACT_INFORMATION) y la pagina equivalente (envios, terminos, contact).
// Guarda el texto anterior en revert-batch1.json (para revertir) y verifica por lectura que el cuerpo guardado es identico (sha).
// Uso: node apply-batch1.mjs --dry   (solo muestra el plan)   |   node apply-batch1.mjs   (aplica)
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const DRY = process.argv.includes("--dry");
const DATE = "2 de octubre de 2026";
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8").replace("[FECHA DE PUBLICACIÓN]", DATE);
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "leg-"));
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
const NEW = {
  SHIPPING_POLICY: read("shipping-policy.html"),
  TERMS_OF_SERVICE: read("terms-of-service.html"),
  CONTACT_INFORMATION: read("contact-information.html"),
};
const PAGE_OF = { SHIPPING_POLICY: "envios", TERMS_OF_SERVICE: "terminos", CONTACT_INFORMATION: "contact" };
for (const [k, v] of Object.entries(NEW)) if (/\[[A-ZÁÉÍÓÚÑ ]{4,}/.test(v)) throw new Error("marcador sin resolver en " + k);

const cur = gql(`query { shop { shopPolicies { type body } } pages(first: 30) { nodes { id handle title body } } }`);
const pages = Object.fromEntries(cur.pages.nodes.map((p) => [p.handle, p]));
const revert = { when: new Date().toISOString(), policies: {}, pages: {} };
for (const t of Object.keys(NEW)) {
  revert.policies[t] = (cur.shop.shopPolicies.find((x) => x.type === t) || {}).body ?? null;
  const pg = pages[PAGE_OF[t]]; if (!pg) throw new Error("no existe la pagina " + PAGE_OF[t]);
  revert.pages[PAGE_OF[t]] = { id: pg.id, title: pg.title, body: pg.body };
}
fs.writeFileSync(path.join(DIR, "revert-batch1.json"), JSON.stringify(revert, null, 1), "utf8");
const plan = Object.keys(NEW).map((t) => ({ policy: t, oldLen: (revert.policies[t] || "").length, newLen: NEW[t].length, page: PAGE_OF[t], pageId: pages[PAGE_OF[t]].id, pageOldLen: pages[PAGE_OF[t]].body.length }));
console.log(JSON.stringify({ dry: DRY, plan }, null, 1));
if (DRY) process.exit(0);

const out = {};
for (const t of Object.keys(NEW)) {
  const r = gql(`mutation($p: ShopPolicyInput!) { shopPolicyUpdate(shopPolicy: $p) { shopPolicy { type url } userErrors { field message } } }`, { p: { type: t, body: NEW[t] } }, true);
  out["policy_" + t] = { ok: !!r.shopPolicyUpdate?.shopPolicy, errors: errs(r.shopPolicyUpdate) };
  const pg = pages[PAGE_OF[t]];
  const r2 = gql(`mutation($id: ID!, $p: PageUpdateInput!) { pageUpdate(id: $id, page: $p) { page { id handle } userErrors { field message } } }`, { id: pg.id, p: { body: NEW[t] } }, true);
  out["page_" + PAGE_OF[t]] = { ok: !!r2.pageUpdate?.page, errors: errs(r2.pageUpdate) };
}
const rb = gql(`query { shop { shopPolicies { type body } } pages(first: 30) { nodes { handle body } } }`);
out.readBack = Object.keys(NEW).map((t) => {
  const pol = (rb.shop.shopPolicies.find((x) => x.type === t) || {}).body || "";
  const pg = (rb.pages.nodes.find((x) => x.handle === PAGE_OF[t]) || {}).body || "";
  return { policy: t, policyLen: pol.length, policyShaOk: sha(pol) === sha(NEW[t]), page: PAGE_OF[t], pageLen: pg.length, pageShaOk: sha(pg) === sha(NEW[t]) };
});
console.log(JSON.stringify(out, null, 1));
