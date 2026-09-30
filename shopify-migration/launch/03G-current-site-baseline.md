# 03G — Línea base del sitio actual (radaelliswimwear.com)

- **Fecha:** 2026-09-29. Auditoría de solo lectura del sitio custom Next.js que hoy sirve `https://radaelliswimwear.com`.
- **Qué es este documento:** el inventario de lo que el sitio actual sirve hoy, medido sobre el HTML guardado, más el cierre de "qué existe hoy y a dónde va en Shopify", "qué no se migra a propósito" y "qué no se pudo verificar".
- **Qué no es:** no compara ruta por ruta contra Shopify (eso es `launch/03G-route-parity.csv`, que **no existía al cerrar este informe: NOT_AVAILABLE**) ni producto por producto (eso es `launch/03G-product-parity.md`). Aquí se cita, no se duplica.
- **Etiquetas de evidencia:** `[MEDIDO-03G]` sale de `launch/evidence/`; `[DOC:<archivo>]` sale de un documento del repo; `[INFERIDO]` es razonado y se dice; `[NOT_VERIFIED]` no se pudo comprobar.
- **Sin adjetivos de calidad estética ni recomendaciones de diseño.** Las acciones propuestas son operativas (confirmar, decidir, volver a medir).
- **Verificación adversarial (2026-09-29):** un segundo agente re-abrió el HTML crudo y comprobó de forma independiente más de 60 afirmaciones (las 29 filas de fichas, las 9 colecciones, las 6 páginas legales, `robots.txt`, las 45 URLs del sitemap, la firma de cabecera y footer en las 52 páginas, los sondeos de filtros de colección, la comparación contra la Dev Store). Lo que no se sostenía se corrigió en este archivo y quedó marcado con «(corregido en la verificación)». El código de la app que vive en este repo (`components/`, `lib/`, `app/`) se leyó como [DOC:...]; que el código desplegado en producción sea idéntico al del repo es [INFERIDO] y es coherente con todo lo medido (6x de vistas, filtros, textos de banner).

## 1. Resultado en breve

- **Se midió** el HTML servido de **52 páginas** (rastreo de 70 URLs: 54 con 200, 16 con 404, 0 con 3xx) más **7 GET puntuales** (sección 2). Un script propio, determinista y sin red, extrae todo a `launch/evidence/current-site-extract.json`.
- **Cabecera, footer, anuncio y banner de cookies son idénticos en las 52 páginas** (una sola firma). [MEDIDO-03G]
- **Las 29 fichas de producto son homogéneas:** mismo esqueleto, descuento `-20%` en 29/29, precio con descuento = 80 % del anterior en 29/29, tarjetas de colección y ficha con el mismo precio en 29/29. [MEDIDO-03G]
- **Los 6 textos legales vivos son idénticos, palabra por palabra, a `content/legal/*.html`** y coinciden con `manifest.json` en número de palabras (430, 322, 175, 231, 179, 197). [MEDIDO-03G]
- **Lo que está mal o distinto** está en la tabla de hallazgos (20: 1 BLOCKER, 2 DEFECT, 8 DIFFERENCE, 9 NOTE; corregido en la verificación: eran 17 con 2 DEFECT distintos). Los que más pesan para el corte: las 4 páginas legales que hoy están publicadas e indexables y no tienen destino en la Dev Store (B-08); los filtros Precio y Color del sitio actual, que no devuelven lo que sus rótulos prometen (B-02, B-18); la talla XL que Shopify tiene y el sitio actual ya no ofrece en `alba-dorada-cafe-claro` (B-04); y el contador "N vistas", que el código multiplica por 6 a propósito (B-01).
- **Límite principal:** todo es HTML servido (SSR + payload RSC). No hay ejecución de JavaScript, no se descargó CSS y no hay mediciones visuales. Lo que solo existe tras hidratar (checkout, cuenta, cajón del carrito, modal de guía de tallas, "Recomendado para vos" de la Home, "Vistos recientemente" y "N personas viendo esto ahora" de la ficha) queda `NOT_VERIFIED` (sección 17). Del código de la app solo se leyó lo necesario para explicar mecanismos ya medidos; no se ejecutó.

### 1.1 Hallazgos

