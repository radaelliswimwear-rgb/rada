# 03G — Paridad de la Home (sitio actual frente a la Dev Store)

- **Fecha:** 2026-09-29 (hora de referencia 17:40, Bogotá). Solo lectura: no se tocó ninguna tienda, DNS, Vercel ni Wompi; no hubo POST ni navegador; no se pidió nada a `radaelliswimwear.com` (la evidencia guardada alcanzó).
- **Theme evaluado:** Radaelli RC1.8 (SHA-256 `e893b386…fd9e67`, 96 archivos, id 189072474431, sin publicar). Horizon (189072113983) sigue live y no se toca. Sesión de prueba: país US, moneda COP, idioma es. Pagos apagados.
- **Versión de la evidencia Dev:** `launch/evidence/dev-home.json` se capturó con **RC1.7** (lo declara su nota). `theme-src/README.md:88-89` dice que RC1.8 solo cambia `sections/main-product.liquid` [DOC]. Comprobación propia: las 16 comprobaciones de la Home entre la captura y el `theme-src` actual coinciden (Anexo A, H18) [MEDIDO-03G]. Comprobación de la verificación (Anexo B, V1): los manifiestos `dist/release-manifest-rc1.7.json` y `-rc1.8.json` difieren en 1 archivo de 96 (`sections/main-product.liquid`), y el `theme-src` actual coincide por SHA-256 con el manifiesto RC1.8 en 96 de 96 archivos [MEDIDO-03G]. No hay captura Dev con RC1.8: [NOT_VERIFIED].
- **Verificación adversarial (2026-09-29, hora de referencia 17:40, Bogotá):** otro agente re-leyó `home.html`, `dev-home.json`, `theme-src` y el manifiesto de media contra este informe. Hallazgos y correcciones: Contacto del pie (nuevo, HP-22), sufijo del `<title>` (nuevo, HP-23), columna Empresa reclasificada a `intentionally-hidden`, Privacidad sí tiene una política autogenerada en la Dev (HP-13), metas `twitter:*` ausentes (HP-11), alcance de C1 (solo la meta description), fuente de HP-18, M06 "muy probablemente" igual a M01 y conteo de `shop.name` (texto, no uso). Script: `launch/tools/03g-home-parity-verify.mjs` (Anexo B). La tabla final pasó de 37 a 39 filas.
- **Script:** `launch/tools/03g-home-parity.mjs` (offline, determinista; dos ejecuciones seguidas dan salida idéntica). Su salida literal está en el Anexo A y sus datos en `launch/evidence/03g-home-parity.json`. La verificación agregó `launch/tools/03g-home-parity-verify.mjs` (offline, determinista, solo stdout); su salida literal está en el Anexo B. La verificación re-ejecutó el script original dos veces (JSON idéntico byte a byte) y el Anexo A coincide con su salida.
- **Etiquetas:** `[MEDIDO-03G]` sale de `launch/evidence`; `[DOC:archivo]` sale de un documento o del código del repo; `[INFERIDO]` es una deducción y se dice; `[NOT_VERIFIED]` no se comprobó; `NOT_AVAILABLE` no existe la fuente.
- **Clasificación (exactamente una por fila):** `matched` · `sourced-but-owner-upload-pending` (el activo está en `content/media/media-migration-manifest.csv` y falta subirlo con el OK A4 de la dueña) · `editorial-pending` (falta una decisión o un texto de la dueña) · `intentionally-hidden` (decisión documentada) · `DIFFERENCE` (distinto, con impacto).
- **Alcance del sitio actual:** HTML servido (SSR + payload RSC de Next.js) de `launch/evidence/current-site/home.html`. No hay JavaScript ejecutado ni CSS: nada visual, ningún estado posterior a la hidratación. Sin juicios estéticos.

## 0. Resumen

**Resultado:** el orden de las secciones y los textos de hero, categorías, encabezados de las vidrieras, promo, newsletter (encabezado, copy y campo) y anuncio coinciden con el sitio actual. No coinciden el destino de los CTA del hero y del promo, ni el texto del botón del newsletter. Además hay lo que falta subir (media), lo que falta decidir (C1, C2, C3 y otras decisiones de la dueña) y 13 diferencias, 7 de ellas arreglos de Claude sin decisión de la dueña (filas 8, 14, 18, 21, 27, 28 y 38 del § 4).

| Clasificación | Filas (tabla del § 4) |
|---|---:|
| matched | 12 |
| sourced-but-owner-upload-pending | 3 |
| editorial-pending | 8 |
| intentionally-hidden | 3 |
| DIFFERENCE | 13 |
| **Total** | **39** |

El recuento se verifica con `node launch/tools/03g-home-parity-count.mjs`.

**Lo más importante:**

1. **Nombre "Radaelli Swimwear Dev" visible** en el título, `og:title`, `og:site_name` y el logo de texto de la cabecera [MEDIDO-03G]; en el pie y el copyright por deducción [INFERIDO]. No se puede lanzar así (HP-01).
2. **El logo no está en el plan de media.** El sitio actual muestra una imagen de logo en cabecera y pie; el theme muestra texto porque `settings.logo` está vacío, y el archivo (`public/logo/radaelli-swimwear.png`) no figura en las 14 filas del manifiesto. Aunque la dueña apruebe A4, la Home seguiría sin logo (HP-02).
3. **El CTA del hero y el del promo apuntan a `#categorias`; el sitio actual apunta a `#productos`.** Era un parche de 03C cuando "Destacados" no tenía colección; hoy `#productos` existe y tiene 7 tarjetas (HP-03).
4. **Editorial "La belleza de sentirte tú":** 6 de 8 productos en común y 0 de 8 posiciones iguales; y las 8 tarjetas llevan insignia de categoría y "Ver producto", que en el sitio actual solo tiene la vidriera de destacados (HP-06, HP-07).
5. **Sin subir (A4):** el video del hero (la Dev muestra la variante `fallback`, sin imagen ni video) y la media de las 4 tarjetas de categoría. La de "Salidas de Baño" es la única sin ninguna imagen, porque su colección tiene 0 productos (HP-04, HP-05).
6. **El texto y el título SEO existen en el sitio actual.** Meta description de 109 caracteres y título "Trajes de baño de diseño en Colombia". La acción C1 de la dueña habla de "tu texto" y cubre solo la meta description (el título de la Home no figura en `theme/03F-owner-actions-minimal.md`; sí en `seo/03E-seo-offline-review.md` § 2.2); no parte de cero: hay un texto actual que confirmar (HP-11).
7. **La mezcla de voseo y tuteo ya está en la Home actual** ("Dejá tu correo y recibí…" junto a "Compra…", "Explora", "sentirte tú"). La Dev la replica igual. C3 hoy se describe como asunto de los textos legales; también cubre la Home (HP-15).
8. **Contacto del pie (agregado en la verificación).** El desplegable actual muestra bajo cada red el usuario (`@Radaelli_swimwear`, `Radaelli_Swimwear`, `@RadaelliSwimwear`) y, en WhatsApp, el número escrito; el de la Dev muestra solo el nombre de la red. La versión anterior de este informe lo daba por `matched` (HP-22).
9. **Sufijo del `<title>` (agregado en la verificación).** Aunque la dueña confirme y se cargue el título actual, `layout/theme.liquid` agrega " – <nombre de la tienda>" a todo título que no lo contenga: la Home quedaría "Trajes de baño de diseño en Colombia – Radaelli Swimwear" frente al título actual sin sufijo (HP-23).

## 1. Cómo se comparó

| Lado | Fuente | Qué se extrajo |
|---|---|---|
| Actual | `launch/evidence/current-site/home.html` (150.845 bytes, SHA-256 `0289d9af…`) y las 3 muestras `launch/evidence/03g-collection-filter-probe/home-sample-{1,2,3}.html` | Cabecera HTML, anuncio, header, 6 secciones de `main`, footer, banner de cookies, payload RSC (cobertura de categorías y el componente `RecommendedForYou`) |
| Dev | `launch/evidence/dev-home.json`, `dev-collections.json`, `dev-products.jsonl`, `dev-routes.json` | Estructura capturada de la Home Dev |
| Dev | `theme-src/templates/index.json`, `sections/*.liquid` (valores por defecto del `schema`), `config/settings_data.json`, `sections/header-group.json`, `sections/footer-group.json`, `locales/es.default.json` | Valores efectivos = defecto del schema + lo que fija `index.json` |
| Plan | `content/media/media-migration-manifest.csv`, `theme/03F-owner-actions-minimal.md`, `seo/shopify-redirects-import.csv` | Estado de cada activo, acciones de la dueña, cobertura de enlaces |
| Verificación | `dist/release-manifest-rc1.7.json`, `dist/release-manifest-rc1.8.json`, `launch/evidence/dev-routes.json`, `theme/03D-legal-policies-inventory.md`, `launch/tools/03g-home-parity-verify.mjs` | SHA-256 de los 96 archivos del theme, diferencia entre releases, panel de Contacto, `<title>` y metas, destinos legales |

Coherencia entre la captura y el `theme-src`: 16 de 16 [MEDIDO-03G, Anexo A H18]. Los manifiestos de release confirman que solo `sections/main-product.liquid` cambió entre RC1.7 y RC1.8 [MEDIDO-03G, Anexo B V1]. Eso valida usar la captura RC1.7 como reflejo de la Home RC1.8 en lo que depende del código del theme; lo que depende del Admin (orden de colecciones, Preferencias, mercado) es el estado del momento de la captura.

## 2. Sección por sección

### 2.1 Anuncio — `matched`

| | Contenido |
|---|---|
| Actual [MEDIDO-03G] | "20% de descuento en toda la tienda". Sin enlace. Negro con texto blanco y centrado [DOC:theme/header-navigation-report.md] |
| Shopify | Mismo texto (`sections/header-group.json:8`), sin enlace, colores por defecto `#000000` / `#FFFFFF` [DOC] |
| Fuente de la clasificación | Anexo A H1: texto IGUAL en el HTML actual, en `dev-home.json` y en `theme-src` |
| Nota | En el sitio actual el porcentaje es un cálculo automático; en Shopify es texto fijo (divergencia documentada, `theme/header-navigation-report.md` divergencia 1). El "20%" queda escrito a mano en 3 lugares (anuncio, título del promo y precios anteriores del catálogo): si cambia el descuento hay que cambiarlos los tres [DOC:launch/03G-collection-parity.md § 3.4 (precios anteriores fijos del CSV); `theme-src/sections/announcement-bar.liquid` y `promo-banner.liquid` (textos fijos)]. En el sitio actual el título del promo también es un texto fijo (`promo-banner.liquid:2-7`, [DOC]) |

### 2.2 Header y carrito

| Elemento | Actual [MEDIDO-03G] | Shopify | Clasificación |
|---|---|---|---|
| Navegación | Inicio, Oasis Natural, Aurora Viva, Espuma de Ola, Salidas de Baño | Mismos 5 textos; rutas `/collections/*` (las viejas tienen redirección, H15) | `matched` |
| Buscar, favoritos, cuenta | Formulario `/buscar`; `/favoritos`; `/cuenta/iniciar-sesion` | `/search`; `/pages/favoritos?view=wishlist`; `/account` (las 3 viejas tienen redirección, H15) | `matched` |
| Carrito | Botón "Carrito" sin `href` (solo JS) | Enlace "Carrito (0)" a `/cart` con cajón (`cart_drawer_enabled` verdadero) | `matched` |
| Logo | Imagen `/logo/radaelli-swimwear.png`, alt "Radaelli Swimwear" | Texto "Radaelli Swimwear Dev": `settings.logo` sin cargar (`header.liquid:53-62`) | `DIFFERENCE` (HP-02, HP-01) |
| Selector de moneda | `select` "Moneda" con COP y USD (desde ancho `xl`) | No existe en el theme (0 coincidencias de `localization`) | `DIFFERENCE` (HP-10) |
| Redes en cabecera | Instagram, Facebook, TikTok y WhatsApp (desde `xl`) | No existen en la cabecera; solo en el pie | `DIFFERENCE` (HP-10) |

El selector de moneda y las redes de la cabecera figuran en la "Estructura actual real" de `theme/header-navigation-report.md` pero ninguna de sus 4 divergencias documentadas las nombra: no hay decisión registrada.

### 2.3 Hero

| Campo | Actual [MEDIDO-03G] | Shopify | Clasificación |
|---|---|---|---|
| Eyebrow | "Radaelli Swimwear" | igual | `matched` |
| H1 | "Diseños que acompañan tu belleza natural con fuerza, libertad y estilo." | igual | `matched` |
| Subtítulo | "Swimwear pensado para mujeres auténticas, seguras y poderosas." | igual | `matched` |
| CTA (texto) | "Compra de forma sostenible" | igual | `matched` |
| CTA (destino) | `#productos` | `#categorias` (`templates/index.json:6`) | `DIFFERENCE` (HP-03) |
| Media | Video MP4 `bb70lfnhpbl4h8ee7mdz` (servido con `f_auto,q_auto`) con poster PNG `cerhqv59kh6iedegvatv`, sin `<img>` | Variante `fallback`: sin imagen ni video (`hero_video` vacío; `hero.liquid:19-35`) [MEDIDO-03G: `dev-home.json` `imgs:0, videos:0`] | `sourced-but-owner-upload-pending` (HP-04) |

