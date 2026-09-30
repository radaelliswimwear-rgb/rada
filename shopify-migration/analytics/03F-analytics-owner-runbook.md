# 03F — Runbook de la dueña: analítica (GA4 + Meta + custom pixel de huecos, APAGADO)

- **Fecha:** 2026-09-29 (Bogotá).
- **Estado:** solo documento. **No se ejecutó nada**: no se instaló ninguna app, no se creó ninguna cuenta ni pixel, no se cargó ningún ID.
- **Objetivo:** medir el embudo **anuncio → visita → ficha → carrito → checkout → compra** con:
  - **GA4** vía la app oficial **Google & YouTube**;
  - **Meta** vía la app oficial **Facebook & Instagram**;
  - el **custom pixel de Radaelli** solo para los huecos que ninguna app cubre, y **APAGADO** hasta que se cumplan las condiciones de § 12.
- **Base:** `analytics/03E-analytics-plan.md`, `analytics/custom-pixel/README.md`, `radaelli-pixel.js`, `event-map.js`, `theme/03E-commercial-readiness-report.md`, `theme/03E-checkout-baseline-report.md`, `payments/03E-wompi-shopify-feasibility.md`.
- **Etiquetas del Admin:** en inglés (verificadas) y, entre paréntesis, la traducción probable. Las etiquetas en español **no están verificadas** (NOT_VERIFIED).
- **Convenciones:** **NOT_VERIFIED** = no se pudo confirmar con una fuente oficial permitida. **NOT_AVAILABLE** = el dato no existe en el repo. `[X#]` = fuente de § 18.
- **Qué NO hace Claude:** no entra a Google ni a Meta, no acepta permisos OAuth, no escribe contraseñas, no pega IDs que la dueña no entregó, no inventa IDs.

## 1. Resumen

1. **Los tres bloqueos previos siguen en pie** (`03E-checkout-baseline-report.md`): C1 (la tienda resuelve a EE. UU.), C2 (con Colombia todo figura agotado) y **no hay proveedor de pago**. Sin ellos el embudo mide cero y `purchase` es imposible.
2. **La Dev Store no sirve para validar analítica.** La ayuda oficial dice que Google Analytics no registra con la tienda en modo privado [G2], que la app de Meta exige que la tienda **no** esté en modo privado [M3] y que el Pixel Helper de Shopify no funciona con tiendas en modo privado [P3]. La validación real ocurre en una tienda **pública** (§ 2).
3. **Orden obligatorio al lanzar:** primero textos legales y banner con Colombia; **recién después** quitar la contraseña y conectar las apps (§ 6). Al quitar la contraseña, donde no hay banner rige "permitir todo" (§ 5).
4. **Custom pixel: APAGADO por defecto.** En modo `gaps_only` solo manda 10 eventos de GA4 y 2 de Meta (§ 7); 8 de los 10 de GA4 y los 2 de Meta necesitan un cambio de theme (el puente) que hoy **no existe**.
5. **Compra:** su validación depende de la pasarela (§ 10). Hay un riesgo propio de la redirección a Wompi: si la clienta no vuelve a la tienda, la página de agradecimiento no carga (§ 14).
6. **Tiempo estimado:** dueña ~3 h 30 min a 4 h 15 min repartidas en dos o tres sesiones; Claude ~45 min de verificación después (§ 15).

## 2. Dónde se hace: tienda correcta y modo privado

| Componente | Con la tienda en modo privado (contraseña) | Fuente |
|---|---|---|
| App **Google & YouTube** → GA4 | Google Analytics **no registra eventos** hasta que se desactiva el modo privado | [G2] |
| App **Facebook & Instagram** | La tienda **no puede** estar en modo privado para configurarla | [M3] |
| **Shopify Pixel Helper** (botón Test de un custom pixel) | **No compatible** con tiendas en modo privado | [P3] |
| Custom pixel Radaelli | Se puede guardar y desconectar; **no se puede probar** con el Pixel Helper | [P3] |

- **Qué significa "modo privado":** la página de contraseña de la tienda. Se quita en Online Store, con el acceso en "Public" [D3] (extracto de búsqueda; la ruta exacta en español: NOT_VERIFIED).
- **La Dev Store tiene contraseña.** El Admin muestra la insignia "dev" y el aviso "En desarrollo" (`03A-development-store-upload-report.md`).
- **¿Se puede quitar la contraseña de esta Dev Store?** Dos páginas oficiales de Shopify dicen cosas distintas:

| Fuente | Dice |
|---|---|
| [D1] Dev Dashboard, "development stores" | No se puede quitar la contraseña, ni convertir la tienda a producción, ni transferirla a un cliente |
| [D2] Themes, "development stores" | La contraseña se puede quitar **después de transferir la tienda a un comerciante o de pasar a un plan pago** |

- **Consecuencia:** el tipo exacto de esta tienda decide si el lanzamiento ocurre en **esta** tienda (transferida o con plan pago) o en **otra** tienda de producción. Hoy es **NOT_VERIFIED**. 03E citaba solo [D1].
- **Acción de la dueña (P-4, § 6):** confirmar cómo se creó la tienda (Dev Dashboard o Partner Dashboard) y su plan actual (Settings > Plan).
- **Regla de este runbook:** todo lo que dice "tienda de lanzamiento" se hace en la tienda que va a estar **pública**. Si es otra, se repite allí (los archivos del pixel, los eventos y los chequeos son portables).

## 3. Bloqueos previos (puertas)

| Puerta | Qué debe estar hecho | Dónde | Estado hoy |
|---|---|---|---|
| **G-MKT** | C1 y C2: Colombia como mercado principal, dirección de la tienda en Colombia y zona de envío Colombia | `03E-owner-actions-one-shot.md` puntos 1 y 2; ejecución paso a paso en `theme/03F-owner-market-colombia-runbook.md` | Pendiente |
| **G-PAGO** | Proveedor de pago, o pasarela de prueba en una tienda no privada | punto 3 de ese archivo; ejecución en `payments/03F-wompi-owner-runbook.md` | Pendiente |
| **G-TIENDA** | Se sabe en qué tienda se lanza y si tiene contraseña | § 2 | NOT_VERIFIED |
| **G-ARQ** | La dueña eligió la opción **A** (apps + pixel de huecos) o la **B** (solo pixel completo, sin apps) | `03E-analytics-plan.md` § 3 | Pendiente. Este runbook asume A |
| **G-LEGAL** | Políticas de cookies y de privacidad revisadas para la analítica final | `theme/03F-legal-owner-runbook.md`, puertas G-COOK y G-PRIV | Pendiente |
| **G-BANNER** | Banner de cookies activo **con Colombia** (§ 5) | Settings > Customer privacy | Pendiente |
| **G-PUENTE** | OK de la dueña para el puente del theme (`Shopify.analytics.publish`) | `custom-pixel/README.md` § "Puente propuesto" | No aplicado |

## 4. Conexiones de cuenta que necesita la dueña

Sin IDs inventados. Los IDs que ella entregue se anotan por nombre en § 11.

