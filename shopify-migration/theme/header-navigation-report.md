# Header & Navigation — Fase 02C

Documenta `shopify-migration/theme-src/sections/header.liquid`, `announcement-bar.liquid`, `assets/section-header.css`, `assets/header.js`. Basado en reauditoría directa de `components/layout/navbar/index.tsx` y `components/layout/navbar/mobile-menu.tsx` (no solo del blueprint de la Fase 02).

## Estructura actual real

- **Header**: `sticky top-0 z-50`, `h-24` (96px), `max-w-7xl`, `backdrop-blur-md`. Cambia de `bg-white/70` (transparente) a `bg-white/90` + borde + sombra cuando `scrollY > 8` (listener de scroll real, `passive: true`).
- **Logo**: `h-20 w-56` (80×224px), `next/image fill priority`, `object-contain`.
- **Nav desktop**: oculto bajo `lg` (1024px), lista centrada, `gap-5 lg:gap-7`. **Sin dropdown/submenú — el menú real es plano** (Inicio + categorías activas, un solo nivel).
- **Acciones derecha**: buscador expandible (`hidden lg:block`), selector de moneda (`hidden xl:block`), redes sociales (`hidden xl:flex`), favoritos (`hidden lg:flex`, con badge de cantidad), cuenta (`hidden lg:flex`, sin badge), admin (condicional, `hidden lg:flex`), **carrito SIEMPRE visible** (sin `hidden`, con badge).
- **Mobile**: hamburguesa (`lg:hidden`) a la izquierda + carrito visible a la derecha (mismo botón que desktop). Drawer desde la **izquierda** (Headless UI Dialog), overlay `bg-black/40`, panel `max-w-xs` blanco, 300ms entrada / 200ms salida. Dentro: logo + cerrar, buscador propio (form a `/buscar`), lista de links, fila inferior de 3 botones (Cuenta/Favoritos/Carrito).
- **Announcement bar**: `components/layout/discount-announcement-bar.tsx` — **no es texto libre**, es el % de descuento sitewide calculado (`Settings.discountPercent`), se apaga solo en 0%, sin link, sin color configurable, siempre `bg-brand-crimson` (negro) + texto blanco centrado.

## Divergencias documentadas (código real prioritario sobre el blueprint)

1. **Announcement bar generalizada**: se construyó como sección editable (texto/link/colores/alineación) porque Shopify no tiene un "% de descuento activo" que leer igual que `Settings.discountPercent`. Para replicar el efecto real exacto, Daniela escribe manualmente el texto del descuento vigente. Documentado en el propio `announcement-bar.liquid`.
2. **Carrito visible en mobile dentro del header** (no solo en el drawer) — detalle real fácil de pasar por alto, confirmado leyendo el código (el botón de carrito no tiene clase `hidden`), replicado exacto en `header.liquid`.
3. **Sin dropdown real hoy** — se construyó la CAPACIDAD (Shopify `linklist` soporta 1 nivel de hijos) pero no se activa a menos que Daniela agregue sub-links en Shopify Navigation. No es sobre-construcción: es la forma nativa en que Shopify modela menús, dejarla sin soportar habría sido más trabajo (habría que bloquearla explícitamente).
4. **Cuenta usa `routes.account_url` nativo** en vez de replicar la lógica condicional real (`isAuthenticated ? "/cuenta" : "/cuenta/iniciar-sesion"`) — Shopify ya resuelve ese condicional solo, sin necesidad de lógica propia ni de decidir OTP-vs-clásico en esta fase.

## Taxonomía de navegación (sección 1 del encargo)

**No hardcodeada.** `section.settings.main_menu` (linklist `main-menu` por default) — cuando exista una tienda Shopify real, Daniela debe configurar ese menú en **Shopify Admin → Navigation** con únicamente:

- Oasis Natural → `/collections/oasis-natural`
- Aurora Viva → `/collections/aurora-viva`
- Espuma de Ola → `/collections/espuma-de-ola`
- Salidas de Baño → `/collections/salidas-de-bano`

**Sin** Accesorios/Hombre/Mujer/Niños/Calzado (confirmado con 0 productos reales, Fase 01E). Esto es una **dependencia futura real** — el theme no puede configurar Shopify Navigation por sí mismo (no existe tienda todavía), solo queda listo para recibir cualquier menú que se le asigne.

## Desktop behavior

Ver tabla de la sección "Estructura actual real" arriba — replicado 1:1: mismos breakpoints (lg=1024px), mismas alturas/anchos EXACT, mismo umbral de sticky (8px), mismas reglas de qué se oculta en mobile.

## Mobile behavior

Drawer desde la izquierda, overlay + focus trap básico + Escape + scroll lock + click-outside (vía overlay) — implementados en `assets/header.js` (`MobileMenuDrawer`, Custom Element extendiendo `RadaelliElement` de `theme.js`). Submenús (si existen) se manejan con un patrón "accordion + botón volver", nunca navegación anidada infinita.