Fuente de la media: M01 (video, `DEFERRED_OWNER_ONLY_BLOCKER`, destino `templates/index.json > hero > hero_video`). M02 (poster) es `NO_MIGRAR`: el theme usa la vista previa de Shopify, decisión documentada [DOC:manifiesto, `hero.liquid:9-13`]. La aceptación de HEVC por Shopify es [NOT_VERIFIED]; el runbook recomienda la variante H.264 que hoy sirve el sitio [DOC:content/media/03F-media-owner-runbook.md § 0].

### 2.4 Categorías destacadas

Encabezado: eyebrow "Explora" y h2 "Categorías destacadas" en ambos (el eyebrow de la Dev sale de `locales/es.default.json:72`). Las 4 tarjetas tienen el mismo texto, el mismo CTA "Explorar→" y la misma etiqueta de accesibilidad "Explorar la categoría …" [MEDIDO-03G, H4 y H4b]; los enlaces cambian de ruta (`/oasis-natural` a `/collections/oasis-natural`), con redirección (H15). Clasificación del texto y los enlaces: `matched`.

| Tarjeta | Media actual (fuente) | Media Dev | Manifiesto | Clasificación |
|---|---|---|---|---|
| Oasis Natural | Video `xxjjwoori52cmkbgu33n.mp4`, poster `zjlcdrptowzxnmcz7ixf.jpg` (payload RSC; el `<video>` del HTML no trae `src`) | Foto de `marea-natural`, 1.er producto de la colección | M03 imagen, M04 video: `DEFERRED_OWNER_ONLY_BLOCKER` | `sourced-but-owner-upload-pending` |
| Aurora Viva | Video `gm4fm2tiwgc2vlu93s7a.mp4`, poster `zdxbjacneyll6npdosdu.png` | Foto de `raices-del-sol-beige-suave` | M05, M06: `DEFERRED_OWNER_ONLY_BLOCKER` (M06: mismo ETag y mismo tamaño, 3.657.361 bytes, que M01; el manifiesto dice "muy probablemente el mismo archivo", no lo afirma; Anexo B V5b) | `sourced-but-owner-upload-pending` |
| Espuma de Ola | Video `nnohfbsoqzgee20xooog.mov`, poster `/images/products/1 (1).webp` | Foto de `bikini-palm-verde-oliva` | M07 imagen `OPCIONAL`, M08 video `DEFERRED_OWNER_ONLY_BLOCKER` | `sourced-but-owner-upload-pending` |
| Salidas de Baño | Imagen PNG `gz9ken66as28i5hresne` como fondo, con encuadre (x 65,99 %, y 100 %, zoom 1,25) | **Sin imagen ni video**: colección con 0 productos, `collection.featured_image` vacío | M09: `DEFERRED_OWNER_ONLY_BLOCKER`, nota "CRITICO" | `sourced-but-owner-upload-pending` |

- **La foto de respaldo de las 3 primeras tarjetas es la del primer producto de cada colección** [MEDIDO-03G: H4; `featured-categories.liquid:41`]. Por eso: (a) si la dueña reordena las colecciones (C-02 de `launch/03G-collection-parity.md`), esas 3 imágenes cambian; (b) hasta A4, esa misma foto aparece dos veces en la Home Dev (tarjeta de categoría y carrusel: `marea-natural` en la editorial; `raices-del-sol-beige-suave` y `bikini-palm-verde-oliva` en destacados).
- **Cobertura del manifiesto (verificada):** los 8 identificadores de Cloudinary que usa la Home actual (video y poster del hero; video y poster o imagen de las 4 tarjetas) figuran en `media-migration-manifest.csv`, y `public/images/products/1 (1).webp` (M07) existe en el repo con el SHA-256 del manifiesto [MEDIDO-03G, verificación]. Ningún activo de media de la Home falta en el manifiesto, salvo los de marca (logo, favicon, imagen social; HP-02, HP-11).
- Con video cargado, el bloque dibuja el video y no la imagen (`featured-categories.liquid:51-55`). M03, M05 y M07 quedan como respaldo.
- **Encuadre de Salidas de Baño:** el theme solo recorta centrado; el encuadre visible del actual no tiene campo [DOC:manifiesto M09; `theme/03D-missing-assets-audit.md` § 2 fila 14, `REQUIRES_DECISION`]. Aun con M09 subida, esa tarjeta no será idéntica.
- Sin imagen, la tarjeta 4 tiene contraste bajo (≈ 2,9:1 en el título) [DOC:launch/03G-responsive-sweep.md H-01; no re-verificado aquí].
- El texto de la 4.ª tarjeta aparece truncado en `dev-home.json` ("Prendas ligeras para después ..."); `templates/index.json` tiene la frase completa "Prendas ligeras para después del sol." Se trata como artefacto de la captura [INFERIDO]; conviene recapturarlo.
- Las 4 tarjetas llevan `available: true` (`templates/index.json:17,25,33,41`), igual que hoy: el payload RSC de `home.html` trae `available: true` para las 4 [MEDIDO-03G, verificación] y lo documenta `theme/03C-catalog-import-report.md:90-91` [DOC]. En ambos sitios "Salidas de Baño" enlaza a una colección vacía. Decidir si sigue enlazada es C-16 del informe de colecciones (dueña).

### 2.5 Editorial "La belleza de sentirte tú"

| Campo | Actual [MEDIDO-03G] | Shopify | Clasificación |
|---|---|---|---|
| Eyebrow y h2 | "Radaelli Swimwear" / "La belleza de sentirte tú" | igual | `matched` |
| Colección y tamaño | 8 primeras de Oasis Natural | `oasis-natural`, límite 8 | `matched` |
| Productos | `costa-esmeralda-azul`, `brisa-natural-beige`, `marea-natural`, `oasis-serena-azul`, `costa-esmeralda-negro`, `marea-natural-naranja`, `arena-dorada-beige`, `arena-dorada-negro` | `marea-natural`, `arena-dorada-beige`, `marea-natural-naranja`, `oasis-serena-negro`, `arena-dorada-negro`, `brisa-natural-naranja`, `oasis-serena-azul`, `costa-esmeralda-negro` | `DIFFERENCE` (HP-06) |
| Tarjeta | Sin insignia de categoría y sin "Ver producto" en las 8 | Insignia (`product.type`) y "Ver producto" (`product-carousel.liquid:33`) [DOC; el HTML de la tarjeta Dev no se capturó] | `DIFFERENCE` (HP-07) |

- **Productos:** 6 de 8 en común, 0 de 8 posiciones iguales. Solo en el actual: `costa-esmeralda-azul` y `brisa-natural-beige` (son las posiciones 9 y 10 de Oasis en la Dev). Solo en la Dev: `oasis-serena-negro` y `brisa-natural-naranja`. Causa: el orden de la colección Oasis Natural (el actual ordena por fecha de creación ascendente; la Dev, por el inverso del orden de importación; ninguno tiene fuente en el repo) [DOC:launch/03G-collection-parity.md C-02, § 3.2]. Reordenar Oasis arregla la editorial.
- **Sin diferencia:** título, precio, precio anterior y primera imagen de los 8 (y de los 7 de destacados) coinciden con `dev-products.jsonl` (Anexo A H5b). Es una comparación contra los datos del producto en la Dev, no contra el HTML de las tarjetas de la Home Dev (no se capturó); que la tarjeta imprima esos mismos datos se deduce de `snippets/product-card.liquid` y `snippets/price.liquid` [INFERIDO]; `launch/03G-collection-parity.md` § 3.4 anota el mismo límite (formato del precio en la tarjeta Dev: NOT_VERIFIED). El "-20%" que muestran las tarjetas actuales lo emite también el snippet `price` de la Dev [DOC]. 0 productos repetidos entre la editorial y destacados, en ambos sitios (H6).
- El sitio actual usa dos diseños de tarjeta (H5c): en la editorial, título centrado bajo la imagen y sin insignia ni overlay; en destacados, insignia, overlay y título con precio en una fila. La Dev usa un solo snippet para las tres vidrieras.

### 2.6 Productos destacados — `matched`

| Campo | Actual [MEDIDO-03G] | Shopify |
|---|---|---|
| Eyebrow, h2, ancla | "Lo más nuevo", "Productos destacados", `id="productos"` | igual; `id="productos"` en `featured-products.liquid:13` |
| Conjunto | 7 productos: `entero-golden-hour`, `bikini-shadow-azul-marino`, `raices-del-sol-beige-suave`, `alba-dorada-lila`, `aurora-total-azul-oscuro`, `enterizo-shadow-palm-azul-marino`, `bikini-palm-verde-oliva` | Mismos 7 (colección manual `destacados`) |
| Orden | 4 muestras, 4 órdenes distintos, mismo conjunto (H6b, medido); que cambie en cada visita es [INFERIDO] y coincide con `theme/03D-missing-assets-audit.md:4` ("baraja en cada visita") | Fijo (el de la colección) |

Clasificación `matched` por el conjunto y el contenido de las tarjetas. El orden fijo frente al aleatorio es la decisión (a) de 03D, documentada [DOC:theme/03D-missing-assets-audit.md:4]. Que Shopify no baraje una colección de forma nativa es [INFERIDO]: ningún archivo del theme lo hace y no se buscó en la documentación de Shopify.

### 2.7 Recomendados — `editorial-pending`

| | Contenido |
|---|---|
| Actual [MEDIDO-03G] | 0 secciones y 0 apariciones del texto en el HTML servido. El payload monta el componente cliente `RecommendedForYou` con 15 slugs excluidos (los ya mostrados). Lo que dibuja después de hidratar y con qué historial: [NOT_VERIFIED] |
| Shopify | Sección presente en `index.json` sin colección: no se pinta (`recommended-products.liquid:20`, `templates/index.json:60-62`). Título por defecto "Recomendado para vos" |
| Fuente de la clasificación | C2 de `theme/03F-owner-actions-minimal.md`; `theme/03D-missing-assets-audit.md` fila 24 (no existe una selección curada: es algorítmica y aleatoria) |

Si la dueña decide dejarla apagada, la fila pasa a `intentionally-hidden` y hay que registrarlo. El título por defecto usa "vos" (ver 2.14).

### 2.8 Promo

| Campo | Actual [MEDIDO-03G] | Shopify | Clasificación |
|---|---|---|---|
| Eyebrow, h2 | "Por tiempo limitado" / "20% de descuento en toda la tienda" | igual | `matched` |
| CTA (texto) | "Descubrir la colección" | igual | `matched` |
| CTA (destino) | `#productos` | `#categorias` (`templates/index.json:67`) | `DIFFERENCE` (HP-03) |
| Letra chica | "Envío gratis en compras desde $ 299.900." y enlace "Ver política de envíos" a `/envios` | No aparece: candado `free_shipping_rate_confirmed` en falso (`promo-banner.liquid:28`); `shipping_policy_url` sin cargar (`:33`) | `intentionally-hidden` |

El candado es decisión documentada [DOC:theme/03D-free-shipping-audit.md, cabecera]: no prometer envío gratis hasta que Shopify tenga la tarifa (A1). Dos condiciones para levantarlo: (1) A1 hecho y `free_shipping_rate_confirmed` encendido (lo hace Claude al final de A1); (2) cargar `shipping_policy_url` cuando exista la página de envíos (B2). La frase además exige que la moneda de la sesión sea la de la tienda (`cart.currency.iso_code == shop.currency`, `promo-banner.liquid:28` [DOC]): con otra moneda no sale. Si solo se enciende el candado, la frase sale sin el enlace. Hoy `/envios`, `/terminos`, `/privacidad` y `/cookies` no tienen redirección entre las 47 (H15) y sus páginas nuevas no existen en la Dev (`/pages/envios`, `/pages/terminos`, `/pages/privacidad` y `/pages/cookies` dan 404 en `dev-routes.json`).

### 2.9 Newsletter

