# 03F: Wompi en Shopify, runbook de la dueña (modo prueba, sin dinero real)

- **Fecha:** 2026-09-29 (Bogotá). Las fuentes web nuevas se leyeron hoy (sección 15).
- **Estado: SOLO DOCUMENTO.** No se activó, instaló, conectó ni pagó nada. No se aceptó facturación ni permisos. No se leyó ningún `.env` y no se escribió ninguna credencial.
- **Tienda:** Development Store `radaelli-swimwear-dev`. Theme Radaelli `189072474431` sin publicar. Horizon (`189072113983`) no se toca.
- **Quién ejecuta:** Daniela (cuentas, OAuth, credenciales, tarjetas de prueba). Claude observa, documenta y hace el seguimiento (sección 14).
- **Fuente principal:** [`03E-wompi-shopify-feasibility.md`](03E-wompi-shopify-feasibility.md), con su tabla de evidencia. Se cita como `E#`. Lo nuevo de hoy se cita como `N#` (sección 15).
- **Convenciones:** ALTA = leído hoy en la fuente oficial. MEDIA = leído, pero el alcance o su aplicación a esta tienda es inferido. BAJA = indicio. **NOT_VERIFIED** = no confirmable con una fuente permitida. **NOT_AVAILABLE** = el dato no existe en el repo.
- **Prerrequisito bloqueante:** [`../theme/03F-owner-market-colombia-runbook.md`](../theme/03F-owner-market-colombia-runbook.md) (mercado, país y dirección de la tienda en Colombia). Sin eso, este runbook no se ejecuta (sección 1).

---

## 0. Resumen y reglas duras

1. **Wompi es SUPPORTED VIA OFFICIAL APP/PROVIDER** (E5–E7), pero que el Admin lo muestre con la dirección de la tienda en EE. UU. es NOT_VERIFIED. Por eso el primer paso real es una **compuerta (G1)**: ¿aparece Wompi en Configuración > Pagos con la dirección ya en Colombia?
2. **La doc oficial de Wompi carga primero las credenciales de producción** y después las de prueba (N1, E9). Esta tienda es de desarrollo: **no se cargan credenciales de producción**. Si la pantalla de la app exige producción antes de dejar conectar en modo prueba, **se para** (compuerta G2) y se usa la pasarela de prueba de Shopify (sección 10).
3. **Conflicto de ambientes:** Wompi permite **una URL de eventos por ambiente** (N2). El staging del pentest usa Wompi Sandbox (`docs/pentest-technical-sheet.md:80`). Apuntar la URL de eventos de pruebas a la integración de Shopify corta los eventos del staging. Se decide **antes** de tocar esa URL (sección 6, compuerta G3).
4. **Hoy hay cuatro cosas que ni la doc de Wompi ni la de Shopify confirman** y que las pruebas deben resolver: reembolsos, pagos pendientes, clienta que no vuelve a la tienda y convivencia de las dos apps de Wompi (sección 12).
5. **Sin PSE pendiente en sandbox:** la doc de datos de prueba de Wompi dice que PSE **no tiene estado pendiente** en el sandbox (N4). El caso "pendiente" se prueba con otro medio (sección 9, caso 3). Esto corrige la tabla 7.2 de 03E.
6. **Comisión de Shopify por proveedor externo:** existe, no aplica a pedidos de prueba (sección 11).

### Reglas duras (si algo las rompe, se para)

| # | Regla |
|---|---|
| R1 | **Ninguna credencial de producción** de Wompi en esta Dev Store, ni la URL de eventos de producción. |
| R2 | **Ninguna llave** (ni siquiera de sandbox) en el chat, en capturas, en documentos ni en el theme. Se escriben solo en el formulario de la app, dentro del Admin, y las escribe Daniela. En este documento solo aparecen **nombres** y prefijos públicos. |
| R3 | **No se acepta facturación:** si Shopify o la app piden plan, método de pago, suscripción o "aprobar cargo", **parar** y consultar. |
| R4 | **Sin dinero real.** Solo los datos de prueba publicados por Wompi (N4). Los datos de tarjeta de prueba los tipea Daniela; Claude no los escribe en el checkout de la Dev Store. |
| R5 | **OAuth: solo Daniela.** Claude no acepta permisos por ella. |
| R6 | **Cualquier pantalla no prevista:** capturar (sin llaves ni datos personales), parar y avisar a Claude. |
| R7 | Datos del comprador de prueba: datos propios de Daniela o inventados. Nunca datos de clientas reales. |

---

## 1. Prerrequisito exacto (bloqueante): mercado, país y dirección corregidos primero

Enlace de ejecución: [`../theme/03F-owner-market-colombia-runbook.md`](../theme/03F-owner-market-colombia-runbook.md).

**Por qué es bloqueante para Wompi** (medido en 03E, no supuesto):

| Hallazgo | Efecto sobre Wompi | Evidencia |
|---|---|---|
| **C1:** el mercado principal y la dirección de la tienda están en EE. UU. | El Admin filtra la lista de proveedores por la dirección de la tienda en Configuración > General. Wompi **podría no aparecer** hasta cambiarla | E3, E36; N7 (ALTA la regla; que Wompi desaparezca es NOT_VERIFIED) |
| **C1:** el checkout abre en `es-us` con país EE. UU. | Una prueba así no representa a la clienta colombiana | `theme/03E-checkout-baseline-report.md` § 2 |
| **C2:** sin zona de envío Colombia, los 29 productos figuran agotados para CO | No se llega al checkout con una dirección colombiana: `/cart/add.js` responde 422 | `theme/03E-checkout-baseline-report.md` § 2 |
| Sin proveedor activo | El checkout dice "Esta tienda no puede aceptar pagos en este momento" | ídem § 1 |

**Verificación previa (todas deben cumplirse antes del paso P1.1):**

| # | Verificación | Cómo |
|---|---|---|
| V1 | Dirección de la tienda en Colombia | Configuración > General |
| V2 | Colombia es el mercado principal | Configuración > Mercados |
| V3 | Existe la zona de envío Colombia con tarifa | Configuración > Envío y entrega. La tarifa por debajo de $299.900 es decisión de la dueña (NOT_SET) |
| V4 | Una visitante nueva resuelve a CO y puede agregar al carrito | Preview del theme: `Shopify.country` = "CO", ficha con el botón habilitado, `/cart/add.js` sin 422 |

