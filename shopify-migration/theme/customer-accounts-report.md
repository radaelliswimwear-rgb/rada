# Customer Accounts + Favoritos sincronizados — Fase 02L

Modelo: **Opus 5.5** (`claude-opus-5-5`, modo ULTRACODE). 2026-09-28, inicio 14:05.
Documento corto para decidir: `theme/customer-accounts-decision.md` (source of truth para fases posteriores).

Qué es esta fase: arquitectura + preparación offline **honesta**. No se creó tienda, Development Store, app, extensión, scopes ni clientes. No se envió ningún código de ingreso. El modo cuenta de favoritos quedó **preparado e inerte**: no sincroniza nada hasta que exista la app de Radaelli y se enciendan los interruptores (§ 7.4).

Resumen de clasificación (detalle en § 17):

| | Qué |
|---|---|
| **A. Offline en el theme (hecho)** | `<shopify-account>` en el header con fallbacks; adaptador invitada/cuenta en `wishlist.js` con núcleo puro probado; bootstrap Liquid inerte detrás de un setting apagado; avisos ocultos por defecto; locales es/en |
| **B. Requiere Development Store** | Todo lo que confirma comportamiento de Shopify: `customer` en Liquid tras ingresar con cuentas nuevas, `logged_in_customer_id` en el app proxy, cache, `compareDigest`, escritura desde Customer Account API sobre `custom.*`, extensión full-page en el plan real |
| **C. Requiere app / backend / extensión** | Escribir la lista de la cuenta (un theme **no puede** escribir metafields) y la página "Mis favoritos" dentro de la cuenta |
| **D. APIs oficiales sin backend propio** | Ingreso sin contraseña, perfil, direcciones, pedidos y detalle de pedido: **nativos** de New Customer Accounts. Leer la lista en Liquid (`customer.metafields`) |
| **E. No construir** | Login/registro/recuperación con contraseña, templates `customers/*`, cookies o tokens propios, lista "remota" en otra clave de localStorage, identidad tomada del navegador, un dashboard de pedidos propio |

---

## 1. Cuenta custom real auditada (código ejecutable, no comentarios)

Auditoría de solo lectura del Next.js actual, en el worktree aislado (sin correr la app, los tests ni consultas a la base).

**Archivos leídos:**
- `lib/auth/`: `users-actions.ts`, `password.ts`, `session.ts`, `authorize.ts`, `verification-tokens.ts`, `rate-limit.ts`, `users-storage.ts`
- `components/auth/`: `auth-store.tsx`, `login-form.tsx`, `register-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`, `verify-email-panel.tsx`, `require-auth.tsx`, `require-admin.tsx`
- `components/account/`: `account-shell.tsx`, `account-nav.tsx`, `dashboard-overview.tsx`, `profile-form.tsx`, `addresses-manager.tsx`, `order-history.tsx`, `account-favorites.tsx`
- `app/cuenta/**` (7 páginas), `app/favoritos`, `app/checkout/confirmacion/[orderId]`, `app/admin/layout.tsx`, `app/admin/usuarios`
- `lib/wishlist/wishlist-actions.ts`, `lib/cart/cart-actions.ts`, `lib/guest-identity.ts`, `lib/addresses/*`, `lib/orders/*`, `lib/email/templates.ts`, `lib/email/send.ts`, `lib/newsletter/*`, `lib/back-in-stock/*`, `lib/request/client-ip.ts`
- `components/layout/navbar/index.tsx`, `mobile-menu.tsx`; `components/checkout/*` (direcciones guardadas); `prisma/schema.prisma`; `next.config.ts`; todos los tests `*.test.ts` de auth, direcciones, wishlist y carrito

**Mecanismo:** autenticación **100% propia**. No usa Auth.js, Clerk ni ninguna API de clientes de Shopify.
- Todo pasa por Server Actions. No hay rutas API de auth ni `middleware.ts`.
- **Contraseña:** scrypt con sal. Los hashes SHA-256 viejos sin sal todavía se aceptan y se rehashean en el próximo login.
- **Sesión:** cookie `radaelli_session` (httpOnly, 30 días fijos). La base guarda solo el hash del token, en la tabla `Session`.

### 1.1 Funcionalidades reales

| Funcionalidad | Estado real | Nota |
|---|---|---|
| Login `/cuenta/iniciar-sesion` | usada | email + contraseña, rate limit, error genérico, une carrito y favoritos de invitada |
| Registro `/cuenta/registro` | usada | siempre rol USER; sin opt-in de newsletter; manda verificación + bienvenida |
| Cerrar sesión | usada | **solo** desde la barra lateral de `/cuenta`; ni header ni menú mobile tienen salir |
| Recuperar / restablecer contraseña | usadas | token de 30 min de un solo uso; invalida todas las sesiones |
| Verificación de email | **parcial** | se envía pero **nunca se exige** (`emailVerifiedAt` no se lee); no hay reenvío |
| Cambiar contraseña con sesión | **no existe** | solo por el flujo de recuperación |
| Resumen `/cuenta` | usada | "Hola, {nombre}" + contadores de pedidos, direcciones y favoritos |
| Perfil | usada | solo nombre y email; cambiar el email no pide contraseña ni re-verificación |
| Direcciones | **parcial** | alta, baja y predeterminada; **sin edición**; formulario pensado para España (el checkout usa campos de Colombia) |
| "Guardar esta dirección" en el checkout | **probablemente roto** | manda campos que `Address` no tiene; Prisma rechazaría (lectura estática, no ejecutado) |
| Pedidos `/cuenta/pedidos` | usada | muestra el `status` viejo ("Procesando") y no el `fulfillmentStatus` que edita el admin; id interno en vez del número |
| Detalle de pedido en la cuenta | **no existe** | solo `/checkout/confirmacion/[id]` |
| Pedidos de invitada → cuenta | **no existe** | nunca se vinculan, aunque el email coincida |
| Favoritos en la cuenta `/cuenta/favoritos` | usada | la misma lista que `/favoritos` |
| Favoritos de invitada → cuenta | usada | unión al hacer login o registro (`createMany skipDuplicates`); se borra la lista y la cookie de invitada |
| Borrar cuenta / exportar datos | **no existe** | |
| Newsletter | **parcial** | tabla sin relación con `User`; sin doble opt-in ni baja |
| "Avísame cuando vuelva" | usada | usa el email de la sesión si hay |
| Header | usada | ícono "Cuenta" solo desde `lg` → login o `/cuenta`; en mobile, píldora "Cuenta" en el menú; sin nombre, sin avatar, sin salir |

