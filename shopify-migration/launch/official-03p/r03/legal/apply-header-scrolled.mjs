// Estado scrolled del menu a 100 % opaco. Reversion total: apply-header-solid.mjs --revert (usa revert-header-css.txt)
import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com", THEME = "gid://shopify/OnlineStoreTheme/191904514347"; const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "hc-")); let n = 0;
function gql(q, v, mut) { const a = path.join(TMP, `q${++n}.graphql`), b = path.join(TMP, `v${n}.json`); fs.writeFileSync(a, q); fs.writeFileSync(b, JSON.stringify(v || {})); const args = ["store", "execute", "--store", STORE, "--query-file", a, "--variable-file", b, "--json", "--no-color"]; if (mut) args.push("--allow-mutations"); const r = spawnSync("shopify.cmd", args, { encoding: "utf8", shell: true, maxBuffer: 256 * 1024 * 1024 }); const o = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); return JSON.parse(o.slice(o.indexOf("{"))); }
const F = "assets/section-header.css";
const css = gql(`query($id:ID!,$f:[String!]){theme(id:$id){files(first:1,filenames:$f){nodes{body{...on OnlineStoreThemeFileBodyText{content}}}}}}`, { id: THEME, f: [F] }).theme.files.nodes[0].body.content;
const i = css.indexOf(".site-header.is-scrolled"); const j = css.indexOf("}", i); const blk = css.slice(i, j);
console.log(blk);
const nb = blk.replace(/background-color:\s*[^;]+;/, "background-color: rgb(255 255 255 / 100%);");
if (nb === blk) throw new Error("sin cambios");
console.log(JSON.stringify(gql(`mutation($id:ID!,$files:[OnlineStoreThemeFilesUpsertFileInput!]!){themeFilesUpsert(themeId:$id,files:$files){upsertedThemeFiles{filename}userErrors{field message code}}}`, { id: THEME, files: [{ filename: F, body: { type: "TEXT", value: css.slice(0, i) + nb + css.slice(j) } }] }, true).themeFilesUpsert));
