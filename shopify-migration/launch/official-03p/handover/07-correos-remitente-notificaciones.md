# 07 — Correos, remitente y notificaciones

Para: Daniela. Los correos de compra (confirmación, envío, reembolso) los manda Shopify con plantillas. Tú decides el remitente y los textos.

## 1. Estado al escribir (2026-10-02; actualizado en la tarde, con la tienda ya pública)
| Tema | Hoy |
|---|---|
| Correo de la tienda (contacto y remitente) | Tu Gmail de la marca. Es también el **correo público** que ve la clienta (`radaelliswimwear@gmail.com`) en «Información de contacto», «Aviso legal», la página «Contacto» y el pie |
| Lo que ve el cliente como "De:" | Una dirección de Shopify tipo `store+número@shopifyemail.com`. Si el cliente responde, la respuesta llega a tu Gmail. Motivo: Shopify no puede autenticar un Gmail como remitente propio |
| Quién recibe "Nuevo pedido" (personal) | Solo tu Gmail, todos los pedidos |
| Plantillas al cliente | En español (confirmación de pedido, envío, etc.) |
| Plantillas al personal | En inglés (igual que el laboratorio). Decisión opcional |
| ¿Llegan realmente a la bandeja del cliente? | **No verificado**: nadie ha leído tu bandeja. Se verifica con la primera compra real (`PENDIENTE_DUEÑA`) |
| Correo `info@radaelliswimwear.com` | Existe en Hostinger (el DNS lo indica); falta confirmar que puedes abrir el buzón (`PENDIENTE_DUEÑA`). Al cambiar el DNS del sitio (2026-10-02) **no se tocaron** los registros de correo (MX, SPF, DKIM, DMARC): solo cambiaron el A `@` y el CNAME `www`. Aun así, confirma con un correo de prueba que `info@` recibe (documento 10, revisión T+30 min) |
| Marketing / boletín | No hay plataforma. No prometas correos de marketing. El formulario del sitio guarda suscriptores en Clientes |

## 2. Ver y cambiar el remitente
Ruta: Admin > Configuración > Notificaciones > **Correo electrónico del remitente** (`CONFIRMAR_EN_ADMIN`).

### Opción hoy (sin DNS): Gmail
- No necesitas hacer nada. Los clientes ven la dirección de Shopify y responden a tu Gmail.
- Si Shopify te pide verificar un correo: abre el enlace desde tu Gmail.

### Opción marca: `info@radaelliswimwear.com` (después de conectar el dominio; GAP-05)
Requisitos:
1. El dominio ya apunta a Shopify (documento 01).
2. Puedes abrir el buzón `info@` (webmail de Hostinger, `CONFIRMAR_EN_ADMIN`).
3. Puedes entrar a Hostinger DNS.

Pasos:
1. Notificaciones > Correo del remitente > Editar > escribe `info@radaelliswimwear.com`.
2. Shopify te manda un correo de verificación a `info@`. Abre ese buzón y pulsa el enlace.
3. Shopify te muestra "Autenticar dominio" con registros DNS (DKIM y SPF/DMARC). **Copia exactamente** lo que muestra.
4. En Hostinger > Registros DNS agrega esos registros (documento 01, sección 3).
5. **Importante:** si ya existe un TXT que empieza por `v=spf1`, **no crees otro**. Solo puede haber UNO. Pide ayuda para fusionarlos. (En tu zona DNS ya hay un SPF de Hostinger, DKIM de Hostinger, `resend._domainkey` y `_dmarc`: no los borres.)
6. **No toques MX** ni el TXT de verificación de Google/Facebook.
7. Vuelve a Shopify y pulsa "Verificar". Puede tardar de minutos a horas.
8. Mientras no esté verificado, seguirá saliendo la dirección de Shopify: no es grave.
9. Anota en el documento 01, sección 7, el cambio de DNS.

QUÉ NO HACER: no cambies el remitente por una dirección que no puedes abrir; si falla algo, los clientes no podrán responder.

