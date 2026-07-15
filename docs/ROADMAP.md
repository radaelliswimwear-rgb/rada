# Roadmap

## Hecho

| Sprint | Qué se construyó                                                                                                                                                                           | Ficha                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| 1      | Home premium (Hero, categorías, productos, banner, newsletter, footer)                                                                                                                     | [SPRINT-01](./sprints/SPRINT-01.md)     |
| 2      | Páginas de catálogo `/hombre`, `/mujer`, `/accesorios` con filtros y orden                                                                                                                 | [SPRINT-02](./sprints/SPRINT-02.md)     |
| 3      | Sección de categorías con imágenes reales (Unsplash)                                                                                                                                       | [SPRINT-03](./sprints/SPRINT-03.md)     |
| —      | Rebranding completo a LAGO — Laura Gómez (logo, paleta, tipografía)                                                                                                                        | ver [SPRINT-04](./sprints/SPRINT-04.md) |
| 4      | Ficha de producto individual (`/producto/[slug]`)                                                                                                                                          | [SPRINT-04](./sprints/SPRINT-04.md)     |
| 4.5    | Experiencia premium de catálogo (Quick View, wishlist visual, paginación, Framer Motion)                                                                                                   | ver [SPRINT-04](./sprints/SPRINT-04.md) |
| 5      | Carrito funcional (`localStorage`)                                                                                                                                                         | [SPRINT-05](./sprints/SPRINT-05.md)     |
| 6      | Wishlist con arquitectura de datos enterprise-ready (`/favoritos`)                                                                                                                         | [SPRINT-06](./sprints/SPRINT-06.md)     |
| 7      | Búsqueda funcional (`/buscar`) + fix crítico: los modales no cerraban                                                                                                                      | [SPRINT-07](./sprints/SPRINT-07.md)     |
| 8      | Carrito alineado al patrón adaptador (`lib/cart/`)                                                                                                                                         | [SPRINT-08](./sprints/SPRINT-08.md)     |
| 9      | Autenticación + área privada "Mi Cuenta" (login, registro, recuperar contraseña, perfil, direcciones, pedidos)                                                                             | [SPRINT-09](./sprints/SPRINT-09.md)     |
| 10     | Checkout completo (dirección, envío, costos, confirmación)                                                                                                                                 | [SPRINT-10](./sprints/SPRINT-10.md)     |
| 11     | Integración de pasarela de pago (Stripe/Wompi, simulada e intercambiable)                                                                                                                  | [SPRINT-11](./sprints/SPRINT-11.md)     |
| 12     | PostgreSQL + Prisma real (carrito, cuentas, direcciones, pedidos, pagos)                                                                                                                   | [SPRINT-12](./sprints/SPRINT-12.md)     |
| 13     | Catálogo, búsqueda y wishlist migrados a PostgreSQL                                                                                                                                        | [SPRINT-13](./sprints/SPRINT-13.md)     |
| 14     | Panel Administrativo: productos, categorías, inventario, pedidos, usuarios; `User.role` wireado de punta a punta                                                                           | [SPRINT-14](./sprints/SPRINT-14.md)     |
| 15     | Gestión profesional de imágenes de producto con Cloudinary (drag & drop, carga múltiple, reordenar, imagen principal, reemplazo, borrado automático)                                       | [SPRINT-15](./sprints/SPRINT-15.md)     |
| 16     | Pasarela de pagos Wompi real (tokenización + transacciones), webhook con verificación de firma, cancelación automática de pedido si el pago falla                                          | [SPRINT-16](./sprints/SPRINT-16.md)     |
| 17     | Marketing e Inteligencia: SEO técnico (sitemap/robots/canonical/OG/Twitter/schema.org), blog, newsletter+campañas, cupones, recomendaciones, vistos recientemente, búsqueda mejorada, a11y | [SPRINT-17](./sprints/SPRINT-17.md)     |

## Decisión pendiente: ¿Shopify, backend propio, o ambos?

Este es el fork más importante del roadmap y todavía no está resuelto:

- **Opción A — Conectar Shopify.** El track dormido (`lib/shopify/*`, `components/cart/*`, `components/product/*`) ya está construido y probado arquitectónicamente. Conectar credenciales activaría catálogo, carrito, checkout y menús reales sin escribir código nuevo de backend.
- **Opción B — Backend propio (Postgres + Prisma + Cloudinary + Admin Panel).** Desde el Sprint 12/13, Postgres + Prisma ya son reales para catálogo, carrito, wishlist, cuentas, direcciones, pedidos y pagos — esta opción ya no es enteramente futura. Da control total (panel propio, lógica de negocio propia) a costa de tener que construir mucho más (Cloudinary, roles de usuario).
- **Opción C — Híbrido.** Shopify para catálogo/inventario/checkout (fuerte en eso), Postgres propio para lo que Shopify no resuelve bien out-of-the-box (wishlist enriquecida, contenido editorial, analítica propia, panel administrativo a medida). Es un patrón común en ecommerce headless de nivel enterprise.

