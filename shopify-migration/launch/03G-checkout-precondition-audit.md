# 03G — Auditoría de precondiciones de checkout (sin ejecutar A1)

- **Fecha:** 2026-09-29, medido entre ~17:40 y ~17:48 (Bogotá). Dev Store `radaelli-swimwear-dev`, theme Radaelli RC1.8 (`189072474431`, sin publicar).
- **Regla:** no se ejecutó A1, no se cambió mercado ni envíos, no se activó ningún pago, **no se creó ningún pedido** y no se escribió nada en el checkout. Solo se usó la sesión del navegador: se agregó 1 ítem al carrito, se abrió `/checkout` para leer la pantalla, se probó el país CO por sesión y se dejó todo como estaba (país US, carrito vacío).
- **Evidencia:** `[MEDIDO-03G]` = medido hoy en la Dev Store; `[DOC:…]` = documento del repo; `[NOT_VERIFIED]` = no se pudo comprobar.

## 1. Modo de falla actual (esperado y confirmado)

| Situación | Resultado medido hoy | Etiqueta |
|---|---|---|
| País de la sesión **US** (mercado principal hoy) | `POST /cart/add.js` de `MAREA NATURAL BEIGE – M` → **200**; carrito COP **183.920** (1 ítem). | `[MEDIDO-03G]` |
| Checkout con país US | Abre en `/checkouts/cn/…/es-us`. Sección **Entrega**: país "Estados Unidos" y lista de estados de EE. UU. Sección **Métodos de envío**: "Ingresa tu dirección de envío para ver los métodos disponibles." Sección **Pago**: **"Esta tienda no puede aceptar pagos en este momento."** Resumen: `COP $183,920.00` (formato numérico de EE. UU.). El teléfono figura "(opcional)". | `[MEDIDO-03G]` |
| País de la sesión **CO** (`PUT /localization`) | Las **3 variantes** de `marea-natural` quedan `available:false`; `POST /cart/add.js` → **422** "El artículo … ya está agotado."; el botón de la ficha dice **"Producto agotado"**; el precio se sigue mostrando ($ 183.920, precio anterior $ 229.900, −20 %). | `[MEDIDO-03G]` |
| Restauración | `PUT /localization` con `US` → país US; `cart/clear.js` → 0 ítems. | `[MEDIDO-03G]` |

**Conclusión:** el modo de falla actual es el esperado y coincide con 03E/03F. Es doble y ambos puntos son del owner (bloqueo crítico **A1**):
1. **C2 (envío):** para Colombia todo figura agotado porque no existe zona de envío de Colombia (solo "Domestic – Estados Unidos"; la sucursal está en EE. UU.).
2. **C1 (mercado):** el mercado principal y la dirección de la tienda siguen en EE. UU., por eso el checkout abre en `es-us` con estados de EE. UU.
3. **Pagos:** ninguna pasarela activa ("Esta tienda no puede aceptar pagos en este momento"). Depende de B1 (Wompi o la pasarela de prueba de Shopify) y, para instalar Wompi, de que la dirección de la tienda esté en Colombia.

## 2. Precondiciones para un checkout en Colombia

Orden obligatorio (fuente: `theme/03F-owner-market-colombia-runbook.md` § 2 y `shipping/03F-owner-shipping-runbook.md`): **zona de envío de Colombia primero, mercado principal después**.

| # | Precondición | Quién | Estado hoy | Fuente |
|---|---|---|---|---|
| P1 | Dirección de la sucursal / tienda en Colombia (hoy "Estados Unidos") | owner | Pendiente | `[MEDIDO-03G]` Admin > General |
| P2 | Zona de envío **Colombia** con la tarifa gratis desde $299.900 (regla `>=`, después del cupón) | owner | No existe | `[MEDIDO-03G]` Admin > Envío (1 perfil, 1 zona) + `[DOC:shipping/03E-shipping-source-of-truth.md]` |
| P3 | Decisión **D2**: tarifa por debajo de $299.900 (no existe un valor real en ninguna fuente; el sitio actual la "coordina" a mano) | owner | NOT_SET | `[DOC:shipping/03E-shipping-source-of-truth.md]` |
| P4 | Mercado **Colombia** como principal (ya existe y figura "Activo"; falta convertirlo en el principal) y región de respaldo Colombia (ya está) | owner | Pendiente | `[MEDIDO-03G]` Admin > Mercados / General |
| P5 | Idioma predeterminado **Español** (hoy el Admin tiene Inglés como predeterminado y Español "publicado, sin traducciones") | owner (al crear la tienda comercial o en Idiomas) | Pendiente | `[MEDIDO-03G]` Admin > Idiomas |
| P6 | Proveedor de pago: Wompi (app/proveedor oficial, OAuth de la dueña) o pasarela de prueba de Shopify (no coexiste con un proveedor de tarjeta activo) | owner (Claude guía) | Ninguno | `[DOC:payments/03F-wompi-owner-runbook.md]` |
| P7 | Ajustes de la pantalla de pago: contacto por correo, teléfono obligatorio, casilla de novedades, condiciones | owner | NOT_VERIFIED (el Admin no terminó de cargar `settings/checkout` en la ventana oculta); en el checkout medido el teléfono aparece como "(opcional)" | `[MEDIDO-03G]` |
| P8 | Encender `free_shipping_rate_confirmed` (y, si se quiere, `cart_free_shipping_progress`) **después** de P2–P3 | Claude | OFF | `[MEDIDO-03G]` theme flags |
| P9 | Impuestos (IVA) y política de reembolso/envío/términos para el pie del checkout | owner | NOT_VERIFIED / legales pendientes (B2) | `[DOC:theme/03F-legal-owner-runbook.md]` |

