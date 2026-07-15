# Sprint 14 — Panel Administrativo: productos, categorías, inventario, pedidos y usuarios

## Objetivo

Construir el Panel Administrativo (`/admin/*`) descrito en [ADMIN_PANEL.md](../ADMIN_PANEL.md): CRUD de productos, gestión de categorías e inventario, listado y cambio de estado de todos los pedidos, y listado de usuarios con gestión de rol — con buscador y paginación en los listados — apoyado en el esquema Prisma que ya existe desde el Sprint 12/13, sin romper ninguna funcionalidad de la tienda ni migrar Shopify/Cloudinary (fuera de alcance, quedan documentados como pendientes). El sprint se hizo en dos pasadas dentro de la misma sesión: una base (auth por rol, productos, pedidos, usuarios, dashboard) y una ampliación (categorías, inventario, buscador/paginación, componentes reutilizables) — ver "Qué se implementó" para el detalle de cada una.

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

### Ampliación: categorías, inventario, buscador/paginación

- **`lib/admin/categories-actions.ts`/`categories-repository.ts`** — `listCategoriesWithCountsAction` (nombre, slug, cantidad de productos por `_count`) y `updateCategoryNameAction`. A propósito **no** hay crear/eliminar categoría: las 3 categorías de catálogo son rutas estáticas (`app/hombre`, `app/mujer`, `app/accesorios`) mapeadas 1:1 por slug en `lib/catalog/types.ts` — agregar o quitar categorías desde la base exigiría rutas dinámicas, fuera de "no modifiques la arquitectura existente". `app/admin/categorias/page.tsx` + `components/admin/categories-table.tsx` (rename inline, sin página de creación).
- **`lib/admin/inventory-actions.ts`/`inventory-repository.ts`** — vista plana de todas las `ProductVariant` (`listVariantsAction`, con `select` acotado — no trae imágenes/descripción del producto, que no hacen falta acá) ordenadas por stock ascendente, y `updateVariantStockAction` para editar el stock de una talla puntual. `app/admin/inventario/page.tsx` + `components/admin/inventory-table.tsx`: edición inline con input numérico, resalta en rojo las filas con stock ≤ 5.
- **`components/admin/search-input.tsx`** y **`components/admin/pagination.tsx`** (nuevos, reutilizables) — usados en `ProductsTable`, `OrdersTable`, `UsersTable` e `InventoryTable`: filtrado client-side (sobre la lista ya traída del servidor, no una nueva query por letra tecleada) + paginación de 10-15 filas por página. A la escala actual (20-30 productos, un puñado de pedidos/usuarios/variantes) alcanza con filtrar en memoria; si el volumen crece, la migración natural es mover el filtro/paginado a las Server Actions (mismo patrón que `catalogRepository.listByCategory`, que ya pagina server-side).
- **`components/admin/admin-nav.tsx`** — se agregaron los links "Categorías" e "Inventario".

## Decisiones técnicas

