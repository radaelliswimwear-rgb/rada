# 03E: Wompi en Shopify (Colombia), factibilidad

- **Fecha:** 2026-09-29 (Bogotá). Todas las fuentes web se leyeron hoy.
- **Qué se hizo:**
  - lectura del repo (sitio Next.js y reportes 03D/03E);
  - fuentes oficiales: help.shopify.com, shopify.dev, apps.shopify.com, docs.wompi.co y wompi.com; además, dos páginas comerciales de shopify.com (E4, E20), marcadas como tales.
- **Revisión adversarial (2026-09-29):** se re-abrieron las citas del repo y se re-leyeron las fuentes con peso en el veredicto. Correcciones: reembolsos de Wompi (E37), convivencia de las dos apps y orden de credenciales (E5, E9), E31 confirmado en shopify.dev, y precisiones sobre el documento previo (sección 3).
- **Qué NO se hizo:**
  - no se tocó la Dev Store: sin Admin, sin browser y sin CLI;
  - no se instaló nada, no se escribió ninguna credencial y no se contactó a nadie.
- **Base medida hoy** (ver `theme/03E-checkout-baseline-report.md`):
  - **C1:** el mercado principal sigue siendo EE. UU.
  - **C2:** no hay zona de envío Colombia, así que el catálogo figura agotado para CO.
  - **Pagos:** no hay ningún proveedor activo.
- **Convenciones:**
  - **Confianza:** ALTA = leído hoy en la fuente oficial; MEDIA = leído, pero el alcance o la aplicación a esta tienda es inferido; BAJA = indicio.
  - **NOT_VERIFIED** = no se pudo confirmar con una fuente permitida. **NOT_AVAILABLE** = el dato no existe en el repo.
  - Las fuentes están parafraseadas, con una sola cita textual.

---

## 1. Veredicto ejecutivo

**SUPPORTED VIA OFFICIAL APP/PROVIDER**

### Justificación

1. **Shopify Payments no existe en Colombia.** Colombia no figura en la lista oficial de países (E1). Por eso **no puede ser SUPPORTED DIRECTLY**: todo cobro con tarjeta o PSE pasa por un proveedor externo o por un método manual.
2. **Wompi publica su integración oficial con Shopify** (E5), con dos variantes, ambas de "Wompi Co" (el desarrollador del listado):
   - **Redirección** (tarjetas, PSE, Nequi, Daviplata, QR y Botón Bancolombia, efectivo en corresponsales): se instala desde Configuración > Pagos > proveedores alternativos, con un ID de proveedor propio (E5, E6).
   - **Tarjetas on-site:** app "Wompi Tarjetas" del App Store, solo tarjetas y embebida en el checkout (E7).
3. **La integración tiene modo de prueba** con credenciales sandbox (E9), y Shopify admite probar en una Dev Store con un proveedor en modo de prueba (E25). Salvedad: la doc de Wompi carga primero las credenciales de producción (ver abajo).
4. **No hace falta desarrollar nada.** Además, desarrollar una integración propia **no está permitido** para un comercio normal (E23).

### Qué NO afirma este veredicto

Todo esto sigue abierto (NOT_VERIFIED):

- Que la app se pueda instalar **en esta tienda hoy**:
  - la lista de proveedores del Admin se filtra por la dirección de la tienda, que hoy está en EE. UU. (E3, E36);
  - el listado del App Store mostró un aviso genérico de incompatibilidad a un visitante anónimo (E6).
- Que se pueda conectar la app **solo en modo de prueba**: la doc de Wompi pide cargar primero las credenciales de producción y después las de prueba (E9). Si la cuenta Wompi no está aprobada para producción, esto puede bloquear la prueba.
- Cómo maneja la app de Wompi los **reembolsos** desde Shopify, los **pagos pendientes** (PSE, efectivo) y el caso de la clienta que **no vuelve** a la tienda. La doc del plugin no lo cubre (E12). Wompi sí documenta una API de reembolsos (E37), pero no dice si la app de Shopify la usa.
- Que una prueba real (con dinero) pueda hacerse en esta Dev Store. **No se puede** (E25).

---

## 2. Respuestas directas

