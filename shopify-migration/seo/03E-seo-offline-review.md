# 03E — Revisión técnica de SEO (offline)

- **Fecha:** 2026-09-29.
- **Alcance:** theme Radaelli (`theme-src/`, RC1.4 + cambios 03E locales **no pusheados**), sitio Next.js (`APP` = `commerce-main/`) y hechos medidos hoy en la Dev Store por el orquestador.
- **Método:** sin navegador ni acceso a la tienda. Lo que no se pudo medir queda **NOT_VERIFIED**.

## 0. Resumen

| Tema | Estado | Qué falta |
|---|---|---|
| Canonical | **OK** (medido en vivo) | Dominio primario = apex al lanzar (§ 1) |
| Títulos | Se generan bien, pero dicen **"Radaelli Swimwear Dev"** | Renombrar la tienda y cargar el título de la Home en Preferencias (owner) |
| Meta descriptions | **Defectuosas:** Shopify las autogenera pegando título y párrafo (`CoberturaTodos…`) | Cargar la descripción SEO con el texto verbatim del sitio viejo (§ 2.3) |
| noindex | Búsqueda sin noindex en vivo. **Corregido localmente** (búsqueda, favoritos, 404), falta el push | Pushear 03E y re-medir. `seo.hidden` en Favoritos (§ 3) |
| hreflang `/en` | Shopify lo genera solo; el theme no duplica | Decidir si `/en` se publica sin traducir (§ 4) |
| robots.txt / sitemap | Por defecto de Shopify (no hay `robots.txt.liquid`). Según shopify.dev, bloquear `/policies/` es regla por defecto | Decidir si las legales deben ser indexables. Verificar en vivo `/policies/` y qué páginas entran al sitemap (§ 5) |
| Datos estructurados | Producto OK (ProductGroup + BreadcrumbList). **Home sin nada** | Organization + WebSite en la Home (propuesta, § 6). Orden C2 → C1 por disponibilidad |
| Favicon / imagen social | **No configurados** en el theme | Subir desde el repo (owner, § 7) |
| Bugs del theme | **1 real, severidad baja** (§ 9) | — |

## 1. Canonical

- **En vivo:** los canonicals están bien (hecho medido hoy). El theme emite **uno solo**: `<link rel="canonical" href="{{ canonical_url }}">` (`theme-src/layout/theme.liquid:12`). `og:url` usa el mismo valor (`:46`).
- **Qué hace Shopify** ("Canonical URLs are set automatically on all pages", help.shopify.com/en/manual/markets/seo):
  - una ficha abierta dentro de una colección apunta a `/products/<handle>`;
  - `/en/...` apunta a sí misma.
- **Favoritos:** `?view=wishlist` apunta a `/pages/favoritos` (`theme/03B-store-foundation-report.md:294`). No afecta, porque la página es noindex (§ 3).
- **Sitio viejo:** canonicals absolutos en apex, por ejemplo `https://radaelliswimwear.com/producto/<slug>` (`APP/app/producto/[slug]/page.tsx:27`, `:32`).
  - Con los 301 de `seo/03E-redirect-plan.md`, Google consolida en `/products/<handle>`.
  - **Condición:** el dominio primario de Shopify tiene que ser el apex, para que el canonical nuevo quede en el mismo host y no sume un salto de dominio (plan § 5.4).
- **Pendiente de medir:** el canonical de una colección con filtros (`?filter.v.price.gte=…`) y con `?page=2`. Hoy no hay Search & Discovery, así que los únicos filtros son precio y disponibilidad.

## 2. Títulos y meta descriptions

### 2.1 De dónde sale cada valor

