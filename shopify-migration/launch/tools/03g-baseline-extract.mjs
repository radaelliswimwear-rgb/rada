// 03G — extractor DETERMINISTA y OFFLINE del sitio custom actual (radaelliswimwear.com).
// Lee SOLO: launch/evidence/current-site/*, launch/evidence/current-site-probe/*, launch/evidence/dev-*.json*,
//           content/legal/*, catalog/*.csv. No usa red, no usa git, no escribe fuera de launch/evidence.
// Uso:   node launch/tools/03g-baseline-extract.mjs
// Salida: launch/evidence/current-site-extract.json  (mismo insumo -> mismo JSON, byte a byte; sin fechas ni hora)
// Privacidad: el numero de WhatsApp (enlace wa.me y texto visible) se reemplaza por "<wa.me del sitio>".
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ""));
const MIG = path.join(HERE, "..", "..");
const EV = path.join(MIG, "launch", "evidence");
const CS = path.join(EV, "current-site");
const PR = path.join(EV, "current-site-probe");
const OUT = path.join(EV, "current-site-extract.json");

const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const readText = (p) => fs.readFileSync(p, "utf8");

/* ------------------------------------------------------------------ parser HTML minimo */
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const RAW = new Set(["script", "style", "textarea", "title"]);
const decode = (s) =>
  s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

function parseHtml(html) {
  const root = { tag: "#root", attrs: {}, children: [], parent: null };
  let cur = root;
  let i = 0;
  const n = html.length;
  while (i < n) {
    if (html[i] !== "<") {
      const e = html.indexOf("<", i);
      const t = html.slice(i, e < 0 ? n : e);
      if (t) cur.children.push({ tag: "#text", text: decode(t), parent: cur });
      i = e < 0 ? n : e;
      continue;
    }
    if (html.startsWith("<!--", i)) {
      const e = html.indexOf("-->", i + 4);
      const c = html.slice(i + 4, e < 0 ? n : e);
      cur.children.push({ tag: "#comment", text: c, parent: cur });
      i = e < 0 ? n : e + 3;
      continue;
    }
    if (html[i + 1] === "!") {
      const e = html.indexOf(">", i);
      i = e < 0 ? n : e + 1;
      continue;
    }
    if (html[i + 1] === "/") {
      const e = html.indexOf(">", i);
      const name = html.slice(i + 2, e).trim().toLowerCase();
      let p = cur;
      while (p && p.tag !== name) p = p.parent;
      if (p && p !== root) cur = p.parent;
      i = e + 1;
      continue;
    }
    // etiqueta de apertura
    let j = i + 1;
    while (j < n && !/[\s/>]/.test(html[j])) j++;
    const tag = html.slice(i + 1, j).toLowerCase();
    const attrs = {};
    while (j < n) {
      while (j < n && /\s/.test(html[j])) j++;
      if (html[j] === ">" || (html[j] === "/" && html[j + 1] === ">")) break;
      let k = j;
      while (k < n && !/[\s=/>]/.test(html[k])) k++;
      const name = html.slice(j, k).toLowerCase();
      j = k;
      while (j < n && /\s/.test(html[j])) j++;
      let val = "";
      if (html[j] === "=") {
        j++;
        while (j < n && /\s/.test(html[j])) j++;
        if (html[j] === '"' || html[j] === "'") {
          const q = html[j];
          const e = html.indexOf(q, j + 1);
          val = html.slice(j + 1, e);
          j = e + 1;
        } else {
          let e = j;
          while (e < n && !/[\s>]/.test(html[e])) e++;
          val = html.slice(j, e);
          j = e;
        }
      }
      if (name) attrs[name] = decode(val);
    }
    const selfClose = html[j] === "/";
    j = html.indexOf(">", j) + 1;
    const node = { tag, attrs, children: [], parent: cur };
    cur.children.push(node);
    if (RAW.has(tag)) {
      const close = html.toLowerCase().indexOf("</" + tag, j);
      const end = close < 0 ? n : close;
      const t = html.slice(j, end);
      if (t) node.children.push({ tag: "#text", text: tag === "script" || tag === "style" ? t : decode(t), parent: node });
      const e = html.indexOf(">", end);
      i = e < 0 ? n : e + 1;
      continue;
    }
    if (!VOID.has(tag) && !selfClose) cur = node;
    i = j;
  }
  return root;
}

// Resuelve el streaming de React (Suspense): <template id="B:n"> + fallback hasta <!--/$--> se reemplaza por los hijos de <div hidden id="S:n">.
function resolveStreams(root, html) {
  const byId = {};
  (function walk(nd) {
    if (nd.attrs && nd.attrs.id && /^S:\d+$/.test(nd.attrs.id) && nd.attrs.hidden !== undefined) byId[nd.attrs.id.slice(2)] = nd;
    for (const c of nd.children || []) walk(c);
  })(root);
  const findTemplate = (id) => {
    let hit = null;
    (function walk(nd) {
      if (hit) return;
      for (let i = 0; i < (nd.children || []).length; i++) {
        const c = nd.children[i];
        if (c.tag === "template" && c.attrs && c.attrs.id === id) {
          hit = { parent: nd, idx: i };
          return;
        }
        walk(c);
        if (hit) return;
      }
    })(root);
    return hit;
  };
  let resolved = 0;
  // $RS("S:a","P:b"): el contenido de S:a reemplaza al <template id="P:b"> (streaming anidado)
  for (const m of html.matchAll(/\$RS\("S:(\d+)","(P:\d+)"\)/g)) {
    const s = byId[m[1]];
    const t = findTemplate(m[2]);
    if (!s || !t) continue;
    const ins = s.children.map((x) => ({ ...x, parent: t.parent }));
    t.parent.children.splice(t.idx, 1, ...ins);
    s.parent.children = s.parent.children.filter((x) => x !== s);
    resolved++;
  }
  // $RC("B:x","S:y"): el contenido de S:y reemplaza el boundary abierto por <template id="B:x"> hasta <!--/$-->
  for (const m of html.matchAll(/\$RC\("(B:\d+)","S:(\d+)"\)/g)) {
    const s = byId[m[2]];
    const t = findTemplate(m[1]);
    if (!s || !t) continue;
    const nd = t.parent;
    let end = t.idx + 1;
    while (end < nd.children.length && !(nd.children[end].tag === "#comment" && nd.children[end].text === "/$")) end++;
    const ins = s.children.map((x) => ({ ...x, parent: nd }));
    nd.children.splice(t.idx, end - t.idx, ...ins);
    s.parent.children = s.parent.children.filter((x) => x !== s);
    resolved++;
  }
  return resolved;
}

const all = (nd, pred, out = []) => {
  if (!nd) return out;
  for (const c of nd.children || []) {
    if (c.tag !== "#text" && c.tag !== "#comment" && pred(c)) out.push(c);
    all(c, pred, out);
  }
  return out;
};
const first = (nd, pred) => all(nd, pred)[0] || null;
const byTag = (nd, tag) => all(nd, (x) => x.tag === tag);
const cls = (nd) => (nd.attrs && nd.attrs.class) || "";
const hasCls = (nd, re) => re.test(cls(nd));
function textOf(nd) {
  let s = "";
  (function w(x) {
    if (x.tag === "#text") s += x.text;
    else if (x.tag === "#comment" || x.tag === "script" || x.tag === "style" || x.tag === "svg") return;
    else {
      const blockish = !/^(span|a|b|i|em|strong|small|label|button)$/.test(x.tag);
      if (blockish) s += " ";
      for (const c of x.children || []) w(c);
      if (blockish) s += " ";
    }
  })(nd);
  return s.replace(/\s+/g, " ").trim();
}
const txt = (nd) => (nd ? textOf(nd) : "");

/* ------------------------------------------------------------------ utilidades */
const REDACT = (s) =>
  typeof s !== "string"
    ? s
    : s.replace(/wa\.me\/\d+/g, "wa.me/<numero-redactado>").replace(/\+\d{2}[\s\d]{9,16}\d/g, "<numero-redactado>");
const redactDeep = (v) => {
  if (typeof v === "string") return REDACT(v);
  if (Array.isArray(v)) return v.map(redactDeep);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, redactDeep(x)]));
  return v;
};
const stable = (v) => {
  if (Array.isArray(v)) return v.map(stable);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])]));
  return v;
};
const money = (s) => {
  const m = String(s || "").match(/\$\s*([\d.]+)/);
  return m ? parseInt(m[1].replace(/\./g, ""), 10) : null;
};
function imgSrc(src) {
  if (!src) return null;
  if (src.startsWith("/_next/image")) {
    try {
      return new URL("https://x" + src).searchParams.get("url");
    } catch {
      return src;
    }
  }
  return src;
}
const cloudId = (u) => {
  const m = String(u || "").match(/\/([A-Za-z0-9_-]+)\.(jpg|jpeg|png|webp|mp4|mov)(\?|$)/i);
  return m ? m[1] + "." + m[2].toLowerCase() : null;
};
const styleUrl = (s) => {
  const m = String(s || "").match(/background-image:url\(([^)]+)\)/);
  return m ? m[1] : null;
};

