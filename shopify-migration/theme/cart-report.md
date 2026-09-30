# Cart + Cart Drawer — Fase 02I

Modelo: **Opus 5.5** (`claude-opus-5-5`). Inicio 12:06, fin de validación 12:35 (2026-09-28).

## 1. Carrito real auditado (lectura directa del código)

| Archivo | Qué hace hoy |
|---|---|
| `components/cart-drawer/cart-drawer.tsx` | Drawer (Headless UI `Dialog`): panel derecho, `w-full md:w-[400px]`, `p-6`, `bg-white/95 backdrop-blur-xl`, fondo `bg-black/40`; entra en 300 ms, sale en 200 ms. Contiene "Tu carrito" + X ("Cerrar carrito"), la barra de envío gratis, las líneas y el pie. |
| `components/cart-drawer/cart-store.tsx` (+ 2 tests) | Estado del carrito (contexto React). |
| `components/layout/navbar/index.tsx` | Botón `aria-label="Carrito"` → `openCart()`. El badge es la **suma de cantidades** y se oculta en 0. |
| `components/layout/navbar/mobile-menu.tsx` | "Carrito" / "Carrito (n)": cierra el menú y abre el drawer. |
| `components/product-detail/product-variant-picker.tsx` | Es el **único** lugar que añade al carrito: `addItem(product, talla, 1)`. |
| `components/checkout/checkout-content.tsx` | Checkout propio, con cupón, WhatsApp y Wompi (ver § 12–14). |
| `components/cart/modal.tsx` | **Código muerto** del template de Vercel Commerce: ningún archivo lo importa. |

Detalle del comportamiento real:

- **Persistencia:** Postgres vía Prisma, no localStorage (los comentarios del código están desactualizados).
  - Con sesión: un `Cart` por cuenta.
  - Invitada: cookie `lago-cart-id`, 180 días.
  - Cada guardado reemplaza el carrito entero.
  - Guardados limitados a 100 cada 15 min; los que superan el límite se descartan en silencio.
  - Al iniciar sesión, el carrito de invitada se suma al de la cuenta.
- **Línea:** `productId-talla`. Solo se guardan producto, talla y cantidad; el precio se lee siempre en vivo.
- **Operaciones:**
  - `addItem` suma si la línea existe y **siempre abre el drawer**.
  - `updateQuantity(q<=0)` quita la línea.
  - Todo es **optimista, sin rollback ni manejo de errores**.
- **Límites:** ninguno en el carrito. No hay tope por línea ni control de stock al tocar "+". Los límites aparecen recién al pagar: 20 por línea, 40 líneas, "…ya no tiene stock suficiente".
- **Validación contra el catálogo:** solo quita productos borrados o desactivados, en silencio. Una talla agotada no se detecta en el carrito.
- **Drawer:**
  - Foto 64×80, nombre con link, "Talla M", píldora `- N +` (botones de 24 px, cantidad como texto) y total de línea.
  - X gris "Quitar producto".
  - "Subtotal", "El envío se confirma en el checkout." y el botón "Finalizar compra" (nude con texto blanco, hover negro).
  - Vacío: "Tu carrito está vacío" + "Descubrí la colección y agregá tus favoritos.", sin botón.
- **Envío gratis:** umbral `Settings.freeShippingThreshold` (configurable desde el admin, default 299900 = $299.900). Mensajes: "Te faltan $X para envío gratis" + barra, o "✓ Tu pedido ya tiene envío gratis".
- **Analytics:** `view_cart` (una vez por apertura), `add_to_cart` (store y "+"), `remove_from_cart` ("−" y X) y `begin_checkout`.
- **Nota de pedido y propiedades de línea:** no existen. Lo más parecido son "Indicaciones adicionales de entrega" y "Casa, apto, oficina", que viven en la dirección del checkout.
- **Tarjeta de producto y header:** la tarjeta no tiene añadir rápido (no se inventa Quick Add); el header solo abre el drawer.

