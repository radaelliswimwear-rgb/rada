#!/usr/bin/env node
/**
 * Pruebas de scripts/apply-media-wiring.mjs (Fase 03F). Sin red, sin Shopify CLI, sin git.
 *
 * Reglas de seguridad de esta prueba:
 *   - TODO mapa y toda referencia son SINTÉTICOS y llevan "FAKE": no existen en Shopify.
 *   - Cada escritura (--write) se hace sobre una COPIA de theme-src en la carpeta temporal
 *     del sistema; el theme-src real solo se lee (dry-run) y se compara por SHA-256 antes
 *     y después de cada caso. Tampoco se toca content/media real (los manifiestos de
 *     prueba viven en la carpeta temporal y se pasan con --media-dir).
 *   - Todo se borra al final.
 *
 * Uso:  node shopify-migration/scripts/test/test-apply-media-wiring.mjs [--quiet]
 * Sale con código 1 si algún caso falla.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findDuplicateKeys } from "../apply-media-wiring.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(HERE, "..", "apply-media-wiring.mjs");
const MIG = path.resolve(HERE, "..", "..");
const REAL_THEME = path.join(MIG, "theme-src");
const REAL_MEDIA = path.join(MIG, "content", "media");
const QUIET = process.argv.includes("--quiet");

const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
function hashTree(dir) {
  const m = new Map();
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else m.set(path.relative(dir, p).split(path.sep).join("/"), sha(fs.readFileSync(p)));
    }
  })(dir);
  return m;
}
const sameTree = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);
const digest = (m) => sha(Buffer.from([...m].map(([k, v]) => `${k}:${v}`).join("\n"))).slice(0, 12);

const work = fs.mkdtempSync(path.join(os.tmpdir(), "radaelli-wiring-test-"));
const extraCleanup = [];
const TMP = work;
function scrub(text) {
  let t = text;
  for (const [from, to] of [[work, "<TMP>"], [MIG, "<MIG>"], [os.tmpdir(), "%TEMP%"]]) {
    t = t.split(from).join(to).split(from.split(path.sep).join("/")).join(to);
  }
  return t;
}

const results = [];
function assert(name, cond) {
  results.push({ name, ok: Boolean(cond) });
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${name}`);
}

function runScript(title, args, { env = {}, show = true } = {}) {
  const shown = `node shopify-migration/scripts/apply-media-wiring.mjs ${args.join(" ")}`;
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", env: { ...process.env, ...env } });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.replace(/\s+$/, "");
  console.log(`\n### ${title}`);
  console.log(`$ ${scrub(shown)}${env.RADAELLI_WIRING_TEST_FAULT ? `   (env RADAELLI_WIRING_TEST_FAULT=${env.RADAELLI_WIRING_TEST_FAULT})` : ""}`);
  if (show && !QUIET) console.log(scrub(out));
  console.log(`[exit ${r.status}]`);
  return { code: r.status, out };
}

// ---------------------------------------------------------------- datos sintéticos

const realThemeBefore = hashTree(REAL_THEME);
const realMediaBefore = hashTree(REAL_MEDIA);
console.log(`theme-src real:  ${realThemeBefore.size} archivos, huella ${digest(realThemeBefore)}`);
console.log(`content/media real: ${realMediaBefore.size} archivos, huella ${digest(realMediaBefore)}`);
console.log(`carpeta temporal de pruebas: ${scrub(work)}`);

function assertRealUntouched(label) {
  const t = sameTree(hashTree(REAL_THEME), realThemeBefore);
  const m = sameTree(hashTree(REAL_MEDIA), realMediaBefore);
  assert(`${label}: theme-src real idéntico (SHA-256 de ${realThemeBefore.size} archivos) y content/media real idéntico`, t && m);
}

/** Copia temporal de theme-src (nunca se escribe en el real). */
function freshTheme(name) {
  const dir = path.join(work, name);
  fs.cpSync(REAL_THEME, dir, { recursive: true });
  return dir;
}

