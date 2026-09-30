# App Radaelli Favoritos — 0.1.2 (fases 03D–03F; 0.1.1 corrigió SEC-05 y 0.1.2 corrige solo documentación)

App custom mínima de Radaelli Swimwear para los **favoritos de la cuenta** (New Customer Accounts). Guarda la lista de cada clienta en Shopify, en el metafield del comercio `custom.wishlist`, y la muestra en la página "Mis favoritos" de la cuenta.

Se construyó **offline**:
- no se usó la CLI de Shopify;
- no hubo login;
- no se instaló nada;
- no hay secretos reales.

Fuente de verdad del diseño: `accounts-app-design.md` (03D, verificado contra shopify.dev el 2026-09-29) y las decisiones de 02L: `theme/customer-accounts-decision.md` y `theme/customer-accounts-report.md`.

---

## 1. Qué hay y qué no

| Pieza | Estado |
|---|---|
| Función (backend) en `server/` | Hecha y probada offline, sin dependencias (Node >= 20) |
| App embed con el transporte para `wishlist.js` (`extensions/wishlist-transport/`) | Hecho y probado offline (el JS en un vm). El Liquid no se validó |
| Extensión de cuenta "Mis favoritos" (`extensions/mis-favoritos/`) | Lógica probada en Node. La UI (JSX) solo tiene chequeo de sintaxis: no se puede ejecutar ni tipar sin `npm install` |
| `shopify.app.toml` y los TOML de las extensiones | Plantillas con placeholders; sin validar con la CLI |
| Instalación, hosting, secretos, definición del metafield | **Pendiente: pasos de la dueña** (§ 9) |

El theme **no se tocó**. `theme-src/assets/wishlist.js` ya trae el contrato `connectAccount(transport)` (02L). Esta app implementa el transporte y la función que lo atiende.

---

## 2. Arquitectura

```
NAVEGADOR (no confiable)              SHOPIFY (confiable)                          FUNCIÓN (este código, confiable)
wishlist.js del theme
  └ transporte (app embed) ──POST /apps/radaelli/wishlist──► app proxy: agrega shop, logged_in_customer_id,
     {v, add, remove}                                          path_prefix, timestamp, signature; quita Cookie
     sin id de clienta                                          ──► POST /proxy/wishlist?…firmado
                                                                                  HMAC + ventana + allowlists
                                                                                  identidad = SOLO el id firmado
                                                                                  Admin: leer → nodes() → unión
                                                                                  → metafieldsSet(CAS) ×3 → 409
Extensión "Mis favoritos" (Web Worker)
  Customer Account API (lectura) ─────► custom.wishlist
  shopify.query (Storefront) ─────────► imagen, precio, disponibilidad, URL (frescos en cada carga)
  "Quitar": POST /ca/wishlist + Bearer ───────────────────────────────────────► HS256 + exp/nbf/aud/dest/sub
                                                                                  mismo núcleo y mismo CAS
```

Tres reglas de la arquitectura:
- **Sin base de datos y sin almacenamiento persistente.** El único estado vive en memoria y se pierde al reiniciar: el token de *client credentials* (si se usa) y el rate limit.
- **Un solo camino de escritura (R2).** La extensión no escribe con la Customer Account API; "Quitar" pasa por la función.
- **La lista vive en Shopify.** `custom.wishlist` es de tipo `list.product_reference` y guarda los GID en orden de alta. Es del comercio, así que no se pierde si se desinstala la app.

### Archivos

```
app/
├── README.md                     este archivo
├── .env.example                  nombres de variables con placeholders (NO se empaqueta)
├── package.json                  sin dependencias; scripts test / mutants / pack / start
├── shopify.app.toml              config de la app (placeholders; sin client_id)
├── server/
│   ├── server.mjs                arranque HTTP (node:http)
│   ├── handlers.mjs              rutas E1/E2/E3, orden de validación, errores, logs
│   ├── proxy-signature.mjs       firma del app proxy + allowlists + identidad
│   ├── session-token.mjs         session token de la extensión (HS256)
│   ├── webhook-signature.mjs     HMAC de webhooks de compliance
│   ├── wishlist-core.mjs         núcleo puro: schema, ids, unión, tope, idempotencia
│   ├── admin-client.mjs          Admin GraphQL + bucle CAS + token de Admin
│   ├── rate-limit.mjs            token bucket por clienta (en memoria)
│   ├── logger.mjs                logs JSON con lista blanca + correlativo con sal
│   └── config.mjs                variables de entorno (valida, sin valores en errores)
├── extensions/
│   ├── mis-favoritos/            extensión de cuenta (customer-account.page.render)
│   │   ├── shopify.extension.toml
│   │   ├── locales/es.default.json
│   │   └── src/ MisFavoritosPage.jsx (UI) · model.js · api.js · config.js (lógica pura)
│   └── wishlist-transport/       theme app extension (app embed)
│       ├── shopify.extension.toml
│       ├── blocks/wishlist-transport.liquid
│       └── assets/wishlist-transport.js
├── scripts/pack.mjs              zip reproducible → ../dist/radaelli-wishlist-app-0.1.2.zip
└── test/                         node:test (index.js + *.test.mjs), helpers.mjs, mutants.mjs
```

