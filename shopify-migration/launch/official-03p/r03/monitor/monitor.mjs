#!/usr/bin/env node
/**
 * monitor.mjs - Radaelli Swimwear post-launch monitor (ONE pass, READ-ONLY).
 *
 * Store : wgcvpd-ib.myshopify.com   Domain: https://radaelliswimwear.com
 * Needs : Node 20+ (built-ins only) and, for Admin checks, the Shopify CLI already logged in
 *         to the store (`shopify.cmd store execute ...`, queries only, never --allow-mutations).
 *
 * Usage (PowerShell):
 *   node monitor.mjs --quick                 DNS + TLS + HTTP basics        (~30 s)
 *   node monitor.mjs --full                  everything except checkout     (~90 s)  [default]
 *   node monitor.mjs --full --checkout       adds the checkout reachability probe (adds a cart + opens /checkout, pays nothing)
 *   node monitor.mjs --full --write-baseline first time only: store today's good values as baseline.json
 * Options: --out <dir> (where run-<stamp>.json/.md go; default = folder of this script)
 *          --baseline <file>   --no-admin   --force (overwrite baseline)   --help
 *
 * Exit code: 0 = all OK (INFO allowed) | 1 = warnings/drift | 2 = critical
 *
 * Safety: GET/HEAD-style HTTP (plus POST /cart/add.js and /cart/clear.js only with --checkout),
 * DNS queries, TLS handshake, GraphQL *queries*. Never writes to Shopify, Wompi, Envia, Meta or DNS.
 * Never reads or prints customer personal data (no emails, names, addresses, phones).
 */
import dns from 'node:dns';
import tls from 'node:tls';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ config */
const CFG = {
  version: '1.0.0',
  domain: 'radaelliswimwear.com',
  store: 'wgcvpd-ib.myshopify.com',
  cli: process.platform === 'win32' ? 'shopify.cmd' : 'shopify',
  authNs: 'ns1.dns-parking.com',
  authFallbackIps: ['162.159.24.201'],
  publicResolvers: ['1.1.1.1', '8.8.8.8'],
  ua: 'Mozilla/5.0 (compatible; RadaelliMonitor/1.0; +read-only-healthcheck)',
  paceMs: 1700,        // minimum gap between HTTP request starts (Shopify throttles ~1 req/1.6 s)
  timeoutMs: 20000,
  slowMs: 4000,
  tz: 'America/Bogota',
  collections: ['oasis-natural', 'aurora-viva', 'espuma-de-ola'],
  pdp: '/products/brisa-natural-beige',
  legacy: ['/oasis-natural', '/producto/brisa-natural-beige', '/devoluciones'],
  expect: {
    apexA: ['23.227.38.65'],
    wwwCname: 'shops.myshopify.com',
    mxHosts: ['mx1.hostinger.com', 'mx2.hostinger.com'],
    nsHosts: ['ns1.dns-parking.com', 'ns2.dns-parking.com'],
    spfInclude: 'include:_spf.mail.hostinger.com',
    shopifyIpPrefix: '23.227.38.',
    certWarnDays: 21,
    products: 29, variants: 98, images: 95,
    themeName: 'Radaelli RC1.10',
    shopName: 'Radaelli Swimwear',
    currency: 'COP', timezone: 'America/Bogota', taxesIncluded: false, taxShipping: false,
    priceRatio: 0.8,
    inventoryDeltaAlarmUnits: 28,
    shipping: { zones: 5, paidRates: [9900, 12900, 17900, 21900, 44900], freeThreshold: 299900 },
    launchIso: '2026-10-02T16:23:00Z', // 2026-10-02 11:23 America/Bogota
    pendingMaxMinutes: 60,
  },
};
CFG.www = 'www.' + CFG.domain;
CFG.base = 'https://' + CFG.domain;

/* ------------------------------------------------------------------- args */
const argv = process.argv.slice(2);
const has = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
if (has('--help') || has('-h')) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 24).join('\n'));
  process.exit(0);
}
if (has('--quick') && has('--full')) { console.error('Use either --quick or --full, not both.'); process.exit(2); }
const MODE = has('--quick') ? 'quick' : 'full';
const WITH_CHECKOUT = has('--checkout');
const WITH_ADMIN = MODE === 'full' && !has('--no-admin');
const OUT_DIR = path.resolve(opt('--out', HERE));
const BASELINE_FILE = path.resolve(opt('--baseline', path.join(HERE, 'baseline.json')));
const WRITE_BASELINE = has('--write-baseline');

/* ---------------------------------------------------------------- helpers */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lc = (s) => String(s).toLowerCase().replace(/\.$/, '');
const sortedUniq = (a) => [...new Set(a)].sort();
const eqArr = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const money = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const bogota = (d = new Date()) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: CFG.tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value]));
  const hh = p.hour === '24' ? '00' : p.hour;
  return `${p.year}-${p.month}-${p.day} ${hh}:${p.minute}:${p.second}`;
};
const stampOf = (d) => bogota(d).replace(/[-: ]/g, '').replace(/^(\d{8})(\d{6})$/, '$1-$2');
const RANK = { OK: 0, INFO: 0, SKIP: 0, DRIFT: 1, WARN: 1, CRIT: 2 };
const SECTION_ORDER = ['DNS', 'TLS', 'HTTP', 'ROUTES', 'CATALOG', 'CHECKOUT', 'ADMIN', 'WOMPI', 'BASELINE'];

function mkSection(name) {
  const checks = [];
  return {
    name, checks,
    add(id, label, status, detail, data) {
      checks.push({ section: name, id, label, status, detail, ...(data !== undefined ? { data } : {}) });
      return status;
    },
  };
}
const obs = { dns: null, tls: {}, http: {}, admin: {} };
const notes = [];

/* -------------------------------------------------------------------- DNS */
const mkResolver = (servers) => { const r = new dns.promises.Resolver({ timeout: 4000, tries: 2 }); r.setServers(servers); return r; };
const q = async (fn) => { try { return { ok: true, v: await fn() }; } catch (e) { return { ok: false, code: e.code || e.message }; } };
const UNREACH = new Set(['ETIMEOUT', 'ECONNREFUSED', 'ESERVFAIL', 'EREFUSED', 'ECONNRESET', 'EAI_AGAIN', 'ETIMEDOUT']);
const NODATA = new Set(['ENODATA', 'ENOTFOUND']);

function judgeDns(S, id, label, results, evalFn, sev) {
  const rows = Object.entries(results).map(([n, res]) => ({ n, ...evalFn(res) }));
  const failing = rows.filter((r) => r.ok === false);
  const unknown = rows.filter((r) => r.ok === null);
  let status;
  if (failing.length === 0) status = unknown.length === rows.length ? 'WARN' : 'OK';
  else if (failing.some((r) => r.n === 'auth') || unknown.some((r) => r.n === 'auth')) status = sev;
  else status = 'WARN'; // only public resolvers differ: cache / propagation
  const note = failing.length && results.auth && !failing.some((r) => r.n === 'auth') ? ' (authoritative OK; public differs = cache/propagation)' : '';
  S.add(id, label, status, rows.map((r) => `${r.n}: ${r.text}`).join(' | ') + note);
  return status;
}
const rawOk = (res, f) => {
  if (res.ok) return f(res.v);
  if (UNREACH.has(res.code)) return { ok: null, text: `no answer (${res.code})` };
  return { ok: false, text: `ERR ${res.code}` };
};

