# Sprint 14 — Panel Administrativo (base): productos, pedidos y usuarios

## Objetivo

Construir la primera versión del Panel Administrativo (`/admin/*`) descrito en [ADMIN_PANEL.md](../ADMIN_PANEL.md): gestión de catálogo (crear/editar/eliminar producto), listado y cambio de estado de todos los pedidos, y listado de usuarios con gestión de rol — apoyado en el esquema Prisma que ya existe desde el Sprint 12/13, sin romper ninguna funcionalidad de la tienda ni migrar Shopify/Cloudinary (fuera de alcance, quedan documentados como pendientes).

## Qué se implementó

- **`User.role` (`UserRole`, `USER`/`ADMIN`) wireado de punta a punta.** El campo ya existía en `prisma/schema.prisma` pero sin migración aplicada y sin uso en el código de la app (`lib/auth/types.ts`, `users-actions.ts`, `auth-store.tsx` no lo tocaban). Este sprint: generó y aplicó la migración `20260715120000_add_user_role` (contra la base Neon real configurada en `.env`), agregó `role` a `User`/`PublicUser` (`lib/auth/types.ts`), lo mapeó en `toUser()` (`lib/auth/users-actions.ts`), agregó `role: "USER"` explícito en `register()` (`components/auth/auth-store.tsx`) y una Server Action nueva y separada `updateUserRoleAction` (expuesta como `usersStorage.updateRole`) — separada de `upsertUserAction` a propósito: el rol solo lo cambia el panel, nunca `register()`/`updateProfile()`.
- **`components/auth/require-admin.tsx`** — mismo patrón que `RequireAuth` (protección client-side, sin sesión server-side todavía), pero además exige `role === "ADMIN"`; sin sesión redirige a login, con sesión pero sin rol redirige a `/cuenta` (tiene sesión válida, solo no tiene permiso).
- **`lib/admin/`** (nuevo dominio, Server Actions + Repository):
  - `products-actions.ts`/`products-repository.ts` — CRUD de catálogo. A diferencia de `lib/catalog/catalog-actions.ts` (solo lectura, degrada a `[]`/`null` si Postgres falla), acá los errores se devuelven tal cual (`AdminActionResult`) porque quien edita necesita saber si la escritura falló. `updateProductAction` usa `upsert` (no `deleteMany`+`create`) sobre `ProductVariant` para conservar el stock de las tallas que se mantienen y solo reinicializar las tallas nuevas.
  - `orders-actions.ts`/`orders-repository.ts` — `listAllOrdersAction` (todos los pedidos, sin filtrar por `userId`, con el email del comprador) y `updateOrderStatusAction`.
  - `dashboard-actions.ts`/`dashboard-repository.ts` — conteos (productos, pedidos, pedidos en proceso, usuarios) e ingresos totales (excluye pedidos cancelados) vía `prisma.aggregate`.
  - `types.ts` — `AdminProduct`, `AdminProductInput`, `AdminOrder`, `DashboardStats`, `AdminActionResult`.
- **`lib/orders/order-mapping.ts`** (nuevo archivo, extraído de `orders-actions.ts`): el mapeo DB↔dominio (`toOrder`, `STATUS_FROM_DB`/`STATUS_TO_DB`, etc.) se movió a un archivo sin `"use server"` porque un archivo `"use server"` solo puede exportar funciones async al nivel superior — no puede reexportar esos objetos ni la función `toOrder` que `lib/admin/orders-actions.ts` necesitaba reutilizar. `orders-actions.ts` (Sprint 10/12) ahora solo importa de ahí; su comportamiento no cambió.
- **`app/admin/*`** — `page.tsx` (Resumen), `productos/page.tsx` (listado), `productos/nuevo/page.tsx`, `productos/[id]/page.tsx` (edición), `pedidos/page.tsx`, `usuarios/page.tsx`. Mismo criterio que `app/cuenta/*`: sin `layout.tsx` propio, cada página compone `AdminShell` + `Footer`, `metadata.robots: { index: false, follow: false }`.
- **`components/admin/*`** — `admin-shell.tsx`/`admin-nav.tsx` (calco de `account-shell.tsx`/`account-nav.tsx`), `dashboard-stats.tsx`, `products-table.tsx` + `product-form.tsx` (slug autogenerado desde el nombre hasta que se edita a mano; tallas e imágenes como texto plano, una talla separada por coma / una URL por línea — sin selector de archivos, ver Cloudinary en pendientes), `orders-table.tsx` (`<select>` de estado con el mismo estilo de badge que `order-history.tsx`), `users-table.tsx` (toggle de rol, deshabilitado sobre el propio usuario para evitar que un admin se quite el permiso a sí mismo sin querer).
- **`prisma/seed.ts`** — `test@lago.com` ahora se siembra (y actualiza) con `role: "ADMIN"` para poder entrar a `/admin/*` inmediatamente después de `npm run db:seed`, sin pasos manuales.

