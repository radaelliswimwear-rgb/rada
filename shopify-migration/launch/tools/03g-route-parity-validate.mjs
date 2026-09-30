// 03G -- validador ADVERSARIAL e INDEPENDIENTE de launch/03G-route-parity.csv (+ detalle y .md).
// No importa ni ejecuta 03g-route-parity.mjs: re-deriva los hechos desde la evidencia cruda y compara.
// DETERMINISTA y OFFLINE: solo lee archivos del repo. No escribe nada. Sin red, sin fecha/hora.
// Uso:  node launch/tools/03g-route-parity-validate.mjs
// Sale con codigo 1 si falla algun control (FAIL). Los NOTE no hacen fallar: son observaciones de convencion.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, "..", "..");
const LAUNCH = path.join(MIG, "launch");
const EV = path.join(LAUNCH, "evidence");
const ORIGIN = "https://radaelliswimwear.com";
const read = (...p) => fs.readFileSync(path.join(...p), "utf8");

// ---------------------------------------------------------------- parser CSV propio (RFC 4180, con celdas entrecomilladas y saltos)
function parseCsv(text) {
  const out = []; let row = []; let cell = ""; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); out.push(row); row = []; cell = ""; }
    else if (ch === "\r") { /* ignorar */ }
    else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); out.push(row); }
  return out;
}

// ---------------------------------------------------------------- resultados
let fails = 0, notes = 0;
const PASSLOG = [];
function check(name, ok, detail = "") {
  if (ok) { PASSLOG.push(name); console.log(`PASS  ${name}${detail ? "  -- " + detail : ""}`); }
  else { fails++; console.log(`FAIL  ${name}${detail ? "  -- " + detail : ""}`); }
}
function note(name, detail = "") { notes++; console.log(`NOTE  ${name}${detail ? "  -- " + detail : ""}`); }

