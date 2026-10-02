# 03 — Envia.com: tu primer pedido y tus guías

Para: Daniela. Regla: **solo tú compras guías reales** y con tu saldo. No se compran guías de prueba.
Marca `CONFIRMAR_EN_ADMIN (Envia)` = hay que verlo en la pantalla de Envia la primera vez; no se pudo comprobar desde el repositorio.

## 1. Estado al escribir (2026-10-02)
- App **Envia.com** instalada en Shopify y vinculada ("Integración realizada"). Tienes cuenta en Envia con saldo $0. Ninguna guía comprada.
- Paquete por defecto en Envia: 15 x 10 x 5 cm, con "paquete automático" encendido. Peso por prenda en Shopify: 500 g (98 de 98 variantes). Son valores **provisionales**.
- Origen: la ubicación "Shop location" de Shopify en Barranquilla, Atlántico (Admin > Configuración > Ubicaciones). Revisa que la dirección y el teléfono de origen sean los que quieres que vea la transportadora. Ojo: esa dirección puede ser personal (`PENDIENTE_DUEÑA`).
- El cobro de envío al cliente en la tienda es una **tarifa fija por zona**, NO calculada por Envia. No hace falta activar "tarifas en vivo" de Envia en el checkout (exigiría un plan superior de Shopify). No las actives.
- Permisos: la app de Envia tiene permisos amplios (clientes, productos, pedidos). Si dejas de usarla, desinstálala (Configuración > Aplicaciones).

## 2. Qué es gratis y qué se paga
| Concepto | Estado |
|---|---|
| Instalar la app en Shopify | Sin costo conocido (`CONFIRMAR_EN_ADMIN (Envia)`) |
| Tener la cuenta de Envia | Sin costo conocido (`CONFIRMAR_EN_ADMIN (Envia)`) |
| Cada guía real | **Se paga** con saldo prepago de Envia. Precio según transportadora, peso y destino: se ve al cotizar |
| Recargar saldo | Monto mínimo, medios de pago y comisiones: `PENDIENTE_DUEÑA` (GAP-06) |
| Cancelar/reembolsar una guía | Política y plazo: `CONFIRMAR_EN_ADMIN (Envia)` |
| Seguro, contra entrega, recolección | `CONFIRMAR_EN_ADMIN (Envia)` |

Importante para tus números:
- Si el pedido supera $299.900, el cliente no paga envío y **tú pagas toda la guía**.
- En los demás pedidos el cliente paga una tarifa fija ($9.900 a $44.900) que puede ser distinta al costo real de la guía. Controla la diferencia con la tabla de la sección 6.

## 3. Antes del primer pedido (una vez)
1. Entra a Envia con tu cuenta (documento 09: dónde viven las credenciales).
2. Recarga un saldo pequeño (`PENDIENTE_DUEÑA`: monto).
3. Revisa origen, nombre/NIT o cédula, teléfono y correo del remitente.
4. Abre el paquete por defecto y confirma 15 x 10 x 5 cm. Pesa una prenda empacada real y anota el peso. Si difiere de 500 g, avisa para ajustar.
5. Haz una cotización (sin comprar) a Barranquilla y a otra ciudad para ver precios. Anótalos.
6. Pide que alguien pruebe que los pedidos de Shopify aparecen en Envia (con un pedido real, no de prueba).

## 4. Con un pedido real: comprar la guía
1. Admin > Pedidos: el pedido debe estar **Pagado**, con dirección y teléfono completos. (Documento 04, primer pedido.)
2. Empaca la prenda.
3. Admin > Aplicaciones > **Envia.com** (se abre dentro del Admin).
4. Busca el pedido (`CONFIRMAR_EN_ADMIN (Envia)`: puede estar en "Pedidos" o "Envíos").
5. Revisa destinatario, ciudad, teléfono. Si la ciudad no cuadra, corrígela ahí.
6. Revisa paquete (15 x 10 x 5 cm, 500 g) y valor declarado.
7. Compara transportadoras y elige (precio y tiempo). Anota el precio.
8. Confirma la compra con tu saldo. Imprime la guía (PDF) y pégala en el paquete.
9. Entrega a la transportadora o programa recolección (`CONFIRMAR_EN_ADMIN (Envia)`).
10. Vuelve a Shopify > Pedidos > el pedido: debe quedar **Cumplido** con número de seguimiento. Si no, ve a la sección 5.
11. El cliente debe recibir el correo "Tu pedido va en camino" (documento 07).
12. Mide: ¿llegó a tiempo? Anota novedades.

## 5. Si el seguimiento no llega a Shopify
1. Pedidos > el pedido > "Cumplir artículos" (o "Marcar como cumplido").
2. Pon el número de guía y la empresa de transporte. Deja marcada la casilla de avisar al cliente.
3. Guarda. Verifica que el cliente reciba el correo.

## 6. Hoja de control de costos (primeros 10 envíos)
| Pedido | Zona y tarifa cobrada | ¿Envío gratis? | Costo real de la guía | Diferencia | Observación |
|---|---|---|---|---|---|
| | | | | | |

Al terminar los 10: decide con ayuda si ajustar las tarifas de las 5 zonas (`CLAUDE-DOWNGRADE-READINESS`, GAP-06). No las cambies tú sola; el umbral de $299.900 y los mensajes del sitio dependen de ellas.

## 7. QUÉ HACER / QUÉ NO HACER
- Haz: guardar el PDF de cada guía y el número de seguimiento; avisar al cliente por WhatsApp si hay novedad.
- Haz: revisar el saldo cada semana.
- No hagas: comprar guías para pedidos "Pendientes" o de prueba.
- No hagas: activar tarifas de envío calculadas por Envia en el checkout.
- No hagas: dar tu contraseña de Envia a nadie.
- No hagas: reasignar la guía a otro pedido sin entender si se puede.

## 8. Qué se debe confirmar en la pantalla de Envia (lista de verificación)
- [ ] Dónde aparecen los pedidos de Shopify.
- [ ] Si Envia escribe sola el seguimiento en Shopify.
- [ ] Costo por guía y por transportadora a las 5 zonas.
- [ ] Recarga de saldo: mínimo, medios, comisión.
- [ ] Cancelación y reembolso de guías.
- [ ] Recolección: quién, cuándo, costo.
- [ ] Seguro y valor declarado.
- [ ] Contra entrega (no ofrecido hoy).
- [ ] Soporte: canal y horario (`PENDIENTE_DUEÑA`, GAP-07).
- [ ] Facturación: tipo de factura que Envia emite y para quién (`PENDIENTE_DUEÑA`).

## 9. Cuándo pedir ayuda
- Los pedidos no aparecen en Envia o muestran "No encontramos tu tienda".
- Una guía se compró para el pedido equivocado.
- Un paquete lleva más de lo normal sin movimiento.
- El costo real supera varias veces la tarifa cobrada.
Lleva: número de pedido, número de guía, captura sin datos de pago.
