# App "Radaelli Favoritos" 0.1.2: flujo único de la dueña (Dev Store)

- **Fecha:** 2026-09-29 (Bogotá).
- **Para qué:** instalar la app de favoritos de cuenta en `radaelli-swimwear-dev` y probarla de punta a punta en una sola sesión, en orden, con el resultado esperado de cada paso, su rollback y el GO/NO-GO que valida.
- **Quién:** **D** = Daniela (dueña: cuentas, logins, consentimientos, secretos). **C** = Claude, a su lado (comandos, lectura de logs, verificación). Claude **nunca** ve ni escribe secretos, códigos de ingreso ni contraseñas.
- **Duración estimada:** 60–90 min, más la espera de los códigos por email.
- **Fuentes del diseño:** `app/README.md`, `theme/03D-accounts-app-design.md` (§ 8, GO/NO-GO 10–15) y `theme/customer-accounts-report.md` (§ 20, GO/NO-GO 1–9).
- **Evidencia:** `MEDIDO` · `CODE` (`archivo:línea`) · `DOC` (fuente oficial, §8) · `NOT_VERIFIED` · `NOT_AVAILABLE`.

---

## 0. Punto de partida (verificado hoy)

| Punto | Estado | Evidencia |
|---|---|---|
| Suite de la app | **156/156 PASS**, 7 suites, 0 fallas, Node 24.19.0 | `node --test …/shopify-migration/app/test`, corrida hoy (§7.1) |
| Paquete | `dist/radaelli-wishlist-app-0.1.2.zip` (SHA-256 en `theme/03F-sonnet-independent-completion-report.md`; un documento no puede incluir el hash de su propio zip) | `sha256sum`, hoy |
| Interruptor del theme | `wishlist_account_sync` = `false` | `theme-src/config/settings_data.json:29` |
| Theme | Radaelli `189072474431` sin publicar. Horizon `189072113983` live | 03D #44–45 |
| Mercado principal | **Estados Unidos**: la sesión resuelve a `Shopify.country = US` | `MEDIDO` 03E (C1) |
| País CO | Los 29 productos figuran **agotados** (no hay zona de envío Colombia) | `MEDIDO` 03E (C2) |
| Pagos | Ningún proveedor activo | `MEDIDO` 03E |
| Ingreso de clienta | Pendiente (código por email, owner-only) | 03D § F |

---

## 1. Antes de empezar: 4 decisiones y 3 interruptores

### Decisiones (sin D1 y D2 resueltas, no arrancar)

| # | Decisión | Por qué importa | Cómo se resuelve |
|---|---|---|---|
| **D1** | ¿La Dev Store aparece en **Dev Dashboard > Dev stores** de la **misma organización** donde se va a crear la app? | Define cómo obtiene la función el token de Admin (GO/NO-GO 7). *Client credentials* exige que "the app and the store belong to the same Shopify organization" y que la tienda figure en Dev stores; **no sirve** para tiendas creadas fuera del Dev Dashboard (`DOC`). Hoy es `NOT_AVAILABLE` cómo se creó la Dev Store | D mira el Dev Dashboard. **Sí** → `ADMIN_TOKEN_SOURCE=client_credentials`. **No** → **NO-GO**: la 0.1.x no trae la ruta para obtener un token offline (README § 11.8). Hay que decidir antes de seguir |
| **D2** | Hosting de la función | Hace falta una URL HTTPS **antes** del paso 3 | `NOT_AVAILABLE`: lo elige D. Requisitos:<br>- Node >= 20;<br>- HTTPS;<br>- gestor de secretos;<br>- logs visibles;<br>- sin base de datos;<br>- **una sola instancia** (el rate limit vive en memoria, README § 4). |
| **D3** | ¿App de prueba separada de la de producción? | La distribución custom es irreversible y queda atada a la tienda: "You can't change the distribution method after you select it" (`DOC`). Solo abarca varias tiendas de la misma organización Plus | **Recomendado:** crear la app como "Radaelli Favoritos DEV" para la Dev Store y otra para la tienda real |
| **D4** | Segundo dispositivo o navegador para la prueba cruzada | Paso 10 | Por ejemplo, Edge en el PC o el celular de D |

### Interruptores de seguridad (de más rápido a más lento)

