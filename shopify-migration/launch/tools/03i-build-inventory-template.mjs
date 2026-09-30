// 03I — Genera import/inventory-template.csv: la hoja que la dueña completa para D2 (inventario).
// Solo lectura de archivos locales (import/shopify-products-03c.csv y catalog/variants-master.csv); no toca Shopify,
// Neon ni el sitio actual. Determinista: mismo insumo → mismo archivo (se imprime el SHA-256).
// Uso: node launch/tools/03i-build-inventory-template.mjs           (escribe y verifica)
//      node launch/tools/03i-build-inventory-template.mjs --check   (solo verifica que el archivo actual coincide)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8').replace(/^﻿/, '');

// Parser CSV RFC 4180 mínimo (campos entre comillas con comas, comillas dobles y saltos de línea).
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((x) => x !== '')) rows.push(row); }
  return rows;
}
const table = (text) => { const [h, ...r] = parseCsv(text); return r.map((x) => Object.fromEntries(h.map((k, i) => [k, x[i] ?? '']))); };
const esc = (v) => (/[",\n\r]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

const imp = table(read('import/shopify-products-03c.csv'));
const vm = table(read('catalog/variants-master.csv'));
// Tallas que muestra HOY el sitio actual por producto (rastreo de 03G): la XL de alba-dorada-cafe-claro no aparece (F-01).
const parity = table(read('launch/03G-product-parity.csv'));
const sizesNow = new Map(parity.map((p) => [p.shopify_handle, String(p.sizes_current).split(/[|,;/]+/).map((x) => x.trim()).filter(Boolean)]));
const site = new Map(vm.map((v) => [v.variant_identifier, /InStock|Disponible/i.test(v.migration_notes) ? 'Disponible' : /OutOfStock|Agotado/i.test(v.migration_notes) ? 'Agotado' : 'SIN DATO']));

let handle = '', title = '';
const out = [];
for (const r of imp) {
  if (r['URL handle']) handle = r['URL handle'];
  if (r['Title']) title = r['Title'];
  const sku = r['SKU'];
  if (!sku) continue; // filas solo de imagen
  const sizes = sizesNow.get(handle) || [];
  const inSite = site.has(sku) && sizes.includes(r['Option1 value']);
  out.push({
    sku, handle, producto: title, talla: r['Option1 value'], precio_cop: r['Price'],
    disponible_sitio_actual_2026_09_28: inSite ? site.get(sku) : 'NO SE MUESTRA HOY EN EL SITIO ACTUAL',
    cantidad_a_cargar: '',
    nota: inSite ? '' : 'D1: el sitio actual no muestra esta talla; confirmar si existe antes de cargar inventario',
  });
}

const header = ['sku', 'handle', 'producto', 'talla', 'precio_cop', 'disponible_sitio_actual_2026_09_28', 'cantidad_a_cargar', 'nota'];
const csv = '﻿' + [header.join(','), ...out.map((o) => header.map((k) => esc(o[k])).join(','))].join('\r\n') + '\r\n';
const sha = crypto.createHash('sha256').update(csv).digest('hex');

// Verificaciones.
const problems = [];
if (out.length !== 98) problems.push(`se esperaban 98 variantes y hay ${out.length}`);
if (new Set(out.map((o) => o.sku)).size !== out.length) problems.push('SKU repetidos');
if (new Set(out.map((o) => o.handle)).size !== 29) problems.push(`se esperaban 29 productos y hay ${new Set(out.map((o) => o.handle)).size}`);
const flagged = out.filter((o) => o.nota);
if (flagged.length !== 1 || flagged[0].sku !== 'LG-AUR-000001-XL') problems.push(`la única fila marcada debía ser la XL de alba-dorada-cafe-claro y hay ${flagged.map((f) => f.sku)}`);
if (out.some((o) => o.cantidad_a_cargar !== '')) problems.push('la hoja no debe traer cantidades inventadas');

const target = path.join(root, 'import', 'inventory-template.csv');
if (process.argv.includes('--check')) {
  const same = fs.existsSync(target) && fs.readFileSync(target, 'utf8') === csv;
  if (!same) problems.push('import/inventory-template.csv no coincide con lo generado');
} else if (!problems.length) fs.writeFileSync(target, csv);

console.log(`variantes=${out.length} productos=${new Set(out.map((o) => o.handle)).size} disponibles_sitio=${out.filter((o) => o.disponible_sitio_actual_2026_09_28 === 'Disponible').length} agotadas_sitio=${out.filter((o) => o.disponible_sitio_actual_2026_09_28 === 'Agotado').length} sin_dato=${out.filter((o) => o.disponible_sitio_actual_2026_09_28 !== 'Disponible' && o.disponible_sitio_actual_2026_09_28 !== 'Agotado').length}`);
console.log(`sha256=${sha}`);
if (problems.length) { console.log('PROBLEMAS:\n - ' + problems.join('\n - ')); process.exit(1); }
console.log(process.argv.includes('--check') ? 'OK: el archivo actual coincide' : 'OK: import/inventory-template.csv escrito');
