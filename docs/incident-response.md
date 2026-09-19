# Respuesta a incidentes — Radaelli Swimwear

Documento corto y práctico (sep. 2026, parte de la capa de observabilidad y
alertas). Pensado para actuar rápido sin tener que reconstruir contexto —
si algo de acá queda desactualizado (un nombre de variable, un archivo que
se movió), priorizá lo que diga el código sobre lo que diga este documento.

Dónde mirar primero, siempre:

- **Correo de alerta**: si llegó un correo `[Radaelli · alerta ...]` a
  `radaelliswimwear@gmail.com` / `info@radaelliswimwear.com` (o a las
  direcciones que tengan seteadas `ADMIN_NOTIFICATION_EMAIL_1`/`_2` en
  Vercel), ya dice el evento, la severidad y el `paymentId`/`orderId`
  involucrado — es el punto de partida más rápido.
- **Vercel → Project → Runtime Logs**: la señal inmediata, todo lo que
  loguea la app en tiempo real.
- **Tabla `SystemLog`** (Postgres, vía cualquier cliente con acceso a
  `DATABASE_URL` de producción): historial persistente de eventos
  críticos, más allá de la ventana de retención de Vercel. Columnas
  relevantes: `event`, `severity`, `paymentId`/`orderId`, `reason`,
  `createdAt`, `alertedAt`.

---

## Si falla Wompi (pagos no se procesan / webhook cae / reverificación falla)

**Qué revisar:**

1. `SystemLog` filtrando `event` que empiece con `payment.webhook_` o
   `payment.wompi_reverification_failed`, o `webhook.signature_invalid` /
   `webhook.malformed` — para saber si es un problema de firma
   (`WOMPI_EVENTS_SECRET` desalineado), de conectividad hacia la API de
   Wompi, o un evento con forma inesperada.
2. Estado real de Wompi: [status.wompi.co](https://status.wompi.co) (o el
   canal de soporte de Wompi) — antes de asumir que el problema es propio.
3. Vercel Runtime Logs del endpoint `/api/webhooks/wompi` — mismo momento.

**Cómo pausar escrituras si hace falta (congelar toda la app, no solo
pagos):**

- Setear `WRITES_PAUSED=true` en las variables de entorno de Vercel
  (Production) y redeployar (o esperar el próximo deploy). Ver
  `lib/system/write-pause.ts` para el límite importante documentado ahí:
  **esto solo afecta al deployment que se construya con esa variable ya
  puesta** — no detiene deployments Preview ya corriendo ni el deployment
  de Production actual hasta que se reconstruya.
- Con escrituras pausadas: el webhook responde 503 sin procesar nada (Wompi
  reintenta más tarde, no se pierde el evento), y el cron de pagos vencidos
  se salta la corrida en vez de cancelar algo a ciegas.

**Qué NO hacer:**

- No cancelar Payments a mano en la base sin antes revisar si el pago ya
  se aprobó de verdad en el dashboard de Wompi — un Payment PENDING acá
  puede estar APROBADO del lado de Wompi con el webhook todavía en
  camino.
- No reintentar manualmente un webhook viejo simulando el payload — la
  verificación de firma y el `lastEventTimestamp` existen justamente para
  rechazar eventos repetidos/fuera de orden; un reintento mal armado
  puede quedar descartado silenciosamente o, peor, aplicar un estado
  viejo.
- No tocar `Payment.stockReleased`/`flaggedForReviewAt` a mano sin
  entender primero el caso — ver la sección de stock más abajo.

**Qué secretos rotar (solo si se sospecha compromiso, no por una falla
transitoria común):** `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`,
`WOMPI_EVENTS_SECRET` desde el dashboard de Wompi (Colombia) → variables
de entorno de Vercel (Production). Rotar `WOMPI_EVENTS_SECRET` invalida
webhooks en tránsito firmados con el secreto viejo — hacerlo solo si hay
sospecha real de filtración, no como primer paso ante un simple error.