## Decisiones técnicas

- **Confirmación de borrado sin `window.confirm()`.** Ningún otro componente del proyecto usa diálogos nativos del navegador (`components/account/addresses-manager.tsx` borra directo); además `confirm()` bloquea el hilo de JS, lo que rompe la automatización de pruebas en navegador sin cabeza. `products-table.tsx` usa una confirmación de dos pasos dentro de la misma fila (el ícono de basura pasa a "¿Eliminar? / Cancelar").
- **Sin Cloudinary todavía**: las imágenes de producto se cargan como URLs pegadas a mano (una por línea), igual que hoy vive el catálogo sembrado desde Unsplash. Integrar Cloudinary sigue pendiente (ver [ROADMAP.md](../ROADMAP.md)) y no bloqueaba este sprint.
- **Sin paginación en las tres tablas** (productos, pedidos, usuarios): a la escala actual (20 productos, 1-2 pedidos, 2 usuarios) no hace falta; queda como mejora futura si el volumen crece.
- **Gating de `/admin` sigue siendo client-side**, igual que `/cuenta` — no hay sesión server-side todavía (ver limitación conocida en [ARCHITECTURE.md](../ARCHITECTURE.md)). Es una brecha real (alguien con las herramientas de desarrollador podría ver el HTML antes del redirect), aceptada explícitamente porque agregar middleware con sesión real es un sprint aparte (Auth.js/Clerk, ver Roadmap) y no estaba en el alcance de este.
- **Sin entrada al Panel en el Navbar todavía**: se decidió no tocar `components/layout/navbar/*` (código compartido y estable) para esta primera versión; los administradores acceden navegando directo a `/admin`. Queda como pulido pendiente.

## Verificación

`npx tsc --noEmit` limpio. `npm run build` limpio (57/57 páginas, incluye las 6 rutas nuevas de `/admin/*`). Se aplicó la migración `20260715120000_add_user_role` contra la base Neon real configurada en este entorno (a diferencia de los Sprints 12/13, acá sí hubo conexión real disponible) y se corrió `npm run db:seed`. Verificación manual en navegador con el servidor de desarrollo:

- Dashboard: conteos y suma de ingresos correctos contra los datos sembrados.
- Productos: creación de un producto de prueba (slug autogenerado), edición (precio y tallas, incluida una talla nueva agregada junto a una existente) y eliminación — los tres flujos confirmados contra la base real y reflejados de inmediato en la lista.
- Pedidos: cambio de estado del pedido sembrado (`Entregado` → `Enviado` → `Entregado`, revertido al terminar) persistido tras recargar la página.
- Usuarios: promoción/degradación de rol de `demo@lago.com` (revertido al terminar), botón de cambio de rol deshabilitado sobre el propio usuario logueado.
- `RequireAdmin`: sin sesión redirige a `/cuenta/iniciar-sesion`; con sesión pero sin rol `ADMIN` redirige a `/cuenta`.

## Qué quedó para después

- Integrar Cloudinary para carga de imágenes (hoy: URLs manuales).
- Entrada al Panel Administrativo en el Navbar para usuarios con rol `ADMIN`.
- Paginación en las tablas de productos/pedidos/usuarios si el volumen crece.
- Sesión server-side (Auth.js/Clerk) para proteger `/admin/*` con middleware real, no solo client-side.
- Editar las categorías (las 3 de catálogo y las 6 editoriales de Home) — no se tocó en este sprint.
- Analítica de wishlist (productos más guardados) mencionada en [ADMIN_PANEL.md](../ADMIN_PANEL.md) — no implementada.

Ver [ROADMAP.md](../ROADMAP.md) para el resto de pendientes.
