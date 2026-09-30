// 03I — Evalúa OFFLINE los resultados del E2E de pagos de prueba (fase B1) contra lo esperado por
// payments/03F-wompi-owner-runbook.md § 9 (casos W1–W6, Wompi) y § 10 (casos T1–T3, TR, TC, pasarela de prueba de Shopify).
//
// Uso:
//   node launch/tools/03i-order-outcomes-check.mjs <resultados.json>
//   node launch/tools/03i-order-outcomes-check.mjs --selftest
// Entrada: plantilla en launch/tools/fixtures/03i-order-outcomes.template.json (todo null = NOT_RUN).
// SIN datos personales: nada de números de pedido, correos, nombres ni llaves; solo estados, moneda, montos y booleanos.
// Este script NO crea pedidos ni habla con Shopify/Wompi: solo compara lo que Claude lea del Admin y lo que reporte la dueña.
//
// Estados por caso: PASS · FAIL · RECORD (comportamiento NOT_VERIFIED que solo hay que anotar) · BLOCKING_RISK · NOT_RUN.
// Veredicto: B1_E2E_VALIDATED | B1_E2E_VALIDATED_WITH_RECORDS | B1_E2E_PARTIAL | B1_E2E_FAILED | B1_E2E_BLOCKING_RISK.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED = { wompi: ['W1', 'W2', 'W3', 'W4a', 'W5'], testgateway: ['T1', 'T2', 'T3', 'TR', 'TC'] };
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export function evaluate(input) {
  const path_ = input.path;
  if (!REQUIRED[path_]) throw new Error(`path desconocido: ${path_}`);
  const total = input.expectedCartTotalCop;
  const cases = input.cases || {};
  const res = [];
  const put = (id, name, status, detail) => res.push({ id, name, status, detail: detail || '' });
  const has = (c) => c && Object.values(c).some((v) => v !== null && v !== undefined);

  const paidOrder = (c) => {
    if (c.orderCreated !== true) return ['FAIL', 'no se creó el pedido'];
    if (c.financialStatus !== 'paid') return ['FAIL', `estado de pago ${c.financialStatus} (esperado paid)`];
    if (c.currency !== 'COP') return ['FAIL', `moneda ${c.currency} (esperado COP)`];
    if (!isNum(c.amountCop) || c.amountCop !== total) return ['FAIL', `monto ${c.amountCop} ≠ total del carrito ${total}`];
    return ['PASS', ''];
  };
  const noOrder = (c) => (c.orderCreated === false ? ['PASS', ''] : c.orderCreated === true ? ['BLOCKING_RISK', 'un pago rechazado/fallido creó un pedido'] : ['NOT_RUN', '']);

  if (path_ === 'wompi') {
    const w1 = cases.W1;
    if (!has(w1)) put('W1', 'Éxito: pedido Pagado en COP con el monto del carrito', 'NOT_RUN');
    else {
      let [s, d] = paidOrder(w1);
      if (s === 'PASS') {
        if (w1.gatewayStatus !== 'APPROVED') [s, d] = ['FAIL', `Wompi ${w1.gatewayStatus} (esperado APPROVED)`];
        else if (isNum(w1.gatewayAmountCents) && w1.gatewayAmountCents !== w1.amountCop * 100) [s, d] = ['FAIL', `Wompi ${w1.gatewayAmountCents} centavos ≠ ${w1.amountCop} × 100`];
        else if (w1.confirmationEmail === null || w1.confirmationEmail === undefined) [s, d] = ['RECORD', 'correo de confirmación sin anotar'];
      }
      put('W1', 'Éxito: pedido Pagado en COP con el monto del carrito', s, d);
    }
    const w2 = cases.W2;
    if (!has(w2)) put('W2', 'Falla: sin pedido, mensaje a la clienta, DECLINED/ERROR en Wompi', 'NOT_RUN');
    else {
      let [s, d] = noOrder(w2);
      if (s === 'PASS') {
        if (!['DECLINED', 'ERROR'].includes(w2.gatewayStatus)) [s, d] = ['FAIL', `Wompi ${w2.gatewayStatus} (esperado DECLINED o ERROR)`];
        else if (w2.customerMessage === '') [s, d] = ['FAIL', 'la clienta no vio un mensaje de error'];
        else if (w2.customerMessage == null) [s, d] = ['RECORD', 'mensaje a la clienta sin anotar'];
        else if (w2.abandonedCheckout === null || w2.abandonedCheckout === undefined) [s, d] = ['RECORD', 'queda o no en Checkouts abandonados: sin anotar'];
      }
      put('W2', 'Falla: sin pedido, mensaje a la clienta, DECLINED/ERROR en Wompi', s, d);
    }
    const w3 = cases.W3;
    if (!has(w3)) put('W3', 'Pendiente: registrar qué ocurre (NOT_VERIFIED en la doc)', 'NOT_RUN');
    else {
      const seen = w3.orderCreated === true ? `pedido creado con pago ${w3.financialStatus}` : w3.orderCreated === false ? 'sin pedido mientras está pendiente' : null;
      put('W3', 'Pendiente: registrar qué ocurre (NOT_VERIFIED en la doc)', seen ? 'RECORD' : 'NOT_RUN', seen || '');
    }
    for (const [id, name, want] of [['W4a', 'Reembolso total', 'refunded'], ['W4b', 'Reembolso parcial', 'partially_refunded']]) {
      const c = cases[id];
      if (!has(c)) { put(id, name, 'NOT_RUN'); continue; }
      if (c.financialStatus !== want) put(id, name, 'FAIL', `estado ${c.financialStatus} (esperado ${want})`);
      else if (c.gatewayRefundSeen === false) put(id, name, 'BLOCKING_RISK', 'Shopify dice reembolsado pero Wompi no muestra reembolso');
      else if (c.gatewayRefundSeen === null || c.gatewayRefundSeen === undefined) put(id, name, 'RECORD', 'si el reembolso llega a Wompi: sin anotar');
      else put(id, name, 'PASS');
    }
    const w5 = cases.W5;
    if (!has(w5)) put('W5', 'La clienta no vuelve: el pedido aparece igual', 'NOT_RUN');
    else if (w5.gatewayStatus === 'APPROVED' && w5.orderCreated === false) put('W5', 'La clienta no vuelve: el pedido aparece igual', 'BLOCKING_RISK', 'cobro APPROVED en Wompi y ningún pedido en Shopify (cobro sin pedido)');
    else if (w5.orderCreated === true) put('W5', 'La clienta no vuelve: el pedido aparece igual', isNum(w5.minutesToOrder) ? 'PASS' : 'RECORD', isNum(w5.minutesToOrder) ? `apareció a los ${w5.minutesToOrder} min` : 'minutos hasta el pedido sin anotar');
    else put('W5', 'La clienta no vuelve: el pedido aparece igual', 'NOT_RUN');
    const w6 = cases.W6;
    if (!has(w6)) put('W6', 'Duplicados (opcional): un pedido y un cobro', 'NOT_RUN', 'opcional');
    else if (w6.orders > 1 || w6.charges > 1) put('W6', 'Duplicados (opcional): un pedido y un cobro', 'BLOCKING_RISK', `pedidos=${w6.orders}, cobros=${w6.charges}`);
    else put('W6', 'Duplicados (opcional): un pedido y un cobro', w6.orders === 1 && w6.charges === 1 ? 'PASS' : 'NOT_RUN');
  } else {
    const t1 = cases.T1;
    if (!has(t1)) put('T1', 'Tarjeta 1: pedido Pagado en COP con el monto del carrito', 'NOT_RUN');
    else { const [s, d] = paidOrder(t1); put('T1', 'Tarjeta 1: pedido Pagado en COP con el monto del carrito', s, d); }
    for (const [id, name] of [['T2', 'Tarjeta 2: pago rechazado, sin pedido'], ['T3', 'Tarjeta 3: falla de pasarela, sin pedido']]) {
      const c = cases[id];
      if (!has(c)) { put(id, name, 'NOT_RUN'); continue; }
      const [s, d] = noOrder(c);
      // '' = se miró y no había mensaje (FALLA); null/undefined = el mensaje no se observó (solo se anota).
      const seen = c.customerMessage === '' ? 'FAIL' : c.customerMessage == null ? 'RECORD' : null;
      put(id, name, s === 'PASS' && seen ? seen : s, s === 'PASS' && seen === 'FAIL' ? 'la clienta no vio un mensaje de error' : s === 'PASS' && seen === 'RECORD' ? 'mensaje a la clienta sin anotar' : d);
    }
    const tr = cases.TR;
    if (!has(tr)) put('TR', 'Reembolso total del pedido de T1', 'NOT_RUN');
    else put('TR', 'Reembolso total del pedido de T1', tr.financialStatus === 'refunded' ? 'PASS' : 'FAIL', tr.financialStatus === 'refunded' ? '' : `estado ${tr.financialStatus}`);
    const tc = cases.TC;
    if (!has(tc)) put('TC', 'Sin comisión de transacción por pedido de prueba', 'NOT_RUN');
    else put('TC', 'Sin comisión de transacción por pedido de prueba', tc.feeCharged === false ? 'PASS' : 'FAIL', tc.feeCharged === false ? '' : 'se cobró comisión: parar y revisar (regla R3, sin facturación)');
  }

  const req = REQUIRED[path_];
  const st = (id) => res.find((r) => r.id === id)?.status;
  let verdict;
  if (res.some((r) => r.status === 'BLOCKING_RISK')) verdict = 'B1_E2E_BLOCKING_RISK';
  else if (res.some((r) => r.status === 'FAIL')) verdict = 'B1_E2E_FAILED';
  else if (req.some((id) => st(id) === 'NOT_RUN')) verdict = 'B1_E2E_PARTIAL';
  else if (res.some((r) => r.status === 'RECORD')) verdict = 'B1_E2E_VALIDATED_WITH_RECORDS';
  else verdict = 'B1_E2E_VALIDATED';
  return { path: path_, verdict, synthetic: input.synthetic === true, cases: res };
}

