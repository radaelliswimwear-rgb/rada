#!/usr/bin/env node
// 03K (workstream J) — clasifica las 32 filas de launch/03I-blocker-matrix.json en las 8 categorías de 03K y genera launch/03K-blocker-matrix.md.
// Sin red, sin reloj: misma entrada -> misma salida.
//
//   node launch/tools/03k-blocker-classify.mjs            # valida y escribe el .md
//   node launch/tools/03k-blocker-classify.mjs --check    # valida y comprueba que el .md está al día
//   node launch/tools/03k-blocker-classify.mjs --selftest # autoprueba con clasificaciones rotas a propósito
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const OWNER_CLASSES = ["OWNER DECISION", "OWNER AUTH/OAUTH", "BILLING/PLAN", "LEGAL DATA", "FINAL CUTOVER"];
const ORDER = ["DONE", "FINAL-STORE ONLY", "OWNER DECISION", "OWNER AUTH/OAUTH", "BILLING/PLAN", "LEGAL DATA", "FINAL CUTOVER", "OPTIONAL/DEFERRABLE"];

export function validate(matrix, cls, exists = (p) => fs.existsSync(path.join(root, p))) {
  const errs = [];
  const mById = new Map(matrix.items.map((i) => [i.id, i]));
  const cById = new Map();
  for (const it of cls.items) {
    if (cById.has(it.id)) errs.push(`id repetido: ${it.id}`);
    cById.set(it.id, it);
    if (!mById.has(it.id)) errs.push(`${it.id}: no existe en la matriz de 03I`);
    if (!ORDER.includes(it.class)) errs.push(`${it.id}: clase inválida (${it.class})`);
    for (const a of it.also || []) {
      if (!ORDER.includes(a)) errs.push(`${it.id}: 'also' inválida (${a})`);
      if (a === it.class) errs.push(`${it.id}: 'also' repite la clase`);
      if (a === "DONE") errs.push(`${it.id}: DONE no puede ser secundaria`);
    }
    if (!String(it.state || "").trim()) errs.push(`${it.id}: state vacío`);
    if (it.class === "DONE") {
      if (!it.evidence) errs.push(`${it.id}: DONE sin evidencia`);
      else if (!it.evidence.startsWith("git:") && !exists(it.evidence)) errs.push(`${it.id}: la evidencia ${it.evidence} no existe`);
      if (it.owner_ask) errs.push(`${it.id}: DONE no debe pedir nada a la dueña`);
    }
    if (OWNER_CLASSES.includes(it.class) && !String(it.owner_ask || "").trim() && !(it.class === "FINAL CUTOVER" && !mById.get(it.id)?.ownerWhy?.length)) errs.push(`${it.id}: clase de la dueña sin owner_ask`);
  }
  for (const id of mById.keys()) if (!cById.has(id)) errs.push(`fila de 03I sin clasificar: ${id}`);

  const batchIds = new Set();
  for (const b of cls.owner_batch || []) for (const id of b.ids) {
    batchIds.add(id);
    const c = cById.get(id);
    if (!c) errs.push(`lote: ${id} no existe`);
    else if (c.class === "DONE" || c.class === "OPTIONAL/DEFERRABLE") errs.push(`lote: ${id} es ${c.class} y no debe pedirse`);
  }
  // Toda fila que bloquea el lanzamiento, no está hecha y necesita a la dueña, aparece en el lote.
  for (const it of cls.items) {
    const m = mById.get(it.id);
    if (!m) continue;
    if (m.blocks === "LAUNCH" && it.class !== "DONE" && m.ownerRequired !== "NO" && !batchIds.has(it.id)) errs.push(`bloquea el lanzamiento y necesita a la dueña pero no está en el lote: ${it.id}`);
  }
  const ns = (cls.owner_batch || []).map((b) => b.n);
  ns.forEach((n, i) => { if (n !== i + 1) errs.push(`lote: numeración no consecutiva (${n})`); });
  if (!cls.tiny_answer || !cls.tiny_answer.ask) errs.push("falta tiny_answer (AC-08)");
  return errs;
}

export function summarize(matrix, cls) {
  const mById = new Map(matrix.items.map((i) => [i.id, i]));
  const counts = Object.fromEntries(ORDER.map((c) => [c, []]));
  for (const it of cls.items) counts[it.class].push(it.id);
  const launch = cls.items.filter((i) => mById.get(i.id)?.blocks === "LAUNCH" && i.class !== "DONE").map((i) => i.id);
  const alsoNeedsOwner = cls.items.filter((i) => i.class === "FINAL-STORE ONLY" && (i.also || []).some((a) => OWNER_CLASSES.includes(a))).map((i) => i.id);
  return { counts, launch, alsoNeedsOwner };
}