---

## Si hay un admin comprometido (cuenta ADMIN con acceso indebido/robado)

**Pasos, en orden:**

1. **Invalidar sesiones**: desde una consola con acceso a Postgres,
   `DELETE FROM "Session" WHERE "userId" = '<id del usuario afectado>'`
   (o, si hace falta cerrar TODO el sitio de una, todas las filas de
   `Session`) — cierra la sesión en todos los dispositivos al instante,
   sin esperar a que expire la cookie (30 días). El código ya tiene esta
   función lista: `destroyAllSessionsForUser` (`lib/auth/session.ts`), se
   puede invocar desde un script puntual si hace falta.
2. **Reset de contraseña**: forzar un `resetPasswordAction` (o cambiar
   `passwordHash` a mano a un valor inválido temporalmente) para que la
   cuenta no pueda volver a entrar hasta que la fundadora la recupere por
   el flujo normal de "Olvidé mi contraseña".
3. **Revisar usuarios/roles**: `SELECT id, email, role, createdAt FROM
"User" WHERE role = 'ADMIN'` — confirmar que la lista de administradores
   es exactamente la esperada. `updateUserRoleAction`
   (`lib/auth/users-actions.ts`) ya bloquea que un admin se quite el rol a
   sí mismo por accidente, pero no bloquea que un admin comprometido
   ascienda a un tercero — revisar también altas recientes de `ADMIN`.
4. **Revisar `SystemLog`** filtrando `event = 'auth.unauthorized_admin_access'`
   y `event = 'auth.login_success'`/`'auth.login_failed'` para ese
   `userId` — reconstruye la línea de tiempo de qué se intentó y cuándo.
5. **Rotar secretos** si el admin comprometido pudo haber visto variables
   de entorno o accedido a algo más que el panel (ver la sección de abajo)
   — no es automático, depende de qué tan lejos llegó el acceso.

---

## Si se sospecha un secreto filtrado

**Orden de rotación** (de mayor a menor urgencia según lo que ese secreto
protege):

1. **`DATABASE_URL`** — rotar la contraseña del rol en Neon (o crear un
   rol nuevo y actualizar la variable en Vercel) inmediatamente: da acceso
   de lectura/escritura a TODO, incluyendo `User.passwordHash`.
2. **`WOMPI_PRIVATE_KEY` / `WOMPI_INTEGRITY_SECRET` / `WOMPI_EVENTS_SECRET`**
   — desde el dashboard de Wompi Colombia. Sin esto no se pueden falsear
   pagos, pero sí se puede leer el estado de transacciones reales.
3. **`CRON_SECRET`** — generar uno nuevo (cualquier string largo
   aleatorio) y actualizarlo en Vercel; sin esto, alguien podría disparar
   los endpoints de cron a demanda (liberan pagos vencidos, reintentan
   outbox) fuera de su horario normal — no filtra dinero directamente,
   pero es ruido/abuso operativo.
4. **`RESEND_API_KEY`** — desde el dashboard de Resend. Con esta clave se
   pueden mandar correos "de parte" del dominio verificado — impacto
   reputacional, no financiero directo.
5. **`META_CAPI_ACCESS_TOKEN`** — desde Meta Events Manager. Permite
   mandar eventos falsos a la cuenta publicitaria de Meta — afecta datos
   de marketing, no pagos ni cuentas de clientas.

Después de rotar cualquiera de estos: redeployar en Vercel para que el
nuevo valor tome efecto (las variables de entorno solo se leen al
construir/arrancar, no en caliente).

---

## Si hay stock inconsistente (contador no coincide con la realidad)

**Cómo detenerse antes de romper algo peor:**

- Si es grave (se está vendiendo stock que no existe, o una talla quedó
  bloqueada sin motivo): `WRITES_PAUSED=true` (ver arriba) frena TODA
  escritura, incluidas nuevas compras — es la manera más segura de
  "parar el sangrado" mientras se audita, aunque también pausa ventas
  legítimas. Usar solo si el problema es realmente extendido, no para un
  solo producto.

