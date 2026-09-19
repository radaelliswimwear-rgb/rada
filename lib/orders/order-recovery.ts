import { prisma } from "lib/prisma";
import { GUEST_USER_ID } from "lib/checkout/types";
import { parsePendingOrderInput } from "lib/checkout/pending-order";
import { createOrderForPayment } from "./order-creation-core";
import { reclaimReleasedStockForLateApproval } from "lib/checkout/server-order-totals";
import { logEvent } from "lib/observability/log";

// PROPUESTA (checkout-wompi-alojado-y-seguridad-pagos) — recuperación de
// pedidos para pagos APROBADOS de los que nunca se llegó a crear un pedido
// (la clienta cerró la pestaña antes de que su propio navegador terminara
// de llamar a createOrderAction, o el webhook llegó pero el regreso al
// sitio nunca pasó). Usado SOLO por el cron de pagos vencidos
// (app/api/cron/release-stale-payments/route.ts).
//
// Este archivo NO tiene "use server" a propósito, igual que
// order-creation-core.ts: si esta función viviera en un archivo "use
// server", quedaría expuesta como Server Action invocable por RPC desde
// cualquier navegador, aunque ningún componente la use. recoverOrderForApprovedPayment
// toma SOLO un `paymentId` — no acepta ningún userId de quien llama, así
// que es estructuralmente imposible pedirle que arme un pedido a nombre de
// otra persona. La identidad se resuelve leyendo Payment.originalUserId:
// capturado UNA SOLA VEZ, del lado servidor, en el momento real en que se
// inició el checkout (ver startWompiHostedCheckoutAction, lib/payments/
// payments-actions.ts, que lee getCurrentUser() dentro de ese mismo
// request) — nunca de una sesión (un cron no tiene ninguna) ni de un
// parámetro que alguien pudiera manipular.
export type RecoverOrderOutcome =
  | "recovered"
  | "already-had-order"
  | "not-recoverable";

export async function recoverOrderForApprovedPayment(
  paymentId: string,
): Promise<RecoverOrderOutcome> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) return "not-recoverable";
  if (payment.orderId) return "already-had-order";

  const pendingOrder = parsePendingOrderInput(payment.pendingOrderInput);
  if (!pendingOrder) {
    // Anomalía real: un pago APROBADO del que no se puede reconstruir el
    // pedido (el snapshot nunca se guardó — pagos de antes de esta
    // corrección — o quedó corrupto). No hay nada seguro que hacer acá de
    // forma automática: NO se cancela un pago aprobado, y tampoco se
    // inventa una dirección de envío. Queda como SUCCEEDED sin pedido, con
    // el stock ya reservado, a la espera de una revisión manual (el log de
    // abajo es la señal para encontrarlo).
    console.error(
      "recoverOrderForApprovedPayment: pago aprobado sin pendingOrderInput recuperable — requiere revisión manual",
      { paymentId, providerRef: payment.providerRef },
    );
    return "not-recoverable";
  }

  // Identidad original, nunca la sesión de quien ejecuta esto (un cron no
  // tiene ninguna) ni un valor que alguien pudiera mandar — null es una
  // compra de invitada legítima, no un error.
  const userId = payment.originalUserId ?? GUEST_USER_ID;

  try {
    await createOrderForPayment(userId, {
      items: pendingOrder.items,
      shippingAddress: pendingOrder.shippingAddress,
      shippingMethod: pendingOrder.shippingMethod,
      payment: {
        provider: "wompi",
        transactionId: payment.providerRef,
        last4: payment.cardLast4 ?? "",
      },
    });
    return "recovered";
  } catch (error) {
    // No dejar que un pago con un problema puntual (p. ej. un producto que
    // se borró después) tumbe el resto de la corrida — se loguea con
    // detalle y sigue como SUCCEEDED sin pedido, para revisión manual, sin
    // cancelarlo ni liberar el stock.
    console.error(
      "recoverOrderForApprovedPayment: no se pudo recuperar el pedido de un pago aprobado",
      { paymentId, providerRef: payment.providerRef, error },
    );
    return "not-recoverable";
  }
}

// PROPUESTA (mejora arquitectónica post-E2E real con webhook) — punto de
// entrada ÚNICO para "terminar" un pago aprobado, compartido por las tres
// vías que hoy pueden aprenderlo: el webhook de Wompi, el regreso real de
// la clienta y el cron de pagos vencidos. Antes cada una decidía por su
// cuenta, con variantes ligeramente distintas, cuándo llamar a
// recoverOrderForApprovedPayment (el return exigía status === "SUCCEEDED"
// a mano; el webhook no la llamaba en absoluto). No duplica nada del
// reclamo atómico real (sigue intacto en createOrderForPayment) ni de la
// recuperación (recoverOrderForApprovedPayment, sin cambios) — solo
// centraliza el gateo: ¿corresponde intentar crear el pedido de este pago
// ahora mismo?
//
// "not-approved" existe como resultado propio (distinto de
// "not-recoverable") a propósito: la mayoría de los eventos de Wompi que
// pasan por acá vía el webhook son PENDING intermedios, DECLINED o VOIDED
// -- ninguno debe generar un pedido, y ninguno es una anomalía que amerite
// el console.error de "revisión manual" que sí dispara un verdadero fallo
// de recuperación.
export type FinalizeApprovedPaymentOutcome =
  | "created"
  | "existing"
  | "not-approved"
  | "not-recoverable"
  // P0 (corrección de leak de inventario, sep. 2026): el pago SÍ se aprobó
  // en Wompi (cobro real), pero su stock ya se había liberado por abandono
  // (ver cancelAbandonedPaymentAndReleaseStock) y, al intentar
  // reclamarlo de vuelta atómicamente, ya no había unidades suficientes --
  // se vendieron a alguien más mientras tanto. NUNCA se crea un pedido acá:
  // el pago queda marcado (flaggedForReviewAt/flaggedForReviewReason) para
  // que alguien decida a mano (reembolso o reposición). Distinto de
  // "not-recoverable" a propósito -- esa es una anomalía de datos
  // (snapshot corrupto/ausente), esta es un conflicto real de inventario.
  | "stock-unavailable";

