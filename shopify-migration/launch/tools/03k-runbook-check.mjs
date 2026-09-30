#!/usr/bin/env node
/**
 * 03K (workstream I) — verifica el procedimiento de arranque de la tienda final (launch/03K-clean-store-bootstrap-runbook.md).
 *
 *   node launch/tools/03k-runbook-check.mjs [archivo.md]      # valida (exit 1 si algo falla)
 *   node launch/tools/03k-runbook-check.mjs --self-test
 *
 * Controles:
 *   B1 exactamente 15 pasos P01..P15, en orden, cada uno con título "## Pxx — ..."
 *   B2 cada paso trae los 6 campos, no vacíos: Quién, Herramienta, Evidencia, Criterio PASS, Rollback, Estado
 *   B3 todo archivo del repositorio citado entre comillas invertidas existe (rutas con "/" y extensión; se ignoran marcadores <...>, URL y comandos npx/npm)
 *   B4 el Estado de cada paso usa solo etiquetas de la clasificación de 03K (FINAL-STORE ONLY, OWNER DECISION, OWNER AUTH/OAUTH, BILLING/PLAN, LEGAL DATA, FINAL CUTOVER, OPTIONAL/DEFERRABLE, DONE, PREP_DONE)
 *   B5 sin secretos ni valores inventados: ningún patrón de llave/token/NIT/teléfono, y los datos que faltan aparecen como <marcador> o PENDING_OWNER
 *   B6 las etiquetas de Wompi y Envío dicen FINAL-STORE ONLY y nunca piden instalar nada en la Dev Store
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const FIELDS = ["Quién", "Herramienta", "Evidencia", "Criterio PASS", "Rollback", "Estado"];
const LABELS = ["FINAL-STORE ONLY", "OWNER DECISION", "OWNER AUTH/OAUTH", "BILLING/PLAN", "LEGAL DATA", "FINAL CUTOVER", "OPTIONAL/DEFERRABLE", "DONE", "PREP_DONE"];
const SECRET = /shp(?:at|ss|ca|pa)_[A-Za-z0-9]{8,}|\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{8,}|\b(?:pub|prv)_(?:prod|test|stagtest)_[A-Za-z0-9]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\bNIT\b\s*[:.]?\s*\d{6,}|\b3\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|wa\.me\/57\d{6,}/i;

export function evaluate(md, exists = (p) => fs.existsSync(path.join(ROOT, p))) {
  const res = [];
  const check = (id, name, ok, detail = "") => res.push({ id, name, ok, detail });
  const parts = md.split(/^## (P\d\d) — /m);
  const steps = [];
  for (let i = 1; i < parts.length; i += 2) steps.push({ id: parts[i], body: parts[i + 1] });
  const ids = steps.map((s) => s.id);
  const want = Array.from({ length: 15 }, (_, i) => `P${String(i + 1).padStart(2, "0")}`);
  check("B1", "15 pasos P01..P15 en orden", JSON.stringify(ids) === JSON.stringify(want), ids.join(","));

  const missing = [];
  const fieldOf = (body, f) => {
    const m = body.match(new RegExp(`^- \\*\\*${f}:\\*\\*\\s*(.+)$`, "m"));
    return m ? m[1].trim() : "";
  };
  for (const s of steps) for (const f of FIELDS) if (fieldOf(s.body, f).length < 8) missing.push(`${s.id}.${f}`);
  check("B2", "cada paso trae los 6 campos no vacíos", missing.length === 0, missing.join(", "));

  const badPaths = [];
  let cited = 0;
  for (const m of md.matchAll(/`([^`\s]+)`/g)) {
    const t = m[1].replace(/[),.;:]+$/, "");
    if (/^https?:|^<|^npx|^npm|^node$|^--/.test(t) || t.includes("<") || t.includes("*") || t.includes("{")) continue;
    if (!/\//.test(t) || !/\.[a-z0-9]{2,5}$/i.test(t)) continue;
    if (/^(?:\/|[a-z]+:)/i.test(t)) continue; // rutas de la tienda (/pages/...), URL
    cited++;
    if (!exists(t)) badPaths.push(t);
  }
  check("B3", `todo archivo citado existe (${cited} rutas)`, badPaths.length === 0, [...new Set(badPaths)].join(", "));

  const badState = [];
  for (const s of steps) {
    const st = fieldOf(s.body, "Estado");
    const found = LABELS.filter((l) => st.includes(l));
    if (found.length === 0) badState.push(`${s.id}: sin etiqueta de la clasificación`);
  }
  check("B4", "el Estado usa etiquetas de la clasificación 03K", badState.length === 0, badState.join("; "));

  check("B5", "sin secretos ni valores inventados", !SECRET.test(md) && /PENDING_OWNER/.test(md) && /<tienda-final>/.test(md), SECRET.test(md) ? "patrón sensible en el texto" : "faltan marcadores");

  const shipping = steps.find((s) => s.id === "P09");
  const pay = steps.find((s) => s.id === "P10");
  const okB6 = shipping && pay && /FINAL-STORE ONLY/.test(fieldOf(shipping.body, "Estado")) && /FINAL-STORE ONLY/.test(fieldOf(pay.body, "Estado")) && /No se contrata ni se instala nada en la Dev Store\./.test(shipping.body);
  check("B6", "envío y Wompi = FINAL-STORE ONLY, sin instalar nada en la Dev Store", !!okB6, "");
  return res;
}

function selfTest() {
  const md = fs.readFileSync(path.join(ROOT, "launch/03K-clean-store-bootstrap-runbook.md"), "utf8");
  const base = evaluate(md);
  const baseFails = base.filter((r) => !r.ok).length;
  const mut = [
    ["B1", (s) => s.replace("## P07 — ", "## P7 — ")],
    ["B2", (s) => s.replace(/^- \*\*Rollback:\*\* .*$/m, "- **Rollback:** -")],
    ["B3", (s) => s + "\n- ver `launch/no-existe-03k.md`\n"],
    ["B4", (s) => s.replace(/^- \*\*Estado:\*\* `FINAL-STORE ONLY`.*$/m, "- **Estado:** pendiente de mirar")],
    // Cadena sintética armada en dos partes para que el escáner de secretos del repo no la confunda con una llave real.
    ["B5", (s) => s + "\nllave pub_" + "test_" + "abcdef" + "1234567890\n"],
    ["B6", (s) => s.replace(/(## P10 — [\s\S]*?- \*\*Estado:\*\* )`FINAL-STORE ONLY`/, "$1`OWNER AUTH/OAUTH`")],
  ];
  let detected = 0;
  for (const [id, f] of mut) {
    const r = evaluate(f(md)).find((x) => x.id === id);
    if (r && !r.ok) detected++;
    else console.log("NO DETECTADO:", id);
  }
  console.log(`self-test: base ${baseFails === 0 ? "PASS" : "FAIL(" + baseFails + ")"}; mutantes detectados ${detected}/${mut.length}`);
  process.exit(baseFails === 0 && detected === mut.length ? 0 : 1);
}

if (process.argv[1] && process.argv[1].endsWith("03k-runbook-check.mjs")) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    const file = process.argv.slice(2).find((a) => !a.startsWith("--")) || "launch/03K-clean-store-bootstrap-runbook.md";
    const res = evaluate(fs.readFileSync(path.join(ROOT, file), "utf8"));
    for (const r of res) console.log(`[${r.ok ? "PASS" : "FAIL"}] ${r.id} ${r.name}${!r.ok && r.detail ? "\n        " + r.detail : ""}`);
    const fails = res.filter((r) => !r.ok).length;
    console.log(`\nRESULTADO: ${fails === 0 ? "PASS" : "FAIL"} -- ${res.length - fails}/${res.length} controles`);
    process.exit(fails ? 1 : 0);
  }
}