## 2. Arquitectura elegida

Liquid renderiza el HTML inicial, la **Ajax Cart API** hace las mutaciones y la **Section Rendering API** devuelve el HTML nuevo. Es una sola estrategia, sin dos fuentes de markup.

| Archivo | Rol |
|---|---|
| `sections/cart-drawer.liquid` | Drawer: `<cart-drawer>` + `<dialog>` + `[data-cart-body]`. Se incluye en `layout/theme.liquid` con `{% section 'cart-drawer' %}` (id estable `cart-drawer`), salvo en la página de carrito o con el drawer apagado. |
| `sections/main-cart.liquid` | Página `/cart` (`<cart-items>`). |
| `snippets/cart-line-item.liquid` | Línea, compartida por drawer y página. |
| `snippets/cart-summary.liquid` | Descuentos nativos, subtotal, nota y CTA de checkout (compartido). |
| `snippets/cart-free-shipping.liquid` | Progreso de envío gratis (compartido, apagado por defecto). |
| `assets/cart.js` | Cola de requests, render de secciones, drawer, página, contador del header y hook de la PDP. |
| `assets/component-cart.css` | Estilos de drawer, línea, resumen y página. |

**Por qué Section Rendering y no DOM local:**

- Cada `/cart/add.js` y `/cart/change.js` pide en **la misma request** el HTML ya renderizado de las secciones visibles, así que es 1 request por acción y no hay fetch extra.
- El markup existe una sola vez, en Liquid. No hay plantillas en JS que se desincronicen.
- Shopify formatea precios, descuentos y moneda con `money`. **Cero cálculos de dinero en JS** (sin floats).
- JS solo reemplaza `[data-cart-body]`. El `<dialog>`, la región `aria-live` y el foco se conservan.

No se crearon `cart-drawer.js`, `section-cart.css` ni `cart-empty.liquid`: habrían sido archivos triviales (el vacío son 4 líneas dentro de cada sección).

## 3. Drawer

- **Apertura:** desde el ícono del header, desde el link "Carrito" del menú mobile (cierra el menú, como el real) y después de añadir desde la PDP.
- **Base:** `<dialog>` nativo con `showModal()`. El navegador resuelve foco contenido, fondo inerte (también para lectores de pantalla, no solo Tab), top layer y Escape.
  - Escape y los botones cierran con animación: el `cancel` nativo se cancela y se cierra a los 200 ms.
  - Con `prefers-reduced-motion` el cierre es inmediato.
- **Cierre:** botón X (`autofocus`, recibe el foco inicial como en Headless UI), clic en el fondo y Escape.
- **Foco al cerrar:** vuelve a quien abrió. Si ya no se ve (el link del menú mobile ya cerrado), va al ícono del header.
- **Bloqueo de scroll:** `:root:has(dialog[open]) { overflow: hidden }`, movido de `section-product.css` a `base.css` porque el drawer existe en todas las páginas.
- **Semántica:** `aria-labelledby` apunta al título. Al link del header se le agregan por JS `aria-haspopup="dialog"`, `aria-controls="CartDrawer"` y `aria-expanded` (sincronizado); sin JS sigue siendo un link común a `/cart`.
- **Tamaño:** mobile a pantalla completa, 400 px desde 768; `height: 100dvh`; `padding-bottom` con `env(safe-area-inset-bottom)`.
  - No se agregó `viewport-fit=cover` al meta global: afectaría el layout de todo el sitio. Sin él, `env()` vale 0 en Safari común y actúa en modo standalone.
- **Carga:** 0 fetch al abrir si el contenido está al día. Si la pestaña estuvo oculta (otra pestaña pudo cambiar el carrito) o se volvió con "atrás" (bfcache), abrir hace 1 GET de re-sincronización.

## 4. Página de carrito

