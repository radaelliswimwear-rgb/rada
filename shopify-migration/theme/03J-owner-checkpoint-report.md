# 03J — Punto de control de la dueña + alineación a Colombia + desbloqueo del checkout (informe)

**Modelo:** SONNET 5.5 · **Fecha:** 2026-09-30 · Con Daniela presente, **una decisión o acción a la vez**. Sin subagentes, sin workflows, sin rastreo amplio, sin cambios de theme. Un solo proceso activo a la vez.

**Cómo ocurrió (importante para leer el informe):** la primera versión del prompt de 03J pedía tarifas de envío y pasarela de prueba sin tocar la entidad. Se ejecutó así (**primera pasada**: A1a + B1a + E2E) y se entregó el handoff. Mientras tanto ChatGPT **corrigió el prompt** («alinear país/entidad/dirección de la tienda a Colombia antes del envío»). Se ejecutó entonces la corrección con la dueña (**segunda pasada**): revisión de campos, cambio de entidad, re-verificación y **repetición del E2E**, porque Shopify apagó la pasarela de prueba al cambiar la entidad.

## Veredicto

**Todo alineado con Colombia y verificado.** La entidad comercial y la dirección de la tienda pasaron de Estados Unidos a Colombia (persona física, Barranquilla); origen de envío y zona Colombia intactos; catálogo 29/29 disponible con país CO; checkout `es-co` en COP; pasarela de prueba reactivada y **segundo E2E** correcto. Siguen abiertas dos cosas que **solo la dueña** cierra: **SH-D2** (tarifa bajo $299.900, depende de su mensajería) y **B1b** (Wompi no aparece en el Admin ni con todo en Colombia).

## Los 24 puntos pedidos

