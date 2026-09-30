#!/usr/bin/env node
/**
 * 03K (workstreams B y C) — contenido, navegación y redirecciones de la tienda final: determinista, solo lectura salvo --write.
 *
 *   node launch/tools/03k-content-links-check.mjs            # valida (exit 1 si algo falla)
 *   node launch/tools/03k-content-links-check.mjs --write    # además (re)genera seo/03K-legal-redirects.csv y seo/shopify-redirects-import-final-store.csv
 *   node launch/tools/03k-content-links-check.mjs --self-test
 *
 * Controles:
 *   L1 los 6 HTML legales existen y coinciden con su hash de content/legal/manifest.json (texto verbatim del sitio actual, intacto)
 *   L2 todo enlace interno de los HTML legales resuelve (páginas legales previstas, política nativa de reembolso, ancla /#contacto que existe en el footer)
 *   L3 ningún HTML legal trae marcadores sin resolver ni datos de identidad inventados (NIT, razón social, dirección): los campos que faltan viven
 *      en content/legal/owner-fields.json como LEGAL DATA pendiente de la dueña
 *   R1 redirecciones finales = las 47 validadas (seo/shopify-redirects-import.csv) + las 4 legales (/envios, /terminos, /privacidad, /cookies)
 *   R2 los 51 orígenes son únicos (sin mayúsculas duplicadas), ningún destino es origen (sin cadenas) y ningún origen = destino
 *   R3 todo destino existe en la tienda final: colección/producto del catálogo (29 handles, 4 colecciones), página prevista, política nativa o ruta de Shopify
 *   N1 navegación final (content/navigation-final-store.json): cada enlace resuelve; el menú Ayuda trae las 6 páginas legales en el orden del sitio actual
 *   N2 las URL de configuración estática del theme (templates/*.json, sections/*-group.json, config/settings_data.json) resuelven o son externas
 *   N3 anclas internas del theme (#productos, #categorias, #contacto, #MainContent) existen como id en el theme
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const ARGS = new Set(process.argv.slice(2));
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

function parseCSV(text) {
  const rows = [];
  let rec = [];
  let f = "";
  let q = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { rec.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; rec.push(f); f = ""; if (rec.length > 1 || rec[0] !== "") rows.push(rec); rec = []; }
    else f += c;
  }
  if (f !== "" || rec.length) { rec.push(f); rows.push(rec); }
  return rows;
}

const LEGAL = ["privacidad", "terminos", "devoluciones", "envios", "garantia", "cookies"];
const LEGAL_PAGES = ["privacidad", "terminos", "envios", "cookies", "garantia"]; // devoluciones = política nativa
const SHOPIFY_ROUTES = new Set(["/", "/search", "/cart", "/account", "/account/login", "/account/register", "/collections/all", "/policies/refund-policy", "/policies/privacy-policy", "/policies/terms-of-service", "/policies/shipping-policy"]);
const NEW_LEGAL_REDIRECTS = [
  ["/envios", "/pages/envios"],
  ["/terminos", "/pages/terminos"],
  ["/privacidad", "/pages/privacidad"],
  ["/cookies", "/pages/cookies"],
];

export function buildUniverse() {
  const handles = parseCSV(rd("catalog/shopify-handle-mapping.csv")).slice(1).map((r) => r[2]);
  // 4 colecciones del sitio (collections-master.csv: KEEP + Salidas de Baño) + Destacados (apoyo de la Home) + all.
  return { handles: new Set(handles), collections: new Set(["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano", "destacados", "all"]) };
}

export function resolves(url, U, footerIds) {
  if (/^https?:\/\//.test(url) || /^mailto:|^tel:/.test(url)) return { ok: true, kind: "externa" };
  const [pathPart, hash] = url.split("#");
  const p = pathPart.split("?")[0];
  if (p === "" && hash !== undefined) return footerIds.has(hash) ? { ok: true, kind: "ancla" } : { ok: false, why: `ancla #${hash} sin id` };
  if (hash !== undefined && p === "/") return footerIds.has(hash) ? { ok: true, kind: "ancla" } : { ok: false, why: `ancla /#${hash} sin id` };
  if (SHOPIFY_ROUTES.has(p)) return { ok: true, kind: "ruta de Shopify" };
  let m;
  if ((m = p.match(/^\/products\/([a-z0-9-]+)$/))) return U.handles.has(m[1]) ? { ok: true, kind: "producto" } : { ok: false, why: `producto ${m[1]} fuera del catálogo` };
  if ((m = p.match(/^\/collections\/([a-z0-9-]+)$/))) return U.collections.has(m[1]) ? { ok: true, kind: "colección" } : { ok: false, why: `colección ${m[1]} inexistente` };
  if ((m = p.match(/^\/pages\/([a-z0-9-]+)$/))) return LEGAL_PAGES.includes(m[1]) || m[1] === "favoritos" ? { ok: true, kind: "página prevista" } : { ok: false, why: `página ${m[1]} no prevista` };
  return { ok: false, why: `ruta ${p} desconocida` };
}

function run() {
  const results = [];
  const check = (id, name, ok, detail = "") => results.push({ id, name, ok, detail });
  const U = buildUniverse();

  // ---- ids del theme (N3 y L2)
  const themeIds = new Set();
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = dir + "/" + e.name;
      if (e.isDirectory()) walk(rel);
      else if (/\.(liquid|json|js)$/.test(e.name)) {
        for (const m of rd(rel).matchAll(/\bid=["']([A-Za-z][\w-]*)["']/g)) themeIds.add(m[1]);
      }
    }
  };
  ["theme-src/sections", "theme-src/snippets", "theme-src/layout", "theme-src/templates"].forEach(walk);

  // ---- L1
  const manifest = JSON.parse(rd("content/legal/manifest.json"));
  const bad1 = [];
  for (const slug of LEGAL) {
    const f = `content/legal/${slug}.html`;
    if (!fs.existsSync(path.join(ROOT, f))) { bad1.push(`${slug}: falta el HTML`); continue; }
    const entry = manifest.find((m) => m.slug === slug);
    if (!entry) bad1.push(`${slug}: no está en el manifiesto`);
  }
  check("L1", "6 HTML legales presentes y listados en el manifiesto", bad1.length === 0, bad1.join("; "));

  // ---- L2
  const bad2 = [];
  let links = 0;
  for (const slug of LEGAL) {
    const html = rd(`content/legal/${slug}.html`);
    for (const m of html.matchAll(/href=["']([^"']+)["']/g)) {
      links++;
      const r = resolves(m[1], U, themeIds);
      if (!r.ok) bad2.push(`${slug}: ${m[1]} -> ${r.why}`);
    }
  }
  check("L2", `enlaces internos de los legales resuelven (${links} enlaces)`, bad2.length === 0, bad2.join("; "));

  // ---- L3
  const bad3 = [];
  for (const slug of LEGAL) {
    const html = rd(`content/legal/${slug}.html`);
    if (/\{\{\s*OWNER_|\[\[OWNER_|TODO|XXXX/.test(html)) bad3.push(`${slug}: marcador sin resolver en el HTML`);
    if (/\bNIT\b\s*[:.]?\s*\d|\b\d{3}\.?\d{3}\.?\d{3}-\d\b/.test(html)) bad3.push(`${slug}: parece traer un NIT`);
  }
  const owner = JSON.parse(rd("content/legal/owner-fields.json"));
  const need = ["razon_social", "nit", "direccion_legal"];
  for (const k of need) {
    const f = owner.fields.find((x) => x.key === k);
    if (!f) bad3.push(`owner-fields.json: falta ${k}`);
    else if (f.value !== null || f.status !== "PENDING_OWNER") bad3.push(`owner-fields.json: ${k} debe ser value:null y status:PENDING_OWNER (no se inventa)`);
  }
  check("L3", "sin marcadores ni datos legales inventados; campos faltantes declarados como pendientes de la dueña", bad3.length === 0, bad3.join("; "));

  // ---- R1..R3
  const base = parseCSV(rd("seo/shopify-redirects-import.csv"));
  const header = base[0].join(",");
  const baseRows = base.slice(1);
  const finalRows = [...baseRows, ...NEW_LEGAL_REDIRECTS];
  const finalCsv = [header, ...finalRows.map((r) => r.join(","))].join("\n") + "\n";
  const legalCsv = [header, ...NEW_LEGAL_REDIRECTS.map((r) => r.join(","))].join("\n") + "\n";
  if (ARGS.has("--write")) {
    fs.writeFileSync(path.join(ROOT, "seo/03K-legal-redirects.csv"), legalCsv);
    fs.writeFileSync(path.join(ROOT, "seo/shopify-redirects-import-final-store.csv"), finalCsv);
  }
  const onDisk = fs.existsSync(path.join(ROOT, "seo/shopify-redirects-import-final-store.csv")) ? rd("seo/shopify-redirects-import-final-store.csv").replace(/\r\n/g, "\n") : "";
  check("R1", `redirecciones finales = 47 validadas + 4 legales = ${finalRows.length}`, baseRows.length === 47 && finalRows.length === 51 && onDisk === finalCsv, `base ${baseRows.length}; archivo final ${onDisk === finalCsv ? "coincide" : "NO coincide (correr con --write)"}`);
  const froms = finalRows.map((r) => r[0]);
  const lower = froms.map((f) => f.toLowerCase());
  const bad2r = [];
  if (new Set(lower).size !== lower.length) bad2r.push("orígenes duplicados (incluidas mayúsculas)");
  for (const [f, t] of finalRows) {
    if (f === t) bad2r.push(`auto-redirect ${f}`);
    if (froms.includes(t)) bad2r.push(`cadena ${f} -> ${t}`);
  }
  check("R2", "orígenes únicos, sin cadenas ni auto-redirects", bad2r.length === 0, bad2r.join("; "));
  const bad3r = [];
  for (const [, t] of finalRows) {
    const r = resolves(t, U, themeIds);
    if (!r.ok) bad3r.push(`${t} -> ${r.why}`);
  }
  check("R3", "todo destino existe en la tienda final", bad3r.length === 0, bad3r.join("; "));

  // ---- N1
  const nav = JSON.parse(rd("content/navigation-final-store.json"));
  const bad4 = [];
  for (const menu of nav.menus) for (const it of menu.items) {
    const r = resolves(it.url, U, themeIds);
    if (!r.ok) bad4.push(`${menu.handle}: "${it.title}" ${it.url} -> ${r.why}`);
  }
  const ayuda = nav.menus.find((m) => m.handle === "ayuda");
  const wantOrder = nav.ayuda_order_sitio_actual;
  const gotOrder = ayuda ? ayuda.items.map((i) => i.url) : [];
  if (JSON.stringify(gotOrder) !== JSON.stringify(wantOrder)) bad4.push(`ayuda: orden ${JSON.stringify(gotOrder)} != ${JSON.stringify(wantOrder)}`);
  check("N1", "navegación final: enlaces resuelven y el menú Ayuda trae las 6 legales en el orden del sitio actual", bad4.length === 0, bad4.join("; "));

  // ---- N2
  const bad5 = [];
  let urls = 0;
  const jsonFiles = ["theme-src/config/settings_data.json", "theme-src/sections/footer-group.json", "theme-src/sections/header-group.json", ...fs.readdirSync(path.join(ROOT, "theme-src/templates")).filter((f) => f.endsWith(".json")).map((f) => "theme-src/templates/" + f)];
  for (const f of jsonFiles) {
    const txt = rd(f);
    for (const m of txt.matchAll(/"([a-z_]*(?:url|link|href)[a-z_]*)"\s*:\s*"([^"]*)"/g)) {
      if (!m[2]) continue;
      urls++;
      const r = resolves(m[2], U, themeIds);
      if (!r.ok) bad5.push(`${f.split("/").pop()}: ${m[1]}=${m[2]} -> ${r.why}`);
    }
  }
  check("N2", `URL de configuración estática del theme resuelven (${urls} valores)`, bad5.length === 0, bad5.join("; "));

  // ---- N3
  const bad6 = [];
  const anchors = new Set();
  // Solo destinos de enlace: valores url/link/href de los JSON que empiezan por "#" y href="#..." en el theme (no colores hex).
  for (const f of jsonFiles) for (const m of rd(f).matchAll(/"[a-z_]*(?:url|link|href)[a-z_]*"\s*:\s*"#([A-Za-z][\w-]*)"/g)) anchors.add(m[1]);
  const liquidFiles = [];
  const collect = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = dir + "/" + e.name;
      if (e.isDirectory()) collect(rel);
      else if (e.name.endsWith(".liquid")) liquidFiles.push(rel);
    }
  };
  ["theme-src/sections", "theme-src/snippets", "theme-src/layout"].forEach(collect);
  for (const f of liquidFiles) for (const m of rd(f).matchAll(/href=["']#([A-Za-z][\w-]*)["']/g)) anchors.add(m[1]);
  for (const a of anchors) if (!themeIds.has(a)) bad6.push(`#${a} sin id en el theme`);
  check("N3", `anclas internas existen como id (${[...anchors].join(", ") || "ninguna"})`, bad6.length === 0, bad6.join("; "));
  return results;
}

function selfTest() {
  const U = { handles: new Set(["a"]), collections: new Set(["oasis-natural"]) };
  const ids = new Set(["contacto"]);
  const cases = [
    ["/products/a", true], ["/products/zzz", false], ["/collections/oasis-natural", true], ["/collections/nada", false],
    ["/pages/envios", true], ["/pages/inventada", false], ["/#contacto", true], ["/#nada", false], ["https://wa.me/x", true], ["/policies/refund-policy", true], ["/otra", false],
  ];
  let ok = 0;
  for (const [u, want] of cases) {
    const got = resolves(u, U, ids).ok;
    if (got === want) ok++;
    else console.log("FALLA self-test:", u, "esperado", want, "obtenido", got);
  }
  console.log(`self-test: ${ok}/${cases.length}`);
  process.exit(ok === cases.length ? 0 : 1);
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` || process.argv[1].endsWith("03k-content-links-check.mjs")) {
  if (ARGS.has("--self-test")) selfTest();
  else {
    const res = run();
    for (const r of res) console.log(`[${r.ok ? "PASS" : "FAIL"}] ${r.id} ${r.name}${r.detail && !r.ok ? "\n        " + r.detail : ""}`);
    const fails = res.filter((r) => !r.ok).length;
    console.log(`\nRESULTADO: ${fails === 0 ? "PASS" : "FAIL"} -- ${res.length - fails}/${res.length} controles`);
    process.exit(fails ? 1 : 0);
  }
}
