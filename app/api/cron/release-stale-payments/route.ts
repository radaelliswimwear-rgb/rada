import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "lib/prisma";
import { areWritesPaused } from "lib/system/write-pause";
import { verifyAndApplyPendingWompiPaymentAction } from "lib/payments/payments-actions";
import {
  finalizeApprovedPayment,
  type FinalizeApprovedPaymentOutcome,
} from "lib/orders/order-recovery";
import { cancelAbandonedPaymentAndReleaseStock } from "lib/checkout/server-order-totals";

// Cron de Vercel (ver vercel.json) — auditoría de seguridad, Sprint 29:
// el stock se reserva atómicamente al crear el intent de pago (ver
// lib/checkout/server-order-totals.ts), y se libera cuando el pago falla,
// se cancela o un webhook lo resuelve. Pero si la clienta simplemente cierra
// la pestaña a mitad de pagar con tarjeta, ninguno de esos tres caminos se
// dispara — el stock quedaría reservado (bloqueado para otras compradoras)
// indefinidamente. Este barrido libera reservas de pagos con tarjeta que
// siguen PENDING después de un tiempo prudente; nunca toca pagos por
// WhatsApp (quedan PENDING a propósito hasta que la fundadora los coordina
// y confirma a mano desde el panel).
//
// CORRECCIÓN (checkout alojado de Wompi): antes esto cancelaba y liberaba
// stock SOLO por tiempo transcurrido, sin volver a preguntarle nada a
// Wompi. Con el checkout alojado (la clienta sale del sitio hacia
// checkout.wompi.co), "sigue PENDING después de 30 minutos" ya NO
// significa lo mismo que antes: puede ser un carrito genuinamente
// abandonado, pero también puede ser un pago realmente APROBADO cuyo
// webhook se perdió y cuya clienta nunca volvió a la página de retorno.
//
// CORRECCIÓN (revisión posterior — dos hallazgos reales):
//
//  (A) [SUPERADA por el P0 de sep. 2026, ver más abajo] La primera versión
//      de esta corrección todavía cancelaba y liberaba stock cuando NO se
//      conocía el id real de la transacción de Wompi
//      (Payment.wompiTransactionId). Una segunda versión, para evitar
//      cancelar a ciegas un pago que en realidad sí se hubiera aprobado con
//      un webhook perdido, dejó de cancelar y liberar del todo: solo
//      marcaba Payment.flaggedForReviewAt y dejaba el stock reservado
//      indefinidamente. Eso resultó ser el problema real (auditoría P0,
//      sep. 2026): sin ninguna pantalla de admin que actuara sobre ese
//      campo, el stock de un carrito genuinamente abandonado -- el caso
//      más común, con enorme diferencia -- quedaba bloqueado para siempre,
//      afectando a clientas reales.
//
//      Solución P0: sin wompiTransactionId conocido, después del mismo TTL
//      de 30 minutos, el pago SÍ se cancela y su stock SÍ se libera
//      automáticamente (cancelAbandonedPaymentAndReleaseStock, lib/checkout/
//      server-order-totals.ts) -- ya no hace falta ninguna intervención
//      manual para el caso común. El riesgo que la segunda versión quería
//      evitar (un webhook tardío pero real, llegando después de cancelar)
//      se resuelve en dos capas:
//        1. `expiration-time` ya le pide a Wompi que rechace cualquier
//           intento de pago sobre ese link pasado el mismo TTL de 30
//           minutos (ver HOSTED_CHECKOUT_TTL_MINUTES en
//           lib/payments/payments-actions.ts) -- reduce mucho la ventana
//           real de "aprobado después de cancelado".
//        2. Para la ventana residual que sí puede pasar (la clienta
//           alcanzó a someter el pago en los últimos segundos antes del
//           TTL y la confirmación de Wompi demora más que eso):
//           finalizeApprovedPayment SIEMPRE intenta reclamar el stock
//           atómicamente antes de crear cualquier pedido
//           (reclaimReleasedStockForLateApproval) -- si el stock ya no
//           está disponible (se vendió a otra clienta mientras tanto),
//           NUNCA se inventa un pedido: el pago queda marcado para
//           revisión humana (reembolso o reposición), nunca en un limbo
//           invisible.
//
//  (B) Antes solo se buscaban pagos PENDING. Pero un pago puede llegar a
//      SUCCEEDED (por el webhook o por el regreso de la clienta) y quedarse
//      SIN pedido si createOrderAction/recoverOrderForApprovedPayment falla
//      después de aprobarse el pago (p. ej. un producto que se borró, un
//      error transitorio de base) — o si el webhook confirmó el pago pero
//      la clienta nunca volvió a la página de retorno. Ahora el barrido
//      también busca pagos SUCCEEDED sin orderId, para poder reintentar la
//      recuperación en otra corrida.
//
// La recuperación de pedido pasa por finalizeApprovedPayment
// (lib/orders/order-recovery.ts) — la MISMA función única que usan ahora
// el webhook y el regreso real de la clienta (Sprint de finalización
// unificada): resuelve la identidad de la compradora desde
// Payment.originalUserId — capturado al iniciar el checkout, nunca desde
// una sesión que este cron no tiene — y crea el pedido reusando
// createOrderForPayment (lib/orders/order-creation-core.ts), la misma
// lógica atómica e idempotente que las otras dos vías: si compiten por el
// mismo pago, solo una gana y todas terminan devolviendo/registrando el
// mismo pedido, nunca dos.
//
// Nada de esto inventa un endpoint nuevo ni una garantía de idempotencia
// del proveedor: usa exactamente el mismo contrato ya confirmado en el
// resto de este código (GET /transactions/{id}, vía verifyWompiTransaction)
// y la misma función ya auditada que aplica un estado real
// (applyWompiWebhookUpdateAction), ambas reusadas a través de
// verifyAndApplyPendingWompiPaymentAction.
//
// Fallos de red al verificar no cancelan nada: si
// verifyAndApplyPendingWompiPaymentAction no pudo completarse, el pago se
// deja como está y el próximo corrido del cron lo vuelve a intentar.
const STALE_AFTER_MINUTES = 30;