### 4.1 Google (GA4)

| Qué | Para qué | Detalle |
|---|---|---|
| **Cuenta de Google** | Conectarla desde la app | Sales channels > Google & YouTube > Connect Google Account [G1] |
| **Propiedad de Google Analytics 4** con un **flujo de datos web** | Recibe los eventos. El flujo entrega el **ID de medición** (empieza con `G-`) | Google Analytics > Admin. Zona horaria y moneda de la propiedad: decisión de la dueña (`03E-analytics-plan.md` § 11 punto 6) [G2] |
| **Permiso de Editor** (mínimo) en esa propiedad | Poder conectarla desde Shopify | Resultado de búsqueda sobre la ayuda de Shopify; no confirmado en la página [G1] |
| Cuenta de **Google Ads** | **Opcional.** Vincula conversiones | La ayuda de Shopify la lista para vincular [G2]; la de Google la marca como opcional [G9]. **No conectar por ahora** |
| **Google Merchant Center** | **No requerido** para GA4. La ayuda dice que no hace falta conectarlo [G2] | No conectar |

### 4.2 Meta

| Qué | Para qué | Detalle |
|---|---|---|
| **Cuenta de Facebook** con **control total** del portafolio comercial y de la Página | Conectar los activos | [M3] |
| **Portafolio comercial de Meta** (Business portfolio) que posea la Página | Contiene los activos | [M3] |
| **Página de Facebook del negocio, publicada** | Requisito de la app | [M3] |
| **Cuenta publicitaria** dentro del portafolio | Solo si va a pautar | Resultado de búsqueda [M3] |
| **Cuenta de Instagram** | Solo si se conecta; el requisito exacto es NOT_VERIFIED | — |
| **Dataset / píxel** en el Administrador de eventos (Events Manager) | Recibe los eventos. Su **ID** son solo dígitos | Si se usa también el custom pixel, debe ser **el mismo** que conecta la app (`custom-pixel/README.md` § 1) |
| **País soportado** | La página de requisitos exige que el negocio esté "en un país soportado para Shops en Facebook e Instagram" [M3] | Si Colombia está en esa lista: **NOT_VERIFIED**. Riesgo nuevo, no estaba en 03E |
| **Plan de Shopify** | Un resultado de búsqueda dice "Basic o superior"; la página de requisitos **no lo especifica** | NOT_VERIFIED |
| **Tienda no privada** | La tienda "can't be in private mode" [M3] | § 2 |

## 5. Consentimiento y Customer Privacy (región Colombia)

**Qué dice la documentación oficial** y qué queda abierto:

| Tema | Lo documentado | Fuente |
|---|---|---|
| Dónde se configura | Settings > Customer privacy > **Cookie banner** (Configuración > Privacidad del cliente > Banner de cookies) | [C1] |
| Regiones | Por defecto (ajustes automáticos) el banner se activa para UK y EEE. Se pueden desactivar los automáticos y elegir regiones a mano: **Edit** en Regions, elegir, **Done**. Los selectores listan "todos los países y estados disponibles" | [C1][C2] |
| Colombia | **Ninguna página consultada la menciona.** Que aparezca en el selector: NOT_VERIFIED (probable, por el "listado de todos los países") | [C1][C2] |
| Dónde no hay banner | El banner "no está activo por defecto" fuera de UK, EEE y las regiones configuradas | [C1] |
| Pixels y consentimiento | En mercados que exigen consentimiento, los pixels web corren **solo** con los permisos declarados. Por defecto, un pixel nuevo pide **Marketing** y **Analytics** | [P1] |
| Carga del pixel | "El administrador de pixels de Shopify solo carga tu pixel si hay permiso del visitante para todos los ajustes que el pixel declara como obligatorios" | [P4] |
| Permiso del custom pixel | En Customer events > el pixel > Customer privacy: **Permission** "Required" (Marketing / Analytics / Preferences) o "Not required", y **Data sale** | [P2] |
| Google consent mode | Con la app Google & YouTube y el banner de Shopify activado, "el consent mode se habilita automáticamente". No dice nada de regiones sin banner | [G6] |
| Enlace de preferencias | Se incluye en la sección de políticas y cuando el banner se muestra | [C1] |

**Qué implica para Radaelli:**

1. **Si Colombia no está en el banner, rige "permitir todo"** (03E § 2.4): las apps y el pixel corren sin que la clienta pueda negarlo, y la política de cookies actual dice "Hoy no las usamos". Por eso G-BANNER va **antes** de quitar la contraseña.
2. Si se activa el banner solo para Colombia, hay que **agregar cada mercado activo** por separado.
3. **Cuando el banner rige y la clienta rechaza:** GA4 y Meta no reciben nada (se prueba en § 8.3).
4. **Si la ley colombiana exige consentimiento previo (opt-in) para estas cookies:** es una decisión legal. **No se consultaron fuentes legales.** No hay asesoría legal en este runbook.
5. **Consent mode de Google:** la ayuda de Google lo da por automático; una consulta de la comunidad de desarrolladores sugiere que la app puede enviar `default: granted` [G10]. Es fuente no oficial: **NOT_VERIFIED**. Se comprueba con Tag Assistant (§ 8.3).

## 6. Pasos

Tabla de pasos: Paso | Dónde | Acción exacta | Resultado esperado | Rollback.

### Fase 1. Bloqueos y tienda (dueña, ~30 min)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P-1 | Admin > Markets y Settings > General | Hacer el punto 1 de `03E-owner-actions-one-shot.md`: **Colombia como mercado principal** y dirección de la tienda en Colombia | `Shopify.country = CO`; checkout `es-CO` con "$ 199.920" | Devolver el mercado principal |
| P-2 | Settings > Shipping and delivery > General profile | Punto 2: **zona Colombia** y tarifas decididas | Los productos dejan de figurar agotados para CO | Quitar la zona |
| P-3 | Settings > Payments | Punto 3: proveedor de pago (o pasarela de prueba) | El checkout deja de decir "no puede aceptar pagos" | Desactivar el proveedor |
| P-4 | Settings > Plan; Dev Dashboard / Partner Dashboard | Anotar el **plan** y **cómo se creó** la tienda; decidir **en qué tienda se lanza** (§ 2) | Tienda de lanzamiento definida | — |
| P-5 | Chat | Elegir **A o B** (G-ARQ). Este runbook asume A | Decisión escrita | — |

### Fase 2. Textos legales y banner (dueña, ~30 min; ANTES de quitar la contraseña)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P-6 | `theme/03F-legal-owner-runbook.md` | Cerrar G-COOK y G-PRIV: la dueña revisa "Hoy no las usamos", "No vendemos ni compartimos…" y los terceros | Textos aprobados por ella | — |
| P-7 | Settings > Customer privacy > **Cookie banner** [C1] | 1) Desactivar los ajustes automáticos. 2) Regions > **Edit**: elegir **Colombia** y cada mercado activo. 3) **Done**. 4) Textos del banner en español. 5) **Save** | El banner aparece para una visita desde Colombia | Reactivar los ajustes automáticos |
| P-8 | Storefront, con DevTools > Application > Cookies | Visitar desde Colombia **sin aceptar**. Anotar qué cookies aparecen de la lista de analítica y marketing de Shopify (`_shopify_analytics`, `_landing_page`, `_orig_referrer`, `shop_analytics`, `_shopify_marketing`) [C3]. Aceptar y volver a anotar; debe aparecer `_tracking_consent` | Lista real de cookies; alimenta la revisión de § 13 | — |

