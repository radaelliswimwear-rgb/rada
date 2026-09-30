# 03D — Auditoría de assets faltantes (estado al cierre de 03D)

> **Estado 03D (2026-09-29, 11:15 Bogotá).**
> - **Destacados: HECHO.** Se usó la opción (a), paridad visual. Colección manual "Destacados" (`destacados`) con los 7 productos visibles hoy en la Home real: los 10 flags `featured` menos los 3 de Oasis Natural que excluye `app/page.tsx:55-67`. Está conectada a `featured-products` en `templates/index.json`. Verificado en la tienda real: 7 tarjetas, 0 repetidas con la editorial, 0 overflow. El orden es fijo, mientras el sitio real baraja en cada visita.
> - **"Recomendado para vos": FALLBACK.** No existe una selección curada (es aleatoria y usa `localStorage`). La sección queda sin colección, así que no se muestra. Queda una decisión editorial para Daniela.
> - **Media (Hero, tarjetas, banners, guía de tallas): NO migrada. `DEFERRED_OWNER_ONLY_BLOCKER`.**
>   - Todas las fuentes existen, con URL exacta y procedencia (tabla §2).
>   - Para asignarlas al theme o a metafields tienen que estar en Shopify > Contenido > Archivos. Eso exige descargar los 12–13 archivos del Cloudinary propio y subirlos, o una app con `fileCreate`, que está diferida.
>   - Descargar y subir archivos requiere el OK explícito de Daniela.
>   - El manifiesto listo para ejecutar está en `content/media/media-migration-manifest.csv`.
> - Los archivos de evidencia `[S3D]` viven en el scratchpad de la sesión, que es efímero. Los valores críticos (URLs, dimensiones, encuadres y hashes) están copiados en este documento.

---


- **Fecha:** 2026-09-29. La captura fresca del sitio se hizo a las 15:33 UTC.
- **Modo:** solo lectura sobre el proyecto. No se editó ningún archivo del repo ni del theme. No se usaron git (escritura), Shopify CLI, npm ni navegador.
- **Secretos:** en la raíz del repo existen `.env`, `.env.local` y `.env.test`. **No se abrieron ni se imprimieron sus valores.** Una búsqueda del nombre de la cuenta de Cloudinary encontró coincidencia en `.env`; solo se registra que el archivo existe.

## 0. Alias, método y niveles de evidencia

| Alias | Ruta |
|---|---|
| `[NX]` | `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main` (código del sitio en vivo) |
| `[MIG]` | `[NX]/.claude/worktrees/shopify-migration-prep/shopify-migration` |
| `[TH]` | `[MIG]/theme-src` |
| `[S3C]` | `C:/Users/user/AppData/Local/Temp/claude/C--CLAUDE-rada-main-rada-main/34c11d0a-7250-45aa-b727-3081da1b069a/scratchpad/03c` |
| `[S3D]` | `.../scratchpad/03d` (esta carpeta) |

**Métodos usados.** Todos son pasivos y no crean ni modifican nada:

- **LIVE-03C:** HTML guardado en 03C (`[S3C]/nav-home_live-home*.html` ×5 y `nav-home_live-salidas.html`).
- **LIVE-03D:** GET público con curl (sin JS ni cookies) de `/oasis-natural`, `/aurora-viva`, `/espuma-de-ola`, `/salidas-de-bano`, `/producto/brisa-natural-beige` y `/producto/raices-del-sol-beige-suave`. Todas las respuestas fueron HTTP 200.
  - Archivos: `[S3D]/live-*.html`.
  - SHA-256: oasis `a738184a…`, aurora `423ffadc…`, espuma `b57c6907…`, salidas `e269bea0…`, PDP brisa `f4a39e00…`, PDP raíces `9ca0fdc8…`.
- **HEAD:** solo cabeceras (status, tipo, tamaño, ETag) de las 14 URLs de media (`[S3D]/media-urls.txt` → `[S3D]/media-head.txt`).
- **RANGE-32:** se leyeron solo los primeros 32 bytes de cada PNG, para sacar ancho y alto del IHDR (`[S3D]/png-dims.mjs` → `[S3D]/png-dims.txt`).
- **Offsets:** los HTML son de una sola línea. Por eso se citan como `archivo:1 @byte N` (índice en `[S3D]/evidence-index.json`, generado por `[S3D]/evidence-index.mjs`).