1. **`wishlist_account_sync` en OFF** (Editor de temas del theme Radaelli): el theme vuelve a modo invitada al instante.
2. **App embed "Favoritos en la cuenta" en OFF:** no se carga el transporte.
3. **Detener la función:** el transporte recibe error, `wishlist.js` deja todo pendiente y no se pierde nada (`theme-src/assets/wishlist.js:40-44`).

---

## 2. El flujo (10 pasos, en orden)

Los comandos son de PowerShell y se corren desde `C:\CLAUDE\rada-main\rada-main\commerce-main\commerce-main\.claude\worktrees\shopify-migration-prep\shopify-migration\app`, salvo que se indique otra carpeta. En PowerShell 5.1 usar `curl.exe`, no `curl`.

### Paso 1 — Login de la CLI y vincular la app (D + C)

```powershell
node --test test                                   # esperado: 156/156
shopify version                                    # la CLI tiene que estar instalada (si falta, la instala D)
Copy-Item shopify.app.toml "$env:TEMP\radaelli-shopify.app.toml.bak"
shopify app config link                            # D inicia sesión en el navegador y elige organización y app
fc.exe "$env:TEMP\radaelli-shopify.app.toml.bak" shopify.app.toml
```

- **Si la app todavía no existe:** D la crea en el Dev Dashboard (nombre según D3) y usa `shopify app config link --client-id <CLIENT_ID>`. El client id no es secreto, pero igual no se pega en chats públicos.
- **Esperado:**
  - `config link` "creates or overwrites a configuration file" (`DOC`), así que el TOML queda reescrito con la configuración remota y con `client_id`.
  - **C** vuelve a aplicar desde la copia las secciones de la app (`embedded`, `[build]`, `[access_scopes]`, `[auth]`, `[webhooks]`, `[app_proxy]`) y conserva el `client_id` vinculado.
- **Verificar:**
  - El `fc.exe` del bloque de arriba corre justo después de `config link`, así que puede mostrar muchas diferencias (comentarios y secciones reescritas). **Después** de que C vuelva a aplicar las secciones, repetir el mismo `fc.exe`: tiene que mostrar **solo** la línea `client_id` (y el `name` si D usó otro nombre).
  - `node --test test` → **155/156**. La única falla esperada es `shopify.app.toml: sin client_id…` (`test/config.test.mjs:84-86`): una guarda de "antes de vincular", simulada hoy (§7.2). **Cualquier otra falla = NO-GO.**
- **Rollback:** `Copy-Item "$env:TEMP\radaelli-shopify.app.toml.bak" shopify.app.toml -Force`. La app queda creada en el Dev Dashboard, sin instalar y sin efecto.
- **GO/NO-GO:** T1 (§3).

### Paso 2 — Distribución (D). Puede ser IRREVERSIBLE

- **2A (preferida si D1 = sí):** instalar en la Dev Store **sin elegir distribución**, si el Dev Dashboard lo ofrece para las dev stores de la organización. `NOT_VERIFIED`: la página oficial no dice si una dev store de la misma organización necesita distribución custom. Si existe esa vía, la decisión irreversible se deja para producción.
- **2B:** Dev Dashboard > app > Home > tarjeta **Distribution** > "Select distribution method" > **Custom distribution**:
  - dominio `radaelli-swimwear-dev.myshopify.com` → **Generate link** → copiar el link de instalación (`DOC`);
  - **IRREVERSIBLE:** por eso D3.
- **Esperado:** vía de instalación disponible (2A) o link generado (2B).
- **Rollback:** 2A no tiene nada que revertir. 2B **no tiene rollback**: la app queda atada a esa tienda (por eso el nombre "DEV").

### Paso 3 — Versión de la app, instalación y scopes (C + D)

**3a. Host real** (necesita D2). Reemplazar `REEMPLAZAR-host-de-la-funcion.example` por el host:

| Archivo | Campo | Valor |
|---|---|---|
| `shopify.app.toml` | `application_url` | `https://<HOST>` |
| `shopify.app.toml` | `[app_proxy] url` | `https://<HOST>/proxy` |
| `shopify.app.toml` | `[auth] redirect_urls` | `https://<HOST>/auth/callback` |
| `extensions/mis-favoritos/src/config.js:9` | `BACKEND_URL` | `https://<HOST>`, sin barra final |