El sitio real no tiene página de carrito. En Shopify `/cart` existe siempre y es el destino sin JS o con el drawer apagado, así que **reusa los mismos snippets** del drawer, en una columna en mobile y dos (lista + resumen sticky) desde 1024 px. Incluye h1 "Tu carrito" y "Seguir comprando" (setting de URL). El vacío tiene botón "Seguir comprando", porque la página sin salida sería un callejón.

**Sin JS funciona completo con el form nativo:**

- El input es `name="updates[]"`.
- "Actualizar carrito" vive dentro de `<noscript>`.
- La X es un link a `item.url_to_remove`.
- "Finalizar compra" es `name="checkout"`.
- Los +/− se ocultan con `cart-items:not(:defined)` (visibility, sin mover el layout).

## 5. Integración con la PDP (02H)

`product-form.js` ya emitía `product:add-to-cart` (cancelable). Se amplió el contrato de forma retrocompatible:

- `detail.form`: el `<form>` nativo.
- `detail.respondWith(promise)`: quien cancela entrega la promesa del alta AJAX. El botón queda en "Añadiendo…" (`aria-busy`) hasta que resuelva; si falla, el mensaje aparece en la alerta de la ficha (`role="alert"`).

`cart.js` escucha el evento **solo si existe el drawer**. Hace `preventDefault()`, toma `FormData(form)` (los mismos campos que el envío nativo), hace `POST /cart/add.js` con `sections`, re-renderiza, abre el drawer y **no navega**. Sin drawer, sin JS o sin `respondWith` (contrato viejo), sigue el envío nativo `/cart/add` → `/cart`.

## 6. Ajax Cart API y cambios de cantidad

| Acción | Request | Nota |
|---|---|---|
| Añadir | `POST /cart/add.js` (FormData + `sections`) | 1 request |
| +, −, input, quitar | `POST /cart/change.js` `{ id: line.key, quantity, sections }` | 1 request; quitar = `quantity: 0` |
| Re-sincronizar con drawer/página | `GET <ruta>?sections=…` | Solo con pestaña desactualizada o bfcache |
| Re-sincronizar sin drawer ni página | `GET /cart.js` | Solo al volver por bfcache (contador del header) |
| `/cart/update.js` | No se usa | Se indexa por variant id, ambiguo si la misma variante está en dos líneas; `change.js` por `key` es atómico por línea |

- Se usa la **key** de la línea, no el índice: sigue siendo válida aunque se quite otra línea antes.
- La cantidad es absoluta (idempotente).
- Enter en el input confirma la cantidad; en la página, sin esto enviaría el form al checkout.
- Un valor inválido o negativo vuelve al último confirmado.
- La respuesta de Shopify es la fuente de verdad. Lo único optimista es el número del input, que vuelve atrás si falla.

## 7. Carreras, carga y errores

- **Cola serial:** nunca hay dos mutaciones a la vez, así que una respuesta vieja no puede pisar una nueva. Por ejemplo, "quitar B" mientras "+A" está pendiente se ejecuta después.
- **Anti doble clic:** una línea con request pendiente tiene `aria-busy="true"`, controles `aria-disabled`, input `readOnly` y opacidad 0.6, e ignora nuevos clics. El botón de compra de la PDP ya bloqueaba el doble envío (`isSubmitting`).
- **Timeout:** 15 s con `AbortController`, para que una request colgada no bloquee la cola.
- **Errores** (claros, no técnicos, en la línea + región `role="status"`):

  | Caso | Mensaje |
  |---|---|
  | 422 de Shopify (stock/cantidad) | El texto de Shopify, pensado para la clienta y en el idioma de la tienda |
  | Red o timeout | "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo." |
  | Otros | "No pudimos actualizar tu carrito. Intentá de nuevo." |
  | Alta fallida o variante inválida | "No pudimos añadir el producto. Intentá de nuevo.", en la ficha |
  | Shopify deja menos de lo pedido (recorte silencioso de `change.js` por stock) | "Cantidad máxima disponible para este producto: N." |

