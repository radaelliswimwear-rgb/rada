# Sprint 17 — Marketing e Inteligencia

## Objetivo

SEO técnico completo (metadata dinámica, Open Graph, Twitter Cards, sitemap/robots reales, canonical URLs, schema.org), un blog completamente integrado, sistema de newsletter con gestión de campañas, cupones de descuento en el checkout, recomendaciones/relacionados más inteligentes, historial de "vistos recientemente", búsqueda mejorada (ranking + autocompletado) y mejoras de accesibilidad — todo sin servicios externos que requieran credenciales, sobre la arquitectura existente (Repository Pattern, Server Actions, Prisma/Postgres).

## Pendiente del Sprint 16 revisado

Se revisó `HANDOFF.md`/`ROADMAP.md`/`SPRINT-16.md`. Ninguno de los pendientes ahí (credenciales de Wompi, usuario `guest` para checkout de invitado) es un requisito para este sprint — son independientes de SEO/marketing. No hizo falta resolver nada antes de empezar.

## Bug real encontrado y corregido de entrada: `/sitemap.xml` devolvía 500

`app/sitemap.ts` (heredado del template) leía de `lib/shopify` (`getCollections`/`getProducts`/`getPages`) y llamaba a `validateEnvironmentVariables()`, que tira si faltan `SHOPIFY_STORE_DOMAIN`/`SHOPIFY_STOREFRONT_ACCESS_TOKEN` — que no están configuradas en este proyecto desde que se migró a Postgres (Sprint 13). Esto significa que **`/sitemap.xml` nunca funcionó** en el track de datos real, algo que solo se notó al auditar SEO para este sprint. Se reescribió para leer de `catalogRepository`/`blogRepository` — ver "Qué se implementó".

## Qué se implementó

### SEO técnico

- **`app/sitemap.ts`** (reescrito) — usa `catalogRepository.listSlugs()` y `blogRepository.listSlugs()` en vez de Shopify; incluye home, `/hombre`, `/mujer`, `/accesorios`, `/blog`, cada producto (`/producto/[slug]`) y cada post (`/blog/[slug]`), con `changeFrequency`/`priority`.
- **`app/robots.ts`** — se agregó `disallow` para `/admin`, `/cuenta`, `/checkout`, `/favoritos`, `/api` (antes no excluía nada).
- **`lib/seo/site.ts`** — constantes de marca (nombre, descripción, URL, logo) centralizadas, reutilizadas por metadata y JSON-LD en vez de repetir el texto en cada página.
- **`lib/seo/json-ld.tsx`** — componente `<JsonLd data={...} />` para no repetir `<script type="application/ld+json">` a mano; mismo patrón que ya usaba `app/product/[handle]/page.tsx` (track Shopify dormido), ahora reutilizable.
- **`app/layout.tsx`** — `metadata` gana `description`, `alternates.canonical: "/"`, `openGraph`/`twitter` por defecto (antes solo tenía `title`/`robots`); se agregan datos estructurados `Organization` y `WebSite` (con `SearchAction` apuntando a `/buscar?q=`) una sola vez a nivel de sitio.
- **`app/producto/[slug]/page.tsx`** — `generateMetadata` gana `alternates.canonical`, Open Graph completo (`type: "website"`, imagen) y Twitter Card; se agrega JSON-LD `Product` (nombre, descripción, imágenes, SKU, color, categoría, `Offer` con precio/disponibilidad según si tiene talles con stock) — antes no tenía datos estructurados, a diferencia de la ruta legacy de Shopify que sí los tenía.
- **`app/hombre|mujer|accesorios/page.tsx`** — `alternates.canonical` y `openGraph` agregados (antes solo `title`/`description`).
- **`app/blog/page.tsx`** / **`app/blog/[slug]/page.tsx`** — metadata completa (canonical, Open Graph `type: "article"` con fecha de publicación, Twitter Card) y JSON-LD `Article` en cada post.

### Blog completamente integrado

