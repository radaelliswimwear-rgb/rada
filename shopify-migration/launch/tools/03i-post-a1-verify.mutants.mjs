// 03I — Mutantes de 03i-post-a1-verify.js: cada mutación DEBE hacer fallar la autoprueba.
// Uso: node launch/tools/03i-post-a1-verify.mutants.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '03i-post-a1-verify.js'), 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'a1mut-'));

const M = [
  ['M1 no restaura el país', "await setCountry(original.country || 'US');", '/* mutado */'],
  ['M2 no vacía el carrito al final', "        await clearCart();\n        await setCountry(original.country", "        await setCountry(original.country"],
  ['M3 abre el checkout', "home0 = await getInfo('/');", "home0 = await getInfo('/'); await F('/checkout');"],
  ['M4 catálogo sin exigir disponibilidad', 'availV === vars.length && vars.length > 0', 'vars.length > 0'],
  ['M5 pisa un carrito con ítems', 'if (cart0.items > 0) {', 'if (false) {'],
  ['M6 D2 desconocida acepta 0 tarifas', "else if (r1.length === 0) { st = 'FAIL';", "else if (r1.length === 0) { st = 'PASS';"],
  ['M7 exige visitante nuevo también en G1', "if (OPTS.mode === 'AFTER') {", 'if (true) {'],
  ['M8 ignora la gratuidad en T3', 'c3.total_cop === a3.unit_cop * 2 && hasFree(t3rates)', 'c3.total_cop === a3.unit_cop * 2'],
  ['M9 veredicto ignora FAIL parcial', 'else if (anyFail) verdict', 'else if (false) verdict'],
  ['M10 continúa con página de contraseña', 'if (home0.passwordPage || home0.country === null) {', 'if (false) {'],
  ['M11 no resuelve C01 en CO', "homeCO.country === 'CO' ? 'PASS' : 'FAIL',\n      homeCO.country === 'CO' ? ''", "'PASS',\n      homeCO.country === 'CO' ? ''"],
  ['M12 escribe con método PUT al Admin', "await setCountry('CO');", "await setCountry('CO'); await F('/admin/orders.json');"],
  ['M13 trata país nulo del visitante nuevo como PASS', "fresh.country === 'CO' ? 'PASS' : fresh.country === null ? 'REVIEW' : 'FAIL'", "'PASS'"],
  ['M14 ignora el 429 (lo trata como respuesta normal)', 'if (r.status === 429) {', 'if (false) {'],
  ['M15 no reintenta la restauración tras un 429', 'for (let i = 0; i < 4 && !restored; i++) {', 'for (let i = 0; i < 1 && !restored; i++) {'],
  ['M16 el catálogo traga el 429 como catálogo vacío', 'if (e.rate) throw e; list = [];', 'list = [];'],
];

let killed = 0;
for (const [name, from, to] of M) {
  if (!src.includes(from)) { console.log(`${name}: NO APLICA (texto original no encontrado)`); process.exitCode = 2; continue; }
  const f = path.join(tmp, 'mut.js');
  fs.writeFileSync(f, src.replace(from, to));
  const r = spawnSync(process.execPath, [path.join(here, '03i-post-a1-verify.selftest.mjs')], { env: { ...process.env, A1_SRC: f }, encoding: 'utf8' });
  const detected = r.status !== 0;
  if (detected) killed++;
  console.log(`${name}: ${detected ? 'DETECTADO' : 'SOBREVIVE'}`);
  if (!detected) process.exitCode = 1;
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nMutantes detectados: ${killed}/${M.length}`);
