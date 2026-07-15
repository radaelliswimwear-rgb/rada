# Sprint 11 — Integración de pasarela de pago (Stripe/Wompi)

## Objetivo

Integrar una pasarela de pago en el checkout, con arquitectura desacoplada e intercambiable entre Stripe y Wompi, flujo de pago con datos simulados, confirmación de pago, manejo de éxito/fallo/cancelación, y preparada para conectar credenciales reales sin rehacer nada.

## Qué se implementó

- **`lib/payments/`** — dominio nuevo:
  - `types.ts` — `PaymentProvider` (`"stripe" | "wompi"`), `PaymentStatus`, `PaymentIntent`, `CardInput` y el contrato `PaymentGateway` (`createIntent`/`confirmPayment`) que implementa cada pasarela.
  - `config.ts` — `ACTIVE_PAYMENT_PROVIDER` (lee `NEXT_PUBLIC_PAYMENT_PROVIDER`, por defecto `stripe`) y `PAYMENT_PROVIDER_LABELS`.
  - `providers/stripe-gateway.ts` y `providers/wompi-gateway.ts` — dos implementaciones simuladas de `PaymentGateway`, intercambiables. Reaccionan a los mismos números de tarjeta de prueba que usa Stripe de verdad (`4242...` éxito, `4000...0002`/`4000...9995` rechazo).
  - `payment-gateway.ts` — selecciona la pasarela activa; es el único archivo que sabe cuál está encendida.
  - `simulate-latency.ts` — simula la latencia de red de una pasarela real.
  - `storage-adapter.ts` — persiste cada intento de pago (clave `lago-payments:v1`) para auditoría, sea cual sea su resultado.
  - `payments-repository.ts` — `createIntent`, `confirmPayment`, `cancel`, `linkToOrder`, `getById`. Único punto que usa la UI.
  - `validation.ts` — `validateCard` (Luhn, formato de vencimiento MM/AA no vencido, CVC), función pura.
- **`components/checkout/payment-form.tsx`** — formulario de tarjeta reutilizable, con aviso de "pago simulado" y las tarjetas de prueba visibles para facilitar la demo.
- **`components/checkout/checkout-content.tsx`** — nueva sección "4. Pago"; `handleConfirm` ahora crea un `PaymentIntent`, lo confirma contra la pasarela activa y solo si el resultado es `succeeded` crea el pedido (`ordersRepository.create`) con el snapshot del pago. Si el pago es rechazado, muestra el motivo y permite reintentar sin perder el carrito. Si el usuario pulsa "Cancelar pago" mientras se procesa, el intento se marca `cancelled` y no se crea pedido.
- **`components/checkout/order-confirmation.tsx`** — nueva sección "Pago" (proveedor, últimos 4 dígitos, ID de transacción, insignia "Pago aprobado").
- **`lib/orders/types.ts`** — `PaymentSnapshot` (snapshot del pago aprobado, mismo criterio que `shippingAddress`) y `Order.payment?` / `CreateOrderInput.payment`.
- **`lib/orders/orders-repository.ts`** — `create()` ahora guarda `payment` en el pedido.

## Decisiones técnicas

- **Pago antes que pedido, nunca al revés**: el pedido solo se crea si `confirmPayment` devuelve `succeeded`. Un pago rechazado o cancelado no genera ningún pedido — mismo orden que seguiría un checkout real con Stripe/Wompi.
- **Contrato único (`PaymentGateway`) + dos adaptadores**: cambiar de Stripe a Wompi (o agregar un tercero) es agregar un archivo en `providers/` y cambiar `ACTIVE_PAYMENT_PROVIDER` — `payments-repository.ts` y toda la UI de checkout quedan intactos.
- **Cada intento se audita**: éxito, fallo y cancelación quedan registrados en `lago-payments:v1`, no solo los pagos aprobados — refleja cómo un dashboard real de Stripe/Wompi muestra todos los intentos.
- **Cancelación es un aborto local**: no cancela nada en un proveedor real (no hay uno todavía); simplemente descarta el resultado que llegó tarde y marca el intento como `cancelled`. Documentado como limitación conocida en [ARCHITECTURE.md](../ARCHITECTURE.md#pasarela-de-pago-simulada-limitación-conocida-sprint-11).
- **`PaymentSnapshot` en el pedido, no una referencia en vivo**: mismo criterio que `OrderItem`/`shippingAddress` — un pedido es un registro histórico.

## Verificación

`npx tsc --noEmit` y `npm run build` limpios (47/47 páginas, sin rutas nuevas — el pago vive dentro de `/checkout`). Probado en navegador: pago rechazado con la tarjeta de prueba `4000 0000 0000 0002` → banner de error + toast, pedido no creado, formulario reutilizable para reintentar; pago aprobado con `4242 4242 4242 4242` → pedido creado, carrito vaciado, confirmación con sección "Pago" mostrando proveedor (Stripe), últimos 4 dígitos y ID de transacción, y el pedido reflejado en "Mis pedidos". El flujo de cancelación se verificó por revisión de código (mismo guard `cancelPaymentRef` ejercitado por las rutas de éxito/fallo ya probadas): la ventana de procesamiento simulada es demasiado corta para el round-trip del navegador automatizado usado en la verificación manual.

## Qué quedó para después

- Conectar credenciales reales de Stripe o Wompi (reemplazar `providers/*-gateway.ts` por los SDKs correspondientes) — ver [ROADMAP.md](../ROADMAP.md) y [DEPLOYMENT.md](../DEPLOYMENT.md).
- Webhooks de confirmación asíncrona de la pasarela real (`/api/payments/webhook`, propuesto en [API.md](../API.md)).
- Conexión a Postgres + Prisma, incluida la tabla `Payment` ya propuesta en [DATABASE.md](../DATABASE.md).
- Reembolsos y disputas — no modelados todavía.

Ver [ROADMAP.md](../ROADMAP.md) para el resto de pendientes.
