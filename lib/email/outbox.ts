import { createHash } from "node:crypto";
import type { Prisma, EmailOutboxType } from "@prisma/client";
import { prisma } from "lib/prisma";
import { getAdminNotificationEmails } from "./admin-recipients";
import { sendEmail } from "./send";
import {
  adminNewOrderEmail,
  customerOrderConfirmationEmail,
} from "./templates";
import { ORDER_INCLUDE, toOrder } from "lib/orders/order-mapping";
import { logEvent } from "lib/observability/log";

// PROPUESTA (Sprint de confiabilidad de emails — transactional outbox,
// post-E2E real #1010/#1011) — antes, un pedido creado con éxito llamaba
// directo a notifyAdminsOfNewOrder/notifyCustomerOfNewOrder
// (lib/email/order-notifications.ts): si Resend fallaba en ese instante
// puntual, el correo se perdía para siempre, sin ningún registro de que
// debía enviarse. Ese hueco quedó confirmado manualmente en el incidente
// del pedido #1009.
//
// Este módulo reemplaza ese envío directo por un outbox persistente
// (modelo EmailOutbox, prisma/schema.prisma): una fila por destinatario,
// creada ATÓMICAMENTE junto con el Order (ver createEmailOutboxJobsForOrder,
// llamada desde createOrderForPayment dentro de la misma transacción), y
// procesada por una única función (sendOutboxJob) reusada tanto para el
// intento inmediato de después del commit como para los reintentos
// posteriores — sea cual sea el mecanismo externo que dispare esos
// reintentos (ver processEmailOutboxBatch, deliberadamente sin ninguna
// dependencia de Vercel u otro hosting).
//
// NO cambia diseño/copy/asunto de los emails: reusa tal cual
// adminNewOrderEmail/customerOrderConfirmationEmail (lib/email/templates.ts)
// y sendEmail (lib/email/send.ts).

// Tope de reintentos automáticos antes de dejar de intentar un job en el
// barrido periódico — cinco intentos cubren una caída transitoria de Resend
// de varias horas (con un scheduler corriendo cada 15-60 min, frecuencia
// que decide quien la dispare, ver la ruta HTTP) sin reintentar
// indefinidamente algo con un problema real (destinatario inválido,
// configuración rota). Reintentar manualmente más allá de este tope sigue
// siendo posible llamando sendOutboxJob directo con el id del job.
export const MAX_EMAIL_OUTBOX_ATTEMPTS = 5;

// Un job que quedó "PROCESSING" por más de este tiempo se considera
// abandonado (el worker que lo reclamó murió o perdió conexión antes de
// terminar) y vuelve a quedar disponible para reclamarse — mismo criterio
// de "abandonado tras N minutos" que ya usa STALE_AFTER_MINUTES en
// app/api/cron/release-stale-payments/route.ts, aplicado acá a jobs de
// email en vez de a pagos.
export const PROCESSING_STALE_AFTER_MINUTES = 10;

function normalizeRecipient(recipient: string): string {
  return recipient.trim().toLowerCase();
}

// Idempotencia hacia Resend (Idempotency-Key header — documentado por
// Resend: hasta 256 caracteres, sin restricción de charset explícita más
// allá de "único por request", ventana de retención de 24 horas). Nunca
// incluye el email en texto plano: solo un hash SHA-256 determinístico de
// la versión normalizada, para que la clave en sí no sea PII legible. Se
// calcula UNA sola vez al crear el job (ver createEmailOutboxJobsForOrder)
// y se persiste — sendOutboxJob nunca la recalcula, ni siquiera en un
// retry, porque eso es justamente lo que le permite a Resend reconocer que
// dos intentos son "el mismo envío".
export function computeIdempotencyKey(
  orderId: string,
  type: EmailOutboxType,
  recipientNormalized: string,
): string {
  const recipientHash = createHash("sha256")
    .update(recipientNormalized)
    .digest("hex");
  return `order:${orderId}:${type.toLowerCase()}:${recipientHash}`;
}

type OutboxRecipientJob = { type: EmailOutboxType; recipient: string };

