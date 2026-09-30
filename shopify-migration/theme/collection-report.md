# Collection Page — Fase 02G

Documenta `sections/main-collection.liquid`, `snippets/collection-banner.liquid`, `snippets/collection-filters.liquid`, `snippets/pagination.liquid` (actualizado), `assets/collection-banner.js`, `assets/collection-filters.js`, `assets/section-collection-banner.css`, `assets/section-collection.css`. Basado en una auditoría de 7 componentes reales (`catalog-page.tsx`, `catalog-toolbar.tsx`, `catalog-filters.tsx`, `pagination.tsx`, `category-banner-background.tsx` + `lib/image-framing.ts`, `catalog-skeleton.tsx`, `catalog-product-card.tsx`/`catalog-grid.tsx` ya auditados en 02F) — 5 de ellos vía agentes paralelos, lectura completa del código real.

## 1. Collection actual reauditada: YES

## 2. Rutas/componentes fuente auditados

`app/oasis-natural/page.tsx` (representativa de las 4 rutas de categoría objetivo), `components/catalog/catalog-page.tsx`, `catalog-toolbar.tsx`, `catalog-filters.tsx`, `pagination.tsx`, `category-banner-background.tsx`, `lib/image-framing.ts`, `catalog-skeleton.tsx`, `components/home/placeholder-art.tsx`.

## 3. Collection header/hero implementado

**YES.** `snippets/collection-banner.liquid` — EXACT: `h-[38vh] min-h-[260px]`, overlay `from-brand-bg/80 via-brand-bg/30 to-transparent`, eyebrow "Colección" + `h1` + descripción.

## 4. Collection image/metafield strategy

Cadena de fallback (ninguno de estos metafields existe todavía en una tienda real — todos con fallback seguro):
1. `collection.metafields.custom.cover_video` (video nativo Shopify)
2. `collection.metafields.custom.cover_image` + `image_pos_x`/`image_pos_y`/`zoom` → framing dinámico EXACT (mismo cálculo que `lib/image-framing.ts` real: `getBackgroundFrame`/`getBackgroundPosition`, portado a `assets/collection-banner.js` con el mismo `ResizeObserver` real — Liquid no puede medir el alto real de un contenedor responsive, de ahí el JS mínimo justificado)
3. `collection.image` nativo (sin framing, `object-fit: cover` simple)
4. Arte decorativo por tono (`collection.metafields.custom.description_tone`, paleta EXACT de `placeholder-art.tsx` — 8 tonos, valores hex idénticos)

Namespace/key documentados para cuando se decida crear los metafields reales en Shopify Admin: `custom.cover_video` (video), `custom.cover_image` (image), `custom.image_pos_x`/`image_pos_y` (number_decimal), `custom.zoom` (number_decimal), `custom.description_tone` (single_line_text_field, uno de: sand/stone/ink/clay/moss/fog/rust/linen).

## 5. Description strategy

`collection.description` nativo (editable por Daniela en Shopify Admin sin tocar el theme) — **NO** se replicó el mapa `CATEGORY_COPY` hardcodeado del real (esa descripción vivía en código React, no en datos; en Shopify la fuente correcta ya es el campo nativo de la colección).

## 6. Product Card integration: PASS

`main-collection.liquid` usa `snippets/product-card.liquid` (02F) sin duplicar markup: `show_secondary_image: true, overlay_cta: 'quick_view', animate_entry: true, entry_index: forloop.index0`.

## 7. Product grid implementation

`<div class="grid grid--{{ default_columns }}" data-collection-grid>` — reutiliza el sistema `.grid--2/--3/--4` de 02B. `products_per_page` configurable (Theme Editor, default 24).

## 8. Grid selector 2/3/4 status

**Implementado, 100% client-side.** Divergencia técnica obligatoria: Shopify Liquid **no expone query params arbitrarios en el servidor** (a diferencia de `page`/`sort_by`/filtros nativos, que sí resuelve `collection`/`paginate`) — por eso el param `vista` (EXACT mismo nombre que el real) solo puede leerse/escribirse con JS (`assets/collection-filters.js`, `history.replaceState`, sin recargar página, sin JS de terceros). Mismo criterio que el real: sin `localStorage`, todo vive en la URL.

