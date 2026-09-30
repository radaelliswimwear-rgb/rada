# 03G — Paridad de colecciones

- **Fecha:** 2026-09-29 (hora de referencia 17:40, Bogotá). Solo lectura: no se tocó ninguna tienda, DNS, Vercel ni Wompi; no hubo POST.
- **Theme evaluado:** Radaelli RC1.8 (SHA-256 `e893b386…fd9e67`, 96 archivos, id 189072474431, sin publicar). Horizon sigue live y no se toca. Sesión de prueba: país US, moneda COP, idioma es. Pagos apagados.
- **Versión de la evidencia Dev:** capturada con **RC1.7** (lo declara `launch/evidence/dev-collections.json`). `theme-src/README.md` dice que RC1.8 solo cambia `sections/main-product.liquid`, así que las páginas de colección no cambian entre RC1.7 y RC1.8 [DOC:theme-src/README.md]. No hay captura Dev con RC1.8: [NOT_VERIFIED].
- **Script:** `launch/tools/03g-collection-parity.mjs` (offline; dos ejecuciones seguidas dan salida idéntica). Su salida literal está en el Anexo A. Un segundo script independiente, `launch/tools/03g-collection-parity-verify.mjs`, recalcula las comprobaciones principales desde el HTML crudo (sección 7).
- **Evidencia añadida en esta tarea:** `launch/evidence/03g-collection-filter-probe/` con 12 GET puntuales de solo lectura al sitio actual (9 con parámetros de filtro/orden y 3 de la Home), hechos con `launch/tools/03g-probe-collection-filters.mjs`. Se hicieron porque la evidencia guardada no permitía saber si los filtros y el orden del sitio actual funcionan (regla 2 de la tarea). Nada más se pidió a `radaelliswimwear.com`.
- **Etiquetas:** [MEDIDO-03G] sale de `launch/evidence`; [DOC:archivo] sale de un documento o del código del repo; [INFERIDO] es una deducción y se dice; [NOT_VERIFIED] no se comprobó. Comparaciones: IGUAL / DISTINTO. Clasificación de cada diferencia: INTENCIONAL (con su fuente), PENDIENTE_OWNER (media, Search & Discovery, decisión de la dueña) o DEFECTO.

## 1. Resultado por colección

| Colección | Esperado | Actual (HTML servido) | Dev (RC1.7) | Membresía | Orden por defecto | Banner |
|---|---|---|---|---|---|---|
| Oasis Natural | 10 | 10 | 10 | IGUAL | DISTINTO (0 de 10 posiciones) | imagen en el actual; arte en Dev |
| Aurora Viva | 12 | 12 | 12 | IGUAL | DISTINTO (0 de 12) | imagen en el actual; arte en Dev |
| Espuma de Ola | 7 | 7 | 7 | IGUAL | DISTINTO (0 de 7) | imagen en el actual; arte en Dev |
| Salidas de Baño | 0 | 0 | 0 | IGUAL | n/a (vacía) | imagen en el actual; arte en Dev |
| Destacados | 7 | 7 (sección "Productos destacados" de la Home; no existe como página) | 7 | IGUAL | DISTINTO (el actual baraja en cada visita) | n/a en el actual; arte en Dev |
| Home page (`frontpage`) | 0 | no existe | 0 | n/a | n/a | n/a en el actual; arte en Dev |

Las cifras 10 / 12 / 7 / 0 / 7 / 0 quedan confirmadas [MEDIDO-03G, Anexo A T1]. Además coinciden con `collections/collections-master.csv` (10/12/7/0) y con `catalog/shopify-post-import-audit.csv` (29 de 29 con `collection_match=true`: Oasis 10, Aurora 12, Espuma 7). Los 29 productos Dev están en exactamente una de las tres colecciones y su `product_type` es el título de esa colección.

**Lo que hay que saber antes de leer el detalle:**

1. La membresía está bien. El orden de las tarjetas no: no coincide ni una posición en las tres colecciones con productos (C-02).
2. Las cuatro colecciones tienen imagen de banner en el sitio actual y ninguna en la Dev; la Dev muestra un arte de color como respaldo. Depende de la carga de medios (M10–M13), que es de la dueña (C-07).
3. Los filtros de talla y color no existen en la Dev hasta instalar Search & Discovery (A3, dueña). Además, según los sondeos y el código, en el sitio actual el filtro de Color no devuelve ningún producto y el de Precio solo devuelve resultados con "Más de $200" (C-13). No hay que reproducirlos tal cual.
4. Tarjetas, precios, `-20%`, imágenes de portada y grilla por breakpoint son IGUAL.
5. Un hallazgo fuera de colecciones pero medido aquí: `alba-dorada-cafe-claro` tiene talla XL en la Dev y el sitio actual ya no la ofrece (C-17).

## 2. Hallazgos y clasificación

