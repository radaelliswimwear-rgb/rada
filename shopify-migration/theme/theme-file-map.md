# Mapa de archivos del theme Shopify propuesto (Fase 02, sección 4)

Propuesta de arquitectura de archivos Online Store 2.0, derivada 1:1 del inventario real de páginas/componentes de `storefront-blueprint.md`. **Nada de esto existe todavía** — es solo el plano. Ningún archivo Liquid se crea en esta fase.

```
theme/
├── layout/
│   └── theme.liquid
├── templates/
│   ├── index.json
│   ├── product.json
│   ├── collection.json
│   ├── cart.json
│   ├── search.json
│   ├── page.json
│   ├── page.envios.json
│   ├── blog.json
│   ├── article.json
│   ├── 404.json
│   └── customers/
│       ├── login.json
│       ├── register.json
│       ├── account.json
│       ├── order.json
│       ├── addresses.json
│       └── reset_password.json
├── sections/
├── snippets/
├── assets/
├── config/
│   ├── settings_schema.json
│   └── settings_data.json
└── locales/
    └── es.default.json
```

## templates/

| Template | Purpose | Current source | Shopify role | Dependencies | Custom JS | Editable en Theme Editor |
|---|---|---|---|---|---|---|
| `index.json` | Home | `app/page.tsx` | JSON template, secciones apilables | header-group, footer-group | Sí (carrusel, hero) | Sí — 100% |
| `product.json` | PDP | `app/producto/[slug]/page.tsx` | JSON template | main-product, product-recommendations | Sí (galería/lightbox/variantes) | Parcial (contenido sí, estructura de bloques limitada) |
| `collection.json` | Colección | `app/oasis-natural/page.tsx` (x9, mismo patrón) | JSON template | main-collection-banner, main-collection-product-grid | Sí (filtros, columnas) | Sí |
| `cart.json` | — | No existe página propia hoy (drawer global) | Se crea igual por estándar Shopify (fallback si JS falla / SEO) aunque la UX principal siga siendo el drawer | main-cart-items | Mínimo | Sí |
| `search.json` | Búsqueda | `app/buscar/page.tsx` | JSON template | main-search | Sí (predictive search) | Sí |
| `page.json` | Páginas de contenido | `app/devoluciones`, `/garantia`, `/terminos`, `/privacidad`, `/cookies` (5 de las 6, 100% estáticas) | JSON template genérico | main-page | No | Sí (vía editor de Página de Shopify) |
| `page.envios.json` | Página de envíos | `app/envios/page.tsx` | Template ALTERNATIVO porque tiene un dato dinámico (umbral de envío gratis) que las otras 5 no tienen | main-page + snippet de umbral (theme setting, no Prisma) | No | Sí |
| `blog.json` | Listado de blog | `app/blog/page.tsx` | JSON template | main-blog | No | Sí |
| `article.json` | Artículo de blog | `app/blog/[slug]/page.tsx` | JSON template | main-article | No | Sí |
| `404.json` | Error 404 | `app/not-found.tsx` | JSON template | main-404 | No | Sí |
| `customers/login.json` | Login | `app/cuenta/iniciar-sesion` | Shopify Customer Accounts (ver `storefront-blueprint.md` sección 11 — Shopify controla la lógica, el theme solo el envoltorio visual si se usa Classic Customer Accounts) | — | No | Limitado — depende de qué versión de Customer Accounts se use |
| `customers/register.json` | Registro | `app/cuenta/registro` | Ídem | — | No | Limitado |
| `customers/account.json` | Dashboard cuenta | `app/cuenta/page.tsx` | Ídem | — | No | Limitado |
| `customers/order.json` | Detalle de pedido | `app/cuenta/pedidos` | Ídem | — | No | Limitado |
| `customers/addresses.json` | Direcciones | `app/cuenta/direcciones` | Ídem | — | No | Limitado |
| `customers/reset_password.json` | Reset de contraseña | `app/cuenta/restablecer-contrasena` | Ídem (Shopify usa OTP, no este flujo — ver `storefront-blueprint.md` sección 11) | — | No | Limitado |

