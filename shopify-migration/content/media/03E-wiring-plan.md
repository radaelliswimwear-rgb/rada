# 03E — Plan de media: de Cloudinary a Shopify Archivos y al theme

- **Fecha:** 2026-09-29 (Bogotá).
- **Estado:** `DEFERRED_OWNER_ONLY_BLOCKER`. Descargar y subir archivos requiere el OK explícito de Daniela. Hoy **no se descargó ni se subió nada**, y `theme-src` no se modificó.
- **Entrada:** `content/media/media-migration-manifest.csv` (03D, 14 filas). Procedencia y hashes en `theme/03D-missing-assets-audit.md`.
- **Herramientas** (Node >= 20, sin dependencias). Las dos funcionan **en seco por defecto**:
  - `scripts/prepare-media-package.mjs`: descarga, valida y deja el paquete listo para subir.
  - `scripts/apply-media-wiring.mjs`: con el mapa de referencias de Shopify, parchea los 2 templates de `theme-src` e imprime los metafields de colección.
- **Evidencia:** `CODE` (repo, `archivo:línea`) · `DOC` (fuente oficial, §7) · `MEDIDO` · `INFERENCIA` · `NOT_VERIFIED`.

## Resumen

- **Qué se procesa:** 12 descargas del Cloudinary propio, 1 copia local opcional (M07, `public/`) y 1 fila que no se migra (M02, poster del Hero).
- **Archivos únicos probables: 12.** M06 tiene el mismo ETag y tamaño que M01 (03D). El script lo confirma por SHA-256 y, si coinciden, no escribe un segundo archivo.
- **Crítico: M09.** Sin esa imagen, la tarjeta "Salidas de Baño" queda sin media: la colección tiene 0 productos (`sections/featured-categories.liquid:41`, `:53-55`).
- **Única transformación de imagen:** M13 (4672 × 7008 = 32,7 MP) se baja con `c_limit,w_5000,h_5000,q_95`, la misma entrega de 03C (`import/image-resolution-fix.csv`). Resultado esperado: 3333 × 5000, sin recorte.
- **Videos HEVC** (M01, M04, M06, M08): la página oficial de Archivos, en "Recommended video specifications", lista como códec soportado **solo "Video: H.264 (AVC)"** (`DOC`). HEVC no figura; la página tampoco dice que se rechace, así que su aceptación queda `NOT_VERIFIED`. **Recomendado:** bajar los 4 videos con `--video-variant=served` (la misma URL `f_auto,q_auto` que sirve el sitio; en 03D devolvió `avc1` = H.264 con curl) y confirmar que el script lea `avc1` (§2, P2).
- **Riesgo de theme (verificador, `INFERENCIA` con respaldo `DOC`):** el banner de colección lee `cover_image.width` / `.height` directamente del metafield, sin `.value` (`snippets/collection-banner.liquid:32`, `:54-56`). Según la doc, el objeto `metafield` solo expone `list?`, `type` y `value`. Si es así, el JS no recibe dimensiones y aborta (`assets/collection-banner.js:48`): el banner quedaría **sin foto** aunque P9 esté bien cargado. Ver R10 y QA 3.

---

## 1. Qué va a dónde

Los ids de setting salen de los schemas y el script de wiring los vuelve a leer y verificar en cada corrida.

| id | Asset | Archivo preparado | Destino | Setting (schema) | Tipo | Prioridad |
|---|---|---|---|---|---|---|
| M01 | Video del Hero | `prepared/M01-bb70lfnhpbl4h8ee7mdz.mp4` | `templates/index.json` › `hero` | `hero_video` (`sections/hero.liquid:66-70`) | video | Alta |
| M02 | Poster del Hero | — | No se migra: el theme usa la vista previa de Shopify (`sections/hero.liquid:9-13`) | — | — | — |
| M03 | Tarjeta Oasis: imagen | `prepared/M03-zjlcdrptowzxnmcz7ixf.jpg` | `featured-categories` › bloque `oasis-natural` | `image` (`sections/featured-categories.liquid:122-127`) | image_picker | Media: el video gana (`:51-55`) |
| M04 | Tarjeta Oasis: video | `prepared/M04-xxjjwoori52cmkbgu33n.mp4` | ídem | `video` (`:128-133`) | video | Alta |
| M05 | Tarjeta Aurora: imagen | `prepared/M05-zdxbjacneyll6npdosdu.png` | bloque `aurora-viva` | `image` | image_picker | Media: el video gana |
| M06 | Tarjeta Aurora: video | `prepared/M06-…` o el mismo archivo que M01 | bloque `aurora-viva` | `video` | video | Alta |
| M07 | Tarjeta Espuma: imagen | `prepared/M07-1-1.webp` (copia de `public/images/products/1 (1).webp`) | bloque `espuma-de-ola` | `image` | image_picker | **Opcional**: el fallback es `collection.featured_image` (`:41`) |
| M08 | Tarjeta Espuma: video (.mov) | `prepared/M08-nnohfbsoqzgee20xooog.mov` (con `--video-variant=served` la extensión sigue al contenido real; si Cloudinary entrega MP4, queda `.mp4`) | bloque `espuma-de-ola` | `video` | video | Alta |
| M09 | Tarjeta Salidas: imagen | `prepared/M09-gz9ken66as28i5hresne.png` | bloque `salidas-de-bano` | `image` | image_picker | **CRÍTICA** |
| M10–M13 | Banners de colección | `prepared/M10…M13-*.jpg` | Metafields de colección `custom.cover_image` + `image_pos_x` / `image_pos_y` / `zoom` (`snippets/collection-banner.liquid:32-36`, `:50-61`) | — | archivo + decimal | Alta |
| M14 | Guía de tallas | `prepared/M14-gaattbpghl9loslphqz6.png` | `templates/product.json` › `main` | `size_guide_image` + `size_guide_collection` = `oasis-natural` (`sections/main-product.liquid:422-436`; lógica `:44-65`) | image_picker + collection | Alta |