**Modelos Prisma involucrados:** `User` (nombre en un solo campo), `Session`, `VerificationToken`, `AuthAttempt`, `Address`, `Wishlist` / `WishlistItem`, `Cart` / `CartItem`, `Order` / `OrderItem` / `OrderStatusEvent`, `Payment`, `EmailOutbox`, `NewsletterSubscriber`, `BackInStockRequest`, `SystemLog`.

**Emails de cuenta (Resend):** verificación, bienvenida, recuperación y contraseña cambiada. Además: confirmación de pedido (outbox), aviso de stock y alertas internas.

**Problemas del sistema actual** (todos verificados en código):
- Los 4 emails de cuenta insertan el nombre en el HTML **sin escapar**.
- Las acciones de pedidos devuelven al navegador el email del admin (`changedByEmail`) y otros datos internos.
- `/cuenta` solo está protegida en el cliente (los datos sí se protegen en el servidor).
- El registro permite enumerar cuentas ("Ya existe una cuenta con este email").

**Tests:** cubren recuperación de contraseña, propiedad de direcciones, persistencia y unión de favoritos, rate limits y flags de la cookie de invitada. **Sin tests:** login, registro, sesión, perfil, verificación.

**Conclusión de la auditoría:** casi todo lo que hace la cuenta custom lo resuelve Shopify de forma nativa, y varias cosas mejor: ingreso sin contraseña, detalle de pedido, estado real del envío, pedidos de invitada. La **única pieza propia** que no tiene equivalente nativo es **favoritos sincronizados** (§ 6).

---

## 2. Arquitectura oficial de New Customer Accounts (verificada)

La investigación usó solo documentación oficial (shopify.dev + Help Center). Cada afirmación pasó una verificación adversarial y todas sobrevivieron. Los foros de la comunidad aparecen solo como evidencia secundaria y están marcados como tal.

| Tema | Hecho | Confianza |
|---|---|---|
| Ingreso | Sin contraseña: email + **código de 6 dígitos**. Opcionales: Google, Facebook, Apple y Shop | Confirmado |
| Alta de cliente | **No hay registro**: el primer ingreso con un email nuevo crea el cliente | Confirmado |
| Templates legacy | `customers/*` (login, register, account, addresses, order, reset_password, activate_account) están **deprecados**. Las URLs legacy (`/account/login`, etc.) redirigen a las cuentas nuevas. Publicar un theme sin esos templates actualiza una tienda legacy | Confirmado ("ignorados" es la lectura segura, a probar en B) |
| Páginas de cuenta | Las aloja Shopify (pedidos, perfil, direcciones). Se personalizan con el editor de checkout y cuentas (branding) y con apps/extensiones, **no** con el theme | Confirmado |
| Entrada desde el theme | Componente oficial `<shopify-account>`: el theme no carga ningún script. Abre el ingreso en una hoja sin salir de la tienda y muestra la inicial con sesión. Menú configurable; slot/part `signed-out-avatar`; variables CSS de marca. Es requisito del Theme Store | Confirmado |
| Rutas | `routes.account_url`, `account_login_url`, `account_logout_url`, `account_addresses_url` redirigen a las cuentas nuevas. `account_profile_url` y `storefront_login_url` existen solo en las nuevas | Confirmado |
| `customer` en Liquid tras ingresar | Los ejemplos oficiales de Shopify dependen de que `customer` esté disponible en la tienda después de ingresar con cuentas nuevas, pero **ninguna página lo dice explícitamente** | Implícito → **GO/NO-GO B1** |
| Duración de sesión | La cuenta dura hasta 365 días. La sesión de la tienda no está documentada (el foro dice ~30 días) | Parcial |
| Theme escribe metafields de cliente | **No.** Liquid solo lee; la Storefront API no escribe metafields; escribir requiere Admin API (app) o Customer Account API (extensión) | Confirmado |
| Theme lee metafields de cliente | **Sí**, `customer.metafields.<ns>.<key>`, sin importar el acceso "storefront" de la definición | Confirmado (hay una frase del Help Center que se contradice; a probar) |
| Customer Account API | Lee y escribe metafields desde **extensiones** de cuenta (`metafieldsSet`, `compareDigest`, máx. 25 por llamada). Requiere definición con acceso `customer_account` READ/READ_WRITE. **No** se puede usar desde el theme sin un cliente OAuth (Headless) | Confirmado. Escribir en una definición del comercio (`custom.*`) **sin confirmar** → B5 |
| Extensión full-page | `customer-account.page.render`: página propia dentro de la cuenta, link en el menú, URL estática y enlazable. Solo componentes de Shopify (Image, Button, Link con `href`); `navigate()` no sale a la tienda | Confirmado |
| Plan | "UI extensions para todas las páginas de cuenta" desde **Basic**. Solo Functions en apps custom es exclusivo de Plus | Tabla oficial; custom distribution en el plan real → B6 |
| App para la extensión | Obligatoria: app "solo extensiones" alojada por Shopify, instalable por **custom distribution** (no App Store) | Confirmado |
| App proxy | Shopify agrega `logged_in_customer_id`, `shop`, `path_prefix`, `timestamp` y `signature` (HMAC-SHA256 de los parámetros ordenados **sin separador**, con el secreto de la app). Quita cookies. Reenvía método y body | Confirmado |
| `logged_in_customer_id` con cuentas nuevas | La doc no lo promete ni lo descarta. **Foros:** vacío intermitente (2024–2025); "fix" anunciado en junio de 2025; investigación interna abierta en agosto de 2026 | **Incierto → B2** |
| Extensión → app proxy | **No** recibe `logged_in_customer_id`: usa un session token JWT (`sub` = GID del cliente, 5 min) por CORS | Confirmado |
| Límites | `list.*` hasta **128** ítems; json 128 KB; 256 definiciones por recurso | Confirmado |
| Metafields de app (`$app`) | Se **borran** al desinstalar la app; Liquid del theme del comercio no documenta cómo leerlos | Confirmado |
| Wishlist nativa | **No existe** en Online Store. Los favoritos de la app Shop no llegan al theme ni al comercio | Confirmado |

### 2.1 Fuentes oficiales consultadas

