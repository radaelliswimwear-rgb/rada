import type { MetadataRoute } from "next";
import { blogRepository } from "lib/blog/blog-repository";
import { catalogRepository } from "lib/catalog/catalog-repository";
import { getAppBaseUrl } from "lib/utils";

// Reemplaza el sitemap heredado del template (Sprint 17): el original leía
// de lib/shopify (getCollections/getProducts/getPages) y llamaba a
// validateEnvironmentVariables(), que tira si no hay credenciales de
// Shopify configuradas — como no las hay en este proyecto, /sitemap.xml
// devolvía 500 siempre. Ahora lee del catálogo real (Postgres/Prisma).
//
// SEO técnico (auditoría de septiembre 2026): completado para incluir las
// páginas legales/informativas públicas reales y `lastModified` real
// (Product.updatedAt / BlogPost.updatedAt, nunca "hoy" inventado en cada
// request -- ver listSitemapProductsAction/listSitemapPostsAction).
//
// Deliberadamente NO incluye /hombre /mujer /ninos /calzado: siguen siendo
// rutas reales y accesibles (ver lib/catalog/types.ts), pero están
// "archivadas" de la navegación/home tras el rebrand -- no aportan valor
// como páginas que el sitio le pida a Google que priorice. Tampoco incluye
// /buscar (noindex propio, ver app/buscar/page.tsx), ni ninguna ruta
// privada/transaccional (checkout, cuenta, admin, interno, api) -- esas
// nunca se listan acá, no requieren exclusión explícita porque este archivo
// solo agrega lo que sí quiere ofrecer.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppBaseUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/accesorios`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/oasis-natural`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/aurora-viva`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/espuma-de-ola`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/salidas-de-bano`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.6 },
    // Páginas legales/informativas públicas reales -- sin fecha de
    // modificación fiable conocida (no se inventa "hoy" en cada request).
    { url: `${baseUrl}/envios`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/devoluciones`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/garantia`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terminos`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${baseUrl}/privacidad`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${baseUrl}/cookies`, changeFrequency: "monthly", priority: 0.2 },
  ];

  const [products, posts] = await Promise.all([
    catalogRepository.listSitemapProducts(),
    blogRepository.listSitemapPosts(),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/producto/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
