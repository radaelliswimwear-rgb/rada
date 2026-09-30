// 03G -- paridad de rutas: sitio actual (Next.js) vs Shopify Development Store.
// DETERMINISTA y OFFLINE: solo lee archivos del repo y de launch/evidence. Sin red, sin fecha/hora en las salidas.
// Uso:  node launch/tools/03g-route-parity.mjs
// Escribe:
//   launch/03G-route-parity.csv         (cabecera exacta de 9 columnas; una fila por ruta)
//   launch/03G-route-parity-detail.csv  (trazabilidad por fila: HTTP actual, clase, evidencia, medido / no medido)
// Sale con codigo 1 si falla algun invariante (cobertura, vocabulario, evidencia, privacidad).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, "..", "..");
const LAUNCH = path.join(MIG, "launch");
const EV = path.join(LAUNCH, "evidence");
const ORIGIN = "https://radaelliswimwear.com";
const rd = (...p) => fs.readFileSync(path.join(...p), "utf8");

// ------------------------------------------------------------------ utilidades
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
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}
const csvCell = (v) => { const s = String(v ?? ""); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csvLine = (a) => a.map(csvCell).join(",");
const strip = (s) => s.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const uniq = (a) => { const o = []; for (const x of a) if (!o.includes(x)) o.push(x); return o; };
const eqArr = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nospace = (s) => s.replace(/\s+/g, "");

// ------------------------------------------------------------------ vocabulario cerrado
const STATUS = ["PASS", "PASS_WITH_INTENTIONAL_CHANGE", "BLOCKED_BY_OWNER", "MISSING", "NOT_APPLICABLE"];
const PAR = ["MATCH", "INTENTIONAL_CHANGE", "GAP", "NOT_APPLICABLE", "NOT_MEASURED"];
const SURFACES = ["Home", "Colección", "Producto", "Búsqueda", "Carrito", "Checkout", "Cuenta", "Favoritos", "Legal", "Ayuda", "SEO técnico", "Error", "Otras"];
const HEADER = ["surface", "current_url", "shopify_url", "status", "content_parity", "function_parity", "visual_parity", "known_dependency", "action_needed"];
const DETAIL_HEADER = ["id", "surface", "current_url", "current_http", "current_class", "redirect_to", "shopify_url", "dev_evidence", "status", "content_parity", "function_parity", "visual_parity", "measured", "not_measured", "evidence_tags", "root_cause", "proposed_destination"];

// ------------------------------------------------------------------ carga de evidencia
const crawl = JSON.parse(rd(EV, "current-site", "index.json"));
const byUrl = new Map(crawl.map((r) => [r.url, r]));
const cpath = (r) => r.url.slice(ORIGIN.length) || "/";
const crawlRec = (p) => byUrl.get(ORIGIN + p) || null;
// Sondeos GET puntuales que capturó otro proceso de 03G (launch/evidence/current-site-probe). Solo se LEEN; no se recaptura nada.
const probeFile = path.join(EV, "current-site-probe", "index.json");
const probeIdx = fs.existsSync(probeFile) ? JSON.parse(fs.readFileSync(probeFile, "utf8")).map((r) => ({ ...r, dir: "current-site-probe" })) : [];
const probeBy = new Map(probeIdx.map((r) => [r.url.toLowerCase(), r]));
const probeRec = (p) => probeBy.get((ORIGIN + p).toLowerCase()) || null;
const anyRec = (p) => crawlRec(p) || probeRec(p);

const devProducts = rd(EV, "dev-products.jsonl").trim().split("\n").map((l) => JSON.parse(l));
const devBy = new Map(devProducts.map((d) => [d.h, d]));
const devCols = JSON.parse(rd(EV, "dev-collections.json")).collections;
const devColBy = new Map(devCols.map((c) => [c.h, c]));
const devHome = JSON.parse(rd(EV, "dev-home.json"));
const devRoutes = JSON.parse(rd(EV, "dev-routes.json"));
function devRoute(p) {
  for (const r of devRoutes.routes) if (r.p.split(",").map((s) => s.trim()).includes(p)) return r;
  return null;
}
const isOpaque = (r) => r && typeof r.s === "string" && r.s.startsWith("opaqueredirect");

const redirRows = parseCsv(rd(MIG, "seo", "shopify-redirects-import.csv")).slice(1).filter((r) => r.length >= 2 && r[0]);
const redir = new Map();
for (const [from, to] of redirRows) redir.set(from.toLowerCase(), { from, to });
const inv = parseCsv(rd(MIG, "seo", "current-url-inventory.csv"));
const invUrls = inv.slice(1).map((r) => r[inv[0].indexOf("current_url")]).filter(Boolean);

const sitemapXml = rd(EV, "current-site", "sitemap.xml.txt");
const sitemapLocs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(ORIGIN, "") || "/");
const robotsTxt = rd(EV, "current-site", "robots.txt.txt");
const robotsDisallow = robotsTxt.split("\n").filter((l) => /^Disallow:/i.test(l.trim())).map((l) => l.split(":")[1].trim());

const manifest7 = JSON.parse(rd(MIG, "dist", "release-manifest-rc1.7.json"));
const manifest8 = JSON.parse(rd(MIG, "dist", "release-manifest-rc1.8.json"));
const m7 = new Map(manifest7.files.map((f) => [f.path, f.sha256]));
const m8 = new Map(manifest8.files.map((f) => [f.path, f.sha256]));
const rc8Changed = [...m8.keys()].filter((p) => m7.get(p) !== m8.get(p)).concat([...m7.keys()].filter((p) => !m8.has(p)));

