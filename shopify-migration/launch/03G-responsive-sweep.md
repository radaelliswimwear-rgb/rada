# 03G — Barrido responsive por DOM/layout (8 anchos × 17 superficies)

- **Fecha:** 2026-09-29, medido entre ~17:30 y ~17:58 (Bogotá). Dev Store `radaelli-swimwear-dev`, theme Radaelli RC1.8 (`189072474431`, sin publicar), sesión con país US, idioma es, moneda COP.
- **Resultado:** **136/136 combinaciones sin defectos** en los cinco criterios (0 desbordes horizontales, 0 imágenes rotas, 0 claves de traducción sin resolver, 0 encabezados invisibles, 0 textos obsoletos de EE. UU./USD). Un hallazgo de contraste en la tarjeta de categoría sin imagen (H-01) y una nota de método (encabezados de cajón cerrado).

## 1. Método y sus límites

La ventana de Chrome está **oculta** (`visibilityState: hidden`) y no es redimensionable, así que **no hay medición visual real** (ni LCP/FCP/CLS ni capturas por ancho). En su lugar, medición determinista de DOM/layout:

1. Desde una pestaña de la Dev Store (mismo origen), `fetch` del HTML de cada superficie y carga en un iframe `srcdoc` del ancho objetivo (los iframes por URL están bloqueados; `srcdoc` hereda el origen y ejecuta el JS del theme).
2. Espera de ~3 s, imágenes `loading=lazy` forzadas a `eager` para poder comprobar que cargan, y medición dentro del iframe.
3. Criterios por combinación:
   - **Desborde horizontal:** `documentElement.scrollWidth > ancho` (y hasta 3 elementos culpables).
   - **Imágenes rotas:** `img.complete && naturalWidth === 0` con `src`.
   - **Claves sin traducir:** patrones `general.…`, `products.…`, `cart.…`, etc. en el texto visible, y "translation missing" en el HTML.
   - **Encabezados invisibles:** h1–h4 con `display:none`, `visibility:hidden`, opacidad < 0,1 o tamaño 0; y contraste calculado < 3:1 contra el fondo efectivo (no aplica sobre imagen: las tarjetas de categoría con foto se excluyen y se revisan aparte).
   - **Copy obsoleto de EE. UU./USD:** `USD`, `US$`, `United States`, `Estados Unidos`, `EE. UU.`, `EEUU` en el texto visible.
4. Un h1 por página.

Anchos: 320, 375, 390, 430, 768, 1024, 1280, 1440. Superficies: Home, Oasis Natural, Aurora Viva, Espuma de Ola, Salidas de Baño, Destacados, 5 fichas (`marea-natural`, `alba-dorada-lila`, `bikini-foam`, `camiseta-solar-waves-negro`, `entero-golden-hour`), búsqueda (`?q=bikini`), carrito, Favoritos (`?view=wishlist`), Garantía, Reembolso y Password.

**No cubierto (NOT_MEASURED):** píxeles, regresiones visuales, comportamiento táctil real, checkout a 390 px (nativo de Shopify; ver `launch/03G-checkout-precondition-audit.md`), LCP/FCP/CLS reales, teclado y lector de pantalla (auditado en 03E). El barrido no sustituye una revisión con la ventana visible.

## 2. Resultados por superficie (8 anchos cada una)

| Superficie | Desbordes | Imág. rotas | Claves sin traducir | Copy US/USD | h1 | Encabezados | Imágenes vistas (máx.) |
|---|---:|---:|---:|---:|---:|---|---:|
| Home | 0 | 0 | 0 | 0 | 1 | OK | 18 |
| Oasis Natural | 0 | 0 | 0 | 0 | 1 | OK (nota N-1) | 20 |
| Aurora Viva | 0 | 0 | 0 | 0 | 1 | OK (nota N-1) | 24 |
| Espuma de Ola | 0 | 0 | 0 | 0 | 1 | OK (nota N-1) | 14 |
| Salidas de Baño | 0 | 0 | 0 | 0 | 1 | OK (nota N-1) | 0 |
| Destacados | 0 | 0 | 0 | 0 | 1 | OK (nota N-1) | 14 |
| 5 fichas de producto (40 combinaciones) | 0 | 0 | 0 | 0 | 1 | OK | 16–20 |
| Búsqueda `bikini` | 0 | 0 | 0 | 0 | 1 | OK | 40 |
| Carrito | 0 | 0 | 0 | 0 | 1 | OK | 0 |
| Favoritos (`?view=wishlist`) | 0 | 0 | 0 | 0 | 1 | OK | 0 |
| Garantía | 0 | 0 | 0 | 0 | 1 | OK | 0 |
| Reembolso (`/policies/refund-policy`) | 0 | 0 | 0 | 0 | 1 | OK | 0 |
| Password | 0 | 0 | 0 | 0 | 1 | OK | 0 |
| **Total** | **0** | **0** | **0** | **0** | 136/136 con 1 h1 | 0 defectos | — |

Idioma del documento: `es` en las 136 combinaciones. Ninguna imagen quedó pendiente de carga al medir.

## 3. Hallazgos y notas

| Id | Tipo | Detalle | Evidencia | Acción |
|---|---|---|---|---|
| N-1 | NOTA (método) | En las 5 colecciones, a **320–430 px** el barrido marca como "ocultos" los encabezados del cajón de filtros móvil ("Filtros", "Ordenar por", "Precio"). Es el comportamiento diseñado: el cajón está cerrado y se abre con el botón "Filtros" (probado en 03D/03E: abre, cierra, devuelve el foco). A 768 px o más los filtros van en línea y esos encabezados son visibles (0 marcas). No es un defecto. | 20 combinaciones (5 colecciones × 4 anchos) | Ninguna |
| H-01 | HALLAZGO (contraste) | La tarjeta de categoría **sin imagen** ("Salidas de Baño": colección vacía y sin imagen subida) muestra texto blanco sobre un degradado que va de casi blanco a gris: **legible pero de contraste bajo** (estimación por el degradado de `section-categories__scrim`: ≈ 2,9:1 en el título y ≈ 3,6:1 en la descripción, por debajo de AA). Con imagen (Oasis, Aurora, Espuma) el texto es blanco sobre foto oscurecida. Solo afecta al estado "sin imagen". | Captura visual de la Home de la Dev Store (tarjeta 4) y CSS `assets/section-categories.css` (`.section-categories__scrim`, `.section-categories__card-title`) | Se resuelve al subir la imagen de la categoría (A4, `content/media/03F-media-owner-runbook.md`). Opción de theme si se quisiera una tarjeta sin imagen accesible: un fondo de respaldo más oscuro; **no se cambió** en 03G (el estado desaparece con la imagen y evitaría un RC1.9 sin necesidad funcional). Decisión para 03H. |
| F-01 | FALSO POSITIVO resuelto | Una primera pasada marcó el h1 del hero de la Home como oculto a ≤ 768 px. Era un artefacto: la animación `section-hero-fade-in-up` no había terminado en la pestaña oculta. Re-medido con espera larga: opacidad 1 en los 8 anchos (h1 343×378 a 390 px). | Repetición solo de la Home con espera de 3,5 s | Ninguna |

## 4. Cómo repetirlo

El barrido es un script de página (no se guarda en el repo por depender de una sesión de vista previa con la contraseña de la tienda). Para repetirlo: abrir una pestaña de la Dev Store con la sesión de vista previa del theme, correr el mismo procedimiento (§ 1) y comparar contra esta tabla. Con la ventana visible conviene añadir: capturas por ancho, LCP/CLS reales y el checkout a 390 px.
