// Lista palabras terminadas en á/é/í (+ clíticos) en todo el contenido del tema/productos/paginas/politicas, excluyendo vocabulario normal. Para detectar voseo que una lista fija no cubre.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const THEME = "gid://shopify/OnlineStoreTheme/191904514347";
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "acc-"));
let n = 0;
function gql(query, variables) {
  const q = path.join(TMP, `q${++n}.graphql`), v = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(q, query); fs.writeFileSync(v, JSON.stringify(variables || {}));
  const r = spawnSync("shopify.cmd", ["store", "execute", "--store", STORE, "--query-file", q, "--variable-file", v, "--json", "--no-color"], { encoding: "utf8", shell: true, maxBuffer: 256 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error("gql fallo: " + ((r.stderr || "") + out).slice(0, 500));
  return JSON.parse(out.slice(i));
}
const OK = new Set("está será estará podrá tendrá habrá aquí allí ahí así sí también café sofá mamá papá qué cuál quién cómo dónde cuándo está llegará tiene aquí allá acá verá hará dirá irá vendrá saldrá pondrá cumplirá mantendrá aplicará recibirá enviará cubrirá será estaré estaré podré permití permitió ofrecí dejé encontré quedé pagué envié pagué compré recibí sé fe pie té canapé bebé rapé mercé".split(" ").map((x) => x.toLowerCase()));
const rx = /(?<![\p{L}])([\p{L}]{3,}(?:á|é|í)(?:la|lo|las|los|me|te|se|nos)?)(?![\p{L}])/giu;
const found = new Map();
const add = (where, text) => { if (!text) return; const plain = text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " "); for (const m of plain.matchAll(rx)) { const w = m[1]; if (OK.has(w.toLowerCase())) continue; const k = w; if (!found.has(k)) found.set(k, []); const arr = found.get(k); if (arr.length < 2) arr.push(where + ": …" + plain.slice(Math.max(0, m.index - 35), m.index + 55).replace(/\s+/g, " ") + "…"); } };
const files = gql(`query($id: ID!) { theme(id: $id) { files(first: 250) { nodes { filename } } } }`, { id: THEME }).theme.files.nodes.map((f) => f.filename).filter((f) => /\.(liquid|json|js)$/.test(f));
for (let i = 0; i < files.length; i += 15) {
  const r = gql(`query($id: ID!, $f: [String!]) { theme(id: $id) { files(first: 15, filenames: $f) { nodes { filename body { ... on OnlineStoreThemeFileBodyText { content } } } } } }`, { id: THEME, f: files.slice(i, i + 15) }).theme.files.nodes;
  for (const f of r) add("tema:" + f.filename, (f.body && f.body.content) || "");
}
let after = null;
for (;;) { const r = gql(`query($a: String) { products(first: 50, after: $a) { pageInfo { hasNextPage endCursor } nodes { handle title descriptionHtml } } }`, { a: after }).products; for (const p of r.nodes) add("producto:" + p.handle, p.title + " " + p.descriptionHtml); if (!r.pageInfo.hasNextPage) break; after = r.pageInfo.endCursor; }
const c = gql(`query { collections(first: 50) { nodes { handle descriptionHtml } } pages(first: 50) { nodes { handle body } } shop { shopPolicies { type body } } }`);
for (const x of c.collections.nodes) add("coleccion:" + x.handle, x.descriptionHtml);
for (const x of c.pages.nodes) add("pagina:" + x.handle, x.body);
for (const x of c.shop.shopPolicies) add("politica:" + x.type, x.body);
const out = [...found.entries()].sort((a, b) => a[0].localeCompare(b[0], "es")).map(([w, ex]) => `${w}  ->  ${ex[0]}`);
console.log(out.length + " palabras\n" + out.join("\n"));