Si V1–V4 no se cumplen: **no seguir**. No sirve probar pagos con la sesión resuelta a EE. UU. ni con una dirección de EE. UU. inventada (03E § 8).

---

## 2. Dónde debería aparecer Wompi y cuál es el flujo oficial

**Ubicación esperada.** La doc de Wompi indica ir a **Configuración > Pagos** y ubicar el método de pago **Wompi** (N1, ALTA). Hay dos variantes, ambas de "Wompi Co" (E5–E7, N20):

| Variante | Cómo se instala | Cómo paga la clienta |
|---|---|---|
| **Redirección** (proveedor alternativo "Wompi") | Desde Configuración > Pagos, con el enlace del Admin que publica la doc de Wompi. Tarjetas, PSE, Nequi, Daviplata, QR, Botón Bancolombia y efectivo en corresponsales (E5, E6) | La clienta sale a la página segura de Wompi y "regresa automáticamente" a la tienda (N1) |
| **Tarjetas on-site** (app "Wompi Tarjetas") | Desde el App Store (E7). La doc pide instalarla **después** de configurar los webhooks y verificar la redirección (E5) | Solo tarjetas, embebidas en el checkout de Shopify, sin redirección (N1) |

**Flujo oficial de Wompi frente a lo que se hace aquí:**

| # | Doc oficial (N1) | En esta Dev Store |
|---|---|---|
| 1 | Entrar con el enlace de la doc y elegir la tienda | Igual. Tienda `radaelli-swimwear-dev` |
| 2 | `Conectar` > `Instalar app` > aceptar permisos con `Instalar` | Igual, con captura previa de la pantalla de permisos (sección 3) |
| 3 | Credenciales **de producción** > `Conectar` > `Entendido` | **NO (R1).** Compuerta G2 |
| 4 | Credenciales **de prueba** > `Conectar en modo prueba` | Sí. Es el único camino permitido |
| 5 | Habilitar los medios de pago > `Activar` | Sí, en modo prueba |
| 6 | URL de eventos en el panel de Wompi, en producción y en pruebas | **Solo pruebas**, y solo con la compuerta G3 resuelta (sección 6) |
| 7 | Checkout de Shopify: contacto por **correo electrónico**; teléfono de la dirección de envío **Requerido** | Sí. Es una decisión de la dueña porque cambia la experiencia de la clienta |
| 8 | (Opcional) "Wompi Tarjetas" después de verificar webhooks y redirección | Diferido hasta cerrar las pruebas de la redirección |

**Dónde ve la clienta a Wompi:** en la selección de pago del checkout de Shopify (N1). El acordeón "Métodos de pago" de la ficha del theme (`theme-src/sections/main-product.liquid:259`, `:319-322`, según 03E § 7.2) puede cambiar de íconos: NOT_VERIFIED, se re-mide.

---

## 3. OAuth y permisos

| Punto | Estado |
|---|---|
| El consentimiento es un OAuth de instalación de app | ALTA (N1: "aceptar permisos" con `Instalar`) |
| Desarrollador esperado en la pantalla de consentimiento | "Wompi Co" (Medellín), según ambos listados (E6, E7, N20) |
| **Lista exacta de permisos que pide la app de Wompi** | **NOT_VERIFIED.** Ninguno de los dos listados del App Store muestra la sección de permisos (N20). Solo se ve al instalar |
| Permisos que Shopify documenta para apps de pago | `write_payment_gateways`, `write_payment_sessions`, `read_payment_gateways`, `read_payment_sessions` y los de mandatos: todos son de acceso restringido y se otorgan con la extensión de pagos (N14, ALTA). Que Wompi pida exactamente esos: INFERENCIA (MEDIA) |
| Costo de las apps | Gratis para instalar; se cobran comisiones de procesamiento (E6, E7) |

**Regla de la pantalla de permisos** (recomendación de Claude, no un hecho de Shopify):

1. Daniela captura la pantalla completa **antes** de pulsar `Instalar` y se la pasa a Claude.
2. Se verifica que el desarrollador sea "Wompi Co".
3. Si la lista se limita a pagos: puede aceptar.
4. Si aparece algo fuera de pagos (productos, clientes, pedidos, personal, contenido, temas): **pausar** y preguntar a Wompi para qué lo necesita (pregunta P7, sección 13). No es un "no" automático, porque una app de pagos puede leer pedidos por razones legítimas: lo decide Daniela con la respuesta de Wompi.
5. Si aparece cualquier pantalla de **facturación, plan o cargo**: parar (R3).

---

## 4. Credenciales sandbox necesarias (solo nombres)

| Nombre (como lo llama Wompi) | Prefijo público de sandbox (N3) | Dónde se obtiene | ¿La app de Shopify lo pide? |
|---|---|---|---|
| **Llave pública** (Public Key) | `pub_test_` | Panel de Wompi > Desarrollo > Desarrolladores (N1) | **Sí.** La doc habla de "llaves públicas y privadas" (N1) |
| **Llave privada** (Private Key) | `prv_test_` | Ídem | **Sí** (N1). El texto exacto del campo en la app: NOT_VERIFIED |
| Secreto de eventos (Event Key) | `test_events_` | Wompi > Desarrolladores | **NOT_VERIFIED.** La doc del plugin no lo menciona. Wompi lo usa para firmar los eventos (N2). No copiarlo a menos que la app lo pida |
| Secreto de integridad (Integrity Key) | `test_integrity_` | Wompi > Desarrolladores | **NOT_VERIFIED.** No aparece en la doc del plugin. Es el que firma el checkout del sitio Next.js; no se copia a Shopify |