---

## 3. Contrato de endpoints

Constantes: prefijo `apps` + subpath `radaelli`, así que el `path_prefix` esperado es `/apps/radaelli`. La versión de API queda fijada en `2026-07`.

### Body (E1 y E2, el mismo)

`{"v":1, "add":[{"id":"123","handle":"x"}], "remove":["456"]}`. El validador está escrito a mano y es estricto:
- **Claves:** solo `v`, `add` y `remove`. En `add`, solo `id` y `handle`. Cualquier otra clave es `invalid_body`.
- **`v`:** si viene, tiene que ser `1`.
- **Ids:** enteros positivos, como string (`"123"`) o como número seguro (`123`), sin ceros a la izquierda.
- **Tamaño:** hasta 256 `add` y 256 `remove`, y 32 KB de body.
- **`handle`:** string de hasta 255 caracteres. El servidor lo **ignora** y devuelve el canónico.
- **Solapamiento:** un mismo id en `add` y `remove` es `overlap`.

| Operación | Body |
|---|---|
| Leer / bootstrap / reconciliar | `add` y `remove` vacíos o ausentes (no escribe) |
| Alta / unión invitada → cuenta | `add` |
| Quitar | `remove` |

**Respuesta 200:** `{"v":1, "items":[{"id","handle"}], "rejected":[id], "notFound":[id]}`.
- `items` es la lista canónica, en orden.
- `rejected` son las altas que no entraron por el tope de 100.
- `notFound` son los ids que no existen: los de `add` más los que se podaron de la lista.

**Unión (diseño § 7.1):**
1. Primero la cuenta, en su orden.
2. Después las altas, en el orden recibido.
   - Invitada `{A,B,C}` + cuenta `{B,D}` → `[B,D,A,C]`.
3. **Tope de 100 solo para altas nuevas:** una lista heredada de más de 100 **no se recorta**.
4. **Idempotente:** si la lista no cambia, no hay escritura.
5. **CAS:** `metafieldsSet` con `compareDigest`, donde `null` significa "no debe existir". Con `STALE_OBJECT` o `INVALID_COMPARE_DIGEST` se relee y se reintenta. Tras 3 intentos → 409.

### E1 — `POST /proxy/wishlist` (tienda → app proxy)

Orden de validación:
1. método;
2. firma sobre la **query cruda**;
3. ventana de ±300 s;
4. `shop` en la allowlist;
5. `path_prefix` en la allowlist;
6. `logged_in_customer_id`;
7. rate limit;
8. `Content-Type`;
9. `X-Radaelli-Wishlist: 1`;
10. tamaño;
11. JSON;
12. schema;
13. CAS.

Headers de toda respuesta:
- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: private, no-store`
- `X-Content-Type-Options: nosniff`
- **sin** `Access-Control-Allow-Origin` (es mismo origen)

### E2 — `OPTIONS|POST /ca/wishlist` (extensión, session token)

- **`OPTIONS`:** responde 204 con:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: POST, OPTIONS`
  - `Access-Control-Allow-Headers: Authorization, Content-Type`
  - `Access-Control-Max-Age: 600`
- **`POST`:** `Authorization: Bearer <token>` y el mismo body y la misma respuesta que E1, con CORS `*` también en los errores.
  - Es seguro porque la autenticación va por bearer y no por cookies.
  - No lleva header anti-CSRF.

### E3 — `POST /webhooks` (compliance, no-op)

- `X-Shopify-Hmac-SHA256` = base64(HMAC-SHA256(body crudo, client secret)), comparado en tiempo constante.
- Si no coincide: 401. Si coincide: 200 `{"v":1}` sin acción, porque la app no guarda datos de clientas.