### Fase 3. Pública y Google (dueña, ~40 min)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P-9 | Online Store (Tienda online) > acceso de la tienda | Cambiar de **Private** a **Public** y **Update** [D3]. **Solo si P-6 y P-7 están hechos** | Tienda pública | Volver a Private |
| P-10 | Google Analytics > Admin | Crear la **propiedad GA4** y el **flujo de datos web** con la URL de la tienda. Copiar el ID de medición `G-…` (para § 11) [G2] | Propiedad creada | Eliminar la propiedad |
| P-11 | Shopify Admin > Sales channels (Canales de venta) > Google & YouTube; o App Store > **Google & YouTube** > Install [G1] | Instalar la app oficial (Google LLC) | App instalada | Desinstalar la app |
| P-12 | App > **Connect Google Account** [G1] | Elegir la cuenta de Google (lo hace la dueña) | Cuenta conectada | Desconectar |
| P-13 | App > sección **Connect a Google Analytics property** [G1] | Elegir la propiedad de P-10 > **Connect** > **Confirm** | Propiedad conectada | Desconectar la integración de Google Analytics en la app [G3] |
| P-14 | App | **No** conectar Merchant Center ni Google Ads ahora (§ 4.1) | — | — |
| P-15 | Theme y consola | Confirmar que no hay tags heredados: en `theme-src` hay **0** coincidencias de `gtag`, `googletagmanager`, `fbq(`, `fbevents`, `dataLayer`. Revisar el theme remoto y que no haya un contenedor de GTM. Si existe un campo heredado de Google Analytics en las preferencias de la tienda: **NOT_VERIFIED** que exista aún | Un solo emisor de GA4 (la app) | Quitar el tag duplicado |

### Fase 4. Meta (dueña, ~45 min)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P-16 | Meta Events Manager | Crear o reutilizar el **dataset/píxel** y copiar su ID (solo dígitos) para § 11 | ID disponible | — |
| P-17 | Shopify Admin > Sales channels > **Facebook & Instagram**: Add / Start setup [M1] | **Connect account** (lo hace la dueña); conectar los activos de § 4.2; aceptar términos; **Finish setup** | Canal conectado; el pixel del paso P-16 asociado | Desconectar la cuenta en el canal |
| P-18 | Sales channels > Facebook & Instagram > Settings > **Data sharing settings** [M2] | Elegir el nivel: **Standard** (solo pixel) mientras P-6 no incluya el intercambio de datos; **Enhanced** o **Maximum** (pixel + Conversions API; comparte nombre, ubicación, correo y teléfono con Meta) solo después de actualizar la política de privacidad | Nivel elegido y coherente con el texto legal | Volver a Standard |
| P-19 | Storefront + extensión de Chrome de Meta | Con el Pixel Helper de Meta, comprobar que hay **un solo pixel** con el ID y **un** `PageView` por carga (§ 9) | Sin duplicados | Quitar el pixel manual sobrante |

### Fase 5. Custom pixel de Radaelli (APAGADO; solo si se decide)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P-20 | — | **No instalarlo** hasta que G-PUENTE esté aprobado y aplicado, y § 8 y § 9 den verde solo con las apps. Sin puente, solo sale `checkout_contact_info` y `checkout_address_info` a GA4 (`README.md` § 3): poco valor | Pixel ausente o `ENABLED: false` | — |
| P-21 | Settings > Customer events > **Add custom pixel** [P2] | Cuando corresponda: un pixel por destino (GA4 y Meta), pegar `radaelli-pixel.js` completo, editar **solo** `CONFIG`: `ENABLED: true`, el ID del destino, `MODE: "gaps_only"`, y `GA4_EXTRA_STANDARD_EVENTS` y `META_EXTRA_STANDARD_EVENTS` **vacíos**. Permission **Required**: GA4 → Analytics; Meta → Marketing. **Save**, sin conectar | Pixel guardado y "Disconnected" | Borrar el pixel |
| P-22 | Customer events > el pixel > **Test** [P3] | Recorrido de § 8 con el banner aceptado; un pixel a la vez | Eventos en verde | — |
| P-23 | Customer events > el pixel > **Connect** [P2] | Recién ahora conectar | Pixel activo | **Disconnect**: deja de rastrear sin borrar el pixel [P2] |

### Fase 6. Pruebas

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P-24 | § 8 | Correr el checklist de eventos y de consentimiento | Cada evento una vez, sin PII | — |
| P-25 | § 9 | Correr el checklist de deduplicación | Sin doble disparo | Desconectar lo que duplique |
| P-26 | § 10 | Validar la compra | Un `purchase` y un `Purchase` por pedido | — |

## 7. Qué cubre y qué NO cubre el custom pixel

Precisión tomada de `event-map.js` (`EVENT_SPECS`, `mapEvent`) y `radaelli-pixel.js` (`subscribedEventNames`).

- **Se suscribe** a los **21** eventos: 13 estándar de Shopify y 8 custom `radaelli:*`. En `gaps_only` **recibe** los estándar del embudo, pero `mapEvent` devuelve `null` y **no envía nada**.
- **Modo `gaps_only`:** solo envía los eventos con destino marcado como hueco.

| Destino | Eventos que SÍ envía el pixel | ¿Necesita el puente del theme? |
|---|---|---|
| **GA4** (10) | `checkout_contact_info`, `checkout_address_info` | **No** (salen de eventos estándar del checkout) |
| **GA4** | `add_to_wishlist`, `remove_from_wishlist`, `view_wishlist`, `search_no_results`, `search_suggestion_select`, `select_size`, `cart_drawer_open`, `cart_error` | **Sí**: son los 8 `radaelli:*` que hoy nadie publica |
| **Meta** (2) | `AddToWishlist` (`track`) y `RemoveFromWishlist` (`trackCustom`) | **Sí** |

**Lo que el pixel NO debe cubrir, y en `gaps_only` no cubre** (los manda la app):

| Destino | Eventos reservados a la app oficial |
|---|---|
| **GA4** (11) | `page_view`, `view_item`, `view_item_list`, `search`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase` |
| **Meta** (7) | `PageView`, `ViewContent`, `Search`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`, `Purchase` |
| **Meta** | **`AddShippingInfo` no existe** como evento estándar [M6]. El sitio Next.js lo trataba como estándar; en Shopify no se replica |

**Los 3 interruptores que rompen esta regla** (por eso § 9 los revisa):

