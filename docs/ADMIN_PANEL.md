# Panel Administrativo

## Estado actual: base implementada (Sprint 14)

Desde el Sprint 14 existe `/admin/*`, protegido por `RequireAdmin` (`components/auth/require-admin.tsx`, mismo patrón client-side que `RequireAuth`): exige sesión y `role === "ADMIN"` en `User` (Postgres, `UserRole` enum agregado en este sprint). Sin sesión redirige a login; con sesión pero sin rol redirige a `/cuenta`.

Módulos implementados, todos sobre Server Actions + Repository Pattern (`lib/admin/`), consistente con el resto del proyecto (ver [ARCHITECTURE.md](./ARCHITECTURE.md)):

| Módulo    | Ruta                                  | Qué hace                                                                                                                                                 |
| --------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard | `/admin`                              | Conteos (productos, pedidos, pedidos en proceso, usuarios) e ingresos totales — `lib/admin/dashboard-actions.ts`                                         |
| Productos | `/admin/productos`, `/nuevo`, `/[id]` | Crear, editar y eliminar productos (`lib/admin/products-actions.ts`): categoría, precio, color, descripción, tallas, imágenes (URLs manuales), destacado |
| Pedidos   | `/admin/pedidos`                      | Listado de **todos** los pedidos (no solo los del usuario logueado) con cambio de estado (`lib/admin/orders-actions.ts`)                                 |
| Usuarios  | `/admin/usuarios`                     | Listado de cuentas con email/fecha de alta/rol, y botón para promover/degradar a `ADMIN` (reutiliza `usersStorage`, sin dominio propio)                  |

## Qué NO incluye todavía esta base

- **Imágenes vía Cloudinary** — las imágenes de producto se cargan pegando URLs (una por línea) en el formulario, mismo criterio que el catálogo sembrado desde Unsplash. Integrar Cloudinary sigue pendiente (dependencia #3 de abajo).
- **Edición de categorías** — ni las 3 de catálogo (`Category`, Postgres) ni las 6 editoriales de Home (`lib/categories.ts`) tienen UI de edición todavía.
- **Analítica de wishlist** (productos más guardados) — mencionada como propuesta, no implementada.
- **Paginación** en las tablas de productos/pedidos/usuarios — no hace falta a la escala actual (20 productos, puñado de pedidos/usuarios), pero no escala indefinidamente.
- **Protección server-side real** — `RequireAdmin` es client-side, igual que `RequireAuth` (ver limitación de sesión en [ARCHITECTURE.md](./ARCHITECTURE.md)); no hay middleware verificando una cookie de sesión.
- **Entrada en el Navbar** — los administradores llegan a `/admin` navegando directo a la URL; no se agregó un link condicional en `components/layout/navbar/*` en este sprint (se evitó tocar ese componente compartido).

Ver la ficha completa de este sprint en [SPRINT-14](./sprints/SPRINT-14.md).

## Dependencias que quedan para completar el panel

1. ~~Autenticación con roles~~ — parcial: `User.role` ya existe y `/admin/*` ya lo exige (Sprint 14); falta migrar sesión/hashing a un backend real (Auth.js/Clerk) para que la protección sea server-side, no solo client-side.
2. ~~Base de datos Postgres + Prisma conectada~~ — ✅ hecho (Sprint 12).
3. Integración con Cloudinary para subida/gestión de imágenes.
4. Decisión sobre si el catálogo vive en Shopify o en la base propia — sigue sin cerrarse (ver [ROADMAP.md](./ROADMAP.md)); esta base del panel asume la opción Postgres propio.

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [ROADMAP.md](./ROADMAP.md)
- [sprints/SPRINT-14.md](./sprints/SPRINT-14.md)
