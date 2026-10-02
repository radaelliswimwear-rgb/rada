# 12 — Devoluciones y cambios

Para: Daniela. Este documento NO inventa reglas: usa solo tu Política de reembolso (Admin > Configuración > Políticas, `/policies/refund-policy`) y tu página de Garantía (`/pages/garantia`), leídas el 2026-10-02. Lo que esas políticas no dicen está marcado `PENDIENTE_DUEÑA`. `CONFIRMAR_EN_ADMIN` = verifica el nombre exacto en pantalla. Cierra GAP-24 (`CLAUDE-DOWNGRADE-READINESS`).

## 1. Qué está decidido y qué falta decidir
| Tema | Estado |
|---|---|
| Plazo de 5 días hábiles, casos aceptados y no aceptados, envío de la devolución a cargo de Radaelli, garantía de 12 meses | Decidido (política publicada; sección 2) |
| Derecho de retracto (venta a distancia, Ley 1480 de 2011, art. 47) | `PENDIENTE_DUEÑA: decidir texto` `[validar con asesor legal]`. La política dice "únicamente" esos 3 casos y no lo menciona; la política de envíos solo trae el título "derecho de retracto" |
| Cambio de talla porque "no me quedó" (sin error tuyo) | `PENDIENTE_DUEÑA: decidir texto`. La política no lo dice |
| Cambio o reembolso: quién elige y cuándo; reembolso parcial; crédito de tienda; devolver el envío que pagó la clienta | `PENDIENTE_DUEÑA` (la política no lo dice) |
| Plazo para responder y para reembolsar | `PENDIENTE_DUEÑA` |
| Comisión de Wompi en un reembolso | `PENDIENTE_DUEÑA` (contrato). Reembolso Shopify→Wompi sin comprobar (GAP-03) |
| Canales de contacto | Política publicada: WhatsApp o Instagram. `info@` no figura (documento 07) |

## 2. Las reglas en palabras simples
1. La clienta escribe dentro de **5 días hábiles** desde la entrega, con número de pedido y fotos o video claros.
2. Solo se acepta: defecto de fábrica (costuras, tela, herrajes, estampado), prenda distinta a la comprada o daño en el transporte.
3. Por ser ropa de baño (higiene íntima) no hay devolución ni cambio si cambió de opinión, si la prenda se usó (mar, piscina, playa) o se lavó, o si no tiene etiquetas ni protector de higiene intacto.
4. Tampoco si el daño viene de mal uso, desgaste normal o no seguir las indicaciones de lavado.
5. Radaelli evalúa cada caso. Si aplica, paga el envío de la devolución y, al recibir y verificar la prenda, coordina cambio o reembolso.
6. Garantía: 12 meses desde la entrega por defectos de fabricación o calidad. No cubre mal uso ni desgaste.

## 3. Paso a paso
**A. Recibir la solicitud**
1. Llega por WhatsApp (+57 313 535 9668) o Instagram. Correo `info@radaelliswimwear.com`: solo si confirmas que abre el buzón (`PENDIENTE_DUEÑA`).
2. Responde con la plantilla 1 (sección 6) y abre una fila en el registro (sección 5).

**B. Triaje (3 minutos)**
| Pregunta | Dónde mirar |
|---|---|
| ¿Número de pedido y nombre coinciden? | Admin > Pedidos |
| ¿Fecha de entrega? Cuenta 5 días hábiles (lunes a viernes, sin festivos; criterio práctico, `[validar con asesor legal]`) | Seguimiento de la guía en Envia |
| ¿El motivo está en la sección 2? | Mensaje de la clienta |
| ¿Hay fotos o video del defecto, de la etiqueta y del protector? | WhatsApp |
| ¿La talla o el color recibido no es el comprado? | Pedido frente a las fotos |
Resultado: **Aprobar** (plantilla 2), **Rechazar con motivo** (plantilla 3) o **Dudoso** (retracto, cambio de talla por ajuste, plazo vencido por pocos días). En lo dudoso no prometas nada: mira la sección 1 y pide ayuda (sección 8).