- `node --test test` → **154/156**. Fallan solo las 2 guardas previas al deploy (simulado hoy, §7.2):
  - `shopify.app.toml: sin client_id…`;
  - `api.removeFavorite: con el placeholder de BACKEND_URL no llama a nada` (`test/extension.test.mjs:222-223`).

**3b. Dependencias de la extensión "Mis favoritos"** (lo menos verificado del flujo).

- `extensions/mis-favoritos/` **no tiene `package.json`** (README § 7).
- **C** genera una plantilla temporal para copiar sus dependencias:
  1. `shopify app generate extension --path . --name tmp-plantilla-cuenta` → elegir la plantilla de UI de cuenta de cliente (el identificador exacto de la plantilla es `NOT_VERIFIED`).
  2. Copiar su `package.json` a `extensions/mis-favoritos/` (deben quedar `preact` y `@shopify/ui-extensions` alineada con `2026-07`).
  3. **Borrar la carpeta local** `extensions/tmp-plantilla-cuenta`, así no se despliega.
  4. `npm install` dentro de `extensions/mis-favoritos`. Es una descarga de dependencias: **OK explícito de D**.
- **Esperado:** `node_modules` presente y `src/` sin cambios.

**3c. Publicar la versión**

```powershell
shopify app deploy --path . --message "03F dev 0.1.2"
```

- **Nunca** usar `--allow-deletes`.
- **Esperado:** la CLI pide confirmación y lista 2 extensiones (`mis-favoritos` y `wishlist-transport`) y la configuración (scopes, app proxy y webhooks). `app deploy` "Builds the app, then deploys your app configuration and extensions" (`DOC`). El texto exacto de la confirmación es `NOT_VERIFIED`.

**3d. Acceso de red de la extensión.** Dev Dashboard > app > API access > "Allow network access" (README § 9.5; la aprobación es automática según la doc).

**3e. Instalar** (2A o el link de 2B).

- La pantalla de permisos tiene que mostrar **exactamente** estos scopes: `read_customers`, `write_customers`, `read_products`, `write_app_proxy` y `customer_read_customers` (`shopify.app.toml`, `[access_scopes]`).
- Si pide **cualquier otro**, cancelar.
- Si coinciden, D acepta.

**Verificar:**
- Configuración > Apps muestra la app.
- En el Editor del theme Radaelli, **App embeds** muestra "Favoritos en la cuenta" **desactivado**: "By default, app embed blocks are deactivated after an app is installed" (`DOC`).

**Rollback:**
- Configuración > Apps > app > Desinstalar.
- Versión anterior: `shopify app release --version <anterior>`. El comando "Releases an existing app version" (`DOC`); usarlo como rollback es `INFERENCIA`.

**GO/NO-GO:** 6 (parcial, plan y distribución), T2.

### Paso 4 — Desplegar la función (D en su hosting, C guía)

- **Qué se sube:** `server/` y `package.json` de esta carpeta. No tiene dependencias. `server/` es idéntico al del zip de 03D (verificado hoy: 10 de 10 archivos con el mismo SHA-256); el paso 3a no lo toca.
- **Arranque:** `node server/server.mjs`, con HTTPS delante y el puerto en `PORT`. **Una sola instancia.**
- **Esperado antes de cargar secretos:** la función **no arranca** y deja en el log una línea como esta (verificado hoy con config vacía):
  `{"level":"error","event":"config_invalid","detail":"SHOPIFY_API_KEY:missing,SHOPIFY_API_SECRET:missing,ALLOWED_SHOPS:missing,SHOPIFY_ADMIN_ACCESS_TOKEN:missing"}`.
  Nombra variables, nunca valores (`server/config.mjs:1-10`).
- **Rollback:** apagar el servicio.

### Paso 5 — Variables de entorno y secretos (D los carga; C no los ve)

