"use server";

import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/auth/authorize";

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
};

export async function listBackInStockDemandAction(): Promise<
  AdminBackInStockDemandRow[]
> {
  await requireAdmin();
  try {
    const grouped = await prisma.backInStockRequest.groupBy({
      by: ["productId", "size"],
      where: { status: "PENDING" },
      _count: { _all: true },
    });
    if (grouped.length === 0) return [];

    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(new Set(grouped.map((row) => row.productId))) } },
      select: { id: true, name: true, slug: true, color: true },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    return grouped
      .map((row) => {
        const product = byId.get(row.productId);
        if (!product) return null;
        return {
          productId: row.productId,
          productName: product.name,
          productSlug: product.slug,
          color: product.color,
          size: row.size,
          waitingCount: row._count._all,
        };
      })
      .filter((row): row is AdminBackInStockDemandRow => row !== null)
      .sort((a, b) => b.waitingCount - a.waitingCount);
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
      select: { id: true, email: true, status: true, createdAt: true, notifiedAt: true },
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
