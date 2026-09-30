# 03G — Paridad de los 29 productos (sitio actual vs Development Store)

- **Fecha:** 2026-09-29, 17:40 (Bogotá). Solo lectura y offline: no se consultó Neon, no hubo navegador ni GET nuevo al sitio actual (la evidencia guardada alcanzó).
- **Dev Store:** `radaelli-swimwear-dev.myshopify.com`, país de la sesión US, moneda COP, idioma es. Theme Radaelli RC1 sin publicar (Horizon sigue LIVE y no se toca).
- **Entregables:** `launch/03G-product-parity.csv` (29 filas, 61 columnas), este documento, el script `launch/tools/03g-product-parity.mjs` y `launch/03G-product-parity.summary.json` (salida del script con los conteos y listas que se citan aquí). Verificación independiente (otro método de parseo): `launch/tools/03g-product-parity-verify.mjs` y su salida `launch/03G-product-parity-verify.json` (sección 10).
- **Etiquetas de evidencia:** `[MEDIDO-03G]` sale de `launch/evidence/`; `[DOC:<archivo>]` sale de un documento del repo; `[INFERIDO]` es razonado y se dice; `[NOT_VERIFIED]` no se pudo comprobar.

## 1. Resultado

Hay dos niveles de estado en el CSV, y los dos van aquí porque el segundo es el que decide si un producto está listo:

| Estado | `overall` (final, cada producto) | `overall_registro_producto` (solo la ficha) |
|---|---:|---:|
| `RECONCILED` | 0 | 13 |
| `RECONCILED_WITH_INTENTIONAL_DIFFERENCE` | 0 | 15 |
| `DIFFERENCE` | **29** | 1 |
| **Total** | **29** | **29** |

*(Actualizado a las 18:34 tras re-medir la miga con RC1.8: los 4 productos con miga "Destacados" pasaron de `DIFFERENCE` a conciliados en `overall_registro_producto`; antes: 10 / 14 / 5. La evidencia `dev-products.jsonl` guarda la miga vieja en `crumbsRC17`.)*

- **`overall_registro_producto`** mira los campos del registro y de la ficha: título, colección, color, tallas, SKU, precio, imágenes, descripción, miga de pan y PDP. Ahí no hay fallas de migración de datos en título, colección, SKU, precio, orden y conteo de imágenes y descripción (29/29, sección 4). 28 de 29 no tienen diferencias no intencionales; 1 tiene una propia (la talla XL).
- **`overall`** (estado final) suma dos diferencias abiertas que afectan a los 29 productos y que nadie decidió: la **posición dentro del orden por defecto de su colección** (0 de 29 posiciones coinciden con el sitio actual, F-03) y el **inventario** (la Dev no rastrea nada y el sitio actual publica stock por talla, F-04). Mientras esas dos sigan abiertas, ningún producto puede figurar como conciliado. Esto se corrigió en la verificación (sección 10): la primera versión dejaba 10 productos en `RECONCILED` y 14 en `RECONCILED_WITH_INTENTIONAL_DIFFERENCE` a pesar de que este mismo documento rotulaba F-03 y F-04 como `DIFFERENCE`.

Los productos con diferencia propia en la ficha (5 con RC1.7; hoy 1) son dos cosas distintas:

- **1 producto con una talla que difiere:** `alba-dorada-cafe-claro` tiene talla XL en la Dev Store y el sitio actual hoy no la ofrece (F-01). No es una falla de la importación (la Dev replica el export del 2026-09-28). Que el sitio "cambiara después" no está demostrado: es una diferencia entre dos mediciones públicas y el `lastmod` del producto en el sitemap no cambió (F-01).
- **4 productos con miga de pan "Destacados"** en lugar de su colección (F-02). Era un defecto del theme medido con RC1.7. **RC1.8 lo corrige y se re-midió en vivo** (miga, "Volver a Espuma de Ola" y JSON-LD `BreadcrumbList` en las 4; control en 6 fichas más): ya no son diferencia.

**Totales** (verificados por script, [MEDIDO-03G]):

| Concepto | Dev Store | Sitio actual (rastreo 03G) | CSV/manifiestos del repo |
|---|---:|---:|---:|
| Productos | 29 | 29 | 29 (`products-master.csv`) |
| Variantes | **98** | **97** | 98 (`variants-master.csv`, 2026-09-28) |
| Imágenes | 95 | 95 | 95 (CSV de importación) |
| SKU únicos / handles únicos | 98 / 29 | n/a | n/a |

Las 98 variantes se cumplen en Shopify y en el CSV, pero **el sitio actual hoy muestra 97**: no lista la XL de `alba-dorada-cafe-claro` (F-01).

## 2. Método

1. **Sitio actual.** El script parsea los 29 `launch/evidence/current-site/producto_*.html` (rastreo GET de solo lectura, 29 de 29 con 200). De cada ficha lee tres fuentes y las cruza entre sí:
   - el objeto `product` del payload RSC de Next.js (nombre, categoría, `priceValue`, `originalPriceValue`, `activeDiscountPercent`, `sizes`, `color`, `sku`, `images` en orden, `featured`, `sizeStock`);
   - el HTML visible (h1, precio con descuento y tachado, botones de talla, SKU, color, miga, botón de favoritos, galería);
   - los bloques JSON-LD (Product, BreadcrumbList) y la etiqueta canonical.
   Si dos fuentes del sitio actual se contradicen, el script lo registra como "problema de fuentes". Resultado: **0 problemas de fuentes** (título, categoría, color, precio, tallas DOM vs payload, imágenes payload = JSON-LD = galería DOM, descripción payload = JSON-LD = `products-master.csv`).
