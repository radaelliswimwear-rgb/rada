// 03G - verificador del checklist de aceptacion de lanzamiento.
// DETERMINISTA y OFFLINE: lee launch/03G-launch-acceptance-checklist.md, los documentos y la evidencia del repo,
// y recalcula los hashes del release. No hay red, no hay reloj, no hay git y no se escribe ningun archivo.
// Uso:  node launch/tools/03g-check-acceptance-checklist.mjs
// Sale con codigo 1 si falla algun control.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, "..", "..");
const rel = (...p) => path.join(MIG, ...p);
const read = (...p) => fs.readFileSync(rel(...p), "utf8");
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

const DOC_REL = "launch/03G-launch-acceptance-checklist.md";
const text = read(DOC_REL);
const lines = text.split("\n");

const RC18_SHA = "e893b386f1022b7aaa618c86b07eeb5d23f43f2e89c6ddc493f7c5a485fd9e67";
const APP_SHA = "19c8c0df68a30533b6e3b953729d525afd784a4518e2dbb6691bc8ddc919e4b2";
const CSV_SHA_PREFIX = "ba3694678062c1f9";
const STATES = ["PASS", "BLOCKED", "PENDING OWNER", "NOT YET EXECUTED"];
const DOC_TIME = { h: 18, m: 33 };

const results = [];
function check(id, ok, detail) {
  results.push({ id, ok, detail });
}
const uniq = (arr) => [...new Set(arr)];
const idNum = (id) => Number(id.slice(3));
const pad2 = (n) => String(n).padStart(2, "0");

// ---------------------------------------------------------------- 1. filas de gates
const rows = [];
lines.forEach((l, i) => {
  const m = l.match(/^\| \*\*(AC-\d\d)\*\* \|/);
  if (m) rows.push({ id: m[1], line: i + 1, raw: l });
});
const expectedIds = Array.from({ length: 35 }, (_, i) => `AC-${pad2(i + 1)}`);
check(
  "C01 gates AC-01..AC-35 presentes, unicos y en orden",
  rows.length === 35 && rows.every((r, i) => r.id === expectedIds[i]),
  `filas: ${rows.length}`
);

const gates = [];
const badCells = [];
for (const r of rows) {
  const cells = r.raw.split("|");
  if (cells.length !== 10) {
    badCells.push(`${r.id} (${cells.length - 2} celdas)`);
    continue;
  }
  const [, id, name, crit, how, who, dep, evid, state] = cells.map((c) => c.trim());
  gates.push({
    id: r.id,
    name: name,
    crit,
    how,
    who,
    dep,
    evid,
    state: state.replace(/\*/g, "").trim(),
  });
}
check("C02 cada fila tiene exactamente 8 columnas", badCells.length === 0 && gates.length === 35, badCells.length ? badCells.join(", ") : "8 columnas x 35 filas");

const badState = gates.filter((g) => !STATES.includes(g.state)).map((g) => `${g.id}:"${g.state}"`);
check("C03 cada gate tiene exactamente uno de los cuatro estados", badState.length === 0, badState.length ? badState.join(", ") : "35 estados validos");

const empty = [];
for (const g of gates) {
  for (const k of ["name", "crit", "how", "who", "dep", "evid"]) if (!g[k]) empty.push(`${g.id}.${k}`);
}
check("C04 ninguna celda de gate esta vacia", empty.length === 0, empty.length ? empty.join(", ") : "sin celdas vacias");

// gates pedidos frente a anadidos
const requiredByName = {
  "AC-01": "Checkout en Colombia",
  "AC-02": "Moneda COP",
  "AC-03": "Envíos",
  "AC-04": "Wompi: prueba de éxito",
  "AC-05": "Wompi: prueba de fallo",
  "AC-06": "pendiente",
  "AC-07": "Creación de pedido",
  "AC-08": "Correo de confirmación",
  "AC-11": "Catálogo",
  "AC-13": "imágenes rotas",
  "AC-14": "Redirecciones",
  "AC-15": "Legales",
  "AC-17": "Login",
  "AC-18": "Favoritos de invitada",
  "AC-19": "Sincronización de favoritos",
  "AC-20": "Filtros",
  "AC-21": "Búsqueda",
  "AC-22": "Móvil",
  "AC-23": "Accesibilidad",
  "AC-24": "Rendimiento",
  "AC-25": "JS fatal",
  "AC-26": "Liquid fatal",
  "AC-27": "Hash exacto",
  "AC-28": "Rollback",
  "AC-34": "Analítica",
};
const addedIds = ["AC-09", "AC-10", "AC-12", "AC-16", "AC-29", "AC-30", "AC-31", "AC-32", "AC-33", "AC-35"];
const missingReq = Object.entries(requiredByName)
  .filter(([id, kw]) => !(gates.find((g) => g.id === id)?.name || "").includes(kw))
  .map(([id]) => id);
