"use server";

import { prisma } from "lib/prisma";
import { fromSubunits } from "lib/currency/subunits";
import { requireAdmin } from "lib/auth/authorize";
import {
  IN_PROGRESS_FULFILLMENT_STATUSES,
  REFUND_REVIEW_FULFILLMENT_STATUSES,
} from "./fulfillment-rules";
import type { DashboardStats } from "./types";

// Métricas de /admin (P0 admin operativo, auditoría de septiembre 2026 --
// reescrito de punta a punta). La versión anterior leía Order.status
// (legado) para "pedidos en proceso" e "ingresos totales" -- un campo que
// ninguna pantalla real del panel escribe (la única que se edita de verdad
// es fulfillmentStatus, vía updateFulfillmentStatusAction), así que
// cancelar/reembolsar un pedido desde el panel real no cambiaba esas
// cifras. Esta versión separa a propósito PAYMENT (¿se cobró de verdad?)
// de FULFILLMENT (¿en qué va la operación?), ver lib/admin/fulfillment-rules.ts
// para las listas de estados. Nunca se toca Payment.status ni
// fulfillmentStatus acá -- son solo lecturas derivadas de lo que ya existe.
export async function getDashboardStatsAction(): Promise<DashboardStats> {
  await requireAdmin();
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      ordersInProgress,
      approvedSales,
      operationalRevenue,
      pendingRefund,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      // B: pedidos en proceso -- derivado de fulfillmentStatus real, nunca
      // del Order.status legado.
      prisma.order.count({
        where: { fulfillmentStatus: { in: IN_PROGRESS_FULFILLMENT_STATUSES } },
      }),
      // C: ventas aprobadas -- Payment.status SUCCEEDED, sin importar
      // fulfillment. Nunca incluye PENDING (WhatsApp aún sin cobrar) ni
      // FAILED/CANCELLED.
      prisma.order.aggregate({
        _sum: { total: true },
        where: { payment: { status: "SUCCEEDED" } },
      }),
      // D: ingresos operativos -- Payment SUCCEEDED Y el pedido sigue en
      // pie (no cancelado/reembolsado). La cifra principal de negocio.
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          payment: { status: "SUCCEEDED" },
          fulfillmentStatus: { notIn: REFUND_REVIEW_FULFILLMENT_STATUSES },
        },
      }),
      // E: pendientes de reembolso -- Payment SUCCEEDED pero el pedido está
      // cancelado o marcado reembolsado operativamente. Nunca cambia
      // Payment.status: solo cuenta/suma lo que ya hay.
      prisma.order.aggregate({
        _count: true,
        _sum: { total: true },
        where: {
          payment: { status: "SUCCEEDED" },
          fulfillmentStatus: { in: REFUND_REVIEW_FULFILLMENT_STATUSES },
        },
      }),
    ]);

    return {
      totalProducts,
      totalOrders,
      totalUsers,
      ordersInProgress,
      approvedSales: fromSubunits(approvedSales._sum.total ?? 0),
      operationalRevenue: fromSubunits(operationalRevenue._sum.total ?? 0),
      pendingRefundCount: pendingRefund._count,
      pendingRefundAmount: fromSubunits(pendingRefund._sum.total ?? 0),
    };
  } catch (error) {
    console.error(
      "getDashboardStatsAction: no se pudieron leer las métricas",
      error,
    );
    return {
      totalProducts: 0,
      totalOrders: 0,
      totalUsers: 0,
      ordersInProgress: 0,
      approvedSales: 0,
      operationalRevenue: 0,
      pendingRefundCount: 0,
      pendingRefundAmount: 0,
    };
  }
}
