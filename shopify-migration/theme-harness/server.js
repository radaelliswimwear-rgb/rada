// Harness 02M: renderiza el LIQUID REAL de theme-src (liquidjs + shims de
// Shopify) con datos de prueba, y emula las APIs que usa el JS del theme
// (Ajax Cart, Section Rendering, Predictive Search). Solo 127.0.0.1:4178,
// vive en shopify-migration/theme-harness (G15, 03I) y NO forma parte del theme ni de los ZIP. MOCKS SOLO ACÁ: productos, colecciones, carrito, cliente.
// Registra: filtros/tags desconocidos (strictFilters), claves de traducción
// faltantes y errores de render.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Liquid, Tag, Value } = require("liquidjs");

const PORT = Number(process.env.PORT || 4178);
const THEME = process.env.THEME_DIR || path.join(__dirname, "..", "theme-src");
const DIAG = { missingTranslations: new Set(), renderErrors: [], requests: [], missingAssets: [] };
// SOLO HARNESS (?h=1): captura errores de JS y recursos rotos dentro de la página.
const CAPTURE = '<script>window.__errors=[];addEventListener("error",function(e){var t=e.target;window.__errors.push(t&&t!==window&&(t.src||t.href)?"resource: "+(t.src||t.href):"js: "+e.message);},true);addEventListener("unhandledrejection",function(e){window.__errors.push("rejection: "+(e.reason&&e.reason.message||e.reason));});</script>';

const readTheme = (p) => fs.readFileSync(path.join(THEME, p), "utf8");
const loadJSON = (p) => JSON.parse(readTheme(p));
const stripSchema = (src) => src.replace(/\{%-?\s*schema\s*-?%\}[\s\S]*?\{%-?\s*endschema\s*-?%\}/g, "");
function schemaOf(name) {
  const m = readTheme(`sections/${name}.liquid`).match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema/);
  return m ? JSON.parse(m[1]) : {};
}

/* ======================= DATOS DE PRUEBA ======================= */
let imgId = 1;
const img = (color, w = 600, h = 800, alt = "") => ({ id: imgId++, src: `/__img/${color}.svg`, width: w, height: h, aspect_ratio: w / h, alt });
let mediaId = 9000;
const media = (image, type = "image") => ({ id: mediaId++, media_type: type, alt: image.alt, preview_image: image, position: 1 });

function makeProduct(p) {
  const variants = p.sizes.map((size, i) => ({
    id: Number(`${p.id}${i + 1}`),
    title: size,
    price: p.price,
    compare_at_price: p.compare ?? null,
    available: (p.stock[i] ?? 0) > 0,
    inventory_quantity: p.stock[i] ?? 0,
    inventory_policy: "deny",
    inventory_management: "shopify",
    sku: `RAD-${p.id}-${size}`,
    options: [size],
    option1: size,
    featured_media: null,
  }));
  const images = p.colors.map((c) => img(c, 600, 800, p.title));
  const mediaList = images.map((i) => media(i));
  const firstAvailable = variants.find((v) => v.available) ?? variants[0];
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    type: p.type,
    vendor: "Radaelli",
    url: `/products/${p.handle}`,
    description: p.description ?? "<p>Traje de baño de prueba con tela de secado rápido.</p>",
    available: variants.some((v) => v.available),
    price: p.price,
    price_min: p.price,
    price_max: p.price,
    price_varies: false,
    compare_at_price: p.compare ?? null,
    options: ["Talla"],
    options_with_values: [{ name: "Talla", position: 1, values: p.sizes, selected_value: null }],
    variants,
    selected_variant: null,
    selected_or_first_available_variant: firstAvailable,
    first_available_variant: firstAvailable,
    has_only_default_variant: false,
    media: mediaList,
    images,
    featured_media: mediaList[0],
    featured_image: images[0],
    collections: [],
    tags: p.tags ?? [],
    metafields: { custom: { color: p.color } },
  };
}
const PRODUCTS = [
  makeProduct({ id: 101, handle: "bikini-oasis-natural-arena", title: "Bikini Oasis Natural Arena", type: "Bikini", color: "Arena", price: 15990000, sizes: ["XS", "S", "M", "L"], stock: [4, 9, 2, 0], colors: ["d6c5ae", "c3ae8e"] }),
  makeProduct({ id: 102, handle: "enterizo-aurora-viva-negro", title: "Enterizo Aurora Viva Negro con un nombre largo para probar el corte en mobile", type: "Enterizo", color: "Negro", price: 21990000, compare: 25990000, sizes: ["S", "M", "L"], stock: [1, 3, 5], colors: ["3f3f3f", "5a5a5a"] }),
  makeProduct({ id: 103, handle: "bikini-espuma-de-ola-blanco", title: "Bikini Espuma de Ola Blanco", type: "Bikini", color: "Blanco", price: 14990000, sizes: ["S", "M"], stock: [6, 6], colors: ["e7e7e7"] }),
  makeProduct({ id: 104, handle: "enterizo-aurora-viva-coral", title: "Enterizo Aurora Viva Coral", type: "Enterizo", color: "Coral", price: 21990000, sizes: ["S", "M"], stock: [0, 0], colors: ["f2a48f", "f7c3b3"] }),
  makeProduct({ id: 105, handle: "salida-espuma-arena", title: "Salida de Baño Espuma Arena", type: "Salida de baño", color: "Arena", price: 12990000, sizes: ["Única"], stock: [9], colors: ["efe6da"] }),
  makeProduct({ id: 106, handle: "bikini-oasis-natural-oliva", title: "Bikini Oasis Natural Oliva", type: "Bikini", color: "Oliva", price: 15990000, sizes: ["XS", "S", "M"], stock: [2, 2, 2], colors: ["8a8f6a", "a3a784"] }),
];
const byHandle = (h) => PRODUCTS.find((p) => p.handle === h);
const byVariant = (id) => {
  for (const p of PRODUCTS) for (const v of p.variants) if (v.id === Number(id)) return { product: p, variant: v };
  return null;
};

