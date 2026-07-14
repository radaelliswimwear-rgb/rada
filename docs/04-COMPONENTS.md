# 04 · Inventario de componentes

Leyenda: **[S]** Server Component (por defecto) · **[C]** Client Component (`"use client"`)

## Layout global

### `Navbar` [S] — `components/layout/navbar/index.tsx`
Barra superior. Carga el menú desde Shopify (`getMenu("next-js-frontend-header-menu")`). Compone `LogoSquare`, enlaces de menú, `<Suspense>` con `MobileMenu` y `Search`, y `CartModal`.

### `MobileMenu` [C] — `components/layout/navbar/mobile-menu.tsx`
Props: `{ menu: Menu[] }`. Drawer lateral (Headless UI `Dialog` + `Transition`) con buscador y menú. Se cierra automáticamente al cambiar `pathname`/`searchParams` o al agrandar viewport (>768px).

### `Search` / `SearchSkeleton` [C] — `components/layout/navbar/search.tsx`
Formulario (`next/form`) que envía `GET /search?q=...`. Lee el valor inicial de `useSearchParams`.

### `Footer` [S] — `components/layout/footer.tsx`
Props: ninguno. Carga menú de footer (`getMenu("next-js-frontend-footer-menu")`), muestra copyright dinámico (`COMPANY_NAME`/`SITE_NAME`), enlace al repo y botón "Deploy on Vercel".

### `FooterMenu` / `FooterMenuItem` [C] — `components/layout/footer-menu.tsx`
Props: `{ menu: Menu[] }`. Resalta el link activo comparando `usePathname()`.

## Carrito

### `CartProvider` / `useCart` [C] — `components/cart/cart-context.tsx`
- `CartProvider` recibe `cartPromise: Promise<Cart | undefined>` (pasado sin `await` desde `app/layout.tsx`) y lo expone vía Context.
- `useCart()` resuelve la promesa con `use()` (React 19), aplica `useOptimistic` con un `cartReducer` local (acciones `ADD_ITEM` / `UPDATE_ITEM`) para reflejar cambios antes de que la Server Action confirme.
- Expone `{ cart, updateCartItem, addCartItem }`.

### `CartModal` [C] — `components/cart/modal.tsx`
Panel lateral (Headless UI `Dialog`). Se auto-abre cuando `cart.totalQuantity` aumenta. Si no hay `cart`, dispara `createCartAndSetCookie()`. Renderiza líneas, taxes/shipping/total, y formulario de checkout (`redirectToCheckout`).

### `AddToCart` [C] — `components/cart/add-to-cart.tsx`
Props: `{ product: Product }`. Resuelve la variante seleccionada cruzando `searchParams` con `product.variants`. Botón con 3 estados: sin stock, sin variante elegida, listo. Usa `useActionState(addItem, ...)` + actualización optimista vía `addCartItem`.

### `DeleteItemButton` [C] — `components/cart/delete-item-button.tsx`
Props: `{ item: CartItem; optimisticUpdate }`. Dispara `removeItem` (Server Action) + optimismo local `"delete"`.

### `EditItemQuantityButton` [C] — `components/cart/edit-item-quantity-button.tsx`
Props: `{ item: CartItem; type: "plus" | "minus"; optimisticUpdate }`. Igual patrón que el anterior con `updateItemQuantity`.

### `OpenCart` [S] — `components/cart/open-cart.tsx`
Props: `{ className?, quantity? }`. Icono de carrito con badge de cantidad.

**Server Actions** (`components/cart/actions.ts`, `"use server"`): `addItem`, `removeItem`, `updateItemQuantity`, `redirectToCheckout`, `createCartAndSetCookie`. Todas invalidan `TAGS.cart` con `updateTag` tras mutar.

## Grillas y tarjetas de producto

### `Grid` / `Grid.Item` [S] — `components/grid/index.tsx`
Wrapper genérico de `<ul>`/`<li>` con clases de CSS grid. Reutilizado en `/search` y colecciones.

### `GridTileImage` [S] — `components/grid/tile.tsx`
Props: `{ isInteractive?, active?, label?: {title, amount, currencyCode, position}, ...ImageProps }`. Tarjeta base de producto: imagen + `Label` opcional superpuesto. Usado en home, carrusel, búsqueda, recomendaciones y galería.

### `ThreeItemGrid` / `ThreeItemGridItem` [S] — `components/grid/three-items.tsx`
Trae `getCollectionProducts({ collection: "hidden-homepage-featured-items" })`. Si no hay al menos 3 productos, no renderiza nada (`return null`). Layout asimétrico (1 grande + 2 chicos).

### `Carousel` [S] — `components/carousel.tsx`
Trae `getCollectionProducts({ collection: "hidden-homepage-carousel" })`. Triplica el array de productos para que el loop de scroll infinito (`animate-carousel`, CSS) no se quede corto.

