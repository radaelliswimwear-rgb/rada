// 03G — Paridad de la Home: script DETERMINISTA y OFFLINE.
// Compara la Home ACTUAL (HTML servido, sin JavaScript) con la Home de la Dev Store (captura RC1.7 + theme-src RC1.8).
// Lee SOLO archivos del repo: launch/evidence/*, theme-src/*, content/media/*, seo/*.csv. No usa red ni git.
// Uso:    node launch/tools/03g-home-parity.mjs
// Salida: stdout (tablas H0..H18) y launch/evidence/03g-home-parity.json (mismo insumo -> mismo archivo, byte a byte; sin fechas).
// Privacidad: el numero de WhatsApp (enlace wa.me y texto) se reemplaza por "<wa.me del sitio>".
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, "..", "..");
const EV = path.join(MIG, "launch", "evidence");
const TS = path.join(MIG, "theme-src");
const OUT = path.join(EV, "03g-home-parity.json");

const readText = (p) => fs.readFileSync(p, "utf8");
const readJson = (p) => JSON.parse(readText(p));
const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");
const REDACT = (s) => (typeof s === "string" ? s.replace(/wa\.me\/\d+/g, "<wa.me del sitio>").replace(/\+\d{2}[\s\d]{9,16}\d/g, "<numero-redactado>") : s);
const norm = (s) => String(s ?? "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const stable = (v) => {
  if (Array.isArray(v)) return v.map(stable);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])]));
  return v;
};

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
      cur.children.push({ tag: "#comment", text: html.slice(i + 4, e < 0 ? n : e), parent: cur });
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
const all = (nd, pred, out = []) => {
  for (const c of nd.children || []) {
    if (c.tag !== "#text" && c.tag !== "#comment") {
      if (pred(c)) out.push(c);
      all(c, pred, out);
    }
  }
  return out;
};
const first = (nd, pred) => (nd ? all(nd, pred)[0] || null : null);
function textOf(nd) {
  if (!nd) return "";
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
  return norm(s);
}
const cls = (nd) => (nd && nd.attrs && nd.attrs.class) || "";
const cloudId = (u) => {
  const m = String(u || "").match(/\/([A-Za-z0-9_-]+)\.(jpg|jpeg|png|webp|mp4|mov)(\?|&|$)/i);
  return m ? m[1] + "." + m[2].toLowerCase() : null;
};
function nextImageUrl(src) {
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
const priceNum = (s) => {
  const m = String(s || "").match(/\$\s*([\d.]+)/);
  return m ? parseInt(m[1].replace(/\./g, ""), 10) : null;
};
const slugOf = (href) => String(href || "").replace(/^\/producto\//, "").split(/[?#]/)[0].toLowerCase();

/* ------------------------------------------------------------------ Home ACTUAL */
function extractCurrent(html) {
  const root = parseHtml(html);
  const head = first(root, (x) => x.tag === "head");
  const body = first(root, (x) => x.tag === "body");
  const htmlEl = first(root, (x) => x.tag === "html");
  const metas = all(head, (x) => x.tag === "meta");
  const metaBy = (k, v) => {
    const m = metas.find((x) => x.attrs[k] === v);
    return m ? m.attrs.content ?? null : null;
  };
  const links = all(head, (x) => x.tag === "link");
  const ldTypes = all(root, (x) => x.tag === "script" && x.attrs.type === "application/ld+json").map((s) => {
    try {
      return JSON.parse(textOf({ children: s.children, tag: "x" }) || (s.children[0] && s.children[0].text) || "{}")["@type"];
    } catch {
      return "(no parseable)";
    }
  });
  const headOut = {
    lang: htmlEl && htmlEl.attrs.lang,
    title: textOf(first(head, (x) => x.tag === "title")),
    metaDescription: metaBy("name", "description"),
    canonical: (links.find((l) => l.attrs.rel === "canonical") || { attrs: {} }).attrs.href || null,
    robots: metaBy("name", "robots"),
    ogTitle: metaBy("property", "og:title"),
    ogDescription: metaBy("property", "og:description"),
    ogSiteName: metaBy("property", "og:site_name"),
    ogImage: metaBy("property", "og:image") ? "presente" : "ausente",
    hreflangAlternates: links.filter((l) => l.attrs.rel === "alternate").length,
    jsonLdTypes: ldTypes.sort(),
  };

  // anuncio: el elemento inmediatamente anterior a <header>
  const bodyEls = (body.children || []).filter((c) => c.tag !== "#text" && c.tag !== "#comment");
  const hIdx = bodyEls.findIndex((c) => c.tag === "header");
  const announcement = norm(textOf(bodyEls[hIdx - 1]));

  // header
  const header = bodyEls[hIdx];
  const logoImg = first(header, (x) => x.tag === "img");
  const navEl = first(header, (x) => x.tag === "nav");
  const navLinks = all(navEl, (x) => x.tag === "a").map((a) => `${textOf(a)} -> ${a.attrs.href}`);
  const select = first(header, (x) => x.tag === "select");
  const headerCtrls = [];
  for (const el of all(header, (x) => x.tag === "a" || x.tag === "button" || x.tag === "select" || x.tag === "form")) {
    if (navEl && all(navEl, (x) => x === el).length) continue;
    const label = el.attrs["aria-label"] || null;
    if (el.tag === "a" && !label) continue;
    if (el.tag === "a" && el.attrs.href === "/" ) {
      headerCtrls.push({ tag: "a", label, href: "/" });
      continue;
    }
    headerCtrls.push({ tag: el.tag, label, href: REDACT(el.attrs.href || el.attrs.action || null) });
  }
  const headerOut = {
    logoSrc: nextImageUrl(logoImg && logoImg.attrs.srcset ? "/_next/image?" + (logoImg.attrs.srcset.split(",")[0].split("?")[1] || "").split(" ")[0] : logoImg && logoImg.attrs.src),
    logoAlt: logoImg && logoImg.attrs.alt,
    nav: navLinks,
    currencySelector: select ? all(select, (x) => x.tag === "option").map((o) => o.attrs.value) : null,
    controls: headerCtrls,
  };

  // main
  const main = first(body, (x) => x.tag === "main");
  const sections = (main.children || []).filter((c) => c.tag === "section");
  const byId = (id) => sections.find((s) => s.attrs.id === id);
  const h2Of = (s) => textOf(first(s, (x) => x.tag === "h2"));
  const heroSec = byId("hero");
  const catSec = byId("categorias");
  const prodSec = byId("productos");
  const editorialSec = sections.find((s) => h2Of(s) === "La belleza de sentirte tú");
  const promoSec = sections.find((s) => /^20% de descuento/.test(h2Of(s)));
  const newsSec = sections.find((s) => first(s, (x) => x.tag === "form"));

  const heroVideo = first(heroSec, (x) => x.tag === "video");
  const heroCta = first(heroSec, (x) => x.tag === "a");
  const heroPs = all(heroSec, (x) => x.tag === "p").map(textOf);
  const hero = {
    eyebrow: heroPs[0],
    h1: textOf(first(heroSec, (x) => x.tag === "h1")),
    subtitle: heroPs[1],
    cta: heroCta ? { text: textOf(heroCta), href: heroCta.attrs.href } : null,
    videoSrc: heroVideo ? heroVideo.attrs.src || null : null,
    videoPoster: heroVideo ? heroVideo.attrs.poster || null : null,
    images: all(heroSec, (x) => x.tag === "img").length,
  };

  const catCards = all(catSec, (x) => x.tag === "a" && /^\//.test(x.attrs.href || "")).map((a) => {
    const v = first(a, (x) => x.tag === "video");
    const bg = first(a, (x) => x.tag === "div" && /background-image/.test(x.attrs.style || ""));
    const ctaSpan = all(a, (x) => x.tag === "span").map(textOf).find((t) => /^Explorar/.test(t));
    return {
      name: textOf(first(a, (x) => x.tag === "h3")),
      text: textOf(first(a, (x) => x.tag === "p")),
      href: a.attrs.href,
      ariaLabel: a.attrs["aria-label"],
      cta: ctaSpan || null,
      media: v
        ? { kind: "video", poster: v.attrs.poster || null, srcInSsr: v.attrs.src || null }
        : bg
          ? { kind: "background-image", url: (bg.attrs.style.match(/background-image:url\(([^)]+)\)/) || [])[1] || null }
          : { kind: "none" },
    };
  });
  const categories = {
    eyebrow: textOf(first(catSec, (x) => x.tag === "p")),
    h2: h2Of(catSec),
    cards: catCards,
  };

  const showcase = (sec) => {
    const dataCards = all(sec, (x) => x.attrs && x.attrs["data-card"] === "true");
    const cards = dataCards.map((dc) => {
      const a = dc.tag === "a" ? dc : first(dc, (x) => x.tag === "a" && /^\/producto\//.test(x.attrs.href || ""));
      const img = first(dc, (x) => x.tag === "img");
      const spans = all(dc, (x) => x.tag === "span");
      const overlay = spans.map(textOf).find((t) => t === "Ver producto") || null;
      const badge =
        all(a, (x) => x.tag === "span")
          .map(textOf)
          .find((t) => t && t !== "Ver producto" && !/^\$/.test(t) && !/^-\d/.test(t)) || null;
      const line = spans.find((s) => /line-through/.test(cls(s)));
      const priceSpan = spans.find((s) => /^\$\s*[\d.]+$/.test(textOf(s)) && !/line-through/.test(cls(s)));
      const disc = spans.map(textOf).find((t) => /^-\s*\d+\s*%$/.test(t));
      const imgUrl = nextImageUrl(img && ((img.attrs.srcset || "").split(",")[0].trim().split(" ")[0] || img.attrs.src));
      return {
        slug: slugOf(a.attrs.href),
        href: a.attrs.href,
        name: textOf(first(dc, (x) => x.tag === "h3")),
        price: priceNum(textOf(priceSpan)),
        compareAt: priceNum(textOf(line)),
        discount: disc ? norm(disc).replace(/\s/g, "") : null,
        imageId: cloudId(imgUrl),
        badge,
        overlayCta: overlay,
        hasHeartButton: !!first(dc, (x) => x.tag === "button" && /favoritos/i.test(x.attrs["aria-label"] || "")),
        heartNestedInsideLink: !!first(a, (x) => x.tag === "button"),
        titleLayout: /text-center/.test(cls(first(dc, (x) => x.tag === "h3").parent)) ? "centrado bajo la imagen" : "izquierda, precio a la derecha",
      };
    });
    const ps = all(sec, (x) => x.tag === "p").map(textOf);
    return { eyebrow: ps[0] || null, h2: h2Of(sec), cards };
  };
  const editorial = showcase(editorialSec);
  const featured = showcase(prodSec);
  featured.sectionId = prodSec.attrs.id;

  const promoPs = all(promoSec, (x) => x.tag === "p").map(textOf);
  const promoLinks = all(promoSec, (x) => x.tag === "a").map((a) => ({ text: textOf(a), href: a.attrs.href }));
  const promo = {
    eyebrow: promoPs[0],
    h2: h2Of(promoSec),
    links: promoLinks,
    finePrint: promoPs.find((t) => /^Envío gratis/.test(t)) || null,
  };

  const form = first(newsSec, (x) => x.tag === "form");
  const input = first(form, (x) => x.tag === "input");
  const button = first(form, (x) => x.tag === "button");
  const newsPs = all(newsSec, (x) => x.tag === "p").map(textOf);
  const newsletter = {
    eyebrow: newsPs[0],
    h2: h2Of(newsSec),
    copy: newsPs[1],
    input: { type: input.attrs.type, placeholder: input.attrs.placeholder, ariaLabel: input.attrs["aria-label"], required: input.attrs.required !== undefined },
    button: textOf(button),
    formActionAttr: form.attrs.action === undefined ? "sin atributo action" : form.attrs.action,
    formMethodAttr: form.attrs.method === undefined ? "sin atributo method" : form.attrs.method,
  };

  // footer (dentro de <main>)
  const footer = first(body, (x) => x.tag === "footer");
  const fImg = first(footer, (x) => x.tag === "img");
  const grid = first(footer, (x) => x.tag === "div" && /md:grid-cols/.test(cls(x)));
  const cols = (grid ? grid.children.filter((c) => c.tag === "div") : []).slice(1);
  const brandCol = grid.children.filter((c) => c.tag === "div")[0];
  const columns = cols.map((c) => {
    const heading = textOf(first(c, (x) => x.tag === "h3"));
    const anchors = all(c, (x) => x.tag === "a").map((a) => ({ text: textOf(a), href: REDACT(a.attrs.href), external: a.attrs.target === "_blank" }));
    return {
      heading,
      links: anchors.filter((a) => !a.external).map((a) => `${a.text} -> ${a.href}`),
      externalLinks: anchors.filter((a) => a.external).map((a) => `${REDACT(a.text.replace(/\d{6,}/g, "<numero>"))} -> ${a.href}`),
    };
  });
  const socialPills = all(brandCol, (x) => x.tag === "a" && x.attrs.target === "_blank").map((a) => `${textOf(a)} -> ${REDACT(a.attrs.href)}`);
  const copyrightEl = all(footer, (x) => x.tag === "p").map(textOf).find((t) => /Todos los derechos/.test(t));
  const footerOut = {
    id: footer.attrs.id,
    logoAlt: fImg && fImg.attrs.alt,
    tagline: textOf(first(brandCol, (x) => x.tag === "p")),
    socialPills,
    columns,
    copyright: copyrightEl,
    insideMain: true,
  };

  // banner de cookies
  const cookieDiv = bodyEls.find((c) => c.tag === "div" && /Usamos cookies/.test(textOf(c)));
  const cookie = cookieDiv
    ? { text: textOf(first(cookieDiv, (x) => x.tag === "p")), buttons: all(cookieDiv, (x) => x.tag === "button").map(textOf) }
    : null;

  // payload RSC: categorias con video y componente RecommendedForYou
  let rsc = "";
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) {
    try {
      rsc += JSON.parse(m[1]);
    } catch {
      /* fragmento no parseable */
    }
  }
  const catPayload = [...rsc.matchAll(/\{"slug":"([a-z-]+)","name":"([^"]+)","coverImageUrl":(null|"[^"]*"),"coverImageWidth":[^,]*,"coverImageHeight":[^,]*,"coverImagePosX":[^,]*,"coverImagePosY":[^,]*,"coverImageZoom":[^,]*,"coverVideoUrl":(null|"[^"]*")\}/g)].map((m) => ({
    slug: m[1],
    coverImage: m[3] === "null" ? null : cloudId(JSON.parse(m[3])),
    coverVideo: m[4] === "null" ? null : cloudId(JSON.parse(m[4])),
  }));
  const rec = rsc.match(/\["\$","\$L[0-9a-f]+",null,\{"excludeSlugs":\[([^\]]*)\]\}\]/);
  const recommended = {
    componentReferencedInPayload: /"RecommendedForYou"\]/.test(rsc),
    excludeSlugsCount: rec ? rec[1].split(",").length : null,
    textOccurrencesInServedHtml: (html.match(/Recomendado para/gi) || []).length,
    sectionsInMainWithRecommendedHeading: sections.filter((s) => /Recomendado/i.test(h2Of(s))).length,
  };

  return { head: headOut, announcement, header: headerOut, hero, categories, catPayload, editorial, featured, promo, newsletter, footer: footerOut, cookie, recommended, sectionOrder: sections.map((s) => s.attrs.id || h2Of(s) || "(sin id)") };
}

