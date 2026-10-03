// Espanol colombiano (pedido de la duena en el chat 2026-10-03): voseo restante, "Añadir"->"Agregar" (coherente con "Agregar a favoritos") y "talle alto"->"cintura alta" en descripciones de producto.
// Tema MAIN (todos los .liquid/.json/.js de texto) + productos. Respaldos: revert-co-theme.json, revert-co-products.json. Uso: node apply-co.mjs --dry | node apply-co.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const THEME = "gid://shopify/OnlineStoreTheme/191904514347";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const DRY = process.argv.includes("--dry");
const MAP = [
  ["Activá", "Activa"], ["Ingresá", "Ingresa"], ["Intentá", "Intenta"], ["intentá", "intenta"], ["Elegí", "Elige"], ["elegí", "elige"],
  ["Ingresa acá", "Ingresa aquí"],
  ["Añadir al carrito", "Agregar al carrito"], ["Añadiendo…", "Agregando…"], ["añadir el producto", "agregar el producto"],
];
const PRODUCT_MAP = [["talle alto", "cintura alta"], ["Talle alto", "Cintura alta"]];
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "co2-"));
let n = 0;
function gql(query, variables, mutation) {
  const q = path.join(TMP, `q${++n}.graphql`), v = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(q, query); fs.writeFileSync(v, JSON.stringify(variables || {}));
  const a = ["store", "execute", "--store", STORE, "--query-file", q, "--variable-file", v, "--json", "--no-color"];
  if (mutation) a.push("--allow-mutations");
  const r = spawnSync("shopify.cmd", a, { encoding: "utf8", shell: true, maxBuffer: 256 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error("gql fallo: " + ((r.stderr || "") + out).slice(0, 800));
  return JSON.parse(out.slice(i));
}
const apply = (text, map) => { let t = text; const ch = []; for (const [a, b] of map) { const parts = t.split(a); if (parts.length > 1) { ch.push(`${a}->${b} x${parts.length - 1}`); t = parts.join(b); } } return { t, ch }; };
// tema
const th = gql(`query($id: ID!) { theme(id: $id) { role files(first: 250) { nodes { filename } } } }`, { id: THEME }).theme;
if (th.role !== "MAIN") throw new Error("tema no MAIN");
const names = th.files.nodes.map((f) => f.filename).filter((f) => /\.(liquid|json|js)$/.test(f));
const revertTheme = {}, upserts = [], report = [];
for (let i = 0; i < names.length; i += 15) {
  const r = gql(`query($id: ID!, $f: [String!]) { theme(id: $id) { files(first: 15, filenames: $f) { nodes { filename body { ... on OnlineStoreThemeFileBodyText { content } } } } } }`, { id: THEME, f: names.slice(i, i + 15) }).theme.files.nodes;
  for (const f of r) {
    const old = (f.body && f.body.content) || ""; const { t, ch } = apply(old, MAP);
    if (t === old) continue;
    if (/\.json$/.test(f.filename)) JSON.parse(t.replace(/^\s*\/\*[\s\S]*?\*\//, ""));
    revertTheme[f.filename] = old; upserts.push({ filename: f.filename, body: { type: "TEXT", value: t } }); report.push({ file: f.filename, changes: ch });
  }
}
// productos
const revertProd = {}, prodUpdates = [];
let after = null;
for (;;) {
  const r = gql(`query($a: String) { products(first: 50, after: $a) { pageInfo { hasNextPage endCursor } nodes { id handle descriptionHtml } } }`, { a: after }).products;
  for (const p of r.nodes) { const { t, ch } = apply(p.descriptionHtml || "", PRODUCT_MAP); if (t !== p.descriptionHtml) { revertProd[p.handle] = { id: p.id, descriptionHtml: p.descriptionHtml }; prodUpdates.push({ id: p.id, handle: p.handle, html: t }); report.push({ file: "producto:" + p.handle, changes: ch }); } }
  if (!r.pageInfo.hasNextPage) break; after = r.pageInfo.endCursor;
}
fs.writeFileSync(path.join(DIR, "revert-co-theme.json"), JSON.stringify(revertTheme, null, 1), "utf8");
fs.writeFileSync(path.join(DIR, "revert-co-products.json"), JSON.stringify(revertProd, null, 1), "utf8");
console.log(JSON.stringify({ dry: DRY, archivosTema: upserts.length, productos: prodUpdates.length, report }, null, 1));
if (DRY) process.exit(0);
if (upserts.length) { const r = gql(`mutation($id: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) { themeFilesUpsert(themeId: $id, files: $files) { upsertedThemeFiles { filename } userErrors { field message code } } }`, { id: THEME, files: upserts }, true); console.log("tema:", JSON.stringify(r.themeFilesUpsert.userErrors)); }
for (const p of prodUpdates) { const r = gql(`mutation($p: ProductUpdateInput!) { productUpdate(product: $p) { product { handle } userErrors { field message } } }`, { p: { id: p.id, descriptionHtml: p.html } }, true); console.log("producto", p.handle, JSON.stringify(r.productUpdate.userErrors)); }