**No hay template para `/favoritos`** (wishlist) ni para `/checkout` — Shopify Checkout es nativo (no se rediseña, fuera de alcance) y la wishlist requiere su propia decisión de arquitectura (ver `storefront-blueprint.md` sección 10) antes de poder proponerle un template.

## sections/

| Section | Purpose | Current source | Dependencies | Custom JS | Editable |
|---|---|---|---|---|---|
| `header-group.json` (section group) | Header + announcement bar | `components/layout/navbar/index.tsx`, `discount-announcement-bar.tsx` | snippet icon-*, snippet cart-drawer | Sí (scroll, drawer, búsqueda) | Sí |
| `footer-group.json` (section group) | Footer | `components/layout/footer.tsx` + submenús | — | No | Sí |
| `hero.liquid` | Portada video/pastel | `components/home/hero.tsx`, `hero-background.tsx`, `brand-pattern.tsx` | asset hero.css | No (CSS animation) | Sí — texto, video, CTA |
| `categories-grid.liquid` | "Categorías destacadas" | `components/categories/categories-section.tsx`, `category-card.tsx` | snippet category-card | No | Sí (bloques por colección) |
| `sunset-collection.liquid` | Vidriera editorial + carrusel | `components/home/sunset-collection.tsx`, `sunset-carousel.tsx` | asset carousel.js | Sí (scroll-snap + flechas) | Sí |
| `featured-collection.liquid` | Vidriera de destacados / recomendados | `components/home/featured-products` (vía page.tsx), `recommended-for-you.tsx` | snippet product-card | No | Sí (fuente: colección o tag) |
| `promo-banner.liquid` | Banner de descuento sitewide | `components/home/promo-banner.tsx` | — | No | Sí |
| `newsletter.liquid` | Captura de newsletter | `components/home/newsletter` (vía page.tsx) | Shopify Customer/Klaviyo form | No | Sí |
| `main-collection-banner.liquid` | Banner de colección (imagen/video) | `components/catalog/category-banner-background.tsx` | asset image-framing.js | No (CSS) | Sí (imagen/video, vía metafield de Collection) |
| `main-collection-product-grid.liquid` | Toolbar + filtros + grilla + paginación | `components/catalog/catalog-page.tsx`, `catalog-toolbar.tsx`, `catalog-filters.tsx`, `catalog-grid.tsx`, `pagination.tsx` | Shopify Search & Discovery (filtros nativos) | Sí (columnas, filtro mobile) | Sí |
| `main-product.liquid` | Bloque principal de PDP | `components/product-detail/product-detail.tsx`, `product-meta.tsx`, `product-variant-picker.tsx` | snippets gallery/lightbox/price/size-selector | Sí | Sí (bloques: descripción, guía tallas, etc.) |
| `product-recommendations.liquid` | Relacionados + vistos recientemente | `components/product-detail` related, `catalog/recently-viewed.tsx` | Shopify Product Recommendations API | Parcial (recently-viewed es localStorage) | Sí |
| `main-search.liquid` | Resultados de búsqueda | `app/buscar/page.tsx` | snippet product-card | No | Sí |
| `main-page.liquid` | Contenido de página estática | `app/envios`, `/devoluciones`, etc. | — | No (salvo `page.envios` con setting de umbral) | Sí — vía editor de Página |
| `main-blog.liquid` | Listado de blog | `app/blog/page.tsx` | snippet blog-card | No | Sí |
| `main-article.liquid` | Artículo | `app/blog/[slug]/page.tsx` | snippet json-ld-article | No | Sí |
| `main-404.liquid` | 404 | `app/not-found.tsx` | — | No | Sí |
| `main-cart-items.liquid` | Página de carrito (fallback) | N/A (no existe hoy) | — | Mínimo | Sí |

## snippets/

