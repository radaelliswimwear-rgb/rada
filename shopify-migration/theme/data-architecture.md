# Arquitectura de datos de producto (Fase 02, sección 6)

Basado en `prisma/schema.prisma` y en los 29 productos reales exportados en la Fase 01E (`shopify-migration/source-of-truth/public-scrape-raw.json`) — no en suposiciones.

## Mapeo CURRENT → SHOPIFY

| Campo actual | Modelo real | → Shopify | Nota |
|---|---|---|---|
| `Product.name` | String | Product Title | Directo |
| `Product.sku` | String? único | Variant SKU | Shopify pone SKU a nivel de variante, no de producto — ver decisión de Talla abajo |
| `Product.slug` | String único | Handle | 1 slug (`COSTA-ESMERALDA-AZUL`) está en mayúsculas — normalizar a minúsculas al importar (ver `reports/catalog-quality-report.md`) |
| `Product.description` | String | Body (HTML) | Texto plano actual, envolver en párrafos HTML |
| `Product.priceValue` | Int (centavos) | Variant Price | **Dato real**: `priceValue` que llega a la UI/JSON-LD ya es el precio FINAL con descuento aplicado (`lib/catalog/catalog-actions.ts`, comentario explícito: "priceValue pasa a ser el precio FINAL... originalPriceValue conserva el precio de lista"). El scrape de Fase 01E capturó ambos (`listPriceCop`/`salePriceCop`) para los 29 productos reales |
| `Product.discountPercent` (+ cascada categoría/sitio) | Int 0-100 | Compare-at Price (derivado) | Los 29 productos reales muestran **-20% uniforme** — fuerte indicio de descuento de sitio completo (`Settings.discountPercent`), no por producto. Shopify no tiene "% de descuento" nativo por producto: se traduce a `compare_at_price` = precio de lista, `price` = precio final |
| `Product.color` | String | Ver decisión abajo | **NO** es una Option interna del producto — ver sección siguiente |
| `Product.categoryId` → `Category` | Relación 1:1 obligatoria | Collection | Ver "Modelo de colección" abajo |
| `Product.active` | Boolean | Status: Active/Draft | `active=false` → Draft, nunca Archived (no perder historial) |
| `Product.featured` | Boolean | Tag `featured` o colección manual "Destacados" | Shopify no tiene booleano "featured" nativo |
| `ProductImage.url` + `.position` | Relación 1:N, ordenada | Product Media | Orden preservado; **no hay campo ALT en el esquema** — se genera como `product.name` en runtime (confirmado en `components/product-detail/product-detail.tsx`), nunca un texto por imagen individual |
| `ProductVariant.size` | String | Option value ("Talla") | Único eje real de variante hoy |
| `ProductVariant.stock` | Int | Inventory quantity | Se descuenta atómicamente al crear el intento de pago, no al crear el pedido (lógica de negocio que Shopify no replica igual — su inventario se descuenta al confirmar el pedido) |

## Decisión: Color — ¿Shopify Option, metafield, o ninguno de los dos?

**Hallazgo real (no inferido)**: `Product.color` es un `String` simple a nivel de PRODUCTO (`prisma/schema.prisma` línea 222), no una relación ni un array. Confirmado con los 29 productos reales: el catálogo modela "el mismo diseño en varios colores" como **productos completamente separados**, cada uno con su propio slug y SKU — nunca como variantes de color dentro de un mismo producto. Ejemplos reales:

- `costa-esmeralda-azul` (SKU `RSONBI021`, color "Azul") vs. `costa-esmeralda-negro` (SKU `RSONBI023`, color "NEGRO") — 2 productos.
- `alba-dorada-lila` / `alba-dorada-beige-suave` / `alba-dorada-cafe-claro` — 3 productos para 3 colores del mismo diseño "Alba Dorada".

**Decisión propuesta: color = metafield de producto (`custom.color`), NUNCA una Shopify Option.**

