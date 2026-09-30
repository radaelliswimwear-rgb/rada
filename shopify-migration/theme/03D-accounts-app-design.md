# App de cuentas Radaelli: diseño verificado (re-auditoría 02L, 03D)

Fecha: 2026-09-29. Trabajo **de solo lectura** sobre el proyecto. Los únicos archivos creados están en este scratchpad (`03d/`). No se usó la CLI de Shopify, no se instalaron paquetes, no se abrió el navegador, no se tocó git y no se leyó ningún secreto. No se buscaron archivos `.env` porque esta tarea no los necesita.

**Abreviaturas de archivos citados** (todos en solo lectura):
- `REPORT` = `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/theme/customer-accounts-report.md`
- `DECISION` = `.../shopify-migration/theme/customer-accounts-decision.md`
- `W` = `.../shopify-migration/theme-src/assets/wishlist.js`
- `L` = `.../shopify-migration/theme-src/layout/theme.liquid`
- `TJS` = `.../shopify-migration/theme-src/assets/theme.js`
- `03A` / `03B` = `.../shopify-migration/theme/03A-development-store-upload-report.md` / `03B-store-foundation-report.md`
- `REF` = `03d/ref-impl.mjs` (implementación de referencia de este trabajo; 28/28 PASS)

---

## 0. Veredicto

**La arquitectura 02L se CONFIRMA en lo esencial, con 11 revisiones** (R1–R11, § 4). Lo que se mantiene:
- Metafield del comercio `custom.wishlist` (`list.product_reference`).
- App proxy firmado para escribir desde la tienda.
- Admin `metafieldsSet` con `compareDigest`.
- Extensión full-page para "Mis favoritos".
- Contrato `connectAccount(transport)` del theme, sin cambios.

Las revisiones importantes son cuatro:
1. **La app no puede ser "solo extensiones"**: el app proxy y la función necesitan un backend propio (R1).
2. **Un solo camino de escritura**: "Quitar" en la extensión se hace con un session token contra la misma función. La Customer Account API queda en solo lectura, y GO/NO-GO 5 pasa a ser opcional (R2).
3. **El token de Admin "sin estado" no está garantizado**: client credentials solo sirve si la tienda está en la misma organización. Si no, hace falta un token offline guardado como secreto (R3).
4. **El transporte necesita timeout**, porque `wishlist.js` mantiene el Web Lock mientras dura la request (R5).

---

## 1. Re-auditoría 02L: qué dice y qué hay en el código

| Punto 02L | Dónde lo dice | Qué hay en el código | Estado |
|---|---|---|---|
| Modo cuenta solo con bootstrap Liquid **y** transporte de la app | `REPORT:330-332`, `DECISION:29` | `W:887-892` (`connectAccount` exige `accountState.kind === "account"` y `transport.apply` función); `W:913` (transporte registrado antes de cargar) | OK |
| Bootstrap inerte detrás de `wishlist_account_sync` | `REPORT:286-290` | `L:143-180`: `L:144` setting; `L:159` `customer`; `L:161` owner = `sha256(customer.id:permanent_domain)`; `L:162` `customer.metafields.custom.wishlist.value`; `L:168` saltea `nil`; `L:176` `{"v":1,"signedOut":true}` | OK |
| Owner válido = 64 hex | `REPORT:331` | `W:285` | OK |
| Contrato del transporte | `REPORT:334-340` | `W:25-32` (comentario), `W:499` (llamada), `W:503-506` (lectura de `items/rejected/notFound`) | OK. **Precisión nueva:** `items[].id` debe ser **numérico**; `W:81` descarta ids que no cumplan `^\d+$` (un GID se perdería). Ver § 5 |
| Unión `[B,D,A,C]` | `REPORT:357` | `W:101-111` (`core.union`) | OK; el servidor replica el orden (§ 7) |
| Vista = base ⊕ invitada pendiente ⊕ cola | `REPORT:384` | `W:387-393` | OK |
| Cola por clienta con TTL de 30 días y aviso | `REPORT:394-395` | `W:67`, `W:336-359` (`W:344` vencimiento, `W:347` marca aviso), `W:433` | OK |
| Web Lock | `REPORT:361` | `W:306-312`, `W:483` | OK. **Hallazgo:** el lock se mantiene durante `await this.transport.apply` (`W:483-499`). Si la request queda colgada, las otras pestañas no sincronizan → el transporte **debe** tener timeout (R5) |
| BroadcastChannel `base` / `signed-out` | `REPORT:373`, `REPORT:396` | `W:415-426`, `W:530`, `W:876-880` | OK |
| 401 sin bucle | `REPORT:375` | `W:545-549` | OK |
| Reintentos 2/8/30 s | `REPORT:351`, `REPORT:376` | `W:66`, `W:550-555`. Cualquier error ≠ 401 se reintenta (400/405/415 incluidos) | OK. Consecuencia para el contrato: toda falla de identidad debe ser **401** (R7) |
| Poda de invitada solo tras 200 | `REPORT:371` | `W:519-522` | OK |
| Tope 100 para altas; nunca recortar | `REPORT:284` | `W:63`, `W:460` | OK; el servidor aplica la misma regla (§ 7) |
| `window.Radaelli` no se pisa si la app cargó antes | (implícito en `REPORT:332`) | `TJS:42` (`window.Radaelli = window.Radaelli \|\| {}`) | OK. El script de la app también debe usar `\|\|` (§ 5.4) |
| `wishlist.js` se carga como módulo diferido | — | `L:179` (`defer`, `type="module"`) | El app embed carga con `<script async>` (doc de theme app extensions), así que el orden no está garantizado. `W:903-913` cubre los dos órdenes |

No se encontraron contradicciones entre `REPORT`, `DECISION` y el código, salvo la del tipo de app (`REPORT:96` frente a `REPORT:311-318`), que se resuelve en R1.

---

## 2. Verificación contra la documentación oficial vigente (2026-09-29)

Fuentes: solo shopify.dev y help.shopify.com. "Doc:" = lo que dice hoy la página.

### (a) Firma del app proxy

