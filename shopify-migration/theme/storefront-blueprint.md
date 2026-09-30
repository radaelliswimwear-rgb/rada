# Storefront blueprint (Fase 02, secciones 1, 2, 7-14, 17-19)

Documento central de la Fase 02. Basado en investigación real del código (6 agentes de exploración paralela + verificación directa) — todo lo citado tiene archivo real de respaldo. Complementa `theme-file-map.md` (arquitectura de archivos), `react-to-liquid-map.md` (componente por componente), `interaction-map.md` (las 8 interacciones no triviales) y `data-architecture.md` (modelo de datos).

---

## 1. Auditoría página por página

| Página | Current route | Purpose | Data sources | Shopify template | Reusability | Custom JS |
|---|---|---|---|---|---|---|
| **Home** | `/` (`app/page.tsx`) | Hero + categorías + 2 vidrieras curadas + newsletter | `catalogRepository.listByCategory/listFeatured`, `listActiveCategories` — con exclusión de slugs ya usados entre secciones | `index.json` | Alta | Sí (carrusel, hero) |
| **Collection** (×9, mismo patrón) | `/oasis-natural`, `/aurora-viva`, `/espuma-de-ola`, `/salidas-de-bano`, `/hombre`, `/mujer`, `/ninos`, `/calzado`, `/accesorios` | Banner + toolbar orden/vista + filtros + grid + paginación | `getCategoryBannerImage`, `listByCategory` (Server Actions → Prisma) | `collection.json` | Muy alta (1 patrón × 9 rutas) | Sí (filtros, columnas de grilla) |
| **Product (PDP)** | `/producto/[slug]` | Galería, variantes, precio, stock, guía de tallas, relacionados | `getBySlug`, `listRelated`, `settingsRepository.get()` (guía de tallas solo si categoría = Oasis Natural) | `product.json` | Alta (SSG, `generateStaticParams`) | Sí (galería, lightbox, variantes) |
| **Search** | `/buscar` | Búsqueda por texto (`?q=`) | `catalogRepository.search`; autocomplete vía `searchSuggestions` (debounce 250ms) | `search.json` | Alta | Sí (predictive search) |
| **Cart** | Sin página propia — drawer global (`Dialog` de Headless UI en `Navbar`) | Ver/editar líneas, progreso envío gratis, ir a checkout | `useLocalCart` (localStorage + Server Actions), `getFreeShippingThresholdAction` | `cart.json` (fallback) + drawer en todas las páginas | Alta | Sí |
| **Wishlist (pública)** | `/favoritos` | Lista de favoritos sin cuenta | `useFavoriteProducts` (localStorage invitado / Prisma con sesión) | Sin template nativo — ver sección 10 | Media (depende de arquitectura elegida) | Sí |
| **Login** | `/cuenta/iniciar-sesion` | Iniciar sesión | `lib/auth/users-actions.ts` → Prisma `User` | `customers/login.json` | Media (Shopify controla lógica) | Mínimo |
| **Register** | `/cuenta/registro` | Alta de cuenta | `users-actions.ts` + `verification-tokens.ts` | `customers/register.json` | Media | Mínimo |
| **Forgot/Reset password** | `/cuenta/recuperar-contrasena`, `/restablecer-contrasena` | Recuperar acceso | `verification-tokens.ts`, `lib/email` | `customers/reset_password.json` | Baja (Shopify usa OTP, no este flujo — ver sección 11) | Mínimo |
| **Verify email** | `/cuenta/verificar-email` | Confirmar correo | `verification-tokens.ts` | Sin equivalente directo | Baja | Mínimo |
| **Account dashboard** | `/cuenta` | Resumen de cuenta | `useAuth()` + repos de orders/addresses | `customers/account.json` | Media | No |
| **Account orders** | `/cuenta/pedidos` | Historial de pedidos | `orders-repository.ts` (Prisma `Order`) | `customers/order.json` | Media | No |
| **Account addresses** | `/cuenta/direcciones` | CRUD de direcciones | `addresses-repository.ts` (Prisma `Address`) | `customers/addresses.json` | Media | No |
| **Account profile** | `/cuenta/perfil` | Editar nombre/email | `users-actions.ts` | Sin template dedicado (Shopify lo integra en account) | Baja | No |
| **Account favorites** | `/cuenta/favoritos` | Espejo de `/favoritos` dentro del shell de cuenta | Misma fuente que `/favoritos` | Sin equivalente — **duplica el propósito de `/favoritos` pública, conviene consolidar al migrar** | Baja | Sí |
| **Checkout (entrada)** | `/checkout` | Dirección, envío, cupón, pago (Wompi/WhatsApp) | `useLocalCart`, `addressesRepository`, `couponsRepository`, `ordersRepository`, `lib/payments/*` | Shopify Checkout nativo — **fuera de alcance de esta fase, no se rediseña** | N/A | N/A |
| **Static: envíos** | `/envios` | Política de envíos, con umbral dinámico | `settingsRepository.get()` (único dato dinámico de las 6 páginas legales) | `page.envios.json` | Alta | No |
| **Static: devoluciones/garantía/términos/privacidad** | `/devoluciones`, `/garantia`, `/terminos`, `/privacidad` | Contenido 100% estático hardcodeado en JSX | Ninguna | `page.json` | Alta (pero HOY no editables sin código — mejora real en Shopify) | No |
| **Static: cookies** | `/cookies` | Política + botón de preferencias de consentimiento | `lib/consent/consent-actions.ts` (solo el botón) | `page.json` | Alta | Sí (botón) |
| **Blog (listado)** | `/blog` | Índice de artículos | `blogRepository.listAll()` (Prisma `BlogPost`) | `blog.json` | Alta | No |
| **Blog (detalle)** | `/blog/[slug]` | Artículo, Markdown→HTML propio | `blogRepository.getBySlug()`, `lib/blog/markdown.ts` | `article.json` | Alta (SSG) | No |
| **404** | `app/not-found.tsx` | Error con marca + 2 CTAs | Ninguna | `404.json` | Alta | No |
| **Rutas legacy muertas** | `/product/[handle]`, `/search`, `/search/[collection]`, `/[page]` | Plantilla original Vercel Commerce, `SHOPIFY_STORE_DOMAIN` nunca configurado → siempre `notFound()`/vacío | `lib/shopify` (GraphQL, inerte) | **No migrar** — no son parte del storefront real | N/A | N/A |