- Las variables del sitio Next.js (`WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`) son **otro sistema** (03E § 4). No se lee ningún `.env` para este runbook.
- **Diferencia con 03E:** E9 resumió "clave pública + secreto". La doc de hoy dice "llaves públicas y privadas" y no menciona los secretos de eventos ni de integridad para el plugin.
- **Producción:** llaves con prefijo `pub_prod_` / `prv_prod_`. **No se cargan en esta tienda (R1).** La doc de Wompi advierte que usar las llaves incorrectas hace que los pagos no se procesen bien (N1); por eso en la tienda de producción se cargarán las de producción, en otro runbook.
- **Dónde se escriben:** solo en el formulario de la app de Wompi dentro del Admin (Configuración > Pagos > Wompi). Nunca en el chat, en el theme ni en documentos.
- **Para las capturas:** taparlas o recortarlas para que no se vean los campos de llaves.

---

## 5. URL de eventos (webhook) y URL de retorno

### 5.1 URL de eventos

| Requisito | Detalle | Fuente |
|---|---|---|
| URL a pegar en Wompi | `https://wompi-event-shopify.conexa.ai/api/v1/shopify/webhooks/event` (dominio del integrador, no de Wompi ni de Radaelli) | N1, E10 |
| Dónde | Panel de Wompi > Desarrolladores > **Seguimiento de transacciones** > URL de eventos, para el ambiente que corresponda (pruebas y producción son campos separados) | N1 |
| Protocolo | HTTPS, POST con JSON | N2 |
| Respuesta esperada de quien recibe | HTTP 200. Si no, Wompi reintenta hasta 3 veces en 24 h (a los 30 min, a las 3 h y a las 24 h) | N2, E13 |
| Ambientes | Una URL distinta por ambiente (sandbox y producción) para no mezclar datos | N2 |
| Eventos | `transaction.updated` (aprobada, rechazada, anulada o con error) y los de tokens de Nequi y Bancolombia | N2 |
| Quién la procesa | El integrador (`conexa.ai`). El comercio **no ve** ese procesamiento (E10). Su rol frente a datos personales: pregunta P6 | N1, E10 |
| ¿Admite más de una URL por ambiente? | **NOT_VERIFIED** (la doc no lo dice) | E13 |

### 5.2 URL de retorno (comportamiento)

- **La doc de Wompi no pide configurar ninguna URL de retorno** en el panel para esta integración (N1: no la menciona).
- Con la redirección, la clienta paga en Wompi y **regresa automáticamente** a la tienda (N1).
- En el modelo de pagos de Shopify, cada respuesta de la app (`resolve`, `reject` o `pending`) devuelve una acción siguiente con una URL para llevar de vuelta a la clienta al checkout o a la finalización (N11, ALTA para el modelo de Shopify). Esa URL la genera Shopify por sesión; **la dueña no la configura**.
- **Lo que no está documentado (NOT_VERIFIED):**
  - a qué pantalla vuelve la clienta según el resultado (Gracias, Estado del pedido o checkout);
  - si el pedido se crea solo con el evento cuando la clienta **no** vuelve (caso 5, sección 9).
- **No aplica** el retorno del sitio actual (`/checkout/wompi/retorno?id=`): lo reemplaza la página de Gracias / Estado del pedido de Shopify (03E § 4).

---

## 6. Conflicto de ambientes de Wompi (staging del pentest y sitio en vivo)

**Hechos:**

- Wompi tiene **una URL de eventos por ambiente** (N2, E13).
- El staging del pentest usa **Wompi Sandbox únicamente** (`docs/pentest-technical-sheet.md:80`). Su webhook recibe en la URL de eventos de **pruebas**.
- El sitio en vivo Next.js recibe en la URL de eventos de **producción** si usa las llaves de producción: **NOT_VERIFIED** en el repo (03E § 6, PATH A paso 2).
- Esta Dev Store solo puede usar **pruebas** (R1).

**Colisión:** apuntar la URL de eventos de **pruebas** a `conexa.ai` (Shopify) deja sin eventos al staging del pentest mientras dure la prueba. Apuntar la de **producción** cortaría el sitio en vivo (prohibido por R1 en esta tienda).

**Compuerta G3: elegir una opción antes del paso P4.6** (recomendación de Claude, ordenada por riesgo; decide la dueña):

| Opción | Qué implica | Riesgo |
|---|---|---|
| **A. Secuenciar** | Hacer P4.6 y las pruebas de Wompi **después** de que termine el pentest (o en una pausa acordada con quien lo hace) | Ninguno para el staging. Retrasa las pruebas |
| **B. Segundo comercio o ambiente en Wompi** | Pedir a Wompi un comercio sandbox aparte para Shopify (pregunta P2) | Depende de la respuesta de Wompi. NOT_VERIFIED |
| **C. Cambio temporal** | Anotar el valor actual de la URL de eventos de pruebas, pegar la de Shopify, probar y **restaurar el valor anotado** al terminar | El staging queda sin eventos durante la ventana. Los reintentos de Wompi (30 min, 3 h, 24 h) podrían llegar a la URL vigente en ese momento: NOT_VERIFIED. Solo con el pentest **pausado** |
| **Nunca** | Tocar la URL de producción desde esta tienda | Corta el sitio en vivo |

**En el cutover** (otra tienda, con plan pago): credenciales de producción, URL de eventos de producción y apagar Wompi en el sitio Next.js dentro de la misma ventana (03E § 6, PATH A paso 10).

---

## 7. Runbook paso a paso

**Tiempo total estimado: ≈ 2 h** (estimación de Claude, no medida). Detalle: verificaciones 10 min · compuertas y ajustes 15 min · instalación y conexión 30–40 min · pruebas 60–75 min · cierre 10 min. Si Wompi **no** aparece en G1, el tramo se corta a ≈ 20 min y se pasa a la sección 10.

Formato: **Paso | Dónde | Acción exacta | Resultado esperado | Rollback.** Los nombres de botones siguen la doc de Wompi en español; en el Admin pueden variar (NOT_VERIFIED).

### Fase 0: verificaciones (10 min)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P0.1 | Admin y preview del theme | Comprobar V1–V4 de la sección 1 (dirección CO, mercado CO, zona CO, visitante en CO que agrega al carrito) | Las 4 se cumplen | No aplica. **Si falla alguna: parar** y volver al runbook de mercado |
| P0.2 | Configuración > Plan | Anotar el tipo de tienda y el plan que muestra | Dato registrado (E35: tipo exacto NOT_VERIFIED). Si es Dev Store del Dev Dashboard, no se convierte a producción (E25) | No aplica |
| P0.3 | Hoja privada fuera del repo | Preparar una hoja para anotar los valores **previos** que se van a tocar: URL de eventos de pruebas de Wompi, ajustes de Checkout | Hoja lista. No contiene llaves | No aplica |
| P0.4 | Chat | Confirmar con quien lleva el pentest si el staging usa Wompi Sandbox en esta fecha | Fecha y ventana anotadas (insumo de G3) | No aplica |

