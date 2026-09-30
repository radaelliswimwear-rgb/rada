#!/usr/bin/env node
// 03G -- VERIFICADOR ADVERSARIAL de la paridad de colecciones.
// Determinista y OFFLINE: solo lee launch/evidence/**, CSV del repo, theme-src/** y el codigo del sitio actual
// dentro del worktree. No usa red. No comparte codigo con 03g-collection-parity.mjs (parte de la evidencia cruda).
// Uso: node launch/tools/03g-collection-parity-verify.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, "..", "..");
const WT = path.resolve(MIG, "..");
const EV = path.join(MIG, "launch", "evidence");
const rd = (...p) => fs.readFileSync(path.join(...p), "utf8");
const out = [];
const P = (s = "") => out.push(s);
let fails = 0;
const chk = (name, ok, detail = "") => {
  P("- [" + (ok ? "OK" : "FALLA") + "] " + name + (detail ? ": " + detail : ""));
  if (!ok) fails++;
};
const uniq = (a) => [...new Set(a)];
const eqArr = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const eqSet = (a, b) => eqArr([...a].sort(), [...b].sort());

// ---------- utilidades ----------
function csv(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c === "\r") { /* ignorar */ }
    else cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  const hdr = rows.shift();
  return rows.filter((r) => r.length > 1 || r[0] !== "").map((r) => Object.fromEntries(hdr.map((h, i) => [h, r[i] ?? ""])));
}
function rscText(html) {
  const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  let o = "", m;
  while ((m = re.exec(html))) o += JSON.parse(m[1]);
  return o;
}
function arrayAt(t, idx) {
  let d = 0, ins = false, esc = false;
  for (let i = idx; i < t.length; i++) {
    const c = t[i];
    if (ins) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') ins = false; continue; }
    if (c === '"') ins = true;
    else if (c === "[") d++;
    else if (c === "]") { d--; if (d === 0) return t.slice(idx, i + 1); }
  }
  return null;
}
function rscProductArrays(html) {
  const t = rscText(html);
  const res = [];
  const re = /"products":\[/g;
  let m;
  while ((m = re.exec(t))) { try { res.push(JSON.parse(arrayAt(t, m.index + 11))); } catch { /* ignorar */ } }
  return res;
}
const stripScripts = (h) => h.replace(/<script[\s\S]*?<\/script>/g, "");
const ssrHandles = (h) => uniq([...stripScripts(h).matchAll(/href="\/producto\/([^"#?]+)"/g)].map((m) => m[1]));
const low = (a) => a.map((x) => x.toLowerCase());
const cuidTs = (id) => parseInt(id.slice(1, 9), 36);
const fileOf = (u) => u.split("/").pop();

const COLS = ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"];
const TITLE = { "oasis-natural": "Oasis Natural", "aurora-viva": "Aurora Viva", "espuma-de-ola": "Espuma de Ola", "salidas-de-bano": "Salidas de Baño", destacados: "Destacados", frontpage: "Home page" };
const cur = {};
for (const c of COLS) {
  const html = rd(EV, "current-site", c + ".html");
  const ssr = stripScripts(html);
  const arr = rscProductArrays(html)[0] || [];
  const cnt = ssr.match(/(\d+)(?:<!-- -->)?\s*(?:<!-- -->)?\s*productos<\/span>/);
  const rc = rscText(html).match(/"resultCount":(\d+)/);
  cur[c] = { html, ssr, hrefs: ssrHandles(html), rsc: arr, countText: cnt ? +cnt[1] : null, resultCount: rc ? +rc[1] : null };
}
const devCols = Object.fromEntries(JSON.parse(rd(EV, "dev-collections.json")).collections.map((c) => [c.h, c]));
const devProducts = rd(EV, "dev-products.jsonl").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const devBy = Object.fromEntries(devProducts.map((p) => [p.h, p]));
const devHome = JSON.parse(rd(EV, "dev-home.json"));
const homeHtml = rd(EV, "current-site", "home.html");
const homeArrays = rscProductArrays(homeHtml);
const prodMaster = csv(rd(MIG, "catalog", "products-master.csv"));
const colMaster = csv(rd(MIG, "collections", "collections-master.csv"));
const importCsv = csv(rd(MIG, "import", "shopify-products-03c.csv"));

P("# Verificacion 03G -- paridad de colecciones (salida literal, offline)");
P("");

// ============ V1 MEMBRESIA ============
P("## V1. Membresia desde el HTML crudo");
P("");
P("| Coleccion | SSR href /producto | RSC products | texto 'N productos' | RSC resultCount | Dev n | Dev order | collections-master | products-master (col. collection) | dev-products (ty) | conjunto actual == Dev (sin distinguir mayusculas) |");
P("|---|---|---|---|---|---|---|---|---|---|---|");
for (const c of COLS) {
  const a = cur[c], d = devCols[c];
  const cm = colMaster.find((r) => r.slug === c);
  const pm = prodMaster.filter((r) => r.collection === c).length;
  const dt = devProducts.filter((p) => p.ty === TITLE[c]).length;
  const same = eqSet(low(a.hrefs), d.order) && eqSet(low(a.rsc.map((x) => x.slug)), d.order);
  P(["", c, a.hrefs.length, a.rsc.length, a.countText, a.resultCount, d.n, d.order.length, cm ? cm.products_count : "n/a", pm, dt, same ? "IGUAL" : "DISTINTO", ""].join(" | ").trim());
  chk(c + " membresia 10/12/7/0 coherente en 9 fuentes", [a.hrefs.length, a.rsc.length, a.countText, a.resultCount, d.n, d.order.length, +cm.products_count, pm, dt].every((x) => x === a.rsc.length) && same);
}
chk("cifras 10/12/7/0", eqArr(COLS.map((c) => cur[c].hrefs.length), [10, 12, 7, 0]));
const devAll = uniq(["oasis-natural", "aurora-viva", "espuma-de-ola"].flatMap((c) => devCols[c].order));
chk("29 productos Dev en una sola coleccion, sin repetidos", devAll.length === 29 && devProducts.length === 29 && ["oasis-natural", "aurora-viva", "espuma-de-ola"].reduce((s, c) => s + devCols[c].order.length, 0) === 29);
chk("las 3 colecciones actuales cubren los mismos 29 handles que Dev (sin mayusculas)", eqSet(low(["oasis-natural", "aurora-viva", "espuma-de-ola"].flatMap((c) => cur[c].hrefs)), devAll));
chk("Dev: product_type == titulo de coleccion para todos los productos de la coleccion", ["oasis-natural", "aurora-viva", "espuma-de-ola"].every((c) => devCols[c].order.every((h) => devBy[h].ty === TITLE[c])));
chk("Dev: destacados n=7 y frontpage n=0", devCols.destacados.n === 7 && devCols.destacados.order.length === 7 && devCols.frontpage.n === 0);
const mixed = ["oasis-natural", "aurora-viva", "espuma-de-ola"].flatMap((c) => cur[c].hrefs).filter((h) => h !== h.toLowerCase());
P("Handles del sitio actual con mayusculas: " + (mixed.join(", ") || "ninguno") + " (Shopify los pone en minuscula; hay redireccion segun dev-routes.json 'variantes de mayusculas').");
P("");

// ============ V2 ORDEN ============
P("## V2. Orden por defecto");
P("");
const listRev = (type) => uniq(importCsv.filter((r) => r["Type"] === type).map((r) => r["URL handle"])).reverse();
const cuidOrderOk = {};
const CUR_ORD = {}, DEV_ORD = {};
for (const c of ["oasis-natural", "aurora-viva", "espuma-de-ola"]) {
  const a = low(cur[c].hrefs), d = devCols[c].order;
  CUR_ORD[c] = a; DEV_ORD[c] = d;
  const match = a.filter((x, i) => x === d[i]).length;
  P("### " + TITLE[c] + " -- posiciones que coinciden: " + match + " de " + a.length);
  P("| Pos | Actual | Dev |");
  P("|---|---|---|");
  a.forEach((x, i) => P("| " + (i + 1) + " | " + x + " | " + d[i] + " |"));
  P("");
  chk(c + ": orden DISTINTO en todas las posiciones (0 coincidencias)", match === 0, match + " coincidencias");
  chk(c + ": Dev == inverso del orden de import/shopify-products-03c.csv (Type)", eqArr(d, listRev(TITLE[c])));
  const pmRev = prodMaster.filter((r) => r.collection === c).map((r) => r.slug.toLowerCase()).reverse();
  chk(c + ": Dev == inverso del orden de catalog/products-master.csv", eqArr(d, pmRev));
  const pmFwd = prodMaster.filter((r) => r.collection === c).map((r) => r.slug.toLowerCase());
  chk(c + ": actual != orden de products-master.csv (para confirmar que el CSV no es fuente del orden actual)", !eqArr(a, pmFwd));
  // cuid v1: 'c' + timestamp base36 (8 car.) -> createdAt aproximado
  const ts = cur[c].rsc.map((p) => ({ h: p.slug.toLowerCase(), id: p.id, ts: cuidTs(p.id) }));
  const asc = ts.every((x, i) => i === 0 || x.ts >= ts[i - 1].ts);
  cuidOrderOk[c] = asc;
  P("id (cuid) -> fecha embebida, en el orden actual de la pagina: " + ts.map((x) => x.h + "=" + new Date(x.ts).toISOString().slice(0, 19)).join("; "));
  chk(c + ": el orden actual es no decreciente por el timestamp embebido en el id (createdAt asc)", asc);
  P("");
}
P("Nota: el timestamp embebido en un id cuid v1 es la fecha en que se genero el id [INFERIDO: normalmente = creacion de la fila]. Si el id lo asigno el codigo en el alta, corrobora createdAt asc.");
P("");

// ---- Home editorial
const homeEditorial = homeArrays[0].map((p) => p.slug.toLowerCase());
const homeFeat = homeArrays[1].map((p) => p.slug.toLowerCase());
const devEd = devHome.sections.find((s) => s.id === "featured-collection-editorial").products;
const devFeat = devHome.sections.find((s) => s.id === "featured-products").products;
P("### Home: editorial (8 primeras de Oasis)");
P("Actual (home.html): " + homeEditorial.join(", "));
P("Dev (dev-home.json): " + devEd.join(", "));
chk("editorial actual == 8 primeras de Oasis en orden actual", eqArr(homeEditorial, CUR_ORD["oasis-natural"].slice(0, 8)));
chk("editorial Dev == 8 primeras de Oasis en orden Dev", eqArr(devEd, DEV_ORD["oasis-natural"].slice(0, 8)));
const onlyCur = homeEditorial.filter((x) => !devEd.includes(x)), onlyDev = devEd.filter((x) => !homeEditorial.includes(x));
P("Solo actual: " + onlyCur.join(", ") + " | solo Dev: " + onlyDev.join(", "));
chk("la editorial cambia 2 de 8 tarjetas", onlyCur.length === 2 && onlyDev.length === 2);
{
  // corroboracion del orden Dev desde HTML (no solo products.json): la tarjeta de categoria de la Home usa la imagen del
  // primer producto de la coleccion (collection.featured_image)
  const fc = devHome.sections.find((s) => s.id === "featured-categories");
  const hs = fc.imgNames.map((x) => (x.match(/\((.+)\)/) || [])[1]);
  const firsts = ["oasis-natural", "aurora-viva", "espuma-de-ola"].map((c) => devCols[c].order[0]);
  P("Home Dev, imagen de respaldo de las tarjetas de categoria (producto): " + hs.join(", ") + " | primer producto de Oasis/Aurora/Espuma en el orden Dev: " + firsts.join(", "));
  chk("HTML de la Home Dev confirma el primer producto de las 3 colecciones (orden Dev de products.json)", eqArr(hs, firsts));
}
P("");

// ============ V3 DESTACADOS ============
P("## V3. Destacados");
P("");
const featFlags = {};
for (const c of COLS) featFlags[c] = cur[c].rsc.filter((p) => p.featured).map((p) => p.slug.toLowerCase());
P("featured=true por coleccion: " + COLS.map((c) => c + " " + featFlags[c].length + " [" + featFlags[c].join(", ") + "]").join("; "));
const featAll = COLS.flatMap((c) => featFlags[c]);
chk("featured=true total = 10", featAll.length === 10);
const featMinusEd = featAll.filter((x) => !homeEditorial.includes(x));
chk("featured=true menos editorial = 7 y == destacados Home actual", featMinusEd.length === 7 && eqSet(featMinusEd, homeFeat));
chk("Home actual (destacados) == Dev destacados (conjunto)", eqSet(homeFeat, devFeat) && eqSet(homeFeat, devCols.destacados.order));
chk("dev-home featured-products == coleccion destacados en el mismo orden", eqArr(devFeat, devCols.destacados.order));
const samples = [homeFeat];
for (const n of [1, 2, 3]) {
  const arr = rscProductArrays(rd(EV, "03g-collection-filter-probe", "home-sample-" + n + ".html"));
  samples.push(arr[1].map((p) => p.slug.toLowerCase()));
  chk("home-sample-" + n + ": editorial == home.html (sin barajar)", eqArr(arr[0].map((p) => p.slug.toLowerCase()), homeEditorial));
}
P("Ordenes de destacados en 4 muestras: ");
samples.forEach((s, i) => P("  muestra " + (i + 1) + ": " + s.join(", ")));
chk("las 4 muestras tienen el mismo conjunto", uniq(samples.map((s) => [...s].sort().join(","))).length === 1);
const nOrders = uniq(samples.map((s) => s.join(">"))).length;
P("Ordenes distintos entre las 4 muestras: " + nOrders);
chk("el actual baraja (mas de un orden entre las 4 muestras)", nOrders > 1, nOrders + " ordenes distintos");
const inHomeRsc = rscText(homeHtml);
P("Destacados Dev: robots='" + devCols.destacados.robots + "', metaDescChars=" + devCols.destacados.metaDescChars + ", canon=" + devCols.destacados.canon);
{
  const sm = rd(EV, "current-site", "sitemap.xml.txt");
  chk("/destacados NO esta en el sitemap actual ni en el rastreo", !/\/destacados/.test(sm) && !JSON.parse(rd(EV, "current-site", "index.json")).some((r) => /\/destacados$/.test(r.url)));
}
P("");

// ============ V4 TARJETAS ============
P("## V4. Tarjetas y precios (29 productos)");
P("");
const money = (n) => "$ " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
let tOk = 0, bOk = 0, pOk = 0, cOk = 0, dOk = 0, iOk = 0, iNorm = 0, priceTxtOk = 0, sizeOk = 0;
const sizeDiffs = [];
for (const c of ["oasis-natural", "aurora-viva", "espuma-de-ola"]) {
  for (const p of cur[c].rsc) {
    const h = p.slug.toLowerCase(), d = devBy[h];
    const dp = +d.vr[0][2], dc = +d.vr[0][3];
    if (p.name === d.t) tOk++;
    if (p.category === d.ty) bOk++;
    if (p.priceValue === Math.round(dp)) pOk++;
    if (p.originalPriceValue === Math.round(dc)) cOk++;
    const pct = Math.round(((dc - dp) * 100) / dc);
    if (p.activeDiscountPercent === pct) dOk++;
    const a2 = p.images.slice(0, 2).map(fileOf), d2 = d.im.slice(0, 2);
    const norm = (x) => x.replace(/\.(jpg|png|webp)$/i, "").replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "");
    if (eqArr(a2.map(norm), d2.map(norm))) iNorm++;
    if (eqArr(a2, d2)) iOk++; else P("AVISO imagenes: " + h + " actual " + p.images.slice(0, 3).map(fileOf).join(",") + " / Dev " + d.im.slice(0, 3).join(","));
    if (d.priceTxt === money(dp) + " Precio anterior " + money(dc) + " -" + pct + "%") priceTxtOk++;
    if (eqArr(p.sizes, d.vr.map((v) => v[0]))) sizeOk++; else sizeDiffs.push(h + ": actual " + p.sizes.join("|") + " / Dev " + d.vr.map((v) => v[0]).join("|"));
    if (d.vr.some((v) => v[2] !== d.vr[0][2] || v[3] !== d.vr[0][3])) P("AVISO: precio distinto entre variantes en " + h);
  }
}
chk("titulo igual 29/29", tOk === 29, tOk + "/29");
chk("categoria/badge (category == product_type) 29/29", bOk === 29, bOk + "/29");
chk("precio final actual == precio Dev 29/29", pOk === 29, pOk + "/29");
chk("precio anterior 29/29", cOk === 29, cOk + "/29");
chk("porcentaje 29/29", dOk === 29, dOk + "/29");
chk("2 primeras imagenes (nombre base y orden, sin el sufijo _uuid de Shopify) 29/29", iNorm === 29, iNorm + "/29");
chk("2 primeras imagenes con el nombre de archivo EXACTO: 28/29 (1 con sufijo _uuid agregado por Shopify)", iOk === 28, iOk + "/29");
chk("priceTxt de la ficha Dev con el mismo formato en 29/29", priceTxtOk === 29, priceTxtOk + "/29");
P("Diferencias de tallas actual vs Dev (variantes): " + (sizeDiffs.join("; ") || "ninguna"));
chk("solo alba-dorada-cafe-claro difiere en tallas", sizeDiffs.length === 1 && /^alba-dorada-cafe-claro/.test(sizeDiffs[0]));
// ficha de alba-dorada-cafe-claro
{
  const pg = rd(EV, "current-site", "producto_alba-dorada-cafe-claro.html");
  const t = rscText(pg);
  const m = t.match(/"sizeStock":(\{[^}]*\})/);
  P("Ficha actual alba-dorada-cafe-claro sizeStock: " + (m ? m[1] : "NOT_FOUND"));
  const sc = JSON.parse(rd(MIG, "source-of-truth", "public-scrape-raw.json")).products.find((x) => x.slug === "alba-dorada-cafe-claro");
  P("Scrape 2026-09-28 tallas: " + JSON.stringify(sc.sizes) + "; lastmod scrape: " + sc.lastmod);
  const sm = rd(EV, "current-site", "sitemap.xml.txt");
  const lm = sm.match(/alba-dorada-cafe-claro<\/loc>\s*<lastmod>([^<]+)/);
  P("lastmod del sitemap actual: " + (lm ? lm[1] : "NOT_FOUND") + " (igual al del scrape: " + (lm && lm[1] === sc.lastmod ? "SI" : "NO") + "; el lastmod no cambia al quitar una variante, asi que no prueba cuando ocurrio).");
  chk("la ficha actual tambien muestra solo S/M/L", m && m[1] === '{"S":25,"M":25,"L":25}');
  const dvv = devBy["alba-dorada-cafe-claro"].vr.map((v) => v[0]).join("|");
  chk("Dev tiene S|M|L|XL para ese producto", dvv === "S|M|L|XL");
  const vm = csv(rd(MIG, "catalog", "variants-master.csv")).filter((r) => r.product_name === "ALBA DORADA CAFÉ CLARO" || r.product_sku === "LG-AUR-000001").map((r) => r.size);
  P("variants-master.csv (base de la importacion) para ese SKU: " + vm.join("|"));
}
P("");

// ============ V5 BANNER ============
P("## V5. Banner y descripcion");
P("");
for (const c of COLS) {
  const t = rscText(cur[c].html);
  const img = t.match(/"imageUrl":"([^"]+)"/);
  const px = t.match(/"posX":([-\d.]+|null)/), py = t.match(/"posY":([-\d.]+|null)/), zm = t.match(/"zoom":([-\d.]+|null)/);
  const vid = /"videoUrl":"[^"]+"/.test(t) || /<video/.test(cur[c].ssr);
  const desc = (cur[c].ssr.match(/<p class="mt-2 max-w-md text-sm text-white\/80">([^<]*)<\/p>/) || [])[1] || "";
  const meta = (cur[c].ssr.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  const dd = devCols[c];
  P("- " + c + ": imagen=" + (img ? img[1].split("/").slice(-4).join("/") : "NO") + "; posX=" + (px && px[1]) + " posY=" + (py && py[1]) + " zoom=" + (zm && zm[1]) + "; video=" + vid + "; descripcion actual " + desc.length + " car., meta " + meta.length + " car., meta==descripcion: " + (desc === meta) + "; Dev bannerImg=" + dd.bannerImg + " metaDescChars=" + dd.metaDescChars);
  chk(c + ": actual con imagen y sin video; Dev sin imagen", !!img && !vid && dd.bannerImg === false);
  chk(c + ": largo de descripcion actual == metaDescChars Dev (solo el largo)", desc.length === dd.metaDescChars);
}
{
  const man = csv(rd(MIG, "content", "media", "media-migration-manifest.csv"));
  const map = { "oasis-natural": "M10", "aurora-viva": "M11", "espuma-de-ola": "M12", "salidas-de-bano": "M13" };
  for (const c of COLS) {
    const t = rscText(cur[c].html);
    const img = t.match(/"imageUrl":"([^"]+)"/);
    const r = man.find((x) => x.id === map[c]);
    chk(c + ": la imagen del HTML actual == fuente del manifiesto " + map[c] + " (" + r.status + ")", img && img[1] === r.source);
  }
}
chk("las 6 colecciones Dev sin imagen de banner", Object.values(devCols).every((c) => c.bannerImg === false));
P("");

