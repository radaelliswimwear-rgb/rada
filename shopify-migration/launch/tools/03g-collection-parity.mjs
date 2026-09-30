// 03G — paridad de colecciones. SOLO LECTURA, OFFLINE y DETERMINISTA (sin red, sin fechas, sin aleatoriedad).
// Uso: node launch/tools/03g-collection-parity.mjs   (imprime tablas Markdown; su salida se pega en launch/03G-collection-parity.md)
//
// Lee:
//   launch/evidence/current-site/*.html                 (sitio actual, GET de solo lectura)
//   launch/evidence/03g-collection-filter-probe/*.html  (9 GET puntuales de filtros/orden del sitio actual)
//   launch/evidence/dev-collections.json, dev-products.jsonl, dev-home.json   (Dev Store, capturados en RC1.7)
//   collections/collections-master.csv, catalog/products-master.csv, import/shopify-products-03c.csv,
//   seo/shopify-redirects-import.csv, content/media/media-migration-manifest.csv
//   theme-src/** (RC1.8, solo lectura) y el codigo del sitio actual del repo (../lib, ../components) para contrastar.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIG = fileURLToPath(new URL("../../", import.meta.url)).replace(/\\/g, "/");
const WT = path.join(MIG, "..").replace(/\\/g, "/"); // raiz del worktree (lib/, components/, app/)
const R = (p) => fs.readFileSync(path.join(MIG, p), "utf8");
const RW = (p) => fs.readFileSync(path.join(WT, p), "utf8");
const out = [];
const P = (s = "") => out.push(s);
const H = (s) => { P(); P(s); P(); };
const esc = (s) => String(s).replace(/\|/g, "\\|");
function table(headers, rows) {
  P("| " + headers.join(" | ") + " |");
  P("|" + headers.map(() => "---").join("|") + "|");
  for (const r of rows) P("| " + r.map((c) => esc(c)).join(" | ") + " |");
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const uniq = (a) => [...new Set(a)];
const yn = (b) => (b ? "IGUAL" : "DISTINTO");

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
  return rows.filter((r) => r.length > 1 || (r[0] && r[0].trim()));
}
function csvObjects(text) {
  const rows = parseCsv(text);
  const h = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
}