| ID | Qué | Evidencia | Clasificación | Impacto | Acción propuesta |
|---|---|---|---|---|---|
| C-01 | Membresía de las 6 colecciones IGUAL (10/12/7/0/7/0). Sin faltantes, repetidos ni productos sin colección. | Anexo A T1; `collections/collections-master.csv`; `catalog/shopify-post-import-audit.csv` | IGUAL | Ninguno | Ninguna |
| C-02 | **Orden de tarjetas DISTINTO en Oasis, Aurora y Espuma: 0 de 29 posiciones coinciden.** El actual ordena por fecha de creación ascendente (más antiguo primero, aunque el selector diga "Novedades"). La Dev ordena por el inverso del orden de importación del CSV. Ninguno de los dos órdenes tiene fuente de verdad en el repo: `collections-master.csv` y `catalog/*.csv` no tienen columna de orden y `created_at` es NOT_AVAILABLE. | Anexo A T2 (tabla por posición y lista de handles); `lib/catalog/catalog-actions.ts` `buildOrderBy` devuelve `{ createdAt: "asc" }` [DOC]; los SKU LG-* crecen en el orden actual de Aurora y Espuma [MEDIDO-03G]; Dev == inverso de `import/shopify-products-03c.csv` en las 3 colecciones (verificado por el script y por el verificador). **Verificador:** el `id` (cuid) de cada producto en el payload RSC del HTML actual lleva la fecha de generación del id, y el orden actual es no decreciente por esa fecha en las 3 colecciones (Oasis 2026-08-11 a 2026-09-03, Aurora 2026-09-03, Espuma 2026-08-11 a 2026-09-04) [MEDIDO-03G, `03g-collection-parity-verify.mjs` V2; que la fecha del id sea la de creación es [INFERIDO]]. El HTML de la Home Dev confirma el primer producto de las 3 colecciones (imagen de respaldo de las tarjetas de categoría) [MEDIDO-03G] | **DEFECTO** (diferencia no intencional; el orden Dev es un efecto de la importación, sin decisión documentada [INFERIDO]) | La primera tarjeta cambia: Oasis `costa-esmeralda-azul` → `marea-natural`; Aurora `alba-dorada-cafe-claro` → `raices-del-sol-beige-suave`; Espuma `entero-golden-hour` → `bikini-palm-verde-oliva`. Como la editorial de la Home toma las 8 primeras de Oasis, también cambia la Home: salen `costa-esmeralda-azul` y `brisa-natural-beige` (ambas `featured=true`) y entran `brisa-natural-naranja` y `oasis-serena-negro` | La dueña decide si conserva el orden actual. Si sí, reordenar a mano cada colección con las listas exactas de la sección 3.2 (escritura en el Admin, con su OK) y volver a correr el script: T2 debe dar IGUAL. El orden "fecha de creación" de Shopify (`created-asc`) no lo reproduce, porque la fecha de creación en Shopify es la de importación [INFERIDO] |
| C-03 | **Destacados: mismos 7 productos (IGUAL); el orden es fijo en la Dev y aleatorio en el actual.** En el actual salen de `featured=true` (10 productos) menos los 3 de Oasis que la editorial ya usa; el código los baraja con `Math.random`. En 4 muestras de la Home (1 del rastreo + 3 GET) hubo 4 órdenes distintos. | Anexo A T3; `lib/catalog/catalog-actions.ts` `listFeaturedProductsAction` [DOC]; `dev-home.json` sección `featured-products` = colección `destacados` | **INTENCIONAL** [DOC:theme/03D-missing-assets-audit.md § 5, opción (a) "paridad visual"] | El orden Dev es arbitrario (inverso de importación). La exclusión de los 3 de Oasis es manual: si cambia la editorial, Shopify no vuelve a deduplicar [DOC:theme/home-report.md, divergencia 1] | Ninguna obligatoria. Opcional: la dueña fija el orden que quiera para los 7 |
| C-04 | `/collections/destacados` existe como URL propia, navegable e indexable (robots vacío, canonical propio), sin descripción y sin equivalente en el sitio actual (no está en el sitemap actual ni en el rastreo de 70 URLs). | `dev-collections.json` (`metaDescChars: 0`, `robots: ""`); `theme/03E-seo-technical-audit.md` § 4.4 [DOC] | **PENDIENTE_OWNER** (decisión menor ya registrada en 03E) | Una página más indexable con los mismos 7 productos | La dueña decide: dejarla o excluirla de buscadores/sitemap |
| C-05 | **Miga de pan de 4 fichas mostraba "Destacados" en vez de "Espuma de Ola"** (`bikini-palm-verde-oliva`, `bikini-shadow-azul-marino`, `enterizo-shadow-palm-azul-marino`, `entero-golden-hour`). Efecto secundario de crear la colección Destacados. | `dev-products.jsonl` campo `crumbs` [MEDIDO-03G; el archivo no declara versión y el patrón coincide con el defecto de RC1.7]; corrección presente en `theme-src/sections/main-product.liquid` y en `theme-src/README.md` (RC1.8) [DOC] | **DEFECTO corregido en RC1.8 y RE-MEDIDO en vivo (18:35):** miga `Inicio / Espuma de Ola / …`, "Volver a Espuma de Ola" y `BreadcrumbList` en las 4 y en 6 controles [MEDIDO-03G]; la evidencia conserva la miga vieja en `crumbsRC17` | Miga, enlace "Volver a…" y `BreadcrumbList` apuntaban a una colección de apoyo (ya no) | Ninguna |
| C-06 | Colecciones que crea Shopify y no tienen equivalente: **Home page (`frontpage`)** con 0 productos, indexable y presente en el sitemap; y `/collections/all` ("Productos"; en `dev-routes.json` solo consta 200 y h1 "Productos", sin conteo: que liste los 29 productos es [INFERIDO], porque `all` incluye todo producto publicado y `dev-products.jsonl` tiene 29). | `dev-collections.json` (nota); `dev-routes.json`; `seo/03F-seo-final-validation.md` hallazgo 2 [DOC]. Si `/collections/all` está en el sitemap: [NOT_VERIFIED] | **PENDIENTE_OWNER** (acción C5 de `theme/03F-owner-actions-minimal.md`) | Sitemap con una colección vacía | Despublicar "Home page" de la Tienda online (dueña). Decidir qué hacer con `/collections/all` |
| C-07 | **Banners: las 4 colecciones tienen foto de portada en el actual; la Dev no tiene ninguna imagen (`bannerImg=false` en las 6) y muestra un arte de color por tono** (degradado con brillo radial y textura diagonal). Según `theme/03C-catalog-import-report.md` punto 27 y `launch/03G-dev-store-snapshot.json` (metafield "Description tone" usado por 4 colecciones), `description_tone` está cargado así: Oasis Natural = `moss` (`#785447 → #442a16 → #28170b`), Aurora Viva = `linen` (`#fcbaf2 → #c69379 → #ad814e`), Espuma de Ola = `fog` (`#fcbaf2 → #ad814e → #785447`), Salidas de Baño = `sand` (`#fcbaf2 → #c69379 → #ad814e`). Destacados y Home page no tienen el metafield y caen en `stone` (`#c69379 → #ad814e → #785447`). Son los mismos tonos que el sitio actual usa como respaldo cuando una categoría no tiene foto. El tono que la Dev renderiza de verdad no está capturado [NOT_VERIFIED]. *(Corregido por el verificador: la versión anterior decía `stone` para las 6.)* | Anexo A T5; `content/media/media-migration-manifest.csv` M10–M13, todas `DEFERRED_OWNER_ONLY_BLOCKER`; las URL de imagen del HTML actual coinciden con las del manifiesto [MEDIDO-03G]; cadena de respaldo en `theme-src/snippets/collection-banner.liquid` y paleta en `theme-src/assets/section-collection-banner.css` [DOC]; tonos cargados [DOC:theme/03C-catalog-import-report.md punto 27]; respaldo del actual [DOC:components/catalog/catalog-page.tsx `CATEGORY_COPY`] | **PENDIENTE_OWNER** (medios; ya registrado como bloqueo solo de la dueña) | Cuatro páginas de categoría sin foto. El respaldo no rompe nada, pero se ve distinto. M13 (Salidas de Baño) pesa unos 6,9 MB y 32,7 MP: exige la entrega transformada que indica el manifiesto | Descargar y subir los archivos con el OK de la dueña, cargar `custom.cover_image`, `image_pos_x`, `image_pos_y`, `zoom` (`content/media/03F-media-owner-runbook.md`) |
| C-08 | Descripción del banner: el largo de la descripción actual coincide con `metaDescChars` de la Dev en las 4 (66/69/63/65). El texto Dev no está en la evidencia. | Anexo A T5 | NOT_VERIFIED (solo coincide el largo) | Posible copy distinto sin detectar | Capturar el texto de `collection.description` de las 4 colecciones en la Dev |
| C-09 | **Tarjetas: título, categoría en la etiqueta, precio, precio anterior, `-20%` y las 2 primeras imágenes IGUAL en los 29 productos.** Formato `$ 183.920`. Los 29 tienen el mismo precio en todas sus variantes, así que la tarjeta (primera variante disponible) no cambia. Precisión del verificador sobre las imágenes: coinciden en nombre base y orden en 29 de 29, pero solo 28 de 29 con el nombre de archivo exacto; en `amanecer-dorado-lila` la 2.ª imagen quedó en Shopify con el sufijo `_<uuid>` que Shopify agrega al renombrar un archivo repetido (`kzdurkrob0ygvugwcmze` → `kzdurkrob0ygvugwcmze_9777540f-…`). Que sea el mismo archivo (píxeles) no se verificó [NOT_VERIFIED]. | Anexo A T4 [MEDIDO-03G]; la ficha Dev muestra el mismo formato en los 29 | IGUAL | Ninguno | Ninguna |
| C-10 | Etiqueta de la tarjeta al pasar el cursor: el actual muestra el botón "Vista rápida" (abre un modal); la Dev muestra la etiqueta "Ver producto", que es decorativa: el overlay tiene `pointer-events: none` y el enlace a la ficha es la imagen de la tarjeta (`<span>`, no `<a>`). Ir a la ficha desde la tarjeta sigue siendo un clic en la imagen en ambos sitios. *(Corregido por el verificador: la versión anterior lo llamaba "enlace directo".)* | HTML actual: "Vista rápida" en las 10 tarjetas de Oasis [MEDIDO-03G]; `theme-src/sections/main-collection.liquid` (`overlay_cta: 'view_product'`) [DOC:theme/03E-accessibility-static-audit.md A11Y-08]; `theme-src/snippets/product-card.liquid` y `theme-src/assets/component-card.css` (`.product-card__overlay { pointer-events: none }`) [DOC] | **INTENCIONAL** | Se pierde la ventana rápida del sitio actual | Ninguna, salvo que la dueña quiera recuperarla |
| C-11 | **Orden (sort): el actual ofrece 3 opciones; la Dev ofrece 9.** Las 9 de la Dev se reparten así: 2 equivalentes exactas (`precio-asc` = `price-asc`, `precio-desc` = `price-desc`), 2 candidatas a "Novedades" (`manual` y `created-asc`) y 5 sin equivalente (`most-relevant`, `best-selling`, `title-asc`, `title-desc`, `created-desc`). "Novedades" del actual es `createdAt` ascendente y ninguna de las dos candidatas lo reproduce (ver C-02). En la Dev, la opción por defecto se rotula "Destacados". | Anexo A T6; nota de `dev-collections.json` (las etiquetas Dev distintas de "Destacados" no se capturaron); `theme/collection-report.md` § 11 [DOC] | **INTENCIONAL** (se iteran las opciones nativas, sin inventar) | Con una tienda sin ventas, `best-selling` no tiene datos que ordenar [INFERIDO]. En el actual, los empates de precio no siguen el orden por defecto (medido); en Shopify el orden de los empates [NOT_VERIFIED] | Ninguna obligatoria. Opción a decidir después: filtrar la lista en el theme |
| C-12 | **Filtros Talla y Color ausentes en la Dev** (solo "Ordenar por" y "Precio"). El actual ofrece Talla (XS, S, M, L, XL, Única), Color (8) y Precio (4 tramos). | Anexo A T7; `dev-collections.json` `filterGroups`; A3 en `theme/03F-owner-actions-minimal.md` [DOC] | **PENDIENTE_OWNER** (instalar Search & Discovery: acepta permisos OAuth, solo la dueña) | Sin talla ni color en colección hasta A3 | Dueña: A3. Después, Claude configura Talla, Color y Precio y corre la matriz de QA de `theme/03F-search-discovery-owner-runbook.md` |
| C-13 | **Filtros del sitio actual: no funcionan como parecen.** Color: la opción "Beige" devuelve 0 productos y `color=BEIGE` devuelve 3, porque el código compara el color con igualdad exacta y los datos están en mayúsculas ("BEIGE", "NEGRO"…). Por los datos, ninguna de las 8 opciones coincide con ningún producto (medido solo con "Beige"). Precio: `precio=menos-50` devuelve 0 y `precio=mas-200` devuelve los 10 (medido); los tramos "$50–$100" y "$100–$200" dan 0 por cálculo, porque el código compara el precio de lista (`Product.priceValue` antes del descuento: 199.900 a 249.900 COP; con descuento 159.920 a 199.920 COP, el conteo por tramo es el mismo) contra 50, 100 y 200 pesos, sin conversión. *(Precisado por el verificador: la versión anterior citaba solo el precio con descuento.)* Talla: `talla=S` devuelve los 10 (medido); las demás tallas no se probaron. Hay además 8 valores distintos de color en los datos que ninguna opción alcanza. | Sondeos [MEDIDO-03G]: `talla=S` → 10; `color=Beige` → 0; `color=BEIGE` → 3; `precio=menos-50` → 0; `precio=mas-200` → 10 (Anexo A T7); `where.color = { in: colors }` y `toSubunits(x)=Math.round(x)` [DOC:lib/catalog/catalog-actions.ts, lib/currency/subunits.ts] | NOTE (defecto del sitio actual, no de la migración) | No hay que reproducir estos filtros. Con A3 la Dev queda mejor que el actual | Ninguna en la migración. Informar a la dueña |
| C-14 | Filtro Precio: el actual usa 4 tramos con "$"; la Dev usa un rango mínimo/máximo nativo. | `theme-src/snippets/collection-filters.liquid` [DOC:theme/collection-report.md § 9] | **INTENCIONAL** | Cambia la forma de filtrar; funciona mejor (ver C-13) | Ninguna |
| C-15 | **Grilla: IGUAL en las 3 vistas (2/3/4 columnas) y en 8 anchos** (375, 639, 640, 767, 768, 1023, 1024, 1440 px). Por defecto: 2 columnas en móvil, 3 desde 768 px. Misma separación (16 px, 24 px desde 640 px). | Anexo A T8: evaluación del CSS de `theme-src/assets/component-grid.css` contra `GRID_CLASSES` de `components/catalog/catalog-grid.tsx`; clases del HTML actual [MEDIDO-03G] | IGUAL | Ninguno | Ninguna |
| C-16 | **Salidas de Baño (0 productos).** Actual: el banner tiene foto, el contador dice "0 productos", se dibujan todos los filtros y el estado vacío dice "No hay productos que coincidan con estos filtros. / Probá quitando algún filtro para ver más resultados." (sin filtros activos). Dev: el theme imprime "No hay productos que coincidan" (`state-empty`), solo hay "Ordenar por", el banner es arte. Menú, footer y tarjeta de la Home la enlazan en ambos. En la Dev la tarjeta de la Home no tiene imagen (M09, marcada CRITICO). | Actual: Anexo A T9 [MEDIDO-03G]. Dev: `dev-collections.json` (`cards: 0`, `filterGroups: ["Ordenar por"]`), `dev-home.json` [MEDIDO-03G]; texto del estado vacío en `theme-src/locales/es.default.json` [DOC]; el render real del vacío en la Dev [NOT_VERIFIED] | **PENDIENTE_OWNER** (imagen M09/M13; decisión de seguir enlazando una colección vacía) | Quien entra ve una colección vacía con un mensaje que habla de filtros en ambos sitios | La dueña decide si la deja enlazada y con qué texto; cargar M09 y M13 |
| C-17 | **`alba-dorada-cafe-claro`: la Dev tiene talla XL y el sitio actual ya no la ofrece.** El scrape del 2026-09-28 traía S/M/L/XL; el HTML del 2026-09-29 trae solo S/M/L (`sizeStock` de la colección y de la ficha). Es el único de los 29 con diferencia de tallas, y ningún precio cambió. | Anexo A T4 (línea "Tallas por producto"); `source-of-truth/public-scrape-raw.json` [DOC]; `launch/evidence/dev-products.jsonl` [MEDIDO-03G] | **DEFECTO** de paridad de catálogo (fuera de colecciones) | La Dev vendería una talla que el sitio actual retiró. Además indica que el sitio actual sigue cambiando después de la exportación | Confirmar con la dueña si XL existe. Quitarla de la Dev o restituirla en el actual. Antes del corte, volver a sincronizar el catálogo |
| C-18 | **Las 5 rutas no migrables siguen vivas en el sitio actual.** `/accesorios`, `/hombre`, `/mujer`, `/ninos` y `/calzado` responden 200, `index, follow`, con 0 productos, arte de color y el mismo estado vacío. Solo `/accesorios` está en el sitemap actual; ninguna está en el menú, el footer ni la Home. En la Dev no existen: no están entre las 47 redirecciones, así que se espera 404 (no medido). | Anexo A T9; `collections/collections-master.csv`; `seo/03E-redirect-plan.md` § 4.1 [DOC] | `/accesorios`: **PENDIENTE_OWNER** (`REQUIRES_DECISION`). `/hombre`, `/mujer`, `/ninos`, `/calzado`: **INTENCIONAL** (`REMOVE`, "intentionally not migrated") | `/accesorios` dejaría de existir siendo una URL del sitemap | La dueña decide para `/accesorios` con Search Console: 301 a `/` o a una colección, o 404. El 404 en la Dev [NOT_VERIFIED] |
| C-19 | **Contador de resultados sin singular** *(hallazgo nuevo del verificador)*. El actual dice "1 producto" y "N productos"; el theme usa una sola cadena (`{{ count }} productos`), así que con 1 resultado dirá "1 productos". El botón "Ver N" del cajón de filtros de la Dev sí distingue singular y plural. | `components/catalog/catalog-toolbar.tsx` líneas 71 y 176 [DOC]; `theme-src/locales/es.default.json` `collections.general.items_count` (cadena única) frente a `general.filters.view_results` (`one` / `other`) [DOC]; `theme-src/sections/main-collection.liquid` línea 33 [DOC]; `03g-collection-parity-verify.mjs` V10 [MEDIDO-03G]. Render de la Dev con 1 resultado: [NOT_VERIFIED] (no se probó un filtro que deje 1) | **DEFECTO** (menor; regresión de texto no intencional) | Solo se ve cuando un filtro deja exactamente 1 producto (por ejemplo un rango de precio). Con las colecciones de hoy (0, 7, 10 y 12) no aparece. Antes de este hallazgo el .md decía que el actual usa la misma forma que la Dev; era incorrecto | Prioridad baja. En un theme futuro, pasar `items_count` a `one` / `other` en `es.default.json` y `en.json`. RC1.8 está sellado por SHA: el cambio exige un RC nuevo |