| Variable | Valor | ¿Secreto? |
|---|---|---|
| `SHOPIFY_API_KEY` | Client ID de la app (Dev Dashboard) | No (configuración) |
| `SHOPIFY_API_SECRET` | Client secret (Dev Dashboard) | **Sí**: solo en el gestor de secretos del hosting. Nunca en el chat, el repo ni `.env` versionado |
| `ALLOWED_SHOPS` | `radaelli-swimwear-dev.myshopify.com` | No |
| `ADMIN_TOKEN_SOURCE` | `client_credentials` (D1 = sí) | No |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | **No usar** con `client_credentials` | — |
| El resto | Valores por defecto de README § 5 (`REQUIRE_CSRF_HEADER=true`, `EMPTY_LIST_STRATEGY=set_empty`, `SHOPIFY_API_VERSION=2026-07`) | No |

- **Esperado al reiniciar:** en el log, `{"level":"info","event":"listening",…}`.
- **Humo desde el PC de D.** Las respuestas son las mismas que dio hoy la función local con config falsa (§7.3):

| Comando | Esperado |
|---|---|
| `curl.exe -i https://<HOST>/` | `200` · `Radaelli Favoritos: servicio sin panel de administracion.` |
| `curl.exe -i -X POST -H "Content-Type: application/json" -d "{}" https://<HOST>/proxy/wishlist` | `401` · `{"v":1,"error":"invalid_signature"}` |
| `curl.exe -i https://<HOST>/proxy/wishlist` | `405` · `method_not_allowed` · `Allow: POST` |
| `curl.exe -i -X OPTIONS https://<HOST>/ca/wishlist` | `204` · `Access-Control-Allow-Origin: *` · `Access-Control-Allow-Methods: POST, OPTIONS` |
| `curl.exe -i -X POST -H "Content-Type: application/json" -d "{}" https://<HOST>/ca/wishlist` | `401` · `{"v":1,"error":"missing_token"}` |
| `curl.exe -i -X POST https://<HOST>/webhooks` | `401` · `invalid_signature` |

- **Rollback:** detener el servicio. Si un secreto se expuso, D lo rota en el Dev Dashboard y lo vuelve a cargar.
- **GO/NO-GO:** 7 (el token se prueba de verdad en el paso 9: sin token, las escrituras dan `502 admin_error`).

### Paso 6 — Definición del metafield `custom.wishlist` (D)

Admin > **Configuración > Metacampos y metaobjetos > Clientes > Agregar definición** (el Help Center ubica las definiciones en Settings > Metafields and metaobjects; los textos exactos en español son `NOT_VERIFIED`).

| Campo | Valor |
|---|---|
| Nombre | Etiqueta interna a elección de D (sugerencia técnica: "Favoritos") |
| Namespace y clave | **`custom.wishlist`** (exacto; lo leen `theme-src/layout/theme.liquid:177` y la función) |
| Tipo | Producto → **lista** (`list.product_reference`) |
| Validaciones | **Ninguna.** Sin `list.max`: no hay que recortar listas heredadas (README § 9.6) |
| Acceso "Customer accounts" | **Lectura**. Si solo ofrece "Lectura y escritura", elegir eso. La opción "Customer account access" deja la definición disponible en la Customer Account API (`DOC`) |
| Acceso "Storefronts" | Sin activar por ahora: 02L concluyó que Liquid lee metafields de cliente sin depender de esa opción, y dejó una contradicción del Help Center "a probar" (`theme/customer-accounts-report.md:92`). Si **W1** falla en el paso 9, activarla y volver a probar |

- **Verificar:** la definición aparece en Clientes con tipo lista de productos.
- **Rollback:** mientras no haya datos, se puede borrar la definición. **Con datos, no borrarla**: el efecto sobre los valores es `NOT_VERIFIED`.
- **GO/NO-GO:** W1 (en el paso 9) y 5 (opcional, R2).

### Paso 7 — App embed, página "Mis favoritos" e interruptor (D + C)

**7a. App embed.** Editor del **theme Radaelli**: `admin.shopify.com/store/radaelli-swimwear-dev/themes/189072474431/editor` → **Configuración del tema > App embeds** → "Favoritos en la cuenta" **ON** → Guardar.

- **No** usar un deep link con `themes/current`: abre **Horizon**, que es el tema live.

**7b. Menú.** Contenido > Menús > menú `customer-account-main-menu`, el que usa el header (`theme-src/sections/header.liquid:216`, `:378-381`) → Agregar elemento → página de la app **"Mis favoritos"** → Guardar.

- La doc solo dice que el link se puede agregar a los menús de la cuenta. Los nombres exactos en el Admin son `NOT_VERIFIED`.