check("C05 los 25 gates pedidos estan presentes por nombre", missingReq.length === 0, missingReq.length ? `faltan: ${missingReq.join(", ")}` : "25 de 25");
const marked = gates.filter((g) => g.name.includes("(añadido)")).map((g) => g.id);
check(
  "C06 exactamente los 10 gates anadidos llevan la marca '(añadido)'",
  JSON.stringify(marked) === JSON.stringify(addedIds) && Object.keys(requiredByName).length === 25,
  `marcados: ${marked.join(", ")}`
);

// ---------------------------------------------------------------- 2. coherencia de cada estado
const LABELS = ["[MEDIDO-03G]", "[DOC:", "[INFERIDO]", "[NOT_VERIFIED]", "NOT_MEASURED", "NOT_AVAILABLE"];
const noLabel = gates.filter((g) => !LABELS.some((L) => g.evid.includes(L))).map((g) => g.id);
check("C07 toda evidencia lleva al menos una etiqueta", noLabel.length === 0, noLabel.length ? noLabel.join(", ") : "35 de 35");

const passNoMeasured = gates.filter((g) => g.state === "PASS" && !g.evid.includes("[MEDIDO-03G]")).map((g) => g.id);
check("C08 todo PASS tiene evidencia [MEDIDO-03G]", passNoMeasured.length === 0, passNoMeasured.length ? passNoMeasured.join(", ") : "PASS con evidencia medida");

const OWNER_DEP = /\b(A[2-5]|B[2-4]|C[1-5]|D\d+|D-CT\d+|D-L\d|PT\d)\b/;
const chain = /\b(A1|B1)\b/;
const incoherent = [];
for (const g of gates) {
  if (g.state === "BLOCKED" && !chain.test(g.dep)) incoherent.push(`${g.id}: BLOCKED sin A1 ni B1`);
  if (g.state === "PENDING OWNER" && !OWNER_DEP.test(g.dep)) incoherent.push(`${g.id}: PENDING OWNER sin entrega de la dueña`);
  if (g.state === "NOT YET EXECUTED" && chain.test(g.dep)) incoherent.push(`${g.id}: NOT YET EXECUTED con A1 o B1`);
}
check("C09 BLOCKED depende de A1 o B1; PENDING OWNER de una entrega de la dueña; NOT YET EXECUTED de ninguna de las dos cadenas", incoherent.length === 0, incoherent.length ? incoherent.join("; ") : "35 de 35 coherentes");