**Cuentas y theme**
- https://help.shopify.com/en/manual/customers/customer-accounts
- https://help.shopify.com/en/manual/customers/customer-accounts/upgrade
- https://help.shopify.com/en/manual/customers/customer-accounts/upgrade/compare-features
- https://help.shopify.com/en/manual/customers/customer-accounts/sign-in-options
- https://help.shopify.com/en/manual/customers/customer-accounts/new-customer-accounts/manage
- https://help.shopify.com/en/manual/customers/customer-accounts/new-customer-accounts/customer-experience
- https://help.shopify.com/en/manual/customers/customer-accounts/customize-customer-accounts/customize
- https://help.shopify.com/en/manual/customers/customer-accounts/customize-customer-accounts/account-component
- https://help.shopify.com/en/manual/online-store/themes/customizing-themes/common-customizations/add-login-link
- https://shopify.dev/docs/storefronts/themes/customer-engagement/account-component
- https://shopify.dev/docs/api/storefront-web-components/components/shopify-account
- https://shopify.dev/changelog/the-shopify-account-component-for-customer-accounts-is-now-a-theme-store-requirement
- https://shopify.dev/changelog/legacy-customer-accounts-are-deprecated
- https://shopify.dev/docs/storefronts/themes/sign-in
- https://shopify.dev/docs/storefronts/themes/architecture/templates
- https://shopify.dev/docs/api/liquid/objects/customer
- https://shopify.dev/docs/api/liquid/objects/routes
- https://shopify.dev/docs/api/liquid/objects/metafield
- https://shopify.dev/docs/api/liquid/filters/customer_register_link
- https://shopify.dev/docs/api/liquid/filters/customer_logout_link
- https://shopify.dev/docs/storefronts/themes/store/requirements

**Metafields, permisos y límites**
- https://shopify.dev/docs/apps/build/custom-data/permissions
- https://shopify.dev/docs/apps/build/custom-data/ownership
- https://shopify.dev/docs/apps/build/custom-data/metafields/definitions/use-access-controls-metafields
- https://shopify.dev/docs/apps/build/custom-data/declarative-custom-data-definitions
- https://shopify.dev/docs/apps/build/custom-data/metafields/list-of-data-types
- https://shopify.dev/docs/apps/build/metafields
- https://shopify.dev/docs/apps/build/metafields/definitions
- https://shopify.dev/docs/apps/build/metafields/metafield-limits
- https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/metafields
- https://help.shopify.com/en/manual/custom-data/options
- https://help.shopify.com/en/manual/custom-data/metafields/metafield-definitions/creating-custom-metafield-definitions
- https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldDefinitionCreate
- https://shopify.dev/docs/api/admin-graphql/latest/input-objects/MetafieldAccessInput
- https://shopify.dev/docs/api/admin-graphql/latest/enums/MetafieldCustomerAccountAccess
- https://shopify.dev/changelog/metafields-now-require-a-definition-to-be-accessed-through-the-customer-account-api

**Customer Account API y extensiones**
- https://shopify.dev/docs/apps/build/customer-accounts
- https://shopify.dev/docs/apps/build/customer-accounts/capabilities
- https://shopify.dev/docs/apps/build/customer-accounts/metafields
- https://shopify.dev/docs/apps/build/customer-accounts/metafields-in-customer-accounts
- https://shopify.dev/docs/apps/build/customer-accounts/full-page-extensions
- https://shopify.dev/docs/apps/build/customer-accounts/full-page-extensions/build-new-pages
- https://shopify.dev/docs/apps/build/customer-accounts/start-building
- https://shopify.dev/docs/apps/build/app-extensions/build-extension-only-app
- https://shopify.dev/docs/api/customer-account-ui-extensions/latest/targets/full-page
- https://shopify.dev/docs/api/customer-account-ui-extensions/latest/target-apis/account-apis/customer-account-api
- https://shopify.dev/docs/api/customer-account-ui-extensions/latest/target-apis/platform-apis/session-token-api
- https://shopify.dev/docs/api/customer-account-ui-extensions/latest/target-apis/platform-apis/navigation-api
- https://shopify.dev/docs/api/customer-account-ui-extensions/latest/web-components/actions/link
- https://shopify.dev/docs/api/customer/latest/mutations/metafieldsSet
- https://shopify.dev/docs/api/customer/latest/objects/Customer
- https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/getting-started
- https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations/checkout-apps

**App proxy**
- https://shopify.dev/docs/apps/build/online-store/app-proxies
- https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies
- https://shopify.dev/docs/api/shopify-app-react-router/latest/authenticate/public/app-proxy
- https://shopify.dev/docs/apps/build/online-store/display-dynamic-data
- https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration
- https://shopify.dev/docs/api/liquid/objects/app

**Secundarias (foros, no oficiales; solo para el riesgo de `logged_in_customer_id`)**
- community.shopify.dev hilos 2204, 13274, 14699, 31746

URLs que devolvieron 404 al consultarlas (no se usaron como evidencia):
- `shopify.dev/docs/storefronts/themes/architecture/templates/customers-login`
- el changelog de `logged_in_customer_id`
- 2 changelogs de escritura de metafields desde la Customer Account API

---

## 3. Matriz CUSTOM ACTUAL → SHOPIFY NEW CUSTOMER ACCOUNTS

Clasificación: **Native** = Shopify nativo · **Ext** = Customer Account extension · **App** = app/backend propio · **Not needed** · **Change** = no disponible / cambio de arquitectura.