| # | Pregunta | Respuesta | Conf. |
|---|---|---|---|
| 1 | ¿Qué proveedores admite Shopify para Colombia? | Shopify filtra la lista de proveedores externos **por la dirección de la tienda**, en Configuración > General (E3). La lista pública por país carga de forma dinámica y hoy no fue legible (E4).<br>**Verificados hoy en fuente oficial:** Wompi publica su integración para Shopify (redirección + Tarjetas; E5–E7), pero que el Admin la liste para esta tienda con dirección en CO es NOT_VERIFIED (E3, E36). También los métodos de pago manuales (E32) y la pasarela de prueba (solo pruebas).<br>**PayU Latam y Mercado Pago como pasarela:** NOT_VERIFIED (E34).<br>**ePayco:** su listado del App Store dice que hoy no está disponible (E33). | ALTA / NOT_VERIFIED según el ítem |
| 2 | ¿Shopify Payments en CO? | **No.** Solo México en Latinoamérica (E1). Colombia no está bloqueada para operar una tienda (E2) | ALTA |
| 3 | ¿Integración oficial Wompi–Shopify? | **Sí, las dos variantes son de Wompi Co:**<br>- **Redirección:** proveedor alternativo de pago, instalado desde Configuración > Pagos (E5). En el App Store existe el listado "Wompi Pagos", del mismo desarrollador y con los mismos medios (E6); que sea exactamente la misma integración es inferencia (MEDIA).<br>- **Tarjetas on-site:** app "Wompi Tarjetas" (E7).<br>- **Convivencia:** la doc de Wompi describe cómo agregar Tarjetas cuando la redirección ya está configurada (primero los webhooks y la redirección, después Tarjetas). Eso indica que conviven; no se probó (E5, MEDIA).<br>Es un proveedor aprobado en la plataforma de pagos de Shopify, no una app custom. **Discrepancia menor:** la página de partner "Wompi Co" muestra 0 apps (E8) | ALTA |
| 4 | ¿Cómo se activa? | 1. Configuración > Pagos > proveedor Wompi → `Conectar` → `Instalar app` (consentimiento OAuth).<br>2. Cargar las credenciales pública y secreta, que se sacan de Wompi > Desarrollo > Desarrolladores. La doc pide **primero las de producción** (`Conectar`, `Entendido`) y **después las de prueba** (`Conectar en modo prueba`); luego se habilitan los medios de pago y se pulsa `Activar`. Conectar solo con las de prueba: NOT_VERIFIED.<br>3. Configurar la URL de eventos en el panel de Wompi.<br>4. En el checkout de Shopify: email como contacto y teléfono **requerido** en la dirección de envío (E9–E11) | ALTA |
| 5 | ¿KYC? | Cuenta de comercio Wompi:<br>- **Persona natural:** documento + RUT.<br>- **Persona jurídica:** documento del representante legal + RUT.<br>- **Cuenta Bancolombia:** con más de 30 días de antigüedad (se lee para persona natural).<br>- **Primer desembolso de persona natural:** 30 días después de la primera transacción.<br>- **Cámara de Comercio:** aparece solo en un resultado de búsqueda (NOT_VERIFIED).<br>Si la cuenta Wompi actual de Radaelli está aprobada para producción: NOT_VERIFIED (E18) | MEDIA |
| 6 | ¿Sandbox / modo de prueba? | **Sí:**<br>- botón "Conectar en modo prueba" con llaves sandbox;<br>- la doc pide conectar **antes** las credenciales de producción, así que el modo prueba aislado (sin cuenta aprobada para producción) es NOT_VERIFIED;<br>- el sandbox no mueve dinero;<br>- hay datos de prueba por medio de pago (E9, E16, E17).<br>**Riesgo:** reseñas de "Wompi Tarjetas" reportan fallas al validar credenciales en modo prueba (E7) | ALTA / MEDIA |
| 7 | ¿Se puede probar en la Dev Store? | **Solo sin dinero real:** pasarela de prueba ("Bogus") o proveedor en modo de prueba. No se admiten transacciones reales, tarjetas de regalo ni store credit (E25–E27). Detalle en la sección 7 | ALTA |
| 8 | ¿COP? | Wompi opera **solo en COP**, con montos en centavos (E14). La tienda ya está en COP (`theme/03B-store-foundation-report.md:21`), aunque hoy el checkout se muestra con formato es-US (C1) | ALTA |
| 9 | ¿Reembolsos? | **Plataforma:** la API de apps de pago de Shopify admite reembolsos iniciados desde el Admin (E24).<br>**Wompi:** su API tiene `void` **solo para tarjetas** (E15) y, además, una **API de reembolsos V2** (`POST /v1/refunds`, total o parcial), documentada con simulador de Sandbox. La página no dice qué medios de pago admite ni confirma su disponibilidad en producción (E37).<br>**Qué hace la app de Wompi ante un reembolso desde Shopify** (sobre todo PSE, Nequi o efectivo): **NOT_VERIFIED**. La doc del plugin no lo menciona (E12) | ALTA / NOT_VERIFIED |
| 10 | ¿Webhooks? | La URL de eventos de la integración apunta a un dominio del integrador (`wompi-event-shopify.conexa.ai`), configurado por la dueña en el panel de Wompi, en sandbox y en producción (E10).<br>Wompi: **una URL de eventos por ambiente** y hasta 3 reintentos en 24 h (E13).<br>El comercio **no ve** ese procesamiento | ALTA |
| 11 | ¿Retorno y estado del pedido? | **Redirección:** la clienta paga en Wompi y vuelve a la tienda (E5).<br>**API de apps de pago:** la app resuelve, rechaza o deja **pendiente** la sesión (vencimiento recomendado de 3 días como máximo). Shopify no manda el ID del pedido en la sesión (E24).<br>**Si la app de Wompi usa esta API** y **si el pedido se crea cuando la clienta no vuelve:** NOT_VERIFIED. El doc previo del repo cita un hilo de la comunidad (fecha NOT_VERIFIED) con pedidos "abandonados" pese al pago; **no es fuente primaria**, queda como antecedente | ALTA (API) / NOT_VERIFIED (Wompi) |
| 12 | ¿Qué implica para la extensibilidad del checkout? | - El checkout es nativo de Shopify; las extensiones UI en información, envío y pago son **solo Plus** (E28).<br>- Ocultar, renombrar o reordenar medios de pago se hace con una *payment customization function*: vía app **pública** en cualquier plan, o app **custom** solo en Plus (E29, E30).<br>- **Redirección:** la clienta sale a la página de Wompi. **Tarjetas:** campos embebidos (E5, E7).<br>- Gracias / Estado del pedido: extensiones disponibles en todos los planes salvo Starter (E31) | ALTA |
| 13 | ¿Qué plan hace falta? | Instalar un proveedor de pago externo **no** requiere Plus: Shopify publica la comisión por proveedor externo para Basic, Grow y Advanced (E20, E21). La doc de Wompi no pide ningún plan (E12), y el listado "Wompi Pagos" muestra un bloque de compatibilidad sin criterios legibles (E6). En producción hace falta un plan pago, porque una Dev Store no procesa dinero real (E25) | ALTA (plataforma) / MEDIA (Wompi) |
| 14 | ¿Puede un comercio normal tener una app de pagos propia? | **No:**<br>- solo **Partners aprobados** construyen extensiones de pago, y Shopify aprueba cada app;<br>- las extensiones de pago custom quedan limitadas a comercios Plus elegibles (E23).<br>El Wompi propio del sitio Next.js **no se puede portar** como app de pago | ALTA |
| 15 | ¿Qué comisiones hay publicadas? | **Shopify por proveedor externo:** Basic 2 %, Grow 1 %, Advanced 0,6 %, Plus 0,2 % (E20). No aplican a métodos manuales ni a pedidos de prueba (E22).<br>**Wompi Plan Avanzado:** 2,65 % + $700 + IVA por transacción exitosa; QR 1 %; Puntos Colombia +1,44 %.<br>**Wompi Plan Gateway:** sin comisión de Wompi, más de 2.000 transacciones y contrato con Bancolombia (E19).<br>**Retenciones:** NOT_VERIFIED en fuente permitida | ALTA |

