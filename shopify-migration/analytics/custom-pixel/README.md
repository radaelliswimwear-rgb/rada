# Custom pixel de Radaelli (Fase 03E)

- **Estado:** esqueleto **apagado** (`ENABLED: false`, IDs vacíos). No está instalado en ninguna tienda.
- **Qué hace:** cubre los **huecos** que no cubren las apps oficiales de Google y Meta:
  - favoritos: agregar, quitar y ver;
  - búsqueda sin resultados y sugerencia elegida;
  - talla elegida;
  - apertura del cart drawer y errores del carrito;
  - pasos de contacto y dirección del checkout.
- **Modo `full` (alternativa):** manda todo el embudo. Solo sirve si la dueña decide **no** instalar las apps oficiales.
- **Plan completo:** [`../03E-analytics-plan.md`](../03E-analytics-plan.md).

## Archivos

| Archivo | Qué es |
|---|---|
| `radaelli-pixel.js` | El código que se pega en Shopify. Trae el bloque `CONFIG`, una **copia exacta** de `event-map.js` entre marcadores y el runtime. |
| `event-map.js` | Mapa puro Shopify → GA4 / Meta: sin DOM, sin red y sin estado. Incluye la lista blanca anti-PII, el `event_id` de deduplicación, la matriz de consentimiento y el puente propuesto para el theme. |
| `test/event-map.test.mjs` | 55 tests `node:test`. Cargan los dos archivos como script clásico en `node:vm`, igual que el sandbox lax, con mocks de `analytics`, `customerPrivacy` (suelto o como `api.customerPrivacy`), `browser.cookie` y `document`. |

```
node --test analytics/custom-pixel/test/event-map.test.mjs
```

- **Resultado (2026-09-29, tras la verificación adversarial):** 55/55 pass, 12 suites, en Node v24.19.0. En Node 24, `node --test <carpeta>` falla: hay que pasar el archivo.
- **Mutantes:** además se corrieron 19 mutantes temporales en el scratchpad (no quedan en el repo): los 17 del productor más 2 de la verificación (`api.customerPrivacy` y nombre del custom event). Los 19 fueron detectados.
- **Si se edita `event-map.js`:** hay que volver a copiarlo dentro de `radaelli-pixel.js`, entre `/* BEGIN event-map.js */` y `/* END event-map.js */`. Si las dos copias difieren, el test falla.

## Garantías que prueban los tests

- **Apagado de fábrica:**
  - con `ENABLED: false` no se suscribe a nada ni carga scripts, aunque haya IDs válidos y consentimiento total;
  - con IDs vacíos o de relleno (`G-XXXXXXXXXX`, ceros) tampoco.
- **Consentimiento, que falla cerrado:**
  - GA4 exige `analyticsProcessingAllowed`;
  - Meta exige `marketingAllowed` **y** `saleOfDataAllowed`;
  - sin dato no se envía nada;
  - la cookie `_ga` no se lee antes del consentimiento;
  - los cambios se escuchan con `api.customerPrivacy.subscribe('visitorConsentCollected', …)`, la forma del ejemplo oficial para custom pixels (o con la variable suelta `customerPrivacy`, si existe);
  - al revocar: Meta recibe `fbq('consent','revoke')`, GA4 recibe `gtag('consent','update',…)`, y ya no se envía nada más.
- **Sin PII:**
  - nunca salen email, teléfono, nombre, dirección, id de cliente ni token de checkout;
  - las URLs pasan por una lista blanca: `utm_*`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `variant`, `sort_by`, `page` y `filter.*`;
  - las rutas de checkout, pedidos y cuenta van con `:token`;
  - los términos de búsqueda con email o con 7 o más dígitos se mandan como `[redacted]`.
- **Deduplicación:**
  - `event_id` estable por checkout: hash del token, que nunca sale crudo;
  - en la compra, `purchase:<id numérico del pedido>`, el mismo formato que `lib/analytics/purchase-event-id.ts:7-9` del sitio Next.js;
  - sin id de pedido no se manda `purchase`, porque GA4 deduplica juntos todos los `transaction_id` vacíos.
