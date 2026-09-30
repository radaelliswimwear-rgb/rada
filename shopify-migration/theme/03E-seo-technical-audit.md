# 03E — Auditoría SEO técnica (tienda real + revisión offline)

- **Mediciones en vivo:** 2026-09-29, 11:58–13:50 (Bogotá), Development Store con el theme Radaelli en preview.
- **Revisión offline del código y las fuentes:** `seo/03E-seo-offline-review.md` (con verificación adversarial).
- **Paquete de redirects:** `seo/03E-redirect-plan.md` + `seo/shopify-redirects-import.csv`.

## 1. Resultado por página (vivo)

| URL | Canonical | robots | hreflang | JSON-LD | Nota |
|---|---|---|---|---|---|
| `/` | `/` | — | x-default, es, en | — | Sin meta description (la tienda no tiene una cargada) |
| `/collections/oasis-natural` | propia | — | ✓ | — | Descripción = la de la colección |
| `/collections/oasis-natural?sort_by=…` | **sin parámetros** | — | ✓ | — | Correcto: orden y filtros no generan duplicados |
| `/products/brisa-natural-beige` | propia | — | ✓ | ProductGroup + BreadcrumbList | — |
| `/collections/oasis-natural/products/…` | **`/products/…`** | — | ✓ | idem | Correcto: el producto dentro de una colección no duplica |
| `/search?q=…` | propia | **noindex, nofollow (RC1.5)** | ✓ | — | Antes indexable; ver § 2 |
| `/pages/favoritos?view=wishlist` | `/pages/favoritos` | **noindex, nofollow (RC1.5)** | ✓ | — | Página personal, igual que el real |
| `/pages/garantia` | propia | — | ✓ | — | Meta description autogenerada "CoberturaTodos…" (§ 3) |
| `/policies/refund-policy` | propia | — | ✓ | — | — |
| `/en/products/…` | `/en/products/…` | — | ✓ | ✓ | Canonical propio por idioma + hreflang |
| `/collections/destacados` | propia | — | ✓ | — | Colección de apoyo de la Home. Ver § 4 |

- **`robots.txt` (Shopify por defecto):**
  - 2 user-agents;
  - bloquea `/cart`, `/checkout` y las combinaciones de `sort_by` y de filtros, además de `preview_theme_id`;
  - **no** bloquea `/search`, así que el `noindex` tiene que venir del theme;
  - el propio robots.txt indica la contraseña del entorno de desarrollo.
- **`/sitemap.xml`:**
  - responde 200 con un índice (`sitemap_products`, `collections`, `pages`, `blogs`, `/en/…` y `sitemap_agentic_discovery`);
  - con la tienda protegida por contraseña los buscadores no lo leen; se evalúa al publicar.

## 2. Corrección aplicada: noindex (RC1.5)

- **Paridad con el real**, que lo fija con un test (`seo-noindex-coverage.test.ts`):
  - `app/buscar/page.tsx` y `app/favoritos/page.tsx` → `index:false, follow:false`;
  - `app/not-found.tsx` → `index:false, follow:true`.
- **Theme** (`layout/theme.liquid`):
  - búsqueda y plantilla `page.wishlist` / `?view=wishlist` → `noindex, nofollow`;
  - 404 → `noindex, follow`.
- **Verificado en vivo:** búsqueda y favoritos con noindex; colección, ficha y home sin robots.
- **Pruebas:** test offline "P SEO" y mutantes 22–23, detectados.

## 3. Otras correcciones de RC1.5 con impacto SEO

- **`<title>` y `og:title` escapados** (`escape_once`, SEC-02):
  - con `&`, `<b>`, comillas y `>` se escapan una sola vez (medido en vivo);
  - con una entrada que ya parece HTML (`"><b …>`), el `page_title` de Shopify llega con `&amp;gt;` y el título visible muestra `&gt;`, **igual que antes del cambio** (rareza de Shopify, no regresión, sin inyección).
- **Colección filtrada por etiqueta:**
  - el título decía "tagged" en inglés;
  - ahora usa `general.meta.tags`: "Etiquetas: MOSTAZA" en `/collections/espuma-de-ola/mostaza`, verificado en vivo.

## 4. Hallazgos pendientes (no son del theme o requieren decisión)

1. **Meta descriptions autogeneradas:** Shopify arma la descripción de una página sin descripción SEO pegando el contenido sin espacios ("CoberturaTodos los productos…").
   - Arreglo sin inventar copy: cargar como descripción SEO la primera oración verbatim de cada página, o dejarlo para la carga de legales.
   - Es una escritura en el Admin, owner o 03F.
2. **Home sin meta description:** en Shopify va en Tienda online > Preferencias. Se decide con el copy de la dueña (no se inventa).
3. **Nombre de la tienda** "Radaelli Swimwear Dev" en todos los títulos: cambia al pasar a la tienda comercial.
4. **`/collections/destacados`:** es navegable e indexable al publicar. Opción: excluirla con la plantilla o dejarla (decisión menor). `product.collections` podría mostrarla en la miga de 7 productos; no se midió un orden garantizado.
5. **Redirects (`seo/shopify-redirects-import.csv`):**
   - 47 filas listas para importar: 36 URLs del inventario + variantes; validador PASS en 14 controles;
   - 4 legales quedan "legal redirect pending" hasta crear sus páginas;
   - importar = escritura en la tienda (Tienda online > Navegación > Redirecciones de URL > Importar), **owner-only**, y se prueba con curl después;
   - la sensibilidad a mayúsculas y la conservación de query de "Redirect from" no están documentadas (NOT_VERIFIED).
6. **Crawlers y mercado:** con el mercado principal en EE. UU. (C1 del checkout), no se verificó a qué mercado resuelve Googlebot. Revisar tras el cambio de mercado.
