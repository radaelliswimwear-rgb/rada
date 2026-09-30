# 03F: runbook de instalación de la app de favoritos (Dev Store)

- **Fecha:** 2026-09-29 (Bogotá).
- **App:** "Radaelli Favoritos" **0.1.1**. Paquete `dist/radaelli-wishlist-app-0.1.1.zip`, SHA-256 `f14f068a962a617d255c9cfba6a9ba581496c5c6b3c7dc4713ac2b4bb1be1de8`, 35 entradas. Reverificado hoy: `03F-recheck-results.md`.
- **Tienda:** `radaelli-swimwear-dev.myshopify.com`. Theme Radaelli `189072474431` (sin publicar). Horizon `189072113983` (live: no se toca).
- **Reemplaza en la práctica a:** `OWNER-WORKFLOW.md` (10 pasos, versión 0.1.0). Qué se corrigió y qué se recortó: § 6.
- **Diseño y GO/NO-GO:** `theme/03D-accounts-app-design.md` (§ 8, GO/NO-GO 10–15) y `theme/customer-accounts-report.md` (§ 20, GO/NO-GO 1–9). Contrato de la app: `app/README.md`.
- **Duración estimada:** 90–120 min, más las esperas de los códigos por email y la elección del destino del backend.
- **Evidencia:** `MEDIDO` (corrido hoy) · `CODE` (archivo:línea) · `DOC` (fuente oficial, consultada en 03D/03E) · `INFERENCIA` · `NOT_VERIFIED` (sin probar contra Shopify) · `NOT_AVAILABLE` (dato que no está en el repo).

---

## 0. Cómo leer este runbook

**Quién hace cada cosa**

| Etiqueta | Significado |
|---|---|
| `[SOLO DUEÑA]` | Solo Daniela: cuentas, login, consentimiento OAuth, distribución, secretos, códigos de ingreso. Claude no lo hace ni lo ve. |
| `[CLAUDE]` | Lo hace Claude en el repo o con la CLI ya autenticada por la dueña. Todo lo que publica o descarga algo pide un OK explícito en el chat antes de correrse. |
| `[DUEÑA + CLAUDE]` | La dueña navega y Claude observa (código fuente, DevTools, logs). |
| `IRREVERSIBLE` | No tiene rollback. Hay que decidirlo con el paso 3 leído entero. |

**Reglas que no cambian**
- Claude **no crea cuentas**, no acepta OAuth por la dueña, y no ve ni escribe secretos, códigos de ingreso ni contraseñas.
- Los secretos solo se nombran (`SHOPIFY_API_SECRET`). Nunca se pegan en el chat, en el repo ni en un `.env` versionado.
- **`wishlist_account_sync` es el último interruptor.** Se enciende una sola vez, después de los pasos 1–10, en el **theme Radaelli sin publicar** y desde el Editor de temas. Nunca en Horizon. Nunca con un `theme push` de `settings_data.json`. `theme-src` sigue en `false` (`theme-src/config/settings_data.json:29`, verificado hoy) hasta la decisión final del § 4.
- Los comandos son PowerShell, corridos desde `C:\CLAUDE\rada-main\rada-main\commerce-main\commerce-main\.claude\worktrees\shopify-migration-prep\shopify-migration\app`. Con PowerShell 5.1 se usa `curl.exe`, no `curl`.

**Orden real de ejecución**

`P → 1 → 2 → 3 → 5 → 4 → 6 → 7 → 8 → 9a → 10 → 9b → [interruptor] → 11 → 12 → 13 → 14`

El paso 5 va antes del 4 porque `shopify app deploy` publica la URL del backend (`application_url`, URL del app proxy y `BACKEND_URL` de la extensión). El 9 se parte en dos porque la URL de "Mis favoritos" solo se puede copiar después de ingresar (paso 10).

## 1. Resumen

| Paso | Qué | Quién | Reversible | Valida |
|---|---|---|---|---|
| P | Decisiones previas (organización, destino, app DEV, segundo navegador) | Dueña | Sí | Precondición de 7 |
| 1 | Login de desarrolladora | `[SOLO DUEÑA]` | Sí | Precondición de 7 |
| 2 | Link de la app y `shopify.app.toml` | `[SOLO DUEÑA]` + `[CLAUDE]` | Sí | T1 |
| 3 | Custom distribution | `[SOLO DUEÑA]` **IRREVERSIBLE** | **No** | 6 (parcial) |
| 4 | Publicar la versión, instalar y aceptar scopes | `[CLAUDE]` + `[SOLO DUEÑA]` | Sí | T2, 6 (parcial) |
| 5 | Destino de despliegue del backend | `[SOLO DUEÑA]` elige; `[CLAUDE]` verifica | Sí | Terreno de 2, 7, 8, 13 |
| 6 | Secretos y variables de entorno | `[SOLO DUEÑA]` | Sí | Terreno de 7 |
| 7 | Metafield de cliente `custom.wishlist` | `[SOLO DUEÑA]` | Solo sin datos | W1 (en 11) |
| 8 | App embed | `[DUEÑA + CLAUDE]` | Sí | Terreno de 2, 8, 13 |
| 9 | Extensión "Mis favoritos" (menú y URL) | `[DUEÑA + CLAUDE]` | Sí | 6 (parcial) |
| 10 | Código de ingreso real | `[SOLO DUEÑA]` | Sí | 9, 1 (parcial) |
| — | Interruptor `wishlist_account_sync` | `[DUEÑA + CLAUDE]` | Sí, instantáneo | — |
| 11 | Unión invitada → cuenta | `[DUEÑA + CLAUDE]` | Sí | 1, 2, 4, 7, 8, 13, W1 |
| 12 | Prueba entre dispositivos | `[DUEÑA + CLAUDE]` | Sí | 4, 6, 10, 11, 12, 14, 15 |
| 13 | Cierre de sesión | `[DUEÑA + CLAUDE]` | Sí | 1, 3 |
| 14 | Desinstalar y reinstalar | `[SOLO DUEÑA]` + `[CLAUDE]` | Sí | Persistencia de `custom.*` (INFERENCIA de 03D) |

---

## 2. Preparación (P): decisiones antes del paso 1

