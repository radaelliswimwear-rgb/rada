# Checklist go-live — Radaelli Swimwear

Resultado de la auditoría de preparación go-live de sep. 2026 (revisión
integral antes de escalar tráfico/pauta/ventas reales). Ver también
[production-recovery.md](./production-recovery.md) (qué hacer ante un
incidente) e [incident-response.md](./incident-response.md) (casos ya
cubiertos: Wompi, admin comprometido, secreto filtrado, stock
inconsistente).

Estados: **DONE** (verificado con evidencia -- código, test, o passive
smoke real), **MANUAL CHECK** (no verificable desde este repo/entorno,
requiere que alguien con el acceso correspondiente lo confirme),
**BLOCKER** (impide operar con confianza, requiere acción antes de escalar
tráfico en serio).

| Área             | Estado                       | Nota                                                                                                                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOMINIO          | DONE                         | Única fuente de verdad (`getAppBaseUrl()`), sin dominios de preview hardcodeados en código de producción; ya blindado con tests de regresión.                                                                                                                                                                                                                   |
| EMAIL            | MANUAL CHECK                 | Código y templates correctos (2 bugs de contenido menores corregidos, ver backlog); nadie vio los templates renderizados en un cliente de correo real, y no se pudo confirmar desde acá que `RESEND_API_KEY`/`EMAIL_FROM` estén vigentes en producción.                                                                                                         |
| PAGOS            | DONE                         | Exactly-once, reserva/liberación de stock, idempotencia de doble-click, y el gate de configuración (simulado bloqueado en producción, consistencia Wompi sandbox/real) ahora además deja alerta CRITICAL si dispara -- antes la falla más severa posible del sistema de pagos era la menos visible.                                                             |
| INVENTARIO       | DONE (con 1 ítem en backlog) | Stock nunca puede quedar negativo por ningún camino de código verificado; se agregó `scripts/check-inventory-consistency.ts` (checker reutilizable de solo lectura). El ajuste manual de stock en `/admin/inventario` sigue siendo "valor absoluto" sin control de concurrencia -- ver backlog.                                                                 |
| CHECKOUT         | DONE                         | Invitado funciona, carrito vacío/producto agotado/cambio de precio-stock en vuelo ya bloqueados server-side; se cerró el hueco real que quedaba (`shippingAddress` ahora se valida también en el servidor, no solo en el cliente) y el total mostrado con cupón aplicado ahora se revalida cuando cambia el carrito.                                            |
| PEDIDOS          | DONE                         | Un admin puede operar un pedido real de punta a punta; se corrigió la acción destructiva sin confirmación (`Reembolsado`) y se agregó el método de envío (Estándar/Exprés) al detalle del pedido, que antes no se veía en ningún lado del panel.                                                                                                                |
| ANALYTICS        | DONE (blocker cerrado)       | Se cerró un blocker real: Meta CAPI mandaba un Purchase fantasma para pedidos de WhatsApp nunca pagados (`Payment.status` queda `PENDING` para siempre en ese flujo). `page_view` no tiene ningún call site propio -- ver backlog/manual check de GA4 Enhanced Measurement.                                                                                     |
| ALERTAS          | DONE (2 blockers cerrados)   | El cron de pagos vencidos ahora tiene protección por-ítem y fail-closed en su consulta (antes un solo registro problemático podía trabarlo indefinidamente y en silencio); el gate de configuración de pagos ahora alerta si bloquea el 100% de los checkouts. Varios ítems de visibilidad menor quedan en backlog (ver abajo).                                 |
| SEO              | DONE (con 1 manual check)    | robots.txt/sitemap/canonical/noindex correctos y ya probados; se encontró que 77 de 88 archivos de test del repo (incluidos los 4 de regresión SEO) no corren con el comando estándar `test:unit` -- ver backlog.                                                                                                                                               |
| BACKUPS/RECOVERY | MANUAL CHECK                 | `docs/production-recovery.md` (nuevo) cubre los 8 escenarios pedidos con pasos prácticos; la ventana real de retención de backups/PITR de Neon para este proyecto no se pudo confirmar desde este entorno (sin acceso al dashboard de Neon).                                                                                                                    |
| ADMIN            | DONE                         | Las 17+ acciones de admin siguen protegidas server-side (`requireAdmin()`), con audit trail vía `logAdminMutation`: confirmado que las mutaciones de pedidos pasan por ahí.                                                                                                                                                                                     |
| CATÁLOGO         | DONE (con 1 nota menor)      | 29/29 páginas de producto en producción responden 200, con precio > 0 e imágenes reales (passive smoke real contra radaelliswimwear.com); un slug (`COSTA-ESMERALDA-AZUL`) usa mayúsculas, inconsistente con el resto del catálogo (kebab-case minúscula) -- no es un bug funcional, solo inconsistencia de datos, requiere decisión de Daniela si se renombra. |
| SEGURIDAD        | DONE                         | P0/P1/P2 ya cerrados en fases anteriores de esta misma sesión -- esta auditoría no los repitió, solo confirmó puntualmente que siguen intactos donde se cruzaron (PII en logs, consentimiento, tráfico interno, histórico de marketing protegido).                                                                                                              |
| OPERACIÓN        | MANUAL CHECK                 | El diseño de `SystemLog`/alertas es sólido, pero no hay panel de admin para consultarlo (por diseño, documentado) y nadie forzó una alerta real de punta a punta en producción para confirmar que el correo efectivamente llega hoy.                                                                                                                            |

## BLOCKERS encontrados y su estado