- **Confirmación de borrado sin `window.confirm()`.** Ningún otro componente del proyecto usa diálogos nativos del navegador (`components/account/addresses-manager.tsx` borra directo); además `confirm()` bloquea el hilo de JS, lo que rompe la automatización de pruebas en navegador sin cabeza. `products-table.tsx` usa una confirmación de dos pasos dentro de la misma fila (el ícono de basura pasa a "¿Eliminar? / Cancelar").
- **Sin Cloudinary todavía**: las imágenes de producto se cargan como URLs pegadas a mano (una por línea), igual que hoy vive el catálogo sembrado desde Unsplash. Integrar Cloudinary sigue pendiente (ver [ROADMAP.md](../ROADMAP.md)) y no bloqueaba este sprint.
- **Paginación y buscador client-side**, no server-side: se filtra/pagina sobre la lista completa ya traída (`listAllProductsAction`, `listAllOrdersAction`, etc. siguen sin `LIMIT`/`OFFSET` en la query). Correcto a esta escala; si el catálogo crece mucho, migrar a paginación real en Prisma (como ya hace `catalogRepository.listByCategory` para la tienda) es la mejora natural.
- **Categorías: solo rename, no CRUD completo** — ver nota en "Qué se implementó". Es una limitación de alcance deliberada por la arquitectura de rutas estáticas, no un olvido.
- **Gating de `/admin` sigue siendo client-side**, igual que `/cuenta` — no hay sesión server-side todavía (ver limitación conocida en [ARCHITECTURE.md](../ARCHITECTURE.md)). Es una brecha real (alguien con las herramientas de desarrollador podría ver el HTML antes del redirect), aceptada explícitamente porque agregar middleware con sesión real es un sprint aparte (Auth.js/Clerk, ver Roadmap) y no estaba en el alcance de este.
- **Sin entrada al Panel en el Navbar todavía**: se decidió no tocar `components/layout/navbar/*` (código compartido y estable) para esta primera versión; los administradores acceden navegando directo a `/admin`. Queda como pulido pendiente.

## Verificación

`npx tsc --noEmit` limpio. `npm run build` limpio (59/59 páginas, incluye las 8 rutas nuevas de `/admin/*`). Se aplicó la migración `20260715120000_add_user_role` contra la base Neon real configurada en este entorno (a diferencia de los Sprints 12/13, acá sí hubo conexión real disponible) y se corrió `npm run db:seed`. Verificación manual en navegador con el servidor de desarrollo, en dos pasadas:

**Base**: dashboard con conteos/ingresos correctos; productos (creación con slug autogenerado, edición de precio/tallas, eliminación — los tres contra la base real); pedidos (cambio de estado `Entregado` → `Enviado` → `Entregado`, revertido, persistido tras recargar); usuarios (promoción/degradación de rol de `demo@lago.com`, revertido; botón deshabilitado sobre el propio usuario); `RequireAdmin` (sin sesión → login; con sesión sin rol `ADMIN` → `/cuenta`).

**Ampliación**: categorías (rename de "Accesorios" → "Accesorios QA" → revertido; confirmado que `/accesorios` sigue sirviendo con normalidad porque el slug no cambia); inventario (stock de una talla bajado a 3 → fila se resalta en rojo y el cambio persiste tras recargar → revertido a 25); buscador de productos (filtra por nombre/slug/categoría/color, ej. "gorra" devuelve solo "Gorra Algodón Orgánico"); paginación (Productos con 20 filas y `PAGE_SIZE=10` muestra 2 páginas correctamente); responsive (viewport 375×812: nav se apila arriba, tabla mantiene su propio scroll horizontal, sin overflow de página).

## Qué quedó para después

- Integrar Cloudinary para carga de imágenes (hoy: URLs manuales).
- Entrada al Panel Administrativo en el Navbar para usuarios con rol `ADMIN`.
- Migrar buscador/paginación de productos/pedidos/usuarios/inventario a server-side si el volumen crece mucho más allá de lo actual.
- Sesión server-side (Auth.js/Clerk) para proteger `/admin/*` con middleware real, no solo client-side.
- CRUD completo de categorías (crear/eliminar) — exigiría convertir `/hombre`, `/mujer`, `/accesorios` en rutas dinámicas; fuera de alcance de este sprint. Las 6 categorías editoriales de Home (`lib/categories.ts`) tampoco se tocaron.
- Analítica de wishlist (productos más guardados) mencionada en [ADMIN_PANEL.md](../ADMIN_PANEL.md) — no implementada.
- Optimización de consultas Prisma más allá de los `select` acotados ya aplicados (ej. `lib/admin/inventory-actions.ts`): un índice compuesto en `ProductVariant(stock)` si el catálogo crece mucho y la vista de inventario se vuelve lenta.

Ver [ROADMAP.md](../ROADMAP.md) para el resto de pendientes.
