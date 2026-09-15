"use server";

import { prisma } from "lib/prisma";
import {
  FULFILLMENT_STATUS_TO_DB,
  ORDER_INCLUDE,
  STATUS_TO_DB,
  toOrder,
} from "lib/orders/order-mapping";
import type { FulfillmentStatus, OrderStatus } from "lib/orders/types";
import { requireAdmin } from "lib/auth/authorize";
import { releaseReservedStock } from "lib/checkout/server-order-totals";
import type { AdminActionResult, AdminOrder } from "./types";

// Server Actions de administración de pedidos (Sprint 14): a diferencia de
// ordersRepository.listByUser (lib/orders/orders-actions.ts), no filtra por
// userId — devuelve todos los pedidos, con el email del comprador para
// identificarlos en el listado.
export async function listAllOrdersAction(): Promise<AdminOrder[]> {
  await requireAdmin();
  try {
    const rows = await prisma.order.findMany({
      include: { ...ORDER_INCLUDE, user: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({ ...toOrder(row), userEmail: row.user.email }));
  } catch (error) {
    console.error("listAllOrdersAction: no se pudo leer los pedidos", error);
    return [];
  }
}

// Detalle de un pedido para /admin/pedidos/[id] — a diferencia de
// getOrderByIdAction (lib/orders/orders-actions.ts, usado por la
// confirmación de compra de la propia clienta), este SIEMPRE exige rol
// ADMIN, sin la excepción de "pedido de invitado" que tiene aquel.
export async function getAdminOrderByIdAction(
  orderId: string,
): Promise<AdminOrder | null> {
  await requireAdmin();
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: { ...ORDER_INCLUDE, user: true },
  });
  if (!row) return null;
  return { ...toOrder(row), userEmail: row.user.email };
}

// Estado logístico real que se edita desde /admin/pedidos (Sprint 30) — ver
// FulfillmentStatus en lib/orders/types.ts para por qué está separado del
// `status` legado de abajo y de Payment.status. Cada cambio queda en
// OrderStatusEvent (historial visible en el detalle del pedido) con el
// correo del admin que lo hizo.
export async function updateFulfillmentStatusAction(
  orderId: string,
  status: FulfillmentStatus,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  try {
    const dbStatus = FULFILLMENT_STATUS_TO_DB[status];
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { fulfillmentStatus: dbStatus },
      }),
      prisma.orderStatusEvent.create({
        data: { orderId, status: dbStatus, changedByEmail: admin.email },
      }),
    ]);

    // Mismo criterio que updateOrderStatusAction: cancelar devuelve el
    // stock reservado, para que no quede bloqueado para otras compradoras.
    if (status === "Cancelado") {
      const payment = await prisma.payment.findUnique({ where: { orderId } });
      if (payment) await releaseReservedStock(payment.id);
    }
    return { success: true };
  } catch (error) {
    console.error(
      "updateFulfillmentStatusAction: no se pudo actualizar el estado",
      error,
    );
    return {
      success: false,
      error: "No se pudo actualizar el estado del pedido.",
    };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: STATUS_TO_DB[status] },
    });
    // Cancelar un pedido desde el panel también devuelve el inventario que
    // se había reservado al cobrar/coordinar el pago (Sprint 29) — si no,
    // el stock de un pedido cancelado a mano quedaba bloqueado para siempre
    // (ver lib/checkout/server-order-totals.ts).
    if (status === "Cancelado") {
      const payment = await prisma.payment.findUnique({ where: { orderId } });
      if (payment) await releaseReservedStock(payment.id);
    }
    return { success: true };
  } catch (error) {
    console.error(
      "updateOrderStatusAction: no se pudo actualizar el estado",
      error,
    );
    return {
      success: false,
      error: "No se pudo actualizar el estado del pedido.",
    };
  }
}
