# LAGO — Visión general del proyecto

## Qué es

**LAGO** es la firma de moda de **Laura Gómez**: un ecommerce premium de ropa (hombre, mujer, accesorios) construido sobre el template **Next.js Commerce** de Vercel, con branding, catálogo y experiencia de compra completamente personalizados.

- **Base técnica original**: [`vercel/commerce`](https://github.com/vercel/commerce) (Next.js 15 App Router + Shopify Storefront API).
- **Estado real de los datos**: Postgres + Prisma reales para catálogo, carrito, wishlist, cuentas, direcciones, pedidos y pagos (Sprint 12/13). `lib/placeholder-data.ts` sigue vivo, no como fuente de las páginas sino como caché síncrona que usan el carrito y `/favoritos` para resolver productos dentro de un Context de cliente (mismos IDs que Postgres).
- **Identidad de marca**: negro / blanco / gris muy claro (`#F5F5F5`), tipografía sans-serif (Geist), logo en `public/logo/logo-principal.png`. Inspiración visual: Zara, COS, Massimo Dutti, Apple.

## Cómo correr el proyecto localmente

```bash
npm install --legacy-peer-deps   # necesario: Next.js está en versión canary
npm run dev                      # http://localhost:3000
npm run build                    # build de producción
npx tsc --noEmit                 # chequeo de tipos
```

> El flag `--legacy-peer-deps` es obligatorio: `next@15.6.0-canary.60` genera conflictos de peer dependencies con `geist` al instalar paquetes nuevos.

Hace falta `DATABASE_URL` (ver `.env.example`) apuntando a un Postgres real para que catálogo/carrito/wishlist/login/checkout/pagos funcionen — sin conexión, la app sigue cargando (no hay Runtime Error) pero cada página muestra listados vacíos, ver [ARCHITECTURE.md](./ARCHITECTURE.md#server-actions--prisma-sprint-1213):

```bash
npx prisma migrate dev   # aplica prisma/migrations/ a la base indicada en DATABASE_URL
npm run db:seed          # carga categorías, productos, usuarios de prueba, un pedido y una wishlist demo
```

Usuarios de prueba tras el seed: `test@lago.com` (rol `ADMIN`, entra a `/admin`) / `demo@lago.com` (rol `USER`), contraseña `lago1234` para ambos.

## Stack técnico

| Capa                                               | Tecnología                                                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Framework                                          | Next.js 15.6 canary (App Router, RSC, Server Actions, PPR)                                                 |
| UI                                                 | React 19                                                                                                   |
| Estilos                                            | Tailwind CSS 4                                                                                             |
| Animaciones                                        | Framer Motion                                                                                              |
| Componentes headless                               | Headless UI, Heroicons                                                                                     |
| Notificaciones                                     | Sonner                                                                                                     |
| Tipografía                                         | Geist Sans                                                                                                 |
| Lenguaje                                           | TypeScript 5.8 (`strict`)                                                                                  |
| Backend de catálogo (dormido, listo para conectar) | Shopify Storefront API (GraphQL)                                                                           |
| Base de datos                                      | PostgreSQL + Prisma 7 (Sprint 12/13) — catálogo, carrito, wishlist, cuentas, direcciones, pedidos, pagos   |
| Persistencia sin migrar                            | `localStorage` del navegador — sesión, tokens de recuperación (ver [ARCHITECTURE.md](./ARCHITECTURE.md))   |
| Imágenes de catálogo                               | Unsplash (20 productos sembrados) + Cloudinary (subidas desde el panel, Sprint 15), ambas vía `next/image` |
| Hosting objetivo                                   | Vercel (heredado del template; no hay despliegue configurado todavía)                                      |

## Qué existe hoy (funcional, verificado)

- Home premium: Hero, categorías destacadas, productos destacados (Postgres), banner promocional, newsletter, footer.
- Catálogo por categoría (`/hombre`, `/mujer`, `/accesorios`, Postgres vía `catalogRepository`): filtros reales (talla/color/precio), orden, paginación server-side, selector de columnas, Quick View, wishlist, hover con segunda imagen.
- Ficha de producto (`/producto/[slug]`, Postgres): galería, selector de talla, descripción, productos relacionados (Postgres).
- Búsqueda real (`/buscar`, Postgres): busca por nombre, categoría, color y descripción con `contains` case-insensitive, con ranking por relevancia y límite de resultados (Sprint 17); autocompletado con debounce en el buscador del Navbar.
- Carrito funcional (panel lateral, Postgres/Prisma vía Server Actions, identificado por cookie de invitado): agregar/quitar, cantidad, subtotal, datos de producto resueltos en vivo desde el catálogo.
- Wishlist funcional (`/favoritos`, Postgres/Prisma vía Server Actions, identificada por cookie de invitado): agregar/quitar, sincronizada en vivo en toda la app.
- Autenticación y área privada "Mi Cuenta" (`/cuenta/*`, usuarios/direcciones/pedidos en Postgres, sesión en `localStorage`): login, registro, recuperar/restablecer contraseña, cierre de sesión, dashboard, perfil editable, gestión de direcciones, historial de pedidos reales, rutas protegidas.
- Checkout completo (`/checkout`, Postgres vía Server Actions): resumen del pedido, dirección de envío (con selección de direcciones guardadas o invitado), método de envío, resumen de costos (subtotal/envío/IVA/total), pago, validaciones, confirmación de pedido (`/checkout/confirmacion/[orderId]`). Los pedidos creados aquí se suman al historial de "Mis pedidos".
- Pasarela de pago intercambiable (`lib/payments/`, persistida en Postgres): Stripe simulado (activo por defecto) o **Wompi real** (Sprint 16 — tokenización, transacciones, webhook con verificación de firma; sin credenciales verificadas en este entorno) vía `NEXT_PUBLIC_PAYMENT_PROVIDER`. Formulario de tarjeta con validación (Luhn, vencimiento, CVC), manejo de éxito, fallo y cancelación; un pago que falla después de crear el pedido lo cancela automáticamente.
- Base Postgres real con seed (`prisma/seed.ts`): categorías, 20 productos, 2 usuarios de prueba (uno con rol `ADMIN`), un pedido+pago de ejemplo, una wishlist de ejemplo.
- Panel Administrativo (`/admin/*`, Sprint 14, protegido por `RequireAdmin` — requiere sesión y rol `ADMIN`): dashboard con métricas, CRUD de productos con gestión de imágenes vía Cloudinary (drag & drop, carga múltiple, imagen principal, reordenar, reemplazar — Sprint 15), categorías (rename), inventario (stock por talla), listado de pedidos con cambio de estado, listado de usuarios con gestión de rol, **blog, newsletter/campañas y cupones (Sprint 17)**; buscador y paginación en las tablas.
- SEO técnico real (Sprint 17): `/sitemap.xml` y `/robots.txt` funcionando de verdad (antes el sitemap heredado del template dependía de Shopify y devolvía 500 siempre), metadata dinámica/canonical/Open Graph/Twitter Cards en catálogo/producto/blog, datos estructurados schema.org (`Organization`, `WebSite`, `Product`, `Article`), skip link de accesibilidad.
- Blog (`/blog`, Postgres, Sprint 17): listado y ficha de post con Markdown propio, gestionado desde `/admin/blog`.
- Newsletter (Sprint 17): suscripción real persistida en Postgres desde el formulario de Home; gestión de campañas desde `/admin/newsletter` (sin envío real de email — no hay proveedor externo configurado).
- Cupones de descuento (Sprint 17): validación y aplicación real en el checkout, gestionados desde `/admin/cupones`.
- Recomendaciones (Sprint 17): relacionados con heurística de puntaje (color/precio/stock) en vez de orden arbitrario; sección "Recomendado para vos" en Home basada en el historial de "vistos recientemente" (100% client-side, `localStorage`).
- Documentación técnica completa en `docs/`.

## Qué NO existe todavía

- Shopify conectado.
- Fusión de carrito/wishlist de invitado a la cuenta al iniciar sesión.
- Autenticación de producción (hoy el hashing sigue siendo SHA-256 client-side y la sesión sigue en `localStorage` — ver limitaciones en [ARCHITECTURE.md](./ARCHITECTURE.md#seguridad-de-contraseñas-limitación-conocida)); falta Auth.js/Clerk + hashing server-side.
- Credenciales reales de pago verificadas — Wompi ya es real en código (Sprint 16) pero sin credenciales cargadas en este entorno; Stripe sigue simulado (ver [ARCHITECTURE.md](./ARCHITECTURE.md#pasarela-de-pago-simulada-limitación-conocida-sprint-11)).
- Fila `User` con `id: "guest"` — el checkout de invitado falla contra Postgres real sin ella (hallazgo del Sprint 16).
- Panel administrativo 100% completo (falta CRUD completo de categorías y sesión server-side; Cloudinary ya está integrado desde el Sprint 15 pero sin confirmar credenciales válidas en producción — ver [ADMIN_PANEL.md](./ADMIN_PANEL.md)).
- Envío real de campañas de newsletter (requiere proveedor externo con credenciales, fuera de alcance por instrucción explícita del Sprint 17).
- Búsqueda full-text real (`pg_trgm`/`tsvector`) — el Sprint 17 mejoró el ranking sobre `ILIKE`, no reemplazó el motor.
- Auditoría de accesibilidad AA completa (herramientas tipo axe/Lighthouse CI).
- Tests automatizados y CI/CD.
- Animación de salida en los modales (carrito, Quick View, menú móvil) — se sacrificó al corregir un bug donde no cerraban (ver [SPRINT-07](./sprints/SPRINT-07.md)).

## Historial de sprints

Cada sprint tiene su propia ficha en [`docs/sprints/`](./sprints/):

| Sprint                       | Contenido                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------- |
| [01](./sprints/SPRINT-01.md) | Home premium                                                                      |
| [02](./sprints/SPRINT-02.md) | Páginas de catálogo/colección                                                     |
| [03](./sprints/SPRINT-03.md) | Sección de categorías (imágenes reales)                                           |
| [04](./sprints/SPRINT-04.md) | Ficha de producto individual                                                      |
| [05](./sprints/SPRINT-05.md) | Carrito funcional                                                                 |
| [06](./sprints/SPRINT-06.md) | Wishlist con arquitectura de datos enterprise-ready                               |
| [07](./sprints/SPRINT-07.md) | Búsqueda funcional + fix crítico de diálogos que no cerraban                      |
| [08](./sprints/SPRINT-08.md) | Carrito alineado al patrón adaptador                                              |
| [09](./sprints/SPRINT-09.md) | Autenticación + área privada "Mi Cuenta"                                          |
| [10](./sprints/SPRINT-10.md) | Checkout completo                                                                 |
| [11](./sprints/SPRINT-11.md) | Integración de pasarela de pago (Stripe/Wompi)                                    |
| [12](./sprints/SPRINT-12.md) | PostgreSQL + Prisma real                                                          |
| [13](./sprints/SPRINT-13.md) | Catálogo, búsqueda y wishlist migrados a Postgres                                 |
| [14](./sprints/SPRINT-14.md) | Panel Administrativo: productos, categorías, inventario, pedidos y usuarios       |
| [15](./sprints/SPRINT-15.md) | Gestión profesional de imágenes de producto con Cloudinary                        |
| [16](./sprints/SPRINT-16.md) | Pasarela de pagos Wompi real, webhooks y estados de pago                          |
| [17](./sprints/SPRINT-17.md) | Marketing e Inteligencia: SEO técnico, blog, newsletter, cupones, recomendaciones |

(El rebranding a LAGO — Laura Gómez y el Sprint 4.5 — "Premium Product Experience" del catálogo — ocurrieron entre sprints numerados y están documentados dentro de las fichas de Sprint 4 y 4.5 en el historial de conversación; el detalle técnico relevante de ambos quedó incorporado en [ARCHITECTURE.md](./ARCHITECTURE.md).)

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md) — cómo está construido, capas y patrones.
- [DATABASE.md](./DATABASE.md) — modelo de datos actual y propuesta para Postgres/Prisma.
- [API.md](./API.md) — rutas y Server Actions existentes.
- [ADMIN_PANEL.md](./ADMIN_PANEL.md) — estado (inexistente) y propuesta.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — cómo desplegar y qué falta para producción.
- [ROADMAP.md](./ROADMAP.md) — qué sigue.
