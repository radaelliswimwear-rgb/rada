// 03R legal: alinea el texto del acordeon «Envios, devoluciones y garantia» de las fichas con la politica aprobada (solo cambia el valor "content" en templates/product.json).
// Respalda el archivo original en revert-theme-product.json. Uso: node apply-pdp-text.mjs --dry | node apply-pdp-text.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const THEME = "gid://shopify/OnlineStoreTheme/191904514347";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const DRY = process.argv.includes("--dry");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "pdp-"));
let n = 0;
function gql(query, variables, mutation) {
  const q = path.join(TMP, `q${++n}.graphql`), v = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(q, query); fs.writeFileSync(v, JSON.stringify(variables || {}));
  const a = ["store", "execute", "--store", STORE, "--query-file", q, "--variable-file", v, "--json", "--no-color"];
  if (mutation) a.push("--allow-mutations");
  const r = spawnSync("shopify.cmd", a, { encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error("gql fallo: " + ((r.stderr || "") + out).slice(0, 800));
  return JSON.parse(out.slice(i));
}
const cur = gql(`query($id: ID!) { theme(id: $id) { name role files(first: 5, filenames: ["templates/product.json"]) { nodes { filename body { ... on OnlineStoreThemeFileBodyText { content } } } } } }`, { id: THEME });
if (cur.theme.role !== "MAIN") throw new Error("el tema ya no es MAIN: " + cur.theme.role);
const orig = cur.theme.files.nodes[0].body.content;
fs.writeFileSync(path.join(DIR, "revert-theme-product.json"), JSON.stringify({ theme: cur.theme.name, filename: "templates/product.json", content: orig }, null, 1), "utf8");
const OLD = "Garantía de 12 meses por defectos de fabricación o calidad.";
const NEW = "Garantía legal de un (1) año por defectos de fabricación o calidad. Cambio voluntario por talla o color dentro de 15 días calendario y derecho de retracto cuando legalmente proceda: consulta la Política de devoluciones.";
if (!orig.includes(OLD)) { console.log(JSON.stringify({ skip: "texto original no encontrado (ya cambiado?)" })); process.exit(0); }
const next = orig.replace(OLD, NEW);
JSON.parse(next.replace(/^\s*\/\*[\s\S]*?\*\//, "")); // valida (los JSON de plantilla traen un comentario inicial)
console.log(JSON.stringify({ dry: DRY, oldLen: orig.length, newLen: next.length }));
if (DRY) process.exit(0);
const r = gql(`mutation($id: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) { themeFilesUpsert(themeId: $id, files: $files) { upsertedThemeFiles { filename } userErrors { field message code } } }`, { id: THEME, files: [{ filename: "templates/product.json", body: { type: "TEXT", value: next } }] }, true);
console.log(JSON.stringify(r.themeFilesUpsert, null, 1));
