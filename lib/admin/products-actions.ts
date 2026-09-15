"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "lib/prisma";
import {
  CATEGORY_LABEL_BY_SLUG,
  CATEGORY_SLUG_BY_LABEL,
  type CategoryLabel,
} from "lib/catalog/types";
import { deleteCloudinaryAssetAction } from "lib/cloudinary/upload-actions";
import { fromSubunits, toSubunits } from "lib/currency/subunits";
import { clampDiscountPercent } from "lib/pricing/discount";
import { requireAdmin } from "lib/auth/authorize";
import { findSkuConflict, generateSku } from "./sku";
import type {
  AdminActionResult,
  AdminProduct,
  AdminProductInput,
} from "./types";

// Server Actions de escritura para el catálogo (Sprint 14). A diferencia de
// lib/catalog/catalog-actions.ts (solo lectura, degrada a [] si Postgres
// falla), acá un error se reporta de verdad: quien edita el catálogo
// necesita saber si la escritura falló, no ver una lista vacía.
const DEFAULT_VARIANT_STOCK = 25;

const PRODUCT_INCLUDE = {
  category: true,
  images: { orderBy: { position: "asc" } },
  variants: true,
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

const toEuros = fromSubunits;
const toCents = toSubunits;

function toAdminProduct(row: ProductWithRelations): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    // Se deriva del slug (estable) y no de category.name (editable en
    // /admin/categorias) — usar el nombre acá rompía el guardado apenas se
    // renombraba una categoría, porque dejaba de matchear CategoryLabel.
    category: CATEGORY_LABEL_BY_SLUG[row.category.slug] ?? "Hombre",
    priceValue: toEuros(row.priceValue),
    discountPercent: row.discountPercent,
    color: row.color,
    description: row.description,
    featured: row.featured,
    images: row.images.map((image) => ({
      url: image.url,
      publicId: image.publicId,
    })),
    variants: row.variants.map((variant) => ({
      size: variant.size,
      stock: variant.stock,
    })),
    createdAt: row.createdAt.toISOString(),
    sku: row.sku,
    totalStock: row.variants.reduce((sum, variant) => sum + variant.stock, 0),
    realViews: row.realViews,
    promotionalViews: row.promotionalViews,
    showViews: row.showViews,
    active: row.active,
  };
}

// Borra en Cloudinary los assets que ya no están en la lista final de
// imágenes (edición) o que pertenecían a un producto eliminado — best-effort:
// un fallo acá se loguea pero no revierte ni bloquea la operación principal
// sobre Postgres (el producto ya se guardó/borró correctamente).
async function cleanupRemovedCloudinaryAssets(
  publicIds: (string | null)[],
): Promise<void> {
  const ids = publicIds.filter((id): id is string => id !== null);
  await Promise.allSettled(ids.map((id) => deleteCloudinaryAssetAction(id)));
}

export async function listAllProductsAction(): Promise<AdminProduct[]> {
  await requireAdmin();
  try {
    const rows = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: PRODUCT_INCLUDE,
    });
    return rows.map(toAdminProduct);
  } catch (error) {
    console.error("listAllProductsAction: no se pudo leer el catálogo", error);
    return [];
  }
}

export async function getAdminProductByIdAction(
  id: string,
): Promise<AdminProduct | null> {
  await requireAdmin();
  try {
    const row = await prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
    return row ? toAdminProduct(row) : null;
  } catch (error) {
    console.error(
      "getAdminProductByIdAction: no se pudo leer el producto",
      error,
    );
    return null;
  }
}

async function resolveCategoryId(
  category: CategoryLabel,
): Promise<string | null> {
  const row = await prisma.category.findUnique({
    where: { slug: CATEGORY_SLUG_BY_LABEL[category] },
  });
  return row?.id ?? null;
}

export async function createProductAction(
  input: AdminProductInput,
): Promise<AdminActionResult> {
  await requireAdmin();
  // El formulario admin ya exige "al menos una imagen" (product-form.tsx),
  // pero eso es solo del lado cliente — sin este chequeo, llamar la Server
  // Action directo permitiría guardar un producto con 0 imágenes, y el
  // resto del sitio (tarjetas, carrusel, checkout) asume product.images[0]
  // sin verificar.
  if (!input.images.length) {
    return { success: false, error: "Agregá al menos una imagen del producto." };
  }
  const categoryId = await resolveCategoryId(input.category);
  if (!categoryId) {
    return { success: false, error: "Categoría no encontrada." };
  }

  const existing = await prisma.product.findUnique({
    where: { slug: input.slug },
  });
  if (existing) {
    return { success: false, error: "Ya existe un producto con ese slug." };
  }

  const trimmedSku = input.sku?.trim() || null;
  if (trimmedSku && (await findSkuConflict(trimmedSku))) {
    return { success: false, error: "Ya existe otro producto con ese SKU." };
  }
  const sku = trimmedSku ?? (await generateSku(input.category));

  try {
    await prisma.product.create({
      data: {
        slug: input.slug,
        name: input.name,
        categoryId,
        priceValue: toCents(input.priceValue),
        discountPercent: clampDiscountPercent(input.discountPercent),
        color: input.color,
        description: input.description,
        featured: input.featured,
        sku,
        promotionalViews: Math.max(0, Math.trunc(input.promotionalViews || 0)),
        showViews: input.showViews,
        images: {
          create: input.images.map((image, position) => ({
            url: image.url,
            publicId: image.publicId,
            position,
          })),
        },
        variants: {
          create: input.sizes.map((size) => ({
            size,
            stock: DEFAULT_VARIANT_STOCK,
          })),
        },
      },
    });
    revalidatePath("/admin/productos");
    return { success: true };
  } catch (error) {
    console.error("createProductAction: no se pudo crear el producto", error);
    return { success: false, error: "No se pudo crear el producto." };
  }
}

