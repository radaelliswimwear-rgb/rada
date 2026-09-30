# 03G — Paridad de rutas: sitio actual vs Shopify Development Store

- **Fecha:** 2026-09-29. Corte de este informe: 17:40 (Bogotá).
- **Comparación:** sitio actual `https://radaelliswimwear.com` (Next.js) contra `radaelli-swimwear-dev.myshopify.com`.
- **Theme vigente:** Radaelli RC1.8 (SHA-256 `e893b386f1022b7aaa618c86b07eeb5d23f43f2e89c6ddc493f7c5a485fd9e67`, 96 archivos, sin publicar). Horizon es el theme live y no se toca.
- **Sesión de prueba de la evidencia de Dev:** país US, moneda COP, idioma es. Pagos apagados.
- **Entregables:**
  - `launch/03G-route-parity.csv`: 101 filas, cabecera exacta de 9 columnas.
  - `launch/03G-route-parity-detail.csv`: trazabilidad por fila (HTTP actual, clase, evidencia de Dev, qué se midió y qué no). Es un apoyo; la tabla oficial es el CSV principal.
  - `launch/tools/03g-route-parity.mjs`: genera ambos CSV y corre los controles. Determinista y offline.
  - `launch/tools/03g-route-parity-validate.mjs`: validador independiente (verificación adversarial). No importa el script anterior: re-deriva los hechos desde la evidencia cruda y compara con el CSV. Ver sección 10.
- **Este trabajo no escribió nada fuera de `launch/`.** No hubo navegador, red, base de datos ni escritura en tiendas.
- **Verificado por un segundo agente (sección 10):** se corrigió 1 estado, se retiró 1 diferencia falsa, se agregaron 2 diferencias de la Home que la fila no medía y se ajustaron 8 afirmaciones o textos sin evidencia suficiente (detalle en 10.1). Los conteos de este documento ya son los corregidos.

## 1. Resultado en una mirada

| status | filas |
|---|---|
| PASS | 1 |
| PASS_WITH_INTENTIONAL_CHANGE | 42 |
| BLOCKED_BY_OWNER | 33 |
| MISSING | 5 |
| NOT_APPLICABLE | 20 |
| **Total** | **101** |

Lo que hay que saber antes de leer las filas:

1. **`PASS_WITH_INTENTIONAL_CHANGE` no significa "igual".** Significa que la ruta responde bien en la Dev Store y que sus diferencias de ruta o plataforma están documentadas. Para saber si el contenido o la función coinciden hay que leer `content_parity` y `function_parity`. **Ninguna** fila `PASS_WITH_INTENTIONAL_CHANGE` tiene un GAP abierto: la única ficha con un GAP no intencional (`/producto/alba-dorada-cafe-claro`, talla XL, ver F-04) figura `BLOCKED_BY_OWNER` desde la verificación independiente (antes figuraba `PASS_WITH_INTENTIONAL_CHANGE`).
2. **Hoy solo 1 fila es `PASS`** (el 404 de una ruta inexistente). Es esperable: al pasar de Next.js a Shopify casi ninguna ruta queda idéntica.
3. **El estado de las 29 fichas es de ruta y contenido, no de compra.** La evidencia de Dev se capturó con país US. Con Colombia como país el catálogo figura agotado hasta que la dueña haga A1 (F-01). Esa parte no está medida en 03G (`function_parity = NOT_MEASURED`, dependencia `A1`).
4. **Ninguna fila tiene `visual_parity = MATCH`.** Lo visual no se midió en este ensayo (lo hace otro proceso, por DOM).
5. **Cobertura completa (101 filas):** las 70 URLs del rastreo, las 8 rutas `/cuenta*` que solo estaban en las redirecciones, los 3 posts del blog, las 2 páginas de retorno del checkout, 17 rutas propias de Shopify (las pedidas y algunas más de `dev-routes.json`) y una fila para la consulta de búsqueda. Todo con una fila y el script lo verifica.
6. **Redirecciones:** las 47 tienen fila y destino con evidencia (38 con 200 medido en Dev y 9 hacia el dominio de cuentas, que `fetch` no puede seguir).
7. **De las 58 URLs que dan 200 hoy (54 del rastreo y 4 de sondeos), 13 no tienen redirección ni equivalente directo** (sección 6). 4 son las páginas legales pendientes de la dueña, 4 son el blog sin decisión (el índice y 3 posts) y 5 son colecciones vacías o archivadas.

## 2. Leyenda de `status`

Cada fila recibe un solo valor.

| status | Se usa cuando | Evidencia mínima |
|---|---|---|
| `NOT_APPLICABLE` | No hay nada que migrar ni comparar: la URL actual da 404 (la única excepción es `/cart`, que es la ruta nativa del carrito de Shopify y se evalúa como ruta propia), es un patrón del inventario, o es una colección sin productos que 03E deja sin migrar (404). Incluye `/accesorios`, cuya decisión final sigue en manos de la dueña. | Rastreo (404) o `seo/03E-redirect-plan.md` |
| `BLOCKED_BY_OWNER` | Falta el destino que debería existir, o la ruta existe pero un elemento medido como GAP o su función principal depende de una acción del lote `theme/03F-owner-actions-minimal.md`. También se usa cuando un GAP no intencional solo lo resuelve una decisión de la dueña que no está en el lote (caso: talla XL de `alba-dorada-cafe-claro`, F-04). Exige al menos una dependencia A1 a C5. | Dev + lote |
| `MISSING` | La URL actual da 200 con contenido propio y no tiene destino en Shopify, **sin** depender del lote owner. Hoy: el blog. | Rastreo + Dev |
| `PASS_WITH_INTENTIONAL_CHANGE` | La ruta, o su equivalente, responde bien en la Dev Store y las diferencias de ruta o plataforma son las documentadas: redirección de URL, página nativa, ingreso por código, etc. No afirma que el contenido sea igual. | Respuesta 200 (o redirección de cuentas) en `dev-routes.json`, `dev-products.jsonl` o `dev-collections.json` |
| `PASS` | Mismo comportamiento HTTP en ambos sitios y sin diferencias medidas ni intencionales. | Ambos lados medidos |