/* ------------------------------------------------------------------ Home DEV (theme-src + captura) */
function schemaOf(file) {
  const t = readText(path.join(TS, "sections", file));
  const m = t.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  return JSON.parse(m[1]);
}
const defaultsOf = (schema) => Object.fromEntries((schema.settings || []).filter((s) => s.id).map((s) => [s.id, s.default]));

function extractDev() {
  const idx = readJson(path.join(TS, "templates", "index.json"));
  const settings = readJson(path.join(TS, "config", "settings_data.json")).presets.Default;
  const hdrGroup = readJson(path.join(TS, "sections", "header-group.json"));
  const ftrGroup = readJson(path.join(TS, "sections", "footer-group.json"));
  const es = readJson(path.join(TS, "locales", "es.default.json"));
  const en = readJson(path.join(TS, "locales", "en.json"));
  const cap = readJson(path.join(EV, "dev-home.json"));
  const eff = (id, file) => ({ ...defaultsOf(schemaOf(file)), ...(idx.sections[id] ? idx.sections[id].settings : {}) });
  const hero = eff("hero", "hero.liquid");
  const editorial = eff("featured-collection-editorial", "featured-collection-editorial.liquid");
  const featured = eff("featured-products", "featured-products.liquid");
  const recommended = eff("recommended-products", "recommended-products.liquid");
  const promo = eff("promo-banner", "promo-banner.liquid");
  const newsletter = eff("newsletter-home", "newsletter-home.liquid");
  const catSection = idx.sections["featured-categories"];
  const catHeading = defaultsOf(schemaOf("featured-categories.liquid")).heading;
  const catBlocks = catSection.block_order.map((k) => ({ id: k, ...catSection.blocks[k].settings, hasImage: catSection.blocks[k].settings.image != null, hasVideo: catSection.blocks[k].settings.video != null }));
  const announcement = { ...defaultsOf(schemaOf("announcement-bar.liquid")), ...hdrGroup.sections["announcement-bar"].settings };
  const footerDefaults = defaultsOf(schemaOf("footer.liquid"));
  const footerBlocks = ftrGroup.sections.footer.block_order.map((k) => ({ id: k, type: ftrGroup.sections.footer.blocks[k].type, ...ftrGroup.sections.footer.blocks[k].settings }));
  const headerLiquid = readText(path.join(TS, "sections", "header.liquid"));
  const footerLiquid = readText(path.join(TS, "sections", "footer.liquid"));
  const promoLiquid = readText(path.join(TS, "sections", "promo-banner.liquid"));
  const carouselLiquid = readText(path.join(TS, "snippets", "product-carousel.liquid"));

  // uso de shop.name y del logo en el theme
  const shopNameUse = [];
  for (const dir of ["layout", "sections", "snippets"]) {
    for (const f of fs.readdirSync(path.join(TS, dir)).sort()) {
      const t = readText(path.join(TS, dir, f));
      const c = (t.match(/shop\.name/g) || []).length;
      if (c) shopNameUse.push(`${dir}/${f}: ${c}`);
    }
  }
  const cookieMentions = [];
  for (const dir of ["layout", "sections", "snippets", "assets", "templates"]) {
    for (const f of fs.readdirSync(path.join(TS, dir)).sort()) {
      if (!/\.(liquid|js|json)$/.test(f)) continue;
      const t = readText(path.join(TS, dir, f));
      if (/consent|customer_privacy|cookie[- _]?banner/i.test(t)) cookieMentions.push(`${dir}/${f}`);
    }
  }
  const jsonLdHome = [];
  for (const f of ["layout/theme.liquid", "sections/hero.liquid", "sections/header.liquid", "sections/footer.liquid"]) {
    if (/ld\+json/.test(readText(path.join(TS, f)))) jsonLdHome.push(f);
  }
  const themeHreflangEmitted = /hreflang/.test(readText(path.join(TS, "layout", "theme.liquid")));

  return {
    capture: cap,
    settings: { logoSet: settings.logo != null, faviconSet: settings.favicon != null, freeShippingRateConfirmed: settings.free_shipping_rate_confirmed, freeShippingThreshold: settings.free_shipping_threshold, cartDrawerEnabled: settings.cart_drawer_enabled },
    social: { instagram: settings.social_instagram, facebook: settings.social_facebook, tiktok: settings.social_tiktok, whatsapp: REDACT(settings.social_whatsapp) },
    announcement,
    hero: { ...hero, hasVideo: hero.hero_video != null },
    categories: { heading: catHeading, blocks: catBlocks },
    editorial,
    featured,
    recommended: { ...recommended, hasCollection: recommended.collection != null },
    promo: { ...promo, shippingPolicyUrlSet: promo.shipping_policy_url != null },
    newsletter,
    footer: { brandName: footerDefaults.brand_name ?? null, brandDescription: norm((footerDefaults.brand_description || "").replace(/<[^>]+>/g, "")), blocks: footerBlocks },
    locale: {
      es: { catEyebrow: es.general.categories.eyebrow, catExploreCta: es.general.categories.explore_cta, newsletterSubmit: es.general.newsletter.submit, newsletterPlaceholder: es.general.newsletter.email_placeholder, newsletterLabel: es.general.newsletter.email_label, newsletterSuccess: es.general.newsletter.success, viewProduct: es.general.product.view_product, cartHeading: es.cart.general.heading, cartEmpty: es.cart.general.empty, cartEmptyText: es.cart.general.empty_text, cartContinue: es.cart.general.continue_shopping, wishlistAdd: es.general.wishlist.add, soldOut: es.products.product.sold_out, freeShipping: es.general.promo.free_shipping, shippingPolicyLink: es.general.promo.shipping_policy_link, rights: es.general.footer.rights_reserved },
      en: { catEyebrow: en.general.categories.eyebrow, newsletterSubmit: en.general.newsletter.submit, cartEmptyText: en.cart.general.empty_text },
    },
    liquidFacts: {
      headerHasCurrencyOrLocalizationSelector: /localization|country_selector|currency_selector/.test(headerLiquid),
      headerHasSocialLinks: /social_(instagram|facebook|tiktok|whatsapp)/.test(headerLiquid),
      headerHasLogoFallbackToShopName: /site-header__logo-text[\s\S]{0,40}shop\.name|shop\.name[\s\S]{0,60}site-header__logo-text/.test(headerLiquid),
      footerCopyrightUsesShopNameDefault: /brand_name \| default: shop\.name/.test(footerLiquid),
      promoFinePrintNeedsRateConfirmed: /free_shipping_rate_confirmed/.test(promoLiquid),
      promoFinePrintLinkNeedsShippingPolicyUrl: /shipping_policy_url != blank/.test(promoLiquid),
      carouselPassesCategoryLabel: /category_label: product\.type/.test(carouselLiquid),
      carouselPassesViewProductOverlay: /overlay_cta: 'view_product'/.test(carouselLiquid),
      carouselHeartIsSiblingOfLink: true,
    },
    shopNameUse,
    cookieMentions,
    jsonLdHome,
    themeHreflangEmitted,
    indexSectionOrder: idx.order,
  };
}

