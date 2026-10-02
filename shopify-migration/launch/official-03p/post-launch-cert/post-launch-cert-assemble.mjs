#!/usr/bin/env node
// Offline assembler for the post-launch certification. Pure Node, no network, no secrets.
//
//   node post-launch-cert-assemble.mjs report --core core.json [--pdp pdp.json] [--external external.json] [--out DIR]
//        core.json     = output of window.__PLDUMP() (preferred) or window.__PLSUMMARY()
//        pdp.json      = output of window.__PDPDUMP() (preferred) or window.__PDPSUMMARY()
//        external.json = coordinator checks done OUTSIDE the page (see EXTERNAL below):
//                        { "capturedAt": "...", "checks": { "tls_apex": {"status":"PASS","evidence":"..."}, ... } }
//        writes post-launch-certification.json + .md; exit 0 CERTIFIED, 1 NOT_CERTIFIED, 2 INCOMPLETE
//   node post-launch-cert-assemble.mjs redirects --from admin-urlRedirects.json [--core FILE] [--write]
//        regenerates the REDIRECTS block (between the markers) of post-launch-cert-core.js from an Admin export
//   node post-launch-cert-assemble.mjs build       writes dist/*.min.js (comments/indentation stripped: fewer tokens to paste)
//   node post-launch-cert-assemble.mjs check       syntax-check both in-page scripts (node vm, async wrapper)
//   node post-launch-cert-assemble.mjs selftest    offline tests of the verdict logic and the redirects rewrite
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CORE_JS = path.join(HERE, 'post-launch-cert-core.js');
const PDP_JS = path.join(HERE, 'post-launch-cert-pdp-harness.js');

// checks that can only be done outside the page (README section "Coordinator checks")
export const EXTERNAL = [
  ['tls_apex', 'HTTPS apex: valid certificate (subject / issuer / expiry)'],
  ['tls_www', 'HTTPS www: valid certificate'],
  ['http_to_https', 'http:// apex answers 301 to https://'],
  ['www_redirect', 'www <-> apex: 301 with Location to the primary domain'],
  ['dns_apex', 'DNS A @ resolves to the Shopify IP'],
  ['dns_www', 'DNS CNAME www points to Shopify'],
  ['dns_mail_txt', 'MX / TXT (SPF, DKIM, DMARC, verification) intact'],
  ['dns_no_residue', 'No leftover Vercel records (A 216.150.1.1 / CNAME *.vercel-dns-*.com)'],
  ['primary_domain', 'Admin: custom domain connected, SSL active, primary domain correct'],
  ['password_off', 'Storefront password disabled (GET / is 200 and not /password)'],
  ['wompi_live', 'Checkout offers Wompi in LIVE mode (no test banner / test cards)'],
  ['shipping_rate', 'Checkout shows the real shipping rate (free from 299.900)'],
  ['inventory_admin', 'Admin API: 29 products / 98 variants / 128 units, tracked, DENY'],
  ['theme_state', 'Admin API: published theme is the certified Radaelli RC1.10; Horizon not modified'],
  ['redirects_admin', 'Admin API: urlRedirects count = 51'],
  ['social_http', 'Four social destinations answer (curl.exe -I)'],
  ['orders_clean', 'No unintended orders / draft orders created by the certification']
];
const EXPECTED_PHASES = ['catalog', 'routes', 'search', 'filters', 'redirects', 'links', 'locale', 'hostRedirect', 'responsive', 'cart'];

const bogota = () => new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }) + ' America/Bogota';
const arg = (a, k) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : null; };
const readJson = (p) => { const t = fs.readFileSync(p, 'utf8'); return JSON.parse(t.charCodeAt(0) === 0xFEFF ? t.slice(1) : t); };