2. **Dev Store.** `dev-products.jsonl` (29 líneas), `dev-collections.json` (membresía y orden de las 6 colecciones) y `dev-routes.json`.
3. **Catálogo y CSV del repo.** `catalog/products-master.csv`, `variants-master.csv`, `shopify-handle-mapping.csv`, `shopify-post-import-audit.csv`, `color-search-tag-map.csv`, `seo/shopify-redirects-import.csv`, `import/shopify-products-03c.csv`, `shopify-products-03c-images.csv`, `image-resolution-fix.csv`, `image-dimensions.csv`, `color-mapping.csv`. Las afirmaciones de `shopify-post-import-audit.csv` que se pueden recomputar (título, SKU, precio y compare-at, orden y conteo de imágenes, conteo de variantes, `inventory_tracked`) se recomputaron: **0 contradicciones** con esta medición.
4. **Reglas de comparación.**
   - **Precio:** Shopify `price` = precio con descuento del sitio actual, `compare_at` = precio original, `price = round(compare_at x 0,8)` (sin doble descuento) y el precio renderizado en la ficha coincide con ambos.
   - **SKU:** cada SKU Dev debe ser `<SKU del sitio actual>-<talla>` y coincidir con `variants-master.csv`.
   - **Imágenes:** el orden se prueba **por nombre de archivo**. El nombre es el `public_id` de Cloudinary, que aparece igual en la URL del sitio actual, en el CSV de importación y en el nombre de archivo Dev (se quita la extensión y un posible sufijo UUID que Shopify agrega). Las dimensiones Dev se comparan con las de la fuente (`image-dimensions.csv`): iguales, o reducidas a 5000 px de lado largo con la misma proporción (tolerancia 1 px).
   - **Descripción:** se normaliza quitando etiquetas HTML, viñetas "•" y espacios; el texto resultante debe ser idéntico palabra por palabra y signo por signo. Un segundo nivel (sin puntuación ni mayúsculas) se usa solo para distinguir "solo puntuación". Las 29 pasan el primer nivel.
   - **Miga:** cadena exacta `Inicio / <colección> / <título>`.
5. **Estado.** Cualquier diferencia no documentada y no deliberada = `DIFFERENCE`. Diferencias documentadas y deliberadas (color en mayúsculas, handle en minúsculas, tag MOSTAZA, imágenes reducidas a 5000 px, `featured` no migrado) = `RECONCILED_WITH_INTENTIONAL_DIFFERENCE`. Lo heredado del sitio actual (mismo valor en ambos lados) no cambia el estado y va en `notes`. Se calculan dos estados: `overall_registro_producto` (solo los campos de la ficha) y `overall` (el anterior más el orden por defecto en la colección y el inventario, que difieren en 29/29 y no son intencionales: motivos `ORDEN_COLECCION` e `INVENTARIO` en `notes`).

**Límites de lo medido.** Es una foto del sitio actual tomada el 2026-09-29 (archivos guardados a las 17:31) y de la Dev Store con un theme anterior a RC1.8 (ver F-02). No hay evidencia de carrito, checkout ni de las funciones (favoritos, guía de tallas, paneles de la ficha); del inventario solo hay lo que el sitio actual publica y que la Dev no rastrea. El sitio actual puede cambiar entre corridas (F-01 muestra dos mediciones distintas): hay que volver a correr el rastreo y este script justo antes del corte. El `<title>` y la meta description de las fichas no entran en ningún estado (nota N-8).

## 3. Leyenda

| Valor | Significado |
|---|---|
| `SI` / `NO` | Coincide / no coincide, con la regla de la sección 2. |
| `SI_SOLO_MAYUSCULAS` (`color_match`) | Mismo color, cambia solo el uso de mayúsculas (`Azul` a `AZUL`, `Mostaza` a `MOSTAZA`) [DOC:import/color-mapping.csv]. |
| `Sí` / `No` (`destacados_member`) | Pertenece o no a la colección Destacados de la Dev Store [MEDIDO-03G]. |
| `redirect_source_to_handle_ok = SI` | La fila `/producto/<slug actual>` existe en `seo/shopify-redirects-import.csv` con destino `/products/<handle>` **y** ese PDP responde 200 con canonical `/products/<handle>` en la Dev Store. El GET en vivo de cada redirección no está guardado por URL: hay solo el agregado (ver sección 8). |
| `image_min_dimension_shopify` | La imagen Dev de menor área, `AnchoxAlto`. Todas las dimensiones van en `image_dims_shopify`, en orden. |
| `overall` | `RECONCILED`, `RECONCILED_WITH_INTENTIONAL_DIFFERENCE` o `DIFFERENCE` (sección 2, punto 5). Estado final: incluye orden por defecto en la colección e inventario. |
| `notes` | Diferencias y notas separadas por ` \|\| `, cada una con su etiqueta de evidencia. |
| Columnas 37 a 58 | Extras: membresía de colecciones, posición en colección (actual/Dev), `featured` y Home actual, tags, por dónde se encuentra el color en la búsqueda, tallas del export del 2026-09-28, prefijo de SKU, dimensiones y comparación con la fuente, stock publicado por el sitio actual, miga actual y su coincidencia, corazón actual, JSON-LD actual, detalle de descripción y `evidence`. |
| `overall_registro_producto` (59) | Igual que `overall` pero sin contar el orden por defecto en la colección ni el inventario: refleja solo la ficha del producto. |
| `collection_order_match` (60) | `SI` si la posición del producto en el orden por defecto de su colección es la misma en el sitio actual y en la Dev; `NO` si no. |
| `inventory_match` (61) | `NO` mientras la Dev no rastree inventario (`inventory_tracked=NO` en `shopify-post-import-audit.csv`) y el sitio actual publique stock por talla. |

El CSV es UTF-8 sin BOM (igual que los demás CSV del repo), con comillas CSV estándar.

## 4. Conteos por campo (29 productos)