## 3. Detalle

### 3.1 Membresía

Anexo A T1 lista, por colección, cantidades en el HTML actual (tarjetas, texto "N productos", objetos del payload RSC), en `collections-master.csv`, en `products-master.csv`, en la Dev (`n`, tarjetas, productos con `product_type` igual al título) y los conjuntos de handles. No hay diferencias. Destacados y Home page (0) se comparan con la Home actual y con `dev-home.json`.

### 3.2 Orden

Cómo se obtuvo cada orden:

- **Actual:** orden de las tarjetas `<a href="/producto/…">` en el HTML servido. El código de la página aplica `createdAt: "asc"` salvo `orden=precio-asc|precio-desc`, y el selector lo rotula "Novedades" [DOC:lib/catalog/catalog-actions.ts]. El `PAGE_SIZE` es 200: ninguna colección pagina.
- **Dev:** orden por defecto de `/collections/<h>/products.json` (manual). Es exactamente el inverso del orden de las filas de `import/shopify-products-03c.csv` restringido a cada colección (el script lo comprueba en las tres).

**Orden objetivo si se quiere paridad con el sitio actual** (handles exactos, el primero va arriba):

- Oasis Natural: `costa-esmeralda-azul`, `brisa-natural-beige`, `marea-natural`, `oasis-serena-azul`, `costa-esmeralda-negro`, `marea-natural-naranja`, `arena-dorada-beige`, `arena-dorada-negro`, `brisa-natural-naranja`, `oasis-serena-negro`
- Aurora Viva: `alba-dorada-cafe-claro`, `alba-dorada-beige-suave`, `alba-dorada-lila`, `raices-del-sol-azul-oscuro`, `raices-del-sol-beige-suave`, `sol-interno-cafe-claro`, `sol-interno-beige-suave`, `amanecer-dorado-terracota`, `amanecer-dorado-lila`, `aurora-total-azul-oscuro`, `aurora-total-terracota`, `camiseta-solar-waves-negro`
- Espuma de Ola: `entero-golden-hour`, `bikini-waves-terracota`, `bikini-waves-verde-oliva`, `bikini-shadow-azul-marino`, `bikini-palm-verde-oliva`, `enterizo-shadow-palm-azul-marino`, `bikini-foam`

Estos órdenes son la fotografía del HTML del 2026-09-29. Como el sitio actual sigue cambiando (C-17), conviene volver a leerlos justo antes de reordenar.

**Corroboración del orden actual:** el código dice `createdAt` ascendente; en Aurora Viva los SKU `LG-AUR-000001…9` y `LG-HOM-000001…3` aparecen crecientes dentro de su prefijo, y en Espuma de Ola `LG-ESP-000003…9` también. Oasis Natural usa SKU `RSON*` sin secuencia comparable. Esto respalda que el orden actual es el de creación [INFERIDO], pero la fecha misma es NOT_AVAILABLE. **Corroboración añadida por el verificador:** los `id` de producto del payload RSC (cuid, con la fecha de generación en el prefijo) aparecen en orden no decreciente en las 3 colecciones, incluida Oasis Natural, donde los SKU no sirven [MEDIDO-03G, `03g-collection-parity-verify.mjs` V2; equivalencia fecha del id = creación: INFERIDO]. Por eso `created_at` sigue siendo NOT_AVAILABLE como dato exportado, pero el orden de creación actual se puede leer del HTML. Además, el orden Dev de Aurora y Espuma sale de `products.json` (el HTML de esas colecciones no se capturó); el HTML de la Home Dev confirma solo su primer producto (imagen de respaldo de las tarjetas de categoría), las 8 primeras de Oasis (editorial) y los 7 de Destacados (secciones de la Home).

**Efecto en la Home:** la editorial "La belleza de sentirte tú" toma las 8 primeras de Oasis. Actual: `costa-esmeralda-azul`, `brisa-natural-beige`, `marea-natural`, `oasis-serena-azul`, `costa-esmeralda-negro`, `marea-natural-naranja`, `arena-dorada-beige`, `arena-dorada-negro`. Dev: `marea-natural`, `arena-dorada-beige`, `marea-natural-naranja`, `oasis-serena-negro`, `arena-dorada-negro`, `brisa-natural-naranja`, `oasis-serena-azul`, `costa-esmeralda-negro`. Reordenar Oasis arregla también la editorial (Anexo A T2, última tabla).

### 3.3 Destacados

- **Origen en el sitio actual:** `featured=true` en el payload RSC de las colecciones (10 productos: Oasis 3, Aurora 3, Espuma 4). La Home los pide después de la editorial y excluye los que la editorial ya usó. Quedan 7 (Aurora 3 + Espuma 4), que es lo que muestra "Productos destacados". Como llegan a 7, no entra el relleno aleatorio.
- **En la Dev:** colección manual `destacados` con esos 7, conectada a la sección `featured-products` (`dev-home.json`): mismo conjunto y mismo orden que la colección.
- **Diferencia real:** el sitio actual baraja. Cuatro muestras (rastreo + 3 GET consecutivos) dieron 4 órdenes distintos con el mismo conjunto. Shopify no baraja de forma nativa. Está registrado como decisión (a) en 03D.

### 3.4 Tarjetas y precios

Anexo A T4 compara los 29 productos uno por uno. Diferencias de contenido: ninguna. Diferencias de comportamiento: "Vista rápida" frente a "Ver producto" (C-10). Tres precisiones:

- El HTML de la **tarjeta** Dev no se capturó (solo conteos): el formato `$ 183.920` en tarjeta Dev es [NOT_VERIFIED]; en la ficha Dev sí se mide igual en los 29 [MEDIDO-03G] y la tarjeta usa el mismo snippet `price` [DOC]. El carácter tras "$" es U+00A0 en el HTML actual; la captura Dev normalizó los espacios, así que ese detalle es [NOT_VERIFIED] y visualmente no cambia.
- En el actual, el `-20%` sale del cálculo del sitio; en la Dev es un precio anterior fijo del CSV (precio = 80 % del anterior en los 29). Si la dueña cambia el porcentaje de la tienda, en Shopify hay que cambiar los precios.
- Ambas tarjetas nacen con `opacity:0` y se muestran por JavaScript; no es una diferencia.

### 3.5 Banner y respaldo

`collection-banner.liquid` prueba en este orden: video de portada, imagen de portada con encuadre (si existen `pos_x`, `pos_y` y `zoom`), imagen nativa de la colección y, si no hay nada, arte por tono. Los metafields de portada (`cover_image`, `image_pos_x`, `image_pos_y`, `zoom`) están vacíos, así que las 6 colecciones caen en el arte por tono. `description_tone` sí tiene dato en 4 colecciones (Oasis Natural `moss`, Aurora Viva `linen`, Espuma de Ola `fog`, Salidas de Baño `sand`) [DOC:theme/03C-catalog-import-report.md punto 27; `launch/03G-dev-store-snapshot.json`: "Description tone" usado por 4 colecciones]; Destacados y Home page usan el tono por defecto `stone`. Esos 4 tonos coinciden con el respaldo que usa el sitio actual (`CATEGORY_COPY` en `components/catalog/catalog-page.tsx`). El tono realmente renderizado en la Dev no se capturó: [NOT_VERIFIED]. *(Corregido por el verificador: la versión anterior afirmaba `stone` en las 6 y "description_tone sin cargar".)* El texto (eyebrow "Colección", título y descripción) no depende del fondo. El actual usa foto en las 4 colecciones (Salidas de Baño incluida); las 5 rutas no migrables usan arte por tono, igual que el mecanismo de respaldo de la Dev.

### 3.6 Sort y 3.7 Filtros

