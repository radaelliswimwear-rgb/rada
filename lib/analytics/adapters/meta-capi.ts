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

// Formato real documentado del error de Graph API:
// { "error": { "message", "type", "code", "error_subcode"?, "fbtrace_id" } }
// -- ver developers.facebook.com/docs/graph-api/guides/error-handling.
type MetaGraphErrorBody = {
  error?: {
    message?: unknown;
    type?: unknown;
    code?: unknown;
    error_subcode?: unknown;
    fbtrace_id?: unknown;
  };
};

// Diagnóstico E2E #1006 (sep. 2026): antes esto solo guardaba
// `texto crudo.slice(0, 300)` -- si Meta respondía JSON estructurado (lo
// normal), quedaba un blob sin parsear, inútil para diagnosticar sin volver
// a reproducir el fallo. Ahora se intenta parsear el shape real de Graph
// API y arma un mensaje corto con exactamente lo que Meta Support pide para
// investigar un error (code/error_subcode/fbtrace_id) -- nunca el access
// token (no viene en el body de respuesta, nunca se lo pedimos de vuelta) y
// nunca el payload que mandamos (podría creerse sensible aunque hoy no
// llevemos PII). Si el body no es el JSON esperado (respuesta HTML de un
// proxy, timeout parcial, etc.) cae al texto crudo truncado, igual que
// antes -- nunca revienta por un body inesperado.
async function describeMetaCapiError(response: Response): Promise<string> {
  const rawText = await response.text();

  let parsed: MetaGraphErrorBody | null = null;
  try {
    parsed = JSON.parse(rawText) as MetaGraphErrorBody;
  } catch {
    parsed = null;
  }

  const metaError = parsed?.error;
  const message =
    typeof metaError?.message === "string"
      ? metaError.message.slice(0, 300)
      : null;

  if (!message) {
    return `Meta CAPI respondió ${response.status}: ${rawText.slice(0, 300)}`;
  }

  const type = typeof metaError?.type === "string" ? metaError.type : null;
  const code = typeof metaError?.code === "number" ? metaError.code : null;
  const subcode =
    typeof metaError?.error_subcode === "number"
      ? metaError.error_subcode
      : null;
  const fbtraceId =
    typeof metaError?.fbtrace_id === "string" ? metaError.fbtrace_id : null;

  return [
    `Meta CAPI ${response.status}`,
    type ? `[${type}]` : null,
    message,
    code !== null
      ? `(code ${code}${subcode !== null ? `, subcode ${subcode}` : ""})`
      : null,
    fbtraceId ? `fbtrace_id=${fbtraceId}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

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
      return {
        success: false,
        error: await describeMetaCapiError(response),
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
