# Product Card — Fase 02F

Documenta `shopify-migration/theme-src/snippets/product-card.liquid` (definitivo, reemplaza `product-card-placeholder.liquid`, eliminado), `assets/product-card-entry.js` y el refactor de `assets/component-card.css`.

## Reauditoría — 2 componentes reales distintos (no 1)

El comentario original de `product-card-placeholder.liquid` (02A) apuntaba a "CatalogProductCard" como el componente definitivo. La reauditoría de esta fase confirmó que **existen 2 tarjetas de producto reales, visualmente distintas, en 2 contextos distintos**:

| | `components/catalog/catalog-product-card.tsx` | `components/home/product-card.tsx` |
|---|---|---|
| Usado por | `CatalogGrid` (catálogo/colección real) | Los 3 carruseles de Home (ya auditados en 02E) |
| Imagen | **Hover-swap** de 2 imágenes (`product.images[0]` → `product.images[1]`, ambas con zoom) | 1 sola imagen con zoom (sin swap) |
| Overlay hover | Botón "Vista rápida" (abre un modal `QuickViewModal`) | Pill de texto "Ver producto" |
| Favoritos | Corazón arriba-derecha, `framer-motion` pop (stiffness 400/damping 15), toggle sólido/outline | `WishlistHeartButton` (sibling, confirmado en 02E, sin detallar posición) |
| Animación de entrada | Sí — `whileInView` (fade + `translateY(16px)→0`), `duration: 0.4s`, delay = `min(index,8)*0.05s`, `viewport: {once:true, margin:"-40px"}` | No |
| Sombra | `shadow-sm` → `group-hover:shadow-lg` | Ninguna |
| Click target | **Solo la imagen** es `<Link>` (`absolute inset-0` dentro del contenedor de aspect-ratio) — título y precio están en un `<div>` aparte, sin envolver en link | Igual: solo la imagen navega |
| Badge | Categoría, arriba-izquierda, siempre visible | Igual |

Ambos comparten: `aspect-[3/4]`, `rounded-xl`, `DiscountedMoney` para el precio, título `<h3>` sin link.

**Conclusión de diseño**: un solo snippet parametrizado (`product-card.liquid`), no dos snippets separados — exactamente lo que pedía el encargo (`show_secondary_image`, `overlay_cta`, `animate_entry`, etc.).

## Snippet API

Ver el comentario completo en `product-card.liquid`. Resumen:

| Parámetro | Qué controla | Default |
|---|---|---|
| `product` | Producto real (requerido) | — |
| `context` | Informativo (`data-context` en el DOM) | `'collection'` |
| `show_secondary_image` | Hover-swap si existe `product.images[1]` | `true` |
| `show_badges` | Sale (ya en `price.liquid`) + Agotado | `true` |
| `show_wishlist_placeholder` | Corazón inerte | `true` |
| `overlay_cta` | `'quick_view'` \| `'view_product'` \| vacío | `'quick_view'` |
| `animate_entry` | Fade+translateY escalonado al entrar en viewport | `false` |
| `entry_index` | Índice para el delay escalonado | `0` |
| `image_ratio` | Sufijo de clase `media--*` | `'portrait'` (3:4) |
| `sizes` | Override de `sizes` de imagen | catálogo por defecto |
| `lazy_load` | `false` para cards críticas sobre el fold | `true` |
| `category_label` | Texto del badge de categoría | vacío |

## Placeholder reemplazado

**Eliminado.** `product-card-placeholder.liquid` (02A/02E) ya no tiene ningún uso — las 5 ubicaciones que lo llamaban fueron migradas a `product-card.liquid`:
- `snippets/product-carousel.liquid` (usado por las 3 vidrieras de Home) → `show_secondary_image: false, overlay_cta: 'view_product'` (EXACT estilo Home)
- `sections/main-collection.liquid` → `show_secondary_image: true, overlay_cta: 'quick_view', animate_entry: true` (EXACT estilo catálogo)
- `sections/main-search.liquid` → igual que colección, sin `animate_entry` (el real de búsqueda no fue auditado por separado; se usa el mismo criterio que catálogo por ser la vista de resultados más cercana)

## Primary image strategy

`image_url`/`srcset` responsive nativo (mismo patrón que `snippets/image.liquid`), `width`/`height` reales para evitar CLS, `loading` lazy por defecto (parámetro `lazy_load: false` disponible para cards sobre el fold). Sin Cloudinary.

## Secondary image / hover status

Implementado **solo si el producto tiene una segunda imagen real** (`product.images[1] != blank`) — nunca se infiere ni se duplica la primera. `show_secondary_image: false` (usado en Home) omite el segundo `<img>` por completo, sin costo de red.

## Card link semantics

**EXACT**: solo la imagen es un `<a href="{{ product.url }}">`. Título y precio son texto plano fuera del link (así es el componente real — no se inventó una mejora de accesibilidad "todo el card es clickeable" que no existe hoy). Favoritos/vista rápida son `<button>` hermanos del link, nunca anidados dentro — 0 nested anchors, verificado con Theme Check.

## Title/color/meta behavior

Título: `product.title` real. **Color NO se muestra como texto en el card** — confirmado en la reauditoría: el componente real solo usa `product.color` para analytics (tracking), nunca lo renderiza visualmente. No se inventó un campo de color en el card.

## Regular price behavior

Reutiliza `snippets/price.liquid` sin cambios (ya era EXACT a `DiscountedMoney` desde 02A).

## Compare-at/sale behavior

