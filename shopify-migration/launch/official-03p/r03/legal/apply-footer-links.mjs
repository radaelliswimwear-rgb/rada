// 03R legal: agrega al menu «Ayuda» (pie) el enlace a la SIC y «Preferencias de cookies». Respalda el menu anterior en revert-footer.json.
// Uso: node apply-footer-links.mjs --dry | node apply-footer-links.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const DRY = process.argv.includes("--dry");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "menu-"));
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
const cur = gql(`query { menus(first: 20) { nodes { id handle title items { id title type url resourceId tags items { id title type url resourceId tags } } } } }`);
const menu = cur.menus.nodes.find((m) => m.handle === "ayuda");
if (!menu) throw new Error("menu ayuda no encontrado");
fs.writeFileSync(path.join(DIR, "revert-footer.json"), JSON.stringify(menu, null, 1), "utf8");
const keep = (i) => {
  const o = { id: i.id, title: i.title, type: i.type, tags: i.tags || [] };
  if (i.resourceId) o.resourceId = i.resourceId; else if (i.url) o.url = i.url;
  if (i.items && i.items.length) o.items = i.items.map(keep);
  return o;
};
const items = menu.items.map(keep);
const hasSic = items.some((i) => /sic\.gov\.co/.test(i.url || ""));
const hasPrefs = items.some((i) => /shopifyReshowConsentBanner/.test(i.url || ""));
if (!hasSic) items.push({ title: "Superintendencia de Industria y Comercio (SIC)", type: "HTTP", url: "https://www.sic.gov.co/", tags: [] });
if (!hasPrefs) items.push({ title: "Preferencias de cookies", type: "HTTP", url: "https://radaelliswimwear.com/#shopifyReshowConsentBanner", tags: [] });
console.log(JSON.stringify({ dry: DRY, before: menu.items.length, after: items.length, add: { sic: !hasSic, prefs: !hasPrefs } }));
if (DRY) process.exit(0);
const r = gql(`mutation($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]!) { menuUpdate(id: $id, title: $title, items: $items) { menu { id handle items { id title type url resourceId } } userErrors { field message } } }`, { id: menu.id, title: menu.title, items }, true);
console.log(JSON.stringify({ errors: r.menuUpdate.userErrors, items: (r.menuUpdate.menu?.items || []).map((i) => ({ title: i.title, type: i.type, url: i.url })) }, null, 1));