**Niveles de evidencia**

| Nivel | Qué significa |
|---|---|
| CODE | Leído en el código. |
| LIVE | Leído en HTML público o en el payload RSC. |
| HEAD / RANGE | Leído en cabeceras HTTP o en bytes de cabecera del archivo. |
| INFERENCIA | Deducción explícita. |
| NOT_AVAILABLE | No existe fuente. |

## 1. Hallazgo central

1. **Ninguno de los assets que 03C marcó NOT_AVAILABLE vive en el código ni en `public/`**, salvo el poster de la tarjeta Espuma de Ola.
   - Son valores **solo de base de datos**: filas `Settings`, `Category` y `Product.featured` en Postgres.
   - Los campos: `[NX]/prisma/schema.prisma:1150-1153`, `:1162-1167`, `:163-202` y `:224`.
   - El código no trae defaults de media: si el campo es `null`, el sitio cae a un arte decorativo (`[NX]/lib/currency/settings-actions.ts:170-191`; `[NX]/components/home/hero.tsx:83-111`; `[NX]/components/catalog/catalog-page.tsx:139-141`).
   - El seed tampoco los carga: solo siembra nombres de categorías y productos de ejemplo (`[NX]/prisma/seed.ts:10-65`).
   - La única migración con datos cambia `active` y nada de media (`[NX]/prisma/migrations/20260811040000_active_toggle/migration.sql:10-11`).
2. **Aun así, todos los valores reales se pueden recuperar con URL exacta**, porque el sitio los sirve públicamente en el HTML y en el payload RSC.
   - **Corrección a 03C:** 03C dice "archivos NOT_AVAILABLE" (`[MIG]/theme/03C-catalog-import-report.md:85`, `:148-149`). Eso es cierto **para los exports** de migración: ningún public_id aparece en `[MIG]` (búsqueda sin coincidencias en `*.csv`, `*.json` y `*.md`). **No** es cierto para el sitio en vivo.
3. **El flag `featured` ya no es inferido sino observado:** **10 productos tienen `featured=true`**, no 7. Los 3 de Oasis Natural no aparecen en "Productos destacados" porque la vidriera editorial los excluye (sección 5).
4. **La guía de tallas real existe:** es 1 PNG de 1024 × 1536 y solo se muestra en productos de Oasis Natural (sección 4).

## 2. Tabla principal