**Nota sobre las tarjetas.** Con video, la tarjeta dibuja el video y no la imagen (`featured-categories.liquid:51-55`). M03, M05 y M07 funcionan como respaldo si el video falta. El encuadre de las tarjetas no tiene campo en el theme (03D, filas 5, 8 y 14).

---

## 2. Paso a paso para la dueña (con Claude al lado)

Todos los comandos se corren desde la raíz del worktree: `C:\CLAUDE\rada-main\rada-main\commerce-main\commerce-main\.claude\worktrees\shopify-migration-prep`.

| Paso | Quién | Acción | Resultado esperado | Si falla |
|---|---|---|---|---|
| **P0** | Daniela | Confirmar que desde la captura de 03D (2026-09-29, 15:33 UTC) no se cambió media en el admin del sitio (Hero, categorías, banners, guía de tallas). Si hubo cambios, las URLs quedan viejas (riesgo 8 de 03D) | "No cambié nada" | Si hubo cambios, volver a capturar las URLs antes de descargar |
| **P1** | Daniela | **OK explícito de descarga**:<br>- 12 archivos de `res.cloudinary.com/n8l3p85c` (su Cloudinary): 8 imágenes (M13 con `c_limit`) y los 4 videos en su **variante servida** `f_auto,q_auto` (recomendada, ver Resumen);<br>- imágenes sin transformar + M07: 6.661.726 bytes (unos 6,7 MB); M13 transformada y los 4 videos servidos no tienen peso medido (M01 servido: 2.126.124 bytes en 03D). Con los videos **originales** HEVC el total esperado es unos 20,7 MB;<br>- destino `shopify-migration/content/media/prepared/`. | OK en el chat, indicando la variante de video | Sin OK, no se corre nada |
| **P2** | Claude o Daniela | **Recomendado:** `node shopify-migration/scripts/prepare-media-package.mjs --download --video-variant=served`<br>Alternativa (videos originales HEVC, `NOT_VERIFIED`): `… --download` | Sale:<br>- **13** líneas `OK`: 12 descargas + la copia local de M07 (M06 puede sumar un `AVISO` "idéntico byte a byte a M01");<br>- con `served`: ningún aviso de códec en los 4 videos (el script lee `avc1`). Si aparece un aviso de códec, **no subir** ese video y revisarlo;<br>- con `original`: avisos HEVC en M01, M04, M06 y M08;<br>- `Escrito: content/media/03E-upload-ready-manifest.csv (13 filas)`;<br>- `errores 0`. | Según el error:<br>- **HTTP 404:** el asset cambió en Cloudinary → P0;<br>- **Content-Type ≠ cabecera:** detenerse y revisar;<br>- **EXCEDE:** el script reintenta solo con `c_limit`;<br>- **AVISO de bytes distintos a 03D:** el asset cambió desde la auditoría → confirmar con Daniela antes de subirlo (no aplica a entregas transformadas). |
| **P3** | Daniela | Admin > **Contenido > Archivos** > "Subir archivos". Se aceptan hasta 20 por tanda (`DOC`). Subir **los archivos únicos** de la columna `file` del manifiesto. **No** subir M02 | Todos quedan en Archivos sin error | Si se usaron los originales y Shopify rechaza un video HEVC o `.mov`:<br>1. OK nuevo de descarga;<br>2. `node shopify-migration/scripts/prepare-media-package.mjs --download --only=M01,M04,M06,M08 --video-variant=served` (la misma URL con `f_auto,q_auto`, que es lo que sirve el sitio: `lib/cloudinary/video-url.ts:6-9`);<br>3. subir esos. |
| **P4** | Daniela | Obtener las referencias. **Ruta A (recomendada)**, en el **Editor de temas del theme Radaelli sin publicar**: `admin.shopify.com/store/radaelli-swimwear-dev/themes/189072474431/editor`, **nunca** Horizon:<br>- Inicio › Hero › "Video de fondo (opcional)" = M01;<br>- Inicio › Categorías destacadas › cada bloque › "Imagen" / "Video" (M03–M09);<br>- Producto › Ficha de producto › "Imagen de la guía (respaldo)" = M14 y "Mostrar la guía de respaldo solo en esta colección" = Oasis Natural;<br>- **Guardar**. | Se ven la Home y la ficha con la media | Si no aparece un archivo en el selector: revisar P3 |
| **P4b** | Claude | Bajar los 2 templates a una carpeta temporal **vacía** (nunca a `theme-src`: `theme pull` borra los archivos locales que no existen en remoto si falta `--nodelete`, `DOC`):<br>`shopify theme pull --theme 189072474431 --only templates/index.json --only templates/product.json --path "$env:TEMP\radaelli-pull-03e" --nodelete` | Dos JSON con los valores `shopify://…` que escribió el Editor | Si la CLI pide login: lo hace Daniela |
| **P5** | Claude | `node shopify-migration/scripts/apply-media-wiring.mjs --template > "$env:TEMP\radaelli-media-map.json"`. En PowerShell 5.1, `>` guarda UTF-16LE (o UTF-8 con BOM si `Out-File` está configurado así); el script acepta los dos desde la verificación de hoy (antes fallaba con `Unexpected token`). Completar `refs`:<br>- M01, M03–M09 y M14: los valores del paso P4b;<br>- M10–M13: el nombre del archivo en Archivos (o su `gid://shopify/MediaImage/…`). | Mapa con 12–13 referencias | — |
| **P6** | Claude | `node shopify-migration/scripts/apply-media-wiring.mjs --map="$env:TEMP\radaelli-media-map.json"` (en seco). Revisar el diff | El diff cambia **solo**:<br>- `hero_video`;<br>- `image`/`video` de los 4 bloques;<br>- `size_guide_image` + `size_guide_collection`.<br>0 errores. | `ERROR … ya vale`: hay un valor previo distinto → decidir si corresponde `--overwrite` |
| **P7** | Claude | La misma línea con `--write` | `Escritos: templates/index.json, templates/product.json`, más la ruta de la copia de respaldo | El script no escribe nada si hay errores |
| **P8** | Claude (con OK de Daniela) | Solo en la Ruta B, o para verificar paridad:<br>`shopify theme push --theme 189072474431 --path shopify-migration/theme-src --only templates/index.json --only templates/product.json --nodelete`.<br>**Nunca** `--allow-live`; **nunca** el theme `189072113983` (Horizon). | El remoto queda igual al local en esos 2 archivos (verificar con un pull a una carpeta temporal y comparar SHA-256, lección 2 de 03D) | Si el remoto no conserva un setting: volver a la Ruta A |
| **P9** | Daniela | Admin > **Productos > Colecciones** > cada colección > **Metacampos**: cargar los valores de la tabla del §2.1 | El banner de la colección muestra la foto con su encuadre | Ver el §2.1 (decimales) |
| **P10** | Claude | QA (§2.2) | Todo PASS | Rollback (§5) |