async function runDns() {
  const S = mkSection('DNS');
  const boot = mkResolver(CFG.publicResolvers);
  let authIps = await boot.resolve4(CFG.authNs).catch(() => null);
  if (!authIps || !authIps.length) { authIps = CFG.authFallbackIps; notes.push(`Authoritative NS IP taken from fallback ${authIps.join(',')}`); }
  const D = CFG.domain, W = CFG.www, E = CFG.expect;
  const resolvers = { auth: mkResolver(authIps), '1.1.1.1': mkResolver(['1.1.1.1']), '8.8.8.8': mkResolver(['8.8.8.8']) };
  const R = {};
  await Promise.all(Object.entries(resolvers).map(async ([n, r]) => {
    const [A, AAAA, CNAME, MX, TXT, NS, wwwA] = await Promise.all([
      q(() => r.resolve4(D)), q(() => r.resolve6(D)), q(() => r.resolveCname(W)), q(() => r.resolveMx(D)),
      q(() => r.resolveTxt(D)), q(() => r.resolveNs(D)),
      // NOTE: do NOT ask the authoritative server for www A: it chases the CNAME with its own (parking) data.
      n === 'auth' ? Promise.resolve(null) : q(() => r.resolve4(W)),
    ]);
    R[n] = { A, AAAA, CNAME, MX, TXT, NS, wwwA };
  }));
  const pick = (type, names) => Object.fromEntries(names.filter((n) => R[n] && R[n][type]).map((n) => [n, R[n][type]]));
  const all = ['auth', '1.1.1.1', '8.8.8.8'], pubs = ['1.1.1.1', '8.8.8.8'];

  judgeDns(S, 'DNS-A', `A ${D} = ${E.apexA.join(',')}`, pick('A', all), (res) => rawOk(res, (v) => {
    const s = [...v].sort(); return { ok: eqArr(s, E.apexA), text: s.join(',') };
  }), 'CRIT');
  judgeDns(S, 'DNS-WWW', `CNAME www = ${E.wwwCname}`, pick('CNAME', all), (res) => rawOk(res, (v) => {
    const s = v.map(lc).sort(); return { ok: eqArr(s, [E.wwwCname]), text: s.join(',') };
  }), 'CRIT');
  judgeDns(S, 'DNS-WWWPUB', 'www resolves into Shopify range (public)', pick('wwwA', pubs), (res) => rawOk(res, (v) => ({
    ok: v.every((ip) => ip.startsWith(E.shopifyIpPrefix)), text: v.join(','),
  })), 'WARN');
  judgeDns(S, 'DNS-MX', 'MX = mx1/mx2.hostinger.com', pick('MX', all), (res) => rawOk(res, (v) => {
    const hosts = v.map((m) => lc(m.exchange)).sort(); return { ok: eqArr(hosts, E.mxHosts), text: v.sort((a, b) => a.priority - b.priority).map((m) => `${m.priority} ${lc(m.exchange)}`).join(',') };
  }), 'CRIT');
  judgeDns(S, 'DNS-TXT', 'TXT: facebook + google verification + SPF(hostinger)', pick('TXT', all), (res) => rawOk(res, (v) => {
    const t = v.map((a) => a.join(''));
    const fb = t.some((x) => x.startsWith('facebook-domain-verification='));
    const gg = t.some((x) => x.startsWith('google-site-verification='));
    const spfs = t.filter((x) => x.startsWith('v=spf1'));
    const spf = spfs.length === 1 && spfs[0].includes(E.spfInclude);
    return { ok: fb && gg && spf, text: `fb=${fb ? 'y' : 'MISSING'} google=${gg ? 'y' : 'MISSING'} spf=${spf ? 'y' : spfs.length > 1 ? 'DUPLICATE' : 'MISSING'} n=${t.length}` };
  }), 'WARN');
  judgeDns(S, 'DNS-NS', 'NS = ns1/ns2.dns-parking.com', pick('NS', all), (res) => rawOk(res, (v) => {
    const s = v.map(lc).sort(); return { ok: eqArr(s, E.nsHosts), text: s.join(',') };
  }), 'WARN');
  judgeDns(S, 'DNS-AAAA', 'No AAAA at apex', pick('AAAA', all), (res) => {
    if (res.ok) return { ok: false, text: `AAAA present: ${res.v.join(',')}` };
    if (NODATA.has(res.code)) return { ok: true, text: 'none' };
    return UNREACH.has(res.code) ? { ok: null, text: `no answer (${res.code})` } : { ok: false, text: `ERR ${res.code}` };
  }, 'WARN');

  // observations (authoritative first, else 1.1.1.1)
  const val = (type) => { for (const n of all) { const r = R[n] && R[n][type]; if (r && r.ok) return r.v; } return null; };
  const txt = val('TXT'), mx = val('MX');
  obs.dns = {
    apexA: val('A') ? [...val('A')].sort() : null,
    wwwCname: val('CNAME') ? val('CNAME').map(lc).sort() : null,
    mx: mx ? mx.map((m) => `${m.priority} ${lc(m.exchange)}`).sort() : null,
    txt: txt ? txt.map((a) => a.join('')).sort() : null,
    ns: val('NS') ? val('NS').map(lc).sort() : null,
    aaaaApex: val('AAAA') || [],
  };
  return S.checks;
}

/* -------------------------------------------------------------------- TLS */
function tlsProbe(host) {
  return new Promise((resolve) => {
    let done = false;
    const fin = (v) => { if (!done) { done = true; resolve(v); } };
    const sock = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: 10000 }, () => {
      const c = sock.getPeerCertificate(true);
      const idErr = tls.checkServerIdentity(host, c);
      fin({
        host, authorized: sock.authorized, authError: sock.authorizationError ? String(sock.authorizationError) : null,
        protocol: sock.getProtocol(), subjectCN: c.subject && c.subject.CN, issuerO: c.issuer && c.issuer.O, issuerCN: c.issuer && c.issuer.CN,
        validFrom: c.valid_from, validTo: c.valid_to, san: c.subjectaltname || null,
        daysLeft: (Date.parse(c.valid_to) - Date.now()) / 864e5, nameError: idErr ? idErr.message : null,
      });
      sock.end();
    });
    sock.on('timeout', () => { sock.destroy(); fin({ host, error: 'timeout' }); });
    sock.on('error', (e) => fin({ host, error: e.code || e.message }));
  });
}
async function runTls() {
  const S = mkSection('TLS');
  const res = await Promise.all([CFG.domain, CFG.www].map(tlsProbe));
  for (const r of res) {
    const id = r.host === CFG.domain ? 'TLS-APEX' : 'TLS-WWW';
    const label = `Certificate ${r.host}`;
    if (r.error) { S.add(id, label, 'CRIT', `TLS handshake failed: ${r.error}`); continue; }
    const days = r.daysLeft;
    const expiry = new Date(Date.parse(r.validTo)).toISOString().slice(0, 10);
    let status = 'OK';
    const problems = [];
    if (!r.authorized) { status = 'CRIT'; problems.push(`not trusted: ${r.authError}`); }
    if (r.nameError) { status = 'CRIT'; problems.push(`name mismatch: ${r.nameError}`); }
    if (days <= 0) { status = 'CRIT'; problems.push('EXPIRED'); }
    else if (days < CFG.expect.certWarnDays && status === 'OK') { status = 'WARN'; problems.push(`only ${days.toFixed(0)} days left`); }
    S.add(id, label, status, `CN=${r.subjectCN} issuer=${r.issuerO}/${r.issuerCN} expires ${expiry} (${days.toFixed(0)} d left) ${r.protocol}${problems.length ? ' !! ' + problems.join('; ') : ''}`,
      { subjectCN: r.subjectCN, issuer: `${r.issuerO}/${r.issuerCN}`, notAfter: new Date(Date.parse(r.validTo)).toISOString(), daysLeft: Math.round(days * 10) / 10, san: r.san });
    obs.tls[r.host === CFG.domain ? 'apex' : 'www'] = { subjectCN: r.subjectCN, issuer: `${r.issuerO}/${r.issuerCN}`, notAfter: new Date(Date.parse(r.validTo)).toISOString() };
  }
  return S.checks;
}

/* ------------------------------------------------------------------- HTTP */
class Halt extends Error {}
function makeHttp() {
  let last = 0, gap = CFG.paceMs, halted = false;
  const st = { requests: 0, throttled: 0, halted: false };
  async function pace() { const w = last + gap - Date.now(); if (w > 0) await sleep(w); last = Date.now(); }
  function updateJar(jar, res) {
    for (const sc of (res.headers.getSetCookie ? res.headers.getSetCookie() : [])) {
      const [pair] = sc.split(';'); const i = pair.indexOf('='); if (i < 1) continue;
      const name = pair.slice(0, i).trim(), value = pair.slice(i + 1).trim();
      if (/max-age=0/i.test(sc) || value === '' || /expires=Thu, 01 Jan 1970/i.test(sc)) jar.delete(name); else jar.set(name, value);
    }
  }
  async function req(url, { method = 'GET', headers = {}, body, jar, wantBody = true } = {}) {
    if (halted) throw new Halt('halted after repeated 429');
    for (let attempt = 0; attempt < 3; attempt++) {
      await pace(); st.requests++;
      const h = { 'user-agent': CFG.ua, 'accept-language': 'es-CO,es;q=0.9', accept: '*/*', ...headers };
      if (jar && jar.size) h.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
      const t0 = performance.now();
      let res, text = '';
      try {
        res = await fetch(url, { method, headers: h, body, redirect: 'manual', signal: AbortSignal.timeout(CFG.timeoutMs) });
        text = wantBody ? await res.text() : (await res.arrayBuffer(), '');
      } catch (e) {
        return { url, status: 0, error: (e.cause && (e.cause.code || e.cause.message)) || e.message, ms: Math.round(performance.now() - t0), headers: new Headers(), text: '' };
      }
      const ms = Math.round(performance.now() - t0);
      if (res.status === 429) {
        st.throttled++;
        if (attempt === 2) { halted = true; st.halted = true; throw new Halt('429 persisted after 2 back-offs'); }
        const ra = Number(res.headers.get('retry-after')) || 0;
        gap = Math.min(gap * 2, 8000);
        await sleep(Math.min(Math.max(ra * 1000, 8000 * (attempt + 1)), 60000));
        continue;
      }
      if (jar) updateJar(jar, res);
      return { url, status: res.status, headers: res.headers, location: res.headers.get('location'), text, bytes: Buffer.byteLength(text), ms };
    }
  }
  async function follow(url, opts = {}) {
    const hops = []; let cur = url;
    for (let i = 0; i < 6; i++) {
      const r = await req(cur, opts);
      hops.push({ url: cur, status: r.status, location: r.location || null, ms: r.ms });
      if (r.error) return { hops, final: r, finalUrl: cur, error: r.error };
      if ([301, 302, 303, 307, 308].includes(r.status) && r.location) { cur = new URL(r.location, cur).toString(); continue; }
      return { hops, final: r, finalUrl: cur };
    }
    return { hops, final: null, finalUrl: cur, error: 'too many redirects' };
  }
  return { req, follow, st };
}

