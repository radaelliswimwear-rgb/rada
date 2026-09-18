import { fromSubunits } from "lib/currency/subunits";
import type { AttributionState } from "lib/attribution/types";
import { recordAnalyticsEvent } from "./store";

// payment_failed (Fase 2A, sección 16 del proceso): a diferencia del resto
// de eventos custom, este se detecta SERVER-SIDE (webhook de Wompi, cron de
// pagos vencidos, o el regreso del Checkout Web alojado -- ver
// applyWompiWebhookUpdateAction, lib/payments/payments-actions.ts) -- casi
// nunca hay un navegador real en ese momento (webhook/cron no tienen
// ninguno), así que no se puede resolver consentimiento/tráfico interno
// leyendo cookies() como hace recordAnalyticsEventAction para el resto de
// eventos. Usa en cambio los snapshots YA CONGELADOS en el propio Payment
// al crear el intent (marketingExclusionReason, attributionSnapshot -- ver
// lib/internal-traffic/resolve.ts / lib/attribution/resolve.ts), el mismo
// criterio que ya usa MarketingEventOutbox para Purchase.
//
// Decisión de alcance (documentada): este evento va SOLO a first-party,
// nunca a GA4/Meta CAPI en esta fase -- el outbox transaccional (sección 18)
// se definió explícitamente para Purchase, extenderlo a payment_failed
// queda para una fase futura si aporta valor real. Gateado únicamente por
// marketingExclusionReason (no hay un snapshot de consentimiento de
// ANALYTICS específico, distinto del de marketing) -- null = pedido no
// excluido (ni tráfico interno ni prueba e2e), condición suficiente para
// justificar guardar este dato de diagnóstico de funnel.
export async function recordPaymentFailedEvent(payment: {
  amount: number;
  currency: string;
  failureReason: string | null;
  marketingExclusionReason: string | null;
  attributionSnapshot: unknown;
}): Promise<void> {
  if ((payment.marketingExclusionReason ?? null) !== null) return;
  try {
    await recordAnalyticsEvent({
      name: "payment_failed",
      value: fromSubunits(payment.amount),
      currency: payment.currency,
      custom: payment.failureReason ? { reason: payment.failureReason } : undefined,
      analyticsSessionId: null,
      deviceCategory: "UNKNOWN",
      attributionSnapshot: (payment.attributionSnapshot as AttributionState) ?? null,
    });
  } catch (error) {
    console.error(
      "recordPaymentFailedEvent: fallo no bloqueante, evento descartado",
      error,
    );
  }
}
