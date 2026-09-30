# Offline Release Candidate (RC1) — Fase 02M

> **Reemplazado por RC1.1 (Fase 03A).** Al subir RC1 a la Development Store, Shopify rechazó 3 archivos por límites que Theme Check no valida: `theme_author` > 25 caracteres y `header` > 50 caracteres (que arrastraban el footer). La prueba real además encontró overflow a 320 px con el nombre real de la tienda.
> RC1.1 (`dist/radaelli-shopify-theme-rc1.1.zip`, SHA-256 `28e0f7a0…4df7`) quedó a su vez **reemplazado por RC1.2 (Fase 03B)**.
>
> RC1.2 agrega la página de contraseña, el email de soporte real y el link a Favoritos con `?view=wishlist` mientras la plantilla no esté asignada.
>
> Usar `dist/radaelli-shopify-theme-rc1.2.zip` (SHA-256 `00f008b9…c86f`). Ver `theme/03A-development-store-upload-report.md` y `theme/03B-store-foundation-report.md`.

Modelo: **Opus 5.5** (`claude-opus-5-5`, ULTRACODE). 2026-09-28, 15:13 → ~15:45.

- **Release:** `shopify-migration/dist/radaelli-shopify-theme-rc1.zip`
- **SHA-256:** `a5340e0f8d29222b92e4968a4b079d94334d6c0bf383a6c898932d81f1bc09bf`
- **Manifiesto:** `shopify-migration/dist/release-manifest.json` (92 archivos con SHA-256 por archivo)
- **Checklist manual siguiente:** `theme/pre-development-store-checklist.md`

Qué es: el theme de las fases 02A–02L, cerrado, auditado y empaquetado **offline**. No se creó tienda ni Development Store, no se subió el theme, no se creó ninguna app.

Todo lo marcado PASS se probó sin Shopify real. Lo que depende de Shopify está listado en § 17–18 como bloqueante.

---

## 1. Alcance (baseline)

| Fase | Contenido |
|---|---|
| 02A | Skeleton OS 2.0 |
| 02B | Estilos globales |
| 02C | Header y navegación |
| 02D | Footer |
| 02E | Home |
| 02F | Product card |
| 02G | Colección |
| 02H | Ficha de producto |
| 02I | Carrito (drawer + página) |
| 02J | Búsqueda y búsqueda predictiva |
| 02K | Favoritos de invitada |
| 02L | New Customer Accounts en el header + capa de favoritos de cuenta **inerte** |

02M no agrega features: solo corrige bugs verificables, empaqueta y documenta.

## 2. Inventario del theme

92 archivos de theme, más `README.md`, que queda fuera del ZIP:

| Directorio | Archivos |
|---|---|
| `assets/` | 35 (23 CSS + 12 JS) |
| `config/` | 2 (`settings_schema.json`, `settings_data.json`) |
| `layout/` | 1 (`theme.liquid`) |
| `locales/` | 2 (`es.default.json`, `en.json`) |
| `sections/` | 25 (23 `.liquid` + 2 grupos `header-group.json` / `footer-group.json`) |
| `snippets/` | 17 |
| `templates/` | 10 (`index`, `collection`, `product`, `search`, `cart`, `page`, `page.wishlist`, `blog`, `article`, `404`) |

**Auditoría estática** (script propio, solo lectura; el resultado final está en § 4):
- Referencias: `render` → snippet, `asset_url` → asset, `section`/`sections` → archivo, template/grupo → `type` de sección y `type` de bloque.
- Settings: los de sección y bloque leídos en Liquid, contra el schema; también los leídos desde snippets, contra el schema de cada sección que los renderiza. Los globales, contra `settings_schema`. Además, valores de templates y `settings_data` contra el tipo (select/radio/range/checkbox).
- Locales: claves `t` contra el locale default, y paridad es/en.
- Estructura: IDs literales repetidos y anidamiento `a`/`form`/`button`.

