// 03I — Matriz determinista de bloqueos: valida launch/03I-blocker-matrix.json contra las fuentes de verdad
// (lote de la dueña, gates de aceptación, auditoría de brechas, paridad de Home, decisiones del plan) y genera
// launch/03I-blocker-matrix.md y launch/03I-blocker-matrix.csv. Sin red, sin fecha de reloj: misma entrada → misma salida.
//
// Uso: node launch/tools/03i-blocker-matrix.mjs            (valida, escribe md/csv y muestra el resumen)
//      node launch/tools/03i-blocker-matrix.mjs --check    (valida y comprueba que md/csv están al día)
//      node launch/tools/03i-blocker-matrix.mjs --selftest (autoprueba con matrices rotas a propósito)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const RESOLVED_03H = ['HP-03', 'HP-07', 'HP-08', 'HP-09', 'HP-20', 'HP-22'];
const SH = ['SH-D1', 'SH-D2', 'SH-D3', 'SH-D4', 'SH-D5'];
const ENUMS = {
  claudeNow: ['AVAILABLE', 'PREP_DONE', 'AFTER_OK', 'NONE', 'DONE_03I', 'DEFERRED'],
  ownerRequired: ['YES', 'OK_ONLY', 'NO'],
  blocks: ['LAUNCH', 'FEATURE', 'DEFERRABLE', 'OPTIONAL'],
  lane: ['LEAD', 'PARALLEL_OK', 'THEN', 'NONE'],
  ownerWhy: ['ACTION', 'DECISION', 'DATA', 'OAUTH', 'CREDENTIAL', 'IRREVERSIBLE', 'LEGAL', 'OK'],
};
const HARD_OWNER = ['OAUTH', 'CREDENTIAL', 'IRREVERSIBLE', 'LEGAL'];
const FIELDS = ['id', 'group', 'lane', 'order', 'title', 'state', 'dependency', 'claudeNow', 'claudeNowNote', 'ownerRequired', 'ownerWhy', 'blocks', 'waiver', 'verification', 'rollback', 'covers', 'gates'];

// Identificadores requeridos, tomados de los documentos fuente (no de una lista escrita a mano).
export function requiredIds() {
  const owner = [...read('theme/03F-owner-actions-minimal.md').matchAll(/^\| \*\*([A-D][0-9]+)\*\*/gm)].map((m) => m[1]);
  const hp = [...read('theme/03G-home-parity.md').matchAll(/^\| (HP-[0-9]{2}) \|/gm)].map((m) => m[1]).filter((x) => !RESOLVED_03H.includes(x));
  const gaps = [...new Set([...read('launch/03G-reproducibility-gap-audit.md').matchAll(/^\| (G[0-9]{2}) \|/gm)].map((m) => m[1]))];
  const plan = [...read('launch/03G-commercial-store-migration-plan.md').matchAll(/^\| \*\*(D(?:[6-9]|1[0-9]|20))\*\* \|/gm)].map((m) => 'P' + m[1]);
  const gates = [...read('launch/03G-launch-acceptance-checklist.md').matchAll(/^\| \*\*(AC-[0-9]{2})\*\* \|.*\| \*\*([A-Z ]+)\*\* \|\s*$/gm)].map((m) => ({ id: m[1], status: m[2] }));
  return {
    ids: [...new Set([...owner, ...hp, ...gaps, ...plan, ...SH, 'H-01'])].sort(),
    gates,
    owner, hp, gaps, plan,
  };
}

