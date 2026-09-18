// Lógica pura de armado del JSON-LD Product (SEO técnico, sep. 2026) --
// separada de app/producto/[slug]/page.tsx a propósito, mismo patrón que
// computeCartDisplayStatus/computeInternalTrafficStatus: para poder
// probarla sin renderizar la ruta ni tocar Prisma.
//
// Nunca inventa: sin reviews/ratings/aggregateRating/GTIN/MPN (no existen
// en el modelo de datos), sin sku fabricado (se omite si no hay uno real).
export type ProductJsonLdInput = {
  name: string;
  description: string;
  images: string[];
  sku?: string | null;
  color: string;
  category: string;
  priceValue: number;
  totalStock?: number;
  slug: string;
  siteUrl: string;
};

export function buildProductJsonLd(
  input: ProductJsonLdInput,
): Record<string, unknown> {
  const inStock = (input.totalStock ?? 0) > 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.images,
    ...(input.sku ? { sku: input.sku } : {}),
    color: input.color,
    category: input.category,
    offers: {
      "@type": "Offer",
      url: `${input.siteUrl}/producto/${input.slug}`,
      priceCurrency: "COP",
      price: input.priceValue.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

export type BreadcrumbJsonLdInput = {
  siteUrl: string;
  categoryLabel: string;
  categorySlug: string;
  productName: string;
  productSlug: string;
};

export function buildProductBreadcrumbJsonLd(
  input: BreadcrumbJsonLdInput,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: input.siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: input.categoryLabel,
        item: `${input.siteUrl}/${input.categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: input.productName,
        item: `${input.siteUrl}/producto/${input.productSlug}`,
      },
    ],
  };
}
