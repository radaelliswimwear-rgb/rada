// Offline self-test for post-launch-cert-core.js  (node selftest/core.selftest.mjs)  - no network, no live site.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeWorld, installGlobals, sessionStore } from './mock-store.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
// PL_CORE=<file> runs the same tests against another copy (e.g. dist/post-launch-cert-core.min.js)
const CODE = fs.readFileSync(process.env.PL_CORE || path.join(here, '..', 'post-launch-cert-core.js'), 'utf8');
const PAIRS = JSON.parse('[' + /\/\*REDIRECTS:BEGIN\*\/\s*const REDIRECTS = \[([\s\S]*?)\];\s*\/\*REDIRECTS:END\*\//.exec(CODE)[1] + ']');

let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; } else { fail++; console.log('  FAIL: ' + name + (extra ? ' -> ' + JSON.stringify(extra) : '')); } };

const FAST = { gap: 0, backoff: 15, settle: 1, extra: 1 };
function fresh(mut, cfg) {
  const W = makeWorld(); W.setRedirects(PAIRS); if (mut) mut(W);
  installGlobals(W);
  globalThis.__PLCFG = Object.assign({}, FAST, cfg || {});
  delete globalThis.__PL;
  const r = vm.runInThisContext(CODE);
  return { W, r };
}
const sum = () => globalThis.__PLSUMMARY();
const POST_OK = new Set(['/cart/add.js', '/cart/clear.js']);

// ---- 0. baseline: everything passes, expected counts, no forbidden POST
{
  const { W, r } = fresh();
  ok(/^PL ready PL-1\.0 base=https:\/\/radaelliswimwear\.com/.test(r), 'paste returns ready string', r);
  ok(PAIRS.length === 51 && PAIRS.filter((p) => /^\/account/.test(p[1])).length === 9, 'embedded pairs 51 / 9 account');
  const s = await globalThis.__PLRUN('all');
  ok(s.verdict === 'PASS', 'baseline verdict PASS', s);
  ok(s.ran.length === 10 && s.missing.length === 0, 'all 10 phases ran', s.missing);
  ok(s.totals.fail === 0, 'baseline 0 failures', s.fails);
  ok(s.cartClean === true, 'cart clean at end');
  ok(W.cart.length === 0, 'mock cart really empty');
  ok(W.posts.every((p) => POST_OK.has(p)), 'only allowed POSTs', W.posts);
  ok(W.posts.filter((p) => p === '/cart/add.js').length === 1, 'exactly one add.js');
  const rows = (k) => globalThis.__PLROWS(k);
  ok(rows('routes').length === 25 || rows('routes').length === 27, 'routes rows count', rows('routes').length);
  ok(rows('redirects').length === 53, 'redirects rows = 51 + 2 inventory', rows('redirects').length);
  ok(rows('redirects').filter((x) => x.type === 'opaqueredirect').length === 9, '9 manual opaqueredirect rows');
  const cat = globalThis.__PL.catalog;
  ok(cat.products === 29 && cat.variants === 98 && cat.images === 95, 'catalog 29/98/95', [cat.products, cat.variants, cat.images]);
  const pr = rows('routes');
  const byP = Object.fromEntries(pr.map((x) => [x.k, x]));
  ok(byP['/collections/oasis-natural'].n === 10 && byP['/collections/aurora-viva'].n === 12 && byP['/collections/espuma-de-ola'].n === 7 && byP['/collections/salidas-de-bano'].n === 0 && byP['/collections/destacados'].n === 7, 'collection counts 10/12/7/0/7');
  ok(byP['/collections/all'].n === 24 && byP['/collections/all?page=2'].n === 5, 'all 24 + 5');
  const sr = rows('search').map((x) => x.n);
  ok(JSON.stringify(sr) === '[2,2,3,0]', 'search 2/2/3/0', sr);
  const fr = rows('filters');
  ok(fr[0].n === 11 && fr[1].n === 6, 'XL=11 NEGRO=6', fr.map((x) => x.n));
  ok(typeof fr[2].exp === 'number' && fr[2].exp === fr[2].n, 'price filter derived expectation', fr[2]);
  ok(rows('links').filter((x) => x.k.startsWith('social')).length === 4, '4 social rows');
  ok(JSON.parse(globalThis.__PLDUMP()).phases.routes.rows.length > 20, 'dump parses');
  ok(JSON.stringify(s).length < 3000, 'summary compact', JSON.stringify(s).length);
}

// ---- helpers for mutation scenarios
async function scenario(name, mut, phase, expectFail, opts, cfg) {
  const { W } = fresh(mut, cfg);
  if (phase === 'catalog+') await globalThis.__PLRUN('catalog');
  const res = await globalThis.__PLRUN(phase === 'catalog+' ? 'hostRedirect' : phase, opts || {});
  const s = sum();
  const joined = (res.fail || []).join(' | ');
  ok(expectFail ? (res.fail.length > 0 && (typeof expectFail === 'string' ? joined.includes(expectFail) : true)) : res.fail.length === 0, name, { fail: res.fail, warn: res.warn });
  ok(W.posts.every((p) => POST_OK.has(p)), name + ' (POST guard)', W.posts);
  return { W, res, s };
}

