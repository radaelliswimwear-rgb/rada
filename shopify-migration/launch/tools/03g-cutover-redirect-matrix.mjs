// 03G -- matriz de verificacion de redirecciones para el cutover (NO ejecuta ninguna peticion).
// Uso:  node launch/tools/03g-cutover-redirect-matrix.mjs [BASE_URL]
//   BASE_URL opcional, por defecto https://radaelliswimwear.com (dominio del sitio actual y futuro dominio primario).
//   Antes del DNS se puede pasar el dominio *.myshopify.com de la tienda comercial (NOT_AVAILABLE hasta S01).
// Determinista y offline: solo lee seo/shopify-redirects-import.csv y escribe en la salida estandar.
// Clasifica las 47 filas del CSV, comprueba los conteos y lista los comandos curl -I a correr a mano
// (mas las 4 legales pendientes, los 404 esperados y los chequeos de plataforma). Sale con codigo 1 si el CSV no cuadra.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(here, "..", "..");
const base = (process.argv[2] || "https://radaelliswimwear.com").replace(/\/+$/, "");
if (!/^https:\/\/[a-z0-9.-]+$/i.test(base)) {
  console.error("BASE_URL invalida: debe ser https://<host> sin ruta ni query.");
  process.exit(1);
}

const csvPath = path.join(MIG, "seo", "shopify-redirects-import.csv");
const lines = fs.readFileSync(csvPath, "utf8").split(/\r?\n/).filter((l) => l.length > 0);
const errors = [];
if (lines[0] !== "Redirect from,Redirect to") errors.push("Encabezado distinto de 'Redirect from,Redirect to'.");
const rows = lines.slice(1).map((l) => {
  const i = l.indexOf(",");
  return { from: l.slice(0, i), to: l.slice(i + 1) };
});

const groups = {
  coleccion: [], producto: [], "legal-migrada": [], busqueda: [], favoritos: [], cuenta: [],
};
for (const r of rows) {
  if (r.from.startsWith("/producto/")) groups.producto.push(r);
  else if (r.to.startsWith("/collections/")) groups.coleccion.push(r);
  else if (r.from === "/devoluciones" || r.from === "/garantia") groups["legal-migrada"].push(r);
  else if (r.from === "/buscar") groups.busqueda.push(r);
  else if (r.from === "/favoritos" || r.from === "/cuenta/favoritos") groups.favoritos.push(r);
  else if (r.from.startsWith("/cuenta")) groups.cuenta.push(r);
  else errors.push("Fila sin clase: " + r.from);
}
const expected = { coleccion: 4, producto: 29, "legal-migrada": 2, busqueda: 1, favoritos: 2, cuenta: 9 };
for (const [k, n] of Object.entries(expected)) {
  if (groups[k].length !== n) errors.push(`Grupo ${k}: ${groups[k].length} filas, se esperaban ${n}.`);
}
if (rows.length !== 47) errors.push(`CSV con ${rows.length} filas, se esperaban 47.`);
if (new Set(rows.map((r) => r.from.toLowerCase())).size !== rows.length) errors.push("Origenes duplicados (sin distinguir mayusculas).");

// 4 legales pendientes: NO estan en el CSV. Destino propuesto por theme/03F-legal-owner-runbook.md (E1);
// el destino definitivo lo decide la duena (D-CT7). Se listan para verificar que existan ANTES del DNS.
const legalPendiente = [
  { from: "/envios", to: "/pages/envios" },
  { from: "/terminos", to: "/pages/terminos" },
  { from: "/privacidad", to: "/pages/privacidad" },
  { from: "/cookies", to: "/pages/cookies" },
];
// Sin destino por decision de 03E (seo/03E-redirect-plan.md 4.1 y 5.5): se espera 404 salvo decision distinta de la duena.
const sin404 = ["/accesorios", "/hombre", "/mujer", "/ninos", "/calzado", "/blog",
  "/blog/novedades-temporada", "/blog/materiales-nobles-por-que-importan", "/blog/guia-de-capas-para-el-invierno"];
