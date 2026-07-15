import { baseUrl } from "lib/utils";

// Sprint 17: se agregan disallow para secciones privadas/transaccionales
// (panel, cuenta, checkout, favoritos, API) — no aportan nada indexadas y
// /admin, /cuenta no deberían aparecer en buscadores por privacidad.
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/admin", "/cuenta", "/checkout", "/favoritos", "/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
