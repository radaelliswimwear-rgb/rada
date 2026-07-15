# LAGO — Visión general del proyecto

## Qué es

**LAGO** es la firma de moda de **Laura Gómez**: un ecommerce premium de ropa (hombre, mujer, accesorios) construido sobre el template **Next.js Commerce** de Vercel, con branding, catálogo y experiencia de compra completamente personalizados.

- **Base técnica original**: [`vercel/commerce`](https://github.com/vercel/commerce) (Next.js 15 App Router + Shopify Storefront API).
- **Estado real de los datos**: no hay backend propio ni Shopify conectado todavía. Todo el catálogo, precios, imágenes y descripciones viven en **datos de ejemplo en código** (`lib/placeholder-data.ts`), pensados para ser reemplazados por un backend real sin rehacer la UI.
- **Identidad de marca**: negro / blanco / gris muy claro (`#F5F5F5`), tipografía sans-serif (Geist), logo en `public/logo/logo-principal.png`. Inspiración visual: Zara, COS, Massimo Dutti, Apple.

## Cómo correr el proyecto localmente

```bash
npm install --legacy-peer-deps   # necesario: Next.js está en versión canary
npm run dev                      # http://localhost:3000
npm run build                    # build de producción
npx tsc --noEmit                 # chequeo de tipos
```

> El flag `--legacy-peer-deps` es obligatorio: `next@15.6.0-canary.60` genera conflictos de peer dependencies con `geist` al instalar paquetes nuevos.

No hace falta ningún archivo `.env` para correr el proyecto — sin Shopify configurado, la app funciona igual usando los datos de ejemplo.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15.6 canary (App Router, RSC, Server Actions, PPR) |
| UI | React 19 |
| Estilos | Tailwind CSS 4 |
| Animaciones | Framer Motion |
| Componentes headless | Headless UI, Heroicons |
| Notificaciones | Sonner |
| Tipografía | Geist Sans |
| Lenguaje | TypeScript 5.8 (`strict`) |
| Backend de catálogo (dormido, listo para conectar) | Shopify Storefront API (GraphQL) |
| Persistencia actual (carrito, wishlist) | `localStorage` del navegador, detrás de una capa de datos pensada para Postgres/Prisma (ver [ARCHITECTURE.md](./ARCHITECTURE.md) y [DATABASE.md](./DATABASE.md)) |
| Imágenes de catálogo (temporales) | Unsplash (URLs directas vía `next/image`) |
| Hosting objetivo | Vercel (heredado del template; no hay despliegue configurado todavía) |

## Qué existe hoy (funcional, verificado)

- Home premium: Hero, categorías destacadas, productos destacados, banner promocional, newsletter, footer.
- Catálogo por categoría (`/hombre`, `/mujer`, `/accesorios`): filtros (talla/color/precio), orden, paginación, selector de columnas, Quick View, wishlist, hover con segunda imagen.
- Ficha de producto (`/producto/[slug]`): galería, selector de talla, descripción, productos relacionados.
- Carrito funcional (panel lateral, `localStorage` vía capa de adaptador): agregar/quitar, cantidad, subtotal, datos de producto resueltos en vivo desde el catálogo.
- Wishlist funcional (`/favoritos`, `localStorage` vía capa de repositorio): agregar/quitar, sincronizada en vivo en toda la app.
- Búsqueda funcional (`/buscar`): busca por nombre, categoría y color sobre los productos de ejemplo.
- Autenticación y área privada "Mi Cuenta" (`/cuenta/*`, `localStorage` vía adaptadores): login, registro, recuperar/restablecer contraseña, cierre de sesión, dashboard, perfil editable, gestión de direcciones, historial de pedidos (simulado), rutas protegidas.
- Documentación técnica completa en `docs/`.

## Qué NO existe todavía

- Backend/base de datos real (ni Shopify conectado, ni Postgres).
- Autenticación de producción (hoy es 100% simulada en el cliente — ver limitaciones en [ARCHITECTURE.md](./ARCHITECTURE.md#seguridad-de-contraseñas-limitación-conocida)); falta Auth.js/Clerk + hashing server-side.
- Checkout y pagos reales.
- Panel administrativo.
- Tests automatizados y CI/CD.
- Animación de salida en los modales (carrito, Quick View, menú móvil) — se sacrificó al corregir un bug donde no cerraban (ver [SPRINT-07](./sprints/SPRINT-07.md)).

## Historial de sprints

Cada sprint tiene su propia ficha en [`docs/sprints/`](./sprints/):

| Sprint | Contenido |
|---|---|
| [01](./sprints/SPRINT-01.md) | Home premium |
| [02](./sprints/SPRINT-02.md) | Páginas de catálogo/colección |
| [03](./sprints/SPRINT-03.md) | Sección de categorías (imágenes reales) |
| [04](./sprints/SPRINT-04.md) | Ficha de producto individual |
| [05](./sprints/SPRINT-05.md) | Carrito funcional |
| [06](./sprints/SPRINT-06.md) | Wishlist con arquitectura de datos enterprise-ready |
| [07](./sprints/SPRINT-07.md) | Búsqueda funcional + fix crítico de diálogos que no cerraban |
| [08](./sprints/SPRINT-08.md) | Carrito alineado al patrón adaptador |
| [09](./sprints/SPRINT-09.md) | Autenticación + área privada "Mi Cuenta" |

(El rebranding a LAGO — Laura Gómez y el Sprint 4.5 — "Premium Product Experience" del catálogo — ocurrieron entre sprints numerados y están documentados dentro de las fichas de Sprint 4 y 4.5 en el historial de conversación; el detalle técnico relevante de ambos quedó incorporado en [ARCHITECTURE.md](./ARCHITECTURE.md).)

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md) — cómo está construido, capas y patrones.
- [DATABASE.md](./DATABASE.md) — modelo de datos actual y propuesta para Postgres/Prisma.
- [API.md](./API.md) — rutas y Server Actions existentes.
- [ADMIN_PANEL.md](./ADMIN_PANEL.md) — estado (inexistente) y propuesta.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — cómo desplegar y qué falta para producción.
- [ROADMAP.md](./ROADMAP.md) — qué sigue.