const normUrl = (u) => u.replace(/\/+$/, '');
const titleOf = (html) => { const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i); return m ? m[1].replace(/\s+/g, ' ').trim() : null; };
const looksLikePassword = (html) => /<form[^>]*action=["']\/password|id=["']password-page|template-password/i.test(html);
const redact = (u) => u.replace(/(\/checkouts\/(?:cn\/)?)[^/?#]+/i, '$1<token>').replace(/\?.*$/, '?...');
const pathOf = (u) => { try { const x = new URL(u); return x.pathname + (x.search || ''); } catch { return u; } };

async function step(S, id, label, fn) {
  try { await fn(); }
  catch (e) {
    if (e instanceof Halt) S.add(id, label, 'SKIP', 'skipped: HTTP stopped after repeated 429 (re-run later, slower)');
    else S.add(id, label, 'CRIT', `script error: ${e.message}`);
  }
}

async function runHttp(http) {
  const S = mkSection('HTTP'), R = mkSection('ROUTES'), C = mkSection('CATALOG'), K = mkSection('CHECKOUT');
  const E = CFG.expect, base = CFG.base;
  let productsJson = null;

  const redirHttps = async (id, label, url) => step(S, id, label, async () => {
    const r = await http.req(url, { wantBody: false });
    if (r.error) return S.add(id, label, 'CRIT', `request failed: ${r.error}`);
    const loc = r.location || '';
    if (r.status === 301 && loc.startsWith('https://')) S.add(id, label, 'OK', `301 -> ${loc} (${r.ms} ms)`);
    else if ([302, 303, 307, 308].includes(r.status) && loc.startsWith('https://')) S.add(id, label, 'WARN', `${r.status} (expected 301) -> ${loc}`);
    else S.add(id, label, 'CRIT', `status ${r.status} location=${loc || '-'} (expected 301 to https)`);
  });
  await redirHttps('HTTP-HTTP-APEX', 'http://apex -> https 301', `http://${CFG.domain}/`);
  await redirHttps('HTTP-HTTP-WWW', 'http://www -> https 301', `http://${CFG.www}/`);

  await step(S, 'HTTP-WWW', 'https://www -> apex 301', async () => {
    const r = await http.req(`https://${CFG.www}/`, { wantBody: false });
    if (r.error) return S.add('HTTP-WWW', 'https://www -> apex 301', 'CRIT', `request failed: ${r.error}`);
    const ok = normUrl(r.location || '') === base;
    if (r.status === 301 && ok) S.add('HTTP-WWW', 'https://www -> apex 301', 'OK', `301 -> ${r.location} (${r.ms} ms)`);
    else if ([302, 303, 307, 308].includes(r.status) && ok) S.add('HTTP-WWW', 'https://www -> apex 301', 'WARN', `${r.status} (expected 301) -> ${r.location}`);
    else S.add('HTTP-WWW', 'https://www -> apex 301', r.status === 200 ? 'WARN' : 'CRIT', `status ${r.status} location=${r.location || '-'} (expected 301 -> ${base}/)`);
  });

  await step(S, 'HTTP-HOME', 'Home 200, not /password', async () => {
    const r = await http.req(`${base}/`);
    if (r.error) return S.add('HTTP-HOME', 'Home 200, not /password', 'CRIT', `request failed: ${r.error}`);
    if ([301, 302, 303, 307, 308].includes(r.status)) {
      const pw = /\/password/i.test(r.location || '');
      return S.add('HTTP-HOME', 'Home 200, not /password', 'CRIT', `${pw ? 'STOREFRONT PASSWORD IS ON' : 'unexpected redirect'}: ${r.status} -> ${r.location}`);
    }
    if (r.status !== 200) return S.add('HTTP-HOME', 'Home 200, not /password', 'CRIT', `status ${r.status}`);
    if (looksLikePassword(r.text)) return S.add('HTTP-HOME', 'Home 200, not /password', 'CRIT', 'STOREFRONT PASSWORD PAGE is being served');
    S.add('HTTP-HOME', 'Home 200, not /password', r.ms > CFG.slowMs ? 'WARN' : 'OK', `200, ${r.bytes} B, ${r.ms} ms, title="${titleOf(r.text)}"`);
    const m = r.text.match(/Shopify\.theme\s*=\s*(\{[^;]*?\});/);
    let th = null; try { th = m ? JSON.parse(m[1]) : null; } catch { /* ignore */ }
    obs.http.homeTheme = th ? { name: th.name, id: th.id, role: th.role } : null;
    if (!th) S.add('HTTP-THEME', 'Theme seen on storefront', 'INFO', 'Shopify.theme not found in page source');
    else S.add('HTTP-THEME', `Theme seen on storefront = ${E.themeName}`, th.name === E.themeName && th.role === 'main' ? 'OK' : 'CRIT', `name="${th.name}" id=${th.id} role=${th.role}`);
  });

  await step(S, 'HTTP-ROBOTS', 'robots.txt has no "Disallow: /"', async () => {
    const r = await http.req(`${base}/robots.txt`);
    if (r.error || r.status !== 200) return S.add('HTTP-ROBOTS', 'robots.txt has no "Disallow: /"', 'CRIT', `status ${r.status || r.error}`);
    const blocked = /^[ \t]*Disallow:[ \t]*\/[ \t]*\r?$/im.test(r.text);
    const sm = /^\s*Sitemap:\s*\S+/im.test(r.text);
    S.add('HTTP-ROBOTS', 'robots.txt has no "Disallow: /"', blocked ? 'CRIT' : 'OK', blocked ? 'robots.txt BLOCKS EVERYTHING (Disallow: /) - password/noindex mode?' : `200, ${r.bytes} B, no blanket Disallow, sitemap line ${sm ? 'present' : 'ABSENT'}`);
  });
  await step(S, 'HTTP-SITEMAP', 'sitemap.xml 200', async () => {
    const r = await http.req(`${base}/sitemap.xml`);
    if (r.error || r.status !== 200) return S.add('HTTP-SITEMAP', 'sitemap.xml 200', 'CRIT', `status ${r.status || r.error}`);
    const kids = (r.text.match(/<loc>/g) || []).length;
    const okXml = /<sitemapindex|<urlset/i.test(r.text);
    S.add('HTTP-SITEMAP', 'sitemap.xml 200', okXml ? 'OK' : 'WARN', `200, ${r.bytes} B, ${kids} <loc> entries${okXml ? '' : ' (not a sitemap XML?)'}`);
  });

  if (MODE === 'full') {
    // ---- routes
    const routes = [
      { id: 'ROUTE-ALL', path: '/collections/all', sev: 'CRIT', must: (h) => /\/products\//.test(h) ? null : 'no product links' },
      ...CFG.collections.map((c) => ({ id: `ROUTE-COL-${c}`, path: `/collections/${c}`, sev: 'CRIT', must: (h) => /\/products\//.test(h) ? null : 'no product links' })),
      { id: 'ROUTE-PDP', path: CFG.pdp, sev: 'CRIT', must: (h) => /\/cart\/add/.test(h) ? null : 'no add-to-cart form' },
      { id: 'ROUTE-CART', path: '/cart', sev: 'CRIT' },
      { id: 'ROUTE-SEARCH', path: '/search?q=marea', sev: 'CRIT', must: (h) => /\/products\/[^"' ]*marea/i.test(h) ? null : 'no "marea" product in results' },
      { id: 'ROUTE-POL-CONTACT', path: '/policies/contact-information', sev: 'WARN' },
      { id: 'ROUTE-POL-LEGAL', path: '/policies/legal-notice', sev: 'WARN' },
      { id: 'ROUTE-PAGE-CONTACT', path: '/pages/contact', sev: 'WARN' },
    ];
    const timings = {};
    for (const rt of routes) {
      await step(R, rt.id, `GET ${rt.path}`, async () => {
        const r = await http.req(base + rt.path);
        timings[rt.path] = r.ms;
        if (r.error) return R.add(rt.id, `GET ${rt.path}`, 'CRIT', `request failed: ${r.error}`);
        if ([301, 302, 303, 307, 308].includes(r.status)) return R.add(rt.id, `GET ${rt.path}`, /\/password/i.test(r.location || '') ? 'CRIT' : 'WARN', `redirect ${r.status} -> ${r.location}`);
        if (r.status !== 200) return R.add(rt.id, `GET ${rt.path}`, r.status >= 500 ? 'CRIT' : rt.sev, `status ${r.status}`);
        const why = rt.must ? rt.must(r.text) : null;
        const slow = r.ms > CFG.slowMs;
        R.add(rt.id, `GET ${rt.path}`, why ? 'WARN' : slow ? 'WARN' : 'OK', `200, ${r.bytes} B, ${r.ms} ms${why ? ' !! ' + why : ''}${slow ? ' !! slow' : ''}`);
      });
    }
    obs.http.routeMs = timings;

    // ---- products.json
    await step(C, 'CATALOG-JSON', 'products.json 29 products / 98 variants / 95 images', async () => {
      const r = await http.req(`${base}/products.json?limit=250`);
      if (r.error || r.status !== 200) return C.add('CATALOG-JSON', 'products.json', 'CRIT', `status ${r.status || r.error}`);
      let j; try { j = JSON.parse(r.text); } catch { return C.add('CATALOG-JSON', 'products.json', 'CRIT', 'not valid JSON'); }
      const prods = j.products || [];
      const variants = prods.flatMap((p) => p.variants || []);
      const images = prods.reduce((a, p) => a + (p.images || []).length, 0);
      const soldOut = variants.filter((v) => v.available === false).length;
      productsJson = prods;
      obs.http.productsJson = { products: prods.length, variants: variants.length, images, soldOutVariants: soldOut, handles: prods.map((p) => p.handle).sort() };
      const same = prods.length === E.products && variants.length === E.variants && images === E.images;
      C.add('CATALOG-JSON', `products.json ${E.products}/${E.variants}/${E.images}`, same ? 'OK' : 'WARN',
        `${prods.length} products / ${variants.length} variants / ${images} images; sold-out variants: ${soldOut}${same ? '' : ` !! expected ${E.products}/${E.variants}/${E.images} (a temp draft/archived product may exist in Admin but not here)`}`);
    });

    // ---- legacy redirects
    obs.http.legacy = {};
    for (const p of CFG.legacy) {
      await step(C, `CATALOG-LEGACY${CFG.legacy.indexOf(p) + 1}`, `Legacy redirect ${p}`, async () => {
        const id = `CATALOG-LEGACY${CFG.legacy.indexOf(p) + 1}`, label = `Legacy redirect ${p}`;
        const f = await http.follow(base + p);
        if (f.error) return C.add(id, label, 'CRIT', `failed: ${f.error}`);
        const finalPath = pathOf(f.finalUrl);
        obs.http.legacy[p] = finalPath;
        const first = f.hops[0];
        const chain = f.hops.map((h) => h.status).join('>');
        if (/\/password/i.test(finalPath)) return C.add(id, label, 'CRIT', `ends at /password (${chain})`);
        if (f.final.status === 200 && first.status === 301 && finalPath !== p) C.add(id, label, 'OK', `${chain} -> ${finalPath}`);
        else C.add(id, label, 'WARN', `${chain} -> ${finalPath} (expected 301 then 200 at a new path)`);
      });
    }
  }

  // ---- checkout probe (optional)
  if (WITH_CHECKOUT) {
    await step(K, 'CHECKOUT-RUN', 'Checkout probe', async () => {
      if (!productsJson) {
        const r = await http.req(`${base}/products.json?limit=250`);
        try { productsJson = JSON.parse(r.text).products; } catch { /* handled below */ }
      }
      const v = productsJson && productsJson.flatMap((p) => p.variants).find((x) => x.available);
      if (!v) return K.add('CHECKOUT-ADD', 'Add one available variant to a throwaway cart', 'WARN', 'no available variant found in products.json');
      await checkoutProbe(K, http, v.id);
    });
  }

  if (http.st.throttled && !http.st.halted) S.add('HTTP-429', 'Shopify 429 throttling', 'INFO', `${http.st.throttled} throttled response(s) seen; backed off and recovered (total ${http.st.requests} requests)`);
  if (http.st.halted) S.add('HTTP-429', 'Shopify 429 throttling', 'WARN', `HTTP checks stopped: 429 persisted after back-off (${http.st.throttled} throttled responses). Re-run in a few minutes.`);
  obs.http.requests = http.st.requests;
  return [...S.checks, ...R.checks, ...C.checks, ...K.checks];
}

async function checkoutProbe(K, http, variantId) {
  const jar = new Map(), base = CFG.base;
  const jsonHdr = { 'content-type': 'application/json', accept: 'application/json', 'x-requested-with': 'XMLHttpRequest' };
  let added = false;
  try {
    const add = await http.req(`${base}/cart/add.js`, { method: 'POST', jar, headers: jsonHdr, body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] }) });
    if (add.status !== 200) return K.add('CHECKOUT-ADD', 'Add one available variant to a throwaway cart', 'CRIT', `POST /cart/add.js -> ${add.status || add.error}`);
    added = true;
    K.add('CHECKOUT-ADD', 'Add one available variant to a throwaway cart', 'OK', `POST /cart/add.js 200 (${add.ms} ms)`);
    const co = await http.follow(`${base}/checkout`, { jar });
    if (co.error || !co.final) return K.add('CHECKOUT-PAGE', 'GET /checkout reachable', 'CRIT', `failed: ${co.error}`);
    const fu = new URL(co.finalUrl);
    const chain = co.hops.map((h) => h.status).join('>');
    const redactedFinal = redact(co.finalUrl);
    const where = `${fu.hostname}${redactedFinal.replace(/^https?:\/\/[^/]+/, '')}`;
    const sameDomain = fu.hostname === CFG.domain || fu.hostname.endsWith('.' + CFG.domain);
    const html = co.final.text || '';
    const fs_ = co.final.status;
    const tokenized = /\/checkouts?\/(cn\/)?[^/]+/i.test(fu.pathname); // Shopify created a checkout session
    const hd = co.final.headers;
    const diag = { status: fs_, server: hd.get('server'), cfMitigated: hd.get('cf-mitigated'), contentType: hd.get('content-type'), bytes: co.final.bytes };
    const botBlocked = fs_ === 403 || fs_ === 429 || !!diag.cfMitigated || /\/checkpoint/i.test(fu.pathname);
    // Never try to bypass bot protection: a 403 on the checkout page itself is expected for scripted clients.
    if (/\/password/i.test(fu.pathname)) {
      K.add('CHECKOUT-PAGE', 'GET /checkout creates a checkout session', 'CRIT', `redirected to /password (${chain})`);
    } else if (!tokenized) {
      K.add('CHECKOUT-PAGE', 'GET /checkout creates a checkout session', 'CRIT', `no checkout session created: ${chain} -> ${where} (status ${fs_})`);
    } else if (fs_ === 200) {
      K.add('CHECKOUT-PAGE', 'GET /checkout creates a checkout session (same domain)', sameDomain ? 'OK' : 'WARN', `${chain} -> ${where} (${co.final.ms} ms)${sameDomain ? '' : ' !! different host'}`);
    } else if (botBlocked && sameDomain) {
      K.add('CHECKOUT-PAGE', 'GET /checkout creates a checkout session (same domain)', 'OK',
        `${chain} -> ${where}: Shopify issued a checkout URL on ${fu.hostname}; the page itself answers ${fs_} to scripted clients (bot protection, not bypassed)`);
    } else {
      K.add('CHECKOUT-PAGE', 'GET /checkout creates a checkout session', 'WARN', `${chain} -> ${where} (status ${fs_}${sameDomain ? '' : ', different host'})`);
    }
    const wompi = /wompi/i.test(html);
    const paySection = /payment|pago|gateway/i.test(html);
    obs.http.checkout = { wompiInHtml: wompi, paymentSectionInHtml: paySection, host: fu.hostname, finalStatus: fs_, diag };
    if (fs_ === 200) {
      K.add('CHECKOUT-PAYSECTION', 'Checkout shows a payment section', paySection ? 'OK' : 'WARN', paySection ? 'payment markers found in checkout HTML' : 'no payment markers in server HTML (checkout may render client-side) - inconclusive');
      K.add('WOMPI-HTTP', 'Wompi appears as payment method in checkout HTML', wompi ? 'OK' : 'INFO', wompi ? 'string "Wompi" found in checkout HTML' : 'string "Wompi" not in server HTML (rendered by JS) - verify visually in a browser');
    } else {
      K.add('CHECKOUT-PAYSECTION', 'Checkout shows a payment section', 'INFO', `not verifiable by script: checkout page answers ${fs_} to non-browser clients (server=${diag.server || '-'}${diag.cfMitigated ? ', cf-mitigated=' + diag.cfMitigated : ''}). Verify in a real browser.`);
      K.add('WOMPI-HTTP', 'Wompi appears as payment method in checkout HTML', 'INFO', 'not verifiable by script (see CHECKOUT-PAYSECTION). Proof of live Wompi = orders with test=false and gateway "Wompi" in ADMIN-ORD-24H; confirm visually in a browser.');
    }
  } finally {
    if (added) {
      try {
        const cl = await http.req(`${base}/cart/clear.js`, { method: 'POST', jar, headers: jsonHdr, body: '{}' });
        K.add('CHECKOUT-CLEAR', 'Throwaway cart cleared', cl.status === 200 ? 'OK' : 'WARN', `POST /cart/clear.js -> ${cl.status || cl.error}`);
      } catch (e) { K.add('CHECKOUT-CLEAR', 'Throwaway cart cleared', 'WARN', `not cleared (${e.message}); anonymous cart expires by itself`); }
    }
  }
}

/* ------------------------------------------------------------ Admin (CLI) */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'radaelli-monitor-'));
let qSeq = 0;
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
function runCmd(cmd, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(cmd, { shell: true, windowsHide: true });
    let out = '', err = '', timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true }); else child.kill('SIGKILL');
    }, timeoutMs);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, out: stripAnsi(out), err: stripAnsi(err), timedOut }); });
    child.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, out, err: String(e), timedOut }); });
  });
}
async function gql(query) {
  if (/\bmutation\b|\bsubscription\b/i.test(query)) throw new Error('monitor is READ-ONLY: refusing non-query operation');
  const id = ++qSeq;
  const qf = path.join(TMP, `q${id}.graphql`), of = path.join(TMP, `o${id}.json`);
  fs.writeFileSync(qf, query, 'utf8');
  // NOTE: never add --allow-mutations here.
  const cmd = `${CFG.cli} store execute --store ${CFG.store} --query-file "${qf}" --json --no-color --output-file "${of}"`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await runCmd(cmd, 120000);
    if (r.code === 0 && fs.existsSync(of)) {
      try { return { ok: true, data: JSON.parse(fs.readFileSync(of, 'utf8')) }; } catch (e) { return { ok: false, kind: 'parse', msg: e.message }; }
    }
    const text = (r.out + '\n' + r.err).replace(/[─-╿]/g, ' ').replace(/\s+/g, ' ');
    if (/ACCESS_DENIED|Access denied/i.test(text)) {
      const f = (text.match(/Access denied for (\w+) field/i) || [])[1], sc = (text.match(/(read_\w+)/i) || [])[1];
      return { ok: false, kind: 'denied', msg: `access denied${f ? ' for ' + f : ''}${sc ? ' (needs ' + sc + ')' : ''}` };
    }
    if (/THROTTLED/i.test(text) && attempt < 2) { await sleep(4000 * (attempt + 1)); continue; }
    if (r.timedOut) return { ok: false, kind: 'timeout', msg: 'Shopify CLI timed out' };
    return { ok: false, kind: 'error', msg: text.replace(/<claude-code-hint[^>]*>/g, '').trim().slice(0, 240) };
  }
  return { ok: false, kind: 'error', msg: 'throttled repeatedly' };
}
async function gqlPages(build, pick, maxPages) {
  const nodes = []; let after = null;
  for (let i = 0; i < maxPages; i++) {
    const r = await gql(build(after));
    if (!r.ok) return { ...r, nodes };
    const conn = pick(r.data);
    nodes.push(...conn.nodes);
    if (!conn.pageInfo.hasNextPage) return { ok: true, nodes, complete: true };
    after = conn.pageInfo.endCursor;
  }
  return { ok: true, nodes, complete: false };
}