**7c. URL de la página.** Entrar a la cuenta, abrir "Mis favoritos" y copiar la URL de la barra de direcciones. Su formato es `NOT_AVAILABLE` en la doc.

- Pegarla en App embeds > Favoritos en la cuenta > "URL de la página Mis favoritos" → Guardar.
- Vacía, usa `routes.account_url` (`extensions/wishlist-transport/blocks/wishlist-transport.liquid:14-17`).

**7d. Interruptor.** Configuración del tema > Wishlist > "Sincronizar favoritos con la cuenta de la clienta" **ON** → Guardar.

- **Solo** en el theme remoto sin publicar.
- `theme-src` sigue en `false` hasta la decisión final (§4).

**Advertencia:** un `shopify theme push` de `config/settings_data.json` desde `theme-src` **apaga el embed y el interruptor**, porque `theme-src` no los tiene. Hasta la decisión final, todo push usa `--ignore config/settings_data.json` (`DOC`: `--ignore` se puede repetir).

**Rollback:** 7d OFF (instantáneo) → 7a OFF → quitar el ítem del menú.

**GO/NO-GO:** 6 (el ítem aparece en el menú de cuenta y en la hoja de `<shopify-account>`).

### Paso 8 — Ingreso real de la clienta (solo D)

Mismo guion que 03D § F:

1. En Chrome del PC, abrir `https://radaelli-swimwear-dev.myshopify.com/?preview_theme_id=189072474431`.
2. Ícono de cuenta → "Iniciar sesión" → el correo de acceso de la tienda (r…@gmail.com).
3. Escribir el código de 6 dígitos que llega por email. **Claude no lee ni escribe el código.**
4. Avisar "listo".

**C verifica:**

| Chequeo | Esperado | GO/NO-GO |
|---|---|---|
| Header | Muestra la sesión (inicial) | 1 |
| Código fuente de una ficha, una colección y una página | Existe `<script type="application/json" id="wishlist-account-state">` con estado de cuenta (`theme-src/layout/theme.liquid:159-191`) | 1, W1 |
| `/account` | Cuenta de Shopify (cuentas nuevas) | 9 |
| `/account/login` (con sesión cerrada, en otra ventana) | Redirige al ingreso nuevo de Shopify, no a un template legacy | 9 |

**Rollback:** cerrar sesión desde la cuenta.

### Paso 9 — Prueba de unión invitada → cuenta (D navega, C observa)

**Preparación (C).** En DevTools de la pestaña de la tienda:
- Network, con el filtro `apps/radaelli`.
- Consola:

```js
document.addEventListener("wishlist:sync-status", (e) => console.log("sync", e.detail.state));
```

El evento está documentado en `theme-src/assets/wishlist.js:51-56`.

Productos de prueba (reales, 03C): **A** `brisa-natural-beige`, **B** `costa-esmeralda-negro`, **C** `bikini-foam`, **D** `alba-dorada-lila`.

| # | Acción | Esperado | GO/NO-GO |
|---|---|---|---|
| 9.1 | Con sesión: corazón en **B** y después en **D** | Cada toque: `POST /apps/radaelli/wishlist` → `200`, consola `sync synced`. Log de la función: `route:"proxy"`, `code:"ok"`, `writes:1` | 13 (el proxy responde con la tienda protegida con contraseña), 8 (sin `400 missing_csrf_header` ni `415`), 2, 7 |
| 9.2 | Admin > Clientes > (la clienta) > Metacampos | `custom.wishlist` = [B, D] en ese orden | 4 (primera alta con `compareDigest` nulo) |
| 9.3 | Cerrar sesión. Como invitada, en el mismo navegador: corazón en **A**, **B** y **C** | Guardado local (modo invitada, sin llamadas al proxy) | — |
| 9.4 | Volver a ingresar (código, solo D) | Unión: la lista queda **[B, D, A, C]**. Contador en 4. Admin igual. `sync synced` | Unión (diseño § 7.1), W1 |
| 9.5 | Recargar 2 veces | Sin escrituras nuevas (log `writes:0`). Misma lista | Idempotencia |
| 9.6 | Log de toda la prueba | 0 × `401 no_customer`, 0 × `invalid_signature` | 2 |

**Si falla:**