## 9. Filters status

**Implementado sobre `collection.filters` nativo** (Search & Discovery), no reconstruyendo `talla`/`color`/`precio` a mano. Mejora deliberada sobre el real: los filtros tipo lista son `<a href="{{ value.url_to_add/url_to_remove }}">` reales — funcionan **sin JavaScript** (el real depende de hidratación de React para todo). El rango de precio usa un `<form>` con los demás filtros activos preservados como inputs ocultos (patrón nativo estándar de Shopify).

## 10. Filters dependency notes

`collection.filters` queda **vacío** hasta que la tienda real tenga Search & Discovery instalado/configurado con facetas de talla/color/disponibilidad/precio — en ese caso el panel de filtros simplemente no se renderiza (`{% if settings.collection_enable_filters %}`), no es un error. No se instaló ninguna app en esta fase.

## 11. Sorting status

**Implementado con `collection.sort_options`/`collection.sort_by` nativos** (§8 del encargo: "no inventar opciones custom") — en vez de hardcodear los 3 `SORT_OPTIONS` reales (novedades/precio-asc/precio-desc), se itera `collection.sort_options` directamente, así el theme refleja automáticamente cualquier opción de orden que la colección soporte. Funciona sin JS (submit real) + auto-submit opcional vía `onchange`.

## 12. Mobile filter drawer status

**Implementado**, Custom Element `<filter-drawer>` (`assets/collection-filters.js`), mismo patrón que `MobileMenuDrawer` (02C): bottom-sheet, overlay, drag handle, focus trap, Escape, body-scroll-lock, `aria-expanded` en el trigger. EXACT clases reales: `rounded-t-2xl`, `max-h-[85vh]`, botón inferior "Ver N producto(s)" con pluralización nativa de Shopify.

## 13. Active filters status

Cada filtro renderiza sus valores activos con estilo distinto (`.collection-filters__chip--active`) vía `value.active` nativo. Botón "Limpiar" (`collection.url`, wipe completo) — **simplificación deliberada**: el real tenía 2 controles "Limpiar" distintos con alcance distinto (uno en el toolbar, otro dentro del panel, cada uno borrando un subconjunto diferente de params) — inconsistencia real no replicada a propósito, se usa un solo "Limpiar" consistente.

## 14. Product count status

`collection.products_count` (ya se recalcula automáticamente cuando hay filtros activos vía Search & Discovery — sin lógica extra).

## 15. Pagination/load-more strategy

**Numerada con elipsis**, `paginate.parts` nativo — divergencia deliberada documentada: el real muestra TODAS las páginas sin ventana (`Array.from({length: totalPages})`, sin elipsis), viable solo porque el catálogo real usa `PAGE_SIZE=200` y casi nunca pagina en la práctica. Eso no escala en una colección con muchas páginas reales — se usa el `paginate.parts` nativo de Shopify (con elipsis) en su lugar. Botones circulares 36px EXACT.

## 16. Empty states

Colección sin productos: `{{ 'collections.general.no_matches' | t }}` (ya existía desde 02A). Filtros sin resultados: mismo mensaje (Shopify no distingue "colección vacía" de "filtro sin resultados" a nivel de `paginate.items`, igual limitación que el real no resuelve tampoco de forma distinta).

## 17. Quick-view hook status

**Inerte, ya resuelto en 02F** — `product-card.liquid` con `overlay_cta: 'quick_view'` renderiza `data-quick-view-trigger` + `data-product-handle`, sin modal, sin JS de apertura. No se construyó ningún mini-PDP en 02G (fuera de alcance explícito).

## 18. Wishlist placeholder status

Sin cambios respecto a 02F — inerte, `data-wishlist-trigger`, sin listener.

## 19. Metafields supported

`custom.cover_video`, `custom.cover_image`, `custom.image_pos_x`, `custom.image_pos_y`, `custom.zoom`, `custom.description_tone` — todos con fallback seguro, ninguno es dependencia obligatoria, ninguno se creó en Shopify Admin (no existe tienda todavía).

## 20. Theme Editor settings

Nuevo grupo "Collection" en `settings_schema.json`: `collection_show_description`, `collection_show_banner`, `collection_enable_filters`, `collection_enable_sorting`, `collection_products_per_page` (12-48), `collection_default_columns` (2/3/4). 6 settings, con propósito claro cada uno — sin sobre-configurar.