| Tipo | Sitio viejo | Shopify + theme |
|---|---|---|
| **Plantilla del `<title>`** | `%s \| Radaelli Swimwear` (`APP/app/layout.tsx:40`) | `{{ page_title }}` + ` – {{ shop.name }}` si no lo contiene ya (`theme-src/layout/theme.liquid:33-38`) |
| **Home** | "Trajes de baño de diseño en Colombia" + descripción propia (`APP/app/page.tsx:17-19`) | `page_title` / `page_description` = Preferencias de la tienda online (título y meta de la Home). Si están vacías, `page_title` = nombre de la tienda. Valor actual en Preferencias: **NOT_VERIFIED** |
| **Colección** | Título y descripción fijos por página (`APP/app/oasis-natural/page.tsx:6-8`, `aurora-viva/page.tsx:6-8`, `espuma-de-ola/page.tsx:6-7`, `salidas-de-bano/page.tsx:6-7`) | Título SEO o título de la colección. Descripción SEO o autogenerada desde la descripción de la colección. Descripciones cargadas en Shopify: **NOT_VERIFIED** |
| **Producto** | `product.name` + `product.description` completa (`APP/app/producto/[slug]/page.tsx:30-31`) | Título SEO o título del producto. Descripción SEO o **autogenerada** desde el HTML. La importación 03C no traía columnas SEO (`import/shopify-products-03c.csv:1`) |
| **Garantía** | "Política de garantía" + descripción propia (`APP/app/garantia/page.tsx:6-8`) | Página `/pages/garantia`: descripción **autogenerada = "CoberturaTodos los productos…"** (medido en vivo) |
| **Devoluciones** | "Política de devoluciones" + descripción propia (`APP/app/devoluciones/page.tsx:6-8`) | `/policies/refund-policy`: título nativo "Política de reembolso", no editable (`theme/03D-legal-policies-inventory.md:17`). Si la política admite descripción SEO: **NOT_VERIFIED** |
| **Búsqueda / Favoritos / 404** | "Buscar", "Favoritos", "Página no encontrada", todas noindex (`APP/app/buscar/page.tsx:10-12`, `APP/app/favoritos/page.tsx:6-8`, `APP/app/not-found.tsx:13-14`) | Títulos de Shopify y del theme, con noindex del theme (§ 3) |

### 2.2 "Radaelli Swimwear Dev" en todos los títulos (hasta el lanzamiento)

- `theme.liquid:37` agrega `shop.name` a cada título.
- `og:site_name` también lo usa (`:45`), igual que el `name`/`brand` que arme Shopify en sus datos estructurados.
- **No es un bug del theme:** es el nombre de la tienda de desarrollo.
- **Owner, al lanzar:**
  - Configuración > General > nombre de la tienda = "Radaelli Swimwear" (el `SITE_NAME` del sitio, `APP/lib/seo/site.ts:9`);
  - Preferencias > título de la Home = "Trajes de baño de diseño en Colombia" y meta = el texto de `APP/app/page.tsx:18-19`, **copiados verbatim**.
- **Cambio menor de formato:** el separador pasa de `|` a `–`. No afecta el posicionamiento.

### 2.3 Meta description autogenerada: título y párrafo quedan pegados

- **Evidencia en vivo:** en `/pages/garantia` la descripción empieza "CoberturaTodos…".
- **Causa:** el cuerpo es `<h2>Cobertura</h2><p>Todos los productos…` (`content/legal/garantia.html`). Al no haber descripción SEO, Shopify quita las etiquetas **sin** dejar espacio entre bloques.
- **Mismo mecanismo, esperado y NOT_VERIFIED en vivo:**
  - **los 29 productos:** su HTML es `<p>…líneas limpias.</p><ul><li>Escote profundo en V.</li>…` (`import/shopify-products-03c.csv`, columna Description). Se espera algo como "…líneas limpias.Escote profundo en V.Tirantes…";
  - **la política de reembolso:** `<h2>Cuándo aplica una devolución o cambio</h2><p>Aceptamos…` (`content/legal/devoluciones.html`).
