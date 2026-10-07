// Menu superior opaco (sin transparencia ni desenfoque), pedido de la duena 2026-10-07. Reversion: --revert (restaura revert-header-css.txt)
import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com", THEME = "gid://shopify/OnlineStoreTheme/191904514347"; const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "hs-")); let n = 0;
function gql(q, v, mut) { const a = path.join(TMP, `q${++n}.graphql`), b = path.join(TMP, `v${n}.json`); fs.writeFileSync(a, q); fs.writeFileSync(b, JSON.stringify(v || {})); const args = ["store", "execute", "--store", STORE, "--query-file", a, "--variable-file", b, "--json", "--no-color"]; if (mut) args.push("--allow-mutations"); const r = spawnSync("shopify.cmd", args, { encoding: "utf8", shell: true, maxBuffer: 256 * 1024 * 1024 }); const o = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); return JSON.parse(o.slice(o.indexOf("{"))); }
const F = "assets/section-header.css";
const cur = gql(`query($id:ID!,$f:[String!]){theme(id:$id){role files(first:1,filenames:$f){nodes{body{...on OnlineStoreThemeFileBodyText{content}}}}}}`, { id: THEME, f: [F] }).theme;
if (cur.role !== "MAIN") throw new Error("no MAIN");
let css = cur.files.nodes[0].body.content; let out;
if (process.argv.includes("--revert")) { out = fs.readFileSync("revert-header-css.txt", "utf8"); }
else {
  fs.writeFileSync("revert-header-css.txt", css, "utf8");
  const a = "background-color: rgb(255 255 255 / 70%);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);";
  if (!css.includes(a)) throw new Error("bloque del header distinto");
  out = css.replace(a, "background-color: rgb(255 255 255 / 100%);");
  const others = out.split("\n").filter((l) => /\.site-header[^{]*\{/.test(l) || /backdrop-filter/.test(l)); console.log(others.join("\n"));
}
console.log(JSON.stringify(gql(`mutation($id:ID!,$files:[OnlineStoreThemeFilesUpsertFileInput!]!){themeFilesUpsert(themeId:$id,files:$files){upsertedThemeFiles{filename}userErrors{field message code}}}`, { id: THEME, files: [{ filename: F, body: { type: "TEXT", value: out } }] }, true).themeFilesUpsert));
