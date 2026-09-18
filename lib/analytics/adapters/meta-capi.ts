// Adapter SERVER de Meta Conversions API (Fase 2A, secciones 8/18/35).
// "Preparado": si falta META_CAPI_ACCESS_TOKEN, devuelve skippedReason en
// vez de tirar -- nunca inventa un valor por defecto inseguro (sección 35:
// "NO marcar defaults inseguros"). Llamado por
// lib/analytics/marketing-outbox.ts (sendMarketingEventJob), nunca desde
// dentro de la transacción que crea el Order.
import type { AnalyticsProductPayload } from "../types";

export type MetaCapiPurchasePayload = {
  eventId: string; // buildPurchaseEventId(orderId) -- compartido con el Pixel browser
  eventSourceUrl?: string;
  value: number;
  currency: string;
  products: AnalyticsProductPayload[];
  // User-Agent real del navegador que hizo la compra (congelado al crear el
  // Payment, ver lib/analytics/resolve.ts) -- parámetro que Meta Events
  // Manager ya tiene seleccionado a mano. undefined = no se pudo capturar,
  // se omite el campo (nunca se inventa un valor).
  userAgent?: string;
};

export type AdapterDeliveryResult =
  | { success: true }
  | { success: false; skippedReason: string }
  | { success: false; error: string };

const META_GRAPH_API_VERSION = "v21.0";

export async function sendMetaCapiPurchase(
  payload: MetaCapiPurchasePayload,
): Promise<AdapterDeliveryResult> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return {
      success: false,
      skippedReason:
        "META_CAPI_ACCESS_TOKEN o NEXT_PUBLIC_META_PIXEL_ID no configurados -- delivery deshabilitado",
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          data: [
            {
              event_name: "Purchase",
              event_id: payload.eventId,
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_source_url: payload.eventSourceUrl,
              // Sin PII (sección 39): sin email/teléfono, sin Advanced
              // Matching en esta fase -- solo datos de producto/monto y,
              // si se pudo capturar, el User-Agent real (Fase 2B, ver
              // lib/analytics/resolve.ts).
              ...(payload.userAgent
                ? { user_data: { client_user_agent: payload.userAgent } }
                : {}),
              custom_data: {
                currency: payload.currency,
                value: payload.value,
                content_type: "product",
                contents: payload.products.map((p) => ({
                  id: p.item_id,
                  quantity: p.quantity ?? 1,
                  item_price: p.price,
                })),
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
        error: `Meta CAPI respondió ${response.status}: ${text.slice(0, 300)}`,
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
