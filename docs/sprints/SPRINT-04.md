# Sprint 4 — Rebranding LAGO + Ficha de producto + Experiencia premium de catálogo

Este período incluyó tres entregas encadenadas: el rebranding completo, el Sprint 4 numerado (ficha de producto) y el Sprint 4.5 (mejoras premium sobre el catálogo). Se documentan juntas porque ocurrieron en el mismo tramo de trabajo y se referencian entre sí.

## Parte 1 — Rebranding a LAGO — Laura Gómez

### Objetivo

Establecer la marca oficial del proyecto (antes placeholder "MAISON") y eliminar todo rastro de branding de Vercel Commerce.

### Qué se implementó

- Logo real (`public/logo/logo-principal.png`, lockup cuadrado con monograma "LG", wordmark "LAGO", "Laura Gómez" y "Since 2016") aplicado en Navbar, menú móvil y Footer.
- Paleta reducida a negro / blanco / `neutral-100` (`#F5F5F5`) en toda la UI: se reemplazó el azul (`blue-600`, heredado del template original) en 8 archivos (botones de carrito, badges de precio, bordes activos de producto/variantes, pantalla de error).
- Tipografía: se quitó `font-serif` en 8 archivos a favor de la Geist Sans ya cargada, con `font-semibold tracking-tight` para mantener jerarquía.
- Limpieza: se eliminaron `components/welcome-toast.tsx` y `components/logo-square.tsx`, huérfanos desde el Sprint 1 y con texto "Next.js Commerce".
- `.env.example` actualizado (`SITE_NAME`/`COMPANY_NAME` → "LAGO").

### Verificación

`tsc --noEmit` y `npm run build` limpios en cada paso; revisado en navegador (logo cargando en las 3 ubicaciones, cero referencias a "MAISON"/`blue-600`/`font-serif` restantes).

## Parte 2 — Sprint 4: Ficha de producto individual

### Objetivo

La ruta original de Shopify `/product/[handle]` depende 100% de la Storefront API y no es navegable sin credenciales. Se construyó una ficha de producto real usando datos de ejemplo, en paralelo, sin tocar la ruta original.

### Qué se implementó

- `lib/placeholder-data.ts` ampliado: cada uno de los 20 productos suma `slug`, `images[]` (2 fotos reales de Unsplash por producto) y `description`. Se agregaron `getProductBySlug()` y `getRelatedProducts()`.
- Ruta **`/producto/[slug]`** (`app/producto/[slug]/page.tsx`), con `generateStaticParams` — las 20 fichas quedan pre-renderizadas estáticamente en el build.
- `components/product-detail/product-detail.tsx` — orquesta galería, info, productos relacionados. Reutiliza `Gallery` (`components/product/gallery.tsx`), genérico y ya usado por la ruta Shopify original.
- `components/product-detail/product-variant-picker.tsx` — selector de talla + botón de compra (en ese momento, toast "próximamente"; se conectó al carrito real en el Sprint 5).
- `components/home/product-card.tsx` actualizado: "Ver producto" pasó de toast a link real (`/producto/{slug}`), con foto real en vez de gradiente. Este cambio se propaga a Home y a los 3 catálogos porque todos reutilizan el mismo componente.

### Decisión técnica notable

Al agregar `generateStaticParams`, Next.js exigió envolver `<Gallery>` en `<Suspense>` (usa `useSearchParams`) — error detectado en el build y corregido antes de continuar, replicando el mismo patrón que ya usaba la página de producto original de Shopify.

### Verificación

`npm run build` → 35/35 páginas. Probado en navegador: galería, selector de talla con validación, productos con talla única, relacionados, `notFound()` para slugs inexistentes.

## Parte 3 — Sprint 4.5: Premium Product Experience (catálogo)

### Objetivo

Mejorar las páginas de colección (`/hombre`, `/mujer`, `/accesorios`) con una experiencia de catálogo de nivel premium, sin tocar ninguna otra sección.

### Qué se implementó

- **Framer Motion** instalado (`npm install framer-motion --legacy-peer-deps` — necesario por el conflicto de peer dependencies de la versión canary de Next.js).
- `components/catalog/catalog-product-card.tsx` — tarjeta específica de catálogo (separada de `ProductCard`, usado en Home, para no afectarla): segunda imagen en hover con crossfade + zoom, botón Quick View, corazón de wishlist animado, sombras y espaciado mejorados, entrada animada y escalonada.
- `components/catalog/quick-view-modal.tsx` — modal con talla/color/precio/descripción, reutiliza `ProductVariantPicker`.
- `lib/use-wishlist.ts` (hook inicial, luego reemplazado en el Sprint 6 por un Context) — persistencia en `localStorage`.
- `components/catalog/catalog-toolbar.tsx` — barra sticky con breadcrumb, contador de resultados, contador de filtros activos + botón "Limpiar", selector de columnas (2/3/4, vía `?vista=`).
- `components/catalog/pagination.tsx` — paginación (4 productos por página), oculta si hay una sola página.
- `components/catalog/catalog-grid.tsx` — orquesta grilla, estado vacío y el modal de Quick View.
- `components/catalog/catalog-skeleton.tsx` + `app/hombre|mujer|accesorios/loading.tsx` — loading UI por ruta.

### Verificación

`npm run build` → 35/35 páginas. Cada feature probada de forma aislada en navegador (hover con 2ª imagen, Quick View, wishlist con persistencia tras recarga, contador y limpieza de filtros, selector de columnas, paginación, estado vacío, responsive mobile).

## Qué quedó para después

- El carrito seguía sin funcionar de verdad (solo toasts) → Sprint 5.
- La wishlist vivía en un hook aislado sin sincronización entre componentes, y sin página propia para verla → resuelto en el Sprint 6.