### Fase 1: compuerta G1, ¿aparece Wompi? (5 min)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P1.1 | Configuración > Pagos | Buscar el método **Wompi** en la lista de proveedores o métodos alternativos. Capturar la pantalla | **G1 SÍ:** aparece Wompi. **G1 NO:** no aparece | No aplica |
| P1.2 | Chat | Si **G1 NO**: enviar la captura a Claude y **no seguir con Wompi**. Preguntar a Wompi (P1) y a Soporte de Shopify por qué no aparece con dirección en CO. Pasar a la sección 10 | Decisión registrada | No aplica |

### Fase 2: lado Wompi (10 min)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P2.1 | Panel de comercios de Wompi > Desarrollo > Desarrolladores | Ubicar las **llaves de pruebas** (`pub_test_`, `prv_test_`). **No** abrir ni copiar las de producción | Llaves de pruebas identificadas, sin copiarlas a ningún documento | No aplica |
| P2.2 | Panel de Wompi > Desarrolladores > Seguimiento de transacciones | **Anotar** (en la hoja privada) el valor actual de la URL de eventos de **pruebas**. No cambiarla todavía | Valor previo guardado | No aplica |
| P2.3 | Chat | Resolver la compuerta **G3** (sección 6): opción A, B o C | Opción elegida y fecha | No aplica |

### Fase 3: ajustes de Checkout en Shopify (5 min)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P3.1 | Configuración > Checkout | Anotar los valores actuales. Luego: método de contacto = **Correo electrónico**. Información del cliente > **Número de teléfono de la dirección de envío** = **Requerido** (N1, E11) | Guardado. En el checkout, el teléfono figura como obligatorio | Volver a los valores anotados. La dueña decide si el teléfono obligatorio se queda para producción |

### Fase 4: instalar y conectar en modo prueba (30–40 min)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P4.1 | Configuración > Pagos > Wompi | Pulsar **Conectar** y luego **Instalar app** | Aparece la pantalla de instalación con la lista de permisos | Cerrar la pantalla sin instalar |
| P4.2 | Pantalla de permisos | **Capturar sin aceptar** y enviar a Claude. Aplicar la regla de la sección 3. Si es correcta, pulsar **Instalar** (Daniela) | Instalada. Si pide facturación, plan o cargo: **parar (R3)** | Configuración > Apps > Wompi > Desinstalar. Al reinstalar, la configuración anterior puede no restaurarse (N21) |
| P4.3 | Pantalla de credenciales de la app | **No escribir nada.** Mirar si el botón **Conectar en modo prueba** está disponible **sin** haber conectado producción. Capturar | **G2 SÍ:** se puede conectar solo en pruebas. **G2 NO:** la app exige producción primero | No aplica |
| P4.4 | Ídem | Si **G2 NO: parar (R1).** Avisar a Claude, preguntar a Wompi (P1), pasar a la sección 10. Si **G2 SÍ:** escribir la llave pública y la privada **de pruebas** (Daniela) y pulsar **Conectar en modo prueba** | Mensaje de conexión exitosa en modo prueba. Si falla la validación de credenciales (hay reseñas que lo reportan en "Wompi Tarjetas", E7): anotar el **texto exacto** del error y no reintentar más de 2 veces | Borrar las llaves del formulario y desinstalar la app |
| P4.5 | Configuración > Pagos > Wompi | Habilitar los medios que la app ofrezca (tarjeta, PSE, Nequi, Daviplata, Botón Bancolombia, efectivo) y pulsar **Activar** | Wompi figura **activo** en Configuración > Pagos. Anotar si aparece un indicador de modo prueba (NOT_VERIFIED) | Pulsar **Desactivar** en el mismo lugar (etiqueta NOT_VERIFIED) |
| P4.6 | Panel de Wompi > Desarrolladores > Seguimiento de transacciones | **Solo si G3 está resuelta** y solo en el ambiente de **pruebas**: pegar la URL de la sección 5.1 y guardar | Guardado. Wompi enviará los eventos del sandbox a `conexa.ai` | Restaurar el valor anotado en P2.2 |
| P4.7 | Checkout de la tienda | Agregar un producto al carrito y abrir el checkout. Mirar el paso de pago | Se ofrece **Wompi**, ya no el mensaje "Esta tienda no puede aceptar pagos en este momento" | Desactivar Wompi (P4.5) |

### Fase 5: pruebas (60–75 min)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P5.1 | Checkout y Admin > Pedidos | Caso 1 (éxito) de la sección 9 | Ver sección 9 | Cancelar el pedido de prueba (decisión de la dueña) |
| P5.2 | Ídem | Caso 2 (falla) | Ver sección 9 | No aplica |
| P5.3 | Ídem | Caso 3 (pendiente) | Ver sección 9 | Cancelar el pedido de prueba si queda pendiente |
| P5.4 | Ídem | Caso 4 (reembolso total y parcial) sobre pedidos de prueba pagados | Ver sección 9 | No aplica |
| P5.5 | Ídem | Caso 5 (clienta que no vuelve) | Ver sección 9 | Cancelar el pedido de prueba |
| P5.6 | Ídem | Caso 6 (opcional): recargar la página de retorno y repetir el clic de pago | Un solo pedido y un solo cobro | No aplica |

### Fase 6: cierre (10 min)

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P6.1 | Chat | Enviar a Claude las capturas (sin llaves ni datos personales) y la tabla de resultados de la sección 9 | Claude registra los resultados (sección 14) | No aplica |
| P6.2 | Panel de Wompi | Si G3 fue la opción C: **restaurar** la URL de eventos de pruebas al valor anotado en P2.2 | El staging vuelve a recibir sus eventos | No aplica |
| P6.3 | Configuración > Pagos | Dejar Wompi en modo prueba. **No cargar producción** | Wompi activo solo en pruebas | Desactivar |
| P6.4 | Correo o WhatsApp de Daniela a Wompi | Enviar las preguntas de la sección 13 (las envía Daniela; Claude no envía mensajes) | Respuestas por escrito | No aplica |

