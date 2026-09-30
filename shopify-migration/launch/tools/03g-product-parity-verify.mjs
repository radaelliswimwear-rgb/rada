// 03G - verificacion INDEPENDIENTE de la paridad de productos (launch/03G-product-parity.csv).
// DETERMINISTA y OFFLINE. Parte de la evidencia cruda; NO importa ni reutiliza el codigo de 03g-product-parity.mjs.
// Metodo distinto al del productor:
//   - CSV: tokenizador por expresion regular pegajosa (el productor usa un automata caracter a caracter).
//   - Sitio actual: JSON-LD (JSON.parse), precios y tallas del DOM con expresiones regulares y campos del payload RSC leidos
//     sobre el HTML crudo (el productor decodifica el RSC y balancea llaves).
//   - Descripcion: comparacion sin espacios (elimina todo espacio y vineta) y por conteo de palabras, ademas de contra el CSV de importacion.
// Uso:  node launch/tools/03g-product-parity-verify.mjs
// Salida: stdout y launch/03G-product-parity-verify.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const rd = (rel) => fs.readFileSync(path.join(MIG, rel), "utf8");
const CUR = "launch/evidence/current-site/";

// ---------- CSV por regex pegajosa
function csvRows(text) {
  text = text.replace(/^﻿/, "");
  const re = /(?:"((?:[^"]|"")*)"|([^,\r\n"]*))(,|\r\n|\n|$)/y;
  const rows = [];
  let row = [];
  let pos = 0;
  while (pos < text.length) {
    re.lastIndex = pos;
    const m = re.exec(text);
    if (!m) throw new Error("CSV mal formado en la posicion " + pos);
    row.push(m[1] !== undefined ? m[1].replace(/""/g, '"') : m[2]);
    pos = re.lastIndex;
    if (m[3] !== ",") { rows.push(row); row = []; }
  }
  return rows;
}
function csvObjs(rel) {
  const rows = csvRows(rd(rel));
  const head = rows[0];
  return rows.slice(1).filter((r) => !(r.length === 1 && r[0] === "")).map((r) => {
    const o = {};
    head.forEach((k, i) => { o[k] = r[i] === undefined ? "" : r[i]; });
    return o;
  });
}

const problems = []; // fallos de esta verificacion (discrepancias con el productor o entre fuentes)
const info = {}; // cifras recalculadas
const fail = (msg) => problems.push(msg);
const num = (s) => Number(String(s).replace(/\./g, ""));
const sameArr = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// ---------- entradas crudas
const devLines = rd("launch/evidence/dev-products.jsonl").split(/\r?\n/).filter((l) => l.trim());
const dev = devLines.map((l) => JSON.parse(l));
const site = JSON.parse(rd(CUR + "index.json"));
const master = csvObjs("catalog/products-master.csv");
const vmaster = csvObjs("catalog/variants-master.csv");
const impMain = csvObjs("import/shopify-products-03c.csv");
const impImg = csvObjs("import/shopify-products-03c-images.csv");
const dims = csvObjs("import/image-dimensions.csv");
const fixes = csvObjs("import/image-resolution-fix.csv");
const hmap = csvObjs("catalog/shopify-handle-mapping.csv");
const par = csvObjs("launch/03G-product-parity.csv");
const colls = JSON.parse(rd("launch/evidence/dev-collections.json")).collections;

// ---------- totales base
info.dev_productos = dev.length;
info.dev_handles_unicos = new Set(dev.map((d) => d.h)).size;
info.dev_variantes = dev.reduce((s, d) => s + d.vr.length, 0);
info.dev_skus_unicos = new Set(dev.flatMap((d) => d.vr.map((v) => v[1]))).size;
info.dev_imagenes = dev.reduce((s, d) => s + d.im.length, 0);
info.dev_imagenes_nombres_unicos = new Set(dev.flatMap((d) => d.im)).size;
info.variants_master_filas = vmaster.length;
info.products_master_filas = master.length;
info.parity_csv_filas = par.length;
info.parity_csv_columnas = csvRows(rd("launch/03G-product-parity.csv"))[0].length;
if (dev.length !== 29) fail("dev-products.jsonl no tiene 29 productos: " + dev.length);
if (info.dev_variantes !== 98) fail("variantes Dev != 98: " + info.dev_variantes);
if (info.dev_imagenes !== 95) fail("imagenes Dev != 95: " + info.dev_imagenes);
if (par.length !== 29) fail("el CSV de paridad no tiene 29 filas: " + par.length);
if (info.dev_skus_unicos !== 98) fail("SKU Dev unicos != 98");
if (info.dev_imagenes_nombres_unicos !== 95) fail("nombres de imagen Dev unicos != 95");

