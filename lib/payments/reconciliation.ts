import type { Payment } from "@prisma/client";
import type { WompiTransaction } from "lib/payments/providers/wompi-gateway";
import { WOMPI_TRANSACTION_STATUS_TO_DB } from "lib/payments/wompi-status-mapping";

// ============================================================================
// MATERIAL DE DISEÑO — NO conectado a la aplicación.
//
// Nada de este archivo se importa desde ningún código que corra de verdad
// (ni Server Actions, ni rutas, ni cron). Es intencional: se pidió diseño,
// no una implementación parcial que aparente estar lista.
//
// POR QUÉ SE RETIRÓ el wrapper ejecutable que existió acá antes (hacía un
// `prisma.payment.updateMany` condicional): actualizaba SOLO
// Payment.status/failureReason. Comparado con lo que el webhook real
// (applyWompiWebhookUpdateAction, en payments-actions.ts) hace de verdad
// cuando un pago pasa a FAILED/CANCELLED, a ese wrapper le faltaban TRES
// efectos de dominio reales, no cosméticos:
//   1. `lastEventTimestamp` — se actualiza junto con el status.
//   2. `releaseReservedStock(payment.id)` — libera el stock de producto
//      reservado. Sin esto, una conciliación que marca un pago como
//      FAILED/CANCELLED dejaría stock real bloqueado indefinidamente.
//   3. Si el pago ya tiene un `orderId` vinculado, el `Order` asociado se
//      cancela (`status: "CANCELADO"`). Sin esto, un pedido quedaría
//      "vivo" en el panel para un pago que en realidad falló.
// Una conciliación que solo toca Payment.status, aunque esté bien probada
// en aislamiento, sería incompleta en producción — por eso no se dejó
// conectada ni se hizo una segunda versión "arreglada": el problema de
// fondo es que esta lógica no puede vivir por separado sin arriesgar que
// las dos copias (webhook y conciliación) diverjan con el tiempo.
//
// CAMINO PROPUESTO para una implementación futura completa (no hecha
// acá): en vez de que la conciliación reimplemente estos efectos, hacer
// que comparta la misma función/transacción que ya usa el webhook —por
// ejemplo, que applyWompiWebhookUpdateAction acepte de dónde vino el
// evento (webhook vs. conciliación manual) solo para loguearlo distinto,
// pero ejecute exactamente el mismo cuerpo, incluidos los tres efectos de
// arriba, dentro de una única transacción de Prisma. Así no hay una
// segunda copia de la lógica de negocio que mantener sincronizada.
//
// Lo que SÍ se conserva de la versión anterior es la función pura de más
// abajo — no toca ninguna base de datos, así que no tiene el problema de
// arriba. Sirve como referencia de qué verificaciones (reference exacta,
// moneda, importe, identidad del proveedor) tendría que hacer esa futura
// implementación antes de aplicar cualquier resultado.
// ============================================================================

export type DecisionReconciliacion =
  | { accion: "aplicar"; estado: Payment["status"]; failureReason: string | null }
  | { accion: "rechazar"; motivo: string };

type PaymentCandidato = Pick<
  Payment,
  "providerRef" | "currency" | "amount" | "provider"
>;

// Función PURA — sin I/O, sin base de datos, sin red. Verifica referencia
// exacta, moneda, importe e identidad del proveedor ANTES de decidir
// aplicar cualquier cosa — un error acá nunca debe poder tocar un pago
// distinto al candidato.
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

// PROBLEMA SIN RESOLVER, sin cambios respecto a la entrega anterior: no
// hay forma confirmada de encontrar el id de Wompi de un pago que nunca
// recibió ningún webhook (Payment solo guarda `providerRef`, nunca el id
// interno de Wompi). Ver el historial de este archivo — se intentó
// documentar un endpoint de búsqueda por referencia y se retiró por no
// poder confirmarse contra una respuesta real de Wompi.