- **No es un bug del theme:** `theme.liquid:8-10` imprime `page_description` con `escape`, como corresponde.
- **Arreglo recomendado:** es contenido. Sale de un owner o de una operación de catálogo autorizada, y no inventa texto: se copia la fuente existente.

  | Recurso | Descripción SEO (verbatim) | Fuente |
  |---|---|---|
  | `/pages/garantia` | "Garantía de 12 meses por defectos de fabricación o calidad de Radaelli Swimwear." | `APP/app/garantia/page.tsx:7-8` |
  | 4 colecciones | La `description` de cada `page.tsx` | `APP/app/<colección>/page.tsx:7-8` |
  | 29 productos | El **primer párrafo** de la descripción, sin las viñetas. Mide entre 92 y 143 caracteres en los 29: entra entero, no hay que recortarlo | `catalog/products-master.csv` (`seo_description` = descripción completa, que era la meta del sitio viejo, `APP/app/producto/[slug]/page.tsx:31`), igual a la columna Description del import |
  | Home | `HOME_DESCRIPTION` | `APP/app/page.tsx:18-19` |

- **Por qué no se toca el HTML:** meter espacios entre bloques del HTML no está garantizado que funcione, porque se desconoce el algoritmo de Shopify. El campo SEO sí lo reemplaza.

## 3. noindex

| Página | Sitio viejo | Shopify hoy (en vivo) | Theme 03E local (no pusheado) |
|---|---|---|---|
| Búsqueda `/search` | noindex, nofollow + Disallow (`APP/app/buscar/page.tsx:12`, `APP/app/robots.ts:34`) | **Sin noindex**, y el robots.txt de Shopify **ya no** bloquea `/search` (hecho medido) | `noindex, nofollow` si `template.name == 'search'` (`theme-src/layout/theme.liquid:23-24`) |
| Favoritos | noindex, nofollow + Disallow (`APP/app/favoritos/page.tsx:8`, `APP/app/robots.ts:29`) | Sin noindex | `noindex, nofollow` si `template.suffix == 'wishlist'` (`theme.liquid:23-24`). Funciona con `?view=wishlist` (hoy) y con la plantilla asignada (al publicar) |
| 404 | noindex, follow (`APP/app/not-found.tsx:14`) | HTTP 404 | `noindex, follow` (`theme.liquid:25-26`). Redundante con el 404, pero inocuo |
| Contraseña | — | — | `noindex` (`theme-src/layout/password.liquid:8`) |
| Cuenta | noindex + Disallow `/cuenta` | Vive en `shopify.com/<id>/account`, fuera del dominio | — |
| Checkout / carrito | Disallow `/checkout` | Nativo de Shopify | — |

- **Falta:**
  1. Pushear los cambios 03E del theme.
  2. Re-medir en el preview el `<meta name="robots">` de `/search?q=bikini`, `/pages/favoritos?view=wishlist` y una ruta 404.
- **Conflicto sitemap ↔ noindex:** `favoritos` es una página **visible** (03B:144), así que Shopify la mete en el sitemap aunque el theme la marque noindex. Search Console lo reportaría como "enviada pero con noindex".
  - **Arreglo (owner):** metafield `seo.hidden` = 1 en la página Favoritos.
  - Según help.shopify.com, oculta el recurso "from sitemaps, search engines, and your online store search".
  - No afecta el link del header, que apunta a la página directamente.

## 4. hreflang y `/en`

- **Quién genera los tags:** el theme no emite ningún `hreflang` (0 coincidencias en `theme-src/`). Es lo correcto: Shopify los genera solo, "based on your market and language configuration", con `x-default` al dominio primario, y el sitemap incluye las anotaciones hreflang (help.shopify.com/en/manual/markets/seo). Si el theme los emitiera, quedarían duplicados.
- **Estado de la tienda:**
  - español publicado y predeterminado del dominio (`/`), inglés en `/en` (`theme/03B-store-foundation-report.md:28`, `:77`);
  - idioma principal del Admin: todavía inglés (se cambia al publicar, 03B:30);
  - mercado principal: **Estados Unidos** (hecho medido).