| # | Decisión | Por qué importa | Cómo se resuelve |
|---|---|---|---|
| **P1** | ¿La Dev Store aparece en **Dev Dashboard > Dev stores**, en la misma organización donde se creará la app? | Decide cómo obtiene la función el token de Admin. *Client credentials* exige la misma organización (`DOC`, 03D § 2d). Cómo se creó la Dev Store es `NOT_AVAILABLE` | **Sí** → `ADMIN_TOKEN_SOURCE=client_credentials`. **No** → **NO-GO**: la 0.1.1 no trae la ruta para obtener un token offline (README § 11.8). Parar y decidir antes de seguir |
| **P2** | Destino del backend | Hace falta una URL HTTPS estable antes del paso 4 | Paso 5. Solo la elige la dueña |
| **P3** | Crear una app **DEV** ("Radaelli Favoritos DEV") solo para la Dev Store | El paso 3 es irreversible y deja la app atada a esa tienda | **Recomendado.** La tienda real usa otra app, más adelante |
| **P4** | Segundo navegador o dispositivo | Pasos 12 y 13 | Por ejemplo Edge en el mismo PC o el celular de la dueña |

**Línea base, verificada hoy** (`03F-recheck-results.md`): 156/156 tests, 20/20 mutantes, zip 0.1.1 con SHA-256 `f14f068a…1de8` reproducible en dos corridas. Requisitos en el PC de la dueña: Node >= 20 (probado con 24.19.0) y Shopify CLI (`shopify version`; en 03B se usó la 4.8.2 para themes).

---

## 3. Los 14 pasos

### Paso 1. Login de desarrolladora `[SOLO DUEÑA]`

- **Dónde:** el navegador de la dueña, con su cuenta de Shopify, y la terminal del PC.
- **Acción exacta:**
  1. Abrir el Dev Dashboard y confirmar que existe una organización y que en Dev stores figura `radaelli-swimwear-dev` (P1). Si la dueña no tiene cuenta de desarrolladora, la crea ella: Claude no crea cuentas.
  2. Correr `shopify version`. Si la CLI no está, la instala la dueña.
  3. El login de la CLI se dispara con el primer comando que lo necesita (el `config link` del paso 2). La CLI muestra un código de dispositivo y una URL: la dueña abre la URL, verifica el código y aprueba. Claude no anota ese código.
- **Resultado esperado:** la CLI queda autenticada con la cuenta de desarrolladora y el paso 2 lista la organización que contiene la Dev Store.
- **Rollback:** `shopify auth logout` (`NOT_VERIFIED` con la CLI 4.x). No hay efecto en la tienda.
- **GO/NO-GO que valida:** ninguno de 1–15. Cierra la precondición de **7** (P1). El login de themes de 03A/03B es otra sesión (`INFERENCIA`).

### Paso 2. Link de la app `[SOLO DUEÑA]` + `[CLAUDE]`

- **Dónde:** Dev Dashboard (crear o elegir la app) y la terminal, en `app/`.
- **Acción exacta:**
  1. `[SOLO DUEÑA]` Si la app no existe, crearla en el Dev Dashboard con el nombre de P3.
  2. `[CLAUDE]` Guardar una copia del TOML (sin secretos):
     ```powershell
     Copy-Item shopify.app.toml "$env:TEMP\radaelli-shopify.app.toml.bak"
     ```
  3. `[SOLO DUEÑA]` Vincular. Elige organización y app en la CLI:
     ```powershell
     shopify app config link
     ```
     (o `shopify app config link --client-id <CLIENT_ID>`; el client id no es secreto, pero no se pega en canales públicos).
  4. `[CLAUDE]` `config link` "crea o sobrescribe" el TOML con la configuración remota (`DOC`). Volver a aplicar desde la copia estas secciones: `embedded`, `[build]`, `[access_scopes]`, `[auth]`, `[webhooks]` (con su suscripción de compliance) y `[app_proxy]`. Conservar `client_id` y, si hace falta, `name`.
  5. `[CLAUDE]` Comparar y correr la suite:
     ```powershell
     fc.exe "$env:TEMP\radaelli-shopify.app.toml.bak" shopify.app.toml
     node --test test
     ```
- **Resultado esperado:**
  - El `fc.exe` (después de reaplicar las secciones) muestra **solo** la línea `client_id` (y `name` si cambió).
  - `scopes` sigue siendo exactamente `read_customers,write_customers,read_products,write_app_proxy,customer_read_customers`.
  - **155/156** tests. La única falla es `shopify.app.toml: sin client_id, scopes mínimos…` (`test/config.test.mjs:84`), una guarda de "antes de vincular" (`MEDIDO` en copia temporal, 03F-recheck-results.md § 7). Cualquier otra falla es real: NO-GO.
- **Rollback:** `Copy-Item "$env:TEMP\radaelli-shopify.app.toml.bak" shopify.app.toml -Force`. La app queda creada en el Dev Dashboard, sin instalar y sin efecto.
- **GO/NO-GO que valida:** **T1** (155/156 con solo esa falla).

### Paso 3. Custom distribution `[SOLO DUEÑA]` **IRREVERSIBLE**

- **Dónde:** Dev Dashboard > la app > Home > tarjeta **Distribution**.
- **Acción exacta:**
  1. Confirmar que es la app DEV (P3).
  2. "Select distribution method" > **Custom distribution**.
  3. Dominio `radaelli-swimwear-dev.myshopify.com` > **Generate link**. Copiar el link y guardarlo en privado.
  - Antes de elegir, mirar si el Dev Dashboard permite instalar la app en una dev store de la misma organización **sin** elegir distribución. La página oficial no lo aclara (`NOT_VERIFIED`). Si existe esa vía, usarla para la app DEV y guardar la decisión irreversible para la app de producción.
- **Resultado esperado:** link de instalación generado. "You can't change the distribution method after you select it" (`DOC`, 03D § 2d): la app queda atada a esa tienda (o a las de una organización Plus).
- **Rollback:** **ninguno.** Mitigación: P3. Si se equivoca, se crea otra app.
- **GO/NO-GO que valida:** **6** (parcial): la distribución custom está disponible. Que la extensión full-page funcione con custom distribution en el plan real sigue abierto (Basic o superior según `DOC`; plan real `NOT_AVAILABLE`).

### Paso 4. Publicar la versión, instalar y aceptar scopes `[CLAUDE]` + `[SOLO DUEÑA]`

Requiere la URL del paso 5.