| # | Asset | ¿Encontrado? | Fuente exacta | Procedencia | Acción recomendada |
|---|---|---|---|---|---|
| 1 | Hero: video | **Sí** (LIVE) | Guardado: `https://res.cloudinary.com/n8l3p85c/video/upload/v1789352946/lago/home/bb70lfnhpbl4h8ee7mdz.mp4`. Servido: la misma URL con `f_auto,q_auto/` | DB `Settings.heroVideoUrl` (`schema.prisma:1162`), sin default en código (`settings-actions.ts:105-113`, `:178`). Render en `hero.tsx:32-57`, transformación en `lib/cloudinary/video-url.ts:6-9`. LIVE: `[S3C]/nav-home_live-home.html:1 @byte 16266` (igual en las 5 muestras) | **Migrar** a Shopify Files y asignarlo en `hero_video` (`[TH]/sections/hero.liquid:66-70`). Ver notas 3.1 |
| 2 | Hero: poster | **Sí** (LIVE) | `https://res.cloudinary.com/n8l3p85c/image/upload/v1789409333/lago/products/cerhqv59kh6iedegvatv.png`. PNG de 1920 × 1080 y 2.435.496 bytes (RANGE/HEAD) | DB `Settings.heroPosterUrl` (`schema.prisma:1164-1167`). Render como `poster` en `hero.tsx:50`. LIVE: `nav-home_live-home.html:1 @byte 16498` | **Fallback:** el theme no tiene campo de poster; usa la vista previa que genera Shopify (`hero.liquid:9-13`, `:69`). Conservar el archivo como referencia. Si se exige el mismo poster: **REQUIRES_DECISION** (cambio de theme) |
| 3 | Tarjeta Oasis Natural: imagen | **Sí** | `…/image/upload/v1787460154/lago/products/zjlcdrptowzxnmcz7ixf.jpg`. JPEG de 1600 × 2400 y 212.142 bytes | DB `Category.coverImageUrl/Width/Height` (`schema.prisma:163-173`), que pisa al fallback de código `/images/products/002.webp` (`lib/categories.ts:56`) en `categories-section.tsx:21-32`. Hoy solo funciona como **poster** del video (`category-card.tsx:61`). LIVE: `nav-home_live-home.html:1 @byte 139332` | **Migrar** al `image` del bloque `oasis-natural` (`[TH]/sections/featured-categories.liquid:122-127`); hoy el bloque no lo tiene (`[TH]/templates/index.json:11-44`) |
| 4 | Tarjeta Oasis Natural: video | **Sí** | `…/video/upload/v1789352898/lago/categories/xxjjwoori52cmkbgu33n.mp4`. MP4 HEVC (`hvc1`) de 3.503.495 bytes | DB `Category.coverVideoUrl` (`schema.prisma:187-188`). Subido a `lago/categories` (`lib/cloudinary/upload-actions.ts:362-366`). LIVE: payload RSC `@byte 139332`. En el SSR solo sale el `poster`, porque el `src` se asigna en el cliente (`category-card.tsx:31-52`, `:60`) | **Migrar** al `video` del bloque (`featured-categories.liquid:128-133`) |
| 5 | Tarjeta Oasis Natural: encuadre | **Sí**, pero no se ve | posX **32.558139534883715**, posY **24.36234732855508**, zoom **1.15** | DB `coverImagePosX/PosY/Zoom` (`schema.prisma:178-180`). **No se renderiza**: con video gana la rama video (`category-card.tsx:56-68`) sobre la de encuadre (`:69-88`). LIVE `@byte 139332` | **Fallback, no migrar:** es invisible hoy y el bloque del theme no tiene campos de encuadre (`featured-categories.liquid:104-140`). Documentar el valor |
| 6 | Tarjeta Aurora Viva: imagen | **Sí** | `…/image/upload/v1787399722/lago/products/zdxbjacneyll6npdosdu.png`. PNG de 1086 × 1448 y 1.926.745 bytes | DB `coverImageUrl` (pisa `/images/products/1.webp`, `lib/categories.ts:66`). Poster del video. LIVE `@byte 139988` | **Migrar** al `image` del bloque `aurora-viva` |
| 7 | Tarjeta Aurora Viva: video | **Sí** | `…/video/upload/v1789352892/lago/categories/gm4fm2tiwgc2vlu93s7a.mp4`. MP4 HEVC de 3.657.361 bytes. **Mismo ETag (`b53a3029…`) y mismo tamaño que el video del Hero** | DB `coverVideoUrl`. LIVE `@byte 139988`. HEAD: `[S3D]/media-head.txt` | **Migrar** al `video` del bloque. INFERENCIA (alta): es el mismo archivo que el Hero, así que alcanza con subirlo una vez a Shopify |
| 8 | Tarjeta Aurora Viva: encuadre | **Sí**, pero no se ve | posX **50**, posY **100**, zoom **1** | DB. No se renderiza (hay video, igual que la fila 5). LIVE `@byte 139988` | **Fallback, no migrar** (igual que la fila 5) |
| 9 | Tarjeta Espuma de Ola: imagen | **No en DB**; se usa un archivo de `public/` | DB `coverImageUrl = null`, con `coverImageWidth 1200` / `Height 1600` **huérfanos**. El sitio cae a `/images/products/1 (1).webp` (`lib/categories.ts:76`) como poster | `categories-section.tsx:21-23` (sin URL no hay encuadre). Los huérfanos se explican porque `removeCategoryImageAction` borra URL y encuadre pero no las dimensiones (`lib/admin/categories-actions.ts:258-266`). LIVE: `nav-home_live-home.html:1 @byte 104376` (fila de categorías) y `@byte 20915` (poster) | **Migrar** el archivo `public/images/products/1 (1).webp` (ver sección 6) al `image` del bloque, o **fallback** a `collection.featured_image` (`featured-categories.liquid:41`) |
| 10 | Tarjeta Espuma de Ola: video | **Sí** | `…/video/upload/v1789351596/lago/categories/nnohfbsoqzgee20xooog.mov`. **QuickTime `.mov`** HEVC de 3.243.324 bytes | DB `coverVideoUrl`. LIVE `@byte 140624` | **Migrar** al `video` del bloque. Verificar que Shopify acepte el `.mov`/HEVC (no verificado) |
| 11 | Tarjeta Espuma de Ola: encuadre | N/A | posX 50, posY 50, zoom 1 (defaults tras quitar la imagen) | `categories-actions.ts:263-265`. LIVE `@byte 104376` | Nada que migrar |
| 12 | Tarjeta Salidas de Baño: imagen | **Sí** | `…/image/upload/v1787417190/lago/products/gz9ken66as28i5hresne.png`. PNG de 1086 × 1448 y 1.665.952 bytes | DB `coverImageUrl` (pisa `/images/products/002.webp`, `lib/categories.ts:86`). Es la **única tarjeta que se ve con encuadre** (`category-card.tsx:69-88`). LIVE `@byte 22170` (background-image) y `@byte 141083` | **Migrar** al `image` del bloque `salidas-de-bano`. **Crítico:** la colección tiene 0 productos (`[MIG]/collections/collections-master.csv:5`), así que `collection.featured_image` queda vacía y la tarjeta en Shopify saldría **sin media** (`featured-categories.liquid:41`, `:53-55`) |
| 13 | Tarjeta Salidas de Baño: video | **No existe** | `coverVideoUrl = null` | LIVE `@byte 104376` | Nada que migrar |
| 14 | Tarjeta Salidas de Baño: encuadre | **Sí** y **se ve** | posX **65.98837209302326**, posY **100**, zoom **1.25**. CSS servido: `background-position:65.98837209302326% 100%; background-size:125% 296.29629629629625%` | DB `coverImagePosX/PosY/Zoom`. Cálculo en `lib/image-framing.ts:26-51` con marco de 16:9 (`:7-8`). LIVE `@byte 22170` | **Fallback:** el theme solo tiene recorte centrado. `section-categories.css:37` define 16:9, pero no hay campo de encuadre ni se usa el `focal_point` (búsqueda de `focal`/`presentation` sin coincidencias en `[TH]/snippets` y `[TH]/sections`). Paridad exacta = **REQUIRES_DECISION** (cambio de theme o imagen pre-recortada) |
| 15 | Banner Oasis Natural (`/oasis-natural`) | **Sí** | Imagen `…/image/upload/v1787460207/lago/products/x95tyqydlvieasp7whfn.jpg` (2400 × 1600, 236.935 bytes). posX **50**, posY **26.689976689976692**, zoom **1**. **Sin video** | DB `Category.bannerImage*` (`schema.prisma:191-197`) vía `catalog-actions.ts:632-667`. Render en `catalog-page.tsx:130-138` + `category-banner-background.tsx:20-69`. LIVE-03D: `[S3D]/live-oasis-natural.html:1 @byte 131714`. 0 `<video>` | **Migrar** a los metafields `custom.cover_image` + `image_pos_x` / `image_pos_y` / `zoom` de la colección (`[TH]/snippets/collection-banner.liquid:9-13`, `:32-36`, `:52-59`; definiciones ya creadas en 03C, `03C-catalog-import-report.md:83`). `cover_video` vacío |
| 16 | Banner Aurora Viva | **Sí** | `…/image/upload/v1787420066/lago/products/c9gz6yuipjnowjyp3amd.jpg` (1920 × 800, 552.930 bytes). posX **43.932724252491695**, posY **69.97684658575744**, zoom **1.4**. Sin video | Igual que la fila 15. LIVE-03D: `[S3D]/live-aurora-viva.html:1 @byte 145747` | **Migrar** (igual que la fila 15) |
| 17 | Banner Espuma de Ola | **Sí** | `…/image/upload/v1787417045/lago/products/n9to8ksgrw1xmxlxm2ch.jpg` (1920 × 800, 573.723 bytes). posX **53.68217054263566**, posY **55**, zoom **1**. Sin video | Igual que la fila 15. LIVE-03D: `[S3D]/live-espuma-de-ola.html:1 @byte 110970` | **Migrar** (igual que la fila 15) |
| 18 | Banner Salidas de Baño | **Sí** | `…/image/upload/v1787460295/lago/products/grhrfruybukvqgk6ngrc.jpg` (**4672 × 7008 = 32,7 MP**, 6.857.621 bytes). posX **61.62790697674419**, posY **59.97214446504011**, zoom **1.15**. Sin video | Igual que la fila 15. LIVE-03C: `[S3C]/nav-home_live-salidas.html:1 @byte 63133`. LIVE-03D: `[S3D]/live-salidas-de-bano.html:1 @byte 62982` (mismos valores) | **Migrar con límite de resolución:** supera el máximo de Shopify (5000 px / 25 MP, `03C-catalog-import-report.md:19`). Usar la misma entrega `c_limit,w_5000,h_5000,q_95` que en 03C (`:20`). El encuadre depende solo de la relación de aspecto (`image-framing.ts:32-44`), que `c_limit` conserva, así que los valores siguen sirviendo |
| 19 | Guía de tallas: imagen | **Sí** | `https://res.cloudinary.com/n8l3p85c/image/upload/v1788989645/lago/products/gaattbpghl9loslphqz6.png` (public_id `lago/products/gaattbpghl9loslphqz6`, PNG de **1024 × 1536**, 1.446.367 bytes) | DB `Settings.sizeGuideImage*` (`schema.prisma:1150-1153`; mapeo en `settings-actions.ts:90-101`, sin default, `:177`). LIVE-03D: `[S3D]/live-producto_brisa-natural-beige.html:17 @byte 109313`, con el botón en `:16 @byte 26137` | **Migrar** a Files y configurar el respaldo de `main-product`: `size_guide_image` + `size_guide_collection = oasis-natural` (`[TH]/sections/main-product.liquid:415-430`, lógica en `:44-65`). Alt "Guía de tallas" (`[NX]/components/product-detail/size-guide-modal.tsx:89`) |
| 20 | Guía de tallas: alcance | **Sí** | Solo productos de **Oasis Natural** | `[NX]/components/product-detail/product-detail.tsx:34-40`. LIVE-03D: un PDP de Aurora Viva trae `sizeGuideImage:null` (`[S3D]/live-producto_raices-del-sol-beige-suave.html:20 @byte 109188`) y 0 apariciones de "Guía de tallas" | Replicar con `size_guide_collection` (fila 19) |
| 21 | Guía de tallas: contenido de texto | **NOT_AVAILABLE**: no existe | El modal real solo muestra el título y la imagen (`size-guide-modal.tsx:84-94`) | CODE | **Fallback:** dejar `content` / `size_guide_content` vacío. No inventar texto |
| 22 | Destacados: flag `featured` | **Sí** (LIVE, observado) | **10 `true`** de 29 (lista en la sección 5) | DB `Product.featured` (`schema.prisma:224`), leído en `catalog-actions.ts:180-195`. Observado en el payload RSC de las 3 colecciones y de la home (`[S3D]/featured-flags.json`; verificación sin cruces entre productos en `[S3D]/featured-verify.txt`) | **Migrar como colección manual "Destacados"** (el theme exige colección: `[TH]/sections/featured-products.liquid:7-12`). Qué conjunto usar = **REQUIRES_DECISION** (sección 5) |
| 23 | Destacados: conjunto visible en la home | **Sí** | 7 productos (los 10 con `featured=true`, menos los 3 de Oasis que ya salen en la editorial) | Exclusión en `app/page.tsx:55-67` con `SUNSET_PAGE_SIZE = 8` (`components/home/sunset-collection.tsx:8`). Con 7 no se agrega relleno (`catalog-actions.ts:173`, `:202`); solo cambia el orden (`:223-225`). LIVE-03C: 5/5 muestras (`[S3C]/nav-home-live-evidence.json`, `featuredSamples`) | Ver sección 5 |
| 24 | "Recomendado para vos" | **NOT_AVAILABLE**: no existe una selección curada | Es algorítmico y aleatorio: excluye la editorial, los destacados y lo visto; se arma con el historial de `localStorage` | `components/home/recommended-for-you.tsx:27-42`; `catalog-actions.ts:366-421` | **Fallback:** colección estática (`[TH]/sections/recommended-products.liquid:11-15`, `:20`) curada por Daniela, o dejar la sección sin colección como en 03C (`03C-catalog-import-report.md:93`). No inventar la lista |
| 25 | `featured` del seed / placeholder | Sí, pero **no son productos reales** | 8 productos de ejemplo con `featured: true` (abrigo, camisa, vestido, blazer, bolso, pantalón, falda y cinturón; `lib/placeholder-data.ts:88-228`) | Sembrados por `prisma/seed.ts:33-65` (`featured` en `:46` y `:56`). El export `featuredProducts` (`placeholder-data.ts:439-441`) no se usa en `app/`, `components/` ni `lib/`. No aparecen en ningún HTML en vivo (los 29 observados son todos reales) | **No migrar** |

