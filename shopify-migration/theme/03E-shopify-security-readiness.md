# 03E — Auditoría de seguridad (solo alcance Shopify)

> **Estado tras RC1.5 (2026-09-29, 14:00).** Todos los hallazgos accionables están **corregidos, probados y pusheados** al theme sin publicar (RC1.5 `1a506a41…f2e2`, remoto = ZIP 96/96):
>
> | Hallazgo | Corrección | Prueba offline | Mutante | En vivo |
> |---|---|---|---|---|
> | SEC-01 `sort_by` crudo | Solo se reusa si es una opción de Shopify (`valid_sort_by`) | R Seguridad | 29 detectado | P1: 0 inyecciones |
> | SEC-02 `<title>` / `og:title` | `escape_once` + etiqueta traducida | R Seguridad | 30, 31 detectados | P3: 0 inyecciones; "Etiquetas: MOSTAZA" |
> | SEC-03 textos del comercio y valores de filtro reflejados | `\| escape` en 16 salidas | R Seguridad (sort/filter) | — | P1b: 0 inyecciones |
> | SEC-04 `?vista` inválido rompía el toolbar | Lista blanca 2/3/4 | R Seguridad | 28 detectado | `?vista=2%203` → 3 columnas, 0 errores |
> | SEC-05 (app) `/\host` en `accountPageUrl` | Regex `^(https:\/\/\|\/(?![\/\\]))` | `transport.test.mjs` | `transport-backslash-host` detectado (app 20/20) | — (app sin instalar) |
> | SEC-06 JS inline `onchange` | Listener en `collection-filters.js` (0 inline en el theme) | R Orden | 48 detectado | Sin `[onchange]` |
>
> - **P2 (búsqueda):** `q` con HTML → 0 inyecciones en el título, el h1 y los resultados. `t` escapa las interpolaciones.
> - **Pendiente:** P5 (el proxy reenvía `Content-Type` y `X-Radaelli-Wishlist`) necesita la app instalada, que es owner-only.
> - **App 0.1.1:** `dist/radaelli-wishlist-app-0.1.1.zip`, SHA-256 `f14f068a962a617d255c9cfba6a9ba581496c5c6b3c7dc4713ac2b4bb1be1de8`, 35 entradas, determinista, 0 `.env`, 0 secretos; 156/156 tests.

- **Fecha:** 2026-09-29, ~12:30–12:50 (Bogotá).
- **Método:** lectura estática del código, más la ejecución de los tests y mutantes de la app. **Sin tienda, sin navegador, sin Shopify CLI y sin renderizador de Liquid local.** Lo que depende de cómo Shopify escapa sus propios objetos queda como `NOT_VERIFIED`, con una prueba inofensiva para validarlo (§ 6).
- **Alcance:**
  - `theme-src/`: 97 archivos, incluidos los cambios locales de 03E sin pushear;
  - `app/`: 35 archivos;
  - `dist/radaelli-shopify-theme-rc1.4.zip` y `dist/radaelli-wishlist-app-0.1.0.zip`, extraídos solo en el directorio temporal del sistema;
  - `content/legal/*.html`: 6 archivos, más `manifest.json`.
- **Sin cambios:** no se editó ningún archivo fuera de este reporte.

## 1. Resumen

- **Secretos:** 0 en todo el alcance, incluidos los dos ZIP. Solo aparecen secretos FALSOS de tests y el vector oficial `hush` de shopify.dev.
- **Datos de contacto:**
  - un único teléfono: el WhatsApp comercial público (`wa.me/57XXXXXXXX68`);
  - un único email real: el corporativo de soporte (`i***@radaelliswimwear.com`), en `theme_info`.
- **App de favoritos: sólida.**
  - **156/156 tests** y **19/19 mutantes** muertos, re-corridos hoy (20/20 tras sumar el mutante de SEC-05 en RC1.5).
  - HMAC del app proxy según shopify.dev, session token (`alg`/`exp`/`nbf`/`aud`/`dest`/`sub`), HMAC de webhooks y logs sin PII.
- **Theme:**
  - 0 `innerHTML`, `insertAdjacentHTML`, `eval`, `new Function` y `document.write`;
  - 0 orígenes de terceros;
  - 0 `return_to`;
  - no renderiza la nota ni los atributos o propiedades del carrito, ni nombres de clientas.