1. `MODE: "full"` con las apps instaladas: duplica **todo** el embudo.
2. `GA4_EXTRA_STANDARD_EVENTS` con nombres como `search_submitted` o `page_viewed`. **Ya no hace falta para `search`**: Google documenta que la app lo envía [G4] (§ 17, hallazgo 1). Debe quedar `[]`.
3. `META_EXTRA_STANDARD_EVENTS` con nombres de eventos de la app de Meta. Debe quedar `[]`.

## 8. Checklist de eventos de prueba

### 8.1 Recorrido y herramientas

**Recorrido** (`03E-analytics-plan.md` § 12): Home → colección → ficha (cambiar talla) → favorito → buscar "mostaza" → agregar desde la ficha y desde el drawer → quitar → `/cart` → checkout (contacto, dirección, envío, pago).

**GA4, DebugView** [G5]:
1. Analytics > **Admin > Data display > DebugView**.
2. Poner el navegador en modo depuración con **Google Tag Assistant** (tagassistant.google.com), que agrega los parámetros de depuración. Otras vías documentadas: parámetro `debug_mode` en el tag o en GTM; en esta tienda el tag es el de la app, así que Tag Assistant es lo práctico.
3. En DebugView, elegir el dispositivo de depuración y mirar el flujo de segundos.
4. Si no aparece nada: puede ser que el **consentimiento bloquee** las cookies de Analytics [G5]; aceptar el banner y repetir.
5. **NOT_VERIFIED:** que DebugView capture los eventos del **checkout** (corre en un entorno aislado). Plan B: informe **Realtime** de GA4 (no re-verificado en la documentación).

**Meta, Test Events** [M8]:
1. Events Manager > **Data sources** > el dataset > pestaña **Test events**.
2. En "Test browser events", ingresar la URL de la tienda y abrirla desde ahí; recorrer el sitio.
3. Los eventos aparecen en ~1 minuto; la información queda 24 h o hasta "Clear activity". Si no aparecen, desactivar bloqueadores de anuncios.
4. La página de ayuda de Meta no se pudo leer completa: los pasos salen de un resumen de búsqueda (**NOT_VERIFIED** el detalle).
5. **Eventos de servidor (Conversions API)** de la app: que aparezcan en Test Events depende de que la app envíe un código de prueba: **NOT_VERIFIED**. Se comprueba en Events Manager > Overview: método de conexión "Browser and Server" y estado de deduplicación.

**Extensión de Chrome de Meta** [M7]: detecta el pixel en la página y avisa "Duplicate Pixel code". La página oficial hoy la describe como **Meta Ads Data Advisor**; confirmar el nombre en la tienda de extensiones.

### 8.2 Embudo estándar (11 eventos, los manda la app)

Para **todos**: `currency` = `COP`; `value` con el monto correcto; `page_location` **sin** `q=`, sin correo y sin token. Si sale `USD`, C1 no está resuelto: Google documenta `USD` por defecto si no hay moneda [G4].

| # | GA4 | Meta | Acción de prueba | Qué mirar en GA4 (DebugView) | Qué mirar en Meta (Test Events) | Nota |
|---|---|---|---|---|---|---|
| 1 | `page_view` | `PageView` | Cargar la Home | **1** por carga; URL saneada | **1** `PageView` por carga | El pixel propio **no** lo manda |
| 2 | `view_item` | `ViewContent` | Abrir una ficha | `items` con id, nombre y precio; `value` | `content_ids`, `value`, `currency` | — |
| 3 | `view_item_list` | ninguno (a propósito) | Abrir una colección | Lista de productos | **Nada** | El sitio viejo mandaba `ViewContent`; se deja de hacer |
| 4 | `search` | `Search` | Buscar "mostaza" (devuelve `entero-golden-hour`) | `search_term` limpio | `search_string` | Sin correo ni teléfono en el término |
| 5 | `add_to_cart` | `AddToCart` | Agregar desde la ficha **y** desde el drawer | **1** por acción; `quantity` y `value` | `contents` y `value` | Que el alta AJAX del drawer dispare el evento: NOT_VERIFIED. Bloqueado por C1 y C2 (respuesta 422) |
| 6 | `remove_from_cart` | ninguno | Quitar un ítem en el drawer | 1 evento | **Nada** | AJAX: NOT_VERIFIED |
| 7 | `view_cart` | ninguno | Abrir `/cart` (la **página**) | 1 evento | **Nada** | El drawer no cuenta como página |
| 8 | `begin_checkout` | `InitiateCheckout` | Pulsar "Finalizar compra" | `items` y `value` (subtotal) | `contents`, `num_items`, `value` | — |
| 9 | `add_shipping_info` | ninguno | Completar dirección y envío | 1 evento | **Nada** | Google: se dispara al dar datos de envío o dirección [G3]. `AddShippingInfo` no es estándar de Meta [M6] |
| 10 | `add_payment_info` | `AddPaymentInfo` | Elegir o ingresar el pago | 1 evento | `value` y `currency` | Requiere proveedor (G-PAGO) |
| 11 | `purchase` | `Purchase` | Completar un pedido de prueba | 1 evento con `transaction_id` | 1 evento con `value` y `currency` | § 10 |

### 8.3 Favoritos y huecos (solo con el custom pixel conectado; APAGADO por defecto)

| # | GA4 | Meta | Acción de prueba | Verificar | Requiere puente |
|---|---|---|---|---|---|
| 12 | `add_to_wishlist` | `AddToWishlist` | Marcar un favorito | GA4: `items[0].item_id` = id de **producto**. Meta: `content_type: product_group` y `eventID` | Sí |
| 13 | `remove_from_wishlist` | `RemoveFromWishlist` (`trackCustom`) | Quitar un favorito | GA4: `remove_source`. Meta: `eventID` | Sí |
| 14 | `view_wishlist` | ninguno | Abrir Favoritos | GA4: `wishlist_count` | Sí |
| 15 | `checkout_contact_info` | ninguno | Completar el contacto del checkout | GA4: `items` y `value` | **No** |
| 16 | `checkout_address_info` | ninguno | Completar la dirección | GA4: `items` y `value` | **No** |
| 17 | `search_no_results` | ninguno | Buscar un término sin resultados | GA4: `search_term`, `search_source` | Sí |
| 18 | `search_suggestion_select` | ninguno | Elegir una sugerencia del buscador | GA4: `suggestion_position`, `suggestion_path` | Sí |
| 19 | `select_size` | ninguno | Cambiar la talla en la ficha | GA4: `item_id`, `size`, `availability` | Sí |
| 20 | `cart_drawer_open` | ninguno | Abrir el drawer | GA4: `open_source` | Sí |
| 21 | `cart_error` | ninguno | Provocar el error de stock | GA4: `error_source` (**el mensaje no se manda**) | Sí |

- **Dimensiones personalizadas:** los parámetros propios (`remove_source`, `search_source`, `suggestion_position`, `suggestion_path`, `size`, `availability`, `variant_id`, `open_source`, `error_source`, `wishlist_count`) se registran en Analytics > **Admin > Data display > Custom definitions > Custom dimensions** (alcance **Event**). El parámetro debe estar ya llegando, y el dato aparece en informes 24 a 48 h después [G8].
- **Los `radaelli:*` se pueden falsificar** desde la consola (`03E-analytics-plan.md` § 2.3): no usar `AddToWishlist` como conversión de optimización.