- **Dónde:** terminal en `app/`, Dev Dashboard, link del paso 3 y Admin (Configuración > Apps).
- **Acción exacta:**
  1. **4a `[CLAUDE]` Host real.** Reemplazar `REEMPLAZAR-host-de-la-funcion.example` por el host del paso 5 (sin barra final):
     | Archivo | Campo | Valor |
     |---|---|---|
     | `shopify.app.toml` | `application_url` | `https://<HOST>` |
     | `shopify.app.toml` | `[app_proxy] url` | `https://<HOST>/proxy` |
     | `shopify.app.toml` | `[auth] redirect_urls` | `https://<HOST>/auth/callback` |
     | `extensions/mis-favoritos/src/config.js` | `BACKEND_URL` | `https://<HOST>` |

     Correr `node --test test`: **154/156**. Fallan solo las dos guardas previas al deploy: `shopify.app.toml: sin client_id…` y `api.removeFavorite: con el placeholder de BACKEND_URL no llama a nada` (`test/extension.test.mjs:222`) (`MEDIDO` en copia temporal). Esto es **T2**.
  2. **4b `[CLAUDE]`, con el OK de la dueña para `npm install`. Dependencias de la extensión.** `extensions/mis-favoritos/` no tiene `package.json`. Es lo menos verificado del flujo.
     1. Guardar el hash de la carpeta fuente: `Get-ChildItem extensions\mis-favoritos\src -File | Get-FileHash | Select-Object Hash,Path`.
     2. `shopify app generate extension --path . --name tmp-plantilla-cuenta` y elegir la plantilla de UI de cuenta de cliente (el identificador exacto es `NOT_VERIFIED`).
     3. Copiar su `package.json` a `extensions/mis-favoritos/`. Deben quedar `preact` y `@shopify/ui-extensions` alineada con `2026-07`.
     4. Borrar `extensions/tmp-plantilla-cuenta` para que no se despliegue.
     5. `npm install` dentro de `extensions/mis-favoritos`.
     6. Repetir el hash del punto 1: `src/` no debe haber cambiado.
  3. **4c `[CLAUDE]`, con OK explícito de la dueña en el chat. Publicar.**
     ```powershell
     shopify app deploy --path . --message "03F dev 0.1.1"
     ```
     **Nunca** `--allow-deletes`. La CLI debe pedir confirmación y listar la configuración (scopes, app proxy, webhooks) y **2 extensiones**: `mis-favoritos` y `wishlist-transport`. El texto exacto de la confirmación es `NOT_VERIFIED`. Es la primera vez que la CLI valida los dos `shopify.extension.toml`, `shopify.app.toml` y el Liquid del app embed: un error de validación se corrige en el archivo que señala, no se fuerza.
  4. **4d `[SOLO DUEÑA]`** Dev Dashboard > la app > API access > **Allow network access** (la extensión declara `network_access = true`). Según la doc, la aprobación es automática.
  5. **4e `[SOLO DUEÑA]` Instalar.** Abrir el link del paso 3. La pantalla de permisos debe mostrar **exactamente** cinco scopes: `read_customers`, `write_customers`, `read_products`, `write_app_proxy` y `customer_read_customers`. Si pide otro, o falta uno, **cancelar** y avisar. Si coinciden, la dueña acepta (consentimiento OAuth: solo ella).
- **Resultado esperado:**
  - Configuración > Apps muestra la app.
  - En el Editor del theme Radaelli, App embeds muestra "Favoritos en la cuenta" **desactivado** (`DOC`: los app embeds vienen desactivados al instalar).
  - Si tras aceptar Shopify abre una pantalla de error del backend, no invalida la instalación mientras la app figure en Configuración > Apps. La 0.1.1 no tiene ruta OAuth (README § 11.8) y qué abre Shopify al terminar la instalación de una app no embebida es `NOT_VERIFIED`.
- **Rollback:**
  - Configuración > Apps > la app > Desinstalar.
  - Volver a una versión anterior: `shopify app release --version <anterior>` (`INFERENCIA` como rollback).
  - Ninguno toca clientas ni metafields.
- **GO/NO-GO que valida:** **T2** (4a) y **6** (parcial: se instala con esta distribución y este plan).

### Paso 5. Destino de despliegue del backend `[SOLO DUEÑA]` elige y crea · `[CLAUDE]` verifica

La app es un servidor Node sin dependencias y **sin base de datos**. Este runbook **no elige proveedor**: lista qué exige el código para que la dueña compare.

**Requisitos (todos `CODE` salvo indicación)**

| # | Requisito | Origen |
|---|---|---|
| 1 | Node >= 20 (probado con 24.19.0). Sin `npm install` ni build: 0 dependencias | `package.json` |
| 2 | Proceso de larga duración: `node server/server.mjs` (`node:http`). Escucha en `PORT` (8080 por defecto) y `HOST` (`0.0.0.0`) | `server/server.mjs` |
| 3 | HTTPS público con certificado válido. El servicio puede hablar HTTP simple detrás de un proxy que ponga el TLS | `server.mjs`; `extensions/mis-favoritos/src/config.js` |
| 4 | **Servicio en la raíz de su host, sin prefijo de ruta.** `BACKEND_URL` solo admite `https://host[:puerto]`, y las rutas son `/proxy/wishlist`, `/ca/wishlist`, `/webhooks` y `/` | `config.js` (`isConfiguredBackend`), `handlers.mjs` |
| 5 | Inyección de variables desde un gestor de secretos. La función **no lee `.env`** | `server/config.mjs` |
| 6 | Salida HTTPS hacia `{tienda}.myshopify.com` (Admin GraphQL) | `server/admin-client.mjs` |
| 7 | Sin disco persistente: el único estado está en memoria (token de *client credentials* y rate limit) | `server.mjs`, README § 3 |
| 8 | **Una sola instancia.** El rate limit es por instancia (con N instancias, el límite real es N veces el configurado) | README § 4 |
| 9 | Proceso que no se apague entre requests. El transporte corta a los 10 s y la función corta sus llamadas a Shopify a los 10 s: un arranque en frío de varios segundos produce timeouts (reintentos 2/8/30 s en `wishlist.js`, sin pérdida) | `wishlist-transport.js`, `UPSTREAM_TIMEOUT_MS` |
| 10 | Logs de stdout visibles para la dueña y para Claude (líneas JSON: `listening`, `config_invalid`, `request`). No llevan datos personales | `logger.mjs` |
| 11 | URL estable. Está escrita en el TOML y en `config.js`: cambiarla exige un nuevo `app deploy` | Pasos 4a y 4c |
| 12 | Atiende SIGTERM (cierra y sale) | `server.mjs` |

