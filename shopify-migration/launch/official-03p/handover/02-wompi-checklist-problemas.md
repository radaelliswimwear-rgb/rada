# 02 — Wompi: checklist y problemas de pago

Para: Daniela. Aquí NO hay ninguna llave ni contraseña. Las llaves las escribes solo tú, en la pantalla de Wompi dentro del Admin de Shopify.

## 1. Estado al escribir (actualizado 2026-10-02, tarde: la tienda ya es pública)
- App instalada: **Wompi Pagos** (desarrollador "Wompi Co"). Medios activos: Visa, Mastercard, Amex, Bancolombia, Nequi, Daviplata, PSE.
- Modo: **REAL (LIVE)**. En Admin > Configuración > Pagos > Wompi figura **"Activa"** y **"Modo de prueba" está apagado**. La tienda cobra dinero real desde ~11:23 del 2026-10-02.
- **NUNCA pulses el botón rojo "Desactivar"** de esa pantalla (regla del equipo; no se ha comprobado qué conserva Shopify al desactivar y habría que volver a conectar Wompi). Para frenar ventas, usa la contraseña de la tienda (documento 10, sección 5).
- URL de eventos guardada en Wompi (producción y pruebas): `https://wompi-event-shopify.conexa.ai/api/v1/shopify/webhooks/event`. Es la dirección oficial de la documentación de Wompi para Shopify.
- Checkout: contacto por correo y teléfono de envío obligatorio (lo exige Wompi). PayPal desactivado.
- Prueba completa en sandbox (antes del lanzamiento): pedido #1001 (169.820 COP) pagado, correos enviados, luego cancelado y archivado.
- **Prueba real de lanzamiento (2026-10-02): pedido #1002, COP 5.000 pagados con Nequi.** El pago real funcionó y Shopify creó el pedido. Del lado de Wompi: Pago 5.000,00; comisión −832,50; IVA de la comisión −158,17; **neto 4.009,33** (sección 7). Luego el pedido #1002 se **canceló con reembolso desde Shopify** y ese reembolso **quedó PENDIENTE** (sección 6). El pedido #1002 sigue cancelado en Shopify con el reembolso pendiente. El producto temporal de la prueba se borró.
- Todavía NO hay pedidos reales de clientes.
- Pendiente de verificar con la primera compra real de una clienta: que el correo de confirmación llegue a su bandeja (documento 07).

## 2. Prueba vs. real: cómo saber en qué modo estás
1. Admin > Configuración > Pagos > Wompi.
2. Si dice "Modo de prueba" o "Probando transacciones": NO se cobra dinero real. Las compras generan pedidos de prueba.
3. Si no dice nada de prueba y Wompi figura "Activa": modo real (LIVE).
4. En la página de pago de Wompi: busca la etiqueta "sandbox/pruebas". Si no la ves y es dinero real, es LIVE.

**Hoy (2026-10-02, tarde): Wompi está en LIVE** ("Activa", "Modo de prueba" apagado). El cambio a LIVE ya se hizo. Si algún día tuvieras que repetirlo: Configuración > Pagos > Wompi > apagar "modo de prueba". Si Shopify dice que las llaves de producción no son válidas, las vuelves a escribir tú.

QUÉ HACER
- La compra real mínima de lanzamiento **ya se hizo**: pedido #1002, $5.000 con Nequi (sección 1). Costó comisión: ver sección 7. Se anota como "costo de prueba de lanzamiento".
- No repitas pruebas con dinero real sin avisar: cada una deja comisión y el reembolso NO es automático (sección 6).
- Sigue pendiente de ensayar (sin dinero real): "pagué y cerré la pestaña sin volver a la tienda" (¿Shopify crea el pedido?). Resultado: `CONFIRMAR_EN_ADMIN`; anótalo aquí.
- Cuando entre la primera compra real de una clienta, anota fecha y número de pedido.

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
- Riesgo de rollback: esa misma URL ya no apunta al sitio viejo (GAP-01; la URL del sitio viejo se infiere, no se leyó de Wompi: documento 01, sección 5).

### 3.1 El panel de Wompi: cómo entrar y qué mirar
1. Entra a `https://login.wompi.co` con **tus** credenciales (tú escribes usuario, contraseña y el captcha; nunca por chat ni a la IA). La sesión caduca rápido: si te saca, vuelve a entrar.
2. **Transacciones**: lista de pagos. En un pago pulsa **"Ver más"**: ves quién pagó, el autorizador (por ejemplo, el identificador de Nequi), el estado y las **"Entradas contables"**.
3. **"Entradas contables"** = la cuenta del pago: *Pago* (lo que pagó la clienta), *Comisión* (lo que cobra Wompi) e *IVA de la comisión*. Lo que te llega = Pago − Comisión − IVA de la comisión. Ejemplo real del pedido #1002 en la sección 7.
4. **"Dinero enviado"**: lista de los giros (pagos de Wompi hacia tu cuenta). Así concilias lo cobrado con lo recibido.
5. Para pagos hechos con **Nequi** el panel **no tiene botón "Anular"** (sección 6).
6. Nada de esto se hace desde Shopify: Shopify solo muestra el pedido. La plata real se ve en Wompi.