// ---------- sitio actual: paginas de producto
const pdpEntries = site.filter((r) => /\/producto\/[^/?#]+$/.test(r.url));
info.sitio_pdp_entradas = pdpEntries.length;
info.sitio_pdp_200 = pdpEntries.filter((r) => r.status === 200).length;

const pidOf = (u) => { const m = /\/products\/([A-Za-z0-9_-]+)\.[A-Za-z]+/.exec(decodeURIComponent(u)); return m ? m[1] : null; };
const devPid = (n) => n.replace(/\.[A-Za-z]+$/, "").replace(/_[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/, "");
const wsLess = (s) => s.normalize("NFC").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/[•·▪●]/g, " ").replace(/\s+/g, "");
const words = (s) => s.normalize("NFC").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/[•·▪●]/g, " ").split(/\s+/).filter(Boolean);

const cur = {}; // slug(minuscula) -> hechos del sitio actual
for (const e of pdpEntries) {
  const slug = decodeURIComponent(e.url.split("/producto/")[1]);
  const html = rd(CUR + e.file);
  const f = { slug, file: e.file };
  // JSON-LD
  const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const ldP = lds.find((x) => x["@type"] === "Product");
  const ldB = lds.find((x) => x["@type"] === "BreadcrumbList");
  f.ld_types = lds.map((x) => x["@type"]).join("+");
  f.ld_name = ldP.name;
  f.ld_price = Number(ldP.offers.price);
  f.ld_sku = ldP.sku;
  f.ld_desc = ldP.description;
  f.ld_images = ldP.image.map(pidOf);
  f.ld_crumbs = ldB.itemListElement.map((x) => x.name).join(" / ");
  // DOM
  const h1 = /<h1[^>]*>([^<]*)<\/h1>/.exec(html);
  f.h1 = h1 ? h1[1].replace(/&amp;/g, "&") : null;
  const pm = /<span>\$\s*([\d.]+)<\/span><span class="[^"]*line-through">\$\s*([\d.]+)<\/span>/.exec(html);
  f.dom_sale = pm ? num(pm[1]) : null;
  f.dom_orig = pm ? num(pm[2]) : null;
  const pc = /-<!-- -->(\d+)<!-- -->%/.exec(html);
  f.dom_pct = pc ? Number(pc[1]) : null;
  const seg = /Talla<\/p>([\s\S]*?)Añadir al carrito/.exec(html);
  f.dom_buttons = seg ? [...seg[1].matchAll(/<button[^>]*aria-pressed="(?:true|false)"[^>]*aria-disabled="(true|false)"[^>]*>([^<]*)<\/button>/g)].map((m) => ({ size: m[2], disabled: m[1] === "true" })) : [];
  f.dom_sizes = f.dom_buttons.map((b) => b.size);
  f.dom_disabled = f.dom_buttons.filter((b) => b.disabled).length;
  f.dom_sku = ((/SKU: <!-- -->([^<]*)</.exec(html)) || [])[1] || null;
  f.dom_avail = /Disponible<\/span>/.test(html);
  f.title_tag = ((/<title>([^<]*)<\/title>/.exec(html)) || [])[1] || null;
  const md = /<meta name="description" content="([^"]*)"/.exec(html);
  f.meta_desc_present = !!md;
  f.meta_desc_len = md ? md[1].length : 0;
  f.meta_desc_eq_desc = md ? wsLess(md[1]) === wsLess(ldP.description) : false;
  // RSC crudo (con comillas escapadas): se lee el segundo objeto "product" (el que trae sizeStock)
  const i = html.indexOf('\\"sizeStock\\"');
  const win = html.slice(Math.max(0, i - 3500), i + 400);
  const grab = (re) => { const m = re.exec(win); return m ? m[1] : null; };
  f.rsc_slug = grab(/\\"slug\\":\\"([^"\\]+)\\"/);
  f.rsc_priceValue = Number(grab(/\\"priceValue\\":(\d+)/));
  f.rsc_original = Number(grab(/\\"originalPriceValue\\":(\d+)/));
  f.rsc_pct = Number(grab(/\\"activeDiscountPercent\\":(\d+)/));
  f.rsc_sizes = (grab(/\\"sizes\\":\[([^\]]*)\]/) || "").split(",").map((x) => x.replace(/\\"/g, "").trim()).filter(Boolean);
  f.rsc_stock = grab(/\\"sizeStock\\":\{([^}]*)\}/);
  f.rsc_total = Number(grab(/\\"totalStock\\":(\d+)/));
  f.rsc_featured = grab(/\\"featured\\":(true|false)/);
  f.rsc_color = grab(/\\"color\\":\\"([^"\\]*)\\",\\"description/);
  f.rsc_category = grab(/\\"category\\":\\"([^"\\]*)\\"/);
  f.rsc_ids = [...win.matchAll(/lago\/products\/([A-Za-z0-9_-]+)\.[a-z]+/g)].map((m) => m[1]);
  cur[slug.toLowerCase()] = f;
}
const slugs = Object.keys(cur).sort();
if (slugs.length !== 29) fail("el sitio actual no tiene 29 fichas: " + slugs.length);

