# Panel Administrativo

## Estado actual: no existe

No hay ningún panel administrativo en el proyecto. La única forma de "administrar" el catálogo hoy es editando directamente el código fuente:

- Productos y precios → `lib/placeholder-data.ts`
- Categorías destacadas → `lib/categories.ts`
- Cada cambio requiere un commit y un nuevo build/deploy.

Si en algún momento se conecta **Shopify** (track dormido, ver [ARCHITECTURE.md](./ARCHITECTURE.md)), el admin de Shopify cumpliría este rol para catálogo, inventario y pedidos — sin necesidad de construir un panel propio.

Si en cambio se opta por el track de **Postgres + Prisma** (ver [DATABASE.md](./DATABASE.md)), sí hace falta construir un panel propio, porque no hay ningún backend gestionando esos datos.

## Propuesta de alcance (no implementada)

Pensado como una sección aparte de la app (ej. `/admin`, protegida por autenticación con rol), apoyada en el mismo esquema Prisma propuesto en [DATABASE.md](./DATABASE.md):

| Módulo | Funcionalidad mínima |
|---|---|
| Productos | Crear/editar/eliminar, subir imágenes (Cloudinary), gestionar talles y stock por talle |
| Categorías | Editar las 6 categorías de la Home (nombre, descripción, imagen, disponibilidad) |
| Pedidos | Listado y detalle de pedidos (requiere que exista checkout real primero) |
| Usuarios | Listado de cuentas, roles (admin / cliente) |
| Wishlist / analítica | Productos más guardados — ya es fácil de derivar una vez que la wishlist viva en Postgres |

## Dependencias antes de poder construirlo

1. Autenticación con roles — desde el Sprint 9 existe login/registro/sesión (`lib/auth/`, `components/auth/`), pero es 100% simulado en el cliente (`localStorage`, sin campo de rol) y sin control de acceso server-side; falta migrar a Auth.js/Clerk + Prisma y agregar un campo de rol (admin/cliente) antes de poder proteger `/admin` de verdad.
2. Base de datos Postgres + Prisma conectada (ver propuesta de esquema en [DATABASE.md](./DATABASE.md)).
3. Integración con Cloudinary para subida/gestión de imágenes.
4. Decisión sobre si el catálogo vive en Shopify o en la base propia — el panel administrativo tiene sentido y alcance distintos según cuál se elija (ver [ROADMAP.md](./ROADMAP.md)).

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [ROADMAP.md](./ROADMAP.md)
