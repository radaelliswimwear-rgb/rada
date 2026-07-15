"use server";

import { prisma } from "lib/prisma";
import type { DashboardStats } from "./types";

// Métricas simples para /admin (Sprint 14): conteos directos y una suma de
// ingresos por Prisma. Se excluyen los pedidos cancelados del ingreso total,
// mismo criterio que un reporte de ventas real.
export async function getDashboardStatsAction(): Promise<DashboardStats> {
  try {
    const [totalProducts, totalOrders, totalUsers, pendingOrders, revenue] =
      await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.user.count(),
        prisma.order.count({ where: { status: "PROCESANDO" } }),
        prisma.order.aggregate({
          _sum: { total: true },
          where: { status: { not: "CANCELADO" } },
        }),
      ]);

    return {
      totalProducts,
      totalOrders,
      totalUsers,
      pendingOrders,
      revenue: (revenue._sum.total ?? 0) / 100,
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
      pendingOrders: 0,
      revenue: 0,
    };
  }
}