**Opciones, sin marca**

| Opción | Cumple hoy | Qué hay que resolver |
|---|---|---|
| Servidor propio o VPS con Node y un proxy inverso con TLS | Sí | Certificado, reinicio del proceso, guardar las variables fuera del repo |
| Plataforma de contenedores o de aplicaciones que ejecute `node server/server.mjs` con HTTPS y variables secretas | Sí, si permite **una** instancia siempre encendida | Confirmar que no duerme el proceso ni escala solo a más de una instancia |
| Funciones serverless por request | **No** con la 0.1.1 | Requiere un adaptador que no existe (cambio de código, fuera de esta fase) |
| PC de la dueña con un túnel HTTPS | Solo para humo | La URL cambia y el PC tiene que estar encendido: no sirve para los GO/NO-GO de 11–13 |

Costos, regiones y latencia: `NOT_AVAILABLE` (no se evaluaron; la latencia se suma a cada corazón).

- **Dónde:** el panel del destino elegido.
- **Acción exacta:**
  1. `[SOLO DUEÑA]` Elegir la opción, crear el servicio (la cuenta en el proveedor la crea ella) y anotar la URL HTTPS `<HOST>`. Pasársela a Claude para el paso 4a.
  2. `[SOLO DUEÑA]` Subir el código. Basta `server/` y `package.json` de `dist/radaelli-wishlist-app-0.1.1.zip` (carpeta `radaelli-wishlist-app-0.1.1/`). El zip trae además tests, extensiones y documentos, que la función no usa.
  3. Comando de arranque: `node server/server.mjs`, desde esa carpeta.
- **Resultado esperado:** con el servicio arrancado **y sin variables cargadas**, la función **no arranca** y deja una línea como esta (`MEDIDO` con configuración vacía):
  `{"level":"error","event":"config_invalid","detail":"SHOPIFY_API_KEY:missing,SHOPIFY_API_SECRET:missing,ALLOWED_SHOPS:missing,SHOPIFY_ADMIN_ACCESS_TOKEN:missing"}`.
  Nombra variables, nunca valores (`server/config.mjs`).
- **Rollback:** apagar o borrar el servicio. Shopify no se entera; si el paso 4 ya publicó la URL, se vuelve a publicar con la nueva.
- **GO/NO-GO que valida:** ninguno de 1–15 por sí solo. Deja listo el terreno de **2, 7, 8 y 13** (se validan en el paso 11).

### Paso 6. Secretos y variables de entorno `[SOLO DUEÑA]`

Requiere la app **instalada** (paso 4): *client credentials* solo entrega token a una app instalada (`DOC`).

- **Dónde:** el gestor de secretos del destino (paso 5). El client id y el client secret se ven en el Dev Dashboard.
- **Acción exacta:**
  1. Cargar solo estos nombres:

     | Variable | Valor | ¿Secreto? |
     |---|---|---|
     | `SHOPIFY_API_KEY` | Client ID de la app | No |
     | `SHOPIFY_API_SECRET` | Client secret de la app | **Sí** |
     | `ALLOWED_SHOPS` | `radaelli-swimwear-dev.myshopify.com` | No |
     | `ADMIN_TOKEN_SOURCE` | `client_credentials` (P1 = sí) | No |
     | `SHOPIFY_ADMIN_ACCESS_TOKEN` | **No definirla** con `client_credentials`. Con `env` sería el token offline de **una** tienda (secreto) y la 0.1.1 no trae cómo obtenerlo | — |
     | Las 11 restantes | Valores por defecto de README § 5: `ALLOWED_PATH_PREFIXES=/apps/radaelli`, `SHOPIFY_API_VERSION=2026-07`, `REQUIRE_CSRF_HEADER=true`, `EMPTY_LIST_STRATEGY=set_empty`, `PROXY_MAX_SKEW_SEC`, `SESSION_TOKEN_LEEWAY_SEC`, `UPSTREAM_TIMEOUT_MS`, `RATE_LIMIT_BURST`, `RATE_LIMIT_PER_MINUTE`, `PORT`, `HOST` | No |

  2. Reiniciar el servicio.
  3. `[CLAUDE]` o la dueña: humo con URLs públicas, sin secretos. Son las mismas respuestas que dio la función local con configuración falsa (`MEDIDO` en 03E):

     | Comando | Esperado |
     |---|---|
     | `curl.exe -i https://<HOST>/` | `200` · `Radaelli Favoritos: servicio sin panel de administracion.` |
     | `curl.exe -i -X POST -H "Content-Type: application/json" -d "{}" https://<HOST>/proxy/wishlist` | `401` · `{"v":1,"error":"invalid_signature"}` |
     | `curl.exe -i https://<HOST>/proxy/wishlist` | `405` · `method_not_allowed` · `Allow: POST` |
     | `curl.exe -i -X OPTIONS https://<HOST>/ca/wishlist` | `204` · `Access-Control-Allow-Origin: *` · `Access-Control-Allow-Methods: POST, OPTIONS` |
     | `curl.exe -i -X POST -H "Content-Type: application/json" -d "{}" https://<HOST>/ca/wishlist` | `401` · `{"v":1,"error":"missing_token"}` |
     | `curl.exe -i -X POST https://<HOST>/webhooks` | `401` · `invalid_signature` |
- **Resultado esperado:** en el log, `{"level":"info","event":"listening",…}` y las 6 respuestas de la tabla.
- **Rollback:** detener el servicio. Si un secreto se expuso (chat, log, captura), rotar el client secret en el Dev Dashboard y volver a cargarlo.
- **GO/NO-GO que valida:** deja listo **7**. Se cierra en el paso 11.1: una escritura con `200` con *client credentials* es PASS; `502 admin_error` en todas las escrituras es NO-GO 7 (token o scopes).
- **Producción:** si la tienda real no está en la misma organización, el token de Admin de la 0.1.1 no se puede obtener. Es una decisión previa, fuera de este runbook.

### Paso 7. Metafield de cliente `custom.wishlist` `[SOLO DUEÑA]`