export function validate(data, req) {
  const errs = [];
  const items = data.items || [];
  const byId = new Map();
  for (const it of items) {
    if (byId.has(it.id)) errs.push(`id repetido: ${it.id}`);
    byId.set(it.id, it);
    for (const f of FIELDS) if (!(f in it)) errs.push(`${it.id}: falta el campo ${f}`);
    for (const [f, vals] of Object.entries({ claudeNow: ENUMS.claudeNow, ownerRequired: ENUMS.ownerRequired, blocks: ENUMS.blocks, lane: ENUMS.lane })) {
      if (!vals.includes(it[f])) errs.push(`${it.id}: ${f} inválido (${it[f]})`);
    }
    for (const w of it.ownerWhy || []) if (!ENUMS.ownerWhy.includes(w)) errs.push(`${it.id}: ownerWhy inválido (${w})`);
    for (const f of ['state', 'dependency', 'verification', 'rollback', 'title']) if (!String(it[f] || '').trim()) errs.push(`${it.id}: ${f} vacío`);
    // Coherencia: no se relabela una acción solo-de-la-dueña como autónoma.
    if ((it.ownerWhy || []).some((w) => HARD_OWNER.includes(w))) {
      if (it.ownerRequired !== 'YES') errs.push(`${it.id}: motivo ${it.ownerWhy.join('/')} exige ownerRequired = YES`);
      if (!['NONE', 'AFTER_OK', 'PREP_DONE'].includes(it.claudeNow)) errs.push(`${it.id}: acción de la dueña marcada como trabajo de Claude (${it.claudeNow})`);
    }
    if (it.ownerRequired === 'NO' && (it.ownerWhy || []).length) errs.push(`${it.id}: ownerRequired = NO pero trae motivos`);
    if (it.ownerRequired !== 'NO' && !(it.ownerWhy || []).length) errs.push(`${it.id}: ownerRequired = ${it.ownerRequired} sin motivo`);
    if (it.ownerRequired === 'OK_ONLY' && !(it.ownerWhy || []).every((w) => w === 'OK')) errs.push(`${it.id}: OK_ONLY solo admite el motivo OK`);
    if (it.claudeNow === 'DEFERRED') {
      if (!String(it.deferReason || '').trim()) errs.push(`${it.id}: DEFERRED sin deferReason`);
      if (it.ownerRequired !== 'NO') errs.push(`${it.id}: DEFERRED es trabajo sin la dueña (ownerRequired debe ser NO)`);
    }
    if (it.claudeNow === 'AFTER_OK' && it.ownerRequired === 'NO') errs.push(`${it.id}: AFTER_OK sin dueña no tiene sentido`);
    if (it.blocks === 'LAUNCH' && it.claudeNow === 'DONE_03I') errs.push(`${it.id}: bloquea el lanzamiento pero figura cerrado`);
    if (it.blocks === 'LAUNCH' && !Array.isArray(it.gates)) errs.push(`${it.id}: gates debe ser un arreglo`);
  }
  // Orden recomendado: enteros únicos y consecutivos; A1 → B1 al frente.
  const ordered = items.filter((i) => Number.isInteger(i.order)).sort((a, b) => a.order - b.order);
  ordered.forEach((it, k) => { if (it.order !== k + 1) errs.push(`orden no consecutivo en ${it.id} (${it.order}, se esperaba ${k + 1})`); });
  if (ordered[0]?.id !== 'A1' || ordered[1]?.id !== 'B1') errs.push('la secuencia principal debe empezar por A1 → B1');
  const b1 = byId.get('B1');
  if (b1 && !/A1/.test(b1.dependency)) errs.push('B1 debe declarar A1 como dependencia');
  for (const it of ordered) if (!['A1', 'B1'].includes(it.id) && it.order < 3) errs.push(`${it.id}: no puede ir antes de A1 y B1`);
  // Cobertura: cada identificador requerido aparece como id o en covers.
  const covered = new Set();
  for (const it of items) { covered.add(it.id); for (const c of it.covers || []) covered.add(c); }
  for (const id of req.ids) if (!covered.has(id)) errs.push(`identificador sin fila: ${id}`);
  // Cobertura de compuertas: toda compuerta que no está en PASS aparece en la lista `gates` de alguna fila.
  const gateCovered = new Set(items.flatMap((i) => i.gates || []));
  for (const g of req.gates) if (g.status !== 'PASS' && !gateCovered.has(g.id)) errs.push(`compuerta sin fila: ${g.id} (${g.status})`);
  for (const g of gateCovered) if (!req.gates.some((x) => x.id === g)) errs.push(`compuerta inexistente: ${g}`);
  return errs;
}