| Campo | Resultado |
|---|---|
| `redirect_source_to_handle_ok` | SI 29 |
| `title_match` | SI 29 |
| `collection_match` | SI 29 (10 Oasis Natural, 12 Aurora Viva, 7 Espuma de Ola; 0 fuera de su colección de categoría) |
| `destacados_member` | Sí 7, No 22. Los 7 son el mismo conjunto que muestra hoy la Home actual [MEDIDO-03G] |
| `color_match` | SI 27, SI_SOLO_MAYUSCULAS 2 (`costa-esmeralda-azul`, `entero-golden-hour`) |
| `sizes_match` | SI 28, **NO 1** (`alba-dorada-cafe-claro`) |
| `sku_match` | SI 29 (98 SKU Dev = `<SKU>-<talla>`, todos únicos) |
| `price_match` | SI 29 (4 pares de precios: 249.900 a 199.920 en 4 productos; 229.900 a 183.920 en 10; 209.900 a 167.920 en 9; 199.900 a 159.920 en 6; siempre -20 %, sin doble descuento) |
| `image_count` | actual = Dev en 29/29 (95 = 95) |
| `image_order_match` | SI 29 (por nombre de archivo; 1 archivo con sufijo UUID, misma imagen) |
| `description_match` | SI 29 (texto idéntico tras normalizar; el formato cambia de viñetas "•" a lista HTML) |
| `wishlist_heart_shopify` | SI 29 (el sitio actual también lo tiene en 29) |
| `pdp_status_shopify` | 200 en 29/29; canonical propio y sin `noindex` en 29/29 |
| `breadcrumb` (Dev = actual) | SI 25, **NO 4** |
| `pdp_jsonld_shopify` | 2 en 29/29 (Product y BreadcrumbList según el theme [DOC:theme-src/sections/main-product.liquid:378-407]; el contenido no se midió) |
| `collection_order_match` | **NO 29** (F-03: 0 de 29 posiciones iguales; Oasis Natural 0/10, Aurora Viva 0/12, Espuma de Ola 0/7) |
| `inventory_match` | **NO 29** (F-04: `inventory_tracked=NO` en 29/29; el sitio actual publica stock por talla) |
| `overall` / `overall_registro_producto` | `DIFFERENCE` 29 / `RECONCILED` 10, `RECONCILED_WITH_INTENTIONAL_DIFFERENCE` 14, `DIFFERENCE` 5 |

Imágenes: de las 95, **52 tienen las mismas dimensiones que la fuente y 43 están reducidas a 5000 px de lado largo** (33xx x 5000) por el límite de Shopify; 0 imágenes con dimensiones sin explicar. `image-resolution-fix.csv` tiene 44 filas: 43 reducciones y 1 fila "dentro del límite: URL original sin cambios" (`amanecer-dorado-lila`, posición 2, 1600x2400).

## 5. Tabla por producto

Estado del registro (`overall_registro_producto`): R = `RECONCILED`, R-I = `RECONCILED_WITH_INTENTIONAL_DIFFERENCE`, DIF = `DIFFERENCE`. El `overall` final de los 29 es `DIFFERENCE` porque a todos les falta resolver el orden en la colección (F-03) y el inventario (F-04); esos dos motivos no se repiten en la columna "motivos". Detalle completo en el CSV.

| # | handle Shopify | colección | tallas | imágenes (actual/Dev) | estado registro | motivos |
|---|---|---|---|---|---|---|
| 1 | `alba-dorada-beige-suave` | Aurora Viva | S/M/L/XL | 3/3 | R-I | imágenes a 5000 px |
| 2 | `alba-dorada-cafe-claro` | Aurora Viva | S/M/L/XL | 5/5 | DIF | el sitio actual no lista XL (F-01); imágenes a 5000 px |
| 3 | `alba-dorada-lila` | Aurora Viva | S/M/L/XL | 4/4 | R-I | imágenes a 5000 px |
| 4 | `amanecer-dorado-lila` | Aurora Viva | S/M/L/XL | 4/4 | R-I | imágenes a 5000 px; archivo con sufijo UUID; prefijo LG-HOM (heredado) |
| 5 | `amanecer-dorado-terracota` | Aurora Viva | S/M/L/XL | 3/3 | R-I | imágenes a 5000 px |
| 6 | `arena-dorada-beige` | Oasis Natural | S/M/L | 3/3 | R | - |
| 7 | `arena-dorada-negro` | Oasis Natural | S/M/L | 3/3 | R | 2 imágenes de baja resolución (heredado) |
| 8 | `aurora-total-azul-oscuro` | Aurora Viva | S/M/L/XL | 3/3 | R-I | imágenes a 5000 px |
| 9 | `aurora-total-terracota` | Aurora Viva | S/M/L/XL | 4/4 | R-I | imágenes a 5000 px |
| 10 | `bikini-foam` | Espuma de Ola | S/M/L | 3/3 | R | - |
| 11 | `bikini-palm-verde-oliva` | Espuma de Ola | S/M/L | 3/3 | R | miga corregida en RC1.8 (F-02) |
| 12 | `bikini-shadow-azul-marino` | Espuma de Ola | S/M/L | 3/3 | R | miga corregida en RC1.8 (F-02); handle distinto del título (heredado) |
| 13 | `bikini-waves-terracota` | Espuma de Ola | S/M/L | 3/3 | R | - |
| 14 | `bikini-waves-verde-oliva` | Espuma de Ola | S/M/L | 3/3 | R | - |
| 15 | `brisa-natural-beige` | Oasis Natural | S/M/L | 3/3 | R-I | `featured` no migrado; 1 imagen de baja resolución (heredado) |
| 16 | `brisa-natural-naranja` | Oasis Natural | S/M/L | 3/3 | R | - |
| 17 | `camiseta-solar-waves-negro` | Aurora Viva | S/M/L y XL | 3/3 | R-I | imágenes a 5000 px; talla "L y XL" y SKU con espacios (heredado) |
| 18 | `costa-esmeralda-azul` | Oasis Natural | S/M/L | 3/3 | R-I | color en mayúsculas; `featured` no migrado; handle en minúsculas; 1 imagen de baja resolución (heredado) |
| 19 | `costa-esmeralda-negro` | Oasis Natural | S/M/L | 3/3 | R | - |
| 20 | `enterizo-shadow-palm-azul-marino` | Espuma de Ola | S/M/L | 3/3 | R | miga corregida en RC1.8 (F-02); handle distinto del título (heredado) |
| 21 | `entero-golden-hour` | Espuma de Ola | S/M/L | 3/3 | R-I | miga corregida en RC1.8 (F-02); color en mayúsculas; tag MOSTAZA |
| 22 | `marea-natural` | Oasis Natural | S/M/L | 3/3 | R | handle sin color, título "MAREA NATURAL BEIGE" (heredado) |
| 23 | `marea-natural-naranja` | Oasis Natural | S/M/L | 3/3 | R | - |
| 24 | `oasis-serena-azul` | Oasis Natural | S/M/L | 3/3 | R-I | `featured` no migrado |
| 25 | `oasis-serena-negro` | Oasis Natural | S/M/L | 3/3 | R | - |
| 26 | `raices-del-sol-azul-oscuro` | Aurora Viva | S/M/L/XL | 4/4 | R-I | imágenes a 5000 px |
| 27 | `raices-del-sol-beige-suave` | Aurora Viva | S/M/L/XL | 3/3 | R-I | imágenes a 5000 px; prefijo LG-HOM (heredado) |
| 28 | `sol-interno-beige-suave` | Aurora Viva | S/M/L/XL | 4/4 | R-I | imágenes a 5000 px |
| 29 | `sol-interno-cafe-claro` | Aurora Viva | S/M/L/XL | 4/4 | R-I | imágenes a 5000 px; prefijo LG-HOM (heredado) |

