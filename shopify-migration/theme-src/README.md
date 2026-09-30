# Radaelli Swimwear — Shopify theme (Fases 02A–02M: skeleton, estilos, header, footer, home, product card, collection, product page, cart, search, wishlist, customer accounts, release candidate RC1)

## Propósito

Skeleton técnico real y portable del futuro theme Shopify de Radaelli Swimwear — arquitectura de archivos Online Store 2.0 válida, versionable, sin diseño visual definitivo todavía. Construido 100% offline: no depende de ninguna tienda Shopify, no se desplegó, no se instaló en ningún lado.

Deriva directamente del blueprint de la Fase 02 (`shopify-migration/theme/*.md`) — cada decisión de este skeleton tiene su justificación documentada ahí, no se inventó nada nuevo acá.

## Aislamiento del ecommerce actual

Este directorio (`shopify-migration/theme-src/`) es completamente independiente del Next.js/Prisma real que corre en `radaelliswimwear.com`. No comparte `node_modules`, no importa código de `app/`/`components/`/`lib/`, no depende de Tailwind runtime, Prisma, Neon, Vercel, Cloudinary SDK, Wompi ni Resend. Es Liquid + CSS + JS plano, como cualquier theme de Shopify.

## Estructura

```
theme-src/
├── README.md                  este archivo
├── layout/
│   ├── theme.liquid           layout base, portable entre tiendas
│   └── password.liquid        Fase 03B -- layout de la página de contraseña (sin JS del theme)
├── templates/                 11 templates JSON, cada uno apunta a su section principal
│                              (password.json usa "layout": "password" + main-password)
├── sections/
│   ├── header-group.json       announcement-bar + header, en orden
│   ├── footer-group.json
│   ├── announcement-bar.liquid header real (Fase 02C) -- editable, ver header-navigation-report.md
│   ├── header.liquid           header real (Fase 02C) -- desktop+mobile, dropdown, drawer; <shopify-account> (Fase 02L)
│   ├── footer.liquid           footer real (Fase 02D) -- marca/redes, columnas de menú por bloques, contacto, newsletter opcional
│   ├── hero.liquid             Fase 02E -- rama con video / rama fallback (blobs+textura)
│   ├── featured-categories.liquid  Fase 02E -- categorías borde a borde, bloques repetibles
│   ├── featured-collection-editorial.liquid  Fase 02E -- "La belleza de sentirte tú"
│   ├── featured-products.liquid    Fase 02E -- "Productos destacados"
│   ├── recommended-products.liquid Fase 02E -- "Recomendado para vos" (colección estática, ver home-report.md)
│   ├── promo-banner.liquid     Fase 02E -- banner de descuento estático
│   ├── newsletter-home.liquid  Fase 02E -- newsletter real (vive en Home, no en el Footer)
│   ├── cart-drawer.liquid      Fase 02I -- drawer del carrito (se incluye desde layout, id "cart-drawer")
│   ├── predictive-search.liquid Fase 02J -- HTML de sugerencias (solo Section Rendering, no va en templates)
│   ├── main-wishlist.liquid    Fase 02K -- página de favoritos (templates/page.wishlist.json)
│   ├── wishlist-item.liquid    Fase 02K -- ítem de favoritos (Section Rendering en contexto de producto)
│   ├── main-password.liquid    Fase 03B -- página de contraseña: marca, mensaje de Preferencias, form nativo storefront_password
│   └── main-*.liquid           foundation de page/blog/article/404
│       (main-collection = 02G, main-product = 02H, main-cart = 02I, main-search = página de búsqueda 02J)
├── snippets/                  icon, price, image, product-card (definitivo, Fase 02F), breadcrumbs,
│                               pagination (numerada, Fase 02G), css-variables, product-carousel,
│                               brand-pattern, hero-background, collection-banner, collection-filters (Fase 02G),
│                               cart-line-item, cart-summary, cart-free-shipping (Fase 02I, compartidos drawer/página)
├── assets/
│   ├── variables.css           design tokens reales, EXACT vs. PROPOSED, organizados semánticamente (Fase 02B)
│   ├── base.css                reset + typography + layout + links + accesibilidad + motion + global states
│   ├── component-button.css    sistema de botones (primary/secondary/outline/ghost/link)
│   ├── component-form.css      inputs/textarea/select/checkbox/radio/fieldset
│   ├── component-media.css     media (aspect ratios reales) + icon foundation
│   ├── component-card.css      card + price + badge system
│   ├── component-grid.css      grid fluido/fijo + stack/cluster/inline/center
│   ├── component-carousel.css  carrusel de productos compartido (Fase 02E)
│   ├── section-header.css      header/announcement bar/drawer mobile (Fase 02C)
│   ├── section-footer.css      footer real: grid, columnas, disclosure de contacto, newsletter (Fase 02D)
│   ├── section-hero.css        Fase 02E
│   ├── section-categories.css  Fase 02E
│   ├── section-product-showcases.css  Fase 02E -- editorial/destacados/recomendados
│   ├── section-promo.css       Fase 02E
│   ├── section-newsletter-home.css  Fase 02E
│   ├── section-collection-banner.css  Fase 02G
│   ├── section-collection.css  Fase 02G -- toolbar, filtros, drawer, paginación
│   ├── theme.js                patrón base de Custom Element (RadaelliElement)
│   ├── header.js                sticky + search trigger + dropdown + mobile drawer (Fase 02C)
│   ├── product-carousel.js     Fase 02E -- flechas prev/next del carrusel compartido
│   ├── product-card-entry.js   Fase 02F -- animación de entrada opt-in (IntersectionObserver)
│   ├── collection-banner.js    Fase 02G -- framing dinámico del banner (puerto de getBackgroundFrame real)
│   ├── collection-filters.js   Fase 02G -- selector 2/3/4 columnas + drawer de filtros mobile
│   ├── component-cart.css      Fase 02I -- drawer, línea, resumen y página de carrito
│   ├── cart.js                 Fase 02I -- Ajax Cart API + Section Rendering, drawer, página, contador (cart:updated)
│   ├── section-search.css      Fase 02J -- página de búsqueda (solo template search)
│   ├── search.js               Fase 02J -- <predictive-search> (Shopify Predictive Search) + hooks search:*
│   ├── section-wishlist.css    Fase 02K -- página de favoritos (solo page.wishlist)
│   └── wishlist.js             Fase 02K+02L -- favoritos: modo invitada (localStorage) + modo cuenta inerte (contrato connectAccount), corazones, contador, <wishlist-page>
├── config/
│   ├── settings_schema.json   theme_info + 11 grupos: Brand/Typography/Colors/Layout/Header/Cart/Wishlist/Search/Product/Collection/Social
│   └── settings_data.json     valores default, coherentes con settings_schema.json
└── locales/
    ├── es.default.json        idioma principal (100% del sitio actual es español)
    └── en.json                inglés no-default (02M: antes era un segundo *.default.json)
```