| ID | Severidad | Qué | Evidencia | Impacto | Acción propuesta |
|---|---|---|---|---|---|
| B-01 | DIFFERENCE (era DEFECT; corregido en la verificación) | El contador visible "N vistas" en la ficha es **6 × `realViews`** del payload en **29/29** productos (`promotionalViews` = 0 en 29/29). Mostrado: 12 a 162; `realViews`: 2 a 27 | Ficha + payload RSC (`payloadAggregate.viewsCounter`) [MEDIDO-03G]. Origen del factor 6, hallado en el código del repo: `REAL_VIEWS_DISPLAY_MULTIPLIER = 6` y `getDisplayedTotalViews = realViews × 6 + promotionalViews`, con el comentario de que se aplica "solo al leer/mostrar" y no se guarda inflado [DOC:lib/catalog/view-display.ts]; la ficha lo usa en [DOC:components/product-detail/product-detail.tsx:48-51]. Lo medido (6 × `realViews` + 0 en 29/29) coincide con esa fórmula. Que `realViews` sean las vistas registradas: [INFERIDO] por el nombre del campo, que [DOC:shopify-import/catalog-field-mapping.md:22] lista como `realViews` / `promotionalViews` | Es una regla de exhibición deliberada del sitio actual, no un fallo de datos: la cifra que ve la clienta es 6 veces el campo `realViews`. El campo no se migra [DOC:shopify-import/catalog-field-mapping.md:22] y el informe de la ficha ya lo registra como no migrado a propósito [DOC:theme/product-page-report.md:64]. Además hay un segundo indicador, "N personas viendo esto ahora" (`LiveViewers`), que solo se pinta tras hidratar y que el código fija en 5 cuando hay una sola persona [DOC:lib/catalog/presence-actions.ts]; no aparece en el HTML servido y no se midió en vivo [NOT_VERIFIED] | La dueña confirma que no se replique. No copiar las cifras a Shopify |
| B-02 | DEFECT | El filtro **Precio** del sitio actual no segmenta: rótulos `Menos de $50`, `$50 – $100`, `$100 – $200`, `Más de $200` con precios de $ 159.920 a $ 249.900. Con URL: `?precio=menos-50` en Oasis Natural → **0 productos**; `?precio=mas-200` → **10 de 10** | Rótulos [MEDIDO-03G]; sondeo `launch/evidence/03g-collection-filter-probe/` (tarea de paridad de colecciones) [MEDIDO-03G]. Mecanismo, en el código del repo: los cortes 0 / 50 / 100 / 200 están en `PRICE_BUCKETS` de un archivo de datos de ejemplo [DOC:lib/placeholder-data.ts:67-72] y se comparan contra `priceValue` sin conversión de moneda [DOC:lib/catalog/catalog-actions.ts:96-111]; el selector COP/USD solo cambia cómo se muestra el precio, no este filtro [DOC:components/currency/currency-store.tsx]. Que el botón use esos mismos parámetros: [INFERIDO] (el componente hace `router.replace` con `precio=<id>` [DOC:components/catalog/catalog-filters.tsx]) | En Oasis Natural todo cae en "Más de $200" (10 de 10, medido). Para Aurora Viva y Espuma de Ola es [INFERIDO] (solo se sondeó Oasis; sus precios, $ 159.920 a $ 183.920, también superan los cortes). Es un dato de línea base, no algo que Shopify deba copiar | Ninguna para migrar; no usar este filtro como criterio de paridad |
| B-03 | DIFFERENCE | Filtros de colección: sitio actual = Ordenar (3 opciones), **Talla** (6), **Color** (8), Precio (4). Dev Store (captura RC1.7) = Ordenar (9 opciones) + Precio; **sin Talla ni Color** | Sección 5.2; `dev-collections.json` `filterGroups` [MEDIDO-03G] | Se pierde el filtrado por talla y color hasta configurar Search & Discovery (acción de la dueña) [DOC:theme/03F-search-discovery-owner-runbook.md]. El comportamiento del filtro Color del sitio actual se trata aparte en B-18 | Volver a medir las colecciones en RC1.8 tras el runbook |
| B-04 | DIFFERENCE | `alba-dorada-cafe-claro`: el sitio actual ofrece **S, M, L** (payload: `sizes` S,M,L; `totalStock` 75); la Dev Store y `variants-master.csv` (2026-09-28) tienen **S, M, L, XL** | Ficha + payload; `dev-products.jsonl`; `catalog/variants-master.csv` [MEDIDO-03G]. Es el único de 29 [MEDIDO-03G]. Misma conclusión en `launch/03G-product-parity.md` (F-01) | Shopify vende una talla que hoy no existe en el sitio actual (riesgo de venta sin stock) | La dueña confirma si existe XL físico; si no, quitar la variante XL antes del corte y volver a correr el rastreo |
| B-05 | DIFFERENCE | Orden por defecto: en las 3 colecciones con productos, **0 de 29** productos ocupan la misma posición en el sitio actual ("Novedades") que en la Dev Store (manual). En la Home, el carrusel "La belleza de sentirte tú" tiene **2 de 8** productos distintos y "Productos destacados" tiene el mismo conjunto de 7 en otro orden | `collectionsVsDev`, `homeVsDev` [MEDIDO-03G]. Criterio del orden "Novedades": el código ordena por `createdAt` ascendente, es decir, el más antiguo primero, no el más nuevo [DOC:lib/catalog/catalog-actions.ts:116-122]; `created_at` = NOT_AVAILABLE en `products-master.csv`, así que el orden no se puede reconstruir desde el repo (corregido en la verificación: antes decía que el criterio no estaba en ninguna fuente) | Los primeros productos visibles cambian en cada colección y en la Home | La dueña decide el orden que quiere; reordenar en Shopify si quiere paridad |
| B-06 | DIFFERENCE | Home vs captura Dev: anclas de CTA (`#productos` vs `#categorias`) en hero y banner; botón del newsletter ("Quiero enterarme" vs "Suscribirme"); tagline del footer sin el prefijo "Radaelli Swimwear: "; hero sin video en Dev (M01–M14 siguen servidos hoy y pendientes de subir); footer "Ayuda" con 6 enlaces + Contacto vs 2; **columna "Empresa" ausente**; selector de moneda COP/USD y 4 iconos de redes del header **no existen** en `header.liquid`; la sección "Recomendado para vos" existe en la Home actual como componente de cliente (ver 4.4) y en la Dev está oculta y vacía [MEDIDO-03G dev-home.json] (corregido en la verificación) | Secciones 4.2 a 4.4; `dev-home.json`; lectura de `theme-src` [MEDIDO-03G] | Diferencias de paridad de la Home. Los medios son bloqueo de la dueña [DOC:content/media/media-migration-manifest.csv] | Volver a medir la Home en RC1.8 tras subir los medios |
| B-07 | DIFFERENCE | La promesa "Envío gratis en compras desde $ 299.900" está en la Home (banner), en las **29** fichas (acordeón) y en `/envios` (más su meta description). La Dev Store la tiene apagada hasta que exista la tarifa | Ficha, Home, `/envios` [MEDIDO-03G]; cerrojo [DOC:theme/03D-search-accounts-wishlist-report.md:15,77]; bloqueo de zona/mercado Colombia = acción A1 de la dueña | Hoy el sitio actual promete algo que la Dev Store no cumple ni muestra | Cerrar A1/C2 antes del corte |
| B-08 | BLOCKER (para el corte de DNS) | `/envios`, `/terminos`, `/privacidad`, `/cookies`: hoy **200, indexables, en el sitemap y enlazadas desde el footer** (`index, follow`, canonical propio). En la Dev Store `/pages/envios`, `/pages/terminos`, `/pages/cookies`, `/pages/privacidad` dan 404 y no están en las 47 redirecciones | Rastreo + sitemap + footer; `dev-routes.json` [MEDIDO-03G]. El propio plan lo declara requisito previo del cambio de DNS [DOC:seo/03E-redirect-plan.md §4.3] | Con el DNS movido sin destino, 4 URLs publicadas darían 404 y el footer nuevo no tendría esas políticas. El texto ya está listo en `content/legal/` (B-17) | La dueña crea las páginas (acción B2) y se agregan sus filas de redirección antes del DNS |
| B-09 | DIFFERENCE | Blog: `/blog` + 3 posts (`/blog/novedades-temporada`, `/blog/materiales-nobles-por-que-importan`, `/blog/guia-de-capas-para-el-invierno`) → **200, `index, follow`, en el sitemap**, JSON-LD `Article`. El texto habla de lana, lino, cuero, abrigo e invierno, firma "Equipo LAGO" / "Laura Gómez", con imágenes de `images.unsplash.com`. No se migra: 404 al cortar | Sección 12.6; sondeo [MEDIDO-03G]. Que sea contenido heredado de otra marca/plantilla: [INFERIDO] | 4 URLs indexadas desaparecen; la Dev Store trae el blog por defecto "News" en inglés (`/blogs/news`) | La dueña decide migrar o dejar en 404 [DOC:seo/03E-redirect-plan.md §5.5] |
| B-10 | NOTE | 5 rutas de categoría sin catálogo devuelven **200 e `index, follow`** con canonical propio y 0 productos: `/accesorios` (está en el sitemap), `/hombre`, `/mujer`, `/ninos`, `/calzado` (fuera del sitemap). Su descripción habla de prendas que esta tienda no vende ("Sastrería moderna… para hombre", "Zapatillas y calzado…"; que sean textos de otro catálogo es [INFERIDO]) | Sección 5 [MEDIDO-03G] | Son páginas vacías indexables. Se pasan a 404 [DOC:seo/03E-redirect-plan.md §4.1 filas 6–10] | Confirmar con Search Console si `/accesorios` tuvo tráfico (decisión de la dueña) |
| B-11 | NOTE | `/search` es un resto de la plantilla Vercel: **200, en inglés** ("Search for products in the store", "Collections / All / Sort by / Relevance / Trending / Latest arrivals"), **`index, follow`**, **no** está en `Disallow` (sí `/buscar`), no está en el sitemap; su zona de resultados llega en estado de error (`<!--$!-->` con digest) y 12 `<li>` vacíos. El `SearchAction` de JSON-LD apunta a `/buscar`, no a `/search` | Sección 8 [MEDIDO-03G] | Shopify sirve su propio `/search` (noindex en la Dev Store) [MEDIDO-03G dev-routes]. Sin acción de migración | Ninguna |
| B-12 | NOTE | Las páginas sin canonical propio heredan el de la **Home**: `/buscar`, `/search`, `/checkout`, `/cuenta`, `/cuenta/favoritos`, `/cuenta/iniciar-sesion`, `/favoritos` y la página 404. `/search` es la única con `index, follow` | Sección 12.5 [MEDIDO-03G] | `/search` indexable declara la home como canonical | Ninguna para migrar (informativo) |
| B-13 | NOTE | El payload RSC público de cada ficha incluye `id` interno (29/29), stock por talla (23 a 25 por talla; total 72 a 100), `featured` (10 de 29 en `true`), `realViews`. `products-master.csv` dice "id interno no expuesto públicamente" | Payload de las 29 fichas (`payloadAggregate`) [MEDIDO-03G]; contradice [DOC:catalog/products-master.csv, columna `current_id`] | El dato existe y sirve para conciliar; el stock por talla es visible a cualquiera | Informativo; la dueña decide si le importa que el stock sea público |
| B-14 | NOTE | "20% de descuento en toda la tienda" aparece en el anuncio y en el banner ("Por tiempo limitado") pero **no hay fecha de fin** en el HTML ni en el payload. En la ficha llega `activeDiscountPercent` = 20 en 29/29 y `products-master.csv` trae `discount_percent` = 20 en las 29 filas. En la Dev Store el 20 % está en el precio (`compare_at`) | Home + payload [MEDIDO-03G]; `dev-products.jsonl`. Mecanismo en el código del repo [DOC]: el descuento se resuelve por precedencia producto > categoría > sitio (no se suman) [DOC:lib/pricing/discount.ts]; el anuncio superior lee el descuento del sitio de la configuración y se apaga solo cuando vale 0 [DOC:components/layout/discount-announcement-bar.tsx]; el titular del banner de la Home tiene "20%" escrito fijo en el componente [DOC:components/home/promo-banner.tsx:27], mientras el monto del envío gratis sí sale de la configuración [DOC:components/home/promo-banner.tsx]. Cuál de los tres niveles origina hoy el 20 % visible: `NOT_VERIFIED` (la configuración del sitio no está en la evidencia) | No hay fecha de fin en ninguno de los dos lados (corregido en la verificación: antes decía "ni mecanismo"; el sitio actual sí tiene un valor manual que apaga el anuncio, pero no lo hace por fecha). Fecha de fin: **NOT_AVAILABLE**. Si el valor por producto (20) gana sobre el del sitio, apagar solo el anuncio no quita el descuento de los precios: [INFERIDO] de la precedencia | La dueña define cómo y cuándo termina |
| B-15 | NOTE | Contenido que llega solo tras hidratar y no se puede describir: `/checkout` ("Cargando tu carrito..."), `/cuenta` y `/cuenta/favoritos` ("Cargando..."), cajón del carrito, cuerpo de la página 404 (vacío en el HTML), y tres piezas que el payload declara como componentes de cliente y el HTML no trae: "Recomendado para vos" en la Home (`RecommendedForYou`), "Vistos recientemente" en las 29 fichas (`RecentlyViewed`) y "N personas viendo esto ahora" en las 29 fichas (`LiveViewers`) | Secciones 4.4, 6.1, 9, 10 y 12.4 [MEDIDO-03G] (`payloadClientComponents` en el JSON); qué pintan: [DOC:components/home/recommended-for-you.tsx; components/catalog/recently-viewed.tsx; components/product-detail/live-viewers.tsx] (agregado en la verificación) | El baseline de esas pantallas y secciones no existe en esta medición | Medirlas con navegador en otra tarea |
| B-16 | NOTE | Registro de tratamiento mezclado, a veces dentro de la misma página: voseo (`Dejá`, `recibí`, `Buscá`, `Escribí`, `Podés`, `Guardá`, `Probá`, `consultá`, `Ingresá`, `Registrate`, `Volvé`) en Home, 6 colecciones vacías, `/buscar`, `/favoritos`, `/cookies`, `/privacidad`, `/terminos`, `/cuenta/iniciar-sesion` y 404; tuteo (`Tienes`, `Contáctanos`, `aceptas`) en los 6 legales. `/cookies`, `/privacidad` y `/terminos` mezclan ambos | Sección 13 [MEDIDO-03G] | Solo observación; el copy de Dev del newsletter es idéntico al actual | Ninguna |
| B-17 | NOTE | Verificación positiva: los 6 textos legales vivos = `content/legal/*.html` (texto igual, `firstDiffIndex` = -1 en 6/6). La línea "Última actualización: 29 de septiembre de 2026" muestra la fecha del día del rastreo | Sección 11 [MEDIDO-03G]; que sea fecha de render [DOC:scripts/extract-legal-verbatim.cjs] | El texto migrado es el vigente | Volver a comparar justo antes del corte |
| B-18 | DEFECT | Filtro **Color** del sitio actual: el botón "Beige" (así escrito en el rótulo) equivale a `?color=Beige` y devuelve **0 productos** en Oasis Natural; `?color=BEIGE`, el valor tal como lo guarda cada ficha, devuelve **3** (`arena-dorada-beige`, `brisa-natural-beige`, `marea-natural`) y deja sin botón presionado | Sondeo `launch/evidence/03g-collection-filter-probe/` (`oasis-color-titlecase-Beige.html`: 0 tarjetas; `oasis-color-uppercase-BEIGE.html`: 3) [MEDIDO-03G]. Mecanismo [DOC]: el botón manda el texto del rótulo [DOC:components/catalog/catalog-filters.tsx, `toggle(option)`] y la consulta compara `color` con `in` exacto [DOC:lib/catalog/catalog-actions.ts:95,104]. En las fichas 11 de los 13 valores de color de producto están en mayúsculas (`Azul` y `Mostaza` no) [MEDIDO-03G]. Que los otros 7 botones den 0 por la misma causa es [INFERIDO]; solo se sondeó Beige (agregado en la verificación) | Quien filtra por color en pantalla probablemente ve "0 productos" (medido con Beige; el resto [INFERIDO]). El filtro tampoco puede alcanzar los 7 colores de producto sin rótulo (sección 5.2) | Ninguna para migrar; no usar este filtro como criterio de paridad. Volver a medir en RC1.8 con Search & Discovery |
| B-19 | DIFFERENCE | Portada de colección: el sitio actual pinta **imagen de portada** con encuadre propio en las 4 colecciones oficiales (Oasis, Aurora, Espuma y Salidas de Baño, esta última sin productos); la captura Dev muestra **ninguna imagen** (`bannerImg` = false en las 6 colecciones Dev) | Actual: HTML de las 4 colecciones (sección 5.1); Dev: `dev-collections.json`, `collectionsVsDev` [MEDIDO-03G]; medios M10 a M13 con estado `DEFERRED_OWNER_ONLY_BLOCKER` [DOC:content/media/media-migration-manifest.csv]. Ya registrado en [DOC:launch/03G-collection-parity.md C-07] (agregado en la verificación: el informe no lo listaba como hallazgo) | Las 4 páginas de colección se ven sin foto en Shopify hasta cargar los medios | La dueña sube M10 a M13 y carga `custom.cover_image` y el encuadre |
| B-20 | NOTE | El plan de redirects dice de `/admin` que "no se lista en robots"; el `robots.txt` vivo **sí** trae `Disallow: /admin` (además de `/api` e `/interno`), igual que el código actual | `robots.txt` guardado [MEDIDO-03G]; [DOC:app/robots.ts]; frase del plan [DOC:seo/03E-redirect-plan.md §4.2, fila `/admin`] (agregado en la verificación) | Es una discrepancia documental, no del sitio; no cambia ninguna migración (esas rutas no se migran) | Corregir esa frase del plan cuando se toque; sin acción en Shopify |

## 2. Método, insumos y límites

### 2.1 Insumos usados

| Insumo | Qué es |
|---|---|
| `launch/evidence/current-site/index.json` + `*.html` + `robots.txt.txt` + `sitemap.xml.txt` | Rastreo GET de solo lectura hecho antes de esta tarea: 70 URLs, 54 con 200 y 16 con 404. Solo se guardaron los cuerpos con 200 |
| `launch/evidence/current-site-probe/` | **7 GET puntuales hechos en esta tarea** con `launch/tools/03g-baseline-probe.mjs` (sección 2.2) |
| `launch/evidence/dev-home.json`, `dev-collections.json`, `dev-products.jsonl`, `dev-routes.json` | Capturas de la Dev Store. **Declaran el theme RC1.7 (sin publicar)**; el theme vigente es RC1.8 y no se re-midió |
| `content/legal/*`, `content/media/media-migration-manifest.csv`, `catalog/*.csv`, `seo/*`, `theme/*.md`, `theme-src/` (solo lectura) | Documentos y código del repo |
| `launch/evidence/03g-collection-filter-probe/` | Sondeo de filtros hecho por la tarea de paridad de colecciones; se usa solo para B-02 y B-03 |

### 2.2 Los 7 GET puntuales (declarados)

La evidencia guardada no alcanzaba para estos puntos, así que se hicieron **7 GET a `https://radaelliswimwear.com`**, sin login y sin POST, con espera entre pedidos y sin seguir redirecciones:

| Ruta | Por qué faltaba | Resultado |
|---|---|---|
| `/cuenta/iniciar-sesion` | Es el destino del icono "Cuenta" del header y el rastreo no la pidió | 200, `noindex, nofollow` |
| `/blog/novedades-temporada`, `/blog/materiales-nobles-por-que-importan`, `/blog/guia-de-capas-para-el-invierno` | Están en el sitemap y el rastreo solo pidió el literal `/blog/<slug>` (404) | 200 los tres, `index, follow` |
| `/carrito` | El rastreo no guardó ningún cuerpo 404 | 404; cuerpo guardado |
| `/producto/costa-esmeralda-azul` (minúsculas) | Comprobar la afirmación de 03E sobre mayúsculas | **404** (solo responde `/producto/COSTA-ESMERALDA-AZUL`) |
| `/oasis-natural/` (barra final) | Comportamiento ante barra final | **308** → `/oasis-natural` |

### 2.3 Cómo se lee el HTML

Es HTML de Next.js con streaming (Suspense). El script construye el árbol, resuelve el streaming (`$RC`/`$RS`) para ver la página como quedaría tras el swap y lee el payload RSC (`self.__next_f`) para el contenido que solo viaja como datos (acordeones, objeto `product`, categorías). El número de WhatsApp del sitio se reemplaza por "enlace wa.me del sitio" en toda la salida del script y en este informe, y el script termina con código 2 si detecta un número en su salida. Los HTML crudos guardados como evidencia (rastreo y sondeo) conservan el enlace público tal como lo sirve el sitio.

