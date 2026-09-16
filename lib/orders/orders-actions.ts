"use server";

import { prisma } from "lib/prisma";
import { requireUser } from "lib/auth/authorize";
import { getCurrentUser } from "lib/auth/session";
import { GUEST_USER_ID } from "lib/checkout/types";
import { ORDER_INCLUDE, toOrder } from "./order-mapping";
import { createOrderForPayment } from "./order-creation-core";
import type { CreateOrderInput, Order } from "./types";

// Server Actions Prisma/Postgres. orders-repository.ts conserva los mismos
// nombres que antes (Sprint 10, generador simulado + localStorage) — la UI
// no cambia. El generador de pedidos de demo desaparece: ahora hay pedidos
// reales seeded (prisma/seed.ts) y creados desde /checkout. El mapeo
// DB <-> dominio vive en ./order-mapping.ts (un archivo "use server" solo
// puede exportar funciones async, no esos objetos/funciones auxiliares).
// Ya no recibe userId del cliente (auditoría de seguridad, Sprint 26):
// cualquiera podía llamar esto pasando el id de otra clienta y leer todo su
// historial de pedidos. Ahora siempre se deriva de la sesión real.
export async function listOrdersByUserAction(): Promise<Order[]> {
  const user = await requireUser();
  const rows = await prisma.order.findMany({
    where: { userId: user.id },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrder);
}

// Auditoría de seguridad (Sprint 26/29): el dueño del pedido nunca sale de
// un userId que mande el cliente — una clienta con sesión siempre compra
// como ella misma, sin sesión el pedido queda como invitado. La lógica real
// de creación (idempotencia, reclamo atómico, snapshot de precios,
// notificación) vive en ./order-creation-core.ts, un módulo SIN
// "use server" — ver el comentario ahí arriba de por qué: esta función es
// la única forma de invocar esa lógica con un userId que un tercero pueda
// influir, y solo puede hacerlo a través de una sesión real verificada acá
// mismo, nunca de un parámetro.
export async function createOrderAction(
  input: CreateOrderInput,
): Promise<Order> {
  const sessionUser = await getCurrentUser();
  const resolvedUserId = sessionUser?.id ?? GUEST_USER_ID;
  return createOrderForPayment(resolvedUserId, input);
}

// Antes devolvía cualquier pedido con solo saber su id, sin importar quién
// preguntara (auditoría de seguridad, Sprint 26) — un id de pedido cuid es
// impredecible, pero una clienta con sesión podía adivinar/probar otro id y
// leer nombre, dirección y contenido del pedido de otra persona. La página
// de confirmación post-compra sigue funcionando para invitados (no tienen
// sesión): esos pedidos se identifican solo por el id impredecible de la
// URL, igual que en Shopify o Stripe Checkout. Un pedido de una cuenta real
// sí exige que quien pregunta sea esa misma cuenta (o un admin).
export async function getOrderByIdAction(
  orderId: string,
): Promise<Order | null> {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  });
  if (!row) return null;
  if (row.userId === GUEST_USER_ID) return toOrder(row);

  const sessionUser = await getCurrentUser();
  if (!sessionUser) return null;
  if (sessionUser.id !== row.userId && sessionUser.role !== "ADMIN") {
    return null;
  }
  return toOrder(row);
}