---

## 8. Checklist de modo prueba

**Antes de probar**

- [ ] V1–V4 cumplidas (dirección, mercado, zona CO y visitante en CO).
- [ ] G1 sí (Wompi aparece) y G2 sí (se conecta solo en pruebas).
- [ ] G3 resuelta (ambientes) y valor previo de la URL de eventos anotado.
- [ ] Solo llaves `pub_test_` / `prv_test_`. Cero llaves de producción en la tienda.
- [ ] Checkout con correo como contacto y teléfono requerido.
- [ ] Hoja privada lista para anotar hora, monto, referencia de Wompi y número de pedido de cada caso.

**Durante**

- [ ] Solo datos de prueba de Wompi (N4). Datos del comprador propios o inventados.
- [ ] Anotar la **hora exacta** de cada pago y la hora en que aparece (o no) el pedido.
- [ ] Ninguna captura muestra llaves ni datos personales.

**Después**

- [ ] Wompi sigue en modo prueba y sin producción.
- [ ] Si fue la opción C de G3: la URL de eventos de pruebas está **restaurada**.
- [ ] Los pedidos de prueba no se cuentan como ventas: no aparecen en reportes ni en payouts (E27) y no pagan comisión (E22, N16).
- [ ] Resultados y capturas entregados a Claude.

---

## 9. Casos a probar y resultado esperado en el Admin de Shopify

**Datos de prueba** (públicos, de Wompi, N4):

| Medio | Dato | Resultado del sandbox |
|---|---|---|
| Tarjeta | `4242 4242 4242 4242`, cualquier vencimiento futuro, CVC de 3 dígitos | Aprobada |
| Tarjeta | `4111 1111 1111 1111`, ídem | Rechazada |
| Tarjeta | Cualquier otro número | Estado `ERROR` |
| PSE | Código de banco `1` ("banco que aprueba") o `2` ("banco que rechaza") | Aprobada o rechazada. **Sin estado pendiente** |
| Nequi y Daviplata | Los valores están publicados en la doc de Wompi; no se copian aquí (parecen teléfonos y OTP) | Aprobada, rechazada o `ERROR` según el valor |
| Daviplata | Cualquier OTP de 6 dígitos que no sea uno de los publicados | Se queda en **PENDING** (único modo documentado de obtener un pendiente) |
| Botón Bancolombia | Usa `sandbox_status` y una página de aprobación asíncrona (N4) | Asíncrono. Que la app de Shopify lo exponga así: NOT_VERIFIED |
| Efectivo en corresponsal | **No aparece en la doc de datos de prueba** | Cómo simularlo: NOT_VERIFIED (pregunta P9) |

**Cómo leer la columna "Esperado en Shopify":** lo que dice **DOC** está en documentación oficial de Shopify o Wompi. Lo marcado **NOT_VERIFIED** es lo que la prueba debe medir, y se anota **lo que realmente ocurre**.

| Caso | Datos y acción | Esperado en el Admin de Shopify | Qué anotar |
|---|---|---|---|
| **1. Éxito** | Tarjeta `4242…` (o PSE banco `1`). Pagar y volver a la tienda | **DOC:** un pedido nuevo en Pedidos con pago **Pagado** y la moneda **COP**. El monto debe ser igual al de Wompi (Wompi trabaja en centavos: $199.920 = 19.992.000, E14). **Sin comisión de Shopify** por ser prueba (N16, E22) y fuera de reportes (E27). **NOT_VERIFIED:** etiqueta de "prueba" en el pedido y nombre con que aparece Wompi como método de pago. En el panel de Wompi (sandbox): transacción `APPROVED` con el mismo monto | Hora del pago, hora en que aparece el pedido, número de pedido, monto en Shopify frente al de Wompi, nombre del método de pago, email de confirmación |
| **2. Falla** | Tarjeta `4111…` (y, aparte, un número cualquiera para ver `ERROR`). PSE banco `2` | **DOC:** un pago rechazado es final y Shopify devuelve a la clienta con una acción siguiente (N12, N11). **Esperado:** **ningún pedido** en Pedidos y mensaje de error a la clienta; en Wompi, `DECLINED` o `ERROR`. **NOT_VERIFIED:** si el checkout queda en Checkouts abandonados y el texto del mensaje | Mensaje exacto a la clienta, si hay pedido o checkout abandonado, estado en Wompi |
| **3. Pendiente** (PSE y efectivo) | **PSE no se puede dejar pendiente en sandbox (N4).** Alternativas: Daviplata con OTP inválido de 6 dígitos (si la app lo ofrece) o Botón Bancolombia con estado asíncrono. **Efectivo: NOT_VERIFIED.** Mientras esté pendiente, no cerrar el navegador y observar el Admin | **DOC:** si la app marca la sesión como pendiente, el pedido se crea con pago **Pendiente** (N18) y el comercio puede quedar impedido de editarlo, cancelarlo o capturarlo hasta que se resuelva (N11). El pendiente debería vencer en 3 días como máximo (E24). Al aprobarse: **Pagado**. **NOT_VERIFIED:** si la app usa el estado pendiente de Shopify o no crea nada hasta que se aprueba; qué pasa al rechazarse o vencer | Estado del pedido en cada momento, hora de cada cambio, y si se puede cancelar o "marcar como pagado" mientras tanto |
| **4. Reembolso** | En un pedido pagado del caso 1: Pedidos > pedido > **Reembolsar** (total). Repetir en otro pedido con reembolso parcial | **DOC:** Shopify llama a la app de pago; si esta responde bien, el pedido pasa a **Reembolsado** o **Reembolsado parcialmente** (N17, N13). Si la app no responde bien, Shopify reintenta y luego hay que reintentar a mano desde el Admin (N13). Algunos medios no se reembolsan al medio original desde Shopify (N17). **NOT_VERIFIED:** si el reembolso llega a Wompi, con qué medios y si en Wompi aparece `VOIDED` (solo tarjetas, E15) o un reembolso. La API de Reembolsos V2 de Wompi se titula "(Sandbox)" (N6) | Mensaje del Admin, estado del pedido, estado de la transacción en Wompi. **Señal de riesgo:** Shopify dice "Reembolsado" pero Wompi no muestra nada |
| **5. La clienta no vuelve a la tienda** | Pagar con éxito en Wompi y **cerrar la pestaña sin volver** al comercio. Esperar 5 min y refrescar Pedidos y Checkouts abandonados. Volver a mirar a los 35 min (el primer reintento de Wompi es a los 30 min, N2) | **DOC:** Wompi recomienda los eventos para las actualizaciones asíncronas (N5), así que el pedido **debería** aparecer aunque la clienta no vuelva. **NOT_VERIFIED:** que Shopify complete el pedido sin el retorno del navegador (N11 no lo especifica) | Si el pedido aparece y cuándo. **Bloqueante:** transacción `APPROVED` en Wompi y **ningún pedido** en Shopify = cobro sin pedido. Se registra como riesgo abierto y va a Wompi (P5), con conciliación manual por pedido (03E § 4) |
| **6. Duplicados** (opcional) | Recargar la página de retorno o repetir el clic de pago | Un solo pedido y un solo cobro (idempotencia, N12) | Cantidad de pedidos y transacciones |