| Tema | Doc actual | 02L | Veredicto |
|---|---|---|---|
| Parámetros agregados | `shop` (dominio `{shop}.myshopify.com`), `logged_in_customer_id` ("If no customer is logged in, then this value is empty"), `path_prefix` ("prefix and subpath which was proxied"), `timestamp` (segundos Unix), `signature` (HMAC-SHA256 hex). [authenticate-app-proxies] | `REPORT:97` | **Confirmado** |
| Cálculo | Se quita `signature`. Cada par `"k=v"` une los valores repetidos con coma. Se **ordenan los strings** y se concatenan sin separador. HMAC-SHA256 con el secreto compartido, en hex. Comparación con `secure_compare`. [authenticate-app-proxies] | `REPORT:97` | **Confirmado.** El vector oficial se reproduce (§ 6.2) |
| Método y body | "Both the request method and request body are forwarded" [authenticate-app-proxies] | `REPORT:97` | **Confirmado** |
| Cookies | Se quita `Cookie` del request y `Set-Cookie` de la respuesta. La respuesta pierde 19 headers más (incluidos `Pragma`, `Server`, `Date`). `Cache-Control` **no** está en la lista. [app-proxies] | `REPORT:97` | **Confirmado.** `Cache-Control: private, no-store` sigue sirviendo |
| Tolerancia del timestamp | **No documentada** | ±300 s (`REPORT:297`) | Los ±300 s son **decisión propia**, no requisito de Shopify |
| Validación recomendada | "The app must also verify that the `logged_in_customer_id` … matches the customer that's associated with the requested data" [authenticate-app-proxies] | `REPORT:294-298` | **Confirmado.** El dueño se toma SOLO del parámetro firmado |
| Qué cubre la firma | Solo los parámetros de la query. **El body no va firmado** (se deduce del algoritmo) | no dicho | **Nuevo (R11):** no loguear nunca la query firmada. Quien la tenga puede reenviarla con otro body dentro de la ventana |
| Configuración | `[app_proxy] url, prefix, subpath`. Prefijos: `a`, `apps`, `community`, `tools`. Subpath de hasta 30 caracteres (letras, números, `_`, `-`); no puede ser `admin`, `services`, `password` ni `login`. `/apps/<subpath>/child` → `<url>/child` [app-proxies] | — | Se usa en § 5 |
| `logged_in_customer_id` con cuentas nuevas | La doc solo dice "empty if not logged in". El changelog oficial del parámetro da **404**. No hay promesa específica para New Customer Accounts | `REPORT:98` (incierto → B2) | **Sin cambios: GO/NO-GO 2** |
| Desde una extensión de cuenta | "The `logged_in_customer_id` query parameter isn't assigned. Use a session token instead" [customer-accounts/capabilities] | `REPORT:99` | **Confirmado** |

### (b) Metafield, `metafieldsSet`, CAS, propiedad y desinstalación

| Tema | Doc actual | 02L | Veredicto |
|---|---|---|---|
| Máximo de ítems `list.*` | "All list types have a maximum of 128 items except metaobject references (1024)". Cada ítem tiene el límite de su tipo simple [metafield-limits] | `REPORT:100` | **Confirmado** |
| Validaciones `list.min` / `list.max` | Existen para cualquier lista [list-of-validation-options] | — | **No usar `list.max`**: rompería la regla "una lista existente >100 nunca se recorta" (migración) |
| Definiciones | 256 por tipo de recurso (comercio) y 256 por app [metafield-limits] | `REPORT:100` | Confirmado (se usa 1) |
| `metafieldsSet` (Admin) | Máx. 25 metafields por llamada y 10 MB. **Atómico**. `compareDigest`: solo escribe si coincide el digest; `null` = "debe no existir". `type` es opcional si hay definición. `namespace` omitido = el reservado de la app. Versión mostrada: 2026-07 [metafieldsSet, MetafieldsSetInput] | `REPORT:299` | **Confirmado** |
| Código de error de CAS | El enum tiene `STALE_OBJECT` ("modified since it was loaded") e `INVALID_COMPARE_DIGEST` ("compareDigest is invalid"). **No se documenta cuál devuelve un digest viejo** [MetafieldsSetUserErrorCode] | GO/NO-GO 4 | El servidor trata **ambos** como conflicto (§ 7). GO/NO-GO 4 registra cuál llega |
| `compareDigest` legible | Existe en `Metafield` de Admin y de la Customer Account API [objects/Metafield ×2] | — | Confirmado |
| Borrar con CAS | `metafieldsDelete` usa `MetafieldIdentifierInput` (`ownerId`, `namespace`, `key`): **sin `compareDigest`** | — | **Nuevo (R9):** para vaciar la lista hay que usar `metafieldsSet` con `"[]"` y CAS. Que acepte una lista vacía **no está documentado** → GO/NO-GO 10 |
| App crea definición en `custom` | Sí, con GraphQL `metafieldDefinitionCreate` (namespace no reservado). **No** desde `shopify.app.toml` ("Merchant-owned definitions can't be created in shopify.app.toml"). La definición queda editable por el comercio [ownership] | "Creado en Admin, nunca en el TOML" (`REPORT:276`) | **Confirmado**, con matiz: la app *podría* crearla por GraphQL. Se mantiene **crearla en Admin**, porque el acceso Customer Account de una definición del comercio "can only be configured through the Shopify admin" [use-access-controls-metafields] |
| Acceso de apps a `custom.*` | "readable and writable by merchants and all apps with appropriate scopes" [ownership, permissions] | `REPORT:248` (fila "Escribir desde la tienda", opción D) | Confirmado |
| `$app` al desinstalar | Shopify **borra las definiciones** de la app y "temporarily retains the metafields … without a definition". "Shopify doesn't guarantee how long". Al reinstalar las recrea con **otros GID** [metafields/definitions] | "se borran al desinstalar" (`REPORT:101`, `REPORT:280`) | **Confirmado con precisión:** no se borran en el acto, pero no hay garantía de retención. La conclusión (no usar `$app`) se refuerza |
| Persistencia de `custom.*` al desinstalar | Ninguna página consultada lo dice explícitamente | `REPORT:561` "sobrevive" | **Inferencia** (es un dato del comercio, no de la app). Se marca como tal |
| Customer Account API → escribir `custom.*` | La guía de metafields en cuentas solo muestra definiciones **de la app** (`$app`, TOML con `access.customer_account = "read_write"`) [customer-accounts/metafields]. En el Help Center, el acceso "Customer accounts" dice solo "Definition is available through the Customer Account API", sin distinguir lectura de escritura [custom-data/options] | B5 sin confirmar (`REPORT:93`) | **Sigue sin confirmar.** R2 evita depender de esto |
| Scopes | `read_customers`/`write_customers` (Customer), `read_products`, `write_app_proxy` (configuración del proxy), `customer_read_customers`/`customer_write_customers` [access-scopes]. La Customer Account API necesita datos protegidos **nivel 1** [customer-accounts/metafields] | `REPORT:316` | Confirmado. R2 quita `customer_write_customers` |

