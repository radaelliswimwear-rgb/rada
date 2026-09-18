import type {
  Order as OrderRow,
  OrderItem as OrderItemRow,
  OrderStatusEvent as OrderStatusEventRow,
  Payment as PaymentRow,
} from "@prisma/client";
import { fromSubunits, toSubunits } from "lib/currency/subunits";
import type { AttributionState } from "lib/attribution/types";
import { resolveFreeShippingThresholdSnapshot } from "lib/admin/fulfillment-rules";
import type {
  FulfillmentStatus,
  Order,
  OrderStatus,
  PaymentSnapshot,
  ShippingAddressSnapshot,
  ShippingMethodId,
} from "./types";

// Mapeo DB <-> dominio compartido entre orders-actions.ts (checkout, mi
// cuenta) y lib/admin/orders-actions.ts (Sprint 14). Vive en su propio
// archivo, sin "use server", porque un archivo "use server" solo puede
// exportar funciones async al nivel superior — no puede reexportar estos
// objetos ni la función toOrder.
export const STATUS_FROM_DB: Record<OrderRow["status"], OrderStatus> = {
  PROCESANDO: "Procesando",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
  PENDIENTE_PAGO: "Pendiente de pago",
};
export const STATUS_TO_DB: Record<OrderStatus, OrderRow["status"]> = {
  Procesando: "PROCESANDO",
  Enviado: "ENVIADO",
  Entregado: "ENTREGADO",
  Cancelado: "CANCELADO",
  "Pendiente de pago": "PENDIENTE_PAGO",
};

export const METHOD_TO_DB: Record<
  ShippingMethodId,
  OrderRow["shippingMethod"]
> = {
  standard: "STANDARD",
  express: "EXPRESS",
};
export const METHOD_FROM_DB: Record<
  OrderRow["shippingMethod"],
  ShippingMethodId
> = {
  STANDARD: "standard",
  EXPRESS: "express",
};

export const PROVIDER_FROM_DB: Record<
  PaymentRow["provider"],
  "stripe" | "wompi" | "whatsapp"
> = {
  STRIPE: "stripe",
  WOMPI: "wompi",
  WHATSAPP: "whatsapp",
};

export const PAYMENT_STATUS_FROM_DB: Record<
  PaymentRow["status"],
  "pending" | "succeeded" | "failed" | "cancelled" | "refunded"
