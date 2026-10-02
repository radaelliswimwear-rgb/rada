# 02 — Wompi: checklist y problemas de pago

Para: Daniela. Aquí NO hay ninguna llave ni contraseña. Las llaves las escribes solo tú, en la pantalla de Wompi dentro del Admin de Shopify.

## 1. Estado al escribir (2026-10-02, antes del lanzamiento)
- App instalada: **Wompi Pagos** (desarrollador "Wompi Co"). Medios activos: Visa, Mastercard, Amex, Bancolombia, Nequi, Daviplata, PSE.
- Modo: **PRUEBA** (Admin > Configuración > Pagos dice "Probando transacciones de Wompi. No se procesarán transacciones reales").
- Llaves de prueba cargadas por ti. Llaves de producción: no se pudo comprobar que sean válidas (`CONFIRMAR_EN_ADMIN`: solo se ve al apagar el modo de prueba).
- URL de eventos guardada en Wompi (producción y pruebas): `https://wompi-event-shopify.conexa.ai/api/v1/shopify/webhooks/event`. Es la dirección oficial de la documentación de Wompi para Shopify.
- Checkout: contacto por correo y teléfono de envío obligatorio (lo exige Wompi). PayPal desactivado.
- Prueba completa en sandbox: pedido #1001 (169.820 COP) pagado, correos enviados, luego cancelado y archivado.
- Después del lanzamiento este bloque debe actualizarse: modo LIVE, fecha, resultado de la compra real mínima (GAP-20).

## 2. Prueba vs. real: cómo saber en qué modo estás
1. Admin > Configuración > Pagos > Wompi.
2. Si dice "Modo de prueba" o "Probando transacciones": NO se cobra dinero real. Las compras generan pedidos de prueba.
3. Si no dice nada de prueba y Wompi figura "Activa": modo real (LIVE).
4. En la página de pago de Wompi: busca la etiqueta "sandbox/pruebas". Si no la ves y es dinero real, es LIVE.

Cambio a LIVE: lo haces tú el día del lanzamiento: Configuración > Pagos > Wompi > apagar "modo de prueba" (el botón exacto: `CONFIRMAR_EN_ADMIN`). Si Shopify dice que las llaves de producción no son válidas, las vuelves a escribir tú.

QUÉ HACER
- Antes de abrir la tienda: una compra real mínima con tu tarjeta (la prepara el equipo; antes de pagar te muestran el monto exacto). Primero se intenta **anular** (mismo día); si no se puede, se reembolsa.
- Esa prueba **no es gratis garantizada**: según Wompi, un reembolso completado puede dejar a cargo del comercio la comisión de la transacción + el IVA de esa comisión. Se anota como "costo de prueba de lanzamiento".
- Antes de pasar a LIVE se recomienda una prueba en modo prueba de "pagué y cerré la pestaña sin volver a la tienda": mira si Shopify crea el pedido (resultado: `CONFIRMAR_EN_ADMIN`; anótalo aquí).
- Después, anota fecha y número de pedido de la prueba real.

QUÉ NO HACER
- NO uses tarjetas de prueba en modo LIVE ni tarjetas reales en modo prueba.
- NO pegues llaves en chats, capturas ni documentos.
- NO actives otra pasarela de tarjeta al mismo tiempo.
- NO cambies la URL de eventos sin avisar: una sola URL por ambiente.

## 3. URL de eventos (el "aviso de pago")
- Qué es: cuando alguien paga, Wompi avisa a Shopify por esa URL y Shopify crea el pedido.
- Sin la URL guardada en **producción**, un pago aprobado puede NO crear pedido (se comprobó en pruebas: sin URL no se creó).
- Dónde se revisa: panel de Wompi > Desarrollo > Desarrolladores > Seguimiento de transacciones > URL de eventos (producción y pruebas) (`CONFIRMAR_EN_ADMIN`, Wompi).
- Si Wompi no recibe respuesta, reintenta a los 30 minutos, 3 horas y 24 horas.
- Quién procesa esos avisos: el integrador `conexa.ai` (no Wompi ni Radaelli). Quién es y qué datos recibe: pregunta abierta a Wompi, `PENDIENTE_DUEÑA` (GAP-12, afecta la política de privacidad).
- Riesgo de rollback: esa misma URL ya no apunta al sitio viejo (GAP-01).

## 4. Checklist diario de pagos (3 min)
1. Panel de Wompi > Transacciones del día: cuenta las APROBADAS.
2. Shopify > Pedidos: ¿hay el mismo número de pedidos pagados?
3. Pedidos > Checkouts abandonados: ¿algún cliente/valor coincide con una APROBADA sin pedido? Si sí, sección 5.C.
4. ¿Algún pago PENDIENTE de Wompi? Anota; vence en máximo unos días (`CONFIRMAR_EN_ADMIN`, Wompi).
5. Wompi sigue "Activa" y sin aviso de facturación en Shopify.

## 5. Problemas y qué hacer