## Estado en la Development Store (Fases 03A–03B)

- Theme **Radaelli RC1** (id `189072474431`), **sin publicar**, en `radaelli-swimwear-dev.myshopify.com`. Horizon sigue live.
- El contenido es igual a **RC1.9** (03H): `shopify-migration/dist/radaelli-shopify-theme-rc1.9.zip`, SHA-256 `fa68a9a9e505b5dce9f8e128f28c6541903729b2a13c7bad6488c1070a06533c` (remoto = ZIP, 96/96).
  - Sobre RC1.8 converge la Home y el pie con el sitio actual (7 archivos, ninguno nuevo): CTA del hero y del promo a `#productos` (`templates/index.json`); la vidriera editorial sin insignia de categoría ni "Ver producto" (parámetros `show_category_badge` y `show_view_product` de `snippets/product-carousel.liquid`; los destacados los conservan); botón del newsletter "Quiero enterarme" (ajuste `button_label` de `sections/newsletter-home.liquid`); pie con `brand_name` y `brand_description` del sitio actual y **espacio faltante en el copyright** (`sections/footer.liquid`, `sections/footer-group.json`); desplegable de Contacto con usuario y número derivados de las URLs sociales, sin "Contacto" repetido (`sections/footer.liquid`, `assets/section-footer.css`). Ver `theme/03H-theme-convergence-report.md`.
  - RC1.8 (`e893b386…9e67`, 03G) queda como artefacto histórico de retorno: `dist/radaelli-shopify-theme-rc1.8.zip` y `dist/release-manifest-rc1.8.json`.
  - Sobre RC1.7 corrige un defecto de paridad de la ficha: la miga de pan, el enlace "Volver a…" y el JSON-LD `BreadcrumbList` usan la colección de **categoría** del producto (tipo = título de colección: Oasis Natural, Aurora Viva, Espuma de Ola), como el sitio actual. Antes dependían del orden de `product.collections`, que Shopify no garantiza: 4 fichas de Espuma de Ola mostraban "Destacados". Solo cambia `sections/main-product.liquid`. Ver `theme/03G-launch-rehearsal-report.md`.
  - RC1.7 (`5bea536f…4b0b`, 03F): `noindex` también en `/pages/favoritos` por handle y enlace a `/pages/garantia` en el acordeón de la ficha. Manifiesto: `dist/release-manifest-rc1.7.json`.
  - RC1.5 (`1a506a41…f2e2`) y RC1.6 (`3e3a1283…e694`) quedan reemplazados; sus manifiestos están en `dist/release-manifest-rc1.5.json` y `dist/release-manifest-rc1.6.json`.
  - RC1.4 (`cba89ac9…a9ca`): manifiesto en `dist/release-manifest-rc1.4.json`.
  - RC1.3 (`1aa125bb…22c0`): manifiesto en `dist/release-manifest-rc1.3.json`.
