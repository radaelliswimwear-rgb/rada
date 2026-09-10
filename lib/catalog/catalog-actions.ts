"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "lib/prisma";
import { fromSubunits, toSubunits } from "lib/currency/subunits";
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

const toEuros = fromSubunits;

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
    sku: row.sku,
    totalStock: row.variants.reduce((sum, variant) => sum + variant.stock, 0),
    sizeStock: Object.fromEntries(
      row.variants.map((variant) => [variant.size, variant.stock]),
    ),
    realViews: row.realViews,
    promotionalViews: row.promotionalViews,
    showViews: row.showViews,
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

  const where: Prisma.ProductWhereInput = { active: true };
  if (categorySlug) where.category = { slug: categorySlug };
  if (sizes.length > 0) where.variants = { some: { size: { in: sizes } } };
  if (colors.length > 0) where.color = { in: colors };
  if (priceBuckets.length > 0) {
    where.OR = priceBuckets.map((bucket) => ({
      priceValue: {
        gte: toSubunits(bucket.min),
        ...(bucket.max === Infinity ? {} : { lt: toSubunits(bucket.max) }),
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
      where: { featured: true, active: true },
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

// Usado por el carrito y favoritos (Sprint 18) para reconciliar líneas
// guardadas (solo productId) contra el catálogo real — nunca se confía en
// una copia vieja de nombre/precio/imagen guardada en localStorage.
export async function getProductsByIdsAction(
  ids: string[],
): Promise<PlaceholderProduct[]> {
  if (ids.length === 0) return [];
  try {
    const rows = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
      include: PRODUCT_INCLUDE,
    });
    return rows.map(toPlaceholderProduct);
  } catch (error) {
    console.error(
      "getProductsByIdsAction: no se pudieron leer los productos",
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
    return row && row.active ? toPlaceholderProduct(row) : null;
  } catch (error) {
    console.error("getProductBySlugAction: no se pudo leer el producto", error);
    return null;
  }
}

// "Inteligente" (Sprint 17) sin ML ni servicios externos: puntúa candidatos
// de la misma categoría por color igual (+2), precio dentro de un ±30% del
// producto actual (+1) y stock disponible en alguna talla (+1); ordena por
// puntaje y, entre empates, aleatoriza — así no siempre se ven los mismos
// "relacionados" (antes: primeros N de la categoría, sin orden). Se trae
// hasta 4x el límite pedido como candidatos para tener margen de puntaje
// sin traer la categoría entera si tiene muchos productos.
export async function listRelatedProductsAction(
  product: PlaceholderProduct,
  limit = 4,
): Promise<PlaceholderProduct[]> {
  try {
    const minPrice = product.priceValue * 0.7;
    const maxPrice = product.priceValue * 1.3;

    const rows = await prisma.product.findMany({
      where: {
        category: { slug: CATEGORY_SLUG_BY_LABEL[product.category] },
        id: { not: product.id },
        active: true,
      },
      take: limit * 4,
      include: PRODUCT_INCLUDE,
    });

    const scored = rows.map((row) => {
      let score = 0;
      if (row.color === product.color) score += 2;
      const priceEuros = toEuros(row.priceValue);
      if (priceEuros >= minPrice && priceEuros <= maxPrice) score += 1;
      if (row.variants.some((variant) => variant.stock > 0)) score += 1;
      return { row, score, sortKey: Math.random() };
    });

    scored.sort((a, b) => b.score - a.score || a.sortKey - b.sortKey);

    return scored.slice(0, limit).map(({ row }) => toPlaceholderProduct(row));
  } catch (error) {
    console.error(
      "listRelatedProductsAction: no se pudo leer relacionados",
      error,
    );
    return [];
  }
}

// Recomendaciones automáticas (Sprint 17) — usadas junto con el historial
// de "vistos recientemente" (client-side, lib/recently-viewed/) para armar
// una sección de "recomendados para vos" sin depender de ningún historial
// server-side por usuario/sesión. Heurística simple y honesta (no es un
// motor de ML): productos destacados de las categorías indicadas,
// excluyendo los ids ya vistos, con orden aleatorio.
export async function listRecommendedProductsAction(
  categories: CategoryLabel[],
  excludeIds: string[],
  limit = 4,
): Promise<PlaceholderProduct[]> {
  try {
    const slugs =
      categories.length > 0
        ? categories.map((label) => CATEGORY_SLUG_BY_LABEL[label])
        : Object.values(CATEGORY_SLUG_BY_LABEL);

    const rows = await prisma.product.findMany({
      where: {
        category: { slug: { in: slugs } },
        id: { notIn: excludeIds },
        active: true,
      },
      take: limit * 5,
      include: PRODUCT_INCLUDE,
    });

    const shuffled = rows
      .map((row) => ({ row, sortKey: Math.random() }))
      .sort((a, b) => a.sortKey - b.sortKey);

    return shuffled.slice(0, limit).map(({ row }) => toPlaceholderProduct(row));
  } catch (error) {
    console.error(
      "listRecommendedProductsAction: no se pudieron leer recomendaciones",
      error,
    );
    return [];
  }
}

const SEARCH_RESULT_LIMIT = 24;

// Búsqueda "inteligente" mejorada (Sprint 17): sigue sin full-text real
// (pg_trgm/tsvector quedan como mejora futura si el catálogo crece, ver
// docs/DATABASE.md) pero ahora rankea resultados en vez de devolverlos en
// el orden que Postgres los encuentre — coincidencia en el nombre primero
// (más relevante para quien busca un producto puntual), después color,
// después el resto — y limita a SEARCH_RESULT_LIMIT en vez de traer la
// tabla entera sin límite.
export async function searchProductsAction(
  query: string,
): Promise<PlaceholderProduct[]> {
  const normalized = query.trim();
  if (!normalized) return [];

  try {
    const rows = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: normalized, mode: "insensitive" } },
          { color: { contains: normalized, mode: "insensitive" } },
          { description: { contains: normalized, mode: "insensitive" } },
          { category: { name: { contains: normalized, mode: "insensitive" } } },
        ],
      },
      take: SEARCH_RESULT_LIMIT * 3,
      include: PRODUCT_INCLUDE,
    });

    const lowerQuery = normalized.toLowerCase();
    const scored = rows.map((row) => {
      const name = row.name.toLowerCase();
      let score = 0;
      if (name === lowerQuery) score = 3;
      else if (name.startsWith(lowerQuery)) score = 2;
      else if (name.includes(lowerQuery)) score = 1;
      return { row, score };
    });
    scored.sort((a, b) => b.score - a.score);

    return scored
      .slice(0, SEARCH_RESULT_LIMIT)
      .map(({ row }) => toPlaceholderProduct(row));
  } catch (error) {
    console.error("searchProductsAction: no se pudo buscar productos", error);
    return [];
  }
}

