// Offline mock of the Radaelli storefront (no network). Used by the self-tests of the in-page scripts.
import fs from 'node:fs';
import { parseHTML, DOMParserShim, setIframeHook } from './dom-shim.mjs';

const ORIGIN = 'https://radaelliswimwear.com';
const SCRATCH = 'C:/Users/user/AppData/Local/Temp/claude/C--CLAUDE-rada-main-rada-main/34c11d0a-7250-45aa-b727-3081da1b069a/scratchpad/';

// ---- catalog: real shape from the certified lab dump if present, else synthetic (29 products / 98 variants / 95 images)
export function buildCatalog() {
  try {
    const j = JSON.parse(fs.readFileSync(SCRATCH + 'lab-sanity.json', 'utf8'));
    const ps = (j.data || j).products.nodes;
    return ps.map((p, i) => ({
      handle: p.handle, title: p.title,
      variants: p.variants.nodes.map((v, k) => ({ id: 1000 + i * 10 + k, title: v.title || String(v.sku).split('-').pop().replace(/^.*?(S|M|L|XL)$/, '$1'), sku: v.sku, price: String(Number(v.price).toFixed(2)), available: true })),
      images: p.media.nodes.map((m, k) => ({ src: 'x' + k }))
    }));
  } catch (e) {
    const ps = [];
    for (let i = 0; i < 29; i++) {
      const nv = i < 11 ? 4 : (i === 11 ? 4 : 3);
      ps.push({ handle: 'prod-' + i, title: 'PROD ' + i, variants: Array.from({ length: nv }, (_, k) => ({ id: 1000 + i * 10 + k, title: ['S', 'M', 'L', 'XL'][k], sku: 'S' + i + k, price: i % 5 === 0 ? '159920.00' : '167920.00', available: true })), images: Array.from({ length: i < 8 ? 4 : 3 }, (_, k) => ({ src: 'x' + k })) });
    }
    return ps;
  }
}

const SOCIAL_HTML = '<a href="https://www.instagram.com/Radaelli_swimwear/">ig</a><a href="https://www.facebook.com/Radaelli_Swimwear">fb</a><a href="https://www.tiktok.com/@RadaelliSwimwear">tt</a><a href="https://wa.me/573135359668">wa</a>';