---

## 2. Inventario visual completo

Detalle componente-por-componente ya cubierto exhaustivamente en `react-to-liquid-map.md` (38 componentes/patrones reales mapeados). Resumen de lo confirmado existente en el código real (ninguno de la lista del encargo se omitió sin verificar):

header ✓ · announcement bar ✓ · desktop nav ✓ · mobile nav ✓ · hero ✓ · promo banners ✓ · editorial blocks ✓ · product cards ✓ (2 variantes) · collection cards ✓ · product gallery ✓ · image zoom ✓ · lightbox ✓ · thumbnail nav ✓ · product info ✓ · price ✓ · discount display ✓ · color presentation ✓ (solo texto, sin swatches) · size selector ✓ · stock messaging ✓ · add-to-cart ✓ · cart drawer ✓ (no hay página de carrito) · free-shipping bar ✓ · recommendations ✓ (3 variantes: relacionados/recomendados/vistos recientemente) · wishlist UI ✓ · search UI ✓ · account UI ✓ · footer ✓ · WhatsApp elements ✓ · loaders ✓ · modals ✓ (3: quick view, guía de tallas, avísame) · toasts ✓ (sonner) · badges ✓ · breadcrumbs ✓ (patrón manual repetido, no componente compartido) · empty states ✓ (carrito, wishlist, catálogo filtrado, búsqueda).

---

## 7. Product Page Blueprint