**Justificación**:
1. Convertir color en una Option de Shopify significaría fusionar `costa-esmeralda-azul` + `costa-esmeralda-negro` en UN SOLO producto Shopify con 2 opciones de color — esto **no es una migración de datos, es un rediseño de la arquitectura del catálogo**, con consecuencias reales: URLs cambian (de 2 handles a 1), SEO de 2 páginas indexadas se consolida en 1, y el conteo de "29 productos" pasa a ser un número distinto de "productos Shopify". Es una decisión de negocio, no técnica — no se toma acá.
2. Migrar 1:1 (cada producto actual = un producto Shopify, con su color como metafield/tag) es la opción de **menor riesgo y menor esfuerzo**: preserva URLs, preserva SEO, preserva el conteo real, y es reversible.
3. El metafield sigue siendo útil para filtrado (Shopify Search & Discovery puede filtrar por metafield) y para mostrar el color en la ficha, sin forzar la reestructuración de productos.

**Alternativa NO recomendada por ahora, pero documentada**: si en el futuro Daniela quiere la experiencia de "selector de color" típica de e-commerce de moda (cambiar de color sin salir de la página), la vía correcta sería usar **Shopify Combined Listings** (app nativa gratuita de Shopify que AGRUPA productos ya existentes bajo un selector visual común, sin fusionar sus datos) — preserva los 29 productos como entidades separadas y agrega la UX de swatch por encima. Se anota como opción futura, no se implementa en esta fase.

## Decisión: Talla — Shopify Option (confirmado, sin alternativa razonable)

`ProductVariant.size` es y debe seguir siendo una **Option real de Shopify** ("Talla"), porque es exactamente el modelo de variante que Shopify espera: 1 producto, N opciones de talla, cada una con su propio SKU/precio/inventario. Único ajuste necesario: **derivar un SKU por variante** (`{Product.sku}-{size}`, ej. `RSONBI021-S`) porque el esquema actual solo tiene SKU a nivel de producto, no de variante — Shopify sí requiere/permite SKU por variante.

## Decisión: Colección — Collection de Shopify, relación 1:1 preservada

`Category` (líneas 149-209 de `prisma/schema.prisma`) es la colección. Relación real: `Product.categoryId` → `Category`, **uno-a-muchos estricto** — cada producto pertenece a EXACTAMENTE una categoría, sin tabla puente ni relación muchos-a-muchos. Esto mapea limpio y sin ambigüedad a **Shopify Collections, un producto = una colección** (más allá de que Shopify técnicamente permita que un producto esté en varias colecciones — el modelo actual nunca lo necesita).

Recordatorio de la taxonomía ya decidida (Fase 01B/02, confirmada con datos reales en Fase 01E): **KEEP** Oasis Natural / Aurora Viva / Espuma de Ola / Salidas de Baño (4 Collections, ver `shopify-import/shopify-target-taxonomy.md`); **NO MIGRAR** Accesorios/Hombre/Mujer/Niños/Calzado (0 productos reales confirmados en las 6, ver `reports/category-cleanup-plan.md`).

`Category.discountPercent` (cascada a productos sin descuento propio) no tiene equivalente de "campo" en una Collection de Shopify — se traduce a una Automatic Discount de Shopify con condición "collection is X", no a un atributo del objeto Collection.

## Campos que NO tienen equivalente de dato (documentados, no inventados)

| Campo | Situación real |
|---|---|
| SEO title/description dedicados | **No existen en el esquema** — el SEO actual siempre es `name`/`description` tal cual (confirmado en `generateMetadata()`). En Shopify sí hay campos SEO dedicados nativos por producto — es una MEJORA disponible, no una migración de dato existente |
| ALT de imagen | **No existe en el esquema** (`ProductImage` no tiene columna `alt`) — se genera como `product.name` en runtime. Shopify sí permite ALT por imagen — oportunidad real de mejora, con trabajo manual o heurística (`{name} — {color} — foto {n}`) |
| `Product.id` interno, `featured` | No expuestos por ninguna interfaz pública (ver Fase 01E) — requieren el `MANUAL STEP` ya documentado si se necesitan exactos antes de migrar |
| Cantidad exacta de stock | Solo se confirmó disponible/agotado por talla vía lectura pública (Fase 01E) — cantidad exacta pendiente del mismo `MANUAL STEP` |
