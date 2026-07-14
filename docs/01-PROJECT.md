# 01 · Visión general del proyecto

## Qué es

Este proyecto es **Next.js Commerce** (conocido también como "Vercel Commerce"), el template oficial de Vercel para tiendas online *headless*, en su versión App Router (Next.js 15 / React 19). Actualmente es una copia **sin personalizar** del repositorio [`vercel/commerce`](https://github.com/vercel/commerce): no hay marca, catálogo, ni configuración propia todavía.

- **Origen del código**: extraído de `commerce-main.zip` (branch `main` de `vercel/commerce`).
- **Ruta real del proyecto**: `commerce-main/commerce-main/` (queda anidada porque el zip se descomprimió dentro de una carpeta con el mismo nombre).
- **Estado actual**: variables de entorno vacías (`.env.example` sin completar), por lo tanto **no está conectado a ninguna tienda Shopify real**. La app corre pero muestra catálogo vacío.
- **Objetivo declarado**: convertirlo en un **ecommerce premium de ropa**.

## Qué NO es

- No es una aplicación con backend propio ni base de datos SQL/NoSQL.
- No tiene sistema de autenticación de usuarios/cuentas.
- No tiene panel de administración propio (la administración de catálogo, menús y contenido vive 100% en el admin de Shopify).
- No tiene tests automatizados configurados.

## Propósito funcional

Es un **storefront headless**: la interfaz de compra (Next.js) está desacoplada del motor de comercio (Shopify). Next.js se encarga de:

- Renderizar catálogo, colecciones, búsqueda y fichas de producto con SSR/RSC.
- Gestionar el carrito de compra con actualizaciones optimistas.
- Redirigir al checkout hospedado por Shopify (no hay checkout propio).
- SEO técnico (sitemap, robots, metadata, JSON-LD, Open Graph dinámico).
- Cachear datos de forma agresiva y revalidar solo lo necesario vía webhooks de Shopify.

## Stack en una línea

Next.js 15 (App Router, RSC, Server Actions, PPR) + React 19 + TypeScript + Tailwind CSS 4 + Shopify Storefront API (GraphQL), desplegado en Vercel.

Ver [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) para el detalle técnico y [09-ROADMAP.md](./09-ROADMAP.md) para el plan de evolución hacia ecommerce de moda premium.

## Personas involucradas (roles típicos de este tipo de proyecto)

| Rol | Responsabilidad |
|---|---|
| Desarrollador frontend/fullstack | Next.js, componentes, integración GraphQL |
| Administrador de tienda (merchandiser) | Catálogo, colecciones, menús, páginas — todo dentro del admin de Shopify |
| Diseñador | Branding, UI/UX, dirección de arte para la fase de "premium" |

## Documentos relacionados

- [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) — cómo está construido
- [03-FOLDER-STRUCTURE.md](./03-FOLDER-STRUCTURE.md) — mapa de carpetas y archivos
- [04-COMPONENTS.md](./04-COMPONENTS.md) — inventario de componentes UI
- [05-ROUTES.md](./05-ROUTES.md) — todas las rutas de la app
- [06-DATABASE.md](./06-DATABASE.md) — cómo se modelan y persisten los datos (Shopify)
- [07-STYLING.md](./07-STYLING.md) — sistema visual (Tailwind 4)
- [08-STATE-MANAGEMENT.md](./08-STATE-MANAGEMENT.md) — estado de cliente/servidor
- [09-ROADMAP.md](./09-ROADMAP.md) — plan de migración a ecommerce premium de ropa
- [10-CONTRIBUTING.md](./10-CONTRIBUTING.md) — cómo trabajar en este repo sin romper nada