## 3. Detalle: Hero y tarjetas (media de la home)

### 3.1 Video del Hero

- **Cómo se sirve:** HEAD de la URL guardada = `video/mp4;codecs=hvc1` (HEVC), 3.657.361 bytes. La URL servida (`f_auto,q_auto`) devolvió `avc1` (H.264), 2.126.124 bytes, para el agente de curl (`[S3D]/media-head.txt`).
  - `f_auto` elige el códec según el navegador (`[NX]/lib/cloudinary/video-url.ts:1-9`), así que otro navegador puede recibir otra variante (INFERENCIA).
- **Recomendación:** subir a Shopify el archivo original como master.
  - Si Shopify rechaza el HEVC o lo reproduce mal, usar el derivado H.264 servido.
  - Que Shopify transcodifique el video **no está verificado** en esta auditoría.
- **Poster:** es independiente del video.
  - En el sitio, Daniela lo sube por separado a la carpeta `lago/products` (`upload-actions.ts:22`).
  - El video va a `lago/home` (`:356-360`).
- **Versiones de Cloudinary:** el `v` de la URL parece un timestamp de subida (INFERENCIA).
  - Video: 2026-09-14 02:29 UTC.
  - Poster: 2026-09-14 18:08 UTC.
- **Textos:** coinciden con los defaults del código (`hero.tsx:6-12`; LIVE `[S3C]/nav-home-live-evidence.json`, `mainSections[0]`). No hay media faltante en ellos.