| Campo | Actual [MEDIDO-03G] | Shopify | Clasificación |
|---|---|---|---|
| Eyebrow, h2 | "Ofertas y novedades" / "Sé la primera en enterarte" | igual | `matched` |
| Copy | "Dejá tu correo y recibí aviso apenas lancemos nuevas colecciones, promociones y ofertas — sin necesidad de crear una cuenta." | **idéntico** (`newsletter-home.liquid`, `dev-home.json`) | `matched` |
| Campo | `type=email`, obligatorio, placeholder "tu@email.com", etiqueta "Correo electrónico" | igual (locale) | `matched` |
| Botón | "Quiero enterarme" | "Suscribirme" (`es.default.json:57`, clave compartida con el bloque opcional del pie) | `DIFFERENCE` (HP-08) |
| Mecánica | `<form>` sin `action` ni `method` en el HTML servido; lo que hace al enviar: [NOT_VERIFIED] | `{% form 'customer' %}` con `contact[tags]=newsletter`; mensaje de éxito "Listo — te avisamos apenas haya novedades." | ver fila siguiente |
| Suscriptores actuales | Existe una plantilla de correo "nuevo suscriptor" [DOC:launch/evidence/reference-docs/seo-analytics.md:65] y la tarea "Migrar suscriptores" [DOC:launch/evidence/reference-docs/architecture-map.md:106]. Cantidad: `NOT_AVAILABLE` (no se consulta la base de datos) | No hay importación | `editorial-pending` (HP-19) |

Si la dueña elige tuteo o voseo para la Home (C3), este copy es de los primeros que cambian, y dejaría de ser idéntico al actual a propósito.

### 2.10 Footer

| Elemento | Actual [MEDIDO-03G] | Shopify | Clasificación |
|---|---|---|---|
| Logo | Imagen, alt "Radaelli Swimwear" | Texto `shop.name` (`footer.liquid:36-41`) | `DIFFERENCE` (misma causa que HP-02) |
| Descripción de marca | "Radaelli Swimwear: trajes de baño de diseño atemporal, hechos para durar, con materiales nobles y una mirada minimalista." | "Trajes de baño de diseño atemporal, hechos para durar, con materiales nobles y una mirada minimalista." (sin el prefijo "Radaelli Swimwear: ") | `DIFFERENCE` (HP-09) |
| Redes (4) | Instagram, Facebook, TikTok y WhatsApp, con las mismas URLs (WhatsApp: enlace `wa.me` del sitio) | Mismas 4 y mismas URLs (`settings_data.json`) | `matched` |
| Comprar | Las 4 colecciones | Las 4 colecciones | `matched` |
| Ayuda: Devoluciones y Garantía | `/devoluciones`, `/garantia` | `/policies/refund-policy`, `/pages/garantia` (200; redirecciones importadas) | `matched` |
| Ayuda: Envíos, Términos y condiciones, Privacidad, Cookies | 4 enlaces | Ausentes del pie. Destinos [MEDIDO-03G, `dev-routes.json`, Anexo B V4]: `/pages/envios`, `/pages/terminos`, `/pages/privacidad` y `/pages/cookies` dan 404; `/policies/terms-of-service` y `/policies/shipping-policy` dan 404; **`/policies/privacy-policy` da 200 (política autogenerada por Shopify, no es el texto del sitio actual)**, pero ni el pie ni una redirección la usan | `editorial-pending` (B2, HP-13) |
| Ayuda: Contacto (panel desplegable) | Desplegable "Contacto" dentro de la columna Ayuda, con las 4 redes y, bajo cada nombre, el usuario (`@Radaelli_swimwear`, `Radaelli_Swimwear`, `@RadaelliSwimwear`) y, en WhatsApp, el número escrito (no se reproduce aquí) [MEDIDO-03G, Anexo B V2] | Columna propia "Contacto" (`footer-group.json`) con el desplegable: cada enlace muestra solo el nombre de la red y el ícono; no imprime usuario ni número [DOC:`footer.liquid:125-153`; el HTML Dev no se capturó]; el `<summary>` y el título de la columna dicen ambos "Contacto" [INFERIDO]; correo vacío (`NOT_AVAILABLE`: no hay correo público) | `DIFFERENCE` (HP-22) |
| Empresa | "Sobre nosotros", "Sostenibilidad", "Prensa", los 3 a `#contacto` (marcadores, sin página) | No existe la columna. Criterio documentado en 03D (no una decisión de la dueña): los 3 enlaces no van al menú del pie hasta que exista contenido, que es `NOT_AVAILABLE` [DOC:`theme/03D-legal-policies-inventory.md:77,140`]. Si la dueña quiere la columna, pasa a `editorial-pending` | `intentionally-hidden` (HP-13) |
| Ancla | `id="contacto"` | `id="contacto"` | `matched` |
| Copyright | "© 2026 Radaelli Swimwear. Todos los derechos reservados." | "© <año> Radaelli Swimwear Dev. Todos los derechos reservados." [INFERIDO: `brand_name` vacío usa `shop.name`, `footer.liquid:208`] | `DIFFERENCE` (HP-09) |

### 2.11 Carrito (texto del estado vacío) — `editorial-pending`

Actual: el contenido del carrito no está en el HTML servido; su texto es [NOT_VERIFIED]. Shopify: "Tu carrito" / "Tu carrito está vacío" / "Descubrí la colección y agregá tus favoritos." [MEDIDO-03G: `dev-home.json`]. `theme/cart-report.md:36` dice que es el texto real del sitio, pero no se re-verificó contra evidencia. Se clasifica `editorial-pending` porque la frase usa voseo y depende de C3.

### 2.12 Cabecera SEO de la Home

| Campo | Actual [MEDIDO-03G] | Dev | Clasificación |
|---|---|---|---|
| `<title>` | "Trajes de baño de diseño en Colombia" | "Radaelli Swimwear Dev" | `editorial-pending` (HP-11) |
| Meta description | "Radaelli Swimwear — trajes de baño de diseño premium y atemporal. Materiales nobles y una mirada minimalista." (109 caracteres) | vacía | `editorial-pending` (C1) |
| `og:image`, `og:description` | Presentes | Ausentes en la captura (`dev-home.json` lista 3 etiquetas `og:*`) y sin imagen social cargada [DOC:seo/03E-seo-offline-review.md § 7] | `DIFFERENCE` (HP-11) |
| `twitter:title`, `twitter:description`, `twitter:image` | Presentes, además de `twitter:card` y `og:type` (Anexo B V3b) | `layout/theme.liquid:61` solo emite `twitter:card`; `og:type` no se emite (03E § 7: sin impacto, el valor por defecto es `website`). Sin `twitter:*` propios el resultado depende de que la plataforma de destino use `og:*` [INFERIDO] | `DIFFERENCE` (HP-11, impacto bajo) |
| JSON-LD | Organization + WebSite | Ninguno: `theme-src` no lo emite para la Home (solo la ficha de producto) y 03E lo midió vacío con RC1.4; no re-medido en RC1.8 [DOC:seo/03E-seo-offline-review.md § 6] | `DIFFERENCE` (HP-11) |
| hreflang | 0 alternativas; no hay `/en` en el sitemap actual | `x-default /`, `es /`, `en /en` | `editorial-pending` (HP-12) |
| Canonical | `https://radaelliswimwear.com` | `https://radaelli-swimwear-dev.myshopify.com/` | `DIFFERENCE` (dominio; se cierra con el dominio primario apex al lanzar, B4) [DOC:seo/03E-seo-offline-review.md § 1] |

El plan existente es copiar verbatim el título y la descripción actuales en Tienda online > Preferencias [DOC:seo/03E-seo-offline-review.md § 2.2]. Se necesita la confirmación de la dueña (C1 cubre la meta description; el título no tiene una acción propia en `theme/03F-owner-actions-minimal.md`) y una escritura en el Admin; por eso es `editorial-pending` y no se marca hecho.

**Sufijo del título (agregado en la verificación, HP-23).** `layout/theme.liquid:43` agrega " – {{ shop.name }}" a todo título que no contenga el nombre de la tienda. Con la tienda renombrada a "Radaelli Swimwear" y el título actual copiado verbatim, el `<title>` de la Home quedaría "Trajes de baño de diseño en Colombia – Radaelli Swimwear"; el actual es "Trajes de baño de diseño en Colombia", sin marca (Anexo B V3). `og:title` (`theme.liquid:53`) no lleva el sufijo. 03E § 2.2 anota solo el cambio de separador `|` a `–` para las demás páginas; para la Home actual no hay sufijo que cambiar, hay uno que aparece. El valor de `page_title` en la Home es el de Preferencias o, si está vacío, el nombre de la tienda [DOC:seo/03E-seo-offline-review.md § 2.1]; la salida exacta tras cargar Preferencias es [INFERIDO] hasta medirla.

**`/en`:** `dev-routes.json` anota `/en` con 200 y "mismo hero, idioma en": la interfaz sale en inglés y los textos de las secciones siguen en español [DOC:seo/03E-seo-offline-review.md § 4]. El sitio actual es solo español. Decisión de la dueña (a) despublicar inglés o (b) traducir el catálogo. Si el sitio actual responde algo en `/en`: [NOT_VERIFIED] (no se pidió).

### 2.13 Banner de cookies — `intentionally-hidden`

Actual [MEDIDO-03G]: banner con "Usamos cookies esenciales para que la tienda funcione (carrito, sesión, pagos). Con tu permiso, también podríamos usar cookies de análisis y de publicidad más adelante, para entender mejor tu experiencia de compra." y 3 botones: "Aceptar todas", "Rechazar no esenciales", "Configurar". El theme no lo renderiza (0 menciones de consentimiento en `layout`, `sections`, `snippets`, `assets` y `templates`). Decisión documentada: no migra; el consentimiento lo gestiona la plataforma [DOC:theme/03D-legal-policies-inventory.md:103]. El banner nativo de Shopify en la Dev no está capturado: [NOT_VERIFIED]. Debe quedar configurado y verificado antes de activar GA4 o Meta (B3).

### 2.14 Voseo y tuteo (transversal) — `editorial-pending`

Búsqueda por palabras sobre los textos de la Home (Anexo A H14):

| Origen | Voseo | Tuteo |
|---|---|---|
| Actual | "Dejá", "recibí" (copy del newsletter) | "Compra" (CTA del hero), "Explora" (eyebrow de categorías), "tú" (título de la editorial) |
| Dev | Los mismos, más "Descubrí" y "agregá" (carrito vacío) y "vos" (título oculto de recomendados) | Los mismos |

Alcance en todo el archivo de textos (163 cadenas): 16 con voseo y 1 con tuteo ("Explora", `general.categories.eyebrow`), con una lista fija de formas (H14). La mezcla no la introdujo la migración: viene del sitio actual. Fuente de la clasificación: C3 de `theme/03F-owner-actions-minimal.md` (descrito allí solo para los textos legales) [DOC].

### 2.15 Nombre de la tienda ("Radaelli Swimwear Dev") — `DIFFERENCE`

| Lugar | Evidencia | Etiqueta |
|---|---|---|
| `<title>` de la Home | "Radaelli Swimwear Dev" | [MEDIDO-03G] |
| `og:site_name`, `og:title` | "Radaelli Swimwear Dev" | [MEDIDO-03G] |
| Logo de texto de la cabecera | "Radaelli Swimwear Dev" | [MEDIDO-03G] |
| Pie: texto del logo, `aria-label` y copyright | `shop.name` (`footer.liquid:36-41`, `:208`) | [DOC] + [INFERIDO] |
| Menú móvil y página de contraseña | `shop.name` (`header.liquid:285-289`; `layout/password.liquid`; `sections/main-password.liquid`) | [DOC] |
| Archivos con `shop.name` | password.liquid 1, theme.liquid 3, footer.liquid 6, header.liquid 6, main-password.liquid 2. Son apariciones del texto, no usos que se dibujan: incluyen comentarios y el texto de un `info` del schema (footer.liquid:27 y :231). Los usos que sí se dibujan son `theme.liquid:43,51`, `header.liquid:52,57,62,285,287,289`, `footer.liquid:37,38,41,208`, `password.liquid:14` y `main-password.liquid:44,50` | [DOC] |

No es un defecto del theme: es el nombre de la Dev Store [DOC:seo/03E-seo-offline-review.md § 2.2]. Se resuelve renombrando la tienda al lanzar (Configuración > General), como ya está previsto. Dos ajustes no dependen del nombre y Claude puede hacerlos antes: `brand_name` del pie y la descripción de marca (HP-09).

### 2.16 Orden de secciones — `matched`

Actual: hero, categorías, editorial, destacados, (recomendados: solo cliente), promo, newsletter. Dev: el mismo orden con recomendados oculto en la posición 5 [MEDIDO-03G, H16; DOC:theme/home-report.md § 4].

## 3. Hallazgos

Cada hallazgo lleva: qué, evidencia, impacto y acción propuesta. Severidad: **BLOCKER** impide lanzar tal cual; **DEFECT** lo corrige Claude sin decisión de la dueña; **DIFFERENCE** es distinto y necesita un activo o una decisión; **NOTE** es un hecho o un límite.