// Casos de comportamiento medidos en 03F (seo/03F-redirect-import-result.md) que hay que repetir en el dominio final.
const extras = [
  { from: "/producto/costa-esmeralda-azul", to: "/products/costa-esmeralda-azul", note: "minusculas: no distingue mayusculas (medido en Dev)" },
  { from: "/buscar?q=bikini", to: "/search?q=bikini", note: "conserva el query (medido en Dev)" },
  { from: "/producto/bikini-foam?utm_source=x", to: "/products/bikini-foam?utm_source=x", note: "conserva el query (medido en Dev)" },
  { from: "/oasis-natural/", to: "/collections/oasis-natural", note: "barra final (medido en Dev)" },
];
const plataforma = [
  { p: "/", esperado: "200" }, { p: "/en", esperado: "200 si D-CT19 = publicar inglés; 404 si se despublica (decisión de la dueña)" }, { p: "/robots.txt", esperado: "200; revisar regla /policies/" },
  { p: "/sitemap.xml", esperado: "200; es un indice, el sitemap hijo de productos debe listar 29" }, { p: "/search", esperado: "200; noindex" },
  { p: "/pages/favoritos", esperado: "200; noindex" },
];

const out = [];
const cmd = (u) => `curl.exe -sI "${base}${u}"`;
out.push(`# Matriz de redirecciones del cutover -- base ${base}`);
out.push(`# Fuente: seo/shopify-redirects-import.csv (${rows.length} filas). Este script NO hace peticiones.`);
out.push(`# PowerShell: usar curl.exe (curl es alias de Invoke-WebRequest). Esperado en cada fila: 301 y Location = destino.`);
out.push(`# Codigo exacto 301: NOT_VERIFIED hasta correr esto (Shopify los documenta como permanentes).`);
out.push("");
out.push("## Conteos");
for (const [k, n] of Object.entries(expected)) out.push(`- ${k}: ${groups[k].length} (esperado ${n})`);
out.push(`- legal-pendiente (fuera del CSV): ${legalPendiente.length}`);
out.push(`- sin destino, 404 esperado (decision de la duena): ${sin404.length}`);
out.push(`- extras de comportamiento: ${extras.length}`);
out.push(`- chequeos de plataforma: ${plataforma.length}`);
out.push("");
const show = (title, arr, fmt) => {
  out.push(`## ${title} (${arr.length})`);
  for (const x of arr) out.push(fmt(x));
  out.push("");
};
show("coleccion", groups.coleccion, (r) => `${cmd(r.from)}   # 301 -> ${r.to}`);
show("producto", groups.producto, (r) => `${cmd(r.from)}   # 301 -> ${r.to}`);
show("legal-migrada", groups["legal-migrada"], (r) => `${cmd(r.from)}   # 301 -> ${r.to}`);
show("busqueda", groups.busqueda, (r) => `${cmd(r.from)}   # 301 -> ${r.to}`);
show("favoritos (condicional: page.wishlist asignada)", groups.favoritos, (r) => `${cmd(r.from)}   # 301 -> ${r.to}`);
show("cuenta (solo el primer salto; el siguiente lo da Shopify hacia su dominio de cuentas)", groups.cuenta, (r) => `${cmd(r.from)}   # 301 -> ${r.to}`);
show("legal-pendiente (requisito previo al DNS; destino propuesto, decide D-CT7)", legalPendiente, (r) => `${cmd(r.from)}   # 301 -> ${r.to}  (si no existe: 404 = NO-GO)`);
show("sin destino (404 esperado)", sin404.map((p) => ({ from: p })), (r) => `${cmd(r.from)}   # 404`);
show("extras de comportamiento", extras, (r) => `${cmd(r.from)}   # 301 -> ${r.to}  (${r.note})`);
show("plataforma", plataforma, (r) => `${cmd(r.p)}   # ${r.esperado}`);
out.push("## Destino final (una sola vez por grupo; no seguir las 9 de cuenta)");
out.push(`curl.exe -sIL -o NUL -w "%{http_code} %{url_effective}\\n" "${base}/producto/bikini-foam"   # 200 en /products/bikini-foam`);
out.push("");
out.push(errors.length ? "RESULTADO: FALLA\n" + errors.map((e) => "  - " + e).join("\n") : `RESULTADO: OK -- ${rows.length} filas del CSV clasificadas, conteos por grupo correctos.`);
console.log(out.join("\n"));
process.exit(errors.length ? 1 : 0);