**Estados de Wompi que hay que conocer** (N5): `PENDING` (creada, en proceso), `APPROVED`, `DECLINED`, `VOIDED` (solo tarjetas) y `ERROR`. La doc no da tiempos de vencimiento de los pendientes por medio de pago.

---

## 10. Alternativa de prueba sin Wompi: pasarela de prueba de Shopify

**Aplica a esta tienda:** sí, con dos fuentes que se complementan (ALTA).

- shopify.dev, sobre las tiendas de desarrollo del Dev Dashboard: se puede probar con la "Bogus test gateway" o con el modo de prueba del proveedor. No se admiten transacciones reales, tarjetas de regalo ni store credit (N10, E25).
- help.shopify.com, sobre las tiendas *client transfer* (título literal de la página): se activa la "Test payment gateway" en Configuración > Pagos, con las tarjetas `1`, `2` y `3` (N9, E26). **Esa página es de otro tipo de tienda.** Como el tipo exacto de esta Dev Store es NOT_VERIFIED (E35), se apoya en las dos fuentes.
- La página general de pedidos de prueba confirma los números de tarjeta y que los pedidos de prueba no aparecen en payouts ni en reportes (N8).

**Limitaciones que hay que conocer:**

| Limitación | Fuente |
|---|---|
| Hay que **desactivar antes cualquier proveedor de tarjeta activo** (incluido Wompi) para activar la pasarela de prueba. No conviven | N8, N9 |
| No es compatible con POS ni con productos por suscripción | N8 |
| Los métodos de pago manuales **no** sirven para pedidos de prueba en tiendas *client transfer*. En esta tienda: NOT_VERIFIED | E26 |
| Que aparezca en la lista con la **dirección de la tienda en Colombia**: NOT_VERIFIED. La regla de filtrado por dirección está documentada para proveedores externos (N7) | Se comprueba en P10.1 |
| No valida nada de Wompi: ni redirección, ni PSE, ni eventos, ni pendientes | 03E § 7.1 |

**Qué sí valida:** creación del pedido en COP, correos de Shopify, página de Gracias / Estado del pedido, cálculo de envío de la zona CO y reembolso de un pedido de prueba (comportamiento exacto NOT_VERIFIED).

**Tiempo estimado: ≈ 30 min** (estimación de Claude).

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| P10.1 | Configuración > Pagos | Si hay un proveedor de tarjeta activo (p. ej. Wompi), **desactivarlo**. Buscar la **Test payment gateway** (o "Bogus Gateway") y **activarla** (Daniela). Si no aparece: capturar y avisar a Claude | La pasarela de prueba figura activa. Sin pantallas de facturación (R3) | Desactivarla en el mismo lugar |
| P10.2 | Checkout | Con un producto en el carrito, pagar con tarjeta `1`. Nombre cualquiera, vencimiento futuro, CVV de 3 dígitos | Pedido creado con pago **Pagado**, en COP, con el envío de la zona CO. Correo de confirmación | Cancelar el pedido de prueba |
| P10.3 | Checkout | Repetir con tarjeta `2` y con `3` | `2`: pago rechazado, sin pedido. `3`: falla de pasarela, sin pedido | No aplica |
| P10.4 | Admin > Pedidos | Reembolsar el pedido de P10.2 (total) | Pedido en **Reembolsado** | No aplica |
| P10.5 | Admin > Pedidos y Configuración > Facturación | Confirmar que el pedido de prueba no genera comisión de transacción | Sin cargo (N16, E22). No se acepta ninguna facturación (R3) | No aplica |

---

## 11. Comisión de proveedor externo de Shopify

| Punto | Detalle | Confianza |
|---|---|---|
| Existencia | Shopify cobra una comisión de transacción cuando se usa un proveedor de pago externo. Colombia no tiene Shopify Payments (E1), así que Wompi es proveedor externo | ALTA (regla, N16). Que Shopify facture específicamente a Wompi como externo: MEDIA (se confirma con la primera factura) |
| Porcentajes | Basic 2 %, Grow 1 %, Advanced 0,6 %, Plus 0,2 % | ALTA (E20). Fuente: shopify.com/co/precios, página oficial de Shopify que **no está en la lista de dominios del encargo**; la leyó 03E. El Help Center no publica los porcentajes y remite a esa página (E21, N16) |
| **Base de cálculo** | **[(costo de los productos − descuentos) + impuestos + costos de envío] × tasa** | ALTA (N16, leído hoy). **Cierra un NOT_VERIFIED de 03E** |
| Qué no paga comisión | Pedidos de prueba, métodos de pago manuales, POS y borradores | ALTA (N16, E22) |
| Dónde se ve | Configuración > Facturación > una factura pasada > "Transaction fees" | ALTA (N16) |
| En esta Dev Store | Los pedidos de prueba no pagan comisión. **No se acepta ninguna facturación** (R3) | ALTA |
| Precio de los planes | Dependen de la modalidad de facturación, no verificada | NOT_VERIFIED (03E) |
| Wompi (no de Shopify) | Plan Avanzado 2,65 % + $700 + IVA por transacción exitosa; retenciones NOT_VERIFIED | ALTA / NOT_VERIFIED (E19) |