const FAKE_REFS = {
  M01: "shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4",
  M03: "shopify://shop_images/FAKE-M03-zjlcdrptowzxnmcz7ixf.jpg",
  M04: "shopify://files/videos/FAKE-M04-xxjjwoori52cmkbgu33n.mp4",
  M05: "shopify://shop_images/FAKE-M05-zdxbjacneyll6npdosdu.png",
  M06: "shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4", // mismo video que M01 (ETag idéntico)
  M08: "shopify://files/videos/FAKE-M08-nnohfbsoqzgee20xooog.mp4",
  M09: "shopify://shop_images/FAKE-M09-gz9ken66as28i5hresne.png",
  M10: "FAKE-M10-x95tyqydlvieasp7whfn.jpg",
  M11: "FAKE-M11-c9gz6yuipjnowjyp3amd.jpg",
  M12: "FAKE-M12-n9to8ksgrw1xmxlxm2ch.jpg",
  M13: "FAKE-M13-grhrfruybukvqgk6ngrc.jpg",
  M14: "shopify://shop_images/FAKE-M14-gaattbpghl9loslphqz6.png",
};
const mapsDir = path.join(work, "maps");
fs.mkdirSync(mapsDir);
function writeMap(name, refs, raw = null) {
  const file = path.join(mapsDir, `${name}.json`);
  fs.writeFileSync(file, raw ?? JSON.stringify({ _aviso: "MAPA SINTÉTICO FAKE: solo pruebas", refs }, null, 2));
  return file;
}
const without = (obj, ...ids) => Object.fromEntries(Object.entries(obj).filter(([k]) => !ids.includes(k)));

// Media dir de prueba: el manifiesto REAL (copia) + un manifiesto de subida FAKE con la convención de nombres de prepare-media-package.
const mediaDir = path.join(work, "media");
fs.mkdirSync(mediaDir);
fs.copyFileSync(path.join(REAL_MEDIA, "media-migration-manifest.csv"), path.join(mediaDir, "media-migration-manifest.csv"));
const UPLOAD_ROWS = [
  ["M01", "prepared/M01-bb70lfnhpbl4h8ee7mdz.mp4"],
  ["M03", "prepared/M03-zjlcdrptowzxnmcz7ixf.jpg"],
  ["M04", "prepared/M04-xxjjwoori52cmkbgu33n.mp4"],
  ["M05", "prepared/M05-zdxbjacneyll6npdosdu.png"],
  ["M06", "prepared/M01-bb70lfnhpbl4h8ee7mdz.mp4"],
  ["M07", "prepared/M07-1-1.webp"],
  ["M08", "prepared/M08-nnohfbsoqzgee20xooog.mp4"],
  ["M09", "prepared/M09-gz9ken66as28i5hresne.png"],
  ["M10", "prepared/M10-x95tyqydlvieasp7whfn.jpg"],
  ["M11", "prepared/M11-c9gz6yuipjnowjyp3amd.jpg"],
  ["M12", "prepared/M12-n9to8ksgrw1xmxlxm2ch.jpg"],
  ["M13", "prepared/M13-grhrfruybukvqgk6ngrc.jpg"],
  ["M14", "prepared/M14-gaattbpghl9loslphqz6.png"],
];
fs.writeFileSync(
  path.join(mediaDir, "03E-upload-ready-manifest.csv"),
  ["id,asset,source_url,delivered_url,file,bytes,dimensions,sha256,shopify_target", ...UPLOAD_ROWS.map(([id, file]) => `${id},FAKE asset ${id},FAKE,FAKE,${file},0,FAKE,FAKE-SHA256-${id},FAKE`)].join("\n") + "\n",
);
const mediaNoUpload = path.join(work, "media-sin-subida");
fs.mkdirSync(mediaNoUpload);
fs.copyFileSync(path.join(REAL_MEDIA, "media-migration-manifest.csv"), path.join(mediaNoUpload, "media-migration-manifest.csv"));
const mediaEmpty = path.join(work, "media-vacio");
fs.mkdirSync(mediaEmpty);

const completeMap = writeMap("completo", FAKE_REFS);
const M = `--media-dir=${mediaDir}`;