function makeCollection(handle, title, products, extra = {}) {
  return {
    id: handle.length * 1000,
    handle,
    title,
    url: `/collections/${handle}`,
    description: `<p>Colección ${title} de prueba.</p>`,
    image: img("cdbfa9", 1600, 900, title),
    products,
    products_count: products.length,
    all_products_count: products.length,
    sort_by: "manual",
    default_sort_by: "manual",
    // 03D: la lista y los nombres EXACTOS que devolvió la Dev Store (es).
    sort_options: [
      { name: "Características", value: "manual" },
      { name: "Más relevantes", value: "most-relevant" },
      { name: "Más vendidos", value: "best-selling" },
      { name: "Alfabéticamente, A-Z", value: "title-ascending" },
      { name: "Alfabéticamente, Z-A", value: "title-descending" },
      { name: "Precio, menor a mayor", value: "price-ascending" },
      { name: "Precio, mayor a menor", value: "price-descending" },
      { name: "Fecha: antiguo(a) a reciente", value: "created-ascending" },
      { name: "Fecha: reciente a antiguo(a)", value: "created-descending" },
    ],
    filters: [
      {
        type: "list", label: "Talla", param_name: "filter.v.option.talla", active_values: [],
        values: ["XS", "S", "M", "L"].map((s, i) => ({ label: s, value: s, count: 3 - (i % 2), active: false, url_to_add: `${`/collections/${handle}`}?filter.v.option.talla=${s}`, url_to_remove: `/collections/${handle}` })),
      },
      { type: "price_range", label: "Precio", param_name: "filter.v.price", active_values: [], range_max: 30000000, min_value: { param_name: "filter.v.price.gte", value: null }, max_value: { param_name: "filter.v.price.lte", value: null } },
      { type: "boolean", label: "Disponibilidad", param_name: "filter.v.availability", active_values: [], values: [{ label: "En stock", value: "1", count: 5, active: false, url_to_add: `/collections/${handle}?filter.v.availability=1`, url_to_remove: `/collections/${handle}` }] },
    ],
    metafields: { custom: {} },
    ...extra,
  };
}
function collectionFor(c, q) {
  const url = c.url;
  const gte = q.get("filter.v.price.gte");
  const lte = q.get("filter.v.price.lte");
  const avail = q.getAll("filter.v.availability");
  const tallas = q.getAll("filter.v.option.talla");
  const sd = q.get("sd") !== "0";
  const cents = (v) => (v === null || v === "" ? null : Math.round(Number(v) * 100));
  const min = cents(gte);
  const max = cents(lte);
  let products = c.products.filter((p) => (min === null || p.price >= min) && (max === null || p.price <= max));
  if (avail.length) products = products.filter((p) => avail.includes(p.available ? "1" : "0"));
  if (tallas.length) products = products.filter((p) => p.variants.some((v) => tallas.includes(v.option1)));
  const sortBy = q.get("sort_by") || c.default_sort_by;
  if (sortBy === "price-ascending") products = [...products].sort((a, b) => a.price - b.price);
  if (sortBy === "price-descending") products = [...products].sort((a, b) => b.price - a.price);
  const keep = [...q.entries()].filter(([k]) => k.startsWith("filter.") || k === "sort_by");
  const qs = (pairs) => (pairs.length ? "?" + pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&") : "");
  const listValue = (param, value, label, count) => {
    const active = q.getAll(param).includes(value);
    const without = keep.filter(([k, v]) => !(k === param && v === value));
    return { label, value, count, active, url_to_add: url + qs([...keep, [param, value]]), url_to_remove: url + qs(without) };
  };
  const filters = [];
  if (sd) {
    filters.push({ type: "list", label: "Talla", param_name: "filter.v.option.talla", active_values: [],
      values: ["XS", "S", "M", "L"].map((t) => listValue("filter.v.option.talla", t, t, c.products.filter((p) => p.variants.some((v) => v.option1 === t)).length)) });
  }
  filters.push({ type: "list", label: "Disponibilidad", param_name: "filter.v.availability", active_values: [],
    values: [listValue("filter.v.availability", "1", "En existencia", c.products.filter((p) => p.available).length), listValue("filter.v.availability", "0", "Agotado", c.products.filter((p) => !p.available).length)] });
  filters.push({ type: "price_range", label: "Precio", param_name: "filter.v.price", active_values: [], range_max: Math.max(...c.products.map((p) => p.price)),
    min_value: { param_name: "filter.v.price.gte", value: min }, max_value: { param_name: "filter.v.price.lte", value: max } });
  for (const fl of filters) if (fl.values) fl.active_values = fl.values.filter((v) => v.active);
  return { ...c, products, products_count: products.length, sort_by: sortBy, filters };
}
const COLLECTIONS = {
  "oasis-natural": makeCollection("oasis-natural", "Oasis Natural", [PRODUCTS[0], PRODUCTS[5], PRODUCTS[2]]),
  "aurora-viva": makeCollection("aurora-viva", "Aurora Viva", [PRODUCTS[1], PRODUCTS[3]]),
  "espuma-de-ola": makeCollection("espuma-de-ola", "Espuma de Ola", [PRODUCTS[2], PRODUCTS[4]]),
  "salidas-de-bano": makeCollection("salidas-de-bano", "Salidas de Baño", [PRODUCTS[4]]),
  // 03D: colección manual real "Destacados" (index.json la usa en featured-products).
  destacados: makeCollection("destacados", "Destacados", [PRODUCTS[1], PRODUCTS[5]]),
  all: makeCollection("all", "Todos los productos", PRODUCTS),
};
for (const c of Object.values(COLLECTIONS)) for (const p of c.products) if (c.handle !== "all" && !p.collections.includes(c)) p.collections.push(c);

const PAGES = {
  favoritos: { id: 1, handle: "favoritos", title: "Favoritos", url: "/pages/favoritos", content: "", template_suffix: "wishlist" },
  "sobre-nosotras": { id: 2, handle: "sobre-nosotras", title: "Sobre nosotras", url: "/pages/sobre-nosotras", content: "<p>Página de prueba.</p>" },
};
const ARTICLE = { id: 1, title: "Cómo cuidar tu traje de baño", url: "/blogs/news/cuidados", author: "Radaelli", published_at: "2026-09-01T10:00:00Z", image: img("d6c5ae", 1200, 800), excerpt: "<p>Resumen de prueba.</p>", content: "<p>Contenido de prueba.</p>", tags: ["cuidados"] };
const BLOG = { id: 1, handle: "news", title: "Blog", url: "/blogs/news", articles: [ARTICLE], articles_count: 1 };

const link = (title, url, links = []) => ({ title, url, active: false, current: false, links, handle: title.toLowerCase() });
const LINKLISTS = {
  "main-menu": { handle: "main-menu", title: "Menú principal", links: [link("Oasis Natural", "/collections/oasis-natural"), link("Aurora Viva", "/collections/aurora-viva"), link("Espuma de Ola", "/collections/espuma-de-ola", [link("Bikinis", "/collections/espuma-de-ola"), link("Enterizos", "/collections/espuma-de-ola")]), link("Salidas de Baño", "/collections/salidas-de-bano")] },
  // 03C: como la Dev Store -- menú "Comprar" con las 4 colecciones (bloque Comprar del footer).
  comprar: { handle: "comprar", title: "Comprar", links: [link("Oasis Natural", "/collections/oasis-natural"), link("Aurora Viva", "/collections/aurora-viva"), link("Espuma de Ola", "/collections/espuma-de-ola"), link("Salidas de Baño", "/collections/salidas-de-bano")] },
  // 03E: como la Dev Store -- menú "Ayuda" solo con los destinos que existen hoy.
  ayuda: { handle: "ayuda", title: "Ayuda", links: [link("Devoluciones", "/policies/refund-policy"), link("Garantía", "/pages/garantia")] },
  footer: { handle: "footer", title: "Footer", links: [link("Envíos", "/policies/shipping-policy"), link("Devoluciones", "/policies/refund-policy"), link("Contacto", "/pages/contacto")] },
  "customer-account-main-menu": { handle: "customer-account-main-menu", title: "Cuenta", links: [link("Pedidos", "/account"), link("Perfil", "/account/profile")] },
};

/* ======================= CARRITO (mock) ======================= */
let cartLines = [];
function resetCart(n = 2) {
  cartLines = [];
  if (n >= 1) cartLines.push({ variantId: 1012, quantity: 1 });
  if (n >= 2) cartLines.push({ variantId: 1021, quantity: 2 });
}
resetCart(2);
function lineItem(line) {
  const { product, variant } = byVariant(line.variantId);
  return {
    key: `${variant.id}:k${variant.id}`,
    id: variant.id,
    variant_id: variant.id,
    product_id: product.id,
    quantity: line.quantity,
    title: `${product.title} - ${variant.title}`,
    url: `${product.url}?variant=${variant.id}`,
    image: product.images[0],
    product: { id: product.id, title: product.title, handle: product.handle, url: product.url, has_only_default_variant: false },
    variant: { id: variant.id, title: variant.title, price: variant.price, compare_at_price: variant.compare_at_price, available: variant.available, quantity_rule: { min: 1, max: null, increment: 1 } },
    options_with_values: [{ name: "Talla", value: variant.title }],
    price: variant.price,
    final_price: variant.price,
    original_price: variant.price,
    original_line_price: variant.price * line.quantity,
    final_line_price: variant.price * line.quantity,
    line_level_discount_allocations: [],
    url_to_remove: `/cart/change?id=${variant.id}&quantity=0`,
    handle: product.handle,
  };
}
function cartObject() {
  const items = cartLines.map(lineItem);
  const total = items.reduce((n, i) => n + i.final_line_price, 0);
  return { token: "harness-cart", items, item_count: items.reduce((n, i) => n + i.quantity, 0), total_price: total, original_total_price: total, items_subtotal_price: total, total_discount: 0, cart_level_discount_applications: [], currency: { iso_code: "COP" }, requires_shipping: true, note: "" };
}
function cartJSON() {
  const c = cartObject();
  return { ...c, currency: "COP", items: c.items.map((i) => ({ id: i.id, key: i.key, quantity: i.quantity, variant_id: i.variant_id, title: i.title, price: i.price, line_price: i.final_line_price, final_line_price: i.final_line_price, product_title: i.product.title, variant_title: i.variant.title, url: i.url, handle: i.handle })) };
}

/* ======================= ENGINE ======================= */
const money = (cents) => (cents === null || cents === undefined || cents === "" ? "" : "$" + String(Math.round(Number(cents) / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, "."));
const kw = (args) => {
  const o = {};
  const pos = [];
  for (const a of args) if (Array.isArray(a) && a.length === 2 && typeof a[0] === "string") o[a[0]] = a[1];
  else pos.push(a);
  return { o, pos };
};
const escAttr = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Como Shopify (03B): la salida de | t viene HTML-escapada salvo claves *_html,
// y el idioma sale de request.locale (?locale=en carga en.json).
const escHtml = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
function translate(key, vars, lang = "es") {
  const locale = loadJSON(lang === "es" ? "locales/es.default.json" : `locales/${lang}.json`);
  let node = key.split(".").reduce((n, k) => (n && typeof n === "object" ? n[k] : undefined), locale);
  if (node && typeof node === "object" && vars.count !== undefined) node = Number(vars.count) === 1 ? node.one : node.other;
  if (typeof node !== "string") {
    DIAG.missingTranslations.add(`${lang}.${key}`);
    return `translation missing: ${lang}.${key}`;
  }
  const out = node.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ""));
  return key.endsWith("_html") ? out : escHtml(out);
}