const SHOP_Q = 'query { shop { name currencyCode ianaTimezone taxesIncluded taxShipping } }';
const THEMES_Q = 'query { themes(first: 25) { nodes { id name role } } }';
const ordersQ = (after) => `query { orders(first: 100, reverse: true, sortKey: CREATED_AT${after ? `, after: ${JSON.stringify(after)}` : ''}) {
  pageInfo { hasNextPage endCursor }
  nodes { name test createdAt tags displayFinancialStatus paymentGatewayNames
    totalPriceSet { shopMoney { amount currencyCode } } totalTaxSet { shopMoney { amount currencyCode } } } } }`;
const productsQ = (after) => `query { products(first: 15${after ? `, after: ${JSON.stringify(after)}` : ''}) {
  pageInfo { hasNextPage endCursor }
  nodes { handle status mediaCount { count }
    variants(first: 15) { pageInfo { hasNextPage } nodes { id sku price compareAtPrice inventoryQuantity availableForSale inventoryItem { tracked } } } } } }`;
const SHIP_Q = `query { deliveryProfiles(first: 5) { nodes { name default profileLocationGroups { locationGroupZones(first: 25) { nodes {
  zone { name }
  methodDefinitions(first: 25) { nodes { name active
    rateProvider { __typename ... on DeliveryRateDefinition { price { amount currencyCode } } }
    methodConditions { field operator conditionCriteria { __typename ... on MoneyV2 { amount } } } } } } } } } } }`;

