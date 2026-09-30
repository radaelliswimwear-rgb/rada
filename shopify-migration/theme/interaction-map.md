# Mapa de interacciones no triviales (Fase 02, sección 16)

Las ~7 interacciones identificadas en la auditoría de viabilidad previa (Fase 01 general) se **re-verificaron contra el código actual real** en esta fase, no se asumieron. Las 8 existen y están confirmadas; se agrega su clasificación de dificultad, dependencias, accesibilidad y notas mobile.

---

## 1. Magnifier/zoom de imagen en galería de producto

**Current implementation** (`components/product/gallery.tsx`): zoom de escritorio calculado con `onMouseMove` (posición % del cursor vía `getBoundingClientRect`), una capa absoluta separada muestra la misma imagen como CSS `background-image` con `backgroundSize: 220%` / `backgroundPosition` dinámico — visible solo en hover y solo en `lg:` (desktop). Se desactiva explícitamente si `window.matchMedia('(pointer: coarse)')` (touch). Todas las fotos se montan de entrada (position absolute, toggle de `opacity`) para cambio instantáneo entre miniaturas. En mobile: swipe horizontal nativo (`onTouchStart`/`onTouchEnd`, umbral de 40px), con guard para que un swipe no dispare también el lightbox.

**Shopify approach**: sección/snippet con la misma técnica CSS (`background-position`/`background-size` en hover) — 100% portable a vanilla JS, sin necesitar Liquid especial más allá de renderizar las imágenes.

**Vanilla JS / Web Component**: Vanilla JS puro (event listeners de mouse/touch), ideal como Web Component (`<product-gallery>`) siguiendo el patrón de temas Shopify modernos (Dawn usa este patrón).

**Dependencia requerida**: Ninguna.

**Accesibilidad**: contenedor `role="button"` + `tabIndex=0` + `aria-label` + `onKeyDown` (Enter/Espacio abre el lightbox) — replicar tal cual.

**Mobile**: swipe nativo sin lupa (comportamiento correcto a preservar, no agregar zoom táctil aquí — el zoom táctil vive en el lightbox).

**Dificultad**: **MEDIUM**

---

## 2. Lightbox de producto con pinch-zoom

**Current implementation** (`components/product-detail/product-lightbox.tsx`): overlay `fixed inset-0`, `role="dialog" aria-modal`. Zoom vía rueda del mouse, botones +/-, teclas +/-/=, clic (toggle 1x↔2.5x), y **pinch-to-zoom táctil real** (distancia euclidiana entre 2 touches, clamp `MIN_SCALE=1`/`MAX_SCALE=4`). Pan (arrastre) cuando `scale>1` con mouse o un dedo, con umbral de 6px para distinguir clic de arrastre. Transform vía CSS `translate() scale()`. Calcula el tamaño real "contain" de cada foto con `ResizeObserver` (mismo criterio matemático que `lib/image-framing.ts`) para que el zoom solo responda sobre la prenda, no sobre las franjas vacías. Navegación por teclado (flechas, Escape).

**Shopify approach**: es la interacción más compleja del sitio. No hay equivalente nativo en Shopify ni en apps de terceros que replique EXACTAMENTE este comportamiento (pinch + pan + zoom por rueda/teclado combinados) — se reconstruye a medida.

**Vanilla JS / Web Component**: Web Component dedicado (`<product-lightbox>`), lógica 100% portable (Touch/Mouse events nativos del DOM, sin librería de gestos).

**Dependencia requerida**: Ninguna (confirmado: la implementación actual ya es 100% vanilla, sin librería de gestos externa).

**Accesibilidad**: `role="dialog" aria-modal="true"`, todos los controles con `aria-label`, teclado completo (Escape/flechas/+/-), bloqueo de `document.body.style.overflow` mientras está abierto — replicar exacto.

**Mobile**: pinch-to-zoom con 2 dedos + pan con 1 dedo cuando `scale>1` + `touch-none` para evitar scroll nativo mientras se interactúa.