| Síntoma | Qué significa | Acción |
|---|---|---|
| Todo `400 missing_csrf_header` | El proxy no reenvía el header propio | `REQUIRE_CSRF_HEADER=false` → reiniciar → repetir (README § 4) |
| `415` | El proxy no reenvía `Content-Type` | **NO-GO 8**: requiere un cambio de diseño |
| `401 no_customer` intermitente | Es el riesgo B2 | **NO-GO 2**: no encender |
| `502 admin_error` en todas las escrituras | Token o scopes | Revisar paso 5 (NO-GO 7) |
| El bootstrap sale sin la lista mientras el Admin la tiene | Liquid no lee el metafield | Activar "Storefronts" en la definición (paso 6) y repetir. Si igual falla: **NO-GO W1** |

### Paso 10 — Prueba entre dispositivos, cierre de sesión y casos límite (D + C)

| # | Acción | Esperado | GO/NO-GO |
|---|---|---|---|
| 10.1 | Navegador 2 (D4): ingresar con la misma clienta (código, solo D) | Corazones y contador en 4, sin datos locales previos | Sincronización |
| 10.2 | Navegador 2: quitar **D**. Navegador 1: recargar | Lista de 3 en los dos | — |
| 10.3 | Navegador 1: cuenta > "Mis favoritos" | 3 tarjetas, con imagen, precio y link a la ficha | 6, 14 |
| 10.4 | En "Mis favoritos", quitar **C** | Toast "Producto quitado de favoritos.". `POST /ca/wishlist` → `200`. La tienda, al recargar, muestra 2 | 12 (formato de `dest` en el session token) |
| 10.5 | Los dos navegadores agregan productos **distintos** casi al mismo tiempo (por ejemplo, `raices-del-sol-beige-suave` y `bikini-palm-verde-oliva`) | Los dos quedan en la lista. Si hubo carrera, el log muestra `attempts:2` o más | 4 y 15 (la 0.1.x **no registra** qué código de CAS llegó: solo se ve el reintento) |
| 10.6 | Quitar todo hasta dejar la lista vacía | `200`. El Admin muestra la lista vacía | 10. Si la última baja da `502 admin_error`: `EMPTY_LIST_STRATEGY=delete` → reiniciar → repetir |
| 10.7 | Con 2 pestañas abiertas en el navegador 1, cerrar sesión en una | La otra deja de mostrar la lista de cuenta | 1 (vuelve a `nil`) |
| 10.8 | Ventana anónima: abrir la misma ficha | En el código fuente, solo `{"signedOut":true}` o nada; ningún dato de la clienta | 3 (sin caché entre clientas) |
| 10.9 | *(Opcional, solo con OK explícito de D)*: crear un producto de prueba, marcarlo como favorito y **borrarlo** (el borrado es permanente) | "Mis favoritos" lo muestra como "Este producto ya no está disponible." y deja quitarlo | 11. Si no se hace: riesgo aceptado (el código contempla `null`) |

**Disponibilidad.** Si "Mis favoritos" muestra "Agotado" en todo, es el hallazgo **C2** (no hay zona de envío Colombia), no un fallo de la app. La prueba sigue: no mide stock.

**Rollback del paso:** los interruptores del §1.

---

## 3. Mapa GO/NO-GO