- RC1.1 (`28e0f7a0…`) queda reemplazado; su manifiesto está en `dist/release-manifest-rc1.1.json`.
- Tienda configurada en 03B:
  - español predeterminado del dominio (`/`), inglés en `/en`;
  - COP, mercado Colombia, zona horaria Bogotá, métrico/kg;
  - página `favoritos`;
  - menú principal "Inicio".
- **Favoritos antes de publicar:** el Admin solo deja asignar plantillas del theme **publicado**, así que la página `favoritos` no tiene `page.wishlist` asignada. Mientras tanto el header enlaza `/pages/favoritos?view=wishlist`. Al publicar, asignar la plantilla "wishlist" a la página (Tienda online → Páginas → Favoritos → Plantilla) y el link queda limpio solo.
- **Página de contraseña:** en una Development Store los visitantes ven siempre la de Shopify. La del theme se revisa en el preview (`/password?preview_theme_id=…`) o en el editor.
- Subida (nunca con `--live`, `--publish` ni `--allow-live`):

```
npx @shopify/cli@4.8.2 theme push --theme 189072474431 --store radaelli-swimwear-dev --strict --json --path shopify-migration/theme-src --ignore README.md
```

- Antes de cada push, además de Theme Check:

```
node shopify-migration/scripts/audit-theme-limits.mjs shopify-migration/theme-src
```

  Shopify rechaza del lado del servidor límites que Theme Check no ve, por ejemplo `theme_author` ≤ 25 o `header` ≤ 50. Revisar también que el JSON de `theme push --json` **no** traiga `warning` ni `errors`: el push termina con código 0 aunque se rechacen archivos.
- Reportes: `shopify-migration/theme/03A-development-store-upload-report.md` y `shopify-migration/theme/03B-store-foundation-report.md`.

## Release candidate RC1 (Fase 02M)

- ZIP: `shopify-migration/dist/radaelli-shopify-theme-rc1.zip`, SHA-256 `a5340e0f8d29222b92e4968a4b079d94334d6c0bf383a6c898932d81f1bc09bf`.
- Manifiesto con hash por archivo: `shopify-migration/dist/release-manifest.json`.
- Reporte: `shopify-migration/theme/offline-release-candidate-report.md`.
- Siguiente paso manual: `shopify-migration/theme/pre-development-store-checklist.md`.
- El ZIP **no** se commitea: el worktree es aislado y `shopify-migration/` no está versionado.

