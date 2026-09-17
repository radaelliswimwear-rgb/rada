import type { NextConfig } from "next";

// Auditoría de seguridad (Sprint 29): headers ausentes por completo antes.
// CSP deliberadamente conservador — Next.js App Router inyecta sus propios
// <script> inline para hidratación/streaming, y esta app no tiene todavía
// un middleware que genere un nonce por request y se lo pase a Next.js
// (posible, pero requiere su propio testeo dedicado para no romper el
// checkout — ver reporte de la auditoría). Por eso script-src/style-src
// mantienen 'unsafe-inline' en vez de bloquear inline por completo: igual
// sirve para lo más importante, que es que el navegador NUNCA cargue un
// <script src="https://dominio-ajeno..."> inyectado por un XSS. connect-src
// no necesita wompi.co: la tokenización de tarjeta pasa siempre por el
// servidor (ver lib/payments/providers/wompi-gateway.ts), el navegador
// nunca llama a la API de Wompi directo.
// En desarrollo, Turbopack abre un WebSocket propio (Hot Module Reload) a
// ws://localhost:<puerto> — sin esto en connect-src, el navegador lo
// bloquea en silencio y el auto-refresh del `next dev` deja de funcionar.
// No aplica en producción (no hay HMR ahí), así que no relaja nada real.
const DEV_CONNECT_SRC = process.env.NODE_ENV === "development" ? " ws://localhost:*" : "";

// Fase 0 analytics foundation: este es el único lugar donde se debe extender
// script-src/connect-src/img-src cuando GA4, Meta Pixel/CAPI u otro tracker
// se instale de verdad en una fase posterior. Hasta entonces, este array
// debe quedar libre de dominios de terceros de tracking (least privilege) —
// ver lib/security/csp.test.ts, que falla si alguno se cuela sin querer.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com https://cdn.shopify.com",
  // Los videos del home/categorías (portada, banners) se sirven directo
  // desde Cloudinary vía <video src="https://res.cloudinary.com/..."> — a
  // diferencia de las imágenes, no pasan por el proxy de next/image, así
  // que sin este media-src el navegador los bloquea (ver
  // components/admin/settings-manager.tsx, Category.coverVideoUrl).
  "media-src 'self' https://res.cloudinary.com",
  "font-src 'self' data:",
  `connect-src 'self'${DEV_CONNECT_SRC}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
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