Reglas de seguridad del script: una fila no puede ser `PASS` ni `PASS_WITH_INTENTIONAL_CHANGE` si su destino no tiene evidencia de responder en la Dev Store, ni si tiene un GAP no intencional abierto en `content_parity` o `function_parity`. Una fila `BLOCKED_BY_OWNER` debe tener dependencia del lote. Una fila `MISSING` no puede tenerla.

## 3. Valores cerrados de las columnas de paridad

Solo se usan estos cinco valores en `content_parity`, `function_parity` y `visual_parity`.

| Valor | Significado |
|---|---|
| `MATCH` | Se midió en ambos lados y los elementos medidos coinciden. Solo aplica a lo listado en `measured` del archivo de detalle; no se extiende a lo que no se midió. |
| `INTENTIONAL_CHANGE` | Hay una diferencia medida o inherente a la plataforma y está documentada como decisión (título nativo de la política, búsqueda nativa, ingreso por código, robots y sitemap generados por Shopify). |
| `GAP` | Hay una diferencia medida que no es intencional, o el destino no existe. |
| `NOT_APPLICABLE` | La dimensión no existe en esa ruta (por ejemplo, la función de una página de texto o cualquier columna de una URL que da 404). |
| `NOT_MEASURED` | No hay evidencia suficiente para afirmar `MATCH` ni `GAP`. |

- **`visual_parity`** nunca es `MATCH`. Toma `NOT_MEASURED`, o `NOT_APPLICABLE` cuando no hay nada que comparar.
- **En las columnas de URL:**
  - `NOT_APPLICABLE` en `current_url` = ruta propia de Shopify sin contraparte actual.
  - `NOT_APPLICABLE` en `shopify_url` = no hay nada que migrar.
  - `NOT_AVAILABLE` en `shopify_url` = el destino debería existir y no existe (`/envios`, `/terminos`, `/privacidad`, `/cookies`, blog, retornos del checkout). El destino propuesto está en `proposed_destination` del archivo de detalle.

### Normalizaciones de las comparaciones de fichas

| Elemento | Cómo se compara |
|---|---|
| Descripción | Sin viñetas `•` y con espacios colapsados. |
| Imágenes | Por orden y por nombre de archivo, ignorando el sufijo `_<uuid>` que agrega Shopify al reemplazar un archivo. |
| Color | Sin distinguir mayúsculas (la capitalización se reporta aparte). |
| Precio | Precio y precio anterior contra el JSON-LD y el texto de la ficha actual. |
| Tallas | Botones de talla de la ficha actual contra las variantes de Dev. |

## 4. Etiquetas de evidencia y dependencias

| Etiqueta | Origen |
|---|---|
| `[MEDIDO-03G]` | Sale de `launch/evidence` (rastreo del sitio actual y capturas de la Dev Store) o de un cálculo del script sobre archivos del repo. |
| `[DOC:<archivo>]` | Sale de un documento del repo, sin re-medir. |
| `[INFERIDO]` | Razonado a partir de lo medido; se dice cuando se usa. |
| `[NOT_VERIFIED]` | No hay evidencia. |

Dependencias (`known_dependency`), definidas en `theme/03F-owner-actions-minimal.md`:

| Código | Acción de la dueña |
|---|---|
| A1 | Zona de envío de Colombia + tarifa y luego mercado principal Colombia |
| A2 | Código de ingreso de clienta |
| A3 | Instalar Search & Discovery (filtros de talla y color) |
| A4 | OK para descargar y subir 12 archivos de media (hero, tarjetas, banners, guía de tallas) |
| A5 | App de favoritos de cuenta |
| B1 | Wompi o pasarela de prueba |
| B2 | Páginas legales y datos del negocio (razón social, NIT, dirección) |
| B3 | Analítica |
| B4 | Publicar: dominio, idioma principal, plantilla `page.wishlist`, redirecciones de la tienda comercial, apagar Next.js |
| C1 | Meta description de la Home |
| C2 | "Recomendado para vos": curar una colección o dejar la sección oculta |
| C5 | Limpiar páginas y colecciones que creó Shopify |

C3 (voseo o tuteo) y C4 (color de los botones blancos) no afectan a ninguna ruta y no aparecen.

`known_dependency` lista lo que condiciona la verificación aunque no haya un GAP medido. Por eso las 29 fichas llevan `A1;B1;B4`. **B4 aparece en las filas que dependen de una redirección** porque las 47 redirecciones viven hoy en la Dev Store y hay que reimportarlas en la tienda comercial.

Clases del archivo de detalle (`current_class`):

| Clase | Significado |
|---|---|
| `REDIRECT` | Da 200 hoy y tiene redirección en el CSV. |
| `DIRECT` | Da 200 hoy y la misma ruta existe en Shopify. |
| `EXCEPTION_*` | Da 200 hoy y no tiene redirección ni destino. Puede ser `NOT_MIGRATED`, `LEGAL_PENDING` o `BLOG_OPEN`. |
| `CURRENT_404` | Da 404 hoy. |
| `NOT_CRAWLED_APP_ROUTE` | Ruta de `app/` que no estaba en el rastreo ni en los sondeos; el HTTP actual es `NOT_MEASURED` (7 `/cuenta*` y las 2 páginas de retorno del checkout). |
| `PLACEHOLDER` | Patrón con marcador (`/blog/<slug>`, `/buscar?q=<término>`). |
| `SHOPIFY_ONLY` | Ruta propia de Shopify sin contraparte actual. |

## 5. Conteos

Generados por `node launch/tools/03g-route-parity.mjs`.

