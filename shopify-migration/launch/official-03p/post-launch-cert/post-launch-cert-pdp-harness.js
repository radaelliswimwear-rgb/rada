// =============================================================================
// RADAELLI SWIMWEAR - POST-LAUNCH CERTIFICATION: PDP harness (29 PDP / 98 variants / 95 images)   PDP-1.0 / 2026-10-02
// In-page script. Paste into a tab ALREADY OPEN on the real storefront (https://radaelliswimwear.com) and run it with a
// JS-eval tool that supports top-level await. Derived from launch/tools/03p-final-audit-pdp-harness.js (certified 29/29, 98/98).
// Each PDP is loaded in a same-origin srcdoc iframe of EXACTLY 390 px.
//
// PARAMETERS (optional; set BEFORE pasting, e.g.  window.__PDPCFG = {gap: 2000};  ):
//   gap 1600 | backoff 60000 | retries 4 | settle 6500 (iframe wait) | imgWait 2500 | variantWait 450 | accWait 150
//   retestSettle 6500 | retestMax 20000 (max extra wait per PDP in the re-test) | blockAnalytics true | EXPECT {products,variants,images}
//   HANDLES [...]  and  LIMIT n  can also be given here or (preferably) to __PDPRUN().
//
// USAGE (the paste only DEFINES functions and returns "PDP harness ready ..."):
//   window.__PDPRUN({HANDLES:['brisa-natural-beige'], LIMIT:3})   // starts in background -> 'started ...'
//   window.__PDPRUN({})                                            // all products (~7-8 min); {wait:true} awaits instead
//   window.__PDPSTATUS()                                           // progress (poll every ~60 s)
//   window.__PDPSUMMARY()                                          // compact verdict (sync)
//   await window.__PDPRETEST()                                     // re-test lazy-image PDPs with an extended wait (default: the pending list)
//   await window.__PDPRETEST(['alba-dorada-lila'])                 // or specific handles; {bg:true} as 2nd arg = background
//   window.__PDPROWS(true)                                         // per-product records (true = only failing / with warnings)
//   window.__PDPDUMP()                                             // full JSON string (for the assembler)
//
// FALSE-POSITIVE FILTERS BUILT IN
//   1. Spanish "todo/TODO" (innerText applies text-transform) is NOT flagged; only dev markers such as "TODO:" are.
//      "nan" inside Spanish words (financiacion, banano...) is not flagged: NaN is matched as a whole word, case-sensitive.
//   2. Lazy images in hidden tabs: "images still pending" is a WARNING ('lazy-pending:N'), listed for __PDPRETEST(); only
//      images that finished loading with naturalWidth 0 are hard failures.
//   3. srcdoc artifacts (storefrontBaseUrl | replaceState | Script error) are ignored in the iframe's own error list.
// SAFETY: GET only (products.json, /products/<h>.js, /products/<h>). Never touches the cart. No secrets in this file.
// Analytics beacons inside the test iframes are stubbed (blockAnalytics) so the audit does not pollute store analytics.
// =============================================================================
(() => {
  const VERSION = 'PDP-1.0';
  if (window.__PDP && window.__PDP.running) return 'PDP BUSY: a run is in progress (' + window.__PDP.idx + '/' + window.__PDP.total + '); wait for it';
  const U = window.__PDPCFG || {};
  const CFG = Object.assign({ gap: 1600, backoff: 60000, retries: 4, settle: 6500, imgWait: 2500, variantWait: 450, accWait: 150, retestSettle: 6500, retestMax: 20000, blockAnalytics: true }, U);
  const EXP = Object.assign({ products: 29, variants: 98, images: 95 }, U.EXPECT || {});
  const ORIGIN = location.origin;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const short = (s, n) => String(s == null ? '' : s).slice(0, n || 100);
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const IGN = /storefrontBaseUrl|replaceState|Script error/i;
  const SUSP = [/\bundefined\b/i, /\bNaN\b/, /\[object /i, /\bnull\b/i, /\blorem ipsum\b/i, /\bTODO\s*:/, /\bplaceholder\b/i, /translation missing/i, /liquid (syntax )?error/i, /\{\{|\{%/];
  const suspicious = (txt) => { for (const r of SUSP) { const m = r.exec(txt || ''); if (m) return m[0]; } return ''; };

  const R = window.__PDP = { v: VERSION, running: false, done: false, idx: 0, total: 0, products: [], retest: [], unknown: [], filter: null, retries: 0, reqs: 0, start: 0, secs: 0, retestState: null, suspicious };
  let last = 0;
  async function rq(path) { // paced GET with 429 backoff
    let r;
    for (let k = 0; k <= CFG.retries; k++) {
      const w = last + CFG.gap - Date.now(); if (w > 0) await sleep(w);
      r = await fetch(path, { cache: 'no-store', credentials: 'same-origin' }); R.reqs++; last = Date.now();
      if (r.status !== 429) return r;
      R.retries++; if (k < CFG.retries) await sleep(CFG.backoff);
    }
    return r;
  }
  const J = async (r) => { try { return JSON.parse(await r.text()); } catch (e) { return null; } };

  const ANALYTICS = 'var AR=/monorail|shopifysvc|google-analytics|googletagmanager|doubleclick|facebook\\.|fbevents|tiktok|clarity\\.ms|hotjar/i;' +
    'try{var sb=navigator.sendBeacon;navigator.sendBeacon=function(u){return AR.test(String(u))?true:sb.apply(navigator,arguments)}}catch(e){}' +
    'try{var ofe=window.fetch;window.fetch=function(u){var s=String(u&&u.url||u);if(AR.test(s)){return Promise.resolve(new Response("",{status:204}))}return ofe.apply(this,arguments)}}catch(e){}' +
    'try{var xo=XMLHttpRequest.prototype.open,xs=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.open=function(m,u){this.__sk=AR.test(String(u));return xo.apply(this,arguments)};XMLHttpRequest.prototype.send=function(){if(this.__sk)return;return xs.apply(this,arguments)}}catch(e){}';
  const INJ = '<script>window.__errs=[];window.__res=[];(function(){' +
    'var oe=console.error;console.error=function(){try{window.__errs.push([].map.call(arguments,String).join(" ").slice(0,160))}catch(e){}oe.apply(console,arguments)};' +
    'window.addEventListener("error",function(e){if(e.target&&e.target!==window&&(e.target.src||e.target.href)){window.__res.push((e.target.tagName+":"+(e.target.src||e.target.href)).slice(0,160))}else{window.__errs.push(String(e.message).slice(0,160))}},true);' +
    'window.addEventListener("unhandledrejection",function(e){window.__errs.push("rej:"+String(e.reason).slice(0,140))});' +
    (CFG.blockAnalytics ? ANALYTICS : '') + '})();<\/script>';
  const inject = (html, h) => {
    const tag = '<base href="' + ORIGIN + '/products/' + h + '">' + INJ;
    return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + tag) : tag + html;
  };
  function mkHolder() {
    let holder = document.getElementById('__h'); if (holder) holder.remove();
    holder = document.createElement('div'); holder.id = '__h';
    holder.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px;z-index:2147483000;background:#fff;overflow:hidden';
    document.body.appendChild(holder);
    return holder;
  }
  function mkFrame(holder, html, h) {
    const f = document.createElement('iframe'); f.style.cssText = 'width:390px;height:844px;border:0';
    holder.innerHTML = ''; holder.appendChild(f);
    f.srcdoc = inject(html, h);
    return f;
  }
  const imgStats = (imgs) => ({
    bad: imgs.filter((i) => i.getAttribute('src') && i.complete && i.naturalWidth === 0).length,
    pend: imgs.filter((i) => !i.complete).length
  });
  const galleryImgs = (d) => Array.prototype.slice.call(d.querySelectorAll('.product-gallery img, [class*=gallery] img'));
  const recompute = (o) => { o.pass = o.issues.length === 0; return o; };

  async function testPdp(p, holder) {
    const o = { h: p.handle, title: p.title, issues: [], warns: [], variants: [] };
    try {
      const pj = await J(await rq('/products/' + p.handle + '.js'));
      if (!pj) o.issues.push('product.js not readable');
      const html = await (await rq('/products/' + p.handle)).text();
      const f = mkFrame(holder, html, p.handle);
      await sleep(CFG.settle);
      const d = f.contentDocument, w = f.contentWindow, de = d.documentElement; o.vw = w.innerWidth;
      if (o.vw !== 390) o.issues.push('iframe innerWidth ' + o.vw + ' != 390');
      // layout 390
      o.overflow = de.scrollWidth > 391; if (o.overflow) o.issues.push('overflow390:' + de.scrollWidth);
      // content
      const h1 = d.querySelector('h1'); o.h1 = (h1 && h1.innerText.trim()) || '';
      if (!o.h1) o.issues.push('no h1'); else if (norm(o.h1) !== norm(p.title)) o.issues.push('h1!=title');
      const main = d.querySelector('main') || d.body; const txt = main.innerText || '';
      const sm = suspicious(txt); if (sm) o.issues.push('suspicious text:' + sm);
      const pm = txt.match(/\$\s?([\d.]+)/); o.priceText = pm ? pm[0] : ''; if (!pm) o.issues.push('no price');
      const vin = d.querySelector('[data-variant-id-input]');
      const cur = pj ? (pj.variants.find((v) => v.id === +((vin || {}).value)) || pj.variants[0]) : null;
      if (pm && cur && parseInt(pm[1].replace(/\./g, ''), 10) !== cur.price / 100) o.issues.push('price ' + pm[1] + ' != ' + cur.price / 100);
      // gallery / images (lazy images in hidden tabs => warning + re-test list, not a failure)
      const imgs = galleryImgs(d); o.galleryImgs = imgs.length; if (pj && imgs.length < 1) o.issues.push('no gallery');
      imgs.forEach((i) => { i.loading = 'eager'; }); await sleep(CFG.imgWait);
      const st = imgStats(imgs); o.imgsBad = st.bad; o.imgsPending = st.pend;
      if (st.bad) o.issues.push('broken imgs:' + st.bad);
      if (st.pend) { o.warns.push('lazy-pending:' + st.pend); }
      o.pjImages = pj ? pj.images.length : null;
      // controls
      const addBtn = d.querySelector('form[action*="/cart/add"] [name=add]'); o.addBtn = !!addBtn; if (!addBtn) o.issues.push('no add button');
      const groups = Array.prototype.slice.call(d.querySelectorAll('[data-option-group]')); o.optGroups = groups.length;
      // accordions
      const sums = Array.prototype.slice.call(d.querySelectorAll('details summary')); o.acc = sums.length; let accBad = 0;
      for (const s of sums) { const dt = s.parentElement; const was = dt.open; s.click(); await sleep(CFG.accWait); if (dt.open === was) accBad++; s.click(); await sleep(CFG.accWait); }
      if (!sums.length) o.issues.push('no accordions'); if (accBad) o.issues.push('accordions unresponsive:' + accBad);
      // meta
      const can = d.querySelector('link[rel=canonical]'); o.canonicalOk = !!can && can.href.endsWith('/products/' + p.handle); if (!o.canonicalOk) o.issues.push('canonical');
      let ldok = 0, ldbad = 0; d.querySelectorAll('script[type="application/ld+json"]').forEach((s) => { try { JSON.parse(s.textContent); ldok++; } catch (e) { ldbad++; } });
      o.ld = [ldok, ldbad]; if (ldbad || !ldok) o.issues.push('json-ld');
      o.og = !!d.querySelector('meta[property="og:image"]') && !!d.querySelector('meta[property="og:title"]'); if (!o.og) o.issues.push('og');
      // variants: select each option combo by a real click, then check id / price / button
      if (pj) {
        const vidIn = () => d.querySelector('[data-variant-id-input]');
        for (const v of pj.variants) {
          const vo = { id: v.id, sku: v.sku, ok: true };
          try {
            groups.forEach((gp) => {
              const val = v.options[+gp.getAttribute('data-option-position') - 1];
              const inp = Array.prototype.slice.call(gp.querySelectorAll('input[data-option-input]')).find((i) => i.value === val);
              if (!inp) throw new Error('no option ' + val);
              if (!inp.checked) inp.click();
            });
            await sleep(CFG.variantWait);
            const sel = +((vidIn() || {}).value);
            if (sel !== v.id) { vo.ok = false; vo.err = 'variant id ' + sel + ' != ' + v.id; }
            const t2 = (d.querySelector('main') || d.body).innerText; const pm2 = t2.match(/\$\s?([\d.]+)/);
            if (pm2 && parseInt(pm2[1].replace(/\./g, ''), 10) !== v.price / 100) { vo.ok = false; vo.err = (vo.err || '') + ' price ' + pm2[1] + ' != ' + v.price / 100; }
            const b = d.querySelector('form[action*="/cart/add"] [name=add]'); const dis = !!(b && (b.disabled || b.getAttribute('aria-disabled') === 'true'));
            if (b && dis === v.available) { vo.ok = false; vo.err = (vo.err || '') + ' button ' + (dis ? 'disabled' : 'active') + ' but available=' + v.available; }
            vo.available = v.available;
          } catch (e) { vo.ok = false; vo.err = short(e.message || e, 80); }
          o.variants.push(vo);
        }
      }
      o.errs = (w.__errs || []).filter((e) => !IGN.test(e)).slice(0, 6); o.resErr = (w.__res || []).filter((e) => !IGN.test(e)).slice(0, 6);
      if (o.errs.length) o.issues.push('console:' + o.errs.length); if (o.resErr.length) o.issues.push('failed resources:' + o.resErr.length);
      const vb = o.variants.filter((x) => !x.ok).length; if (vb) o.issues.push('variants with failures:' + vb);
    } catch (e) { o.issues.push('EXC ' + short(e, 100)); }
    return recompute(o);
  }

  async function main(handles, limit) {
    R.start = Date.now();
    const list = ((await J(await rq('/products.json?limit=250'))) || {}).products;
    if (!list) throw new Error('products.json not readable');
    let sel = list;
    if (handles && handles.length) {
      sel = list.filter((p) => handles.indexOf(p.handle) >= 0);
      R.unknown = handles.filter((h) => !list.some((p) => p.handle === h));
    }
    if (limit > 0) sel = sel.slice(0, limit);
    R.total = sel.length; R.catalogTotal = list.length;
    const holder = mkHolder();
    try {
      for (const p of sel) {
        R.idx++;
        const o = await testPdp(p, holder);
        R.products.push(o);
        if (o.warns.some((x) => x.indexOf('lazy-pending') === 0) && R.retest.indexOf(o.h) < 0) R.retest.push(o.h);
      }
    } finally { holder.remove(); }
  }

  window.__PDPRUN = (cfg) => {
    cfg = cfg || {};
    if (R.running) return 'PDP BUSY: run in progress ' + R.idx + '/' + R.total;
    const H = cfg.HANDLES || cfg.handles || U.HANDLES || null;
    const L = cfg.LIMIT || cfg.limit || U.LIMIT || 0;
    Object.assign(R, { running: true, done: false, idx: 0, total: 0, products: [], retest: [], unknown: [], retries: 0, reqs: 0, secs: 0, error: null, retestState: null, filter: { HANDLES: H, LIMIT: L } });
    const job = main(H, L).catch((e) => { R.error = short(e, 160); }).then(() => { R.running = false; R.done = true; R.secs = Math.round((Date.now() - R.start) / 1000); return summary(); });
    return cfg.wait ? job : 'started PDP run (poll window.__PDPSTATUS(); then window.__PDPSUMMARY())';
  };

  // Re-test PDPs whose images were still pending in the first pass (lazy images in hidden tabs): extended wait, polling.
  async function retestOne(h) {
    const o = R.products.find((x) => x.h === h);
    const t0 = Date.now();
    const html = await (await rq('/products/' + h)).text();
    const holder = mkHolder();
    let st = { bad: 0, pend: -1 };
    try {
      const f = mkFrame(holder, html, h);
      await sleep(CFG.retestSettle);
      const d = f.contentDocument;
      const imgs = galleryImgs(d);
      imgs.forEach((i) => { i.loading = 'eager'; });
      while (true) {
        st = imgStats(imgs);
        if (st.pend === 0 || Date.now() - t0 > CFG.retestSettle + CFG.retestMax) break;
        await sleep(500);
        imgs.forEach((i) => { i.loading = 'eager'; });
      }
      st.n = imgs.length;
    } finally { holder.remove(); }
    if (o) {
      o.retested = true; o.imgsBad = st.bad; o.imgsPending = st.pend; o.retestSecs = Math.round((Date.now() - t0) / 1000);
      o.warns = o.warns.filter((x) => x.indexOf('lazy-pending') !== 0);
      if (st.pend > 0) o.warns.push('lazy-pending-after-retest:' + st.pend);
      if (st.bad > 0 && o.issues.indexOf('broken imgs:' + st.bad) < 0) o.issues.push('broken imgs:' + st.bad);
      recompute(o);
    }
    return { h, pending: st.pend, bad: st.bad, secs: Math.round((Date.now() - t0) / 1000) };
  }
  window.__PDPRETEST = (handles, opts) => {
    opts = opts || {};
    if (R.running) return 'PDP BUSY: wait for the main run to finish';
    const list = (handles && handles.length ? handles : R.retest).slice();
    R.retestState = { running: true, i: 0, total: list.length, rows: [] };
    const job = (async () => {
      for (const h of list) { R.retestState.i++; R.retestState.rows.push(await retestOne(h)); }
      R.retest = R.retest.filter((h) => { const o = R.products.find((x) => x.h === h); return !(o && o.retested && o.imgsPending === 0); });
      R.retestState.running = false;
      return R.retestState.rows;
    })().catch((e) => { R.retestState.running = false; R.retestState.error = short(e, 120); return R.retestState; });
    return opts.bg ? 'started PDP retest of ' + list.length + ' handles (poll window.__PDPSTATUS().retestState)' : job;
  };

  function summary() {
    const ps = R.products;
    const fails = ps.filter((o) => !o.pass);
    const variantsTested = ps.reduce((a, o) => a + o.variants.length, 0);
    const variantsBad = ps.reduce((a, o) => a + o.variants.filter((v) => !v.ok).length, 0);
    const imgTotal = ps.reduce((a, o) => a + (o.pjImages || 0), 0);
    const full = !!R.filter && !(R.filter.HANDLES && R.filter.HANDLES.length) && !(R.filter.LIMIT > 0);
    const totalsOk = full ? (ps.length === EXP.products && variantsTested === EXP.variants && imgTotal === EXP.images) : null;
    const lazy = ps.filter((o) => o.warns.some((x) => x.indexOf('lazy-pending') === 0)).map((o) => o.h);
    let verdict = 'FAIL';
    if (!R.filter) verdict = 'NOT_RUN';
    else if (R.running) verdict = 'RUNNING';
    else if (R.error) verdict = 'ERROR';
    else if (fails.length === 0 && variantsBad === 0 && R.unknown.length === 0 && ps.length > 0) verdict = full ? (totalsOk ? 'PASS' : 'FAIL_TOTALS') : 'PASS_SUBSET';
    return {
      v: VERSION, verdict, done: R.done, error: R.error || null, secs: R.secs, filter: R.filter, full,
      tested: ps.length, pass: ps.length - fails.length, fail: fails.length,
      variants: { tested: variantsTested, bad: variantsBad, expected: full ? EXP.variants : null },
      images: { pjTotal: imgTotal, expected: full ? EXP.images : null },
      totalsOk, unknownHandles: R.unknown,
      failures: fails.slice(0, 10).map((o) => ({ h: o.h, issues: o.issues.slice(0, 5) })),
      lazyPendingNeedRetest: R.retest.slice(), lazyFirstPass: lazy.length,
      retries429: R.retries, requests: R.reqs
    };
  }
  window.__PDPSUMMARY = summary;
  window.__PDPSTATUS = () => ({ running: R.running, done: R.done, idx: R.idx, total: R.total, pass: R.products.filter((o) => o.pass).length, fail: R.products.filter((o) => !o.pass).length, retest: R.retest.slice(), retestState: R.retestState, retries429: R.retries, error: R.error || null });
  window.__PDPROWS = (onlyBad) => R.products.filter((o) => !onlyBad || !o.pass || o.warns.length).map((o) => ({ h: o.h, pass: o.pass, issues: o.issues, warns: o.warns, nv: o.variants.length, vbad: o.variants.filter((v) => !v.ok).map((v) => v.id + ':' + v.err), imgs: o.galleryImgs, pj: o.pjImages, pend: o.imgsPending, bad: o.imgsBad, retested: !!o.retested }));
  window.__PDPDUMP = () => JSON.stringify({ v: VERSION, origin: ORIGIN, summary: summary(), products: R.products });

  return 'PDP harness ready ' + VERSION + ' base=' + ORIGIN + ' | next: window.__PDPRUN({HANDLES:[...], LIMIT:n}) then poll window.__PDPSTATUS()';
})();
