"use client";

// Capa central de eventos (Fase 2A, sección 2 del proceso) -- el ÚNICO
// punto que los componentes cliente deben llamar. Nunca gtag()/fbq() ni
// fetches a analytics desperdigados por los componentes: todos pasan por
// acá, que reparte a los 3 destinos (GA4, Meta, first-party) según
// corresponda.
//
// No decide gates de consentimiento/tráfico interno/runtime acá -- eso ya
// lo resolvió el servidor en dos lugares distintos, cada uno responsable de
// su propio destino:
//   - GA4/Meta: si el script nunca se cargó (loader condicionado por
//     ANALYTICS_RUNTIME_ENABLED + consentimiento + tráfico externo, ver
//     components/analytics/analytics-loader.tsx), los adapters
//     (dispatchGA4Event/dispatchMetaPixelEvent) son no-op por diseño.
//   - first-party: recordAnalyticsEventAction (Server Action) vuelve a
//     resolver TODOS los gates server-side antes de escribir nada -- nunca
//     confía en que el cliente ya los haya chequeado.
import { dispatchGA4Event } from "../adapters/ga4-browser";
import { dispatchMetaPixelEvent } from "../adapters/meta-pixel-browser";
import { recordAnalyticsEventAction } from "../capture-actions";
import type { AnalyticsEventInput, AnalyticsProductPayload } from "../types";

export type TrackOptions = {
  // Compartido browser Pixel <-> server CAPI para Purchase -- ver
  // lib/analytics/purchase-event-id.ts.
  eventId?: string;
  // GA4 transaction_id (Purchase) -- ver buildGa4TransactionId.
  transactionId?: string;
};

export function track(input: AnalyticsEventInput, opts?: TrackOptions): void {
  dispatchGA4Event(input, { transactionId: opts?.transactionId });
  dispatchMetaPixelEvent(input, { eventId: opts?.eventId });
  // Fire-and-forget a propósito: "ANALYTICS MUST FAIL OPEN FOR COMMERCE"
  // (sección 1) -- nunca se espera esta promesa antes de continuar el flujo
  // de compra/navegación real.
  void recordAnalyticsEventAction(input);
}

export function trackCommerce(
  name: AnalyticsEventInput["name"],
  products: AnalyticsProductPayload[],
  value?: number,
  currency?: string,
  opts?: TrackOptions,
): void {
  track({ name, products, value, currency }, opts);
}

export function trackCustom(
  name: AnalyticsEventInput["name"],
  custom?: AnalyticsEventInput["custom"],
  opts?: TrackOptions,
): void {
  track({ name, custom }, opts);
}