export function render(matrix, cls) {
  const s = summarize(matrix, cls);
  const L = [];
  L.push("# 03K — Matriz de bloqueos reclasificada (mínimo de la dueña)");
  L.push("");
  L.push("*Generada por `launch/tools/03k-blocker-classify.mjs` desde `launch/03K-blocker-classification.json` (fuente única) y `launch/03I-blocker-matrix.json`. No editar a mano: editar el JSON y volver a generar.*");
  L.push("");
  L.push("## 1. Resultado");
  L.push("");
  L.push(`- Filas: **${cls.items.length}** (las mismas 32 de 03I), cada una en exactamente **una** categoría.`);
  L.push(`- **Bloquean el lanzamiento y siguen abiertas: ${s.launch.length}** (${s.launch.join(", ")}); las otras 2 que bloqueaban (D5 y G03, el respaldo) quedaron **DONE** en 03K.`);
  L.push("- Ningún ítem de la tabla depende de trabajo autónomo que Claude aún pueda hacer: lo que queda es de la dueña, de la tienda final o del corte.");
  L.push("");
  L.push("| Categoría | Filas | Ids |");
  L.push("|---|---:|---|");
  for (const c of ORDER) L.push(`| **${c}** | ${s.counts[c].length} | ${s.counts[c].join(", ") || "—"} |`);
  L.push(`| **Total** | **${cls.items.length}** | |`);
  L.push("");
  L.push("Leyenda:");
  L.push("");
  for (const c of ORDER) L.push(`- **${c}**: ${cls.classes[c]}`);
  L.push("");
  L.push("## 2. Lote mínimo de la dueña (consolidado, en orden)");
  L.push("");
  L.push("Una sola lista, agrupada por momento. Nada de esto se le pide antes de que ella regrese y decida empezar.");
  L.push("");
  L.push("| # | Cuándo | Qué | Ids |");
  L.push("|---:|---|---|---|");
  for (const b of cls.owner_batch) L.push(`| ${b.n} | ${b.when} | ${b.ask} | ${b.ids.join(", ")} |`);
  L.push("");
  L.push(`**Respuesta mínima suelta (${cls.tiny_answer.id}):** ${cls.tiny_answer.ask}`);
  L.push("");
  L.push("Fuera del lote (opcionales o diferibles, no bloquean): " + s.counts["OPTIONAL/DEFERRABLE"].join(", ") + ".");
  L.push("");
  L.push("## 3. Detalle por fila");
  L.push("");
  L.push("| Id | Categoría | También | ¿Bloquea el lanzamiento? | Estado tras 03K | Qué necesita de la dueña |");
  L.push("|---|---|---|---|---|---|");
  const mById = new Map(matrix.items.map((i) => [i.id, i]));
  const esc = (t) => String(t || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  for (const it of cls.items) {
    const m = mById.get(it.id);
    const blocks = it.class === "DONE" ? "No (hecho)" : m.blocks === "LAUNCH" ? "Sí" : m.blocks === "FEATURE" ? "Solo una función" : "No";
    L.push(`| **${it.id}** | ${it.class} | ${(it.also || []).join(", ") || "—"} | ${blocks} | ${esc(it.state)} | ${esc(it.owner_ask) || "—"} |`);
  }
  L.push("");
  return L.join("\n");
}

function selftest(matrix, cls) {
  const clone = () => JSON.parse(JSON.stringify(cls));
  const cases = [
    ["fila sin clasificar", (c) => { c.items.pop(); }],
    ["clase inválida", (c) => { c.items[0].class = "PENDIENTE"; }],
    ["DONE sin evidencia", (c) => { delete c.items.find((i) => i.id === "H-01").evidence; }],
    ["DONE con evidencia inexistente", (c) => { c.items.find((i) => i.id === "H-01").evidence = "no/existe-03k.md"; }],
    ["clase de la dueña sin owner_ask", (c) => { delete c.items.find((i) => i.id === "D1").owner_ask; }],
    ["id repetido", (c) => { c.items.push({ ...c.items[0] }); }],
    ["lote pide un opcional", (c) => { c.owner_batch[0].ids.push("C2"); }],
    ["bloqueo abierto fuera del lote", (c) => { c.owner_batch = c.owner_batch.filter((b) => !b.ids.includes("D3")); c.owner_batch.forEach((b, i) => { b.n = i + 1; }); }],
    ["id inexistente en el lote", (c) => { c.owner_batch[0].ids.push("ZZ-99"); }],
    ["numeración rota", (c) => { c.owner_batch[2].n = 9; }],
    ["also repite la clase", (c) => { c.items[0].also = [c.items[0].class]; }],
    ["sin respuesta mínima", (c) => { delete c.tiny_answer; }],
  ];
  const base = validate(matrix, cls);
  let ok = 0;
  for (const [name, f] of cases) {
    const c = clone();
    f(c);
    if (validate(matrix, c).length > 0) ok++;
    else console.log("NO DETECTADO:", name);
  }
  console.log(`selftest: base ${base.length === 0 ? "PASS" : "FAIL (" + base.length + ")"}; casos rotos detectados ${ok}/${cases.length}`);
  process.exit(base.length === 0 && ok === cases.length ? 0 : 1);
}

if (process.argv[1] && process.argv[1].endsWith("03k-blocker-classify.mjs")) {
  const matrix = JSON.parse(read("launch/03I-blocker-matrix.json"));
  const cls = JSON.parse(read("launch/03K-blocker-classification.json"));
  if (process.argv.includes("--selftest")) selftest(matrix, cls);
  const errs = validate(matrix, cls);
  if (errs.length) {
    console.log("FALLA:\n - " + errs.join("\n - "));
    process.exit(1);
  }
  const md = render(matrix, cls);
  const file = path.join(root, "launch/03K-blocker-matrix.md");
  if (process.argv.includes("--check")) {
    const cur = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n") : "";
    if (cur !== md) { console.log("03K-blocker-matrix.md NO está al día"); process.exit(1); }
    console.log("03K-blocker-matrix.md al día");
  } else fs.writeFileSync(file, md);
  const s = summarize(matrix, cls);
  console.log(JSON.stringify({ filas: cls.items.length, porCategoria: Object.fromEntries(ORDER.map((c) => [c, s.counts[c].length])), bloqueanLanzamiento: s.launch.length, loteDeLaDueña: cls.owner_batch.length }));
}
