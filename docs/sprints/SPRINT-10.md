# Sprint 10 — Checkout completo

## Objetivo

Construir el flujo completo de checkout (`/checkout`), preparado para producción y desacoplado de cara a una futura integración con PostgreSQL + Prisma y una pasarela de pago real, sin romper ninguna funcionalidad existente.

## Qué se implementó

- **`lib/checkout/`** — `types.ts` (`ShippingAddressInput`, `ShippingAddressErrors`, `ShippingMethod`, `GUEST_USER_ID`), `shipping-methods.ts` (catálogo estático de envío estándar/express, con envío gratis sobre 100€ de subtotal), `pricing.ts` (`calculateCostSummary`: IVA 21% + total, función pura), `validation.ts` (`validateShippingAddress`, función pura reutilizable en un futuro endpoint).
- **`lib/orders/storage-adapter.ts`** — nuevo adaptador de persistencia (clave `lago-orders:v1`) para pedidos reales creados desde el checkout, distinto del generador de demo del Sprint 9.
- **`lib/orders/orders-repository.ts` y `types.ts`** — `create(input)` persiste un pedido real; `getById(orderId)` lo recupera para la confirmación; `listByUser(userId)` ahora combina pedidos reales persistidos + pedidos simulados de demo, ordenados por fecha. `Order` gana campos opcionales (`subtotal`, `shippingCost`, `tax`, `shippingAddress`, `shippingMethod`) que solo completan los pedidos reales — los simulados siguen igual, sin romper `order-history.tsx`.
- **`components/checkout/`** — componentes reutilizables: `order-summary.tsx` (lista de líneas, usado en checkout y confirmación), `cost-summary.tsx` (subtotal/envío/IVA/total), `shipping-method-selector.tsx`, `shipping-address-form.tsx` (direcciones guardadas del usuario + formulario de dirección nueva, con opción de guardarla), `checkout-content.tsx` (orquestador del flujo), `order-confirmation.tsx`.
- **`app/checkout/page.tsx`** y **`app/checkout/confirmacion/[orderId]/page.tsx`** — páginas del flujo.
- **`lib/format.ts`** — `formatPrice` extraído como helper compartido (antes duplicado en `cart-drawer.tsx` y `order-history.tsx`).
- **Integración con el carrito** — `components/cart-drawer/cart-store.tsx` gana `clearCart()`; `cart-drawer.tsx` enlaza "Finalizar compra" a `/checkout` en vez de mostrar un toast de "próximamente".

## Decisiones técnicas y limitaciones conocidas

- **Checkout de invitado**: `/checkout` no requiere sesión (igual que el carrito). Sin sesión, el pedido se crea con `userId = GUEST_USER_ID` y no aparece en ningún historial de cuenta — comportamiento equivalente a "comprar como invitado" en un checkout de producción. Con sesión, se ofrecen las direcciones guardadas del usuario (`addressesRepository`).
- **Pedidos reales + simulados conviven**: desde este sprint, "Mis pedidos" combina los pedidos reales creados por checkout con los pedidos de demo deterministas del Sprint 9, para no perder la riqueza de datos de demo ni descartar pedidos reales nuevos.
- **Sin pago real**: el checkout genera y confirma el pedido, pero no cobra — no hay pasarela de pago integrada. Es la pieza que falta para producción.
- **IVA desglosado como línea propia** (21% sobre subtotal) en vez de precios "IVA incluido" (más común en retail español), porque el requerimiento pedía explícitamente subtotal/envío/impuestos/total como líneas separadas.
- **Validación pura y reutilizable**: `validateShippingAddress` no depende de React ni del DOM — la misma función podría correr tal cual en un futuro endpoint `/api/checkout`.

## Verificación

`npx tsc --noEmit` y `npm run build` limpios (47/47 páginas, incluidas `/checkout` y `/checkout/confirmacion/[orderId]`). Probado en navegador de punta a punta: agregar producto al carrito → "Finalizar compra" → checkout con dirección guardada autoseleccionada (envío gratis por superar el umbral) → confirmar pedido → página de confirmación con productos, dirección, método de envío y resumen de costos correctos → pedido visible en "Mis pedidos" junto a los pedidos de demo → carrito vacío tras la compra. Validación probada por separado: dirección nueva con todos los campos vacíos → "Confirmar pedido" bloqueado con errores por campo (nombre, calle, código postal, ciudad, provincia, teléfono) y toast de aviso.

## Qué quedó para después

- Pasarela de pago real (Stripe, Redsys, o el checkout nativo de Shopify según la decisión de arquitectura pendiente).
- Conexión a Postgres + Prisma para los pedidos y direcciones (propuesta de esquema ya extendida en [DATABASE.md](../DATABASE.md) con `subtotal`/`shippingCost`/`tax`/`shippingMethod`/`shippingAddress`).
- Autenticación de producción y roles de usuario — ver [SPRINT-09](./SPRINT-09.md) y [ADMIN_PANEL.md](../ADMIN_PANEL.md).

Ver [ROADMAP.md](../ROADMAP.md) para el resto de pendientes.