| Snippet | Purpose | Current source | Custom JS |
|---|---|---|---|
| `product-card.liquid` | Tarjeta de producto (catálogo + home) | `catalog-product-card.tsx`, `home/product-card.tsx` | Sí (hover swap imagen, favoritos) |
| `category-card.liquid` | Tarjeta de colección | `categories/category-card.tsx` | No |
| `price.liquid` | Precio con descuento | `currency/money.tsx`, `discounted-money.tsx` | No |
| `product-gallery.liquid` | Galería + magnifier | `components/product/gallery.tsx` | Sí |
| `product-lightbox.liquid` | Lightbox pinch-zoom | `components/product-detail/product-lightbox.tsx` | Sí |
| `size-selector.liquid` | Selector de talla | `components/product-detail/product-variant-picker.tsx` | Sí |
| `free-shipping-bar.liquid` | Progreso de envío gratis | `cart-drawer.tsx` (`FreeShippingProgress`) | Sí |
| `cart-drawer.liquid` | Drawer de carrito global | `components/cart-drawer/cart-drawer.tsx` | Sí |
| `quick-view-modal.liquid` | Vista rápida | `components/catalog/quick-view-modal.tsx` | Sí |
| `size-guide-modal.liquid` | Guía de tallas | `components/product-detail/size-guide-modal.tsx` | Sí (modal) |
| `back-in-stock-form.liquid` | "Avísame cuando vuelva" | `components/product-detail/back-in-stock-button.tsx` | Sí (requiere Flow/app, ver `storefront-blueprint.md`) |
| `breadcrumbs.liquid` | Miga de pan | Patrón repetido manual en varias páginas | No |
| `json-ld-product.liquid` | Product + Offer schema.org | `lib/seo/product-json-ld.ts` | No |
| `json-ld-breadcrumb.liquid` | BreadcrumbList schema.org | `lib/seo/product-json-ld.ts` | No |
| `json-ld-organization.liquid` | Organization + WebSite (sitewide, en theme.liquid) | `app/layout.tsx` líneas 66-85 | No |
| `icon-whatsapp.liquid`, `icon-*.liquid` | Iconografía | `components/icons/*`, Heroicons usados | No |
| `wishlist-heart-button.liquid` | Corazón de favoritos | `components/wishlist/wishlist-heart-button.tsx` | Sí (depende de la arquitectura elegida, sección 10) |

## assets/

| Asset | Purpose | Current source | Notes |
|---|---|---|---|
| `theme.css` | Estilos base + tokens | `app/globals.css` (`@theme` block) | Ver `design-tokens.md` — traducir custom properties |
| `product-gallery.js` | Magnifier + swipe | `components/product/gallery.tsx` | Vanilla JS, ver `interaction-map.md` #1 |
| `product-lightbox.js` | Pinch-zoom/pan | `components/product-detail/product-lightbox.tsx` | Vanilla JS, ver `interaction-map.md` #2 |
| `cart-drawer.js` | Drawer + AJAX cart | `components/cart-drawer/cart-store.tsx` | Reemplaza Server Actions por Shopify Cart AJAX API |
| `predictive-search.js` | Autocompletado | `components/layout/navbar/search.tsx` | Migra a Shopify Predictive Search API, ver `interaction-map.md` #8 |
| `image-framing.js` | Crop/zoom de categoría | `lib/image-framing.ts` | Port directo, funciones puras sin dependencias |
| `carousel.js` | Carrusel peek | `components/home/sunset-carousel.tsx` | Vanilla JS, ver `interaction-map.md` #4 |
| `animations.css` | Reflow grilla + pop wishlist | framer-motion (`catalog-grid.tsx`, `wishlist-heart-button.tsx`) | CSS/FLIP manual, ver `interaction-map.md` #5 |

## config/

| Archivo | Purpose |
|---|---|
| `settings_schema.json` | Ver `theme-editor-plan.md` sección "Theme config schema" para el diseño conceptual completo |
| `settings_data.json` | Valores actuales de esos settings (paleta de `design-tokens.md`, textos del hero, umbral de envío gratis, etc.) |

## locales/

| Archivo | Purpose |
|---|---|
| `es.default.json` | Único idioma real del sitio hoy (100% español) — sin necesidad de `en.json` salvo que se decida internacionalizar a futuro |