### Cómo correr Theme Check

Desde este directorio (`shopify-migration/theme-src`):

```
npx --yes @shopify/cli theme check
```

Objetivo: 0 errores / 0 warnings. En 02M dio 57 archivos 0/0, tanto sobre este directorio como sobre el ZIP extraído.

### Cómo construir el ZIP de forma reproducible

Desde la raíz del worktree:

```
node shopify-migration/scripts/build-theme-rc.mjs --name radaelli-shopify-theme-rc1 --theme-check-source "0/0" --theme-check-zip "0/0"
```

- En la raíz del ZIP entran solo `assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/` y `templates/`, sin carpeta contenedora.
- **Determinista:** fecha fija 1980-01-01, orden alfabético y deflate nivel 9.
  - Mismo contenido → mismo SHA-256 (con la misma versión de Node/zlib).
  - Construye dos veces y aborta si difieren.
- Escribe el ZIP y `release-manifest.json` en `shopify-migration/dist/`.
- **Alternativa:** `shopify theme package` (Shopify CLI). Requiere una tienda autenticada; no se usó en 02M.

### Qué NO va en el ZIP

- Este `README.md` y los reportes de `shopify-migration/theme/*.md`.
- Exports del catálogo, harness/tests y logs.
- `node_modules`, `.git`, scratch y `launch.json`.
- Secretos y el código de la app Next actual.

### Feature flags (Theme Editor)

| Setting | Default | Por qué |
|---|---|---|
| `wishlist_enabled` | ON | Favoritos de invitada: funcionan en cualquier tienda |
| `wishlist_account_sync` | **OFF** | Favoritos de cuenta: requieren la app de Radaelli y los GO/NO-GO de `customer-accounts-report.md` § 20 |
| `free_shipping_rate_confirmed` | **OFF** | 03D: cerrojo único de la promesa de envío gratis (banner, ficha, carrito). Encender solo cuando Shopify tenga la tarifa gratis de Colombia con el mismo umbral |
| `cart_free_shipping_progress` | **OFF** | Barra del carrito; además exige `free_shipping_rate_confirmed` |
| `cart_drawer_enabled` / `predictive_search_enabled` | ON | APIs nativas de Shopify |
| `collection_enable_filters` | ON | Sin Search & Discovery, Shopify ofrece Disponibilidad y Precio; talla y color requieren la app |
| `collection_show_availability_filter` | **OFF** | 03D: con inventario no rastreado todo figura "En existencia" |

### Limitaciones offline

La regresión de 02M renderiza el Liquid real con liquidjs y shims de Shopify, en un harness de scratch que no forma parte del theme. **No reemplaza a Shopify.** Queda para Phase 03:
- la hoja real de `<shopify-account>`;
- Ajax Cart y Section Rendering reales;
- Search & Discovery;
- fuentes de la librería de Shopify;
- metafields y metaobjects;
- checkout y Wompi.

## Dependencias

**Ninguna.** CSS y JS vanilla, sin librerías npm. `assets/theme.js` no importa nada. Decisión explícita (ver `theme/interaction-map.md`): ni siquiera `framer-motion` (usado hoy en el ecommerce real) se lleva al theme.

## Convención: traducciones y escape (Fase 03B)

- En Shopify, `{{ 'clave' | t }}` ya devuelve el texto **HTML-escapado**, salvo en las claves que terminan en `_html`. **No** agregar `| escape` después de `| t`: en `/en` se ve `We&#39;re`.
- Escapar solo el texto que escribe la comerciante (settings, `shop.password_message`).
- Dentro de `<script type="application/json">` el navegador no decodifica entidades. Si un JS muestra esos textos con `textContent`, los decodifica al leerlos, como `cart.js` con `cart-config`.

## Reglas de portabilidad (regla permanente, ver `theme/implementation-roadmap.md` § 22)

