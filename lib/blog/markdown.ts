// Conversor Markdown → HTML minimalista (Sprint 17): a propósito no se
// agrega una librería nueva (remark/marked/etc.) para cubrir un caso de uso
// acotado — encabezados, negrita/cursiva, enlaces, listas y párrafos — que
// es lo único que necesita el contenido del blog, sembrado a mano en
// prisma/seed.ts o escrito desde /admin/blog. Si el contenido del blog
// necesitara Markdown más completo (tablas, código, citas anidadas) en el
// futuro, este archivo es el único a reemplazar por una librería real —
// blog-actions.ts y los componentes de blog no lo saben.
// Auditoría de seguridad (sep. 2026, hardening P2/P3): también escapa
// comillas -- `escapeHtml` corre ANTES de que el link de abajo interpole su
// URL dentro de `href="..."`, así que una comilla literal sin escapar
// podía cerrar el atributo antes de tiempo y agregar uno nuevo
// (`onmouseover=...`, etc.) -- inyección clásica por escape de atributo.
// Escapar comillas en texto normal (encabezados/párrafos/negrita) es
// inofensivo (`&quot;`/`&#39;` se ven igual que `"`/`'` al renderizarse),
// así que ensancharlo acá no rompe nada existente.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Esquemas de URL que un enlace puede usar de verdad -- todo lo demás
// (javascript:, data:, vbscript:, y cualquier esquema no reconocido) se
// neutraliza a "#" en vez de descartar el enlace entero, así el texto
// sigue siendo legible sin quedar clickeable hacia algo peligroso. Sin
// esquema reconocible (empieza con "/", "#", "?", o es una URL relativa
// como "envios") se trata como ruta interna segura, tal cual.
const SAFE_LINK_SCHEMES = new Set(["http:", "https:", "mailto:"]);

function sanitizeLinkHref(rawHref: string): string {
  // Los navegadores ignoran tab/salto de línea/retorno de carro (y otros
  // caracteres de control) en CUALQUIER posición de una URL antes de
  // interpretar su esquema -- "java\tscript:alert(1)" se interpreta igual
  // que "javascript:alert(1)". Sin quitarlos PRIMERO, un regex que busque
  // el esquema al principio del string se dejaría engañar creyendo que no
  // hay esquema reconocible y trataría el enlace como ruta relativa
  // segura. Mismo bypass que sanitizadores como DOMPurify neutralizan de
  // la misma forma.
  // eslint-disable-next-line no-control-regex
  const withoutControlChars = rawHref.replace(/[\x00-\x1f\x7f]/g, "");
  const normalized = withoutControlChars.trim();
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(normalized);
  if (!schemeMatch) {
    // Sin esquema reconocible -- ruta relativa/anchor/query interna,
    // siempre segura (nunca puede ser javascript:/data:/vbscript:).
    return rawHref.trim();
  }
  const scheme = `${schemeMatch[1]!.toLowerCase()}:`;
  return SAFE_LINK_SCHEMES.has(scheme) ? rawHref.trim() : "#";
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, (_match, label: string, href: string) => {
      const safeHref = sanitizeLinkHref(href);
      return `<a href="${safeHref}" class="underline underline-offset-4">${label}</a>`;
    });
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.trim().split("\n");
  const html: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      html.push(`<ul class="list-disc pl-5">${listItems.join("")}</ul>`);
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushList();
      const level = heading[1]!.length;
      html.push(`<h${level}>${inline(heading[2]!)}</h${level}>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      listItems.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    flushList();
    html.push(`<p>${inline(line)}</p>`);
  }
  flushList();

  return html.join("\n");
}