**Por qué hace falta el script aunque se use el Editor.** El theme se publica desde `theme-src`. Si `templates/index.json` y `templates/product.json` del repo no tienen las referencias, el próximo `theme push` de un RC **borra** lo que se eligió en el Editor. El script deja `theme-src` igual al remoto.

**Ruta B (sin Editor):** llenar el mapa con el patrón observado `shopify://shop_images/<archivo>` para imágenes y `shopify://files/videos/<archivo>` para videos, y después hacer P6–P8.

- Ese patrón es **`NOT_VERIFIED`** (§3).
- Después del push, confirmar en el Editor que cada setting muestra su archivo. Si alguno sale vacío, pasar a la Ruta A.

**Cambios locales de 03E sin publicar.** `layout/theme.liquid`, `main-collection`, `main-search` y `product-card` tienen cambios locales. El push de P8 con `--only` **no** los incluye: van en su propio push de RC.

### 2.1 Metafields de colección (M10–M13)

Valores del manifiesto 03D. La definición es decimal (`03C-catalog-import-report.md:83`). El tipo `number_decimal` admite como máximo `+/-9999999999999.999999999`, es decir, 9 decimales (`DOC`). Por eso se cargan redondeados a 9 decimales; la diferencia es menor a 0,000000001 puntos porcentuales e invisible.

| Colección | `custom.cover_image` | `image_pos_x` | `image_pos_y` | `zoom` | `cover_video` |
|---|---|---|---|---|---|
| Oasis Natural (`oasis-natural`) | M10 | 50 | 26.68997669 | 1 | vacío |
| Aurora Viva (`aurora-viva`) | M11 | 43.932724252 | 69.976846586 | 1.4 | vacío |
| Espuma de Ola (`espuma-de-ola`) | M12 | 53.682170543 | 55 | 1 | vacío |
| Salidas de Baño (`salidas-de-bano`) | M13 (entrega de 3333 × 5000) | 61.627906977 | 59.972144465 | 1.15 | vacío |