- Cero IDs de tienda, dominios, tokens o secretos en cualquier archivo de este directorio.
- Ningún valor de marca (colores, textos) está hardcodeado en Liquid — todo pasa por `settings_data.json`.
- El theme debe poder copiarse a otra máquina, guardarse en Git, empaquetarse como `.zip` e instalarse en cualquier tienda compatible sin modificación.

## Soporte del theme

`config/settings_schema.json` → `theme_info.theme_support_email` = `info@radaelliswimwear.com`. Es la decisión de 03B y reemplazó al placeholder `placeholder@example.com` de 02A.

## Supuestos de versión de Shopify

- **Online Store 2.0** (JSON templates + section groups) — no es un theme "vintage" de `.liquid` templates sueltos.
- Se asume disponibilidad de `font_picker`, `image_picker`, `richtext`, `link_list`, `color`, `range`, `url`, `header` como tipos de setting estándar de `settings_schema.json`.
- **New Customer Accounts** (decisión de Daniela, Fase 02L): ingreso sin contraseña con código por email, páginas de cuenta alojadas por Shopify. El theme **no tiene ni necesita** `templates/customers/*` (deprecados; Shopify redirige las URLs legacy). Ver `theme/customer-accounts-decision.md`.

## Fases 02A–02P

Ver `shopify-migration/theme/implementation-roadmap.md` para la tabla completa (input/output/dependencias/checkpoints de revisión). Resumen de dónde está parado este skeleton:

