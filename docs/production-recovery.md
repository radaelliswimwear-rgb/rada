# Recuperación de producción — Radaelli Swimwear

Guía práctica de "qué hacer primero" ante un incidente grave en producción,
escrita para la auditoría de preparación go-live (sep. 2026). Complementa a
[incident-response.md](./incident-response.md), que ya cubre en detalle
**fallas de Wompi**, **admin comprometido**, **secreto filtrado** y **stock
inconsistente** con pasos exactos — este documento no repite ese contenido,
solo lo referencia y cubre los escenarios que faltaban: rollback de código,
incidente de base de datos, caída de Resend/Analytics, y problema de
dominio/DNS.

Si algo de acá queda desactualizado (un nombre de variable, un archivo que
se movió), priorizá lo que diga el código sobre lo que diga este documento.

---

## A. Rollback de Vercel (un deploy nuevo rompió Production)

**Sin código nuevo, sin build**: Vercel → proyecto `rada` → pestaña
**Deployments** → buscar el último deployment `Ready` ANTERIOR al que rompió
todo → menú `···` → **Promote to Production**. Esto vuelve a servir ese
build inmediato (no reconstruye nada), tarda segundos.

**Importante — límite real de este mecanismo (confirmado en esta misma
sesión de auditoría, incidente real de sep. 2026):**

- El botón "Redeploy" sobre un deployment VIEJO puede quedar sin efecto si
  Vercel no vuelve a dispararlo — la forma confiable y ya probada de forzar
  que Production sirva el HEAD real de `main` es un commit vacío:
  ```bash
  git commit --allow-empty -m "chore: retrigger production deployment"
  git push origin main
  ```
  Esto SÍ dispara la integración de GitHub de forma confiable. Usarlo si
  "Promote to Production" no alcanza o si hace falta re-disparar el deploy
  del HEAD actual sin cambiar código.
- Un rollback de código **no** revierte migraciones de base de datos ya
  aplicadas (`prisma migrate deploy` corre en cada `production:build`, ver
  `package.json`). Si el deploy que rompió algo incluía una migración
  destructiva, promover el deployment viejo deja el código viejo
  corriendo contra un schema nuevo — **puede romper más de lo que arregla**.
  Antes de un rollback, confirmar si el deploy problemático tocó
  `prisma/migrations/` (`git show <sha> --stat`); si sí, tratar esto como
  incidente de base de datos (sección B) además de rollback de código.
- `scripts/check-production-db-readiness.ts` (corre automático dentro de
  `production:build`, ver `package.json`) ya actúa como gate fail-closed
  antes de que una migración riesgosa llegue a Production — si el build
  falló ahí, Production sigue sirviendo el deployment anterior sin cambios;
  no hace falta rollback manual en ese caso, solo corregir la migración y
  volver a desplegar.

**Verificación después de cualquier rollback**: repetir el protocolo de
un solo chequeo (`vercel ls` una vez, esperar 2-3 min si sigue construyendo,
un chequeo más) + passive smoke (home, un producto, checkout, admin,
webhook Wompi `GET` → 405) antes de dar el incidente por cerrado.

---

## B. Incidente de base de datos (Neon inalcanzable / datos corruptos)

**Primero, diagnóstico sin tocar nada:**