| Elemento | Current UX | Shopify implementation | JS custom |
|---|---|---|---|
| Galería desktop | Fotos apiladas precargadas (opacity toggle), miniaturas laterales | `snippets/product-gallery.liquid` | Sí |
| Galería mobile | Swipe táctil nativo, puntos indicadores | Mismo snippet, responsive | Sí |
| Zoom/magnifier | Lupa en hover (desktop only, CSS background-position) | Ver `interaction-map.md` #1 | Sí |
| Lightbox | Pantalla completa, pinch-zoom, pan, teclado | Ver `interaction-map.md` #2 | Sí |
| Miniaturas | Clicables, `aria-current` en la activa | Dentro de galería y lightbox | Sí |
| Título del producto | `product.name` | Nativo (`product.title`) | No |
| Colección | Mostrada como badge sobre la imagen en tarjetas, no en el PDP en sí (breadcrumb sí la muestra) | `product.collections` nativo | No |
| Color | Texto plano "Color — {color}", sin swatches | Metafield `custom.color` (ver `data-architecture.md`) | No |
| Precio | `DiscountedMoney`: precio final + tachado + badge -X% | `snippets/price.liquid` con `compare_at_price` | No |
| Compare-at price | `originalPriceValue`, calculado server-side | Nativo Shopify (`compare_at_price`) | No |
| Badge de descuento | Pill rojo "-X%" | CSS + Liquid condicional | No |
| Selector de talla | Pills, tallas agotadas tachadas pero clicables (para "Avísame") | `snippets/size-selector.liquid` — replicar el matiz exacto | Sí |
| Disponibilidad | "Disponible"/"Últimas unidades"/"Agotado" derivado de stock real | Nativo Shopify (`variant.available`, `inventory_quantity`) + lógica de "últimas unidades" custom | Sí (umbral de "últimas unidades") |
| Add to cart | Botón principal; si talla agotada → `BackInStockButton` en su lugar | Shopify Cart AJAX API + `back-in-stock-form.liquid` | Sí |
| Guía de tallas | Modal con imagen única sitewide | Modal desde metaobject | Sí |
| Mensajería de envío | No confirmada en el PDP en sí (vive en checkout/carrito) | — | — |
| Descripción del producto | Acordeón (Disclosure + framer-motion) | `<details>` nativo, sin JS necesario | No (mejora: elimina dependencia) |
| Detalles/bullets | Parte del texto de `description` (formato "• bullet" dentro del string) | Mismo, o migrar a metafield de lista si se quiere estructurar | No |
| Relacionados | `listRelated` server-side (scoring por color/precio/stock) | Shopify Product Recommendations API (algoritmo distinto, no idéntico) | No |
| Vistos recientemente | `components/catalog/recently-viewed.tsx`, localStorage | Portable 1:1 (localStorage) | Sí |
| Wishlist | Botón corazón con animación spring | Ver sección 10 — arquitectura pendiente de decisión | Sí |
| "Viendo ahora" (presencia en vivo) | `LiveViewers`, latido cada ~20s vía `ProductViewer` | **Sin equivalente nativo Shopify** — requiere app o backend propio si se quiere conservar | Sí |

**JavaScript custom requerido en la PDP**: alto — es la página con más interacción no trivial del sitio (galería + lightbox + selector de talla + acordeón + wishlist + recomendaciones).

---

## 8. Collection Blueprint

