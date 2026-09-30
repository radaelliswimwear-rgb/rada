// 03I — Verificador post-A1 (solo lectura del storefront).
//
// CÓMO SE USA: pegar completo en la herramienta de JavaScript del navegador, en una pestaña
// del storefront de la Dev Store (radaelli-swimwear-dev.myshopify.com) con la contraseña de
// la tienda ya desbloqueada. Devuelve una línea corta; el detalle queda en
// window.__a1verify y en <pre id="__a1verify"> (leer con get_page_text).
//
// QUÉ NO HACE (propiedades verificadas por 03i-post-a1-verify.selftest.mjs):
//   - No crea pedidos ni checkouts, no abre /checkout, no escribe datos personales.
//   - No toca el Admin ni ninguna configuración de mercado, envío, pagos o theme.
//   - Solo mueve dos datos de la SESIÓN del navegador (país de localización y carrito)
//     y los restaura al terminar. Si el carrito ya tenía ítems, se detiene sin tocarlo.
//
// OPCIONES (opcional, antes de pegar): globalThis.__A1_OPTS = { mode, d2, x }
//   mode: 'G1'    (default) = tras la zona de envío, con la dirección/mercado sin cambiar.
//         'AFTER' = tras terminar todo A1; exige además que un visitante nuevo resuelva a CO.
//   d2:   'pending' (D2 sin decidir: modo QA parcial; 1 prenda SIN tarifa es lo esperado, no lanzable)
//         'a' (tarifa fija; opcional x = precio en COP), 'b' (costo 0 con nombre honesto),
//         'c' (gratis para todos), 'unknown' (default: 1 prenda sin tarifa = FALLA).
// Estados por chequeo: PASS · FAIL · REVIEW (requiere criterio o NOT_VERIFIED) · INFO.
// Veredicto: A1_UNLOCKED | A1_UNLOCKED_REVIEW | A1_PARTIAL | A1_NOT_UNLOCKED | BLOCKED.
// Si Shopify responde 429 ("Verifying your connection…"), la corrida se corta, se restaura la sesión con
// reintentos y el veredicto es BLOCKED. Correr el verificador como máximo 2 veces seguidas y esperar 10–15 min.
(async () => {
  const OPTS = Object.assign(
    { mode: 'G1', d2: 'unknown', x: null, pollMs: 1000, retryMs: 4000, expectProducts: 29, expectVariants: 98 },
    globalThis.__A1_OPTS || {}
  );
  const base = globalThis.__A1_FETCH || ((u, o) => fetch(u, o));
  // Shopify limita las peticiones ("Verifying your connection…", 429): se corta la corrida y se restaura la sesión.
  const F = async (u, o) => {
    const r = await base(u, o);
    if (r.status === 429) { const e = new Error('RATE_LIMITED'); e.rate = true; throw e; }
    return r;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const checks = [];
  const add = (id, name, expect, actual, status, note) =>
    checks.push({ id, name, expect, actual, status, note: note || '' });

  const info = (html) => ({
    country: (html.match(/Shopify\.country\s*=\s*"([A-Z]{2})"/) || [])[1] ?? null,
    currency: (html.match(/Shopify\.currency\s*=\s*\{[^}]*"active":"([A-Z]{3})"/) || [])[1] ?? null,
    lang: (html.match(/<html[^>]*\blang="([^"]+)"/i) || [])[1] ?? null,
    passwordPage: /value="storefront_password"/i.test(html),
  });
  const getInfo = async (path, init) => {
    const r = await F(path, Object.assign({ cache: 'no-store', redirect: 'follow' }, init || {}));
    return Object.assign({ status: r.status }, info(await r.text()));
  };
  const setCountry = async (cc) => {
    const body = new URLSearchParams({ form_type: 'localization', utf8: '✓', _method: 'put', country_code: cc, return_to: '/' });
    const r = await F('/localization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      redirect: 'manual',
    });
    return { type: r.type, status: r.status };
  };
  const cartInfo = async () => {
    const c = await (await F('/cart.js', { cache: 'no-store' })).json();
    return { currency: c.currency, total_cop: c.total_price / 100, discount_cop: c.total_discount / 100, items: c.item_count };
  };
  const clearCart = () => F('/cart/clear.js', { method: 'POST' });
  const addItem = async (handle, size, qty) => {
    const p = await (await F(`/products/${handle}.js`)).json();
    const v = p.variants.find((x) => x.title === size) ?? p.variants[0];
    const r = await F('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: v.id, quantity: qty || 1 }] }),
    });
    return { handle, size: v.title, unit_cop: v.price / 100, status: r.status };
  };
  // Devuelve [] (sin tarifas), [{name,price,days}] o null (sin respuesta en ~10 s).
  const estimate = async (province, zip) => {
    const q = new URLSearchParams({
      'shipping_address[zip]': zip,
      'shipping_address[country]': 'Colombia',
      'shipping_address[province]': province,
    });
    await F('/cart/prepare_shipping_rates.json?' + q, { method: 'POST' });
    for (let i = 0; i < 10; i++) {
      await sleep(OPTS.pollMs);
      const r = await F('/cart/async_shipping_rates.json?' + q, { cache: 'no-store' });
      if (r.status === 200) {
        const j = await r.json();
        return (j.shipping_rates || []).map((x) => ({ name: x.name, price: parseFloat(x.price), days: x.delivery_days ?? null }));
      }
    }
    return null;
  };
  const fmt = (rates) => (rates === null ? 'sin respuesta' : rates.length === 0 ? '0 tarifas' : rates.map((r) => `${r.name}=${r.price}`).join(' | '));
  const hasFree = (rates) => Array.isArray(rates) && rates.some((r) => r.price === 0);

  const finish = async (verdict, extra) => {
    const status = (s) => checks.filter((c) => c.status === s).length;
    const result = Object.assign(
      { tool: '03i-post-a1-verify', mode: OPTS.mode, d2: OPTS.d2, verdict, counts: { PASS: status('PASS'), FAIL: status('FAIL'), REVIEW: status('REVIEW'), INFO: status('INFO') }, checks },
      extra || {}
    );
    globalThis.__a1verify = result;
    if (typeof document !== 'undefined') {
      let pre = document.getElementById('__a1verify');
      if (!pre) { pre = document.createElement('pre'); pre.id = '__a1verify'; document.body.appendChild(pre); }
      pre.textContent = JSON.stringify(result, null, 1);
    }
    return `A1_VERIFY ${verdict} PASS=${result.counts.PASS} FAIL=${result.counts.FAIL} REVIEW=${result.counts.REVIEW} INFO=${result.counts.INFO}`;
  };

  // 0. Precondiciones: sesión desbloqueada y carrito vacío (no se pisa nada de la persona).
  let home0, cart0;
  try {
    home0 = await getInfo('/');
    if (!(home0.passwordPage || home0.country === null)) cart0 = await cartInfo();
  } catch (e) {
    add('C00', 'Ejecución sin interrupciones', 'sin errores', e.rate ? 'Shopify limitó las peticiones (429)' : String(e.message), 'FAIL', 'No se cambió nada. Esperar 10–15 min y repetir.');
    return finish('BLOCKED', { reason: e.rate ? 'rate_limited' : 'error_before_changes' });
  }
  if (home0.passwordPage || home0.country === null) {
    add('C00', 'Sesión del storefront desbloqueada', 'página real de la tienda', 'página de contraseña o sin Shopify.country', 'FAIL', 'Desbloquear la tienda con la contraseña de la Dev Store y repetir. No se cambió nada.');
    return finish('BLOCKED', { reason: 'password_page' });
  }
  if (cart0.items > 0) {
    add('C00', 'Carrito vacío al empezar', '0 ítems', `${cart0.items} ítems`, 'FAIL', 'El carrito de esta sesión ya tenía ítems; no se tocó. Vaciarlo a mano y repetir.');
    return finish('BLOCKED', { reason: 'cart_not_empty' });
  }
  const original = { country: home0.country, currency: home0.currency };
  add('C00', 'Sesión desbloqueada y carrito vacío', 'sí', `país de sesión ${original.country}`, 'INFO', 'Se restaurará al terminar.');

  let interrupted = null;
  try {
    // 1. Forzar CO en la sesión (misma prueba que dio 0/29 en 03E).
    await setCountry('CO');
    const homeCO = await getInfo('/');
    add('C01', 'Sesión forzada a CO resuelve país CO', 'CO', String(homeCO.country), homeCO.country === 'CO' ? 'PASS' : 'FAIL',
      homeCO.country === 'CO' ? '' : 'CO no es un país vendible para esta sesión: revisar que Colombia esté en un mercado Activo y en una zona de envío (runbook de envío § 9).');
    add('C02', 'Moneda de la sesión CO', 'COP', String(homeCO.currency), homeCO.currency === 'COP' ? 'PASS' : 'FAIL');

    // 2. Catálogo disponible.
    let list = [];
    try { list = (await (await F('/products.json?limit=250', { cache: 'no-store' })).json()).products || []; } catch (e) { if (e.rate) throw e; list = []; }
    const vars = list.flatMap((p) => p.variants);
    const availV = vars.filter((v) => v.available).length;
    const availP = list.filter((p) => p.variants.some((v) => v.available)).length;
    const catOk = list.length === OPTS.expectProducts && vars.length === OPTS.expectVariants && availV === vars.length && vars.length > 0;
    add('C03', 'Catálogo disponible con CO', `${OPTS.expectProducts}/${OPTS.expectProducts} productos y ${OPTS.expectVariants}/${OPTS.expectVariants} variantes`,
      `${availP}/${list.length} productos y ${availV}/${vars.length} variantes`, catOk ? 'PASS' : 'FAIL',
      catOk ? '' : 'Sigue agotado: falta una zona con tarifa que cubra el carrito (o la propagación). Ver runbook de envío § 9.');

    // 3. T1: 1 prenda (199.920).
    const a1 = await addItem('brisa-natural-beige', 'S', 1);
    const cartT1 = a1.status === 200 ? await cartInfo() : null;
    const t1Ok = a1.status === 200 && cartT1 && cartT1.currency === 'COP' && cartT1.total_cop === a1.unit_cop && cartT1.discount_cop === 0;
    add('C04', 'Agregar 1 prenda al carrito con CO (T1)', '200, COP, total = precio de la variante, descuento 0',
      a1.status === 200 ? `${a1.status}, ${cartT1.currency}, ${cartT1.total_cop}, desc ${cartT1.discount_cop}` : `status ${a1.status}`, t1Ok ? 'PASS' : 'FAIL',
      a1.unit_cop === 199920 ? '' : `Precio de la variante ${a1.unit_cop} (referencia 03C: 199920).`);
    if (a1.status === 200) {
      const r1 = await estimate('Bogotá, D.C.', '110111');
      let st, note = '';
      if (OPTS.d2 === 'pending') { st = r1 !== null && r1.length === 0 ? 'PASS' : 'REVIEW'; note = 'D2 pendiente (modo QA parcial): 1 prenda sin método de envío es lo esperado y NO es lanzable.'; }
      else if (r1 === null) { st = 'REVIEW'; note = 'Sin respuesta del estimador en ~10 s; repetir.'; }
      else if (r1.length === 0) { st = 'FAIL'; note = 'Sin método de envío para 1 prenda: no se puede pagar (runbook de envío § 7.1).'; }
      else if (OPTS.d2 === 'a' && OPTS.x !== null) { st = r1.some((r) => r.price === Number(OPTS.x)) ? 'PASS' : 'FAIL'; }
      else if (OPTS.d2 === 'c') { st = hasFree(r1) ? 'PASS' : 'FAIL'; }
      else if (OPTS.d2 === 'b') { st = hasFree(r1) ? 'REVIEW' : 'FAIL'; note = 'Costo 0 esperado; el nombre debe decir que el envío se coordina (juicio de la dueña).'; }
      else { st = 'PASS'; }
      add('C05', 'Tarifa para 1 prenda en Bogotá (T1)', `según D2 = ${OPTS.d2}`, fmt(r1), st, note);
    } else {
      add('C05', 'Tarifa para 1 prenda en Bogotá (T1)', 'n/a', 'no se pudo agregar al carrito', 'FAIL', 'Depende de C04.');
    }

    // 4. T3 / T4: carritos por encima del umbral → envío gratis.
    let t3rates = null;
    await clearCart();
    const a3 = await addItem('bikini-shadow-azul-marino', 'M', 2);
    if (a3.status === 200) {
      const c3 = await cartInfo();
      t3rates = await estimate('Bogotá, D.C.', '110111');
      add('C06', '2 prendas (≥ 299.900) tienen envío gratis (T3)', 'total = 2 × precio; al menos una tarifa de precio 0',
        `${c3.total_cop} COP; ${fmt(t3rates)}`, c3.total_cop === a3.unit_cop * 2 && hasFree(t3rates) ? 'PASS' : (t3rates === null ? 'REVIEW' : 'FAIL'),
        a3.unit_cop * 2 === 319840 ? '' : `Total esperado 2 × ${a3.unit_cop}.`);
    } else {
      add('C06', '2 prendas (≥ 299.900) tienen envío gratis (T3)', '200 al agregar', `status ${a3.status}`, 'FAIL', 'Depende de C03/C04.');
    }
    await clearCart();
    const b1 = await addItem('brisa-natural-beige', 'S', 1);
    const b2 = await addItem('bikini-shadow-azul-marino', 'M', 1);
    if (b1.status === 200 && b2.status === 200) {
      const c4 = await cartInfo();
      const r4 = await estimate('Bogotá, D.C.', '110111');
      add('C07', '1 + 1 prendas mezcladas tienen envío gratis (T4)', 'total = suma de precios; al menos una tarifa de precio 0',
        `${c4.total_cop} COP; ${fmt(r4)}`, c4.total_cop === b1.unit_cop + b2.unit_cop && hasFree(r4) ? 'PASS' : (r4 === null ? 'REVIEW' : 'FAIL'));
    } else {
      add('C07', '1 + 1 prendas mezcladas tienen envío gratis (T4)', '200 al agregar', `status ${b1.status}/${b2.status}`, 'FAIL', 'Depende de C03/C04.');
    }

    // 5. T8: la zona es "país completo" (comparar con dos provincias remotas).
    await clearCart();
    const c8 = await addItem('bikini-shadow-azul-marino', 'M', 2);
    if (c8.status === 200) {
      const bog = await estimate('Bogotá, D.C.', '110111');
      const ama = await estimate('Amazonas', '');
      const sap = await estimate('San Andrés y Providencia', '');
      const same = (a, b) => Array.isArray(a) && Array.isArray(b) && JSON.stringify(a.map((r) => [r.name, r.price])) === JSON.stringify(b.map((r) => [r.name, r.price]));
      const eq = same(bog, ama) && same(bog, sap);
      add('C08', 'La zona cubre todo el país (T8)', 'mismas tarifas en Bogotá, Amazonas y San Andrés',
        `Bogotá ${fmt(bog)} · Amazonas ${fmt(ama)} · San Andrés ${fmt(sap)}`, eq ? 'PASS' : 'REVIEW',
        eq ? '' : 'Los nombres de provincia para Colombia son NOT_VERIFIED: si difieren, confirmar a mano en el checkout con la dueña.');
    } else {
      add('C08', 'La zona cubre todo el país (T8)', 'n/a', `status ${c8.status}`, 'FAIL', 'Depende de C03/C04.');
    }

    // 6. V7: idioma y dominio siguen vivos.
    const root = await getInfo('/');
    const en = await getInfo('/en');
    const langOk = root.status === 200 && en.status === 200 && root.lang === 'es' && String(en.lang || '').startsWith('en');
    add('C09', 'Rutas de idioma: / (es) y /en (en)', '200 es · 200 en', `${root.status} ${root.lang} · ${en.status} ${en.lang}`, langOk ? 'PASS' : 'FAIL',
      langOk ? '' : 'Si /en cambió, revertir el paso de mercado que lo causó (runbook de mercado, riesgo H6). Nota: 03G midió /en con textos en español (C8): eso no es este chequeo.');

    // 7. Visitante nuevo (sin cookies): la prueba central de "mercado por defecto".
    // Visitante nuevo = petición SIN cookies. Borrar la cookie `localization` NO sirve: medido en 03I, el país de la
    // sesión sigue guardado en el servidor y se obtiene un falso PASS. En una Dev Store con contraseña la petición sin
    // cookies devuelve la página de contraseña (país null) → REVIEW: lo mide la dueña en una ventana de incógnito.
    const fresh = await getInfo('/', { credentials: 'omit' });
    const visitorNote = 'Visitante nuevo = petición sin cookies. null = NOT_VERIFIED (página de contraseña): pedir a la dueña que abra una ventana de incógnito, desbloquee la tienda y escriba Shopify.country en la consola (F12).';
    if (OPTS.mode === 'AFTER') {
      add('C10', 'Visitante nuevo resuelve a CO', 'CO', String(fresh.country), fresh.country === 'CO' ? 'PASS' : fresh.country === null ? 'REVIEW' : 'FAIL', visitorNote);
    } else {
      add('C10', 'Visitante nuevo (solo registro en modo G1)', 'registro', String(fresh.country), 'INFO', visitorNote);
    }
  } catch (e) {
    interrupted = e;
    add('C99', 'Ejecución completa', 'sin interrupciones', e.rate ? 'Shopify limitó las peticiones (429)' : String(e.message), 'FAIL',
      e.rate ? 'Esperar 10–15 min y repetir; la sesión se restaura abajo (C11).' : 'Error inesperado; revisar el detalle.');
  } finally {
    // 8. Restaurar la sesión: carrito vacío y país original (con reintentos si Shopify limita las peticiones).
    let restored = false;
    for (let i = 0; i < 4 && !restored; i++) {
      try {
        await clearCart();
        await setCountry(original.country || 'US');
        const back = await getInfo('/');
        const cartEnd = await cartInfo();
        add('C11', 'Sesión restaurada', `país ${original.country} y carrito vacío`, `país ${back.country}, ${cartEnd.items} ítems`,
          back.country === original.country && cartEnd.items === 0 ? 'PASS' : 'FAIL');
        restored = true;
      } catch (e) { await sleep(OPTS.retryMs * (i + 1)); }
    }
    if (!restored) {
      add('C11', 'Sesión restaurada', `país ${original.country} y carrito vacío`, 'no se pudo restaurar (límite de peticiones)', 'FAIL',
        `Restaurar a mano cuando pase el límite: POST /localization con country_code=${original.country} y POST /cart/clear.js.`);
    }
  }

  const by = (id) => checks.find((c) => c.id === id);
  const st = (id) => (by(id) ? by(id).status : 'FAIL');
  const anyFail = checks.some((c) => c.status === 'FAIL');
  const anyReview = checks.some((c) => c.status === 'REVIEW');
  let verdict;
  if (interrupted) verdict = 'BLOCKED';
  else if (['C01', 'C03', 'C04'].some((id) => st(id) === 'FAIL')) verdict = 'A1_NOT_UNLOCKED';
  else if (anyFail) verdict = 'A1_PARTIAL';
  else if (anyReview) verdict = 'A1_UNLOCKED_REVIEW';
  else verdict = 'A1_UNLOCKED';
  return finish(verdict, { originalSession: original });
})()