// Llamada DENTRO de la misma transacción de Prisma que crea el Order (ver
// createOrderForPayment, lib/orders/order-creation-core.ts) — si esa
// transacción revierte (perdedora del reclamo atómico de Payment.orderId),
// estas filas desaparecen con ella, nunca quedan huérfanas. Los
// destinatarios admin salen SIEMPRE de getAdminNotificationEmails() (única
// fuente de verdad ya existente, lib/email/admin-recipients.ts) — nunca se
// hardcodea ninguna dirección acá, y la cantidad de jobs admin es la que
// sea que esa función devuelva hoy (2 direcciones actualmente, pero el
// código no asume ese número).
export async function createEmailOutboxJobsForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  customerEmail: string,
  freeShippingThreshold: number,
): Promise<{ id: string }[]> {
  const jobs: OutboxRecipientJob[] = [
    ...getAdminNotificationEmails().map(
      (recipient): OutboxRecipientJob => ({
        type: "ADMIN_NEW_ORDER",
        recipient,
      }),
    ),
    { type: "CUSTOMER_ORDER_CONFIRMATION", recipient: customerEmail },
  ];

  const created: { id: string }[] = [];
  for (const job of jobs) {
    const recipientNormalized = normalizeRecipient(job.recipient);
    const row = await tx.emailOutbox.create({
      data: {
        orderId,
        type: job.type,
        recipient: job.recipient,
        recipientNormalized,
        idempotencyKey: computeIdempotencyKey(
          orderId,
          job.type,
          recipientNormalized,
        ),
        // Antes solo se guardaba para ADMIN_NEW_ORDER -- ahora
        // customerOrderConfirmationEmail también muestra el estado de envío,
        // así que ambos tipos necesitan el mismo snapshot (ver
        // lib/email/templates.ts). Un cambio futuro del umbral en
        // /admin/configuracion nunca debe alterar un correo ya enviado.
        freeShippingThresholdSnapshot: freeShippingThreshold,
      },
      select: { id: true },
    });
    created.push(row);
  }
  return created;
}

export type SendOutboxJobResult = "sent" | "failed" | "skipped";

// Punto de entrada ÚNICO para intentar enviar un job — reusado tanto por el
// intento inmediato de después de crear el Order como por
// processEmailOutboxBatch (retries). Reclamo atómico real a nivel de fila
// de Postgres (no "leer y después actualizar"): el mismo updateMany
// condicional cubre los tres casos elegibles (PENDING, FAILED, o
// PROCESSING abandonado hace más de PROCESSING_STALE_AFTER_MINUTES) en una
// sola operación — si dos workers compiten por el mismo job, solo uno
// obtiene count 1, el otro count 0 y no intenta nada.
export async function sendOutboxJob(
  jobId: string,
): Promise<SendOutboxJobResult> {
  const staleCutoff = new Date(
    Date.now() - PROCESSING_STALE_AFTER_MINUTES * 60 * 1000,
  );

  const claimed = await prisma.emailOutbox.updateMany({
    where: {
      id: jobId,
      attemptCount: { lt: MAX_EMAIL_OUTBOX_ATTEMPTS },
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

  if (claimed.count === 0) {
    // Ya lo tomó otro worker, ya está SENT, o agotó los reintentos
    // automáticos -- ninguno de esos casos debe intentar enviar nada acá.
    return "skipped";
  }

  const job = await prisma.emailOutbox.findUnique({ where: { id: jobId } });
  if (!job) return "skipped"; // No debería pasar: se acaba de reclamar.

  const orderRow = await prisma.order.findUnique({
    where: { id: job.orderId },
    include: ORDER_INCLUDE,
  });
  if (!orderRow) {
    await prisma.emailOutbox.update({
      where: { id: jobId },
      data: { status: "FAILED", lastError: "El pedido ya no existe." },
    });
    return "failed";
  }
  const order = toOrder(orderRow);

  const { subject, html } =
    job.type === "ADMIN_NEW_ORDER"
      ? adminNewOrderEmail(order, job.freeShippingThresholdSnapshot ?? 0)
      : customerOrderConfirmationEmail(
          order,
          job.freeShippingThresholdSnapshot ?? undefined,
        );

  const result = await sendEmail({
    to: job.recipient,
    subject,
    html,
    idempotencyKey: job.idempotencyKey,
  });

  // Observabilidad (nunca el email completo, nunca secrets, nunca el
  // payload/html) -- solo lo necesario para diagnosticar sin exponer PII
  // innecesaria en los logs.
  console.log("sendOutboxJob", {
    emailJobId: job.id,
    orderId: job.orderId,
    type: job.type,
    recipientCategory: job.type === "ADMIN_NEW_ORDER" ? "admin" : "customer",
    attempt: job.attemptCount,
    result: result.success ? "sent" : "failed",
  });

  if (result.success) {
    await prisma.emailOutbox.update({
      where: { id: jobId },
      data: { status: "SENT", sentAt: new Date() },
    });
    return "sent";
  }

  await prisma.emailOutbox.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      lastError: (result.error ?? "Error desconocido").slice(0, 500),
    },
  });

  const exhausted = job.attemptCount >= MAX_EMAIL_OUTBOX_ATTEMPTS;
  await logEvent({
    event: exhausted
      ? "email_outbox.retries_exhausted"
      : "email_outbox.send_failed",
    severity: exhausted ? "error" : "warn",
    orderId: job.orderId,
    outcome: job.type,
    reason: result.error ?? "Error desconocido",
    dedupeKey: exhausted ? `email_outbox:${job.id}` : undefined,
    alert: exhausted,
  });

  return "failed";
}

