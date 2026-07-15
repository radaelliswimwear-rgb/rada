"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "lib/prisma";
import { CATEGORY_SLUG_BY_LABEL, type CategoryLabel } from "lib/catalog/types";
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

function toEuros(cents: number): number {
  return cents / 100;
}

function toCents(euros: number): number {
  return Math.round(euros * 100);
}

function toAdminProduct(row: ProductWithRelations): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category.name as CategoryLabel,
    priceValue: toEuros(row.priceValue),
    color: row.color,
    description: row.description,
    featured: row.featured,
    images: row.images.map((image) => image.url),
    variants: row.variants.map((variant) => ({
      size: variant.size,
      stock: variant.stock,
    })),
    createdAt: row.createdAt.toISOString(),
  };
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
          create: input.images.map((url, position) => ({ url, position })),
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
          create: input.images.map((url, position) => ({ url, position })),
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
    await prisma.product.delete({ where: { id } });
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
