// 03I — Evalúa OFFLINE el JSON que devuelve 03i-checkout-probe.js contra lo esperado después de A1 o de B1.
//
// Uso:
//   node launch/tools/03i-checkout-text-check.mjs <probe.json> --expect after-a1
//   node launch/tools/03i-checkout-text-check.mjs <probe.json> --expect after-b1-testgateway
//   node launch/tools/03i-checkout-text-check.mjs <probe.json> --expect after-b1-wompi
//   node launch/tools/03i-checkout-text-check.mjs --selftest
// Salida: una línea por chequeo (PASS / FAIL / REVIEW) y el veredicto. Código de salida 1 si hay algún FAIL.
// Un JSON con "synthetic": true se rotula "SINTÉTICO — NO ES EVIDENCIA" y nunca cuenta como medición.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CO_DEPTS = ['Antioquia', 'Amazonas', 'Cundinamarca', 'Bogotá', 'Valle del Cauca', 'Atlántico'];
const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'California', 'Florida', 'Texas'];

export function evaluate(probe, expectation) {
  const out = [];
  const add = (id, name, status, detail) => out.push({ id, name, status, detail: detail || '' });
  const expA1 = ['after-a1', 'after-b1-testgateway', 'after-b1-wompi'].includes(expectation);
  if (!expA1) throw new Error(`--expect desconocido: ${expectation}`);

  // Bloque A1 (siempre): el checkout representa a una clienta colombiana.
  add('K0', 'Es la pantalla real del checkout', probe.isCheckoutPath ? 'PASS' : 'FAIL', `isCheckoutPath=${probe.isCheckoutPath}`);
  add('K1', 'Ruta con sufijo es-co', probe.suffix === 'es-co' ? 'PASS' : 'FAIL', `sufijo=${probe.suffix}`);
  add('K2', 'País de entrega = Colombia', probe.country === 'Colombia' ? 'PASS' : 'FAIL', `país=${probe.country}`);
  if (Array.isArray(probe.provincesSample)) {
    const co = probe.provincesSample.some((p) => CO_DEPTS.some((d) => p.includes(d)));
    const us = probe.provincesSample.some((p) => US_STATES.includes(p));
    add('K3', 'Departamentos de Colombia (no estados de EE. UU.)', co && !us ? 'PASS' : 'FAIL', `muestra=${probe.provincesSample.slice(0, 4).join(', ')}…`);
  } else {
    add('K3', 'Departamentos de Colombia (no estados de EE. UU.)', 'REVIEW', 'la sonda no trajo la lista de departamentos');
  }
  const amounts = probe.amounts || [];
  if (amounts.length) {
    // Formato es-co MEDIDO en 03J: "$ 319.840,00" (punto de miles y coma decimal). El de EE. UU. medido en 03G: "COP $183,920.00".
    const us = amounts.some((a) => /\d,\d{3}/.test(a) || /\.\d{2}(?!\d)/.test(a));
    const co = amounts.every((a) => /\$\s?\d{1,3}(\.\d{3})+(,\d{2})?(?![\d.,])/.test(a));
    add('K4', 'Importes en formato colombiano ("$ 319.840,00": punto de miles y coma decimal)', co && !us ? 'PASS' : 'FAIL', `importes=${amounts.slice(0, 3).join(' · ').replace(/\n/g, ' ')}`);
  } else {
    add('K4', 'Importes en formato colombiano ("$ 319.840,00": punto de miles y coma decimal)', 'REVIEW', 'la sonda no trajo importes');
  }

  // Bloque de pagos.
  if (expectation === 'after-a1') {
    add('K5', 'Pagos siguen sin proveedor (A1 no activa pagos)', probe.noPayments ? 'PASS' : 'REVIEW', `noPayments=${probe.noPayments}: si ya hay proveedor, se pasó a la fase B1`);
  } else {
    add('K5', 'Ya no dice "no puede aceptar pagos"', probe.noPayments === false ? 'PASS' : 'FAIL', `noPayments=${probe.noPayments}`);
    const t = String(probe.paymentText || '');
    if (expectation === 'after-b1-wompi') {
      add('K6', 'La sección de pago ofrece Wompi', /wompi/i.test(t) ? 'PASS' : 'FAIL', t.slice(0, 120));
    } else {
      const testish = /prueba|bogus|test/i.test(t) || probe.cardFields === true;
      add('K6', 'La sección de pago ofrece la pasarela de prueba (o campos de tarjeta)', testish ? 'PASS' : 'FAIL', t.slice(0, 120) + ` cardFields=${probe.cardFields}`);
    }
  }
  const verdict = out.some((c) => c.status === 'FAIL') ? 'CHECKOUT_NOT_AS_EXPECTED' : out.some((c) => c.status === 'REVIEW') ? 'CHECKOUT_OK_WITH_REVIEW' : 'CHECKOUT_AS_EXPECTED';
  return { verdict, checks: out, synthetic: probe.synthetic === true };
}

function print(res) {
  if (res.synthetic) console.log('*** SINTÉTICO — NO ES EVIDENCIA (fixture de la autoprueba) ***');
  for (const c of res.checks) console.log(`${c.status.padEnd(6)} ${c.id} ${c.name}${c.detail ? ' — ' + c.detail : ''}`);
  console.log(`VEREDICTO: ${res.verdict}`);
}