## 4. Checklist diario de pagos (3 min)
1. Panel de Wompi (sección 3.1) > Transacciones del día: cuenta las APROBADAS.
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
**Estado (GAP-03, actualizado 2026-10-02): los reembolsos a clientas NO están comprobados como automáticos.** No le prometas a una clienta un reembolso "automático" ni una fecha.
Qué se vio con la prueba real (pedido #1002, $5.000 con Nequi): al cancelar el pedido con reembolso desde Shopify, Shopify creó una transacción de tipo REEMBOLSO en estado **PENDIENTE** que **seguía sin completarse después de más de 40 minutos**, y la lista de pagos recibidos de Wompi **no mostraba ningún reembolso**. Para pagos con Nequi, el panel de Wompi **no tiene botón "Anular"**. Es decir: Shopify puede decir que el reembolso está hecho o pendiente sin que el dinero haya salido de Wompi.

**Procedimiento seguro mientras no se demuestre lo contrario:**
1. **Decide** si procede el reembolso, de cuánto y por qué (documento 12). Anótalo en el registro de devoluciones.
2. **Devuelve el dinero por el lado de Wompi**: si el panel de Wompi ofrece anular o reembolsar ese pago (según el medio y tu plan; no con Nequi), hazlo ahí; si no, **devuelve el dinero por transferencia** (Nequi, Bancolombia u otro medio) a la clienta, con los datos que ella te dé **solo por el chat del caso**. Guarda el comprobante. No pegues datos de la clienta en chats con la IA.
3. **Después**, en Shopify: abre el pedido > cancélalo o márcalo (reembolso/cancelación) y escribe una **nota de personal** con la referencia de Wompi y el comprobante de la devolución (`CONFIRMAR_EN_ADMIN`: opción de cancelar sin generar otro reembolso automático, para no duplicar). Así el pedido y el inventario quedan cuadrados.
4. Revisa en Wompi (sección 3.1) y en tu banco que la plata realmente salió.
5. Avisa a la clienta (documento 12, plantilla 4, sin prometer plazos del banco).
6. Si Shopify dejó un REEMBOLSO "pendiente" (como en el #1002), no lo repitas: anótalo y pregunta a soporte de Wompi y de Shopify.
Costos: **la comisión de Wompi (y el IVA de esa comisión) no se devuelve**; trátala como costo perdido de la tienda. Una anulación el mismo día de una tarjeta **podría** evitarla (indicación del soporte de Wompi, citada por el coordinador; no comprobada y no aplica a Nequi). Reglas exactas del contrato: `PENDIENTE_DUEÑA`.

## 7. Costos (hay DOS comisiones por cada venta)
- **Shopify: 2 %** en el plan Basic por usar una pasarela externa (la pantalla Configuración > Pagos > Wompi lo dice: "Cargo por transacción de 2 %"), sobre (productos − descuentos + impuestos + envío). No aplica a pedidos de prueba.
- **Wompi: 2,65 % + $700 + IVA del 19 % sobre esa comisión.** Es la tarifa pública y **se confirmó con el pago real del pedido #1002** (Nequi): Pago 5.000,00; comisión −832,50 (= 2,65 % de 5.000 = 132,50 + 700); IVA de la comisión −158,17; **neto recibido 4.009,33**. Solo se midió con Nequi: para tarjeta y PSE confirma en "Entradas contables" del primer pago real. Tarifa de tu contrato (por si es distinta): `PENDIENTE_DUEÑA` (GAP-08).
- Ejemplo calculado (no medido) para una venta de $100.000: Wompi 2.650 + 700 = 3.350, más IVA 636,50 = **3.986,50**; Shopify 2 % = **2.000**; total ≈ **5.986,50 (cerca de 6 %)**. En ventas pequeñas el fijo de $700 pesa más: una venta de $5.000 deja 4.009,33 antes de la comisión de Shopify.
- Reembolsos: la comisión no se devuelve (sección 6).
- Los números de este documento son para tus cuentas de costos (documento 09 y hoja de economía unitaria del equipo): no son consejo contable.

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