### Ejemplo aritmético con tarifas publicadas

- **Supuestos:**
  - 1 × BRISA NATURAL BEIGE a $199.920, el precio real medido en 03E;
  - IVA del 19 % **sobre la comisión** de Wompi (interpretación, NOT_VERIFIED);
  - sin retenciones ni envío;
  - la base exacta de la comisión de Shopify es NOT_VERIFIED.
- **Costos por venta:**

| Concepto | Monto |
|---|---|
| Wompi Plan Avanzado (2,65 % → $5.297,88, + $700, + IVA $1.139,70) | **≈ $7.137,58** |
| Shopify Basic (2 %) | $3.998,40 → total **≈ $11.136 (≈ 5,6 %)** |
| Shopify Grow (1 %) | $1.999,20 → total **≈ $9.137 (≈ 4,6 %)** |
| Shopify Advanced (0,6 %) | $1.199,52 → total **≈ $8.337 (≈ 4,2 %)** |

- **Plan de Shopify:** los precios mensuales que muestra la página (Basic US$19, Grow US$49, Advanced US$299) dependen de la modalidad de facturación, que no se verificó (NOT_VERIFIED).
- **No es una recomendación de plan.**

---

## 3. Tabla de evidencia

Todas las fuentes se vieron el **2026-09-29**.

