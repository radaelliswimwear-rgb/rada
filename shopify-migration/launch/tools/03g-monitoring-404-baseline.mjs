// 03G -- linea base de 404 y redirecciones para el monitoreo de las primeras 24 h (NO hace peticiones).
// Uso:  node launch/tools/03g-monitoring-404-baseline.mjs
// Lee (solo lectura, todo local):
//   seo/shopify-redirects-import.csv                     (las 47 redirecciones)
//   launch/evidence/current-site/index.json + sitemap.xml.txt   (rastreo del sitio actual, 2026-09-29)
//   launch/evidence/current-site-probe/index.json         (7 GET puntuales, 2026-09-29)
// Escribe solo en la salida estandar. Determinista y offline. Sale con codigo 1 si un conteo no cuadra
// con lo que citan launch/03G-route-parity.md (seccion 6) y launch/03G-post-launch-monitoring.md (MO-05).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(here, "..", "..");
const rd = (...p) => fs.readFileSync(path.join(MIG, ...p), "utf8");
const ORIGIN = "https://radaelliswimwear.com";
const toPath = (u) => {
  const p = u.startsWith(ORIGIN) ? u.slice(ORIGIN.length) : u;
  return p === "" ? "/" : p;
};

// --- redirecciones (CSV) ---
const csvRaw = rd("seo", "shopify-redirects-import.csv");
const csvSha = crypto.createHash("sha256").update(csvRaw).digest("hex");
const lines = csvRaw.split(/\r?\n/).filter((l) => l.length > 0);
const errors = [];
if (lines[0] !== "Redirect from,Redirect to") errors.push("Encabezado del CSV distinto de 'Redirect from,Redirect to'.");
const rows = lines.slice(1).map((l) => {
  const i = l.indexOf(",");
  return { from: l.slice(0, i), to: l.slice(i + 1) };
});
const redirectMap = new Map(rows.map((r) => [r.from.toLowerCase(), r]));

// --- rastreo del sitio actual ---
const crawl = JSON.parse(rd("launch", "evidence", "current-site", "index.json"));
const probe = JSON.parse(rd("launch", "evidence", "current-site-probe", "index.json"));
const sitemapXml = rd("launch", "evidence", "current-site", "sitemap.xml.txt");
const sitemapPaths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => toPath(m[1].trim()));

const ok200 = new Map(); // path -> fuente
const est404 = new Map();
for (const r of crawl) {
  const p = toPath(r.url);
  if (r.status === 200) ok200.set(p, "rastreo");
  else if (r.status === 404) est404.set(p, "rastreo");
}
for (const r of probe) {
  const p = r.path;
  if (r.status === 200 && !ok200.has(p)) ok200.set(p, "sondeo");
  else if (r.status === 404 && !est404.has(p)) est404.set(p, "sondeo");
}

// --- clasificacion ---
const DIRECT = ["/", "/checkout", "/search", "/robots.txt", "/sitemap.xml"];
const LEGAL_PENDING = ["/envios", "/terminos", "/privacidad", "/cookies"];
const NOT_MIGRATED = ["/accesorios", "/hombre", "/mujer", "/ninos", "/calzado"];
const classify = (p) => {
  if (redirectMap.has(p.toLowerCase())) return "REDIRECT";
  if (DIRECT.includes(p)) return "DIRECT";
  if (LEGAL_PENDING.includes(p)) return "LEGAL_PENDING";
  if (p === "/blog" || p.startsWith("/blog/")) return "BLOG_OPEN";
  if (NOT_MIGRATED.includes(p)) return "NOT_MIGRATED";
  return "SIN_CLASIFICAR";
};
const expectedFirstHop = {
  REDIRECT: "301 al destino del CSV; destino final 200 (las 9 de /cuenta* terminan en el dominio de cuentas de Shopify)",
  DIRECT: "200 en /, /search, /robots.txt y /sitemap.xml (rutas nativas, medidas en la Dev Store); /checkout NO da 200: con carrito un GET redirige a /checkouts/cn/<token>/es-us (launch/evidence/dev-routes.json) y sin carrito no se midio",
  LEGAL_PENDING: "301 al destino de D-CT7 y 200 SOLO si CT-05 creo la pagina; sin pagina = 404 y NO-GO antes de T0",
  BLOG_OPEN: "404 (sin destino; decision D-CT6 pendiente)",
  NOT_MIGRATED: "404 (sin destino; 03E)",
};

const groupBy = (paths) => {
  const g = {};
  for (const p of [...paths].sort()) (g[classify(p)] ||= []).push(p);
  return g;
};
const gUniverse = groupBy(ok200.keys());
const gSitemap = groupBy(sitemapPaths);
const n = (g, k) => (g[k] ? g[k].length : 0);

// CSV: grupos como en 03g-cutover-redirect-matrix.mjs
const csvGroups = { coleccion: 0, producto: 0, "legal-migrada": 0, busqueda: 0, favoritos: 0, cuenta: 0 };
for (const r of rows) {
  if (r.from.startsWith("/producto/")) csvGroups.producto++;
  else if (r.to.startsWith("/collections/")) csvGroups.coleccion++;
  else if (r.from === "/devoluciones" || r.from === "/garantia") csvGroups["legal-migrada"]++;
  else if (r.from === "/buscar") csvGroups.busqueda++;
  else if (r.from === "/favoritos" || r.from === "/cuenta/favoritos") csvGroups.favoritos++;
  else if (r.from.startsWith("/cuenta")) csvGroups.cuenta++;
  else errors.push("Fila del CSV sin clase: " + r.from);
}

const csvNotInUniverse = rows.map((r) => r.from).filter((f) => ![...ok200.keys()].some((p) => p.toLowerCase() === f.toLowerCase()));

