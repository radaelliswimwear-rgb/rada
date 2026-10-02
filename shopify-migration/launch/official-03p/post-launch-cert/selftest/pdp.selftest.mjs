// Offline self-test for post-launch-cert-pdp-harness.js (node selftest/pdp.selftest.mjs) - mock PDPs, no network.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeWorld, installGlobals } from './mock-store.mjs';
import { setIframeHook } from './dom-shim.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// PL_PDP=<file> runs the same tests against another copy (e.g. dist/post-launch-cert-pdp-harness.min.js)
const CODE = fs.readFileSync(process.env.PL_PDP || path.join(here, '..', 'post-launch-cert-pdp-harness.js'), 'utf8');
const ORIGIN = 'https://radaelliswimwear.com';
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + name + (extra !== undefined ? ' -> ' + JSON.stringify(extra) : '')); } };
import { world, load as load0, FAST } from './pdp-mock.mjs';
const load = (W, cfg) => load0(W, cfg, CODE);
const wait = async () => { for (let i = 0; i < 4000 && globalThis.__PDP.running; i++) await new Promise((r) => setTimeout(r, 5)); };

// ---- 0. baseline full run: 29 / 98 / 95
{
  const W = world(); const r = load(W);
  ok(/^PDP harness ready PDP-1\.0/.test(r), 'ready string', r);
  const s = await globalThis.__PDPRUN({ wait: true });
  ok(s.verdict === 'PASS', 'baseline PASS (todo/TODO/financiacion not flagged)', s);
  ok(s.tested === 29 && s.pass === 29 && s.variants.tested === 98 && s.images.pjTotal === 95 && s.totalsOk === true, 'totals 29/98/95', [s.tested, s.variants.tested, s.images.pjTotal]);
  ok(s.variants.bad === 0 && s.lazyFirstPass === 0, 'no variant failures / lazy');
  ok(JSON.stringify(s).length < 1500, 'summary compact');
  ok(JSON.parse(globalThis.__PDPDUMP()).products.length === 29, 'dump parses');
  ok(globalThis.__PDPROWS(false).length === 29 && globalThis.__PDPROWS(true).length === 0, 'rows');
}
// ---- filters HANDLES / LIMIT
{
  const W = world(); load(W);
  const hs = W.cat.slice(3, 6).map((p) => p.handle);
  const s = await globalThis.__PDPRUN({ HANDLES: hs, wait: true });
  ok(s.tested === 3 && s.verdict === 'PASS_SUBSET' && s.full === false && s.totalsOk === null, 'HANDLES filter', [s.tested, s.verdict]);
  ok(JSON.stringify(globalThis.__PDP.products.map((o) => o.h)) === JSON.stringify(hs), 'HANDLES order/content');
  const s2 = await globalThis.__PDPRUN({ LIMIT: 5, wait: true });
  ok(s2.tested === 5 && s2.verdict === 'PASS_SUBSET', 'LIMIT 5', s2.tested);
  const s3 = await globalThis.__PDPRUN({ HANDLES: [W.cat[0].handle, 'no-existe'], wait: true });
  ok(s3.unknownHandles.length === 1 && s3.verdict === 'FAIL', 'unknown handle fails the run', s3.unknownHandles);
  const s4 = await globalThis.__PDPRUN({ HANDLES: W.cat.slice(0, 6).map((p) => p.handle), LIMIT: 2, wait: true });
  ok(s4.tested === 2, 'HANDLES + LIMIT combined', s4.tested);
}
// ---- false positives vs real positives
{
  const W = world((W0) => { const hs = W0.cat.map((p) => p.handle); W0.desc[hs[0]] = 'Para todo el dia, TODO el verano, TODO COLOMBIA.'; W0.desc[hs[1]] = 'precio undefined aqui'; W0.desc[hs[2]] = 'TODO: arreglar'; W0.desc[hs[3]] = 'Translation missing: es.x'; W0.desc[hs[4]] = 'valor NaN'; W0.desc[hs[5]] = 'banano NANO financiación'; });
  load(W);
  const s = await globalThis.__PDPRUN({ LIMIT: 6, wait: true });
  const rows = globalThis.__PDPROWS(false);
  ok(rows[0].pass && rows[5].pass, 'Spanish todo/TODO/nan words NOT flagged', [rows[0].issues, rows[5].issues]);
  ok(!rows[1].pass && !rows[2].pass && !rows[3].pass && !rows[4].pass, 'real dev markers flagged', rows.map((r) => r.issues));
  const sp = globalThis.__PDP.suspicious;
  ok(sp('envio a todo el pais TODO EL AÑO') === '' && sp('financiación') === '' && sp('') === '' && sp('TODO: x') !== '' && sp('NaN') !== '' && sp('{{ product.title }}') !== '', 'suspicious() unit');
}
// ---- hard failures detected
{
  const W = world((W0) => { const hs = W0.cat.map((p) => p.handle); W0.wrongH1.add(hs[0]); W0.overflow2.add(hs[1]); W0.wrongSel.add(hs[2]); W0.perr[hs[3]] = ['TypeError: boom']; W0.accDead.add(hs[4]); W0.noCanon.add(hs[5]); W0.perr[hs[6]] = ['storefrontBaseUrl x', 'replaceState', 'Script error.']; });
  load(W);
  const s = await globalThis.__PDPRUN({ LIMIT: 7, wait: true });
  const rows = globalThis.__PDPROWS(false);
  ok(rows[0].issues.includes('h1!=title'), 'h1 mismatch', rows[0].issues);
  ok(rows[1].issues.some((x) => x.startsWith('overflow390')), 'overflow', rows[1].issues);
  ok(rows[2].issues.some((x) => x.startsWith('variants with failures')) && rows[2].vbad.length > 0, 'wrong variant selection', rows[2]);
  ok(rows[3].issues.some((x) => x.startsWith('console:')), 'console error', rows[3].issues);
  ok(rows[4].issues.some((x) => x.startsWith('accordions unresponsive')), 'accordions', rows[4].issues);
  ok(rows[5].issues.includes('canonical'), 'canonical', rows[5].issues);
  ok(rows[6].pass, 'srcdoc artifacts ignored', rows[6].issues);
  ok(s.verdict === 'FAIL' && s.fail === 6 && s.variants.bad > 0, 'summary FAIL counts', [s.verdict, s.fail]);
}
// ---- lazy images: warn + retest
{
  const W = world((W0) => { const hs = W0.cat.map((p) => p.handle); W0.lazy.add(hs[0]); W0.lazy.add(hs[1]); });
  load(W);
  const s = await globalThis.__PDPRUN({ LIMIT: 3, wait: true });
  ok(s.fail === 0 && s.lazyFirstPass === 2 && s.lazyPendingNeedRetest.length === 2, 'lazy => warn, listed for retest, not fail', s);
  const rows = globalThis.__PDPROWS(true);
  ok(rows.length === 2 && rows[0].warns[0].startsWith('lazy-pending'), 'rows with warnings', rows);
  W.retestMode = true; // images load once waited
  const rt = await globalThis.__PDPRETEST();
  ok(rt.length === 2 && rt.every((x) => x.pending === 0 && x.bad === 0), 'retest: 0 pending / 0 broken', rt);
  const s2 = globalThis.__PDPSUMMARY();
  ok(s2.lazyPendingNeedRetest.length === 0 && s2.verdict === 'PASS_SUBSET', 'summary after retest clean', s2);
  ok(globalThis.__PDPROWS(true).length === 0 && globalThis.__PDP.products[0].retested === true, 'warns cleared + retested flag');
  // explicit handle list
  const rt2 = await globalThis.__PDPRETEST([W.cat[0].handle]);
  ok(rt2.length === 1 && rt2[0].h === W.cat[0].handle, 'retest with explicit handles');
}
{
  const W = world((W0) => { W0.lazy.add(W0.cat[0].handle); });
  load(W);
  await globalThis.__PDPRUN({ LIMIT: 1, wait: true });
  // images that never load stay as warning after retest (still pending)
  W.retestMode = false;
  const rt = await globalThis.__PDPRETEST();
  ok(rt[0].pending > 0, 'persistent pending reported', rt);
  ok(globalThis.__PDPSUMMARY().lazyPendingNeedRetest.length === 1, 'still listed after failed retest');
  const bg = globalThis.__PDPRETEST(undefined, { bg: true });
  ok(/^started PDP retest/.test(bg), 'retest bg');
  for (let i = 0; i < 2000 && globalThis.__PDP.retestState.running; i++) await new Promise((r) => setTimeout(r, 5));
  ok(globalThis.__PDP.retestState.rows.length === 1, 'bg retest finished');
}
// ---- broken images are hard failures
{
  const W = world((W0) => { W0.cat.forEach(() => {}); });
  load(W);
  setIframeHook((e, d) => { d.querySelectorAll('img').forEach((i) => { i.attrs['data-broken'] = '1'; }); });
  const s = await globalThis.__PDPRUN({ LIMIT: 1, wait: true });
  ok(globalThis.__PDPROWS(false)[0].issues.some((x) => x.startsWith('broken imgs')) && s.verdict === 'FAIL', 'broken images fail');
}
// ---- 429 handling + busy guard + bg status
{
  const W = world((W0) => { W0.throttlePj = { h: W0.cat[0].handle, times: 1 }; });
  load(W);
  const s = await globalThis.__PDPRUN({ LIMIT: 1, wait: true });
  ok(s.retries429 === 1 && s.verdict === 'PASS_SUBSET', '429 retried', s);
  const started = globalThis.__PDPRUN({ LIMIT: 2 });
  ok(/^started PDP run/.test(started), 'bg start');
  ok(/^PDP BUSY/.test(globalThis.__PDPRUN({})), 'busy guard on run');
  ok(/^PDP BUSY/.test(vm.runInThisContext(CODE)), 'busy guard on re-paste');
  ok(/^PDP BUSY/.test(globalThis.__PDPRETEST()), 'busy guard on retest');
  ok(globalThis.__PDPSTATUS().running === true, 'status running');
  await wait();
  ok(globalThis.__PDPSTATUS().done === true && globalThis.__PDPSUMMARY().tested === 2, 'bg completes');
}
{
  const W = world(); load(W);
  ok(globalThis.__PDPSUMMARY().verdict === 'FAIL' || globalThis.__PDPSUMMARY().verdict === 'NOT_RUN', 'summary before run is not PASS', globalThis.__PDPSUMMARY().verdict);
}

console.log('pdp self-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