function print(r) {
  if (r.synthetic) console.log('*** SINTÉTICO — NO ES EVIDENCIA (fixture de la autoprueba) ***');
  for (const c of r.cases) console.log(`${c.status.padEnd(13)} ${c.id.padEnd(4)} ${c.name}${c.detail ? ' — ' + c.detail : ''}`);
  console.log(`VEREDICTO: ${r.verdict}`);
}

function selftest() {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL:', m); } };
  const T = 199920;
  const wompiGood = () => ({
    synthetic: true, path: 'wompi', expectedCartTotalCop: T,
    cases: {
      W1: { orderCreated: true, financialStatus: 'paid', currency: 'COP', amountCop: T, gatewayStatus: 'APPROVED', gatewayAmountCents: T * 100, confirmationEmail: true },
      W2: { orderCreated: false, gatewayStatus: 'DECLINED', customerMessage: 'Pago rechazado', abandonedCheckout: true },
      W3: { orderCreated: true, financialStatus: 'pending', gatewayStatus: 'PENDING' },
      W4a: { financialStatus: 'refunded', gatewayRefundSeen: true },
      W4b: { financialStatus: 'partially_refunded', gatewayRefundSeen: true },
      W5: { gatewayStatus: 'APPROVED', orderCreated: true, minutesToOrder: 2 },
      W6: { orders: 1, charges: 1 },
    },
  });
  const tgGood = () => ({
    synthetic: true, path: 'testgateway', expectedCartTotalCop: T,
    cases: {
      T1: { orderCreated: true, financialStatus: 'paid', currency: 'COP', amountCop: T },
      T2: { orderCreated: false, customerMessage: 'Rechazado' },
      T3: { orderCreated: false, customerMessage: 'Falla de pasarela' },
      TR: { financialStatus: 'refunded' },
      TC: { feeCharged: false },
    },
  });
  const v = (i) => evaluate(i).verdict;
  const st = (i, id) => evaluate(i).cases.find((c) => c.id === id).status;
  const mod = (base, fn) => { const x = base(); fn(x); return x; };

  ok(v(wompiGood()) === 'B1_E2E_VALIDATED_WITH_RECORDS', 'wompi bueno → validado con registros (W3 es RECORD)');
  ok(v(tgGood()) === 'B1_E2E_VALIDATED', 'pasarela de prueba buena → validado');
  ok(v(mod(wompiGood, (x) => { x.cases.W5 = { gatewayStatus: 'APPROVED', orderCreated: false }; })) === 'B1_E2E_BLOCKING_RISK', 'cobro sin pedido → riesgo bloqueante');
  ok(v(mod(wompiGood, (x) => { x.cases.W2.orderCreated = true; })) === 'B1_E2E_BLOCKING_RISK', 'rechazado con pedido → riesgo bloqueante');
  ok(v(mod(wompiGood, (x) => { x.cases.W4a.gatewayRefundSeen = false; })) === 'B1_E2E_BLOCKING_RISK', 'reembolsado en Shopify pero no en Wompi → riesgo bloqueante');
  ok(v(mod(wompiGood, (x) => { x.cases.W6 = { orders: 2, charges: 2 }; })) === 'B1_E2E_BLOCKING_RISK', 'duplicados → riesgo bloqueante');
  ok(v(mod(wompiGood, (x) => { x.cases.W1.currency = 'USD'; })) === 'B1_E2E_FAILED', 'moneda distinta de COP → falla');
  ok(v(mod(wompiGood, (x) => { x.cases.W1.amountCop = T + 1; })) === 'B1_E2E_FAILED', 'monto distinto del carrito → falla');
  ok(v(mod(wompiGood, (x) => { x.cases.W1.gatewayAmountCents = T * 100 + 100; })) === 'B1_E2E_FAILED', 'centavos de Wompi no coinciden → falla');
  ok(v(mod(wompiGood, (x) => { x.cases.W1.financialStatus = 'pending'; })) === 'B1_E2E_FAILED', 'éxito sin estado Pagado → falla');
  ok(v(mod(wompiGood, (x) => { x.cases.W2.customerMessage = ''; })) === 'B1_E2E_FAILED', 'falla sin mensaje a la clienta → falla');
  ok(st(mod(tgGood, (x) => { x.cases.T3.customerMessage = null; }), 'T3') === 'RECORD', 'mensaje no observado en T3 → RECORD (no falla)');
  ok(v(mod(tgGood, (x) => { x.cases.T3.customerMessage = ''; })) === 'B1_E2E_FAILED', 'T3 sin mensaje (visto vacío) → falla');
  ok(v(mod(wompiGood, (x) => { delete x.cases.W5; })) === 'B1_E2E_PARTIAL', 'falta W5 (requerido) → parcial');
  ok(v(mod(wompiGood, (x) => { delete x.cases.W6; delete x.cases.W4b; })) === 'B1_E2E_VALIDATED_WITH_RECORDS', 'faltan solo casos opcionales → no es parcial');
  ok(st(mod(wompiGood, (x) => { x.cases.W1.confirmationEmail = null; }), 'W1') === 'RECORD', 'correo sin anotar → RECORD');
  ok(st(mod(wompiGood, (x) => { x.cases.W3 = { orderCreated: false, gatewayStatus: 'PENDING' }; }), 'W3') === 'RECORD', 'pendiente sin pedido → RECORD (se anota)');
  ok(v(mod(tgGood, (x) => { x.cases.TC.feeCharged = true; })) === 'B1_E2E_FAILED', 'comisión cobrada → falla');
  ok(v(mod(tgGood, (x) => { x.cases.T2.orderCreated = true; })) === 'B1_E2E_BLOCKING_RISK', 'tarjeta 2 con pedido → riesgo bloqueante');
  ok(v(mod(tgGood, (x) => { x.cases.TR.financialStatus = 'paid'; })) === 'B1_E2E_FAILED', 'reembolso sin efecto → falla');
  ok(v(mod(tgGood, (x) => { x.cases.TR = { financialStatus: null }; })) === 'B1_E2E_PARTIAL', 'reembolso sin correr → parcial');
  ok(v({ path: 'testgateway', expectedCartTotalCop: T, cases: {} }) === 'B1_E2E_PARTIAL', 'plantilla vacía → parcial');
  let threw = false;
  try { evaluate({ path: 'otro', cases: {} }); } catch { threw = true; }
  ok(threw, 'path desconocido debe lanzar error');
  ok(evaluate(wompiGood()).synthetic === true, 'el fixture se marca sintético');

  console.log(`03i-order-outcomes-check selftest: ${pass} PASS / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) selftest();
  else if (!args[0]) { console.log('Uso: node 03i-order-outcomes-check.mjs <resultados.json> | --selftest'); process.exit(2); }
  else {
    const r = evaluate(JSON.parse(fs.readFileSync(args[0], 'utf8')));
    print(r);
    process.exit(['B1_E2E_FAILED', 'B1_E2E_BLOCKING_RISK'].includes(r.verdict) ? 1 : 0);
  }
}