Ver C-11 a C-14 y Anexo A T6/T7. Los sondeos de orden por precio muestran que el sitio actual ordena bien por precio, y que dentro de cada precio los productos salen en un orden distinto al orden por defecto; no hay una secuencia de empates que copiar.

### 3.8 Grilla

Anexo A T8. Vista 3 (por defecto): 2 columnas hasta 767 px y 3 desde 768 px, en ambos sitios. Vista 4: 2, 3 desde 640 px, 4 desde 768 px. Vista 2: 1 columna en móvil y 2 desde 640 px. Productos por página: 24 en el theme frente a 200 en el actual; con 12 productos como máximo no se nota. Los ajustes leídos son los de `theme-src/config/settings_data.json`; el valor guardado en la Dev Store es [NOT_VERIFIED].

### 3.9 Salidas de Baño y rutas no migrables

Ver C-16 y C-18, y Anexo A T9. El estado vacío de un tema o del otro no dice "próximamente" ni ofrece un enlace de vuelta; eso es un texto por decidir, no una diferencia entre sitios.

## 4. Acciones propuestas

**Dueña** (nadie más puede hacerlas o decidirlas):

1. Decidir el orden de las tarjetas (C-02) y, si conserva el actual, autorizar el reordenamiento.
2. Subir los medios M10–M13 (banners) y M09 (tarjeta de Salidas de Baño) (C-07, C-16).
3. Instalar Search & Discovery, acción A3 (C-12).
4. Decidir `/accesorios` (C-18), qué hacer con `/collections/destacados` (C-04) y despublicar "Home page" (C-06).
5. Confirmar si `alba-dorada-cafe-claro` tiene talla XL (C-17).
6. Decidir si Salidas de Baño sigue enlazada mientras esté vacía y con qué texto (C-16).

**Claude, con el OK de la dueña:**

1. Reordenar las 3 colecciones con las listas de la sección 3.2 y volver a capturar (el script debe dar IGUAL en T2).
2. (La miga de las 4 fichas, C-05, ya se re-midió con RC1.8: cerrado.) Volver a capturar con RC1.8 el texto de las descripciones de colección (C-08) y el HTML de una tarjeta y del estado vacío de Salidas de Baño (C-16).
3. Configurar filtros con Search & Discovery una vez instalada (C-12).

**Theme:** este análisis no exige ningún cambio para las 4 colecciones de hoy. Cambios posibles, no decididos: limitar las opciones de orden a las equivalentes al sitio actual; un texto propio para colecciones vacías; el singular del contador de resultados (C-19, prioridad baja; exige un RC nuevo porque RC1.8 está sellado por SHA).

## 5. Límites y qué no se verificó

- **Lo medido son fotografías del 2026-09-29.** Dev: capturas de las 17:28 a las 17:33 con RC1.7 (colecciones, Home y rutas; `dev-products.jsonl` no declara hora ni versión). Sitio actual: el rastreo previo de 70 URLs (54 con 200, 16 con 404) y 12 GET puntuales de esta tarea.
- **Orden de las tarjetas actuales:** es el del HTML servido en esa fecha, no una lista guardada en ningún lado.
- **Filtros del sitio actual:** probados con GET en Oasis Natural (5 combinaciones). El resto (Aurora, Espuma, otras tallas y colores) se deduce del código y de los datos; las opciones de color y talla del HTML coinciden con las constantes del código (Anexo A T10). Que lo desplegado sea idéntico al repo: [NOT_VERIFIED].
- **Dev:** no se capturó el HTML de una tarjeta de colección, ni el estado vacío, ni las etiquetas de las 9 opciones de orden (salvo "Destacados"), ni el texto de las descripciones, ni la miga de las fichas con RC1.8. Los ajustes de columnas y de paginación son los del código, no los guardados en la tienda.
- **404 esperado de las 5 rutas no migrables en la Dev:** deducido de que no están en las 47 redirecciones; no se probó.
- **`/collections/all` en el sitemap y estado de `/destacados` en el sitio actual:** no probados.
- **NOT_AVAILABLE:** fecha de creación de los productos como dato exportado (fuente del orden actual; ver la corroboración por `id` en 3.2), estado real de indexación de las rutas retiradas en Google.
- **Añadido por el verificador:** (a) el tono del arte del banner que la Dev renderiza de verdad no está capturado: [NOT_VERIFIED] (3.5, C-07); (b) título, meta description y JSON-LD de las páginas de colección no se compararon: el actual tiene título "<colección> | Radaelli Swimwear", canonical propio, `index, follow` y solo JSON-LD de sitio (Organization, WebSite) [MEDIDO-03G], y `dev-collections.json` no captura el título Dev; (c) el sitio actual usa `COSTA-ESMERALDA-AZUL` en mayúsculas en su URL y Shopify lo normaliza a minúsculas (registrado en `import/README.md` y en las redirecciones); todas las comparaciones de este documento usan minúsculas; (d) la regla de la tarea permite un GET puntual solo si la evidencia guardada no alcanza: el rastreo previo no tenía páginas con parámetros ni muestras repetidas de la Home, así que los sondeos se justifican, pero fueron 12 y no uno; el verificador no hizo ninguna petición de red.

## 6. Cómo reproducir

```
node launch/tools/03g-collection-parity.mjs
node launch/tools/03g-collection-parity-verify.mjs
```

Ambos leen `launch/evidence/**`, los CSV del repo, `theme-src/**` y el código del sitio actual dentro del repo. No usan red. El segundo es el verificador independiente: parte del HTML crudo y de `dev-collections.json` sin reutilizar código del primero y termina con "Comprobaciones con FALLA: 0" si todo coincide (ver la sección 7). Los sondeos se rehacen con `node launch/tools/03g-probe-collection-filters.mjs` (12 GET de solo lectura); es el único script de esta tarea que usa red.

## 7. Verificación independiente (2026-09-29, hora de referencia 17:40)

Script: `launch/tools/03g-collection-parity-verify.mjs` (offline, determinista: dos ejecuciones idénticas). Recalcula desde el HTML actual crudo y desde `dev-collections.json`. Resultado final: 105 comprobaciones en OK y 0 con FALLA, después de corregir el documento y el script del productor. La primera pasada del verificador tuvo 1 FALLA real (imágenes con nombre exacto, ver C-09); las demás fallas iniciales eran de la propia expresión regular del verificador y se corrigieron.

| Comprobación | Resultado |
|---|---|
| Membresía: 10 / 12 / 7 / 0 en 9 fuentes (href de tarjeta, payload RSC, texto "N productos", `resultCount`, `collections-master.csv`, `products-master.csv`, Dev `n`, Dev `order`, Dev `product_type`) y los mismos 29 handles en actual y Dev | Confirmado |
| Orden por defecto: 0 posiciones coincidentes en Oasis (10), Aurora (12) y Espuma (7); Dev == inverso de `import/shopify-products-03c.csv` y de `catalog/products-master.csv` | Confirmado |
| Orden actual == creación ascendente (por el `id` cuid) en las 3 colecciones | Confirmado [INFERIDO en la equivalencia id = creación] |
| Home: editorial actual = 8 primeras de Oasis en orden actual; editorial Dev = 8 primeras en orden Dev; difieren 2 de 8 (salen `costa-esmeralda-azul` y `brisa-natural-beige`; entran `oasis-serena-negro` y `brisa-natural-naranja`) | Confirmado |
| Destacados: `featured=true` 10 (3 + 3 + 4), menos la editorial = 7 = Dev; 4 muestras de la Home con el mismo conjunto y 4 órdenes distintos | Confirmado |
| Tarjetas (título, categoría, precio, anterior, porcentaje, formato de precio en la ficha): 29 / 29. Imágenes: nombre base 29 / 29, nombre exacto 28 / 29 | Confirmado con la precisión de C-09 |
| Tallas: solo `alba-dorada-cafe-claro` difiere (actual S/M/L en colección y ficha, `sizeStock` 25/25/25; Dev S/M/L/XL; el `lastmod` del sitemap no cambió, así que no fecha el retiro) | Confirmado |
| Banner: imagen presente y sin video en las 4 del actual; URL igual a M10–M13; largo de descripción actual == `metaDescChars` Dev en las 4 (66 / 69 / 63 / 65); Dev sin imagen en las 6 | Confirmado |
| Filtros y orden del actual: opciones == constantes del código; sondeos `talla=S` 10, `color=Beige` 0, `color=BEIGE` 3, `precio=menos-50` 0, `precio=mas-200` 10; precio y orden por precio monótonos; empates fuera del orden por defecto | Confirmado |
| Grilla: evaluador CSS propio sobre `component-grid.css` contra `GRID_CLASSES`, 3 vistas × 8 anchos | Confirmado (IGUAL) |
| Miga: 4 fichas Dev con "Destacados"; RC1.8 corrige la fuente (`product_collection.title == product.type`) | Confirmado y **re-medido en vivo con RC1.8 (18:35)**: las 4 muestran su categoría |
| Salidas de Baño y las 5 rutas no migrables: 200, `index, follow`, contador 0, estado vacío; Salidas de Baño está en el sitemap y enlazada desde la Home; de las 5 rutas no migrables solo `/accesorios` está en el sitemap y ninguna está enlazada desde la Home | Confirmado |

**Correcciones hechas al documento y al script** (el resto de afirmaciones se sostuvo):

1. C-07 / 3.5 / Anexo A T5: el arte de respaldo de la Dev no es `stone` en las 6. Según 03C punto 27 y el snapshot, 4 colecciones tienen `description_tone` (`moss`, `linen`, `fog`, `sand`); solo Destacados y Home page usan `stone`. El render real sigue sin capturarse.
2. C-10: "Ver producto" no es un enlace propio; es una etiqueta decorativa sobre la imagen, que es el enlace.
3. C-09: las imágenes coinciden en nombre base en 29 / 29, pero una tiene sufijo `_<uuid>` de Shopify (`amanecer-dorado-lila`, 2.ª imagen).
4. C-13 / Anexo A T7: el filtro de precio compara el precio de lista, no el precio con descuento; el conteo por tramo no cambia.
5. Anexo A T9: el sitio actual sí pluraliza el contador ("1 producto"); la Dev no. Nuevo hallazgo C-19.
6. C-06: el "29" de `/collections/all` no consta en la evidencia citada; queda [INFERIDO].
7. Anexo A: una línea (T4, "Formato de precio") salió corrupta al pegarla en el .md (se perdió el carácter `$`). El anexo se regeneró desde el script.

## Anexo A — Salida literal de `launch/tools/03g-collection-parity.mjs`

