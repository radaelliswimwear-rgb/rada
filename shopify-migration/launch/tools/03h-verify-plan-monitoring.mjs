// 03H — revisión determinista y offline de las dos deudas de verificación de 03G, SIN agentes:
//   launch/03G-commercial-store-migration-plan.md y launch/03G-post-launch-monitoring.md
// Comprueba: (A) datos sin fuente (proveedores, planes, precios, TTL, IPs, dominios, correos, teléfonos);
// (B) cifras % y montos con fuente en el repo; (C) identificadores citados que existen;
// (D) dependencias del plan (existen, sin ciclos, adelantos declarados); (E) enlace de cada área de monitoreo a un rollback;
// (F) horas y fechas no posteriores a la revisión. Uso: node launch/tools/03h-verify-plan-monitoring.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(here, "..", "..");
const rd = (p) => fs.readFileSync(path.join(MIG, p), "utf8");
const plan = rd("launch/03G-commercial-store-migration-plan.md");
const mon = rd("launch/03G-post-launch-monitoring.md");
const cut = rd("launch/03G-cutover-runbook.md");
const rb = rd("launch/03G-rollback-plan.md");
const gap = rd("launch/03G-reproducibility-gap-audit.md");
const acc = rd("launch/03G-launch-acceptance-checklist.md");

