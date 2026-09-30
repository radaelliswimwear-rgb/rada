// 03G — Verificación adversarial de la paridad de la Home: script DETERMINISTA y OFFLINE.
// Re-lee la evidencia cruda (home.html, dev-home.json, dev-routes.json), theme-src y dist/release-manifest-*.json
// y comprueba las afirmaciones del informe theme/03G-home-parity.md que el script 03g-home-parity.mjs no cubre.
// Lee SOLO archivos del repo. No usa red ni git. No escribe nada (salida por stdout).
// Uso:    node launch/tools/03g-home-parity-verify.mjs
// Privacidad: cualquier numero telefonico o enlace wa.me se redacta.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, "..", "..");
const EV = path.join(MIG, "launch", "evidence");
const TS = path.join(MIG, "theme-src");
const readText = (p) => fs.readFileSync(p, "utf8");
const readJson = (p) => JSON.parse(readText(p));
const REDACT = (s) => String(s ?? "").replace(/wa\.me\/\d+/g, "<wa.me del sitio>").replace(/\+\d{2}[\s\d]{9,16}\d/g, "<numero-redactado>");
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, " ");
const out = [];
const P = (s = "") => out.push(s);
const table = (title, header, rows) => {
  P(`\n### ${title}`);
  P("| " + header.join(" | ") + " |");
  P("|" + header.map(() => "---").join("|") + "|");
  for (const r of rows) P("| " + r.map((c) => String(c ?? "").replace(/\|/g, "\\|")).join(" | ") + " |");
};

/* V1 ------------------------------------------------------------- theme-src frente a los manifiestos de release */
{
  const m18 = readJson(path.join(MIG, "dist", "release-manifest-rc1.8.json"));
  const m17 = readJson(path.join(MIG, "dist", "release-manifest-rc1.7.json"));
  let same = 0;
  const bad = [];
  for (const f of m18.files) {
    const p = path.join(TS, f.path);
    if (!fs.existsSync(p)) {
      bad.push(`${f.path}: no existe`);
      continue;
    }
    const h = crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
    if (h === f.sha256) same++;
    else bad.push(`${f.path}: distinto`);
  }
  const a = Object.fromEntries(m17.files.map((f) => [f.path, f.sha256]));
  const b = Object.fromEntries(m18.files.map((f) => [f.path, f.sha256]));
  const diff = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort().filter((k) => a[k] !== b[k]);
  table("V1 theme-src y manifiestos de release", ["comprobación", "resultado"], [
    ["ZIP RC1.8 (SHA-256 del manifiesto)", m18.zip.sha256],
    ["archivos del manifiesto RC1.8", String(m18.files.length)],
    ["archivos de theme-src que coinciden por SHA-256 con el manifiesto RC1.8", `${same} de ${m18.files.length}${bad.length ? " (fallan: " + bad.join("; ") + ")" : ""}`],
    ["archivos que difieren entre los manifiestos RC1.7 y RC1.8", `${diff.length}: ${diff.join(", ") || "ninguno"}`],
  ]);
}

