// 03I — Autoprueba de 03i-post-a1-verify.js contra un storefront SIMULADO (fixtures sintéticos).
// No usa red ni la Dev Store. Prueba: (a) el veredicto en cada escenario, (b) que el verificador
// solo llama a endpoints de solo lectura/sesión (nunca /checkout, /admin, pedidos), (c) que la sesión
// se restaura, (d) que el texto del script no contiene rutas prohibidas.
// Uso: node launch/tools/03i-post-a1-verify.selftest.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(process.env.A1_SRC || path.join(here, '03i-post-a1-verify.js'), 'utf8');

const ALLOWED = [
  ['POST', /^\/localization$/],
  ['GET', /^\/$/],
  ['GET', /^\/en$/],
  ['GET', /^\/products\.json$/],
  ['GET', /^\/products\/[a-z0-9-]+\.js$/],
  ['POST', /^\/cart\/add\.js$/],
  ['GET', /^\/cart\.js$/],
  ['POST', /^\/cart\/clear\.js$/],
  ['POST', /^\/cart\/prepare_shipping_rates\.json$/],
  ['GET', /^\/cart\/async_shipping_rates\.json$/],
];

function makeWorld(cfg) {
  const st = { country: cfg.startCountry || 'US', cart: [], calls: [], n: 0, pc: {} };
  const products = [];
  for (let i = 1; i <= 29; i++) {
    const handle = i === 1 ? 'brisa-natural-beige' : i === 2 ? 'bikini-shadow-azul-marino' : `producto-${i}`;
    const sizes = i <= 11 ? ['S', 'M', 'L', 'XL'] : ['S', 'M', 'L'];
    products.push({ handle, variants: sizes.map((s, k) => ({ id: i * 100 + k, title: s, price: (i === 1 ? 199920 : i === 2 ? 159920 : 167920) * 100 })) });
  }
  const available = () => cfg.availableFor(st.country);
  const cartTotal = () => st.cart.reduce((a, l) => a + l.price * l.qty, 0) / 100;
  const html = (country) =>
    `<html lang="${cfg.langOverride || 'es'}"><script>Shopify.country = "${country}"; Shopify.currency = {"active":"COP","rate":"1.0"}; Shopify.locale = "es";</script></html>`;
  const res = (status, body, extra) => ({
    status, ok: status >= 200 && status < 300, type: 'basic',
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body), ...extra,
  });
  const fetchFn = async (u, o = {}) => {
    const url = new URL(u, 'https://x.test');
    const method = (o.method || 'GET').toUpperCase();
    st.calls.push(`${method} ${url.pathname}`);
    st.n++;
    st.pc[url.pathname] = (st.pc[url.pathname] || 0) + 1;
    if (cfg.rl && (cfg.rl.path === '*' || cfg.rl.path === url.pathname)) {
      const k = cfg.rl.path === '*' ? st.n : st.pc[url.pathname];
      if (k >= cfg.rl.from && k < cfg.rl.from + cfg.rl.count) return res(429, '<html><title>Verifying your connection...</title></html>');
    }
    const p = url.pathname;
    if (method === 'POST' && p === '/localization') {
      const cc = new URLSearchParams(String(o.body)).get('country_code');
      if (!(cfg.ignoreCO && cc === 'CO')) st.country = cc;
      return res(0, '', { type: 'opaqueredirect' });
    }
    if (method === 'GET' && (p === '/' || p === '/en')) {
      if (cfg.password) return res(200, '<html><input name="form_type" value="storefront_password"></html>');
      if (p === '/en') return res(200, `<html lang="en"><script>Shopify.country = "${st.country}"; Shopify.currency = {"active":"COP"};</script></html>`);
      if (o.credentials === 'omit' && cfg.defaultVisitor === null) return res(200, '<html><input name="form_type" value="storefront_password"></html>');
      return res(200, html(o.credentials === 'omit' ? cfg.defaultVisitor : st.country));
    }
    if (p === '/products.json') {
      return res(200, { products: products.map((pr) => ({ handle: pr.handle, variants: pr.variants.map((v) => ({ id: v.id, available: available() })) })) });
    }
    const m = p.match(/^\/products\/([a-z0-9-]+)\.js$/);
    if (m) {
      const pr = products.find((x) => x.handle === m[1]);
      return res(200, { variants: pr.variants.map((v) => ({ id: v.id, title: v.title, price: v.price, available: available() })) });
    }
    if (p === '/cart/add.js') {
      if (!available()) return res(422, { description: 'ya está agotado' });
      const it = JSON.parse(o.body).items[0];
      const v = products.flatMap((x) => x.variants).find((x) => x.id === it.id);
      st.cart.push({ id: v.id, price: v.price, qty: it.quantity });
      return res(200, {});
    }
    if (p === '/cart.js') {
      return res(200, { currency: 'COP', total_price: cartTotal() * 100, total_discount: 0, item_count: st.cart.reduce((a, l) => a + l.qty, 0) });
    }
    if (p === '/cart/clear.js') { st.cart = []; return res(200, {}); }
    if (p === '/cart/prepare_shipping_rates.json') return res(200, {});
    if (p === '/cart/async_shipping_rates.json') {
      const prov = url.searchParams.get('shipping_address[province]');
      const total = cartTotal();
      if (cfg.provinceBroken && prov !== 'Bogotá, D.C.') return res(200, { shipping_rates: [] });
      return res(200, { shipping_rates: cfg.rates(total) });
    }
    return res(404, {});
  };
  return { st, fetchFn };
}