Lo que Claude verifica **justo después** de A1 (no antes): catálogo `available` con país CO (29/29), `add.js` 200, checkout `es-co` con moneda COP y formato colombiano, tarifas de envío por zona (12 combinaciones), pantalla de pago con el proveedor elegido, y luego el pago de prueba éxito/fallo/pendiente (ver `launch/03G-launch-acceptance-checklist.md`).

## 3. Rutas legacy de Wompi o del checkout antiguo enlazadas desde el theme

Búsqueda sobre los siete directorios desplegables del theme (`assets`, `config`, `layout`, `locales`, `sections`, `snippets`, `templates`) — `[MEDIDO-03G]`:

- **0** apariciones de `wompi`, `/api/`, `/pago`, `/pagos`, `vercel`, `nextjs` ni de enlaces al dominio `radaelliswimwear.com` en Liquid, JS, CSS, JSON de plantillas ni locales (el dominio solo aparece en el correo de soporte de `config/settings_schema.json`, y en comentarios que mencionan `/checkout` en `sections/main-cart.liquid` y `assets/variables.css`).
- **0** enlaces a rutas del sitio actual (`/producto/…`, `/cuenta…`, `/carrito`, `/buscar`, slugs de colección sin `/collections/`).
- Únicos enlaces `https://` en todo `theme-src/`: las 4 redes sociales (`settings_data.json`), el `@context` de schema.org (JSON-LD de la ficha) y `theme_documentation_url` en `config/settings_schema.json`.
- **Hallazgo NOTE (N-01):** `theme_documentation_url` apunta al repositorio de GitHub del proyecto (`github.com/radaelliswimwear-rgb/rada`) y `theme_support_email` es el correo de soporte de la marca. Solo se ven en el editor del theme (Admin), no en el storefront. Decisión de la dueña si el enlace al repositorio debe quedar en el theme comercial (no se cambió: sería un cambio de theme sin necesidad funcional).
- El README del theme menciona Wompi solo para decir que el theme **no** depende de él; no se despliega (el ZIP incluye únicamente los 7 directorios).
- En las 47 redirecciones no hay ninguna hacia rutas de checkout/Wompi; la ruta actual `/checkout` (que en el sitio actual devuelve 200) no tiene redirección: en Shopify `/checkout` es nativa y abre el checkout de Shopify. `[MEDIDO-03G]`

## 4. Estructura del retorno al carrito y al checkout (sin crear pedido)

- El botón "Finalizar compra" es el patrón nativo de Shopify: `<button name="checkout">` que envía el formulario del carrito (`theme-src/snippets/cart-summary.liquid:33`, comentario en `theme-src/sections/main-cart.liquid:13`); el ícono de carrito del encabezado enlaza a `routes.cart_url`. `[MEDIDO-03G]` (lectura de código)
- `GET /checkout` con 1 ítem en el carrito (navegación) abre `/checkouts/cn/<token>/es-us` y **no crea pedido**. Un `fetch` a `/checkout` (probado con el carrito vacío en la captura de rutas) también terminó en una URL `/checkouts/cn/<token>/es-us` con respuesta 403 para el `fetch`; qué muestra la navegación con carrito vacío: NOT_VERIFIED. `[MEDIDO-03G]`
- El checkout es la pantalla nativa de Shopify (New Checkout): la página medida no muestra un enlace "Volver al carrito"; el retorno al storefront es el nombre de la tienda en la cabecera. Personalizar esa pantalla (marca, enlaces, extensiones) es configuración de checkout del Admin, no del theme. `[MEDIDO-03G]`
- Los datos de la pantalla de pago (URL con token de sesión) **no se copian** a ningún documento.

## 5. Hallazgos

| Id | Tipo | Hallazgo | Evidencia | Acción |
|---|---|---|---|---|
| CK-01 | BLOCKER (owner) | El checkout con Colombia no se puede ejecutar: catálogo agotado (sin zona de envío CO) y checkout en `es-us` (mercado principal US). | §1 | A1 (`theme/03F-owner-actions-minimal.md`) |
| CK-02 | BLOCKER (owner) | Sin proveedor de pago activo. | §1 | B1 |
| CK-03 | DIFFERENCE | El total del checkout usa formato de EE. UU. (`COP $183,920.00`) porque el locale es `es-us`. | §1 | Re-medir en `es-co` tras A1 (NOT_VERIFIED hoy) |
| CK-04 | NOTE | Teléfono "(opcional)" en el checkout; el sitio actual lo trata como dato de entrega. | §1 | Decidir en P7 |
| CK-05 | NOTE | `theme_documentation_url` = repositorio de GitHub (N-01). | §3 | Decisión de la dueña |
| CK-06 | NOT_VERIFIED | `settings/checkout` del Admin no cargó en la ventana oculta; impuestos, dominios y píxeles del cliente no se abrieron. | — | Leer con la ventana visible o con la dueña en B1 |

## 6. Límites de esta auditoría

No se ejecutaron pagos ni pruebas con tarjeta; no se mide el checkout a 390 px (la ventana está oculta y no es redimensionable; el checkout no se puede incrustar en un iframe); no se probó el correo de confirmación de pedido (necesita un pedido de prueba, posterior a A1 y B1).
