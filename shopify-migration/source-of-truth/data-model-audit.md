# Auditoría del modelo de datos (sección 2)

Fuente: lectura directa de `prisma/schema.prisma` en `origin/main` (commit `a8ddc9d`, la misma base que corre hoy en producción — confirmado sin diferencias contra la rama local de remediación de pentest). Complementado con lectura de `app/producto/[slug]/page.tsx`, `app/sitemap.ts` y `lib/catalog/*` para confirmar cómo se usan estos campos en producción.

Todos los nombres de campo son literales del esquema — no traducidos ni inventados, para que sirvan directo como headers de export.

---

## PRODUCT (`model Product`)

| Campo Prisma | Tipo | Nota |
|---|---|---|
| `id` | String (cuid) | PK interna |
| `slug` | String, único | Usado en la URL pública `/producto/<slug>` |
| `name` | String | Título del producto |
| `categoryId` | String (FK → Category) | |
| `priceValue` | Int | **En centavos de COP** (ej. 150000 = $1.500 COP) |
| `discountPercent` | Int, default 0 | Descuento propio del producto (0-100). Cascada: producto > categoría > sitio (`Settings.discountPercent`), no acumulativa — gana el más específico. Ver `lib/pricing/discount.ts` |
| `color` | String | Un solo color por producto (no es una variante aparte) |
| `description` | String | Texto libre, usado tal cual como meta description en `generateMetadata()` |
| `featured` | Boolean, default false | Destacado en home |
| `active` | Boolean, default true | Visible en catálogo/búsqueda. Se pone `false` automáticamente en vez de borrarse si el producto ya tiene pedidos/carritos/favoritos asociados |
| `sku` | String?, único | Nullable históricamente, autogenerado si el admin lo deja vacío; todo producto activo hoy debería tenerlo (backfill ya corrido) |
| `realViews` / `promotionalViews` / `showViews` | Int / Int / Boolean | Contador de vistas real + ajuste manual del admin — dato de comportamiento, no de catálogo |
| `createdAt` / `updatedAt` | DateTime | `updatedAt` es lo que usa `app/sitemap.ts` como `lastModified` real |

**No existen campos SEO dedicados** (`seoTitle`/`seoDescription`/`metaTitle` no están en el esquema). El SEO actual del PDP se genera en tiempo de render (`app/producto/[slug]/page.tsx`, `generateMetadata()`): `title = product.name`, `description = product.description`, canonical = `${SITE_URL}/producto/${slug}`. Ver `catalog-field-mapping.md` para cómo esto afecta el mapeo a Shopify.

Relaciones: `images: ProductImage[]`, `variants: ProductVariant[]`, `wishlistedBy`, `cartItems`, `orderItems`, `backInStockRequests`, `viewers`.

## PRODUCTVARIANT (`model ProductVariant`)

| Campo Prisma | Tipo | Nota |
|---|---|---|
| `id` | String (cuid) | |
| `productId` | String (FK) | |
| `size` | String | Único eje de variante hoy (talla). El color vive en `Product.color`, no acá — un producto = un color, N tallas |
| `stock` | Int, default 0 | Se descuenta atómicamente al crear el intento de pago (no al crear el pedido) — ver `lib/checkout/server-order-totals.ts` |

Restricción: `@@unique([productId, size])` — no puede haber dos variantes con la misma talla para el mismo producto.

**No hay SKU propio de variante** en el esquema — el SKU vive a nivel de `Product`, no de `ProductVariant`. Si Shopify requiere SKU por variante (lo normal), habrá que derivar uno (`{Product.sku}-{size}`) al momento del export — ver `catalog-field-mapping.md`.

## PRODUCTIMAGE (`model ProductImage`)

| Campo Prisma | Tipo | Nota |
|---|---|---|
| `id` | String (cuid) | |
| `productId` | String (FK) | |
| `url` | String | URL completa de la imagen |
| `publicId` | String? | ID de Cloudinary — **null** para imágenes sembradas desde Unsplash por `lib/placeholder-data.ts` (datos de ejemplo, no reales) o cualquier imagen que no se subió desde el Panel Admin |
| `position` | Int | Orden de la galería |

**No hay campo ALT** en el esquema — el texto alternativo de imagen no se almacena hoy en base de datos (ver `image-migration-plan.md`).

