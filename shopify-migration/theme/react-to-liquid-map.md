# Mapa de traducción React → Liquid (Fase 02, sección 15)

Basado en el inventario real de componentes (`components/`) verificado en esta fase. Clasificación de dificultad: **EASY** (CSS/markup directo, sin lógica de estado real) · **MEDIUM** (requiere JS con algo de estado/interacción) · **HARD** (JS con matemática/gestos/estado complejo).

| Componente React actual | Archivo actual | Equivalente Shopify | Liquid/Section/Snippet | JS requerido | Dificultad | Notas |
|---|---|---|---|---|---|---|
| Navbar | `components/layout/navbar/index.tsx` | Header nativo de theme | `sections/header-group.json` | Sí (scroll, drawer) | MEDIUM | Categorías dinámicas → Shopify main-menu nativo |
| DiscountAnnouncementBar | `components/layout/discount-announcement-bar.tsx` | Announcement bar | dentro de `header-group` | No | EASY | Se oculta si descuento=0 — replicar con `{% if %}` |
| MobileMenu | `components/layout/navbar/mobile-menu.tsx` | Drawer de menú mobile | snippet dentro de header | Sí | MEDIUM | Headless UI Dialog → `<dialog>` nativo o Web Component |
| NavSearch (autocomplete) | `components/layout/navbar/search.tsx` | Predictive Search | `assets/predictive-search.js` | Sí | MEDIUM | Migra de Server Action propia a API nativa Shopify — ver `interaction-map.md` #8 |
| Hero | `components/home/hero.tsx` | Section "Hero" | `sections/hero.liquid` | No | MEDIUM | Ver `interaction-map.md` #6 |
| HeroBackground | `components/home/hero-background.tsx` | CSS animation | dentro de `hero.liquid` | No | EASY | 3 `@keyframes` CSS puro, portable directo |
| BrandPattern | `components/home/brand-pattern.tsx` | CSS/SVG decorativo | dentro de `hero.liquid` | No | EASY | — |
| CategoriesSection / CategoryCard | `components/categories/categories-section.tsx`, `category-card.tsx` | Section con blocks | `sections/categories-grid.liquid`, `snippets/category-card.liquid` | No | EASY | Ver `interaction-map.md` #3 para el crop/zoom |
| SunsetCollection / SunsetCarousel | `components/home/sunset-collection.tsx`, `sunset-carousel.tsx` | Section reutilizable | `sections/sunset-collection.liquid` | Sí | EASY | Ver `interaction-map.md` #4 |
| FeaturedProducts / RecommendedForYou | `components/home` (vía page.tsx), `recommended-for-you.tsx` | Section de colección destacada | `sections/featured-collection.liquid` | No (server-side hoy) | MEDIUM | La lógica de exclusión de slugs ya usados (evitar duplicados entre secciones) requiere lógica Liquid equivalente |
| PromoBanner | `components/home/promo-banner.tsx` | Section | `sections/promo-banner.liquid` | No | EASY | — |
| Newsletter | `components/home` (vía page.tsx) | Section + Shopify Customer form o app de email marketing | `sections/newsletter.liquid` | No | EASY | — |
| CatalogPage / CatalogToolbar / CatalogFilters / CatalogGrid | `components/catalog/catalog-page.tsx` + hermanos | Template + section de colección | `templates/collection.json`, `sections/main-collection-product-grid.liquid` | Sí | MEDIUM | Filtros → evaluar Search & Discovery nativo vs. custom, ver `storefront-blueprint.md` sección 8 |
| CategoryBannerBackground | `components/catalog/category-banner-background.tsx` | Section banner de colección | `sections/main-collection-banner.liquid` | No | EASY | Comparte técnica con category-card |
| CatalogProductCard | `components/catalog/catalog-product-card.tsx` | Snippet reutilizable | `snippets/product-card.liquid` | Sí (framer-motion) | HARD | Ver `interaction-map.md` #5 |
| Pagination | `components/catalog/pagination.tsx` | Paginación nativa de Liquid (`paginate`) | dentro de `main-collection-product-grid.liquid` | No | EASY | `PAGE_SIZE=200` hoy hace que casi nunca se use realmente |
| CatalogSkeleton | `components/catalog/catalog-skeleton.tsx` | CSS skeleton | dentro de section, o `loading` nativo de Shopify | No | EASY | — |
| QuickViewModal | `components/catalog/quick-view-modal.tsx` | Modal nativo Web Component | `snippets/quick-view-modal.liquid` | Sí | MEDIUM | — |
| ProductDetail | `components/product-detail/product-detail.tsx` | Section principal de PDP | `sections/main-product.liquid` | No (orquestador) | MEDIUM | — |
| Gallery (PDP) | `components/product/gallery.tsx` | Snippet de galería | `snippets/product-gallery.liquid` | Sí | MEDIUM | Ver `interaction-map.md` #1. **Reutilizado tal cual desde la ruta legacy `/product/[handle]`** — ya es el componente correcto a portar |
| ProductLightbox | `components/product-detail/product-lightbox.tsx` | Snippet de lightbox | `snippets/product-lightbox.liquid` | Sí | HARD | Ver `interaction-map.md` #2 — la interacción más difícil de todas |
| ProductMeta | `components/product-detail/product-meta.tsx` | Bloque de precio/disponibilidad | dentro de `main-product.liquid` | No | EASY | — |
| ProductVariantPicker | `components/product-detail/product-variant-picker.tsx` | Selector de variante | `snippets/size-selector.liquid` | Sí | MEDIUM | Lógica de "talla agotada sigue siendo clicable para Avísame cuando vuelva" — replicar el matiz, no simplificar de más |
| ProductWishlistButton / WishlistHeartButton | `components/product-detail/product-wishlist-button.tsx`, `components/wishlist/wishlist-heart-button.tsx` | Snippet de favoritos | `snippets/wishlist-heart-button.liquid` | Sí | MEDIUM | Depende de la arquitectura de wishlist elegida — ver `storefront-blueprint.md` sección 10 |
| BackInStockButton | `components/product-detail/back-in-stock-button.tsx` | Formulario "Avísame" | `snippets/back-in-stock-form.liquid` | Sí | MEDIUM | Requiere Shopify Flow o app — Shopify no tiene esto nativo |
| SizeGuideModal | `components/product-detail/size-guide-modal.tsx` | Modal desde metaobject | `snippets/size-guide-modal.liquid` | Sí (modal) | EASY | — |
| Accordion (descripción) | `components/ui/accordion.tsx` | `<details>` nativo o Web Component | dentro de `main-product.liquid` | Opcional | EASY | Usa framer-motion hoy para la altura animada — `<details>` nativo lo resuelve sin JS |
| ProductViewAnalytics / ViewTracker / LiveViewers | `components/product-detail/*` | Custom (fuera de alcance de theme puro) | — | Sí | MEDIUM | "Viendo ahora" no tiene equivalente nativo Shopify — requiere backend propio o app; documentar como brecha, no inventar solución acá |
| RecentlyViewed | `components/catalog/recently-viewed.tsx` | Section de recomendaciones | `sections/product-recommendations.liquid` (parcial) | Sí (localStorage) | EASY | Portable 1:1, es localStorage puro |
| CartDrawer / cart-store (useLocalCart) | `components/cart-drawer/cart-drawer.tsx`, `cart-store.tsx` | AJAX Cart Drawer | `snippets/cart-drawer.liquid` + `assets/cart-drawer.js` | Sí | HARD | Migra de Server Actions/Prisma a Shopify Cart AJAX API — cambio de backend, no solo de UI |
| FreeShippingProgress | dentro de `cart-drawer.tsx` | Snippet | `snippets/free-shipping-bar.liquid` | Sí | EASY | Ver `interaction-map.md` #7 |
| WishlistPage / WishlistItemCard | `components/wishlist/wishlist-page.tsx`, `wishlist-item-card.tsx` | Página de favoritos | Depende de arquitectura elegida (localStorage / metafield / app) | Sí | MEDIUM | Ver `storefront-blueprint.md` sección 10 — 3 alternativas comparadas, ninguna elegida todavía |
| AccountShell / AccountNav | `components/account/account-shell.tsx`, `account-nav.tsx` | Layout de Customer Accounts | `templates/customers/*.json` | No | MEDIUM | Shopify controla gran parte de la lógica — ver `storefront-blueprint.md` sección 11 |
| LoginForm / RegisterForm / ForgotPasswordForm / ResetPasswordForm | `components/auth/*` | Shopify Customer Accounts nativo | `templates/customers/login.json` etc. | Mínimo | MEDIUM | Shopify usa login **sin contraseña por OTP** — cambio real de UX, no solo de skin (ver `storefront-blueprint.md` sección 11) |
| DashboardOverview / OrderHistory / AddressesManager / ProfileForm | `components/account/*` | Customer Accounts nativo | `templates/customers/*.json` | No | MEDIUM | — |
| Footer / FooterMenu / FooterSocialLinks / ContactMenu | `components/layout/footer*.tsx`, `contact-menu.tsx` | Footer nativo | `sections/footer-group.json` | Mínimo (menú desplegable) | EASY | — |
| BlogCard | `components/blog/blog-card.tsx` | Snippet de blog | `snippets/blog-card.liquid` | No | EASY | — |
| Money / DiscountedMoney / Price | `components/currency/money.tsx`, `discounted-money.tsx`, `price.tsx` | Filtro Liquid `money` + snippet | `snippets/price.liquid` | No | EASY | Shopify formatea moneda nativamente |
| ConsentBanner / ChangeConsentPreferencesButton | `components/consent/*` | Custom (Shopify Customer Privacy API disponible, ver auditoría previa) | `snippets/consent-banner.liquid` | Sí | MEDIUM | Ya evaluado en la auditoría de viabilidad previa (`docs/shopify/seo-analytics.md`) — Web Pixels API + Customer Privacy API cubren esto de forma nativa |
| JsonLd (genérico) | `lib/seo/json-ld.ts` | Liquid `{% schema %}`-adjacent, se emite como `<script type="application/ld+json">` | `snippets/json-ld-*.liquid` | No | EASY | — |
| Toaster (sonner) | `app/layout.tsx` | Web Component de toast propio o CSS | `snippets/toast.liquid` + JS mínimo | Sí | EASY | — |

