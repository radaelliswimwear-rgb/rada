# Sprint 1 — Home premium

## Objetivo

Reemplazar la Home genérica del template por un landing premium de una marca de ropa moderna, sin conectar Shopify todavía.

## Qué se implementó

- **Navbar** moderna, sticky, con logo temporal (texto en ese momento, reemplazado por imagen en el rebranding), enlaces (Inicio/Hombre/Mujer/Colecciones/Contacto), buscador, cuenta y carrito — estos últimos como placeholders con toast "próximamente", ya que Shopify no estaba conectado.
- **Hero** fullscreen con arte de fondo en gradiente (sin imágenes externas en esta etapa), título, subtítulo y CTA "Comprar ahora".
- **Categorías destacadas** (versión inicial, 3 categorías con bloques de gradiente — reemplazada en el Sprint 3 por imágenes reales y 6 categorías).
- **Productos destacados**: 8 productos de ejemplo, tarjetas con hover.
- **Banner promocional** y **Newsletter** (funcional del lado del cliente: valida email, muestra confirmación, sin backend real).
- **Footer** moderno con columnas de navegación.

## Decisiones técnicas

- Se creó `lib/placeholder-data.ts` como fuente de datos de ejemplo — origen del track de datos que se mantiene activo hasta hoy (ver [ARCHITECTURE.md](../ARCHITECTURE.md)).
- Todo lo que requería Shopify real (carrito, cuenta, búsqueda) quedó como toast "próximamente" en vez de conectarse a medias — evitó errores en runtime.
- Animaciones definidas vía `@theme`/`@keyframes` de Tailwind 4 en `app/globals.css`.

## Verificación

`npm run build` exitoso, revisado en navegador (desktop y mobile, claro y oscuro).

## Qué quedó para después

- Categorías reales con imágenes → Sprint 3.
- Catálogo navegable → Sprint 2.
- Ficha de producto → Sprint 4.
- Carrito y wishlist reales → Sprints 5 y 6.
