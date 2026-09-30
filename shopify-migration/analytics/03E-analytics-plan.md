# 03E — Plan de analytics del día 1 en Shopify

- **Fecha:** 2026-09-29 (Bogotá).
- **Tienda:** Development Store `radaelli-swimwear-dev`, protegida con contraseña. Claude no tiene acceso: no hay navegador ni CLI en esta fase.
- **Theme:** Radaelli `189072474431`, sin publicar (RC1.4 + cambios locales de 03E).
- **Alcance:** cómo medir el embudo **anuncio → visita → ficha → carrito → checkout → compra** desde el día 1:
  - qué pone Shopify de forma nativa;
  - qué pone cada app oficial;
  - qué cubre un custom pixel propio.
- **Hecho:**
  - plan (este documento);
  - custom pixel **apagado** + mapa puro + tests (`custom-pixel/`).
- **No hecho (owner-only):** instalar apps, crear pixels, cargar IDs, configurar el banner y cambiar textos legales.
- **Fuentes:** solo oficiales (§ 15). Las afirmaciones sobre el repo citan `archivo:línea`. Lo que no se pudo confirmar dice **NOT_VERIFIED**.

## Resumen ejecutivo

1. **Arquitectura recomendada (opción A):** "un dueño por evento y por destino".
   - **GA4:** app **Google & YouTube**.
   - **Meta:** app **Facebook & Instagram**. Con el nivel de datos Mejorado o Máximo, la app agrega Conversions API para la compra.
   - **Huecos:** un **custom pixel de Radaelli** en modo `gaps_only`, para lo que ninguna app manda: favoritos, búsqueda sin resultados, talla, cart drawer y pasos de contacto y dirección del checkout.
   - **Resultado:** nunca dos emisores del mismo evento al mismo destino, que es la forma más simple de no duplicar.
2. **Checkout:** hoy **solo** se mide con pixels de "Eventos de clientes".
   - Los scripts adicionales de la página de agradecimiento quedaron retirados. El plazo era el 2026-08-26, y las tiendas que no migraron se actualizaron solas.
   - Los pixels cargan en tienda, checkout, agradecimiento y estado del pedido.
3. **El embudo hoy mediría cero o datos falsos:**
   - la tienda resuelve a EE. UU.;
   - con país Colombia todo el catálogo figura agotado (el `add` responde 422);
   - no hay proveedor de pago, así que `checkout_completed` es imposible.
   - **Consecuencia:** no conviene encender analytics antes de resolver C1 y C2 (`../theme/03E-checkout-baseline-report.md:29-56`) y el pago.
4. **Contradicción legal:**
   - la política de cookies que se migraría dice que las cookies analíticas y de marketing "Hoy no las usamos" (`../content/legal/cookies.html`, verbatim del sitio);
   - además, el banner de Shopify **no** se activa por defecto fuera de UK y EEE;
   - y donde no hay banner, el consentimiento por defecto es "permitido".
   - **Encender GA4 o Meta sin (a) banner para Colombia y (b) texto legal actualizado contradice lo publicado.** Owner/legal.
5. **Bug heredado del sitio Next.js:** el adapter de Meta trataba `AddShippingInfo` como evento estándar (`lib/analytics/adapters/meta-pixel-browser.ts:25-38`).
   - La referencia oficial de Meta lista 17 eventos estándar y **ese no está**.
   - En Shopify no se replica.
6. **Custom pixel:**
   - **Tests:** 55/55 pass (`node --test`), más 19/19 mutantes detectados (temporales, en el scratchpad).
   - **Estado de fábrica:** `ENABLED:false` y IDs vacíos. Sin consentimiento, sin IDs válidos o con el interruptor apagado, **no dispara nada**. No reenvía PII.
7. **Owner-only:** § 11. Son 12 pasos priorizados. Ningún ID aparece en este documento: los entrega la dueña.
8. **Qué tienda:** si la Dev Store es una dev store de Shopify (hay indicios; tipo exacto **NOT_VERIFIED**), no se le puede quitar la contraseña ni convertirla en tienda de producción [dev-stores]. Los pixels y apps definitivos se configuran en la tienda de producción; en la Dev Store, solo QA (§ 11).

## 1. Hechos medidos hoy que condicionan la medición

| # | Hecho (medido en la Dev Store) | Impacto en analytics |
|---|---|---|
| 1 | Mercado principal **EE. UU.**: `Shopify.country=US` y checkout `es-US` con formato numérico de EE. UU., aunque el navegador esté en Colombia (`../theme/03E-checkout-baseline-report.md:29-37`) | La moneda del checkout ya es COP (`:16`). El mapa toma moneda y montos **del evento** y nunca asume COP (test "la moneda sale del evento"). La geografía de GA4 sale de la IP, no del mercado |
| 2 | Con `country=CO`: 0/29 productos disponibles y `/cart/add.js` responde 422 (`:39-49`) | Para clientas de Colombia no hay `add_to_cart` posible. Un embudo encendido hoy mostraría caída del 100 % en "agregar". **Probar solo tras C1 y C2**, o con la sesión en US solo para QA técnico |
| 3 | Sin proveedor de pago: "no puede aceptar pagos" (`:21`) | `payment_info_submitted` y `checkout_completed` **no se pueden probar**. Hace falta proveedor o gateway de prueba (owner-only, § 11) |
| 4 | Índice de búsqueda 29/29. El predictive ignora `resources[options][fields]`, y los tags `color:` no generaron tokens buscables | `search_no_results` (custom) sirve para vigilar vacíos reales, por ejemplo "mostaza". El término se limpia de PII (§ 9) |
| 5 | Search & Discovery **no** instalada. Filtros nativos: precio (y disponibilidad oculta) | Sin evento de filtro. El uso de filtros queda visible en `page_location` (`filter.*` y `sort_by` están en la lista blanca) |
| 6 | Única app instalada: Translate & Adapt | Google & YouTube y Facebook & Instagram están **por instalar** (OAuth, owner-only) |
| 7 | Privacidad automática de Shopify activa. Reembolso y garantía migrados. Privacidad, términos, envíos y cookies preparados verbatim pero **sin crear** | La política de cookies debe cambiar **antes** de encender pixels (§ 6.4) |