- **Lo más importante a corregir (defensa en profundidad, bajo costo):**
  1. **SEC-01:** `collection.sort_by` (parámetro de la URL) se imprime **sin escapar** en un atributo y en un `href` (`collection-filters.liquid:50,63,115`). Si Shopify lo devuelve crudo, sería XSS reflejado. `NOT_VERIFIED`.
  2. **SEC-02:** `page_title` y `current_tags` sin escapar en `<title>` y en `og:title` (`layout/theme.liquid:34,35,47`). `NOT_VERIFIED`.
  3. **SEC-04:** bug reproducible. `?vista=` con un espacio rompe el toolbar de la colección y el botón "Filtrar" en mobile (`collection-filters.js:33,51`).
- **Veredicto:**
  - **Listo con condiciones** para seguir en Dev Store.
  - **Antes de publicar:** aplicar SEC-01 a SEC-04 (son cambios de 1 a 5 líneas) y correr las pruebas de § 6.
  - Nada de esto bloquea el trabajo owner-only (mercado, envíos, pagos).

## 2. Hallazgos

Severidad: **Alta / Media / Baja / Info**. "Explotabilidad" = qué necesita un atacante en una tienda Shopify real.

| ID | Sev. | Archivo:línea | Evidencia | Explotabilidad en Shopify | Recomendación |
|---|---|---|---|---|---|
| SEC-01 | **Media** (potencial; Alta si se confirma) | `theme-src/snippets/collection-filters.liquid:115`; `:49-50` + `:63` | `<input type="hidden" name="sort_by" value="{{ collection.sort_by }}">` sin `escape`. `clear_url` concatena `collection.sort_by` sin `url_encode` y se imprime en `href="{{ clear_url }}"` sin escapar | shopify.dev define `sort_by` como el orden aplicado "by the `sort_by` URL parameter". No documenta que filtre valores inválidos → **NOT_VERIFIED**. Si llega crudo: un enlace `/collections/<c>?sort_by=<payload>` rompe el atributo en `:115`, que se dibuja siempre que exista el filtro de precio (hoy sí existe) → XSS reflejado en el origen de la tienda (carrito, app proxy con la sesión de la clienta) | Usar solo un valor que exista en `collection.sort_options`: `for option in collection.sort_options` / `if option.value == collection.sort_by` → `assign valid_sort_by = option.value`. Usar `valid_sort_by` en las condiciones de `:49` y `:114`, e imprimir `{{ valid_sort_by \| escape }}` en `:115`. Para `clear_url`, codificar en un `assign` aparte (`assign sort_param = valid_sort_by \| url_encode`) y luego `append: sort_param`. En Liquid, `append: valid_sort_by \| url_encode` codificaría la URL completa, porque los filtros se encadenan sobre el resultado y no sobre el argumento. Probar con § 6-P1 |
| SEC-02 | **Baja** (NOT_VERIFIED) | `theme-src/layout/theme.liquid:34`, `:35`, `:47` | `{{ page_title }}` y `{{ current_tags \| join: ', ' }}` en `<title>`; `content="{{ page_title }}"` en `og:title`, sin escapar. `current_tags` sale del path (`/collections/<c>/<tag>`); en búsqueda, `page_title` incluye los términos | En `<title>` (RCDATA) solo `</title>` rompe el contexto; en `og:title` basta una comilla `"`. Shopify no documenta si ya los entrega escapados. Hoy ningún título del catálogo tiene `" < > &` (99 filas del CSV 03C + 29 del snapshot) | `{{ page_title \| escape_once }}`, `{{ current_tags \| join: ', ' \| escape_once }}` y `content="{{ page_title \| escape_once }}"`. `escape_once` no re-escapa si Shopify ya escapó. Probar con § 6-P2/P3 |
| SEC-03 | **Baja** | `theme-src/sections/predictive-search.liquid:23`; `snippets/product-card.liquid:101`; `sections/header.liquid:52,57,286,288`; `sections/footer.liquid:37`; `layout/theme.liquid:45`; `snippets/cart-summary.liquid:20`; `snippets/collection-filters.liquid:80,87,88,110,117,150,158,165,174` | Textos del **comercio** sin escapar en HTML o atributos: `product.title`, `shop.name`, `discount.title`, `value.value`, `option.value`, `option.name`, `filter.label`, `value.label`. El HTML del predictive entra al DOM por `DOMParser` + `replaceChildren` (`assets/search.js:138-140`). Mover nodos parseados al documento equivale a `innerHTML`, salvo `<script>`: los manejadores `on*` sí se ejecutan | Requiere escritura en el Admin (personal con permiso de productos, descuentos o Search & Discovery), no un tercero. Un `"` en un título rompe el `aria-label` o el atributo. Riesgo de escalada: alguien con permiso solo de productos podría inyectar script en la tienda. **Excepción (verificación adversarial):** `value.value` en `:80` y `:110` sale de `filter.active_values`, que refleja los parámetros `filter.*` de la URL. El form de orden de `:80` recorre todos los filtros, incluida Disponibilidad (`filter.v.availability`, tipo `list`), aunque esté oculta en la UI. Si Shopify acepta ahí un valor que no existe, sería reflejado como SEC-01. **NOT_VERIFIED** (§ 6-P1b) | Agregar `\| escape` a esos outputs (`\| json` ya se usa bien en los `<script type="application/json">`). En `:80` y `:110`, aplicarlo junto con SEC-01, en el mismo cambio. Para el resto, sin urgencia con los datos actuales |
| SEC-04 | **Baja** (bug funcional reproducible) | `theme-src/assets/collection-filters.js:33-34` y `:50-51` | `params.get("vista")` va directo a `classList.add(\`grid--${columns}\`)`. Con `?vista=2%203` (o un tab), `DOMTokenList.add` lanza `InvalidCharacterError`, porque el DOM Standard no admite espacios en un token. `onConnect` corta antes de `:36-44`: los botones 2/3/4 y el trigger del drawer "Filtrar" quedan sin listener. Además `:50` ya quitó la clase de columnas | Un enlace armado rompe la UI de quien lo abre (DoS de interfaz). No es XSS: un token de clase no inyecta markup. Reproducido por especificación; no ejecutado en navegador (regla de la fase) | En `:33`: `const raw = params.get("vista"); const currentView = ["2","3","4"].includes(raw) ? raw : defaultView;` |
| SEC-05 | **Baja** (app; valor del comercio) | `app/extensions/wishlist-transport/assets/wishlist-transport.js:41` → usado en `theme-src/assets/wishlist.js:740` | La regex `^(https:\/\/\|\/(?!\/))` acepta `/\host`. Verificado con el `URL` de WHATWG en Node: `/\evil.example/x` → `https://evil.example/x`. También acepta cualquier host `https` | El valor sale del setting `account_page_url` del app embed (solo el comercio). No hay vector para terceros. Sería un open redirect solo si alguien con acceso al editor lo carga mal | `/^(https:\/\/\|\/(?![\/\\]))/`, o bien `new URL(url, location.origin)` y exigir mismo origen u host de cuentas de Shopify |
| SEC-06 | **Info** | `theme-src/snippets/collection-filters.liquid:85` | `onchange="this.form.submit()"`: es el **único** handler inline del theme. No hay `<script>` inline salvo JSON y JSON-LD | Hoy no es explotable. Impide un CSP sin `unsafe-inline` y no hace falta para funcionar: el mismo form tiene botón submit (`:92`) y ya existe `collection-filters.js` | Quitar el atributo y en `collection-filters.js`: `document.querySelectorAll('.collection-filters select[name="sort_by"]').forEach(s => s.addEventListener("change", () => s.form.requestSubmit()))`. Ver también WCAG 3.2.2 (cambio de contexto al cambiar un select) |
| SEC-07 | **Info** | plataforma | CSP de la Online Store | shopify.dev: "Shopify serves a Content Security Policy (CSP) that limits what a browser loads". También: "The policy has to stay permissive enough for apps and themes". No hay un mecanismo oficial documentado para que el comercio fije headers HTTP en la Online Store (**NOT_VERIFIED**). Un `<meta http-equiv>` no admite `frame-ancestors`, y `content_for_header` inyecta scripts de Shopify | **No** agregar un CSP por `<meta>`. Mantener el theme sin JS inline (SEC-06) y sin orígenes de terceros (hoy 0) |
| SEC-08 | **Info** (PASS) | `app/server/proxy-signature.mjs:38-51`, `:79-115` | La firma del proxy concatena `k=v` ordenados **sin separador** (algoritmo de Shopify: ambigüedad de canonicalización por diseño) | No es explotable: la firma nunca llega al navegador (proxy servidor a servidor) y no se loguea (mutante `signature-logged` muerto). Además hay ventana de ±300 s y exigencia de un único valor en `signature`, `timestamp`, `shop`, `path_prefix` y `logged_in_customer_id` | Mantener |
| SEC-09 | **Info** (GO/NO-GO 8) | `app/server/handlers.mjs:150-154`; `app/.../wishlist-transport.js:79` | Defensa CSRF de E1 con el header `X-Radaelli-Wishlist: 1` | shopify.dev: "Other headers are also stripped due to security concerns". No lista los headers de request. Si el proxy lo descarta, todo E1 responde 400 `missing_csrf_header`. `wishlist.js` reintenta 3 veces, con tope (`RETRY_DELAYS_MS`, `:66`) | Validar con la app instalada. Si se descarta, usar `REQUIRE_CSRF_HEADER=false`: E1 sigue protegido por el 415 ante `Content-Type` que no sea JSON (`handlers.mjs:149`) y por el preflight CORS de `application/json`. Ese respaldo **supone que el proxy reenvía `Content-Type`**; si también lo quita, E1 responde 415 a todo. Hay que verificar los dos headers en la misma prueba (`app/README.md:368`, § 6-P5) |
| SEC-10 | **Info** | `app/server/session-token.mjs:19`, `:81-100` | No valida `iss` ni `jti` (desvío documentado) | Un replay solo es posible con un token robado, dentro de `exp` + 5 s. Las operaciones son idempotentes y de la misma clienta | Aceptar; reevaluar si Shopify documenta `iss` para cuentas |
| SEC-11 | **Info** | `app/server/handlers.mjs:143-147` | El rate limit por clienta va **después** de autenticar | Las firmas inválidas no consumen cuota, pero cuestan un HMAC cada una (barato). Límite en memoria por instancia (documentado) | Aceptar; si el hosting lo ofrece, sumar rate limit por IP en el borde |
| SEC-12 | **Info** (legal, owner) | `content/legal/privacidad.html` (1 línea) | El texto verbatim nombra como únicos proveedores a Wompi, Resend y Cloudinary | Tras migrar, Shopify procesa clientas, checkout y correos. Además la política automática de privacidad de Shopify está publicada: dos textos que pueden contradecirse. Enlaza `/pages/terminos` y `/pages/cookies`, que aún no existen | Decisión de Daniela y revisión legal antes de crear la página. No se inventa texto |
| SEC-13 | **Info** | `theme-src/config/settings_schema.json:7-8` | `theme_info` trae el email de soporte corporativo y `theme_documentation_url` = `github.com/radaelliswimwear-rgb/rada` | Visible en el editor del Admin y para quien tenga el ZIP. No se renderiza en la tienda (no verificado en real) | Si el repo es privado, alcanza. Si no, reemplazar la URL por una pública o quitarla |
| SEC-14 | **Info** | `theme-src/layout/theme.liquid:176` | `owner = sha256(customer.id + ':' + shop.permanent_domain)` en el HTML, solo con `wishlist_account_sync` ON (hoy `false`, `settings_data.json:29`) | El id numérico se puede recuperar por fuerza bruta, pero solo se sirve a la propia clienta en su página. No es un secreto | Aceptar |

