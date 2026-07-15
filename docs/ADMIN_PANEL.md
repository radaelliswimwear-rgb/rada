# Panel Administrativo

## Estado actual: no existe

No hay ningún panel administrativo en el proyecto. Desde el Sprint 13 el catálogo (`Product`/`Category`/`ProductImage`/`ProductVariant`) vive en Postgres y ya se podría editar con una query directa a Prisma o con Prisma Studio (`npx prisma studio`) — pero sin UI propia, "administrar" en la práctica sigue siendo editar `lib/placeholder-data.ts` y volver a correr `npm run db:seed` (la fuente que alimenta el seed), lo que exige un commit y un nuevo build/deploy.

Si en algún momento se conecta **Shopify** (track dormido, ver [ARCHITECTURE.md](./ARCHITECTURE.md)), el admin de Shopify cumpliría este rol para catálogo, inventario y pedidos — sin necesidad de construir un panel propio.

Si en cambio se opta por el track de **Postgres + Prisma** (ya real desde el Sprint 12/13, ver [DATABASE.md](./DATABASE.md)), sí hace falta construir un panel propio — la base ya existe con los 13 modelos necesarios (incluido el catálogo completo), solo falta la UI de administración.

## Propuesta de alcance (no implementada)

Pensado como una sección aparte de la app (ej. `/admin`, protegida por autenticación con rol), apoyada en el mismo esquema Prisma propuesto en [DATABASE.md](./DATABASE.md):

| Módulo | Funcionalidad mínima |
|---|---|
| Productos | Crear/editar/eliminar, subir imágenes (Cloudinary), gestionar talles y stock por talle — desde el Sprint 13, `Product`/`ProductImage`/`ProductVariant` son Postgres real (`lib/catalog/catalog-actions.ts`); falta la UI de escritura (hoy `catalogRepository` solo tiene métodos de lectura) |
| Categorías | Editar las 3 categorías de catálogo (`Category`, Postgres desde el Sprint 13) y las 6 categorías editoriales de la Home (`lib/categories.ts`, sin migrar a propósito — ver [ARCHITECTURE.md](./ARCHITECTURE.md)) |
| Pedidos | Listado y detalle de pedidos — desde el Sprint 12, `Order`/`OrderItem`/`Payment` son filas reales en Postgres (`lib/orders/orders-actions.ts`), consultables entre todos los usuarios (no solo `userId` del navegador). El panel ya podría listar todos los pedidos hoy con una query directa a Prisma |
| Usuarios | Listado de cuentas — `User` ya es Postgres; falta el campo de rol (admin/cliente) |
| Wishlist / analítica | Productos más guardados — desde el Sprint 13, `Wishlist`/`WishlistItem` son Postgres real; el panel ya podría agregarlos con un `groupBy` de Prisma |

## Dependencias antes de poder construirlo

1. Autenticación con roles — `User` ya vive en Postgres (Sprint 12), pero sin campo de rol y sin control de acceso server-side (sesión sigue en `localStorage`); falta migrar a Auth.js/Clerk (o agregar un campo `role` a `User` + middleware) antes de poder proteger `/admin` de verdad.
2. ~~Base de datos Postgres + Prisma conectada~~ — ✅ hecho (Sprint 12).
3. Integración con Cloudinary para subida/gestión de imágenes.
4. Decisión sobre si el catálogo vive en Shopify o en la base propia — el panel administrativo tiene sentido y alcance distintos según cuál se elija (ver [ROADMAP.md](./ROADMAP.md)).

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [ROADMAP.md](./ROADMAP.md)
