# Mapa de arquitectura: Custom → Shopify

Parte de la [auditoría de viabilidad de migración a Shopify](../shopify-migration-feasibility-audit.md). Basado en una inspección real del código en `commerce-main/commerce-main` (no en la descripción del encargo) — ver el detalle completo de inventario en el Anexo al final de este documento.

---

## 1. Matriz de mapeo Custom → Shopify

Clasificación: **A** Shopify Native · **B** Liquid Theme · **C** Shopify Configuration · **D** Shopify App · **E** Custom App/Extension · **F** Keep External · **G** Not Directly Migratable

| Componente actual | Tecnología actual | Equivalente Shopify | Tipo | Esfuerzo | Riesgo | Notas |
|---|---|---|---|---|---|---|
| **Home** (hero, categorías, carrusel, banners) | `app/page.tsx` + `components/home/*` | Secciones/bloques de theme (`index.json`) | B | Alto | Medio | Layout trivial; la lógica de video/imagen dual del hero y el zoom de categorías (`lib/image-framing.ts`) no tiene equivalente Liquid — hay que reconstruirlos en JS/CSS |
| **Header/Nav** | `components/layout/navbar/*` | `sections/header.liquid` | B | Medio | Bajo | Scroll-blur, autocompletado con debounce y badges en vivo (carrito/wishlist) requieren JS custom; predictive search de Shopify puede reemplazar el autocompletado |
| **Footer** | `components/layout/footer.tsx` | `sections/footer.liquid` | B | Bajo | Bajo | Trivial; columna "Comprar" dinámica por categoría → loop Liquid sobre un menú |
| **Product page (PDP)** | `components/product-detail/*` | `templates/product.json` + `sections/main-product.liquid` | B | Alto | Medio | Layout/acordeón triviales; el magnifier de mouse y el lightbox con pinch-zoom (`gallery.tsx`, `product-lightbox.tsx`) no existen en el media gallery nativo de Shopify — desarrollo custom o app de pago |
| **Product card** | `components/home/product-card.tsx` | `snippets/card-product.liquid` | B | Bajo | Bajo | Trivial |
| **Variantes / talla** | `ProductVariant` (Prisma), un solo eje (talla) | Shopify Variants (nativo, soporta hasta 3 ejes) | A | Bajo | Bajo | Modelo nativo es igual o más flexible; migración de datos directa |
| **Stock** | `ProductVariant.stock`, reservado en el intent de pago | Shopify Inventory (nativo, con "reservas" en el checkout de Shopify) | A/G | — | **Alto** | El *momento* de la reserva (antes del cobro, con reconciliación automática) es una lógica propia sin equivalente nativo exacto — ver [wompi-payments.md](./wompi-payments.md) |
| **Colecciones/categorías** | `Category` (Prisma) + banner/video con crop custom | Shopify Collections (manual o automática) | A + B | Medio | Bajo | El modelo de colección es nativo; el banner con recorte/zoom custom hay que reconstruirlo como sección |
| **Filtros** | `CatalogFilters`, estado en URL, animación de reflow (`framer-motion`) | Shopify Search & Discovery (app oficial gratuita) | D + B | Medio | Bajo | La lógica de filtrado la reemplaza la app; la UX específica (bottom-sheet mobile, animación de grilla) hay que reconstruirla |
| **Búsqueda** | Postgres ILIKE + scoring manual | Shopify Predictive Search (nativo) / Search & Discovery | A/D | Bajo | Bajo | Nativo cubre el caso general; el scoring específico se pierde (aceptable) |
| **Carrito (drawer)** | `cart-drawer/*`, localStorage + Prisma | Shopify AJAX Cart API + drawer custom | B | Medio | Bajo | Patrón común y bien soportado; la barra de envío gratis y el estado loading/empty/ready hay que reconstruirlos |
| **Wishlist** | `wishlist/*`, Prisma, con animación `framer-motion` | — | **G** | Medio-Alto | Medio | **Shopify no tiene wishlist nativa.** Requiere app de terceros (ver costos) o metafields de cliente + JS custom |
| **Cuentas de cliente** | Auth propia (Prisma, scrypt), dashboard con pedidos/direcciones/favoritos | Shopify Customer Accounts (nuevo sistema, login OTP sin contraseña) | A (con pérdida) | Medio | Medio | Ver [data-migration.md](./data-migration.md) para el problema de contraseñas — el dashboard custom actual se pierde, se reemplaza por el account center nativo de Shopify |
| **Direcciones** | `Address` (Prisma) CRUD propio | Shopify Customer Addresses (nativo) | A | Bajo | Bajo | Migración de datos directa |
| **Cupones** | `Coupon` (Prisma), cascada producto>categoría>sitio no aditiva | Shopify Discounts (nativo) | A (parcial) | Medio | Medio | Códigos porcentaje/fijo son nativos; la cascada de 3 niveles no-aditiva es lógica propia — Shopify permite combinar descuentos pero con reglas distintas, hay que rediseñar la política |
| **Envío** | Sin tarifas reales — umbral de envío gratis, resto "a confirmar" manual | Shopify Shipping (tarifas reales) o config manual equivalente | C | Bajo | Bajo | Shopify puede replicar "envío gratis desde $X" nativamente; el resto puede quedar igual de manual |
| **Impuestos** | No aplica (Radaelli no cobra IVA) | Shopify Tax (nativo, configurable a 0%) | C | Bajo | Bajo | Trivial — se configura para no cobrar impuestos |
| **Checkout** | Single-page propio, multi-proveedor (Wompi hosted + WhatsApp) | Shopify Checkout (hosteado, extensible solo en Plus) | **G** | — | **Alto** | Ver [wompi-payments.md](./wompi-payments.md) — el flujo WhatsApp-como-método-de-pago no tiene equivalente Shopify en absoluto |
| **Confirmación de pedido** | Página propia con eventos de analytics deduplicados | Shopify Thank You / Order Status page (personalizable incluso sin Plus) | B | Bajo | Bajo | Nativamente soportado, incluida personalización post-compra |
| **Pedidos** | `Order`/`OrderItem`/`OrderStatusEvent`, modelo de 2 niveles (status legado + fulfillmentStatus real) | Shopify Orders (nativo) | A (con pérdida) | Medio | Medio | El modelo nativo de Shopify es más simple; la lógica de "refund review" y las guardas de transición custom se pierden salvo que se repliquen con Shopify Flow/Functions |
| **Admin** | Panel propio (`app/admin/*`) | Shopify Admin | A | — | — | Ver tabla dedicada más abajo |
| **Wompi** | Integración custom (hosted checkout, webhook HMAC, cron de recuperación) | App "Wompi Pagos" (oficial) | D | — | **Alto** | Ver [wompi-payments.md](./wompi-payments.md) — la app existe pero no replica las garantías de fiabilidad actuales |
| **Emails transaccionales** | Resend + `EmailOutbox` propio con reintentos | Shopify Notifications (nativo) | A (parcial) + F | Bajo-Medio | Medio | Ver [seo-analytics.md](./seo-analytics.md) — cubre confirmación/envío; reset de contraseña cambia de modelo (OTP); sin garantías de reintento visibles |
| **Analytics (GA4)** | Cliente propio con consentimiento y exclusión de tráfico interno | Shopify Customer Events + Customer Privacy API (nativo) | A | Bajo-Medio | Bajo | Sorprendentemente completo de forma nativa — ver seo-analytics.md |
| **Meta CAPI** | Servidor propio, deduplicado, gateado por "pago realmente aprobado" | Meta channel nativo, tier "Maximum" (Conversions API nativo) | A | Bajo | Bajo-Medio | Nativo y sin app — el gate específico de "no disparar en pedidos de WhatsApp" requiere verificación (no aplica igual si no existe el flujo WhatsApp en Shopify) |
| **SEO / URLs** | `/producto/[slug]`, `/[categoria]` custom | `/products/<handle>`, `/collections/<handle>` fijos | **G** (en theme estándar) | Alto | **Alto** | Ver seo-analytics.md — prefijos de ruta no se pueden quitar en un theme Liquid estándar (Hydrogen/headless sí lo permitiría, pero es otro proyecto) |
| **Uploads (Cloudinary)** | Validación de magic bytes + resize propio | Shopify Files / CDN nativo | A | Bajo | Bajo | Shopify maneja su propio CDN de imágenes; se puede mantener Cloudinary igual si se prefiere (F) |
| **Observabilidad (SystemLog)** | Tabla propia + alertas por email con cooldown | Shopify no tiene equivalente directo | **G** | — | Bajo | Se pierde completamente; Shopify ofrece logs de admin básicos, nada comparable. Bajo riesgo real porque no es cara al cliente |