Por colección (estado del registro): Oasis Natural 7 R + 3 R-I; Aurora Viva 11 R-I + 1 DIF; Espuma de Ola 3 R + 4 DIF.

## 6. Diferencias: qué son y de dónde vienen

La columna "Estado que produce" es el efecto sobre el estado del registro; el `overall` final de los 29 ya es `DIFFERENCE` por las dos primeras filas.

| Diferencia | Productos | Clase | Estado que produce |
|---|---:|---|---|
| Posición dentro del orden por defecto de la colección (F-03) | 29 | **Diferencia abierta, sin decisión documentada** (el sitio actual ordena por "Novedades"; la Dev, orden manual) | DIFFERENCE (`overall`) |
| Inventario: Dev sin rastreo; el sitio actual publica stock por talla (F-04) | 29 | **Diferencia abierta, pendiente de la dueña** | DIFFERENCE (`overall`) |
| Talla XL en Dev que el sitio actual hoy no ofrece (F-01) | 1 | **Diferencia entre el export (2026-09-28) y el sitio actual (2026-09-29)**; la causa no está demostrada | DIFFERENCE |
| Miga, "Volver a" y BreadcrumbList con "Destacados" (F-02) | 4 | **Defecto del theme**, corregido en la fuente RC1.8, sin re-medir | DIFFERENCE |
| Imágenes reducidas a 5000 px de lado largo | 12 productos, 43 imágenes | **Intencional** (límite de Shopify; misma foto, mismo CDN) [DOC:import/image-resolution-fix.csv] | R-I |
| Color `Azul`/`Mostaza` a `AZUL`/`MOSTAZA` | 2 | **Intencional** [DOC:import/color-mapping.csv] | R-I |
| Handle `COSTA-ESMERALDA-AZUL` a minúsculas | 1 | **Intencional** (Shopify solo admite minúsculas) + redirección | R-I |
| Tag de búsqueda `MOSTAZA` (solo en `entero-golden-hour`) | 1 | **Intencional** (el color no está en título ni descripción) [DOC:catalog/color-search-tag-map.csv] | R-I |
| `featured=true` sin equivalente en Shopify (3 de Oasis Natural) | 3 | **Intencional** (decisión 03D: Destacados = los 7 que muestra la Home actual) [DOC:theme/03D-missing-assets-audit.md §5] | R-I |
| Imágenes de baja resolución (lado largo menor de 1200 px) | 3 productos, 4 imágenes | **Heredada** (dimensiones iguales a la fuente) | sin cambio |
| Talla "L y XL" y SKU `LG-AUR-000009-L y XL` | 1 | **Heredada** | sin cambio |
| Handle distinto del título (`bikini-shadow-azul-marino` es "NEGRO", `enterizo-shadow-palm-azul-marino` es "NEGRO", `marea-natural` es "BEIGE") | 3 | **Heredada** (mismo slug en la URL vigente) | sin cambio |
| Prefijo de SKU `LG-HOM` en 3 productos de Aurora Viva | 3 | **Heredada** | sin cambio |
| Un archivo Dev con sufijo UUID (`amanecer-dorado-lila`, posición 2) | 1 | **Técnica** (misma imagen, orden correcto) | sin cambio |

### F-01 — `alba-dorada-cafe-claro`: XL en Dev que el sitio actual hoy no ofrece (DEFECT, abierto)

- **Qué:** Dev tiene 4 variantes S/M/L/XL (`LG-AUR-000001-XL` incluida). El sitio actual hoy ofrece S/M/L.
- **Evidencia:** [MEDIDO-03G] en `producto_alba-dorada-cafe-claro.html`, el payload dice `sizes: [S,M,L]`, `sizeStock: {S:25, M:25, L:25}`, `totalStock: 75`, y el DOM tiene 3 botones de talla (ninguno deshabilitado); la tarjeta del producto en `aurora-viva.html` también trae `sizes: [S,M,L]`. [DOC:source-of-truth/public-scrape-raw.json], [DOC:source-of-truth/catalog-snapshot.json] (generado 2026-09-28T12:50Z) y [DOC:catalog/variants-master.csv] (fila `LG-AUR-000001-XL`, "Disponible (InStock) segun web publica, 2026-09-28") listan la XL. Los otros 28 productos coinciden en tallas.
- **Lo que la evidencia no permite afirmar (verificación):** [MEDIDO-03G] el `lastmod` del sitemap actual (`sitemap.xml.txt`) para este producto es `2026-09-27T01:04:35.017Z`, idéntico al de `public-scrape-raw.json` (export del 2026-09-28); los 29 `lastmod` son idénticos entre el export y hoy. O sea, el registro del producto no muestra cambio entre las dos mediciones. Las tallas podrían vivir en una tabla que no actualiza ese campo [NOT_VERIFIED], y tampoco se descarta que el export del 2026-09-28 leyera la talla de otra fuente [NOT_VERIFIED]. Por eso "deriva del sitio actual posterior al export" es [INFERIDO], no un hecho medido.
- **Clase:** diferencia entre dos mediciones públicas del sitio actual (2026-09-28: S/M/L/XL; 2026-09-29: S/M/L). No es una falla de la importación: la Dev replica el export. La causa (talla retirada, agotada, error del export u otra) es [NOT_VERIFIED]; la fuente de verdad es la dueña.
- **Impacto:** si se publica así, Shopify vendería una XL que la tienda actual hoy no lista, y como la Dev Store no rastrea inventario (F-04) aceptaría pedidos sin límite. También rompe el "98 variantes" frente al sitio vivo (97).
- **Acción propuesta:** preguntar a la dueña si existe la XL de este producto. Si no existe, borrar la variante `LG-AUR-000001-XL` en Shopify y en `variants-master.csv`. Si existe, es el sitio actual el que está incompleto. Volver a rastrear antes del corte y comparar de nuevo contra `public-scrape-raw.json`.

