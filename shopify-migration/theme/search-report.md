# Search + Predictive Search — Fase 02J

Modelo: **Opus 5.5** (`claude-opus-5-5`). Inicio 12:42, fin de validación 12:58 (2026-09-28).

## 1. Búsqueda real auditada (lectura directa)

| Archivo | Qué hace hoy |
|---|---|
| `components/layout/navbar/search.tsx` | Buscador del header, **solo desktop** (`hidden lg:block` en `navbar/index.tsx`). Detalle abajo. |
| `lib/catalog/catalog-actions.ts` | Sugerencias: nombre o color, desde 2 caracteres, top **5**. Página: nombre, color, descripción o categoría; ranking por nombre (exacto > empieza > contiene); tope **24**, sin paginación. |
| `app/buscar/page.tsx` | Página de resultados (detalle abajo). |
| `components/catalog/catalog-grid.tsx` | Grilla de 3 columnas con la tarjeta de catálogo y animación de entrada. |
| `components/catalog/search-analytics.tsx` | Evento `search` con `search_term` y `result_count`. |
| `components/layout/navbar/mobile-menu.tsx` | Mobile: form simple dentro del menú, **sin sugerencias**. |
| `app/search/*` | Sobras del template de Vercel Commerce; el sitio usa `/buscar`. No se migran. |

**Header (`search.tsx`):**
- La lupa expande un input a su izquierda (`w-0 → w-56`, `opacity`, 300 ms) y pasa a ser X ("Cerrar buscador").
- **Sugerencias:**
  - desde **2 caracteres**, debounce de **250 ms**, solo productos (foto 32×40, nombre truncado, precio);
  - lista `w-72` debajo del input; se oculta al salir del input (150 ms);
  - no se muestra si no hay resultados.
- **Fallas del real:**
  - `role="combobox"` sin manejo de teclado; `aria-selected` siempre en false;
  - sin cancelación: una respuesta vieja puede pisar una nueva;
  - input sin foco visible (`focus:outline-none`);
  - colapsado sigue enfocable con Tab.

**Página (`app/buscar/page.tsx`):**
- Miga "Inicio / Buscar", eyebrow "Búsqueda", h1 "Resultados para "x"" o "Buscar productos", "N producto(s) encontrado(s)".
- Cajas punteadas "Escribí algo para empezar a buscar." y "No encontramos productos…", con "Explorar colección" → `/#categorias`.
- Solo productos, sin filtros ni orden, `noindex`, **sin campo de búsqueda propio**.

No hay búsquedas recientes, ni resultados de colecciones o páginas, ni estados de carga o error visibles.

## 2. Integración con el header

- **Semántica:** la lupa es un **link a `routes.search_url`** (sin JS lleva a la página). `header.js` le agrega `role="button"`, `aria-expanded`, `aria-controls`, Espacio y la etiqueta "Buscar"/"Cerrar buscador".
- **Expandir:** el input se abre a la izquierda con los 224 px y los 300 ms reales.
- **Cerrar:** X o Escape, y el foco vuelve a la lupa. Clic afuera **no** cierra (igual que el real, que solo oculta las sugerencias).
- **Colapsado:** `visibility: hidden` lo saca del orden de Tab, con un margen de 300 ms mientras dura la animación. En el real queda siempre enfocable.
- **Diferencia medida:** en el real el input empuja la nav dentro de la fila. Acá se **superpone** con fondo, porque empujarla desbordaba el header a 1024 px (medido: `scrollWidth > clientWidth`). Con la superposición: 0 desborde en 1024, 1280 y 1440.
- **Menú mobile** (02C): se sumaron `type=product`, `options[prefix]=last` y nombre accesible. Sin sugerencias, como el real.
- No se tocaron sticky, menú mobile, carrito (02I), cuenta ni favoritos.

## 3. Página de búsqueda (`templates/search.json` → `sections/main-search.liquid`)