**Criterio de "no usado":** no se borra lo que Shopify invoca dinámicamente.
- `sections/predictive-search.liquid` y `sections/wishlist-item.liquid` no están en templates a propósito: se piden por Section Rendering API (`section_id=`).
- `templates/page.wishlist.json` se asigna desde el Admin.

## 3. Correcciones hechas en 02M (bugs reales, verificados)

| # | Problema | Impacto en Shopify real | Corrección |
|---|---|---|---|
| 1 | `header.liquid` leía `section.settings.show_wishlist_icon` / `show_account_icon`, que son settings **globales** | Header **sin** link de favoritos ni `<shopify-account>`. Menú mobile sin "Favoritos" ni "Mi cuenta" (el valor siempre era nil) | Pasan a `settings.*` (4 lugares). Los harness a mano de 02C–02L no podían verlo; el render de Liquid real sí |
| 2 | La fuente de marca (Poppins) **nunca se cargaba**: `variables.css` la nombraba, pero no había `@font-face` ni `font_face`. El `font_picker` `type_base_font` no se leía | Todo el sitio en la fuente del sistema | `snippets/css-variables.liquid` carga `type_base_font` con `font_face` (400/500/600/700, `font-display: swap`) y define `--font-body` |
| 3 | Flecha "siguiente" de los carruseles de la Home: sobresalía 20px con 16px de gutter | **Scroll horizontal de 4px** de 320 a 767px (heredado del real, mismo `translate-x-1/2`) | Debajo de 768px la flecha sobresale 1/4. Desde 768px queda EXACT |
| 4 | Selector "Ordenar por" de la colección sin nombre accesible (`<h3>` no es `<label>`) | Lector de pantalla: "cuadro combinado" sin nombre | `aria-label` traducido (el snippet se renderiza 2 veces: sin ids nuevos) |
| 5 | **Sin JS, el mobile no tenía navegación**: el drawer necesita JS | Sin JS, en mobile no se llegaba a ninguna colección | `<noscript>` con los links principales del mismo menú, solo por debajo de `lg`, con targets de 44px |
| 6 | Dos locales `*.default.json` | Probable error de subida (Shopify admite un solo default) | `en.default.json` → `en.json` |
| 7 | Settings globales muertos `promo_banner_text` / `promo_banner_cta_url` (grupo "Promotions" de 02A; el banner usa settings de su sección) | Controles en el editor que no hacen nada | Grupo eliminado de schema y data |
| 8 | Claves de locale huérfanas `general.newsletter.error`, `general.pagination.page_of` | Ninguno | Eliminadas en es/en |

**Prueba de que la regresión detecta estos bugs:** la misma suite corrió contra una copia del theme con los bugs 1, 3, 4 y 5 reintroducidos.
- Resultado: **6 pruebas fallan** (header, favoritos, cuenta, no-JS, responsive y a11y).
- Contra el RC1: 0 fallan.

## 4. Locales

- **Antes:** `en.default.json` + `es.default.json` (2 defaults).
- **Después:** `es.default.json` (default, el sitio es 100% en español) + `en.json`.
- 154 claves en cada uno, con paridad es/en exacta.
- Todas las claves que usa el Liquid existen.
- 0 huérfanas.
- JSON válido. Theme Check 0/0.

## 5. Settings

- **Globales:** 41 settings en 11 grupos + `theme_info`. IDs únicos; todos se leen en Liquid (0 muertos). `logo` y `favicon` sin valor por defecto (normal en `image_picker`).
- **Secciones y bloques:** 64 valores de templates/grupos/data validados contra el tipo (0 inválidos). Rangos con ≤ 101 pasos y defaults válidos.
- **Seguros por defecto:**
  - `wishlist_account_sync` = **false** (hasta la app real).
  - `cart_free_shipping_progress` = **false** (hasta la tarifa gratis en Shopify).
  - `cart_show_compare_at` = false.
- **Siguen activas** porque funcionan con cualquier tienda: `cart_drawer_enabled` (Ajax Cart nativo) y `predictive_search_enabled` (nativo).
- **Dependen de datos y se degradan sin error:**
  - `collection_enable_filters`: sin Search & Discovery el panel no aparece.
  - `wishlist_enabled`: funciona offline en modo invitada.
