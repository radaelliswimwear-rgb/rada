# Sprint 12 — PostgreSQL + Prisma real

## Objetivo

Integrar PostgreSQL + Prisma de forma completamente funcional sobre la arquitectura existente, sustituyendo los adaptadores simulados de carrito, cuentas, direcciones, pedidos y pagos por repositorios Prisma reales, sin modificar la UI.

## Qué se implementó

- **`prisma/schema.prisma`** — 12 modelos con relaciones completas: `User`, `Address`, `Category`, `Product`, `ProductImage`, `ProductVariant`, `Wishlist`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`. Precios/montos en centavos (`Int`).
- **`prisma/migrations/`** — migración inicial (`..._init/migration.sql`), generada con `prisma migrate diff` a partir del esquema.
- **`prisma/seed.ts`** — siembra categorías y los 20 productos de `lib/placeholder-data.ts` (mismos IDs), dos usuarios de prueba (`test@lago.com` / `demo@lago.com`, contraseña `lago1234`, hash SHA-256 compatible con el login existente) y un pedido + pago de ejemplo.
- **`lib/prisma.ts`** — singleton de `PrismaClient`.
- **Server Actions Prisma por dominio** (`*-actions.ts`, `"use server"`): `lib/auth/users-actions.ts`, `lib/addresses/addresses-actions.ts`, `lib/cart/cart-actions.ts`, `lib/orders/orders-actions.ts`, `lib/payments/payments-actions.ts`. Cada uno reemplaza la persistencia de su dominio (localStorage → Postgres) manteniendo exactamente los mismos nombres de función que consumían los Contexts.
- **Adaptadores/repositorios reescritos como wrappers** (`lib/auth/users-storage.ts`, `lib/addresses/addresses-repository.ts`, `lib/cart/storage-adapter.ts`, `lib/orders/orders-repository.ts`, `lib/payments/payments-repository.ts`): solo reagrupan las funciones de `*-actions.ts` en el mismo objeto público de siempre (`usersStorage`, `cartStorage`, etc.) — **ningún componente cambió**.
- **`.env` / `.env.example` / `package.json`** — `DATABASE_URL`, scripts `db:migrate`/`db:seed`, `postinstall: prisma generate`.

## Decisiones técnicas

- **Un archivo `"use server"` solo puede exportar funciones async planas** (no objetos) — por eso cada dominio quedó partido en `<dominio>-actions.ts` (Prisma) + el archivo con el nombre histórico (solo reexporta). Next.js convierte cada función en un endpoint invocable directo desde Client Components, así que los Contexts (`cart-store.tsx`, `auth-store.tsx`, etc.) no necesitaron ningún cambio.
- **Carrito de invitado vía cookie**: `Cart.userId` es opcional; `lib/cart/cart-actions.ts` identifica "este navegador" con una cookie propia (`lago-cart-id`, 180 días) en vez de `localStorage`. Mismo comportamiento que antes (sin sesión), ahora persistido server-side. No hay fusión de carrito a cuenta al iniciar sesión (queda para después).
- **Euros en la app, centavos en la base**: `priceValue`/`subtotal`/`total`/`amount` se guardan en `Int` (centavos) en Postgres; la conversión euros↔centavos vive únicamente en la capa `*-actions.ts`, así que `lib/orders/types.ts` y `lib/payments/types.ts` (y toda la UI que los consume) siguen en euros sin cambios.
- **Pedidos simulados eliminados**: el generador determinista del Sprint 9/10 desapareció — ahora hay datos reales (seed + pedidos creados desde `/checkout`).
- **Wishlist y sesión/tokens de reset quedaron fuera** a propósito: `Wishlist.userId` es obligatorio en el esquema y hoy la wishlist funciona sin login; migrarla exigía resolver identidad de invitado, fuera del alcance pedido (Checkout/Carrito/Pedidos/Pagos). Documentado como pendiente en [ARCHITECTURE.md](../ARCHITECTURE.md) y [ROADMAP.md](../ROADMAP.md).
- **Catálogo de lectura sin migrar**: `/hombre`, `/mujer`, ficha de producto siguen leyendo `lib/placeholder-data.ts` en memoria. `Product`/`Category` ya están poblados en Postgres con los mismos IDs (para que `CartItem`/`OrderItem` tengan FK reales), listos para que la UI cambie de fuente sin rehacerse.
- **Generador Prisma**: se usó `prisma-client-js` (el clásico, hacia `node_modules/@prisma/client`) en vez del nuevo generador `prisma-client` de Prisma 7 — este último emite módulos TS con imports `.js` que ni Webpack ni Turbopack resuelven en este proyecto (bug de integración conocido); el generador clásico no tiene ese problema y no requiere un adaptador de driver (`@prisma/adapter-pg`) explícito.

## Verificación

`npx tsc --noEmit` y `npm run build` limpios (47/47 páginas). El entorno de este sandbox no tiene un Postgres accesible por red para correr `prisma migrate dev`/`db:seed` en vivo (falla la conexión TCP incluso al servidor de desarrollo embebido de Prisma) — la migración inicial se generó con `prisma migrate diff` (no requiere DB viva) y se verificó que coincide exactamente con `schema.prisma`. Contra un `DATABASE_URL` real, el flujo documentado (`npx prisma migrate dev`, `npm run db:seed`, luego `npm run dev`) deja carrito/login/direcciones/checkout/pagos funcionando de punta a punta sin tocar UI — mismo comportamiento ya verificado en los Sprints 9–11, ahora sobre Postgres.

## Qué quedó para después

- Migrar wishlist y sesión/tokens de recuperación a Postgres.
- Migrar el catálogo de lectura a Postgres (ya sembrado, falta el adaptador).
- Fusión de carrito de invitado a cuenta al iniciar sesión.
- Autenticación de producción (Auth.js/Clerk, hashing server-side) y campo de rol para el Panel Administrativo.
- Integrar Cloudinary para imágenes de producto.

Ver [ROADMAP.md](../ROADMAP.md) para el resto de pendientes.