- **`BlogPost`** (modelo nuevo, migración `20260717100000_sprint17_marketing`): slug, título, resumen, contenido, portada, tags (array nativo de Postgres), publicado/fecha, autor.
- **`lib/blog/`** — `blog-actions.ts` (lectura pública, degrada a `[]`/`null` si Postgres falla, mismo criterio que `lib/catalog/catalog-actions.ts`), `blog-repository.ts`, `markdown.ts` (conversor Markdown→HTML minimalista, sin librería nueva — ver "Decisiones técnicas"), `types.ts`.
- **`app/blog/page.tsx`** (listado) y **`app/blog/[slug]/page.tsx`** (detalle, con `generateStaticParams`) — usan `components/blog/blog-card.tsx` y el plugin `@tailwindcss/typography` (`prose`) ya instalado, para el cuerpo del post.
- **Admin completo** (`lib/admin/blog-actions.ts`/`blog-repository.ts`, `components/admin/blog-table.tsx`/`blog-form.tsx`, `app/admin/blog/{page,nuevo,[id]}.tsx`): CRUD con buscador/paginación (mismo patrón que productos), publicar/despublicar, slug autogenerado desde el título.
- **Seed**: 3 posts de ejemplo (`prisma/seed.ts`) para que `/blog` no esté vacío apenas se corre `npm run db:seed`.

### Newsletter y campañas

- **`NewsletterSubscriber`** y **`NewsletterCampaign`** (modelos nuevos). `components/home/newsletter.tsx` (Sprint 1, hasta ahora solo mostraba un `toast` sin persistir nada) ahora llama a `lib/newsletter/newsletter-actions.ts#subscribeToNewsletterAction` — valida formato de email y hace `upsert` por email.
- **Gestión de campañas** (`lib/admin/newsletter-actions.ts`/`newsletter-repository.ts`, `components/admin/newsletter-manager.tsx`, `app/admin/newsletter/page.tsx`): contador de suscriptores, crear campaña (asunto + contenido) como borrador, marcarla como "enviada". **No hay envío real de email** — sin un proveedor externo (Resend/Mailchimp/etc.) configurado, "enviada" solo registra una fecha; queda documentado explícitamente en la UI del panel para no sugerir una capacidad que no existe, y listo para conectar un proveedor real sin cambiar el contrato de `NewsletterCampaign`.

### Cupones de descuento

- **`Coupon`** (modelo nuevo: código, tipo porcentaje/fijo, mínimo de subtotal, usos máximos/usados, vencimiento).
- **`lib/coupons/coupons-actions.ts`** — `validateCouponAction(code, subtotal)` (pública, llamada desde el checkout) valida activo/vencimiento/mínimo/usos y calcula el descuento; `incrementCouponUsageAction` se llama recién cuando el pedido se creó con éxito (no al solo probar el código).
- **`components/checkout/coupon-input.tsx`** (nuevo) — input de cupón en el checkout, con estado aplicado/quitar.
- **`lib/checkout/pricing.ts#calculateCostSummary`** gana un tercer parámetro opcional `discount` (retrocompatible — todo llamador que no lo pase sigue funcionando igual); **`Order.couponCode`/`Order.discountValue`** (campos nuevos, opcionales) — un pedido sin cupón se comporta exactamente igual que antes.
- **Admin completo** (`lib/admin/coupons-actions.ts`/`coupons-repository.ts`, `components/admin/coupons-manager.tsx`, `app/admin/cupones/page.tsx`): crear, activar/desactivar, eliminar.
- **Seed**: cupón `LAGO10` (10%, sin restricciones) para poder probar el flujo completo apenas se corre el seed.

### Productos destacados, relacionados y recomendaciones

- **Destacados**: ya existían desde el Sprint 13 (`listFeaturedProductsAction`) — no se tocó, se confirma que siguen funcionando.
- **Relacionados "inteligentes"** (`lib/catalog/catalog-actions.ts#listRelatedProductsAction`, misma firma, sin romper nada): antes devolvía los primeros N productos de la categoría sin ningún orden; ahora puntúa candidatos por color igual (+2), precio dentro de ±30% (+1) y stock disponible (+1), ordena por puntaje y aleatoriza entre empates — sin ML ni servicio externo, una heurística explícita y documentada como tal.
- **Recomendaciones automáticas** (`listRecommendedProductsAction`, nueva) — usadas en `components/home/recommended-for-you.tsx` (Home): arma una sección "Recomendado para vos" a partir de las categorías del historial de "vistos recientemente" (ver abajo), excluyendo lo ya visto; sin historial, recomienda de todas las categorías.

