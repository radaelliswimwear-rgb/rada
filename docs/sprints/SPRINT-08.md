# Sprint 8 — Carrito alineado al patrón adaptador

## Objetivo

El carrito (Sprint 5) era la única pieza de estado que no seguía el patrón Context + Adaptador introducido en el Sprint 6 para la wishlist — hablaba directo con `localStorage` y guardaba una copia (nombre, imagen, precio) del producto en cada línea. Quedaba anotado como deuda técnica en el ROADMAP.

## Qué se implementó

- `lib/cart/types.ts` — `CartLine` normalizado: solo `id`, `productId`, `size`, `quantity`, `createdAt`. Ya no duplica nombre/imagen/precio del producto.
- `lib/cart/storage-adapter.ts` — mismo patrón que `lib/wishlist/storage-adapter.ts`: lectura/escritura async en `localStorage`, validación defensiva de forma (`isCartLine`), clave versionada `lago-cart:v1`.
- `lib/placeholder-data.ts` — nueva función `getProductById(id)`, usada para resolver los datos de producto de cada línea del carrito en vivo.
- `components/cart-drawer/cart-store.tsx` — reescrito sobre el adaptador. Expone `lines: EnrichedCartLine[]` (`CartLine & { product: PlaceholderProduct }`), calculado con `useMemo` cruzando las líneas guardadas contra el catálogo actual. `addItem`/`removeItem`/`updateQuantity` ahora son `async`, igual que la wishlist.
- `components/cart-drawer/cart-drawer.tsx` — actualizado para leer `line.product.name` / `line.product.images[0]` / `line.product.priceValue` / `line.product.slug` en vez de los campos denormalizados que antes vivían directo en la línea.

## Por qué normalizar

Guardar una copia de nombre/imagen/precio en cada línea del carrito es exactamente el tipo de dato denormalizado que se vuelve inconsistente en una base de datos real (si el precio de un producto cambia, las líneas de carrito ya guardadas quedarían con el precio viejo). Resolver los datos en vivo contra el catálogo, con el carrito guardando solo la referencia (`productId`) más los datos que sí le pertenecen (`size`, `quantity`), es el modelo correcto y coincide con el `CartLine` ya propuesto en [DATABASE.md](../DATABASE.md) para el futuro esquema de Prisma.

## Verificación

`tsc --noEmit` y `npm run build` limpios (37/37 páginas). Probado en navegador: agregar producto con talla (nombre/precio resueltos correctamente desde el catálogo), sumar cantidad (subtotal recalcula), persistencia tras recarga completa de página (incluido el contador del Navbar), quitar producto → estado vacío, y cierre del panel (confirmando que el fix del Sprint 7 sigue intacto tras la reescritura).

## Qué quedó para después

- Nada nuevo — el carrito y la wishlist ahora siguen exactamente el mismo patrón. El resto de los pendientes del roadmap (checkout, autenticación, Postgres/Prisma, Cloudinary, panel administrativo, animación de salida de modales) siguen abiertos, ver [ROADMAP.md](../ROADMAP.md).