- **Server-rendered, sin JS:** usa `search.performed`, `search.terms`, `search.results` y `search.results_count`, con `paginate` y el snippet `pagination` de 02G (URLs nativas que conservan `q` y `type`).
- **Copy EXACT:** miga (snippet `breadcrumbs`), eyebrow, h1, contador con plural, las dos cajas de estado y el CTA a `/#categorias` (sección `featured-categories` de 02E, `id="categorias"`).
- **Productos por página:** 24 (real = 24, pero sin paginar). Shopify pagina en lugar de cortar.
- **Diferencia deliberada:** la página tiene un **campo de búsqueda** (el real no). Sin JS, la lupa lleva acá y hay que poder escribir; también sirve para refinar. Mismo estilo del input del header.
- **Términos escapados:** `t` escapa la variable en h1 y estado; `| escape` en `value` y `data-terms`.
- **SEO:** no se tocó el canonical ni el `<head>`. Shopify bloquea `/search` en su robots.txt por defecto (el real usa `noindex`).
- **Bug de 02H corregido:** la miga de pan tenía sus estilos en `section-product.css`, que solo carga en la ficha, así que en la búsqueda salía sin estilo. Se movieron a `base.css`.

## 4. Tipos de resultado

**Solo productos**, igual que el real:

- Todos los forms mandan `type=product`.
- Si se llega sin ese parámetro, lo que no es producto se omite en la grilla. El contador de Shopify podría incluirlo; queda documentado.
- No se muestran colecciones, páginas ni artículos: no existen en la búsqueda real.

## 5. Tarjeta de producto

Se reusa `snippets/product-card.liquid` **con los mismos parámetros que la colección 02G**:

- `show_secondary_image`, `overlay_cta: 'quick_view'` (inerte), `animate_entry` con índice, `category_label: item.type`, `context: 'search'`.
- Grilla `.grid--3` de 02G: sin markup nuevo.

Observación (no se cambió, afecta también a 02G): el `CatalogGrid` real usa **2 columnas en mobile** (`grid-cols-2`); la grilla del theme (02B) usa 1 columna por debajo de 640 px. Queda como decisión pendiente para toda la grilla de catálogo.

## 6. Predictive Search: **sí se implementa**

El real lo tiene, así que corresponde. Se hace con **Shopify Predictive Search nativo**:

- **Request:** `GET routes.predictive_search_url?q=…&resources[type]=product&resources[limit]=5&resources[options][fields]=title,product_type,tag&section_id=predictive-search`.
- **Respuesta:** el HTML de `sections/predictive-search.liquid` (foto, nombre, precio `money`; "Desde X" si varía). `search.js` mueve los `<li>` a la lista del header.
  - No se arma HTML con el texto de la clienta: `URLSearchParams` codifica el término y Liquid escapa todo.
  - No hay `innerHTML`.
- **Campos:** `title,product_type,tag` equivale a nombre + categoría + color (el color tiene que estar como **tag** en Shopify, ver § 12). No incluye `variants.title`, para que "M" o "L" no ensucien los resultados.
- **Sin** Algolia, apps, Storefront API ni motor propio.

## 7. Consulta, debounce y carreras

| Aspecto | Valor |
|---|---|
| Mínimo | **2 caracteres** tras `trim` (EXACT); menos cancela la request en vuelo y oculta la lista |
| Debounce | **250 ms** (EXACT) |
| Máximo de sugerencias | **5** (setting 1–10; el tope de Shopify es 10) |
| Requests por consulta | 1 (6 teclas = 1 request, medido) |
| Consulta repetida | 0 requests (cache en memoria de 20 consultas) |

- **Cancelación:** `AbortController` corta la request anterior (verificado `net::ERR_ABORTED`).
- **Carreras:** la respuesta más reciente manda; además se descarta cualquier respuesta cuyo término ya no es el actual.
- **Sin polling.**
- **Error** (500 o red): no hay sugerencias, igual que el real (que devuelve `[]`). Enter sigue llevando a la página de resultados. Sin excepciones en consola.

## 8. Teclado (patrón combobox + listbox, APG)

| Tecla | Acción |
|---|---|
| ↓ | Abre la lista y avanza (vuelve al principio al final) |
| ↑ | Retrocede (vuelve al final desde el principio) |
| Enter con opción activa | Navega al producto |
| Enter sin opción activa | Envía el form (página de resultados) |
| Escape (1º) | Cierra la lista; el texto y el foco quedan |
| Escape (2º) | Cierra el buscador y devuelve el foco a la lupa |
| Tab | Normal, sin trampas; salir del input cierra la lista |