let pass = 0;
let fail = 0;
const out = [];
const check = (name, ok, detail = "") => {
  ok ? pass++ : fail++;
  out.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " :: " + detail : ""}`);
};
const both = { plan, mon };

/* ---- A. datos sin fuente ---- */
const FLAGS = {
  "proveedor de DNS o registrador": /\b(GoDaddy|Cloudflare|Namecheap|Squarespace|Google Domains|Route ?53|Hostinger|Porkbun|NIC\.co|Wix)\b/i,
  "precio de plan de Shopify": /\b(Basic|Grow|Advanced|Plus)\b[^.\n|]{0,25}(USD ?\d|US\$ ?\d|\$ ?\d)/i,
  "monto en USD": /\b(USD|US\$)\s?\d/i,
  "TTL con cifra": /\bTTL\b[^.\n|]{0,40}\b\d+\s?(s|seg|segundos|min|minutos|h|horas)\b/i,
  "dirección IP": /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  "correo": /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/,
  "teléfono": /\+?57[\s-]?3\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/,
  "KPI o meta de negocio": /\b(KPI|meta de (ventas|conversi[oó]n)|objetivo de (ventas|conversi[oó]n)|tasa de conversi[oó]n (objetivo|meta|m[ií]nima))\b/i,
};
for (const [doc, text] of Object.entries(both)) {
  for (const [label, re] of Object.entries(FLAGS)) {
    const hits = text.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => re.test(l));
    // los KPI solo se aceptan si la línea dice que NO hay
    const bad = label.startsWith("KPI") ? hits.filter(([, l]) => !/(sin|no hay|no fija|ninguna|no inventa|no existen?|ni |sin inventar)/i.test(l)) : hits;
    check(`${doc}: sin ${label}`, bad.length === 0, bad.slice(0, 3).map(([n, l]) => `l${n}: ${l.slice(0, 90)}`).join(" | "));
  }
}
// dominios citados
const ALLOWED_DOMAINS = /(radaelliswimwear\.com|myshopify\.com|shopify\.com|shopify\.dev|wompi\.co|wompi\.com|github\.com|google\.com|googletagmanager\.com|facebook\.com|instagram\.com|tiktok\.com|schema\.org|cloudinary\.com|vercel\.app|vercel\.com|neon\.tech|example\.com|w3\.org|whatsapp\.com|wa\.me|unsplash\.com)/i;
for (const [doc, text] of Object.entries(both)) {
  const doms = [...new Set([...text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)].map((m) => m[1].toLowerCase()))];
  const unknown = doms.filter((d) => !ALLOWED_DOMAINS.test(d));
  check(`${doc}: todo dominio citado es conocido`, unknown.length === 0, unknown.join(", ") || `${doms.length} dominios`);
}

/* ---- B. cifras con fuente ---- */
const corpus = [
  "payments/03E-wompi-shopify-feasibility.md", "payments/03F-wompi-owner-runbook.md", "shipping/03F-owner-shipping-runbook.md", "shipping/03E-shipping-source-of-truth.md",
  "theme/03F-owner-actions-minimal.md", "theme/03F-owner-market-colombia-runbook.md", "analytics/03F-analytics-owner-runbook.md", "content/media/03F-media-owner-runbook.md",
  "launch/evidence/reference-docs/cost-comparison.md", "launch/evidence/reference-docs/migration-roadmap.md", "launch/evidence/reference-docs/data-migration.md",
  "launch/03G-product-parity.md", "launch/03G-collection-parity.md", "launch/03G-current-site-baseline.md", "launch/03G-checkout-precondition-audit.md", "launch/03G-responsive-sweep.md",
  "launch/03G-cutover-runbook.md", "launch/03G-rollback-plan.md", "launch/03G-reproducibility-gap-audit.md", "launch/03G-launch-acceptance-checklist.md",
  "theme/03F-performance-final.md", "theme/03E-checkout-baseline-report.md", "seo/03F-redirect-import-result.md", "seo/03E-redirect-plan.md",
].map((f) => { try { return rd(f); } catch { return ""; } }).join("\n");
const normNum = (s) => s.replace(/\s/g, "");
const pctIn = (t) => [...new Set([...t.matchAll(/(\d+(?:[.,]\d+)?) ?%/g)].map((m) => m[1]))];
for (const [doc, text] of Object.entries(both)) {
  const unsupported = pctIn(text).filter((n) => !new RegExp(`${n.replace(/[.,]/g, "[.,]")} ?%`).test(corpus));
  check(`${doc}: todo porcentaje aparece en otra fuente del repo`, unsupported.length === 0, unsupported.join(", ") || `${pctIn(text).length} porcentajes`);
  const amounts = [...new Set([...text.matchAll(/\$ ?(\d{1,3}(?:\.\d{3})+|\d{4,})/g)].map((m) => m[1]))];
  const catalog = rd("catalog/products-master.csv") + rd("catalog/variants-master.csv") + rd("launch/evidence/dev-products.jsonl");
  const unsupportedAmt = amounts.filter((a) => {
    const raw = a.replace(/\./g, "");
    return !corpus.includes(a) && !catalog.includes(raw) && !catalog.includes(a + ".00") && !catalog.includes(raw + ".00") && !corpus.includes(raw);
  });
  check(`${doc}: todo monto en pesos aparece en otra fuente del repo`, unsupportedAmt.length === 0, unsupportedAmt.slice(0, 8).join(", ") || `${amounts.length} montos`);
}

/* ---- C. identificadores citados ---- */
const defs = (text, re) => new Set([...text.matchAll(re)].map((m) => m[1]));
const uniq = (arr) => [...new Set(arr)];
const refs = (text, re) => uniq([...text.matchAll(re)].map((m) => m[0]));
const idChecks = [
  // S## de pasos; se excluyen patrones de talla/stock como "S24/M24/L25"
  ["S## (S01-S17)", plan + mon, /(?<![A-Za-z\/])S(\d{2})(?![\d\/])/g, (m) => Number(m[1]) >= 1 && Number(m[1]) <= 17],
];
for (const [label, text, re, okFn] of idChecks) {
  const bad = uniq([...text.matchAll(re)].filter((m) => !okFn(m)).map((m) => m[0]));
  check(`plan+monitoreo: ${label} dentro de rango`, bad.length === 0, bad.join(", "));
}
const cutIds = defs(cut, /\b(CT-\d+)\b/g);
const rbIds = new Set([...defs(rb, /\b(RP-\d+)\b/g), ...defs(rb, /\b(DR-\d+)\b/g), ...defs(rb, /\b(PNR-\d+)\b/g), ...defs(rb, /\b(D-RB\d+)\b/g)]);
const cutDec = defs(cut, /\b(D-CT\d+)\b/g);
const monDefs = new Set([...defs(mon, /^#{2,4} (MO-\d+)/gm), ...defs(mon, /^\| (MO-\d+\.\d+|\d+\.\d+) \|/gm), ...defs(mon, /\b(MO-\d+\.\d+)\b/g)]);
const gapIds = defs(gap, /\b(G\d{2})\b/g);
const acIds = defs(acc, /\*\*(AC-\d+)\*\*/g);
for (const [doc, text] of Object.entries(both)) {
  const ct = refs(text, /\bCT-\d+\b/g).filter((x) => !cutIds.has(x));
  check(`${doc}: todo CT-## citado existe en el cutover`, ct.length === 0, ct.slice(0, 8).join(", ") || `${refs(text, /\bCT-\d+\b/g).length} referencias`);
  const rp = refs(text, /\b(RP|DR|PNR)-\d+\b/g).filter((x) => !rbIds.has(x));
  check(`${doc}: todo RP/DR/PNR citado existe en el rollback`, rp.length === 0, rp.slice(0, 8).join(", ") || `${refs(text, /\b(RP|DR|PNR)-\d+\b/g).length} referencias`);
  const dct = refs(text, /\bD-CT\d+\b/g).filter((x) => !cutDec.has(x));
  check(`${doc}: todo D-CT# citado existe en el cutover`, dct.length === 0, dct.join(", "));
  const g = refs(text, /\bG\d{2}\b/g).filter((x) => !gapIds.has(x));
  check(`${doc}: todo G## citado existe en la auditoría de brechas`, g.length === 0, g.join(", "));
  const ac = refs(text, /\bAC-\d+\b/g).filter((x) => !acIds.has(x));
  check(`${doc}: todo AC-## citado existe en el checklist`, ac.length === 0, ac.join(", "));
}
const decIds = defs(plan, /^\| \*{0,2}(D\d+)\*{0,2} \|/gm);
const planDecRefs = refs(plan, /\bD(\d+)\b/g).map((x) => x).filter((x) => /^D\d+$/.test(x));
const badDec = planDecRefs.filter((x) => !decIds.has(x));
check("plan: todo D# citado está en la tabla D1-D20", badDec.length === 0 && decIds.size === 20, `${decIds.size} decisiones definidas; sin definir: ${badDec.join(", ") || "ninguna"}`);
const monDec = uniq([...mon.matchAll(/\bD-MO\d+\b/g)].map((m) => m[0]));
const monDecDef = defs(mon, /^\| \*{0,2}(D-MO\d+)\*{0,2} \|/gm);
check("monitoreo: todo D-MO# citado está definido", monDec.every((d) => monDecDef.has(d)), `${monDec.length} citados, ${monDecDef.size} definidos`);