### `ProductGridItems` [S] — `components/layout/product-grid-items.tsx`
Props: `{ products: Product[] }`. Mapea productos a `Grid.Item` + `GridTileImage`. Usado en `/search` y `/search/[collection]`.

## Ficha de producto

### `Gallery` [C] — `components/product/gallery.tsx`
Props: `{ images: {src, altText}[] }`. Estado del índice de imagen activa vive **en la URL** (`?image=n`), no en `useState`. Botones prev/next y thumbnails.

### `ProductDescription` [S] — `components/product/product-description.tsx`
Props: `{ product: Product }`. Compone título, `Price`, `VariantSelector`, `Prose` (descripción HTML), `AddToCart`.

### `VariantSelector` [C] — `components/product/variant-selector.tsx`
Props: `{ options: ProductOption[], variants: ProductVariant[] }`. Genera combinaciones válidas de opciones (talla/color) y determina disponibilidad cruzando `searchParams` actuales. Cambia opción vía `router.replace` (no navegación completa). Si solo hay una opción con un solo valor, no renderiza nada.

## Búsqueda y filtros

### `Collections` / `CollectionList` [S] — `components/layout/search/collections.tsx`
Trae `getCollections()` y las pasa a `FilterList`.

### `FilterList` [S] — `components/layout/search/filter/index.tsx`
Props: `{ list: ListItem[], title? }`. Renderiza versión lista (desktop) y versión dropdown (mobile) del mismo set de filtros. `ListItem` es `SortFilterItem | PathFilterItem`.

### `FilterItem` [C] — `components/layout/search/filter/item.tsx`
Distingue entre filtro de **ruta** (colección, vía `<Link>`) y filtro de **orden** (`?sort=...`, preserva `?q=`).

### `FilterItemDropdown` [C] — `components/layout/search/filter/dropdown.tsx`
Versión mobile de `FilterList`: dropdown con click-outside-to-close.

## Contenido / SEO / utilidades

### `Prose` [S] — `components/prose.tsx`
Props: `{ html: string, className? }`. Envuelve HTML crudo (de páginas Shopify) con clases tipográficas de `@tailwindcss/typography`.

### `Price` [S] — `components/price.tsx`
Props: `{ amount, currencyCode, className?, currencyCodeClassName? }`. Formatea con `Intl.NumberFormat` (`currencyDisplay: "narrowSymbol"`).

### `Label` [S] — `components/label.tsx`
Props: `{ title, amount, currencyCode, position? }`. Etiqueta flotante usada dentro de `GridTileImage`.

### `LogoSquare` [S] / `LogoIcon` [S] — `components/logo-square.tsx`, `components/icons/logo.tsx`
Branding placeholder del template — **candidato directo a reemplazo** en la fase de rebranding.

### `LoadingDots` [S] — `components/loading-dots.tsx`
Indicador de carga reutilizado en botones (`AddToCart`, `CheckoutButton`).

### `WelcomeToast` [C] — `components/welcome-toast.tsx`
Toast de bienvenida (Sonner) que se muestra una vez (cookie `welcome-toast=2`). **Candidato a eliminar** en producción real (es contenido promocional del template).

### `opengraph-image.tsx` (múltiples) [S]
Presentes en `app/opengraph-image.tsx`, `app/[page]/opengraph-image.tsx`, `app/search/[collection]/opengraph-image.tsx`, y helper compartido en `components/opengraph-image.tsx`. Generan imágenes OG dinámicas por ruta.

## Resumen: Server vs Client Components

| Client Components (`"use client"`) | Motivo |
|---|---|
| `cart-context.tsx` | Context, `useOptimistic`, hooks |
| `modal.tsx`, `add-to-cart.tsx`, `delete-item-button.tsx`, `edit-item-quantity-button.tsx` | interactividad, `useActionState`, `useFormStatus` |
| `mobile-menu.tsx`, `navbar/search.tsx` | estado local UI, `usePathname`/`useSearchParams` |
| `gallery.tsx`, `variant-selector.tsx` | estado derivado de la URL, `useRouter` |
| `filter/item.tsx`, `filter/dropdown.tsx`, `footer-menu.tsx` (activo) | `usePathname`/`useSearchParams` |
| `welcome-toast.tsx` | `useEffect`, cookies del navegador |

Todo lo demás es Server Component por defecto — fetch de datos directo, sin JS enviado al cliente salvo el necesario.

## Documentos relacionados

- [05-ROUTES.md](./05-ROUTES.md) — qué componentes usa cada ruta
- [08-STATE-MANAGEMENT.md](./08-STATE-MANAGEMENT.md) — detalle de patrones de estado