### A. Wompi no aparece en el pago
1. Configuración > Pagos: ¿Wompi está "Activa"? Si no, actívala.
2. ¿Hay un aviso de facturación o "esta tienda no puede aceptar pagos"? Configuración > Facturación.
3. Prueba con otro producto y en ventana privada. Si sigue: documento 10 (Wompi no aparece) y pide ayuda.

### B. Pago rechazado o con error
- Normal: el cliente no queda con pedido. En Wompi aparece DECLINED/ERROR. Pídele que pruebe otro medio.
- Si hay muchos seguidos: revisa llaves y modo (sección 2) y avisa a Wompi.

### C. PAGÓ EN WOMPI PERO NO HAY PEDIDO (el caso más importante)
1. Panel de Wompi: copia referencia, hora, valor y correo del cliente de la transacción APROBADA.
2. Espera 35 minutos desde la hora del pago (Wompi reintenta a los 30 min). Mira Pedidos.
3. Pedidos > Checkouts abandonados: busca por correo o valor. Si aparece, es el mismo cliente.
4. Si sigue sin pedido: NO le cobres otra vez. Crea el pedido a mano:
   a. Pedidos > Crear pedido (borrador). Agrega las mismas prendas y tallas, el cliente y la dirección.
   b. Envío: elige la tarifa de su zona (documento 10, tabla de zonas).
   c. Cobrar > "Marcar como pagado". Método: manual/Wompi. En notas escribe la referencia de Wompi (`CONFIRMAR_EN_ADMIN`).
   d. Verifica que el inventario bajó. Despacha normal.
5. Avisa al cliente (WhatsApp o correo) que su pedido está confirmado.
6. Reporta a Wompi la transacción con su referencia y pide que revisen la entrega de eventos.
7. Anota el caso en tu hoja de conciliación.
8. Si pasa más de una vez: pon la tienda en pausa (documento 10) y pide ayuda.
Esto se ensayará con un pedido de prueba antes del 2026-10-09 (GAP-04).

### D. Pedido en "Pago pendiente"
- Es un pago que aún no se confirma (PSE/efectivo/Daviplata). No lo canceles ni despaches hasta ver APROBADO en Wompi.
- Si en Wompi ya está APROBADO y Shopify sigue pendiente: espera 35 min; luego caso C.
- Si Wompi dice RECHAZADO: cancela el pedido y repone inventario.

### E. Doble cobro o dos pedidos por un pago
1. Mira Wompi: ¿dos transacciones APROBADAS?
2. Si son dos: reembolsa una (sección 6) y cancela el pedido duplicado con reposición de inventario.
3. Si se repite: pon la tienda en pausa y pide ayuda.

### F. Llaves inválidas o "no se pudo conectar"
- Las vuelves a escribir tú (pública y privada, del ambiente correcto: producción o pruebas).
- No pruebes más de 2 veces. Anota el texto exacto del error y pregunta.

## 6. Reembolsos
Estado: el reembolso desde Shopify hacia Wompi **no está comprobado** (`CONFIRMAR_EN_ADMIN`; GAP-03). Se comprobará con la prueba real de lanzamiento.
Mientras tanto:
1. Pedidos > abre el pedido > Reembolsar > elige prendas y valor.
2. Revisa en Wompi si la transacción quedó anulada/reembolsada (en tarjetas suele aparecer VOIDED).
3. Si Shopify dice "Reembolsado" y Wompi no muestra nada: el dinero NO salió. Hazlo desde el panel de Wompi (según tu plan) y deja nota en el pedido.
4. Para PSE, Nequi, Daviplata y efectivo puede no ser posible devolver al mismo medio desde Shopify: pregunta a Wompi.
5. Avisa al cliente.
Costos: un reembolso ya completado puede dejar la comisión de la transacción + IVA de esa comisión a tu cargo; una **anulación el mismo día** puede evitarlo si la red de la tarjeta lo permite (indicación del soporte de Wompi, citada por el coordinador). Prefiere anular cuando se pueda. Reglas exactas del contrato: `PENDIENTE_DUEÑA`.

## 7. Costos
- Shopify cobra 2 % en Basic por usar un proveedor externo sobre (productos − descuentos + impuestos + envío). No aplica a pedidos de prueba.
- Tarifa de Wompi de tu contrato: `PENDIENTE_DUEÑA` (GAP-08).

## 8. Con quién hablar
| Tema | Contacto |
|---|---|
| Panel, transacciones, reembolsos, eventos | Soporte de Wompi: canal `PENDIENTE_DUEÑA` (GAP-07) |
| Plan, facturación, Admin | Soporte de Shopify (icono "?" del Admin) |
| Quién es `conexa.ai` | Preguntar a Wompi |
Lleva: referencia de Wompi, hora, valor, número de pedido y captura SIN llaves.

## 9. Cuándo pedir ayuda
- Un pago aprobado sin pedido pasadas 2 horas.
- Cualquier cobro duplicado.
- Wompi desactivado solo.
- Pedido "Pagado" sin transacción aprobada en Wompi.