### 3.2 Tarjetas de "Categorías destacadas"

**Qué se muestra hoy en cada tarjeta** (`category-card.tsx:54-97`)

| Tarjeta | Qué se ve hoy | Evidencia |
|---|---|---|
| Oasis Natural | Video MP4 con poster JPG de Cloudinary | `@byte 139332` |
| Aurora Viva | Video MP4 (idéntico al del Hero) con poster PNG de Cloudinary | `@byte 139988` |
| Espuma de Ola | Video `.mov` con poster = archivo local `/images/products/1 (1).webp` | `@byte 140624`, `@byte 20915` |
| Salidas de Baño | Imagen PNG con encuadre (sin video) | `@byte 22170`, `@byte 141083` |

**Dos datos que la tarjeta recibe pero no dibuja** (INFERENCIA desde el código)

- Los encuadres de Oasis Natural y Aurora Viva están en la DB y llegan al componente, pero no se dibujan.
- En el sitio, el poster del video es la imagen de portada (`category-card.tsx:61`). En el theme, `video_tag` usa la vista previa de Shopify (`featured-categories.liquid:51-52`). Mientras el video carga, el poster se verá distinto (divergencia menor).

**Trampa de nombres.** En el theme, los metafields de colección `custom.cover_image` / `cover_video` / `image_pos_x` / `image_pos_y` / `zoom` alimentan el **banner de la página de colección** (`collection-banner.liquid:9-19`). Equivalen a `bannerImage*` / `bannerVideo*` del sitio, **no** a `coverImage*`.