## 3. Checklist PASS/FAIL

| # | Control | Resultado | Evidencia |
|---|---|---|---|
| 1 | Secretos, tokens o claves en theme-src, app, legal y ZIPs | **PASS** | § 4: 0 coincidencias de alta señal |
| 2 | `.env*`, `.pem`, `.key` o `.p12` dentro de los ZIPs | **PASS** | 0. Los ZIPs no tienen entradas con `..`, rutas absolutas, ocultas ni symlinks (96 y 34 entradas) |
| 3 | Integridad de los ZIPs | **PASS** | SHA-256 RC1.4 `cba89ac9…a9ca` y app `559c346a…296a`: iguales a 03D |
| 4 | Emails personales | **PASS** | Solo el corporativo, placeholders y fakes de tests (§ 4) |
| 5 | Teléfonos personales | **PASS** | Solo el WhatsApp comercial público; el resto son falsos positivos |
| 6 | PII en logs de la app | **PASS** | `logger.mjs:14-32`: lista blanca de claves. `subj` = HMAC con sal por proceso (`:57-59`). `detail` son códigos fijos (`admin-client.mjs:68`, `handlers.mjs:261`). Mutantes `signature-logged` y `customer-gid-logged` muertos. 0 `console.*` en server, extensiones y assets |
| 7 | HMAC del app proxy | **PASS** | `proxy-signature.mjs`: vectores oficiales `hush` + 27 tests |
| 8 | Session token de la extensión | **PASS** (Info SEC-10) | Rechaza `alg` `none`, RS256 y HS512; valida `exp`/`nbf` con tolerancia, `aud`, `dest` en la allowlist y `sub` de clienta (13 tests) |
| 9 | HMAC de webhooks | **PASS** | `webhook-signature.mjs:19-25`: body crudo, base64 y tiempo constante. Mutante `webhook-hmac-skipped` muerto |
| 10 | Identidad solo de la query firmada o del JWT | **PASS** | Mutante `body-customer-id-accepted` muerto |
| 11 | Tests de la app | **PASS** | 156/156 (§ 5) |
| 12 | Mutantes de la app | **PASS** | 19/19 muertos (§ 5); 20/20 tras SEC-05 |
| 13 | Términos de búsqueda (`search.terms`) | **PASS** (`:53,102`) / **PASS según la doc, confirmar en P2** (`:38,76`) | `main-search.liquid:53,102` con `\| escape`. `:38,76` pasan por `t` con claves sin `_html` (`results_for`, `no_results`; `es.default.json:108,115`). shopify.dev dice "Translated content is escaped by default", pero no dice de forma explícita si eso incluye las variables interpoladas (la página del filtro `translate` tampoco). No agregar `\| escape` al argumento: si Shopify escapa todo el resultado, quedaría doble escape. El predictive no imprime los términos |
| 14 | `current_tags` y `page_title` en `<title>` / `og:title` | **NOT_VERIFIED** → corregir | SEC-02 |
| 15 | `sort_by` reflejado | **FAIL (defensa)**; explotabilidad NOT_VERIFIED | SEC-01 |
| 16 | Valores y etiquetas de filtros | **PASS con observación** | Datos del comercio sin escapar (SEC-03). Excepción: `value.value` de `active_values` (`:80,110`) refleja la URL, **NOT_VERIFIED** (P1b). Las URLs `url_to_add`/`url_to_remove` son de Shopify |
| 17 | Nota, atributos y propiedades del carrito | **PASS** | No se renderizan (`cart-line-item.liquid`, `cart-summary.liquid`, `main-cart.liquid`) |
| 18 | Nombres o email de clienta | **PASS** | 0 `customer.*` impresos. El newsletter no devuelve el email ingresado (`newsletter-home.liquid:27-34`) |
| 19 | Predictive search | **PASS** (términos) / **Baja** (`product.title`) | La URL se arma con `URLSearchParams` (`search.js:104-109`); SEC-03 |
| 20 | Sinks JS: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `new Function`, `document.write`, `setTimeout(string)` | **PASS** | 0 en `assets/*.js` (12 archivos, 3181 líneas) |
| 21 | HTML parseado e insertado | **PASS condicionado** | 3 lugares toman HTML de la Section Rendering API del mismo origen: `cart.js:396-407`, `search.js:138-140` y `wishlist.js:801-810` (este verifica `data-product-id`). Su seguridad depende del escape en Liquid (SEC-01 a SEC-03). `cart.js:44-46` solo usa `textContent` |
| 22 | Open redirect o `location` desde parámetros | **PASS** (theme) / **Baja** (app, SEC-05) | La única navegación, `search.js:207`, usa `link.href` renderizado por el servidor (`product.url`) |
| 23 | `return_to` / `redirect` | **PASS** | 0 usos en el theme. Login y logout son de Shopify (`<shopify-account>`, `routes.account_url`) |
| 24 | Orígenes externos cargados | **PASS** | Solo Shopify: `asset_url`, `image_url`, `font_face`, `video_tag` y `content_for_header`. Instagram, Facebook, TikTok y WhatsApp son enlaces, no cargas. Settings de URL con tipo `url`; 0 settings `html`/`liquid` |
| 25 | `target="_blank"` sin `rel` | **PASS** | 8/8 con `rel="noopener noreferrer"` en el theme y 2/2 en legales |
| 26 | CSP | **N/A para el comercio** (SEC-07) | — |
| 27 | Handlers inline | **FAIL menor** | 1 (SEC-06) |
| 28 | Sanitización del HTML legal | **PASS** | § 4.4: solo `a`, `strong`, `ul`, `ol`, `li`, `h2` y `p`; atributos solo `href`, `target` y `rel`. 0 scripts, `on*`, `style`, comentarios o esquemas `javascript:`/`data:` |
| 29 | Procedencia de la media | **PASS** | § 4.5 |
| 30 | Cambios locales de 03E | **PASS** (neutros para seguridad) | § 7 |