// fs propio: liquidjs lee secciones/snippets sin el bloque {% schema %}.
const themeFs = {
  existsSync: (f) => fs.existsSync(f),
  exists: async (f) => fs.existsSync(f),
  readFileSync: (f) => stripSchema(fs.readFileSync(f, "utf8")),
  readFile: async (f) => stripSchema(fs.readFileSync(f, "utf8")),
  resolve: (root, file, ext) => path.resolve(root, file.endsWith(ext) ? file : file + ext),
  contains: () => true,
  sep: path.sep,
  dirname: path.dirname,
};

function splitArgs(str) {
  const out = [];
  let cur = "";
  let q = null;
  for (const ch of str) {
    if (q) {
      cur += ch;
      if (ch === q) q = null;
    } else if (ch === "'" || ch === '"') {
      q = ch;
      cur += ch;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function makeEngine() {
  const engine = new Liquid({
    root: [path.join(THEME, "sections"), path.join(THEME, "layout")],
    partials: [path.join(THEME, "snippets")],
    extname: ".liquid",
    fs: themeFs,
    strictFilters: true,
    strictVariables: false,
    jsTruthy: false,
    cache: false,
    ownPropertyOnly: false,
  });
  const f = (name, fn) => engine.registerFilter(name, fn);
  f("t", function (key, ...args) {
    let lang = "es";
    try {
      lang = this.context.getSync(["request", "locale", "iso_code"]) || "es";
    } catch {
      /* sin request en el contexto: español */
    }
    return translate(String(key), kw(args).o, lang);
  });
  f("asset_url", (v) => `/assets/${v}`);
  f("stylesheet_tag", (url) => `<link href="${url}" rel="stylesheet" type="text/css" media="all" />`);
  f("money", money);
  f("image_url", (image, ...args) => {
    if (!image) return "";
    // Shopify acepta image, media (usa preview_image), product, variant y line_item.
    const resolved = typeof image === "string" ? image : image.src ? image : image.preview_image ?? image.featured_image ?? image.image ?? image.featured_media?.preview_image;
    const src = typeof resolved === "string" ? resolved : resolved?.src;
    if (!src) {
      DIAG.renderErrors.push(`image_url: objeto sin imagen (${Object.keys(image).slice(0, 5)})`);
      return "";
    }
    const { o } = kw(args);
    return `${src}?width=${o.width ?? ""}${o.height ? `&height=${o.height}` : ""}`;
  });
  f("image_tag", (url, ...args) => {
    const { o } = kw(args);
    const attrs = Object.entries(o).filter(([k]) => !["widths", "preload"].includes(k)).map(([k, v]) => `${k}="${escAttr(v)}"`).join(" ");
    return `<img src="${escAttr(url)}" ${attrs}>`;
  });
  f("video_tag", (v, ...args) => {
    if (!v) return "";
    const o = kw(args).o;
    // 03K: fiel a Shopify, video_tag emite autoplay/loop/muted/playsinline según las opciones.
    const attrs = ["autoplay", "loop", "muted", "playsinline"].filter((k) => o[k]).join(" ");
    return `<video class="${escAttr(o.class)}"${attrs ? " " + attrs : ""}></video>`;
  });
  f("external_video_tag", (v, ...args) => (v ? `<iframe class="${escAttr(kw(args).o.class)}" title="video"></iframe>` : ""));
  f("font_face", (font) => (font ? `@font-face{font-family:${font.family};font-weight:${font.weight};font-style:normal;font-display:swap;src:local("${font.family}");}` : ""));
  f("font_modify", (font, prop, value) => (font && prop === "weight" ? { ...font, weight: Number(value) } : font));
  f("within", (url) => url);
  f("structured_data", () => '<script type="application/ld+json">{"@type":"Product"}</script>');
  f("sha256", (v) => crypto.createHash("sha256").update(String(v)).digest("hex"));
  f("placeholder_svg_tag", (name, cls) => `<svg class="${escAttr(cls)}" viewBox="0 0 10 10" aria-hidden="true"></svg>`);
  f("payment_type_svg_tag", (type, ...args) => `<svg class="${escAttr(kw(args).o.class)}" role="img" aria-labelledby="pi-${type}"><title id="pi-${type}">${type}</title></svg>`);
  f("metafield_tag", (v) => String(v?.value ?? v ?? ""));

  engine.registerTag("schema", class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid);
      while (remain.length) if (remain.shift().name === "endschema") return;
    }
    *render() {}
  });

  engine.registerTag("form", class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid);
      this.rawArgs = splitArgs(token.args);
      this.templates = [];
      const stream = liquid.parser.parseStream(remain).on("tag:endform", () => stream.stop()).on("template", (t) => this.templates.push(t)).on("end", () => { throw new Error("form sin endform"); });
      stream.start();
    }
    *render(ctx, emitter) {
      const type = this.rawArgs[0].replace(/['"]/g, "");
      const attrs = {};
      for (const a of this.rawArgs.slice(1)) {
        const m = a.match(/^([\w-]+)\s*:\s*([\s\S]+)$/);
        if (m) attrs[m[1]] = yield new Value(m[2], this.liquid).value(ctx);
      }
      const action = { product: "/cart/add", cart: "/cart", customer: "/contact#contact_form", storefront_password: "/password" }[type] ?? "/";
      const extra = Object.entries(attrs).map(([k, v]) => `${k}="${escAttr(v)}"`).join(" ");
      emitter.write(`<form method="post" action="${action}" ${extra} accept-charset="UTF-8"${type === "product" ? ' enctype="multipart/form-data"' : ""}><input type="hidden" name="form_type" value="${type}" /><input type="hidden" name="utf8" value="✓" />`);
      ctx.push({ form: { errors: ctx.globals && ctx.globals.__formErrors ? ["form"] : null, "posted_successfully?": false, posted_successfully: false } });
      yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
      ctx.pop();
      emitter.write("</form>");
    }
  });

  engine.registerTag("paginate", class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid);
      const m = token.args.match(/^(.+?)\s+by\s+(.+)$/);
      this.expr = m[1];
      this.by = m[2];
      this.templates = [];
      const stream = liquid.parser.parseStream(remain).on("tag:endpaginate", () => stream.stop()).on("template", (t) => this.templates.push(t)).on("end", () => { throw new Error("paginate sin endpaginate"); });
      stream.start();
    }
    *render(ctx, emitter) {
      const items = (yield new Value(this.expr, this.liquid).value(ctx)) ?? [];
      const size = Number(yield new Value(this.by, this.liquid).value(ctx)) || 24;
      const pages = Math.max(2, Math.ceil(items.length / size));
      ctx.push({ paginate: { current_page: 1, current_offset: 0, items: items.length, page_size: size, pages, previous: null, next: { title: "Siguiente", url: "?page=2", is_link: true }, parts: Array.from({ length: pages }, (_, i) => ({ title: String(i + 1), url: `?page=${i + 1}`, is_link: i !== 0 })) } });
      yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
      ctx.pop();
    }
  });

  engine.registerTag("section", class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid);
      this.name = token.args.trim().replace(/['"]/g, "");
    }
    *render(ctx, emitter) {
      emitter.write(yield renderSectionInstance(this.name, this.name, {}, ctx.globals, ""));
    }
  });
  engine.registerTag("sections", class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid);
      this.name = token.args.trim().replace(/['"]/g, "");
    }
    *render(ctx, emitter) {
      emitter.write(yield renderGroup(this.name, ctx.globals));
    }
  });
  return engine;
}
const engine = makeEngine();