> = {
  PENDING: "pending",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

export const FULFILLMENT_STATUS_FROM_DB: Record<
  OrderRow["fulfillmentStatus"],
  FulfillmentStatus
> = {
  PENDIENTE_POR_PREPARAR: "Pendiente por preparar",
  PREPARANDO: "Preparando pedido",
  CLIENTE_CONTACTADO: "Cliente contactado",
  ENTREGA_COORDINADA: "Entrega coordinada",
  DESPACHADO: "Despachado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
  REEMBOLSADO: "Reembolsado",
};

export const FULFILLMENT_STATUS_TO_DB: Record<
  FulfillmentStatus,
  OrderRow["fulfillmentStatus"]
> = {
  "Pendiente por preparar": "PENDIENTE_POR_PREPARAR",
  "Preparando pedido": "PREPARANDO",
  "Cliente contactado": "CLIENTE_CONTACTADO",
  "Entrega coordinada": "ENTREGA_COORDINADA",
  Despachado: "DESPACHADO",
  Entregado: "ENTREGADO",
  Cancelado: "CANCELADO",
  Reembolsado: "REEMBOLSADO",
};

export const toEuros = fromSubunits;
export const toCents = toSubunits;

export type OrderWithRelations = OrderRow & {
  items: OrderItemRow[];
  payment: PaymentRow | null;
  fulfillmentHistory?: OrderStatusEventRow[];
  emailOutbox?: { freeShippingThresholdSnapshot: number | null }[];
};

// orderBy en fulfillmentHistory: más antiguo primero, para que el detalle
// del pedido muestre la línea de tiempo en orden natural (Pendiente por
// preparar -> ... -> Despachado), no al revés.
//
// emailOutbox (P0 admin operativo): solo el job más antiguo, solo su
// freeShippingThresholdSnapshot -- único motivo de incluirlo es el fallback
// histórico para pedidos anteriores a Order.freeShippingThresholdSnapshot
// (ver toOrder abajo). No trae destinatario ni contenido del email.
export const ORDER_INCLUDE = {
  items: true,
  payment: true,
  fulfillmentHistory: { orderBy: { createdAt: "asc" } },
  emailOutbox: {
    take: 1,
    orderBy: { createdAt: "asc" },
    select: { freeShippingThresholdSnapshot: true },
  },
} as const;

// P0 admin operativo: helper compartido para no repetir la misma lista de
// campos en toOrder() (abajo) y en toOrderWithPayment()
// (lib/orders/order-creation-core.ts) -- antes ambas armaban el mismo
// PaymentSnapshot por separado, con riesgo real de que un campo nuevo se
// agregara en un lado y se olvidara en el otro.
export function toPaymentSnapshot(payment: PaymentRow): PaymentSnapshot {
  return {
    provider: PROVIDER_FROM_DB[payment.provider],
    transactionId: payment.providerRef,
    last4: payment.cardLast4 ?? "",
    status: PAYMENT_STATUS_FROM_DB[payment.status],
    wompiTransactionId: payment.wompiTransactionId,
    amount: toEuros(payment.amount),
    currency: payment.currency,
    createdAt: payment.createdAt.toISOString(),
  };
}

export function toOrder(row: OrderWithRelations): Order {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    date: row.createdAt.toISOString(),
    status: STATUS_FROM_DB[row.status],
    fulfillmentStatus: FULFILLMENT_STATUS_FROM_DB[row.fulfillmentStatus],
    fulfillmentHistory: row.fulfillmentHistory?.map((event) => ({
      id: event.id,
      status: FULFILLMENT_STATUS_FROM_DB[event.status],
      changedByEmail: event.changedByEmail,
      createdAt: event.createdAt.toISOString(),
    })),
    items: row.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      image: item.image,
      size: item.size,
      quantity: item.quantity,
      priceValue: toEuros(item.priceValue),
      sku: item.sku ?? undefined,
      color: item.color ?? undefined,
      collection: item.collection ?? undefined,
    })),
    total: toEuros(row.total),
    subtotal: toEuros(row.subtotal),
    shippingCost: toEuros(row.shippingCost),
    tax: toEuros(row.tax),
    shippingAddress: row.shippingAddress as unknown as ShippingAddressSnapshot,
    shippingMethod: METHOD_FROM_DB[row.shippingMethod],
    payment: row.payment ? toPaymentSnapshot(row.payment) : undefined,
    couponCode: row.couponCode ?? undefined,
    discountValue: row.discountValue ? toEuros(row.discountValue) : undefined,
    marketingExclusionReason: row.marketingExclusionReason,
    attributionSnapshot: row.attributionSnapshot as unknown as AttributionState | null,
    freeShippingThresholdSnapshot: resolveFreeShippingThresholdSnapshot(
      row.freeShippingThresholdSnapshot,
      row.emailOutbox?.[0]?.freeShippingThresholdSnapshot,
    ),
    shippingCarrier: row.shippingCarrier,
    trackingNumber: row.trackingNumber,
    trackingUrl: row.trackingUrl,
    dispatchedAt: row.dispatchedAt ? row.dispatchedAt.toISOString() : null,
    // A diferencia de freeShippingThresholdSnapshot (arriba, sin conversión
    // a propósito), este SÍ se guarda en centavos como el resto de montos
    // del pedido (ver updateOrderShippingDetailsAction, que hace toCents al
    // guardar) -- toEuros acá es su contraparte de lectura.
    quotedShippingCost:
      row.quotedShippingCost != null ? toEuros(row.quotedShippingCost) : null,
  };
}