// --- salida ---
const out = [];
out.push("# Linea base de 404 y redirecciones (monitoreo de las primeras 24 h). Sin peticiones de red.");
out.push(`# CSV: seo/shopify-redirects-import.csv, ${rows.length} filas, SHA-256 ${csvSha}`);
out.push("");
out.push("## A. Filas del CSV por grupo");
for (const [k, v] of Object.entries(csvGroups)) out.push(`- ${k}: ${v}`);
out.push("");
out.push(`## B. URLs que dan 200 hoy en el sitio actual: ${ok200.size} (rastreo + sondeo, sin duplicados)`);
for (const k of ["REDIRECT", "DIRECT", "LEGAL_PENDING", "BLOG_OPEN", "NOT_MIGRATED", "SIN_CLASIFICAR"]) {
  out.push(`- ${k}: ${n(gUniverse, k)}`);
}
const sinDestino = n(gUniverse, "LEGAL_PENDING") + n(gUniverse, "BLOG_OPEN") + n(gUniverse, "NOT_MIGRATED");
out.push(`- Sin redireccion ni destino (LEGAL_PENDING + BLOG_OPEN + NOT_MIGRATED): ${sinDestino}`);
for (const k of ["DIRECT", "LEGAL_PENDING", "BLOG_OPEN", "NOT_MIGRATED"]) {
  out.push(`  - ${k}: ${(gUniverse[k] || []).join(" ")}`);
}
out.push("");
out.push(`## C. Origenes del CSV que NO dan 200 hoy o no estan en el rastreo: ${csvNotInUniverse.length}`);
out.push(`  ${csvNotInUniverse.join(" ")}`);
out.push("");
out.push(`## D. Rutas que dan 404 hoy en el sitio actual: ${est404.size} (rastreo + sondeo, sin duplicados; incluye el literal '/blog/<slug>' del inventario)`);
out.push(`  ${[...est404.keys()].sort().join(" ")}`);
out.push("  Ninguna tiene redireccion en el CSV, salvo '/producto/costa-esmeralda-azul' (minusculas): 404 hoy y con redireccion en Shopify (no distingue mayusculas).");
out.push("");
out.push(`## E. Sitemap actual: ${sitemapPaths.length} URLs`);
for (const k of ["REDIRECT", "DIRECT", "LEGAL_PENDING", "BLOG_OPEN", "NOT_MIGRATED", "SIN_CLASIFICAR"]) {
  out.push(`- ${k}: ${n(gSitemap, k)}`);
}
out.push("");
out.push("## F. Primer salto esperado en Shopify por clase (para la lista de vigilancia de 404)");
for (const [k, v] of Object.entries(expectedFirstHop)) out.push(`- ${k}: ${v}`);
out.push("");

// --- controles (cifras que cita el plan de monitoreo) ---
const checks = [
  ["CSV con 47 filas", rows.length === 47],
  ["CSV SHA-256 = ba369467...18b1d6 (rollback plan, seccion 2)", csvSha === "ba3694678062c1f916166fb79e14640226aaa37b29cd4dc3ab183bc27818b1d6"],
  ["Grupos del CSV 4 / 29 / 2 / 1 / 2 / 9", csvGroups.coleccion === 4 && csvGroups.producto === 29 && csvGroups["legal-migrada"] === 2 && csvGroups.busqueda === 1 && csvGroups.favoritos === 2 && csvGroups.cuenta === 9],
  ["Origenes del CSV sin duplicados (sin distinguir mayusculas)", redirectMap.size === rows.length],
  ["Universo con 200 = 58 (54 del rastreo + 4 del sondeo)", ok200.size === 58],
  ["REDIRECT = 40", n(gUniverse, "REDIRECT") === 40],
  ["DIRECT = 5", n(gUniverse, "DIRECT") === 5],
  ["Sin destino = 13 (4 legales + 4 blog + 5 no migradas)", sinDestino === 13 && n(gUniverse, "LEGAL_PENDING") === 4 && n(gUniverse, "BLOG_OPEN") === 4 && n(gUniverse, "NOT_MIGRATED") === 5],
  ["Ninguna URL sin clasificar en el universo", n(gUniverse, "SIN_CLASIFICAR") === 0],
  ["Origenes del CSV fuera del universo = 7 (rutas /cuenta* no rastreadas)", csvNotInUniverse.length === 7],
  ["404 hoy = 17 rutas distintas (16 del rastreo + '/producto/costa-esmeralda-azul' del sondeo)", est404.size === 17],
  ["Sitemap actual = 45 URLs", sitemapPaths.length === 45],
  ["Sitemap: 35 REDIRECT + 1 DIRECT + 4 LEGAL_PENDING + 4 BLOG_OPEN + 1 NOT_MIGRATED", n(gSitemap, "REDIRECT") === 35 && n(gSitemap, "DIRECT") === 1 && n(gSitemap, "LEGAL_PENDING") === 4 && n(gSitemap, "BLOG_OPEN") === 4 && n(gSitemap, "NOT_MIGRATED") === 1],
  ["Ninguna URL del sitemap sin clasificar", n(gSitemap, "SIN_CLASIFICAR") === 0],
];
out.push("## G. Controles");
let bad = errors.length;
for (const e of errors) out.push(`FALLA  ${e}`);
for (const [t, pass] of checks) {
  out.push(`${pass ? "PASA  " : "FALLA "} ${t}`);
  if (!pass) bad++;
}
out.push("");
out.push(bad === 0 ? "RESULTADO: OK" : `RESULTADO: FALLA (${bad})`);
console.log(out.join("\n"));
process.exit(bad === 0 ? 0 : 1);
