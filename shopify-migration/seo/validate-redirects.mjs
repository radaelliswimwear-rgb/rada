#!/usr/bin/env node
/**
 * Fase 03E -- validador del paquete de redirects SEO (sitio Next.js -> Shopify).
 *
 *   node shopify-migration/seo/validate-redirects.mjs            # validación + conteos
 *   node shopify-migration/seo/validate-redirects.mjs --list     # + clasificación URL por URL (markdown)
 *   node shopify-migration/seo/validate-redirects.mjs --self-test # casos negativos sintéticos
 *
 * Solo LEE archivos. No escribe nada, no llama a la red, no usa la CLI de Shopify.
 *
 * Entradas (solo lectura):
 *   seo/shopify-redirects-import.csv       (el paquete a validar; formato de importación de Shopify)
 *   seo/current-url-inventory.csv          (inventario Fase 01: 47 filas)
 *   catalog/shopify-url-parity.csv         (paridad 03C: 49 filas = inventario + /favoritos + /cuenta/favoritos)
 *   catalog/shopify-handle-mapping.csv     (slug de origen -> handle de Shopify)
 *   catalog/shopify-post-import-audit.csv  (29 handles verificados en la Dev Store en 03C)
 *   theme/03B-*.md, theme/03D-*.md         (evidencia textual de páginas que existen hoy en la Dev Store)
 *   <APP>/app/**  y <APP>/public/**        (rutas del sitio Next.js; APP_DIR permite cambiar la raíz)
 *
 * Controles:
 *   - encabezado exacto "Redirect from,Redirect to" (plantilla oficial de Shopify)
 *   - rutas relativas (sin dominio), sin query/fragmento en el origen, destino en minúsculas
 *   - sin duplicados (exactos ni por mayúsculas), sin auto-redirects, sin cadenas, sin loops
 *   - origen conocido (inventario, paridad o ruta real de app/) y que Shopify no sirva ni reserve
 *   - destino dentro de la allowlist de rutas que EXISTEN hoy en la Dev Store (derivada, no inventada)
 *   - destino nunca en una página legal pendiente (no creada)
 *   - relación origen/destino declarada (producto -> su handle, colección -> misma colección, etc.)
 *   - clasificación de TODA URL del inventario (+ extras) en exactamente una clase
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SEO_DIR = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(SEO_DIR, "..");
const WORKTREE_ROOT = path.resolve(MIG, "..");
const MAIN_CHECKOUT = path.resolve(MIG, "../../../..");
const APP = process.env.APP_DIR
  ? path.resolve(process.env.APP_DIR)
  : fs.existsSync(path.join(MAIN_CHECKOUT, "app"))
    ? MAIN_CHECKOUT
    : WORKTREE_ROOT;

const ARGS = new Set(process.argv.slice(2));

// ---------------------------------------------------------------- CSV
function parseCSV(text) {
  const rows = [];
  let rec = [];
  let f = "";
  let q = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          f += '"';
          i++;
        } else q = false;
      } else f += c;
      continue;
    }
    if (c === '"') q = true;
    else if (c === ",") {
      rec.push(f);
      f = "";
    } else if (c === "\r") continue;
    else if (c === "\n") {
      rec.push(f);
      rows.push(rec);
      rec = [];
      f = "";
    } else f += c;
  }
  if (f || rec.length) {
    rec.push(f);
    rows.push(rec);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}
function readObjects(rel) {
  const [head, ...body] = parseCSV(fs.readFileSync(path.join(MIG, rel), "utf8"));
  return body.map((r) => Object.fromEntries(head.map((h, k) => [h, r[k] ?? ""])));
}
const pathOf = (url) => {
  const p = url.replace(/^https?:\/\/[^/]+/i, "");
  return p === "" ? "/" : p;
};
const norm = (p) => {
  let s = p.split(/[?#]/)[0].toLowerCase();
  if (s.length > 1) s = s.replace(/\/+$/, "");
  return s;
};

// ---------------------------------------------------------------- Plataforma (help.shopify.com)
// https://help.shopify.com/en/manual/online-store/menus-and-links/url-redirect
//   "You can redirect only from broken URLs" + prefijos reservados y rutas fijas
//   (consultado 2026-09-29: /apps, /application, /cart, /carts, /orders, /services, /shop;
//   fijas /products, /collections, /collections/all; reservadas /collections/vendors,
//   /collections/types, /apps/, /a/, /community/, /tools/).
const SHOPIFY_RESERVED_PREFIXES = [
  "/apps", "/application", "/cart", "/carts", "/orders", "/services", "/shop", "/a", "/community", "/tools",
];
const SHOPIFY_FIXED_PATHS = ["/products", "/collections", "/collections/all", "/collections/vendors", "/collections/types"];
// Caracteres permitidos en una ruta de la importación (sin espacios ni comas ni no-ASCII sin codificar).
const SAFE_PATH = /^\/[A-Za-z0-9\-._~/%]*$/;
// Rutas que Shopify sirve por sí mismo (un redirect desde ahí nunca dispararía).
const SHOPIFY_SERVED_PREFIXES = [
  "/products/", "/collections/", "/pages/", "/policies/", "/blogs/", "/account", "/search", "/checkout", "/checkouts",
  "/cart", "/admin", "/password", "/en/",
];
const underPrefix = (p, pre) => p === pre || p.startsWith(pre.endsWith("/") ? pre : pre + "/");

// ---------------------------------------------------------------- Allowlist de destinos (existen HOY en la Dev Store)
function buildAllowlist(log) {
  const allow = new Map(); // path -> evidencia
  const parity = readObjects("catalog/shopify-url-parity.csv");
  for (const r of parity) {
    if (/^EXISTS/.test(r.status) && r.shopify_url) {
      allow.set(norm(r.shopify_url), `catalog/shopify-url-parity.csv status="${r.status.split(" (")[0]}"`);
    }
  }
  const audited = new Set(readObjects("catalog/shopify-post-import-audit.csv").map((r) => r.handle));
  for (const h of audited) {
    const p = `/products/${h}`;
    if (!allow.has(p)) allow.set(p, "catalog/shopify-post-import-audit.csv");
  }
  // Productos: además de EXISTS en paridad, el handle tiene que estar auditado en la tienda (03C).
  for (const p of [...allow.keys()]) {
    if (p.startsWith("/products/") && !audited.has(p.slice("/products/".length))) {
      allow.delete(p);
      log.push(`WARN allowlist: ${p} figura en paridad pero no en post-import-audit -> excluido`);
    }
  }
  // Páginas verificadas en reportes de la Dev Store: se aceptan solo si el texto de evidencia sigue ahí.
  const EVIDENCE = [
    ["/pages/garantia", "theme/03D-legal-policies-inventory.md", "(`/pages/garantia`) | **HECHO**"],
    ["/policies/refund-policy", "theme/03D-legal-policies-inventory.md", "(`/policies/refund-policy`) | **HECHO**"],
    ["/collections/destacados", "theme/03D-search-accounts-wishlist-report.md", "colección manual `destacados`"],
    ["/cart", "theme/03D-search-accounts-wishlist-report.md", "Búsqueda, Carrito, Favoritos, Garantía, Reembolso y Destacados"],
    ["/account", "theme/03D-search-accounts-wishlist-report.md", "`/account` → login de Shopify"],
    ["/account/login", "theme/03B-store-foundation-report.md", "GET `/account/login` y `/account/register`"],
    ["/account/register", "theme/03B-store-foundation-report.md", "GET `/account/login` y `/account/register`"],
    ["/pages/favoritos", "theme/03B-store-foundation-report.md", "`/pages/favoritos?view=wishlist` → 200"],
  ];
  for (const [p, file, needle] of EVIDENCE) {
    const txt = fs.readFileSync(path.join(MIG, file), "utf8");
    if (txt.includes(needle)) {
      if (!allow.has(p)) allow.set(p, `${file} ("${needle.slice(0, 40)}…")`);
    } else {
      allow.delete(p);
      log.push(`WARN allowlist: evidencia no encontrada para ${p} en ${file} -> excluido`);
    }
  }
  return allow;
}

// Destinos que NO existen hoy (páginas legales no creadas, blog no migrado, colecciones retiradas).
const PENDING_DESTINATIONS = [
  "/pages/envios", "/pages/terminos", "/pages/privacidad", "/pages/cookies", "/pages/devoluciones",
  "/policies/shipping-policy", "/policies/terms-of-service", "/policies/contact-information",
  "/collections/accesorios", "/collections/hombre", "/collections/mujer", "/collections/ninos", "/collections/calzado",
];

// ---------------------------------------------------------------- Rutas del sitio Next.js (app/ + public/)
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
function scanAppRoutes() {
  const appDir = path.join(APP, "app");
  const routes = [];
  for (const f of walk(appDir)) {
    const rel = path.relative(appDir, f).split(path.sep);
    const file = rel.pop();
    const segs = rel.filter((s) => !/^\(.*\)$/.test(s));
    const base = "/" + segs.join("/");
    const route = base === "/" ? "/" : base;
    if (/^page\.(tsx|ts|jsx|js)$/.test(file)) routes.push({ path: route, kind: "page" });
    else if (/^route\.(tsx|ts|js)$/.test(file)) routes.push({ path: route, kind: "route-handler" });
    else if (segs.length === 0 && /^robots\.(ts|js)$/.test(file)) routes.push({ path: "/robots.txt", kind: "metadata" });
    else if (segs.length === 0 && /^sitemap\.(ts|js)$/.test(file)) routes.push({ path: "/sitemap.xml", kind: "metadata" });
    else if (segs.length === 0 && /^opengraph-image\.(tsx|ts|js|png|jpg)$/.test(file)) routes.push({ path: "/opengraph-image", kind: "metadata" });
    else if (segs.length === 0 && /^(icon|apple-icon)\.(png|ico|svg)$/.test(file)) routes.push({ path: "/" + file, kind: "metadata" });
    else if (segs.length === 0 && file === "favicon.ico") routes.push({ path: "/favicon.ico", kind: "metadata" });
  }
  const pub = walk(path.join(APP, "public")).map((f) => ({
    path: "/" + path.relative(path.join(APP, "public"), f).split(path.sep).join("/"),
    kind: "public-asset",
  }));
  const seen = new Set();
  return [...routes, ...pub].filter((r) => (seen.has(r.path) ? false : seen.add(r.path)));
}

// ---------------------------------------------------------------- Relación origen -> destino declarada
// Cualquier fila del CSV que no encaje en una de estas familias es un error (evita "redirect a contenido no relacionado").
const DECLARED = new Map([
  ["/devoluciones", ["/policies/refund-policy", "texto de /devoluciones migrado verbatim a la política de reembolso (03D, SHA-256 igual)"]],
  ["/garantia", ["/pages/garantia", "texto de /garantia migrado verbatim (03D, SHA-256 igual)"]],
  ["/buscar", ["/search", "búsqueda propia -> búsqueda nativa"]],
  ["/favoritos", ["/pages/favoritos", "favoritos -> página de favoritos (plantilla page.wishlist)"]],
  ["/cuenta/favoritos", ["/pages/favoritos", "favoritos de cuenta -> página de favoritos (hasta que exista la extensión)"]],
  ["/cuenta", ["/account", "área de cuenta -> cuenta de Shopify"]],
  ["/cuenta/pedidos", ["/account", "pedidos -> cuenta de Shopify (/account/orders no verificado)"]],
  ["/cuenta/perfil", ["/account", "perfil -> cuenta de Shopify (/account/profile no verificado)"]],
  ["/cuenta/direcciones", ["/account", "direcciones -> cuenta de Shopify (/account/addresses no verificado)"]],
  ["/cuenta/iniciar-sesion", ["/account/login", "login -> login de Shopify"]],
  ["/cuenta/registro", ["/account/register", "registro -> registro legacy de Shopify (03B: GET /account/register -> login de New Customer Accounts)"]],
  ["/cuenta/recuperar-contrasena", ["/account/login", "sin contraseñas en New Customer Accounts"]],
  ["/cuenta/restablecer-contrasena", ["/account/login", "sin contraseñas en New Customer Accounts"]],
  ["/cuenta/verificar-email", ["/account/login", "la verificación ocurre con el código de login"]],
]);
const CONDITIONAL = new Map([
  ["/favoritos", "activar con la plantilla page.wishlist asignada a la página (se asigna al publicar; 03B)"],
  ["/cuenta/favoritos", "idem /favoritos"],
]);

// ---------------------------------------------------------------- Validación
function validateRedirects(csvText, ctx) {
  const errors = [];
  const warnings = [];
  const E = (code, msg) => errors.push({ code, msg });
  const W = (code, msg) => warnings.push({ code, msg });
  const rows = parseCSV(csvText);
  if (!rows.length) {
    E("HEADER", "CSV vacío");
    return { errors, warnings, pairs: [] };
  }
  const [head, ...body] = rows;
  if (head.length !== 2 || head[0] !== "Redirect from" || head[1] !== "Redirect to") {
    E("HEADER", `encabezado "${head.join(",")}" != "Redirect from,Redirect to"`);
  }
  const pairs = [];
  body.forEach((r, i) => {
    const line = i + 2;
    if (r.length !== 2) {
      E("COLUMNS", `línea ${line}: ${r.length} columnas`);
      return;
    }
    const [from, to] = r.map((s) => s);
    pairs.push({ line, from, to });
  });

  const fromIndex = new Map(); // norm(from) -> line
  for (const { line, from, to } of pairs) {
    // --- formato del origen
    if (/^\s|\s$/.test(from) || /^\s|\s$/.test(to)) E("WHITESPACE", `línea ${line}: espacios al borde`);
    if (/:\/\//.test(from) || !from.startsWith("/")) E("FROM_FORMAT", `línea ${line}: origen "${from}" no es una ruta relativa`);
    if (/[?#]/.test(from)) E("FROM_QUERY", `línea ${line}: origen "${from}" con query/fragmento (Shopify no lo garantiza)`);
    if (from.length > 1 && from.endsWith("/")) E("FROM_FORMAT", `línea ${line}: origen con barra final`);
    if (from.startsWith("/") && !/[?#]/.test(from) && !SAFE_PATH.test(from)) E("FROM_CHARS", `línea ${line}: origen "${from}" con caracteres no seguros para URL`);
    if (to.startsWith("/") && !SAFE_PATH.test(to.split(/[?#]/)[0])) E("TO_CHARS", `línea ${line}: destino "${to}" con caracteres no seguros para URL`);
    if (/[?#]/.test(to)) W("TO_QUERY", `línea ${line}: destino "${to}" con query/fragmento; preferir la ruta limpia`);
    const nf = norm(from);
    if (SHOPIFY_FIXED_PATHS.includes(nf) || SHOPIFY_RESERVED_PREFIXES.some((p) => underPrefix(nf, p))) {
      E("FROM_RESERVED", `línea ${line}: "${from}" es ruta reservada/fija de Shopify`);
    } else if (nf === "/" || SHOPIFY_SERVED_PREFIXES.some((p) => underPrefix(nf, p.replace(/\/$/, ""))) || ctx.allow.has(nf)) {
      E("FROM_SERVED_BY_SHOPIFY", `línea ${line}: "${from}" la sirve Shopify (el redirect nunca dispararía)`);
    }
    if (ctx.knownOld && !ctx.knownOld.has(nf)) E("FROM_UNKNOWN", `línea ${line}: "${from}" no está en inventario/paridad/app`);
    if (/[A-Z]/.test(from)) W("FROM_UPPERCASE", `línea ${line}: "${from}" conserva mayúsculas del origen real; verificar en vivo`);

    // --- formato del destino
    if (/:\/\//.test(to) || !to.startsWith("/")) E("TO_FORMAT", `línea ${line}: destino "${to}" no es ruta relativa`);
    if (/[A-Z]/.test(to.split("?")[0])) E("TO_UPPERCASE", `línea ${line}: destino "${to}" con mayúsculas (handles de Shopify en minúsculas)`);
    const nt = norm(to);
    if (PENDING_DESTINATIONS.includes(nt)) E("TO_PENDING", `línea ${line}: destino "${to}" todavía no existe (pendiente)`);
    else if (!ctx.allow.has(nt)) E("TO_NOT_ALLOWLISTED", `línea ${line}: destino "${to}" fuera de la allowlist de la Dev Store`);

    // --- auto-redirect y duplicados
    if (nf === nt) E("SELF", `línea ${line}: "${from}" -> sí misma`);
    if (fromIndex.has(nf)) E("DUPLICATE", `línea ${line}: origen "${from}" repetido (línea ${fromIndex.get(nf)})`);
    else fromIndex.set(nf, line);

    // --- relación declarada (no contenido ajeno)
    if (ctx.relation) {
      const rel = ctx.relation(nf, nt);
      if (rel !== true) E("UNRELATED_OR_UNDECLARED", `línea ${line}: ${from} -> ${to}: ${rel}`);
    }
    if (CONDITIONAL.has(nf)) W("CONDITIONAL", `línea ${line}: ${from}: ${CONDITIONAL.get(nf)}`);
    if (nt === "/account" || nt.startsWith("/account/")) W("PLATFORM_HOP", `línea ${line}: ${to} redirige a su vez al dominio de cuentas de Shopify (salto de plataforma, no del CSV)`);
  }

  // --- cadenas y loops
  const graph = new Map(pairs.map((p) => [norm(p.from), norm(p.to)]));
  for (const { line, from, to } of pairs) {
    if (graph.has(norm(to)) && norm(to) !== norm(from)) E("CHAIN", `línea ${line}: ${from} -> ${to} -> ${graph.get(norm(to))}`);
  }
  for (const start of graph.keys()) {
    const seen = new Set([start]);
    let cur = graph.get(start);
    while (cur !== undefined && graph.has(cur)) {
      if (seen.has(cur)) {
        E("LOOP", `ciclo que pasa por ${start}`);
        break;
      }
      seen.add(cur);
      cur = graph.get(cur);
    }
  }
  return { errors, warnings, pairs };
}

// ---------------------------------------------------------------- Clasificación
const CLASSES = [
  "exact preserved",
  "Shopify normalized",
  "redirect needed (in CSV)",
  "intentionally not migrated",
  "legal redirect pending",
  "no redirect needed",
];
const RULES = {
  "exact preserved": new Map([["/", "misma ruta raíz en Shopify"]]),
  "Shopify normalized": new Map([
    ["/search", "ruta heredada de la plantilla Vercel (lib/shopify sin configurar); Shopify sirve /search nativo en la misma ruta"],
    ["/checkout", "Shopify reserva y sirve /checkout (checkout nativo). El sitio viejo lo tenía en Disallow (app/robots.ts:28)"],
    ["/robots.txt", "Shopify genera robots.txt (robots.txt.liquid opcional)"],
    ["/sitemap.xml", "Shopify genera sitemap.xml (productos, colecciones, páginas, blogs; con hreflang)"],
  ]),
  "legal redirect pending": new Map([
    ["/envios", "destino (página/política de envío) no creado: owner-only 03D; además depende de la tarifa gratis"],
    ["/terminos", "destino (Términos del servicio) no creado: owner-only 03D"],
    ["/privacidad", "página propia no creada (owner-only; revisión humana de proveedores). Existe la política automática de Shopify, con otro texto"],
    ["/cookies", "página no creada: owner-only 03D; el botón de preferencias no existe en Shopify"],
  ]),
  "intentionally not migrated": new Map([
    ["/accesorios", "colección no migrada (0 productos; REQUIRES_DECISION), pero SÍ está en el sitemap actual (app/sitemap.ts:31). Sin destino relacionado: 404 hasta decidir con Search Console"],
    ["/hombre", "colección archivada (0 productos; fuera del sitemap). Sin destino relacionado"],
    ["/mujer", "colección archivada (0 productos; fuera del sitemap). Sin destino relacionado"],
    ["/ninos", "colección archivada (0 productos; fuera del sitemap). Sin destino relacionado"],
    ["/calzado", "colección archivada (0 productos; fuera del sitemap). Sin destino relacionado"],
    ["/blog/<slug>", "3 posts reales (slugs solo en la base; NOT_AVAILABLE en el repo). Blog no migrado: sin destino"],
    ["/blog/[slug]", "idem /blog/<slug> (plantilla de ruta)"],
    ["/blog", "índice del blog (en el sitemap actual). Blog no migrado: sin destino"],
    ["/interno/activar", "herramienta interna de tráfico propio (noindex). Sin equivalente en Shopify"],
    ["/interno/desactivar", "herramienta interna de tráfico propio (noindex). Sin equivalente en Shopify"],
    ["/checkout/confirmacion/[orderId]", "confirmación de pedido del sitio viejo (noindex). La reemplaza la página de estado de pedido de Shopify, con otra URL por pedido"],
    ["/checkout/wompi/retorno", "retorno de pago Wompi del sitio viejo (noindex). Riesgo operativo del cutover (pagos en curso), no de SEO"],
  ]),
  "no redirect needed": new Map([
    ["/[page]", "catch-all heredado de la plantilla Vercel: 404 hoy (lib/shopify sin configurar)"],
    ["/product/[handle]", "ruta heredada de la plantilla Vercel: 404 hoy (getProduct devuelve undefined)"],
    ["/search/[collection]", "ruta heredada de la plantilla Vercel; sin datos hoy; fuera del sitemap"],
    ["/opengraph-image", "imagen OG generada por Next; Shopify usa page_image/settings"],
    ["/icon.png", "ícono generado por Next; Shopify usa settings.favicon"],
    ["/apple-icon.png", "ícono generado por Next; Shopify usa settings.favicon"],
    ["/favicon.ico", "favicon de Next; Shopify usa settings.favicon"],
  ]),
};
const GROUPS = [
  { prefix: "/admin", cls: "intentionally not migrated", why: "panel propio; lo reemplaza el Admin de Shopify. No se redirige ni se lista (criterio BAJA-06)" },
  { prefix: "/api", cls: "intentionally not migrated", why: "endpoints (cron, webhooks, revalidate). Nunca redirigir un webhook" },
  { prefix: "/logo", cls: "no redirect needed", why: "archivos estáticos de logo (radaelli-swimwear.png es el logo del JSON-LD viejo, lib/seo/site.ts:13); en Shopify el logo sale del CDN" },
  { prefix: "/images", cls: "no redirect needed", why: "archivos estáticos de ejemplo; las fotos reales vienen de Cloudinary" },
];

function classify(entries, csvFroms) {
  const out = [];
  for (const e of entries) {
    const n = norm(e.path);
    const hits = [];
    if (csvFroms.has(n)) hits.push(["redirect needed (in CSV)", `-> ${csvFroms.get(n)}`]);
    for (const cls of Object.keys(RULES)) {
      const m = RULES[cls];
      for (const [k, why] of m) if (norm(k) === n) hits.push([cls, why]);
    }
    for (const g of GROUPS) if (underPrefix(n, g.prefix)) hits.push([g.cls, g.why]);
    out.push({ ...e, hits });
  }
  return out;
}

// ---------------------------------------------------------------- Main
function main() {
  const log = [];
  const allow = buildAllowlist(log);
  const inventory = readObjects("seo/current-url-inventory.csv");
  const parity = readObjects("catalog/shopify-url-parity.csv");
  const mapping = readObjects("catalog/shopify-handle-mapping.csv");
  const slugToHandle = new Map(mapping.map((r) => [norm(`/producto/${r.source_handle}`), r.shopify_handle]));
  const collectionsKept = new Set(
    parity.filter((r) => /^EXISTS/.test(r.status) && r.shopify_url.startsWith("/collections/")).map((r) => r.shopify_url.slice("/collections/".length)),
  );

  // Universo de URLs viejas
  const invEntries = inventory.map((r) => ({ path: pathOf(r.current_url), source: "inventario", type: r.entity_type }));
  const invSet = new Set(invEntries.map((e) => norm(e.path)));
  const parityExtras = parity
    .map((r) => ({ path: pathOf(r.source_url), source: "paridad 03C", type: "extra" }))
    .filter((e) => !invSet.has(norm(e.path)));
  const covered = new Set([...invSet, ...parityExtras.map((e) => norm(e.path)), "/producto/[slug]", "/blog/[slug]"]);
  const appRoutes = scanAppRoutes();
  const appExtras = appRoutes
    .filter((r) => !covered.has(norm(r.path)))
    .map((r) => ({ path: r.path, source: r.kind === "public-asset" ? "public/" : "app/", type: r.kind }));
  const knownOld = new Set([...covered, ...appRoutes.map((r) => norm(r.path))]);

  const relation = (nf, nt) => {
    if (slugToHandle.has(nf)) {
      const h = slugToHandle.get(nf);
      if (nt !== `/products/${h}`) return `el handle mapeado es /products/${h}`;
      if (h !== nf.slice("/producto/".length)) return `handle distinto del slug (revisar a mano)`;
      return true;
    }
    const col = nf.slice(1);
    if (collectionsKept.has(col)) return nt === `/collections/${col}` ? true : `la colección conservada es /collections/${col}`;
    if (DECLARED.has(nf)) return DECLARED.get(nf)[0] === nt ? true : `el destino declarado es ${DECLARED.get(nf)[0]}`;
    return "origen sin familia ni destino declarado";
  };

  const csvText = fs.readFileSync(path.join(SEO_DIR, "shopify-redirects-import.csv"), "utf8");
  const raw = fs.readFileSync(path.join(SEO_DIR, "shopify-redirects-import.csv"));
  const { errors, warnings, pairs } = validateRedirects(csvText, { allow, knownOld, relation });
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) warnings.push({ code: "BOM", msg: "el CSV tiene BOM (la plantilla oficial no)" });

  // Cobertura: todo producto del mapeo y toda colección conservada tiene fila
  const csvFroms = new Map(pairs.map((p) => [norm(p.from), p.to]));
  for (const k of slugToHandle.keys()) if (!csvFroms.has(k)) errors.push({ code: "COVERAGE_MISSING", msg: `falta fila para ${k}` });
  for (const c of collectionsKept) if (!csvFroms.has(`/${c}`)) errors.push({ code: "COVERAGE_MISSING", msg: `falta fila para /${c}` });

  // Clasificación: exactamente una clase por URL
  const all = [...invEntries, ...parityExtras, ...appExtras];
  const classified = classify(all, csvFroms);
  for (const c of classified) {
    if (c.hits.length === 0) errors.push({ code: "UNCLASSIFIED", msg: `${c.path} (${c.source})` });
    if (c.hits.length > 1) errors.push({ code: "CLASS_OVERLAP", msg: `${c.path}: ${c.hits.map((h) => h[0]).join(" + ")}` });
  }

  // ------------------------------------------------ salida
  const pr = (s = "") => process.stdout.write(s + "\n");
  pr(`validate-redirects.mjs -- ${new Date().toISOString().slice(0, 10)}`);
  const appLabel = APP === MAIN_CHECKOUT ? "checkout principal (commerce-main/)" : APP === WORKTREE_ROOT ? "worktree" : "APP_DIR";
  pr(`APP (rutas Next.js): ${appLabel}, ${appRoutes.length} rutas/archivos escaneados  |  MIG: shopify-migration/`);
  pr(`CSV: seo/shopify-redirects-import.csv  filas=${pairs.length}  encabezado="${parseCSV(csvText)[0].join(",")}"  BOM=${raw[0] === 0xef ? "sí" : "no"}  fin de línea=${csvText.includes("\r\n") ? "CRLF" : "LF"}`);
  pr(`Allowlist de destinos existentes: ${allow.size} rutas`);
  const byKind = {};
  for (const p of allow.keys()) {
    const k = p.startsWith("/products/") ? "/products/*" : p.startsWith("/collections/") ? "/collections/*" : p;
    byKind[k] = (byKind[k] || 0) + 1;
  }
  pr("  " + Object.entries(byKind).map(([k, v]) => (v > 1 ? `${k} x${v}` : k)).join(", "));
  for (const l of log) pr("  " + l);
  pr();
  const checks = [
    ["Encabezado exacto de Shopify", ["HEADER", "COLUMNS"]],
    ["Rutas relativas, sin query ni espacios", ["FROM_FORMAT", "FROM_QUERY", "FROM_CHARS", "TO_FORMAT", "TO_CHARS", "WHITESPACE"]],
    ["Origen no reservado ni servido por Shopify", ["FROM_RESERVED", "FROM_SERVED_BY_SHOPIFY"]],
    ["Origen conocido (inventario/paridad/app)", ["FROM_UNKNOWN"]],
    ["Destino en minúsculas", ["TO_UPPERCASE"]],
    ["Destino existe hoy (allowlist)", ["TO_NOT_ALLOWLISTED"]],
    ["Destino no es legal pendiente", ["TO_PENDING"]],
    ["Sin auto-redirects", ["SELF"]],
    ["Sin duplicados (incl. mayúsculas)", ["DUPLICATE"]],
    ["Sin cadenas", ["CHAIN"]],
    ["Sin loops", ["LOOP"]],
    ["Relación origen/destino declarada", ["UNRELATED_OR_UNDECLARED"]],
    ["Cobertura productos (29) y colecciones", ["COVERAGE_MISSING"]],
    ["Cada URL en exactamente 1 clase", ["UNCLASSIFIED", "CLASS_OVERLAP"]],
  ];
  pr("CONTROLES");
  for (const [label, codes] of checks) {
    const n = errors.filter((e) => codes.includes(e.code)).length;
    pr(`  [${n ? "FAIL" : "PASS"}] ${label}${n ? ` (${n})` : ""}`);
  }
  for (const e of errors) pr(`  ERROR ${e.code}: ${e.msg}`);
  const wc = {};
  for (const w of warnings) wc[w.code] = (wc[w.code] || 0) + 1;
  pr(`  Avisos: ${Object.entries(wc).map(([k, v]) => `${k}=${v}`).join(", ") || "0"}`);
  for (const w of warnings.filter((x) => x.code !== "PLATFORM_HOP")) pr(`    ${w.code}: ${w.msg}`);
  pr();

  pr("CLASIFICACIÓN (cada URL en exactamente una clase)");
  const sources = ["inventario", "paridad 03C", "app/", "public/"];
  const table = {};
  for (const c of classified) {
    const cls = c.hits[0]?.[0] ?? "UNCLASSIFIED";
    table[cls] ??= Object.fromEntries(sources.map((s) => [s, 0]));
    table[cls][c.source]++;
  }
  pr(`  ${"clase".padEnd(28)} ${sources.map((s) => s.padStart(11)).join(" ")}  total`);
  const totals = Object.fromEntries(sources.map((s) => [s, 0]));
  for (const cls of [...CLASSES, "UNCLASSIFIED"]) {
    if (!table[cls]) continue;
    const row = table[cls];
    const t = sources.reduce((a, s) => a + row[s], 0);
    sources.forEach((s) => (totals[s] += row[s]));
    pr(`  ${cls.padEnd(28)} ${sources.map((s) => String(row[s]).padStart(11)).join(" ")}  ${t}`);
  }
  pr(`  ${"TOTAL".padEnd(28)} ${sources.map((s) => String(totals[s]).padStart(11)).join(" ")}  ${classified.length}`);
  pr();

  if (ARGS.has("--list")) {
    pr("| # | URL vieja (ruta) | Origen | Clase | Destino / motivo |");
    pr("|---|---|---|---|---|");
    classified.forEach((c, i) => {
      const [cls, why] = c.hits[0] ?? ["UNCLASSIFIED", ""];
      pr(`| ${i + 1} | \`${c.path}\` | ${c.source} | ${cls} | ${why.replace(/\|/g, "\\|")} |`);
    });
    pr();
  }

  const ok = errors.length === 0;
  pr(`RESULTADO: ${ok ? "PASS" : "FAIL"} -- ${errors.length} errores, ${warnings.length} avisos, ${pairs.length} redirects, ${classified.length} URLs clasificadas`);
  return ok;
}

// ---------------------------------------------------------------- Self-test (casos negativos)
function selfTest() {
  const allow = new Map([["/", "t"], ["/search", "t"], ["/products/bikini-foam", "t"], ["/collections/aurora-viva", "t"]]);
  const H = "Redirect from,Redirect to\n";
  const cases = [
    ["loop", H + "/p,/q\n/q,/p\n", "LOOP"],
    ["cadena", H + "/p,/q\n/q,/search\n", "CHAIN"],
    ["duplicado por mayúsculas", H + "/x,/search\n/X,/search\n", "DUPLICATE"],
    ["auto-redirect", H + "/p,/p\n", "SELF"],
    ["destino inexistente", H + "/hombre,/collections/hombre-nuevo\n", "TO_NOT_ALLOWLISTED"],
    ["destino legal pendiente", H + "/envios,/pages/envios\n", "TO_PENDING"],
    ["destino en mayúsculas", H + "/producto/X,/products/BIKINI-FOAM\n", "TO_UPPERCASE"],
    ["origen con dominio", H + "https://radaelliswimwear.com/x,/search\n", "FROM_FORMAT"],
    ["origen con query", H + "/buscar?q=a,/search\n", "FROM_QUERY"],
    ["origen reservado", H + "/cart/x,/search\n", "FROM_RESERVED"],
    ["origen reservado /a/", H + "/a/x,/search\n", "FROM_RESERVED"],
    ["origen con espacio", H + "/logo/mi logo.png,/search\n", "FROM_CHARS"],
    ["origen servido por Shopify", H + "/collections/aurora-viva,/search\n", "FROM_SERVED_BY_SHOPIFY"],
    ["encabezado distinto", "Redirect from,Redirect To\n/p,/search\n", "HEADER"],
    ["origen desconocido", H + "/no-existe,/search\n", "FROM_UNKNOWN"],
    ["relación no declarada", H + "/hombre,/\n", "UNRELATED_OR_UNDECLARED"],
  ];
  const knownOld = new Set([
    "/p", "/q", "/x", "/hombre", "/envios", "/producto/x", "/buscar", "/cart/x", "/collections/aurora-viva", "/a/x", "/logo/mi logo.png",
  ]);
  const relation = (nf) => (nf === "/hombre" ? "sin destino declarado" : true);
  let detected = 0;
  for (const [name, csv, code] of cases) {
    const { errors } = validateRedirects(csv, { allow, knownOld, relation });
    const hit = errors.some((e) => e.code === code);
    detected += hit ? 1 : 0;
    process.stdout.write(`  [${hit ? "DETECTADO" : "NO DETECTADO"}] ${name} -> ${code}\n`);
  }
  // Control positivo: un CSV válido no debe dar errores.
  const clean = validateRedirects(H + "/x,/search\n", { allow, knownOld, relation });
  process.stdout.write(`  [${clean.errors.length === 0 ? "OK" : "FALLA"}] control positivo sin errores\n`);
  const ok = detected === cases.length && clean.errors.length === 0;
  process.stdout.write(`SELF-TEST: ${detected}/${cases.length} casos negativos detectados; control positivo ${clean.errors.length === 0 ? "limpio" : "con errores"} -> ${ok ? "PASS" : "FAIL"}\n`);
  return ok;
}

const ok = ARGS.has("--self-test") ? selfTest() : main();
process.exitCode = ok ? 0 : 1;
