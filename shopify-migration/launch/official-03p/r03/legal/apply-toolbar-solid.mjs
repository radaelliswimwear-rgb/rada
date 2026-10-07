// Barra de la coleccion (.collection-toolbar) opaca, sin desenfoque y pegada arriba (top 0). Pedido de la duena 2026-10-07. Reversion: --revert (revert-toolbar-css.txt)
import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com", THEME = "gid://shopify/OnlineStoreTheme/191904514347"; const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "tb-")); let n = 0;
function gql(q, v, mut) { const a = path.join(TMP, `q${++n}.graphql`), b = path.join(TMP, `v${n}.json`); fs.writeFileSync(a, q); fs.writeFileSync(b, JSON.stringify(v || {})); const args = ["store", "execute", "--store", STORE, "--query-file", a, "--variable-file", b, "--json", "--no-color"]; if (mut) args.push("--allow-mutations"); const r = spawnSync("shopify.cmd", args, { encoding: "utf8", shell: true, maxBuffer: 256 * 1024 * 1024 }); const o = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); return JSON.parse(o.slice(o.indexOf("{"))); }
const F = "assets/section-collection.css";
const cur = gql(`query($id:ID!,$f:[String!]){theme(id:$id){role files(first:1,filenames:$f){nodes{body{...on OnlineStoreThemeFileBodyText{content}}}}}}`, { id: THEME, f: [F] }).theme;
if (cur.role !== "MAIN") throw new Error("no MAIN");
const css = cur.files.nodes[0].body.content; let out;
if (process.argv.includes("--revert")) out = fs.readFileSync("revert-toolbar-css.txt", "utf8");
else {
  fs.writeFileSync("revert-toolbar-css.txt", css, "utf8");
  const i = css.indexOf(".collection-toolbar {"); const j = css.indexOf("}", i); let blk = css.slice(i, j);
  if (!/backdrop-filter: blur\(8px\);/.test(blk) || !/rgb\(255 255 255 \/ 90%\)/.test(blk)) throw new Error("bloque distinto");
  blk = blk.replace(/\s*backdrop-filter: blur\(8px\);/, "").replace("rgb(255 255 255 / 90%)", "#ffffff").replace(/top:\s*4rem;[^\n]*/, "top: 0;");
  out = css.slice(0, i) + blk + css.slice(j); console.log(blk);
}
console.log(JSON.stringify(gql(`mutation($id:ID!,$files:[OnlineStoreThemeFilesUpsertFileInput!]!){themeFilesUpsert(themeId:$id,files:$files){upsertedThemeFiles{filename}userErrors{field message code}}}`, { id: THEME, files: [{ filename: F, body: { type: "TEXT", value: out } }] }, true).themeFilesUpsert));
