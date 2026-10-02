// 03R Lane F - publica politica de privacidad (pagina + politica nativa) y politica de cookies (pagina). Respaldo previo en backup-before-2026-10-02.json
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const priv = fs.readFileSync(path.join(DIR, "privacy-policy.html"), "utf8");
const cook = fs.readFileSync(path.join(DIR, "cookie-policy.html"), "utf8");
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "pol-"));
let n = 0;
function gql(query, variables, mutation) {
  const q = path.join(TMP, `q${++n}.graphql`), v = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(q, query); fs.writeFileSync(v, JSON.stringify(variables || {}));
  const a = ["store", "execute", "--store", STORE, "--query-file", q, "--variable-file", v, "--json", "--no-color"];
  if (mutation) a.push("--allow-mutations");
  const r = spawnSync("shopify.cmd", a, { encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error("gql fallo: " + ((r.stderr || "") + out).slice(0, 600));
  return JSON.parse(out.slice(i));
}
const errs = (p) => (p?.userErrors || []).map((e) => `${(e.field || []).join(".")} ${e.message}`);
const out = {};
let r = gql(`mutation($p: ShopPolicyInput!) { shopPolicyUpdate(shopPolicy: $p) { shopPolicy { type url } userErrors { field message } } }`, { p: { type: "PRIVACY_POLICY", body: priv } }, true);
out.policy = { ok: !!r.shopPolicyUpdate?.shopPolicy, errors: errs(r.shopPolicyUpdate) };
const P = `mutation($id: ID!, $p: PageUpdateInput!) { pageUpdate(id: $id, page: $p) { page { id handle } userErrors { field message } } }`;
r = gql(P, { id: "gid://shopify/Page/178263228715", p: { title: "Política de privacidad y tratamiento de datos personales", body: priv } }, true);
out.pagePrivacidad = { ok: !!r.pageUpdate?.page, errors: errs(r.pageUpdate) };
r = gql(P, { id: "gid://shopify/Page/178263327019", p: { title: "Política de cookies", body: cook } }, true);
out.pageCookies = { ok: !!r.pageUpdate?.page, errors: errs(r.pageUpdate) };
const rb = gql(`query { shop { shopPolicies { type body } } pages(first: 30, query: "handle:privacidad OR handle:cookies") { nodes { handle title body } } }`);
out.readBack = {
  policyPrivacy: { len: (rb.shop.shopPolicies.find((x) => x.type === "PRIVACY_POLICY") || {}).body?.length, sha: sha((rb.shop.shopPolicies.find((x) => x.type === "PRIVACY_POLICY") || {}).body || ""), expectedSha: sha(priv) },
  pages: rb.pages.nodes.map((p) => ({ handle: p.handle, title: p.title, len: p.body.length, sha: sha(p.body), expectedSha: sha(p.handle === "cookies" ? cook : priv) })),
};
console.log(JSON.stringify(out, null, 1));
