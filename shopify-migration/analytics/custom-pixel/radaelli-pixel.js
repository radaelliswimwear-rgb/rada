/*
 * Radaelli -- custom pixel de Shopify (Fase 03E). ESQUELETO APAGADO.
 *
 * Qué es: el código que se pega en Admin > Configuración > Eventos de
 * clientes > "Agregar píxel personalizado". Corre en el sandbox "lax" de
 * Shopify (iframe) con las variables `analytics`, `browser` e `init` ya
 * disponibles; `customerPrivacy` se toma de `api.customerPrivacy` (forma del
 * ejemplo oficial) o de la variable suelta si existe. Ver README.md (pasos
 * owner-only).
 *
 * Estado de fábrica: ENABLED = false y los dos IDs vacíos. Así NO se
 * suscribe a nada, NO carga gtag.js ni fbevents.js y NO manda nada.
 *
 * Doble compuerta de consentimiento:
 *   1) Shopify: permiso "Obligatorio" en la configuración del pixel (el
 *      pixel no carga sin consentimiento de esa categoría).
 *   2) Este código: cada envío revisa el consentimiento vigente
 *      (init.customerPrivacy + visitorConsentCollected). GA4 exige
 *      analytics; Meta exige marketing + venta de datos. Falla cerrado.
 *
 * Nada de PII: el mapa (event-map.js, copiado abajo) trabaja con lista
 * blanca de campos de catálogo/monto; nunca email, teléfono, nombre,
 * dirección ni token de checkout crudo.
 *
 * NO pegar IDs inventados: GA4_MEASUREMENT_ID y META_PIXEL_ID los entrega
 * la dueña desde sus cuentas (03E-analytics-plan.md § 11).
 */

/* BEGIN CONFIG */
const RADAELLI_PIXEL_CONFIG = Object.freeze({
  // Interruptor maestro. false = el pixel no se suscribe a nada ni carga scripts.
  ENABLED: false,
  // "gaps_only" (recomendado): solo lo que NO mandan las apps oficiales
  // (Google & YouTube, Facebook & Instagram). "full": todo el embudo; usar
  // SOLO si esas apps no están instaladas (si no, se duplican eventos).
  MODE: "gaps_only",
  // ID de medición de GA4 (formato "G-..."). Vacío = GA4 apagado.
  GA4_MEASUREMENT_ID: "",
  // ID del dataset/píxel de Meta (solo dígitos). Vacío = Meta apagado.
  META_PIXEL_ID: "",
  // Cookie propia que marca tráfico interno con valor "1". Vacío = sin exclusión.
  INTERNAL_TRAFFIC_COOKIE: "",
  // En gaps_only, eventos estándar que igual manda ESTE pixel. Solo después de
  // comprobar (DebugView / Test Events) que la app oficial NO los manda.
  GA4_EXTRA_STANDARD_EVENTS: [],
  META_EXTRA_STANDARD_EVENTS: [],
  // true = console.log de cada envío (solo para pruebas con el Pixel Helper).
  DEBUG: false,
});
/* END CONFIG */

