# Mapeo de campos: actual → Shopify (borrador, sección 9)

Basado en `source-of-truth/data-model-audit.md`. Ninguna decisión de arquitectura final (metaobjects vs. metafields vs. tags) está tomada acá — son propuestas razonadas, marcadas como tal.

## Product

| Campo actual (Prisma) | → | Campo/objeto Shopify | Nota |
|---|---|---|---|
| `Product.name` | → | Product Title | Directo |
| `Product.description` | → | Body (HTML) | Texto plano actual → envolver en `<p>` al importar |
| `Product.slug` | → | Handle | Shopify normaliza handles (minúsculas, guiones) — revisar colisiones antes de importar |
| `Product.sku` | → | Variant SKU (base) | Ver nota de variantes abajo — Shopify pone SKU a nivel de variante, no de producto |
| `Product.priceValue` (centavos) | → | Variant Price | Convertir a formato decimal Shopify (COP no tiene decimales reales de uso, pero Shopify espera `xxxx.00`) |
| `Product.discountPercent` | → | Compare-at Price (calculado) | Shopify no tiene "% de descuento" nativo por producto — se traduce a un Compare-at Price ya calculado, o a Shopify Discounts/Automatic Discounts (decisión de arquitectura pendiente) |
| `Product.color` | → | Option (`Color`) o metafield | **REQUIERE DECISIÓN**: si color pasa a ser una Option real, cada color pasa a ser un producto/variante distinto en Shopify (arquitectura estándar Shopify: variantes = combinaciones de Options) — hoy en el modelo actual, color y producto son 1:1, así que esto es más bien informativo que estructural |
| `Product.category` (vía `categoryId`) | → | Collection | Ver sección Category abajo |
| `Product.featured` | → | Colección manual "Destacados" o tag `featured` | Shopify no tiene un booleano "featured" nativo |
| `Product.active` | → | Status: Active / Draft | `active=false` → Draft (no Archived, para no perder el historial de edición) |
| `Product.images[]` (`ProductImage.url`, `.position`) | → | Product Media | Orden preservado vía el orden de subida/API |
| — (no existe ALT en el esquema) | → | Media `alt` | **REQUIERE DECISIÓN**: generar ALT automático (ej. `"{name} — {color}"`) al momento del import, ya que no hay dato ALT que migrar |
| — (no existe SEO dedicado) | → | SEO title / SEO description (metafields nativos) | Usar el valor efectivo actual (`name`/`description`) como punto de partida, no un campo migrado 1:1 |
| `Product.realViews` / `promotionalViews` | → | NO MIGRAR | Dato de comportamiento de bajo valor histórico, ver `data-migration.md` de la auditoría de viabilidad |

## ProductVariant

| Campo actual | → | Shopify | Nota |
|---|---|---|---|
| `ProductVariant.size` | → | Option value (`Talla`) | |
| `ProductVariant.stock` | → | Inventory quantity | Shopify soporta multi-location — decidir si se usa una sola location o varias |
| (derivado) `{Product.sku}-{size}` | → | Variant SKU | El esquema actual no tiene SKU por variante — se propone derivarlo, no hay un dato real que "migrar" 1:1 acá |

## ProductImage

| Campo actual | → | Shopify | Nota |
|---|---|---|---|
| `ProductImage.url` | → | Product Media (source) | Reutilizar URL de Cloudinary directamente es posible (Shopify puede referenciar media externa) o re-subir a Shopify Files — decisión de arquitectura, no de datos |
| `ProductImage.publicId` | → | (no migra, referencia interna de Cloudinary) | Se conserva en el JSON canónico como trazabilidad, no tiene destino en Shopify |
| `ProductImage.position` | → | Orden de Media | |

## Category

**Fase 01B**: antes de mapear TODAS las categorías 1:1, ver `shopify-target-taxonomy.md` y `../reports/category-taxonomy-audit.md` — Daniela pidió conservar solo 4 colecciones (Oasis Natural, Aurora Viva, Espuma de Ola, Salidas de Baño); Hombre/Mujer/Niños/Calzado se retiran y Accesorios queda pendiente de decisión. La tabla de abajo describe el mapeo de CAMPOS (aplica a cualquier categoría que sobreviva), no una decisión de cuáles colecciones se crean.

| Campo actual | → | Shopify | Nota |
|---|---|---|---|
| `Category.name` | → | Collection Title | |
| `Category.slug` | → | Collection Handle | Hoy la ruta es `/<slug>` (raíz); en Shopify sería `/collections/<handle>` — ver `seo/current-url-inventory.csv` |
| `Category.active` | → | Collection publicada / oculta | |
| `Category.discountPercent` | → | Shopify Automatic Discount a nivel de colección | Shopify no tiene "% de descuento" nativo por colección — requiere una regla de descuento automática aparte, no es un campo del objeto Collection |
| `Category.coverImageUrl` / `bannerImageUrl` | → | Collection image / theme section image | El recorte con zoom (`posX`/`posY`/`zoom`) no tiene equivalente nativo — ver `architecture-map.md` de la auditoría de viabilidad |

## Coupon

| Campo actual | → | Shopify | Nota |
|---|---|---|---|
| `Coupon.code` | → | Discount code | |
| `Coupon.type` (`PERCENTAGE`/`FIXED`) | → | Discount type | Mapeo directo |
| `Coupon.value` | → | Discount value | Convertir centavos → valor si es `FIXED` |
| `Coupon.minSubtotal` | → | Minimum purchase amount | |
| `Coupon.maxUses` | → | Usage limit | |
| `Coupon.usedCount` | → | NO MIGRA 1:1 | Shopify empieza su propio contador; ajustar el límite restante a mano si el cupón sigue activo |
| `Coupon.expiresAt` | → | End date | |

---

## Sobre `shopify-products-DRAFT.csv`

**NOT READY FOR PRODUCTION IMPORT.** El archivo `shopify-import/shopify-products-DRAFT.csv` en este directorio tiene únicamente el HEADER con las columnas del formato de import estándar de Shopify (Handle, Title, Body (HTML), Vendor, Type, Tags, Published, Option1 Name, Option1 Value, Variant SKU, Variant Price, Variant Inventory Qty, Image Src, Image Position, Image Alt Text, SEO Title, SEO Description) — sin filas, porque (a) no hay datos reales todavía (ver `MANUAL_STEP_REQUIRED.md`) y (b) varias decisiones de arquitectura de la tabla de arriba siguen pendientes (color como Option vs. metafield, manejo de Compare-at Price, ALT generado). Generarlo con filas antes de esas dos cosas produciría un CSV que habría que rehacer.