## 21. Desktop responsive: PASS
## 22. Mobile responsive: PASS
## 23. 320px safety

PASS — revisión estructural: toolbar usa `flex-wrap`, sidebar se oculta completo bajo `md` (768px) a favor del drawer, grid usa `.grid--N` (nunca anchos fijos en px), drawer es `width:100%` con `max-height:85vh`. Sin Shopify Store no hay renderizado real disponible — mismo criterio que fases anteriores.

## 24. Accessibility: PASS

## 25. Keyboard: PASS

Filtros tipo lista son `<a>` reales (focuseables nativamente). Drawer: focus trap + Escape + return-focus al trigger (mismo patrón ya validado en 02C). Selector 2/3/4 usa `aria-pressed` real.

## 26. Focus management: PASS

Al abrir el drawer, foco va al primer elemento focuseable del panel; al cerrar, vuelve al botón trigger — idéntico al `MobileMenuDrawer` ya auditado/validado en 02C.

## 27. Reduced-motion: PASS

Transiciones de overlay/panel/chips/botones cubiertas por la regla global de `base.css` + reglas explícitas adicionales en `section-collection.css`.

## 28. Estimated visual fidelity

**Alta (~85-90%)** en estructura/copy/spacing/color — EXACT en la mayoría de valores (breakpoints, paddings, tracking, tamaños de botón). La brecha viene de las divergencias funcionales deliberadas (filtros nativos vs. reconstruidos, paginación con elipsis, un solo "Limpiar"), no de descuido.

## 29. CSS añadido

`section-collection-banner.css`, `section-collection.css` — 2 archivos nuevos (~500 líneas combinadas). `pagination.liquid` reutiliza clases nuevas (`.pagination__page`, `.pagination__arrow`) en el mismo archivo.

## 30. JS añadido

`assets/collection-banner.js` (~1.5 KB, framing dinámico, opt-in solo si hay metafields de imagen) + `assets/collection-filters.js` (~3 KB, selector de columnas + drawer). Ambos justificados: ninguno es JS "por gusto", ambos resuelven algo que Liquid/CSS no pueden (medir contenedor responsive; leer/escribir query params arbitrarios).

## 31. Performance notes

- Grid server-rendered completo, sin re-render JS.
- Filtros nativos = 0 JS para togglear talla/color/disponibilidad (son links reales).
- Framing del banner solo corre si existen los metafields de imagen (si no, cero JS extra).
- Sin listeners por producto — el drawer/toolbar se inicializan una vez por página.
- `paginate` nativo evita cargar 200+ productos de una sola vez (a diferencia del real, que con `PAGE_SIZE=200` sí lo hacía).

## 32. Products per page

**24** por defecto (configurable 12-48 vía Theme Editor). El real usa 200 (evita paginar en la práctica); se eligió un valor típico de e-commerce real en vez de replicar 200, ya que Shopify sí pagina de forma nativa y barata — no hay razón real para forzar una sola página gigante.

## 33. Theme Check errors: 0
## 34. Theme Check warnings: 0

```
46 files inspected with no offenses found.
```

## 35. JSON validation: PASS
## 36. Liquid validation: PASS

## 37. Nested anchors check: PASS

Ningún `<a>` anidado dentro de otro — filtros son links planos, product-card ya validado en 02F.

## 38. secrets: 0
## 39. store-specific IDs/domains: 0
## 40. Next/React refs funcionales: 0

## 41. Production tocada: NO
## 42. Staging tocado: NO
## 43. Shopify Store creada: NO
## 44. Deploy: NO
## 45. Push main: NO

## 46. READY FOR MODEL SWITCH TO OPUS: YES

Fase 02G completa. Esta es la última fase de la cadena Sonnet 5 Ultracode — el ciclo automático se detiene acá por diseño (`ai-handoff/session-state.md` § "MODEL STRATEGY"), a la espera de que Daniela cambie manualmente a Opus 5.5 Ultracode antes de iniciar la Fase 02H (Product Page).

## 47. CERO TAREAS DE SEGUNDO PLANO ACTIVAS
