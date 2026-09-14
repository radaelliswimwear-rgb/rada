"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "lib/prisma";
import { fromSubunits, toSubunits } from "lib/currency/subunits";
import { computeDiscountedPrice } from "lib/pricing/discount";
import { getSitewideDiscountPercentAction } from "lib/pricing/discount-actions";
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

// sitewideDiscountPercent (Sprint 25): quien llama a esta función lo trae
// con UNA sola consulta a Settings (ver getSitewideDiscountPercentAction)
// hecha en paralelo con su propia consulta de productos, nunca una por
// producto — toPlaceholderProduct se llama en bucle sobre listados enteros.
// priceValue pasa a ser el precio FINAL (ya con el descuento aplicado, si
// hay uno activo); originalPriceValue conserva el precio de lista para el
// tachado, y activeDiscountPercent es 0 cuando no hay descuento vigente.
// Precedencia (nunca se acumulan): descuento propio del producto > de su
// categoría > del sitio completo — ver lib/pricing/discount.ts.
function toPlaceholderProduct(
  row: ProductWithRelations,
  sitewideDiscountPercent: number,
): PlaceholderProduct {
  const category = row.category.name as CategoryLabel;
  const { priceValue, originalPriceValue, activeDiscountPercent } =
    computeDiscountedPrice(row.priceValue, {
      productDiscountPercent: row.discountPercent,
      categoryDiscountPercent: row.category.discountPercent,
      sitewideDiscountPercent,
    });
  const euros = toEuros(priceValue);
  const originalEuros = toEuros(originalPriceValue);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category,
    price: euros.toFixed(2).replace(".", ","),
    priceValue: euros,
    originalPriceValue: originalEuros,
    activeDiscountPercent,
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

// excludeSlugs (Sprint 22): opcional y vacío por defecto — SunsetCollection
// (home) lo usa para no repetir prendas con las otras vidrieras del home,
// ver app/page.tsx. Las páginas de catálogo real (/[categoria]) no lo pasan,
// así que su comportamiento de paginación/orden no cambia en nada.
export async function listCatalogProductsAction(
  category: CategoryLabel,
  params: CatalogSearchParams,
  page: number,
  pageSize: number,
  excludeSlugs: string[] = [],
): Promise<CatalogListResult> {
  const where = buildWhere(CATEGORY_SLUG_BY_LABEL[category], params);
  if (excludeSlugs.length > 0) where.slug = { notIn: excludeSlugs };
  const orderBy = buildOrderBy(
    typeof params.orden === "string" ? params.orden : undefined,
  );

  try {
    const [rows, total, sitewideDiscountPercent] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: PRODUCT_INCLUDE,
      }),
      prisma.product.count({ where }),
      getSitewideDiscountPercentAction(),
    ]);
    return {
      products: rows.map((row) =>
        toPlaceholderProduct(row, sitewideDiscountPercent),
      ),
      total,
    };
  } catch (error) {
    console.error(
      "listCatalogProductsAction: no se pudo leer el catálogo",
      error,
    );
    return { products: [], total: 0 };
  }
}

// Mínimo de prendas por vidriera (Sprint 24): la fundadora pidió que
// "Productos destacados" y "Recomendado para vos" muestren al menos 7
// prendas cada una, sin repetirse entre sí. "featured" depende de cuántos
// productos tenga el flag Product.featured=true y de cuántos ya usó Sunset
// antes — puede no alcanzar 7 por sí solo, ver relleno más abajo.
const FEATURED_MIN_COUNT = 7;

