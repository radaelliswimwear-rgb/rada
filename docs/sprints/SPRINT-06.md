# Sprint 6 — Wishlist con arquitectura enterprise-ready

## Objetivo

Construir la página `/favoritos` (los corazones del Sprint 4.5 guardaban en `localStorage` pero no había dónde verlos), y hacerlo con una arquitectura de datos preparada para conectarse más adelante a Postgres + Prisma + Cloudinary + un Panel Administrativo — instrucción explícita recibida al inicio de este sprint, que pasó a regir el resto del proyecto (ver [ROADMAP.md](../ROADMAP.md)).

## Cambio de enfoque a mitad de sprint

El hook original de wishlist (`lib/use-wishlist.ts`, del Sprint 4.5) tenía cada componente con su propio estado aislado: tocar el corazón en una tarjeta de catálogo no actualizaba el contador del Navbar hasta recargar. Antes de construir la página, se refactorizó a un patrón de 3 capas:

```
lib/wishlist/types.ts             → forma del dato (mapea 1:1 a una futura tabla Prisma)
lib/wishlist/storage-adapter.ts   → única pieza que sabe que hoy es localStorage
components/wishlist/wishlist-store.tsx → Context con API 100% async
```

Este es el patrón que se documenta como estándar en [ARCHITECTURE.md](../ARCHITECTURE.md) para toda pieza de datos nueva de acá en adelante.

## Qué se implementó

- `lib/wishlist/types.ts` — `WishlistItem = { productId, createdAt }`.
- `lib/wishlist/storage-adapter.ts` — lectura/escritura en `localStorage`, con **validación defensiva de forma** (`isWishlistItem`) y clave versionada (`lago-wishlist:v1`).
- `components/wishlist/wishlist-store.tsx` — `WishlistProvider`/`useWishlist`, reemplaza el hook viejo. Métodos async: `addToWishlist`, `removeFromWishlist`, `toggle`, `isSaved`.
- `app/favoritos/page.tsx` + `components/wishlist/wishlist-page.tsx` — lista los productos guardados reutilizando `CatalogGrid` (mismas tarjetas, Quick View y corazón que el resto del sitio); estado vacío con CTA a la colección. Metadata con `robots: noindex` (contenido por-sesión, no debe indexarse).
- `app/layout.tsx` — se sumó `WishlistProvider`, anidado dentro de `LocalCartProvider`.
- Navbar y menú móvil: ícono de corazón con contador, enlaza a `/favoritos`.

## Bug real encontrado y corregido

Al reusar la clave de `localStorage` del hook viejo, quedaron datos del formato anterior (`string[]`) mezclados con el nuevo (`WishlistItem[]`), inflando el contador del Navbar (mostraba "2" con un solo producto real guardado). Se resolvió versionando la clave de almacenamiento y agregando validación de forma en `getAll()`, que descarta cualquier entrada mal formada en vez de romper. Verificado reproduciendo el bug con datos corruptos reales y confirmando el fix.

## Verificación

`tsc --noEmit` y `npm run build` limpios (36/36 páginas). Probado en navegador: sincronización en vivo entre Navbar, tarjetas de catálogo y `/favoritos`; agregar/quitar desde cada superficie; estado vacío; menú móvil con 3 botones (Cuenta/Favoritos/Carrito) sin overflow de texto.

## Qué quedó para después

- Alinear el carrito (Sprint 5) al mismo patrón de adaptador — no se tocó en este sprint por estar fuera de su alcance explícito.
- Documentación completa del proyecto (`docs/`) — resuelto inmediatamente después de este sprint, ver [PROJECT.md](../PROJECT.md).
- Definir la decisión Shopify vs. Postgres propio vs. híbrido antes de que la deuda de "dos tracks" crezca más — ver [ROADMAP.md](../ROADMAP.md).
