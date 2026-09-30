# Reporte de calidad del catálogo (sección 10)

## Actualización Fase 01E — hallazgos reales (29 productos confirmados por lectura pública)

Método: sitemap.xml + JSON-LD público de cada `/producto/<slug>` + HTML de las 9 páginas de colección, todo GET sin autenticación (ver `../source-of-truth/public-scrape-raw.json`). Cubre productos **activos y públicamente visibles únicamente** — no puede confirmar nada sobre productos inactivos (ver limitación al final).

| Chequeo | Resultado real |
|---|---|
| Productos confirmados | **29** |
| SKU duplicados | **0** — los 29 SKU son distintos |
| Slugs duplicados (case-insensitive) | **0** |
| Productos sin SKU | **0** |
| Productos sin imágenes | **0** (mínimo 3, máximo 5 por producto) |
| Productos sin descripción | **0** |
| Precio en cero / negativo | **0** |
| Descuento activo | **29/29 (100%)**, uniformemente **-20%** en los tres — fuerte indicio de que es el descuento de sitio completo (`Settings.discountPercent`), no uno por producto/categoría — **INFERENCIA**, no confirmado directamente |
| Disponibilidad (`schema.org/InStock` vs `OutOfStock`) | **29/29 InStock** al momento de la lectura (2026-09-28) — ninguna talla visible aparece marcada "Talla agotada" tampoco |
| Productos en categorías a retirar (Salidas de Baño/Accesorios/Hombre/Mujer/Niños/Calzado) | **0** — confirmado cruzando las 9 páginas de colección, ver `category-cleanup-plan.md` |
| **Slug con mayúsculas inconsistente** | `COSTA-ESMERALDA-AZUL` es el único slug en mayúsculas de los 29 (el resto sigue el patrón `minuscula-con-guiones`) |
| **Nombre/slug no coincide con el color real** | 2 casos: `bikini-shadow-azul-marino` (nombre y color real: **NEGRO**, no azul marino) y `enterizo-shadow-palm-azul-marino` (mismo patrón — nombre/color real: NEGRO) |
| **Prefijo de SKU inconsistente con la categoría actual** | 3 productos con SKU `LG-HOM-*` (prefijo "Hombre") categorizados hoy en **Aurora Viva**: `sol-interno-cafe-claro` (LG-HOM-000002), `amanecer-dorado-lila` (LG-HOM-000003), `raices-del-sol-beige-suave` (LG-HOM-000001) — indicio de que fueron recategorizados después de creados, sin actualizar el SKU |

**Limitación honesta de este método**: solo ve lo que un visitante anónimo puede ver. No puede confirmar cuántos productos **inactivos** existen (`Product.active=false`, ocultos del todo del sitio público), ni la cantidad EXACTA de stock por talla (solo disponible/agotado), ni `Product.id`, ni `featured`, ni datos de `Coupon`. Ver `MANUAL_STEP_REQUIRED.md` para el estado actualizado de qué falta y qué tan importante es ya.

---

**Alcance de la sección original (Fase 01, antes de la lectura pública)**: sin acceso confirmado a datos reales, este reporte NO podía detectar anomalías de DATOS (SKUs duplicados reales, stock negativo real, descripciones vacías reales, etc.) — esos chequeos requieren filas reales, que no existen todavía en este directorio. Lo que sigue es lo que SÍ se puede evaluar desde el esquema y el código: qué constraints ya protegen contra cada tipo de problema, y cuáles NO tienen ninguna protección (por lo tanto son posibles en los datos reales, sin que este reporte pueda confirmar si de hecho ocurren).

