// 03G - verificador del plan de migracion Dev -> tienda comercial.
// DETERMINISTA y OFFLINE: solo lee launch/03G-commercial-store-migration-plan.md y comprueba que las rutas
// citadas existen en el repo. No hay red, no hay fechas de reloj, no hay escritura.
// Uso:  node launch/tools/03g-check-migration-plan.mjs
// Sale con codigo 1 si falla algun control.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, "..", "..");
const DOC = path.join(MIG, "launch", "03G-commercial-store-migration-plan.md");
const text = fs.readFileSync(DOC, "utf8");
const lines = text.split("\n");

const results = [];
function check(id, ok, detail) {
  results.push({ id, ok, detail });
}

// ---------------------------------------------------------------- 1. estructura de los 17 pasos
const stepHeads = [];
lines.forEach((l, i) => {
  const m = l.match(/^### S(\d\d) · /);
  if (m) stepHeads.push({ n: Number(m[1]), line: i });
});
const expected = Array.from({ length: 17 }, (_, i) => i + 1);
check(
  "C01 pasos S01..S17 presentes y en orden",
  stepHeads.length === 17 && stepHeads.every((s, i) => s.n === expected[i]),
  `encabezados: ${stepHeads.map((s) => "S" + String(s.n).padStart(2, "0")).join(",")}`
);

const STEP_END = /^(### S\d\d · |## \d+\.)/;
function stepBody(n) {
  const start = stepHeads.find((s) => s.n === n).line;
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) {
    if (STEP_END.test(lines[j])) {
      end = j;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}
const pad = (n) => "S" + String(n).padStart(2, "0");

const required = [
  ["Qué se hace", /\*\*Qué se hace/],
  ["Quién", /\*\*Quién\./],
  ["Reversibilidad", /\*\*Reversibilidad\./],
  ["Depende de", /\*\*Depende de\./],
  ["Evidencia de éxito", /\*\*Evidencia de éxito/],
  ["Rollback", /\*\*Rollback\./],
  ["Riesgos conocidos", /\*\*Riesgos conocidos/],
  ["Lo aprendido", /\*\*Lo aprendido en la Dev Store que cambia el orden\./],
];
const missingLabels = [];
for (const s of stepHeads) {
  const body = stepBody(s.n);
  for (const [name, re] of required) {
    if (!re.test(body)) missingLabels.push(`${pad(s.n)}:${name}`);
  }
}
check("C02 cada paso lleva sus 8 campos", missingLabels.length === 0, missingLabels.length ? `faltan: ${missingLabels.join(", ")}` : "8 campos x 17 pasos");

// ---------------------------------------------------------------- 2. decisiones, lecciones, precondiciones
const dRows = new Set();
for (const l of lines) {
  const m = l.match(/^\| \*\*D(\d+)\*\* \|/);
  if (m) dRows.add(Number(m[1]));
}
check("C03 tabla de decisiones D1..D20", dRows.size === 20 && [...dRows].every((n) => n >= 1 && n <= 20), `filas: ${[...dRows].sort((a, b) => a - b).join(",")}`);

const dRefs = new Set();
for (const m of text.matchAll(/(?<![\w-])D(\d{1,3})(?![\w-])/g)) dRefs.add(Number(m[1]));
const badD = [...dRefs].filter((n) => n < 1 || n > 20);
check("C04 toda referencia Dn existe en la tabla", badD.length === 0, badD.length ? `fuera de rango: D${badD.join(", D")}` : `${dRefs.size} ids distintos referenciados`);

const lRows = new Set();
for (const l of lines) {
  const m = l.match(/^\| L(\d+) \|/);
  if (m) lRows.add(Number(m[1]));
}
const lContinuous = lRows.size > 0 && [...lRows].sort((a, b) => a - b).every((n, i) => n === i + 1);
check("C05 lecciones L1..Ln continuas", lContinuous, `n=${lRows.size}`);
const lRefs = new Set();
for (const m of text.matchAll(/(?<![\w-])L(\d{1,3})(?![\w-])/g)) lRefs.add(Number(m[1]));
const badL = [...lRefs].filter((n) => !lRows.has(n));
check("C06 toda referencia Ln existe en la tabla", badL.length === 0, badL.length ? `sin fila: L${badL.join(", L")}` : `${lRefs.size} ids distintos referenciados`);

const pt = new Set();
for (const l of lines) {
  const m = l.match(/^\| PT(\d) \|/);
  if (m) pt.add(Number(m[1]));
}
check("C07 precondiciones PT1..PT5", pt.size === 5, `filas: ${[...pt].join(",")}`);

// ---------------------------------------------------------------- 3. irreversibles en negrita, por paso
const boldsIn = (s) => [...s.matchAll(/\*\*([^*\n]+)\*\*/g)].map((m) => m[1]);
const irrevAll = boldsIn(text).filter((b) => /irreversible/i.test(b));
// paso -> lo que debe nombrar una marca en negrita con "irreversible" dentro de ese paso
const mustCover = [
  [1, /pa[ií]s|moneda|plan/i],
  [2, /mercado/i],
  [4, /handle/i],
  [9, /distribuci[oó]n personalizada/i],
  [11, /producci[oó]n/i],
  [15, /S15\.b|DNS/i],
  [16, /publicar el theme/i],
  [17, /apagar|desmantelar/i],
];
const uncovered = [];
for (const [n, re] of mustCover) {
  const marks = boldsIn(stepBody(n)).filter((b) => /irreversible/i.test(b));
  if (!marks.some((b) => re.test(b))) uncovered.push(pad(n));
}
check(
  "C08 irreversibles en negrita (con razón) en los pasos que los tienen",
  uncovered.length === 0,
  uncovered.length ? `sin marca: ${uncovered.join(", ")}` : `${irrevAll.length} marcas en negrita; ${mustCover.length} pasos verificados`
);

// ---------------------------------------------------------------- 4. rutas citadas
// Rutas que el plan cita pero que NO existen en shopify-migration/ y por que:
const knownAbsent = new Map([
  ["public/logo/radaelli-swimwear.png", "archivo del repo del sitio actual, fuera de shopify-migration"],
  ["app/favicon.ico", "archivo del repo del sitio actual, fuera de shopify-migration"],
  ["app/icon.png", "archivo del repo del sitio actual, fuera de shopify-migration"],
  ["app/apple-icon.png", "archivo del repo del sitio actual, fuera de shopify-migration"],
  ["scripts/capture-public-catalog.mjs", "propuesta de la auditoria de reproducibilidad (G07); no existe"],
  ["theme/03G-launch-rehearsal-report.md", "documento hermano citado por theme-src/README.md; no existia a las 18:00"],
  ["launch/03G-release-freeze.md", "lo genera launch/tools/03g-release-freeze.mjs"],
  ["content/media/03E-upload-ready-manifest.csv", "lo genera scripts/prepare-media-package.mjs"],
  ["import/inventory-template.csv", "propuesta de la auditoria de reproducibilidad; no existe"],
  ["templates/robots.txt.liquid", "archivo opcional que D17 permitiria crear; no existe en theme-src/templates"],
]);
const extRe = /\.(md|json|jsonl|csv|mjs|cjs|zip|html|liquid|toml|ico|png|txt)$/;
const paths = new Set();
for (const m of text.matchAll(/`([^`\n]+)`/g)) {
  let p = m[1].trim();
  if (/[<>*{}\s|=$]/.test(p) || p.startsWith("/") || p.startsWith("http") || p.startsWith("-")) continue;
  if (!p.includes("/")) continue;
  p = p.replace(/[.,;:]+$/, "");
  if (!extRe.test(p)) continue;
  paths.add(p);
}
const missing = [];
const absentNoted = [];
for (const p of [...paths].sort()) {
  const cands = [
    path.join(MIG, p),
    path.join(MIG, "theme-src", p),
    path.join(MIG, "launch", "evidence", p),
  ];
  if (cands.some((c) => fs.existsSync(c))) continue;
  if (knownAbsent.has(p)) {
    absentNoted.push(`${p} (${knownAbsent.get(p)})`);
    continue;
  }
  missing.push(p);
}
check(
  "C09 toda ruta de archivo citada existe (o figura como ausente conocida)",
  missing.length === 0,
  missing.length ? `no existen: ${missing.join(", ")}` : `${paths.size} rutas distintas; ${absentNoted.length} ausentes conocidas`
);
// las "ausentes conocidas" deben seguir ausentes: si aparecen, hay que revisar el texto del plan
const nowExist = [...knownAbsent.keys()].filter(
  (p) => !p.startsWith("public/") && !p.startsWith("app/") && fs.existsSync(path.join(MIG, p))
);
check("C10 las ausentes conocidas siguen ausentes (si no, actualizar el plan)", nowExist.length === 0, nowExist.length ? `ya existen: ${nowExist.join(", ")}` : "ok");

// ---------------------------------------------------------------- 5. datos que no deben aparecer
const bad = [];
if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text)) bad.push("correo electrónico");
if (/(?<![\w.,$])57\d{10}(?![\w.,])/.test(text) || /(?<![\w.,$])3\d{9}(?![\w.,])/.test(text)) bad.push("teléfono");
if (/shpat_|shpss_|shpca_|sk_live|Bearer\s+[A-Za-z0-9]/.test(text)) bad.push("token");
if (/(pub|prv)_(prod|test)_[A-Za-z0-9]{6,}/.test(text)) bad.push("llave de Wompi");
if (/checkouts\/cn\/[A-Za-z0-9]{6,}/.test(text)) bad.push("URL de checkout con token");
if (/shopify\.com\/\d{5,}\//.test(text)) bad.push("ID de cuenta de Shopify");
if (/github\.com\/[\w-]+\/[\w-]+/.test(text)) bad.push("URL de repositorio");
check("C11 sin correos, teléfonos, tokens, llaves, URL de checkout ni IDs de cuenta", bad.length === 0, bad.length ? `encontrado: ${bad.join(", ")}` : "limpio");

// ---------------------------------------------------------------- 6. horas y fechas
const late = [];
for (const m of text.matchAll(/(?<![\w.])([01]?\d|2[0-3]):([0-5]\d)(?![\w:])/g)) {
  if (Number(m[1]) * 60 + Number(m[2]) > 18 * 60) late.push(m[0]);
}
check("C12 ninguna hora posterior a 18:00", late.length === 0, late.length ? `horas: ${late.join(", ")}` : "ok");
const lateDates = [...new Set([...text.matchAll(/\b(2026-\d{2}-\d{2})\b/g)].map((m) => m[1]))].filter((d) => d > "2026-09-29");
check("C13 ninguna fecha posterior a 2026-09-29", lateDates.length === 0, lateDates.length ? `fechas: ${lateDates.join(", ")}` : "ok");

// ---------------------------------------------------------------- 7. tablas bien formadas
function cols(row) {
  const stripped = row.replace(/`[^`]*`/g, "x");
  const inner = stripped.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner.split(/(?<!\\)\|/).length;
}
let badTables = 0;
let tables = 0;
let inFence = false;
let block = [];
const flush = () => {
  if (block.length >= 2) {
    tables++;
    const n = cols(block[0]);
    if (!/^\|[\s:|-]+\|$/.test(block[1].trim())) badTables++;
    else if (block.some((r) => cols(r) !== n)) badTables++;
  }
  block = [];
};
for (const l of lines) {
  if (/^\s*```/.test(l)) {
    inFence = !inFence;
    flush();
    continue;
  }
  if (!inFence && /^\|/.test(l)) block.push(l);
  else flush();
}
flush();
check("C14 tablas con columnas consistentes", badTables === 0, `${tables} tablas, ${badTables} con problemas`);

// ---------------------------------------------------------------- 8. etiquetas de evidencia
const tags = {
  MEDIDO: (text.match(/\[MEDIDO-03G/g) || []).length,
  DOC: (text.match(/\[DOC:/g) || []).length,
  INFERIDO: (text.match(/INFERIDO/g) || []).length,
  NOT_VERIFIED: (text.match(/NOT_VERIFIED/g) || []).length,
  PRACTICA: (text.match(/PRÁCTICA-GENERAL/g) || []).length,
};
check("C15 el documento usa las 5 etiquetas de evidencia", Object.values(tags).every((n) => n > 0), JSON.stringify(tags));

// ---------------------------------------------------------------- salida
let fail = 0;
for (const r of results) {
  if (!r.ok) fail++;
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.id} :: ${r.detail}`);
}
if (absentNoted.length) {
  console.log("INFO rutas citadas que no existen en shopify-migration/ (esperado):");
  for (const i of absentNoted) console.log("  - " + i);
}
console.log(
  `RESUMEN: ${lines.length} lineas, ${stepHeads.length} pasos, ${dRows.size} decisiones, ${lRows.size} lecciones, ${irrevAll.length} marcas de irreversible; ${results.length - fail}/${results.length} controles OK`
);
process.exit(fail ? 1 : 0);