/* ------------------------------------------------------------------ Flight (RSC) */
function flightRows(html) {
  let s = "";
  const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  let m;
  while ((m = re.exec(html))) {
    try {
      s += JSON.parse(m[1]);
    } catch {
      /* fragmento no parseable: se ignora */
    }
  }
  const rows = {};
  for (const line of s.split("\n")) {
    const mm = line.match(/^([0-9a-f]+):([\[{"].*)$/);
    if (!mm) continue;
    try {
      rows[mm[1]] = JSON.parse(mm[2]);
    } catch {
      /* fila con datos binarios/streams: se ignora */
    }
  }
  return { raw: s, rows };
}
function flightLines(node, rows, depth = 0) {
  // devuelve lineas de texto (li/p/h -> una linea cada uno)
  const out = [];
  const walk = (x, buf) => {
    if (x === null || x === undefined || x === false || x === true) return;
    if (typeof x === "number") return void buf.push(String(x));
    if (typeof x === "string") {
      if (/^\$L?[0-9a-f]+$/.test(x) && depth < 6 && rows[x.replace(/^\$L?/, "")] !== undefined) return walk(rows[x.replace(/^\$L?/, "")], buf);
      if (x.startsWith("$$")) return void buf.push(x.slice(1));
      if (/^\$(undefined|@|L|Sreact)/.test(x) || /^\$[0-9a-f]+$/.test(x)) return;
      return void buf.push(x);
    }
    if (Array.isArray(x)) {
      if (x[0] === "$" && x.length >= 4) {
        const type = x[1];
        const props = x[3] || {};
        if (type === "svg" || type === "script" || type === "style") return;
        const blockish = ["p", "li", "h1", "h2", "h3", "div", "ul"].includes(type);
        if (type === "li" || type === "p") {
          const b2 = [];
          walk(props.children, b2);
          const t = b2.join("").replace(/\s+/g, " ").trim();
          if (t) out.push(t);
          return;
        }
        if (type === "a" || (typeof type === "string" && type.startsWith("$L") && props.href)) {
          const b2 = [];
          walk(props.children, b2);
          const t = b2.join("").replace(/\s+/g, " ").trim();
          if (t) out.push("[enlace] " + t + " -> " + props.href);
          return;
        }
        walk(props.children, buf);
        void blockish;
        return;
      }
      for (const c of x) walk(c, buf);
      return;
    }
    if (typeof x === "object") walk(x.children, buf);
  };
  const buf = [];
  walk(node, buf);
  const rest = buf.join("").replace(/\s+/g, " ").trim();
  if (rest) out.unshift(rest);
  return out;
}
function findFlight(node, pred, acc = []) {
  if (Array.isArray(node)) {
    if (node[0] === "$" && node.length >= 4 && node[3] && typeof node[3] === "object" && pred(node)) acc.push(node);
    for (const c of node) findFlight(c, pred, acc);
  } else if (node && typeof node === "object") {
    for (const v of Object.values(node)) findFlight(v, pred, acc);
  }
  return acc;
}

function balancedJson(s, i) {
  let d = 0;
  let inStr = false;
  let esc = false;
  for (let k = i; k < s.length; k++) {
    const c = s[k];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") d++;
    else if (c === "}") {
      d--;
      if (d === 0) return s.slice(i, k + 1);
    }
  }
  return null;
}
// objeto "product":{...sizeStock...} que la ficha entrega como props al componente cliente (payload RSC)
function payloadProduct(raw, slug) {
  let idx = 0;
  while ((idx = raw.indexOf('"product":{', idx)) >= 0) {
    const j = balancedJson(raw, idx + '"product":'.length);
    idx += 10;
    if (!j) continue;
    try {
      const p = JSON.parse(j);
      if (p.sizeStock && p.slug === slug) return p;
    } catch {
      /* siguiente candidato */
    }
  }
  return null;
}

/* ------------------------------------------------------------------ carga */
const idx = JSON.parse(readText(path.join(CS, "index.json")));
const recs = (Array.isArray(idx) ? idx : idx.results).slice().sort((a, b) => a.url.localeCompare(b.url));
const probe = fs.existsSync(path.join(PR, "index.json")) ? JSON.parse(readText(path.join(PR, "index.json"))) : [];
const ORIGIN = "https://radaelliswimwear.com";
const pathOf = (u) => new URL(u).pathname + (new URL(u).search || "");
const COLLECTIONS = ["oasis-natural", "aurora-viva", "espuma-de-ola", "salidas-de-bano", "accesorios", "hombre", "mujer", "ninos", "calzado"];
const LEGAL = ["envios", "devoluciones", "garantia", "privacidad", "terminos", "cookies"];
function kindOf(p) {
  if (p === "/") return "home";
  const s = p.replace(/^\//, "");
  if (COLLECTIONS.includes(s)) return "collection";
  if (s.startsWith("producto/")) return "product";
  if (LEGAL.includes(s)) return "legal";
  if (s === "buscar" || s === "search") return "search";
  if (s === "carrito" || s === "cart") return "cart";
  if (s === "checkout") return "checkout";
  if (s.startsWith("cuenta") || s === "login" || s === "registro") return "account";
  if (s === "favoritos" || s === "wishlist") return "favorites";
  if (s === "blog" || s.startsWith("blog/")) return "blog";
  if (s === "robots.txt") return "robots";
  if (s === "sitemap.xml") return "sitemap";
  return "other";
}

const docs = {}; // path -> {rec, html, root, flight}
function loadDoc(rec, dir) {
  const html = readText(path.join(dir, rec.file));
  const root = parseHtml(html);
  const streams = resolveStreams(root, html);
  return { html, root, streams, flight: flightRows(html) };
}
for (const r of recs) {
  const p = pathOf(r.url);
  if (r.status === 200 && r.file && /html/.test(r.contentType)) docs[p] = { rec: r, ...loadDoc(r, CS) };
}
const probeDocs = {};
for (const r of probe) if (r.file) probeDocs[r.path] = { rec: r, ...loadDoc(r, PR) };

/* ------------------------------------------------------------------ head */
function headInfo(d) {
  const head = d.root; // meta/title/link pueden estar en <head> o hoisteados al <body> por React
  const meta = (name) => {
    const m = all(head, (x) => x.tag === "meta" && (x.attrs.name === name || x.attrs.property === name));
    return m.length ? m.map((x) => x.attrs.content) : [];
  };
  const links = all(head, (x) => x.tag === "link");
  const html = first(d.root, (x) => x.tag === "html");
  return {
    lang: html.attrs.lang || null,
    title: txt(first(head, (x) => x.tag === "title")),
    description: (meta("description")[0]) ?? null,
    robots: (meta("robots")[0]) ?? null,
    robotsAll: meta("robots"),
    canonical: (links.find((l) => l.attrs.rel === "canonical") || { attrs: {} }).attrs.href ?? null,
    alternates: links.filter((l) => l.attrs.rel === "alternate").map((l) => (l.attrs.hreflang || "") + " " + l.attrs.href),
    viewport: (meta("viewport")[0]) ?? null,
    ogTitle: meta("og:title")[0] ?? null,
    ogDescription: meta("og:description")[0] ?? null,
    ogUrl: meta("og:url")[0] ?? null,
    ogType: meta("og:type")[0] ?? null,
    ogSiteName: meta("og:site_name")[0] ?? null,
    ogImage: meta("og:image")[0] ?? null,
    twitterCard: meta("twitter:card")[0] ?? null,
    twitterTitle: meta("twitter:title")[0] ?? null,
    icons: links.filter((l) => /icon/.test(l.attrs.rel || "")).map((l) => l.attrs.rel + " " + l.attrs.href.replace(/\?.*$/, "")),
    stylesheets: links.filter((l) => l.attrs.rel === "stylesheet").length,
    jsonLd: all(d.root, (x) => x.tag === "script" && x.attrs.type === "application/ld+json").map((s) => {
      try {
        return JSON.parse(s.children[0].text)["@type"];
      } catch {
        return "PARSE_ERROR";
      }
    }),
  };
}

/* ------------------------------------------------------------------ shell (header/footer/anuncio/cookies) */
function shellInfo(d) {
  const body = first(d.root, (x) => x.tag === "body");
  const header = first(d.root, (x) => x.tag === "header");
  const footer = first(d.root, (x) => x.tag === "footer");
  const main = first(d.root, (x) => x.tag === "main");
  if (!header) return { announcement: null, header: null, footer: null, cookieBanner: null, noShell: true };
  const annEl = header ? header.parent.children.filter((c) => c.tag === "div" && c.parent === header.parent).find((c) => header.parent.children.indexOf(c) === header.parent.children.indexOf(header) - 1) : null;
  const nav = first(header, (x) => x.tag === "nav");
  const navLinks = nav ? byTag(nav, "a").map((a) => ({ text: txt(a), href: a.attrs.href })) : [];
  const controls = [];
  for (const x of all(header, (y) => (y.tag === "a" || y.tag === "button" || y.tag === "select" || y.tag === "form") && y.parent !== nav)) {
    if (x.tag === "a" && nav && nav.children.includes(x)) continue;
    controls.push({
      tag: x.tag,
      label: x.attrs["aria-label"] || txt(x) || null,
      href: x.attrs.href || x.attrs.action || null,
      visibilityClasses: (cls(x) + " " + cls(x.parent || {}) + " " + cls((x.parent || {}).parent || {}))
        .split(/\s+/)
        .filter((c) => /^(hidden|block|flex|inline-flex|lg:|xl:|md:|sm:|2xl:)/.test(c) && /(hidden|:flex|:block|:hidden|:inline)/.test(c))
        .filter((c, i, a) => a.indexOf(c) === i)
        .join(" "),
      options: x.tag === "select" ? byTag(x, "option").map((o) => o.attrs.value) : undefined,
    });
  }
  const headerLogo = first(header, (x) => x.tag === "img");
  const footerCols = [];
  if (footer) {
    for (const h3 of byTag(footer, "h3")) {
      const colNode = h3.parent;
      const inDetails = (a) => {
        for (let p = a.parent; p; p = p.parent) if (p.tag === "details") return true;
        return false;
      };
      footerCols.push({
        heading: txt(h3),
        links: byTag(colNode, "a").filter((a) => !inDetails(a)).map((a) => ({ text: txt(a), href: a.attrs.href })),
        hasContactDropdown: byTag(colNode, "details").length > 0,
      });
    }
  }
  const footerSocial = footer
    ? all(footer, (x) => x.tag === "a" && /^https?:/.test(x.attrs.href || "") && x.parent && !hasCls(x.parent, /absolute/) && txt(x) && !x.children.some((c) => c.tag === "svg")).map((a) => ({ text: txt(a), href: a.attrs.href }))
    : [];
  const details = footer ? first(footer, (x) => x.tag === "details") : null;
  const cookieBanner = all(body, (x) => x.tag === "div" && x.parent === body && /Usamos cookies/.test(txt(x)))[0];
  return {
    announcement: annEl ? txt(annEl) : null,
    skipLink: txt(first(body, (x) => x.tag === "a" && x.attrs.href === "#main-content")),
    header: {
      sticky: hasCls(header, /sticky/),
      logo: headerLogo ? { alt: headerLogo.attrs.alt, src: imgSrc(headerLogo.attrs.src) } : null,
      nav: navLinks,
      navVisibility: nav ? cls(nav).split(/\s+/).filter((c) => /hidden|lg:|xl:/.test(c)).join(" ") : null,
      controls,
    },
    footer: footer
      ? {
          insideMain: main ? !!all(main, (x) => x === footer).length : false,
          id: footer.attrs.id || null,
          tagline: txt(first(footer, (x) => x.tag === "p" && /trajes de baño/.test(txt(x)))),
          columns: footerCols,
          socialPills: footerSocial,
          contactPopup: details ? { summary: txt(first(details, (x) => x.tag === "summary")), items: byTag(details, "a").map((a) => ({ text: txt(a), href: a.attrs.href })) } : null,
          copyright: txt(first(footer, (x) => x.tag === "p" && /©/.test(txt(x)))),
        }
      : null,
    cookieBanner: cookieBanner ? { text: txt(first(cookieBanner, (x) => x.tag === "p")), buttons: byTag(cookieBanner, "button").map(txt) } : null,
  };
}
function shellSignature(d) {
  const s = shellInfo(d);
  return sha256(JSON.stringify({ a: s.announcement, h: s.header, f: s.footer, c: s.cookieBanner })).slice(0, 16);
}

/* ------------------------------------------------------------------ tarjetas de producto */
function priceBlock(nd) {
  // busca el bloque con precio actual, tachado y % en nd
  const spans = all(nd, (x) => x.tag === "span");
  const strike = spans.find((s) => hasCls(s, /line-through/));
  const pct = spans.find((s) => /^-\d+%$/.test(txt(s)));
  const priceSpan = strike ? strike.parent.children.filter((c) => c.tag === "span")[0] : null;
  return {
    price: priceSpan ? money(txt(priceSpan)) : null,
    compareAt: strike ? money(txt(strike)) : null,
    discountLabel: pct ? txt(pct) : null,
    text: priceSpan ? [txt(priceSpan), strike ? txt(strike) : "", pct ? txt(pct) : ""].filter(Boolean).join(" | ") : null,
  };
}
function cardFrom(a) {
  // a: contenedor de tarjeta que incluye un <a href=/producto/..>
  const link = a.tag === "a" && /^\/producto\//.test(a.attrs.href || "") ? a : first(a, (x) => x.tag === "a" && /^\/producto\//.test(x.attrs.href || ""));
  const wrap = a;
  const imgs = byTag(wrap, "img").map((i) => imgSrc(i.attrs.src));
  const badge = all(wrap, (x) => x.tag === "span" && hasCls(x, /uppercase/) && hasCls(x, /absolute/)).map(txt)[0] || null;
  const h3 = first(wrap, (x) => x.tag === "h3");
  const fav = first(wrap, (x) => x.tag === "button" && /favoritos/.test(x.attrs["aria-label"] || ""));
  const quick = all(wrap, (x) => x.tag === "button" && /Vista rápida/.test(txt(x)))[0];
  const pb = priceBlock(wrap);
  return {
    href: link ? link.attrs.href : null,
    name: txt(h3),
    ariaLabel: link ? link.attrs["aria-label"] || null : null,
    images: imgs.map(cloudId),
    imageCount: imgs.length,
    firstImage: imgs[0] || null,
    badge,
    hasFavoriteButton: !!fav,
    hasQuickView: !!quick,
    overlayCta: txt(first(wrap, (x) => x.tag === "span" && /^Ver producto$/.test(txt(x)))) || null,
    ...pb,
  };
}

/* ------------------------------------------------------------------ HOME */
function homeInfo(d) {
  const main = first(d.root, (x) => x.tag === "main");
  const sections = [];
  for (const sec of main.children.filter((c) => c.tag === "section")) {
    const h1 = first(sec, (x) => x.tag === "h1");
    const h2 = first(sec, (x) => x.tag === "h2");
    const eyebrow = first(sec, (x) => x.tag === "p" && hasCls(x, /uppercase/) && hasCls(x, /tracking/));
    const videos = byTag(sec, "video").map((v) => ({
      src: v.attrs.src || null,
      poster: v.attrs.poster || null,
      autoplay: v.attrs.autoplay !== undefined,
      loop: v.attrs.loop !== undefined,
      muted: v.attrs.muted !== undefined,
      playsInline: v.attrs.playsinline !== undefined,
      preload: v.attrs.preload || null,
      ariaHidden: v.attrs["aria-hidden"] || null,
    }));
    const bgs = all(sec, (x) => x.attrs && /background-image/.test(x.attrs.style || "")).map((x) => ({ url: styleUrl(x.attrs.style), role: x.attrs.role || null, label: x.attrs["aria-label"] || null }));
    const imgs = byTag(sec, "img").map((i) => ({ alt: i.attrs.alt, src: imgSrc(i.attrs.src) }));
    const ctas = all(sec, (x) => (x.tag === "a" && /rounded-full/.test(cls(x)) && !/data-card/.test(JSON.stringify(x.attrs))) || (x.tag === "a" && /underline/.test(cls(x)))).map((a) => ({ text: txt(a), href: a.attrs.href }));
    sections.push({
      order: sections.length + 1,
      id: sec.attrs.id || null,
      ariaLabelledby: sec.attrs["aria-labelledby"] || null,
      h1: txt(h1) || null,
      h2: txt(h2) || null,
      eyebrow: txt(eyebrow) || null,
      paragraphs: all(sec, (x) => x.tag === "p").map(txt).filter(Boolean),
      ctas,
      videos,
      backgroundImages: bgs,
      imgCount: imgs.length,
      classesBreakpoints: cls(sec).split(/\s+/).filter((c) => /^(sm|md|lg|xl):|aspect/.test(c)),
      _node: sec,
    });
  }
  // detalles por seccion
  const hero = sections.find((s) => s.id === "hero");
  const cat = sections.find((s) => s.id === "categorias");
  const catCards = cat
    ? byTag(cat._node, "a")
        .filter((a) => /^Explorar la categoría/.test(a.attrs["aria-label"] || ""))
        .map((a) => {
          const v = first(a, (x) => x.tag === "video");
          const bg = first(a, (x) => /background-image/.test((x.attrs || {}).style || ""));
          return {
            name: txt(first(a, (x) => x.tag === "h3")),
            text: txt(first(a, (x) => x.tag === "p")),
            href: a.attrs.href,
            cta: txt(first(a, (x) => x.tag === "span" && /Explorar/.test(txt(x)))),
            media: v ? { kind: "video", srcAttr: v.attrs.src || null, poster: v.attrs.poster || null } : bg ? { kind: "background-image", url: styleUrl(bg.attrs.style) } : { kind: "none" },
          };
        })
    : [];
  const carousels = [];
  for (const s of sections) {
    const cards = all(s._node, (x) => x.attrs && x.attrs["data-card"] === "true");
    if (cards.length) {
      carousels.push({
        sectionOrder: s.order,
        heading: s.h2,
        eyebrow: s.eyebrow,
        scrollSnap: !!first(s._node, (x) => hasCls(x, /snap-x/)),
        cards: cards.map(cardFrom),
      });
    }
  }
  const promo = sections.find((s) => /20% de descuento/.test(s.h2 || ""));
  const newsletter = sections.find((s) => /Sé la primera/.test(s.h2 || ""));
  const nl = newsletter ? first(newsletter._node, (x) => x.tag === "form") : null;
  const out = {
    sectionsInMainOrder: sections.map((s) => {
      const { _node, ...r } = s;
      return r;
    }),
    footerInsideMainAfterSections: true,
    hero: hero
      ? { eyebrow: hero.eyebrow, h1: hero.h1, subtitle: hero.paragraphs.filter((p) => p !== hero.eyebrow)[0] || null, ctas: hero.ctas, videos: hero.videos, imgCount: hero.imgCount, layoutClasses: hero.classesBreakpoints }
      : null,
    categories: { heading: cat ? cat.h2 : null, eyebrow: cat ? cat.eyebrow : null, cards: catCards },
    carousels,
    promo: promo ? { eyebrow: promo.eyebrow, h2: promo.h2, ctas: promo.ctas, paragraphs: promo.paragraphs } : null,
    newsletter: newsletter
      ? {
          eyebrow: newsletter.eyebrow,
          h2: newsletter.h2,
          copy: newsletter.paragraphs.filter((p) => p !== newsletter.eyebrow)[0] || null,
          form: nl ? { hasAction: nl.attrs.action !== undefined, method: nl.attrs.method || null, input: (first(nl, (x) => x.tag === "input") || { attrs: {} }).attrs.type, placeholder: (first(nl, (x) => x.tag === "input") || { attrs: {} }).attrs.placeholder, button: txt(first(nl, (x) => x.tag === "button")) } : null,
        }
      : null,
  };
  return out;
}

/* ------------------------------------------------------------------ COLECCIONES */
function collectionInfo(slug, d) {
  const main = first(d.root, (x) => x.tag === "main");
  const heroSec = first(main, (x) => x.tag === "section");
  const heroBg = heroSec ? first(heroSec, (x) => /background-image/.test((x.attrs || {}).style || "")) : null;
  const h1 = first(main, (x) => x.tag === "h1");
  const breadcrumb = first(main, (x) => x.tag === "nav" && x.attrs["aria-label"] === "Miga de pan");
  const countEl = all(main, (x) => x.tag === "span" && /^\d+ productos?$/.test(txt(x)))[0];
  const aside = first(main, (x) => x.tag === "aside");
  const filterGroups = aside
    ? byTag(aside, "h3").map((h) => {
        const g = h.parent;
        return {
          group: txt(h),
          kind: first(g, (x) => x.tag === "select") ? "select" : first(g, (x) => x.tag === "input") ? "checkbox" : "buttons",
          options: first(g, (x) => x.tag === "select") ? byTag(g, "option").map((o) => ({ value: o.attrs.value, label: txt(o), selected: o.attrs.selected !== undefined })) : all(g, (x) => x.tag === "button" || x.tag === "label").map(txt),
        };
      })
    : [];
  const toggles = all(main, (x) => x.tag === "button" && /^Ver en \d columnas$/.test(x.attrs["aria-label"] || "")).map((b) => ({ label: b.attrs["aria-label"], pressed: b.attrs["aria-pressed"] }));
  const gridEl = aside ? aside.parent.children.find((c) => c !== aside && c.tag === "div") : null;
  const cardEls = gridEl ? all(gridEl, (x) => x.tag === "div" && all(x, (y) => y.tag === "a" && /^\/producto\//.test(y.attrs.href || "")).length === 1 && x.children.some((c) => c.tag === "div" && byTag(c, "a").some((y) => /^\/producto\//.test(y.attrs.href || ""))) && first(x, (y) => y.tag === "h3")) : [];
  // tarjetas: contenedor mas interno con un solo enlace de producto y un h3
  const cards = [];
  const seen = new Set();
  for (const a of all(main, (x) => x.tag === "a" && /^\/producto\//.test(x.attrs.href || "") && x.attrs["aria-label"])) {
    // sube hasta el contenedor que tiene el h3
    let c = a.parent;
    while (c && !first(c, (x) => x.tag === "h3")) c = c.parent;
    if (!c || seen.has(c)) continue;
    seen.add(c);
    cards.push(cardFrom(c));
  }
  void cardEls;
  const emptyState = all(main, (x) => x.tag === "p" && /No hay productos/.test(txt(x))).map(txt)[0] || null;
  const grids = all(main, (x) => x.tag === "div" && /grid-cols-/.test(cls(x)) && /gap-/.test(cls(x)) && all(x, (y) => y.tag === "a" && /^\/producto\//.test(y.attrs.href || "")).length >= 1);
  return {
    slug,
    streamedSuspense: d.streams > 0,
    head: headInfo(d),
    hero: {
      eyebrow: txt(first(heroSec || main, (x) => x.tag === "p" && /^Colección$/.test(txt(x)))),
      h1: txt(h1),
      description: txt(first(heroSec || main, (x) => x.tag === "p" && hasCls(x, /text-white\/80/))),
      background: heroBg ? { kind: "background-image", url: styleUrl(heroBg.attrs.style), style: heroBg.attrs.style.replace(/background-image:url\([^)]+\);?/, "").trim() } : { kind: "gradient-css (sin imagen)" },
    },
    breadcrumb: breadcrumb ? { items: [...breadcrumb.children].filter((c) => c.tag === "a" || c.tag === "span").map(txt).filter((t) => t && t !== "/"), sticky: true } : null,
    countText: txt(countEl),
    productCount: cards.length,
    filtersButton: !!all(main, (x) => x.tag === "button" && /Filtros/.test(txt(x))).length,
    filterGroups,
    gridToggles: toggles,
    gridClassesMobileToDesktop: grids.length ? cls(grids[0]).split(/\s+/).filter((c) => /grid-cols|gap/.test(c)).join(" ") : null,
    emptyState,
    cards,
  };
}

/* ------------------------------------------------------------------ PRODUCTOS */
function pdpInfo(slug, d) {
  const main = first(d.root, (x) => x.tag === "main");
  const ld = all(d.root, (x) => x.tag === "script" && x.attrs.type === "application/ld+json").map((s) => JSON.parse(s.children[0].text));
  const prod = ld.find((x) => x["@type"] === "Product");
  const bcLd = ld.find((x) => x["@type"] === "BreadcrumbList");
  const h1 = first(main, (x) => x.tag === "h1");
  const buyCol = h1 ? h1.parent.parent : main;
  const pb = priceBlock(h1 ? h1.parent : main);
  const allText = txt(main);
  const sizeBtns = all(main, (x) => x.tag === "button" && x.attrs["aria-pressed"] !== undefined && x.attrs["aria-disabled"] !== undefined && /^(XXS|XS|S|M|L|XL|XXL|Única|[\d]+|[A-Z] y [A-Z]+)$/.test(txt(x)));
  const ctaBtn = all(main, (x) => x.tag === "button" && /^(Añadir al carrito|Agotado|Notificarme.*)$/.test(txt(x)));
  const favBtn = all(main, (x) => x.tag === "button" && /favoritos/i.test(txt(x)) && !/^Añadir a favoritos$/.test(x.attrs["aria-label"] || ""))[0];
  const accTitles = all(main, (x) => x.tag === "button" && x.attrs["aria-expanded"] !== undefined).map((b) => txt(b));
  const galleryImgs = all(main, (x) => x.tag === "img" && /66vw/.test(x.attrs.sizes || "")).map((i) => imgSrc(i.attrs.src));
  const zoom = first(main, (x) => x.tag === "div" && x.attrs.role === "button" && /visor de imágenes/.test(x.attrs["aria-label"] || ""));
  const thumbs = all(main, (x) => x.tag === "button" && /miniatura|imagen \d|thumbnail/i.test(x.attrs["aria-label"] || ""));
  const back = all(main, (x) => x.tag === "a" && /^Volver a/.test(txt(x)))[0];
  const crumb = first(main, (x) => x.tag === "nav" && x.attrs["aria-label"] === "Miga de pan");
  const relatedH2 = first(main, (x) => x.tag === "h2" && /También te puede interesar/.test(txt(x)));
  const related = relatedH2 ? all(relatedH2.parent, (x) => x.tag === "a" && /^\/producto\//.test(x.attrs.href || "")).map((a) => a.attrs.href) : [];
  const views = (allText.match(/(\d+)\s*vistas/) || [])[1] || null;
  const sizeGuide = all(main, (x) => x.tag === "button" && /^Guía de tallas$/.test(txt(x))).length > 0;
  const po = payloadProduct(d.flight.raw, slug);
  // acordeones (contenido desde el payload RSC)
  const acc = [];
  const nodes = findFlight(d.flight.rows, (n) => typeof n[3].title === "string" && ["Descripción", "Cuidados de la prenda", "Envíos, devoluciones y garantía", "Métodos de pago"].includes(n[3].title));
  for (const n of nodes) acc.push({ title: n[3].title, lines: flightLines(n[3].children, d.flight.rows) });
  const seenT = new Set();
  const accUniq = acc.filter((a) => (seenT.has(a.title) ? false : (seenT.add(a.title), true)));
  const availabilityEl = all(main, (x) => x.tag === "span" && /^(Disponible|Agotado|Sin stock|Últimas unidades)$/.test(txt(x)))[0];
  const colorP = all(main, (x) => x.tag === "p" && /^Color\s+—/.test(txt(x)))[0];
  const skuP = all(main, (x) => x.tag === "p" && /^SKU:/.test(txt(x)))[0];
  return {
    slug,
    head: headInfo(d),
    jsonLd: {
      types: ld.map((x) => x["@type"]),
      product: prod
        ? {
            name: prod.name,
            sku: prod.sku,
            color: prod.color,
            category: prod.category,
            images: (prod.image || []).length,
            imageIds: (prod.image || []).map(cloudId),
            offer: prod.offers ? { price: prod.offers.price, priceCurrency: prod.offers.priceCurrency, availability: prod.offers.availability, hasPriceValidUntil: prod.offers.priceValidUntil !== undefined, hasCompareAt: false, url: prod.offers.url } : null,
            hasBrand: prod.brand !== undefined,
            hasAggregateRating: prod.aggregateRating !== undefined,
            descriptionChars: (prod.description || "").length,
            description: prod.description || "",
          }
        : null,
      breadcrumb: bcLd ? bcLd.itemListElement.map((i) => i.name) : null,
    },
    h1: txt(h1),
    price: pb.price,
    compareAt: pb.compareAt,
    discountLabel: pb.discountLabel,
    availability: txt(availabilityEl) || null,
    viewsCounter: views,
    sku: skuP ? txt(skuP).replace(/^SKU:\s*/, "") : null,
    color: colorP ? txt(colorP).replace(/^Color\s+—\s*/, "") : null,
    sizes: sizeBtns.map((b) => ({ label: txt(b), disabled: b.attrs["aria-disabled"] === "true" })),
    primaryCta: ctaBtn.map(txt),
    favoriteButton: favBtn ? txt(favBtn) : null,
    accordionTitles: accTitles,
    accordions: accUniq,
    gallery: { mainImagesInDom: galleryImgs.length, ids: galleryImgs.map(cloudId), zoomViewerButton: !!zoom, thumbnailButtons: thumbs.length },
    breadcrumbVisible: crumb ? [...crumb.children].filter((c) => c.tag === "a" || c.tag === "span").map(txt).filter((t) => t && t !== "/") : null,
    backLink: back ? { text: txt(back), href: back.attrs.href } : null,
    related: { heading: relatedH2 ? txt(relatedH2) : null, hrefs: related },
    sizeGuideButton: sizeGuide,
    payload: po
      ? {
          found: true,
          hasInternalId: typeof po.id === "string" && po.id.length > 0,
          keys: Object.keys(po).sort(),
          sizes: po.sizes,
          sizeStock: po.sizeStock,
          totalStock: po.totalStock,
          priceValue: po.priceValue,
          originalPriceValue: po.originalPriceValue,
          activeDiscountPercent: po.activeDiscountPercent,
          featured: po.featured,
          tone: po.tone,
          realViews: po.realViews,
          promotionalViews: po.promotionalViews,
          showViews: po.showViews,
          displayedViews: views === null ? null : Number(views),
          displayedOverReal: views !== null && po.realViews ? Number(views) / po.realViews : null,
          displayedEqualsSixTimesReal: views !== null ? Number(views) === 6 * po.realViews : null,
        }
      : { found: false },
    buyColumnLayout: buyCol ? cls(buyCol) : null,
  };
}

/* ------------------------------------------------------------------ paginas simples */
function simpleMain(d) {
  const main = first(d.root, (x) => x.tag === "main") || first(d.root, (x) => x.tag === "body") || d.root;
  const footer = first(main, (x) => x.tag === "footer");
  const parts = [];
  for (const c of main.children) {
    if (c === footer) break;
    parts.push(c);
  }
  const clone = { tag: "div", attrs: {}, children: parts };
  return {
    h1: txt(first(main, (x) => x.tag === "h1")),
    h2: all(main, (x) => x.tag === "h2" && !(footer && all(footer, (y) => y === x).length)).map(txt),
    text: txt(clone),
    links: all(clone, (x) => x.tag === "a").map((a) => ({ text: txt(a), href: a.attrs.href })),
    buttons: all(clone, (x) => x.tag === "button").map(txt),
    forms: all(clone, (x) => x.tag === "form").map((f) => ({ action: f.attrs.action || null, method: f.attrs.method || null })),
    inputs: all(clone, (x) => x.tag === "input").map((i) => ({ type: i.attrs.type, name: i.attrs.name || null, placeholder: i.attrs.placeholder || null })),
    streamed: d.streams,
    suspenseErrorBoundary: /<!--\$!-->/.test(d.html),
  };
}

/* ------------------------------------------------------------------ legales: comparacion contra content/legal */
const legalManifest = JSON.parse(readText(path.join(MIG, "content", "legal", "manifest.json")));
const textFromHtml = (html) => decode(html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
function legalInfo(slug, d) {
  const html = d.html;
  const mainStart = html.indexOf("<main");
  const main = html.slice(mainStart, html.indexOf("<footer", mainStart));
  const h1m = main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const upd = main.match(/<p[^>]*>Última actualización:[\s\S]*?<\/p>/);
  let body = upd ? main.slice(main.indexOf(upd[0]) + upd[0].length) : "";
  body = body.replace(/^<div[^>]*>/, "").replace(/<\/div><\/div>\s*$/, "");
  const buttons = [...body.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map((m) => textFromHtml(m[1]));
  let liveText = textFromHtml(body);
  for (const b of buttons) liveText = liveText.replace(b, "").replace(/\s+/g, " ").trim();
  const repoHtml = readText(path.join(MIG, "content", "legal", slug + ".html"));
  // El repo remapea hrefs internos a rutas de Shopify: para comparar texto no hace falta, el texto visible no cambia.
  const repoText = textFromHtml(repoHtml);
  const man = legalManifest.find((m) => m.slug === slug);
  const wordsLive = liveText ? liveText.split(" ").length : 0;
  const first200 = (s) => s.slice(0, 200);
  let firstDiff = -1;
  if (liveText !== repoText) {
    let k = 0;
    while (k < liveText.length && liveText[k] === repoText[k]) k++;
    firstDiff = k;
  }
  return {
    slug,
    h1: h1m ? textFromHtml(h1m[1]) : null,
    head: headInfo(d),
    updateLine: upd ? textFromHtml(upd[0]) : null,
    wordsLive,
    wordsManifest: man ? man.words : null,
    buttonsInBody: buttons,
    manifestRemovedButtons: man ? man.removed_buttons : null,
    textEqualToRepoContentLegal: liveText === repoText,
    firstDiffIndex: firstDiff,
    liveTextSha256: sha256(liveText),
    repoTextSha256: sha256(repoText),
    liveHeadText: first200(liveText),
    internalLinks: [...body.matchAll(/href="([^"]*)"/g)].map((m) => m[1]),
    mentionsFreeShippingThreshold: /299\.900/.test(liveText),
    mentions12Months: /12 meses/.test(liveText),
    mentionsWompi: /Wompi/i.test(liveText),
    mentionsColombiaOnly: /dentro de Colombia|Colombia/.test(liveText),
    h2s: [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => textFromHtml(m[1])),
  };
}

/* ------------------------------------------------------------------ robots y sitemap */
function robotsInfo() {
  const t = readText(path.join(CS, "robots.txt.txt"));
  const lines = t.split(/\r?\n/).filter(Boolean);
  const groups = [];
  const disallow = [];
  const allow = [];
  let sitemap = null;
  let host = null;
  const agents = [];
  for (const l of lines) {
    const m = l.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (!m) continue;
    const k = m[1].toLowerCase();
    if (k === "user-agent") agents.push(m[2]);
    else if (k === "disallow") disallow.push(m[2]);
    else if (k === "allow") allow.push(m[2]);
    else if (k === "sitemap") sitemap = m[2];
    else if (k === "host") host = m[2];
  }
  void groups;
  return { rawLines: lines, userAgents: agents, disallow, allow, sitemap, host };
}
function sitemapInfo(crawlStatus) {
  const x = readText(path.join(CS, "sitemap.xml.txt"));
  const urls = [...x.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
    const b = m[1];
    const g = (t) => (b.match(new RegExp("<" + t + ">([^<]*)</" + t + ">")) || [])[1] || null;
    const loc = g("loc");
    const p = loc.replace(ORIGIN, "") || "/";
    return { loc, path: p, lastmod: g("lastmod"), changefreq: g("changefreq"), priority: g("priority"), kind: kindOf(p), crawledStatus: crawlStatus[p] ?? null };
  });
  return urls;
}

/* ------------------------------------------------------------------ ensamble */
const crawlStatus = {};
for (const r of recs) crawlStatus[pathOf(r.url)] = r.status;
for (const r of probe) if (crawlStatus[r.path] === undefined) crawlStatus[r.path] = r.status;

const out = {
  _meta: {
    tool: "launch/tools/03g-baseline-extract.mjs",
    determinista: true,
    fuente: "launch/evidence/current-site/index.json + *.html; launch/evidence/current-site-probe/*; content/legal/*; launch/evidence/dev-*",
    indexSha256: sha256(readText(path.join(CS, "index.json"))),
    limites: [
      "HTML servido (SSR + payload RSC de Next.js); no hay ejecucion de JavaScript ni CSS descargado: nada visual, ningun estado post-hidratacion.",
      "Los cuerpos 404 del rastreo no se guardaron; el cuerpo del 404 sale de un GET puntual (launch/evidence/current-site-probe).",
      "El numero de WhatsApp se redacta en la salida.",
    ],
  },
};

// 1) rastreo
out.crawl = {
  total: recs.length,
  status200: recs.filter((r) => r.status === 200).length,
  status404: recs.filter((r) => r.status === 404).length,
  otherStatus: recs.filter((r) => r.status !== 200 && r.status !== 404).map((r) => ({ path: pathOf(r.url), status: r.status })),
  byKind: Object.fromEntries(
    Object.entries(
      recs.reduce((a, r) => {
        const k = kindOf(pathOf(r.url));
        a[k] = a[k] || { n: 0, s200: 0, s404: 0 };
        a[k].n++;
        if (r.status === 200) a[k].s200++;
        if (r.status === 404) a[k].s404++;
        return a;
      }, {})
    )
  ),
  records: recs.map((r) => ({ path: pathOf(r.url), kind: kindOf(pathOf(r.url)), status: r.status, contentType: r.contentType, bytes: r.bytes ?? null, sources: r.sources })),
  probe: probe.map((r) => ({ path: r.path, status: r.status, contentType: r.contentType, bytes: r.bytes, location: r.location })),
};

// cabeceras comunes a todas las paginas HTML 200
const pagePaths = Object.keys(docs).sort();
const sigs = {};
for (const p of pagePaths) {
  try {
    sigs[p] = shellSignature(docs[p]);
  } catch (e) {
    console.error("shellSignature fallo en", p, String(e.message));
    throw e;
  }
}
const sigCount = {};
for (const v of Object.values(sigs)) sigCount[v] = (sigCount[v] || 0) + 1;
out.shell = {
  sample: shellInfo(docs["/"]),
  consistency: {
    htmlPagesChecked: pagePaths.length,
    distinctShellSignatures: Object.keys(sigCount).length,
    signatureCounts: sigCount,
    pagesNotMatchingHome: pagePaths.filter((p) => sigs[p] !== sigs["/"]),
  },
};
out.shellVsProbe = {};
for (const [p, d] of Object.entries(probeDocs)) out.shellVsProbe[p] = shellSignature(d) === sigs["/"];

// head por pagina (resumen)
out.headByPage = {};
for (const p of pagePaths) {
  const h = headInfo(docs[p]);
  out.headByPage[p] = { kind: kindOf(p), title: h.title, description: h.description, robots: h.robots, canonical: h.canonical, viewport: h.viewport, ogTitle: h.ogTitle, ogUrl: h.ogUrl, ogImage: h.ogImage, twitterTitle: h.twitterTitle, jsonLd: h.jsonLd, lang: h.lang, alternates: h.alternates };
}
out.headByProbe = {};
for (const [p, d] of Object.entries(probeDocs)) {
  const h = headInfo(d);
  out.headByProbe[p] = { status: d.rec.status, title: h.title, description: h.description, robots: h.robots, canonical: h.canonical, jsonLd: h.jsonLd };
}

// 2) home
out.home = { head: headInfo(docs["/"]), ...homeInfo(docs["/"]) };
const homeFlight = docs["/"].flight;
const catRow = findFlight(homeFlight.rows, (n) => Array.isArray(n[3].categories));
out.home.categoryCoverDataInPayload = catRow.length ? catRow[0][3].categories.map((c) => ({ slug: c.slug, name: c.name, coverImageId: cloudId(c.coverImageUrl), coverVideoUrl: c.coverVideoUrl, coverVideoExt: c.coverVideoUrl ? (c.coverVideoUrl.match(/\.(\w+)$/) || [])[1] : null, posX: c.coverImagePosX, posY: c.coverImagePosY, zoom: c.coverImageZoom })) : null;
out.home.recommendedSectionInServedHtml = /Recomendado/i.test(docs["/"].html) || /Recomendado/i.test(homeFlight.raw);

// 404 en el payload
const nf = findFlight(homeFlight.rows, (n) => n[3] && n[3].notFound !== undefined);
const nfLines = [];
if (nf.length) {
  const nfn = nf[0][3].notFound;
  const w = (x) => {
    if (Array.isArray(x)) {
      if (x[0] === "$" && x[3]) {
        const c = x[3].children;
        if (typeof c === "string") nfLines.push(c);
        else w(c);
      } else x.forEach(w);
    }
  };
  w(nfn);
}
out.notFoundPage = {
  fromPayload: nfLines,
  probe: probeDocs["/carrito"]
    ? { path: "/carrito", status: probeDocs["/carrito"].rec.status, head: headInfo(probeDocs["/carrito"]), main: simpleMain(probeDocs["/carrito"]).text.slice(0, 400) }
    : null,
};

// 3) colecciones
out.collections = COLLECTIONS.map((slug) => {
  const d = docs["/" + slug];
  return d ? collectionInfo(slug, d) : { slug, status: crawlStatus["/" + slug] ?? "NOT_CRAWLED" };
});

// 4) productos
const productPaths = pagePaths.filter((p) => p.startsWith("/producto/"));
out.products = productPaths.map((p) => pdpInfo(p.replace("/producto/", ""), docs[p]));

// 5) busqueda / 6) carrito+checkout / 7) cuenta+favoritos
out.search = { buscar: docs["/buscar"] ? { head: headInfo(docs["/buscar"]), ...simpleMain(docs["/buscar"]) } : null, search: docs["/search"] ? { head: headInfo(docs["/search"]), ...simpleMain(docs["/search"]) } : null };
const searchNav = docs["/search"]
  ? all(first(docs["/search"].root, (x) => x.tag === "main"), (x) => x.tag === "h3" && !(() => { for (let q = x.parent; q; q = q.parent) if (q.tag === "footer") return true; return false; })()).map(txt)
  : [];
out.search.searchTemplateHeadings = searchNav;
out.search.searchSortLinks = docs["/search"] ? all(docs["/search"].root, (x) => x.tag === "a" && /^\/search\?/.test(x.attrs.href || "")).map((a) => txt(a) + " -> " + a.attrs.href) : [];
out.search.headerSearchForm = (() => {
  const h = first(docs["/"].root, (x) => x.tag === "header");
  const f = first(h, (x) => x.tag === "form");
  const i = f ? first(f, (x) => x.tag === "input") : null;
  return f ? { action: f.attrs.action, inputName: i.attrs.name, placeholder: i.attrs.placeholder, role: i.attrs.role } : null;
})();
const ldSearch = all(docs["/"].root, (x) => x.tag === "script" && x.attrs.type === "application/ld+json").map((s) => JSON.parse(s.children[0].text)).find((x) => x["@type"] === "WebSite");
out.search.jsonLdSearchAction = ldSearch ? ldSearch.potentialAction.target : null;

out.cartCheckout = {
  carrito: { status: crawlStatus["/carrito"], probe: probeDocs["/carrito"] ? { status: probeDocs["/carrito"].rec.status, title: headInfo(probeDocs["/carrito"]).title } : null },
  cart: { status: crawlStatus["/cart"] },
  checkout: docs["/checkout"] ? { status: 200, head: headInfo(docs["/checkout"]), ...simpleMain(docs["/checkout"]) } : { status: crawlStatus["/checkout"] },
  cartTrigger: (() => {
    const h = first(docs["/"].root, (x) => x.tag === "header");
    const b = first(h, (x) => x.tag === "button" && x.attrs["aria-label"] === "Carrito");
    return b ? { tag: "button", type: b.attrs.type, ariaLabel: b.attrs["aria-label"], href: null } : null;
  })(),
  cartProviderInPayload: /CartProvider/.test(homeFlight.raw),
};
out.account = {};
for (const p of ["/cuenta", "/cuenta/favoritos", "/favoritos", "/login", "/registro", "/wishlist"]) {
  out.account[p] = docs[p] ? { status: 200, head: headInfo(docs[p]), ...simpleMain(docs[p]) } : { status: crawlStatus[p] };
}
out.account["/cuenta/iniciar-sesion"] = probeDocs["/cuenta/iniciar-sesion"] ? { status: 200, source: "probe", head: headInfo(probeDocs["/cuenta/iniciar-sesion"]), ...simpleMain(probeDocs["/cuenta/iniciar-sesion"]) } : { status: "NOT_PROBED" };
out.account.headerLinks = (() => {
  const h = first(docs["/"].root, (x) => x.tag === "header");
  return all(h, (x) => x.tag === "a" && /Favoritos|Cuenta/.test(x.attrs["aria-label"] || "")).map((a) => ({ label: a.attrs["aria-label"], href: a.attrs.href }));
})();
out.account.heartButtonsOnHome = all(docs["/"].root, (x) => x.tag === "button" && x.attrs["aria-label"] === "Añadir a favoritos").length;

// 8) legales
out.legal = LEGAL.map((s) => (docs["/" + s] ? legalInfo(s, docs["/" + s]) : { slug: s, status: crawlStatus["/" + s] }));

// blog
out.blog = (() => {
  const d = docs["/blog"];
  if (!d) return null;
  const arts = all(d.root, (x) => x.tag === "article");
  const posts = arts.map((a) => ({
    href: first(a, (x) => x.tag === "a").attrs.href,
    date: txt(first(a, (x) => x.tag === "p")),
    title: txt(first(a, (x) => x.tag === "h3")),
    excerpt: txt(all(a, (x) => x.tag === "p")[1]),
    imageHost: (() => {
      try {
        return new URL(imgSrc(first(a, (x) => x.tag === "img").attrs.src)).host;
      } catch {
        return null;
      }
    })(),
    probeStatus: probeDocs[first(a, (x) => x.tag === "a").attrs.href] ? probeDocs[first(a, (x) => x.tag === "a").attrs.href].rec.status : crawlStatus[first(a, (x) => x.tag === "a").attrs.href] ?? "NOT_PROBED",
  }));
  const postsDetail = Object.keys(probeDocs)
    .filter((p) => p.startsWith("/blog/"))
    .sort()
    .map((p) => {
      const dd = probeDocs[p];
      const h = headInfo(dd);
      const sm = simpleMain(dd);
      return { path: p, status: dd.rec.status, title: h.title, description: h.description, robots: h.robots, canonical: h.canonical, jsonLd: h.jsonLd, h1: sm.h1, textChars: sm.text.length, textHead: sm.text.slice(0, 300) };
    });
  return { head: headInfo(d), h1: simpleMain(d).h1, posts, postsDetail };
})();

// 9) robots + sitemap
out.robots = robotsInfo();
out.sitemap = { urls: sitemapInfo(crawlStatus) };
const sm = out.sitemap.urls;
out.sitemap.summary = {
  total: sm.length,
  byKind: sm.reduce((a, u) => ((a[u.kind] = (a[u.kind] || 0) + 1), a), {}),
  productLocs: sm.filter((u) => u.kind === "product").length,
  productsMissingFromSitemap: productPaths.filter((p) => !sm.some((u) => u.path === p)),
  sitemapProductsNotCrawled200: sm.filter((u) => u.kind === "product" && u.crawledStatus !== 200).map((u) => u.path),
  collectionsInSitemap: sm.filter((u) => u.kind === "collection").map((u) => u.path),
  collectionsServed200NotInSitemap: COLLECTIONS.filter((c) => crawlStatus["/" + c] === 200 && !sm.some((u) => u.path === "/" + c)),
  htmlPages200NotInSitemapAndRobotsIndexable: pagePaths.filter((p) => !sm.some((u) => u.path === p) && !/noindex/.test(headInfo(docs[p]).robots || "")),
  sitemapEntriesWithStatus: sm.filter((u) => u.crawledStatus !== 200).map((u) => ({ path: u.path, status: u.crawledStatus })),
  lastmodMin: sm.filter((u) => u.lastmod).map((u) => u.lastmod).sort()[0],
  lastmodMax: sm.filter((u) => u.lastmod).map((u) => u.lastmod).sort().slice(-1)[0],
  hasImageOrHreflangExtensions: /xmlns:image|xhtml:link/.test(readText(path.join(CS, "sitemap.xml.txt"))),
};
const robotsDisallow = out.robots.disallow;
out.robots.crossCheck = {
  disallowedPathsServedByCrawl: robotsDisallow.map((p) => ({ prefix: p, crawledPathsUnderPrefix: recs.map((r) => pathOf(r.url)).filter((x) => x === p || x.startsWith(p + "/") || x.startsWith(p + "?")).map((x) => x + " [" + crawlStatus[x] + "]") })),
  searchPathIsDisallowed: robotsDisallow.some((p) => "/search".startsWith(p)),
  buscarPathIsDisallowed: robotsDisallow.some((p) => "/buscar".startsWith(p)),
};

// 10) redirecciones / 404
out.redirectsAnd404 = {
  crawl404: recs.filter((r) => r.status === 404).map((r) => pathOf(r.url)),
  crawl3xx: recs.filter((r) => r.status >= 300 && r.status < 400).map((r) => ({ path: pathOf(r.url), location: r.location })),
  probe: probe.map((r) => ({ path: r.path, status: r.status, location: r.location, contentType: r.contentType, bytes: r.bytes })),
  crawlRedirectMode: "manual (ningun 3xx en las 70 URLs rastreadas)",
};

// 11) precios y ofertas
const cardsAll = [];
for (const c of out.collections) for (const k of c.cards || []) cardsAll.push({ from: "/" + c.slug, ...k });
for (const car of out.home.carousels) for (const k of car.cards) cardsAll.push({ from: "/#" + (car.heading || ""), ...k });
const pdp = Object.fromEntries(out.products.map((p) => [p.slug.toLowerCase(), p]));
const priceRows = out.products.map((p) => {
  const cardInCollections = cardsAll.filter((c) => c.from.startsWith("/") && !c.from.startsWith("/#") && c.href && c.href.toLowerCase() === "/producto/" + p.slug.toLowerCase());
  return {
    slug: p.slug,
    pdpPrice: p.price,
    pdpCompareAt: p.compareAt,
    pdpDiscountLabel: p.discountLabel,
    jsonLdPrice: p.jsonLd.product && p.jsonLd.product.offer ? Number(p.jsonLd.product.offer.price) : null,
    ratio: p.compareAt ? Math.round((p.price / p.compareAt) * 10000) / 10000 : null,
    pdpEqualsRound80: p.compareAt ? Math.round(p.compareAt * 0.8) === p.price : null,
    collectionCards: cardInCollections.map((c) => ({ from: c.from, price: c.price, compareAt: c.compareAt, label: c.discountLabel })),
    cardsConsistentWithPdp: cardInCollections.every((c) => c.price === p.price && c.compareAt === p.compareAt),
  };
});
out.prices = {
  rows: priceRows,
  compareAtDistribution: priceRows.reduce((a, r) => ((a[r.pdpCompareAt] = (a[r.pdpCompareAt] || 0) + 1), a), {}),
  priceDistribution: priceRows.reduce((a, r) => ((a[r.pdpPrice] = (a[r.pdpPrice] || 0) + 1), a), {}),
  allDiscountLabels: [...new Set(priceRows.map((r) => r.pdpDiscountLabel))],
  allEqualRound80: priceRows.every((r) => r.pdpEqualsRound80),
  allCardsConsistent: priceRows.every((r) => r.cardsConsistentWithPdp),
  jsonLdPriceEqualsPdpPrice: priceRows.every((r) => r.jsonLdPrice === r.pdpPrice),
  jsonLdHasCompareAtOrValidUntil: out.products.some((p) => p.jsonLd.product && (p.jsonLd.product.offer.hasPriceValidUntil || p.jsonLd.product.offer.hasCompareAt)),
  promoTextsOnHome: [out.shell.sample.announcement, out.home.promo && out.home.promo.h2, ...(out.home.promo ? out.home.promo.paragraphs : [])].filter(Boolean),
  promoEndDateInServedHtml: /hasta el|vence|válido hasta|termina/i.test(docs["/"].html.replace(/<script[\s\S]*?<\/script>/g, "")),
  freeShippingThreshold: {
    homePromoParagraph: (out.home.promo ? out.home.promo.paragraphs : []).find((t) => /Envío gratis/.test(t)) || null,
    pdpAccordionsMentioning: out.products.filter((p) => p.accordions.some((a) => a.lines.join(" ").includes("299.900"))).length,
    legalPagesMentioning: out.legal.filter((l) => l.mentionsFreeShippingThreshold).map((l) => l.slug),
  },
};

// productos vs Dev Store
const devLines = readText(path.join(EV, "dev-products.jsonl")).trim().split("\n").map((l) => JSON.parse(l));
const devBy = Object.fromEntries(devLines.map((p) => [p.h, p]));
const norm = (s) => String(s || "").replace(/[•\n\r]+/g, " ").replace(/\s+/g, " ").trim();
out.productsVsDev = out.products.map((p) => {
  const dv = devBy[p.slug.toLowerCase()];
  if (!dv) return { slug: p.slug, dev: "NO_EN_DEV" };
  const curSizes = p.sizes.map((s) => s.label);
  const devSizes = dv.vr.map((v) => v[0]);
  return {
    slug: p.slug,
    handleDev: dv.h,
    titleEqual: p.h1 === dv.t,
    titleCurrent: p.h1,
    titleDev: dv.t,
    priceEqual: dv.vr.every((v) => Number(v[2]) === p.price),
    compareAtEqual: dv.vr.every((v) => Number(v[3]) === p.compareAt),
    sizesCurrent: curSizes,
    sizesDev: devSizes,
    sizesEqual: JSON.stringify(curSizes) === JSON.stringify(devSizes),
    skuCurrent: p.sku,
    skuDevBase: dv.vr[0][1].replace(/-[A-Z]+$/, ""),
    skuEqual: dv.vr.every((v) => v[1].startsWith(p.sku)),
    imagesCurrent: p.jsonLd.product ? p.jsonLd.product.imageIds.length : null,
    imagesDev: dv.im.length,
    // Shopify agrega un sufijo _<uuid> al nombre cuando ya existe otro archivo con el mismo nombre: se normaliza
    imageIdsEqualInOrder: p.jsonLd.product ? JSON.stringify(p.jsonLd.product.imageIds.map((x) => (x || "").toLowerCase())) === JSON.stringify(dv.im.map((x) => x.toLowerCase().replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\.)/, ""))) : null,
    galleryIdsEqualJsonLd: JSON.stringify(p.gallery.ids) === JSON.stringify(p.jsonLd.product ? p.jsonLd.product.imageIds : null),
    categoryCurrent: p.jsonLd.product ? p.jsonLd.product.category : null,
    categoryDev: dv.ty,
    colorCurrent: p.color,
    colorDev: (dv.color || "").replace(/^Color:\s*/, ""),
    descriptionEqual: norm(p.jsonLd.product ? p.jsonLd.product.description : "") === norm(dv.desc),
    breadcrumbCurrent: p.breadcrumbVisible,
    breadcrumbDev: dv.crumbs,
    hasFavoriteCurrent: !!p.favoriteButton,
    hasFavoriteDev: dv.heart,
    ldjsonCurrent: p.head.jsonLd.length,
    ldjsonDev: dv.ldjson,
    metaDescCharsCurrent: (p.head.description || "").length,
    metaDescCharsDev: dv.metaDesc,
  };
});

// 12) CTA y copy clave (frecuencias sobre todas las paginas HTML)
const ctaOcc = {};
const ctaPages = {};
const addCta = (t, kind, p) => {
  if (!t) return;
  const k = kind + " | " + t;
  ctaOcc[k] = (ctaOcc[k] || 0) + 1;
  (ctaPages[k] = ctaPages[k] || new Set()).add(p);
};
for (const p of pagePaths) {
  const d = docs[p];
  const main = first(d.root, (x) => x.tag === "main");
  for (const b of all(d.root, (x) => x.tag === "button")) addCta(txt(b) || b.attrs["aria-label"], "button", p);
  for (const a of all(main, (x) => x.tag === "a" && /rounded-full/.test(cls(x)) && txt(x))) addCta(txt(a), "link-cta", p);
}
out.ctas = Object.entries(ctaOcc)
  .map(([k, v]) => ({ cta: k, occurrences: v, pagesContaining: ctaPages[k].size }))
  .sort((a, b) => b.pagesContaining - a.pagesContaining || b.occurrences - a.occurrences || a.cta.localeCompare(b.cta));
out.copy = {
  voseoMarkers: (() => {
    const hits = [];
    const re = /(?<![\p{L}])(Dejá|recibí|Buscá|Escribí|Probá|Guardá|Volvé|explorá|Podés|navegás|tenés|consultá|Ingresá|Registrate|Descubrí|agregá)(?![\p{L}])/gu;
    for (const p of pagePaths) {
      const t = txt(first(docs[p].root, (x) => x.tag === "main")) + " " + (docs[p].html.match(/content="[^"]*"/g) || []).join(" ");
      const m = t.match(re);
      if (m) hits.push({ path: p, words: [...new Set(m)].sort() });
    }
    return hits;
  })(),
  tuteoMarkers: (() => {
    const hits = [];
    const re = /(?<![\p{L}])(Tienes|tienes|Contáctanos|puedes|Puedes|Tu carrito|tu carrito)(?![\p{L}])/gu;
    for (const p of pagePaths) {
      const t = txt(first(docs[p].root, (x) => x.tag === "main"));
      const m = t.match(re);
      if (m) hits.push({ path: p, words: [...new Set(m)].sort() });
    }
    return hits;
  })(),
};

// 13) responsive (solo HTML servido)
const bpRe = /(?:^|\s)((?:sm|md|lg|xl|2xl):[^\s"]+)/g;
const bpCount = { sm: 0, md: 0, lg: 0, xl: 0, "2xl": 0 };
let darkCount = 0;
let motionReduce = 0;
for (const p of pagePaths) {
  for (const m of docs[p].html.matchAll(/class="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) {
      const b = c.match(/^(sm|md|lg|xl|2xl):/);
      if (b) bpCount[b[1]]++;
      if (/^dark:/.test(c)) darkCount++;
      if (/^motion-reduce:/.test(c)) motionReduce++;
    }
  }
}
const homeCls = docs["/"].html.match(/class="([^"]*)"/g) || [];
const heroSec = first(docs["/"].root, (x) => x.tag === "section" && x.attrs.id === "hero");
out.responsive = {
  viewportMetaValues: [...new Set(pagePaths.map((p) => headInfo(docs[p]).viewport))],
  breakpointTokenCountsAcrossAllHtml: bpCount,
  darkVariantTokens: darkCount,
  motionReduceTokens: motionReduce,
  stylesheetsPerPage: [...new Set(pagePaths.map((p) => headInfo(docs[p]).stylesheets))],
  cssFilesDownloaded: false,
  heroLayoutClasses: heroSec ? cls(heroSec).split(/\s+/).filter((c) => /aspect|min-h|sm:|md:|lg:/.test(c)) : null,
  headerControlVisibility: out.shell.sample.header.controls.map((c) => ({ label: c.label, tag: c.tag, visibility: c.visibilityClasses })),
  headerNavVisibility: out.shell.sample.header.navVisibility,
  mobileMenuButton: (() => {
    const b = first(first(docs["/"].root, (x) => x.tag === "header"), (x) => x.tag === "button" && x.attrs["aria-label"] === "Abrir menú");
    return b ? { present: true, wrapperClasses: cls(b.parent).split(/\s+/).filter((c) => /lg:|hidden|flex/.test(c)).join(" ") } : { present: false };
  })(),
  homeCarouselCardWidth: (() => {
    const c = all(docs["/"].root, (x) => x.attrs && x.attrs["data-card"] === "true")[0];
    return c ? cls(c).split(/\s+/).filter((k) => /^(w-|sm:w|lg:w|md:w)/.test(k)).join(" ") : null;
  })(),
  collectionGridClasses: [...new Set(out.collections.filter((c) => c.gridClassesMobileToDesktop).map((c) => c.gridClassesMobileToDesktop))],
  collectionCardImageSizes: (() => {
    const im = first(docs["/oasis-natural"].root, (x) => x.tag === "img" && /min-width/.test(x.attrs.sizes || "") && /25vw/.test(x.attrs.sizes));
    return im ? im.attrs.sizes : null;
  })(),
  pdpImageSizes: (() => {
    const im = first(docs["/producto/alba-dorada-cafe-claro"].root, (x) => x.tag === "img" && /66vw/.test(x.attrs.sizes || ""));
    return im ? im.attrs.sizes : null;
  })(),
  footerGridClasses: (() => {
    const f = first(docs["/"].root, (x) => x.tag === "footer");
    const g = first(f, (x) => /grid/.test(cls(x)) && /md:grid-cols/.test(cls(x)));
    return g ? cls(g).split(/\s+/).filter((k) => /grid|gap|md:|lg:/.test(k)).join(" ") : null;
  })(),
  cookieBannerLayout: (() => {
    const b = all(docs["/"].root, (x) => x.tag === "div" && x.parent && x.parent.tag === "body" && /Usamos cookies/.test(txt(x)))[0];
    return b ? cls(b).split(/\s+/).filter((k) => /fixed|inset|bottom|max-w|dark:/.test(k)).join(" ") : null;
  })(),
  collectionStickyBar: (() => {
    const b = first(docs["/oasis-natural"].root, (x) => x.tag === "div" && /sticky/.test(cls(x)) && /top-16/.test(cls(x)));
    return b ? cls(b).split(/\s+/).filter((k) => /sticky|top-|z-/.test(k)).join(" ") : null;
  })(),
  filtersAsideClasses: (() => {
    const a = first(docs["/oasis-natural"].root, (x) => x.tag === "aside");
    return a ? cls(a).split(/\s+/).join(" ") : null;
  })(),
};

// consistencia de la home contra las colecciones
const oasis = out.collections.find((c) => c.slug === "oasis-natural");
out.homeVsCollections = {
  editorialCarouselProducts: out.home.carousels[0] ? out.home.carousels[0].cards.map((c) => c.href) : null,
  editorialCarouselEqualsOasisFirst8: out.home.carousels[0] && oasis ? JSON.stringify(out.home.carousels[0].cards.map((c) => c.href)) === JSON.stringify(oasis.cards.slice(0, 8).map((c) => c.href)) : null,
  featuredProducts: out.home.carousels[1] ? out.home.carousels[1].cards.map((c) => c.href) : null,
};

// verificaciones cruzadas contra el repo (inventario y colecciones)
out.crossChecks = {
  productPathsCrawled200: productPaths.length,
  everyProductInExactlyOneCollection: (() => {
    const map = {};
    for (const c of out.collections) for (const k of c.cards || []) (map[k.href.toLowerCase()] = map[k.href.toLowerCase()] || []).push(c.slug);
    const per = productPaths.map((p) => (map[p.toLowerCase()] || []).length);
    return { productsListedByCollections: Object.keys(map).length, allExactlyOne: per.every((n) => n === 1), collectionsPerProduct: per.reduce((a, n) => ((a[n] = (a[n] || 0) + 1), a), {}) };
  })(),
  collectionCountsVsLabel: out.collections.map((c) => ({ slug: c.slug, label: c.countText, cardsInHtml: c.productCount })),
  badgeMatchesCollection: out.collections
    .filter((c) => c.cards && c.cards.length)
    .map((c) => ({ slug: c.slug, badges: [...new Set(c.cards.map((k) => k.badge))] })),
};

// payload de productos (agregado): stock por talla, descuento, destacados, contador de vistas
const pl = out.products.map((p) => ({ slug: p.slug, ...p.payload }));
out.payloadAggregate = {
  productsWithPayloadObject: pl.filter((x) => x.found).length,
  internalIdPresentInPayload: pl.filter((x) => x.hasInternalId).length,
  keysUnion: [...new Set(pl.flatMap((x) => x.keys || []))].sort(),
  activeDiscountPercentValues: [...new Set(pl.map((x) => x.activeDiscountPercent))],
  sizeStockValues: [...new Set(pl.flatMap((x) => Object.values(x.sizeStock || {})))].sort((a, b) => a - b),
  totalStockValues: [...new Set(pl.map((x) => x.totalStock))].sort((a, b) => a - b),
  totalSizesInPayload: pl.reduce((s, x) => s + (x.sizes || []).length, 0),
  sizesPayloadEqualDomSizes: out.products.every((p) => JSON.stringify((p.payload.sizes || []).slice()) === JSON.stringify(p.sizes.map((s) => s.label))),
  featuredTrue: pl.filter((x) => x.featured === true).map((x) => x.slug),
  featuredEqualsHomeFeaturedSet: (() => {
    const home = new Set((out.home.carousels[1] ? out.home.carousels[1].cards : []).map((c) => c.href.replace("/producto/", "").toLowerCase()));
    const f = new Set(pl.filter((x) => x.featured === true).map((x) => x.slug.toLowerCase()));
    return home.size === f.size && [...home].every((h) => f.has(h));
  })(),
  featuredMinusEditorialCarouselEqualsHomeFeaturedSet: (() => {
    const ed = new Set((out.home.carousels[0] ? out.home.carousels[0].cards : []).map((c) => c.href.replace("/producto/", "").toLowerCase()));
    const rest = new Set(pl.filter((x) => x.featured === true && !ed.has(x.slug.toLowerCase())).map((x) => x.slug.toLowerCase()));
    const home = new Set((out.home.carousels[1] ? out.home.carousels[1].cards : []).map((c) => c.href.replace("/producto/", "").toLowerCase()));
    return { featuredFlagged: pl.filter((x) => x.featured === true).length, editorialCarousel: ed.size, remaining: rest.size, shownOnHome: home.size, equal: rest.size === home.size && [...rest].every((h) => home.has(h)) };
  })(),
  viewsCounter: {
    showViewsTrue: pl.filter((x) => x.showViews === true).length,
    displayedValues: pl.map((x) => x.displayedViews).sort((a, b) => a - b),
    realViewsValues: pl.map((x) => x.realViews).sort((a, b) => a - b),
    promotionalViewsValues: [...new Set(pl.map((x) => x.promotionalViews))],
    displayedEqualsSixTimesReal: pl.filter((x) => x.displayedEqualsSixTimesReal === true).length,
    displayedEqualsRealPlusPromo: pl.filter((x) => x.displayedViews === x.realViews + x.promotionalViews).length,
  },
  priceDisplayStringSample: (() => {
    const p = out.products[0];
    return p.payload && p.payload.priceValue ? { priceValue: p.payload.priceValue, originalPriceValue: p.payload.originalPriceValue } : null;
  })(),
};

// uniformidad de acordeones entre las 29 fichas
out.accordionUniformity = ["Descripción", "Cuidados de la prenda", "Envíos, devoluciones y garantía", "Métodos de pago"].map((t) => {
  const sigs2 = out.products.map((p) => JSON.stringify((p.accordions.find((a) => a.title === t) || { lines: null }).lines));
  return { title: t, distinctTexts: new Set(sigs2).size, productsWithAccordion: out.products.filter((p) => p.accordions.some((a) => a.title === t)).length };
});
out.sizeGuide = {
  productsWithGuideButton: out.products.filter((p) => p.sizeGuideButton).map((p) => p.slug),
  allInOasisNatural: out.products.filter((p) => p.sizeGuideButton).every((p) => p.jsonLd.product.category === "Oasis Natural"),
  oasisProductsWithoutGuide: out.products.filter((p) => p.jsonLd.product.category === "Oasis Natural" && !p.sizeGuideButton).map((p) => p.slug),
};

// manifiesto de media (content/media/media-migration-manifest.csv) contra lo servido hoy
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}
{
  const rows = parseCsv(readText(path.join(MIG, "content", "media", "media-migration-manifest.csv")));
  const h = rows[0];
  const hay = pagePaths.map((p) => docs[p].html + "\n" + docs[p].flight.raw).join("\n");
  const homeHay = docs["/"].html + "\n" + docs["/"].flight.raw;
  out.mediaManifestCrossCheck = rows
    .slice(1)
    .filter((r) => r[0])
    .map((r) => {
      const src = r[h.indexOf("source")];
      const base = (src.match(/([^/\\]+?)(?:\.\w+)?(?:\s|\)|$)/) || [])[1];
      const cid = (src.match(/\/([A-Za-z0-9_-]+)\.(?:jpg|jpeg|png|webp|mp4|mov)$/i) || [])[1] || (src.startsWith("repo:") ? "1 (1)" : null);
      return {
        id: r[0],
        asset: r[h.indexOf("asset")],
        status: r[h.indexOf("status")],
        idInServedHtmlOrPayload: cid ? hay.includes(cid) : null,
        idInHome: cid ? homeHay.includes(cid) : null,
        idInAnyPdp: cid ? out.products.some((p) => (docs["/producto/" + p.slug].html + docs["/producto/" + p.slug].flight.raw).includes(cid)) : null,
        base,
      };
    });
}

// hosts absolutos (src/href/poster/content) en el HTML servido: solo para constatar terceros
const absHosts = {};
for (const p of pagePaths) {
  for (const m of docs[p].html.matchAll(/(?:src|href|poster|content)="(https?:\/\/[^"]+)"/g)) {
    try {
      const h = new URL(m[1]).host;
      absHosts[h] = (absHosts[h] || 0) + 1;
    } catch {
      /* url no valida: se ignora */
    }
  }
}
out.absoluteHostsInServedHtml = Object.entries(absHosts).map(([h, n]) => ({ host: h, occurrences: n })).sort((a, b) => a.host.localeCompare(b.host));
out.trackerScriptsInServedHtml = {
  googletagmanagerOrGtag: pagePaths.filter((p) => /googletagmanager|gtag\(/.test(docs[p].html)).length,
  facebookPixel: pagePaths.filter((p) => /connect\.facebook\.net|fbq\(/.test(docs[p].html)).length,
  externalScriptTags: pagePaths.reduce((s, p) => s + all(docs[p].root, (x) => x.tag === "script" && /^https?:/.test(x.attrs.src || "")).length, 0),
  note: "Solo HTML servido; scripts que el JS de cliente inyecte despues NO_VERIFIED.",
};

// hosts de media (img/video/background/preload/og:image) en todas las paginas 200
const hostCount = {};
const addHost = (u, kind) => {
  if (!u) return;
  let h;
  if (u.startsWith("/")) h = "(mismo origen) " + (u.startsWith("/_next/") ? "/_next/*" : u.split("/").slice(0, 3).join("/"));
  else {
    try {
      const uu = new URL(u);
      h = uu.host + (uu.host === "res.cloudinary.com" ? " " + uu.pathname.split("/").slice(2, 6).join("/").replace(/\/v\d+.*$/, "") : "");
    } catch {
      h = "?";
    }
  }
  const k = kind + " | " + h;
  hostCount[k] = (hostCount[k] || 0) + 1;
};
for (const p of pagePaths) {
  const d = docs[p];
  for (const i of all(d.root, (x) => x.tag === "img")) addHost(imgSrc(i.attrs.src), "img");
  for (const v of all(d.root, (x) => x.tag === "video")) {
    addHost(v.attrs.src, "video-src");
    addHost(v.attrs.poster, "video-poster");
  }
  for (const x of all(d.root, (y) => y.attrs && /background-image/.test(y.attrs.style || ""))) addHost(styleUrl(x.attrs.style), "background-image");
}
out.mediaHosts = Object.entries(hostCount).map(([k, v]) => ({ kindAndHost: k, occurrences: v })).sort((a, b) => a.kindAndHost.localeCompare(b.kindAndHost));

// comparacion contra la captura Dev Store (dev-home.json y dev-collections.json; captura RC1.7 segun su _note)
const devHome = JSON.parse(readText(path.join(EV, "dev-home.json")));
const devCols = JSON.parse(readText(path.join(EV, "dev-collections.json")));
const dSec = (id) => devHome.sections.find((s) => s.id === id) || {};
const curCar = out.home.carousels;
const slugsOf = (cards) => cards.map((c) => c.href.replace("/producto/", "").toLowerCase());
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
out.homeVsDev = {
  devCaptureNote: devHome._note,
  announcementEqual: out.shell.sample.announcement === (dSec("announcement-bar").text || null),
  heroH1Equal: out.home.hero.h1 === dSec("hero").h1,
  heroSubtitleEqual: out.home.hero.subtitle === dSec("hero").sub,
  heroCtaCurrent: out.home.hero.ctas.map((c) => c.text + " -> " + c.href),
  heroCtaDev: dSec("hero").cta || null,
  heroMedia: { current: "video mp4 con poster", dev: dSec("hero").variant },
  categoryCards: {
    current: out.home.categories.cards.map((c) => c.name + " | " + c.text),
    devTexts: (dSec("featured-categories").cards || []).map((c) => c.h3 + " | " + c.sub),
  },
  editorialCarousel: {
    currentSlugs: slugsOf(curCar[0].cards),
    devSlugs: dSec("featured-collection-editorial").products || [],
    sameSet: sameSet(slugsOf(curCar[0].cards), dSec("featured-collection-editorial").products || []),
    sameOrder: JSON.stringify(slugsOf(curCar[0].cards)) === JSON.stringify(dSec("featured-collection-editorial").products || []),
  },
  featuredProducts: {
    currentSlugs: slugsOf(curCar[1].cards),
    devSlugs: dSec("featured-products").products || [],
    sameSet: sameSet(slugsOf(curCar[1].cards), dSec("featured-products").products || []),
    sameOrder: JSON.stringify(slugsOf(curCar[1].cards)) === JSON.stringify(dSec("featured-products").products || []),
  },
  promo: { currentCta: out.home.promo.ctas[0].text + " -> " + out.home.promo.ctas[0].href, devCta: dSec("promo-banner").cta || null, currentShippingParagraph: out.home.promo.paragraphs[1] || null },
  newsletter: { currentButton: out.home.newsletter.form.button, devButton: dSec("newsletter-home").cta || null, copyEqual: out.home.newsletter.copy === dSec("newsletter-home").text },
  footer: {
    taglineEqual: out.shell.sample.footer.tagline === devHome.footer.tagline,
    currentColumns: out.shell.sample.footer.columns.map((c) => c.heading + ": " + c.links.map((l) => l.text).join(", ")),
    devColumnComprar: devHome.footer.columnComprar,
    devColumnAyuda: devHome.footer.columnAyuda,
  },
  headerNav: { current: out.shell.sample.header.nav.map((n) => n.text), dev: devHome.headerNav },
  recommendedSection: { current: "no aparece como texto en el HTML servido; el payload trae el componente de cliente RecommendedForYou (ver home.recommendedForYou); su render real es solo cliente", dev: dSec("recommended-products").state || null },
};
out.collectionsVsDev = out.collections.map((c) => {
  const dv = devCols.collections.find((x) => x.h === c.slug);
  if (!dv) return { slug: c.slug, dev: "NO_EXISTE_EN_LA_CAPTURA_DEV" };
  const cur = (c.cards || []).map((k) => k.href.replace("/producto/", "").toLowerCase());
  return {
    slug: c.slug,
    countCurrent: c.productCount,
    countDev: dv.n,
    sameSet: sameSet(cur, dv.order || []),
    sameOrder: JSON.stringify(cur) === JSON.stringify(dv.order || []),
    positionMatches: cur.filter((s, i) => (dv.order || [])[i] === s).length,
    currentOrder: cur,
    devOrder: dv.order,
    filterGroupsCurrent: c.filterGroups.map((g) => g.group),
    filterGroupsDev: dv.filterGroups,
    bannerImageCurrent: c.hero.background.kind === "background-image",
    bannerImageDev: dv.bannerImg,
    metaDescCharsCurrent: (c.head.description || "").length,
    metaDescCharsDev: dv.metaDescChars,
  };
});
out.devCaptureLimit = "dev-home.json, dev-collections.json y dev-products.jsonl declaran captura con el theme RC1.7 (sin publicar); el theme vigente es RC1.8. Las comparaciones contra Dev son contra esa captura.";

// 03G (verificador adversarial): hechos del payload RSC y de hosts que el extractor original no recogia.
// Solo lectura del HTML guardado; sin red. Campos nuevos, no cambian los anteriores (salvo recommendedSection.current).
{
  const compNames = {};
  const flagCounts = {};
  const rawHosts = {};
  for (const p of pagePaths) {
    const raw = docs[p].flight.raw;
    const namesInPage = new Set();
    for (const line of raw.split("\n")) {
      const mm = line.match(/^[0-9a-f]+:I\[.*,"([A-Za-z0-9_]+)"(?:,\d)?\]$/);
      if (mm) namesInPage.add(mm[1]);
    }
    for (const n of namesInPage) compNames[n] = (compNames[n] || 0) + 1;
    const fm = raw.match(/"ga4Active":(true|false),"metaPixelActive":(true|false)/);
    const fk = fm ? fm[0] : "NONE";
    flagCounts[fk] = (flagCounts[fk] || 0) + 1;
    const hostsInPage = new Set();
    for (const m of docs[p].html.matchAll(/https?(?::|%3A|\\u003a)(?:\/\/|%2F%2F|\\\/\\\/)([a-zA-Z0-9.-]+)/g)) hostsInPage.add(m[1].toLowerCase());
    for (const h of hostsInPage) rawHosts[h] = (rawHosts[h] || 0) + 1;
  }
  out.payloadClientComponents = Object.entries(compNames).map(([name, pages]) => ({ name, pages })).sort((a, b) => a.name.localeCompare(b.name));
  out.analyticsFlagsInPayload = { note: "props de AnalyticsLoader en el payload RSC, por pagina HTML; no prueba que no se inyecten scripts despues", counts: flagCounts };
  out.rawHostsAnyContext = Object.entries(rawHosts).map(([host, pages]) => ({ host, pages })).sort((a, b) => a.host.localeCompare(b.host));
  const rec = docs["/"].flight.raw.match(/"excludeSlugs":(\[[^\]]*\])/);
  let recSlugs = null;
  try {
    recSlugs = rec ? JSON.parse(rec[1]) : null;
  } catch {
    recSlugs = null;
  }
  out.home.recommendedForYou = {
    componentInPayload: /"RecommendedForYou"\]/.test(docs["/"].flight.raw),
    excludeSlugsCount: recSlugs ? recSlugs.length : null,
    excludeSlugs: recSlugs,
    note: "componente de cliente: el HTML servido no trae su salida; que se pinte tras hidratar es NOT_VERIFIED",
  };
}

const finalObj = stable(redactDeep(out));
const json = JSON.stringify(finalObj, null, 1);
const LEAK = /wa\.me\/\d|\+57|\b3\d{2}[\s-]\d{3}[\s-]\d{4}\b|\b3\d{9}\b/;
if (LEAK.test(json)) {
  // guarda contra fuga del telefono (enlace wa.me con digitos, prefijo +57 o celular colombiano)
  const m = json.match(new RegExp(".{20}(" + LEAK.source + ").{10}"));
  console.error("AVISO: posible numero telefonico en la salida:", m && m[0]);
  process.exitCode = 2;
}
fs.writeFileSync(OUT, json + "\n");
console.log("OK", OUT, json.length, "bytes; sha256", sha256(json + "\n"));