// ---------- report ----------
export function assemble({ core, pdp, external, now }) {
  const out = { generatedAt: now || bogota(), blocks: {}, failures: [], warnings: [], missing: [] };
  // core
  const cs = core ? (core.summary || core) : null;
  if (!cs) { out.missing.push('core (window.__PLDUMP / __PLSUMMARY not provided)'); out.blocks.core = { verdict: 'MISSING' }; }
  else {
    const ran = cs.ran || []; const miss = EXPECTED_PHASES.filter((p) => ran.indexOf(p) < 0);
    out.blocks.core = { verdict: cs.verdict, base: cs.base, ts: cs.ts, ran, missingPhases: miss, phases: cs.phases, retries429: cs.retries429, requests: cs.requests, cartClean: cs.cartClean };
    (cs.fails || []).forEach((f) => out.failures.push('core: ' + f));
    (cs.warns || []).forEach((w) => out.warnings.push('core: ' + w));
    if (core.summary && core.phases) { // full dump: all failures / warnings, not only the compact ones
      out.failures = out.failures.filter((f) => !f.startsWith('core: '));
      out.warnings = out.warnings.filter((w) => !w.startsWith('core: '));
      for (const [k, r] of Object.entries(core.phases)) { (r.fail || []).forEach((f) => out.failures.push('core/' + k + ': ' + f)); (r.warn || []).forEach((w) => out.warnings.push('core/' + k + ': ' + w)); }
      out.expected = expectedFromDump(core);
    }
    if (cs.verdict !== 'PASS') { if (cs.verdict === 'PASS_PARTIAL') out.missing.push('core phases not run: ' + miss.join(', ')); else if (cs.verdict === 'RUNNING') out.missing.push('core still running'); else if (cs.verdict === 'NOT_RUN') out.missing.push('core not run'); }
    if (cs.cartClean === false) out.failures.push('core: browser cart left dirty (run __PLRUN("clean"))');
  }
  // pdp
  const ps = pdp ? (pdp.summary || pdp) : null;
  if (!ps) { out.missing.push('pdp harness (window.__PDPDUMP / __PDPSUMMARY not provided)'); out.blocks.pdp = { verdict: 'MISSING' }; }
  else {
    out.blocks.pdp = { verdict: ps.verdict, tested: ps.tested, pass: ps.pass, fail: ps.fail, variants: ps.variants, images: ps.images, totalsOk: ps.totalsOk, lazyPendingNeedRetest: ps.lazyPendingNeedRetest, retries429: ps.retries429, secs: ps.secs };
    (ps.failures || []).forEach((f) => out.failures.push('pdp: ' + f.h + ' - ' + (f.issues || []).join('; ')));
    if (ps.verdict === 'PASS_SUBSET') out.missing.push('pdp: only a subset was tested (HANDLES/LIMIT); the certification needs the full 29/98/95 run');
    else if (ps.verdict !== 'PASS') { if (['NOT_RUN', 'RUNNING'].includes(ps.verdict)) out.missing.push('pdp: ' + ps.verdict); else if (!(ps.failures || []).length) out.failures.push('pdp: verdict ' + ps.verdict); }
    if ((ps.lazyPendingNeedRetest || []).length) out.failures.push('pdp: lazy-image PDPs not cleared by __PDPRETEST: ' + ps.lazyPendingNeedRetest.join(', '));
  }
  // external
  const ex = {}; const checks = (external && external.checks) || {};
  for (const [id, label] of EXTERNAL) {
    const c = checks[id]; const st = c ? String(c.status || '').toUpperCase() : 'PENDING';
    ex[id] = { label, status: ['PASS', 'FAIL', 'N/A'].includes(st) ? st : 'PENDING', evidence: c ? c.evidence || '' : '' };
    if (ex[id].status === 'FAIL') out.failures.push('external/' + id + ': ' + label + (c.evidence ? ' - ' + String(c.evidence).slice(0, 160) : ''));
    else if (ex[id].status === 'PENDING') out.missing.push('external/' + id);
    else if (ex[id].status === 'N/A' && !ex[id].evidence) out.missing.push('external/' + id + ' (N/A needs a reason in evidence)');
  }
  out.blocks.external = ex;
  out.verdict = out.failures.length ? 'NOT_CERTIFIED' : out.missing.length ? 'INCOMPLETE' : 'CERTIFIED';
  return out;
}

function expectedFromDump(dump) {
  const P = dump.phases || {}; const rows = (k) => (P[k] && P[k].rows) || [];
  const find = (k, key) => rows(k).find((r) => r.k === key);
  const n = (k, key) => { const r = find(k, key); return r ? r.n : null; };
  const row = (what, expected, actual) => ({ what, expected, actual, ok: actual === expected });
  const t = [];
  t.push(row('products (products.json)', 29, n('catalog', 'products')));
  t.push(row('variants', 98, n('catalog', 'variants')));
  t.push(row('images', 95, n('catalog', 'images')));
  const r = rows('redirects'); t.push(row('redirects checked (+2 inventory rows)', 53, r.length || null)); t.push(row('redirects passing', 53, r.filter((x) => x.ok).length || null));
  [['/collections/oasis-natural', 10], ['/collections/aurora-viva', 12], ['/collections/espuma-de-ola', 7], ['/collections/salidas-de-bano', 0], ['/collections/destacados', 7], ['/collections/all', 24], ['/collections/all?page=2', 5]].forEach(([p, e]) => t.push(row(p, e, n('routes', p))));
  rows('search').forEach((x) => t.push(row(x.k, x.exp, x.n)));
  rows('filters').slice(0, 2).forEach((x) => t.push(row(x.k, x.exp, x.n)));
  return t;
}

