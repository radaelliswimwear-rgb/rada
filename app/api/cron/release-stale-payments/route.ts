import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "lib/prisma";
import { releaseReservedStock } from "lib/checkout/server-order-totals";
import { areWritesPaused } from "lib/system/write-pause";
import { verifyAndApplyPendingWompiPaymentAction } from "lib/payments/payments-actions";
import { parsePendingOrderInput } from "lib/checkout/pending-order";
import { createOrderAction } from "lib/orders/orders-actions";

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
// CORRECCIÓN (revisión posterior, checkout alojado de Wompi): antes esto
// cancelaba y liberaba stock SOLO por tiempo transcurrido, sin volver a
// preguntarle nada a Wompi. Con el checkout alojado (la clienta sale del
// sitio hacia checkout.wompi.co), "sigue PENDING después de 30 minutos" ya
// NO significa lo mismo que antes: puede ser un carrito genuinamente
// abandonado (nunca llegó a pagar), pero también puede ser un pago
// realmente APROBADO cuyo webhook se perdió y cuya clienta nunca volvió a
// la página de retorno (cerró la pestaña, se quedó sin red, volvió en otro
// dispositivo). Cancelar ese segundo caso solo por el reloj significaría
// dejar un cobro real sin ningún pedido creado.
//
// La corrección NO inventa ningún endpoint nuevo ni ninguna garantía de
// idempotencia del proveedor — usa exactamente el mismo contrato ya
// confirmado en el resto de este código (GET /transactions/{id}, vía
// verifyWompiTransaction) y la misma función ya auditada que aplica un
// estado real (applyWompiWebhookUpdateAction), ambas reusadas a través de
// verifyAndApplyPendingWompiPaymentAction (lib/payments/payments-actions.ts).
// Lo que sí exige ese contrato es el ID REAL de la transacción de Wompi, no
// nuestra propia referencia — no existe ningún contrato confirmado para
// buscar una transacción de Wompi a partir de la referencia sola (ver el
// comentario junto a verifyWompiTransaction en
// lib/payments/providers/wompi-gateway.ts). Por eso este barrido se separa
// en dos caminos:
//
//   1. Payment.wompiTransactionId CONOCIDO (se guardó la primera vez que
//      llegó cualquier evento de Wompi para ese pago, sea por webhook o por
//      el regreso del navegador, pero el pago se quedó PENDING después) —
//      se vuelve a preguntar el estado real. Si está APROBADO, se
//      "recupera" el pedido leyendo Payment.pendingOrderInput (el snapshot
//      server-side de dirección/ítems que se guarda al iniciar el pago,
//      justamente para este caso) y llamando a createOrderAction — la MISMA
//      función que crea un pedido cuando la clienta sí vuelve, ahora hecha
//      idempotente y segura ante llamadas concurrentes (ver
//      lib/orders/orders-actions.ts): si la clienta vuelve al mismo tiempo
//      que corre este cron, las dos llamadas terminan devolviendo el mismo
//      pedido, nunca dos. Si sigue realmente PENDING del lado de Wompi, no
//      se toca — no hay motivo para cancelar algo que Wompi mismo todavía
//      no resolvió. Si está rechazado/anulado, applyWompiWebhookUpdateAction
//      ya se encarga de liberar el stock.
//   2. Payment.wompiTransactionId DESCONOCIDO (nunca llegó ningún evento de
//      Wompi para este pago — ni webhook ni regreso del navegador) — acá NO
//      hay ninguna forma confirmada de preguntarle nada a Wompi. Es
//      indistinguible, con la información disponible, entre "la clienta
//      nunca llegó a pagar" (el caso común: cerró la pestaña antes de
//      completar el Checkout Web, nunca se creó ninguna transacción del
//      lado de Wompi) y "pagó pero se perdió hasta el primer evento" (mucho
//      más raro). Sin inventar un endpoint de búsqueda por referencia que
//      no existe, la única opción honesta es conservar el comportamiento
//      anterior — cancelar por tiempo transcurrido — para este caso
//      puntual, dejando un registro explícito de que se hizo SIN poder
//      verificar, para que sea auditable si alguna clienta reclama un cobro.
//
// Fallos de red al verificar (punto 1) no cancelan nada: si
// verifyAndApplyPendingWompiPaymentAction no pudo completarse, el pago se
// deja como está y el próximo corrido del cron lo vuelve a intentar —
// cancelar solo porque la verificación en sí falló repetiría exactamente el
// error que se está corrigiendo acá.
const STALE_AFTER_MINUTES = 30;

type RunSummary = {
  checked: number;
  verifiedAndRecovered: number;
  verifiedAndAlreadyHadOrder: number;
  verifiedAndRejected: number;
  verifiedAndStillPending: number;
  verifiedButOrderNotRecoverable: number;
  verificationFailed: number;
  cancelledWithoutVerification: number;
};

async function recoverOrderForApprovedPayment(paymentId: string): Promise<
  "recovered" | "already-had-order" | "not-recoverable"
> {
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
    // inventa una dirección de envío. Queda como PENDING con el stock
    // reservado, a la espera de una revisión manual (el log de abajo es la
    // señal para encontrarlo).
    console.error(
      "release-stale-payments: pago aprobado sin pendingOrderInput recuperable — requiere revisión manual",
      { paymentId, providerRef: payment.providerRef },
    );
    return "not-recoverable";
  }

  try {
    await createOrderAction({
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
    // detalle y sigue como PENDING para revisión manual, sin cancelarlo.
    console.error(
      "release-stale-payments: no se pudo recuperar el pedido de un pago aprobado",
      { paymentId, providerRef: payment.providerRef, error },
    );
    return "not-recoverable";
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (areWritesPaused()) {
    console.error("Cron release-stale-payments: escrituras pausadas, corrida omitida.");
    return NextResponse.json({ skipped: true, reason: "Escrituras pausadas temporalmente" });
  }

  const staleBefore = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000);
  const stalePayments = await prisma.payment.findMany({
    where: {
      provider: "WOMPI",
      status: "PENDING",
      stockReleased: false,
      createdAt: { lt: staleBefore },
    },
    select: { id: true, wompiTransactionId: true },
  });

  const summary: RunSummary = {
    checked: stalePayments.length,
    verifiedAndRecovered: 0,
    verifiedAndAlreadyHadOrder: 0,
    verifiedAndRejected: 0,
    verifiedAndStillPending: 0,
    verifiedButOrderNotRecoverable: 0,
    verificationFailed: 0,
    cancelledWithoutVerification: 0,
  };

  for (const payment of stalePayments) {
    if (!payment.wompiTransactionId) {
      // Camino 2: nunca llegó ningún evento de Wompi para este pago — sin
      // id real de transacción no hay forma confirmada de preguntarle nada.
      // Se conserva el comportamiento anterior, explícitamente marcado como
      // "sin verificar" para que quede auditable.
      await releaseReservedStock(payment.id);
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "CANCELLED",
          failureReason:
            "Reserva expirada sin ningún evento de Wompi recibido (no se pudo verificar: no hay id de transacción conocido).",
        },
      });
      summary.cancelledWithoutVerification++;
      continue;
    }

    // Camino 1: sí hay un id real de transacción — volvemos a preguntar.
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
      const outcome = await recoverOrderForApprovedPayment(payment.id);
      if (outcome === "recovered") summary.verifiedAndRecovered++;
      else if (outcome === "already-had-order")
        summary.verifiedAndAlreadyHadOrder++;
      else summary.verifiedButOrderNotRecoverable++;
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