Determinista y offline. Etiquetas: [MEDIDO-03G] = leido de launch/evidence; [DOC] = leido de un archivo del repo; [INFERIDO] = deduccion declarada.

## T1. Membresia (handles en minuscula)

| Coleccion | Esperado (encargo) | Actual: tarjetas HTML | Actual: texto 'N productos' | Actual: objetos RSC | collections-master.csv | products-master.csv (col. collection) | Dev: n | Dev: tarjetas | Dev: productos con product_type = coleccion | Membresia | Solo en actual | Solo en Dev |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Oasis Natural | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | IGUAL | - | - |
| Aurora Viva | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | IGUAL | - | - |
| Espuma de Ola | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | IGUAL | - | - |
| Salidas de Baño | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | IGUAL | - | - |
| Destacados (actual = seccion 'Productos destacados' de la Home) | 7 | 7 | n/a | n/a | n/a (no esta en collections-master.csv) | n/a | 7 | 7 | n/a | IGUAL | - | - |
| Home page (frontpage, automatica de Shopify) | 0 | no existe | no existe | no existe | no existe | no existe | 0 | 0 | n/a | n/a | - | - |

Cifras del encargo (10/12/7/0/7/0) confirmadas en actual y Dev: SI
Handles de las 3 colecciones Dev cuyo product_type != titulo de la coleccion: ninguno
Union de las 3 colecciones Dev = 29 productos; productos Dev totales = 29; sin coleccion: ninguno
Productos repetidos entre las 3 colecciones Dev: no
catalog/shopify-post-import-audit.csv (03C): filas 29; collection_match=true en 29; por collection_shopify: Aurora Viva 12, Espuma de Ola 7, Oasis Natural 10.

## T2. Orden de las tarjetas (actual = orden del HTML servido; Dev = orden por defecto de /collections/<h>/products.json)

### Oasis Natural

| Pos | Actual (handle) | Dev (handle en la misma posicion) | Posicion en Dev del handle actual | Delta |
|---|---|---|---|---|
| 1 | costa-esmeralda-azul | marea-natural | 9 | 8 |
| 2 | brisa-natural-beige | arena-dorada-beige | 10 | 8 |
| 3 | marea-natural | marea-natural-naranja | 1 | -2 |
| 4 | oasis-serena-azul | oasis-serena-negro | 7 | 3 |
| 5 | costa-esmeralda-negro | arena-dorada-negro | 8 | 3 |
| 6 | marea-natural-naranja | brisa-natural-naranja | 3 | -3 |
| 7 | arena-dorada-beige | oasis-serena-azul | 2 | -5 |
| 8 | arena-dorada-negro | costa-esmeralda-negro | 5 | -3 |
| 9 | brisa-natural-naranja | costa-esmeralda-azul | 6 | -3 |
| 10 | oasis-serena-negro | brisa-natural-beige | 4 | -6 |

Posiciones que coinciden: 0 de 10. Orden DISTINTO.
[INFERIDO, verificado aqui] Dev == orden INVERSO del CSV de importacion (import/shopify-products-03c.csv) restringido a la coleccion: SI.
Dev == orden inverso de catalog/products-master.csv: SI. Actual == orden de products-master.csv: NO.

### Aurora Viva

| Pos | Actual (handle) | Dev (handle en la misma posicion) | Posicion en Dev del handle actual | Delta |
|---|---|---|---|---|
| 1 | alba-dorada-cafe-claro | raices-del-sol-beige-suave | 2 | 1 |
| 2 | alba-dorada-beige-suave | alba-dorada-cafe-claro | 3 | 1 |
| 3 | alba-dorada-lila | alba-dorada-beige-suave | 12 | 9 |
| 4 | raices-del-sol-azul-oscuro | aurora-total-terracota | 11 | 7 |
| 5 | raices-del-sol-beige-suave | aurora-total-azul-oscuro | 1 | -4 |
| 6 | sol-interno-cafe-claro | amanecer-dorado-lila | 7 | 1 |
| 7 | sol-interno-beige-suave | sol-interno-cafe-claro | 8 | 1 |
| 8 | amanecer-dorado-terracota | sol-interno-beige-suave | 9 | 1 |
| 9 | amanecer-dorado-lila | amanecer-dorado-terracota | 6 | -3 |
| 10 | aurora-total-azul-oscuro | camiseta-solar-waves-negro | 5 | -5 |
| 11 | aurora-total-terracota | raices-del-sol-azul-oscuro | 4 | -7 |
| 12 | camiseta-solar-waves-negro | alba-dorada-lila | 10 | -2 |

Posiciones que coinciden: 0 de 12. Orden DISTINTO.
[INFERIDO, verificado aqui] Dev == orden INVERSO del CSV de importacion (import/shopify-products-03c.csv) restringido a la coleccion: SI.
Dev == orden inverso de catalog/products-master.csv: SI. Actual == orden de products-master.csv: NO.

### Espuma de Ola

| Pos | Actual (handle) | Dev (handle en la misma posicion) | Posicion en Dev del handle actual | Delta |
|---|---|---|---|---|
| 1 | entero-golden-hour | bikini-palm-verde-oliva | 7 | 6 |
| 2 | bikini-waves-terracota | bikini-waves-verde-oliva | 4 | 2 |
| 3 | bikini-waves-verde-oliva | bikini-foam | 2 | -1 |
| 4 | bikini-shadow-azul-marino | bikini-waves-terracota | 6 | 2 |
| 5 | bikini-palm-verde-oliva | enterizo-shadow-palm-azul-marino | 1 | -4 |
| 6 | enterizo-shadow-palm-azul-marino | bikini-shadow-azul-marino | 5 | -1 |
| 7 | bikini-foam | entero-golden-hour | 3 | -4 |

Posiciones que coinciden: 0 de 7. Orden DISTINTO.
[INFERIDO, verificado aqui] Dev == orden INVERSO del CSV de importacion (import/shopify-products-03c.csv) restringido a la coleccion: SI.
Dev == orden inverso de catalog/products-master.csv: SI. Actual == orden de products-master.csv: NO.

### Corroboracion de la fuente del orden actual

- Codigo del sitio actual (`lib/catalog/catalog-actions.ts`, funcion buildOrderBy): orden por defecto `createdAt: "asc"` (mas antiguo primero): SI [DOC].
- Etiqueta del selector del sitio actual para ese orden por defecto: 'Novedades' (valor `novedades`) [MEDIDO-03G]; el codigo lo resuelve como createdAt ascendente, es decir 'antiguos primero'.
- Secuencia de SKU LG-* en el orden actual (indicio de orden de creacion): Aurora Viva: LG-AUR:1>2>3>4>5>6>7>8>9 (creciente); LG-HOM:1>2>3 (creciente). Espuma de Ola: LG-ESP:3>4>5>6>7>8>9 (creciente). Oasis Natural usa SKU RSON* sin secuencia numerica comparable.
- created_at en catalog/products-master.csv: NOT_AVAILABLE (no hay fecha de creacion exportada; el orden actual no se puede derivar de los CSV).
- Columnas de orden/posicion en los CSV del repo: collections/collections-master.csv -> ninguna; catalog/products-master.csv -> ninguna; catalog/variants-master.csv -> ninguna; catalog/shopify-post-import-audit.csv -> ninguna; source-of-truth/catalog-snapshot.json (claves de producto): ninguna; claves de coleccion: slug,productCount. Conclusion: el repo NO contiene una fuente de verdad del orden de las tarjetas; la unica evidencia del orden actual es el HTML servido (T2) [MEDIDO-03G].
- Orden Dev de colecciones manuales (default) proviene del orden de alta en la importacion (ver 'INVERSO' arriba), no de una decision editorial documentada [INFERIDO].

### Orden objetivo si se quiere paridad con el sitio actual (handles exactos, primero = arriba)

- Oasis Natural: `costa-esmeralda-azul`, `brisa-natural-beige`, `marea-natural`, `oasis-serena-azul`, `costa-esmeralda-negro`, `marea-natural-naranja`, `arena-dorada-beige`, `arena-dorada-negro`, `brisa-natural-naranja`, `oasis-serena-negro`
- Aurora Viva: `alba-dorada-cafe-claro`, `alba-dorada-beige-suave`, `alba-dorada-lila`, `raices-del-sol-azul-oscuro`, `raices-del-sol-beige-suave`, `sol-interno-cafe-claro`, `sol-interno-beige-suave`, `amanecer-dorado-terracota`, `amanecer-dorado-lila`, `aurora-total-azul-oscuro`, `aurora-total-terracota`, `camiseta-solar-waves-negro`
- Espuma de Ola: `entero-golden-hour`, `bikini-waves-terracota`, `bikini-waves-verde-oliva`, `bikini-shadow-azul-marino`, `bikini-palm-verde-oliva`, `enterizo-shadow-palm-azul-marino`, `bikini-foam`

### Efecto en la Home (la editorial toma las 8 primeras de Oasis Natural)

|  | Handles (orden) |
|---|---|
| Actual (Home) [MEDIDO-03G] | costa-esmeralda-azul, brisa-natural-beige, marea-natural, oasis-serena-azul, costa-esmeralda-negro, marea-natural-naranja, arena-dorada-beige, arena-dorada-negro |
| Dev (dev-home.json) [MEDIDO-03G] | marea-natural, arena-dorada-beige, marea-natural-naranja, oasis-serena-negro, arena-dorada-negro, brisa-natural-naranja, oasis-serena-azul, costa-esmeralda-negro |
| Primeras 8 de Oasis en el orden actual | costa-esmeralda-azul, brisa-natural-beige, marea-natural, oasis-serena-azul, costa-esmeralda-negro, marea-natural-naranja, arena-dorada-beige, arena-dorada-negro |
| Primeras 8 de Oasis en el orden Dev | marea-natural, arena-dorada-beige, marea-natural-naranja, oasis-serena-negro, arena-dorada-negro, brisa-natural-naranja, oasis-serena-azul, costa-esmeralda-negro |

Editorial actual == 8 primeras de Oasis en orden actual: IGUAL. Editorial Dev == 8 primeras del orden Dev: IGUAL.
Editorial actual vs Dev (conjunto): DISTINTO; solo actual: costa-esmeralda-azul, brisa-natural-beige; solo Dev: oasis-serena-negro, brisa-natural-naranja.

## T3. Destacados

| Coleccion actual | Productos con featured=true en el payload RSC [MEDIDO-03G] |
|---|---|
| Oasis Natural | costa-esmeralda-azul, brisa-natural-beige, oasis-serena-azul |
| Aurora Viva | alba-dorada-lila, raices-del-sol-beige-suave, aurora-total-azul-oscuro |
| Espuma de Ola | entero-golden-hour, bikini-shadow-azul-marino, bikini-palm-verde-oliva, enterizo-shadow-palm-azul-marino |

