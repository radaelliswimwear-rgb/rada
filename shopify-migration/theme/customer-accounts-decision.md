# Customer Accounts + Favoritos — Decision Record (Fase 02L)

**Source of truth para las fases siguientes.** El detalle y la evidencia están en `theme/customer-accounts-report.md`. Fecha: 2026-09-28.

## DECISIÓN (aprobada por Daniela)

- **New Customer Accounts** de Shopify.
- **Ingreso sin contraseña** con código por email.
- **Sin cuentas Classic / con contraseña.** No se construyen templates `customers/*`, formularios de contraseña, recuperación, cookies ni tokens propios.
- **Favoritos como invitada permitidos:** el corazón funciona sin ingresar.
- **Favoritos de la cuenta sincronizados entre dispositivos.**
- **Unión invitada → cuenta al ingresar:** sin duplicados y sin perder nada si falla.
- **Después de una unión exitosa, la cuenta es la fuente de verdad.**
- **"Mis favoritos" integrado a la experiencia de cuenta**, en la URL que da Shopify (sin forzar `/cuenta/favoritos`).

## ARQUITECTURA ELEGIDA

| Pieza | Elección |
|---|---|
| Ingreso / perfil / direcciones / pedidos / detalle | **Nativo** de Shopify. Sin dashboard propio |
| Entrada en el header | `<shopify-account>` oficial (desktop) + `routes.account_url` (mobile, sin JS, sin cuentas nuevas) — **hecho** |
| Dato de favoritos | Metafield **del comercio** `custom.wishlist` (`list.product_reference`, GIDs en orden). Creado en Admin, no en la app. Tope 100 para altas (Shopify: 128); nunca se recorta |
| Lectura en la tienda | Liquid `customer.metafields.custom.wishlist` → bootstrap JSON (0 requests) — **hecho, inerte** |
| Escritura desde la tienda | App custom de Radaelli: app proxy → función sin estado. Identidad SOLO por `logged_in_customer_id` firmado (HMAC, tienda, ±300 s). Admin `metafieldsSet` con `compareDigest` |
| "Mis favoritos" en la cuenta | Extensión full-page `customer-account.page.render` en el menú de la cuenta. Lee con la Customer Account API. "Quitar" con esa API o con un session token (nunca por el proxy) |
| Theme ↔ app | `window.Radaelli.wishlist.connectAccount(transport)` — contrato en el reporte § 8 — **hecho** |
| Unión | Cuenta primero + invitada en su orden (`{A,B,C}+{B,D} = [B,D,A,C]`). Web Lock. Se poda lo local solo tras un 200. Idempotente — **hecho y probado** |
| Cerrar sesión | La lista de la cuenta nunca se copia al navegador. Las otras pestañas vuelven a invitada. La cola por clienta vence a 30 días con aviso — **hecho y probado** |
| Interruptores | Setting `wishlist_account_sync` **apagado** + transporte de la app presente (sin app no hay modo cuenta) |

## COMPONENTES NECESARIOS (no construidos todavía)

1. Definición `custom.wishlist` en Admin (Clientes).
2. App custom de Radaelli (custom distribution):
   - app embed que registra el transporte;
   - app proxy;
   - función sin estado (hosting separado del sitio actual);
   - extensión "Mis favoritos".
3. Scopes: `read_customers`, `write_customers`, `read_products`, `write_app_proxy`, `customer_read_customers`, `customer_write_customers`. Datos protegidos nivel 1. Webhooks de compliance como no-op.

## BLOQUEADO HASTA DEVELOPMENT STORE / APP

- **GO/NO-GO** (reporte § 20):
  1. `customer` en Liquid tras cada ingreso con cuentas nuevas;
  2. tasa de `logged_in_customer_id` vacío en el proxy;
  3. nada de cache entre clientas;
  4. `compareDigest` en la Admin API;
  5. Customer Account API escribe en `custom.*`;
  6. extensión full-page en el plan real;
  7. token de Admin sin base de datos;
  8. el proxy reenvía los headers anti-CSRF;
  9. templates legacy ignorados.
- **Construir:** la app, la función, la extensión y el transporte.
- **Encender `wishlist_account_sync`:** solo después de pasar los GO/NO-GO.
- **Migrar los favoritos actuales:** plan en el reporte § 15. Requiere aprobación de Daniela para pre-crear clientes (Habeas Data).

## NO HACER

- Templates `customers/*` o cualquier login con contraseña.
- Guardar la lista de la cuenta en localStorage.
- Tomar el id de cliente del navegador, o usar el email como llave.
- Metafield `$app` como único dato: se borra al desinstalar la app.
- App de wishlist de terceros.
- Botones que aparenten sincronizar sin hacerlo.
