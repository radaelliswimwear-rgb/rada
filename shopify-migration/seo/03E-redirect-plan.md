# 03E — Plan de redirects SEO (Next.js → Shopify)

- **Fecha:** 2026-09-29. Trabajo **offline**: sin navegador, sin CLI de Shopify, sin escribir en la tienda.
- **Entregables:**
  - `seo/shopify-redirects-import.csv`: 47 filas, formato de importación de Shopify (`Redirect from,Redirect to`), SHA-256 `ba369467…18b1d6`.
  - `seo/validate-redirects.mjs`: validador de solo lectura, SHA-256 `ed8004b5…11bb20`.
- **Veredicto:** el CSV está **listo para importar** y pasa los 14 controles (0 errores). Quedan 12 avisos esperados, de 3 tipos (§ 6).
  - El theme se publica al lanzar y la plantilla `page.wishlist` se asigna en ese mismo paso. Los redirects de favoritos se activan después.
  - Las 4 páginas legales pendientes (§ 4.3) **no** tienen fila: su destino todavía no existe.
- **Importar es owner-only**, porque escribe en la tienda. Procedimiento en § 7.

## 1. Revisión crítica de los archivos parciales (corrida interrumpida)

Se revisaron fila por fila contra el inventario, el mapeo de handles, la paridad 03C, los reportes 03B/03D/03E y el árbol `app/` del sitio.

| Archivo | Qué se conservó | Qué se cambió |
|---|---|---|
| `shopify-redirects-import.csv` | Las 46 filas restantes: correctas, sin loops, cadenas ni duplicados, con destinos que existen hoy | `/cuenta/registro` ahora va a **`/account/register`** (antes `/account/login`). Es la equivalencia literal y está verificada en la Dev Store: GET `/account/register` lleva al login de New Customer Accounts (`theme/03B-store-foundation-report.md:187`) |
| `validate-redirects.mjs` | Toda la lógica: allowlist derivada de evidencia, relación origen/destino, cadenas, loops, cobertura y clasificación exclusiva | 1. Prefijos y rutas reservadas completados según help.shopify.com (`/a`, `/community`, `/tools`, `/collections/vendors`, `/collections/types`).<br>2. Control nuevo de caracteres seguros en origen y destino (`FROM_CHARS`/`TO_CHARS`).<br>3. Aviso nuevo si el destino lleva query (`TO_QUERY`).<br>4. `/checkout/confirmacion/[orderId]` y `/checkout/wompi/retorno` pasan de "no redirect needed" a **"intentionally not migrated"**: eran páginas reales con función, reemplazadas por la página de estado de pedido de Shopify.<br>5. Motivos "idem" reemplazados por texto explícito; `/accesorios` ahora dice que **sí** está en el sitemap actual.<br>6. Self-test: de 14 a 16 casos, y los casos de loop/cadena ya no usan `/a` (ahora es prefijo reservado). |

## 2. Definición de las 6 clases

Cada URL cae en **exactamente una** clase; el validador falla si hay 0 o más de 1.

| Clase | Significado |
|---|---|
| **exact preserved** | La misma ruta existe en Shopify con el mismo contenido. No hace falta redirect |
| **Shopify normalized** | La ruta la sirve o genera la plataforma con su propia versión (robots, sitemap, checkout, búsqueda). No hace falta ni se puede redirigir |
| **redirect needed (in CSV)** | La ruta cambia y hay un destino relacionado que **existe hoy**. Tiene fila en el CSV |
| **intentionally not migrated** | Contenido o función del sitio viejo sin destino relacionado en Shopify, por decisión o alcance. Da 404. No se redirige a la home ni a nada ajeno |
| **legal redirect pending** | Página legal cuyo destino en Shopify todavía no se creó (owner-only). La fila se agrega cuando exista (§ 4.3) |
| **no redirect needed** | Nunca tuvo valor público o indexable: restos de la plantilla Vercel que hoy dan 404, íconos, imágenes de ejemplo |

## 3. Conteos

**Inventario oficial (`seo/current-url-inventory.csv`, 47 URLs):**

| Clase | URLs |
|---|---|
| exact preserved | **1** (`/`) |
| Shopify normalized | **0** |
| redirect needed (in CSV) | **36**: 29 productos, 4 colecciones, `/devoluciones`, `/garantia` y `/buscar` |
| intentionally not migrated | **6**: `/accesorios`, `/hombre`, `/mujer`, `/ninos`, `/calzado` y `/blog/<slug>` |
| legal redirect pending | **4**: `/envios`, `/terminos`, `/privacidad` y `/cookies` |
| no redirect needed | **0** |
| **Total** | **47** |

