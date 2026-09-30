// Tests del mapa de eventos y del custom pixel de Radaelli (Fase 03E).
// Correr: node --test analytics/custom-pixel/test/event-map.test.mjs
// (en Node 24, `node --test <carpeta>` falla: hay que pasar el archivo).
//
// Los dos archivos se cargan con node:vm como SCRIPT CLÁSICO en un contexto
// vacío (sin window/document/fetch reales), igual que los ejecuta el sandbox
// "lax" de Shopify. El runtime se prueba con mocks de analytics,
// customerPrivacy, browser.cookie y document: nunca hay red.
//
// Los IDs de abajo son valores SINTÁCTICOS de prueba: no pertenecen a ninguna
// cuenta real y no deben copiarse a la configuración del pixel.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAP_SOURCE = readFileSync(join(ROOT, "event-map.js"), "utf8");
const PIXEL_SOURCE = readFileSync(join(ROOT, "radaelli-pixel.js"), "utf8");

const TEST_GA4_ID = "G-TESTONLY01";
const TEST_META_ID = "1111111111111111";

const plain = (value) => JSON.parse(JSON.stringify(value));
const flush = () => new Promise((resolve) => setImmediate(resolve));

function loadMap() {
  const context = vm.createContext({});
  vm.runInContext(MAP_SOURCE, context, { filename: "event-map.js" });
  return context.RadaelliEventMap;
}

const M = loadMap();

/* ------------------------------------------------------------------
   Fixtures (datos sintéticos; la "PII" es falsa a propósito)
   ------------------------------------------------------------------ */

const PII = Object.freeze({
  email: "prueba@example.com",
  emailEncoded: "prueba%40example.com",
  phone: "+57 300 000 0000",
  phoneDigits: "3000000000",
  first: "NombrePrueba",
  last: "ApellidoPrueba",
  address: "Calle Falsa 123",
  zip: "110111",
  customerGid: "gid://shopify/Customer/777",
  token: "tok_ABCdef1234567890XYZ",
});

const PII_NEEDLES = [
  PII.email,
  PII.emailEncoded,
  PII.phone,
  PII.phoneDigits,
  PII.first,
  PII.last,
  PII.address,
  PII.zip,
  PII.customerGid,
  "Customer/777",
  PII.token,
  "preview_theme_id",
];

const PRODUCT_CONTEXT = {
  document: {
    location: {
      href: `https://radaelli-swimwear-dev.myshopify.com/products/brisa-natural-beige?variant=4001&utm_source=instagram&utm_medium=paid&email=${PII.emailEncoded}&preview_theme_id=189072474431#reviews`,
    },
    referrer: "https://l.instagram.com/?u=https%3A%2F%2Fexample&e=abc",
    title: "BRISA NATURAL BEIGE – Radaelli",
  },
};

const CHECKOUT_CONTEXT = {
  document: {
    location: { href: `https://radaelli-swimwear-dev.myshopify.com/checkouts/cn/${PII.token}/es-co/thank-you?email=${PII.emailEncoded}` },
    referrer: "",
    title: `Pedido de ${PII.first} ${PII.last}`,
  },
};

const VARIANT = Object.freeze({
  id: "gid://shopify/ProductVariant/4001",
  sku: "RSONEN022-S",
  title: "S",
  untranslatedTitle: "S",
  price: { amount: 199920, currencyCode: "COP" },
  image: { src: "https://cdn.shopify.com/s/files/test.jpg" },
  product: {
    id: "gid://shopify/Product/3001",
    title: "BRISA NATURAL BEIGE",
    untranslatedTitle: "BRISA NATURAL BEIGE",
    vendor: "Radaelli Swimwear",
    type: "Enterizo",
    url: "/products/brisa-natural-beige",
  },
});

const ADDRESS = { firstName: PII.first, lastName: PII.last, address1: PII.address, city: "Bogotá", zip: PII.zip, phone: PII.phone, countryCode: "CO" };

function checkoutFixture({ token = PII.token, orderId = "gid://shopify/OrderIdentity/9001", currency = "COP" } = {}) {
  return {
    token,
    currencyCode: currency,
    subtotalPrice: { amount: 199920, currencyCode: currency },
    totalPrice: { amount: 214920, currencyCode: currency },
    totalTax: { amount: 0, currencyCode: currency },
    shippingLine: { price: { amount: 15000, currencyCode: currency } },
    email: PII.email,
    phone: PII.phone,
    billingAddress: ADDRESS,
    shippingAddress: ADDRESS,
    order: orderId === null ? null : { id: orderId, customer: { id: PII.customerGid, isFirstOrder: true } },
    lineItems: [
      {
        id: "gid://shopify/CheckoutLineItem/1",
        quantity: 1,
        title: "BRISA NATURAL BEIGE",
        finalLinePrice: { amount: 199920, currencyCode: currency },
        discountAllocations: [],
        variant: VARIANT,
      },
    ],
  };
}

const CART_LINE = { quantity: 2, cost: { totalAmount: { amount: 399840, currencyCode: "COP" } }, merchandise: VARIANT };

function std(name, data, { id = `sh-${name}-1`, context = PRODUCT_CONTEXT } = {}) {
  return { id, clientId: "shopify-client-abc123", name, timestamp: "2026-09-29T12:00:00.000Z", type: "standard", seq: 1, context, data };
}

function custom(name, customData, { id = `sh-${name}-1` } = {}) {
  return { id, clientId: "shopify-client-abc123", name, timestamp: "2026-09-29T12:00:00.000Z", type: "custom", context: PRODUCT_CONTEXT, customData };
}

const STANDARD_FIXTURES = {
  page_viewed: () => std("page_viewed", {}),
  product_viewed: () => std("product_viewed", { productVariant: VARIANT }),
  collection_viewed: () =>
    std("collection_viewed", { collection: { id: "gid://shopify/Collection/5001", title: "Oasis Natural", productVariants: [VARIANT, VARIANT] } }),
  search_submitted: () => std("search_submitted", { searchResult: { query: "bikini negro", productVariants: [VARIANT] } }),
  product_added_to_cart: () => std("product_added_to_cart", { cartLine: CART_LINE }),
  product_removed_from_cart: () => std("product_removed_from_cart", { cartLine: CART_LINE }),
  cart_viewed: () =>
    std("cart_viewed", { cart: { id: "gid://shopify/Cart/abc", totalQuantity: 2, cost: { totalAmount: { amount: 399840, currencyCode: "COP" } }, lines: [CART_LINE] } }),
  checkout_started: () => std("checkout_started", { checkout: checkoutFixture() }, { context: CHECKOUT_CONTEXT }),
  checkout_contact_info_submitted: () => std("checkout_contact_info_submitted", { checkout: checkoutFixture() }, { context: CHECKOUT_CONTEXT }),
  checkout_address_info_submitted: () => std("checkout_address_info_submitted", { checkout: checkoutFixture() }, { context: CHECKOUT_CONTEXT }),
  checkout_shipping_info_submitted: () => std("checkout_shipping_info_submitted", { checkout: checkoutFixture() }, { context: CHECKOUT_CONTEXT }),
  payment_info_submitted: () => std("payment_info_submitted", { checkout: checkoutFixture() }, { context: CHECKOUT_CONTEXT }),
  checkout_completed: () => std("checkout_completed", { checkout: checkoutFixture() }, { context: CHECKOUT_CONTEXT }),
};

