# 03I — Preflight de B1 (pagos de prueba: Wompi o pasarela de prueba de Shopify), solo lectura

**Fecha:** 2026-09-30 · **Método:** lectura del Admin (Configuración > Pagos, lista de proveedores externos, Configuración > General) con la ventana de Chrome. **No se activó, instaló ni configuró ningún proveedor; no se creó ningún pedido; no se escribió ninguna llave.** La única escritura fue el texto de un **filtro de búsqueda** ("wompi") en la lista de proveedores.

Etiquetas: `[MEDIDO-03I]` · `[MEDIDO-03G]` · `NOT_VERIFIED`.

## 1. Estado actual, medido hoy

| # | Qué | Valor | Etiqueta |
|---|---|---|---|
| P1 | Pagos activos | **Ninguno.** "Shopify Payments" figura como no configurado (botón "Completar configuración"); en "Proveedores de pagos adicionales" no hay ninguno agregado. **Pagos = APAGADOS** | `[MEDIDO-03I]` |
| P2 | Aviso del Admin | «Las tiendas en desarrollo solo pueden procesar pagos de prueba. Activa el **proveedor de pagos de prueba** o configura tu proveedor de pagos en modo de prueba» (los enlaces no se abrieron: su destino es `NOT_VERIFIED`) | `[MEDIDO-03I]` |
| P3 | Lista "Proveedores de pagos externos" | La lista **incluye "(for testing) Bogus Gateway"** como primera entrada (la pasarela de prueba de Shopify), junto con Airwallex, Antom, Appmax, authorize.net, 1Razorpay, Clover, Cybersource, etc. | `[MEDIDO-03I]` |
| P4 | ¿Aparece Wompi hoy? | El filtro "wompi" devuelve **"No se encontraron proveedores"**. Con la entidad comercial y la dirección de la tienda en **Estados Unidos**, **la compuerta G1 de Wompi es NO** | `[MEDIDO-03I]` (baseline "ANTES") |
| P5 | Entidad comercial y dirección | "Radaelli Swimwear Dev – entity", país Estados Unidos («se usa para productos financieros, mercados, apps e impuestos»); dirección de la tienda: Estados Unidos | `[MEDIDO-03I]` |
| P6 | Checkout con país US | «Esta tienda no puede aceptar pagos en este momento.»; total `COP $183,920.00` (formato de EE. UU.); ruta `…/es-us` | `[MEDIDO-03G]` |

## 2. Qué cambia respecto de 03F (hallazgos)

| # | Hallazgo | Consecuencia |
|---|---|---|
| B-F1 | La **pasarela de prueba de Shopify ya está ofrecida por el propio Admin** en esta Dev Store con la entidad en EE. UU. (P3) | La ruta de prueba sin Wompi (runbook § 10) es viable **hoy**, sin cambiar dirección ni entidad. Es la vía de menor esfuerzo (≈ 30 min de la dueña, estimación de Claude) |
| B-F2 | **Wompi no aparece** con la entidad y la dirección en EE. UU. (P4) | El runbook de Wompi ya lo preveía (compuerta G1). La dirección de la tienda es **una** de las dos candidatas al filtro; la otra es la **entidad comercial** (P5, hallazgo F4 de `launch/03I-a1-preflight.md`). Cuál filtra la lista es `NOT_VERIFIED`: se mide cambiando primero la más barata de revertir (la dirección, A1b) y mirando de nuevo el filtro |
| B-F3 | **No conviven** Wompi (u otro proveedor de tarjeta) y la pasarela de prueba (runbook § 10) | El E2E con pasarela de prueba y el E2E con Wompi son **dos tandas separadas**; hay que desactivar una antes de la otra |

## 3. Secuencia de prueba post-B1 (ya autorizada por los runbooks; nada se ejecuta en 03I)

**Regla dura (R4/R5 del runbook de Wompi):** Claude **no escribe** datos de tarjeta ni de comprador en el checkout ni acepta permisos OAuth; los tipea Daniela con datos de prueba publicados. Claude lee el Admin (Pedidos), corre las herramientas de esta carpeta y anota. Sin dinero real.

**Precondición común:** A1 verificado (`A1_UNLOCKED` en modo `G1`) y checkout `es-co` (`03i-checkout-probe.js` → `03i-checkout-text-check.mjs --expect after-a1`).

### 3.1 Tanda 1 — pasarela de prueba de Shopify (§ 10 del runbook de Wompi)