- En el sitio, `coverImage*` es la **tarjeta de la home** (`schema.prisma:157-162`). En el theme, esa tarjeta usa los settings `image`/`video` del bloque (`featured-categories.liquid:122-133`).
- Hay que cargar cada dato en su lugar:
  - la portada de la tarjeta va al **bloque de la sección**;
  - el banner va a los **metafields de la colección**.

**Marco de referencia del encuadre de las tarjetas.** El comentario de `schema.prisma:158-160` dice que la tarjeta es vertical (3:4), pero el código actual usa **16:9** desde el Sprint 22 (`lib/image-framing.ts:3-8`). Quien intente replicar el encuadre de Salidas de Baño tiene que usar 16:9, igual que `[TH]/assets/section-categories.css:37`. El banner usa 12:5 como valor inicial y después mide el contenedor real (`category-banner-background.tsx:40-55`; `[TH]/assets/collection-banner.js:57`).

## 4. Detalle: guía de tallas

- **Fuente real:** una sola imagen para toda la tienda, subida desde `/admin/configuracion` (`[NX]/components/admin/settings-manager.tsx:199-207`) y guardada en `Settings` (`schema.prisma:1144-1153`).
- **Dónde se usa:** solo en productos de Oasis Natural (`product-detail.tsx:34-40`). Aparece como botón "Guía de tallas" junto a "Talla" (`product-variant-picker.tsx:69`) y abre un modal con título e imagen (`size-guide-modal.tsx:84-94`).
- **Estado en Shopify:**
  - 03C creó el metaobject `size_guide` y el metafield `custom.size_guide`, pero sin entradas (`03C-catalog-import-report.md:79-82`).
  - `templates/product.json` no configura el respaldo de la sección (la búsqueda de `size_guide` en `[TH]/templates/product.json` no dio resultados).