- **Riesgo de contenido:**
  - solo está instalada Translate & Adapt y no hay traducciones de catálogo registradas;
  - `/en/...` sirve la interfaz en inglés con **títulos y descripciones en español**, en URLs nuevas que el sitio viejo nunca tuvo;
  - con hreflang bien puesto no es "duplicado penalizado", pero sí son páginas de poco valor que entran al sitemap.
- **Decisión de la dueña, antes del lanzamiento:**
  - **(a)** despublicar inglés: paridad exacta con el sitio viejo, que era solo español;
  - **(b)** mantenerlo y traducir el catálogo.
- **Re-medir los hreflang** (tags del `<head>` y del sitemap) **después** de pasar Colombia a mercado principal (03E C1): el código de región puede cambiar. Hoy: **NOT_VERIFIED**.

## 5. robots.txt y sitemap (valores por defecto)

- **robots.txt:**
  - `theme-src/templates/` no tiene `robots.txt.liquid`, así que rige el robots por defecto de Shopify. shopify.dev: "Shopify generates a default robots.txt file that works for most stores", y recomienda conservar sus reglas.
  - Hecho medido: ya no bloquea `/search`, así que el noindex tiene que salir del theme (§ 3).
  - **`/policies/` (corregido en la verificación adversarial):** shopify.dev muestra el bloqueo de `/policies/` como **regla por defecto**. Su ejemplo "Remove a default rule from an existing group" quita justamente esa regla. Sin `robots.txt.liquid`, se espera que la política de reembolso (destino de `/devoluciones`) **no se rastree**.
    - Opciones de la dueña: aceptarlo, quitar la regla con `robots.txt.liquid` (otra tarea) o usar `/pages/*` para las legales (plan § 5.5).
    - Confirmar en vivo al quitar la contraseña.
- **sitemap.xml:** misma ruta que el sitio viejo, así que en Search Console no cambia la URL que se envía. Lo genera Shopify. Contenido esperado:

  | Tipo | Qué entra | Observación |
  |---|---|---|
  | Productos | 29 | — |
  | Colecciones | oasis-natural, aurora-viva, espuma-de-ola, salidas-de-bano (0 productos, igual que en el sitemap viejo) y **destacados** | `destacados` es nueva: duplica productos de la Home, no es un problema |
  | Páginas visibles | `garantia`, `favoritos` (§ 3), `data-sharing-opt-out` (de Shopify) y **`contact`** | `contact` es la página por defecto de Shopify, **en inglés** (03B:159, :162), y no existía en el sitio viejo |
  | Blog | Sin blog migrado | — |

  **Owner:** ocultar `contact` con `seo.hidden` o darle contenido real (hoy NOT_AVAILABLE, `theme/03D-legal-policies-inventory.md:125`).
- **Salen del sitemap:**
  - URLs viejas con destino: `/producto/*`, las colecciones sin `/collections/` y `/devoluciones` (tienen 301);
  - URLs viejas sin destino: `/accesorios` y `/blog`. Estaban en el sitemap viejo (`APP/app/sitemap.ts:31`, `:36`) y darán 404: es esperado, y está decidido o pendiente en el plan § 4.
  - URLs legales pendientes: `/envios`, `/terminos`, `/privacidad` y `/cookies` también están en el sitemap viejo (`APP/app/sitemap.ts:39`, `:42-44`). Si el DNS se mueve antes de crear sus destinos, darán 404: crearlas es requisito previo del cutover (plan § 4.3).
- **Mientras haya contraseña**, los crawlers solo ven `/password` (noindex). No hay indexación prematura.

## 6. Datos estructurados