Ninguna decisión de código tomada hasta ahora cierra la puerta a ninguna de las tres — es intencional (ver [ARCHITECTURE.md](./ARCHITECTURE.md)).

## Por hacer (sin ordenar por prioridad todavía)

- ~~Wompi real~~ — ✅ hecho (Sprint 16): tokenización + transacciones + webhook con verificación de firma, sobre el mismo contrato `PaymentGateway`. Sin credenciales configuradas en este entorno, no se pudo verificar contra la API real (ver [SPRINT-16](./sprints/SPRINT-16.md)); la tienda sigue con Stripe simulado activo por defecto.
- **Credenciales reales de Stripe** — sigue simulado; `providers/stripe-gateway.ts` es el único que falta reemplazar por el SDK real (ver [DEPLOYMENT.md](./DEPLOYMENT.md)).
- **Sembrar usuario `guest`** — el checkout de invitado falla contra Postgres real (`Order_userId_fkey`) porque no existe una fila `User` con `id: "guest"` (hallazgo del Sprint 16, sin relación con pagos).
- **Autenticación de producción (Auth.js/Clerk + hashing server-side)** — el Sprint 12 ya movió la tabla de usuarios a Postgres, y el Sprint 14 agregó `User.role` (`USER`/`ADMIN`); falta migrar el hashing (sigue siendo SHA-256 client-side) y la sesión (sigue en `localStorage`) a un backend real. Esto habilita proteger `/admin/*` con middleware server-side en vez de solo client-side — ver [ADMIN_PANEL.md](./ADMIN_PANEL.md).
- **Borrar `lib/placeholder-data.ts`** — el Sprint 13 migró el catálogo de lectura a Postgres, pero `lib/placeholder-data.ts` sigue vivo como resolución síncrona en cliente (carrito, wishlist en `/favoritos`); eliminarlo del todo exige convertir esa resolución en un fetch async o un Context de catálogo con caché — ver [ARCHITECTURE.md](./ARCHITECTURE.md#catálogo-en-postgres-pero-libplaceholder-datats-sigue-vivo-decisión-de-diseño-sprint-13).
- ~~Integrar Cloudinary~~ para imágenes de producto — ✅ hecho y verificado end-to-end (Sprint 15); las 20 imágenes sembradas desde Unsplash siguen intactas, Cloudinary aplica a las subidas nuevas desde el panel (ver [SPRINT-15](./sprints/SPRINT-15.md)).
- **Fusionar carrito/wishlist de invitado a cuenta al iniciar sesión** — hoy ninguno de los dos se asocia a `User` al hacer login (ver [ARCHITECTURE.md](./ARCHITECTURE.md)).
- **Búsqueda full-text real** — `catalogRepository.search` usa `contains`/`ILIKE` con ranking simple desde el Sprint 17 (antes sin ranking ni límite); con más catálogo conviene `pg_trgm` + índice GIN.
- **Envío real de campañas de newsletter** — el Sprint 17 construyó la persistencia (suscriptores + campañas) y la gestión desde el panel, pero sin proveedor de email externo (instrucción explícita de no usar servicios que requieran credenciales) no se dispara ningún email real; "enviada" solo registra una fecha.
- **`lastModified` por producto/post en el sitemap** — `app/sitemap.ts` (reescrito en el Sprint 17) no expone `updatedAt` porque `catalogRepository.listSlugs()`/`blogRepository.listSlugs()` no lo devuelven hoy.
- **Auditoría de accesibilidad AA completa** — el Sprint 17 agregó skip link y mantuvo la cobertura existente de `aria-label`, pero no corrió una auditoría formal (axe/Lighthouse CI) de todo el sitio.
- **Completar el Panel Administrativo** — los Sprints 14/15 construyeron productos (con imágenes vía Cloudinary), categorías (rename), inventario, pedidos, usuarios y dashboard, con buscador y paginación; falta CRUD completo de categorías (exige rutas dinámicas), buscador/paginación server-side si el volumen crece mucho más, y una entrada visible en el Navbar para administradores — ver [ADMIN_PANEL.md](./ADMIN_PANEL.md).
- **Testing automatizado y CI/CD** — no existe ninguno hoy.
- **Primer despliegue** — ver checklist en [DEPLOYMENT.md](./DEPLOYMENT.md).
- **Recuperar la animación de salida de los modales** (carrito, Quick View, menú móvil) — se sacrificó en el Sprint 7 al corregir un bug donde no cerraban; investigar la causa raíz en Headless UI v2 + React 19, o migrar a la API de transición nativa (`transition` + atributos `data-*`) recomendada actualmente.

## Reglas de trabajo vigentes

- No romper componentes existentes.
- No usar soluciones temporales que después haya que rehacer — toda pieza nueva de persistencia sigue el patrón adaptador desde el Sprint 6.
- Cada sprint se verifica con `tsc --noEmit`, `npm run build` y pruebas manuales en navegador antes de darse por terminado.
- La documentación (`docs/`) se actualiza al cierre de cada sprint, no después.

## Documentos relacionados

- [PROJECT.md](./PROJECT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [ADMIN_PANEL.md](./ADMIN_PANEL.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
