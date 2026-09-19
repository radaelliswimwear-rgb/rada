"use server";

import { prisma } from "lib/prisma";
import { requireAdmin } from "lib/auth/authorize";
import { notifyBackInStockSubscribers } from "lib/email/back-in-stock-notifications";
import { logAdminMutation } from "lib/observability/log";
import type { AdminActionResult } from "./types";

// Gestión de variantes/inventario (Sprint 14, ampliación): vista plana de
// todas las ProductVariant, sin pasar por AdminProduct completo (que trae
// imágenes/descr./etc. innecesarios acá) — select acotado a propósito para
// no sobre-pedir a Prisma en una lista que puede crecer con el catálogo.
export type AdminVariantRow = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  size: string;
  stock: number;
};

export async function listVariantsAction(): Promise<AdminVariantRow[]> {
  await requireAdmin();
  try {
    const rows = await prisma.productVariant.findMany({
      orderBy: [{ stock: "asc" }, { productId: "asc" }],
      select: {
        id: true,
        productId: true,
        size: true,
        stock: true,
        product: { select: { name: true, slug: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      productName: row.product.name,
      productSlug: row.product.slug,
      size: row.size,
      stock: row.stock,
    }));
  } catch (error) {
    console.error("listVariantsAction: no se pudo leer el inventario", error);
    return [];
  }
}

// Único punto donde un admin cambia el stock de una talla a mano (Fase 2,
// P2): lee el valor anterior ANTES de escribir el nuevo para poder detectar
// la transición real 0 -> disponible y disparar
// notifyBackInStockSubscribers ahí mismo — event-driven, sin depender de
// ningún cron (el plan Hobby de Vercel limita los crons a 1 vez al día, ver
// vercel.json). Nunca se engancha a releaseReservedStock
// (lib/checkout/server-order-totals.ts): esa es una devolución transitoria
// de stock reservado por un pago fallido/cancelado, no una reposición real
// (ver comentario del modelo BackInStockRequest en prisma/schema.prisma).
export async function updateVariantStockAction(
  variantId: string,
  stock: number,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(stock) || stock < 0) {
    return { success: false, error: "El stock debe ser un entero >= 0." };
  }
  try {
    const previous = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true, size: true, stock: true },
    });
    if (!previous) {
      return { success: false, error: "Esa talla ya no existe." };
    }

    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock },
    });
    // Auditoría (sección 4 del hardening P2/P3): todo ajuste manual de stock
    // queda registrado para diagnóstico -- nunca alerta individualmente
    // (evita alert fatigue en una acción que un admin puede hacer decenas
    // de veces por día); la detección de anomalías (ej. un salto
    // inusualmente grande) queda fuera de alcance a propósito, requiere una
    // decisión de producto sobre qué umbral tiene sentido.
    logAdminMutation({
      adminId: admin.id,
      action: "inventory_manual_update",
      targetType: "ProductVariant",
      targetId: variantId,
      outcome: "success",
      reason: `stock: ${previous.stock} -> ${stock}`,
    });

    if (previous.stock === 0 && stock > 0) {
      // No bloquea la respuesta al admin más de lo necesario, pero sí se
      // espera (con su propio try/catch interno, nunca lanza) para que un
      // error real quede en los logs del servidor asociado a este cambio
      // de stock, no perdido en un fire-and-forget.
      await notifyBackInStockSubscribers(previous.productId, previous.size);
    }

    return { success: true };
  } catch (error) {
    console.error(
      "updateVariantStockAction: no se pudo actualizar el stock",
      error,
    );
    return { success: false, error: "No se pudo actualizar el stock." };
  }
}