try {
  // ============================================================ CASO 1: mapa completo
  console.log("\n==================== CASO 1: mapa completo (FAKE) ====================");
  let r = runScript("1a. Mapa completo, DRY-RUN (por defecto) sobre el theme-src REAL (solo lectura)", [`--map=${completeMap}`, M]);
  assert("1a: exit 0", r.code === 0);
  assert("1a: dice DRY-RUN OK y que 2 templates cambiarían", /DRY-RUN OK — 2 template\(s\) cambiarían/.test(r.out));
  assert("1a: cobertura 12/12 requeridos + M07 opcional", /Cobertura del mapa: 12\/12 ids requeridos \(\+ 1 opcional\)/.test(r.out) && /M07  opcional/.test(r.out));
  assert("1a: avisa que el mapa es de PRUEBA", /AVISO: mapa de PRUEBA/.test(r.out));
  assertRealUntouched("1a");

  const t1 = freshTheme("theme-1");
  const t1Before = hashTree(t1);
  const t1Files = { idx: path.join(t1, "templates", "index.json"), prod: path.join(t1, "templates", "product.json") };
  r = runScript("1b. Mapa completo, --write sobre una COPIA temporal (snapshot en la ruta por defecto)", [`--map=${completeMap}`, M, `--theme-src=${t1}`, "--write", "--allow-fake-refs"]);
  assert("1b: exit 0 y RESULTADO OK", r.code === 0 && /RESULTADO: OK — 2 template\(s\) escritos/.test(r.out));
  const snap = /Snapshot de rollback: (.+)/.exec(r.out)?.[1]?.trim();
  if (snap) extraCleanup.push(snap);
  assert("1b: hay snapshot con SNAPSHOT.json y los originales", snap && fs.existsSync(path.join(snap, "SNAPSHOT.json")) && fs.existsSync(path.join(snap, "templates", "index.json")) && fs.existsSync(path.join(snap, "templates", "product.json")));
  assert("1b: el snapshot es idéntico byte a byte al original", snap && sha(fs.readFileSync(path.join(snap, "templates", "index.json"))) === t1Before.get("templates/index.json") && sha(fs.readFileSync(path.join(snap, "templates", "product.json"))) === t1Before.get("templates/product.json"));
  assert("1b: imprime el comando de restauración", /--restore="/.test(r.out) && /--write/.test(r.out));
  const idx = JSON.parse(fs.readFileSync(t1Files.idx, "utf8"));
  const prod = JSON.parse(fs.readFileSync(t1Files.prod, "utf8"));
  assert("1b: hero_video y los 4 bloques quedaron con su referencia FAKE (M07 sin imagen)", idx.sections.hero.settings.hero_video === FAKE_REFS.M01 && idx.sections["featured-categories"].blocks["oasis-natural"].settings.image === FAKE_REFS.M03 && idx.sections["featured-categories"].blocks["aurora-viva"].settings.video === FAKE_REFS.M06 && idx.sections["featured-categories"].blocks["espuma-de-ola"].settings.image === undefined && idx.sections["featured-categories"].blocks["salidas-de-bano"].settings.image === FAKE_REFS.M09);
  assert("1b: product.json con size_guide_image y size_guide_collection=oasis-natural", prod.sections.main.settings.size_guide_image === FAKE_REFS.M14 && prod.sections.main.settings.size_guide_collection === "oasis-natural");
  const t1After = hashTree(t1);
  const changedFiles = [...t1After].filter(([k, v]) => t1Before.get(k) !== v).map(([k]) => k).sort();
  assert("1b: solo cambiaron templates/index.json y templates/product.json", changedFiles.join(",") === "templates/index.json,templates/product.json");
  assert("1b: sin temporales *.tmp / *.rollback sobrantes", ![...t1After.keys()].some((k) => /\.wiring-.*\.(tmp|rollback)$/.test(k)));
  assertRealUntouched("1b");

  r = runScript("1c. Segunda corrida --write (idempotencia)", [`--map=${completeMap}`, M, `--theme-src=${t1}`, "--write", "--allow-fake-refs", `--snapshot-dir=${path.join(work, "snap-1c")}`]);
  assert("1c: exit 0 y 'nada que escribir'", r.code === 0 && /nada que escribir/.test(r.out));
  assert("1c: no creó snapshot ni tocó archivos", !fs.existsSync(path.join(work, "snap-1c")) && sameTree(hashTree(t1), t1After));

  r = runScript("1d. Restaurar el snapshot EN SECO", [`--restore=${snap}`, `--theme-src=${t1}`]);
  assert("1d: exit 0 y describe 2 archivos, sin escribir", r.code === 0 && /DRY-RUN OK — se restaurarían 2/.test(r.out) && sameTree(hashTree(t1), t1After));
  r = runScript("1e. Restaurar el snapshot con --write", [`--restore=${snap}`, `--theme-src=${t1}`, "--write"]);
  assert("1e: exit 0", r.code === 0 && /RESULTADO: OK — restaurados 2/.test(r.out));
  assert("1e: la copia quedó IDÉNTICA al theme-src original (SHA-256 de los 97 archivos)", sameTree(hashTree(t1), t1Before));
  r = runScript("1f. Restaurar de nuevo (ya restaurado)", [`--restore=${snap}`, `--theme-src=${t1}`, "--write"]);
  assert("1f: exit 0 y 'nada que restaurar'", r.code === 0 && /nada que restaurar/.test(r.out));

  // ============================================================ CASO 2: mapa incompleto
  console.log("\n==================== CASO 2: mapa incompleto (faltan M09 y M14) ====================");
  const incompleteMap = writeMap("incompleto", without(FAKE_REFS, "M09", "M14"));
  r = runScript("2a. Mapa incompleto, DRY-RUN", [`--map=${incompleteMap}`, M]);
  assert("2a: exit 1", r.code === 1);
  assert("2a: ERROR 'mapa incompleto: 10/12 ... faltan M09, M14 ... todo o nada'", /ERROR: mapa incompleto: 10\/12 ids requeridos con referencia válida; faltan M09, M14; todo o nada/.test(r.out));
  assert("2a: avisa el riesgo CRÍTICO de M09 y omite el diff", /CRÍTICO: sin M09/.test(r.out) && /diff omitido/.test(r.out));
  assertRealUntouched("2a");
  const t2 = freshTheme("theme-2");
  const t2Before = hashTree(t2);
  const snap2 = path.join(work, "snap-2b");
  r = runScript("2b. Mapa incompleto, --write sobre una copia: NINGUNA escritura parcial", [`--map=${incompleteMap}`, M, `--theme-src=${t2}`, "--write", "--allow-fake-refs", `--snapshot-dir=${snap2}`]);
  assert("2b: exit 1, RECHAZADO y 'No se escribió nada'", r.code === 1 && /RECHAZADO — .* No se escribió nada/.test(r.out));
  assert("2b: la copia del theme quedó IDÉNTICA (ni index.json ni product.json cambiaron) y no hay snapshot", sameTree(hashTree(t2), t2Before) && !fs.existsSync(snap2));
  r = runScript("2c. Mapa incompleto con --allow-partial (solo simulación)", [`--map=${incompleteMap}`, M, "--allow-partial"]);
  assert("2c: exit 0 y solo un AVISO", r.code === 0 && /AVISO: mapa incompleto: 10\/12 ids requeridos con referencia válida; faltan M09, M14/.test(r.out) && /--write lo rechazaría/.test(r.out));
  r = runScript("2d. --allow-partial junto con --write (debe rechazarse por uso)", [`--map=${incompleteMap}`, M, `--theme-src=${t2}`, "--write", "--allow-partial", "--allow-fake-refs"]);
  assert("2d: exit 2 y mensaje de uso", r.code === 2 && /--allow-partial es solo para simulación/.test(r.out) && sameTree(hashTree(t2), t2Before));
  assertRealUntouched("2");

  // ============================================================ CASO 3: formato inválido
  console.log("\n==================== CASO 3: referencias con formato inválido ====================");
  const badFormat = writeMap("formato-invalido", {
    ...FAKE_REFS,
    M03: "shopify://files/videos/FAKE-M03-zjlcdrptowzxnmcz7ixf.mp4", // video en un slot de imagen
    M04: "FAKE-M04-xxjjwoori52cmkbgu33n.mp4", // sin shopify://
    M05: "shopify://shop_images/FAKE M05 zdxbjacneyll6npdosdu.png", // espacios
    M10: "https://cdn.shopify.com/s/files/FAKE-M10-x95tyqydlvieasp7whfn.jpg", // URL, no nombre ni gid
    M14: "shopify://shop_images/FAKE-M14-gaattbpghl9loslphqz6.exe", // extensión no válida
  });
  const t3 = freshTheme("theme-3");
  const t3Before = hashTree(t3);
  r = runScript("3a. Formato inválido, DRY-RUN", [`--map=${badFormat}`, M, `--theme-src=${t3}`]);
  assert("3a: exit 1 y un ERROR por cada referencia inválida (M03, M04, M05, M10, M14)", r.code === 1 && ["M03", "M04", "M05", "M10", "M14"].every((id) => new RegExp(`ERROR: ${id}: `).test(r.out)));
  assert("3a: los ids válidos (M01, M06, M08, M09, M11, M12, M13) NO generan error", !/ERROR: M0[1689]:/.test(r.out) && !/ERROR: M1[123]:/.test(r.out));
  assert("3a: las referencias inválidas NO cuentan como cubiertas (7/12) y se marcan INVÁLIDA", /Cobertura del mapa: 7\/12/.test(r.out) && (r.out.match(/INVÁLIDA/g) ?? []).length === 5);
  r = runScript("3b. Formato inválido, --write sobre una copia", [`--map=${badFormat}`, M, `--theme-src=${t3}`, "--write", "--allow-fake-refs", `--snapshot-dir=${path.join(work, "snap-3b")}`]);
  assert("3b: exit 1 y la copia quedó IDÉNTICA", r.code === 1 && sameTree(hashTree(t3), t3Before) && !fs.existsSync(path.join(work, "snap-3b")));
  const r3c = runScript("3c. --allow-ref-mismatch solo degrada el patrón (M03, M14); M04, M05 y M10 siguen siendo error", [`--map=${badFormat}`, M, `--theme-src=${t3}`, "--allow-ref-mismatch"], { show: false });
  assert("3c: con --allow-ref-mismatch M03 y M14 pasan a AVISO, y M04, M05, M10 siguen en ERROR (exit 1)", r3c.code === 1 && /AVISO: M03: .*aceptado por --allow-ref-mismatch/.test(r3c.out) && /ERROR: M04:/.test(r3c.out) && /ERROR: M05:/.test(r3c.out) && /ERROR: M10:/.test(r3c.out) && !/ERROR: M03:/.test(r3c.out));
  assertRealUntouched("3");

  // ============================================================ CASO 4: id duplicado
  console.log("\n==================== CASO 4: id duplicado ====================");
  // Mapa COMPLETO al que se le repite la clave "M03" (con otro valor): JSON.parse se quedaría en silencio con la última.
  const dupLines = JSON.stringify({ _aviso: "MAPA SINTÉTICO FAKE: solo pruebas", refs: FAKE_REFS }, null, 2).split("\n");
  const m03Line = dupLines.findIndex((l) => l.includes('"M03"'));
  dupLines.splice(m03Line, 0, '    "M03": "shopify://shop_images/FAKE-M03-OTRO.jpg",');
  const dupKeyMap = writeMap("id-duplicado", null, `${dupLines.join("\n")}\n`);
  const t4 = freshTheme("theme-4");
  const t4Before = hashTree(t4);
  r = runScript("4a. El mismo id (M03) dos veces en el JSON, DRY-RUN", [`--map=${dupKeyMap}`, M, `--theme-src=${t4}`]);
  assert('4a: exit 1 y un único ERROR: clave duplicada "refs.M03" con las dos líneas', r.code === 1 && new RegExp(`ERROR: mapa: clave duplicada "refs\\.M03" \\(líneas ${m03Line + 1} y ${m03Line + 2}\\)`).test(r.out) && (r.out.match(/^ERROR:/gm) ?? []).length === 1);
  r = runScript("4b. El mismo id duplicado con --write sobre una copia", [`--map=${dupKeyMap}`, M, `--theme-src=${t4}`, "--write", "--allow-fake-refs", `--snapshot-dir=${path.join(work, "snap-4b")}`]);
  assert("4b: exit 1 y la copia quedó IDÉNTICA", r.code === 1 && sameTree(hashTree(t4), t4Before) && !fs.existsSync(path.join(work, "snap-4b")));
  const dupRefMap = writeMap("referencia-duplicada", { ...FAKE_REFS, M05: FAKE_REFS.M03 });
  r = runScript("4c. El mismo ARCHIVO en dos destinos distintos (M03 y M05)", [`--map=${dupRefMap}`, M, `--theme-src=${t4}`]);
  assert("4c: exit 1, ERROR 'referencia duplicada: M03 y M05' y ERROR de archivo equivocado en M05", r.code === 1 && /ERROR: referencia duplicada: M03 y M05 apuntan al mismo archivo/.test(r.out) && /ERROR: M05: la referencia .* no contiene el nombre del archivo preparado "M05-zdxbjacneyll6npdosdu"/.test(r.out));
  assert("4c: M01 y M06 compartiendo referencia NO generan error (mismo video)", [...r.out.matchAll(/referencia duplicada: (.+?) apuntan/g)].map((m) => m[1]).join("|") === "M03 y M05" && !/ERROR: M0[16]:/.test(r.out));
  assertRealUntouched("4");

  // ============================================================ CASO 5: archivo requerido ausente
  console.log("\n==================== CASO 5: archivo requerido ausente ====================");
  const t5a = freshTheme("theme-5a");
  fs.rmSync(path.join(t5a, "sections", "featured-categories.liquid"));
  const t5aBefore = hashTree(t5a);
  r = runScript("5a. Falta sections/featured-categories.liquid, DRY-RUN", [`--map=${completeMap}`, M, `--theme-src=${t5a}`]);
  assert("5a: exit 1 y ERROR 'archivo requerido ausente' con la ruta", r.code === 1 && /ERROR: archivo requerido ausente o ilegible: theme sections\/featured-categories\.liquid — no existe/.test(r.out));
  r = runScript("5b. Falta ese archivo, --write", [`--map=${completeMap}`, M, `--theme-src=${t5a}`, "--write", "--allow-fake-refs", `--snapshot-dir=${path.join(work, "snap-5b")}`]);
  assert("5b: exit 1 y la copia quedó IDÉNTICA (index.json y product.json intactos), sin snapshot", r.code === 1 && sameTree(hashTree(t5a), t5aBefore) && !fs.existsSync(path.join(work, "snap-5b")));
  const t5c = freshTheme("theme-5c");
  fs.rmSync(path.join(t5c, "templates", "product.json"));
  fs.rmSync(path.join(t5c, "sections", "hero.liquid"));
  const t5cBefore = hashTree(t5c);
  r = runScript("5c. Faltan templates/product.json y sections/hero.liquid (se listan TODOS)", [`--map=${completeMap}`, M, `--theme-src=${t5c}`, "--write", "--allow-fake-refs"]);
  assert("5c: exit 1, 2 archivos listados y la copia quedó IDÉNTICA", r.code === 1 && /2 archivo\(s\) requerido\(s\)/.test(r.out) && /templates\/product\.json/.test(r.out) && /sections\/hero\.liquid/.test(r.out) && sameTree(hashTree(t5c), t5cBefore));
  r = runScript("5d. Falta el manifiesto de media (carpeta vacía)", [`--map=${completeMap}`, `--media-dir=${mediaEmpty}`]);
  assert("5d: exit 1 y ERROR por media-migration-manifest.csv", r.code === 1 && /archivo requerido ausente o ilegible: manifiesto de media/.test(r.out));
  const t5e = freshTheme("theme-5e");
  const t5eBefore = hashTree(t5e);
  r = runScript("5e. --write sin 03E-upload-ready-manifest.csv (aún no se corrió prepare --download)", [`--map=${completeMap}`, `--media-dir=${mediaNoUpload}`, `--theme-src=${t5e}`, "--write", "--allow-fake-refs"]);
  assert("5e: exit 1, '--write exige 03E-upload-ready-manifest.csv' y la copia quedó IDÉNTICA", r.code === 1 && /--write exige 03E-upload-ready-manifest\.csv/.test(r.out) && sameTree(hashTree(t5e), t5eBefore));
  r = runScript("5f. El mismo caso en DRY-RUN: solo un AVISO (permite ensayar antes de descargar)", [`--map=${completeMap}`, `--media-dir=${mediaNoUpload}`], { show: false });
  assert("5f: dry-run sin manifiesto de subida: exit 0 con AVISO", r.code === 0 && /AVISO: no existe 03E-upload-ready-manifest\.csv/.test(r.out));
  assertRealUntouched("5");

  // ============================================================ CASO 6: extras de seguridad
  console.log("\n==================== CASO 6: extras de seguridad ====================");
  const snap6a = path.join(work, "snap-6a");
  r = runScript("6a. --write con mapa FAKE sobre el theme-src REAL (sin --allow-fake-refs)", [`--map=${completeMap}`, M, "--write", `--snapshot-dir=${snap6a}`]);
  assert("6a: exit 1, '--write rechazado' y el theme-src real intacto, sin snapshot", r.code === 1 && /referencias de prueba .*--write rechazado/.test(r.out) && !fs.existsSync(snap6a));
  assertRealUntouched("6a");
  r = runScript("6b. --allow-fake-refs sobre el theme-src REAL (debe rechazarse por uso)", [`--map=${completeMap}`, M, "--write", "--allow-fake-refs"]);
  assert("6b: exit 2 y el theme-src real intacto", r.code === 2 && /--allow-fake-refs solo se permite con --theme-src dentro de la carpeta temporal/.test(r.out));
  assertRealUntouched("6b");
  const wrongSlot = writeMap("archivo-equivocado", { ...FAKE_REFS, M03: "shopify://shop_images/FAKE-M05-zdxbjacneyll6npdosdu.jpg" });
  r = runScript("6c. La imagen de M05 puesta en el destino de M03 (archivo equivocado)", [`--map=${wrongSlot}`, M], { show: false });
  assert("6c: exit 1 y ERROR 'archivo equivocado en este destino'", r.code === 1 && /ERROR: M03: la referencia .* no contiene el nombre del archivo preparado "M03-zjlcdrptowzxnmcz7ixf": ¿archivo equivocado/.test(r.out));
  const t6d = freshTheme("theme-6d");
  const idx6d = path.join(t6d, "templates", "index.json");
  fs.writeFileSync(idx6d, fs.readFileSync(idx6d, "utf8").replace('"hero_cta_url": "#categorias"', '"hero_cta_url": "#categorias",\n        "hero_video": "shopify://files/videos/previo.mp4"'));
  const t6dBefore = hashTree(t6d);
  r = runScript("6d. hero_video ya tiene OTRO valor: error sin --overwrite", [`--map=${completeMap}`, M, `--theme-src=${t6d}`], { show: false });
  assert('6d: exit 1 y ERROR "ya vale"', r.code === 1 && /ERROR: M01: .* hero_video ya vale "shopify:\/\/files\/videos\/previo\.mp4"/.test(r.out));
  r = runScript("6d'. Con --overwrite (dry-run)", [`--map=${completeMap}`, M, `--theme-src=${t6d}`, "--overwrite"], { show: false });
  assert("6d: con --overwrite reemplaza (exit 0) y en seco no escribe", r.code === 0 && /reemplaza "shopify:\/\/files\/videos\/previo\.mp4"/.test(r.out) && sameTree(hashTree(t6d), t6dBefore));
  const t6e = freshTheme("theme-6e");
  const t6eBefore = hashTree(t6e);
  r = runScript("6e. Falla simulada al renombrar el 2.º archivo (rollback automático)", [`--map=${completeMap}`, M, `--theme-src=${t6e}`, "--write", "--allow-fake-refs", `--snapshot-dir=${path.join(work, "snap-6e")}`], { env: { RADAELLI_WIRING_TEST_FAULT: "rename-second" } });
  assert("6e: exit 3, 'revertido automáticamente' y la copia quedó IDÉNTICA (el 1.er archivo ya renombrado volvió atrás)", r.code === 3 && /revertido automáticamente/.test(r.out) && sameTree(hashTree(t6e), t6eBefore));
  assert("6e: sin temporales sobrantes", ![...hashTree(t6e).keys()].some((k) => /\.wiring-/.test(k)));
  const t6f = freshTheme("theme-6f");
  const t6fBefore = hashTree(t6f);
  const snap6f = path.join(work, "snap-6f");
  r = runScript("6f. Escribir para probar la restauración segura", [`--map=${completeMap}`, M, `--theme-src=${t6f}`, "--write", "--allow-fake-refs", `--snapshot-dir=${snap6f}`], { show: false });
  assert("6f: escritura OK", r.code === 0);
  const t6fAfter = hashTree(t6f);
  fs.appendFileSync(path.join(t6f, "templates", "product.json"), " ");
  r = runScript("6g. Restaurar cuando product.json cambió DESPUÉS del wiring", [`--restore=${snap6f}`, `--theme-src=${t6f}`, "--write"]);
  assert("6g: exit 1 'cambió desde el wiring' y no restauró NINGUNO (todo o nada)", r.code === 1 && /product\.json: cambió desde el wiring/.test(r.out) && hashTree(t6f).get("templates/index.json") === t6fAfter.get("templates/index.json"));
  r = runScript("6h. Igual, con --force-restore", [`--restore=${snap6f}`, `--theme-src=${t6f}`, "--write", "--force-restore"], { show: false });
  assert("6h: --force-restore restaura y la copia vuelve al original", r.code === 0 && sameTree(hashTree(t6f), t6fBefore));
  const snapCorrupt = path.join(work, "snap-6f-corrupto");
  fs.cpSync(snap6f, snapCorrupt, { recursive: true });
  fs.appendFileSync(path.join(snapCorrupt, "templates", "index.json"), "x");
  r = runScript("6i. Snapshot corrupto (la copia del original fue alterada)", [`--restore=${snapCorrupt}`, `--theme-src=${t6f}`, "--write"], { show: false });
  assert("6i: exit 1 'copia del snapshot está corrupta' y nada se escribió", r.code === 1 && /corrupta/.test(r.out) && sameTree(hashTree(t6f), t6fBefore));
  r = runScript("6j. --restore sobre una carpeta que no es un snapshot", [`--restore=${mapsDir}`], { show: false });
  assert("6j: exit 1 'snapshot inválido o ausente'", r.code === 1 && /snapshot inválido o ausente/.test(r.out));
  r = runScript("6k. --template (mapa vacío con los nombres de archivo preparados)", ["--template", M], { show: false });
  let tpl = null;
  try {
    tpl = JSON.parse(r.out);
  } catch {
    /* falla abajo */
  }
  assert("6k: JSON válido con 13 ids en null y ayudas _Mxx_archivo_preparado", tpl && Object.keys(tpl.refs).filter((k) => /^M\d\d$/.test(k)).length === 13 && tpl.refs._M03_archivo_preparado === "prepared/M03-zjlcdrptowzxnmcz7ixf.jpg");
  // Mapas guardados con `>` de PowerShell (UTF-8 con BOM y UTF-16LE con BOM), regresión de 03E.
  const mapText = fs.readFileSync(completeMap, "utf8");
  const bomUtf8 = path.join(mapsDir, "completo-utf8-bom.json");
  fs.writeFileSync(bomUtf8, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(mapText, "utf8")]));
  const utf16 = path.join(mapsDir, "completo-utf16le.json");
  fs.writeFileSync(utf16, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(mapText, "utf16le")]));
  r = runScript("6m. Mapa guardado con BOM UTF-8 y con UTF-16LE (redirección `>` de PowerShell 5.1)", [`--map=${bomUtf8}`, M], { show: false });
  const r6m2 = runScript("6m'. UTF-16LE", [`--map=${utf16}`, M], { show: false });
  assert("6m: ambos formatos se leen (exit 0, cobertura 12/12)", r.code === 0 && r6m2.code === 0 && /Cobertura del mapa: 12\/12/.test(r6m2.out));
  const badJson = writeMap("json-invalido", null, '{ "refs": { "M01": "FAKE", } }');
  r = runScript("6n. JSON inválido", [`--map=${badJson}`, M], { show: false });
  assert("6n: exit 1 y ERROR 'mapa: JSON inválido'", r.code === 1 && /ERROR: mapa: JSON inválido/.test(r.out));
  const badIds = writeMap("ids-invalidos", { ...FAKE_REFS, M02: "shopify://shop_images/FAKE-M02.png", M99: "FAKE-M99.jpg", m01: FAKE_REFS.M01 });
  r = runScript("6o. Ids no permitidos: M02 (NO_MIGRAR), M99 (desconocido) y m01 (minúscula)", [`--map=${badIds}`, M], { show: false });
  assert("6o: exit 1 con ERROR para M02, M99 y m01 (con la pista '¿quisiste M01?')", r.code === 1 && /ERROR: M02 \(poster del Hero\) es NO_MIGRAR/.test(r.out) && /ERROR: M99: id desconocido/.test(r.out) && /ERROR: m01: id desconocido \(¿quisiste M01\?\)/.test(r.out));
  r = runScript("6p. --verbose y --help", [`--map=${completeMap}`, M, "--verbose"], { show: false });
  const rHelp = runScript("6p'. --help", ["--help"], { show: false });
  assert("6p: --verbose lista las verificaciones de schema y manifiesto; --help imprime el uso", /schema OK  sections\/hero\.liquid > hero_video \(video\)/.test(r.out) && /manifiesto OK  M14/.test(r.out) && /Uso \(Node >= 20/.test(rHelp.out));
  const dups = findDuplicateKeys('{"a":{"b":1,"b":2},"c":[{"x":1},{"x":1,"x":2}],"a":3}');
  assert("6l: findDuplicateKeys detecta duplicados anidados (a.b, c.[].x y a) y no falsos positivos", dups.map((d) => d.path).join("|") === "a.b|c.[].x|a" && findDuplicateKeys('{"a":{"b":1},"c":{"b":1},"d":["b","b"]}').length === 0);
  assertRealUntouched("6");
} finally {
  const realAfter = hashTree(REAL_THEME);
  console.log(`\ntheme-src real al final: huella ${digest(realAfter)} (antes: ${digest(realThemeBefore)})`);
  for (const d of [work, ...extraCleanup]) fs.rmSync(d, { recursive: true, force: true });
}

const failed = results.filter((x) => !x.ok);
console.log(`\n==== ${results.length - failed.length}/${results.length} PASS ====`);
if (failed.length) {
  for (const f of failed) console.log(`FAIL: ${f.name}`);
  process.exitCode = 1;
}