### (c) Customer Account UI extensions

| Tema | Doc actual | 02L | Veredicto |
|---|---|---|---|
| Target | `customer-account.page.render` (página propia: "wishlists, loyalty") y `customer-account.order.page.render` (atado a un pedido, sin link directo). Un target full-page **no** puede convivir con otros en la misma extensión. Una sola vez por extensión [targets/full-page, full-page-extensions] | `REPORT:94` | **Confirmado** |
| Menú y links | Al agregarla en el editor de checkout y cuentas, se ofrece sumarla al menú de la cuenta. `page.render` permite link directo y puede ir en menús de la tienda o de la cuenta [targets/full-page, full-page-extensions] | `REPORT:407` | Confirmado. **El formato exacto de la URL no está documentado** en las páginas consultadas → R8 |
| Productos | `shopify.query()` a la **Storefront API** con `api_access = true`; autenticación automática; límites de la Storefront API [storefront-api target API, capabilities] | `REPORT:408` | **Confirmado** |
| Metafield de la clienta | `fetch('shopify://customer-account/api/{version}/graphql.json')` con autenticación automática [customer-account-api target API] | `REPORT:408` | Confirmado |
| Backend externo | `network_access = true` + habilitarlo en el **Partner Dashboard** (API access > "Allow network access…"). Aprobación **automática**. El servidor debe responder `Access-Control-Allow-Origin: *` (Web Worker, sin origen reconocible) [customer-accounts/capabilities, customer-account-ui-extensions] | `REPORT:412` ("por CORS") | Confirmado y precisado |
| Session token | `aud` = client id; `exp` 5 min; `nbf`, `iat`, `jti`, `dest`. `sub` = GID del cliente, **solo si hay sesión y la app tiene `read_customers`**. Validar firma, `exp` y `aud` con el secreto de la app [session-token-api]. Algoritmo **HS256** con el client secret [session-tokens (admin)] | `REPORT:412` | Confirmado. **Formato de `dest` en cuentas: sin verificar** → GO/NO-GO 12 |
| Tamaño | Bundle de 64 KB, **128 KB** para full-page. Sin CSS ni HTML propios (componentes web Polaris) [customer-account-ui-extensions] | `REPORT:414` | Confirmado |
| Cuentas nuevas | "Legacy customer accounts don't support customer account UI extensions" [customer-accounts] | — | La Dev Store ya tiene cuentas nuevas: `03A:132` (`shop.customer_accounts_enabled = true`), `03B:165` |
| Probar en Dev Store | Usuario con permisos de desarrollo, Dev Store, CLI al día, Chrome/Firefox. Se recomienda "an order associated with the email address you'll use to log in". Se prueba con `shopify app dev` y la consola (`p`) [start-building, build-new-pages] | `REPORT:584` (B6) | Confirmado. El ingreso con código sigue siendo un **bloqueo solo de la dueña** (`03B:264`) |
| Plan | "Apps built with UI extensions for all customer accounts pages" → **Basic o superior**; "Custom apps built with Shopify Functions" → solo Plus (no se usan) [help: checkout-apps] | `REPORT:95` | **Confirmado.** Custom distribution en el plan real sigue como B6 |
| Datos protegidos | Custom apps: nivel 1 y 2 "Always available". Apps solo en Dev Store: sin aprobación [protected-customer-data] | `REPORT:316` | Confirmado |

### (d) CLI y alta de la app

| Tema | Doc actual | Consecuencia |
|---|---|---|
| `shopify app init` | Pide "log in to your developer account", elegir una **organización** vinculada a la Dev Store, y **crea la app en el Dev Dashboard**. En modo no interactivo exige `--client-id`, o `--name` + `--organization-id`. `--template reactRouter\|none` [scaffold-app, app-init] | No se puede hacer offline ni sin la cuenta de desarrollador de Daniela. Claude **no crea cuentas** |
| `shopify app dev` | Hay que ser "store owner, or have a staff account on the store" [scaffold-app] | Necesita a Daniela (o una cuenta de staff que ella cree) |
| Extensión | `shopify app generate extension --template customer_account_ui …` [build-new-pages] | Después de `init` |
| Extension-only | "no developer-hosted backend"; solo custom distribution [build-extension-only-app] | **R1**: no sirve para este diseño |
| Distribución | Custom: una tienda (o una organización Plus). Link desde el Dev Dashboard. **Sin revisión**. "can't be changed after you select it" [select-distribution-method] | Decisión irreversible de Daniela |
| Token de Admin | Client credentials: `POST https://{shop}.myshopify.com/admin/oauth/access_token` con `grant_type=client_credentials`; 24 h. "only works when the app and the store belong to the same Shopify organization"; "Client credentials can't reach a store outside your organization, including a client's store"; una Dev Store creada desde el Admin "won't be in your org" [client-credentials-grant] | **R3** |
| Tokens offline | Los expirables son obligatorios para **apps públicas** desde el 2027-01-01. "This doesn't apply to custom apps or apps created by merchants" [offline-access-tokens, changelog 2026-05-20] | Una custom app puede usar un token offline no expirable guardado como secreto |
| Webhooks de compliance | "Any app that you distribute through the Shopify App Store must respond…" Se configuran con `compliance_topics`. HMAC en `X-Shopify-Hmac-SHA256` (base64 del body crudo con el client secret; comparación en tiempo constante) [privacy-law-compliance, verify-deliveries] | **R4**: para custom distribution la doc no los exige; se recomiendan igual |

---

## 3. Arquitectura (confirmada + revisada)