await scenario('collection 10->9 detected', (W) => { W.colCount['oasis-natural'] = 9; }, 'routes', '/collections/oasis-natural');
await scenario('storefront password detected', (W) => { W.passwordOn = true; }, 'routes', 'PASSWORD');
await scenario('suspicious text is soft warn (not fail)', (W) => { W.suspiciousOn = '/pages/envios'; }, 'routes', false);
{ const { res } = await scenario('suspicious text warn present', (W) => { W.suspiciousOn = '/pages/envios'; }, 'routes', false); ok(res.warn.some((w) => w.includes('Translation missing') || w.includes('suspicious')), 'suspicious warn text', res.warn); }
await scenario('all page2 4 != 5 detected', (W) => { W.allP2 = 4; }, 'routes', '/collections/all?page=2');
await scenario('search marea 3 detected', (W) => { W.search.marea = 3; }, 'search', 'marea');
await scenario('XL=10 detected', (W) => { W.xl = 10; }, 'filters', 'talla=XL');
await scenario('NEGRO=7 detected', (W) => { W.negro = 7; }, 'filters', 'NEGRO');
await scenario('redirect 404 detected', (W) => { W.brokenRedirect.add('/producto/bikini-foam'); }, 'redirects', '/producto/bikini-foam');
await scenario('/cuenta redirect missing detected', (W) => { W.brokenAccount.add('/cuenta/registro'); }, 'redirects', '/cuenta/registro');
await scenario('redirect only subset via opts.only', null, 'redirects', false, { only: ['/devoluciones'] });
await scenario('myshopify link in footer detected', (W) => { W.footerExtra = '<a href="https://x.myshopify.com/pages/a">m</a>'; }, 'links', 'myshopify');
await scenario('www-host link detected', (W) => { W.footerExtra = '<a href="https://www.radaelliswimwear.com/pages/a">m</a>'; }, 'links', 'other-host');
await scenario('missing tiktok detected', (W) => { W.socialHtml = W.socialHtml.replace(/<a href="https:\/\/www\.tiktok[^>]+>tt<\/a>/, ''); }, 'links', 'social tiktok');
await scenario('hreflang es missing detected', (W) => { delete W.hreflang.es; }, 'locale', 'hreflang');
await scenario('canonical on myshopify host detected', (W) => { W.canonicalHost = 'x.myshopify.com'; }, 'locale', 'canonical');
await scenario('lang wrong detected', (W) => { W.lang = 'en'; }, 'locale', 'html lang');
await scenario('Shopify.locale wrong in HTML detected', (W) => { W.slOverride = 'en'; }, 'locale', 'Shopify.locale');
{ const { res } = await scenario('Shopify.locale absent in HTML: tab value used for /, soft for /en/', (W) => { W.noLocaleScript = true; }, 'locale', false); ok(res.warn.some((w) => w.includes('/en/ Shopify.locale')) && !res.warn.some((w) => w.startsWith('/ Shopify.locale')), 'absent locale => only /en/ warns', res.warn); }
await scenario('/en/ 404 is soft', (W) => { W.enStatus = 404; }, 'locale', false);
await scenario('robots Disallow: / detected', (W) => { W.robots = 'User-agent: *\nDisallow: /\n'; }, 'locale', 'robots');
await scenario('sitemap foreign host detected', (W) => { W.sitemap = '<loc>https://x.myshopify.com/s.xml</loc>'; }, 'locale', 'sitemap');
await scenario('currency wrong detected', (W) => { W.currency = 'USD'; }, 'locale', 'currency');
// host redirect
await scenario('www redirects -> PASS', (W) => { W.wwwMode = 'redirect'; }, 'hostRedirect', false);
{ const { res } = await scenario('www serves content -> soft warn only', (W) => { W.wwwMode = 'serve'; }, 'hostRedirect', false); ok(res.warn.length === 3, 'serve warn x3', res.warn); }
await scenario('www unreachable -> FAIL', (W) => { W.wwwMode = 'error'; }, 'hostRedirect', 'unreachable');
// responsive
await scenario('responsive baseline', null, 'responsive', false);
await scenario('overflow 390 detected', (W) => { W.overflow['/@390'] = 520; }, 'responsive', 'overflow');
await scenario('broken images detected', (W) => { W.imgBroken = true; }, 'responsive', 'broken imgs');
await scenario('iframe console error detected', (W) => { W.iframeErr = ['TypeError: boom']; }, 'responsive', 'console');
await scenario('srcdoc artifacts ignored', (W) => { W.iframeErr = ['storefrontBaseUrl x', 'replaceState SecurityError', 'Script error.']; }, 'responsive', false);
{ const { res } = await scenario('pending images = warn only', (W) => { W.imgPending = true; }, 'responsive', false); ok(res.warn.length > 0, 'pending warn present'); }
// 429 handling
{
  const { W, res, s } = await scenario('429 once then OK', (W) => { W.throttle = { path: '/collections/aurora-viva', times: 1 }; }, 'routes', false);
  ok(s.retries429 === 1, '429 retried once', s.retries429);
}
await scenario('429 forever -> throttled failure', (W) => { W.throttle = { path: '/collections/aurora-viva', times: 99 }; }, 'routes', 'throttled', null, { retries: 2 });
// cart
{
  const { W, res, s } = await scenario('cart baseline clean', null, 'cart', false);
  ok(s.cartClean === true && W.cart.length === 0, 'cart cleaned');
}
{
  const { W, s } = await scenario('cart add 422 -> fail but still cleaned', (W) => { W.addStatus = 422; }, 'cart', 'add.js');
  ok(s.cartClean === true && W.cart.length === 0, 'cart cleaned after failure');
}
{
  const { W, res, s } = await scenario('cart keep:true leaves 1 item', null, 'cart', false, { keep: true });
  ok(W.cart.length === 1 && s.cartClean === false, 'cart kept dirty', { c: W.cart.length, cc: s.cartClean });
  ok(res.warn.some((w) => w.includes('cart kept')), 'keep warning');
  const c = await globalThis.__PLRUN('clean');
  ok(c.fail.length === 0 && W.cart.length === 0 && sum().cartClean === true, 'clean phase empties cart');
}
{
  const { W, res } = await scenario('cart clear not honoured -> fail', (W) => { W.cartKeepOnClear = true; }, 'cart', 'cart clear');
}
// summary semantics
{
  fresh();
  await globalThis.__PLRUN('routes');
  const s = sum();
  ok(s.verdict === 'PASS_PARTIAL' && s.missing.length === 9, 'partial run -> PASS_PARTIAL', s.verdict);
}
{
  fresh((W) => { W.colCount['aurora-viva'] = 1; });
  await globalThis.__PLRUN('routes');
  ok(sum().verdict === 'FAIL', 'failure -> FAIL');
}
// background mode + status + busy guard
{
  fresh();
  const started = globalThis.__PLRUN('search', { bg: true });
  ok(/^started search/.test(started), 'bg returns started', started);
  const again = vm.runInThisContext(CODE);
  ok(/^PL BUSY/.test(again), 're-paste blocked while running', again);
  const st = globalThis.__PLSTATUS();
  ok(st.pending >= 1, 'status shows pending');
  await new Promise((r) => setTimeout(r, 200));
  ok(sum().verdict === 'PASS_PARTIAL', 'bg phase completed');
}
// BASE mismatch
{
  const W = makeWorld(); installGlobals(W);
  globalThis.__PLCFG = { BASE: 'https://www.radaelliswimwear.com' }; delete globalThis.__PL;
  const r = vm.runInThisContext(CODE);
  ok(/^PL ERROR: BASE/.test(r), 'BASE mismatch refused', r);
}
// results survive a navigation (sessionStorage) only when restore:true; reset clears them
{
  fresh();
  await globalThis.__PLRUN('search');
  ok(sessionStore.has('__PL_RES'), 'results persisted to sessionStorage');
  fresh(null, { restore: false });
  ok(Object.keys(globalThis.__PL.res).length === 0 && sum().verdict === 'NOT_RUN', 'no restore by default (fresh state, NOT_RUN)', sum().verdict);
  fresh(null, { restore: true });
  ok(globalThis.__PL.res.search && globalThis.__PL.res.search.state === 'done' && sum().ran.join() === 'search', 'restore:true brings back the previous phases', sum().ran);
  ok(globalThis.__PLRESET() === 'PL results reset' && !sessionStore.has('__PL_RES') && Object.keys(globalThis.__PL.res).length === 0, '__PLRESET clears memory and storage');
  // interrupted phase is restored as error
  fresh(); globalThis.__PL.res.routes = { phase: 'routes', state: 'running', n: 0, pass: 0, rows: [], fail: [], warn: [], info: {}, i: 3, total: 25, secs: 0 };
  sessionStore.set('__PL_RES', JSON.stringify({ ts: 1, res: globalThis.__PL.res, retries: 0, reqs: 0, cart: { touched: false, clean: null } }));
  fresh(null, { restore: true });
  ok(globalThis.__PL.res.routes.state === 'error' && sum().verdict === 'FAIL', 'interrupted phase restored as error');
  sessionStore.clear();
}
// unknown phase
{
  fresh();
  const r = await globalThis.__PLRUN('nope');
  ok(/unknown phase/.test(r), 'unknown phase message');
}

console.log('core self-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