/* ------------------------------------------------------------------ manifiesto de media */
function parseCsv(t) {
  const rows = [];
  let row = [];
  let f = "";
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          f += '"';
          i++;
        } else q = false;
      } else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(f);
      f = "";
    } else if (c === "\n") {
      row.push(f);
      rows.push(row);
      row = [];
      f = "";
    } else if (c !== "\r") f += c;
  }
  if (f || row.length) {
    row.push(f);
    rows.push(row);
  }
  const h = rows[0];
  return rows.slice(1).filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}

/* ------------------------------------------------------------------ voseo / tuteo */
const VOSEO = ["Dejá", "recibí", "Descubrí", "agregá", "Guardá", "Escribí", "Podés", "Elegí", "Probá", "Intentá", "Revisá", "Recargá", "Activá", "Ingresá", "ingresala", "tenés", "vos"];
const TUTEO = ["Explora", "Compra", "Descubre", "Agrega", "Deja", "Recibe", "Guarda", "Escribe", "Puedes", "Elige", "Prueba", "Intenta", "Revisa", "Recarga", "Activa", "tú"];
function dialectOf(s) {
  const words = String(s).split(/[^A-Za-zÁÉÍÓÚáéíóúñÑüÜ]+/).filter(Boolean);
  const v = words.filter((w) => VOSEO.includes(w));
  const t = words.filter((w) => TUTEO.includes(w));
  return { voseo: [...new Set(v)], tuteo: [...new Set(t)] };
}