const CUSTOM_FIXTURES = {
  "radaelli:wishlist_add": () => custom("radaelli:wishlist_add", { product_id: "3001", handle: "brisa-natural-beige", email: PII.email }),
  "radaelli:wishlist_remove": () => custom("radaelli:wishlist_remove", { product_id: "3001", handle: "brisa-natural-beige", source: "page" }),
  "radaelli:wishlist_viewed": () => custom("radaelli:wishlist_viewed", { count: 3 }),
  "radaelli:search_no_results": () => custom("radaelli:search_no_results", { query: "mostaza", source: "predictive" }),
  "radaelli:search_suggestion_selected": () =>
    custom("radaelli:search_suggestion_selected", { query: "brisa", position: 2, path: "/products/brisa-natural-beige" }),
  "radaelli:variant_selected": () =>
    custom("radaelli:variant_selected", { product_id: "3001", variant_id: "4001", options: ["S"], available: true }),
  "radaelli:cart_drawer_opened": () => custom("radaelli:cart_drawer_opened", { source: "trigger" }),
  "radaelli:cart_error": () => custom("radaelli:cart_error", { source: "add", message: `Error para ${PII.email}` }),
};

const FULL = { mode: "full" };
const GAPS = { mode: "gaps_only" };

const ITEM_3001 = {
  item_id: "3001",
  item_name: "BRISA NATURAL BEIGE",
  item_variant: "S",
  item_brand: "Radaelli Swimwear",
  item_category: "Enterizo",
  price: 199920,
};

const PRODUCT_PAGE = {
  page_location: "https://radaelli-swimwear-dev.myshopify.com/products/brisa-natural-beige?variant=4001&utm_source=instagram&utm_medium=paid",
  page_referrer: "https://l.instagram.com/",
  page_title: "BRISA NATURAL BEIGE – Radaelli",
};

const CHECKOUT_PAGE = { page_location: "https://radaelli-swimwear-dev.myshopify.com/checkouts/cn/:token/es-co/thank-you" };

function assertNoPii(value, label) {
  const serialized = JSON.stringify(value);
  for (const needle of PII_NEEDLES) {
    assert.equal(serialized.includes(needle), false, `${label}: se filtró "${needle}"`);
  }
}

/* ------------------------------------------------------------------
   1. Carga y empaquetado
   ------------------------------------------------------------------ */