- El banner con encuadre exige que los **tres** decimales tengan valor (`snippets/collection-banner.liquid:34`) y `collection_show_banner` = `true` (`config/settings_data.json:36`).
- El encuadre depende solo de la relación de aspecto, y `c_limit` la conserva (03D, fila 18). Los valores de M13 siguen sirviendo.

### 2.2 QA después de conectar

Preview del theme sin publicar: `?preview_theme_id=189072474431`, a 375 px y a 1280 px.

1. **Home:**
   - el Hero muestra el video (rama con video, `hero.liquid:28-30`), en silencio y en bucle;
   - las 4 tarjetas tienen media: Oasis, Aurora y Espuma con video, Salidas de Baño con imagen.
2. **Códec:** si se subieron originales HEVC y un video no se reproduce en un navegador (por ejemplo, Chrome en Windows sin HEVC), anotar navegador y sistema y pasar a `--video-variant=served` (P3).
3. **Colecciones:** `/collections/oasis-natural`, `aurora-viva`, `espuma-de-ola` y `salidas-de-bano` muestran la foto del banner con el encuadre de 03D. Comparar a ojo con el sitio real.
   - Si el banner sale **vacío** (sin foto y sin el arte por tono): revisar en el código fuente que `data-image-width` / `data-image-height` tengan número. Si están vacíos, es R10 (arreglo del theme), no un error de carga de P9.
4. **Guía de tallas:**
   - una ficha de Oasis Natural (por ejemplo, `/products/brisa-natural-beige`) muestra el botón "Guía de tallas" y el modal con la imagen;
   - una ficha de Aurora Viva **no** lo muestra (`main-product.liquid:49-58`).
5. Consola sin errores propios. Sin desbordes a 320 px.

---

## 3. Formato de las referencias (`NOT_VERIFIED`)

- La doc oficial dice que los settings `image_picker` y `video` devuelven objetos `image` y `video` en Liquid, pero **no documenta** cómo se guardan en el JSON del template.
- La única mención oficial es indirecta: los requisitos del Theme Store piden que los `.json` no incluyan recursos de una tienda de demo, "URLs starting with `shopify://`".
- Por eso la **Ruta A** toma las referencias tal cual las escribe el Editor (P4 → P4b).
- El script exige el prefijo `shopify://` para los destinos del theme. Si no coincide con el patrón observado, solo emite un **aviso**.
- Para `--write`, rechaza cualquier mapa con referencias de prueba (`FAKE`, `EJEMPLO`, `PLACEHOLDER`, …).

---

## 4. Riesgos y decisiones

| # | Riesgo o decisión | Tratamiento |
|---|---|---|
| R1 | HEVC fuera de los códecs documentados (la doc de Archivos lista solo H.264/AVC); aceptación `NOT_VERIFIED` | Variante servida recomendada en P2 + aviso del script si el códec leído no es `avc1` + QA 2 |
| R2 | M06 = M01 (misma pieza) | Se confirma por SHA-256. Se sube una vez y se usa la misma referencia en los dos settings |
| R3 | M09 ausente → tarjeta vacía | El script avisa como CRÍTICO |
| R4 | Un `theme push` completo pisa lo elegido en el Editor | El script sincroniza `theme-src` (P5–P7). El push de P8 va con `--only` |
| R5 | Más de 9 decimales en metafields | Se redondea a 9 (§2.1) |
| R6 | Límites de Archivos (`DOC`): imagen ≤ 20 MB, ≤ 25 MP y relación entre 100:1 y 1:100; video ≤ 1 GB, lado ≤ 4096 px, duración ≤ 10 min | El script los valida. También usa el lado ≤ 5000 px de 03C |
| R7 | La entrega de Cloudinary cambia antes del corte | P0. El script compara bytes y dimensiones con 03D y avisa |
| R8 | M07: ¿usar el `.webp` de `public/`? | Decisión de Daniela. Si no se usa, el bloque cae a `collection.featured_image` |
| R9 | Poster del Hero y de las tarjetas | Shopify usa su propia vista previa del video (divergencia menor documentada, `hero.liquid:9-13`) |
| R10 | **Bug probable del theme** (verificador): `collection-banner.liquid:32` asigna el metafield sin `.value` y `:55-56` leen `cover_image.width` / `.height`. El objeto `metafield` solo documenta `list?`, `type` y `value` (`DOC`), así que las dimensiones saldrían vacías y `collection-banner.js:48` aborta: banner sin foto. `cover_image \| image_url` (`:54`) tampoco está documentado sobre un metafield. Lo mismo aplica a `cover_video \| video_tag` (`:49`), que hoy queda vacío | **No bloquea P1–P8.** Antes de P9 (o en el RC siguiente), arreglo mínimo del theme: `:32` → `assign cover_image = collection.metafields.custom.cover_image.value.preview_image` (el mismo patrón que `main-product.liquid:48`) y `:49` → `collection.metafields.custom.cover_video.value \| video_tag: …`. Se valida en QA 3. Hoy es `INFERENCIA`: los metafields están vacíos y nunca se midió en la tienda |

