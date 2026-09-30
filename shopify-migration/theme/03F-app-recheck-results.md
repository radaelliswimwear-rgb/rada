# 03F: reverificación del paquete de la app de favoritos 0.1.1

- **Fecha:** 2026-09-29 (Bogotá), corrida entre las ~14:30 y las ~15:00.
- **Alcance:** `shopify-migration/app` (versión 0.1.1) y `dist/radaelli-wishlist-app-0.1.1.zip`. Solo lectura sobre el código: no se editó ningún archivo de `app/` salvo agregar este documento y el runbook `03F-owner-wishlist-install-runbook.md`.
- **Entorno:** Node v24.19.0, Windows 11. Sin Shopify CLI, sin `npm install`, sin git, sin navegador. No se leyó ningún `.env` real.
- **Scripts auxiliares** (extracción del zip, escaneo, consistencia, transpilado del JSX, simulación de guardas): viven en el scratchpad de la sesión y no se entregan.

## 1. Resultado

| # | Verificación | Esperado | Obtenido | Estado |
|---|---|---|---|---|
| 1 | `node --test shopify-migration/app/test` | 156/156 | **156 tests, 7 suites, 156 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo** (1082,9 ms) | PASS |
| 2 | `node shopify-migration/app/test/mutants.mjs` | 20/20 | Baseline sin mutar: PASA. **MUTANTS killed 20/20** | PASS |
| 3 | `node shopify-migration/app/scripts/pack.mjs`, dos corridas | SHA-256 `f14f068a962a617d255c9cfba6a9ba581496c5c6b3c7dc4713ac2b4bb1be1de8` | Corrida 1 = corrida 2 = `f14f068a962a617d255c9cfba6a9ba581496c5c6b3c7dc4713ac2b4bb1be1de8`. 35 entradas, 253148 bytes. `sha256sum` del zip antes y después: igual. Copia de seguridad previa: igual | PASS |
| 4 | Escaneo de secretos del zip extraído en el directorio temporal del sistema | 0 | **0** en `shpat_`, `shpss_`, `shpca_`, `shppa_`, `BEGIN … PRIVATE KEY`, `AKIA…`, `Bearer` largo y JWT reales. **0** entradas `.env*`. 35 archivos escaneados | PASS |
| 5 | Configuración (TOML, `.env.example`, extensiones) | Consistente | 30 de 30 comprobaciones de configuración en PASS (§ 4) | PASS |
| 6 | Sintaxis sin Shopify ni `npm install` | Sin errores | `node --check`: **26/26** archivos. JSX: TypeScript 5.8.2 disponible; `transpileModule` con **0 diagnósticos** y `node --check` del transpilado OK | PASS |
| 7 | Coherencia README ↔ OWNER-WORKFLOW ↔ código | Coherente | Variables, rutas y códigos de error coinciden (9 comprobaciones en PASS). **4 diferencias de documentación** por versión y conteo (§ 5) | PASS con observaciones |
| 8 | Guardas "antes de vincular" (copia temporal) | 155/156 y 154/156 | Solo `client_id`: **155/156**. `client_id` + host: **154/156**. Mismas fallas que promete el runbook | PASS |

**Defectos de código: 0.** Diferencias de documentación: 4, más 3 menores (§ 5).

## 2. Empaquetado determinista