| Superficie | Total | PASS | PASS_WITH_INTENTIONAL_CHANGE | BLOCKED_BY_OWNER | MISSING | NOT_APPLICABLE |
|---|---|---|---|---|---|---|
| Home | 2 | 0 | 1 | 1 | 0 | 0 |
| Colección | 12 | 0 | 2 | 5 | 0 | 5 |
| Producto | 29 | 0 | 28 | 1 | 0 | 0 |
| Búsqueda | 3 | 0 | 3 | 0 | 0 | 0 |
| Carrito | 2 | 0 | 1 | 0 | 0 | 1 |
| Checkout | 3 | 0 | 0 | 3 | 0 | 0 |
| Cuenta | 14 | 0 | 3 | 9 | 0 | 2 |
| Favoritos | 5 | 0 | 0 | 4 | 0 | 1 |
| Legal | 17 | 0 | 2 | 9 | 0 | 6 |
| Ayuda | 5 | 0 | 0 | 1 | 0 | 4 |
| SEO técnico | 2 | 0 | 2 | 0 | 0 | 0 |
| Error | 1 | 1 | 0 | 0 | 0 | 0 |
| Otras | 6 | 0 | 0 | 0 | 5 | 1 |
| **Total** | **101** | **1** | **42** | **33** | **5** | **20** |

| Valor | content_parity | function_parity | visual_parity |
|---|---|---|---|
| MATCH | 28 | 0 | 0 |
| INTENTIONAL_CHANGE | 15 | 6 | 0 |
| GAP | 20 | 9 | 0 |
| NOT_APPLICABLE | 25 | 43 | 30 |
| NOT_MEASURED | 13 | 43 | 71 |

- Los 28 `MATCH` de contenido son fichas de producto. Ninguna función quedó en `MATCH` porque no hay evidencia del lado actual para agregar al carrito, cajón del carrito, búsqueda, etc.
- Las 29 fichas: **28 `MATCH` y 1 `GAP` (tallas de `alba-dorada-cafe-claro`)**. *(Actualizado a las 18:35: las 4 migas que la captura de RC1.7 mostraba con "Destacados" se re-midieron en vivo con RC1.8 y pasaron a `MATCH`; ver F-11.)*
- Filas por causa raíz (`BLOCKED_BY_OWNER` + `MISSING`, 38 filas):

| Causa | Filas |
|---|---|
| A2 ingreso por código | 9 |
| B2 páginas legales | 8 |
| Blog sin decisión (sin dependencia del lote) | 5 |
| A3 filtros + A4 banner + orden por defecto (3 colecciones) | 3 |
| A5 app + B4 plantilla `page.wishlist` | 3 |
| Sobrantes de Shopify (C5) | 3 |
| B1 pagos | 2 |
| A1 mercado + B1 pagos (checkout) | 1 |
| A4 banner (Salidas de Baño) | 1 |
| A4 media + C1 meta + orden + selector de moneda (Home) | 1 |
| A5 app | 1 |
| Catálogo: talla XL de `alba-dorada-cafe-claro` (decisión de catálogo de la dueña, fuera del lote) | 1 |

Filas que citan cada dependencia (una fila puede citar varias): A1 = 35, A2 = 9, A3 = 3, A4 = 5, A5 = 4, B1 = 32, B2 = 8, B3 = 1, B4 = 60, C1 = 1, C2 = 1, C5 = 4.

## 6. Cobertura de redirecciones (control del script)

Resultado: **PASS.** Toda URL que da 200 hoy tiene redirección, equivalente directo o una excepción documentada, y ninguna quedó sin explicar.

El universo con 200 son las 54 URLs del rastreo más 4 que confirmó un sondeo GET puntual de otro proceso de 03G (`launch/evidence/current-site-probe`): `/cuenta/iniciar-sesion` y los 3 posts del blog.

| Grupo (URLs con 200 hoy) | URLs | Detalle |
|---|---|---|
| Con redirección en `seo/shopify-redirects-import.csv` | 40 | 29 productos, 4 colecciones, `/devoluciones`, `/garantia`, `/buscar`, `/favoritos`, `/cuenta`, `/cuenta/iniciar-sesion` y `/cuenta/favoritos` |
| Equivalente directo (misma ruta en Shopify) | 5 | `/`, `/checkout`, `/search`, `/robots.txt`, `/sitemap.xml`. `/checkout` y `/search` no tienen fila de redirección porque Shopify las sirve con la misma ruta |
| **Sin redirección ni destino** | **13** | Lista siguiente |
| **Total** | **58** | |

Las 13 sin redirección ni destino:

| Ruta actual | Clase | status | Dependencia | Por qué |
|---|---|---|---|---|
| `/envios` | Legal pendiente | BLOCKED_BY_OWNER | A1;B2;B4 | Destino no creado (404 en `/pages/envios` y `/policies/shipping-policy`); promete envío gratis desde $299.900 |
| `/terminos` | Legal pendiente | BLOCKED_BY_OWNER | B2;B4 | Destino no creado (404 en `/pages/terminos` y `/policies/terms-of-service`) |
| `/privacidad` | Legal pendiente | BLOCKED_BY_OWNER | B2;B4 | Destino propio no creado; `/policies/privacy-policy` existe con texto autogenerado distinto |
| `/cookies` | Legal pendiente | BLOCKED_BY_OWNER | B2;B3;B4 | Destino no creado |
| `/blog` y sus 3 posts (`/blog/novedades-temporada`, `/blog/materiales-nobles-por-que-importan`, `/blog/guia-de-capas-para-el-invierno`) | Blog sin decisión | MISSING | ninguna | Sin destino; `/blogs/news` existe en Dev y en inglés (si tiene artículos no se midió) |
| `/accesorios` | No migrada | NOT_APPLICABLE | ninguna | 0 productos; en el sitemap actual; 03E la deja en 404 hasta que la dueña decida |
| `/hombre`, `/mujer`, `/ninos`, `/calzado` | No migrada | NOT_APPLICABLE | ninguna | 0 productos, archivadas, fuera del sitemap actual (03E) |

Otros controles del mismo tipo:

- Ninguna de las 16 URLs que dan 404 hoy tiene redirección (correcto: no hay nada que migrar).
- Los sondeos muestran además que el sitio actual distingue mayúsculas en las fichas (`/producto/costa-esmeralda-azul` en minúsculas da 404; solo funciona `COSTA-ESMERALDA-AZUL`) y que `/oasis-natural/` con barra final responde 308 a `/oasis-natural`. `[DOC:seo/03F-redirect-import-result.md]` dice que la Dev Store acepta ambas variantes; no lo re-medí.
- De las 47 redirecciones, 38 tienen el destino con 200 medido en Dev (29 productos por `dev-products.jsonl`, 4 colecciones por `dev-collections.json`, y `/policies/refund-policy`, `/pages/garantia`, `/search`, `/pages/favoritos` por `dev-routes.json`). Las otras 9 son las `/cuenta*` hacia `/account*`.
- No hay cadenas ni bucles: ningún destino es a la vez un origen.

**Rutas de Shopify que ya quedan cubiertas como destino de otra fila** (no tienen fila propia): `/policies/refund-policy` (fila `/devoluciones`), `/pages/garantia` (fila `/garantia`), `/pages/favoritos` (filas `/favoritos` y `/cuenta/favoritos`).

**Fuera del universo de este CSV** (no son URLs de contenido; 03E las clasifica): `/admin` y 16 subrutas, `/api/**` (6), `/interno/*` (2), 3 restos de plantilla Vercel que ya dan 404 (`/[page]`, `/product/[handle]`, `/search/[collection]`), 4 rutas de metadatos que genera Next (`/opengraph-image`, `/icon.png`, `/apple-icon.png`, `/favicon.ico`; su HTTP no se midió), 5 archivos estáticos, y los endpoints de plataforma `/products.json` y `/collections.json`. (El informe anterior decía "7 restos de plantilla Vercel que ya dan 404": 03E los separa en 3 restos y 4 metadatos.)

## 7. Hallazgos