## 2. Qué ofrece Shopify (fuentes oficiales)

### 2.1 Customer events / Web Pixels

- **Dos tipos de pixel,** los dos gestionados en *Settings > Customer events*:
  - **App pixels:** vienen con una app, corren en un sandbox **estricto** (web worker) y declaran su consentimiento en el TOML de la extensión.
  - **Custom pixels:** los pega el comerciante y corren en un sandbox **lax**: un iframe con `sandbox="allow-scripts allow-forms"`. Tienen `analytics`, `browser` e `init` ya disponibles, y **no** tienen `settings` [web-pixels-api], [pixels-dev]. El consentimiento se escucha con `api.customerPrivacy.subscribe(...)`, que es la forma del ejemplo oficial para custom pixels [cp-api], [pixel-privacy]; el runtime acepta esa forma y también la variable suelta.
- **Soporte:** Shopify declara los custom pixels como **no soportados**. La compatibilidad, el consentimiento y el mantenimiento quedan del lado del comerciante [custom-pixels].
- **Qué no puede hacer el sandbox** [pixels-overview]:
  - dibujar UI;
  - leer el DOM (clics, formularios, scroll, heatmaps, email por scraping).
  - **Consecuencia para Radaelli:** los `CustomEvent` del theme **no** llegan al pixel. Hay que publicarlos con `Shopify.analytics.publish` (§ 5).
- **URL de la página:** en el sandbox lax, la URL propia del iframe es la del sandbox. La URL real sale del evento (`context.document.location`), que es lo que usa el mapa [pixels-overview].
- **Dónde cargan:** tienda, checkout, página de agradecimiento y estado del pedido [pixels-overview].
  - En páginas de cuenta de cliente, solo con subdominio propio y solo `page_viewed`.
- **Agradecimiento y estado del pedido:**
  - los scripts adicionales y demás personalizaciones incompatibles (apps, scripts o pixels viejos) había que reemplazarlos;
  - el plazo que muestra hoy la página es el **2026-08-26** (tiene una sección para tiendas no Plus), y las tiendas que no se actualizaron se actualizaron solas [upgrade-typ];
  - **hoy los pixels son el único camino** para medir el checkout.
- **Plan:** las páginas consultadas no mencionan restricciones de plan para los pixels (restricciones por plan: **NOT_VERIFIED** para esta Dev Store).
- **Prueba de pagos:**
  - la ayuda general de pedidos de prueba dice que un proveedor de pago se prueba recién con un plan pago [test-orders], sin distinguir tipos de tienda;
  - la página de *dev stores* de shopify.dev dice que en una dev store se prueban pedidos con la pasarela de prueba **Bogus** o con el modo de prueba del proveedor, sin transacciones reales [dev-stores];
  - el tipo exacto de esta tienda es **NOT_VERIFIED**, pero el Admin muestra la insignia "dev" (`../theme/03A-development-store-upload-report.md:53`) y los indicios coinciden con una dev store (`../payments/03E-wompi-shopify-feasibility.md`, E25 y E35).
- **Límites de una dev store** [dev-stores]: no se puede quitar la página de contraseña y no se convierte en tienda de producción. Consecuencia en § 11.

### 2.2 Eventos estándar (los 13 pedidos)

| Evento | Datos clave | Dónde | Nota |
|---|---|---|---|
| `page_viewed` | contexto (URL, título, referrer) | todas | fuente de la URL real en el sandbox |
| `product_viewed` | `productVariant` (`id`, `sku`, `title`, `price`, `product{id,title,type,vendor,url}`) | ficha | — |
| `collection_viewed` | `collection{id,title,productVariants[]}` | colección | — |
| `search_submitted` | `searchResult{query,productVariants[]}` | búsqueda | — |
| `product_added_to_cart` | `cartLine{quantity,cost.totalAmount,merchandise}` | tienda | **NOT_VERIFIED** que se dispare con el alta AJAX del cart drawer (`cart.js:156-167`). Verificar con Pixel Helper |
| `product_removed_from_cart` | `cartLine` | tienda | ídem con `/cart/change.js` (`cart.js:171-190`) |
| `cart_viewed` | `cart` (puede ser `null`) | **página** de carrito | el drawer no cuenta como página: se cubre con `radaelli:cart_drawer_opened` |
| `checkout_started` | `checkout{token,currencyCode,subtotalPrice,totalPrice,lineItems[],email,phone,…}` | checkout | trae PII: el mapa usa lista blanca |
| `checkout_contact_info_submitted` | `checkout` | checkout | — |
| `checkout_address_info_submitted` | `checkout` | checkout | — |
| `checkout_shipping_info_submitted` | `checkout` | checkout | — |
| `payment_info_submitted` | `checkout` | checkout | — |
| `checkout_completed` | `checkout` + `order.id` | agradecimiento | se dispara **una vez por checkout**, normalmente en la página de agradecimiento; con upsell, en la primera oferta [ev-completed] |

- **Fuentes:** [std-events] y las páginas de cada evento.
- **Otros eventos estándar existentes,** sin uso en este plan: `alert_displayed` y `ui_extension_errored`.

### 2.3 Eventos propios: `Shopify.analytics.publish`

- **Qué permite:** el theme publica `Shopify.analytics.publish('radaelli:<evento>', {…})` y todos los custom pixels y app pixels lo reciben en `event.customData` [emitting].
- **Reglas:**
  - usar un prefijo propio;
  - **no** se pueden publicar eventos estándar;
  - la suscripción se hace por nombre (o con `all_custom_events`) [analytics-api].