### 8.4 Consentimiento (con banner activo)

| # | Prueba | GA4 | Meta |
|---|---|---|---|
| K1 | Rechazar todo en el banner | **0** eventos | **0** eventos |
| K2 | Aceptar solo analítica | Llegan | **0** eventos |
| K3 | Aceptar todo | Llegan | Llegan |
| K4 | Revocar desde el enlace de preferencias | Corte inmediato | Corte inmediato |
| K5 | Con Tag Assistant, mirar el estado de consentimiento del tag (la vista exacta no se verificó en la documentación) | Coincide con la elección (no `granted` fijo) | — |

- **Si K1 falla con la app:** no se arregla con el pixel propio. Se documenta y se decide (G-LEGAL).
- **Con el custom pixel conectado (además):** en el Pixel Helper de Shopify, "Give consent to continue test" [P3].

## 9. Checklist de deduplicación y de NO doble disparo

Cuando las apps oficiales y el pixel propio coexisten. Cada punto lo verifica Claude o la dueña con las herramientas de § 8.1.

| # | Chequeo | Cómo | Pasa si |
|---|---|---|---|
| D1 | **Un emisor por evento y destino** | Comparar cada evento observado con la tabla de § 7 | Ningún evento del embudo llega de dos orígenes |
| D2 | **Prueba con y sin el pixel** | **Desconectar** el custom pixel y repetir el recorrido; después **conectarlo** | Sin el pixel siguen llegando los 11 de GA4 y los 7 de Meta (los manda la app). Con el pixel **no aparece ningún evento extra del embudo**: solo los de § 8.3 |
| D3 | `CONFIG` sin extras | Revisar el pixel guardado | `MODE: "gaps_only"`, `GA4_EXTRA_STANDARD_EVENTS: []`, `META_EXTRA_STANDARD_EVENTS: []` |
| D4 | Un solo `PageView` de Meta | Extensión de Chrome de Meta | 1 por carga. Si muestra el mismo ID dos veces (app y pixel propio) es un aviso: el pixel propio **no** manda `PageView` y arranca con `autoConfig` apagado. Que aun así el aviso aparezca: NOT_VERIFIED |
| D5 | Mismo dataset | Comparar el ID de la app y el de `META_PIXEL_ID` | Idénticos (`custom-pixel/README.md`) |
| D6 | Sin pixel de Meta pegado a mano | Buscar en el theme | Shopify advierte que un pixel a mano junto a la app deja más de un pixel y datos duplicados [M4]. En `theme-src` hay 0 |
| D7 | Sin GA4 en otro sitio | Buscar `G-` y GTM en el theme y en las preferencias | Solo la app y, si existe, el pixel de huecos. Google pide no tener tags duplicados entre la app y un custom pixel [G3][G9] |
| D8 | **`purchase` de GA4 sin id vacío** | Ver el evento de compra | `transaction_id` con valor. GA4 deduplica **todos** los `transaction_id` vacíos juntos [G7] |
| D9 | Recarga de la página de agradecimiento | Recargarla 2 veces | El conteo de `purchase` y de `Purchase` sigue en **1** |
| D10 | Meta: pixel + servidor | Events Manager > Overview y Diagnostics | Con Mejorado o Máximo, `Purchase` figura por "Browser and Server" y deduplicado. Meta deduplica con el mismo `event_id` y `event_name` dentro de 48 h; si solo un lado manda `event_id`, **no** hay deduplicación [M5]. Cómo lo hace la app: **NOT_VERIFIED** (Shopify no lo documenta) |
| D11 | Sin capa server-side extra | Confirmar que no hay Conversions API propia ni Measurement Protocol de GA4 | Ninguna. Duplicaría la compra de la app (`03E-analytics-plan.md` § 8) |
| D12 | Usuario y sesión de GA4 | Solo con el pixel conectado: en DebugView, ver si los eventos del pixel y los de la app comparten usuario | Sí comparten. Si no: NOT_VERIFIED (03E § 13). La app envía un `ext_client_id` [G4]; el pixel usa la cookie `_ga` o el `clientId` de Shopify |
| D13 | Ids de producto | Comparar `item_id` de la app y del pixel | Coinciden o se documenta la diferencia. Qué id (producto o variante) usa la app: **no documentado** [G4] |

## 10. Validación del evento de compra

**Depende de que exista una pasarela** y de que la tienda no esté en modo privado. Hoy no hay ninguna de las dos.

### 10.1 Qué se puede probar y dónde

| Escenario | ¿Sirve para validar `purchase`? | Nota |
|---|---|---|
| **Dev Store**, pasarela de prueba "Bogus" o proveedor en modo de prueba [D1][D2] | **Parcial.** El pedido de prueba se crea, pero con la contraseña puesta ni GA4 ni la app de Meta funcionan (§ 2) | Sirve para revisar el checkout, no la analítica |
| **Tienda de lanzamiento, pública**, proveedor en **modo de prueba** | **Es la ruta preferida**, si el proveedor permite conectarse solo en modo de prueba | Wompi pide cargar primero credenciales de producción y luego las de prueba (`payments/03E-wompi-shopify-feasibility.md` E9): **NOT_VERIFIED** que se pueda solo en prueba |
| **Tienda de lanzamiento**, pedido **real** de monto bajo, que la dueña paga con su tarjeta y luego cancela o reembolsa | Sí, con costo y contaminación | Ver riesgos R6 y R7 |
| Si un pedido de prueba dispara `checkout_completed` y las apps reenvían `purchase`: | **NOT_VERIFIED** | Se comprueba con el primer pedido de prueba |

### 10.2 Checklist del pedido

La dueña hace el pedido (Claude no teclea datos de pago ni personales). Claude mira los paneles.

| # | Chequeo | GA4 | Meta |
|---|---|---|---|
| V1 | Cantidad | **1** `purchase` | **1** `Purchase` (pixel + servidor deduplicados, si nivel Mejorado o Máximo) |
| V2 | Identificador | `transaction_id` con valor. **A qué campo del pedido corresponde** (id numérico, GID o nombre "#1001"): NOT_VERIFIED; anotar el valor y compararlo con el pedido | `event_id`: lo define la app. NOT_VERIFIED |
| V3 | Monto | `value` = total del pedido. Google indica que desde el 2025-04-24 `purchase` y `begin_checkout` descuentan los descuentos [G4]; comparar contra el pedido | `value` numérico y `currency` (**obligatorios** en `Purchase` [M6]) |
| V4 | Moneda | `COP` | `COP` |
| V5 | Ítems | Una fila por producto, con cantidad y precio unitario | `contents` con id y cantidad |
| V6 | Envío e impuestos | `shipping` y `tax` solo si el evento los trae (NOT_VERIFIED) | — |
| V7 | Recarga | La página de agradecimiento recargada no suma otro (D9) | ídem |
| V8 | Sin PII | Ni correo, ni teléfono, ni dirección, ni token en ningún parámetro ni URL | ídem |
| V9 | Cancelación o reembolso | La lista documentada de eventos de la app **no incluye `refund`** [G4]: los ingresos de GA4 no bajan al reembolsar. Registrarlo como limitación | Meta no recibe reembolsos: NOT_VERIFIED |