| Función | Hoy (custom) | Shopify | Clase |
|---|---|---|---|
| Sign in | email + contraseña (`/cuenta/iniciar-sesion`) | código de 6 dígitos por email; hoja de `<shopify-account>` o `routes.account_login_url` | **Native** |
| Sign out | solo barra lateral de `/cuenta` | desde las páginas de cuenta de Shopify (perfil/menú) y `routes.account_logout_url`. `<shopify-account>` no trae "salir" | **Native** |
| Registro / alta | formulario con contraseña | no existe: el primer ingreso crea el cliente | **Native** (el registro desaparece) |
| Recuperar contraseña | email + token de 30 min | no hay contraseñas | **Not needed** |
| Verificación de email | enviada y nunca exigida | el código por email **es** la verificación | **Native** (mejor que hoy) |
| Perfil | nombre + email | perfil de Shopify (nombre/apellido, email, teléfono) | **Native** |
| Direcciones | alta/baja/predeterminada, sin edición | libreta de direcciones completa, usada por el checkout | **Native** (mejor que hoy) |
| Pedidos | lista con estado viejo | lista de pedidos con estado real | **Native** |
| Detalle de pedido | no existe en la cuenta | detalle nativo (estado, envío, seguimiento) | **Native** (nuevo) |
| Pedidos de invitada | nunca se vinculan | los pedidos quedan en el cliente por email (el ingreso usa ese email) | **Native** (a confirmar en B) |
| Favoritos (lista) | Postgres por usuario | metafield `custom.wishlist` + app que escribe | **App** |
| Unión invitada → cuenta | Server Action al hacer login | `wishlist.js` (hecho) + endpoint de la app (pendiente) | **App** |
| Favoritos entre dispositivos | sí (servidor) | sí, vía metafield del cliente | **App** |
| "Mis favoritos" en la cuenta | `/cuenta/favoritos` | página full-page `customer-account.page.render` en el menú de la cuenta | **Ext** |
| Navegación de la cuenta | barra lateral propia | menú `customer-account-main-menu` (Admin > Contenido > Menús) | **Native** |
| Métodos de pago guardados | no aplica (Wompi, sin tarjetas guardadas) | depende del proveedor de pago; no forma parte de esta fase | **Not needed** |
| Devoluciones | no existe en la cuenta | autoservicio de devoluciones nativo si Daniela lo activa (decisión de negocio) | **Native** (opcional) |
| Newsletter | tabla propia sin relación con el usuario | consentimiento de marketing del cliente en Shopify | **Native** (migración aparte) |
| "Avísame cuando vuelva" | tabla propia | no nativo | **App** (fuera de 02L, ya pendiente desde 02H) |
| Cambiar contraseña / borrar cuenta | no existen | no hay contraseña; los pedidos de borrado de datos pasan por Shopify | **Not needed** / **Native** |
| Panel admin y roles | `role` ADMIN en `User` | Admin de Shopify con cuentas de staff | **Change** (queda fuera del theme) |

---

## 4. Header — entrada a la cuenta (hecho en 02L)

`sections/header.liquid` (líneas ~191–227):

- **Con cuentas nuevas activas** (`shop.customer_accounts_enabled`): `<shopify-account class="site-header__account" menu="{{ section.settings.customer_account_menu | default: 'customer-account-main-menu' }}">`.
  - Sin sesión: el slot `signed-out-avatar` muestra el ícono de cuenta del theme.
  - Con sesión: el slot va vacío y la inicial la dibuja **Shopify**. El theme no inventa avatar ni estado "logueada".
- **Sin JS:** `<noscript>` con link a `routes.account_url`.
- **Sin cuentas nuevas:** el mismo link `routes.account_url`. Cero URLs hardcodeadas.
- **Setting nuevo** `customer_account_menu` (link_list): el menú que muestra la hoja. Por defecto, el mismo menú de las páginas de cuenta.
- **Desktop:** visible desde 1024 px, igual que el ícono "Cuenta" real (`hidden lg:flex`). Área táctil de 44 px mínimo; variables CSS de marca en `section-header.css` (`--shopify-account-*`, `::part(signed-out-avatar)` con hover `#f5f5f5`).
- **Mobile:** sin cambio. La cuenta vive en el menú mobile (píldora "Mi cuenta" → `routes.account_url`), EXACT del real. No se agregó ícono en el header mobile para no desbordar a 320 px.
- **Teclado:** el botón de `<shopify-account>` vive en su shadow DOM y lo maneja Shopify. El fallback `<a>` tiene foco nativo. El foco real de la hoja se verifica en B.
- **No se tocó:** búsqueda, favoritos, carrito, sticky ni menú mobile. Harness: 10 anchos sin overflow (§ 21).

---

## 5. Detección de sesión (auth detection)

Sin inventos:
- Nada de globals, cookies legibles ni tokens en el navegador.
- El theme usa **solo** el objeto Liquid `customer`: documentado como "disponible cuando la clienta ingresó, nil si no".
- Que se llene tras un ingreso con **cuentas nuevas** está implícito en los ejemplos oficiales, pero **no dicho**. Es el **GO/NO-GO B1**, y el setting `wishlist_account_sync` no se enciende hasta confirmarlo.

**`customer` sirve para mostrar, no para autorizar escrituras.** La identidad para **escribir** vive en el **bridge**:
- Desde la tienda: el app proxy, con `logged_in_customer_id` **firmado por Shopify** (nunca un id enviado por el navegador).
- Desde la cuenta: la extensión, con session token (`sub` = GID del cliente).

---

## 6. Dónde guardar favoritos por clienta — comparación

| Criterio | A. Metafield de cliente (`custom.wishlist`) | B. Datos propios de la app / backend con base | C. Customer Account API | D. Admin API vía app custom | E. Extensión de cuenta + backend | F. Otro oficial |
|---|---|---|---|---|---|---|
| Leer desde la tienda | **Sí, Liquid** (sin request) | fetch a la app | **No** desde el theme (necesita OAuth Headless) | solo vía backend | solo vía backend | Shop app: no llega al theme |
| Escribir desde la tienda | **No** (theme no escribe) | sí, vía proxy | **No** desde el theme | **sí, vía app proxy** | sí, vía proxy | — |
| Identidad | `customer` (lectura) | proxy firmado | Shopify (en extensiones) | proxy firmado | session token | — |
| Entre dispositivos | sí | sí | sí | sí | sí | no |
| Unión invitada → cuenta | con endpoint | con endpoint | — | sí | sí | — |
| Seguridad | lectura de la propia clienta | depende de la base propia | alta (Shopify) | alta si se valida HMAC | alta | — |
| Portabilidad / propiedad | **dato en Shopify**, exportable, sobrevive a la app | dato fuera de Shopify | en Shopify | en Shopify | depende | — |
| Plan | todos | todos | Basic+ (extensión) | todos | Basic+ | — |
| App requerida | para escribir | sí | sí (extensión) | sí | sí | — |
| Backend | para escribir | **sí + base de datos** | no (Shopify aloja) | función sin estado | sí | — |
| Rate limits | Admin API (throttle por costo) | propios | por extensión | Admin API | ambos | — |
| Mantenimiento | bajo | **alto** (base, backups, GDPR) | bajo | bajo | medio | — |
| Lock-in | bajo | medio | bajo | bajo | bajo | alto (app de terceros) |