- **Riesgo:** Shopify advierte que un custom event lo puede publicar cualquiera, incluso una visitante desde la consola del navegador [emitting]. Los `radaelli:*` sirven para tendencias, no como conversión de optimización.
- **Otra capa, distinta de esta:** los *Standard storefront events and actions* (`shopify:cart:lines-update`, `shopify:product:view`…, anunciados en el changelog el 2026-06-17) son eventos DOM entre el theme y las apps.
  - La documentación no los relaciona con los Web Pixels (relación **NOT_VERIFIED**).
  - No se usan en el día 1 [storefront-events], [storefront-events-changelog].

### 2.4 Consentimiento: Customer Privacy API y banner

- **API del theme:** `window.Shopify.customerPrivacy`, cargada con `loadFeatures('consent-tracking-api')` [customer-privacy].
  - Métodos: `analyticsProcessingAllowed()`, `marketingAllowed()`, `saleOfDataAllowed()`, `shouldShowBanner()` y `setTrackingConsent({analytics, marketing, preferences, sale_of_data})`.
  - Evento DOM `visitorConsentCollected`. Solo se publica cuando el consentimiento **cambia**.
- **En el pixel** [cp-api], [pixel-privacy]:
  - `init.customerPrivacy` da los cuatro booleanos: `analyticsProcessingAllowed`, `marketingAllowed`, `preferencesProcessingAllowed` y `saleOfDataAllowed`;
  - `api.customerPrivacy.subscribe('visitorConsentCollected', …)` da los cambios (en un app pixel, `customerPrivacy.subscribe`);
  - un app pixel solo carga si hay permiso para **todo** lo que declara;
  - qué hace un **custom** pixel con permiso "Obligatorio" antes de que la visitante responda (no carga o no recibe eventos) no está dicho en las páginas consultadas: **NOT_VERIFIED**. Por eso el código re-chequea el consentimiento en cada envío.
- **Default por región:**
  - en regiones configuradas para pedir consentimiento, lo no esencial está bloqueado hasta que la visitante acepta;
  - en las demás, según Shopify, "the default behavior is to allow all processing purposes" [customer-privacy].
- **Banner** (*Settings > Customer privacy > Cookie banner*) [privacy-settings]:
  - con ajustes automáticos, se activa para UK y EEE si hay mercados ahí;
  - fuera de esas regiones **no** está activo por defecto;
  - se puede desactivar lo automático y elegir regiones manualmente, en cualquier región;
  - también se puede reemplazar por el banner de una app.
- **Colombia:** ninguna de las páginas consultadas menciona a Colombia.
- **Custom pixel:** su configuración tiene "Permiso" (Obligatorio / No obligatorio, por Marketing, Análisis y Preferencias) y "Venta de datos" [cp-manage].

### 2.5 Apps oficiales

- **Google & YouTube** (Google LLC, gratuita) [app-google], [ga4-setup], [google-tag-shopify]:
  - conecta una propiedad GA4 y el Google tag;
  - Google documenta que la app manda `view_item_list`, `remove_from_cart`, `view_cart` y `add_shipping_info` (este último al dar datos de envío o dirección);
  - como conversiones por defecto incluye compra, alta al carrito e inicio de checkout;
  - pide revisar que no haya tags duplicados entre la app y la tienda o un custom pixel.
  - **NOT_VERIFIED:** la lista completa de la app (`page_view`, `view_item`, `search`, `add_payment_info`) y su integración con consent mode.
  - La ayuda de Shopify dice que GA4 no registra eventos mientras la tienda esté en "private mode" [ga4-setup]. Si eso equivale a la contraseña actual: **NOT_VERIFIED**. En una dev store la contraseña no se puede quitar [dev-stores], así que la app de Google podría no registrar nada en esta tienda.
- **Facebook & Instagram** [meta-data-sharing], [meta-pixel-help]:
  - niveles de datos: Estándar (solo pixel), Mejorado y Máximo;
  - Mejorado y Máximo usan **Conversions API + pixel**, y la compra viaja de servidor a servidor;
  - esos niveles comparten nombre, ubicación, email y teléfono de la clienta. **Hay que declararlo en la política de privacidad** (owner/legal);
  - según la tabla de eventos de [meta-data-sharing]: `PageView`, `ViewContent`, `Search`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo` y `Purchase`;
  - Shopify advierte que un pixel agregado a mano **además** de la app deja más de un pixel y datos duplicados.
  - **Cómo deduplica la app** (pixel y CAPI): no está documentado por Shopify (**NOT_VERIFIED**, igual que en `docs/shopify/seo-analytics.md:55`).

## 3. Arquitectura recomendada (día 1)

```
Anuncio (Meta / Google) ──UTM, gclid, fbclid──▶ Visita (storefront Radaelli)
                                                   │
       ┌───────────────────────────────────────────┼────────────────────────────────────────────┐
       │ Shopify Web Pixels (Customer events) — un solo bus de eventos; consentimiento aplicado │
       └───────────────────────────────────────────┼────────────────────────────────────────────┘
          │ estándar (13)                          │ custom "radaelli:*" (8)
          ▼                                        │  ◀── Shopify.analytics.publish (puente del theme, § 5, pendiente)
 ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────────────────────────────┐
 │ App Google & YouTube │  │ App Facebook & Insta │  │ Custom pixel Radaelli — MODE "gaps_only"  │
 │ (app pixel, estricto)│  │ pixel + CAPI server  │  │ 2 instancias: GA4 (Análisis),             │
 │ → GA4: embudo        │  │ → Meta: embudo +     │  │ Meta (Marketing)                          │
 │                      │  │   Purchase server    │  │ → GA4/Meta: solo los huecos (§ 4)         │
 └──────────────────────┘  └──────────────────────┘  └───────────────────────────────────────────┘
