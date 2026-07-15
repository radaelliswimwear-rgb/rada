# Handoff — estado del proyecto al cierre del Sprint 14

## Dónde quedó el proyecto

Sprint 14 (Panel Administrativo) cerrado y verificado: `npx tsc --noEmit` limpio, `npm run build` limpio (59/59 páginas), probado manualmente en navegador contra la base Postgres real (Neon) configurada en `.env`. Detalle completo en [sprints/SPRINT-14.md](./sprints/SPRINT-14.md).

Resumen de lo que hay hoy:

- Tienda completa (catálogo, carrito, wishlist, cuenta, checkout, pagos simulados) sobre Postgres/Prisma — Sprints 1-13.
- Panel Administrativo en `/admin/*` — dashboard, CRUD de productos, categorías (rename), inventario (stock por talla), listado/estado de pedidos, listado/rol de usuarios; buscador y paginación en las cuatro tablas — protegido por `RequireAdmin` (client-side, exige sesión + `role === "ADMIN"`).
- `User.role` (`UserRole`, `USER`/`ADMIN`) wireado de punta a punta; migración `20260715120000_add_user_role` aplicada contra la base real.
- Seed (`npm run db:seed`) deja `test@lago.com` como `ADMIN` y `demo@lago.com` como `USER`, contraseña `lago1234` para ambos.

## Cómo levantar el proyecto

```bash
npm install --legacy-peer-deps
npx prisma migrate dev   # o migrate deploy si la base ya existe
npm run db:seed
npm run dev              # http://localhost:3000
```

`DATABASE_URL` debe apuntar a un Postgres real (ver `.env.example`); en este entorno hay una base Neon ya configurada en `.env`.

## Pendientes conocidos (no bloquean, quedan para sprints futuros)

- Integrar Cloudinary para imágenes de producto (hoy: URLs manuales, tanto en el seed como en el panel).
- Entrada al Panel Administrativo en el Navbar para usuarios con rol `ADMIN` (hoy se accede navegando directo a `/admin`).
- Sesión server-side (Auth.js/Clerk) — toda la autenticación, incluida la protección de `/admin/*` y `/cuenta/*`, sigue siendo client-side sobre `localStorage`.
- Buscador/paginación del panel son client-side (sobre la lista completa ya traída); migrar a `LIMIT`/`OFFSET` en Prisma si el volumen crece mucho.
- CRUD completo de categorías (crear/eliminar) — hoy solo se puede renombrar; crear/eliminar exigiría convertir `/hombre`, `/mujer`, `/accesorios` en rutas dinámicas. Las 6 categorías editoriales de Home tampoco tienen UI de edición.
- Analítica de wishlist en el panel (productos más guardados) — no implementada.
- Fusión de carrito/wishlist de invitado a la cuenta al iniciar sesión.
- Testing automatizado y CI/CD — no existe ninguno todavía.
- Decisión de fondo sin cerrar: ¿Shopify, backend propio, o híbrido? (ver [ROADMAP.md](./ROADMAP.md)).

## Por dónde seguir (Sprint 15, sugerido)

Ver la sección "Por hacer" de [ROADMAP.md](./ROADMAP.md) para el listado completo sin priorizar. No hay un Sprint 15 decidido todavía — se elige al arrancar la próxima sesión de trabajo.

## Documentos relacionados

- [PROJECT.md](./PROJECT.md) — visión general y stack.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — patrones y decisiones técnicas.
- [ADMIN_PANEL.md](./ADMIN_PANEL.md) — estado y alcance del panel.
- [ROADMAP.md](./ROADMAP.md) — historial de sprints y pendientes.
- [sprints/SPRINT-14.md](./sprints/SPRINT-14.md) — ficha completa de este sprint.