export async function updateProductAction(
  id: string,
  input: AdminProductInput,
): Promise<AdminActionResult> {
  await requireAdmin();
  if (!input.images.length) {
    return { success: false, error: "Agregá al menos una imagen del producto." };
  }
  const categoryId = await resolveCategoryId(input.category);
  if (!categoryId) {
    return { success: false, error: "Categoría no encontrada." };
  }

  const conflict = await prisma.product.findFirst({
    where: { slug: input.slug, NOT: { id } },
  });
  if (conflict) {
    return { success: false, error: "Ya existe otro producto con ese slug." };
  }

  const trimmedSku = input.sku?.trim() || null;
  if (trimmedSku && (await findSkuConflict(trimmedSku, id))) {
    return { success: false, error: "Ya existe otro producto con ese SKU." };
  }
  const sku = trimmedSku ?? (await generateSku(input.category));

  // Se calcula antes del update qué publicId de Cloudinary desaparecen
  // (reemplazados o quitados) para poder borrarlos después de que Postgres
  // confirme el cambio — nunca antes, para no perder el asset si el update
  // falla.
  const existingImages = await prisma.productImage.findMany({
    where: { productId: id },
    select: { publicId: true },
  });
  const nextPublicIds = new Set(
    input.images.map((image) => image.publicId).filter(Boolean),
  );
  const removedPublicIds = existingImages
    .map((image) => image.publicId)
    .filter(
      (publicId): publicId is string =>
        Boolean(publicId) && !nextPublicIds.has(publicId),
    );

  try {
    await prisma.product.update({
      where: { id },
      data: {
        slug: input.slug,
        name: input.name,
        categoryId,
        priceValue: toCents(input.priceValue),
        discountPercent: clampDiscountPercent(input.discountPercent),
        color: input.color,
        description: input.description,
        featured: input.featured,
        sku,
        promotionalViews: Math.max(0, Math.trunc(input.promotionalViews || 0)),
        showViews: input.showViews,
        images: {
          // Las imágenes no tienen estado propio (a diferencia del stock):
          // se reemplazan enteras para respetar el orden nuevo.
          deleteMany: {},
          create: input.images.map((image, position) => ({
            url: image.url,
            publicId: image.publicId,
            position,
          })),
        },
        variants: {
          // upsert en vez de deleteMany+create: conserva el stock de las
          // tallas que siguen existiendo, solo quita las que ya no están
          // y crea las nuevas con el stock por defecto del seed.
          deleteMany: { size: { notIn: input.sizes } },
          upsert: input.sizes.map((size) => ({
            where: { productId_size: { productId: id, size } },
            create: { size, stock: DEFAULT_VARIANT_STOCK },
            update: {},
          })),
        },
      },
    });
    await cleanupRemovedCloudinaryAssets(removedPublicIds);
    revalidatePath("/admin/productos");
    return { success: true };
  } catch (error) {
    console.error(
      "updateProductAction: no se pudo actualizar el producto",
      error,
    );
    return { success: false, error: "No se pudo actualizar el producto." };
  }
}

// Código de Prisma para violación de FK (P2003/P2014): el producto tiene
// OrderItem asociado, que a propósito no tiene onDelete: Cascade — borrar
// pedidos históricos sería un bug, no una feature. En ese caso se archiva
// (Product.active = false) en vez de fallar: desaparece del catálogo,
// búsqueda y destacados, pero el pedido conserva su referencia.
function isForeignKeyConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ((error as { code?: string }).code === "P2003" ||
      (error as { code?: string }).code === "P2014")
  );
}

export async function deleteProductAction(
  id: string,
): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const images = await prisma.productImage.findMany({
      where: { productId: id },
      select: { publicId: true },
    });
    await prisma.product.delete({ where: { id } });
    await cleanupRemovedCloudinaryAssets(images.map((image) => image.publicId));
    return { success: true };
  } catch (error) {
    if (isForeignKeyConstraintError(error)) {
      try {
        await prisma.product.update({ where: { id }, data: { active: false } });
        return {
          success: false,
          error:
            "El producto tiene pedidos, carritos o favoritos asociados, así que no se puede eliminar sin perder ese historial. Se archivó en su lugar: ya no aparece en el catálogo ni en búsquedas.",
        };
      } catch (archiveError) {
        console.error(
          "deleteProductAction: no se pudo archivar el producto tras fallar el borrado",
          archiveError,
        );
      }
    }
    console.error(
      "deleteProductAction: no se pudo eliminar el producto",
      error,
    );
    return {
      success: false,
      error:
        "No se pudo eliminar: el producto tiene pedidos, carritos o favoritos asociados.",
    };
  }
}

// Toggle manual (además del archivado automático de deleteProductAction):
// deja al admin ocultar un producto del catálogo sin borrarlo, o reactivar
// uno que quedó archivado.
export async function toggleProductActiveAction(
  id: string,
  active: boolean,
): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    await prisma.product.update({ where: { id }, data: { active } });
    return { success: true };
  } catch (error) {
    console.error(
      "toggleProductActiveAction: no se pudo cambiar el estado del producto",
      error,
    );
    return { success: false, error: "No se pudo cambiar el estado del producto." };
  }
}
