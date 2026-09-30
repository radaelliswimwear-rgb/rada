# 03K — QA de correos y notificaciones, y comandos de monitoreo y rollback

*Se ejecuta en la tienda final. No crea cuentas ni conecta plataformas de correo o de marketing (E1: decisión de la dueña, `OPTIONAL/DEFERRABLE`). Los correos de compra los envía Shopify con su plantilla; el remitente y los textos son de la dueña.*

## 1. Lo que ya está comprobado (Dev Store, pasarela de prueba de Shopify)

- Con 2 pedidos de prueba (#1001 reembolsado y #1002 pagado, COP 319.840, 2 prendas, envío estándar gratis) Shopify **envió** el correo de confirmación de pedido (`theme/03J-owner-checkpoint-report.md`, punto AC-08).
- **Lo único que sigue siendo solo de la dueña:** confirmar que ese correo **llegó a su bandeja o a spam** (`AC-08`: `YES` / `NO` / `NOT_FOUND`). Claude no lo puede ver y no se le pide reenviarlo.

## 2. Checklist (una fila por notificación)

| # | Notificación (Configuración > Notificaciones) | Cómo se prueba | Criterio PASS | Quién |
|---|---|---|---|---|
| N1 | Confirmación de pedido | Pedido de prueba pagado (P12 del runbook) | Llega; idioma español; montos en COP con formato colombiano; datos del pedido correctos; remitente y nombre de la tienda finales | Claude prepara; la dueña confirma llegada |
| N2 | Confirmación de envío / seguimiento | Marcar el pedido de prueba como enviado con un número de guía de prueba | Llega en español; el enlace de seguimiento abre | Dueña (acción en el Admin) |
| N3 | Reembolso | Reembolsar el pedido de prueba (lo pulsa la dueña) | Llega; monto correcto | Dueña |
| N4 | Invitación / activación de cuenta y restablecer contraseña | Registrarse con un correo de prueba de la dueña; «olvidé mi contraseña» | Llegan en español; el enlace funciona; no se muestran contraseñas | Dueña |
| N5 | Formulario de contacto | Enviar el formulario del pie | Llega a la dirección de contacto que decida la dueña | Dueña |
| N6 | Remitente y dominio de envío | Configuración > Notificaciones > Correo del remitente | Remitente definitivo elegido por la dueña; registros de autenticación del dominio (SPF/DKIM) verificados por su proveedor de DNS | Dueña |
| N7 | Textos por defecto en inglés | Recorrer cada plantilla activa | Ninguna plantilla visible para la clienta queda en inglés (o se decide por escrito) | Claude propone los cambios; la dueña aprueba |
| N8 | Aviso «Avísame» de reposición y boletín | — | `OPTIONAL/DEFERRABLE`: solo si la dueña elige una plataforma (E1); sin plataforma no se promete | Dueña |

**Regla:** las plantillas no llevan promesas de plazos ni de tarifas que la tienda no respalde (el plazo de envío y el envío gratis salen de la configuración de envíos; `launch/03K-clean-store-bootstrap-runbook.md` P09).

## 3. Monitoreo posterior al lanzamiento (comandos)

Detalle de tiempos y decisiones: `launch/03G-post-launch-monitoring.md` (T+15 min, T+1 h, T+4 h, T+24 h; D-MO1 a D-MO7).

| Qué | Comando o acción | Criterio |
|---|---|---|
| El theme publicado es el RC congelado | `npx shopify theme list --store <tienda-final> --json` y `npx shopify theme pull --store <tienda-final> --theme <id-theme> --path <carpeta-vacía>` y `node launch/tools/03k-theme-remote-parity.mjs <zip-extraído> <carpeta-vacía>` | `PARIDAD: PASS`; el rol `live` es el theme del RC |
| Línea base de 404 | `node launch/tools/03g-monitoring-404-baseline.mjs` | Sin 404 nuevos en las URL del sitio actual (51 redirecciones) |
| Superficies | `launch/tools/03k-surface-check.js` en una pestaña de la tienda (17 superficies × 4 anchos) | 0 defectos nuevos frente a P12 |
| Pagos y pedidos | Admin > Pedidos y Configuración > Pagos | Pedidos reales coherentes con los pagos; ninguna pasarela de prueba activa |
| Analítica | `analytics/03K-final-store-event-verification.md` | V4, V5, V8 y V10 en PASS con datos reales |

## 4. Rollback (comandos)

Detalle: `launch/03G-rollback-plan.md` (RP-01 a RP-45).

| Situación | Acción | Quién |
|---|---|---|
| El theme nuevo falla | `npx shopify theme publish --theme <id-theme-anterior> --store <tienda-final>` (el theme anterior, o RC1.9 subido de antemano con `dist/radaelli-shopify-theme-rc1.9.zip`, SHA-256 `fa68a9a9e505b5dce9f8e128f28c6541903729b2a13c7bad6488c1070a06533c`) | Dueña con Claude |
| Redirecciones equivocadas | Admin > Navegación > Redirecciones: eliminar las filas importadas de `seo/shopify-redirects-import-final-store.csv` y reimportar la corrección | Dueña |
| Pagos fallan | Configuración > Pagos: desactivar Wompi y dejar el método que la dueña decida (nunca dos proveedores a la vez) | Dueña |
| DNS | Reapuntar el dominio al sitio actual según `launch/03G-cutover-runbook.md` (TTL bajo mientras dure la ventana) | Dueña |