## 4. Escaneo de secretos y datos personales (resultados enmascarados)

### 4.1 Archivos escaneados

- `theme-src`: 97;
- `app`: 35;
- `content/legal`: 7;
- ZIP del theme: 96;
- ZIP de la app: 34.

`app/node_modules` no existe.

### 4.2 Patrones de alta señal: 0 coincidencias en todo el alcance

- **Shopify:** `shpat_`, `shpss_`, `shpca_`, `shppa_`, `shpua_`.
- **Pagos:** `sk_`/`pk_` (`live`/`test`); Wompi `pub_`/`prv_` (`prod`/`test`) y `prod_`/`test_` (`integrity`/`events`).
- **Nubes y servicios:** `AKIA…`, `AIza…`, `ghp_…`, `xox?-…`, `EAA…` (Meta).
- **Claves y credenciales:** PEM `BEGIN … PRIVATE KEY`, `cloudinary://…`, JWT literales `eyJ….….…`.

### 4.3 Asignaciones `secret|password|api_key|token = "<literal>"`

Solo fakes de tests:

- `app/test/helpers.mjs:12` (`FAKE-03D-…-NOT-REAL`);
- `app/test/cas.test.mjs:219-220`;
- `app/test/config.test.mjs:39` (`REEMPLAZAR-…`);
- `app/test/proxy-signature.test.mjs:91`.

