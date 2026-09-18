// Adapter SERVER de GA4 Measurement Protocol (Fase 2A, secciones 9/35).
// PREPARADO pero NO conectado al flujo de Purchase -- decisión reconfirmada
// en la auditoría de pre-activación de Fase 2B tras evaluar a fondo si
// conectarlo ahora. Leer la cookie _ga vía cookies() en el mismo Server
// Action donde ya se congelan attributionSnapshot/marketingConsentSnapshot
// es técnicamente trivial -- ESE no es el obstáculo real. Los obstáculos
// reales, encontrados en esa auditoría:
//
//   1. GA4 Measurement Protocol no tiene un mecanismo de deduplicación
//      oficial equivalente al event_id compartido de Meta (Pixel+CAPI). Su
//      única señal es transaction_id, y este mismo repo ya desconfía del
//      dedup nativo de GA4 (ver el guard de sessionStorage en
//      components/checkout/order-confirmation.tsx, necesario justo porque
//      un F5 re-dispara el Purchase del navegador sin que GA4 lo bloquee
//      solo). Agregar un envío server-side del MISMO Purchase sin resolver
//      esto arriesga contar el revenue DOS VECES en GA4 para el camino
//      feliz mayoritario (cuando el navegador sí confirma).
//   2. No existe ninguna señal server-side de si el Purchase del navegador
//      ya se disparó para un Order dado (el guard de arriba vive solo en
//      sessionStorage) -- sin eso, ni siquiera se puede limitar el envío de
//      Measurement Protocol a "solo pedidos que el navegador no confirmó".
//   3. GA4 Purchase se gatea por consentimiento de ANALYTICS
//      (lib/analytics/consent-gate.ts), no de marketing -- conectarlo bien
//      requiere su propio snapshot (ver Payment.analyticsConsentSnapshot,
//      agregado en Fase 2B para otro uso), no reusar
//      Payment.marketingConsentSnapshot (categoría distinta).
//
// Por eso: GA4 Purchase sigue siendo BROWSER-ONLY (ver
// components/checkout/order-confirmation.tsx), con transaction_id estable
// (Order.orderNumber) como mecanismo de dedup propio de GA4 ante recargas
// de la página de confirmación. Este adapter queda escrito y probado,
// listo para conectarse el día que se diseñe explícitamente la estrategia
// de dedup (lo más seguro: reemplazar el Purchase del navegador, no sumarlo
// en paralelo) -- agregarlo al MarketingEventOutbox en ese momento es sumar
// "GA4" al enum MarketingEventProvider (una migración de una línea) y
// llamarlo desde sendMarketingEventJob; el trabajo real es el diseño de
// dedup, no la conexión en sí.
import type { AnalyticsProductPayload } from "../types";

export type Ga4MeasurementProtocolPurchasePayload = {
  clientId: string;
  transactionId: string;
  value: number;
  currency: string;
  products: AnalyticsProductPayload[];
};

export type AdapterDeliveryResult =
  | { success: true }
  | { success: false; skippedReason: string }
  | { success: false; error: string };

export async function sendGa4MeasurementProtocolPurchase(
  payload: Ga4MeasurementProtocolPurchasePayload,
): Promise<AdapterDeliveryResult> {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET;
  if (!measurementId || !apiSecret) {
    return {
      success: false,
      skippedReason:
        "GA4_MEASUREMENT_PROTOCOL_API_SECRET o NEXT_PUBLIC_GA4_MEASUREMENT_ID no configurados -- delivery deshabilitado",
    };
  }

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          client_id: payload.clientId,
          events: [
            {
              name: "purchase",
              params: {
                transaction_id: payload.transactionId,
                value: payload.value,
                currency: payload.currency,
                items: payload.products,
              },
            },
          ],
        }),
      },
    );
    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `GA4 Measurement Protocol respondió ${response.status}: ${text.slice(0, 300)}`,
      };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
