# DEFERRED TASK — PUBLIC CUSTOMER EMAIL IDENTITY

Fecha: 2026-10-03 America/Bogota
Prioridad: ejecutar DESPUÉS de terminar el bloque activo actual. No interrumpir ni mezclar procesos.

## Decisión de la dueña
Daniela quiere conservar `radaelliswimwear@gmail.com` como correo administrativo/propietario de respaldo para Shopify, seguridad, recuperación, copias internas y contingencia si hubiera un problema con el dominio.

TODO lo visible para clientes debe usar `info@radaelliswimwear.com` para que la marca se vea profesional.

## Regla principal
NO cambiar innecesariamente el correo de login/propietario/recuperación de Shopify si actualmente es `radaelliswimwear@gmail.com`.

Sí auditar y reemplazar, cuando corresponda, cualquier aparición pública o customer-facing de `radaelliswimwear@gmail.com` por `info@radaelliswimwear.com`.

## Superficies a revisar
Claude debe auditar y corregir, sin asumir que todas usan la misma configuración:
1. Políticas legales: privacidad, reembolsos/devoluciones, envíos, términos, aviso legal, información de contacto.
2. Página Contacto/PQR y cualquier página pública.
3. Footer/header y textos de soporte.
4. Shopify Settings > Notifications / Sender email / reply-to / customer-facing sender identity.
5. Emails transaccionales visibles al cliente: confirmación de pedido, envío, cancelación, reembolso, contacto, recuperación de carrito si aplica.
6. Formularios de contacto y destino de respuestas.
7. Checkout y superficies legales enlazadas desde checkout.
8. Facebook/Instagram Shop, Google/merchant channels u otras integraciones donde el correo público pueda mostrarse.
9. Metadatos/schema/contact data del storefront si contienen email público.
10. Cualquier texto hardcoded en theme o traducciones ES/EN.

## Entregabilidad y seguridad
Antes de usar `info@radaelliswimwear.com` como remitente real:
- confirmar que el buzón recibe correos;
- confirmar configuración/autenticación de dominio necesaria para Shopify sender email;
- verificar SPF/DKIM/DMARC y no romper registros DNS existentes;
- enviar una prueba real a una cuenta externa y comprobar From/Reply-To/entrega;
- no exponer Gmail al cliente salvo que Shopify tenga una limitación técnica inevitable y documentada.

Si Shopify permite mantener Gmail como dirección interna/copia administrativa sin mostrarla al cliente, hacerlo.
Si existe opción de destinatario admin adicional, conservar `radaelliswimwear@gmail.com` como copia/respaldo cuando sea útil y no genere duplicados/confusión.

## Resultado esperado
- Cliente ve `info@radaelliswimwear.com` como contacto oficial y, donde técnicamente corresponda, como remitente/reply-to.
- Gmail permanece como identidad administrativa/backup y no como contacto público de marca.
- Políticas en ES e EN coherentes con `info@...`.
- No romper login, recuperación de cuenta, billing, Wompi, Meta, Shopify o DNS.

## Reporte obligatorio
Registrar en `ai-handoff/claude-result.md`:
- cada superficie auditada;
- valor anterior y nuevo (sin secretos);
- qué quedó customer-facing;
- qué quedó admin-only;
- prueba de envío/recepción y reply-to;
- cualquier limitación de Shopify;
- estado final PASS/GAP.

Si se requiere que Daniela haga clic en un email de verificación o reautentique, usar `OWNER_ACTION_REQUIRED_NOW` solo cuando Claude llegue a ese punto.