Además, los tests usan el secreto `hush` del vector oficial de shopify.dev.

**`.env.example`:** se revisaron solo los nombres de variables y si los valores secretos estaban vacíos o eran placeholders, **sin imprimir valores**. `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_ADMIN_ACCESS_TOKEN` y `ALLOWED_SHOPS` están vacíos o en placeholder. No está en el ZIP. No se abrió ningún otro `.env*`.

### 4.4 Emails y teléfonos

| Tipo | Dónde | Valor enmascarado | Clasificación |
|---|---|---|---|
| Email | `theme-src/config/settings_schema.json:7` (y en el ZIP) | `i***@radaelliswimwear.com` | Corporativo (`theme_info`) |
| Email | `theme-src/locales/es.default.json:56`, `en.json:56` | `t***@email.com`, `y***@email.com` | Placeholder del input de newsletter |
| Email | `theme-src/README.md:194` (no va en el ZIP) | corporativo + `p***@example.com` | Documentación |
| Email | `app/test/*.test.mjs` (y en el ZIP) | `f***@example.com`, `c***@example.com`, `u***@radaelli-fake.myshopify.com` | Fakes de tests |
| Teléfono | `theme-src/config/settings_data.json:45`; `content/legal/devoluciones.html`, `garantia.html`; `content/legal/manifest.json:38,63` | `wa.me/57XXXXXXXX68` | WhatsApp comercial, público en el sitio real |
| Falso positivo | `content/legal/manifest.json:40,79` | fragmentos de SHA-256 | Hashes |
| Falso positivo | `app/test/wishlist-core.test.mjs:132-133` | ids de 20-21 dígitos | Tests de `parseRequestId` |