---

## 5. Rollback

| Qué | Cómo |
|---|---|
| `theme-src` | Con `--write`, el script copia los originales a `%TEMP%\radaelli-media-wiring-<fecha>\templates\` (imprime la ruta). Se restauran copiándolos de vuelta |
| Theme remoto (sin publicar) | En el Editor, vaciar cada setting y guardar. O hacer push de los templates restaurados con el mismo comando de P8 |
| Metafields de colección | Vaciar los 4 campos en cada colección. El banner vuelve a `collection.image` o al arte por tono (`collection-banner.liquid:37-45`, `:62-70`) |
| Archivos subidos | Quedan en Contenido > Archivos sin efecto si no se referencian. Borrarlos es permanente: lo decide la dueña y no hace falta para el rollback |

---

## 6. Validación de hoy (sin red y sin escritura)

### 6.1 `prepare-media-package.mjs` en seco (salida completa)

```
$ node shopify-migration/scripts/prepare-media-package.mjs
Manifiesto: shopify-migration\content\media\media-migration-manifest.csv
Modo: DRY-RUN (sin red, sin escritura)  |  video: original

M01  DOWNLOAD   video  Hero video
      origen:  https://res.cloudinary.com/n8l3p85c/video/upload/v1789352946/lago/home/bb70lfnhpbl4h8ee7mdz.mp4
      archivo: content/media/prepared/M01-bb70lfnhpbl4h8ee7mdz.mp4
      03D:     3657361 bytes, video HEVC (hvc1)
      destino: templates/index.json > hero > hero_video
      nota:    HEVC según 03D: Shopify documenta solo H.264 (AVC); aceptación de HEVC NOT_VERIFIED (recomendado: --video-variant=served)
M02  SKIP       -  Hero poster
      nota: NO_MIGRAR (solo referencia; usar --include-reference para incluirla)
M03  DOWNLOAD   image  Tarjeta Oasis Natural imagen
      origen:  https://res.cloudinary.com/n8l3p85c/image/upload/v1787460154/lago/products/zjlcdrptowzxnmcz7ixf.jpg
      archivo: content/media/prepared/M03-zjlcdrptowzxnmcz7ixf.jpg
      03D:     212142 bytes, 1600x2400
      destino: templates/index.json > featured-categories > bloque oasis-natural > image
M04  DOWNLOAD   video  Tarjeta Oasis Natural video
      origen:  https://res.cloudinary.com/n8l3p85c/video/upload/v1789352898/lago/categories/xxjjwoori52cmkbgu33n.mp4
      archivo: content/media/prepared/M04-xxjjwoori52cmkbgu33n.mp4
      03D:     3503495 bytes, video HEVC (hvc1)
      destino: templates/index.json > featured-categories > bloque oasis-natural > video
      nota:    HEVC según 03D: Shopify documenta solo H.264 (AVC); aceptación de HEVC NOT_VERIFIED (recomendado: --video-variant=served)
M05  DOWNLOAD   image  Tarjeta Aurora Viva imagen
      origen:  https://res.cloudinary.com/n8l3p85c/image/upload/v1787399722/lago/products/zdxbjacneyll6npdosdu.png
      archivo: content/media/prepared/M05-zdxbjacneyll6npdosdu.png
      03D:     1926745 bytes, 1086x1448
      destino: templates/index.json > featured-categories > bloque aurora-viva > image
M06  DOWNLOAD   video  Tarjeta Aurora Viva video
      origen:  https://res.cloudinary.com/n8l3p85c/video/upload/v1789352892/lago/categories/gm4fm2tiwgc2vlu93s7a.mp4
      archivo: content/media/prepared/M06-gm4fm2tiwgc2vlu93s7a.mp4
      03D:     3657361 bytes, video HEVC (hvc1)
      destino: templates/index.json > featured-categories > bloque aurora-viva > video
      nota:    HEVC según 03D: Shopify documenta solo H.264 (AVC); aceptación de HEVC NOT_VERIFIED (recomendado: --video-variant=served)
      nota:    posible duplicado según 03D (se confirma por SHA-256 al descargar)
M07  LOCAL-COPY image  Tarjeta Espuma de Ola imagen
      origen:  repo:public/images/products/1 (1).webp (sha256 e2467833efeba25688de72376820c4c75aceef15db0fa6716f3cf7ba602557b4)
      entrega: repo:public/images/products/1 (1).webp
      archivo: content/media/prepared/M07-1-1.webp
      03D:     46932 bytes, webp
      destino: templates/index.json > featured-categories > bloque espuma-de-ola > image
      nota:    OPCIONAL: decisión de Daniela si se usa