**Universo completo:** inventario + 2 extras de la paridad 03C + 48 rutas de `app/` + 5 archivos de `public/`, en total **102**.

| Clase | inventario | paridad 03C | app/ | public/ | total |
|---|---|---|---|---|---|
| exact preserved | 1 | 0 | 0 | 0 | 1 |
| Shopify normalized | 0 | 0 | 4 | 0 | 4 |
| redirect needed (in CSV) | 36 | 2 | 9 | 0 | **47 = filas del CSV** |
| intentionally not migrated | 6 | 0 | 28 | 0 | 34 |
| legal redirect pending | 4 | 0 | 0 | 0 | 4 |
| no redirect needed | 0 | 0 | 7 | 5 | 12 |
| **Total** | 47 | 2 | 48 | 5 | **102** |

## 4. Clasificación URL por URL

### 4.1 Inventario (47) + extras de la paridad (2)

| # | URL vieja (ruta) | Clase | Destino / motivo |
|---|---|---|---|
| 1 | `/` | exact preserved | Misma raíz. Español es el idioma predeterminado del dominio (`theme/03B-store-foundation-report.md:28`) |
| 2 | `/oasis-natural` | redirect needed | → `/collections/oasis-natural` |
| 3 | `/aurora-viva` | redirect needed | → `/collections/aurora-viva` |
| 4 | `/espuma-de-ola` | redirect needed | → `/collections/espuma-de-ola` |
| 5 | `/salidas-de-bano` | redirect needed | → `/collections/salidas-de-bano`. Existe con 0 productos, igual que hoy, y está en el sitemap actual (`app/sitemap.ts:35`). Misma colección, no es contenido ajeno |
| 6 | `/accesorios` | intentionally not migrated | 0 productos, no migrada (`catalog/shopify-url-parity.csv`: NOT_MIGRATED). **Está en el sitemap actual** (`app/sitemap.ts:31`). Sin destino relacionado → 404 hasta que la dueña decida con Search Console |
| 7 | `/hombre` | intentionally not migrated | Archivada, 0 productos, fuera del sitemap (`app/sitemap.ts:17-20`) |
| 8 | `/mujer` | intentionally not migrated | Ídem |
| 9 | `/ninos` | intentionally not migrated | Ídem |
| 10 | `/calzado` | intentionally not migrated | Ídem |
| 11–39 | `/producto/<slug>` × 29 | redirect needed | → `/products/<handle>`. Los 29 handles están verificados en la Dev Store (`catalog/shopify-post-import-audit.csv`). 28 conservan el slug exacto; `COSTA-ESMERALDA-AZUL` → `costa-esmeralda-azul` (§ 5.1) |
| 40 | `/blog/<slug>` | intentionally not migrated | 3 posts reales; los slugs viven solo en la base (**NOT_AVAILABLE** en el repo). Blog fuera de alcance de 03C; migrarlo o no es decisión de la dueña |
| 41 | `/envios` | legal redirect pending | Destino no creado (owner-only). Además promete envío gratis desde $299.900, que no existe como tarifa (`theme/03D-legal-policies-inventory.md:21`) |
| 42 | `/devoluciones` | redirect needed | → `/policies/refund-policy`. Texto migrado verbatim, mismo SHA-256 (`theme/03D-legal-policies-inventory.md:17`). Destino bloqueado para crawlers por la regla por defecto `/policies/` (§ 5.5) |
| 43 | `/garantia` | redirect needed | → `/pages/garantia`. Texto migrado verbatim, mismo SHA-256 (`theme/03D-legal-policies-inventory.md:18`) |
| 44 | `/terminos` | legal redirect pending | Destino no creado (owner-only) |
| 45 | `/privacidad` | legal redirect pending | Página propia no creada (requiere revisión humana de proveedores). La política **automática** de Shopify existe y está publicada, pero con otro texto (§ 4.3) |
| 46 | `/cookies` | legal redirect pending | Página no creada; el botón de preferencias no existe en Shopify |
| 47 | `/buscar` | redirect needed | → `/search`. Hoy es noindex y Disallow (`app/buscar/page.tsx:12`, `app/robots.ts:34`): sirve para marcadores, no para SEO |
| — | `/favoritos` (paridad) | redirect needed | → `/pages/favoritos`. **Condicional:** la plantilla `page.wishlist` se asigna al publicar (`theme/03B-store-foundation-report.md:249`, `:273`) |
| — | `/cuenta/favoritos` (paridad) | redirect needed | → `/pages/favoritos`. Ídem |