## Componentes explícitamente NO migrables (código muerto del template Vercel Commerce)

Confirmado en la investigación de esta fase: **`components/product/gallery.tsx` es la única excepción reutilizable** — es la galería REAL del PDP, no código muerto. El resto de esta familia SÍ es código muerto y no se traduce a nada:

| Componente | Archivo | Por qué no migra |
|---|---|---|
| CartProvider / cart-context | `components/cart/cart-context.tsx` | Plantilla original de Vercel Commerce, envuelve `app/layout.tsx` pero queda inerte — el carrito real es `useLocalCart` |
| ProductDescription, GridTileImage, ProductGridItems, Grid | `components/product/*`, `components/grid/*`, `components/layout/product-grid-items.tsx` | Dependen de `lib/shopify` (GraphQL Storefront API), nunca configurado (`SHOPIFY_STORE_DOMAIN` ausente, confirmado por test) |
| Rutas `/product/[handle]`, `/search`, `/search/[collection]`, `/[page]` | `app/product/[handle]`, `app/search/*`, `app/[page]` | Devuelven `notFound()`/listas vacías siempre — nunca se sirvieron en producción |

**Nota arquitectónica real, no obvia**: estas piezas muertas ya "hablan" el protocolo de Shopify Storefront API (tipos `ShopifyProduct`/`ShopifyCollection`/`ShopifyCart` en `lib/shopify/types.ts`) — si en algún momento se decide una migración headless (Hydrogen) en vez de un theme Liquid, esta capa sería el punto de partida técnico más relevante del repo, no las páginas reales que hoy corren sobre Prisma. Se documenta como dato curioso, no cambia el alcance de esta fase (theme Liquid).