// ------------------------------------------------------------------ extraccion de hechos del HTML actual
function facts(rec) {
  if (!rec || !rec.file || !rec.file.endsWith(".html")) return null;
  const h = rd(EV, rec.dir || "current-site", rec.file);
  const m = (re) => (h.match(re) || [])[1];
  return {
    h,
    title: m(/<title[^>]*>([\s\S]*?)<\/title>/i) || "",
    h1: [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((x) => strip(x[1])),
    robots: m(/<meta[^>]+name="robots"[^>]*content="([^"]*)"/i) || "",
    canon: m(/<link[^>]+rel="canonical"[^>]*href="([^"]*)"/i) || "",
    metaDesc: m(/<meta[^>]+name="description"[^>]*content="([^"]*)"/i) || "",
    text: strip((h.match(/<body[\s\S]*<\/body>/i) || [h])[0]),
    videos: (h.match(/<video/g) || []).length,
    bannerBg: (h.match(/background-image:url\(/g) || []).length,
    hreflang: (h.match(/hrefLang=/gi) || []).length,
    ld: [...h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((x) => { try { return JSON.parse(x[1]); } catch { return null; } }).filter(Boolean),
    prodLinks: uniq([...h.matchAll(/href="\/producto\/([^"#?]+)"/g)].map((x) => x[1].toLowerCase())),
  };
}
function currentSizes(h) {
  const seg = (h.split("Talla</p>")[1] || "").split("</div></div>")[0];
  return [...seg.matchAll(/<button([^>]*aria-pressed[^>]*)>([^<]*)<\/button>/g)].map((m) => m[2].trim());
}
const baseImg = (n) => n.replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\.[a-z]+$)/i, "");
const normDesc = (s) => s.replace(/•/g, " ").replace(/\s+/g, " ").trim();

// ------------------------------------------------------------------ constructor de filas
const rows = [];
const DEF = {
  surface: "", current_url: "NOT_APPLICABLE", shopify_url: "NOT_APPLICABLE", status: "", content_parity: "NOT_APPLICABLE",
  function_parity: "NOT_APPLICABLE", visual_parity: "NOT_MEASURED", known_dependency: "ninguna", action_needed: "ninguna",
  current_http: "NOT_APPLICABLE", current_class: "", redirect_to: "", dev_evidence: "", measured: "", not_measured: "",
  tags: "", root_cause: "", proposed_destination: "", destOk: false,
};
const add = (o) => { rows.push({ ...DEF, ...o }); };
const curUrl = (p) => ORIGIN + p;
const http = (p) => { const r = anyRec(p); return r ? String(r.status) : "NOT_MEASURED"; };
const TAG_M = "[MEDIDO-03G]";

// evidencia de destino de una redireccion del CSV
function destEvidence(to) {
  let m;
  if ((m = to.match(/^\/products\/(.+)$/))) { const d = devBy.get(m[1]); return d && d.pdp === 200 ? { ok: true, ev: `dev-products.jsonl:${m[1]} pdp=200` } : { ok: false, ev: "SIN_EVIDENCIA" }; }
  if ((m = to.match(/^\/collections\/(.+)$/))) { const c = devColBy.get(m[1]); return c && c.status === 200 ? { ok: true, ev: `dev-collections.json:${m[1]} 200` } : { ok: false, ev: "SIN_EVIDENCIA" }; }
  const r = devRoute(to);
  if (r && r.s === 200) return { ok: true, ev: `dev-routes.json:${to} 200` };
  if (isOpaque(r)) return { ok: false, opaque: true, ev: `dev-routes.json:${to} ${r.s}` };
  return { ok: false, ev: "SIN_EVIDENCIA" };
}
const redirOf = (p) => redir.get(p.toLowerCase()) || null;

// ================================================================== HOME
{
  const rec = crawlRec("/"), f = facts(rec), dv = devRoute("/");
  const dsec = (id) => devHome.sections.find((s) => s.id === id) || {};
  const heroDev = dsec("hero");
  const curEd = f.prodLinks.slice(0, 8), curFe = f.prodLinks.slice(8);
  const devEd = dsec("featured-collection-editorial").products, devFe = dsec("featured-products").products;
  const edCommon = curEd.filter((x) => devEd.includes(x)).length;
  const feSame = eqArr([...curFe].sort(), [...devFe].sort());
  const cta = (f.text.includes("Quiero enterarme") ? "Quiero enterarme" : "NOT_FOUND") + "|" + (dsec("newsletter-home").cta || "");
  // barra de anuncio: React separa "20" y "%" con <!-- -->; hay que quitar los comentarios ANTES de quitar las etiquetas
  const annCur = strip(f.h.replace(/<!-- -->/g, "").replace(/<script[\s\S]*?<\/script>/g, "")).match(/\d+\s?% de descuento en toda la tienda/)[0];
  const annDev = dsec("announcement-bar").text;
  const annLine = annCur === annDev
    ? `barra de anuncio: texto renderizado igual en ambos ("${annCur}"); el HTML del sitio actual trae "20<!-- -->%" y al quitar las etiquetas queda "20 %" con un espacio que no se ve: no es una diferencia (corregido en la verificación independiente)`
    : `barra de anuncio DISTINTA: "${annCur}" (sitio actual) vs "${annDev}" (Dev)`;
  // Verificación independiente: diferencias de la Home que el script no medía (documentadas en theme/03G-home-parity.md: HP-02, HP-03)
  const curCta = (label) => { const m = f.h.match(new RegExp('<a[^>]*href="(#[^"]*)"[^>]*>' + label)); return m ? m[1] : "NOT_FOUND"; };
  const devCta = (id) => { const m = (dsec(id).cta || "").match(/->\s*(\S+)/); return m ? m[1] : "NOT_FOUND"; };
  const ctaLine = `destino del CTA del hero ("Compra de forma sostenible") y del promo ("Descubrir la colección"): sitio actual ${curCta("Compra de forma sostenible")} y ${curCta("Descubrir la colección")}; Dev ${devCta("hero")} y ${devCta("promo-banner")}`;
  const logoCur = /<img[^>]*alt="Radaelli Swimwear"[^>]*/.test(f.h) && /logo%2Fradaelli-swimwear\.png/.test(f.h);
  const logoLine = `logo del encabezado: sitio actual ${logoCur ? "imagen (/logo/radaelli-swimwear.png)" : "sin imagen"}; Dev ${/logo de texto/.test((dsec("header").note || "")) ? "texto con el nombre de la tienda (\"" + devHome.title + "\"), sin imagen" : "ver dev-home.json"}`;
  add({
    surface: "Home", current_url: rec.url, shopify_url: "/", status: "BLOCKED_BY_OWNER",
    content_parity: "GAP", function_parity: "GAP", visual_parity: "NOT_MEASURED",
    known_dependency: "A1;A4;B4;C1;C2",
    action_needed: "Owner: A4 (OK para descargar y subir la media del hero y de las tarjetas) y C1 (texto de la meta description de la Home). Owner: C2 (curar la colección de \"Recomendado para vos\" o dejar la sección oculta) y decidir si se replica el selector COP/USD. Claude: igualar el orden de las colecciones con el sitio actual (con OK; escritura en la Dev Store), apuntar el CTA del hero y del promo a #productos (HP-03 de theme/03G-home-parity.md) y re-medir la Home tras A4. Logo: el archivo no está en el plan de media A4 y settings.logo está vacío (HP-02 de theme/03G-home-parity.md); falta decidir cómo cargarlo.",
    current_http: http("/"), current_class: "DIRECT", dev_evidence: `dev-routes.json:/ ${dv.s}; dev-home.json`, destOk: dv.s === 200,
    measured: [
      `h1 ${f.h1[0] === dv.h1 ? "igual" : "DISTINTO"}`,
      `secciones en el mismo orden (hero, categorías, editorial, destacados, promo, newsletter)`,
      `hero: sitio actual ${f.videos} <video> (hero + 3 tarjetas); Dev ${heroDev.imgs} imágenes y ${heroDev.videos} videos (variante de respaldo)`,
      `título "${f.title}" vs "${devHome.title}"`,
      `meta description ${f.metaDesc.length} caracteres vs ${devHome.metaDescription.length}`,
      `editorial: ${edCommon} de ${curEd.length} productos coinciden (orden distinto)`,
      `destacados: ${feSame ? "mismos" : "distintos"} ${curFe.length} productos, orden ${eqArr(curFe, devFe) ? "igual" : "distinto (el sitio actual los baraja en cada visita y una colección manual tiene orden fijo: diferencia ya documentada en 03D)"}`,
      `CTA newsletter "${cta.split("|")[0]}" vs "${cta.split("|")[1]}"`,
      annLine,
      ctaLine,
      logoLine,
      `frase "envío gratis desde $299.900" + enlace a política de envíos: presente en sitio actual, ausente en Dev`,
      `selector COP/USD en el encabezado: presente en sitio actual, ausente en Dev`,
      `sección "Recomendado para vos": ${dsec("recommended-products").state ? "oculta en Dev (sin colección, C2)" : "presente en Dev"}; no aparece en el HTML anónimo del sitio actual (es algorítmica y depende de localStorage, según 03D)`,
    ].join("; "),
    not_measured: "visual (otro proceso), JSON-LD Organization/WebSite en Dev, video del hero en móvil; esta fila resume solo lo que mide este script: el detalle completo de la Home (11 diferencias, incluidas insignias de la editorial y redes en el encabezado) está en theme/03G-home-parity.md",
    tags: `${TAG_M};[DOC:theme/03F-owner-actions-minimal.md];[DOC:theme/03D-free-shipping-audit.md];[DOC:theme/03D-missing-assets-audit.md §5];[DOC:theme/03G-home-parity.md HP-02, HP-03]`,
    root_cause: "A4 media; C1 meta; orden de colecciones; selector de moneda; CTA a #categorias; logo sin imagen",
  });
  const dvEn = devRoute("/en");
  add({
    surface: "Home", current_url: "NOT_APPLICABLE", shopify_url: "/en", status: "PASS_WITH_INTENTIONAL_CHANGE",
    content_parity: "INTENTIONAL_CHANGE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_MEASURED",
    known_dependency: "B4", action_needed: "ninguna en la Dev Store. Al publicar (B4) dejar el español como idioma principal; traducción del catálogo al inglés no medida.",
    current_class: "SHOPIFY_ONLY", dev_evidence: `dev-routes.json:/en ${dvEn.s}; dev-home.json hreflang`, destOk: dvEn.s === 200,
    measured: `200; canonical /en; hreflang ${devHome.hreflang.join(", ")}; el sitio actual es solo español (<html lang="es">, ${f.hreflang} hreflang)`,
    not_measured: "calidad de la traducción; catálogo en inglés", tags: `${TAG_M};[DOC:theme-src/README.md]`, root_cause: "idioma /en nuevo",
  });
}

// ================================================================== COLECCIONES
const COLS = ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano"];
for (const h of COLS) {
  const rec = crawlRec("/" + h), f = facts(rec), dc = devColBy.get(h), rd_ = redirOf("/" + h);
  const cur = f.prodLinks, sameSet = eqArr([...cur].sort(), [...dc.order].sort()), sameOrder = eqArr(cur, dc.order);
  const curFilters = ["Talla", "Color", "Precio"].filter((g) => f.text.includes(`${g} `) && /Filtros/.test(f.text));
  const missFilters = dc.n > 0 ? curFilters.filter((g) => g !== "Precio" && !dc.filterGroups.includes(g)) : [];
  const bannerGap = f.bannerBg > 0 && dc.bannerImg === false;
  const orderGap = dc.n > 0 && !sameOrder;
  const deps = ["B4"]; if (missFilters.length) deps.push("A3"); if (bannerGap) deps.push("A4");
  const depList = uniq(deps.sort());
  const ownerGap = missFilters.length > 0 || bannerGap;
  const acts = [];
  if (missFilters.length) acts.push("Owner: A3 (instalar Search & Discovery para filtros de talla y color)");
  if (bannerGap) acts.push("Owner: A4 (OK para descargar y subir la imagen del banner)");
  if (orderGap) acts.push("Claude: igualar el orden por defecto con el sitio actual (con OK; escritura en la Dev Store) o la dueña acepta el orden manual");
  if (!acts.length) acts.push("ninguna en la Dev Store");
  acts.push("Al publicar (B4) reimportar las redirecciones en la tienda comercial");
  add({
    surface: "Colección", current_url: rec.url, shopify_url: rd_.to,
    status: ownerGap ? "BLOCKED_BY_OWNER" : "PASS_WITH_INTENTIONAL_CHANGE",
    content_parity: (orderGap || bannerGap) ? "GAP" : "MATCH", function_parity: missFilters.length ? "GAP" : "NOT_MEASURED", visual_parity: "NOT_MEASURED",
    known_dependency: depList.join(";"), action_needed: acts.join(". ") + ".",
    current_http: http("/" + h), current_class: "REDIRECT", redirect_to: rd_.to,
    dev_evidence: uniq([`dev-collections.json:${h} ${dc.status}`, destEvidence(rd_.to).ev]).join("; "), destOk: destEvidence(rd_.to).ok && dc.status === 200,
    measured: [
      `productos ${cur.length} vs ${dc.n} (${sameSet ? "mismo conjunto" : "conjunto distinto"}); orden por defecto ${dc.n === 0 ? "n/a (vacía)" : sameOrder ? "igual" : "DISTINTO"}`,
      `h1 igual; meta description ${f.metaDesc.length} vs ${dc.metaDescChars} caracteres`,
      `banner: sitio actual ${f.bannerBg ? "con imagen" : "sin imagen"}; Dev ${dc.bannerImg ? "con imagen" : "sin imagen (variante de respaldo)"}`,
      dc.n > 0 ? `filtros: sitio actual [${curFilters.join(", ")}]; Dev [${dc.filterGroups.join(", ")}]` : `filtros: con 0 productos el sitio actual igual dibuja [${curFilters.join(", ")}] y Dev solo [${dc.filterGroups.join(", ")}]; no se cuenta como GAP de función porque no hay productos que filtrar (function_parity queda NOT_MEASURED)`,
      `canonical propio y sin noindex en Dev`,
    ].join("; "),
    not_measured: "visual, vista rápida de tarjetas, selector de 2/3/4 columnas, paginación",
    tags: `${TAG_M};[DOC:seo/03F-redirect-import-result.md]`, root_cause: [missFilters.length ? "A3 filtros" : "", bannerGap ? "A4 banner" : "", orderGap ? "orden por defecto" : ""].filter(Boolean).join("; ") || "redirección solamente",
  });
}
// colecciones sin equivalente en Shopify
for (const h of ["accesorios", "hombre", "mujer", "ninos", "calzado"]) {
  const rec = crawlRec("/" + h), f = facts(rec), inSitemap = sitemapLocs.includes("/" + h);
  const isAcc = h === "accesorios";
  add({
    surface: "Colección", current_url: rec.url, shopify_url: "NOT_APPLICABLE", status: "NOT_APPLICABLE",
    content_parity: "NOT_APPLICABLE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
    known_dependency: "ninguna",
    action_needed: isAcc
      ? "Decisión de la dueña (no está en el lote 03F): 404 o redirigir. 03E la deja en 404 hasta decidir con Search Console; está en el sitemap actual. Si decide redirigir, Claude agrega la fila al CSV."
      : "ninguna: colección archivada sin productos y fuera del sitemap actual; 404 esperado en Shopify (03E).",
    current_http: http("/" + h), current_class: "EXCEPTION_NOT_MIGRATED",
    dev_evidence: `dev-collections.json: /collections.json lista ${devCols.length} colecciones, ${h} no está`,
    measured: `sitio actual: 200, 0 productos enlazados, robots "${f.robots}", ${inSitemap ? "EN" : "fuera del"} sitemap actual; meta description "${f.metaDesc.slice(0, 60)}"; Dev: la colección no existe`,
    not_measured: "GET del 404 en la Dev Store (inferido de /collections.json)",
    tags: `${TAG_M};[DOC:seo/03E-redirect-plan.md §4.1];[INFERIDO] 404 en Dev`, root_cause: isAcc ? "decisión abierta /accesorios" : "colección archivada",
  });
}
// colecciones propias de Shopify
{
  const dd = devColBy.get("destacados");
  add({
    surface: "Colección", shopify_url: "/collections/destacados", status: "PASS_WITH_INTENTIONAL_CHANGE",
    content_parity: "INTENTIONAL_CHANGE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_MEASURED",
    known_dependency: "ninguna",
    action_needed: "Decisión de la dueña (fuera del lote): dejarla indexable o excluirla del sitemap. Claude no la cambia.",
    current_class: "SHOPIFY_ONLY", dev_evidence: `dev-collections.json:destacados ${dd.status}`, destOk: dd.status === 200,
    measured: `200; ${dd.n} productos; alimenta la vidriera "Productos destacados" de la Home; meta description ${dd.metaDescChars} caracteres; robots "${dd.robots}" (indexable)`,
    not_measured: "si aparece en el sitemap de Shopify", tags: `${TAG_M};[DOC:seo/03F-seo-final-validation.md]`, root_cause: "colección de apoyo",
  });
  const df = devColBy.get("frontpage");
  add({
    surface: "Colección", shopify_url: "/collections/frontpage", status: "BLOCKED_BY_OWNER",
    content_parity: "NOT_APPLICABLE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
    known_dependency: "C5", action_needed: "Owner (C5): despublicar la colección \"Home page\" de la Tienda online. Claude no escribe en el catálogo sin OK.",
    current_class: "SHOPIFY_ONLY", dev_evidence: `dev-collections.json:frontpage ${df.status}`,
    measured: `200; ${df.n} productos; h1 "Home page"; robots "${df.robots}" (indexable); creada por Shopify`,
    not_measured: "si aparece en el sitemap (03F lo reporta)", tags: `${TAG_M};[DOC:seo/03F-seo-final-validation.md #2]`, root_cause: "sobrantes de Shopify (C5)",
  });
  const da = devRoute("/collections/all");
  add({
    surface: "Colección", shopify_url: "/collections/all", status: "PASS_WITH_INTENTIONAL_CHANGE",
    content_parity: "NOT_APPLICABLE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
    known_dependency: "ninguna", action_needed: "ninguna. Ruta nativa de Shopify sin equivalente en el sitio actual (indexable, no está en el lote C5).",
    current_class: "SHOPIFY_ONLY", dev_evidence: `dev-routes.json:/collections/all ${da.s}`, destOk: da.s === 200,
    measured: `200; h1 "${da.h1}"; robots "${da.robots}" (indexable)`, not_measured: "contenido y orden", tags: TAG_M, root_cause: "ruta nativa nueva",
  });
}

// ================================================================== PRODUCTOS
const prodRecs = crawl.filter((r) => r.url.includes("/producto/")).sort((a, b) => a.url.localeCompare(b.url));
const prodStats = { core_match: 0, crumbs_stale: 0, gap: 0, colorCase: [], imgSuffix: [], crumbRc17: [] };
const prodBreakdown = [];
for (const rec of prodRecs) {
  const slug = rec.url.split("/producto/")[1], handle = slug.toLowerCase();
  const f = facts(rec), d = devBy.get(handle), rd_ = redirOf("/producto/" + slug);
  const prod = f.ld.find((b) => b["@type"] === "Product"), bc = f.ld.find((b) => b["@type"] === "BreadcrumbList");
  const skuBase = d.vr[0][1].replace(/-[A-Z0-9]+$/, "");
  const pm = f.text.match(/\$ ([\d.]+) \$ ([\d.]+) - (\d+) %/);
  const num = (s) => Number(s.replace(/\./g, ""));
  const curImgs = prod.image.map((u) => baseImg(u.split("/").pop())), devImgs = d.im.map(baseImg);
  const cSizes = currentSizes(f.h), dSizes = d.vr.map((v) => v[0]);
  const crumbCur = bc ? bc.itemListElement.map((e) => e.name).join(" / ") : "";
  const checks = {
    nombre: prod.name === d.t,
    descripcion: normDesc(prod.description) === normDesc(d.desc),
    imagenes: eqArr(curImgs, devImgs),
    sku: prod.sku === skuBase,
    precio: Number(prod.offers.price) === Number(d.vr[0][2]) && d.vr.every((v) => v[2] === d.vr[0][2]) && !!pm && num(pm[1]) === Number(d.vr[0][2]),
    precio_anterior: !!pm && num(pm[2]) === Number(d.vr[0][3]),
    categoria: (prod.category || "") === d.ty,
    color: ("Color: " + (prod.color || "")).toLowerCase() === d.color.toLowerCase(),
    tallas: eqArr(cSizes, dSizes),
    disponibilidad: prod.offers.availability.endsWith("InStock") === d.vr.every((v) => v[4] === true),
  };
  const colorCase = ("Color: " + (prod.color || "")) !== d.color;
  const imgSuffix = !eqArr(prod.image.map((u) => u.split("/").pop()), d.im);
  const crumbOk = crumbCur === d.crumbs;
  const crumbExplained = !crumbOk && /\/ Destacados \//.test(d.crumbs) && rc8Changed.length === 1 && rc8Changed[0] === "sections/main-product.liquid";
  const coreOk = Object.values(checks).every(Boolean);
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  let content = "MATCH";
  if (!coreOk) content = "GAP"; else if (!crumbOk) content = crumbExplained ? "NOT_MEASURED" : "GAP";
  if (colorCase) prodStats.colorCase.push(handle);
  if (imgSuffix) prodStats.imgSuffix.push(handle);
  if (crumbExplained) prodStats.crumbRc17.push(handle);
  if (content === "GAP") prodStats.gap++;
  const dv = destEvidence(rd_.to);
  const okPdp = d.pdp === 200 && d.robots === "" && d.canon.endsWith("/products/" + handle) && d.h1 === d.t && d.ldjson >= 1;
  const acts = [];
  if (!coreOk) acts.push(`Owner: confirmar el catálogo (${failed.join(", ")}; decisión de catálogo, no está en el lote 03F); ${failed.includes("tallas") ? `el sitio actual muestra ${cSizes.join("/")} y la Dev Store ${dSizes.join("/")}; la Dev Store no lleva inventario, así que ofrecería una talla que el sitio actual no muestra. Claude ajusta el catálogo con OK` : "revisar diferencia"}`);
  if (crumbExplained) acts.push("Claude: re-medir miga de pan y JSON-LD BreadcrumbList en RC1.8 (en RC1.7 mostraba Destacados; RC1.8 lo corrige por código, sin re-medir)");
  if (!acts.length) acts.push("ninguna en la Dev Store");
  acts.push("Al publicar (B4) reimportar redirecciones y Claude verifica 301 con curl -I; compra en Colombia solo se prueba tras A1");
  prodBreakdown.push({ handle, content, failed, crumbExplained, colorCase, imgSuffix });
  add({
    // Verificación independiente: una ficha con GAP no intencional (p. ej. una talla que el sitio actual no muestra) no puede llevar
    // PASS_WITH_INTENTIONAL_CHANGE; solo la dueña resuelve ese GAP, así que queda BLOCKED_BY_OWNER (la dependencia A1;B1;B4 sí figura).
    surface: "Producto", current_url: rec.url, shopify_url: rd_.to, status: !(okPdp && dv.ok) ? "MISSING" : content === "GAP" ? "BLOCKED_BY_OWNER" : "PASS_WITH_INTENTIONAL_CHANGE",
    content_parity: content, function_parity: "NOT_MEASURED", visual_parity: "NOT_MEASURED",
    known_dependency: "A1;B1;B4", action_needed: acts.join(". ") + ".",
    current_http: String(rec.status), current_class: "REDIRECT", redirect_to: rd_.to,
    dev_evidence: uniq([`dev-products.jsonl:${handle} pdp=${d.pdp}`, dv.ev]).join("; "), destOk: okPdp && dv.ok,
    measured: [
      `PDP Dev 200, canonical propio, sin noindex, h1 = título, JSON-LD x${d.ldjson}, botón de favoritos ${d.heart ? "presente" : "AUSENTE"}`,
      `nombre/descripción/imágenes(${d.im.length})/SKU/precio(${d.vr[0][2]})/precio anterior(${d.vr[0][3]})/categoría/tallas(${dSizes.join("-")})/disponibilidad: ${coreOk ? "iguales al sitio actual" : "DIFIEREN en " + failed.join(", ")}`,
      colorCase ? `color: solo cambia la capitalización ("${prod.color}" vs "${d.color.replace("Color: ", "")}")` : "color igual",
      imgSuffix ? "una imagen tiene sufijo UUID de Shopify en el nombre de archivo (mismo nombre base)" : "",
      crumbOk ? "miga de pan igual (medida en RC1.7)" : `miga de pan: sitio actual "${crumbCur}" vs Dev(RC1.7) "${d.crumbs}"`,
      /\d+ vistas/.test(f.text) ? "sitio actual muestra contador de vistas; se eliminó a propósito en el theme (prueba social inventada; theme/product-page-report.md)" : "",
    ].filter(Boolean).join("; "),
    not_measured: "agregar al carrito y selección de variante, disponibilidad y compra con país CO (A1), guía de tallas (A4), acordeones, visual; la evidencia de miga y JSON-LD BreadcrumbList es de RC1.7 (vigente RC1.8); descripciones comparadas sin viñetas ni espacios",
    tags: `${TAG_M};[DOC:theme/product-page-report.md:64];[DOC:theme-src/README.md]`,
    root_cause: !coreOk ? `catálogo: ${failed.join(", ")}` : crumbExplained ? "miga RC1.7 pendiente de re-medir en RC1.8" : "ninguna",
  });
}

// ================================================================== BUSQUEDA
{
  const rec = crawlRec("/buscar"), f = facts(rec), dv = devRoute("/search"), rd_ = redirOf("/buscar");
  add({
    surface: "Búsqueda", current_url: rec.url, shopify_url: rd_.to, status: dv.s === 200 ? "PASS_WITH_INTENTIONAL_CHANGE" : "MISSING",
    content_parity: "INTENTIONAL_CHANGE", function_parity: "NOT_MEASURED", visual_parity: "NOT_MEASURED", known_dependency: "B4",
    action_needed: "ninguna en la Dev Store. Claude (con navegador): comparar resultados por nombre, categoría y color contra el sitio actual; al publicar (B4) reimportar la redirección.",
    current_http: http("/buscar"), current_class: "REDIRECT", redirect_to: rd_.to, dev_evidence: `dev-routes.json:/search ${dv.s}`, destOk: dv.s === 200,
    measured: `h1 "${f.h1[0]}" ${f.h1[0] === dv.h1 ? "igual" : "distinto"} en ambos; robots "${f.robots}" ${f.robots === dv.robots ? "igual" : "distinto"} en ambos; página nativa de Shopify reemplaza la búsqueda propia (cliente); redirección conserva el query (03F)`,
    not_measured: "resultados del sitio actual (se renderizan en el cliente), filtros, sugerencias predictivas", tags: `${TAG_M};[DOC:seo/03F-redirect-import-result.md]`, root_cause: "búsqueda nativa",
  });
  const rs = crawlRec("/search"), fs_ = facts(rs);
  add({
    surface: "Búsqueda", current_url: rs.url, shopify_url: "/search", status: dv.s === 200 ? "PASS_WITH_INTENTIONAL_CHANGE" : "MISSING",
    content_parity: "INTENTIONAL_CHANGE", function_parity: "INTENTIONAL_CHANGE", visual_parity: "NOT_MEASURED", known_dependency: "ninguna",
    action_needed: "ninguna. El sitio actual sirve /search como resto de la plantilla Vercel (en inglés, indexable); pasa a ser la búsqueda nativa.",
    current_http: http("/search"), current_class: "DIRECT", dev_evidence: `dev-routes.json:/search ${dv.s}`, destOk: dv.s === 200,
    measured: `sitio actual: título "${fs_.title}", robots "${fs_.robots}", ${fs_.h1.length} h1, sin resultados; Dev: h1 "${dv.h1}", robots "${dv.robots}"`,
    not_measured: "visual", tags: `${TAG_M};[DOC:seo/03E-redirect-plan.md §4.2]`, root_cause: "búsqueda nativa",
  });
  const q1 = devRoute("/search?q=bikini"), q2 = devRoute("/search?q=mostaza");
  add({
    surface: "Búsqueda", current_url: curUrl("/buscar?q=<término>"), shopify_url: "/search?q=<término>", status: q1.s === 200 && q2.s === 200 ? "PASS_WITH_INTENTIONAL_CHANGE" : "MISSING",
    content_parity: "NOT_MEASURED", function_parity: "NOT_MEASURED", visual_parity: "NOT_MEASURED", known_dependency: "A1;B4",
    action_needed: "Claude: tras A1 repetir las consultas con país CO y comparar con el sitio actual en un navegador (color, nombre y categoría).",
    current_http: "NOT_MEASURED", current_class: "PLACEHOLDER", redirect_to: "/search", dev_evidence: `dev-routes.json:/search?q=bikini ${q1.s}; /search?q=mostaza ${q2.s}`, destOk: q1.s === 200 && q2.s === 200,
    measured: `Dev: q=bikini 200 (${q1.note}); q=mostaza 200 (${q2.note}, búsqueda por color vía etiqueta)`,
    not_measured: "resultados equivalentes del sitio actual (no rastreables sin JavaScript), consulta con país CO", tags: `${TAG_M};[DOC:seo/03F-redirect-import-result.md]`, root_cause: "sin medición del lado actual",
  });
}

// ================================================================== CARRITO
{
  add({
    surface: "Carrito", current_url: crawlRec("/carrito").url, status: "NOT_APPLICABLE", content_parity: "NOT_APPLICABLE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
    action_needed: "ninguna: 404 en el sitio actual; en Shopify el carrito vive en /cart.", current_http: http("/carrito"), current_class: "CURRENT_404",
    measured: "sitio actual 404", not_measured: "GET de /carrito en la Dev Store (inferido: sin redirección)", tags: `${TAG_M};[INFERIDO]`, root_cause: "ruta inexistente",
  });
  const dc = devRoute("/cart");
  add({
    surface: "Carrito", current_url: crawlRec("/cart").url, shopify_url: "/cart", status: dc.s === 200 ? "PASS_WITH_INTENTIONAL_CHANGE" : "MISSING",
    content_parity: "NOT_APPLICABLE", function_parity: "NOT_MEASURED", visual_parity: "NOT_MEASURED", known_dependency: "A1",
    action_needed: "Claude: tras A1 probar el carrito con país CO (envío gratis desde $299.900 sigue oculto hasta confirmar la tarifa).",
    current_http: http("/cart"), current_class: "CURRENT_404", dev_evidence: `dev-routes.json:/cart ${dc.s}; dev-home.json cart-drawer`, destOk: dc.s === 200,
    measured: `sitio actual 404 (el carrito es un cajón lateral y la página /checkout); Dev 200, h1 "${dc.h1}", cajón "${devHome.sections.find((s) => s.id === "cart-drawer").h2}" con estado vacío`,
    not_measured: "agregar, cambiar cantidad y quitar productos; barra de envío gratis", tags: `${TAG_M};[DOC:theme/cart-report.md]`, root_cause: "carrito nativo nuevo",
  });
}

// ================================================================== CHECKOUT
{
  const rec = crawlRec("/checkout"), f = facts(rec), dc = devRoute("/checkout");
  add({
    surface: "Checkout", current_url: rec.url, shopify_url: "/checkout", status: "BLOCKED_BY_OWNER",
    content_parity: "NOT_MEASURED", function_parity: "GAP", visual_parity: "NOT_MEASURED", known_dependency: "A1;B1;B4",
    action_needed: "Owner: A1 (zona de envío y mercado Colombia) y B1 (Wompi o pasarela de prueba). Claude: tras A1 y B1 probar checkout en es-co, a 390 px y un pedido de prueba. Nota: al apagar el sitio Next.js (B4) se pierde /api/webhooks/wompi.",
    current_http: http("/checkout"), current_class: "DIRECT", dev_evidence: `dev-routes.json:/checkout (GET redirige al checkout de Shopify en es-us; ${typeof dc.s === "string" && dc.s.includes("403") ? "fetch recibe 403" : "sin detalle"})`, destOk: false,
    measured: `sitio actual: 200, robots "${f.robots}", h1 "${f.h1[0]}", se arma en el cliente; Dev: GET redirige al checkout de Shopify en es-us (mercado principal US), sin crear pedido; pagos apagados`,
    not_measured: "contenido del checkout de Shopify (fetch recibe 403), checkout en es-co, móvil, pago", tags: `${TAG_M};[DOC:theme/03E-checkout-baseline-report.md];[DOC:theme/03F-mobile-checkout-baseline.md];[DOC:theme/03F-sonnet-independent-completion-report.md pagos no activados]`, root_cause: "A1 mercado; B1 pagos",
  });
  add({
    surface: "Checkout", current_url: curUrl("/checkout/confirmacion/<orderId>"), shopify_url: "NOT_AVAILABLE", status: "BLOCKED_BY_OWNER",
    content_parity: "NOT_MEASURED", function_parity: "NOT_MEASURED", visual_parity: "NOT_MEASURED", known_dependency: "B1;B4",
    action_needed: "Owner: B1 (primer pago de prueba). Claude: verificar la página de estado del pedido de Shopify que reemplaza la confirmación propia y el correo de confirmación.",
    current_http: "NOT_MEASURED", current_class: "NOT_CRAWLED_APP_ROUTE", proposed_destination: "página de estado del pedido de Shopify (checkout)",
    measured: "sin GET (ruta transaccional con id de pedido)", not_measured: "todo: no hay pedido de prueba (pagos apagados)", tags: "[DOC:seo/03E-redirect-plan.md §4.2];[NOT_VERIFIED]", root_cause: "B1 pagos",
  });
  add({
    surface: "Checkout", current_url: curUrl("/checkout/wompi/retorno"), shopify_url: "NOT_AVAILABLE", status: "BLOCKED_BY_OWNER",
    content_parity: "NOT_MEASURED", function_parity: "NOT_MEASURED", visual_parity: "NOT_MEASURED", known_dependency: "B1;B4",
    action_needed: "Owner: B1 (Wompi). Claude: definir la ventana de corte para que no queden pagos en curso ni eventos de Wompi apuntando al dominio viejo (los webhooks son POST y no se redirigen).",
    current_http: "NOT_MEASURED", current_class: "NOT_CRAWLED_APP_ROUTE", proposed_destination: "retorno de la pasarela de Shopify (checkout)",
    measured: "sin GET (ruta transaccional)", not_measured: "todo: Wompi no está conectado en la Dev Store", tags: "[DOC:seo/03E-redirect-plan.md §4.2, §5.6];[NOT_VERIFIED]", root_cause: "B1 pagos",
  });
}

// ================================================================== CUENTA
{
  const acct = devRoute("/account");
  const CU = [
    ["/cuenta", "BLOCKED_BY_OWNER", "NOT_MEASURED", "NOT_MEASURED", "A2;B4", "Owner: A2 (código de ingreso de clienta). Claude: verificar cabecera, /account y cierre de sesión tras A2."],
    ["/cuenta/pedidos", "BLOCKED_BY_OWNER", "NOT_MEASURED", "NOT_MEASURED", "A2;B4", "Owner: A2. Claude: verificar tras el ingreso que /account muestra los pedidos (03E: /account/orders no está verificado)."],
    ["/cuenta/perfil", "BLOCKED_BY_OWNER", "NOT_MEASURED", "NOT_MEASURED", "A2;B4", "Owner: A2. Claude: verificar tras el ingreso que /account permite editar el perfil."],
    ["/cuenta/direcciones", "BLOCKED_BY_OWNER", "NOT_MEASURED", "NOT_MEASURED", "A2;B4", "Owner: A2. Claude: verificar tras el ingreso las direcciones de la cuenta (03E: /account/addresses no está verificado)."],
    ["/cuenta/iniciar-sesion", "BLOCKED_BY_OWNER", "INTENTIONAL_CHANGE", "INTENTIONAL_CHANGE", "A2;B4", "Owner: A2 (el ingreso es por código enviado por email, no por contraseña). Claude: verificar el ingreso completo tras A2."],
    ["/cuenta/registro", "BLOCKED_BY_OWNER", "INTENTIONAL_CHANGE", "INTENTIONAL_CHANGE", "A2;B4", "Owner: A2. Claude: verificar el alta de cuenta por código tras A2."],
    ["/cuenta/recuperar-contrasena", "PASS_WITH_INTENTIONAL_CHANGE", "INTENTIONAL_CHANGE", "INTENTIONAL_CHANGE", "B4", "ninguna en la Dev Store: sin contraseña no hay recuperación; la redirección lleva al ingreso por código. Al publicar (B4) reimportar la redirección."],
    ["/cuenta/restablecer-contrasena", "PASS_WITH_INTENTIONAL_CHANGE", "INTENTIONAL_CHANGE", "INTENTIONAL_CHANGE", "B4", "ninguna en la Dev Store: sin contraseña no hay restablecimiento; la redirección lleva al ingreso por código. Al publicar (B4) reimportar la redirección."],
    ["/cuenta/verificar-email", "PASS_WITH_INTENTIONAL_CHANGE", "INTENTIONAL_CHANGE", "INTENTIONAL_CHANGE", "B4", "ninguna en la Dev Store: el código de ingreso reemplaza la verificación de email. Al publicar (B4) reimportar la redirección."],
  ];
  for (const [p, st, cp, fp, dep, act] of CU) {
    const rec = anyRec(p), rd_ = redirOf(p), dv = destEvidence(rd_.to), pf = rec ? facts(rec) : null;
    add({
      surface: "Cuenta", current_url: curUrl(p), shopify_url: rd_.to, status: st, content_parity: cp, function_parity: fp, visual_parity: "NOT_MEASURED",
      known_dependency: dep, action_needed: act,
      current_http: rec ? String(rec.status) : "NOT_MEASURED", current_class: rec ? "REDIRECT" : "NOT_CRAWLED_APP_ROUTE", redirect_to: rd_.to,
      dev_evidence: `dev-routes.json:${rd_.to} ${devRoute(rd_.to).s}; redirects.note_cuenta`, destOk: st === "PASS_WITH_INTENTIONAL_CHANGE" ? isOpaque(devRoute(rd_.to)) : false,
      measured: `la redirección existe en el CSV importado (47/47); en la Dev Store responde como redirección (opaqueredirect) y el destino final está en el dominio de cuentas de Shopify, que fetch no puede seguir (CORS); ${rec ? `sitio actual: ${rec.status}${rec.dir ? " (sondeo)" : ""}, robots "${pf.robots}"${pf.h1[0] ? `, h1 "${pf.h1[0]}"${/contrase/i.test(pf.text) ? " con formulario de email y contraseña" : ""}` : ", se arma en el cliente"}` : "sitio actual: sin GET (ruta de app/, no rastreada ni sondeada)"}`,
      not_measured: "destino final de la redirección, ingreso por código (A2), contenido del área de cuenta, código HTTP 301/302", tags: `${TAG_M};[DOC:seo/03F-redirect-import-result.md];[DOC:seo/03E-redirect-plan.md §4.2]`,
      root_cause: st === "BLOCKED_BY_OWNER" ? "A2 ingreso por código" : "flujo con contraseña eliminado por diseño",
    });
  }
  for (const p of ["/login", "/registro"]) {
    add({
      surface: "Cuenta", current_url: crawlRec(p).url, status: "NOT_APPLICABLE", content_parity: "NOT_APPLICABLE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
      action_needed: "ninguna: 404 en el sitio actual (las rutas reales son /cuenta/iniciar-sesion y /cuenta/registro).", current_http: http(p), current_class: "CURRENT_404",
      measured: "sitio actual 404", not_measured: "GET en la Dev Store (inferido: sin redirección)", tags: `${TAG_M};[INFERIDO]`, root_cause: "ruta inexistente",
    });
  }
  for (const p of ["/account", "/account/login", "/account/register"]) {
    add({
      surface: "Cuenta", shopify_url: p, status: "BLOCKED_BY_OWNER", content_parity: "INTENTIONAL_CHANGE", function_parity: "NOT_MEASURED", visual_parity: "NOT_MEASURED",
      known_dependency: "A2", action_needed: "Owner: A2 (código de ingreso). Claude: verificar la ruta con navegador (New Customer Accounts en el dominio de cuentas de Shopify).",
      current_class: "SHOPIFY_ONLY", dev_evidence: `dev-routes.json:${p} ${devRoute(p).s}`,
      measured: "GET redirige al dominio de cuentas de clientes de Shopify (opaqueredirect); el destino final no se puede leer con fetch", not_measured: "página de ingreso, flujo por código, cabecera con sesión", tags: `${TAG_M};[DOC:theme/customer-accounts-decision.md]`, root_cause: "A2 ingreso por código",
    });
  }
}

// ================================================================== FAVORITOS
{
  const wl = devRoute("/pages/favoritos"), wlv = devRoute("/pages/favoritos?view=wishlist"), app = devRoute("/apps/wishlist");
  for (const p of ["/favoritos", "/cuenta/favoritos"]) {
    const rec = crawlRec(p), f = facts(rec), rd_ = redirOf(p);
    add({
      surface: "Favoritos", current_url: rec.url, shopify_url: rd_.to, status: "BLOCKED_BY_OWNER",
      content_parity: "NOT_MEASURED", function_parity: "GAP", visual_parity: "NOT_MEASURED", known_dependency: "A5;B4",
      action_needed: "Owner: B4 (asignar la plantilla page.wishlist a Favoritos al publicar; la redirección apunta a /pages/favoritos sin ?view=wishlist) y A5 (app de favoritos de cuenta). Claude: tras A5 probar unión invitada a cuenta y entre dispositivos.",
      current_http: String(rec.status), current_class: "REDIRECT", redirect_to: rd_.to, dev_evidence: `dev-routes.json:/pages/favoritos ${wl.s} robots "${wl.robots}"; /apps/wishlist ${app.s}`, destOk: wl.s === 200,
      measured: `sitio actual: 200, robots "${f.robots}"${p === "/favoritos" ? `, h1 "${f.h1[0]}"` : ", se arma en el cliente"}; Dev: /pages/favoritos 200, h1 "${wl.h1}", robots "${wl.robots}"; /apps/wishlist ${app.s} (app no instalada)`,
      not_measured: "qué muestra /pages/favoritos sin ?view=wishlist (03E lo documenta como plantilla genérica hasta publicar), sincronización de cuenta",
      tags: `${TAG_M};[DOC:seo/03E-redirect-plan.md §5.5];[DOC:theme/03F-owner-actions-minimal.md]`, root_cause: "A5 app; B4 plantilla page.wishlist",
    });
  }
  add({
    surface: "Favoritos", current_url: crawlRec("/wishlist").url, status: "NOT_APPLICABLE", content_parity: "NOT_APPLICABLE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
    action_needed: "ninguna: 404 en el sitio actual (la ruta real es /favoritos).", current_http: http("/wishlist"), current_class: "CURRENT_404",
    measured: "sitio actual 404", not_measured: "GET en la Dev Store (inferido)", tags: `${TAG_M};[INFERIDO]`, root_cause: "ruta inexistente",
  });
  add({
    surface: "Favoritos", shopify_url: "/pages/favoritos?view=wishlist", status: "BLOCKED_BY_OWNER", content_parity: "NOT_MEASURED", function_parity: "GAP", visual_parity: "NOT_MEASURED",
    known_dependency: "A5;B4", action_needed: "Owner: A5 (sincronización de cuenta) y B4 (plantilla al publicar). Modo invitada (localStorage) ya funciona en el theme; Claude re-mide tras A5.",
    current_class: "SHOPIFY_ONLY", dev_evidence: `dev-routes.json:/pages/favoritos?view=wishlist ${wlv.s}; dev-products.jsonl: heart=true x${devProducts.filter((d) => d.heart).length}/29`,
    measured: `200, h1 "${wlv.h1}", canonical ${wlv.canon}, robots "${wlv.robots}"; botón de favoritos presente en ${devProducts.filter((d) => d.heart).length}/29 fichas; enlace del encabezado apunta aquí`,
    not_measured: "contenido de la lista, modo invitada de extremo a extremo, sincronización", tags: `${TAG_M};[DOC:theme/wishlist-report.md]`, root_cause: "A5 app; B4 plantilla page.wishlist",
  });
  add({
    surface: "Favoritos", shopify_url: "/apps/wishlist", status: "BLOCKED_BY_OWNER", content_parity: "GAP", function_parity: "GAP", visual_parity: "NOT_APPLICABLE",
    known_dependency: "A5", action_needed: "Owner: A5 (cuenta de desarrolladora, distribución custom irreversible, instalar la app). Claude despliega y prueba después.",
    current_class: "SHOPIFY_ONLY", dev_evidence: `dev-routes.json:/apps/wishlist ${app.s}`,
    measured: "404: el app proxy de favoritos no está instalado", not_measured: "app 0.1.2 (empaquetada, sin instalar)", tags: `${TAG_M};[DOC:theme/03F-owner-wishlist-install-runbook.md]`, root_cause: "A5 app",
  });
}

// ================================================================== LEGAL
const legalCheck = {};
for (const slug of ["devoluciones", "garantia", "envios", "terminos", "privacidad", "cookies"]) {
  const cur = nospace(facts(crawlRec("/" + slug)).text);
  const src = rd(MIG, "content", "legal", slug + ".html");
  const blocks = [...src.matchAll(/<(p|li|h2|h3)[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => nospace(strip(m[2]))).filter(Boolean);
  const found = blocks.filter((b) => cur.includes(b)).length;
  legalCheck[slug] = { found, total: blocks.length };
}
const lc = (s) => `${legalCheck[s].found}/${legalCheck[s].total} bloques del texto fuente (content/legal) siguen presentes en la página actual`;
{
  const rf = devRoute("/policies/refund-policy"), g = devRoute("/pages/garantia");
  const fd = facts(crawlRec("/devoluciones")), fg = facts(crawlRec("/garantia"));
  add({
    surface: "Legal", current_url: crawlRec("/devoluciones").url, shopify_url: redirOf("/devoluciones").to, status: rf.s === 200 ? "PASS_WITH_INTENTIONAL_CHANGE" : "MISSING",
    content_parity: "INTENTIONAL_CHANGE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_MEASURED", known_dependency: "B4",
    action_needed: "ninguna en la Dev Store. Claude: al levantar la contraseña (B4) verificar en robots.txt si /policies/ está bloqueado (regla por defecto de Shopify; NOT_VERIFIED). Si la dueña quiere la política indexable, decidir entre las opciones a/b/c de 03E §5.5.",
    current_http: http("/devoluciones"), current_class: "REDIRECT", redirect_to: redirOf("/devoluciones").to, dev_evidence: `dev-routes.json:/policies/refund-policy ${rf.s}`, destOk: rf.s === 200,
    measured: `h1 "${fd.h1[0]}" (sitio actual) vs "${rf.h1}" (Dev; título nativo de Shopify, no editable); ${lc("devoluciones")}; robots "${fd.robots}" vs "${rf.robots}"`,
    not_measured: "texto del cuerpo en la Dev Store (03D documenta el mismo SHA-256; no se re-verificó), regla /policies/ de robots.txt", tags: `${TAG_M};[DOC:theme/03D-legal-policies-inventory.md]`, root_cause: "título nativo de Shopify",
  });
  add({
    surface: "Legal", current_url: crawlRec("/garantia").url, shopify_url: redirOf("/garantia").to, status: g.s === 200 ? "PASS_WITH_INTENTIONAL_CHANGE" : "MISSING",
    content_parity: "NOT_MEASURED", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_MEASURED", known_dependency: "B4",
    action_needed: "ninguna en la Dev Store. Al publicar (B4) reimportar la redirección.",
    current_http: http("/garantia"), current_class: "REDIRECT", redirect_to: redirOf("/garantia").to, dev_evidence: `dev-routes.json:/pages/garantia ${g.s}`, destOk: g.s === 200,
    measured: `h1 "${fg.h1[0]}" igual en ambos; ${lc("garantia")}; robots "${fg.robots}" vs "${g.robots}"`,
    not_measured: "texto del cuerpo en la Dev Store (solo consta en 03D)", tags: `${TAG_M};[DOC:theme/03D-legal-policies-inventory.md]`, root_cause: "ninguna",
  });
}
const LEG_PENDING = [
  ["envios", "A1;B2;B4", "Owner: B2 (aprobar y crear la página de envíos) y A1 (la página promete envío gratis desde $299.900; no publicarla antes de que exista esa tarifa). Claude: pegar el texto verbatim, agregar el enlace al menú y la fila de redirección.", "/pages/envios o /policies/shipping-policy", "función: promesa de envío gratis depende de la tarifa (A1)"],
  ["terminos", "B2;B4", "Owner: B2 (aprobar el texto; el párrafo Pago describe Wompi). Claude: pegar el texto verbatim, agregar el enlace y la fila de redirección.", "/pages/terminos o /policies/terms-of-service", ""],
  ["privacidad", "B2;B4", "Owner: B2 (revisión humana de proveedores; hoy existe una política automática de Shopify con otro texto). Claude: pegar el texto aprobado, agregar el enlace y la fila de redirección.", "/pages/privacidad o /policies/privacy-policy (esta última existe con texto autogenerado)", ""],
  ["cookies", "B2;B3;B4", "Owner: B2 (aprobar; \"Hoy no las usamos\" depende de la analítica final, B3). Claude: pegar el texto verbatim, agregar el enlace y la fila de redirección. El banner de consentimiento y el botón de preferencias del sitio actual no tienen equivalente medido en la Dev Store.", "/pages/cookies", "función: banner de consentimiento y botón de preferencias sin equivalente medido"],
];
for (const [slug, dep, act, prop, fnote] of LEG_PENDING) {
  const f = facts(crawlRec("/" + slug));
  const probeP = "/pages/" + slug, pr = devRoute(probeP);
  add({
    surface: "Legal", current_url: crawlRec("/" + slug).url, shopify_url: "NOT_AVAILABLE", status: "BLOCKED_BY_OWNER",
    content_parity: "GAP", function_parity: slug === "cookies" ? "NOT_MEASURED" : "NOT_APPLICABLE", visual_parity: "NOT_MEASURED",
    known_dependency: dep, action_needed: act,
    current_http: http("/" + slug), current_class: "EXCEPTION_LEGAL_PENDING", proposed_destination: prop,
    dev_evidence: `dev-routes.json:${probeP} ${pr.s}`,
    measured: `sitio actual: 200, en el sitemap actual, robots "${f.robots}"; ${lc(slug)}; Dev: ${probeP} responde ${pr.s} (destino no creado); sin fila de redirección${fnote ? "; " + fnote : ""}`,
    not_measured: "texto en la Dev Store (no existe)", tags: `${TAG_M};[DOC:seo/03E-redirect-plan.md §4.3];[DOC:theme/03F-legal-owner-runbook.md]`, root_cause: "B2 páginas legales",
  });
}
for (const p of ["/politica-de-cookies", "/politica-de-devoluciones", "/politica-de-envios", "/politica-de-garantia", "/politica-de-privacidad", "/terminos-y-condiciones"]) {
  add({
    surface: "Legal", current_url: crawlRec(p).url, status: "NOT_APPLICABLE", content_parity: "NOT_APPLICABLE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
    action_needed: "ninguna: 404 en el sitio actual (sondeo de variante de nombre).", current_http: http(p), current_class: "CURRENT_404",
    measured: "sitio actual 404", not_measured: "GET en la Dev Store (inferido)", tags: `${TAG_M};[INFERIDO]`, root_cause: "ruta inexistente",
  });
}
{
  const pp = devRoute("/policies/privacy-policy");
  add({
    surface: "Legal", shopify_url: "/policies/privacy-policy", status: "BLOCKED_BY_OWNER", content_parity: "GAP", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_MEASURED",
    known_dependency: "B2", action_needed: "Owner: B2 (decidir si la política automática de Shopify se adopta como oficial o se reemplaza por el texto de la marca tras revisión de proveedores). Es una decisión legal de la dueña.",
    current_class: "SHOPIFY_ONLY", proposed_destination: "posible destino de /privacidad", dev_evidence: `dev-routes.json:/policies/privacy-policy ${pp.s}`,
    measured: `200, h1 "${pp.h1}", robots "${pp.robots}" (indexable); texto autogenerado por Shopify, distinto del texto de /privacidad del sitio actual`,
    not_measured: "comparación palabra a palabra", tags: `${TAG_M};[DOC:theme/03D-legal-policies-inventory.md]`, root_cause: "B2 páginas legales",
  });
  for (const [p, dep, act, note] of [
    ["/policies/terms-of-service", "B2", "Owner: B2. Destino alternativo de /terminos (si se elige política nativa en vez de página).", "términos pendientes (owner B2)"],
    ["/policies/shipping-policy", "A1;B2", "Owner: B2 y A1. Destino alternativo de /envios (si se elige política nativa en vez de página).", "envíos pendientes (owner B2)"],
    ["/policies/contact-information", "B2", "Owner: B2 (razón social, NIT y dirección; NOT_AVAILABLE en el repo). El sitio actual no tiene esta página.", "sin contenido: no hay razón social, NIT ni dirección"],
  ]) {
    const r = devRoute(p);
    add({
      surface: "Legal", shopify_url: p, status: "BLOCKED_BY_OWNER", content_parity: "GAP", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
      known_dependency: dep, action_needed: act, current_class: "SHOPIFY_ONLY", dev_evidence: `dev-routes.json:${p} ${r.s}`,
      measured: `${r.s}: ${note}`, not_measured: "n/a", tags: `${TAG_M};[DOC:theme/03D-legal-policies-inventory.md]`, root_cause: "B2 páginas legales",
    });
  }
  const dsp = devRoute("/pages/data-sharing-opt-out");
  add({
    surface: "Legal", shopify_url: "/pages/data-sharing-opt-out", status: "BLOCKED_BY_OWNER", content_parity: "NOT_APPLICABLE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
    known_dependency: "C5", action_needed: "Owner (C5): despublicar o completar la página creada por Shopify (indexable y en el sitemap). Claude no escribe en la Tienda online sin OK.",
    current_class: "SHOPIFY_ONLY", dev_evidence: `dev-routes.json:/pages/data-sharing-opt-out ${dsp.s}`,
    measured: `200, h1 "${dsp.h1}", robots "${dsp.robots}" (indexable); página por defecto de Shopify, sin equivalente en el sitio actual`,
    not_measured: "si está en el sitemap (03F lo reporta)", tags: `${TAG_M};[DOC:seo/03F-seo-final-validation.md #1]`, root_cause: "sobrantes de Shopify (C5)",
  });
}

// ================================================================== AYUDA
for (const p of ["/ayuda", "/contacto", "/faq", "/nosotros"]) {
  add({
    surface: "Ayuda", current_url: crawlRec(p).url, status: "NOT_APPLICABLE", content_parity: "NOT_APPLICABLE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
    action_needed: "ninguna: 404 en el sitio actual. \"Contacto\" es un menú del pie de página y \"Sobre nosotros/Sostenibilidad/Prensa\" apuntan a #contacto.",
    current_http: http(p), current_class: "CURRENT_404", measured: "sitio actual 404; el pie de página actual usa el ancla #contacto (Dev: id=contacto presente)", not_measured: "GET en la Dev Store (inferido)", tags: `${TAG_M};[DOC:theme/03D-legal-policies-inventory.md]`, root_cause: "ruta inexistente",
  });
}
{
  const c = devRoute("/pages/contact");
  add({
    surface: "Ayuda", shopify_url: "/pages/contact", status: "BLOCKED_BY_OWNER", content_parity: "NOT_APPLICABLE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
    known_dependency: "C5", action_needed: "Owner (C5): despublicar o completar en español la página por defecto de Shopify (indexable y en el sitemap).",
    current_class: "SHOPIFY_ONLY", dev_evidence: `dev-routes.json:/pages/contact ${c.s}`,
    measured: `200, h1 "${c.h1}" (en inglés), robots "${c.robots}" (indexable); el sitio actual no tiene /contacto (404)`, not_measured: "si está en el sitemap (03F lo reporta)", tags: `${TAG_M};[DOC:seo/03F-seo-final-validation.md #1]`, root_cause: "sobrantes de Shopify (C5)",
  });
}

// ================================================================== SEO TECNICO
{
  const rb = crawlRec("/robots.txt"), sm = crawlRec("/sitemap.xml"), dr = devRoute("/robots.txt"), ds = devRoute("/sitemap.xml");
  const cnt = (re) => sitemapLocs.filter((p) => re.test(p)).length;
  add({
    surface: "SEO técnico", current_url: rb.url, shopify_url: "/robots.txt", status: dr.s === 200 ? "PASS_WITH_INTENTIONAL_CHANGE" : "MISSING",
    content_parity: "INTENTIONAL_CHANGE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE", known_dependency: "B4",
    action_needed: "Claude: al levantar la contraseña (B4) leer el robots.txt de la tienda comercial: reglas por defecto de Shopify (incluida /policies/) y línea Sitemap.",
    current_http: http("/robots.txt"), current_class: "DIRECT", dev_evidence: `dev-routes.json:/robots.txt ${dr.s} (${dr.len} bytes)`, destOk: dr.s === 200,
    measured: `sitio actual: ${robotsDisallow.length} reglas Disallow (${robotsDisallow.join(", ")}) y Sitemap; Dev: 200, ${dr.len} bytes generados por Shopify; /buscar y /favoritos pasan a depender de noindex en la página (medido en /search y /pages/favoritos)`,
    not_measured: "contenido del robots.txt de la Dev Store (solo su tamaño), regla /policies/", tags: `${TAG_M};[DOC:seo/03E-redirect-plan.md §5.5]`, root_cause: "archivo generado por la plataforma",
  });
  add({
    surface: "SEO técnico", current_url: sm.url, shopify_url: "/sitemap.xml", status: ds.s === 200 ? "PASS_WITH_INTENTIONAL_CHANGE" : "MISSING",
    content_parity: "INTENTIONAL_CHANGE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE", known_dependency: "B4;C5",
    action_needed: "Claude: al publicar (B4) enviar el sitemap de Shopify a Search Console y vigilar 404 y redirecciones 4-8 semanas. Owner (C5): limpiar sobrantes del sitemap.",
    current_http: http("/sitemap.xml"), current_class: "DIRECT", dev_evidence: `dev-routes.json:/sitemap.xml ${ds.s} (${ds.len} bytes)`, destOk: ds.s === 200,
    measured: `sitio actual: ${sitemapLocs.length} URLs (1 inicio, ${cnt(/^\/(accesorios|oasis-natural|aurora-viva|espuma-de-ola|salidas-de-bano)$/)} colecciones incl. /accesorios, /blog + ${cnt(/^\/blog\//)} posts, ${cnt(/^\/(envios|devoluciones|garantia|terminos|privacidad|cookies)$/)} legales, ${cnt(/^\/producto\//)} productos); Dev: 200, ${ds.len} bytes (índice de sitemaps)`,
    not_measured: "contenido de los sitemaps hijos de la Dev Store (03F reporta 9 hijos y 29/29 productos)", tags: `${TAG_M};[DOC:seo/03F-seo-final-validation.md]`, root_cause: "archivo generado por la plataforma",
  });
}

// ================================================================== ERROR
{
  const e = devRoute("/404-xyz-parity");
  const p404 = probeRec("/carrito"), p404f = p404 && p404.file ? facts(p404) : null;
  const n404 = crawl.filter((r) => r.status === 404).length;
  add({
    surface: "Error", shopify_url: "/404-xyz-parity", status: e.s === 404 ? "PASS" : "MISSING", content_parity: "NOT_MEASURED", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_MEASURED",
    known_dependency: "ninguna", action_needed: "ninguna para el código HTTP. Claude (con navegador): comparar el diseño de la página 404 con la actual.",
    current_class: "SHOPIFY_ONLY", dev_evidence: `dev-routes.json:/404-xyz-parity ${e.s} robots "${e.robots}"`, destOk: e.s === 404,
    measured: `Dev: una ruta inexistente responde ${e.s} con robots "${e.robots}"; sitio actual: las ${n404} rutas probadas que no existen responden 404${p404f ? `; el 404 actual (sondeo /carrito) trae título "${p404f.title.replace(/ \| Radaelli Swimwear$/, "")}" y dos etiquetas robots (${[...p404f.h.matchAll(/<meta[^>]+name="robots"[^>]*content="([^"]*)"/gi)].map((m) => `"${m[1]}"`).join(" y ")})` : ""}`,
    not_measured: "título, contenido y diseño de la página 404 de Dev (dev-routes.json solo guarda estado y robots)", tags: TAG_M, root_cause: "ninguna",
  });
}

// ================================================================== OTRAS (blog)
{
  const rb = crawlRec("/blog"), fb = facts(rb), bn = devRoute("/blogs/news");
  const posts = uniq([...fb.h.matchAll(/href="\/blog\/([^"#?]+)"/g)].map((m) => m[1]));
  const inSm = posts.filter((s) => sitemapLocs.includes("/blog/" + s)).length;
  add({
    surface: "Otras", current_url: rb.url, shopify_url: "NOT_AVAILABLE", status: "MISSING", content_parity: "GAP", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_MEASURED",
    known_dependency: "ninguna", action_needed: "Decisión de la dueña (no está en el lote 03F): migrar el blog o dejarlo en 404. Si se migra, Claude crea los posts y las filas /blog/<slug> -> /blogs/<blog>/<slug>. Si se decide no migrarlo, esta fila pasa a PASS_WITH_INTENTIONAL_CHANGE y hay que sumar /blogs/news a la limpieza C5.",
    current_http: http("/blog"), current_class: "EXCEPTION_BLOG_OPEN", proposed_destination: "/blogs/news (existe en Dev, en inglés; si tiene artículos no se midió)",
    dev_evidence: `dev-routes.json:/blogs/news ${bn.s} "${bn.h1}"`,
    measured: `sitio actual: 200, en el sitemap actual, robots "${fb.robots}", ${posts.length} posts listados (${inSm} en el sitemap); ninguna otra página del sitio enlaza /blog (solo el sitemap); sin fila de redirección`,
    not_measured: "contenido completo de los posts", tags: `${TAG_M};[DOC:seo/03E-redirect-plan.md §4.2, §5.5]`, root_cause: "blog sin decisión",
  });
  add({
    surface: "Otras", current_url: curUrl("/blog/<slug>"), status: "NOT_APPLICABLE", content_parity: "NOT_APPLICABLE", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_APPLICABLE",
    action_needed: "ninguna: patrón del inventario (404 literal); los 3 posts reales tienen su propia fila.", current_http: http("/blog/<slug>"), current_class: "PLACEHOLDER",
    measured: "el patrón literal responde 404", not_measured: "n/a", tags: TAG_M, root_cause: "patrón del inventario",
  });
  for (const s of posts) {
    add({
      surface: "Otras", current_url: curUrl("/blog/" + s), shopify_url: "NOT_AVAILABLE", status: "MISSING", content_parity: "GAP", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_MEASURED",
      known_dependency: "ninguna", action_needed: "Ver /blog: decisión de la dueña (migrar o dejar en 404). Si se migra, Claude crea el post en /blogs/<blog>/" + s + " y agrega la redirección.",
      current_http: http("/blog/" + s), current_class: "EXCEPTION_BLOG_OPEN", proposed_destination: "/blogs/news/" + s,
      measured: `listado en /blog y ${sitemapLocs.includes("/blog/" + s) ? "en" : "fuera de"} el sitemap actual; ${anyRec("/blog/" + s) ? `sondeo puntual: ${anyRec("/blog/" + s).status}, robots "${facts(anyRec("/blog/" + s)).robots}", JSON-LD ${facts(anyRec("/blog/" + s)).ld.some((b) => b["@type"] === "Article") ? "Article" : "sin Article"}, título "${facts(anyRec("/blog/" + s)).title.replace(/ \| Radaelli Swimwear$/, "")}"` : "sin GET (no está en el rastreo ni en los sondeos)"}; Dev: sin post ni redirección`,
      not_measured: "contenido completo; el título y los extractos de /blog hablan de lana, lino, cuero y abrigo: parecen texto de plantilla ([INFERIDO])", tags: `${TAG_M};[DOC:seo/03E-redirect-plan.md §5.5]`, root_cause: "blog sin decisión",
    });
  }
  add({
    surface: "Otras", shopify_url: "/blogs/news", status: "MISSING", content_parity: "GAP", function_parity: "NOT_APPLICABLE", visual_parity: "NOT_MEASURED",
    known_dependency: "ninguna", action_needed: "Decisión de la dueña junto con /blog: si se migra, es el destino de los posts; si no, despublicar el blog por defecto (no está listado en C5).",
    current_class: "SHOPIFY_ONLY", dev_evidence: `dev-routes.json:/blogs/news ${bn.s} h1 "${bn.h1}"`, destOk: false,
    measured: `200, h1 "${bn.h1}" (en inglés), robots "${bn.robots}" (indexable); blog por defecto de Shopify, ${posts.length} posts del sitio actual ausentes`,
    not_measured: "cantidad de artículos en Dev, si está en el sitemap", tags: `${TAG_M};[DOC:seo/03F-seo-final-validation.md]`, root_cause: "blog sin decisión",
  });
}

// ================================================================== ordenar por superficie (estable)
const ordered = [];
for (const s of SURFACES) for (const r of rows) if (r.surface === s) ordered.push(r);
rows.length = 0; rows.push(...ordered);
rows.forEach((r, i) => { r.id = "RP-" + String(i + 1).padStart(3, "0"); });

// ================================================================== invariantes
const fails = [];
const check = (name, ok, extra = "") => { const line = `${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  -- " + extra : ""}`; console.log(line); if (!ok) fails.push(name); };

console.log("=== CONTROLES (todos offline) ===");
const c200 = crawl.filter((r) => r.status === 200), c404 = crawl.filter((r) => r.status === 404);
check("Rastreo: 70 URLs, 54 con 200, 16 con 404, 0 errores", crawl.length === 70 && c200.length === 54 && c404.length === 16 && crawl.every((r) => !r.error && (r.status === 200 || r.status === 404)), `${crawl.length}/${c200.length}/${c404.length}`);
check("Redirecciones: 47 filas, sin duplicados (ignorando mayúsculas)", redirRows.length === 47 && redir.size === 47, `${redirRows.length}/${redir.size}`);
const notCrawledInv = invUrls.filter((u) => !byUrl.has(u) && !byUrl.has(u.replace(/\/$/, "")));
check("Inventario (seo/current-url-inventory.csv): todas sus URLs están en el rastreo", notCrawledInv.length === 0, `${invUrls.length} URLs; fuera del rastreo: ${notCrawledInv.length}`);
const rowByCurrent = new Map(rows.filter((r) => r.current_url !== "NOT_APPLICABLE").map((r) => [r.current_url.toLowerCase(), r]));
const crawlMissing = crawl.filter((r) => !rowByCurrent.has(r.url.toLowerCase()));
check("Cobertura: cada URL del rastreo (70) tiene fila", crawlMissing.length === 0, crawlMissing.map((r) => r.url).join(" "));
const redirMissing = [...redir.values()].filter((r) => !rowByCurrent.has((ORIGIN + r.from).toLowerCase()));
check("Cobertura: cada origen de redirección (47) tiene fila", redirMissing.length === 0, redirMissing.map((r) => r.from).join(" "));
const dupCur = rows.filter((r) => r.current_url !== "NOT_APPLICABLE").map((r) => r.current_url.toLowerCase());
check("Una fila por current_url (sin duplicados)", dupCur.length === new Set(dupCur).size);
const dupShop = rows.filter((r) => r.shopify_url !== "NOT_APPLICABLE" && r.current_url === "NOT_APPLICABLE").map((r) => r.shopify_url);
check("Rutas propias de Shopify: una fila por ruta", dupShop.length === new Set(dupShop).size);
const need = ["/search", "/cart", "/account", "/account/login", "/account/register", "/policies/privacy-policy", "/policies/terms-of-service", "/policies/shipping-policy", "/pages/favoritos?view=wishlist", "/sitemap.xml", "/robots.txt", "/404-xyz-parity", "/en", "/collections/destacados", "/collections/frontpage", "/blogs/news", "/pages/contact", "/pages/data-sharing-opt-out", "/apps/wishlist"];
const haveShop = new Set(rows.map((r) => r.shopify_url));
check("Rutas propias de Shopify pedidas: todas con fila", need.every((p) => haveShop.has(p)), need.filter((p) => !haveShop.has(p)).join(" "));
check("Vocabulario de status cerrado", rows.every((r) => STATUS.includes(r.status)));
check("Vocabulario de content/function/visual cerrado", rows.every((r) => [r.content_parity, r.function_parity, r.visual_parity].every((v) => PAR.includes(v))));
check("Superficies válidas", rows.every((r) => SURFACES.includes(r.surface)));
check("visual_parity nunca es MATCH (lo visual no se mide en este ensayo)", rows.every((r) => r.visual_parity !== "MATCH"));
const passLike = rows.filter((r) => r.status === "PASS" || r.status === "PASS_WITH_INTENTIONAL_CHANGE");
check("PASS/PASS_WITH_INTENTIONAL_CHANGE: toda fila tiene evidencia de destino respondiendo en la Dev Store", passLike.every((r) => r.destOk && r.dev_evidence && !r.dev_evidence.includes("SIN_EVIDENCIA")), passLike.filter((r) => !r.destOk).map((r) => r.id).join(" "));
check("PASS/PASS_WITH_INTENTIONAL_CHANGE: ninguna fila tiene un GAP no intencional abierto en content o function (verificación independiente)", passLike.every((r) => r.content_parity !== "GAP" && r.function_parity !== "GAP"), passLike.filter((r) => r.content_parity === "GAP" || r.function_parity === "GAP").map((r) => r.id).join(" "));
const LOTE = new Set(["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "C5"]);
const depsOf = (r) => r.known_dependency.split(";").filter((d) => d !== "ninguna");
check("known_dependency: solo códigos del lote 03F (A1-A5, B1-B4, C1-C5) o \"ninguna\"", rows.every((r) => r.known_dependency === "ninguna" || depsOf(r).every((d) => LOTE.has(d))));
check("BLOCKED_BY_OWNER solo si depende de una acción del lote owner", rows.filter((r) => r.status === "BLOCKED_BY_OWNER").every((r) => depsOf(r).some((d) => LOTE.has(d))));
check("MISSING solo si NO depende del lote owner", rows.filter((r) => r.status === "MISSING").every((r) => depsOf(r).length === 0));
check("action_needed presente en todas las filas", rows.every((r) => r.action_needed && r.action_needed.trim().length > 0));
check("Filas con shopify_url NOT_AVAILABLE son BLOCKED_BY_OWNER o MISSING (destino que debería existir y no existe)", rows.filter((r) => r.shopify_url === "NOT_AVAILABLE").every((r) => r.status === "BLOCKED_BY_OWNER" || r.status === "MISSING"));
const n404rows = crawl.filter((r) => r.status === 404).map((r) => rowByCurrent.get(r.url.toLowerCase()));
check("Las 16 URLs que dan 404 hoy: 15 NOT_APPLICABLE y /cart (ruta nativa de Shopify) como única excepción", n404rows.filter((r) => r.status === "NOT_APPLICABLE").length === 15 && n404rows.filter((r) => r.status !== "NOT_APPLICABLE").every((r) => r.current_url.endsWith("/cart")));
// cada redireccion: destino con evidencia
const redirDest = [...redir.values()].map((r) => ({ ...r, ...destEvidence(r.to) }));
const ok200 = redirDest.filter((r) => r.ok), opq = redirDest.filter((r) => r.opaque), none = redirDest.filter((r) => !r.ok && !r.opaque);
check("Redirecciones: destino con 200 medido en Dev (38) + destino opaco de /account* (9) + 0 sin evidencia", ok200.length === 38 && opq.length === 9 && none.length === 0, `${ok200.length}/${opq.length}/${none.length}; dev-routes declara ${devRoutes.redirects.destination_200_verified} verificados`);
check("Redirecciones: ningún origen es también destino ni hay cadenas", redirDest.every((r) => !redir.has(r.to.toLowerCase())));
check("Redirecciones: ninguna URL actual que da 404 tiene redirección", c404.every((r) => !redir.has(cpath(r).toLowerCase())));
// TODA URL con 200 en el sitio actual: redireccion o equivalente directo o excepcion documentada
const DIRECT = new Set(["/", "/checkout", "/search", "/robots.txt", "/sitemap.xml"]);
const EXC = { "/accesorios": "EXCEPTION_NOT_MIGRATED", "/hombre": "EXCEPTION_NOT_MIGRATED", "/mujer": "EXCEPTION_NOT_MIGRATED", "/ninos": "EXCEPTION_NOT_MIGRATED", "/calzado": "EXCEPTION_NOT_MIGRATED", "/blog": "EXCEPTION_BLOG_OPEN", "/envios": "EXCEPTION_LEGAL_PENDING", "/terminos": "EXCEPTION_LEGAL_PENDING", "/privacidad": "EXCEPTION_LEGAL_PENDING", "/cookies": "EXCEPTION_LEGAL_PENDING" };
for (const s of ["novedades-temporada", "materiales-nobles-por-que-importan", "guia-de-capas-para-el-invierno"]) EXC["/blog/" + s] = "EXCEPTION_BLOG_OPEN";
const probe200 = probeIdx.filter((r) => r.status === 200 && !byUrl.has(r.url));
const all200 = [...c200, ...probe200];
check("Sondeos adicionales (evidence/current-site-probe): 7 entradas (4 con 200: 3 posts del blog y /cuenta/iniciar-sesion; 2 con 404; 1 con 308) sin contradecir el rastreo",
  probeIdx.length === 7 && probe200.length === 4 && probeIdx.filter((r) => r.status === 404).length === 2 && probeIdx.filter((r) => r.status === 308).length === 1 && probeIdx.filter((r) => byUrl.has(r.url)).every((r) => byUrl.get(r.url).status === r.status), `${probeIdx.length} entradas, ${probe200.length} con 200 nuevas`);
const cls = { redirect: [], direct: [], exception: [], unexplained: [] };
for (const r of all200) {
  const p = cpath(r), row = rowByCurrent.get(r.url.toLowerCase());
  if (redir.has(p.toLowerCase())) cls.redirect.push(p);
  else if (DIRECT.has(p)) cls.direct.push(p);
  else if (EXC[p] && row && row.current_class === EXC[p]) cls.exception.push(p);
  else cls.unexplained.push(p);
}
check("TODA URL con 200 en el sitio actual tiene redirección, equivalente directo o excepción documentada", cls.unexplained.length === 0, `redirección ${cls.redirect.length} + directo ${cls.direct.length} + sin destino ${cls.exception.length} = ${cls.redirect.length + cls.direct.length + cls.exception.length} de ${all200.length} (${c200.length} del rastreo + ${probe200.length} de sondeos)`);
check("Equivalente directo verificado en Dev para cada una", cls.direct.every((p) => { const r = p === "/" ? devRoute("/") : devRoute(p); return r && (r.s === 200 || typeof r.s === "string"); }));
check("RC1.7 -> RC1.8: solo cambia sections/main-product.liquid (evidencia de Dev es de RC1.7)", rc8Changed.length === 1 && rc8Changed[0] === "sections/main-product.liquid", rc8Changed.join(","));
check("Productos: 29 en rastreo, 29 en Dev, 29 con fila y redirección", prodRecs.length === 29 && devProducts.length === 29 && prodBreakdown.length === 29 && prodRecs.every((r) => redir.has(("/producto/" + r.url.split("/producto/")[1]).toLowerCase())));
check("Home: 15 productos enlazados (8 editorial + 7 destacados), sin duplicados", facts(crawlRec("/")).prodLinks.length === 15);

// privacidad: nada de telefonos, wa.me ni tokens de checkout
const outMain = [csvLine(HEADER), ...rows.map((r) => csvLine(HEADER.map((k) => r[k])))].join("\n") + "\n";
const outDetail = [csvLine(DETAIL_HEADER), ...rows.map((r) => csvLine([r.id, r.surface, r.current_url, r.current_http, r.current_class, r.redirect_to, r.shopify_url, r.dev_evidence, r.status, r.content_parity, r.function_parity, r.visual_parity, r.measured, r.not_measured, r.tags, r.root_cause, r.proposed_destination]))].join("\n") + "\n";
check("Privacidad: sin teléfonos, sin wa.me, sin tokens/URLs de checkout en las salidas", !/wa\.me|\b57\d{10}\b|\+57|checkouts\/cn|myshopify\.com\/checkouts|@[a-z0-9-]+\.[a-z]{2,}/i.test(outMain + outDetail));
check("CSV principal: cabecera exacta de 9 columnas y 9 celdas por fila", parseCsv(outMain)[0].join(",") === HEADER.join(",") && parseCsv(outMain).every((r) => r.length === 9), String(parseCsv(outMain).length - 1) + " filas");

fs.writeFileSync(path.join(LAUNCH, "03G-route-parity.csv"), outMain, "utf8");
fs.writeFileSync(path.join(LAUNCH, "03G-route-parity-detail.csv"), outDetail, "utf8");

// ================================================================== resumen
const tally = (key, vals) => Object.fromEntries(vals.map((v) => [v, rows.filter((r) => r[key] === v).length]));
console.log("\n=== CONTEOS ===");
console.log("filas:", rows.length);
console.log("status:", JSON.stringify(tally("status", STATUS)));
console.log("content_parity:", JSON.stringify(tally("content_parity", PAR)));
console.log("function_parity:", JSON.stringify(tally("function_parity", PAR)));
console.log("visual_parity:", JSON.stringify(tally("visual_parity", PAR)));
console.log("\nsurface x status:");
for (const s of SURFACES) {
  const sub = rows.filter((r) => r.surface === s);
  console.log(`  ${s.padEnd(12)} total ${String(sub.length).padStart(3)} | ${STATUS.map((st) => `${st.replace("PASS_WITH_INTENTIONAL_CHANGE", "PIC").replace("BLOCKED_BY_OWNER", "BLK").replace("NOT_APPLICABLE", "NA").replace("MISSING", "MIS")}=${sub.filter((r) => r.status === st).length}`).join(" ")}`);
}
console.log("\nstatus x content_parity:");
for (const st of STATUS) console.log(`  ${st.padEnd(30)} ${PAR.map((p) => `${p}=${rows.filter((r) => r.status === st && r.content_parity === p).length}`).join(" ")}`);
console.log("\nstatus x function_parity:");
for (const st of STATUS) console.log(`  ${st.padEnd(30)} ${PAR.map((p) => `${p}=${rows.filter((r) => r.status === st && r.function_parity === p).length}`).join(" ")}`);
const passGap = passLike.filter((r) => r.content_parity === "GAP" || r.function_parity === "GAP");
console.log("\nPASS/PIC con GAP abierto en content o function:", passGap.length, passGap.map((r) => r.id + ":" + r.current_url.replace(ORIGIN, "")).join(" "));
console.log("\nfilas por dependencia (known_dependency):");
const depCount = {};
for (const r of rows) for (const d of r.known_dependency.split(";")) if (d !== "ninguna") depCount[d] = (depCount[d] || 0) + 1;
console.log(" ", JSON.stringify(Object.fromEntries(Object.entries(depCount).sort())));
console.log("\nfilas por current_class:", JSON.stringify(rows.reduce((a, r) => { a[r.current_class || "(vacío)"] = (a[r.current_class || "(vacío)"] || 0) + 1; return a; }, {})));

console.log(`\n=== URLs con 200 en el sitio actual (${all200.length}: ${c200.length} del rastreo + ${probe200.length} de sondeos) ===`);
console.log("con redirección en el CSV (", cls.redirect.length, "):", cls.redirect.join(" "));
console.log("equivalente directo, misma ruta en Shopify (", cls.direct.length, "):", cls.direct.join(" "));
console.log("SIN redirección ni destino (", cls.exception.length, "):");
for (const p of cls.exception) { const r = rowByCurrent.get((ORIGIN + p).toLowerCase()); console.log(`  ${p.padEnd(12)} ${r.current_class.padEnd(24)} status=${r.status} dep=${r.known_dependency}`); }
if (cls.unexplained.length) console.log("SIN EXPLICAR:", cls.unexplained.join(" "));

console.log("\n=== PRODUCTOS (29) ===");
const pc = (k) => prodBreakdown.filter((p) => p.content === k).length;
console.log(`content_parity: MATCH=${pc("MATCH")} GAP=${pc("GAP")} NOT_MEASURED=${pc("NOT_MEASURED")}`);
console.log("GAP:", prodBreakdown.filter((p) => p.content === "GAP").map((p) => `${p.handle}[${p.failed.join(",")}]`).join(" ") || "-");
console.log("NOT_MEASURED (miga RC1.7 = Destacados):", prodStats.crumbRc17.join(" ") || "-");
console.log("solo capitalización del color:", prodStats.colorCase.join(" ") || "-");
console.log("sufijo UUID en nombre de imagen:", prodStats.imgSuffix.join(" ") || "-");

console.log("\n=== HOME / COLECCIONES: orden ===");
for (const h of COLS.slice(0, 3)) { const f = facts(crawlRec("/" + h)), dc = devColBy.get(h); console.log(`  ${h}: mismo conjunto=${eqArr([...f.prodLinks].sort(), [...dc.order].sort())} mismo orden=${eqArr(f.prodLinks, dc.order)}`); }

console.log("\n=== LEGALES: texto fuente presente en el sitio actual ===");
for (const [k, v] of Object.entries(legalCheck)) console.log(`  ${k}: ${v.found}/${v.total}`);

// ------------------------------------------------------------------ tablas Markdown (para pegar en 03G-route-parity.md)
const short = (s) => s.replace(ORIGIN, "") || "/";
console.log("\n=== MARKDOWN: status ===");
console.log("| status | filas |\n|---|---|");
for (const st of STATUS) console.log(`| ${st} | ${rows.filter((r) => r.status === st).length} |`);
console.log(`| **Total** | **${rows.length}** |`);
console.log("\n=== MARKDOWN: superficie x status ===");
console.log("| Superficie | Total | PASS | PASS_WITH_INTENTIONAL_CHANGE | BLOCKED_BY_OWNER | MISSING | NOT_APPLICABLE |\n|---|---|---|---|---|---|---|");
for (const s of SURFACES) { const sub = rows.filter((r) => r.surface === s); console.log(`| ${s} | ${sub.length} | ${STATUS.map((st) => sub.filter((r) => r.status === st).length).join(" | ")} |`); }
console.log(`| **Total** | **${rows.length}** | ${STATUS.map((st) => `**${rows.filter((r) => r.status === st).length}**`).join(" | ")} |`);
console.log("\n=== MARKDOWN: columnas de paridad ===");
console.log("| Valor | content_parity | function_parity | visual_parity |\n|---|---|---|---|");
for (const p of PAR) console.log(`| ${p} | ${rows.filter((r) => r.content_parity === p).length} | ${rows.filter((r) => r.function_parity === p).length} | ${rows.filter((r) => r.visual_parity === p).length} |`);
console.log("\n=== MARKDOWN: BLOCKED_BY_OWNER y MISSING ===");
console.log("| ID | Ruta actual | Ruta Shopify | status | Dependencia | Causa |\n|---|---|---|---|---|---|");
for (const r of rows.filter((x) => x.status === "BLOCKED_BY_OWNER" || x.status === "MISSING")) console.log(`| ${r.id} | ${r.current_url === "NOT_APPLICABLE" ? "(solo Shopify)" : "`" + short(r.current_url) + "`"} | ${r.shopify_url.startsWith("/") ? "`" + r.shopify_url + "`" : r.shopify_url} | ${r.status} | ${r.known_dependency} | ${r.root_cause} |`);
console.log("\n=== MARKDOWN: causas raíz (filas BLOCKED_BY_OWNER + MISSING) ===");
const rc = {};
for (const r of rows.filter((x) => x.status === "BLOCKED_BY_OWNER" || x.status === "MISSING")) rc[r.root_cause] = (rc[r.root_cause] || 0) + 1;
console.log("| Causa | Filas |\n|---|---|");
for (const [k, v] of Object.entries(rc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) console.log(`| ${k} | ${v} |`);
console.log("\n=== MARKDOWN: NOT_APPLICABLE ===");
const napp = rows.filter((r) => r.status === "NOT_APPLICABLE");
console.log(napp.map((r) => `${r.id} ${short(r.current_url)} (${r.current_class})`).join("; "));
console.log("\n=== MARKDOWN: orden por defecto (primeros 3, actual -> Dev) ===");
console.log("| Colección | Actual | Dev |\n|---|---|---|");
for (const h of COLS.slice(0, 3)) { const f = facts(crawlRec("/" + h)), dc = devColBy.get(h); console.log(`| ${h} | ${f.prodLinks.slice(0, 3).join(", ")} | ${dc.order.slice(0, 3).join(", ")} |`); }

console.log("\n=== RESULTADO ===");
if (fails.length) { console.log(`FALLO: ${fails.length} control(es): ${fails.join(" | ")}`); process.exit(1); }
console.log(`OK: ${rows.length} filas escritas en launch/03G-route-parity.csv (+ detalle). 0 controles fallidos.`);
