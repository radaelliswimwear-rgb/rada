#!/usr/bin/env node
/**
 * Fase 03C -- CSV de productos para el importador oficial de Shopify
 * (Admin > Productos > Importar), generado SOLO desde las fuentes de la
 * Fase 01 (sin memoria, sin datos inventados):
 *
 *   catalog/products-master.csv   producto (handle, título, color, precio...)
 *   catalog/variants-master.csv   tallas + SKU de variante
 *   images/images-manifest.csv    URLs reales de imagen y su orden
 *
 *   node shopify-migration/scripts/build-shopify-product-csv.mjs
 *
 * Salidas (deterministas, mismo input => mismos bytes):
 *   import/shopify-products-03c.csv        el CSV a importar
 *   import/color-mapping.csv               color fuente -> custom.color
 *   catalog/shopify-handle-mapping.csv     URL/handle actual -> handle Shopify
 *   import/checksums.txt                   SHA-256 de entradas y salidas
 *
 * Reglas (ver import/README.md y theme/03C-catalog-import-report.md):
 * - Precio = calculated_sale_price (lo que cobra hoy el sitio); compare-at =
 *   price_cop (el precio de lista que hoy se ve tachado). Sin descuento
 *   automático: el -20% ya queda expresado por compare-at.
 * - Inventario NO rastreado (no hay snapshot de cantidades en la Fase 01):
 *   "Inventory tracker" vacío. Nunca se inventan existencias.
 * - Handle = slug de la fuente en minúsculas (los handles de Shopify son
 *   minúsculas); cualquier cambio queda en shopify-handle-mapping.csv.
 * - SKU y talla se preservan exactos (incluido "L y XL").
 * - custom.color = color de la fuente en MAYÚSCULAS (27/29 ya lo están; se
 *   unifica "Azul"/"AZUL"). No se fusionan nombres comerciales distintos.
 * - Descripción: texto plano de la fuente -> HTML (<p> + <ul> para "•"),
 *   sin agregar ni quitar palabras.
 * - SEO title/description vacíos: en la fuente son los valores efectivos
 *   (= nombre / = descripción), que Shopify ya usa por defecto.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = {
  products: path.join(ROOT, "catalog/products-master.csv"),
  variants: path.join(ROOT, "catalog/variants-master.csv"),
  images: path.join(ROOT, "images/images-manifest.csv"),
};
const OUT = {
  csv: path.join(ROOT, "import/shopify-products-03c.csv"),
  colors: path.join(ROOT, "import/color-mapping.csv"),
  handles: path.join(ROOT, "catalog/shopify-handle-mapping.csv"),
  checksums: path.join(ROOT, "import/checksums.txt"),
};
const TARGETS = { "Oasis Natural": 10, "Aurora Viva": 12, "Espuma de Ola": 7, "Salidas de Baño": 0 };
const EXPECTED = { products: 29, variants: 98, images: 95 };
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "L y XL", "XXL"];
const VENDOR = "Radaelli Swimwear";

/* ---------- CSV (RFC 4180, campos multilínea entre comillas) ---------- */
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let rec = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQ = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQ = true;
    else if (c === ",") {
      rec.push(field);
      field = "";
    } else if (c === "\r") continue;
    else if (c === "\n") {
      rec.push(field);
      rows.push(rec);
      rec = [];
      field = "";
    } else field += c;
  }
  if (inQ) throw new Error("CSV: comillas sin cerrar");
  if (field !== "" || rec.length) {
    rec.push(field);
    rows.push(rec);
  }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1 || r[0] !== "").map((r, n) => {
    if (r.length !== head.length) throw new Error(`CSV: fila ${n + 2} tiene ${r.length} campos, se esperaban ${head.length}`);
    return Object.fromEntries(head.map((h, k) => [h, r[k]]));
  });
}
const cell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCSV = (header, rows) => [header, ...rows].map((r) => r.map(cell).join(",")).join("\n") + "\n";
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const fail = (msg) => {
  throw new Error(`03C gate: ${msg}`);
};

/* ---------- Descripción: texto plano -> HTML ---------- */
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function descriptionHTML(text) {
  return text
    .replace(/\r/g, "")
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length && lines.every((l) => l.startsWith("•"))) {
        return `<ul>${lines.map((l) => `<li>${esc(l.replace(/^•\s*/, ""))}</li>`).join("")}</ul>`;
      }
      return `<p>${lines.map(esc).join("<br>")}</p>`;
    })
    .join("");
}

/* ---------- Lectura y filtros ---------- */
const products = parseCSV(fs.readFileSync(SRC.products, "utf8")).filter(
  (p) => Object.hasOwn(TARGETS, p.target_shopify_collection) && String(p.category_cleanup_required).toLowerCase() === "false",
);
const variants = parseCSV(fs.readFileSync(SRC.variants, "utf8"));
const images = parseCSV(fs.readFileSync(SRC.images, "utf8"));

const header = [
  "URL handle", "Title", "Description", "Vendor", "Type", "Tags", "Published on online store", "Status",
  "Option1 name", "Option1 value", "SKU", "Price", "Compare-at price", "Inventory tracker",
  "Continue selling when out of stock", "Fulfillment service", "Requires shipping",
  "Product image URL", "Image position", "Image alt text", "Collection", "Color (product.metafields.custom.color)",
];

