// 03G - paridad de los 29 productos: sitio actual (rastreo GET guardado) vs Development Store (evidencia guardada).
// DETERMINISTA y OFFLINE: solo lee archivos del repo. No hay red, no hay fechas, no hay aleatoriedad.
// Uso:  node launch/tools/03g-product-parity.mjs
// Salidas: launch/03G-product-parity.csv  y  launch/03G-product-parity.summary.json  (+ resumen por stdout)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, "..", "..");
const EV = path.join(MIG, "launch", "evidence");
const CUR = path.join(EV, "current-site");
const OUT_CSV = path.join(MIG, "launch", "03G-product-parity.csv");
const OUT_JSON = path.join(MIG, "launch", "03G-product-parity.summary.json");

// ---------------------------------------------------------------- utilidades
function parseCsv(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c !== "\r") cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
function readCsv(rel) {
  const rows = parseCsv(fs.readFileSync(path.join(MIG, rel), "utf8").replace(/^﻿/, ""));
  const h = rows[0];
  return rows.slice(1).filter((r) => r.length > 1 || (r.length === 1 && r[0] !== "")).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
}
function csvCell(v) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const nfc = (s) => String(s ?? "").normalize("NFC");
const stripAccents = (s) => nfc(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
const slugify = (s) => stripAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const cop = (n) => "$ " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// ---------------------------------------------------------------- lectura de evidencia
const devProducts = fs.readFileSync(path.join(EV, "dev-products.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const devCollections = readJson(path.join(EV, "dev-collections.json")).collections;
const devRoutes = readJson(path.join(EV, "dev-routes.json"));
const siteIndex = readJson(path.join(CUR, "index.json"));
// sondeo puntual del sitio actual (current-site-probe): p. ej. la URL en minusculas de COSTA-ESMERALDA-AZUL
const probeIndex = fs.existsSync(path.join(EV, "current-site-probe", "index.json")) ? readJson(path.join(EV, "current-site-probe", "index.json")) : [];

const master = readCsv("catalog/products-master.csv");
const variantsMaster = readCsv("catalog/variants-master.csv");
const handleMap = readCsv("catalog/shopify-handle-mapping.csv");
const postAudit = readCsv("catalog/shopify-post-import-audit.csv");
const searchTagMap = readCsv("catalog/color-search-tag-map.csv");
const redirects = readCsv("seo/shopify-redirects-import.csv");
const impMain = readCsv("import/shopify-products-03c.csv");
const impImg = readCsv("import/shopify-products-03c-images.csv");
const resFix = readCsv("import/image-resolution-fix.csv");
const dimsSrc = readCsv("import/image-dimensions.csv");
const colorMap = readCsv("import/color-mapping.csv");

const masterBySlug = new Map(master.map((r) => [r.slug, r]));
const auditByHandle = new Map(postAudit.map((r) => [r.handle, r]));
const handleMapBySlug = new Map(handleMap.map((r) => [r.source_handle, r]));
const searchTagByHandle = new Map(searchTagMap.map((r) => [r.handle, r]));
const colorMapBySrc = new Map(colorMap.map((r) => [r.source_color, r.shopify_custom_color]));
const redirectFrom = new Map(redirects.map((r) => [r["Redirect from"], r["Redirect to"]]));
const redirectFromLower = new Map(redirects.map((r) => [r["Redirect from"].toLowerCase(), r["Redirect to"]]));

const varsBySku = new Map();
for (const r of variantsMaster) { if (!varsBySku.has(r.product_sku)) varsBySku.set(r.product_sku, []); varsBySku.get(r.product_sku).push(r); }

function groupByHandle(rows) {
  const m = new Map(); let cur = "";
  for (const r of rows) { if (r["URL handle"]) cur = r["URL handle"]; if (!m.has(cur)) m.set(cur, []); m.get(cur).push(r); }
  return m;
}
const impMainByH = groupByHandle(impMain);
const impImgByH = groupByHandle(impImg);
const dimsBySku = new Map();
for (const r of dimsSrc) { if (!dimsBySku.has(r.sku)) dimsBySku.set(r.sku, []); dimsBySku.get(r.sku).push(r); }
// image-resolution-fix.csv trae 44 filas: 43 reducidas a 5000 px (imported_url != source_url) y 1 "dentro del limite: URL original sin cambios"
const fixByKey = new Map(resFix.filter((r) => r.imported_url !== r.source_url).map((r) => [r.shopify_handle + "#" + r.image_position, r]));
const reasons = {}; // clave de motivo -> lista de handles (para el resumen)
const addReason = (key, handle) => { (reasons[key] ||= []).push(handle); };

// ---------------------------------------------------------------- imagen: public_id de Cloudinary
function publicId(url) {
  const m = decodeURIComponent(String(url)).match(/\/lago\/products\/([^/.?]+)\.[A-Za-z0-9]+/);
  return m ? m[1] : null;
}
function shopifyFileId(name) {
  return String(name).replace(/\.[A-Za-z0-9]+$/, "").replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, "");
}

// ---------------------------------------------------------------- parseo del HTML del sitio actual
function rscText(html) {
  const pushes = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)];
  return pushes.map((m) => { try { return JSON.parse('"' + m[1] + '"'); } catch { return ""; } }).join("");
}
function balanced(s, start) {
  let d = 0, inS = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inS) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inS = false; continue; }
    if (c === '"') inS = true;
    else if (c === "{") d++;
    else if (c === "}") { d--; if (d === 0) return s.slice(start, i + 1); }
  }
  return null;
}
const stripTags = (s) => s.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "\u0001").replace(/\u0001+/g, "|").replace(/^\||\|$/g, "");
const decodeEnt = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function parseCurrent(file, slug) {
  const html = fs.readFileSync(path.join(CUR, file), "utf8");
  const out = { file, bytes: html.length };
  out.titleTag = decodeEnt((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
  out.canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || "";
  out.robots = (html.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || "";
  // JSON-LD
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } });
  out.ldCount = ld.length;
  out.ldTypes = ld.map((x) => (x && x["@type"]) || "?");
  out.ldProduct = ld.find((x) => x && x["@type"] === "Product") || null;
  out.ldBreadcrumb = ld.find((x) => x && x["@type"] === "BreadcrumbList") || null;
  // objeto de la ficha en el payload RSC
  const r = rscText(html);
  let pdp = null, idx = 0;
  while ((idx = r.indexOf('"product":{', idx)) >= 0) {
    const j = balanced(r, idx + '"product":'.length);
    idx += 10;
    if (!j) continue;
    try { const p = JSON.parse(j); if (p.sizeStock && p.slug === slug) { pdp = p; break; } } catch { /* siguiente */ }
  }
  out.pdp = pdp;
  // DOM visible
  const mainIdx = html.indexOf('<main id="main-content"');
  const main = mainIdx >= 0 ? html.slice(mainIdx) : html;
  out.h1 = decodeEnt(stripTags((main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || ""));
  const priceHtml = (main.match(/<p class="text-2xl font-medium text-neutral-900">([\s\S]*?)<\/p>/) || [])[1] || "";
  const priceTxt = stripTags(priceHtml);
  out.priceTxt = priceTxt;
  const nums = [...priceTxt.matchAll(/\$\s*([\d.]+)/g)].map((m) => Number(m[1].replace(/\./g, "")));
  out.priceDomSale = nums[0] ?? null;
  out.priceDomOriginal = nums[1] ?? null;
  out.priceDomPct = Number((priceTxt.match(/-\|?(\d+)\|?%/) || [])[1] ?? NaN);
  out.skuDom = (main.match(/SKU: <!-- -->([^<]*)</) || [])[1] || null;
  out.colorDom = (main.match(/Color — <!-- -->([^<]*)</) || [])[1] || null;
  out.availDom = /Disponible<\/span>/.test(main);
  out.heartDom = /Agregar a favoritos/.test(main) || /Quitar de favoritos/.test(main);
  const tIdx = main.indexOf(">Talla<");
  const tEnd = main.indexOf("Añadir al carrito", tIdx);
  const seg = tIdx >= 0 ? main.slice(tIdx, tEnd > 0 ? tEnd : tIdx + 6000) : "";
  out.sizesDom = [...seg.matchAll(/<button[^>]*aria-pressed="[^"]*"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => decodeEnt(stripTags(m[1])));
  const nav = (main.match(/<nav aria-label="Miga de pan"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || "";
  out.crumbsDom = [...nav.matchAll(/>([^<>]+)</g)].map((m) => decodeEnt(m[1]).trim()).filter((t) => t && t !== "/").join(" / ");
  // galeria (bloque transmitido S:0)
  const s0i = html.indexOf('<div hidden id="S:0">');
  const s0 = s0i >= 0 ? html.slice(s0i) : "";
  const gal = [];
  for (const m of s0.matchAll(/<img [^>]*?src="([^"]+)"/g)) {
    const u = decodeEnt(m[1]);
    const pid = publicId(u);
    if (pid && !gal.includes(pid)) gal.push(pid);
  }
  out.galleryDomIds = gal;
  return out;
}

// ---------------------------------------------------------------- normalizacion de descripciones
function textOf(s) {
  return nfc(s).replace(/<\/(p|li|ul|h\d)>/gi, " ").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\r/g, "");
}
const L1 = (s) => textOf(s).replace(/[•·▪●]/g, " ").replace(/\s+/g, " ").trim();
const L2 = (s) => L1(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
function firstDiff(a, b) {
  const A = a.split(" "), B = b.split(" ");
  let i = 0;
  while (i < A.length && i < B.length && A[i] === B[i]) i++;
  return "palabra " + (i + 1) + ": actual='" + (A.slice(i, i + 4).join(" ")) + "' vs shopify='" + (B.slice(i, i + 4).join(" ")) + "'";
}

// ---------------------------------------------------------------- colecciones (Dev)
const devColl = new Map(devCollections.map((c) => [c.h, c]));
const typeTitleToHandle = new Map(devCollections.map((c) => [c.t, c.h]));
const membership = (h) => devCollections.filter((c) => c.order.includes(h)).map((c) => c.h);

// ---------------------------------------------------------------- pagina Home y colecciones del sitio actual
function hrefsIn(file, from, to) {
  const html = fs.readFileSync(path.join(CUR, file), "utf8");
  const a = from ? html.indexOf(from) : 0;
  const b = to ? html.indexOf(to) : html.length;
  const seg = html.slice(Math.max(a, 0), b > 0 ? b : html.length);
  const seen = [];
  for (const m of seg.matchAll(/href="\/producto\/([^"]+)"/g)) { const s = decodeURIComponent(m[1]); if (!seen.includes(s)) seen.push(s); }
  return seen;
}
const curHomeFeatured = hrefsIn("home.html", "Productos destacados", "20% de descuento en toda la tienda");
const curCollectionOrder = {
  "oasis-natural": hrefsIn("oasis-natural.html"),
  "aurora-viva": hrefsIn("aurora-viva.html"),
  "espuma-de-ola": hrefsIn("espuma-de-ola.html"),
};

// ---------------------------------------------------------------- paginas de producto actuales
const productPages = siteIndex.filter((r) => /\/producto\/[^/?#]+$/.test(r.url));
const curBySlug = new Map();
for (const r of productPages) {
  const slug = decodeURIComponent(r.url.match(/\/producto\/([^/?#]+)$/)[1]);
  if (r.status !== 200 || !r.file) { curBySlug.set(slug, { url: r.url, status: r.status, missing: true }); continue; }
  const p = parseCurrent(r.file, slug);
  p.url = r.url; p.status = r.status; p.slug = slug;
  curBySlug.set(slug, p);
}

// ---------------------------------------------------------------- reconciliacion por producto
const devByHandle = new Map(devProducts.map((d) => [d.h, d]));
const rows = [];
const problems = []; // hallazgos de datos del propio script (fuentes que no cuadran)
const lowRes = []; // imagenes de baja resolucion (lista para el .md)
const imageDetail = []; // detalle por imagen

// mapeo slug actual -> handle Dev: por handle-mapping.csv (fuente) y, como respaldo, por minusculas
const slugs = [...curBySlug.keys()];
for (const slug of slugs) {
  const cur = curBySlug.get(slug);
  const m = masterBySlug.get(slug);
  const map = handleMapBySlug.get(slug);
  const handle = map ? map.shopify_handle : slug.toLowerCase();
  const dev = devByHandle.get(handle);
  const row = { current_slug: slug, current_url: cur.url, shopify_handle: handle };
  const diffs = []; // {k:'DIFF'|'INTENT', t}
  const notes = [];
  const push = (k, raw) => { const [key, ...rest] = raw.split("::"); diffs.push({ k, t: rest.join("::") }); addReason(k + ":" + key, handle); };
  const note = (raw) => { const [key, ...rest] = raw.split("::"); notes.push(rest.join("::")); addReason("NOTA:" + key, handle); };
  if (!dev) { row.overall = "DIFFERENCE"; row.notes = "NO existe el handle en dev-products.jsonl"; rows.push(row); problems.push(slug + ": sin registro Dev"); continue; }
  if (cur.missing) { row.overall = "DIFFERENCE"; row.notes = "el sitio actual no respondio 200 en el rastreo"; rows.push(row); continue; }
  const p = cur.pdp;
  if (!p) { problems.push(slug + ": sin objeto de ficha en el payload RSC"); }

  // ---- redireccion
  const srcPath = "/producto/" + slug;
  const rTo = redirectFrom.get(srcPath);
  const rToLower = redirectFromLower.get(srcPath.toLowerCase());
  const canonPath = dev.canon.replace(/^https?:\/\/[^/]+/, "");
  const redirectOk = rTo === "/products/" + handle && dev.pdp === 200 && canonPath === "/products/" + handle;
  row.redirect_source_to_handle_ok = redirectOk ? "SI" : "NO";
  if (!redirectOk) push("DIFF", "REDIRECT::redireccion /producto/" + slug + " no llega a /products/" + handle + " (csv=" + (rTo || "AUSENTE") + ", pdp=" + dev.pdp + ")");
  if (slug !== handle) {
    push("INTENT", "HANDLE_MINUSCULAS::handle en minusculas: '" + slug + "' -> '" + handle + "' (Shopify solo admite minusculas; redireccion incluida)");
    if (rToLower === "/products/" + handle) note("REDIRECT_CASE::redirect en el CSV usa la mayuscula exacta del sitio actual; 03F midio que Shopify no distingue mayusculas [DOC:seo/03F-redirect-import-result.md]");
  }

  // ---- titulo
  const titleCur = cur.h1;
  const titleSrcAgree = p && [p.name, cur.ldProduct && cur.ldProduct.name, m && m.name].every((x) => x === titleCur);
  row.title_current = titleCur;
  row.title_shopify = dev.t;
  row.title_match = titleCur === dev.t && dev.h1 === dev.t ? "SI" : "NO";
  if (row.title_match === "NO") push("DIFF", "TITULO::titulo distinto: actual='" + titleCur + "' shopify='" + dev.t + "'");
  if (!titleSrcAgree) problems.push(slug + ": fuentes del titulo del sitio actual no coinciden");
  if (slugify(dev.t) !== handle) note("HANDLE_NO_REFLEJA_TITULO::el handle no refleja el titulo ('" + handle + "' vs '" + dev.t + "'): heredado del sitio actual, mismo slug en la URL vigente");

  // ---- coleccion
  const catCur = p ? p.category : "";
  const catSources = [catCur, cur.ldProduct && cur.ldProduct.category, m && m.category, m && m.current_category, cur.crumbsDom.split(" / ")[1]];
  const catAgree = catSources.every((x) => x === catCur);
  const curPage = curCollectionOrder[typeTitleToHandle.get(catCur)] || [];
  const listedCur = curPage.includes(slug);
  const mem = membership(handle);
  const catHandle = typeTitleToHandle.get(catCur);
  row.collection_current = catCur;
  row.collection_shopify = dev.ty;
  const typeMems = mem.filter((h) => ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"].includes(h));
  row.collection_match = catCur === dev.ty && mem.includes(catHandle) && typeMems.length === 1 ? "SI" : "NO";
  if (row.collection_match === "NO") push("DIFF", "COLECCION::coleccion distinta: actual='" + catCur + "' shopify tipo='" + dev.ty + "' membresia=" + mem.join("+"));
  if (!catAgree) problems.push(slug + ": categoria del sitio actual no coincide entre fuentes " + JSON.stringify(catSources));
  if (!listedCur) note("LISTADO_ACTUAL::no aparece en la pagina de coleccion actual [MEDIDO-03G]");

  // ---- destacados
  const inDest = mem.includes("destacados");
  row.destacados_member = inDest ? "Sí" : "No";
  const featuredCur = p ? p.featured === true : false;
  const inHomeCur = curHomeFeatured.includes(slug);
  if (inHomeCur !== inDest) push("DIFF", "DESTACADOS::Destacados: Home actual=" + (inHomeCur ? "Sí" : "No") + " vs Dev=" + (inDest ? "Sí" : "No"));
  if (featuredCur && !inHomeCur) push("INTENT", "FEATURED_FUERA_DE_HOME::flag featured=true en el sitio actual pero la Home actual no lo muestra (los 3 de Oasis Natural quedan fuera de 'Productos destacados'); Dev tampoco lo incluye en Destacados [DOC:theme/03D-missing-assets-audit.md secc. 5]");

  // ---- color
  const colorCur = p ? p.color : "";
  const colorShop = String(dev.color || "").replace(/^Color:\s*/, "").trim();
  const colorSrcAgree = [cur.colorDom, cur.ldProduct && cur.ldProduct.color, m && m.color].every((x) => x === colorCur);
  row.color_current = colorCur;
  row.color_shopify = colorShop;
  if (colorCur === colorShop) row.color_match = "SI";
  else if (colorCur.toUpperCase() === colorShop) row.color_match = "SI_SOLO_MAYUSCULAS";
  else row.color_match = "NO";
  if (row.color_match === "SI_SOLO_MAYUSCULAS") push("INTENT", "COLOR_MAYUSCULAS::color '" + colorCur + "' -> '" + colorShop + "' solo cambia a MAYUSCULAS [DOC:import/color-mapping.csv]");
  if (row.color_match === "NO") push("DIFF", "COLOR::color distinto: actual='" + colorCur + "' shopify='" + colorShop + "'");
  if (colorMapBySrc.get(colorCur) !== colorShop) problems.push(slug + ": color-mapping.csv no cuadra con Dev (" + colorCur + " -> " + colorMapBySrc.get(colorCur) + " vs " + colorShop + ")");
  if (!colorSrcAgree) problems.push(slug + ": color del sitio actual no coincide entre fuentes");

  // ---- tallas
  const sizesCur = p ? p.sizes : [];
  const sizesShop = dev.vr.map((v) => v[0]);
  row.sizes_current = sizesCur.join("/");
  row.sizes_shopify = sizesShop.join("/");
  row.sizes_match = JSON.stringify(sizesCur) === JSON.stringify(sizesShop) ? "SI" : "NO";
  const skuCur = p ? p.sku : "";
  const vm = varsBySku.get(skuCur) || [];
  const sizesMaster = vm.map((v) => v.size);
  if (row.sizes_match === "NO") push("DIFF", "TALLAS::tallas: sitio actual [" + sizesCur.join(",") + "] vs Dev [" + sizesShop.join(",") + "]; variants-master (2026-09-28) [" + sizesMaster.join(",") + "]");
  if (JSON.stringify(cur.sizesDom) !== JSON.stringify(sizesCur)) problems.push(slug + ": tallas DOM vs payload no coinciden " + JSON.stringify(cur.sizesDom) + " vs " + JSON.stringify(sizesCur));
  if (sizesShop.some((s) => !/^(S|M|L|XL)$/.test(s))) note("TALLA_L_Y_XL::talla no estandar '" + sizesShop.filter((s) => !/^(S|M|L|XL)$/.test(s)).join(",") + "': combina L y XL en una sola variante; heredado del sitio actual (mismo nombre y un solo stock)");

  // ---- sku
  const skuShopList = dev.vr.map((v) => v[1]);
  const skuOk = skuShopList.every((s, i) => s === skuCur + "-" + sizesShop[i]) && skuCur === (m && m.sku) && cur.skuDom === skuCur;
  const skuMasterOk = JSON.stringify(skuShopList) === JSON.stringify(vm.filter((v) => sizesShop.includes(v.size)).map((v) => v.variant_identifier));
  row.sku_current = skuCur;
  row.sku_shopify = skuShopList.join("|");
  row.sku_match = skuOk ? "SI" : "NO";
  if (!skuOk) push("DIFF", "SKU::SKU: actual '" + skuCur + "' vs Dev " + skuShopList.join("|"));
  if (!skuMasterOk) problems.push(slug + ": SKU Dev no coincide con variants-master");
  if (skuShopList.some((s) => /\s/.test(s))) note("SKU_ESPACIOS::SKU con espacios ('" + skuShopList.find((s) => /\s/.test(s)) + "'): heredado del identificador 'L y XL'");
  const skuPrefix = (skuCur.match(/^(RSON[A-Z]{2}|LG-[A-Z]{3})/) || [""])[0];
  if (skuPrefix === "LG-HOM") note("SKU_PREFIJO_HOM::el SKU usa el prefijo LG-HOM pero la coleccion es " + catCur + " (los demas de esa coleccion usan LG-AUR): heredado del sitio actual [INFERIDO: el prefijo no coincide con la coleccion]");

  // ---- precio
  const orig = p ? p.originalPriceValue : NaN;
  const sale = p ? p.priceValue : NaN;
  row.price_original_current = orig;
  row.price_sale_current = sale + " (-" + (p ? p.activeDiscountPercent : "?") + "% visible; precio anterior tachado " + cur.priceDomOriginal + ")";
  const prices = [...new Set(dev.vr.map((v) => Number(v[2])))];
  const compares = [...new Set(dev.vr.map((v) => Number(v[3])))];
  row.price_shopify = prices.length === 1 ? prices[0] : prices.join("|");
  row.compare_at_shopify = compares.length === 1 ? compares[0] : compares.join("|");
  const shopNums = [...String(dev.priceTxt).matchAll(/\$\s*([\d.]+)/g)].map((x) => Number(x[1].replace(/\./g, "")));
  const shopPct = Number((String(dev.priceTxt).match(/-(\d+)%/) || [])[1] ?? NaN);
  const noDouble = prices.length === 1 && compares.length === 1 && Math.round(compares[0] * 0.8) === prices[0];
  const curPriceOk = p && cur.priceDomSale === sale && cur.priceDomOriginal === orig && cur.priceDomPct === p.activeDiscountPercent && Number(cur.ldProduct.offers.price) === sale && m && Number(m.price_cop) === orig && Number(m.calculated_sale_price) === sale && Number(m.discount_percent) === p.activeDiscountPercent;
  const priceOk = prices.length === 1 && compares.length === 1 && prices[0] === sale && compares[0] === orig && noDouble && shopNums[0] === sale && shopNums[1] === orig && shopPct === p.activeDiscountPercent;
  row.price_match = priceOk ? "SI" : "NO";
  if (!priceOk) push("DIFF", "PRECIO::precio: actual " + orig + "/" + sale + " vs Dev compare_at=" + compares.join("|") + " precio=" + prices.join("|") + " render='" + dev.priceTxt + "'");
  if (!curPriceOk) problems.push(slug + ": el precio del sitio actual no coincide entre payload/DOM/JSON-LD/master");
  if (dev.vr.some((v) => v[4] !== true)) note("VARIANTE_NO_DISPONIBLE::hay variantes no disponibles en Dev");

  // ---- imagenes
  const curImgs = p ? p.images.map(publicId) : [];
  const ldImgs = cur.ldProduct ? cur.ldProduct.image.map(publicId) : [];
  const devImgs = dev.im.map(shopifyFileId);
  const uuidSuffix = dev.im.filter((n) => shopifyFileId(n) + ".jpg" !== n);
  row.image_count_current = curImgs.length;
  row.image_count_shopify = dev.im.length;
  const orderEq = JSON.stringify(curImgs) === JSON.stringify(devImgs);
  row.image_order_match = orderEq ? "SI" : "NO";
  if (!orderEq) push("DIFF", "IMAGENES_ORDEN::imagenes: orden/conteo actual [" + curImgs.join(",") + "] vs Dev [" + devImgs.join(",") + "]");
  if (JSON.stringify(curImgs) !== JSON.stringify(ldImgs)) problems.push(slug + ": imagenes payload vs JSON-LD no coinciden");
  if (JSON.stringify(curImgs) !== JSON.stringify(cur.galleryDomIds)) problems.push(slug + ": imagenes payload vs galeria DOM no coinciden (" + cur.galleryDomIds.length + " en DOM)");
  if (uuidSuffix.length) note("IMG_SUFIJO_UUID::Dev renombro " + uuidSuffix.length + " archivo(s) con sufijo UUID (" + uuidSuffix.join(",") + "): misma imagen, solo cambia el nombre [DOC:catalog/shopify-post-import-audit.csv]");
  // importacion: lista final de URLs (03c-images.csv si el handle esta; si no, 03c.csv)
  const impRows = (impImgByH.get(handle) && impImgByH.get(handle).length ? impImgByH.get(handle) : impMainByH.get(handle) || []).filter((r) => r["Product image URL"]);
  const impIds = impRows.slice().sort((a, b) => Number(a["Image position"]) - Number(b["Image position"])).map((r) => publicId(r["Product image URL"]));
  if (JSON.stringify(impIds) !== JSON.stringify(curImgs)) problems.push(slug + ": lista de imagenes de importacion no coincide con el sitio actual");
  // dimensiones: fuente vs Dev
  const srcDims = (dimsBySku.get(skuCur) || []).slice().sort((a, b) => Number(a.image_position) - Number(b.image_position));
  const devDims = dev.imd.map((s) => s.split("x").map(Number));
  let same = 0, reduced = 0, other = 0;
  const dimNotes = [];
  let minArea = Infinity, minDim = "", minShort = Infinity;
  devDims.forEach(([w, h], i) => {
    const sd = srcDims[i];
    const sw = sd ? Number(sd.width) : NaN, sh = sd ? Number(sd.height) : NaN;
    if (sd && publicId(sd.url) !== curImgs[i]) problems.push(slug + ": image-dimensions.csv posicion " + i + " apunta a otra imagen");
    let kind;
    if (sw === w && sh === h) { kind = "IGUAL"; same++; }
    else {
      const k = 5000 / Math.max(sw, sh);
      const ew = Math.round(sw * k), eh = Math.round(sh * k);
      if (Math.max(sw, sh) > 5000 && Math.abs(ew - w) <= 1 && Math.abs(eh - h) <= 1) { kind = "REDUCIDA_A_5000"; reduced++; }
      else { kind = "OTRO"; other++; }
    }
    const fx = fixByKey.get(handle + "#" + (i + 1));
    imageDetail.push({ handle, pos: i + 1, id: curImgs[i], src: sw + "x" + sh, shopify: w + "x" + h, kind, inFixCsv: !!fx });
    if (fx && kind !== "REDUCIDA_A_5000") problems.push(slug + ": pos " + (i + 1) + " esta en image-resolution-fix.csv pero no aparece reducida en Dev");
    if (!fx && kind === "REDUCIDA_A_5000") problems.push(slug + ": pos " + (i + 1) + " reducida en Dev pero no esta en image-resolution-fix.csv");
    if (w * h < minArea) { minArea = w * h; minDim = w + "x" + h; }
    minShort = Math.min(minShort, w, h);
    lowRes.push({ handle, pos: i + 1, shopify: w + "x" + h, src: sw + "x" + sh, kind, long: Math.max(w, h), short: Math.min(w, h) });
  });
  row.image_min_dimension_shopify = minDim;
  if (srcDims.length !== devDims.length) problems.push(slug + ": image-dimensions.csv tiene " + srcDims.length + " filas para " + devDims.length + " imagenes");
  if (other) push("DIFF", "IMAGENES_DIMENSIONES::" + other + " imagen(es) con dimensiones distintas a la fuente y sin explicacion (limite 5000 px)");
  if (reduced) push("INTENT", "IMG_REDUCIDAS_5000::" + reduced + " de " + devDims.length + " imagenes reducidas a 5000 px de lado largo (limite de Shopify; misma foto) [DOC:import/image-resolution-fix.csv]");
  const dimsVs = other ? "DIFERENTE (" + other + ")" : reduced ? reduced + "_REDUCIDAS_A_5000_PX+" + same + "_IGUALES_A_LA_FUENTE" : "IGUALES_A_LA_FUENTE";
  // baja resolucion: criterio [INFERIDO] de listado = lado largo < 1200 px; se compara con la fuente para decir si es limite del original
  const lowHere = devDims.map(([w, h], i) => ({ i, w, h })).filter((x) => Math.max(x.w, x.h) < 1200);
  if (lowHere.length) {
    const allSame = lowHere.every((x) => imageDetail.find((d) => d.handle === handle && d.pos === x.i + 1).kind === "IGUAL");
    note("IMG_BAJA_RESOLUCION::imagen(es) de baja resolucion (lado largo < 1200 px [INFERIDO]): " + lowHere.map((x) => "pos " + (x.i + 1) + " " + x.w + "x" + x.h).join(", ") + (allSame ? " = mismas dimensiones que la fuente (limite del original, heredado del sitio actual)" : " (revisar contra la fuente)"));
  }

  // ---- descripcion
  const dCur = p ? p.description : "";
  const dMasterEq = m && nfc(m.description).replace(/\r/g, "") === nfc(dCur).replace(/\r/g, "");
  const dLdEq = cur.ldProduct && cur.ldProduct.description === dCur;
  const a1 = L1(dCur), b1 = L1(dev.desc);
  let descMatch, descDetail = "";
  if (a1 === b1) descMatch = "SI";
  else if (L2(dCur) === L2(dev.desc)) { descMatch = "SI_SOLO_PUNTUACION"; descDetail = firstDiff(a1, b1); }
  else { descMatch = "NO"; descDetail = firstDiff(a1, b1); }
  row.description_match = descMatch;
  if (descMatch === "SI_SOLO_PUNTUACION") push("INTENT", "DESCRIPCION_PUNTUACION::descripcion: solo cambia la puntuacion (" + descDetail + ")");
  if (descMatch === "NO") push("DIFF", "DESCRIPCION::descripcion distinta (" + descDetail + ")");
  if (!dMasterEq) problems.push(slug + ": descripcion del payload actual != products-master.csv");
  if (!dLdEq) problems.push(slug + ": descripcion del payload actual != JSON-LD");
  const impDescRow = (impMainByH.get(handle) || [])[0];
  const impDescEq = impDescRow ? L1(impDescRow.Description) === L1(dev.desc) : false;
  if (!impDescEq) problems.push(slug + ": descripcion Dev != descripcion del CSV de importacion");

  // ---- corazon, PDP, miga, JSON-LD
  row.wishlist_heart_shopify = dev.heart ? "SI" : "NO";
  if (cur.heartDom && !dev.heart) push("DIFF", "CORAZON::el sitio actual tiene boton de favoritos y Dev no");
  row.pdp_status_shopify = dev.pdp;
  if (dev.pdp !== 200) push("DIFF", "PDP_STATUS::PDP Dev responde " + dev.pdp);
  row.breadcrumb_shopify = dev.crumbs;
  const bcMatch = dev.crumbs === cur.crumbsDom;
  if (!bcMatch) push("DIFF", "MIGA::miga: actual '" + cur.crumbsDom + "' vs Dev '" + dev.crumbs + "' (medida antes de construir RC1.8; el fix esta en la fuente RC1.8, sin re-medir en la Dev Store) [DOC:theme-src/sections/main-product.liquid]");
  row.pdp_jsonld_shopify = dev.ldjson;
  if (dev.h1 !== dev.t) push("DIFF", "H1::h1 Dev '" + dev.h1 + "' != titulo");
  if (dev.robots) push("DIFF", "ROBOTS::PDP Dev con robots='" + dev.robots + "'");
  if (canonPath !== "/products/" + handle) push("DIFF", "CANONICAL::canonical Dev apunta a " + canonPath);
  if (cur.canonical !== cur.url) problems.push(slug + ": canonical del sitio actual (" + cur.canonical + ") != URL rastreada (" + cur.url + ")");

  // ---- etiquetas de busqueda (tags) y hallabilidad del color
  const tags = dev.tg || [];
  const colorNorm = stripAccents(colorShop).toLowerCase();
  const inTitle = stripAccents(dev.t).toLowerCase().includes(colorNorm);
  const inDesc = stripAccents(dev.desc).toLowerCase().includes(colorNorm);
  const inTag = tags.some((t) => stripAccents(t).toLowerCase() === colorNorm);
  const findable = [inTitle ? "titulo" : null, inDesc ? "descripcion" : null, inTag ? "tag" : null].filter(Boolean).join("+");
  if (!findable) push("DIFF", "COLOR_NO_HALLABLE::el color '" + colorShop + "' no aparece en titulo, descripcion ni tags: la busqueda por color no lo encuentra");
  if (tags.length) push("INTENT", "TAG_BUSQUEDA::tag de busqueda '" + tags.join(",") + "' agregado en Shopify (el color no esta en titulo ni descripcion) [DOC:catalog/color-search-tag-map.csv]");
  const stm = searchTagByHandle.get(handle);
  if (stm && (stm.search_tag_needed === "SI") !== (tags.length > 0)) problems.push(slug + ": color-search-tag-map.csv no coincide con los tags Dev");

  // ---- inventario
  const audit = auditByHandle.get(handle);
  const stockTxt = p ? Object.entries(p.sizeStock).map(([k, v]) => k + ":" + v).join("|") : "";
  if (audit) {
    const cmp = [
      ["title_match", audit.title_match === "true", row.title_match === "SI"],
      ["sku_option_match", audit.sku_option_match === "true", row.sku_match === "SI"],
      ["price_cop_match", audit.price_cop_match === "true", priceOk],
      ["compare_at_match", audit.compare_at_match === "true", priceOk],
      ["image_order_match", audit.image_order_match === "true", orderEq],
      ["variants_shopify", Number(audit.variants_shopify) === dev.vr.length, true],
      ["images_shopify", Number(audit.images_shopify) === dev.im.length, true],
    ];
    for (const [k, a, b] of cmp) if (a !== b) problems.push(slug + ": shopify-post-import-audit.csv (" + k + ") contradice esta medicion");
    if (audit.inventory_tracked !== "NO") problems.push(slug + ": inventory_tracked != NO");
  }

  // ---- notas fijas por caso conocido
  if (slug !== handle) {
    const lowerProbe = probeIndex.find((x) => x.path === "/producto/" + handle);
    note("URL_ACTUAL_MAYUSCULA::URL actual con mayuscula en el sitemap y en la ficha [MEDIDO-03G sitemap.xml.txt]" + (lowerProbe ? "; la variante en minusculas responde " + lowerProbe.status + " en el sitio actual [MEDIDO-03G launch/evidence/current-site-probe/index.json]" : ""));
  }

  // ---- resultado
  // (1) estado del REGISTRO del producto: campos de la ficha (titulo, coleccion, color, tallas, SKU, precio, imagenes, descripcion, miga, PDP)
  const hasRecDiff = diffs.some((d) => d.k === "DIFF");
  const hasInt = diffs.some((d) => d.k === "INTENT");
  row.overall_registro_producto = hasRecDiff ? "DIFFERENCE" : hasInt ? "RECONCILED_WITH_INTENTIONAL_DIFFERENCE" : "RECONCILED";
  // (2) diferencias abiertas que afectan a los 29 y no son intencionales (verificacion 03G): orden por defecto en la coleccion e inventario
  const posCur = curPage.indexOf(slug) >= 0 ? curPage.indexOf(slug) + 1 : "";
  const posShop = catHandle && devColl.get(catHandle) ? devColl.get(catHandle).order.indexOf(handle) + 1 : "";
  const orderOk = posCur !== "" && posCur === posShop;
  const invOk = !!audit && audit.inventory_tracked !== "NO"; // sin rastreo en Dev = no hay paridad con el stock por talla del sitio actual
  row.collection_order_match = orderOk ? "SI" : "NO";
  row.inventory_match = invOk ? "SI" : "NO";
  if (!orderOk) push("DIFF", "ORDEN_COLECCION::posicion en el orden por defecto de " + catCur + ": sitio actual " + posCur + " vs Dev " + posShop + " (el sitio actual ordena por 'Novedades', la Dev por orden manual; sin decision documentada) [MEDIDO-03G current-site/" + (catHandle || "") + ".html, dev-collections.json]");
  if (!invOk) push("DIFF", "INVENTARIO::el sitio actual publica stock por talla (" + stockTxt + ") y la Dev no rastrea inventario (inventory_tracked=" + (audit ? audit.inventory_tracked : "?") + "): sin cantidades cargadas Shopify vendria sin limite; pendiente de la duena [MEDIDO-03G producto_*.html; DOC:catalog/shopify-post-import-audit.csv]");
  const hasDiff = diffs.some((d) => d.k === "DIFF");
  row.overall = hasDiff ? "DIFFERENCE" : hasInt ? "RECONCILED_WITH_INTENTIONAL_DIFFERENCE" : "RECONCILED";
  const dText = diffs.map((d) => (d.k === "DIFF" ? "DIFERENCIA: " : "INTENCIONAL: ") + d.t);
  row.notes = [...dText, ...notes].join(" || ");

  // ---- extras (despues de las columnas pedidas)
  row.collections_shopify_membership = mem.join("+");
  row.collection_pos_current = curPage.indexOf(slug) >= 0 ? curPage.indexOf(slug) + 1 : "";
  row.collection_pos_shopify = catHandle && devColl.get(catHandle) ? devColl.get(catHandle).order.indexOf(handle) + 1 : "";
  row.destacados_current_home = inHomeCur ? "Sí" : "No";
  row.destacados_current_featured_flag = featuredCur ? "Sí" : "No";
  row.tags_shopify = tags.join("|");
  row.color_findable_by = findable;
  row.sizes_variants_master_2026_09_28 = sizesMaster.join("/");
  row.sku_prefix = skuPrefix;
  row.price_display_shopify = dev.priceTxt;
  row.discount_pct_current = p ? p.activeDiscountPercent : "";
  row.image_dims_shopify = dev.imd.join("|");
  row.image_dims_vs_source = dimsVs;
  row.stock_current_public_payload = stockTxt;
  row.stock_total_current = p ? p.totalStock : "";
  row.inventory_shopify = "NO_RASTREADO (inventory_tracked=NO; " + dev.vr.filter((v) => v[4] === true).length + "/" + dev.vr.length + " variantes disponibles)";
  row.breadcrumb_current = cur.crumbsDom;
  row.breadcrumb_match = bcMatch ? "SI" : "NO";
  row.wishlist_heart_current = cur.heartDom ? "SI" : "NO";
  row.pdp_jsonld_current = cur.ldCount + " (" + cur.ldTypes.join("+") + ")";
  row.description_detail = descDetail || (descMatch === "SI" ? "texto igual tras quitar viñetas y espacios; formato: '•' del sitio actual -> lista HTML en Shopify" : "");
  row.evidence = "actual=[MEDIDO-03G launch/evidence/current-site/" + cur.file + "]; shopify=[MEDIDO-03G launch/evidence/dev-products.jsonl,dev-collections.json]; catalogo=[DOC:catalog/products-master.csv,variants-master.csv,shopify-post-import-audit.csv]; imagenes=[DOC:import/shopify-products-03c*.csv,image-resolution-fix.csv,image-dimensions.csv]; redirect=[DOC:seo/shopify-redirects-import.csv]";
  rows.push(row);
}

rows.sort((a, b) => a.shopify_handle.localeCompare(b.shopify_handle));

// ---------------------------------------------------------------- columnas y CSV
const COLS = ["current_slug", "current_url", "shopify_handle", "redirect_source_to_handle_ok", "title_current", "title_shopify", "title_match", "collection_current", "collection_shopify", "collection_match", "destacados_member", "color_current", "color_shopify", "color_match", "sizes_current", "sizes_shopify", "sizes_match", "sku_current", "sku_shopify", "sku_match", "price_original_current", "price_sale_current", "price_shopify", "compare_at_shopify", "price_match", "image_count_current", "image_count_shopify", "image_order_match", "image_min_dimension_shopify", "description_match", "wishlist_heart_shopify", "pdp_status_shopify", "breadcrumb_shopify", "pdp_jsonld_shopify", "overall", "notes",
  "collections_shopify_membership", "collection_pos_current", "collection_pos_shopify", "destacados_current_home", "destacados_current_featured_flag", "tags_shopify", "color_findable_by", "sizes_variants_master_2026_09_28", "sku_prefix", "price_display_shopify", "discount_pct_current", "image_dims_shopify", "image_dims_vs_source", "stock_current_public_payload", "stock_total_current", "inventory_shopify", "breadcrumb_current", "breadcrumb_match", "wishlist_heart_current", "pdp_jsonld_current", "description_detail", "evidence",
  "overall_registro_producto", "collection_order_match", "inventory_match"];
const csv = [COLS.join(",")].concat(rows.map((r) => COLS.map((c) => csvCell(r[c])).join(","))).join("\n") + "\n";
fs.writeFileSync(OUT_CSV, csv, "utf8");

// ---------------------------------------------------------------- totales y verificaciones globales
const count = (arr, f) => arr.filter(f).length;
const tot = {
  productos_actual: curBySlug.size,
  productos_dev: devProducts.length,
  variantes_dev: devProducts.reduce((s, d) => s + d.vr.length, 0),
  imagenes_dev: devProducts.reduce((s, d) => s + d.im.length, 0),
  variantes_actual_payload: rows.reduce((s, r) => s + String(r.sizes_current).split("/").filter(Boolean).length, 0),
  imagenes_actual_payload: rows.reduce((s, r) => s + Number(r.image_count_current), 0),
  variantes_master_csv: variantsMaster.length,
  imagenes_csv_importacion: (() => { let n = 0; for (const d of devProducts) { const rr = (impImgByH.get(d.h) && impImgByH.get(d.h).length ? impImgByH.get(d.h) : impMainByH.get(d.h) || []).filter((r) => r["Product image URL"]); n += rr.length; } return n; })(),
  skus_unicos_dev: new Set(devProducts.flatMap((d) => d.vr.map((v) => v[1]))).size,
  handles_unicos_dev: new Set(devProducts.map((d) => d.h)).size,
  redirecciones_producto_csv: count(redirects, (r) => r["Redirect from"].startsWith("/producto/")),
  redirecciones_total_csv: redirects.length,
  imagenes_en_image_resolution_fix: resFix.length,
};
const byOverall = {};
for (const r of rows) byOverall[r.overall] = (byOverall[r.overall] || 0) + 1;
const byOverallRecord = {};
for (const r of rows) byOverallRecord[r.overall_registro_producto] = (byOverallRecord[r.overall_registro_producto] || 0) + 1;
const fieldCounts = {};
for (const f of ["redirect_source_to_handle_ok", "title_match", "collection_match", "color_match", "sizes_match", "sku_match", "price_match", "image_order_match", "description_match", "breadcrumb_match", "wishlist_heart_shopify", "wishlist_heart_current", "collection_order_match", "inventory_match"]) {
  fieldCounts[f] = {};
  for (const r of rows) fieldCounts[f][r[f]] = (fieldCounts[f][r[f]] || 0) + 1;
}
const reducedImgs = imageDetail.filter((x) => x.kind === "REDUCIDA_A_5000");
const sameImgs = imageDetail.filter((x) => x.kind === "IGUAL");
const otherImgs = imageDetail.filter((x) => x.kind === "OTRO");
const lowList = lowRes.filter((x) => x.long < 1200).sort((a, b) => a.long - b.long || a.handle.localeCompare(b.handle));
const tagged = devProducts.filter((d) => (d.tg || []).length).map((d) => d.h + ":" + d.tg.join("|"));
const stockNon25 = rows.filter((r) => String(r.stock_current_public_payload).split("|").some((s) => s.split(":")[1] !== "25")).map((r) => r.shopify_handle + " [" + r.stock_current_public_payload + "]");
const destDev = devColl.get("destacados").order;
const destSet = new Set(destDev), homeSet = new Set(curHomeFeatured);
const homeSameSet = destSet.size === homeSet.size && [...destSet].every((x) => homeSet.has(x));
const homeSameOrder = JSON.stringify(destDev) === JSON.stringify(curHomeFeatured);
const collOrder = {};
for (const h of ["oasis-natural", "aurora-viva", "espuma-de-ola"]) {
  const a = curCollectionOrder[h].map((x) => x.toLowerCase()), b = devColl.get(h).order;
  collOrder[h] = { actual: a, dev: b, mismo_conjunto: JSON.stringify([...a].sort()) === JSON.stringify([...b].sort()), mismo_orden: JSON.stringify(a) === JSON.stringify(b), posiciones_iguales: a.filter((x, i) => b[i] === x).length };
}
const prefixMap = {};
for (const r of rows) { const k = r.sku_prefix + " -> " + r.collection_current; prefixMap[k] = (prefixMap[k] || 0) + 1; }
// manifiestos RC1.7 vs RC1.8 (que archivos cambiaron)
let manifestDiff = null;
try {
  const m7 = readJson(path.join(MIG, "dist", "release-manifest-rc1.7.json")).files;
  const m8 = readJson(path.join(MIG, "dist", "release-manifest-rc1.8.json")).files;
  const a = new Map(m7.map((f) => [f.path, f.sha256])), b = new Map(m8.map((f) => [f.path, f.sha256]));
  manifestDiff = {
    rc17_files: m7.length, rc18_files: m8.length,
    changed: [...b.keys()].filter((k) => a.has(k) && a.get(k) !== b.get(k)).sort(),
    added: [...b.keys()].filter((k) => !a.has(k)).sort(),
    removed: [...a.keys()].filter((k) => !b.has(k)).sort(),
  };
} catch (e) { manifestDiff = { error: String(e) }; }

const summary = {
  script: "launch/tools/03g-product-parity.mjs",
  totales: tot,
  overall: byOverall,
  overall_registro_producto: byOverallRecord,
  campos: fieldCounts,
  destacados: { dev: destDev, home_actual: curHomeFeatured, mismo_conjunto: homeSameSet, mismo_orden: homeSameOrder, featured_true_actual: rows.filter((r) => r.destacados_current_featured_flag === "Sí").map((r) => r.current_slug) },
  orden_colecciones: collOrder,
  tags_shopify: tagged,
  stock_actual_distinto_de_25: stockNon25,
  imagenes: { total: imageDetail.length, iguales_a_la_fuente: sameImgs.length, reducidas_a_5000: reducedImgs.length, otras: otherImgs.length, con_sufijo_uuid: devProducts.flatMap((d) => d.im.filter((n) => shopifyFileId(n) + ".jpg" !== n).map((n) => d.h + ":" + n)), productos_con_reducidas: [...new Set(reducedImgs.map((x) => x.handle))].sort() },
  imagenes_lado_largo_menor_a_1200: lowList,
  distribucion_prefijo_sku_coleccion: prefixMap,
  manifiestos_rc17_vs_rc18: manifestDiff,
  motivos_por_producto: Object.fromEntries(Object.keys(reasons).sort().map((k) => [k, reasons[k].slice().sort()])),
  problemas_de_fuentes: problems,
  dev_routes_redirects: devRoutes.redirects,
};
fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 1) + "\n", "utf8");

// ---------------------------------------------------------------- stdout
console.log("CSV:", path.relative(MIG, OUT_CSV), "filas:", rows.length, "columnas:", COLS.length);
console.log("TOTALES:", JSON.stringify(tot));
console.log("OVERALL:", JSON.stringify(byOverall));
console.log("OVERALL (solo registro del producto, sin orden de coleccion ni inventario):", JSON.stringify(byOverallRecord));
for (const [k, v] of Object.entries(fieldCounts)) console.log("  ", k, JSON.stringify(v));
console.log("DESTACADOS:", JSON.stringify(summary.destacados));
console.log("ORDEN COLECCIONES:", JSON.stringify(Object.fromEntries(Object.entries(collOrder).map(([k, v]) => [k, { mismo_conjunto: v.mismo_conjunto, mismo_orden: v.mismo_orden, posiciones_iguales: v.posiciones_iguales }]))));
console.log("TAGS:", tagged.join(", "));
console.log("STOCK actual != 25 por talla:", stockNon25.join("; "));
console.log("IMAGENES:", JSON.stringify(summary.imagenes.total), "iguales", sameImgs.length, "reducidas", reducedImgs.length, "otras", otherImgs.length, "uuid", JSON.stringify(summary.imagenes.con_sufijo_uuid));
console.log("IMAGENES lado largo < 1200:", lowList.length);
for (const x of lowList) console.log("   ", x.handle, "pos", x.pos, "dev", x.shopify, "fuente", x.src, x.kind);
console.log("PREFIJO SKU -> coleccion:", JSON.stringify(prefixMap));
console.log("MANIFIESTOS RC1.7 vs RC1.8:", JSON.stringify(manifestDiff));
console.log("MOTIVOS:");
for (const k of Object.keys(reasons).sort()) console.log("  ", k, "(" + reasons[k].length + "):", reasons[k].slice().sort().join(", "));
console.log("PROBLEMAS DE FUENTES (" + problems.length + "):");
for (const x of problems) console.log("  -", x);
console.log("---- filas con DIFFERENCE en el registro del producto (sin contar orden de coleccion ni inventario):");
for (const r of rows.filter((x) => x.overall_registro_producto === "DIFFERENCE")) console.log(" *", r.shopify_handle, "|", r.overall_registro_producto, "|", r.notes.slice(0, 700));