### 4.2 Rutas de `app/` y `public/` (53, fuera del inventario)

| Grupo | N | Clase | Destino / motivo |
|---|---|---|---|
| `/cuenta`, `/cuenta/pedidos`, `/cuenta/perfil`, `/cuenta/direcciones` | 4 | redirect needed | → `/account`. `/account/orders` y `/account/addresses` no están verificados; `/account` sí (`theme/03D-search-accounts-wishlist-report.md:69`) |
| `/cuenta/iniciar-sesion`, `/cuenta/recuperar-contrasena`, `/cuenta/restablecer-contrasena`, `/cuenta/verificar-email` | 4 | redirect needed | → `/account/login`. New Customer Accounts no usa contraseña: el código de login reemplaza recuperación y verificación |
| `/cuenta/registro` | 1 | redirect needed | → `/account/register` (verificado en 03B:187) |
| `/checkout`, `/search`, `/robots.txt`, `/sitemap.xml` | 4 | Shopify normalized | La plataforma los sirve o genera. `/search` era una ruta heredada de la plantilla Vercel |
| `/admin` y 16 subrutas | 17 | intentionally not migrated | Panel propio, reemplazado por el Admin de Shopify. No se lista en robots (criterio BAJA-06, `app/robots.ts:7-19`) |
| `/api/**` (cron, webhooks, revalidate, diagnóstico) | 6 | intentionally not migrated | Endpoints. **Nunca** redirigir un webhook. `/api/webhooks/wompi` es un riesgo de cutover (§ 5.6) |
| `/blog` | 1 | intentionally not migrated | Índice del blog, **en el sitemap actual** (`app/sitemap.ts:36`) |
| `/interno/activar`, `/interno/desactivar` | 2 | intentionally not migrated | Herramienta interna de tráfico propio (noindex) |
| `/checkout/confirmacion/[orderId]`, `/checkout/wompi/retorno` | 2 | intentionally not migrated | Transaccionales y noindex. Las reemplaza la página de estado de pedido de Shopify. Riesgo operativo (§ 5.6) |
| `/[page]`, `/product/[handle]`, `/search/[collection]` | 3 | no redirect needed | Restos de la plantilla Vercel: 404 hoy (`lib/shopify` sin configurar) y fuera del sitemap |
| `/opengraph-image`, `/icon.png`, `/apple-icon.png`, `/favicon.ico` | 4 | no redirect needed | Metadatos generados por Next. En Shopify salen de `settings.favicon` y la imagen social |
| `public/images/products/*` (3), `public/logo/*` (2) | 5 | no redirect needed | Archivos estáticos. Las fotos reales vienen de Cloudinary y en Shopify del CDN |

La lista completa (102 filas) se regenera con `node seo/validate-redirects.mjs --list`.

### 4.3 Filas legales a agregar cuando exista el destino (NO están en el CSV)

| Origen | Destino según lo que decida la dueña | Condición previa |
|---|---|---|
| `/envios` | `/policies/shipping-policy` (política) **o** `/pages/envios` (página) | Crear el contenido de `content/legal/envios.html` **y** la tarifa de envío gratis desde $299.900 en la zona Colombia (03E C2) |
| `/terminos` | `/policies/terms-of-service` **o** `/pages/terminos` | Aprobar `content/legal/terminos.html`. El párrafo "Pago" describe Wompi |
| `/privacidad` | `/policies/privacy-policy` **o** `/pages/privacidad` | Revisión humana de proveedores (`content/legal/privacidad.html`). Opción: si la dueña adopta la política automática publicada como la oficial, `/privacidad,/policies/privacy-policy` se puede agregar ya. Es una decisión legal suya, no técnica |
| `/cookies` | `/pages/cookies` | Aprobar `content/legal/cookies.html` y revisar "Hoy no las usamos" |

**Condición del cutover (agregado en la verificación adversarial):**

- Las 4 URLs están en el sitemap actual (`app/sitemap.ts:39`, `:42-44`), así que son URLs publicadas e indexables.
- Si el DNS se mueve antes de crear sus destinos, las 4 darán **404**.
- Crear estas páginas (owner-only) y agregar sus filas es **requisito previo** del cambio de DNS, igual que los otros prerequisitos de § 7.
- Si en ese momento se eligen destinos `/policies/*`, ver § 5.5 (`Disallow: /policies/` por defecto).