### `GET /`

Texto mínimo: la app no tiene panel. Shopify abre `application_url` cuando alguien entra a la app desde el Admin. Sirve también como chequeo de salud.

### Errores (`{"v":1,"error":"<código>"}`)

| HTTP | Código | Cuándo | Qué hace `wishlist.js` |
|---|---|---|---|
| 401 | `invalid_signature`, `stale_request`, `shop_not_allowed`, `prefix_not_allowed`, `no_customer` | falla de identidad en E1; `no_customer` también si la clienta no existe en Admin | `auth-failed`, sin reintento |
| 401 | `missing_token`, `invalid_token`, `token_expired`, `shop_not_allowed`, `no_customer` | falla de identidad en E2 | la extensión muestra "No pudimos confirmar tu sesión…" |
| 400 | `invalid_json`, `invalid_body`, `invalid_id`, `overlap`, `too_many_ops`, `missing_csrf_header` | error del cliente | reintenta y queda `pending`, sin pérdida |
| 405 | `method_not_allowed` (+ `Allow`) | método equivocado | ídem |
| 413 | `body_too_large` | más de 32 KB | ídem |
| 415 | `unsupported_media_type` | no es `application/json` | ídem |
| 429 | `rate_limited` (+ `Retry-After`) | rate limit por clienta | reintento 2/8/30 s |
| 409 | `conflict` | 3 conflictos de CAS | reintento |
| 502 | `admin_error` | `userErrors` que no son de CAS, errores GraphQL o HTTP de Admin | reintento |
| 503 | `admin_throttled` (+ `Retry-After: 2`) | throttle de la Admin API | reintento |
| 504 | `upstream_timeout` | Shopify no respondió dentro del corte (10 s por request) | reintento |
| 404 / 500 | `not_found` / `internal_error` | ruta desconocida / error inesperado | reintento |

### E4 — transporte (app embed)

`assets/wishlist-transport.js` implementa el contrato de `wishlist.js`:
- **Llamada:** `apply({add, remove})` hace `POST /apps/radaelli/wishlist`, mismo origen y sin prefijo de idioma, con `credentials: same-origin` y los headers `Content-Type: application/json` y `X-Radaelli-Wishlist: 1`.
- **Timeout:** 10 s. Un timeout o un error de red rechaza con `status 0`.
- **Errores:** una respuesta que no es JSON rechaza con `502`; cualquier otro código se propaga con su `status`.
- **Registro:** no pisa `window.Radaelli`. Si `wishlist.js` ya cargó, llama a `connectAccount(transport)`; si no, deja `window.Radaelli.wishlistAccountTransport`.
- **Liquid:** solo se imprime con `customer` y no expone datos de la clienta.
- **`accountPageUrl`:** es el setting del embed; si está vacío, se usa `routes.account_url` (R8).

---

## 4. Modelo de seguridad

- **Identidad.** En E1 sale **solo** del `logged_in_customer_id` de la query firmada. En E2 sale **solo** del `sub` del session token verificado.
  - Nunca del body, de headers ni del DOM. El schema rechaza `customerId`, `email` o cualquier clave extra, y los headers de identidad se ignoran (hay tests).
- **Firma del proxy.** Es exactamente el algoritmo de shopify.dev:
  - se quita `signature`, que tiene que venir exactamente una vez y ser 64 hex;
  - los valores repetidos se unen con `,`;
  - se ordenan los strings `k=v` y se concatenan sin separador;
  - HMAC-SHA256 en hex, comparado con `timingSafeEqual`.
  - Reproduce los **vectores oficiales** (secreto `hush`) y el vector FALSO del diseño.
- **Validaciones del proxy.** Ventana de ±300 s (decisión propia, configurable). Tienda exacta `*.myshopify.com` de la allowlist, sin distinguir mayúsculas. `path_prefix` de la allowlist.
- **Session token.** `alg` = HS256 exacto: se rechazan `none`, RS256, HS512. Además:
  - firma en tiempo constante;
  - `exp` y `nbf` obligatorios, con 5 s de tolerancia;
  - `aud` = client id;
  - host de `dest` en la allowlist;
  - `sub` = `gid://shopify/Customer/<id>`.
