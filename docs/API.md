# API

## Estado actual: Server Actions sobre Prisma (Sprint 12/13) para catálogo, carrito, wishlist, cuentas, pedidos y pagos

No hay endpoints REST/GraphQL propios (más allá del webhook de Shopify). Carrito, wishlist, catálogo/búsqueda, usuarios, direcciones, pedidos y pagos se leen/escriben mediante **Server Actions** (`"use server"`) que hablan con Postgres vía Prisma — no hay round-trip HTTP explícito, Next.js lo resuelve como RPC. Sesión y tokens de recuperación siguen 100% client-side sobre `localStorage` (ver [ARCHITECTURE.md](./ARCHITECTURE.md#server-actions--prisma-sprint-1213)).

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

| Acción                                                     | Qué hace                                          |
| ---------------------------------------------------------- | ------------------------------------------------- |
| `addItem(prevState, selectedVariantId)`                    | Agrega una línea al carrito de Shopify            |
| `removeItem(prevState, merchandiseId)`                     | Quita una línea                                   |
| `updateItemQuantity(prevState, {merchandiseId, quantity})` | Actualiza cantidad                                |
| `redirectToCheckout()`                                     | Redirige al `checkoutUrl` de Shopify              |
| `createCartAndSetCookie()`                                 | Crea un carrito nuevo y guarda `cartId` en cookie |

Ninguna se ejecuta hoy en el flujo real de compra (el carrito visible usa `components/cart-drawer/`, no este).

### Track activo — Server Actions Prisma (Sprint 12/13) + localStorage (dominios no migrados)

| Dominio                                  | Mecanismo                                     | Archivo de entrada                                       |
| ---------------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| Catálogo / búsqueda                      | Server Actions (Postgres)                     | `lib/catalog/catalog-actions.ts`                         |
| Carrito                                  | Server Actions (Postgres, cookie de invitado) | `lib/cart/cart-actions.ts`                               |
| Wishlist                                 | Server Actions (Postgres, cookie de invitado) | `lib/wishlist/wishlist-actions.ts`                       |
| Usuarios                                 | Server Actions (Postgres)                     | `lib/auth/users-actions.ts`                              |
| Sesión / tokens de reset                 | `localStorage`, sin migrar                    | `lib/auth/session-storage.ts`, `reset-tokens-storage.ts` |
| Direcciones                              | Server Actions (Postgres)                     | `lib/addresses/addresses-actions.ts`                     |
| Pedidos                                  | Server Actions (Postgres)                     | `lib/orders/orders-actions.ts`                           |
| Pagos                                    | Server Actions (Postgres) + gateway simulado  | `lib/payments/payments-actions.ts`                       |
| Checkout (cálculo)                       | Funciones puras, sin persistencia propia      | `lib/checkout/*`                                         |
| Admin: productos (CRUD)                  | Server Actions (Postgres)                     | `lib/admin/products-actions.ts`                          |
| Admin: categorías (rename)               | Server Actions (Postgres)                     | `lib/admin/categories-actions.ts`                        |
| Admin: inventario (stock por talla)      | Server Actions (Postgres)                     | `lib/admin/inventory-actions.ts`                         |
| Admin: pedidos (listado global + estado) | Server Actions (Postgres)                     | `lib/admin/orders-actions.ts`                            |
| Admin: dashboard (métricas)              | Server Actions (Postgres)                     | `lib/admin/dashboard-actions.ts`                         |
| Admin: imágenes (subir/borrar)           | Server Actions (Cloudinary, Sprint 15)        | `lib/cloudinary/upload-actions.ts`                       |

`login`/`register`/`resetPassword` siguen hasheando con Web Crypto **en el cliente** antes de llamar a la Server Action de usuarios (ver limitación en [ARCHITECTURE.md](./ARCHITECTURE.md#seguridad-de-contraseñas-limitación-conocida)); `require-auth.tsx` sigue protegiendo rutas client-side, no vía middleware. `/checkout` sigue sin exigir sesión (checkout de invitado) — ver [ARCHITECTURE.md](./ARCHITECTURE.md#checkout-sin-sesión-obligatoria-decisión-de-diseño-sprint-10). `paymentsRepository.confirmPayment` sigue llamando a un gateway simulado (Stripe/Wompi intercambiables) — ver [ARCHITECTURE.md](./ARCHITECTURE.md#pasarela-de-pago-simulada-limitación-conocida-sprint-11).

Las Server Actions de `lib/admin/*` (Sprint 14) están protegidas solo por `RequireAdmin` (`components/auth/require-admin.tsx`, client-side, mismo criterio que `require-auth.tsx`) y, a diferencia de `lib/catalog/catalog-actions.ts`, no atrapan sus errores en un resultado vacío: una escritura fallida (por ejemplo, un slug de producto duplicado) se devuelve como `{ success: false, error }` para que el panel se lo muestre a quien administra — ver [ADMIN_PANEL.md](./ADMIN_PANEL.md).

`lib/cloudinary/upload-actions.ts` (Sprint 15) sigue el mismo criterio de error explícito: `uploadProductImageAction` valida tipo y tamaño de archivo server-side (nunca confía solo en la validación del navegador) y `deleteCloudinaryAssetAction` es best-effort — un fallo se loguea pero no revierte ni bloquea el guardado/borrado del producto en Postgres, que ya se completó. Las credenciales (`CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`) se leen solo server-side, nunca se exponen al cliente.

## Futuros endpoints HTTP explícitos (si se abandonan Server Actions)

Si en algún momento se prefiere una API REST explícita (por ejemplo, para consumo desde un cliente que no sea esta app Next.js — una app móvil, el futuro Panel Administrativo), la superficie natural es la misma que ya cubren las Server Actions: `/api/products`, `/api/categories`, `/api/search`, `/api/wishlist`, `/api/cart`, `/api/account/{profile,addresses,orders}`, `/api/checkout`, `/api/payments/{intents,webhook}`, `/api/auth/*`. No es necesario hoy — se documenta como opción, no como pendiente.

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
