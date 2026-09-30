# 03F — Runbook de media para la dueña: de Cloudinary a Shopify Archivos y al theme

- **Fecha:** 2026-09-29 (Bogotá). Las sondas de red se corrieron entre las 19:36 y las 19:58 UTC (14:36–14:58 Bogotá).
- **Estado:** `DEFERRED_OWNER_ONLY_BLOCKER`. Descargar y subir archivos requiere el OK explícito de Daniela, y **no existe**. En esta fase **no se descargó ni se subió nada**, y `theme-src`, `app/`, `catalog/`, `import/` y `dist/` no se modificaron.
- **Entradas:** `content/media/media-migration-manifest.csv` (03D, 14 filas), `content/media/03E-wiring-plan.md`, `scripts/prepare-media-package.mjs`, `scripts/apply-media-wiring.mjs`, `theme/03D-missing-assets-audit.md`.
- **Entregables de 03F:** este runbook; `scripts/apply-media-wiring.mjs` endurecido; `scripts/test/test-apply-media-wiring.mjs` (68 comprobaciones, todas PASS).
- **Evidencia:** `MEDIDO` (red, hoy) · `CODE` (repo, `archivo:línea`) · `DOC` (fuente oficial, §14) · `INFERENCIA` · `NOT_VERIFIED`.

## 0. Resumen

- **Las 13 URLs de Cloudinary del manifiesto (incluida M02, que no se migra) responden 200** y todos los tamaños coinciden con 03D (la fila 14, M07, es un archivo local del repo). Los ETags que 03D anotó (el de M01 = M06) siguen iguales, y ningún `Content-Length` cambió desde la captura de 03D (15:33 UTC): la media que se ve hoy en el sitio real es la misma que se va a migrar (`MEDIDO`, §2.1).
- **Solo M13 supera los límites de imagen** (4672 × 7008 = 32,7 MP y 7008 px de alto). La entrega `c_limit,w_5000,h_5000,q_95` da **3333 × 5000** (16,7 MP), 2.964.788 bytes, sin recorte y con la misma relación de aspecto (§3). Las otras 7 imágenes de Cloudinary y M07 (local) cumplen.
- **Dimensiones nuevas, medidas hoy y no presentes en 03D:**
  - las 6 imágenes JPEG (todas coinciden con el manifiesto);
  - el contenedor, el códec, las dimensiones y la duración de los 4 videos;
  - M07 (WEBP local): 1000 × 1500.
- **Videos:** los 4 originales son HEVC (`hvc1`); M08 es además un `.mov` QuickTime y es vertical (1080 × 1920). La variante servida (`f_auto,q_auto`) es H.264 (`avc1`) en MP4 y pesa entre 23 % y 58 % del original (§2.3). El audio de todos es `mp4a` (§2.3).
- **HEVC en Shopify: `NOT_VERIFIED`.** La doc oficial solo lista H.264 (AVC) como códec soportado, y no dice si HEVC se acepta o se rechaza (§6). **Recomendación:** subir la variante servida (H.264), que además es lo que hoy ve el visitante del sitio real. Si se quisieran los originales, la prueba con **1 archivo** (M08) está en §6.
- **Efecto secundario de la sonda (transparencia):** la petición HEAD a la URL `c_limit` de M13 hizo que Cloudinary **generara esa derivada** (su `Last-Modified` es de hoy, 19:36:36 UTC). Es la misma que iba a generar la descarga. No se descargó ni se guardó nada.
- **Script de wiring endurecido** (§11): en seco por defecto, todo o nada, snapshot verificado con comando de restauración, y validación de archivos requeridos, cobertura, duplicados y formato de referencias. Se probó solo con mapas sintéticos `FAKE` sobre copias temporales: **68/68 PASS**, con el `theme-src` real sin cambios entre el inicio y el fin de cada caso (SHA-256 de sus 97 archivos). Ver el aviso de §11.2 sobre otra sesión que editó `theme-src` durante este trabajo.
- **Hallazgos que cambian 03E:** §12. Sin resolver (`NOT_VERIFIED`): §13.

---

## 1. Cómo se validó y qué no se hizo

| Permitido y hecho | Cantidad | Detalle |
|---|---|---|
| `HEAD` a las URLs de Cloudinary | 18 | Las 13 del manifiesto (M02 incluida), la derivada `c_limit` de M13 y las 4 variantes servidas de los videos (M01, M04, M06, M08) |
| Lecturas `Range: bytes=off-off+31` (exactamente 32 bytes, respuesta `206`) | 649 | 18 de cabecera + 631 para recorrer marcadores JPEG y cajas MP4 (la sonda de recorrido se corrió dos veces: la 2.ª sumó la pista de audio; cada corrida figura en esta cuenta) |
| Bytes recibidos en total | ≤ 20.768 | 649 × 32. Nada se guardó en disco: solo se anotaron números |

Notas del método:

- Las 18 URLs son las 13 de Cloudinary del manifiesto, la derivada `c_limit` de M13 y las variantes servidas de los 4 videos. Para M07 (fila 14 del manifiesto) no hubo red: se leyó el archivo local del repo. Las derivadas (`c_limit` y servidas) se piden con la misma URL que armaría el script, insertando la transformación en la ruta.
- **Por qué se recorren varias lecturas de 32 bytes.** Los primeros 32 bytes de un JPEG no llegan al marcador `SOF` (donde están el ancho y el alto): `MEDIDO`, en los 6 JPEG el `SOF` quedó fuera de los primeros 32 bytes. Por eso se encadenaron lecturas de **32 bytes exactos**, saltando de marcador en marcador (3 a 8 lecturas por JPEG). Con los MP4 se hizo igual con las cajas (`ftyp` → `moov` → `trak` → `mdia` → `minf` → `stbl` → `stsd`), de 30 a 43 lecturas por video. Ninguna lectura pidió más de 32 bytes y no se reconstruyó ningún archivo.
- **User-Agent** de las sondas: `radaelli-media-prep/03E`, el mismo que usa `prepare-media-package.mjs`. Importa porque `f_auto` puede cambiar de códec según el cliente: con este agente la variante servida devolvió `avc1`, que es lo que recibirá la descarga real.
- **No se hizo:** ninguna descarga completa, ninguna subida, ningún acceso a `.env`, ninguna llamada a la API de Cloudinary ni de Shopify.

---

## 2. Inventario validado

### 2.1 URLs exactas y cabeceras (HEAD)

Las URLs, tal cual las usa el script (los originales son las del manifiesto; `c_limit` y `served` son derivadas de ellas):

- **M01** (original): `https://res.cloudinary.com/n8l3p85c/video/upload/v1789352946/lago/home/bb70lfnhpbl4h8ee7mdz.mp4`
- **M01** (served): `https://res.cloudinary.com/n8l3p85c/video/upload/f_auto,q_auto/v1789352946/lago/home/bb70lfnhpbl4h8ee7mdz.mp4`
- **M02** (original): `https://res.cloudinary.com/n8l3p85c/image/upload/v1789409333/lago/products/cerhqv59kh6iedegvatv.png`
- **M03** (original): `https://res.cloudinary.com/n8l3p85c/image/upload/v1787460154/lago/products/zjlcdrptowzxnmcz7ixf.jpg`
- **M04** (original): `https://res.cloudinary.com/n8l3p85c/video/upload/v1789352898/lago/categories/xxjjwoori52cmkbgu33n.mp4`
- **M04** (served): `https://res.cloudinary.com/n8l3p85c/video/upload/f_auto,q_auto/v1789352898/lago/categories/xxjjwoori52cmkbgu33n.mp4`
- **M05** (original): `https://res.cloudinary.com/n8l3p85c/image/upload/v1787399722/lago/products/zdxbjacneyll6npdosdu.png`
- **M06** (original): `https://res.cloudinary.com/n8l3p85c/video/upload/v1789352892/lago/categories/gm4fm2tiwgc2vlu93s7a.mp4`
- **M06** (served): `https://res.cloudinary.com/n8l3p85c/video/upload/f_auto,q_auto/v1789352892/lago/categories/gm4fm2tiwgc2vlu93s7a.mp4`
- **M08** (original): `https://res.cloudinary.com/n8l3p85c/video/upload/v1789351596/lago/categories/nnohfbsoqzgee20xooog.mov`
- **M08** (served): `https://res.cloudinary.com/n8l3p85c/video/upload/f_auto,q_auto/v1789351596/lago/categories/nnohfbsoqzgee20xooog.mov`
- **M09** (original): `https://res.cloudinary.com/n8l3p85c/image/upload/v1787417190/lago/products/gz9ken66as28i5hresne.png`
- **M10** (original): `https://res.cloudinary.com/n8l3p85c/image/upload/v1787460207/lago/products/x95tyqydlvieasp7whfn.jpg`
- **M11** (original): `https://res.cloudinary.com/n8l3p85c/image/upload/v1787420066/lago/products/c9gz6yuipjnowjyp3amd.jpg`
- **M12** (original): `https://res.cloudinary.com/n8l3p85c/image/upload/v1787417045/lago/products/n9to8ksgrw1xmxlxm2ch.jpg`
- **M13** (original): `https://res.cloudinary.com/n8l3p85c/image/upload/v1787460295/lago/products/grhrfruybukvqgk6ngrc.jpg`
- **M13** (c_limit): `https://res.cloudinary.com/n8l3p85c/image/upload/c_limit,w_5000,h_5000,q_95/v1787460295/lago/products/grhrfruybukvqgk6ngrc.jpg`
- **M14** (original): `https://res.cloudinary.com/n8l3p85c/image/upload/v1788989645/lago/products/gaattbpghl9loslphqz6.png`

Cabeceras (`accept-ranges: bytes` en todas; todas respondieron `206` al Range de 32 bytes):

| id | Variante | HTTP | Content-Type | Content-Length | vs 03D | ETag | Last-Modified (UTC) |
|---|---|---|---|---|---|---|---|
| M01 | original | 200 | `video/mp4;codecs=hvc1` | 3657361 | igual | `b53a30292c84931296e45b2314c5e249` | 2026-09-14 02:29:07 |
| M01 | served | 200 | `video/mp4;codecs=avc1` | 2126124 | n/a (entrega derivada) | `600cf1dc376040c5f238688afc9b5cc3` | 2026-09-14 15:24:49 |
| M02 | original | 200 | `image/png` | 2435496 | igual | `23223ca28d0b4a21ee48cc240dcbe55c` | 2026-09-14 18:08:54 |
| M03 | original | 200 | `image/jpeg` | 212142 | igual | `eba09e85f227023a20df17183f7efbcf` | 2026-08-23 04:42:35 |
| M04 | original | 200 | `video/mp4;codecs=hvc1` | 3503495 | igual | `9e2012eaf6bbfcbe227670863c7cae75` | 2026-09-14 02:28:19 |
| M04 | served | 200 | `video/mp4;codecs=avc1` | 813565 | n/a (entrega derivada) | `d37d0ef3e098af5250b74540be9138d2` | 2026-09-14 15:23:56 |
| M05 | original | 200 | `image/png` | 1926745 | igual | `10436ff81fb1bcc02be14a7b05d1f5e9` | 2026-08-22 11:55:23 |
| M06 | original | 200 | `video/mp4;codecs=hvc1` | 3657361 | igual | `b53a30292c84931296e45b2314c5e249` | 2026-09-14 02:28:13 |
| M06 | served | 200 | `video/mp4;codecs=avc1` | 2126124 | n/a (entrega derivada) | `600cf1dc376040c5f238688afc9b5cc3` | 2026-09-14 15:23:53 |
| M08 | original | 200 | `video/quicktime;codecs=hvc1` | 3243324 | igual | `db7e26c6b611b5b46f226010a5c341a2` | 2026-09-14 02:06:37 |
| M08 | served | 200 | `video/mp4;codecs=avc1` | 950392 | n/a (entrega derivada) | `aa415e2f3c7d919e2ba661edca89f4ca` | 2026-09-14 15:24:00 |
| M09 | original | 200 | `image/png` | 1665952 | igual | `c1bd87979afa73bbf2d2496acdefa76c` | 2026-08-22 16:46:31 |
| M10 | original | 200 | `image/jpeg` | 236935 | igual | `a5302b511075bc7aa40994b6fa6ac950` | 2026-08-23 04:43:28 |
| M11 | original | 200 | `image/jpeg` | 552930 | igual | `dbdd60d72b73aeb05c60bda6bfa78240` | 2026-08-22 17:34:27 |
| M12 | original | 200 | `image/jpeg` | 573723 | igual | `9c9e1e751daadc244dad3768188b0ca7` | 2026-08-22 16:44:06 |
| M13 | original | 200 | `image/jpeg` | 6857621 | igual | `455e5ec355487974cee8e3f18c1f8017` | 2026-08-23 04:44:56 |
| M13 | c_limit | 200 | `image/jpeg` | 2964788 | n/a (entrega derivada) | `4a928a423ce57ac965d673924eaa575d` | 2026-09-29 19:36:36 |
| M14 | original | 200 | `image/png` | 1446367 | igual | `f4e45e57ed627740cd4222c7a8696286` | 2026-09-09 21:34:06 |

Lectura:

- **Existencia y tipo:** las 13 URLs originales devuelven 200 y el `Content-Type` esperado (JPEG, PNG o video). Cloudinary incluye el códec en el tipo de los videos (`codecs=hvc1`).
- **Tamaños:** los 13 `Content-Length` originales son **iguales** a los del manifiesto 03D.
- **M01 y M06 son el mismo archivo:** mismo ETag (`b53a3029…`) y mismo tamaño en el original; también mismo ETag (`600cf1dc…`) y tamaño en la variante servida. Se sube una sola vez.
- **M02 (poster del Hero) no se migra** (`NO_MIGRAR`); se validó solo como referencia.

