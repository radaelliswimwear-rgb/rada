# Plan del editor de Shopify (Fase 02, secciones 5, 20 y 21)

Objetivo explícito de esta fase: que el futuro theme sea administrable por Daniela desde el Theme Editor de Shopify, con la mínima dependencia futura de desarrollo para cambios normales de contenido — igual que hoy ya puede editar textos del Hero, banners e imágenes de categoría desde `/admin/configuracion` y `/admin/categorias` sin tocar código.

## 1. Qué se convierte en qué (sección 5)

| Elemento actual | Fuente real | → Shopify | Justificación |
|---|---|---|---|
| Hero (video/texto/CTA) | `components/home/hero.tsx`, editable hoy desde `/admin/configuracion` (`Settings.heroVideoUrl`, `heroHeadline`, etc.) | **Section editable** (`hero.liquid`) con settings de video/imagen/texto | Ya es 100% editable hoy — el theme debe preservar ese nivel de control, no perderlo |
| Categorías destacadas (home) | `components/categories/categories-section.tsx` | **Section con blocks** (1 block = 1 colección destacada) | Daniela debe poder reordenar/agregar/quitar categorías destacadas sin código |
| Vidriera editorial ("La belleza de sentirte tú") | `components/home/sunset-collection.tsx` | **Section reutilizable** (texto + fuente de colección configurable) | Patrón repetible para futuras campañas editoriales |
| Banner de descuento sitewide | `components/home/promo-banner.tsx` | **Section** con setting de texto/CTA | El % en sí ya vive en `Settings.discountPercent` — en Shopify sería un Automatic Discount, el banner solo muestra el texto |
| Beneficios de producto (si se agregan a futuro) | No existe hoy explícitamente en el PDP | **Blocks** dentro de `main-product.liquid` | Ejemplo del propio encargo — patrón a futuro, no una migración de algo existente |
| Guía de tallas | `Settings.sizeGuideImageUrl` (imagen única para toda la tienda, editable en `/admin/configuracion`) | **Metaobject** "Size Guide" (imagen + texto) referenciado desde el producto o global | Hoy es una sola imagen sitewide, no por producto — el metaobject preserva ese modelo simple; migrar a un metaobject por categoría sería una mejora, no obligatoria |
| Descripción/textos legales (envíos, devoluciones, garantía, términos, privacidad, cookies) | 100% hardcodeado en JSX (confirmado, Fase 02) — **hoy NO son editables sin tocar código** | Páginas de Shopify nativas (editor de contenido rico) | Esto es una MEJORA real respecto al sitio actual, no una paridad — hoy Daniela no puede editar estas páginas ella misma |
| Banner/tarjeta de colección (imagen + encuadre con zoom) | `Category.coverImage*`/`bannerImage*` + `posX/posY/zoom`, editable en `/admin/categorias` | **Metafields de Collection** (`custom.cover_image`, `custom.image_pos_x/y/zoom`, `custom.description_tone`) | Preserva el nivel de control actual; el editor de arrastre en sí requiere decisión aparte (ver `theme-file-map.md`) |
| Color de producto | `Product.color` | **Metafield de Product** (`custom.color`), NUNCA Option — ver `data-architecture.md` | Decisión ya justificada en esa sección |
| Umbral de envío gratis | `Settings.freeShippingThreshold` | **Theme setting global** (`settings_schema.json`, grupo CART) | Un solo valor sitewide, igual que hoy |
| Redes sociales / WhatsApp | `lib/social-links.ts`, hardcodeado en código hoy (no editable desde admin) | **Theme settings** (grupo SOCIAL) | Mejora real: hoy cambiar un link social requiere tocar código |
| Tono/descripción corta de categoría | `CATEGORY_COPY` hardcodeado en `catalog-page.tsx` | **Metafield de Collection** | Hoy tampoco es editable sin código — mejora real |

## 2. Qué podrá cambiar Daniela sin Claude (sección 20)

Objetivo explícito del encargo: minimizar dependencia futura de desarrollo para cambios normales.

**Ya puede editar hoy (preservar 1:1)**:
- Banners/video/texto del Hero
- Imágenes y encuadre (posición/zoom) de categorías
- Guía de tallas (imagen única)
- Umbral de envío gratis
- Descuento del sitio/categoría/producto
- Categorías activas/inactivas (qué aparece en nav)
- Blog (crear/editar/publicar posts)
- Productos y su catálogo completo (`/admin/productos`)

**NO puede editar hoy, pero SÍ podrá en Shopify (mejora real, no falsa promesa)**:
- Textos de páginas legales/informativas (hoy hardcodeadas en JSX)
- Mensajes promocionales puntuales (banner, announcement bar) — hoy el announcement bar solo muestra el % de descuento automáticamente, sin texto libre editable
- Links de redes sociales
- Contenido del footer más allá de lo ya dinámico

**Fuera del control del Theme Editor (Shopify lo controla, no el theme)**:
- Checkout (Shopify Checkout nativo)
- Flujo de Customer Accounts (login/registro/reset) más allá de textos/colores básicos — ver `storefront-blueprint.md` sección 11
- Inventario/pedidos (Shopify Admin, no el theme)

## 3. Diseño conceptual de `config/settings_schema.json`

**No implementado en esta fase** — solo la agrupación conceptual, basada en lo que hoy es editable desde `/admin/configuracion` + lo que se identificó como faltante:

- **BRAND**: nombre de tienda, logo, favicon
- **TYPOGRAPHY**: selector de fuente (Poppins u otra si se licencia Mont), pesos por defecto
- **COLORS**: los 17 tokens reales de `design-tokens.md` (renombrando `brand-crimson` a algo correcto)
- **LAYOUT**: max-width de contenedor, radios de borde por defecto
- **HEADER**: mostrar/ocultar announcement bar, comportamiento sticky
- **CART**: umbral de envío gratis, texto del banner de envío gratis
- **PRODUCT**: mostrar/ocultar "vistas en vivo" (`LiveViewers`, hoy real), mostrar/ocultar disponibilidad
- **SOCIAL**: Instagram/Facebook/TikTok/WhatsApp (hoy hardcodeados en `lib/social-links.ts`, se vuelven editables)
- **SEO**: nombre/descripción de sitio para Organization/WebSite JSON-LD (hoy en `lib/seo/site.ts`, hardcodeado)
- **PROMOTIONS**: texto del banner de descuento sitewide (el % en sí lo maneja Shopify Discounts, no un setting del theme)

Ningún valor de este schema se hardcodea en Liquid — todo pasa por `settings_data.json`, cumpliendo la regla de portabilidad (sección 22 del encargo, ver `implementation-roadmap.md`).