**Dificultad**: **HARD** — la interacción más difícil de las 8.

---

## 3. Crop/zoom personalizado de imágenes de categoría

**Current implementation** (`lib/image-framing.ts`): funciones puras que calculan `background-size`/`background-position` en % a partir de la relación de aspecto real de la imagen, la relación de aspecto del marco, y un factor de zoom guardado. Deliberadamente NO usa `object-fit`+`transform:scale` (bug real de navegador confirmado con prueba aislada: el recorte ocurre antes del transform). **Importante**: en el storefront público esto es puramente **visualización estática** del encuadre ya guardado por la admin — la interacción real de editar (arrastrar + zoom + nudge de 8px por teclado) vive del lado ADMIN (`components/admin/category-image-framer.tsx`), no en la tienda pública.

**Shopify approach**: el VALOR guardado (posX/posY/zoom) se traduce a metafields de Collection (`custom.image_pos_x`, `custom.image_pos_y`, `custom.image_zoom`) y el snippet de la colección aplica el mismo cálculo CSS. El editor de arrastre en sí (herramienta de admin) es fuera de alcance del theme — Shopify no tiene un widget nativo de recorte con zoom; si se quiere conservar esa UX de edición, requeriría una Theme App Extension o edición manual de los 3 valores desde el Theme Editor (menos cómodo que arrastrar, pero funcional).

**Vanilla JS / Web Component**: Solo CSS + una función JS pura para el cálculo (portable 1:1, es TypeScript sin dependencias).

**Dependencia requerida**: Ninguna.

**Accesibilidad**: `role="img"` + `aria-label={category.imageAlt}` en el div con `background-image` (compensa no ser un `<img>` real) — replicar.

**Mobile**: el encuadre guardado se ve igual en cualquier tamaño (porcentajes) — sin gesto táctil adicional en el storefront.

**Dificultad**: **EASY** (la lógica en sí es simple; lo que sube el esfuerzo es decidir cómo reemplazar el editor visual admin, fuera del theme en sí).

---

## 4. Carrusel tipo "peek" con scroll nativo (home)

**Current implementation** (`components/home/sunset-carousel.tsx`): scroll horizontal **nativo** del navegador (`overflow-x-auto` + `scroll-snap-x mandatory` + `scroll-smooth`), sin librería de carrusel. Tarjetas anchas a propósito (`w-[85%]` mobile → `lg:w-[42%]`) para que se vea el "peek" del siguiente producto. Scrollbar oculta vía CSS. Flechas prev/next llaman `scrollBy()`, se muestran/ocultan dinámicamente según `scrollLeft`/`scrollWidth`.

**Shopify approach**: técnica 100% portable — es CSS `scroll-snap` + JS mínimo para las flechas, ningún patrón específico de React.

**Vanilla JS / Web Component**: Vanilla JS trivial (listener de `scroll`/`resize`), ideal como snippet reutilizable de theme.

**Dependencia requerida**: Ninguna.

**Accesibilidad**: flechas con `aria-label`, se renderizan solo cuando hay contenido real que desplazar. **Gap real detectado**: sin manejo explícito de foco/teclado sobre el track en sí — mismo nivel a replicar (no mejorar de más ni empeorar).

**Mobile**: swipe 100% táctil nativo, sin JS custom de gestos (a diferencia de la galería de producto).

**Dificultad**: **EASY**

---

## 5. Animaciones framer-motion (reflow de grilla + "pop" de wishlist)

**Current implementation**: confirmado, `framer-motion` **es una dependencia de producción real** (`package.json`, `^12.42.2`), usada en 4 archivos: `catalog-grid.tsx` (`motion.div layout` + `AnimatePresence mode="popLayout"` para reflow animado al filtrar), `catalog-product-card.tsx` (fade+slide-up con stagger al entrar en viewport), `wishlist-heart-button.tsx` (`whileTap` + spring `stiffness:400 damping:15` al cambiar de estado guardado/no-guardado).

