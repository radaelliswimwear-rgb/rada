// Auditoría post-activación (sep. 2026): dispatchMetaPixelEvent no tenía
// ningún test propio -- solo su contraparte server (meta-capi.ts) los
// tenía. Corre en Node puro (sin DOM real): se stubea window/document
// mínimamente, ya que el adapter solo necesita `window.fbq` como función y
// `document.cookie` como string, nunca un DOM real.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { dispatchMetaPixelEvent } from "./meta-pixel-browser";
import type { AnalyticsProductPayload } from "../types";

type FbqCall = { args: unknown[] };
let calls: FbqCall[];

function setConsentCookie(prefs: { analytics: boolean; marketing: boolean } | null) {
  if (!prefs) {
    (globalThis as { document: { cookie: string } }).document.cookie = "";
    return;
  }
  const value = encodeURIComponent(
    JSON.stringify({ version: 1, ...prefs, timestamp: "2026-09-18T00:00:00.000Z" }),
  );
  (globalThis as { document: { cookie: string } }).document.cookie =
    `radaelli_consent=${value}`;
}

beforeEach(() => {
  calls = [];
  (globalThis as unknown as { document: unknown }).document = { cookie: "" };
  (globalThis as unknown as { window: unknown }).window = {
    fbq: (...args: unknown[]) => {
      calls.push({ args });
    },
  };
});

afterEach(() => {
  delete (globalThis as { document?: unknown }).document;
  delete (globalThis as { window?: unknown }).window;
});

const PRODUCT: AnalyticsProductPayload = {
  item_id: "prod-1",
  item_name: "Bikini Foam",
  price: 180000,
  currency: "COP",
  sku: "RAD-BIK-001",
};

test("window.fbq no definido (runtime off / tráfico interno / script nunca cargó) -> no llama a nada", () => {
  delete (globalThis as { window?: unknown }).window;
  setConsentCookie({ analytics: true, marketing: true });
  dispatchMetaPixelEvent({ name: "view_item", products: [PRODUCT], value: 180000, currency: "COP" });
  assert.equal(calls.length, 0);
});

test("sin consentimiento de marketing -> no llama a fbq, aunque el script ya esté cargado", () => {
  setConsentCookie({ analytics: true, marketing: false });
  dispatchMetaPixelEvent({ name: "view_item", products: [PRODUCT], value: 180000, currency: "COP" });
  assert.equal(calls.length, 0);
});

test("sin ninguna decisión de consentimiento guardada -> no llama a fbq (fail-closed)", () => {
  setConsentCookie(null);
  dispatchMetaPixelEvent({ name: "view_item", products: [PRODUCT], value: 180000, currency: "COP" });
  assert.equal(calls.length, 0);
});

test("view_item -> ViewContent, con content_ids/content_name/content_type/value/currency reales", () => {
  setConsentCookie({ analytics: true, marketing: true });
  dispatchMetaPixelEvent({ name: "view_item", products: [PRODUCT], value: 180000, currency: "COP" });
  assert.equal(calls.length, 1);
  const [action, eventName, params] = calls[0]!.args as [string, string, Record<string, unknown>];
  assert.equal(action, "track");
  assert.equal(eventName, "ViewContent");
  assert.equal(params.value, 180000);
  assert.equal(params.currency, "COP");
  assert.equal(params.content_type, "product");
  assert.deepEqual(params.content_ids, ["RAD-BIK-001"]);
  assert.equal(params.content_name, "Bikini Foam");
  assert.deepEqual(params.contents, [{ id: "prod-1", quantity: 1, item_price: 180000 }]);
});

test("content_ids cae a item_id cuando el producto no tiene sku (nunca inventa uno)", () => {
  setConsentCookie({ analytics: true, marketing: true });
  const noSku: AnalyticsProductPayload = { ...PRODUCT, sku: null };
  dispatchMetaPixelEvent({ name: "view_item", products: [noSku], value: 180000, currency: "COP" });
  const [, , params] = calls[0]!.args as [string, string, Record<string, unknown>];
  assert.deepEqual(params.content_ids, ["prod-1"]);
});