## 3. Quién recibe los avisos de pedidos (personal)
Ruta: Notificaciones > **Notificaciones para empleados** > Nuevo pedido > destinatarios (`CONFIRMAR_EN_ADMIN`).
- Hoy: tu Gmail.
- Recomendado: agregar `info@radaelliswimwear.com` **solo cuando el buzón funcione**; si no, la alerta rebota sin avisar (decisión D12; por defecto se deja solo Gmail).
- Si trabajas con otra persona de confianza, agrégala aquí y no compartas tu contraseña (documento 09).

## 4. Plantillas en español
Ruta: Notificaciones > Clientes > abre una plantilla > "Vista previa".
Las que debes mirar una vez:
- Confirmación de pedido.
- Pedido enviado / en camino (con seguimiento).
- Reembolso.
- Pedido cancelado.
- Facturas de borrador (si creas pedidos a mano).
Revisa: textos en español, montos en pesos colombianos, nombre "Radaelli Swimwear", sin promesas de plazos que no puedas cumplir.
- Para cambiar un texto o el asunto: ayuda de la IA (con el documento 05, pide solo "asunto" o "texto"). No toques el código de la plantilla ("Editar código") sin ayuda.
- Plantillas del personal en inglés: puedes dejarlas así. Si las quieres en español, es una decisión aparte (GAP-22).

### 4.1 Contacto del cliente
- **Actualizado 2026-10-02:** la identidad del vendedor (Radaelli Swimwear, NIT, dirección, teléfono/WhatsApp 3135359668 y el correo público `radaelliswimwear@gmail.com`) ya está publicada en «Información de contacto», «Aviso legal», la página «Contacto» y los enlaces del pie (menú «Ayuda»). Lo que falta de GAP-12 está en `CLAUDE-DOWNGRADE-READINESS`.
- Contacto real hoy: WhatsApp, Instagram y ese Gmail. `info@` todavía no se publica (falta confirmar el buzón).

## 5. Cómo enviar un correo de prueba a ti misma
**Prueba rápida de una plantilla (siempre disponible):**
1. Notificaciones > abre la plantilla > botón **Enviar correo de prueba** (`CONFIRMAR_EN_ADMIN`: el nombre exacto del botón).
2. Llega al correo del personal (tu Gmail). Mira bandeja y spam.
3. Esto prueba el diseño; **no prueba** la entrega a un cliente.

**Prueba de entrega a un cliente (sin crear pedidos reales):**
1. Pedidos > **Crear pedido** (borrador).
2. Agrega un producto, y como cliente un correo **tuyo** (distinto al del remitente si tienes otro).
3. Pulsa **Enviar factura** (correo "invoice"). Mira tu bandeja y spam; revisa el remitente y el idioma.
4. **Borra el borrador** (no lo pagues).
Lo ideal: la compra real del lanzamiento (documento 02) con tu propio correo como cliente: confirma que el correo de "Pedido confirmado" llegó a la bandeja (no spam).

## 6. Si un cliente dice "no me llegó el correo"
1. Pedidos > el pedido > Cronología (abajo): ¿dice "Se envió un correo de confirmación"? Si sí, Shopify lo envió.
2. Pídele que revise spam/Promociones y que el correo esté bien escrito.
3. Si lo escribió mal: edita el correo del cliente en el pedido y reenvía (Más acciones > Reenviar confirmación de pedido, `CONFIRMAR_EN_ADMIN`).
4. Si la cronología no muestra envío: documento 10 y pide ayuda.

## 7. QUÉ HACER / QUÉ NO HACER
- Haz: revisar spam en tu Gmail cada día.
- Haz: probar un correo cada mes (sección 5).
- No hagas: usar tu correo personal como remitente.
- No hagas: dos registros SPF.
- No hagas: borrar plantillas por "limpiar".

## 8. Cuándo pedir ayuda
- Los clientes reportan que no reciben correos.
- Shopify no verifica el dominio de `info@` después de 24 horas.
- Un cliente recibe un correo en inglés.
- Aparece un correo sospechoso que parece de Shopify pidiendo claves (no respondas; pregunta).
