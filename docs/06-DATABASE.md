# 06 · Datos y persistencia ("base de datos")

## No hay base de datos propia

Este proyecto **no tiene SQL, NoSQL, ORM ni migraciones**. Toda la persistencia de dominio (catálogo, inventario, precios, carrito, checkout, contenido) vive en **Shopify**, y se accede exclusivamente vía su **Storefront API (GraphQL)**.

```
SHOPIFY_STORE_DOMAIN + SHOPIFY_STOREFRONT_ACCESS_TOKEN
        │
        ▼
POST https://{domain}/api/2023-01/graphql.json
        │
        ▼
lib/shopify/index.ts → shopifyFetch<T>()
```

El único "estado persistente" que vive fuera de Shopify es la **cookie `cartId`** en el navegador del usuario (identifica su carrito anónimo en Shopify).

## Punto único de acceso a datos: `lib/shopify/index.ts`

Toda lectura/escritura pasa por esta capa. Nada en `components/` o `app/` llama a `fetch` directo contra Shopify.

### Operaciones de lectura

| Función | Query GraphQL | Devuelve |
|---|---|---|
| `getProduct(handle)` | `queries/product.ts` → `getProductQuery` | `Product \| undefined` |
| `getProducts({query, sortKey, reverse})` | `getProductsQuery` | `Product[]` |
| `getProductRecommendations(id)` | `getProductRecommendationsQuery` | `Product[]` |
| `getCollection(handle)` | `queries/collection.ts` → `getCollectionQuery` | `Collection \| undefined` |
| `getCollectionProducts({collection, sortKey, reverse})` | `getCollectionProductsQuery` | `Product[]` |
| `getCollections()` | `getCollectionsQuery` | `Collection[]` (siempre incluye una entrada sintética `"All"`) |
| `getMenu(handle)` | `queries/menu.ts` → `getMenuQuery` | `Menu[]` |
| `getPage(handle)` / `getPages()` | `queries/page.ts` | `Page` / `Page[]` |
| `getCart()` | `queries/cart.ts` → `getCartQuery` | `Cart \| undefined` (según cookie `cartId`) |

### Operaciones de escritura (mutations)

| Función | Mutation GraphQL (`mutations/cart.ts`) |
|---|---|
| `createCart()` | `cartCreate` |
| `addToCart(lines)` | `cartLinesAdd` |
| `removeFromCart(lineIds)` | `cartLinesRemove` |
| `updateCart(lines)` | `cartLinesUpdate` |

## Modelo de datos (tipos de dominio — `lib/shopify/types.ts`)

```
Product
├─ id, handle, title, description, descriptionHtml
├─ availableForSale, tags[], seo{title, description}
├─ priceRange { minVariantPrice, maxVariantPrice }: Money
├─ featuredImage: Image
├─ images: Image[]
├─ options: ProductOption[]           (ej. "Color", "Talla")
└─ variants: ProductVariant[]
     ├─ id, title, availableForSale
     ├─ price: Money
     └─ selectedOptions: {name, value}[]

Collection
├─ handle, title, description, seo, updatedAt
└─ path                                (calculado: /search/{handle})

Cart
├─ id, checkoutUrl, totalQuantity
├─ cost { subtotalAmount, totalAmount, totalTaxAmount }: Money
└─ lines: CartItem[]
     ├─ id, quantity
     ├─ cost.totalAmount: Money
     └─ merchandise { id, title, selectedOptions[], product: CartProduct }

Page
├─ id, handle, title, body (HTML), bodySummary, seo, createdAt, updatedAt

Menu
├─ title, path
```

Los tipos `Shopify*` (`ShopifyProduct`, `ShopifyCart`, etc.) representan la forma **cruda** que devuelve la API (con `Connection<T>` tipo `{ edges: [{ node: T }] }`, el patrón estándar de Relay/GraphQL). Las funciones `reshapeProduct`, `reshapeCollection`, `reshapeCart`, `reshapeImages` en `lib/shopify/index.ts` los transforman a los tipos de dominio "planos" (`Product`, `Collection`, `Cart`) que consume la UI.

## Reglas de negocio aplicadas en la capa de datos

- **Productos ocultos**: cualquier producto con el tag `HIDDEN_PRODUCT_TAG` (`"nextjs-frontend-hidden"`) se filtra en `reshapeProduct` (excepto en `getProduct`, que sí permite verlo directo por handle, pero marcado `noindex`).
- **Colecciones ocultas**: cualquier colección cuyo `handle` empiece con `"hidden"` se excluye del listado en `/search` — pero sigue siendo accesible por código (`getCollectionProducts`) para casos como la home (`hidden-homepage-featured-items`, `hidden-homepage-carousel`).
- **Carrito sin impuestos**: si Shopify no devuelve `totalTaxAmount`, se rellena con `"0.0"` en la misma moneda (`reshapeCart`).
- **Alt text de imágenes**: si Shopify no tiene `altText`, se genera uno a partir del nombre de archivo + título del producto (`reshapeImages`).

## Comportamiento sin configurar (estado actual del proyecto)

Con `SHOPIFY_STORE_DOMAIN` vacío, `endpoint` queda `""` y varias funciones **hacen early-return sin llamar a la API**, devolviendo listas vacías y logueando en consola (`getCollectionProducts`, `getCollections`, `getMenu`, `getProduct`). Esto es lo que provoca que hoy la app se vea "vacía": **no hay error, simplemente no hay tienda conectada**.

## Variables de entorno relacionadas (`.env.example`)

| Variable | Uso |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | Dominio `.myshopify.com`, base del endpoint GraphQL |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Header `X-Shopify-Storefront-Access-Token` en cada request |
| `SHOPIFY_REVALIDATION_SECRET` | Valida el webhook entrante en `/api/revalidate` |
| `SITE_NAME` / `COMPANY_NAME` | Metadata textual (no relacionadas a Shopify, pero configuradas junto al resto) |

`lib/utils.ts` incluye `validateEnvironmentVariables()` para fallar rápido si faltan las dos primeras — no se invoca automáticamente en el arranque actual, hay que revisar si se llama desde algún build hook si se decide activarla.

## Documentos relacionados

- [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) — caché y revalidación
- [08-STATE-MANAGEMENT.md](./08-STATE-MANAGEMENT.md) — cómo se consume esto en el cliente