test("content_name se omite con más de un producto (view_item_list) -- nunca inventa un nombre único", () => {
  setConsentCookie({ analytics: true, marketing: true });
  const second: AnalyticsProductPayload = {
    ...PRODUCT,
    item_id: "prod-2",
    item_name: "Traje Coral",
    sku: "RAD-TRA-002",
  };
  dispatchMetaPixelEvent({
    name: "view_item_list",
    products: [PRODUCT, second],
    custom: { list_name: "Destacados" },
  });
  const [action, eventName, params] = calls[0]!.args as [string, string, Record<string, unknown>];
  assert.equal(action, "track");
  assert.equal(eventName, "ViewContent");
  assert.equal("content_name" in params, false);
  assert.deepEqual(params.content_ids, ["RAD-BIK-001", "RAD-TRA-002"]);
});

test("add_to_cart -> AddToCart", () => {
  setConsentCookie({ analytics: true, marketing: true });
  dispatchMetaPixelEvent({ name: "add_to_cart", products: [PRODUCT], value: 180000, currency: "COP" });
  const [, eventName] = calls[0]!.args as [string, string];
  assert.equal(eventName, "AddToCart");
});

test("begin_checkout -> InitiateCheckout", () => {
  setConsentCookie({ analytics: true, marketing: true });
  dispatchMetaPixelEvent({ name: "begin_checkout", products: [PRODUCT], value: 180000, currency: "COP" });
  const [, eventName] = calls[0]!.args as [string, string];
  assert.equal(eventName, "InitiateCheckout");
});

test("add_shipping_info -> AddShippingInfo (antes faltaba en la tabla, se mandaba como custom)", () => {
  setConsentCookie({ analytics: true, marketing: true });
  dispatchMetaPixelEvent({ name: "add_shipping_info", products: [PRODUCT], value: 180000, currency: "COP" });
  const [action, eventName] = calls[0]!.args as [string, string];
  assert.equal(action, "track");
  assert.equal(eventName, "AddShippingInfo");
});

test("add_payment_info -> AddPaymentInfo", () => {
  setConsentCookie({ analytics: true, marketing: true });
  dispatchMetaPixelEvent({ name: "add_payment_info", products: [PRODUCT], value: 180000, currency: "COP" });
  const [, eventName] = calls[0]!.args as [string, string];
  assert.equal(eventName, "AddPaymentInfo");
});

test("purchase -> Purchase, con event_id compartido con CAPI vía options.eventID", () => {
  setConsentCookie({ analytics: true, marketing: true });
  dispatchMetaPixelEvent(
    { name: "purchase", products: [PRODUCT], value: 180000, currency: "COP" },
    { eventId: "purchase:order-1" },
  );
  const [action, eventName, , options] = calls[0]!.args as [string, string, unknown, { eventID?: string }];
  assert.equal(action, "track");
  assert.equal(eventName, "Purchase");
  assert.deepEqual(options, { eventID: "purchase:order-1" });
});

test("view_cart -> se manda como evento custom (Meta no tiene un estándar equivalente, a propósito)", () => {
  setConsentCookie({ analytics: true, marketing: true });
  dispatchMetaPixelEvent({ name: "view_cart", products: [PRODUCT], value: 180000, currency: "COP" });
  const [action, eventName] = calls[0]!.args as [string, string];
  assert.equal(action, "trackCustom");
  assert.equal(eventName, "view_cart");
});

test("remove_from_cart -> se manda como evento custom (sin estándar Meta equivalente, a propósito)", () => {
  setConsentCookie({ analytics: true, marketing: true });
  dispatchMetaPixelEvent({ name: "remove_from_cart", products: [PRODUCT], value: 180000, currency: "COP" });
  const [action, eventName] = calls[0]!.args as [string, string];
  assert.equal(action, "trackCustom");
  assert.equal(eventName, "remove_from_cart");
});

test("select_item -> se manda como evento custom (sin estándar Meta equivalente, a propósito)", () => {
  setConsentCookie({ analytics: true, marketing: true });
  dispatchMetaPixelEvent({ name: "select_item", products: [PRODUCT], value: 180000, currency: "COP" });
  const [action, eventName] = calls[0]!.args as [string, string];
  assert.equal(action, "trackCustom");
  assert.equal(eventName, "select_item");
});
