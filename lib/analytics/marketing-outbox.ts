import type { Prisma } from "@prisma/client";
import { prisma } from "lib/prisma";
import { buildPurchaseEventId } from "./purchase-event-id";
import { sendMetaCapiPurchase } from "./adapters/meta-capi";
import { isServerDeliveryEnabled } from "./feature-flags";
import type { AnalyticsProductPayload } from "./types";
import { logEvent } from "lib/observability/log";

// PROPUESTA (Fase 2A de analytics, sección 18 del proceso) -- transactional
// outbox para Purchase, MISMO patrón exacto que EmailOutbox
// (lib/email/outbox.ts): una fila por (pedido, evento, proveedor), creada
// ATÓMICAMENTE junto con el Order dentro de la misma transacción
// (createOrderForPayment), procesada DESPUÉS del commit por una única
// función reusada para el intento inmediato y para los reintentos del cron.
// Evita por diseño que una llamada de red a Meta pueda romper la creación
// del Order.
//
// Hoy solo emite jobs para META -- GA4 Purchase es browser-only en esta
// fase (decisión documentada en
// lib/analytics/adapters/ga4-measurement-protocol.ts).
export const MAX_MARKETING_OUTBOX_ATTEMPTS = 5;
export const MARKETING_PROCESSING_STALE_AFTER_MINUTES = 10;

export type MarketingOrderSnapshot = {
  orderId: string;
  total: number; // pesos COP enteros, NO centavos (mismo criterio que AnalyticsEvent.value)
  currency: string;
  eventSourceUrl?: string;
  products: AnalyticsProductPayload[];
  // Snapshots congelados al crear el Payment (lib/analytics/resolve.ts,
  // lib/internal-traffic/resolve.ts) -- nunca se recalculan acá. null en
  // marketingConsentSnapshot significa "no se pudo determinar", que NUNCA
  // autoriza envío (fail-closed, no fail-open -- acá el riesgo es mandar
  // algo sin permiso, no bloquear una compra).
  marketingExclusionReason: string | null;
  marketingConsentSnapshot: boolean | null;
  // Fase 2B: User-Agent real congelado al crear el Payment (ver
  // lib/analytics/resolve.ts) -- único uso: client_user_agent en el payload
  // de Meta CAPI (parámetro ya seleccionado a mano en Meta Events Manager).
  // null = no se pudo capturar; el adapter simplemente omite el campo.
  userAgentSnapshot: string | null;
};

// Regla exacta de la sección 27 ("Meta CAPI: requiere marketing=true Y
// Order no excluido"), expresada sobre los snapshots ya congelados -- ver
// lib/analytics/consent-gate.ts (isMetaCapiAllowed) para la misma regla
// expresada sobre consentimiento EN VIVO (usada solo en tests/documentación
// de la matriz; la entrega real siempre pasa por acá, por snapshot, porque
// createOrderForPayment puede correr desde un webhook/cron sin cookies).
function isMetaCapiAllowedFromSnapshot(order: MarketingOrderSnapshot): boolean {
  if (order.marketingConsentSnapshot !== true) return false;
  return (order.marketingExclusionReason ?? null) === null;
}

// Llamada DENTRO de la misma transacción que crea el Order (mismo criterio
// que createEmailOutboxJobsForOrder). Si el gate no califica (tráfico
// interno / e2e_test / sin consentimiento de marketing), la fila se crea
// IGUAL, con status SKIPPED -- deja rastro de que se evaluó y por qué no se
// envía, en vez de no dejar ningún registro (sección 11 del proceso P0
// anterior: "no mentir" aplica también acá).
export async function createMarketingEventJobsForOrder(
  tx: Prisma.TransactionClient,
  order: MarketingOrderSnapshot,
): Promise<{ id: string }[]> {
  const eventId = buildPurchaseEventId(order.orderId);
  const allowed = isMetaCapiAllowedFromSnapshot(order);

  const row = await tx.marketingEventOutbox.create({
    data: {
      orderId: order.orderId,
      eventName: "PURCHASE",
      provider: "META",
      eventId,
      payloadSnapshot: {
        eventId,
        eventSourceUrl: order.eventSourceUrl ?? null,
        value: order.total,
        currency: order.currency,
        products: order.products,
        userAgentSnapshot: order.userAgentSnapshot,
      },
      status: allowed ? "PENDING" : "SKIPPED",
      // Hardening de outbox histórico (sep. 2026): TODA fila creada a
      // partir de este código es, por definición, un pedido nuevo -- nunca
      // se vuelve a tocar este campo después de creada (ver el comentario
      // largo en prisma/schema.prisma, junto a MarketingEventOutbox.eligibleForBatch).
      eligibleForBatch: true,
    },
    select: { id: true },
  });
  return [row];
}