const FREE = { name: 'Envío estándar gratis', price: '0.00', delivery_days: 4 };
const scenarios = [
  { name: 'S0 estado actual (sin zona CO): agotado', cfg: { availableFor: (c) => c !== 'CO', rates: () => [], defaultVisitor: 'US' }, opts: {}, verdict: 'A1_NOT_UNLOCKED', mustFail: ['C03', 'C04'] },
  { name: 'S1 zona con solo tramo gratis, D2 pendiente (QA parcial)', cfg: { availableFor: () => true, rates: (t) => (t >= 299900 ? [FREE] : []), defaultVisitor: 'US' }, opts: { d2: 'pending' }, verdict: 'A1_UNLOCKED' },
  { name: 'S2 D2 opción a con X=25000', cfg: { availableFor: () => true, rates: (t) => (t >= 299900 ? [FREE] : [{ name: 'Envío estándar', price: '25000.00', delivery_days: 4 }]), defaultVisitor: 'US' }, opts: { d2: 'a', x: 25000 }, verdict: 'A1_UNLOCKED' },
  { name: 'S3 D2 desconocida y 1 prenda sin tarifa → parcial', cfg: { availableFor: () => true, rates: (t) => (t >= 299900 ? [FREE] : []), defaultVisitor: 'US' }, opts: { d2: 'unknown' }, verdict: 'A1_PARTIAL', mustFail: ['C05'] },
  { name: 'S4 modo AFTER con visitante nuevo aún en US → parcial', cfg: { availableFor: () => true, rates: (t) => (t >= 299900 ? [FREE] : [{ name: 'Envío', price: '9000.00' }]), defaultVisitor: 'US' }, opts: { mode: 'AFTER', d2: 'a' }, verdict: 'A1_PARTIAL', mustFail: ['C10'] },
  { name: 'S5 modo AFTER con visitante nuevo en CO → desbloqueado', cfg: { availableFor: () => true, rates: (t) => (t >= 299900 ? [FREE] : [{ name: 'Envío', price: '9000.00' }]), defaultVisitor: 'CO' }, opts: { mode: 'AFTER', d2: 'a' }, verdict: 'A1_UNLOCKED' },
  { name: 'S5c AFTER: visitante nuevo sin país legible (contraseña) → revisión, no PASS', cfg: { availableFor: () => true, rates: (t) => (t >= 299900 ? [FREE] : [{ name: 'Envío', price: '9000.00' }]), defaultVisitor: null }, opts: { mode: 'AFTER', d2: 'a' }, verdict: 'A1_UNLOCKED_REVIEW' },
  { name: 'S12 límite 429 en /cart.js a mitad de corrida → BLOQUEADO pero sesión restaurada', cfg: { availableFor: () => true, defaultVisitor: 'US', rates: (t) => (t >= 299900 ? [FREE] : [{ name: 'Envío', price: '9000.00' }]), rl: { path: '/cart.js', from: 4, count: 2 } }, opts: { d2: 'a' }, verdict: 'BLOCKED', mustFail: ['C99'] },
  { name: 'S13 límite 429 sostenido desde la petición 26 → BLOQUEADO; C11 da la instrucción manual', cfg: { availableFor: () => true, defaultVisitor: 'US', rates: () => [], rl: { path: '*', from: 26, count: 100000 } }, opts: { d2: 'a' }, verdict: 'BLOCKED', mustFail: ['C99', 'C11'], noRestoreCheck: true },
  { name: 'S14 límite 429 desde la primera petición → BLOQUEADO sin escribir nada', cfg: { availableFor: () => true, defaultVisitor: 'US', rates: () => [], rl: { path: '*', from: 1, count: 100000 } }, opts: {}, verdict: 'BLOCKED', reason: 'rate_limited', noWrites: true },
  { name: 'S15 límite 429 en el catálogo no se confunde con catálogo vacío', cfg: { availableFor: () => true, defaultVisitor: 'US', rates: (t) => (t >= 299900 ? [FREE] : [{ name: 'Envío', price: '9000.00' }]), rl: { path: '/products.json', from: 1, count: 1 } }, opts: { d2: 'a' }, verdict: 'BLOCKED', mustFail: ['C99'] },
  { name: 'S6 provincias remotas sin tarifa → requiere revisión', cfg: { availableFor: () => true, rates: (t) => (t >= 299900 ? [FREE] : [{ name: 'Envío', price: '9000.00' }]), defaultVisitor: 'US', provinceBroken: true }, opts: { d2: 'a' }, verdict: 'A1_UNLOCKED_REVIEW' },
  { name: 'S7 página de contraseña → BLOQUEADO sin cambios', cfg: { availableFor: () => true, rates: () => [], defaultVisitor: 'US', password: true }, opts: {}, verdict: 'BLOCKED', noWrites: true },
  { name: 'S8 carrito no vacío → BLOQUEADO y carrito intacto', cfg: { availableFor: () => true, rates: () => [], defaultVisitor: 'US', preCart: true }, opts: {}, verdict: 'BLOCKED', cartIntact: true },
  { name: 'S9 /en roto (lang es) → parcial', cfg: { availableFor: () => true, rates: (t) => (t >= 299900 ? [FREE] : [{ name: 'Envío', price: '9000.00' }]), defaultVisitor: 'US', enBroken: true }, opts: { d2: 'a' }, verdict: 'A1_PARTIAL', mustFail: ['C09'] },
  { name: 'S10 sin tramo gratis: ≥ 299.900 sigue pagando envío → parcial', cfg: { availableFor: () => true, rates: () => [{ name: 'Envío', price: '9000.00' }], defaultVisitor: 'US' }, opts: { d2: 'a' }, verdict: 'A1_PARTIAL', mustFail: ['C06', 'C07'] },
  { name: 'S11 CO no es un país vendible (la sesión no cambia) → no desbloqueado', cfg: { availableFor: () => true, rates: (t) => (t >= 299900 ? [FREE] : [{ name: 'Envío', price: '9000.00' }]), defaultVisitor: 'US', ignoreCO: true }, opts: { d2: 'a' }, verdict: 'A1_NOT_UNLOCKED', mustFail: ['C01'] },
];

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('  FAIL:', msg); } };