## 11. IDs y secretos requeridos (solo nombres)

Ningún valor va en este documento ni en el chat con secretos. **Claude no pide ni guarda secretos.**

| Nombre | Qué es | Dónde se obtiene | Dónde se usa | ¿Secreto? |
|---|---|---|---|---|
| `GA4_MEASUREMENT_ID` | ID de medición (`G-…`) | Analytics > Admin > flujo de datos web | Solo en `CONFIG` del custom pixel de GA4. La **app** no necesita que se pegue: se elige la propiedad | No (visible en el código de la página) |
| `META_PIXEL_ID` | ID del dataset/píxel (solo dígitos) | Events Manager | Solo en `CONFIG` del custom pixel de Meta. La app se conecta eligiendo el dataset | No |
| `INTERNAL_TRAFFIC_COOKIE` | Nombre de una cookie propia para excluir tráfico interno (opcional) | La define la dueña | `CONFIG` del pixel | No |
| Acceso de Editor a la propiedad GA4 | Permiso, no ID | Analytics > Admin > Access management | Conexión de la app | — |
| Acceso al portafolio comercial y a la Página | Permiso, no ID | Meta Business | Conexión de la app | — |
| Credenciales de Google y de Meta | Contraseñas y códigos de verificación | Las escribe **solo la dueña** en la pantalla oficial | OAuth de cada app | **Sí. Nunca en el chat** |

**Nombres que NO se necesitan en Shopify** (variables del sitio Next.js actual; la app de Meta maneja la Conversions API y GA4 no usa Measurement Protocol aquí):

