// Adapter SERVER de GA4 Measurement Protocol (Fase 2A, secciones 9/35).
// PREPARADO pero NO conectado al flujo de Purchase en esta fase -- decisión
// documentada (sección 21 del proceso):
//
// Measurement Protocol necesita el `client_id` que gtag.js genera en el
// navegador (cookie _ga) para que el evento server-side se asocie a la
// sesión/usuario correcta en GA4 -- sin capturarlo y reenviarlo con
// cuidado, un Purchase server-side termina creando una sesión/cliente
// "huérfano" en GA4, contaminando los reportes (problema conocido y muy
// común de Measurement Protocol mal implementado). Capturar ese client_id
// de forma confiable es trabajo adicional real (leer la cookie _ga en el
// navegador, pasarla al servidor) que esta fase no incluye a propósito
// ("preferir evitar duplicación/complejidad innecesaria").
//
// Por eso: GA4 Purchase en esta fase es BROWSER-ONLY (ver
// components/checkout/order-confirmation.tsx), con transaction_id estable
// (Order.orderNumber) como mecanismo de dedup propio de GA4 ante recargas
// de la página de confirmación. Este adapter queda escrito y probado,
// listo para conectarse el día que se resuelva la captura de client_id --
// agregarlo al MarketingEventOutbox en ese momento es sumar "GA4" al enum
// MarketingEventProvider (una migración de una línea) y llamarlo desde
// sendMarketingEventJob, no un rediseño.
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
