import { getAppBaseUrl } from "lib/utils";

// Sprint 17: se agregan disallow para secciones privadas/transaccionales
// (panel, cuenta, checkout, favoritos, API) — no aportan nada indexadas y
// /admin, /cuenta no deberían aparecer en buscadores por privacidad.
export default function robots() {
  const baseUrl = getAppBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/admin",
          "/cuenta",
          "/checkout",
          "/favoritos",
          "/api",
          "/interno",
          // SEO técnico (sep. 2026): /buscar ya tenía noindex propio (ver
          // app/buscar/page.tsx) pero faltaba acá -- sin esto, un bot podía
          // igual gastar crawl budget en las miles de combinaciones
          // ?q=... antes de leer el noindex de cada una.
          "/buscar",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