| ID | Severidad | Qué está mal o distinto | Evidencia | Impacto | Acción |
|---|---|---|---|---|---|
| F-01 | BLOCKER | **A1: mercado y zona de envío de Colombia.** Las 29 fichas, las colecciones, el carrito, la búsqueda y el checkout no se pueden verificar para clientas de Colombia. | `[MEDIDO-03G]` `dev-routes.json`: `/checkout` abre en `es-us` (mercado principal US). `[DOC:theme/03F-owner-actions-minimal.md]` A1: con Colombia el catálogo figura agotado 29/29 (medido en 03E, **no re-medido en 03G**). | Con Colombia como país la tienda no puede vender: bloquea el lanzamiento y la verificación de todo lo que toca la compra. Toda fila con dependencia `A1` sigue sin verificar en CO. | Owner: A1 (55 a 95 min). Después Claude repite con país CO, incluidas búsqueda, carrito y checkout, y re-corre este script. |
| F-02 | BLOCKER | **4 páginas legales con 200 hoy y sin destino:** `/envios`, `/terminos`, `/privacidad`, `/cookies`. Además el pie de página de Dev enlaza 2 de las 6 políticas del sitio actual. | `[MEDIDO-03G]` rastreo (200, en el sitemap actual); `dev-routes.json` (`/pages/envios`, `/pages/privacidad`, `/pages/terminos`, `/pages/cookies`, `/policies/terms-of-service`, `/policies/shipping-policy`: 404); `dev-home.json` (columna Ayuda: Devoluciones y Garantía). `[DOC:seo/03E-redirect-plan.md §4.3]` | Si el DNS se mueve antes, 4 URLs indexables (en el sitemap actual, `index, follow`; su estado real en Google no está medido) dan 404 y la tienda sale sin términos, privacidad, envíos ni cookies. | Owner: B2 (aprobar textos y dar razón social, NIT y dirección) y A1 para `/envios`. Claude pega el texto verbatim, enlaza y agrega 4 filas de redirección (51 en total). |
| F-03 | DEFECT | **Blog sin destino y sin decisión.** `/blog` da 200 y está en el sitemap actual, con 3 posts que también dan 200 (`index, follow`, JSON-LD `Article`). Ninguna otra página del sitio enlaza `/blog`. `/blogs/news` es el blog por defecto de Shopify (200, "News", en inglés, indexable) y no está en el lote C5. | `[MEDIDO-03G]` `blog.html`, `sitemap.xml.txt` (3 posts), sondeo `current-site-probe` (3 posts con 200), `dev-routes.json` (`/blogs/news` 200). `[INFERIDO]` los títulos y extractos hablan de lana, lino, cuero y abrigo: parecen texto de plantilla. | 4 URLs indexables (índice + 3 posts) pasarían a 404 y quedaría un blog en inglés indexable. | Owner: decidir migrar o descartar (no está en el lote 03F). Si descarta, sumar `/blogs/news` a C5. Si migra, Claude crea los posts y las filas de redirección. |
| F-04 | DEFECT | **`alba-dorada-cafe-claro`: la Dev Store ofrece talla XL y el sitio actual solo muestra S, M y L.** La fila figura `BLOCKED_BY_OWNER` (antes `PASS_WITH_INTENTIONAL_CHANGE`, que no cabe con un GAP no intencional). | `[MEDIDO-03G]` ficha actual (3 botones de talla) vs `dev-products.jsonl` (S, M, L, XL). `[DOC:catalog/variants-master.csv]` registra la variante XL como "Disponible (InStock) según web pública, 2026-09-28"; el rastreo del 2026-09-29 muestra 3 tallas. Que el sitio haya cambiado entre las dos fechas no está demostrado (son dos mediciones públicas; ver `launch/03G-product-parity.md` F-01). `[DOC:catalog/shopify-post-import-audit.csv]` 4 variantes en origen el 2026-09-28; el audit marca el inventario de Dev como no rastreado. Coincide con el análisis de `launch/03G-product-parity.md`. | La Dev Store vendería una talla que hoy no se muestra, y no lleva inventario. La causa (variante retirada o agotada) es **NOT_AVAILABLE**. | Owner: confirmar si XL existe. Claude ajusta el catálogo con OK y vuelve a comparar las 29 fichas antes del lanzamiento. |
| F-05 | DEFECT | **A4: la Home y los banners de colección no tienen media.** Además la sección "Recomendado para vos" queda oculta (C2). | `[MEDIDO-03G]` `dev-home.json` (hero: 0 imágenes y 0 videos; 3 de 4 tarjetas con imagen de respaldo; sección de recomendados oculta); `dev-collections.json` (`bannerImg: false` en las 6); Home actual con 4 `<video>` (el hero y 3 tarjetas) y banners de colección con imagen. `[DOC:theme/03D-missing-assets-audit.md]` la sección actual es algorítmica y depende de `localStorage`: no aparece en el HTML anónimo. | La portada sale sin el video de marca; Salidas de Baño sin imagen. | Owner: A4 (OK de descarga y subida) y C2 (curar o dejar oculta). Claude conecta la media y re-mide. |
| F-06 | DEFECT | **A3: faltan los filtros de Talla y Color.** El sitio actual filtra por Talla, Color y Precio y ordena por 3 criterios; Dev solo tiene Precio y 9 criterios de orden. | `[MEDIDO-03G]` `dev-collections.json` (`filterGroups: Ordenar por, Precio`) vs texto de `oasis-natural.html` y de las otras colecciones. | Las clientas pierden el filtro por talla y color en las 3 colecciones con productos. | Owner: A3 (≈ 5 min de permisos). Claude configura y corre la matriz de QA. |
| F-07 | DIFFERENCE | **Orden por defecto distinto** en las 3 colecciones con productos (mismo conjunto: 10, 12 y 7). Por eso el carrusel editorial de la Home comparte 6 de 8 productos y los 7 destacados salen en otro orden. | `[MEDIDO-03G]` comparación de `oasis-natural.html`, `aurora-viva.html`, `espuma-de-ola.html` y `home.html` contra `dev-collections.json` y `dev-home.json`. | Cambia qué producto se ve primero. Ejemplo: Oasis Natural abre con `costa-esmeralda-azul` hoy y con `marea-natural` en Dev. El criterio del orden actual no lo medí; el análisis del código está en `launch/03G-collection-parity.md`. Los 7 destacados sí son una diferencia ya documentada: el sitio actual los baraja en cada visita y una colección manual tiene orden fijo (`theme/03D-missing-assets-audit.md`). | Claude: igualar el orden manual (con OK, escritura en Dev) o la dueña acepta el orden nuevo. |
| F-08 | DEFECT | **Favoritos: sin sincronización de cuenta y redirección al destino genérico.** `/favoritos` y `/cuenta/favoritos` redirigen a `/pages/favoritos`, sin `?view=wishlist`. | `[MEDIDO-03G]` `dev-routes.json` (`/apps/wishlist` 404; ambas variantes de `/pages/favoritos` con 200 y `noindex`). `[DOC:seo/03E-redirect-plan.md §5.5]` la plantilla `page.wishlist` se asigna al publicar. `[NOT_VERIFIED]` qué muestra hoy la ruta simple. | Solo funciona la lista de invitada (botón de favoritos presente en 29/29 fichas). No hay favoritos entre dispositivos. | Owner: A5 (app) y B4 (plantilla al publicar). Claude prueba después. |
| F-09 | DIFFERENCE | **Cuenta: cambia el modelo de ingreso.** Las 9 rutas `/cuenta*` redirigen a `/account*`, cuyo destino final está en el dominio de cuentas de Shopify. Recuperar, restablecer y verificar desaparecen por diseño (sin contraseña). | `[MEDIDO-03G]` `dev-routes.json` (`opaqueredirect`; el control de una ruta inexistente da 404). `[DOC:seo/03E-redirect-plan.md §4.2]` | Pedidos, perfil y direcciones caen todos en `/account`; `/account/orders` y `/account/addresses` no están verificados. El ingreso por código no se puede probar sin A2. | Owner: A2. Claude verifica con navegador tras A2. |
| F-10 | DIFFERENCE | **Sobrantes de Shopify indexables.** En el lote C5 están `/pages/contact` (en inglés), `/pages/data-sharing-opt-out` y `/collections/frontpage`. **No están en C5:** `/blogs/news`, `/collections/destacados` (sin meta description) y `/collections/all`. | `[MEDIDO-03G]` `dev-routes.json` y `dev-collections.json` (200 y `robots` vacío, es decir indexables). | URLs ajenas al sitio actual, sin `noindex`. Que estén en el sitemap de Shopify consta solo para las 3 del lote C5 `[DOC:seo/03F-seo-final-validation.md]`; para `/blogs/news`, `/collections/destacados` y `/collections/all` no se midió. | Owner: C5; y decidir las tres que no están en C5. |
| F-11 | NOTE (CERRADO 18:35) | **Migas de pan de 4 fichas: medidas en RC1.7 y RE-MEDIDAS en RC1.8.** *Cierre:* tras el push de RC1.8 se leyó en vivo miga, "Volver a" y `BreadcrumbList` de las 4 y de 6 controles: `Inicio / Espuma de Ola / <título>`; el CSV se regeneró (`content_parity` = `MATCH` en las 4). *Texto original:* en Dev mostraban "Destacados" en vez de "Espuma de Ola" (`bikini-palm-verde-oliva`, `bikini-shadow-azul-marino`, `enterizo-shadow-palm-azul-marino`, `entero-golden-hour`). | `[MEDIDO-03G]` `dev-products.jsonl` (`crumbs`) vs JSON-LD `BreadcrumbList` del sitio actual. `[MEDIDO-03G]` los manifiestos RC1.7 y RC1.8 difieren solo en `sections/main-product.liquid`. `[DOC:theme-src/README.md]` RC1.8 corrige esto. | Las 4 filas quedan en `NOT_MEASURED`: el defecto se vio en la versión anterior y la corrección no se re-midió. | Claude: re-medir miga y JSON-LD `BreadcrumbList` de las 29 fichas en RC1.8. |
| F-12 | DIFFERENCE | **Selector de moneda COP/USD ausente en Dev.** | `[MEDIDO-03G]` texto del encabezado del sitio actual ("COP USD") vs `dev-home.json` (`headerNav` sin selector); `theme-src` sin formulario de localización. `[DOC:theme/storefront-blueprint.md:164]` decía mantenerlo. | Función del encabezado que no se replica. | Owner: decidir si se replica. `[INFERIDO]` con un solo mercado en COP puede no hacer falta. |
| F-13 | DIFFERENCE | **SEO de la Home.** Título "Radaelli Swimwear Dev" vs "Trajes de baño de diseño en Colombia"; meta description vacía en Dev vs 109 caracteres hoy. | `[MEDIDO-03G]` `dev-home.json` vs `home.html`. `[DOC:seo/03F-seo-final-validation.md]` | Peor título y sin descripción en la portada. | Owner: C1 (texto de ella) y B4 (el nombre cambia con la tienda comercial). |
| F-14 | NOTE | **Colecciones vacías con 200 y `index, follow`** (`/accesorios`, `/hombre`, `/mujer`, `/ninos`, `/calzado`). Sus descripciones parecen de plantilla ("Sastrería moderna…", "Zapatillas y calzado…"). Solo `/accesorios` está en el sitemap actual. | `[MEDIDO-03G]` rastreo y `sitemap.xml.txt`. `[INFERIDO]` texto de plantilla. | Pasan a 404 al cambiar de plataforma. Sin pérdida de contenido. | Owner: decidir `/accesorios` (no está en el lote). El resto, ninguna. |
| F-15 | NOTE | **Límites de la prueba de redirecciones.** `dev-routes.json` resume la verificación (38 destinos con 200 y 9 opacos) sin el detalle por origen. El código HTTP exacto (301 o 302) no se conoce. Las redirecciones viven en la Dev Store. `dev-routes.json` cita "33 × `/producto/<slug>` (29 productos + variantes de mayúsculas)" y el CSV tiene 29 filas de producto. **Resuelto en la verificación independiente:** 33 = 29 productos + 4 colecciones; la etiqueta de `dev-routes.json` es imprecisa. Las cuentas cierran así: 4 + 29 + 5 = 38 verificadas (colecciones, productos, y `/devoluciones`, `/garantia`, `/buscar`, `/favoritos`, `/cuenta/favoritos`), más 9 opacas = 47 `[DOC:seo/03F-redirect-import-result.md]` (4 + 29 + 2 + 3 = 38). Las "variantes de mayúsculas" no son filas: la Dev Store no distingue mayúsculas en el origen y una sola fila cubre ambas (`[DOC:seo/03F-redirect-import-result.md]` § 3). | `[MEDIDO-03G]` `dev-routes.json`. `[DOC:seo/03F-redirect-import-result.md]`. `[INFERIDO]` la aritmética 33 = 29 + 4. | El script verifica el destino de cada fila, no cada salto origen → destino. | Claude: `curl -I` de las 47 tras publicar (B4), en la tienda comercial. |
| F-16 | NOTE | **Diferencias menores de texto.** Capitalización del color (sitio actual `Azul` y `Mostaza` en `costa-esmeralda-azul` y `entero-golden-hour`; Dev `AZUL` y `MOSTAZA`); CTA del newsletter ("Quiero enterarme" vs "Suscribirme"); una imagen con sufijo `_<uuid>` de Shopify en `amanecer-dorado-lila`. **Retirada por la verificación independiente:** la "diferencia" de la barra de anuncio ("20 %" vs "20%") no existe. El HTML del sitio actual trae `20<!-- -->% de descuento`; al quitar las etiquetas quedaba un espacio que el navegador no dibuja. El texto renderizado es "20% de descuento en toda la tienda" en ambos. | `[MEDIDO-03G]` | Cosmético. | Claude puede alinear el copy con OK. |
| F-17 | DIFFERENCE | **Home: dos diferencias que la fila no medía (agregadas por la verificación independiente).** (1) El CTA del hero ("Compra de forma sostenible") y el del promo ("Descubrir la colección") apuntan a `#categorias` en Dev y a `#productos` en el sitio actual. (2) El sitio actual muestra un logo de imagen; Dev muestra el nombre de la tienda en texto ("Radaelli Swimwear Dev"). El logo no está entre los archivos del plan de media A4. | `[MEDIDO-03G]` `home.html` (2 enlaces `#productos`; `<img alt="Radaelli Swimwear">` con `/logo/radaelli-swimwear.png`) contra `dev-home.json` (CTA `-> #categorias`; "logo de texto"). `[DOC:theme/03G-home-parity.md]` HP-02 y HP-03. `[DOC:content/media/media-migration-manifest.csv]` 0 menciones de logo. | El botón principal lleva a categorías y no a los destacados; aun con A4 aprobado la Home saldría sin el logo. | Claude: `#productos` en las dos configuraciones (con OK). Dueña: decidir cómo se carga el logo (queda fuera de A4). El resto de las diferencias de la Home está en `theme/03G-home-parity.md`. |