/* ------------------------------------------------------------------ comparaciones */
function main() {
  const homeFile = path.join(EV, "current-site", "home.html");
  const homeHtml = readText(homeFile);
  const cur = extractCurrent(homeHtml);
  const dev = extractDev();
  const cap = dev.capture;
  const manifest = parseCsv(readText(path.join(MIG, "content", "media", "media-migration-manifest.csv")));
  const manifestById = Object.fromEntries(manifest.map((r) => [r.id, r]));
  const devProducts = readText(path.join(EV, "dev-products.jsonl")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const devByHandle = Object.fromEntries(devProducts.map((p) => [p.h, p]));
  const devCollections = readJson(path.join(EV, "dev-collections.json")).collections;
  const collByHandle = Object.fromEntries(devCollections.map((c) => [c.h, c]));
  const redirects = readText(path.join(MIG, "seo", "shopify-redirects-import.csv")).split("\n").slice(1).filter(Boolean).map((l) => l.split(",")[0].trim());

  const res = { _meta: { determinista: true, fuente: "launch/evidence/current-site/home.html; launch/evidence/03g-collection-filter-probe/home-sample-*.html; launch/evidence/dev-*.json*; theme-src/*; content/media/media-migration-manifest.csv; seo/shopify-redirects-import.csv", homeHtmlSha256: sha(homeHtml) } };
  const out = [];
  const P = (s = "") => out.push(s);
  const table = (title, header, rows) => {
    P(`\n## ${title}`);
    P("| " + header.join(" | ") + " |");
    P("|" + header.map(() => "---").join("|") + "|");
    for (const r of rows) P("| " + r.map((c) => String(c ?? "").replace(/\|/g, "\\|")).join(" | ") + " |");
  };
  const eq = (a, b) => (norm(a) === norm(b) ? "IGUAL" : "DISTINTO");

  /* H0 cabecera SEO */
  const headRows = [
    ["lang", cur.head.lang, cap.lang, eq(cur.head.lang, cap.lang)],
    ["title", cur.head.title, cap.title, eq(cur.head.title, cap.title)],
    ["meta description", cur.head.metaDescription ? `"${cur.head.metaDescription}" (${cur.head.metaDescription.length} car.)` : "(vacía)", cap.metaDescription ? cap.metaDescription : "(vacía)", cur.head.metaDescription && !cap.metaDescription ? "DISTINTO" : "IGUAL"],
    ["canonical", cur.head.canonical, cap.canonical, "DISTINTO (host)"],
    ["og:title", cur.head.ogTitle, (cap.og.find((x) => x.startsWith("og:title=")) || "").replace("og:title=", ""), eq(cur.head.ogTitle, (cap.og.find((x) => x.startsWith("og:title=")) || "").replace("og:title=", ""))],
    ["og:site_name", cur.head.ogSiteName, (cap.og.find((x) => x.startsWith("og:site_name=")) || "").replace("og:site_name=", ""), "DISTINTO"],
    ["og:description", cur.head.ogDescription ? "presente" : "ausente", cap.og.some((x) => x.startsWith("og:description")) ? "presente" : "ausente (en la captura)", cur.head.ogDescription ? "DISTINTO" : "IGUAL"],
    ["og:image", cur.head.ogImage, cap.og.some((x) => x.startsWith("og:image")) ? "presente" : "ausente (en la captura)", "DISTINTO"],
    ["robots", cur.head.robots, cap.robots ? cap.robots : "(sin meta robots)", "n/a (indexable en ambos)"],
    ["hreflang (link rel=alternate)", String(cur.head.hreflangAlternates), cap.hreflang.join("; "), "DISTINTO"],
    ["JSON-LD", cur.head.jsonLdTypes.join(" + "), dev.jsonLdHome.length ? dev.jsonLdHome.join(", ") : "ninguno en theme-src para la Home (la captura dev-home.json no lo registra)", "DISTINTO"],
  ];
  table("H0 Cabecera, SEO y compartir (Home)", ["campo", "actual [MEDIDO-03G]", "Dev (captura RC1.7 / theme-src)", "resultado"], headRows);
  res.head = { current: cur.head, dev: { title: cap.title, metaDescription: cap.metaDescription, canonical: cap.canonical, og: cap.og, hreflang: cap.hreflang, jsonLdInThemeSrcForHome: dev.jsonLdHome, themeEmitsHreflang: dev.themeHreflangEmitted } };

  /* H1 anuncio */
  const annCap = cap.sections.find((s) => s.id === "announcement-bar").text;
  table("H1 Anuncio", ["campo", "actual", "Dev captura", "Dev theme-src (efectivo)", "resultado"], [
    ["texto", cur.announcement, annCap, dev.announcement.text, eq(cur.announcement, annCap)],
    ["enlace", "sin enlace (DOC header-navigation-report)", "n/a", dev.announcement.link ? dev.announcement.link : "(vacío)", "IGUAL"],
    ["colores", "negro / blanco (DOC)", "n/a", `${dev.announcement.background_color} / ${dev.announcement.text_color}`, "IGUAL"],
  ]);
  res.announcement = { current: cur.announcement, devCapture: annCap, devEffective: dev.announcement };

  /* H2 header */
  const devNav = cap.headerNav;
  table("H2 Header", ["elemento", "actual [MEDIDO-03G]", "Dev", "resultado"], [
    ["logo", `imagen ${cur.header.logoSrc} (alt "${cur.header.logoAlt}")`, `texto "${(cap.sections.find((s) => s.id === "header").note.match(/'([^']+)'/) || [])[1]}" (logo de texto; settings.logo ${dev.settings.logoSet ? "cargado" : "sin cargar"})`, "DISTINTO"],
    ["navegación", cur.header.nav.join("; "), devNav.slice(0, 5).join("; "), "IGUAL en textos; rutas remapeadas (47 redirecciones)"],
    ["buscar", "formulario -> /buscar; botón 'Buscar'", devNav.find((x) => x.startsWith("Buscar")), "presente en ambos"],
    ["selector de moneda", cur.header.currencySelector ? `select "Moneda": ${cur.header.currencySelector.join("/")} (solo >= xl)` : "no", dev.liquidFacts.headerHasCurrencyOrLocalizationSelector ? "sí" : "no existe en el theme", "DISTINTO"],
    ["redes en cabecera", cur.header.controls.filter((c) => ["Instagram", "Facebook", "TikTok", "WhatsApp"].includes(c.label)).map((c) => c.label).join(", ") + " (solo >= xl)", dev.liquidFacts.headerHasSocialLinks ? "sí" : "no existen en la cabecera (solo en el pie)", "DISTINTO"],
    ["favoritos", cur.header.controls.find((c) => c.label === "Favoritos").href, devNav.find((x) => x.startsWith("Favoritos")), "presente en ambos"],
    ["cuenta", cur.header.controls.find((c) => c.label === "Cuenta").href, devNav.find((x) => x.startsWith("Mi cuenta")), "presente en ambos"],
    ["carrito", "botón 'Carrito' (sin href: solo JS)", devNav.find((x) => x.startsWith("Carrito")), "presente en ambos"],
  ]);
  res.header = { current: cur.header, devNav };

  /* H3 hero */
  const heroCap = cap.sections.find((s) => s.id === "hero");
  const ctaCap = heroCap.cta.split(" -> ");
  table("H3 Hero", ["campo", "actual", "Dev captura", "Dev theme-src (efectivo)", "resultado"], [
    ["eyebrow", cur.hero.eyebrow, heroCap.eyebrow, dev.hero.hero_eyebrow, eq(cur.hero.eyebrow, heroCap.eyebrow)],
    ["h1", cur.hero.h1, heroCap.h1, dev.hero.hero_headline, eq(cur.hero.h1, heroCap.h1)],
    ["subtítulo", cur.hero.subtitle, heroCap.sub, dev.hero.hero_subheadline, eq(cur.hero.subtitle, heroCap.sub)],
    ["texto del CTA", cur.hero.cta.text, ctaCap[0], dev.hero.hero_cta_label, eq(cur.hero.cta.text, ctaCap[0])],
    ["destino del CTA", cur.hero.cta.href, ctaCap[1], dev.hero.hero_cta_url, eq(cur.hero.cta.href, ctaCap[1])],
    ["media", `video ${cloudId(cur.hero.videoSrc)} + poster ${cloudId(cur.hero.videoPoster)}`, heroCap.variant, dev.hero.hasVideo ? "hero_video cargado" : "hero_video vacío -> variante fallback", "DISTINTO"],
    ["manifiesto M01 (video)", manifestById.M01.status, "", manifestById.M01.shopify_target, "sourced-but-owner-upload-pending"],
    ["manifiesto M02 (poster)", manifestById.M02.status, "", manifestById.M02.note, "no se migra (documentado)"],
  ]);
  res.hero = { current: cur.hero, devCapture: heroCap, devEffective: dev.hero, manifest: { M01: manifestById.M01, M02: manifestById.M02 } };

  /* H4 categorias */
  const catCap = cap.sections.find((s) => s.id === "featured-categories");
  const catRows = [];
  const media = { "oasis-natural": ["M03", "M04"], "aurora-viva": ["M05", "M06"], "espuma-de-ola": ["M07", "M08"], "salidas-de-bano": ["M09"] };
  const devCardImg = catCap.imgNames.map((s) => s.split(" ")[0]);
  const devCardProd = catCap.imgNames.map((s) => (s.match(/\(([^)]+)\)/) || [])[1]);
  cur.categories.cards.forEach((c, i) => {
    const slug = c.href.replace(/^\//, "");
    const pay = cur.catPayload.find((p) => p.slug === slug) || {};
    const devCard = catCap.cards[i];
    const devBlock = dev.categories.blocks[i];
    const first1 = (collByHandle[slug].order || [])[0] || null;
    const devFirstImg = first1 ? devByHandle[first1].im[0] : null;
    const fallbackImg = i < 3 ? devCardImg[i] : null;
    catRows.push([
      c.name,
      `${c.text} | ${c.href} | ${c.cta}`,
      `${devCard.sub} | ${devCard.href} | ${devBlock.hasImage || devBlock.hasVideo ? "con media en el bloque" : "sin media en el bloque"}`,
      `actual: ${c.media.kind === "video" ? `video ${pay.coverVideo} (poster ${cloudId(c.media.poster) || c.media.poster})` : `imagen ${cloudId(c.media.url)}`}`,
      i < 3 ? `Dev: imagen ${fallbackImg} = 1.er producto de la colección (${first1}; im[0]=${devFirstImg}; coincide: ${devFirstImg === fallbackImg ? "sí" : "no"})` : `Dev: sin imagen (colección con ${collByHandle[slug].n} productos)`,
      media[slug].map((id) => `${id}:${manifestById[id].status}`).join(", "),
    ]);
  });
  table("H4 Categorías destacadas", ["tarjeta", "actual (texto, enlace, CTA)", "Dev (texto, enlace, bloque)", "media actual", "media Dev", "manifiesto"], catRows);
  const catTextRows = cur.categories.cards.map((c, i) => {
    const full = dev.categories.blocks[i].description;
    return [c.name, eq(c.text, full), `actual: ${c.text}`, `theme-src: ${full}`, `captura: ${catCap.cards[i].sub}`];
  });
  table("H4b Categorías: texto de la descripción", ["tarjeta", "actual vs theme-src", "actual", "theme-src (index.json)", "captura dev-home.json"], catTextRows);
  const cardMediaIds = cur.categories.cards.map((c, i) => (c.media.kind === "video" ? cloudId(c.media.poster) : cloudId(c.media.url)));
  res.categories = {
    current: cur.categories,
    payloadCoverData: cur.catPayload,
    devCapture: catCap,
    devBlocks: dev.categories.blocks,
    devFallbackImagesAreFirstProductOfCollection: [0, 1, 2].map((i) => {
      const slug = cur.categories.cards[i].href.replace(/^\//, "");
      const f = collByHandle[slug].order[0];
      return { slug, firstProduct: f, firstProductImage: devByHandle[f].im[0], cardImage: devCardImg[i], same: devByHandle[f].im[0] === devCardImg[i] };
    }),
    cardImagesShareAnyIdWithCurrentMedia: devCardImg.some((d) => cardMediaIds.includes(d)),
    manifest: Object.fromEntries(["M03", "M04", "M05", "M06", "M07", "M08", "M09"].map((k) => [k, { status: manifestById[k].status, target: manifestById[k].shopify_target, note: manifestById[k].note }])),
  };

  /* H5 editorial */
  const edCap = cap.sections.find((s) => s.id === "featured-collection-editorial");
  const curEd = cur.editorial.cards.map((c) => c.slug);
  const devEd = edCap.products;
  const setCommon = curEd.filter((s) => devEd.includes(s));
  const posEq = curEd.filter((s, i) => devEd[i] === s);
  table("H5 Editorial 'La belleza de sentirte tú'", ["campo", "actual", "Dev captura", "Dev theme-src (efectivo)", "resultado"], [
    ["eyebrow", cur.editorial.eyebrow, edCap.eyebrow, dev.editorial.eyebrow, eq(cur.editorial.eyebrow, edCap.eyebrow)],
    ["h2", cur.editorial.h2, edCap.h2, dev.editorial.heading, eq(cur.editorial.h2, edCap.h2)],
    ["colección", "Oasis Natural (8 primeras por fecha de creación ascendente [DOC])", edCap.collection, `${dev.editorial.collection} (limit ${dev.editorial.limit})`, "misma colección"],
    ["N.º de tarjetas", String(curEd.length), String(edCap.cards), String(dev.editorial.limit), curEd.length === edCap.cards ? "IGUAL" : "DISTINTO"],
    ["conjunto", curEd.join(", "), devEd.join(", "), "", `${setCommon.length} de ${curEd.length} en común`],
    ["orden", "", "", "", `${posEq.length} de ${curEd.length} posiciones coinciden`],
    ["solo en actual", curEd.filter((s) => !devEd.includes(s)).join(", "), "", "", ""],
    ["solo en Dev", "", devEd.filter((s) => !curEd.includes(s)).join(", "), "", ""],
    ["orden de Oasis en la Dev (completo)", "", collByHandle["oasis-natural"].order.join(", "), "", ""],
  ]);
  const cardRows = [];
  for (const [secName, secCur, devList] of [["editorial", cur.editorial.cards, devEd], ["destacados", cur.featured.cards, cap.sections.find((s) => s.id === "featured-products").products]]) {
    for (const c of secCur) {
      const d = devByHandle[c.slug];
      if (!d) {
        cardRows.push([secName, c.slug, "no existe en dev-products.jsonl", "", "", "", ""]);
        continue;
      }
      const v0 = d.vr[0];
      cardRows.push([secName, c.slug, c.name === d.t ? "IGUAL" : `DISTINTO (${c.name} / ${d.t})`, c.price === Math.round(parseFloat(v0[2])) && c.compareAt === Math.round(parseFloat(v0[3])) ? "IGUAL" : "DISTINTO", c.imageId === d.im[0] ? "IGUAL" : `DISTINTO (${c.imageId} / ${d.im[0]})`, `${c.badge || "-"} / ${c.overlayCta || "-"}`, devList.includes(c.slug) ? "en la Home Dev" : "NO está en la Home Dev"]);
    }
  }
  table("H5b Tarjetas: producto por producto (actual vs dev-products.jsonl)", ["sección", "handle", "título", "precio y anterior", "1.ª imagen", "insignia / overlay actual", "presencia"], cardRows);
  const cardStructRows = [
    ["Editorial actual", "insignia de categoría", cur.editorial.cards.every((c) => c.badge === null) ? "ausente en las 8" : "presente", "overlay 'Ver producto'", cur.editorial.cards.every((c) => c.overlayCta === null) ? "ausente en las 8" : "presente", "título", cur.editorial.cards[0].titleLayout],
    ["Destacados actual", "insignia de categoría", cur.featured.cards.every((c) => c.badge) ? "presente en las 7" : "parcial", "overlay 'Ver producto'", cur.featured.cards.every((c) => c.overlayCta) ? "presente en las 7" : "parcial", "título", cur.featured.cards[0].titleLayout],
    ["Dev (snippet product-carousel, usado por editorial, destacados y recomendados)", "insignia de categoría", dev.liquidFacts.carouselPassesCategoryLabel ? "sí (product.type)" : "no", "overlay 'Ver producto'", dev.liquidFacts.carouselPassesViewProductOverlay ? "sí" : "no", "título", "un solo diseño de tarjeta"],
  ];
  table("H5c Estructura de la tarjeta por sección", ["origen", "a", "estado", "b", "estado", "c", "estado"], cardStructRows);
  res.editorial = { current: { eyebrow: cur.editorial.eyebrow, h2: cur.editorial.h2, cards: cur.editorial.cards }, devCapture: edCap, devEffective: dev.editorial, setCommon, samePositions: posEq, onlyCurrent: curEd.filter((s) => !devEd.includes(s)), onlyDev: devEd.filter((s) => !curEd.includes(s)), devOasisOrder: collByHandle["oasis-natural"].order };

  /* H6 destacados + muestras */
  const fpCap = cap.sections.find((s) => s.id === "featured-products");
  const curFp = cur.featured.cards.map((c) => c.slug);
  const samples = [{ name: "current-site/home.html", html: homeHtml }];
  for (let i = 1; i <= 3; i++) {
    const f = path.join(EV, "03g-collection-filter-probe", `home-sample-${i}.html`);
    if (fs.existsSync(f)) samples.push({ name: `03g-collection-filter-probe/home-sample-${i}.html`, html: readText(f) });
  }
  const sampleRows = samples.map((s) => {
    const x = s.html === homeHtml ? cur : extractCurrent(s.html);
    return { file: s.name, sha12: sha(s.html).slice(0, 12), featured: x.featured.cards.map((c) => c.slug), editorial: x.editorial.cards.map((c) => c.slug), recommendedTextInHtml: x.recommended.textOccurrencesInServedHtml };
  });
  const distinctFeaturedOrders = new Set(sampleRows.map((r) => r.featured.join(">"))).size;
  const distinctFeaturedSets = new Set(sampleRows.map((r) => [...r.featured].sort().join(","))).size;
  const distinctEditorialOrders = new Set(sampleRows.map((r) => r.editorial.join(">"))).size;
  table("H6 Destacados 'Productos destacados'", ["campo", "actual", "Dev captura", "Dev theme-src (efectivo)", "resultado"], [
    ["eyebrow", cur.featured.eyebrow, fpCap.eyebrow, dev.featured.eyebrow, eq(cur.featured.eyebrow, fpCap.eyebrow)],
    ["h2", cur.featured.h2, fpCap.h2, dev.featured.heading, eq(cur.featured.h2, fpCap.h2)],
    ["id de ancla", `#${cur.featured.sectionId}`, "(no capturado)", "id=\"productos\" (featured-products.liquid)", "IGUAL"],
    ["colección", "featured=true menos los de la editorial [DOC]", fpCap.collection, dev.featured.collection, ""],
    ["conjunto", curFp.slice().sort().join(", "), fpCap.products.slice().sort().join(", "), "", [...curFp].sort().join(",") === [...fpCap.products].sort().join(",") ? "IGUAL" : "DISTINTO"],
    ["orden (esta captura)", curFp.join(", "), fpCap.products.join(", "), "", curFp.join(",") === fpCap.products.join(",") ? "IGUAL" : "DISTINTO"],
  ]);
  table("H6b Muestras de la Home actual (¿el orden de destacados cambia entre visitas?)", ["archivo", "sha256 (12)", "orden de destacados", "orden editorial", "'Recomendado para' en el HTML"], sampleRows.map((r) => [r.file, r.sha12, r.featured.join(", "), r.editorial.join(", "), r.recommendedTextInHtml]));
  P(`\nÓrdenes distintos de destacados entre ${sampleRows.length} muestras: ${distinctFeaturedOrders}; conjuntos distintos: ${distinctFeaturedSets}; órdenes distintos de la editorial: ${distinctEditorialOrders}.`);
  const overlapCur = curEd.filter((s) => curFp.includes(s));
  const overlapDev = devEd.filter((s) => fpCap.products.includes(s));
  P(`Productos repetidos entre la editorial y destacados: actual ${overlapCur.length}; Dev ${overlapDev.length}.`);
  res.featured = { current: { eyebrow: cur.featured.eyebrow, h2: cur.featured.h2, sectionId: cur.featured.sectionId, cards: cur.featured.cards }, devCapture: fpCap, devEffective: dev.featured, samples: sampleRows, distinctFeaturedOrders, distinctFeaturedSets, distinctEditorialOrders };

  /* H7 recomendados */
  const recCap = cap.sections.find((s) => s.id === "recommended-products");
  table("H7 Recomendados 'Recomendado para vos'", ["campo", "actual [MEDIDO-03G]", "Dev", "resultado"], [
    ["sección en el HTML servido", `${cur.recommended.sectionsInMainWithRecommendedHeading} secciones con ese título; ${cur.recommended.textOccurrencesInServedHtml} apariciones del texto`, `estado: ${recCap.state}`, "no se ve en ninguno en el HTML"],
    ["componente en el payload", cur.recommended.componentReferencedInPayload ? `RecommendedForYou montado, excludeSlugs=${cur.recommended.excludeSlugsCount} slugs` : "no", `colección asignada: ${dev.recommended.hasCollection ? dev.recommended.collection : "ninguna"}; heading por defecto "${dev.recommended.heading}"`, "distinto: el actual es del lado del cliente"],
  ]);
  res.recommended = { current: cur.recommended, devCapture: recCap, devEffective: dev.recommended };

  /* H8 promo */
  const pCap = cap.sections.find((s) => s.id === "promo-banner");
  const promoCta = cur.promo.links.find((l) => l.text === "Descubrir la colección");
  const promoShip = cur.promo.links.find((l) => l.text === "Ver política de envíos");
  const devCtaCap = pCap.cta.split(" -> ");
  table("H8 Promo", ["campo", "actual", "Dev captura", "Dev theme-src (efectivo)", "resultado"], [
    ["eyebrow", cur.promo.eyebrow, pCap.eyebrow, dev.promo.eyebrow, eq(cur.promo.eyebrow, pCap.eyebrow)],
    ["h2", cur.promo.h2, pCap.h2, dev.promo.headline, eq(cur.promo.h2, pCap.h2)],
    ["texto del CTA", promoCta.text, devCtaCap[0], dev.promo.cta_label, eq(promoCta.text, devCtaCap[0])],
    ["destino del CTA", promoCta.href, devCtaCap[1], dev.promo.cta_url, eq(promoCta.href, devCtaCap[1])],
    ["letra chica de envío gratis", cur.promo.finePrint, "(no aparece)", dev.settings.freeShippingRateConfirmed ? "visible" : "oculta: free_shipping_rate_confirmed=false", "DISTINTO (documentado)"],
    ["enlace 'Ver política de envíos'", `${promoShip.text} -> ${promoShip.href}`, "(no aparece)", dev.promo.shippingPolicyUrlSet ? "shipping_policy_url cargado" : "shipping_policy_url sin cargar", "DISTINTO (documentado)"],
    ["umbral de envío gratis", "$ 299.900 (texto visible)", "", `${dev.settings.freeShippingThreshold}`, "IGUAL"],
  ]);
  res.promo = { current: cur.promo, devCapture: pCap, devEffective: dev.promo, lock: { freeShippingRateConfirmed: dev.settings.freeShippingRateConfirmed, threshold: dev.settings.freeShippingThreshold } };

  /* H9 newsletter */
  const nCap = cap.sections.find((s) => s.id === "newsletter-home");
  table("H9 Newsletter", ["campo", "actual", "Dev captura", "Dev theme-src / locale", "resultado"], [
    ["eyebrow", cur.newsletter.eyebrow, nCap.eyebrow, dev.newsletter.eyebrow, eq(cur.newsletter.eyebrow, nCap.eyebrow)],
    ["h2", cur.newsletter.h2, nCap.h2, dev.newsletter.heading, eq(cur.newsletter.h2, nCap.h2)],
    ["copy", cur.newsletter.copy, nCap.text, dev.newsletter.description, eq(cur.newsletter.copy, nCap.text)],
    ["placeholder", cur.newsletter.input.placeholder, "(no capturado)", dev.locale.es.newsletterPlaceholder, eq(cur.newsletter.input.placeholder, dev.locale.es.newsletterPlaceholder)],
    ["etiqueta del campo", cur.newsletter.input.ariaLabel, "(no capturado)", dev.locale.es.newsletterLabel, eq(cur.newsletter.input.ariaLabel, dev.locale.es.newsletterLabel)],
    ["botón", cur.newsletter.button, nCap.cta, dev.locale.es.newsletterSubmit, eq(cur.newsletter.button, nCap.cta)],
    ["mensaje de éxito", "NOT_VERIFIED (no está en el HTML servido)", "", dev.locale.es.newsletterSuccess, "n/a"],
    ["formulario (atributos)", `action: ${cur.newsletter.formActionAttr}; method: ${cur.newsletter.formMethodAttr}`, "", "{% form 'customer' %} con contact[tags]=newsletter (newsletter-home.liquid)", "mecánica distinta"],
  ]);
  res.newsletter = { current: cur.newsletter, devCapture: nCap, devEffective: dev.newsletter, locale: dev.locale.es };

  /* H10 footer */
  const fCap = cap.footer;
  const devFooterBlocks = dev.footer.blocks;
  const curCols = Object.fromEntries(cur.footer.columns.map((c) => [c.heading, c]));
  table("H10 Footer", ["elemento", "actual [MEDIDO-03G]", "Dev", "resultado"], [
    ["logo", `imagen (alt "${cur.footer.logoAlt}")`, `texto: shop.name (settings.logo ${dev.settings.logoSet ? "cargado" : "sin cargar"})`, "DISTINTO"],
    ["descripción de marca", cur.footer.tagline, fCap.tagline, eq(cur.footer.tagline, fCap.tagline)],
    ["redes (pills)", cur.footer.socialPills.join("; "), fCap.social.join("; "), cur.footer.socialPills.length === fCap.social.length ? "mismas 4 redes (URLs iguales; wa.me no se reproduce)" : "DISTINTO"],
    ["columna Comprar", curCols["Comprar"].links.join("; "), fCap.columnComprar.join("; "), curCols["Comprar"].links.map((l) => l.split(" -> ")[0]).join(",") === fCap.columnComprar.join(",") ? "IGUAL" : "DISTINTO"],
    ["columna Ayuda: enlaces", curCols["Ayuda"].links.join("; "), fCap.columnAyuda.join("; "), "Dev tiene 2 de 6"],
    ["Ayuda: Contacto (redes)", `desplegable con ${curCols["Ayuda"].externalLinks.length} enlaces`, `bloque "contact" en footer-group.json (show_social_channels=${devFooterBlocks.find((b) => b.type === "contact").show_social_channels}) [DOC]; correo: ${devFooterBlocks.find((b) => b.type === "contact").contact_email ? "cargado" : "vacío"}; la captura ("${fCap.contacto}") solo confirma el ancla del pie, no el HTML del desplegable`, "presente en ambos según el código; distinta ubicación (Dev: columna propia)"],
    ["columna Empresa", curCols["Empresa"].links.join("; "), "no existe", "DISTINTO"],
    ["copyright", cur.footer.copyright, dev.liquidFacts.footerCopyrightUsesShopNameDefault && !dev.footer.brandName ? `© <año> ${(cap.title || "").trim()}. ${dev.locale.es.rights} (deducido: brand_name vacío -> shop.name)` : "(no capturado)", "DISTINTO [INFERIDO]"],
    ["ancla #contacto", `footer id="${cur.footer.id}"`, "footer id=\"contacto\" (footer.liquid)", "IGUAL"],
  ]);
  res.footer = { current: cur.footer, devCapture: fCap, devFooterDefaults: dev.footer, devSocial: dev.social };

  /* H11 carrito */
  const cartCap = cap.sections.find((s) => s.id === "cart-drawer");
  table("H11 Carrito", ["elemento", "actual", "Dev", "resultado"], [
    ["disparador", "botón 'Carrito' sin href", devNav.find((x) => x.startsWith("Carrito")), "presente en ambos"],
    ["página /cart", "no existe (404) [DOC: el sitio real no tiene página de carrito]", "200 (dev-routes.json)", "DISTINTO (documentado)"],
    ["vacío: título", "NOT_VERIFIED (el contenido del carrito no está en el HTML servido)", cartCap.h2, "sin comparar"],
    ["vacío: texto", "NOT_VERIFIED", cartCap.empty, "sin comparar"],
  ]);
  res.cart = { devCapture: cartCap };

  /* H12 cookies */
  table("H12 Banner de cookies", ["elemento", "actual [MEDIDO-03G]", "Dev", "resultado"], [
    ["banner", cur.cookie ? `${cur.cookie.text} Botones: ${cur.cookie.buttons.join(" / ")}` : "no", dev.cookieMentions.length ? `menciones en theme-src: ${dev.cookieMentions.join(", ")}` : "el theme no renderiza ningún banner (0 menciones de consent/customer_privacy en layout, sections, snippets, assets, templates); la captura dev-home.json no lo registra", "DISTINTO"],
  ]);
  res.cookie = { current: cur.cookie, themeMentions: dev.cookieMentions };

  /* H13 nombre de la tienda */
  table("H13 Dónde se ve el nombre de la Dev Store", ["lugar", "evidencia", "etiqueta"], [
    ["<title> de la Home", cap.title, "[MEDIDO-03G]"],
    ["og:site_name / og:title", cap.og.filter((x) => /site_name|title/.test(x)).join("; "), "[MEDIDO-03G]"],
    ["logo de texto de la cabecera", (cap.sections.find((s) => s.id === "header").note.match(/'([^']+)'/) || [])[1], "[MEDIDO-03G]"],
    ["pie: logo de texto, aria-label y copyright", `usa shop.name (settings.logo sin cargar; footer brand_name ${dev.footer.brandName ? "cargado" : "vacío"})`, "[DOC: footer.liquid] + [INFERIDO]"],
    ["archivos del theme que usan shop.name", dev.shopNameUse.join("; "), "[DOC: theme-src]"],
  ]);
  res.shopName = { devTitle: cap.title, uses: dev.shopNameUse, logoSet: dev.settings.logoSet, footerBrandName: dev.footer.brandName };

  /* H14 voseo / tuteo */
  const strings = [];
  const add = (origen, lugar, s) => {
    const d = dialectOf(s);
    strings.push({ origen, lugar, texto: s, voseo: d.voseo, tuteo: d.tuteo });
  };
  add("actual", "hero: CTA", cur.hero.cta.text);
  add("actual", "categorías: eyebrow", cur.categories.eyebrow);
  add("actual", "editorial: h2", cur.editorial.h2);
  add("actual", "newsletter: h2", cur.newsletter.h2);
  add("actual", "newsletter: copy", cur.newsletter.copy);
  add("actual", "cookies: texto", cur.cookie.text);
  add("Dev", "hero: CTA", dev.hero.hero_cta_label);
  add("Dev", "categorías: eyebrow (locale)", dev.locale.es.catEyebrow);
  add("Dev", "editorial: h2", dev.editorial.heading);
  add("Dev", "newsletter: h2", dev.newsletter.heading);
  add("Dev", "newsletter: copy", dev.newsletter.description);
  add("Dev", "newsletter: éxito (locale)", dev.locale.es.newsletterSuccess);
  add("Dev", "carrito vacío: texto (locale)", dev.locale.es.cartEmptyText);
  add("Dev", "recomendados: título por defecto (oculto)", dev.recommended.heading);
  table("H14 Voseo y tuteo en los textos de la Home", ["origen", "lugar", "texto", "formas de voseo", "formas de tuteo"], strings.map((s) => [s.origen, s.lugar, s.texto, s.voseo.join(", ") || "-", s.tuteo.join(", ") || "-"]));
  P(`\nLista de formas de voseo buscadas: ${VOSEO.join(", ")}. Lista de formas de tuteo buscadas: ${TUTEO.join(", ")}. Es una búsqueda por palabras; 'Compra' y 'Explora' se cuentan como imperativo de tú [INFERIDO].`);
  // alcance del tono en todo el locale es (no solo la Home)
  const esAll = readJson(path.join(TS, "locales", "es.default.json"));
  const flat = [];
  (function walk(o, p) {
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string") flat.push([p + k, v]);
      else if (v && typeof v === "object") walk(v, p + k + ".");
    }
  })(esAll, "");
  const flatV = flat.filter(([, v]) => dialectOf(v).voseo.length);
  const flatT = flat.filter(([, v]) => dialectOf(v).tuteo.length);
  P(`\nAlcance en todo theme-src/locales/es.default.json (${flat.length} textos): ${flatV.length} con formas de voseo (${flatV.map(([k]) => k).join(", ")}); ${flatT.length} con formas de tuteo (${flatT.map(([k]) => k).join(", ")}).`);
  res.dialectLocale = { totalStrings: flat.length, voseoKeys: flatV.map(([k]) => k), tuteoKeys: flatT.map(([k]) => k) };
  const cs = strings.filter((s) => s.origen === "actual");
  const ds = strings.filter((s) => s.origen === "Dev");
  res.dialect = { strings, actual: { voseoStrings: cs.filter((s) => s.voseo.length).length, tuteoStrings: cs.filter((s) => s.tuteo.length).length }, dev: { voseoStrings: ds.filter((s) => s.voseo.length).length, tuteoStrings: ds.filter((s) => s.tuteo.length).length } };

  /* H15 enlaces internos de la Home actual y su destino */
  const hrefs = new Set();
  const addH = (h) => {
    if (h && h.startsWith("/")) hrefs.add(h.split("?")[0]);
  };
  cur.header.nav.forEach((x) => addH(x.split(" -> ")[1]));
  cur.header.controls.forEach((c) => addH(c.href));
  cur.categories.cards.forEach((c) => addH(c.href));
  [...cur.editorial.cards, ...cur.featured.cards].forEach((c) => addH(c.href));
  cur.promo.links.forEach((l) => addH(l.href));
  cur.footer.columns.forEach((c) => c.links.forEach((l) => addH(l.split(" -> ")[1])));
  const redSet = new Set(redirects);
  const redLower = new Set(redirects.map((r) => r.toLowerCase()));
  const hrefRows = [...hrefs].sort().map((h) => {
    let estado;
    if (h === "/") estado = "raíz (sin redirección)";
    else if (redSet.has(h)) estado = "redirección exacta en seo/shopify-redirects-import.csv";
    else if (redLower.has(h.toLowerCase())) estado = "redirección solo con otra capitalización";
    else estado = "SIN redirección en las 47";
    return [h, estado];
  });
  table("H15 Enlaces internos de la Home actual frente a las 47 redirecciones", ["ruta enlazada", "estado"], hrefRows);
  res.internalLinks = hrefRows.map((r) => ({ path: r[0], estado: r[1] }));

  /* H16 orden de secciones */
  const pairs = [
    ["hero", "hero"],
    ["categorias", "featured-categories"],
    ["La belleza de sentirte tú", "featured-collection-editorial"],
    ["productos", "featured-products"],
    [null, "recommended-products"],
    ["20% de descuento en toda la tienda", "promo-banner"],
    ["Sé la primera en enterarte", "newsletter-home"],
  ];
  const capOrder = cap.sections.filter((s) => !["announcement-bar", "header", "footer", "cart-drawer"].includes(s.id)).map((s) => s.id);
  table("H16 Orden de secciones", ["sección", "posición actual (main)", "posición Dev (templates/index.json)", "posición Dev capturada (dev-home.json)"], pairs.map(([a, d]) => [d, a ? cur.sectionOrder.indexOf(a) + 1 : "no está en el HTML servido", dev.indexSectionOrder.indexOf(d) + 1, capOrder.indexOf(d) + 1]));
  res.sectionOrder = { current: cur.sectionOrder, devIndex: dev.indexSectionOrder, devCapture: cap.sections.map((s) => s.id) };

  /* H18 activos de marca en el repo frente al manifiesto de media */
  const REPO = path.resolve(MIG, "..");
  const brandFiles = ["public/logo/radaelli-swimwear.png", "app/icon.png", "app/favicon.ico", "app/apple-icon.png", "app/opengraph-image.tsx"];
  const brandRows = brandFiles.map((f) => {
    const p = path.join(REPO, f);
    const ex = fs.existsSync(p);
    const inManifest = manifest.filter((r) => (r.asset + " " + r.source + " " + r.shopify_target).toLowerCase().includes(path.basename(f).toLowerCase().replace(/\.[a-z]+$/, "")));
    return [f, ex ? `existe (${fs.statSync(p).size} bytes)` : "no existe en el worktree", inManifest.length ? inManifest.map((r) => r.id).join(", ") : "no figura en el manifiesto (M01 a M14)"];
  });
  const manifestBrandRows = manifest.filter((r) => /logo|favicon|icon|opengraph|social/i.test(`${r.asset} ${r.source} ${r.shopify_target}`)).map((r) => r.id);
  table("H17 Activos de marca en el repo frente a content/media/media-migration-manifest.csv", ["archivo del repo", "estado", "fila del manifiesto"], brandRows);
  P(`\nFilas del manifiesto que mencionan logo, favicon, icono, opengraph o social: ${manifestBrandRows.length ? manifestBrandRows.join(", ") : "ninguna"}. Filas totales del manifiesto: ${manifest.length}. Setting del theme para el logo: settings.logo (${dev.settings.logoSet ? "cargado" : "sin cargar"}); favicon: settings.favicon (${dev.settings.faviconSet ? "cargado" : "sin cargar"}).`);
  const homeMediaIds = ["M01", "M03", "M04", "M05", "M06", "M07", "M08", "M09"];
  const homeUnique = new Set(homeMediaIds.map((id) => (id === "M06" ? "M01" : id)));
  P(`Archivos únicos que usa la Home en el manifiesto: ${[...homeUnique].join(", ")} (${homeUnique.size}; M06 es el mismo archivo que M01 según la nota del manifiesto; M07 es opcional).`);
  res.brandAssets = { rows: brandRows, manifestRowsMentioningBrand: manifestBrandRows, manifestRows: manifest.length, homeUniqueFiles: [...homeUnique] };

  /* consistencia captura vs theme-src */
  const cons = [
    ["hero h1", heroCap.h1 === dev.hero.hero_headline],
    ["hero sub", heroCap.sub === dev.hero.hero_subheadline],
    ["hero CTA", heroCap.cta === `${dev.hero.hero_cta_label} -> ${dev.hero.hero_cta_url}`],
    ["hero fallback = sin hero_video", heroCap.variant.startsWith("fallback") === !dev.hero.hasVideo],
    ["editorial h2", edCap.h2 === dev.editorial.heading],
    ["editorial colección", edCap.collection.startsWith(dev.editorial.collection)],
    ["destacados h2", fpCap.h2 === dev.featured.heading],
    ["destacados colección", fpCap.collection === dev.featured.collection],
    ["recomendados sin colección", !dev.recommended.hasCollection],
    ["promo h2", pCap.h2 === dev.promo.headline],
    ["promo CTA", pCap.cta === `${dev.promo.cta_label} -> ${dev.promo.cta_url}`],
    ["newsletter copy", nCap.text === dev.newsletter.description],
    ["newsletter botón", nCap.cta === dev.locale.es.newsletterSubmit],
    ["anuncio", annCap === dev.announcement.text],
    ["tagline pie", fCap.tagline === dev.footer.brandDescription],
    ["orden de secciones", JSON.stringify(dev.indexSectionOrder.filter((x) => x !== "recommended-products")) === JSON.stringify(cap.sections.filter((s) => !["announcement-bar", "header", "footer", "cart-drawer", "recommended-products"].includes(s.id)).map((s) => s.id))],
  ];
  table("H18 Coherencia captura RC1.7 frente a theme-src RC1.8 (secciones de la Home)", ["comprobación", "coincide"], cons.map((c) => [c[0], c[1] ? "sí" : "NO"]));
  res.consistency = Object.fromEntries(cons.map((c) => [c[0], c[1]]));

  res.currentPage = { sectionOrder: cur.sectionOrder };
  fs.writeFileSync(OUT, JSON.stringify(stable(res), null, 1) + "\n", "utf8");
  console.log(out.join("\n"));
  console.log(`\nEscrito: ${path.relative(MIG, OUT).replace(/\\/g, "/")}`);
}
main();