```
NAVEGADOR (no confiable)                SHOPIFY (confiable)                         FUNCIÓN RADAELLI (confiable)
────────────────────────                ───────────────────                         ────────────────────────────
Liquid L:159-176 ◄──────────────────── customer + custom.wishlist (lectura, 0 req)
wishlist.js (W) ─ transporte (app embed)
   POST /apps/radaelli/wishlist ──────► app proxy: agrega shop, logged_in_customer_id, ─► POST /proxy/wishlist
   {v,add,remove}  (sin id de clienta)    path_prefix, timestamp, signature; quita Cookie    HMAC + ventana + allowlists
                                                                                           id = SOLO el firmado
                                                                                           Admin: leer → nodes() → unión
                                                                                           → metafieldsSet(CAS) ×3 → 409
Extensión "Mis favoritos" (Web Worker)
   Customer Account API (lectura) ──────► custom.wishlist (acceso Customer accounts: Lectura)
   shopify.query (Storefront) ──────────► productos (imagen, precio, onlineStoreUrl)
   POST /ca/wishlist + Bearer JWT ──────────────────────────────────────────────────► /ca/wishlist (CORS *)
                                                                                           HS256 + exp/nbf/aud/dest/sub
                                                                                           mismo núcleo de unión
```

### Revisiones

- **R1. Tipo de app.** Es una app del Dev Dashboard, con custom distribution y `application_url` (la función). **No** es "extension-only", porque `REPORT:96` choca con `REPORT:311-318`. Contiene:
  - theme app extension (app embed con el transporte);
  - `[app_proxy]`;
  - extensión `customer_account_ui` full-page.
- **R2. Un solo camino de escritura.** "Quitar" en la extensión va a `/ca/wishlist` con session token. La definición `custom.wishlist` tiene acceso Customer accounts de **Lectura** (si el Admin ofrece esa granularidad; si no, lo que ofrezca).
  - Scopes: `read_customers`, `write_customers`, `read_products`, `write_app_proxy`, `customer_read_customers`. Se quita `customer_write_customers`.
  - Ventajas: la misma validación y el mismo tope en los dos lados, sin depender de B5 (sin confirmar), y mínimo privilegio.
  - Costo: `network_access` (aprobación automática) y CORS `*` (seguro, porque la autenticación va por bearer y no por cookies).
  - **B5 queda como alternativa opcional.**
- **R3. Token de Admin.** "Sin base de datos" sigue siendo posible, pero no "sin estado":
  - **(a) Client credentials** si la tienda está en la misma organización del Dev Dashboard. Token de 24 h en memoria, pedido al arrancar.
  - **(b) Si no** (probable en la tienda de producción): un token offline obtenido una vez (token exchange o authorization code), guardado como **secreto del hosting**. Requiere una ruta de instalación en la función.
  - Qué pasa con la Dev Store: **NOT_AVAILABLE**. `03A` no dice si se creó desde el Dev Dashboard o desde el Admin.
- **R4. Webhooks de compliance:** recomendados, no obligatorios según la doc para custom distribution. Se implementan como no-op con verificación HMAC (401 si no coincide).
- **R5. Timeout del transporte:** 10 s con `AbortController` → `status 0`. Motivo: el lock de `W:483`.
- **R6. Ids numéricos:** en `items`, `rejected` y `notFound` (por `W:81` y `W:293`).
- **R7. Toda falla de identidad es 401**, incluidas firma, ventana, tienda, prefijo y clienta vacía, para que el cliente no reintente (`W:545-555`). El motivo va solo en el body y en el log.
- **R8. `accountPageUrl`:** setting `url` del app embed que carga Daniela después de agregar la página. Si está vacío, se usa `routes.account_url`.
- **R9. Lista vacía:** `metafieldsSet` con `"[]"` + CAS. Si Shopify lo rechaza (GO/NO-GO 10), se usa `metafieldsDelete` sin CAS. Riesgo residual aceptado: una alta simultánea desde otro dispositivo, en el mismo instante en que se quita el último favorito, puede perderse.
- **R10. Productos borrados:** se detectan con `nodes()` = `null`. No está documentado → GO/NO-GO 11. Archivados y borradores **existen** y se conservan (`REPORT:440`).
- **R11. Logs:** nunca la query firmada, `logged_in_customer_id`, el token ni pares clienta+producto. Solo estado, motivo y latencia (amplía `REPORT:466`).

---

## 4. Contrato de endpoints

Constantes (a configurar; **no son valores reales**):
- `APP_PROXY_PREFIX=apps`, `APP_PROXY_SUBPATH=radaelli` → `path_prefix` esperado `/apps/radaelli`.
- `ALLOWED_SHOPS`: dominios `*.myshopify.com` de la Dev Store y de producción. El de producción es **NOT_AVAILABLE**.
- `ALLOWED_PATH_PREFIXES=/apps/radaelli`. Queda configurable por si el subpath cambia en Admin; que el comercio pueda cambiarlo **no se verificó**.
- `SHOPIFY_API_VERSION=2026-07`, la más reciente que muestran las páginas consultadas. Se fija al construir.
- Secretos (`SHOPIFY_API_SECRET` y el token de Admin si aplica R3b): solo en el gestor de secretos del hosting.

### E1. Tienda → app proxy → función

**Request del navegador** (mismo origen, sin prefijo de idioma):
```
POST /apps/radaelli/wishlist
Content-Type: application/json
Accept: application/json
X-Radaelli-Wishlist: 1
```
Shopify lo reenvía a `POST {application_url}/proxy/wishlist?shop=…&logged_in_customer_id=…&path_prefix=%2Fapps%2Fradaelli&timestamp=…&signature=…`.

**JSON Schema del request** (draft 2020-12):
```json
{
  "$id": "radaelli/wishlist-ops-request/v1",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "v": { "const": 1 },
    "add": {
      "type": "array", "maxItems": 256,
      "items": {
        "type": "object", "additionalProperties": false, "required": ["id"],
        "properties": {
          "id": { "type": ["string", "integer"], "pattern": "^[0-9]{1,20}$" },
          "handle": { "type": "string", "maxLength": 255 }
        }
      }
    },
    "remove": {
      "type": "array", "maxItems": 256,
      "items": { "type": ["string", "integer"], "pattern": "^[0-9]{1,20}$" }
    }
  }
}
```
Reglas que el schema no expresa:
- Body de 32 KB como máximo.
- Un id **no puede** estar en `add` y en `remove` (`overlap`).
- `add` y `remove` vacíos o ausentes = **refresco**.
- El servidor **ignora** `handle` y devuelve el canónico.

