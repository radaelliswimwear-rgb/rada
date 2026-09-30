// 03G - Insumo del plan de rollback (launch/03G-rollback-plan.md).
// Compara, SOLO EN LECTURA y sin red, los manifiestos de release de los themes
// RC1.7 y RC1.8 y verifica que el SHA-256 de cada ZIP coincide con su manifiesto.
// No escribe nada. Salida determinista por stdout.
// Uso: node launch/tools/03g-rollback-theme-diff.mjs   (desde shopify-migration/)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(resolve(root, p));
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

const releases = ['rc1.7', 'rc1.8'];
const manifests = {};
for (const r of releases) {
  const m = JSON.parse(read(`dist/release-manifest-${r}.json`).toString('utf8'));
  const zipBuf = read(`dist/radaelli-shopify-theme-${r}.zip`);
  const zipSha = sha(zipBuf);
  manifests[r] = m;
  console.log(`${r}: archivos=${m.totalFiles} zipBytes=${zipBuf.length} zipSha256=${zipSha}`);
  console.log(`  manifiesto.sha256 = ${m.zip.sha256}  ->  ${zipSha === m.zip.sha256 ? 'COINCIDE' : 'NO COINCIDE'}`);
}

const byPath = (m) => new Map(m.files.map((f) => [f.path, f.sha256]));
const a = byPath(manifests['rc1.7']);
const b = byPath(manifests['rc1.8']);
const all = [...new Set([...a.keys(), ...b.keys()])].sort();
const changed = [];
const onlyA = [];
const onlyB = [];
for (const p of all) {
  if (!a.has(p)) onlyB.push(p);
  else if (!b.has(p)) onlyA.push(p);
  else if (a.get(p) !== b.get(p)) changed.push(p);
}
console.log('');
console.log(`Archivos distintos entre RC1.7 y RC1.8: ${changed.length}`);
for (const p of changed) console.log(`  M ${p}`);
console.log(`Solo en RC1.7: ${onlyA.length}${onlyA.length ? ' -> ' + onlyA.join(', ') : ''}`);
console.log(`Solo en RC1.8: ${onlyB.length}${onlyB.length ? ' -> ' + onlyB.join(', ') : ''}`);
console.log(`Archivos iguales: ${all.length - changed.length - onlyA.length - onlyB.length}`);
console.log('');
console.log(`baseline RC1.8: ${manifests['rc1.8'].baseline}`);
