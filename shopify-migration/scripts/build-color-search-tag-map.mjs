// 03D: mapa determinista de tags de búsqueda por color.
// Fuente única: import/shopify-products-03c.csv (columna del metafield
// custom.color ya importado en 03C). No inventa colores ni términos SEO:
// el tag es exactamente "color:" + custom.color.
// Uso: node shopify-migration/scripts/build-color-search-tag-map.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "import", "shopify-products-03c.csv");
const OUT = path.join(ROOT, "catalog", "color-search-tag-map.csv");

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1);
}
const esc = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const [header, ...data] = parseCsv(fs.readFileSync(SRC, "utf8").replace(/^﻿/, ""));
const col = (name) => {
  const i = header.indexOf(name);
  if (i < 0) throw new Error("columna faltante: " + name);
  return i;
};
const iHandle = col("URL handle");
const iTitle = col("Title");
const iColor = col("Color (product.metafields.custom.color)");
const iDesc = col("Description");
const iType = col("Type");

const byHandle = new Map();
for (const r of data) {
  const h = r[iHandle];
  if (!h) continue;
  const prev = byHandle.get(h) ?? { handle: h, title: "", color: "", desc: "", type: "" };
  if (r[iTitle]) prev.title = r[iTitle];
  if (r[iColor]) prev.color = r[iColor];
  if (r[iDesc]) prev.desc = r[iDesc];
  if (r[iType]) prev.type = r[iType];
  byHandle.set(h, prev);
}
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
const rows = [...byHandle.values()].sort((a, b) => a.handle.localeCompare(b.handle));
if (rows.length !== 29) throw new Error(`se esperaban 29 productos, hay ${rows.length}`);
const missing = rows.filter((r) => !r.color);
if (missing.length) throw new Error("productos sin custom.color: " + missing.map((r) => r.handle).join(", "));

// 03E (medido en la Dev Store): la búsqueda de Shopify indexa título, tipo y
// DESCRIPCIÓN (el parámetro fields del predictive se ignora) y los tags
// PLANOS. Los tags con prefijo "color:" no generan tokens buscables. Por eso
// el tag es el color plano y solo hace falta cuando ni el título, ni el tipo,
// ni la descripción contienen el color.
const text = (s) => norm(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
const out = ["handle,title,custom_color,title_contains_color,description_contains_color,search_tag_needed,search_tag,handle_color_differs"];
for (const r of rows) {
  const c = norm(r.color);
  const titleHas = text(r.title).includes(c) || text(r.type).includes(c);
  const descHas = text(r.desc).includes(c);
  const needed = !titleHas && !descHas;
  const handleHas = norm(r.handle.replace(/-/g, " ")).includes(c);
  out.push([r.handle, r.title, r.color, titleHas ? "SI" : "NO", descHas ? "SI" : "NO", needed ? "SI" : "NO", needed ? r.color : "", handleHas ? "NO" : "SI"].map(esc).join(","));
}
fs.writeFileSync(OUT, out.join("\n") + "\n");
const colors = [...new Set(rows.map((r) => r.color))].sort();
console.log(`${rows.length} productos, ${colors.length} colores: ${colors.join(", ")}`);
console.log(`título/tipo sin el color: ${rows.filter((r) => !(text(r.title).includes(norm(r.color)) || text(r.type).includes(norm(r.color)))).length}`);
console.log(`tag necesario (ni título, ni tipo, ni descripción): ${rows.filter((r) => !(text(r.title).includes(norm(r.color)) || text(r.type).includes(norm(r.color)) || text(r.desc).includes(norm(r.color)))).map((r) => r.handle + " -> " + r.color).join(", ") || "ninguno"}`);
console.log("escrito", path.relative(ROOT, OUT));