- `pack.mjs` reescribe `dist/radaelli-wishlist-app-0.1.1.zip`. El contenido quedó **idéntico byte a byte**: el hash no cambió (la fecha de modificación del archivo sí).
- Estructura del zip, leída del directorio central:
  - 35 entradas, ordenadas por bytes de la ruta, todas bajo `radaelli-wishlist-app-0.1.1/`;
  - método `stored`, fecha DOS fija 1980-01-01 00:00, permisos `0100644`;
  - 0 rutas con `..`, absolutas o con `\`; 0 entradas ocultas; 0 symlinks;
  - CRC y tamaño válidos en las 35;
  - **35/35 archivos idénticos** a los de `app/` (0 faltan y 0 sobran).
- **Aviso:** `app/` ahora contiene `03F-owner-wishlist-install-runbook.md` y `03F-recheck-results.md`, que `pack.mjs` empaqueta. **Si se vuelve a correr `pack.mjs`, el SHA-256 cambia** y el zip dejará de ser `f14f068a…`. Este zip corresponde al paquete sin esos dos documentos. El hosting solo usa `server/` y `package.json`, que no cambian.

## 3. Sintaxis

| Grupo | Archivos | Resultado |
|---|---|---|
| `app/server/*.mjs` | 10 | 10/10 OK |
| `app/test/*.mjs` | 10 | 10/10 OK |
| `app/test/index.js`, `app/scripts/pack.mjs` | 2 | 2/2 OK |
| `extensions/mis-favoritos/src/{api,config,model}.js` | 3 | 3/3 OK |
| `extensions/wishlist-transport/assets/wishlist-transport.js` | 1 | OK |
| **Total `node --check`** | **26** | **26/26** |

- **JSX** (`MisFavoritosPage.jsx`): el TypeScript del proyecto principal sigue disponible en `commerce-main/node_modules/typescript` (versión 5.8.2). Se repitió el chequeo de 03D con `transpileModule` (`jsx: react-jsx`, `jsxImportSource: preact`): 0 diagnósticos de sintaxis, 5303 bytes transpilados y `node --check` del resultado en OK. Es solo sintaxis: **no** se tipó contra `@shopify/ui-extensions` (no está instalado) ni se ejecutó.
- **Liquid del app embed:** sin Shopify CLI ni Theme Check no se puede validar. Se comprobó a mano que el bloque `{% schema %}` es JSON válido, que `target` es `body`, que el setting `account_page_url` es de tipo `url` y que el `id` del `<script>` de configuración coincide con el que lee `wishlist-transport.js`.

## 4. Consistencia de configuración

Se hicieron 43 comprobaciones: 30 de configuración (TOML, extensiones, `.env.example`) y 13 de documentos contra el código. **39 PASS**; los **4 FAIL** son de documentación (§ 5). Las 30 de configuración pasan todas.

- **`shopify.app.toml`**
  - `scopes` = `read_customers,write_customers,read_products,write_app_proxy,customer_read_customers`, exactos y en ese orden; sin `customer_write_customers`.
  - Sin `client_id`; `embedded = false`.
  - `[app_proxy]`: `prefix = "apps"`, `subpath = "radaelli"`, `url` termina en `/proxy`. Coincide con el `path_prefix` por defecto del código (`/apps/radaelli`), con el endpoint del transporte (`/apps/radaelli/wishlist`) y con la ruta de la función (`/proxy/wishlist`).
  - `api_version = "2026-07"` igual en el TOML, `PINNED_API_VERSION`, la extensión, `.env.example` y `config.js` (Customer Account y Storefront).
  - `compliance_topics` = los tres del código (`customers/data_request`, `customers/redact`, `shop/redact`); `uri = "/webhooks"` = ruta del código; sin otras suscripciones.
  - Placeholder de host: **3** usos funcionales (`application_url`, `redirect_urls`, `[app_proxy] url`) y 1 en `extensions/mis-favoritos/src/config.js`. El comentario del encabezado del TOML lo repite una cuarta vez (inocuo: un reemplazo global también lo cambia).
- **Extensiones**
  - `mis-favoritos`: `type = "ui_extension"`, `handle`, un solo target `customer-account.page.render`, `module` existe, `api_access` y `network_access` en `true`, `locales/es.default.json` es JSON válido.
  - `wishlist-transport`: `type = "theme"`, bloque con `target: body`, setting `url`, `asset` existente.
- **`.env.example`:** 16 nombres, los mismos 16 que lee `server/config.mjs` y los mismos 16 de la tabla de README § 5. Los tres secretos valen `REEMPLAZAR-…`; `ALLOWED_SHOPS` también; ningún valor con forma de secreto; los defaults coinciden con los del código.

## 5. Coherencia de documentos con el código

**Coinciden (9 comprobaciones):**
- Variables de entorno: `.env.example` = `config.mjs` = README § 5. Las 9 variables que cita OWNER-WORKFLOW existen en el código.
- Rutas: `/proxy/wishlist`, `/ca/wishlist`, `/webhooks`, `/` y `/apps/radaelli` en README, OWNER-WORKFLOW y `handlers.mjs`.
- Códigos de error: los **24** códigos del código (`invalid_signature`, `stale_request`, `shop_not_allowed`, `prefix_not_allowed`, `no_customer`, `invalid_json`, `invalid_body`, `invalid_id`, `overlap`, `too_many_ops`, `missing_csrf_header`, `method_not_allowed`, `body_too_large`, `unsupported_media_type`, `rate_limited`, `conflict`, `admin_error`, `admin_throttled`, `upstream_timeout`, `not_found`, `internal_error`, `missing_token`, `invalid_token`, `token_expired`) están en la tabla de README, cada uno en la fila de su estado HTTP, y README no inventa ninguno.

**Diferencias (documentación, sin efecto en el código):**

| # | Dónde | Dice | Debe decir | Propuesta mínima |
|---|---|---|---|---|
| D1 | `README.md:1` y `README.md:81` | `0.1.0` y `radaelli-wishlist-app-0.1.0.zip` | `0.1.1` | Cambiar las dos menciones |
| D2 | `README.md:265` | "aplica 19 errores chicos" | 20 (`mutants.mjs` define 20 ids; se sumó `transport-backslash-host` en RC1.5) | Cambiar 19 por 20 |
| D3 | `OWNER-WORKFLOW.md` líneas 1, 17, 33, 107, 270 y 302 | `0.1.0` (en la línea 17, con el SHA-256 `559c346a…296a` del zip 0.1.0) | `0.1.1` y `f14f068a…1de8` | Actualizar, o marcar el documento como reemplazado por `03F-owner-wishlist-install-runbook.md` |
| D4 | `OWNER-WORKFLOW.md` | Grupo del setting "Favoritos" | `Wishlist` (`theme-src/config/settings_schema.json:211`) | Corregir el nombre |

**Menores (ya resueltos en el runbook):**
- Las líneas que cita OWNER-WORKFLOW del theme derivaron (`theme.liquid:177`, `header.liquid:216`, `:378-381`). Hoy: `header.liquid:215` y `:377-379`; `theme.liquid:183` (metafield) y `:165` (bloque del setting). `theme.liquid` se modificó hoy a las 14:45 por una tarea ajena a esta.
- OWNER-WORKFLOW pega la URL de "Mis favoritos" (7c) antes de ingresar (paso 8), pero esa URL solo se puede copiar con sesión. El runbook lo parte en 9a y 9b.
- OWNER-WORKFLOW enciende `wishlist_account_sync` (7d) antes del ingreso. El runbook lo deja como último interruptor.

## 6. Guardas "antes de vincular" (copia en el directorio temporal; `app/` no se tocó)

Valores ficticios: `client_id` de ceros y host `favoritos.simulado.test`. La copia se borró al terminar.

| Estado de la copia | Resultado |
|---|---|
| Sin cambios | `tests 156 · pass 156 · fail 0` |
| Solo `client_id` (paso 2 del runbook) | `tests 156 · pass 155 · fail 1`: `shopify.app.toml: sin client_id, scopes mínimos…` |
| `client_id` + host en el TOML y en `config.js` (paso 4a) | `tests 156 · pass 154 · fail 2`: la anterior y `api.removeFavorite: con el placeholder de BACKEND_URL no llama a nada` |

Coincide con T1 y T2 del runbook.

## 7. Qué no se pudo verificar sin login, CLI ni tienda

- Los TOML y el Liquid contra la CLI real (`shopify app deploy` los valida por primera vez).
- El tipado y la ejecución de la UI de la extensión (`@shopify/ui-extensions` no está instalado).
- Todo el comportamiento contra Shopify: `logged_in_customer_id` con cuentas nuevas, reenvío de `Content-Type` y de `X-Radaelli-Wishlist` por el app proxy, `metafieldsSet` con `"[]"` y con digest viejo, `nodes()` con un producto borrado, formato de `dest` del session token, CORS desde el Web Worker. Están en el mapa GO/NO-GO del runbook.

## 8. Reproducción

Desde la carpeta del worktree:

```
node --test shopify-migration/app/test
node shopify-migration/app/test/mutants.mjs
node shopify-migration/app/scripts/pack.mjs   # 2 veces; el SHA-256 solo coincide con f14f068a… si app/ no cambió (ver § 2)
sha256sum shopify-migration/dist/radaelli-wishlist-app-0.1.1.zip
```
