import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // ppr (Partial Prerendering) desactivado: causaba un error real de
    // hidratación en producción (React #418) en el home — el "molde"
    // estático generado en el build y la parte dinámica que arma cada
    // visita no coincidían, obligando al navegador a descartar todo el
    // HTML del servidor y volver a renderizar de cero (recursos
    // duplicados, fuentes en 404, carga más lenta). No se reproduce en
    // `next dev` porque PPR solo actúa distinto en build de producción.
    // Es una función experimental de Next.js; el ahorro que daba no
    // compensa el bug real que causaba.
    // inlineCss (Next.js inserta el CSS directo en el <head> en vez de un
    // <link> a archivo aparte) también desactivado: las fuentes usan rutas
    // relativas dentro del CSS (url(../media/...)) pensadas para
    // resolverse desde /_next/static/css/, pero al quedar el CSS pegado
    // en el HTML, el navegador las resuelve relativas a la página
    // (dominio.com/media/... en vez de dominio.com/_next/static/media/...)
    // y las fuentes tiran 404. Mismo criterio que ppr: experimental y no
    // vale la pena el problema que causa.
    useCache: true,
    // Server Actions tienen un límite de body de 1 MB por defecto — muy poco
    // para subir imágenes de producto (hasta 50 MB, ver lib/cloudinary/types.ts)
    // desde components/admin/product-image-manager.tsx.
    serverActions: {
      bodySizeLimit: "55mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
