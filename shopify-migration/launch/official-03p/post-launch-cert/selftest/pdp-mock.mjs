// Mock PDP pages for the PDP harness self-tests (offline). Exports world(), load().
import vm from 'node:vm';
import { makeWorld, installGlobals } from './mock-store.mjs';
import { setIframeHook } from './dom-shim.mjs';
export const ORIGIN = 'https://radaelliswimwear.com';
const money = (p) => '$' + Math.round(Number(p)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const resp = (status, body, url) => ({ status, ok: status < 300, type: 'basic', url: url || '', redirected: false, headers: { get: () => null }, text: async () => body, json: async () => JSON.parse(body) });

export function world(mut) {
  const W = makeWorld();
  Object.assign(W, { desc: {}, lazy: new Set(), retestMode: false, wrongSel: new Set(), accDead: new Set(), overflow2: new Set(), perr: {}, throttlePj: { h: null, times: 0 }, wrongH1: new Set(), noCanon: new Set(), gets2: 0 });
  if (mut) mut(W);
  const base = W.fetch;
  W.fetch = async (input, init) => {
    const u = new URL(input, ORIGIN + '/');
    const m = u.pathname.match(/^\/products\/([\w-]+?)(\.js)?$/);
    const p = m && W.cat.find((x) => x.handle === m[1]);
    if (!p) return base(input, init);
    W.gets2++;
    if (m[2]) {
      if (W.throttlePj.h === p.handle && W.throttlePj.times > 0) { W.throttlePj.times--; return resp(429, '', u.href); }
      return resp(200, JSON.stringify({ handle: p.handle, title: p.title, variants: p.variants.map((v) => ({ id: v.id, price: Number(v.price) * 100, available: v.available, options: [v.title], title: v.title, sku: v.sku })), images: p.images }), u.href);
    }
    const v0 = p.variants[0];
    const html = '<!doctype html><html lang="es"><head><title>' + p.title + '</title>' +
      (W.noCanon.has(p.handle) ? '' : '<link rel="canonical" href="' + ORIGIN + '/products/' + p.handle + '">') +
      '<meta property="og:image" content="x"><meta property="og:title" content="t"><script type="application/ld+json">{"@type":"Product"}</script></head><body><main>' +
      '<h1>' + (W.wrongH1.has(p.handle) ? 'OTRO' : p.title) + '</h1><div class="product-gallery">' + p.images.map(() => '<img src="a.jpg">').join('') + '</div>' +
      '<p>' + (W.desc[p.handle] || 'Ideal para todo el verano. TODO EL DÍA. Sin financiación ni banano.') + '</p><span>' + money(v0.price) + '</span>' +
      '<form action="/cart/add"><input data-variant-id-input value="' + v0.id + '"><div data-option-group data-option-position="1">' +
      p.variants.map((v, i) => '<input type="radio" data-option-input value="' + v.title + '"' + (i === 0 ? ' checked' : '') + '>').join('') +
      '</div><button name="add">Anadir</button></form>' +
      [1, 2, 3, 4, 5].map((n) => '<details><summary>Acc ' + n + '</summary><p>x</p></details>').join('') + '</main></body></html>';
    return resp(200, html, u.href);
  };
  setIframeHook((e, d, html) => {
    const h = /products\/([\w-]+)">/.exec(html)[1];
    const p = W.cat.find((x) => x.handle === h);
    d.querySelectorAll('img').forEach((i) => { if (W.lazy.has(h) && !W.retestMode) i.attrs['data-pending'] = '1'; });
    if (W.overflow2.has(h)) d.documentElement.mock.scrollWidth = 520;
    if (W.perr[h]) e.contentWindow.__errs.push(...W.perr[h]);
    d.onclick = (el) => {
      if (el.localName === 'input' && el.hasAttribute('data-option-input')) {
        el.parentElement.querySelectorAll('input').forEach((i) => { i.checked = false; });
        el.checked = true;
        const v = p.variants.find((x) => x.title === el.value);
        const vin = d.querySelector('[data-variant-id-input]'); vin.value = W.wrongSel.has(h) ? 1 : v.id;
        d.querySelector('[name=add]').mock.disabled = !v.available;
      } else if (el.localName === 'summary') { if (!W.accDead.has(h)) el.parentElement.open = !el.parentElement.open; }
    };
  });
  return W;
}
export const FAST = { gap: 0, backoff: 10, settle: 1, imgWait: 1, variantWait: 1, accWait: 1, retestSettle: 1, retestMax: 40 };
export function load(W, cfg, CODE) {
  installGlobals(W);
  globalThis.__PDPCFG = Object.assign({}, FAST, cfg || {});
  delete globalThis.__PDP;
  return vm.runInThisContext(CODE);
}
