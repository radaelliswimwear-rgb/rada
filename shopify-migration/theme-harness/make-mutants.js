// Mutantes de la página de contraseña (03B): cada uno debe hacer fallar al
// menos un test "N Password". Uso: node make-mutants.js <id> (con MUT_DIR=<nombre> para varios a la vez; imprime la carpeta del theme mutado)
//  1 = sin flex-direction: column (tarjeta a la izquierda: bug real visto en Shopify)
//  2 = error sin role="alert" ni aria-describedby
//  3 = label sin for= (input sin nombre accesible)
// Además genera tests-n.js (solo helpers + a11yAudit + bloque N) para correr
// la verificación de mutantes sin la suite completa.
const fs = require("fs");
const path = require("path");
const os = require("os");
const SRC = path.join(__dirname, "..", "theme-src");
// Los mutantes se crean FUERA del repo (directorio temporal), en <MUT_ROOT>/<MUT_DIR>/theme.
const MUT_ROOT = process.env.MUT_ROOT || path.join(os.tmpdir(), "rc-harness");
const MUT = process.env.MUT_DIR || "rc-mutant";
const DEST = path.join(MUT_ROOT, MUT, "theme");

const s = fs.readFileSync(path.join(__dirname, "tests.js"), "utf8");
const cut = (a, b) => {
  const i = s.indexOf(a);
  const j = s.indexOf(b, i);
  if (i < 0 || j < 0) throw new Error("tests.js: no se encontró " + a);
  return s.slice(i, j);
};
const head = s.slice(0, s.indexOf("/* ============ Responsive"));
const a11y = cut("function a11yAudit", "for (const page of [");
const n = cut("/* ============ K2. Link a Favoritos", "/* ============ Diagnóstico del render");
fs.writeFileSync(path.join(__dirname, "tests-n.js"), head + a11y + n + "window.__done = true;\nrender();\n");