| ID | Sev. | Qué | Evidencia | Impacto | Acción propuesta |
|---|---|---|---|---|---|
| HP-01 | BLOCKER | El nombre "Radaelli Swimwear Dev" sale en título, `og:title`, `og:site_name`, logo de texto de la cabecera, pie y (deducido) copyright | H0, H13; `layout/theme.liquid:39-53` | Todo lo indexable y la primera pantalla de cada página dicen "Dev". No se puede lanzar así | Dueña: renombrar la tienda a "Radaelli Swimwear" al lanzar y cargar el título de la Home (HP-11). Claude: ya puede fijar `brand_name` del pie |
| HP-02 | DEFECT | El logo no figura en el manifiesto de media (14 filas, ninguna de logo, favicon o imagen social); `settings.logo` y `settings.favicon` están vacíos. El archivo existe en el repo | H17: `public/logo/radaelli-swimwear.png` 229.512 bytes, `app/icon.png`, `app/favicon.ico`, `app/apple-icon.png`; `content/media/media-migration-manifest.csv` | Con A4 aprobada la Home seguiría con el nombre en texto en cabecera, pie y menú móvil. El JSON-LD propuesto (03E § 6) también usa `settings.logo` | Agregar logo y favicon al manifiesto y al paquete de A4; tras el OK de la dueña, cargarlos en Ajustes del tema (Marca) |
| HP-03 | DEFECT | CTA del hero ("Compra de forma sostenible") y CTA del promo ("Descubrir la colección") van a `#categorias`; el actual va a `#productos` | H3, H8; `templates/index.json:6` y `:67`; `featured-products.liquid:13`; origen: `theme/03C-catalog-import-report.md:94` (parche cuando Destacados no tenía colección) | El botón principal lleva a categorías, no a los productos destacados. `#productos` ya existe y tiene 7 tarjetas | Claude: poner `#productos` en las dos configuraciones (RC1.9 o Editor) y verificar el ancla. Solo si la dueña prefiere categorías, se deja y se documenta |
| HP-04 | DIFFERENCE | Hero sin video: la Dev muestra la variante `fallback` | H3; `dev-home.json` `imgs:0, videos:0`; M01 | La primera pantalla no tiene ni la imagen ni el video del sitio actual | Dueña: OK de A4 (la Home usa 7 de los 12 archivos únicos: M01, M03, M04, M05, M07, M08, M09). Claude: subir, conectar `hero_video`, verificar. Riesgo HEVC [NOT_VERIFIED]: usar la variante H.264 |
| HP-05 | DIFFERENCE | Categorías: 3 tarjetas con foto de producto de respaldo (cambia si se reordena la colección) y "Salidas de Baño" sin ninguna media | H4; M03 a M09; `featured-categories.liquid:41,53-55` | Tarjeta 4 vacía; encuadre no reproducible aun con M09 (`REQUIRES_DECISION`) | Dueña: A4 (M09 es crítica) y decidir si "Salidas de Baño" sigue enlazada mientras esté vacía. Claude: cargar por bloque `image` y `video` |
| HP-06 | DIFFERENCE | Editorial: 6 de 8 productos en común, 0 de 8 posiciones | H5, H5b; `launch/03G-collection-parity.md` C-02 | Se ven 2 productos distintos y en otro orden | Dueña: decidir el orden de las colecciones (C-02). Claude: reordenar Oasis (Admin, con OK) y recapturar |
| HP-07 | DIFFERENCE | Las 8 tarjetas de la editorial llevan insignia de categoría y "Ver producto"; en el actual no | H5c; `product-carousel.liquid:33` | Texto adicional en las tarjetas de la editorial (la Dev no capturó el HTML de la tarjeta: se deduce del snippet) | Claude: parametrizar el snippet (insignia y overlay por sección) y dejar la editorial sin ellos |
| HP-08 | DIFFERENCE | Botón del newsletter: "Suscribirme" frente a "Quiero enterarme" | H9; `es.default.json:57` | Texto distinto en el CTA de captación | Claude: agregar un ajuste de texto de botón a `newsletter-home` con "Quiero enterarme" (o cambiar la clave si la dueña acepta que afecte al pie opcional) |
| HP-09 | DIFFERENCE | Pie: descripción sin el prefijo "Radaelli Swimwear: " y copyright con "Dev" | H10; `footer.liquid:208`; `footer-group.json` (sin `brand_name`) | Texto de marca distinto en todas las páginas | Claude: `brand_name` = "Radaelli Swimwear" y `brand_description` con el texto actual |
| HP-10 | DIFFERENCE | Cabecera: faltan el selector COP/USD y las 4 redes (desde ancho `xl`) | H2; `header.liquid` (0 coincidencias de `localization`, `social_`) | Sin precios en USD en la cabecera ni accesos sociales en la cabecera (siguen en el pie) | Dueña: decidir si USD se conserva (necesita mercado y moneda en Shopify) y si las redes van en la cabecera. Si no, registrarlo como decisión |
| HP-11 | DIFFERENCE | Home: título, meta description, `og:image`, `og:description`, `twitter:title`, `twitter:description`, `twitter:image` y JSON-LD (Organization + WebSite) | H0; Anexo B V3b; `seo/03E-seo-offline-review.md` §§ 2.2, 6, 7; `layout/theme.liquid:51-61` | La portada tiene menos datos SEO y de compartir que la actual. C1 dice "tu texto", pero el texto actual existe. C1 cubre solo la meta description: el título no tiene acción propia en `03F-owner-actions-minimal.md` | Dueña: confirmar (C1) la descripción y el título actuales; subir la imagen social. Esa imagen no existe como archivo: el sitio actual la genera al pedirla (`components/opengraph-image.tsx`: 1200×630, logo sobre `#f7f4ef` [DOC]; se sirve en `/opengraph-image` según el `og:image` de `home.html` [MEDIDO-03G]); hay que exportarla, sumarla al manifiesto y al paquete de A4 (con el OK de descarga). Claude: escribirlos en Preferencias con el OK, y aplicar la propuesta JSON-LD de 03E § 6 (necesita `settings.logo`). Los `twitter:*` propios son opcionales (impacto bajo, [INFERIDO]) |
| HP-12 | DIFFERENCE | `hreflang` `x-default, es, en` y `/en` publicado; el actual no tiene inglés | H0; `dev-routes.json` `/en`; `seo/03E-seo-offline-review.md` § 4 | URLs nuevas en inglés con textos en español dentro del sitemap | Dueña: elegir (a) despublicar inglés o (b) traducir. Re-medir tras C1 |
| HP-13 | DIFFERENCE | Pie: faltan Envíos, Términos, Privacidad, Cookies (sin enlace en el pie; destinos `/pages/*` con 404) y la columna Empresa (3 marcadores; criterio 03D: no migrar hasta que haya contenido) | H10, H15; `dev-routes.json`; Anexo B V4 y V5; `theme/footer-report.md:13,36`; `theme/03D-legal-policies-inventory.md:77,140` | Las 4 URLs que hoy enlaza la Home actual (`/envios`, `/terminos`, `/privacidad`, `/cookies`) no tienen redirección: darían 404 si el DNS se mueve antes de B2 [DOC:seo/03E-seo-offline-review.md § 5]. Excepción medida: `/policies/privacy-policy` responde 200 con una política autogenerada por Shopify (no es el texto actual), que nada enlaza | Dueña: B2 (aprobar las 4 páginas, razón social, NIT, dirección) y, solo si quiere la columna Empresa, dar contenido a sus 3 enlaces. Claude: crear páginas, menú y 4 redirecciones; decidir con B2 qué pasa con la política autogenerada de privacidad |
| HP-14 | DIFFERENCE | "Recomendado para vos": sección oculta, sin colección | H7; `templates/index.json:60-62` | La Home Dev no tiene esa vidriera; en el actual es del lado del cliente y no se ve en el HTML | Dueña: C2 (curar una colección o dejarla oculta y registrarlo) |
| HP-15 | DIFFERENCE | Tono: mezcla de voseo y tuteo en la misma Home, heredada del actual | H14, 163 cadenas del locale | La dueña debe decidir para toda la interfaz, no solo para los textos legales | Dueña: C3 ampliado a la Home y al locale. Claude: aplicar |
| HP-16 | NOTE | Promo: letra chica de envío gratis oculta por candado; `shipping_policy_url` sin cargar | H8; `promo-banner.liquid:28,33` | Sin efecto hoy (decisión documentada). Al encender el candado, la frase saldría sin enlace | Al cerrar A1: encender el candado y cargar `shipping_policy_url` cuando exista la página de envíos |
| HP-17 | NOTE | Banner de cookies del actual no existe en el theme | H12; `03D-legal-policies-inventory.md:103` | El consentimiento debe quedar cubierto por Shopify antes de B3 | Verificar la configuración de privacidad de clientes al hacer B3 |
| HP-18 | NOTE | Toda la evidencia de la Home es con país US. Con país CO no hay productos disponibles (0/29) y las 15 tarjetas de la Home mostrarían "Agotado" | `theme/03F-owner-actions-minimal.md` A1 ("hoy 29/29 agotados") y `theme/03F-owner-market-colombia-runbook.md` V4 (0/29) [DOC]; `launch/03G-checkout-precondition-audit.md` § 1 (medido en `marea-natural`: 3 de 3 variantes agotadas) [DOC]; `product-card.liquid` (`product.available == false`) [INFERIDO para la Home]; medido en Oasis con 10 de 10 tarjetas "Agotado" [DOC:theme/03E-checkout-baseline-report.md C2] | La Home no es comparable en el mercado real hasta A1 | Dueña: A1. Claude: recapturar la Home con país CO |
| HP-19 | NOTE | Suscriptores actuales del newsletter sin migrar; cantidad `NOT_AVAILABLE`. Si el formulario de Shopify otorga consentimiento de marketing: [NOT_VERIFIED] | § 2.9 | Riesgo de perder la base de suscriptores | Dueña: autorizar y decidir la migración (no se consulta la base de datos en esta tarea) |
| HP-20 | NOTE | Destacados: orden fijo frente a orden aleatorio del actual; 0 productos repetidos entre vidrieras | H6, H6b | Ninguno visible (decisión (a) de 03D) | Ninguna |
| HP-21 | NOTE | Límites de la captura Dev: RC1.7, sin HTML de tarjetas, texto de la tarjeta 4 truncado | § 6 | Puede ocultar diferencias menores | Recapturar con RC1.8 y país CO tras A1 |
| HP-22 | DIFFERENCE | Pie, desplegable "Contacto": el actual imprime bajo cada red el usuario (`@Radaelli_swimwear`, `Radaelli_Swimwear`, `@RadaelliSwimwear`) y, en WhatsApp, el número escrito; la Dev imprime solo el nombre de la red con su ícono. Además el `<summary>` y el título de la columna dicen ambos "Contacto" [INFERIDO]. Agregado en la verificación: el informe original lo clasificó `matched` | Anexo B V2 (actual: [MEDIDO-03G] `home.html`; Dev: [DOC] `footer.liquid:125-153`, `footer-group.json`); el JSON del propio script ya traía el texto secundario (`03g-home-parity.json`, `footer.current.columns[Ayuda].externalLinks`) | Es el único lugar de la Home actual que muestra un usuario o un número de contacto como texto; en la Dev no aparece en ningún lado. El enlace a cada red sí existe (pills del pie) | Claude: mostrar usuario y número derivados de `settings.social_*` o con campos de texto propios, y quitar la palabra repetida (requiere autorización para tocar `theme-src`). Sin decisión de la dueña, salvo si prefiere no publicar el número como texto |
| HP-23 | DIFFERENCE | `<title>` con sufijo: `layout/theme.liquid:43` agrega " – <nombre de la tienda>" a todo título que no lo contenga. Con el nombre "Radaelli Swimwear" y el título actual cargado verbatim (C1/03E § 2.2), la Home saldría "Trajes de baño de diseño en Colombia – Radaelli Swimwear"; el actual es "Trajes de baño de diseño en Colombia". Agregado en la verificación | Anexo B V3 (título actual [MEDIDO-03G]; regla del theme [DOC]; resultado [INFERIDO], no medido); `seo/03E-seo-offline-review.md` § 2.1 | El título indexado de la portada no sería idéntico al actual aunque se cumpla el plan de copiar verbatim. Impacto SEO: NOT_VERIFIED | Dueña: decidir si la Home lleva el sufijo de marca. Claude: si no, exceptuar la Home en `theme.liquid` (con autorización) y medir el `<title>` tras cargar Preferencias |

## 4. Tabla final