type RunSummary = {
  checked: number;
  recovered: number;
  alreadyHadOrder: number;
  notRecoverable: number;
  verifiedAndRejected: number;
  verifiedAndStillPending: number;
  verificationFailed: number;
  // P0 (sep. 2026): ya NO cuenta pagos abandonados sin wompiTransactionId
  // (esos ahora se resuelven solos, ver cancelledAbandoned) -- cuenta
  // exclusivamente el caso "late approval, stock ya no disponible"
  // (finalizeApprovedPayment devolviendo "stock-unavailable"), el único que
  // todavía necesita una persona.
  flaggedForManualReview: number;
  // P0 (sep. 2026): pagos PENDING sin wompiTransactionId conocido, vencidos
  // por TTL, cancelados y con su stock liberado automáticamente en esta
  // corrida -- el caso que antes quedaba flaggedForManualReview para
  // siempre.
  cancelledAbandoned: number;
};

function recordFinalizeOutcome(
  summary: RunSummary,
  outcome: FinalizeApprovedPaymentOutcome,
): void {
  if (outcome === "created") summary.recovered++;
  else if (outcome === "existing") summary.alreadyHadOrder++;
  // P0 (sep. 2026): late approval con stock ya no disponible -- pago real,
  // sin pedido, marcado para revisión humana (nunca un pedido fantasma).
  else if (outcome === "stock-unavailable") summary.flaggedForManualReview++;
  // "not-recoverable" (anomalía real) y "not-approved" (no debería poder
  // pasar acá: este cron solo llama a finalizeApprovedPayment cuando ya
  // confirmó status === "SUCCEEDED") comparten el mismo contador — un
  // "not-approved" inesperado se vería igual que siempre se vio, en vez de
  // silenciarse.
  else summary.notRecoverable++;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (areWritesPaused()) {
    console.error(
      "Cron release-stale-payments: escrituras pausadas, corrida omitida.",
    );
    return NextResponse.json({
      skipped: true,
      reason: "Escrituras pausadas temporalmente",
    });
  }

  const staleBefore = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000);
  const candidates = await prisma.payment.findMany({
    where: {
      provider: "WOMPI",
      createdAt: { lt: staleBefore },
      OR: [
        { status: "PENDING", stockReleased: false },
        { status: "SUCCEEDED", orderId: null },
      ],
    },
    select: { id: true, status: true, wompiTransactionId: true },
  });

  const summary: RunSummary = {
    checked: candidates.length,
    recovered: 0,
    alreadyHadOrder: 0,
    notRecoverable: 0,
    verifiedAndRejected: 0,
    verifiedAndStillPending: 0,
    verificationFailed: 0,
    flaggedForManualReview: 0,
    cancelledAbandoned: 0,
  };

  for (const payment of candidates) {
    // (B) Ya está aprobado, solo falta el pedido — no hace falta volver a
    // preguntarle nada a Wompi, ya lo confirmó un evento real anterior.
    if (payment.status === "SUCCEEDED") {
      const outcome = await finalizeApprovedPayment(payment.id, "cron");
      recordFinalizeOutcome(summary, outcome);
      continue;
    }

    // A partir de acá, payment.status === "PENDING".
    if (!payment.wompiTransactionId) {
      // (A) [P0, sep. 2026] Nunca llegó ningún evento de Wompi para este
      // pago — sin id real de transacción no hay forma confirmada de
      // preguntarle nada MÁS, pero ya pasó el mismo TTL que el propio link
      // de checkout le pidió a Wompi que respetara (expiration-time, ver
      // HOSTED_CHECKOUT_TTL_MINUTES). Se cancela y se libera el stock
      // reservado, atómicamente y en un único paso (ver el comentario
      // largo junto a cancelAbandonedPaymentAndReleaseStock): si un
      // webhook tardío pero real llega justo en el medio, el lock de fila
      // de Postgres decide de forma determinista quién pasa primero, y
      // reclaimReleasedStockForLateApproval (dentro de
      // finalizeApprovedPayment) es la red de seguridad que nunca deja
      // crear un pedido con stock que ya no existe.
      const result = await cancelAbandonedPaymentAndReleaseStock(
        payment.id,
        "Abandonado: nunca se recibió ningún evento de Wompi antes de vencer el checkout (TTL).",
      );
      if (result === "cancelled") summary.cancelledAbandoned++;
      // "not-pending": perdimos la carrera contra un webhook/return que
      // resolvió este pago un instante antes (o ya lo había cancelado otra
      // corrida) — no hace falta contarlo aparte, ese pago ya quedó
      // reflejado por la vía que sí ganó.
      continue;
    }

    const verified = await verifyAndApplyPendingWompiPaymentAction(
      payment.wompiTransactionId,
    );
    if (!verified.ok) {
      // Fallo de red/Wompi al verificar: no se cancela nada por un problema
      // transitorio de esta corrida — el próximo cron lo reintenta.
      summary.verificationFailed++;
      continue;
    }

    const fresh = await prisma.payment.findUnique({
      where: { id: payment.id },
      select: { status: true },
    });

    if (fresh?.status === "SUCCEEDED") {
      const outcome = await finalizeApprovedPayment(payment.id, "cron");
      recordFinalizeOutcome(summary, outcome);
    } else if (fresh?.status === "PENDING") {
      // Wompi mismo todavía no lo resolvió — no hay motivo para cancelar
      // algo que el proveedor no dio por terminado. Se revisa de nuevo en
      // la próxima corrida.
      summary.verifiedAndStillPending++;
    } else {
      // FAILED/CANCELLED/REFUNDED: applyWompiWebhookUpdateAction (dentro de
      // verifyAndApplyPendingWompiPaymentAction) ya liberó el stock y
      // actualizó el estado — nada más que hacer acá.
      summary.verifiedAndRejected++;
    }
  }

  return NextResponse.json(summary);
}