export type EmailOutboxBatchSummary = {
  checked: number;
  sent: number;
  failed: number;
  skipped: number;
};

// Lógica de negocio PORTABLE (Sprint de portabilidad de hosting): esta
// función no importa nada de next/server ni de ningún runtime específico —
// busca jobs elegibles y los procesa uno por uno con sendOutboxJob. El
// ÚNICO adaptador con conocimiento de "cómo me disparan" vive en
// app/api/cron/process-email-outbox/route.ts; esta función funciona igual
// si la llama esa ruta, un script de prueba, u otro mecanismo cualquiera.
export async function processEmailOutboxBatch(): Promise<EmailOutboxBatchSummary> {
  const startedAt = Date.now();
  const staleCutoff = new Date(
    Date.now() - PROCESSING_STALE_AFTER_MINUTES * 60 * 1000,
  );

  const candidates = await prisma.emailOutbox.findMany({
    where: {
      attemptCount: { lt: MAX_EMAIL_OUTBOX_ATTEMPTS },
      OR: [
        { status: "PENDING" },
        { status: "FAILED" },
        { status: "PROCESSING", lastAttemptAt: { lt: staleCutoff } },
      ],
    },
    select: { id: true },
  });

  const summary: EmailOutboxBatchSummary = {
    checked: candidates.length,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const candidate of candidates) {
    try {
      const result = await sendOutboxJob(candidate.id);
      if (result === "sent") summary.sent++;
      else if (result === "failed") summary.failed++;
      else summary.skipped++;
    } catch (error) {
      // Un fallo verdaderamente inesperado (p. ej. la propia DB caída justo
      // al marcar SENT, después de que Resend ya aceptó el envío -- ver el
      // escenario documentado en computeIdempotencyKey) no debe tumbar el
      // resto del batch: el job en cuestión sigue elegible (su estado en DB
      // no llegó a cambiar a SENT) y se reintentará solo, con la MISMA
      // idempotencyKey, en la próxima corrida.
      console.error(
        "processEmailOutboxBatch: fallo inesperado procesando un job, se reintentará en la próxima corrida",
        { emailJobId: candidate.id, error },
      );
      summary.failed++;
    }
  }

  await logEvent({
    event: "cron.email_outbox_summary",
    severity: summary.failed > 0 ? "warn" : "info",
    outcome: `checked=${summary.checked} sent=${summary.sent} failed=${summary.failed} skipped=${summary.skipped} durationMs=${Date.now() - startedAt}`,
  });

  return summary;
}