/* ---- D. dependencias del plan ---- */
const steps = [...plan.matchAll(/^### (S\d{2}) · /gm)].map((m) => m[1]);
const deps = {};
for (let i = 0; i < steps.length; i++) {
  const start = plan.indexOf(`### ${steps[i]} · `);
  const end = i + 1 < steps.length ? plan.indexOf(`### ${steps[i + 1]} · `) : plan.indexOf("\n## 6.", start);
  const block = plan.slice(start, end);
  const m = block.match(/- \*\*Depende de\.?\*\*\s*([^\n]+)/);
  deps[steps[i]] = m ? uniq([...m[1].matchAll(/\bS\d{2}\b/g)].map((x) => x[0])) : null;
}
check("plan: cada paso S01-S17 declara 'Depende de'", steps.length === 17 && steps.every((s) => deps[s] !== null), steps.filter((s) => deps[s] === null).join(", "));
const missingDep = steps.flatMap((s) => (deps[s] || []).filter((d) => !steps.includes(d)).map((d) => `${s}->${d}`));
check("plan: toda dependencia entre pasos apunta a un paso que existe", missingDep.length === 0, missingDep.join(", "));
// ciclos (DFS) sobre la tabla del § 3, que parte S05 en S05.A y S05.B (definiciones antes del CSV, membresía después)
const sec3tbl = plan.slice(plan.indexOf("## 3. Orden de ejecución"), plan.indexOf("## 4. Decisiones"));
const g3 = {};
// S15 y S16 se parten en sub-pasos (S15.a/.b/.c y S16.a/.b) que se intercalan en la ventana de corte (§ 7): las aristas
// S15<->S16 y las autorreferencias entre sub-pasos se excluyen del grafo grueso y se exige que el § 7 las documente.
const isInterleaved = (a, b) => (a === "S15" && b === "S16") || (a === "S16" && b === "S15") || a === b;
for (const m of sec3tbl.matchAll(/^\| (S\d{2}(?:\.[AB])?) \| ([^|]*) \|/gm)) {
  g3[m[1]] = uniq([...m[2].matchAll(/S\d{2}(?:\.[AaBbCc])?/g)].map((x) => x[0].replace(/\.[abc]$/, ""))).filter((d) => !isInterleaved(m[1], d));
}
const norm3 = (d) => (g3[d] ? [d] : g3[d + ".A"] ? [d + ".A", d + ".B"] : []); // "S05" sin sufijo = ambas mitades
const state = {};
let cycle = null;
const dfs = (s, pathArr) => {
  if (cycle) return;
  if (state[s] === 1) { cycle = [...pathArr, s].join("->"); return; }
  if (state[s] === 2) return;
  state[s] = 1;
  for (const d of g3[s] || []) for (const n of norm3(d)) dfs(n, [...pathArr, s]);
  state[s] = 2;
};
for (const s of Object.keys(g3)) dfs(s, []);
check("plan: la tabla de dependencias del § 3 (con S05.A y S05.B) no forma ciclos", cycle === null && Object.keys(g3).length >= 17, cycle || `${Object.keys(g3).length} nodos`);
const sec7 = plan.slice(plan.indexOf("## 7. Ventana de corte"), plan.indexOf("## 8. Coherencia"));
check("plan: el § 7 documenta la intercalación de S15 y S16 en sub-pasos (S15.a/.b/.c y S16.a/.b)", ["S15.a", "S15.b", "S16.a", "S16.b"].every((t) => sec7.includes(t)));
check("plan: S05 se parte en S05.A (antes del CSV) y S05.B (después) y S04 depende de S05.A, no de S05.B", !!g3["S05.A"] && !!g3["S05.B"] && (g3["S04"] || []).includes("S05.A") && !(g3["S04"] || []).includes("S05.B") && (g3["S05.B"] || []).includes("S04"));
const forward = steps.flatMap((s) => (deps[s] || []).filter((d) => Number(d.slice(1)) > Number(s.slice(1))).map((d) => `${s}->${d}`));
const sec3 = plan.slice(plan.indexOf("## 3. Orden de ejecución"), plan.indexOf("## 4. Decisiones"));
const unexplained = forward.filter((f) => { const [a, b] = f.split("->"); return !(sec3.includes(a) && sec3.includes(b)); });
check("plan: los adelantos (dependencia de un paso posterior) están explicados en el § 3", unexplained.length === 0, forward.length ? `declarados: ${forward.join(", ")}${unexplained.length ? "; sin explicar: " + unexplained.join(", ") : ""}` : "ninguno");
const noRb = steps.filter((s) => { const st = plan.indexOf(`### ${s} · `); const en = plan.indexOf("### S", st + 10); const blk = plan.slice(st, en > 0 ? en : undefined); return !/- \*\*Rollback\.?\*\*/.test(blk) || !/- \*\*Reversibilidad\.?\*\*/.test(blk); });
check("plan: cada paso tiene Reversibilidad y Rollback", noRb.length === 0, noRb.join(", "));

/* ---- E. monitoreo: cada área enlaza a rollback ---- */
const areas = [...mon.matchAll(/^### (MO-\d+) /gm)].map((m) => m[1]);
const areaNoRb = areas.filter((a) => {
  const st = mon.indexOf(`### ${a} `);
  const en = mon.indexOf("\n### MO-", st + 10);
  const blk = mon.slice(st, en > 0 ? en : mon.indexOf("\n## ", st + 5));
  return !/\b(DR|RP|PNR)-\d+\b/.test(blk) && a !== "MO-00";
});
check("monitoreo: cada área MO-01 a MO-11 enlaza a un paso o disparador de rollback", areas.length >= 12 && areaNoRb.length === 0, `${areas.length} áreas; sin enlace: ${areaNoRb.join(", ") || "ninguna"}`);
check("monitoreo: dice explícitamente que no hay KPIs ni metas de negocio", /Sin KPIs/i.test(mon) && /(cualquier ocurrencia)/i.test(mon));
check("monitoreo: los cuatro puntos T+15m, T+1h, T+4h, T+24h están definidos", ["T+15m", "T+1h", "T+4h", "T+24h"].every((t) => mon.includes(t)));

/* ---- F. horas y fechas ---- */
const badDates = uniq([...both.plan.matchAll(/2026-(\d{2})-(\d{2})/g), ...both.mon.matchAll(/2026-(\d{2})-(\d{2})/g)].filter((m) => `${m[1]}-${m[2]}` > "09-30").map((m) => m[0]));
check("plan+monitoreo: ninguna fecha posterior a 2026-09-30", badDates.length === 0, badDates.join(", "));
const hdr = (t) => (t.match(/(?:Fecha|Corte)[^\n]{0,80}?(\d{1,2}:\d{2})/) || [])[1];
check("plan+monitoreo: la hora de cabecera no es posterior a la de revisión (18:59 del 09-29)", [hdr(plan), hdr(mon)].every((h) => !h || h <= "18:59"), `plan ${hdr(plan)}, monitoreo ${hdr(mon)}`);

console.log(out.join("\n"));
console.log(`\nRESUMEN: ${pass} PASS, ${fail} FAIL`);
process.exitCode = fail ? 1 : 0;