1. [Neon status](https://neonstatus.com) — descartar una caída del lado de
   Neon antes de asumir un problema propio.
2. Vercel → Runtime Logs → buscar errores de conexión (`ECONNREFUSED`,
   `Connection terminated`, timeouts de `pg`) para confirmar que es
   realmente la DB y no otra cosa.
3. `npx tsx scripts/check-production-db-readiness.ts` (con
   `DATABASE_URL`/`DATABASE_ENV_LABEL=production` reales en el entorno
   desde donde se corra) — de solo lectura, nunca escribe nada; confirma si
   el problema es de conectividad, de una migración a medio aplicar, o de
   datos (duplicados de `Cart`/`Wishlist`/`Payment`, usuario invitado
   sentinela faltante).
4. `npx tsx scripts/check-inventory-consistency.ts` (mismo criterio, mismo
   entorno, agregado en esta auditoría) — de solo lectura, chequea stock
   negativo, pagos con stock reservado nunca liberado, pedidos cancelados
   con stock sin liberar, y otras inconsistencias de catálogo/inventario.

**Si Neon está caído del lado de ellos:** no hay mitigación propia posible
más que esperar — considerar `WRITES_PAUSED=true` (ver
`lib/system/write-pause.ts`) si el sitio queda en un estado a medias
(algunas requests conectan, otras no) para evitar pedidos/pagos
inconsistentes mientras se restablece. **Límite documentado en el propio
código**: esta variable solo tiene efecto en el deployment que se
construya con ella ya puesta — no pausa el deployment de Production
actual sin un rebuild, ni ningún Preview ya corriendo.

**Backups / point-in-time restore**: Neon ofrece restore a un punto en el
tiempo (branching desde un timestamp anterior) según el plan contratado —
la ventana de retención exacta de este proyecto **no se pudo confirmar
desde este entorno** (no hay acceso al dashboard de Neon desde acá; ver
sección de límites al final de este documento). **Acción para Daniela**:
confirmar en Neon → proyecto → Settings → Backup/Restore cuál es la
ventana de retención vigente, y anotarla acá para que quede documentada.

**Si hace falta restaurar un punto anterior:** hacerlo siempre a una rama
nueva de Neon (nunca sobre la rama de producción directamente) para poder
comparar antes de decidir el corte final, y coordinar la ventana de
inconsistencia (pedidos/pagos entre el punto restaurado y el incidente)
con Daniela antes de cualquier corte — puede haber ventas reales en el
medio que no se pueden simplemente descartar.

---

## C. Caída de Wompi

Ver [incident-response.md § "Si falla Wompi"](./incident-response.md) —
ya cubierto en detalle (qué revisar, cómo pausar escrituras, qué NO hacer,
qué secretos rotar si aplica).

---

## D. Caída de Resend (emails transaccionales no salen)

Distinto de "la API key se filtró" (eso ya está en
[incident-response.md § "Si se sospecha un secreto filtrado"](./incident-response.md)) —
acá el escenario es que Resend como servicio está caído o rechazando envíos.

1. [Resend status](https://resend-status.com) — confirmar si es una caída
   general.
2. `EmailOutbox` (Postgres) — cada intento de envío queda registrado ahí
   con su estado; un lote de `FAILED`/reintentos agotados en la misma
   ventana de tiempo confirma el alcance real sin depender solo del correo
   de alerta.
3. **El checkout y la creación de pedidos NO dependen de que el email
   salga** (ver `lib/email/outbox.ts` — el envío es asíncrono vía outbox,
   nunca bloquea el flujo de pago/pedido) — una caída de Resend es
   molesta (la clienta no recibe confirmación por correo a tiempo) pero
   **no es un incidente de ventas/pagos**. No pausar escrituras por esto.
4. El cron `process-email-outbox` reintenta automáticamente los jobs
   fallidos en corridas siguientes — una vez Resend vuelve, el backlog se
   vacía solo, sin acción manual, salvo que la caída haya durado más que
   la ventana de reintentos configurada (revisar `lib/email/outbox.ts`
   para el límite exacto de intentos).
5. Si hace falta reenviar algo puntual a mano (ej. una clienta específica
   nunca recibió su confirmación y ya pasó la ventana de reintentos):
   hacerlo desde el panel admin del pedido si existe esa opción, nunca con
   un script ad-hoc que reconstruya el email a mano (riesgo de mandar
   datos desactualizados).

---

## E. Caída de Analytics (GA4 / Meta Pixel / Meta CAPI)

1. Confirmar alcance: ¿es solo el navegador (Pixel/GA4 client-side, un
   bloqueador de contenido o un cambio de consentimiento) o también el
   server-side (Meta CAPI vía `MarketingEventOutbox`)?
2. `MarketingEventOutbox` (Postgres) — mismo patrón que `EmailOutbox`: los
   jobs fallidos quedan visibles ahí con su estado; el cron
   `process-marketing-outbox` reintenta solo.
3. **Igual que con Resend: esto nunca bloquea ni afecta un pedido/pago
   real** — `Order`/`Payment` no dependen de que el evento de marketing se
   haya podido mandar. Es pérdida de datos de atribución/marketing, no un
   incidente de ventas.
4. **No reactivar el batch histórico como "solución rápida"**: el campo
   `MarketingEventOutbox.eligibleForBatch` existe específicamente para que
   un reintento masivo nunca reenvíe eventos de pedidos históricos (ver el
   hardening de sep. 2026, commit `6494f2d`) — un reintento manual mal
   dirigido podría re-disparar Purchases viejos hacia Meta/GA4 y ensuciar
   las métricas de forma difícil de deshacer. Si hace falta reintentar
   algo puntual, hacerlo dirigido por `id`, nunca con el batch completo.
5. Si el problema es de configuración (token de Meta CAPI vencido, GA4
   Measurement ID mal puesto): corregir la variable de entorno
   correspondiente y redeployar — no hay mitigación de datos que hacer,
   los eventos perdidos durante la ventana de caída ya no se pueden
   recuperar retroactivamente sin el riesgo del punto 4.

---

## F. Problema de dominio / DNS

El dominio (`radaelliswimwear.com`) está registrado/gestionado en
Hostinger; el hosting de la aplicación es Vercel. Si el sitio deja de
resolver o Vercel marca el dominio como mal configurado:

1. Vercel → proyecto `rada` → **Settings → Domains** → confirmar el
   estado exacto que reporta Vercel para `radaelliswimwear.com` y
   `www.radaelliswimwear.com` (verificado / error de DNS / certificado
   pendiente) — Vercel indica ahí mismo qué registro falta o está mal.
2. Comparar contra la zona DNS real en Hostinger — los registros que
   Vercel pide (normalmente un `A`/`ALIAS` para el apex y un `CNAME` para
   `www`) deben coincidir exactamente con lo que Vercel muestra en el
   paso anterior.
3. Los certificados TLS de dominios en Vercel se renuevan automáticos
   mientras el DNS siga apuntando correctamente — un error de
   certificado casi siempre es síntoma de un registro DNS que cambió o
   expiró, no un problema aparte.
4. **No mover el dominio a otro registrador ni cambiar nameservers como
   primer paso** — eso es un cambio de infraestructura de alto impacto y
   lento de revertir (propagación de horas). Corregir primero el registro
   puntual que Vercel señale como incorrecto.
5. Mientras el dominio propio esté caído, el deployment sigue accesible
   por su URL `*.vercel.app` (ver alias en `vercel inspect`) — útil para
   confirmar que la app en sí funciona y el problema es puramente de DNS,
   no de la aplicación.

---

## G. Stock corrupto

Ver [incident-response.md § "Si hay stock inconsistente"](./incident-response.md)
para los pasos exactos (qué revisar en `SystemLog`, cómo comparar contra
`OrderItem`/`Payment.reservedItems`, qué NO hacer). Esta auditoría agregó
`scripts/check-inventory-consistency.ts` como primer paso de diagnóstico
reutilizable (de solo lectura) — correrlo ANTES de comparar nada a mano.

---

## H. Admin comprometido

Ver [incident-response.md § "Si hay un admin comprometido"](./incident-response.md) —
ya cubierto en detalle (invalidar sesiones, resetear contraseña, revisar
roles, revisar `SystemLog`, rotar secretos si aplica).

---

## Límites de este documento (honestidad sobre qué no se pudo verificar)

Esta auditoría se hizo sin acceso directo a la base de datos de
**producción** real, a propósito: `vercel env pull` no expone valores de
secretos (Vercel los reemplaza por `[SENSITIVE]` al bajarlos por CLI, un
límite deliberado de seguridad de la plataforma, confirmado al intentarlo
durante esta auditoría) y este entorno local solo tiene configurado el
`DATABASE_URL` de **desarrollo** (`.env.local`). Por eso:

- Los dos scripts de solo lectura mencionados arriba (`check-production-db-readiness.ts`,
  `check-inventory-consistency.ts`) están escritos y verificados
  funcionando contra la base de desarrollo, pero **no se corrieron contra
  producción real** en esta auditoría — alguien con acceso real al
  `DATABASE_URL` de producción (ej. desde dentro de Vercel, o pegando la
  connection string real localmente con cuidado) debería correrlos ahí al
  menos una vez antes de escalar tráfico.
- La ventana de retención de backups/PITR de Neon para este proyecto
  específico no se pudo confirmar desde acá (ver sección B) — requiere
  entrar al dashboard de Neon.