### F-02 — Miga "Destacados" en 4 fichas de Espuma de Ola (DEFECT, CORREGIDO en RC1.8 y re-medido en vivo)

> **Cierre (RC1.8 medido en vivo a las ~17:45; documento actualizado a las 18:34):** tras el push de RC1.8 se volvió a leer en vivo la ficha de las 4 (y de 6 controles): miga `Inicio / Espuma de Ola / <título>`, enlace "Volver a Espuma de Ola" y `BreadcrumbList` `Inicio > Espuma de Ola > <título>`; las de Aurora Viva siguen en `Aurora Viva`. Regresión: arnés 74/74 y mutante 51 detectado. El texto de abajo es el de la medición original con RC1.7.

- **Qué:** en Dev la miga de `bikini-palm-verde-oliva`, `bikini-shadow-azul-marino`, `enterizo-shadow-palm-azul-marino` y `entero-golden-hour` es `Inicio / Destacados / <título>`. El sitio actual muestra `Inicio / Espuma de Ola / <título>`. Los 3 productos de Aurora Viva que también están en Destacados sí muestran su colección.
- **Evidencia:** [MEDIDO-03G] campo `crumbs` de `dev-products.jsonl` vs miga del HTML actual. Es el riesgo que 03E dejó como [NOT_VERIFIED] ("Shopify no garantiza el orden de `product.collections`") [DOC:seo/03E-seo-offline-review.md:176-179]; queda confirmado.
- **Causa y corrección:** el theme usaba `collection | default: product.collections.first`. RC1.8 elige la colección cuyo título es igual al tipo del producto [DOC:theme-src/sections/main-product.liquid:25-43]. Entre los manifiestos RC1.7 y RC1.8 **cambia un solo archivo: `sections/main-product.liquid`** [MEDIDO-03G, comparación de SHA-256 por script]. `dev-products.jsonl` se guardó a las 17:31 y el ZIP RC1.8 se construyó a las 17:34, así que la medición es de un theme anterior [INFERIDO por las horas de los archivos; el pie de nota de las otras evidencias dice RC1.7].
- **Impacto:** miga, enlace "Volver a" y `BreadcrumbList` (SEO) apuntarían a Destacados en 4 fichas. El contenido real del JSON-LD Dev no está medido.
- **Acción propuesta:** con RC1.8 cargado en la Dev Store, repetir la captura de `crumbs` (y del JSON-LD) en los 29 PDP. Si las 29 dan `Inicio / <colección> / <título>`, los 4 pasan a `RECONCILED` en `overall_registro_producto`; el `overall` final sigue en `DIFFERENCE` mientras F-03 y F-04 estén abiertas.

### F-03 — Orden por defecto de las colecciones (DIFFERENCE)

- **Qué:** el sitio actual ordena por defecto por "Novedades"; Dev usa el orden manual (rotulado "Destacados"). En las 3 colecciones el conjunto de productos es el mismo, pero **0 de 29 posiciones coinciden** (Oasis Natural 0/10, Aurora Viva 0/12, Espuma de Ola 0/7).
- **Evidencia:** [MEDIDO-03G] opción `novedades` marcada como seleccionada en el selector de orden de las 9 páginas de colección rastreadas (incluidas `oasis-natural`, `aurora-viva` y `espuma-de-ola`); orden real de tarjetas en esos HTML; `order` y `sortOpts` en `dev-collections.json`. Lista completa en `03G-product-parity.summary.json` (`orden_colecciones`). Columnas `collection_pos_current` y `collection_pos_shopify` del CSV.
- **Clase:** no hay decisión documentada para el orden de las 3 colecciones (03D §5 solo trata Destacados), así que cuenta como diferencia no intencional (`ORDEN_COLECCION` en `notes`, `collection_order_match = NO` en los 29). La regla del sitio actual: el código del repo devuelve `createdAt: "asc"` (más antiguo primero) salvo orden por precio, aunque el selector lo rotule "Novedades" [DOC:lib/catalog/catalog-actions.ts:116-122; que el código desplegado sea el mismo es INFERIDO]. `created_at` es NOT_AVAILABLE en `products-master.csv`, así que Shopify no puede reproducirla por fecha. `launch/03G-collection-parity.md` (C-02) trata el mismo hecho desde la colección; no se re-verificó aquí.
- **Impacto:** cambia qué producto abre cada vitrina respecto de hoy. Además debilita la decisión de `featured` (sección 6): 03D dejó fuera de Destacados a `costa-esmeralda-azul`, `brisa-natural-beige` y `oasis-serena-azul` porque hoy salen en la editorial de la Home (las 8 primeras de Oasis Natural). Con el orden de la Dev esos productos ocupan las posiciones 9, 10 y 7 de Oasis Natural [MEDIDO-03G, `dev-collections.json`], y la editorial Dev toma las 8 primeras de Oasis Natural [MEDIDO-03G, `dev-home.json`, sección `featured-collection-editorial`]: `costa-esmeralda-azul` y `brisa-natural-beige` (con `featured=true` en el sitio actual, donde salen primero y segundo en la editorial) **no aparecen hoy en la Home Dev ni en la editorial ni en Destacados**; `oasis-serena-azul` sí sale en la editorial. Mismo hecho que `03G-collection-parity.md` C-02.
- **Acción propuesta:** la dueña decide el orden. Si quiere el de hoy, ordenar a mano en Shopify según `collection_pos_current`.
- **Destacados:** mismo conjunto de 7, orden distinto. El sitio actual los baraja en cada visita y una colección manual tiene orden fijo [DOC:theme/03D-missing-assets-audit.md §5]; es una diferencia aceptada.

### F-04 — Inventario: Shopify no rastrea nada y el sitio actual sí publica cantidades (DIFFERENCE, pendiente de la dueña)

