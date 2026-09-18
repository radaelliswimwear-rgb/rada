"use client";

// Adapter browser de Meta Pixel (Fase 2A, sección 34). No-op si
// window.fbq no existe -- mismo criterio que ga4-browser.ts: el loader
// nunca inyecta el script si ANALYTICS_RUNTIME_ENABLED=false, así que sin
// script cargado esto nunca hace nada.
//
// Fase 2B: ADEMÁS se revisa el consentimiento de marketing EN VIVO (ver el
// mismo razonamiento largo en ga4-browser.ts) -- revocar sin recargar no
// debe seguir mandando eventos mientras window.fbq siga en memoria.
//
// Meta tiene su propio vocabulario de eventos estándar (PascalCase),
// distinto del de GA4 -- esta tabla traduce los AnalyticsEventName que sí
// tienen equivalente estándar; el resto se manda con fbq('trackCustom', ...).
import type { AnalyticsEventInput } from "../types";
import { buildProductPayload } from "../product-payload";
import { readLiveConsent } from "./live-consent";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Auditoría de post-activación (sep. 2026): add_shipping_info faltaba acá
// -- Meta SÍ tiene un evento estándar documentado con ese nombre exacto
// ("AddShippingInfo", la contraparte de "AddPaymentInfo", que ya estaba
// mapeado) -- sin esta línea se mandaba como evento custom en vez del
// estándar real. view_cart/remove_from_cart/select_item quedan
// deliberadamente sin mapear: Meta no tiene un evento estándar para
// ninguno de los tres, así que caen a fbq('trackCustom', ...) a propósito.
const STANDARD_EVENTS: Partial<Record<AnalyticsEventInput["name"], string>> = {
  view_item: "ViewContent",
  view_item_list: "ViewContent",
  add_to_wishlist: "AddToWishlist",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  add_shipping_info: "AddShippingInfo",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
  search: "Search",
};

function buildContents(products: ReturnType<typeof buildProductPayload>[] | undefined) {
  if (!products || products.length === 0) return undefined;
  return products.map((p) => ({
    id: p.item_id,
    quantity: p.quantity ?? 1,
    item_price: p.price,
  }));
}

// content_ids/content_name: parámetros que Meta documenta como recomendados
// para eventos estándar de producto (ViewContent/AddToCart/InitiateCheckout/
// Purchase), distintos de `contents` -- se usan para el matching contra el
// catálogo de Meta. content_ids usa el SKU real cuando existe (mismo id que
// el catálogo de Meta esperaría), y cae a item_id (Product.id, siempre
// real) si no hay SKU -- nunca se inventa. content_name solo se manda
// cuando hay EXACTAMENTE un producto (evento a nivel de producto individual,
// ej. view_item/add_to_cart) -- para eventos multi-producto (view_item_list)
// un solo nombre sería engañoso, así que se omite en vez de inventar uno.
function buildContentIds(products: ReturnType<typeof buildProductPayload>[] | undefined) {
  if (!products || products.length === 0) return undefined;
  return products.map((p) => p.sku ?? p.item_id);
}

function buildContentName(products: ReturnType<typeof buildProductPayload>[] | undefined) {
  if (!products || products.length !== 1) return undefined;
  return products[0]!.item_name;
}

export function dispatchMetaPixelEvent(
  input: AnalyticsEventInput,
  extra?: { eventId?: string },
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (readLiveConsent()?.marketing !== true) return;

  const params: Record<string, unknown> = {};
  if (input.value != null) params.value = input.value;
  if (input.currency) params.currency = input.currency;
  const contents = buildContents(input.products);
  if (contents) {
    params.contents = contents;
    params.content_type = "product";
    const contentIds = buildContentIds(input.products);
    if (contentIds) params.content_ids = contentIds;
    const contentName = buildContentName(input.products);
    if (contentName) params.content_name = contentName;
  }
  if (input.custom) Object.assign(params, input.custom);

  const options = extra?.eventId ? { eventID: extra.eventId } : undefined;
  const standardName = STANDARD_EVENTS[input.name];
  if (standardName) {
    window.fbq("track", standardName, params, options);
  } else {
    window.fbq("trackCustom", input.name, params, options);
  }
}