## CATEGORY (`model Category`)

| Campo Prisma | Tipo | Nota |
|---|---|---|
| `id` | String (cuid) | |
| `slug` | String, único | Usado como ruta pública de nivel raíz — ver `seo/current-url-inventory.csv` (NO es `/colecciones/<slug>`, es `/<slug>` directo, ej. `/oasis-natural`) |
| `name` | String | |
| `active` | Boolean, default true | Visible en navbar/footer/home; si es `false` la ruta y sus productos siguen existiendo, solo se "archiva" de la navegación |
| `discountPercent` | Int, default 0 | Descuento de toda la categoría, cascada — ver Product arriba |
| `coverImageUrl` / `coverImagePublicId` / `coverImageWidth` / `coverImageHeight` / `coverImagePosX` / `coverImagePosY` / `coverImageZoom` | | Tarjeta "Categorías destacadas" del home. El recorte con zoom (`posX`/`posY`/`zoom`) es una interacción custom sin equivalente nativo en Shopify — ver `architecture-map.md` de la auditoría de viabilidad |
| `coverVideoUrl` / `coverVideoPublicId` | | Loop opcional que reemplaza la foto fija de la tarjeta |
| `bannerImageUrl` / `bannerImagePublicId` / ancho/alto/posX/posY/zoom | | Banner grande de la página de colección, mismo mecanismo de recorte |
| `bannerVideoUrl` / `bannerVideoPublicId` | | |

**No hay campos SEO dedicados** en Category tampoco.

## COUPON (`model Coupon`) — solo estructura, sin exportar datos de uso real por cliente

| Campo Prisma | Tipo | Nota |
|---|---|---|
| `code` | String, único | |
| `type` | Enum `PERCENTAGE` \| `FIXED` | |
| `value` | Int | Porcentaje (0-100) si `PERCENTAGE`; centavos si `FIXED` |
| `active` | Boolean | |
| `minSubtotal` | Int, default 0 | Centavos |
| `maxUses` | Int? | |
| `usedCount` | Int, default 0 | **No se exporta como dato de cliente** — es un contador agregado, no un listado de quién lo usó |
| `expiresAt` | DateTime? | |

## SEO — dónde vive realmente hoy

No existe un modelo `SEO` ni campos `seoTitle`/`seoDescription` en ningún modelo. El SEO on-page se computa en cada ruta a partir de datos ya existentes:

- **Producto** (`app/producto/[slug]/page.tsx`): `generateMetadata()` usa `product.name` / `product.description` / `product.images[0]` / canonical `${SITE_URL}/producto/${slug}`. También genera JSON-LD (`lib/seo/product-json-ld.ts`) con `Product` schema.org.
- **Sitemap** (`app/sitemap.ts`): construido leyendo Postgres directamente (`catalogRepository.listSitemapProducts()`, `blogRepository.listSitemapPosts()`), con `lastModified` real. Incluye home, colecciones activas en navegación, blog, y páginas legales (`/envios`, `/devoluciones`, `/garantia`, `/terminos`, `/privacidad`, `/cookies`). Excluye a propósito `/hombre`, `/mujer`, `/ninos`, `/calzado` (rutas archivadas post-rebrand, siguen siendo accesibles pero no se le piden a Google que las priorice) y `/buscar` (noindex propio).

Esto significa que la columna `seo_title`/`seo_description` del workbook maestro (sección 4) refleja el valor EFECTIVO actual (derivado de `name`/`description`), no un campo propio editable — se documenta así explícitamente, no se inventa un campo que no existe.

## Contenido no incluido en este audit (fuera de alcance de la Fase 01)

Por instrucción explícita de la fase: NO se documentan aquí `User`, `Address`, `Order`, `OrderItem`, `Payment`, `Session`, `VerificationToken`, `AuthAttempt`, `Cart`/`CartItem`, `Wishlist`/`WishlistItem`, `BackInStockRequest`, `AnalyticsEvent`, `MarketingEventOutbox`, `EmailOutbox`, `SystemLog` — son datos de clientes/pedidos/observabilidad, fuera del alcance de un export de CATÁLOGO. Ya están clasificados en detalle en la auditoría de viabilidad previa (`docs/shopify/data-migration.md`, `docs/shopify/architecture-map.md`), que sigue siendo la referencia vigente para esos modelos.