**Conclusión:** no hay una opción única que haga todo. La combinación mínima y oficial es:
- **A (dato)**: metafield del comercio, legible en Liquid sin requests.
- **D (escritura desde la tienda)**: una función sin estado detrás del app proxy.
- **C/E (página "Mis favoritos")**: la extensión lee con la Customer Account API.

**B se descarta:** una base propia agrega mantenimiento sin ganar nada.

Una **app de wishlist de terceros** existe como alternativa. No se instala ni se elige (regla de la fase): mete lock-in y datos fuera del control de Radaelli.

---

## 7. Arquitectura recomendada (y por qué)

### 7.1 Dato
- Metafield **del comercio** `custom.wishlist`, tipo `list.product_reference`: GIDs de producto en orden de alta. No guarda PII, precios ni HTML.
- **Creado en Admin** (Configuración > Datos personalizados > Clientes), **nunca** declarado en el TOML de la app.
- Acceso Customer Account: Read, o Read y write si el Admin lo ofrece (B5).

Por qué del comercio y no `$app`:
- Los metafields de app se **borran al desinstalar** la app (documentado). Recrear la app cambia el namespace y deja huérfanos todos los favoritos.
- Liquid del theme lee `custom.*` por la vía documentada.
- Daniela los ve y los exporta desde el Admin.

**Tope:** 100 para altas nuevas (igual que invitada), dentro del límite de 128 de Shopify. Una lista existente de más de 100 **nunca** se recorta.

### 7.2 Lectura en la tienda
Liquid imprime `#wishlist-account-state` con `{v, owner, items:[{id, handle}]}` desde `customer.metafields.custom.wishlist.value`:
- Sin requests por corazón ni polling. Los productos borrados o no publicados llegan `nil` y se saltean.
- Solo si `settings.wishlist_account_sync` **y** hay `customer`.
- Sin sesión, con el setting encendido: `{"signedOut":true}` (§ 10).

### 7.3 Escritura desde la tienda
- La app de Radaelli expone **una** función sin estado detrás del **app proxy**: `POST {add:[{id,handle}], remove:[id]}`. Cuerpo vacío = refrescar. Responde `{items, rejected, notFound}`.
- **Identidad:** SOLO `logged_in_customer_id` firmado, con:
  - HMAC en tiempo constante;
  - allowlist de la tienda;
  - ventana de ±300 s;
  - `401` si viene vacío.
- **Escritura:** Admin `metafieldsSet` con `compareDigest` (CAS). 3 reintentos, después `409`.
- **Validación:** existencia de producto con `nodes()` antes de escribir (scope `read_products`), para que un GID malo no tumbe la escritura atómica.
- **Respuestas:** `Cache-Control: private, no-store`.
- **CSRF:** POST + `Content-Type: application/json` + header propio.

El theme **no** incluye este `fetch`. La app registra el transporte (§ 8) desde su app embed, que además es un interruptor automático: sin app o sin embed, no hay modo cuenta.

### 7.4 Interruptores (kill switches)
1. Setting `wishlist_account_sync`: **apagado por defecto**. Se enciende recién después de los GO/NO-GO (§ 20).
2. Transporte registrado por la app. Si la app falta o su embed está apagado, el modo cuenta no se activa.

### 7.5 Componentes necesarios (no construidos)
- **App custom de Radaelli**, custom distribution:
  - app embed (theme app extension) que registra el transporte y la URL de "Mis favoritos";
  - app proxy;
  - función sin estado;
  - extensión full-page.
- **Scopes:** `read_customers`, `write_customers`, `read_products`, `write_app_proxy`, `customer_read_customers` y `customer_write_customers` (extensión), con datos protegidos de cliente **nivel 1**.
- **Webhooks de compliance obligatorios:** como no-op, porque no se guarda nada fuera de Shopify.
- **Hosting de la función:** separado del Vercel/Neon actual.

---

## 8. Contrato del adaptador (hecho en `assets/wishlist.js`)

Una sola fachada para la UI: `isSaved(id)`, `activeItems()`, `toggleFavorite(id, handle, source)`, eventos `wishlist:*`.
- Tarjeta, ficha, header y página **no conocen el modo**: comparten la misma delegación de clicks, el mismo `syncTriggers()` y la misma página.
- Sin lógica duplicada.

**Modo invitada (02K, sin cambios):** `localAdapter` con `init`, `load`, `save` y `subscribe`, y `store` con `has`, `add`, `remove`, `updateHandle`, sobre la clave `radaelli:wishlist` v1.

**Modo cuenta:** se activa SOLO con las dos condiciones.
1. Liquid imprimió `#wishlist-account-state` válido: `owner` = 64 hex; si no, se ignora.
2. La app llamó `window.Radaelli.wishlist.connectAccount(transport)`, o dejó `window.Radaelli.wishlistAccountTransport` antes de que cargue el archivo.

Contrato del transporte (lo implementa la app):
```
transport.apply({ add: [{ id, handle }], remove: [id] })
  -> Promise<{ items: [{ id, handle }], rejected: [id], notFound: [id] }>
  rechaza con error.status: 401 | 409 | 0 | 5xx
transport.accountPageUrl   // opcional: URL de "Mis favoritos" en la cuenta
```

**API pública:** `window.Radaelli.wishlist = { has, items, sync, connectAccount, mode, core }`. `core` son funciones puras sin DOM ni red, probadas en el harness: `normalizeItems`, `sanitizeGuest`, `union`, `applyOps`, `setIntent`, `pruneConfirmed`.

**Garantías:**
- Si el servicio remoto falla, la experiencia sigue: la vista optimista se mantiene y lo local no se toca.
- El modo cuenta solo se activa con sesión real (Liquid) **y** con la app presente.

**Performance:**
- Inicialización única y estado inicial desde Liquid: 0 requests para pintar corazones.
- Envío con debounce de 400 ms y en lote: una sola request junta varias altas y bajas.
- Reintentos con espera de 2, 8 y 30 s. Sin polling. Sin SDK.

---

## 9. Unión invitada → cuenta (algoritmo)

`guest = {A,B,C}`, `account = {B,D}` → **`[B, D, A, C]`**. La cuenta va primero en su orden; después lo de invitada en su orden; sin duplicados.