| Chequeo pedido | ¿Lo previene el esquema/código hoy? | Nota |
|---|---|---|
| Productos sin SKU | **Parcialmente** | `Product.sku` es nullable — históricamente podía faltar; un backfill ya corrió para productos existentes al momento del backfill, pero el campo sigue siendo opcional a nivel de esquema, así que no hay garantía de Postgres, solo de proceso |
| SKU duplicados | **Sí, a nivel de Postgres** | `Product.sku` es `@unique` — un duplicado real es imposible mientras esa constraint siga activa |
| Slugs duplicados | **Sí, a nivel de Postgres** | `Product.slug` es `@unique` |
| Productos sin variante | **No hay constraint** | Nada impide crear un `Product` sin ningún `ProductVariant` — posible en los datos reales, no verificable sin ellos |
| Variantes sin talla | **Sí, a nivel de tipo** | `ProductVariant.size` es `String` no-nullable — no puede ser `null`, pero sí podría ser un string vacío `""`, que el esquema no bloquea |
| Stock negativo | **No hay constraint de base de datos** | `ProductVariant.stock` es `Int` sin `CHECK >= 0` a nivel de Postgres — la protección (si existe) es solo a nivel de código de aplicación (`lib/checkout/server-order-totals.ts`), no del esquema. Un valor negativo real, si existe, no sería detectado por una constraint |
| Productos sin imágenes | **No hay constraint** | Nada impide un `Product` con `images: []` |
| Imágenes duplicadas | **No hay constraint** | Ver `image-migration-plan.md` — se puede detectar por consulta agrupada una vez existan datos reales |
| URLs inválidas | No verificable sin datos | Requeriría validar cada `ProductImage.url` real |
| Descripciones vacías | **No hay constraint** | `Product.description` es `String` no-nullable, pero podría ser `""` — el esquema no exige longitud mínima |
| Precio cero | **No hay constraint** | `Product.priceValue` es `Int` sin `CHECK > 0` |
| Descuentos inválidos (fuera de 0-100) | **No hay constraint de Postgres** | `discountPercent` es `Int` en `Product`/`Category`/`Settings` — el rango 0-100 se asume por convención de UI/código (`lib/pricing/discount.ts`), no está impuesto por el esquema. Un valor como `150` o `-10` sería técnicamente aceptado por la base |
| Productos inactivos | N/A — es un estado válido, no un error | `active=false` es el mecanismo intencional de "borrado suave" cuando un producto tiene historial asociado |
| Inconsistencias de nombres/colores/tallas | No verificable sin datos | `color` y `size` son `String` libres, sin un enum ni catálogo controlado — cualquier variación de escritura ("Negro" vs "negro" vs "NEGRO") es posible y no se detecta sin los datos reales |
| Productos sin categoría | **Sí, imposible por diseño** | `Product.categoryId` es una FK obligatoria (no nullable) — no puede existir un producto sin categoría en el esquema actual |
| Productos en categorías a retirar (Fase 01B) | No verificable sin datos | Ver `category-taxonomy-audit.md` — no se puede saber cuántos productos reales quedan hoy en Hombre/Mujer/Niños/Calzado/Accesorios sin el export real |
| Riesgo de productos huérfanos (Fase 01B) | Bajo por diseño, no cuantificable sin datos | Un producto nunca queda "sin categoría" (ver fila de arriba); el riesgo real es que quede en una categoría que se retira sin haber sido reasignado antes — ver `category-cleanup-plan.md` |

## Riesgos estructurales ya identificados (independientes de los datos)

1. **No hay SKU a nivel de variante** — si Shopify requiere un SKU único por combinación producto+talla (comportamiento estándar), habrá que derivarlo (`{sku}-{size}`) en el momento del export; no es un problema de calidad de datos existente, es una diferencia de modelo (ver `catalog-field-mapping.md`).
2. **`color` y `size` son texto libre, no un catálogo controlado** — la migración a Shopify Options (que si se usa como Option en vez de metafield, participa en la lógica de variantes de Shopify) se beneficiaría de normalizar estos valores antes de exportar, para evitar que "M" y "m" o "Negro"/"negro" generen variantes/opciones distintas en Shopify por una diferencia de mayúsculas.
3. **`discountPercent` sin validación de rango a nivel de base de datos** en tres modelos distintos (`Product`, `Category`, `Settings`) — si algún valor real está fuera de 0-100 (por un bug de UI ya corregido, o una edición manual antigua), la cascada de descuento (`lib/pricing/discount.ts`) podría comportarse de forma inesperada. Vale la pena revisar esto específicamente en cuanto haya datos reales, antes de exportar precios a Shopify.

## Próximo paso

Una vez exista el export real (`MANUAL_STEP_REQUIRED.md`), volver a este archivo y completar la columna de resultado real para cada chequeo de la tabla de arriba — la estructura de la tabla ya está lista para eso, solo falta la fila de "hallazgo real" por chequeo.
