import type { MetadataRoute } from "next";
import { blogRepository } from "lib/blog/blog-repository";
import { catalogRepository } from "lib/catalog/catalog-repository";
import { baseUrl } from "lib/utils";

// Reemplaza el sitemap heredado del template (Sprint 17): el original leía
// de lib/shopify (getCollections/getProducts/getPages) y llamaba a
// validateEnvironmentVariables(), que tira si no hay credenciales de
// Shopify configuradas — como no las hay en este proyecto, /sitemap.xml
// devolvía 500 siempre. Ahora lee del catálogo real (Postgres/Prisma).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/accesorios`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/oasis-natural`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/aurora-viva`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/espuma-de-ola`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/salidas-de-bano`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.6 },
  ];

  const [slugs, posts] = await Promise.all([
    catalogRepository.listSlugs(),
    blogRepository.listSlugs(),
  ]);

  const productRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${baseUrl}/producto/${slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