| ID | Afirmación | Fuente | Conf. |
|---|---|---|---|
| E1 | Shopify Payments requiere que el negocio esté en un país de la lista. Colombia no está; de LatAm solo figura México | https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries | ALTA |
| E2 | Colombia no figura entre los países y regiones no soportados por Shopify | https://help.shopify.com/en/manual/compliance/legal/unsupported-countries-and-regions | ALTA |
| E3 | La lista de proveedores externos del Admin está "filtered based on your store's address in Settings > General" (help.shopify.com) | https://help.shopify.com/en/manual/payments/third-party-providers/configuring-providers | ALTA |
| E4 | La disponibilidad de pasarelas depende del país. La lista oficial está en shopify.com/payment-gateways, pero carga de forma dinámica y no fue legible | https://help.shopify.com/en/manual/payments/third-party-providers/payment-gateway-availability · https://www.shopify.com/co/aceptar-pagos-en-linea?country=co&lang=es | ALTA / lista NOT_VERIFIED |
| E5 | Wompi declara una integración oficial con Shopify:<br>- redirección, instalada desde Configuración > Pagos > proveedores alternativos (enlace al Admin con ID de proveedor `11927553`);<br>- tarjetas on-site vía la app `wompi-native`;<br>- aviso "IMPORTANTE": si la app de redirección ya está configurada, primero se configuran los webhooks y se verifica la redirección, y después se instala Tarjetas On-site (convivencia implícita) | https://docs.wompi.co/docs/colombia/wompi-shopify-plugin/ · https://docs.wompi.co/en/docs/colombia/wompi-shopify-plugin/ | ALTA |
| E6 | "Wompi Pagos":<br>- desarrollador Wompi Co (Medellín), lanzada el 2022-09-07;<br>- 0 reseñas, solo en español;<br>- instalación gratis, se cobran comisiones de procesamiento;<br>- tarjetas, PSE, Nequi, corresponsales y Botón Bancolombia;<br>- menciona el modo de pruebas.<br>A un visitante anónimo le mostró un aviso de incompatibilidad (sentido NOT_VERIFIED) | https://apps.shopify.com/wompi-pagos | ALTA / MEDIA (aviso) |
| E7 | "Wompi Tarjetas":<br>- Wompi Co, lanzada el 2025-07-07, gratis;<br>- 3,5★ con 5 reseñas;<br>- Visa, Mastercard y Amex embebidas en el checkout;<br>- las reseñas negativas citan fallas de credenciales y de modo prueba | https://apps.shopify.com/wompi-native | ALTA (listado) / MEDIA (reseñas) |
| E8 | La página de partner "Wompi Co" muestra 0 apps, aunque los dos listados directos existen | https://apps.shopify.com/partners/wompi-co1 | ALTA (observación); impacto NOT_VERIFIED |
| E9 | - Credenciales: clave pública + secreto, de pruebas y de producción, desde Wompi > Desarrollo > Desarrolladores.<br>- Orden de la doc: primero las de producción (`Conectar` → `Entendido`), después las de prueba (`Conectar en modo prueba`), luego habilitar medios y `Activar`.<br>- La doc no dice si se puede conectar solo en modo prueba | https://docs.wompi.co/docs/colombia/wompi-shopify-plugin/ | ALTA |
| E10 | La URL de eventos es `https://wompi-event-shopify.conexa.ai/api/v1/shopify/webhooks/event`, en Wompi > Desarrolladores > Seguimiento de transacciones, también en modo prueba | ídem | ALTA |
| E11 | Wompi pide en el checkout de Shopify: email como método de contacto y teléfono "Requerido" en la dirección de envío | ídem | ALTA |
| E12 | La doc del plugin no menciona reembolsos, estados del pedido, pedidos abandonados ni plan de Shopify | ídem | ALTA (ausencia) |
| E13 | Wompi usa una URL de eventos por ambiente (sandbox / producción). Si el endpoint no responde 200, reintenta hasta 3 veces en 24 h (30 min, 3 h, 24 h) | https://docs.wompi.co/en/docs/colombia/eventos/ | ALTA (reintentos) / MEDIA (si admite más de una URL: la doc no lo dice) |
| E14 | Wompi opera solo en COP, con montos en centavos | https://docs.wompi.co/en/docs/colombia/transacciones/ | ALTA |
| E15 | Estados finales: APPROVED, DECLINED, VOIDED (solo tarjetas) y ERROR. Hay `void` por API, "solo para ciertos estados" | ídem | ALTA |
| E16 | Sandbox `sandbox.wompi.co/v1` y producción `production.wompi.co/v1`, con prefijos de llave `*_test_` / `*_prod_` | https://docs.wompi.co/en/docs/colombia/ambientes-y-llaves/ | ALTA |
| E17 | Datos de prueba del sandbox:<br>- tarjeta aprobada 4242 4242 4242 4242 y rechazada 4111 1111 1111 1111;<br>- PSE con código de banco 1 (aprueba) o 2 (rechaza);<br>- Nequi y Daviplata con valores publicados.<br>No mueve dinero real | https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/ | ALTA |
| E18 | Cuenta Wompi:<br>- persona natural (documento + RUT) o jurídica (documento del representante legal + RUT);<br>- cuenta Bancolombia con más de 30 días;<br>- primer desembolso de persona natural a 30 días | https://wompi.com/es/co/ayuda/como-crear-cuenta | MEDIA |
| E19 | - **Plan Avanzado:** 2,65 % + $700 + IVA; QR 1 %; Puntos Colombia +1,44 %; el dinero llega el día hábil siguiente.<br>- **Plan Gateway:** tarifas negociadas con el banco, más de 2.000 transacciones | https://wompi.com/es/co/planes-tarifas/ | ALTA |
| E20 | Comisión de Shopify por proveedor externo: Basic 2 %, Grow 1 %, Advanced 0,6 %, Plus 0,2 %. Precios de plan en USD | https://www.shopify.com/co/precios (página oficial de precios de Shopify; no está en la lista de dominios del encargo, porque help.shopify.com no publica los porcentajes y remite a ella) | ALTA (dato) |
| E21 | El Help Center no publica los porcentajes: remite a la página de precios y a Configuración > Facturación | https://help.shopify.com/en/manual/your-account/manage-billing/billing-charges/types-of-charges/third-party-charges/third-party-transaction-fees | ALTA |
| E22 | No se cobra comisión de transacción por métodos manuales, pedidos de prueba, POS ni borradores | ídem · https://help.shopify.com/en/manual/payments/manual-payments | ALTA |
| E23 | - Solo Partners aprobados construyen extensiones de pago, y cada app de pago debe aprobarla Shopify.<br>- Las extensiones de pago custom quedan limitadas a comercios Plus elegibles.<br>- Existe una extensión *offsite* (redirección) | https://shopify.dev/docs/apps/build/payments | ALTA |
| E24 | API de apps de pago:<br>- `paymentSessionResolve` / `Reject` / `Pending`;<br>- un pendiente vence, recomendado, en 3 días como máximo;<br>- reembolsos: Shopify llama a la app, que resuelve con `refundSessionResolve`;<br>- el campo `test` indica modo de prueba;<br>- no se incluye el ID del pedido | https://shopify.dev/docs/apps/build/payments/processing · https://shopify.dev/docs/api/payments-apps/latest/mutations/paymentSessionPending · https://shopify.dev/docs/apps/build/payments/request-reference | ALTA (API). Si la app de Wompi la usa: NOT_VERIFIED |
| E25 | Dev stores:<br>- se prueba con la pasarela Bogus o con el proveedor en modo de prueba;<br>- sin transacciones reales, tarjetas de regalo ni store credit;<br>- **no se convierten a tiendas de producción** ni se transfieren;<br>- la página de contraseña no se puede quitar ni reemplazar por una propia;<br>- se elige un plan (Basic/Grow/Advanced/Plus) al crearlas | https://shopify.dev/docs/apps/build/dev-dashboard/development-stores | ALTA |
| E26 | Tiendas de desarrollo (client transfer):<br>- activar la "Test payment gateway" en Configuración > Pagos, desactivando antes el proveedor activo;<br>- número de tarjeta `1` (éxito), `2` (falla), `3` (excepción);<br>- pedidos de prueba ilimitados;<br>- los métodos manuales **no** sirven para pruebas | https://help.shopify.com/en/partners/dashboard/managing-stores/test-orders-in-dev-stores | ALTA (para ese tipo de tienda) |
| E27 | No todos los proveedores externos tienen modo de prueba en Shopify; si falta, se usa la pasarela de prueba. Los pedidos de prueba no aparecen en payouts ni reportes | https://help.shopify.com/en/manual/checkout-settings/test-orders/payments-test-mode | ALTA |
| E28 | Las extensiones UI de los pasos de información, envío y pago son solo Plus | https://shopify.dev/docs/api/checkout-ui-extensions | ALTA |
| E29 | Las apps públicas con Functions sirven en cualquier plan; las apps custom con Functions, solo en Plus | https://shopify.dev/docs/api/functions | ALTA |
| E30 | La payment customization function permite renombrar, reordenar y ocultar medios de pago | https://shopify.dev/docs/api/functions/latest/payment-customization | ALTA |
| E31 | Las extensiones posteriores a la compra (Gracias / Estado del pedido) están disponibles en todos los planes salvo Starter; las de información, envío y pago, solo en Plus | https://shopify.dev/docs/api/checkout-extensions | ALTA |
| E32 | Métodos manuales:<br>- se crean en Configuración > Pagos > Métodos de pago manuales (también uno personalizado con nombre e instrucciones);<br>- el pedido queda "Pendiente" hasta marcarlo como pagado;<br>- las instrucciones se ven en la confirmación | https://help.shopify.com/en/manual/payments/manual-payments | ALTA |
| E33 | El listado "ePayco" del App Store indica que la app no está disponible hoy | https://apps.shopify.com/epayco | ALTA (observación) |
| E34 | **PayU Latam y Mercado Pago como pasarela para CO: NOT_VERIFIED.**<br>- El App Store solo mostró apps de PayU India y PayU GPO (Europa).<br>- De Mercado Pago aparecieron apps accesorias: antifraude, orden de checkouts y banner.<br>- Las pasarelas se listan en el Admin, no necesariamente en el App Store | https://apps.shopify.com/partners/payu-sa2 · https://apps.shopify.com/partners/mercadopago-latam | NOT_VERIFIED |
| E35 | La Dev Store se creó con "plan de prueba Basic", y los visitantes siempre ven la página de contraseña de Shopify, no la del theme. Los dos indicios coinciden con una dev store del Dev Dashboard (E25: plan elegido al crear; contraseña no reemplazable). Su tipo exacto sigue NOT_VERIFIED | `theme/pre-development-store-checklist.md:57` · `theme/03B-store-foundation-report.md:142` | MEDIA |
| E36 | La entidad y la dirección de la tienda están hoy en EE. UU. | `theme/03B-store-foundation-report.md:270` · `theme/03E-checkout-baseline-report.md:29-37` | ALTA (medido) |
| E37 | API de reembolsos V2 de Wompi: `POST /v1/refunds`, total o parcial, con llave privada. La página documenta el simulador de Sandbox (Colombia y Panamá); no dice qué medios admiten reembolso ni confirma producción | https://docs.wompi.co/en/docs/colombia/reembolsos-sandbox/ | ALTA (existencia) / NOT_VERIFIED (medios, producción, uso por la app) |