// ============ V6 FILTROS / SORT (HTML actual + sondeos) ============
P("## V6. Filtros y orden");
P("");
const ph = rd(WT, "lib", "placeholder-data.ts");
const arrOf = (name) => [...(ph.match(new RegExp("export const " + name + " = \\[([\\s\\S]*?)\\]")) || [, ""])[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const SIZE_OPTS = arrOf("SIZE_OPTIONS"), COLOR_OPTS = arrOf("COLOR_OPTIONS");
P("Constantes del codigo -- tallas: " + SIZE_OPTS.join(", ") + " | colores: " + COLOR_OPTS.join(", "));
{
  const s = cur["oasis-natural"].ssr;
  const seg = (a, b) => s.slice(s.indexOf(">" + a + "</h3>"), b ? s.indexOf(">" + b + "</h3>") : s.indexOf(">" + a + "</h3>") + 6000);
  const btn = (x) => [...x.matchAll(/aria-pressed="(?:true|false)"[^>]*>([^<]+)<\/button>/g)].map((m) => m[1]);
  const tallas = btn(seg("Talla", "Color"));
  const colores = btn(seg("Color", "Precio"));
  const precio = [...seg("Precio").matchAll(/type="checkbox"[^>]*\/?>([^<]+)<\/label>/g)].map((m) => m[1]);
  const orden = [...s.matchAll(/<option value="(novedades|precio-asc|precio-desc)"[^>]*>([^<]+)<\/option>/g)].map((m) => m[1] + "=" + m[2]);
  P("HTML actual (Oasis) -- Talla: " + tallas.join(" · ") + " | Color: " + colores.join(" · ") + " | Precio: " + precio.join(" · ") + " | Orden: " + orden.join(" | "));
  chk("tallas HTML == SIZE_OPTIONS", eqArr(tallas, SIZE_OPTS));
  chk("colores HTML == COLOR_OPTIONS", eqArr(colores, COLOR_OPTS));
  chk("precio HTML tiene 4 tramos", precio.length === 4);
  chk("orden HTML: novedades, precio-asc, precio-desc", orden.length >= 3 && orden.slice(0, 3).join("|") === "novedades=Novedades|precio-asc=Precio: menor a mayor|precio-desc=Precio: mayor a menor");
  // mismos grupos en las otras 3 colecciones
  for (const c of COLS.slice(1)) {
    const s2 = cur[c].ssr;
    chk(c + ": mismos grupos Talla/Color/Precio en el HTML", ["Talla", "Color", "Precio", "Ordenar por"].every((g) => s2.includes(">" + g + "</h3>")));
  }
}
// sondeos
const probeIdx = JSON.parse(rd(EV, "03g-collection-filter-probe", "index.json"));
const probe = {};
for (const r of probeIdx) {
  const html = rd(EV, "03g-collection-filter-probe", r.file);
  const arr = rscProductArrays(html)[0] || [];
  const cnt = stripScripts(html).match(/(\d+)(?:<!-- -->)?\s*(?:<!-- -->)?\s*productos<\/span>/);
  probe[r.name] = { status: r.status, hrefs: ssrHandles(html), rsc: arr, countText: cnt ? +cnt[1] : null, ssr: stripScripts(html) };
}
P("");
P("| Sondeo | HTTP | contador | tarjetas SSR | RSC |");
P("|---|---|---|---|---|");
for (const r of probeIdx.filter((x) => !x.name.startsWith("home"))) {
  const p = probe[r.name];
  P("| " + r.path + " | " + p.status + " | " + p.countText + " | " + p.hrefs.length + " | " + p.rsc.length + " |");
}
const pv = (n) => probe[n];
chk("talla=S devuelve 10", pv("oasis-talla-S").countText === 10 && pv("oasis-talla-S").hrefs.length === 10);
chk("color=Beige devuelve 0", pv("oasis-color-titlecase-Beige").countText === 0 && pv("oasis-color-titlecase-Beige").hrefs.length === 0);
chk("color=BEIGE devuelve 3", pv("oasis-color-uppercase-BEIGE").countText === 3 && pv("oasis-color-uppercase-BEIGE").hrefs.length === 3);
chk("precio=menos-50 devuelve 0", pv("oasis-precio-menos-50").countText === 0);
chk("precio=mas-200 devuelve 10", pv("oasis-precio-mas-200").countText === 10);
P("Estado vacio (color=Beige): " + ((pv("oasis-color-titlecase-Beige").ssr.match(/No hay productos que coincidan con estos filtros\.[\s\S]{0,400}?Probá quitando algún filtro para ver más resultados\./) || ["NO"])[0].replace(/<[^>]+>/g, " / ").replace(/\s+/g, " ")));
// cobertura por datos
const allCur = ["oasis-natural", "aurora-viva", "espuma-de-ola"].flatMap((c) => cur[c].rsc);
const cnt = (f) => allCur.filter(f).length;
P("Cobertura de tallas (29 productos): " + SIZE_OPTS.map((s) => s + "=" + cnt((p) => p.sizes.includes(s))).join(", "));
P("Cobertura de colores con igualdad exacta: " + COLOR_OPTS.map((c) => c + "=" + cnt((p) => p.color === c)).join(", ") + "; sin distinguir mayusculas: " + COLOR_OPTS.map((c) => c + "=" + cnt((p) => p.color.toLowerCase() === c.toLowerCase())).join(", "));
P("Valores distintos de color: " + uniq(allCur.map((p) => p.color)).sort().join(" | "));
chk("ninguna opcion de color coincide de forma exacta con algun producto", COLOR_OPTS.every((c) => cnt((p) => p.color === c) === 0));
P("Precio de lista (priceValue en BD = originalPriceValue) minimo/maximo: " + Math.min(...allCur.map((p) => p.originalPriceValue)) + " / " + Math.max(...allCur.map((p) => p.originalPriceValue)) + "; precio final: " + Math.min(...allCur.map((p) => p.priceValue)) + " / " + Math.max(...allCur.map((p) => p.priceValue)));
const bucketN = (lo, hi) => allCur.filter((p) => p.originalPriceValue >= lo && p.originalPriceValue < hi).length;
P("Productos por tramo segun precio de lista (el codigo filtra por Product.priceValue = precio de lista, antes del descuento): menos-50=" + bucketN(0, 50) + ", 50-100=" + bucketN(50, 100) + ", 100-200=" + bucketN(100, 200) + ", mas-200=" + bucketN(200, Infinity));
P("Productos por tramo segun precio final: menos-50=" + allCur.filter((p) => p.priceValue < 50).length + ", 50-100=" + allCur.filter((p) => p.priceValue >= 50 && p.priceValue < 100).length + ", 100-200=" + allCur.filter((p) => p.priceValue >= 100 && p.priceValue < 200).length + ", mas-200=" + allCur.filter((p) => p.priceValue >= 200).length);
// sort probes
P("");
for (const [n, c, dir] of [["oasis-orden-precio-asc", "oasis-natural", 1], ["oasis-orden-precio-desc", "oasis-natural", -1], ["aurora-orden-precio-asc", "aurora-viva", 1], ["aurora-orden-precio-desc", "aurora-viva", -1]]) {
  const arr = pv(n).rsc;
  const pr = arr.map((p) => p.originalPriceValue);
  const mono = pr.every((x, i) => i === 0 || (dir === 1 ? x >= pr[i - 1] : x <= pr[i - 1]));
  chk(n + ": " + arr.length + " tarjetas, monotono por precio de lista, mismo conjunto que la coleccion", mono && arr.length === cur[c].rsc.length && eqSet(arr.map((p) => p.slug), cur[c].rsc.map((p) => p.slug)));
  // ¿los empates conservan el orden por defecto?
  const def = cur[c].rsc.map((p) => p.slug);
  let tieKeep = true;
  const groups = {};
  arr.forEach((p) => (groups[p.originalPriceValue] = groups[p.originalPriceValue] || []).push(p.slug));
  for (const g of Object.values(groups)) { const d2 = def.filter((s) => g.includes(s)); if (!eqArr(d2, g)) tieKeep = false; }
  P("  empates en el orden por defecto: " + (tieKeep ? "SI" : "NO"));
}
P("");

// ============ V7 GRILLA (evaluador CSS minimo) ============
P("## V7. Grilla por breakpoint (evaluador CSS minimo sobre component-grid.css)");
P("");
{
  const css = rd(MIG, "theme-src", "assets", "component-grid.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [];
  let order = 0;
  const parseBlock = (txt, minW) => {
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(txt))) {
      const decl = m[2].match(/grid-template-columns:\s*([^;]+);/);
      if (!decl) { continue; }
      for (const sel of m[1].split(",").map((x) => x.trim())) {
        const cls = [...sel.matchAll(/\.([\w-]+)/g)].map((x) => x[1]);
        if (sel !== "." + cls.join(".")) continue; // solo selectores compuestos de clases
        rules.push({ cls, spec: cls.length, minW, order: order++, val: decl[1].trim() });
      }
    }
  };
  // separar @media
  let rest = css;
  const mre = /@media \(min-width:\s*(\d+)px\)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g;
  let mm;
  const chunks = [];
  while ((mm = mre.exec(css))) chunks.push({ idx: mm.index, len: mm[0].length, minW: +mm[1], body: mm[2] });
  // reconstruir en orden de aparicion
  let pos = 0;
  for (const ch of chunks) { parseBlock(css.slice(pos, ch.idx), 0); parseBlock(ch.body, ch.minW); pos = ch.idx + ch.len; }
  parseBlock(css.slice(pos), 0);
  const colsAt = (view, w) => {
    const el = ["grid", "grid--catalog", "grid--" + view];
    const cand = rules.filter((r) => r.cls.every((c) => el.includes(c)) && w >= r.minW);
    cand.sort((a, b) => a.spec - b.spec || a.order - b.order);
    const win = cand[cand.length - 1];
    const v = win.val;
    const rp = v.match(/repeat\((\d+),/);
    return rp ? +rp[1] : v === "1fr" ? 1 : v;
  };
  const cg = rd(WT, "components", "catalog", "catalog-grid.tsx");
  const gcls = Object.fromEntries([...cg.matchAll(/(\d):\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
  const bp = { sm: 640, md: 768 };
  const curCols = (view, w) => {
    let n = null;
    for (const tok of gcls[view].split(/\s+/)) {
      const m = tok.match(/^(?:(sm|md):)?grid-cols-(\d)$/);
      if (!m) continue;
      if (!m[1] || w >= bp[m[1]]) n = +m[2];
    }
    return n;
  };
  const W = [375, 639, 640, 767, 768, 1023, 1024, 1440];
  P("| Vista | " + W.join(" | ") + " |");
  P("|---|" + W.map(() => "---").join("|") + "|");
  let all = true;
  for (const v of [2, 3, 4]) {
    const cells = W.map((w) => { const a = curCols(v, w), d = colsAt(v, w); if (a !== d) all = false; return a + "/" + d; });
    P("| vista=" + v + " (actual/Dev) | " + cells.join(" | ") + " |");
  }
  chk("columnas iguales en 3 vistas x 8 anchos", all);
  P("Clases del sitio actual: " + JSON.stringify(gcls));
  const s = rd(MIG, "theme-src", "config", "settings_data.json");
  chk("theme: columnas por defecto 3, 24 por pagina, banner y descripcion activos, filtros y orden activos, disponibilidad oculta", /"collection_default_columns":\s*"3"/.test(s) && /"collection_products_per_page":\s*24/.test(s) && /"collection_show_banner":\s*true/.test(s) && /"collection_show_description":\s*true/.test(s) && /"collection_enable_filters":\s*true/.test(s) && /"collection_enable_sorting":\s*true/.test(s) && /"collection_show_availability_filter":\s*false/.test(s));
  const cp = rd(WT, "components", "catalog", "catalog-page.tsx");
  chk("actual: PAGE_SIZE = 200", /const PAGE_SIZE = 200;/.test(cp));
  chk("actual: columnas por defecto 3 (vista) y valores validos 2,3,4", /VALID_COLUMNS = \[2, 3, 4\]/.test(cp) && /: 3;/.test(cp));
}
P("");

// ============ V8 SALIDAS Y RUTAS NO MIGRABLES ============
P("## V8. Salidas de Baño y rutas no migrables (sitio actual)");
P("");
{
  const idx = JSON.parse(rd(EV, "current-site", "index.json"));
  const sm = rd(EV, "current-site", "sitemap.xml.txt");
  const smLocs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace("https://radaelliswimwear.com", "") || "/");
  const menuSrc = stripScripts(homeHtml);
  const menuHrefs = [...menuSrc.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]);
  P("| Ruta | HTTP | robots | h1 | contador | vacio | en sitemap | enlazada en el HTML de la Home (menu/footer/tarjetas) |");
  P("|---|---|---|---|---|---|---|---|");
  for (const r of ["salidas-de-bano", "accesorios", "hombre", "mujer", "ninos", "calzado"]) {
    const e = idx.find((x) => x.url === "https://radaelliswimwear.com/" + r);
    const h = stripScripts(rd(EV, "current-site", r + ".html"));
    const rob = (h.match(/<meta name="robots" content="([^"]*)"/) || [])[1];
    const h1 = (h.match(/<h1[^>]*>([^<]*)<\/h1>/) || [])[1];
    const c = (h.match(/(\d+)(?:<!-- -->)?\s*(?:<!-- -->)?\s*productos<\/span>/) || [])[1];
    const vac = /No hay productos que coincidan con estos filtros\./.test(h) || /No hay productos que coincidan con estos filtros\./.test(rd(EV, "current-site", r + ".html"));
    P("| " + r + " | " + e.status + " | " + rob + " | " + h1 + " | " + c + " | " + vac + " | " + smLocs.includes("/" + r) + " | " + menuHrefs.includes("/" + r) + " |");
  }
  P("URLs de coleccion del sitemap actual: " + smLocs.filter((l) => /^\/(accesorios|hombre|mujer|ninos|calzado|oasis-natural|aurora-viva|espuma-de-ola|salidas-de-bano)$/.test(l)).join(", "));
  const red = csv(rd(MIG, "seo", "shopify-redirects-import.csv"));
  P("Redirecciones de las rutas de coleccion: " + ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano", "accesorios", "hombre", "mujer", "ninos", "calzado"].map((r) => r + "=" + ((red.find((x) => x["Redirect from"] === "/" + r) || {})["Redirect to"] || "NO")).join(", "));
}
P("");

// ============ V9 MIGA Y ESTATICO theme-src ============
P("## V9. Miga de pan (Dev) y comprobaciones estaticas de theme-src");
P("");
{
  const bad = devProducts.filter((p) => !p.crumbs.includes("/ " + p.ty + " /"));
  P("Fichas Dev cuya miga no contiene su product_type: " + (bad.map((p) => p.h + " -> '" + p.crumbs + "'").join("; ") || "ninguna"));
  chk("miga: 0 fichas con 'Destacados' tras RC1.8 (las 4 de RC1.7 quedan en crumbsRC17)", devProducts.filter((p) => /Destacados/.test(p.crumbs)).length === 0 && devProducts.filter((p) => /Destacados/.test(p.crumbsRC17 || "")).length === 4);
  const mp = rd(MIG, "theme-src", "sections", "main-product.liquid");
  chk("main-product.liquid (RC1.8) elige la coleccion por titulo == product.type", /product\.type/.test(mp) && /collection\.title\s*==\s*product\.type|c\.title\s*==\s*product\.type|title == product\.type/.test(mp.replace(/\s+/g, " ")), (mp.match(/.{0,80}product\.type.{0,80}/) || [""])[0].replace(/\s+/g, " "));
  const mc = rd(MIG, "theme-src", "sections", "main-collection.liquid");
  chk("main-collection: overlay_cta 'view_product', category_label product.type, sin secondary desactivado", /overlay_cta: 'view_product'/.test(mc) && /category_label: product\.type/.test(mc) && /show_secondary_image: true/.test(mc));
  const css = rd(MIG, "theme-src", "assets", "component-card.css");
  const ov = css.match(/\.product-card__overlay\s*\{[^}]*\}/);
  chk("overlay de la tarjeta es decorativo (pointer-events: none): 'Ver producto' no es un enlace propio", ov && /pointer-events:\s*none/.test(ov[0]));
  const pc = rd(MIG, "theme-src", "snippets", "product-card.liquid");
  chk("product-card: el texto 'Ver producto' es un <span> y el enlace es la imagen", /<span class="product-card__view-product">/.test(pc) && /<a href="\{\{ product\.url \| within: collection \}\}"/.test(pc));
  const es = rd(MIG, "theme-src", "locales", "es.default.json");
  chk("locale: items_count '{{ count }} productos', no_matches, sort_featured 'Destacados', view_product 'Ver producto'", /"items_count": "\{\{ count \}\} productos"/.test(es) && /"no_matches": "No hay productos que coincidan"/.test(es) && /"sort_featured": "Destacados"/.test(es) && /"view_product": "Ver producto"/.test(es));
  const cf = rd(MIG, "theme-src", "snippets", "collection-filters.liquid");
  chk("collection-filters: itera collection.sort_options y collection.filters (no inventa opciones)", /for option in collection\.sort_options/.test(cf) && /for filter in collection\.filters/.test(cf) && /'manual'/.test(cf));
  const cb = rd(MIG, "theme-src", "snippets", "collection-banner.liquid");
  chk("collection-banner: cadena video -> cover_image encuadrada -> collection.image -> arte por tono (default stone)", /has_video/.test(cb) && /has_framed_image/.test(cb) && /has_plain_image/.test(cb) && /default: 'stone'/.test(cb));
  const bc = rd(MIG, "theme-src", "assets", "section-collection-banner.css");
  chk("arte 'stone' = degradado #c69379 -> #ad814e -> #785447", /--stone[^{]*\{[^}]*#c69379, #ad814e, #785447/.test(bc.replace(/\s+/g, " ")) || /stone[\s\S]{0,80}#c69379, #ad814e, #785447/.test(bc));
  const tpl = JSON.parse(rd(MIG, "theme-src", "templates", "collection.json"));
  chk("templates/collection.json: una sola seccion main-collection", tpl.order.length === 1 && tpl.sections.main.type === "main-collection");
}
P("");

// ============ V10 CONTROLES CRUZADOS ADICIONALES ============
P("## V10. Controles cruzados adicionales");
P("");
{
  // fuente independiente: products-master.csv (sale de la BD por lectura publica)
  const pmFeatVals = uniq(prodMaster.map((r) => r.featured));
  P("products-master.csv columna featured: valores distintos = " + pmFeatVals.join(" | ") + " (no es fuente independiente del flag featured; el 10 sale solo del payload RSC del HTML actual)");
  chk("products-master.csv no trae el flag featured (valores no booleanos)", !pmFeatVals.some((v) => /^(true|false|si|no)$/i.test(v)));
  let listOk = 0, saleOk = 0;
  for (const p of allCur) {
    const r = prodMaster.find((x) => x.slug.toLowerCase() === p.slug.toLowerCase());
    if (r && +r.price_cop === p.originalPriceValue) listOk++;
    if (r && +r.calculated_sale_price === p.priceValue) saleOk++;
  }
  chk("price_cop (CSV) == originalPriceValue (RSC) 29/29: el precio de lista es el que usa el filtro de precio", listOk === 29, listOk + "/29");
  chk("calculated_sale_price (CSV) == priceValue final (RSC) 29/29", saleOk === 29, saleOk + "/29");
  const audit = csv(rd(MIG, "catalog", "shopify-post-import-audit.csv"));
  chk("shopify-post-import-audit.csv: 29 filas, collection_match=true en 29, Oasis 10 / Aurora 12 / Espuma 7", audit.length === 29 && audit.filter((r) => r.collection_match === "true").length === 29 && ["Oasis Natural", "Aurora Viva", "Espuma de Ola"].map((c) => audit.filter((r) => r.collection_shopify === c).length).join("/") === "10/12/7");
  // vista rapida y favoritos en el actual
  const oa = cur["oasis-natural"].ssr;
  chk("actual: 'Vista rápida' en 10 de 10 tarjetas de Oasis", (oa.match(/Vista rápida/g) || []).length === 10, String((oa.match(/Vista rápida/g) || []).length));
  chk("actual: boton de favoritos en 10 de 10 tarjetas de Oasis", (oa.match(/(?:Añadir a favoritos|Quitar de favoritos)/g) || []).length === 10, String((oa.match(/(?:Añadir a favoritos|Quitar de favoritos)/g) || []).length));
  // contador singular/plural
  const tb = rd(WT, "components", "catalog", "catalog-toolbar.tsx");
  chk("actual: el contador pluraliza (1 producto / N productos)", /\{resultCount\} \{resultCount === 1 \? "producto" : "productos"\}/.test(tb));
  const es = JSON.parse(rd(MIG, "theme-src", "locales", "es.default.json"));
  chk("Dev: items_count es una cadena unica '{{ count }} productos' (sin singular)", es.collections.general.items_count === "{{ count }} productos" && typeof es.collections.general.items_count === "string");
  chk("Dev: view_results (boton del cajon) si tiene singular/plural", es.general.filters.view_results.one === "Ver {{ count }} producto");
  // tonos del banner de respaldo
  const c03 = rd(MIG, "theme", "03C-catalog-import-report.md");
  const tm = c03.match(/oasis-natural = (\w+), aurora-viva = (\w+), espuma-de-ola = (\w+), salidas-de-bano = (\w+)/);
  P("03C punto 27: description_tone cargado = " + (tm ? tm.slice(1).join(", ") : "NOT_FOUND") + " (oasis, aurora, espuma, salidas)");
  const cpTsx = rd(WT, "components", "catalog", "catalog-page.tsx");
  const curT = ["Oasis Natural", "Aurora Viva", "Espuma de Ola", "Salidas de Baño"].map((l) => (cpTsx.match(new RegExp('"' + l + '": \\{\\s*tone: "(\\w+)"')) || [])[1]);
  P("Respaldo del sitio actual (CATEGORY_COPY.tone) = " + curT.join(", "));
  chk("el tono cargado en la Dev (03C) coincide con el respaldo del sitio actual en las 4 colecciones", tm && eqArr(tm.slice(1), curT));
  const snap = JSON.parse(rd(MIG, "launch", "03G-dev-store-snapshot.json"));
  const dt = snap.metafieldDefinitions.collection.find((m) => m.name === "Description tone");
  P("03G-dev-store-snapshot.json: metafield de coleccion 'Description tone' usedBy = " + (dt && dt.usedBy));
  chk("snapshot de la Dev: Description tone usado por 4 colecciones (y Cover image 0)", dt && dt.usedBy === "4 colecciones" && snap.metafieldDefinitions.collection.find((m) => m.name === "Cover image").usedBy === "0 colecciones");
  const cssB = rd(MIG, "theme-src", "assets", "section-collection-banner.css");
  P("Paleta por tono en theme-src: " + ["moss", "linen", "fog", "sand", "stone"].map((t) => t + "=" + ((cssB.match(new RegExp("\\.collection-banner__art--" + t + "[^{]*\\{\\s*background:\\s*([^;]+);")) || [])[1] || "?").replace("linear-gradient(to bottom right, ", "").replace(")", "")).join(" | "));
  chk("el HTML del banner de la Dev NO esta capturado: el tono renderizado no se puede medir con la evidencia", !Object.values(devCols).some((c) => "tone" in c || "bannerClass" in c));
}
P("");
P("## Resumen del verificador");
P("Comprobaciones con FALLA: " + fails);
console.log(out.join("\n"));
