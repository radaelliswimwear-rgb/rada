"use client";

// Adapter browser de GA4 (Fase 2A, sección 33). No-op por diseño si el
// script de gtag.js nunca se cargó (window.gtag indefinido) -- eso es
// exactamente lo que garantiza que, con ANALYTICS_RUNTIME_ENABLED=false, el
// loader (components/analytics/analytics-loader.tsx) nunca inyecta el
// <script>, y cualquier llamada de este archivo queda en no-op silencioso.
//
// Fase 2B: ADEMÁS se revisa el consentimiento EN VIVO (lib/analytics/
// adapters/live-consent.ts) en cada dispatch -- si la clienta revoca
// consentimiento de analytics sin recargar la página, window.gtag sigue
// existiendo en memoria (el script ya corrió), así que el chequeo de
// arriba solo no alcanza para dejar de mandar eventos de inmediato.
//
// Nombres de evento: GA4 ya usa snake_case para sus eventos recomendados
// (page_view, view_item_list, select_item, view_item, add_to_wishlist,
// add_to_cart, view_cart, remove_from_cart, begin_checkout,
// add_shipping_info, add_payment_info, purchase, search) -- coinciden
// EXACTAMENTE con AnalyticsEventName (lib/analytics/types.ts), así que no
// hace falta ninguna tabla de traducción. Los eventos custom de Radaelli
// (select_size, click_whatsapp, filter_use, coupon_apply, payment_failed)
// se mandan igual, como eventos custom -- gtag no distingue.
//
// NO dispara session_start manualmente (sección 3): GA4 lo administra solo.
import type { AnalyticsEventInput } from "../types";
import { readLiveConsent } from "./live-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function dispatchGA4Event(
  input: AnalyticsEventInput,
  extra?: { transactionId?: string },
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  if (readLiveConsent()?.analytics !== true) return;

  const params: Record<string, unknown> = {};
  if (input.products && input.products.length > 0) params.items = input.products;
  if (input.value != null) params.value = input.value;
  if (input.currency) params.currency = input.currency;
  if (extra?.transactionId) params.transaction_id = extra.transactionId;
  if (input.path) params.page_path = input.path;
  if (input.custom) Object.assign(params, input.custom);

  window.gtag("event", input.name, params);
}