### 2.2 Dimensiones y límites de Shopify para imágenes

Límites (`DOC`, §14): archivos de imagen de hasta 20 MB, hasta 25 MP y relación de aspecto entre 100:1 y 1:100. El tope de 5000 × 5000 px sale de la página de media de producto; el script de descarga lo aplica también a los archivos por prudencia, igual que 03C.

| id | Formato | Dimensiones | MP | Lado mayor (px) | > 25 MP | > 5000 px | vs manifiesto 03D | Cómo se midió |
|---|---|---|---|---|---|---|---|---|
| M02 (NO_MIGRAR) | PNG | 1920 × 1080 | 2,074 | 1920 | no | no | 1920x1080 → igual | PNG: IHDR en el Range de 32 bytes |
| M03 | JPEG | 1600 × 2400 | 3,840 | 2400 | no | no | 1600x2400 → igual | JPEG: 3 lecturas de 32 bytes encadenadas hasta el marcador SOF (0xc0) |
| M05 | PNG | 1086 × 1448 | 1,573 | 1448 | no | no | 1086x1448 → igual | PNG: IHDR en el Range de 32 bytes |
| M09 | PNG | 1086 × 1448 | 1,573 | 1448 | no | no | 1086x1448 → igual | PNG: IHDR en el Range de 32 bytes |
| M10 | JPEG | 2400 × 1600 | 3,840 | 2400 | no | no | 2400x1600 → igual | JPEG: 3 lecturas de 32 bytes encadenadas hasta el marcador SOF (0xc0) |
| M11 | JPEG | 1920 × 800 | 1,536 | 1920 | no | no | 1920x800 → igual | JPEG: 4 lecturas de 32 bytes encadenadas hasta el marcador SOF (0xc0) |
| M12 | JPEG | 1920 × 800 | 1,536 | 1920 | no | no | 1920x800 → igual | JPEG: 4 lecturas de 32 bytes encadenadas hasta el marcador SOF (0xc0) |
| M13 | JPEG | 4672 × 7008 | 32,741 | 7008 | **SUPERA** | **SUPERA** | 4672x7008 (32.7 MP) → igual | JPEG: 8 lecturas de 32 bytes encadenadas hasta el marcador SOF (0xc0) |
| M13 (c_limit) | JPEG | 3333 × 5000 | 16,665 | 5000 | no | = 5000 (en el límite) | n/a → derivada | JPEG: 5 lecturas de 32 bytes encadenadas hasta el marcador SOF (0xc0) |
| M14 | PNG | 1024 × 1536 | 1,573 | 1536 | no | no | 1024x1536 → igual | PNG: IHDR en el Range de 32 bytes |
| M07 (local, repo) | WEBP | 1000 × 1500 | 1,500 | 1500 | no | no | 03D: solo "webp" (dimensiones nuevas) | VP8X leído del archivo local del repo (sin red) |

- Solo **M13 original** excede (32,7 MP y 7008 px). Su derivada `c_limit` cumple los dos límites.
- Todos los archivos pesan menos de 7 MB (límite 20 MB) y ninguna relación de aspecto se acerca a 100:1.
- Las 6 dimensiones JPEG del manifiesto (03D) quedaron **confirmadas** por medición.
- M14 tiene profundidad de 8 bits, color RGB sin canal alfa (`MEDIDO`, IHDR); M05 y M09, igual. M02 (no se migra) es RGBA.

### 2.3 Videos: contenedor, códec, dimensiones y duración

| id | Variante | Contenedor (ftyp) | Video (stsd) | Audio (stsd) | Dimensiones | Duración | Bytes (HEAD) | vs original | ETag | Límites Shopify (100–4096 px; 0,25 s–10 min; ≤ 1 GB) |
|---|---|---|---|---|---|---|---|---|---|---|
| M01 | original | MP4 (`isom`) | `hvc1` | `mp4a` | 1278 × 720 | 8,31 s | 3657361 | — | `b53a30292c84931296e45b2314c5e249` | cumple |
| M01 | served | MP4 (`isom`) | `avc1` | `mp4a` | 1278 × 720 | 8,31 s | 2126124 | 58 % | `600cf1dc376040c5f238688afc9b5cc3` | cumple |
| M04 | original | MP4 (`isom`) | `hvc1` | `mp4a` | 1282 × 720 | 7,76 s | 3503495 | — | `9e2012eaf6bbfcbe227670863c7cae75` | cumple |
| M04 | served | MP4 (`isom`) | `avc1` | `mp4a` | 1282 × 720 | 7,76 s | 813565 | 23 % | `d37d0ef3e098af5250b74540be9138d2` | cumple |
| M06 | original | MP4 (`isom`) | `hvc1` | `mp4a` | 1278 × 720 | 8,31 s | 3657361 | — | `b53a30292c84931296e45b2314c5e249` | cumple |
| M06 | served | MP4 (`isom`) | `avc1` | `mp4a` | 1278 × 720 | 8,31 s | 2126124 | 58 % | `600cf1dc376040c5f238688afc9b5cc3` | cumple |
| M08 | original | QuickTime (`qt  `, .mov) | `hvc1` | `mp4a` | 1080 × 1920 (vertical) | 8,04 s | 3243324 | — | `db7e26c6b611b5b46f226010a5c341a2` | cumple |
| M08 | served | MP4 (`isom`) | `avc1` | `mp4a` | 1080 × 1920 (vertical) | 8,00 s | 950392 | 29 % | `aa415e2f3c7d919e2ba661edca89f4ca` | cumple |

- Los 4 originales son **HEVC (`hvc1`)**. M08 es además un `.mov` QuickTime.
- Las 4 variantes servidas son **H.264 (`avc1`) en MP4** (incluido M08, que deja de ser `.mov`).
- Todas cumplen los límites documentados (lado entre 100 y 4096 px, duración entre 0,25 s y 10 min, tamaño ≤ 1 GB).
- **Audio:** cada video trae una pista de sonido con códec `mp4a` (MPEG-4 Audio, normalmente AAC-LC) en las 8 versiones. La doc de Shopify lista AAC, MP3 y Opus como audio soportado. No se leyó el tipo de objeto exacto (caja `esds`), así que «AAC-LC» es `INFERENCIA`. Los videos se muestran en silencio (`muted`), pero el archivo se sube con su audio.
- **M08 es vertical (1080 × 1920)** y las tarjetas son 16:9 con `object-fit: cover` (`assets/section-categories.css:37`, `:64`): se verá una franja central. Es lo que ya ocurre en el sitio real (`INFERENCIA`: el componente real recorta igual); no es un error de carga.

### 2.4 Hashes esperados (para comprobar la descarga)

Qué se puede esperar y qué no:

- **Originales sin transformar** (M03, M05, M09, M10, M11, M12, M14 y, si se eligieran, los 4 videos): el ETag que devuelve Cloudinary es, según su soporte, el **MD5 del archivo subido** (`INFERENCIA` con respaldo de la documentación de soporte de Cloudinary; ver §13). Tras la descarga se comprueba con `Get-FileHash -Algorithm MD5`. Si coincide, es una prueba fuerte de integridad; si no coincide, **no es un error por sí solo**: se usan bytes, dimensiones y SHA-256.
- **Derivadas** (M13 `c_limit` y los 4 videos servidos): el ETag es el de la derivada; sirve como referencia informativa, no como garantía.
- **SHA-256:** solo se conoce por adelantado el de M07 (medido hoy en el repo y coincide con 03D). Para el resto, el script lo calcula al descargar y lo deja en `content/media/03E-upload-ready-manifest.csv`; ese archivo es la referencia desde entonces.

| id | Archivo preparado | Bytes esperados | Dimensiones esperadas | Hash esperado |
|---|---|---|---|---|
| M01 | prepared/M01-bb70lfnhpbl4h8ee7mdz.mp4 | 2126124 | 1278x720 avc1 8.3s | `600cf1dc376040c5f238688afc9b5cc3` (ETag de la derivada; informativo) |
| M03 | prepared/M03-zjlcdrptowzxnmcz7ixf.jpg | 212142 | 1600x2400 | `eba09e85f227023a20df17183f7efbcf` (ETag = MD5, INFERENCIA) |
| M04 | prepared/M04-xxjjwoori52cmkbgu33n.mp4 | 813565 | 1282x720 avc1 7.8s | `d37d0ef3e098af5250b74540be9138d2` (ETag de la derivada; informativo) |
| M05 | prepared/M05-zdxbjacneyll6npdosdu.png | 1926745 | 1086x1448 | `10436ff81fb1bcc02be14a7b05d1f5e9` (ETag = MD5, INFERENCIA) |
| M06 | (idéntico a M01: no se escribe otro archivo) | 2126124 | 1278x720 avc1 8.3s | `600cf1dc376040c5f238688afc9b5cc3` (ETag de la derivada; informativo) |
| M08 | prepared/M08-nnohfbsoqzgee20xooog.mp4 (la extensión sigue al contenido: MP4) | 950392 | 1080x1920 avc1 8.0s | `aa415e2f3c7d919e2ba661edca89f4ca` (ETag de la derivada; informativo) |
| M09 | prepared/M09-gz9ken66as28i5hresne.png | 1665952 | 1086x1448 | `c1bd87979afa73bbf2d2496acdefa76c` (ETag = MD5, INFERENCIA) |
| M10 | prepared/M10-x95tyqydlvieasp7whfn.jpg | 236935 | 2400x1600 | `a5302b511075bc7aa40994b6fa6ac950` (ETag = MD5, INFERENCIA) |
| M11 | prepared/M11-c9gz6yuipjnowjyp3amd.jpg | 552930 | 1920x800 | `dbdd60d72b73aeb05c60bda6bfa78240` (ETag = MD5, INFERENCIA) |
| M12 | prepared/M12-n9to8ksgrw1xmxlxm2ch.jpg | 573723 | 1920x800 | `9c9e1e751daadc244dad3768188b0ca7` (ETag = MD5, INFERENCIA) |
| M13 | prepared/M13-grhrfruybukvqgk6ngrc.jpg | 2964788 | 3333x5000 | `4a928a423ce57ac965d673924eaa575d` (ETag de la derivada; informativo) |
| M14 | prepared/M14-gaattbpghl9loslphqz6.png | 1446367 | 1024x1536 | `f4e45e57ed627740cd4222c7a8696286` (ETag = MD5, INFERENCIA) |
| M07 | prepared/M07-1-1.webp (copia local) | 46932 | 1000x1500 | SHA-256 `e2467833efeba25688de72376820c4c75aceef15db0fa6716f3cf7ba602557b4` y MD5 `8c00cbc987f327fd2e5794b7c2485213` (medidos hoy, coinciden con 03D) |

Comando para listar los MD5 de lo descargado (PowerShell, desde la raíz del worktree):

```powershell
Get-ChildItem shopify-migration\content\media\prepared | Get-FileHash -Algorithm MD5 | Select-Object Hash, @{n="Archivo";e={Split-Path $_.Path -Leaf}}
```

### 2.5 Tamaños de la descarga

| Concepto | Bytes | Aprox. |
|---|---|---|
| 8 imágenes por red (M13 ya con c_limit) | 9.579.582 | 9,6 MB |
| 3 videos servidos únicos (M01, M04, M08) | 3.890.081 | 3,9 MB |
| M06 servido (se descarga, pero es idéntico a M01: no se escribe) | 2.126.124 | 2,1 MB |
| **Transferencia total por red (variante servida)** | **15.595.787** | **15,6 MB** |
| Copia local de M07 (sin red) | 46.932 | 0,05 MB |
| **Peso en disco de los 12 archivos únicos a subir** | **13.516.595** | **13,5 MB** |
| Alternativa: 4 videos originales HEVC (transferencia, con M13 c_limit) | 23.641.123 | 23,6 MB |

Con la variante servida son 12 descargas de Cloudinary más la copia local de M07 (13 líneas `OK`), unos **15,6 MB** por red. A 10 Mbps son unos 12 s de transferencia (`INFERENCIA`).

---

## 3. La transformación de M13: `c_limit,w_5000,h_5000,q_95`

**URL exacta de entrega** (la arma el script con `insertTransform`, sin tocar nada más de la ruta):

```
https://res.cloudinary.com/n8l3p85c/image/upload/c_limit,w_5000,h_5000,q_95/v1787460295/lago/products/grhrfruybukvqgk6ngrc.jpg
```

| Dato | Original (M13) | Con `c_limit,w_5000,h_5000,q_95` |
|---|---|---|
| HTTP / tipo | 200 / `image/jpeg` | 200 / `image/jpeg` |
| Dimensiones (medidas) | 4672 × 7008 | **3333 × 5000** (SOF0, 8 bits, 3 componentes) |
| Megapíxeles | 32,741 | **16,665** (límite 25) |
| Lado mayor | 7008 px | **5000 px** (en el límite, no lo supera) |
| Bytes | 6.857.621 | **2.964.788** |
| ETag | `455e5ec355487974cee8e3f18c1f8017` | `4a928a423ce57ac965d673924eaa575d` |
| Relación de aspecto | 0,66667 | 0,66660 (diferencia de 0,01 %) |