M08  DOWNLOAD   video  Tarjeta Espuma de Ola video
      origen:  https://res.cloudinary.com/n8l3p85c/video/upload/v1789351596/lago/categories/nnohfbsoqzgee20xooog.mov
      archivo: content/media/prepared/M08-nnohfbsoqzgee20xooog.mov
      03D:     3243324 bytes, video QuickTime .mov HEVC
      destino: templates/index.json > featured-categories > bloque espuma-de-ola > video
      nota:    HEVC según 03D: Shopify documenta solo H.264 (AVC); aceptación de HEVC NOT_VERIFIED (recomendado: --video-variant=served)
M09  DOWNLOAD   image  Tarjeta Salidas de Baño imagen
      origen:  https://res.cloudinary.com/n8l3p85c/image/upload/v1787417190/lago/products/gz9ken66as28i5hresne.png
      archivo: content/media/prepared/M09-gz9ken66as28i5hresne.png
      03D:     1665952 bytes, 1086x1448
      destino: templates/index.json > featured-categories > bloque salidas-de-bano > image
M10  DOWNLOAD   image  Banner colección Oasis Natural
      origen:  https://res.cloudinary.com/n8l3p85c/image/upload/v1787460207/lago/products/x95tyqydlvieasp7whfn.jpg
      archivo: content/media/prepared/M10-x95tyqydlvieasp7whfn.jpg
      03D:     236935 bytes, 2400x1600
      destino: oasis-natural > custom.cover_image + custom.image_pos_x/image_pos_y/zoom
M11  DOWNLOAD   image  Banner colección Aurora Viva
      origen:  https://res.cloudinary.com/n8l3p85c/image/upload/v1787420066/lago/products/c9gz6yuipjnowjyp3amd.jpg
      archivo: content/media/prepared/M11-c9gz6yuipjnowjyp3amd.jpg
      03D:     552930 bytes, 1920x800
      destino: aurora-viva > custom.cover_image + custom.image_pos_x/image_pos_y/zoom
M12  DOWNLOAD   image  Banner colección Espuma de Ola
      origen:  https://res.cloudinary.com/n8l3p85c/image/upload/v1787417045/lago/products/n9to8ksgrw1xmxlxm2ch.jpg
      archivo: content/media/prepared/M12-n9to8ksgrw1xmxlxm2ch.jpg
      03D:     573723 bytes, 1920x800
      destino: espuma-de-ola > custom.cover_image + custom.image_pos_x/image_pos_y/zoom
M13  DOWNLOAD   image  Banner colección Salidas de Baño
      origen:  https://res.cloudinary.com/n8l3p85c/image/upload/v1787460295/lago/products/grhrfruybukvqgk6ngrc.jpg
      entrega: https://res.cloudinary.com/n8l3p85c/image/upload/c_limit,w_5000,h_5000,q_95/v1787460295/lago/products/grhrfruybukvqgk6ngrc.jpg
      archivo: content/media/prepared/M13-grhrfruybukvqgk6ngrc.jpg
      03D:     6857621 bytes, 4672x7008 (32.7 MP)  (antes de la transformación)
      destino: salidas-de-bano > custom.cover_image + custom.image_pos_x/image_pos_y/zoom
      nota:    supera el límite (4672x7008 = 32.7 MP): entrega c_limit,w_5000,h_5000,q_95, sin recorte
M14  DOWNLOAD   image  Guía de tallas
      origen:  https://res.cloudinary.com/n8l3p85c/image/upload/v1788989645/lago/products/gaattbpghl9loslphqz6.png
      archivo: content/media/prepared/M14-gaattbpghl9loslphqz6.png
      03D:     1446367 bytes, 1024x1536
      destino: templates/product.json > main-product > size_guide_image + size_guide_collection=oasis-natural

Resumen del plan: 12 descargas + 1 copia local, 1 omitidas, 0 problemas.
Bytes esperados (sin contar las entregas transformadas): 20723267
DRY-RUN: no se descargó ni se escribió nada. Para ejecutar: agregar --download (requiere el OK de la dueña).
```

- **Exit 0.** `content/media/` sigue teniendo solo `media-migration-manifest.csv`: ni `prepared/` ni manifiesto nuevo.
- **Otras corridas:**
  - `--download --dry-run` → `ERROR: --download y --dry-run son excluyentes` (exit 2).
  - `--only=M77` → `PROBLEMA: --only: M77 no está en el manifiesto` (exit 1).
  - `--video-variant=served --only=M01,M08` → entrega `…/video/upload/f_auto,q_auto/v…`.
  - Re-corrida del verificador (mismo día, después de corregir el texto del aviso de códec): salida idéntica línea a línea al bloque de arriba (83/83), exit 0. Con `--video-variant=served` (plan completo): los 4 videos pasan a `…/video/upload/f_auto,q_auto/…`, sin nota HEVC, `Bytes esperados … 6661726`, 0 problemas.

### 6.2 `apply-media-wiring.mjs` en seco con un mapa **FALSO**

El mapa vive en el scratchpad de la sesión (`03e-media/FAKE-media-map.json`) y **no** es un entregable. Todas sus referencias contienen `FAKE` y ninguna existe en Shopify. M07 = null; M06 apunta al mismo archivo que M01.

```
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<scratchpad>/03e-media/FAKE-media-map.json
Modo: DRY-RUN (no escribe nada)

