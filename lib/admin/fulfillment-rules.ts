import type {
  FulfillmentStatus as FulfillmentStatusDb,
  PaymentStatus as PaymentStatusDb,
} from "@prisma/client";
import type { FulfillmentStatus as FulfillmentStatusDomain } from "lib/orders/types";
import type { PaymentStatus as PaymentStatusDomain } from "lib/payments/types";

// Lógica pura de reglas de negocio sobre FulfillmentStatus/PaymentStatus (P0
// admin operativo, auditoría de septiembre 2026) -- sin Prisma ni
// next/headers, mismo patrón que lib/internal-traffic/status.ts. Trabaja
// directo sobre los enums de la base (@prisma/client), no sobre los strings
// en español de lib/orders/types.ts, porque dashboard-actions.ts y
// orders-actions.ts arman queries/comparaciones directo contra esos enums.

// "En proceso" = todavía no llegó a un estado terminal. Terminales:
// ENTREGADO (ciclo completo), CANCELADO y REEMBOLSADO (cerrados). Reemplaza
// la métrica anterior del dashboard, que contaba Order.status === PROCESANDO
// -- un campo legado que ninguna pantalla real del panel escribe.
export const IN_PROGRESS_FULFILLMENT_STATUSES: FulfillmentStatusDb[] = [
  "PENDIENTE_POR_PREPARAR",
  "PREPARANDO",
  "CLIENTE_CONTACTADO",
  "ENTREGA_COORDINADA",
  "DESPACHADO",
];

export function isInProgressFulfillmentStatus(
  status: FulfillmentStatusDb,
): boolean {
  return IN_PROGRESS_FULFILLMENT_STATUSES.includes(status);
}

// Estados de fulfillment que, combinados con un pago ya SUCCEEDED, dejan
// dinero cobrado sin devolución confirmada por el proveedor. "Equivalente
// real" a CANCELADO (pedido según el spec del proceso P0): se incluye
// también REEMBOLSADO, porque marcar un pedido como reembolsado operativamente
// NO mueve Payment.status -- sigue habiendo plata cobrada sin confirmación
// real de devolución en ambos casos. Nunca se usa para tocar Payment, solo
// para derivar una advertencia visible (sección 11 del proceso: "no mentir").
export const REFUND_REVIEW_FULFILLMENT_STATUSES: FulfillmentStatusDb[] = [
  "CANCELADO",
  "REEMBOLSADO",
];

export function paymentPendingRefundReview(
  fulfillmentStatus: FulfillmentStatusDb,
  paymentStatus: PaymentStatusDb | null | undefined,
): boolean {
  return (
    paymentStatus === "SUCCEEDED" &&
    REFUND_REVIEW_FULFILLMENT_STATUSES.includes(fulfillmentStatus)
  );
}

// Guardas de transición server-side (proceso P0, secciones 9/10) --
// deliberadamente mínimas: solo las de mayor riesgo que demostró la
// auditoría, no una máquina de estados completa.
//
// - Desde CANCELADO: el stock reservado YA se liberó al cancelar
//   (releaseReservedStock) -- moverlo a un estado activo (p. ej.
//   "Preparando pedido") volvería a "vender" un stock que pudo haberse
//   asignado a otra clienta mientras tanto, sin ninguna lógica de reapertura
//   / re-reserva. Bloqueado hasta que exista ese proceso explícito (no se
//   implementa en este proceso).
// - Desde REEMBOLSADO: mismo criterio -- estado cerrado operativamente, sin
//   proceso de reapertura implementado todavía.
// - ENTREGADO -> CANCELADO: un pedido ya entregado no tiene sentido
//   operativo cancelarlo (a diferencia de ENTREGADO -> REEMBOLSADO, que sí
//   es un flujo real de devolución/garantía y queda permitido).
// Cualquier transición no listada arriba, incluida X -> X (no-op), queda
// permitida.
export function isFulfillmentTransitionAllowed(
  from: FulfillmentStatusDb,
  to: FulfillmentStatusDb,
): boolean {
  if (from === to) return true;
  if (from === "CANCELADO") return false;
  if (from === "REEMBOLSADO") return false;
  if (from === "ENTREGADO" && to === "CANCELADO") return false;
  return true;
}

// Misma regla que paymentPendingRefundReview, pero sobre los valores de
// dominio (español, minúscula en payment.status) que ya usa la UI del panel
// -- order-detail.tsx y orders-table.tsx nunca ven los enums de Prisma
// directo. Una sola definición de "qué cuenta como pendiente de reembolso",
// expresada en los dos vocabularios que ya conviven en el código.
export function orderNeedsRefundReview(
  fulfillmentStatus: FulfillmentStatusDomain,
  paymentStatus: PaymentStatusDomain | null | undefined,
): boolean {
  return (
    paymentStatus === "succeeded" &&
    (fulfillmentStatus === "Cancelado" || fulfillmentStatus === "Reembolsado")
  );
}

// Resuelve el umbral de envío gratis histórico de un pedido: prioriza el
// snapshot propio de Order (pedidos creados después de esta migración);
// para pedidos anteriores, cae al snapshot ya congelado en su EmailOutbox
// más antiguo (mismo valor, msima fuente original). Nunca cae a la
// configuración ACTUAL -- eso alteraría el significado histórico de un
// pedido viejo si el umbral cambió después. null solo cuando de verdad no
// hay ningún snapshot guardado en ningún lado (pedido sin ningún
// EmailOutbox, caso extremo).
export function resolveFreeShippingThresholdSnapshot(
  orderSnapshot: number | null | undefined,
  emailOutboxFallback: number | null | undefined,
): number | null {
  return orderSnapshot ?? emailOutboxFallback ?? null;
}
