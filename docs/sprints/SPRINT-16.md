# Sprint 16 — Comercio: pasarela de pagos Wompi real, webhooks y estados de pago

## Objetivo

Reemplazar el adaptador simulado de Wompi por una integración real (tokenización de tarjeta + creación de transacción contra la API de Wompi), agregar un webhook para actualizaciones asincrónicas de estado, y hacer que un pago que falla después de haber creado un pedido cancele ese pedido automáticamente — todo sobre el patrón `PaymentGateway` que ya existía desde el Sprint 11, sin tocar `components/checkout/*` salvo un único parámetro nuevo (email del cliente).

## Bloqueo verificado antes de empezar: sin credenciales de Wompi

A diferencia del Sprint 15 (Cloudinary, donde `CLOUDINARY_CLOUD_NAME` tenía un valor incorrecto), acá no había **ninguna** variable de Wompi configurada — ni `WOMPI_PUBLIC_KEY`, ni `WOMPI_PRIVATE_KEY`, ni `WOMPI_INTEGRITY_SECRET`, ni `WOMPI_EVENTS_SECRET`. Se preguntó explícitamente antes de implementar; la decisión fue seguir adelante con la integración completa, dejando las llamadas reales listas pero **sin poder verificarlas contra la API de Wompi de verdad** en este entorno. Esto se documenta en cada archivo relevante y acá.

## Qué se implementó

- **`lib/payments/providers/wompi-gateway.ts`** (reescrito) — ya no simula: `confirmPayment` tokeniza la tarjeta (`POST /tokens/cards` con la llave pública), calcula la firma de integridad (`SHA-256(referencia + monto_en_centavos + moneda + secreto_de_integridad)`) y crea la transacción (`POST /transactions` con la llave privada). Si Wompi devuelve `PENDING` (frecuente incluso con tarjeta, por antifraude), reintenta hasta 3 veces con una pausa corta antes de responder — así el checkout no cambia de comportamiento en el caso común donde se resuelve en segundos. `createIntent` sigue sin red (genera la referencia propia, `lago-...`, que es la misma que usamos como `Payment.providerRef` y la que Wompi devuelve tal cual en cada webhook).
- **`app/api/webhooks/wompi/route.ts`** (nuevo) — recibe eventos de Wompi (`transaction.updated`), verifica la firma (`signature.checksum`, algoritmo documentado por Wompi) y, si es válida, actualiza el pago correspondiente. Responde `400` si el payload no es JSON válido, `401` si la firma no coincide o falta `WOMPI_EVENTS_SECRET`, `200` en cualquier otro caso (Wompi reintenta si no recibe `200`).
- **`lib/payments/payments-actions.ts`** — nueva `applyWompiWebhookUpdateAction(reference, wompiStatus, failureReason)`: busca el `Payment` por `providerRef` (la referencia, no el id interno de la transacción de Wompi), actualiza su estado, y **si ese pago ya estaba vinculado a un pedido y el nuevo estado es `DECLINED`/`VOIDED`/`ERROR`, cancela el pedido** (`Order.status = "CANCELADO"`) — la actualización automática de estado que pedía el sprint. Nunca en sentido contrario: un pago aprobado no adelanta el estado de envío, que sigue siendo responsabilidad exclusiva del Panel Administrativo (Sprint 14).
- **`lib/payments/payments-repository.ts`** — expone `applyWompiWebhookUpdate`, consumida únicamente por el webhook.
- **`lib/payments/types.ts`** — `PaymentGateway.confirmPayment` gana un tercer parámetro opcional, `customerEmail`, que la API de Wompi exige (`customer_email`) y que Stripe (simulado) ignora sin cambios.
- **`components/checkout/checkout-content.tsx`** — único cambio: `paymentsRepository.confirmPayment(intent, card)` pasa a `paymentsRepository.confirmPayment(intent, card, user?.email)`. Nada más se tocó del flujo de checkout.
- **`.env.example`** — se documentaron `NEXT_PUBLIC_PAYMENT_PROVIDER`, `WOMPI_BASE_URL` (por defecto sandbox), `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` — nombres únicamente, sin valores.

## Decisiones técnicas