async function runAdmin() {
  const S = mkSection('ADMIN'), W = mkSection('WOMPI');
  const E = CFG.expect;
  const notReadable = (id, label, r) => S.add(id, label, r.kind === 'denied' ? 'INFO' : 'WARN', r.kind === 'denied' ? `not readable: ${r.msg}` : `query failed (${r.kind}): ${r.msg}`);
  W.add('WOMPI-MANUAL', 'Wompi test/live mode', 'INFO', 'verify manually: Admin > Configuracion > Pagos > Wompi (Admin API cannot read it). Proof available: orders flagged test=false and checkout HTML (use --checkout).');

  // ---- shop
  const shopR = await gql(SHOP_Q);
  if (!shopR.ok) {
    S.add('ADMIN-SHOP', 'Shop settings', shopR.kind === 'denied' ? 'INFO' : 'WARN', `Admin API unreachable via Shopify CLI (${shopR.kind}): ${shopR.msg}. Re-login with: shopify.cmd store auth --store ${CFG.store}`);
    S.add('ADMIN-SKIPPED', 'Remaining Admin checks', 'SKIP', 'skipped because the first Admin query failed');
    return [...S.checks, ...W.checks];
  }
  const shop = shopR.data.shop;
  obs.admin.shop = { name: shop.name, currencyCode: shop.currencyCode, ianaTimezone: shop.ianaTimezone, taxesIncluded: shop.taxesIncluded, taxShipping: shop.taxShipping };
  {
    const bad = [];
    if (shop.currencyCode !== E.currency) bad.push(`currency ${shop.currencyCode}`);
    const soft = [];
    if (shop.name !== E.shopName) soft.push(`name "${shop.name}"`);
    if (shop.ianaTimezone !== E.timezone) soft.push(`timezone ${shop.ianaTimezone}`);
    if (shop.taxesIncluded !== E.taxesIncluded) soft.push(`taxesIncluded=${shop.taxesIncluded}`);
    if (shop.taxShipping !== E.taxShipping) soft.push(`taxShipping=${shop.taxShipping}`);
    S.add('ADMIN-SHOP', 'Shop: COP, Bogota, taxesIncluded=false', bad.length ? 'CRIT' : soft.length ? 'WARN' : 'OK',
      `${shop.name}, ${shop.currencyCode}, ${shop.ianaTimezone}, taxesIncluded=${shop.taxesIncluded}, taxShipping=${shop.taxShipping}${bad.length || soft.length ? ' !! changed: ' + [...bad, ...soft].join('; ') : ''}`);
  }

  // ---- theme
  {
    const r = await gql(THEMES_Q);
    if (!r.ok) notReadable('ADMIN-THEME', `Published theme = ${E.themeName}`, r);
    else {
      const main = r.data.themes.nodes.find((t) => t.role === 'MAIN');
      obs.admin.theme = main ? { name: main.name, id: main.id } : null;
      S.add('ADMIN-THEME', `Published theme = ${E.themeName}`, main && main.name === E.themeName ? 'OK' : 'CRIT',
        main ? `MAIN = "${main.name}" (${main.id.split('/').pop()})${main.name === E.themeName ? '' : ' !! UNEXPECTED THEME PUBLISHED'}` : 'no MAIN theme found');
    }
  }

  // ---- orders (no customer fields requested)
  {
    const r = await gqlPages(ordersQ, (d) => d.orders, 5);
    if (!r.ok) notReadable('ADMIN-ORD-24H', 'Orders last 24 h', r);
    else {
      const now = Date.now(), launch = Date.parse(E.launchIso);
      const orders = r.nodes.map((o) => ({
        name: o.name, test: !!o.test, createdMs: Date.parse(o.createdAt), createdAt: o.createdAt, status: o.displayFinancialStatus,
        tags: (o.tags || []).map((t) => t.toLowerCase()), gateways: o.paymentGatewayNames || [],
        total: Number(o.totalPriceSet.shopMoney.amount), cur: o.totalPriceSet.shopMoney.currencyCode, tax: Number(o.totalTaxSet ? o.totalTaxSet.shopMoney.amount : 0),
      }));
      orders.forEach((o) => { o.internal = o.tags.includes('interno'); o.real = !o.test && !o.internal; });
      const w24 = orders.filter((o) => o.createdMs >= now - 24 * 3600e3);
      const byStatus = {}; w24.forEach((o) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
      const sum = (a) => a.reduce((s, o) => s + o.total, 0);
      const gate = sortedUniq(w24.flatMap((o) => o.gateways));
      obs.admin.orders = {
        totalFetched: orders.length, complete: r.complete,
        last24h: { count: w24.length, byStatus, testCount: w24.filter((o) => o.test).length, internalCount: w24.filter((o) => o.internal).length, realCount: w24.filter((o) => o.real).length,
          sumAll: sum(w24), sumReal: sum(w24.filter((o) => o.real)), sumTest: sum(w24.filter((o) => o.test)), sumInternal: sum(w24.filter((o) => o.internal)), gateways: gate,
          list: w24.map((o) => ({ name: o.name, createdAt: o.createdAt, status: o.status, test: o.test, internal: o.internal, total: o.total, tags: o.tags })) },
      };
      const l = obs.admin.orders.last24h;
      S.add('ADMIN-ORD-24H', 'Orders last 24 h (counts, no customer data)', r.complete ? 'OK' : 'WARN',
        `${l.count} orders | status ${JSON.stringify(byStatus)} | test=${l.testCount} internal(interno)=${l.internalCount} real=${l.realCount} | sum all=${money(l.sumAll)} real=${money(l.sumReal)} test=${money(l.sumTest)} COP | gateways: ${gate.join(',') || '-'}${r.complete ? '' : ' !! more than 500 orders, list truncated'}`);
      const nonCop = orders.filter((o) => o.cur !== E.currency);
      if (nonCop.length) S.add('ADMIN-ORD-CUR', 'Order currency', 'WARN', `${nonCop.length} order(s) not in ${E.currency}: ${nonCop.slice(0, 5).map((o) => o.name).join(',')}`);
      const internal = orders.filter((o) => o.internal);
      S.add('ADMIN-ORD-INTERNO', 'Orders tagged "interno"', 'INFO', internal.length ? `${internal.length}: ${internal.map((o) => `${o.name} ${o.status} ${money(o.total)} COP [${o.tags.join('|')}]`).join('; ')} (internal launch tests; excluded from real sales)` : 'none');
      const pend = orders.filter((o) => o.status === 'PENDING' && now - o.createdMs > E.pendingMaxMinutes * 60e3);
      S.add('ADMIN-ORD-PENDING', `PENDING orders older than ${E.pendingMaxMinutes} min`, pend.length ? 'WARN' : 'OK',
        pend.length ? `${pend.length}: ${pend.slice(0, 10).map((o) => `${o.name} (${Math.round((now - o.createdMs) / 60000)} min, ${money(o.total)} COP)`).join('; ')} - payment not confirmed (check Wompi)` : 'none');
      const taxed = orders.filter((o) => o.tax > 0);
      S.add('ADMIN-ORD-TAX', 'IVA must be zero (totalTax = 0 on all orders)', taxed.length ? 'CRIT' : 'OK',
        taxed.length ? `${taxed.length} order(s) with tax > 0: ${taxed.slice(0, 10).map((o) => `${o.name}=${money(o.tax)}`).join('; ')}` : `0 of ${orders.length} orders have tax`);
      const testAfter = orders.filter((o) => o.test && o.createdMs >= launch);
      W.add('WOMPI-TESTMODE', 'No test-mode orders after launch', testAfter.length ? 'WARN' : 'OK',
        testAfter.length ? `${testAfter.length} test order(s) after launch (${testAfter.slice(0, 5).map((o) => o.name).join(',')}): Wompi or the gateway may be in TEST mode` : `none after launch (${E.launchIso}); last real-gateway orders are not test`);
    }
  }

  // ---- products / inventory / prices
  {
    const r = await gqlPages(productsQ, (d) => d.products, 12);
    if (!r.ok) notReadable('ADMIN-PROD-STATUS', 'Products by status', r);
    else {
      const prods = r.nodes;
      const statusCounts = {}; prods.forEach((p) => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
      const truncated = prods.some((p) => p.variants.pageInfo.hasNextPage) || !r.complete;
      const vars = prods.flatMap((p) => p.variants.nodes.map((v) => ({
        handle: p.handle, status: p.status, key: v.sku || v.id, price: Number(v.price), compareAt: v.compareAtPrice == null ? null : Number(v.compareAtPrice),
        qty: v.inventoryQuantity, tracked: !!(v.inventoryItem && v.inventoryItem.tracked), avail: v.availableForSale,
      })));
      const act = vars.filter((v) => v.status === 'ACTIVE');
      const activeProducts = prods.filter((p) => p.status === 'ACTIVE');
      const extras = prods.filter((p) => p.status !== 'ACTIVE').map((p) => ({ handle: p.handle, status: p.status, variants: p.variants.nodes.length }));
      const mediaActive = activeProducts.reduce((a, p) => a + p.mediaCount.count, 0);
      const trackedN = act.filter((v) => v.tracked).length;
      const totalUnits = act.reduce((a, v) => a + v.qty, 0);
      const perSku = Object.fromEntries(act.map((v) => [v.key, v.qty]));
      const prices = Object.fromEntries(act.map((v) => [v.key, [v.price, v.compareAt]]));
      obs.admin.catalog = { activeProducts: activeProducts.length, activeVariants: act.length, trackedVariants: trackedN, statusCounts, extras, mediaActive, handles: activeProducts.map((p) => p.handle).sort() };
      obs.admin.inventory = { totalUnits, perSku, soldOutSkus: act.filter((v) => v.qty === 0).map((v) => v.key) };
      obs.admin.prices = prices;

      S.add('ADMIN-PROD-STATUS', `Products ACTIVE = ${E.products} (${E.variants} variants)`, activeProducts.length === E.products && act.length === E.variants && !truncated ? 'OK' : 'WARN',
        `status ${JSON.stringify(statusCounts)}; active variants ${act.length}; media on active products ${mediaActive}${truncated ? ' !! list truncated' : ''}${activeProducts.length !== E.products || act.length !== E.variants ? ` !! expected ${E.products}/${E.variants}` : ''}`);
      if (extras.length) S.add('ADMIN-PROD-EXTRA', 'Non-ACTIVE products in Admin', 'INFO', `${extras.length}: ${extras.map((p) => `${p.handle} [${p.status}, ${p.variants} variant(s)]`).join('; ')} (not on storefront; ignored for counts)`);
      S.add('ADMIN-INV-TRACK', 'Inventory tracked on all active variants', trackedN === act.length && act.length === E.variants ? 'OK' : 'WARN', `${trackedN}/${act.length} active variants track inventory`);

      const neg = act.filter((v) => v.qty < 0);
      S.add('ADMIN-INV-NEG', 'No negative stock per variant', neg.length ? 'CRIT' : 'OK',
        neg.length ? `${neg.length} variant(s) negative: ${neg.slice(0, 15).map((v) => `${v.key}=${v.qty}`).join(', ')}` : `none (sold-out variants at 0: ${obs.admin.inventory.soldOutSkus.length})`);
      // total vs baseline is evaluated later in compareBaseline (needs baseline); report raw here
      S.add('ADMIN-INV-TOTAL', 'Total available units (active variants)', 'INFO', `${totalUnits} units across ${act.length} variants`, { totalUnits });

      const ok = [], noCmp = [], off = [];
      for (const v of act) {
        if (v.compareAt == null) noCmp.push(v);
        else if (Math.abs(v.price - v.compareAt * E.priceRatio) <= 1) ok.push(v); else off.push(v);
      }
      const bad = [...noCmp, ...off];
      S.add('ADMIN-PRICE', 'Price = 80% of compare-at on all active variants', bad.length ? 'WARN' : 'OK',
        bad.length ? `${bad.length} off: ${bad.slice(0, 8).map((v) => `${v.key} ${money(v.price)} vs ${v.compareAt == null ? 'no compare-at' : money(v.compareAt)}`).join('; ')}` : `${ok.length}/${act.length} variants at exactly ${E.priceRatio * 100}% of compare-at`);
    }
  }

  // ---- shipping profile
  {
    const r = await gql(SHIP_Q);
    if (!r.ok) notReadable('ADMIN-SHIP', 'Shipping profile unchanged', r);
    else {
      try {
        const profiles = r.data.deliveryProfiles.nodes;
        const def = profiles.find((p) => p.default) || profiles[0];
        const zones = def.profileLocationGroups.flatMap((g) => g.locationGroupZones.nodes);
        const paid = [], freeT = []; let inactive = 0, methods = 0;
        for (const z of zones) for (const m of z.methodDefinitions.nodes) {
          methods++; if (!m.active) inactive++;
          const price = Number(m.rateProvider && m.rateProvider.price ? m.rateProvider.price.amount : NaN);
          if (price === 0) {
            const c = (m.methodConditions || []).find((x) => x.field === 'TOTAL_PRICE' && x.operator === 'GREATER_THAN_OR_EQUAL_TO');
            freeT.push(c ? Number(c.conditionCriteria.amount) : null);
          } else paid.push(price);
        }
        const paidS = [...paid].sort((a, b) => a - b), ex = E.shipping;
        obs.admin.shipping = { profiles: profiles.length, zones: zones.length, methods, paid: paidS, freeThresholds: sortedUniq(freeT.map(String)).map(Number), inactive };
        const same = zones.length === ex.zones && eqArr(paidS, ex.paidRates) && freeT.length === zones.length && freeT.every((t) => t === ex.freeThreshold) && inactive === 0;
        S.add('ADMIN-SHIP', 'Shipping: 5 zones, 9900/12900/17900/21900/44900, free >= 299900', same ? 'OK' : 'WARN',
          `profile "${def.name.replace(/[^\x20-\x7e]/g, '?')}": ${zones.length} zones, ${methods} methods (${paid.length} paid + ${freeT.length} free), paid=${paidS.join('/')}, free>=${sortedUniq(freeT.map(String)).join('/')}, inactive=${inactive}${same ? '' : ' !! DIFFERS from expected'}`);
      } catch (e) { S.add('ADMIN-SHIP', 'Shipping profile unchanged', 'INFO', `could not interpret deliveryProfiles (${e.message})`); }
    }
  }
  S.add('ADMIN-PASSWORD', 'Storefront password state', 'INFO', 'covered by HTTP-HOME / HTTP-ROBOTS (no Admin field needed)');
  return [...S.checks, ...W.checks];
}

/* ---------------------------------------------------------------- baseline */
function buildBaseline() {
  const now = new Date();
  return {
    schema: 1,
    createdAt: now.toISOString(), createdAtBogota: bogota(now),
    createdBy: 'monitor.mjs --write-baseline (values verified by the operator on the first run)',
    store: CFG.store, domain: CFG.domain, launchIso: CFG.expect.launchIso,
    dns: obs.dns,
    tls: obs.tls,
    http: { productsJson: obs.http.productsJson && { products: obs.http.productsJson.products, variants: obs.http.productsJson.variants, images: obs.http.productsJson.images }, legacy: obs.http.legacy, homeTheme: obs.http.homeTheme },
    admin: {
      shop: obs.admin.shop, theme: obs.admin.theme,
      catalog: obs.admin.catalog, inventory: { totalUnits: obs.admin.inventory.totalUnits, perSku: obs.admin.inventory.perSku },
      prices: obs.admin.prices, shipping: obs.admin.shipping,
    },
  };
}
const diffList = (a, b) => ({ added: b.filter((x) => !a.includes(x)), removed: a.filter((x) => !b.includes(x)) });

function compareBaseline(base, adminChecks) {
  const B = mkSection('BASELINE');
  const row = (id, label, drifts, okText, kind = 'DRIFT') => B.add(id, label, drifts.length ? kind : 'OK', drifts.length ? drifts.join('; ') : okText);
  const skip = (id, label, why) => B.add(id, label, 'SKIP', why);
  B.add('BASE-FILE', 'baseline.json', 'INFO', `loaded (created ${base.createdAtBogota} America/Bogota)`);

  // DNS extras (A/CNAME/MX/NS/TXT hard checks live in DNS section; here: exact-set drift vs baseline)
  if (obs.dns) {
    const d = [];
    for (const k of ['apexA', 'wwwCname', 'mx', 'txt', 'ns']) {
      if (!obs.dns[k] || !base.dns || !base.dns[k]) continue;
      if (!eqArr(obs.dns[k], base.dns[k])) d.push(`${k}: baseline [${base.dns[k].join(', ')}] -> now [${obs.dns[k].join(', ')}]`);
    }
    if (!eqArr(obs.dns.aaaaApex || [], (base.dns && base.dns.aaaaApex) || [])) d.push(`aaaaApex: baseline [${((base.dns && base.dns.aaaaApex) || []).join(', ')}] -> now [${(obs.dns.aaaaApex || []).join(', ')}]`);
    row('BASE-DNS', 'DNS record sets vs baseline', d, 'A, CNAME, MX, TXT, NS, AAAA identical to baseline');
  }
  // TLS (issuer change is informational: certificates renew on their own)
  {
    const d = [];
    for (const h of ['apex', 'www']) if (obs.tls[h] && base.tls && base.tls[h] && obs.tls[h].issuer !== base.tls[h].issuer) d.push(`${h} issuer ${base.tls[h].issuer} -> ${obs.tls[h].issuer}`);
    row('BASE-TLS', 'TLS issuer vs baseline', d, 'same issuer (renewals change dates, not issuer)', 'INFO');
  }
  // HTTP-level
  if (MODE === 'full') {
    const d = [];
    const pj = obs.http.productsJson, bj = base.http && base.http.productsJson;
    if (pj && bj && (pj.products !== bj.products || pj.variants !== bj.variants || pj.images !== bj.images)) d.push(`products.json ${bj.products}/${bj.variants}/${bj.images} -> ${pj.products}/${pj.variants}/${pj.images}`);
    for (const [p, fin] of Object.entries(obs.http.legacy || {})) if (base.http && base.http.legacy && base.http.legacy[p] && base.http.legacy[p] !== fin) d.push(`redirect ${p}: ${base.http.legacy[p]} -> ${fin}`);
    row('BASE-HTTP', 'products.json + legacy redirects vs baseline', d, 'same counts and redirect targets');
  } else skip('BASE-HTTP', 'products.json + legacy redirects vs baseline', 'quick mode');

  if (!WITH_ADMIN) { skip('BASE-ADMIN', 'Admin values vs baseline', MODE === 'quick' ? 'quick mode' : '--no-admin'); return B.checks; }
  const A = obs.admin, bA = base.admin || {};
  if (!A.shop) { skip('BASE-ADMIN', 'Admin values vs baseline', 'Admin data not available this run'); return B.checks; }
  // shop + theme
  {
    const d = [];
    for (const k of Object.keys(bA.shop || {})) if (A.shop[k] !== bA.shop[k]) d.push(`shop.${k}: ${bA.shop[k]} -> ${A.shop[k]}`);
    if (A.theme && bA.theme && (A.theme.name !== bA.theme.name || A.theme.id !== bA.theme.id)) d.push(`theme: ${bA.theme.name} (${String(bA.theme.id).split('/').pop()}) -> ${A.theme.name} (${String(A.theme.id).split('/').pop()})`);
    row('BASE-SHOP', 'Shop settings + published theme vs baseline', d, A.theme ? 'shop settings and theme id identical' : 'shop settings identical (theme not readable this run)');
  }
  // catalog
  if (A.catalog && bA.catalog) {
    const d = [];
    const hd = diffList(bA.catalog.handles, A.catalog.handles);
    if (hd.added.length || hd.removed.length) d.push(`active product handles +[${hd.added.join(',')}] -[${hd.removed.join(',')}]`);
    if (!eqArr(Object.entries(A.catalog.statusCounts).sort(), Object.entries(bA.catalog.statusCounts).sort())) d.push(`status counts ${JSON.stringify(bA.catalog.statusCounts)} -> ${JSON.stringify(A.catalog.statusCounts)}`);
    if (A.catalog.trackedVariants !== bA.catalog.trackedVariants) d.push(`tracked variants ${bA.catalog.trackedVariants} -> ${A.catalog.trackedVariants}`);
    if (A.catalog.mediaActive !== bA.catalog.mediaActive) d.push(`media ${bA.catalog.mediaActive} -> ${A.catalog.mediaActive}`);
    row('BASE-CATALOG', 'Catalog (handles, statuses, tracking, media) vs baseline', d, 'same active handles, status counts, tracking and media');
  }
  // prices
  if (A.prices && bA.prices) {
    const d = [];
    for (const [k, [p, c]] of Object.entries(A.prices)) {
      const b = bA.prices[k];
      if (!b) d.push(`new SKU ${k}`); else if (b[0] !== p || b[1] !== c) d.push(`${k} ${money(b[0])}/${b[1] == null ? '-' : money(b[1])} -> ${money(p)}/${c == null ? '-' : money(c)}`);
    }
    for (const k of Object.keys(bA.prices)) if (!(k in A.prices)) d.push(`SKU gone ${k}`);
    row('BASE-PRICE', 'Price / compare-at per SKU vs baseline', d.length > 8 ? [`${d.length} changes: ${d.slice(0, 8).join('; ')} ...`] : d, 'all 98 prices and compare-at prices identical');
  }
  // shipping
  if (A.shipping && bA.shipping) {
    const same = JSON.stringify(A.shipping) === JSON.stringify(bA.shipping);
    row('BASE-SHIP', 'Shipping fingerprint vs baseline', same ? [] : [`now ${JSON.stringify(A.shipping)} vs baseline ${JSON.stringify(bA.shipping)}`], 'identical');
  }
  // inventory
  if (A.inventory && bA.inventory) {
    const delta = A.inventory.totalUnits - bA.inventory.totalUnits;
    const ch = [];
    for (const [k, n] of Object.entries(A.inventory.perSku)) { const b = bA.inventory.perSku[k]; if (b !== undefined && b !== n) ch.push({ k, b, n }); }
    const alarm = Math.abs(delta) >= CFG.expect.inventoryDeltaAlarmUnits;
    // update the ADMIN-INV-TOTAL row with the baseline comparison
    const invRow = adminChecks.find((c) => c.id === 'ADMIN-INV-TOTAL');
    if (invRow) {
      invRow.status = alarm ? 'WARN' : 'INFO';
      invRow.detail = `${A.inventory.totalUnits} units (baseline ${bA.inventory.totalUnits}, delta ${delta >= 0 ? '+' : ''}${delta})${alarm ? ` !! change of ${CFG.expect.inventoryDeltaAlarmUnits}+ units since baseline: unusual stock movement` :delta !== 0 ? ' - small movement, normal if there were sales' : ''}`;
    }
    B.add('BASE-INV', 'Per-SKU stock vs baseline', ch.length ? 'INFO' : 'OK',
      ch.length ? `${ch.length} SKU(s) changed, total ${delta >= 0 ? '+' : ''}${delta}: ${ch.slice(0, 10).map((x) => `${x.k} ${x.b}->${x.n}`).join(', ')}${ch.length > 10 ? ' ...' : ''}` : 'no SKU stock changed since baseline');
  }
  return B.checks;
}

/* -------------------------------------------------------------------- main */
function renderTable(checks) {
  const esc = (s) => String(s).replace(/\|/g, '/').replace(/\r?\n/g, ' ');
  const lines = ['| ID | Check | Status | Detail |', '|---|---|---|---|'];
  for (const c of checks) lines.push(`| ${c.id} | ${esc(c.label)} | **${c.status}** | ${esc(c.detail)} |`);
  return lines.join('\n');
}

async function main() {
  const t0 = new Date();
  console.error(`[monitor] ${MODE}${WITH_CHECKOUT ? '+checkout' : ''} started ${bogota(t0)} America/Bogota`);
  const http = makeHttp();
  const tasks = [runDns(), runTls(), runHttp(http)];
  if (WITH_ADMIN) tasks.push(runAdmin());
  const [dnsC, tlsC, httpC, adminC = []] = await Promise.all(tasks);
  let checks = [...dnsC, ...tlsC, ...httpC, ...adminC];

  // baseline
  let baselineState = 'absent';
  if (fs.existsSync(BASELINE_FILE) && !WRITE_BASELINE) {
    try { const base = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')); checks = checks.concat(compareBaseline(base, adminC)); baselineState = 'compared'; }
    catch (e) { checks.push({ section: 'BASELINE', id: 'BASE-FILE', label: 'baseline.json', status: 'WARN', detail: `unreadable: ${e.message}` }); baselineState = 'unreadable'; }
  } else if (!WRITE_BASELINE) {
    checks.push({ section: 'BASELINE', id: 'BASE-FILE', label: 'baseline.json', status: 'INFO', detail: 'no baseline.json yet; after verifying a good --full run, create it with: node monitor.mjs --full --write-baseline' });
  }
  const order = (s) => { const i = SECTION_ORDER.indexOf(s); return i < 0 ? 99 : i; };
  checks = checks.map((c, i) => ({ ...c, _i: i })).sort((a, b) => order(a.section) - order(b.section) || a._i - b._i).map(({ _i, ...c }) => c);

  const count = (s) => checks.filter((c) => c.status === s).length;
  const worst = Math.max(0, ...checks.map((c) => RANK[c.status] ?? 0));

  // write baseline (only from a clean, complete full run)
  if (WRITE_BASELINE) {
    const complete = MODE === 'full' && WITH_ADMIN && obs.dns && obs.http.productsJson && obs.admin.shop && obs.admin.catalog && obs.admin.inventory && obs.admin.shipping && obs.admin.theme;
    const E = CFG.expect;
    const sane = complete && obs.http.productsJson.products === E.products && obs.http.productsJson.variants === E.variants && obs.http.productsJson.images === E.images
      && eqArr(obs.dns.apexA, E.apexA) && obs.admin.theme.name === E.themeName && obs.admin.shop.taxesIncluded === E.taxesIncluded;
    if (!complete) { baselineState = 'refused: incomplete run (needs --full with Admin readable)'; }
    else if (worst >= 2) baselineState = 'refused: run has CRIT findings';
    else if (!sane && !has('--force')) baselineState = 'refused: observed values differ from the agreed 29/98/95 + apex IP + theme + taxesIncluded=false (use --force only if intended)';
    else if (fs.existsSync(BASELINE_FILE) && !has('--force')) baselineState = 'refused: baseline.json already exists (use --force to overwrite)';
    else {
      if (fs.existsSync(BASELINE_FILE)) fs.copyFileSync(BASELINE_FILE, BASELINE_FILE.replace(/\.json$/, `.prev-${stampOf(new Date())}.json`));
      fs.writeFileSync(BASELINE_FILE, JSON.stringify(buildBaseline(), null, 2) + '\n', 'utf8');
      baselineState = `written: ${BASELINE_FILE}`;
    }
    checks.push({ section: 'BASELINE', id: 'BASE-WRITE', label: 'Write baseline.json', status: baselineState.startsWith('written') ? 'INFO' : 'WARN', detail: baselineState });
  }

  const fin = new Date();
  const counts = { OK: count('OK'), INFO: count('INFO'), WARN: count('WARN'), CRIT: count('CRIT'), DRIFT: count('DRIFT'), SKIP: count('SKIP') };
  const exitCode = checks.some((c) => c.status === 'CRIT') ? 2 : checks.some((c) => c.status === 'WARN' || c.status === 'DRIFT') ? 1 : 0;
  const verdict = ['ALL OK', 'WARNINGS', 'CRITICAL'][exitCode];
  const report = {
    tool: { name: 'radaelli-monitor', version: CFG.version }, mode: MODE, withCheckout: WITH_CHECKOUT, withAdmin: WITH_ADMIN,
    store: CFG.store, domain: CFG.domain,
    startedAt: t0.toISOString(), startedAtBogota: bogota(t0), finishedAt: fin.toISOString(), finishedAtBogota: bogota(fin),
    durationSec: Math.round((fin - t0) / 100) / 10, httpRequests: http.st.requests,
    baseline: { file: BASELINE_FILE, state: baselineState }, summary: counts, exitCode, verdict, checks, observations: obs, notes,
  };
  const stamp = stampOf(t0);
  const table = renderTable(checks);
  const head = `# Radaelli monitor - ${MODE}${WITH_CHECKOUT ? ' + checkout' : ''} - ${bogota(t0)} America/Bogota (UTC-5)`;
  const sumLine = `**Result: ${verdict}** (exit ${exitCode}) - OK ${counts.OK} | INFO ${counts.INFO} | WARN ${counts.WARN} | DRIFT ${counts.DRIFT} | CRIT ${counts.CRIT} | SKIP ${counts.SKIP} - ${report.durationSec} s, ${http.st.requests} HTTP requests, ended ${bogota(fin)}`;
  const findings = checks.filter((c) => ['WARN', 'DRIFT', 'CRIT'].includes(c.status));
  const md = [head, '', sumLine, '', table, '', findings.length ? '## Findings (WARN / DRIFT / CRIT)\n' + findings.map((c) => `- **${c.status}** ${c.id}: ${c.detail}`).join('\n') : '## Findings\nNone.', ''].join('\n');
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, `run-${stamp}.json`), JSON.stringify(report, null, 2) + '\n', 'utf8');
    fs.writeFileSync(path.join(OUT_DIR, `run-${stamp}.md`), md, 'utf8');
  } catch (e) { console.error(`[monitor] could not write run files: ${e.message}`); }
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* ignore */ }
  process.stdout.write(md + `\nFiles: ${path.join(OUT_DIR, `run-${stamp}.json`)} (+ .md)\n`, () => process.exit(exitCode));
}

main().catch((e) => { console.error('[monitor] FATAL', e); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* ignore */ } process.exit(2); });