/* BEGIN event-map.js */
/*
 * Radaelli -- mapa de eventos de analytics (Fase 03E).
 *
 * Módulo PURO: sin DOM, sin red, sin cookies, sin estado, sin fechas. Recibe
 * eventos de Shopify (Web Pixels API: standard events + custom events
 * "radaelli:*") y devuelve qué mandar a GA4 y a Meta, o null.
 *
 * Se escribe como script clásico (sin import/export) porque así lo ejecuta
 * el sandbox "lax" de un custom pixel de Shopify. radaelli-pixel.js lleva una
 * COPIA EXACTA de este archivo entre marcadores; test/event-map.test.mjs
 * falla si las dos copias difieren.
 *
 * Reglas (ver ../03E-analytics-plan.md):
 *   - Nunca PII: lista blanca de campos. Jamás email, teléfono, nombre,
 *     dirección, token de checkout crudo ni query string arbitraria.
 *   - Moneda y montos salen SIEMPRE del evento (nunca se asume COP).
 *   - Un dueño por evento y destino: en modo "gaps_only" los eventos del
 *     embudo los mandan las apps oficiales (Google & YouTube, Facebook &
 *     Instagram) y este pixel solo cubre lo que ellas no mandan.
 *   - event_id estable: por checkout (hash del token) o por pedido
 *     ("purchase:<id numérico>", igual que lib/analytics/purchase-event-id.ts
 *     del sitio Next.js).
 */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module && module.exports) module.exports = api;
  if (root) root.RadaelliEventMap = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "0.1.0";
  const MODES = Object.freeze({ GAPS_ONLY: "gaps_only", FULL: "full" });
  const CUSTOM_PREFIX = "radaelli:";
  const MAX_PARAM_LENGTH = 100; // GA4: valores de parámetros de evento
  const MAX_URL_LENGTH = 1000; // GA4: page_location
  const MAX_LIST_ITEMS = 20;
  const MAX_CONTENT_IDS = 10;

  // Eventos estándar de Meta según developers.facebook.com/docs/meta-pixel/reference
  // (17, consultado 2026-09-29). "AddShippingInfo" NO está: el sitio Next.js
  // lo trataba como estándar (lib/analytics/adapters/meta-pixel-browser.ts:25-38).
  const META_STANDARD_EVENTS = Object.freeze([
    "AddPaymentInfo", "AddToCart", "AddToWishlist", "CompleteRegistration", "Contact",
    "CustomizeProduct", "Donate", "FindLocation", "InitiateCheckout", "Lead", "Purchase",
    "Schedule", "Search", "StartTrial", "SubmitApplication", "Subscribe", "ViewContent",
  ]);
  // PageView no está entre los 17: es el evento del código base oficial del pixel
  // (fbq('track', 'PageView'), el mismo que usaba components/analytics/analytics-loader.tsx:71).
  const META_BASE_EVENTS = Object.freeze(["PageView"]);

  const CHECKOUT_EVENTS = Object.freeze([
    "checkout_started",
    "checkout_contact_info_submitted",
    "checkout_address_info_submitted",
    "checkout_shipping_info_submitted",
    "payment_info_submitted",
    "checkout_completed",
  ]);

  const NONE = Object.freeze({ ga4: false, meta: false });
  const GA4_ONLY = Object.freeze({ ga4: true, meta: false });
  const BOTH = Object.freeze({ ga4: true, meta: true });

  /**
   * Evento de Shopify -> destino. `gaps` = qué manda ESTE pixel en modo
   * gaps_only (lo demás es de la app oficial). En modo full manda todo lo
   * que tenga nombre de destino.
   */
  const EVENT_SPECS = Object.freeze({
    page_viewed: { kind: "standard", ga4: "page_view", meta: "PageView", metaKind: "track", gaps: NONE },
    product_viewed: { kind: "standard", ga4: "view_item", meta: "ViewContent", metaKind: "track", gaps: NONE },
    collection_viewed: { kind: "standard", ga4: "view_item_list", meta: null, metaKind: null, gaps: NONE },
    search_submitted: { kind: "standard", ga4: "search", meta: "Search", metaKind: "track", gaps: NONE },
    product_added_to_cart: { kind: "standard", ga4: "add_to_cart", meta: "AddToCart", metaKind: "track", gaps: NONE },
    product_removed_from_cart: { kind: "standard", ga4: "remove_from_cart", meta: null, metaKind: null, gaps: NONE },
    cart_viewed: { kind: "standard", ga4: "view_cart", meta: null, metaKind: null, gaps: NONE },
    checkout_started: { kind: "standard", ga4: "begin_checkout", meta: "InitiateCheckout", metaKind: "track", gaps: NONE },
    checkout_contact_info_submitted: { kind: "standard", ga4: "checkout_contact_info", meta: null, metaKind: null, gaps: GA4_ONLY },
    checkout_address_info_submitted: { kind: "standard", ga4: "checkout_address_info", meta: null, metaKind: null, gaps: GA4_ONLY },
    checkout_shipping_info_submitted: { kind: "standard", ga4: "add_shipping_info", meta: null, metaKind: null, gaps: NONE },
    payment_info_submitted: { kind: "standard", ga4: "add_payment_info", meta: "AddPaymentInfo", metaKind: "track", gaps: NONE },
    checkout_completed: { kind: "standard", ga4: "purchase", meta: "Purchase", metaKind: "track", gaps: NONE },
    "radaelli:wishlist_add": { kind: "custom", ga4: "add_to_wishlist", meta: "AddToWishlist", metaKind: "track", gaps: BOTH },
    "radaelli:wishlist_remove": { kind: "custom", ga4: "remove_from_wishlist", meta: "RemoveFromWishlist", metaKind: "trackCustom", gaps: BOTH },
    "radaelli:wishlist_viewed": { kind: "custom", ga4: "view_wishlist", meta: null, metaKind: null, gaps: GA4_ONLY },
    "radaelli:search_no_results": { kind: "custom", ga4: "search_no_results", meta: null, metaKind: null, gaps: GA4_ONLY },
    "radaelli:search_suggestion_selected": { kind: "custom", ga4: "search_suggestion_select", meta: null, metaKind: null, gaps: GA4_ONLY },
    "radaelli:variant_selected": { kind: "custom", ga4: "select_size", meta: null, metaKind: null, gaps: GA4_ONLY },
    "radaelli:cart_drawer_opened": { kind: "custom", ga4: "cart_drawer_open", meta: null, metaKind: null, gaps: GA4_ONLY },
    "radaelli:cart_error": { kind: "custom", ga4: "cart_error", meta: null, metaKind: null, gaps: GA4_ONLY },
  });

  /**
   * Inventario de los 20 CustomEvent que emite hoy el theme (theme-src/assets)
   * y qué hace el puente propuesto con cada uno. `publish` = nombre del custom
   * event de Shopify, o null con el motivo.
   */
  const THEME_EVENT_INVENTORY = Object.freeze([
    { type: "cart:updated", source: "cart.js", publish: null, reason: "estado interno del contador" },
    { type: "cart:opened", source: "cart.js", publish: "radaelli:cart_drawer_opened", reason: "cart_viewed estándar solo cubre la página /cart" },
    { type: "cart:item-added", source: "cart.js", publish: null, reason: "cubierto por product_added_to_cart (verificar con Pixel Helper)" },
    { type: "cart:quantity-changed", source: "cart.js", publish: null, reason: "cubierto por eventos estándar de carrito (verificar)" },
    { type: "cart:item-removed", source: "cart.js", publish: null, reason: "cubierto por product_removed_from_cart (verificar)" },
    { type: "cart:begin-checkout", source: "cart.js", publish: null, reason: "cubierto por checkout_started" },
    { type: "cart:error", source: "cart.js", publish: "radaelli:cart_error", reason: "sin equivalente estándar" },
    { type: "wishlist:updated", source: "wishlist.js", publish: null, reason: "estado interno (contador/lista)" },
    { type: "wishlist:add", source: "wishlist.js", publish: "radaelli:wishlist_add", reason: "sin equivalente estándar" },
    { type: "wishlist:remove", source: "wishlist.js", publish: "radaelli:wishlist_remove", reason: "sin equivalente estándar" },
    { type: "wishlist:view", source: "wishlist.js", publish: "radaelli:wishlist_viewed", reason: "sin equivalente estándar" },
    { type: "wishlist:sync-status", source: "wishlist.js", publish: null, reason: "estado técnico de la app de cuenta" },
    { type: "search:submitted", source: "search.js", publish: null, reason: "cubierto por search_submitted" },
    { type: "search:suggestion-selected", source: "search.js", publish: "radaelli:search_suggestion_selected", reason: "sin equivalente estándar" },
    { type: "search:results", source: "search.js", publish: null, reason: "cubierto por search_submitted" },
    { type: "search:no-results", source: "search.js", publish: "radaelli:search_no_results", reason: "sin equivalente estándar" },
    { type: "search:collapse", source: "header.js", publish: null, reason: "UI interna" },
    { type: "product:variant-change", source: "product-form.js", publish: "radaelli:variant_selected", reason: "sin equivalente estándar (paridad select_size)" },
    { type: "product:add-to-cart", source: "product-form.js", publish: null, reason: "cubierto por product_added_to_cart; lleva el <form> (no serializable)" },
    { type: "product:gallery-change", source: "product-gallery.js", publish: null, reason: "ruido; sin valor de embudo" },
  ]);

  /* ------------------------------------------------------------------
     Utilidades puras
     ------------------------------------------------------------------ */

  function isObject(value) {
    return typeof value === "object" && value !== null;
  }

  function truncate(value, max) {
    if (typeof value !== "string") return "";
    const clean = value.replace(/\s+/g, " ").trim();
    return clean.length > max ? clean.slice(0, max) : clean;
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  /** "gid://shopify/ProductVariant/123" | "123" | 123 -> "123"; cualquier otra cosa -> "". */
  function toNumericId(value) {
    if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return String(value);
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (/^[1-9]\d{0,19}$/.test(trimmed)) return trimmed;
    const match = /^gid:\/\/shopify\/[A-Za-z]+\/([1-9]\d{0,19})(?:\?.*)?$/.exec(trimmed);
    return match ? match[1] : "";
  }

  /** MoneyV2 -> número con 2 decimales, o null. */
  function moneyAmount(money) {
    if (!isObject(money) || typeof money.amount !== "number" || !Number.isFinite(money.amount)) return null;
    return round2(money.amount);
  }

  function currencyCode(value) {
    return typeof value === "string" && /^[A-Z]{3}$/.test(value) ? value : "";
  }

  function positiveInt(value, max) {
    const number = typeof value === "number" ? value : Number.parseInt(value, 10);
    if (!Number.isInteger(number) || number < 0) return null;
    return Math.min(number, max);
  }

  /** Hash determinista (dos FNV-1a de 32 bits). Nunca sale el token crudo. */
  function stableHash(input) {
    const text = String(input);
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193 ^ 0x5bd1e995;
    for (let i = 0; i < text.length; i += 1) {
      const code = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ code, 0x5bd1e995) >>> 0;
      h2 = (h2 ^ (h2 >>> 13)) >>> 0;
    }
    return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
  }

  /* ------------------------------------------------------------------
     URLs y textos sin PII
     ------------------------------------------------------------------ */

  const ALLOWED_QUERY_KEYS = Object.freeze([
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
    "gclid", "gbraid", "wbraid", "fbclid", "variant", "sort_by", "page",
  ]);
  // Subárboles con tokens o ids privados en la ruta (checkout, pedidos, cuenta, carrito permanente).
  const SENSITIVE_ROOTS = Object.freeze(["checkouts", "checkout", "orders", "account", "cart", "wallets"]);

  function isAllowedQueryKey(rawKey) {
    let key = rawKey;
    try {
      key = decodeURIComponent(rawKey.replace(/\+/g, " "));
    } catch (error) {
      return false;
    }
    return ALLOWED_QUERY_KEYS.indexOf(key) !== -1 || /^filter\.[a-z0-9_.]+$/i.test(key);
  }

  /** Dentro de /checkouts, /orders, /account...: solo se conservan palabras cortas (paso, idioma). */
  function sanitizePath(path) {
    if (typeof path !== "string" || path.charAt(0) !== "/") return "";
    const segments = path.split("/");
    let sensitive = false;
    for (let i = 1; i < segments.length; i += 1) {
      const segment = segments[i];
      if (sensitive) {
        if (segment !== "" && !/^[a-z_-]{1,12}$/i.test(segment)) segments[i] = ":token";
      } else if (SENSITIVE_ROOTS.indexOf(segment.toLowerCase()) !== -1) {
        sensitive = true;
      }
    }
    return segments.join("/");
  }

  /**
   * URL absoluta o ruta -> sin fragmento, con la ruta saneada y solo los
   * parámetros de atribución/navegación permitidos. Inválida -> "".
   */
  function sanitizeUrl(href) {
    if (typeof href !== "string" || href.length === 0) return "";
    const match = /^(https?:\/\/[^/?#\s]+)?(\/[^?#\s]*)?(\?[^#\s]*)?(#.*)?$/i.exec(href.trim());
    if (!match || (!match[1] && !match[2])) return "";
    const origin = match[1] ? match[1].toLowerCase().replace(/^(https?:\/\/)[^@/]*@/, "$1") : "";
    const path = sanitizePath(match[2] || "/");
    const query = (match[3] || "")
      .slice(1)
      .split("&")
      .filter((pair) => pair.length > 0 && isAllowedQueryKey(pair.split("=")[0]))
      .join("&");
    const result = origin + path + (query ? `?${query}` : "");
    return result.length > MAX_URL_LENGTH ? result.slice(0, MAX_URL_LENGTH) : result;
  }

  /** Término de búsqueda: recortado; si parece email o teléfono/documento, "[redacted]". */
  function scrubSearchTerm(raw) {
    const term = truncate(raw, MAX_PARAM_LENGTH);
    if (!term) return "";
    if (/[^\s@]+@[^\s@]+/.test(term)) return "[redacted]";
    const runs = term.match(/[+\d][\d\s().-]{4,}\d/g) || [];
    if (runs.some((run) => run.replace(/\D/g, "").length >= 7)) return "[redacted]";
    return term;
  }

  function pathOf(href) {
    const clean = sanitizeUrl(href);
    const match = /^(?:https?:\/\/[^/]+)?(\/[^?]*)?/i.exec(clean);
    return match && match[1] ? match[1] : "";
  }

  /** Título de página, salvo en rutas donde puede reflejar lo que tipeó la clienta o datos del pedido. */
  function safePageTitle(title, href) {
    const path = pathOf(href);
    if (/(^|\/)(search|checkouts?|account|orders)(\/|$)/i.test(path)) return "";
    return truncate(title, 300);
  }

  function pageParams(event) {
    const doc = isObject(event) && isObject(event.context) && isObject(event.context.document) ? event.context.document : null;
    if (!doc) return {};
    const href = isObject(doc.location) && typeof doc.location.href === "string" ? doc.location.href : "";
    const params = {};
    const location = sanitizeUrl(href);
    if (location) params.page_location = location;
    const referrer = sanitizeUrl(typeof doc.referrer === "string" ? doc.referrer : "");
    if (referrer) params.page_referrer = referrer;
    const title = safePageTitle(doc.title, href);
    if (title) params.page_title = title;
    return params;
  }

  /* ------------------------------------------------------------------
     Productos (solo campos de catálogo; nada de la clienta)
     ------------------------------------------------------------------ */

  function ga4Item(variant, options) {
    if (!isObject(variant)) return null;
    const product = isObject(variant.product) ? variant.product : {};
    const productId = toNumericId(product.id);
    const variantId = toNumericId(variant.id);
    const itemId = productId || variantId;
    if (!itemId) return null;
    const item = { item_id: itemId };
    const name = truncate(product.title, MAX_PARAM_LENGTH);
    if (name) item.item_name = name;
    const variantTitle = truncate(variant.title, MAX_PARAM_LENGTH);
    if (variantTitle) item.item_variant = variantTitle;
    const brand = truncate(product.vendor, MAX_PARAM_LENGTH);
    if (brand) item.item_brand = brand;
    const category = truncate(product.type, MAX_PARAM_LENGTH);
    if (category) item.item_category = category;
    const unit = options && typeof options.unitPrice === "number" ? round2(options.unitPrice) : moneyAmount(variant.price);
    if (unit !== null) item.price = unit;
    if (options && typeof options.quantity === "number" && options.quantity > 0) item.quantity = options.quantity;
    if (options && typeof options.index === "number") item.index = options.index;
    return item;
  }

  function variantContentId(variant) {
    if (!isObject(variant)) return "";
    return toNumericId(variant.id) || (isObject(variant.product) ? toNumericId(variant.product.id) : "");
  }

  function checkoutLine(line) {
    if (!isObject(line)) return null;
    const quantity = typeof line.quantity === "number" && line.quantity > 0 ? line.quantity : 1;
    const lineTotal = moneyAmount(line.finalLinePrice);
    const variant = isObject(line.variant) ? line.variant : null;
    const item = ga4Item(variant, { quantity, unitPrice: lineTotal !== null ? lineTotal / quantity : undefined });
    if (!item) return null;
    if (!item.item_name) {
      const title = truncate(line.title, MAX_PARAM_LENGTH);
      if (title) item.item_name = title;
    }
    return { item, contentId: variantContentId(variant), quantity };
  }

  function checkoutParts(checkout, amountField) {
    if (!isObject(checkout)) return null;
    const lines = (Array.isArray(checkout.lineItems) ? checkout.lineItems : []).map(checkoutLine).filter(Boolean);
    const currency = currencyCode(checkout.currencyCode);
    const value = moneyAmount(checkout[amountField]) !== null ? moneyAmount(checkout[amountField]) : moneyAmount(checkout.totalPrice);
    const numItems = lines.reduce((sum, line) => sum + line.quantity, 0);
    return { lines, currency, value, numItems };
  }

  function withValue(params, value, currency) {
    // GA4 y Meta: sin moneda no se manda valor (no se asume COP).
    if (currency && value !== null) {
      params.currency = currency;
      params.value = value;
    }
    return params;
  }

  function metaContents(lines) {
    return lines.filter((line) => line.contentId).map((line) => ({ id: line.contentId, quantity: line.quantity }));
  }

  /* ------------------------------------------------------------------
     Constructores por evento: { ga4, meta } con params ya saneados
     ------------------------------------------------------------------ */

  function customData(event) {
    return isObject(event) && isObject(event.customData) ? event.customData : {};
  }

  function pickSource(value, allowed) {
    return allowed.indexOf(value) !== -1 ? value : "unknown";
  }

  function checkoutBuilder(amountField, includeMeta) {
    return function (event) {
      const parts = checkoutParts(isObject(event.data) ? event.data.checkout : null, amountField);
      if (!parts) return null;
      const ga4 = withValue({ items: parts.lines.map((line) => line.item) }, parts.value, parts.currency);
      let meta = null;
      if (includeMeta) {
        meta = withValue({ content_type: "product", num_items: parts.numItems }, parts.value, parts.currency);
        const contents = metaContents(parts.lines);
        if (contents.length > 0) {
          meta.contents = contents;
          meta.content_ids = contents.map((content) => content.id);
        }
      }
      return { ga4, meta };
    };
  }

  function cartLineBuilder(event) {
    const line = isObject(event.data) && isObject(event.data.cartLine) ? event.data.cartLine : null;
    if (!line) return null;
    const quantity = typeof line.quantity === "number" && line.quantity > 0 ? line.quantity : 1;
    const cost = isObject(line.cost) ? line.cost.totalAmount : null;
    const value = moneyAmount(cost);
    const currency = currencyCode(isObject(cost) ? cost.currencyCode : "");
    const variant = isObject(line.merchandise) ? line.merchandise : null;
    const item = ga4Item(variant, { quantity, unitPrice: value !== null ? value / quantity : undefined });
    if (!item) return null;
    const contentId = variantContentId(variant);
    const meta = withValue({ content_type: "product", content_ids: [contentId], contents: [{ id: contentId, quantity }] }, value, currency);
    return { ga4: withValue({ items: [item] }, value, currency), meta };
  }

  const BUILDERS = {
    page_viewed() {
      return { ga4: {}, meta: {} };
    },
    product_viewed(event) {
      const variant = isObject(event.data) ? event.data.productVariant : null;
      const item = ga4Item(variant, { quantity: 1 });
      if (!item) return null;
      const currency = currencyCode(isObject(variant.price) ? variant.price.currencyCode : "");
      const value = moneyAmount(variant.price);
      const contentId = variantContentId(variant);
      const meta = withValue({ content_type: "product", content_ids: [contentId] }, value, currency);
      if (item.item_name) meta.content_name = item.item_name;
      return { ga4: withValue({ items: [item] }, value, currency), meta };
    },
    collection_viewed(event) {
      const collection = isObject(event.data) ? event.data.collection : null;
      if (!isObject(collection)) return null;
      const items = (Array.isArray(collection.productVariants) ? collection.productVariants : [])
        .slice(0, MAX_LIST_ITEMS)
        .map((variant, index) => ga4Item(variant, { index }))
        .filter(Boolean);
      const ga4 = { items };
      const listId = toNumericId(collection.id);
      if (listId) ga4.item_list_id = listId;
      const listName = truncate(collection.title, MAX_PARAM_LENGTH);
      if (listName) ga4.item_list_name = listName;
      return { ga4, meta: null };
    },
    search_submitted(event) {
      const result = isObject(event.data) ? event.data.searchResult : null;
      const term = scrubSearchTerm(isObject(result) ? result.query : "");
      if (!term) return null;
      const meta = { search_string: term };
      const ids = (Array.isArray(result.productVariants) ? result.productVariants : [])
        .map(variantContentId)
        .filter(Boolean)
        .slice(0, MAX_CONTENT_IDS);
      if (ids.length > 0) {
        meta.content_ids = ids;
        meta.content_type = "product";
      }
      return { ga4: { search_term: term }, meta };
    },
    product_added_to_cart: cartLineBuilder,
    product_removed_from_cart: cartLineBuilder,
    cart_viewed(event) {
      const cart = isObject(event.data) ? event.data.cart : null;
      if (!isObject(cart)) return { ga4: {}, meta: null };
      const items = (Array.isArray(cart.lines) ? cart.lines : [])
        .map((line) => {
          if (!isObject(line)) return null;
          const quantity = typeof line.quantity === "number" && line.quantity > 0 ? line.quantity : 1;
          const total = moneyAmount(isObject(line.cost) ? line.cost.totalAmount : null);
          return ga4Item(line.merchandise, { quantity, unitPrice: total !== null ? total / quantity : undefined });
        })
        .filter(Boolean);
      const cost = isObject(cart.cost) ? cart.cost.totalAmount : null;
      return { ga4: withValue({ items }, moneyAmount(cost), currencyCode(isObject(cost) ? cost.currencyCode : "")), meta: null };
    },
    checkout_started: checkoutBuilder("subtotalPrice", true),
    checkout_contact_info_submitted: checkoutBuilder("subtotalPrice", false),
    checkout_address_info_submitted: checkoutBuilder("subtotalPrice", false),
    checkout_shipping_info_submitted: checkoutBuilder("subtotalPrice", false),
    payment_info_submitted: checkoutBuilder("totalPrice", true),
    checkout_completed(event) {
      const checkout = isObject(event.data) ? event.data.checkout : null;
      const transactionId = orderTransactionId(checkout);
      // Sin id de pedido no hay purchase: GA4 deduplica todos los transaction_id vacíos juntos.
      if (!transactionId) return null;
      const base = checkoutBuilder("totalPrice", true)(event);
      if (!base) return null;
      base.ga4.transaction_id = transactionId;
      const shipping = moneyAmount(isObject(checkout.shippingLine) ? checkout.shippingLine.price : null);
      if (shipping !== null && base.ga4.currency) base.ga4.shipping = shipping;
      const tax = moneyAmount(checkout.totalTax);
      if (tax !== null && base.ga4.currency) base.ga4.tax = tax;
      // Meta exige value + currency en Purchase.
      if (base.meta && (!base.meta.currency || typeof base.meta.value !== "number")) base.meta = null;
      return base;
    },
    "radaelli:wishlist_add"(event) {
      const productId = toNumericId(customData(event).product_id);
      if (!productId) return null;
      return {
        ga4: { items: [{ item_id: productId }] },
        meta: { content_ids: [productId], content_type: "product_group" },
      };
    },
    "radaelli:wishlist_remove"(event) {
      const data = customData(event);
      const productId = toNumericId(data.product_id);
      if (!productId) return null;
      return {
        ga4: { items: [{ item_id: productId }], remove_source: pickSource(data.source, ["trigger", "page"]) },
        meta: { content_ids: [productId], content_type: "product_group" },
      };
    },
    "radaelli:wishlist_viewed"(event) {
      const count = positiveInt(customData(event).count, 1000);
      return { ga4: count === null ? {} : { wishlist_count: count }, meta: null };
    },
    "radaelli:search_no_results"(event) {
      const data = customData(event);
      const term = scrubSearchTerm(data.query);
      if (!term) return null;
      return { ga4: { search_term: term, search_source: pickSource(data.source, ["page", "predictive"]) }, meta: null };
    },
    "radaelli:search_suggestion_selected"(event) {
      const data = customData(event);
      const ga4 = {};
      const term = scrubSearchTerm(data.query);
      if (term) ga4.search_term = term;
      const position = positiveInt(data.position, 50);
      if (position !== null) ga4.suggestion_position = position;
      const path = sanitizePath(typeof data.path === "string" ? data.path : "");
      if (path) ga4.suggestion_path = truncate(path, MAX_PARAM_LENGTH);
      return { ga4, meta: null };
    },
    "radaelli:variant_selected"(event) {
      const data = customData(event);
      const productId = toNumericId(data.product_id);
      if (!productId) return null;
      const ga4 = { item_id: productId };
      const variantId = toNumericId(data.variant_id);
      if (variantId) ga4.variant_id = variantId;
      const size = (Array.isArray(data.options) ? data.options : [])
        .filter((option) => typeof option === "string")
        .map((option) => truncate(option, 40))
        .filter(Boolean)
        .join(" / ");
      if (size) ga4.size = truncate(size, MAX_PARAM_LENGTH);
      if (typeof data.available === "boolean") ga4.availability = data.available ? "in_stock" : "out_of_stock";
      return { ga4, meta: null };
    },
    "radaelli:cart_drawer_opened"(event) {
      return { ga4: { open_source: pickSource(customData(event).source, ["trigger", "add"]) }, meta: null };
    },
    "radaelli:cart_error"(event) {
      return { ga4: { error_source: pickSource(customData(event).source, ["add", "change"]) }, meta: null };
    },
  };

  /* ------------------------------------------------------------------
     Deduplicación
     ------------------------------------------------------------------ */

  function orderTransactionId(checkout) {
    if (!isObject(checkout) || !isObject(checkout.order)) return "";
    const numeric = toNumericId(checkout.order.id);
    if (numeric) return numeric;
    const raw = typeof checkout.order.id === "string" ? checkout.order.id.trim() : "";
    return /^[A-Za-z0-9_-]{1,64}$/.test(raw) ? raw : "";
  }

  /**
   * event_id para Meta (eventID) y para evitar reenvíos en la misma página.
   *  - checkout_completed -> "purchase:<id de pedido>" (mismo formato que el sitio Next.js).
   *  - resto del checkout -> "<evento>:<hash del token>" (estable si la página se recarga).
   *  - lo demás -> "<evento>:<id del evento de Shopify>".
   */
  function dedupEventId(eventName, event) {
    if (!isObject(event)) return null;
    const checkout = isObject(event.data) && isObject(event.data.checkout) ? event.data.checkout : null;
    if (eventName === "checkout_completed") {
      const orderId = orderTransactionId(checkout);
      if (orderId) return `purchase:${orderId}`;
    }
    if (CHECKOUT_EVENTS.indexOf(eventName) !== -1 && checkout && typeof checkout.token === "string" && checkout.token.length > 0) {
      return `${eventName}:${stableHash(checkout.token)}`;
    }
    if (typeof event.id === "string" && /^[A-Za-z0-9_.:-]{1,128}$/.test(event.id)) return `${eventName}:${event.id}`;
    return null;
  }

  /* ------------------------------------------------------------------
     Consentimiento, IDs y destinos
     ------------------------------------------------------------------ */

  /**
   * Acepta el objeto de la Web Pixels API (analyticsProcessingAllowed, ...)
   * o el del evento DOM visitorConsentCollected (analyticsAllowed, ...).
   * Falla cerrado: sin dato explícito = no permitido.
   */
  function normalizeConsent(raw) {
    const source = isObject(raw) ? raw : {};
    const pick = (a, b) => (typeof source[a] === "boolean" ? source[a] : source[b] === true);
    return {
      analytics: pick("analyticsProcessingAllowed", "analyticsAllowed") === true,
      marketing: source.marketingAllowed === true,
      preferences: pick("preferencesProcessingAllowed", "preferencesAllowed") === true,
      saleOfData: source.saleOfDataAllowed === true,
    };
  }

  function isValidGa4Id(id) {
    return typeof id === "string" && /^G-[A-Z0-9]{4,16}$/.test(id) && !/XXXX/.test(id);
  }

  function isValidMetaPixelId(id) {
    return typeof id === "string" && /^\d{8,20}$/.test(id) && !/^0+$/.test(id);
  }

  function isInternalCookieValue(value) {
    return typeof value === "string" && value.trim() === "1";
  }

  /** Qué destinos pueden recibir datos AHORA. Todo apagado salvo prueba explícita. */
  function decideDestinations(input) {
    const config = isObject(input) && isObject(input.config) ? input.config : {};
    const consent = isObject(input) && isObject(input.consent) ? input.consent : normalizeConsent(null);
    if (config.ENABLED !== true || (isObject(input) && input.internal === true)) return { ga4: false, meta: false };
    return {
      ga4: isValidGa4Id(config.GA4_MEASUREMENT_ID) && consent.analytics === true,
      meta: isValidMetaPixelId(config.META_PIXEL_ID) && consent.marketing === true && consent.saleOfData === true,
    };
  }

  /** Estado para Google consent mode (gtag('consent', ...)). */
  function googleConsentState(consent) {
    const normalized = isObject(consent) ? consent : normalizeConsent(null);
    const ads = normalized.marketing === true && normalized.saleOfData === true ? "granted" : "denied";
    return {
      analytics_storage: normalized.analytics === true ? "granted" : "denied",
      ad_storage: ads,
      ad_user_data: ads,
      ad_personalization: ads,
    };
  }

  /** Cookie _ga "GA1.1.123.456" -> client_id "123.456"; si no, el clientId de Shopify; si no, "". */
  function resolveGa4ClientId(gaCookie, shopifyClientId) {
    if (typeof gaCookie === "string") {
      const match = /^GA\d\.\d+\.(\d{1,20}\.\d{1,20})$/.exec(gaCookie.trim());
      if (match) return match[1];
    }
    return typeof shopifyClientId === "string" && /^[A-Za-z0-9_.:-]{1,128}$/.test(shopifyClientId) ? shopifyClientId : "";
  }

  /* ------------------------------------------------------------------
     API principal
     ------------------------------------------------------------------ */

  /**
   * event (standard o custom de Shopify) -> { eventName, eventId, ga4, meta } o null.
   * options: { mode, ga4ExtraStandardEvents, metaExtraStandardEvents }
   */
  function mapEvent(event, options) {
    if (!isObject(event) || typeof event.name !== "string") return null;
    const spec = Object.prototype.hasOwnProperty.call(EVENT_SPECS, event.name) ? EVENT_SPECS[event.name] : null;
    if (!spec) return null;
    const opts = isObject(options) ? options : {};
    const full = opts.mode === MODES.FULL;
    const extraGa4 = Array.isArray(opts.ga4ExtraStandardEvents) ? opts.ga4ExtraStandardEvents : [];
    const extraMeta = Array.isArray(opts.metaExtraStandardEvents) ? opts.metaExtraStandardEvents : [];
    const sendGa4 = Boolean(spec.ga4) && (full || spec.gaps.ga4 || extraGa4.indexOf(event.name) !== -1);
    const sendMeta = Boolean(spec.meta) && (full || spec.gaps.meta || extraMeta.indexOf(event.name) !== -1);
    if (!sendGa4 && !sendMeta) return null;

    const built = BUILDERS[event.name](event);
    if (!built) return null;
    const ga4 = sendGa4 && built.ga4 ? { name: spec.ga4, params: Object.assign({}, pageParams(event), built.ga4) } : null;
    const meta = sendMeta && built.meta ? { kind: spec.metaKind, name: spec.meta, params: Object.assign({}, built.meta) } : null;
    if (!ga4 && !meta) return null;
    return { eventName: event.name, eventId: dedupEventId(event.name, event), ga4, meta };
  }

  /** Nombres a los que se suscribe el pixel (explícitos: nunca all_events): 13 estándar + 8 custom. */
  function subscribedEventNames() {
    return Object.keys(EVENT_SPECS);
  }

  function safeHandle(value) {
    return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,254}$/.test(value) ? value : "";
  }

  /**
   * Puente PROPUESTO theme -> Shopify.analytics.publish (no instalado).
   * CustomEvent del theme -> { name, data } o null. `extra.productId` = dataset
   * del elemento que emitió (product:variant-change no lo trae en detail).
   */
  function bridgeThemeEvent(type, detail, extra) {
    const d = isObject(detail) ? detail : {};
    const x = isObject(extra) ? extra : {};
    switch (type) {
      case "wishlist:add":
      case "wishlist:remove": {
        const productId = toNumericId(d.productId);
        if (!productId) return null;
        const data = { product_id: productId, handle: safeHandle(d.handle) };
        if (type === "wishlist:remove") data.source = pickSource(d.source, ["trigger", "page"]);
        return { name: type === "wishlist:add" ? "radaelli:wishlist_add" : "radaelli:wishlist_remove", data };
      }
      case "wishlist:view": {
        const count = positiveInt(d.count, 1000);
        return { name: "radaelli:wishlist_viewed", data: { count: count === null ? 0 : count } };
      }
      case "search:no-results": {
        const query = scrubSearchTerm(d.query);
        if (!query) return null;
        return { name: "radaelli:search_no_results", data: { query, source: pickSource(d.source, ["page", "predictive"]) } };
      }
      case "search:suggestion-selected": {
        const position = positiveInt(d.position, 50);
        return {
          name: "radaelli:search_suggestion_selected",
          data: { query: scrubSearchTerm(d.query), position: position === null ? 0 : position, path: pathOf(typeof d.url === "string" ? d.url : "") },
        };
      }
      case "product:variant-change": {
        const variant = isObject(d.variant) ? d.variant : {};
        const productId = toNumericId(x.productId);
        const variantId = toNumericId(variant.id);
        if (!productId || !variantId) return null;
        return {
          name: "radaelli:variant_selected",
          data: {
            product_id: productId,
            variant_id: variantId,
            options: (Array.isArray(variant.options) ? variant.options : []).filter((option) => typeof option === "string").map((option) => truncate(option, 40)),
            available: variant.available === true,
          },
        };
      }
      case "cart:opened":
        return { name: "radaelli:cart_drawer_opened", data: { source: pickSource(d.source, ["trigger", "add"]) } };
      case "cart:error":
        return { name: "radaelli:cart_error", data: { source: pickSource(d.source, ["add", "change"]) } };
      default:
        return null;
    }
  }

  return Object.freeze({
    VERSION,
    MODES,
    CUSTOM_PREFIX,
    META_STANDARD_EVENTS,
    META_BASE_EVENTS,
    CHECKOUT_EVENTS,
    EVENT_SPECS,
    THEME_EVENT_INVENTORY,
    toNumericId,
    sanitizeUrl,
    sanitizePath,
    scrubSearchTerm,
    safePageTitle,
    stableHash,
    dedupEventId,
    normalizeConsent,
    isValidGa4Id,
    isValidMetaPixelId,
    isInternalCookieValue,
    decideDestinations,
    googleConsentState,
    resolveGa4ClientId,
    mapEvent,
    subscribedEventNames,
    bridgeThemeEvent,
  });
});
/* END event-map.js */

