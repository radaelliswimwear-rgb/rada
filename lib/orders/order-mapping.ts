import type {
  Order as OrderRow,
  OrderItem as OrderItemRow,
  Payment as PaymentRow,
} from "@prisma/client";
import { fromSubunits, toSubunits } from "lib/currency/subunits";
import type {
  Order,
  OrderStatus,
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
  "pending" | "succeeded" | "failed" | "cancelled"
> = {
  PENDING: "pending",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

export const toEuros = fromSubunits;
export const toCents = toSubunits;

export type OrderWithRelations = OrderRow & {
  items: OrderItemRow[];
  payment: PaymentRow | null;
};

export const ORDER_INCLUDE = { items: true, payment: true } as const;

export function toOrder(row: OrderWithRelations): Order {
  return {
    id: row.id,
    userId: row.userId,
    date: row.createdAt.toISOString(),
    status: STATUS_FROM_DB[row.status],
    items: row.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      image: item.image,
      size: item.size,
      quantity: item.quantity,
      priceValue: toEuros(item.priceValue),
      sku: item.sku ?? undefined,
    })),
    total: toEuros(row.total),
    subtotal: toEuros(row.subtotal),
    shippingCost: toEuros(row.shippingCost),
    tax: toEuros(row.tax),
    shippingAddress: row.shippingAddress as unknown as ShippingAddressSnapshot,
    shippingMethod: METHOD_FROM_DB[row.shippingMethod],
    payment: row.payment
      ? {
          provider: PROVIDER_FROM_DB[row.payment.provider],
          transactionId: row.payment.providerRef,
          last4: row.payment.cardLast4 ?? "",
          status: PAYMENT_STATUS_FROM_DB[row.payment.status],
        }
      : undefined,
    couponCode: row.couponCode ?? undefined,
    discountValue: row.discountValue ? toEuros(row.discountValue) : undefined,
  };
}