Igual — `price.liquid` ya maneja `compare_at_price > price` con el badge `-X%`.

## Sold-out behavior

**Divergencia deliberada, documentada**: el componente real auditado **no tiene** un badge de "Agotado" (ni una vista de baja/opacidad para productos sin stock). Se agregó de todas formas (`product.available == false` → badge "Agotado", arriba-derecha) porque: (1) el propio encargo lo pide explícitamente como badge "justificado" (§7), y (2) Shopify expone `product.available` de forma nativa — omitirlo dejaría vender/mostrar como disponible un producto sin stock real. No es una regla comercial inventada (fecha, "nuevo", etc.), es una corrección funcional sobre datos reales de inventario.

## Badge rules

Sale (existente) + Agotado (nuevo, ver arriba) + Categoría (`category_label`, mismo criterio que 02E: `product.type` como aproximación de `product.category` real). **NO** se construyó badge "Nuevo/destacado" — no existe ninguna fuente real (flag de fecha o `featured`) que lo justifique en el componente auditado.

## Wishlist placeholder status

Botón real, `data-wishlist-trigger`, `data-product-id`, sin `disabled` (misma convención que el header, Fase 02C — un botón `disabled` no es focuseable ni anunciado por lectores de pantalla). Sin listener, sin localStorage, sin metafields, sin app — inerte a propósito, arquitectura de wishlist sigue sin decidir.

## Motion / reduced-motion

Zoom de imagen (500-700ms), hover-swap de opacidad, overlay CTA, animación de entrada — todo CSS `transition`, cubierto por `prefers-reduced-motion` (base.css global + reglas explícitas adicionales en `component-card.css` para las transiciones nuevas). La animación de entrada además usa JS (`product-card-entry.js`) que comprueba `matchMedia('(prefers-reduced-motion: reduce)')` y muestra las tarjetas sin animar si está activo.

## Home integration: PASS

Las 3 vidrieras de carrusel (`featured-collection-editorial`, `featured-products`, `recommended-products`) migradas a `product-card.liquid` con los parámetros EXACT del estilo Home (sin hover-swap, sin animación de entrada, overlay "Ver producto"). **Sin cambios de diseño** respecto a 02E — mismo resultado visual, verificado por inspección de las clases generadas.

## Reusable for 02G: YES

El snippet ya soporta `animate_entry`/`entry_index` (para el grid de colección con stagger), `show_secondary_image`/`overlay_cta` (para el estilo catálogo completo), `image_ratio` (por si 02G necesita otra proporción) y `sizes` — 02G puede usarlo sin cambios estructurales, solo ajustando parámetros por sección.

## Desktop responsive: PASS
## Mobile responsive: PASS
## 320px safety

PASS — el card no tiene anchos fijos (usa el `grid`/`carousel__item` del contenedor padre), overlay/badges usan `padding`/`gap` con tokens, texto de precio/título hace wrap natural sin overflow.

## Accessibility: PASS
## Keyboard: PASS

Link de imagen real y focuseable; botones de favoritos/vista rápida son `<button>` reales con texto accesible (`visually-hidden` o texto visible), nunca solo íconos sin nombre. `focus-within` revela el overlay igual que `hover` (mejora deliberada, ver 02E) — un usuario de teclado que tabula hasta el botón de vista rápida SÍ ve el overlay antes de activar el botón.

## Contrast: PASS

Badges/botones sobre imagen usan fondo blanco/90% opaco + texto oscuro (mismo patrón ya validado en `global-styles-report.md`).

## JS nuevo

`assets/product-card-entry.js` (~1 KB sin minificar) — única lógica nueva, opt-in (`animate_entry`), justificada explícitamente (CSS no puede detectar "entró al viewport"). Cero JS para hover-swap/badges/overlay (100% CSS).

## CSS impact

Refactor de `assets/component-card.css`: se eliminó el bloque provisional `.product-card-placeholder*` (02E, ~55 líneas) y se agregó el sistema definitivo `.product-card*` (~180 líneas) — hover-swap, overlay de 2 variantes, badges, wishlist, animación de entrada. `.card`/`.price`/`.badge` (foundation genérica de 02B) no se tocaron.

## Performance notes

- 0 JS por card en el caso común (`animate_entry: false`, que es lo que usa Home) — el Custom Element del carrusel y el observer de entrada se registran UNA vez por página, no por card.
- `loading="lazy"` por defecto; `sizes` real coincide con el ancho renderizado real de cada contexto (carrusel vs. grid).
- Sin listeners individuales por card (el wishlist/quick-view son botones inertes sin listener todavía).
- Segunda imagen: 0 bytes de red si `show_secondary_image: false` o el producto no tiene 2ª imagen (el `<img>` ni se emite).

## Theme Check errors: 0
## Theme Check warnings: 0

```
44 files inspected with no offenses found.
```

## JSON validation: PASS
## Liquid validation: PASS

## Nested anchors check: PASS

Solo 1 `<a>` por card (la imagen). Verificado por inspección directa del snippet y por Theme Check (sin errores de `LiquidHTMLSyntaxError`/estructura inválida).

## secrets: 0
## store-specific IDs/domains: 0
## Next/React refs funcionales: 0

## Production tocada: NO
## Staging tocado: NO
## Shopify Store creada: NO
## Deploy: NO
## Push main: NO

## READY FOR PHASE 02G — COLLECTION

**YES**, condicionado al handoff vía `ai-handoff` y la regla "una fase a la vez".

## CERO TAREAS DE SEGUNDO PLANO ACTIVAS