**Consecuencia para el ejemplo de 03E § 2:** ese ejemplo calculaba la comisión de Shopify solo sobre el precio del producto ($199.920). Con la fórmula oficial, la base **incluye impuestos y envío**, así que el costo real por venta es **igual o mayor** que el del ejemplo.

---

## 12. Qué es NOT_VERIFIED y cómo se resuelve

| ID | Qué no se pudo confirmar | Se resuelve con | Bloquea |
|---|---|---|---|
| NV1 | Que Wompi aparezca en Configuración > Pagos con la dirección en Colombia | **UI:** P1.1 (G1). Si no aparece: P1 a Wompi | Todo el runbook |
| NV2 | Conectar la app **solo** en modo prueba, sin credenciales de producción | **UI:** P4.3 (G2). **Wompi:** P1 | Pruebas con Wompi |
| NV3 | Lista exacta de permisos OAuth de las apps de Wompi | **UI:** captura de la pantalla en P4.2. **Wompi:** P7 | Instalación |
| NV4 | Etiquetas exactas en el Admin en español (Conectar, Instalar app, Desactivar, Checkout) | **UI:** al hacerlo | Nada |
| NV5 | Si la app usa el estado "pendiente" de Shopify y qué hace al rechazarse o vencer | **UI:** caso 3. **Wompi:** P4 | Caso 3 |
| NV6 | Reembolsos desde Shopify hacia Wompi, por medio de pago. Reembolsos V2 de Wompi: la página se titula "(Sandbox)"; una lectura la resumió como solo sandbox y otra no halló esa frase (N6) | **UI:** caso 4. **Wompi:** P3 | Operación posventa |
| NV7 | Si Shopify crea el pedido cuando la clienta no vuelve | **UI:** caso 5. **Wompi:** P5 | Lanzamiento (riesgo de cobro sin pedido) |
| NV8 | Convivencia de "Wompi Tarjetas" con la redirección (la doc lo sugiere, no se probó) | **UI:** después de cerrar la fase 5 | Opcional |
| NV9 | Si el campo de URL de eventos admite más de una URL, y si Wompi da un segundo comercio sandbox | **Wompi:** P2 | G3 |
| NV10 | Si el sitio en vivo usa hoy llaves de producción y por tanto su URL de eventos de producción | **Owner:** revisar el panel de Wompi y el hosting | G3 y cutover |
| NV11 | Que la pasarela de prueba aparezca con dirección en CO en esta tienda | **UI:** P10.1 | Alternativa sin Wompi |
| NV12 | Etiqueta de "prueba" en los pedidos y nombre del método de pago con Wompi | **UI:** caso 1 | Nada |
| NV13 | Si Daviplata y efectivo están disponibles en la app y cómo se simulan en sandbox | **UI** y **Wompi:** P9 | Caso 3 |
| NV14 | Si Shopify cobra la comisión de externo a Wompi | Primera factura real (Configuración > Facturación) | Costos |
| NV15 | Retenciones de Wompi | **Wompi:** consulta comercial | Costos |
| NV16 | Si activar el proveedor pide pantallas de facturación | **UI:** P4.2 y P4.5 (si aparece: parar, R3) | Activación |

---

## 13. Preguntas para Wompi (las envía Daniela)

1. **P1.** ¿La integración de Shopify (redirección) se puede conectar **solo con credenciales de pruebas**, sin cargar las de producción? ¿La cuenta de Radaelli está aprobada para producción? ¿Por qué no aparece Wompi en Configuración > Pagos si la tienda tuviera la dirección en Colombia (o en EE. UU.)?
2. **P2.** ¿Pueden darnos un comercio o ambiente sandbox aparte para Shopify, para no pisar la URL de eventos de pruebas que ya usa otro sistema nuestro (staging)? ¿El campo de URL de eventos admite más de una URL?
3. **P3.** Reembolsos: cuando reembolso un pedido desde el Admin de Shopify, ¿la integración lo envía a Wompi? ¿Con qué medios (tarjeta, PSE, Nequi, Daviplata, Botón Bancolombia, efectivo)? ¿La API de Reembolsos V2 está disponible en producción o solo en sandbox? Si no, ¿cómo se reembolsa (panel, Pagos a terceros)?
4. **P4.** Pagos pendientes (PSE, efectivo, Botón Bancolombia): ¿la integración deja el pedido como "pago pendiente" en Shopify? ¿Qué pasa cuando se aprueba, se rechaza o vence?
5. **P5.** Si la clienta paga y **no vuelve** a la tienda, ¿el pedido se crea igual con el evento o hace falta el retorno del navegador? ¿Qué pasa si el evento falla?
6. **P6.** El dominio `conexa.ai` recibe los eventos de pago: ¿quién lo opera, qué datos personales recibe y cuál es su política de tratamiento? (Lo necesitamos para la política de privacidad.)
7. **P7.** ¿Qué permisos pide la app de Shopify al instalarla y para qué se usa cada uno?
8. **P8.** ¿Cuál es la diferencia y cómo conviven "Wompi" (redirección) y "Wompi Tarjetas"? Hay reseñas de fallas al validar credenciales en modo prueba en "Wompi Tarjetas": ¿hay algún requisito?
9. **P9.** ¿Cómo se simula un pago **pendiente** de PSE y de efectivo en sandbox desde Shopify? La doc dice que PSE no tiene pendiente en sandbox.

---

## 14. Seguimiento inmediato de Claude

Cuando Daniela avise "Wompi listo" o "G1/G2 no pasó":