- **Qué:** en Dev las 98 variantes salen "disponibles" sin cantidad (`inventory_tracked=NO` en 29/29 [DOC:catalog/shopify-post-import-audit.csv]; 98/98 disponibles [MEDIDO-03G]). Eso no es inventario real.
- **Hallazgo nuevo:** el payload público de cada ficha actual **sí trae cantidad por talla** (`sizeStock`, `totalStock`). Esto contradice la afirmación de que la web solo confirma disponible o agotado [DOC:MANUAL_STEP_REQUIRED.md:9] y la columna `stock` "NOT_AVAILABLE" de `variants-master.csv`.
- **Valores medidos [MEDIDO-03G]:** 27 productos con 25 por talla; `bikini-foam` S 24, M 24, L 25; `costa-esmeralda-azul` S 24, M 23, L 25. El patrón uniforme sugiere un valor de carga inicial, no un conteo físico [INFERIDO]; la causa de los descuentos en esos 2 productos es [NOT_VERIFIED].
- **Clase:** diferencia no intencional en los 29 (`INVENTARIO` en `notes`, `inventory_match = NO`): la migración no reproduce el stock por talla del sitio actual.
- **Acción propuesta:** la dueña confirma el inventario real por talla antes de cargarlo en Shopify (los números del sitio no deben usarse tal cual sin esa confirmación). Columnas `stock_current_public_payload` y `stock_total_current` del CSV.

### F-05 — Imágenes de baja resolución (NOTE, heredada)

| Producto | Pos. | Dev | Fuente | Igual a la fuente |
|---|---:|---|---|---|
| `brisa-natural-beige` | 1 | 381x678 | 381x678 | Sí |
| `arena-dorada-negro` | 1 | 429x763 | 429x763 | Sí |
| `costa-esmeralda-azul` | 2 | 559x994 | 559x994 | Sí |
| `arena-dorada-negro` | 3 | 653x1161 | 653x1161 | Sí |

Criterio de la lista: lado largo menor de 1200 px, es [INFERIDO] (no hay estándar de la tienda). [MEDIDO-03G] dimensiones Dev; [DOC:import/image-dimensions.csv] dimensiones de la fuente (no re-medidas aquí). Es el límite del original, no una degradación de la migración: el sitio actual sirve el mismo archivo. Pero la posición 1 es la imagen principal de la ficha: en `brisa-natural-beige` y `arena-dorada-negro` la principal es la de baja resolución. Acción: si la dueña tiene originales mejores, reemplazarlas en Shopify. Distribución de las 95 imágenes por lado largo: menos de 1200 px, 4; 1200 a 1799, 4; 1800 a 2399, 16; 2400 a 4999, 28; 5000 (reducidas), 43.

### F-06 — Diferencias intencionales documentadas (NOTE)

Son las filas "Intencional" de la tabla de esta sección: 43 imágenes de 12 productos reducidas a 5000 px de lado largo por el límite de Shopify (misma foto, mismo CDN; 52 imágenes conservan las dimensiones de la fuente); color `Azul`/`Mostaza` a `AZUL`/`MOSTAZA` en 2 productos; handle `COSTA-ESMERALDA-AZUL` a minúsculas con redirección; tag de búsqueda `MOSTAZA` solo en `entero-golden-hour`; `featured=true` no migrado en 3 productos de Oasis Natural (`brisa-natural-beige`, `costa-esmeralda-azul`, `oasis-serena-azul`) por la decisión 03D de Destacados = los 7 de la Home actual. Las cuatro primeras no son fallas. La última es intencional por la decisión 03D, que supuso que la editorial de la Home seguiría mostrando esos productos; con el orden actual de la Dev eso no se cumple para `costa-esmeralda-azul` y `brisa-natural-beige` (F-03). Se deja como intencional en el estado del registro y el efecto se cuenta en F-03.

### Otras notas (heredadas o de contexto)

- **N-1 "L y XL":** el sitio actual tiene 3 botones (S, M, "L y XL"), y su `sizeStock` usa la clave `L y XL` con 25; Dev replica nombre y SKU exactos. Un SKU con espacios y una talla que junta dos tallas con un solo stock: heredado. Decisión de la dueña si quiere separar L y XL (requiere stock por talla).
- **N-2 Handle distinto del título:** en `bikini-shadow-azul-marino` y `enterizo-shadow-palm-azul-marino` la URL dice "azul marino" y el título y el color dicen NEGRO (h1, payload, JSON-LD y `products-master.csv` coinciden en NEGRO; ninguna descripción menciona "azul marino"). Mantener el slug conserva la URL vigente; renombrarlo exige una redirección nueva. Decisión de la dueña. Igual con `marea-natural` (título "MAREA NATURAL BEIGE").
- **N-3 Prefijo LG-HOM:** 3 productos de Aurora Viva llevan SKU `LG-HOM-*` y los otros 9 `LG-AUR-*` (`amanecer-dorado-lila`, `raices-del-sol-beige-suave`, `sol-interno-cafe-claro`). Distribución de prefijos: LG-AUR 9, LG-HOM 3, LG-ESP 7, RSONBI 6, RSONEN 4. Que el prefijo no corresponda a la colección es [INFERIDO]; el significado de "HOM" es NOT_AVAILABLE.
- **N-4 JSON-LD a nivel sitio:** la ficha actual trae 4 bloques (Organization, WebSite con SearchAction, Product, BreadcrumbList); la Dev trae 2 (Product y BreadcrumbList). El único JSON-LD de `theme-src` está en `main-product.liquid` [MEDIDO-03G, búsqueda en el theme]. Es una brecha ya conocida de SEO [DOC:seo/03E-seo-offline-review.md §6], no un problema de datos del producto.
- **N-5 Contador de vistas:** la ficha actual muestra "N vistas" (`showViews: true`); se eliminó a propósito [DOC:theme/product-page-report.md:64]. Que la ficha Dev no lo muestre no está en la evidencia [NOT_VERIFIED].
- **N-6 Favoritos:** el botón existe en 29/29 fichas Dev y en 29/29 actuales, pero `/apps/wishlist` responde 404 en la Dev Store (app no instalada, acción A5 de la dueña) [MEDIDO-03G dev-routes.json]. Que exista el botón no prueba que funcione.
- **N-7 Incoherencias menores de la evidencia:** `dev-routes.json` dice "33 x /producto/<slug>" verificados, mientras el CSV tiene 29 filas de producto y el total verificado es 38 (= 4 + 29 + 5). Probablemente incluye variantes de mayúsculas; no cambia ningún resultado.
- **N-8 `<title>` y meta description de las fichas (no entran en ningún estado):** [MEDIDO-03G] el `<title>` actual es `NOMBRE | Radaelli Swimwear` en 29/29 y el de la Dev `NOMBRE – Radaelli Swimwear Dev` en 29/29 (separador distinto y el sufijo "Dev" del nombre de la tienda de desarrollo); ambos ya están documentados, el separador como cambio menor y el "Dev" como pendiente del nombre de la tienda al lanzar [DOC:seo/03E-seo-offline-review.md §2.2]. La ficha actual trae meta description en 29/29 y es la descripción completa con viñetas. De la Dev solo está guardado el largo: 216 a 320 caracteres; en 27 de 29 coincide con el largo de la descripción en texto plano y en `marea-natural` (descripción de 388) y `marea-natural-naranja` (378) queda en 320, es decir, la meta description está cortada [INFERIDO por el largo]. El contenido de la meta description Dev es [NOT_VERIFIED].