- **Collection hero/banner**: imagen o video con encuadre custom (`lib/image-framing.ts`) — portable vía metafields + CSS (ver `interaction-map.md` #3).
- **Product grid**: responsive, columnas seleccionables por el usuario (`params.vista`, valida 2/3/4) — hoy un detalle real de UX no trivial de replicar 1:1; Shopify no tiene "elegir columnas" nativo, requeriría JS custom si se quiere conservar.
- **Sorting**: por precio asc/desc confirmado en `lib/catalog/catalog-actions.ts` (`sortComparator`) — Shopify Collection tiene sorting nativo equivalente.
- **Filtering**: por talla/color/precio vía query params, resuelto server-side contra Prisma.
- **Product count**: no confirmado explícitamente en el inventario — verificar al implementar si se muestra "N productos" en el toolbar.
- **Empty state**: `CatalogGrid` maneja el caso "sin resultados" para filtros que no matchean nada.
- **Pagination**: componente `Pagination` real, pero `PAGE_SIZE=200` hace que casi nunca se dispare en la práctica (con 29 productos reales totales, ninguna colección se acerca a 200) — Shopify `paginate` nativo cubre esto sin esfuerzo.

**Search & Discovery nativo vs. custom**: Shopify Search & Discovery (app nativa gratuita) cubre filtrado por talla/color/precio y sorting de forma nativa sin backend propio — **recomendado como reemplazo directo** de `lib/catalog/catalog-actions.ts` para esta página, ya que el filtrado actual no tiene ninguna regla de negocio propietaria compleja (es filtrado estándar de catálogo). El selector de "columnas de grilla" (2/3/4) sí es custom y no tiene equivalente nativo — decisión: conservarlo (JS propio) o simplificar a un único layout fijo (decisión de producto, no técnica, se anota como pendiente).

---

## 9. Cart Blueprint

| Elemento | Current | Shopify |
|---|---|---|
| Drawer vs página | **Drawer global**, sin página de carrito dedicada | Drawer equivalente (patrón estándar de temas) + `cart.json` como fallback |
| Line items | Imagen, nombre, talla, precio | Igual, vía Cart AJAX API |
| Quantity | Botones +/- | Igual |
| Remove | Botón "Quitar producto" (`aria-label` confirmado) | Igual |
| Discount messaging | No confirmado en el drawer en sí (cupón se aplica en checkout) | — |
| Subtotal | Sí, en tiempo real | Nativo |
| Free shipping progress | Barra real con umbral configurado (ver `interaction-map.md` #7) | `snippets/free-shipping-bar.liquid` |
| Shipping estimate | No confirmado en el drawer (se resuelve en checkout) | — |
| Checkout CTA | "Finalizar compra" → `/checkout` (dispara `begin_checkout`) | Igual, apunta a Shopify Checkout nativo |
| Upsell/recommendations | No confirmado en el drawer actual | Shopify Cart Recommendations disponible si se decide agregar (mejora, no paridad) |

**No se diseña el checkout en sí** (instrucción explícita de esta fase) — Shopify Checkout nativo reemplaza por completo `components/checkout/checkout-content.tsx` y todo el flujo propio de Wompi/WhatsApp actual, que queda documentado como parte del "Pagos" fuera de alcance de este blueprint.

---

## 10. Wishlist Architecture — 3 alternativas comparadas

El sitio actual tiene wishlist real (`Wishlist`/`WishlistItem` en Prisma, cookie de invitado + fusión al iniciar sesión). Shopify no la ofrece nativamente. **No se elige ninguna en esta fase** — solo se comparan.

| Criterio | A) Theme-local / localStorage | B) Customer metafields / custom app | C) App de terceros |
|---|---|---|---|
| Costo | Gratis | Gratis (si se construye) / costo de desarrollo | Recurrente mensual (ver `docs/shopify/cost-comparison.md`, ya investigado: $0-49 USD/mes según la app) |
| Persistencia | Solo en el navegador — se pierde entre dispositivos, se pierde al borrar datos | Real, atada a la cuenta de Shopify Customer | Real, en la infraestructura de la app |
| Requiere login | No (pero entonces nunca sincroniza entre dispositivos) | Sí, para persistir de verdad | Depende de la app, la mayoría sí |
| Portabilidad | Total — cero vendor lock-in | Alta — es un metafield propio, exportable | Baja — datos viven en la app, se pierden si se desinstala |
| Performance | Óptima (sin red) | Requiere llamadas a Shopify API | Variable, agrega JS de terceros |
| Vendor lock-in | Ninguno | Ninguno (es infraestructura nativa de Shopify) | Alto |
| Fidelidad al comportamiento actual (invitado + fusión al loguear) | Parcial — replicable con localStorage + sync manual al login vía Customer metafield | Alta — es el patrón más parecido al actual (invitado=cookie, usuario=persistido) | Depende de la app elegida |

**Nota de portabilidad (regla permanente, sección 22 del encargo)**: la opción B (metafields + lógica propia en el theme) es la que mejor cumple "nada crítico debe existir únicamente dentro de Shopify" — los datos son exportables vía Admin API en cualquier momento. La opción C ata el dato de negocio (qué le gusta a cada clienta) a un proveedor externo. Esto es información para la decisión de Daniela, no una elección hecha acá.

---

## 11. Customer Account Strategy

| Capacidad actual | Server-side real | Shopify Customer Accounts |
|---|---|---|
| Login | Sesión de servidor real (cookie httpOnly, tabla `Session`, hash SHA-256 del token) — **no localStorage**, contra lo que sugiere un comentario desactualizado en `require-auth.tsx` | **Login SIN contraseña, por código OTP enviado por email** (ya documentado en la auditoría de viabilidad previa, `docs/shopify/seo-analytics.md`) — cambio real de UX, no solo de skin |
| Registro | `registerAction`, rol `USER` siempre fijo, nunca leído del cliente | Shopify crea la cuenta al primer login OTP — no hay "formulario de registro" separado en el mismo sentido |
| Password reset | Flujo clásico de token por email + nueva contraseña | No aplica igual (no hay contraseña que resetear en el modelo OTP) |
| Direcciones | CRUD propio (`Address` Prisma) | Shopify Customer Addresses nativo |
| Pedidos | `Order` Prisma, historial propio | Shopify Orders nativo, vinculado al customer |
| Perfil | Nombre/email editable | Shopify Customer Profile nativo (campos limitados sin apps) |
| Favoritos | Ver sección 10 | Sin equivalente nativo |