1. Verificar en solo lectura que el estado coincida con lo reportado: Wompi activo solo en pruebas, sin cargos, catálogo 29/98/95, Horizon sin tocar y theme Radaelli sin publicar.
2. Registrar la tabla de la sección 9 con los resultados reales y las capturas.
3. Cerrar cada NOT_VERIFIED de la sección 12 con lo medido, y actualizar `03E-wompi-shopify-feasibility.md` (sección 9) en un documento nuevo, sin reescribir 03E.
4. Si G1 o G2 fallaron: pasar a la sección 10 y ayudar a Daniela a redactar el mensaje a Wompi y a Soporte de Shopify.
5. Revisar el acordeón "Métodos de pago" de la ficha con Wompi activo (`theme-src/sections/main-product.liquid:259`, `:319-322`).
6. Recordar que la URL de eventos y las llaves de producción se cargan **solo** en el cutover, en la tienda de producción.
7. Claude **no** escribe llaves ni datos de tarjeta, no acepta permisos ni facturación, y no envía mensajes a Wompi en nombre de Daniela.

---

## 15. Fuentes (leídas el 2026-09-29)

| ID | URL | Se usó para |
|---|---|---|
| N1 | https://docs.wompi.co/docs/colombia/wompi-shopify-plugin/ · https://docs.wompi.co/en/docs/colombia/wompi-shopify-plugin/ | Flujo, ubicación, orden producción y pruebas, advertencia de llaves, URL de eventos, ajustes de Checkout, aviso de Tarjetas on-site |
| N2 | https://docs.wompi.co/en/docs/colombia/eventos/ | HTTPS, respuesta 200, reintentos, ambientes separados, tipos de evento |
| N3 | https://docs.wompi.co/en/docs/colombia/ambientes-y-llaves/ | Nombres y prefijos de llaves |
| N4 | https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/ | Datos de prueba; PSE sin pendiente; Daviplata con OTP inválido queda en PENDING |
| N5 | https://docs.wompi.co/en/docs/colombia/transacciones/ | Estados de transacción y uso de webhooks |
| N6 | https://docs.wompi.co/en/docs/colombia/reembolsos-sandbox/ · https://docs.wompi.co/docs/colombia/reembolsos-sandbox/ | Reembolsos V2 (título "Sandbox") |
| N7 | https://help.shopify.com/en/manual/payments/third-party-providers/configuring-providers | Pasos genéricos y filtro por dirección de la tienda |
| N8 | https://help.shopify.com/en/manual/checkout-settings/test-orders/payments-test-mode | Pasarela de prueba, tarjetas 1/2/3, desactivar el proveedor, modo prueba de terceros |
| N9 | https://help.shopify.com/en/partners/dashboard/managing-stores/test-orders-in-dev-stores | Pedidos de prueba en tiendas *client transfer* |
| N10 | https://shopify.dev/docs/apps/build/dev-dashboard/development-stores | Dev stores: Bogus o modo de prueba; sin transacciones reales |
| N11 | https://shopify.dev/docs/apps/build/payments/alternative/build-an-alternative-payment-extension | Flujo con redirección, acción siguiente, restricciones de un pedido pendiente |
| N12 | https://shopify.dev/docs/apps/build/payments/processing | Estados de la sesión de pago (resuelta, rechazada, pendiente) e idempotencia |
| N13 | https://shopify.dev/docs/apps/build/payments/request-reference | Solicitud de reembolso, respuesta 201, reintentos |
| N14 | https://shopify.dev/docs/api/usage/access-scopes | Permisos restringidos de apps de pago |
| N15 | https://shopify.dev/docs/apps/build/payments | Tipos de extensión de pago (offsite y alternative) |
| N16 | https://help.shopify.com/en/manual/your-account/manage-billing/billing-charges/types-of-charges/third-party-charges/third-party-transaction-fees | Fórmula de la comisión, exenciones, dónde verla |
| N17 | https://help.shopify.com/en/manual/orders/refund-cancel-order/refund-order | Pasos de reembolso y estados; algunos medios no se reembolsan al medio original |
| N18 | https://help.shopify.com/en/manual/orders/order-status | Estados de pago (Pendiente, Pagado, Reembolsado) |
| N19 | https://help.shopify.com/en/manual/payments/manual-payments | Métodos manuales: pedido pendiente y sin comisión |
| N20 | https://apps.shopify.com/wompi-pagos · https://apps.shopify.com/wompi-native | Listados de las dos apps (no muestran permisos) |
| N21 | https://help.shopify.com/en/manual/apps/uninstalling-apps | Desinstalar: la configuración puede no restaurarse al reinstalar |
| N22 | https://wompi.com/es/co/soluciones/payouts | "Reembolsos a compradores" como uso de Pagos a terceros (sin mención de Shopify) |

---

## 16. Qué cambia frente a 03E

| # | 03E decía | Hallazgo de hoy |
|---|---|---|
| 1 | § 7.2: "PSE código 1 / 2 → Pendiente → aprobado o rechazado" | El sandbox de PSE **no tiene estado pendiente** (N4). El pendiente se prueba con Daviplata (OTP inválido) o Botón Bancolombia; el de efectivo es NOT_VERIFIED |
| 2 | § 2 y § 9: base exacta de la comisión de Shopify NOT_VERIFIED | La base es **[(productos − descuentos) + impuestos + envío] × tasa** (N16). El ejemplo aritmético de 03E (solo producto) queda por debajo del real |
| 3 | E9: credenciales "clave pública + secreto" | La doc de hoy dice "llaves públicas y privadas" y no menciona los secretos de eventos ni de integridad para el plugin (N1) |
| 4 | E37: reembolsos V2, producción NOT_VERIFIED | La página se titula "Reembolsos V2 (Sandbox)". Una lectura la resumió como solo sandbox; otra no halló esa frase (N6). Sigue NOT_VERIFIED, con más riesgo. Wompi lista "Reembolsos a compradores" dentro de Pagos a terceros (N22), sin relación documentada con Shopify |
| 5 | E26 sin aclaración de alcance | La página de help.shopify.com sobre la pasarela de prueba se titula "client transfer stores" (N9). Para una Dev Store del Dev Dashboard la respalda shopify.dev (N10). Aplica de cualquier modo, pero **no conviven** con un proveedor de tarjeta activo |
| 6 | § 6 PATH A paso 5: cargar producción primero | Choca con la regla "sin producción en Dev". Se agrega la compuerta **G2** |
| 7 | E5–E7 sin lista de permisos | Ninguno de los dos listados de Wompi muestra permisos (N20). Se exige captura de la pantalla de consentimiento |