| # | Sección | Actual | Shopify | Clasificación | Acción | Quién |
|---|---|---|---|---|---|---|
| 1 | Anuncio | "20% de descuento en toda la tienda", sin enlace | Igual | matched | Ninguna; si la dueña cambia el descuento, editar el texto en 3 lugares | Claude (a pedido) |
| 2 | Header: navegación, búsqueda, favoritos, cuenta | Inicio + 4 colecciones; `/buscar`, `/favoritos`, `/cuenta/iniciar-sesion` | Mismos textos; `/collections/*`, `/search`, `/pages/favoritos`, `/account` | matched | Ninguna (47 redirecciones importadas) | — |
| 3 | Header: logo (y logo del pie) | Imagen `/logo/radaelli-swimwear.png` | Texto "Radaelli Swimwear Dev" (`settings.logo` vacío) | DIFFERENCE | Agregar logo al manifiesto y a A4; cargar `settings.logo` (HP-02) | Dueña (OK) + Claude |
| 4 | Header: selector COP/USD y 4 redes | Presentes desde `xl` | No existen | DIFFERENCE | Decidir si se conservan (HP-10) | Dueña |
| 5 | Header: carrito | Botón "Carrito" | Enlace "Carrito (0)" + cajón | matched | Ninguna | — |
| 6 | Hero: textos | Eyebrow, h1, subtítulo, CTA "Compra de forma sostenible" | Iguales | matched | Ninguna | — |
| 7 | Hero: media | Video `bb70lfnhpbl4h8ee7mdz` + poster | Variante `fallback` (sin imagen ni video) | sourced-but-owner-upload-pending | A4: subir M01 (variante H.264) y cargar `hero_video` (HP-04) | Dueña (OK) + Claude |
| 8 | Hero: destino del CTA | `#productos` | `#categorias` | DIFFERENCE | Cambiar a `#productos` (HP-03) | Claude |
| 9 | Categorías: textos, CTA y enlaces | 4 tarjetas: nombre, frase, "Explorar→" | Iguales; rutas `/collections/*` | matched | Ninguna | — |
| 10 | Categorías: media de Oasis, Aurora y Espuma | Video con poster | Foto del 1.er producto de cada colección | sourced-but-owner-upload-pending | A4: M03 a M08 y cargar en cada bloque (HP-05) | Dueña (OK) + Claude |
| 11 | Categorías: Salidas de Baño | Imagen PNG con encuadre | Sin media (colección con 0 productos) | sourced-but-owner-upload-pending | A4: M09 (crítica); decidir el encuadre y si sigue enlazada (HP-05) | Dueña (OK y decisión) + Claude |
| 12 | Editorial: encabezado y colección | Eyebrow + "La belleza de sentirte tú"; Oasis, 8 | Igual | matched | Ninguna | — |
| 13 | Editorial: productos | 8 primeras del orden actual | 6 de 8 en común, 0 de 8 posiciones | DIFFERENCE | Decidir el orden de Oasis y reordenar (HP-06) | Dueña + Claude |
| 14 | Editorial: tarjeta | Sin insignia ni "Ver producto" | Con ambos (snippet compartido) | DIFFERENCE | Parametrizar el snippet (HP-07) | Claude |
| 15 | Destacados | "Lo más nuevo" / "Productos destacados", 7 productos, orden aleatorio, `#productos` | Mismos 7, orden fijo, `#productos` | matched | Ninguna (decisión (a) de 03D) | — |
| 16 | Recomendados | Componente cliente; no está en el HTML | Oculto, sin colección | editorial-pending | C2: curar una colección o dejarla oculta y registrarlo (HP-14) | Dueña |
| 17 | Promo: textos y CTA | "Por tiempo limitado", "20% de descuento en toda la tienda", "Descubrir la colección" | Iguales | matched | Ninguna | — |
| 18 | Promo: destino del CTA | `#productos` | `#categorias` | DIFFERENCE | Cambiar a `#productos` (HP-03) | Claude |
| 19 | Promo: envío gratis y enlace a `/envios` | "Envío gratis en compras desde $ 299.900. Ver política de envíos" | Oculto por candado; `shipping_policy_url` sin cargar | intentionally-hidden | Al cerrar A1 encender el candado; cargar el enlace tras B2 (HP-16) | Dueña (A1, B2) + Claude |
| 20 | Newsletter: encabezado, copy y campo | "Sé la primera en enterarte" + copy con voseo | Idéntico | matched | Ninguna (ver fila 36) | — |
| 21 | Newsletter: botón | "Quiero enterarme" | "Suscribirme" | DIFFERENCE | Ajuste de texto de botón (HP-08) | Claude |
| 22 | Newsletter: suscriptores actuales | Base propia; cantidad NOT_AVAILABLE | Sin importación | editorial-pending | Decidir y autorizar la migración (HP-19) | Dueña |
| 23 | Footer: Comprar, redes (pills) y ancla `#contacto` | Igual contenido y URLs | Igual (el desplegable de Contacto va aparte: fila 38) | matched | Ninguna | — |
| 24 | Footer: Devoluciones y Garantía | `/devoluciones`, `/garantia` | `/policies/refund-policy`, `/pages/garantia` | matched | Ninguna | — |
| 25 | Footer: Envíos, Términos, Privacidad, Cookies | 4 enlaces | Ausentes; `/pages/*` con 404 (Privacidad: existe `/policies/privacy-policy`, autogenerada, sin enlace) | editorial-pending | B2: aprobar 4 páginas y datos legales (HP-13) | Dueña + Claude |
| 26 | Footer: Empresa | 3 enlaces a `#contacto` (marcadores) | No existe (criterio 03D: sin contenido, no va al menú) | intentionally-hidden | Ninguna hasta que la dueña quiera la columna (HP-13) | Dueña (si la quiere) |
| 27 | Footer: descripción de marca | Con el prefijo "Radaelli Swimwear: " | Sin el prefijo | DIFFERENCE | Cargar el texto actual (HP-09) | Claude |
| 28 | Footer: copyright | "© 2026 Radaelli Swimwear." | "© <año> Radaelli Swimwear Dev." [INFERIDO] | DIFFERENCE | `brand_name` = "Radaelli Swimwear" (HP-09) | Claude |
| 29 | Carrito: texto del vacío | NOT_VERIFIED | "Descubrí la colección y agregá tus favoritos." | editorial-pending | Comparar con el actual y decidir tono (C3) | Dueña + Claude |
| 30 | SEO: título de la Home | "Trajes de baño de diseño en Colombia" | "Radaelli Swimwear Dev" | editorial-pending | Confirmar y cargar en Preferencias (HP-11); ver fila 39 por el sufijo | Dueña + Claude |
| 31 | SEO: meta description | 109 caracteres | Vacía | editorial-pending | C1: confirmar el texto actual (HP-11) | Dueña |
| 32 | SEO: `og:image`, `og:description`, `twitter:title`, `twitter:description`, `twitter:image`, JSON-LD | Presentes | Ausentes (de `twitter:*` solo `twitter:card`) | DIFFERENCE | Subir imagen social; aplicar propuesta JSON-LD (HP-11) | Dueña (imagen) + Claude |
| 33 | SEO: hreflang y `/en` | 0 alternativas | `x-default`, `es`, `en` | editorial-pending | Decidir (a) o (b) (HP-12) | Dueña |
| 34 | Nombre de la tienda y dominio: `og:site_name`, cabecera, canonical | "Radaelli Swimwear"; `radaelliswimwear.com` | "Radaelli Swimwear Dev"; `radaelli-swimwear-dev.myshopify.com` | DIFFERENCE | Renombrar la tienda y fijar el dominio primario (apex) al lanzar (HP-01, B4) | Dueña |
| 35 | Banner de cookies | Banner con 3 botones | No existe en el theme | intentionally-hidden | Verificar el banner nativo antes de B3 (HP-17) | Dueña + Claude |
| 36 | Tono: voseo y tuteo | Mezcla | Mezcla replicada + más voseo | editorial-pending | C3 ampliado a la Home (HP-15) | Dueña |
| 37 | Orden de secciones | hero, categorías, editorial, destacados, promo, newsletter | Mismo orden, con recomendados oculto | matched | Ninguna | — |
| 38 | Footer: desplegable de Contacto (agregada en la verificación) | 4 redes con usuario o número escrito bajo el nombre | 4 redes solo con el nombre y el ícono; "Contacto" repetido en el título y el `<summary>` | DIFFERENCE | Mostrar el texto secundario y quitar la repetición (HP-22) | Claude |
| 39 | SEO: sufijo del `<title>` (agregada en la verificación) | "Trajes de baño de diseño en Colombia" (sin marca) | Con el título cargado, "… – Radaelli Swimwear" (theme.liquid:43) [INFERIDO] | DIFFERENCE | Decidir si la Home lleva el sufijo; si no, exceptuarla (HP-23) | Dueña (decide) + Claude |

Conteo por clasificación (lo imprime `node launch/tools/03g-home-parity-count.mjs` leyendo esta tabla):

| Clasificación | N.º | Filas |
|---|---:|---|
| matched | 12 | 1, 2, 5, 6, 9, 12, 15, 17, 20, 23, 24, 37 |
| sourced-but-owner-upload-pending | 3 | 7, 10, 11 |
| editorial-pending | 8 | 16, 22, 25, 29, 30, 31, 33, 36 |
| intentionally-hidden | 3 | 19, 26, 35 |
| DIFFERENCE | 13 | 3, 4, 8, 13, 14, 18, 21, 27, 28, 32, 34, 38, 39 |

De las 13 diferencias, 7 las corrige Claude sin decisión de la dueña (8, 14, 18, 21, 27, 28, 38); las otras 6 necesitan un activo, una decisión o una acción de la dueña (3, 4, 13, 32, 34, 39). Todo cambio de `theme-src` requiere autorización aparte.

Cambios de la verificación frente al informe original (37 filas: matched 12, sourced 3, editorial-pending 9, intentionally-hidden 2, DIFFERENCE 11): la fila 26 (Empresa) pasó de `editorial-pending` a `intentionally-hidden` por su fuente documentada (03D); se agregaron las filas 38 y 39 (`DIFFERENCE`); la fila 23 quedó `matched` solo para Comprar, redes y ancla.

## 5. Qué depende de quién

**Dueña (nadie más puede decidirlo o aprobarlo):**

| Ítem | Qué |
|---|---|
| A4 | OK para descargar y subir los 12 archivos únicos; la Home usa 7 (HP-04, HP-05). Agregar logo y favicon al paquete (HP-02) |
| A1 | Mercado y envío de Colombia: sin esto la Home no se puede validar en el mercado real (HP-18) y el candado de envío gratis sigue apagado (HP-16) |
| B2 | 4 páginas legales, razón social, NIT y dirección: destinos de 4 enlaces del pie y del promo (HP-13) |
| C1 | Meta description de la Home: confirmar el texto actual (HP-11). El título de la Home no está en C1 de `03F-owner-actions-minimal.md`: confirmarlo también y decidir el sufijo de marca (HP-23) |
| C2 | "Recomendado para vos": curar o dejar oculta (HP-14) |
| C3 | Voseo o tuteo, ampliado a la Home (HP-15) |
| Otras | Orden de las colecciones (HP-06); "Salidas de Baño" enlazada o no (HP-05); selector COP/USD y redes de cabecera (HP-10); Empresa, solo si la quiere (HP-13); `/en` (HP-12); suscriptores (HP-19); renombrar la tienda (HP-01); sufijo de marca en el título de la Home (HP-23) |

**Claude (sin decisión de la dueña):** `#productos` en los dos CTA (HP-03); `brand_name` y descripción del pie (HP-09); botón del newsletter (HP-08); snippet de tarjetas de la editorial (HP-07); texto de usuario y número en el desplegable de Contacto (HP-22); propuesta JSON-LD (HP-11, tras `settings.logo`). Todo cambio de `theme-src` o del Admin necesita autorización aparte. Esta tarea solo creó el script, su JSON, el script de recuento, el script de verificación y este informe; no modificó ninguna tienda ni el theme.

## 6. Límites y qué no se verificó

- **Solo HTML servido del sitio actual:** sin JavaScript ni CSS, nada visual y nada posterior a la hidratación. No se conocen el estado del carrito, el mensaje de éxito del newsletter, ni lo que dibuja `RecommendedForYou`: [NOT_VERIFIED].
- **La captura Dev** (~17:28 a ~17:33, Bogotá) es de RC1.7, con sesión US y sin HTML de tarjetas. La insignia y el overlay de la editorial Dev se deducen del snippet; la ausencia de `og:image` y de JSON-LD en la Dev se apoya en la captura (3 etiquetas `og:*`) y en 03E, no en una lectura nueva.
- **Sin captura Dev con RC1.8 ni con país CO.** El texto de la 4.ª tarjeta de categoría quedó truncado en la captura.
- **La tabla del § 4 es texto escrito por el autor**, no salida del script; el script de recuento (`03g-home-parity-count.mjs`) solo cuenta sus clasificaciones y comprueba que sean una de las cinco permitidas.
- **Contraste de la tarjeta 4:** viene de `launch/03G-responsive-sweep.md` H-01; no se re-midió.
- **Tono:** búsqueda por lista fija de formas verbales; no es un análisis lingüístico completo.
- **No se consultó Neon ni ninguna base de datos:** la cantidad de suscriptores y la fecha de creación de los productos son `NOT_AVAILABLE`.
- **`/en` en el sitio actual:** no se pidió; solo se sabe que su Home no anuncia alternativas y que su sitemap no lista `/en`.
- **No se reprodujo el número de WhatsApp:** se usa "enlace `wa.me` del sitio". El sitio actual lo imprime como texto en el desplegable de Contacto (HP-22); aquí no se copia.
- **Botón de favoritos en las 15 tarjetas de la Home:** no se comparó (el informe original no lo cubría). El actual lo trae en el HTML servido con la etiqueta "Añadir a favoritos"; la Dev lo tiene por código con la misma etiqueta (`snippets/product-card.liquid`, clave `general.wishlist.add`; nace `hidden` y lo muestra `wishlist.js`), pero el HTML de la tarjeta Dev no se capturó. La sincronización de favoritos con la cuenta depende de A5 (`/apps/wishlist` da 404 en `dev-routes.json`). Estado: [NOT_VERIFIED].
- **Menú móvil del sitio actual:** el cajón se dibuja solo al abrirlo (JavaScript); no está en el HTML servido, así que no se comparó con el de la Dev (`header.liquid:285-289`).
- **La verificación no midió el HTML de la Dev:** todo lo nuevo de la verificación (HP-22, HP-23, `twitter:*`) contrasta el HTML actual [MEDIDO-03G] con el código de `theme-src` [DOC] y con `dev-home.json`/`dev-routes.json`; ningún dato nuevo sale de una lectura de la Dev Store.