schema OK  sections/hero.liquid > hero_video (video)
manifiesto OK  M01 -> templates/index.json > hero > hero_video
schema OK  sections/featured-categories.liquid > block "category" > image (image_picker)
manifiesto OK  M03 -> templates/index.json > featured-categories > bloque oasis-natural > image
schema OK  sections/featured-categories.liquid > block "category" > video (video)
manifiesto OK  M04 -> templates/index.json > featured-categories > bloque oasis-natural > video
  … (idénticas para M05–M09)
schema OK  sections/main-product.liquid > size_guide_image (image_picker)
schema OK  sections/main-product.liquid > size_guide_collection (collection)
manifiesto OK  M14 -> templates/product.json > main-product > size_guide_image + size_guide_collection=oasis-natural
manifiesto OK  M10 -> oasis-natural > custom.cover_image + custom.image_pos_x/image_pos_y/zoom
  … (idénticas para M11–M13)

Cambios en el theme:
  M01  templates/index.json > hero > hero_video: nuevo: shopify://files/videos/FAKE-M01-hero.mp4
  M03  templates/index.json > featured-categories > oasis-natural > image: nuevo: shopify://shop_images/FAKE-M03-oasis.jpg
  M04  templates/index.json > featured-categories > oasis-natural > video: nuevo: shopify://files/videos/FAKE-M04-oasis.mp4
  M05  templates/index.json > featured-categories > aurora-viva > image: nuevo: shopify://shop_images/FAKE-M05-aurora.png
  M06  templates/index.json > featured-categories > aurora-viva > video: nuevo: shopify://files/videos/FAKE-M01-hero.mp4
  M07  templates/index.json > featured-categories > espuma-de-ola > image: omitido (sin referencia en el mapa)
  M08  templates/index.json > featured-categories > espuma-de-ola > video: nuevo: shopify://files/videos/FAKE-M08-espuma.mov
  M09  templates/index.json > featured-categories > salidas-de-bano > image: nuevo: shopify://shop_images/FAKE-M09-salidas.png
  M14  templates/product.json > main > size_guide_image: nuevo: shopify://shop_images/FAKE-M14-guia-tallas.png
  M14  templates/product.json > main > size_guide_collection: nuevo: oasis-natural

--- a/templates/index.json
+++ b/templates/index.json
@@ -3,7 +3,8 @@
     "hero": {
       "type": "hero",
       "settings": {
-        "hero_cta_url": "#categorias"
+        "hero_cta_url": "#categorias",
+        "hero_video": "shopify://files/videos/FAKE-M01-hero.mp4"
       }
     },
     "featured-categories": {
@@ -14,7 +15,9 @@
           "settings": {
             "collection": "oasis-natural",
             "description": "Tonos tierra y vegetación exuberante.",
-            "available": true
+            "available": true,
+            "image": "shopify://shop_images/FAKE-M03-oasis.jpg",
+            "video": "shopify://files/videos/FAKE-M04-oasis.mp4"
           }
         },
         "aurora-viva": {
@@ -22,7 +25,9 @@
           "settings": {
             "collection": "aurora-viva",
             "description": "Colores luminosos para los primeros rayos del día.",
-            "available": true
+            "available": true,
+            "image": "shopify://shop_images/FAKE-M05-aurora.png",
+            "video": "shopify://files/videos/FAKE-M01-hero.mp4"
           }
         },
         "espuma-de-ola": {
@@ -30,7 +35,8 @@
           "settings": {
             "collection": "espuma-de-ola",
             "description": "Texturas suaves y tonos marinos.",
-            "available": true
+            "available": true,
+            "video": "shopify://files/videos/FAKE-M08-espuma.mov"
           }
         },
         "salidas-de-bano": {
@@ -38,7 +44,8 @@
           "settings": {
             "collection": "salidas-de-bano",
             "description": "Prendas ligeras para después del sol.",
-            "available": true
+            "available": true,
+            "image": "shopify://shop_images/FAKE-M09-salidas.png"
           }
         }
       },