// ---------------------------------------------------------------- 3. resumen final
function section(startRe, endRe) {
  const s = lines.findIndex((l) => startRe.test(l));
  if (s < 0) return "";
  let e = lines.length;
  for (let j = s + 1; j < lines.length; j++) {
    if (endRe.test(lines[j])) {
      e = j;
      break;
    }
  }
  return lines.slice(s, e).join("\n");
}
const byState = Object.fromEntries(STATES.map((s) => [s, gates.filter((g) => g.state === s).map((g) => g.id)]));
const sum41 = section(/^### 4\.1 /, /^### 4\.2 /);
const summaryRows = {};
for (const l of sum41.split("\n")) {
  const m = l.match(/^\| `(PASS|BLOCKED|PENDING OWNER|NOT YET EXECUTED)` \| (\d+) \| ([^|]*) \|$/);
  if (m) summaryRows[m[1]] = { n: Number(m[2]), ids: m[3].split(",").map((s) => s.trim()) };
}
const mismatch41 = [];
for (const s of STATES) {
  const got = summaryRows[s];
  if (!got) mismatch41.push(`${s}: sin fila`);
  else if (got.n !== byState[s].length || JSON.stringify(got.ids) !== JSON.stringify(byState[s])) mismatch41.push(`${s}: tabla ${got.n} [${got.ids.join(",")}] frente a filas ${byState[s].length} [${byState[s].join(",")}]`);
}
const totalRow = sum41.match(/\| \*\*Total\*\* \| \*\*(\d+)\*\* \|/);
if (!totalRow || Number(totalRow[1]) !== 35) mismatch41.push("Total distinto de 35");
check("C10 el conteo por estado de § 4.1 coincide con las filas", mismatch41.length === 0, mismatch41.length ? mismatch41.join("; ") : STATES.map((s) => `${s}=${byState[s].length}`).join(", "));

const idsIn = (s) => uniq(s.match(/AC-\d\d/g) || []).sort();
const sec42 = section(/^### 4\.2 /, /^### 4\.3 /);
const sec43 = section(/^### 4\.3 /, /^### 4\.4 /);
const sec44 = section(/^### 4\.4 /, /^## 5\. /);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
check("C11 § 4.2 lista exactamente los gates BLOCKED", eq(idsIn(sec42), [...byState["BLOCKED"]].sort()), `4.2: ${idsIn(sec42).join(",")}`);
check("C12 § 4.3 lista exactamente los gates PENDING OWNER", eq(idsIn(sec43), [...byState["PENDING OWNER"]].sort()), `4.3: ${idsIn(sec43).length} ids`);
check("C13 § 4.4 lista exactamente los gates NOT YET EXECUTED", eq(idsIn(sec44), [...byState["NOT YET EXECUTED"]].sort()), `4.4: ${idsIn(sec44).join(",")}`);

const sec5 = section(/^## 5\. /, /^## 6\. /);
const mapIds = [];
for (const l of sec5.split("\n")) {
  const m = l.match(/^\| (AC-\d\d) \|/);
  if (m) mapIds.push(m[1]);
}
check("C14 el mapa de § 5 tiene una fila por gate", eq(mapIds, expectedIds), `filas: ${mapIds.length}`);

// tablas de gates: una por area
const headers = lines.filter((l) => l.startsWith("| ID | Gate | Criterio objetivo de aprobación |"));
check("C15 siete tablas de gates (areas A a G) con la misma cabecera", headers.length === 7 && headers.every((h) => h === headers[0]), `tablas: ${headers.length}`);

const acRefs = uniq(text.match(/AC-\d\d/g) || []);
const badAc = acRefs.filter((a) => idNum(a) < 1 || idNum(a) > 35);
check("C16 toda referencia AC-## esta entre AC-01 y AC-35", badAc.length === 0, badAc.length ? badAc.join(", ") : `${acRefs.length} ids distintos`);

// ---------------------------------------------------------------- 4. identificadores y referencias cruzadas
const sRefs = uniq([...text.matchAll(/\bS(\d\d)\b/g)].map((m) => Number(m[1])));
const badS = sRefs.filter((n) => n < 1 || n > 17);
check("C17 todo S## esta entre S01 y S17", badS.length === 0, badS.length ? `fuera de rango: ${badS.join(", ")}` : `${sRefs.length} pasos citados`);

const dRefs = uniq([...text.matchAll(/(?<![\w-])D(\d{1,3})(?![\w-])/g)].map((m) => Number(m[1])));
const badD = dRefs.filter((n) => n < 1 || n > 20);
check("C18 todo D# esta entre D1 y D20", badD.length === 0, badD.length ? `fuera de rango: D${badD.join(", D")}` : `${dRefs.length} decisiones citadas`);

const cutover = read("launch/03G-cutover-runbook.md");
const rollback = read("launch/03G-rollback-plan.md");
const monitoring = read("launch/03G-post-launch-monitoring.md");
const planTxt = read("launch/03G-commercial-store-migration-plan.md");

const ctDefined = new Set([...cutover.matchAll(/\| (CT-\d\d) \|/g)].map((m) => m[1]));
const ctCited = uniq(text.match(/CT-\d\d/g) || []);
const ctBad = ctCited.filter((c) => !ctDefined.has(c));
check("C19 todo CT-## citado existe en el runbook de corte", ctBad.length === 0, ctBad.length ? `sin definir: ${ctBad.join(", ")}` : `${ctCited.length} acciones citadas`);

const gCited = uniq([...text.matchAll(/\bG([1-9])\b/g)].map((m) => Number(m[1])));
const gBad = gCited.filter((n) => n > 8);
check("C20 las compuertas G1..G8 citadas existen", gBad.length === 0, `G${gCited.sort().join(", G")}`);

function existsIn(doc, re) {
  return re.test(doc);
}
const rpCited = uniq(text.match(/RP-\d\d/g) || []);
const rpBad = rpCited.filter((r) => !rollback.includes(r));
check("C21 todo RP-## citado existe en el plan de rollback", rpBad.length === 0, rpBad.length ? `sin definir: ${rpBad.join(", ")}` : `${rpCited.length} pasos citados`);

const otherBad = [];
for (const id of uniq(text.match(/\bMO-\d\d\b/g) || [])) if (!monitoring.includes(id)) otherBad.push(id);
for (const id of uniq(text.match(/\bLB-\d\d\b/g) || [])) if (!monitoring.includes(id)) otherBad.push(id);
for (const id of uniq(text.match(/\b(?:DR|SR)-\d\d\b/g) || [])) if (!rollback.includes(id)) otherBad.push(id);
for (const id of uniq(text.match(/\bPNR-\d\b/g) || [])) if (!rollback.includes(id)) otherBad.push(id);
for (const id of uniq(text.match(/\bD-CT\d+\b/g) || [])) if (!cutover.includes(id)) otherBad.push(id);
for (const id of uniq(text.match(/\bAB-\d\d\b/g) || [])) if (!cutover.includes(id)) otherBad.push(id);
for (const id of uniq(text.match(/\bPT\d\b/g) || [])) if (!planTxt.includes(`PT${id.slice(2)}`)) otherBad.push(id);
check("C22 MO, LB, DR, SR, PNR, D-CT, AB y PT citados existen en su documento", otherBad.length === 0, otherBad.length ? `sin definir: ${otherBad.join(", ")}` : "todos existen");

// rutas del repo citadas
const pathRe = /((?:launch|theme|payments|shipping|seo|analytics|content|dist|catalog|app|theme-src|scripts|source-of-truth|import|collections)\/[A-Za-z0-9_./-]+\.(?:md|json|jsonl|csv|mjs|zip|liquid|html|toml|txt))/g;
const paths = uniq([...text.matchAll(pathRe)].map((m) => m[1]));
const missingPaths = paths.filter((p) => !fs.existsSync(rel(p)));
check("C23 toda ruta del repo citada existe", missingPaths.length === 0, missingPaths.length ? `no existen: ${missingPaths.join(", ")}` : `${paths.length} rutas`);

// ---------------------------------------------------------------- 5. hechos que el documento afirma
const snap = JSON.parse(read("launch/03G-dev-store-snapshot.json"));
const facts = [];
const F = (name, ok) => facts.push({ name, ok });
F("catalogo 29/98/95, 29 publicados", snap.catalog.products === 29 && snap.catalog.variants === 98 && snap.catalog.images === 95 && snap.catalog.published === 29);
F("29 fichas con 200 y 29 corazones", snap.catalog.pdpStatus200 === 29 && snap.catalog.wishlistHeart === 29);
F("inventario no rastreado", /NO rastreado/.test(snap.catalog.inventoryTracking));
F("contrasena de la tienda activa", snap.onlineStore.passwordProtected === true);
F("47 redirecciones y 38 destinos con 200", snap.redirects.count === 47 && snap.redirects.destinations200Verified === 38);
F("idioma predeterminado del Admin en Ingles", /Inglés/.test(snap.locales.adminDefaultLanguage));
F("moneda COP", /COP/.test(snap.currency.displayed) && snap.currency.cartCurrencyObserved === "COP");
F("mercado principal y direccion en Estados Unidos", snap.markets.storeAddressCountry === "Estados Unidos" && /Estados Unidos/.test(snap.markets.storeDefaultMarket));
F("checkout en es-us", snap.markets.checkoutLocaleObserved === "es-us");
F("sin zona de Colombia", /NO existe zona de Colombia/.test(snap.shipping.zones));
F("tarifa bajo el umbral NOT_SET y cerrojo apagado", /NOT_SET/.test(snap.shipping.rates) && snap.themeFlags.free_shipping_rate_confirmed === false && snap.themeFlags.cart_free_shipping_progress === false);
F("umbral del theme 299900", snap.themeFlags.free_shipping_threshold_COP === 299900);
F("ningun proveedor de pago y Wompi no instalado", snap.payments.activeProviders === "ninguno" && snap.payments.wompi === "no instalado");
F("mensaje de pago del checkout", /no puede aceptar pagos/.test(snap.payments.checkoutMeasured));
F("login por codigo diferido a la dueña (A2)", /DEFERRED_OWNER_ONLY_BLOCKER/.test(snap.customerAccounts.loginByCodeTest));
F("favoritos de cuenta apagados y app sin instalar", snap.themeFlags.wishlist_account_sync === false && snap.wishlistApp.installed === false && snap.themeFlags.wishlist_enabled === true);
F("unica app instalada: Translate & Adapt", snap.apps.installed.length === 1 && /Translate & Adapt/.test(snap.apps.installed[0]));
F("pixel personalizado apagado", /APAGADO/.test(snap.themeFlags.customPixel));
F("privacidad autogenerada", /AUTOGENERADA/.test(snap.policiesObserved["/policies/privacy-policy"]));
F("terminos, envios y contacto con 404", snap.policiesObserved["/policies/terms-of-service"] === "404" && snap.policiesObserved["/policies/shipping-policy"] === "404");
F("busqueda: indice 29/29, bikini 20, mostaza 1", /29\/29/.test(snap.searchAndFilters.searchIndex) && /bikini' = 20/.test(snap.searchAndFilters.searchIndex) && /mostaza' = 1/.test(snap.searchAndFilters.searchIndex));
F("filtros nativos: solo Precio y 9 opciones de orden", /^Precio/.test(snap.searchAndFilters.nativeFilters) && snap.searchAndFilters.sortOptions === 9);
F("Search & Discovery no instalada", /no instalada/.test(snap.searchAndFilters.searchDiscoveryApp));
const horizon = snap.themes.find((t) => t.name === "Horizon");
const radaelli = snap.themes.find((t) => t.release === "radaelli-shopify-theme-rc1.8");
F("Horizon live y sin tocar", horizon && horizon.role === "live" && horizon.touched === false && horizon.id === 189072113983);
F("Radaelli RC1.8 sin publicar, 96 archivos, hash del snapshot", radaelli && radaelli.role === "unpublished" && radaelli.files === 96 && radaelli.zipSha256 === RC18_SHA && radaelli.id === 189072474431);
F("Theme Check 0/0 en el snapshot", radaelli && /0 errores \/ 0 warnings/.test(radaelli.themeCheck));

const routes = JSON.parse(read("launch/evidence/dev-routes.json")).routes;
const route = (p) => routes.find((r) => r.p === p);
F("/search y /search?q=bikini con noindex", /noindex/.test(route("/search").robots) && /noindex/.test(route("/search?q=bikini").robots) && route("/search?q=bikini").note === "20 resultados");
F("/search?q=mostaza con 1 resultado", /1 resultado/.test(route("/search?q=mostaza").note));
F("favoritos con noindex (simple y ?view=wishlist)", /noindex/.test(route("/pages/favoritos").robots) && /noindex/.test(route("/pages/favoritos?view=wishlist").robots));
F("404 con noindex", /noindex/.test(route("/404-xyz-parity").robots));
F("refund-policy 200; terminos y envios 404", route("/policies/refund-policy").s === 200 && route("/policies/terms-of-service").s === 404 && route("/policies/shipping-policy").s === 404);

const sweep = read("launch/03G-responsive-sweep.md");
F("barrido 136/136 sin defectos", /136\/136 combinaciones sin defectos/.test(sweep));
F("hallazgo H-01 (contraste de la tarjeta sin imagen)", /H-01/.test(sweep));
const audit = read("launch/03G-checkout-precondition-audit.md");
F("auditoria: 422 con CO y checkout es-us", /\*\*422\*\*/.test(audit) && /es-us/.test(audit));
F("auditoria: no se creo ningun pedido", /no se creó ningún pedido/.test(audit));

const psum = JSON.parse(read("launch/03G-product-parity.summary.json"));
F("paridad: 29/98/95 en Dev y 97 variantes en el sitio actual", psum.totales.productos_dev === 29 && psum.totales.variantes_dev === 98 && psum.totales.imagenes_dev === 95 && psum.totales.variantes_actual_payload === 97);
F("paridad: registro 13/15/1 y overall DIFFERENCE 29", psum.overall_registro_producto.RECONCILED === 13 && psum.overall_registro_producto.RECONCILED_WITH_INTENTIONAL_DIFFERENCE === 15 && psum.overall_registro_producto.DIFFERENCE === 1 && psum.overall.DIFFERENCE === 29);
F("paridad: miga 29/29, orden 0/29 e inventario 0/29", psum.campos.breadcrumb_match.SI === 29 && psum.campos.collection_order_match.NO === 29 && psum.campos.inventory_match.NO === 29);
F("paridad: tallas 28 SI y 1 NO", psum.campos.sizes_match.SI === 28 && psum.campos.sizes_match.NO === 1);
const rpar = read("launch/03G-route-parity.md");
F("rutas: 42 PASS_WITH_INTENTIONAL_CHANGE y 33 BLOCKED_BY_OWNER", /\| PASS_WITH_INTENTIONAL_CHANGE \| 42 \|/.test(rpar) && /\| BLOCKED_BY_OWNER \| 33 \|/.test(rpar));
const proxy = read("app/shopify.app.toml");
F("proxy real de favoritos: /apps/radaelli", /prefix = "apps"/.test(proxy) && /subpath = "radaelli"/.test(proxy));

const badFacts = facts.filter((f) => !f.ok).map((f) => f.name);
check("C24 hechos afirmados frente al snapshot y la evidencia", badFacts.length === 0, badFacts.length ? `no coinciden: ${badFacts.join("; ")}` : `${facts.length} hechos verificados`);

// ---------------------------------------------------------------- 6. hashes recalculados
const zipBuf = fs.readFileSync(rel("dist", "radaelli-shopify-theme-rc1.8.zip"));
const zipSha = sha256(zipBuf);
function zipEntries(buf) {
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) return buf.readUInt16LE(i + 10);
  return -1;
}
const entries = zipEntries(zipBuf);
const manifest = JSON.parse(read("dist/release-manifest-rc1.8.json"));
check("C25 SHA-256 del ZIP RC1.8 = e893b386…9e67, 173654 bytes y 96 entradas", zipSha === RC18_SHA && zipBuf.length === 173654 && entries === 96, `sha=${zipSha.slice(0, 8)}…${zipSha.slice(-4)} bytes=${zipBuf.length} entradas=${entries}`);
check("C26 el manifiesto RC1.8 declara el mismo hash y 96 archivos", manifest.zip.sha256 === RC18_SHA && manifest.totalFiles === 96 && manifest.files.length === 96 && manifest.themeCheck.source.includes("0 errors / 0 warnings"), `archivos=${manifest.files.length}`);

let same = 0;
const diffs = [];
for (const f of manifest.files) {
  const p = rel("theme-src", f.path);
  if (!fs.existsSync(p)) {
    diffs.push(`${f.path}: falta`);
    continue;
  }
  if (sha256(fs.readFileSync(p)) === f.sha256) same++;
  else diffs.push(`${f.path}: hash distinto`);
}
const dirs = ["assets", "config", "layout", "locales", "sections", "snippets", "templates"];
const onDisk = [];
function walk(dir, base) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base);
    else onDisk.push(path.relative(base, full).split(path.sep).join("/"));
  }
}
for (const d of dirs) if (fs.existsSync(rel("theme-src", d))) walk(rel("theme-src", d), rel("theme-src"));
const extra = onDisk.filter((p) => !manifest.files.some((f) => f.path === p));
check("C27 theme-src (7 directorios) coincide 96 de 96 con el manifiesto y no tiene archivos de mas", same === 96 && extra.length === 0 && onDisk.length === 96, `coinciden=${same} en_disco=${onDisk.length}${diffs.length ? " | " + diffs.join("; ") : ""}${extra.length ? " | extra: " + extra.join(", ") : ""}`);

const appSha = sha256(fs.readFileSync(rel("dist", "radaelli-wishlist-app-0.1.2.zip")));
check("C28 SHA-256 del ZIP de la app 0.1.2 = 19c8c0df…e4b2", appSha === APP_SHA, `sha=${appSha.slice(0, 8)}…${appSha.slice(-4)}`);

const csvBuf = fs.readFileSync(rel("seo", "shopify-redirects-import.csv"));
const csvRows = csvBuf.toString("utf8").split("\n").filter((l) => l.trim() !== "");
check("C29 el CSV de redirecciones tiene 47 filas de datos y el hash citado", csvRows.length - 1 === 47 && sha256(csvBuf).startsWith(CSV_SHA_PREFIX), `filas=${csvRows.length - 1} sha=${sha256(csvBuf).slice(0, 8)}…`);

// ---------------------------------------------------------------- 7. datos que no deben aparecer
const problems = [];
const email = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g);
if (email) problems.push(`correo: ${email.join(", ")}`);
if (/wa\.me|whatsapp\.com\/send|api\.whatsapp/i.test(text)) problems.push("enlace de WhatsApp");
const longDigits = uniq(text.match(/\b\d{10,}\b/g) || []).filter((d) => !["189072474431", "189072113983"].includes(d));
if (longDigits.length) problems.push(`numeros largos: ${longDigits.join(", ")}`);
if (/(?:\+?57[\s-]?)?\b3\d{2}[\s-]\d{3}[\s-]\d{4}\b/.test(text)) problems.push("posible telefono");
if (/shpat_|shpca_|shpss_|pub_(?:test|prod)_[A-Za-z0-9]{6,}|prv_(?:test|prod)_[A-Za-z0-9]{6,}|test_(?:events|integrity)_[A-Za-z0-9]{6,}|prod_(?:events|integrity)_[A-Za-z0-9]{6,}/.test(text)) problems.push("posible token o llave");
if (/checkouts\/cn\/(?!<token>)[A-Za-z0-9]/.test(text)) problems.push("URL de checkout con token");
const hex64 = uniq(text.match(/\b[0-9a-f]{64}\b/g) || []).filter((h) => h !== RC18_SHA && h !== APP_SHA);
if (hex64.length) problems.push(`SHA-256 no previstos: ${hex64.join(", ")}`);
const okHosts = ["radaelliswimwear.com", "www.radaelliswimwear.com", "<tienda>.myshopify.com", "radaelli-swimwear-dev.myshopify.com"];
const badUrls = uniq([...text.matchAll(/https?:\/\/([^\s/`)]+)/g)].map((m) => m[1])).filter((h) => !okHosts.includes(h));
if (badUrls.length) problems.push(`URLs no previstas: ${badUrls.join(", ")}`);
check("C30 sin correos, telefonos, tokens, llaves, URLs de checkout con token ni SHA-256 no previstos", problems.length === 0, problems.length ? problems.join(" | ") : "limpio");

const laterTimes = [];
for (const m of text.matchAll(/\b(\d{1,2}):(\d{2})\b/g)) {
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) continue;
  if (h > DOC_TIME.h || (h === DOC_TIME.h && mm > DOC_TIME.m)) laterTimes.push(m[0]);
}
check("C31 ninguna hora posterior a 18:33", laterTimes.length === 0, laterTimes.length ? `horas: ${uniq(laterTimes).join(", ")}` : "sin horas posteriores");
check("C32 la cabecera lleva la fecha y la hora de referencia", /\*\*Fecha:\*\* 2026-09-29, 18:33 \(Bogotá\)/.test(text), "18:33");

const headingsOk = ["## 0. ", "## 1. ", "## 2. ", "## 3. ", "## 4. ", "## 5. ", "## 6. ", "## 7. ", "## 8. "].every((h) => lines.some((l) => l.startsWith(h)));
check("C33 secciones 0 a 8 presentes", headingsOk, "0..8");

// ---------------------------------------------------------------- salida
const failed = results.filter((r) => !r.ok);
console.log("03G - verificador del checklist de aceptacion de lanzamiento");
console.log(`Documento: ${DOC_REL} (${lines.length} lineas)`);
console.log("");
for (const r of results) console.log(`${r.ok ? "OK   " : "FALLA"}  ${r.id}\n        ${r.detail}`);
console.log("");
console.log("Conteo por estado (recalculado desde las filas):");
for (const s of STATES) console.log(`  ${s.padEnd(17)} ${String(byState[s].length).padStart(2)}  ${byState[s].join(", ")}`);
console.log(`  ${"Total".padEnd(17)} ${String(gates.length).padStart(2)}`);
console.log("");
console.log("Hashes recalculados:");
console.log(`  radaelli-shopify-theme-rc1.8.zip   ${zipSha}`);
console.log(`  radaelli-wishlist-app-0.1.2.zip    ${appSha}`);
console.log(`  seo/shopify-redirects-import.csv   ${sha256(csvBuf)}`);
console.log("");
console.log(`Controles con FALLA: ${failed.length} de ${results.length}`);
console.log(failed.length === 0 ? "RESULTADO: OK" : "RESULTADO: FALLA");
process.exit(failed.length === 0 ? 0 : 1);