- **Qué hace cada parte:** `c_limit` reduce solo si la imagen excede la caja de 5000 × 5000, conserva la relación de aspecto, no recorta y nunca agranda. `q_95` recomprime el JPEG a calidad 95. La cabecera de la derivada conserva el perfil ICC (se ve el segmento `ICC_PROFILE` en las lecturas de 32 bytes).
- **Los valores de encuadre de M13 siguen valiendo:** dependen solo de la relación de aspecto (`03D` fila 18), y la diferencia es de 0,0001, es decir menos de 1 px sobre un banner de 1280 px.
- **Por qué esta y no otra:** es la entrega que ya usó 03C para los productos (`import/image-resolution-fix.csv`, `scripts/build-shopify-image-fix-csv.mjs:5`). Si se quisiera un archivo más liviano habría que cambiar el script de descarga; no es necesario porque el theme pide el banner a 1600 px (`snippets/collection-banner.liquid:65`).
- **Ninguna otra imagen necesita transformación.** El script solo transforma si el manifiesto lo pide o si la imagen excede (y en ese caso reintenta solo con esta misma transformación).

---

## 4. Nombres de archivo de destino

El script nombra cada archivo `<id>-<nombre en Cloudinary>` y la extensión sigue al **contenido real**. Shopify conserva el nombre subido; si ya existe uno igual, puede añadir un identificador único (`DOC`). Por eso el script de wiring compara sin distinguir mayúsculas y con "contiene".

| id | Archivo preparado = nombre esperado en Archivos | Destino | Observación |
|---|---|---|---|
| M01 | `M01-bb70lfnhpbl4h8ee7mdz.mp4` | Hero, `hero_video` | También se usa en M06 |
| M03 | `M03-zjlcdrptowzxnmcz7ixf.jpg` | Tarjeta Oasis Natural, `image` | Respaldo del video |
| M04 | `M04-xxjjwoori52cmkbgu33n.mp4` | Tarjeta Oasis Natural, `video` | |
| M05 | `M05-zdxbjacneyll6npdosdu.png` | Tarjeta Aurora Viva, `image` | Respaldo del video |
| M06 | (el mismo archivo que M01) | Tarjeta Aurora Viva, `video` | Solo si el SHA-256 difiere se escribe `M06-gm4fm2tiwgc2vlu93s7a.mp4` |
| M07 | `M07-1-1.webp` | Tarjeta Espuma de Ola, `image` | **Opcional** |
| M08 | `M08-nnohfbsoqzgee20xooog.mp4` (servido) o `.mov` (original) | Tarjeta Espuma de Ola, `video` | La extensión la fija el contenido descargado |
| M09 | `M09-gz9ken66as28i5hresne.png` | Tarjeta Salidas de Baño, `image` | **Crítica** |
| M10 | `M10-x95tyqydlvieasp7whfn.jpg` | Banner Oasis Natural, `custom.cover_image` | |
| M11 | `M11-c9gz6yuipjnowjyp3amd.jpg` | Banner Aurora Viva, `custom.cover_image` | |
| M12 | `M12-n9to8ksgrw1xmxlxm2ch.jpg` | Banner Espuma de Ola, `custom.cover_image` | |
| M13 | `M13-grhrfruybukvqgk6ngrc.jpg` (entrega `c_limit`) | Banner Salidas de Baño, `custom.cover_image` | 3333 × 5000 |
| M14 | `M14-gaattbpghl9loslphqz6.png` | Producto, `size_guide_image` | |

Reglas de nombres de Archivos (`DOC`): no pueden empezar con punto ni terminar (antes de la extensión) en `pico`, `icon`, `thumb`, `testing`, `small`, `compact`, `medium`, `large` o `grande`. Los 12 nombres cumplen (verificado con una expresión regular sobre los 12: ninguno empieza con punto ni termina en esas palabras) y son únicos gracias al prefijo del id.

**Referencia que espera el theme** (formato observado, `NOT_VERIFIED` en la doc; se copia del Editor de temas, ver §7 P4):

| Setting | Tipo | Formato esperado por el script |
|---|---|---|
| `hero_video`, bloque `video` | `video` | `shopify://files/videos/<archivo>.<mp4\|mov\|webm>` |
| bloque `image`, `size_guide_image` | `image_picker` | `shopify://shop_images/<archivo>.<jpg\|png\|webp>` |
| `custom.cover_image` (M10–M13) | archivo | nombre del archivo, o `gid://shopify/MediaImage/<n>` |

---

## 5. Mapeo a destinos

### 5.1 Hero (video)

| Dato | Valor |
|---|---|
| Archivo | M01 (variante servida): `M01-bb70lfnhpbl4h8ee7mdz.mp4`, H.264, 1278 × 720, 8,31 s, 2.126.124 bytes |
| Destino | `templates/index.json` › `hero` › `hero_video` (`sections/hero.liquid:66-70`, tipo `video`) |
| Render | `video_tag` con autoplay, loop, muted, playsinline y sin controles (`hero.liquid:28-30`) |
| Sin video | fondo decorativo (`hero.liquid:31-35`) |
| Poster | M02 no se migra: Shopify genera su propia vista previa (`hero.liquid:9-13`) |

### 5.2 Tarjetas de categorías (4)

Con video, la tarjeta dibuja el video y no la imagen (`sections/featured-categories.liquid:51-55`); la imagen es el respaldo (`:41`, `:53-55`).

| Bloque (clave en `index.json`) | `image` | `video` | Qué se ve | Schema |
|---|---|---|---|---|
| `oasis-natural` | M03 | M04 | video | `:122-127`, `:128-133` |
| `aurora-viva` | M05 | M06 (= archivo de M01) | video | igual |
| `espuma-de-ola` | M07 (opcional) | M08 | video (sin M07 el respaldo es `collection.featured_image`) | igual |
| `salidas-de-bano` | **M09 (crítica)** | no existe | imagen: la colección tiene 0 productos, así que sin M09 la tarjeta queda **sin media** | igual |

### 5.3 Banners de colección (4): metafields `custom.*`

Se cargan a mano en **Admin › Productos › Colecciones › (colección) › Metacampos**. Los valores salen del manifiesto 03D. `number_decimal` admite como máximo 9 decimales (`DOC`), así que se cargan redondeados a 9 decimales (diferencia menor a 0,000000001 puntos porcentuales).

| Colección (handle) | Archivo | `custom.cover_image` | `custom.image_pos_x` | `custom.image_pos_y` | `custom.zoom` | Valores 03D exactos (x / y) |
|---|---|---|---|---|---|---|
| Oasis Natural (`oasis-natural`) | M10, 2400 × 1600 | `M10-x95tyqydlvieasp7whfn.jpg` | `50` | `26.68997669` | `1` | 50 / 26.689976689976692 |
| Aurora Viva (`aurora-viva`) | M11, 1920 × 800 | `M11-c9gz6yuipjnowjyp3amd.jpg` | `43.932724252` | `69.976846586` | `1.4` | 43.932724252491695 / 69.97684658575744 |
| Espuma de Ola (`espuma-de-ola`) | M12, 1920 × 800 | `M12-n9to8ksgrw1xmxlxm2ch.jpg` | `53.682170543` | `55` | `1` | 53.68217054263566 / 55 |
| Salidas de Baño (`salidas-de-bano`) | M13, **3333 × 5000** (entrega `c_limit`) | `M13-grhrfruybukvqgk6ngrc.jpg` | `61.627906977` | `59.972144465` | `1.15` | 61.62790697674419 / 59.97214446504011 |

- `custom.cover_video` queda **vacío** en las 4 (los banners reales no tienen video).
- El banner con encuadre exige que los **tres** decimales tengan valor y que `collection_show_banner` sea `true` (`snippets/collection-banner.liquid:45`; ajuste en `config/settings_data.json`, ver 03E §2.1).
- **Pre-requisito antes de cargar los metafields:** el arreglo de R10 (leer los metafields con `.value`) **ya está en `theme-src`** (`collection-banner.liquid:33-39`), pero no se puede saber desde aquí si el theme remoto ya lo tiene (`NOT_VERIFIED`). Confirmar que el RC con ese snippet está publicado en el theme sin publicar antes de P9; si no, el banner podría salir sin foto aunque los metafields estén bien.
- `assets/collection-banner.js:48` aborta si `data-image-width` o `data-image-height` no son números. Es el síntoma que hay que buscar en QA (§10).

### 5.4 Guía de tallas

| Dato | Valor |
|---|---|
| Archivo | M14: `M14-gaattbpghl9loslphqz6.png`, PNG RGB 8 bits, 1024 × 1536, 1.446.367 bytes |
| Destino | `templates/product.json` › `main` › `size_guide_image` (`sections/main-product.liquid:423-427`) |
| Restricción | `size_guide_collection` = `oasis-natural` (`:433-438`); el respaldo solo aplica a productos de esa colección (lógica en `:44-65`) |
| Alt | «Guía de tallas» (clave `products.product.size_guide`, `:346-349`) |
| Efecto | Ficha de Oasis Natural: botón «Guía de tallas» y modal con la imagen. Ficha de Aurora Viva o Espuma de Ola: sin botón |
| Texto | No existe contenido de texto (`NOT_AVAILABLE`); `size_guide_content` se deja vacío |

---

## 6. Riesgo HEVC y `.mov`

### 6.1 Qué dice la documentación oficial (consultada hoy)

| Fuente | Lo que dice | Lo que **no** dice |
|---|---|---|
| Ayuda de Shopify › Cargar archivos (§14) | Tipos de video aceptados: MOV, MP4 y WEBM. En «Recommended video specifications», códec de video soportado: **H.264 (AVC)**; audio AAC, MP3 u Opus. Lado entre 100 y 4096 px; hasta 1 GB y 10 min | No menciona HEVC/H.265 ni dice que se rechace. No habla de transcodificación |
| Ayuda de Shopify › Tipos de media de producto (§14) | Se pueden subir `.webm` y `.mov`; Shopify convierte y sirve todos los videos como `.mp4` o HLS | No dice si un HEVC de entrada se acepta, se convierte o falla |
| Registro de cambios › Video en Archivos y metafields (§14) | Tipos MOV o MP4 | No menciona códecs |
| API `fileCreate` (§14) | Manejo de nombres duplicados con UUID; entradas `originalSource`, `filename`, `contentType`, `alt` | No menciona códecs ni HEVC |

**Veredicto:**

- **`.mov` como contenedor: aceptado** (`DOC`).
- **HEVC como códec: `NOT_VERIFIED`.** No hay texto oficial que diga que se acepta ni que se rechaza; solo se lista H.264. Varias páginas de terceros afirman que HEVC no se soporta; **no son fuentes oficiales y no se usan** para decidir.
- **Aceptar la subida no equivale a que se reproduzca en todos los navegadores.** Si Shopify aceptara un HEVC pero lo sirviera sin convertir, no se vería en los navegadores sin decodificador HEVC. Por eso la prueba de abajo incluye reproducción en más de un navegador.

### 6.2 Qué se midió en los archivos

- Originales: `hvc1` (HEVC) en M01, M04, M06 y M08; M08 en contenedor QuickTime (`.mov`).
- Servidos (`f_auto,q_auto`): `avc1` (H.264) en MP4, con las mismas dimensiones y duración, y entre 23 % y 58 % del tamaño original (M04 servido: 813.565 bytes frente a 3.503.495; M01 servido: 2.126.124 frente a 3.657.361).
- El sitio real ya entrega a sus visitantes esta variante servida (`lib/cloudinary/video-url.ts:6-9`). Subir la servida da **paridad visual con el sitio actual**.

### 6.3 Recomendación

**Subir los 4 videos en variante servida (H.264).** Es el único códec que la doc oficial lista, evita el riesgo y coincide con lo que ve el visitante hoy. Cuesta un poco de calidad de compresión (`q_auto`), imperceptible en un fondo en bucle.

### 6.4 Prueba de 1 archivo (solo si se quieren los originales HEVC)

Qué resuelve: si Shopify acepta y reproduce un HEVC en `.mov`. Se usa **M08** porque es el peor caso: `.mov` + HEVC + vertical. Si M08 pasa, es de esperar que los otros tres (MP4/HEVC) pasen; si falla, fallarán los cuatro (`INFERENCIA`).

| Paso | Quién | Acción | Resultado |
|---|---|---|---|
| T1 | Daniela | OK explícito de descarga de **un** archivo: M08 original, 3.243.324 bytes, desde `res.cloudinary.com/n8l3p85c` | OK en el chat |
| T2 | Claude | `node shopify-migration/scripts/prepare-media-package.mjs --download --only=M08 --video-variant=original` | `OK prepared/M08-nnohfbsoqzgee20xooog.mov`, `AVISO códec hvc1 (HEVC)` |
| T3 | Daniela | Subir ese archivo a Contenido › Archivos y mirar el estado tras unos minutos | Ver la tabla de resultados |
| T4 | Daniela | Asignarlo al bloque `espuma-de-ola` › Video en el Editor del theme sin publicar y abrir la vista previa en **Chrome y Firefox** (Safari si hay Mac o iPhone) | ¿Se reproduce en todos? |
| T5 | Claude | Borrar `prepared/M08-nnohfbsoqzgee20xooog.mov` (el script no limpia y el archivo viejo se prestaría a confusión) | `prepared/` sin el `.mov` |

| Resultado de la prueba | Conclusión | Siguiente paso |
|---|---|---|
| La subida falla o el archivo queda en error | HEVC no se acepta | Usar la variante servida para los 4 |
| Se acepta, pero no se reproduce en algún navegador | HEVC se acepta pero se sirve sin convertir | Usar la variante servida para los 4 |
| Se acepta y se reproduce en todos los navegadores probados | HEVC funciona para este caso | Decisión de la dueña: originales (más calidad) o servidos (paridad con el sitio) |