## 7. Cómo reproducir

```
node launch/tools/03g-home-parity.mjs
node launch/tools/03g-home-parity-count.mjs
node launch/tools/03g-home-parity-verify.mjs
```

Los tres leen solo archivos del repo (`launch/evidence`, `theme-src`, `content/media`, `seo`, `dist/release-manifest-*.json`, `theme/`) y no usan red ni git. El primero escribe `launch/evidence/03g-home-parity.json`; el segundo y el tercero solo imprimen. Dos ejecuciones seguidas dan salida idéntica.

## Anexo A — Salida literal del script

> Nota de la verificación: esta salida coincide carácter por carácter con la del script (los títulos pasan de `##` a `###`) y no se modificó. Dos filas de sus tablas quedan corregidas por el texto de este informe: H10 "Ayuda: Contacto (redes)" dice "presente en ambos según el código", pero el panel actual imprime usuario y número y el de la Dev no (§ 2.10, HP-22, Anexo B V2); y H0 no lista `og:type` ni `twitter:*` (§ 2.12, Anexo B V3b).

### H0 Cabecera, SEO y compartir (Home)
| campo | actual [MEDIDO-03G] | Dev (captura RC1.7 / theme-src) | resultado |
|---|---|---|---|
| lang | es | es | IGUAL |
| title | Trajes de baño de diseño en Colombia | Radaelli Swimwear Dev | DISTINTO |
| meta description | "Radaelli Swimwear — trajes de baño de diseño premium y atemporal. Materiales nobles y una mirada minimalista." (109 car.) | (vacía) | DISTINTO |
| canonical | https://radaelliswimwear.com | https://radaelli-swimwear-dev.myshopify.com/ | DISTINTO (host) |
| og:title | Trajes de baño de diseño en Colombia | Radaelli Swimwear Dev | DISTINTO |
| og:site_name | Radaelli Swimwear | Radaelli Swimwear Dev | DISTINTO |
| og:description | presente | ausente (en la captura) | DISTINTO |
| og:image | presente | ausente (en la captura) | DISTINTO |
| robots | index, follow | (sin meta robots) | n/a (indexable en ambos) |
| hreflang (link rel=alternate) | 0 | x-default /; es /; en /en | DISTINTO |
| JSON-LD | Organization + WebSite | ninguno en theme-src para la Home (la captura dev-home.json no lo registra) | DISTINTO |

### H1 Anuncio
| campo | actual | Dev captura | Dev theme-src (efectivo) | resultado |
|---|---|---|---|---|
| texto | 20% de descuento en toda la tienda | 20% de descuento en toda la tienda | 20% de descuento en toda la tienda | IGUAL |
| enlace | sin enlace (DOC header-navigation-report) | n/a | (vacío) | IGUAL |
| colores | negro / blanco (DOC) | n/a | #000000 / #FFFFFF | IGUAL |

### H2 Header
| elemento | actual [MEDIDO-03G] | Dev | resultado |
|---|---|---|---|
| logo | imagen /logo/radaelli-swimwear.png (alt "Radaelli Swimwear") | texto "Radaelli Swimwear Dev" (logo de texto; settings.logo sin cargar) | DISTINTO |
| navegación | Inicio -> /; Oasis Natural -> /oasis-natural; Aurora Viva -> /aurora-viva; Espuma de Ola -> /espuma-de-ola; Salidas de Baño -> /salidas-de-bano | Inicio -> /; Oasis Natural -> /collections/oasis-natural; Aurora Viva -> /collections/aurora-viva; Espuma de Ola -> /collections/espuma-de-ola; Salidas de Baño -> /collections/salidas-de-bano | IGUAL en textos; rutas remapeadas (47 redirecciones) |
| buscar | formulario -> /buscar; botón 'Buscar' | Buscar -> /search | presente en ambos |
| selector de moneda | select "Moneda": COP/USD (solo >= xl) | no existe en el theme | DISTINTO |
| redes en cabecera | Instagram, Facebook, TikTok, WhatsApp (solo >= xl) | no existen en la cabecera (solo en el pie) | DISTINTO |
| favoritos | /favoritos | Favoritos () -> /pages/favoritos?view=wishlist | presente en ambos |
| cuenta | /cuenta/iniciar-sesion | Mi cuenta -> /account | presente en ambos |
| carrito | botón 'Carrito' (sin href: solo JS) | Carrito (0) -> /cart | presente en ambos |

### H3 Hero
| campo | actual | Dev captura | Dev theme-src (efectivo) | resultado |
|---|---|---|---|---|
| eyebrow | Radaelli Swimwear | Radaelli Swimwear | Radaelli Swimwear | IGUAL |
| h1 | Diseños que acompañan tu belleza natural con fuerza, libertad y estilo. | Diseños que acompañan tu belleza natural con fuerza, libertad y estilo. | Diseños que acompañan tu belleza natural con fuerza, libertad y estilo. | IGUAL |
| subtítulo | Swimwear pensado para mujeres auténticas, seguras y poderosas. | Swimwear pensado para mujeres auténticas, seguras y poderosas. | Swimwear pensado para mujeres auténticas, seguras y poderosas. | IGUAL |
| texto del CTA | Compra de forma sostenible | Compra de forma sostenible | Compra de forma sostenible | IGUAL |
| destino del CTA | #productos | #categorias | #categorias | DISTINTO |
| media | video bb70lfnhpbl4h8ee7mdz.mp4 + poster cerhqv59kh6iedegvatv.png | fallback (sin imagen ni video) | hero_video vacío -> variante fallback | DISTINTO |
| manifiesto M01 (video) | DEFERRED_OWNER_ONLY_BLOCKER |  | templates/index.json > hero > hero_video | sourced-but-owner-upload-pending |
| manifiesto M02 (poster) | NO_MIGRAR |  | Shopify usa su propia vista previa del video (hero.liquid:9-13) | no se migra (documentado) |

### H4 Categorías destacadas
| tarjeta | actual (texto, enlace, CTA) | Dev (texto, enlace, bloque) | media actual | media Dev | manifiesto |
|---|---|---|---|---|---|
| Oasis Natural | Tonos tierra y vegetación exuberante. \| /oasis-natural \| Explorar→ | Tonos tierra y vegetación exuberante. \| /collections/oasis-natural \| sin media en el bloque | actual: video xxjjwoori52cmkbgu33n.mp4 (poster zjlcdrptowzxnmcz7ixf.jpg) | Dev: imagen z4rfoq5aafurzpc9chae.jpg = 1.er producto de la colección (marea-natural; im[0]=z4rfoq5aafurzpc9chae.jpg; coincide: sí) | M03:DEFERRED_OWNER_ONLY_BLOCKER, M04:DEFERRED_OWNER_ONLY_BLOCKER |
| Aurora Viva | Colores luminosos para los primeros rayos del día. \| /aurora-viva \| Explorar→ | Colores luminosos para los primeros rayos del día. \| /collections/aurora-viva \| sin media en el bloque | actual: video gm4fm2tiwgc2vlu93s7a.mp4 (poster zdxbjacneyll6npdosdu.png) | Dev: imagen vljbngbutr1v9bgeccja.jpg = 1.er producto de la colección (raices-del-sol-beige-suave; im[0]=vljbngbutr1v9bgeccja.jpg; coincide: sí) | M05:DEFERRED_OWNER_ONLY_BLOCKER, M06:DEFERRED_OWNER_ONLY_BLOCKER |
| Espuma de Ola | Texturas suaves y tonos marinos. \| /espuma-de-ola \| Explorar→ | Texturas suaves y tonos marinos. \| /collections/espuma-de-ola \| sin media en el bloque | actual: video nnohfbsoqzgee20xooog.mov (poster /images/products/1 (1).webp) | Dev: imagen ehzhhjn8o5w85syqf6g2.jpg = 1.er producto de la colección (bikini-palm-verde-oliva; im[0]=ehzhhjn8o5w85syqf6g2.jpg; coincide: sí) | M07:OPCIONAL, M08:DEFERRED_OWNER_ONLY_BLOCKER |
| Salidas de Baño | Prendas ligeras para después del sol. \| /salidas-de-bano \| Explorar→ | Prendas ligeras para después ... \| /collections/salidas-de-bano \| sin media en el bloque | actual: imagen gz9ken66as28i5hresne.png | Dev: sin imagen (colección con 0 productos) | M09:DEFERRED_OWNER_ONLY_BLOCKER |

### H4b Categorías: texto de la descripción
| tarjeta | actual vs theme-src | actual | theme-src (index.json) | captura dev-home.json |
|---|---|---|---|---|
| Oasis Natural | IGUAL | actual: Tonos tierra y vegetación exuberante. | theme-src: Tonos tierra y vegetación exuberante. | captura: Tonos tierra y vegetación exuberante. |
| Aurora Viva | IGUAL | actual: Colores luminosos para los primeros rayos del día. | theme-src: Colores luminosos para los primeros rayos del día. | captura: Colores luminosos para los primeros rayos del día. |
| Espuma de Ola | IGUAL | actual: Texturas suaves y tonos marinos. | theme-src: Texturas suaves y tonos marinos. | captura: Texturas suaves y tonos marinos. |
| Salidas de Baño | IGUAL | actual: Prendas ligeras para después del sol. | theme-src: Prendas ligeras para después del sol. | captura: Prendas ligeras para después ... |

### H5 Editorial 'La belleza de sentirte tú'
| campo | actual | Dev captura | Dev theme-src (efectivo) | resultado |
|---|---|---|---|---|
| eyebrow | Radaelli Swimwear | Radaelli Swimwear | Radaelli Swimwear | IGUAL |
| h2 | La belleza de sentirte tú | La belleza de sentirte tú | La belleza de sentirte tú | IGUAL |
| colección | Oasis Natural (8 primeras por fecha de creación ascendente [DOC]) | oasis-natural (primeras 8) | oasis-natural (limit 8) | misma colección |
| N.º de tarjetas | 8 | 8 | 8 | IGUAL |
| conjunto | costa-esmeralda-azul, brisa-natural-beige, marea-natural, oasis-serena-azul, costa-esmeralda-negro, marea-natural-naranja, arena-dorada-beige, arena-dorada-negro | marea-natural, arena-dorada-beige, marea-natural-naranja, oasis-serena-negro, arena-dorada-negro, brisa-natural-naranja, oasis-serena-azul, costa-esmeralda-negro |  | 6 de 8 en común |
| orden |  |  |  | 0 de 8 posiciones coinciden |
| solo en actual | costa-esmeralda-azul, brisa-natural-beige |  |  |  |
| solo en Dev |  | oasis-serena-negro, brisa-natural-naranja |  |  |
| orden de Oasis en la Dev (completo) |  | marea-natural, arena-dorada-beige, marea-natural-naranja, oasis-serena-negro, arena-dorada-negro, brisa-natural-naranja, oasis-serena-azul, costa-esmeralda-negro, costa-esmeralda-azul, brisa-natural-beige |  |  |