- **Recomendación:** usar la opción de respaldo de la sección (imagen + colección `oasis-natural`). Replica exactamente el modelo real, que es una imagen para una colección (`main-product.liquid:49-65`, `:415-430`). Así no hace falta asignar un metaobject a cada uno de los 10 productos.

## 5. Detalle: destacados

**Flags observados** en los 29 productos (`[S3D]/featured-flags.json`; payload RSC de `[S3D]/live-{oasis-natural,aurora-viva,espuma-de-ola}.html` y de la home):

| Colección | Handle con `featured=true` | SKU de producto | ¿Visible hoy en "Productos destacados"? |
|---|---|---|---|
| Aurora Viva | `alba-dorada-lila` | LG-AUR-000003 | Sí |
| Aurora Viva | `aurora-total-azul-oscuro` | LG-AUR-000007 | Sí |
| Aurora Viva | `raices-del-sol-beige-suave` | LG-HOM-000001 | Sí |
| Espuma de Ola | `bikini-palm-verde-oliva` | LG-ESP-000007 | Sí |
| Espuma de Ola | `bikini-shadow-azul-marino` | LG-ESP-000006 | Sí |
| Espuma de Ola | `enterizo-shadow-palm-azul-marino` | LG-ESP-000008 | Sí |
| Espuma de Ola | `entero-golden-hour` | LG-ESP-000003 | Sí |
| Oasis Natural | `COSTA-ESMERALDA-AZUL` | RSONBI021 | **No**: está en la editorial (posición 1) |
| Oasis Natural | `brisa-natural-beige` | RSONEN022 | **No**: está en la editorial (posición 2) |
| Oasis Natural | `oasis-serena-azul` | RSONEN011 | **No**: está en la editorial (posición 4) |

Los otros 19 productos tienen `featured=false`, sin valores contradictorios entre archivos.

**Orden de la editorial** en la home (`[S3D]/featured-verify.txt`, a partir de `[S3C]/nav-home_live-home.html`): COSTA-ESMERALDA-AZUL, brisa-natural-beige, marea-natural, oasis-serena-azul, costa-esmeralda-negro, marea-natural-naranja, arena-dorada-beige, arena-dorada-negro.

**Por qué el conjunto visible es fijo:**

- Los 7 destacados que quedan alcanzan el mínimo (`FEATURED_MIN_COUNT = 7`, `catalog-actions.ts:173`), así que no entra relleno aleatorio (`:202-216`).
- Solo cambia el orden (`:223-225`). Eso coincide con las 5 muestras de 03C.

**Contradicciones con los informes previos:**

- `[S3C]/current-site-nav-home.md:185` infería "estos 7 tienen `featured=true`". Es correcto pero incompleto: hay 3 más, ocultos por la exclusión. Ese mismo documento ya lo marcaba como riesgo en `:188` y `:443`.
- `03C-catalog-import-report.md:93` dice "el flag `featured` es NOT_AVAILABLE". Es cierto para los exports: `featured` es NOT_AVAILABLE en `products-master.csv` (`current-site-nav-home.md:187`). **No** es cierto para el sitio en vivo.
- El comentario de `catalog-actions.ts:356-358` dice que las recomendaciones son "productos destacados de las categorías". La consulta real **no filtra por `featured`** (`:378-386`).

**Opciones para Daniela (REQUIRES_DECISION).** El theme de Shopify no deduplica entre secciones: `featured-products.liquid:12-21` solo toma la colección elegida.

