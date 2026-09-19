"use server";

import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/auth/authorize";
import { logAdminMutation } from "lib/observability/log";
import {
  retryFailedBackInStockRequest,
  type RetryBackInStockResult,
} from "lib/email/back-in-stock-notifications";

// "Solicitudes de reposición" (Fase 2, P2) — qué combinaciones
// producto+talla tienen más clientas esperando, para decidir qué volver a
// producir. Protegido con requireAdmin() como el resto de lib/admin/**;
// nunca expone la lista de correos acá (ver
// listBackInStockRequestsForVariantAction para el detalle individual, que
// también exige admin).
export type AdminBackInStockDemandRow = {
  productId: string;
  productName: string;
  productSlug: string;
  color: string;
  size: string;
  waitingCount: number;
  // Solicitudes FAILED de esa combinación (Fase 2, P2 — validación final).
  // Sin esto, una combinación cuya única solicitud falló y no tiene a nadie
  // más en PENDING desaparecía por completo de esta tabla — no había forma
  // de llegar a "Ver solicitudes" para reintentarla. Se agrupa junto con
  // PENDING (no reemplaza esa columna) para que la fila siga existiendo.
  failedCount: number;
};

export async function listBackInStockDemandAction(): Promise<
  AdminBackInStockDemandRow[]
> {
  await requireAdmin();
  try {
    const grouped = await prisma.backInStockRequest.groupBy({
      by: ["productId", "size", "status"],
      where: { status: { in: ["PENDING", "FAILED"] } },
      _count: { _all: true },
    });
    if (grouped.length === 0) return [];

    const byKey = new Map<
      string,
      {
        productId: string;
        size: string;
        waitingCount: number;
        failedCount: number;
      }
    >();
    for (const row of grouped) {
      const key = `${row.productId}::${row.size}`;
      const existing = byKey.get(key) ?? {
        productId: row.productId,
        size: row.size,
        waitingCount: 0,
        failedCount: 0,
      };
      if (row.status === "PENDING") existing.waitingCount = row._count._all;
      if (row.status === "FAILED") existing.failedCount = row._count._all;
      byKey.set(key, existing);
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: Array.from(new Set(grouped.map((row) => row.productId))) },
      },
      select: { id: true, name: true, slug: true, color: true },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    return Array.from(byKey.values())
      .map((row) => {
        const product = byId.get(row.productId);
        if (!product) return null;
        return {
          productId: row.productId,
          productName: product.name,
          productSlug: product.slug,
          color: product.color,
          size: row.size,
          waitingCount: row.waitingCount,
          failedCount: row.failedCount,
        };
      })
      .filter((row): row is AdminBackInStockDemandRow => row !== null)
      .sort(
        (a, b) =>
          b.waitingCount + b.failedCount - (a.waitingCount + a.failedCount),
      );
  } catch (error) {
    console.error(
      "listBackInStockDemandAction: no se pudo leer la demanda de reposición",
      error,
    );
    return [];
  }
}

export type AdminBackInStockRequestRow = {
  id: string;
  email: string;
  status: "PENDING" | "NOTIFIED" | "FAILED";
  createdAt: string;
  notifiedAt: string | null;
};

// Detalle de una combinación puntual — "también quiero poder consultar las
// solicitudes individuales cuando sea necesario". Nunca se llama en bulk
// para todo el catálogo (solo cuando el admin abre un renglón puntual),
// así que no hace falta paginar.
export async function listBackInStockRequestsForVariantAction(
  productId: string,
  size: string,
): Promise<AdminBackInStockRequestRow[]> {
  await requireAdmin();
  try {
    const rows = await prisma.backInStockRequest.findMany({
      where: { productId, size },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        notifiedAt: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      notifiedAt: row.notifiedAt ? row.notifiedAt.toISOString() : null,
    }));
  } catch (error) {
    console.error(
      "listBackInStockRequestsForVariantAction: no se pudo leer el detalle",
      error,
    );
    return [];
  }
}

// Reintentar un envío FAILED (Fase 2, P2 — validación final). requireAdmin()
// primero como el resto de lib/admin/**; la lógica real (revalidar stock,
// no duplicar correos a quien ya fue notificado) vive en
// retryFailedBackInStockRequest, compartida por si en el futuro se agrega
// otro punto de entrada al mismo reintento.
export async function retryBackInStockNotificationAction(
  requestId: string,
): Promise<RetryBackInStockResult> {
  const admin = await requireAdmin();
  try {
    const result = await retryFailedBackInStockRequest(requestId);
    logAdminMutation({
      adminId: admin.id,
      action: "back_in_stock_notification_retry",
      targetType: "BackInStockRequest",
      targetId: requestId,
      outcome: result.success ? "success" : "failure",
    });
    return result;
  } catch (error) {
    console.error(
      "retryBackInStockNotificationAction: no se pudo reintentar",
      requestId,
      error,
    );
    return { success: false, error: "No se pudo reintentar el envío." };
  }
}