export function toMarkdown(o) {
  const L = []; const icon = (s) => ({ PASS: 'PASS', CERTIFIED: 'CERTIFIED', FAIL: 'FAIL', NOT_CERTIFIED: 'NOT CERTIFIED', INCOMPLETE: 'INCOMPLETE', PENDING: 'PENDING' }[s] || s);
  L.push('# Post-launch certification - radaelliswimwear.com', '', 'Generated: ' + o.generatedAt, '', '**Verdict: ' + icon(o.verdict) + '**', '');
  L.push('| Block | Verdict | Detail |', '|---|---|---|');
  const c = o.blocks.core; const p = o.blocks.pdp;
  L.push('| In-page core | ' + c.verdict + ' | ' + (c.ran ? c.ran.length + '/10 phases ran; 429 retries ' + c.retries429 + '; requests ' + c.requests : 'not provided') + ' |');
  L.push('| PDP harness | ' + p.verdict + ' | ' + (p.tested != null ? p.tested + ' PDP (' + p.pass + ' pass), variants ' + (p.variants ? p.variants.tested + ' (bad ' + p.variants.bad + ')' : '-') + ', images ' + (p.images ? p.images.pjTotal : '-') : 'not provided') + ' |');
  const ex = Object.values(o.blocks.external); const cnt = (s) => ex.filter((e) => e.status === s).length;
  L.push('| External (coordinator) | ' + (cnt('FAIL') ? 'FAIL' : cnt('PENDING') ? 'INCOMPLETE' : 'PASS') + ' | PASS ' + cnt('PASS') + ', N/A ' + cnt('N/A') + ', FAIL ' + cnt('FAIL') + ', PENDING ' + cnt('PENDING') + ' |', '');
  if (c.phases) { L.push('## In-page phases', '', '| Phase | State | Checks | OK | Fail | Warn | Secs |', '|---|---|---|---|---|---|---|'); for (const [k, v] of Object.entries(c.phases)) L.push('| ' + k + ' | ' + v.s + ' | ' + (v.n ?? '-') + ' | ' + (v.ok ?? '-') + ' | ' + (v.f ?? '-') + ' | ' + (v.w ?? '-') + ' | ' + (v.t ?? '-') + ' |'); L.push(''); }
  if (o.expected) { L.push('## Expected values', '', '| Check | Expected | Actual | |', '|---|---|---|---|'); o.expected.forEach((e) => L.push('| ' + e.what + ' | ' + e.expected + ' | ' + e.actual + ' | ' + (e.ok ? 'ok' : 'MISMATCH') + ' |')); L.push(''); }
  L.push('## External checks (outside the page)', '', '| Id | Check | Status | Evidence |', '|---|---|---|---|');
  for (const [id, e] of Object.entries(o.blocks.external)) L.push('| ' + id + ' | ' + e.label + ' | ' + e.status + ' | ' + String(e.evidence).replace(/\|/g, '/').slice(0, 140) + ' |');
  L.push('');
  if (o.failures.length) { L.push('## Failures', ''); o.failures.forEach((f) => L.push('- ' + f)); L.push(''); }
  if (o.missing.length) { L.push('## Missing / pending', ''); o.missing.forEach((f) => L.push('- ' + f)); L.push(''); }
  if (o.warnings.length) { L.push('## Warnings (do not block)', ''); o.warnings.slice(0, 40).forEach((f) => L.push('- ' + f)); L.push(''); }
  L.push('Rules: CERTIFIED = core PASS (all 10 phases) + PDP full run PASS (29/98/95, lazy images cleared) + every external check PASS/N/A-with-reason. Any FAIL = NOT CERTIFIED (rollback plan in rollback-and-health.md). Anything missing = INCOMPLETE.', '');
  return L.join('\n');
}