export type SendMarketingEventJobResult = "sent" | "failed" | "skipped";

// Punto de entrada ÚNICO para intentar entregar un job -- mismo reclamo
// atómico que sendOutboxJob (lib/email/outbox.ts): un updateMany
// condicional cubre PENDING/FAILED/PROCESSING-abandonado, nunca "leer y
// después actualizar".
export async function sendMarketingEventJob(
  jobId: string,
): Promise<SendMarketingEventJobResult> {
  // Segunda capa de defensa, independiente de si META_CAPI_ACCESS_TOKEN
  // está configurado (lib/analytics/adapters/meta-capi.ts ya lo chequea
  // solo): con el runtime apagado, ni siquiera se reclama el job -- queda
  // PENDING intacto, sin consumir intentos, listo para cuando se active.
  // Esto es justamente lo que garantiza "AL FINAL: todas las vías externas
  // apagadas" (sección 36) sin depender de un solo punto de control.
  if (!isServerDeliveryEnabled()) return "skipped";

  const staleCutoff = new Date(
    Date.now() - MARKETING_PROCESSING_STALE_AFTER_MINUTES * 60 * 1000,
  );

  const claimed = await prisma.marketingEventOutbox.updateMany({
    where: {
      id: jobId,
      // Hardening de outbox histórico (sep. 2026): esta condición vive
      // DENTRO del mismo reclamo atómico -- no es un chequeo aparte antes
      // de intentar el envío. Así, sea cual sea quien llame a esta función
      // (el intento inmediato de un pedido nuevo, processMarketingEventOutboxBatch,
      // o una llamada directa futura con el id de un job histórico como el
      // del pedido #1006), un job con eligibleForBatch=false NUNCA puede
      // reclamarse -- count queda en 0, se trata igual que "ya lo tomó otro
      // worker". No hay ninguna vía que pueda reenviar un Purchase
      // histórico llamando a esta función, ni siquiera por error.
      eligibleForBatch: true,
      attemptCount: { lt: MAX_MARKETING_OUTBOX_ATTEMPTS },
      OR: [
        { status: "PENDING" },
        { status: "FAILED" },
        { status: "PROCESSING", lastAttemptAt: { lt: staleCutoff } },
      ],
    },
    data: {
      status: "PROCESSING",
      attemptCount: { increment: 1 },
      lastAttemptAt: new Date(),
    },
  });

  if (claimed.count === 0) return "skipped";

  const job = await prisma.marketingEventOutbox.findUnique({
    where: { id: jobId },
  });
  if (!job) return "skipped";

  if (job.provider !== "META" || job.eventName !== "PURCHASE") {
    // No debería pasar hoy (únicos valores que se crean) -- guarda explícita
    // para que un enum futuro (GA4) nunca caiga acá sin un branch propio.
    await prisma.marketingEventOutbox.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        lastError: "Combinación evento/proveedor no manejada.",
      },
    });
    return "failed";
  }

  const payload = job.payloadSnapshot as {
    eventId: string;
    eventSourceUrl: string | null;
    value: number;
    currency: string;
    products: AnalyticsProductPayload[];
    userAgentSnapshot?: string | null;
  };

  const result = await sendMetaCapiPurchase({
    eventId: payload.eventId,
    eventSourceUrl: payload.eventSourceUrl ?? undefined,
    value: payload.value,
    currency: payload.currency,
    products: payload.products,
    userAgent: payload.userAgentSnapshot ?? undefined,
  });

  console.log("sendMarketingEventJob", {
    jobId: job.id,
    orderId: job.orderId,
    provider: job.provider,
    eventName: job.eventName,
    attempt: job.attemptCount,
    result: result.success ? "sent" : "failed",
  });

  if (result.success) {
    await prisma.marketingEventOutbox.update({
      where: { id: jobId },
      data: { status: "SENT", sentAt: new Date() },
    });
    return "sent";
  }

  const errorMessage =
    "skippedReason" in result ? result.skippedReason : result.error;
  await prisma.marketingEventOutbox.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      lastError: (errorMessage ?? "Error desconocido").slice(0, 500),
    },
  });

  const exhausted = job.attemptCount >= MAX_MARKETING_OUTBOX_ATTEMPTS;
  await logEvent({
    event: exhausted
      ? "marketing_outbox.retries_exhausted"
      : "marketing_outbox.send_failed",
    severity: exhausted ? "error" : "warn",
    orderId: job.orderId,
    provider: job.provider,
    outcome: job.eventName,
    reason: errorMessage ?? "Error desconocido",
    dedupeKey: exhausted ? `marketing_outbox:${job.id}` : undefined,
    alert: exhausted,
  });

  return "failed";
}