// excludeSlugs (Sprint 22): permite que app/page.tsx pida esto DESPUÉS de
// "La belleza de sentirte tú" y le pase los slugs ya usados, para que
// ninguna prenda aparezca en dos vidrieras del home a la vez — ver
// comentario en app/page.tsx. Vacío por defecto para no afectar a otros
// llamadores.
export async function listFeaturedProductsAction(
  excludeSlugs: string[] = [],
): Promise<PlaceholderProduct[]> {
  try {
    const [featuredRows, sitewideDiscountPercent] = await Promise.all([
      prisma.product.findMany({
        where: {
          featured: true,
          active: true,
          ...(excludeSlugs.length > 0 ? { slug: { notIn: excludeSlugs } } : {}),
        },
        include: PRODUCT_INCLUDE,
      }),
      getSitewideDiscountPercentAction(),
    ]);

    let rows = featuredRows;

    // Relleno (Sprint 24): si los destacados disponibles (ya sin los que
    // usó Sunset) no llegan a FEATURED_MIN_COUNT, se completa con otros
    // productos activos no destacados (mismas exclusiones) para que la
    // sección nunca se vea corta o casi vacía.
    if (rows.length < FEATURED_MIN_COUNT) {
      const missing = FEATURED_MIN_COUNT - rows.length;
      const usedSlugs = [...excludeSlugs, ...rows.map((row) => row.slug)];
      const fillerRows = await prisma.product.findMany({
        where: { active: true, slug: { notIn: usedSlugs } },
        take: missing * 5,
        include: PRODUCT_INCLUDE,
      });
      const shuffledFiller = fillerRows
        .map((row) => ({ row, sortKey: Math.random() }))
        .sort((a, b) => a.sortKey - b.sortKey)
        .slice(0, missing)
        .map(({ row }) => row);
      rows = [...rows, ...shuffledFiller];
    }

    // Barajado (Sprint 22): "destacados" es una selección curada sin orden
    // significativo (solo el flag Product.featured), así que mezclar en
    // cada visita hace que el home se sienta distinto entre sesiones en
    // vez de mostrar siempre las mismas 4 primeras — mismo patrón de
    // Math.random() que listRecommendedProductsAction más abajo.
    const shuffled = rows
      .map((row) => ({ row, sortKey: Math.random() }))
      .sort((a, b) => a.sortKey - b.sortKey);
    return shuffled.map(({ row }) =>
      toPlaceholderProduct(row, sitewideDiscountPercent),
    );
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
    const [rows, sitewideDiscountPercent] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: ids }, active: true },
        include: PRODUCT_INCLUDE,
      }),
      getSitewideDiscountPercentAction(),
    ]);
    return rows.map((row) => toPlaceholderProduct(row, sitewideDiscountPercent));
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
    const [row, sitewideDiscountPercent] = await Promise.all([
      prisma.product.findUnique({
        where: { slug },
        include: PRODUCT_INCLUDE,
      }),
      getSitewideDiscountPercentAction(),
    ]);
    return row && row.active
      ? toPlaceholderProduct(row, sitewideDiscountPercent)
      : null;
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

    const [rows, sitewideDiscountPercent] = await Promise.all([
      prisma.product.findMany({
        where: {
          category: { slug: CATEGORY_SLUG_BY_LABEL[product.category] },
          id: { not: product.id },
          active: true,
        },
        take: limit * 4,
        include: PRODUCT_INCLUDE,
      }),
      getSitewideDiscountPercentAction(),
    ]);

    const scored = rows.map((row) => {
      let score = 0;
      if (row.color === product.color) score += 2;
      const priceEuros = toEuros(row.priceValue);
      if (priceEuros >= minPrice && priceEuros <= maxPrice) score += 1;
      if (row.variants.some((variant) => variant.stock > 0)) score += 1;
      return { row, score, sortKey: Math.random() };
    });

    scored.sort((a, b) => b.score - a.score || a.sortKey - b.sortKey);

    return scored
      .slice(0, limit)
      .map(({ row }) => toPlaceholderProduct(row, sitewideDiscountPercent));
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
// excludeSlugs, no excludeIds (Sprint 22, corrige bug): recently-viewed
// solo guarda slugs en localStorage (RecentlyViewedItem no tiene el id de
// Postgres, ver lib/recently-viewed/storage.ts), así que filtrar por
// `id: { notIn: ... }` con esos valores nunca coincidía con nada — la
// exclusión de "ya lo viste" no hacía nada en la práctica. Ahora también
// recibe los slugs de las otras vidrieras del home (ver app/page.tsx) para
// no repetir prenda ahí tampoco.
export async function listRecommendedProductsAction(
  categories: CategoryLabel[],
  excludeSlugs: string[],
  limit = 7,
): Promise<PlaceholderProduct[]> {
  try {
    const slugs =
      categories.length > 0
        ? categories.map((label) => CATEGORY_SLUG_BY_LABEL[label])
        : Object.values(CATEGORY_SLUG_BY_LABEL);

    const [initialRows, sitewideDiscountPercent] = await Promise.all([
      prisma.product.findMany({
        where: {
          category: { slug: { in: slugs } },
          slug: { notIn: excludeSlugs },
          active: true,
        },
        take: limit * 5,
        include: PRODUCT_INCLUDE,
      }),
      getSitewideDiscountPercentAction(),
    ]);
    let rows = initialRows;

    // Relleno (Sprint 24): con historial de "vistos recientemente" acotado
    // a pocas categorías, filtrar solo por esas puede dejar menos de
    // `limit` candidatos. Se completa con el resto del catálogo (mismas
    // exclusiones) para no mostrar una sección más corta que las otras —
    // la preferencia por categorías vistas sigue ganando cuando alcanza.
    if (rows.length < limit && categories.length > 0) {
      const missing = limit - rows.length;
      const usedSlugs = [...excludeSlugs, ...rows.map((row) => row.slug)];
      const fillerRows = await prisma.product.findMany({
        where: { slug: { notIn: usedSlugs }, active: true },
        take: missing * 5,
        include: PRODUCT_INCLUDE,
      });
      rows = [...rows, ...fillerRows];
    }

    const shuffled = rows
      .map((row) => ({ row, sortKey: Math.random() }))
      .sort((a, b) => a.sortKey - b.sortKey);

    return shuffled
      .slice(0, limit)
      .map(({ row }) => toPlaceholderProduct(row, sitewideDiscountPercent));
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
    const [rows, sitewideDiscountPercent] = await Promise.all([
      prisma.product.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: normalized, mode: "insensitive" } },
            { color: { contains: normalized, mode: "insensitive" } },
            { description: { contains: normalized, mode: "insensitive" } },
            {
              category: { name: { contains: normalized, mode: "insensitive" } },
            },
          ],
        },
        take: SEARCH_RESULT_LIMIT * 3,
        include: PRODUCT_INCLUDE,
      }),
      getSitewideDiscountPercentAction(),
    ]);

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
      .map(({ row }) => toPlaceholderProduct(row, sitewideDiscountPercent));
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
    const [rows, sitewideDiscountPercent] = await Promise.all([
      prisma.product.findMany({
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
          discountPercent: true,
          category: { select: { discountPercent: true } },
          images: { orderBy: { position: "asc" }, take: 1 },
        },
      }),
      getSitewideDiscountPercentAction(),
    ]);

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

    return scored.slice(0, 5).map(({ row }) => {
      const { priceValue } = computeDiscountedPrice(row.priceValue, {
        productDiscountPercent: row.discountPercent,
        categoryDiscountPercent: row.category.discountPercent,
        sitewideDiscountPercent,
      });
      return {
        slug: row.slug,
        name: row.name,
        image: row.images[0]?.url ?? "",
        priceValue: toEuros(priceValue),
      };
    });
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
// components/catalog/catalog-page.tsx) — cae a PlaceholderArt si no hay ni
// imagen ni video. Es un slot independiente de coverImageUrl (tarjeta del
// home): mismo motivo por el que no comparten foto, ver schema.prisma.
export type BannerImage = {
  url: string;
  width: number;
  height: number;
  posX: number;
  posY: number;
  zoom: number;
} | null;

// videoUrl (Sprint 23): el video no necesita ancho/alto/encuadre (se sirve
// a pantalla completa vía object-fit:cover), así que viaja aparte de
// BannerImage — image sigue existiendo como poster del video y como diseño
// de respaldo si se lo quita.
export type CategoryBannerContent = {
  image: BannerImage;
  videoUrl: string | null;
};

export async function getCategoryBannerImageAction(
  slug: string,
): Promise<CategoryBannerContent> {
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
        bannerVideoUrl: true,
      },
    });
    const image =
      row?.bannerImageUrl && row.bannerImageWidth && row.bannerImageHeight
        ? {
            url: row.bannerImageUrl,
            width: row.bannerImageWidth,
            height: row.bannerImageHeight,
            posX: row.bannerImagePosX,
            posY: row.bannerImagePosY,
            zoom: row.bannerImageZoom,
          }
        : null;
    return { image, videoUrl: row?.bannerVideoUrl ?? null };
  } catch (error) {
    console.error(
      "getCategoryBannerImageAction: no se pudo leer el banner",
      error,
    );
    return { image: null, videoUrl: null };
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