| # | Qué se valida | Paso | PASS | Obligatorio |
|---|---|---|---|---|
| T1 | Suite local después de vincular | 1 | 155/156, solo la guarda `sin client_id` | Sí |
| T2 | Suite local con el host real | 3a | 154/156, solo las 2 guardas previas al deploy | Sí |
| 1 | `customer` en Liquid al ingresar y `nil` al salir | 8, 10.7 | Bootstrap presente con sesión y ausente sin sesión | Sí |
| 2 | `logged_in_customer_id` en el proxy | 9.1, 9.6 | 0 × `401 no_customer` en la sesión. Antes del lanzamiento, seguir los logs hasta superar 100 requests | Sí |
| 3 | Sin caché entre clientas o anónimos | 10.8 | Sin datos de cuenta en la ventana anónima | Sí |
| 4 | `metafieldsSet` + `compareDigest` | 9.2, 10.5 | Alta inicial OK. Carrera sin pérdidas | Sí |
| 5 | Customer Account API escribe | — | No aplica (R2: la extensión no escribe) | Opcional |
| 6 | Página full-page con esta distribución y plan; ítem en el menú | 3e, 7b, 10.3 | Página visible y enlazada | Sí |
| 7 | Token de Admin sin base de datos | 5, 9.1 | Escrituras `200` con `client_credentials` | Sí (D1) |
| 8 | El proxy reenvía `Content-Type` y el header anti-CSRF | 9.1 | Sin `415`. Sin `400 missing_csrf_header` (o `REQUIRE_CSRF_HEADER=false` documentado) | Sí |
| 9 | Templates legacy ignorados | 8 | `/account/login` → ingreso nuevo | Sí |
| 10 | Lista vacía `"[]"` + CAS | 10.6 | `200` con `set_empty` (o `delete` documentado) | Sí |
| 11 | `nodes()` con un producto borrado | 10.9 | Estado "ya no está disponible" | Opcional |
| 12 | `dest` del session token | 10.4 | `POST /ca/wishlist` `200` (no `401 shop_not_allowed` ni `invalid_token`) | Sí |
| 13 | Proxy con la tienda protegida con contraseña | 9.1 | Primera llamada `200` | Sí |
| 14 | `shopify.query` trae imagen y `onlineStoreUrl` | 10.3 | Imagen y link presentes | Sí |
| 15 | Código de error de CAS | 10.5 | Informativo: la 0.1.x no lo registra | No |
| W1 | Liquid lee `custom.wishlist` | 8, 9.4 | Bootstrap con la lista (con o sin "Storefronts") | Sí |

---

## 4. Decisión final y encendido

- **GO** solo si pasan todos los obligatorios del §3. Recién ahí, **C** pone `wishlist_account_sync: true` en `theme-src/config/settings_data.json`. Es un cambio de código de una fase posterior, con su propio release y su regresión.
- **NO-GO:** 7d en OFF (y 7a en OFF si hace falta). Se documenta el punto que falló. La tienda sigue en modo invitada, sin pérdida de datos.

---

## 5. Rollback por niveles

| Nivel | Acción | Efecto | Reversible |
|---|---|---|---|
| 1 | 7d OFF (Editor de temas) | El theme vuelve a modo invitada al instante | Sí |
| 2 | 7a OFF (App embeds) | No se carga el transporte | Sí |
| 3 | Detener la función | La tienda deja todo pendiente sin perder nada; "Quitar" de la extensión muestra error | Sí |
| 4 | `shopify app release --version <anterior>` | Vuelve a una versión anterior de configuración y extensiones | Sí (`INFERENCIA`) |
| 5 | Desinstalar la app | Se van extensión, proxy y embed. **`custom.wishlist` queda**: es del comercio | Reinstalable |
| — | Distribución custom (2B) | — | **No** |
| — | Borrar la definición `custom.wishlist` con datos | Puede perder valores (`NOT_VERIFIED`) | **No hacerlo** |

---

## 6. Qué puede confundir

- **Tests "fallando" a propósito:** 155/156 después del paso 1 y 154/156 después de 3a. Son guardas de "todavía sin vincular" (§7.2). Cualquier otra falla es real.
- **El zip de 03D ya no coincide** con la carpeta después de los pasos 1 y 3a: cambian el TOML y `config.js`. Es esperado. Si se reempaqueta, cambia el SHA-256.
- **Mercado US (C1):** la sesión resuelve a US. No afecta al proxy: el transporte llama `/apps/radaelli/wishlist` sin prefijo de idioma (README § 3, E4). Anotar `Shopify.country` en cada corrida.
- **País CO (C2):** con país CO todo aparece "Agotado". No es la app.
- **Push de `settings_data.json`:** apaga el embed y el interruptor (paso 7, advertencia).

---

## 7. Evidencia de hoy

### 7.1 Suite pedida: `node --test …/shopify-migration/app/test`

```
$ node --test C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/app/test
…
✔ schema: el mismo id en add y remove -> overlap
ℹ tests 156
ℹ suites 7
ℹ pass 156
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1089.1148
```

- Node v24.19.0.
- Se corrió dos veces (desde `shopify-migration/` con la ruta relativa `app/test`, y con la ruta absoluta): 156/156 las dos veces.