## 7. Los casos conocidos, comprobados uno por uno

| Caso | Resultado |
|---|---|
| (a) Títulos distintos del handle | `bikini-shadow-azul-marino` = "BIKINI SHADOW NEGRO" y `enterizo-shadow-palm-azul-marino` = "ENTERIZO SHADOW PALM NEGRO" en h1, payload, JSON-LD y `products-master.csv`, y en Dev. `title_match` 29/29. Color NEGRO en ambos lados. Heredado (N-2). Aparece un tercero: `marea-natural`. |
| (b) `COSTA-ESMERALDA-AZUL` en mayúsculas | El sitio actual la publica así en URL, canonical y sitemap (línea 75 de `sitemap.xml.txt`) [MEDIDO-03G]. Dev usa `costa-esmeralda-azul`. El CSV de redirecciones conserva el origen exacto en mayúsculas y va a `/products/costa-esmeralda-azul`. 03F midió que Shopify no distingue mayúsculas en el origen [DOC:seo/03F-redirect-import-result.md §3]. [MEDIDO-03G] la URL en minúsculas `/producto/costa-esmeralda-azul` responde **404** en el sitio actual (`launch/evidence/current-site-probe/index.json`, GET puntual guardado en esa carpeta); solo la ruta con mayúsculas responde 200. Corrección de la primera versión de este documento, que la dejaba como [NOT_VERIFIED]. El sitio actual solo tiene la variante con mayúsculas; el CSV de redirecciones la conserva como origen y, como Shopify no distingue mayúsculas (03F), ambas variantes llegan a la misma ficha. |
| (c) Talla "L y XL" | Idéntica en ambos lados (S, M, "L y XL"); SKU `LG-AUR-000009-L y XL` igual a `variants-master.csv`. Heredado (N-1). |
| (d) SKU con prefijos `LG-AUR`, `LG-HOM`, `LG-ESP`, `RSON*` | 98/98 SKU Dev = `<SKU actual>-<talla>`, únicos, e iguales a `variants-master.csv`. El SKU del sitio actual es por producto; el de Dev es por variante. Prefijos: N-3. |
| (e) Imágenes de baja resolución | 4 imágenes con lado largo menor de 1200 px; sus dimensiones son iguales a las de la fuente: es el límite del original (F-05). |
| (f) Tag MOSTAZA solo en `entero-golden-hour` | Confirmado: 1 de 29 productos con tags, y es ese. `?q=mostaza` da 1 resultado [MEDIDO-03G dev-routes]. Recomputado: el color aparece en título y descripción en 23 productos, solo en el título en 4, solo en la descripción en `bikini-foam` y solo por tag en `entero-golden-hour`. Ninguno queda sin poder encontrarse por color. |
| (g) 98 variantes y 95 imágenes | Verificados por script en Dev, en el CSV de importación y en `variants-master.csv`. El sitio actual hoy tiene 97 variantes (F-01) y 95 imágenes. |

## 8. NOT_VERIFIED

- **Inventario y stock real.** Dev no rastrea inventario; las cantidades del sitio actual no están confirmadas como reales (F-04).
- **Carrito y checkout.** No hay evidencia 03G de precios en carrito. "Sin doble descuento" en checkout (`total_discount` = 0) viene de [DOC:theme/03E-checkout-baseline-report.md] y [DOC:theme/03F-mobile-checkout-baseline.md], y no se re-verificó aquí. Mercado Colombia agotado y sin zona de envío (bloqueo A1 de la dueña): las pruebas siguen en US.
- **Redirecciones en vivo por URL.** El CSV y el PDP de destino sí están verificados por producto; el GET de cada redirección solo está como agregado (38 de 38 destinos en 200, 9 de cuenta con redirección presente) en [DOC:seo/03F-redirect-import-result.md §2] y en `dev-routes.json`. El código HTTP exacto (301) tampoco está medido [DOC:seo/03F-redirect-import-result.md §3].
- **Miga y JSON-LD con RC1.8.** Solo hay medición con un theme anterior (F-02). El contenido de los 2 JSON-LD Dev (precio, disponibilidad, SKU, imágenes) no se midió: solo su cantidad.
- **Imágenes: aspecto y metadatos.** El orden se prueba por nombre de archivo, y las dimensiones Dev sí se midieron. No se comparó el aspecto visual, el recorte ni el texto alternativo en Dev. Las dimensiones de la fuente vienen de `image-dimensions.csv` y no se re-midieron.
- **Funciones de la ficha.** Favoritos (N-6), guía de tallas, paneles Descripción, Cuidados y Envíos, y contador de vistas (N-5): fuera de la evidencia guardada.
- **Sitio actual a futuro.** La foto es del 2026-09-29; F-01 muestra dos mediciones distintas del mismo producto (2026-09-28 y 2026-09-29) sin una causa demostrada. Que el código desplegado ordene por `createdAt` ascendente (F-03), la causa de los cambios de stock en 2 productos y la de la ausencia de la XL: no verificadas.

## 9. Cómo reproducir

```
node launch/tools/03g-product-parity.mjs
```