### 2.4 Qué no se mide

- **No hay JavaScript ejecutado, ni CSS descargado** (2 hojas de estilo por página, sin bajar), ni capturas de pantalla, ni Core Web Vitals.
- **No se consultó la base de datos ni ninguna tienda.** Los datos internos que aparecen (`id`, stock, `realViews`) vienen del payload público de las fichas.
- Los medios (imágenes, video) se inventarían por URL en el HTML; **no se descargaron ni se abrieron**.

## 3. Rastreo: qué devolvió cada ruta (ítem 10, primera parte)

| Grupo | URLs | 200 | 404 | Notas |
|---|---:|---:|---:|---|
| Home | 1 | 1 | 0 | `/` |
| Categorías/colecciones | 9 | 9 | 0 | Las 9 rutas pedidas (sección 5) |
| Fichas de producto | 29 | 29 | 0 | `/producto/<slug>`; solo `COSTA-ESMERALDA-AZUL` va en mayúsculas |
| Legales | 6 | 6 | 0 | `/envios`, `/devoluciones`, `/garantia`, `/privacidad`, `/terminos`, `/cookies` |
| Búsqueda | 2 | 2 | 0 | `/buscar`, `/search` (sección 8) |
| Carrito | 2 | 0 | 2 | `/carrito`, `/cart` |
| Checkout | 1 | 1 | 0 | `/checkout` |
| Cuenta | 4 | 2 | 2 | `/cuenta`, `/cuenta/favoritos` = 200; `/login`, `/registro` = 404 |
| Favoritos | 2 | 1 | 1 | `/favoritos` = 200; `/wishlist` = 404 |
| Blog | 2 | 1 | 1 | `/blog` = 200; `/blog/<slug>` (literal del inventario) = 404 |
| `robots.txt`, `sitemap.xml` | 2 | 2 | 0 | Texto y XML |
| Otras rutas probadas | 10 | 0 | 10 | `/ayuda`, `/contacto`, `/faq`, `/nosotros`, `/politica-de-cookies`, `/politica-de-devoluciones`, `/politica-de-envios`, `/politica-de-garantia`, `/politica-de-privacidad`, `/terminos-y-condiciones` |
| **Total** | **70** | **54** | **16** | 52 son HTML; 0 respuestas 3xx en el rastreo |

[MEDIDO-03G] `crawl.byKind`, `crawl.records`.

## 4. Home, cabecera y footer (ítems 1 y 2)

### 4.1 Estructura común a todas las páginas HTML

- **Una sola firma de cabecera + footer + anuncio + banner de cookies en las 52 páginas HTML** (`shell.consistency`: 1 firma distinta, 0 páginas fuera de la de la Home). Las 2 páginas 404 guardadas en el sondeo no traen cabecera ni footer en el HTML servido. [MEDIDO-03G]
- **Anuncio:** un `div` antes del header con el texto "20% de descuento en toda la tienda" (no es enlace). [MEDIDO-03G]
- **Enlace "Saltar al contenido principal"** (`#main-content`). [MEDIDO-03G]
- **El footer está dentro de `<main>`**, después de las secciones (`footer.insideMain` = true). [MEDIDO-03G]
- **Banner de cookies** fuera de `<main>`: "Usamos cookies esenciales para que la tienda funcione (carrito, sesión, pagos). Con tu permiso, también podríamos usar cookies de análisis y de publicidad más adelante, para entender mejor tu experiencia de compra." con 3 botones: "Aceptar todas", "Rechazar no esenciales", "Configurar". [MEDIDO-03G]
- **Terceros en el HTML servido:** `radaelliswimwear.com`, `res.cloudinary.com`, `instagram.com`, `facebook.com`, `tiktok.com`, `wa.me` en las 52 páginas, más **`images.unsplash.com` solo en `/blog`** (3 imágenes de las tarjetas; los 3 posts, fuera de las 52, también la usan, incluida su `og:image`) (corregido en la verificación: antes decía "solo" los seis primeros); `schema.org` y `www.w3.org` aparecen solo como espacios de nombres. 0 etiquetas `<script src>` externas, 0 referencias a Google Tag Manager/gtag y 0 al Pixel de Meta. [MEDIDO-03G] `absoluteHostsInServedHtml` (no cuenta las imágenes que pasan por `/_next/image?url=`), `mediaHosts` y `rawHostsAnyContext` (nuevo).
- **Analítica:** el payload de las 52 páginas trae `AnalyticsLoader` con `ga4Active: false` y `metaPixelActive: false`, y trae `AttributionCapture` y `ConsentBanner`; las 29 fichas traen además `ViewTracker` y `ProductViewAnalytics`. [MEDIDO-03G] `analyticsFlagsInPayload`, `payloadClientComponents`. Esas dos banderas se calculan en el servidor combinando un interruptor de entorno, el consentimiento y el tráfico interno [DOC:app/layout.tsx:98-112; components/analytics/analytics-loader.tsx]; un GET sin consentimiento las deja en `false` por diseño, así que **no prueba** que GA4 y Meta Pixel estén apagados para quien acepta cookies: `NOT_VERIFIED` (agregado en la verificación).
- **Otros hechos del `<head>`:** `<html lang="es">` en las 52 páginas (la 404 no lleva `lang`); iconos `favicon.ico` (48x48), `icon.png` (512) y `apple-icon.png` (180); `meta viewport` (sección 14). [MEDIDO-03G]

### 4.2 Cabecera

| Elemento | Destino / contenido | Visibilidad por clases | Fuente |
|---|---|---|---|
| Botón "Abrir menú" | botón sin `href`; el panel que abre es de cliente (`NOT_VERIFIED`) | solo bajo `lg` (`lg:hidden`) | [MEDIDO-03G] |
| Logo | `/` con imagen `/logo/radaelli-swimwear.png` (alt "Radaelli Swimwear") | siempre | [MEDIDO-03G] |
| Menú principal (5) | Inicio `/`, Oasis Natural `/oasis-natural`, Aurora Viva `/aurora-viva`, Espuma de Ola `/espuma-de-ola`, Salidas de Baño `/salidas-de-bano` | `hidden lg:flex` (desde `lg`) | [MEDIDO-03G] |
| Búsqueda | `form action="/buscar"`, `input name="q"` con `role="combobox"` y `aria-controls="search-suggestions"`; se expande con un botón "Buscar" | contenedor `hidden lg:block` | [MEDIDO-03G]; las sugerencias las resuelve JS: `NOT_VERIFIED` |
| Selector "Moneda" | `select` con `COP` (elegido) y `USD` | `hidden xl:block` | [MEDIDO-03G]; qué hace `USD`: según el código solo cambia la moneda en que se muestra el mismo monto en COP (tasa tomada de la configuración), se guarda en `localStorage` y el checkout siempre cobra en COP [DOC:components/currency/currency-store.tsx]; verlo funcionando: `NOT_VERIFIED` |
| Redes (4 iconos) | Instagram, Facebook, TikTok y WhatsApp (enlace wa.me del sitio) | `hidden xl:flex` | [MEDIDO-03G] |
| Favoritos | `/favoritos` | `hidden lg:flex` | [MEDIDO-03G] |
| Cuenta | `/cuenta/iniciar-sesion` | `hidden lg:flex` | [MEDIDO-03G] |
| Carrito | **botón** (no enlace, sin `href`): abre un cajón | siempre | [MEDIDO-03G] |

La cabecera es `sticky`.

### 4.3 Footer

| Bloque | Contenido | Fuente |
|---|---|---|
| Logo + tagline | "Radaelli Swimwear: trajes de baño de diseño atemporal, hechos para durar, con materiales nobles y una mirada minimalista." | [MEDIDO-03G] |
| Redes (4 botones) | Instagram, Facebook, TikTok, WhatsApp (enlace wa.me del sitio) | [MEDIDO-03G] |
| Columna "Comprar" | Oasis Natural, Aurora Viva, Espuma de Ola, Salidas de Baño | [MEDIDO-03G] |
| Columna "Ayuda" | **Contacto** (desplegable `<details>` con Instagram `@Radaelli_swimwear`, Facebook `Radaelli_Swimwear`, TikTok `@RadaelliSwimwear` y WhatsApp con el número visible), Envíos, Devoluciones, Garantía, Términos y condiciones, Privacidad, Cookies | [MEDIDO-03G] |
| Columna "Empresa" | Sobre nosotros, Sostenibilidad, Prensa: **los 3 enlaces apuntan a `#contacto`** (el propio footer); no hay páginas detrás | [MEDIDO-03G]; ya descrito como placeholders en [DOC:theme/footer-report.md:13] |
| Pie | "© 2026 Radaelli Swimwear. Todos los derechos reservados." | [MEDIDO-03G] |

Datos de contacto en el sitio: solo redes y WhatsApp. **No hay enlaces `mailto:` ni `tel:`, ni dirección, ni página de contacto** (`/contacto` = 404); los 6 textos legales tampoco traen NIT, razón social, dirección ni correo del comercio (la política de privacidad nombra el correo solo como dato que se recopila; `/terminos` dice que la compra también se puede coordinar por WhatsApp). Identificación legal del comercio en el sitio: **NOT_AVAILABLE**. [MEDIDO-03G]

### 4.4 Home: secciones en el orden del DOM

`<title>` "Trajes de baño de diseño en Colombia"; meta description "Radaelli Swimwear — trajes de baño de diseño premium y atemporal. Materiales nobles y una mirada minimalista."; `index, follow`; canonical `https://radaelliswimwear.com`; JSON-LD `Organization` y `WebSite` (con `SearchAction` a `/buscar?q=`). [MEDIDO-03G]

| # | Sección | Textos | CTAs | Media | Notas |
|---|---|---|---|---|---|
| 1 | Hero (`#hero`) | Eyebrow "Radaelli Swimwear"; `h1` "Diseños que acompañan tu belleza natural con fuerza, libertad y estilo."; "Swimwear pensado para mujeres auténticas, seguras y poderosas." | "Compra de forma sostenible" → `#productos` | **1 video** Cloudinary `lago/home/bb70lfnhpbl4h8ee7mdz.mp4` (entrega `f_auto,q_auto`), `autoplay loop muted playsinline preload="auto"`, `aria-hidden`; poster `lago/products/cerhqv59kh6iedegvatv.png` | Proporción por ancho: 4/5, 3/4 desde `sm`, 16/10 desde `md`, alto libre con mínimo 90vh desde `lg` |
| 2 | Categorías destacadas (`#categorias`) | Eyebrow "Explora"; `h2` "Categorías destacadas" | 4 tarjetas, cada una con "Explorar →" | Ver 4.5 | Grilla de 1 columna en todos los anchos; cada tarjeta 16/9 |
| 3 | "La belleza de sentirte tú" | Eyebrow "Radaelli Swimwear"; `h2` "La belleza de sentirte tú" | — | Carrusel con snap horizontal: **8 tarjetas** = las 8 primeras de Oasis Natural en su orden por defecto | Sin badge de categoría ni "Ver producto" en estas tarjetas |
| 4 | Productos destacados (`#productos`) | Eyebrow "Lo más nuevo"; `h2` "Productos destacados" | — | Carrusel: **7 tarjetas** con badge de categoría y "Ver producto" al pasar el mouse | Ver 4.6 |
| 5 | Banner promo | Eyebrow "Por tiempo limitado"; `h2` "20% de descuento en toda la tienda"; "Envío gratis en compras desde $ 299.900. Ver política de envíos." | "Descubrir la colección" → `#productos`; "Ver política de envíos" → `/envios` | — | Sin fecha de fin (B-14) |
| 6 | Newsletter | Eyebrow "Ofertas y novedades"; `h2` "Sé la primera en enterarte"; "Dejá tu correo y recibí aviso apenas lancemos nuevas colecciones, promociones y ofertas — sin necesidad de crear una cuenta." | Campo `email` (placeholder "tu@email.com") + botón "Quiero enterarme" | — | El `form` **no trae `action` ni `method`**: el envío lo hace JS. Dónde se guardan los correos: `NOT_VERIFIED` |
| — | Footer (dentro de `<main>`) | Ver 4.3 | — | — | — |

Filas 1 a 6 y footer: [MEDIDO-03G] sobre `launch/evidence/current-site/home.html` (verificado contra el HTML crudo: orden de las 6 `<section>`, textos, destinos `#productos`, `/envios`, 8 + 7 tarjetas y 15 corazones).