- **La pasarela activa sigue siendo Stripe (simulada) por defecto.** `ACTIVE_PAYMENT_PROVIDER` (`lib/payments/config.ts`) no se tocó: sigue cayendo a `"stripe"` si no se define `NEXT_PUBLIC_PAYMENT_PROVIDER`. Se decidió a propósito no cambiar el default a `"wompi"`, porque sin credenciales reales eso rompería el checkout por defecto (hoy siempre "funciona" con el simulador de Stripe). Para usar el Wompi real hace falta `NEXT_PUBLIC_PAYMENT_PROVIDER=wompi` **y** las 4 credenciales cargadas.
- **Coincidencia por `reference`, no por el id de transacción de Wompi.** `Payment.providerRef` guarda siempre nuestra propia referencia (generada en `createIntent`), nunca el id que devuelve Wompi al crear la transacción — porque el webhook trae `data.transaction.reference` (nuestra referencia), no un id que tendríamos que haber guardado de vuelta. Evita un bug real de desincronización que se hubiera dado si `confirmPayment` sobrescribía el id con el de Wompi (el `updateMany({ where: { providerRef: result.id } })` de `confirmPaymentAction` habría dejado de encontrar la fila).
- **`customerEmail` con valor por defecto para invitados.** El checkout de invitado no tiene un campo de email en el formulario hoy (fuera de alcance de este sprint agregarlo — sería tocar `components/checkout/shipping-address-form.tsx`, UI estable). Sin usuario logueado, se envía `invitado@lago.com` a Wompi. Documentado como limitación conocida, no oculta.
- **Sin restructurar el flujo síncrono de creación de pedido.** El pedido se sigue creando recién cuando `confirmPayment` devuelve `"succeeded"` (Sprint 10), igual que con Stripe. Si una transacción de Wompi queda genuinamente `PENDING` más allá de los 3 reintentos cortos, el checkout la trata igual que un fallo (mismo comportamiento que ya existía para "no succeeded") y **no se crea pedido en ese momento** — el webhook sí actualiza el `Payment` cuando Wompi resuelva más tarde, pero no hay pedido al que asociarlo retroactivamente. Restructurar esto (crear el pedido antes de confirmar el pago, para poder asociarlo después) es un cambio de arquitectura de checkout más grande, fuera de alcance ("no cambies la arquitectura"); queda documentado como pendiente.
- **Verificación de firma corregida en el momento.** La primera versión de `isValidSignature` resolvía las rutas de `signature.properties` (ej. `"transaction.id"`) contra la raíz del payload en vez de contra `body.data` — con eso, el checksum calculado siempre daba sobre una cadena vacía y **nunca** iba a coincidir con un evento real de Wompi (rechazaría el 100% de los webhooks legítimos). Se encontró al auto-verificar el algoritmo con un payload de prueba (ver "Verificación") y se corrigió antes de cerrar el sprint.

## Verificación

`npx tsc --noEmit` limpio. `npm run build` limpio (56/56 páginas, incluye la ruta nueva `/api/webhooks/wompi`).

Lo que se pudo verificar en este entorno (sin credenciales de Wompi):

- **Regresión del checkout existente**: flujo completo con el gateway simulado de Stripe (default), logueado como `demo@lago.com` — pedido creado, pago aprobado, página de confirmación correcta, sin cambios de comportamiento.
- **Verificación de FK de invitado (hallazgo aparte, no relacionado)**: al probar primero como invitado, `createOrderAction` falló con `Foreign key constraint violated: Order_userId_fkey` porque no existe ninguna fila `User` con `id: "guest"` en esta base — `GUEST_USER_ID` (`lib/checkout/types.ts`) nunca se sembró. Es un bug preexistente, no introducido por este sprint (no se tocó nada del dominio de checkout de invitado); se deja documentado en "Qué quedó para después" en vez de "arreglado de paso", para no mezclar cambios fuera del alcance pedido.
- **Algoritmo de firma del webhook**: se encontró y corrigió el bug descrito arriba con un payload de prueba generado a mano (fuera de la app, con Node), confirmando que la nueva versión sí puede llegar a producir un checksum coincidente cuando las propiedades existen en `data`.
- **Ruta del webhook responde de forma robusta**: `curl` contra `/api/webhooks/wompi` — payload sin firma → `401`; JSON inválido → `400`; payload bien formado con checksum incorrecto → `401`. Ningún caso devuelve `500` ni tira una excepción sin capturar.
- **Lógica de actualización automática de pedido**: se creó un `Order`+`Payment` desechables contra la base real (usuario `demo@lago.com`, borrados al terminar) y se llamó a `applyWompiWebhookUpdateAction("...", "DECLINED", "...")` directamente — el `Payment` pasó a `FAILED` con el motivo, y el `Order` vinculado pasó automáticamente a `CANCELADO`. Confirma que la actualización automática de estado del pedido funciona tal como se documenta arriba.

Lo que **no** se pudo verificar (requiere credenciales reales de Wompi):

- Una tokenización de tarjeta real contra `/tokens/cards`.
- Una transacción real creada y aprobada/rechazada contra `/transactions`.
- Un evento de webhook real enviado por Wompi (solo se verificó el algoritmo de firma de forma aislada, no contra un evento genuino).

## Qué quedó para después

- Cargar `WOMPI_PUBLIC_KEY`/`WOMPI_PRIVATE_KEY`/`WOMPI_INTEGRITY_SECRET`/`WOMPI_EVENTS_SECRET` reales (sandbox de Wompi) y verificar una transacción de punta a punta, incluido un evento de webhook genuino.
- Sembrar (o crear de otra forma) una fila `User` con `id: "guest"` — hoy el checkout de invitado falla contra Postgres real por la FK de `Order.userId` (hallazgo de este sprint, sin relación con Wompi).
- Agregar un campo de email al checkout de invitado (hoy usa `invitado@lago.com` como placeholder para Wompi).
- Crear el pedido antes de confirmar el pago (para poder asociarlo a una transacción que quede genuinamente `PENDING` y se resuelva más tarde por webhook) — cambio de arquitectura de checkout, fuera de alcance de este sprint.
- El resto de los pendientes ya documentados en [ROADMAP.md](../ROADMAP.md) no cambiaron.