Total featured=true: 10 de 29 productos.
featured=true menos los de la editorial (regla de app/page.tsx: la editorial se elige primero y se excluye): 7 -> IGUAL frente a los 7 que muestra la Home.
Home 'Productos destacados' (orden de la captura, 1 muestra): entero-golden-hour, bikini-shadow-azul-marino, raices-del-sol-beige-suave, alba-dorada-lila, aurora-total-azul-oscuro, enterizo-shadow-palm-azul-marino, bikini-palm-verde-oliva
Dev coleccion 'destacados' (orden por defecto): bikini-palm-verde-oliva, raices-del-sol-beige-suave, aurora-total-azul-oscuro, enterizo-shadow-palm-azul-marino, alba-dorada-lila, bikini-shadow-azul-marino, entero-golden-hour
Dev Home seccion featured-products (dev-home.json) usa la coleccion 'destacados' con 7 tarjetas; orden == coleccion Dev: IGUAL.
Muestras del orden en la Home actual [MEDIDO-03G]: captura del rastreo + 3 GET puntuales consecutivos; ordenes distintos entre las 4 muestras: 4; conjuntos iguales entre las 4: IGUAL. El orden cambia entre visitas.
Conjunto Home actual vs Dev destacados: IGUAL. Orden de la captura actual vs Dev: DISTINTO.
Posicion en Dev de cada handle de la captura actual (misma secuencia): 7, 6, 2, 5, 3, 4, 1
Origen en el sitio actual [DOC: lib/catalog/catalog-actions.ts listFeaturedProductsAction]: consulta featured=true + active, excluye los slugs de la editorial, relleno solo si hay menos de FEATURED_MIN_COUNT=7, y baraja con Math.random: SI (orden distinto en cada visita).
Los 7 destacados pertenecen a: Espuma de Ola + Aurora Viva (por producto: Espuma de Ola 4, Aurora Viva 3).
Dev 'destacados': metaDescChars=0, robots='' (vacio = indexable), canonical propio: <dev>/collections/destacados. En el sitio actual no existe /destacados (no esta en index.json ni en el sitemap): no esta / no esta en el sitemap.

Miga de pan de la ficha en Dev [MEDIDO-03G, dev-products.jsonl, capturado sin declarar version; coincide con el defecto de RC1.7]: fichas cuya miga dice 'Destacados' en vez de su coleccion: 4 -> bikini-palm-verde-oliva, bikini-shadow-azul-marino, enterizo-shadow-palm-azul-marino, entero-golden-hour.
theme-src/sections/main-product.liquid (RC1.8) contiene la correccion (usa la coleccion cuyo titulo == product.type): SI [DOC]. Verificacion en vivo con RC1.8: NOT_VERIFIED (no hay captura posterior).

## T4. Tarjetas y precios (actual = tarjeta HTML de la coleccion; Dev = variante de dev-products.jsonl, formato de la ficha Dev)

| Coleccion | Handle | Actual: precio / anterior / % [tarjeta HTML] | Dev: precio / anterior / % [calculado de la variante] | Titulo | Badge de categoria = product_type | 2 primeras imagenes (nombre) | Dev: variantes (tallas) | Actual: tallas |
|---|---|---|---|---|---|---|---|---|
| Oasis Natural | costa-esmeralda-azul | $ 183.920 / $ 229.900 / -20% | $ 183.920 / $ 229.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Oasis Natural | brisa-natural-beige | $ 199.920 / $ 249.900 / -20% | $ 199.920 / $ 249.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Oasis Natural | marea-natural | $ 183.920 / $ 229.900 / -20% | $ 183.920 / $ 229.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Oasis Natural | oasis-serena-azul | $ 199.920 / $ 249.900 / -20% | $ 199.920 / $ 249.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Oasis Natural | costa-esmeralda-negro | $ 183.920 / $ 229.900 / -20% | $ 183.920 / $ 229.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Oasis Natural | marea-natural-naranja | $ 183.920 / $ 229.900 / -20% | $ 183.920 / $ 229.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Oasis Natural | arena-dorada-beige | $ 183.920 / $ 229.900 / -20% | $ 183.920 / $ 229.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Oasis Natural | arena-dorada-negro | $ 183.920 / $ 229.900 / -20% | $ 183.920 / $ 229.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Oasis Natural | brisa-natural-naranja | $ 199.920 / $ 249.900 / -20% | $ 199.920 / $ 249.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Oasis Natural | oasis-serena-negro | $ 199.920 / $ 249.900 / -20% | $ 199.920 / $ 249.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Aurora Viva | alba-dorada-cafe-claro | $ 167.920 / $ 209.900 / -20% | $ 167.920 / $ 209.900 / -20% | = | = | = | 4 (S\|M\|L\|XL) | S\|M\|L |
| Aurora Viva | alba-dorada-beige-suave | $ 167.920 / $ 209.900 / -20% | $ 167.920 / $ 209.900 / -20% | = | = | = | 4 (S\|M\|L\|XL) | S\|M\|L\|XL |
| Aurora Viva | alba-dorada-lila | $ 167.920 / $ 209.900 / -20% | $ 167.920 / $ 209.900 / -20% | = | = | = | 4 (S\|M\|L\|XL) | S\|M\|L\|XL |
| Aurora Viva | raices-del-sol-azul-oscuro | $ 167.920 / $ 209.900 / -20% | $ 167.920 / $ 209.900 / -20% | = | = | = | 4 (S\|M\|L\|XL) | S\|M\|L\|XL |
| Aurora Viva | raices-del-sol-beige-suave | $ 167.920 / $ 209.900 / -20% | $ 167.920 / $ 209.900 / -20% | = | = | = | 4 (S\|M\|L\|XL) | S\|M\|L\|XL |
| Aurora Viva | sol-interno-cafe-claro | $ 167.920 / $ 209.900 / -20% | $ 167.920 / $ 209.900 / -20% | = | = | = | 4 (S\|M\|L\|XL) | S\|M\|L\|XL |
| Aurora Viva | sol-interno-beige-suave | $ 167.920 / $ 209.900 / -20% | $ 167.920 / $ 209.900 / -20% | = | = | = | 4 (S\|M\|L\|XL) | S\|M\|L\|XL |
| Aurora Viva | amanecer-dorado-terracota | $ 167.920 / $ 209.900 / -20% | $ 167.920 / $ 209.900 / -20% | = | = | = | 4 (S\|M\|L\|XL) | S\|M\|L\|XL |
| Aurora Viva | amanecer-dorado-lila | $ 167.920 / $ 209.900 / -20% | $ 167.920 / $ 209.900 / -20% | = | = | = | 4 (S\|M\|L\|XL) | S\|M\|L\|XL |
| Aurora Viva | aurora-total-azul-oscuro | $ 183.920 / $ 229.900 / -20% | $ 183.920 / $ 229.900 / -20% | = | = | = | 4 (S\|M\|L\|XL) | S\|M\|L\|XL |
| Aurora Viva | aurora-total-terracota | $ 183.920 / $ 229.900 / -20% | $ 183.920 / $ 229.900 / -20% | = | = | = | 4 (S\|M\|L\|XL) | S\|M\|L\|XL |
| Aurora Viva | camiseta-solar-waves-negro | $ 159.920 / $ 199.900 / -20% | $ 159.920 / $ 199.900 / -20% | = | = | = | 3 (S\|M\|L y XL) | S\|M\|L y XL |
| Espuma de Ola | entero-golden-hour | $ 183.920 / $ 229.900 / -20% | $ 183.920 / $ 229.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Espuma de Ola | bikini-waves-terracota | $ 159.920 / $ 199.900 / -20% | $ 159.920 / $ 199.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Espuma de Ola | bikini-waves-verde-oliva | $ 159.920 / $ 199.900 / -20% | $ 159.920 / $ 199.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Espuma de Ola | bikini-shadow-azul-marino | $ 159.920 / $ 199.900 / -20% | $ 159.920 / $ 199.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Espuma de Ola | bikini-palm-verde-oliva | $ 159.920 / $ 199.900 / -20% | $ 159.920 / $ 199.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Espuma de Ola | enterizo-shadow-palm-azul-marino | $ 183.920 / $ 229.900 / -20% | $ 183.920 / $ 229.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |
| Espuma de Ola | bikini-foam | $ 159.920 / $ 199.900 / -20% | $ 159.920 / $ 199.900 / -20% | = | = | = | 3 (S\|M\|L) | S\|M\|L |

Comparados 29 productos. Titulo igual 29; badge = product_type 29; precio igual 29; precio anterior igual 29; % igual 29; 2 primeras imagenes (mismo nombre y orden) 29.
Nombre de archivo SIN normalizar (2 primeras imagenes): 28 de 29 iguales; con sufijo _<uuid> agregado por Shopify: amanecer-dorado-lila: actual llj4bqlxx259ihlgoe2r.jpg,kzdurkrob0ygvugwcmze.jpg / Dev llj4bqlxx259ihlgoe2r.jpg,kzdurkrob0ygvugwcmze_9777540f-57f6-4d3e-b20f-ea5c41612bf8.jpg. Que sea el mismo archivo (pixeles) no se verifico: NOT_VERIFIED.
Productos con precio distinto entre variantes en Dev (la tarjeta usa la primera variante disponible): ninguno.
Tallas por producto, actual (payload RSC de la coleccion) vs variantes Dev vs public-scrape-raw.json (2026-09-28): alba-dorada-cafe-claro: actual S|M|L / Dev S|M|L|XL / scrape 2026-09-28 S|M|L|XL.
Precios actuales distintos a los del scrape 2026-09-28: ninguno.
Formato de precio: la tarjeta actual muestra '$ 183.920' (punto de miles, sin decimales, prefijo '$ ' con espacio; el caracter tras '$' es U+00A0 en el HTML actual: a0; la captura Dev viene con espacios normalizados, asi que ese detalle en Dev es NOT_VERIFIED y visualmente no cambia). La ficha Dev (priceTxt) muestra el mismo formato: SI en los 29 [MEDIDO-03G]. El HTML de la TARJETA de coleccion en Dev no se capturo (solo conteos): formato de tarjeta Dev [NOT_VERIFIED]; la tarjeta usa el mismo snippet 'price' (theme-src/snippets/price.liquid) [DOC].
Descuento: en el sitio actual el -20% sale del calculo del sitio ('20% de descuento en toda la tienda'); en Dev es un compare_at_price estatico cargado por CSV (precio = 80% del anterior, redondeado): verificado en los 29 (|precio - 0.8*anterior| <= 1).
Diferencia funcional de tarjeta [DOC theme-src/sections/main-collection.liquid]: overlay_cta='view_product' (Dev: 'Ver producto'); el actual muestra 'Vista rapida' (modal) en 10 de 10 tarjetas de Oasis [MEDIDO-03G]. Boton de favoritos en las tarjetas actuales: true.