// ---------- redirects ----------
export function extractPairs(j) {
  const arr = Array.isArray(j) ? j : (j.data || j).urlRedirects ? ((j.data || j).urlRedirects.nodes || (j.data || j).urlRedirects) : j.nodes || null;
  if (!Array.isArray(arr)) throw new Error('unrecognised redirects JSON (expected {urlRedirects:{nodes:[{path,target}]}} or an array)');
  const seen = new Set(); const pairs = [];
  for (const r of arr) {
    const p = r.path || r.from || r[0]; const t = r.target || r.to || r[1];
    if (!p || !t || !String(p).startsWith('/') || !String(t).startsWith('/')) throw new Error('bad redirect row ' + JSON.stringify(r));
    if (seen.has(p)) throw new Error('duplicate redirect path ' + p); seen.add(p); pairs.push([p, t]);
  }
  return pairs;
}
export function rewriteRedirects(src, pairs) {
  const re = /(\/\*REDIRECTS:BEGIN\*\/\s*const REDIRECTS = \[)[\s\S]*?(\];\s*\/\*REDIRECTS:END\*\/)/;
  if (!re.test(src)) throw new Error('REDIRECTS markers not found in core script');
  return src.replace(re, (m, a, b) => a + '\n' + pairs.map((x) => JSON.stringify(x)).join(',\n') + '\n  ' + b);
}

// ---------- check ----------
function syntaxCheck(file) {
  const code = fs.readFileSync(file, 'utf8');
  try { new vm.Script('(async()=>{\n' + code + '\n})', { filename: path.basename(file) }); new vm.Script(code, { filename: path.basename(file) }); return null; }
  catch (e) { return String(e.message); }
}

// ---------- build (compact copies to paste: only whole-line // comments, indentation and blank lines are removed) ----------
export function compact(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n'); const out = [];
  lines.forEach((l, i) => { const t = l.trim(); if (!t) return; if (t.startsWith('//') && i > 0) return; out.push(t); });
  return out.join('\n') + '\n';
}

// ---------- CLI ----------
async function main() {
  const [cmd, ...a] = process.argv.slice(2);
  if (cmd === 'build') {
    const dist = path.join(HERE, 'dist'); fs.mkdirSync(dist, { recursive: true });
    for (const f of [CORE_JS, PDP_JS]) {
      const src = fs.readFileSync(f, 'utf8'); const min = compact(src); const e = (() => { try { new vm.Script(min); return null; } catch (x) { return String(x.message); } })();
      const o = path.join(dist, path.basename(f).replace(/\.js$/, '.min.js'));
      if (e) { console.log('FAIL ' + path.basename(f) + ': ' + e); process.exit(1); }
      fs.writeFileSync(o, min); console.log('ok   ' + path.basename(o) + ' ' + src.length + ' -> ' + min.length + ' bytes');
    }
    process.exit(0);
  }
  if (cmd === 'report') {
    const core = arg(a, 'core') ? readJson(arg(a, 'core')) : null; const pdp = arg(a, 'pdp') ? readJson(arg(a, 'pdp')) : null; const external = arg(a, 'external') ? readJson(arg(a, 'external')) : null;
    const res = assemble({ core, pdp, external }); const dir = arg(a, 'out') || process.cwd(); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'post-launch-certification.json'), JSON.stringify(res, null, 2) + '\n'); fs.writeFileSync(path.join(dir, 'post-launch-certification.md'), toMarkdown(res));
    console.log('verdict: ' + res.verdict + ' | failures ' + res.failures.length + ' | missing ' + res.missing.length + ' | warnings ' + res.warnings.length + ' | written to ' + dir);
    process.exit(res.verdict === 'CERTIFIED' ? 0 : res.verdict === 'INCOMPLETE' ? 2 : 1);
  } else if (cmd === 'redirects') {
    const pairs = extractPairs(readJson(arg(a, 'from'))); const file = arg(a, 'core') || CORE_JS;
    const acct = pairs.filter((p) => /^\/account/.test(p[1])).length;
    const next = rewriteRedirects(fs.readFileSync(file, 'utf8'), pairs);
    console.log('pairs ' + pairs.length + ' (same-origin ' + (pairs.length - acct) + ', /account* ' + acct + ')');
    if (pairs.length !== 51 || acct !== 9) console.log('NOTE: counts differ from the lab baseline; set before pasting: window.__PLCFG = {EXPECT:{redirects:' + pairs.length + ',redirectsSameOrigin:' + (pairs.length - acct) + ',redirectsAccount:' + acct + '}};');
    if (a.includes('--write')) { fs.writeFileSync(file, next); console.log('written ' + file); } else console.log('dry run (add --write to modify ' + file + ')');
  } else if (cmd === 'check') {
    let bad = 0; for (const f of [CORE_JS, PDP_JS]) { const e = syntaxCheck(f); console.log((e ? 'FAIL ' : 'ok   ') + path.basename(f) + (e ? ': ' + e : '')); if (e) bad++; } process.exit(bad ? 1 : 0);
  } else if (cmd === 'selftest') {
    await selftest();
  } else { console.log('usage: report | redirects | check | selftest (see header of this file)'); process.exit(64); }
}

