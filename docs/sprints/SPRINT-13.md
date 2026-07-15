# Sprint 13 — Catálogo, búsqueda y wishlist migrados a PostgreSQL

## Objetivo

Migrar completamente el catálogo, la búsqueda y la wishlist a PostgreSQL + Prisma sobre la arquitectura existente (Repository Pattern, Server Actions, manejo de errores resiliente), sin romper ninguna funcionalidad de los sprints 1-12 y sin modificar la UI salvo lo estrictamente necesario.

## Qué se implementó

- **`lib/catalog/`** (nuevo dominio) — `types.ts` (`CategoryLabel`, mapeo etiqueta↔slug, `toneForCategory`), `catalog-actions.ts` (`"use server"`: `listCatalogProductsAction`, `listFeaturedProductsAction`, `getProductBySlugAction`, `listRelatedProductsAction`, `searchProductsAction`, `listProductSlugsAction`, todas con try/catch → resultado vacío), `catalog-repository.ts` (Repository Pattern, mismo objeto público para toda la UI).
- **`lib/wishlist/wishlist-actions.ts`** — Server Actions Prisma reemplazando `localStorage`; `lib/wishlist/storage-adapter.ts` reescrito como wrapper delgado (mismo contrato `getAll`/`save` de siempre).
- **`lib/guest-identity.ts`** — `resolveGuestId(cookieName, maxAgeSeconds)`, extraído de `lib/cart/cart-actions.ts` y reutilizado también por wishlist (elimina duplicación entre los dos dominios de invitado).
- **`prisma/schema.prisma`** — `Wishlist` rediseñada como "contenedor + items" (`Wishlist` + `WishlistItem`, mismo patrón que `Cart`/`CartItem`), con `userId` opcional para soportar invitados vía cookie (`lago-wishlist-id`). Migración inicial regenerada (nada desplegado todavía, ver Sprint 12).
- **Páginas migradas a `catalogRepository`**: `components/catalog/catalog-page.tsx` (listado con filtros/orden/paginación server-side), `app/producto/[slug]/page.tsx` (ficha + `generateStaticParams` resiliente), `components/product-detail/product-detail.tsx` (relacionados, ahora `async`), `app/buscar/page.tsx` (búsqueda real), `components/home/featured-products.tsx` (destacados, ahora `async`).
- **`prisma/seed.ts`** — reutiliza `CATEGORY_SLUG_BY_LABEL` de `lib/catalog/types.ts` (antes duplicado); nuevo `seedDemoWishlist` para `test@lago.com`.

## Decisiones técnicas

- **`lib/placeholder-data.ts` no se borró.** Las páginas (Server Components) leen de Postgres vía `catalogRepository`, pero `components/cart-drawer/cart-store.tsx` y `components/wishlist/wishlist-page.tsx` siguen resolviendo productos **síncronamente** dentro de un Context de cliente (`useMemo`/render directo) — convertir esa resolución a async hubiese exigido reestructurar esos Contexts, fuera de "no modifiques la UI salvo que sea estrictamente necesario". `prisma/seed.ts` siembra `Product` con los mismos IDs que `lib/placeholder-data.ts`, así que ambas fuentes son consistentes entre sí. Documentado en [ARCHITECTURE.md](../ARCHITECTURE.md) como decisión explícita, no como deuda oculta.
- **`catalogRepository` devuelve `PlaceholderProduct[]`**, no un tipo nuevo: cero cambios en `components/catalog/*`, `components/product-detail/*`, `components/home/product-card.tsx`, `QuickViewModal`, `ProductVariantPicker`. `tone` (decorativo, no persistido) se deriva de la categoría.
- **Wishlist sigue el patrón "contenedor + cookie" del carrito** (Sprint 12), no uno nuevo: se extrajo `resolveGuestId` a un helper compartido en vez de duplicar la lógica de cookie. Sin fusión a cuenta al iniciar sesión todavía (mismo alcance que el carrito).
- **Filtros y paginación reales**: talla (`variants.some`), color (`in`), precio (`OR` de rangos en centavos), orden (`orderBy` en Postgres) y paginación (`skip`/`take` + `count()` en paralelo) — nada de esto se calcula ya en memoria.
- **Búsqueda real** con `contains`/`mode: "insensitive"` (equivalente a `ILIKE`) sobre nombre/color/descripción/categoría — adecuado para el volumen actual; full-text con `pg_trgm` queda como optimización futura si el catálogo crece (documentado en DATABASE.md).
- **`generateStaticParams` resiliente**: si Postgres no está disponible en build time, genera 0 rutas estáticas de producto (en vez de fallar el build) y cada ficha cae a render dinámico on-demand.
- **Manejo de errores consistente con el Sprint 12**: toda Server Action de solo lectura que puede correr sin interacción del usuario (montaje de providers, listados, `generateStaticParams`) atrapa el error, lo loguea (`console.error`, nunca oculto) y devuelve un resultado vacío seguro.

## Verificación

`npx tsc --noEmit` y `npm run build` limpios (27/27 páginas). Sin Postgres accesible en este entorno (limitación de sandbox, no del código — ver Sprint 12), se verificó explícitamente que la degradación es correcta: build no falla, `/hombre` y `/buscar` renderizan su estado vacío ("No hay productos...", "No encontramos productos...") sin Runtime Error, `/producto/[slug]` cae a `404` en vez de romperse, y los errores de Postgres quedan logueados server-side (`listCatalogProductsAction`, `listFeaturedProductsAction`, `getWishlistItemsAction`, etc.) sin propagarse a la UI. Con un `DATABASE_URL` real y `npm run db:seed`, el flujo completo (catálogo filtrado/paginado, búsqueda, wishlist persistente entre pestañas del mismo navegador, carrito, checkout) queda listo para probarse de punta a punta.

## Qué quedó para después

- Migrar la resolución síncrona de `lib/placeholder-data.ts` en `cart-store.tsx`/`wishlist-page.tsx` y poder borrar el archivo del todo.
- Fusión de carrito/wishlist de invitado a la cuenta al iniciar sesión.
- Búsqueda full-text (`pg_trgm` + índice GIN) si el catálogo crece más allá de unas pocas decenas de productos.
- Integrar Cloudinary para imágenes de producto.
- Panel Administrativo — el catálogo ya vive en Postgres con Repository Pattern, listo para que un panel lea/escriba sobre el mismo `catalogRepository` o directamente sobre Prisma.

Ver [ROADMAP.md](../ROADMAP.md) para el resto de pendientes.
