"use client";

// Adapter browser de Meta Pixel (Fase 2A, sección 34). No-op si
// window.fbq no existe -- mismo criterio que ga4-browser.ts: el loader
// nunca inyecta el script si ANALYTICS_RUNTIME_ENABLED=false, así que sin
// script cargado esto nunca hace nada.
//
// Meta tiene su propio vocabulario de eventos estándar (PascalCase),
// distinto del de GA4 -- esta tabla traduce los AnalyticsEventName que sí
// tienen equivalente estándar; el resto se manda con fbq('trackCustom', ...).
import type { AnalyticsEventInput } from "../types";
import { buildProductPayload } from "../product-payload";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const STANDARD_EVENTS: Partial<Record<AnalyticsEventInput["name"], string>> = {
  view_item: "ViewContent",
  view_item_list: "ViewContent",
  add_to_wishlist: "AddToWishlist",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
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

export function dispatchMetaPixelEvent(
  input: AnalyticsEventInput,
  extra?: { eventId?: string },
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  const params: Record<string, unknown> = {};
  if (input.value != null) params.value = input.value;
  if (input.currency) params.currency = input.currency;
  const contents = buildContents(input.products);
  if (contents) {
    params.contents = contents;
    params.content_type = "product";
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
