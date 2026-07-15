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

### `POST /api/webhooks/wompi` — `app/api/webhooks/wompi/route.ts` (Sprint 16)

Recibe eventos asincrónicos de Wompi (ej. `transaction.updated`) cuando el estado de una transacción cambia después de creada. Verifica `signature.checksum` contra `WOMPI_EVENTS_SECRET` (`400` si el payload no es JSON, `401` si la firma no coincide o falta el secreto); si es válida, llama a `paymentsRepository.applyWompiWebhookUpdate(reference, status, failureReason)`, que actualiza el `Payment` correspondiente y cancela el `Order` vinculado si el pago termina fallando. Siempre responde `200` con firma válida, sin importar si el evento tenía la forma esperada (Wompi reintenta si no recibe `200`). No verificado contra eventos reales de Wompi en este entorno — ver [sprints/SPRINT-16.md](./sprints/SPRINT-16.md).

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

| Dominio                                   | Mecanismo                                     | Archivo de entrada                                       |
| ----------------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| Catálogo / búsqueda                       | Server Actions (Postgres)                     | `lib/catalog/catalog-actions.ts`                         |
| Carrito                                   | Server Actions (Postgres, cookie de invitado) | `lib/cart/cart-actions.ts`                               |
| Wishlist                                  | Server Actions (Postgres, cookie de invitado) | `lib/wishlist/wishlist-actions.ts`                       |
| Usuarios                                  | Server Actions (Postgres)                     | `lib/auth/users-actions.ts`                              |
| Sesión / tokens de reset                  | `localStorage`, sin migrar                    | `lib/auth/session-storage.ts`, `reset-tokens-storage.ts` |
| Direcciones                               | Server Actions (Postgres)                     | `lib/addresses/addresses-actions.ts`                     |
| Pedidos                                   | Server Actions (Postgres)                     | `lib/orders/orders-actions.ts`                           |
| Pagos                                     | Server Actions (Postgres) + gateway simulado  | `lib/payments/payments-actions.ts`                       |
| Checkout (cálculo)                        | Funciones puras, sin persistencia propia      | `lib/checkout/*`                                         |
| Admin: productos (CRUD)                   | Server Actions (Postgres)                     | `lib/admin/products-actions.ts`                          |
| Admin: categorías (rename)                | Server Actions (Postgres)                     | `lib/admin/categories-actions.ts`                        |
| Admin: inventario (stock por talla)       | Server Actions (Postgres)                     | `lib/admin/inventory-actions.ts`                         |
| Admin: pedidos (listado global + estado)  | Server Actions (Postgres)                     | `lib/admin/orders-actions.ts`                            |
| Admin: dashboard (métricas)               | Server Actions (Postgres)                     | `lib/admin/dashboard-actions.ts`                         |
| Admin: imágenes (subir/borrar)            | Server Actions (Cloudinary, Sprint 15)        | `lib/cloudinary/upload-actions.ts`                       |
| Blog (lectura pública)                    | Server Actions (Postgres)                     | `lib/blog/blog-actions.ts`                               |
| Admin: blog (CRUD)                        | Server Actions (Postgres)                     | `lib/admin/blog-actions.ts`                              |
| Newsletter (suscripción pública)          | Server Actions (Postgres)                     | `lib/newsletter/newsletter-actions.ts`                   |
| Admin: newsletter (suscriptores/campañas) | Server Actions (Postgres)                     | `lib/admin/newsletter-actions.ts`                        |
| Cupones (validación pública)              | Server Actions (Postgres)                     | `lib/coupons/coupons-actions.ts`                         |
| Admin: cupones (CRUD)                     | Server Actions (Postgres)                     | `lib/admin/coupons-actions.ts`                           |

`login`/`register`/`resetPassword` siguen hasheando con Web Crypto **en el cliente** antes de llamar a la Server Action de usuarios (ver limitación en [ARCHITECTURE.md](./ARCHITECTURE.md#seguridad-de-contraseñas-limitación-conocida)); `require-auth.tsx` sigue protegiendo rutas client-side, no vía middleware. `/checkout` sigue sin exigir sesión (checkout de invitado) — ver [ARCHITECTURE.md](./ARCHITECTURE.md#checkout-sin-sesión-obligatoria-decisión-de-diseño-sprint-10). `paymentsRepository.confirmPayment` llama al gateway activo (`ACTIVE_PAYMENT_PROVIDER`, por defecto Stripe simulado); Wompi es real desde el Sprint 16 (tokenización + transacciones), con `app/api/webhooks/wompi/route.ts` para las actualizaciones asincrónicas de estado — ver [ARCHITECTURE.md](./ARCHITECTURE.md#pasarela-de-pago-simulada-limitación-conocida-sprint-11).

Las Server Actions de `lib/admin/*` (Sprint 14) están protegidas solo por `RequireAdmin` (`components/auth/require-admin.tsx`, client-side, mismo criterio que `require-auth.tsx`) y, a diferencia de `lib/catalog/catalog-actions.ts`, no atrapan sus errores en un resultado vacío: una escritura fallida (por ejemplo, un slug de producto duplicado) se devuelve como `{ success: false, error }` para que el panel se lo muestre a quien administra — ver [ADMIN_PANEL.md](./ADMIN_PANEL.md).

`lib/cloudinary/upload-actions.ts` (Sprint 15) sigue el mismo criterio de error explícito: `uploadProductImageAction` valida tipo y tamaño de archivo server-side (nunca confía solo en la validación del navegador) y `deleteCloudinaryAssetAction` es best-effort — un fallo se loguea pero no revierte ni bloquea el guardado/borrado del producto en Postgres, que ya se completó. Las credenciales (`CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`) se leen solo server-side, nunca se exponen al cliente.

`lib/blog/blog-actions.ts` (Sprint 17) sigue el criterio de lectura pública resiliente (degrada a `[]`/`null`, como `lib/catalog/catalog-actions.ts`); `lib/admin/blog-actions.ts` sigue el criterio de escritura explícita del resto de `lib/admin/*`. `lib/newsletter/newsletter-actions.ts#subscribeToNewsletterAction` valida formato de email y hace `upsert` — no envía ningún email real (sin proveedor externo configurado). `lib/coupons/coupons-actions.ts#validateCouponAction` es de solo lectura (no incrementa el uso del cupón); `incrementCouponUsageAction` se llama aparte, desde `checkout-content.tsx`, recién después de crear el pedido con éxito.

`app/sitemap.ts` (reescrito en el Sprint 17) dejó de depender de `lib/shopify` — antes llamaba a `validateEnvironmentVariables()` (exige credenciales de Shopify no configuradas en este proyecto) y `/sitemap.xml` devolvía 500 siempre; ahora lee de `catalogRepository`/`blogRepository`. `app/robots.ts` agrega `disallow` para `/admin`, `/cuenta`, `/checkout`, `/favoritos`, `/api`.

## Futuros endpoints HTTP explícitos (si se abandonan Server Actions)

Si en algún momento se prefiere una API REST explícita (por ejemplo, para consumo desde un cliente que no sea esta app Next.js — una app móvil, el futuro Panel Administrativo), la superficie natural es la misma que ya cubren las Server Actions: `/api/products`, `/api/categories`, `/api/search`, `/api/wishlist`, `/api/cart`, `/api/account/{profile,addresses,orders}`, `/api/checkout`, `/api/payments/{intents,webhook}`, `/api/auth/*`. No es necesario hoy — se documenta como opción, no como pendiente.

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