Los 3 hallazgos que esta auditoría clasificó como blocker/NOT_READY para
su dimensión ya fueron corregidos, con tests, antes de este commit:

1. **Meta CAPI mandaba un Purchase real para pedidos de WhatsApp nunca
   pagados** (`lib/analytics/marketing-outbox.ts`,
   `lib/orders/order-creation-core.ts`) -- cerrado.
2. **El cron de pagos vencidos podía trabarse indefinidamente y en
   silencio ante un solo registro problemático**, reabriendo el mismo
   leak de inventario P0 que existe para prevenir
   (`app/api/cron/release-stale-payments/route.ts`) -- cerrado.
3. **El gate de configuración de pagos no dejaba ningún rastro si
   bloqueaba el 100% de los checkouts** (`lib/payments/guard-real-payments.ts`)
   -- cerrado.

Ningún blocker queda abierto al momento de este commit.

## Backlog (no bloqueante, requiere decisión o trabajo adicional)

No aplicado en esta auditoría -- reportado para que alguien decida cuándo
abordarlo, sin bloquear el go-live:

- **`package.json` `test:unit` solo corre 11 de 88 archivos de test** (glob
  `tests/**/*.test.ts`, no incluye `app/`, `components/`, `lib/`) -- los 4
  tests de regresión SEO y otros 73 nunca se ejecutan con el comando
  estándar. Riesgo medio: una regresión futura en esas áreas no la agarra
  ningún comando "estándar" (aunque esta auditoría sí corrió el set
  completo a mano).
- **Ajuste manual de stock en `/admin/inventario`** guarda un valor
  absoluto sin control de concurrencia -- puede "re-crear" unidades ya
  vendidas si el admin guarda con datos de pantalla obsoletos mientras hay
  una compra concurrente.
- **`/search` y `/search/[collection]`** (rutas legacy del template
  Next.js Commerce, nunca enlazadas desde la UI real) devuelven 500 en vez
  de 404 sin `SHOPIFY_STORE_DOMAIN` configurado -- falta el mismo guard
  `!endpoint` que ya tienen sus funciones hermanas.
- **Email admin de pedido nuevo** dice "Referencia Wompi" incluso para
  pedidos de WhatsApp, y el fallback de `freeShippingThreshold` cuando el
  snapshot es `null` difiere entre el correo admin (`?? 0`, casi siempre
  dice "GRATIS") y el correo cliente (usa el default real) -- dos correos
  del mismo pedido pueden decir cosas distintas sobre el envío.
- **Varias alertas del webhook de Wompi usan un `dedupeKey` global** (solo
  el nombre del evento) en vez de por-pago -- un pago problemático puede
  suprimir la alerta de otro pago distinto dentro de la misma hora de
  cooldown. En sentido opuesto, los reintentos agotados de
  `EmailOutbox`/`MarketingEventOutbox` alertan por-job -- una falla
  sistémica (ej. `RESEND_API_KEY` revocada) manda un correo separado por
  cada pedido afectado en vez de uno agrupado.
- **`createOrderForPayment`** (el paso "items no coinciden con lo
  cobrado", caso `flaggedForReview` nombrado explícitamente en el
  encargo) no tiene su propio `logEvent` -- hoy solo se ve indirectamente
  si pasa por el cron de recuperación.
- **Los 4 correos de auth** (bienvenida/verificación/reset/cambio de
  contraseña) no alimentan `SystemLog` si fallan al enviarse -- a
  diferencia de los correos de pedido, que sí alertan vía `EmailOutbox`.

## Test data / limpieza (requiere decisión, no se tocó nada)

- `prisma/seed.ts` sigue sembrando el catálogo demo original de
  `lib/placeholder-data.ts` (~20 productos de ropa genérica, no
  swimwear) -- **REQUIERE DECISIÓN**: decidir si seed.ts debe pasar a usar
  datos reales de Radaelli. No se tocó `prisma/seed.ts` (archivo
  sensible).
- `scripts/add-product-radaelli.ts`, `scripts/add-sunset-products.ts`,
  `scripts/add-swim-categories.ts` -- **SAFE TO REMOVE** (como archivos de
  repo): scripts de un solo uso puntual ya cumplidos, no referenciados en
  `package.json`, no documentados como reutilizables.
- `app/api/admin/diagnostico-conexion/route.ts` -- **KEEP** (bien
  resguardado, sin riesgo), pero candidato a revisión: se construyó para
  un corte de base de datos coordinado puntual; confirmar si ya terminó.
- Credenciales `test@lago.com`/`demo@lago.com`/`lago1234` documentadas en
  texto plano en varios `docs/*.md` -- **REQUIERE DECISIÓN**: no es código
  de producción, pero depende de disciplina operativa (nunca correr
  `db:seed` contra producción real).
- `prod-race-test` y `producto-e2e-sandbox-real` -- artefactos de prueba
  confirmados en la base de **desarrollo** (no se pudo verificar
  producción desde este entorno, ver límite abajo).

## Límite de esta auditoría (honestidad sobre alcance)

Sin acceso directo a la base de datos de **producción** real desde este
entorno (`vercel env pull` no expone valores de secretos -- confirmado al
intentarlo). El catálogo real de producción se auditó por HTTP pasivo
contra radaelliswimwear.com (29/29 páginas de producto, todas 200, precio

> 0, imágenes presentes); los checks a nivel de fila (duplicados,
> inventario histórico, test data) se verificaron contra la base de
> **desarrollo** y quedan como scripts reutilizables listos para correr
> contra producción por alguien con ese acceso.