**Sección 7, solo cliente (corregido en la verificación):** la sección "Recomendado para vos" que describe [DOC:theme/home-report.md:135] **no está en el HTML servido** (el texto "Recomendado" no aparece), pero **el payload sí trae el componente de cliente `RecommendedForYou`** con la lista `excludeSlugs` de los 15 productos ya mostrados en las dos vidrieras (8 + 7) [MEDIDO-03G] (`home.recommendedForYou`). El código lo pinta tras hidratar como carrusel de hasta 7 productos con `h2` "Recomendado para vos", elegidos por las categorías del historial de "vistos recientemente" guardado en `localStorage` [DOC:components/home/recommended-for-you.tsx]; con la lista vacía no pinta nada. Su render real y su posición exacta en la página: `NOT_VERIFIED`. La Dev la tiene como sección oculta y vacía [MEDIDO-03G dev-home.json]. (La versión anterior de este informe decía que no aparecía "ni en el payload".) Corazones (botón "Añadir a favoritos") en la Home: 15 (8 + 7). [MEDIDO-03G]

### 4.5 Medios de las 4 tarjetas de categoría

| Tarjeta | Texto | Media en el HTML | En el payload (`categories`) |
|---|---|---|---|
| Oasis Natural | "Tonos tierra y vegetación exuberante." | `<video>` **sin `src`**, poster `zjlcdrptowzxnmcz7ixf.jpg` | video `.mp4` `lago/categories/xxjjwoori52cmkbgu33n.mp4` |
| Aurora Viva | "Colores luminosos para los primeros rayos del día." | `<video>` sin `src`, poster `zdxbjacneyll6npdosdu.png` | video `.mp4` `gm4fm2tiwgc2vlu93s7a.mp4` |
| Espuma de Ola | "Texturas suaves y tonos marinos." | `<video>` sin `src`, poster local `/images/products/1 (1).webp` | video **`.mov`** `nnohfbsoqzgee20xooog.mov`, sin imagen de portada |
| Salidas de Baño | "Prendas ligeras para después del sol." | `<div role="img">` con `background-image` `gz9ken66as28i5hresne.png` y recorte (posición 65,99 % / 100 %, tamaño 125 % / 296 %) | sin video |

Los 3 `<video>` de categoría se renderizan sin `src`; los videos llegan por datos del payload. Que se reproduzcan tras hidratar: `NOT_VERIFIED`. [MEDIDO-03G]

**Los 14 medios del manifiesto (M01–M14) siguen presentes en el HTML o payload servidos hoy** (`mediaManifestCrossCheck`: 14/14): las fuentes descritas en [DOC:content/media/media-migration-manifest.csv] son las vigentes. M14 (guía de tallas) aparece en el payload de las fichas. [MEDIDO-03G]

### 4.6 Tarjetas de producto de la Home

| Carrusel | Productos (en orden) |
|---|---|
| "La belleza de sentirte tú" (8) | COSTA-ESMERALDA-AZUL, brisa-natural-beige, marea-natural, oasis-serena-azul, costa-esmeralda-negro, marea-natural-naranja, arena-dorada-beige, arena-dorada-negro |
| "Productos destacados" (7) | entero-golden-hour, bikini-shadow-azul-marino, raices-del-sol-beige-suave, alba-dorada-lila, aurora-total-azul-oscuro, enterizo-shadow-palm-azul-marino, bikini-palm-verde-oliva |

- El primer carrusel es exactamente `oasis-natural` (primeras 8) en su orden por defecto. [MEDIDO-03G] (`homeVsCollections`)
- Los 7 de "Productos destacados" = los productos con `featured: true` en el payload (10) **menos los 3 que ya están en el primer carrusel** (10 − 3 = 7, mismo conjunto). [MEDIDO-03G] Esa regla de "no repetir entre secciones" coincide con [DOC:theme/home-report.md:135].
- Cada tarjeta: 1 imagen, corazón, nombre (`h3`), precio actual + precio anterior tachado + pastilla "-20%". [MEDIDO-03G]

## 5. Colecciones (ítem 3)

Las 9 rutas devuelven **200**. Solo 3 tienen productos.

| Ruta | Productos | `robots` | Canonical | `<title>` | Meta description | En sitemap |
|---|---:|---|---|---|---|---|
| `/oasis-natural` | **10** | `index, follow` | propio | Oasis Natural \| Radaelli Swimwear | Trajes de baño inspirados en tonos tierra y vegetación exuberante. | sí |
| `/aurora-viva` | **12** | igual | propio | Aurora Viva \| Radaelli Swimwear | Colores luminosos y siluetas frescas para los primeros rayos del día. | sí |
| `/espuma-de-ola` | **7** | igual | propio | Espuma de Ola \| Radaelli Swimwear | Texturas suaves y tonos marinos, como la espuma sobre la arena. | sí |
| `/salidas-de-bano` | **0** | igual | propio | Salidas de Baño \| Radaelli Swimwear | Prendas ligeras para después del sol, entre la playa y la ciudad. | sí |
| `/accesorios` | 0 | igual | propio | Accesorios \| Radaelli Swimwear | Los detalles que definen el conjunto. | **sí** |
| `/hombre` | 0 | igual | propio | Hombre \| Radaelli Swimwear | Sastrería moderna y esenciales atemporales para hombre. | no |
| `/mujer` | 0 | igual | propio | Mujer \| Radaelli Swimwear | Siluetas fluidas y materiales nobles para mujer. | no |
| `/ninos` | 0 | igual | propio | Niños \| Radaelli Swimwear | Comodidad y estilo para los más pequeños. | no |
| `/calzado` | 0 | igual | propio | Calzado \| Radaelli Swimwear | Zapatillas y calzado de diseño atemporal. | no |

[MEDIDO-03G] `collections[]`. **10 + 12 + 7 = 29**: cada producto está en exactamente 1 colección (29/29) y el badge de cada tarjeta es el nombre de su colección. La cifra "N productos" del encabezado coincide con las tarjetas del HTML en las 9.

### 5.1 Estructura de una página de colección

Todas comparten la misma plantilla. [MEDIDO-03G]

| Parte | Contenido |
|---|---|
| Portada (`section`, alto 38vh, mínimo 260 px) | Eyebrow "Colección", `h1` con el nombre, descripción. Fondo: **imagen de Cloudinary** con recorte propio (`background-image` + posición + tamaño) en las 4 colecciones oficiales, incluida Salidas de Baño aunque tenga 0 productos; **degradado CSS sin imagen** en las 5 sin catálogo |
| Barra sticky (`sticky top-16`) | Miga "Inicio / <colección>", texto "N productos", botón "Filtros", 3 botones de columnas "2", "3", "4" (**el "3" está presionado por defecto**) |
| Filtros (aside; oculto bajo `md`) | Ver 5.2 |
| Grilla | `grid-cols-2` en base y `sm`, `md:grid-cols-3`; `gap-4 sm:gap-6` |
| Estado vacío | "No hay productos que coincidan con estos filtros." / "Probá quitando algún filtro para ver más resultados." |
| JSON-LD | Solo `Organization` y `WebSite` (sin `ItemList` ni `CollectionPage`) |

Imágenes de portada: Oasis `x95tyqydlvieasp7whfn.jpg`, Aurora `c9gz6yuipjnowjyp3amd.jpg`, Espuma `n9to8ksgrw1xmxlxm2ch.jpg`, Salidas `grhrfruybukvqgk6ngrc.jpg` (M10–M13). La captura Dev no tiene ninguna de las cuatro (B-19). [MEDIDO-03G]

### 5.2 Filtros y orden

| Grupo | Tipo | Opciones |
|---|---|---|
| Ordenar por | `select` | Novedades (elegida), Precio: menor a mayor, Precio: mayor a menor |
| Talla | botones | XS, S, M, L, XL, Única |
| Color | botones | Negro, Blanco, Beige, Camel, Gris, Azul Marino, Verde Oliva, Terracota |
| Precio | casillas | Menos de $50, $50 – $100, $100 – $200, Más de $200 |

Las mismas opciones aparecen en las 9 colecciones (también en las vacías). Cruce con los colores de las 29 fichas, por igualdad exacta sin distinguir mayúsculas: **5 de los 8 rótulos** tienen productos (Negro, Blanco, Beige, Verde Oliva, Terracota); **Camel, Gris y Azul Marino no tienen ninguno**; y **7 colores de producto no tienen rótulo**: AZUL, AZUL OSCURO, BEIGE SUAVE, CAFÉ CLARO, LILA, MOSTAZA y NARANJA. [MEDIDO-03G] Ese cruce se hizo sin distinguir mayúsculas, pero el filtro real sí las distingue: el botón manda el texto del rótulo y la consulta compara con igualdad exacta [DOC:components/catalog/catalog-filters.tsx; lib/catalog/catalog-actions.ts:95,104], y las fichas guardan el color en mayúsculas (salvo `Azul` y `Mostaza`), por eso `?color=Beige` da 0 y `?color=BEIGE` da 3 (B-18) (corregido en la verificación: antes decía que el valor que manda el botón era `NOT_VERIFIED`). El sondeo de la tarea de colecciones muestra que los filtros también se aplican por URL, desde el servidor: `?talla=S` → 10, `?precio=menos-50` → 0, `?precio=mas-200` → 10 en Oasis (B-02, B-18).

### 5.3 Orden por defecto de las tarjetas (HTML servido, "Novedades")

| Colección | Orden |
|---|---|
| Oasis Natural (10) | COSTA-ESMERALDA-AZUL, brisa-natural-beige, marea-natural, oasis-serena-azul, costa-esmeralda-negro, marea-natural-naranja, arena-dorada-beige, arena-dorada-negro, brisa-natural-naranja, oasis-serena-negro |
| Aurora Viva (12) | alba-dorada-cafe-claro, alba-dorada-beige-suave, alba-dorada-lila, raices-del-sol-azul-oscuro, raices-del-sol-beige-suave, sol-interno-cafe-claro, sol-interno-beige-suave, amanecer-dorado-terracota, amanecer-dorado-lila, aurora-total-azul-oscuro, aurora-total-terracota, camiseta-solar-waves-negro |
| Espuma de Ola (7) | entero-golden-hour, bikini-waves-terracota, bikini-waves-verde-oliva, bikini-shadow-azul-marino, bikini-palm-verde-oliva, enterizo-shadow-palm-azul-marino, bikini-foam |

Las tres listas coinciden con el HTML crudo, en el mismo orden (verificado). "Novedades" no coincide con el orden de `lastmod` del sitemap, ni ascendente ni descendente. [MEDIDO-03G] El criterio, según el código, es `createdAt` ascendente: el más antiguo primero [DOC:lib/catalog/catalog-actions.ts:116-122]; los valores de `created_at` no están en el repo (NOT_AVAILABLE), así que el orden no se puede reconstruir sin la base de datos. Que el código desplegado sea igual al del repo: [INFERIDO] (corregido en la verificación: antes decía que el criterio no estaba en ninguna fuente).

### 5.4 Tarjeta de colección

2 imágenes (principal y la de hover), badge con el nombre de la colección, botón "Añadir a favoritos", botón **"Vista rápida"** (el contenido que abre es de cliente: `NOT_VERIFIED`), nombre, precio actual, precio anterior tachado y "-20%". Las 29 tarjetas tienen corazón, "Vista rápida" y el bloque de precio completo. [MEDIDO-03G]

## 6. Productos (ítem 4)

### 6.1 Esqueleto de la ficha (igual en las 29)