- **Sección faltante:** si Shopify no pudo renderizar una sección, se pide de nuevo por GET, una sola vez.

## 8. Subtotal, descuentos y contador

- **Subtotal:** `cart.total_price | money` (después de descuentos, antes de envío), con el mismo rótulo "Subtotal" del real, en un `<dl>`.
- **Línea:** `final_line_price`. Si Shopify aplicó un descuento de línea, se muestra `original_line_price` tachado y cada `line_level_discount_allocations` ("Título: -$X").
- **Descuentos de carrito:** `cart_level_discount_applications` en el resumen.
- **Compare-at de la variante:** setting `cart_show_compare_at`, apagado por defecto (el real no lo muestra).
- **No se porta la cascada de descuentos del backend Next.** Si se quiere replicar, se recrea como descuentos automáticos de Shopify, que este carrito ya muestra solo.
- **Contador:** un único contrato, el evento global `cart:updated`, que actualiza todos los `[data-cart-count]` y oculta los `[data-cart-count-bubble]` en 0:
  - badge del header, ahora `aria-hidden` porque el número ya está en el texto oculto "Carrito (n)";
  - texto oculto del link;
  - "Carrito (n)" del menú mobile.

  La cantidad sale del JSON del carrito o del `data-cart-item-count` de la sección renderizada: nunca un fetch extra.

## 9. Envío gratis

- **En el real:** umbral de negocio configurable ($299.900) en `Settings`.
- **En Shopify:** el envío gratis es una **tarifa de envío** o un descuento de envío, que el theme no puede leer.
- **Decisión:**
  - Se portó la barra/mensaje EXACT como `snippets/cart-free-shipping.liquid`, **apagada por defecto** (`cart_free_shipping_progress`).
  - Se enciende cuando Daniela configure en Shopify una tarifa gratis con el mismo umbral.
  - Solo se muestra con la moneda base de la tienda: con otra moneda no hay una tasa confiable para convertir el umbral.
  - Todo el cálculo lo hace Liquid con centavos enteros.
- **Setting `free_shipping_threshold`:** ahora documentado en pesos enteros. Se eliminó `free_shipping_message`, que no se usaba en ningún archivo; el texto ahora es traducible en locales.
- **Corrección cruzada (bug de 02E/02H):** el banner promocional y la ficha hacían `settings.free_shipping_threshold | money` sobre 299900. `money` espera centavos, así que mostraban **$2.999** en vez de $299.900. Se corrigió a `| times: 100 | money` en `promo-banner.liquid` y `main-product.liquid`.
  - Pendiente de decisión: esos dos textos siguen encendidos por defecto (copian el texto real). Conviene apagarlos o confirmarlos cuando se configure el envío en Shopify.

## 10. Stock / reserva

**Estar en el carrito no reserva inventario.**

- **En el real:** el checkout propio reserva stock de forma atómica antes de pagar (`reserveAndPriceCheckout`, decremento por talla, todo o nada; 30 min en Wompi, se libera al fallar o abandonar).
- **En Shopify:** el carrito no reserva nada. El stock se valida al añadir (422 si no alcanza), al cambiar cantidad (Shopify recorta al disponible y el theme lo avisa) y en el checkout; el inventario se descuenta al crear el pedido.
- **Qué NO se recreó:** reserve-before-pay, locks de pedido, reserva por pago ni conciliación con Wompi.
- **Qué NO se muestra:** el carrito no muestra stock ni promete disponibilidad.

## 11. CTA de checkout

`<button type="submit" name="checkout">` dentro de `{% form 'cart' %}` (`POST /cart`), el patrón nativo: Shopify redirige al checkout. Funciona sin JS. Dispara `cart:begin-checkout`. No se configuraron pagos, Wompi, personalización de checkout, supuestos de Shopify Plus ni botones de pago acelerado (`content_for_additional_checkout_buttons`): quedan para la fase de checkout.