- **Todas las fallas de identidad son 401 (R7)** para que el cliente no reintente en bucle. El motivo va solo en el body y en el log.
- **CSRF (E1).** POST + `Content-Type: application/json` + header propio `X-Radaelli-Wishlist`. Si GO/NO-GO 8 muestra que el proxy no reenvía el header, se apaga con `REQUIRE_CSRF_HEADER=false` y queda la defensa de `Content-Type`.
- **Token de Admin.** Solo en el servidor (variable de entorno o *client credentials* en memoria). Nunca se loguea ni se devuelve. El dominio al que se llama sale de la allowlist, así que no hay SSRF.
- **Logs sin datos personales (R11).**
  - Nunca se loguean: la query firmada ni la firma, `logged_in_customer_id`, GIDs de clienta, emails, session tokens, token de Admin, bodies ni pares clienta + producto.
  - Sí se loguean: ruta, método, estado, código, latencia, contadores, `rid` aleatorio y `subj`.
  - `subj` = HMAC con sal aleatoria **por proceso**, recortado a 12 hex. Es irreversible.
  - El logger solo acepta claves de una lista blanca. Un test captura los logs y busca ids, firma, token y email.
- **Rate limit.** Token bucket por clienta **en memoria**. Es best effort: cada instancia cuenta por su lado y un reinicio lo borra. Con N instancias, el límite efectivo es N veces el configurado. La protección de fondo sigue siendo el throttle de la Admin API.
- **Tiempos.** Corte total de 10 s para las llamadas a Shopify de cada request (R5). Además: `requestTimeout` de 30 s, `headersTimeout` de 15 s y headers de hasta 16 KB.

---

## 5. Variables de entorno (solo nombres; plantilla en `.env.example`)

La función **no lee archivos `.env`**: las variables las inyecta el hosting. Si falta una variable, o si tiene un valor `REEMPLAZAR…`, la función no arranca. El error nombra la variable, nunca su valor.

| Variable | Obligatoria | Por defecto | Uso |
|---|---|---|---|
| `SHOPIFY_API_KEY` | sí | — | client id (`aud` del session token; client credentials) |
| `SHOPIFY_API_SECRET` | sí (secreto) | — | HMAC del proxy, session token, webhooks |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | con `ADMIN_TOKEN_SOURCE=env` (secreto) | — | token offline de **una** tienda (R3b) |
| `ALLOWED_SHOPS` | sí | — | dominios `*.myshopify.com`, separados por coma. Con token `env`, uno solo |
| `ALLOWED_PATH_PREFIXES` | no | `/apps/radaelli` | prefijos de proxy aceptados |
| `ADMIN_TOKEN_SOURCE` | no | `env` | `env` o `client_credentials` (misma organización, R3a) |
| `SHOPIFY_API_VERSION` | no | `2026-07` | versión fijada de la Admin API |
| `PROXY_MAX_SKEW_SEC` | no | `300` | ventana del timestamp |
| `SESSION_TOKEN_LEEWAY_SEC` | no | `5` | tolerancia de `exp`/`nbf` |
| `REQUIRE_CSRF_HEADER` | no | `true` | exigir `X-Radaelli-Wishlist: 1` (GO/NO-GO 8) |
| `UPSTREAM_TIMEOUT_MS` | no | `10000` | corte total de las llamadas a Shopify por request |
| `RATE_LIMIT_BURST` / `RATE_LIMIT_PER_MINUTE` | no | `20` / `30` | token bucket por clienta |
| `EMPTY_LIST_STRATEGY` | no | `set_empty` | `set_empty` (`"[]"` + CAS) o `delete` (sin CAS) — GO/NO-GO 10 |
| `PORT` / `HOST` | no | `8080` / `0.0.0.0` | escucha HTTP (el hosting pone HTTPS delante) |

---

## 6. Pruebas, mutantes y paquete

Se usa el runner de Node, sin dependencias. Probado con Node 24.19.

```
node --test app/test          # desde shopify-migration/  (o: cd app && npm test)
node app/test/mutants.mjs     # prueba de mutación (o: npm run mutants)
node app/scripts/pack.mjs     # zip reproducible + SHA-256 (o: npm run pack)
```