// ---------- productos maestros e importacion (fuentes secundarias)
const masterBySlug = new Map(master.map((r) => [r.slug.toLowerCase(), r]));
const impByHandle = new Map();
for (const r of impMain) { const k = r["URL handle"]; if (!impByHandle.has(k)) impByHandle.set(k, []); impByHandle.get(k).push(r); }
const impImgByHandle = new Map();
for (const r of impImg) { const k = r["URL handle"]; if (!impImgByHandle.has(k)) impImgByHandle.set(k, []); impImgByHandle.get(k).push(r); }
// image-dimensions.csv por id publico de imagen
const dimByPid = new Map(dims.map((r) => [pidOf(r.url), { w: Number(r.width), h: Number(r.height) }]));
const fixKeys = new Set(fixes.filter((r) => r.imported_url !== r.source_url).map((r) => r.shopify_handle + "#" + r.image_position));
info.image_dimensions_filas = dims.length;
info.image_resolution_fix_filas = fixes.length;
info.image_resolution_fix_reducidas = fixKeys.size;

const parBy = new Map(par.map((r) => [r.shopify_handle, r]));
const rowsOut = [];
const pricePairs = {};
const buckets = { lt1200: 0, "1200-1799": 0, "1800-2399": 0, "2400-4999": 0, "5000": 0, otras: 0 };
let imgSame = 0, imgReduced = 0, imgOther = 0;
const lowRes = [];
const descChecks = { ws_igual_sitio_vs_dev: 0, ws_igual_sitio_vs_csvimport: 0, ws_igual_dev_vs_csvimport: 0, palabras_igual: 0, total: 0 };
const crumbMismatch = [];
const prefixes = {};
const stockOdd = [];
let totalCurSizes = 0, totalCurImgs = 0;