// ---------- RSC (payload de Next.js embebido en el HTML) ----------
function flight(h) {
  const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  let m, o = "";
  while ((m = re.exec(h))) { try { o += JSON.parse(m[1]); } catch { /* ignorar */ } }
  return o;
}
function objAt(s, i) {
  let d = 0, ins = false, e = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (ins) { if (e) e = false; else if (c === "\\") e = true; else if (c === '"') ins = false; }
    else if (c === '"') ins = true;
    else if (c === "{") d++;
    else if (c === "}") { d--; if (d === 0) return s.slice(i, j + 1); }
  }
  return null;
}
function rscProducts(raw) {
  const t = flight(raw);
  const re = /\{"id":"[a-z0-9]+","slug":"/g;
  let m; const o = [];
  while ((m = re.exec(t))) { try { o.push(JSON.parse(objAt(t, m.index))); } catch { /* ignorar */ } }
  return o;
}

// ---------- sitio actual: colecciones ----------
const clean = (h) => h.replace(/<!-- -->/g, "").replace(/<!--\$\??-->|<!--\/\$-->/g, "");
const money = (n) => "$ " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const H_ = (s) => s.toLowerCase();

function parseCollectionPage(rawHtml) {
  const raw = rawHtml;
  const h = clean(raw);
  const i0 = h.indexOf('<main id="main-content">');
  const iF = h.indexOf('<footer id="contacto"', i0);
  // /accesorios, /hombre y /mujer llegan con un esqueleto de carga en <main> y el contenido real en <div hidden id="S:1"> (streaming de Next)
  const s1 = h.indexOf('<div hidden id="S:1">');
  const s2 = s1 >= 0 ? h.indexOf('<div hidden id="S:2">', s1) : -1;
  const streamed = s1 >= 0;
  const m = streamed ? h.slice(s1, s2 > 0 ? s2 : undefined) : h.slice(i0, iF > 0 ? iF : undefined);
  const head = h.slice(0, i0);
  const g1 = (re, s = m) => { const x = s.match(re); return x ? x[1] : null; };
  const secStart = m.indexOf('<section class="relative flex h-[38vh]');
  const sec = m.slice(secStart, m.indexOf("</section>", secStart));
  const bgm = sec.match(/background-image:url\(([^)]*)\);background-repeat:no-repeat;background-position:([^;]*);background-size:([^"]*)"/);
  const art = sec.match(/bg-gradient-to-br (from-\[#[0-9a-f]+\] via-\[#[0-9a-f]+\] to-\[#[0-9a-f]+\])/i);
  const aside = m.slice(m.indexOf("<aside"), m.indexOf("</aside>"));
  const groups = aside.split('<h3 class="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">').slice(1).map((g) => {
    const name = g.slice(0, g.indexOf("</h3>"));
    const rest = g.slice(g.indexOf("</h3>"));
    let opts;
    if (name === "Ordenar por") opts = [...rest.matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map((x) => x[1] + "=" + x[2]);
    else if (name === "Precio") opts = [...rest.matchAll(/\/>([^<]*)<\/label>/g)].map((x) => x[1]);
    else opts = [...rest.matchAll(/>([^<>]+)<\/button>/g)].map((x) => x[1]);
    return { name, opts };
  });
  const parts = m.split('<div class="group" style="opacity:0;transform:translateY(16px)">').slice(1);
  const cards = parts.map((p) => {
    const pr = p.match(/<span class="inline-flex[^>]*><span>([^<]*)<\/span>(?:<span class="[^"]*line-through">([^<]*)<\/span>)?(?:<span class="[^"]*">(-\d+%)<\/span>)?/);
    return {
      slug: g1(/href="\/producto\/([^"]+)"/, p),
      title: g1(/<h3 class="text-sm text-neutral-800">([^<]*)<\/h3>/, p),
      badge: g1(/absolute left-3 top-3[^>]*>([^<]*)<\/span>/, p),
      price: pr ? pr[1] : null, compare: pr ? pr[2] || null : null, pct: pr ? pr[3] || null : null,
      quickView: /Vista rápida/.test(p), heart: /Añadir a favoritos/.test(p),
    };
  });
  const emptyBox = m.match(/border-dashed[^>]*>[\s\S]*?<p class="text-sm font-medium[^>]*>([^<]*)<\/p><p class="text-xs text-neutral-500">([^<]*)<\/p>/);
  return {
    title: g1(/<title>([^<]*)<\/title>/, head), metaDesc: g1(/<meta name="description" content="([^"]*)"/, head),
    canonical: g1(/<link rel="canonical" href="([^"]*)"/, head), robots: g1(/<meta name="robots" content="([^"]*)"/, head),
    h1: g1(/<h1[^>]*>([^<]*)<\/h1>/), bannerDesc: g1(/<p class="mt-2 max-w-md text-sm text-white\/80">([^<]*)<\/p>/),
    banner: bgm ? { kind: "imagen", url: bgm[1], pos: bgm[2], size: bgm[3] } : { kind: "arte decorativo", art: art ? art[1] : "?" },
    streamed, countText: g1(/<span>(\d+) productos<\/span>/), groups, cards,
    grid: g1(/<div class="grid gap-4 sm:gap-6 ([^"]*)">/), vista: g1(/aria-pressed="true" aria-label="Ver en (\d) columnas"/),
    empty: emptyBox ? [emptyBox[1], emptyBox[2]] : null,
    rsc: rscProducts(raw),
  };
}

const CUR = "launch/evidence/current-site/";
const curIndex = JSON.parse(R(CUR + "index.json"));
const statusOf = (u) => (curIndex.find((r) => r.url === "https://radaelliswimwear.com" + u) || {}).status;
const PAGES = {
  "oasis-natural": "oasis-natural.html", "aurora-viva": "aurora-viva.html", "espuma-de-ola": "espuma-de-ola.html",
  "salidas-de-bano": "salidas-de-bano.html", accesorios: "accesorios.html", hombre: "hombre.html", mujer: "mujer.html",
  ninos: "ninos.html", calzado: "calzado.html",
};
const cur = {};
for (const [k, f] of Object.entries(PAGES)) cur[k] = parseCollectionPage(R(CUR + f));
const curSlugs = (k) => cur[k].cards.map((c) => H_(c.slug));

// ---------- Home actual ----------
const homeRaw = R(CUR + "home.html");
const home = clean(homeRaw);
function sectionAround(h, needle) { const i = h.indexOf(needle); const s = h.lastIndexOf("<section", i); const e = h.indexOf("</section>", i); return h.slice(s, e); }
const homeEditorial = uniq([...sectionAround(home, ">La belleza de sentirte tú</h2>").matchAll(/href="\/producto\/([^"]+)"/g)].map((x) => H_(x[1])));
const homeFeatured = uniq([...sectionAround(home, ">Productos destacados</h2>").matchAll(/href="\/producto\/([^"]+)"/g)].map((x) => H_(x[1])));
const homeCats = [...sectionAround(home, ">Categorías destacadas</h2>").matchAll(/aria-label="Explorar la categoría ([^"]*)"[^>]*href="([^"]*)"/g)].map((x) => x[1] + " -> " + x[2]);
const homeRsc = rscProducts(homeRaw);
const headerNav = [...(home.match(/<nav class="hidden flex-1 items-center justify-center gap-5 lg:flex lg:gap-7">([\s\S]*?)<\/nav>/) || ["", ""])[1].matchAll(/href="([^"]*)"[^>]*>([^<]*)</g)].map((x) => x[2] + " -> " + x[1]);
const footerHtml = home.slice(home.indexOf('<footer id="contacto"'));
const footerLinks = uniq([...footerHtml.matchAll(/href="(\/[^"]*)"/g)].map((x) => x[1]));

// ---------- Dev ----------
const devC = JSON.parse(R("launch/evidence/dev-collections.json"));
const devHome = JSON.parse(R("launch/evidence/dev-home.json"));
const devP = R("launch/evidence/dev-products.jsonl").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const devCol = Object.fromEntries(devC.collections.map((c) => [c.h, c]));
const devBy = Object.fromEntries(devP.map((p) => [p.h, p]));

// ---------- CSV del repo ----------
const colMaster = csvObjects(R("collections/collections-master.csv"));
const prodMaster = csvObjects(R("catalog/products-master.csv"));
const importRows = csvObjects(R("import/shopify-products-03c.csv"));
const importOrder = uniq(importRows.map((r) => r["URL handle"]).filter(Boolean));
const redirects = R("seo/shopify-redirects-import.csv").split(/\r?\n/).filter(Boolean).map((l) => l.split(","));
const media = csvObjects(R("content/media/media-migration-manifest.csv"));
const sitemapLocs = [...R(CUR + "sitemap.xml.txt").matchAll(/<loc>([^<]*)<\/loc>/g)].map((x) => x[1].replace("https://radaelliswimwear.com", "") || "/");

// ---------- codigo del sitio actual (repo, para contrastar el HTML) ----------
const srcActions = RW("lib/catalog/catalog-actions.ts");
const srcGrid = RW("components/catalog/catalog-grid.tsx");
const srcData = RW("lib/placeholder-data.ts");
const srcSubunits = RW("lib/currency/subunits.ts");

const SETTINGS = (() => { const sd = JSON.parse(R("theme-src/config/settings_data.json")); return sd.presets[sd.current]; })();
const COLS = ["oasis-natural", "aurora-viva", "espuma-de-ola"];
const TITLE = { "oasis-natural": "Oasis Natural", "aurora-viva": "Aurora Viva", "espuma-de-ola": "Espuma de Ola", "salidas-de-bano": "Salidas de Baño", destacados: "Destacados", frontpage: "Home page" };
const EXPECT = { "oasis-natural": 10, "aurora-viva": 12, "espuma-de-ola": 7, "salidas-de-bano": 0, destacados: 7, frontpage: 0 };
const NONMIG = ["accesorios", "hombre", "mujer", "ninos", "calzado"];

P("# Salida de launch/tools/03g-collection-parity.mjs");
P();
P("Determinista y offline. Etiquetas: [MEDIDO-03G] = leido de launch/evidence; [DOC] = leido de un archivo del repo; [INFERIDO] = deduccion declarada.");

// =====================================================================
H("## T1. Membresia (handles en minuscula)");
{
  const rows = [];
  for (const k of ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"]) {
    const a = curSlugs(k), d = devCol[k].order;
    const mm = colMaster.find((r) => r.slug === k);
    const pm = prodMaster.filter((r) => r.collection === k).length;
    const devTy = devP.filter((p) => p.ty === TITLE[k]).length;
    rows.push([TITLE[k], EXPECT[k], a.length, cur[k].countText, cur[k].rsc.length, mm ? mm.products_count : "-", pm, devCol[k].n, devCol[k].cards, devTy,
      yn(eq([...a].sort(), [...d].sort())), a.filter((x) => !d.includes(x)).join(",") || "-", d.filter((x) => !a.includes(x)).join(",") || "-"]);
  }
  rows.push(["Destacados (actual = seccion 'Productos destacados' de la Home)", 7, homeFeatured.length, "n/a", "n/a", "n/a (no esta en collections-master.csv)", "n/a", devCol.destacados.n, devCol.destacados.cards, "n/a",
    yn(eq([...homeFeatured].sort(), [...devCol.destacados.order].sort())), homeFeatured.filter((x) => !devCol.destacados.order.includes(x)).join(",") || "-", devCol.destacados.order.filter((x) => !homeFeatured.includes(x)).join(",") || "-"]);
  rows.push(["Home page (frontpage, automatica de Shopify)", 0, "no existe", "no existe", "no existe", "no existe", "no existe", devCol.frontpage.n, devCol.frontpage.cards, "n/a", "n/a", "-", "-"]);
  table(["Coleccion", "Esperado (encargo)", "Actual: tarjetas HTML", "Actual: texto 'N productos'", "Actual: objetos RSC", "collections-master.csv", "products-master.csv (col. collection)", "Dev: n", "Dev: tarjetas", "Dev: productos con product_type = coleccion", "Membresia", "Solo en actual", "Solo en Dev"], rows);
  P();
  const okAll = Object.entries(EXPECT).every(([k, v]) => (k === "destacados" ? homeFeatured.length : k === "frontpage" ? devCol.frontpage.n : curSlugs(k).length) === v && devCol[k].n === v && devCol[k].cards === v);
  P("Cifras del encargo (10/12/7/0/7/0) confirmadas en actual y Dev: " + (okAll ? "SI" : "NO"));
  // Dev: cada handle de la coleccion tiene product_type = titulo de la coleccion (excepto Destacados)
  const bad = [];
  for (const k of ["oasis-natural", "aurora-viva", "espuma-de-ola"]) for (const hd of devCol[k].order) if (!devBy[hd] || devBy[hd].ty !== TITLE[k]) bad.push(k + ":" + hd);
  P("Handles de las 3 colecciones Dev cuyo product_type != titulo de la coleccion: " + (bad.length ? bad.join(", ") : "ninguno"));
  const allDev = uniq([...devCol["oasis-natural"].order, ...devCol["aurora-viva"].order, ...devCol["espuma-de-ola"].order]);
  P("Union de las 3 colecciones Dev = " + allDev.length + " productos; productos Dev totales = " + devP.length + "; sin coleccion: " + (devP.filter((p) => !allDev.includes(p.h)).map((p) => p.h).join(",") || "ninguno"));
  const dup = allDev.length !== [...devCol["oasis-natural"].order, ...devCol["aurora-viva"].order, ...devCol["espuma-de-ola"].order].length;
  P("Productos repetidos entre las 3 colecciones Dev: " + (dup ? "SI" : "no"));
  const audit = csvObjects(R("catalog/shopify-post-import-audit.csv"));
  P("catalog/shopify-post-import-audit.csv (03C): filas " + audit.length + "; collection_match=true en " + audit.filter((r) => r.collection_match === "true").length + "; por collection_shopify: " + uniq(audit.map((r) => r.collection_shopify)).sort().map((c) => c + " " + audit.filter((r) => r.collection_shopify === c).length).join(", ") + ".");
}

// =====================================================================
H("## T2. Orden de las tarjetas (actual = orden del HTML servido; Dev = orden por defecto de /collections/<h>/products.json)");
const ORD = {};
for (const k of COLS) {
  const a = curSlugs(k), d = devCol[k].order;
  ORD[k] = { a, d };
  P("### " + TITLE[k]);
  P();
  table(["Pos", "Actual (handle)", "Dev (handle en la misma posicion)", "Posicion en Dev del handle actual", "Delta"], a.map((x, i) => {
    const pd = d.indexOf(x) + 1;
    return [i + 1, x, d[i], pd, pd - (i + 1)];
  }));
  P();
  const same = a.filter((x, i) => d[i] === x).length;
  P("Posiciones que coinciden: " + same + " de " + a.length + ". Orden " + yn(eq(a, d)) + ".");
  const imp = importOrder.map(H_).filter((x) => d.includes(x));
  P("[INFERIDO, verificado aqui] Dev == orden INVERSO del CSV de importacion (import/shopify-products-03c.csv) restringido a la coleccion: " + (eq([...imp].reverse(), d) ? "SI" : "NO") + ".");
  const pmo = prodMaster.map((r) => H_(r.slug)).filter((x) => d.includes(x));
  P("Dev == orden inverso de catalog/products-master.csv: " + (eq([...pmo].reverse(), d) ? "SI" : "NO") + ". Actual == orden de products-master.csv: " + (eq(pmo, a) ? "SI" : "NO") + ".");
  P();
}
{
  P("### Corroboracion de la fuente del orden actual");
  P();
  P("- Codigo del sitio actual (`lib/catalog/catalog-actions.ts`, funcion buildOrderBy): orden por defecto `createdAt: \"asc\"` (mas antiguo primero): " + (/return \{ createdAt: "asc" \};/.test(srcActions) ? "SI [DOC]" : "NO") + ".");
  P("- Etiqueta del selector del sitio actual para ese orden por defecto: 'Novedades' (valor `novedades`) [MEDIDO-03G]; el codigo lo resuelve como createdAt ascendente, es decir 'antiguos primero'.");
  const skuSeq = (k) => {
    const byPrefix = {};
    for (const p of cur[k].rsc) { const mm = /^(LG-[A-Z]+)-(\d+)$/.exec(p.sku || ""); if (mm) (byPrefix[mm[1]] ||= []).push(Number(mm[2])); }
    return Object.entries(byPrefix).map(([pre, arr]) => pre + ":" + arr.join(">") + (arr.every((x, i) => i === 0 || x > arr[i - 1]) ? " (creciente)" : " (NO creciente)"));
  };
  P("- Secuencia de SKU LG-* en el orden actual (indicio de orden de creacion): Aurora Viva: " + skuSeq("aurora-viva").join("; ") + ". Espuma de Ola: " + skuSeq("espuma-de-ola").join("; ") + ". Oasis Natural usa SKU RSON* sin secuencia numerica comparable.");
  P("- created_at en catalog/products-master.csv: " + uniq(prodMaster.map((r) => r.created_at)).join(", ") + " (no hay fecha de creacion exportada; el orden actual no se puede derivar de los CSV).");
  {
    const snap = JSON.parse(R("source-of-truth/catalog-snapshot.json"));
    const hdrs = { "collections/collections-master.csv": parseCsv(R("collections/collections-master.csv"))[0], "catalog/products-master.csv": parseCsv(R("catalog/products-master.csv"))[0], "catalog/variants-master.csv": parseCsv(R("catalog/variants-master.csv"))[0], "catalog/shopify-post-import-audit.csv": parseCsv(R("catalog/shopify-post-import-audit.csv"))[0] };
    const rx = /order|orden|position|posicion|sort|rank/i;
    P("- Columnas de orden/posicion en los CSV del repo: " + Object.entries(hdrs).map(([f, h]) => f + " -> " + (h.filter((x) => rx.test(x) && !/image/i.test(x)).join(",") || "ninguna")).join("; ") + "; source-of-truth/catalog-snapshot.json (claves de producto): " + (Object.keys(snap.products[0]).filter((x) => rx.test(x)).join(",") || "ninguna") + "; claves de coleccion: " + Object.keys(snap.collections[0]).join(",") + ". Conclusion: el repo NO contiene una fuente de verdad del orden de las tarjetas; la unica evidencia del orden actual es el HTML servido (T2) [MEDIDO-03G].");
  }
  P("- Orden Dev de colecciones manuales (default) proviene del orden de alta en la importacion (ver 'INVERSO' arriba), no de una decision editorial documentada [INFERIDO].");
  P();
  P("### Orden objetivo si se quiere paridad con el sitio actual (handles exactos, primero = arriba)");
  P();
  for (const k of COLS) P("- " + TITLE[k] + ": `" + ORD[k].a.join("`, `") + "`");
  P();
  P("### Efecto en la Home (la editorial toma las 8 primeras de Oasis Natural)");
  P();
  const devEd = devHome.sections.find((s) => s.id === "featured-collection-editorial").products;
  table(["", "Handles (orden)"], [["Actual (Home) [MEDIDO-03G]", homeEditorial.join(", ")], ["Dev (dev-home.json) [MEDIDO-03G]", devEd.join(", ")], ["Primeras 8 de Oasis en el orden actual", ORD["oasis-natural"].a.slice(0, 8).join(", ")], ["Primeras 8 de Oasis en el orden Dev", ORD["oasis-natural"].d.slice(0, 8).join(", ")]]);
  P();
  P("Editorial actual == 8 primeras de Oasis en orden actual: " + yn(eq(homeEditorial, ORD["oasis-natural"].a.slice(0, 8))) + ". Editorial Dev == 8 primeras del orden Dev: " + yn(eq(devEd, ORD["oasis-natural"].d.slice(0, 8))) + ".");
  P("Editorial actual vs Dev (conjunto): " + yn(eq([...homeEditorial].sort(), [...devEd].sort())) + "; solo actual: " + homeEditorial.filter((x) => !devEd.includes(x)).join(", ") + "; solo Dev: " + devEd.filter((x) => !homeEditorial.includes(x)).join(", ") + ".");
}

// =====================================================================
H("## T3. Destacados");
{
  const flagged = {};
  for (const k of COLS) flagged[k] = cur[k].rsc.filter((p) => p.featured).map((p) => H_(p.slug));
  const allFlag = COLS.flatMap((k) => flagged[k]);
  table(["Coleccion actual", "Productos con featured=true en el payload RSC [MEDIDO-03G]"], COLS.map((k) => [TITLE[k], flagged[k].join(", ")]));
  P();
  P("Total featured=true: " + allFlag.length + " de " + uniq(COLS.flatMap((k) => cur[k].rsc.map((p) => p.slug))).length + " productos.");
  const minusEd = allFlag.filter((x) => !homeEditorial.includes(x));
  P("featured=true menos los de la editorial (regla de app/page.tsx: la editorial se elige primero y se excluye): " + minusEd.length + " -> " + yn(eq([...minusEd].sort(), [...homeFeatured].sort())) + " frente a los " + homeFeatured.length + " que muestra la Home.");
  P("Home 'Productos destacados' (orden de la captura, 1 muestra): " + homeFeatured.join(", "));
  P("Dev coleccion 'destacados' (orden por defecto): " + devCol.destacados.order.join(", "));
  const devFeat = devHome.sections.find((s) => s.id === "featured-products");
  P("Dev Home seccion featured-products (dev-home.json) usa la coleccion '" + devFeat.collection + "' con " + devFeat.cards + " tarjetas; orden == coleccion Dev: " + yn(eq(devFeat.products, devCol.destacados.order)) + ".");
  {
    const samples = ["home-sample-1", "home-sample-2", "home-sample-3"].map((n) => {
      const hh = clean(R("launch/evidence/03g-collection-filter-probe/" + n + ".html"));
      return uniq([...sectionAround(hh, ">Productos destacados</h2>").matchAll(/href="\/producto\/([^"]+)"/g)].map((x) => H_(x[1])));
    });
    const all4 = [homeFeatured, ...samples];
    const orders = uniq(all4.map((x) => x.join(">")));
    P("Muestras del orden en la Home actual [MEDIDO-03G]: captura del rastreo + 3 GET puntuales consecutivos; ordenes distintos entre las 4 muestras: " + orders.length + "; conjuntos iguales entre las 4: " + yn(uniq(all4.map((x) => [...x].sort().join(","))).length === 1) + ". " + (orders.length === 1 ? "El orden NO cambio entre estas 4 muestras (la Home parece servirse cacheada; el codigo baraja al renderizar, asi que el orden cambia cuando se regenera la pagina: frecuencia NOT_VERIFIED)." : "El orden cambia entre visitas."));
  }
  P("Conjunto Home actual vs Dev destacados: " + yn(eq([...homeFeatured].sort(), [...devCol.destacados.order].sort())) + ". Orden de la captura actual vs Dev: " + yn(eq(homeFeatured, devCol.destacados.order)) + ".");
  const pos = homeFeatured.map((x) => devCol.destacados.order.indexOf(x) + 1);
  P("Posicion en Dev de cada handle de la captura actual (misma secuencia): " + pos.join(", "));
  P("Origen en el sitio actual [DOC: lib/catalog/catalog-actions.ts listFeaturedProductsAction]: consulta featured=true + active, excluye los slugs de la editorial, relleno solo si hay menos de FEATURED_MIN_COUNT=" + ((srcActions.match(/FEATURED_MIN_COUNT = (\d+)/) || [])[1]) + ", y baraja con Math.random: " + (/Math\.random\(\)/.test(srcActions.slice(srcActions.indexOf("listFeaturedProductsAction"))) ? "SI (orden distinto en cada visita)" : "NO") + ".");
  P("Los 7 destacados pertenecen a: " + uniq(homeFeatured.map((x) => (devBy[x] || {}).ty)).join(" + ") + " (por producto: " + ["Espuma de Ola", "Aurora Viva"].map((t) => t + " " + homeFeatured.filter((x) => (devBy[x] || {}).ty === t).length).join(", ") + ").");
  P("Dev 'destacados': metaDescChars=" + devCol.destacados.metaDescChars + ", robots='" + devCol.destacados.robots + "' (vacio = indexable), canonical propio: " + (devCol.destacados.canon || "").replace("https://radaelli-swimwear-dev.myshopify.com", "<dev>") + ". En el sitio actual no existe /destacados (no esta en index.json ni en el sitemap): " + (curIndex.some((r) => /\/destacados/.test(r.url)) ? "SI esta" : "no esta") + " / " + (sitemapLocs.some((x) => /destacados/.test(x)) ? "en sitemap" : "no esta en el sitemap") + ".");
  P();
  const crumbBad = devP.filter((p) => /Destacados/.test(p.crumbs || ""));
  P("Miga de pan de la ficha en Dev [MEDIDO-03G, dev-products.jsonl, capturado sin declarar version; coincide con el defecto de RC1.7]: fichas cuya miga dice 'Destacados' en vez de su coleccion: " + crumbBad.length + " -> " + crumbBad.map((p) => p.h).join(", ") + ".");
  const fix = /product_collection\.title == product\.type/.test(R("theme-src/sections/main-product.liquid"));
  P("theme-src/sections/main-product.liquid (RC1.8) contiene la correccion (usa la coleccion cuyo titulo == product.type): " + (fix ? "SI [DOC]" : "NO") + ". Verificacion en vivo con RC1.8: NOT_VERIFIED (no hay captura posterior).");
}

// =====================================================================
H("## T4. Tarjetas y precios (actual = tarjeta HTML de la coleccion; Dev = variante de dev-products.jsonl, formato de la ficha Dev)");
{
  const rows = [];
  let okT = 0, okB = 0, okP = 0, okC = 0, okD = 0, okI = 0, n = 0;
  const ov = [];
  for (const k of COLS) {
    for (const c of cur[k].cards) {
      const hd = H_(c.slug); const d = devBy[hd];
      n++;
      const v = d.vr[0]; const price = Math.round(Number(v[2])), cmp = Math.round(Number(v[3]));
      const pct = "-" + Math.round(((cmp - price) * 100) / cmp) + "%";
      const ws = (s) => (s == null ? s : s.replace(/ /g, " ")); // el sitio actual usa U+00A0 tras '$'; la captura Dev viene con espacios normalizados
      const t = c.title === d.t, b = c.badge === d.ty, p = ws(c.price) === money(price), cc = ws(c.compare) === money(cmp), dd = c.pct === pct;
      const rsc = cur[k].rsc.find((x) => H_(x.slug) === hd);
      const imgs = (rsc.images || []).slice(0, 2).map((u) => (u.match(/([a-z0-9]+)\.(?:jpg|png|webp)$/i) || [])[1]);
      // Shopify renombra al re-subir (sufijo _<uuid>): se compara el nombre base
      const dimg = d.im.slice(0, 2).map((x) => x.replace(/\.(jpg|png|webp)$/i, "").replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, ""));
      const im = eq(imgs, dimg);
      okT += t; okB += b; okP += p; okC += cc; okD += dd; okI += im;
      const allSame = new Set(d.vr.map((x) => x[2] + "/" + x[3])).size === 1;
      if (!allSame) ov.push(hd);
      if (!(t && b && p && cc && dd && im)) ov.push(hd + "(diferencia)");
      rows.push([TITLE[k], hd, c.price + " / " + c.compare + " / " + c.pct, money(price) + " / " + money(cmp) + " / " + pct, t ? "=" : "≠ (" + c.title + " vs " + d.t + ")", b ? "=" : "≠ (" + c.badge + " vs " + d.ty + ")", im ? "=" : "≠", d.vr.length + " (" + d.vr.map((x) => x[0]).join("|") + ")", rsc.sizes.join("|")]);
    }
  }
  table(["Coleccion", "Handle", "Actual: precio / anterior / % [tarjeta HTML]", "Dev: precio / anterior / % [calculado de la variante]", "Titulo", "Badge de categoria = product_type", "2 primeras imagenes (nombre)", "Dev: variantes (tallas)", "Actual: tallas"], rows);
  P();
  P("Comparados " + n + " productos. Titulo igual " + okT + "; badge = product_type " + okB + "; precio igual " + okP + "; precio anterior igual " + okC + "; % igual " + okD + "; 2 primeras imagenes (mismo nombre y orden) " + okI + ".");
  {
    // AGREGADO por el verificador (03G): la comparacion de arriba quita el sufijo _<uuid> que Shopify agrega al renombrar.
    const rawDiff = [];
    for (const k of COLS) for (const c of cur[k].cards) {
      const hd = H_(c.slug); const d = devBy[hd]; const rsc = cur[k].rsc.find((x) => H_(x.slug) === hd);
      const a = (rsc.images || []).slice(0, 2).map((u) => u.split("/").pop());
      const dv = d.im.slice(0, 2);
      if (!eq(a, dv)) rawDiff.push(hd + ": actual " + a.join(",") + " / Dev " + dv.join(","));
    }
    P("Nombre de archivo SIN normalizar (2 primeras imagenes): " + (n - rawDiff.length) + " de " + n + " iguales; con sufijo _<uuid> agregado por Shopify: " + (rawDiff.join("; ") || "ninguno") + ". Que sea el mismo archivo (pixeles) no se verifico: NOT_VERIFIED.");
  }
  P("Productos con precio distinto entre variantes en Dev (la tarjeta usa la primera variante disponible): " + (ov.filter((x) => !x.includes("diferencia")).join(", ") || "ninguno") + ".");
  {
    const scrape = JSON.parse(R("source-of-truth/public-scrape-raw.json")).products;
    const sizeDiff = [];
    for (const k of COLS) for (const p of cur[k].rsc) {
      const hd = H_(p.slug); const dv = devBy[hd].vr.map((v) => v[0]); const sc = (scrape.find((x) => H_(x.slug) === hd) || {}).sizes || [];
      if (!eq(p.sizes, dv) || !eq(p.sizes, sc)) sizeDiff.push(hd + ": actual " + p.sizes.join("|") + " / Dev " + dv.join("|") + " / scrape 2026-09-28 " + sc.join("|"));
    }
    P("Tallas por producto, actual (payload RSC de la coleccion) vs variantes Dev vs public-scrape-raw.json (2026-09-28): " + (sizeDiff.length ? sizeDiff.join("; ") : "sin diferencias") + ".");
    const priceDrift = [];
    for (const k of COLS) for (const p of cur[k].rsc) { const s = scrape.find((x) => H_(x.slug) === H_(p.slug)); if (s && (s.salePriceCop !== p.priceValue || s.listPriceCop !== p.originalPriceValue)) priceDrift.push(H_(p.slug)); }
    P("Precios actuales distintos a los del scrape 2026-09-28: " + (priceDrift.join(", ") || "ninguno") + ".");
  }
  P("Formato de precio: la tarjeta actual muestra '$ 183.920' (punto de miles, sin decimales, prefijo '$ ' con espacio; el caracter tras '$' es U+00A0 en el HTML actual: " + cur["oasis-natural"].cards[0].price.charCodeAt(1).toString(16) + "; la captura Dev viene con espacios normalizados, asi que ese detalle en Dev es NOT_VERIFIED y visualmente no cambia). La ficha Dev (priceTxt) muestra el mismo formato: " + (devP.every((p) => new RegExp("^" + money(Math.round(Number(p.vr[0][2]))).replace(/\$/g, "\\$").replace(/\./g, "\\.") + " ").test(p.priceTxt)) ? "SI en los 29 [MEDIDO-03G]" : "NO en alguno") + ". El HTML de la TARJETA de coleccion en Dev no se capturo (solo conteos): formato de tarjeta Dev [NOT_VERIFIED]; la tarjeta usa el mismo snippet 'price' (theme-src/snippets/price.liquid) [DOC].");
  P("Descuento: en el sitio actual el -20% sale del calculo del sitio ('20% de descuento en toda la tienda'); en Dev es un compare_at_price estatico cargado por CSV (precio = 80% del anterior, redondeado): " + (devP.every((p) => Math.abs(Number(p.vr[0][2]) - Number(p.vr[0][3]) * 0.8) <= 1) ? "verificado en los 29 (|precio - 0.8*anterior| <= 1)" : "NO en alguno") + ".");
  P("Diferencia funcional de tarjeta [DOC theme-src/sections/main-collection.liquid]: overlay_cta='" + ((R("theme-src/sections/main-collection.liquid").match(/overlay_cta: '([a-z_]+)'/) || [])[1]) + "' (Dev: 'Ver producto'); el actual muestra 'Vista rapida' (modal) en " + cur["oasis-natural"].cards.filter((c) => c.quickView).length + " de " + cur["oasis-natural"].cards.length + " tarjetas de Oasis [MEDIDO-03G]. Boton de favoritos en las tarjetas actuales: " + cur["oasis-natural"].cards.every((c) => c.heart) + ".");
}

// =====================================================================
H("## T5. Banner, descripcion y fallback");
{
  const rows = [];
  for (const k of ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"]) {
    const c = cur[k], d = devCol[k];
    const mm = media.find((m) => m.source && c.banner.url && m.source === c.banner.url);
    rows.push([TITLE[k], c.banner.kind, (c.banner.url || "").replace(/^.*\/upload\//, "…/upload/"), c.banner.pos + " · " + c.banner.size, mm ? mm.id + " (" + mm.status + ")" : "sin fila en el manifiesto", d.banner ? "si" : "no", d.bannerImg ? "imagen" : "sin imagen -> arte por tono", c.bannerDesc.length + " / " + d.metaDescChars]);
  }
  table(["Coleccion", "Actual: banner", "Actual: URL de la imagen", "Actual: encuadre (pos · size)", "Manifiesto de medios (content/media/media-migration-manifest.csv)", "Dev: banner renderizado", "Dev: fondo", "Largo descripcion actual / Dev (meta description)"], rows);
  P();
  const banner = R("theme-src/snippets/collection-banner.liquid");
  const tone = (banner.match(/description_tone \| default: '([a-z]+)'/) || [])[1];
  const css = R("theme-src/assets/section-collection-banner.css");
  const grad = (css.match(new RegExp("\\.collection-banner__art--" + tone + "[^{]*\\{\\s*background:\\s*([^;]+);")) || [])[1];
  {
    // CORREGIDO por el verificador (03G): description_tone SI tiene dato en 4 colecciones (03C punto 27); solo Destacados
    // y Home page caen en 'stone'. El render real del tono en la Dev no esta en la evidencia (NOT_VERIFIED).
    const c03 = R("theme/03C-catalog-import-report.md");
    const tm = c03.match(/oasis-natural = (\w+), aurora-viva = (\w+), espuma-de-ola = (\w+), salidas-de-bano = (\w+)/);
    const toneOf = { "oasis-natural": tm[1], "aurora-viva": tm[2], "espuma-de-ola": tm[3], "salidas-de-bano": tm[4] };
    const gradOf = (t) => (css.match(new RegExp("\\.collection-banner__art--" + t + "[^{]*\\{\\s*background:\\s*([^;]+);")) || [])[1];
    const cp = RW("components/catalog/catalog-page.tsx");
    const curToneOf = (label) => (cp.match(new RegExp('"' + label + '": \\{\\s*tone: "(\\w+)"')) || [])[1];
    P("Cadena de fallback del theme [DOC theme-src/snippets/collection-banner.liquid]: video cover_video -> cover_image con encuadre (si hay pos_x, pos_y y zoom) -> collection.image -> arte decorativo por tono (`custom.description_tone`, por defecto '" + tone + "'). Las 6 colecciones Dev tienen bannerImg=false [MEDIDO-03G] y los metafields de portada vacios (M10-M13 pendientes). `description_tone` SI tiene dato en 4 colecciones [DOC theme/03C-catalog-import-report.md punto 27]: " + ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"].map((k) => TITLE[k] + " = " + toneOf[k] + " (`" + gradOf(toneOf[k]) + "`)").join("; ") + ". Destacados y Home page no tienen ese metafield y caen en el tono por defecto '" + tone + "' (`" + grad + "`). Todos con 'highlight' radial y textura diagonal. El tono que la Dev renderiza de verdad NO esta en la evidencia (dev-collections.json no guarda la clase del arte): NOT_VERIFIED. Respaldo del sitio actual cuando una categoria no tiene foto [DOC components/catalog/catalog-page.tsx CATEGORY_COPY]: " + ["Oasis Natural", "Aurora Viva", "Espuma de Ola", "Salidas de Baño"].map((l) => l + " = " + curToneOf(l)).join("; ") + ".");
  }
  P("Descripciones: longitud de la descripcion actual == metaDescChars Dev en las 4: " + ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"].every((k) => cur[k].bannerDesc.length === devCol[k].metaDescChars) + ". El TEXTO Dev no esta en la evidencia: igualdad de texto NOT_VERIFIED (solo coincide el largo).");
  P("Texto de la descripcion actual (banner == meta description en las 4): " + ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"].map((k) => TITLE[k] + ": " + (cur[k].bannerDesc === cur[k].metaDesc ? "banner=meta" : "banner!=meta")).join("; ") + ".");
  P("Destacados y Home page (frontpage) en Dev: banner renderizado con arte por defecto y metaDescChars=0 (sin descripcion): titulo '" + TITLE.destacados + "' / '" + TITLE.frontpage + "'.");
  P("Home: tarjeta 'Salidas de Baño' de Dev sin imagen (0 productos, no hay imagen de respaldo) [MEDIDO-03G dev-home.json: '" + (devHome.sections.find((s) => s.id === "featured-categories").note) + "']; M09 CRITICO en el manifiesto.");
}

// =====================================================================
H("## T6. Orden / sort");
{
  const curSort = cur["oasis-natural"].groups.find((g) => g.name === "Ordenar por").opts;
  const same3 = COLS.concat(["salidas-de-bano", ...NONMIG]).every((k) => eq(cur[k].groups.find((g) => g.name === "Ordenar por").opts, curSort));
  P("Actual (identico en las 9 paginas de coleccion): " + curSort.join(" | ") + " -> " + (same3 ? "identico" : "distinto entre paginas") + ".");
  P("Dev [MEDIDO-03G, dev-collections.json nota]: 9 opciones en las 6 colecciones: manual ('Destacados' por locale), most-relevant, best-selling, title-asc, title-desc, price-asc, price-desc, created-asc, created-desc. Las etiquetas Dev distintas de 'Destacados' NO se capturaron: NOT_VERIFIED.");
  table(["Opcion actual", "Semantica actual [DOC catalog-actions.ts]", "Equivalente Dev", "Nota"], [
    ["novedades (por defecto)", "createdAt ascendente (antiguos primero)", "manual (Destacados) o created-asc", "Ninguno reproduce el orden actual: manual = alta inversa de importacion (T2); created-asc = fecha de creacion en Shopify = fecha de importacion, no la de la base anterior [INFERIDO]"],
    ["precio-asc", "priceValue ascendente", "price-asc", "Equivalente"],
    ["precio-desc", "priceValue descendente", "price-desc", "Equivalente"],
    ["(no existe)", "-", "best-selling, most-relevant, title-asc, title-desc, created-desc", "5 opciones extra nativas (theme/collection-report.md §11: se itera collection.sort_options sin inventar opciones)"],
  ]);
  P();
  P("Sondeo de orden en el sitio actual [MEDIDO-03G, GET puntual]:");
  P();
  const idx = JSON.parse(R("launch/evidence/03g-collection-filter-probe/index.json"));
  const probe = (name) => parseCollectionPage(R("launch/evidence/03g-collection-filter-probe/" + name + ".html"));
  const rowsS = [];
  for (const [nm, kk] of [["oasis-orden-precio-asc", "oasis-natural"], ["oasis-orden-precio-desc", "oasis-natural"], ["aurora-orden-precio-asc", "aurora-viva"], ["aurora-orden-precio-desc", "aurora-viva"]]) {
    const pg = probe(nm);
    const prices = pg.rsc.map((p) => p.priceValue);
    const asc = prices.every((x, i) => i === 0 || x >= prices[i - 1]);
    const desc = prices.every((x, i) => i === 0 || x <= prices[i - 1]);
    const def = curSlugs(kk);
    const tiesStable = (() => { // dentro de cada precio, el orden relativo == orden por defecto
      const byP = {}; pg.rsc.forEach((p) => (byP[p.priceValue] ||= []).push(H_(p.slug)));
      return Object.values(byP).every((arr) => eq(arr, def.filter((x) => arr.includes(x))));
    })();
    rowsS.push([nm, idx.find((r) => r.name === nm).path, prices.length, asc ? "no decreciente" : desc ? "no creciente" : "sin orden", tiesStable ? "empates en orden por defecto" : "empates en otro orden", pg.rsc.map((p) => H_(p.slug)).join(", ")]);
  }
  table(["Sondeo", "Ruta", "Tarjetas", "Precio", "Empates", "Handles en orden"], rowsS);
}

// =====================================================================
H("## T7. Filtros");
{
  const g = cur["oasis-natural"].groups.filter((x) => x.name !== "Ordenar por");
  const sameF = COLS.concat(["salidas-de-bano", ...NONMIG]).every((k) => eq(cur[k].groups.filter((x) => x.name !== "Ordenar por"), g));
  table(["Grupo actual", "Opciones [MEDIDO-03G]"], g.map((x) => [x.name, x.opts.join(" · ")]));
  P();
  P("Los grupos de filtros actuales son identicos en las 9 paginas (incluidas las vacias): " + sameF + ".");
  P("Dev [MEDIDO-03G]: " + ["oasis-natural", "aurora-viva", "espuma-de-ola", "destacados"].map((k) => TITLE[k] + " = " + devCol[k].filterGroups.join(" + ")).join("; ") + "; " + ["salidas-de-bano", "frontpage"].map((k) => TITLE[k] + " = " + devCol[k].filterGroups.join(" + ")).join("; ") + ". Sin Talla ni Color (Search & Discovery no instalada = dependencia A3 [DOC theme/03F-owner-actions-minimal.md]); Disponibilidad oculta por ajuste (collection_show_availability_filter=" + SETTINGS.collection_show_availability_filter + " en theme-src/config/settings_data.json; valor guardado en la Dev Store: NOT_VERIFIED).");
  P();
  P("### Cobertura de cada filtro actual frente a los 29 productos reales (datos RSC, no ejecucion del filtro)");
  P();
  const all = {};
  for (const k of COLS) for (const p of cur[k].rsc) all[H_(p.slug)] = p;
  const prods = Object.values(all);
  const SIZE_OPTS = (srcData.match(/SIZE_OPTIONS = \[([^\]]*)\]/) || ["", ""])[1].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean);
  const COLOR_OPTS = (srcData.match(/COLOR_OPTIONS = \[([^\]]*)\]/) || ["", ""])[1].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean);
  table(["Talla (opcion actual)", "Productos con esa talla exacta"], SIZE_OPTS.map((s) => [s, prods.filter((p) => p.sizes.includes(s)).length]));
  P();
  const colVals = uniq(prods.map((p) => p.color)).sort();
  table(["Color (opcion actual)", "Coincidencia exacta (como `where.color in (...)`)", "Coincidencia sin distinguir mayusculas"], COLOR_OPTS.map((c) => [c, prods.filter((p) => p.color === c).length, prods.filter((p) => p.color.toLowerCase() === c.toLowerCase()).length]));
  P();
  P("Valores distintos de `color` en los 29 productos: " + colVals.join(" | ") + ".");
  P("Valores de color de los productos que ninguna opcion del filtro actual puede alcanzar (ni ignorando mayusculas): " + colVals.filter((v) => !COLOR_OPTS.some((c) => c.toLowerCase() === v.toLowerCase())).join(", ") + ".");
  const buckets = [...srcData.matchAll(/\{ id: "([^"]+)", label: "([^"]+)", min: (\d+), max: ([\d.A-Za-z]+) \}/g)].map((x) => ({ id: x[1], label: x[2], min: Number(x[3]), max: x[4] === "Infinity" ? Infinity : Number(x[4]) }));
  P();
  // CORREGIDO por el verificador (03G): buildWhere filtra por Product.priceValue de la BD = precio de LISTA (antes del
  // descuento; toPlaceholderProduct lo expone como originalPriceValue). El conteo por tramo es el mismo con el precio final.
  table(["Precio (opcion actual)", "id", "Rango (unidades = COP)", "Productos cuyo precio de lista COP cae en el rango", "Idem con el precio final (con descuento)"], buckets.map((b) => [b.label, b.id, b.min + " a " + (b.max === Infinity ? "inf" : b.max), prods.filter((p) => p.originalPriceValue >= b.min && p.originalPriceValue < b.max).length, prods.filter((p) => p.priceValue >= b.min && p.priceValue < b.max).length]));
  P();
  P("Conversion de unidades [DOC lib/currency/subunits.ts]: toSubunits(x)=Math.round(x) (identidad, COP sin centavos): " + (/return Math\.round\(amount\)/.test(srcSubunits) ? "SI" : "NO") + ". Los rangos $50/$100/$200 se comparan contra pesos y contra el precio de lista (columna Product.priceValue, antes del descuento; [DOC lib/catalog/catalog-actions.ts buildWhere]): lista " + Math.min(...prods.map((p) => p.originalPriceValue)) + " a " + Math.max(...prods.map((p) => p.originalPriceValue)) + " COP; precio final con descuento " + Math.min(...prods.map((p) => p.priceValue)) + " a " + Math.max(...prods.map((p) => p.priceValue)) + " COP.");
  P();
  P("### Sondeo de filtros en el sitio actual [MEDIDO-03G, GET puntual a /oasis-natural con parametro; Oasis tiene 10 productos]");
  P();
  const pr = [["oasis-talla-S", "talla=S"], ["oasis-color-titlecase-Beige", "color=Beige (etiqueta de la UI)"], ["oasis-color-uppercase-BEIGE", "color=BEIGE (valor de los datos)"], ["oasis-precio-menos-50", "precio=menos-50"], ["oasis-precio-mas-200", "precio=mas-200"]];
  const rowsF = pr.map(([nm, label]) => {
    const pg = parseCollectionPage(R("launch/evidence/03g-collection-filter-probe/" + nm + ".html"));
    return [label, idx0().find((r) => r.name === nm).status, pg.countText + " productos (texto)", pg.cards.length + " tarjetas", pg.empty ? pg.empty.join(" / ") : "-"];
  });
  table(["Filtro", "HTTP", "Contador", "Tarjetas", "Estado vacio"], rowsF);
}
function idx0() { return JSON.parse(R("launch/evidence/03g-collection-filter-probe/index.json")); }

// =====================================================================
H("## T8. Grilla por breakpoint");
{
  // Dev: evaluador minimo de CSS sobre theme-src/assets/component-grid.css
  const css = R("theme-src/assets/component-grid.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = []; let order = 0;
  function scan(text, minW) {
    let i = 0;
    while (i < text.length) {
      const b = text.indexOf("{", i); if (b < 0) break;
      const pre = text.slice(i, b).trim();
      let d = 1, j = b + 1;
      while (j < text.length && d > 0) { if (text[j] === "{") d++; else if (text[j] === "}") d--; j++; }
      const body = text.slice(b + 1, j - 1);
      if (pre.startsWith("@media")) { const mw = pre.match(/min-width:\s*(\d+)px/); scan(body, mw ? Number(mw[1]) : 0); }
      else if (!pre.startsWith("@")) {
        const dm = body.match(/grid-template-columns:\s*([^;]+);/);
        if (dm) for (const sel of pre.split(",")) rules.push({ sel: sel.trim(), minW, val: dm[1].trim(), order: order++ });
      }
      i = j;
    }
  }
  scan(css, 0);
  const devCols = (vista, w) => {
    const cls = ["grid", "grid--catalog", "grid--" + vista];
    let best = null;
    for (const r of rules) {
      const cs = r.sel.split(".").filter(Boolean);
      if (!cs.every((c) => cls.includes(c)) || !r.sel.startsWith(".") || r.minW > w) continue;
      if (!best || cs.length > best.spec || (cs.length === best.spec && r.order > best.order)) best = { spec: cs.length, order: r.order, val: r.val };
    }
    if (!best) return "?";
    const m = best.val.match(/repeat\((\d+),/); return m ? Number(m[1]) : best.val === "1fr" ? 1 : best.val;
  };
  const gc = {}; for (const m of srcGrid.matchAll(/^\s*(\d): "([^"]+)",/gm)) gc[m[1]] = m[2];
  const twCols = (vista, w) => {
    const bp = { "": 0, sm: 640, md: 768, lg: 1024 }; let best = -1, val = "?";
    for (const t of gc[vista].split(/\s+/)) { const m = t.match(/^(?:(sm|md|lg):)?grid-cols-(\d+)$/); if (m && bp[m[1] || ""] <= w && bp[m[1] || ""] >= best) { best = bp[m[1] || ""]; val = Number(m[2]); } }
    return val;
  };
  const widths = [375, 639, 640, 767, 768, 1023, 1024, 1440];
  const rows = [];
  for (const v of [2, 3, 4]) rows.push(["vista=" + v, ...widths.map((w) => twCols(v, w) + " / " + devCols(v, w))]);
  table(["Vista (columnas elegidas)", ...widths.map((w) => w + " px (actual / Dev)")], rows);
  P();
  const same = [2, 3, 4].every((v) => widths.every((w) => String(twCols(v, w)) === String(devCols(v, w))));
  P("Columnas iguales en las 3 vistas y los 8 anchos: " + (same ? "SI" : "NO") + ". Clases del sitio actual [DOC components/catalog/catalog-grid.tsx GRID_CLASSES]: " + [2, 3, 4].map((v) => v + ": " + gc[v]).join("; ") + ".");
  P("HTML actual [MEDIDO-03G]: clases de la grilla por defecto = `" + cur["oasis-natural"].grid + "`, vista marcada = " + cur["oasis-natural"].vista + " columnas.");
  const cfg = SETTINGS;
  P("Dev [DOC theme-src/config/settings_data.json]: columnas por defecto = " + cfg.collection_default_columns + "; productos por pagina = " + cfg.collection_products_per_page + " (actual: PAGE_SIZE=" + ((srcActions.length && RW("components/catalog/catalog-page.tsx").match(/PAGE_SIZE = (\d+)/) || [])[1]) + "; con maximo 12 productos por coleccion ninguno pagina).");
  P("Separacion entre tarjetas: actual gap-4 (16 px) y desde 640 px gap-6 (24 px); Dev --space-4 = 16 px y --space-6 = 24 px desde 640 px (theme-src/assets/variables.css, component-grid.css) [DOC].");
  P("Selector 2/3/4 del theme: solo JS (assets/collection-filters.js, parametro `vista`), igual que el actual (boton con aria-pressed). Persistencia: URL; el actual tambien.");
}

// =====================================================================
H("## T9. Salidas de Baño (0 productos) y las 5 rutas no migrables");
{
  const rows = [];
  for (const k of ["salidas-de-bano", ...NONMIG]) {
    const c = cur[k];
    rows.push([k, statusOf("/" + k), c.robots, c.h1, c.countText + " productos", c.banner.kind + (c.banner.kind === "imagen" ? "" : " (" + c.banner.art + ")"), c.empty ? c.empty.join(" / ") : "sin estado vacio", sitemapLocs.includes("/" + k) ? "si" : "no",
      headerNav.some((x) => x.endsWith("/" + k)) ? "si" : "no", footerLinks.includes("/" + k) ? "si" : "no", homeCats.some((x) => x.endsWith("/" + k)) ? "si" : "no"]);
  }
  table(["Ruta actual", "HTTP", "robots", "h1", "Contador", "Banner", "Estado vacio [MEDIDO-03G]", "En sitemap", "En menu", "En footer", "En Home (categorias)"], rows);
  P();
  P("Paginas que llegan con esqueleto de carga en <main> y el contenido real en un segmento oculto de streaming (<div hidden id=\"S:1\">): " + (["salidas-de-bano", ...NONMIG].filter((k) => cur[k].streamed).join(", ") || "ninguna") + ". El script las lee del segmento; el render final es el mismo que el de las demas.");
  P();
  P("Menu actual: " + headerNav.join(" · ") + ". Home actual (Categorias destacadas): " + homeCats.join(" · ") + ".");
  const mm = colMaster.filter((r) => ["salidas-de-bano", ...NONMIG].includes(r.slug));
  P();
  table(["slug", "products_count", "target_status", "keep_remove", "redirect_required (collections-master.csv)"], mm.map((r) => [r.slug, r.products_count, r.target_status, r.keep_remove, r.redirect_required]));
  P();
  const redirFrom = redirects.map((r) => r[0]);
  table(["Ruta", "Redireccion en seo/shopify-redirects-import.csv", "Estado esperado en Dev/Shopify"], ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano", ...NONMIG].map((k) => [k, redirFrom.includes("/" + k) ? "si -> " + redirects.find((r) => r[0] === "/" + k)[1] : "no", redirFrom.includes("/" + k) ? "301 a la coleccion" : "404 (no existe la coleccion)"]));
  P();
  P("Dev [MEDIDO-03G dev-home.json]: menu = " + devHome.headerNav.filter((x) => /collections/.test(x)).join(" · ") + "; footer 'Comprar' = " + devHome.footer.columnComprar.join(", ") + "; Home 'Categorias destacadas' = " + devHome.sections.find((s) => s.id === "featured-categories").cards.map((c) => c.h3 + " -> " + c.href).join(" · ") + ".");
  const nm = R("theme-src/locales/es.default.json");
  P("Estado vacio Dev: no capturado como HTML (solo cards=0 y filterGroups=['Ordenar por'] en dev-collections.json). Texto del theme [DOC theme-src/locales/es.default.json collections.general.no_matches]: '" + JSON.parse(nm).collections.general.no_matches + "' dentro de <p class=\"state-empty\"> (main-collection.liquid). Render real del vacio en Dev: NOT_VERIFIED.");
  {
    // CORREGIDO por el verificador (03G): el sitio actual SI pluraliza el contador.
    const curToolbar = RW("components/catalog/catalog-toolbar.tsx");
    const curPlural = /\{resultCount\} \{resultCount === 1 \? "producto" : "productos"\}/.test(curToolbar);
    const vr = JSON.parse(nm).general.filters.view_results;
    P("Contador Dev [DOC]: '" + JSON.parse(nm).collections.general.items_count + "' es una cadena unica, sin plural: con 1 producto dira '1 productos'. El actual pluraliza ('1 producto' / 'N productos', components/catalog/catalog-toolbar.tsx): " + (curPlural ? "SI" : "NO") + ". El boton 'Ver N' del cajon de filtros de la Dev si distingue singular y plural ('" + vr.one + "' / '" + vr.other + "'). Con las colecciones actuales (0, 7, 10 y 12 productos) no se nota; aparece con un filtro que deje 1 resultado.");
  }
  const banner = R("theme-src/snippets/collection-banner.liquid");
  P("Regla del theme para el 'estado vacio' [DOC main-collection.liquid]: si paginate.items == 0 imprime solo el parrafo; no hay mensaje especifico de 'proximamente' ni enlace de retorno.");
  P("Banner de las 5 rutas no migrables (actual): arte decorativo por tono, sin imagen; equivalen a los banners con arte de Dev (mismo componente placeholder-art) [DOC theme-src/assets/section-collection-banner.css].");
  P("Sitemap actual, URLs de coleccion: " + sitemapLocs.filter((x) => /^\/(oasis-natural|aurora-viva|espuma-de-ola|salidas-de-bano|accesorios|hombre|mujer|ninos|calzado)$/.test(x)).join(", ") + ".");
}

// =====================================================================
H("## T10. Controles de codigo del sitio actual (contrastan el HTML con el repo; el despliegue = repo es NOT_VERIFIED)");
{
  const sortHtml = cur["oasis-natural"].groups.find((g) => g.name === "Ordenar por").opts.map((x) => x.split("=")[0]);
  const sortSrc = [...srcData.matchAll(/\{ id: "([^"]+)", label: "[^"]+" \}/g)].map((x) => x[1]);
  const colorHtml = cur["oasis-natural"].groups.find((g) => g.name === "Color").opts;
  const colorSrc = (srcData.match(/COLOR_OPTIONS = \[([^\]]*)\]/) || ["", ""])[1].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean);
  const sizeHtml = cur["oasis-natural"].groups.find((g) => g.name === "Talla").opts;
  const sizeSrc = (srcData.match(/SIZE_OPTIONS = \[([^\]]*)\]/) || ["", ""])[1].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean);
  const priceHtml = cur["oasis-natural"].groups.find((g) => g.name === "Precio").opts;
  const priceSrc = [...srcData.matchAll(/label: "([^"]+)", min:/g)].map((x) => x[1]);
  const gridHtml = cur["oasis-natural"].grid;
  table(["Control", "Resultado"], [
    ["Opciones de orden HTML == SORT_OPTIONS del codigo", yn(eq(sortHtml, sortSrc))],
    ["Opciones de talla HTML == SIZE_OPTIONS", yn(eq(sizeHtml, sizeSrc))],
    ["Opciones de color HTML == COLOR_OPTIONS", yn(eq(colorHtml, colorSrc))],
    ["Etiquetas de precio HTML == PRICE_BUCKETS", yn(eq(priceHtml, priceSrc))],
    ["Clases de la grilla HTML == GRID_CLASSES[3]", yn(gridHtml === gc0()["3"])],
    ["Orden por defecto del codigo = createdAt asc", /return \{ createdAt: "asc" \};/.test(srcActions) ? "SI" : "NO"],
    ["Filtro de color del codigo: where.color = { in: colors } (comparacion exacta)", /where\.color = \{ in: colors \}/.test(srcActions) ? "SI" : "NO"],
  ]);
}
function gc0() { const g = {}; for (const m of RW("components/catalog/catalog-grid.tsx").matchAll(/^\s*(\d): "([^"]+)",/gm)) g[m[1]] = m[2]; return g; }

// =====================================================================
H("## Resumen de diferencias detectadas por el script");
{
  const s = [];
  for (const k of COLS) { s.push([TITLE[k] + ": membresia", yn(eq([...ORD[k].a].sort(), [...ORD[k].d].sort()))]); s.push([TITLE[k] + ": orden", yn(eq(ORD[k].a, ORD[k].d)) + " (" + ORD[k].a.filter((x, i) => ORD[k].d[i] === x).length + "/" + ORD[k].a.length + " posiciones)"]); }
  s.push(["Salidas de Baño: membresia", yn(curSlugs("salidas-de-bano").length === 0 && devCol["salidas-de-bano"].n === 0)]);
  s.push(["Destacados: membresia", yn(eq([...homeFeatured].sort(), [...devCol.destacados.order].sort()))]);
  s.push(["Destacados: orden (captura actual vs Dev)", yn(eq(homeFeatured, devCol.destacados.order))]);
  table(["Comparacion", "Resultado"], s);
}

process.stdout.write(out.join("\n").replace(/wa\.me\/\d+/g, "wa.me/<omitido>") + "\n");