--- a/templates/product.json
+++ b/templates/product.json
@@ -44,7 +44,9 @@
       "settings": {
         "show_breadcrumbs": true,
         "enable_lightbox": true,
-        "enable_zoom": true
+        "enable_zoom": true,
+        "size_guide_image": "shopify://shop_images/FAKE-M14-guia-tallas.png",
+        "size_guide_collection": "oasis-natural"
       }
     },
     "recommendations": {

Metafields de colección (se cargan a mano en el Admin; este script no los escribe):
  Colección Oasis Natural (oasis-natural) — Admin > Productos > Colecciones > Oasis Natural > Metacampos
    custom.cover_image (archivo de imagen) = FAKE-M10-banner-oasis.jpg   [M10]
    custom.image_pos_x (decimal) = 50
    custom.image_pos_y (decimal) = 26.68997669   (03D: 26.689976689976692; number_decimal admite 9 decimales)
    custom.zoom (decimal) = 1
    custom.cover_video = (dejar vacío: el banner real no tiene video)
  … (Aurora Viva, Espuma de Ola y Salidas de Baño con los valores del §2.1)

AVISO: mapa de PRUEBA (M01, M03, M04, M05, M06, M08, M09, M10, M11, M12, M13, M14): sirve solo para --dry-run
AVISO: no existe content/media/03E-upload-ready-manifest.csv: no se cruzan nombres de archivo (normal antes de --download)

Resultado DRY-RUN: 2 template(s) cambiarían. No se escribió nada. Para aplicar: --write (con un mapa real).
```

- **Exit 0.** Se recortaron las líneas repetidas (`…`); el resto es literal.
- **Templates intactos:** `theme-src/templates/index.json` (mtime 11:06) y `product.json` (mtime 10:50) no se tocaron.
- **Formato:** el serializador reproduce byte a byte los 6 templates del repo que se probaron, así que el diff solo muestra las líneas nuevas.

### 6.3 Pruebas offline (scratchpad; no son entregables)

- **`test-prepare-media.mjs`: 14/14 PASS.** Cubre:
  - dimensiones de PNG, JPEG y WEBP reales, cruzadas con System.Drawing y con la cabecera VP8X;
  - MP4 y MOV sintéticos (dimensiones, códec y duración, con `moov` al inicio y al final);
  - Content-Type que no coincide con la cabecera, `EXCEDE` y los límites;
  - la allowlist de URL, la convención `c_limit` de 03C y el plan sobre el manifiesto real.
- **`test-wiring.mjs`: 10/10 PASS**, sobre una **copia** del theme en el scratchpad. Cubre:
  - formato byte a byte;
  - `--write` con mapa FAKE rechazado;
  - validaciones del mapa;
  - escritura con respaldo;
  - idempotencia;
  - `--overwrite`;
  - schema sin el setting → error;
  - `theme-src` real intacto.
- **Verificador (re-corridas del mismo día):** `test-prepare-media.mjs` 14/14 y `test-wiring.mjs` 10/10 siguen en PASS después de las correcciones. Pruebas nuevas:
  - mapa escrito con `>` de PowerShell (UTF-8 con BOM) → antes `ERROR: Unexpected token`, exit 1; ahora se lee. También UTF-16LE (`Out-File -Encoding Unicode`) y `--write` con ese mapa FAKE → rechazado, nada escrito;
  - códec leído de un MP4 sintético: `hvc1` → aviso HEVC; `avc1` → sin aviso; `vp09` → aviso "no es H.264 (AVC)".
  - `theme-src/templates/index.json` (11:06) y `product.json` (10:50) siguen sin tocar.

---

## 7. Fuentes oficiales (consultadas el 2026-09-29)

- https://help.shopify.com/en/manual/shopify-admin/productivity-tools/file-uploads: tipos aceptados (imágenes JPEG/PNG/WEBP/HEIC/GIF; videos MOV/MP4/WEBM), límites, hasta 20 archivos por tanda, botón "Link" y, en "Recommended video specifications", "Supported codecs": "Video: H.264 (AVC)" (re-consultada por el verificador el 2026-09-29).
- https://shopify.dev/docs/api/liquid/objects/metafield: el objeto `metafield` expone `list?`, `type` y `value` (base de R10).
- https://help.shopify.com/en/manual/products/product-media/product-media-types: límite de 5000 px usado en 03C (`scripts/build-shopify-image-fix-csv.mjs:5`).
- https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings: `image_picker` y `video` devuelven objetos `image` y `video`, y no admiten `default`.
- https://shopify.dev/docs/storefronts/themes/store/requirements: mención de "URLs starting with `shopify://`" en los `.json`.
- https://shopify.dev/docs/apps/build/custom-data/metafields/list-of-data-types: rango de `number_decimal`; `file_reference` guarda `gid://shopify/MediaImage/…`.
- https://shopify.dev/docs/api/shopify-cli/theme/theme-push y https://shopify.dev/docs/api/shopify-cli/theme/theme-pull: `--only` (se puede repetir), `--nodelete`, `--allow-live`, y que el pull borra archivos locales sin `--nodelete`.