- **Cómo arranca la suite:** `test/index.js` importa todos los `*.test.mjs`. En Node >= 22, `node --test <carpeta>` resuelve la carpeta a ese `index.js`. En Node 20, la carpeta se recorre y algunos tests pueden correr dos veces; eso no cambia el resultado.
- **Qué cubren los tests:**
  - firma: vectores oficiales `hush` y vector FALSO;
  - session token;
  - núcleo, CAS y concurrencia contra un Admin GraphQL simulado;
  - endpoints sobre un servidor HTTP real en `127.0.0.1` con Shopify simulado;
  - logs sin datos personales;
  - lógica pura de la extensión;
  - transporte del app embed, ejecutado en `vm`;
  - chequeos estáticos de los TOML y de `.env.example`.
- **Mutantes:** `mutants.mjs` copia la app a una carpeta temporal (`MUTANTS_TMPDIR` o la del sistema) y aplica 20 errores chicos, uno por vez. Para cada uno verifica que la suite falle.
- **Zip:**
  - Las entradas van ordenadas, con fecha fija 1980-01-01, permisos 0644 y sin compresión. Los mismos bytes de entrada dan el mismo SHA-256.
  - Ojo con `core.autocrlf` de git: cambia los finales de línea al hacer checkout y, con ellos, el hash.
  - Excluye `.env*` (también `.env.example`), `node_modules`, `.git`, `.shopify`, `dist` y `*.log`.

---

## 7. Extensión "Mis favoritos"

- **Target:** `customer-account.page.render` (full-page), con `api_access = true` (Storefront) y `network_access = true` (función).
- **Lectura:**
  - La lista sale de la Customer Account API: `customer.metafield(namespace:"custom", key:"wishlist").value`.
  - Los productos salen de `shopify.query` → `nodes(ids)` en **cada carga**: título, imagen, precio mínimo y máximo, `availableForSale` y `onlineStoreUrl`. No se guarda precio ni stock.
- **Estados por producto:**
  - `available`: link, precio y "Disponible";
  - `sold_out`: link, precio y "Agotado";
  - `unavailable`: sin página en la tienda online, así que sin link ni precio;
  - `deleted`: la Storefront API devuelve `null`.
  - En los dos últimos se muestra "Este producto ya no está disponible." y se puede quitar.
- **Quitar:** `POST {BACKEND_URL}/ca/wishlist` con session token. La vista se reordena con los `items` que devuelve la función. Si la cuenta trae ids nuevos (por ejemplo, de otro dispositivo), la lista se recarga.
- **Confirmación y errores:** la confirmación sale con `shopify.toast.show`; los errores, en un `s-banner` crítico. Con `BACKEND_URL` en placeholder, "Quitar" muestra error y no llama a nada.
- **Accesibilidad:**
  - la lista es `unordered-list` / `list-item`;
  - los botones tienen `accessibilityLabel`: "Eliminar {título} de favoritos" y "Ver producto: {título}";
  - hay spinner con etiqueta y aviso de estado.
- **Textos (`locales/es.default.json`):**
  - Salen de `theme-src/locales/es.default.json` → `general.wishlist` y `products.product` (`available`, `sold_out`, `price_from`).
  - Hay **tres textos nuevos, funcionales**, que Daniela tiene que revisar: `error_load`, `error_remove` y `error_session`. Imitan el voseo de `load_error` y `sync_auth`.
  - El título es "Mis favoritos", como en la decisión 02L.
  - No hay copy de marketing.
- **Lógica fuera de la UI:** toda la lógica está en `model.js` / `api.js` (probados en Node). `MisFavoritosPage.jsx` solo dibuja.
- **Chequeos offline de la UI:**
  - El JSX pasó un **chequeo de sintaxis** con el TypeScript 5.8 que ya estaba instalado en el proyecto principal (transpilado + `node --check`), sin instalar nada.
  - **No** se tipó contra `@shopify/ui-extensions` ni se ejecutó.
  - El código propio mide ~8,4 KB minificado (esbuild ya instalado, con preact y `@shopify/*` como externos). El límite es 128 KB para full-page, **sin contar** las dependencias.

### `extensionDependencies` (NO instaladas)

La CLI las define al generar la extensión (`shopify app generate extension --template customer_account_ui`). Se instalan después, con permiso: esta entrega no corre `npm install`.

```jsonc
// extensionDependencies — para extensions/mis-favoritos/package.json (a confirmar con la plantilla de la CLI)
{
  "preact": "^10",                      // runtime de la UI
  "@shopify/ui-extensions": "2026.7.x"  // alineada con api_version = "2026-07" (versión exacta: la de la plantilla)
}
```

El backend **no tiene dependencias** y no las necesita.