// Sugerencias para el autocompletado del buscador del Navbar (Sprint 17,
// components/layout/navbar/search.tsx): mismo criterio de ranking que
// searchProductsAction pero acotado a 5 resultados y a los campos mínimos
// que necesita el dropdown (evita traer imágenes/variantes completas).
export async function searchSuggestionsAction(
  query: string,
): Promise<
  { slug: string; name: string; image: string; priceValue: number }[]
> {
  const normalized = query.trim();
  if (normalized.length < 2) return [];

  try {
    const rows = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: normalized, mode: "insensitive" } },
          { color: { contains: normalized, mode: "insensitive" } },
        ],
      },
      take: 15,
      select: {
        slug: true,
        name: true,
        priceValue: true,
        images: { orderBy: { position: "asc" }, take: 1 },
      },
    });

    const lowerQuery = normalized.toLowerCase();
    const scored = rows.map((row) => {
      const name = row.name.toLowerCase();
      const score = name.startsWith(lowerQuery)
        ? 2
        : name.includes(lowerQuery)
          ? 1
          : 0;
      return { row, score };
    });
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 5).map(({ row }) => ({
      slug: row.slug,
      name: row.name,
      image: row.images[0]?.url ?? "",
      priceValue: toEuros(row.priceValue),
    }));
  } catch (error) {
    console.error(
      "searchSuggestionsAction: no se pudieron leer sugerencias",
      error,
    );
    return [];
  }
}