- **Dónde:** Admin de `radaelli-swimwear-dev` > Configuración > Metacampos y metaobjetos > **Clientes** > Agregar definición (los textos exactos en español son `NOT_VERIFIED`). Se crea **desde el Admin**, no desde el TOML.
- **Acción exacta:**

  | Campo | Valor |
  |---|---|
  | Nombre | Libre (sugerencia técnica: "Favoritos") |
  | Namespace y clave | **`custom.wishlist`**, exacto. Lo leen `theme-src/layout/theme.liquid` (`customer.metafields.custom.wishlist.value`, hoy en `:183`) y la función |
  | Tipo | Producto → **lista** (`list.product_reference`) |
  | Validaciones | **Ninguna.** Sin `list.max` (rompería la regla de no recortar listas heredadas) |
  | Acceso "Customer accounts" | **Lectura**. Si el Admin solo ofrece "Lectura y escritura", elegir eso: la extensión no escribe por ahí (R2) |
  | Acceso "Storefronts" | Sin activar. Si en el paso 11 el bootstrap sale sin la lista mientras el Admin la tiene, activarlo y repetir |
- **Resultado esperado:** la definición aparece en Clientes con tipo lista de productos, sin validaciones y con acceso Customer accounts. No se usa el namespace `$app`: sus definiciones se borran al desinstalar (`DOC`, 03D § 2b).
- **Rollback:** sin datos, se puede borrar la definición. **Con datos, no borrarla:** el efecto sobre los valores es `NOT_VERIFIED`.
- **GO/NO-GO que valida:** **W1** (Liquid lee `custom.wishlist`), que se cierra en 11.5. **5** (Customer Account API escribe) no aplica: es opcional desde R2.

### Paso 8. App embed `[DUEÑA + CLAUDE]`

- **Dónde:** Editor del theme **Radaelli**: `admin.shopify.com/store/radaelli-swimwear-dev/themes/189072474431/editor` > Configuración del tema > **App embeds**. No usar un enlace con `themes/current`: abre Horizon, que es el theme live.
- **Acción exacta:**
  1. Activar "Favoritos en la cuenta".
  2. Dejar vacío "URL de la página Mis favoritos" (se completa en 9b).
  3. Guardar.
- **Resultado esperado:**
  - El embed queda activo en el theme sin publicar.
  - Sin sesión no imprime nada. Con sesión imprime `<script id="radaelli-wishlist-transport-config">` y carga `wishlist-transport.js` (`wishlist-transport.liquid` solo dibuja con `customer`). Se ve en el código fuente en el paso 11.0.
  - Sin `wishlist_account_sync`, `wishlist.js` ignora el transporte (doble interruptor).
- **Rollback:** embed en OFF desde el mismo lugar (instantáneo).
- **Advertencia:** un `shopify theme push` de `config/settings_data.json` desde `theme-src` apaga el embed y el interruptor, porque `theme-src` no los tiene. Hasta la decisión final, todo push usa `--ignore config/settings_data.json`.
- **GO/NO-GO que valida:** ninguno por sí solo. Es precondición de **2, 8 y 13**.

### Paso 9. Extensión de cuenta "Mis favoritos" `[DUEÑA + CLAUDE]`

- **9a. Antes de ingresar.**
  - **Dónde:** Admin > Configuración > Checkout y cuentas > editor de cuentas de cliente (nombres exactos `NOT_VERIFIED`) y Contenido > Menús.
  - **Acción exacta:** agregar la extensión "Mis favoritos" (ya publicada en 4c) a la cuenta. Aceptar la oferta de sumarla al menú de la cuenta (`DOC`). Si no la ofrece: Contenido > Menús > `customer-account-main-menu` (el que usa el header: `theme-src/sections/header.liquid:215`) > Agregar elemento > página de la app > Guardar.
  - **Resultado esperado:** existe el ítem "Mis favoritos" en el menú de la cuenta.
- **9b. Después del paso 10.**
  - **Acción exacta:** con sesión iniciada, abrir "Mis favoritos" desde la cuenta y copiar la URL de la barra de direcciones (su formato es `NOT_AVAILABLE` en la doc). Pegarla en Editor > App embeds > Favoritos en la cuenta > "URL de la página Mis favoritos" > Guardar. Vacía, se usa `routes.account_url` (`wishlist-transport.liquid:14-17`).
  - **Resultado esperado:** el aviso de `wishlist.js` que lleva a la cuenta apunta a "Mis favoritos" (se ve en el paso 11).
- **Rollback:** quitar el ítem del menú y la extensión del editor de cuentas; vaciar el setting del embed.
- **GO/NO-GO que valida:** **6** (parcial: el ítem aparece en el menú y en la hoja de `<shopify-account>`). El render completo se valida en 12.3.

### Paso 10. Código de ingreso real `[SOLO DUEÑA]`

Es el bloqueo `DEFERRED_OWNER_ONLY_BLOCKER` de 03B. **El código de 6 dígitos lo escribe solo la dueña.** Claude no lo lee, no lo pide y no lo copia.

- **Dónde:** Chrome del PC. `https://radaelli-swimwear-dev.myshopify.com/?preview_theme_id=189072474431`.
- **Acción exacta** (`theme/03D-search-accounts-wishlist-report.md` § F):
  1. Abrir esa URL.
  2. Ícono de cuenta > "Iniciar sesión" > correo de acceso de la tienda (el mismo de 03B) > "Continuar".
  3. Abrir el correo, copiar el código de 6 dígitos y escribirlo en la pantalla de Shopify.
  4. Avisar a Claude: "listo".
  5. Hacer el paso 9b.
  6. `[CLAUDE]` verifica con la dueña:
     - el header muestra la sesión (la inicial);
     - `/account` abre la cuenta nueva de Shopify;
     - en una ventana de incógnito, `/account/login` y `/account/register` llevan a las páginas de Shopify, no a un template legacy.
- **Resultado esperado:** sesión iniciada en la Dev Store. Solo se probó la vía del código por email; las vías Shop y `storefront_login_url` quedan `NOT_VERIFIED`.
- **Rollback:** cerrar sesión desde la cuenta.
- **GO/NO-GO que valida:** **9** (templates legacy ignorados; el POST legacy a `/account` no se prueba: podría crear datos) y **1** (parcial: la sesión se ve en el header; el bootstrap con `customer` se valida en 11.0).

### Interruptor: encender `wishlist_account_sync` `[DUEÑA + CLAUDE]`

