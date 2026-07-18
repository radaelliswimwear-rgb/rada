"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "lib/prisma";
import {
  CATEGORY_LABEL_BY_SLUG,
  CATEGORY_SLUG_BY_LABEL,
  type CategoryLabel,
} from "lib/catalog/types";
import { deleteCloudinaryAssetAction } from "lib/cloudinary/upload-actions";
import { fromSubunits, toSubunits } from "lib/currency/subunits";
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

  try {
    await prisma.product.create({
      data: {
        slug: input.slug,
        name: input.name,
        categoryId,
        priceValue: toCents(input.priceValue),
        color: input.color,
        description: input.description,
        featured: input.featured,
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
        color: input.color,
        description: input.description,
        featured: input.featured,
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
    return { success: true };
  } catch (error) {
    console.error(
      "updateProductAction: no se pudo actualizar el producto",
      error,
    );
    return { success: false, error: "No se pudo actualizar el producto." };
  }
}

export async function deleteProductAction(
  id: string,
): Promise<AdminActionResult> {
  try {
    const images = await prisma.productImage.findMany({
      where: { productId: id },
      select: { publicId: true },
    });
    await prisma.product.delete({ where: { id } });
    await cleanupRemovedCloudinaryAssets(images.map((image) => image.publicId));
    return { success: true };
  } catch (error) {
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