### Contradicciones con el documento previo `docs/shopify/wompi-payments.md`

Ese archivo está en el checkout principal, no en este worktree. Lo investigado el 2026-09-26 se contrasta en seis puntos: cuatro difieren, uno coincide y uno se aclara.

1. **Integración:** hablaba de una sola app, "Wompi Pagos", que ya incluía la opción de tarjetas embebidas (`wompi-payments.md:30-32`, `:80`). Hoy esa opción es una **app separada**, "Wompi Tarjetas" (App Store, 2025-07-07; E7), y la redirección se instala como proveedor alternativo (E5).
2. **ePayco:** "app oficial confirmada" (`:83`). **Hoy** el listado dice que no está disponible (E33).
3. **PayU Latam y Mercado Pago:** los listaba como opciones (`:81-82`): PayU Latam como app oficial "v2" y Mercado Pago como app de un tercero, no de Mercado Pago. **Hoy no se pudieron verificar** con fuentes permitidas (E34).
4. **Pedidos "abandonados" pese al pago:** el hallazgo (`:55-57`) se apoya en `community.shopify.com`, que **no** es fuente primaria para este encargo. Queda como riesgo a confirmar con Wompi, no como hecho.
5. **Comisiones:** 2 / 1 / 0,6 / 0,2 % (`:72`). **Coincide** con lo visto hoy (E20).
6. **Comisión en métodos manuales:** el doc previo la dejaba en "REQUIERE CONFIRMACIÓN" por un hilo de la comunidad (`:74`). La fuente oficial de hoy los exime (E21, E22). El hilo no es fuente primaria; conviene igual revisar la primera factura real.

---

## 4. Qué NO se puede reutilizar del sitio Next.js

Con Shopify, el checkout lo maneja Shopify y la transacción la crea la app de Wompi. El código propio de Radaelli **no participa** del cobro. Rutas relativas a la raíz del repo.