Este es el último interruptor. Solo si los pasos 1–10 están en verde: función viva con las 6 respuestas del humo, app instalada, definición creada, embed activo, ítem en el menú e ingreso probado.

- **Dónde:** Editor del theme **Radaelli** (`…/themes/189072474431/editor`) > Configuración del tema > **Wishlist** (el nombre del grupo es `Wishlist`, `theme-src/config/settings_schema.json:211`) > "Sincronizar favoritos con la cuenta de la clienta".
- **Acción exacta:** activar y guardar.
- **Resultado esperado:** el theme sin publicar imprime el bootstrap de cuenta (bloque `settings.wishlist_account_sync` de `theme-src/layout/theme.liquid`, hoy en `:165`).
- **Rollback:** desactivar (instantáneo). Es el nivel 1 del § 5.
- **Prohibido:** hacerlo en Horizon, en un theme publicado, o con `theme push` de `settings_data.json`.

### Paso 11. Unión invitada → cuenta `[DUEÑA + CLAUDE]`

- **Dónde:** Chrome del PC, con DevTools; logs de la función.
- **Preparación `[CLAUDE]`:** Network con el filtro `apps/radaelli`, y en la consola:
  ```js
  document.addEventListener("wishlist:sync-status", (e) => console.log("sync", e.detail.state));
  ```
  Productos de prueba (existen en el catálogo 03C): **A** `brisa-natural-beige`, **B** `costa-esmeralda-negro`, **C** `bikini-foam`, **D** `alba-dorada-lila`.
- **Acción exacta y resultado esperado:**

  | # | Acción | Resultado esperado | GO/NO-GO |
  |---|---|---|---|
  | 11.0 | Con sesión, recargar una ficha y mirar el código fuente | Existe `<script type="application/json" id="wishlist-account-state">` con `"owner"` e `"items"`. Existe `radaelli-wishlist-transport-config` y `wishlist-transport.js` carga con `200` | 1 (con sesión) |
  | 11.1 | Con sesión: corazón en **B** y después en **D** | Cada toque: `POST /apps/radaelli/wishlist` → `200`. Consola `sync synced`. Log de la función: `route:"proxy"`, `code:"ok"`, `writes:1` | 2, 7, 8 (sin `400 missing_csrf_header` ni `415`), 13 (la primera llamada da `200` con la tienda protegida con contraseña), 4 |
  | 11.2 | Admin > Clientes > la clienta > Metacampos | `custom.wishlist` = [B, D], en ese orden | 4 (alta inicial con `compareDigest` nulo) |
  | 11.3 | Cerrar sesión | Vuelve a modo invitada | 1 (`nil` al salir) |
  | 11.4 | Como invitada, en el mismo navegador: corazón en **A**, **B** y **C** | Guardado local. Ninguna llamada a `/apps/radaelli` | Modo invitada |
  | 11.5 | Volver a ingresar (código, solo la dueña) | Unión: la lista queda **[B, D, A, C]**. Contador en 4. Admin igual. `sync synced` | Unión (03D § 7.1), **W1** (el bootstrap trae la lista desde `custom.wishlist`) |
  | 11.6 | Recargar 2 veces | Sin escrituras nuevas (log `writes:0`). Misma lista | Idempotencia |
  | 11.7 | Revisar el log de toda la prueba | 0 × `401 no_customer` y 0 × `invalid_signature` | 2 |

- **Si falla:**

  | Síntoma | Qué significa | Acción |
  |---|---|---|
  | Todo `400 missing_csrf_header` | El proxy no reenvía el header propio | `REQUIRE_CSRF_HEADER=false` → reiniciar → repetir (README § 4). Queda documentado |
  | `415 unsupported_media_type` | El proxy no reenvía `Content-Type` | **NO-GO 8**: requiere un cambio de diseño |
  | `401 no_customer` intermitente | Riesgo B2 | **NO-GO 2**: no encender |
  | `502 admin_error` en todas las escrituras | Token o scopes | Revisar los pasos 4e y 6: **NO-GO 7** |
  | Bootstrap sin la lista mientras el Admin la tiene | Liquid no lee el metafield | Activar "Storefronts" en la definición (paso 7) y repetir. Si igual falla: **NO-GO W1** |
- **Rollback:** interruptor en OFF. Los datos de prueba se quitan desmarcando los corazones o editando el metafield de la clienta de prueba en el Admin.
- **GO/NO-GO que valida:** 1, 2, 4, 7, 8, 13 y W1 (detalle en la tabla).

### Paso 12. Prueba entre dispositivos `[DUEÑA + CLAUDE]`

Disponibilidad: si "Mis favoritos" muestra todo "Agotado", es el hallazgo C2 (no hay zona de envío Colombia), no un fallo de la app. La prueba sigue: no mide stock.

- **Dónde:** navegador 1 (Chrome) y navegador 2 (P4); Admin.
- **Acción exacta y resultado esperado:**

  | # | Acción | Resultado esperado | GO/NO-GO |
  |---|---|---|---|
  | 12.1 | Navegador 2: ingresar con la misma clienta (código, solo la dueña) | Corazones y contador en 4, sin datos locales previos | Sincronización |
  | 12.2 | Navegador 2: quitar **D**. Navegador 1: recargar | Lista de 3 en los dos | — |
  | 12.3 | Navegador 1: cuenta > "Mis favoritos" | 3 tarjetas con imagen, precio y link a la ficha | 6, 14 |
  | 12.4 | En "Mis favoritos", quitar **C** | Toast "Producto quitado de favoritos.". `POST /ca/wishlist` → `200`. La tienda, al recargar, muestra 2 | 12 (`dest` del session token: ni `401 shop_not_allowed` ni `invalid_token`) |
  | 12.5 | Los dos navegadores agregan productos **distintos** casi a la vez (`raices-del-sol-beige-suave` y `bikini-palm-verde-oliva`) | Los dos quedan en la lista. Si hubo carrera, el log muestra `attempts:2` o más | 4 y 15 (la 0.1.1 **no registra** el código de CAS: solo se ve el reintento) |
  | 12.6 | Quitar todo hasta dejar la lista vacía | `200`. El Admin muestra la lista vacía | 10. Si la última baja da `502 admin_error`: `EMPTY_LIST_STRATEGY=delete` → reiniciar → repetir |
  | 12.7 | *(Opcional, solo con OK explícito de la dueña)* Crear un producto de prueba, marcarlo como favorito y **borrarlo** (el borrado es permanente: **IRREVERSIBLE**) | "Mis favoritos" lo muestra como "Este producto ya no está disponible." y deja quitarlo | 11. Si no se hace: riesgo aceptado (el código contempla `null`) |