Duración de la prueba: unos 15 minutos, más el tiempo de procesamiento del video en Shopify (`INFERENCIA`: minutos).

---

## 7. Flujo exacto (de la aprobación al theme)

Todos los comandos se corren desde la raíz del worktree: `C:\CLAUDE\rada-main\rada-main\commerce-main\commerce-main\.claude\worktrees\shopify-migration-prep`. Dónde dice **Daniela** actúa la dueña; **Claude** corre los comandos. Cada paso que escribe algo pide su propio OK y **ninguna aprobación se extiende a otro paso**.

| Paso | Quién | Acción | Resultado esperado | Si falla |
|---|---|---|---|---|
| **P0** | Daniela | Confirmar que desde la captura de 03D (2026-09-29 15:33 UTC) no se cambió media desde el admin del sitio real (Hero, categorías, banners, guía de tallas). Hoy (19:36 UTC) los 13 tamaños originales eran iguales a los de 03D y el ETag de M01 = M06 (`b53a3029…`) seguía idéntico | «No cambié nada» | Si hubo cambios, las URLs quedan viejas: volver a capturarlas antes de descargar. El script también avisa si los bytes difieren de 03D |
| **P1** | Daniela | **OK explícito de descarga** (texto sugerido abajo) | OK en el chat, indicando la variante de video | Sin OK no se corre nada |
| **P2** | Claude | `node shopify-migration/scripts/prepare-media-package.mjs` (en seco: revisar el plan)<br>`node shopify-migration/scripts/prepare-media-package.mjs --download --video-variant=served` | Ver la lista de comprobación de P2 | Ver la tabla de fallos de P2 |
| **P3** | Daniela | Admin › **Contenido › Archivos › Subir archivos**. Subir **los 12 archivos únicos** de `prepared/` (11 si no se usa M07; hasta 20 por tanda, `DOC`). **No** subir M02. Esperar a que los videos terminen de procesarse | Los 12 quedan en Archivos sin error, con las dimensiones de §2 | Ver §6 si un video se rechaza |
| **P4** | Daniela | **Ruta A (recomendada)**: en el Editor del theme Radaelli **sin publicar** (`admin.shopify.com/store/radaelli-swimwear-dev/themes/189072474431/editor`, **nunca** Horizon):<br>- Inicio › Hero › «Video de fondo (opcional)» = M01;<br>- Inicio › Categorías destacadas › cada bloque › «Imagen» / «Video» (M03–M09);<br>- Producto › Ficha de producto › «Imagen de la guía (respaldo)» = M14 y «Mostrar la guía de respaldo solo en esta colección» = Oasis Natural;<br>- **Guardar** | Se ven la Home y la ficha con la media | Si un archivo no aparece en el selector: revisar P3 |
| **P4b** | Claude | Bajar los 2 templates a una carpeta temporal **vacía** (nunca a `theme-src`):<br>`shopify theme pull --theme 189072474431 --only templates/index.json --only templates/product.json --path "$env:TEMP\radaelli-pull-03e" --nodelete` | Dos JSON con los valores `shopify://…` que escribió el Editor | Si la CLI pide login: lo hace Daniela |
| **P5** | Claude | `node shopify-migration/scripts/apply-media-wiring.mjs --template > "$env:TEMP\radaelli-media-map.json"`<br>Completar `refs`: M01, M03–M09 y M14 con los valores de P4b; M10–M13 con el nombre del archivo en Archivos. **M07 puede quedar en `null`** | Mapa con 12 referencias (13 con M07) | — |
| **P6** | Claude | **En seco** (por defecto):<br>`node shopify-migration/scripts/apply-media-wiring.mjs --map="$env:TEMP\radaelli-media-map.json"` | `Cobertura del mapa: 12/12`, diff solo de los settings de media, `RESULTADO: DRY-RUN OK — 2 template(s) cambiarían`, código de salida 0 | Cada `ERROR` dice qué corregir (§11). Con errores el script no escribe |
| **P7** | Claude | La misma línea con `--write` y un snapshot en una carpeta que sobreviva a los temporales:<br>`node shopify-migration/scripts/apply-media-wiring.mjs --map="$env:TEMP\radaelli-media-map.json" --write --snapshot-dir="$env:USERPROFILE\radaelli-snapshots\media-wiring-03F"` | `RESULTADO: OK — 2 template(s) escritos`, SHA-256 antes y después, ruta del snapshot y comando de restauración | Si algo falla a mitad, el script **revierte solo** y sale con código 3 |
| **P8** | Claude (con OK de Daniela) | Solo en la Ruta B o para verificar paridad:<br>`shopify theme push --theme 189072474431 --path shopify-migration/theme-src --only templates/index.json --only templates/product.json --nodelete`<br>**Nunca** `--allow-live`; **nunca** el theme `189072113983` (Horizon) | El remoto queda igual al local en esos 2 archivos (pull a una carpeta temporal y comparar SHA-256) | Si el remoto no conserva un setting: volver a la Ruta A |
| **P9** | Daniela | Confirmar el pre-requisito de §5.3 y cargar los metafields de las 4 colecciones con la tabla de §5.3 | Los banners muestran la foto con su encuadre | Ver §10, punto 3 |
| **P10** | Claude | Verificación en vivo (§10) | Todo PASS | Rollback (§9) |

**Texto sugerido para P1 (a copiar en el chat):**

> OK de descarga. Autorizo a Claude a descargar desde `res.cloudinary.com/n8l3p85c` los 12 archivos del manifiesto de media, **con la variante de video `f_auto,q_auto`** (M13 con `c_limit,w_5000,h_5000,q_95`), y a copiar `public/images/products/1 (1).webp` (M07), todo dentro de `shopify-migration/content/media/prepared/`. Total por red: unos 15,6 MB. **No** autorizo subirlos a Shopify ni empujar el theme: eso se aprueba aparte.

**Lista de comprobación de P2** (contra las tablas de §2):

- `13` líneas `OK` (12 descargas + la copia de M07). M06 suma un `AVISO`: «idéntico byte a byte a M01: NO se escribe otro archivo».
- Bytes de cada archivo = los de la tabla de §2.4. M13: **3333x5000, 2964788 bytes**.
- Los 4 videos: códec `avc1`, sin aviso de HEVC. M08 se guarda como `.mp4`.
- `Escrito: content/media/03E-upload-ready-manifest.csv (13 filas)`, `errores 0`, `Archivos únicos para subir a Contenido > Archivos: 12`.
- MD5 de los 7 originales de imagen (M03, M05, M09, M10, M11, M12, M14) = su ETag de §2.1 (comando de §2.4).

| Fallo en P2 | Causa probable | Qué hacer |
|---|---|---|
| `HTTP 404` | El asset cambió en Cloudinary | Volver a P0 y recapturar las URLs |
| `Content-Type … no coincide con la cabecera` | Respuesta inesperada | Detenerse y revisar; no subir ese archivo |
| `EXCEDE` | Manifiesto desactualizado | El script reintenta solo con `c_limit` |
| `AVISO … bytes distintos a 03D` | El asset cambió después de la auditoría | Confirmar con Daniela antes de subirlo (no aplica a derivadas) |
| `AVISO códec …` en un video servido | La variante servida no devolvió `avc1` | No subir ese video y revisarlo |

**Qué cambia en P5–P7 con el script endurecido (03F):**

- `--write` exige `03E-upload-ready-manifest.csv` (lo crea P2). Con él, cada referencia debe contener el nombre del archivo preparado **de su propio id**; así no se puede poner la imagen de una tarjeta en otra.
- Todas las referencias se validan por formato (§4) y no se admiten referencias repetidas entre ids (salvo M01 y M06).
- El mapa debe cubrir **todos** los ids requeridos (12); M07 es opcional. Con un solo id faltante o inválido no se escribe nada.
- El snapshot se verifica antes de escribir y el comando de restauración queda impreso (§9).

---

## 8. Tiempos

Los tiempos de red son `INFERENCIA` (no se descargó nada); los de Admin son estimaciones de trabajo, no mediciones.

| Paso | Tiempo estimado | Notas |
|---|---|---|
| P0–P1 | 5 min | Confirmación y OK |
| P2 | 1–2 min | 12 descargas y la copia local de M07, unos 15,6 MB por red |
| P3 | 10–20 min | 12 archivos en una sola tanda; el procesamiento de los videos en Shopify puede tardar unos minutos más (`NOT_VERIFIED`) |
| P4 | 10–15 min | 9 selectores en el Editor |
| P4b–P7 | 5 min | Pull, mapa, en seco y escritura |
| P8 | 2–5 min | Push de 2 archivos y comparación de SHA-256 |
| P9 | 15–20 min | 4 colecciones × 5 campos = 20 campos |
| P10 | 15–20 min | 2 anchos (375 y 1280 px) y 4 colecciones |
| **Total** | **1 h 15 min a 1 h 45 min** | Más ~15 min si se hace la prueba HEVC de §6.4 |

---

## 9. Rollback: quitar la media y volver al fallback

Nada de esto toca Cloudinary: **el flujo no escribe nada en Cloudinary**, así que no hay nada que revertir allí (salvo la derivada `c_limit` que la sonda generó, que es inocua).

| Qué | Cómo | Queda así |
|---|---|---|
| `theme-src` local | Ver qué restauraría (en seco): `node shopify-migration/scripts/apply-media-wiring.mjs --restore="<snapshot>"`<br>Restaurar: la misma línea con `--write`. El comando exacto se imprime al final de P7 | `templates/index.json` y `templates/product.json` idénticos al original (SHA-256 verificado). Si el archivo cambió después del wiring, el script se niega salvo `--force-restore` |
| Theme remoto (sin publicar) | Opción 1: en el Editor, vaciar los 9 settings y guardar.<br>Opción 2: restaurar `theme-src` (fila anterior) y hacer push de los 2 templates con el comando de P8 | Vuelven los respaldos de abajo |
| Metafields de colección | Vaciar los 4 campos (`cover_image`, `image_pos_x`, `image_pos_y`, `zoom`) en cada colección | El banner vuelve a `collection.image` o al arte por tono (`collection-banner.liquid:73-81`) |
| Archivos subidos | Quedan en Contenido › Archivos sin efecto si nadie los referencia. **Borrarlos es permanente**: lo decide la dueña y no hace falta para el rollback. Si se borra un archivo que el theme aún referencia, esa referencia queda rota | — |
| Archivos locales | `content/media/prepared/` y `03E-upload-ready-manifest.csv` son artefactos locales sin seguimiento: se pueden borrar sin riesgo | — |

**El fallback en cada lugar** (el estado de hoy, sin media):

- **Hero:** fondo decorativo con blobs y textura (`hero.liquid:31-35`).
- **Tarjetas de Oasis, Aurora y Espuma:** `collection.featured_image` (`featured-categories.liquid:41`).
- **Tarjeta de Salidas de Baño:** **sin media** (0 productos). Es el estado actual y el motivo por el que M09 es crítica.
- **Banners:** `collection.image`, y si tampoco existe, el arte por tono (`collection-banner.liquid:73-81`).
- **Ficha de producto:** sin botón de guía de tallas (`main-product.liquid:66-69`).

**Restauración si la escritura falla a mitad:** es automática (código de salida 3, «revertido automáticamente»). Si además falla el revertido (código 4), el script imprime el comando `--restore … --write` para hacerlo a mano. Probado con una falla simulada (§11, caso 6e).

---

## 10. Verificación en vivo después de conectar

Vista previa del theme sin publicar: `<dominio de la tienda>/?preview_theme_id=189072474431`, a **375 px** y a **1280 px**. Las consultas de consola se pegan en las herramientas del navegador.

1. **Home: Hero y tarjetas.**
   - El Hero muestra el video en silencio y en bucle. En consola:
     ```js
     [...document.querySelectorAll('.section-hero video, .section-categories video')].map(v => ({ clase: v.className, src: v.currentSrc, ancho: v.videoWidth, alto: v.videoHeight, listo: v.readyState, pausado: v.paused, mute: v.muted, bucle: v.loop, error: v.error && v.error.code }))
     ```
     Esperado: 4 videos (Hero, Oasis, Aurora, Espuma), `listo` ≥ 3, `pausado: false`, `error: null`, `mute: true`, `bucle: true`.
   - Las 4 tarjetas tienen media: Oasis, Aurora y Espuma con video; **Salidas de Baño con imagen** (M09).
   - En Safari de iPhone con ahorro de energía, el autoplay puede quedar pausado: es comportamiento del sistema, no un fallo de la carga.
2. **Códec.** Si un video no se reproduce en un navegador, anotar navegador y sistema; si se subieron originales HEVC, pasar a la variante servida (§6). En la pestaña Red, los videos deben responder 200 o 206 desde `cdn.shopify.com`, sin 404.
3. **Banners de colección** (`/collections/oasis-natural`, `aurora-viva`, `espuma-de-ola`, `salidas-de-bano`). Comparar a ojo con el sitio real y ejecutar:
   ```js
   (() => { const el = document.querySelector('[data-collection-banner-frame]'); return el && { ...el.dataset, fondo: el.style.backgroundImage.slice(0, 90), tamano: el.style.backgroundSize, posicion: el.style.backgroundPosition }; })()
   ```
   Esperado: `imageWidth` / `imageHeight` con **números** (2400/1600, 1920/800, 1920/800 y 3333/5000) y `posX`, `posY`, `zoom` iguales a §5.3.
   - **Si el banner sale vacío** (sin foto ni arte por tono): mirar los `data-image-width` / `data-image-height` en el código fuente. Si están vacíos, es el R10 (el theme remoto no tiene el arreglo de `.value`), **no** un error de carga de P9.
