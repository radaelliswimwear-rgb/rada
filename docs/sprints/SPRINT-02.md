# Sprint 2 — Páginas de catálogo/colección

## Objetivo

Darle un destino real a "Colecciones" del navbar y a las categorías de la Home, que hasta entonces solo hacían scroll dentro de la propia Home.

## Qué se implementó

- Rutas nuevas **`/hombre`, `/mujer`, `/accesorios`** (`app/hombre|mujer|accesorios/page.tsx`), en paralelo a la ruta original de Shopify `/search/[collection]` — sin tocarla.
- `components/catalog/catalog-page.tsx` — layout de categoría: banda superior con imagen/título, sidebar de filtros, grilla de productos.
- `components/catalog/catalog-filters.tsx` — filtros reales por **talla, color y precio** (multi-selección) y **orden** (novedades / precio asc / precio desc), con el estado guardado en la URL (`searchParams`), siguiendo el mismo patrón que ya usa `VariantSelector` en el template original.
- `lib/placeholder-data.ts` ampliado: de 8 a 20 productos, con `sizes`, `color`, `priceValue` y una función `filterAndSortProducts()`.

## Decisiones técnicas

- Filtrado y orden se resuelven **server-side** dentro del Server Component de la página, leyendo `searchParams` — no hay JavaScript de filtrado corriendo aparte del necesario para actualizar la URL.
- Se prefirió URLs limpias en español (`/hombre`) en vez de anidar bajo un prefijo tipo `/catalogo/hombre`.

## Verificación

`tsc --noEmit` y `npm run build` limpios. Probado en navegador: combinaciones de filtros (incluyendo el caso de 0 resultados), orden por precio, navegación desde Navbar/tarjetas/footer.

## Qué quedó para después

- Las categorías de la Home seguían usando bloques de gradiente en vez de fotos → resuelto en el Sprint 3, que además conectó su navegación real a estas rutas.
- Las tarjetas de producto todavía no llevaban a una ficha real → resuelto en el Sprint 4.
