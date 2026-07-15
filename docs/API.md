# API

## Estado actual: sin API propia para datos de la app

No existe ningún endpoint REST/GraphQL propio para leer o escribir productos, carrito o wishlist — todo eso corre en el cliente contra `lib/placeholder-data.ts` (en memoria) y `localStorage`. El único endpoint real que existe hoy es un webhook receptor de Shopify, inactivo mientras no haya credenciales.

## Rutas HTTP existentes

### `POST /api/revalidate` — `app/api/revalidate/route.ts`

```ts
export async function POST(req: NextRequest): Promise<NextResponse> {
  return revalidate(req);
}
```

Delega en `revalidate()` (`lib/shopify/index.ts`), pensado para recibir **webhooks de Shopify**:

- Valida `?secret=` contra `SHOPIFY_REVALIDATION_SECRET`.
- Si el topic (`x-shopify-topic`) es de colecciones (`collections/create|update|delete`) → invalida el tag de caché `collections`.
- Si es de productos (`products/create|update|delete`) → invalida el tag `products`.
- Siempre responde `200` (Shopify reintenta si no recibe 200).

**No está en uso** mientras no haya tienda Shopify conectada.

## Server Actions existentes

### Track Shopify (dormido) — `components/cart/actions.ts`

Todas con `"use server"`, todas llaman a `lib/shopify/index.ts` (que a su vez llama a la Storefront API):

| Acción | Qué hace |
|---|---|
| `addItem(prevState, selectedVariantId)` | Agrega una línea al carrito de Shopify |
| `removeItem(prevState, merchandiseId)` | Quita una línea |
| `updateItemQuantity(prevState, {merchandiseId, quantity})` | Actualiza cantidad |
| `redirectToCheckout()` | Redirige al `checkoutUrl` de Shopify |
| `createCartAndSetCookie()` | Crea un carrito nuevo y guarda `cartId` en cookie |

Ninguna se ejecuta hoy en el flujo real de compra (el carrito visible usa `components/cart-drawer/`, no este).

### Track activo (datos de ejemplo) — sin Server Actions

El carrito, la wishlist y (desde el Sprint 9) la autenticación, direcciones y pedidos **no usan Server Actions**: son mutaciones 100% client-side sobre `localStorage`, vía los métodos expuestos por `useLocalCart()`, `useWishlist()` y `useAuth()`. No hay round-trip al servidor. `login`/`register`/`resetPassword` verifican/hashean con Web Crypto en el navegador (ver limitación en [ARCHITECTURE.md](./ARCHITECTURE.md#seguridad-de-contraseñas-limitación-conocida)) y `require-auth.tsx` protege rutas client-side, no vía middleware.

## Propuesta de API para cuando exista Postgres/Prisma (no implementada)

Cuando se conecte una base de datos real, el patrón adaptador (ver [ARCHITECTURE.md](./ARCHITECTURE.md)) necesitará endpoints reales para dejar de usar `localStorage`. Superficie mínima sugerida:

```
GET    /api/products              → listado con filtros (talla, color, precio, categoría)
GET    /api/products/:slug        → detalle de un producto
GET    /api/wishlist              → wishlist del usuario autenticado
POST   /api/wishlist               → agregar producto
DELETE /api/wishlist/:productId   → quitar producto
GET    /api/cart                  → carrito activo (por usuario o por sesión de invitado)
POST   /api/cart/lines            → agregar línea
PATCH  /api/cart/lines/:lineId    → actualizar cantidad
DELETE /api/cart/lines/:lineId    → quitar línea

POST   /api/auth/register         → crear usuario (o delegado a Auth.js/Clerk)
POST   /api/auth/login            → iniciar sesión (o delegado a Auth.js/Clerk)
POST   /api/auth/logout           → cerrar sesión
POST   /api/auth/password/forgot  → solicitar token de recuperación (envío de email real)
POST   /api/auth/password/reset   → consumir token y fijar nueva contraseña
GET    /api/account/profile       → perfil del usuario autenticado
PATCH  /api/account/profile       → editar perfil
GET    /api/account/addresses     → direcciones del usuario
POST   /api/account/addresses     → crear dirección
PATCH  /api/account/addresses/:id → editar dirección
DELETE /api/account/addresses/:id → eliminar dirección
GET    /api/account/orders        → historial de pedidos del usuario
```

Alternativa igual de válida dentro del ecosistema Next.js: reemplazar estos endpoints REST por **Server Actions** (como ya hace el track Shopify original) llamando directo a Prisma, sin pasar por rutas HTTP explícitas. La decisión queda abierta para cuando se aborde ese sprint — ver [ROADMAP.md](./ROADMAP.md).

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