describe("carga como script clásico (sandbox lax)", () => {
  test("define RadaelliEventMap sin window, document ni fetch", () => {
    assert.equal(typeof M, "object");
    assert.equal(M.VERSION, "0.1.0");
    assert.equal(Object.isFrozen(M), true);
    assert.equal(Object.isFrozen(M.EVENT_SPECS), true);
  });

  test("radaelli-pixel.js lleva una copia EXACTA de event-map.js", () => {
    const begin = "/* BEGIN event-map.js */\n";
    const end = "/* END event-map.js */";
    const start = PIXEL_SOURCE.indexOf(begin);
    const stop = PIXEL_SOURCE.indexOf(end);
    assert.ok(start !== -1 && stop > start, "faltan los marcadores");
    assert.equal(PIXEL_SOURCE.slice(start + begin.length, stop), MAP_SOURCE);
  });

  test("configuración de fábrica: apagado, gaps_only, IDs vacíos", () => {
    const block = /\/\* BEGIN CONFIG \*\/([\s\S]*?)\/\* END CONFIG \*\//.exec(PIXEL_SOURCE);
    assert.ok(block, "falta el bloque CONFIG");
    const context = vm.createContext({});
    vm.runInContext(`${block[1]}\nglobalThis.cfg = RADAELLI_PIXEL_CONFIG;`, context);
    assert.deepEqual(plain(context.cfg), {
      ENABLED: false,
      MODE: "gaps_only",
      GA4_MEASUREMENT_ID: "",
      META_PIXEL_ID: "",
      INTERNAL_TRAFFIC_COOKIE: "",
      GA4_EXTRA_STANDARD_EVENTS: [],
      META_EXTRA_STANDARD_EVENTS: [],
      DEBUG: false,
    });
  });

  test("ningún archivo trae un ID con forma real de GA4 o Meta", () => {
    for (const [name, source] of [["event-map.js", MAP_SOURCE], ["radaelli-pixel.js", PIXEL_SOURCE]]) {
      assert.equal(/["']G-[A-Z0-9]{6,}["']/.test(source), false, `${name}: ID de GA4 hardcodeado`);
      assert.equal(/["']\d{12,20}["']/.test(source), false, `${name}: ID de Meta hardcodeado`);
    }
  });
});

/* ------------------------------------------------------------------
   2. Tabla de eventos
   ------------------------------------------------------------------ */

describe("tabla de eventos", () => {
  const STANDARD = [
    "page_viewed", "product_viewed", "collection_viewed", "search_submitted", "product_added_to_cart",
    "product_removed_from_cart", "cart_viewed", "checkout_started", "checkout_contact_info_submitted",
    "checkout_address_info_submitted", "checkout_shipping_info_submitted", "payment_info_submitted", "checkout_completed",
  ];

  test("cubre los 13 eventos estándar pedidos + 8 custom con prefijo radaelli:", () => {
    const names = Object.keys(M.EVENT_SPECS);
    for (const name of STANDARD) assert.ok(names.includes(name), `falta ${name}`);
    const standard = names.filter((name) => M.EVENT_SPECS[name].kind === "standard");
    assert.deepEqual([...standard].sort(), [...STANDARD].sort());
    const customs = names.filter((name) => M.EVENT_SPECS[name].kind === "custom");
    assert.equal(customs.length, 8);
    for (const name of customs) assert.ok(name.startsWith(M.CUSTOM_PREFIX), name);
    assert.deepEqual(plain(M.subscribedEventNames()).sort(), [...names].sort());
    assert.equal(names.length, 21);
    assert.deepEqual(Object.keys(CUSTOM_FIXTURES).sort(), [...customs].sort(), "cada custom tiene fixture");
  });

  test("nombres de GA4 válidos (letra inicial, [a-z0-9_], <= 40)", () => {
    for (const [name, spec] of Object.entries(M.EVENT_SPECS)) {
      assert.match(spec.ga4, /^[a-z][a-z0-9_]{0,39}$/, name);
    }
  });

  test("todo 'track' de Meta es un evento estándar oficial (o PageView del código base); AddShippingInfo nunca", () => {
    assert.equal(M.META_STANDARD_EVENTS.length, 17);
    assert.equal(M.META_STANDARD_EVENTS.includes("AddShippingInfo"), false);
    assert.deepEqual(plain(M.META_BASE_EVENTS), ["PageView"]);
    const official = [...M.META_STANDARD_EVENTS, ...M.META_BASE_EVENTS];
    for (const [name, spec] of Object.entries(M.EVENT_SPECS)) {
      if (spec.meta === null) {
        assert.equal(spec.metaKind, null, name);
        continue;
      }
      assert.notEqual(spec.meta, "AddShippingInfo", name);
      if (spec.metaKind === "track") assert.ok(official.includes(spec.meta), `${name} -> ${spec.meta}`);
      else {
        assert.equal(spec.metaKind, "trackCustom", name);
        assert.equal(official.includes(spec.meta), false, name);
      }
    }
  });

  test("evento desconocido o malformado -> null", () => {
    assert.equal(M.mapEvent({ name: "all_events" }, FULL), null);
    assert.equal(M.mapEvent({ name: "toString" }, FULL), null);
    assert.equal(M.mapEvent(null, FULL), null);
    assert.equal(M.mapEvent({ name: "product_viewed", data: {} }, FULL), null);
  });
});

/* ------------------------------------------------------------------
   3. Mapeo (modo full)
   ------------------------------------------------------------------ */

describe("mapeo Shopify -> GA4 / Meta (modo full)", () => {
  test("page_viewed -> page_view (URL saneada) + PageView", () => {
    const out = plain(M.mapEvent(STANDARD_FIXTURES.page_viewed(), FULL));
    assert.deepEqual(out.ga4, { name: "page_view", params: PRODUCT_PAGE });
    assert.deepEqual(out.meta, { kind: "track", name: "PageView", params: {} });
    assert.equal(out.eventId, "page_viewed:sh-page_viewed-1");
  });

  test("product_viewed -> view_item + ViewContent", () => {
    const out = plain(M.mapEvent(STANDARD_FIXTURES.product_viewed(), FULL));
    assert.deepEqual(out.ga4, {
      name: "view_item",
      params: { ...PRODUCT_PAGE, currency: "COP", value: 199920, items: [{ ...ITEM_3001, quantity: 1 }] },
    });
    assert.deepEqual(out.meta, {
      kind: "track",
      name: "ViewContent",
      params: { content_type: "product", content_ids: ["4001"], content_name: "BRISA NATURAL BEIGE", currency: "COP", value: 199920 },
    });
  });

  test("collection_viewed -> view_item_list (sin Meta)", () => {
    const out = plain(M.mapEvent(STANDARD_FIXTURES.collection_viewed(), FULL));
    assert.equal(out.ga4.name, "view_item_list");
    assert.equal(out.ga4.params.item_list_id, "5001");
    assert.equal(out.ga4.params.item_list_name, "Oasis Natural");
    assert.deepEqual(out.ga4.params.items.map((item) => item.index), [0, 1]);
    assert.equal(out.meta, null);
  });

  test("search_submitted -> search + Search", () => {
    const out = plain(M.mapEvent(STANDARD_FIXTURES.search_submitted(), FULL));
    assert.deepEqual(out.ga4.params.search_term, "bikini negro");
    assert.deepEqual(out.meta.params, { search_string: "bikini negro", content_ids: ["4001"], content_type: "product" });
  });

  test("product_added_to_cart -> add_to_cart + AddToCart (monto y cantidad del evento)", () => {
    const out = plain(M.mapEvent(STANDARD_FIXTURES.product_added_to_cart(), FULL));
    assert.deepEqual(out.ga4.params.items, [{ ...ITEM_3001, quantity: 2 }]);
    assert.equal(out.ga4.params.value, 399840);
    assert.equal(out.ga4.params.currency, "COP");
    assert.deepEqual(out.meta, {
      kind: "track",
      name: "AddToCart",
      params: { content_type: "product", content_ids: ["4001"], contents: [{ id: "4001", quantity: 2 }], currency: "COP", value: 399840 },
    });
  });

  test("product_removed_from_cart -> remove_from_cart; cart_viewed -> view_cart (Meta no tiene estándar)", () => {
    const removed = plain(M.mapEvent(STANDARD_FIXTURES.product_removed_from_cart(), FULL));
    assert.equal(removed.ga4.name, "remove_from_cart");
    assert.equal(removed.meta, null);
    const viewed = plain(M.mapEvent(STANDARD_FIXTURES.cart_viewed(), FULL));
    assert.equal(viewed.ga4.name, "view_cart");
    assert.equal(viewed.ga4.params.value, 399840);
    assert.equal(viewed.meta, null);
  });

  test("checkout_started -> begin_checkout (subtotal) + InitiateCheckout", () => {
    const out = plain(M.mapEvent(STANDARD_FIXTURES.checkout_started(), FULL));
    assert.deepEqual(out.ga4, {
      name: "begin_checkout",
      params: { ...CHECKOUT_PAGE, currency: "COP", value: 199920, items: [{ ...ITEM_3001, quantity: 1 }] },
    });
    assert.deepEqual(out.meta.params, {
      content_type: "product",
      num_items: 1,
      currency: "COP",
      value: 199920,
      contents: [{ id: "4001", quantity: 1 }],
      content_ids: ["4001"],
    });
  });

  test("pasos de contacto/dirección -> eventos custom de GA4; envío -> add_shipping_info; ninguno a Meta", () => {
    assert.equal(M.mapEvent(STANDARD_FIXTURES.checkout_contact_info_submitted(), FULL).ga4.name, "checkout_contact_info");
    assert.equal(M.mapEvent(STANDARD_FIXTURES.checkout_address_info_submitted(), FULL).ga4.name, "checkout_address_info");
    const shipping = M.mapEvent(STANDARD_FIXTURES.checkout_shipping_info_submitted(), FULL);
    assert.equal(shipping.ga4.name, "add_shipping_info");
    assert.equal(shipping.meta, null);
    for (const name of ["checkout_contact_info_submitted", "checkout_address_info_submitted"]) {
      assert.equal(M.mapEvent(STANDARD_FIXTURES[name](), FULL).meta, null, name);
    }
  });

  test("payment_info_submitted -> add_payment_info + AddPaymentInfo (total)", () => {
    const out = plain(M.mapEvent(STANDARD_FIXTURES.payment_info_submitted(), FULL));
    assert.equal(out.ga4.name, "add_payment_info");
    assert.equal(out.ga4.params.value, 214920);
    assert.equal(out.meta.name, "AddPaymentInfo");
  });

  test("checkout_completed -> purchase (transaction_id numérico) + Purchase", () => {
    const out = plain(M.mapEvent(STANDARD_FIXTURES.checkout_completed(), FULL));
    assert.deepEqual(out.ga4, {
      name: "purchase",
      params: {
        ...CHECKOUT_PAGE,
        currency: "COP",
        value: 214920,
        transaction_id: "9001",
        shipping: 15000,
        tax: 0,
        items: [{ ...ITEM_3001, quantity: 1 }],
      },
    });
    assert.deepEqual(out.meta, {
      kind: "track",
      name: "Purchase",
      params: { content_type: "product", num_items: 1, currency: "COP", value: 214920, contents: [{ id: "4001", quantity: 1 }], content_ids: ["4001"] },
    });
    assert.equal(out.eventId, "purchase:9001");
  });

  test("la moneda sale del evento; sin moneda no se manda valor (ni a GA4 ni a Meta)", () => {
    const usd = plain(M.mapEvent(std("checkout_started", { checkout: checkoutFixture({ currency: "USD" }) }), FULL));
    assert.equal(usd.ga4.params.currency, "USD");
    const none = plain(M.mapEvent(std("checkout_started", { checkout: checkoutFixture({ currency: null }) }), FULL));
    assert.equal("value" in none.ga4.params, false);
    assert.equal("currency" in none.ga4.params, false);
    assert.equal("value" in none.meta.params, false);
    const purchase = plain(M.mapEvent(std("checkout_completed", { checkout: checkoutFixture({ currency: null }) }), FULL));
    assert.equal(purchase.meta, null, "Purchase sin value/currency no se manda a Meta");
  });

  test("favoritos: add -> add_to_wishlist + AddToWishlist; remove -> custom en ambos", () => {
    const add = plain(M.mapEvent(CUSTOM_FIXTURES["radaelli:wishlist_add"](), GAPS));
    assert.deepEqual(add.ga4, { name: "add_to_wishlist", params: { ...PRODUCT_PAGE, items: [{ item_id: "3001" }] } });
    assert.deepEqual(add.meta, { kind: "track", name: "AddToWishlist", params: { content_ids: ["3001"], content_type: "product_group" } });
    const remove = plain(M.mapEvent(CUSTOM_FIXTURES["radaelli:wishlist_remove"](), GAPS));
    assert.deepEqual(remove.ga4.params.items, [{ item_id: "3001" }]);
    assert.equal(remove.ga4.name, "remove_from_wishlist");
    assert.equal(remove.ga4.params.remove_source, "page");
    assert.deepEqual(remove.meta, { kind: "trackCustom", name: "RemoveFromWishlist", params: { content_ids: ["3001"], content_type: "product_group" } });
    assert.equal(M.mapEvent(custom("radaelli:wishlist_add", { product_id: "abc" }), GAPS), null, "id inválido");
  });

  test("otros custom del theme -> eventos custom de GA4 con parámetros acotados", () => {
    const params = (name) => plain(M.mapEvent(CUSTOM_FIXTURES[name](), GAPS)).ga4;
    assert.equal(params("radaelli:wishlist_viewed").params.wishlist_count, 3);
    assert.deepEqual(
      [params("radaelli:search_no_results").params.search_term, params("radaelli:search_no_results").params.search_source],
      ["mostaza", "predictive"],
    );
    const suggestion = params("radaelli:search_suggestion_selected").params;
    assert.deepEqual([suggestion.search_term, suggestion.suggestion_position, suggestion.suggestion_path], ["brisa", 2, "/products/brisa-natural-beige"]);
    const variant = params("radaelli:variant_selected");
    assert.equal(variant.name, "select_size");
    assert.deepEqual([variant.params.item_id, variant.params.variant_id, variant.params.size, variant.params.availability], ["3001", "4001", "S", "in_stock"]);
    assert.equal(params("radaelli:cart_drawer_opened").params.open_source, "trigger");
    const error = params("radaelli:cart_error").params;
    assert.equal(error.error_source, "add");
    assert.equal("message" in error, false);
  });
});

/* ------------------------------------------------------------------
   4. Dueño por evento (gaps_only vs apps oficiales)
   ------------------------------------------------------------------ */

describe("gaps_only: el embudo lo mandan las apps oficiales", () => {
  test("los eventos estándar del embudo NO salen de este pixel", () => {
    for (const name of Object.keys(STANDARD_FIXTURES)) {
      const out = M.mapEvent(STANDARD_FIXTURES[name](), GAPS);
      if (name === "checkout_contact_info_submitted" || name === "checkout_address_info_submitted") {
        assert.ok(out && out.ga4 && out.meta === null, `${name}: GA4 sí (hueco), Meta no`);
      } else {
        assert.equal(out, null, `${name} debería quedar para la app oficial`);
      }
    }
  });

  test("override explícito por destino (solo tras verificar que la app no lo manda)", () => {
    const out = plain(M.mapEvent(STANDARD_FIXTURES.search_submitted(), { mode: "gaps_only", ga4ExtraStandardEvents: ["search_submitted"] }));
    assert.equal(out.ga4.name, "search");
    assert.equal(out.meta, null);
  });

  test("modo desconocido = gaps_only (nunca duplica por error de tipeo)", () => {
    assert.equal(M.mapEvent(STANDARD_FIXTURES.checkout_completed(), { mode: "FULL " }), null);
    assert.equal(M.mapEvent(STANDARD_FIXTURES.checkout_completed(), {}), null);
  });
});

/* ------------------------------------------------------------------
   5. Consentimiento e IDs
   ------------------------------------------------------------------ */

const ALL = { analyticsProcessingAllowed: true, marketingAllowed: true, preferencesProcessingAllowed: true, saleOfDataAllowed: true };
const NOTHING = { analyticsProcessingAllowed: false, marketingAllowed: false, preferencesProcessingAllowed: false, saleOfDataAllowed: false };
const ON = { ENABLED: true, GA4_MEASUREMENT_ID: TEST_GA4_ID, META_PIXEL_ID: TEST_META_ID };

describe("consentimiento (falla cerrado)", () => {
  test("sin dato explícito todo es false; acepta las dos formas de Shopify", () => {
    for (const raw of [undefined, null, {}, { marketingAllowed: "true" }]) {
      assert.deepEqual(plain(M.normalizeConsent(raw)), { analytics: false, marketing: false, preferences: false, saleOfData: false });
    }
    assert.deepEqual(plain(M.normalizeConsent(ALL)), { analytics: true, marketing: true, preferences: true, saleOfData: true });
    assert.deepEqual(plain(M.normalizeConsent({ analyticsAllowed: true, marketingAllowed: false, preferencesAllowed: true, saleOfDataAllowed: true })), {
      analytics: true,
      marketing: false,
      preferences: true,
      saleOfData: true,
    });
  });

  test("matriz de destinos", () => {
    const decide = (consent, extra = {}) => plain(M.decideDestinations({ config: { ...ON, ...extra.config }, consent: M.normalizeConsent(consent), internal: extra.internal === true }));
    assert.deepEqual(decide(NOTHING), { ga4: false, meta: false });
    assert.deepEqual(decide(null), { ga4: false, meta: false });
    assert.deepEqual(decide({ ...NOTHING, analyticsProcessingAllowed: true }), { ga4: true, meta: false });
    assert.deepEqual(decide({ ...NOTHING, marketingAllowed: true, saleOfDataAllowed: true }), { ga4: false, meta: true });
    assert.deepEqual(decide({ ...ALL, saleOfDataAllowed: false }), { ga4: true, meta: false }, "opt-out de venta de datos apaga Meta");
    assert.deepEqual(decide(ALL, { internal: true }), { ga4: false, meta: false }, "tráfico interno");
    assert.deepEqual(decide(ALL, { config: { ENABLED: false } }), { ga4: false, meta: false }, "interruptor maestro");
    assert.deepEqual(plain(M.decideDestinations(undefined)), { ga4: false, meta: false });
  });

  test("consent mode de Google refleja el consentimiento", () => {
    assert.deepEqual(plain(M.googleConsentState(M.normalizeConsent({ ...NOTHING, analyticsProcessingAllowed: true }))), {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    assert.equal(M.googleConsentState(M.normalizeConsent(ALL)).ad_user_data, "granted");
    assert.equal(M.googleConsentState(undefined).analytics_storage, "denied");
  });
});

describe("IDs vacíos o de relleno no disparan nada", () => {
  test("validación de formato", () => {
    for (const bad of ["", " ", "G-XXXXXXXXXX", "G-XXXX1234", "UA-12345-1", "g-abc12345", "AW-123456789", null, 123]) {
      assert.equal(M.isValidGa4Id(bad), false, String(bad));
    }
    assert.equal(M.isValidGa4Id(TEST_GA4_ID), true);
    for (const bad of ["", "0000000000", "abc", "1234567", "12345678901234567890123", null]) {
      assert.equal(M.isValidMetaPixelId(bad), false, String(bad));
    }
    assert.equal(M.isValidMetaPixelId(TEST_META_ID), true);
  });

  test("con consentimiento total pero IDs vacíos o de relleno: ningún destino", () => {
    for (const config of [
      { ENABLED: true, GA4_MEASUREMENT_ID: "", META_PIXEL_ID: "" },
      { ENABLED: true, GA4_MEASUREMENT_ID: "G-XXXXXXXXXX", META_PIXEL_ID: "0000000000000000" },
    ]) {
      assert.deepEqual(plain(M.decideDestinations({ config, consent: M.normalizeConsent(ALL), internal: false })), { ga4: false, meta: false });
    }
  });
});

/* ------------------------------------------------------------------
   6. Deduplicación
   ------------------------------------------------------------------ */

describe("event_id estable por checkout", () => {
  test("mismo checkout (token) = mismo id aunque Shopify reenvíe con otro event.id", () => {
    const a = M.mapEvent(std("checkout_started", { checkout: checkoutFixture() }, { id: "sh-1" }), FULL);
    const b = M.mapEvent(std("checkout_started", { checkout: checkoutFixture() }, { id: "sh-2" }), FULL);
    assert.equal(a.eventId, b.eventId);
    assert.match(a.eventId, /^checkout_started:[0-9a-f]{16}$/);
    assert.equal(a.eventId.includes(PII.token), false, "el token crudo no sale");
    const other = M.mapEvent(std("checkout_started", { checkout: checkoutFixture({ token: "tok_OTRO9876543210abcd" }) }), FULL);
    assert.notEqual(other.eventId, a.eventId);
  });

  test("cada paso del checkout tiene su propio id", () => {
    const ids = M.CHECKOUT_EVENTS.map((name) => M.dedupEventId(name, { id: "x", data: { checkout: checkoutFixture({ orderId: null }) } }));
    assert.equal(new Set(ids).size, ids.length);
  });

  test("purchase: 'purchase:<id numérico>' (formato del sitio Next.js), igual con GID o número", () => {
    const gid = M.mapEvent(std("checkout_completed", { checkout: checkoutFixture({ orderId: "gid://shopify/OrderIdentity/9001" }) }), FULL);
    const num = M.mapEvent(std("checkout_completed", { checkout: checkoutFixture({ orderId: "9001" }) }, { id: "otro" }), FULL);
    assert.equal(gid.eventId, "purchase:9001");
    assert.equal(num.eventId, "purchase:9001");
    assert.equal(gid.ga4.params.transaction_id, num.ga4.params.transaction_id);
  });

  test("sin id de pedido no hay purchase (GA4 deduplica todos los transaction_id vacíos juntos)", () => {
    const out = M.mapEvent(std("checkout_completed", { checkout: checkoutFixture({ orderId: null }) }), FULL);
    assert.equal(out, null);
    for (const orderId of ["", "   ", "id con espacios"]) {
      assert.equal(M.mapEvent(std("checkout_completed", { checkout: checkoutFixture({ orderId }) }), FULL), null, JSON.stringify(orderId));
    }
  });

  test("fuera del checkout: id del evento de Shopify; sin id -> null", () => {
    assert.equal(M.dedupEventId("page_viewed", { id: "sh-abc" }), "page_viewed:sh-abc");
    assert.equal(M.dedupEventId("page_viewed", {}), null);
    assert.equal(M.dedupEventId("page_viewed", { id: "con espacios" }), null);
  });

  test("stableHash es determinista", () => {
    assert.equal(M.stableHash("abc"), M.stableHash("abc"));
    assert.notEqual(M.stableHash("abc"), M.stableHash("abd"));
    assert.match(M.stableHash(""), /^[0-9a-f]{16}$/);
  });
});

/* ------------------------------------------------------------------
   7. Sin PII
   ------------------------------------------------------------------ */

describe("no se reenvía PII", () => {
  test("ningún evento estándar ni custom deja pasar email, teléfono, nombre, dirección, cliente o token", () => {
    for (const mode of [FULL, GAPS]) {
      for (const [name, build] of Object.entries({ ...STANDARD_FIXTURES, ...CUSTOM_FIXTURES })) {
        assertNoPii(M.mapEvent(build(), mode), `${mode.mode}/${name}`);
      }
    }
  });

  test("sanitizeUrl: ruta y parámetros en lista blanca", () => {
    const cases = [
      [`https://shop.example/search?q=${PII.emailEncoded}&options%5Bprefix%5D=last`, "https://shop.example/search"],
      [
        "https://shop.example/collections/oasis-natural?filter.v.price.gte=150000&filter.v.price.lte=190000&sort_by=price-ascending&page=2",
        "https://shop.example/collections/oasis-natural?filter.v.price.gte=150000&filter.v.price.lte=190000&sort_by=price-ascending&page=2",
      ],
      ["https://user:pass@Shop.Example/cart/c/Z2NwLXVzLWVhc3QxOjAxSjk?key=abc", "https://shop.example/cart/c/:token"],
      ["https://shop.example/account/orders/123456", "https://shop.example/account/orders/:token"],
      ["https://shop.example/en/checkouts/c/abc123def456ghi789/information", "https://shop.example/en/checkouts/c/:token/information"],
      ["/products/bikini-waves-terracota?variant=1&customer_email=x#top", "/products/bikini-waves-terracota?variant=1"],
      ["https://shop.example/?gclid=abc&fbclid=def&utm_campaign=lanzamiento&token=secreto", "https://shop.example/?gclid=abc&fbclid=def&utm_campaign=lanzamiento"],
      ["about:srcdoc", ""],
      ["javascript:alert(1)", ""],
      ["", ""],
      [null, ""],
    ];
    for (const [input, expected] of cases) assert.equal(M.sanitizeUrl(input), expected, String(input));
    assert.ok(M.sanitizeUrl(`https://shop.example/${"a".repeat(2000)}`).length <= 1000);
  });

  test("scrubSearchTerm: email / teléfono / documento -> [redacted]; SKUs y colores pasan", () => {
    const cases = [
      ["  bikini   negro ", "bikini negro"],
      [PII.email, "[redacted]"],
      ["mi correo es algo@dominio.co", "[redacted]"],
      [PII.phone, "[redacted]"],
      ["cc 1.020.304.050", "[redacted]"],
      ["RSONEN022", "RSONEN022"],
      ["mostaza", "mostaza"],
      ["talla 36", "talla 36"],
      [42, ""],
    ];
    for (const [input, expected] of cases) assert.equal(M.scrubSearchTerm(input), expected, String(input));
    assert.equal(M.scrubSearchTerm("x".repeat(150)).length, 100);
  });

  test("page_title se omite en búsqueda, checkout y cuenta", () => {
    assert.equal(M.safePageTitle("Buscar: prueba@example.com", "https://shop.example/search?q=x"), "");
    assert.equal(M.safePageTitle("Pedido", "https://shop.example/checkouts/cn/abc/es-co"), "");
    assert.equal(M.safePageTitle("Oasis Natural", "https://shop.example/collections/oasis-natural"), "Oasis Natural");
  });

  test("customData extra (p. ej. email) nunca se copia", () => {
    const out = M.mapEvent(custom("radaelli:wishlist_add", { product_id: "3001", email: PII.email, phone: PII.phone, name: PII.first }), GAPS);
    assertNoPii(out, "wishlist_add con extras");
  });
});

/* ------------------------------------------------------------------
   8. Puente propuesto theme -> Shopify.analytics.publish
   ------------------------------------------------------------------ */

describe("puente del theme (propuesta, no instalada)", () => {
  test("inventario: 20 CustomEvent del theme, cada publish existe en la tabla", () => {
    assert.equal(M.THEME_EVENT_INVENTORY.length, 20);
    const types = M.THEME_EVENT_INVENTORY.map((entry) => entry.type);
    assert.equal(new Set(types).size, 20);
    const published = M.THEME_EVENT_INVENTORY.filter((entry) => entry.publish).map((entry) => entry.publish);
    assert.equal(published.length, 8, "el puente publica 8 (uno por cada custom radaelli:*)");
    assert.deepEqual([...published].sort(), Object.keys(M.EVENT_SPECS).filter((name) => M.EVENT_SPECS[name].kind === "custom").sort());
    for (const entry of M.THEME_EVENT_INVENTORY) {
      if (entry.publish) {
        assert.ok(M.EVENT_SPECS[entry.publish], entry.publish);
        assert.ok(entry.publish.startsWith("radaelli:"), entry.publish);
      }
      assert.ok(entry.reason.length > 0, entry.type);
    }
  });

  test("cada evento publicable produce un custom event que el mapa acepta; el resto -> null", () => {
    const details = {
      "cart:opened": [{ source: "trigger" }],
      "cart:error": [{ source: "add", message: "El artículo ya está agotado." }],
      "wishlist:add": [{ productId: "3001", handle: "brisa-natural-beige" }],
      "wishlist:remove": [{ productId: "3001", handle: "brisa-natural-beige", source: "trigger" }],
      "wishlist:view": [{ count: 2 }],
      "search:suggestion-selected": [{ query: "brisa", url: "https://shop.example/products/brisa-natural-beige?_pos=1", position: 1 }],
      "search:no-results": [{ query: "mostaza", source: "page" }],
      "product:variant-change": [{ sectionId: "main", variant: { id: 4001, options: ["S"], available: false } }, { productId: "3001" }],
    };
    for (const entry of M.THEME_EVENT_INVENTORY) {
      const [detail, extra] = details[entry.type] ?? [{}];
      const out = plain(M.bridgeThemeEvent(entry.type, detail, extra));
      if (!entry.publish) {
        assert.equal(out, null, entry.type);
        continue;
      }
      assert.equal(out.name, entry.publish, entry.type);
      const mapped = M.mapEvent(custom(out.name, out.data), GAPS);
      assert.ok(mapped && mapped.ga4, `${entry.type} -> ${out.name} debe mapear`);
    }
    assert.equal(M.bridgeThemeEvent("product:add-to-cart", { form: {}, respondWith() {} }), null);
    assert.equal(M.bridgeThemeEvent("inventado:evento", {}), null);
  });

  test("el puente no copia campos extra y limpia el término de búsqueda", () => {
    const wishlist = plain(M.bridgeThemeEvent("wishlist:add", { productId: "3001", handle: "brisa-natural-beige", email: PII.email }));
    assert.deepEqual(wishlist, { name: "radaelli:wishlist_add", data: { product_id: "3001", handle: "brisa-natural-beige" } });
    const search = plain(M.bridgeThemeEvent("search:no-results", { query: PII.email, source: "page" }));
    assert.equal(search.data.query, "[redacted]");
    const error = plain(M.bridgeThemeEvent("cart:error", { source: "change", message: PII.email }));
    assert.deepEqual(error.data, { source: "change" });
  });
});

/* ------------------------------------------------------------------
   9. Runtime del pixel (radaelli-pixel.js con mocks)
   ------------------------------------------------------------------ */

function runPixel({ config, consent, cookies = {}, privacyVia = "global" } = {}) {
  let source = PIXEL_SOURCE;
  if (config) {
    source = source.replace(
      /\/\* BEGIN CONFIG \*\/[\s\S]*?\/\* END CONFIG \*\//,
      `/* BEGIN CONFIG */\nconst RADAELLI_PIXEL_CONFIG = Object.freeze(${JSON.stringify(config)});\n/* END CONFIG */`,
    );
  }
  const handlers = new Map();
  const consentHandlers = [];
  const scripts = [];
  const cookieReads = [];
  const privacyApi = {
    subscribe(name, callback) {
      if (name === "visitorConsentCollected") consentHandlers.push(callback);
    },
  };
  const context = {
    analytics: {
      subscribe(name, callback) {
        handlers.set(name, callback);
      },
    },
    // "global": variable suelta; "api": solo api.customerPrivacy (forma del ejemplo
    // oficial de custom pixels en shopify.dev .../pixel-privacy).
    ...(privacyVia === "api" ? { api: { customerPrivacy: privacyApi } } : { customerPrivacy: privacyApi }),
    browser: {
      cookie: {
        async get(name) {
          cookieReads.push(name);
          return cookies[name] ?? "";
        },
      },
    },
    init: {
      customerPrivacy: consent,
      data: { customer: { email: PII.email, firstName: PII.first, lastName: PII.last, phone: PII.phone }, cart: null },
    },
    document: {
      head: {
        appendChild(element) {
          scripts.push(element.src);
        },
      },
      createElement(tagName) {
        return { tagName };
      },
    },
    console: { log() {} },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "radaelli-pixel.js" });

  return {
    context,
    handlers,
    scripts,
    cookieReads,
    async emit(event) {
      const callback = handlers.get(event.name);
      if (callback) await callback(event);
    },
    /** Entrega `event` al handler suscrito como `subscribedName` (sin tocar event.name). */
    async emitAs(subscribedName, event) {
      const callback = handlers.get(subscribedName);
      if (callback) await callback(event);
    },
    consentSubscribers() {
      return consentHandlers.length;
    },
    async setConsent(next) {
      for (const callback of consentHandlers) callback({ customerPrivacy: next });
      await flush();
    },
    ga4Events() {
      const layer = context.dataLayer ? plain(context.dataLayer.map((args) => Array.from(args))) : [];
      return layer.filter((entry) => entry[0] === "event").map((entry) => ({ name: entry[1], params: entry[2] }));
    },
    dataLayer() {
      return context.dataLayer ? plain(context.dataLayer.map((args) => Array.from(args))) : [];
    },
    fbq() {
      return context.fbq ? plain(context.fbq.queue.map((args) => Array.from(args))) : [];
    },
    metaTracks() {
      return this.fbq().filter((entry) => entry[0] === "track" || entry[0] === "trackCustom");
    },
  };
}

const GTAG_URL = `https://www.googletagmanager.com/gtag/js?id=${TEST_GA4_ID}`;
const FBEVENTS_URL = "https://connect.facebook.net/en_US/fbevents.js";

describe("runtime: no dispara sin interruptor, sin IDs ni sin consentimiento", () => {
  test("archivo de fábrica (ENABLED=false): no se suscribe, no carga scripts, aunque haya consentimiento", async () => {
    const pixel = runPixel({ consent: ALL });
    assert.equal(pixel.handlers.size, 0);
    assert.deepEqual(pixel.scripts, []);
    assert.equal(pixel.context.gtag, undefined);
    assert.equal(pixel.context.fbq, undefined);
  });

  test("ENABLED=false con IDs válidos y consentimiento total: el interruptor manda, nada se suscribe", async () => {
    const pixel = runPixel({ config: { ...ON, ENABLED: false, MODE: "full" }, consent: ALL });
    assert.equal(pixel.handlers.size, 0);
    for (const build of Object.values(STANDARD_FIXTURES)) await pixel.emit(build());
    assert.deepEqual(pixel.scripts, []);
    assert.equal(pixel.context.gtag, undefined);
    assert.equal(pixel.context.fbq, undefined);
  });

  test("ENABLED=true con IDs vacíos o de relleno: no se suscribe ni carga nada", async () => {
    for (const ids of [
      { GA4_MEASUREMENT_ID: "", META_PIXEL_ID: "" },
      { GA4_MEASUREMENT_ID: "G-XXXXXXXXXX", META_PIXEL_ID: "0000000000000000" },
    ]) {
      const pixel = runPixel({ config: { ENABLED: true, MODE: "full", ...ids }, consent: ALL });
      assert.equal(pixel.handlers.size, 0, JSON.stringify(ids));
      assert.deepEqual(pixel.scripts, []);
      assert.equal(pixel.context.gtag, undefined);
      assert.equal(pixel.context.fbq, undefined);
    }
  });

  test("sin consentimiento (o sin dato): recibe eventos pero no carga ni envía nada, ni lee _ga", async () => {
    for (const consent of [NOTHING, undefined]) {
      const pixel = runPixel({ config: { ...ON, MODE: "full" }, consent });
      assert.equal(pixel.handlers.size, 21);
      for (const build of [...Object.values(STANDARD_FIXTURES), ...Object.values(CUSTOM_FIXTURES)]) await pixel.emit(build());
      assert.deepEqual(pixel.scripts, []);
      assert.equal(pixel.context.gtag, undefined);
      assert.equal(pixel.context.fbq, undefined);
      assert.equal(pixel.cookieReads.includes("_ga"), false);
    }
  });

  test("consentimiento por categoría: analytics -> solo GA4; marketing -> Meta; revocar corta Meta", async () => {
    const pixel = runPixel({ config: { ...ON, MODE: "full" }, consent: NOTHING });
    await pixel.emit(STANDARD_FIXTURES.page_viewed());
    assert.deepEqual(pixel.scripts, []);

    await pixel.setConsent({ ...NOTHING, analyticsProcessingAllowed: true });
    await pixel.emit(std("page_viewed", {}, { id: "sh-page-2" }));
    assert.deepEqual(pixel.scripts, [GTAG_URL]);
    const layer = pixel.dataLayer();
    assert.deepEqual(layer[0], ["consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]);
    assert.deepEqual(layer[2][0], "config");
    assert.equal(layer[2][2].send_page_view, false);
    assert.equal(layer[2][2].allow_google_signals, false);
    assert.deepEqual(pixel.ga4Events(), [{ name: "page_view", params: { ...PRODUCT_PAGE, send_to: TEST_GA4_ID } }]);
    assert.equal(pixel.context.fbq, undefined, "Meta sigue apagado");

    await pixel.setConsent(ALL);
    await pixel.emit(CUSTOM_FIXTURES["radaelli:wishlist_add"]());
    assert.deepEqual(pixel.scripts, [GTAG_URL, FBEVENTS_URL]);
    const queue = pixel.fbq();
    assert.deepEqual(queue.slice(0, 2), [["set", "autoConfig", false, TEST_META_ID], ["init", TEST_META_ID]]);
    assert.deepEqual(pixel.metaTracks(), [
      ["track", "AddToWishlist", { content_ids: ["3001"], content_type: "product_group" }, { eventID: "radaelli:wishlist_add:sh-radaelli:wishlist_add-1" }],
    ]);
    assert.equal(queue.some((entry) => entry[0] === "track" && entry[1] === "PageView"), false, "sin PageView automático");
    assert.ok(pixel.dataLayer().some((entry) => entry[0] === "consent" && entry[1] === "update" && entry[2].ad_storage === "granted"));

    await pixel.setConsent({ ...ALL, marketingAllowed: false });
    assert.deepEqual(pixel.fbq().at(-1), ["consent", "revoke"]);
    await pixel.emit(custom("radaelli:wishlist_add", { product_id: "3002" }, { id: "sh-otro" }));
    assert.equal(pixel.metaTracks().length, 1, "después de revocar no se manda nada más a Meta");

    await pixel.setConsent(NOTHING);
    const before = pixel.ga4Events().length;
    await pixel.emit(std("page_viewed", {}, { id: "sh-page-3" }));
    assert.equal(pixel.ga4Events().length, before, "después de revocar analytics no se manda nada más a GA4");
  });

  test("tráfico interno (cookie propia = '1'): nada sale aunque haya consentimiento", async () => {
    const pixel = runPixel({
      config: { ...ON, MODE: "full", INTERNAL_TRAFFIC_COOKIE: "radaelli_internal" },
      consent: ALL,
      cookies: { radaelli_internal: "1" },
    });
    for (const build of Object.values(STANDARD_FIXTURES)) await pixel.emit(build());
    assert.deepEqual(pixel.scripts, []);
    assert.equal(pixel.context.fbq, undefined);
  });
});

describe("runtime: dueño por evento, dedup y PII", () => {
  test("gaps_only: el embudo no sale de este pixel; los huecos sí", async () => {
    const pixel = runPixel({ config: { ...ON, MODE: "gaps_only" }, consent: ALL });
    for (const build of Object.values(STANDARD_FIXTURES)) await pixel.emit(build());
    assert.deepEqual(
      pixel.ga4Events().map((event) => event.name),
      ["checkout_contact_info", "checkout_address_info"],
    );
    assert.deepEqual(pixel.metaTracks(), []);
    await pixel.emit(CUSTOM_FIXTURES["radaelli:wishlist_add"]());
    assert.deepEqual(pixel.metaTracks().map((entry) => entry[1]), ["AddToWishlist"]);
  });

  test("full: el mismo checkout reenviado no se duplica y lleva el mismo eventID", async () => {
    const pixel = runPixel({ config: { ...ON, MODE: "full" }, consent: ALL });
    await pixel.emit(std("checkout_started", { checkout: checkoutFixture() }, { id: "sh-a", context: CHECKOUT_CONTEXT }));
    await pixel.emit(std("checkout_started", { checkout: checkoutFixture() }, { id: "sh-b", context: CHECKOUT_CONTEXT }));
    await pixel.emit(std("checkout_completed", { checkout: checkoutFixture() }, { id: "sh-c", context: CHECKOUT_CONTEXT }));
    await pixel.emit(std("checkout_completed", { checkout: checkoutFixture() }, { id: "sh-d", context: CHECKOUT_CONTEXT }));
    const tracks = pixel.metaTracks();
    assert.deepEqual(tracks.map((entry) => entry[1]), ["InitiateCheckout", "Purchase"]);
    assert.match(tracks[0][3].eventID, /^checkout_started:[0-9a-f]{16}$/);
    assert.deepEqual(tracks[1][3], { eventID: "purchase:9001" });
    const purchases = pixel.ga4Events().filter((event) => event.name === "purchase");
    assert.equal(purchases.length, 1);
    assert.equal(purchases[0].params.transaction_id, "9001");
  });

  test("full: nada de lo que sale (dataLayer, fbq, URLs de scripts) contiene PII", async () => {
    const pixel = runPixel({ config: { ...ON, MODE: "full" }, consent: ALL, cookies: { _ga: "GA1.1.123456789.1700000000" } });
    for (const build of [...Object.values(STANDARD_FIXTURES), ...Object.values(CUSTOM_FIXTURES)]) await pixel.emit(build());
    assert.ok(pixel.ga4Events().length >= 13);
    assert.ok(pixel.metaTracks().length >= 8);
    assertNoPii({ dataLayer: pixel.dataLayer(), fbq: pixel.fbq(), scripts: pixel.scripts }, "runtime full");
  });

  test("client_id de GA4: de la cookie _ga si existe; si no, el clientId de Shopify", async () => {
    const withCookie = runPixel({ config: { ...ON, MODE: "full" }, consent: ALL, cookies: { _ga: "GA1.1.123456789.1700000000" } });
    await withCookie.emit(STANDARD_FIXTURES.page_viewed());
    assert.equal(withCookie.dataLayer().find((entry) => entry[0] === "config")[2].client_id, "123456789.1700000000");

    const withoutCookie = runPixel({ config: { ...ON, MODE: "full" }, consent: ALL });
    await withoutCookie.emit(STANDARD_FIXTURES.page_viewed());
    assert.equal(withoutCookie.dataLayer().find((entry) => entry[0] === "config")[2].client_id, "shopify-client-abc123");

    assert.equal(M.resolveGa4ClientId("basura", ""), "");
    assert.equal(M.resolveGa4ClientId("GA1.2.111.222", "x"), "111.222");
  });
});

describe("runtime: forma documentada del sandbox de custom pixels", () => {
  test("customerPrivacy solo vía api.customerPrivacy: igual escucha cambios y revoca Meta", async () => {
    const pixel = runPixel({ config: { ...ON, MODE: "gaps_only" }, consent: ALL, privacyVia: "api" });
    assert.equal(pixel.consentSubscribers(), 1, "debe suscribirse a visitorConsentCollected vía api.customerPrivacy");
    await pixel.emit(CUSTOM_FIXTURES["radaelli:wishlist_add"]());
    assert.equal(pixel.metaTracks().length, 1);
    await pixel.setConsent({ ...ALL, marketingAllowed: false });
    assert.deepEqual(pixel.fbq().at(-1), ["consent", "revoke"]);
    await pixel.emit(custom("radaelli:wishlist_add", { product_id: "3002" }, { id: "sh-otro" }));
    assert.equal(pixel.metaTracks().length, 1, "tras revocar no sale nada más a Meta");
  });

  test("custom event entregado con `name` sin prefijo: se mapea por el nombre suscrito", async () => {
    const pixel = runPixel({ config: { ...ON, MODE: "gaps_only" }, consent: ALL });
    const event = { ...CUSTOM_FIXTURES["radaelli:wishlist_add"](), name: "wishlist_add" };
    await pixel.emitAs("radaelli:wishlist_add", event);
    assert.deepEqual(pixel.ga4Events().map((entry) => entry.name), ["add_to_wishlist"]);
    assert.deepEqual(pixel.metaTracks().map((entry) => entry[1]), ["AddToWishlist"]);
  });
});