| Pieza actual | Dónde | Por qué no se reutiliza |
|---|---|---|
| URL del Checkout Web alojado + firma de integridad (referencia + monto + moneda + expiración + secreto) | `lib/payments/providers/wompi-gateway.ts:58-78`, `:141-205` | La app de Wompi arma su propia transacción. Shopify no expone un punto donde firmar |
| Tokens de aceptación / Habeas Data (`/merchants/info`) y links a los contratos | `lib/payments/providers/wompi-gateway.ts:214-244`, `components/checkout/payment-form.tsx:164` | Los presenta (o no) la página de Wompi dentro de su integración: NOT_VERIFIED. El checkout de Shopify no permite agregar casillas en el paso de pago fuera de Plus (E28) |
| Webhook propio: HMAC en tiempo constante, re-verificación contra la API, 502 para forzar reintento, 200 ante eventos con forma inesperada | `app/api/webhooks/wompi/route.ts:37-72`, `:145-173`, `:198-201` | La URL de eventos apunta al integrador (E10) y es **una por ambiente** (E13). El comercio no ve ni controla ese procesamiento |
| Reserva de stock y precio **antes** de pagar, TTL de 30 min alineado con `expiration-time` | `lib/payments/payments-actions.ts:173`, `:591`, `:384-393` | El inventario y el vencimiento los maneja Shopify. No hay equivalente para "reservar en el instante del intento" |
| Retorno `/checkout/wompi/retorno?id=` + confirmación server-side | `app/checkout/wompi/retorno/page.tsx:6-10`, `lib/payments/payments-actions.ts:773` | Lo reemplaza la página de Gracias / Estado del pedido de Shopify |
| Aplicación idempotente de eventos + verificación de pendientes | `lib/payments/payments-actions.ts:999`, `:1215` | Queda del lado de la app de Wompi |
| Cron que libera pagos viejos y concilia contra Wompi | `app/api/cron/release-stale-payments/route.ts:12-30` | Shopify no ofrece un cron del comercio sobre pagos de un proveedor externo. Automatizarlo exigiría una app propia que lea Wompi y escriba en Shopify: fuera de alcance y NOT_VERIFIED |
| Conciliación (material de diseño, no conectado) | `lib/payments/reconciliation.ts:5-45`, `:108-113` | Sigue siendo solo diseño. Con Shopify, la conciliación manual es por pedido |
| Pista de tarjetas de prueba en la UI | `lib/payments/config.ts:63-76` | El checkout es nativo y el theme no lo toca |
| Selector "Pagar online" / "Continuar por WhatsApp" con pedido pendiente | `components/checkout/checkout-content.tsx:108`, `:341`; `lib/payments/payments-actions.ts:241` | Solo se replica como **método de pago manual** de Shopify (E32; ver `theme/cart-report.md:173-177`) |
| Variables `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` (solo los nombres; no se leyó ningún `.env`) | `wompi-gateway.ts:14-16`, `route.ts:42` | En Shopify, las credenciales las escribe la dueña en la configuración de la app. **Nunca** van en el theme |

**Lo único reutilizable es conocimiento:**

- el mapeo de estados de Wompi (`lib/payments/wompi-status-mapping.ts`);
- los datos de prueba del sandbox;
- el aprendizaje de que "pendiente después de 30 min" puede ser un pago aprobado sin webhook (`app/api/cron/release-stale-payments/route.ts:22-30`). Sirve para el runbook de conciliación manual.

---

## 5. Árbol de decisión

Neutral: no hay recomendación.

```
0. PRERREQUISITO COMÚN (bloqueante para cualquier camino; sección 8)
   Dirección de la tienda en CO + Colombia como mercado principal + zona de envío Colombia
   │
   ├─ ¿Aparece Wompi en Configuración > Pagos con la dirección en CO?
   │    ├─ SÍ → PATH A (Wompi oficial)
   │    │        ├─ A-redirección: tarjetas, PSE, Nequi, Daviplata, Bancolombia, efectivo (sale a Wompi)
   │    │        └─ A-tarjetas: "Wompi Tarjetas" (solo tarjetas, embebido)
   │    │           (ambas juntas: la doc de Wompi pide instalar Tarjetas después de
   │    │            verificar la redirección; convivencia implícita, no probada: E5)
   │    └─ NO  → pedir soporte a Wompi (owner) y/o evaluar PATH B
   │
   └─ PATH B (otras opciones oficiales, lista neutral)
        ├─ B1. Otro proveedor externo que el Admin liste para una tienda en CO
        │      (nombres NOT_VERIFIED hoy; ver E34/E33)
        ├─ B2. Método de pago manual (p. ej., transferencia o coordinación por WhatsApp):
        │      pedido "Pendiente" y cobro fuera de Shopify; sin comisión de Shopify (E22, E32)
        ├─ B3. Combinaciones de B1/B2 con PATH A
        └─ Descartadas por fuente oficial:
             · Shopify Payments: no existe en CO (E1)
             · App de pago propia (portar el Wompi del Next.js): solo Partners aprobados
               o Plus elegible (E23)
```

---

## 6. Pasos owner-only exactos por camino

- **Por qué owner-only:** todos implican cuentas, consentimientos OAuth, credenciales, configuración de pagos o dinero.
- **Datos de tarjeta, aunque sean de prueba:** Claude **no** los escribe en el checkout de la Dev Store, porque no es un host local. Los escribe Daniela; Claude puede observar y documentar.

### 0. Común (antes que nada)