### 7.2 Simulación de las guardas (copia en el scratchpad; la app original no se tocó)

Se usaron valores ficticios: `client_id` de ceros y el host `favoritos.simulado.test`.

- Solo `client_id`: `tests 156 · pass 155 · fail 1`. Falla `shopify.app.toml: sin client_id, scopes mínimos (sin customer_write_customers), proxy apps/radaelli`.
- `client_id` + host: `tests 156 · pass 154 · fail 2`. Falla lo anterior más `api.removeFavorite: con el placeholder de BACKEND_URL no llama a nada`.

### 7.3 Humo local de endpoints

Config **falsa**, `127.0.0.1`, sin red externa. El servidor se cerró al terminar.

```
sin env -> config_invalid: SHOPIFY_API_KEY:missing, SHOPIFY_API_SECRET:missing, ALLOWED_SHOPS:missing, SHOPIFY_ADMIN_ACCESS_TOKEN:missing
GET / -> 200 Radaelli Favoritos: servicio sin panel de administracion. [cache-control: no-store]
POST /proxy/wishlist -> 401 {"v":1,"error":"invalid_signature"} [cache-control: private, no-store]
GET /proxy/wishlist -> 405 {"v":1,"error":"method_not_allowed"} [allow: POST; cache-control: private, no-store]
OPTIONS /ca/wishlist -> 204  [access-control-allow-origin: *; access-control-allow-methods: POST, OPTIONS; cache-control: no-store]
POST /ca/wishlist -> 401 {"v":1,"error":"missing_token"} [access-control-allow-origin: *; cache-control: private, no-store]
POST /webhooks -> 401 {"v":1,"error":"invalid_signature"} [cache-control: private, no-store]
GET /nope -> 404 {"v":1,"error":"not_found"} [cache-control: private, no-store]
```

### 7.4 Re-verificación independiente (mismo día)

- `node --test app/test` (Node v24.19.0): 156/156, 7 suites, 0 fallas.
- Copia en el scratchpad con `client_id` ficticio: 155/156 (solo `sin client_id`). Con el host ficticio en el TOML y en `config.js`: 154/156 (las 2 guardas). Coincide con T1 y T2.
- Zip verificado (hash en el reporte 03F); `server/` = zip en 10/10 archivos (SHA-256).
- Humo con config falsa en `127.0.0.1`: las 8 líneas de §7.3 se reprodujeron igual (estado, cuerpo y cabeceras).
- Client credentials (`DOC`, re-consultado): una Dev Store creada desde el Admin y no desde el Dev Dashboard "won't be in your org", así que D1 sigue siendo la primera pregunta.

---

## 8. Fuentes oficiales (consultadas el 2026-09-29)

- https://shopify.dev/docs/apps/launch/distribution/select-distribution-method: pasos de la distribución custom, irreversibilidad, una tienda o varias de la misma organización Plus.
- https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant: misma organización, la tienda tiene que figurar en Dev stores, token de 24 h, la app tiene que estar instalada.
- https://shopify.dev/docs/api/shopify-cli/app/app-config-link: crea o sobrescribe el archivo de configuración; `--client-id`, `--file-name`.
- https://shopify.dev/docs/api/shopify-cli/app/app-deploy: build y deploy de configuración y extensiones; `--allow-deletes`, `--message`.
- https://shopify.dev/docs/api/shopify-cli/app/app-release: publica una versión existente.
- https://shopify.dev/docs/api/shopify-cli/app/app-generate-extension: genera extensiones en `extensions/`.
- https://shopify.dev/docs/api/shopify-cli/theme/theme-push: `--only`, `--ignore` (se pueden repetir), `--allow-live`.
- https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration: los app embeds vienen desactivados al instalar y se activan en Theme settings > App embeds.
- https://shopify.dev/docs/apps/build/customer-accounts/full-page-extensions: el link de la página se agrega a los menús de cuenta.
- https://shopify.dev/docs/apps/build/customer-accounts/metafields: acceso `customer_account` y scope `customer_read_customers`.
- https://help.shopify.com/en/manual/custom-data/options: opción "Customer account access" en las definiciones.
- https://help.shopify.com/en/manual/custom-data/metafields/metafield-definitions/creating-custom-metafield-definitions: Settings > Metafields and metaobjects.