function selftest() {
  const fx = (n) => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', n), 'utf8'));
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL:', m); } };
  const st = (r, id) => r.checks.find((c) => c.id === id)?.status;

  // Control negativo con lo MEDIDO en 03G (checkout con país US): after-a1 debe fallar en K1, K2 y K4.
  const us = evaluate(fx('03i-checkout-us-baseline.json'), 'after-a1');
  ok(us.verdict === 'CHECKOUT_NOT_AS_EXPECTED', 'baseline US debe fallar after-a1');
  ok(st(us, 'K1') === 'FAIL' && st(us, 'K2') === 'FAIL' && st(us, 'K4') === 'FAIL', 'baseline US: K1/K2/K4 deben fallar');
  ok(st(us, 'K3') === 'REVIEW', 'baseline US: K3 sin lista → REVIEW');
  ok(st(us, 'K5') === 'PASS', 'baseline US: hoy no hay proveedor de pago (K5 PASS)');
  ok(us.synthetic === false, 'baseline US es medición, no sintético');

  // Positivos MEDIDOS en 03J (checkout real de Colombia, sin datos personales).
  const evd = (n) => JSON.parse(fs.readFileSync(path.join(here, '..', 'evidence', n), 'utf8'));
  const m1 = evaluate(evd('03J-checkout-probe-after-a1.json'), 'after-a1');
  ok(m1.verdict === 'CHECKOUT_AS_EXPECTED' && m1.synthetic === false, 'medición 03J tras A1 debe cumplir after-a1');
  const m2 = evaluate(evd('03J-checkout-probe-after-b1a.json'), 'after-b1-testgateway');
  ok(m2.verdict === 'CHECKOUT_AS_EXPECTED' && m2.synthetic === false, 'medición 03J tras B1a debe cumplir after-b1-testgateway');
  ok(evaluate(evd('03J-checkout-probe-after-a1.json'), 'after-b1-testgateway').verdict === 'CHECKOUT_NOT_AS_EXPECTED', 'checkout sin proveedor no debe pasar after-b1-testgateway');

  // Positivos SINTÉTICOS.
  const a1 = evaluate(fx('03i-checkout-after-a1.synthetic.json'), 'after-a1');
  ok(a1.verdict === 'CHECKOUT_AS_EXPECTED' && a1.synthetic === true, 'positivo sintético after-a1');
  const tg = evaluate(fx('03i-checkout-after-b1-testgateway.synthetic.json'), 'after-b1-testgateway');
  ok(tg.verdict === 'CHECKOUT_AS_EXPECTED', 'positivo sintético after-b1-testgateway');
  const wp = evaluate(fx('03i-checkout-after-b1-wompi.synthetic.json'), 'after-b1-wompi');
  ok(wp.verdict === 'CHECKOUT_AS_EXPECTED', 'positivo sintético after-b1-wompi');

  // Mutantes de datos: cada alteración debe romper el veredicto.
  const mut = (base, patch, exp, id) => {
    const r = evaluate({ ...fx(base), ...patch }, exp);
    ok(st(r, id) === 'FAIL', `mutante ${id} sobre ${base}: ${JSON.stringify(patch)}`);
  };
  mut('03i-checkout-after-a1.synthetic.json', { suffix: 'es-us' }, 'after-a1', 'K1');
  mut('03i-checkout-after-a1.synthetic.json', { country: 'Estados Unidos' }, 'after-a1', 'K2');
  mut('03i-checkout-after-a1.synthetic.json', { provincesSample: ['Alabama', 'Alaska', 'Arizona'] }, 'after-a1', 'K3');
  mut('03i-checkout-after-a1.synthetic.json', { amounts: ['COP $199,920.00'] }, 'after-a1', 'K4');
  mut('03i-checkout-after-a1.synthetic.json', { amounts: ['$ 199.920.00'] }, 'after-a1', 'K4');
  mut('03i-checkout-after-a1.synthetic.json', { isCheckoutPath: false }, 'after-a1', 'K0');
  mut('03i-checkout-after-b1-testgateway.synthetic.json', { noPayments: true }, 'after-b1-testgateway', 'K5');
  mut('03i-checkout-after-b1-testgateway.synthetic.json', { paymentText: 'Pago | Nada disponible', cardFields: false }, 'after-b1-testgateway', 'K6');
  mut('03i-checkout-after-b1-wompi.synthetic.json', { paymentText: 'Pago | Tarjeta de crédito' }, 'after-b1-wompi', 'K6');
  // Un checkout ya con pago no debe confundirse con "solo A1" sin avisar.
  const mixed = evaluate(fx('03i-checkout-after-b1-testgateway.synthetic.json'), 'after-a1');
  ok(st(mixed, 'K5') === 'REVIEW', 'checkout con pago evaluado como after-a1 → K5 REVIEW');
  let threw = false;
  try { evaluate({}, 'otra'); } catch { threw = true; }
  ok(threw, 'expectativa desconocida debe lanzar error');

  console.log(`03i-checkout-text-check selftest: ${pass} PASS / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) selftest();
  else {
    const file = args.find((a) => !a.startsWith('--'));
    const exp = args[args.indexOf('--expect') + 1];
    if (!file || !exp) { console.log('Uso: node 03i-checkout-text-check.mjs <probe.json> --expect after-a1|after-b1-testgateway|after-b1-wompi | --selftest'); process.exit(2); }
    const res = evaluate(JSON.parse(fs.readFileSync(file, 'utf8')), exp);
    print(res);
    process.exit(res.verdict === 'CHECKOUT_NOT_AS_EXPECTED' ? 1 : 0);
  }
}
