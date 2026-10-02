// End-to-end offline test: mock storefront -> core + PDP harness -> __PLDUMP/__PDPDUMP -> assembler CLI -> verdict + exit code.
import fs from 'node:fs';
import os from 'node:os';
import vm from 'node:vm';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { makeWorld, installGlobals } from './mock-store.mjs';
import { world, load as loadPdp } from './pdp-mock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..');
const CORE = fs.readFileSync(path.join(ROOT, 'post-launch-cert-core.js'), 'utf8');
const PDP = fs.readFileSync(path.join(ROOT, 'post-launch-cert-pdp-harness.js'), 'utf8');
const PAIRS = JSON.parse('[' + /const REDIRECTS = \[([\s\S]*?)\];/.exec(CORE)[1] + ']');
let pass = 0, fail = 0;
const ok = (c, n, x) => { if (c) pass++; else { fail++; console.log('  FAIL: ' + n + (x !== undefined ? ' -> ' + JSON.stringify(x) : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plcert-'));
const w = (n, s) => { const p = path.join(tmp, n); fs.writeFileSync(p, typeof s === 'string' ? s : JSON.stringify(s)); return p; };
const asm = (args) => spawnSync(process.execPath, [path.join(ROOT, 'post-launch-cert-assemble.mjs'), ...args], { encoding: 'utf8' });

async function runCore(mut) {
  const W = makeWorld(); W.setRedirects(PAIRS); if (mut) mut(W);
  installGlobals(W); globalThis.__PLCFG = { gap: 0, backoff: 10, settle: 1, extra: 1 }; delete globalThis.__PL;
  vm.runInThisContext(CORE); await globalThis.__PLRUN('all');
  return globalThis.__PLDUMP();
}
async function runPdp() {
  const W = world(); loadPdp(W, {}, PDP); await globalThis.__PDPRUN({ wait: true });
  return globalThis.__PDPDUMP();
}
const external = (over) => ({ capturedAt: 'selftest', checks: Object.assign(Object.fromEntries(['tls_apex', 'tls_www', 'http_to_https', 'www_redirect', 'dns_apex', 'dns_www', 'dns_mail_txt', 'dns_no_residue', 'primary_domain', 'password_off', 'wompi_live', 'shipping_rate', 'inventory_admin', 'theme_state', 'redirects_admin', 'social_http', 'orders_clean'].map((k) => [k, { status: 'PASS', evidence: 'selftest' }])), over || {}) });

const coreOk = await runCore(); const pdpOk = await runPdp();
const coreBad = await runCore((W) => { W.colCount['aurora-viva'] = 11; });

let r = asm(['report', '--core', w('core.json', coreOk), '--pdp', w('pdp.json', pdpOk), '--external', w('ext.json', external()), '--out', path.join(tmp, 'o1')]);
ok(r.status === 0 && /verdict: CERTIFIED/.test(r.stdout), 'green end-to-end -> exit 0 CERTIFIED', [r.status, r.stdout, r.stderr]);
const md = fs.readFileSync(path.join(tmp, 'o1', 'post-launch-certification.md'), 'utf8');
ok(/\*\*Verdict: CERTIFIED\*\*/.test(md) && /## Expected values/.test(md) && !/MISMATCH/.test(md), 'markdown has expected-values table with no mismatch');
const j1 = JSON.parse(fs.readFileSync(path.join(tmp, 'o1', 'post-launch-certification.json'), 'utf8'));
ok(j1.expected.length === 18 && j1.expected.every((e) => e.ok), 'expected table all ok (29/98/95/51, collections, search, filters)', [j1.expected.length, j1.expected.filter((e) => !e.ok)]);

r = asm(['report', '--core', w('core2.json', coreBad), '--pdp', w('pdp.json', pdpOk), '--external', w('ext.json', external()), '--out', path.join(tmp, 'o2')]);
ok(r.status === 1 && /NOT_CERTIFIED/.test(r.stdout), 'core failure -> exit 1', [r.status, r.stdout]);
const j2 = JSON.parse(fs.readFileSync(path.join(tmp, 'o2', 'post-launch-certification.json'), 'utf8'));
ok(j2.failures.some((f) => f.includes('/collections/aurora-viva')) && j2.expected.some((e) => !e.ok && e.what === '/collections/aurora-viva'), 'failure names the collection');

r = asm(['report', '--core', w('core.json', coreOk), '--pdp', w('pdp.json', pdpOk), '--external', w('ext3.json', { checks: {} }), '--out', path.join(tmp, 'o3')]);
ok(r.status === 2 && /INCOMPLETE/.test(r.stdout), 'no external checks -> exit 2 INCOMPLETE', [r.status, r.stdout]);

r = asm(['report', '--core', w('core.json', coreOk), '--pdp', w('pdp.json', pdpOk), '--external', w('ext4.json', external({ shipping_rate: { status: 'FAIL', evidence: 'no rate shown' } })), '--out', path.join(tmp, 'o4')]);
ok(r.status === 1, 'external FAIL -> exit 1');

// redirects subcommand against the lab export (dry run must not modify the file)
const labRed = 'C:/Users/user/AppData/Local/Temp/claude/C--CLAUDE-rada-main-rada-main/34c11d0a-7250-45aa-b727-3081da1b069a/scratchpad/lab-redirects.json';
if (fs.existsSync(labRed)) {
  const before = fs.readFileSync(path.join(ROOT, 'post-launch-cert-core.js'), 'utf8');
  r = asm(['redirects', '--from', labRed]);
  ok(r.status === 0 && /pairs 51 \(same-origin 42, \/account\* 9\)/.test(r.stdout) && /dry run/.test(r.stdout), 'redirects dry run 51/42/9', r.stdout);
  ok(fs.readFileSync(path.join(ROOT, 'post-launch-cert-core.js'), 'utf8') === before, 'dry run leaves the script untouched');
  // the embedded list equals the lab export exactly (same order)
  const lab = JSON.parse(fs.readFileSync(labRed, 'utf8')).urlRedirects.nodes.map((n) => [n.path, n.target]);
  ok(JSON.stringify(lab) === JSON.stringify(PAIRS), 'embedded REDIRECTS == lab Admin urlRedirects export');
}
r = asm(['check']); ok(r.status === 0, 'assembler check', r.stdout);
r = asm(['selftest']); ok(r.status === 0, 'assembler selftest', r.stdout);

fs.rmSync(tmp, { recursive: true, force: true });
console.log('e2e self-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
