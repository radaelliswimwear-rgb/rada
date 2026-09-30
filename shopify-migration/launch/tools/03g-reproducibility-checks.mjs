// 03G — comprobaciones de reproducibilidad (soporte de launch/03G-reproducibility-gap-audit.md).
// Uso: node launch/tools/03g-reproducibility-checks.mjs
// Determinista y sin red. Solo LEE el repo; las reconstrucciones se hacen en una carpeta
// temporal del sistema (se borra al terminar). No usa git, no toca ninguna tienda, no imprime rutas absolutas.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(here, "..", "..");
const SITE = path.resolve(MIG, "..", "..", "..", "..");
const rel = (p) => path.join(MIG, p);
const rd = (p) => fs.readFileSync(rel(p), "utf8");
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const exists = (p) => fs.existsSync(rel(p));
const out = [];
const say = (id, status, text) => out.push(`${id} | ${status} | ${text}`);

function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0] !== "");
  return { head, rows: body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""]))) };
}

function walk(dir, skip, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    const r = path.relative(MIG, full).split(path.sep).join("/");
    if (skip(r, e)) continue;
    if (e.isDirectory()) walk(full, skip, acc);
    else acc.push(r);
  }
  return acc;
}

function readZip(file) {
  const buf = fs.readFileSync(file);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("ZIP sin EOCD");
  const n = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let k = 0; k < n; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("directorio central inválido");
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nl);
    const lnl = buf.readUInt16LE(off + 26), lel = buf.readUInt16LE(off + 28);
    const data = buf.subarray(off + 30 + lnl + lel, off + 30 + lnl + lel + csize);
    entries.set(name, method === 8 ? zlib.inflateRawSync(data) : data);
    p += 46 + nl + el + cl;
  }
  return { entries, sha: sha(buf), bytes: buf.length };
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rada-repro-"));
try {
  // R01 — checksums.txt
  {
    const lines = rd("import/checksums.txt").trim().split("\n");
    const bad = [];
    for (const l of lines) {
      const [h, f] = l.split(/\s+/);
      if (!exists(f) || sha(fs.readFileSync(rel(f))) !== h) bad.push(f);
    }
    say("R01", bad.length ? "FAIL" : "PASS", `import/checksums.txt: ${lines.length - bad.length}/${lines.length} hashes coinciden${bad.length ? " (fallan: " + bad.join(", ") + ")" : ""}`);
    const covered = new Set(lines.map((l) => l.split(/\s+/)[1]));
    const notCovered = ["import/shopify-products-03c-images.csv", "import/image-resolution-fix.csv", "import/image-dimensions.csv", "seo/shopify-redirects-import.csv", "catalog/color-search-tag-map.csv", "collections/collections-master.csv"].filter((f) => !covered.has(f));
    say("R01", "INFO", `artefactos de importación sin hash en checksums.txt: ${notCovered.join(", ")}`);
  }

  // R02 — regenerar el CSV de productos en carpeta temporal y comparar bytes
  {
    fs.mkdirSync(path.join(tmp, "b", "scripts"), { recursive: true });
    for (const d of ["catalog", "images", "import"]) fs.mkdirSync(path.join(tmp, "b", d), { recursive: true });
    fs.copyFileSync(rel("scripts/build-shopify-product-csv.mjs"), path.join(tmp, "b/scripts/build-shopify-product-csv.mjs"));
    for (const f of ["catalog/products-master.csv", "catalog/variants-master.csv", "images/images-manifest.csv"]) fs.copyFileSync(rel(f), path.join(tmp, "b", f));
    execFileSync(process.execPath, [path.join(tmp, "b/scripts/build-shopify-product-csv.mjs")], { stdio: "pipe" });
    const same = (f) => sha(fs.readFileSync(path.join(tmp, "b", f))) === sha(fs.readFileSync(rel(f)));
    const files = ["import/shopify-products-03c.csv", "import/color-mapping.csv", "catalog/shopify-handle-mapping.csv", "import/checksums.txt"];
    say("R02", files.every(same) ? "PASS" : "FAIL", `build-shopify-product-csv.mjs regenerado desde 3 fuentes: ${files.map((f) => `${f}=${same(f) ? "idéntico" : "DISTINTO"}`).join("; ")}`);
  }

  // R02b — regenerar los maestros desde el scrape crudo
  {
    for (const d of ["scripts", "source-of-truth", "catalog", "images", "collections", "seo"]) fs.mkdirSync(path.join(tmp, "m", d), { recursive: true });
    fs.copyFileSync(rel("scripts/build-from-public-scrape.mjs"), path.join(tmp, "m/scripts/build-from-public-scrape.mjs"));
    fs.copyFileSync(rel("source-of-truth/public-scrape-raw.json"), path.join(tmp, "m/source-of-truth/public-scrape-raw.json"));
    execFileSync(process.execPath, [path.join(tmp, "m/scripts/build-from-public-scrape.mjs")], { stdio: "pipe" });
    const files = ["catalog/products-master.csv", "catalog/variants-master.csv", "images/images-manifest.csv", "collections/collections-master.csv", "seo/current-url-inventory.csv"];
    const res = files.map((f) => `${f}=${sha(fs.readFileSync(path.join(tmp, "m", f))) === sha(fs.readFileSync(rel(f))) ? "idéntico" : "DISTINTO"}`);
    say("R02", res.every((x) => x.endsWith("idéntico")) ? "PASS" : "GAP", `build-from-public-scrape.mjs regenerado solo desde public-scrape-raw.json: ${res.join("; ")}`);
    say("R02", "INFO", "nada en el repo genera public-scrape-raw.json (el rastreo GET de la Fase 01E no está scripteado; el de 03G, launch/tools/03g-crawl-current-site.mjs, guarda HTML en launch/evidence/current-site y no produce ese JSON)");
    // El mismo script escribe un 6.º archivo, source-of-truth/catalog-snapshot.json, con una marca de tiempo (_meta.generated_at).
    const snapA = fs.readFileSync(path.join(tmp, "m/source-of-truth/catalog-snapshot.json"), "utf8");
    const snapB = rd("source-of-truth/catalog-snapshot.json");
    const strip = (t) => { const j = JSON.parse(t); delete j._meta.generated_at; return JSON.stringify(j); };
    const bytesSame = sha(Buffer.from(snapA)) === sha(Buffer.from(snapB));
    const contentSame = strip(snapA) === strip(snapB);
    say("R02", bytesSame ? "PASS" : "GAP", `catalog-snapshot.json regenerado por build-from-public-scrape.mjs: bytes ${bytesSame ? "idénticos" : "DISTINTOS"}; contenido igual salvo _meta.generated_at: ${contentSame ? "SÍ" : "NO"} (el script escribe la hora de la corrida; catalog/Radaelli_Catalogo_Master.xlsx sale de este JSON y su reproducibilidad no se probó)`);
  }

  // R03 — forma del CSV de importación
  const main = parseCsv(rd("import/shopify-products-03c.csv"));
  {
    const rows = main.rows;
    const handles = new Set(rows.map((r) => r["URL handle"]));
    const variants = rows.filter((r) => r["SKU"]).length;
    const imgs = rows.filter((r) => r["Product image URL"]).length;
    const tags = rows.filter((r) => r["Tags"]).length;
    const perColl = {};
    for (const r of rows) if (r["Collection"]) perColl[r["Collection"]] = (perColl[r["Collection"]] || 0) + 1;
    const tracker = rows.filter((r) => r["Inventory tracker"]).length;
    say("R03", "INFO", `CSV: ${rows.length} filas, ${handles.size} handles, ${variants} variantes, ${imgs} imágenes, filas con Tags=${tags}, Inventory tracker con valor=${tracker}, membresía por columna Collection=${JSON.stringify(perColl)}; columnas=${main.head.length}`);
  }

  // R04 — Dev vs CSV (variantes y tags)
  {
    const dev = rd("launch/evidence/dev-products.jsonl").trim().split("\n").map((l) => JSON.parse(l));
    const devSkus = new Set(dev.flatMap((p) => p.vr.map((v) => v[1])));
    const csvSkus = new Set(main.rows.filter((r) => r["SKU"]).map((r) => r["SKU"]));
    const missing = [...csvSkus].filter((s) => !devSkus.has(s)).length;
    const extra = [...devSkus].filter((s) => !csvSkus.has(s)).length;
    const tagged = dev.filter((p) => p.tg && p.tg.length).map((p) => `${p.h}=[${p.tg.join(",")}]`);
    say("R04", missing || extra ? "FAIL" : "PASS", `SKU Dev=${devSkus.size} vs SKU CSV=${csvSkus.size}; en CSV y no en Dev=${missing}; en Dev y no en CSV=${extra}`);
    say("R04", tagged.length ? "GAP" : "PASS", `productos con tags en la Dev Store: ${tagged.join("; ") || "ninguno"}; el CSV trae Tags vacío en todas sus filas (el tag no se reproduce importando el CSV)`);
    const tm = parseCsv(rd("catalog/color-search-tag-map.csv")).rows.filter((r) => r.search_tag_needed === "SI").map((r) => `${r.handle}=${r.search_tag}`);
    say("R04", "INFO", `catalog/color-search-tag-map.csv marca como necesarios: ${tm.join("; ") || "ninguno"}`);
  }

  // R05 — imágenes: límite de Shopify y CSV de corrección
  {
    const dims = parseCsv(rd("import/image-dimensions.csv")).rows;
    const over = new Set(dims.filter((d) => d.within_shopify_limit === "NO").map((d) => d.url));
    const mainOver = main.rows.filter((r) => over.has(r["Product image URL"])).length;
    const fix = parseCsv(rd("import/image-resolution-fix.csv")).rows;
    const fixCut = fix.filter((r) => /c_limit/.test(r.imported_url)).length;
    const imgCsv = parseCsv(rd("import/shopify-products-03c-images.csv"));
    const imgCut = imgCsv.rows.filter((r) => /c_limit/.test(r["Product image URL"])).length;
    const imgHandles = new Set(imgCsv.rows.map((r) => r["URL handle"])).size;
    say("R05", "GAP", `imágenes fuera del límite en el CSV principal: ${mainOver} de ${main.rows.filter((r) => r["Product image URL"]).length} (Shopify las rechaza al importar); corrección en 2.º CSV: ${imgCut} URLs con c_limit en ${imgHandles} productos (${imgCsv.rows.length} filas); image-resolution-fix.csv: ${fix.length} filas (${fixCut} con c_limit); no existe un CSV único consolidado`);
    say("R05", "INFO", "build-shopify-image-fix-csv.mjs consulta la red (fetch a Cloudinary): no es reproducible offline; sus salidas están versionadas");
  }

  // R06 — dependencia externa de las imágenes/medios
  {
    const hosts = {};
    for (const r of main.rows) if (r["Product image URL"]) { const h = new URL(r["Product image URL"]).host; hosts[h] = (hosts[h] || 0) + 1; }
    const mm = parseCsv(rd("content/media/media-migration-manifest.csv")).rows;
    const mmCloud = mm.filter((r) => /^https:\/\/res\.cloudinary\.com/.test(r.source)).length;
    const bin = walk(MIG, (r, e) => (e.isDirectory() ? ["node_modules", ".git"].includes(e.name) || r === "launch/evidence" : false)).filter((f) => /\.(jpe?g|png|webp|gif|mp4|mov|svg|ico)$/i.test(f));
    say("R06", "GAP", `hosts de las URLs de imagen del CSV: ${JSON.stringify(hosts)}; medios del manifiesto en Cloudinary: ${mmCloud} de ${mm.length}; archivos de imagen/video dentro de shopify-migration/ (sin evidencia HTML): ${bin.length}`);
  }

  // R07 — colecciones
  {
    const dc = JSON.parse(rd("launch/evidence/dev-collections.json")).collections;
    const order = [];
    for (const r of main.rows) if (r["Collection"]) order.push([r["URL handle"], r["Collection"]]);
    const res = [];
    for (const c of dc) {
      const csvList = order.filter(([, t]) => t === c.t).map(([h]) => h.toLowerCase());
      const devList = c.order.map((x) => x.toLowerCase());
      const sameSet = JSON.stringify([...csvList].sort()) === JSON.stringify([...devList].sort());
      const rev = JSON.stringify([...csvList].reverse()) === JSON.stringify(devList);
      const mem = !csvList.length && devList.length ? "no está en la columna Collection del CSV" : sameSet ? "igual al CSV" : "distinta del CSV";
      const ord = !devList.length ? "n/a (vacía)" : !csvList.length ? "ver R07 siguiente línea" : rev ? "inverso del orden de filas del CSV" : "sin regla";
      res.push(`${c.h}: n=${devList.length}, membresía ${mem}, orden Dev: ${ord}`);
    }
    say("R07", "INFO", res.join(" | "));
    const audit = rd("theme/03D-missing-assets-audit.md");
    const sec = audit.slice(audit.indexOf("## 5. Detalle: destacados"), audit.indexOf("## 6. Detalle"));
    const seven = [];
    for (const l of sec.split("\n")) {
      const m = l.match(/^\| (Aurora Viva|Espuma de Ola|Oasis Natural) \| `([^`]+)` \| [^|]+ \| ([^|]+)\|/);
      if (m && /^S[ií]/.test(m[3].trim())) seven.push(m[2].toLowerCase());
    }
    const dest = dc.find((c) => c.h === "destacados").order;
    const sameSet = JSON.stringify([...seven].sort()) === JSON.stringify([...dest].sort());
    const sameOrder = JSON.stringify(seven) === JSON.stringify(dest);
    const csvOrder = order.map(([h]) => h.toLowerCase()).filter((h) => dest.includes(h));
    const sameCsv = JSON.stringify(csvOrder) === JSON.stringify(dest);
    const revCsv = JSON.stringify([...csvOrder].reverse()) === JSON.stringify(dest);
    say("R07", "GAP", `Destacados: la lista de 03D §5 tiene ${seven.length} handles marcados visibles; conjunto = Dev: ${sameSet ? "SÍ" : "NO"}; orden Dev = orden de la tabla de 03D: ${sameOrder ? "SÍ" : "NO"}; = orden de filas del CSV: ${sameCsv ? "SÍ" : "NO"}; = inverso del orden de filas del CSV: ${revCsv ? "SÍ" : "NO"}; no existe CSV ni script que cree la colección Destacados (se armó a mano en el Admin)`);
    const cm = parseCsv(rd("collections/collections-master.csv")).rows;
    say("R07", "INFO", `collections-master.csv: ${cm.length} filas (${cm.filter((r) => r.keep_remove === "KEEP").length} KEEP); filas de Destacados o Home page: ${cm.filter((r) => /destacados|home/i.test(r.current_category + r.slug)).length}; texto de descripción de colección en dev-collections.json: no (solo metaDescChars=${dc.filter((c) => c.metaDescChars).map((c) => c.h + ":" + c.metaDescChars).join(",")})`);
  }

  // R08 — metacampos y metaobjetos
  {
    const files = walk(MIG, (r, e) => (e.isDirectory() ? !(r === "theme-src" || r.startsWith("theme-src/")) : !r.startsWith("theme-src/"))).filter((f) => /\.(liquid|json|js)$/.test(f));
    const keys = new Set();
    for (const f of files) for (const m of rd(f).matchAll(/metafields\.custom\.([a-z_]+)/g)) keys.add(m[1]);
    const code = walk(MIG, (r, e) => (e.isDirectory() ? ["node_modules", ".git", "evidence", "dist", "launch"].includes(e.name) : false)).filter((f) => /\.(mjs|cjs|js|json|graphql|gql)$/.test(f) && !f.startsWith("theme-src/") && !f.startsWith("app/"));
    const hits = code.filter((f) => /metafieldDefinitionCreate|metaobjectDefinitionCreate/.test(rd(f)));
    say("R08", hits.length ? "PASS" : "GAP", `claves custom.* que lee el theme: ${[...keys].sort().join(", ")}; archivos con una definición ejecutable (GraphQL/JSON) de metacampos o metaobjetos: ${hits.length}`);
    const snap = JSON.parse(rd("launch/03G-dev-store-snapshot.json"));
    say("R08", "INFO", `snapshot 03G: ${snap.metafieldDefinitions.product.length} definiciones de producto + ${snap.metafieldDefinitions.collection.length} de colección + ${snap.metaobjectDefinitions.length} metaobjeto (solo nombre/tipo/uso; sin namespace.key, sin acceso Storefront, sin validaciones)`);
  }

  // R09 — menús
  {
    const fg = JSON.parse(rd("theme-src/sections/footer-group.json"));
    const footerMenus = Object.values(fg.sections).flatMap((s) => Object.values(s.blocks || {})).map((b) => b.settings && b.settings.menu).filter(Boolean);
    const hdr = [...rd("theme-src/sections/header.liquid").matchAll(/"default": "([a-z-]+-menu)"/g)].map((m) => m[1]);
    const snap = JSON.parse(rd("launch/03G-dev-store-snapshot.json"));
    const names = snap.menus.map((m) => `${m.name}(${m.items.length})`);
    const code = walk(MIG, (r, e) => (e.isDirectory() ? ["node_modules", ".git", "evidence", "dist", "theme-src", "launch"].includes(e.name) : false)).filter((f) => /\.(mjs|cjs|js)$/.test(f));
    const hits = code.filter((f) => /menuCreate|menuUpdate/.test(rd(f)));
    say("R09", hits.length ? "PASS" : "GAP", `menús que exige el theme: ${[...new Set([...footerMenus, ...hdr])].join(", ")}; menús en la Dev Store: ${names.join(", ")}; scripts que crean menús: ${hits.length}`);
  }

  // R10 — redirecciones
  {
    const r = parseCsv(rd("seo/shopify-redirects-import.csv"));
    const snap = JSON.parse(rd("launch/03G-dev-store-snapshot.json"));
    say("R10", r.rows.length === snap.redirects.count ? "PASS" : "FAIL", `redirecciones en CSV=${r.rows.length}; en la Dev Store=${snap.redirects.count}; encabezado=${r.head.join(",")}`);
    // Destinos que dependen de objetos que existen solo en el Admin (colecciones manuales, páginas, políticas) o de la importación del catálogo.
    const dest = r.rows.map((x) => x["Redirect to"]);
    const by = (re) => dest.filter((d) => re.test(d)).length;
    say("R10", "INFO", `destinos de las ${dest.length} redirecciones: productos=${by(/^\/products\//)}, colecciones=${by(/^\/collections\//)}, páginas=${by(/^\/pages\//)}, políticas=${by(/^\/policies\//)}, búsqueda=${by(/^\/search/)}, cuenta=${by(/^\/account/)}; los ${by(/^\/collections\//) + by(/^\/pages\//) + by(/^\/policies\//)} de colecciones, páginas y políticas son objetos creados a mano en el Admin (el validador seo/validate-redirects.mjs comprueba "el destino existe" contra una lista derivada de CSV e informes del repo, no contra la tienda)`);
  }

  // R11 — ZIP del theme
  if (!exists("dist/radaelli-shopify-theme-rc1.8.zip") || !exists("dist/release-manifest-rc1.8.json")) {
    say("R11", "FAIL", "dist/radaelli-shopify-theme-rc1.8.zip o dist/release-manifest-rc1.8.json no existe: una copia o clon sin dist/ no permite verificar el theme (el README de theme-src dice que el ZIP no se commitea)");
  } else {
    const z = readZip(rel("dist/radaelli-shopify-theme-rc1.8.zip"));
    const man = JSON.parse(rd("dist/release-manifest-rc1.8.json"));
    let okManifest = 0, okSrc = 0;
    for (const f of man.files) {
      const data = z.entries.get(f.path);
      if (data && sha(data) === f.sha256) okManifest++;
      if (exists("theme-src/" + f.path) && data && sha(fs.readFileSync(rel("theme-src/" + f.path))) === sha(data)) okSrc++;
    }
    const snap = JSON.parse(rd("launch/03G-dev-store-snapshot.json"));
    say("R11", okManifest === man.totalFiles && okSrc === man.totalFiles && z.entries.size === man.totalFiles ? "PASS" : "FAIL", `ZIP RC1.8: ${z.entries.size} entradas; = manifiesto ${okManifest}/${man.totalFiles}; = theme-src ${okSrc}/${man.totalFiles}; SHA-256 ZIP = snapshot: ${z.sha === snap.themes[1].zipSha256 ? "SÍ" : "NO"}`);
    fs.mkdirSync(path.join(tmp, "t", "scripts"), { recursive: true });
    fs.copyFileSync(rel("scripts/build-theme-rc.mjs"), path.join(tmp, "t/scripts/build-theme-rc.mjs"));
    fs.cpSync(rel("theme-src"), path.join(tmp, "t/theme-src"), { recursive: true });
    execFileSync(process.execPath, [path.join(tmp, "t/scripts/build-theme-rc.mjs"), "--name", "radaelli-shopify-theme-rc1.8"], { stdio: "pipe" });
    const rebuilt = sha(fs.readFileSync(path.join(tmp, "t/dist/radaelli-shopify-theme-rc1.8.zip")));
    say("R11", rebuilt === z.sha ? "PASS" : "FAIL", `reconstrucción del ZIP con build-theme-rc.mjs desde theme-src: ${rebuilt === z.sha ? "mismos bytes" : "bytes DISTINTOS"} (depende de la versión de zlib de Node: ${man.zip.builder})`);
  }

  // R12 — ZIP de la app
  if (!exists("dist/radaelli-wishlist-app-0.1.2.zip")) {
    say("R12", "FAIL", "dist/radaelli-wishlist-app-0.1.2.zip no existe: una copia o clon sin dist/ no permite verificar la app");
  } else {
    fs.cpSync(rel("app"), path.join(tmp, "a/app"), { recursive: true, filter: (s) => !s.includes("node_modules") });
    execFileSync(process.execPath, [path.join(tmp, "a/app/scripts/pack.mjs")], { stdio: "pipe" });
    const rebuilt = sha(fs.readFileSync(path.join(tmp, "a/dist/radaelli-wishlist-app-0.1.2.zip")));
    const cur = sha(fs.readFileSync(rel("dist/radaelli-wishlist-app-0.1.2.zip")));
    const toml = rd("app/shopify.app.toml");
    say("R12", rebuilt === cur ? "PASS" : "FAIL", `ZIP de la app 0.1.2 reconstruido con pack.mjs: ${rebuilt === cur ? "mismos bytes" : "bytes DISTINTOS"}; client_id vacío=${/client_id\s*=\s*""/.test(toml) || !/client_id/.test(toml.replace(/#.*$/gm, ""))}; application_url con placeholder .example=${/\.example/.test(toml)}`);
  }

  // R13 — legales
  {
    const man = JSON.parse(rd("content/legal/manifest.json"));
    const ok = man.filter((m) => sha(fs.readFileSync(rel(`content/legal/${m.slug}.html`))) === m.sha256).length;
    say("R13", ok === man.length ? "PASS" : "FAIL", `content/legal: ${ok}/${man.length} hashes coinciden con manifest.json`);
    say("R13", exists("scripts/legal-live") ? "PASS" : "GAP", `entrada de extract-legal-verbatim.cjs (scripts/legal-live/): ${exists("scripts/legal-live") ? "existe" : "NO existe en el repo; el script no se puede volver a ejecutar"}`);
  }

  // R14 — arnés de regresión del theme
  {
    const code = walk(MIG, (r, e) => (e.isDirectory() ? ["node_modules", ".git", "evidence", "dist"].includes(e.name) : false)).filter((f) => /\.(mjs|cjs|js|json)$/.test(f));
    const hits = code.filter((f) => /liquidjs/i.test(rd(f)) && f !== "launch/tools/03g-reproducibility-checks.mjs");
    say("R14", hits.length ? "PASS" : "GAP", `archivos de código/JSON que usan liquidjs (arnés offline del theme): ${hits.length}; mutantes del app en repo: ${exists("app/test/mutants.mjs") ? "SÍ (app/test/mutants.mjs)" : "NO"}; mutantes del píxel: ${/no quedan en el repo/.test(rd("analytics/custom-pixel/README.md")) ? "NO (README: scratchpad)" : "revisar"}`);
  }

  // R15 — dominios de datos del sitio actual
  {
    const files = walk(MIG, (r, e) => (e.isDirectory() ? ["node_modules", ".git", "evidence", "dist", "theme-src", "app", "analytics"].includes(e.name) : false)).filter((f) => /\.(csv|json|jsonl|xlsx|sql|tsv)$/.test(f));
    const hits = files.filter((f) => /(customer|cliente|user|order|pedido|coupon|cupon|discount|newsletter|subscri|blog|address|direccion)/i.test(path.basename(f)));
    const xl = "catalog/Radaelli_Catalogo_Master.xlsx";
    say("R15", hits.length ? "INFO" : "GAP", `archivos de datos de clientes/pedidos/cupones/newsletter/blog/direcciones en shopify-migration/: ${hits.length}${hits.length ? " (" + hits.join(", ") + ")" : ""}; carpeta inventory/: ${exists("inventory") ? `existe con ${fs.readdirSync(rel("inventory")).length} archivos` : "no existe"}; ${xl}: ${exists(xl) ? "existe" : "falta"}`);
  }

  // R16 — inventario
  {
    const v = parseCsv(rd("catalog/variants-master.csv")).rows;
    const na = v.filter((r) => /^NOT_AVAILABLE/.test(r.stock)).length;
    const pp = parseCsv(rd("launch/03G-product-parity.csv"));
    const col = pp.head.find((h) => /stock_current_public_payload/.test(h));
    const withStock = col ? pp.rows.filter((r) => r[col]).length : 0;
    say("R16", "GAP", `variants-master.csv: ${na}/${v.length} filas con stock NOT_AVAILABLE; 03G-product-parity.csv trae la columna de stock público en ${withStock}/29 productos (sin confirmar como stock real); Inventory tracker del CSV de importación: vacío`);
  }

  // R17 — media, logo y favicon en el theme
  {
    const idx = rd("theme-src/templates/index.json"), prod = rd("theme-src/templates/product.json");
    const sd = JSON.parse(rd("theme-src/config/settings_data.json")).presets.Default;
    const refs = (idx + prod).match(/shopify:\/\/[a-z_/]+/g) || [];
    const mm = rd("content/media/media-migration-manifest.csv");
    const siteFiles = ["public/logo/radaelli-swimwear.png", "app/favicon.ico", "app/icon.png", "app/apple-icon.png"].map((f) => `${f}=${fs.existsSync(path.join(SITE, f)) ? "existe" : "falta"}`);
    say("R17", "GAP", `referencias shopify:// de media en index.json+product.json: ${refs.length}; settings_data con logo=${"logo" in sd}, favicon=${"favicon" in sd}; manifiesto de media menciona logo/favicon: ${/logo|favicon/i.test(mm)}; fuentes en el repo del sitio actual: ${siteFiles.join(", ")}; 03E-upload-ready-manifest.csv: ${exists("content/media/03E-upload-ready-manifest.csv") ? "existe" : "no existe"}`);
    say("R17", "INFO", `settings_data.json: claves social_*=${Object.keys(sd).filter((k) => k.startsWith("social_")).join(",")} (el valor de WhatsApp no se imprime); wishlist_enabled=${sd.wishlist_enabled}, wishlist_account_sync=${sd.wishlist_account_sync}, free_shipping_rate_confirmed=${sd.free_shipping_rate_confirmed}, wishlist_page="${sd.wishlist_page}"`);
  }

  // R18 — colecciones que el theme referencia por handle
  {
    const txt = rd("theme-src/templates/index.json") + rd("theme-src/templates/product.json");
    const handles = [...new Set([...txt.matchAll(/"(?:collection|size_guide_collection)": "([a-z0-9-]+)"/g)].map((m) => m[1]))].sort();
    const dev = new Set(JSON.parse(rd("launch/evidence/dev-collections.json")).collections.map((c) => c.h));
    const announce = (rd("theme-src/sections/header-group.json").match(/"text": "([^"]+)"/) || [])[1];
    say("R18", "INFO", `handles de colección que exigen index.json/product.json: ${handles.join(", ")}; existen en la Dev Store: ${handles.filter((h) => dev.has(h)).length}/${handles.length}; texto del anuncio en header-group.json: "${announce}" (depende de que Price = 80 % del compare-at en el CSV)`);
  }

  // R19 — documentos que contradicen el estado real
  {
    const stale = [];
    if (/Inventario con seguimiento de Shopify/.test(rd("theme/pre-development-store-checklist.md"))) stale.push("theme/pre-development-store-checklist.md (paso C: 'inventario con seguimiento' y carpeta shopify-import/; el import real es no rastreado y vive en import/)");
    if (/No se cre[oó] ninguna tienda Shopify/.test(rd("README.md"))) stale.push("README.md (dice que no se creó ninguna tienda)");
    if (/Mantener Cloudinary como fuente/.test(rd("images/image-migration-plan.md"))) stale.push("images/image-migration-plan.md (recomienda mantener Cloudinary; 03C importó las imágenes a Shopify)");
    if (/not exist|NOT READY/i.test(rd("shopify-import/shopify-products-DRAFT.csv")) || fs.statSync(rel("shopify-import/shopify-products-DRAFT.csv")).size < 500) stale.push(`shopify-import/shopify-products-DRAFT.csv (${fs.statSync(rel("shopify-import/shopify-products-DRAFT.csv")).size} bytes: solo encabezado, riesgo de importarlo por error)`);
    if (/no est[aá] versionado/.test(rd("theme-src/README.md"))) stale.push("theme-src/README.md declara: shopify-migration/ no está versionado en git");
    say("R19", "INFO", stale.join(" || "));
  }

  // R20 — portabilidad de las herramientas (rutas absolutas escritas y forma de resolver la carpeta solo válida en Windows)
  {
    const self = "launch/tools/03g-reproducibility-checks.mjs";
    const tools = walk(MIG, (r, e) => (e.isDirectory() ? ["node_modules", ".git", "evidence", "dist", "theme-src", "test"].includes(e.name) : false))
      .filter((f) => /\.(mjs|cjs)$/.test(f) && f !== self)
      .sort();
    const absPath = /["'`][A-Za-z]:[\\/][^"'`]{3,}/;
    const winIdiom = /new URL\(import\.meta\.url\)\.pathname/;
    const withAbs = tools.filter((f) => absPath.test(rd(f)));
    const withWin = tools.filter((f) => winIdiom.test(rd(f)));
    say("R20", withAbs.length || withWin.length ? "GAP" : "PASS", `herramientas .mjs/.cjs con una ruta absoluta de Windows escrita en una cadena: ${withAbs.length} (${withAbs.join(", ") || "ninguna"}); con new URL(import.meta.url).pathname (solo válido en Windows): ${withWin.length} (${withWin.join(", ") || "ninguna"})`);
  }

  // R21 — capturas hechas a mano: ¿algún código del repo las escribe?
  {
    const self = "launch/tools/03g-reproducibility-checks.mjs";
    const code = walk(MIG, (r, e) => (e.isDirectory() ? ["node_modules", ".git", "evidence", "dist"].includes(e.name) : false)).filter((f) => /\.(mjs|cjs|js)$/.test(f) && f !== self);
    const names = ["dev-products.jsonl", "dev-collections.json", "dev-routes.json", "dev-home.json", "shopify-post-import-audit.csv"];
    const writer = /write(?:File|FileSync)\s*\([^;]{0,240}?/;
    const res = names.map((n) => {
      const re = new RegExp(writer.source + n.replace(/[.]/g, "\\."));
      const hits = code.filter((f) => re.test(rd(f)));
      return `${n}: archivos que la escriben (búsqueda textual)=${hits.length}`;
    });
    say("R21", res.some((x) => /escriben \(búsqueda textual\)=0/.test(x)) ? "GAP" : "PASS", res.join(" | "));
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(out.join("\n"));