**C. Cambio por la prenda o talla correcta**
Sin mover dinero. No está ensayado: haz un simulacro con un pedido de prueba (GAP-24).
1. Productos > Inventario: confirma que hay stock del reemplazo (un carrito no reserva).
2. Pedidos > **Crear pedido**: agrega el reemplazo, la clienta y la dirección. Descuento del 100 % en la línea, motivo "Cambio pedido #[N]", y envío en $0 (`CONFIRMAR_EN_ADMIN`). Etiqueta `interno`: el tablero de medición resta esos pedidos.
3. Crea el pedido. Verifica que la talla nueva bajó 1.
4. En el pedido original escribe la nota "Cambio: ver pedido #[N2]".
5. Compra la guía de salida (documento 03) y despacha.
6. Cuando vuelva la prenda: si está perfecta, con etiquetas y protector, **suma 1** a su talla en Productos > Inventario. Si es defectuosa, **no la sumes** y guárdala aparte.
7. Anota salida y entrada en el libro de inventario (documento 04).
El flujo nativo de devolución/cambio del pedido (`CONFIRMAR_EN_ADMIN`) no se ha ensayado: no lo uses aún.

**D. Reembolso (total o parcial)**
Hazlo después de recibir y revisar la prenda.
1. Pedidos > el pedido > **Reembolsar** (documento 02, sección 6).
2. Elige prenda y cantidad. Para un reembolso parcial, escribe un monto menor (`CONFIRMAR_EN_ADMIN`).
3. **Reponer artículos**: marca solo si volvió perfecta y se puede revender.
4. Envío original: ¿se devuelve? `PENDIENTE_DUEÑA`.
5. Motivo: nota "Devolución, caso [N]". Deja marcado avisar a la clienta.
6. Confirma. El valor es lo que pagó (con el 20 % ya incluido). No hay IVA que devolver.
7. **Mira Wompi**: la transacción debe quedar anulada o reembolsada. Si Shopify dice "Reembolsado" y Wompi no muestra nada, el dinero NO salió (documento 02, sección 6). PSE, Nequi o Daviplata: puede no ser posible; pregunta a Wompi.
8. Envía la plantilla 4.
Aviso: el reembolso Shopify→Wompi aún no está comprobado (GAP-03). No prometas fechas. No ofrezcas crédito de tienda (`PENDIENTE_DUEÑA`; Shopify lo tiene, `CONFIRMAR_EN_ADMIN`).

**E. Garantía (hasta 12 meses)**
Igual triaje, con plazo de 12 meses. Reparación, cambio o reembolso: criterio y quién repara `PENDIENTE_DUEÑA`. Si es cambio, sigue C; si es reembolso, D. El envío lo paga Radaelli.

**F. Pedido aún sin despachar**
No es devolución: cancela (documento 04, sección 6). Si ya despachaste, no canceles.

## 4. Envío de la devolución con Envia
1. Pide a la clienta nombre, dirección y teléfono de recogida solo por el chat del caso. No los copies a archivos ni a la IA.
2. Admin > Aplicaciones > **Envia.com**: crea la guía de devolución, con origen en la clienta y destino en tu ubicación (`CONFIRMAR_EN_ADMIN (Envia)`: si ofrece "devolución" o hay que crear un envío a la inversa).
3. Paga con TU saldo y envía el PDF a la clienta. Nunca des tu contraseña de Envia.
4. Anota el costo (sección 5). Cancelación o reembolso de guías: `CONFIRMAR_EN_ADMIN (Envia)`.
5. Si Envia no lo permite: `PENDIENTE_DUEÑA` (por ejemplo, que la clienta pague y tú le reembolses con recibo).
Ojo: la dirección de origen puede ser personal (documento 03).

## 5. Contabilidad y registro
- No cobras IVA a la clienta: el reembolso es igual a lo pagado.
- Wompi puede quedarse con su comisión más el IVA de esa comisión aunque reembolses. Una anulación el mismo día puede evitarlo (documento 02). Es costo tuyo.
- Defecto, error o daño de transporte: son costo de la tienda (prenda, guía de vuelta, comisión).