## 12. WhatsApp / pago custom (solo documentado, no construido)

- **Hoy:** el checkout propio tiene un selector "Pagar online" / "Continuar por WhatsApp". El segundo crea un pedido "Pendiente de pago" con stock reservado, vacía el carrito y abre wa.me con el detalle del pedido.
- **En Shopify:** eso no existe dentro del checkout nativo. Alternativas futuras, a decidir:
  - **(a)** Un método de pago manual ("Coordinar pago por WhatsApp") configurado en Shopify: crea el pedido pendiente de forma nativa.
  - **(b)** Un CTA secundario informativo en el carrito ("¿Dudas? Escribinos") que no crea pedido.

  Ninguna se construyó en 02I.
- **Cupón:** en el real está solo en el checkout. En Shopify los códigos se aplican en el checkout nativo, que es el equivalente. **No hay campo de cupón en el carrito** y nunca se finge un cupón aplicado.

## 13. Accesibilidad

- **Drawer:** `<dialog>` modal con nombre (`aria-labelledby`), foco inicial en "Cerrar carrito", Tab/Shift+Tab contenidos (verificado: 14 Tab + 3 Shift+Tab sin salir), Escape, foco devuelto, fondo inerte.
- **Nombres por producto:** "Quitar {producto} del carrito", "Restar/Sumar cantidad de {producto}", "Cantidad de {producto}". El real repite "Quitar producto" en cada línea.
- **Contraste:** la foto tiene `alt=""` (el nombre está al lado). La X usa #737373 (el real, #a3a3a3 = 2.5:1). "Finalizar compra" usa texto #171717 sobre nude = **10.6:1** (el real, blanco sobre nude = **1.7:1**, no pasa AA).
- **Anuncios:** región `role="status"` fuera del contenido que se re-renderiza: "Carrito actualizado. Subtotal: $X", "Tu carrito está vacío" o el error. Cargando = `aria-busy` en la línea.
- **Foco tras re-render:** vuelve al mismo control de la misma línea (`data-focus-id`). Si la línea desapareció, va al título.
- **Tamaños táctiles:** X de cerrar 44 px, +/− 36 px (el real 24 px), quitar 32 px; `:focus-visible` global.
- **Input en táctiles:** 16 px (evita el zoom de iOS).
- **Hover del CTA:** solo con `(hover: hover)`, porque en táctil quedaba "pegado".
- **Movimiento:** la regla global de `base.css` anula las transiciones con reduced-motion, y el JS cierra sin esperar.

## 14. Responsive (medido en el harness)

| Ancho | Drawer | Página |
|---|---|---|
| 320 | 320 px (completo), sin desborde, pie visible | 1 columna, gutters 16 px, sin desborde |
| 375, 390, 430, 640 | Ancho completo, pie visible | 1 columna |
| 768 | 400 px a la derecha | 1 columna |
| 1024, 1280, 1440 | 400 px | 2 columnas (lista 2fr + resumen sticky); contenedor 1280 |

El título largo en 375 px ocupa 4 líneas sin empujar precio ni cantidad.

## 15. Performance

| Recurso | Sin comprimir | gzip | Nota |
|---|---|---|---|
| `cart.js` | 21.0 KB | 6.6 KB | Muchos comentarios |
| `component-cart.css` | 12.1 KB | 3.3 KB | |

- Ambos se cargan en todas las páginas, porque el drawer es global como en el real.
- **Requests:** añadir = 1; cambiar o quitar = 1; abrir = 0 (1 solo si está desactualizado); contador = 0 extra; sin polling.
- **Listeners por delegación:** 4 por vista (click/change/keydown/submit) + 3 del `<dialog>` + 3 en `document` + 2 globales. Ninguno por línea.
- **Render:** un solo `replaceChildren` del cuerpo por respuesta; sin lecturas de layout en bucle.
- **Animación:** solo `transform`/`opacity` en CSS.
- **Costo retenido:** `backdrop-filter: blur(24px)` es el mismo efecto del real, con `@supports` y fondo sólido de respaldo.