for (const d of dev) {
  const h = d.h;
  const slug = h; // el sitio actual, en minusculas
  const c = cur[slug];
  const pr = parBy.get(h);
  const m = masterBySlug.get(slug);
  const row = { handle: h, checks: {} };
  const ck = (name, ok, detail) => { row.checks[name] = ok; if (!ok) fail(h + ": " + name + " no coincide" + (detail ? " -> " + detail : "")); };
  if (!c) { fail(h + ": sin ficha en el sitio actual"); continue; }
  if (!pr) { fail(h + ": sin fila en el CSV de paridad"); continue; }

  // ---- titulo (5 fuentes)
  ck("titulo_fuentes_sitio", c.h1 === c.ld_name && (!m || m.name === c.ld_name), c.h1 + " | " + c.ld_name);
  ck("titulo_dev", d.t === d.h1 && d.t === c.h1, d.t + " vs " + c.h1);
  ck("csv_title_current", pr.title_current === c.h1, pr.title_current);
  ck("csv_title_shopify", pr.title_shopify === d.t, pr.title_shopify);

  // ---- precio y compare-at
  const dPrices = [...new Set(d.vr.map((v) => Number(v[2])))];
  const dCompare = [...new Set(d.vr.map((v) => Number(v[3])))];
  ck("precio_dev_unico", dPrices.length === 1 && dCompare.length === 1, dPrices + " / " + dCompare);
  const dp = dPrices[0], dc = dCompare[0];
  ck("precio_sitio_5_fuentes", c.dom_sale === dp && c.ld_price === dp && c.rsc_priceValue === dp && (!m || Number(m.calculated_sale_price) === dp), [c.dom_sale, c.ld_price, c.rsc_priceValue, m && m.calculated_sale_price] + " vs " + dp);
  ck("compare_at_sitio_3_fuentes", c.dom_orig === dc && c.rsc_original === dc && (!m || Number(m.price_cop) === dc), [c.dom_orig, c.rsc_original, m && m.price_cop] + " vs " + dc);
  ck("descuento_20", c.dom_pct === 20 && c.rsc_pct === 20 && Math.round(dc * 0.8) === dp, [c.dom_pct, c.rsc_pct, dc, dp].join(","));
  const dTxt = /^\$ ([\d.]+) Precio anterior \$ ([\d.]+) -(\d+)%$/.exec(d.priceTxt);
  ck("precio_renderizado_dev", !!dTxt && num(dTxt[1]) === dp && num(dTxt[2]) === dc && Number(dTxt[3]) === 20, d.priceTxt);
  const impAll = impByHandle.get(h) || [];
  const impRows = impAll.filter((r) => r.SKU); // las filas solo-imagen del CSV no llevan SKU
  ck("importacion_precio", impRows.length > 0 && impRows.every((r) => Number(r.Price) === dp && Number(r["Compare-at price"]) === dc), "");
  ck("csv_price_original_current", Number(pr.price_original_current) === dc, pr.price_original_current);
  ck("csv_price_shopify", Number(pr.price_shopify) === dp && Number(pr.compare_at_shopify) === dc, pr.price_shopify + "/" + pr.compare_at_shopify);
  const pk = dc + ">" + dp;
  pricePairs[pk] = (pricePairs[pk] || 0) + 1;

  // ---- tallas y SKU
  const dSizes = d.vr.map((v) => v[0]);
  const dSkus = d.vr.map((v) => v[1]);
  ck("tallas_sitio_dom_vs_payload", sameArr(c.dom_sizes, c.rsc_sizes), c.dom_sizes + " vs " + c.rsc_sizes);
  const sizesEq = sameArr(dSizes, c.dom_sizes);
  row.sizes_igual = sizesEq;
  ck("csv_sizes_match_coherente", (pr.sizes_match === "SI") === sizesEq, pr.sizes_match + " vs " + sizesEq);
  ck("csv_sizes_current", pr.sizes_current === c.dom_sizes.join("/"), pr.sizes_current + " vs " + c.dom_sizes.join("/"));
  ck("csv_sizes_shopify", pr.sizes_shopify === dSizes.join("/"), pr.sizes_shopify);
  ck("sku_base", c.dom_sku === c.ld_sku && (!m || m.sku === c.ld_sku), c.dom_sku + " | " + c.ld_sku);
  ck("sku_dev_es_base_mas_talla", sameArr(dSkus, dSizes.map((s) => c.ld_sku + "-" + s)), dSkus.join(","));
  const vmRows = vmaster.filter((r) => r.product_sku === c.ld_sku);
  ck("sku_dev_en_variants_master", dSkus.every((s) => vmRows.some((r) => r.variant_identifier === s)), "");
  ck("csv_sku_shopify", pr.sku_shopify === dSkus.join("|"), pr.sku_shopify);
  ck("importacion_variantes", impRows.length === d.vr.length && sameArr(impRows.map((r) => r.SKU), dSkus), impRows.length + " vs " + d.vr.length);
  ck("todas_disponibles_dev", d.vr.every((v) => v[4] === true), "");
  ck("botones_talla_sin_deshabilitar_sitio", c.dom_disabled === 0, c.dom_disabled + " deshabilitados");
  totalCurSizes += c.dom_sizes.length;
  const pre = (/^(RSON[A-Z]{2}|LG-[A-Z]{3})/.exec(c.ld_sku) || [""])[0];
  prefixes[pre] = (prefixes[pre] || 0) + 1;

  // ---- stock publicado
  const st = c.rsc_stock ? c.rsc_stock.replace(/\\"/g, "").replace(/,/g, "|") : "";
  if (!st.split("|").every((x) => x.endsWith(":25"))) stockOdd.push(h + " [" + st + "] total=" + c.rsc_total);
  ck("csv_stock_publicado", pr.stock_current_public_payload === st, pr.stock_current_public_payload + " vs " + st);

  // ---- imagenes
  const dIds = d.im.map(devPid);
  ck("imagenes_conteo", c.ld_images.length === d.im.length && Number(pr.image_count_current) === c.ld_images.length && Number(pr.image_count_shopify) === d.im.length, c.ld_images.length + " vs " + d.im.length);
  ck("imagenes_orden_ld_vs_dev", sameArr(c.ld_images, dIds), c.ld_images.join(",") + " vs " + dIds.join(","));
  ck("imagenes_dom_incluye_ld", c.ld_images.every((x) => c.rsc_ids.includes(x)), "");
  totalCurImgs += c.ld_images.length;
  const iRows = ((impImgByHandle.get(h) && impImgByHandle.get(h).length) ? impImgByHandle.get(h) : impAll).filter((r) => r["Product image URL"]).slice().sort((a, b) => Number(a["Image position"]) - Number(b["Image position"]));
  ck("imagenes_importacion_orden", sameArr(iRows.map((r) => pidOf(r["Product image URL"])), c.ld_images), "");
  const dimDev = d.imd.map((s) => s.split("x").map(Number));
  dimDev.forEach(([w, hh], i) => {
    const s = dimByPid.get(c.ld_images[i]);
    const long = Math.max(w, hh);
    if (long < 1200) { buckets.lt1200++; lowRes.push(h + " pos " + (i + 1) + " " + w + "x" + hh); }
    else if (long < 1800) buckets["1200-1799"]++;
    else if (long < 2400) buckets["1800-2399"]++;
    else if (long < 5000) buckets["2400-4999"]++;
    else if (long === 5000) buckets["5000"]++;
    else buckets.otras++;
    if (!s) { fail(h + ": pos " + (i + 1) + " sin dimensiones de fuente"); return; }
    if (s.w === w && s.h === hh) { imgSame++; if (fixKeys.has(h + "#" + (i + 1))) fail(h + ": pos " + (i + 1) + " igual a la fuente pero listada como reducida"); }
    else {
      const k = 5000 / Math.max(s.w, s.h);
      const ok = Math.max(s.w, s.h) > 5000 && Math.abs(Math.round(s.w * k) - w) <= 1 && Math.abs(Math.round(s.h * k) - hh) <= 1;
      if (ok) { imgReduced++; if (!fixKeys.has(h + "#" + (i + 1))) fail(h + ": pos " + (i + 1) + " reducida pero no listada en image-resolution-fix.csv"); }
      else { imgOther++; fail(h + ": pos " + (i + 1) + " dimensiones " + w + "x" + hh + " no explicadas (fuente " + s.w + "x" + s.h + ")"); }
    }
  });

  // ---- descripcion (los 29)
  const impDesc = impRows[0] ? impRows[0].Description : "";
  const a = wsLess(c.ld_desc), b = wsLess(d.desc), cc = wsLess(impDesc);
  descChecks.total++;
  if (a === b) descChecks.ws_igual_sitio_vs_dev++;
  if (a === cc) descChecks.ws_igual_sitio_vs_csvimport++;
  if (b === cc) descChecks.ws_igual_dev_vs_csvimport++;
  const wa = words(c.ld_desc), wb = words(d.desc);
  if (wa.length === wb.length && wa.every((x, i) => x === wb[i])) descChecks.palabras_igual++;
  ck("descripcion_sitio_vs_dev", a === b, a === b ? "" : "primera diferencia cerca de: " + a.slice(0, 60));
  ck("descripcion_sitio_vs_importacion", a === cc, "");
  ck("descripcion_palabras", wa.length === wb.length && wa.every((x, i) => x === wb[i]), wa.length + " vs " + wb.length);
  ck("csv_description_match", pr.description_match === "SI", pr.description_match);
  ck("descripcion_maestra_igual_ld", !m || m.description.replace(/\r/g, "") === c.ld_desc.replace(/\r/g, ""), "");

  // ---- coleccion y miga
  const mem = colls.filter((k) => k.order.includes(h)).map((k) => k.h);
  const catColl = colls.find((k) => k.t === c.rsc_category);
  ck("coleccion", d.ty === c.rsc_category && !!catColl && mem.includes(catColl.h), d.ty + " vs " + c.rsc_category + " / " + mem);
  const expectCrumb = "Inicio / " + c.rsc_category + " / " + c.h1;
  ck("miga_sitio_ld", c.ld_crumbs === expectCrumb, c.ld_crumbs);
  const crumbEq = d.crumbs === c.ld_crumbs;
  if (!crumbEq) crumbMismatch.push(h + ": Dev '" + d.crumbs + "'");
  ck("csv_breadcrumb_match_coherente", (pr.breadcrumb_match === "SI") === crumbEq, pr.breadcrumb_match + " vs " + crumbEq);
  row.miga_igual = crumbEq;

  // ---- color
  const dcol = String(d.color).replace(/^Color:\s*/, "").trim();
  const colEq = c.rsc_color === dcol, colUp = c.rsc_color.toUpperCase() === dcol;
  ck("color", colEq || colUp, c.rsc_color + " vs " + dcol);
  row.color_solo_mayusculas = !colEq && colUp;

  // ---- otros
  ck("pdp_200_canonico_sin_noindex", d.pdp === 200 && d.canon.endsWith("/products/" + h) && !d.robots, d.pdp + " " + d.canon + " " + d.robots);
  row.tags = d.tg || [];
  row.featured_actual = c.rsc_featured === "true";
  row.stock = st;
  row.titulo_tag_actual = c.title_tag;
  row.dev_meta_desc_len = d.metaDesc;
  row.dev_vendor = d.v;
  row.sitio_meta_desc_presente = c.meta_desc_present;
  row.sitio_meta_desc_len = c.meta_desc_len;
  row.sitio_meta_desc_eq_descripcion = c.meta_desc_eq_desc;
  row.dev_title_tag = d.pdpTitle;
  row.dev_desc_len = d.desc.length;
  rowsOut.push(row);
}

// ---------- reglas globales
const hmapOk = hmap.length === 29 || hmap.length >= 29;
info.handle_mapping_filas = hmap.length;
info.sitio_variantes_dom = totalCurSizes;
info.sitio_imagenes_ld = totalCurImgs;
if (totalCurSizes !== 97) fail("variantes visibles del sitio actual != 97: " + totalCurSizes);
if (totalCurImgs !== 95) fail("imagenes del sitio actual != 95: " + totalCurImgs);
info.pares_de_precio = pricePairs;
info.imagenes_dimensiones = { iguales: imgSame, reducidas_a_5000: imgReduced, otras: imgOther, distribucion_lado_largo: buckets };
info.imagenes_lado_largo_menor_1200 = lowRes;
info.descripcion = descChecks;
info.miga_distinta_dev_vs_actual = crumbMismatch;
info.prefijos_sku = prefixes;
info.stock_distinto_de_25 = stockOdd;
info.sitio_titulo_tag_ejemplo = rowsOut[0] && rowsOut[0].titulo_tag_actual;
info.sitio_fichas_con_meta_description = rowsOut.filter((r) => r.sitio_meta_desc_presente).length;
info.sitio_meta_desc_igual_a_descripcion = rowsOut.filter((r) => r.sitio_meta_desc_eq_descripcion).length;
info.meta_desc_largo_sitio_vs_dev = rowsOut.slice(0, 29).map((r) => r.handle + ": actual=" + r.sitio_meta_desc_len + " dev=" + r.dev_meta_desc_len + " descDev=" + r.dev_desc_len);
info.titulo_tag_formato_dev_distinto_del_actual = rowsOut.filter((r) => r.titulo_tag_actual !== r.dev_title_tag).length;
info.titulo_tag_actual_termina_en_pipe_marca = rowsOut.filter((r) => / \| Radaelli Swimwear$/.test(r.titulo_tag_actual)).length;
info.titulo_tag_dev_termina_en_marca_dev = rowsOut.filter((r) => / – Radaelli Swimwear Dev$/.test(r.dev_title_tag)).length;
info.dev_metaDesc_min_max =[Math.min(...dev.map((d) => d.metaDesc)), Math.max(...dev.map((d) => d.metaDesc))];
info.talla_distinta = rowsOut.filter((r) => !r.sizes_igual).map((r) => r.handle);
info.color_solo_mayusculas = rowsOut.filter((r) => r.color_solo_mayusculas).map((r) => r.handle);
info.tags = rowsOut.filter((r) => r.tags.length).map((r) => r.handle + ":" + r.tags.join("|"));
info.featured_true_actual = rowsOut.filter((r) => r.featured_actual).map((r) => r.handle);

// ---------- posicion en colecciones: recalculo desde el HTML crudo de las 3 paginas de coleccion
const collPos = {};
for (const [slugColl, file] of [["oasis-natural", "oasis-natural.html"], ["aurora-viva", "aurora-viva.html"], ["espuma-de-ola", "espuma-de-ola.html"]]) {
  const html = rd(CUR + file);
  const seen = [];
  for (const m of html.matchAll(/href="\/producto\/([^"]+)"/g)) { const s = decodeURIComponent(m[1]).toLowerCase(); if (!seen.includes(s)) seen.push(s); }
  const dv = colls.find((k) => k.h === slugColl).order;
  const same = seen.filter((s, i) => dv[i] === s).length;
  collPos[slugColl] = { actual_n: seen.length, dev_n: dv.length, mismo_conjunto: sameArr([...seen].sort(), [...dv].sort()), posiciones_iguales: same, selector_novedades_marcado: /<option value="novedades" selected/.test(html) || /value="novedades"[^>]*selected/.test(html) };
}
info.orden_colecciones = collPos;
const orderDiff = new Set(); // productos cuya posicion en el orden por defecto de su coleccion difiere de la Dev
{
  // posiciones por producto, recalculadas y comparadas con las columnas del CSV
  const posNow = {};
  for (const [slugColl, file] of [["oasis-natural", "oasis-natural.html"], ["aurora-viva", "aurora-viva.html"], ["espuma-de-ola", "espuma-de-ola.html"]]) {
    const seen = [];
    for (const m of rd(CUR + file).matchAll(/href="\/producto\/([^"]+)"/g)) { const s = decodeURIComponent(m[1]).toLowerCase(); if (!seen.includes(s)) seen.push(s); }
    seen.forEach((s, i) => { posNow[s] = { coll: slugColl, pos: i + 1 }; });
  }
  let ok = 0;
  for (const d of dev) {
    const p = parBy.get(d.h);
    const cn = posNow[d.h];
    const devColl = colls.find((k) => cn && k.h === cn.coll);
    const dp = devColl ? devColl.order.indexOf(d.h) + 1 : "";
    if (!cn || cn.pos !== dp) orderDiff.add(d.h);
    if (cn && String(cn.pos) === p.collection_pos_current && String(dp) === p.collection_pos_shopify) ok++;
    else fail(d.h + ": posiciones CSV (" + p.collection_pos_current + "/" + p.collection_pos_shopify + ") != recalculadas (" + (cn && cn.pos) + "/" + dp + ")");
  }
  info.posiciones_csv_coinciden = ok;
}
for (const k of Object.keys(collPos)) if (collPos[k].posiciones_iguales !== 0 || !collPos[k].mismo_conjunto) fail("orden de coleccion " + k + " no coincide con lo declarado: " + JSON.stringify(collPos[k]));

// ---------- F-01: el registro del producto cambio entre el export (2026-09-28) y hoy? (sitemap lastmod)
{
  const raw = JSON.parse(rd("source-of-truth/public-scrape-raw.json"));
  const sm = rd(CUR + "sitemap.xml.txt");
  const now = new Map();
  for (const m of sm.matchAll(/<loc>https:\/\/radaelliswimwear\.com\/producto\/([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) now.set(decodeURIComponent(m[1]).toLowerCase(), m[2]);
  const changed = [];
  let compared = 0;
  for (const p of raw.products) {
    const a = p.lastmod, b = now.get(p.slug.toLowerCase());
    compared++;
    if (a !== b) changed.push(p.slug + ": export=" + a + " hoy=" + b);
  }
  const cafe = raw.products.find((p) => p.slug === "alba-dorada-cafe-claro");
  info.sitemap_lastmod = { comparados: compared, con_lastmod_distinto: changed, cafe_claro_export: cafe && cafe.lastmod, cafe_claro_hoy: now.get("alba-dorada-cafe-claro"), cafe_claro_tallas_export: cafe && cafe.sizes.join("/") };
  // tarjeta de la coleccion Aurora Viva
  const av = rd(CUR + "aurora-viva.html");
  const cm = /\\"slug\\":\\"alba-dorada-cafe-claro\\"[\s\S]{0,400}?\\"sizes\\":\[([^\]]*)\]/.exec(av);
  info.tarjeta_aurora_viva_cafe_claro_tallas = cm ? cm[1].replace(/\\"/g, "") : null;
  info.tallas_export_20260928_vs_hoy = raw.products.filter((p) => cur[p.slug.toLowerCase()] && p.sizes.join("/") !== cur[p.slug.toLowerCase()].dom_sizes.join("/")).map((p) => p.slug + ": export=" + p.sizes.join("/") + " hoy=" + cur[p.slug.toLowerCase()].dom_sizes.join("/"));
  info.precio_export_vs_hoy_distintos = raw.products.filter((p) => cur[p.slug.toLowerCase()] && (p.salePriceCop !== cur[p.slug.toLowerCase()].ld_price)).map((p) => p.slug);
}

// ---------- redirecciones del CSV de importacion: cada /producto/<slug> -> /products/<handle>
{
  const red = csvObjs("seo/shopify-redirects-import.csv");
  const map = new Map(red.map((r) => [r["Redirect from"].toLowerCase(), r["Redirect to"]]));
  const bad = [];
  for (const d of dev) if (map.get("/producto/" + d.h) !== "/products/" + d.h) bad.push(d.h + " -> " + map.get("/producto/" + d.h));
  info.redirecciones_csv = { filas: red.length, producto: red.filter((r) => r["Redirect from"].startsWith("/producto/")).length, productos_sin_destino_correcto: bad };
  if (bad.length) fail("redirecciones de producto incorrectas: " + bad.join(", "));
}

// ---------- Home actual: Productos destacados (recomputo independiente)
{
  const home = rd(CUR + "home.html");
  const a = home.indexOf("Productos destacados");
  const b = home.indexOf("20% de descuento en toda la tienda", a);
  const seg = home.slice(a, b);
  const list = [];
  for (const m of seg.matchAll(/href="\/producto\/([^"]+)"/g)) { const s = decodeURIComponent(m[1]).toLowerCase(); if (!list.includes(s)) list.push(s); }
  const dv = colls.find((k) => k.h === "destacados").order;
  info.home_destacados = { n: list.length, mismo_conjunto_que_dev: sameArr([...list].sort(), [...dv].sort()), featured_true_en_actual_no_en_home: rowsOut.filter((r) => r.featured_actual && !list.includes(r.handle)).map((r) => r.handle) };
}

// ---------- corazon de favoritos en la ficha actual, y color hallable por busqueda
{
  let heart = 0;
  for (const s of slugs) if (/Agregar a favoritos|Quitar de favoritos/.test(rd(CUR + cur[s].file))) heart++;
  info.corazon_actual = heart;
  const strip = (x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const where = { titulo_y_descripcion: 0, solo_titulo: 0, solo_descripcion: 0, solo_tag: 0, ninguno: 0 };
  for (const d of dev) {
    const col = strip(String(d.color).replace(/^Color:\s*/, "").trim());
    const t = strip(d.t).includes(col), s = strip(d.desc).includes(col), g = (d.tg || []).some((x) => strip(x) === col);
    if (t && s) where.titulo_y_descripcion++; else if (t) where.solo_titulo++; else if (s) where.solo_descripcion++; else if (g) where.solo_tag++; else where.ninguno++;
  }
  info.color_hallable = where;
  info.ld_actual_tipos_distintos = [...new Set(slugs.map((s) => cur[s].ld_types))];
  info.camiseta_tallas_dev_y_sku = dev.filter((d) => d.vr.some((v) => /\s/.test(v[0]))).map((d) => d.h + ": " + d.vr.map((v) => v[0] + "=" + v[1]).join("|"));
  info.descripcion_menciona_azul_marino = dev.filter((d) => /azul marino/i.test(d.desc)).map((d) => d.h);
  const low = "costa-esmeralda-azul";
  info.costa_esmeralda_url_actual_en_index = site.filter((r) => /costa-esmeralda-azul$/i.test(r.url)).map((r) => r.url + " " + r.status);
  const probe = JSON.parse(rd("launch/evidence/current-site-probe/index.json"));
  info.probe_url_minuscula = probe.filter((r) => r.path === "/producto/" + low).map((r) => r.path + " -> " + r.status);
}

// ---------- manifiestos RC1.7 vs RC1.8 (F-02): que archivos cambian
{
  const load = (v) => JSON.parse(rd("dist/release-manifest-rc" + v + ".json"));
  const m7 = load("1.7"), m8 = load("1.8");
  const f7 = m7.files || [], f8 = m8.files || [];
  const key = (o) => Object.keys(o).find((k) => /path|file|name/.test(k)) || "path";
  const hashKey = (o) => Object.keys(o).find((k) => /sha/i.test(k)) || "sha256";
  const idx = (arr) => Object.fromEntries(arr.map((o) => [o[key(arr[0])], o[hashKey(arr[0])]]));
  const a = idx(f7), b = idx(f8);
  const names = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  info.manifiestos_rc17_rc18 = { archivos_rc17: f7.length, archivos_rc18: f8.length, distintos: names.filter((n) => a[n] !== b[n]) };
}

// ---------- la tabla por producto del .md coincide con el CSV (handle, coleccion, tallas, imagenes, estado)
{
  const md = rd("launch/03G-product-parity.md");
  const abbr = { R: "RECONCILED", "R-I": "RECONCILED_WITH_INTENTIONAL_DIFFERENCE", DIF: "DIFFERENCE" };
  const mdRows = [...md.matchAll(/^\| (\d+) \| `([^`]+)` \| ([^|]+) \| ([^|]+) \| (\d+)\/(\d+) \| (R-I|R|DIF) \|/gm)];
  info.md_tabla_filas = mdRows.length;
  const seen = new Set();
  for (const r of mdRows) {
    const [, , handle, coll, sizes, ic, id, est] = r;
    seen.add(handle);
    const p = parBy.get(handle);
    if (!p) { fail("md: handle sin fila CSV " + handle); continue; }
    if (p.collection_current !== coll.trim()) fail("md: " + handle + " coleccion " + coll + " vs CSV " + p.collection_current);
    if (p.sizes_shopify !== sizes.trim()) fail("md: " + handle + " tallas " + sizes + " vs CSV Dev " + p.sizes_shopify);
    if (p.image_count_current !== ic || p.image_count_shopify !== id) fail("md: " + handle + " imagenes " + ic + "/" + id);
    if (p.overall_registro_producto !== abbr[est]) fail("md: " + handle + " estado del registro " + est + " vs CSV " + p.overall_registro_producto);
  }
  if (seen.size !== 29) fail("md: la tabla por producto no tiene 29 handles distintos: " + seen.size);
}

// ---------- etiqueta overall: recomputo independiente
// Dos niveles:
//  - registro: campos de la ficha (titulo, coleccion, color, tallas, SKU, precio, imagenes, descripcion, miga, PDP);
//  - final (`overall`): registro + diferencias abiertas no intencionales que afectan a cada producto:
//      * orden por defecto dentro de su coleccion (medido: 0 de 29 posiciones iguales, sin decision documentada);
//      * inventario (Dev sin rastreo, sitio actual con stock publicado por talla; shopify-post-import-audit.csv inventory_tracked=NO).
const postAudit = new Map(csvObjs("catalog/shopify-post-import-audit.csv").map((r) => [r.handle, r]));
const expectedRecord = {};
const expectedFinal = {};
const declaredRecord = {};
const declaredFinal = {};
for (const r of rowsOut) {
  const pr = parBy.get(r.handle);
  const hasDiff = !r.sizes_igual || !r.miga_igual || Object.values(r.checks).some((v) => !v);
  const featuredOutOfHome = r.featured_actual && !colls.find((k) => k.h === "destacados").order.includes(r.handle);
  const reduced = pr.image_dims_vs_source.includes("REDUCIDAS");
  const hasInt = r.color_solo_mayusculas || r.tags.length > 0 || reduced || featuredOutOfHome || false;
  expectedRecord[r.handle] = hasDiff ? "DIFFERENCE" : hasInt ? "RECONCILED_WITH_INTENTIONAL_DIFFERENCE" : "RECONCILED";
  const invUntracked = !postAudit.get(r.handle) || postAudit.get(r.handle).inventory_tracked === "NO";
  const sysDiff = orderDiff.has(r.handle) || invUntracked;
  expectedFinal[r.handle] = hasDiff || sysDiff ? "DIFFERENCE" : hasInt ? "RECONCILED_WITH_INTENTIONAL_DIFFERENCE" : "RECONCILED";
  declaredRecord[r.handle] = pr.overall_registro_producto;
  declaredFinal[r.handle] = pr.overall;
  if (pr.collection_order_match !== (orderDiff.has(r.handle) ? "NO" : "SI")) fail(r.handle + ": collection_order_match del CSV no coincide con el recalculo");
  if (pr.inventory_match !== (invUntracked ? "NO" : "SI")) fail(r.handle + ": inventory_match del CSV no coincide con el recalculo");
}
const count = (o) => Object.values(o).reduce((a, v) => { a[v] = (a[v] || 0) + 1; return a; }, {});
info.overall_registro_recomputado = count(expectedRecord);
info.overall_final_recomputado = count(expectedFinal);
info.overall_distinto_del_productor = [
  ...Object.keys(expectedRecord).filter((h) => expectedRecord[h] !== declaredRecord[h]).map((h) => "registro " + h + ": productor=" + declaredRecord[h] + " verificador=" + expectedRecord[h]),
  ...Object.keys(expectedFinal).filter((h) => expectedFinal[h] !== declaredFinal[h]).map((h) => "final " + h + ": productor=" + declaredFinal[h] + " verificador=" + expectedFinal[h]),
];
for (const x of info.overall_distinto_del_productor) fail("overall: " + x);
const overallDiffs = [];
const expectedOverall = expectedFinal;
const declared = declaredFinal;

// ---------- salida
const out = { verificador: "launch/tools/03g-product-parity-verify.mjs", info, problemas: problems, filas: rowsOut.map((r) => ({ handle: r.handle, overall_verificador: expectedOverall[r.handle], overall_productor: declared[r.handle], registro_verificador: expectedRecord[r.handle], registro_productor: declaredRecord[r.handle], fallos: Object.keys(r.checks).filter((k) => !r.checks[k]) })) };
fs.writeFileSync(path.join(MIG, "launch", "03G-product-parity-verify.json"), JSON.stringify(out, null, 1) + "\n", "utf8");
console.log("PRODUCTOS", rowsOut.length, "| variantes Dev", info.dev_variantes, "| imagenes Dev", info.dev_imagenes, "| variantes sitio", info.sitio_variantes_dom, "| imagenes sitio", info.sitio_imagenes_ld);
console.log("INFO", JSON.stringify(info, null, 1));
console.log("PROBLEMAS (" + problems.length + "):");
for (const p of problems) console.log("  -", p);