- 0 IDs de tienda y 0 dominios hardcodeados.

## 6. Templates

Los 10 templates y 2 grupos son JSON válidos: cada `type` existe, IDs de `order` sin repetir, bloques y `block_order` consistentes.

**Requieren algo en el Admin:**
- `page.wishlist`: crear la página "Favoritos" con esa plantilla y elegirla en el setting `wishlist_page`.
- `index`: las secciones del inicio sin configurar renderizan sin errores (probado); para verlas completas hay que elegir colecciones y bloques.

**Faltan a propósito** (documentado, no es error de Theme Check):
- `password`: la Development Store usa la página de contraseña de Shopify. **Verificar en Phase 03.**
- `gift_card`: solo si se venden gift cards.
- `list-collections`: `/collections` usaría el default de Shopify.
- `customers/*`: **no se necesitan** con New Customer Accounts (02L).

## 7. Secciones y snippets

- Cada `render` apunta a un snippet real (17/17 usados).
- Schemas válidos.
- Sin recursión, sin `<form>` anidados.
- En el HTML real renderizado de 11 páginas: 0 interactivos anidados y 0 IDs duplicados (§ 12).
- Bloques con `block.shopify_attributes`; IDs con `section.id`.
- Sin app blocks falsos.
- La capa de cuenta de favoritos sigue **inerte**: sin transporte de la app no hay red.

## 8. Assets

- Los 23 `stylesheet_tag` y todos los `<script src>` apuntan a assets reales. 0 assets huérfanos.
- **CSS por plantilla:** los 3 CSS de la ficha, el de búsqueda y el de favoritos cargan solo en su template. `component-cart.css` es global porque el drawer vive en todas las páginas.
- **JS de producto:** `product-form`, `product-gallery` y `product-lightbox` solo en la ficha. `wishlist.js` solo con `wishlist_enabled`.
- 0 cargas duplicadas.
- 0 source maps, 0 `@import`, 0 CDN externos.
- 0 React/jQuery/Swiper/PhotoSwipe/Next. 0 `import` en JS (vanilla, módulos sin dependencias).

| Métrica | Bytes | gzip -9 |
|---|---|---|
| CSS total (23) | 147.135 | 43.936 |
| JS total (12) | 115.364 | 37.101 |

Los 5 más grandes (bytes / gzip):
1. `wishlist.js` 34.067 / 10.220
2. `cart.js` 21.000 / 6.581
3. `section-header.css` 17.015 / 4.319
4. `component-cart.css` 12.136 / 3.270
5. `variables.css` 11.794 / 4.402

## 9. Regresión global (Liquid real)

**Harness nuevo en 02M:**
- **Renderiza el Liquid REAL** de `theme-src` con liquidjs + shims de Shopify:
  - filtros `t`, `money`, `image_url`, `font_face`…;
  - tags `form`, `paginate`, `section`, `sections`, `schema`;
  - `strictFilters`: un filtro inexistente rompe el render.
- **Emula las APIs que usa el JS:** Ajax Cart (`/cart/add.js`, `/cart/change.js`, `/cart.js`), Section Rendering (`sections=`, `section_id=`) y Predictive Search.
- **Mocks solo ahí:** productos, colecciones, carrito, cliente.
- **Aislamiento:** vive en el scratchpad y corre en 127.0.0.1:4178/4179. Las páginas se abren en iframes del mismo origen; clicks y teclas son sintéticos.
- **Resultado:** **37/37 PASS** sobre `theme-src` y **37/37 PASS** sobre el contenido **extraído del ZIP**.