| Parte | Contenido medido |
|---|---|
| `<title>` / meta | `NOMBRE \| Radaelli Swimwear`; `description` = la descripción completa con viñetas y saltos de línea (223 a 397 caracteres); `og:type` = `website` (no `product`); `og:image` = 1.ª foto; `index, follow`; canonical propio |
| JSON-LD | 4 bloques en 29/29: `Organization`, `WebSite`, `Product`, `BreadcrumbList`. `Product`: `name`, `description`, `image[]`, `sku`, `color`, `category`, `offers` (`price` = **precio con descuento**, `priceCurrency` COP, `availability` InStock). **Sin** `brand`, `aggregateRating`, precio original ni `priceValidUntil` |
| Navegación | Enlace "Volver a <colección>" y miga visible "Inicio / <colección> / <nombre>" (= `BreadcrumbList` en 29/29) |
| Galería | Imagen principal con visor a pantalla completa (`role="button"`), miniaturas "Ver imagen n de N" y botones "Previous product image" / "Next product image" (etiquetas en inglés). 3 imágenes en 22 fichas, 4 en 6, 5 en 1 |
| Bloque de compra | `h1`; precio actual; precio anterior tachado; pastilla "-20%"; botón de texto **"Agregar a favoritos"** (`aria-pressed`) |
| Estado | "Disponible" (29/29); "N vistas" (B-01); "SKU: …" |
| Opciones | "Color — <color>" y "Talla" con botones; en las 10 de **Oasis Natural** hay además un botón **"Guía de tallas"** (10/10 y solo ellas) |
| Compra | Botón "Añadir al carrito" |
| Acordeones (4, cerrados) | "Descripción" (texto propio de cada producto), "Cuidados de la prenda", "Envíos, devoluciones y garantía", "Métodos de pago" |
| Relacionados | "También te puede interesar": 4 tarjetas, **siempre de la misma colección** (116/116). Cuáles 4 salen es una muestra de una sola carga: el código puntúa candidatos por color, precio dentro de ±30 % y stock, y desempata al azar [DOC:lib/catalog/catalog-actions.ts, `listRelatedProductsAction`], así que pueden cambiar entre cargas |
| Solo cliente (no están en el HTML servido; agregado en la verificación) | "Vistos recientemente" (`RecentlyViewed`, `h2` propio, lee y escribe `localStorage`; sin historial no pinta nada [DOC:components/catalog/recently-viewed.tsx]) y "N personas viendo esto ahora" (`LiveViewers`, latido cada 20 s; no pinta nada hasta tener un conteo [DOC:components/product-detail/live-viewers.tsx]). Ambos están en el payload de las 29 fichas [MEDIDO-03G]; su render real: `NOT_VERIFIED` |

Todas las filas: [MEDIDO-03G], verificadas contra el HTML crudo de las 29 fichas (título, precios, etiqueta, tallas, número de imágenes, SKU, contador y botón de guía coinciden con la tabla 6.2 en 29/29).

El contenido de los acordeones no está en el DOM inicial (paneles vacíos); sale del payload RSC. Los tres acordeones que no son la descripción tienen **un único texto para las 29**: [MEDIDO-03G]

- **Cuidados:** "Lavar a mano con agua fría." / "No usar blanqueador." / "No retorcer." / "Secar a la sombra." / "Evitar el contacto con superficies ásperas."
- **Envíos, devoluciones y garantía:** "Envío gratis en compras desde $ 299.900. Por debajo de ese monto, el valor del envío se informa antes del despacho, según tu destino. Garantía de 12 meses por defectos de fabricación o calidad." + enlaces a `/envios`, `/devoluciones`, `/garantia`.
- **Métodos de pago:** "Paga de forma segura a través de Wompi con tarjetas de crédito y débito Visa, Mastercard y American Express, PSE, Nequi o Botón Bancolombia."

### 6.2 Las 29 fichas

| # | Ruta (slug) | Categoría | Precio actual | Precio anterior | Etiqueta | Tallas visibles | Imágenes | SKU | "N vistas" | Guía de tallas |
|---|---|---|---|---|---|---|---:|---|---:|---|
| 1 | `alba-dorada-beige-suave` | Aurora Viva | $ 167.920 | $ 209.900 | -20% | S, M, L, XL | 3 | LG-AUR-000002 | 24 | no |
| 2 | `alba-dorada-cafe-claro` | Aurora Viva | $ 167.920 | $ 209.900 | -20% | **S, M, L** | 5 | LG-AUR-000001 | 72 | no |
| 3 | `alba-dorada-lila` | Aurora Viva | $ 167.920 | $ 209.900 | -20% | S, M, L, XL | 4 | LG-AUR-000003 | 30 | no |
| 4 | `amanecer-dorado-lila` | Aurora Viva | $ 167.920 | $ 209.900 | -20% | S, M, L, XL | 4 | LG-HOM-000003 | 18 | no |
| 5 | `amanecer-dorado-terracota` | Aurora Viva | $ 167.920 | $ 209.900 | -20% | S, M, L, XL | 3 | LG-AUR-000006 | 18 | no |
| 6 | `arena-dorada-beige` | Oasis Natural | $ 183.920 | $ 229.900 | -20% | S, M, L | 3 | RSONBI012 | 30 | sí |
| 7 | `arena-dorada-negro` | Oasis Natural | $ 183.920 | $ 229.900 | -20% | S, M, L | 3 | RSONBI013 | 24 | sí |
| 8 | `aurora-total-azul-oscuro` | Aurora Viva | $ 183.920 | $ 229.900 | -20% | S, M, L, XL | 3 | LG-AUR-000007 | 18 | no |
| 9 | `aurora-total-terracota` | Aurora Viva | $ 183.920 | $ 229.900 | -20% | S, M, L, XL | 4 | LG-AUR-000008 | 18 | no |
| 10 | `bikini-foam` | Espuma de Ola | $ 159.920 | $ 199.900 | -20% | S, M, L | 3 | LG-ESP-000009 | 54 | no |
| 11 | `bikini-palm-verde-oliva` | Espuma de Ola | $ 159.920 | $ 199.900 | -20% | S, M, L | 3 | LG-ESP-000007 | 30 | no |
| 12 | `bikini-shadow-azul-marino` | Espuma de Ola | $ 159.920 | $ 199.900 | -20% | S, M, L | 3 | LG-ESP-000006 | 24 | no |
| 13 | `bikini-waves-terracota` | Espuma de Ola | $ 159.920 | $ 199.900 | -20% | S, M, L | 3 | LG-ESP-000004 | 18 | no |
| 14 | `bikini-waves-verde-oliva` | Espuma de Ola | $ 159.920 | $ 199.900 | -20% | S, M, L | 3 | LG-ESP-000005 | 18 | no |
| 15 | `brisa-natural-beige` | Oasis Natural | $ 199.920 | $ 249.900 | -20% | S, M, L | 3 | RSONEN022 | 72 | sí |
| 16 | `brisa-natural-naranja` | Oasis Natural | $ 199.920 | $ 249.900 | -20% | S, M, L | 3 | RSONEN024 | 18 | sí |
| 17 | `camiseta-solar-waves-negro` | Aurora Viva | $ 159.920 | $ 199.900 | -20% | S, M, "L y XL" | 3 | LG-AUR-000009 | 12 | no |
| 18 | `COSTA-ESMERALDA-AZUL` | Oasis Natural | $ 183.920 | $ 229.900 | -20% | S, M, L | 3 | RSONBI021 | 162 | sí |
| 19 | `costa-esmeralda-negro` | Oasis Natural | $ 183.920 | $ 229.900 | -20% | S, M, L | 3 | RSONBI023 | 48 | sí |
| 20 | `enterizo-shadow-palm-azul-marino` | Espuma de Ola | $ 183.920 | $ 229.900 | -20% | S, M, L | 3 | LG-ESP-000008 | 18 | no |
| 21 | `entero-golden-hour` | Espuma de Ola | $ 183.920 | $ 229.900 | -20% | S, M, L | 3 | LG-ESP-000003 | 84 | no |
| 22 | `marea-natural` | Oasis Natural | $ 183.920 | $ 229.900 | -20% | S, M, L | 3 | RSONBI032 | 72 | sí |
| 23 | `marea-natural-naranja` | Oasis Natural | $ 183.920 | $ 229.900 | -20% | S, M, L | 3 | RSONBI034 | 42 | sí |
| 24 | `oasis-serena-azul` | Oasis Natural | $ 199.920 | $ 249.900 | -20% | S, M, L | 3 | RSONEN011 | 36 | sí |
| 25 | `oasis-serena-negro` | Oasis Natural | $ 199.920 | $ 249.900 | -20% | S, M, L | 3 | RSONEN013 | 30 | sí |
| 26 | `raices-del-sol-azul-oscuro` | Aurora Viva | $ 167.920 | $ 209.900 | -20% | S, M, L, XL | 4 | LG-AUR-000004 | 12 | no |
| 27 | `raices-del-sol-beige-suave` | Aurora Viva | $ 167.920 | $ 209.900 | -20% | S, M, L, XL | 3 | LG-HOM-000001 | 36 | no |
| 28 | `sol-interno-beige-suave` | Aurora Viva | $ 167.920 | $ 209.900 | -20% | S, M, L, XL | 4 | LG-AUR-000005 | 18 | no |
| 29 | `sol-interno-cafe-claro` | Aurora Viva | $ 167.920 | $ 209.900 | -20% | S, M, L, XL | 4 | LG-HOM-000002 | 12 | no |

[MEDIDO-03G] `products[]`. Resumen: tallas S, M, L en 18 fichas; S, M, L, XL en 10; S, M, "L y XL" en 1 (`camiseta-solar-waves-negro`). Total de tallas ofrecidas: **97** (Dev Store: 98; ver B-04).

Observaciones sobre nombres y SKU (heredadas: título, SKU base, color (sin distinguir mayúsculas), categoría y precio coinciden con la Dev Store en 29/29, `productsVsDev`; en la Dev el SKU va por variante con sufijo de talla, por ejemplo `LG-AUR-000001-S`, mientras el sitio actual muestra el SKU base): [MEDIDO-03G]

- Dos fichas llevan "azul-marino" en la URL y "NEGRO" en el título y el color: `bikini-shadow-azul-marino` (BIKINI SHADOW NEGRO) y `enterizo-shadow-palm-azul-marino` (ENTERIZO SHADOW PALM NEGRO). `marea-natural` se titula "MAREA NATURAL BEIGE".
- Tres fichas de Aurora Viva llevan el prefijo de SKU `LG-HOM-` (`amanecer-dorado-lila`, `raices-del-sol-beige-suave`, `sol-interno-cafe-claro`); las de Oasis Natural usan `RSON…`. El prefijo `LG-` coincide con la ruta `/lago/` de Cloudinary y con "Equipo LAGO" del blog: [INFERIDO] restos de un nombre anterior de la marca.

### 6.3 Stock y datos internos en el payload

Cada ficha entrega al cliente un objeto `product` con: `id`, `slug`, `name`, `category`, `price`, `priceValue`, `originalPriceValue`, `activeDiscountPercent`, `tone`, `sizes`, `color`, `description`, `images`, `featured`, `sku`, `totalStock`, `sizeStock`, `realViews`, `promotionalViews`, `showViews`. Stock por talla: **25** en 27 fichas; `COSTA-ESMERALDA-AZUL` S=24, M=23, L=25 (72) y `bikini-foam` S=24, M=24, L=25 (73). `showViews` = true en 29/29. Las tallas del payload coinciden con las del DOM en 29/29. [MEDIDO-03G] (B-01, B-13)

## 7. Precios y ofertas (ítem 11)

| Precio anterior | Precio actual | Fichas | Comprobación |
|---:|---:|---:|---|
| $ 199.900 | $ 159.920 | 6 | actual = 80 % del anterior |
| $ 209.900 | $ 167.920 | 9 | igual |
| $ 229.900 | $ 183.920 | 10 | igual |
| $ 249.900 | $ 199.920 | 4 | igual |

- **Descuento visible:** en cada tarjeta y en cada ficha se ven tres cosas: el precio actual, el anterior tachado y la pastilla "-20%". Etiqueta `-20%` en 29/29. [MEDIDO-03G]
- **Consistencia:** el precio y el anterior coinciden entre tarjeta de colección, ficha, JSON-LD (`offers.price` = precio con descuento) y payload (`priceValue`, `originalPriceValue`) en 29/29; `price = round(anterior × 0,8)` en 29/29. [MEDIDO-03G]
- **Origen del descuento:** `activeDiscountPercent` = 20 en 29/29 fichas y `discount_percent` = 20 en `products-master.csv`, presentado como oferta de toda la tienda. [MEDIDO-03G] / [DOC:catalog/products-master.csv] El código admite tres niveles (producto, categoría y sitio) con precedencia, no acumulables [DOC:lib/pricing/discount.ts]; el anuncio superior lee el nivel "sitio" de la configuración [DOC:components/layout/discount-announcement-bar.tsx]. Cuál nivel origina el 20 % visible hoy: `NOT_VERIFIED` (ver B-14) (corregido en la verificación: antes decía solo "dato por producto").
- **Textos de la oferta:** anuncio "20% de descuento en toda la tienda"; banner "Por tiempo limitado" + el mismo titular; no hay fecha de fin ni el HTML menciona vigencia. [MEDIDO-03G] Fecha de fin: **NOT_AVAILABLE** (B-14).
- **Formato de precio:** `$ 183.920` (símbolo, espacio, puntos de miles, sin decimales). En JSON-LD `183920.00`. [MEDIDO-03G]
- **Envío gratis desde $ 299.900:** Home (banner), 29 fichas (acordeón) y `/envios` (más la meta description "Envío gratuito a nivel nacional en compras desde cierto monto…"). [MEDIDO-03G] (B-07)

