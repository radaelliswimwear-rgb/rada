import type { Payment } from "@prisma/client";
import {
  verifyWompiTransaction,
  type WompiTransaction,
} from "lib/payments/providers/wompi-gateway";
import { WOMPI_TRANSACTION_STATUS_TO_DB } from "lib/payments/payments-actions";

// Conciliación de pagos Wompi — DISEÑO PARCIAL, no una solución completa.
//
// PROBLEMA SIN RESOLVER, documentado a propósito en vez de disimulado: un
// pago que nunca recibió NINGÚN webhook (ni siquiera uno rechazado por
// pausa) no tiene guardado en ningún lado el id interno de la transacción
// en Wompi — Payment solo guarda `providerRef` (nuestra propia
// referencia). La función de este archivo SOLO puede reconciliar un pago
// del que ya se conoce ese id (típicamente porque la confirmación
// síncrona en checkout-content.tsx sí lo recibió, aunque el webhook
// posterior nunca haya llegado o haya sido rechazado por la pausa).
//
// Para el caso de un pago sin ningún id de Wompi conocido, hay dos
// caminos posibles, ninguno implementado acá:
//   (a) confirmar oficialmente si la API de Wompi permite buscar una
//       transacción por `reference` (se intentó documentar esto como un
//       endpoint más — GET /transactions/{reference} — pero no se pudo
//       confirmar contra una respuesta real de Wompi, así que se retiró
//       en vez de dejarlo como código ejecutable basado en una suposición);
//   (b) agregar un campo a Payment que guarde el id de Wompi apenas se
//       recibe en la confirmación síncrona — requiere una migración de
//       Prisma, que no corresponde hacer en esta entrega.
//
// Esta función tampoco resuelve "encontrar todos los pagos pendientes que
// hay que reconciliar" — eso depende de (a) o (b) de arriba. Lo que sí
// resuelve, con las verificaciones que pidió la dueña, es: dado un pago y
// un id de Wompi ya conocido, aplicar su estado real de forma segura.

export type ResultadoReconciliacion =
  | { resultado: "aplicado"; estado: Payment["status"] }
  | { resultado: "omitido"; motivo: string }
  | { resultado: "rechazado"; motivo: string }
  | { resultado: "error"; motivo: string };

type PaymentCandidato = Pick<
  Payment,
  "id" | "providerRef" | "currency" | "amount" | "provider" | "status"
>;

type ActualizacionPaymentPrisma = {
  payment: {
    updateMany: (args: {
      where: { id: string; status: Payment["status"] };
      data: { status: Payment["status"]; failureReason: string | null };
    }) => Promise<{ count: number }>;
  };
};

export type DecisionReconciliacion =
  | { accion: "aplicar"; estado: Payment["status"]; failureReason: string | null }
  | { accion: "rechazar"; motivo: string };

// Función PURA — sin I/O, sin base de datos, sin red — a propósito, para
// que las verificaciones se puedan probar exhaustivamente sin mocks de
// infraestructura. Verifica referencia exacta, moneda, importe e
// identidad del proveedor ANTES de decidir aplicar cualquier cosa — un
// error acá nunca debe poder tocar un pago distinto al candidato.
export function evaluarReconciliacionWompi(
  candidato: PaymentCandidato,
  transaccionEnVivo: WompiTransaction,
): DecisionReconciliacion {
  if (candidato.provider !== "WOMPI") {
    return { accion: "rechazar", motivo: "El pago candidato no es de Wompi." };
  }

  if (
    !transaccionEnVivo.reference ||
    transaccionEnVivo.reference !== candidato.providerRef
  ) {
    // "Referencia ajena": la transacción que Wompi devolvió no es la que
    // corresponde a este candidato — nunca se aplica en ese caso, pase lo
    // que pase con el resto de los campos.
    return {
      accion: "rechazar",
      motivo: "La referencia de la transacción de Wompi no coincide con el pago candidato.",
    };
  }

  if (transaccionEnVivo.currency !== candidato.currency) {
    return {
      accion: "rechazar",
      motivo: "La moneda de la transacción no coincide con el pago candidato.",
    };
  }

  const montoEsperadoEnCentavos = Math.round(candidato.amount * 100);
  if (transaccionEnVivo.amount_in_cents !== montoEsperadoEnCentavos) {
    return {
      accion: "rechazar",
      motivo: "El monto de la transacción no coincide con el pago candidato.",
    };
  }

  const estado = WOMPI_TRANSACTION_STATUS_TO_DB[transaccionEnVivo.status];
  if (!estado) {
    return {
      accion: "rechazar",
      motivo: `Estado de Wompi no reconocido: "${transaccionEnVivo.status}".`,
    };
  }

  return {
    accion: "aplicar",
    estado,
    failureReason: transaccionEnVivo.status_message ?? null,
  };
}

// Wrapper de I/O, deliberadamente delgado: consulta Wompi, delega la
// decisión a la función pura de arriba, y aplica con un UPDATE
// condicional atómico — nunca con una marca de tiempo inventada.
//
// Por qué no una marca de tiempo: una respuesta de Wompi leída ANTES de
// que llegue un webhook real puede terminar aplicándose DESPUÉS (por
// ejemplo, si la consulta a Wompi tarda) — usar Date.now() al aplicar
// haría que ese dato viejo parezca más nuevo que el webhook real y lo
// pisaría. En cambio, el UPDATE de abajo solo tiene efecto si el pago
// TODAVÍA está PENDING en el momento exacto de escribir — si un webhook
// concurrente ya lo resolvió mientras se consultaba a Wompi, la condición
// deja de matchear ninguna fila y no se pisa nada. Esto es una garantía
// más débil que "a prueba de toda carrera posible" — no se afirma eso:
// se prueban explícitamente los casos de la lista de abajo, ninguno más.
export async function reconciliarPagoWompiPorId(
  prisma: ActualizacionPaymentPrisma,
  candidato: PaymentCandidato,
  idTransaccionWompi: string,
  consultarTransaccionEnVivo: (id: string) => Promise<WompiTransaction> = verifyWompiTransaction,
): Promise<ResultadoReconciliacion> {
  if (candidato.status !== "PENDING") {
    return { resultado: "omitido", motivo: "El pago ya no está PENDING." };
  }

  let transaccionEnVivo: WompiTransaction;
  try {
    transaccionEnVivo = await consultarTransaccionEnVivo(idTransaccionWompi);
  } catch (error) {
    // Nunca se devuelve el mensaje crudo de la API hacia quien llama —
    // solo un motivo genérico. El detalle real (que podría incluir datos
    // de la respuesta de Wompi) se loguea server-side únicamente.
    console.error(
      `Conciliación Wompi: error al consultar la transacción ${idTransaccionWompi} (pago ${candidato.id})`,
      error,
    );
    return { resultado: "error", motivo: "No se pudo consultar el estado en Wompi." };
  }

  const decision = evaluarReconciliacionWompi(candidato, transaccionEnVivo);
  if (decision.accion === "rechazar") {
    return { resultado: "rechazado", motivo: decision.motivo };
  }

  const actualizado = await prisma.payment.updateMany({
    where: { id: candidato.id, status: "PENDING" },
    data: { status: decision.estado, failureReason: decision.failureReason },
  });

  if (actualizado.count === 0) {
    return {
      resultado: "omitido",
      motivo: "El pago cambió de estado entre la lectura y la escritura (probablemente un webhook concurrente) — no se aplicó nada.",
    };
  }

  return { resultado: "aplicado", estado: decision.estado };
}