export function summarize(data) {
  const items = data.items;
  const count = (fn) => items.filter(fn).length;
  const launch = items.filter((i) => i.blocks === 'LAUNCH');
  const availableNow = items.filter((i) => i.claudeNow === 'AVAILABLE');
  return {
    total: items.length,
    launchBlockers: launch.length,
    launchOwnerYes: launch.filter((i) => i.ownerRequired === 'YES').length,
    launchOkOnly: launch.filter((i) => i.ownerRequired === 'OK_ONLY').length,
    launchNoOwner: launch.filter((i) => i.ownerRequired === 'NO').length,
    launchWaivable: launch.filter((i) => i.waiver).length,
    irreversibleOrCredentialed: count((i) => (i.ownerWhy || []).some((w) => HARD_OWNER.includes(w))),
    feature: count((i) => i.blocks === 'FEATURE'),
    deferrable: count((i) => i.blocks === 'DEFERRABLE'),
    optional: count((i) => i.blocks === 'OPTIONAL'),
    deferredClaudeWork: items.filter((i) => i.claudeNow === 'DEFERRED').map((i) => i.id),
    availableNow: availableNow.map((i) => i.id),
    exhausted: availableNow.length === 0,
  };
}

const cell = (v) => String(Array.isArray(v) ? v.join(', ') : v ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const csvCell = (v) => { const s = String(Array.isArray(v) ? v.join(' | ') : v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export function render(data, req) {
  const s = summarize(data);
  const L = [];
  const L2 = data._meta.legend;
  L.push('# 03I — Matriz de bloqueos (independiente vs. solo de la dueña)');
  L.push('');
  L.push('*Generada por `launch/tools/03i-blocker-matrix.mjs` desde `launch/03I-blocker-matrix.json` (fuente única). No editar a mano: editar el JSON y volver a generar.*');
  L.push('');
  L.push(`**Fecha de los datos:** ${data._meta.date}. **Fuentes:** ${data._meta.sources.join('; ')}.`);
  L.push('');
  L.push('## 1. Resultado');
  L.push('');
  L.push(`- Filas: **${s.total}**. Cubre ${req.owner.length} acciones/decisiones del lote (${req.owner.join(', ')}), ${req.hp.length} hallazgos de paridad de Home aún abiertos, ${req.gaps.length} brechas de reproducibilidad, ${req.plan.length} decisiones del plan (PD6 a PD20), ${SH.length} decisiones del runbook de envío (SH-D1 a SH-D5), H-01, y **${req.gates.filter((g) => g.status !== 'PASS').length} compuertas de aceptación** no aprobadas (las ${req.gates.filter((g) => g.status === 'PASS').length} en PASS: ${req.gates.filter((g) => g.status === 'PASS').map((g) => g.id).join(', ')}).`);
  L.push(`- **Bloquean el lanzamiento: ${s.launchBlockers}** filas → ${s.launchOwnerYes} necesitan a la dueña (acción, decisión, dato, OAuth, credencial o cambio irreversible), ${s.launchOkOnly} solo su OK (lo demás lo hace Claude) y ${s.launchNoOwner} no la necesitan (se miden o congelan sobre el RC final). ${s.launchWaivable} de ellas tienen una salida por decisión escrita de la dueña.`);
  L.push(`- Bloquean solo una función: ${s.feature}. Diferibles: ${s.deferrable}. Opcionales/trazabilidad: ${s.optional}.`);
  L.push(`- Filas con motivo OAuth, credencial, irreversible o legal (Claude no puede hacerlas): **${s.irreversibleOrCredentialed}**.`);
  L.push(`- Trabajo seguro de Claude **diferido a propósito** (no acorta ni desbloquea el lote): ${s.deferredClaudeWork.join(', ') || 'ninguno'}.`);
  L.push(`- Trabajo seguro e independiente **disponible hoy** que acorte o desbloquee el lote: **${s.availableNow.length ? s.availableNow.join(', ') : 'ninguno'}**.`);
  L.push('');
  L.push(`**AUTONOMOUS_PRE_OWNER_WORK_EXHAUSTED = ${s.exhausted ? 'YES' : 'NO'}**`);
  L.push('');
  L.push('## 2. Orden recomendado de la dueña (por valor de desbloqueo y dependencia)');
  L.push('');
  L.push('Una sola lista, una acción a la vez. **A1 → B1 → validación dependiente (la hace Claude)** y luego el resto. Las filas `PARALLEL_OK` solo cuestan un OK de ~1 minuto y liberan trabajo que Claude corre mientras la dueña sigue con la secuencia principal.');
  L.push('');
  L.push('| # | ID | Carril | Qué | ¿Quién? | Bloquea |');
  L.push('|---|---|---|---|---|---|');
  for (const it of data.items.filter((i) => Number.isInteger(i.order)).sort((a, b) => a.order - b.order)) {
    L.push(`| ${it.order} | **${it.id}** | ${it.lane} | ${cell(it.title)} | ${it.ownerRequired}${it.ownerWhy.length ? ' (' + it.ownerWhy.join(', ') + ')' : ''} | ${it.blocks}${it.waiver ? ' (waiver)' : ''} |`);
  }
  L.push('');
  L.push('## 3. Matriz completa');
  L.push('');
  L.push(`Leyenda — **¿Claude hoy?** ${Object.entries(L2.claudeNow).map(([k, v]) => `\`${k}\`: ${v}`).join(' · ')}. **¿Dueña?** ${Object.entries(L2.ownerRequired).map(([k, v]) => `\`${k}\`: ${v}`).join(' · ')}. **Bloquea:** ${Object.entries(L2.blocks).map(([k, v]) => `\`${k}\`: ${v}`).join(' · ')}.`);
  L.push('');
  for (const it of data.items) {
    L.push(`### ${it.id} — ${it.title}`);
    L.push('');
    L.push('| Campo | Valor |');
    L.push('|---|---|');
    L.push(`| Estado actual | ${cell(it.state)} |`);
    L.push(`| Dependencia exacta | ${cell(it.dependency)} |`);
    L.push(`| ¿Claude puede hacer algo seguro hoy? | \`${it.claudeNow}\`${it.claudeNowNote ? ' — ' + cell(it.claudeNowNote) : ''}${it.deferReason ? ' — **Por qué se difiere:** ' + cell(it.deferReason) : ''} |`);
    L.push(`| ¿La dueña es imprescindible? | \`${it.ownerRequired}\`${it.ownerWhy.length ? ' — ' + it.ownerWhy.join(', ') : ''} |`);
    L.push(`| ¿Qué bloquea? | \`${it.blocks}\`${it.waiver ? ' — Salida: ' + cell(it.waiver) : ''} |`);
    L.push(`| Verificación posterior | ${cell(it.verification)} |`);
    L.push(`| Rollback / recuperación | ${cell(it.rollback)} |`);
    L.push(`| Cubre | ${cell(it.covers.length ? it.covers : '—')} · Compuertas: ${cell(it.gates.length ? it.gates : '—')} |`);
    L.push('');
  }
  return L.join('\n');
}

export function renderCsv(data) {
  const header = FIELDS.concat(['deferReason']);
  return '﻿' + [header.join(','), ...data.items.map((it) => header.map((f) => csvCell(it[f])).join(','))].join('\r\n') + '\r\n';
}

function selftest() {
  const req = requiredIds();
  const good = JSON.parse(read('launch/03I-blocker-matrix.json'));
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL:', m); } };
  const clone = () => JSON.parse(JSON.stringify(good));
  ok(validate(good, req).length === 0, 'la matriz real debe validar sin errores: ' + validate(good, req).join(' ; '));
  const hasErr = (mut, needle) => { const d = clone(); mut(d); return validate(d, req).some((e) => e.includes(needle)); };
  const row = (d, id) => d.items.find((i) => i.id === id);
  ok(hasErr((d) => { d.items = d.items.filter((i) => i.id !== 'A1'); }, 'A1'), 'quitar A1 debe fallar');
  ok(hasErr((d) => { d.items = d.items.filter((i) => i.id !== 'D3'); }, 'G01'), 'sin D3 quedan G01/PD11 sin fila');
  ok(hasErr((d) => { row(d, 'A2').claudeNow = 'DONE_03I'; }, 'A2'), 'OTP marcado como trabajo de Claude debe fallar');
  ok(hasErr((d) => { row(d, 'B1').ownerRequired = 'OK_ONLY'; }, 'B1'), 'B1 con OAuth como OK_ONLY debe fallar');
  ok(hasErr((d) => { row(d, 'B4').claudeNow = 'DEFERRED'; row(d, 'B4').deferReason = 'x'; }, 'B4'), 'irreversible como DEFERRED debe fallar');
  ok(hasErr((d) => { row(d, 'REL-01').deferReason = ''; }, 'REL-01'), 'DEFERRED sin motivo debe fallar');
  ok(hasErr((d) => { row(d, 'A1').order = 5; }, 'orden'), 'romper el orden debe fallar');
  ok(hasErr((d) => { row(d, 'A1').order = 2; row(d, 'B1').order = 1; }, 'A1 → B1'), 'B1 antes que A1 debe fallar');
  ok(hasErr((d) => { row(d, 'B1').dependency = 'Ninguna'; }, 'B1 debe declarar'), 'B1 sin A1 como dependencia debe fallar');
  ok(hasErr((d) => { row(d, 'B3').gates = []; }, 'AC-34'), 'quitar la compuerta AC-34 de B3 debe fallar');
  ok(hasErr((d) => { row(d, 'A1').gates.push('AC-99'); }, 'AC-99'), 'compuerta inexistente debe fallar');
  ok(hasErr((d) => { row(d, 'A4').blocks = 'CRITICAL'; }, 'blocks'), 'enum inválido debe fallar');
  ok(hasErr((d) => { row(d, 'D4').rollback = ''; }, 'rollback'), 'rollback vacío debe fallar');
  ok(hasErr((d) => { d.items.push({ ...row(d, 'H-01') }); }, 'repetido'), 'id repetido debe fallar');
  ok(hasErr((d) => { row(d, 'G15').blocks = 'LAUNCH'; }, 'cerrado'), 'LAUNCH cerrado debe fallar');
  const av = clone(); row(av, 'HYG-01').claudeNow = 'AVAILABLE';
  ok(summarize(av).exhausted === false && summarize(av).availableNow.includes('HYG-01'), 'una fila AVAILABLE debe dar EXHAUSTED = NO');
  ok(summarize(good).exhausted === true, 'la matriz real debe dar EXHAUSTED = YES');
  ok(render(good, req) === render(clone(), req), 'la generación debe ser determinista');
  ok(renderCsv(good) === renderCsv(clone()), 'el CSV debe ser determinista');
  ok(req.gates.length === 35 && req.gates.filter((g) => g.status === 'PASS').length === 3, 'las 35 compuertas y 3 PASS deben salir del checklist');
  console.log(`03i-blocker-matrix selftest: ${pass} PASS / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    const req = requiredIds();
    const data = JSON.parse(read('launch/03I-blocker-matrix.json'));
    const errs = validate(data, req);
    if (errs.length) { console.log('MATRIZ INVÁLIDA:\n - ' + errs.join('\n - ')); process.exit(1); }
    const md = render(data, req).replace(/\s+$/, '') + '\n';
    const csv = renderCsv(data);
    if (process.argv.includes('--check')) {
      const same = fs.readFileSync(path.join(root, 'launch/03I-blocker-matrix.md'), 'utf8') === md && fs.readFileSync(path.join(root, 'launch/03I-blocker-matrix.csv'), 'utf8') === csv;
      console.log(same ? 'OK: md y csv al día' : 'FALLA: md/csv desactualizados; correr sin --check');
      process.exit(same ? 0 : 1);
    }
    fs.writeFileSync(path.join(root, 'launch/03I-blocker-matrix.md'), md);
    fs.writeFileSync(path.join(root, 'launch/03I-blocker-matrix.csv'), csv);
    const s = summarize(data);
    console.log(JSON.stringify(s));
    console.log(`AUTONOMOUS_PRE_OWNER_WORK_EXHAUSTED = ${s.exhausted ? 'YES' : 'NO'}`);
  }
}