| | Superficie | Qué se probó | Resultado |
|---|---|---|---|
| A | Header / Nav | 4 links. Dropdown `aria-expanded` + Escape. 4 acciones (buscar/favoritos/cuenta/carrito) sin solaparse. Sticky. Menú mobile: abre, submenú, Escape, foco vuelve, sin scroll lock residual | PASS |
| B | Footer | Menú desde linklist; newsletter nativo con label (si se agrega el bloque) | PASS |
| C | Home | Sin configurar (primer upload): sin errores. Configurada: 3 categorías (1 "próximamente" como botón), carruseles | PASS |
| D | Product Card | Corazones visibles tras JS, badge agotado, link a la ficha | PASS |
| E | Collection | Selector de columnas (`aria-pressed`), filtros, drawer de filtros mobile con Escape y foco | PASS |
| F | Product Page | Talla → id de variante. Talla agotada marcada. Add to cart abre el drawer con **un solo** `cart:updated` (3→4). Producto agotado: botón deshabilitado. Galería siguiente. Lightbox `<dialog>` con scroll lock y liberación | PASS |
| G | Cart Drawer | Abrir desde el header, +1 confirmado por el servidor, quitar línea, cerrar, scroll libre | PASS |
| H | Cart Page | Cantidad → subtotal. Vaciar → estado vacío | PASS |
| I | Search | `q=bikini` = 3 resultados; sin `q` = formulario | PASS |
| J | Predictive Search | Abrir, escribir "bik" → 3 sugerencias, combobox expandido, Escape | PASS |
| K | Wishlist invitada | Corazón → badge 1 → la página renderiza la fila con `wishlist-item.liquid` **real** → quitar → vacío | PASS |
| L | Wishlist cuenta (inerte) | Sesión + setting ON sin app → modo invitada, bootstrap presente, 0 requests a `/apps`. Marcador `signedOut` sin errores | PASS |
| M | Entrada de cuenta | 1280: `<shopify-account>` ≥ 44px. 375: oculto + "Mi cuenta" en el menú. Sin cuentas nuevas: link. Con sesión: sin slot (el avatar lo dibuja Shopify) | PASS |

**No se declara "PASS en Shopify real":** la hoja de `<shopify-account>`, Ajax Cart real, Search & Discovery, filtros reales, `customer` con cuentas nuevas y cache quedan para Phase 03 (checklist H.1 / B.1).

## 10. Responsive

6 páginas × 9 anchos (320/375/390/430/640/768/1024/1280/1440), 54 renders:
- Páginas: home configurada, colección, ficha, carrito, búsqueda, favoritos.
- **0 overflow horizontal.**
- **0 errores de JS o de recursos.**

Antes del fix #3, la home tenía 4px de overflow de 320 a 640.

## 11. Eventos del theme (contratos)

| Evento | Emite | Payload | Escucha |
|---|---|---|---|
| `product:variant-change` | `product-form.js` | `{sectionId, variant}` | `product-gallery.js` |
| `product:add-to-cart` | `product-form.js` (cancelable) | `{sectionId, productId, variant, form, respondWith}` | `cart.js` |
| `product:gallery-change` | `product-gallery.js` | `{sectionId, index, total, mediaId}` | — (analytics) |
| `cart:updated` | `cart.js` | `{itemCount, source, cart}` | `cart.js` (contadores del header) |
| `cart:item-added` | `cart.js` | `{variantId, quantity, item}` | — |
| `cart:item-removed` / `cart:quantity-changed` | `cart.js` | `{key, variantId, previousQuantity[, quantity]}` | — |
| `cart:opened` / `cart:begin-checkout` / `cart:error` | `cart.js` | `{source}` / `{itemCount}` / `{source, message}` | — |
| `search:results` / `search:no-results` / `search:submitted` / `search:suggestion-selected` | `search.js` | `{query, …}` | — |
| `search:collapse` | `header.js` | — | `search.js` |
| `wishlist:updated` / `add` / `remove` / `view` / `sync-status` | `wishlist.js` | `{count, ids, source, persistent, mode}` / `{productId, handle}` / `{state, accountPageUrl}` | `wishlist.js` |

- **Nombres:** únicos, con prefijos por dominio.
- **PII:** ningún payload lleva email, nombre ni id de cliente. `cart` es el JSON del carrito de Shopify (sin datos de la clienta). `query` es el texto que escribe la clienta: el consentimiento lo decide la capa de analytics (checklist L).
- **Loops:** no hay; add-to-cart produce exactamente 1 `cart:updated` (probado).
- **Listeners:** delegados o registrados una vez por elemento.