**JSON Schema de la respuesta 200:**
```json
{
  "$id": "radaelli/wishlist-ops-response/v1",
  "type": "object",
  "additionalProperties": false,
  "required": ["v", "items", "rejected", "notFound"],
  "properties": {
    "v": { "const": 1 },
    "items": {
      "type": "array", "maxItems": 128,
      "items": {
        "type": "object", "additionalProperties": false, "required": ["id", "handle"],
        "properties": { "id": { "type": "string", "pattern": "^[0-9]{1,20}$" }, "handle": { "type": "string" } }
      }
    },
    "rejected": { "type": "array", "items": { "type": "string", "pattern": "^[0-9]{1,20}$" } },
    "notFound": { "type": "array", "items": { "type": "string", "pattern": "^[0-9]{1,20}$" } }
  }
}
```
- `items` = la lista canónica **en orden**.
- `rejected` = altas que no entraron por el tope.
- `notFound` = ids de `add` que no existen, más ids que estaban en la lista y ya no existen (se podan).

**Respuesta de error:** `{"v":1,"error":"<código>"}`, validada con `{"type":"object","required":["v","error"],"properties":{"v":{"const":1},"error":{"type":"string","enum":[…]}}}`.

| HTTP | `error` | Cuándo | Qué hace el cliente (`W`) |
|---|---|---|---|
| 401 | `invalid_signature`, `stale_request`, `shop_not_allowed`, `prefix_not_allowed`, `no_customer` | falla de identidad | `auth-failed`, sin reintento (`W:545-549`) |
| 400 | `invalid_json`, `invalid_body`, `invalid_id`, `overlap`, `too_many_ops`, `missing_csrf_header` | error del cliente | reintento 3× y queda `pending` (`W:550-557`), sin pérdida |
| 405 | `method_not_allowed` (+ `Allow: POST`) | ≠ POST | ídem |
| 413 | `body_too_large` | > 32 KB | ídem |
| 415 | `unsupported_media_type` | ≠ `application/json` | ídem |
| 409 | `conflict` | 3 intentos de CAS fallidos | reintento 2/8/30 s |
| 502 | `admin_error` | `userErrors` que no son de CAS, o errores GraphQL | reintento |
| 503 | `admin_throttled` | throttle de la Admin API | reintento |

Headers de toda respuesta:
- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: private, no-store`
- `X-Content-Type-Options: nosniff`
- **Sin** `Access-Control-Allow-Origin`: es mismo origen; un sitio ajeno no puede leer la lista.

**Orden de validación en E1:**
1. Método.
2. Firma sobre la **query cruda** (antes de que un framework la re-codifique o colapse repetidos).
3. Ventana ±300 s.
4. `shop` en la allowlist.
5. `path_prefix` en la allowlist.
6. `logged_in_customer_id` numérico y único.
7. `Content-Type`.
8. `X-Radaelli-Wishlist` (solo si GO/NO-GO 8 confirma que Shopify lo reenvía; si no, se desactiva y queda la defensa de `Content-Type`).
9. Tamaño.
10. JSON y schema.
11. CAS (§ 7).

### E2. Extensión → función (solo con R2)

```
OPTIONS {application_url}/ca/wishlist  → 204
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: POST, OPTIONS
  Access-Control-Allow-Headers: Authorization, Content-Type
  Access-Control-Max-Age: 600
POST {application_url}/ca/wishlist
  Authorization: Bearer <session token>
  Content-Type: application/json
  body = schema E1 (en la práctica solo "remove" o refresco)
→ misma respuesta y errores que E1, más Access-Control-Allow-Origin: * y Cache-Control: no-store
```

Validación del JWT (`REF: verifySessionToken`):
- `alg` = HS256 y firma con el client secret;
- `exp` y `nbf` con 5 s de tolerancia;
- `aud` = client id;
- el host de `dest` está en `ALLOWED_SHOPS` (formato a confirmar, GO/NO-GO 12);
- `sub` cumple `^gid://shopify/Customer/\d+$`.

Cualquier falla da 401. No usa cookies, así que CSRF no aplica.

### E3. Webhooks de compliance (recomendado, R4)

`POST {application_url}/webhooks`:
- Verifica `X-Shopify-Hmac-SHA256` = base64(HMAC-SHA256(body crudo, client secret)) en tiempo constante.
- Si no coincide: 401.
- Si coincide: 200 sin acción, porque la app no guarda datos fuera de Shopify.

### E4. Contrato del transporte (asset del app embed, NO del theme)

```js
// Implementa REPORT:334-340 / W:25-32. Pseudocódigo de referencia.
(function () {
  var ENDPOINT = "/apps/radaelli/wishlist", TIMEOUT_MS = 10000;
  var transport = {
    accountPageUrl: /* setting url del app embed o routes.account_url, impreso por su Liquid */ "",
    apply: async function ({ add, remove }) {
      var ctrl = new AbortController(); var t = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
      var res;
      try {
        res = await fetch(ENDPOINT, { method: "POST", credentials: "same-origin", signal: ctrl.signal,
          headers: { "Content-Type": "application/json", Accept: "application/json", "X-Radaelli-Wishlist": "1" },
          body: JSON.stringify({ v: 1, add: add, remove: remove }) });
      } catch (e) { throw Object.assign(new Error("network"), { status: 0 }); }
      finally { clearTimeout(t); }
      if (!res.ok) throw Object.assign(new Error("http"), { status: res.status });
      if (!(res.headers.get("content-type") || "").includes("application/json"))
        throw Object.assign(new Error("not_json"), { status: 502 });   // p. ej., página HTML de error de Shopify
      return res.json();
    }
  };
  window.Radaelli = window.Radaelli || {};                              // igual que TJS:42
  if (window.Radaelli.wishlist && window.Radaelli.wishlist.connectAccount) window.Radaelli.wishlist.connectAccount(transport);
  else window.Radaelli.wishlistAccountTransport = transport;            // lo toma W:913
})();
```

### E5. Flujo de datos de la extensión "Mis favoritos"

1. Customer Account API: `query { customer { metafield(namespace: "custom", key: "wishlist") { value } } }`. `value` es un JSON con los GIDs en orden.
2. `shopify.query` (Storefront):
   ```
   nodes(ids: $gids) { ... on Product { id handle title onlineStoreUrl featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } } } }
   ```
   Los `null` se saltean. Que devuelva productos del canal Online Store queda en GO/NO-GO 14.
3. "Ver producto": `Link` / `Button` con `href = onlineStoreUrl` (`REPORT:409`).
4. "Quitar": E2 con `{v:1, remove:[id]}` y se vuelve a dibujar con `items`.

