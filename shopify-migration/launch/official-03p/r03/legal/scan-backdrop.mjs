// Busca backdrop-filter / blur en todo el tema y muestra el bloque CSS contenedor
import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com", THEME = "gid://shopify/OnlineStoreTheme/191904514347"; const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "bd-")); let n = 0;
function gql(q, v) { const a = path.join(TMP, `q${++n}.graphql`), b = path.join(TMP, `v${n}.json`); fs.writeFileSync(a, q); fs.writeFileSync(b, JSON.stringify(v || {})); const r = spawnSync("shopify.cmd", ["store", "execute", "--store", STORE, "--query-file", a, "--variable-file", b, "--json", "--no-color"], { encoding: "utf8", shell: true, maxBuffer: 256 * 1024 * 1024 }); const o = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); return JSON.parse(o.slice(o.indexOf("{"))); }
const names = gql(`query($id:ID!){theme(id:$id){files(first:250){nodes{filename}}}}`, { id: THEME }).theme.files.nodes.map((f) => f.filename).filter((f) => /\.(css|liquid)$/.test(f));
for (let i = 0; i < names.length; i += 15) {
  const r = gql(`query($id:ID!,$f:[String!]){theme(id:$id){files(first:15,filenames:$f){nodes{filename body{...on OnlineStoreThemeFileBodyText{content}}}}}}`, { id: THEME, f: names.slice(i, i + 15) }).theme.files.nodes;
  for (const f of r) {
    const t = (f.body && f.body.content) || ""; const re = /backdrop-filter|filter:\s*blur/g; let m; const seen = new Set();
    while ((m = re.exec(t))) { const s = t.lastIndexOf("{", m.index); const sel = t.slice(Math.max(0, t.lastIndexOf("}", s) + 1), s).trim().split("\n").pop(); const e = t.indexOf("}", m.index); const k = f.filename + sel; if (seen.has(k)) continue; seen.add(k); console.log("== " + f.filename + " :: " + sel + "\n" + t.slice(s, e + 1).replace(/\s+/g, " ")); }
  }
}