fs.rmSync(path.join(MUT_ROOT, MUT), { recursive: true, force: true });
fs.cpSync(SRC, DEST, { recursive: true });
const id = process.argv[2];
const edit = (rel, from, to) => {
  const file = path.join(DEST, rel);
  const txt = fs.readFileSync(file, "utf8");
  const next = txt.replace(from, to);
  if (next === txt) throw new Error("mutante " + id + ": patrón no encontrado en " + rel);
  fs.writeFileSync(file, next);
};
if (id === "0") {
  /* control: theme sin cambios */
} else if (id === "1") edit("assets/section-password.css", "  flex-direction: column;\n", "");
else if (id === "2") {
  edit("sections/main-password.liquid", 'id="{{ error_id }}" role="alert"', 'id="{{ error_id }}"');
  edit("sections/main-password.liquid", /\n\s*aria-describedby="\{\{ error_id \}\}"/, "");
} else if (id === "3") edit("sections/main-password.liquid", ' for="{{ field_id }}"', "");
else if (id === "5") edit("assets/section-password.css", /(\.password__message \{[^}]*?)\n  overflow-wrap: anywhere;/, "$1");
else if (id === "6") edit("sections/main-password.liquid", /\n  if heading == blank\n    assign heading = 'general\.password\.heading' \| t\n  endif/, "");
else if (id === "7") edit("sections/main-product.liquid", "{{ 'cart.general.error_add' | t }}", "{{ 'cart.general.error_add' | t | escape }}");
else if (id === "8") edit("sections/main-password.liquid", "<h1 class=\"password__heading\">{{ heading }}</h1>", "<h1 class=\"password__heading\">{{ heading | escape }}</h1>");
else if (id === "9") edit("assets/cart.js", /const strings = Object\.fromEntries\([^\n]*\n/, "const strings = config.strings ?? {};\n");
else if (id === "10") edit("assets/component-card.css", /(\.product-card__content \{\n  display: flex;\n)  flex-wrap: wrap;\n/, "$1");
// 03D filtros de colección
else if (id === "11") edit("snippets/collection-filters.liquid", 'value="{% if filter.min_value.value %}{{ filter.min_value.value | divided_by: 100 }}{% endif %}"', 'value="{{ filter.min_value.value }}"');
else if (id === "12") edit("snippets/collection-filters.liquid", /\n\s*\{%- if filter\.min_value\.value -%\}\n\s*<input type="hidden" name="\{\{ filter\.min_value\.param_name \}\}"[^\n]*\n\s*\{%- endif -%\}/, "");
else if (id === "13") edit("snippets/collection-filters.liquid", "settings.collection_show_availability_filter != true", "false");
else if (id === "14") edit("snippets/collection-filters.liquid", 'href="{{ clear_url }}"', 'href="{{ collection.url }}"');
else if (id === "15") edit("snippets/collection-filters.liquid", "{{ 'general.filters.sort_featured' | t }}", "{{ option.name }}");
else if (id === "16") edit("assets/collection-filters.js", 'window.addEventListener("pageshow",', 'window.addEventListener("pageshow-disabled",');
// 03D envío gratis
else if (id === "17") edit("sections/promo-banner.liquid", "{%- if settings.free_shipping_rate_confirmed and settings.free_shipping_threshold > 0", "{%- if settings.free_shipping_threshold > 0");
else if (id === "18") edit("sections/main-product.liquid", "{%- if settings.free_shipping_rate_confirmed and settings.free_shipping_threshold > 0", "{%- if settings.free_shipping_threshold > 0");
else if (id === "19") edit("sections/main-product.liquid", /(settings\.free_shipping_threshold > 0) and cart\.currency\.iso_code == shop\.currency -%\}\n(\s*)\{%- comment -%\} Setting en pesos/, "$1 -%}\n$2{%- comment -%} Setting en pesos");
else if (id === "20") edit("snippets/cart-free-shipping.liquid", "settings.cart_free_shipping_progress and settings.free_shipping_rate_confirmed and", "settings.cart_free_shipping_progress and");
else if (id === "21") edit("templates/product.json", '"content": "Garantía de 12 meses', '"content": "Por debajo de ese monto, el valor del envío se informa antes del despacho, según tu destino. Garantía de 12 meses');
// 03E SEO / LCP
else if (id === "22") edit("layout/theme.liquid", "{%- if template.name == 'search' or template.suffix == 'wishlist' -%}", "{%- if template.name == 'search' -%}");
else if (id === "23") edit("layout/theme.liquid", '<meta name="robots" content="noindex, follow">', "");
else if (id === "24") edit("sections/main-collection.liquid", ", lazy_load: card_lazy -%}", " -%}");
else if (id === "25") edit("snippets/product-card.liquid", 'height="{{ product.images[1].height }}"\n          loading="lazy"', 'height="{{ product.images[1].height }}"\n          loading="{{ card_loading }}"');
// 03E contraste
else if (id === "26") edit("assets/section-collection-banner.css", /\n  color: inherit;\n  margin-top: var\(--space-2\);/, "\n  margin-top: var(--space-2);");
else if (id === "27") edit("assets/section-hero.css", /de h1 y, con video, el título quedaba #171717 sobre video oscuro\. \*\/\n  color: inherit;/, "de h1 y, con video, el título quedaba #171717 sobre video oscuro. */");
// 03E seguridad / a11y / metafields (verificadores adversariales)
else if (id === "28") edit("assets/collection-filters.js", `const currentView = ["2", "3", "4"].includes(requestedView) ? requestedView : defaultView;`, `const currentView = requestedView || defaultView;`);
else if (id === "29") { edit("snippets/collection-filters.liquid", `{%- if valid_sort_by != blank -%}
            <input type="hidden" name="sort_by" value="{{ valid_sort_by }}">`, `{%- if collection.sort_by != blank -%}
            <input type="hidden" name="sort_by" value="{{ collection.sort_by }}">`); }
else if (id === "30") edit("layout/theme.liquid", "{{ page_title | escape_once }}\n", "{{ page_title }}\n");
else if (id === "31") edit("layout/theme.liquid", `{{ 'general.meta.tags' | t: tags: current_tags_text }}`, `tagged "{{ current_tags | join: ', ' }}"`);
else if (id === "32") edit("snippets/price.liquid", /\n\s*<span class="visually-hidden">\{\{ 'cart\.item\.compare_at' \| t \}\}<\/span>\n(\s*)<s>/, "\n$1<s>");
else if (id === "33") edit("assets/component-card.css", /\n  position: relative;\n  font-size: var\(--font-size-caption\);\n  color: var\(--color-text-muted\);/, "\n  font-size: var(--font-size-caption);\n  color: var(--color-text-muted);");
else if (id === "34") edit("sections/footer.liquid", `site-footer__social" role="group"`, `site-footer__social" role="list"`);
else if (id === "35") edit("sections/newsletter-home.liquid", /\n\s*autocomplete="email"/, "");
else if (id === "36") edit("sections/main-collection.liquid", `overlay_cta: 'view_product'`, `overlay_cta: 'quick_view'`);
else if (id === "37") edit("assets/component-card.css", ".product-card__overlay {\n  pointer-events: none;\n", ".product-card__overlay {\n");
else if (id === "38") edit("assets/component-card.css", ".product-card__link:focus-visible {\n  outline-offset: -2px;\n}", "");
else if (id === "39") edit("assets/product-carousel.js", /\n\s*if \(focused === this\.nextButton[^\n]*\n/, "\n");
else if (id === "40") edit("assets/section-header.css", "color: #666; /* 03E (A11Y-11)", "color: #737373; /* 03E (A11Y-11)");
else if (id === "41") edit("assets/search.js", `    this.status.textContent = "";\n    this.announceTimer`, `    this.announceTimer`);
else if (id === "42") edit("sections/main-collection.liquid", ` aria-haspopup="dialog" aria-controls="collection-filter-drawer" aria-expanded="false">`, `>`);
else if (id === "43") edit("snippets/product-gallery.liquid", `data-lightbox-counter aria-live="polite"`, `data-lightbox-counter`);
else if (id === "44") edit("sections/header.liquid", `class="text-eyebrow site-header__nav-link"\n                aria-expanded="false"`, `class="text-eyebrow site-header__nav-link"\n                aria-haspopup="true"\n                aria-expanded="false"`);
else if (id === "45") edit("assets/base.css", /\.shopify-policy__body a:not\(\[class\]\) \{\n  text-decoration: underline;/, ".shopify-policy__body a:not([class]) {\n  text-decoration: none;");
else if (id === "46") edit("snippets/collection-banner.liquid", "assign cover_image = collection.metafields.custom.cover_image.value", "assign cover_image = collection.metafields.custom.cover_image");
else if (id === "47") edit("locales/en.json", `"free_shipping": "Free shipping on orders of {{ amount }} or more."`, `"free_shipping": "Free shipping on orders over {{ amount }}."`);
else if (id === "48") edit("assets/collection-filters.js", `    if (keyboardChange) {\n      keyboardChange = false;\n      return;\n    }\n`, ``);
else if (id === "49") edit("layout/theme.liquid", " or page.handle == 'favoritos'", "");
else if (id === "50") edit("templates/product.json", `"warranty_url": "/pages/garantia"`, `"warranty_url": ""`);
else if (id === "51") edit("sections/main-product.liquid", "if product_collection.title == product.type", "if false");
// 03H convergencia Home/pie
else if (id === "52") edit("templates/index.json", '"hero_cta_url": "#productos"', '"hero_cta_url": "#categorias"');
else if (id === "53") edit("templates/index.json", '"cta_url": "#productos"', '"cta_url": "#categorias"');
else if (id === "54") edit("sections/featured-collection-editorial.liquid", ", show_category_badge: false, show_view_product: false", "");
else if (id === "55") edit("snippets/product-carousel.liquid", "if show_view_product == false", "if false");
else if (id === "56") edit("snippets/product-carousel.liquid", "if show_category_badge == false", "if false");
else if (id === "57") edit("snippets/product-carousel.liquid", "assign card_overlay = 'view_product'", "assign card_overlay = nil");
else if (id === "58") edit("sections/newsletter-home.liquid", "section.settings.button_label != blank", "false");
else if (id === "59") edit("sections/footer-group.json", /\n\s*"brand_name": "Radaelli Swimwear",/, "");
else if (id === "60") { edit("sections/footer-group.json", /,\n\s*"brand_description": "[^\n]*"/, ""); edit("sections/footer.liquid", '"default": "<p>Radaelli Swimwear: trajes', '"default": "<p>Trajes'); }
else if (id === "61") edit("sections/footer-group.json", '"heading": "",', '"heading": "Contacto",');
else if (id === "62") edit("sections/footer.liquid", /unless contact_ig contains '@'\s+assign contact_ig = contact_ig \| prepend: '@'\s+endunless/, "");
else if (id === "63") edit("sections/footer.liquid", "append: ' ' | append: contact_wa_b", "append: '' | append: contact_wa_b");
else if (id === "64") edit("sections/footer.liquid", "{%- if contact_ig != blank -%}", "{%- if false -%}");
else if (id === "65") edit("sections/footer.liquid", "if contact_digits_check == contact_digits", "if true");
// 03K SEO (HP-11) y contraste (H-01)
else if (id === "66") edit("layout/theme.liquid", '<meta name="twitter:title" content="{{ page_title | escape_once }}">', "");
else if (id === "67") edit("layout/theme.liquid", "assign seo_og_type = 'product'", "assign seo_og_type = 'website'");
else if (id === "68") edit("snippets/seo-structured-data.liquid", "{%- if template.name == 'index' -%}", "{%- if true -%}");
else if (id === "69") edit("snippets/seo-structured-data.liquid", '"name": {{ shop.name | json | replace: \'</\', \'< /\' }},\n      "url": {{ seo_home_url | json | replace: \'</\', \'< /\' }}\n', '"name": {{ shop.name | json }},\n      "url": {{ seo_home_url | json }}\n');
else if (id === "70") edit("layout/theme.liquid", "unless seo_image_url contains '://'", "unless false");
else if (id === "71") edit("layout/theme.liquid", "assign seo_image = settings.social_share_image", "assign seo_image = blank");
else if (id === "72") edit("snippets/seo-structured-data.liquid", "append: routes.search_url | append: '?q={search_term_string}'", "append: '/buscar' | append: '?q={search_term_string}'");
else if (id === "73") edit("sections/featured-categories.liquid", "if block.settings.video == blank and cat_image == blank", "if false");
else if (id === "74") edit("snippets/seo-structured-data.liquid", "    assign seo_same_as = ''\n    assign seo_same_as_sep = ''\n", "    assign seo_same_as = settings.social_whatsapp | json\n    assign seo_same_as_sep = ','\n");
else if (id === "75") edit("snippets/seo-structured-data.liquid", "{%- if seo_logo_url != blank -%}", "{%- if true -%}");
else if (id === "76") edit("sections/main-collection.liquid", `        <h2 class="visually-hidden">{{ 'collections.general.products_heading' | t }}</h2>\n`, "");
else if (id === "77") edit("sections/main-search.liquid", `      <h2 class="visually-hidden">{{ 'collections.general.products_heading' | t }}</h2>\n`, "");
else if (id === "78") edit("assets/motion-media.js", "      video.pause();\n", "");
else if (id === "79") edit("assets/motion-media.js", ", video.section-categories__media-el", "");
else if (id === "80") edit("assets/motion-media.js", "      video.setAttribute('autoplay', '');\n", "");
else if (id === "81") edit("layout/theme.liquid", "    <script src=\"{{ 'motion-media.js' | asset_url }}\" defer=\"defer\" type=\"module\"></script>\n", "");
else if (id === "4") edit("sections/header.liquid", /\n  if wishlist_page\.template_suffix != 'wishlist'\n    assign wishlist_url = wishlist_url \| append: '\?view=wishlist'\n  endif/, "");
else throw new Error("mutante desconocido");
console.log("mutante " + id + " listo en " + DEST.replace(/\\/g, "/") + " (usar como THEME_DIR); tests-n.js generado");