## 8. Lo que no se midió

- **No hubo navegador ni red.** No hice ningún GET nuevo al sitio actual: toda la evidencia estaba guardada. Además del rastreo (`launch/evidence/current-site`) leí 7 sondeos GET puntuales que capturó otro proceso de 03G (`launch/evidence/current-site-probe`): los 3 posts del blog y `/cuenta/iniciar-sesion` con 200, dos 404 y un 308. Las otras 9 rutas de `app/` (7 `/cuenta*` y 2 de retorno del checkout) no están en ninguno de los dos: su HTTP actual es `NOT_MEASURED`.
- **Sitio actual sin JavaScript.** `/checkout`, `/cuenta`, `/cuenta/favoritos` y `/buscar` se arman en el cliente; el rastreo solo vio el cascarón. El contenido dinámico (resultados, lista de favoritos, resumen del carrito) no se comparó.
- **Evidencia de Dev de RC1.7, no de RC1.8.** Las notas de captura de `dev-routes.json`, `dev-collections.json` y `dev-home.json` dicen RC1.7 (≈ 17:28 a 17:33). El manifiesto de RC1.8 se generó a las 17:34. Los manifiestos difieren solo en `sections/main-product.liquid`, de modo que solo la miga de pan, el enlace "Volver a…" y el JSON-LD `BreadcrumbList` de la ficha pueden haber cambiado.
- **País US, no CO.** Disponibilidad, precios por mercado, carrito, checkout y búsqueda con Colombia no se midieron (F-01).
- **Todo es de la Dev Store**, dominio `*.myshopify.com`. Nada de esto prueba el comportamiento en `radaelliswimwear.com` hasta B4.
- **Funciones NOT_MEASURED en casi todas las filas:** agregar al carrito, cajón del carrito, selección de variante, búsqueda predictiva, vista rápida, paginación, guía de tallas (A4), acordeones de la ficha, formulario del newsletter, banner de consentimiento de cookies.
- **Texto legal en Dev.** El cuerpo de `/policies/refund-policy` y de `/pages/garantia` en Dev no se re-verificó (solo el `h1`). Lo que sí comparé: los bloques de texto fuente de `content/legal/` siguen presentes en las páginas actuales (`/devoluciones` 20/20, `/garantia` 9/9, `/envios` 25/25, `/terminos` 11/11, `/privacidad` 13/13, `/cookies` 13/13).
- **`robots.txt` y sitemaps de Dev:** solo consta su tamaño (3.642 y 1.532 bytes). La regla por defecto `/policies/` de Shopify y los 9 sitemaps hijos son `[DOC]`, no medidos aquí. Si `/policies/` está bloqueada, `/devoluciones → /policies/refund-policy` deja de ser indexable `[NOT_VERIFIED]`.
- **Visual:** no se midió nada. El barrido responsive por DOM lo hace otro proceso.

