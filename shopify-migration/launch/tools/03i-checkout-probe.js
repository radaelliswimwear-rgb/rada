// 03I — Sonda de SOLO LECTURA para la pantalla del checkout (New Checkout de Shopify).
//
// CÓMO SE USA: con 1 ítem en el carrito, Claude navega la pestaña a /checkout (los `fetch` al checkout dan 403:
// medido en 03G, se lee por navegación) y pega este script ANTES de que nadie escriba nada. Devuelve un objeto
// corto que se guarda como JSON y se evalúa offline con 03i-checkout-text-check.mjs.
//
// NO hace clic, NO escribe en ningún campo, NO envía formularios, NO crea pedidos. El token de la URL del checkout
// NUNCA se copia: solo se devuelve el sufijo de idioma-país (p. ej. "es-co"). Se enmascaran correos y números largos.
(() => {
  const mask = (s) => String(s || '').replace(/\S+@\S+/g, '[email]').replace(/\d{9,}/g, '[num]').replace(/\s+/g, ' ').trim();
  const body = document.body ? document.body.innerText : '';
  const path = location.pathname;
  const opt = (sel, n) => {
    const el = document.querySelector(sel);
    return el ? [...el.options].slice(0, n).map((o) => mask(o.text)) : null;
  };
  const sel = (name) => {
    const el = document.querySelector(`select[name="${name}"]`);
    return el && el.selectedOptions[0] ? mask(el.selectedOptions[0].text) : null;
  };
  // Texto de la sección de pago: desde la línea "Pago" hasta ~400 caracteres (sin datos personales: aún no se escribió nada).
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const iPay = lines.lastIndexOf('Pago');
  const iShip = lines.indexOf('Métodos de envío');
  const seg = (i, n) => (i >= 0 ? mask(lines.slice(i, i + n).join(' | ')).slice(0, 400) : null);
  return {
    tool: '03i-checkout-probe',
    isCheckoutPath: /^\/checkouts\/cn\//.test(path),
    suffix: (path.match(/\/([a-z]{2}-[a-z]{2})\/?$/i) || [])[1] ?? null,
    htmlLang: document.documentElement.lang || null,
    country: sel('countryCode'),
    provincesSample: opt('select[name="zone"]', 40),
    amounts: (body.match(/(?:COP\s?)?\$\s?[\d.,]+/g) || []).slice(0, 8),
    noPayments: /no puede aceptar pagos/i.test(body),
    cardFields: !!document.querySelector('iframe[name^="card-fields"], iframe[title*="tarjeta" i], iframe[title*="card" i]'),
    shippingText: seg(iShip, 3),
    paymentText: seg(iPay, 12),
  };
})()