for (const sc of scenarios) {
  const world = makeWorld(sc.cfg);
  if (sc.cfg.preCart) world.st.cart.push({ id: 100, price: 19992000, qty: 1 });
  if (sc.cfg.enBroken) {
    const orig = world.fetchFn;
    world.fetchFn = async (u, o) => {
      if (new URL(u, 'https://x.test').pathname === '/en') { world.st.calls.push('GET /en'); return { status: 200, ok: true, type: 'basic', text: async () => '<html lang="es"><script>Shopify.country = "CO";</script></html>' }; }
      return orig(u, o);
    };
  }
  const sandbox = { __A1_FETCH: world.fetchFn, __A1_OPTS: Object.assign({ pollMs: 0, retryMs: 0 }, sc.opts), URLSearchParams, setTimeout, parseFloat, Number, JSON, Promise, String, Array, Math };
  const ctx = vm.createContext(sandbox);
  const line = await vm.runInContext(SRC, ctx);
  const r = ctx.__a1verify;
  console.log(`${sc.name}\n  → ${line}`);
  ok(r.verdict === sc.verdict, `${sc.name}: veredicto ${r.verdict} ≠ ${sc.verdict}`);
  if (sc.reason) ok(r.reason === sc.reason, `${sc.name}: reason ${r.reason} ≠ ${sc.reason}`);
  for (const id of sc.mustFail || []) ok(r.checks.find((c) => c.id === id)?.status === 'FAIL', `${sc.name}: ${id} debía FALLAR`);
  // Solo endpoints permitidos.
  for (const c of world.st.calls) {
    const [method, p] = c.split(' ');
    ok(ALLOWED.some(([mm, re]) => mm === method && re.test(p)), `${sc.name}: llamada no permitida ${c}`);
  }
  // Restauración de sesión: carrito vacío y país original (salvo bloqueos, donde nada se toca).
  if (sc.cfg.preCart) {
    ok(world.st.cart.length === 1, `${sc.name}: el carrito previo debía quedar intacto`);
    ok(!world.st.calls.some((c) => c === 'POST /cart/clear.js' || c === 'POST /localization'), `${sc.name}: no debía escribir nada`);
  } else if (sc.noRestoreCheck) {
    ok(r.checks.find((c) => c.id === 'C11')?.note.includes('country_code=US'), `${sc.name}: la nota de C11 debe dar la instrucción de restauración`);
  } else if (sc.noWrites) {
    ok(!world.st.calls.some((c) => c.startsWith('POST')), `${sc.name}: no debía escribir nada`);
  } else {
    ok(world.st.cart.length === 0, `${sc.name}: el carrito debía terminar vacío`);
    ok(world.st.country === 'US', `${sc.name}: el país debía volver a US (era ${world.st.country})`);
    ok(r.checks.find((c) => c.id === 'C11')?.status === 'PASS', `${sc.name}: C11 debía pasar`);
  }
}

// Propiedades del texto del script (no puede referirse a rutas de pedido/admin/checkout).
const code = SRC.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n').replace(/'[^'\n]*'/g, "''").replace(/`[^`\n]*`/g, '``');
for (const bad of ['/checkout', '/admin', 'graphql', 'draft_order', '/orders', 'cart/change', 'cart/update']) {
  ok(!SRC.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n').includes(bad), `el script no debe contener "${bad}"`);
}
void code;

console.log(`\n03i-post-a1-verify.selftest: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