## T5. Banner, descripcion y fallback

| Coleccion | Actual: banner | Actual: URL de la imagen | Actual: encuadre (pos · size) | Manifiesto de medios (content/media/media-migration-manifest.csv) | Dev: banner renderizado | Dev: fondo | Largo descripcion actual / Dev (meta description) |
|---|---|---|---|---|---|---|---|
| Oasis Natural | imagen | …/upload/v1787460207/lago/products/x95tyqydlvieasp7whfn.jpg | 50% 26.689976689976692% · 100% 160% | M10 (DEFERRED_OWNER_ONLY_BLOCKER) | si | sin imagen -> arte por tono | 66 / 66 |
| Aurora Viva | imagen | …/upload/v1787420066/lago/products/c9gz6yuipjnowjyp3amd.jpg | 43.932724252491695% 69.97684658575744% · 140% 140% | M11 (DEFERRED_OWNER_ONLY_BLOCKER) | si | sin imagen -> arte por tono | 69 / 69 |
| Espuma de Ola | imagen | …/upload/v1787417045/lago/products/n9to8ksgrw1xmxlxm2ch.jpg | 53.68217054263566% 55% · 100% 100% | M12 (DEFERRED_OWNER_ONLY_BLOCKER) | si | sin imagen -> arte por tono | 63 / 63 |
| Salidas de Baño | imagen | …/upload/v1787460295/lago/products/grhrfruybukvqgk6ngrc.jpg | 61.62790697674419% 59.97214446504011% · 114.99999999999999% 413.99999999999994% | M13 (DEFERRED_OWNER_ONLY_BLOCKER) | si | sin imagen -> arte por tono | 65 / 65 |

Cadena de fallback del theme [DOC theme-src/snippets/collection-banner.liquid]: video cover_video -> cover_image con encuadre (si hay pos_x, pos_y y zoom) -> collection.image -> arte decorativo por tono (`custom.description_tone`, por defecto 'stone'). Las 6 colecciones Dev tienen bannerImg=false [MEDIDO-03G] y los metafields de portada vacios (M10-M13 pendientes). `description_tone` SI tiene dato en 4 colecciones [DOC theme/03C-catalog-import-report.md punto 27]: Oasis Natural = moss (`linear-gradient(to bottom right, #785447, #442a16, #28170b)`); Aurora Viva = linen (`linear-gradient(to bottom right, #fcbaf2, #c69379, #ad814e)`); Espuma de Ola = fog (`linear-gradient(to bottom right, #fcbaf2, #ad814e, #785447)`); Salidas de Baño = sand (`linear-gradient(to bottom right, #fcbaf2, #c69379, #ad814e)`). Destacados y Home page no tienen ese metafield y caen en el tono por defecto 'stone' (`linear-gradient(to bottom right, #c69379, #ad814e, #785447)`). Todos con 'highlight' radial y textura diagonal. El tono que la Dev renderiza de verdad NO esta en la evidencia (dev-collections.json no guarda la clase del arte): NOT_VERIFIED. Respaldo del sitio actual cuando una categoria no tiene foto [DOC components/catalog/catalog-page.tsx CATEGORY_COPY]: Oasis Natural = moss; Aurora Viva = linen; Espuma de Ola = fog; Salidas de Baño = sand.
Descripciones: longitud de la descripcion actual == metaDescChars Dev en las 4: true. El TEXTO Dev no esta en la evidencia: igualdad de texto NOT_VERIFIED (solo coincide el largo).
Texto de la descripcion actual (banner == meta description en las 4): Oasis Natural: banner=meta; Aurora Viva: banner=meta; Espuma de Ola: banner=meta; Salidas de Baño: banner=meta.
Destacados y Home page (frontpage) en Dev: banner renderizado con arte por defecto y metaDescChars=0 (sin descripcion): titulo 'Destacados' / 'Home page'.
Home: tarjeta 'Salidas de Baño' de Dev sin imagen (0 productos, no hay imagen de respaldo) [MEDIDO-03G dev-home.json: '3 tarjetas con imagen de respaldo tomada de un producto de la colección; Salidas de Baño sin imagen (0 productos)']; M09 CRITICO en el manifiesto.

## T6. Orden / sort

Actual (identico en las 9 paginas de coleccion): novedades=Novedades | precio-asc=Precio: menor a mayor | precio-desc=Precio: mayor a menor -> identico.
Dev [MEDIDO-03G, dev-collections.json nota]: 9 opciones en las 6 colecciones: manual ('Destacados' por locale), most-relevant, best-selling, title-asc, title-desc, price-asc, price-desc, created-asc, created-desc. Las etiquetas Dev distintas de 'Destacados' NO se capturaron: NOT_VERIFIED.
| Opcion actual | Semantica actual [DOC catalog-actions.ts] | Equivalente Dev | Nota |
|---|---|---|---|
| novedades (por defecto) | createdAt ascendente (antiguos primero) | manual (Destacados) o created-asc | Ninguno reproduce el orden actual: manual = alta inversa de importacion (T2); created-asc = fecha de creacion en Shopify = fecha de importacion, no la de la base anterior [INFERIDO] |
| precio-asc | priceValue ascendente | price-asc | Equivalente |
| precio-desc | priceValue descendente | price-desc | Equivalente |
| (no existe) | - | best-selling, most-relevant, title-asc, title-desc, created-desc | 5 opciones extra nativas (theme/collection-report.md §11: se itera collection.sort_options sin inventar opciones) |

Sondeo de orden en el sitio actual [MEDIDO-03G, GET puntual]:

| Sondeo | Ruta | Tarjetas | Precio | Empates | Handles en orden |
|---|---|---|---|---|---|
| oasis-orden-precio-asc | /oasis-natural?orden=precio-asc | 10 | no decreciente | empates en otro orden | marea-natural, costa-esmeralda-azul, costa-esmeralda-negro, arena-dorada-negro, marea-natural-naranja, arena-dorada-beige, oasis-serena-negro, oasis-serena-azul, brisa-natural-naranja, brisa-natural-beige |
| oasis-orden-precio-desc | /oasis-natural?orden=precio-desc | 10 | no creciente | empates en otro orden | oasis-serena-negro, brisa-natural-naranja, oasis-serena-azul, brisa-natural-beige, marea-natural-naranja, arena-dorada-beige, marea-natural, costa-esmeralda-azul, costa-esmeralda-negro, arena-dorada-negro |
| aurora-orden-precio-asc | /aurora-viva?orden=precio-asc | 12 | no decreciente | empates en otro orden | camiseta-solar-waves-negro, raices-del-sol-azul-oscuro, amanecer-dorado-terracota, sol-interno-beige-suave, sol-interno-cafe-claro, amanecer-dorado-lila, raices-del-sol-beige-suave, alba-dorada-cafe-claro, alba-dorada-lila, alba-dorada-beige-suave, aurora-total-azul-oscuro, aurora-total-terracota |
| aurora-orden-precio-desc | /aurora-viva?orden=precio-desc | 12 | no creciente | empates en otro orden | aurora-total-terracota, aurora-total-azul-oscuro, amanecer-dorado-terracota, sol-interno-beige-suave, sol-interno-cafe-claro, amanecer-dorado-lila, raices-del-sol-beige-suave, raices-del-sol-azul-oscuro, alba-dorada-lila, alba-dorada-beige-suave, alba-dorada-cafe-claro, camiseta-solar-waves-negro |

## T7. Filtros

| Grupo actual | Opciones [MEDIDO-03G] |
|---|---|
| Talla | XS · S · M · L · XL · Única |
| Color | Negro · Blanco · Beige · Camel · Gris · Azul Marino · Verde Oliva · Terracota |
| Precio | Menos de $50 · $50 – $100 · $100 – $200 · Más de $200 |

Los grupos de filtros actuales son identicos en las 9 paginas (incluidas las vacias): true.
Dev [MEDIDO-03G]: Oasis Natural = Ordenar por + Precio; Aurora Viva = Ordenar por + Precio; Espuma de Ola = Ordenar por + Precio; Destacados = Ordenar por + Precio; Salidas de Baño = Ordenar por; Home page = Ordenar por. Sin Talla ni Color (Search & Discovery no instalada = dependencia A3 [DOC theme/03F-owner-actions-minimal.md]); Disponibilidad oculta por ajuste (collection_show_availability_filter=false en theme-src/config/settings_data.json; valor guardado en la Dev Store: NOT_VERIFIED).

### Cobertura de cada filtro actual frente a los 29 productos reales (datos RSC, no ejecucion del filtro)

| Talla (opcion actual) | Productos con esa talla exacta |
|---|---|
| XS | 0 |
| S | 29 |
| M | 29 |
| L | 28 |
| XL | 10 |
| Única | 0 |

| Color (opcion actual) | Coincidencia exacta (como `where.color in (...)`) | Coincidencia sin distinguir mayusculas |
|---|---|---|
| Negro | 0 | 6 |
| Blanco | 0 | 1 |
| Beige | 0 | 3 |
| Camel | 0 | 0 |
| Gris | 0 | 0 |
| Azul Marino | 0 | 0 |
| Verde Oliva | 0 | 2 |
| Terracota | 0 | 3 |

Valores distintos de `color` en los 29 productos: AZUL | AZUL OSCURO | Azul | BEIGE | BEIGE SUAVE | BLANCO | CAFÉ CLARO | LILA | Mostaza | NARANJA | NEGRO | TERRACOTA | VERDE OLIVA.
Valores de color de los productos que ninguna opcion del filtro actual puede alcanzar (ni ignorando mayusculas): AZUL, AZUL OSCURO, Azul, BEIGE SUAVE, CAFÉ CLARO, LILA, Mostaza, NARANJA.

| Precio (opcion actual) | id | Rango (unidades = COP) | Productos cuyo precio de lista COP cae en el rango | Idem con el precio final (con descuento) |
|---|---|---|---|---|
| Menos de $50 | menos-50 | 0 a 50 | 0 | 0 |
| $50 – $100 | 50-100 | 50 a 100 | 0 | 0 |
| $100 – $200 | 100-200 | 100 a 200 | 0 | 0 |
| Más de $200 | mas-200 | 200 a inf | 29 | 29 |