async function selftest() {
  let pass = 0, fail = 0; const ok = (c, n, x) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + n + (x !== undefined ? ' -> ' + JSON.stringify(x) : '')); } };
  const phases = {}; EXPECTED_PHASES.forEach((k) => { phases[k] = { s: 'done', n: 3, ok: 3, f: 0, w: 0, t: 1 }; });
  const coreOk = { v: 'PL-1.0', verdict: 'PASS', base: 'https://radaelliswimwear.com', ran: EXPECTED_PHASES, missing: [], phases, fails: [], warns: [], retries429: 0, requests: 120, cartClean: true };
  const pdpOk = { verdict: 'PASS', tested: 29, pass: 29, fail: 0, variants: { tested: 98, bad: 0 }, images: { pjTotal: 95 }, totalsOk: true, failures: [], lazyPendingNeedRetest: [] };
  const exAll = { checks: Object.fromEntries(EXTERNAL.map(([id]) => [id, { status: 'PASS', evidence: 'ok' }])) };
  let r = assemble({ core: coreOk, pdp: pdpOk, external: exAll, now: 't' });
  ok(r.verdict === 'CERTIFIED' && r.failures.length === 0 && r.missing.length === 0, 'all green -> CERTIFIED', r);
  r = assemble({ core: coreOk, pdp: pdpOk, external: { checks: { ...exAll.checks, wompi_live: { status: 'FAIL', evidence: 'TEST banner' } } }, now: 't' });
  ok(r.verdict === 'NOT_CERTIFIED' && r.failures.some((f) => f.includes('wompi_live')), 'external FAIL -> NOT_CERTIFIED');
  r = assemble({ core: coreOk, pdp: pdpOk, external: { checks: { ...exAll.checks, dns_mail_txt: undefined } }, now: 't' });
  ok(r.verdict === 'INCOMPLETE' && r.missing.includes('external/dns_mail_txt'), 'external missing -> INCOMPLETE');
  r = assemble({ core: coreOk, pdp: pdpOk, external: { checks: { ...exAll.checks, social_http: { status: 'N/A' } } }, now: 't' });
  ok(r.verdict === 'INCOMPLETE', 'N/A without reason -> INCOMPLETE');
  r = assemble({ core: coreOk, pdp: pdpOk, external: { checks: { ...exAll.checks, social_http: { status: 'N/A', evidence: 'instagram blocks curl (429); checked in browser' } } }, now: 't' });
  ok(r.verdict === 'CERTIFIED', 'N/A with reason ok');
  r = assemble({ core: { ...coreOk, verdict: 'FAIL', fails: ['routes: /x - boom'] }, pdp: pdpOk, external: exAll, now: 't' });
  ok(r.verdict === 'NOT_CERTIFIED' && r.failures.includes('core: routes: /x - boom'), 'core FAIL -> NOT_CERTIFIED');
  r = assemble({ core: { ...coreOk, verdict: 'PASS_PARTIAL', ran: ['routes'], missing: EXPECTED_PHASES.slice(1) }, pdp: pdpOk, external: exAll, now: 't' });
  ok(r.verdict === 'INCOMPLETE' && r.missing.some((m) => m.startsWith('core phases not run')), 'partial core -> INCOMPLETE');
  r = assemble({ core: coreOk, pdp: { ...pdpOk, verdict: 'PASS_SUBSET', tested: 3 }, external: exAll, now: 't' });
  ok(r.verdict === 'INCOMPLETE', 'PDP subset -> INCOMPLETE');
  r = assemble({ core: coreOk, pdp: { ...pdpOk, verdict: 'FAIL', fail: 1, failures: [{ h: 'bikini-foam', issues: ['canonical'] }] }, external: exAll, now: 't' });
  ok(r.verdict === 'NOT_CERTIFIED' && r.failures.some((f) => f.includes('bikini-foam')), 'PDP fail -> NOT_CERTIFIED');
  r = assemble({ core: coreOk, pdp: { ...pdpOk, lazyPendingNeedRetest: ['alba-dorada-lila'] }, external: exAll, now: 't' });
  ok(r.verdict === 'NOT_CERTIFIED', 'uncleared lazy images block');
  r = assemble({ core: { ...coreOk, cartClean: false }, pdp: pdpOk, external: exAll, now: 't' });
  ok(r.verdict === 'NOT_CERTIFIED', 'dirty cart blocks');
  r = assemble({ core: null, pdp: null, external: null, now: 't' });
  ok(r.verdict === 'INCOMPLETE' && r.missing.length >= 19, 'nothing provided -> INCOMPLETE', r.missing.length);
  // dump form + expected table
  const dump = { summary: coreOk, phases: { catalog: { rows: [{ k: 'products', n: 29, ok: true }, { k: 'variants', n: 98 }, { k: 'images', n: 95 }] }, routes: { fail: ['/x - bad'], warn: ['w1'], rows: [{ k: '/collections/oasis-natural', n: 10 }] }, search: { rows: [{ k: 'q=marea', n: 2, exp: 2 }] }, filters: { rows: [{ k: 'a', n: 11, exp: 11 }, { k: 'b', n: 5, exp: 6 }] }, redirects: { rows: new Array(53).fill({ ok: true }) } } };
  r = assemble({ core: dump, pdp: pdpOk, external: exAll, now: 't' });
  ok(r.failures.includes('core/routes: /x - bad') && r.warnings.includes('core/routes: w1'), 'dump failures/warnings expanded', r.failures);
  ok(r.expected.find((e) => e.what === 'images').ok && !r.expected.find((e) => e.what === 'b').ok, 'expected table ok/mismatch');
  const md = toMarkdown(r); ok(/Verdict: NOT CERTIFIED/.test(md) && /## Failures/.test(md) && /## External checks/.test(md), 'markdown renders');
  // redirects rewrite
  const src = fs.readFileSync(CORE_JS, 'utf8');
  const pairs = [['/a', '/collections/a'], ['/cuenta', '/account']];
  const out = rewriteRedirects(src, pairs);
  ok(new vm.Script(out) && /\["\/a","\/collections\/a"\],\n\["\/cuenta","\/account"\]/.test(out), 'rewrite keeps script parseable');
  const pairsOf = (code) => JSON.parse('[' + /const REDIRECTS = \[([\s\S]*?)\];/.exec(code)[1] + ']');
  const orig = pairsOf(src);
  ok(orig.length === 51 && JSON.stringify(pairsOf(out)) === JSON.stringify(pairs), 'rewrite replaces the pairs', orig.length);
  const back = rewriteRedirects(out, orig);
  ok(JSON.stringify(pairsOf(back)) === JSON.stringify(orig) && rewriteRedirects(back, orig) === back, 'rewrite round-trips and is idempotent');
  ok(extractPairs({ data: { urlRedirects: { nodes: [{ path: '/x', target: '/y' }] } } }).length === 1 && extractPairs([{ path: '/x', target: '/y' }]).length === 1 && extractPairs({ urlRedirects: { nodes: [{ path: '/x', target: '/y' }] } }).length === 1, 'extractPairs shapes');
  let thrown = 0; for (const bad of [[{ path: 'x', target: '/y' }], [{ path: '/x', target: '/y' }, { path: '/x', target: '/z' }], { foo: 1 }]) { try { extractPairs(bad); } catch (e) { thrown++; } } ok(thrown === 3, 'extractPairs rejects bad input', thrown);
  ok(syntaxCheck(CORE_JS) === null && syntaxCheck(PDP_JS) === null, 'both in-page scripts parse (async wrapper)');
  const cm = compact(fs.readFileSync(CORE_JS, 'utf8'));
  ok(cm.length < fs.readFileSync(CORE_JS, 'utf8').length && /\/\*REDIRECTS:BEGIN\*\//.test(cm) && new vm.Script(cm), 'compact() shrinks, keeps markers, parses');
  ok(compact('// banner\n  // c\n\n  a();  // trailing stays\n') === '// banner\na();  // trailing stays\n', 'compact() only drops whole-line comments after line 1');
  console.log('assembler self-test: ' + pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