- `GA4_MEASUREMENT_PROTOCOL_API_SECRET` y `META_CAPI_ACCESS_TOKEN`: **secretos**; no migran y no se crean.
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` y `NEXT_PUBLIC_META_PIXEL_ID`: no se leen de ahí; los entrega la dueña.
- `ANALYTICS_RUNTIME_ENABLED`, `ANALYTICS_BROWSER_ENABLED`, `ANALYTICS_SERVER_DELIVERY_ENABLED`, `STAGING_ANALYTICS_OVERRIDE`: interruptores del sitio actual; en Shopify el equivalente es conectar o desconectar la app o el pixel.
- **No se leyó ningún `.env`.**

## 12. Qué puede quedar apagado hasta el lanzamiento comercial

| Componente | Estado hasta el lanzamiento | Se enciende cuando | Riesgo si se enciende antes |
|---|---|---|---|
| **Custom pixel Radaelli** | **Apagado** (`ENABLED: false` o sin instalar) | G-PUENTE aplicado + § 8 y § 9 verdes con solo las apps | Sin puente aporta poco; en `full` duplica todo |
| **Meta: nivel Mejorado o Máximo** | **Standard** o app sin conectar | La política de privacidad declara el intercambio (P-6) y G-PAGO | Comparte nombre, ubicación, correo y teléfono con Meta [M2]; choca con "No vendemos ni compartimos…" |
| **App Google & YouTube** | Puede conectarse en la tienda privada (no registra nada) | Al quitar la contraseña, con G-BANNER listo | Registra sin consentimiento donde no hay banner |
| **App Facebook & Instagram** | No se puede terminar de configurar en modo privado [M3] | Después de P-9 | — |
| **Google Ads y Merchant Center** | **No conectados** | Cuando haya campañas o catálogo | Fuera de alcance del día 1 |
| **Dimensiones personalizadas** | Sin crear | Cuando lleguen los eventos custom | Un parámetro que no llega no se puede registrar [G8] |
| **Filtro de tráfico interno** | Decisión de la dueña (cookie propia o filtro de GA4) | Antes de las pruebas con pedidos reales | Los pedidos de prueba contaminan los datos |
| **`radaelli:*` como conversión de optimización** | **Nunca** | — | Se pueden falsificar desde la consola |

## 13. Relación con la política de cookies

**La página de cookies dice hoy** (verbatim del sitio, `content/legal/cookies.html`): las cookies analíticas y las de marketing "Hoy no las usamos", y que la clienta puede cambiar sus preferencias "cuando quieras". Detalle de esos párrafos en `theme/03F-legal-owner-runbook.md` § 7.4.

| Escenario | Qué activa | Categoría | ¿Coincide con "Hoy no las usamos"? | Acción de la dueña |
|---|---|---|---|---|
| **S0.** Solo Shopify, sin GA4 ni Meta | Shopify lista cookies **de analítica** (`_shopify_analytics`, `_landing_page`, `_orig_referrer`, `shop_analytics`, `_shopify_y`, `_shopify_s`) y **de marketing** (`_shopify_marketing`) en su política de cookies [C3]. `_shopify_y` y `_shopify_s` están en retiro [C4]. Que esta tienda las emita y con qué consentimiento: **NOT_VERIFIED** | Analítica y marketing | **Puede no coincidir ni siquiera con todo apagado** | P-8: verificar en vivo; revisar la frase (G-COOK) |
| **S1.** + GA4 (app) | Analítica de Google | Analítica | **No** | Actualizar el texto y activar el banner |
| **S2.** + Meta pixel, nivel Standard | Pixel de Meta | Marketing | **No** | Ídem |
| **S3.** + Meta Mejorado o Máximo (Conversions API) | Datos personales a Meta | Marketing y datos | **No**, y además cambia la política de **privacidad** [M2] | Actualizar privacidad y cookies |
| **S4.** + custom pixel | Lo mismo que S1 y S2, en huecos | Según el destino | **No** | Sin cambios adicionales |

**Reglas:**

1. **No se enciende nada de S1 a S4 sin el banner con Colombia (G-BANNER) y sin el texto actualizado (G-LEGAL).** Es la condición del orden de § 6.
2. **"Cómo cambiar tus preferencias"** solo tiene sentido si el banner y su enlace de preferencias están activos en Colombia [C1]. El botón del sitio actual se quitó en 03D.
3. **Quién decide** si hace falta consentimiento previo: la dueña, con su asesor. Este runbook no lo determina.

## 14. Riesgos

| # | Riesgo | Efecto | Mitigación |
|---|---|---|---|
| R1 | **Sin pasarela** | `payment_info_submitted` y `checkout_completed` imposibles | G-PAGO antes de § 10 |
| R2 | **Modo privado** | Sin datos en GA4, app de Meta bloqueada, Pixel Helper inútil | § 2: validar en la tienda pública |
| R3 | **C1 y C2 sin resolver** | Caída del 100 % en "agregar al carrito"; moneda `USD` por defecto si falta la del checkout [G4] | G-MKT |
| R4 | **Sin Colombia en el banner** | Rige "permitir todo" | G-BANNER antes de P-9 |
| R5 | **Texto de cookies o de privacidad desactualizado** | Contradice lo publicado | G-LEGAL |
| R6 | **Pedido real de prueba** | Comisión del proveedor, reembolso NOT_VERIFIED, contamina GA4 y Meta con una "compra" real | Preferir modo de prueba; excluir tráfico interno |
| R7 | **Reembolsos de Wompi desde Shopify** | NOT_VERIFIED (`payments/03E-wompi-shopify-feasibility.md`) | Preguntar a Wompi antes de un pedido real |
| R8 | **Redirección a Wompi:** la clienta paga y no vuelve a la tienda | `checkout_completed` se dispara normalmente en la **página de agradecimiento** (`03E-analytics-plan.md` § 2.2); si no carga, GA4 subcuenta ventas. Meta con nivel Mejorado o Máximo las recibe por servidor. Si el pedido se crea cuando la clienta no vuelve: NOT_VERIFIED | Comparar pedidos de Shopify contra `purchase` de GA4 las primeras semanas |
| R9 | **Doble disparo** por `full`, por `*_EXTRA_*` o por pixel manual | Ventas y eventos duplicados | § 7 y § 9 |
| R10 | **Sin `refund`** en la lista de eventos de la app | Ingresos de GA4 sobrestimados frente a Shopify | Registrarlo como limitación (V9) |
| R11 | **País no soportado para el canal de Meta** | La app podría no poder completarse (Colombia NOT_VERIFIED) | Verificar antes de planear P-17 |
| R12 | **Los custom events se pueden falsificar** | Datos de favoritos contaminados | No usarlos como conversión |
| R13 | **Un pixel "Obligatorio" antes de que la visitante responda** | Documentado como "no carga sin permiso" [P4]; aplicado al custom pixel se confirma con el Pixel Helper | § 8.4 |

## 15. Tiempo estimado y qué hace Claude después

| Tramo | Quién | Tiempo |
|---|---|---|
| Fase 1 (C1, C2, pago, tienda, A o B) | Dueña | ~30 min (los puntos 1 a 3 ya estaban en `03E-owner-actions-one-shot.md`) |
| Fase 2 (revisión legal y banner) | Dueña | ~30 min más su revisión legal |
| Fase 3 (pública, GA4, app Google) | Dueña | ~40 min |
| Fase 4 (Meta) | Dueña | ~45 min (la creación de activos de Meta puede llevar más) |
| Fase 6 (§ 8 y § 9) | Dueña abre sesiones; Claude observa | ~45 min |
| § 10 (compra) | Dueña hace el pedido; Claude mira | 30 a 60 min según pasarela |
| **Total dueña** | | **~3 h 30 min a 4 h 15 min, en dos o tres sesiones** (suma de los tramos de arriba; la revisión legal de la fase 2 no está incluida) |

**Qué hace Claude inmediatamente después de cada tramo:**

1. **Tras P-13 y P-17:** confirma en el Admin que las apps figuran conectadas, sin pedir ni ver contraseñas.
2. **Tras P-8 y P-24:** corre § 8 con ventana visible y las sesiones que la dueña dejó iniciadas; llena una tabla por evento con "una vez, sin PII, moneda COP".
3. **Tras P-25:** hace el A/B de D2 (con y sin pixel) y anota cualquier duplicado.
4. **Tras P-26:** compara el pedido con `purchase` y `Purchase` (V1 a V9).
5. **Actualiza la documentación:** marca en `03E-analytics-plan.md` § 13 como resueltos los puntos de § 17 de este runbook y registra lo que siga NOT_VERIFIED.
6. **Con OK de la dueña:** prepara el puente del theme (G-PUENTE) y las dimensiones personalizadas. Hasta entonces el pixel sigue **apagado**.
7. **No hace:** entrar a Google o Meta, aceptar OAuth, escribir credenciales, ni cargar IDs que la dueña no entregó.

## 16. Rollback global

| Qué | Cómo |
|---|---|
| Dejar de medir en Google | En la app Google & YouTube, desconectar la integración de Google Analytics [G3]; o desinstalar la app |
| Dejar de medir en Meta | Desconectar la cuenta en el canal Facebook & Instagram; o volver el nivel a **Standard** |
| Apagar el custom pixel | Customer events > el pixel > **Disconnect** [P2]; o dejar `ENABLED: false` |
| Volver a la tienda privada | Online Store > acceso "Private" [D3] (corta el envío de GA4 [G2]) |
| Banner | Reactivar los ajustes automáticos |
| Dimensiones personalizadas | Se pueden archivar en Custom definitions; no afectan los datos ya guardados (NOT_VERIFIED el detalle) |

## 17. Hallazgos que cambian 03E

1. **`03E-analytics-plan.md` § 2.5, § 12.2 y § 13 (lista de eventos de la app Google): resuelto.** La referencia de Google para la app lista **11 eventos**: `page_view`, `view_item`, `view_item_list`, `view_cart`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase` y `search` [G4]. Consecuencias:
   - `search`, `page_view`, `view_item` y `add_payment_info` **sí** los manda la app; ya no hay que "verificar y, si falta, agregar `search_submitted`". **`GA4_EXTRA_STANDARD_EVENTS` debe quedar `[]`**: agregarlo duplicaría `search`.
   - Además: la app agrega `shopify_event_name`, `event_id` y `ext_client_id`; la moneda es `USD` por defecto si no hay moneda; desde el 2025-04-24 los montos descuentan los descuentos [G4].
   - **Sigue sin documentarse:** si `item_id` es el id de producto o de variante, y `refund` **no está** en la lista.
2. **§ 2.5 y § 6.2 (consent mode con la app Google): parcialmente resuelto.** Google dice que, con la app y el banner de Shopify activado, el consent mode se habilita solo [G6]. No dice qué pasa donde no hay banner.
3. **§ 2.1, § 11 y § 12.1 (Dev Store como QA): cambia.** 03E dice que en la Dev Store los pasos "solo sirven para QA técnico". La ayuda oficial dice que con contraseña **ni GA4 registra** [G2], **ni se puede terminar** la app de Meta [M3], **ni funciona** el Pixel Helper de Shopify [P3]. La verificación de § 12 de 03E solo se puede hacer en una tienda pública.
4. **§ 2.1 y § 11 (la Dev Store no se convierte en producción): incompleto.** Solo cita [D1]. La página [D2] de Shopify dice que la contraseña se puede quitar tras **transferir la tienda a un comerciante o pasar a un plan pago**. El tipo de esta tienda es NOT_VERIFIED y decide dónde se lanza.
5. **§ 2.4 (qué hace un pixel "Obligatorio" antes de responder): resuelto en parte.** La página de privacidad de pixels dice que el administrador de pixels solo carga el pixel si hay permiso para todos los ajustes que declara [P4]. Además, en regiones **sin** banner los pixels corren sin pedir permiso [P1]. Se confirma con el Pixel Helper en una tienda pública.
6. **§ 6.4 (contradicción con la política de cookies): más amplia.** Shopify lista cookies de analítica y de marketing propias [C3]: la frase "Hoy no las usamos" puede ser inexacta **aun con GA4 y Meta apagados** (S0 de § 13). Y el enlace de preferencias sí está documentado [C1]: en la sección de políticas y cuando el banner se muestra. Cómo aparece en el theme Radaelli sigue siendo NOT_VERIFIED.
7. **Riesgo nuevo, no estaba en 03E:** la app de Meta exige un **país soportado** para Shops en Facebook e Instagram [M3]. Que Colombia figure: NOT_VERIFIED. Debe confirmarse antes de planear P-17.
8. **Riesgo nuevo:** con redirección a Wompi, la página de agradecimiento puede no cargarse (R8). `checkout_completed` es un evento de esa página (`03E-analytics-plan.md` § 2.2); 03E no lo trata como riesgo de conteo.
9. **§ 8 (Conversions API vía la app):** Shopify no documenta cómo deduplica; Meta documenta `event_id` + `event_name` en 48 h [M5]. Sin cambios respecto de 03E, pero D10 lo convierte en un chequeo concreto.