/* ======================= SECCIONES ======================= */
function resolveSetting(def, value) {
  const v = value === undefined ? def.default : value;
  if (v === undefined || v === null || v === "") {
    if (["collection", "product", "page", "image_picker", "video", "metaobject", "link_list"].includes(def.type)) return def.type === "link_list" && def.default ? def.default : null;
    return v ?? (def.type === "checkbox" ? false : "");
  }
  switch (def.type) {
    case "collection": return COLLECTIONS[v] ?? null;
    case "product": return byHandle(v) ?? null;
    case "page": return PAGES[v] ?? null;
    case "image_picker": return typeof v === "object" ? v : img("cdbfa9", 1200, 900);
    case "font_picker": return { family: "Poppins", fallback_families: "sans-serif", weight: 400, style: "normal", handle: v };
    default: return v;
  }
}
function settingsFrom(defs, values) {
  const out = {};
  for (const d of defs ?? []) if (d.id) out[d.id] = resolveSetting(d, values?.[d.id]);
  return out;
}
function sectionObject(type, id, config) {
  const schema = schemaOf(type);
  const blockDefs = new Map((schema.blocks ?? []).map((b) => [b.type, b]));
  const order = config.block_order ?? Object.keys(config.blocks ?? {});
  const blocks = order.map((bid) => {
    const b = config.blocks[bid];
    return { id: bid, type: b.type, settings: settingsFrom(blockDefs.get(b.type)?.settings, b.settings), shopify_attributes: `data-shopify-editor-block='{"id":"${bid}","type":"${b.type}"}'` };
  });
  return { id, settings: settingsFrom(schema.settings, config.settings), blocks, location: "template" };
}
async function renderSectionInstance(type, id, config, globals, groupClass) {
  try {
    const src = stripSchema(readTheme(`sections/${type}.liquid`));
    const html = await engine.parseAndRender(src, { section: sectionObject(type, id, config) }, { globals });
    return `<div id="shopify-section-${id}" class="shopify-section${groupClass ? " " + groupClass : ""}">${html}</div>`;
  } catch (e) {
    DIAG.renderErrors.push(`${type}: ${e.message}`);
    return `<div id="shopify-section-${id}" class="shopify-section" data-render-error="${escAttr(e.message)}"></div>`;
  }
}
async function renderGroup(name, globals) {
  const data = loadJSON(`sections/${name}.json`);
  let html = "";
  for (const key of data.order) html += await renderSectionInstance(data.sections[key].type, `sections--${name}__${key}`, data.sections[key], globals, `shopify-section-group-${name}`);
  return html;
}
function templateData(name, flags) {
  const data = loadJSON(`templates/${name}.json`);
  if (name === "index" && flags.nlblank) data.sections["newsletter-home"].settings = { ...(data.sections["newsletter-home"].settings ?? {}), button_label: "" };
  // 03K hv=1: video en el hero (setting hero_video).
  if (name === "index" && flags.hv) data.sections.hero.settings = { ...(data.sections.hero.settings ?? {}), hero_video: "x" };
  if (name === "index" && flags.configured) {
    data.sections["featured-categories"].blocks = {
      c1: { type: "category", settings: { collection: "oasis-natural", heading: "Oasis Natural", description: "Tonos tierra", ...(flags.catimg ? { image: "x" } : {}), ...(flags.cv ? { video: "x" } : {}) } },
      c2: { type: "category", settings: { collection: "aurora-viva", heading: "Aurora Viva", description: "Color vivo" } },
      c3: { type: "category", settings: { collection: "espuma-de-ola", heading: "Espuma de Ola", available: false } },
    };
    data.sections["featured-categories"].block_order = ["c1", "c2", "c3"];
    data.sections["featured-collection-editorial"].settings = { collection: "aurora-viva" };
    data.sections["featured-products"].settings = { collection: "oasis-natural" };
    data.sections["recommended-products"].settings = { collection: "espuma-de-ola" };
  }
  return data;
}
async function renderTemplateSections(name, globals, flags) {
  const data = templateData(name, flags);
  let html = "";
  for (const key of data.order) html += await renderSectionInstance(data.sections[key].type, `template--${name}__${key}`, data.sections[key], globals, "");
  return html;
}
async function renderSectionById(sectionId, globals, templateName, flags) {
  let m = sectionId.match(/^template--([\w.-]+)__([\w-]+)$/);
  if (m) {
    const data = templateData(m[1], flags);
    const cfg = data.sections[m[2]];
    return cfg ? renderSectionInstance(cfg.type, sectionId, cfg, globals, "") : null;
  }
  m = sectionId.match(/^sections--([\w-]+)__([\w-]+)$/);
  if (m) {
    const data = loadJSON(`sections/${m[1]}.json`);
    const cfg = data.sections[m[2]];
    return cfg ? renderSectionInstance(cfg.type, sectionId, cfg, globals, `shopify-section-group-${m[1]}`) : null;
  }
  if (fs.existsSync(path.join(THEME, "sections", `${sectionId}.liquid`))) return renderSectionInstance(sectionId, sectionId, {}, globals, "");
  return null;
}