## 8. Búsqueda (ítem 5)

| Ruta | Qué es | Evidencia |
|---|---|---|
| `/buscar` | **La búsqueda real.** 200, `noindex, nofollow`, `Disallow` en `robots.txt`. Título "Buscar \| Radaelli Swimwear". Miga "Inicio / Buscar", eyebrow "Búsqueda", `h1` "Buscar productos", "Escribí algo para empezar a buscar.", "Podés buscar por nombre de producto, categoría o color." El HTML de `/buscar` (sin `q`) no trae resultados; qué devuelve `/buscar?q=` no se pidió: `NOT_VERIFIED` | [MEDIDO-03G] |
| Formulario del header | `GET /buscar`, campo `q`; `SearchAction` de JSON-LD → `/buscar?q={search_term_string}` | [MEDIDO-03G] |
| `/search` | **Resto de la plantilla Vercel Commerce.** 200, en inglés, `index, follow`, sin `h1`; menú "Collections / All", "Sort by" con "Relevance", "Trending", "Latest arrivals", "Price: Low to high", "Price: High to low" (enlaces `?sort=`); resultados en estado de error (`<!--$!-->`, digest) con 12 `<li>` vacíos. No está en `Disallow` ni en el sitemap | [MEDIDO-03G]; que sea resto de la plantilla: [INFERIDO], coincide con [DOC:seo/03E-redirect-plan.md §4.2] |

(B-11.) El destino en Shopify de `/buscar` es `/search` [DOC:seo/03E-redirect-plan.md fila 47].

## 9. Carrito y checkout (ítem 6)

| Ruta | Resultado | Notas |
|---|---|---|
| `/carrito` | **404** | La página 404 sale del GET puntual (sección 12.4) |
| `/cart` | **404** | Idem |
| Carrito (cajón) | Botón "Carrito" en el header (sin `href`), con `CartProvider` en el payload | El contenido del cajón es de cliente: **NOT_VERIFIED** |
| `/checkout` | **200**, `noindex, nofollow`, `Disallow` en robots. Título "Checkout \| Radaelli Swimwear"; `h1` "Finalizar compra"; único texto "Cargando tu carrito..." | Pasos, campos y resumen del checkout: **NOT_VERIFIED** (solo cliente) |

Estados y textos de la tabla: [MEDIDO-03G] (`/cart` y `/checkout` del rastreo; `/carrito` del GET puntual).

Lo que sí consta en el HTML servido: el proveedor de pago es **Wompi** (acordeón "Métodos de pago" en las 29 fichas; párrafos de `/terminos` y `/privacidad`) con tarjetas Visa/Mastercard/American Express, PSE, Nequi y Botón Bancolombia. [MEDIDO-03G] La casilla de aceptación de términos y el aviso "Envío estándar gratis / Envío por coordinar" del checkout están descritos en [DOC:theme/03D-legal-policies-inventory.md:104,107] y no se pueden ver aquí (B-15).

## 10. Cuenta y favoritos (ítem 7)

| Ruta | Resultado | Contenido medido |
|---|---|---|
| `/cuenta` | 200, `noindex, nofollow` | Título "Mi cuenta"; solo "Cargando..." |
| `/cuenta/iniciar-sesion` | 200 (GET puntual), `noindex, nofollow` | `h1` "Iniciar sesión"; "Ingresá con tu email y contraseña."; campos Email y Contraseña; enlaces "¿Olvidaste tu contraseña?" → `/cuenta/recuperar-contrasena` y "Registrate" → `/cuenta/registro` |
| `/cuenta/favoritos` | 200, `noindex, nofollow` | Título "Favoritos"; solo "Cargando..." |
| `/favoritos` | 200, `noindex, nofollow`, `Disallow` | Miga "Inicio / Favoritos", "Tu selección", `h1` "Favoritos", "0 productos guardados", "Tu lista de favoritos está vacía.", "Guardá las prendas que más te gusten tocando el corazón en cualquier producto.", enlace "Explorar colección" → `/#categorias` |
| `/login`, `/registro`, `/wishlist` | 404 | — |

Cuenta con **email y contraseña**, recuperación y registro propios. El header enlaza a `/cuenta/iniciar-sesion` y a `/favoritos`. El botón de favoritos ("Añadir a favoritos" en tarjetas, "Agregar a favoritos" en la ficha) está en las 29 fichas y 15 veces en la Home. La lista de invitada y la de cuenta se resuelven en cliente: `NOT_VERIFIED`. [MEDIDO-03G]

## 11. Páginas legales y de ayuda (ítem 8)

| Ruta | `<title>` | `h1` | Meta description | Secciones (`h2`) | Palabras (vivo / manifiesto) | Texto = `content/legal` |
|---|---|---|---|---|---:|---|
| `/envios` | Política de envíos | Política de envíos | "Envío gratuito a nivel nacional en compras desde cierto monto — para el resto, el valor se informa antes del despacho según el destino." | Envíos nacionales; Transportadora y tiempos de entrega; Coordinación del envío en compras inferiores a $ 299.900; Preparación y tiempos de entrega; Dirección de entrega; Seguimiento del pedido; Novedades de transporte; Reenvíos; Garantías y derecho de retracto; Condiciones generales | 430 / 430 | **sí** |
| `/devoluciones` | Política de devoluciones | Política de devoluciones | "Condiciones de devolución y cambio por defecto de fábrica de Radaelli Swimwear." | Cuándo aplica una devolución o cambio; Cuándo NO aplica; Costo de envío de la devolución; Proceso | 322 / 322 | **sí** |
| `/garantia` | Política de garantía | Política de garantía | "Garantía de 12 meses por defectos de fabricación o calidad de Radaelli Swimwear." | Cobertura; Qué no cubre; Cómo hacer efectiva la garantía | 175 / 175 | **sí** |
| `/privacidad` | Política de privacidad | Política de privacidad | "Cómo Radaelli Swimwear recopila, usa y protege tus datos personales al comprar en la tienda." | Qué datos recopilamos y para qué; Cookies; Con quién compartimos datos; Cuánto tiempo conservamos los datos; Tus derechos; Actualizaciones | 231 / 231 | **sí** |
| `/terminos` | Términos y condiciones | Términos y condiciones | "Condiciones generales de compra en Radaelli Swimwear: identificación de la tienda, proceso de pago, y enlaces a nuestras políticas de envíos, devoluciones y garantía." | Quiénes somos; Productos y precios; Pago; Envíos, cambios y garantía; Actualizaciones | 179 / 179 | **sí** |
| `/cookies` | Política de cookies | Política de cookies | "Qué cookies usa Radaelli Swimwear, para qué sirven y cómo podés gestionar tus preferencias." | Qué son las cookies; Cookies esenciales; Cookies analíticas; Cookies de marketing y publicidad; Cómo cambiar tus preferencias; Más información | 197 / 197 | **sí** |

[MEDIDO-03G] `legal[]`. Los seis: 200, `index, follow`, canonical propio, en el sitemap, `<title>` con sufijo " | Radaelli Swimwear", y **texto vivo idéntico al de `content/legal/*.html`** (el script rehace el mismo recorte que [DOC:scripts/extract-legal-verbatim.cjs]: sin la línea de actualización ni el botón de cookies).

- **Línea "Última actualización":** en las 6 dice "29 de septiembre de 2026" = fecha del día del rastreo; el manifiesto guarda la misma cadena como línea removida. Que se recalcule en cada carga es lo que afirma [DOC:scripts/extract-legal-verbatim.cjs]; con un solo día de captura no se puede comprobar: `NOT_VERIFIED`.
- **Botón "Cambiar mis preferencias de cookies"** en `/cookies` (el único botón dentro de un texto legal; 1 de 6), igual al `removed_buttons` del manifiesto. Depende del sistema propio de consentimiento [DOC:theme/03D-legal-policies-inventory.md:103].
- **Promesas dentro de los textos:** `/envios` fija el envío gratis desde $ 299.900 "dentro de Colombia"; `/garantia` (y su meta) y el acordeón de la ficha dicen 12 meses; `/terminos` y `/privacidad` nombran a Wompi. [MEDIDO-03G]
- **Rutas de ayuda que no existen** (404): `/contacto`, `/ayuda`, `/faq`, `/nosotros` y las 5 variantes `/politica-de-*` y `/terminos-y-condiciones`. [MEDIDO-03G]

## 12. `robots.txt`, sitemap, redirecciones y 404 (ítems 9 y 10)

### 12.1 `robots.txt` (228 bytes)

```
User-Agent: *
Disallow: /admin
Disallow: /cuenta
Disallow: /checkout
Disallow: /favoritos
Disallow: /api
Disallow: /interno
Disallow: /buscar

Host: https://radaelliswimwear.com
Sitemap: https://radaelliswimwear.com/sitemap.xml
```

Un solo grupo, 7 `Disallow`, ningún `Allow`, ninguna regla por agente; hay una línea en blanco antes de `Host` (corregido en la verificación: el bloque de arriba no la traía). `/search` **no** está bloqueado. Las rutas bloqueadas que el rastreo encontró vivas: `/cuenta`, `/cuenta/favoritos`, `/checkout`, `/favoritos`, `/buscar` (todas con `noindex, nofollow`). [MEDIDO-03G] El plan de redirects afirma que `/admin` "no se lista en robots" [DOC:seo/03E-redirect-plan.md §4.2]; el `robots.txt` vivo y `app/robots.ts` sí lo listan (B-20).

### 12.2 `sitemap.xml`

**45 URLs**, sin extensiones de imagen ni `hreflang`. [MEDIDO-03G]

| Tipo | URLs | `changefreq` / `priority` | Detalle |
|---|---:|---|---|
| Home | 1 | daily / 1 | `https://radaelliswimwear.com` |
| Colecciones | 5 | daily / 0,8 | `/accesorios`, `/oasis-natural`, `/aurora-viva`, `/espuma-de-ola`, `/salidas-de-bano` |
| Blog | 4 | weekly 0,6 (índice); monthly 0,5 (posts) | `/blog` + 3 posts (`lastmod` 2026-07-15) |
| Legales | 6 | monthly / 0,3 (envíos, devoluciones, garantía) y 0,2 (términos, privacidad, cookies) | Sin `lastmod` |
| Fichas | 29 | weekly / 0,7 | `lastmod` de 2026-09-14 a 2026-09-27; incluye `COSTA-ESMERALDA-AZUL` en mayúsculas |

Cruces: las 29 fichas rastreadas están en el sitemap y las 45 URLs responden 200. **Páginas 200 indexables que no están en el sitemap:** `/hombre`, `/mujer`, `/ninos`, `/calzado` y `/search` (B-10, B-11). **En el sitemap sin productos:** `/accesorios` y `/salidas-de-bano`. [MEDIDO-03G] `sitemap.summary`

### 12.3 Redirecciones públicas

- **Ninguna de las 70 URLs del rastreo devolvió 3xx** (el rastreo no seguía redirecciones). [MEDIDO-03G]
- **`/oasis-natural/` → 308 → `/oasis-natural`** (barra final). [MEDIDO-03G] GET puntual
- **Mayúsculas:** `/producto/COSTA-ESMERALDA-AZUL` = 200; `/producto/costa-esmeralda-azul` = **404**. Confirma medido lo que [DOC:seo/03E-redirect-plan.md §5.1] deducía del código. [MEDIDO-03G]
- **http→https, `www`→apex, `/producto/<slug>?talla=` y `/buscar?q=`:** no se probaron: `NOT_VERIFIED`. (Las consultas de colección con `?talla=`, `?color=`, `?precio=` y `?orden=` las probó la tarea de colecciones y responden 200.)
- Las 47 redirecciones que se importarán a Shopify son de [DOC:seo/shopify-redirects-import.csv]; el sitio actual no las tiene.

### 12.4 Página 404

- **Estado 404** con `<title>` "Página no encontrada \| Radaelli Swimwear"; el `<html>` es `id="__next_error__"` sin `lang`; `robots`: `noindex` en el `<head>` y otra etiqueta `noindex, follow` en el cuerpo; canonical → la Home. [MEDIDO-03G]
- **El HTML no trae cabecera, footer ni texto visible**; el texto sale del payload y se pinta en cliente: "Error 404" / "No encontramos esta página" / "El link puede estar roto o la página ya no existe. Volvé al inicio o explorá nuestra colección." / botón "Ir al inicio". [MEDIDO-03G] Lo que ve la clienta tras ejecutar JS: `NOT_VERIFIED`.
- **16 de las 70 URLs rastreadas dan 404** (sección 3).

### 12.5 Meta `robots` y canonical por tipo de página