const rows = [];
const colorMap = new Map();
const handleRows = [];
const seenHandles = new Set();
const seenSkus = new Set();
const perCollection = Object.fromEntries(Object.keys(TARGETS).map((k) => [k, 0]));
let variantCount = 0;
let imageCount = 0;

for (const p of products) {
  const handle = p.slug.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(handle)) fail(`handle inválido "${p.slug}"`);
  if (seenHandles.has(handle)) fail(`handle duplicado "${handle}"`);
  seenHandles.add(handle);
  if (seenSkus.has(p.sku)) fail(`SKU de producto duplicado "${p.sku}"`);
  seenSkus.add(p.sku);

  const price = Number(p.calculated_sale_price);
  const compare = Number(p.price_cop);
  if (!Number.isInteger(price) || price <= 0) fail(`precio inválido en ${p.sku}`);
  if (!Number.isInteger(compare) || compare <= price) fail(`compare-at inválido en ${p.sku}`);

  const color = p.color.trim().toLocaleUpperCase("es");
  colorMap.set(p.color, color);

  const vs = variants
    .filter((v) => v.product_sku === p.sku)
    .sort((a, b) => {
      const ia = SIZE_ORDER.indexOf(a.size);
      const ib = SIZE_ORDER.indexOf(b.size);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  const ims = images.filter((im) => im.sku === p.sku).sort((a, b) => Number(a.image_position) - Number(b.image_position));
  if (!vs.length) fail(`${p.sku} sin variantes`);
  if (!ims.length) fail(`${p.sku} sin imágenes`);
  for (const v of vs) {
    if (seenSkus.has(v.variant_identifier)) fail(`SKU de variante duplicado "${v.variant_identifier}"`);
    seenSkus.add(v.variant_identifier);
  }
  variantCount += vs.length;
  imageCount += ims.length;
  perCollection[p.target_shopify_collection] += 1;

  const n = Math.max(vs.length, ims.length);
  for (let i = 0; i < n; i++) {
    const v = vs[i];
    const im = ims[i];
    const first = i === 0;
    rows.push([
      handle,
      first ? p.name : "",
      first ? descriptionHTML(p.description) : "",
      first ? VENDOR : "",
      first ? p.target_shopify_collection : "",
      "",
      first ? "true" : "",
      first ? "active" : "",
      v ? "Talla" : "",
      v ? v.size : "",
      v ? v.variant_identifier : "",
      v ? String(price) : "",
      v ? String(compare) : "",
      v ? "" : "",
      v ? "deny" : "",
      v ? "manual" : "",
      v ? "true" : "",
      im ? im.current_url : "",
      im ? String(Number(im.image_position) + 1) : "",
      im ? im.alt_text : "",
      first ? p.target_shopify_collection : "",
      first ? color : "",
    ]);
  }

  const sourceUrl = p.current_public_url;
  handleRows.push([
    sourceUrl,
    p.slug,
    handle,
    p.name,
    "SI",
    handle !== p.slug
      ? "URL actual /producto/<slug> pasa a /products/<handle>; además Shopify usa handles en minúsculas (slug de origen en mayúsculas)"
      : "URL actual /producto/<slug> pasa a /products/<handle>; handle preservado exacto",
  ]);
}

/* ---------- Gates duros ---------- */
if (products.length !== EXPECTED.products) fail(`productos ${products.length} != ${EXPECTED.products}`);
if (variantCount !== EXPECTED.variants) fail(`variantes ${variantCount} != ${EXPECTED.variants}`);
if (imageCount !== EXPECTED.images) fail(`imágenes ${imageCount} != ${EXPECTED.images}`);
for (const [c, want] of Object.entries(TARGETS)) if (perCollection[c] !== want) fail(`${c}: ${perCollection[c]} != ${want}`);

/* ---------- Escritura ---------- */
fs.mkdirSync(path.dirname(OUT.csv), { recursive: true });
fs.writeFileSync(OUT.csv, toCSV(header, rows));
fs.writeFileSync(
  OUT.colors,
  toCSV(
    ["source_color", "shopify_custom_color", "changed"],
    [...colorMap].sort(([a], [b]) => a.localeCompare(b, "es")).map(([s, t]) => [s, t, s === t ? "NO" : "SI (solo mayúsculas)"]),
  ),
);
fs.writeFileSync(OUT.handles, toCSV(["source_url", "source_handle", "shopify_handle", "product_title", "redirect_needed", "reason"], handleRows));
const sums = [...Object.values(SRC), OUT.csv, OUT.colors, OUT.handles].map((f) => `${sha256(f)}  ${path.relative(ROOT, f).replace(/\\/g, "/")}`);
fs.writeFileSync(OUT.checksums, sums.join("\n") + "\n");

console.log(
  JSON.stringify(
    {
      products: products.length,
      variants: variantCount,
      images: imageCount,
      csvRows: rows.length,
      perCollection,
      handlesChanged: handleRows.filter((r) => r[1] !== r[2]).map((r) => `${r[1]} -> ${r[2]}`),
      colorsChanged: [...colorMap].filter(([s, t]) => s !== t).map(([s, t]) => `${s} -> ${t}`),
      csvSha256: sha256(OUT.csv),
    },
    null,
    1,
  ),
);
