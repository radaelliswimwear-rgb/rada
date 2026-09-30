# theme-harness — regresión offline del theme (G15)

Renderiza el **Liquid real** de `../theme-src` con `liquidjs` más *shims* de Shopify y datos de prueba (los mocks viven **solo aquí**), y corre en un navegador la suite de regresión del theme (responsive, accesibilidad, carrito, filtros, envío gratis, favoritos, página de contraseña, convergencia Home/pie de 03H…).

- **No forma parte del theme ni de los ZIP:** `scripts/build-theme-rc.mjs` empaqueta solo los 7 directorios de `theme-src`; esta carpeta no entra en ningún RC.
- **No toca Shopify, Wompi, Production, Staging ni Vercel.** Escucha solo en `127.0.0.1`.
- **Origen:** hasta 03H vivía en el scratchpad de la sesión, fuera del repo (brecha G15 de `launch/03G-reproducibility-gap-audit.md`). En 03I se reubicó aquí con rutas relativas. Suite: **89 pruebas** (74 de 03G + 6 del bloque «03H: convergencia» + 9 del bloque «03K»: SEO de la Home, H-01, orden de encabezados y movimiento reducido).

## Requisitos

Node 18+ y un navegador (la suite se ejecuta en una página; usa iframes). Instalar la única dependencia (`liquidjs`, fijada por `package-lock.json`):

```bash
cd shopify-migration/theme-harness
npm ci
```

## Correr la suite completa

Un solo proceso a la vez, en primer plano o en segundo plano *de la sesión* y **se detiene al terminar** (por puerto):

```bash
node server.js
```

Abrir `http://127.0.0.1:4178/__rc/runner`. Al terminar, `window.__done === true` y `window.__results` es un arreglo con `{ area, name, pass, detail }`. El resumen aparece en la página (`#summary`, «N/N PASS»). Esperado con RC1.10: **89/89 PASS** (medido en 03K en el navegador integrado del escritorio, que no se acelera en segundo plano).

Variables de entorno: `PORT` (default 4178), `THEME_DIR` (default `../theme-src`), `TESTS_FILE` (default `tests.js`).

## Correr solo el bloque de 03H (rápido)

```bash
node make-tests-h.js          # genera tests-h.js (cabecera + bloque «03H: convergencia»)
TESTS_FILE=tests-h.js node server.js
```

## Mutantes (¿la suite detecta un defecto?)

`make-mutants.js <id>` copia `../theme-src` a un directorio temporal del sistema (`%TEMP%/rc-harness/<MUT_DIR>/theme`), reintroduce un defecto conocido y genera `tests-n.js`. Luego se sirve el theme mutado y se corre la suite (o el subconjunto): **debe fallar al menos una prueba**. `id 0` es el control (sin cambios: debe pasar todo).

```bash
MUT_DIR=m52 node make-mutants.js 52        # imprime la carpeta del theme mutado
THEME_DIR=<carpeta impresa> PORT=4179 TESTS_FILE=tests-h.js node server.js
```

Ids disponibles: `0` (control) y `1`–`81` sin huecos (el `4` es el enlace de Favoritos de la cabecera; cada grupo está comentado en `make-mutants.js`: contraseña, filtros de colección 11–16, envío gratis 17–20, … y **convergencia 03H 52–65**, **SEO y contraste 03K 66–77** y **movimiento reducido 03K 78–81**). Se necesita un `tests-*.js` que cubra el defecto: para 52–65 sirve `tests-h.js`; para 1–3 `tests-n.js` (lo genera el propio `make-mutants.js`).

Verificación de la reubicación (03I): respecto de la copia usada en 03H, `server.js` solo cambia un comentario y la ruta por defecto del theme, y `tests.js` cambia **una** aserción (HP-22): el número de WhatsApp esperado ya no está escrito literal (el número público de la marca no se guarda en el repo fuera de la configuración del theme): se deriva del enlace `wa.me` del propio pie con el formato `+CC AAA BBB CCCC`. Con `../theme-src` (RC1.9) el subconjunto `tests-h.js` da **6/6 PASS**; la suite completa pasó **14/14** en la parte que alcanzó a correr con la versión anterior de `tests.js` (una pestaña en segundo plano se acelera muy poco: para las 80 pruebas conviene una ventana al frente); y los mutantes **52** (CTA del hero → `#categorias`), **63** (espacio del número de WhatsApp) y **65** (número inválido en el pie) **fallan** en «HP-03» y «HP-22» (detectados). **Las 80 pruebas completas no se repitieron desde la ubicación nueva** (regresión de 03H: 80/80 con la copia del scratchpad).

## Límites conocidos

- `liquidjs` no es Shopify: difiere en `nil != blank` (Shopify: `false`; liquidjs: `true` → en los tests se pasa `''` en vez de `nil`), y un comentario Liquid que contiene `{{` rompe el parseo de liquidjs. Todo lo que dependa del render de Shopify real (Section Rendering, checkout, mercado, envío) **no** lo cubre este harness: se verifica en la Dev Store.
- El *runner* necesita un navegador; no hay ejecución headless en este repo.
- `tests-h.js` y `tests-n.js` son generados (están en `.gitignore`).
- Los mutantes de píxel (comparación visual) de 02M/03B no se reubicaron: el checklist de paridad visual vive en `theme/03G-home-parity.md` y `launch/03G-responsive-sweep.md`.

## Al terminar

Detener el servidor por puerto (PowerShell: `Get-NetTCPConnection -LocalPort 4178 | ForEach-Object { Stop-Process -Id $_.OwningProcess }`). No debe quedar ningún proceso `node` del harness.

## Banderas de consulta agregadas en 03K (solo del arnés)

`?socimg=1|abs` (imagen para compartir de Ajustes; `abs` = `image_url` ya con protocolo), `?nosocial=1` (sin redes), `?shopdesc=` (descripción de la tienda), `?pdesc=` (descripción de la página), `?pimg=1` (imagen de la página), `?catimg=1` (tarjeta de categoría con imagen), `?hv=1` (video en el hero), `?cv=1` (video en una tarjeta de categoría), `&bv=1` con `?banner=1` (video en el banner de colección). El shim de `video_tag` ahora emite `autoplay loop muted playsinline` como Shopify.