export async function finalizeApprovedPayment(
  paymentId: string,
  source: "webhook" | "return" | "cron",
): Promise<FinalizeApprovedPaymentOutcome> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

  let outcome: FinalizeApprovedPaymentOutcome;
  if (!payment) {
    outcome = "not-recoverable";
  } else if (payment.orderId) {
    outcome = "existing";
  } else if (payment.status !== "SUCCEEDED") {
    outcome = "not-approved";
  } else {
    // Red de seguridad "late approval" (ver el comentario largo junto a
    // reclaimReleasedStockForLateApproval): SIEMPRE se intenta reclamar
    // ANTES de crear ningún pedido, nunca solo cuando se sabe que hubo un
    // abandono previo -- el caso normal (stock nunca liberado) sale de
    // "held" al instante, sin tocar nada, así que no cuesta nada en el
    // camino feliz.
    const reclaim = await reclaimReleasedStockForLateApproval(paymentId);
    if (reclaim === "reclaimed") {
      // Red de seguridad "late approval" que sí funcionó: el stock se había
      // liberado por abandono pero todavía había unidades para re-reservarlo
      // atómicamente -- no es un error, pero sí vale la pena que quede
      // registrado (section 3 del proceso de observabilidad lo pide
      // explícitamente como evento propio, distinto del caso normal "held").
      await logEvent({
        event: "payment.stock_reclaimed_late_approval",
        severity: "warn",
        paymentId,
        outcome: reclaim,
        reason:
          "Pago aprobado después de liberarse su stock por abandono -- re-reservado con éxito",
      });
    }
    if (reclaim === "unavailable" || reclaim === "unknown-items") {
      const flaggedForReviewReason =
        reclaim === "unavailable"
          ? "APPROVED_LATE_STOCK_UNAVAILABLE"
          : "APPROVED_LATE_MISSING_RESERVED_ITEMS";
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          flaggedForReviewAt: new Date(),
          flaggedForReviewReason,
        },
      });
      // Alerta más importante de todo el sistema de pagos: una clienta SÍ
      // pagó de verdad y el pedido NO se pudo crear automáticamente --
      // necesita revisión humana (reembolso o reposición) antes de que
      // alguien se entere por su cuenta. dedupeKey por paymentId: cada pago
      // marcado alerta siempre, pero no se repite el correo si algo
      // reintenta finalizeApprovedPayment para el MISMO pago dentro de la
      // ventana de cooldown (el webhook y el cron pueden competir por el
      // mismo pago).
      await logEvent({
        event: "payment.flagged_for_review",
        severity: "critical",
        paymentId,
        outcome: reclaim,
        reason: flaggedForReviewReason,
        dedupeKey: `payment:${paymentId}:flagged`,
        alert: true,
      });
      outcome = "stock-unavailable";
    } else {
      const recovered = await recoverOrderForApprovedPayment(paymentId);
      outcome =
        recovered === "recovered"
          ? "created"
          : recovered === "already-had-order"
            ? "existing"
            : "not-recoverable";
    }
  }

  // Observabilidad mínima (Sprint de finalización unificada): qué vía
  // terminó o intentó terminar cada pago y con qué resultado. Nunca se
  // registra nada de la clienta (email, dirección, tarjeta) ni ningún
  // secreto -- solo el id interno del pago, que no es información
  // sensible por sí sola.
  console.log("finalizeApprovedPayment", { source, paymentId, outcome });

  if (outcome === "not-recoverable") {
    // Anomalía real (payment.SUCCEEDED sin forma de reconstruir el pedido,
    // o un error inesperado al intentarlo -- ver recoverOrderForApprovedPayment
    // arriba, que ya deja el detalle completo en su propio console.error) --
    // nunca debería quedar sin que alguien lo note.
    await logEvent({
      event: "payment.finalize_not_recoverable",
      severity: "error",
      paymentId,
      outcome,
      reason: `source=${source} -- pago aprobado sin pedido recuperable, requiere revisión manual`,
      dedupeKey: `payment:${paymentId}:not_recoverable`,
      alert: true,
    });
  } else {
    await logEvent({
      event: "payment.finalize_outcome",
      severity: "info",
      paymentId,
      outcome,
      reason: `source=${source}`,
    });
  }

  return outcome;
}