Sin red, sin fechas y sin aleatoriedad: dos corridas seguidas dan el mismo SHA-256 en el CSV y en el `summary.json` (comprobado en esta sesión y otra vez en la verificación, sección 10). Para refrescar el sitio actual antes del corte: `node launch/tools/03g-crawl-current-site.mjs` (GET de solo lectura) y volver a correr este script; refrescar además `dev-products.jsonl` con RC1.8 cargado para cerrar F-02. Después de cada corrida, correr el verificador (`node launch/tools/03g-product-parity-verify.mjs`): debe terminar con `PROBLEMAS (0)`.

## 10. Verificación independiente (adversarial)

**Método.** `launch/tools/03g-product-parity-verify.mjs` parte de la evidencia cruda y no reutiliza el código del script generador. Usa otro método de parseo: tokenizador CSV por expresión regular (el generador usa un autómata carácter a carácter); del sitio actual lee el JSON-LD (`JSON.parse`), los precios y tallas del DOM con expresiones regulares y los campos del payload sobre el HTML sin decodificar (el generador decodifica el payload y balancea llaves); la descripción se compara sin espacios ni viñetas, por conteo de palabras y contra el CSV de importación. Escribe `launch/03G-product-parity-verify.json`.

**Lo que se comprobó (29 productos, todos):**

| Comprobación | Resultado |
|---|---|
| Regeneración del CSV y del `summary.json` con el script original | Idénticos byte a byte (`cmp`) a los archivos entregados |
| 29 filas, 98 variantes Dev (98 SKU únicos), 95 imágenes Dev (95 nombres únicos); sitio actual 29 fichas con 200, 97 variantes visibles, 95 imágenes | Coincide |
| Título: h1 = JSON-LD = payload = `products-master.csv` en el sitio actual; h1 Dev = título Dev = título actual | 29/29 |
| Precio: DOM, JSON-LD, payload y `products-master.csv` coinciden entre sí y con el precio Dev; precio de lista = compare-at Dev; `round(lista x 0,8) = precio`; texto renderizado Dev; CSV de importación | 29/29 (pares 249.900 a 199.920 en 4; 229.900 a 183.920 en 10; 209.900 a 167.920 en 9; 199.900 a 159.920 en 6) |
| Tallas: botones del DOM = payload; tallas Dev = tallas actuales | 28/29; la excepción es `alba-dorada-cafe-claro` (F-01); ningún botón de talla deshabilitado en el sitio actual |
| SKU: Dev = `<SKU base>-<talla>`, presente en `variants-master.csv` y en el CSV de importación | 98/98 |
| Imágenes: orden por nombre, conteo, lista de importación, dimensiones contra `image-dimensions.csv` | 29/29; 52 iguales, 43 reducidas a 5000 px (todas 3333x5000), 0 sin explicar; las 43 son exactamente las de `image-resolution-fix.csv` |
| Descripción (no solo 12: los 29) | Igual sin espacios ni viñetas, igual por palabras, e igual al CSV de importación, en 29/29 |
| Miga y colección | 4 migas distintas (las 4 de Espuma de Ola); 25 iguales; la tabla por producto de este documento coincide con el CSV (handle, colección, tallas, imágenes, estado) |
| Redirección `/producto/<slug>` a `/products/<handle>` en el CSV | 29/29 |
| Home actual: 7 destacados, mismo conjunto que la colección Destacados Dev; 10 con `featured=true`, 3 fuera de la Home | Coincide |
| Orden de colecciones: posiciones recalculadas desde el HTML actual y `dev-collections.json` | 0 de 29 iguales; el CSV coincide con el recálculo |
| Manifiestos RC1.7 y RC1.8 | 96 archivos cada uno; difiere solo `sections/main-product.liquid` |
| Cifras citadas en este documento (color hallable, prefijos, stock distinto de 25, baja resolución, distribución de imágenes, 4 bloques JSON-LD actuales, corazón 29/29) | Coinciden |

**Correcciones hechas en esta verificación:**

1. **`overall` demasiado optimista.** La primera versión dejaba 10 productos en `RECONCILED` y 14 en `RECONCILED_WITH_INTENTIONAL_DIFFERENCE` aunque el propio documento rotulaba como `DIFFERENCE` el orden por defecto (F-03, 0 de 29 posiciones iguales) y el inventario (F-04, no rastreado frente a stock publicado por talla), y aunque su regla dice que toda diferencia no documentada ni deliberada es `DIFFERENCE`. Ahora `overall` = `DIFFERENCE` en los 29 y la situación de la ficha queda en `overall_registro_producto` (10 / 14 / 5). Se agregaron las columnas `overall_registro_producto`, `collection_order_match` e `inventory_match` (59 a 61) y los motivos `ORDEN_COLECCION` e `INVENTARIO` en `notes`. El script generador se corrigió y se regeneró; no se editó el CSV a mano.
2. **F-01: causa no demostrada.** El texto afirmaba que el sitio "cambió después del export". El `lastmod` del sitemap de ese producto y de los otros 28 no cambió entre el export y hoy; la causa queda [NOT_VERIFIED] y "deriva" pasa a [INFERIDO].
3. **Caso (b), URL en minúsculas de `COSTA-ESMERALDA-AZUL`:** estaba como [NOT_VERIFIED] y ya hay medición: 404 en el sitio actual (`current-site-probe/index.json`).
4. **F-03:** la regla del orden actual no era [NOT_VERIFIED]: el código del repo ordena por `createdAt` ascendente. Se agregó el efecto sobre la decisión de `featured` (Home).
5. **IDs de hallazgos:** el documento numeraba baja resolución como F-04 e inventario como F-05, al revés que el resumen del productor; ahora F-04 = inventario, F-05 = baja resolución, F-06 = diferencias intencionales, y las notas menores pasan a N-1 a N-7. Se agregó N-8 (`<title>` y meta description).

**Límites de la verificación.** No se recapturó nada (sin navegador ni GET): todo sale de los archivos guardados. Las dimensiones de la fuente (`image-dimensions.csv`) no se re-midieron. La medición Dev es de un theme anterior a RC1.8, así que F-02 sigue abierto. Que la Dev Store tenga hoy exactamente los datos de `dev-products.jsonl` es [NOT_VERIFIED]: la evidencia es del 2026-09-29 a las 17:31.