1. **Configuración > General:** dirección de la tienda en **Colombia**. Además de C1, esto define **qué proveedores de pago lista el Admin** (E3).
2. **Configuración > Mercados:** Colombia como mercado principal; decidir qué pasa con EE. UU. (C1).
3. **Configuración > Sucursales:** sucursal de procesamiento en Colombia.
4. **Configuración > Envío y entrega:** zona **Colombia** con las tarifas decididas (C2). Tarifas: NOT_AVAILABLE, decisión de la dueña.
5. **Configuración > Plan:** confirmar el tipo de tienda.
   - Si es una Dev Store del Dev Dashboard, **no se puede convertir a producción** (E25). La tienda de venta real será otra, con plan pago, y ahí habrá que repetir la instalación de pagos.
   - Estado actual: NOT_VERIFIED (E35).

### PATH A: Wompi oficial

1. **Cuenta Wompi (comercios.wompi.co):**
   - confirmar si la cuenta que usa hoy el sitio Next.js está **aprobada para producción** (NOT_VERIFIED);
   - si no hay cuenta: persona natural o jurídica con los documentos de E18.
   - Razón social y NIT: NOT_AVAILABLE en el repo.
2. **Decidir la separación de ambientes en Wompi**, antes de tocar la URL de eventos:
   - Wompi usa **una URL de eventos por ambiente** (E13).
   - El staging de Next.js para el pentest usa **Wompi Sandbox** (`docs/pentest-technical-sheet.md:80`).
   - Apuntar la URL de eventos del sandbox a la integración de Shopify corta los webhooks del staging. Apuntar la de producción cortaría los del sitio en vivo, si hoy usa las llaves de producción (NOT_VERIFIED en el repo).
   - Preguntar a Wompi (owner) si se puede tener un segundo comercio o ambiente para Shopify, o secuenciarlo después del pentest y del cutover.
3. **Configuración > Checkout (Shopify):**
   - método de contacto: **correo electrónico**;
   - teléfono en la dirección de envío: **Requerido**. Lo exige Wompi (E11) y cambia la experiencia de la clienta: decisión de la dueña.
4. **Instalar la variante de redirección:**
   - Configuración > Pagos > agregar método / proveedor alternativo **Wompi**; o el enlace directo del Admin que publica la doc de Wompi (E5).
   - Luego `Conectar` → `Instalar app`, **aceptando los permisos OAuth**.
5. **Credenciales y modo de prueba** (orden de la doc de Wompi, E9):
   - primero las credenciales **de producción** → `Conectar` → `Entendido`;
   - después las **de pruebas** (Wompi > Desarrollo > Desarrolladores) → `Conectar en modo prueba`;
   - habilitar los medios de pago → `Activar`, y verificar en Configuración > Pagos que Wompi figura activo;
   - si la cuenta no tiene credenciales de producción aprobadas, preguntar a Wompi si se puede conectar solo en modo prueba (NOT_VERIFIED).
6. **URL de eventos (sandbox):** en Wompi > Desarrolladores > Seguimiento de transacciones, pegar la URL de E10 y guardar. Solo si el paso 2 lo permite.
7. **(Opcional) "Wompi Tarjetas":**
   - instalar desde https://apps.shopify.com/wompi-native (`Instalar`, permisos OAuth) y conectarla en modo prueba;
   - según la doc de Wompi, se instala **después** de tener la redirección y sus webhooks funcionando (E5). Convivencia implícita, no probada.
8. **Correr la matriz de la sección 7.2**, con la dueña tipeando los datos de prueba.
9. **Pedir por escrito a Wompi** (owner):
   - reembolsos desde el Admin de Shopify por medio de pago, y si la app usa la API de reembolsos V2 (E37);
   - si se puede conectar la app solo en modo prueba;
   - comportamiento con PSE o efectivo pendientes;
   - si el pedido se crea cuando la clienta no vuelve de Wompi;
   - política de reintentos hacia Shopify;
   - rol de `conexa.ai` como tercero que recibe los eventos (relevante para `content/legal/privacidad.html`).
10. **Producción** (en la tienda de producción, con plan pago):
    - credenciales **de producción**;
    - URL de eventos de producción;
    - una compra real de bajo monto + reembolso, hecha por la dueña;
    - apagar Wompi en el sitio Next.js dentro de la misma ventana de cutover (por el conflicto del paso 2).
11. **Legales:** ajustar el párrafo "Pago" de `content/legal/terminos.html` y la sección de terceros de `privacidad.html` al flujo final (ver `theme/03D-legal-policies-inventory.md:19-20`).

### PATH B: otras opciones oficiales

Lista neutral: no hay recomendación.

- **B1. Otro proveedor externo:**
  1. Con la dirección ya en CO (paso 0.1), abrir **Configuración > Pagos** y ver la lista de proveedores que ofrece el Admin.
  2. Pasarle a Claude una captura, para documentar los nombres (hoy NOT_VERIFIED).
  3. Para el proveedor elegido: cuenta y KYC propios del proveedor (requisitos NOT_VERIFIED), luego `Activar` en Configuración > Pagos con sus credenciales.
  4. Si tiene modo de prueba, usarlo. Si no, usar la pasarela de prueba (E27).
- **B2. Método de pago manual:**
  1. Configuración > Pagos > **Métodos de pago manuales** > crear uno personalizado: nombre, detalles e instrucciones. El copy es NOT_AVAILABLE; lo escribe la dueña.
  2. Operación: cada pedido queda **Pendiente** y se marca como pagado a mano (E32). No paga comisión de Shopify (E22).
  3. **Pruebas:** en las tiendas de desarrollo de tipo *client transfer*, los métodos manuales **no** sirven para pedidos de prueba (E26). En esta tienda: NOT_VERIFIED.