**Cómo se agrega cada una sin romper el validador:**

1. Sacar el destino de `PENDING_DESTINATIONS` y de `RULES["legal redirect pending"]`.
2. Agregarlo a `EVIDENCE`, con la frase del reporte que lo verifica en la tienda.
3. Declarar la relación en `DECLARED`.
4. Agregar la fila al CSV y correr el validador.

## 5. Riesgos y verificaciones pendientes (NOT_VERIFIED)

### 5.1 Mayúsculas en `/producto/COSTA-ESMERALDA-AZUL`

- **Evidencia:** en el sitio viejo solo responde la URL en mayúsculas. El slug es `@unique` y se busca con `findUnique({ where: { slug } })`, sensible a mayúsculas (`prisma/schema.prisma:213`, `lib/catalog/catalog-actions.ts:287-288`).
- **Qué no está documentado:** si Shopify compara el "Redirect from" sin distinguir mayúsculas. La documentación oficial no lo dice (help.shopify.com url-redirect; shopify.dev `UrlRedirect.path` solo dice "The old path to be redirected from").
- **Decisión:** una sola fila con la ruta real, en mayúsculas. Una segunda fila en minúsculas sería un duplicado si Shopify normaliza, y esa URL nunca existió.
- **Verificar al importar:** que el Admin conserve la ruta y que `curl -sI https://<dominio>/producto/COSTA-ESMERALDA-AZUL` responda 301 → `/products/costa-esmeralda-azul`.

### 5.2 Query strings

- help.shopify.com advierte que las URLs con query strings "might not work as expected".
- Casos reales:
  - `/buscar?q=…` (antes era el target del `SearchAction`, `app/layout.tsx:83`);
  - `/producto/<slug>?talla=M` (`app/producto/[slug]/page.tsx`, `searchParams.talla`).
- **Verificar en vivo:** que el redirect dispare con query y si la conserva. `?talla=` no tiene equivalente en Shopify, que usa `?variant=<id>`: la ficha abre con la variante por defecto (aceptable).

### 5.3 Código HTTP

- La ayuda dice "301 redirects are cached by browsers and search engines", pero no afirma explícitamente qué código devuelven los redirects de Shopify.
- **Verificar:** `curl -sI` sobre una muestra; se espera `301` y `Location` relativo al dominio primario.

### 5.4 Dominio primario

- El sitio viejo es **apex**: `https://radaelliswimwear.com` (columna `canonical_current` del inventario).
- Si al conectar el dominio en Shopify el primario queda en `www.`, cada URL vieja suma un salto de dominio antes del redirect de ruta: una cadena de 2.
- **Recomendación (owner, al conectar el dominio):** primario = apex.
- Google pide evitar cadenas ("Avoid chaining redirects", developers.google.com, site-move-with-url-changes).

### 5.5 Otros puntos a verificar

