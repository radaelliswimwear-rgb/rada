# Handoff — estado del proyecto al cierre del Sprint 17

## Dónde quedó el proyecto

Sprint 17 (Marketing e Inteligencia: SEO técnico, blog, newsletter, cupones, recomendaciones, vistos recientemente, búsqueda mejorada, accesibilidad) cerrado: `npx tsc --noEmit` limpio, `npm run build` limpio (63/63 páginas). Detalle completo en [sprints/SPRINT-17.md](./sprints/SPRINT-17.md) (y [SPRINT-14](./sprints/SPRINT-14.md)/[SPRINT-15](./sprints/SPRINT-15.md)/[SPRINT-16](./sprints/SPRINT-16.md) para Panel Administrativo, Cloudinary y Wompi).

Resumen de lo que hay hoy:

- Tienda completa (catálogo, carrito, wishlist, cuenta, checkout con cupones, pagos) sobre Postgres/Prisma.
- Panel Administrativo en `/admin/*` — dashboard, productos (imágenes vía Cloudinary), categorías, inventario, pedidos, usuarios, **blog, newsletter/campañas y cupones (Sprint 17)**.
- **SEO real**: `/sitemap.xml` y `/robots.txt` funcionando de verdad por primera vez (antes el sitemap heredado del template devolvía 500 siempre — dependía de Shopify, nunca configurado); metadata dinámica, Open Graph, Twitter Cards, canonical URLs y JSON-LD (`Organization`/`WebSite`/`Product`/`Article`) en las páginas clave.
- **Blog** en `/blog` con 3 posts de ejemplo, gestionado desde `/admin/blog`.
- **Newsletter** real (persistida en Postgres) con gestión de campañas desde el panel — sin envío real de email (no hay proveedor externo configurado, por instrucción explícita).
- **Cupones de descuento** funcionando en el checkout (cupón de ejemplo `LAGO10`, 10%), gestionados desde `/admin/cupones`.
- **Recomendaciones**: relacionados con una heurística de puntaje (color/precio/stock) en vez de orden arbitrario; sección "Recomendado para vos" en Home basada en el historial de vistos recientemente.
- **Vistos recientemente**: historial 100% client-side (`localStorage`) visible en cada ficha de producto.
- **Búsqueda mejorada**: ranking por relevancia + límite de resultados, y autocompletado con debounce en el buscador del Navbar.
- **Accesibilidad**: skip link agregado; el resto del sitio ya tenía cobertura razonable de `aria-label`/`sr-only` (sin auditoría formal AA completa).
- Seed (`npm run db:seed`) deja `test@lago.com` como `ADMIN`, `demo@lago.com` como `USER` (contraseña `lago1234` ambos), 3 posts de blog y el cupón `LAGO10`.

## Pendientes de sprints anteriores (sin cambios en este sprint)

- **Wompi real sin verificar en vivo** — código completo (Sprint 16) pero sin credenciales cargadas en este entorno; la tienda sigue con Stripe simulado activo por defecto.
- **Checkout de invitado falla contra Postgres real** — falta sembrar una fila `User` con `id: "guest"` (hallazgo del Sprint 16).
- **Sesión server-side (Auth.js/Clerk)** — toda la autenticación sigue siendo client-side sobre `localStorage`.

## Cómo levantar el proyecto

```bash
npm install --legacy-peer-deps
npx prisma migrate dev   # o migrate deploy si la base ya existe
npm run db:seed
npm run dev              # http://localhost:3000
```

`DATABASE_URL` debe apuntar a un Postgres real (ver `.env.example`); en este entorno hay una base Neon ya configurada en `.env`. `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` ya apuntan a una cuenta de Cloudinary real y verificada. Las variables `WOMPI_*` están documentadas en `.env.example` pero sin valores.

## Pendientes conocidos (no bloquean, quedan para sprints futuros)

- Envío real de campañas de newsletter (requiere proveedor externo con credenciales).
- `lastModified` por producto/post en el sitemap.
- Búsqueda full-text real (`pg_trgm`/`tsvector`) si el catálogo crece mucho más.
- Auditoría de accesibilidad AA completa (herramientas tipo axe/Lighthouse CI).
- Confirmar credenciales reales de Wompi y verificar una transacción + webhook de punta a punta.
- Sembrar una fila `User` con `id: "guest"` para que el checkout de invitado funcione contra Postgres real.
- Sesión server-side (Auth.js/Clerk).
- Buscador/paginación del panel (productos/pedidos/usuarios/inventario) son client-side; migrar a `LIMIT`/`OFFSET` en Prisma si el volumen crece mucho.
- CRUD completo de categorías (crear/eliminar) — hoy solo se puede renombrar.
- Fusión de carrito/wishlist de invitado a la cuenta al iniciar sesión.
- Testing automatizado y CI/CD.
- Decisión de fondo sin cerrar: ¿Shopify, backend propio, o híbrido? (ver [ROADMAP.md](./ROADMAP.md)).

## Por dónde seguir (Sprint 18, sugerido)

Ver la sección "Por hacer" de [ROADMAP.md](./ROADMAP.md) para el listado completo sin priorizar. No hay un Sprint 18 decidido todavía — se elige al arrancar la próxima sesión de trabajo.

## Documentos relacionados

- [PROJECT.md](./PROJECT.md) — visión general y stack.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — patrones y decisiones técnicas.
- [ADMIN_PANEL.md](./ADMIN_PANEL.md) — estado y alcance del panel.
- [ROADMAP.md](./ROADMAP.md) — historial de sprints y pendientes.
- [sprints/SPRINT-14.md](./sprints/SPRINT-14.md) — Panel Administrativo base.
- [sprints/SPRINT-15.md](./sprints/SPRINT-15.md) — Cloudinary.
- [sprints/SPRINT-16.md](./sprints/SPRINT-16.md) — Wompi/pagos.
- [sprints/SPRINT-17.md](./sprints/SPRINT-17.md) — ficha completa de este sprint (Marketing e Inteligencia).
