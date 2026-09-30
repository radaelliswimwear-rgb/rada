// 03D: extrae VERBATIM el contenido legal que sirve hoy radaelliswimwear.com
// (HTML ya renderizado, con el umbral real resuelto) y lo deja listo para
// pegar en Shopify. Cambios permitidos y registrados:
//  - se quita el <p>Última actualización: ...</p> (fecha del render, no real);
//  - se quitan clases CSS, comentarios de React y los <section> contenedores;
//  - se quita el <button> de preferencias de cookies (depende de lib/consent);
//  - se remapean los href internos a las rutas de Shopify.
// Verificación: el texto normalizado de salida == texto normalizado del
// contenido original (menos el botón). Si no coincide, aborta.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DIR = path.join(__dirname, 'legal-live');
const OUT = path.join(__dirname, 'legal-shopify');
fs.mkdirSync(OUT, { recursive: true });

const LINKS = {
  '/devoluciones': '/policies/refund-policy',
  '/garantia': '/pages/garantia',
  '/envios': '/pages/envios',
  '/terminos': '/pages/terminos',
  '/privacidad': '/pages/privacidad',
  '/cookies': '/pages/cookies',
  '/#contacto': '/#contacto',
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ');
const text = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const manifest = [];
for (const slug of ['privacidad', 'terminos', 'devoluciones', 'envios', 'garantia', 'cookies']) {
  const s = fs.readFileSync(path.join(DIR, slug + '.html'), 'utf8');
  const main = s.slice(s.indexOf('<main'), s.indexOf('<footer', s.indexOf('<main')));
  const title = decode(main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<!-- -->/g, '')).trim();
  const upd = main.match(/<p[^>]*>Última actualización:[\s\S]*?<\/p>/);
  if (!upd) throw new Error(slug + ': sin línea de actualización');
  // contenido = el div que sigue a la línea de actualización, hasta el cierre del contenedor
  let body = main.slice(main.indexOf(upd[0]) + upd[0].length);
  body = body.replace(/^<div[^>]*>/, '');
  body = body.replace(/<\/div><\/div>\s*$/, '');
  const original = body;
  const buttons = [...body.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map((m) => text(m[1]));
  let clean = body
    .replace(/<!-- -->/g, '')
    .replace(/ class="[^"]*"/g, '')
    .replace(/<button[^>]*>[\s\S]*?<\/button>/g, '')
    .replace(/<\/?section>/g, '')
    .replace(/href="([^"]*)"/g, (m, h) => {
      if (/^https?:/.test(h)) return m;
      if (!(h in LINKS)) throw new Error(slug + ': link interno sin mapa: ' + h);
      return `href="${LINKS[h]}"`;
    });
  if (/<(div|span|img|script|style|svg|button)/.test(clean)) throw new Error(slug + ': etiqueta inesperada ' + clean.match(/<(div|span|img|script|style|svg|button)[^>]*>/)[0]);
  let expected = text(original.replace(/<!-- -->/g, ''));
  for (const b of buttons) expected = expected.replace(b, '').replace(/\s+/g, ' ').trim();
  const got = text(clean);
  if (got !== expected) {
    let i = 0; while (got[i] === expected[i]) i++;
    throw new Error(slug + ': el texto cambió en ' + i + ': ' + JSON.stringify(got.slice(i - 30, i + 30)) + ' vs ' + JSON.stringify(expected.slice(i - 30, i + 30)));
  }
  fs.writeFileSync(path.join(OUT, slug + '.html'), clean);
  manifest.push({
    slug, title, words: got.split(' ').length,
    removed_update_line: text(upd[0]),
    removed_buttons: buttons,
    links: [...clean.matchAll(/href="([^"]*)"/g)].map((m) => m[1]),
    sha256: crypto.createHash('sha256').update(clean).digest('hex'),
  });
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
for (const m of manifest) console.log(m.slug.padEnd(13), m.words, 'palabras', m.title, '| botones quitados:', m.removed_buttons.length, '| links:', m.links.join(' '));
