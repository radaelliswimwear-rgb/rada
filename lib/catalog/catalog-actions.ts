"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "lib/prisma";
import {
  PRICE_BUCKETS,
  toArray,
  type CatalogSearchParams,
  type PlaceholderProduct,
} from "lib/placeholder-data";
import {
  CATEGORY_SLUG_BY_LABEL,
  toneForCategory,
  type CatalogListResult,
  type CategoryLabel,
} from "./types";

// Server Actions Prisma/Postgres para el catálogo (Sprint 13). Devuelven
// objetos con la misma forma que PlaceholderProduct para que
// components/catalog/*, components/product-detail/* y components/home/*
// no cambien — solo cambia de dónde vienen los datos.
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

function toPlaceholderProduct(row: ProductWithRelations): PlaceholderProduct {
  const category = row.category.name as CategoryLabel;
  const euros = toEuros(row.priceValue);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category,
    price: euros.toFixed(2).replace(".", ","),
    priceValue: euros,
    tone: toneForCategory(category),
    sizes: row.variants.map((variant) => variant.size),
    color: row.color,
    description: row.description,
    images: row.images.map((image) => image.url),
    featured: row.featured,
  };
}

function buildWhere(
  categorySlug: string | undefined,
  params: CatalogSearchParams,
): Prisma.ProductWhereInput {
  const sizes = toArray(params.talla);
  const colors = toArray(params.color);
  const priceBucketIds = toArray(params.precio);
  const priceBuckets = PRICE_BUCKETS.filter((bucket) =>
    priceBucketIds.includes(bucket.id),
  );

  const where: Prisma.ProductWhereInput = {};
  if (categorySlug) where.category = { slug: categorySlug };
  if (sizes.length > 0) where.variants = { some: { size: { in: sizes } } };
  if (colors.length > 0) where.color = { in: colors };
  if (priceBuckets.length > 0) {
    where.OR = priceBuckets.map((bucket) => ({
      priceValue: {
        gte: Math.round(bucket.min * 100),
        ...(bucket.max === Infinity
          ? {}
          : { lt: Math.round(bucket.max * 100) }),
      },
    }));
  }
  return where;
}

function buildOrderBy(
  sort: string | undefined,
): Prisma.ProductOrderByWithRelationInput {
  if (sort === "precio-asc") return { priceValue: "asc" };
  if (sort === "precio-desc") return { priceValue: "desc" };
  return { createdAt: "asc" };
}

export async function listCatalogProductsAction(
  category: CategoryLabel,
  params: CatalogSearchParams,
  page: number,
  pageSize: number,
): Promise<CatalogListResult> {
  const where = buildWhere(CATEGORY_SLUG_BY_LABEL[category], params);
  const orderBy = buildOrderBy(
    typeof params.orden === "string" ? params.orden : undefined,
  );

  try {
    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: PRODUCT_INCLUDE,
      }),
      prisma.product.count({ where }),
    ]);
    return { products: rows.map(toPlaceholderProduct), total };
  } catch (error) {
    console.error(
      "listCatalogProductsAction: no se pudo leer el catálogo",
      error,
    );
    return { products: [], total: 0 };
  }
}

export async function listFeaturedProductsAction(): Promise<
  PlaceholderProduct[]
> {
  try {
    const rows = await prisma.product.findMany({
      where: { featured: true },
      orderBy: { createdAt: "asc" },
      include: PRODUCT_INCLUDE,
    });
    return rows.map(toPlaceholderProduct);
  } catch (error) {
    console.error(
      "listFeaturedProductsAction: no se pudo leer destacados",
      error,
    );
    return [];
  }
}

export async function getProductBySlugAction(
  slug: string,
): Promise<PlaceholderProduct | null> {
  try {
    const row = await prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_INCLUDE,
    });
    return row ? toPlaceholderProduct(row) : null;
  } catch (error) {
    console.error("getProductBySlugAction: no se pudo leer el producto", error);
    return null;
  }
}

export async function listRelatedProductsAction(
  product: PlaceholderProduct,
  limit = 4,
): Promise<PlaceholderProduct[]> {
  try {
    const rows = await prisma.product.findMany({
      where: {
        category: { slug: CATEGORY_SLUG_BY_LABEL[product.category] },
        id: { not: product.id },
      },
      take: limit,
      include: PRODUCT_INCLUDE,
    });
    return rows.map(toPlaceholderProduct);
  } catch (error) {
    console.error(
      "listRelatedProductsAction: no se pudo leer relacionados",
      error,
    );
    return [];
  }
}

export async function searchProductsAction(
  query: string,
): Promise<PlaceholderProduct[]> {
  const normalized = query.trim();
  if (!normalized) return [];

  try {
    const rows = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: normalized, mode: "insensitive" } },
          { color: { contains: normalized, mode: "insensitive" } },
          { description: { contains: normalized, mode: "insensitive" } },
          { category: { name: { contains: normalized, mode: "insensitive" } } },
        ],
      },
      include: PRODUCT_INCLUDE,
    });
    return rows.map(toPlaceholderProduct);
  } catch (error) {
    console.error("searchProductsAction: no se pudo buscar productos", error);
    return [];
  }
}

export async function listProductSlugsAction(): Promise<string[]> {
  try {
    const rows = await prisma.product.findMany({ select: { slug: true } });
    return rows.map((row) => row.slug);
  } catch (error) {
    console.error(
      "listProductSlugsAction: no se pudieron leer los slugs",
      error,
    );
    return [];
  }
}