| Tipo de página | `robots` | Canonical | `og:title` / `twitter:title` | `og:image` |
|---|---|---|---|---|
| Home | `index, follow` | La propia URL (sin barra final) | propio / propio | Generada (`/opengraph-image?…`) |
| 9 colecciones | `index, follow` | La propia URL | propio / genérico ("Radaelli Swimwear") | Ninguna |
| 29 fichas | `index, follow` | La propia URL | propio / propio | La 1.ª foto del producto (Cloudinary) |
| 6 legales | `index, follow` | La propia URL | genérico / genérico | Generada |
| `/blog` (índice) | `index, follow` | La propia URL | propio / genérico | Ninguna |
| 3 posts del blog (sondeo) | `index, follow` | La propia URL | propio / propio (título del post) | Foto de `images.unsplash.com`; `og:type` = `article` (corregido en la verificación: estaba como "no medido") |
| `/buscar`, `/checkout`, `/cuenta`, `/cuenta/favoritos`, `/cuenta/iniciar-sesion`, `/favoritos` | `noindex, nofollow` | **La Home** (heredado del layout) | genérico / genérico | Generada |
| `/search` | **`index, follow`** | **La Home** | genérico / genérico | Generada |
| Página 404 | `noindex` y `noindex, follow` | **La Home** | genérico / genérico | Generada |

[MEDIDO-03G] `headByPage`, `headByProbe`. La URL `/opengraph-image` no se pidió (`NOT_VERIFIED`, sección 17). `og:site_name` aparece en la Home, los legales, búsqueda, checkout, cuenta y favoritos; no en colecciones, blog ni fichas. (B-12)

### 12.6 Blog

`/blog` no estaba en la lista pedida, pero se sirve, está en el sitemap y no se migra (B-09). [MEDIDO-03G]

- **Índice `/blog`:** 200, `index, follow`, título "Blog | Radaelli Swimwear", `h1` "Blog", descripción "Historias, guías de estilo y novedades de Radaelli Swimwear.", 3 tarjetas con fecha, título, extracto e imagen de `images.unsplash.com`.
- **Los 3 posts** (todos 200 en el GET puntual, canonical propio, `index, follow`, JSON-LD `Article`):

| Ruta | Fecha visible | Título | Extracto | Firma |
|---|---|---|---|---|
| `/blog/novedades-temporada` | 15 de julio de 2026 | Lo nuevo de la temporada | "Un vistazo a las piezas que se suman a la colección este mes." | Equipo LAGO |
| `/blog/materiales-nobles-por-que-importan` | 15 de julio de 2026 | Materiales nobles: por qué importan | "Lana, lino y cuero curtido a mano — qué hace que una prenda dure años." | Equipo LAGO |
| `/blog/guia-de-capas-para-el-invierno` | 15 de julio de 2026 | Guía de capas para el invierno | "Cómo combinar abrigo, jersey y camisa sin perder silueta ni movilidad." | Laura Gómez |

Cada post tiene entre 272 y 380 caracteres de texto visible en `<main>`. El de novedades habla de "Sastrería en tonos neutros. Accesorios en cuero y acero."; el de materiales, de lana, lino y cuero, y cierra con "LAGO elige proveedores que priorizan estos tres materiales."; el de capas, de abrigo y jersey. El texto visible de ninguno menciona trajes de baño (solo el `publisher` del JSON-LD nombra "Radaelli Swimwear"). [MEDIDO-03G] (`blog.postsDetail`; texto completo en `launch/evidence/current-site-probe/`)

## 13. CTA y copy clave (ítem 12)

| Pieza | Texto | Dónde | Destino |
|---|---|---|---|
| Titular | "Diseños que acompañan tu belleza natural con fuerza, libertad y estilo." | Home `h1` | — |
| Subtítulo | "Swimwear pensado para mujeres auténticas, seguras y poderosas." | Home hero | — |
| CTA hero | "Compra de forma sostenible" | Home hero | `#productos` |
| CTA categorías | "Explorar →" (visible al pasar el mouse) | 4 tarjetas | Colección |
| CTA banner | "Descubrir la colección" | Home banner | `#productos` |
| Promesa | "20% de descuento en toda la tienda" / "Por tiempo limitado" | Anuncio (52 páginas), banner | — |
| Promesa | "Envío gratis en compras desde $ 299.900" | Home, 29 fichas, `/envios` | `/envios` |
| CTA newsletter | "Quiero enterarme" | Home | JS (destino `NOT_VERIFIED`) |
| CTA tarjeta | "Ver producto" (hover, solo en "Productos destacados") | Home | Ficha |
| CTA tarjeta | "Vista rápida" | 29 tarjetas de colección | Cliente |
| CTA ficha | "Añadir al carrito"; "Agregar a favoritos"; "Guía de tallas" (Oasis) | Fichas | Cliente |
| CTA cookies | "Aceptar todas" / "Rechazar no esenciales" / "Configurar" | 52 páginas | Cliente |
| Vacíos | "No hay productos que coincidan con estos filtros."; "Tu lista de favoritos está vacía."; "Escribí algo para empezar a buscar." | Colección, favoritos, búsqueda | — |
| Acceso | "Iniciar sesión", "Registrate", "¿Olvidaste tu contraseña?" | `/cuenta/iniciar-sesion` | — |

**Registro (B-16):**

- **Voseo:** Home ("Dejá", "recibí"); las 6 colecciones vacías ("Probá quitando algún filtro…"); `/buscar` ("Buscá", "Escribí", "Podés"); `/favoritos` ("Guardá"); `/cookies` ("Podés", "navegás", "tenés", "consultá"); `/privacidad` y `/terminos` ("consultá", "podés coordinar"); `/cuenta/iniciar-sesion` ("Ingresá", "¿No tenés cuenta?", "Registrate"); 404 ("Volvé", "explorá").
- **Tuteo:** los 6 legales ("¿Tienes dudas?", "Contáctanos", "aceptas").
- `/cookies`, `/privacidad` y `/terminos` mezclan ambos en el mismo texto.
- Es una observación de coherencia; no se propone cambio. [MEDIDO-03G] `copy`

Nota sobre el `<title>` de la Home: "Trajes de baño de diseño en Colombia" no lleva el nombre de la marca; las demás páginas usan el sufijo " | Radaelli Swimwear". [MEDIDO-03G]

## 14. Responsive: lo que se deduce del HTML/CSS servido (ítem 13)

**Límite:** solo se leen `meta viewport` y nombres de clases del HTML. Los 2 archivos `.css` por página **no se descargaron**; no hay medición visual, ni ancho de columna en px, ni capturas. Los anchos de los puntos de quiebre son los de Tailwind por defecto **[INFERIDO]** (`sm` 640, `md` 768, `lg` 1024, `xl` 1280); el archivo de configuración no está en la evidencia.

| Aspecto | Lo medido | Etiqueta |
|---|---|---|
| Meta viewport | `width=device-width, initial-scale=1` en las 52 páginas (sin `maximum-scale` ni `user-scalable`) | [MEDIDO-03G] |
| Prefijos de quiebre en clases | `sm:` 152, `md:` 199, `lg:` 1130, `xl:` 260, `2xl:` 0 (todo el HTML) | [MEDIDO-03G] |
| Cabecera bajo `lg` (menos de 1024 px) | Se ven: botón de menú (`lg:hidden`), logo y carrito. Ocultos (`hidden`) hasta `lg`: menú de 5 enlaces, búsqueda, favoritos y cuenta. Ocultos hasta `xl`: selector de moneda y 4 redes | [MEDIDO-03G] clases; contenido del panel móvil `NOT_VERIFIED` |
| Hero | Proporción 4/5 → 3/4 (`sm`) → 16/10 (`md`) → libre con `min-h-[90vh]` (`lg`) | [MEDIDO-03G] |
| Categorías (Home) | `grid-cols-1` en todos los anchos; tarjetas 16/9 | [MEDIDO-03G] |
| Carruseles (Home) | Ancho de tarjeta 85 % (base) → 62 % (`sm`) → 42 % (`lg`); `overflow-x-auto` con `snap-x` | [MEDIDO-03G] |
| Colección | Filtros en `aside` oculto bajo `md` (`hidden … md:block md:w-56`); grilla `grid-cols-2` en base y `sm`, `md:grid-cols-3`; barra `sticky top-16`; atributo `sizes` de la imagen de tarjeta `(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw` | [MEDIDO-03G]; cómo cambia la grilla al elegir 2, 3 o 4: `NOT_VERIFIED` (cliente) |
| Ficha | Columna de compra `basis-full` → `lg:basis-2/6`; imagen principal con `sizes` `(min-width: 1024px) 66vw, 100vw` y altos máximos 550 px / 640 px (`lg`) | [MEDIDO-03G] |
| Footer | 1 columna en base; `md:grid-cols-[2fr_1fr_1fr_1fr]` (4 columnas desde `md`) | [MEDIDO-03G] |
| Banner de cookies | `fixed inset-x-4 bottom-4 max-w-2xl` en todos los anchos | [MEDIDO-03G] |
| Variantes `dark:` y `motion-reduce:` | 854 y 4 usos en clases. Si el modo oscuro está activo depende del CSS: `NOT_VERIFIED` | [MEDIDO-03G] / `NOT_VERIFIED` |

## 15. Qué existe hoy y a dónde va en Shopify

Tabla resumida. La tabla completa ruta por ruta es `launch/03G-route-parity.csv` (**NOT_AVAILABLE al cierre**); aquí solo se referencia. Las columnas de destino salen de [DOC:seo/03E-redirect-plan.md] y de `launch/evidence/dev-*.json` (captura RC1.7).