**Shopify approach**: ninguna de estas 2 animaciones es imprescindible para la función del sitio — son pulido visual. Se pueden reconstruir con CSS transitions/animations (`@starting-style`, `transition: transform/opacity`) sin ninguna librería, aunque el reflow de grilla tipo "layout animation" (FLIP) es más laborioso en vanilla JS que con framer-motion.

**Vanilla JS / Web Component**: Factible sin dependencia (técnica FLIP manual para el reflow; CSS `@keyframes` + clase toggle para el "pop" del corazón), pero es el trabajo de reconstrucción más alto de las 8 por la técnica FLIP.

**Dependencia requerida**: Ninguna estrictamente necesaria — se recomienda **no** llevar framer-motion (ni ninguna librería de animación) al theme Shopify, dado el criterio explícito de esta fase de "mínimas dependencias externas".

**Accesibilidad**: `aria-label` dinámico + `aria-pressed` en el corazón — replicar. **Gap real detectado**: no se usa `useReducedMotion` de framer-motion en estos 2 componentes específicos (sí existe `motion-reduce:` Tailwind en otro componente, `category-card.tsx`, pero no aquí) — al reconstruir en Shopify, conviene cerrar este gap con `prefers-reduced-motion` en CSS, no solo igualar el comportamiento actual.

**Mobile**: sin comportamiento específico adicional más allá de lo ya descrito.

**Dificultad**: **HARD**

---

## 6. Hero dual: video en loop o fondo pastel de fallback

**Current implementation** (`components/home/hero.tsx`, server component): si `Settings.heroVideoUrl` existe, `<video autoPlay loop muted playsInline>` a pantalla completa con `object-cover`, `poster`, relación de aspecto **responsive explícita** (`aspect-[4/5]` mobile → `lg:min-h-[90vh]` desktop) para que un video horizontal no se recorte mal en mobile, más degradado oscuro para legibilidad del texto. Sin video: fondo de manchas pastel animadas (CSS) + patrón de marca. Todo el copy es editable desde `/admin/configuracion`.

**Shopify approach**: mapea limpio a una **section** de Online Store 2.0 con settings de tipo `video`/`image_picker` + campos de texto — es exactamente el patrón que Shopify espera (ver `theme-editor-plan.md`, "HOME HERO → section editable").

**Vanilla JS / Web Component**: Ninguno necesario — HTML `<video>` nativo + CSS.

**Dependencia requerida**: Ninguna (además de `lib/cloudinary/video-url.ts` del lado servidor, que no aplica al theme si las imágenes/video se sirven desde Shopify Files/CDN).

**Accesibilidad**: `<video aria-hidden="true">` (decorativo, mensaje real en el texto superpuesto) — **gap real detectado**: sin controles de pausa expuestos al usuario (autoplay muted loop sin pausa manual) — puede valer la pena agregar un botón de pausa en Shopify si se quiere mejorar accesibilidad respecto al sitio actual (serían una mejora, no una regresión).

**Mobile**: aspect-ratio cambia por breakpoint específicamente para videos horizontales — replicar.

**Dificultad**: **MEDIUM**

---

## 7. Barra de progreso de envío gratis en el carrito

**Current implementation** (`components/cart-drawer/cart-drawer.tsx`, `FreeShippingProgress` interno): lee el umbral real vía Server Action (mismo umbral que usa el checkout, nunca un número hardcodeado aparte), calcula `progress = min(100, subtotal/threshold*100)`. Barra = 2 divs anidados, `width: ${progress}%` inline + `transition-all duration-500` — CSS puro, sin JS de animación.

**Shopify approach**: trivial de reconstruir — el "umbral" pasa a ser un theme setting (`settings_schema.json`, ver `theme-editor-plan.md`), el cálculo es JS simple sobre el subtotal del carrito (disponible nativamente en el objeto `cart` de Shopify).

**Vanilla JS / Web Component**: JS mínimo (aritmética) + CSS transition.

**Dependencia requerida**: Ninguna.

