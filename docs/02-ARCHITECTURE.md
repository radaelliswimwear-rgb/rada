# 02 · Arquitectura

## Patrón general: Headless Commerce, Server-First

Next.js es **únicamente la capa de presentación**. Todo el dominio de negocio (productos, variantes, inventario, precios, carrito, checkout, páginas de contenido, menús) vive en **Shopify**, consumido a través de su **Storefront API (GraphQL)**.

```
┌─────────────┐      HTML/RSC payload      ┌──────────────────────────┐
│  Navegador   │ ◄────────────────────────► │   Next.js (App Router)   │
│ (Client Comp)│      Server Actions        │  Vercel Edge/Node runtime │
└─────────────┘                             └────────────┬─────────────┘
                                                          │ GraphQL (HTTPS)
                                                          ▼
                                             ┌──────────────────────────┐
                                             │ Shopify Storefront API   │
                                             │ (catálogo, carrito,      │
                                             │  checkout, páginas, menú)│
                                             └──────────────────────────┘
```

## Capas del código

1. **`app/`** — rutas (App Router). Mayormente **React Server Components** `async` que hacen `fetch` de datos directo, sin API routes intermedias propias.
2. **`components/`** — UI. Se dividen en:
   - **Server Components** (por defecto): páginas, grillas, footer, navbar de menú — no tienen `"use client"`.
   - **Client Components** (`"use client"`): todo lo interactivo — carrito, filtros, galería, selector de variantes, menú móvil.
3. **`lib/shopify/`** — capa de acceso a datos. Único punto de contacto con la API externa.
4. **`lib/constants.ts`, `lib/utils.ts`, `lib/type-guards.ts`** — utilidades transversales.

## Flujo de datos (lectura)

```
page.tsx (Server Component, async)
   │
   ▼
lib/shopify/index.ts  → getProduct() / getCollectionProducts() / getMenu() / ...
   │  "use cache" + cacheTag(...) + cacheLife(...)
   ▼
shopifyFetch<T>()  → POST a {SHOPIFY_STORE_DOMAIN}/api/2023-01/graphql.json
   │  header X-Shopify-Storefront-Access-Token
   ▼
reshape*()  → normaliza la forma de Shopify (edges/nodes) a los tipos de dominio de la app
```

## Flujo de datos (escritura — carrito)

```
Client Component (AddToCart, EditItemQuantityButton, DeleteItemButton)
   │  1. Actualiza UI al instante vía useOptimistic (cart-context.tsx)
   │  2. Dispara <form action={...}> → Server Action (components/cart/actions.ts)
   ▼
Server Action ("use server")
   │  addToCart / removeFromCart / updateCart (lib/shopify/index.ts)
   │  updateTag(TAGS.cart) → invalida la caché del carrito
   ▼
Shopify Storefront API (mutations: cartLinesAdd, cartLinesRemove, cartLinesUpdate)
```

El `cartId` se guarda en una **cookie** (`createCartAndSetCookie`, `cookies().get("cartId")`), no en sesión de servidor ni base de datos.

## Estrategia de caché y revalidación (Next.js 15)

El proyecto usa las APIs experimentales de caché de Next 15, activadas en `next.config.ts` (`experimental.useCache`, `experimental.ppr`, `experimental.inlineCss`):

| Función | Directiva | Tag | Vida |
|---|---|---|---|
| `getCart` | `"use cache: private"` | `TAGS.cart` | `seconds` |
| `getCollection` | `"use cache"` | `TAGS.collections` | `days` |
| `getCollectionProducts` | `"use cache"` | `collections + products` | `days` |
| `getCollections` | `"use cache"` | `TAGS.collections` | `days` |
| `getMenu` | `"use cache"` | `TAGS.collections` | `days` |
| `getProduct` | `"use cache"` | `TAGS.products` | `days` |
| `getProductRecommendations` | `"use cache"` | `TAGS.products` | `days` |
| `getProducts` | `"use cache"` | `TAGS.products` | `days` |
| `getPage(s)` | sin caché explícita | — | — |

**Revalidación por webhook** (`app/api/revalidate/route.ts`):

1. Shopify manda un webhook con header `x-shopify-topic` (ej. `products/update`).
2. Se valida `?secret=` contra `SHOPIFY_REVALIDATION_SECRET`.
3. Si el topic es de colección → `revalidateTag(TAGS.collections)`. Si es de producto → `revalidateTag(TAGS.products)`.
4. Siempre responde `200` (Shopify reintenta si no recibe 200).

**PPR (Partial Prerendering)**: activado globalmente. Permite que partes estáticas de una página (shell) se sirvan instantáneas mientras las partes dinámicas (ej. carrito, recomendaciones) se cargan en streaming dentro de `<Suspense>`.

## Renderizado y Suspense

Prácticamente todo componente que depende de datos remotos está envuelto en `<Suspense>` con un *skeleton* de carga: `Navbar` → `MobileMenu`/`Search`, `Footer` → `FooterMenu`, `SearchLayout` → `Collections`/`ChildrenWrapper`, `ProductPage` → `Gallery`/`ProductDescription`. Esto habilita streaming SSR y PPR de forma consistente en todo el árbol.

## Autenticación / autorización

No existe. El único mecanismo de "identidad" es la cookie `cartId`, anónima y sin vínculo a una cuenta de usuario. Cualquier control de acceso (páginas privadas, mayoristas, etc.) tendría que construirse desde cero si se necesita en el futuro.

## Integración con Vercel

El proyecto está diseñado para desplegarse en Vercel:

- `next.config.ts` optimiza imágenes (`avif`/`webp`) desde `cdn.shopify.com`.
- Usa `VERCEL_PROJECT_PRODUCTION_URL` para calcular `baseUrl` (`lib/utils.ts`) usado en `metadataBase`.
- El README documenta el flujo `vercel link` + `vercel env pull` para sincronizar variables de entorno.

## Diagrama de dependencias entre capas

```
app/*  ──depends on──►  components/*  ──depends on──►  lib/shopify, lib/constants, lib/utils
  │                                                              │
  └───────────────────────depends on────────────────────────────┘
                     (fetch directo en Server Components)
```

No hay dependencias circulares: `lib/` nunca importa de `components/` ni de `app/`.

## Documentos relacionados

- [03-FOLDER-STRUCTURE.md](./03-FOLDER-STRUCTURE.md)
- [05-ROUTES.md](./05-ROUTES.md)
- [06-DATABASE.md](./06-DATABASE.md)
- [08-STATE-MANAGEMENT.md](./08-STATE-MANAGEMENT.md)