| Fase | Estado |
|---|---|
| 02A Skeleton | **Completa** |
| 02B Global styles | **Completa** — ver `shopify-migration/theme/global-styles-report.md` |
| 02C Header/navigation | **Completa** — ver `shopify-migration/theme/header-navigation-report.md` |
| 02D Footer | **Completa** — ver `shopify-migration/theme/footer-report.md` |
| 02E Home | **Completa** — ver `shopify-migration/theme/home-report.md` |
| 02F Product Card | **Completa** — ver `shopify-migration/theme/product-card-report.md` |
| 02G Collection | **Completa** — ver `shopify-migration/theme/collection-report.md` |
| 02H Product Page | **Completa** — ver `shopify-migration/theme/product-page-report.md` |
| 02I Cart + Cart Drawer | **Completa** — ver `shopify-migration/theme/cart-report.md` |
| 02J Search + Predictive Search | **Completa** — ver `shopify-migration/theme/search-report.md` |
| 02K Wishlist / Favoritos | **Completa** — ver `shopify-migration/theme/wishlist-report.md` |
| 02L Customer Accounts + favoritos de cuenta | **Completa (arquitectura + preparación offline)** — ver `shopify-migration/theme/customer-accounts-report.md` y `customer-accounts-decision.md`. Sincronización de cuenta **inerte** hasta Development Store + app |
| 02M Offline Release Candidate | **Completa**: RC1 empaquetado y auditado. Ver `shopify-migration/theme/offline-release-candidate-report.md` |
| 03A Development Store + upload | **Completa**: RC1 subido sin publicar (id `189072474431`). Ver `shopify-migration/theme/03A-development-store-upload-report.md` |
| 03B Configuración base + contraseña + cuentas | **Completa**, con 1 bloqueo manual diferido (código de login → GO/NO-GO #1). Ver `shopify-migration/theme/03B-store-foundation-report.md` |

## Qué NO está implementado todavía (explícito, no omitido por descuido)

- De las 8 interacciones no triviales de `theme/interaction-map.md`, **implementadas**: mobile menu drawer y sticky header (02C); carrusel de productos (02E, `product-carousel.js`); animación de entrada de tarjetas (02F, `product-card-entry.js`, opt-in vía `animate_entry`); filtros de colección + drawer mobile + selector 2/3/4 columnas (02G, `collection-filters.js`/`collection-banner.js`). Galería, lightbox y zoom de producto quedaron en 02H; el autocompletado de búsqueda en 02J.
- Favoritos (02K): funcionales **por navegador** (localStorage detrás de un adaptador) en tarjetas, ficha, header (link + contador) y página `page.wishlist` — ver `theme/wishlist-report.md`. Grilla de catálogo corregida a 2 columnas en mobile (`.grid--catalog`, EXACT del real).
- Favoritos de cuenta (02L): el modo cuenta de `wishlist.js` (unión invitada → cuenta, cola persistente, Web Lock, aviso de sesión/tope/vencidos) está **hecho y probado con mocks aislados**, pero **inerte**: se activa solo si `settings.wishlist_account_sync` (apagado por defecto) imprime el bootstrap de `customer.metafields.custom.wishlist` **y** la futura app de Radaelli registra su transporte con `window.Radaelli.wishlist.connectAccount()`. El theme no escribe metafields ni llama a `/apps` — ver `theme/customer-accounts-report.md` § 7–8.
- "Recomendado para vos" (Home): el real personaliza por visitante (localStorage + historial de navegación, sin equivalente en Liquid). La sección Shopify (`recommended-products.liquid`) muestra una colección estática curada por Daniela en su lugar — ver `theme/home-report.md`. La personalización real, si se decide construir, requeriría Storefront API + JS en una fase futura.
- Filtros de colección (02G, corregidos en 03D): usan `collection.filters` nativo.
  - Sin Search & Discovery, Shopify expone Disponibilidad y Precio. Disponibilidad está oculta por ajuste.
  - Talla y color requieren la app.
  - Shopify devuelve el precio del filtro **en centavos**. El theme lo divide por 100 al volver a dibujar los inputs, y el form de orden conserva el rango.
- "Vista rápida" del Product Card (03E):
  - colección y búsqueda usan ahora el overlay "Ver producto" (`overlay_cta: 'view_product'`);
  - el botón "Vista rápida" no tenía modal y era un control inerte en el orden de foco (A11Y-08);
  - el overlay no captura taps (`pointer-events: none`);
  - la opción `quick_view` sigue en el snippet para cuando se construya el modal.
- Customer Accounts / login (02L): **nativos de Shopify**, no se construyen en el theme. Header desktop con el componente oficial `<shopify-account>` (fallback `routes.account_url` sin JS o sin cuentas nuevas); mobile con "Mi cuenta" en el menú. Pedidos, perfil, direcciones y detalle de pedido los resuelve Shopify. "Mis favoritos" dentro de la cuenta = extensión de la app (pendiente de Development Store).
- Locales (corregido en 02M): `es.default.json` es el único default y el inglés quedó como `en.json` (antes eran dos `*.default.json`).
- Carrito (02I): drawer + página `/cart` + AJAX (`/cart/add.js`, `/cart/change.js`, Section Rendering) implementados — ver `theme/cart-report.md`. Fuera de alcance a propósito: checkout/pagos/Wompi, botones de pago acelerado, campo de cupón (vive en el checkout nativo), pago por WhatsApp (solo documentado), reserva de stock (**estar en el carrito no reserva inventario**). La barra de envío gratis existe pero está **apagada por defecto** hasta que Shopify tenga la tarifa gratis configurada con el mismo umbral.
- PDP (02H): galería, visor con zoom/pinch, selector de tallas, guía de tallas (metaobject + respaldo), acordeones y relacionados implementados — ver `theme/product-page-report.md`. Sus 3 CSS + 3 JS (`section-product.css`, `component-product-gallery.css`, `component-variant-picker.css`, `product-form.js`, `product-gallery.js`, `product-lightbox.js`) se cargan solo en el template de producto. Pendientes por dependencia: "Avísame cuando vuelva" (backend de emails) y "Vistos recientemente" (localStorage).
- Búsqueda (02J): página `/search` (solo productos, server-rendered, sin JS) + sugerencias del header con Shopify Predictive Search (2 caracteres, 250 ms, 5 resultados — EXACT del real) — ver `theme/search-report.md`. Para buscar por color, el color tiene que estar como **tag** del producto en Shopify (Predictive Search no indexa el metafield `custom.color`).
- Ningún dato ni producto real de Radaelli está hardcodeado en ningún template/section — todo usa objetos Liquid reales (`product`, `collection`, `page`, `article`, `cart`, `linklists`), listos para poblarse solo cuando exista una tienda real.
