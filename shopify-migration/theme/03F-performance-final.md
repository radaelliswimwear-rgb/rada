# 03F — Rendimiento final (móvil 390 px y escritorio 1280 px)

Medido el 2026-09-29, ≈ 14:35–14:50 (Bogotá), en la Development Store con el theme Radaelli en preview.

## 1. Lo que NO se pudo medir (y por qué)

**LCP, FCP y CLS reales: NO MEDIBLES en esta sesión.** No son un fallo del theme.

- La ventana de Chrome que controla Claude queda **oculta por otra ventana** (`document.visibilityState = "hidden"`, `hasFocus() = false`). En ese estado Chrome no genera entradas de pintura ni de LCP: `performance.getEntriesByType('paint')` y `'largest-contentful-paint'` devuelven 0.
- Redimensionar la ventana a 390 px no la hace visible.
- Traerla al frente le quita el foco a Daniela mientras trabaja, y no se hace sin que ella lo pida.
- **Chrome headless propio: intentado y descartado.**
  - La tienda tiene contraseña y el HTML solo se obtiene con la sesión de Daniela. Reutilizar la cookie o un enlace de vista previa compartible sería extraer credenciales, y está prohibido.
  - Pasar el HTML por `localhost` lo bloquea Chrome 154 (permiso de "red local", que una pestaña oculta no puede aceptar).
  - Las herramientas quedaron en el scratchpad de la sesión (`perf-server.mjs`, `perf-measure.mjs`), listas para usarse con el storefront publicado o con Daniela presente.
- **Sustituto honesto:** lo que decide el LCP se mide de forma determinista, sin pintar (§ 2).

**Cómo obtener el LCP real (2 min):** con la ventana de Chrome visible, o al publicar, PageSpeed Insights sobre la URL pública (tienda sin contraseña).

## 2. Lo medido: qué imagen elige el navegador y cuánto sobra

Método: se renderiza el HTML real de cada página en un iframe de 390 px y de 1280 px (el layout sí se calcula con la ventana oculta). Por cada imagen, con su `sizes` y `srcset` reales, se calcula el ancho visible en px CSS y el ancho que Chrome descargaría a **3×** (móvil) y **1×** (escritorio), y se compara con el ancho necesario.

| Página | Viewport | Imágenes sobre el pliegue | Principal eager | Secundaria (hover) lazy | Candidato a LCP | Ancho elegido / necesario | Sobredimensión máxima | Subdimensionadas | Overflow horizontal |
|---|---|---|---|---|---|---|---|---|---|
| Home | 390 | **0** | — | — | Texto del hero (sin media) | — | — | — | 0 |
| Home | 1280 | **0** | — | — | Texto del hero | — | — | — | 0 |
| Colección | 390 | 4 | 2 | 2 | Tarjeta 1 | 600 / 491 px | 1,22× | 0 | 0 |
| Colección | 1280 | 6 | 3 | 3 | Tarjeta 1 | 400 / 299 px | 1,34× | 0 | 0 |
| Ficha | 390 | 3 | 1 (+ `fetchpriority=high`) | — | Foto 1 de la ficha | 1000 / 831 px | 1,20× | 0 | 0 |
| Ficha | 1280 | 3 | 1 (+ `fetchpriority=high`) | — | Foto 1 de la ficha | 800 / 714 px | 1,12× | 0 | 0 |
| Búsqueda | 390 | 8 | 4 | 4 | Tarjeta 1 | 600 / 491 px | 1,22× | 0 | 0 |
| Búsqueda | 1280 | 6 | 3 | 3 | Tarjeta 1 | 400 / 384 px | 1,04× | 0 | 0 |
| Carrito | — | 0 | — | — | Texto | — | — | — | 0 |

**Lectura:**
- **Ninguna imagen sobredimensionada** (máximo 1,34× lo necesario; el umbral de alerta es 1,6×) **ni subdimensionada.** El `srcset` de 400–1600 px cubre 390 px @3× y 1280 px @1×.
- **La primera fila de colección y búsqueda es eager** (corrección de RC1.5) **y la imagen de hover es siempre lazy.** La ficha carga su foto principal eager con prioridad alta.
- **La Home no tiene imagen sobre el pliegue** (el hero es texto, hasta que se cargue el video). Cuando se suba el video del hero, ese será el LCP: preload del póster o de la imagen de portada.
- **Sin overflow horizontal** en 4 páginas × 2 anchos (la matriz de 63 combinaciones de 03E sigue vigente para RC1.7).

## 3. Recursos y scripts (medidos en 03E, sin cambios)

- 0 JS bloqueante en `<head>` (los 9–14 scripts del theme son `defer` o módulos).
- Todas las imágenes con `srcset`, `width`/`height` y `alt`.
- 18–21 hojas CSS por página (HTTP/2; consolidarlas es un cambio de arquitectura, solo con LCP real medido).
- Los recursos de plataforma (telemetría, preview bar, `shopify-perf-kit`) son de Shopify y del entorno de preview: no son del theme.

## 4. Conclusión

El theme **no tiene un problema de rendimiento detectable sin pintar**. Falta solo el número de LCP real, que se toma con la ventana visible o publicado. No se cambió nada del theme por esta medición.