/* ======================= CONTEXTO POR RUTA ======================= */
function globalSettings() {
  const schema = loadJSON("config/settings_schema.json");
  const data = loadJSON("config/settings_data.json");
  const values = typeof data.current === "string" ? data.presets[data.current] : data.current;
  const defs = schema.flatMap((g) => g.settings ?? []);
  const out = settingsFrom(defs, values);
  return out;
}
// realsale=1 (03C): como el catálogo real -- títulos en MAYÚSCULAS y todos los
// productos con compare-at (-20%), que es lo que desbordaba las tarjetas.
function applyRealSale(on) {
  for (const p of PRODUCTS) {
    if (!p.__orig) p.__orig = { title: p.title, variants: p.variants.map((v) => v.compare_at_price) };
    p.title = on ? p.__orig.title.toUpperCase() : p.__orig.title;
    p.variants.forEach((v, i) => {
      v.compare_at_price = on ? Math.round(v.price * 1.25) : p.__orig.variants[i];
    });
    p.compare_at_price = on ? Math.round(p.price * 1.25) : p.variants[0]?.compare_at_price ?? p.compare_at_price;
  }
}
function contextFor(url) {
  const p = url.pathname;
  const q = url.searchParams;
  applyRealSale(q.get("realsale") === "1");
  const flags = { configured: q.get("configured") === "1", nlblank: q.get("nlblank") === "1", catimg: q.get("catimg") === "1", hv: q.get("hv") === "1", cv: q.get("cv") === "1" };
  const settings = globalSettings();
  // 03H social=alt|wa10|nowa: URLs sociales distintas para probar la derivación de usuario/número del pie.
  if (q.get("social") === "alt") {
    settings.social_instagram = "https://instagram.com/mi_marca/?hl=es";
    settings.social_facebook = "https://facebook.com/MiMarca/";
    settings.social_tiktok = "https://tiktok.com/mi_tiktok";
    settings.social_whatsapp = "https://wa.me/message/ABCDEF";
  }
  if (q.get("social") === "wa10") settings.social_whatsapp = "https://wa.me/12025550123";
  if (q.get("social") === "nowa") settings.social_whatsapp = "";
  if (q.get("sync") === "1") settings.wishlist_account_sync = true;
  if (q.get("avail") === "1") settings.collection_show_availability_filter = true;
  // 03D envío gratis: fsr=1 tarifa confirmada, fsp=1 barra del carrito encendida.
  if (q.get("fsr") === "1") settings.free_shipping_rate_confirmed = true;
  if (q.get("fsp") === "1") settings.cart_free_shipping_progress = true;
  if (q.get("logo") === "1") settings.logo = img("1f1f1f", 600, 214, "Logo");
  // 03K SEO: socimg=1 imagen para compartir en Ajustes; nosocial=1 sin redes (sin sameAs).
  if (q.get("socimg") === "1") settings.social_share_image = img("2a4d69", 1200, 630, "Compartir");
  // socimg=abs: image_url ya devuelve la URL con protocolo (no se debe anteponer "https:" otra vez).
  if (q.get("socimg") === "abs") settings.social_share_image = "https://cdn.example.com/social.png";
  if (q.get("nosocial") === "1") {
    settings.social_instagram = "";
    settings.social_facebook = "";
    settings.social_tiktok = "";
  }
  const customer = q.get("customer") === "1" ? { id: 7001, first_name: "Prueba", email: "prueba@example.com", metafields: { custom: { wishlist: { value: [PRODUCTS[0], PRODUCTS[2]] } } } } : null;
  const base = {
    settings,
    shop: { password_message: q.get("pwmsg") ?? "", name: q.get("shopname") ?? "Radaelli Swimwear", permanent_domain: "harness.example", customer_accounts_enabled: q.get("accounts") !== "0", enabled_payment_types: ["visa", "master", "american_express"], currency: "COP", email: "", shipping_policy: { url: "/policies/shipping-policy" }, refund_policy: { url: "/policies/refund-policy" } },
    routes: { root_url: "/", account_url: "/account", account_login_url: "/account/login", account_logout_url: "/account/logout", account_register_url: "/account/register", cart_url: "/cart", cart_add_url: "/cart/add", cart_change_url: "/cart/change", cart_update_url: "/cart/update", search_url: "/search", predictive_search_url: "/search/suggest", collections_url: "/collections", all_products_collection_url: "/collections/all" },
    request: { locale: { iso_code: q.get("locale") === "en" ? "en" : "es" }, origin: `http://127.0.0.1:${PORT}`, host: `127.0.0.1:${PORT}`, path: p, design_mode: false, page_type: "" },
    localization: { language: { iso_code: q.get("locale") === "en" ? "en" : "es" }, country: { iso_code: "CO" } },
    cart: cartObject(),
    customer,
    linklists: LINKLISTS,
    collections: COLLECTIONS,
    // unassigned=1: como la Dev Store en 03B -- la página existe pero sin plantilla page.wishlist.
    pages: q.get("unassigned") === "1" ? { ...PAGES, favoritos: { ...PAGES.favoritos, template_suffix: null } } : PAGES,
    content_for_header: "",
    canonical_url: `http://127.0.0.1:${PORT}${p}`,
    page_description: "",
    powered_by_link: "",
  };
  // 03K SEO: shopdesc=texto (shop.description de Preferencias), pdesc=texto (page_description), pimg=1 (page_image en páginas sin producto).
  if (q.get("shopdesc")) base.shop.description = q.get("shopdesc");
  if (q.get("pdesc")) base.page_description = q.get("pdesc");
  if (q.get("pimg") === "1") base.page_image = img("8c5a3a", 1200, 800, "Imagen de página");
  // cur=USD: moneda de presentación distinta de la base (Markets).
  if (q.get("cur")) base.cart = { ...base.cart, currency: { iso_code: q.get("cur") } };
  // wlpage=1: Theme settings > Wishlist con la página elegida (rama settings.wishlist_page del header).
  if (q.get("wlpage") === "1") settings.wishlist_page = base.pages.favoritos;
  let templateName = "404";
  let suffix = null;
  let status = 200;
  let title = "Radaelli Swimwear";
  let m;
  if (p === "/password") {
    templateName = "password";
    base.__formErrors = q.get("pwerror") === "1";
  } else if (p === "/") templateName = "index";
  else if ((m = p.match(/^\/collections\/([\w-]+)$/)) && COLLECTIONS[m[1]]) {
    templateName = "collection";
    base.collection = collectionFor(COLLECTIONS[m[1]], q);
    // 03E banner=1: metafields como OBJETOS {value, type} (fiel a Shopify: el
    // objeto metafield solo expone value/type/list?), para probar el uso de .value.
    if (q.get("banner") === "1") base.collection = { ...base.collection, metafields: { custom: { ...base.collection.metafields.custom, cover_image: { type: "file_reference", value: img("cdbfa9", 2400, 1600, "Banner") }, image_pos_x: { type: "number_decimal", value: 50 }, image_pos_y: { type: "number_decimal", value: 26.69 }, zoom: { type: "number_decimal", value: 1 }, ...(q.get("bv") === "1" ? { cover_video: { type: "file_reference", value: "x" } } : {}) } } };
    title = base.collection.title;
  } else if ((m = p.match(/^\/products\/([\w-]+)$/)) && byHandle(m[1])) {
    templateName = "product";
    const product = { ...byHandle(m[1]) };
    // 03G crumbs=1|2|3: colecciones en el orden "malo" (Destacados primero), como
    // devolvió Shopify en la Dev Store, para probar miga / "Volver a" / JSON-LD.
    //  1 = tipo = título de colección, sin contexto; 2 = igual pero llegando desde
    //  Destacados (contexto `collection`); 3 = tipo sin colección homónima (respaldo).
    const cr = q.get("crumbs");
    if (cr && product.handle === "bikini-oasis-natural-oliva") {
      product.type = cr === "3" ? "Bikini" : "Oasis Natural";
      product.collections = [COLLECTIONS.destacados, COLLECTIONS["oasis-natural"]];
      if (cr === "2") base.collection = COLLECTIONS.destacados;
    }
    const vid = Number(q.get("variant"));
    if (vid) product.selected_variant = product.variants.find((v) => v.id === vid) ?? null;
    base.product = product;
    // 03K: Shopify pone page_image = imagen destacada del producto.
    base.page_image = product.featured_image;
    title = product.title;
  } else if (p === "/search") {
    templateName = "search";
    const terms = q.get("q") ?? "";
    const results = terms ? PRODUCTS.filter((x) => x.title.toLowerCase().includes(terms.toLowerCase())).map((x) => ({ ...x, object_type: "product" })) : [];
    base.search = { performed: terms !== "", terms, results, results_count: results.length, types: ["product"] };
  } else if (p === "/cart") templateName = "cart";
  else if ((m = p.match(/^\/pages\/([\w-]+)$/)) && base.pages[m[1]]) {
    base.page = base.pages[m[1]];
    // ?view=X pisa la plantilla asignada (plantillas alternativas de Shopify).
    const view = q.get("view") || base.page.template_suffix;
    templateName = view ? `page.${view}` : "page";
    suffix = view ?? null;
    title = base.page.title;
  } else if (p === "/blogs/news") {
    templateName = "blog";
    base.blog = BLOG;
  } else if (p === "/blogs/news/cuidados") {
    templateName = "article";
    base.blog = BLOG;
    base.article = ARTICLE;
  } else status = 404;
  const [tplBase] = templateName.split(".");
  base.template = { name: tplBase, suffix, directory: null };
  base.request.page_type = tplBase;
  base.page_title = q.get("ptitle") ?? title;
  // 03E tags=a,b: current_tags (colección filtrada por etiqueta).
  if (q.get("tags")) base.current_tags = q.get("tags").split(",");
  return { templateName, globals: base, status, flags };
}