```
al activar el modo cuenta (y en cada envío):
  navigator.locks.request("radaelli:wishlist:sync"):      // 1 pestaña a la vez
    ops    = releer cola de ESTA clienta (clave outbox:<owner>)
    guest  = releer radaelli:wishlist menos ids rechazados antes
    add    = guest ∪ ops.add   (sin los que la clienta quitó)
    remove = ops.remove
    si add y remove vacíos y no es "refresh": salir        // otra pestaña ya unió
    resp = transport.apply({add, remove})                 // servidor: unión + CAS
    si la clienta salió mientras tanto: salir sin tocar nada
    base = resp.items                                      // la cuenta manda
    confirmar en la cola solo las ops que no cambiaron mientras viajaba la request
    podar de guest SOLO: ids en resp.items ∪ resp.notFound ∪ quitados con sesión
    rejected (tope) -> quedan en guest + marcados por clienta (no se reenvían)
    avisar a otras pestañas (BroadcastChannel "base") y después vaciar la cola
  si falla:
    401  -> aviso + link a "Mis favoritos" en la cuenta; SIN reintento en bucle ni recarga
    otro -> reintento 2 s / 8 s / 30 s; la vista NO se revierte
```

**Propiedades probadas en el harness:**
- **Idempotencia:** reenviar la misma unión no duplica (el servidor deduplica por GID).
- **Falla del servidor:** `localStorage` queda intacto hasta un 200.
- **Cierre de la pestaña a mitad de camino:** lo local queda; el reintento es idempotente.
- **Varias pestañas al ingresar:** el lock + la relectura dan **1 sola** unión.
- **Mientras la unión no se confirma:** lo de invitada se sigue viendo guardado (vista = cuenta ∪ invitada pendiente ⊕ cola), así que "nada desaparece".
- **Después del OK:** la cuenta es la fuente de verdad.

---

## 10. Cerrar sesión y privacidad

- La lista de la cuenta **nunca** se copia al navegador: no hay clave "remota" en localStorage.
- **Qué queda en el navegador:**
  - La lista de invitada: tras una unión exitosa queda vacía (o solo con lo rechazado por tope).
  - La cola `radaelli:wishlist:outbox:<owner>` con **solo intenciones sin confirmar**. `owner` = `sha256(customer.id + ':' + shop.permanent_domain)`; nunca email ni id en claro.
- **La cola vence a los 30 días:** se descarta con **aviso visible** en la página de favoritos, nunca en silencio. Nunca se muestra en modo invitada ni se envía bajo otra clienta.
- **Otras pestañas:** con el setting encendido, una página sin sesión publica `signed-out` por BroadcastChannel. Las pestañas que seguían en modo cuenta vuelven a invitada **sin recargar** y dejan de mostrar la lista.
- **Botón "atrás" (bfcache):** `pageshow` con `persisted` revalida contra la cuenta.
- **Computadora compartida:** después de salir, la siguiente persona ve solo la lista de invitada, normalmente vacía.
- **Riesgo residual (aceptado):** la cola de una clienta que no vuelve queda en ese navegador. Contiene ids de producto y un hash, sin PII en claro, y vence recién cuando esa clienta vuelve a ingresar en ese navegador.

---

## 11. "Mis favoritos" dentro de la cuenta

- **Extensión full-page** `customer-account.page.render` de la app de Radaelli:
  - Aparece en el menú de la cuenta (paso "Add to menu" del editor).
  - Vive en la URL de Shopify (`routes.account_url` + `/pages/<id>`). **No se fuerza `/cuenta/favoritos`**; un redirect de URL en el Admin es opcional.
- **Lee** con la Customer Account API: `customer.metafield(custom.wishlist)` → productos, con `shopify.query()` a la Storefront API para imagen, precio y `onlineStoreUrl`.
- **"Ver producto"** es un `Link`/`Button` con `href` a la ficha; `navigate()` no sale a la tienda. **Sin "agregar al carrito"**: la tienda es donde se compra.
- **"Quitar":**
  - Customer Account API `metafieldsSet` + `compareDigest`, si B5 confirma escritura sobre `custom.*`;
  - si no, un endpoint de la misma función **por CORS con session token** (verificar firma, `exp`/`nbf`, `aud`, `dest` y `sub`), **nunca** por el app proxy.
- **Fallback:** si la extensión no está disponible en el plan, el menú de la cuenta enlaza a la página de favoritos de la tienda.
- **Accesibilidad y mobile:** los componentes de Shopify ya son accesibles y responsive. No hay CSS propio (las extensiones no lo permiten).

---

## 12. Página de favoritos de la tienda después del login

- Es la misma `page.wishlist` de 02K, con la misma UI. Solo cambia la fuente: `activeItems()` = vista de la cuenta en modo cuenta, lista local en invitada.
- **Estado mínimo agregado:** un aviso `[data-wishlist-sync-notice]` (`role="status"`, oculto por defecto). Aparece solo en modo cuenta y solo en 3 casos:
  - Shopify no confirmó la sesión (`401`), con link a la cuenta;
  - la cuenta llegó al tope;
  - hubo cambios vencidos.
- No hay botón "sincronizar" ni texto que aparente sincronizar sin hacerlo.
- En modo invitada nada cambia respecto de 02K (probado).

---

## 13. Modelo de datos

- **Cuenta:** `customer.metafields.custom.wishlist`, tipo `list.product_reference`, con `gid://shopify/Product/<id>` en orden de alta.
  - No guarda precio, stock, HTML ni copias del producto.
  - No hay `createdAt` por ítem: `list.*` no tiene campos por elemento. El orden es la fecha relativa. Si algún día se necesita fecha, sería un json aparte (no ahora).
- **Invitada:** `radaelli:wishlist` = `{v:1, items:[{id, handle}]}`.
- **Cola:** `radaelli:wishlist:outbox:<owner>` = `{v:1, owner, ops:{<id>:{op, handle}}, rejected:[id], updatedAt}`.
- **Casos:**
  - **Producto borrado:** Liquid devuelve `nil` y se saltea; el servidor lo informa como `notFound` y se poda.
  - **Cambio de handle:** la cuenta guarda el GID, y el handle lo resuelve Shopify en cada render (en invitada lo actualiza el redirect de 02K).
  - **Archivado o no publicado:** no se muestra en la tienda; queda en la lista y reaparece si se publica.
  - **Variante que desaparece:** no aplica, porque los favoritos son por producto (igual que el real).

---

## 14. Seguridad / trust boundary