**Qué controla el theme vs. qué controla Shopify**: el theme puede personalizar textos, colores y el layout general de las páginas de `customers/*.json` (Classic Customer Accounts) — pero **el flujo de autenticación en sí (OTP, no contraseña) es de Shopify, no personalizable desde el theme**. Con "New Customer Accounts" (la versión más nueva de Shopify), el control visual del theme es aún más limitado (experiencia hosteada por Shopify, similar a Checkout). Esta es una diferencia de UX real que Daniela debe conocer antes de decidir, no un detalle menor de implementación.

---

## 12. Content Pages

| Page | Shopify resource | Template | Content source actual | SEO migration required |
|---|---|---|---|---|
| Contacto | No existe como página dedicada hoy (vive como menú desplegable "Contacto" en el footer/header, con WhatsApp) | Página nueva opcional, o mantener como menú | `components/layout/contact-menu.tsx` | No aplica (no indexada como página propia hoy) |
| Quiénes somos | No existe como página dedicada — el copy de marca vive disperso (Hero, footer) | Página nueva opcional | — | No aplica |
| Envíos | Página de Shopify | `page.envios.json` (alterno, por el umbral dinámico) | `app/envios/page.tsx`, 100% JSX + 1 dato dinámico | Sí — redirect 1:1 |
| Devoluciones | Página de Shopify | `page.json` | `app/devoluciones/page.tsx`, 100% JSX | Sí |
| Garantía | Página de Shopify | `page.json` | `app/garantia/page.tsx`, 100% JSX | Sí |
| Privacidad | Página de Shopify | `page.json` | `app/privacidad/page.tsx`, 100% JSX | Sí |
| Términos | Página de Shopify | `page.json` | `app/terminos/page.tsx`, 100% JSX | Sí |
| Cookies | Página de Shopify | `page.json` + snippet de consentimiento | `app/cookies/page.tsx` + `ChangeConsentPreferencesButton` | Sí |
| FAQ | **No existe hoy como página separada** — no se inventa una | — | — | No aplica |
| Blog | Shopify Blog nativo | `blog.json` + `article.json` | `BlogPost` Prisma + Markdown propio | Sí — mapeo 1:1 por artículo |

**Hallazgo real importante**: las 6 páginas legales/informativas actuales tienen contenido **100% hardcodeado en JSX**, ninguna editable por Daniela sin tocar código hoy — pasar a páginas nativas de Shopify es una **mejora operativa real**, no solo una migración de formato.

---

## 13. Navigation Architecture (propuesta, con la taxonomía ya aprobada)

**DESKTOP MENU** (Main menu de Shopify): Inicio · Oasis Natural · Aurora Viva · Espuma de Ola · Salidas de Baño — mismo criterio que hoy (`Category.active` dinámico), pero ahora con solo las 4 colecciones oficiales, ya sin Hombre/Mujer/Niños/Calzado/Accesorios (confirmado con 0 productos reales, `reports/category-cleanup-plan.md`). Buscador y selector de moneda se mantienen como elementos del header, no del menú.

**MOBILE MENU**: mismo contenido que desktop, dentro del drawer — hoy además incluye accesos rápidos a Cuenta/Favoritos/Carrito con contadores, patrón a preservar.

**FOOTER MENU**: hoy 3 columnas reales — "Comprar" (categorías activas), "Ayuda" (menú de contacto expandible + políticas), "Empresa". Con la taxonomía nueva, "Comprar" pasa a listar solo las 4 colecciones oficiales.

No se implementa nada de esto todavía — es la propuesta de estructura final, a crear en Shopify Navigation cuando se ejecute la Fase 02C (ver `implementation-roadmap.md`).

---

## 14. Asset Reuse Audit