4. **Guía de tallas.**
   - Una ficha de Oasis Natural (por ejemplo `/products/brisa-natural-beige`) muestra el botón «Guía de tallas»; `document.querySelector('dialog.size-guide-dialog img')?.currentSrc` devuelve una URL de `cdn.shopify.com`.
   - Una ficha de Aurora Viva **no** tiene el botón: `document.querySelector('dialog.size-guide-dialog')` es `null`.
5. **Consola** sin errores propios y sin desbordes a 320 px.
6. **Rendimiento:** el video del Hero está sobre el pliegue. Comparar LCP y peso contra `theme/03E-performance-baseline.md` (`INFERENCIA`: no se midió con media real).
7. **Paridad del código:** repetir P6 con el mismo mapa; debe decir «nada que escribir» o «sin cambio», y el pull del remoto a una carpeta temporal debe dar el mismo SHA-256 que `theme-src` en los 2 templates.
8. **Higiene en Archivos:** revisar que cada archivo muestre dónde se usa y, si se quiere, agregar el texto alternativo de las imágenes de contenido.

---

## 11. Pruebas del script endurecido

### 11.1 Qué garantiza ahora `apply-media-wiring.mjs`

| Garantía | Cómo | Caso |
|---|---|---|
| **Seco por defecto** | Sin `--write` no escribe nada, ni el snapshot | 1a, 2a |
| **Archivos requeridos** | Falta cualquiera de los 6 archivos del theme (2 templates, 3 schemas, manifiesto) → error que los lista **todos** y no escribe | 5a–5d |
| **Manifiesto de subida** | `--write` exige `03E-upload-ready-manifest.csv` (en seco solo avisa) | 5e |
| **Cobertura total** | Los ids requeridos salen del manifiesto (todo lo que no es `NO_MIGRAR` ni `OPCIONAL`): 12. Falta uno, o tiene referencia inválida → error | 2a, 2b, 3a |
| **Todo o nada** | Con cualquier error no hay escritura parcial; `--allow-partial` solo simula y es incompatible con `--write` | 2b, 2d |
| **Duplicados** | Clave repetida en el JSON del mapa (que `JSON.parse` resolvería en silencio), y el mismo archivo en dos destinos (salvo M01 y M06) | 4a, 4c |
| **Formato de referencias** | Patrón por tipo de setting (§4); una URL, un video en un slot de imagen, una extensión rara o espacios → error | 3a, 3b |
| **Archivo correcto en su destino** | Con el manifiesto de subida, la referencia debe contener el nombre preparado **de su id** | 4c, 6c |
| **Escritura atómica** | Temporales verificados → comprobación de que nadie cambió el destino → renombrado → verificación por SHA-256. Si algo falla, revierte solo | 1b, 6e |
| **Snapshot y restauración** | Copia verificada de los originales en un directorio con marca de tiempo + `SNAPSHOT.json` (SHA-256 antes y después) y comando `--restore` (también en seco por defecto) | 1b, 1d–1f, 6g–6j |
| **Solo toca lo previsto** | Antes de escribir se comprueba que las únicas rutas JSON que cambian son los settings de media | 1b |
| **Sin escribir en el theme real por accidente** | `--allow-fake-refs` (solo pruebas) se rechaza si `--theme-src` no es una copia dentro de la carpeta temporal | 6a, 6b |

Opciones nuevas: `--media-dir`, `--snapshot-dir`, `--restore`, `--force-restore`, `--allow-partial`, `--allow-ref-mismatch`, `--allow-fake-refs`, `--verbose`. Códigos de salida: 0 OK · 1 validación fallida (no se escribió nada) · 2 uso incorrecto · 3 falla al escribir (revertido) · 4 falla al escribir y al revertir.

### 11.2 Método de las pruebas

- Comando: `node shopify-migration/scripts/test/test-apply-media-wiring.mjs` (agregar `--quiet` para ver solo el resumen). Resultado hoy: **68/68 PASS**, código de salida 0.
- Todo mapa es **sintético**, con `FAKE` en cada referencia y marcado con `_aviso`. Ninguna referencia existe en Shopify. Los mapas y los manifiestos de prueba se crean en la carpeta temporal y se borran al final; no son entregables.
- Cada `--write` se hizo sobre una **copia** de `theme-src` en la carpeta temporal del sistema. El `theme-src` real solo se leyó (en seco) y, **después de cada caso**, se comparó el SHA-256 de sus 97 archivos y de `content/media/`: idénticos en todos los casos.
- Verificación adicional independiente de la propia suite, con PowerShell `Get-FileHash` sobre los 97 archivos de `theme-src` inmediatamente antes y después de correr la suite completa: la lista de hashes es **idéntica** antes y después de la corrida completa (97 archivos; SHA-256 de la lista: `08D46C3C…2324` en los dos casos), y `templates/index.json` (11:06:11) y `templates/product.json` (14:53:29) conservan su fecha de modificación.
- **Aviso: otra sesión editó `theme-src` mientras se hacía este trabajo.** Entre las primeras corridas de la suite y las últimas cambiaron `theme-src/templates/product.json` (se agregó `"warranty_url": "/pages/garantia"`, a las 14:53:29 hora local) y `theme-src/README.md` (a las 14:58:40). El propio README (líneas 88-89) describe esa versión como el RC1.7 de `theme/03F-sonnet-independent-completion-report.md`, que agrega justo ese enlace a la garantía. **No fueron las pruebas de esta tarea**: dentro de cada corrida de la suite el `theme-src` real quedó idéntico entre el inicio y el final de cada caso, `templates/index.json` conserva su fecha de modificación original (11:06:11) y ninguno de los dos cambios agrega settings de media (`hero_video`, `image`, `video` ni `size_guide_*`). Los SHA-256 de `product.json` que aparecen en las salidas de abajo son los de la versión con `warranty_url`.
- En las salidas, `<TMP>` es la carpeta temporal de la prueba, `<MIG>` es `shopify-migration` y `%TEMP%` es la carpeta temporal del sistema.

### 11.3 Caso 1: mapa completo

**1a. Seco (por defecto) sobre el `theme-src` real (solo lectura):** exit 0, `theme-src` intacto.

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\completo.json --media-dir=<TMP>\media
=== apply-media-wiring (03F) ===
Modo:      DRY-RUN (no escribe nada)
Mapa:      <TMP>\maps\completo.json
Theme:     <MIG>\theme-src
Manifiestos: <TMP>\media

Verificaciones: archivos requeridos 6/6 presentes · schema 10 OK · manifiesto 13 OK

Cobertura del mapa: 12/12 ids requeridos (+ 1 opcional)
  M01  OK       shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4   -> templates/index.json > hero > hero_video
  M03  OK       shopify://shop_images/FAKE-M03-zjlcdrptowzxnmcz7ixf.jpg   -> templates/index.json > featured-categories > oasis-natural > image
  M04  OK       shopify://files/videos/FAKE-M04-xxjjwoori52cmkbgu33n.mp4   -> templates/index.json > featured-categories > oasis-natural > video
  M05  OK       shopify://shop_images/FAKE-M05-zdxbjacneyll6npdosdu.png   -> templates/index.json > featured-categories > aurora-viva > image
  M06  OK       shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4   -> templates/index.json > featured-categories > aurora-viva > video
  M07  opcional (sin referencia válida)   -> templates/index.json > featured-categories > espuma-de-ola > image
  M08  OK       shopify://files/videos/FAKE-M08-nnohfbsoqzgee20xooog.mp4   -> templates/index.json > featured-categories > espuma-de-ola > video
  M09  OK       shopify://shop_images/FAKE-M09-gz9ken66as28i5hresne.png   -> templates/index.json > featured-categories > salidas-de-bano > image
  M10  OK       FAKE-M10-x95tyqydlvieasp7whfn.jpg   -> oasis-natural > custom.cover_image
  M11  OK       FAKE-M11-c9gz6yuipjnowjyp3amd.jpg   -> aurora-viva > custom.cover_image
  M12  OK       FAKE-M12-n9to8ksgrw1xmxlxm2ch.jpg   -> espuma-de-ola > custom.cover_image
  M13  OK       FAKE-M13-grhrfruybukvqgk6ngrc.jpg   -> salidas-de-bano > custom.cover_image
  M14  OK       shopify://shop_images/FAKE-M14-gaattbpghl9loslphqz6.png   -> templates/product.json > main > size_guide_image

Cambios en el theme:
  M01  templates/index.json > hero > hero_video: nuevo: shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4
  M03  templates/index.json > featured-categories > oasis-natural > image: nuevo: shopify://shop_images/FAKE-M03-zjlcdrptowzxnmcz7ixf.jpg
  M04  templates/index.json > featured-categories > oasis-natural > video: nuevo: shopify://files/videos/FAKE-M04-xxjjwoori52cmkbgu33n.mp4
  M05  templates/index.json > featured-categories > aurora-viva > image: nuevo: shopify://shop_images/FAKE-M05-zdxbjacneyll6npdosdu.png
  M06  templates/index.json > featured-categories > aurora-viva > video: nuevo: shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4
  M07  templates/index.json > featured-categories > espuma-de-ola > image: omitido (sin referencia en el mapa)
  M08  templates/index.json > featured-categories > espuma-de-ola > video: nuevo: shopify://files/videos/FAKE-M08-nnohfbsoqzgee20xooog.mp4
  M09  templates/index.json > featured-categories > salidas-de-bano > image: nuevo: shopify://shop_images/FAKE-M09-gz9ken66as28i5hresne.png
  M14  templates/product.json > main > size_guide_image: nuevo: shopify://shop_images/FAKE-M14-gaattbpghl9loslphqz6.png
  M14  templates/product.json > main > size_guide_collection: nuevo: oasis-natural

