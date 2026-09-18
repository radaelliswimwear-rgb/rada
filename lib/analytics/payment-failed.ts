import { fromSubunits } from "lib/currency/subunits";
import type { AttributionState } from "lib/attribution/types";
import { isAnalyticsRuntimeEnabled } from "./feature-flags";
import { recordAnalyticsEvent } from "./store";

// payment_failed (Fase 2A, sección 16 del proceso): a diferencia del resto
// de eventos custom, este se detecta SERVER-SIDE (webhook de Wompi, cron de
// pagos vencidos, o el regreso del Checkout Web alojado -- ver
// applyWompiWebhookUpdateAction, lib/payments/payments-actions.ts) -- casi
// nunca hay un navegador real en ese momento (webhook/cron no tienen
// ninguno), así que no se puede resolver consentimiento/tráfico interno
// leyendo cookies() como hace recordAnalyticsEventAction para el resto de
// eventos. Usa en cambio los snapshots YA CONGELADOS en el propio Payment
// al crear el intent (marketingExclusionReason, attributionSnapshot,
// analyticsConsentSnapshot -- ver lib/internal-traffic/resolve.ts /
// lib/attribution/resolve.ts / lib/analytics/resolve.ts), el mismo criterio
// que ya usa MarketingEventOutbox para Purchase.
//
// Decisión de alcance (documentada): este evento va SOLO a first-party,
// nunca a GA4/Meta CAPI en esta fase -- el outbox transaccional (sección 18)
// se definió explícitamente para Purchase, extenderlo a payment_failed
// queda para una fase futura si aporta valor real.
//
// Corrección de Fase 2B (auditoría de pre-activación): antes de este cambio,
// esta función solo miraba marketingExclusionReason -- ni el flag maestro
// ANALYTICS_RUNTIME_ENABLED ni el consentimiento de analytics de la clienta,
// violando la garantía documentada en feature-flags.ts ("apagado, nada de
// esta fase hace NADA -- ni siquiera el first-party propio"). Con el fix: se
// exige runtime encendido Y analyticsConsentSnapshot===true (fail-closed,
// null/false nunca autoriza -- mismo criterio que isMetaCapiAllowedFromSnapshot
// en lib/analytics/marketing-outbox.ts) además de no estar excluido.
export async function recordPaymentFailedEvent(payment: {
  amount: number;
  currency: string;
  failureReason: string | null;
  marketingExclusionReason: string | null;
  attributionSnapshot: unknown;
  analyticsConsentSnapshot: boolean | null;
}): Promise<void> {
  if (!isAnalyticsRuntimeEnabled()) return;
  if ((payment.marketingExclusionReason ?? null) !== null) return;
  if (payment.analyticsConsentSnapshot !== true) return;
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
