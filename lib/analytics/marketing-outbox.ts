import type { Prisma } from "@prisma/client";
import { prisma } from "lib/prisma";
import { buildPurchaseEventId } from "./purchase-event-id";
import { sendMetaCapiPurchase } from "./adapters/meta-capi";
import { isServerDeliveryEnabled } from "./feature-flags";
import type { AnalyticsProductPayload } from "./types";

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

  const job = await prisma.marketingEventOutbox.findUnique({ where: { id: jobId } });
  if (!job) return "skipped";

  if (job.provider !== "META" || job.eventName !== "PURCHASE") {
    // No debería pasar hoy (únicos valores que se crean) -- guarda explícita
    // para que un enum futuro (GA4) nunca caiga acá sin un branch propio.
    await prisma.marketingEventOutbox.update({
      where: { id: jobId },
      data: { status: "FAILED", lastError: "Combinación evento/proveedor no manejada." },
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

  const errorMessage = "skippedReason" in result ? result.skippedReason : result.error;
  await prisma.marketingEventOutbox.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      lastError: (errorMessage ?? "Error desconocido").slice(0, 500),
    },
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
export async function processMarketingEventOutboxBatch(): Promise<MarketingOutboxBatchSummary> {
  const staleCutoff = new Date(
    Date.now() - MARKETING_PROCESSING_STALE_AFTER_MINUTES * 60 * 1000,
  );

  const candidates = await prisma.marketingEventOutbox.findMany({
    where: {
      attemptCount: { lt: MAX_MARKETING_OUTBOX_ATTEMPTS },
      OR: [
        { status: "PENDING" },
        { status: "FAILED" },
        { status: "PROCESSING", lastAttemptAt: { lt: staleCutoff } },
      ],
    },
    select: { id: true },
  });

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

  return summary;
}