### Historial de "vistos recientemente"

- **`lib/recently-viewed/storage.ts`** — 100% client-side (`localStorage`, sin modelo en Postgres ni cuenta de usuario, mismo espíritu que el carrito de invitado antes del Sprint 12): registra hasta 12 productos vistos, más reciente primero.
- **`components/catalog/recently-viewed.tsx`** — se monta en la ficha de producto (`components/product-detail/product-detail.tsx`), registra la vista actual y muestra el resto del historial (excluyéndose a sí mismo) en una fila horizontal.

### Búsqueda inteligente mejorada

- **`searchProductsAction`** (`lib/catalog/catalog-actions.ts`) — antes devolvía todos los resultados sin límite ni orden; ahora rankea (coincidencia exacta > empieza con > contiene, sobre el nombre) y limita a 24 resultados. Sigue sin full-text real (`pg_trgm`/`tsvector`, ver `docs/DATABASE.md`) — es una mejora de ranking sobre `ILIKE`, no un motor de búsqueda nuevo.
- **`searchSuggestionsAction`** (nueva) + **`components/layout/navbar/search.tsx`** (reescrito) — autocompletado con debounce (250ms) en el buscador del Navbar: dropdown accesible (`role="combobox"`/`listbox`/`option`, `aria-expanded`) con hasta 5 sugerencias (imagen, nombre, precio) mientras se escribe, sin reemplazar la búsqueda de página completa en `/buscar`.

### Accesibilidad y Lighthouse

- **Skip link** ("Saltar al contenido principal") agregado en `app/layout.tsx`, visualmente oculto hasta recibir foco por teclado, apuntando a `<main id="main-content">` (antes no existía ningún mecanismo para saltar la navegación).
- Datos estructurados `Organization`/`WebSite`/`Product`/`Article` ayudan a resultados enriquecidos en buscadores (no es una métrica de Lighthouse en sí, pero es parte del mismo esfuerzo de SEO técnico).
- El resto de la superficie ya tenía una cobertía razonable de `aria-label`/`sr-only` (navbar, carrito, checkout, panel admin — ver auditoría en "Qué quedó para después"); no se hizo una auditoría AA exhaustiva de todo el sitio en este sprint, ver limitación abajo.

## Decisiones técnicas

- **Sin librerías nuevas para Markdown**: `lib/blog/markdown.ts` es un conversor minimalista (encabezados, negrita/cursiva, enlaces, listas, párrafos) escrito a mano en vez de instalar `remark`/`marked`. Alcanza para el contenido del blog (sembrado a mano o escrito desde `/admin/blog`); si en el futuro hiciera falta Markdown más completo (tablas, código), este archivo es el único a reemplazar.
- **Sin proveedor de email real**: el sistema de newsletter persiste suscriptores y campañas en Postgres, pero no envía ningún email — cumple la instrucción explícita de no usar servicios externos que requieran credenciales. Documentado en la propia UI del admin, no solo en estos docs.
- **Cupones: incremento de uso solo tras pedido exitoso**: `incrementCouponUsageAction` se llama desde `checkout-content.tsx` después de que `ordersRepository.create` devuelve el pedido creado, nunca al validar el código — así un usuario que prueba un cupón y abandona el checkout no gasta un uso.
- **`Order.couponCode`/`discountValue` opcionales, `calculateCostSummary` con parámetro opcional por defecto 0**: ningún pedido ni cálculo de costos existente cambia de comportamiento si no hay cupón — retrocompatibilidad total con los Sprints 10/11/16.
- **Relacionados/recomendaciones: heurística explícita, no IA**: se documenta así a propósito — "inteligente" en el enunciado del sprint se interpretó como "mejor que un orden arbitrario de base de datos", no como aprendizaje automático, que hubiera requerido un servicio externo (fuera de alcance por instrucción explícita).
- **"Vistos recientemente" 100% client-side**: no se agregó un modelo `RecentlyViewedItem` en Postgres a propósito — es un historial de navegador, no de cuenta; agregar persistencia server-side habría exigido asociarlo a usuario/invitado (como carrito o wishlist), una funcionalidad más amplia que lo pedido.
- **Sitemap sin `lastModified` por producto**: `MetadataRoute.Sitemap` acepta `lastModified`, pero `catalogRepository.listSlugs()` no expone `updatedAt` (solo el slug) — agregarlo hubiera exigido cambiar esa Server Action de lectura pública (`lib/catalog/catalog-actions.ts`, dominio estable) solo para el sitemap; se dejó fuera para no tocar código estable sin necesidad. Documentado como mejora futura.

