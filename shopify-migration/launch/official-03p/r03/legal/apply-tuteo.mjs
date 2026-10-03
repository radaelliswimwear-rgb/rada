// Voseo -> tuteo en el tema principal (aprobado por la duena en el chat 2026-10-03: "Si, deja tu correo me gusta").
// Archivos: locales/es.default.json, sections/newsletter-home.liquid, sections/recommended-products.liquid, config/settings_schema.json.
// Respalda en revert-tuteo.json. Uso: node apply-tuteo.mjs --dry | node apply-tuteo.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const THEME = "gid://shopify/OnlineStoreTheme/191904514347";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const DRY = process.argv.includes("--dry");
const FILES = ["locales/es.default.json", "sections/newsletter-home.liquid", "sections/recommended-products.liquid", "config/settings_schema.json"];
const MAP = [
  ["Dejá", "Deja"], ["recibí", "recibe"], ["Descubrí", "Descubre"], ["agregá", "agrega"], ["Guardá", "Guarda"], ["Recargá", "Recarga"],
  ["Revisá", "Revisa"], ["Podés", "Puedes"], ["podés", "puedes"], ["tenés", "tienes"], ["ingresala", "ingrésala"], ["consultá", "consulta"],
  ["Escribí", "Escribe"], ["escribí", "escribe"], ["Probá", "Prueba"], ["probá", "prueba"], ["buscá", "busca"], ["Buscá", "Busca"],
  ["seguí", "sigue"], ["volvé", "vuelve"], ["entrá", "entra"], ["elegí", "elige"], ["mirá", "mira"], ["querés", "quieres"],
  ["Recomendado para vos", "Recomendado para ti"], ["que vos elijas", "que tú elijas"],
];
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "tut-"));
let n = 0;
function gql(query, variables, mutation) {
  const q = path.join(TMP, `q${++n}.graphql`), v = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(q, query); fs.writeFileSync(v, JSON.stringify(variables || {}));
  const a = ["store", "execute", "--store", STORE, "--query-file", q, "--variable-file", v, "--json", "--no-color"];
  if (mutation) a.push("--allow-mutations");
  const r = spawnSync("shopify.cmd", a, { encoding: "utf8", shell: true, maxBuffer: 128 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error("gql fallo: " + ((r.stderr || "") + out).slice(0, 800));
  return JSON.parse(out.slice(i));
}
const cur = gql(`query($id: ID!, $f: [String!]) { theme(id: $id) { name role files(first: 10, filenames: $f) { nodes { filename body { ... on OnlineStoreThemeFileBodyText { content } } } } } }`, { id: THEME, f: FILES });
if (cur.theme.role !== "MAIN") throw new Error("el tema ya no es MAIN");
const revert = {}; const upserts = []; const report = [];
for (const f of cur.theme.files.nodes) {
  const old = f.body.content; revert[f.filename] = old;
  let next = old; const changes = [];
  for (const [a, b] of MAP) {
    const rx = new RegExp("(?<![\\p{L}])" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\p{L}])", "gu");
    next = next.replace(rx, (m, off) => { changes.push(`${old.slice(Math.max(0, off - 25), off).replace(/\s+/g, " ")}[${a}->${b}]`); return b; });
  }
  if (next === old) continue;
  if (/\.json$/.test(f.filename)) JSON.parse(next.replace(/^\s*\/\*[\s\S]*?\*\//, ""));
  upserts.push({ filename: f.filename, body: { type: "TEXT", value: next } });
  report.push({ file: f.filename, n: changes.length, changes: changes.slice(0, 20) });
}
fs.writeFileSync(path.join(DIR, "revert-tuteo.json"), JSON.stringify(revert, null, 1), "utf8");
console.log(JSON.stringify({ dry: DRY, report }, null, 1));
if (DRY || !upserts.length) process.exit(0);
const r = gql(`mutation($id: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) { themeFilesUpsert(themeId: $id, files: $files) { upsertedThemeFiles { filename } userErrors { field message code } } }`, { id: THEME, files: upserts }, true);
console.log(JSON.stringify(r.themeFilesUpsert, null, 1));