---

## 8. Cómo desplegar e instalar (más adelante, con la dueña)

1. **Hosting de la función.** Cualquier runtime de Node >= 20 con HTTPS; no necesita base de datos.
   - Comando: `node server/server.mjs`.
   - Chequeo: `GET /`.
   - Las variables de § 5 van en el **gestor de secretos del hosting**.
2. **Reemplazar los placeholders** `REEMPLAZAR-host-de-la-funcion.example` por el host real:
   - en `shopify.app.toml`: `application_url`, `[app_proxy] url` (`…/proxy`) y `[auth] redirect_urls`;
   - en `extensions/mis-favoritos/src/config.js`: `BACKEND_URL`.
3. **Vincular la app.** `shopify app config link` escribe `client_id`, pero **reescribe el TOML con la config remota**. Antes guardá una copia de este `shopify.app.toml` y después volvé a aplicar sus secciones: scopes, `app_proxy`, `webhooks`, `embedded`, `build`.
4. **Instalar las dependencias de la extensión** (§ 7) y probar con `shopify app dev` en la Dev Store.
5. **Publicar:** `shopify app deploy` sube la config y las dos extensiones.
6. **Instalar** en la tienda con el link de custom distribution. Hay que aceptar los scopes.
7. **Theme y cuenta:**
   - Activar el app embed "Favoritos en la cuenta" en el editor del theme.
   - Agregar "Mis favoritos" al menú de la cuenta en el editor de checkout y cuentas.
   - Pegar la URL de esa página en el setting del embed.
8. **GO/NO-GO en la Dev Store** (§ 10). Solo si pasan, se enciende `wishlist_account_sync` en el theme.

---

## 9. Pasos que requieren a la dueña (Claude no los hace)

1. **Cuenta de desarrolladora y organización** en el Dev Dashboard. Claude **no crea cuentas**.
2. **Login de desarrolladora** en la CLI (código de dispositivo aprobado por Daniela), `shopify app init` / `shopify app config link`. Esto crea o vincula la app y completa `client_id`.
3. **Elegir custom distribution** en el Dev Dashboard. **Es irreversible** ("can't be changed after you select it").
4. **Instalar la app** en la tienda con el link de custom distribution, aceptando los scopes (consentimiento OAuth, permiso explícito).
5. **"Allow network access"** para la extensión en el Dev Dashboard (API access). Según la doc, la aprobación es automática.
6. **Crear la definición `custom.wishlist`** en Admin > Configuración > Datos personalizados > Clientes:
   - tipo **lista de referencias a producto**;
   - acceso **Customer accounts: Lectura** (si el Admin ofrece solo "Lectura y escritura", lo que ofrezca);
   - **sin** validación `list.max`, porque rompería la regla de no recortar listas heredadas.
   - Es un cambio de configuración de la tienda.
7. **Hosting de la función y carga de secretos:** client id, client secret y token de Admin si aplica R3b. Daniela los carga en el gestor del hosting. Claude **nunca** los ve ni los imprime.
8. **Token de Admin (R3).**
   - Si la tienda está en la misma organización de la app: `ADMIN_TOKEN_SOURCE=client_credentials`.
   - Si no (probable en producción): hace falta un **token offline**. Esta versión **no trae** la ruta de instalación para obtenerlo (ver Desvíos); hay que decidir cómo se obtiene sin que pase por un chat.
9. **Activar el app embed** y **agregar "Mis favoritos" al menú de la cuenta.**
10. **Ingresar con código de clienta** en la Dev Store para los GO/NO-GO (`DEFERRED_OWNER_ONLY_BLOCKER`, 03B).
11. **Encender `wishlist_account_sync`** recién después de los GO/NO-GO.

---

## 10. Lo que NO se verificó (necesita una tienda real)

Todo lo de abajo quedó escrito según la doc o el diseño, pero sin probar contra Shopify.

- **Validación de la CLI:** `shopify.app.toml`, los dos `shopify.extension.toml` y el Liquid del app embed (schema, `url` setting, `routes.account_url`).
- **App proxy:**
  - `logged_in_customer_id` con New Customer Accounts (GO/NO-GO 2);
  - si reenvía `Content-Type` y `X-Radaelli-Wishlist` (GO/NO-GO 8);
  - si funciona con la Dev Store protegida con contraseña (GO/NO-GO 13);
  - su propio timeout;
  - que no haya cache entre clientas (GO/NO-GO 3).