---

## 5. HMAC: algoritmo y vectores

### 5.1 Algoritmo (función `verifyProxy` en `REF`)

1. Tomar la **query cruda** del request que llega a la función.
2. Parsearla con `application/x-www-form-urlencoded`: `+` → espacio y decodificación `%XX`. **Se firma el valor decodificado**; el vector oficial lo confirma (`path_prefix=%2Fapps%2F…` se firma como `/apps/…`).
3. Descartar `signature`. Si no aparece exactamente una vez, o no son 64 hex en minúscula → 401.
4. Agrupar por clave, conservando el orden de aparición, y unir los valores repetidos con `,`.
5. Armar los strings `clave=valor` y **ordenarlos como strings**, no por clave: con `a-b` y `a`, `"a-b=…"` va antes que `"a=…"` (probado en `REF`).
6. Concatenar sin separador → `mensaje`.
7. `hex(HMAC-SHA256(key = client secret de la app, data = mensaje en UTF-8))`.
8. Comparar en tiempo constante: `crypto.timingSafeEqual` sobre los 32 bytes.
9. Recién después, validar:
   - `|now − timestamp| ≤ 300` (decisión propia);
   - `shop` en la allowlist;
   - `path_prefix` en la allowlist;
   - `logged_in_customer_id` matchea `^\d{1,20}$` → `gid://shopify/Customer/<id>`.
   - Vacío = 401 `no_customer`.

### 5.2 Vector OFICIAL reproducido (shopify.dev; secreto `hush`)

La página muestra el host como `{shop}.myshopify.com` (placeholder). Las dos firmas publicadas se reproducen **exactamente** con `shop=shop-name.myshopify.com` (verificado con `03d/probe-official.mjs`). Es una deducción propia y no está escrita en la doc.

| Caso | Query (sin `signature`) | Firma esperada (doc) | Obtenida |
|---|---|---|---|
| Con sesión | `extra=1&extra=2&shop=shop-name.myshopify.com&logged_in_customer_id=1&path_prefix=%2Fapps%2Fawesome_reviews&timestamp=1317327555` | `4c68c8624d737112c91818c11017d24d334b524cb5c2b8ba08daa056f7395ddb` | igual ✔ |
| Anónimo | `…&logged_in_customer_id=&…` (resto igual) | `e072b6d7e6622d85912a5214b860d3100dc1e73d9bc29f43796ac8c9ff8093cb` | igual ✔ |

### 5.3 Vector FALSO de Radaelli (⚠ secreto, tienda e ids FALSOS; no usar en ningún entorno)

- Secreto FALSO: `FAKE-03D-radaelli-app-secret-NOT-REAL`
- Query FALSA: `shop=radaelli-fake.myshopify.com&logged_in_customer_id=7000000000001&path_prefix=%2Fapps%2Fradaelli&timestamp=1790000000`
- Mensaje: `logged_in_customer_id=7000000000001path_prefix=/apps/radaellishop=radaelli-fake.myshopify.comtimestamp=1790000000`
- Firma: `8f649bdd8f4f3a51dec71ec1768714868f8c23580fbd86ad2743a0780a7e3de7`
- Anónimo (`logged_in_customer_id=`): mensaje `logged_in_customer_id=path_prefix=/apps/radaelli…timestamp=1790000000`, firma `fe21a300cad63bd67f17a3af80d70832c2960b92e541805615fef14945f328c8` → **401 `no_customer`**, aunque la firma es válida.
- Casos negativos (todos PASS en `REF`):
  - id alterado con la misma firma → 401 `invalid_signature`;
  - `now = ts + 301` → 401 `stale_request`;
  - otra tienda bien firmada → 401 `shop_not_allowed`;
  - secreto equivocado → 401;
  - `signature` duplicada → 401.

### 5.4 Session token FALSO (E2)

Con el mismo secreto FALSO, client id FALSO `FAKE-client-id-03d` y payload:
```
{dest:"https://radaelli-fake.myshopify.com", aud:"FAKE-client-id-03d", sub:"gid://shopify/Customer/7000000000001", exp:1790000300, nbf:1790000000, iat:1790000000, jti:"00000000-0000-4000-8000-000000000000"}
```
El JWT resultante está impreso por `REF` (`VECTOR_FAKE_JWT`). Pruebas: válido, vencido (`now = ts + 400`), `aud` ajeno y sin `sub` → PASS.

---

## 6. Límites

| Límite | Valor | Fuente |
|---|---|---|
| Ítems en `list.product_reference` | **128** (Shopify) | metafield-limits |
| Tope para altas nuevas | **100**; nunca se recorta una lista existente | `W:63`, `W:460`, `REPORT:284`; `REF` |
| `metafieldsSet` | 25 metafields por llamada, 10 MB, atómico (se usa 1) | metafieldsSet |
| Definiciones por recurso | 256 (se usa 1) | metafield-limits |
| Intentos de CAS | 3 → 409 | `REPORT:299`; `REF: casApply` |
| Body E1/E2 | 32 KB; ≤256 `add`; ≤256 `remove` (propio) | este diseño |
| Ventana del timestamp | ±300 s (propio; Shopify no documenta) | `REPORT:297` |
| Session token | 5 min; tolerancia propia de 5 s | session-token-api |
| Token client credentials | 24 h (86399 s) | client-credentials-grant |
| Bundle de la extensión full-page | 128 KB | customer-account-ui-extensions |
| Theme app extension | 10 MB en total, 100 KB de Liquid, 30 bloques | theme-app-extensions/configuration |
| Subpath del proxy | ≤30 caracteres `[A-Za-z0-9_-]`; prefijos `a` / `apps` / `community` / `tools` | app-proxies |
| Cliente | debounce 400 ms; reintentos 2/8/30 s; TTL de la cola 30 días; 4 fetch concurrentes en la página | `W:64-67` |
| Timeout del transporte | 10 s (nuevo) | R5 |
| Rate limits de la Admin API | **NOT_AVAILABLE** (no verificado en esta pasada) | — |

---

## 7. Algoritmo de unión

### 7.1 Servidor (`REF: applyWishlistOps` + `casApply`)