Conversion de unidades [DOC lib/currency/subunits.ts]: toSubunits(x)=Math.round(x) (identidad, COP sin centavos): SI. Los rangos $50/$100/$200 se comparan contra pesos y contra el precio de lista (columna Product.priceValue, antes del descuento; [DOC lib/catalog/catalog-actions.ts buildWhere]): lista 199900 a 249900 COP; precio final con descuento 159920 a 199920 COP.

### Sondeo de filtros en el sitio actual [MEDIDO-03G, GET puntual a /oasis-natural con parametro; Oasis tiene 10 productos]

| Filtro | HTTP | Contador | Tarjetas | Estado vacio |
|---|---|---|---|---|
| talla=S | 200 | 10 productos (texto) | 10 tarjetas | - |
| color=Beige (etiqueta de la UI) | 200 | 0 productos (texto) | 0 tarjetas | No hay productos que coincidan con estos filtros. / Probá quitando algún filtro para ver más resultados. |
| color=BEIGE (valor de los datos) | 200 | 3 productos (texto) | 3 tarjetas | - |
| precio=menos-50 | 200 | 0 productos (texto) | 0 tarjetas | No hay productos que coincidan con estos filtros. / Probá quitando algún filtro para ver más resultados. |
| precio=mas-200 | 200 | 10 productos (texto) | 10 tarjetas | - |

## T8. Grilla por breakpoint

| Vista (columnas elegidas) | 375 px (actual / Dev) | 639 px (actual / Dev) | 640 px (actual / Dev) | 767 px (actual / Dev) | 768 px (actual / Dev) | 1023 px (actual / Dev) | 1024 px (actual / Dev) | 1440 px (actual / Dev) |
|---|---|---|---|---|---|---|---|---|
| vista=2 | 1 / 1 | 1 / 1 | 2 / 2 | 2 / 2 | 2 / 2 | 2 / 2 | 2 / 2 | 2 / 2 |
| vista=3 | 2 / 2 | 2 / 2 | 2 / 2 | 2 / 2 | 3 / 3 | 3 / 3 | 3 / 3 | 3 / 3 |
| vista=4 | 2 / 2 | 2 / 2 | 3 / 3 | 3 / 3 | 4 / 4 | 4 / 4 | 4 / 4 | 4 / 4 |

Columnas iguales en las 3 vistas y los 8 anchos: SI. Clases del sitio actual [DOC components/catalog/catalog-grid.tsx GRID_CLASSES]: 2: grid-cols-1 sm:grid-cols-2; 3: grid-cols-2 sm:grid-cols-2 md:grid-cols-3; 4: grid-cols-2 sm:grid-cols-3 md:grid-cols-4.
HTML actual [MEDIDO-03G]: clases de la grilla por defecto = `grid-cols-2 sm:grid-cols-2 md:grid-cols-3`, vista marcada = 3 columnas.
Dev [DOC theme-src/config/settings_data.json]: columnas por defecto = 3; productos por pagina = 24 (actual: PAGE_SIZE=200; con maximo 12 productos por coleccion ninguno pagina).
Separacion entre tarjetas: actual gap-4 (16 px) y desde 640 px gap-6 (24 px); Dev --space-4 = 16 px y --space-6 = 24 px desde 640 px (theme-src/assets/variables.css, component-grid.css) [DOC].
Selector 2/3/4 del theme: solo JS (assets/collection-filters.js, parametro `vista`), igual que el actual (boton con aria-pressed). Persistencia: URL; el actual tambien.

## T9. Salidas de Baño (0 productos) y las 5 rutas no migrables

| Ruta actual | HTTP | robots | h1 | Contador | Banner | Estado vacio [MEDIDO-03G] | En sitemap | En menu | En footer | En Home (categorias) |
|---|---|---|---|---|---|---|---|---|---|---|
| salidas-de-bano | 200 | index, follow | Salidas de Baño | 0 productos | imagen | No hay productos que coincidan con estos filtros. / Probá quitando algún filtro para ver más resultados. | si | si | si | si |
| accesorios | 200 | index, follow | Accesorios | 0 productos | arte decorativo (from-[#fcbaf2] via-[#c69379] to-[#ad814e]) | No hay productos que coincidan con estos filtros. / Probá quitando algún filtro para ver más resultados. | si | no | no | no |
| hombre | 200 | index, follow | Hombre | 0 productos | arte decorativo (from-[#442a16] via-[#28170b] to-[#1a0f07]) | No hay productos que coincidan con estos filtros. / Probá quitando algún filtro para ver más resultados. | no | no | no | no |
| mujer | 200 | index, follow | Mujer | 0 productos | arte decorativo (from-[#c69379] via-[#ad814e] to-[#785447]) | No hay productos que coincidan con estos filtros. / Probá quitando algún filtro para ver más resultados. | no | no | no | no |
| ninos | 200 | index, follow | Niños | 0 productos | arte decorativo (from-[#785447] via-[#442a16] to-[#28170b]) | No hay productos que coincidan con estos filtros. / Probá quitando algún filtro para ver más resultados. | no | no | no | no |
| calzado | 200 | index, follow | Calzado | 0 productos | arte decorativo (from-[#c69379] via-[#ad814e] to-[#785447]) | No hay productos que coincidan con estos filtros. / Probá quitando algún filtro para ver más resultados. | no | no | no | no |

Paginas que llegan con esqueleto de carga en <main> y el contenido real en un segmento oculto de streaming (<div hidden id="S:1">): accesorios, hombre, mujer. El script las lee del segmento; el render final es el mismo que el de las demas.

Menu actual: Inicio -> / · Oasis Natural -> /oasis-natural · Aurora Viva -> /aurora-viva · Espuma de Ola -> /espuma-de-ola · Salidas de Baño -> /salidas-de-bano. Home actual (Categorias destacadas): Oasis Natural -> /oasis-natural · Aurora Viva -> /aurora-viva · Espuma de Ola -> /espuma-de-ola · Salidas de Baño -> /salidas-de-bano.

| slug | products_count | target_status | keep_remove | redirect_required (collections-master.csv) |
|---|---|---|---|---|
| salidas-de-bano | 0 | official collection | KEEP | NO (sin productos indexados hoy) |
| accesorios | 0 | REQUIRES_DECISION | REQUIRES_DECISION | NO (sin productos indexados hoy) |
| hombre | 0 | retired | REMOVE | NO (sin productos indexados hoy) |
| mujer | 0 | retired | REMOVE | NO (sin productos indexados hoy) |
| ninos | 0 | retired | REMOVE | NO (sin productos indexados hoy) |
| calzado | 0 | retired | REMOVE | NO (sin productos indexados hoy) |

| Ruta | Redireccion en seo/shopify-redirects-import.csv | Estado esperado en Dev/Shopify |
|---|---|---|
| oasis-natural | si -> /collections/oasis-natural | 301 a la coleccion |
| aurora-viva | si -> /collections/aurora-viva | 301 a la coleccion |
| espuma-de-ola | si -> /collections/espuma-de-ola | 301 a la coleccion |
| salidas-de-bano | si -> /collections/salidas-de-bano | 301 a la coleccion |
| accesorios | no | 404 (no existe la coleccion) |
| hombre | no | 404 (no existe la coleccion) |
| mujer | no | 404 (no existe la coleccion) |
| ninos | no | 404 (no existe la coleccion) |
| calzado | no | 404 (no existe la coleccion) |

Dev [MEDIDO-03G dev-home.json]: menu = Oasis Natural -> /collections/oasis-natural · Aurora Viva -> /collections/aurora-viva · Espuma de Ola -> /collections/espuma-de-ola · Salidas de Baño -> /collections/salidas-de-bano; footer 'Comprar' = Oasis Natural, Aurora Viva, Espuma de Ola, Salidas de Baño; Home 'Categorias destacadas' = Oasis Natural -> /collections/oasis-natural · Aurora Viva -> /collections/aurora-viva · Espuma de Ola -> /collections/espuma-de-ola · Salidas de Baño -> /collections/salidas-de-bano.
Estado vacio Dev: no capturado como HTML (solo cards=0 y filterGroups=['Ordenar por'] en dev-collections.json). Texto del theme [DOC theme-src/locales/es.default.json collections.general.no_matches]: 'No hay productos que coincidan' dentro de <p class="state-empty"> (main-collection.liquid). Render real del vacio en Dev: NOT_VERIFIED.
Contador Dev [DOC]: '{{ count }} productos' es una cadena unica, sin plural: con 1 producto dira '1 productos'. El actual pluraliza ('1 producto' / 'N productos', components/catalog/catalog-toolbar.tsx): SI. El boton 'Ver N' del cajon de filtros de la Dev si distingue singular y plural ('Ver {{ count }} producto' / 'Ver {{ count }} productos'). Con las colecciones actuales (0, 7, 10 y 12 productos) no se nota; aparece con un filtro que deje 1 resultado.
Regla del theme para el 'estado vacio' [DOC main-collection.liquid]: si paginate.items == 0 imprime solo el parrafo; no hay mensaje especifico de 'proximamente' ni enlace de retorno.
Banner de las 5 rutas no migrables (actual): arte decorativo por tono, sin imagen; equivalen a los banners con arte de Dev (mismo componente placeholder-art) [DOC theme-src/assets/section-collection-banner.css].
Sitemap actual, URLs de coleccion: /accesorios, /oasis-natural, /aurora-viva, /espuma-de-ola, /salidas-de-bano.

## T10. Controles de codigo del sitio actual (contrastan el HTML con el repo; el despliegue = repo es NOT_VERIFIED)

| Control | Resultado |
|---|---|
| Opciones de orden HTML == SORT_OPTIONS del codigo | IGUAL |
| Opciones de talla HTML == SIZE_OPTIONS | IGUAL |
| Opciones de color HTML == COLOR_OPTIONS | IGUAL |
| Etiquetas de precio HTML == PRICE_BUCKETS | IGUAL |
| Clases de la grilla HTML == GRID_CLASSES[3] | IGUAL |
| Orden por defecto del codigo = createdAt asc | SI |
| Filtro de color del codigo: where.color = { in: colors } (comparacion exacta) | SI |

## Resumen de diferencias detectadas por el script

| Comparacion | Resultado |
|---|---|
| Oasis Natural: membresia | IGUAL |
| Oasis Natural: orden | DISTINTO (0/10 posiciones) |
| Aurora Viva: membresia | IGUAL |
| Aurora Viva: orden | DISTINTO (0/12 posiciones) |
| Espuma de Ola: membresia | IGUAL |
| Espuma de Ola: orden | DISTINTO (0/7 posiciones) |
| Salidas de Baño: membresia | IGUAL |
| Destacados: membresia | IGUAL |
| Destacados: orden (captura actual vs Dev) | DISTINTO |