| Paso | Quién | Acción | Se verifica con |
|---|---|---|---|
| P10.1 | Dueña | Configuración > Pagos > Proveedores externos > **(for testing) Bogus Gateway** > Activar (sin facturación: regla R3) | Claude: sonda del checkout `--expect after-b1-testgateway` (K5, K6) |
| P10.2 | Dueña | Checkout `es-co` con 1 producto: tarjeta de prueba **1** → pedido | `03i-order-outcomes-check.mjs`, caso **T1** (Pagado, COP, monto = total del carrito) |
| P10.3 | Dueña | Tarjeta **2** (rechazada) y **3** (falla de pasarela) | casos **T2** y **T3** (sin pedido, mensaje visible) |
| P10.4 | Dueña | Reembolsar el pedido de T1 (total) | caso **TR** (Reembolsado) |
| P10.5 | Claude | Confirmar que no hay comisión ni pantalla de facturación | caso **TC** |
| — | Claude | Correo de confirmación (bandeja de la dueña), página de gracias, envío de la zona CO en el pedido | anotar (AC-07, AC-08) |

### 3.2 Tanda 2 — Wompi en modo de prueba (§ 7 y § 9 del runbook de Wompi)

Solo si, tras A1b, el filtro "wompi" de la lista **sí** lo muestra (G1 SÍ), la app permite conectar **solo en modo de prueba** (G2 SÍ) y la URL de eventos está resuelta (G3). Si G1 o G2 fallan: queda la tanda 1 con riesgo aceptado por escrito (AC-04/05).

| Caso | Datos (públicos de Wompi) | Se verifica con |
|---|---|---|
| W1 éxito | tarjeta `4242…` o PSE banco `1` | `03i-order-outcomes-check.mjs` **W1** (Pagado, COP, monto igual; en Wompi `APPROVED` con centavos = monto × 100) |
| W2 falla | tarjeta `4111…`, un número cualquiera (ERROR), PSE banco `2` | **W2** (sin pedido, mensaje, `DECLINED`/`ERROR`) |
| W3 pendiente | PSE no da pendiente en sandbox; alternativas Daviplata con OTP inválido de 6 dígitos o Botón Bancolombia asíncrono | **W3** (solo se **anota** qué hace Shopify; NOT_VERIFIED) |
| W4 reembolso | total y parcial sobre pedidos de W1 | **W4a / W4b** (Shopify y Wompi coinciden; si Shopify dice "Reembolsado" y Wompi no → **riesgo bloqueante**) |
| W5 la clienta no vuelve | pagar y cerrar la pestaña; mirar a los 5 y 35 min | **W5** (cobro `APPROVED` sin pedido = **riesgo bloqueante**) |
| W6 duplicados (opcional) | recargar el retorno / repetir el clic | **W6** (1 pedido y 1 cobro) |

## 4. Herramientas de validación (listas; deterministas; sin red)

| Archivo | Para qué | Pruebas |
|---|---|---|
| `launch/tools/03i-checkout-probe.js` | Sonda de solo lectura que Claude pega **en la página del checkout** (por navegación; un `fetch` a `/checkout` da 403). No hace clic ni escribe; no copia el token de la URL (solo el sufijo `es-co`); enmascara correos y números largos | Se corre en vivo en A1/B1 |
| `launch/tools/03i-checkout-text-check.mjs` | Evalúa el JSON de la sonda: `--expect after-a1 \| after-b1-testgateway \| after-b1-wompi` (K0–K6: ruta `es-co`, país Colombia, departamentos, importes "$ 199.920", pagos, proveedor ofrecido) | **18/18** aserciones; control negativo con lo **medido** en 03G (checkout `es-us`: falla K1, K2, K4) y positivos **sintéticos** rotulados (`*.synthetic.json`, nunca cuentan como evidencia) |
| `launch/tools/03i-order-outcomes-check.mjs` | Compara los resultados del E2E (plantilla `fixtures/03i-order-outcomes.template.json`, **sin datos personales**) con lo esperado: PASS / FAIL / RECORD (NOT_VERIFIED que solo se anota) / BLOCKING_RISK / NOT_RUN y veredicto `B1_E2E_*` | **22/22** aserciones (cobro sin pedido, rechazado con pedido, reembolso no reflejado en Wompi, duplicados, monto/moneda distintos, casos faltantes, comisión cobrada) |

## 5. Qué NO puede hacer Claude hoy (y por qué)

- Activar la pasarela de prueba o Wompi: es un cambio de configuración de pagos (prohibido en 03I y, en general, acción de la dueña).
- Instalar la app de Wompi o aceptar OAuth: **solo Daniela** (R5).
- Escribir llaves, datos de tarjeta o de comprador: **solo Daniela** (R2, R4).
- Producir un pedido de prueba: requiere B1 activo y el pago tipeado por Daniela; en 03I no se crea ninguno.

## 6. Límites de esta lectura

- No se abrieron los enlaces del aviso ("proveedor de pagos de prueba", "pruebas en tiendas en desarrollo") ni la ficha de "(for testing) Bogus Gateway": su flujo de activación exacto (¿un clic?, ¿pide algo?) es `NOT_VERIFIED`.
- No se buscó ningún otro proveedor colombiano (PayU, Mercado Pago…): no hay decisión de la dueña sobre alternativas a Wompi.
- El nombre exacto con que aparecería Wompi (si aparece) sigue siendo `NOT_VERIFIED`; el filtro "wompi" cubre cualquier nombre que lo contenga.