## 9. Cómo reproducir y actualizar

```sh
node launch/tools/03g-route-parity.mjs
```

- Lee solo `launch/evidence/*` (incluido `current-site-probe/index.json` si existe), `seo/*.csv`, `content/legal/*` y `dist/release-manifest-rc1.{7,8}.json`.
- Escribe `launch/03G-route-parity.csv` y `launch/03G-route-parity-detail.csv`. Imprime los controles (31, todos PASS en esta corrida), los conteos y las tablas de este informe. Termina con código 1 si falla alguno.
- Determinista: dos corridas seguidas dan los mismos bytes.
- La clasificación de las filas del lote owner está codificada en el script y cita los documentos. Las partes que salen de la evidencia (fichas, colecciones, Home, legales, sitemap, cobertura de redirecciones) se recalculan solas.

Cuando se cierre un bloqueo:

1. Actualizar la evidencia (`launch/evidence/*`).
2. Actualizar el CSV de redirecciones y las excepciones del script (por ejemplo, al crear las 4 páginas legales).
3. Volver a correr el script y leer sus controles.

Huellas de esta corrida (SHA-256):

```text
launch/tools/03g-route-parity.mjs        3e8a630d8b17da3cb7afbf166a9c0f3f926c49352ec57f597659eeb2e89a440d
launch/03G-route-parity.csv              2d0136b5c49509b1f262a262d6f5a3d46ee8aeab1ed5f6bf20073cdc1e2228d8
launch/03G-route-parity-detail.csv       794be4191ced6c86a3ab47fd13943d50eaa9366eaf131b674695460de7cde4a1
```

## 10. Verificación independiente

Un segundo agente verificó este entregable de forma adversarial: parte de la evidencia cruda (`index.json`, `current-site-probe`, `dev-*.json`, `dev-products.jsonl`, el HTML guardado, `seo/*.csv`), no del resumen, e intenta refutar cada afirmación. No hubo red, navegador, base de datos ni escritura en tiendas.

```sh
node launch/tools/03g-route-parity-validate.mjs          # controles
node launch/tools/03g-route-parity-validate.mjs --rows   # además, el status esperado de las 101 filas
```

El validador no importa `03g-route-parity.mjs`: usa su propio lector de CSV y su propia extracción del HTML. No escribe archivos y termina con código 1 si falla un control. Verifica:

- **Estructura:** cabecera exacta y 9 celdas por fila; vocabulario cerrado de `status` y de las tres columnas de paridad; 0 duplicados de `current_url` (las 17 filas solo-Shopify llevan el centinela `NOT_APPLICABLE` y tienen `shopify_url` distinto); `known_dependency` solo con códigos del lote 03F; sin teléfonos, enlaces de WhatsApp, tokens ni URLs de checkout; detalle y CSV principal iguales fila por fila.
- **Cobertura:** las 70 URLs del rastreo, los 4 sondeos con 200, los 47 orígenes de redirección, las 45 URLs del sitemap actual, las 60 rutas que enlaza el HTML guardado del sitio actual y `catalog/shopify-url-parity.csv`. Ninguna `current_url` inventada.
- **Status de las 101 filas** recalculado desde la evidencia (HTTP actual, redirección, destino con 200 en Dev, GAP medido). Todas coinciden salvo la ficha corregida abajo.
- **Hechos recalculados** con extracción propia: las 29 fichas (nombre, descripción, imágenes, precio, precio anterior, tallas, color, miga), las 4 colecciones (conjunto, orden, filtros, banner), la Home, el blog, los 6 textos legales, el sitemap, `robots.txt`, las 47 redirecciones, el ZIP de RC1.8 y el cambio RC1.7 a RC1.8.
- **El propio informe:** conteos de las tablas, huellas SHA-256 y número de controles.

### 10.1 Correcciones hechas