---

## 2. Arquitectura de theme propuesta (Online Store 2.0)

Sin crear archivos todavía — estructura conceptual sobre una base **Dawn** (recomendado, ver el theme de evaluación visual ya construido en `shopify-theme/` de una fase anterior):

```
layout/
  theme.liquid              — head, fonts (Poppins vía Google Fonts), CSP, wrapper
templates/
  index.json                — home (hero, categorías, colecciones destacadas)
  product.json               — PDP
  collection.json             — catálogo/categoría
  cart.json                  (si se usa cart page en vez de solo drawer)
  search.json
  page.json                  — páginas informativas (envíos, devoluciones, etc.)
  customers/
    login.json, register.json, account.json, order.json  — cuentas nativas
sections/
  header.liquid, footer.liquid, announcement-bar.liquid
  hero.liquid (custom)        — reemplaza components/home/hero.tsx
  category-grid.liquid (custom) — reemplaza categories-section.tsx
  featured-collection.liquid
  main-product.liquid (customizado) — acordeón, magnifier, wishlist button
  main-collection-product-grid.liquid
snippets/
  card-product.liquid
  price.liquid               — con soporte de descuento/cascada
  wishlist-button.liquid (custom, requiere app o metafields)
  gallery-zoom.liquid (custom JS)
assets/
  theme.css / theme.js
  gallery-zoom.js, category-crop.js  (reconstrucción de lib/image-framing.ts)
config/
  settings_schema.json / settings_data.json  — paleta, tipografía, umbral de envío gratis, etc.
locales/
  es.default.json
```