## Settings (Theme Editor)

| Setting | Grupo | Qué controla |
|---|---|---|
| `logo` | Brand (ya existía) | Imagen del logo |
| `logo_width` | Header (nuevo) | Ancho del logo en desktop, default 224px (EXACT) |
| `enable_sticky_header` | Header (ya existía) | Activa/desactiva `position: sticky` |
| `show_wishlist_icon` | Header (nuevo) | Muestra/oculta el ícono de favoritos (header + drawer) |
| `show_account_icon` | Header (nuevo) | Muestra/oculta el ícono de cuenta (header + drawer) |
| `main_menu` | Header (sección, ya existía) | Linklist de Shopify Navigation |
| Texto/link/colores/alineación | Sección "Announcement bar" (nueva) | Activar/desactivar = agregar o quitar la sección del header group (patrón nativo Online Store 2.0), sin un checkbox redundante |

**Limpieza de settings redundantes**: se eliminaron `show_announcement_bar` y `announcement_text` del `settings_schema.json` global (grupo Header/Promotions) porque quedaron reemplazados por los settings propios de la nueva sección `announcement-bar.liquid` — evita dos fuentes de verdad para lo mismo.

## Accessibility

| Requisito | Estado |
|---|---|
| Keyboard navigation | PASS — todos los triggers son `<button>`/`<a>` reales, tab order natural |
| Focus-visible | PASS — hereda el anillo global de `base.css` |
| Escape cierra drawer/dropdown/búsqueda | PASS — implementado en `header.js` para los 3 |
| Focus return al trigger al cerrar | PASS — drawer y dropdown devuelven foco al botón que los abrió |
| `aria-expanded`/`aria-controls`/`aria-haspopup` | PASS — en mobile trigger, dropdown trigger, search trigger, submenu triggers |
| Focus trap en el drawer | PASS (básico) — Tab/Shift+Tab quedan dentro del panel mientras está abierto |
| Body scroll lock | PASS — clase `.has-mobile-menu-open` en `<body>` mientras el drawer está abierto |
| Tap targets ≥44px en mobile | PASS — `.tap-target` (definida en Fase 02B) aplicada a todos los triggers de ícono |
| `reduced-motion` | PASS — todas las transiciones (drawer, dropdown, búsqueda, sticky) son CSS `transition`, cubiertas por la regla global de `base.css` |
| Contraste | PASS — usa los colores ya validados en `theme/global-styles-report.md` § 15 (texto/fondo seguros); el announcement bar por default es negro/blanco (17.9:1) |

## JS añadido

`assets/header.js` (~7.3 KB, sin minificar) — 4 responsabilidades: sticky (scroll listener), search trigger (expandir/colapsar), dropdown desktop (accesibilidad), drawer mobile (Custom Element `mobile-menu-drawer`). **Cero autocomplete, cero AJAX cart** — ambos explícitamente fuera de alcance (02J/02I).

## CSS añadido

`assets/section-header.css` (~10.6 KB, sin minificar) + `announcement-bar.liquid` (~2.5 KB, incluye su propio schema).

## 320px safety (revisión estructural, sin Shopify Store)

- Header: hamburguesa + logo + carrito caben en una fila a 320px (logo limitado a `height: 5rem` con `width: auto`, nunca fuerza overflow; iconos son `tap-target` de 44px fijo).
- Announcement bar: texto centrado, `font-size` cae a `--font-size-caption` (12px) bajo 640px, con `padding-inline` del gutter mobile — evita overflow con textos cortos/medianos; textos muy largos pueden partir en 2 líneas (comportamiento esperado de un `<span>`/`<a>` en bloque, no truncado agresivamente).
- Drawer mobile: `max-width: 20rem` (320px) — a viewport de exactamente 320px el panel ocupa el 100% (`width: 100%` con el max-width como techo), sin overflow horizontal.

## Future dependencies (para fases posteriores, no bloquean 02D)

- **02J (Search)**: reemplazar el `<form>` simple por Predictive Search real, sin tocar el trigger/expand ya construido acá.
- **02I (Cart)**: interceptar clicks en `[data-cart-drawer-trigger]` con `preventDefault()` + abrir un drawer, en vez de navegar a `routes.cart_url` — el link real sigue funcionando como fallback hasta entonces.
- **Decisión de wishlist** (`storefront-blueprint.md` § 10): una vez elegida la arquitectura, agregar el listener a `[data-wishlist-trigger]` (hoy inerte a propósito).
- **Configuración manual en Shopify Navigation** (cuando exista tienda): cargar el menú de las 4 colecciones oficiales, ver sección "Taxonomía" arriba.