**Accesibilidad**: **gap real detectado** — no tiene `role="progressbar"` ni `aria-valuenow/min/max` hoy (es un div decorativo, el estado real se comunica solo por el texto adyacente). Oportunidad de mejora al reconstruir, sin ser una regresión si se replica tal cual.

**Mobile**: sin comportamiento específico adicional.

**Dificultad**: **EASY**

---

## 8. Autocompletado de búsqueda en el navbar

**Current implementation** (`components/layout/navbar/search.tsx`): botón que expande un input (CSS transition de `width`/`opacity`) dentro de un `<Form action="/buscar">` que sigue funcionando como búsqueda tradicional de página completa. Debounce manual (`setTimeout` 250ms) dispara una Server Action (`searchSuggestions`, consulta real a Postgres) desde 2+ caracteres, renderiza hasta N resultados (imagen + nombre + precio) en un listbox absolute. Cierre con `setTimeout` de 150ms en `onBlur` para permitir que el clic en una sugerencia registre antes de que desaparezca la lista.

**Shopify approach**: Shopify tiene **Predictive Search** nativo (Search & Discovery, API `/search/suggest.json`) que cubre exactamente este caso de uso sin backend custom — es la opción recomendada (ver `storefront-blueprint.md` sección Collection Blueprint / Search & Discovery). El patrón visual (debounce, listbox, imagen+nombre+precio) es 100% reconstruible sobre esa API nativa.

**Vanilla JS / Web Component**: Vanilla JS (fetch a Predictive Search API + debounce) — no requiere backend propio como hoy (Server Action + Prisma).

**Dependencia requerida**: Ninguna (usar Predictive Search nativo elimina la necesidad de infraestructura propia de búsqueda).

**Accesibilidad**: `role="combobox"` + `aria-expanded`/`aria-controls`, listbox con `role="listbox"` + `aria-label`, opciones `role="option"`. **Gap real detectado**: `aria-selected` queda fijo en `"false"` (nunca se actualiza dinámicamente) y no hay manejo de flechas arriba/abajo para navegar el combobox por teclado, solo mouse/tap — oportunidad real de mejora al reconstruir en Shopify, no solo paridad.

**Mobile**: el autocomplete de escritorio está oculto en mobile (`hidden lg:block`); en mobile la búsqueda es un formulario simple sin autocompletado dentro del menú — decisión de UX ya tomada que se puede preservar o mejorar (Predictive Search funciona igual de bien en mobile si se decide agregarlo ahí también).

**Dificultad**: **MEDIUM**

---

## Resumen de dificultad

| # | Interacción | Dificultad | Dependencia hoy | Dependencia propuesta |
|---|---|---|---|---|
| 1 | Magnifier galería | MEDIUM | Ninguna | Ninguna |
| 2 | Lightbox pinch-zoom | **HARD** | Ninguna | Ninguna |
| 3 | Crop/zoom categoría | EASY | Ninguna | Ninguna |
| 4 | Carrusel peek | EASY | Ninguna | Ninguna |
| 5 | Framer-motion (grid+wishlist) | **HARD** | framer-motion | Ninguna (CSS/FLIP manual) |
| 6 | Hero dual video | MEDIUM | Ninguna | Ninguna |
| 7 | Barra envío gratis | EASY | Ninguna | Ninguna |
| 8 | Autocompletado búsqueda | MEDIUM | Ninguna (Server Action propia) | Ninguna (Predictive Search nativo) |

**Conclusión clave**: de las 8 interacciones, **ninguna depende hoy de una librería de UI de terceros** salvo framer-motion (#5) — coherente con la preferencia de "mínimas dependencias externas" de esta fase: el theme Shopify puede reconstruir las 8 en vanilla JS/Web Components sin ninguna dependencia npm nueva. Las 2 más costosas de reconstruir (#2 lightbox, #5 animaciones) no son, sin embargo, las más complejas técnicamente por depender de terceros, sino por la cantidad de estado/matemática manual que manejan.