// Menú superior (Navbar), footer y "Categorías destacadas" del home leen
// esto en cada request para saber qué categorías mostrar — único lugar
// donde se decide esa visibilidad (Category.active, Panel Admin ->
// /admin/categorias). Orden fijo (no alfabético de la DB) para que la nav
// no reordene sola cuando se activa/desactiva algo.
const CATEGORY_DISPLAY_ORDER = Object.values(CATEGORY_SLUG_BY_LABEL);

export type ActiveCategoryRow = {
  slug: string;
  name: string;
  coverImageUrl: string | null;
  coverImageWidth: number | null;
  coverImageHeight: number | null;
  coverImagePosX: number;
  coverImagePosY: number;
  coverImageZoom: number;
  coverVideoUrl: string | null;
};

export async function listActiveCategoriesAction(): Promise<
  ActiveCategoryRow[]
> {
  try {
    const rows = await prisma.category.findMany({
      where: { active: true },
      select: {
        slug: true,
        name: true,
        coverImageUrl: true,
        coverImageWidth: true,
        coverImageHeight: true,
        coverImagePosX: true,
        coverImagePosY: true,
        coverImageZoom: true,
        coverVideoUrl: true,
      },
    });
    return rows
      .map((row) => ({
        slug: row.slug,
        name: row.name,
        coverImageUrl: row.coverImageUrl,
        coverImageWidth: row.coverImageWidth,
        coverImageHeight: row.coverImageHeight,
        coverImagePosX: row.coverImagePosX,
        coverImagePosY: row.coverImagePosY,
        coverImageZoom: row.coverImageZoom,
        coverVideoUrl: row.coverVideoUrl,
      }))
      .sort(
        (a, b) =>
          CATEGORY_DISPLAY_ORDER.indexOf(a.slug) -
          CATEGORY_DISPLAY_ORDER.indexOf(b.slug),
      );
  } catch (error) {
    console.error(
      "listActiveCategoriesAction: no se pudieron leer las categorías activas",
      error,
    );
    return [];
  }
}

// Banner real (Cloudinary) de una única categoría, para /[slug] (ver
// components/catalog/catalog-page.tsx) — cae a null si no se subió
// ninguno, y el banner usa PlaceholderArt en ese caso. Es un slot
// independiente de coverImageUrl (tarjeta del home): mismo motivo por el
// que no comparten foto, ver schema.prisma.
export type BannerImage = {
  url: string;
  width: number;
  height: number;
  posX: number;
  posY: number;
  zoom: number;
} | null;

export async function getCategoryBannerImageAction(
  slug: string,
): Promise<BannerImage> {
  try {
    const row = await prisma.category.findUnique({
      where: { slug },
      select: {
        bannerImageUrl: true,
        bannerImageWidth: true,
        bannerImageHeight: true,
        bannerImagePosX: true,
        bannerImagePosY: true,
        bannerImageZoom: true,
      },
    });
    if (!row?.bannerImageUrl || !row.bannerImageWidth || !row.bannerImageHeight) {
      return null;
    }
    return {
      url: row.bannerImageUrl,
      width: row.bannerImageWidth,
      height: row.bannerImageHeight,
      posX: row.bannerImagePosX,
      posY: row.bannerImagePosY,
      zoom: row.bannerImageZoom,
    };
  } catch (error) {
    console.error(
      "getCategoryBannerImageAction: no se pudo leer el banner",
      error,
    );
    return null;
  }
}

export async function listProductSlugsAction(): Promise<string[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { active: true },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  } catch (error) {
    console.error(
      "listProductSlugsAction: no se pudieron leer los slugs",
      error,
    );
    return [];
  }
}