**Contenido editable desde el Theme Editor** (sections/blocks) vs. **metaobjects/metafields**:

| Contenido | Mecanismo Shopify recomendado |
|---|---|
| Hero (video/imagen, texto, CTA) | Section settings (igual que ya se hizo en el theme de evaluación) |
| Categorías destacadas | Blocks de tipo "collection" en una sección |
| Umbral de envío gratis, descuento sitewide, tasa USD | **Metaobject** "Store Settings" (singleton) — reemplaza el modelo `Settings` de Prisma |
| Banner/video de categoría con recorte | **Metafields** en la Collection (imagen + posición de recorte) |
| Guía de tallas | Metafield de imagen en Collection o Product |
| Acordeón de producto (cuidados, envíos, pagos) | Metafields de tipo rich-text en Product, o contenido fijo en la sección si es igual para todos |
| SKU/color/marca extendida | Metafields de Product (Shopify variants ya cubren talla) |

---

## 3. Comparación de Admin

| Función actual | Equivalente Shopify Admin | Mejor/Igual/Peor/Falta | Trabajo custom requerido |
|---|---|---|---|
| Pedidos (lista/detalle, estado de cumplimiento) | Orders nativo | Igual/Mejor (más maduro) | Ninguno, salvo si se quiere el modelo de 2 niveles exacto (Flow/metafield) |
| Pagos | Payments nativo (vía la app de Wompi) | Peor (menos visibilidad/control que el sistema propio) | Ninguno de entrada; recuperación automática requeriría Flow/app custom |
| Productos/variantes | Products nativo | Igual/Mejor | Ninguno |
| Stock | Inventory nativo | Igual | Ninguno para el caso general; el modelo de reserva-antes-de-cobrar no se replica automáticamente |
| Cupones | Discounts nativo | Igual (con distinta política de combinación) | Rediseño de la cascada de descuentos |
| Cumplimiento/envío | Fulfillment nativo (sin tarifas reales, igual que hoy) | Igual | Ninguno |
| Clientes | Customers nativo | Igual/Mejor | Ninguno, salvo el dashboard de cliente custom (se pierde) |
| Marketing (newsletter) | Shopify Email (app propia, separada) | Igual, pero es otra herramienta | Migrar suscriptores |
| Logs / auditoría | Muy limitado nativamente | **Falta** | Sin equivalente — se pierde `SystemLog` y las alertas con cooldown |
| Blog | Shopify Blog nativo | Igual | Migrar contenido |
| Configuración de tienda (TRM, descuento sitewide) | No existe un equivalente directo — requiere metaobject + app/Flow | **Falta** (parcial) | Construir como metaobject + página de configuración custom, o Flow |

---

## Anexo: Inventario detallado

El inventario completo (archivo por archivo) del frontend y del backend, producido por lectura directa del código, está disponible en el historial de esta sesión de auditoría. Resumen de lo más relevante para la decisión:

**Frontend — interacciones sin equivalente Liquid directo** (requieren JS custom, no son un bloqueo, sí son costo real):
1. Magnifier de mouse + lightbox con pinch-zoom/pan en la galería de producto.
2. Recorte con zoom real vía `background-position` en tarjetas/banners de categoría (workaround de un bug de `next/image`, sin equivalente Liquid).
3. Carrusel "peek" de scroll nativo con flechas que se autoocultan (Sunset Collection).
4. Animaciones `framer-motion` (reflow animado de grilla al filtrar, "pop" del corazón de wishlist).
5. Hero con doble modo video/fallback y cajas de aspect-ratio por breakpoint.
6. Barra de progreso de envío gratis + máquina de estados loading/empty/ready en el carrito.
7. Autocompletado de búsqueda con debounce en el navbar.
8. Checkout de una sola página multi-proveedor (Wompi + WhatsApp) — **este es estructural, no visual** (ver wompi-payments.md).

**Backend — lógica que NO es "plomería genérica de e-commerce" y debe rediseñarse, no migrarse tal cual**:
- Reserva de stock en el momento del intent de pago (antes del cobro), con reconciliación automática de pagos huérfanos.
- Convergencia de 3 caminos (webhook/retorno/cron) hacia una única función de finalización de pago, con claim atómico e idempotente.
- Verificación HMAC + re-verificación contra la API real de Wompi (no confiar solo en la firma).
- Flujo WhatsApp-como-método-de-pago (sin cobro real, coordinación manual).
- Cascada de descuento no aditiva (producto > categoría > sitio).
- Sin impuestos, sin tarifas de envío reales — todo el "envío" es un umbral + coordinación manual.
- Modelo de 2 niveles de estado de pedido (legado vs. operativo real) con guardas de transición escritas a mano.
- Exclusión de tráfico interno (equipo/familia) de analytics vía cookie de dispositivo activado manualmente.
- Observabilidad propia (`SystemLog`) con alertas por email y cooldown anti-fatiga.
- Migración de contraseñas legadas (SHA-256 sin sal → scrypt) — ver [data-migration.md](./data-migration.md).