- **Foco:** queda siempre en el input; la opción activa va por `aria-activedescendant` + `aria-selected`, con `scrollIntoView` si hace falta.
- **Mouse:** `mousedown` con `preventDefault` en la lista evita que el input pierda el foco antes del clic (el real usaba un timeout de 150 ms).

## 9. Accesibilidad

- **Nombres accesibles:** el input tiene `aria-label` "Buscar" (el real solo placeholder); lupa y X "Buscar"/"Cerrar buscador"; borrar "Borrar búsqueda"; lista "Sugerencias de búsqueda".
- **Combobox:** `role="combobox"` + `aria-autocomplete="list"` + `aria-haspopup="listbox"` + `aria-expanded` + `aria-controls` en el input; opciones con `id` y `aria-selected`; los links internos llevan `tabindex="-1"`.
- **Anuncios:** región `role="status"` con un solo anuncio por respuesta ("5 sugerencias disponibles" / "Sin sugerencias para esta búsqueda"), nunca por tecla ni de "cargando". Visualmente no hay lista vacía (EXACT).
- **Foco visible:** el borde del input pasa de #d4d4d4 a #171717 (el real no tiene). La opción activa, además del fondo #f5f5f5, lleva una marca izquierda de 3 px (el fondo solo no alcanza como indicador).
- **Contraste:** textos #737373 sobre blanco (4.7:1). El ícono de estado #a3a3a3 es decorativo.
- **Botones:** la lupa mide 44 px (el real 40); el botón de envío de la página 36 px, con input de 44 px.
- **Mobile:** input de 16 px en táctiles (evita el zoom de iOS).
- **Movimiento:** con reduced-motion, la regla global de `base.css` anula la transición del input. El JS no anima nada.

## 10. Borrar / cerrar

- **"Borrar búsqueda":** es una mejora (el real no la tiene). Aparece con texto, vacía el input y las sugerencias, y devuelve el foco al input.
- **Cerrar** (X o 2º Escape): no borra el texto (EXACT) y devuelve el foco a la lupa.
- La lista no se cierra mientras se usa con teclado o mouse.

## 11. Responsive (medido en el harness)

| Ancho | Header | Página |
|---|---|---|
| 320–430 | Buscador del header oculto; se usa el menú mobile | 1 columna, gutters de 16 px, h1 en 2 líneas; consulta larga sin espacios sin desborde |
| 640, 768 | Buscador del header oculto | 2 columnas |
| 1024, 1280, 1440 | Input de 224 px sin desborde; lista de 288 px (w-72 real) dentro del viewport, alineada al input | 3 columnas; contenedor de 1280 |

## 12. Performance, settings y dependencias

| Recurso | Sin comprimir | gzip | Se carga |
|---|---|---|---|
| `search.js` | 10.0 KB | 3.4 KB | Global (el buscador está en el header) |
| `section-search.css` | 4.0 KB | 1.3 KB | Solo en el template search |
| Estilos del header/sugerencias | +~4 KB | | En `section-header.css` |

- **Listeners:** delegados en la lista, uno por tipo; ninguno por resultado.
- **Datos predictivos:** solo 5 productos con foto de 96 px, nunca datos completos de producto.
- **Settings (grupo Search):**

  | Setting | Default |
  |---|---|
  | `predictive_search_enabled` | true |
  | `predictive_search_limit` | 5 |
  | `predictive_search_show_price` | true |
  | `search_products_per_page` | 24 |

- **Eventos neutros** (en `document`, sin IDs):

  | Evento | Detalle | Equivalente real |
  |---|---|---|
  | `search:submitted` | `{ query, source: header \| mobile-menu \| page }` | |
  | `search:suggestion-selected` | `{ query, url, position }` | |
  | `search:results` | `{ query, resultCount }` | `search` con `result_count` |
  | `search:no-results` | `{ query, source: page \| predictive }` | |