```
navegador (no confiable)          Shopify (confiable)                 App Radaelli (confiable)
─────────────────────────         ────────────────────                ────────────────────────
wishlist.js                        Liquid: customer + metafield ──►    (solo lectura, render)
  └─ transporte de la app ──POST──► /apps/<proxy>  + firma HMAC ───►   función sin estado
     {add, remove}                  logged_in_customer_id               verifica HMAC, shop, ±300 s
     (sin id de cliente)                                                id = SOLO el firmado
                                                                        Admin metafieldsSet (CAS)
extensión "Mis favoritos" ─────► Customer Account API (Shopify)      o /ca con session token
```

- **Evitado:**
  - tokens en localStorage;
  - token de Admin en el navegador (el token de Admin vive solo en la función);
  - secretos en el cliente;
  - ids de cliente tomados del body, query o DOM;
  - email como llave;
  - IDOR (el dueño lo decide Shopify, nunca la request).
- El hash `owner` **no autoriza nada**: solo separa colas locales.
- **Logs de la función:** estado, motivo y latencia. Nunca pares producto + cliente.
- **Sin rate limit por clienta "sin estado":** se usa el throttle de la Admin API. Si hiciera falta un límite propio, requeriría un KV explícito.

---

## 15. Migración de los favoritos actuales (solo plan; nada ejecutado)

1. **Exportar (solo lectura, más adelante):**
   - `Wishlist` con `userId` no nulo + `WishlistItem.productId`;
   - `User.email` / `name`;
   - `Product.slug`.
2. **Mapear usuario → cliente de Shopify por email.** Los clientes se crean al importar clientes (CSV del Admin) o en el primer ingreso. **Pre-crear clientes requiere aprobación de Daniela** (Habeas Data).
3. **Mapear producto:** `Product.slug` → handle → GID de Shopify. Los no encontrados van a un reporte y no se escriben.
4. **Escribir** con la misma función: unión con `compareDigest` (nunca pisar ni recortar), en lotes, con **auditoría JSONL** y **snapshot previo** para rollback.
   - Si se usa email, va por el CSV del Admin o por una credencial de migración de corta vida que se revoca al terminar.
5. **Ensayo en seco (dry run)** obligatorio antes de escribir; los reintentos son idempotentes.
6. **Listas de invitada del sitio viejo** (cookie `lago-wishlist-id`): no tienen identidad y viven en otro dominio. **No son migrables** a clientes. Sembrarlas en localStorage del mismo dominio requiere decisión explícita de Daniela.
7. **Clientas sin cuenta Shopify todavía:** su lista espera en el export hasta que ingresen, si Daniela aprueba ese flujo.
8. **No se toca Neon/Postgres en esta fase.**

---

## 16. Pedidos, perfil y direcciones

- **Desaparece del frontend custom:**
  - `/cuenta` (resumen, perfil, direcciones, pedidos);
  - login, registro, recuperación, restablecimiento y verificación;
  - la sesión propia, los 4 emails de cuenta y el rate limit de auth.
- **Se delega a Shopify:**
  - ingreso;
  - perfil;
  - direcciones (conectadas al checkout);
  - pedidos + detalle + seguimiento;
  - devoluciones (si se activan);
  - emails de cuenta y de pedido (notificaciones de Shopify).
- **Se ajusta después en Admin:**
  - branding de las páginas de cuenta (logo, colores, tipografía) en el editor de checkout y cuentas;
  - menú de cuenta (Contenido > Menús);
  - opciones de ingreso (Shop, Google…);
  - textos de notificaciones.
- **No se construye** un dashboard de pedidos propio.
- **Redirects:**
  - `/cuenta/**` → `routes.account_url`;
  - `/favoritos` → `/pages/favoritos`.
  - Se configuran como redirecciones de URL en el Admin (fase de lanzamiento).

---

## 17. Qué se puede construir y dónde

**A. Offline en el theme (hecho en 02L)**
- Header con `<shopify-account>` y sus fallbacks.
- Adaptador de dos modos + núcleo puro.
- Bootstrap inerte (Liquid) + marcador de sesión cerrada.
- Setting kill switch.
- Avisos ocultos por defecto.
- Locales es/en.
- Harness con mocks aislados.

**B. Requiere Development Store:** los 9 GO/NO-GO de § 20 (comportamiento real de Shopify que ningún doc garantiza).

**C. Requiere app / backend / extensión**
- La función de escritura detrás del app proxy.
- El app embed que registra el transporte.
- La extensión "Mis favoritos".
- La migración.

**D. APIs oficiales sin backend propio**
- Ingreso, perfil, direcciones, pedidos y detalle (nativo).
- Lectura de la lista en Liquid.
- Lectura en la extensión (Customer Account API).

**E. No construir**
- Templates `customers/*`.
- Formularios de contraseña.
- Cookies/tokens propios.
- Lista remota en localStorage.
- Identidad del navegador.
- Proxy con aserción de identidad propia (bearer de 12 h rechazado por los jueces).
- Dashboard propio.
- App de wishlist de terceros.

---

## 18. Dependencias de plan y features

- New Customer Accounts: todos los planes.
- UI extensions de cuenta: **Basic o superior** según la tabla oficial. Custom distribution en el plan real = B6.
- App proxy y Admin API: todos los planes. Datos protegidos de cliente: nivel 1.
- Search & Discovery y demás siguen como en fases anteriores. Nada de 02L requiere Plus.

---

## 19. Mantenimiento y lock-in

- **Dato en Shopify** (metafield del comercio): lock-in bajo y exportable. Sobrevive a desinstalar o recrear la app.
- **Gobernanza:**
  - nunca borrar la definición;
  - export mensual (bulk) fuera de Shopify;
  - auditar apps con `write_customers`;
  - nota en la política de privacidad: los favoritos se guardan en el registro del cliente.
- **Código propio:**
  - 1 función sin estado (sin base);
  - 1 extensión;
  - 1 app embed.
  - Versiones de API fijadas y actualizadas 1 vez por año.
  - Runbook de rotación del secreto.
- **Riesgo principal:** que `logged_in_customer_id` siga fallando con cuentas nuevas (B2). Mitigación: sin pérdida de datos, aviso y link a la cuenta; la extensión escribe con su propia identidad.

---

## 20. GO/NO-GO en Development Store (antes de encender nada)