export function makeWorld() {
  const cat = buildCatalog();
  const W = {
    cat, origin: ORIGIN, posts: [], gets: 0, cart: [],
    // knobs
    colCount: { 'oasis-natural': 10, 'aurora-viva': 12, 'espuma-de-ola': 7, 'salidas-de-bano': 0, destacados: 7 },
    allP1: 24, allP2: 5,
    search: { marea: 2, verde: 2, terracota: 3, xyzqwerty: 0 },
    xl: 11, negro: 6,
    brokenRedirect: new Set(), brokenAccount: new Set(), passwordOn: false,
    hreflang: { 'x-default': ORIGIN + '/', es: ORIGIN + '/', en: ORIGIN + '/en/' },
    lang: 'es', enStatus: 200, canonicalHost: 'radaelliswimwear.com',
    footerExtra: '', socialHtml: SOCIAL_HTML,
    wwwMode: 'redirect', // redirect | serve | error
    throttle: { path: null, times: 0 }, throttleAll: false,
    addStatus: 200, cartKeepOnClear: false,
    robots: 'User-agent: *\nDisallow: /admin\nDisallow: /cart\nSitemap: ' + ORIGIN + '/sitemap.xml\n',
    sitemap: '<?xml version="1.0"?><sitemapindex><sitemap><loc>' + ORIGIN + '/sitemap_products_1.xml</loc></sitemap></sitemapindex>',
    suspiciousOn: '', imgPending: false, imgBroken: false, iframeErr: null, overflow: {}, // page -> width
    currency: 'COP', shopifyGlobal: true
  };
  const handles = cat.map((p) => p.handle);
  const card = (h, i) => '<div class="card"><a href="/products/' + h + '?_pos=' + i + '&_sid=x"><img src="/i/' + h + '.jpg"></a><a href="/collections/x/products/' + h + '">' + h + '</a></div>';
  const mainWith = (hs, extra) => '<main>' + hs.map(card).join('') + (extra || '') + '</main>';
  const head = (path, lang, extra) => '<head><title>Radaelli</title><link rel="canonical" href="https://' + W.canonicalHost + path + '">' +
    Object.keys(W.hreflang).map((k) => '<link rel="alternate" hreflang="' + k + '" href="' + W.hreflang[k] + '">').join('') +
    (W.noLocaleScript ? '' : '<script>var Shopify=Shopify||{};Shopify.locale = "' + (W.slOverride && path === '/' ? W.slOverride : lang) + '";</script>') + (extra || '') + '</head>';
  const header = '<header><nav><a href="/">Inicio</a><a href="/collections/oasis-natural">O</a><a href="/collections/aurora-viva">A</a><a href="/collections/espuma-de-ola">E</a><a href="/collections/salidas-de-bano">S</a></nav></header>';
  const footer = () => '<footer><a href="/pages/envios">e</a><a href="/policies/refund-policy">d</a><a href="/pages/garantia">g</a><a href="/pages/terminos">t</a><a href="/pages/privacidad">p</a><a href="/pages/cookies">c</a><a href="/search">b</a><a href="/pages/data-sharing-opt-out">o</a><a href="/account">acc</a>' + W.socialHtml + W.footerExtra + '</footer>';
  const page = (path, body, lang) => '<!doctype html><html lang="' + (lang || W.lang) + '">' + head(path, lang || W.lang) + '<body>' + header + body + footer() + '</body></html>';
  const simple = (path, txt) => page(path, '<main><h1>' + txt + '</h1><p>' + (W.suspiciousOn === path ? 'Translation missing: es.foo' : 'contenido normal') + '</p></main>');
  const xlH = cat.filter((p) => p.variants.some((v) => v.title === 'XL')).map((p) => p.handle);
  const pick = (n, arr) => (arr && arr.length >= n ? arr : handles).slice(0, n);

  W.html = (path, qs) => {
    if (path === '/') return page('/', mainWith(handles.slice(0, 8)));
    if (path === '/en/') return '<!doctype html><html lang="en">' + head('/en', 'en') + '<body>' + header + '<main></main>' + footer() + '</body></html>';
    let m;
    if ((m = path.match(/^\/collections\/([\w-]+)$/))) {
      const h = m[1];
      if (h === 'all') {
        if (qs.get('filter.v.option.talla') === 'XL') return page(path, mainWith(pick(W.xl, xlH)));
        if (qs.get('filter.p.m.custom.color') === 'NEGRO') return page(path, mainWith(handles.slice(0, W.negro)));
        if (qs.get('filter.v.price.lte')) { const lim = Number(qs.get('filter.v.price.lte')); return page(path, mainWith(cat.filter((p) => Math.min(...p.variants.map((v) => Number(v.price))) <= lim).map((p) => p.handle))); }
        if (qs.get('page') === '2') return page(path, mainWith(handles.slice(24, 24 + W.allP2)));
        return page(path, mainWith(handles.slice(0, W.allP1)));
      }
      if (h in W.colCount) return page(path, mainWith(handles.slice(0, W.colCount[h])));
      return null;
    }
    if (path === '/search') { const q = qs.get('q'); if (q == null) return page(path, '<main><h1>Buscar</h1></main>'); const n = W.search[q] || 0; return page(path, mainWith(handles.slice(0, n), n === 0 ? '<p>Sin resultados</p>' : '')); }
    if (path === '/cart') return page(path, '<main><h1>Carrito</h1><form action="/cart"><button name="checkout">Pagar</button></form></main>');
    if ((m = path.match(/^\/products\/([\w-]+)$/))) return handles.includes(m[1]) ? page(path, '<main><h1>' + m[1] + '</h1><img src="a.jpg"></main>') : null;
    if (/^\/pages\/(garantia|envios|terminos|privacidad|cookies|favoritos|contact|data-sharing-opt-out)$/.test(path)) return simple(path, 'Pagina');
    if (/^\/policies\/(refund-policy|privacy-policy|terms-of-service|shipping-policy)$/.test(path)) return simple(path, 'Politica');
    return null;
  };

  W.redirectsList = [];
  W.setRedirects = (pairs) => { W.redirectsList = pairs; };

  const resp = (o) => ({
    status: o.status, ok: o.status >= 200 && o.status < 300, type: o.type || 'basic', url: o.url || '', redirected: !!o.redirected,
    headers: { get: () => null }, text: async () => o.body || '', json: async () => JSON.parse(o.body || 'null')
  });

  W.fetch = async (input, init) => {
    init = init || {};
    const method = (init.method || 'GET').toUpperCase();
    const u = new URL(input, ORIGIN + '/');
    if (method === 'POST') W.posts.push(u.pathname);
    else W.gets++;
    if (W.throttleAll) return resp({ status: 429, url: u.href });
    if (W.throttle.path && u.pathname === W.throttle.path && W.throttle.times > 0) { W.throttle.times--; return resp({ status: 429, url: u.href }); }
    // other host
    if (u.hostname !== 'radaelliswimwear.com') {
      if (init.mode !== 'no-cors' || init.redirect !== 'manual') throw new TypeError('Failed to fetch (cors)');
      if (W.wwwMode === 'error') throw new TypeError('Failed to fetch');
      if (W.wwwMode === 'serve') return resp({ status: 0, type: 'opaque' });
      return resp({ status: 0, type: 'opaqueredirect' });
    }
    const p = u.pathname;
    // cart API
    if (p === '/cart/clear.js') { if (!W.cartKeepOnClear) W.cart = []; return resp({ status: 200, body: '{}', url: u.href }); }
    if (p === '/cart/add.js') {
      if (W.addStatus !== 200) return resp({ status: W.addStatus, body: '{"message":"x"}', url: u.href });
      const fd = init.body; const id = Number(fd.get('id')); const q = Number(fd.get('quantity'));
      const v = cat.flatMap((pp) => pp.variants).find((vv) => vv.id === id);
      if (!v) return resp({ status: 404, body: '{}', url: u.href });
      W.cart.push({ variant_id: id, quantity: q, price: Number(v.price) * 100 });
      return resp({ status: 200, body: JSON.stringify({ variant_id: id, quantity: q }), url: u.href });
    }
    if (p === '/cart.js') return resp({ status: 200, body: JSON.stringify({ item_count: W.cart.reduce((a, i) => a + i.quantity, 0), items: W.cart, currency: W.currency }), url: u.href });
    if (p === '/checkout') return resp({ status: 0, type: 'opaqueredirect' });
    if (p === '/products.json') return resp({ status: 200, body: JSON.stringify({ products: cat.map((pp) => ({ handle: pp.handle, title: pp.title, variants: pp.variants, images: pp.images })) }), url: u.href });
    if (p === '/robots.txt') return resp({ status: 200, body: W.robots, url: u.href });
    if (p === '/sitemap.xml') return resp({ status: 200, body: W.sitemap, url: u.href });
    // redirects
    const pair = W.redirectsList.find((r) => r[0] === p);
    if (pair) {
      const manual = init.redirect === 'manual';
      if (/^\/account/.test(pair[1])) {
        if (manual) return W.brokenAccount.has(p) ? resp({ status: 200, type: 'basic', url: u.href, body: '<main></main>' }) : resp({ status: 0, type: 'opaqueredirect' });
        throw new TypeError('Failed to fetch (cross-origin account redirect)');
      }
      if (W.brokenRedirect.has(p)) return resp({ status: 404, url: ORIGIN + '/pages/404', redirected: true, body: '<main>404</main>' });
      return resp({ status: 200, url: ORIGIN + pair[1], redirected: true, body: W.html(pair[1], u.searchParams) || '<main>ok</main>' });
    }
    if (p === '/account' || p === '/account/login') return resp({ status: 0, type: 'opaqueredirect' });
    if (W.passwordOn && p !== '/password') return resp({ status: 200, url: ORIGIN + '/password', redirected: true, body: '<main>password</main>' });
    if (p === '/en/' && W.enStatus !== 200) return resp({ status: W.enStatus, url: u.href, body: '<main>no</main>' });
    const html = W.html(p, u.searchParams);
    if (html == null) return resp({ status: 404, url: u.href, body: '<html><head></head><body><main><h1>404</h1></main></body></html>' });
    return resp({ status: 200, url: u.href, body: html });
  };

  // iframe behaviour for the responsive phase
  setIframeHook((e, d, html, width) => {
    const bm = /<base href="([^"]+)">/.exec(html); const path = bm ? new URL(bm[1]).pathname : '';
    const imgs = d.querySelectorAll('img');
    if (W.imgPending) imgs.forEach((i) => { i.attrs['data-pending'] = '1'; });
    if (W.imgBroken) imgs.forEach((i) => { i.attrs['data-broken'] = '1'; });
    const ow = W.overflow[path + '@' + width]; if (ow) d.documentElement.mock.scrollWidth = ow;
    if (W.iframeErr) e.contentWindow.__errs.push(...W.iframeErr);
  });
  return W;
}

const SS = new Map();
export const sessionStore = SS;
export function installGlobals(W, extra) {
  globalThis.sessionStorage = { getItem: (k) => (SS.has(k) ? SS.get(k) : null), setItem: (k, v) => { SS.set(k, String(v)); }, removeItem: (k) => { SS.delete(k); } };
  const doc = parseHTML('<html><head></head><body></body></html>', ORIGIN + '/');
  globalThis.window = globalThis;
  globalThis.location = new URL(ORIGIN + '/');
  globalThis.document = doc;
  globalThis.DOMParser = DOMParserShim;
  globalThis.fetch = W.fetch;
  globalThis.Shopify = W.shopifyGlobal ? { locale: 'es', currency: { active: W.currency }, country: 'CO', theme: { name: 'Radaelli RC1.10', role: 'main' }, shop: 'x.myshopify.com' } : undefined;
  if (extra) Object.assign(globalThis, extra);
  return doc;
}