- **B3. No disponibles** (sin pasos): Shopify Payments (E1) y app de pago propia (E23).

---

## 7. Qué se puede probar en la Dev Store sin dinero real

**Hoy no se puede completar ningún pedido:** no hay proveedor activo y CO figura agotado. Activar cualquier pasarela, incluida la de prueba, es un cambio de configuración de pagos, así que es **owner-only**.

### 7.1 Pasarela de prueba de Shopify ("Bogus" / "Test payment gateway")

- **Activación:** Configuración > Pagos → desactivar el proveedor activo, si hay → activar la pasarela de prueba (E26).
- **Tarjetas:** el número `1` aprueba, `2` falla y `3` provoca una excepción.

| Qué valida | Qué no valida |
|---|---|
| Creación del pedido en COP, emails de Shopify, página de Gracias / Estado del pedido, reembolso desde el Admin sobre un pedido de prueba (comportamiento exacto NOT_VERIFIED), cálculo de envío de la zona CO | Nada de Wompi: ni redirección, ni PSE, ni eventos, ni pendientes |

### 7.2 Wompi en modo de prueba

- **Requisitos:** los pasos A1–A6.
- **Datos de prueba:** E17. Los de Nequi y Daviplata se leen en la doc de Wompi; no se copian acá.

| Caso | Qué observar en Shopify |
|---|---|
| Tarjeta aprobada (4242…) | Pedido creado, estado de pago, total en COP = monto en Wompi |
| Tarjeta rechazada (4111…) | Sin pedido o pago fallido; mensaje a la clienta |
| PSE código 1 / 2 | **Pendiente → aprobado o rechazado:** ¿cómo figura el pedido mientras tanto? (E24: pendiente de 3 días como máximo) |
| Pagar y **cerrar la pestaña** sin volver | ¿Aparece el pedido? ¿O queda como checkout abandonado? (riesgo abierto, sección 4) |
| Reembolso total y parcial desde el Admin | ¿Llega a Wompi? ¿Por qué medio? (NOT_VERIFIED; Wompi documenta reembolsos V2 en Sandbox: E37) |
| Evento demorado o reintentado | Que no se duplique el pedido ni el pago |
| Acordeón "Métodos de pago" de la ficha | Qué íconos muestra `shop.enabled_payment_types` con Wompi activo (`theme-src/sections/main-product.liquid:259`, `:319-322`). NOT_VERIFIED, re-medir |

### 7.3 No se puede probar en la Dev Store

- dinero real;
- credenciales de producción de Wompi;
- tarjetas de regalo y store credit;
- payouts y comisiones reales (los pedidos de prueba no pagan comisión y no aparecen en reportes: E22, E27);
- pedidos de prueba con métodos manuales, al menos en tiendas *client transfer* (E26).

---

## 8. Dependencia: primero mercado y zona de envío Colombia

**Ninguna prueba de checkout que valga para Colombia se puede hacer antes de resolver C1, C2 y la dirección de la tienda:**

1. **C1 (mercado principal EE. UU.):**
   - el checkout abre en `es-us`, con país EE. UU. y formato numérico de EE. UU.;
   - una prueba así no representa a la clienta colombiana.
2. **Dirección de la tienda en EE. UU.** (E36):
   - la lista de proveedores del Admin se filtra por esa dirección (E3);
   - **Wompi podría no aparecer** hasta cambiarla. Es inferencia a partir de E3: NOT_VERIFIED en el Admin.
3. **C2 (sin zona Colombia):**
   - con país CO, los 29 productos figuran agotados y `/cart/add.js` responde 422;
   - no se llega al checkout con una dirección colombiana.
4. **Orden mínimo:** paso 0 (sección 6) → activar la pasarela de prueba **o** Wompi en modo prueba → matriz de la sección 7.
   - Técnicamente se podría completar un pedido con la pasarela de prueba como visitante de EE. UU., pero exigiría una dirección de EE. UU. inventada y no valida nada de Colombia. **No se propone.**

---

## 9. Pendientes NOT_VERIFIED / NOT_AVAILABLE

**NOT_VERIFIED:**

- Tipo exacto de la Dev Store (Dev Dashboard o Partner) y si puede pasar a producción (E25, E35).
- Si Wompi aparece en Configuración > Pagos con la dirección en CO, y el sentido del aviso de incompatibilidad del listado (E3, E6).
- Si la app de Wompi usa la API de apps de pago de Shopify. Qué hace con los reembolsos (por medio de pago; si usa la API de reembolsos V2 de E37, y si esa API está en producción), los pendientes y la clienta que no vuelve.
- Si la app se puede conectar solo en modo prueba, sin credenciales de producción aprobadas (E9).
- Convivencia de la redirección y "Wompi Tarjetas": implícita en la doc (E5), no probada.
- Si la cuenta Wompi actual está aprobada para producción. Si Wompi admite un segundo comercio o ambiente para no pisar la URL de eventos.
- Lista real de proveedores para CO en el Admin (PayU Latam, Mercado Pago y otros).
- Retenciones de Wompi y base exacta de la comisión de Shopify (con o sin envío).
- Si los métodos manuales admiten pedidos de prueba en esta tienda.

**NOT_AVAILABLE:**

- Razón social, NIT y dirección comercial.
- Tarifas de envío de Colombia.
- Copy de un método de pago manual.
- Decisión de plan de Shopify.