```
entrada: customerGid (firmado), body válido {add, remove}
repetir hasta 3 veces:
  1. leer   customer(id).metafield(custom, wishlist) { jsonValue compareDigest }
            current = ids numéricos de los GIDs en orden; digest = null si no existe
  2. exists = nodes(current ∪ add.ids) → Map id→handle solo de Product no nulos
  3. next = [id ∈ current | existe ∧ id ∉ remove]                          (orden estable)
     notFound += [id ∈ current | no existe]                                 (poda)
  4. para cada a ∈ add en orden (dedupe por id):
       no existe       → notFound
       ya está en next → nada (idempotente)
       |next| ≥ 100    → rejected
       si no           → next.push(a.id)
  5. invariante |next| ≤ 128
  6. si next == current → responder sin escribir (0 escrituras)
  7. metafieldsSet({ownerId, namespace:"custom", key:"wishlist",
                    type:"list.product_reference", value: JSON(GIDs de next),
                    compareDigest: digest})            // null = "debe no existir"
       OK                                          → 200 {items: next+handles, rejected, notFound}
       userError STALE_OBJECT | INVALID_COMPARE_DIGEST → volver a 1
       otro userError / error GraphQL              → 502
tras 3 conflictos → 409
```

### 7.2 Ejemplo pedido: invitada `{A,B,C}` + cuenta `{B,D}` → `[B,D,A,C]`

Ids FALSOS: A=1, B=2, C=3, D=4.

| Paso | Valor |
|---|---|
| Cliente: `pendingGuest()` | `[A,B,C]` (`W:378-381`) |
| Cliente: `add` enviado | `[A,B,C]` (invitada en su orden, más las altas de la cola; `W:490-495`) |
| Servidor: `current` | `[B,D]` |
| Paso 3 | `next = [B,D]` |
| Paso 4 | A → push; B → ya está; C → push ⇒ `[B,D,A,C]` |
| Respuesta | `items=[B,D,A,C]`, `rejected=[]`, `notFound=[]` |
| Cliente | poda `{B,D,A,C}` de la invitada → queda `[]` (`W:519-522`); `base=[B,D,A,C]`; BroadcastChannel `base` (`W:530`) |
| Vista optimista previa | `union([B,D],[A,B,C]) = [B,D,A,C]` (`W:101-111`, `W:387-393`): **el mismo orden que el servidor**, sin saltos |
| Reenvío (pestaña cerrada a mitad de camino) | `current=[B,D,A,C]`, `add=[A,B,C]` → sin cambios, 0 escrituras (PASS en `REF`) |

### 7.3 Otros casos (todos PASS en `REF`)

- **Quitar:** `[B,D,A,C]` − `D` → `[B,A,C]`.
- **Borrados:**
  - alta de un id inexistente → `notFound`;
  - un id de la lista que ya no existe → se poda y va a `notFound`;
  - el cliente lo poda de la invitada y da la intención por cerrada (`W:513`, `W:519`).
- **Tope:** 99 + `[X,Y]` → X entra y Y va a `rejected`. El cliente lo deja en la invitada, marcado, sin reenviar (`W:526`), y avisa (`W:535-537`).
- **Lista heredada de 110** (migración): no se recorta; cualquier alta va a `rejected`.
- **CAS:** 2 conflictos seguidos de OK → 200; 3 conflictos → 409; digest `null` → crea.
- **Solapamiento `add`/`remove`:** 400 `overlap`. El cliente nunca lo genera (`W:489-491`).

---

## 8. GO/NO-GO en la Dev Store (actualizado)

Se mantienen los puntos 1–9 de `REPORT:579-587`, con estos cambios:
- **#5** pasa a **opcional** (R2).
- **#7** se reescribe como: "¿la Dev Store está en la organización de la app? Si sí, client credentials; si no, token offline guardado como secreto" (R3).

Puntos nuevos:

10. `metafieldsSet` con `value: "[]"` y `compareDigest`: ¿se acepta? (R9)
11. Admin `nodes(ids:)` con el GID de un producto **borrado**: ¿devuelve `null`? (R10)
12. Formato real de `dest` en el session token de una extensión de cuenta (para la allowlist de E2).
13. ¿El app proxy responde con la tienda protegida con contraseña (Dev Store)? En `03B:292` los visitantes ven la contraseña de Shopify.
14. `shopify.query` desde la extensión: ¿devuelve `onlineStoreUrl` e imagen de productos publicados solo en Online Store?
15. Qué código de `userErrors` llega con un digest viejo (`STALE_OBJECT` o `INVALID_COMPARE_DIGEST`); es parte del #4.

---

## 9. Qué se puede construir y probar offline, y qué necesita autorización

### 9.1 Offline completo (sin cuenta de Shopify ni red)

- **Núcleo de la función:**
  - verificación HMAC con el vector oficial y los falsos;
  - verificación JWT;
  - validación del body;
  - unión, tope y `notFound`;
  - bucle CAS con un Admin simulado;
  - mapeo de estados HTTP;
  - CORS de E2;
  - verificación HMAC de webhooks;
  - redacción de logs.
  - Demostrado en `REF`: **28/28 PASS**.
- **Transporte E4:** contra el `wishlist.js` real con el arnés aislado de 02L (mocks solo en el scratchpad, como en `REPORT:611-615`). Casos: los dos órdenes de carga, timeout → `status 0`, HTML → 502, 401 sin bucle.
- **Documentos:** schemas, runbook de rotación del secreto, plan de migración en seco sobre un JSON de ejemplo **ficticio**.

### 9.2 Offline parcial (se escribe, pero no se ejecuta ni se valida sin Shopify)

- **UI de la extensión** (Preact + componentes Polaris): necesita el runtime de Shopify (`shopify app dev`). En esta tarea tampoco se permite `npm install`.
- **`shopify.app.toml`** (`[app_proxy]`, scopes, `compliance_topics`) y el TOML de la extensión: los valida la CLI cuando la app está vinculada.
- **Liquid del app embed:** se puede revisar a mano; la validación real llega con `shopify app deploy` / `dev`.

### 9.3 Necesita a la dueña (Daniela) o una cuenta de Partner / Dev Dashboard