## 16. Settings del Theme Editor (grupo Cart)

| Setting | Default | Nota |
|---|---|---|
| `cart_drawer_enabled` | true | |
| `cart_drawer_heading` | vacío | Vacío = "Tu carrito" |
| `cart_empty_text` | vacío | Vacío = texto real |
| `cart_continue_url` | `/collections/all` | |
| `cart_show_compare_at` | false | |
| `cart_free_shipping_progress` | **false** | |
| `free_shipping_threshold` | 299900 | En pesos |

No se agregaron vendor ni nota: el sitio es monomarca y no tiene nota de pedido.

## 17. Nota y propiedades de línea

No existen en el real, así que no se inventan: no hay `cart[note]` ni `properties[]`. Las indicaciones de entrega del real son parte de la dirección, que en Shopify se piden en el checkout nativo.

## 18. Eventos (hooks neutros de analytics, sin IDs)

Todos en `document`:

| Evento | Detalle | Equivalente real |
|---|---|---|
| `cart:updated` | `{ itemCount, source, cart }` | Contrato del contador |
| `cart:opened` | `{ source: "trigger" \| "add" }` | `view_cart` |
| `cart:item-added` | `{ variantId, quantity, item }` | `add_to_cart` |
| `cart:quantity-changed` | `{ key, variantId, previousQuantity, quantity }` | |
| `cart:item-removed` | `{ key, variantId, previousQuantity }` | `remove_from_cart` |
| `cart:begin-checkout` | `{ itemCount }` | `begin_checkout` |
| `cart:error` | `{ source, message }` | |

API pública: `window.Radaelli.cart.{add, change, refresh}`, para un futuro Quick Add sin reescribir nada.

## 19. Verificación

- **Theme Check:** 0 errores / 0 warnings (53 archivos). `node --check` OK en los 10 JS. Los 15 JSON son válidos.
- **Escaneo:** secrets, dominios y IDs de tienda = 0; referencias funcionales a Next/React/Prisma/Neon/Wompi/Vercel/Cloudinary = 0; sin teléfonos ni emails nuevos.

**Harness aislado:**

- **Montaje:**
  - Servidor Node propio en el scratchpad, solo `127.0.0.1:4174`, fuera del repo.
  - Simula `/cart/add.js`, `/cart/change.js`, `/cart.js`, Section Rendering, el flujo nativo `/cart/add`, `/cart` y `/cart/change`, y permite inyectar fallas (422/500/latencia).
  - Sirve los CSS/JS **reales** del theme.
  - El HTML de las secciones es un espejo a mano de los `.liquid`; el Liquid en sí lo valida Theme Check.
- **Aislamiento:**
  - Se abrió el navegador en modo URL: **no se ejecutó ninguna launch config** y `launch.json` quedó sin cambios.
  - El dev server de Next nunca corrió (puerto 3000 verificado cerrado).
  - 0 bases de datos tocadas.
  - Servidor detenido al terminar.

**Resultado: 20/20 PASS, con clics, teclado y toques reales donde importa.**

