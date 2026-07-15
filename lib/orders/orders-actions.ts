"use server";

import { prisma } from "lib/prisma";
import type {
  Order as OrderRow,
  OrderItem as OrderItemRow,
  Payment as PaymentRow,
} from "@prisma/client";
import type {
  CreateOrderInput,
  Order,
  OrderStatus,
  ShippingAddressSnapshot,
  ShippingMethodId,
} from "./types";

// Server Actions Prisma/Postgres. orders-repository.ts conserva los mismos
// nombres que antes (Sprint 10, generador simulado + localStorage) — la UI
// no cambia. El generador de pedidos de demo desaparece: ahora hay pedidos
// reales seeded (prisma/seed.ts) y creados desde /checkout.
const STATUS_FROM_DB: Record<OrderRow["status"], OrderStatus> = {
  PROCESANDO: "Procesando",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const METHOD_TO_DB: Record<ShippingMethodId, OrderRow["shippingMethod"]> = {
  standard: "STANDARD",
  express: "EXPRESS",
};
const METHOD_FROM_DB: Record<OrderRow["shippingMethod"], ShippingMethodId> = {
  STANDARD: "standard",
  EXPRESS: "express",
};

const PROVIDER_FROM_DB: Record<PaymentRow["provider"], "stripe" | "wompi"> = {
  STRIPE: "stripe",
  WOMPI: "wompi",
};

function toEuros(cents: number): number {
  return cents / 100;
}

function toCents(euros: number): number {
  return Math.round(euros * 100);
}

type OrderWithRelations = OrderRow & {
  items: OrderItemRow[];
  payment: PaymentRow | null;
};

function toOrder(row: OrderWithRelations): Order {
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
        }
      : undefined,
  };
}

const include = { items: true, payment: true } as const;

export async function listOrdersByUserAction(userId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    include,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}

export async function createOrderAction(input: CreateOrderInput): Promise<Order> {
  const row = await prisma.order.create({
    data: {
      userId: input.userId,
      status: "PROCESANDO",
      subtotal: toCents(input.subtotal),
      shippingCost: toCents(input.shippingCost),
      tax: toCents(input.tax),
      total: toCents(input.total),
      shippingMethod: METHOD_TO_DB[input.shippingMethod],
      shippingAddress: input.shippingAddress as object,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          size: item.size,
          quantity: item.quantity,
          priceValue: toCents(item.priceValue),
        })),
      },
    },
    include,
  });

  return { ...toOrder(row), payment: input.payment };
}

export async function getOrderByIdAction(orderId: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({ where: { id: orderId }, include });
  return row ? toOrder(row) : null;
}
