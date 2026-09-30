# 03F — Validación SEO final (Development Store, theme RC1.7)

Medido en vivo el 2026-09-29, ≈ 14:45–14:52 (Bogotá), con `fetch` desde el storefront y el theme Radaelli en preview.

## 1. Resultado

| Área | Resultado |
|---|---|
| **Redirecciones** (47) | ✅ Importadas y probadas: 38 al destino exacto (200) + 9 de cuenta con redirección confirmada. Ver `seo/03F-redirect-import-result.md` |
| **Redirecciones: forma** | ✅ Validador PASS (14 controles, 0 errores, 102 URLs clasificadas). 0 bucles. **No distingue mayúsculas, conserva el query y acepta barra final** |
| **Productos** (29) | ✅ 29/29: 200; canonical propio; hreflang `x-default, es, en`; JSON-LD `ProductGroup + BreadcrumbList`; 1 h1; meta description presente (viene de la descripción del producto); sin `noindex` |
| **Colecciones** (4 + Destacados) | ✅ 200; canonical propio; 1 h1; sin `noindex`. Las 4 colecciones con descripción real; "Destacados" sin descripción (es de apoyo) |
| **URLs de producto y colección** | ✅ Con `?sort_by=…`, filtros o `/collections/<c>/products/<p>` el canonical apunta a la URL base (sin duplicados) |
| **Legales** | ✅ `/policies/refund-policy` y `/pages/garantia`: 200, canonical propio, indexables. `/envios`, `/terminos`, `/privacidad` y `/cookies`: **pendientes** (4 filas de redirect más al crearlas) |
| **`noindex`** | ✅ **Búsqueda, favoritos (URL simple y `?view=wishlist`) y 404**; producto, colección, garantía, reembolso y home indexables. **Corregido en 03F (RC1.7):** `/pages/favoritos` sin `?view` era indexable y estaba en el sitemap |
| **hreflang / `/en`** | ✅ `x-default, es, en` en todas; `/en/…` con canonical propio; título y JSON-LD también en `/en` |
| **Sitemap** | ✅ `sitemap.xml` (200): 9 sitemaps hijos (productos, colecciones, páginas, blogs, idioma `/en`, `agentic_discovery`). **29/29 productos incluidos, 0 faltantes** |
| **`robots.txt`** | ✅ Shopify por defecto; bloquea `/cart`, `/checkout`, combinaciones de filtros y `sort_by`, y `preview_theme_id`. `/search` no se bloquea (por eso el `noindex` sale del theme) |
| **Meta descriptions inventadas** | ✅ Ninguna: donde no hay texto real queda sin descripción |

## 2. Hallazgos abiertos (no son bugs del theme)

| # | Hallazgo | Impacto | Acción |
|---|---|---|---|
| 1 | **Sitemap con páginas que no deberían indexarse:** `/pages/contact` (en inglés) y `/pages/data-sharing-opt-out` (creadas por Shopify), y `/pages/favoritos` (ahora `noindex`, pero Shopify la lista igual) | Bajo | Antes de publicar: decidir si se despublican o se completan. **Owner** |
| 2 | **`/collections/frontpage`** ("Home page", 0 productos) está en el sitemap y es indexable | Bajo | Despublicar la colección de la Tienda online, o dejarla. **Owner** (escritura de catálogo) |
| 3 | **Home sin meta description** | Medio | Copy de la dueña, en Tienda online > Preferencias. No se inventa |
| 4 | **Descripciones SEO autogeneradas** de las páginas sin descripción propia (`/pages/garantia`: "CoberturaTodos…") | Bajo | Cargar la primera oración verbatim de cada página, al cargar los legales |
| 5 | **Nombre "Radaelli Swimwear Dev"** en todos los títulos | Bajo | Cambia con la tienda comercial |
| 6 | **Con el mercado principal en EE. UU. (C1)** no se verificó a qué mercado resuelve Googlebot | Medio | Revisar después de resolver C1 |
| 7 | **Código HTTP de las redirecciones** (`fetch` no lo expone) | Bajo | `curl -I` al publicar (Shopify documenta 301) |