### H5b Tarjetas: producto por producto (actual vs dev-products.jsonl)
| sección | handle | título | precio y anterior | 1.ª imagen | insignia / overlay actual | presencia |
|---|---|---|---|---|---|---|
| editorial | costa-esmeralda-azul | IGUAL | IGUAL | IGUAL | - / - | NO está en la Home Dev |
| editorial | brisa-natural-beige | IGUAL | IGUAL | IGUAL | - / - | NO está en la Home Dev |
| editorial | marea-natural | IGUAL | IGUAL | IGUAL | - / - | en la Home Dev |
| editorial | oasis-serena-azul | IGUAL | IGUAL | IGUAL | - / - | en la Home Dev |
| editorial | costa-esmeralda-negro | IGUAL | IGUAL | IGUAL | - / - | en la Home Dev |
| editorial | marea-natural-naranja | IGUAL | IGUAL | IGUAL | - / - | en la Home Dev |
| editorial | arena-dorada-beige | IGUAL | IGUAL | IGUAL | - / - | en la Home Dev |
| editorial | arena-dorada-negro | IGUAL | IGUAL | IGUAL | - / - | en la Home Dev |
| destacados | entero-golden-hour | IGUAL | IGUAL | IGUAL | Espuma de Ola / Ver producto | en la Home Dev |
| destacados | bikini-shadow-azul-marino | IGUAL | IGUAL | IGUAL | Espuma de Ola / Ver producto | en la Home Dev |
| destacados | raices-del-sol-beige-suave | IGUAL | IGUAL | IGUAL | Aurora Viva / Ver producto | en la Home Dev |
| destacados | alba-dorada-lila | IGUAL | IGUAL | IGUAL | Aurora Viva / Ver producto | en la Home Dev |
| destacados | aurora-total-azul-oscuro | IGUAL | IGUAL | IGUAL | Aurora Viva / Ver producto | en la Home Dev |
| destacados | enterizo-shadow-palm-azul-marino | IGUAL | IGUAL | IGUAL | Espuma de Ola / Ver producto | en la Home Dev |
| destacados | bikini-palm-verde-oliva | IGUAL | IGUAL | IGUAL | Espuma de Ola / Ver producto | en la Home Dev |

### H5c Estructura de la tarjeta por sección
| origen | a | estado | b | estado | c | estado |
|---|---|---|---|---|---|---|
| Editorial actual | insignia de categoría | ausente en las 8 | overlay 'Ver producto' | ausente en las 8 | título | centrado bajo la imagen |
| Destacados actual | insignia de categoría | presente en las 7 | overlay 'Ver producto' | presente en las 7 | título | izquierda, precio a la derecha |
| Dev (snippet product-carousel, usado por editorial, destacados y recomendados) | insignia de categoría | sí (product.type) | overlay 'Ver producto' | sí | título | un solo diseño de tarjeta |

### H6 Destacados 'Productos destacados'
| campo | actual | Dev captura | Dev theme-src (efectivo) | resultado |
|---|---|---|---|---|
| eyebrow | Lo más nuevo | Lo más nuevo | Lo más nuevo | IGUAL |
| h2 | Productos destacados | Productos destacados | Productos destacados | IGUAL |
| id de ancla | #productos | (no capturado) | id="productos" (featured-products.liquid) | IGUAL |
| colección | featured=true menos los de la editorial [DOC] | destacados | destacados |  |
| conjunto | alba-dorada-lila, aurora-total-azul-oscuro, bikini-palm-verde-oliva, bikini-shadow-azul-marino, enterizo-shadow-palm-azul-marino, entero-golden-hour, raices-del-sol-beige-suave | alba-dorada-lila, aurora-total-azul-oscuro, bikini-palm-verde-oliva, bikini-shadow-azul-marino, enterizo-shadow-palm-azul-marino, entero-golden-hour, raices-del-sol-beige-suave |  | IGUAL |
| orden (esta captura) | entero-golden-hour, bikini-shadow-azul-marino, raices-del-sol-beige-suave, alba-dorada-lila, aurora-total-azul-oscuro, enterizo-shadow-palm-azul-marino, bikini-palm-verde-oliva | bikini-palm-verde-oliva, raices-del-sol-beige-suave, aurora-total-azul-oscuro, enterizo-shadow-palm-azul-marino, alba-dorada-lila, bikini-shadow-azul-marino, entero-golden-hour |  | DISTINTO |

### H6b Muestras de la Home actual (¿el orden de destacados cambia entre visitas?)
| archivo | sha256 (12) | orden de destacados | orden editorial | 'Recomendado para' en el HTML |
|---|---|---|---|---|
| current-site/home.html | 0289d9af5d8c | entero-golden-hour, bikini-shadow-azul-marino, raices-del-sol-beige-suave, alba-dorada-lila, aurora-total-azul-oscuro, enterizo-shadow-palm-azul-marino, bikini-palm-verde-oliva | costa-esmeralda-azul, brisa-natural-beige, marea-natural, oasis-serena-azul, costa-esmeralda-negro, marea-natural-naranja, arena-dorada-beige, arena-dorada-negro | 0 |
| 03g-collection-filter-probe/home-sample-1.html | c648fff2cfba | enterizo-shadow-palm-azul-marino, bikini-shadow-azul-marino, raices-del-sol-beige-suave, alba-dorada-lila, entero-golden-hour, bikini-palm-verde-oliva, aurora-total-azul-oscuro | costa-esmeralda-azul, brisa-natural-beige, marea-natural, oasis-serena-azul, costa-esmeralda-negro, marea-natural-naranja, arena-dorada-beige, arena-dorada-negro | 0 |
| 03g-collection-filter-probe/home-sample-2.html | 4e47a6e6192a | aurora-total-azul-oscuro, enterizo-shadow-palm-azul-marino, raices-del-sol-beige-suave, alba-dorada-lila, entero-golden-hour, bikini-palm-verde-oliva, bikini-shadow-azul-marino | costa-esmeralda-azul, brisa-natural-beige, marea-natural, oasis-serena-azul, costa-esmeralda-negro, marea-natural-naranja, arena-dorada-beige, arena-dorada-negro | 0 |
| 03g-collection-filter-probe/home-sample-3.html | e9bf42a80309 | enterizo-shadow-palm-azul-marino, bikini-palm-verde-oliva, raices-del-sol-beige-suave, entero-golden-hour, alba-dorada-lila, bikini-shadow-azul-marino, aurora-total-azul-oscuro | costa-esmeralda-azul, brisa-natural-beige, marea-natural, oasis-serena-azul, costa-esmeralda-negro, marea-natural-naranja, arena-dorada-beige, arena-dorada-negro | 0 |

Órdenes distintos de destacados entre 4 muestras: 4; conjuntos distintos: 1; órdenes distintos de la editorial: 1.
Productos repetidos entre la editorial y destacados: actual 0; Dev 0.

### H7 Recomendados 'Recomendado para vos'
| campo | actual [MEDIDO-03G] | Dev | resultado |
|---|---|---|---|
| sección en el HTML servido | 0 secciones con ese título; 0 apariciones del texto | estado: oculta / vacía (sin colección asignada; decisión editorial C2 de la dueña) | no se ve en ninguno en el HTML |
| componente en el payload | RecommendedForYou montado, excludeSlugs=15 slugs | colección asignada: ninguna; heading por defecto "Recomendado para vos" | distinto: el actual es del lado del cliente |

### H8 Promo
| campo | actual | Dev captura | Dev theme-src (efectivo) | resultado |
|---|---|---|---|---|
| eyebrow | Por tiempo limitado | Por tiempo limitado | Por tiempo limitado | IGUAL |
| h2 | 20% de descuento en toda la tienda | 20% de descuento en toda la tienda | 20% de descuento en toda la tienda | IGUAL |
| texto del CTA | Descubrir la colección | Descubrir la colección | Descubrir la colección | IGUAL |
| destino del CTA | #productos | #categorias | #categorias | DISTINTO |
| letra chica de envío gratis | Envío gratis en compras desde $ 299.900. Ver política de envíos. | (no aparece) | oculta: free_shipping_rate_confirmed=false | DISTINTO (documentado) |
| enlace 'Ver política de envíos' | Ver política de envíos -> /envios | (no aparece) | shipping_policy_url sin cargar | DISTINTO (documentado) |
| umbral de envío gratis | $ 299.900 (texto visible) |  | 299900 | IGUAL |

### H9 Newsletter
| campo | actual | Dev captura | Dev theme-src / locale | resultado |
|---|---|---|---|---|
| eyebrow | Ofertas y novedades | Ofertas y novedades | Ofertas y novedades | IGUAL |
| h2 | Sé la primera en enterarte | Sé la primera en enterarte | Sé la primera en enterarte | IGUAL |
| copy | Dejá tu correo y recibí aviso apenas lancemos nuevas colecciones, promociones y ofertas — sin necesidad de crear una cuenta. | Dejá tu correo y recibí aviso apenas lancemos nuevas colecciones, promociones y ofertas — sin necesidad de crear una cuenta. | Dejá tu correo y recibí aviso apenas lancemos nuevas colecciones, promociones y ofertas — sin necesidad de crear una cuenta. | IGUAL |
| placeholder | tu@email.com | (no capturado) | tu@email.com | IGUAL |
| etiqueta del campo | Correo electrónico | (no capturado) | Correo electrónico | IGUAL |
| botón | Quiero enterarme | Suscribirme | Suscribirme | DISTINTO |
| mensaje de éxito | NOT_VERIFIED (no está en el HTML servido) |  | Listo — te avisamos apenas haya novedades. | n/a |
| formulario (atributos) | action: sin atributo action; method: sin atributo method |  | {% form 'customer' %} con contact[tags]=newsletter (newsletter-home.liquid) | mecánica distinta |

### H10 Footer
| elemento | actual [MEDIDO-03G] | Dev | resultado |
|---|---|---|---|
| logo | imagen (alt "Radaelli Swimwear") | texto: shop.name (settings.logo sin cargar) | DISTINTO |
| descripción de marca | Radaelli Swimwear: trajes de baño de diseño atemporal, hechos para durar, con materiales nobles y una mirada minimalista. | Trajes de baño de diseño atemporal, hechos para durar, con materiales nobles y una mirada minimalista. | DISTINTO |
| redes (pills) | Instagram -> https://instagram.com/Radaelli_swimwear; Facebook -> https://facebook.com/Radaelli_Swimwear; TikTok -> https://tiktok.com/@RadaelliSwimwear; WhatsApp -> https://<wa.me del sitio> | Instagram -> https://instagram.com/Radaelli_swimwear; Facebook -> https://facebook.com/Radaelli_Swimwear; TikTok -> https://tiktok.com/@RadaelliSwimwear; WhatsApp -> (enlace público wa.me del sitio; no se reproduce el número) | mismas 4 redes (URLs iguales; wa.me no se reproduce) |
| columna Comprar | Oasis Natural -> /oasis-natural; Aurora Viva -> /aurora-viva; Espuma de Ola -> /espuma-de-ola; Salidas de Baño -> /salidas-de-bano | Oasis Natural; Aurora Viva; Espuma de Ola; Salidas de Baño | IGUAL |
| columna Ayuda: enlaces | Envíos -> /envios; Devoluciones -> /devoluciones; Garantía -> /garantia; Términos y condiciones -> /terminos; Privacidad -> /privacidad; Cookies -> /cookies | Devoluciones -> /policies/refund-policy; Garantía -> /pages/garantia | Dev tiene 2 de 6 |
| Ayuda: Contacto (redes) | desplegable con 4 enlaces | bloque "contact" en footer-group.json (show_social_channels=true) [DOC]; correo: vacío; la captura ("presente (id=contacto)") solo confirma el ancla del pie, no el HTML del desplegable | presente en ambos según el código; distinta ubicación (Dev: columna propia) |
| columna Empresa | Sobre nosotros -> #contacto; Sostenibilidad -> #contacto; Prensa -> #contacto | no existe | DISTINTO |
| copyright | © 2026 Radaelli Swimwear. Todos los derechos reservados. | © <año> Radaelli Swimwear Dev. Todos los derechos reservados. (deducido: brand_name vacío -> shop.name) | DISTINTO [INFERIDO] |
| ancla #contacto | footer id="contacto" | footer id="contacto" (footer.liquid) | IGUAL |

### H11 Carrito
| elemento | actual | Dev | resultado |
|---|---|---|---|
| disparador | botón 'Carrito' sin href | Carrito (0) -> /cart | presente en ambos |
| página /cart | no existe (404) [DOC: el sitio real no tiene página de carrito] | 200 (dev-routes.json) | DISTINTO (documentado) |
| vacío: título | NOT_VERIFIED (el contenido del carrito no está en el HTML servido) | Tu carrito | sin comparar |
| vacío: texto | NOT_VERIFIED | Tu carrito está vacío. Descubrí la colección y agregá tus favoritos. | sin comparar |

### H12 Banner de cookies
| elemento | actual [MEDIDO-03G] | Dev | resultado |
|---|---|---|---|
| banner | Usamos cookies esenciales para que la tienda funcione (carrito, sesión, pagos). Con tu permiso, también podríamos usar cookies de análisis y de publicidad más adelante, para entender mejor tu experiencia de compra. Botones: Aceptar todas / Rechazar no esenciales / Configurar | el theme no renderiza ningún banner (0 menciones de consent/customer_privacy en layout, sections, snippets, assets, templates); la captura dev-home.json no lo registra | DISTINTO |