| Hoy en el sitio actual | Destino en Shopify | Estado en la captura Dev | Fuente |
|---|---|---|---|
| `/` (Home, 6 secciones en el HTML + "Recomendado para vos" solo cliente) | `/` (misma ruta) | 200; secciones equivalentes, la de recomendados oculta y vacía; diferencias en B-05 y B-06 | [DOC:seo/03E-redirect-plan.md §4.1 #1]; `dev-home.json` |
| `/oasis-natural`, `/aurora-viva`, `/espuma-de-ola`, `/salidas-de-bano` | `/collections/<mismo-nombre>` (redirección 301) | 200; 10 / 12 / 7 / 0 productos, igual conjunto | [DOC:seo/03E-redirect-plan.md §4.1 #2–5]; `dev-collections.json` |
| `/accesorios`, `/hombre`, `/mujer`, `/ninos`, `/calzado` | **Sin destino: 404** | No existen | [DOC:seo/03E-redirect-plan.md §4.1 #6–10] |
| `/producto/<slug>` (29) | `/products/<handle>` (redirección 301; `COSTA-ESMERALDA-AZUL` → `costa-esmeralda-azul`) | 29 × 200 | [DOC:seo/03E-redirect-plan.md §4.1 #11–39]; `launch/03G-product-parity.md` |
| `/buscar` (noindex) | `/search` (redirección) | 200, noindex | [DOC:seo/03E-redirect-plan.md #47]; `dev-routes.json` |
| `/search` (resto de plantilla) | `/search` de Shopify (la sirve la plataforma) | 200, noindex | [DOC:seo/03E-redirect-plan.md §4.2] |
| `/favoritos`, `/cuenta/favoritos` | `/pages/favoritos` (redirección **condicional** a asignar `page.wishlist` al publicar) | 200 con plantilla genérica; app de favoritos no instalada (`/apps/wishlist` 404) | [DOC:seo/03E-redirect-plan.md §4.1]; `dev-routes.json` |
| `/cuenta`, `/cuenta/pedidos`, `/cuenta/perfil`, `/cuenta/direcciones` | `/account` | Salta al dominio de cuentas de clientes | [DOC:seo/03E-redirect-plan.md §4.2] |
| `/cuenta/iniciar-sesion`, `/cuenta/recuperar-contrasena`, `/cuenta/restablecer-contrasena`, `/cuenta/verificar-email` | `/account/login` (New Customer Accounts, código en vez de contraseña) | Ídem | [DOC:seo/03E-redirect-plan.md §4.2] |
| `/cuenta/registro` | `/account/register` | Ídem | [DOC:seo/03E-redirect-plan.md §4.2] |
| Carrito (cajón, sin ruta) y `/carrito`, `/cart` (404 hoy) | Cajón del theme + `/cart` (página) | `/cart` 200 | `dev-routes.json`; `dev-home.json` |
| `/checkout` (shell "Cargando...") + Wompi | Checkout nativo de Shopify (`/checkout` normalizado) | Redirige al checkout; mercado principal US (bloqueo A1) | [DOC:seo/03E-redirect-plan.md §4.2]; `dev-routes.json` |
| `/devoluciones` | `/policies/refund-policy` (redirección) | 200; bloqueada para crawlers por la regla `/policies/` por defecto (esperado, sin verificar) | [DOC:seo/03E-redirect-plan.md §4.1 #42, §5.5] |
| `/garantia` | `/pages/garantia` (redirección) | 200 | [DOC:seo/03E-redirect-plan.md §4.1 #43] |
| `/envios`, `/terminos`, `/privacidad`, `/cookies` | **Pendientes (acción B2 de la dueña)** | 404 en `/pages/*`; `/policies/privacy-policy` es la autogenerada de Shopify con otro texto | [DOC:seo/03E-redirect-plan.md §4.3]; `dev-routes.json` (B-08) |
| `/blog` y 3 posts | **No migra** (404) salvo decisión de la dueña | `/blogs/news` por defecto en inglés | [DOC:seo/03E-redirect-plan.md §4.1 #40, §5.5] (B-09) |
| `robots.txt` (228 bytes), `sitemap.xml` (45 URLs) | Los genera Shopify | robots 3.642 bytes; `sitemap.xml` con sitemaps hijos | [DOC:seo/03E-redirect-plan.md §4.2]; [DOC:seo/03F-seo-final-validation.md:17]; `dev-routes.json` |
| Banner de cookies propio (3 botones) | Consentimiento de la plataforma | — | [DOC:theme/03D-legal-policies-inventory.md:103] |
| Newsletter de la Home (JS propio) | Formulario nativo `customer` con la etiqueta `newsletter` ("Suscribirme") | En el theme | [DOC:theme/home-report.md:49]; `dev-home.json` |
| Filtros Talla / Color / Precio (URL + cliente) | Filtros nativos de Search & Discovery (pendientes de configurar) | Dev: solo Ordenar + Precio | [DOC:theme/03E-search-discovery-prep.md]; `dev-collections.json` (B-03) |
| Selector de moneda COP/USD e iconos de redes en el header | No existen en `header.liquid` (las redes sí están en el footer) | — | Lectura de `theme-src/sections/header.liquid` y `header-group.json` |

## 16. Lo que no se migra a propósito

Solo lo que un documento del repo dice explícitamente. Cada línea lleva su fuente.

| Del sitio actual | Decisión | Fuente |
|---|---|---|
| `/accesorios`, `/hombre`, `/mujer`, `/ninos`, `/calzado` | "intentionally not migrated"; 404 (`/accesorios` a la espera de la dueña). El CSV de paridad 03C los deja `REQUIRES_DECISION` con tres opciones al lanzar (301 a `/`, 301 a una colección o 404); el plan 03E, posterior, adopta el 404 | [DOC:seo/03E-redirect-plan.md §4.1 #6–10]; [DOC:catalog/shopify-url-parity.csv:7–11]; [DOC:reports/category-taxonomy-audit.md] |
| `/blog` y `/blog/<slug>` (3 posts) | "intentionally not migrated"; migrar o no es decisión de la dueña | [DOC:seo/03E-redirect-plan.md §4.1 #40, §4.2, §5.5]; [DOC:catalog/shopify-url-parity.csv:41] |
| Panel `/admin` (17 rutas), `/api/**` (6), `/interno/*` (2) | Reemplazados por el Admin de Shopify o sin equivalente; los webhooks nunca se redirigen | [DOC:seo/03E-redirect-plan.md §4.2, §5.6] |
| `/checkout/confirmacion/[orderId]` y `/checkout/wompi/retorno` | Reemplazadas por la página de estado de pedido de Shopify | [DOC:seo/03E-redirect-plan.md §4.2] |
| Contador de vistas (`realViews`, `promotionalViews`) y "N personas viendo esto ahora" (`LiveViewers`) | "NO MIGRAR"; el informe de la ficha los registra como no migrados a propósito y quitó el ajuste `show_live_viewers` | [DOC:shopify-import/catalog-field-mapping.md:22]; [DOC:theme/product-page-report.md:64]; `LiveViewers` "sin equivalente nativo Shopify" [DOC:theme/storefront-blueprint.md:70] |
| "Vistos recientemente" (`RecentlyViewed`, `localStorage`) | Fuera de alcance de esa fase "salvo decisión explícita"; hay una sección de recomendaciones parcial como base | [DOC:theme/product-page-report.md:65,80]; [DOC:theme/react-to-liquid-map.md:35] |
| Poster del hero (M02) | `NO_MIGRAR`; Shopify usa su vista previa del video | [DOC:content/media/media-migration-manifest.csv] |
| Banner de cookies propio y botón "Cambiar mis preferencias de cookies" | No existe en Shopify; el consentimiento lo gestiona la plataforma | [DOC:theme/03D-legal-policies-inventory.md:103]; [DOC:seo/03E-redirect-plan.md fila 46] |
| Casilla de aceptación de términos y aviso de envío del checkout | Fuera de alcance: checkout nativo | [DOC:theme/03D-legal-policies-inventory.md:104,107] |
| Tabla propia de eventos (first-party) | "No migra"; la reemplazan en parte los informes de Shopify | [DOC:analytics/03E-analytics-plan.md:317] |
| `ViewContent` de Meta en la vista de lista | "ninguno (a propósito)" | [DOC:analytics/03F-analytics-owner-runbook.md:226] |
| Listas de favoritos de invitada | No se migran (las de clientas con cuenta, solo si la dueña migra clientes) | [DOC:theme/customer-accounts-report.md:629] |
| "Recomendado para vos" personalizado con `localStorage` | Reemplazado por una colección estática curada (hoy oculta y vacía en Dev) | [DOC:theme/home-report.md:136]; `dev-home.json` |
| "Vista rápida" | Botón presente pero sin modal ("inerte", fuera de alcance) | [DOC:theme/collection-report.md:75] |
| Animación "pop" del corazón (framer-motion) | "NO migrado" | [DOC:theme/home-report.md:63] |
| Editor de arrastre de encuadre (`posX/posY/zoom`) | Herramienta de admin fuera del theme; los valores se guardan como metafields | [DOC:theme/interaction-map.md:47] |
| Encuadre visible (recorte con zoom) de la tarjeta de categoría Salidas de Baño | Sin equivalente exacto en el theme (recorte centrado) | [DOC:content/media/media-migration-manifest.csv, M09] |

**Bloqueado, no "a propósito":** la promesa de envío gratis desde $ 299.900 está apagada por el cerrojo `free_shipping_rate_confirmed` hasta que la tarifa exista [DOC:theme/03D-search-accounts-wishlist-report.md:15,77]; los medios M01–M14 están pendientes de subir (`DEFERRED_OWNER_ONLY_BLOCKER`) [DOC:content/media/media-migration-manifest.csv].

## 17. Huecos y dudas `NOT_VERIFIED`

| # | Qué falta | Por qué | Cómo cerrarlo |
|---|---|---|---|
| 1 | Cajón del carrito, pasos y campos del checkout, resumen de pedido | Solo cliente ("Cargando tu carrito...") | Navegador con un carrito real de prueba (en el sitio actual solo hasta antes de pagar) |
| 2 | `/cuenta` y `/cuenta/favoritos` con sesión y sin sesión | Solo cliente ("Cargando...") | Navegador |
| 3 | Que los otros 7 botones de Color y los cortes de Precio de Aurora Viva y Espuma de Ola se comporten como los dos casos sondeados (Beige, Oasis) | Solo se sondeó Oasis y solo Beige; el mecanismo sí está en el código (B-02, B-18). El botón envía el texto del rótulo [DOC:components/catalog/catalog-filters.tsx] (cerrado en parte en la verificación) | Navegador; ver `launch/evidence/03g-collection-filter-probe/` |
| 4 | El orden real de "Novedades" con datos | El código dice `createdAt` ascendente [DOC:lib/catalog/catalog-actions.ts:116-122]; `created_at` = NOT_AVAILABLE en el repo (cerrado en parte en la verificación) | Base de datos (no consultada) o la dueña |
| 5 | Ver funcionando el selector `USD` | Según el código solo cambia la moneda de visualización [DOC:components/currency/currency-store.tsx]; no se ejecutó (cerrado en parte en la verificación) | Navegador |
| 6 | Dónde se guardan los correos del newsletter y cuántos hay | El formulario no trae `action`; NOT_AVAILABLE | La dueña / código de la app |
| 7 | Contenido del modal de "Guía de tallas" y de "Vista rápida" | Solo cliente (la URL de M14 sí está en el payload) | Navegador |
| 8 | Reproducción real de los videos de categoría (`.mov` de Espuma de Ola incluido) y del hero | Videos sin `src` en el HTML o cargados por JS | Navegador |
| 9 | Si el código desplegado en producción es idéntico al del repo en `lib/catalog/view-display.ts`, `catalog-actions.ts`, `discount.ts` | El origen del factor 6 ya no es un hueco: está en el código del repo (B-01) y coincide con lo medido en 29/29; solo falta confirmar la versión desplegada (cerrado en parte en la verificación) | La dueña o quien despliega |
| 10 | Si `Última actualización` cambia cada día | Un solo día de captura | Repetir el rastreo otro día |
| 11 | http→https, `www`→apex, `/producto/<slug>?talla=` y `/buscar?q=` | No se probaron | GET puntuales |
| 12 | Que la imagen social `/opengraph-image` responda 200 | No se pidió | GET puntual |
| 13 | Scripts de terceros inyectados por JS (analítica, píxeles), sobre todo para quien acepta cookies | Solo HTML servido; `ga4Active` y `metaPixelActive` llegan en `false` en un GET sin consentimiento por diseño (sección 4.1) | Navegador, aceptando cookies, pestaña de red |
| 14 | Modo oscuro activo o no; anchos reales de los puntos de quiebre | CSS no descargado | Descargar las 2 hojas de estilo |
| 15 | Comparaciones contra la Dev Store con el theme RC1.8 | Las capturas dev declaran RC1.7 | Volver a capturar Home y colecciones |
| 16 | Estado de `/en`, hreflang y multilenguaje del sitio actual | No hay `hreflang` en el HTML actual (0 en las 52 páginas y en el sitemap); `/en` no se probó. La captura Dev sí trae `hreflang` `x-default`, `es` y `en`, y `/en` responde 200 [MEDIDO-03G dev-home.json, dev-routes.json] (agregado en la verificación) | GET puntual |
| 17 | Efecto de que `/search` indexable apunte su canonical a la Home | Depende de cómo Google lo trate | Search Console |
| 18 | Identificación legal del comercio (NIT, razón social, dirección, correo) | No aparece en el footer ni en los 6 textos legales: **NOT_AVAILABLE** en el sitio | La dueña |
| 19 | `/cuenta/registro` y `/cuenta/recuperar-contrasena`, enlazadas desde `/cuenta/iniciar-sesion` | El rastreo no las pidió y el sondeo tampoco (agregado en la verificación) | GET puntual |
| 20 | Qué pinta realmente "Recomendado para vos" (Home) y "Vistos recientemente" (ficha) | Componentes de cliente que el HTML no trae (B-15) (agregado en la verificación) | Navegador |

## 18. Cómo reproducir

| Paso | Comando | Notas |
|---|---|---|
| Rastreo (ya hecho; red) | `node launch/tools/03g-crawl-current-site.mjs` | 70 GET; no repetir sin necesidad |
| GET puntuales (ya hecho; red) | `node launch/tools/03g-baseline-probe.mjs` | 7 GET; escribe `launch/evidence/current-site-probe/` |
| Extracción (offline, determinista) | `node launch/tools/03g-baseline-extract.mjs` | Escribe `launch/evidence/current-site-extract.json`; misma entrada, mismo archivo |

SHA-256 de `launch/evidence/current-site-extract.json` tras la verificación (2 corridas seguidas dieron el mismo archivo): `8eab9f9abd35505b33c6dae654ad94c05a6b7ba2d555dd3938a68b45d1f888ad`. El SHA anterior (`a29406ef…2a97`) era el del extractor original; la verificación agregó al extractor los campos `payloadClientComponents`, `analyticsFlagsInPayload`, `rawHostsAnyContext` y `home.recommendedForYou`, y corrigió el texto de `homeVsDev.recommendedSection.current`. Los demás campos no cambiaron.

**Archivos de esta tarea:** `launch/03G-current-site-baseline.md`, `launch/tools/03g-baseline-extract.mjs`, `launch/tools/03g-baseline-probe.mjs`, `launch/evidence/current-site-extract.json`, `launch/evidence/current-site-probe/`.