| # | Punto | Resultado |
|---|---|---|
| 1 | Modelo | SONNET 5.5 |
| 2 | Tiempo | ≈ 4 h 35 min de reloj (03:36 → 08:12); ≈ 4 h fueron espera de la dueña entre el primer pago pendiente y su regreso; ≈ 55 min de trabajo activo |
| 3 | SH-D1 entregada | **SÍ.** Dirección de despacho y residencial en **Barranquilla, Atlántico** (no se reproduce la dirección completa) |
| 4 | Campos con contexto de EE. UU. y clasificación A/B/C | § 1 |
| 5 | Escrituras de alineación a Colombia | § 2 (entidad: la guardó la dueña; la dirección de la tienda se actualizó sola) |
| 6 | Paso de confirmación/legal/facturación | **SÍ, uno:** la **entidad comercial** exige elegir el tipo de empresa y, para «persona física», nombre, apellido, fecha de nacimiento y dirección residencial. Lo decidió y lo escribió/guardó **la dueña**; no hubo aceptación legal ni facturación (`NOT_VERIFIED` si el cambio es reversible) |
| 7 | Estado post-alineación | Entidad Colombia (persona física); dirección de la tienda Colombia; **COP**; región de respaldo **Colombia**; zona horaria **(GMT-5) Bogotá**; métrico/kg; mercado Colombia **Activo** con todo el catálogo; mercado de EE. UU. sigue Activo (informativo); pagos: solo la pasarela de prueba; Horizon live, Radaelli sin publicar |
| 8 | SH-D2 | **Sin valor.** El costo depende del destino y la dueña lo averigua con su mensajería. Decisión (con su OK): solo «envío gratis desde $299.900» y la tarifa inferior **pendiente**; no se inventó ningún monto. Una prenda suelta aún no puede pagarse |
| 9 | Escrituras de A1 (envío) | 2 guardados (§ 2, W1 y W2); zona y tarifas de EE. UU. intactas |
| 10 | Verificador post-A1 | **`A1_UNLOCKED`** dos veces (modo `G1`, `d2: pending`; antes y después de alinear): 10 PASS, 0 FAIL, 0 REVIEW, 2 INFO cada vez; sesión restaurada; sin 429 |
| 11 | Checkout de Colombia desbloqueado | **SÍ** para carritos de 2 prendas o más (≥ $299.900). Una prenda suelta: sin método de envío (esperado en modo QA parcial; no lanzable) |
| 12 | Aprobación explícita de B1a | **SÍ**, dos veces («Sí» de la dueña: una para activarla y otra para reactivarla y repetir el E2E) |
| 13 | Pasarela de prueba activada | **SÍ** (activada, apagada por Shopify al cambiar la entidad, y reactivada) |
| 14 | Resultados del E2E | § 4 |
| 15 | Pedidos de prueba creados | **2** (#1001 reembolsado, #1002 pagado). Los intentos con `2` y `3` no crearon pedido |
| 16 | Confirmación y estado del pedido | § 4 |
| 17 | Estado final de pagos | **Pasarela de prueba ACTIVA** (única forma de pago). Ver § 5 |
| 18 | RC1.9 cambió | **NO** |
| 19 | Horizon intacto | **SÍ** (`theme list`: `189072113983` sigue `live`) |
| 20 | Radaelli sin publicar | **SÍ** (`189072474431` sigue `unpublished`) |
| 21 | Production/Staging/Vercel/Neon/main/DNS/tienda comercial tocados | **NO** |
| 22 | Bloqueos que quedan | § 6 |
| 23 | Listo para 03K | **SÍ, para revisión de ChatGPT**; lo que sigue depende de la dueña (SH-D2/mensajería y Wompi) |
| 24 | Segundo plano | **CERO TAREAS DE SEGUNDO PLANO ACTIVAS** (sin servidores, sin `node`, sin pestañas propias abiertas; sesión del storefront en país US y carrito vacío) |

## 1. Campos con contexto de EE. UU. (revisión de solo lectura) y clasificación

| Campo (Admin) | Antes | Clase | Qué se hizo |
|---|---|---|---|
| Configuración > General > **Información comercial (entidad)** «Entidad comercial que se usa para productos financieros, mercados, apps e impuestos en esta tienda» | Estados Unidos | **B** (clasificación legal del negocio: exige tipo de empresa y datos personales) | Cambiada a **Colombia, persona física** por la dueña (§ 2, W4) |
| **Dirección de la tienda** (la ven las clientas) | Estados Unidos; país **bloqueado** («Cambia el país en Información comercial»); calle, ciudad y código vacíos | A, pero dependiente de la entidad | Se actualizó **sola** a la dirección de Barranquilla, Colombia al cambiar la entidad (sin escritura propia) |
| Sucursal «Shop location» (origen de envío) | EE. UU. sin calle | **A** | Colombia, Barranquilla (§ 2, W1) |
| Región de respaldo, moneda, zona horaria | Colombia, COP, Bogotá | (ya correctos) | Sin cambios |
| Mercados: United States | Activo | **C** (informativo) | Sin cambios |
| Configuración > Pagos: lista de proveedores externos y estado de la pasarela | Lista de EE. UU. | **C** (depende de la entidad) | Cambió sola a la lista de Colombia; **la pasarela de prueba quedó apagada** |
| Impuestos y aranceles, Facturación | — | — | **No se inspeccionaron** en 03J |

## 2. Escrituras en el Admin (todas con OK de la dueña; ninguna otra)

| # | Dónde | Cambio | Reversión |
|---|---|---|---|
| W1 | Sucursales > «Shop location» > Dirección | País EE. UU. (sin calle) → Colombia, Barranquilla, Atlántico | Volver a país EE. UU. con campos vacíos |
| W2 | Envío y entrega > Perfil general | Zona **«Colombia»** (33/33 departamentos) + tarifa **«Envío estándar gratis»** (importe del pedido ≥ 299.900, precio 0, 3 a 5 días hábiles; Shopify exige un tránsito, se usó el plazo del sitio actual) | Eliminar la zona |
| W3 | Pagos > Proveedores externos | **Pasarela de pago de prueba activada** (primera vez) | Desactivar |
| W4 | General > Información comercial > Editar | País **Colombia**, tipo **persona física**, dirección residencial (la de Barranquilla, cargada por Claude); **la dueña escribió su nombre, apellido y fecha de nacimiento y pulsó Guardar** | No verificado (posiblemente se puede volver a editar) |
| W5 | Pagos > Proveedores externos | **Pasarela de pago de prueba reactivada** (Shopify la había apagado al cambiar la entidad) | Desactivar |

Otras acciones: el filtro de texto «wompi» de la lista de proveedores (no es un ajuste) y un cuadro de edición de la entidad que se abrió **y se descartó** sin guardar (para ver qué pedía). En el checkout (no es el Admin) se escribieron **datos inventados** (nombre «Prueba», dirección «Calle 1 2 3», Barranquilla, y un alias del correo de la dueña para que llegue la confirmación; no es dato de una clienta). **El número de tarjeta de prueba lo escribió la dueña** (Claude no escribe números de tarjeta en una página que no es local), y **el reembolso de #1001 lo pulsó ella**: el clasificador de permisos bloqueó mi intento de escribir en el formulario de reembolso del Admin y no se rodeó.

## 3. Verificación

**Post-A1 (verificador `03i-post-a1-verify.js`, dos corridas, antes y después de la alineación):** `A1_UNLOCKED` en ambas. C03 = **29/29 productos y 98/98 variantes** con país CO (antes de A1: 0/29); C04 agregar 1 prenda 200 en COP; C05 1 prenda = 0 tarifas (esperado con `d2: pending`); C06/C07 2 y 1+1 prendas con «Envío estándar gratis» (319.840 y 359.840); C08 misma tarifa en Bogotá, Amazonas y San Andrés; C09 `/` y `/en` 200; C10 visitante nuevo no medible (`NOT_VERIFIED`); C11 sesión restaurada.

**Checkout de Colombia (sonda de solo lectura; evidencia `launch/evidence/03J-checkout-probe-*.json`):** ruta `es-co`, `es-CO`, país Colombia, **33 departamentos**, total **`$ 319.840,00`**, «Envío estándar gratis». Antes de B1a el pago decía «no puede aceptar pagos»; después ofrece «Tarjeta de crédito» con «Instrucciones de prueba» (1 aprobada, 2 rechazada, 3 falla). `03i-checkout-text-check.mjs`: `CHECKOUT_AS_EXPECTED` en las tres mediciones (después de A1, después de B1a, y después de alinear la entidad).

**Corrección a 03I:** el formato colombiano medido es **`$ 319.840,00`** (punto de miles, coma decimal), no «sin decimales»; el evaluador se corrigió (22/22) y el criterio 4 de AC-01 de 03G debería leerse así (no se editó ese documento histórico).

## 4. E2E de pagos de prueba (pasarela de prueba de Shopify)

Carrito: 2 × `bikini-shadow-azul-marino` talla M (título de origen «BIKINI SHADOW NEGRO»), 319.840 COP, país CO, envío estándar gratis. Se hizo **dos veces**: #1001 con la entidad aún en EE. UU. y **#1002 con la entidad ya en Colombia**.

| Caso | #1001 (antes de alinear) | #1002 (después de alinear) |
|---|---|---|
| Tarjeta `2` (rechazada) | «Se produjo un error al procesar tu pago. Inténtalo de nuevo o utiliza una forma de pago diferente.»; **sin pedido**; el checkout figuraba como abandonado con un correo de recuperación programado al alias de prueba | Pago fallido registrado en el Admin; **sin pedido con ese pago**; mensaje **no observado** |
| Tarjeta `3` (falla de pasarela) | Pago fallido registrado; **sin pedido**; mensaje **no observado** | Igual |
| Tarjeta `1` (aprobada) | «¡Gracias por tu compra!»; **Pagado, COP 319.840,00**, canal Online Store, banner «Pedido de prueba» | Igual: **Pagado, COP 319.840,00**, envío estándar gratis (0,00) |
| Correo de confirmación | El Admin registra el envío al alias de prueba; **llegada a la bandeja: sin confirmar** | Igual (sin confirmar) |
| Reembolso total | Hecho por la dueña: **Reembolsado**, 319.840,00 $ COP; «Repusiste en inventario 2 artículos»; pedido archivado; pago neto 0; correo de reembolso enviado | **No repetido** (opcional; queda Pagado como evidencia) |
| Comisión | Ninguna visible en el pedido ni en su cronología (Configuración > Facturación no se revisó) | Ninguna visible |

Evaluador `03i-order-outcomes-check.mjs`: **`B1_E2E_VALIDATED_WITH_RECORDS`** en ambos archivos de evidencia (`03J-order-outcomes-testgateway.json` y `…-post-alignment.json`; en el segundo, TR y TC son los de #1001 y así se declara). No se probó «pendiente», «la clienta no vuelve» ni Wompi.

## 5. Estado final de pagos (decisión documentada)

**Pasarela de prueba ACTIVA** (no procesa dinero real: las tiendas en desarrollo solo aceptan pagos de prueba; la tienda está protegida por contraseña; las siguientes fases la necesitan). Ojo con dos hechos medidos: **(a)** cambiar la entidad **apaga** la pasarela y cambia la lista de proveedores, así que cualquier cambio futuro de entidad exige reactivarla; **(b)** Bogus y Wompi **no conviven**. Para apagarla: ficha de la pasarela > «Desactivar» (no borra los pedidos).

## 6. Bloqueos que quedan

| Bloqueo | Quién | Estado |
|---|---|---|
| **SH-D2** tarifa bajo $299.900 | Dueña: mensajería | Abierto (§ 7) |
| **B1b Wompi** | Dueña (OAuth, llaves, URL de eventos) | **No aparece** en la lista de proveedores externos, **tampoco con entidad, dirección y sucursal en Colombia**; su instalación por App Store no se exploró (`NOT_VERIFIED`). No se pidió nada |
| Confirmar que llegó el correo de confirmación (AC-08) | Dueña (su bandeja) | Sin confirmar |
| Tienda comercial (D4) | Dueña | Nuevo dato: el Admin dice que la Dev Store **no se puede transferir**; habrá que crear una tienda nueva y volver a definir su entidad |
| Resto del lote (A2–A5, B2–B4, C1–C8, D1–D5, E1) | Dueña | Sin cambios; ver `launch/03I-blocker-matrix.md` |

## 7. Opciones de mensajería (respuesta a la pregunta de la dueña sobre una API)

Investigación web del 2026-09-30; no se contactó a nadie ni se instaló nada:
- **Envía Colvanes (envia.co):** [integración por servicios web](https://envia.co/enviaOnline) para cotizar, solicitar y rastrear, pensada para clientes corporativos (hay que hablar con ellos). Solo se encontró un [plugin para WooCommerce](https://wordpress.org/plugins/shipping-envia-colvanes-woo/); una app oficial para Shopify **no se encontró** (`NOT_VERIFIED`).
- **Envia.com** es otra empresa, con [integración para Shopify](https://community.shopify.com/t/integracion-con-envia-com-plataforma-de-envios-con-3eros/171033) que exige facturación anual y pedir a Shopify que active las tarifas calculadas por terceros. Los documentos del repo dicen «Envia» sin distinguir cuál: **confirmarlo**.
- **Tarifas calculadas por la transportadora en Shopify:** según la [ayuda oficial](https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/third-party-carrier-calculated-shipping) requieren el plan Advanced (o Grow con cargo extra o facturación anual) y peso y dimensiones por producto, que el catálogo **no tiene**.
- **Plataformas multitransportadora** en Colombia: [99 Envíos](https://99envios.com/) y [Sedda](https://sedda.co/) (Servientrega, Coordinadora, Interrapidísimo, Envía, TCC). No se evaluaron.
- **Qué preguntar a la mensajería:** contrato y servicio web de cotización, qué integración usan con Shopify y una tabla de tarifas por destino (`shipping/03F-owner-shipping-runbook.md` § 7).

## 8. Cambios en herramientas y documentos (sin versionar: G03)

- `03i-checkout-text-check.mjs` (K4 al formato medido; 22/22), `03i-order-outcomes-check.mjs` (mensaje no observado = `RECORD`; 24/24).
- `launch/evidence/03J-*.json` (5 archivos, sin datos personales ni tokens).
- `launch/03I-blocker-matrix.{json,md,csv}` (A1, B1 y D4 actualizados; sigue en 21/21) y `theme/03F-owner-actions-minimal.md` (tabla de orden con A1 y B1a hechos).
- Escaneo de secretos sobre lo cambiado: 0 bloqueantes.

## 9. Notas

- Sin 429; 2 corridas completas del verificador (con horas de separación).
- Datos personales de la dueña (nombre legal, fecha de nacimiento, dirección completa): **no se reproducen** en este informe ni en el handoff; la dueña los escribió en el Admin.
- Nada de esto se subió a git salvo los archivos de handoff.