| Página | Sitio viejo | Theme Shopify |
|---|---|---|
| **Producto** | `Product` + `Offer` (COP, disponibilidad por stock) + `BreadcrumbList` (`APP/lib/seo/product-json-ld.ts:27-39`, `:59-69`) | `{{ product \| structured_data }}` = **ProductGroup** con variantes (`theme-src/sections/main-product.liquid:359-361`) + `BreadcrumbList` Inicio / colección / producto (`:362-389`). **Presente en vivo** |
| **Home** | `Organization` (name, url, logo, description) + `WebSite` con `SearchAction` (`APP/app/layout.tsx:67-86`, en todas las páginas) | **Ninguno** (hecho medido) |
| Colección / página | — | — |

**Brecha en la Home.** El `SearchAction` ya no hace falta: Google retiró el cuadro de búsqueda de sitelinks el 2024-11-21 (developers.google.com/search/blog/2024/10/sitelinks-search-box). `WebSite` sigue sirviendo para el nombre del sitio y `Organization` para el logo.

**Propuesta, NO aplicada** (no se edita `theme-src/` en esta tarea). Va en `layout/theme.liquid`, dentro de `<head>`, y no usa copy nuevo, solo objetos de la tienda:

```liquid
{%- if request.page_type == 'index' -%}
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": {{ shop.name | json }},
      "url": {{ request.origin | append: routes.root_url | json }}
      {%- if settings.logo != blank -%},
      "logo": {{ settings.logo | image_url: width: 600 | prepend: 'https:' | json }}
      {%- endif %}
    }
  </script>
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"WebSite","name":{{ shop.name | json }},"url":{{ request.origin | append: routes.root_url | json }}}
  </script>
{%- endif -%}
```

Al pushearla, validarla con la prueba de resultados enriquecidos.

**Riesgos a verificar:**

1. **La disponibilidad depende del mercado. Orden de trabajo: C2 antes de C1.**
   - Hoy los visitantes resuelven al mercado principal (US), y ahí los productos están disponibles (hecho medido). Que los crawlers resuelvan igual es una inferencia: **NOT_VERIFIED**.
   - Si la dueña pasa **Colombia a principal (C1) antes de crear la zona de envío Colombia (C2)**, los 29 productos quedan agotados para todo visitante o crawler que resuelva a Colombia, y C1 también pide desactivar EE. UU. La ficha dice "agotado" y se espera que el ProductGroup diga OutOfStock. Hecho medido: con `country=CO`, 0/29 disponibles y `/cart/add.js` 422 (`theme/03E-checkout-baseline-report.md:41-45`).
   - Hay que hacer **C2 antes o junto con C1** (`theme/03E-checkout-baseline-report.md` § 2).
2. **Qué colección aparece en la miga:** `context_collection = collection | default: product.collections.first` (`main-product.liquid:25`).
   - Abierta en su URL canónica `/products/<handle>` (la que rastrea Google), la ficha usa **la primera colección** del producto.
   - 4 productos de Espuma de Ola están también en **Destacados** (`bikini-palm-verde-oliva`, `bikini-shadow-azul-marino`, `enterizo-shadow-palm-azul-marino`, `entero-golden-hour`; `theme/03D-missing-assets-audit.md:150-156`), y 3 de Aurora Viva también.
   - shopify.dev no documenta el orden de `product.collections`. Si Destacados sale primero, la miga y el `BreadcrumbList` dirían "Inicio / Destacados / …" en lugar de la colección real, como era en el sitio viejo.
   - **NOT_VERIFIED; se re-mide abriendo `/products/bikini-palm-verde-oliva` en el preview.**
   - Si se confirma, el arreglo mínimo es saltar `destacados` al elegir `context_collection`: por ejemplo, un `for` sobre `product.collections` que tome la primera con `handle != 'destacados'`, con el `default` actual como respaldo.
3. El `ProductGroup` de Shopify no incluye `color` (el viejo sí, desde `custom.color`). Es una diferencia menor; el color ya está en el título en 27 de los 29 productos.

## 7. Open Graph, favicon e imagen social