| Fecha | Pedido | Motivo | Acción (cambio, reembolso, garantía, rechazo) | Monto devuelto | Costo para la tienda (guía, comisión Wompi) | Inventario (+1 o no) |
|---|---|---|---|---|---|---|
| | | | | | | |

Cada semana: exporta pedidos (documento 08) y confirma que cada "Reembolsado" también lo esté en Wompi (documento 04, sección 7).

## 6. Plantillas de mensajes
Usan "tú", como la política. Si prefieres voseo, cámbialo (decisión D2).
1. **Solicitud recibida:** "Hola [Nombre]. Recibimos tu solicitud del pedido #[N]. Para evaluarla, envíanos fotos o video claros y dinos qué día recibiste el pedido. Te respondemos en [PENDIENTE_DUEÑA: plazo]."
2. **Aprobada:** "Hola [Nombre]. Tu caso del pedido #[N] fue aprobado. Te enviamos la guía para devolver la prenda; el envío corre por cuenta de Radaelli Swimwear. Cuando la recibamos y revisemos, coordinamos [el cambio / el reembolso]."
3. **Rechazada:** "Hola [Nombre]. Revisamos tu solicitud del pedido #[N]. Por tratarse de prendas de baño e higiene íntima, no podemos aceptarla porque [motivo de la política: pasaron más de 5 días hábiles / la prenda fue usada o lavada / no conserva etiquetas y protector / el daño es por mal uso / no hay defecto de fábrica]. Política: [enlace]. Gracias por entender." Antes de rechazar un cambio de opinión, revisa el retracto (sección 1).
4. **Reembolso emitido:** "Hola [Nombre]. Emitimos el reembolso de $[monto] del pedido #[N] el [fecha], por el mismo medio de pago. El banco puede tardar [PENDIENTE_DUEÑA: plazo] en reflejarlo."

## 7. Si algo sale mal
| Síntoma | Qué hacer |
|---|---|
| Shopify "Reembolsado", Wompi sin cambio | Documento 02, sección 6; soporte de Wompi |
| La clienta insiste fuera de plazo | No discutas; revisa el retracto y pide ayuda |
| Llega otra prenda o el paquete viene vacío | Fotos; no reembolses hasta revisar |
| El inventario no cuadra tras un cambio | Libro de inventario; documento 04, sección 2 |
| No se genera la guía de devolución | Soporte de Envia (canal `PENDIENTE_DUEÑA`) |

## 8. Cuándo pedir ayuda a la IA y qué decirle
Pega primero: "Tienda Shopify Radaelli Swimwear, Colombia, COP, plan Basic, sin IVA; sigo el documento 12 de mi manual. No pego nombres, teléfonos ni direcciones: uso 'clienta A'." Pega la sección 2.
1. "Una clienta pide [devolución/cambio] del pedido #[N], recibido el [fecha], por [motivo]. Con estas reglas, ¿aprobar, rechazar o es un caso dudoso? Redáctame la respuesta."
2. "Guíame para cambiar la talla [X] por [Y] con un pedido en borrador al 100 % de descuento, sin que el inventario quede mal (sección 3C)."
3. "Voy a reembolsar el pedido #[N] pagado con [tarjeta/PSE/Nequi]. ¿Qué reviso en Shopify y en Wompi, sabiendo que Shopify→Wompi no está comprobado?"

## Estado al escribir (2026-10-02)
- La tienda sigue **privada**. Wompi está en **PRUEBA**: no hay pagos reales que reembolsar. El dominio está conectado pero **aún no es el principal**.
- No hay devoluciones, cambios ni guías de Envia compradas.
- Las políticas (reembolso, envío, privacidad, términos) y la página de Garantía están cargadas. La página "Contact" está vacía (GAP-12).
- Aviso: la política de envíos dice que el equipo informa la tarifa después de la compra y que puede pagarse a la transportadora, pero la tienda cobra tarifas fijas por zona en el pago. Revisar con el asesor (GAP-12).
- Pendientes: lo marcado `PENDIENTE_DUEÑA`, `[validar con asesor legal]` y `CONFIRMAR_EN_ADMIN`.
