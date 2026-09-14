"use server";

import { prisma } from "lib/prisma";
import { ORDER_INCLUDE, STATUS_TO_DB, toOrder } from "lib/orders/order-mapping";
import type { OrderStatus } from "lib/orders/types";
import { requireAdmin } from "lib/auth/authorize";
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
