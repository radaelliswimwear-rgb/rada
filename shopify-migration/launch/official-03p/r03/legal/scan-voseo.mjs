// Busca voseo (Dejá/recibí/Descubrí/agregá/Guardá/Recargá/Revisá/podés/consultá...) en archivos de texto del tema principal y en páginas. Solo lectura.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const THEME = "gid://shopify/OnlineStoreTheme/191904514347";
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "vos-"));
let n = 0;
function gql(query, variables) {
  const q = path.join(TMP, `q${++n}.graphql`), v = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(q, query); fs.writeFileSync(v, JSON.stringify(variables || {}));
  const r = spawnSync("shopify.cmd", ["store", "execute", "--store", STORE, "--query-file", q, "--variable-file", v, "--json", "--no-color"], { encoding: "utf8", shell: true, maxBuffer: 128 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error("gql fallo: " + ((r.stderr || "") + out).slice(0, 600));
  return JSON.parse(out.slice(i));
}
const RX = /(?<![\p{L}])(Dejá|recibí|Descubrí|agregá|Guardá|Recargá|Revisá|Podés|podés|tenés|ingresala|consultá|escribí|mirá|elegí|sumate|unite|apretá|querés|vos|Recomendado para vos|probá|buscá|seguí|volvé|entrá)(?![\p{L}])/giu;
const files = gql(`query($id: ID!) { theme(id: $id) { files(first: 250) { nodes { filename } } } }`, { id: THEME }).theme.files.nodes.map((f) => f.filename).filter((f) => /\.(liquid|json)$/.test(f));
const hits = [];
for (let i = 0; i < files.length; i += 20) {
  const chunk = files.slice(i, i + 20);
  const r = gql(`query($id: ID!, $f: [String!]) { theme(id: $id) { files(first: 20, filenames: $f) { nodes { filename body { ... on OnlineStoreThemeFileBodyText { content } } } } } }`, { id: THEME, f: chunk }).theme.files.nodes;
  for (const f of r) {
    const c = (f.body && f.body.content) || "";
    const m = [...c.matchAll(RX)];
    if (m.length) hits.push({ file: f.filename, n: m.length, ex: [...new Set(m.map((x) => c.slice(Math.max(0, x.index - 40), x.index + 70).replace(/\s+/g, " ")))].slice(0, 6) });
  }
}
const pages = gql(`query { pages(first: 50) { nodes { handle body } } }`).pages.nodes;
for (const p of pages) { const m = [...(p.body || "").matchAll(RX)]; if (m.length) hits.push({ file: "page:" + p.handle, n: m.length, ex: m.map((x) => p.body.slice(Math.max(0, x.index - 40), x.index + 70).replace(/\s+/g, " ")).slice(0, 4) }); }
console.log(JSON.stringify(hits, null, 1));
