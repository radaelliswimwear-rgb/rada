# Panel Administrativo

## Estado actual: implementado (Sprint 14)

Desde el Sprint 14 existe `/admin/*`, protegido por `RequireAdmin` (`components/auth/require-admin.tsx`, mismo patrón client-side que `RequireAuth`): exige sesión y `role === "ADMIN"` en `User` (Postgres, `UserRole` enum agregado en este sprint). Sin sesión redirige a login; con sesión pero sin rol redirige a `/cuenta`.

Módulos implementados, todos sobre Server Actions + Repository Pattern (`lib/admin/`), consistente con el resto del proyecto (ver [ARCHITECTURE.md](./ARCHITECTURE.md)):

| Módulo     | Ruta                                  | Qué hace                                                                                                                                                                                                         |
| ---------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard  | `/admin`                              | Conteos (productos, pedidos, pedidos en proceso, usuarios) e ingresos totales — `lib/admin/dashboard-actions.ts`                                                                                                 |
| Productos  | `/admin/productos`, `/nuevo`, `/[id]` | Crear, editar y eliminar productos (`lib/admin/products-actions.ts`): categoría, precio, color, descripción, tallas, imágenes (URLs manuales), destacado. Buscador + paginación (10/página)                      |
| Categorías | `/admin/categorias`                   | Renombrar las 3 categorías de catálogo y ver cuántos productos tiene cada una (`lib/admin/categories-actions.ts`) — sin crear/eliminar, ver limitación abajo                                                     |
| Inventario | `/admin/inventario`                   | Todas las tallas (`ProductVariant`) de todos los productos, ordenadas por stock ascendente, edición inline y resaltado de stock bajo (≤ 5) — `lib/admin/inventory-actions.ts`. Buscador + paginación (15/página) |
| Pedidos    | `/admin/pedidos`                      | Listado de **todos** los pedidos (no solo los del usuario logueado) con cambio de estado (`lib/admin/orders-actions.ts`). Buscador + paginación                                                                  |
| Usuarios   | `/admin/usuarios`                     | Listado de cuentas con email/fecha de alta/rol, y botón para promover/degradar a `ADMIN` (reutiliza `usersStorage`, sin dominio propio). Buscador + paginación                                                   |

Buscador y paginación (`components/admin/search-input.tsx`, `components/admin/pagination.tsx`) son componentes reutilizables compartidos por las cuatro tablas; filtran/paginan client-side sobre la lista ya traída del servidor — suficiente a la escala actual, ver limitación abajo.

## Qué NO incluye todavía este panel

- **Imágenes vía Cloudinary** — las imágenes de producto se cargan pegando URLs (una por línea) en el formulario, mismo criterio que el catálogo sembrado desde Unsplash. Integrar Cloudinary sigue pendiente (dependencia #3 de abajo).
- **CRUD completo de categorías** — solo se puede renombrar, no crear ni eliminar. Las 3 categorías de catálogo son rutas estáticas (`app/hombre`, `app/mujer`, `app/accesorios`) mapeadas 1:1 por slug (`lib/catalog/types.ts`); soportar categorías arbitrarias exigiría convertirlas en rutas dinámicas, un cambio de arquitectura fuera de alcance de este sprint. Las 6 categorías editoriales de Home (`lib/categories.ts`) tampoco se tocaron.
- **Analítica de wishlist** (productos más guardados) — mencionada como propuesta, no implementada.
- **Buscador/paginación server-side** — hoy filtran/paginan en memoria sobre la lista completa ya traída; si el catálogo/pedidos/usuarios crecen mucho más allá de la escala actual, migrar a `LIMIT`/`OFFSET` en Prisma (como ya hace `catalogRepository.listByCategory` para la tienda) es la mejora natural.
- **Protección server-side real** — `RequireAdmin` es client-side, igual que `RequireAuth` (ver limitación de sesión en [ARCHITECTURE.md](./ARCHITECTURE.md)); no hay middleware verificando una cookie de sesión.
- **Entrada en el Navbar** — los administradores llegan a `/admin` navegando directo a la URL; no se agregó un link condicional en `components/layout/navbar/*` (se evitó tocar ese componente compartido).

Ver la ficha completa de este sprint en [SPRINT-14](./sprints/SPRINT-14.md).

## Dependencias que quedan para completar el panel

1. ~~Autenticación con roles~~ — parcial: `User.role` ya existe y `/admin/*` ya lo exige (Sprint 14); falta migrar sesión/hashing a un backend real (Auth.js/Clerk) para que la protección sea server-side, no solo client-side.
2. ~~Base de datos Postgres + Prisma conectada~~ — ✅ hecho (Sprint 12).
3. Integración con Cloudinary para subida/gestión de imágenes.
4. Decisión sobre si el catálogo vive en Shopify o en la base propia — sigue sin cerrarse (ver [ROADMAP.md](./ROADMAP.md)); este panel asume la opción Postgres propio.

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [ROADMAP.md](./ROADMAP.md)
- [sprints/SPRINT-14.md](./sprints/SPRINT-14.md)