/* V2 ------------------------------------------------------------- pie: panel de Contacto */
{
  const html = readText(path.join(EV, "current-site", "home.html"));
  const body = html.slice(html.indexOf("<body")).replace(/<script[\s\S]*?<\/script>/g, "");
  const det = body.match(/<details[^>]*>[\s\S]*?<\/details>/);
  const items = [];
  if (det) {
    for (const a of det[0].matchAll(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const spans = [...a[2].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, "").trim()));
      // spans: [nombre + (span anidado)] -> el texto secundario es el ultimo <span> interno
      const inner = [...a[2].matchAll(/<span[^>]*>([^<]*)<\/span>/g)].map((m) => decode(m[1].trim())).filter(Boolean);
      items.push({ href: REDACT(a[1]), spans: spans.map(REDACT), secondary: inner.map(REDACT) });
    }
  }
  const footer = readText(path.join(TS, "sections", "footer.liquid"));
  const panel = footer.match(/site-footer__contact-panel">([\s\S]*?)<\/details>/);
  const devSpans = panel ? [...panel[1].matchAll(/<span>([^<]*)<\/span>/g)].map((m) => m[1].trim()) : [];
  const devHasHandleText = panel ? /<span>[^<]*\{\{[^}]*settings\.social_/.test(panel[1]) : null;
  const ftrGroup = readJson(path.join(TS, "sections", "footer-group.json"));
  const contact = ftrGroup.sections.footer.blocks.contacto.settings;
  table("V2 Pie: panel desplegable de Contacto", ["lado", "enlaces", "texto visible por enlace"], [
    ["actual [MEDIDO-03G] (home.html, <details>)", String(items.length), items.map((i) => (i.secondary.length ? i.secondary.join(" + ") : "(solo el nombre)")).join(" ; ")],
    ["Dev [DOC] (footer.liquid, panel de contacto)", String(devSpans.length), `solo el nombre de la red: ${devSpans.join(", ")}; texto con usuario o número: ${devHasHandleText ? "sí" : "no"}`],
    ["Dev [DOC] (footer-group.json, bloque contacto)", "", `heading "${contact.heading}"; contact_email ${contact.contact_email ? "cargado" : "vacío"}; show_social_channels ${contact.show_social_channels}`],
    ["Dev [DOC] (footer.liquid): etiqueta del <summary>", "", "clave general.contact.title = " + JSON.stringify(readJson(path.join(TS, "locales", "es.default.json")).general.contact.title) + " (el bloque además imprime el heading; misma palabra dos veces) [INFERIDO]"],
  ]);
}

/* V3 ------------------------------------------------------------- <title> y metas del head */
{
  const theme = readText(path.join(TS, "layout", "theme.liquid"));
  const cur = readText(path.join(EV, "current-site", "home.html"));
  const head = cur.slice(0, cur.indexOf("</head>"));
  const curTitle = decode((head.match(/<title>([^<]*)<\/title>/) || [])[1] || "");
  const suffixRule = /unless page_title contains shop\.name %\} &ndash; \{\{ shop\.name \| escape \}\}\{% endunless/.test(theme);
  const render = (pageTitle, shopName) => (suffixRule && !pageTitle.includes(shopName) ? `${pageTitle} – ${shopName}` : pageTitle);
  const cap = readJson(path.join(EV, "dev-home.json"));
  table("V3 <title> de la Home según theme.liquid", ["escenario", "page_title", "shop.name", "<title> resultante", "¿igual al actual?"], [
    ["captura Dev hoy [MEDIDO-03G]", cap.title, cap.title, cap.title + " (medido)", cap.title === curTitle ? "sí" : "no"],
    ["tras renombrar la tienda y cargar el título actual en Preferencias [INFERIDO]", curTitle, "Radaelli Swimwear", render(curTitle, "Radaelli Swimwear"), render(curTitle, "Radaelli Swimwear") === curTitle ? "sí" : "no"],
  ]);
  P(`\nRegla de sufijo presente en layout/theme.liquid (unless page_title contains shop.name): ${suffixRule ? "sí" : "no"}. Título actual medido: "${curTitle}".`);

  const metaNames = (h) => [...h.matchAll(/<meta\s+(?:property|name)="((?:og|twitter):[a-z:_]+)"/g)].map((m) => m[1]);
  const curMetas = [...new Set(metaNames(head))].sort();
  const themeMetas = [...new Set([...theme.matchAll(/<meta\s+(?:property|name)="((?:og|twitter):[a-z:_]+)"/g)].map((m) => m[1]))].sort();
  const capMetas = cap.og.map((x) => x.split("=")[0]);
  table("V3b Metas og:* y twitter:*", ["fuente", "etiquetas"], [
    ["actual [MEDIDO-03G] (home.html)", curMetas.join(", ")],
    ["Dev [DOC] (layout/theme.liquid; algunas condicionadas a page_description o page_image)", themeMetas.join(", ")],
    ["Dev [MEDIDO-03G] (dev-home.json, lista og de la captura)", capMetas.join(", ")],
    ["en el actual y no en theme.liquid", curMetas.filter((x) => !themeMetas.includes(x)).join(", ") || "ninguna"],
  ]);
}

/* V4 ------------------------------------------------------------- páginas legales en la Dev */
{
  const r = readJson(path.join(EV, "dev-routes.json")).routes;
  const pick = (p) => r.find((x) => x.p === p) || r.find((x) => x.p.split(", ").includes(p));
  const rows = ["/policies/privacy-policy", "/policies/terms-of-service", "/policies/shipping-policy", "/policies/refund-policy", "/pages/garantia"].map((p) => {
    const x = pick(p);
    return [p, x ? String(x.s) : "no probada", x && x.note ? x.note : ""];
  });
  const legal = r.find((x) => /pages\/envios/.test(x.p));
  rows.push(["/pages/envios, /pages/privacidad, /pages/terminos, /pages/cookies", legal ? String(legal.s) : "no probadas", legal ? legal.note : ""]);
  table("V4 Destinos legales en la Dev [MEDIDO-03G]", ["ruta", "estado", "nota de la captura"], rows);
  const redirects = readText(path.join(MIG, "seo", "shopify-redirects-import.csv")).split("\n").slice(1).filter(Boolean).map((l) => l.split(",")[0].trim());
  table("V4b Redirecciones importadas para las 4 rutas legales del pie actual", ["ruta actual", "¿está entre las 47?"], ["/envios", "/terminos", "/privacidad", "/cookies"].map((p) => [p, redirects.includes(p) ? "sí" : "no"]));
}

/* V5 ------------------------------------------------------------- decisiones documentadas sobre Empresa y manifiesto */
{
  const inv = readText(path.join(MIG, "theme", "03D-legal-policies-inventory.md")).split("\n");
  const ln = inv.map((l, i) => [i + 1, l]).filter(([, l]) => /Sobre nosotros \/ Sostenibilidad \/ Prensa/.test(l));
  table("V5 Columna Empresa: fuente documentada (theme/03D-legal-policies-inventory.md)", ["línea", "texto"], ln.map(([n, l]) => [String(n), l.replace(/\s+/g, " ").slice(0, 300)]));
  const csv = readText(path.join(MIG, "content", "media", "media-migration-manifest.csv")).split("\n").filter(Boolean).slice(1);
  const m06 = csv.find((l) => l.startsWith("M06,")) || "";
  const m01 = csv.find((l) => l.startsWith("M01,")) || "";
  const bytes = (l) => l.split(",")[3];
  table("V5b M06 frente a M01 en el manifiesto de media", ["dato", "M01", "M06"], [
    ["bytes", bytes(m01), bytes(m06)],
    ["nota de M06", "", (m06.match(/"?(Mismo ETag[^"]*)"?/) || [])[1] || "(sin nota)"],
  ]);
}

console.log(out.join("\n").trim());