| # | Dónde | Estaba | Ahora | Evidencia |
|---|---|---|---|---|
| 1 | CSV principal y detalle, fila `alba-dorada-cafe-claro`; secciones 1, 2, 5 y F-04 | `PASS_WITH_INTENTIONAL_CHANGE` con `content_parity = GAP` (un GAP no intencional no cabe en un estado que dice "cambio intencional") | `BLOCKED_BY_OWNER`. Cuentas: `PASS_WITH_INTENTIONAL_CHANGE` 43 a 42, `BLOCKED_BY_OWNER` 32 a 33 | Fichas: actual `S-M-L`, Dev `S-M-L-XL`; es la única de 29 |
| 2 | Detalle de la Home y F-16 | Una diferencia de texto en el anuncio ("20 %" con espacio en el sitio actual, "20%" en Dev) | Retirada: no existe | El HTML actual trae `20<!-- -->% de descuento`; al quitar las etiquetas quedaba un espacio que no se dibuja. Texto renderizado igual en ambos (`dev-home.json`); `theme/03G-home-parity.md` lo marca `matched` |
| 3 | Fila de la Home (CSV principal, detalle), F-17 nuevo | La fila no medía el destino de los CTA ni el logo | Agregados: los dos CTA van a `#productos` hoy y a `#categorias` en Dev; logo de imagen hoy y texto "Radaelli Swimwear Dev" en Dev, y el logo no está en el plan de media A4 | `home.html`, `dev-home.json`, `theme-src/templates/index.json`, `media-migration-manifest.csv`; ya documentado en `theme/03G-home-parity.md` (HP-02, HP-03) |
| 4 | Sección 6, última línea | "7 restos de plantilla Vercel" que ya dan 404 | 3 restos (`/[page]`, `/product/[handle]`, `/search/[collection]`) y 4 rutas de metadatos de Next, con HTTP no medido | `seo/03E-redirect-plan.md` § 4.2 |
| 5 | Detalle del blog y sección 6 | Decía que `/blogs/news` estaba vacío | "existe en Dev, en inglés; si tiene artículos no se midió" | `dev-routes.json` solo guarda 200 y `h1 "News"`; el propio detalle lista "cantidad de artículos en Dev" como no medido |
| 6 | Detalle de Salidas de Baño | "filtros: no comparados (colección vacía en ambos sitios)" | Registra que con 0 productos el actual dibuja Talla, Color y Precio y Dev solo "Ordenar por". `function_parity` sigue `NOT_MEASURED` por convención (sin productos no hay nada que filtrar) | `salidas-de-bano.html`, `dev-collections.json` |
| 7 | F-02 | Las 4 URLs "indexadas" | "indexables" (el estado real en Google no está medido) | Rastreo y sitemap: `index, follow`; el informe del baseline lista el estado en Google como NOT_AVAILABLE |
| 8 | F-10 | Impacto: "en el sitemap y en Google" para las 6 rutas | Solo las 3 del lote C5 constan en el sitemap de Shopify | `seo/03F-seo-final-validation.md` hallazgos 1 y 2 |
| 9 | F-15 | "no puedo explicar las 4 restantes" | Resuelto: 33 = 29 productos + 4 colecciones (etiqueta imprecisa de `dev-routes.json`); 4 + 29 + 5 = 38 verificadas, más 9 opacas = 47 | `seo/03F-redirect-import-result.md` § 2 |
| 10 | F-04 | Sin procedencia de la variante XL | Agregada: `variants-master.csv` la registra disponible el 2026-09-28. Que el sitio cambiara después no está demostrado | `catalog/variants-master.csv`; `launch/03G-product-parity.md` F-01 |
| 11 | F-12 | "puede no hacer falta" sin etiqueta | Marcado `[INFERIDO]` | Regla de etiquetas |
| 12 | Secciones 1, 2, 5, 9 | Conteos, regla de seguridad, leyenda de `BLOCKED_BY_OWNER`, control número 31, huellas | Actualizados a las salidas corregidas | Validador |

Cambios en el generador (`03g-route-parity.mjs`): estado de la ficha con GAP, texto del anuncio calculado sin el artefacto de las etiquetas, CTA y logo de la Home, texto de Salidas de Baño y del blog, y un control nuevo (ninguna fila `PASS` o `PASS_WITH_INTENTIONAL_CHANGE` con GAP abierto). Regenerar con el script produce exactamente los CSV de este informe.

### 10.2 Hallazgos declarados

F-01 a F-14 se sostienen contra la evidencia cruda, con los matices de arriba. La única afirmación refutada es la diferencia del anuncio (F-16). El resto de F-16 se confirma: color en `costa-esmeralda-azul` y `entero-golden-hour`, CTA del newsletter y sufijo `_<uuid>` solo en `amanecer-dorado-lila`.

### 10.3 Convenciones que se dejan, con su límite

- **`PASS_WITH_INTENTIONAL_CHANGE` y A1:** 30 filas (28 fichas, `/cart` y `/search?q=`) dependen de A1 y su función (compra en Colombia) no está medida. El estado vale para ruta y contenido, no para compra: hay que leer `function_parity` y `known_dependency`.
- **`PASS`:** la única fila `PASS` es el 404 de una ruta inexistente y vale solo para el código HTTP y la indexación (`noindex` en ambos lados). Contenido y diseño de la página 404 en Dev no se midieron.
- **`/cart`:** figura `PASS_WITH_INTENTIONAL_CHANGE` aunque hoy da 404 en el sitio actual (excepción de la leyenda de la sección 2).
- **`/accesorios` y el blog:** son el mismo caso (200, en el sitemap actual, sin destino, decisión pendiente) y llevan estados distintos (`NOT_APPLICABLE` y `MISSING`). La leyenda los distingue por tener o no contenido propio; 03E clasifica ambos como "intentionally not migrated".
- **`content_parity = MATCH`** de las 24 fichas cubre solo lo que lista `measured` del detalle. El acordeón de envíos y la promesa de envío gratis, por ejemplo, no entran (dependen de A1).

### 10.4 Límites de la verificación

- Usa la misma evidencia guardada: Dev con RC1.7 y país US, sitio actual sin JavaScript. No repitió ningún GET; lo que la evidencia no alcanza sigue `NOT_MEASURED` o `NOT_VERIFIED`.
- El conjunto permitido de `status` y de paridades es el que define la leyenda de las secciones 2 y 3; el repo no trae otra fuente.
- El validador recalcula desde el mismo HTML guardado, con extracción propia. No prueba el código HTTP exacto de las redirecciones ni nada posterior a la captura de Dev.
