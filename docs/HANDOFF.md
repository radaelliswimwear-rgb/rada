# Handoff — estado del proyecto al cierre del Sprint 16

## Dónde quedó el proyecto

Sprint 16 (pasarela de pagos Wompi real, webhooks, estados de pago) cerrado: `npx tsc --noEmit` limpio, `npm run build` limpio (56/56 páginas). Detalle completo en [sprints/SPRINT-16.md](./sprints/SPRINT-16.md) (y [SPRINT-14.md](./sprints/SPRINT-14.md)/[SPRINT-15.md](./sprints/SPRINT-15.md) para el Panel Administrativo y Cloudinary).

Resumen de lo que hay hoy:

- Tienda completa (catálogo, carrito, wishlist, cuenta, checkout, pagos) sobre Postgres/Prisma — Sprints 1-13.
- Panel Administrativo en `/admin/*` — dashboard, CRUD de productos (con imágenes reales vía Cloudinary, Sprint 15), categorías (rename), inventario, listado/estado de pedidos, listado/rol de usuarios; buscador y paginación en las cuatro tablas — protegido por `RequireAdmin` (client-side, exige sesión + `role === "ADMIN"`).
- Pasarela de pagos: Stripe simulado (activo por defecto) o **Wompi real** (Sprint 16, requiere credenciales — ver advertencia abajo) intercambiables vía `NEXT_PUBLIC_PAYMENT_PROVIDER`. Webhook `/api/webhooks/wompi` actualiza el estado del pago y cancela automáticamente el pedido vinculado si el pago termina fallando.
- Seed (`npm run db:seed`) deja `test@lago.com` como `ADMIN` y `demo@lago.com` como `USER`, contraseña `lago1234` para ambos.

## ⚠️ Acción pendiente: Wompi sin credenciales, no verificado en vivo

A diferencia de Cloudinary (Sprint 15, que tenía un valor incorrecto), acá **no hay ninguna** credencial de Wompi configurada — ni pública, ni privada, ni los dos secretos de firma. El código de `lib/payments/providers/wompi-gateway.ts` y `app/api/webhooks/wompi/route.ts` sigue la documentación pública de la API de Wompi, pero nadie pudo confirmar una tokenización, una transacción, ni un evento de webhook reales. **La tienda sigue usando el gateway simulado de Stripe por defecto** — Wompi solo se activa si se define `NEXT_PUBLIC_PAYMENT_PROVIDER=wompi`, así que esto no bloquea nada del funcionamiento actual. Antes de activar Wompi en producción: cargar `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET` (sandbox de Wompi primero) y probar una transacción de punta a punta, incluido un webhook real. Ver [sprints/SPRINT-16.md](./sprints/SPRINT-16.md) para el detalle de qué sí se pudo verificar (algoritmo de firma corregido, actualización automática de estado del pedido, manejo de errores del webhook) sin esas credenciales.

## Hallazgo aparte (no de este sprint): checkout de invitado falla contra Postgres real

Al verificar el Sprint 16 se encontró que el checkout como invitado (sin sesión) falla con `Foreign key constraint violated: Order_userId_fkey`, porque no existe ninguna fila `User` con `id: "guest"` (`GUEST_USER_ID`, `lib/checkout/types.ts`) en esta base. No es un bug introducido por este sprint ni se tocó nada para "arreglarlo de paso" — queda documentado como pendiente. El checkout con sesión iniciada (`demo@lago.com`, etc.) funciona sin problemas.

## Cómo levantar el proyecto

```bash
npm install --legacy-peer-deps
npx prisma migrate dev   # o migrate deploy si la base ya existe
npm run db:seed
npm run dev              # http://localhost:3000
```

`DATABASE_URL` debe apuntar a un Postgres real (ver `.env.example`); en este entorno hay una base Neon ya configurada en `.env`. `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` ya apuntan a una cuenta de Cloudinary real y verificada. Las variables `WOMPI_*` están documentadas en `.env.example` pero sin valores (ver advertencia arriba).

## Pendientes conocidos (no bloquean, quedan para sprints futuros)

- Cargar credenciales reales de Wompi y verificar una transacción + webhook de punta a punta (ver advertencia arriba).
- Sembrar una fila `User` con `id: "guest"` para que el checkout de invitado funcione contra Postgres real (ver hallazgo arriba).
- Agregar un campo de email al checkout de invitado (hoy Wompi recibe `invitado@lago.com` como placeholder para ese caso).
- Entrada al Panel Administrativo en el Navbar para usuarios con rol `ADMIN` (hoy se accede navegando directo a `/admin`).
- Sesión server-side (Auth.js/Clerk) — toda la autenticación, incluida la protección de `/admin/*` y `/cuenta/*`, sigue siendo client-side sobre `localStorage`.
- Buscador/paginación del panel son client-side (sobre la lista completa ya traída); migrar a `LIMIT`/`OFFSET` en Prisma si el volumen crece mucho.
- CRUD completo de categorías (crear/eliminar) — hoy solo se puede renombrar; crear/eliminar exigiría convertir `/hombre`, `/mujer`, `/accesorios` en rutas dinámicas. Las 6 categorías editoriales de Home tampoco tienen UI de edición.
- Reordenamiento de imágenes por arrastre directo de las miniaturas (hoy: botones de mover/hacer principal) — funcional, pero no es drag-to-reorder.
- Analítica de wishlist en el panel (productos más guardados) — no implementada.
- Fusión de carrito/wishlist de invitado a la cuenta al iniciar sesión.
- Testing automatizado y CI/CD — no existe ninguno todavía.
- Decisión de fondo sin cerrar: ¿Shopify, backend propio, o híbrido? (ver [ROADMAP.md](./ROADMAP.md)).

## Por dónde seguir (Sprint 17, sugerido)

Ver la sección "Por hacer" de [ROADMAP.md](./ROADMAP.md) para el listado completo sin priorizar. No hay un Sprint 17 decidido todavía — se elige al arrancar la próxima sesión de trabajo.

## Documentos relacionados

- [PROJECT.md](./PROJECT.md) — visión general y stack.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — patrones y decisiones técnicas.
- [ADMIN_PANEL.md](./ADMIN_PANEL.md) — estado y alcance del panel.
- [ROADMAP.md](./ROADMAP.md) — historial de sprints y pendientes.
- [sprints/SPRINT-14.md](./sprints/SPRINT-14.md) — Panel Administrativo base.
- [sprints/SPRINT-15.md](./sprints/SPRINT-15.md) — Cloudinary.
- [sprints/SPRINT-16.md](./sprints/SPRINT-16.md) — ficha completa de este sprint (Wompi/pagos).