- **`og:type` ausente** (`theme.liquid:45-55`). Facebook documenta que el valor por defecto es `website`, igual al que declaraba el sitio viejo (`APP/app/layout.tsx:47`). **Sin impacto.**
- **`og:title`** imprime `{{ page_title }}` **sin** `| escape` (`theme.liquid:47`); `og:description` sí escapa (`:49`).
  - Con los datos actuales ningún título tiene comillas. No es reproducible hoy.
  - **Endurecimiento sugerido:** `content="{{ page_title | escape }}"`.
- **Favicon:** `settings.favicon` no está cargado (no figura en `theme-src/config/settings_data.json`), así que `theme.liquid:29-31` no emite `<link rel="icon">`. Google usa el favicon en los resultados de búsqueda.
  - La fuente existe **en el repo**, no hay que descargar nada: `APP/app/icon.png`, `APP/app/favicon.ico` y `APP/app/apple-icon.png`.
  - Falta en el manifiesto de media (`content/media/media-migration-manifest.csv` llega a M14).
  - **Owner:** subirlo en Tema > Configuración > Favicon.
- **Imagen social:** en la Home `page_image` está vacío salvo que se cargue la imagen para compartir en Preferencias, así que hoy no hay `og:image`. El sitio viejo la generaba (`APP/app/opengraph-image.tsx`). **Owner:** cargarla (media owner-only).

## 8. Enlaces internos

- `theme-src/` no tiene rutas viejas hardcodeadas (`/envios`, `/producto/`, `/buscar`, `/cuenta`…): 0 coincidencias. Ningún enlace interno depende de un redirect.
- **`/pages/garantia` queda huérfana:**
  - `warranty_url` está vacío en el bloque de envíos de la ficha (`theme-src/templates/product.json:30`), así que la ficha no enlaza garantía (`main-product.liquid:302`, `:312-313`);
  - el footer no tiene columna "Ayuda" (`theme/03D-legal-policies-inventory.md:25`).
  - **Config (Theme editor):** `warranty_url` = `/pages/garantia`. El reembolso ya enlaza solo vía `shop.refund_policy.url` (`main-product.liquid:301`).
- **Headings:** un `<h1>` por plantilla (producto `main-product.liquid:118`, colección `snippets/collection-banner.liquid:77`, página `main-page.liquid:9`, Home `hero.liquid:43`).
  - La colección solo tiene `<h1>` si `collection_show_banner` está en ON, y hoy lo está (`config/settings_data.json:36`). No hay que apagarlo sin agregar otro `<h1>`.
- **Rendimiento (03E local):** las primeras 4 tarjetas cargan eager en colección y búsqueda (`main-collection.liquid:76`, `main-search.liquid:88`) y la imagen secundaria de la tarjeta siempre es lazy (`snippets/product-card.liquid:121`). Es una mejora de LCP sin riesgo SEO; se valida después del push.

## 9. Bugs del theme (reales y reproducibles)

| # | Archivo:línea | Defecto | Reproducción | Arreglo mínimo (no aplicado) |
|---|---|---|---|---|
| 1 | `theme-src/layout/theme.liquid:35` | El `<title>` agrega el texto fijo en inglés ` – tagged "…"` cuando hay `current_tags`, en una tienda en español. El resto de los textos de meta sí están localizados (`general.meta.page`, `:36`) | Abrir una colección filtrada por etiqueta con el formato `/collections/<colección>/<tag-handle>` (shopify.dev, tag filtering). **Corregido en la verificación:** `color:BLANCO` y `color:MOSTAZA` ya no existen. Se quitaron en 03E y hoy el único tag es `MOSTAZA`, en `entero-golden-hour`, de Espuma de Ola (`theme/03E-search-final-report.md:27`, `:30`, `:37`). Caso concreto: `/collections/espuma-de-ola/mostaza`. Por construcción, el título queda `Espuma de Ola – tagged "…" – …`. Reproducción en vivo: **NOT_VERIFIED**. **Severidad baja:** nada del theme enlaza URLs de etiqueta; los filtros usan `filter.v.*` | `{%- if current_tags %} &ndash; {{ current_tags \| join: ', ' }}{% endif -%}` (sin palabra nueva), o una clave de locale cuyo texto en español decida la dueña |

