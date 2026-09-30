# 03K — Verificación exacta de analítica en la tienda final

*Complementa `03E-analytics-plan.md` (§ 4 mapa de eventos, § 6 consentimiento, § 7 deduplicación) y `03F-analytics-owner-runbook.md` (§ 8 checklists, § 10 compra). No conecta ninguna cuenta ni crea ninguna herramienta de pago: nada de esto se ejecuta hasta que existan la tienda final pública y las cuentas de la dueña. Ningún ID va en este documento.*

## 1. Cuándo y con qué

- **Dónde:** la tienda final, **ya pública** (con contraseña, GA4 no registra y la app de Meta no se puede terminar; `03F` § 2).
- **Con qué:** GA4 DebugView (Admin > DebugView), Meta Events Manager > Probar eventos, y en Shopify Admin > Configuración > Eventos de cliente (bitácora del píxel). Sesión con país CO y consentimiento aceptado en el banner cuando exista.
- **Quién:** la dueña conecta las apps oficiales (OAuth) y entrega IDs; Claude corre los recorridos y anota el resultado sin tokens ni datos personales.
- **Estado del custom pixel** (`analytics/custom-pixel/`): **apagado** (`ENABLED: false`, IDs vacíos). `node --test analytics/custom-pixel/test/event-map.test.mjs` = 55/55 en la verificación de 03K. Solo se enciende si la dueña lo decide.

## 2. Matriz de verificación por evento

Cada fila: se hace la **Acción** en la tienda, se abre la **Herramienta**, y se comprueba el **Criterio PASS**. «App» = app oficial de Google o de Meta; «pixel» = custom pixel (apagado por defecto).

| # | Paso | Evento Shopify | GA4 | Meta | Acción de prueba | Herramienta | Criterio PASS | Lo manda |
|---|---|---|---|---|---|---|---|---|
| V1 | Visita | `page_viewed` | `page_view` | `PageView` | Abrir la Home con `?utm_source=prueba` | GA4 DebugView + Meta Test Events | 1 evento por carga; `page_location` sin parámetros sensibles (`gclid`, `fbclid` saneados) | App |
| V2 | Colección | `collection_viewed` | `view_item_list` | — | Abrir `/collections/oasis-natural` | DebugView | `item_list_name` = la colección; ≤ 20 `items` con `item_id` y `price` | App |
| V3 | Búsqueda | `search_submitted` | `search` | `Search` | Buscar «bikini» | DebugView + Test Events | `search_term` = `bikini`, sin datos personales | App |
| V4 | **Ficha de producto** | `product_viewed` | `view_item` | `ViewContent` | Abrir una ficha (p. ej. `marea-natural`) | DebugView + Test Events | `currency` = COP, `value` = precio de venta, `items[0].item_id` presente | App |
| V5 | **Añadir al carrito** | `product_added_to_cart` | `add_to_cart` | `AddToCart` | Elegir talla y «Añadir al carrito» (drawer abierto) | DebugView + Test Events | `value` = costo de la línea; `quantity` correcta; **un** solo evento (sin doble por el drawer) | App |
| V6 | Quitar del carrito | `product_removed_from_cart` | `remove_from_cart` | — | Quitar la línea | DebugView | `remove_from_cart` con la misma variante | App |
| V7 | Ver carrito | `cart_viewed` | `view_cart` | — | Abrir `/cart` | DebugView | `value` = subtotal | App |
| V8 | **Inicio de checkout** | `checkout_started` | `begin_checkout` | `InitiateCheckout` | «Pagar» desde el carrito | DebugView + Test Events | `value` = subtotal; `num_items` = unidades | App |
| V9 | Pago | `payment_info_submitted` | `add_payment_info` | `AddPaymentInfo` | Llegar al paso de pago con Wompi en modo prueba | DebugView + Test Events | evento presente al confirmar el método | App |
| V10 | **Compra** | `checkout_completed` | `purchase` | `Purchase` | Pedido de prueba pagado (tarjeta de prueba que escribe la dueña) | DebugView + Test Events + Admin > Pedidos | `transaction_id` = id del pedido; `value` = total; `currency` = COP; **una** sola vez aunque se recargue la página de agradecimiento; `eventID` de deduplicación igual entre navegador y servidor si hay ambos | App (+ servidor si se decide) |
| V11 | Favoritos: agregar | `radaelli:wishlist_add` | `add_to_wishlist` | `AddToWishlist` | Corazón en una ficha | DebugView + Test Events | evento con `item_id` del producto | Pixel |
| V12 | Favoritos: quitar | `radaelli:wishlist_remove` | `remove_from_wishlist` | `RemoveFromWishlist` (custom) | Quitar en `/pages/favoritos` | DebugView | `remove_source` presente | Pixel |
| V13 | Favoritos: ver | `radaelli:wishlist_viewed` | `view_wishlist` | — | Abrir `/pages/favoritos` | DebugView | `wishlist_count` = número de ítems | Pixel |
| V14 | Cuenta (favoritos de cuenta) | — (estado, no evento) | — | — | Con la app de favoritos instalada: agregar un favorito con sesión y abrirlo en otro navegador | Storefront + Admin > cliente > metafield `custom.wishlist` | mismo producto en ambos navegadores; sin evento de analítica nuevo | App de favoritos |
| V15 | Sin resultados | `radaelli:search_no_results` | `search_no_results` | — | Buscar «zzzzzz» | DebugView | `search_term` presente, `search_source` = `page` o `predictive` | Pixel |

**Eventos de cuenta (inicio de sesión, registro):** el mapa de 03E no incluye ninguno y Shopify no ofrece un evento estándar equivalente en el mapa; se clasifican `OPTIONAL/DEFERRABLE` y no se inventan.

## 3. Controles transversales

| # | Control | Cómo | Criterio PASS |
|---|---|---|---|
| T1 | Sin doble disparo | Recorrido V4 → V10 con GA4 DebugView y la bitácora de Eventos de cliente | 0 eventos duplicados por acción (`03F` § 9) |
| T2 | Consentimiento | Con el banner: rechazar y repetir V4 y V5; aceptar y repetir | Rechazado: sin eventos de marketing de Meta y GA4 en modo consentimiento denegado; aceptado: eventos completos (`03E` § 6) |
| T3 | Sin datos personales | Revisar el payload de V1, V3, V8 y V10 | Sin correo, teléfono, dirección ni nombre; la lista blanca anti-PII del custom pixel cubre los custom (`03E` § 9) |
| T4 | Moneda y país | Repetir V10 con la sesión en CO | `currency` = COP en todos los eventos con `value` |
| T5 | Dedup navegador/servidor | Solo si hay Conversions API | mismo `eventID` en `Purchase` (`03E` § 7) |

## 4. Resultado que se anota

Una fila por evento: `PASS`, `FAIL` (con el parámetro que no coincide) o `NO APLICA` (evento del custom pixel apagado). El resultado se guarda en `launch/evidence/` **sin** IDs de medición, tokens ni capturas con datos personales.

## 5. Rollback

Quitar las apps de Google y Meta o apagar el pixel (`03F` § 16). Ninguna verificación de este documento modifica datos de clientes ni pedidos reales.