- **Dueño por evento:** en `gaps_only`, ningún evento del embudo que ya mandan las apps oficiales sale de este pixel.

## Instalación: SOLO la dueña (owner-only)

Claude no instala, no conecta y no escribe IDs. Cada paso lo hace Daniela en su Admin.

### 0. Antes de tocar nada

- [ ] Leer `../03E-analytics-plan.md` § 11 y decidir la **opción A**: apps oficiales + este pixel en `gaps_only`, que es la recomendada.
- [ ] **Banner de cookies con Colombia incluida:** Configuración > Privacidad del cliente > Banner de cookies (en inglés: *Settings > Customer privacy > Cookie banner*; la etiqueta en español no se verificó).
  - Quitar los ajustes automáticos y agregar la región.
  - Motivo: por defecto Shopify solo lo activa en UK y EEE. Sin banner, el consentimiento se asume "permitido", y eso contradice la política de cookies actual.
- [ ] **Actualizar la Política de cookies y la de Privacidad** antes de encender cualquier pixel. Hoy dicen "Hoy no las usamos" (`../../content/legal/cookies.html`).
- [ ] Resolver C1 y C2 de `../../theme/03E-checkout-baseline-report.md`: mercado principal Colombia y zona de envío Colombia. Sin eso, un visitante de Colombia no puede agregar al carrito y el embudo mide cero.
- [ ] **Elegir la tienda correcta:** si la Dev Store es una dev store de Shopify, no se le puede quitar la contraseña ni convertirla en tienda de producción (plan § 2.1 y § 11). Los pixels definitivos van en la tienda de producción; en la Dev Store, solo QA.

### 1. Conseguir los IDs (nunca inventarlos)

- **GA4:** crear la propiedad y el flujo web en Google Analytics, y copiar el **ID de medición** (empieza con `G-`).
- **Meta:** en el Administrador de eventos, copiar el **ID del dataset/píxel**, que es solo dígitos.
  - Si se instala la app Facebook & Instagram, usar **el mismo** que conecta la app.

### 2. Crear el pixel (uno por destino, recomendado)

Configuración > Eventos de clientes > **Agregar píxel personalizado** (en inglés: *Settings > Customer events > Add custom pixel*).

| Pixel | Nombre sugerido | Permiso del cliente | Venta de datos | CONFIG |
|---|---|---|---|---|
| GA4 | `Radaelli GA4 (huecos)` | **Obligatorio** → Análisis | según la política de la dueña | solo `GA4_MEASUREMENT_ID` |
| Meta | `Radaelli Meta (huecos)` | **Obligatorio** → Marketing | respetar el opt-out | solo `META_PIXEL_ID` |

Pasos:

1. Pegar `radaelli-pixel.js` **completo** en la ventana Código.
2. Editar solo el bloque `CONFIG`:
   - `ENABLED: true`;
   - el ID de ese pixel;
   - `MODE: "gaps_only"`.
3. **Guardar** sin conectar todavía.
4. Botón **Probar** (Pixel Helper):
   - navegar ficha → favoritos → carrito → checkout;
   - aceptar el banner;
   - revisar que los eventos lleguen en verde.
5. Recién entonces, **Conectar**.

Por qué dos pixels:

- Así Shopify aplica la compuerta de su categoría: Análisis para GA4 y Marketing para Meta.
- El código revisa lo mismo por segunda vez.
- Con un solo pixel marcado "Obligatorio" para Análisis y Marketing, GA4 se perdería para quien acepta solo análisis.

### 3. Lo que este pixel NO hace solo (requiere el puente del theme)