## Verificación

`npx tsc --noEmit` limpio. `npm run build` limpio (63/63 páginas, incluye `/blog`, `/blog/[slug]`, `/admin/blog/*`, `/admin/newsletter`, `/admin/cupones`). Verificado en navegador contra la base Neon real, con datos sembrados (`npm run db:seed`):

- **`/sitemap.xml`**: antes devolvía 500 (confirmado); ahora devuelve XML válido con home, categorías, `/blog`, cada producto y cada post.
- **`/robots.txt`**: `Disallow` para `/admin`, `/cuenta`, `/checkout`, `/favoritos`, `/api` confirmado.
- **Blog**: `/blog` lista los 3 posts sembrados; `/blog/[slug]` renderiza el Markdown a HTML correctamente y expone JSON-LD `Organization`+`WebSite`+`Article` y `canonical` correctos (inspeccionados con JS en la página).
- **Producto**: JSON-LD `Product` inspeccionado en `/producto/abrigo-oversize-lana` — nombre, precio, disponibilidad y `canonical` correctos.
- **Vistos recientemente**: se visitó "Camisa Lino Regular" y después "Abrigo Oversize Lana" — la ficha del segundo mostró "Camisa Lino Regular" en su historial.
- **Autocompletado del buscador**: escribir "abrigo" en el Navbar mostró el dropdown con imagen/nombre/precio del producto correcto.
- **Newsletter**: suscripción real desde el formulario de Home, confirmada por consulta directa a Postgres (fila creada), y limpiada después de verificar.
- **Cupón `LAGO10`**: aplicado en un checkout real (login `demo@lago.com`) — descuento de 7,90 € sobre 79,00 € reflejado en el resumen y en la confirmación del pedido; `Coupon.usedCount` pasó de 0 a 1 tras completar el pedido (confirmado por consulta directa a Postgres).
- **Admin**: `/admin/blog`, `/admin/newsletter`, `/admin/cupones` verificados con sesión de `test@lago.com` (rol `ADMIN`) — listados con los datos reales de arriba.
- **Skip link**: `Tab` como primera tecla al cargar cualquier página enfoca "Saltar al contenido principal".
- **Responsive**: `/blog` verificado en viewport 375×812 (mobile), sin overflow.
- **Regresión**: no se detectaron errores nuevos en consola (el único error visto — `Cannot update a component... LocalCartProvider` — es el mismo hallazgo ya documentado en `SPRINT-16.md`, previo a este sprint, no introducido acá).

## Qué quedó para después

- Envío real de campañas de newsletter (requiere un proveedor externo con credenciales — fuera de alcance explícito de este sprint).
- Búsqueda full-text real (`pg_trgm`/`tsvector`) si el catálogo crece mucho más allá del volumen actual.
- `lastModified` por producto/post en el sitemap (exigiría exponer `updatedAt` desde `catalogRepository.listSlugs()`/`blogRepository.listSlugs()`).
- Auditoría de accesibilidad AA exhaustiva de todo el sitio (se agregó skip link y se mantuvo/revisó la cobertura de `aria-label` existente, pero no se hizo un audit formal con herramientas como axe/Lighthouse CI en este sprint).
- Reordenamiento de imágenes de blog / múltiples imágenes por post (hoy: una portada por post, igual criterio simple que el resto del contenido editorial).
- El resto de los pendientes ya documentados en [ROADMAP.md](../ROADMAP.md) (Wompi sin verificar en vivo, usuario `guest`, sesión server-side, etc.) no cambiaron en este sprint.
