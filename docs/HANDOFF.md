# Handoff — estado del proyecto al cierre del Sprint 15

## Dónde quedó el proyecto

Sprint 15 (gestión de imágenes con Cloudinary) cerrado y verificado: `npx tsc --noEmit` limpio, `npm run build` limpio (55/55 páginas), probado manualmente en navegador contra la base Postgres real (Neon) configurada en `.env`. Detalle completo en [sprints/SPRINT-15.md](./sprints/SPRINT-15.md) (y [SPRINT-14.md](./sprints/SPRINT-14.md) para el Panel Administrativo base).

Resumen de lo que hay hoy:

- Tienda completa (catálogo, carrito, wishlist, cuenta, checkout, pagos simulados) sobre Postgres/Prisma — Sprints 1-13.
- Panel Administrativo en `/admin/*` — dashboard, CRUD de productos (con imágenes reales vía Cloudinary: drag & drop, carga múltiple, vista previa, imagen principal, reordenamiento, reemplazo, borrado automático), categorías (rename), inventario (stock por talla), listado/estado de pedidos, listado/rol de usuarios; buscador y paginación en las cuatro tablas — protegido por `RequireAdmin` (client-side, exige sesión + `role === "ADMIN"`).
- `User.role` (`UserRole`, `USER`/`ADMIN`) wireado de punta a punta; `ProductImage.publicId` (Cloudinary) agregado — ambas migraciones aplicadas contra la base real.
- Seed (`npm run db:seed`) deja `test@lago.com` como `ADMIN` y `demo@lago.com` como `USER`, contraseña `lago1234` para ambos.

## ⚠️ Acción pendiente antes de dar Cloudinary por 100% verificado

`CLOUDINARY_CLOUD_NAME` en el `.env` de este entorno **no es un `cloud_name` válido** — Cloudinary devuelve `401 Invalid cloud_name` en cada intento de subida (verificado en vivo durante el Sprint 15). `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` sí tienen el formato esperado. El código está completo y el manejo de errores funciona correctamente (se confirmó que un fallo de Cloudinary no rompe nada ni deja datos corruptos), pero **nadie pudo confirmar una subida real exitosa** en este entorno por esta razón. Antes de considerar la integración lista para producción: confirmar el `cloud_name` correcto (visible en el dashboard de Cloudinary) y actualizarlo en `.env` y en las variables de entorno de Hostinger.

## Cómo levantar el proyecto

```bash
npm install --legacy-peer-deps
npx prisma migrate dev   # o migrate deploy si la base ya existe
npm run db:seed
npm run dev              # http://localhost:3000
```

`DATABASE_URL` debe apuntar a un Postgres real (ver `.env.example`); en este entorno hay una base Neon ya configurada en `.env`. `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` deben apuntar a una cuenta de Cloudinary real (ver advertencia arriba).

## Pendientes conocidos (no bloquean, quedan para sprints futuros)

- Confirmar `CLOUDINARY_CLOUD_NAME` correcto y verificar una subida real (ver advertencia arriba).
- Entrada al Panel Administrativo en el Navbar para usuarios con rol `ADMIN` (hoy se accede navegando directo a `/admin`).
- Sesión server-side (Auth.js/Clerk) — toda la autenticación, incluida la protección de `/admin/*` y `/cuenta/*`, sigue siendo client-side sobre `localStorage`.
- Buscador/paginación del panel son client-side (sobre la lista completa ya traída); migrar a `LIMIT`/`OFFSET` en Prisma si el volumen crece mucho.
- CRUD completo de categorías (crear/eliminar) — hoy solo se puede renombrar; crear/eliminar exigiría convertir `/hombre`, `/mujer`, `/accesorios` en rutas dinámicas. Las 6 categorías editoriales de Home tampoco tienen UI de edición.
- Reordenamiento de imágenes por arrastre directo de las miniaturas (hoy: botones de mover/hacer principal) — funcional, pero no es drag-to-reorder.
- Analítica de wishlist en el panel (productos más guardados) — no implementada.
- Fusión de carrito/wishlist de invitado a la cuenta al iniciar sesión.
- Testing automatizado y CI/CD — no existe ninguno todavía.
- Decisión de fondo sin cerrar: ¿Shopify, backend propio, o híbrido? (ver [ROADMAP.md](./ROADMAP.md)).

## Por dónde seguir (Sprint 16, sugerido)

Ver la sección "Por hacer" de [ROADMAP.md](./ROADMAP.md) para el listado completo sin priorizar. No hay un Sprint 16 decidido todavía — se elige al arrancar la próxima sesión de trabajo.

## Documentos relacionados

- [PROJECT.md](./PROJECT.md) — visión general y stack.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — patrones y decisiones técnicas.
- [ADMIN_PANEL.md](./ADMIN_PANEL.md) — estado y alcance del panel.
- [ROADMAP.md](./ROADMAP.md) — historial de sprints y pendientes.
- [sprints/SPRINT-14.md](./sprints/SPRINT-14.md) — Panel Administrativo base.
- [sprints/SPRINT-15.md](./sprints/SPRINT-15.md) — ficha completa de este sprint (Cloudinary).
