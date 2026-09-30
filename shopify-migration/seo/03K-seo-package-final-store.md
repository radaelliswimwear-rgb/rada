# 03K — Paquete SEO para la tienda final (lo que ya está listo y lo que se asume)

*Consolida `seo/03E-seo-offline-review.md`, `seo/03E-redirect-plan.md`, `seo/03F-seo-final-validation.md`, `theme/03E-seo-technical-audit.md` y `launch/03G-current-site-baseline.md` § 12 con lo que 03K agregó al theme (RC1.10). Etiquetas: `[MEDIDO]` = medido en vivo en la Dev Store o en el sitio actual; `[TEST]` = probado offline con el arnés; `[ASUMIDO]` = regla de Shopify que se comprueba en la tienda final; `NOT_VERIFIED` = sin comprobar.*

## 1. Lo que 03K dejó implementado en el theme (RC1.10)

| Elemento | Antes (RC1.9) | Ahora (RC1.10) | Evidencia |
|---|---|---|---|
| `og:type` | no se emitía | `website`; `product` en la ficha | `[MEDIDO]` ficha en la Dev Store: `product`; `[TEST]` |
| `twitter:title`, `twitter:description`, `twitter:image` | solo `twitter:card` | los tres, iguales a `og:*` | `[MEDIDO]` `twitter:title` y `twitter:image` = `og:image` en la ficha; `[TEST]` |
| `og:image` | `https:` + `image_url`. En la Dev Store `image_url` **ya devuelve `https://…`**, así que la ficha habría emitido `https:https://…` | Solo antepone `https:` si falta el protocolo; respaldo: imagen de la página → ajuste **Imagen para compartir** → logo; sin ninguna, no se emite (nunca inventada) | `[MEDIDO]` `og:image` de la ficha empieza por un único `https://`; `[TEST]` mutante 70 |
| JSON-LD de la Home | ninguno | `Organization` (nombre, url, logo y descripción **solo si existen**, `sameAs` con Instagram, Facebook y TikTok) + `WebSite` con `SearchAction` a `/search?q={search_term_string}` | `[MEDIDO]` 2 bloques en la Home de la Dev Store; `[TEST]` 7 pruebas y mutantes 66–75 |
| JSON-LD de la ficha | `ProductGroup` + `BreadcrumbList` | sin cambios | `[MEDIDO]` |
| Orden de encabezados de colecciones y búsqueda | saltaba de `h1` a `h3` con los filtros colapsados | `h2` «Productos» visualmente oculto | `[MEDIDO]` 12 combinaciones con el salto antes; 0 después |

**Decisión de diseño:** el `Organization` y el `WebSite` van solo en la Home (recomendación de Google). El sitio actual los repite en todas las páginas por su layout; no aporta nada y no se replica.

## 2. Valores que salen de datos de la dueña (no se inventan)

- **Título y meta descripción de la Home:** propuestos, tal cual el sitio actual, en `seo/03K-home-seo-values.json` (`PROPOSED_FROM_CURRENT_SITE`); falta el sí de la dueña y cargarlos en Tienda online > Preferencias (escritura de Admin en la tienda final).
- **Imagen para compartir y logo:** ajustes `social_share_image` y `logo` del theme; dependen de A4 (descarga de los archivos). Con ellos se activan `og:image`, `twitter:image` y el `logo` del JSON-LD.
- **Descripción del `Organization`:** sale de `shop.description` (la misma meta descripción de Preferencias).
- **Sufijo del `<title>`** (HP-23): el theme agrega « – <nombre de la tienda>» a los títulos que no contengan el nombre; con la Home como «Trajes de baño de diseño en Colombia» saldría con el sufijo. Es aceptable; la excepción es un cambio de una línea si la dueña la pide.

## 3. Redirecciones y rutas heredadas

- **51 redirecciones** para la tienda final: `seo/shopify-redirects-import-final-store.csv` = las 47 validadas (`seo/shopify-redirects-import.csv`) + las 4 legales (`seo/03K-legal-redirects.csv`: `/envios`, `/terminos`, `/privacidad`, `/cookies` → `/pages/*`).
- **Validadores:** `node seo/validate-redirects.mjs` = PASS (14 controles, 47 redirecciones, 102 URLs clasificadas en 6 clases); `node launch/tools/03k-content-links-check.mjs` = 9/9 (incluye: 51 orígenes únicos, sin cadenas, todo destino existe en la tienda final).
- **Clasificación de rutas heredadas** (47 del inventario + rutas de `app/` y `public/` del sitio actual): 1 se conserva exacta, 4 las normaliza Shopify, 47 llevan redirección, 34 no se migran a propósito (6 del inventario y 28 rutas internas del sitio actual), 4 son las legales pendientes (ahora con fila en el CSV final), 12 no necesitan redirección; total 102.
- **Rutas del sitio actual que dan 200 y no se migran** (`/accesorios`, `/hombre`, `/mujer`, `/ninos`, `/calzado`, blog): decisión de la dueña ya documentada en `launch/03G-current-site-baseline.md` (B-09, B-10).

## 4. `robots.txt` y sitemap (supuestos para la tienda final)

- **`robots.txt`:** lo genera Shopify (no hay `robots.txt.liquid`); bloquea `/cart`, `/checkout`, las combinaciones de `sort_by` y de filtros y `preview_theme_id` `[MEDIDO en la Dev Store, 3.642 bytes]`. **No** bloquea `/search`: el `noindex` sale del theme (`layout/theme.liquid`) `[MEDIDO]`.
- **`noindex`:** búsqueda y favoritos (`noindex, nofollow`) y 404 (`noindex, follow`), igual que el sitio actual `[MEDIDO][TEST]`.
- **`/policies/*`:** Shopify las bloquea por defecto `[ASUMIDO, shopify.dev]`; por eso las 4 legales nuevas van como **páginas** `/pages/*` (indexables), como hoy en el sitio actual (`theme/03F-legal-owner-runbook.md` § 4.2).
- **`sitemap.xml`:** lo genera Shopify e incluye productos, colecciones, páginas y blogs `[MEDIDO: índice con `sitemap_products`, `collections`, `pages`, `blogs`]`. La colección de apoyo `/collections/destacados` sería indexable (decisión menor de la dueña, `theme/03E-seo-technical-audit.md` § 4.4).
- **Dev Store con contraseña:** los buscadores no la leen; **nada** de lo medido allí (indexación, sitemap, Rich Results) es evidencia de producción. Se vuelve a medir en la tienda final ya pública (P12 y P15 del runbook).

## 5. Qué se comprueba en la tienda final (una sola vez, ya pública)

1. `curl -I` de los 51 orígenes: 301 al destino y destino 200.
2. `robots.txt` y `sitemap.xml` con el dominio final; `noindex` en búsqueda, favoritos y 404.
3. Herramienta de resultados enriquecidos de Google sobre la Home (Organization, WebSite) y una ficha (Product, BreadcrumbList) `NOT_VERIFIED` hasta entonces.
4. Título, meta descripción y `og:*` de la Home igual a `seo/03K-home-seo-values.json` una vez confirmado por la dueña.
5. Search Console: propiedad del dominio y envío del sitemap (acción de la dueña, con su cuenta de Google).