## 18. Fuentes (consultadas el 2026-09-29) y NOT_VERIFIED

| Ref. | URL | Para qué se usó | Confianza |
|---|---|---|---|
| G1 | https://help.shopify.com/en/manual/online-sales-channels/marketplaces/google/getting-setup/connect | Ruta de la app Google & YouTube, conectar cuenta y propiedad, rol de Editor | Solo resultado de búsqueda |
| G2 | https://help.shopify.com/en/manual/reports-and-analytics/google-analytics/google-analytics-setup | Cuentas requeridas, Merchant Center no requerido, **modo privado** | Leída |
| G3 | https://support.google.com/analytics/answer/12183125 | Eventos nuevos de la app, tags duplicados, desconectar la integración | Leída |
| G4 | https://developers.google.com/tag-platform/gtagjs/reference/shopify-event-parameters | **Los 11 eventos de la app**, parámetros, `USD` por defecto, descuentos | Leída (extracto) |
| G5 | https://support.google.com/analytics/answer/7201382 | DebugView | Leída |
| G6 | https://support.google.com/analytics/answer/14563069 | Consent mode con la app y el banner de Shopify | Leída |
| G7 | https://support.google.com/analytics/answer/12313109 | Deduplicación por `transaction_id` | Leída |
| G8 | https://support.google.com/analytics/answer/14239696 | Dimensiones personalizadas | Leída |
| G9 | https://support.google.com/merchants/answer/13494537 | Conversiones de la app; Google Ads opcional | Leída |
| G10 | https://community.shopify.dev/t/web-pixel-google-youtube-app-always-pushing-default-granted/23016 | Indicio de que la app podría enviar `default: granted` | Comunidad, **no oficial**; solo el título en un resultado de búsqueda |
| M1 | https://help.shopify.com/en/manual/online-sales-channels/facebook-instagram-by-meta/setup | Pasos de instalación del canal | Leída (pasos por activo: no detallados) |
| M2 | https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing | Niveles de datos, eventos, Conversions API, ruta de Data sharing settings | Leída |
| M3 | https://help.shopify.com/en/manual/online-sales-channels/social-commerce/facebook-instagram-by-meta/requirements-and-considerations | Requisitos: **no modo privado**, Página, portafolio, país soportado | Leída |
| M4 | https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-pixel | Pixel manual + app = duplicados | Leída |
| M5 | https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events | Deduplicación pixel + servidor, 48 h | Leída |
| M6 | https://developers.facebook.com/docs/meta-pixel/reference | `AddShippingInfo` no existe; `Purchase` exige `value` y `currency` | Leída |
| M7 | https://developers.facebook.com/docs/meta-pixel/support/pixel-helper | Extensión de Chrome, aviso de pixel duplicado | Leída |
| M8 | https://www.facebook.com/business/help/2040882565969969 | Test Events (1 minuto, 24 h, bloqueadores) | Solo resultado de búsqueda; la página no se pudo leer |
| P1 | https://help.shopify.com/en/manual/promoting-marketing/pixels/overview | Dónde corren los pixels, consentimiento por región | Leída |
| P2 | https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/manage | Crear, Permission, Data sale, Connect y Disconnect | Leída |
| P3 | https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/testing | Pixel Helper de Shopify, un pixel a la vez, **no en modo privado** | Leída |
| P4 | https://shopify.dev/docs/api/web-pixels-api/pixel-privacy | Lectura de consentimiento y carga del pixel | Leída |
| C1 | https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings | Banner, regiones, enlace de preferencias | Leída |
| C2 | https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/understanding-customer-privacy-settings | Selector de regiones | Leída |
| C3 | https://www.shopify.com/legal/cookies | Cookies de analítica y de marketing de Shopify | Leída |
| C4 | https://shopify.dev/changelog/shopifyy-and-shopifys-cookies-will-no-longer-be-set | Retiro de `_shopify_y` y `_shopify_s` (la fecha varía entre fuentes) | Leída |
| D1 | https://shopify.dev/docs/apps/build/dev-dashboard/development-stores | Dev stores: sin quitar contraseña, sin convertir ni transferir | Leída |
| D2 | https://shopify.dev/docs/storefronts/themes/tools/development-stores | Contraseña removible tras transferencia o plan pago | Leída |
| D3 | https://help.shopify.com/en/manual/online-store/themes/password-page | Modo privado y cómo quitarlo | Solo resultado de búsqueda |

**NOT_VERIFIED / NOT_AVAILABLE de este runbook**

- Tipo exacto de la Dev Store y si su contraseña puede quitarse (D1 frente a D2).
- Que Colombia aparezca como región del banner, y cómo se detecta la región de la visitante.
- Que Colombia sea "país soportado" para el canal de Meta; requisitos de plan; requisitos de Instagram.
- Comportamiento del consent mode de la app de Google donde no hay banner; si envía `default: granted` (solo fuente de la comunidad).
- Que DebugView capture el checkout; pasos exactos de Test Events (página de Meta no legible); que aparezcan en Test Events los eventos de servidor de la app.
- Que `product_added_to_cart` y `product_removed_from_cart` disparen con el alta AJAX del drawer.
- Si un pedido de prueba (Bogus o modo de prueba) dispara `checkout_completed` y se reenvía como `purchase`.
- A qué campo del pedido corresponde `transaction_id` de la app; qué `event_id` usa la app de Meta; si `item_id` es id de producto o de variante.
- Cómo deduplica Shopify pixel y Conversions API (Meta documenta el mecanismo, no la app).
- Si el pedido se crea cuando la clienta no vuelve de Wompi; reembolsos desde Shopify.
- Cookies que emite esta tienda y con qué consentimiento.
- Si existe aún un campo heredado de Google Analytics en las preferencias de la tienda.
- Cómo se ve el enlace "Cookie preferences" en el theme Radaelli.
- Etiquetas en español del Admin; tamaño máximo del código de un custom pixel (heredado de 03E); persistencia de `_ga` en el sandbox (heredado de 03E).
- Todos los IDs (`G-…`, dataset de Meta, cuentas): **NOT_AVAILABLE**, los entrega la dueña.
