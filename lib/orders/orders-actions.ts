"use server";

import { prisma } from "lib/prisma";
import { METHOD_TO_DB, ORDER_INCLUDE, toCents, toOrder } from "./order-mapping";
import type { CreateOrderInput, Order } from "./types";

// Server Actions Prisma/Postgres. orders-repository.ts conserva los mismos
// nombres que antes (Sprint 10, generador simulado + localStorage) — la UI
// no cambia. El generador de pedidos de demo desaparece: ahora hay pedidos
// reales seeded (prisma/seed.ts) y creados desde /checkout. El mapeo
// DB <-> dominio vive en ./order-mapping.ts (un archivo "use server" solo
// puede exportar funciones async, no esos objetos/funciones auxiliares).
export async function listOrdersByUserAction(userId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<Order> {
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
    include: ORDER_INCLUDE,
  });

  return { ...toOrder(row), payment: input.payment };
}

export async function getOrderByIdAction(
  orderId: string,
): Promise<Order | null> {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  });
  return row ? toOrder(row) : null;
}