- **`/policies/` y robots.txt (corregido en la verificación adversarial):** shopify.dev documenta el bloqueo de `/policies/` como **regla por defecto** del robots.txt de Shopify. El ejemplo "Remove a default rule from an existing group" quita justamente "the rule blocking crawlers from accessing the `/policies/` page" (https://shopify.dev/docs/storefronts/themes/seo/robots-txt). El theme no tiene `robots.txt.liquid`, así que se espera que la regla esté activa. En vivo sigue **NOT_VERIFIED**.
  - Consecuencia esperada: `/devoluciones` → `/policies/refund-policy` lleva a una URL que Google no rastrea. La URL vieja sale del índice sin transferir señales. El redirect sigue siendo correcto para las personas y es mejor que un 404, así que **la fila se mantiene**.
  - Lo mismo vale para cualquier destino `/policies/*` de § 4.3 (`shipping-policy`, `terms-of-service`, `privacy-policy`).
  - **Decisión de la dueña** (solo si quiere que las legales sigan indexables, como en el sitemap viejo, `app/sitemap.ts:39-44`):
    - (a) aceptarlo; es lo habitual en tiendas Shopify;
    - (b) agregar `templates/robots.txt.liquid` quitando esa regla (cambio de theme, en otra tarea);
    - (c) usar destinos `/pages/*` para las legales pendientes.
  - **Verificar** `/robots.txt` al levantar la contraseña.
- **Productos inactivos:** no están en el inventario (29 activos) y en el sitio viejo **ya dan 404** (`lib/catalog/catalog-actions.ts:293-295` devuelve `null` si `!active`). Solo importan si alguna vez estuvieron activos e indexados. **NOT_AVAILABLE** (`MANUAL_STEP_REQUIRED.md:10`). Contrastar con Search Console → Páginas antes del cutover.
- **Blog:** los 3 slugs viven solo en la base. Antes del cutover, leer el `sitemap.xml` en vivo y decidir: migrar los posts (y agregar filas `/blog/<slug>` → `/blogs/<blog>/<handle>`) o dejarlos en 404.
- **Favoritos:** `/pages/favoritos` hoy responde 200 con la plantilla genérica; el wishlist real está en `?view=wishlist` (03B:147-148). La fila del CSV apunta a la ruta limpia: es correcta desde que se asigna `page.wishlist` al publicar.

### 5.6 Operativo (fuera de SEO, pero se decide en el mismo cutover)

- `/api/webhooks/wompi` y `/checkout/wompi/retorno` dejan de existir al mover el DNS.
- Si hay pagos en curso o eventos de Wompi apuntando al dominio viejo, se pierden. Un redirect no sirve: los webhooks son POST.
- Plan de ventana de cutover: ver `payments/03E-wompi-shopify-feasibility.md`.

### 5.7 Saltos de plataforma de `/account*`

- `/account`, `/account/login` y `/account/register` redirigen a su vez a `shopify.com/<id>/…` (New Customer Accounts).
- Es un salto de la plataforma, no del CSV. Esas rutas eran Disallow y noindex (`app/robots.ts:27`), así que no afecta SEO.

## 6. Salida del validador (corrida 2026-09-29)

`node seo/validate-redirects.mjs` (exit 0):

```text
validate-redirects.mjs -- 2026-09-29
APP (rutas Next.js): checkout principal (commerce-main/), 74 rutas/archivos escaneados  |  MIG: shopify-migration/
CSV: seo/shopify-redirects-import.csv  filas=47  encabezado="Redirect from,Redirect to"  BOM=no  fin de línea=LF
Allowlist de destinos existentes: 43 rutas
  /, /collections/* x5, /products/* x29, /search, /pages/favoritos, /pages/garantia, /policies/refund-policy, /cart, /account, /account/login, /account/register

CONTROLES
  [PASS] Encabezado exacto de Shopify
  [PASS] Rutas relativas, sin query ni espacios
  [PASS] Origen no reservado ni servido por Shopify
  [PASS] Origen conocido (inventario/paridad/app)
  [PASS] Destino en minúsculas
  [PASS] Destino existe hoy (allowlist)
  [PASS] Destino no es legal pendiente
  [PASS] Sin auto-redirects
  [PASS] Sin duplicados (incl. mayúsculas)
  [PASS] Sin cadenas
  [PASS] Sin loops
  [PASS] Relación origen/destino declarada
  [PASS] Cobertura productos (29) y colecciones
  [PASS] Cada URL en exactamente 1 clase
  Avisos: FROM_UPPERCASE=1, CONDITIONAL=2, PLATFORM_HOP=9
    FROM_UPPERCASE: línea 7: "/producto/COSTA-ESMERALDA-AZUL" conserva mayúsculas del origen real; verificar en vivo
    CONDITIONAL: línea 38: /favoritos: activar con la plantilla page.wishlist asignada a la página (se asigna al publicar; 03B)
    CONDITIONAL: línea 39: /cuenta/favoritos: idem /favoritos

CLASIFICACIÓN (cada URL en exactamente una clase)
  clase                         inventario paridad 03C        app/     public/  total
  exact preserved                        1           0           0           0  1
  Shopify normalized                     0           0           4           0  4
  redirect needed (in CSV)              36           2           9           0  47
  intentionally not migrated             6           0          28           0  34
  legal redirect pending                 4           0           0           0  4
  no redirect needed                     0           0           7           5  12
  TOTAL                                 47           2          48           5  102

RESULTADO: PASS -- 0 errores, 12 avisos, 47 redirects, 102 URLs clasificadas
```

`node seo/validate-redirects.mjs --self-test` (exit 0; casos negativos sintéticos):

```text
  [DETECTADO] loop -> LOOP
  [DETECTADO] cadena -> CHAIN
  [DETECTADO] duplicado por mayúsculas -> DUPLICATE
  [DETECTADO] auto-redirect -> SELF
  [DETECTADO] destino inexistente -> TO_NOT_ALLOWLISTED
  [DETECTADO] destino legal pendiente -> TO_PENDING
  [DETECTADO] destino en mayúsculas -> TO_UPPERCASE
  [DETECTADO] origen con dominio -> FROM_FORMAT
  [DETECTADO] origen con query -> FROM_QUERY
  [DETECTADO] origen reservado -> FROM_RESERVED
  [DETECTADO] origen reservado /a/ -> FROM_RESERVED
  [DETECTADO] origen con espacio -> FROM_CHARS
  [DETECTADO] origen servido por Shopify -> FROM_SERVED_BY_SHOPIFY
  [DETECTADO] encabezado distinto -> HEADER
  [DETECTADO] origen desconocido -> FROM_UNKNOWN
  [DETECTADO] relación no declarada -> UNRELATED_OR_UNDECLARED
  [OK] control positivo sin errores
SELF-TEST: 16/16 casos negativos detectados; control positivo limpio -> PASS
```

**Cómo se arma la allowlist de destinos (nada inventado):**

- rutas `EXISTS` de `catalog/shopify-url-parity.csv`;
- handles de `catalog/shopify-post-import-audit.csv`;
- más 8 rutas cuya existencia en la Dev Store está escrita en los reportes 03B/03D. El script busca la frase exacta y, si no la encuentra, **excluye** la ruta.

Las páginas legales pendientes (`/pages/envios`, `/policies/shipping-policy`, etc.) y las colecciones no migradas son destinos **prohibidos**.

## 7. Procedimiento de importación y verificación (owner-only)

1. **Cuándo:** antes de apuntar el DNS, con el theme Radaelli ya publicado y `page.wishlist` asignada a Favoritos. Las 4 legales pendientes también tienen que estar creadas y con su fila agregada antes del DNS (§ 4.3).
   - Los redirects solo disparan en rutas que dan 404 (help.shopify.com: "You can redirect only from broken URLs").
   - Ninguna ruta de origen existe hoy en Shopify, así que importarlos antes no rompe nada.
2. **Dónde:** Admin → sección de redirecciones de URL → Importar → `seo/shopify-redirects-import.csv` → revisar la vista previa → "Import redirects".
   - En la vista previa hay que confirmar **47** filas y que `/producto/COSTA-ESMERALDA-AZUL` conserve la ruta.
3. **Verificación offline previa:** `node seo/validate-redirects.mjs` debe dar `RESULTADO: PASS`.
4. **Verificación en vivo** (después del DNS, en modo lectura, desde la terminal de la dueña o de Claude con su OK):

   ```sh
   # Cada origen: 301 y Location = destino del CSV. Cada destino: 200 (salvo /account*, que salta a shopify.com).
   tail -n +2 seo/shopify-redirects-import.csv | while IFS=, read -r from to; do
     code=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://radaelliswimwear.com$from")
     echo "$from -> $code (esperado 301 $to)"
   done
   ```

   Sumar a mano:
   - `/buscar?q=bikini` y `/producto/bikini-foam?talla=M` (§ 5.2);
   - `/accesorios` y `/hombre`: se espera 404;
   - `/robots.txt`: confirmar la regla `/policies/` (se espera que esté, § 5.5).
5. **Search Console** (propiedad del mismo dominio; no hace falta Change of Address, según developers.google.com):
   - enviar `/sitemap.xml` de Shopify;
   - vigilar Páginas → "No encontrada (404)" y "Página con redirección" durante 4–8 semanas.
6. **Duración:** mantener los redirects al menos 1 año (Google: "generally at least 1 year"). Límite de Shopify: 100.000 redirects; se usan 47.

## 8. Fuentes

- Shopify, URL redirects: https://help.shopify.com/en/manual/online-store/menus-and-links/url-redirect ("You can redirect only from broken URLs"; prefijos reservados; query strings "might not work as expected"; límite 100.000).
- Shopify, objeto `UrlRedirect`: https://shopify.dev/docs/api/admin-graphql/latest/objects/UrlRedirect (no documenta si distingue mayúsculas).
- Shopify REST Redirect: https://shopify.dev/docs/api/admin-rest/latest/resources/redirect (`path` de hasta 1024 caracteres).
- Shopify, robots.txt.liquid: https://shopify.dev/docs/storefronts/themes/seo/robots-txt (bloqueo de `/policies/` como regla por defecto, en el ejemplo "Remove a default rule from an existing group").
- Google, mudanza con cambio de URLs: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes ("Avoid chaining redirects"; "generally at least 1 year"; no redirigir en masa a la home, que puede tratarse como soft 404).