**No son bugs del theme:** `CoberturaTodos` (es contenido, § 2.3), "Radaelli Swimwear Dev" (nombre de la tienda) y la falta de noindex en `/search` (ya corregido localmente, falta el push). La miga con Destacados (§ 6, riesgo 2) queda **NOT_VERIFIED** y no se lista como bug hasta medirla.

## 10. Owner-only, en orden

1. **Mercados y envío:** C2 (zona Colombia) **antes o junto con** C1 (Colombia como mercado principal). Si no, catálogo y datos estructurados quedan agotados (§ 6, riesgo 1).
2. **Al publicar el theme:**
   - asignar `page.wishlist`;
   - importar `seo/shopify-redirects-import.csv`;
   - renombrar la tienda a "Radaelli Swimwear";
   - cargar título y meta de la Home en Preferencias (verbatim, `APP/app/page.tsx:17-19`).
3. **Descripciones SEO verbatim:** garantía, 4 colecciones y 29 productos (§ 2.3).
4. **`seo.hidden` = 1** en `favoritos`; decidir `contact` (§ 3, § 5).
5. **Favicon e imagen social** desde el repo (§ 7).
6. **`warranty_url`** = `/pages/garantia` (§ 8).
7. **Decidir `/en`:** despublicar o traducir (§ 4). Decidir blog y `/accesorios` con datos de Search Console (plan § 4).
8. **Legales antes del DNS:** crear `/envios`, `/terminos`, `/privacidad` y `/cookies` y agregar sus redirects (plan § 4.3). Decidir si deben ser indexables, por la regla `/policies/` (§ 5).
9. **Dominio:** conectar `radaelliswimwear.com` con el **apex como primario**. Enviar `/sitemap.xml` en Search Console y vigilar 404 y redirecciones durante 4–8 semanas.

## 11. Verificaciones en vivo después del push o del lanzamiento

- `<meta name="robots">` en búsqueda, favoritos y 404; ausente en Home, colección, ficha y garantía.
- Tags `hreflang` y `x-default` en el `<head>` y en `sitemap.xml`, **después** de C1.
- `robots.txt`: `/search`, `/policies/`, filtros de colección.
- Canonical de colección con `?filter.v.price.gte=…&sort_by=…` y con `?page=2`.
- `BreadcrumbList` de `/products/bikini-palm-verde-oliva` (§ 6, riesgo 2).
- Meta description de una ficha, sin texto pegado, tras cargar la descripción SEO.
- Redirects: script del plan § 7.

## 12. Fuentes

- Shopify, SEO de mercados (hreflang, canonical, sitemap): https://help.shopify.com/en/manual/markets/seo
- Shopify, robots.txt.liquid: https://shopify.dev/docs/storefronts/themes/seo/robots-txt (incluye el ejemplo que quita la regla por defecto de `/policies/`)
- Shopify, filtrado por etiqueta (`/collections/<handle>/<tag-handle>`): https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/tag-filtering
- Shopify, ocultar páginas con `seo.hidden`: https://help.shopify.com/en/manual/promoting-marketing/seo/hide-a-page-from-search-engines
- Shopify, objeto `product` (`collections` sin orden documentado): https://shopify.dev/docs/api/liquid/objects/product
- Google, retiro del cuadro de búsqueda de sitelinks: https://developers.google.com/search/blog/2024/10/sitelinks-search-box
- Google, mudanza con cambio de URLs: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes
- Meta, etiquetas Open Graph (`og:type` por defecto `website`): https://developers.facebook.com/docs/sharing/webmasters
