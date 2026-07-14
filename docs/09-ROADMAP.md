# 09 · Roadmap — de template vacío a ecommerce premium de ropa

Punto de partida: **100% del código es el template oficial `vercel/commerce` sin personalizar**, sin tienda Shopify conectada. No es una migración que rompe algo existente — es construir sobre una base sólida y probada.

## Fase 0 — Fundaciones (sin tocar UI)

- [ ] Crear/confirmar tienda Shopify y generar credenciales de Storefront API.
- [ ] Completar `.env`: `SITE_NAME`, `COMPANY_NAME`, `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_REVALIDATION_SECRET`.
- [ ] Modelar catálogo en Shopify Admin: colecciones (ej. Mujer / Hombre / Nuevo / Rebajas), productos de tipo ropa con opciones (Talla, Color), metafields si se necesitan (material, guía de tallas, origen).
- [ ] Configurar menús en Shopify (`next-js-frontend-header-menu`, `next-js-frontend-footer-menu`) — ya consumidos por el código, no requieren cambios.
- [ ] Configurar colecciones especiales que ya espera el código: `hidden-homepage-featured-items` (3+ productos, home), `hidden-homepage-carousel` (carrusel).
- [ ] Configurar webhook de Shopify (`products/*`, `collections/*`) apuntando a `/api/revalidate?secret=...`.

## Fase 1 — Identidad de marca

- [ ] Logo real: `components/icons/logo.tsx`, `components/logo-square.tsx`.
- [ ] Favicon (`app/favicon.ico`) y OG images de marca.
- [ ] Definir paleta de color de marca y reemplazar el acento `blue-600` genérico en todo el código (ver [07-STYLING.md](./07-STYLING.md) para el inventario de usos).
- [ ] Tipografía definitiva (evaluar si `Geist` se mantiene o se reemplaza por una fuente editorial acorde a "premium").
- [ ] Eliminar contenido promocional del template: `WelcomeToast`, enlaces "Deploy on Vercel" / "View the source" en el footer.
- [ ] Metadata global (`app/layout.tsx`) con copy de marca real.

## Fase 2 — Experiencia de producto (crítico en moda)

- [ ] Rediseñar `Gallery` (`components/product/gallery.tsx`): zoom, posible soporte de video, más miniaturas visibles.
- [ ] Rediseñar `VariantSelector`: swatches de color reales (no solo texto), guía de tallas integrada.
- [ ] Extender `ProductDescription`: tabs de composición/cuidado/envíos-devoluciones, tabla de tallas.
- [ ] Evaluar "quick add" desde grillas (sin entrar a la ficha completa).
- [ ] Curar cross-sell: hoy `getProductRecommendations` es automático de Shopify; evaluar si se necesita lógica propia de merchandising.

## Fase 3 — Descubrimiento y navegación

- [ ] Rediseñar `Grid`/`GridTileImage` con estética editorial (más aire, hover con segunda foto de producto).
- [ ] Filtros reales por atributo (talla, color, precio, categoría): hoy `FilterList` solo resuelve **orden** (`sorting`) y **colecciones** (`Collections`), no filtros combinables de atributos — requiere extender `getCollectionProductsQuery`/`getProductsQuery` y probablemente usar `productFilters` de la Storefront API.
- [ ] Mejorar `Search` (navbar): autocompletado, sugerencias, resultados en vivo.

## Fase 4 — Home y storytelling editorial

- [ ] Reemplazar `ThreeItemGrid`/`Carousel` genéricos por secciones editoriales: hero de campaña, lookbook, historia de marca, banners por colección.
- [ ] Evaluar necesidad de CMS ligero adicional si las páginas simples de Shopify (`app/[page]`) se quedan cortas para contenido editorial rico (antes de sumar una dependencia nueva, confirmar que Shopify Pages/metaobjects no alcanza).

## Fase 5 — Conversión y confianza (específico de moda premium)

- [ ] Guía de tallas interactiva (modal o panel lateral).
- [ ] Badges de stock bajo / agotado en `GridTileImage` y `ProductDescription`.
- [ ] Wishlist — **no existe hoy**, requiere nuevo estado de cliente y probablemente persistencia (cookie, metafield de cliente, o servicio externo).
- [ ] Reviews/ratings — requiere integración externa (ej. Judge.me, Loox) vía Shopify, no está contemplado en el template base.
- [ ] Revisar diseño del checkout de Shopify (o Shopify Checkout Extensibility) para alinear con la identidad de marca — el checkout en sí queda fuera del código de este repo (`redirectToCheckout` solo hace `redirect(cart.checkoutUrl)`).

## Fase 6 — Performance, SEO y QA

- [ ] Auditar Core Web Vitals con PPR activo; validar tamaños/formatos reales de imágenes de producto (`avif`/`webp` ya configurados).
- [ ] `sitemap.ts`/`robots.ts` ya cubren SEO técnico base; ampliar structured data (`schema.org`) si se agregan reviews o breadcrumbs.
- [ ] QA manual del flujo completo: home → colección/búsqueda → producto → carrito → checkout Shopify, en mobile y desktop, claro y oscuro.
- [ ] Considerar activar `validateEnvironmentVariables()` (`lib/utils.ts`) en el arranque para fallar rápido si falta configuración en un entorno nuevo.

## Fase 7 — Despliegue

- [ ] Deploy a Vercel, dominio propio.
- [ ] Verificar variables de entorno en Vercel (Production/Preview).
- [ ] Confirmar que el webhook de revalidación apunta al dominio de producción correcto.

## Fuera de alcance del template actual (a decidir explícitamente si se necesitan)

- Cuentas de usuario / login / historial de pedidos.
- Wishlist persistente entre dispositivos.
- Panel de administración propio (todo el catálogo se administra desde Shopify Admin).
- Multi-idioma / multi-moneda (no configurado en el template base).
- Tests automatizados (unitarios/E2E) — el `test` script actual solo corre `prettier:check`.

## Documentos relacionados

- [01-PROJECT.md](./01-PROJECT.md)
- [06-DATABASE.md](./06-DATABASE.md) — filtros por atributo dependen del modelo de datos de Shopify
- [07-STYLING.md](./07-STYLING.md) — inventario de lo que hay que rebrandear