- **Los eventos `radaelli:*` no llegan todavía:** los publica el theme con `Shopify.analytics.publish`, y hoy el theme solo emite `CustomEvent` en `document`, que un pixel en sandbox no ve.
- **El puente es un cambio de theme:** es una fase futura con OK de la dueña. Está **propuesto, no aplicado**; ver abajo.
- **Sin puente,** en `gaps_only` solo salen `checkout_contact_info` y `checkout_address_info` a GA4.

### 4. Verificación después de conectar

- [ ] GA4 → DebugView: llegan los eventos y `page_location` va sin email, sin `q=` y sin token.
- [ ] Meta → eventos de prueba: `AddToWishlist` con `eventID`.
  - **Sin** `PageView` ni `Purchase` duplicados: esos los manda la app.
- [ ] Revocar el consentimiento desde el banner → los envíos se cortan.
- [ ] `checkout_completed`: requiere proveedor de pago o gateway de prueba (owner-only; hoy "no puede aceptar pagos").

## Puente propuesto (theme → Shopify.analytics.publish). NO APLICADO

- **Para qué:** fase futura con OK de la dueña.
- **Cómo:**
  - se suma `event-map.js` como asset del theme (define `window.RadaelliEventMap`);
  - se agrega este listener;
  - el theme no cambia nada más.
- **Contenido de los eventos:**
  - según las cabeceras de `cart.js:19-27`, `wishlist.js:51-56`, `search.js:18-23` y `product-form.js:14-16`, los `CustomEvent` del theme no llevan IDs de GA/Meta;
  - el término de búsqueda sí puede traer lo que tipeó la clienta, y `cart:error` trae un mensaje de texto;
  - por eso el puente filtra por lista blanca y limpia el término.

```js
// assets/analytics-bridge.js (PROPUESTA; no existe en theme-src)
const map = window.RadaelliEventMap;
if (map) {
  map.THEME_EVENT_INVENTORY.filter((entry) => entry.publish).forEach(({ type }) => {
    document.addEventListener(type, (event) => {
      const out = map.bridgeThemeEvent(type, event.detail, { productId: event.target?.dataset?.productId });
      if (out && window.Shopify?.analytics?.publish) window.Shopify.analytics.publish(out.name, out.data);
    });
  });
}
```

- **Conteo:** de los 20 `CustomEvent` inventariados, **8** se publican (uno por cada `radaelli:*`); el resto ya lo cubren eventos estándar de Shopify o es estado interno.
- **Detalle:** tabla completa en el plan, § 5.

## Pendientes y no verificados

- **Límite de tamaño del código de un custom pixel:** NOT_VERIFIED. El archivo pesa ~45 KB con comentarios; si Shopify lo rechaza, se minifica sin cambiar la lógica.
- **Si `gtag.js` persiste `_ga` y la sesión dentro del sandbox lax** (iframe sin `allow-same-origin`): NOT_VERIFIED.
  - Por eso `client_id` se toma de la cookie `_ga` (vía `browser.cookie`) o del `clientId` de Shopify.
  - Validar en DebugView que las sesiones no se fragmenten.
- **Si la app Google & YouTube manda `search` a GA4:** NOT_VERIFIED. Si no lo manda, agregar `"search_submitted"` a `GA4_EXTRA_STANDARD_EVENTS` **después** de comprobarlo.
- **Formato real de `checkout.order.id` en `checkout_completed`:** GID o número, NOT_VERIFIED. El mapa acepta los dos.
- **`name` de un custom event en el payload:** el ejemplo oficial de shopify.dev lo muestra sin el prefijo `radaelli:`. NOT_VERIFIED; el runtime fija el nombre al suscrito, así que mapea igual.
- **Qué hace un pixel "Obligatorio" antes de que la visitante responda al banner** (no carga o no recibe eventos): NOT_VERIFIED. El código igual re-chequea el consentimiento en cada envío.
- **Los `radaelli:*` se pueden falsificar:** Shopify advierte que cualquiera puede publicar un custom event desde la consola. No usar `AddToWishlist` como conversión de optimización sin tenerlo en cuenta.
