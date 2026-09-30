# Notas de SEO — inventario de URLs (sección 8)

Complementa `current-url-inventory.csv`. El análisis completo de estrategia SEO (redirects, riesgo de ranking, Search Console) ya existe en `docs/shopify/seo-analytics.md` de la auditoría de viabilidad previa — este archivo no lo repite, solo cubre lo específico del inventario de esta fase.

## Qué sí se pudo completar sin acceso a datos reales

- **Todas las rutas ESTRUCTURALES** (home, colecciones activas, colecciones archivadas, blog, páginas legales, búsqueda) — estas vienen de `app/sitemap.ts` y del árbol de rutas de `app/`, no de la base de datos. Están en `current-url-inventory.csv` con su `proposed_shopify_url` ya propuesta.
- El patrón exacto de URL de producto (`/producto/<slug>` → `/products/<handle>`) y de blog (`/blog/<slug>` → `/blogs/<blog>/<slug>`).

## Qué falta (requiere `MANUAL_STEP_REQUIRED.md`)

- La lista real de slugs de producto — hoy el CSV tiene una sola fila de PLANTILLA (`<slug>`) para el patrón de producto, no una fila por cada uno de los productos reales.
- Confirmar contra Google Search Console cuáles de estas URLs están efectivamente indexadas hoy (fuente de verdad real de qué se está posicionando) — esto no se puede derivar del código, necesita acceso a la cuenta de Search Console de Daniela.

## Decisión pendiente marcada en el CSV

Las 4 colecciones archivadas (`/hombre`, `/mujer`, `/ninos`, `/calzado`) están marcadas `REQUIERE_DECISION` en vez de `SI`/`NO` en `redirect_required`: siguen siendo rutas reales y accesibles hoy (confirmado en el código, `app/hombre`, `app/mujer`, etc. existen), pero fueron deliberadamente excluidas del sitemap tras el rebrand. Si tienen tráfico/backlinks reales vale la pena redirigirlas; si no, se pueden dejar sin redirect. Esto no es una decisión técnica — es una decisión de negocio que le corresponde a Daniela, con datos de Search Console/Analytics en mano.
