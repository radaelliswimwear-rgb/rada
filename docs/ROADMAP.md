# Roadmap

## Hecho

| Sprint | Qué se construyó | Ficha |
|---|---|---|
| 1 | Home premium (Hero, categorías, productos, banner, newsletter, footer) | [SPRINT-01](./sprints/SPRINT-01.md) |
| 2 | Páginas de catálogo `/hombre`, `/mujer`, `/accesorios` con filtros y orden | [SPRINT-02](./sprints/SPRINT-02.md) |
| 3 | Sección de categorías con imágenes reales (Unsplash) | [SPRINT-03](./sprints/SPRINT-03.md) |
| — | Rebranding completo a LAGO — Laura Gómez (logo, paleta, tipografía) | ver [SPRINT-04](./sprints/SPRINT-04.md) |
| 4 | Ficha de producto individual (`/producto/[slug]`) | [SPRINT-04](./sprints/SPRINT-04.md) |
| 4.5 | Experiencia premium de catálogo (Quick View, wishlist visual, paginación, Framer Motion) | ver [SPRINT-04](./sprints/SPRINT-04.md) |
| 5 | Carrito funcional (`localStorage`) | [SPRINT-05](./sprints/SPRINT-05.md) |
| 6 | Wishlist con arquitectura de datos enterprise-ready (`/favoritos`) | [SPRINT-06](./sprints/SPRINT-06.md) |
| 7 | Búsqueda funcional (`/buscar`) + fix crítico: los modales no cerraban | [SPRINT-07](./sprints/SPRINT-07.md) |
| 8 | Carrito alineado al patrón adaptador (`lib/cart/`) | [SPRINT-08](./sprints/SPRINT-08.md) |
| 9 | Autenticación + área privada "Mi Cuenta" (login, registro, recuperar contraseña, perfil, direcciones, pedidos) | [SPRINT-09](./sprints/SPRINT-09.md) |

## Decisión pendiente: ¿Shopify, backend propio, o ambos?

Este es el fork más importante del roadmap y todavía no está resuelto:

- **Opción A — Conectar Shopify.** El track dormido (`lib/shopify/*`, `components/cart/*`, `components/product/*`) ya está construido y probado arquitectónicamente. Conectar credenciales activaría catálogo, carrito, checkout y menús reales sin escribir código nuevo de backend.
- **Opción B — Backend propio (Postgres + Prisma + Cloudinary + Admin Panel).** Es la dirección que se estableció como estándar a partir del Sprint 6: cada nueva pieza de datos (wishlist, y a futuro carrito/catálogo) se construye detrás de un adaptador reemplazable, preparada para este backend. Da control total (panel propio, lógica de negocio propia) a costa de tener que construir mucho más.
- **Opción C — Híbrido.** Shopify para catálogo/inventario/checkout (fuerte en eso), Postgres propio para lo que Shopify no resuelve bien out-of-the-box (wishlist enriquecida, contenido editorial, analítica propia, panel administrativo a medida). Es un patrón común en ecommerce headless de nivel enterprise.

Ninguna decisión de código tomada hasta ahora cierra la puerta a ninguna de las tres — es intencional (ver [ARCHITECTURE.md](./ARCHITECTURE.md)).

## Por hacer (sin ordenar por prioridad todavía)

- **Checkout real** — depende de la decisión Shopify/propio de arriba.
- **Autenticación de producción (Auth.js/Clerk + hashing server-side)** — el Sprint 9 ya construyó el sistema completo (login, registro, recuperación, sesión, rutas protegidas) a nivel simulado/`localStorage`; falta conectarlo a un backend real. Esto desbloquea acceso con roles para el panel administrativo — ver [ADMIN_PANEL.md](./ADMIN_PANEL.md).
- **Conectar Postgres + Prisma** siguiendo la propuesta de esquema en [DATABASE.md](./DATABASE.md), si se elige la Opción B o C.
- **Integrar Cloudinary** para imágenes de producto, reemplazando las URLs de Unsplash actuales.
- **Construir el Panel Administrativo** — ver alcance propuesto en [ADMIN_PANEL.md](./ADMIN_PANEL.md).
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
