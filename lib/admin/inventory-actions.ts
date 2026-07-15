"use server";

import { prisma } from "lib/prisma";
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

export async function updateVariantStockAction(
  variantId: string,
  stock: number,
): Promise<AdminActionResult> {
  if (!Number.isInteger(stock) || stock < 0) {
    return { success: false, error: "El stock debe ser un entero >= 0." };
  }
  try {
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock },
    });
    return { success: true };
  } catch (error) {
    console.error(
      "updateVariantStockAction: no se pudo actualizar el stock",
      error,
    );
    return { success: false, error: "No se pudo actualizar el stock." };
  }
}