- **Admin API:**
  - si `metafieldsSet` acepta `"[]"` (GO/NO-GO 10);
  - qué `userErrors.code` llega con un digest viejo (GO/NO-GO 4 y 15);
  - si `nodes()` devuelve `null` para un producto borrado (GO/NO-GO 11);
  - el máximo de ids de `nodes()` (se usan lotes de 100);
  - la forma real del throttle (`extensions.code = "THROTTLED"`);
  - los rate limits.
- **Session token de cuentas:** el formato real de `dest` (GO/NO-GO 12) y que `sub` venga con `read_customers`.
- **Extensión:**
  - lectura de `custom.wishlist` por la Customer Account API con el acceso configurado;
  - que `shopify.query` devuelva `onlineStoreUrl` e imagen (GO/NO-GO 14);
  - el render de los componentes Polaris y sus props (`gap="small"`, `s-product-thumbnail`, `accessibilityRole`);
  - `shopify.i18n.translate` con plurales;
  - `formatCurrency({currency})`;
  - `shopify.toast`;
  - CORS desde el Web Worker;
  - el tamaño del bundle con dependencias.
- **Token de Admin:** *client credentials* real (misma organización) y obtención del token offline.
- **Plan:** que la extensión full-page funcione con custom distribution en el plan real (GO/NO-GO 6).

---

## 11. Desvíos del diseño (y por qué)

1. **Se incluyó el app embed (E4)** aunque el pedido de 03D no lo listaba. Motivo: sin él, `wishlist.js` no tiene transporte y el proxy queda inalcanzable. El diseño lo pide (R1, E4).
2. **Ids más estrictos:** `^[1-9][0-9]{0,19}$` en vez de `^[0-9]{1,20}$`, es decir, sin `0` ni ceros a la izquierda. Motivo: "7" y "07" serían dos favoritos distintos. Shopify y `wishlist.js` nunca los generan. Si llegaran, la respuesta sería 400 y el cliente conserva la intención sin pérdida.
3. **Códigos de error agregados:**
   - E2: `missing_token`, `invalid_token`, `token_expired` (el diseño no los enumeraba);
   - `429 rate_limited`, `504 upstream_timeout`, `404 not_found`, `500 internal_error`;
   - `401 no_customer` si la clienta firmada no existe en Admin.
   - Todos, salvo el 401, se reintentan en el cliente.
4. **Rate limit por clienta en memoria (best effort).** `REPORT § 14` decía "sin rate limit propio sin KV"; se agregó porque lo pide 03D, documentado como no global. Va entre la identidad (paso 6) y `Content-Type` (paso 7).
5. **Timeout = corte total por request** (10 s para todas las llamadas a Shopify del CAS), no 10 s por llamada. Motivo: el cliente también corta a los 10 s.
6. **Lista vacía (R9):** en vez de un fallback automático, se elige con `EMPTY_LIST_STRATEGY` según el resultado de GO/NO-GO 10. Con `delete` se relee el digest justo antes de borrar: achica la ventana, pero el riesgo residual del diseño sigue.
7. **`dest` del session token:** se acepta `https://<tienda>` o el dominio solo, porque el formato está sin verificar (GO/NO-GO 12). `iss` no se valida porque la doc de cuentas no lo lista.
8. **R3b sin ruta de instalación.** El token offline se lee de `SHOPIFY_ADMIN_ACCESS_TOKEN`. La ruta OAuth para obtenerlo no se construyó: hay que decidir cómo llega al gestor de secretos sin exponerlo. *Client credentials* (R3a) sí está. `[auth] redirect_urls` queda como placeholder obligatorio del formato.
9. **Token `env` = una sola tienda** en `ALLOWED_SHOPS`, para no usar el token de una tienda contra otra.
10. **`GET /` agregado** (texto plano). Shopify abre `application_url` desde el Admin en apps no embebidas.
11. **Un solo endpoint E1 para leer, unir, quitar y reconciliar**, como en el diseño: el body define la operación. No hay rutas separadas.
12. **`nodes()` en lotes de 100**, porque el máximo de Admin no está documentado.
13. **`.env.example` no va en el zip.** La regla es excluir `.env*`; los nombres de las variables están en § 5.
14. **Aviso de error de la extensión no descartable:** se limpia con la próxima acción. Se evitó depender del nombre del evento `dismiss` en Preact, que no se pudo verificar.
