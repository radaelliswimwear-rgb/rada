import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "lib/prisma";
import { areWritesPaused } from "lib/system/write-pause";
import { verifyAndApplyPendingWompiPaymentAction } from "lib/payments/payments-actions";
import {
  finalizeApprovedPayment,
  type FinalizeApprovedPaymentOutcome,
} from "lib/orders/order-recovery";

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
//  (A) La primera versión de esta corrección todavía cancelaba y liberaba
//      stock cuando NO se conocía el id real de la transacción de Wompi
//      (Payment.wompiTransactionId), conservando exactamente el riesgo que
//      se pedía eliminar: sin ese id no hay ningún contrato confirmado
//      para preguntarle nada a Wompi (no existe una búsqueda por nuestra
//      propia referencia, ver el comentario junto a verifyWompiTransaction
//      en lib/payments/providers/wompi-gateway.ts), así que cancelar acá
//      seguía siendo una decisión a ciegas. Ahora, sin id conocido, el pago
//      NUNCA se cancela ni se libera stock automáticamente: se marca con
//      Payment.flaggedForReviewAt para revisión manual y se deja como
//      estaba. Esto tiene un costo real y consciente: el stock de un
//      carrito genuinamente abandonado (el caso más común de este grupo)
//      queda reservado hasta que alguien lo revise a mano — se prefiere
//      ese costo antes que arriesgar cancelar un cobro real.
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
  flaggedForManualReview: number;
};

function recordFinalizeOutcome(
  summary: RunSummary,
  outcome: FinalizeApprovedPaymentOutcome,
): void {
  if (outcome === "created") summary.recovered++;
  else if (outcome === "existing") summary.alreadyHadOrder++;
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
      // (A) Nunca llegó ningún evento de Wompi para este pago — sin id real
      // de transacción no hay forma confirmada de preguntarle nada. NO se
      // cancela ni se libera stock: se marca para revisión manual.
      await prisma.payment.update({
        where: { id: payment.id },
        data: { flaggedForReviewAt: new Date() },
      });
      summary.flaggedForManualReview++;
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
