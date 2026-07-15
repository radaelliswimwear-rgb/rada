// Conversor Markdown → HTML minimalista (Sprint 17): a propósito no se
// agrega una librería nueva (remark/marked/etc.) para cubrir un caso de uso
// acotado — encabezados, negrita/cursiva, enlaces, listas y párrafos — que
// es lo único que necesita el contenido del blog, sembrado a mano en
// prisma/seed.ts o escrito desde /admin/blog. Si el contenido del blog
// necesitara Markdown más completo (tablas, código, citas anidadas) en el
// futuro, este archivo es el único a reemplazar por una librería real —
// blog-actions.ts y los componentes de blog no lo saben.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="underline underline-offset-4">$1</a>',
    );
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
