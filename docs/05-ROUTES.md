# 05 · Rutas (App Router)

Todas las rutas viven en `app/`. No hay API routes propias salvo el webhook de revalidación.

## Páginas

| Ruta | Archivo | Tipo | Datos que consume | Notas |
|---|---|---|---|---|
| `/` | `app/page.tsx` | Server, estático con `<Suspense>` interno | `getCollectionProducts` (x2, vía `ThreeItemGrid`/`Carousel`) | Home: grilla destacada + carrusel + footer |
| `/product/[handle]` | `app/product/[handle]/page.tsx` | Server, dinámico | `getProduct(handle)`, `getProductRecommendations(id)` | `generateMetadata` con OG + `notFound()` si no existe; incluye JSON-LD `schema.org/Product` |
| `/search` | `app/search/page.tsx` | Server, dinámico (`searchParams`) | `getProducts({ query, sortKey, reverse })` | Búsqueda global vía `?q=` |
| `/search/[collection]` | `app/search/[collection]/page.tsx` | Server, dinámico | `getCollection`, `getCollectionProducts` | Listado por colección; `notFound()` si la colección no existe |
| `/[page]` (catch-all de 1 segmento) | `app/[page]/page.tsx` | Server, dinámico | `getPage(handle)` | Cualquier página de contenido creada en Shopify Admin (ej. `/about`, `/terms`) |

## Layouts

| Layout | Archivo | Envuelve |
|---|---|---|
| Root layout | `app/layout.tsx` | Toda la app: `<html>`, fuente `GeistSans`, `CartProvider`, `Navbar`, `Toaster`, `WelcomeToast` |
| Search layout | `app/search/layout.tsx` | `/search` y `/search/[collection]`: agrega sidebar `Collections` + `FilterList` (sort) + `Footer` |
| Page layout | `app/[page]/layout.tsx` | Envoltorio de contenido para páginas CMS |

## Rutas especiales / metadata técnica

| Ruta generada | Archivo fuente | Propósito |
|---|---|---|
| `/sitemap.xml` | `app/sitemap.ts` | Sitemap dinámico (productos, colecciones, páginas) |
| `/robots.txt` | `app/robots.ts` | Reglas de indexación |
| `/opengraph-image` (home) | `app/opengraph-image.tsx` | Imagen OG de la home |
| `/[page]/opengraph-image` | `app/[page]/opengraph-image.tsx` | Imagen OG por página de contenido |
| `/search/[collection]/opengraph-image` | `app/search/[collection]/opengraph-image.tsx` | Imagen OG por colección |
| `error.tsx` (root) | `app/error.tsx` | Error boundary global |
| `search/loading.tsx` | `app/search/loading.tsx` | Loading UI automático de Next.js para la rama `/search` |

## API Routes

| Endpoint | Método | Archivo | Propósito |
|---|---|---|---|
| `/api/revalidate` | `POST` (webhook de Shopify) | `app/api/revalidate/route.ts` | Recibe webhooks de Shopify (`products/*`, `collections/*`), valida `?secret=`, invalida los tags de caché correspondientes |

No hay más API routes: todas las mutaciones de carrito pasan por **Server Actions**, no por endpoints REST propios (ver [08-STATE-MANAGEMENT.md](./08-STATE-MANAGEMENT.md)).

## Parámetros dinámicos, en detalle

- `[handle]` (producto) y `[collection]` — mapean 1:1 al `handle` de Shopify (slug del producto/colección).
- `[page]` — mapea al `handle` de una página de contenido de Shopify. **Cuidado**: es un segmento catch-all de un solo nivel, así que cualquier ruta de primer nivel no definida explícitamente (`/about`, `/envios`, etc.) cae acá y se resuelve contra Shopify; si no existe la página, `notFound()`.
- `searchParams` se usan como **estado**, no solo para SEO: `?q=`, `?sort=`, `?image=`, `?{opción}=valor` (color/talla). Ver `lib/constants.ts` (`sorting`) para los slugs válidos de orden.

## Convenciones de metadata

Cada ruta que puede indexarse define su propio `generateMetadata` (o `export const metadata`), heredando el patrón `title.template` (`%s | ${SITE_NAME}`) del root layout. Los productos ocultos (`tags` incluye `HIDDEN_PRODUCT_TAG = "nextjs-frontend-hidden"`) se marcan `robots: { index: false, follow: false }`.

## Documentos relacionados

- [04-COMPONENTS.md](./04-COMPONENTS.md)
- [06-DATABASE.md](./06-DATABASE.md)