**Cómo auditar, sin corregir todavía:**

1. `SystemLog` filtrando `event IN ('stock.released',
'stock.released_abandoned_payment', 'payment.stock_reclaimed_late_approval',
'payment.flagged_for_review')` para el producto/talla en cuestión —
   reconstruye qué liberaciones/reclamos pasaron y cuándo.
2. Revisar `Payment.flaggedForReviewAt`/`flaggedForReviewReason` — todo
   pago marcado ahí es un caso conocido y ya identificado de "cobrado
   pero sin pedido automático", nunca stock perdido en silencio.
3. Comparar `ProductVariant.stock` contra la suma de `OrderItem.quantity`
   de pedidos no cancelados para ese producto/talla + reservas activas
   (`Payment.reservedItems` de pagos `PENDING`/`SUCCEEDED` sin `Order`
   todavía) — la diferencia real (si la hay) es la que hay que entender
   antes de tocar nada.

**Qué NO hacer:**

- No editar `ProductVariant.stock` a mano sin haber hecho el punto 3
  completo — un ajuste manual sin reconciliar puede tapar el síntoma y
  perder la única evidencia de la causa real.
- No asumir que es un bug de código antes de revisar si fue un cambio
  manual desde `/admin/inventario` (`updateVariantStockAction`) — el
  historial de eso no vive en `SystemLog` todavía (ver Pendientes).

---

## Si llega una alerta `payment.flagged_for_review`

Es la alerta más importante del sistema: una clienta **pagó de verdad**
(Wompi aprobó el cobro) pero el pedido **no se pudo crear automáticamente**
porque el stock que tenía reservado ya se vendió a otra persona mientras
tanto (ver el comentario largo junto a `reclaimReleasedStockForLateApproval`,
`lib/checkout/server-order-totals.ts`).

**Pasos exactos:**

1. Buscar el `Payment` por el `paymentId` del correo de alerta (o por
   `flaggedForReviewAt IS NOT NULL` si no se tiene el id a mano).
2. Confirmar en el dashboard de Wompi que el cobro es real y por el monto
   esperado — nunca actuar solo con lo que dice la base propia.
3. Revisar `flaggedForReviewReason`:
   - `APPROVED_LATE_STOCK_UNAVAILABLE`: no había unidades para reponer la
     reserva. Decidir con la fundadora: reembolso (coordinado a mano con
     Wompi) o reposición manual de stock + crear el pedido a mano si
     vuelve a haber unidades y la clienta sigue interesada.
   - `APPROVED_LATE_MISSING_RESERVED_ITEMS`: anomalía más rara (el pago no
     tenía snapshot de qué se reservó) — revisar `Payment.pendingOrderInput`
     y `Payment.reservedItems` directamente para reconstruir qué compró.
4. Una vez resuelto (reembolso o pedido creado a mano), dejar constancia
   en la propia fila de `Payment` (por ahora no hay un campo dedicado de
   "resuelto" — ver Pendientes) o en donde la fundadora prefiera llevar
   ese registro operativo.
5. Nunca dejar un `Payment` flagged sin resolver por más de unos días —
   es dinero real de una clienta real esperando una respuesta.

---

## Pendientes (fuera de alcance de esta entrega, a propósito)

- Historial de cambios manuales de stock (`updateVariantStockAction`) no
  pasa todavía por `SystemLog` — instrumentarlo es una mejora futura, no
  bloqueante hoy.
- No hay un campo `resolvedAt` en `Payment` para marcar un
  `flaggedForReview` como cerrado — hoy se resuelve y se sigue el rastro
  fuera del sistema (correo, planilla de la fundadora, lo que prefiera).
- No se instrumentaron fallos de mutación de `/admin/*` caso por caso
  (17+ acciones) — quedan protegidas por `requireAdmin()` como siempre,
  pero sin logging individual por ahora.