| Tipo de asset | Clasificación | Nota |
|---|---|---|
| Logo (`/logo/radaelli-swimwear.png`) | **REUSE DIRECTLY** | Subir tal cual a Shopify Files |
| Imágenes de producto (95 reales, Cloudinary) | **REUSE DIRECTLY** (referenciando Cloudinary) o **REUPLOAD TO SHOPIFY** | Ver `shopify-migration/images/image-migration-plan.md` — recomendación ya documentada: mantener Cloudinary durante la migración paralela, re-subir después si se decide cortar el proveedor |
| Imágenes editoriales (categorías, hero poster) | **REUSE DIRECTLY** | Mismas URLs Cloudinary, mismo criterio que arriba |
| Fuentes (Poppins) | **REUSE DIRECTLY** | Disponible nativamente en la librería de fuentes de Shopify |
| Fuente "Mont" (marca real, no licenciada hoy) | **DO NOT MIGRATE** (a menos que Daniela licencie) | Ver `design-tokens.md` |
| Iconos Heroicons | **REPROCESS** | Empaquetar como snippets SVG propios del theme (Shopify no los trae) |
| Ícono WhatsApp (SVG propio) | **REUSE DIRECTLY** | Ya es un asset propio, no depende de ninguna librería |
| Video del Hero | **REUSE DIRECTLY** (vía Cloudinary) o **REUPLOAD** | Mismo criterio que imágenes de producto |
| CSS (`app/globals.css`) | **REBUILD** | Traducir tokens a CSS custom properties del theme, ver `design-tokens.md` — no es un archivo portable 1:1 (depende de Tailwind runtime) |
| JS de componentes (galería, lightbox, carrusel, etc.) | **REBUILD** | Vanilla JS, técnica ya documentada en `interaction-map.md` — no depende de React, es portable en lógica aunque no en archivo |
| framer-motion (dependencia) | **DO NOT MIGRATE** | Reconstruir con CSS/FLIP manual, ver `interaction-map.md` #5 |

**No se descarga nada masivamente en esta fase** (instrucción explícita) — esta tabla es la clasificación, no la ejecución.

---

## 17. Performance Architecture