1. `{{ customer.id }}` se llena en producto, colección y página tras **cada** vía de ingreso: código, hoja `<shopify-account>`, Shop y `storefront_login_url`. Vuelve a `nil` al salir, también a las 24 h y a los varios días.
2. `logged_in_customer_id` en el proxy: tasa de vacíos en más de 100 requests. Probar dominio `myshopify` vs dominio propio, y otra pestaña/navegador.
3. Las páginas con el bootstrap **nunca** se sirven cacheadas a otra clienta ni a anónimos.
4. Admin `metafieldsSet` con `compareDigest`: alta con `null`, código de error por digest viejo.
5. Customer Account API: ¿escribe en `custom.wishlist` (definición del comercio)?
6. Extensión full-page en el plan real con custom distribution; si su ítem aparece en la hoja de `<shopify-account>`.
7. Token de Admin para la función sin base de datos (client credentials / token de instalación).
8. El proxy reenvía `Content-Type` y el header propio (defensa CSRF), y no concede preflight cross-site.
9. Templates legacy ignorados: `/account/login` y `/account/register` → páginas de Shopify; un POST legacy a `/account` no crea clientes.

**Sin verificar, con fallback:**
- **¿La hoja recarga tras ingresar?** Si no, la unión arranca en la próxima navegación.
- **Demora de lectura tras escritura en Liquid:** se mitiga con la vista optimista.
- **Sesión de tienda (~30 días) vs de cuenta (365):** si la tienda pierde la sesión, la página vuelve a invitada.

---

## 21. Cambios de código offline y verificación

**Archivos tocados:**
- `sections/header.liquid`: `<shopify-account>` + fallbacks + setting `customer_account_menu`.
- `assets/section-header.css`: estilos de la cuenta, variables oficiales y `::part`.
- `assets/wishlist.js`: capa de cuenta, núcleo puro, cola, lock, canal, TTL y `signed-out` (915 líneas; el modo invitada queda idéntico).
- `layout/theme.liquid`: bootstrap / marcador `signedOut` detrás de `wishlist_account_sync`.
- `sections/main-wishlist.liquid`: aviso + 3 mensajes.
- `assets/section-wishlist.css`: link del aviso.
- `config/settings_schema.json` / `settings_data.json`: `wishlist_account_sync` = false.
- `locales/es.default.json` / `en.default.json`: 4 claves `sync_*`.

**Verificación:**
- Theme Check: **57 archivos, 0 errores, 0 warnings**.
- JS (`node --check`, 12 assets) y 16 JSON: válidos.
- **Harness aislado** (127.0.0.1:4177 en el scratchpad, fuera del repo; mocks **solo** ahí):
  - Sirve los assets reales de `theme-src` y un espejo del HTML de header, tarjeta, ficha, página y bootstrap.
  - Corre 28 pruebas en iframes del mismo origen (comparten localStorage, Web Locks y BroadcastChannel como pestañas reales): **28/28 PASS**.
  - Cubre: núcleo puro (3), selección de adaptador (6 combinaciones), unión OK / idempotente / con falla 500 / 503 transitorio, tope con rechazados no reenviados, cola persistente, quitar con sesión, última intención gana, 401 sin bucle ni recarga, cerrar sesión (privacidad), `signed-out` entre pestañas, cola vencida con aviso, superficies sincronizadas, página en modo cuenta, 2 pestañas con lock, cola + canal entre pestañas, `pageshow` (sintético), header en **10 anchos** (1440/1280/1024 visible 44 px; 1023/768/640/430/390/375/320 oculto; sin overflow), fallbacks del header, IDs duplicados / interactivos anidados (5 páginas) y **regresión 02K de invitada** (4 pruebas: corazones que nacen ocultos, sincronización, persistencia, 404, handle renombrado, JSON corrupto, sin almacenamiento, tope 100).
  - **0 requests a `/apps`** en toda la suite.
- **Mutation testing:** 6 regresiones inyectadas al servir `wishlist.js` (sin lock, reintento en 401, lista remota guardada en local, olvidar rechazados, ignorar `signed-out`, vencer en silencio). **6/6 detectadas** por la suite.
- **Limitaciones declaradas:**
  - Los clicks del harness son `element.click()` (sintéticos).
  - `pageshow` persisted es sintético.
  - El HTML es un espejo a mano del Liquid, así que la ejecución real de Liquid (`sha256`, `customer.metafields`) solo la valida Theme Check y va a B.
  - `<shopify-account>` no se ejecuta offline: su script lo inyecta Shopify. Se probó el layout del elemento y sus fallbacks.

---

## 22. Consecuencias aceptadas y decisiones pendientes de Daniela

- **Unión sin "lápidas":** un favorito quitado en un dispositivo puede volver si otro dispositivo tenía la misma prenda como invitada sin unir y después ingresa. Es aceptable para una lista de deseos.
- **Safari (ITP)** puede borrar la lista de invitada a los ~7 días sin visitas. Ingresar la protege.
- **Las listas de invitada del sitio viejo no se migran.** Las de clientas con cuenta, sí, si Daniela decide migrar clientes (y aprueba el pre-alta).
- **Una lista de invitada con más de 100 no entra completa** en una cuenta llena. Lo rechazado queda en el navegador con aviso.
- **Pendiente de Daniela:**
  - pre-crear clientes (Habeas Data);
  - activar devoluciones;
  - opciones de ingreso social;
  - nota de privacidad;
  - redirects `/cuenta` y `/favoritos` al lanzar.

---

## 23. Próximos pasos de implementación (propuesta; el alcance real de 02M lo define ChatGPT)

1. Development Store con New Customer Accounts: correr los GO/NO-GO 1–9 (§ 20).
2. Si pasan: crear `custom.wishlist` en Admin y la app custom (proxy + función + app embed + extensión) con los scopes de § 7.5.
3. Implementar el transporte en el app embed contra el contrato de § 8. El theme no cambia.
4. Encender `wishlist_account_sync` solo en la Development Store y repetir el harness contra el backend real.
5. Migración (dry run → unión auditada) cuando Daniela apruebe el paso de clientes.

---

## 24. Observaciones fuera de alcance

- `locales/` tiene **dos** archivos `*.default.json` (`es.default.json` y `en.default.json`) desde 02A. Shopify admite un solo default. Theme Check no lo marca, pero probablemente falle al subir el theme; el inglés debería ser `en.json`. **No se tocó** (no es de 02L). Queda para decidir en una fase de empaquetado.
- `README.md` decía "Compatible con Customer Accounts Classic (`templates/customers/*.json`)". Se corrigió: el theme apunta a New Customer Accounts y no tiene ni necesita esos templates.