export type MarketingOutboxBatchSummary = {
  checked: number;
  sent: number;
  failed: number;
  skipped: number;
};

// Portable, sin imports de next/server -- mismo criterio que
// processEmailOutboxBatch.
//
// Hardening de outbox histórico (sep. 2026): la selección de candidatos
// filtra `eligibleForBatch: true` -- ningún job creado antes de este
// deploy (incluido el del pedido #1006) entra siquiera a la lista que este
// barrido considera, nunca llega a intentarse ni a contarse como
// "checked". El reclamo atómico dentro de sendMarketingEventJob repite la
// MISMA condición como defensa en profundidad (ver el comentario ahí), así
// que esta función no depende de un único punto para estar segura.
export async function processMarketingEventOutboxBatch(): Promise<MarketingOutboxBatchSummary> {
  const startedAt = Date.now();
  const staleCutoff = new Date(
    Date.now() - MARKETING_PROCESSING_STALE_AFTER_MINUTES * 60 * 1000,
  );

  await logEvent({ event: "marketing_outbox.batch_start", severity: "info" });

  const eligibleCandidateShape = {
    attemptCount: { lt: MAX_MARKETING_OUTBOX_ATTEMPTS },
    OR: [
      { status: "PENDING" as const },
      { status: "FAILED" as const },
      { status: "PROCESSING" as const, lastAttemptAt: { lt: staleCutoff } },
    ],
  };

  let candidates: { id: string }[];
  let historicalSkippedCount: number;
  try {
    // Fail-closed real (sección 2G del proceso): si esta consulta de
    // lectura falla por CUALQUIER motivo (DB caída, columna inesperada,
    // lo que sea), la función corta acá y no procesa NADA -- nunca cae a
    // una consulta "más simple" sin el filtro de elegibilidad como
    // alternativa, que sería justo el escenario que este hardening existe
    // para evitar.
    candidates = await prisma.marketingEventOutbox.findMany({
      where: { eligibleForBatch: true, ...eligibleCandidateShape },
      select: { id: true },
    });
    // Puramente informativo (nunca se toca ninguna de estas filas): cuántos
    // jobs históricos habrían sido candidatos si no fuera por la frontera
    // de elegibilidad -- visibilidad de que el hardening sigue activo, sin
    // acercarse a esas filas.
    historicalSkippedCount = await prisma.marketingEventOutbox.count({
      where: { eligibleForBatch: false, ...eligibleCandidateShape },
    });
  } catch (error) {
    await logEvent({
      event: "marketing_outbox.fail_closed",
      severity: "critical",
      reason:
        error instanceof Error
          ? error.message.slice(0, 200)
          : "Error desconocido al seleccionar candidatos",
      dedupeKey: "marketing_outbox.fail_closed",
      alert: true,
    });
    return { checked: 0, sent: 0, failed: 0, skipped: 0 };
  }

  if (historicalSkippedCount > 0) {
    await logEvent({
      event: "marketing_outbox.historical_skipped_count",
      severity: "info",
      outcome: String(historicalSkippedCount),
    });
  }

  const summary: MarketingOutboxBatchSummary = {
    checked: candidates.length,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const candidate of candidates) {
    try {
      const result = await sendMarketingEventJob(candidate.id);
      if (result === "sent") summary.sent++;
      else if (result === "failed") summary.failed++;
      else summary.skipped++;
    } catch (error) {
      console.error(
        "processMarketingEventOutboxBatch: fallo inesperado procesando un job, se reintentará en la próxima corrida",
        { jobId: candidate.id, error },
      );
      summary.failed++;
    }
  }

  await logEvent({
    event: "marketing_outbox.batch_summary",
    severity: summary.failed > 0 ? "warn" : "info",
    outcome: `checked=${summary.checked} sent=${summary.sent} failed=${summary.failed} skipped=${summary.skipped} historicalSkipped=${historicalSkippedCount} durationMs=${Date.now() - startedAt}`,
  });

  return summary;
}