**Otros:**

- `radaelli-swimwear-dev.myshopify.com` solo aparece en `theme-src/README.md:87`. El handle `radaelli-swimwear-dev` y el id del theme `189072474431` aparecen también en `README.md:102` (comando de push). El README no va en el ZIP.
- 0 `preview_theme_id` con valor en el código. Solo `README.md:98` lo menciona, como `preview_theme_id=…` sin id.
- 0 GIDs reales. Los de `app/test/*.test.mjs` son falsos (`7000000000001`/`…02`).

**HTML legal**, inventario por archivo:

| Archivo | Tags | Atributos | Enlaces | Problemas |
|---|---|---|---|---|
| cookies.html | h2, p, a | `href` | `/pages/privacidad`, `/#contacto` | ninguno |
| devoluciones.html | h2, p, ul, ol, li, strong, a | `href`, `target`, `rel` | `/pages/garantia`, `wa.me/…68` | ninguno |
| envios.html | h2, p, ul, li, strong, a | `href` | `/policies/refund-policy`, `/pages/garantia`, `/#contacto` | ninguno |
| garantia.html | h2, p, ol, li, strong, a | `href`, `target`, `rel` | `/policies/refund-policy`, `wa.me/…68` | ninguno |
| privacidad.html | h2, p, a | `href` | `/pages/terminos`, `/pages/cookies`, `/#contacto` | ninguno (ver SEC-12) |
| terminos.html | h2, p, a | `href` | `/pages/envios`, `/policies/refund-policy`, `/pages/garantia`, `/#contacto` | ninguno |

### 4.5 Procedencia de la media

- **El theme no carga media externa:** todo pasa por `image_url`, `video_tag` o `font_face` de Shopify. `hero.liquid:9-13` documenta que no depende de Cloudinary.
- **Fuentes de migración:**
  - las 13 fuentes de `content/media/media-migration-manifest.csv`, más 190 URLs de imagen en `import/shopify-products-03c.csv` y `source-of-truth/public-scrape-raw.json`, son **todas** de `res.cloudinary.com/n8l3p85c`;
  - es la misma nube que sirve el sitio real: `public-scrape-raw.json` es el scrape público de ese sitio. El host `res.cloudinary.com` es el que permite `next.config.ts:55,61,155` del checkout principal (`commerce-main/next.config.ts`). En la copia del worktree las líneas son `:70,76,171`. `next.config.ts` permite el host, no una nube en particular;
  - 0 orígenes de terceros.

## 5. Tests y mutantes de la app (re-corridos hoy, Node v24.19.0)

**`node --test app/test`**

- **Resultado:** tests 156, suites 7, **pass 156**, fail 0, cancelled 0, skipped 0, en ~1,0 s.
- **Por archivo:** cas 21, config 11, extension 22, handlers 29, proxy-signature 27, session-token 13, transport 9, wishlist-core 24.