- **Dependencias para la tienda real:**
  - **Color como tag** en cada producto, para que "buscar por color" funcione (en el real es una columna; en la migración es el metafield `custom.color`, que Predictive Search no indexa).
  - Revisar los campos de búsqueda en **Search & Discovery**.
  - Si se quieren filtros en la búsqueda: hoy no existen en el real, así que no se agregaron.

## 13. Verificación

- **Theme Check:** 0 errores / 0 warnings (54 archivos). `node --check` en los 11 JS: OK. 15 JSON válidos.
- **Escaneo:** secrets, dominios y IDs = 0; Next/React/Prisma/Neon/Wompi/Vercel/Cloudinary = 0; `innerHTML` = 0.

**Harness aislado:**

- **Montaje:**
  - Servidor Node en el scratchpad, solo `127.0.0.1:4175`.
  - Simula `/search/suggest` con `section_id`, `/search` paginada y fichas stub, con un catálogo de 29 productos (como el snapshot real).
  - Latencia por consulta y error 500 inyectables.
  - Sirve los CSS/JS **reales** del theme; el HTML es espejo a mano de los `.liquid`.
- **Aislamiento:**
  - Navegador en modo URL: **ninguna launch config ejecutada**; `launch.json` sin cambios (solo `rada-dev`).
  - Puerto 3000 cerrado todo el tiempo; 0 bases de datos tocadas.
  - Servidor detenido al terminar.

**Resultado: 20/20 PASS**, con teclas y clics reales:

| # | Prueba | Resultado |
|---|---|---|
| 1–2 | Abrir y foco | Input de 224 px, foco, "Cerrar buscador" |
| 3–4 | Escribir y debounce | "bikini" → 1 request |
| 5 | Cancelación | "bi" lento cancelado y solo se muestran resultados de "bik" |
| 6 | Render | 5 opciones, lista de 288 px, anuncio único |
| 7–8 | Flechas | `aria-activedescendant` 1→2→1→5 |
| 9 | Enter | Navega a la sugerencia 5 + evento |
| 10 | Escape | En dos pasos |
| 11 | Borrar | Vacía, foco al input |
| 12 | Cerrar con X | Foco a la lupa y sale del orden de Tab |
| 13 | Sin resultados | Sin lista + anuncio |
| 14 | Error | 500 y red caída → sin lista ni excepciones; Enter sigue funcionando |
| 15 | Carrera | "arena" en vuelo cancelada al bajar a 1 carácter |
| 16 | Mobile 375 | Menú con `type=product`, página sin desborde |
| 17 | Reduced-motion | Regla global activa |
| 18 | Sin JS | La lupa lleva a `/search` y el form de la página busca |
| 19 | Links y paginación | Paginación conserva `q` y `type` |
| 20 | Integridad de la tarjeta | 1 link por tarjeta, sin anidados, alt, precio, favoritos, agotado, animación de entrada |

**Extras verificados:**

- Clic con mouse en una sugerencia: navega y emite el evento.
- Header sin desborde a 1024/1280/1440.
- Barrido de la página en 9 anchos.
- Eventos `submitted` → `results` → `no-results`.
- Cache: 0 requests para una consulta repetida.

**Límites honestos:**

- No se pudo emular `prefers-reduced-motion`: se verificó por inspección de reglas.
- "Sin JS" = página servida sin scripts: el navegador de prueba no apaga JS.
- La red caída se probó haciendo fallar `fetch`.
- Con el panel del navegador oculto, Chrome no avanza las transiciones: las medidas del header a 1280/1440 se tomaron con las transiciones desactivadas en la página de prueba, midiendo el estado final.

## 14. Diferencias y fidelidad

- **Diferencias deliberadas:**
  - Campo de búsqueda en la página.
  - Input superpuesto en vez de empujar la nav.
  - Teclado, cancelación, botón de borrar y foco visible (el real no los tiene).
  - Paginación en vez de corte en 24.
  - Precio nativo de Shopify en vez de la cascada de descuentos del backend.
- **Diferencia de plataforma:** ranking y campos de la búsqueda de Shopify en lugar del `contains` de Postgres.
- **Fidelidad visual estimada:** **~92%**. Header, sugerencias y página conservan medidas y copy EXACT.
