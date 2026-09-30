# 03E — Línea base de rendimiento (catálogo real, Development Store)

Medido el 2026-09-29 a las 12:00 (Bogotá) sobre el theme Radaelli en preview (`189072474431`), en escritorio (1350 px).

## Limitación de la medición (honesta)

- La ventana de Chrome estaba **en segundo plano**: `document.visibilityState = "hidden"`, `document.hasFocus() = false`.
- En ese estado el navegador **no reporta LCP**. Además, la carga diferida no se dispara igual que con la ventana visible.
- Por eso **LCP y los bytes de imágenes cargadas son NO MEDIBLES** en esta sesión.
- Lo que sí se midió:
  - tiempos de navegación y de fetch;
  - un análisis estático del HTML **servido realmente** (atributos de imagen, CSS/JS por plantilla, scripts bloqueantes);
  - CLS en la Home: 0 (medido, aunque con la misma limitación de visibilidad).
- **Mobile:** la ventana no se dejó redimensionar. El HTML es el mismo; la selección responsive de imágenes está cubierta por `srcset`/`sizes` (abajo).
- **Artefactos de preview/Admin, separados del theme:** con la sesión de Admin y `preview_theme_id`, Shopify carga la barra de preview, telemetría (`otlp-http`, `monorail`), `shopify-perf-kit`, `trekkie` y otros. En la Home fueron **231 requests / ~483 KB comprimidos de plataforma**. Un visitante real de la tienda publicada no carga la barra de preview; el resto de los scripts de plataforma los decide Shopify, no el theme.

## Resultados por página (HTML real servido)

| Página | Respuesta (fetch) | HTML | CSS del theme | JS del theme | JS bloqueante | Imágenes en `main` | Sin srcset | Sin width/height | Sin alt | 1.ª imagen |
|---|---|---|---|---|---|---|---|---|---|---|
| Home | 486 ms | 120 KB | 18 | 11 | 0 | 18 | 0 | 0 | 0 | lazy (sobre el pliegue hay solo texto del hero, sin media) |
| Colección (Oasis Natural) | 513 ms | 129 KB | 18 | 11 | 0 | 20 | 0 | 0 | 0 | **lazy → corregido a eager** (ver abajo) |
| Ficha (Brisa Natural Beige) | 476 ms | 116 KB | 21 | 14 | 0 | 16 | 0 | 0 | 0 | **eager + fetchpriority=high** |
| Búsqueda ("bikini") | 572 ms | 176 KB | 19 | 11 | 0 | 40 | 0 | 0 | 0 | **lazy → corregido a eager** |
| Carrito | 451 ms | 65 KB | 18 | 11 | 0 | 0 | — | — | — | — |

Home, navegación real:

- TTFB 521 ms, DOMContentLoaded 650 ms, load 829 ms;
- 27 assets del theme (~31 KB comprimidos, desde caché);
- 0 recursos fallidos; CLS 0.

## Corrección aplicada (RC1.5)

- **Primera fila de colección y búsqueda sin lazy-load.** Las 4 primeras tarjetas de la página 1 salían con `loading="lazy"`. En escritorio son el contenido visible sin scroll y el candidato a LCP; Lighthouse lo reporta como "LCP image was lazily loaded".
- **Cambio:**
  - `main-collection.liquid` y `main-search.liquid` pasan `lazy_load: false` a las 4 primeras tarjetas de la página 1;
  - la imagen secundaria (hover) de la tarjeta queda **siempre** lazy, porque no se ve sin interacción.
- **Pruebas:**
  - test offline "P LCP" (4 eager + resto lazy; secundarias lazy);
  - mutantes 24 y 25, detectados.

## Recomendaciones (no aplicadas; sin evidencia de impacto medida)

1. **Consolidar CSS:** hoy son 18–21 hojas por página. Con HTTP/2 el costo es moderado. Unificarlas sería un cambio de arquitectura con riesgo de regresión visual; conviene hacerlo recién con LCP medido (tienda publicada o ventana visible).
2. **Preload de la fuente de títulos** (Poppins 600), si el LCP medido resulta ser texto.
3. **Medir LCP real** con la tienda publicada o con la ventana de Chrome visible: PageSpeed Insights sobre la URL pública al lanzar. No perseguir un Lighthouse sobre el preview: la barra de preview lo distorsiona.