## 12. Accesibilidad

HTML real de 11 páginas (home, colección, ficha, carrito, búsqueda con y sin `q`, favoritos, página, blog, artículo, 404), **11/11 PASS**:
- Todo link o botón tiene nombre accesible.
- Todo control tiene label.
- `aria-controls` y `aria-labelledby` apuntan a IDs existentes.
- 0 IDs duplicados.
- 0 interactivos anidados.
- Toda `<img>` tiene `alt`.
- Exactamente 1 `<h1>`.
- `header`, `main` y `footer` presentes.
- `html[lang]`.

**CSS:**
- 4 bloques `prefers-reduced-motion`.
- 12 reglas `:focus-visible`.
- Targets del header ≥ 44px a 375.

**Diálogos** (drawer, lightbox, filtros, menú): Escape y foco vuelven al disparador; el scroll lock se limpia.

**Contraste:** no se re-midió en 02M (fases 02B–02K lo auditaron; `#b91c1c` 5,9:1 en 02K). Sin cambios de color en 02M.

**Conocido, sin cambiar:** "Ordenar por" envía al cambiar la opción (`onchange`, EXACT del real). Hay botón "Aplicar" para teclado y sin JS.

## 13. Sin JS

| Superficie | Sin JS |
|---|---|
| Nav desktop | Links reales |
| Nav mobile | **Nuevo `<noscript>`** con los 4 links principales (fix #5) |
| Búsqueda | La lupa es un link a `/search`, que tiene su formulario |
| Ficha | `<noscript>` con `<select name="id">` (tallas agotadas deshabilitadas) + submit nativo a `/cart/add` |
| Carrito | El header enlaza a `/cart`; formulario con `updates[]` y `checkout` |
| Favoritos | Aviso "Activá JavaScript"; corazones ocultos (diseño de 02K) |
| Cuenta | `<noscript>` con link a `routes.account_url` |

## 14. SEO, URLs y rutas

- **Canónica global:** `canonical_url` y títulos por template sin cambios.
- **Rutas:** solo `routes.*` y URLs de objetos Shopify (`product.url`, `collection.url`, `within`). 0 rutas de producción hardcodeadas.
- **Favoritos:** página de Shopify con plantilla `page.wishlist` (sugerido `/pages/favoritos`).
- **Cuenta:** rutas de Shopify.

**Redirects futuros (NO aplicados; se cargan en Admin > Navegación > Redirecciones de URL, checklist M):**
- Catálogo, colecciones, páginas y blog: `shopify-migration/seo/current-url-inventory.csv` (119 URLs, por ejemplo `/producto/<slug>` → `/products/<handle>`, `/<colección>` → `/collections/<handle>`, `/envios` → `/pages/envios`, `/blog/<slug>` → `/blogs/<blog>/<slug>`).
- Nuevos de 02L/02M:

| Desde (sitio actual) | Hacia (Shopify) |
|---|---|
| `/cuenta`, `/cuenta/pedidos` | `/account` |
| `/cuenta/perfil` | `/account/profile` |
| `/cuenta/direcciones` | `/account/addresses` |
| `/cuenta/iniciar-sesion`, `/cuenta/registro`, `/cuenta/recuperar-contrasena`, `/cuenta/restablecer-contrasena`, `/cuenta/verificar-email` | `/account/login` (sin registro ni contraseñas) |
| `/cuenta/favoritos`, `/favoritos` | `/pages/favoritos` (o la URL de la extensión "Mis favoritos" cuando exista). **03B:** activar recién cuando la página tenga asignada `page.wishlist` (se puede al publicar); antes, apuntar a `/pages/favoritos?view=wishlist` |
| `/buscar` | `/search` |
| `/checkout/confirmacion/<id>` | sin redirect (los pedidos viejos no se migran a esa URL) |

## 15. Dependencias de datos (Admin / Development Store)

| Entidad | Namespace/key o dónde | Tipo | Req. | Fallback actual | Bloquea |
|---|---|---|---|---|---|
| Colecciones objetivo | Oasis Natural, Aurora Viva, Espuma de Ola, Salidas de Baño | Colección | Sí | Menú y home vacíos | **Sí** |
| Opción de talla | Nombre de opción que contenga "Talla"/"Size"/"Tamaño" | Opción de producto | Sí | Se muestra como opción genérica sin guía de tallas | No |
| Color del producto | `product.metafields.custom.color` | single_line_text | Opcional | Sin "Color: X" ni afinidad en relacionados | No |
| Guía de tallas | `product.metafields.custom.size_guide` → metaobject con `image` (archivo) y `content` | Metaobject reference | Opcional | Settings de la ficha (imagen/texto/colección) | No |
| Banner de colección | `collection.metafields.custom.cover_video` (video), `cover_image` (imagen), `image_pos_x`, `image_pos_y`, `zoom` (número), `description_tone` (texto) | Varios | Opcional | `collection.image` nativo → arte decorativo por tono | No |
| Tags de color | Tags de producto | Tag | Recomendado | Buscar por color no encuentra | No |
| Favoritos de cuenta | `customer.metafields.custom.wishlist` | `list.product_reference` | Solo con la app | Modo invitada | No (la app sí) |
| Menús | `main-menu`, menú del footer (bloque "menu"), `customer-account-main-menu` | Navegación | Sí (main) | Header sin links | **Sí** |
| Página Favoritos | Página con plantilla `page.wishlist` + setting `wishlist_page` | Página | Sí para favoritos | Link a `/pages/favoritos`; sin la plantilla asignada, `?view=wishlist` (03B) | No |
| Envío gratis | Setting `free_shipping_threshold` (299900) + tarifa gratis en Envíos | Setting + tarifa | Opcional | Barra apagada | No |
| Filtros | Search & Discovery | App de Shopify | Opcional | Panel oculto | No |
| Contenido de secciones | Hero, categorías, carruseles, banner, newsletter, footer (marca, contacto, redes) | Theme Editor | Sí | Defaults del schema | No |
| Logo / favicon | `settings.logo`, `settings.favicon` | image_picker | Recomendado | Nombre de la tienda en texto | No |
| Políticas | Envíos / devoluciones | Políticas de la tienda | Recomendado | El acordeón de la ficha usa URLs de sus settings | No |

## 16. Dependencias de app / Customer Accounts (fuera del theme; nada creado)

Orden de implementación posterior (detalle en `customer-accounts-report.md` § 7 y § 20):

1. GO/NO-GO de cuentas en la Development Store (9 pruebas).
2. Definición `custom.wishlist` (Admin, del comercio, acceso de Customer Account read/write si lo permite).
3. App custom de Radaelli (custom distribution):
   - scopes `read_customers`, `write_customers`, `read_products`, `write_app_proxy`, `customer_read_customers`, `customer_write_customers`;
   - datos protegidos de cliente nivel 1;
   - webhooks de compliance como no-op.
4. App proxy → función sin estado (HMAC en tiempo constante, allowlist de tienda, ±300 s, `compareDigest`, `private, no-store`, CSRF por header), alojada fuera del Vercel/Neon actual.
5. App embed que registra el transporte (`window.Radaelli.wishlist.connectAccount`) y la URL de "Mis favoritos".
6. Extensión full-page `customer-account.page.render` "Mis favoritos".
7. Encender `wishlist_account_sync` solo en la tienda de prueba y repetir las regresiones.

## 17. Seguridad de favoritos y cuenta (verificado)

- `wishlist_account_sync` = false por defecto.
- Sin transporte de la app: 0 requests de red y modo invitada (probado con Liquid real).
- 0 `/apps` en el código (grep + harness).
- 0 identidad falsa: el `customer` solo viene de Liquid; el `owner` es un hash que no autoriza.
- 0 tokens de Admin.
- La lista completa de la cuenta nunca se guarda en localStorage.
- Invitada intacta: regresión 02K y K PASS.

## 18. Escaneo de secretos / portabilidad (global)

Escaneados `theme-src` (93 archivos), el contenido **extraído del ZIP** (92) y `release-manifest.json`.

**Funcional = 0**:
- 0 secretos, API keys, tokens ni passwords;
- 0 DSN ni URLs de base de datos;
- 0 dominios `myshopify`, IDs de tienda, theme o cliente;
- 0 emails ni teléfonos internos;
- 0 dependencias de `radaelliswimwear.com`;
- 0 imports de Next/React/Prisma;
- 0 Neon/Wompi/Vercel/SDK de Cloudinary;
- 0 localhost, endpoints de prueba o referencias al scratch.

**Coincidencias no funcionales** (declaradas):
- `tu@email.com` / `you@email.com`: placeholder del campo de newsletter (texto de UI).
- 3 menciones a Cloudinary dentro de comentarios de `hero.liquid` (documentan la divergencia).
- `placeholder@example.com` en `theme_info` (dominio reservado, pendiente de 02A).

## 19. Theme Check

| Sobre | Archivos | Errores | Warnings |
|---|---|---|---|
| `theme-src` (antes del ZIP) | 57 inspeccionados | 0 | 0 |
| Contenido extraído del ZIP | 57 inspeccionados | 0 | 0 |

## 20. Paquete reproducible

- **Builder:** `shopify-migration/scripts/build-theme-rc.mjs`, sin dependencias.
  - Toma solo `assets`, `config`, `layout`, `locales`, `sections`, `snippets` y `templates`, en orden alfabético.
  - Fecha fija 1980-01-01 en cada entrada y deflate nivel 9.
  - Sin permisos Unix ni campos extra.
  - Compila dos veces y aborta si los bytes difieren.
- **Reproducibilidad:** una segunda ejecución independiente dio **el mismo SHA-256** (`a5340e0f…09bf`). La fecha del manifiesto no entra en el ZIP.
- **Extracción independiente** (PowerShell `Expand-Archive`):
  - raíz exactamente `assets/ config/ layout/ locales/ sections/ snippets/ templates/`, sin carpeta contenedora;
  - 92/92 archivos, 0 faltantes, 0 extra;
  - 0 diferencias de hash contra `theme-src` y contra el manifiesto.
- **Excluidos:** `README.md`, reportes, harness, `node_modules`, `.git`, scratch, `launch.json` y el código de Next.
- **Limpieza:** la extracción y la copia mutante del scratch se borraron al terminar.
- **Commit:** el ZIP **no** se commitea; `shopify-migration/` está sin versionar en el worktree aislado.

## 21. Bloqueantes

**Requieren Development Store (Phase 03):**
- Subida real del ZIP.
- Página de contraseña.
- `<shopify-account>` real y los GO/NO-GO de cuentas.
- Ajax Cart y Section Rendering reales.
- Search & Discovery.
- Fuentes de la librería de Shopify (`font_face`).
- Metafields y metaobjects.
- Cache con sesión.
- Checkout y Wompi.

**Requieren app:** favoritos de cuenta (proxy, función, app embed, extensión).

**Decisiones pendientes de Daniela:**
- plan de Shopify;
- crear y conectar la Development Store;
- migrar clientes (Habeas Data);
- devoluciones de autoservicio;
- ingreso social;
- licencia de "Mont" o seguir con Poppins;
- colecciones Accesorios/Hombre (`REQUIRES_DECISION` en el inventario SEO);
- email real de soporte del theme (`theme_info`).

## 22. GO / NO-GO para la Development Store

**GO.** El theme está listo para subirse a una Development Store:
- ZIP válido, reproducible y auditado.
- Theme Check 0/0 en origen y en el ZIP.
- Regresión 37/37 sobre Liquid real (origen y ZIP).
- Escaneo funcional en 0.

El siguiente paso es manual de Daniela: crear o conectar la Development Store (checklist paso A). Claude **no** inicia Phase 03.