- **Rollback:** interruptor en OFF. Los datos de prueba se quitan como en 11.
- **GO/NO-GO que valida:** 4, 6, 10, 11 (opcional), 12, 14 y 15 (informativo).

### Paso 13. Cierre de sesión `[DUEÑA + CLAUDE]`

- **Dónde:** navegador 1 con 2 pestañas, y una ventana de incógnito.
- **Acción exacta y resultado esperado:**

  | # | Acción | Resultado esperado | GO/NO-GO |
  |---|---|---|---|
  | 13.1 | Con 2 pestañas abiertas, cerrar sesión en una | La otra deja de mostrar la lista de la cuenta (marcador `{"v":1,"signedOut":true}` y `BroadcastChannel`) | 1 (`nil` al salir) |
  | 13.2 | Ventana de incógnito: abrir la misma ficha y mirar el código fuente | Solo `{"v":1,"signedOut":true}` o nada. Ningún dato de la clienta | 3 (sin caché entre clientas ni anónimos) |
  | 13.3 | Seguimiento, sin bloquear: ingresar por la hoja de `<shopify-account>` y por `/customer_authentication/login`, y repetir 13.1 a las 24 h | `customer` vuelve a `nil` en cada caso | 1 (completo) |
- **Rollback:** no aplica; cerrar sesión ya es el rollback.
- **GO/NO-GO que valida:** **1** (`nil` al salir) y **3**.

### Paso 14. Desinstalar y reinstalar; qué sobrevive `[SOLO DUEÑA]` + `[CLAUDE]`

Se hace al final, después de los GO de 11–13. Es reversible, pero desinstalar corta el proxy y la extensión.

- **Dónde:** Admin (Configuración > Apps, y Clientes), Editor del theme y terminal.
- **Acción exacta:**
  1. `[CLAUDE]` Anotar la lista actual de `custom.wishlist` de la clienta de prueba, el valor del setting "URL de la página Mis favoritos" y que el interruptor esté en ON.
  2. `[SOLO DUEÑA]` Configuración > Apps > "Radaelli Favoritos DEV" > Desinstalar.
  3. `[CLAUDE]` Verificar qué desaparece: la extensión "Mis favoritos" y su ítem de menú, el app proxy (`/apps/radaelli/wishlist` deja de responder), el app embed y el token de Admin (las escrituras fallan).
  4. `[CLAUDE]` Verificar qué **sobrevive**: en Admin > Clientes, la definición `custom.wishlist` sigue y el valor de la clienta de prueba es el mismo del punto 1. Es del comercio (namespace `custom`), no de la app (`$app`).
  5. `[CLAUDE]` Con el interruptor todavía en ON y la app desinstalada, el theme debe seguir en modo invitada: sin transporte, `wishlist.js` ignora el bloque de cuenta y los corazones se guardan en el navegador (lo dice el comentario del bloque `wishlist_account_sync` en `theme-src/layout/theme.liquid`: "Sin la app registrada, wishlist.js ignora este bloque").
  6. `[SOLO DUEÑA]` Reinstalar con el link de custom distribution del paso 3 y aceptar los cinco scopes (si el link ya no sirve, generar otro desde el Dev Dashboard: `NOT_VERIFIED`).
  7. `[DUEÑA + CLAUDE]` Los app embeds vuelven **desactivados**: repetir el paso 8, el 9a y el 9b si se perdieron.
  8. `[CLAUDE]` Repetir un corazón: `200` y lista intacta. No hace falta tocar la función salvo que se haya rotado el client secret.
- **Resultado esperado:** la lista sobrevive a la desinstalación. Hoy es una `INFERENCIA`: ninguna página oficial consultada lo afirma para `custom.*` (03D § 2b). Este paso la vuelve `MEDIDO` o la refuta.
- **Si la lista no sobrevive:** **NO-GO** para instalar en la tienda real hasta rediseñar dónde vive la lista.
- **Rollback:** reinstalar. Con la lista intacta no hay nada que restaurar.
- **GO/NO-GO que valida:** ninguno de 1–15. Valida la persistencia de `custom.*` al desinstalar y, de paso, la ruta de reinstalación (7).

---

## 4. Decisión final y encendido

- **GO** solo si pasan todos los obligatorios del § 5. Recién ahí `[CLAUDE]` pone `wishlist_account_sync: true` en `theme-src/config/settings_data.json`. Es un cambio de código de una fase posterior, con su propio release y su regresión con Liquid real. Horizon y la publicación del theme son otra decisión.
- **NO-GO:** interruptor en OFF (y embed en OFF si hace falta). Se documenta el punto que falló. La tienda sigue en modo invitada, sin pérdida de datos.

## 5. Mapa GO/NO-GO (1–15, W1 y guardas)

| # | Qué se valida | Paso | PASS | Obligatorio |
|---|---|---|---|---|
| T1 | Suite local después de vincular | 2 | 155/156, solo la guarda `sin client_id` | Sí |
| T2 | Suite local con el host real | 4a | 154/156, solo las 2 guardas previas al deploy | Sí |
| 1 | `customer` en Liquid con sesión y `nil` al salir | 10, 11.0, 11.3, 13.1 | Bootstrap presente con sesión, `signedOut` sin ella. Otras vías y 24 h: seguimiento | Sí |
| 2 | `logged_in_customer_id` en el proxy | 11.1, 11.7 | 0 × `401 no_customer` en la sesión. Antes del lanzamiento, seguir los logs hasta pasar de 100 requests | Sí |
| 3 | Sin caché entre clientas o anónimos | 13.2 | Sin datos de cuenta en la ventana anónima | Sí |
| 4 | `metafieldsSet` + `compareDigest` | 11.1, 11.2, 12.5 | Alta inicial OK. Carrera sin pérdidas | Sí |
| 5 | La Customer Account API escribe | — | No aplica (R2: la extensión no escribe) | Opcional |
| 6 | Página full-page con esta distribución y plan; ítem en el menú | 3, 4e, 9, 12.3 | Página visible y enlazada | Sí |
| 7 | Token de Admin sin base de datos | P1, 6, 11.1, 14 | Escrituras `200` con `client_credentials` | Sí (P1) |
| 8 | El proxy reenvía `Content-Type` y el header anti-CSRF | 11.1 | Sin `415`. Sin `400 missing_csrf_header` (o `REQUIRE_CSRF_HEADER=false` documentado) | Sí |
| 9 | Templates legacy ignorados | 10 | `/account/login` y `/account/register` llevan a Shopify. El POST legacy no se prueba | Sí |
| 10 | Lista vacía `"[]"` + CAS | 12.6 | `200` con `set_empty` (o `delete` documentado) | Sí |
| 11 | `nodes()` con un producto borrado | 12.7 | Estado "ya no está disponible" | Opcional |
| 12 | `dest` del session token | 12.4 | `POST /ca/wishlist` `200` | Sí |
| 13 | Proxy con la tienda protegida con contraseña | 11.1 | Primera llamada `200` | Sí |
| 14 | `shopify.query` trae imagen y `onlineStoreUrl` | 12.3 | Imagen y link presentes | Sí |
| 15 | Código de error de CAS | 12.5 | Informativo: la 0.1.1 no lo registra | No |
| W1 | Liquid lee `custom.wishlist` | 11.5 | Bootstrap con la lista (con o sin "Storefronts") | Sí |
| — | La lista de `custom.*` sobrevive a la desinstalación | 14 | Definición y valor intactos | Sí (para producción) |