**`node app/test/mutants.mjs`**

- **Resultado:** baseline sin mutar PASA; **MUTANTS killed 19/19**.
- **Muertos:**
  - `shop-allowlist-dropped`
  - `timestamp-window-skipped`
  - `body-customer-id-accepted`
  - `cap-applied-to-whole-list`
  - `guest-before-account`
  - `idempotency-always-writes`
  - `no-cas-retry`
  - `compare-digest-dropped`
  - `signature-logged`
  - `customer-gid-logged`
  - `identity-failure-not-401`
  - `cors-on-proxy`
  - `body-limit-disabled`
  - `rate-limit-disabled`
  - `webhook-hmac-skipped`
  - `jwt-alg-not-checked`
  - `jwt-aud-not-checked`
  - `extension-foreign-node-accepted`
  - `transport-csrf-header-missing`

**Controles del backend confirmados en el código**

- **Body:**
  - tope de 32 KB antes de leer (`handlers.mjs:76-108`);
  - JSON estricto (`validateOpsRequest`);
  - `Cache-Control: private, no-store` y `nosniff` (`:43-47`).
- **CORS:**
  - E1 sin CORS;
  - E2 con `*` y autenticación bearer, sin cookies (`:130-133`).
- **Servidor:** timeouts en `server.mjs:36-39`.
- **Mínimo privilegio:**
  - scopes `read/write_customers`, `read_products`, `write_app_proxy` y `customer_read_customers` (`shopify.app.toml:34`);
  - la app solo lee el metafield: nivel 1 de datos protegidos;
  - shopify.dev indica que, para apps con distribución custom, el nivel 1 está "Always available".

## 6. Pruebas pendientes en la tienda real (inofensivas, solo lectura)

Todas se hacen con `?preview_theme_id=189072474431` y "ver código fuente". No escriben nada.

| # | URL | Qué mirar | PASS si |
|---|---|---|---|
| P1 (SEC-01) | `/collections/oasis-natural?sort_by=zz%22zz` | El `<input type="hidden" name="sort_by">` del form de precio | El valor aparece vacío, como `zz&quot;zz` o reemplazado por el orden por defecto. **FAIL** si aparece `value="zz"zz"` |
| P1b (SEC-03, `active_values`) | `/collections/oasis-natural?filter.v.availability=zz%22zz` | Los `<input type="hidden" name="filter.v.availability">` del form de orden | No aparece el input, o el valor sale escapado. **FAIL** si aparece `value="zz"zz"` |
| P2 (SEC-02 y control 13) | `/search?q=%22zz%3C` | `<title>`, `<meta property="og:title">` y el texto "Resultados para…" / "No encontramos…" | Aparecen `&quot;` y `&lt;`, no `"` ni `<` crudos |
| P3 (SEC-02) | `/collections/all/zz%22zz` | `<title>` (sección "tagged"); de paso, `<link rel="canonical">` y `og:url` (URLs que arma Shopify, sin escape en `theme.liquid:12,46`) | Igual que P2 (en las URLs, `%22` o `&quot;`), o 404 |
| P4 (SEC-04) | `/collections/oasis-natural?vista=2%203` en mobile | El botón "Filtrar" abre el drawer | Se abre (hoy se espera FAIL hasta aplicar el fix) |
| P5 (SEC-09) | Con la app instalada: guardar un favorito con sesión | Log de la función: `code` | `ok`: el proxy reenvía `Content-Type` y `X-Radaelli-Wishlist`. `missing_csrf_header` indica que se descarta el header propio; `unsupported_media_type`, que se descarta `Content-Type` |

## 7. Cambios locales sin pushear (theme-src vs RC1.4)

Comparación contra el ZIP extraído: **7 archivos** difieren, más `README.md`, que no va en el ZIP.

| Archivo | Cambio |
|---|---|
| `layout/theme.liquid:14-27` | `meta robots` `noindex` en búsqueda, favoritos y 404 |
| `sections/main-collection.liquid:73-80`, `sections/main-search.liquid:85-92` | Las primeras 4 tarjetas, sin lazy |
| `snippets/product-card.liquid:121` | Imagen secundaria siempre `loading="lazy"` |
| `sections/footer-group.json` | Bloque de menú "ayuda" (`menu: "ayuda"`) agregado entre "comprar" y "contacto" |
| `assets/section-hero.css:175-178`, `assets/section-collection-banner.css:54-57` | `color: inherit` en el h1 |

- **Cambios fuera del listado de la tarea:** `footer-group.json` y los dos CSS no figuraban en la lista de cambios locales de 03E.
- **Seguridad:** los 7 son neutros: no hay outputs nuevos de datos de usuario, ni JS nuevo, ni orígenes nuevos.