- **Image lazy loading**: hoy depende 100% del comportamiento por defecto de `next/image` (lazy salvo `priority`) — **excepción real y deliberada**: TODAS las imágenes de la galería del PDP llevan `priority` (se precargan todas para que el cambio de foto sea instantáneo), trade-off documentado explícitamente en el código, no un descuido. En Shopify: replicar el mismo trade-off en la PDP (precarga agresiva ahí, lazy-load normal en el resto) usando `loading="eager"` selectivamente.
- **Shopify CDN**: reemplaza la configuración actual de `next.config.ts` (`remotePatterns` restringido a cdn.shopify.com/images.unsplash.com/res.cloudinary.com, formatos avif/webp) — Shopify sirve automáticamente en formatos modernos con `srcset` responsivo nativo (filtro `image_url` + `sizes`).
- **Responsive image srcset**: hoy vía `sizes=` real en 29 usos de `next/image` (ej. `(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw` en tarjetas de catálogo) — mismo criterio de breakpoints a preservar en los `sizes` de Shopify.
- **Preload hero/LCP**: el logo del header y los primeros 2 productos del grid destacado del home usan `priority` explícito — identificar el elemento LCP real de cada template y aplicar `preload` equivalente.
- **CSS splitting**: no aplica igual en Shopify (no hay bundler de CSS por ruta como Next) — el theme sirve un CSS único o por sección, decisión de implementación en Fase 02B.
- **Minimal JS / no unnecessary libraries**: confirmado — **cero uso de `next/dynamic()`** en código de aplicación real (ningún code-splitting a nivel de componente hoy). Única dependencia de peso conocido: `framer-motion` (^12.42.2), acotada a 4 archivos — **se recomienda no llevarla al theme** (ver `interaction-map.md` #5), coherente con la preferencia de mínimas dependencias externas de esta fase.
- **Core Web Vitals**: sin datos reales medidos disponibles en esta fase (no se corrió Lighthouse/PageSpeed) — se documenta como pendiente de medición, no se inventa un número.

**Performance budget conceptual** (propuesta, no medida contra el sitio actual):

| Recurso | Budget propuesto |
|---|---|
| JS | Mínimo — sin librerías de framework, solo vanilla JS/Web Components por interacción (ver `interaction-map.md`) |
| CSS | Un archivo base (tokens + reset) + CSS por sección bajo demanda |
| LCP image | Precarga explícita del elemento hero/primera imagen de PDP, formatos AVIF/WebP vía Shopify CDN |
| Third party | Cero por defecto — cualquier app (wishlist, reviews) se evalúa por su costo de JS antes de instalar |

---

## 18. Accessibility

Requisitos derivados de lo que el sitio actual YA hace bien (para no perderlo) + brechas reales detectadas (para no heredarlas sin más):

**A preservar (ya implementado y confirmado)**:
- Anillo de foco visible GLOBAL (`app/globals.css`, regla real sobre `a, input, button` — no parche puntual).
- Skip-link real ("Saltar al contenido principal") en el layout raíz.
- `aria-pressed` en TODOS los toggles reales (filtros, columnas de grilla, favoritos, talla seleccionada).
- `role="dialog" aria-modal` en modales/lightbox, con bloqueo de scroll de fondo.
- `role="status" aria-live="polite"` en confirmaciones de carrito.
- Soporte de teclado completo en el lightbox (flechas, Escape, +/-).
- `prefers-reduced-motion` respetado para las 3 animaciones CSS del Hero (`@keyframes drift-*`).

**Brechas reales a NO heredar sin evaluar (documentadas, no corregidas en esta fase)**:
- El soporte de `prefers-reduced-motion` es puntual (1 regla CSS global + 1 componente), no sistemático sobre las animaciones framer-motion (reflow de grilla, pop de wishlist) — al reconstruir en CSS/vanilla JS, es la oportunidad natural de cerrar esto.
- La barra de progreso de envío gratis no tiene `role="progressbar"`/`aria-valuenow` — oportunidad de mejora real.
- El autocompletado de búsqueda no actualiza `aria-selected` dinámicamente ni soporta flechas arriba/abajo — oportunidad de mejora real, sobre todo si se migra a Predictive Search nativo (buen momento para corregirlo).
- Sin ALT por imagen individual (limitación del modelo de datos, no del código) — ver `data-architecture.md`.

**Requisitos explícitos para el theme nuevo**: mantener foco/teclado/aria en el mismo nivel confirmado arriba como mínimo; usar las 4 brechas como checklist de mejora deseable, no obligatoria, durante la implementación (Fase 02N, ver `implementation-roadmap.md`).

---

## 19. SEO Theme Architecture

Confirmado con lectura directa de `app/producto/[slug]/page.tsx`, `app/layout.tsx`, `app/sitemap.ts`, `lib/seo/product-json-ld.ts`:

- **Title/meta description**: hoy = `product.name`/`product.description` tal cual (sin campos SEO dedicados en el esquema) — en Shopify, usar los campos SEO nativos de producto (mejora real: permite un texto distinto al título/descripción visible).
- **Canonical**: `alternates.canonical` explícito por página — Shopify lo genera nativamente.
- **Product JSON-LD**: `buildProductJsonLd()` genera `@type: Product` con name/description/image[]/sku (solo si existe, nunca fabricado)/color/category + `offers` (price, priceCurrency COP, availability InStock/OutOfStock) — **documentado explícitamente en el código que NUNCA inventa reviews/ratings/GTIN/MPN** porque no existen en el modelo. Shopify genera Product JSON-LD nativo en temas Online Store 2.0 (Dawn y derivados) — verificar que cubra los mismos campos, agregar custom si falta alguno vía `snippets/json-ld-product.liquid`.
- **Breadcrumbs**: `BreadcrumbList` de 3 niveles (Inicio/Categoría/Producto) generado igual que el Product JSON-LD — replicar.
- **Organization/WebSite schema**: **SÍ existe hoy**, sitewide, en el layout raíz (`app/layout.tsx` líneas 66-85) — no es solo por página. Incluye `SearchAction` apuntando a `/buscar?q={search_term_string}`. Al migrar, actualizar el target del SearchAction a la búsqueda nativa de Shopify.
- **OpenGraph/Twitter cards**: confirmado en PDP (type website, título/descripción/imagen) y en artículos de blog (con JSON-LD `Article` adicional: headline/author/publisher/datePublished) — Shopify los genera nativamente, verificar paridad de campos.
- **Image ALT**: ver brecha real en `data-architecture.md` — no hay dato de ALT por imagen en el modelo actual.
- **Pagination SEO**: `PAGE_SIZE=200` hace que la paginación real casi nunca se ejercite hoy (29 productos totales) — sin necesidad de `rel=next/prev` complejo por ahora, Shopify lo maneja nativo si se necesita a futuro.
- **Redirects**: explícitamente **fuera de alcance de esta fase** (se maneja en la fase SEO dedicada, ya documentada en `docs/shopify/seo-analytics.md` de la auditoría de viabilidad previa).