// ---------------------------------------------------------------- vocabulario (definido en 03G-route-parity.md secciones 2 y 3)
const STATUS = new Set(["PASS", "PASS_WITH_INTENTIONAL_CHANGE", "BLOCKED_BY_OWNER", "MISSING", "NOT_APPLICABLE"]);
const PAR = new Set(["MATCH", "INTENTIONAL_CHANGE", "GAP", "NOT_APPLICABLE", "NOT_MEASURED"]);
const SURFACES = new Set(["Home", "Colección", "Producto", "Búsqueda", "Carrito", "Checkout", "Cuenta", "Favoritos", "Legal", "Ayuda", "SEO técnico", "Error", "Otras"]);
const HEADER = ["surface", "current_url", "shopify_url", "status", "content_parity", "function_parity", "visual_parity", "known_dependency", "action_needed"];
const LOTE = new Set(["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "C5"]);

// ---------------------------------------------------------------- carga
const csvText = read(LAUNCH, "03G-route-parity.csv");
const csv = parseCsv(csvText);
const header = csv[0];
const data = csv.slice(1).filter((r) => !(r.length === 1 && r[0] === ""));
const rows = data.map((r, i) => ({ n: i + 1, id: "RP-" + String(i + 1).padStart(3, "0"), ...Object.fromEntries(HEADER.map((k, j) => [k, r[j]])) }));
const detText = read(LAUNCH, "03G-route-parity-detail.csv");
const det = parseCsv(detText);
const detHeader = det[0];
const detRows = det.slice(1).filter((r) => !(r.length === 1 && r[0] === "")).map((r) => Object.fromEntries(detHeader.map((k, j) => [k, r[j]])));
const md = read(LAUNCH, "03G-route-parity.md");

const crawl = JSON.parse(read(EV, "current-site", "index.json"));
const probe = JSON.parse(read(EV, "current-site-probe", "index.json"));
const devProducts = read(EV, "dev-products.jsonl").trim().split("\n").map((l) => JSON.parse(l));
const devCols = JSON.parse(read(EV, "dev-collections.json")).collections;
const devHome = JSON.parse(read(EV, "dev-home.json"));
const devRoutes = JSON.parse(read(EV, "dev-routes.json"));
const redirCsv = parseCsv(read(MIG, "seo", "shopify-redirects-import.csv"));
const redirs = redirCsv.slice(1).filter((r) => r[0]).map((r) => ({ from: r[0], to: r[1] }));
const redirBy = new Map(redirs.map((r) => [r.from.toLowerCase(), r.to]));
const sitemapLocs = [...read(EV, "current-site", "sitemap.xml.txt").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(ORIGIN, "") || "/");

const crawlBy = new Map(crawl.map((r) => [r.url, r]));
const probeBy = new Map(probe.map((r) => [r.url, r]));
const httpOf = (url) => (crawlBy.get(url) || probeBy.get(url) || {}).status ?? null;
const htmlOf = (rec) => read(EV, rec.dir || "current-site", rec.file);
const htmlByUrl = (url) => { const r = crawlBy.get(url); return r && r.file ? read(EV, "current-site", r.file) : null; };
const probeHtml = (url) => { const r = probeBy.get(url); return r && r.file ? read(EV, "current-site-probe", r.file) : null; };

// ================================================================= 1. ESTRUCTURA DEL CSV
console.log("=== 1. ESTRUCTURA DEL CSV PRINCIPAL ===");
check("Sin BOM y con saltos de linea LF", !csvText.startsWith("\uFEFF") && !csvText.includes("\r"));
check("Cabecera exacta de 9 columnas", header.length === 9 && header.join(",") === HEADER.join(","), header.join(","));
check("Cada fila tiene exactamente 9 celdas", data.every((r) => r.length === 9), `filas con otro largo: ${data.filter((r) => r.length !== 9).length}`);
check("Ninguna celda vacia", data.every((r) => r.every((c) => c.trim() !== "")));
check("status dentro del conjunto permitido", rows.every((r) => STATUS.has(r.status)), [...new Set(rows.filter((r) => !STATUS.has(r.status)).map((r) => r.status))].join(","));
check("content/function/visual dentro del conjunto permitido", rows.every((r) => [r.content_parity, r.function_parity, r.visual_parity].every((v) => PAR.has(v))));
check("surface dentro del conjunto permitido", rows.every((r) => SURFACES.has(r.surface)));
check("visual_parity nunca es MATCH", rows.every((r) => r.visual_parity !== "MATCH"));
const realCur = rows.filter((r) => r.current_url.startsWith(ORIGIN));
const curKeys = realCur.map((r) => r.current_url);
check("Cero duplicados de current_url (exacto)", curKeys.length === new Set(curKeys).size, `${curKeys.length} URLs`);
check("Cero duplicados de current_url (sin distinguir mayusculas)", curKeys.length === new Set(curKeys.map((u) => u.toLowerCase())).size);
const shopOnly = rows.filter((r) => r.current_url === "NOT_APPLICABLE");
check("Filas solo-Shopify: shopify_url sin duplicados", shopOnly.length === new Set(shopOnly.map((r) => r.shopify_url)).size, `${shopOnly.length} filas`);
check("Toda fila tiene current_url real (dominio actual) o NOT_APPLICABLE", rows.every((r) => r.current_url === "NOT_APPLICABLE" || r.current_url.startsWith(ORIGIN + "/") || r.current_url === ORIGIN + "/"));
check("known_dependency: solo codigos del lote 03F o 'ninguna'", rows.every((r) => r.known_dependency === "ninguna" || r.known_dependency.split(";").every((d) => LOTE.has(d))));
// se ignoran las frases que niegan o condicionan el codigo ("no esta en el lote C5", "sumar /blogs/news a la limpieza C5")
const codesIn = (s) => [...new Set([...s.replace(/[^.]*(no está|limpieza)[^.]*\./gi, " ").matchAll(/\b([ABC][1-5])\b/g)].map((m) => m[1]))];
const actionOutOfDeps = rows.filter((r) => codesIn(r.action_needed).some((c) => LOTE.has(c) && !r.known_dependency.split(";").includes(c)));
check("Todo codigo A1..C5 citado en action_needed (salvo frases negadas o condicionales) figura en known_dependency", actionOutOfDeps.length === 0, actionOutOfDeps.map((r) => r.id).join(" "));
check("BLOCKED_BY_OWNER exige al menos una dependencia del lote", rows.filter((r) => r.status === "BLOCKED_BY_OWNER").every((r) => r.known_dependency !== "ninguna"));
check("MISSING no depende del lote owner", rows.filter((r) => r.status === "MISSING").every((r) => r.known_dependency === "ninguna"));
check("Fila con shopify_url NOT_AVAILABLE es BLOCKED_BY_OWNER o MISSING", rows.filter((r) => r.shopify_url === "NOT_AVAILABLE").every((r) => ["BLOCKED_BY_OWNER", "MISSING"].includes(r.status)));
const priv = /wa\.me|\+57|\b57\d{10}\b|checkouts\/cn|@[a-z0-9-]+\.[a-z]{2,}|\bsk_[a-z]+_|shpat_|Bearer /i;
check("Privacidad: ni telefonos, ni wa.me, ni tokens, ni URLs de checkout en CSV, detalle y .md", ![csvText, detText, md].some((t) => priv.test(t)));

console.log("\n=== 2. CONSISTENCIA CSV PRINCIPAL vs DETALLE ===");
check("Mismo numero de filas en detalle y principal", detRows.length === rows.length, `${detRows.length} vs ${rows.length}`);
check("Detalle: mismos current_url, shopify_url, status y paridades fila por fila", rows.every((r, i) => { const d = detRows[i]; return d && d.current_url === r.current_url && d.shopify_url === r.shopify_url && d.status === r.status && d.content_parity === r.content_parity && d.function_parity === r.function_parity && d.visual_parity === r.visual_parity && d.surface === r.surface; }));
check("Detalle: ids RP-001.. consecutivos", detRows.every((d, i) => d.id === "RP-" + String(i + 1).padStart(3, "0")));

// ================================================================= 3. COBERTURA
console.log("\n=== 3. COBERTURA CONTRA LA EVIDENCIA CRUDA ===");
check("Rastreo: 70 URLs, 54 con 200, 16 con 404", crawl.length === 70 && crawl.filter((r) => r.status === 200).length === 54 && crawl.filter((r) => r.status === 404).length === 16);
const missingCrawl = crawl.filter((r) => !curKeys.includes(r.url));
check("Cada una de las 70 URLs del rastreo tiene fila (coincidencia exacta)", missingCrawl.length === 0, missingCrawl.map((r) => r.url).join(" "));
const probe200 = probe.filter((r) => r.status === 200 && !crawlBy.has(r.url));
check("Sondeos con 200 fuera del rastreo (4) tienen fila", probe200.length === 4 && probe200.every((r) => curKeys.includes(r.url)), probe200.map((r) => r.path).join(" "));
const redirMissing = redirs.filter((r) => !curKeys.map((u) => u.toLowerCase()).includes((ORIGIN + r.from).toLowerCase()));
check("Cada origen de las 47 redirecciones tiene fila", redirs.length === 47 && redirMissing.length === 0, redirMissing.map((r) => r.from).join(" "));
const known = new Set([...crawl.map((r) => r.url), ...probe.map((r) => r.url), ...redirs.map((r) => ORIGIN + r.from)]);
const docDerived = [ORIGIN + "/checkout/confirmacion/<orderId>", ORIGIN + "/checkout/wompi/retorno", ORIGIN + "/buscar?q=<t\u00e9rmino>"];
const untraceable = curKeys.filter((u) => !known.has(u) && !docDerived.includes(u));
check("Ninguna current_url inventada: todas salen del rastreo, sondeos, redirecciones o del plan 03E (retornos de checkout, placeholder de busqueda)", untraceable.length === 0, untraceable.join(" "));
const tr03E = read(MIG, "seo", "03E-redirect-plan.md");
check("Los retornos de checkout existen en seo/03E-redirect-plan.md", /checkout\/confirmacion\/\[orderId\]/.test(tr03E) && /checkout\/wompi\/retorno/.test(tr03E));
check("Productos: 29 en rastreo = 29 en Dev = 29 filas Producto", crawl.filter((r) => r.url.includes("/producto/")).length === 29 && devProducts.length === 29 && rows.filter((r) => r.surface === "Producto").length === 29);
{ // enlaces internos y sitemap: ninguna ruta enlazada desde el sitio actual queda sin fila
  const have = new Set(curKeys.map((u) => u.toLowerCase()));
  const links = new Map();
  for (const dir of ["current-site", "current-site-probe", "03g-collection-filter-probe"]) {
    for (const f of fs.readdirSync(path.join(EV, dir)).filter((x) => x.endsWith(".html"))) {
      const h = read(EV, dir, f);
      for (const m of h.matchAll(/href="(\/[^"#?]*)/g)) links.set(m[1], f);
      for (const m of h.matchAll(/href="(https:\/\/radaelliswimwear\.com[^"#?]*)/g)) links.set(m[1].replace(ORIGIN, "") || "/", f);
    }
  }
  const skip = (p) => p.startsWith("/_next") || p.startsWith("//") || /\.(png|jpe?g|webp|svg|ico|css|js|woff2?|mp4|xml|txt)$/i.test(p);
  const noRow = [...links.keys()].filter((p) => !skip(p) && !have.has((ORIGIN + p).toLowerCase()) && !have.has((ORIGIN + p.replace(/\/$/, "")).toLowerCase()));
  check(`Cada enlace interno (href) del HTML guardado del sitio actual tiene fila (${[...links.keys()].filter((p) => !skip(p)).length} rutas distintas)`, noRow.length === 0, noRow.join(" "));
  const smMiss = sitemapLocs.filter((p) => !have.has((ORIGIN + (p === "/" ? "/" : p)).toLowerCase()) && !have.has((ORIGIN + p).toLowerCase()));
  check("Cada URL del sitemap actual (45) tiene fila", sitemapLocs.length === 45 && smMiss.length === 0, smMiss.join(" "));
}
const c404 = crawl.filter((r) => r.status === 404);
check("Ninguna URL que da 404 hoy tiene redireccion", c404.every((r) => !redirBy.has((r.url.replace(ORIGIN, "") || "/").toLowerCase())));
check("Redirecciones: 47 filas, sin duplicados, sin cadenas ni bucles", redirBy.size === 47 && redirs.every((r) => !redirBy.has(r.to.toLowerCase())));

// destino con evidencia en la Dev Store
function destEv(to) {
  let m;
  if ((m = to.match(/^\/products\/([^?#]+)$/))) { const d = devProducts.find((x) => x.h === m[1]); return d && d.pdp === 200 ? "ok200" : "none"; }
  if ((m = to.match(/^\/collections\/([^?#]+)$/))) { const c = devCols.find((x) => x.h === m[1]); if (c) return c.status === 200 ? "ok200" : "none"; }
  for (const r of devRoutes.routes) {
    if (r.p.split(",").map((s) => s.trim()).includes(to)) {
      if (r.s === 200) return "ok200";
      if (typeof r.s === "string" && r.s.startsWith("opaque")) return "opaque";
      if (r.s === 404) return "404";
      return "other";
    }
  }
  return "none";
}
const dest = redirs.map((r) => ({ ...r, ev: destEv(r.to) }));
const cnt = (k) => dest.filter((d) => d.ev === k).length;
check("Redirecciones: 38 destinos con 200 medido + 9 opacos (/account*) + 0 sin evidencia", cnt("ok200") === 38 && cnt("opaque") === 9 && cnt("none") + cnt("404") + cnt("other") === 0, `${cnt("ok200")}/${cnt("opaque")}`);
check("Redirecciones opacas = exactamente las 9 /cuenta* que van a /account*", dest.filter((d) => d.ev === "opaque").every((d) => d.from.startsWith("/cuenta") && d.to.startsWith("/account")) && dest.filter((d) => d.from.startsWith("/cuenta") && d.to.startsWith("/account")).length === 9);
{ // aritmetica de dev-routes.json vs 03F: 38 = 4 colecciones + 29 productos + 5
  const cols = dest.filter((d) => d.to.startsWith("/collections/")).length, prods = dest.filter((d) => d.to.startsWith("/products/")).length;
  check("Aritmetica de las 38 verificadas: 4 colecciones + 29 productos + 5 (devoluciones, garantia, buscar, favoritos, cuenta/favoritos)", cols === 4 && prods === 29 && cnt("ok200") - cols - prods === 5, `${cols}+${prods}+${cnt("ok200") - cols - prods}`);
  check("dev-routes.json cita '33 x /producto/<slug>' pero 33 = 29 productos + 4 colecciones (etiqueta imprecisa en la evidencia; el CSV y 03F dicen 29)", /33 x \/producto/.test(JSON.stringify(devRoutes.redirects.sources_verified_200)) && cols + prods === 33);
}

// ================================================================= 4. RECALCULO DE HECHOS (independiente)
console.log("\n=== 4. HECHOS RECALCULADOS DESDE LA EVIDENCIA CRUDA ===");
const ldOf = (h) => [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } }).filter(Boolean);
const textOf = (h) => h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const uuidSuffix = /_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\.[a-z]+$)/i;
const prodExpect = new Map();
for (const rec of crawl.filter((r) => r.url.includes("/producto/"))) {
  const handle = rec.url.split("/producto/")[1].toLowerCase();
  const d = devProducts.find((x) => x.h === handle);
  const html = htmlOf(rec);
  const lds = ldOf(html);
  const p = lds.find((b) => b["@type"] === "Product"), bc = lds.find((b) => b["@type"] === "BreadcrumbList");
  const sizeSeg = (html.split("Talla</p>")[1] || "").split("</div></div>")[0];
  const sizes = [...sizeSeg.matchAll(/<button[^>]*aria-pressed[^>]*>([^<]*)<\/button>/g)].map((m) => m[1].trim());
  const norm = (s) => s.replace(/[\u2022\s]+/g, " ").trim();
  const txt = textOf(html);
  const pm = txt.match(/\$ ?([\d.]+) \$ ?([\d.]+)/);
  const checks = {
    nombre: p.name === d.t,
    descripcion: norm(p.description) === norm(d.desc),
    imagenes: JSON.stringify(p.image.map((u) => u.split("/").pop().replace(uuidSuffix, ""))) === JSON.stringify(d.im.map((n) => n.replace(uuidSuffix, ""))),
    precio: Number(p.offers.price) === Number(d.vr[0][2]) && d.vr.every((v) => v[2] === d.vr[0][2]),
    precio_texto: !!pm && Number(pm[1].replace(/\./g, "")) === Number(d.vr[0][2]) && Number(pm[2].replace(/\./g, "")) === Number(d.vr[0][3]),
    tallas: JSON.stringify(sizes) === JSON.stringify(d.vr.map((v) => v[0])),
    color: ("Color: " + p.color).toLowerCase() === d.color.toLowerCase(),
    categoria: p.category === d.ty,
    disponible_dev: d.vr.every((v) => v[4] === true),
  };
  const crumbCur = bc.itemListElement.map((e) => e.name).join(" / ");
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  const crumbOk = crumbCur === d.crumbs;
  const crumbOnlyDestacados = !crumbOk && d.crumbs.replace("/ Destacados /", "/ " + d.ty + " /") === crumbCur;
  let content = failed.length ? "GAP" : crumbOk ? "MATCH" : crumbOnlyDestacados ? "NOT_MEASURED" : "GAP";
  prodExpect.set(handle, { content, failed, cur: rec.url, sizesCur: sizes, sizesDev: d.vr.map((v) => v[0]), colorCase: ("Color: " + p.color) !== d.color, uuid: JSON.stringify(p.image.map((u) => u.split("/").pop())) !== JSON.stringify(d.im), crumbOnlyDestacados });
}
const cnts = (f) => [...prodExpect.values()].filter(f).length;
check("Productos recalculados: 28 MATCH, 1 GAP, 0 NOT_MEASURED (las 4 migas se re-midieron con RC1.8)", cnts((x) => x.content === "MATCH") === 28 && cnts((x) => x.content === "GAP") === 1 && cnts((x) => x.content === "NOT_MEASURED") === 0, `${cnts((x) => x.content === "MATCH")}/${cnts((x) => x.content === "GAP")}/${cnts((x) => x.content === "NOT_MEASURED")}`);
check("El unico GAP de producto es alba-dorada-cafe-claro y solo por tallas (actual S-M-L, Dev S-M-L-XL)", [...prodExpect].filter(([, x]) => x.content === "GAP").map(([h, x]) => h + ":" + x.failed.join(",")).join() === "alba-dorada-cafe-claro:tallas" && prodExpect.get("alba-dorada-cafe-claro").sizesCur.join("-") === "S-M-L" && prodExpect.get("alba-dorada-cafe-claro").sizesDev.join("-") === "S-M-L-XL");
check("Ya no quedan fichas NOT_MEASURED por miga: las 4 de Espuma de Ola se re-midieron con RC1.8 (evidencia crumbsRC17 conservada)", [...prodExpect].filter(([, x]) => x.content === "NOT_MEASURED").length === 0);
check("Diferencias de color solo de capitalizacion: costa-esmeralda-azul y entero-golden-hour", [...prodExpect].filter(([, x]) => x.colorCase).map(([h]) => h).sort().join() === "costa-esmeralda-azul,entero-golden-hour");
check("Sufijo UUID en nombre de imagen: solo amanecer-dorado-lila", [...prodExpect].filter(([, x]) => x.uuid).map(([h]) => h).join() === "amanecer-dorado-lila");
{ // el arreglo de RC1.8 (colección de categoria) reproduce la miga actual: el tipo de cada ficha coincide con el titulo de una coleccion que la contiene
  const byTitle = new Map(devCols.map((c) => [c.t, c]));
  const okAll = devProducts.every((d) => byTitle.has(d.ty) && byTitle.get(d.ty).order.includes(d.h));
  check("[INFERIDO] RC1.8: para las 29 fichas existe una coleccion con titulo = tipo que la contiene (la miga por categoria es calculable)", okAll);
}
const devColBy = new Map(devCols.map((c) => [c.h, c]));
const linksOf = (h) => { const o = []; for (const m of h.matchAll(/href="\/producto\/([^"#?]+)"/g)) { const s = m[1].toLowerCase(); if (!o.includes(s)) o.push(s); } return o; };
const colExpect = new Map();
for (const h of ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"]) {
  const html = htmlByUrl(ORIGIN + "/" + h), txt = textOf(html), cur = linksOf(html), dc = devColBy.get(h);
  colExpect.set(h, {
    n: [cur.length, dc.n], sameSet: JSON.stringify([...cur].sort()) === JSON.stringify([...dc.order].sort()), sameOrder: JSON.stringify(cur) === JSON.stringify(dc.order),
    bannerGap: /background-image:url\(/.test(html) && dc.bannerImg === false,
    curFilters: ["Talla", "Color", "Precio"].filter((g) => new RegExp("Filtros[\\s\\S]*\\b" + g + " ").test(txt)), devFilters: dc.filterGroups,
    posMatch: cur.filter((x, i) => dc.order[i] === x).length,
  });
}
const ce = (h) => colExpect.get(h);
check("Colecciones: mismo conjunto (10/12/7/0) pero orden por defecto distinto en las 3 con productos", ["oasis-natural", "aurora-viva", "espuma-de-ola"].every((h) => ce(h).sameSet && !ce(h).sameOrder) && ce("salidas-de-bano").sameOrder && [10, 12, 7, 0].join() === ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"].map((h) => ce(h).n[0]).join());
check("Colecciones: el actual filtra por Talla, Color y Precio; Dev solo 'Ordenar por' y 'Precio' (3 con productos)", ["oasis-natural", "aurora-viva", "espuma-de-ola"].every((h) => ce(h).curFilters.join() === "Talla,Color,Precio" && ce(h).devFilters.join() === "Ordenar por,Precio"));
check("Colecciones: el actual tiene imagen de banner en las 4 y Dev en ninguna (las 6 con bannerImg false)", ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"].every((h) => ce(h).bannerGap) && devCols.every((c) => c.bannerImg === false));
{ const s = ce("salidas-de-bano"); const d = (detRows.find((x) => x.current_url === ORIGIN + "/salidas-de-bano") || {}).measured || "";
  check("Salidas de Bano (0 productos): el detalle registra que el actual dibuja Talla, Color y Precio y Dev solo 'Ordenar por' (ya no dice 'no comparados')", s.curFilters.join() === "Talla,Color,Precio" && s.devFilters.join() === "Ordenar por" && /con 0 productos el sitio actual igual dibuja \[Talla, Color, Precio\] y Dev solo \[Ordenar por\]/.test(d) && !/no comparados/.test(d));
  note("Salidas de Bano: function_parity queda NOT_MEASURED por convencion (sin productos no hay nada que filtrar) aunque la diferencia de filtros esta medida y registrada en el detalle."); }
{ // Home
  const html = htmlByUrl(ORIGIN + "/"), txt = textOf(html), ls = linksOf(html);
  const ed = ls.slice(0, 8), fe = ls.slice(8);
  const dEd = devHome.sections.find((s) => s.id === "featured-collection-editorial").products, dFe = devHome.sections.find((s) => s.id === "featured-products").products;
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1], meta = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  check("Home: 15 productos enlazados; editorial comparte 6 de 8; destacados mismo conjunto y orden distinto", ls.length === 15 && ed.filter((x) => dEd.includes(x)).length === 6 && JSON.stringify([...fe].sort()) === JSON.stringify([...dFe].sort()) && JSON.stringify(fe) !== JSON.stringify(dFe));
  check("Home: 4 <video> en el actual; Dev hero sin imagen ni video", (html.match(/<video/g) || []).length === 4 && devHome.sections.find((s) => s.id === "hero").imgs === 0 && devHome.sections.find((s) => s.id === "hero").videos === 0);
  check("Home: titulo y meta description distintos (actual 109 caracteres; Dev vacia)", title !== devHome.title && meta.length === 109 && devHome.metaDescription === "", `${title} vs ${devHome.title}`);
  check("Home: el h1 coincide con el de Dev", (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1].replace(/<[^>]+>/g, "") === devRoutes.routes.find((r) => r.p === "/").h1);
  check("Home: CTA newsletter distinto ('Quiero enterarme' vs 'Suscribirme')", /Quiero enterarme/.test(html) && devHome.sections.find((s) => s.id === "newsletter-home").cta === "Suscribirme");
  const annCur = txt.match(/\d+\s?% de descuento en toda la tienda/)[0];
  const annDev = devHome.sections.find((s) => s.id === "announcement-bar").text;
  check("Barra de anuncio: el texto renderizado del actual es identico al de Dev ('20% de descuento en toda la tienda'); el '20 %' con espacio era un artefacto del HTML (<!-- --> entre 20 y %)", annCur === "20% de descuento en toda la tienda" && annDev === "20% de descuento en toda la tienda" && /20<!-- -->% de descuento/.test(html), `actual="${annCur}" dev="${annDev}"`);
  { // diferencias de la Home que el productor no media (corregidas en el archivo): destino de los CTA y logo
    const hrefOf = (label) => { const m = html.replace(/<!-- -->/g, "").match(new RegExp('<a[^>]*href="(#[^"]*)"[^>]*>' + label)); return m ? m[1] : null; };
    const devCta = (id) => ((devHome.sections.find((s) => s.id === id) || {}).cta || "").match(/->\s*(\S+)/)?.[1] ?? null;
    check("Home: los CTA del hero y del promo apuntan a #productos en el actual y a #categorias en Dev (HP-03 de theme/03G-home-parity.md)", hrefOf("Compra de forma sostenible") === "#productos" && hrefOf("Descubrir la colección") === "#productos" && devCta("hero") === "#categorias" && devCta("promo-banner") === "#categorias");
    const homeDetail = (detRows.find((d) => d.current_url === ORIGIN + "/") || {}).measured || "";
    check("Home: el detalle de la fila registra el destino de los CTA y el logo", /sitio actual #productos y #productos; Dev #categorias y #categorias/.test(homeDetail) && /logo del encabezado: sitio actual imagen/.test(homeDetail));
    check("Home: el actual muestra un logo de imagen; Dev un logo de texto con el nombre de la tienda (dev-home.json)", /<img[^>]*alt="Radaelli Swimwear"/.test(html) && /logo%2Fradaelli-swimwear\.png/.test(html) && /logo de texto/.test((devHome.sections.find((s) => s.id === "header") || {}).note || ""));
    const manifest = read(MIG, "content", "media", "media-migration-manifest.csv");
    check("[DOC] El logo no esta en el plan de media A4 (0 menciones en media-migration-manifest.csv)", !/logo/i.test(manifest));
  }
  check("Selector COP/USD presente en el actual y ausente en headerNav de Dev", />COP</.test(html) && />USD</.test(html) && !devHome.headerNav.some((n) => /COP|USD/.test(n)));
}
{ // sitemap, blog, cookies
  const inSm = (p) => sitemapLocs.includes(p);
  check("Sitemap actual: 45 URLs; /accesorios esta; hombre, mujer, ninos, calzado no; /blog, 3 posts y las 6 legales si", sitemapLocs.length === 45 && inSm("/accesorios") && !["/hombre", "/mujer", "/ninos", "/calzado"].some(inSm) && inSm("/blog") && ["/blog/novedades-temporada", "/blog/materiales-nobles-por-que-importan", "/blog/guia-de-capas-para-el-invierno"].every(inSm) && ["/envios", "/devoluciones", "/garantia", "/terminos", "/privacidad", "/cookies"].every(inSm));
  let blogLinkers = [];
  for (const rec of crawl.filter((r) => r.file && r.file.endsWith(".html"))) { if (/["'\\]\/blog[\/"'\\]/.test(htmlOf(rec)) && rec.file !== "blog.html") blogLinkers.push(rec.file); }
  check("Ninguna pagina rastreada (salvo /blog) enlaza /blog", blogLinkers.length === 0, blogLinkers.join(" "));
  const posts = ["novedades-temporada", "materiales-nobles-por-que-importan", "guia-de-capas-para-el-invierno"].map((s) => probeHtml(ORIGIN + "/blog/" + s));
  check("Blog: 3 posts con 200, robots 'index, follow' y JSON-LD Article; /blog 'index, follow'", posts.every((h) => h && /name="robots" content="index, follow"/.test(h) && ldOf(h).some((b) => b["@type"] === "Article")) && /name="robots" content="index, follow"/.test(htmlByUrl(ORIGIN + "/blog")));
  check("Blog: el texto del indice habla de lana, lino, cuero y abrigo ([INFERIDO] plantilla)", /Lana, lino y cuero/.test(textOf(htmlByUrl(ORIGIN + "/blog"))) && /abrigo/.test(textOf(htmlByUrl(ORIGIN + "/blog"))));
  const home = textOf(htmlByUrl(ORIGIN + "/"));
  check("El actual tiene banner de consentimiento de cookies (Aceptar todas / Rechazar no esenciales / Configurar)", /Aceptar todas/.test(home) && /Rechazar no esenciales/.test(home) && /Configurar/.test(home));
  check("El pie de pagina del actual enlaza las 6 politicas; Dev enlaza 2 (Devoluciones y Garantia)", ["Envíos", "Devoluciones", "Garantía", "Términos y condiciones", "Privacidad", "Cookies"].every((t) => home.includes(t)) && devHome.footer.columnAyuda.length === 2);
  const rb = read(EV, "current-site", "robots.txt.txt");
  check("robots.txt actual bloquea /cuenta, /checkout, /favoritos, /buscar, /admin, /api, /interno (7 Disallow) y declara Sitemap", (rb.match(/^Disallow:/gim) || []).length === 7 && /Sitemap:/i.test(rb));
}
{ // paginas legales: bloques del texto fuente presentes en el actual
  for (const slug of ["devoluciones", "garantia", "envios", "terminos", "privacidad", "cookies"]) {
    const src = read(MIG, "content", "legal", slug + ".html");
    const blocks = [...src.matchAll(/<(p|li|h2|h3)[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => textOf(m[2]).replace(/\s+/g, "")).filter(Boolean);
    const cur = textOf(htmlByUrl(ORIGIN + "/" + slug)).replace(/\s+/g, "");
    const found = blocks.filter((b) => cur.includes(b)).length;
    const claim = (detRows.find((d) => d.current_url === ORIGIN + "/" + slug) || {}).measured || "";
    const mm = claim.match(/(\d+)\/(\d+) bloques/);
    check(`Legal /${slug}: ${found}/${blocks.length} bloques del texto fuente presentes en el actual (el detalle dice ${mm ? mm[0] : "?"})`, mm && Number(mm[1]) === found && Number(mm[2]) === blocks.length);
  }
}

// ================================================================= 5. RECALCULO DEL STATUS DE CADA FILA (las 101)
console.log("\n=== 5. STATUS RECALCULADO PARA CADA FILA (101 filas) ===");
const devRoute = (p) => devRoutes.routes.find((r) => r.p.split(",").map((s) => s.trim()).includes(p)) || null;
const LEGAL_PENDING = new Set(["/envios", "/terminos", "/privacidad", "/cookies"]);
const BLOG = new Set(["/blog", "/blog/novedades-temporada", "/blog/materiales-nobles-por-que-importan", "/blog/guia-de-capas-para-el-invierno"]);
const EMPTY_COL = new Set(["/accesorios", "/hombre", "/mujer", "/ninos", "/calzado"]);
const problems = [];
const table = [];
for (const r of rows) {
  const isPlaceholder = r.current_url.includes("<");
  const cur = r.current_url.startsWith(ORIGIN) ? (r.current_url.slice(ORIGIN.length) || "/") : null;
  const http = cur && !isPlaceholder ? httpOf(r.current_url) : null;
  const red = cur ? redirBy.get(cur.toLowerCase()) : null;
  let exp, why;
  if (cur && !isPlaceholder && http === 404) {
    if (cur === "/cart") { exp = ["PASS_WITH_INTENTIONAL_CHANGE", "NOT_APPLICABLE"]; why = "current 404; /cart es ruta nativa de Shopify (excepcion documentada); Dev /cart " + (devRoute("/cart") || {}).s; if ((devRoute("/cart") || {}).s !== 200) exp = ["MISSING"]; }
    else { exp = ["NOT_APPLICABLE"]; why = "current 404"; }
  } else if (cur && !isPlaceholder && http === 200 && red) {
    const ev = destEv(red);
    if (ev === "ok200") {
      const isProd = /^\/producto\//.test(cur), isCol = ["/oasis-natural", "/aurora-viva", "/espuma-de-ola", "/salidas-de-bano"].includes(cur);
      let gap = false, gapWhy = "";
      if (isProd) { const e = prodExpect.get(cur.split("/producto/")[1].toLowerCase()); gap = e.content === "GAP"; gapWhy = e.failed.join(","); }
      if (isCol) { const e = colExpect.get(cur.slice(1)); gap = e.bannerGap || (e.n[0] > 0 && !e.sameOrder) || (e.n[0] > 0 && e.curFilters.some((f) => f !== "Precio" && !e.devFilters.includes(f))); gapWhy = "orden/banner/filtros"; }
      if (["/favoritos", "/cuenta/favoritos"].includes(cur)) { gap = true; gapWhy = "/apps/wishlist 404 (sin sincronizacion de cuenta)"; }
      exp = gap ? ["BLOCKED_BY_OWNER"] : ["PASS_WITH_INTENTIONAL_CHANGE"];
      why = `current 200 + redireccion a ${red} (destino 200 en Dev)` + (gap ? `; GAP medido: ${gapWhy}` : "; sin GAP medido");
    } else if (ev === "opaque") { exp = ["BLOCKED_BY_OWNER", "PASS_WITH_INTENTIONAL_CHANGE"]; why = `redireccion a ${red}; destino opaco (dominio de cuentas)`; }
    else { exp = ["MISSING", "BLOCKED_BY_OWNER"]; why = "destino sin evidencia"; }
  } else if (cur && !isPlaceholder && http === 200 && ["/", "/checkout", "/search", "/robots.txt", "/sitemap.xml"].includes(cur)) {
    const dr = devRoute(cur);
    if (cur === "/") { exp = ["BLOCKED_BY_OWNER"]; why = "directo; GAP medido: media (A4), meta (C1), orden, selector COP/USD"; }
    else if (cur === "/checkout") { exp = ["BLOCKED_BY_OWNER"]; why = "directo; Dev abre en es-us (A1) y pagos apagados (B1): no verificable"; }
    else { exp = dr && dr.s === 200 ? ["PASS_WITH_INTENTIONAL_CHANGE"] : ["MISSING"]; why = `directo; Dev ${dr && dr.s}`; }
  } else if (cur && !isPlaceholder && http === 200 && LEGAL_PENDING.has(cur)) { exp = ["BLOCKED_BY_OWNER"]; why = "200 hoy, sin destino en Dev (404 en /pages/* y /policies/*); B2"; }
  else if (cur && !isPlaceholder && http === 200 && BLOG.has(cur)) { exp = ["MISSING"]; why = "200 hoy, sin destino ni decision, fuera del lote owner"; }
  else if (cur && !isPlaceholder && http === 200 && EMPTY_COL.has(cur)) { exp = ["NOT_APPLICABLE", "MISSING"]; why = "200 hoy, 0 productos, sin destino (03E: 404 esperado)"; }
  else if (cur && (http === null || isPlaceholder)) {
    if (redirBy.get(cur.toLowerCase())) { const ev = destEv(redirBy.get(cur.toLowerCase())); exp = ev === "opaque" ? ["BLOCKED_BY_OWNER", "PASS_WITH_INTENTIONAL_CHANGE"] : ["PASS_WITH_INTENTIONAL_CHANGE", "BLOCKED_BY_OWNER"]; why = "HTTP actual no medido; destino " + ev; }
    else if (isPlaceholder && cur.startsWith("/blog/<")) { exp = ["NOT_APPLICABLE"]; why = "placeholder del inventario: 404 literal"; }
    else if (isPlaceholder && cur.startsWith("/buscar?q=")) { exp = ["PASS_WITH_INTENTIONAL_CHANGE", "BLOCKED_BY_OWNER"]; why = "placeholder; Dev /search?q= 200"; }
    else { exp = ["BLOCKED_BY_OWNER", "MISSING"]; why = "HTTP actual no medido; transaccional (B1)"; }
  } else { // filas solo-Shopify
    const p = r.shopify_url; const dr = devRoute(p.split("?")[0] === "/pages/favoritos" && p.includes("?") ? p : p);
    const ev = destEv(p);
    if (p === "/404-xyz-parity") { exp = ["PASS"]; why = "Dev 404 y las 16 rutas inexistentes del actual dan 404"; }
    else if (ev === "ok200") { exp = ["PASS_WITH_INTENTIONAL_CHANGE", "BLOCKED_BY_OWNER", "MISSING"]; why = "Shopify-only con 200 en Dev"; }
    else if (ev === "opaque") { exp = ["BLOCKED_BY_OWNER"]; why = "Shopify-only opaca (A2)"; }
    else { exp = ["BLOCKED_BY_OWNER", "MISSING"]; why = `Shopify-only con Dev ${dr ? dr.s : "sin dato"}: destino que debe existir y no existe`; }
  }
  const okS = exp.includes(r.status);
  if (!okS) problems.push(`${r.id} ${r.current_url === "NOT_APPLICABLE" ? r.shopify_url : r.current_url.replace(ORIGIN, "")} csv=${r.status} esperado=${exp.join("|")} (${why})`);
  table.push({ r, exp, why, okS });
}
check("Status de las 101 filas coincide con el recalculado desde la evidencia", problems.length === 0, problems.length ? "\n      " + problems.join("\n      ") : "101/101");
// reglas duras adicionales
const passLike = rows.filter((r) => r.status === "PASS" || r.status === "PASS_WITH_INTENTIONAL_CHANGE");
check("PASS: exactamente 1 fila y es el 404 de una ruta inexistente de Dev (dev-routes.json /404-xyz-parity = 404)", rows.filter((r) => r.status === "PASS").length === 1 && rows.find((r) => r.status === "PASS").shopify_url === "/404-xyz-parity" && (devRoute("/404-xyz-parity") || {}).s === 404);
check("Ninguna fila PASS/PASS_WITH_INTENTIONAL_CHANGE tiene un GAP no intencional en content o function", passLike.every((r) => r.content_parity !== "GAP" && r.function_parity !== "GAP"), passLike.filter((r) => r.content_parity === "GAP" || r.function_parity === "GAP").map((r) => r.id + ":" + r.current_url.replace(ORIGIN, "")).join(" "));
const noEvidence = passLike.filter((r) => {
  const to = r.shopify_url;
  if (to === "NOT_APPLICABLE" || to === "NOT_AVAILABLE") return true;
  if (to === "/404-xyz-parity") return (devRoute(to) || {}).s !== 404;
  if (r.current_url.includes("/cuenta/")) return destEv(to) !== "opaque";
  if (r.current_url.includes("<")) return !(devRoute("/search?q=bikini") && devRoute("/search?q=mostaza") && devRoute("/search?q=bikini").s === 200 && devRoute("/search?q=mostaza").s === 200);
  return destEv(to) !== "ok200";
});
check("Toda PASS/PASS_WITH_INTENTIONAL_CHANGE tiene destino con evidencia (200 medido en Dev; redireccion de cuentas para las 3 /cuenta* sin contrasena; 404 medido para el PASS)", noEvidence.length === 0, `${passLike.length} filas; sin evidencia: ${noEvidence.map((r) => r.id + ":" + r.shopify_url).join(" ")}`);
check("Producto: content_parity de las 29 fichas igual al recalculado", rows.filter((r) => r.surface === "Producto").every((r) => prodExpect.get(r.current_url.split("/producto/")[1].toLowerCase()).content === r.content_parity));
check("Producto: 29 filas con redireccion /producto/<x> -> /products/<x en minusculas>", rows.filter((r) => r.surface === "Producto").every((r) => { const s = r.current_url.split("/producto/")[1]; return r.shopify_url === "/products/" + s.toLowerCase() && redirBy.get(("/producto/" + s).toLowerCase()) === r.shopify_url; }));
check("Coleccion: content GAP y function GAP en las 3 con productos; content GAP en Salidas (banner)", ["oasis-natural", "aurora-viva", "espuma-de-ola"].every((h) => { const r = rows.find((x) => x.current_url === ORIGIN + "/" + h); return r.content_parity === "GAP" && r.function_parity === "GAP" && r.status === "BLOCKED_BY_OWNER"; }) && rows.find((x) => x.current_url === ORIGIN + "/salidas-de-bano").content_parity === "GAP");
// destino de cada fila == destino del CSV de redirecciones (o misma ruta en los 5 directos)
const wrongTarget = rows.filter((r) => { if (!r.current_url.startsWith(ORIGIN) || r.current_url.includes("<")) return false; const p = r.current_url.slice(ORIGIN.length) || "/"; const t = redirBy.get(p.toLowerCase()); if (t) return r.shopify_url !== t; if (["/", "/checkout", "/search", "/robots.txt", "/sitemap.xml"].includes(p)) return r.shopify_url !== p; return false; });
check("shopify_url de cada fila con redireccion = destino del CSV de redirecciones; los 5 directos apuntan a la misma ruta", wrongTarget.length === 0, wrongTarget.map((r) => r.id).join(" "));
check("Filas NOT_APPLICABLE con URL real: shopify_url y las 3 paridades tambien NOT_APPLICABLE, sin dependencia", rows.filter((r) => r.status === "NOT_APPLICABLE").every((r) => r.shopify_url === "NOT_APPLICABLE" && r.content_parity === "NOT_APPLICABLE" && r.function_parity === "NOT_APPLICABLE" && r.visual_parity === "NOT_APPLICABLE" && r.known_dependency === "ninguna"));
{ // integridad de las 29 fichas de Dev usadas como evidencia de destino
  const bad = devProducts.filter((d) => !(d.pdp === 200 && d.robots === "" && d.canon.endsWith("/products/" + d.h) && d.h1 === d.t && d.ldjson >= 1));
  check("Dev: las 29 fichas responden 200, sin noindex, canonical propio, h1 = titulo y JSON-LD", bad.length === 0, bad.map((d) => d.h).join(" "));
  check("Dev: boton de favoritos en 29/29 fichas", devProducts.filter((d) => d.heart).length === 29);
}
{ // hallazgos F-01, F-02, F-08, F-10 contra dev-routes.json / dev-collections.json
  const r404 = (p) => (devRoute(p) || {}).s === 404;
  check("F-02: /pages/envios, /pages/privacidad, /pages/terminos, /pages/cookies (agrupadas), /policies/terms-of-service y /policies/shipping-policy dan 404 en Dev", r404("/pages/envios") && r404("/pages/cookies") && r404("/policies/terms-of-service") && r404("/policies/shipping-policy"));
  check("F-08: /apps/wishlist da 404; /pages/favoritos 200 con noindex; con ?view=wishlist 200 y canonical /pages/favoritos", r404("/apps/wishlist") && devRoute("/pages/favoritos").s === 200 && /noindex/.test(devRoute("/pages/favoritos").robots) && devRoute("/pages/favoritos?view=wishlist").canon === "/pages/favoritos");
  const idx = (p) => { const r = devRoute(p); return r && r.s === 200 && r.robots === ""; };
  check("F-10: /pages/contact, /pages/data-sharing-opt-out, /collections/frontpage (lote C5) y /blogs/news, /collections/all (fuera de C5) dan 200 e indexables; /collections/destacados sin meta description", ["/pages/contact", "/pages/data-sharing-opt-out", "/collections/frontpage", "/blogs/news", "/collections/all"].every(idx) && devColBy.get("destacados").metaDescChars === 0 && devColBy.get("destacados").robots === "");
  check("F-01: el GET de /checkout en Dev abre en es-us (mercado principal US); pagos apagados", /es-us/.test(String((devRoute("/checkout") || {}).s)));
}
{ // citas [DOC:...] existen
  const cited = new Set(); for (const t of [detText, md]) for (const m of t.matchAll(/\[DOC:([^\]\s]+)/g)) if (!m[1].includes("<")) cited.add(m[1].replace(/[:#].*$/, ""));
  const gone = [...cited].filter((f) => !fs.existsSync(path.join(MIG, f)));
  check(`Todas las citas [DOC:<archivo>] apuntan a archivos existentes (${cited.size} distintos)`, gone.length === 0, gone.join(" "));
}
{ // cobertura de catalog/shopify-url-parity.csv
  const up = parseCsv(read(MIG, "catalog", "shopify-url-parity.csv")); const idx = up[0].indexOf("source_url");
  const miss = up.slice(1).filter((r) => r[idx]).map((r) => r[idx]).filter((u) => !curKeys.map((x) => x.toLowerCase()).includes(u.toLowerCase()));
  check("Cobertura: cada source_url de catalog/shopify-url-parity.csv tiene fila", miss.length === 0, miss.join(" "));
}
// detalle: HTTP actual
const badHttp =detRows.filter((d) => { if (!d.current_url.startsWith(ORIGIN) || d.current_url.includes("<")) return false; const h = httpOf(d.current_url); return h === null ? d.current_http !== "NOT_MEASURED" : String(h) !== d.current_http; });
check("Detalle: current_http coincide con rastreo/sondeos en cada fila (NOT_MEASURED donde no hay GET)", badHttp.length === 0, badHttp.map((d) => d.id + ":" + d.current_http).join(" "));
check("Detalle: current_http NOT_MEASURED solo en las rutas de app/ no rastreadas (7 /cuenta*, 2 retornos de checkout) y placeholders", detRows.filter((d) => d.current_http === "NOT_MEASURED").length === 10, String(detRows.filter((d) => d.current_http === "NOT_MEASURED").length));

// ================================================================= 6. CONTEOS DEL .md vs CSV
console.log("\n=== 6. CONTEOS DEL .md CONTRA EL CSV ===");
const tally = (key, v) => rows.filter((r) => r[key] === v).length;
const total = rows.length;
const statusOrder = ["PASS", "PASS_WITH_INTENTIONAL_CHANGE", "BLOCKED_BY_OWNER", "MISSING", "NOT_APPLICABLE"];
check(`El .md declara ${total} filas`, md.includes(`| **Total** | **${total}** |`) && md.includes(`${total} filas`));
check("Tabla de status del .md coincide", statusOrder.every((s) => md.includes(`| ${s} | ${tally("status", s)} |`)), statusOrder.map((s) => `${s}=${tally("status", s)}`).join(" "));
const surfOrder = ["Home", "Colección", "Producto", "Búsqueda", "Carrito", "Checkout", "Cuenta", "Favoritos", "Legal", "Ayuda", "SEO técnico", "Error", "Otras"];
const surfLines = surfOrder.map((s) => { const sub = rows.filter((r) => r.surface === s); return `| ${s} | ${sub.length} | ${statusOrder.map((st) => sub.filter((r) => r.status === st).length).join(" | ")} |`; });
const surfBad = surfLines.filter((l) => !md.includes(l));
check("Tabla superficie x status del .md coincide", surfBad.length === 0, surfBad.join(" ;; "));
const parBad = ["MATCH", "INTENTIONAL_CHANGE", "GAP", "NOT_APPLICABLE", "NOT_MEASURED"].map((p) => `| ${p} | ${tally("content_parity", p)} | ${tally("function_parity", p)} | ${tally("visual_parity", p)} |`).filter((l) => !md.includes(l));
check("Tabla de columnas de paridad del .md coincide", parBad.length === 0, parBad.join(" ;; "));
const depCount = {}; for (const r of rows) for (const d of r.known_dependency.split(";")) if (d !== "ninguna") depCount[d] = (depCount[d] || 0) + 1;
const depLine = Object.entries(depCount).sort().map(([k, v]) => `${k} = ${v}`).join(", ");
check("Linea de filas por dependencia del .md coincide", md.includes(depLine), depLine);
const blockedMissing = rows.filter((r) => r.status === "BLOCKED_BY_OWNER" || r.status === "MISSING").length;
check(`El .md declara ${blockedMissing} filas BLOCKED_BY_OWNER + MISSING en la tabla de causas`, md.includes(`(\`BLOCKED_BY_OWNER\` + \`MISSING\`, ${blockedMissing} filas)`));
const mdCauses = [...md.split("| Causa | Filas |")[1].split("\n\n")[0].matchAll(/^\| [^|]+ \| (\d+) \|$/gm)].map((m) => Number(m[1]));
check("La tabla de causas del .md suma BLOCKED_BY_OWNER + MISSING", mdCauses.reduce((a, b) => a + b, 0) === blockedMissing, `${mdCauses.reduce((a, b) => a + b, 0)} vs ${blockedMissing}`);
check("El .md afirma 28 MATCH de contenido y cada uno es una ficha de producto", tally("content_parity", "MATCH") === 28 && rows.filter((r) => r.content_parity === "MATCH").every((r) => r.surface === "Producto"));
const passGap = passLike.filter((r) => r.content_parity === "GAP" || r.function_parity === "GAP").length;
check(`El .md dice cuantas filas PASS_WITH_INTENTIONAL_CHANGE tienen un GAP abierto (recalculado: ${passGap})`, passGap === 0 ? /\*\*Ninguna\*\* fila `PASS_WITH_INTENTIONAL_CHANGE` tiene un GAP abierto/.test(md) : /Solo \*\*1\*\* fila/.test(md) && passGap === 1);
check("Las 16 URLs que dan 404 hoy: 15 NOT_APPLICABLE y /cart como unica excepcion", (() => { const rs = c404.map((x) => rows.find((r) => r.current_url === x.url)); return rs.length === 16 && rs.filter((r) => r.status === "NOT_APPLICABLE").length === 15 && rs.filter((r) => r.status !== "NOT_APPLICABLE").every((r) => r.current_url.endsWith("/cart")); })());
check("Universo con 200 hoy = 58 (54 rastreo + 4 sondeos): 40 con redireccion + 5 directas + 13 sin destino", (() => { const all200 = [...crawl.filter((r) => r.status === 200).map((r) => r.url), ...probe200.map((r) => r.url)]; const paths = all200.map((u) => u.replace(ORIGIN, "") || "/"); const red = paths.filter((p) => redirBy.has(p.toLowerCase())); const dir = paths.filter((p) => ["/", "/checkout", "/search", "/robots.txt", "/sitemap.xml"].includes(p) && !redirBy.has(p.toLowerCase())); const rest = paths.filter((p) => !redirBy.has(p.toLowerCase()) && !dir.includes(p)); return all200.length === 58 && red.length === 40 && dir.length === 5 && rest.length === 13; })());

{ // encabezado del .md: theme RC1.8, SHA-256, 96 archivos; RC1.7 -> RC1.8 solo cambia main-product.liquid
  const zip = crypto.createHash("sha256").update(fs.readFileSync(path.join(MIG, "dist", "radaelli-shopify-theme-rc1.8.zip"))).digest("hex");
  const m7 = JSON.parse(read(MIG, "dist", "release-manifest-rc1.7.json")), m8 = JSON.parse(read(MIG, "dist", "release-manifest-rc1.8.json"));
  const h7 = new Map(m7.files.map((f) => [f.path, f.sha256])), h8 = new Map(m8.files.map((f) => [f.path, f.sha256]));
  const changed = [...h8.keys()].filter((p) => h7.get(p) !== h8.get(p)).concat([...h7.keys()].filter((p) => !h8.has(p)));
  check("Encabezado del .md: el ZIP de RC1.8 tiene el SHA-256 declarado y 96 archivos", md.includes(zip) && m8.files.length === 96 && zip.startsWith("e893b386f1022b7aaa618c86b07eeb5d23f43f2e89c6ddc493f7c5a485fd9e67".slice(0, 8)), zip.slice(0, 16));
  check("RC1.7 -> RC1.8 solo cambia sections/main-product.liquid (la evidencia de Dev es de RC1.7)", changed.length === 1 && changed[0] === "sections/main-product.liquid", changed.join(","));
}
{ // afirmaciones refutadas: no deben volver a aparecer como hechos
  const mdNoHistory = md.replace(/\*\*Retirada por la verificación independiente:\*\*[^|]*/g, "").replace(/\(El informe anterior[^)]*\)/g, "");
  check("El detalle y el .md no afirman la diferencia falsa de la barra de anuncio ('20 %' vs '20%')", !/"20 % de descuento" \(sitio actual\)/.test(detText) && !/barra de anuncio \("20 %"/.test(mdNoHistory));
  check("Ni el detalle ni el .md dicen que /blogs/news 'existe vacio' (no se midio si tiene articulos)", !/existe vac[ií]o/.test(detText + mdNoHistory));
  check("El .md no habla de '7 restos de plantilla Vercel que ya dan 404' (03E: 3 restos + 4 metadatos de Next)", !/7 restos de plantilla Vercel que ya dan 404, 5/.test(mdNoHistory));
  check("El .md no dice 'indexadas' de las 4 legales (el estado real en Google no esta medido)", !/4 URLs indexadas/.test(md));
}
{ // huellas y numero de controles que declara el .md
  const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(path.join(LAUNCH, f))).digest("hex");
  const declared = {}; for (const m of md.matchAll(/^launch\/(\S+)\s+([0-9a-f]{64})$/gm)) declared[m[1]] = m[2];
  const files = ["tools/03g-route-parity.mjs", "03G-route-parity.csv", "03G-route-parity-detail.csv"];
  const badSha = files.filter((f) => declared[f] !== sha(f));
  check("Las huellas SHA-256 del .md coinciden con los archivos (script del productor, CSV principal, detalle)", badSha.length === 0, badSha.length ? "no coinciden: " + badSha.join(", ") : files.map((f) => f.split("/").pop() + " " + sha(f).slice(0, 12)).join(" | "));
  const gen = fs.readFileSync(path.join(LAUNCH, "tools", "03g-route-parity.mjs"), "utf8");
  const nChecks = (gen.match(/^\s*check\("/gm) || []).length;
  const mm = md.match(/Imprime los controles \((\d+), todos PASS/);
  check("El .md declara el numero real de controles del script del productor", mm && Number(mm[1]) === nChecks, `${mm ? mm[1] : "?"} declarados, ${nChecks} en el script`);
}

// ================================================================= 7. NOTAS DE CONVENCION (no fallan)
console.log("\n=== 7. NOTAS DE CONVENCION ===");
const a1pic = passLike.filter((r) => r.known_dependency.split(";").includes("A1"));
note(`${a1pic.length} filas PASS_WITH_INTENTIONAL_CHANGE dependen de A1 (compra en Colombia sin verificar; function_parity NOT_MEASURED): el status vale para ruta y contenido, no para compra. Leer known_dependency y function_parity.`);
note("/cart figura PASS_WITH_INTENTIONAL_CHANGE aunque hoy da 404 en el actual (excepcion documentada en la leyenda del .md).");
note("/accesorios (200, en el sitemap actual, sin destino, decision pendiente) figura NOT_APPLICABLE por la leyenda; el blog (mismo caso, con contenido) figura MISSING. 03E clasifica ambos como 'intentionally not migrated'.");

console.log("\n=== RESUMEN DEL VALIDADOR ===");
console.log(`controles PASS: ${PASSLOG.length} | FAIL: ${fails} | NOTE: ${notes}`);
// tabla de filas recalculadas (para inspeccion)
if (process.argv.includes("--rows")) { for (const t of table) console.log(`${t.r.id} | ${t.r.status.padEnd(28)} | esperado ${t.exp.join("|").padEnd(40)} | ${t.okS ? "OK " : "DIF"} | ${t.r.current_url === "NOT_APPLICABLE" ? t.r.shopify_url : t.r.current_url.replace(ORIGIN, "") || "/"} | ${t.why}`); }
if (fails) { console.log("RESULTADO: FALLO"); process.exit(1); }
console.log("RESULTADO: OK");