(function radaelliPixel(config, api, env) {
  "use strict";
  if (!config || config.ENABLED !== true) return;
  if (!api || !env || !env.analytics || typeof env.analytics.subscribe !== "function") return;

  const ids = {
    ga4: api.isValidGa4Id(config.GA4_MEASUREMENT_ID) ? config.GA4_MEASUREMENT_ID : "",
    meta: api.isValidMetaPixelId(config.META_PIXEL_ID) ? config.META_PIXEL_ID : "",
  };
  // Sin ningún ID válido no hay destino: no se suscribe ni carga nada.
  if (!ids.ga4 && !ids.meta) return;

  const win = env.window;
  const doc = env.document;
  const cookies = env.browser && env.browser.cookie && typeof env.browser.cookie.get === "function" ? env.browser.cookie : null;
  const log = config.DEBUG === true && env.console ? (...args) => env.console.log("[radaelli-pixel]", ...args) : () => {};
  const mapOptions = {
    mode: config.MODE,
    ga4ExtraStandardEvents: config.GA4_EXTRA_STANDARD_EVENTS,
    metaExtraStandardEvents: config.META_EXTRA_STANDARD_EVENTS,
  };

  let consent = api.normalizeConsent(env.init && env.init.customerPrivacy);
  let internal = false;
  let ga4Ready = null;
  let metaLoaded = false;
  let metaRevoked = false;
  const sent = new Set();

  async function readCookie(name) {
    if (!cookies || !name) return "";
    try {
      const value = await cookies.get(name);
      return typeof value === "string" ? value : "";
    } catch (error) {
      return "";
    }
  }

  // Tráfico interno: se resuelve una vez antes del primer envío.
  const ready = (async () => {
    if (config.INTERNAL_TRAFFIC_COOKIE) {
      internal = api.isInternalCookieValue(await readCookie(config.INTERNAL_TRAFFIC_COOKIE));
    }
  })();

  function allowed() {
    return api.decideDestinations({ config, consent, internal });
  }

  function injectScript(src) {
    if (!doc || typeof doc.createElement !== "function") return;
    const script = doc.createElement("script");
    script.async = true;
    script.src = src;
    (doc.head || doc.body).appendChild(script);
  }

  // GA4: se carga recién con el primer evento permitido (nunca antes del consentimiento).
  async function initGa4(event) {
    // La cookie _ga solo se lee acá, con consentimiento de analytics ya dado.
    const clientId = api.resolveGa4ClientId(await readCookie("_ga"), event && event.clientId);
    const state = api.googleConsentState(consent);
    const ads = state.ad_storage === "granted";
    win.dataLayer = win.dataLayer || [];
    win.gtag = function gtag() {
      win.dataLayer.push(arguments);
    };
    win.gtag("consent", "default", state);
    win.gtag("js", new Date());
    const settings = { send_page_view: false, allow_google_signals: ads, allow_ad_personalization_signals: ads };
    if (clientId) settings.client_id = clientId;
    win.gtag("config", ids.ga4, settings);
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids.ga4)}`);
  }

  // Meta: stub oficial + autoConfig apagado (sin rastreo automático de clics) y SIN PageView automático.
  function ensureMeta() {
    if (metaLoaded) return;
    metaLoaded = true;
    if (!win.fbq) {
      const fbq = function () {
        if (fbq.callMethod) {
          fbq.callMethod.apply(fbq, arguments);
        } else {
          fbq.queue.push(arguments);
        }
      };
      win.fbq = fbq;
      if (!win._fbq) win._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      injectScript("https://connect.facebook.net/en_US/fbevents.js");
    }
    win.fbq("set", "autoConfig", false, ids.meta);
    win.fbq("init", ids.meta);
  }

  function syncConsent() {
    if (ga4Ready) {
      ga4Ready.then(() => win.gtag("consent", "update", api.googleConsentState(consent))).catch(() => {});
    }
    if (metaLoaded) {
      const metaAllowed = allowed().meta;
      if (!metaAllowed && !metaRevoked) {
        win.fbq("consent", "revoke");
        metaRevoked = true;
      } else if (metaAllowed && metaRevoked) {
        win.fbq("consent", "grant");
        metaRevoked = false;
      }
    }
  }

  async function dispatch(event) {
    try {
      await ready;
      const mapped = api.mapEvent(event, mapOptions);
      if (!mapped) return;

      if (mapped.ga4 && allowed().ga4) {
        const key = mapped.eventId ? `ga4|${mapped.eventId}` : "";
        if (!key || !sent.has(key)) {
          if (key) sent.add(key);
          ga4Ready = ga4Ready || initGa4(event);
          await ga4Ready;
          // Se re-chequea: el consentimiento pudo cambiar mientras cargaba.
          if (allowed().ga4) {
            win.gtag("event", mapped.ga4.name, Object.assign({}, mapped.ga4.params, { send_to: ids.ga4 }));
            log("ga4", mapped.ga4.name);
          }
        }
      }

      if (mapped.meta && allowed().meta) {
        const key = mapped.eventId ? `meta|${mapped.eventId}` : "";
        if (!key || !sent.has(key)) {
          if (key) sent.add(key);
          ensureMeta();
          const method = mapped.meta.kind === "trackCustom" ? "trackCustom" : "track";
          if (mapped.eventId) {
            win.fbq(method, mapped.meta.name, mapped.meta.params, { eventID: mapped.eventId });
          } else {
            win.fbq(method, mapped.meta.name, mapped.meta.params);
          }
          log("meta", mapped.meta.name);
        }
      }
    } catch (error) {
      // Analytics nunca rompe la tienda.
      log("error", error && error.message);
    }
  }

  // Suscripción explícita (nunca all_events): 13 estándar + custom "radaelli:*".
  // El nombre se fija al suscrito: el ejemplo oficial de payload de un custom
  // event (shopify.dev .../emitting-data) muestra `name` SIN el prefijo; así
  // "radaelli:*" mapea igual venga como venga.
  api.subscribedEventNames().forEach((name) => {
    env.analytics.subscribe(name, (event) => dispatch(event && typeof event === "object" ? Object.assign({}, event, { name }) : event));
  });

  if (env.customerPrivacy && typeof env.customerPrivacy.subscribe === "function") {
    env.customerPrivacy.subscribe("visitorConsentCollected", (event) => {
      consent = api.normalizeConsent(event && event.customerPrivacy);
      syncConsent();
    });
  }
})(RADAELLI_PIXEL_CONFIG, globalThis.RadaelliEventMap, {
  analytics: typeof analytics !== "undefined" ? analytics : undefined,
  browser: typeof browser !== "undefined" ? browser : undefined,
  init: typeof init !== "undefined" ? init : undefined,
  // En un custom pixel Shopify deja sueltos solo `analytics`, `browser` e `init`;
  // su ejemplo oficial usa `api.customerPrivacy.subscribe(...)`
  // (shopify.dev/docs/api/web-pixels-api/pixel-privacy). Se aceptan las dos formas.
  customerPrivacy:
    typeof customerPrivacy !== "undefined"
      ? customerPrivacy
      : typeof api !== "undefined" && api && api.customerPrivacy
        ? api.customerPrivacy
        : undefined,
  window: typeof window !== "undefined" ? window : globalThis,
  document: typeof document !== "undefined" ? document : undefined,
  console: typeof console !== "undefined" ? console : undefined,
});