| # | Prueba | Resultado |
|---|---|---|
| 1 | Abrir | `:modal`, foco en X, `aria-expanded`, 400 px, scroll bloqueado |
| 2 | Botón cerrar | Cierra |
| 3 | Fondo | Cierra |
| 4 | Escape | Cierra |
| 5 | Foco al cerrar | Vuelve al ícono (también en mobile, vía fallback) |
| 6 | Añadir | 1 request, "Añadiendo…", abre sin navegar, contador 1 |
| 7 | Error al añadir | 422 → alerta en la ficha, sin drawer; variante inválida → mensaje genérico |
| 8 | + | Cantidad, total de línea y foco conservado |
| 9 | − | |
| 10 | Quitar | |
| 11 | Vacío | Texto real, foco al título |
| 12 | Subtotal | Se actualiza |
| 13 | Contador | Badge + texto oculto + menú mobile |
| 14 | Doble clic real / 3 clics | 1 sola request |
| 15 | Rechazo | Recorte por stock → "Cantidad máxima… 3"; 422 → rollback de 2 a 3 + mensaje; 500 → mensaje genérico; reintento limpia el error |
| 16 | Red caída | Rollback + mensaje de conexión |
| 17 | Reduced-motion | Cierre inmediato con estado consistente + regla CSS global |
| 18 | Mobile 375×812 | Link del menú → cierra menú y abre drawer a pantalla completa, sin desborde, input de 16 px |
| 19 | Sin JS | Form nativo → `/cart`; "Actualizar carrito" con `updates[]`; X por link; vacío con "Seguir comprando" |
| 20 | CTA | `button[name=checkout]` en `POST /cart` → checkout + evento |

**Extras verificados:**

- "Quitar B" con "+A" pendiente (600 ms de latencia): 2 requests en serie, DOM = servidor.
- Doble envío del botón de compra: 1 request.
- Contención de Tab.
- Re-sincronización al abrir con pestaña desactualizada (1 GET) y abrir al día (0 requests).
- Barrido de 9 anchos.

**Límites honestos del harness:**

- No se pudo emular `prefers-reduced-motion` en el navegador de prueba: el JS se probó forzando `matchMedia` y el CSS por inspección de la regla.
- "Sin JS" se simuló sirviendo la página sin scripts y con el contenido de `<noscript>` visible: el navegador de prueba no permite apagar JavaScript.
- La falla de red se probó haciendo fallar `fetch`, igual que sin conexión. Cortar el socket desde el servidor no sirvió: Chrome reintentó solo el POST sobre la conexión keep-alive.
- El timeout de 15 s no se ejercitó: usa el mismo camino que la falla de red.

## 20. Divergencias inevitables o deliberadas

- **Página `/cart`:** existe en Shopify (el real no la tiene).
- **Cantidad editable:** input en lugar del texto del real (pedido por la fase).
- **Botones:** de 36 px en vez de 24 px.
- **Contraste:** 3 correcciones (CTA, X, badge `aria-hidden`).
- **Añadir:** abre el drawer después de la respuesta del servidor, no antes (el real es optimista sin rollback).
- **Contador:** suma de cantidades (`item_count`), igual que el real.
- **Stock:** Shopify valida stock al añadir y cambiar; el real solo al pagar. Es una mejora, y puede mostrar el mensaje de cantidad máxima.
- **Envío gratis:** apagado por defecto (en el real está siempre encendido).
- **Sin cupón, WhatsApp ni reserva de stock:** ver § 10–12.

## 21. Fidelidad visual estimada

**~92%** en el drawer: estructura, medidas, textos, animaciones y colores EXACT, salvo el contraste corregido del CTA y la X, y los botones de cantidad más grandes. La página de carrito no tiene referencia real: reusa el mismo lenguaje visual.

## 22. Dependencias para fases siguientes

- **Checkout/pagos:** Shopify Payments o Wompi, botones acelerados y método manual de WhatsApp si se decide la opción (a) del § 12.
- **Envío:** configurar la tarifa gratis de $299.900 en Shopify; recién ahí encender `cart_free_shipping_progress` y confirmar los textos del banner y la ficha.
- **Descuentos:** si se quiere la cascada del real, recrearla como descuentos automáticos. El carrito ya los muestra.
- **Quick Add:** no existe en el real; si se decide, `window.Radaelli.cart.add()` ya está.
- **Analytics real (GA4/Meta):** conectar a los eventos `cart:*`.