## 6. Auditoría de `OWNER-WORKFLOW.md`

**Se conserva:** los GO/NO-GO, las tablas de prueba, los guiones de humo, las guardas 155/156 y 154/156 (revalidadas hoy contra la 0.1.1) y las reglas de seguridad.

**Se corrige** (deriva detectada hoy; `OWNER-WORKFLOW.md` y `README.md` no se editaron en esta fase):

| Punto | Antes | Ahora |
|---|---|---|
| Versión y paquete | 0.1.0, zip `0.1.0`, SHA `559c346a…296a`, `--message "03E dev 0.1.0"` (6 menciones) | 0.1.1, SHA `f14f068a…1de8`, 35 entradas |
| Grupo del setting en el Editor | "Favoritos" | `Wishlist` (`settings_schema.json:211`) |
| Líneas citadas del theme | `theme.liquid:177`, `header.liquid:216` y `:378-381` | Hoy: `header.liquid:215` y `:377-379`; en `theme.liquid`, `:183` (lectura del metafield) y `:165` (bloque del setting). `theme.liquid` se modificó hoy a las 14:45 por una tarea ajena a esta: se cita por nombre y la línea es solo orientativa |
| URL de "Mis favoritos" (7c) | Se copiaba **antes** del ingreso (paso 8) | Después del ingreso: pasos 9a y 9b |
| Interruptor (7d) | Se encendía antes de ingresar, en el paso 7 | Último interruptor, tras el ingreso: § 3, "Interruptor" |
| Orden con el hosting | El host (D2) era una decisión previa suelta | Paso 5 explícito y anterior al 4 |
| README | Título 0.1.0, ruta del zip 0.1.0 y "19 errores" | La versión y el conteo reales son 0.1.1 y **20** mutantes (`03F-recheck-results.md`) |

**Se recorta:** la vía 2A de instalación sin distribución como camino principal (`NOT_VERIFIED`; queda como nota en el paso 3), la duplicación entre "Qué puede confundir" y el resto, y la separación 3a–3e (cinco subpasos) que ahora vive dentro del paso 4.

**Pendiente para una fase posterior de Claude:** marcar `OWNER-WORKFLOW.md` como reemplazado, o actualizar su versión y su hash, y corregir las dos referencias 0.1.0 del README.

## 7. Rollback por niveles

| Nivel | Acción | Efecto | Reversible |
|---|---|---|---|
| 1 | Interruptor `wishlist_account_sync` en OFF | El theme vuelve a modo invitada al instante | Sí |
| 2 | App embed en OFF | No se carga el transporte | Sí |
| 3 | Detener la función | La tienda deja todo pendiente sin perder nada (`wishlist.js`); "Quitar" de la extensión muestra error | Sí |
| 4 | `shopify app release --version <anterior>` | Vuelve a una versión anterior de configuración y extensiones | Sí (`INFERENCIA`) |
| 5 | Desinstalar la app | Se van extensión, proxy y embed. `custom.wishlist` queda (a confirmar en el paso 14) | Reinstalable |
| — | Custom distribution (paso 3) | — | **No** |
| — | Borrar la definición `custom.wishlist` con datos | Puede perder valores (`NOT_VERIFIED`) | **No hacerlo** |
| — | Borrar un producto de prueba (12.7) | Permanente | **No** |

## 8. Qué puede confundir

- **El zip 0.1.1 no incluye los dos documentos 03F** que ahora están en `app/`. Si se vuelve a empaquetar, el SHA-256 cambia (`pack.mjs` empaqueta todo `app/`, documentos incluidos). También cambia después de los pasos 2 y 4a, porque tocan el TOML y `config.js`. El hosting solo usa `server/` y `package.json`, que no cambian.
- **Tests "fallando" a propósito:** 155/156 después del paso 2 y 154/156 después del 4a. Cualquier otra falla es real.
- **Mercado US (C1, `MEDIDO` en 03E):** la sesión resuelve a Estados Unidos. No afecta al proxy: el transporte llama `/apps/radaelli/wishlist` sin prefijo de idioma. Anotar `Shopify.country` en cada corrida.
- **País CO (C2):** con país CO, los 29 productos figuran agotados. No es la app.
- **Push de `settings_data.json`:** apaga el embed y el interruptor (paso 8).

## 9. Fuentes

- Repo: `app/README.md`, `app/OWNER-WORKFLOW.md`, `theme/03D-accounts-app-design.md`, `theme/customer-accounts-report.md` § 20, `theme/03D-search-accounts-wishlist-report.md` § F, `theme/03E-shopify-security-readiness.md`, `theme/03E-owner-actions-one-shot.md`.
- Oficiales, consultadas en 03D y 03E (no se re-consultaron en 03F): shopify.dev (distribución custom, *client credentials*, `app config link`, `app deploy`, `app release`, app embeds, extensiones full-page, metafields de cuentas, app proxy) y help.shopify.com (definiciones de metafields, opciones de acceso).
- Corrida de hoy: `app/03F-recheck-results.md`.