async function renderPage(url) {
  const ctx = contextFor(url);
  const content = await renderTemplateSections(ctx.templateName, ctx.globals, ctx.flags);
  const layoutName = templateData(ctx.templateName, ctx.flags).layout || "theme";
  const layoutSrc = readTheme(`layout/${layoutName}.liquid`);
  let html;
  try {
    html = await engine.parseAndRender(layoutSrc, {}, { globals: { ...ctx.globals, content_for_layout: content } });
  } catch (e) {
    DIAG.renderErrors.push(`layout: ${e.message}`);
    html = `<pre>layout error: ${escAttr(e.message)}</pre>`;
  }
  return { html, status: ctx.status };
}

/* Sin JS: quita todos los <script> y "abre" los <noscript>, como un navegador con JS apagado. */
function toNoJs(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<noscript>([\s\S]*?)<\/noscript>/gi, "$1");
}

/* ======================= HTTP ======================= */
function send(res, status, body, type = "text/html; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
function parseMultipart(buf, contentType) {
  const boundary = contentType.match(/boundary=(.+)$/)?.[1];
  const out = {};
  if (!boundary) return out;
  for (const part of buf.toString("utf8").split(`--${boundary}`)) {
    const m = part.match(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
async function sectionsPayload(ids, sectionsUrl) {
  const url = new URL(sectionsUrl || "/", `http://127.0.0.1:${PORT}`);
  const ctx = contextFor(url);
  const out = {};
  for (const id of ids) out[id] = await renderSectionById(id, ctx.globals, ctx.templateName, ctx.flags);
  return out;
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const p = url.pathname;
    if (!p.startsWith("/assets/") && !p.startsWith("/__")) DIAG.requests.push(`${req.method} ${p}${url.search}`);
    try {
      if (p === "/__rc/diag") return send(res, 200, JSON.stringify({ missingTranslations: [...DIAG.missingTranslations], renderErrors: DIAG.renderErrors, requests: DIAG.requests, missingAssets: DIAG.missingAssets }), "application/json");
      if (p === "/__rc/reset") {
        if (url.searchParams.get("all") === "1") {
          DIAG.missingTranslations.clear();
          DIAG.renderErrors = [];
          DIAG.missingAssets = [];
        }
        DIAG.requests = [];
        resetCart(Number(url.searchParams.get("cart") ?? 2));
        return send(res, 200, "{}", "application/json");
      }
      if (p === "/__rc/runner") return send(res, 200, fs.readFileSync(path.join(__dirname, "runner.html"), "utf8"));
      if (p === "/__rc/tests.js") return send(res, 200, fs.readFileSync(path.join(__dirname, process.env.TESTS_FILE || "tests.js"), "utf8"), "text/javascript; charset=utf-8");
      if (p.startsWith("/__img/")) {
        const color = p.slice(7).replace(".svg", "").replace(/[^0-9a-f]/gi, "").slice(0, 6) || "cccccc";
        return send(res, 200, `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#${color}"/></svg>`, "image/svg+xml");
      }
      if (p.startsWith("/assets/")) {
        const file = path.join(THEME, "assets", path.basename(p));
        if (!fs.existsSync(file)) {
          DIAG.missingAssets.push(p);
          return send(res, 404, "missing asset", "text/plain");
        }
        const type = file.endsWith(".css") ? "text/css; charset=utf-8" : file.endsWith(".js") ? "text/javascript; charset=utf-8" : "application/octet-stream";
        return send(res, 200, fs.readFileSync(file), type);
      }
      if (p === "/cart.js") return send(res, 200, JSON.stringify(cartJSON()), "application/json");
      if (p === "/cart/add.js" && req.method === "POST") {
        const body = await readBody(req);
        const ct = req.headers["content-type"] ?? "";
        const data = ct.startsWith("multipart/") ? parseMultipart(body, ct) : ct.includes("json") ? JSON.parse(body.toString()) : Object.fromEntries(new URLSearchParams(body.toString()));
        const found = byVariant(data.id);
        if (!found) return send(res, 404, JSON.stringify({ status: 404, message: "Cart Error", description: "Variante no encontrada" }), "application/json");
        if (!found.variant.available) return send(res, 422, JSON.stringify({ status: 422, message: "Cart Error", description: `${found.product.title} está agotado.` }), "application/json");
        const qty = Number(data.quantity || 1);
        const line = cartLines.find((l) => l.variantId === found.variant.id);
        if (line) line.quantity += qty;
        else cartLines.push({ variantId: found.variant.id, quantity: qty });
        const item = lineItem(cartLines.find((l) => l.variantId === found.variant.id));
        const ids = String(data.sections ?? "").split(",").filter(Boolean);
        return send(res, 200, JSON.stringify({ ...item, sections: await sectionsPayload(ids, data.sections_url) }), "application/json");
      }
      if (p === "/cart/change.js" && req.method === "POST") {
        const data = JSON.parse((await readBody(req)).toString() || "{}");
        const idx = cartLines.findIndex((l) => lineItem(l).key === data.id);
        if (idx < 0) return send(res, 400, JSON.stringify({ status: 400, message: "Cart Error", description: "Línea no encontrada" }), "application/json");
        if (Number(data.quantity) <= 0) cartLines.splice(idx, 1);
        else cartLines[idx].quantity = Number(data.quantity);
        const ids = Array.isArray(data.sections) ? data.sections : String(data.sections ?? "").split(",").filter(Boolean);
        return send(res, 200, JSON.stringify({ ...cartJSON(), sections: await sectionsPayload(ids, data.sections_url) }), "application/json");
      }
      if (p === "/search/suggest") {
        const terms = url.searchParams.get("q") ?? "";
        const ctx = contextFor(url);
        const results = PRODUCTS.filter((x) => x.title.toLowerCase().includes(terms.toLowerCase()) || x.type.toLowerCase().includes(terms.toLowerCase()));
        ctx.globals.predictive_search = { performed: true, terms, resources: { products: results.slice(0, Number(url.searchParams.get("resources[limit]") || 5)) } };
        const html = await renderSectionById(url.searchParams.get("section_id") || "predictive-search", ctx.globals, "search", ctx.flags);
        return send(res, 200, html ?? "");
      }
      // Section Rendering API: ?sections=a,b (JSON) o ?section_id=x (HTML)
      if (url.searchParams.get("sections")) {
        const out = await sectionsPayload(url.searchParams.get("sections").split(","), p + url.search);
        return send(res, 200, JSON.stringify(out), "application/json");
      }
      if (url.searchParams.get("section_id")) {
        const ctx = contextFor(url);
        if (ctx.status === 404) return send(res, 404, "<h1>404</h1>");
        const html = await renderSectionById(url.searchParams.get("section_id"), ctx.globals, ctx.templateName, ctx.flags);
        return send(res, html ? 200 : 404, html ?? "");
      }
      if (["/account", "/account/login", "/account/logout", "/contact", "/policies/shipping-policy", "/policies/refund-policy"].includes(p)) return send(res, 200, `<h1>Stub ${p}</h1>`);
      const { html, status } = await renderPage(url);
      let out = url.searchParams.get("nojs") === "1" ? toNoJs(html) : html;
      if (url.searchParams.get("h") === "1") out = out.replace(/<head>/i, "<head>" + CAPTURE);
      return send(res, status, out);
    } catch (e) {
      DIAG.renderErrors.push(`${p}: ${e.stack}`);
      return send(res, 500, `<pre>${escAttr(e.stack)}</pre>`);
    }
  })
  .listen(PORT, "127.0.0.1", () => console.log(`rc render harness on http://127.0.0.1:${PORT}`));