## 8. Fuentes oficiales consultadas

- https://shopify.dev/docs/apps/build/security/following-security-best-practices
  - "Escape untrusted content for the exact context you're rendering it into."
  - "Treat all external input as untrusted until you've verified it, including input from Shopify."
  - "This should be considered a backstop, not a hard security control for your code." Se refiere al CSP (sección "Cross-site scripting"). La cita se corrigió en la verificación.
  - Sección "Cross-site scripting": también es la fuente de las dos citas de SEC-07.
- https://shopify.dev/docs/api/liquid/objects/collection: `sort_by` es "The sort order applied to the collection by the `sort_by` URL parameter."
- https://shopify.dev/docs/storefronts/themes/architecture/locales/storefront-locale-files: "Translated content is escaped by default". No detalla de forma explícita las variables interpoladas; https://shopify.dev/docs/api/liquid/filters/translate tampoco (de ahí P2 para el control 13).
- https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies
  - "Shopify strips the `Cookie` header from the request";
  - "Other headers are also stripped due to security concerns."
- https://shopify.dev/docs/apps/build/online-store/app-proxies: lista de headers que se quitan de las **respuestas** del proxy. No detalla los headers de request.
- https://shopify.dev/docs/apps/launch/protected-customer-data: nivel 1 y 2 "Always available" para apps custom.
- https://shopify.dev/docs/api/liquid/objects/page_title y https://shopify.dev/docs/api/liquid/objects/current_tags: **no documentan** si los valores ya vienen escapados (de ahí el `NOT_VERIFIED`).

## 9. Verificación adversarial (2026-09-29)

Se revisó de nuevo cada afirmación contra el código y las fuentes. Sin navegador, sin tienda y sin CLI.

**Re-confirmado:**

- `node --test app/test`: 156/156, con el mismo reparto por archivo.
- `node app/test/mutants.mjs`: baseline PASA y 19/19 muertos.
- SHA-256 de los dos ZIP y cantidad de entradas (96/34). Ninguna entrada oculta, `..`, `.env*` ni claves.
- Conteos del alcance: 97, 35 y 7 archivos.
- 0 coincidencias de alta señal. Los emails y teléfonos coinciden con § 4.4.
- De `.env.example` solo se chequeó, por booleano y sin imprimir valores, que las 4 variables sensibles son placeholders.
- Los 7 archivos que difieren de RC1.4 y sus diffs, que son neutros.
- Todas las citas `archivo:línea` de SEC-01 a SEC-14 y de los controles 6 a 10, 17, 20 a 25 y 28.
- Inventario de tags, atributos y enlaces del HTML legal.
- Media: 13 + 95 + 95 URLs, todas de `res.cloudinary.com/n8l3p85c`.
- 0 títulos del catálogo con `" < > &`.
- SEC-05: bypass `/\host` reproducido con el `URL` de Node; la regex propuesta lo rechaza.
- SEC-04: `RadaelliElement.connectedCallback` (`assets/theme.js:20-22`) no captura errores, así que la excepción corta `onConnect`.
- Citas de shopify.dev: `collection.sort_by`, headers del app proxy, "Always available" y las de SEC-07.

**Corregido en este reporte:**

1. **SEC-01:** el fix decía `append: valid_sort_by | url_encode`. En Liquid eso codifica la URL entera, así que ahora se codifica en un `assign` aparte. También se agregó usar `valid_sort_by` en `:49` y `:114`.
2. **SEC-03 / control 16:** `value.value` en `collection-filters.liquid:80,110` no es solo texto del comercio. Sale de `active_values`, que refleja la URL. Se agregó P1b (`NOT_VERIFIED`).
3. **Control 13:** la doc no dice de forma explícita que se escapen las variables interpoladas en `t`. Pasa a "PASS según la doc, confirmar en P2", y P2 ahora incluye el texto de resultados.
4. **SEC-09 / P5:** el respaldo del 415 supone que el proxy reenvía `Content-Type`. P5 ahora verifica los dos headers.
5. **§ 8:** cita del CSP corregida al texto literal. Además, se atribuyen a esa página las dos citas de SEC-07, que no tenían URL.
6. **§ 4.4 "Otros":** el handle de la tienda y el id del theme también están en `README.md:102`, y `README.md:98` menciona `preview_theme_id=…` sin id. Nada de esto va en el ZIP.
7. **§ 4.5:** `next.config.ts:55,61,155` corresponde al checkout principal, no a la copia del worktree (`:70,76,171`). Permite el host, no la nube.

**Sin cambios de veredicto:** los hallazgos siguen con las mismas severidades.