--- a/templates/index.json
+++ b/templates/index.json
@@ -3,7 +3,8 @@
     "hero": {
       "type": "hero",
       "settings": {
-        "hero_cta_url": "#categorias"
+        "hero_cta_url": "#categorias",
+        "hero_video": "shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4"
       }
     },
     "featured-categories": {
@@ -14,7 +15,9 @@
           "settings": {
             "collection": "oasis-natural",
             "description": "Tonos tierra y vegetación exuberante.",
-            "available": true
+            "available": true,
+            "image": "shopify://shop_images/FAKE-M03-zjlcdrptowzxnmcz7ixf.jpg",
+            "video": "shopify://files/videos/FAKE-M04-xxjjwoori52cmkbgu33n.mp4"
           }
         },
         "aurora-viva": {
@@ -22,7 +25,9 @@
           "settings": {
             "collection": "aurora-viva",
             "description": "Colores luminosos para los primeros rayos del día.",
-            "available": true
+            "available": true,
+            "image": "shopify://shop_images/FAKE-M05-zdxbjacneyll6npdosdu.png",
+            "video": "shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4"
           }
         },
         "espuma-de-ola": {
@@ -30,7 +35,8 @@
           "settings": {
             "collection": "espuma-de-ola",
             "description": "Texturas suaves y tonos marinos.",
-            "available": true
+            "available": true,
+            "video": "shopify://files/videos/FAKE-M08-nnohfbsoqzgee20xooog.mp4"
           }
         },
         "salidas-de-bano": {
@@ -38,7 +44,8 @@
           "settings": {
             "collection": "salidas-de-bano",
             "description": "Prendas ligeras para después del sol.",
-            "available": true
+            "available": true,
+            "image": "shopify://shop_images/FAKE-M09-gz9ken66as28i5hresne.png"
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
+        "size_guide_image": "shopify://shop_images/FAKE-M14-gaattbpghl9loslphqz6.png",
+        "size_guide_collection": "oasis-natural"
       }
     },
     "recommendations": {

Metafields de colección (se cargan a mano en el Admin; este script no los escribe):
  Colección Oasis Natural (oasis-natural) — Admin > Productos > Colecciones > Oasis Natural > Metacampos
    custom.cover_image (archivo de imagen) = FAKE-M10-x95tyqydlvieasp7whfn.jpg   [M10]
    custom.image_pos_x (decimal) = 50
    custom.image_pos_y (decimal) = 26.68997669   (03D: 26.689976689976692; number_decimal admite 9 decimales)
    custom.zoom (decimal) = 1
    custom.cover_video = (dejar vacío: el banner real no tiene video)
  … [recortado] Aurora Viva, Espuma de Ola y Salidas de Baño: mismos 5 campos, con los valores del §5.3

AVISO: mapa de PRUEBA (M01, M03, M04, M05, M06, M08, M09, M10, M11, M12, M13, M14): sirve solo para --dry-run

RESULTADO: DRY-RUN OK — 2 template(s) cambiarían: templates/index.json, templates/product.json. No se escribió nada. Para aplicar: agregar --write.
[exit 0]
```

**1b. `--write` sobre una copia temporal** (snapshot en la ruta por defecto): exit 0. Las tablas repetidas se recortaron.

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\completo.json --media-dir=<TMP>\media --theme-src=<TMP>\theme-1 --write --allow-fake-refs
=== apply-media-wiring (03F) ===
Modo:      WRITE (escribe theme-src/templates; todo o nada)
Mapa:      <TMP>\maps\completo.json
Theme:     <TMP>\theme-1
Manifiestos: <TMP>\media

Verificaciones: archivos requeridos 6/6 presentes · schema 10 OK · manifiesto 13 OK

Cobertura del mapa: 12/12 ids requeridos (+ 1 opcional)
  … [recortado] las 13 filas de la tabla de cobertura (formato de 1a)

Cambios en el theme:
  M01  templates/index.json > hero > hero_video: nuevo: shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4
  M03  templates/index.json > featured-categories > oasis-natural > image: nuevo: shopify://shop_images/FAKE-M03-zjlcdrptowzxnmcz7ixf.jpg
  M04  templates/index.json > featured-categories > oasis-natural > video: nuevo: shopify://files/videos/FAKE-M04-xxjjwoori52cmkbgu33n.mp4
  M05  templates/index.json > featured-categories > aurora-viva > image: nuevo: shopify://shop_images/FAKE-M05-zdxbjacneyll6npdosdu.png
  M06  templates/index.json > featured-categories > aurora-viva > video: nuevo: shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4
  M07  templates/index.json > featured-categories > espuma-de-ola > image: omitido (sin referencia en el mapa)
  M08  templates/index.json > featured-categories > espuma-de-ola > video: nuevo: shopify://files/videos/FAKE-M08-nnohfbsoqzgee20xooog.mp4
  M09  templates/index.json > featured-categories > salidas-de-bano > image: nuevo: shopify://shop_images/FAKE-M09-gz9ken66as28i5hresne.png
  M14  templates/product.json > main > size_guide_image: nuevo: shopify://shop_images/FAKE-M14-gaattbpghl9loslphqz6.png
  M14  templates/product.json > main > size_guide_collection: nuevo: oasis-natural

… [recortado] diff de templates/index.json y templates/product.json: los mismos 9 settings nuevos que en la salida 1a (7 en index.json y 2 en product.json)

Metafields de colección (se cargan a mano en el Admin; este script no los escribe):
  Colección Oasis Natural (oasis-natural) — Admin > Productos > Colecciones > Oasis Natural > Metacampos
    custom.cover_image (archivo de imagen) = FAKE-M10-x95tyqydlvieasp7whfn.jpg   [M10]
    custom.image_pos_x (decimal) = 50
    custom.image_pos_y (decimal) = 26.68997669   (03D: 26.689976689976692; number_decimal admite 9 decimales)
    custom.zoom (decimal) = 1
    custom.cover_video = (dejar vacío: el banner real no tiene video)
  … [recortado] Aurora Viva, Espuma de Ola y Salidas de Baño: mismos 5 campos, con los valores del §5.3

AVISO: mapa de PRUEBA (M01, M03, M04, M05, M06, M08, M09, M10, M11, M12, M13, M14): escritura permitida solo por --allow-fake-refs sobre una copia temporal

Snapshot verificado: %TEMP%\radaelli-media-wiring-2026-09-29T20-02-26-683Z-1cda

Escritos (SHA-256 antes -> después, verificado tras escribir):
  templates/index.json  bfb72c06dfc0… -> 42fb172e60fe…  (2116 -> 2681 bytes)
  templates/product.json  2205619a45c1… -> aa60602aac86…  (1739 -> 1876 bytes)

Snapshot de rollback: %TEMP%\radaelli-media-wiring-2026-09-29T20-02-26-683Z-1cda
  Ver qué restauraría:  node shopify-migration/scripts/apply-media-wiring.mjs --restore="%TEMP%\radaelli-media-wiring-2026-09-29T20-02-26-683Z-1cda" --theme-src="<TMP>\theme-1"
  Restaurar:            node shopify-migration/scripts/apply-media-wiring.mjs --restore="%TEMP%\radaelli-media-wiring-2026-09-29T20-02-26-683Z-1cda" --theme-src="<TMP>\theme-1" --write

RESULTADO: OK — 2 template(s) escritos. Siguiente paso: runbook 03F (push SOLO de estos templates al theme sin publicar, con OK de la dueña).
[exit 0]
```

- Comparando el SHA-256 de los 97 archivos de la copia antes y después: cambiaron 2 (`templates/index.json` y `templates/product.json`) y 95 quedaron idénticos.
- **1c. Segunda corrida `--write`:** exit 0, «nada que escribir», sin snapshot nuevo.

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\completo.json --media-dir=<TMP>\media --theme-src=<TMP>\theme-1 --write --allow-fake-refs --snapshot-dir=<TMP>\snap-1c
=== apply-media-wiring (03F) ===
…
AVISO: mapa de PRUEBA (M01, M03, M04, M05, M06, M08, M09, M10, M11, M12, M13, M14): escritura permitida solo por --allow-fake-refs sobre una copia temporal

RESULTADO: OK — nada que escribir (theme-src ya tiene estas referencias).
[exit 0]
```

**1d. Restaurar en seco** y **1e. restaurar con `--write`:** la copia vuelve a ser idéntica al `theme-src` original (SHA-256 de los 97 archivos).

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --restore=%TEMP%\radaelli-media-wiring-2026-09-29T20-02-26-683Z-1cda --theme-src=<TMP>\theme-1
=== apply-media-wiring: RESTAURAR snapshot (03F) ===
Modo:      DRY-RUN (no escribe nada)
Snapshot:  %TEMP%\radaelli-media-wiring-2026-09-29T20-02-26-683Z-1cda
Theme:     <TMP>\theme-1

  templates/index.json: 42fb172e60fe… (wiring) -> bfb72c06dfc0… (original)
  templates/product.json: aa60602aac86… (wiring) -> 2205619a45c1… (original)

RESULTADO: DRY-RUN OK — se restaurarían 2 archivo(s). No se escribió nada. Para aplicar: agregar --write
[exit 0]
```

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --restore=%TEMP%\radaelli-media-wiring-2026-09-29T20-02-26-683Z-1cda --theme-src=<TMP>\theme-1 --write
=== apply-media-wiring: RESTAURAR snapshot (03F) ===
Modo:      WRITE (restaura los archivos originales)
Snapshot:  %TEMP%\radaelli-media-wiring-2026-09-29T20-02-26-683Z-1cda
Theme:     <TMP>\theme-1

  templates/index.json: 42fb172e60fe… (wiring) -> bfb72c06dfc0… (original)
  templates/product.json: aa60602aac86… (wiring) -> 2205619a45c1… (original)

RESULTADO: OK — restaurados 2 archivo(s): templates/index.json, templates/product.json.
[exit 0]
```

### 11.4 Caso 2: mapa incompleto (faltan M09 y M14)

**2a. En seco:** exit 1.

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\incompleto.json --media-dir=<TMP>\media
=== apply-media-wiring (03F) ===
Modo:      DRY-RUN (no escribe nada)
Mapa:      <TMP>\maps\incompleto.json
Theme:     <MIG>\theme-src
Manifiestos: <TMP>\media

Verificaciones: archivos requeridos 6/6 presentes · schema 10 OK · manifiesto 13 OK

Cobertura del mapa: 10/12 ids requeridos (+ 1 opcional)
  M01  OK       shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4   -> templates/index.json > hero > hero_video
  M03  OK       shopify://shop_images/FAKE-M03-zjlcdrptowzxnmcz7ixf.jpg   -> templates/index.json > featured-categories > oasis-natural > image
  M04  OK       shopify://files/videos/FAKE-M04-xxjjwoori52cmkbgu33n.mp4   -> templates/index.json > featured-categories > oasis-natural > video
  M05  OK       shopify://shop_images/FAKE-M05-zdxbjacneyll6npdosdu.png   -> templates/index.json > featured-categories > aurora-viva > image
  M06  OK       shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4   -> templates/index.json > featured-categories > aurora-viva > video
  M07  opcional (sin referencia válida)   -> templates/index.json > featured-categories > espuma-de-ola > image
  M08  OK       shopify://files/videos/FAKE-M08-nnohfbsoqzgee20xooog.mp4   -> templates/index.json > featured-categories > espuma-de-ola > video
  M09  FALTA    (sin referencia válida)   -> templates/index.json > featured-categories > salidas-de-bano > image
  M10  OK       FAKE-M10-x95tyqydlvieasp7whfn.jpg   -> oasis-natural > custom.cover_image
  M11  OK       FAKE-M11-c9gz6yuipjnowjyp3amd.jpg   -> aurora-viva > custom.cover_image
  M12  OK       FAKE-M12-n9to8ksgrw1xmxlxm2ch.jpg   -> espuma-de-ola > custom.cover_image
  M13  OK       FAKE-M13-grhrfruybukvqgk6ngrc.jpg   -> salidas-de-bano > custom.cover_image
  M14  FALTA    (sin referencia válida)   -> templates/product.json > main > size_guide_image

Cambios en el theme:
  (no se aplican: hay errores)

(diff omitido: hay errores; con errores no se escribe nada)
Metafields de colección: (se listan cuando el mapa no tiene errores)

AVISO: mapa de PRUEBA (M01, M03, M04, M05, M06, M08, M10, M11, M12, M13): sirve solo para --dry-run
AVISO: CRÍTICO: sin M09 la tarjeta Salidas de Baño queda sin media (la colección tiene 0 productos)
ERROR: mapa incompleto: 10/12 ids requeridos con referencia válida; faltan M09, M14; todo o nada: no se escribe nada

RESULTADO: RECHAZADO — 1 error(es). No se escribió nada.
[exit 1]
```

**2b. `--write` sobre una copia:** exit 1; **ni `index.json` ni `product.json` cambiaron** (los otros 10 ids requeridos estaban bien, y aun así no se escribió nada) y no se creó snapshot.

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\incompleto.json --media-dir=<TMP>\media --theme-src=<TMP>\theme-2 --write --allow-fake-refs --snapshot-dir=<TMP>\snap-2b
=== apply-media-wiring (03F) ===
Modo:      WRITE (escribe theme-src/templates; todo o nada)
Mapa:      <TMP>\maps\incompleto.json
Theme:     <TMP>\theme-2
Manifiestos: <TMP>\media

Verificaciones: archivos requeridos 6/6 presentes · schema 10 OK · manifiesto 13 OK

Cobertura del mapa: 10/12 ids requeridos (+ 1 opcional)
  … [recortado] las 13 filas de la tabla de cobertura (formato de 1a)

Cambios en el theme:
  (no se aplican: hay errores)

(diff omitido: hay errores; con errores no se escribe nada)
Metafields de colección: (se listan cuando el mapa no tiene errores)

AVISO: mapa de PRUEBA (M01, M03, M04, M05, M06, M08, M10, M11, M12, M13): escritura permitida solo por --allow-fake-refs sobre una copia temporal
AVISO: CRÍTICO: sin M09 la tarjeta Salidas de Baño queda sin media (la colección tiene 0 productos)
ERROR: mapa incompleto: 10/12 ids requeridos con referencia válida; faltan M09, M14; todo o nada: no se escribe nada

RESULTADO: RECHAZADO — 1 error(es). No se escribió nada. (theme-src intacto)
[exit 1]
```

**2c. `--allow-partial` (solo simulación):** exit 0 con un `AVISO` que dice que `--write` lo rechazaría.

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\incompleto.json --media-dir=<TMP>\media --allow-partial
=== apply-media-wiring (03F) ===
Modo:      DRY-RUN (no escribe nada)  · --allow-partial
Mapa:      <TMP>\maps\incompleto.json
Theme:     <MIG>\theme-src
Manifiestos: <TMP>\media

Verificaciones: archivos requeridos 6/6 presentes · schema 10 OK · manifiesto 13 OK

Cobertura del mapa: 10/12 ids requeridos (+ 1 opcional)
  … [recortado] las 13 filas de la tabla de cobertura (formato de 1a)

Cambios en el theme:
  M01  templates/index.json > hero > hero_video: nuevo: shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4
  M03  templates/index.json > featured-categories > oasis-natural > image: nuevo: shopify://shop_images/FAKE-M03-zjlcdrptowzxnmcz7ixf.jpg
  M04  templates/index.json > featured-categories > oasis-natural > video: nuevo: shopify://files/videos/FAKE-M04-xxjjwoori52cmkbgu33n.mp4
  M05  templates/index.json > featured-categories > aurora-viva > image: nuevo: shopify://shop_images/FAKE-M05-zdxbjacneyll6npdosdu.png
  M06  templates/index.json > featured-categories > aurora-viva > video: nuevo: shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4
  M07  templates/index.json > featured-categories > espuma-de-ola > image: omitido (sin referencia en el mapa)
  M08  templates/index.json > featured-categories > espuma-de-ola > video: nuevo: shopify://files/videos/FAKE-M08-nnohfbsoqzgee20xooog.mp4
  M09  templates/index.json > featured-categories > salidas-de-bano > image: omitido (sin referencia en el mapa)
  M14  templates/product.json > main > size_guide_image: omitido (sin referencia en el mapa)

… [recortado] diff de templates/index.json y templates/product.json: los mismos 9 settings nuevos que en la salida 1a (7 en index.json y 2 en product.json)

Metafields de colección (se cargan a mano en el Admin; este script no los escribe):
  Colección Oasis Natural (oasis-natural) — Admin > Productos > Colecciones > Oasis Natural > Metacampos
    custom.cover_image (archivo de imagen) = FAKE-M10-x95tyqydlvieasp7whfn.jpg   [M10]
    custom.image_pos_x (decimal) = 50
    custom.image_pos_y (decimal) = 26.68997669   (03D: 26.689976689976692; number_decimal admite 9 decimales)
    custom.zoom (decimal) = 1
    custom.cover_video = (dejar vacío: el banner real no tiene video)
  … [recortado] Aurora Viva, Espuma de Ola y Salidas de Baño: mismos 5 campos, con los valores del §5.3

AVISO: mapa de PRUEBA (M01, M03, M04, M05, M06, M08, M10, M11, M12, M13): sirve solo para --dry-run
AVISO: mapa incompleto: 10/12 ids requeridos con referencia válida; faltan M09, M14; simulación parcial por --allow-partial: --write lo rechazaría
AVISO: CRÍTICO: sin M09 la tarjeta Salidas de Baño queda sin media (la colección tiene 0 productos)

RESULTADO: DRY-RUN OK — 1 template(s) cambiarían: templates/index.json. No se escribió nada. Para aplicar: agregar --write.
[exit 0]
```

**2d. `--allow-partial` con `--write`:** rechazado por uso (exit 2).

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\incompleto.json --media-dir=<TMP>\media --theme-src=<TMP>\theme-2 --write --allow-partial --allow-fake-refs
ERROR: --allow-partial es solo para simulación: incompatible con --write (todo o nada)
[exit 2]
```

### 11.5 Caso 3: referencias con formato inválido

Cinco referencias malas a propósito: M03 (video en un slot de imagen), M04 (sin `shopify://`), M05 (con espacios), M10 (una URL en vez de un nombre) y M14 (extensión `.exe`). **3a. En seco:** exit 1, un `ERROR` por cada una, y las 5 no cuentan como cubiertas (7/12).

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\formato-invalido.json --media-dir=<TMP>\media --theme-src=<TMP>\theme-3
=== apply-media-wiring (03F) ===
Modo:      DRY-RUN (no escribe nada)
Mapa:      <TMP>\maps\formato-invalido.json
Theme:     <TMP>\theme-3
Manifiestos: <TMP>\media

Verificaciones: archivos requeridos 6/6 presentes · schema 10 OK · manifiesto 13 OK

Cobertura del mapa: 7/12 ids requeridos (+ 1 opcional)
  M01  OK       shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4   -> templates/index.json > hero > hero_video
  M03  INVÁLIDA (sin referencia válida)   -> templates/index.json > featured-categories > oasis-natural > image
  M04  INVÁLIDA (sin referencia válida)   -> templates/index.json > featured-categories > oasis-natural > video
  M05  INVÁLIDA (sin referencia válida)   -> templates/index.json > featured-categories > aurora-viva > image
  M06  OK       shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4   -> templates/index.json > featured-categories > aurora-viva > video
  M07  opcional (sin referencia válida)   -> templates/index.json > featured-categories > espuma-de-ola > image
  M08  OK       shopify://files/videos/FAKE-M08-nnohfbsoqzgee20xooog.mp4   -> templates/index.json > featured-categories > espuma-de-ola > video
  M09  OK       shopify://shop_images/FAKE-M09-gz9ken66as28i5hresne.png   -> templates/index.json > featured-categories > salidas-de-bano > image
  M10  INVÁLIDA (sin referencia válida)   -> oasis-natural > custom.cover_image
  M11  OK       FAKE-M11-c9gz6yuipjnowjyp3amd.jpg   -> aurora-viva > custom.cover_image
  M12  OK       FAKE-M12-n9to8ksgrw1xmxlxm2ch.jpg   -> espuma-de-ola > custom.cover_image
  M13  OK       FAKE-M13-grhrfruybukvqgk6ngrc.jpg   -> salidas-de-bano > custom.cover_image
  M14  INVÁLIDA (sin referencia válida)   -> templates/product.json > main > size_guide_image

Cambios en el theme:
  (no se aplican: hay errores)

(diff omitido: hay errores; con errores no se escribe nada)
Metafields de colección: (se listan cuando el mapa no tiene errores)

AVISO: mapa de PRUEBA (M01, M06, M08, M09, M11, M12, M13): sirve solo para --dry-run
ERROR: M03: formato de referencia inesperado para un setting image_picker; se espera shopify://shop_images/<archivo>.<jpg|png|webp>; recibí "shopify://files/videos/FAKE-M03-zjlcdrptowzxnmcz7ixf.mp4"
ERROR: M04: una referencia de theme debe empezar con shopify:// (se copia del Editor de temas, ver el runbook); recibí "FAKE-M04-xxjjwoori52cmkbgu33n.mp4"
ERROR: M05: la referencia tiene espacios, comillas, barras invertidas o caracteres de control
ERROR: M10: para metafields usar el nombre del archivo en Archivos (<nombre>.<jpg|png|webp>) o gid://shopify/MediaImage/<n>; recibí "https://cdn.shopify.com/s/files/FAKE-M10-x95tyqydlvieasp7whfn.jpg"
ERROR: M14: formato de referencia inesperado para un setting image_picker; se espera shopify://shop_images/<archivo>.<jpg|png|webp>; recibí "shopify://shop_images/FAKE-M14-gaattbpghl9loslphqz6.exe"
ERROR: mapa incompleto: 7/12 ids requeridos con referencia válida; inválidos M03, M04, M05, M10, M14; todo o nada: no se escribe nada

RESULTADO: RECHAZADO — 6 error(es). No se escribió nada.
[exit 1]
```

- **3b.** El mismo mapa con `--write` sobre una copia: exit 1 y la copia queda idéntica.
- **3c.** `--allow-ref-mismatch` solo degrada a `AVISO` el patrón de M03 y M14; M04, M05 y M10 siguen siendo error (exit 1).

### 11.6 Caso 4: id duplicado

**4a.** Mapa completo al que se le repite la clave `"M03"` con otro valor (`JSON.parse` se quedaría en silencio con la última). Un único `ERROR`, con las dos líneas:

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\id-duplicado.json --media-dir=<TMP>\media --theme-src=<TMP>\theme-4
=== apply-media-wiring (03F) ===
Modo:      DRY-RUN (no escribe nada)
Mapa:      <TMP>\maps\id-duplicado.json
Theme:     <TMP>\theme-4
Manifiestos: <TMP>\media

Verificaciones: archivos requeridos 6/6 presentes · schema 10 OK · manifiesto 13 OK

Cobertura del mapa: 12/12 ids requeridos (+ 1 opcional)
  … [recortado] las 13 filas de la tabla de cobertura (formato de 1a)

Cambios en el theme:
  (no se aplican: hay errores)

(diff omitido: hay errores; con errores no se escribe nada)
Metafields de colección: (se listan cuando el mapa no tiene errores)

AVISO: mapa de PRUEBA (M01, M03, M04, M05, M06, M08, M09, M10, M11, M12, M13, M14): sirve solo para --dry-run
ERROR: mapa: clave duplicada "refs.M03" (líneas 5 y 6)

RESULTADO: RECHAZADO — 1 error(es). No se escribió nada.
[exit 1]
```

- **4b.** El mismo mapa con `--write` sobre una copia: exit 1 y la copia queda idéntica.

**4c.** El mismo archivo en dos destinos distintos (M03 y M05). M01 y M06 comparten referencia en el mismo mapa **sin** generar error:

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\referencia-duplicada.json --media-dir=<TMP>\media --theme-src=<TMP>\theme-4
=== apply-media-wiring (03F) ===
Modo:      DRY-RUN (no escribe nada)
Mapa:      <TMP>\maps\referencia-duplicada.json
Theme:     <TMP>\theme-4
Manifiestos: <TMP>\media

Verificaciones: archivos requeridos 6/6 presentes · schema 10 OK · manifiesto 13 OK

Cobertura del mapa: 11/12 ids requeridos (+ 1 opcional)
  … [recortado] las 13 filas de la tabla de cobertura (formato de 1a)

Cambios en el theme:
  (no se aplican: hay errores)

(diff omitido: hay errores; con errores no se escribe nada)
Metafields de colección: (se listan cuando el mapa no tiene errores)

AVISO: mapa de PRUEBA (M01, M03, M04, M06, M08, M09, M10, M11, M12, M13, M14): sirve solo para --dry-run
ERROR: referencia duplicada: M03 y M05 apuntan al mismo archivo "FAKE-M03-zjlcdrptowzxnmcz7ixf.jpg" (cada destino lleva su propio archivo; solo M01 y M06 comparten video)
ERROR: M05: la referencia "shopify://shop_images/FAKE-M03-zjlcdrptowzxnmcz7ixf.jpg" no contiene el nombre del archivo preparado "M05-zdxbjacneyll6npdosdu": ¿archivo equivocado en este destino?
ERROR: mapa incompleto: 11/12 ids requeridos con referencia válida; inválidos M05; todo o nada: no se escribe nada

RESULTADO: RECHAZADO — 3 error(es). No se escribió nada.
[exit 1]
```

### 11.7 Caso 5: archivo requerido ausente

**5a.** A la copia le falta `sections/featured-categories.liquid`:

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\completo.json --media-dir=<TMP>\media --theme-src=<TMP>\theme-5a
=== apply-media-wiring (03F) ===
Modo:      DRY-RUN (no escribe nada)
Mapa:      <TMP>\maps\completo.json
Theme:     <TMP>\theme-5a
Manifiestos: <TMP>\media

ERROR: archivo requerido ausente o ilegible: theme sections/featured-categories.liquid — no existe (<TMP>\theme-5a\sections\featured-categories.liquid)

RESULTADO: RECHAZADO — 1 archivo(s) requerido(s) con problemas. No se escribió nada.
[exit 1]
```

**5b.** El mismo caso con `--write`: exit 1, la copia queda idéntica y no se crea snapshot.

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\completo.json --media-dir=<TMP>\media --theme-src=<TMP>\theme-5a --write --allow-fake-refs --snapshot-dir=<TMP>\snap-5b
=== apply-media-wiring (03F) ===
Modo:      WRITE (escribe theme-src/templates; todo o nada)
Mapa:      <TMP>\maps\completo.json
Theme:     <TMP>\theme-5a
Manifiestos: <TMP>\media

ERROR: archivo requerido ausente o ilegible: theme sections/featured-categories.liquid — no existe (<TMP>\theme-5a\sections\featured-categories.liquid)

RESULTADO: RECHAZADO — 1 archivo(s) requerido(s) con problemas. No se escribió nada.
[exit 1]
```

**5c.** Faltan `templates/product.json` y `sections/hero.liquid` (se listan **todos**), con `--write`:

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\completo.json --media-dir=<TMP>\media --theme-src=<TMP>\theme-5c --write --allow-fake-refs
=== apply-media-wiring (03F) ===
Modo:      WRITE (escribe theme-src/templates; todo o nada)
Mapa:      <TMP>\maps\completo.json
Theme:     <TMP>\theme-5c
Manifiestos: <TMP>\media

ERROR: archivo requerido ausente o ilegible: theme templates/product.json — no existe (<TMP>\theme-5c\templates\product.json)
ERROR: archivo requerido ausente o ilegible: theme sections/hero.liquid — no existe (<TMP>\theme-5c\sections\hero.liquid)

RESULTADO: RECHAZADO — 2 archivo(s) requerido(s) con problemas. No se escribió nada.
[exit 1]
```

**5d.** Sin `media-migration-manifest.csv` (exit 1, mismo formato) y **5e.** `--write` sin `03E-upload-ready-manifest.csv`:

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\completo.json --media-dir=<TMP>\media-sin-subida --theme-src=<TMP>\theme-5e --write --allow-fake-refs
=== apply-media-wiring (03F) ===
Modo:      WRITE (escribe theme-src/templates; todo o nada)
Mapa:      <TMP>\maps\completo.json
Theme:     <TMP>\theme-5e
Manifiestos: <TMP>\media-sin-subida

Verificaciones: archivos requeridos 6/6 presentes · schema 10 OK · manifiesto 13 OK

Cobertura del mapa: 12/12 ids requeridos (+ 1 opcional)
  … [recortado] las 13 filas de la tabla de cobertura (formato de 1a)

Cambios en el theme:
  (no se aplican: hay errores)

(diff omitido: hay errores; con errores no se escribe nada)
Metafields de colección: (se listan cuando el mapa no tiene errores)

AVISO: mapa de PRUEBA (M01, M03, M04, M05, M06, M08, M09, M10, M11, M12, M13, M14): escritura permitida solo por --allow-fake-refs sobre una copia temporal
ERROR: --write exige 03E-upload-ready-manifest.csv (lo genera prepare-media-package.mjs --download): sin él no se puede comprobar que cada referencia sea el archivo de SU destino

RESULTADO: RECHAZADO — 1 error(es). No se escribió nada. (theme-src intacto)
[exit 1]
```

Los casos 5d y 5f (en seco, sin manifiesto de subida: solo un `AVISO`, exit 0) también pasan.

### 11.8 Casos extra de seguridad

| Caso | Qué se probó | Resultado |
|---|---|---|
| 6a | `--write` con mapa FAKE sobre el `theme-src` **real**, sin `--allow-fake-refs` | exit 1, «`--write` rechazado», sin snapshot, `theme-src` intacto |
| 6b | `--allow-fake-refs` sobre el `theme-src` real | exit 2: «solo se permite con `--theme-src` dentro de la carpeta temporal» |
| 6c | La imagen de M05 puesta en el destino de M03 | exit 1: «¿archivo equivocado en este destino?» |
| 6d | `hero_video` ya tenía otro valor | exit 1 «ya vale…»; con `--overwrite` reemplaza (en seco no escribe) |
| 6e | **Falla simulada** al renombrar el 2.º archivo | exit 3, **revertido automáticamente**; el 1.º archivo, ya renombrado, volvió al original (copia idéntica), sin temporales sobrantes |
| 6f–6h | Restaurar cuando `product.json` cambió después del wiring | exit 1 «cambió desde el wiring» y **no restaura ninguno**; con `--force-restore` restaura y la copia vuelve al original |
| 6i | Snapshot corrupto | exit 1 «copia del snapshot está corrupta» |
| 6j | `--restore` sobre una carpeta que no es un snapshot | exit 1 |
| 6k | `--template` | JSON válido con 13 ids en `null` y las ayudas `_Mxx_archivo_preparado` |
| 6l | Detección de claves duplicadas anidadas | `a.b`, `c.[].x` y `a` detectadas, sin falsos positivos |
| 6m | Mapa guardado con la redirección `>` de PowerShell 5.1 (UTF-8 con BOM y UTF-16LE con BOM) | Se lee en los dos formatos (exit 0, cobertura 12/12) |
| 6n | JSON inválido (coma final) | exit 1: `mapa: JSON inválido` |
| 6o | Ids no permitidos: `M02` (NO_MIGRAR), `M99`, `m01` | exit 1 con un error por cada uno y la pista «¿quisiste M01?» |
| 6p | `--verbose` y `--help` | `--verbose` lista cada verificación de schema y manifiesto; `--help` imprime el uso |

Salida del caso 6e (falla simulada; se recortó el bloque repetido):

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\completo.json --media-dir=<TMP>\media --theme-src=<TMP>\theme-6e --write --allow-fake-refs --snapshot-dir=<TMP>\snap-6e   (env RADAELLI_WIRING_TEST_FAULT=rename-second)
=== apply-media-wiring (03F) ===
Modo:      WRITE (escribe theme-src/templates; todo o nada)
Mapa:      <TMP>\maps\completo.json
Theme:     <TMP>\theme-6e
Manifiestos: <TMP>\media

Verificaciones: archivos requeridos 6/6 presentes · schema 10 OK · manifiesto 13 OK

Cobertura del mapa: 12/12 ids requeridos (+ 1 opcional)
  … [recortado] las 13 filas de la tabla de cobertura (formato de 1a)

Cambios en el theme:
  M01  templates/index.json > hero > hero_video: nuevo: shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4
  M03  templates/index.json > featured-categories > oasis-natural > image: nuevo: shopify://shop_images/FAKE-M03-zjlcdrptowzxnmcz7ixf.jpg
  M04  templates/index.json > featured-categories > oasis-natural > video: nuevo: shopify://files/videos/FAKE-M04-xxjjwoori52cmkbgu33n.mp4
  M05  templates/index.json > featured-categories > aurora-viva > image: nuevo: shopify://shop_images/FAKE-M05-zdxbjacneyll6npdosdu.png
  M06  templates/index.json > featured-categories > aurora-viva > video: nuevo: shopify://files/videos/FAKE-M01-bb70lfnhpbl4h8ee7mdz.mp4
  M07  templates/index.json > featured-categories > espuma-de-ola > image: omitido (sin referencia en el mapa)
  M08  templates/index.json > featured-categories > espuma-de-ola > video: nuevo: shopify://files/videos/FAKE-M08-nnohfbsoqzgee20xooog.mp4
  M09  templates/index.json > featured-categories > salidas-de-bano > image: nuevo: shopify://shop_images/FAKE-M09-gz9ken66as28i5hresne.png
  M14  templates/product.json > main > size_guide_image: nuevo: shopify://shop_images/FAKE-M14-gaattbpghl9loslphqz6.png
  M14  templates/product.json > main > size_guide_collection: nuevo: oasis-natural

… [recortado] diff de templates/index.json y templates/product.json: los mismos 9 settings nuevos que en la salida 1a (7 en index.json y 2 en product.json)

Metafields de colección (se cargan a mano en el Admin; este script no los escribe):
  Colección Oasis Natural (oasis-natural) — Admin > Productos > Colecciones > Oasis Natural > Metacampos
    custom.cover_image (archivo de imagen) = FAKE-M10-x95tyqydlvieasp7whfn.jpg   [M10]
    custom.image_pos_x (decimal) = 50
    custom.image_pos_y (decimal) = 26.68997669   (03D: 26.689976689976692; number_decimal admite 9 decimales)
    custom.zoom (decimal) = 1
    custom.cover_video = (dejar vacío: el banner real no tiene video)
  … [recortado] Aurora Viva, Espuma de Ola y Salidas de Baño: mismos 5 campos, con los valores del §5.3

AVISO: mapa de PRUEBA (M01, M03, M04, M05, M06, M08, M09, M10, M11, M12, M13, M14): escritura permitida solo por --allow-fake-refs sobre una copia temporal

Snapshot verificado: <TMP>\snap-6e
ERROR: la escritura falló (falla simulada de prueba (RADAELLI_WIRING_TEST_FAULT)).
RESULTADO: FALLÓ, pero los archivos quedaron como estaban antes (revertido automáticamente).
Copia de los originales: <TMP>\snap-6e
[exit 3]
```

Salida del caso 6g (restauración rechazada porque el archivo cambió):

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --restore=<TMP>\snap-6f --theme-src=<TMP>\theme-6f --write
=== apply-media-wiring: RESTAURAR snapshot (03F) ===
Modo:      WRITE (restaura los archivos originales)
Snapshot:  <TMP>\snap-6f
Theme:     <TMP>\theme-6f

  templates/index.json: 42fb172e60fe… (wiring) -> bfb72c06dfc0… (original)

ERROR: templates/product.json: cambió desde el wiring (SHA-256 actual 92743f0baa82… ≠ aa60602aac86…); revisar o usar --force-restore

RESULTADO: RECHAZADO — 1 error(es). No se escribió nada.
[exit 1]
```

Salida del caso 6a (`--write` con mapa FAKE sobre el theme real):

```text
$ node shopify-migration/scripts/apply-media-wiring.mjs --map=<TMP>\maps\completo.json --media-dir=<TMP>\media --write --snapshot-dir=<TMP>\snap-6a
=== apply-media-wiring (03F) ===
Modo:      WRITE (escribe theme-src/templates; todo o nada)
Mapa:      <TMP>\maps\completo.json
Theme:     <MIG>\theme-src
Manifiestos: <TMP>\media

Verificaciones: archivos requeridos 6/6 presentes · schema 10 OK · manifiesto 13 OK

Cobertura del mapa: 12/12 ids requeridos (+ 1 opcional)
  … [recortado] las 13 filas de la tabla de cobertura (formato de 1a)

Cambios en el theme:
  (no se aplican: hay errores)

(diff omitido: hay errores; con errores no se escribe nada)
Metafields de colección: (se listan cuando el mapa no tiene errores)

ERROR: el mapa tiene referencias de prueba (M01, M03, M04, M05, M06, M08, M09, M10, M11, M12, M13, M14): --write rechazado

RESULTADO: RECHAZADO — 1 error(es). No se escribió nada. (theme-src intacto)
[exit 1]
```

---

## 12. Hallazgos que cambian algo de 03E

1. **R10 ya no está pendiente en `theme-src`.** `snippets/collection-banner.liquid:33-39` ya lee los metafields con `.value` (comentario «03E» en `:27-30`); 03E §0 y R10 lo describen como un arreglo por hacer. Lo que **sí** sigue abierto es confirmar que el theme **remoto** lo tenga: el push de 03E P8 usa `--only` con solo `index.json` y `product.json`, así que este snippet va en el push del RC (`NOT_VERIFIED` si ya se hizo). Ver el pre-requisito de §5.3.
2. **P1 (tamaños): ahora hay medidas.** M13 con `c_limit` pesa **2.964.788 bytes** y los videos servidos **2.126.124** (M01 y M06, el mismo archivo), **813.565** (M04) y **950.392** (M08). Transferencia total con variante servida: **15.595.787 bytes (15,6 MB)**; peso en disco de los 12 archivos únicos: 13.516.595 bytes. El «unos 20,7 MB» de 03E cubre solo los originales sin `c_limit`: con M13 en `c_limit` y videos originales serían **23.641.123 bytes**.
3. **03E §3 y P5 dicen que un prefijo o formato de referencia inesperado «solo emite un aviso». Ya no es así:** ahora es **error** salvo `--allow-ref-mismatch`. También son error las referencias que no corresponden al archivo preparado de su id, las repetidas entre ids (salvo M01 y M06) y un mapa incompleto.
4. **03E P6/P7: `--write` ahora exige `03E-upload-ready-manifest.csv`**, y M07 es el único id opcional (se deduce de `status = OPCIONAL` en el manifiesto, no de una lista fija).
5. **03E §5 y P7 (rollback):** el snapshot ya no es solo `%TEMP%\radaelli-media-wiring-<fecha>\templates\`. Es un directorio con `templates\` **y** `SNAPSHOT.json` (SHA-256 antes y después), con una restauración propia (`--restore`, en seco por defecto). Conviene fijarlo con `--snapshot-dir` porque `%TEMP%` se limpia.
6. **03E §6.2 (resultado en seco):** la salida cambió. Ahora imprime una tabla de cobertura y, con errores, omite el diff y la lista de metafields. El código de salida en seco también es 1 si el mapa es incompleto (antes ese caso salía 0 con «omitido»).
7. **Videos (03D §3.1, 03E R1):** además de HEVC, M08 es **vertical** (1080 × 1920) y su variante servida es MP4/H.264, no `.mov`. Todas las dimensiones y duraciones (7,8 a 8,3 s) quedaron por debajo de los límites de Shopify; ningún video necesita ser reducido.
8. **JPEG y WEBP:** las dimensiones de los 6 JPEG del manifiesto quedaron confirmadas por medición, y M07 mide 1000 × 1500 (03D solo decía «webp»).
9. **Citas de línea desplazadas:** en `sections/main-product.liquid`, el `image_picker` de la guía está en `:423-427` y el selector de colección en `:433-438` (03E cita `:422-436`; 03D, `:415-430`).
10. **M13 `c_limit`:** la derivada se generó hoy a las 19:36:36 UTC por la sonda (§0). Desde ahora existe en Cloudinary; su ETag (`4a928a42…`) y su tamaño son las referencias de comprobación de P2.

---

## 13. `NOT_VERIFIED`

| # | Qué | Por qué | Cómo se resuelve |
|---|---|---|---|
| 1 | **Shopify acepta y reproduce un video HEVC** | La doc oficial solo lista H.264 (AVC) y no dice si HEVC se acepta o rechaza | Prueba de 1 archivo con M08 (§6.4), o subir la variante servida y evitar la pregunta |
| 2 | **Formato de las referencias del theme** `shopify://shop_images/…` y `shopify://files/videos/…` | Es un patrón observado; la doc no documenta cómo guarda el Editor los settings `image_picker` y `video` | Ruta A: copiar lo que escribe el Editor (P4b). El script lo valida y ofrece `--allow-ref-mismatch` si el real difiere |
| 3 | Que Shopify **conserve** el nombre del archivo (mayúsculas, sufijos) | La doc dice que puede añadir un identificador único en duplicados; no detalla el resto | El script compara sin distinguir mayúsculas y con «contiene»; el primer archivo subido lo confirma |
| 4 | Que el ETag de Cloudinary sea el MD5 del archivo | Lo afirma el soporte de Cloudinary para archivos subidos, con un hilo que lo cuestiona; no es una garantía formal, y en derivadas no aplica | `Get-FileHash -Algorithm MD5` tras la descarga (§2.4): si coincide, integridad fuerte; si no, no es error |
| 5 | Que `cover_image \| image_url` funcione sobre el `.value` de un metafield de archivo en la tienda | Los metafields están vacíos y nunca se midió en la tienda; el snippet tolera `.width` directo o `.preview_image.width` (`:38-39`) | QA §10, punto 3 |
| 6 | Que el theme **remoto** tenga el arreglo `.value` del banner | No se puede consultar sin la CLI ni el navegador | Confirmar el push del RC antes de P9 (§5.3) |
| 7 | Tiempo de procesamiento de videos en Shopify, y reproducción real en cada navegador | No se subió nada | P3 y QA §10 |
| 8 | El dominio de la tienda y el id de theme `189072474431` (tomados de 03E) | No se reconsultaron (sin CLI ni navegador) | Confirmar en el admin antes de P4 |
| 9 | Tiempos de la §8 | Estimaciones | Se ajustan con la primera corrida real |
| 10 | Tipo de objeto exacto del audio `mp4a` de los videos (AAC-LC u otro) | Solo se leyó el nombre del códec en `stsd`, no la caja `esds` | Shopify lo mostrará o rechazará al subir; la variante servida de Cloudinary usa el mismo `mp4a` |

---

## 14. Fuentes consultadas (2026-09-29)

- Ayuda de Shopify, «Cargar archivos» (tipos, límites, códecs, 20 archivos por tanda, nombres duplicados y reglas de nombre): https://help.shopify.com/en/manual/shopify-admin/productivity-tools/file-uploads
- Ayuda de Shopify, «Tipos de media de producto» (imagen hasta 5000 × 5000 px o 25 MP y menos de 20 MB; videos convertidos a `.mp4` o HLS): https://help.shopify.com/en/manual/products/product-media/product-media-types
- Registro de cambios de Shopify, «Video en la página de Archivos y metafields»: https://changelog.shopify.com/posts/improved-video-support-for-the-files-page-and-metafields
- API `fileCreate`: https://shopify.dev/docs/api/admin-graphql/latest/mutations/fileCreate
- Cloudinary, soporte sobre `etag` y detección de duplicados: https://support.cloudinary.com/hc/en-us/articles/207441825-How-can-Cloudinary-help-me-to-avoid-duplications-on-my-account- y https://support.cloudinary.com/hc/en-us/community/posts/360022296692-is-Etag-plain-MD5-
- Las fuentes de 03E §7 (metafield, `input-settings`, `theme push/pull`, tipos de datos de metafields) siguen vigentes.
