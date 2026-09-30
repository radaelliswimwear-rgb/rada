#!/usr/bin/env node
/**
 * Fase 03C -- reintento de imágenes que Shopify no pudo ingerir.
 *
 * Shopify admite imágenes de hasta 5000 x 5000 px o 25 MP
 * (help.shopify.com/en/manual/products/product-media/product-media-types).
 * Varias fotos de la fuente miden 4672 x 7008 (32,7 MP) y el importador las
 * descartó. Este script:
 *   1. lee las dimensiones REALES de las 95 URLs de la fuente (solo el
 *      encabezado JPEG, con una petición Range de solo lectura);
 *   2. para cada imagen fuera del límite genera la URL de entrega de la MISMA
 *      foto en el mismo CDN (Cloudinary) con el lado largo limitado a
 *      5000 px (c_limit: sin recorte, sin cambiar color ni contenido; q_95);
 *   3. escribe un CSV de reimportación ("Sobrescribir productos con handles
 *      coincidentes") SOLO con URL handle + Title + columnas de imagen de los
 *      productos afectados, en el orden original de la fuente;
 *   4. escribe la trazabilidad exacta fuente -> URL importada.
 *
 *   node shopify-migration/scripts/build-shopify-image-fix-csv.mjs
 *
 * Salidas:
 *   import/image-dimensions.csv            dimensiones reales de las 95
 *   import/shopify-products-03c-images.csv reimportación de imágenes
 *   import/image-resolution-fix.csv        fuente -> URL importada + motivo
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIMIT_MP = 25;
const LIMIT_SIDE = 5000;
const TRANSFORM = "c_limit,w_5000,h_5000,q_95";

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
  if (field !== "" || rec.length) {
    rec.push(field);
    rows.push(rec);
  }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, k) => [h, r[k]])));
}
const cell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCSV = (header, rows) => [header, ...rows].map((r) => r.map(cell).join(",")).join("\n") + "\n";

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}
async function probe(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const res = await fetch(url, { headers: { Range: "bytes=0-262143" }, signal: ctl.signal });
      const size = jpegSize(Buffer.from(await res.arrayBuffer()));
      if (size) return size;
    } catch {
      /* reintenta */
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`no se pudo leer el tamaño de ${url}`);
}

const products = parseCSV(fs.readFileSync(path.join(ROOT, "catalog/products-master.csv"), "utf8"));
const images = parseCSV(fs.readFileSync(path.join(ROOT, "images/images-manifest.csv"), "utf8"));
const bySku = new Map(products.map((p) => [p.sku, p]));

const dims = [];
for (const im of images) {
  const { width, height } = await probe(im.current_url);
  dims.push({ ...im, width, height, mp: (width * height) / 1e6 });
}
const over = (d) => d.mp > LIMIT_MP || d.width > LIMIT_SIDE || d.height > LIMIT_SIDE;
const affectedSkus = [...new Set(dims.filter(over).map((d) => d.sku))];

const fixRows = [];
const traceRows = [];
for (const p of products.filter((x) => affectedSkus.includes(x.sku))) {
  const handle = p.slug.trim().toLowerCase();
  const own = dims.filter((d) => d.sku === p.sku).sort((a, b) => Number(a.image_position) - Number(b.image_position));
  own.forEach((d, i) => {
    const url = over(d) ? d.current_url.replace("/image/upload/", `/image/upload/${TRANSFORM}/`) : d.current_url;
    fixRows.push([handle, i === 0 ? p.name : "", url, String(Number(d.image_position) + 1), d.alt_text]);
    traceRows.push([
      handle,
      String(Number(d.image_position) + 1),
      d.current_url,
      `${d.width}x${d.height}`,
      d.mp.toFixed(1),
      url,
      over(d) ? `supera el límite de Shopify (${LIMIT_SIDE}px / ${LIMIT_MP} MP): misma foto, lado largo limitado a ${LIMIT_SIDE}px en el mismo CDN` : "dentro del límite: URL original sin cambios",
    ]);
  });
}

fs.writeFileSync(
  path.join(ROOT, "import/image-dimensions.csv"),
  toCSV(["sku", "image_position", "url", "width", "height", "megapixels", "within_shopify_limit"], dims.map((d) => [d.sku, d.image_position, d.current_url, d.width, d.height, d.mp.toFixed(1), over(d) ? "NO" : "SI"])),
);
// Al sobrescribir, Shopify exige las columnas de opciones/variantes: el CSV de
// reimportación es el subconjunto EXACTO del CSV principal para los productos
// afectados, idéntico salvo "Product image URL" (mismas tallas, SKU y precios,
// así las variantes conservan su ID).
const mainText = fs.readFileSync(path.join(ROOT, "import/shopify-products-03c.csv"), "utf8");
const mainRows = parseCSV(mainText);
const mainHeader = Object.keys(mainRows[0]);
const affectedHandles = new Set(traceRows.map((r) => r[0]));
const newUrl = new Map(traceRows.map((r) => [r[2], r[5]]));
const subset = mainRows
  .filter((r) => affectedHandles.has(r["URL handle"]))
  .map((r) => mainHeader.map((h) => (h === "Product image URL" && r[h] ? newUrl.get(r[h]) ?? r[h] : r[h])));
if (subset.filter((r) => r[mainHeader.indexOf("Product image URL")]).length !== fixRows.length) throw new Error("subset de imágenes inconsistente");
fs.writeFileSync(path.join(ROOT, "import/shopify-products-03c-images.csv"), toCSV(mainHeader, subset));
fs.writeFileSync(
  path.join(ROOT, "import/image-resolution-fix.csv"),
  toCSV(["shopify_handle", "image_position", "source_url", "source_dimensions", "source_megapixels", "imported_url", "reason"], traceRows),
);
console.log(
  JSON.stringify({
    probed: dims.length,
    overLimit: dims.filter(over).length,
    affectedProducts: affectedSkus.length,
    affected: affectedSkus.map((s) => bySku.get(s).slug.toLowerCase()),
    fixRows: fixRows.length,
    maxWithin: Math.max(...dims.filter((d) => !over(d)).map((d) => d.mp)).toFixed(1),
  }),
);