### H13 Dónde se ve el nombre de la Dev Store
| lugar | evidencia | etiqueta |
|---|---|---|
| <title> de la Home | Radaelli Swimwear Dev | [MEDIDO-03G] |
| og:site_name / og:title | og:site_name=Radaelli Swimwear Dev; og:title=Radaelli Swimwear Dev | [MEDIDO-03G] |
| logo de texto de la cabecera | Radaelli Swimwear Dev | [MEDIDO-03G] |
| pie: logo de texto, aria-label y copyright | usa shop.name (settings.logo sin cargar; footer brand_name vacío) | [DOC: footer.liquid] + [INFERIDO] |
| archivos del theme que usan shop.name | layout/password.liquid: 1; layout/theme.liquid: 3; sections/footer.liquid: 6; sections/header.liquid: 6; sections/main-password.liquid: 2 | [DOC: theme-src] |

### H14 Voseo y tuteo en los textos de la Home
| origen | lugar | texto | formas de voseo | formas de tuteo |
|---|---|---|---|---|
| actual | hero: CTA | Compra de forma sostenible | - | Compra |
| actual | categorías: eyebrow | Explora | - | Explora |
| actual | editorial: h2 | La belleza de sentirte tú | - | tú |
| actual | newsletter: h2 | Sé la primera en enterarte | - | - |
| actual | newsletter: copy | Dejá tu correo y recibí aviso apenas lancemos nuevas colecciones, promociones y ofertas — sin necesidad de crear una cuenta. | Dejá, recibí | - |
| actual | cookies: texto | Usamos cookies esenciales para que la tienda funcione (carrito, sesión, pagos). Con tu permiso, también podríamos usar cookies de análisis y de publicidad más adelante, para entender mejor tu experiencia de compra. | - | - |
| Dev | hero: CTA | Compra de forma sostenible | - | Compra |
| Dev | categorías: eyebrow (locale) | Explora | - | Explora |
| Dev | editorial: h2 | La belleza de sentirte tú | - | tú |
| Dev | newsletter: h2 | Sé la primera en enterarte | - | - |
| Dev | newsletter: copy | Dejá tu correo y recibí aviso apenas lancemos nuevas colecciones, promociones y ofertas — sin necesidad de crear una cuenta. | Dejá, recibí | - |
| Dev | newsletter: éxito (locale) | Listo — te avisamos apenas haya novedades. | - | - |
| Dev | carrito vacío: texto (locale) | Descubrí la colección y agregá tus favoritos. | Descubrí, agregá | - |
| Dev | recomendados: título por defecto (oculto) | Recomendado para vos | vos | - |

Lista de formas de voseo buscadas: Dejá, recibí, Descubrí, agregá, Guardá, Escribí, Podés, Elegí, Probá, Intentá, Revisá, Recargá, Activá, Ingresá, ingresala, tenés, vos. Lista de formas de tuteo buscadas: Explora, Compra, Descubre, Agrega, Deja, Recibe, Guarda, Escribe, Puedes, Elige, Prueba, Intenta, Revisa, Recarga, Activa, tú. Es una búsqueda por palabras; 'Compra' y 'Explora' se cuentan como imperativo de tú [INFERIDO].

Alcance en todo theme-src/locales/es.default.json (163 textos): 16 con formas de voseo (general.wishlist.empty_text, general.wishlist.load_error, general.wishlist.no_js, general.wishlist.sync_expired, general.search.empty_title, general.search.empty_text, general.search.no_results_text, general.password.message, general.password.error, general.password.admin_link, cart.general.empty_text, cart.general.error_generic, cart.general.error_add, cart.general.error_network, products.product.select_size_error, products.product.select_option_error); 1 con formas de tuteo (general.categories.eyebrow).

### H15 Enlaces internos de la Home actual frente a las 47 redirecciones
| ruta enlazada | estado |
|---|---|
| / | raíz (sin redirección) |
| /aurora-viva | redirección exacta en seo/shopify-redirects-import.csv |
| /buscar | redirección exacta en seo/shopify-redirects-import.csv |
| /cookies | SIN redirección en las 47 |
| /cuenta/iniciar-sesion | redirección exacta en seo/shopify-redirects-import.csv |
| /devoluciones | redirección exacta en seo/shopify-redirects-import.csv |
| /envios | SIN redirección en las 47 |
| /espuma-de-ola | redirección exacta en seo/shopify-redirects-import.csv |
| /favoritos | redirección exacta en seo/shopify-redirects-import.csv |
| /garantia | redirección exacta en seo/shopify-redirects-import.csv |
| /oasis-natural | redirección exacta en seo/shopify-redirects-import.csv |
| /privacidad | SIN redirección en las 47 |
| /producto/COSTA-ESMERALDA-AZUL | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/alba-dorada-lila | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/arena-dorada-beige | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/arena-dorada-negro | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/aurora-total-azul-oscuro | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/bikini-palm-verde-oliva | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/bikini-shadow-azul-marino | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/brisa-natural-beige | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/costa-esmeralda-negro | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/enterizo-shadow-palm-azul-marino | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/entero-golden-hour | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/marea-natural | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/marea-natural-naranja | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/oasis-serena-azul | redirección exacta en seo/shopify-redirects-import.csv |
| /producto/raices-del-sol-beige-suave | redirección exacta en seo/shopify-redirects-import.csv |
| /salidas-de-bano | redirección exacta en seo/shopify-redirects-import.csv |
| /terminos | SIN redirección en las 47 |

### H16 Orden de secciones
| sección | posición actual (main) | posición Dev (templates/index.json) | posición Dev capturada (dev-home.json) |
|---|---|---|---|
| hero | 1 | 1 | 1 |
| featured-categories | 2 | 2 | 2 |
| featured-collection-editorial | 3 | 3 | 3 |
| featured-products | 4 | 4 | 4 |
| recommended-products | no está en el HTML servido | 5 | 5 |
| promo-banner | 5 | 6 | 6 |
| newsletter-home | 6 | 7 | 7 |

### H17 Activos de marca en el repo frente a content/media/media-migration-manifest.csv
| archivo del repo | estado | fila del manifiesto |
|---|---|---|
| public/logo/radaelli-swimwear.png | existe (229512 bytes) | no figura en el manifiesto (M01 a M14) |
| app/icon.png | existe (249397 bytes) | no figura en el manifiesto (M01 a M14) |
| app/favicon.ico | existe (6437 bytes) | no figura en el manifiesto (M01 a M14) |
| app/apple-icon.png | existe (31380 bytes) | no figura en el manifiesto (M01 a M14) |
| app/opengraph-image.tsx | existe (138 bytes) | no figura en el manifiesto (M01 a M14) |

Filas del manifiesto que mencionan logo, favicon, icono, opengraph o social: ninguna. Filas totales del manifiesto: 14. Setting del theme para el logo: settings.logo (sin cargar); favicon: settings.favicon (sin cargar).
Archivos únicos que usa la Home en el manifiesto: M01, M03, M04, M05, M07, M08, M09 (7; M06 es el mismo archivo que M01 según la nota del manifiesto; M07 es opcional).

### H18 Coherencia captura RC1.7 frente a theme-src RC1.8 (secciones de la Home)
| comprobación | coincide |
|---|---|
| hero h1 | sí |
| hero sub | sí |
| hero CTA | sí |
| hero fallback = sin hero_video | sí |
| editorial h2 | sí |
| editorial colección | sí |
| destacados h2 | sí |
| destacados colección | sí |
| recomendados sin colección | sí |
| promo h2 | sí |
| promo CTA | sí |
| newsletter copy | sí |
| newsletter botón | sí |
| anuncio | sí |
| tagline pie | sí |
| orden de secciones | sí |

Escrito: launch/evidence/03g-home-parity.json

## Anexo B — Salida literal de la verificación (`launch/tools/03g-home-parity-verify.mjs`)

### V1 theme-src y manifiestos de release
| comprobación | resultado |
|---|---|
| ZIP RC1.8 (SHA-256 del manifiesto) | e893b386f1022b7aaa618c86b07eeb5d23f43f2e89c6ddc493f7c5a485fd9e67 |
| archivos del manifiesto RC1.8 | 96 |
| archivos de theme-src que coinciden por SHA-256 con el manifiesto RC1.8 | 96 de 96 |
| archivos que difieren entre los manifiestos RC1.7 y RC1.8 | 1: sections/main-product.liquid |

### V2 Pie: panel desplegable de Contacto
| lado | enlaces | texto visible por enlace |
|---|---|---|
| actual [MEDIDO-03G] (home.html, <details>) | 4 | @Radaelli_swimwear ; Radaelli_Swimwear ; @RadaelliSwimwear ; <numero-redactado> |
| Dev [DOC] (footer.liquid, panel de contacto) | 4 | solo el nombre de la red: Instagram, Facebook, TikTok, WhatsApp; texto con usuario o número: no |
| Dev [DOC] (footer-group.json, bloque contacto) |  | heading "Contacto"; contact_email vacío; show_social_channels true |
| Dev [DOC] (footer.liquid): etiqueta del <summary> |  | clave general.contact.title = "Contacto" (el bloque además imprime el heading; misma palabra dos veces) [INFERIDO] |

### V3 <title> de la Home según theme.liquid
| escenario | page_title | shop.name | <title> resultante | ¿igual al actual? |
|---|---|---|---|---|
| captura Dev hoy [MEDIDO-03G] | Radaelli Swimwear Dev | Radaelli Swimwear Dev | Radaelli Swimwear Dev (medido) | no |
| tras renombrar la tienda y cargar el título actual en Preferencias [INFERIDO] | Trajes de baño de diseño en Colombia | Radaelli Swimwear | Trajes de baño de diseño en Colombia – Radaelli Swimwear | no |

Regla de sufijo presente en layout/theme.liquid (unless page_title contains shop.name): sí. Título actual medido: "Trajes de baño de diseño en Colombia".

### V3b Metas og:* y twitter:*
| fuente | etiquetas |
|---|---|
| actual [MEDIDO-03G] (home.html) | og:description, og:image, og:image:type, og:site_name, og:title, og:type, og:url, twitter:card, twitter:description, twitter:image, twitter:image:type, twitter:title |
| Dev [DOC] (layout/theme.liquid; algunas condicionadas a page_description o page_image) | og:description, og:image, og:image:width, og:site_name, og:title, og:url, twitter:card |
| Dev [MEDIDO-03G] (dev-home.json, lista og de la captura) | og:site_name, og:url, og:title |
| en el actual y no en theme.liquid | og:image:type, og:type, twitter:description, twitter:image, twitter:image:type, twitter:title |

### V4 Destinos legales en la Dev [MEDIDO-03G]
| ruta | estado | nota de la captura |
|---|---|---|
| /policies/privacy-policy | 200 | política de privacidad AUTOGENERADA por Shopify (no es el texto verbatim del sitio actual) — revisar con B2 legales |
| /policies/terms-of-service | 404 | términos pendientes (owner B2) |
| /policies/shipping-policy | 404 | envíos pendientes (owner B2) |
| /policies/refund-policy | 200 |  |
| /pages/garantia | 200 |  |
| /pages/envios, /pages/privacidad, /pages/terminos, /pages/cookies | 404 | rutas de páginas legales no creadas (owner B2); las redirecciones /envios,/privacidad,/terminos,/cookies NO están en las 47 (4 legales 'pending') |

### V4b Redirecciones importadas para las 4 rutas legales del pie actual
| ruta actual | ¿está entre las 47? |
|---|---|
| /envios | no |
| /terminos | no |
| /privacidad | no |
| /cookies | no |

### V5 Columna Empresa: fuente documentada (theme/03D-legal-policies-inventory.md)
| línea | texto |
|---|---|
| 55 | 2. **No existen** como página: Contacto, Ayuda/FAQ, Sobre nosotros, Sostenibilidad, Prensa, Compartir datos (data sharing), Aviso legal. "Contacto" es un menú desplegable (`APP/components/layout/contact-menu.tsx:22-57`) y "Sobre nosotros / Sostenibilidad / Prensa" apuntan a `#contacto` (el propio fo |
| 77 | \| 10 \| Sobre nosotros / Sostenibilidad / Prensa \| No existen; enlaces a `#contacto` (`APP/components/layout/footer.tsx:24-26`) \| NO \| NOT_AVAILABLE \| — \| — \| Los 3 enlaces del footer apuntan al propio footer \| — \| |
| 140 | \| Sobre nosotros / Sostenibilidad / Prensa \| — \| **NOT_AVAILABLE** \| Hoy son enlaces a `#contacto` (`APP/components/layout/footer.tsx:24-26`); en Shopify no deberían ir al menú del footer hasta que exista contenido \| |

### V5b M06 frente a M01 en el manifiesto de media
| dato | M01 | M06 |
|---|---|---|
| bytes | 3657361 | 3657361 |
| nota de M06 |  | Mismo ETag y tamaño que M01 (muy probablemente el mismo archivo: subir una sola vez) |