1. Cuenta de desarrollador y organización (Dev Dashboard / Partner). **Claude no crea cuentas.**
2. `shopify app init`: login de desarrollador, código de dispositivo aprobado por Daniela; crea la app en el Dev Dashboard.
3. `shopify app dev`: dueña o staff de la tienda.
4. Elegir **custom distribution** (irreversible), generar el link e **instalar** la app aceptando los scopes (consentimiento OAuth; permiso explícito).
5. "Allow network access" en el Partner Dashboard (solo con R2; aprobación automática).
6. Crear `custom.wishlist` en Admin > Datos personalizados > Clientes, con acceso Customer accounts. Es un cambio de configuración de la tienda: requiere permiso explícito.
7. Hosting de la función y carga de secretos (client secret, token de Admin si aplica R3b). Daniela los carga; Claude **nunca** los ve ni los imprime.
8. Activar el app embed en el editor del theme y agregar "Mis favoritos" al menú de la cuenta (editor de checkout y cuentas).
9. Ingreso con código de clienta: `DEFERRED_OWNER_ONLY_BLOCKER` (`03B:264`). Destraba los GO/NO-GO 1, 2, 6, 12, 13 y 14.
10. Encender `wishlist_account_sync` (hoy apagado: `03B:190`) solo después de los GO/NO-GO.
11. Migración: pre-crear clientes (Habeas Data, `REPORT:477`) y exportar desde Neon (fuera de esta tarea).

---

## 10. NOT_AVAILABLE (no se inventa)

- Si la Dev Store `radaelli-swimwear-dev` está en una organización del Dev Dashboard. `03A:48` y `03A:44` solo muestran el dominio y la autenticación de la CLI de themes.
- Dominio `*.myshopify.com` de producción, client id de la app y host de la función.
- Formato exacto de la URL de la página full-page. No está en las páginas consultadas.
- Si el Admin ofrece "Lectura" frente a "Lectura y escritura" en el acceso Customer accounts de una definición `custom`. El Help Center no lo detalla.
- Tolerancia oficial del `timestamp` del app proxy.
- Si Shopify reenvía headers propios (`X-Radaelli-Wishlist`) y `Content-Type` al backend del proxy (sigue siendo el GO/NO-GO 8).
- Comportamiento de `logged_in_customer_id` con New Customer Accounts. El changelog oficial del parámetro da 404, y la evidencia de foros es secundaria (`REPORT:173-174`).
- Rate limits exactos de la Admin API. No se verificaron en esta pasada.

---

## 11. Fuentes oficiales consultadas en esta pasada

- shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies
- shopify.dev/docs/apps/build/online-store/app-proxies
- shopify.dev/docs/api/shopify-app-react-router/latest/authenticate/public/app-proxy (no documenta la tolerancia ni los códigos)
- shopify.dev/docs/apps/build/metafields/metafield-limits
- shopify.dev/docs/apps/build/custom-data/metafields/list-of-data-types
- shopify.dev/docs/apps/build/metafields/list-of-validation-options
- shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsSet
- shopify.dev/docs/api/admin-graphql/latest/input-objects/MetafieldsSetInput
- shopify.dev/docs/api/admin-graphql/latest/enums/MetafieldsSetUserErrorCode
- shopify.dev/docs/api/admin-graphql/latest/input-objects/MetafieldIdentifierInput
- shopify.dev/docs/api/admin-graphql/latest/objects/Metafield
- shopify.dev/docs/api/admin-graphql/latest/queries/nodes
- shopify.dev/docs/api/admin-graphql/latest/input-objects/MetafieldAccessInput
- shopify.dev/docs/apps/build/custom-data/ownership
- shopify.dev/docs/apps/build/custom-data/permissions
- shopify.dev/docs/apps/build/custom-data/metafields/definitions/use-access-controls-metafields
- shopify.dev/docs/apps/build/metafields/definitions
- shopify.dev/docs/apps/build/metafields
- shopify.dev/docs/apps/build/metafields/manage-metafields
- shopify.dev/docs/api/customer/latest/mutations/metafieldsSet
- shopify.dev/docs/api/customer/latest/objects/Metafield
- shopify.dev/docs/apps/build/customer-accounts
- shopify.dev/docs/apps/build/customer-accounts/metafields
- shopify.dev/docs/apps/build/customer-accounts/capabilities
- shopify.dev/docs/apps/build/customer-accounts/start-building
- shopify.dev/docs/apps/build/customer-accounts/full-page-extensions
- shopify.dev/docs/apps/build/customer-accounts/full-page-extensions/build-new-pages
- shopify.dev/docs/api/customer-account-ui-extensions/latest
- shopify.dev/docs/api/customer-account-ui-extensions/latest/configuration
- shopify.dev/docs/api/customer-account-ui-extensions/latest/targets/full-page
- shopify.dev/docs/api/customer-account-ui-extensions/latest/target-apis/platform-apis/storefront-api
- shopify.dev/docs/api/customer-account-ui-extensions/latest/target-apis/platform-apis/session-token-api
- shopify.dev/docs/api/customer-account-ui-extensions/latest/target-apis/account-apis/customer-account-api
- shopify.dev/docs/apps/build/authentication-authorization/session-tokens
- shopify.dev/docs/apps/launch/protected-customer-data
- shopify.dev/docs/api/usage/access-scopes
- shopify.dev/docs/apps/build/scaffold-app
- shopify.dev/docs/api/shopify-cli/app/app-init
- shopify.dev/docs/apps/build/app-extensions/build-extension-only-app
- shopify.dev/docs/apps/launch/distribution/select-distribution-method
- shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant
- shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens
- shopify.dev/changelog/expiring-offline-access-tokens-required-for-all-public-apps-as-of-january-1-2027
- shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
- shopify.dev/docs/apps/build/compliance/privacy-law-compliance
- shopify.dev/docs/apps/build/webhooks/verify-deliveries
- help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations/checkout-apps
- help.shopify.com/en/manual/custom-data/options
- help.shopify.com/en/manual/custom-data/metafields/metafield-definitions/creating-custom-metafield-definitions
- help.shopify.com/en/manual/customers/customer-accounts/upgrade/compare-features (no trae la tabla de planes)
- **404:** shopify.dev/changelog/app-proxy-requests-include-new-parameter-for-the-logged-in-customer-id

## 12. Archivos de este trabajo (solo scratchpad)

- `03d/accounts-app-design.md`: este documento.
- `03d/ref-impl.mjs`: implementación de referencia y pruebas (`node ref-impl.mjs` → `TOTAL 28 PASS 28 FAIL 0`). No es código de producción.
- `03d/probe-official.mjs`: reproduce el vector oficial (`hush`) y muestra que el host real del ejemplo es `shop-name.myshopify.com`.