- **(a) Paridad visual:** colección manual "Destacados" con los **7 visibles hoy**. No repite nada con la editorial. Como el `limit` por defecto es 8 (`[TH]/sections/featured-products.liquid:49-54`), se verían los 7.
- **(b) Paridad de datos:** colección con los **10** flags. En la home se verían duplicados con la editorial los 3 de Oasis Natural.
- **Diferencia en ambos casos:** el sitio los baraja en cada visita (`:223-225`); una colección manual en Shopify tiene orden fijo.

## 6. Detalle: archivos de `public/` (hashes y duplicados)

| Archivo | Bytes | SHA-256 | MD5 | ETag en vivo (Vercel) | Uso en código | ¿Aparece en el HTML en vivo? |
|---|---|---|---|---|---|---|
| `[NX]/public/images/products/1 (1).webp` | 46.932 | `e2467833efeba25688de72376820c4c75aceef15db0fa6716f3cf7ba602557b4` | `8c00cbc987f327fd2e5794b7c2485213` | `"8c00cbc987f327fd2e5794b7c2485213"` (HIT) | `lib/categories.ts:76` (Espuma) | **Sí**: poster de la tarjeta Espuma (`nav-home_live-home*.html` ×5, `@byte 20915`) |
| `[NX]/public/images/products/1.webp` | 46.932 | `e2467833…57b4` (**idéntico**) | `8c00cbc9…5213` (**idéntico**) | igual | `lib/categories.ts:66` (Aurora, fallback que la DB pisa) | No (búsqueda sin coincidencias en los 12 HTML) |
| `[NX]/public/images/products/002.webp` | 54.320 | `0f015143279b4a198b940d4c83ce89908ab43eed2ca244941a8fd8c456ab5987` | `3e39e8d0572f36684b2e966102fafc75` | `"3e39e8d0572f36684b2e966102fafc75"` | `lib/categories.ts:56` (Oasis) y `:86` (Salidas), fallbacks que la DB pisa | No |

- `1.webp` y `1 (1).webp` son **duplicados byte a byte**.
- El MD5 local coincide con el ETag que sirve Vercel, así que lo que está en vivo es idéntico al repo.
- Para Shopify **basta con subir uno** (el contenido de `1 (1).webp`), y solo si se decide usarlo como imagen de la tarjeta Espuma de Ola.
- Las carpetas `public/images/{hero,banners,categories,backgrounds}`, `public/videos` y `public/products/radaelli-enterizo-navy` están **vacías** (listado de `public/`). **No hay** media del hero ni de categorías en `public/`.

## 7. Riesgos y pendientes para la migración

1. **Bajar los archivos de Cloudinary es un paso aparte**, que requiere autorización del dueño: esta auditoría solo leyó cabeceras. Son 13 URLs de Cloudinary; con el archivo local de `public/` suman 14 archivos.
   - Si el video del Hero y el de Aurora Viva se confirman idénticos, son **12 URLs únicas**.
2. **El banner de Salidas de Baño (32,7 MP)** será rechazado sin `c_limit` (fila 18).
3. **La tarjeta Salidas de Baño queda sin imagen en Shopify** si no se carga el `image` del bloque, porque la colección tiene 0 productos (fila 12).
4. **Encuadre de tarjetas sin equivalente** en el theme. Solo afecta visualmente a Salidas de Baño (fila 14).
5. **Poster del Hero y de las tarjetas:** Shopify usa su propia vista previa (divergencia documentada en `hero.liquid:9-13`).
6. **Formatos de video:** HEVC y `.mov`; la compatibilidad con Shopify no está verificada (filas 1 y 10).
7. **Destacados:** decidir entre 7 y 10 productos, y aceptar el orden fijo (sección 5).
8. **Media solo en DB:** si alguien cambia la media desde `/admin` antes del corte, estas URLs quedan viejas. Conviene volver a capturar justo antes de subir a Shopify.

## 8. Archivos de evidencia generados en `[S3D]`

- `live-oasis-natural.html`, `live-aurora-viva.html`, `live-espuma-de-ola.html`, `live-salidas-de-bano.html`, `live-producto_brisa-natural-beige.html` y `live-producto_raices-del-sol-beige-suave.html`.
- `media-urls.txt` y `media-head.txt` (HEAD); `png-dims.mjs` y `png-dims.txt` (IHDR con Range de 32 bytes).
- `featured-flags.mjs` y `featured-flags.json`; `featured-verify.mjs` y `featured-verify.txt`.
- `evidence-index.mjs` y `evidence-index.json`.
