// Auditoria de SOLO LECTURA: apariciones del correo Gmail de la marca en superficies publicas/customer-facing (políticas, páginas, tema, traducciones).
// No imprime datos personales de clientes. Uso: node audit-email.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const THEME = "gid://shopify/OnlineStoreTheme/191904514347";
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "eml-"));
let n = 0;
function gql(query, variables) {
  const q = path.join(TMP, `q${++n}.graphql`), v = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(q, query); fs.writeFileSync(v, JSON.stringify(variables || {}));
  const r = spawnSync("shopify.cmd", ["store", "execute", "--store", STORE, "--query-file", q, "--variable-file", v, "--json", "--no-color"], { encoding: "utf8", shell: true, maxBuffer: 128 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error("gql fallo: " + ((r.stderr || "") + out).slice(0, 600));
  return JSON.parse(out.slice(i));
}
const RX = /radaelliswimwear@gmail\.com/gi;
const rows = [];
const add = (surface, where, count, note = "") => rows.push({ surface, where, count, note });
// 1) shop
const s = gql(`query { shop { name email contactEmail myshopifyDomain } }`).shop;
rows.push({ surface: "shop.email (cuenta/propietario/remitente)", where: "Admin > Configuración > General", count: /gmail/.test(s.email || "") ? 1 : 0, note: `shop.email=${/gmail\.com$/.test(s.email) ? "gmail (admin)" : s.email}; contactEmail=${/gmail\.com$/.test(s.contactEmail) ? "gmail" : s.contactEmail}` });
// 2) politicas
const pol = gql(`query { shop { shopPolicies { type body } } }`).shop.shopPolicies;
for (const p of pol) add("Politica nativa " + p.type, "/policies/*", (p.body.match(RX) || []).length);
// 3) paginas
const pg = gql(`query { pages(first: 50) { nodes { handle title body } } }`).pages.nodes;
for (const p of pg) add("Pagina /pages/" + p.handle, "/pages/" + p.handle, (p.body.match(RX) || []).length);
// 4) tema (archivos de texto)
const files = gql(`query($id: ID!) { theme(id: $id) { files(first: 250) { nodes { filename size } } } }`, { id: THEME }).theme.files.nodes;
const textFiles = files.filter((f) => /\.(liquid|json|js|css|txt)$/.test(f.filename)).map((f) => f.filename);
let themeHits = [];
for (let i = 0; i < textFiles.length; i += 20) {
  const chunk = textFiles.slice(i, i + 20);
  const r = gql(`query($id: ID!, $f: [String!]) { theme(id: $id) { files(first: 20, filenames: $f) { nodes { filename body { ... on OnlineStoreThemeFileBodyText { content } } } } } }`, { id: THEME, f: chunk }).theme.files.nodes;
  for (const f of r) { const c = (f.body && f.body.content) || ""; const m = (c.match(RX) || []).length; if (m) themeHits.push({ file: f.filename, count: m }); }
}
rows.push({ surface: "Tema RC1.10 (archivos de texto)", where: `${textFiles.length} archivos revisados`, count: themeHits.reduce((a, b) => a + b.count, 0), note: themeHits.map((h) => `${h.file}(${h.count})`).join(", ") });
// 5) traducciones es de politicas/paginas/tema no se leen aqui (ver scope read_translations): solo politicas
const out = { when: new Date().toISOString(), shop: { email: s.email ? "(oculto)" : null }, rows };
fs.writeFileSync(path.join(DIR, "audit-email-before.json"), JSON.stringify(out, null, 1));
for (const r of rows) console.log(`${String(r.count).padStart(3)}  ${r.surface}  [${r.where}] ${r.note}`);
