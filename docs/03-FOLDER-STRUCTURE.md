# 03 · Estructura de carpetas y archivos

Raíz real del proyecto: `commerce-main/commerce-main/` (Next.js vive ahí, no en la raíz `D:\CLAUDE`).

```
commerce-main/
├── app/                                # Rutas — Next.js App Router
│   ├── [page]/                         # Ruta dinámica catch-all para páginas CMS de Shopify
│   │   ├── page.tsx                    # Renderiza cualquier página creada en el admin de Shopify
│   │   ├── layout.tsx                  # Layout específico de estas páginas (envoltorio de contenido)
│   │   └── opengraph-image.tsx         # OG image dinámica para páginas de contenido
│   ├── api/
│   │   └── revalidate/route.ts         # Webhook receptor: invalida caché cuando Shopify avisa cambios
│   ├── product/
│   │   └── [handle]/page.tsx           # Ficha de producto individual
│   ├── search/
│   │   ├── page.tsx                    # Búsqueda global (?q=...)
│   │   ├── layout.tsx                  # Layout con sidebar de colecciones + filtros de orden
│   │   ├── loading.tsx                 # Loading UI de Next.js para esta rama de rutas
│   │   ├── children-wrapper.tsx        # Wrapper para animaciones/transiciones de resultados
│   │   └── [collection]/
│   │       ├── page.tsx                # Listado de una colección específica
│   │       └── opengraph-image.tsx     # OG image dinámica por colección
│   ├── error.tsx                       # Boundary de errores global
│   ├── favicon.ico
│   ├── globals.css                     # Entry point de Tailwind CSS 4 + estilos base
│   ├── layout.tsx                      # Root layout: fuente, CartProvider, Navbar, Toaster
│   ├── opengraph-image.tsx             # OG image dinámica global (home)
│   ├── page.tsx                        # Home
│   ├── robots.ts                       # robots.txt generado dinámicamente
│   └── sitemap.ts                      # sitemap.xml generado dinámicamente
│
├── components/                         # UI reutilizable
│   ├── cart/
│   │   ├── actions.ts                  # Server Actions: addItem, removeItem, updateItemQuantity, checkout
│   │   ├── add-to-cart.tsx             # Botón "Add to cart" (client)
│   │   ├── cart-context.tsx            # Context + reducer optimista del carrito (client)
│   │   ├── delete-item-button.tsx      # Botón eliminar línea de carrito (client)
│   │   ├── edit-item-quantity-button.tsx # Botones +/- cantidad (client)
│   │   ├── modal.tsx                   # Panel lateral del carrito (client)
│   │   └── open-cart.tsx               # Icono/botón que abre el carrito
│   ├── grid/
│   │   ├── index.tsx                   # <Grid> y <Grid.Item> genéricos (CSS grid)
│   │   ├── three-items.tsx             # Grilla destacada de 3 productos (home)
│   │   └── tile.tsx                    # <GridTileImage> — tarjeta de producto con label de precio
│   ├── icons/
│   │   └── logo.tsx                    # SVG del logo (placeholder del template)
│   ├── layout/
│   │   ├── footer.tsx                  # Footer completo
│   │   ├── footer-menu.tsx             # Menú del footer (desde Shopify)
│   │   ├── product-grid-items.tsx      # Mapea productos → GridTileImage en listados
│   │   ├── navbar/
│   │   │   ├── index.tsx               # Barra de navegación principal (server)
│   │   │   ├── mobile-menu.tsx         # Menú hamburguesa (client, Headless UI Dialog)
│   │   │   └── search.tsx              # Input de búsqueda (client)
│   │   └── search/
│   │       ├── collections.tsx         # Sidebar de colecciones en /search
│   │       └── filter/
│   │           ├── index.tsx           # <FilterList> — lista de filtros (desktop/mobile)
│   │           ├── item.tsx            # Item individual de filtro (ordenar o colección)
│   │           └── dropdown.tsx        # Versión dropdown para mobile
│   ├── product/
│   │   ├── gallery.tsx                 # Galería de imágenes de producto (client, estado en URL)
│   │   ├── product-description.tsx     # Título, precio, variantes, descripción, add-to-cart
│   │   └── variant-selector.tsx        # Selector de talla/color (client, estado en URL)
│   ├── carousel.tsx                    # Carrusel de productos (home)
│   ├── label.tsx                       # Etiqueta flotante título+precio sobre imagen
│   ├── loading-dots.tsx                # Indicador de carga (3 puntos animados)
│   ├── logo-square.tsx                 # Contenedor cuadrado del logo
│   ├── opengraph-image.tsx             # Helper compartido para generar OG images
│   ├── price.tsx                       # Formateo de precio con Intl.NumberFormat
│   ├── prose.tsx                       # Wrapper de contenido HTML (páginas CMS) con estilos tipográficos
│   └── welcome-toast.tsx               # Toast de bienvenida (client, cookie de "ya visto")
│
├── lib/
│   ├── shopify/
│   │   ├── index.ts                    # Cliente GraphQL + todas las funciones de acceso a datos + reshape
│   │   ├── types.ts                    # Tipos Shopify (Shopify*) + tipos de dominio de la app
│   │   ├── fragments/
│   │   │   ├── cart.ts
│   │   │   ├── image.ts
│   │   │   ├── product.ts
│   │   │   └── seo.ts
│   │   ├── mutations/
│   │   │   └── cart.ts                 # createCart, addToCart, editCartItems, removeFromCart
│   │   └── queries/
│   │       ├── cart.ts
│   │       ├── collection.ts
│   │       ├── menu.ts
│   │       ├── page.ts
│   │       └── product.ts
│   ├── constants.ts                    # TAGS, sorting, HIDDEN_PRODUCT_TAG, endpoint de API
│   ├── type-guards.ts                  # isShopifyError, isObject
│   └── utils.ts                        # baseUrl, createUrl, ensureStartsWith, validateEnvironmentVariables
│
├── fonts/
│   └── Inter-Bold.ttf                  # Fuente local (uso puntual; el resto usa `geist`)
│
├── docs/                                # ← Esta documentación
│
├── .env.example                        # Variables de entorno requeridas (plantilla)
├── .gitignore
├── .vscode/                            # launch.json, settings.json (config de editor)
├── license.md                          # Licencia del template original (vercel/commerce)
├── next-env.d.ts                       # Tipos generados por Next.js (no editar manualmente)
├── next.config.ts                      # Config de Next.js (PPR, caché, imágenes remotas)
├── package.json / package-lock.json / pnpm-lock.yaml
├── postcss.config.mjs                  # PostCSS para Tailwind 4
├── README.md                           # Documentación oficial del template (inglés)
└── tsconfig.json                       # Config TypeScript (baseUrl "." habilita imports "components/...", "lib/...")
```

## Convenciones de import

Gracias a `"baseUrl": "."` en `tsconfig.json`, todo el código importa con rutas **absolutas desde la raíz del proyecto**, sin `../../..`:

```ts
import { getProduct } from "lib/shopify";
import Price from "components/price";
```

## Carpetas generadas (no versionar / no editar a mano)

- `.next/` — build cache de Next.js.
- `node_modules/` — dependencias.
- `next-env.d.ts` — regenerado automáticamente por Next.js.

## Documentos relacionados

- [02-ARCHITECTURE.md](./02-ARCHITECTURE.md)
- [04-COMPONENTS.md](./04-COMPONENTS.md)
- [05-ROUTES.md](./05-ROUTES.md)