```

- **Opción A (recomendada):** apps oficiales + custom pixel en `gaps_only`.
  - Checkout, consentimiento de las apps y CAPI los mantiene quien los publica.
  - El pixel propio solo agrega lo que falta.
  - **Riesgo:** las sesiones y el usuario de GA4 del pixel propio podrían no coincidir con los de la app (§ 13, **NOT_VERIFIED**).
- **Opción B:** solo el custom pixel en modo `full`, sin apps oficiales.
  - Control total y un solo `client_id` en GA4.
  - **Pierde:** Conversions API (Meta), el catálogo y las conversiones de Google Ads que arma la app, y la captura del `fbclid` del frame principal (el sandbox no ve la URL de arriba).
  - Solo si la dueña no quiere instalar las apps.
- **No recomendado:** GTM dentro de un custom pixel.
  - Shopify recomienda su integración nativa de GA y advierte la duplicación si se suman las dos [gtm].
  - Agrega una capa sin beneficio para este catálogo.

## 4. Mapa de eventos: Shopify → GA4 → Meta

| Paso del embudo | Evento Shopify | GA4 (evento: parámetros) | Meta (evento: parámetros) | Quién lo manda en opción A |
|---|---|---|---|---|
| Anuncio → visita | `page_viewed` | `page_view`: `page_location` y `page_referrer` saneados (con `utm_*`, `gclid`, `gbraid`, `wbraid`, `fbclid`), `page_title` (se omite en búsqueda, checkout y cuenta) | `PageView` (código base, sin parámetros) | apps (GA4: **NOT_VERIFIED**; Meta: documentado) |
| Colección | `collection_viewed` | `view_item_list`: `item_list_id`, `item_list_name`, `items[≤20]{item_id, item_name, item_variant, item_brand, item_category, price, index}` | — (el sitio actual mandaba `ViewContent`, `meta-pixel-browser.ts:34`: se deja de hacer) | app Google (documentado) |
| Búsqueda | `search_submitted` | `search`: `search_term` (limpio de PII) | `Search`: `search_string`, `content_ids[≤10]`, `content_type` | app Meta (documentado); GA4 **NOT_VERIFIED** → override `GA4_EXTRA_STANDARD_EVENTS` si falta |
| Ficha | `product_viewed` | `view_item`: `currency`, `value`, `items[{item_id = id numérico del producto, …, quantity 1}]` | `ViewContent`: `content_ids[id de variante]`, `content_type:"product"`, `content_name`, `value`, `currency` | apps (GA4 **NOT_VERIFIED**; Meta: documentado) |
| Carrito | `product_added_to_cart` | `add_to_cart`: `currency`, `value` (costo de la línea), `items[{…, quantity}]` | `AddToCart`: `content_ids`, `contents[{id, quantity}]`, `content_type`, `value`, `currency` | apps |
| Carrito | `product_removed_from_cart` | `remove_from_cart`: ídem | — (sin estándar Meta) | app Google (documentado) |
| Carrito | `cart_viewed` | `view_cart`: `currency`, `value`, `items` | — | app Google (documentado) |
| Checkout | `checkout_started` | `begin_checkout`: `currency`, `value` (subtotal), `items` | `InitiateCheckout`: `contents`, `content_ids`, `num_items`, `value`, `currency` | apps |
| Checkout | `checkout_contact_info_submitted` | `checkout_contact_info` (custom): `currency`, `value`, `items` | — | **custom pixel** (hueco) |
| Checkout | `checkout_address_info_submitted` | `checkout_address_info` (custom): ídem | — | **custom pixel** (hueco). Nombre distinto de `add_shipping_info` para no chocar con la app |
| Checkout | `checkout_shipping_info_submitted` | `add_shipping_info`: `currency`, `value`, `items` | — (**`AddShippingInfo` no es estándar de Meta**) | app Google |
| Checkout | `payment_info_submitted` | `add_payment_info`: `currency`, `value` (total), `items` | `AddPaymentInfo`: `contents`, `content_ids`, `value`, `currency` | apps (GA4 **NOT_VERIFIED**) |
| Compra | `checkout_completed` | `purchase`: `transaction_id` (id numérico del pedido), `value` (total), `currency`, `shipping` y `tax` (si vienen en el evento), `items` | `Purchase`: `value`, `currency`, `contents`, `content_ids`, `num_items`; `eventID: purchase:<id>` | apps (Meta: pixel + CAPI) |
| Favoritos | `radaelli:wishlist_add` | `add_to_wishlist` (recomendado GA4): `items[{item_id}]` | `AddToWishlist` (**estándar**): `content_ids[id de producto]`, `content_type:"product_group"` | **custom pixel** |
| Favoritos | `radaelli:wishlist_remove` | `remove_from_wishlist` (custom): `items[{item_id}]`, `remove_source` | `RemoveFromWishlist` (`trackCustom`): ídem | **custom pixel** |
| Favoritos | `radaelli:wishlist_viewed` | `view_wishlist` (custom): `wishlist_count` | — | **custom pixel** |
| Búsqueda | `radaelli:search_no_results` | `search_no_results` (custom): `search_term`, `search_source` (`page`, `predictive`) | — | **custom pixel** |
| Búsqueda | `radaelli:search_suggestion_selected` | `search_suggestion_select` (custom): `search_term`, `suggestion_position`, `suggestion_path` | — | **custom pixel** |
| Ficha | `radaelli:variant_selected` | `select_size` (custom, paridad con `lib/analytics/types.ts:20`): `item_id`, `variant_id`, `size`, `availability` | — | **custom pixel** |
| Carrito | `radaelli:cart_drawer_opened` | `cart_drawer_open` (custom): `open_source` (`trigger`, `add`) | — | **custom pixel** |
| Carrito | `radaelli:cart_error` | `cart_error` (custom): `error_source` (`add`, `change`); el mensaje **no** se manda | — | **custom pixel** |

- **Parámetros GA4:** los nombres y los obligatorios siguen la referencia oficial [ga4-events]:
  - `search_term` es obligatorio en `search`;
  - `transaction_id` es obligatorio en `purchase`;
  - `currency` es obligatoria si hay `value`.
- **Eventos estándar de Meta:** según [meta-ref].
- **Dimensiones personalizadas:** los parámetros custom (`remove_source`, `search_source`, `suggestion_position`, `suggestion_path`, `size`, `availability`, `variant_id`, `open_source`, `error_source`, `wishlist_count`) hay que **registrarlos** en GA4 como dimensiones o métricas personalizadas para verlos en informes (owner, § 11).
- **Implementación:** `custom-pixel/event-map.js` (`EVENT_SPECS` y `BUILDERS`). El test "tabla de eventos" fija los 13 + 8 nombres.

## 5. Eventos propios del theme (inventario) y puente

- **Qué emite hoy el theme:** 20 `CustomEvent`. 16 se despachan en `document` (7 de carrito, 5 de favoritos y 4 de búsqueda); los 3 de `product:*` burbujean desde su custom element; `search:collapse` se despacha en el wrapper del header y **no** burbujea (`header.js:64`). Todos sin IDs de GA/Meta.
- **Por qué no alcanzan:** un pixel no los ve (sandbox).
- **Puente propuesto:** traduce 8 de ellos a `Shopify.analytics.publish`, uno por cada custom `radaelli:*` de § 4. El resto ya lo cubre un evento estándar o es estado interno.
- **Estado:** **propuesta, no aplicada.** Toca el theme y va en una fase futura con OK de la dueña. El código está en `custom-pixel/README.md`.

| Evento del theme | Origen | Publica | Motivo |
|---|---|---|---|
| `cart:updated` | `assets/cart.js:148`, `:202` | — | estado del contador |
| `cart:opened` | `cart.js:541` | `radaelli:cart_drawer_opened` | `cart_viewed` cubre solo la página `/cart` |
| `cart:item-added` | `cart.js:512` | — | `product_added_to_cart` (verificar con AJAX) |
| `cart:quantity-changed` | `cart.js:326` | — | eventos estándar de carrito (verificar) |
| `cart:item-removed` | `cart.js:324` | — | `product_removed_from_cart` (verificar) |
| `cart:begin-checkout` | `cart.js:308` | — | `checkout_started` |
| `cart:error` | `cart.js:342`, `:517` | `radaelli:cart_error` (solo `source`) | sin estándar; útil para ver el 422 de stock del hecho 2 |
| `wishlist:updated` | `assets/wishlist.js:613-619`, `:895-901` | — | estado |
| `wishlist:add` | `wishlist.js:662` | `radaelli:wishlist_add` | sin estándar |
| `wishlist:remove` | `wishlist.js:663` | `radaelli:wishlist_remove` | sin estándar |
| `wishlist:view` | `wishlist.js:711` | `radaelli:wishlist_viewed` | sin estándar |
| `wishlist:sync-status` | `wishlist.js:573` | — | estado técnico de la app de cuenta |
| `search:submitted` | `assets/search.js:264-267` | — | `search_submitted` |
| `search:suggestion-selected` | `search.js:239-243` | `radaelli:search_suggestion_selected` | sin estándar |
| `search:results` | `search.js:276` | — | `search_submitted` |
| `search:no-results` | `search.js:148`, `:277` | `radaelli:search_no_results` | sin estándar; monitorea el índice |
| `search:collapse` | `assets/header.js:64` | — | UI |
| `product:variant-change` | `assets/product-form.js:113-118` | `radaelli:variant_selected` | paridad con `select_size` |
| `product:add-to-cart` | `product-form.js:235-250` | — | lleva el `<form>` (no serializable); `product_added_to_cart` |
| `product:gallery-change` | `assets/product-gallery.js:134-139` | — | ruido |

- **Qué hoy no tiene evento:**
  - **Clic en WhatsApp** (`sections/footer.liquid:74-77`): el pixel no detecta clics salientes. El sitio actual medía `click_whatsapp` (`lib/analytics/types.ts:21`). Hueco: haría falta un evento nuevo en el theme.
  - **Uso de filtros:** `assets/collection-filters.js` no emite eventos. Queda visible por `filter.*` en `page_location`.

## 6. Consentimiento (compuertas)

### 6.1 Tres capas

1. **Región y banner (Shopify):** decide si hace falta pedir consentimiento. **Hay que incluir Colombia** en el banner (manual). Si no, rige "permitir todo" (§ 2.4).
2. **Permiso del pixel (Shopify):** cada instancia del custom pixel en **Obligatorio**:
   - GA4 → Análisis;
   - Meta → Marketing, respetando la venta de datos.
   - Las apps oficiales declaran lo suyo.
3. **Código (defensa en profundidad):** `event-map.js`, `decideDestinations`:
   - GA4 ⇐ `analyticsProcessingAllowed === true`;
   - Meta ⇐ `marketingAllowed === true && saleOfDataAllowed === true`;
   - sin dato = **no**;
   - tráfico interno = **no**;
   - `ENABLED:false` = **no**.
   - Se reevalúa en cada envío con `visitorConsentCollected` (escuchado vía `api.customerPrivacy`, § 2.1).
   - La matriz es la misma que `lib/analytics/consent-gate.ts:7-13` del sitio actual, más la venta de datos.

### 6.2 Google consent mode

- **Al cargar GA4** (solo tras el consentimiento de análisis), el pixel manda `gtag('consent','default',…)` con [consent-mode]:
  - `analytics_storage` = análisis;
  - `ad_storage`, `ad_user_data` y `ad_personalization` = marketing y venta de datos.
- **Cuando la clienta cambia su elección:** `gtag('consent','update',…)`.
- **Señales de Google:** `allow_google_signals` y `allow_ad_personalization_signals` quedan en `false` sin consentimiento de marketing [ga4-config].

### 6.3 Meta

- **Carga:** el pixel de Meta carga solo con marketing y venta de datos permitidos.
- **Configuración:** `fbq('set','autoConfig',false,ID)` antes de `init` [meta-advanced]. Así no hay rastreo automático de clics ni `PageView` implícito.
- **Revocación:** `fbq('consent','revoke')` [meta-gdpr]. Después ya no se envía nada.

### 6.4 Contradicción con la política publicada (owner/legal)

- **Qué dice hoy:** la política de cookies que se migraría (`../content/legal/cookies.html`, verbatim del sitio real) declara las cookies analíticas y de marketing como "Hoy no las usamos". Ya lo advertía `../theme/03D-legal-policies-inventory.md:22`, `:145`.
- **Choque 1:** encender GA4 o Meta la vuelve **falsa**.
- **Choque 2:** los niveles Mejorado y Máximo de Meta comparten email, teléfono, nombre y ubicación. La política de privacidad debe decirlo (la ayuda de Shopify pide informar a las clientas).
- **Botón del sitio actual:** "Cambiar mis preferencias de cookies" dependía de `lib/consent` y se quitó en la migración (`03D-legal-policies-inventory.md:10`).
- **Equivalente en Shopify:** el banner nativo tiene su propio acceso a preferencias. Cómo enlazarlo desde el footer: **NOT_VERIFIED**; lo definiría una fase de theme.

## 7. Deduplicación

- **Regla 1: un emisor por evento y destino** (`gaps_only`).
  - Es la única deduplicación garantizada entre apps oficiales y un pixel propio.
  - La app de Meta no publica el `event_id` que usa, así que un `Purchase` propio **no** se deduplicaría contra el de la app.
  - Google pide explícitamente evitar tags duplicados [google-tag-shopify].
- **Regla 2: Meta.** Pixel y CAPI se deduplican por `eventID` y `event_name` iguales, dentro de una ventana de 48 h [meta-dedup].
  - **Checkout:** el pixel usa `"<evento>:<hash del token>"`. Es estable si la página se recarga o Shopify reenvía, y el token crudo nunca sale.
  - **Compra:** `"purchase:<id numérico del pedido>"`, el mismo formato que `lib/analytics/purchase-event-id.ts:7-9`, para que un CAPI propio futuro pueda calcular el mismo id.
- **Regla 3: GA4.** Deduplica `purchase` por `transaction_id` [ga4-dedup]:
  - nunca vacío (Google advierte no mandar string vacío): sin id de pedido, el pixel **no** manda `purchase`;
  - el valor es el id numérico del pedido;
  - la deduplicación de Google es por usuario, así que no protege entre la app y un pixel con otro `client_id`: otra razón para la regla 1.
- **Regla 4: en la página.** El runtime guarda los `event_id` ya enviados y no reenvía el mismo en esa carga (test "full: el mismo checkout reenviado no se duplica").
- **Cambio respecto del sitio actual:**
  - antes `transaction_id` era el número de pedido (`purchase-event-id.ts:16-18`); ahora es el id de pedido de Shopify;
  - formato real de `checkout.order.id` (GID o número): **NOT_VERIFIED**. El mapa acepta los dos.

## 8. Opciones server-side

| Opción | Estado | Nota |
|---|---|---|
| Meta Conversions API vía app Facebook & Instagram (Mejorado o Máximo) | **Recomendada día 1** | La compra viaja de servidor a servidor, sin bloqueadores. Requiere declarar el intercambio de datos (§ 6.4) |
| CAPI propio (webhook `orders/paid` desde la app de favoritos u otra) | Futuro | Reusaría `purchase:<id>`. Lección del sitio actual: no mandar `Purchase` de pedidos sin pago real (`docs/go-live-checklist.md:24`) |
| GA4 Measurement Protocol | No día 1 | El sitio actual lo tenía (`lib/analytics/adapters/ga4-measurement-protocol.ts`). En Shopify duplicaría la compra de la app |
| Store first-party (tabla propia de eventos) | No migra | Lo reemplazan en parte los informes nativos de Shopify. Detalle de esos informes: **NOT_VERIFIED** en esta fase |

## 9. Privacidad y PII (implementado y probado)

- **Lista blanca de campos:** solo catálogo (ids, título, tipo, marca, variante, precio), cantidades, montos, moneda y URL saneada.
  - **Nunca:** `email`, `phone`, direcciones, `init.data.customer`, id de cliente ni token de checkout.
- **URL:**
  - sin fragmento ni credenciales;
  - query solo con `utm_*`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `variant`, `sort_by`, `page` y `filter.*` (fuera `q`, `preview_theme_id` y cualquier otro);
  - bajo `/checkouts`, `/orders`, `/account` y `/cart/c`, los segmentos que no son palabras cortas pasan a `:token`;
  - máximo 1.000 caracteres.
- **Término de búsqueda:**
  - recortado a 100 caracteres;
  - si parece email, o tiene 7 o más dígitos (teléfono o documento), va como `[redacted]`;
  - los SKU del catálogo (`RSONEN022`) pasan.
- **`page_title`:** se omite en búsqueda, checkout y cuenta.
- **`client_id` de GA4:**
  - sale de la cookie `_ga`, leída **solo** tras consentimiento de análisis;
  - si no está, del `clientId` de Shopify: un id seudónimo, sujeto al mismo consentimiento.
- **Tests:**
  - 6 tests de PII en el mapa;
  - 1 en runtime, que serializa todo lo que sale (`dataLayer`, cola de `fbq` y URLs de scripts) y busca email, teléfono, nombre, dirección, código postal, id de cliente y token.

## 10. Paridad con el sitio Next.js

| Sitio actual (`lib/analytics/types.ts:6-24`) | Shopify | Estado |
|---|---|---|
| `page_view` (sin call site propio; `go-live-checklist.md:24`) | `page_viewed` | cubierto |
| `view_item_list` (+ `ViewContent` en Meta) | `collection_viewed` (sin Meta) | cubierto; Meta cambia a propósito |
| `select_item` | — (el sandbox no ve clics; solo la sugerencia del buscador) | **hueco** parcial |
| `view_item`, `add_to_cart`, `view_cart`, `remove_from_cart`, `begin_checkout`, `add_payment_info`, `purchase`, `search` | estándar equivalentes | cubierto |
| `add_shipping_info` (+ `AddShippingInfo` "estándar" en Meta) | `checkout_shipping_info_submitted` (sin Meta) | cubierto; se corrige el error de Meta |
| `add_to_wishlist` | `radaelli:wishlist_add` | requiere el puente (§ 5) |
| `select_size` | `radaelli:variant_selected` | requiere el puente |
| `click_whatsapp` | — | **hueco** (evento de theme nuevo) |
| `filter_use` | `page_location` con `filter.*` | parcial |
| `coupon_apply` | — | **hueco**: no hay evento estándar de "cupón aplicado". El `checkout` de los eventos trae `discountApplications` (tipo `DISCOUNT_CODE`) y `discountsAmount` según [ev-completed]; el mapa no los usa hoy |
| `payment_failed` | — (`alert_displayed` podría servir; **NOT_VERIFIED**) | **hueco** |
| Tráfico interno (`consent-gate.ts:11-13`) | `INTERNAL_TRAFFIC_COOKIE` (cookie propia = "1") o el filtro de tráfico interno de GA4 (`docs/shopify/seo-analytics.md:49`) | decisión de la dueña |
| Cookie `radaelli_consent` (`lib/consent/preferences.ts:23`) | Customer Privacy de Shopify | reemplazado |

## 11. Owner-only (priorizado; ningún ID en este documento)

| # | Qué hace Daniela | Desbloquea |
|---|---|---|
| 1 | **C1 + C2:** Colombia como mercado principal y zona de envío Colombia (`../theme/03E-checkout-baseline-report.md:34-56`) | Que el embudo mida algo real |
| 2 | **Proveedor de pago** o pasarela de prueba Bogus. En una dev store Shopify documenta la Bogus y el modo de prueba del proveedor [dev-stores]; el tipo exacto de esta tienda es **NOT_VERIFIED** (§ 2.1) | `payment_info_submitted` / `checkout_completed` |
| 3 | **Decidir la opción A o la B** (§ 3) | Todo lo demás |
| 4 | **Legal:** actualizar la Política de cookies ("Hoy no las usamos") y la de privacidad (GA4, Meta y el intercambio de datos del nivel elegido) | Encender cualquier pixel sin contradecir lo publicado |
| 5 | **Banner de cookies:** quitar lo automático e incluir **Colombia** (y cada mercado activo); textos en español | Consentimiento real; sin esto rige "permitir todo" |
| 6 | **GA4:** crear la propiedad y el flujo web (zona Bogotá y moneda COP, según decida) y entregar el **ID de medición** | App Google y pixel GA4 |
| 7 | **Meta:** Business y dataset; entregar el **ID del dataset/píxel** | App Meta y pixel Meta |
| 8 | **Instalar Google & YouTube** (OAuth) y conectar la propiedad GA4 | Embudo en GA4 |
| 9 | **Instalar Facebook & Instagram** (OAuth), activar el intercambio de datos y elegir nivel (Mejorado o Máximo para CAPI) | Embudo en Meta + compra server-side |
| 10 | **Crear 2 custom pixels** (`custom-pixel/README.md` § Instalación): `ENABLED:true`, su ID y `gaps_only`; probar con Pixel Helper y recién después **Conectar** | Huecos (contacto y dirección del checkout ya; el resto con el puente) |
| 11 | **OK para el puente del theme** (`Shopify.analytics.publish`) | Favoritos, búsqueda sin resultados, talla, drawer, error de carrito |
| 12 | **GA4:** registrar las dimensiones personalizadas (§ 4); decidir tráfico interno (cookie o filtro de GA4) | Informes de los eventos custom |

- **Dónde se hace cada paso:**
  - si esta tienda es una dev store (§ 2.1), su contraseña **no** se puede quitar y **no** se convierte en tienda de producción [dev-stores];
  - entonces el lanzamiento real ocurre en **otra** tienda con plan pago, y los pasos 1, 2 y 4 a 12 (mercado, envío, pago, textos legales, banner, IDs, apps, pixels, dimensiones) se hacen o se repiten **ahí**;
  - en la Dev Store solo sirven para QA técnico;
  - además, según la ayuda de Shopify, GA4 no registra con la tienda en "private mode" [ga4-setup] (relación con la contraseña: **NOT_VERIFIED**).

## 12. Verificación (cuando se desbloquee)

1. **Pixel Helper** (*Customer events > pixel > Test*), con el banner aceptado. Un pixel a la vez [cp-testing].
   - Recorrido: Home → colección → ficha (cambiar talla) → favorito → buscar "mostaza" → agregar con el drawer → quitar → `/cart` → checkout (contacto, dirección, envío, pago).
   - Confirmar si `product_added_to_cart` y `product_removed_from_cart` se disparan con el **AJAX** del drawer.
2. **GA4 DebugView:**
   - un solo `page_view` por página (app o pixel, nunca los dos);
   - `page_location` sin `q=`, sin email y sin token;
   - revisar si la app manda `search` y `add_payment_info` (si no, override);
   - revisar si las sesiones de los eventos custom coinciden con las de la app (`client_id`).
3. **Meta, eventos de prueba:**
   - `AddToWishlist` con `eventID`;
   - **un** `Purchase` por pedido (app pixel + CAPI deduplicados por la app);
   - ningún `PageView` extra del pixel propio.
4. **Consentimiento:** rechazar en el banner → cero envíos; aceptar solo análisis → GA4 sí y Meta no; revocar → corte inmediato.
5. **Compra de prueba:** `purchase` con `transaction_id` igual al id del pedido; recargar la página de agradecimiento no duplica.

## 13. Abierto / NOT_VERIFIED

- **App Google:** lista completa de eventos (`page_view`, `view_item`, `search`, `add_payment_info`) e integración con consent mode.
- **Meta:** mecanismo exacto de deduplicación pixel/CAPI de la app. No hay fuente de Shopify; Meta documenta `eventID`/`event_id` + 48 h.
- **AJAX del drawer:** que `product_added_to_cart` y `product_removed_from_cart` se disparen con `/cart/add.js` y `/cart/change.js` (`cart.js:156-190`).
- **GA4 en el sandbox lax:** persistencia de `_ga` y de la sesión dentro del iframe sin `allow-same-origin`, y si los eventos del pixel propio quedan en la misma sesión que los de la app.
- **Formato de `checkout.order.id`:** GID o número.
- **Campos opcionales de compra:** si `checkout_completed` trae `shippingLine.price` y `totalTax` (se mandan solo si vienen).
- **Tamaño del código:** límite para un custom pixel. El archivo pesa 45.780 bytes con comentarios; se puede minificar.
- **Etiquetas del Admin en español** (solo se verificaron las inglesas).
- **Colombia:** si el banner se puede mostrar solo ahí y cómo lo exige la ley local. Es decisión legal; no se consultaron fuentes legales.
- **Plan:** restricciones de plan de pixels. Tipo exacto de esta tienda (dev store o no), que decide si hay pasarela Bogus y si se puede quitar la contraseña (§ 2.1).
- **Custom pixel antes del consentimiento:** si un pixel "Obligatorio" no carga o no recibe eventos hasta que la visitante acepta.
- **Nombre del custom event en el payload:** el ejemplo oficial muestra `name` sin el prefijo. El runtime fija el nombre al suscrito, así que funciona de las dos formas (test "custom event entregado con `name` sin prefijo").
- **Ids de producto contra las apps:** si el `item_id` (id de producto) y los `content_ids` (id de variante o, en favoritos, de producto con `product_group`) coinciden con los que usan la app de Google y el catálogo de la app de Meta. Si no coinciden, los favoritos no se cruzan con el catálogo.

## 14. Entregables

| Archivo | SHA-256 (16 primeros) | Bytes |
|---|---|---|
| `analytics/03E-analytics-plan.md` | este documento | — |
| `analytics/custom-pixel/radaelli-pixel.js` | `32ddc43a608c0758` | 45.780 |
| `analytics/custom-pixel/event-map.js` | `ad217b90c713e9ba` | 36.238 |
| `analytics/custom-pixel/test/event-map.test.mjs` | `cbec2ebe0a005e1c` | 48.971 |
| `analytics/custom-pixel/README.md` | `6bb1d7e2e5b74227` | 10.317 |

- **Tests:**
  - `node --test analytics/custom-pixel/test/event-map.test.mjs` da **55 tests, 12 suites, 55 pass, 0 fail** (Node v24.19.0). En Node 24, `node --test <carpeta>` falla: hay que pasar el archivo.
  - **19/19 mutantes** detectados. Los 17 del productor cubren consentimiento, placeholders, deduplicación, PII, `gaps_only`, `AddShippingInfo`, `transaction_id` vacío, moneda asumida, interruptor, re-chequeo, lectura de `_ga`, deduplicación en la página y `revoke`. Los 2 de la verificación cubren `api.customerPrivacy` y el nombre del custom event. Se corrieron en el scratchpad y no quedan en el repo.
- **Cambios de la verificación adversarial (2026-09-29):**
  - el runtime escucha el consentimiento también vía `api.customerPrivacy` (antes solo leía una variable suelta que la doc de custom pixels no expone, así que el `revoke` a mitad de página no habría ocurrido);
  - el runtime fija `event.name` al nombre suscrito;
  - el puente publica **8** eventos, no 7 (test nuevo en "inventario");
  - `event-map.js` no cambió; la copia dentro de `radaelli-pixel.js` sigue idéntica (test).
- **Qué no se tocó:** `theme-src`, `app/`, `catalog/`, `import/` y `dist/`. Tampoco la tienda, las apps ni las cuentas.

## 15. Fuentes oficiales (consultadas el 2026-09-29)

- [web-pixels-api] https://shopify.dev/docs/api/web-pixels-api
- [pixels-dev] https://shopify.dev/docs/apps/build/marketing-analytics/pixels
- [std-events] https://shopify.dev/docs/api/web-pixels-api/standard-events (+ `/checkout_completed`, `/product_added_to_cart`, `/product_viewed`, `/collection_viewed`, `/search_submitted`, `/cart_viewed`)
- [ev-completed] https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed
- [emitting] https://shopify.dev/docs/api/web-pixels-api/emitting-data
- [analytics-api] https://shopify.dev/docs/api/web-pixels-api/standard-api/analytics
- [cp-api] https://shopify.dev/docs/api/web-pixels-api/standard-api/customerprivacy
- [pixel-privacy] https://shopify.dev/docs/api/web-pixels-api/pixel-privacy
- [customer-privacy] https://shopify.dev/docs/api/customer-privacy
- [storefront-events] https://shopify.dev/docs/storefronts/themes/best-practices/standard-events-and-actions
- [storefront-events-changelog] https://shopify.dev/changelog/standard-storefront-events-and-actions
- [pixels-overview] https://help.shopify.com/en/manual/promoting-marketing/pixels/overview
- [custom-pixels] https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels
- [cp-manage] https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/manage
- [cp-code] https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/code
- [cp-testing] https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/testing
- [privacy-settings] https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings
- [upgrade-typ] https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations/upgrade-thank-you-order-status
- [test-orders] https://help.shopify.com/en/manual/checkout-settings/test-orders
- [ga4-setup] https://help.shopify.com/en/manual/reports-and-analytics/google-analytics/google-analytics-setup
- [gtm] https://help.shopify.com/en/manual/reports-and-analytics/google-analytics/google-tag-manager
- [meta-data-sharing] https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing
- [meta-pixel-help] https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-pixel
- [app-google] https://apps.shopify.com/google
- [google-tag-shopify] https://support.google.com/analytics/answer/12183125
- [ga4-dedup] https://support.google.com/analytics/answer/12313109
- [ga4-events] https://developers.google.com/analytics/devguides/collection/ga4/reference/events
- [ga4-config] https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- [consent-mode] https://developers.google.com/tag-platform/security/guides/consent
- [meta-ref] https://developers.facebook.com/docs/meta-pixel/reference
- [meta-advanced] https://developers.facebook.com/docs/meta-pixel/advanced/
- [meta-gdpr] https://developers.facebook.com/docs/meta-pixel/implementation/gdpr
- [meta-dedup] https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events
- [dev-stores] https://shopify.dev/docs/apps/build/dev-dashboard/development-stores (agregada en la verificación adversarial)
