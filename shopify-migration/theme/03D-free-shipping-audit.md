# 03D — Auditoría de la promesa de envío gratis (estado al cierre de 03D)

> **Implementado en 03D (theme RC1.4, pusheado al theme sin publicar 189072474431):** no se aplicó "umbral = 0" (§ 4 de la auditoría de abajo). En su lugar hay un **cerrojo único y explícito**, porque 0 significa "ocultar" en el theme y "gratis para todos" en el sitio real (riesgo R1).
> - **Nuevo ajuste global:** `free_shipping_rate_confirmed`, en Ajustes del tema > Envío gratis, con `default false`. Mientras esté apagado **no hay ninguna promesa** en:
>   - banner (`promo-banner.liquid`);
>   - ficha (`main-product.liquid`, bloque `shipping`);
>   - barra del carrito (`cart-free-shipping.liquid`, que además sigue exigiendo `cart_free_shipping_progress`).
> - **Guard de moneda en banner y ficha** (`cart.currency.iso_code == shop.currency`), igual que ya tenía el carrito. Cierra el riesgo R3: con el mercado de EE. UU. activo, el umbral en pesos no se convierte.
> - **La frase "Por debajo de ese monto…"** pasó a un campo propio del bloque, `threshold_note`, que se muestra **solo junto a la promesa**. `content` quedó con "Garantía de 12 meses…", que se ve siempre.
> - `free_shipping_threshold` **sigue en 299900.** Es el valor real, confirmado en el HTML en vivo de `/envios` el 2026-09-29. Al lanzar, la paridad se recupera con 1 solo interruptor.
> - **Verificado en la tienda real (11:00):** Home, ficha y carrito con 0 menciones de "envío gratis"; la garantía sigue visible.
> - **Arnés offline:**
>   - 3 tests nuevos: sin tarifa confirmada / con tarifa confirmada / otra moneda;
>   - 5 mutantes (17 a 21), todos detectados.
> - **Dependencia de lanzamiento (owner):**
>   1. Crear en Shopify > Envío la tarifa gratis de Colombia desde $299.900.
>   2. Verificar con un checkout de prueba la regla `>=` y cómo se evalúa el umbral con cupón.
>   3. Encender `free_shipping_rate_confirmed`.
>   4. Recién después, y opcionalmente, `cart_free_shipping_progress`.
> - La nota de `pre-development-store-checklist.md:28` (R5) quedó actualizada en el checklist de 03D.

---


Fecha: 2026-09-29. Modo: **solo lectura** sobre el proyecto. No se editó ningún archivo del repo ni de `theme-src`, no se usó Shopify CLI ni el navegador, y no se consultó la base de datos. Solo se escribió este archivo, en el scratchpad.

Abreviaturas de rutas:
- `TS/` = `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/theme-src/`
- `REP/` = `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/theme/`
- `LIVE/` = `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/` (código del sitio real en Next.js)

---

## 0. Resumen

1. **Hoy el preview del Dev Store promete envío gratis desde $299.900 en dos lugares**, y Shopify todavía no puede cumplirlo:
   - la letra chica del banner promocional del Home (`TS/sections/promo-banner.liquid:23-32`);
   - el acordeón "Envíos, devoluciones y garantía" de **todas** las fichas (`TS/sections/main-product.liquid:284-292`).

   La barra del carrito **no** se muestra, porque la frena `cart_free_shipping_progress=false` (`TS/config/settings_data.json:24`, `TS/snippets/cart-free-shipping.liquid:17`).
2. **Las tarifas de envío para Colombia no están configuradas** en el Dev Store (`REP/03B-store-foundation-report.md:248`, `REP/03C-catalog-import-report.md:9`). El pendiente ya estaba anotado: "el promo y la ficha prometen envío gratis desde $ 299.900" (`REP/03C-catalog-import-report.md:151`, `REP/cart-report.md:158`).
3. **El seguro actual solo cubre el carrito.** El único interruptor "hay tarifa gratis en Shopify" (`cart_free_shipping_progress`) no controla el banner ni la ficha. Esos dos textos dependen solo de `free_shipping_threshold > 0`.
4. **Con umbral 0 no alcanza.** Poner `free_shipping_threshold = 0` oculta la frase de envío gratis del banner y de la ficha. Pero la ficha sigue imprimiendo el texto del bloque, "Por debajo de ese monto, el valor del envío se informa antes del despacho…" (`TS/templates/product.json:26`, que se imprime en `TS/sections/main-product.liquid:291`). Esa frase queda sin referente y además promete un flujo de envío que Shopify no tiene configurado.
5. **Recomendación mínima y reversible:** cambiar 2 valores de configuración, sin tocar el Liquid (ver § 4):
   - `free_shipping_threshold: 299900 → 0`;
   - quitar la primera frase del texto del bloque `shipping` en `templates/product.json`;
   - dejar `cart_free_shipping_progress=false`.

   Conviene aplicarlo en `theme-src` y hacer push, no solo en el Theme Editor. Si se cambia solo en el editor, el próximo push lo revierte (ver § 4.3).

---

## 1. Estado del Dev Store relevante para esta auditoría

| Hecho | Evidencia |
|---|---|
| El theme Radaelli **RC1.3** está en el Dev Store **sin publicar** (id `189072474431`). Horizon sigue live. | `REP/03C-catalog-import-report.md:7-8`, `:50` |
| El theme remoto es igual a `theme-src`: "0 diferencias semánticas". | `REP/03C-catalog-import-report.md:43` |
| El ZIP RC1.3 coincide con `theme-src` en los 11 archivos auditados: `settings_data.json`, `settings_schema.json`, `promo-banner.liquid`, `main-product.liquid`, `product.json`, `index.json`, `cart-free-shipping.liquid`, `es.default.json` y `en.json`. Resultado del diff: "identical". | Verificado en esta auditoría con `unzip -p … \| diff -s` sobre `…/shopify-migration/dist/radaelli-shopify-theme-rc1.3.zip` |
| El preview solo lo ve alguien con sesión en el Admin. Con la contraseña de tienda activa, el link directo lleva a `/password`. | `REP/03A-development-store-upload-report.md:76-78` |
| Idioma español publicado y predeterminado. `/en` es secundario. | `REP/03B-store-foundation-report.md:28`, `:77` |
| Moneda de la tienda COP. Mercado Colombia activo; **Estados Unidos sigue activo**. | `REP/03B-store-foundation-report.md:88-96` (COP), `:99-100` (mercados), `:327` |
| **Envíos para Colombia sin configurar.** No se tocaron las tarifas en 03B ni en 03C. | `REP/03B-store-foundation-report.md:248`, `REP/03C-catalog-import-report.md:9`, `:151` |
| Hay productos importados (29), así que las fichas existen en el preview. | `REP/03C-catalog-import-report.md:6` |
| La descripción de los productos importados **no** menciona envío gratis: 0 coincidencias de "gratis" en el snapshot del catálogo y en `shopify-import/`, `import/`, `catalog/` y `collections/`. | Grep en esta auditoría sobre `…/shopify-migration/source-of-truth/catalog-snapshot.json` y esas carpetas |
| Estado del Theme Editor remoto **después** de 03C/03D. Pudo cambiarse a mano. | **NOT_AVAILABLE**: no se consultó la tienda (ni CLI ni navegador, por restricción) |
| Si la tienda tiene cargada una política de envíos nativa (`shop.shipping_policy`). | **NOT_AVAILABLE**. Las "páginas o políticas legales" figuran como pendientes en `REP/03C-catalog-import-report.md:150` |

Valores vigentes en el theme: `"cart_free_shipping_progress": false` y `"free_shipping_threshold": 299900` (`TS/config/settings_data.json:24-25`).

---

## 2. Theme: cada ocurrencia

"Visible hoy" se refiere al **preview de RC1.3** con los valores vigentes. El theme live del Dev Store es Horizon y no usa estos settings. Si Horizon promete algo es **NOT_AVAILABLE**, porque no se auditó.

### T1. Banner promocional del Home: letra chica de envío gratis

- **Archivo:** `TS/sections/promo-banner.liquid:23-32`
- **Texto:** `{{ 'general.promo.free_shipping' | t: amount: shipping_amount }}` (`:27`). En español, "Envío gratis en compras desde {{ amount }}." (`TS/locales/es.default.json:80`); en `/en`, "Free shipping on orders over {{ amount }}." (`TS/locales/en.json:80`).
- **Monto:** `settings.free_shipping_threshold | times: 100 | money` (`:25`), es decir 29.990.000 centavos formateados con el formato de moneda de la tienda. 03C lo reporta como "$ 299.900" (`REP/03C-catalog-import-report.md:151`).
- **Condición de render:**
  1. La sección está en el Home: `TS/templates/index.json:62-67`, con orden en `:79`, sin `disabled`.
  2. `settings.free_shipping_threshold > 0` (`:23`). No mira `cart_free_shipping_progress` ni la moneda.
  3. El link "Ver política de envíos" (`:28-30`) aparece solo si `section.settings.shipping_policy_url != blank`. En `index.json:64-66` solo está `cta_url`, así que el link no se muestra.
- **¿Visible hoy?** **SÍ**, en el Home del preview. El link a la política, **NO**.

### T2. Ficha de producto: acordeón "Envíos, devoluciones y garantía"

- **Archivo:** `TS/sections/main-product.liquid:284-292`
- **Texto renderizado, dentro de un mismo `<p>`:**
  1. Si el umbral es mayor que 0: "Envío gratis en compras desde {{ amount }}." (`:286-290`, mismo string `general.promo.free_shipping`, mismo cálculo de monto en `:288`).
  2. Siempre: `{{ block.settings.content }}` (`:291`). Hoy su valor es: *"Por debajo de ese monto, el valor del envío se informa antes del despacho, según tu destino. Garantía de 12 meses por defectos de fabricación o calidad."* (`TS/templates/product.json:26`).
- **Título del acordeón:** "Envíos, devoluciones y garantía" (`TS/templates/product.json:25`).
- **Condición de render:**
  1. El bloque `shipping` existe en `TS/templates/product.json:22-32` y está en `block_order` (`:42`). Es la única plantilla de producto: no hay `product.*.json` en `TS/templates/`.
  2. El loop de bloques (`:255`) solo salta `description` si no hay descripción y `payment` si no hay contenido (`:256-261`). Al bloque `shipping` **no lo salta nunca**.
  3. Va dentro de `<details>`, cerrado por defecto (`:262` + `"open": false` en `product.json:30`). El texto está en el HTML y en el DOM, pero se ve al expandir.
  4. Frase 1: `settings.free_shipping_threshold > 0` (`:286`), sin guarda de moneda ni de tarifa. Frase 2: incondicional.
- **¿Visible hoy?** **SÍ**, en todas las fichas del preview al abrir el acordeón. Las dos frases, la de envío gratis y la de "se informa antes del despacho", son promesas que la configuración actual de Shopify no respalda (§ 1).

### T3. Ficha: links de políticas dentro del mismo acordeón

- **Archivo:** `TS/sections/main-product.liquid:293-310`
- **Texto:** "Política de envíos" (`TS/locales/es.default.json:212`), "Política de devoluciones" (`:213`) y "Política de garantía" (`:214`).
- **Condición:** `shop.shipping_policy.url | default: block.settings.shipping_url` (`:294`). El respaldo está vacío (`TS/templates/product.json:27-29`).
- **¿Visible hoy?** **NOT_AVAILABLE**: depende de si el Dev Store tiene políticas nativas cargadas (§ 1). Sin esas políticas, la línea de links no se imprime (`:298`).

### T4. Carrito (drawer y página): progreso de envío gratis

- **Archivos:** `TS/snippets/cart-free-shipping.liquid:14-42`, renderizado en `TS/sections/cart-drawer.liquid:41` y `TS/sections/main-cart.liquid:31`.
- **Texto:**
  - "Te faltan {{ amount }} para envío gratis" más la barra (`:34-40`; `TS/locales/es.default.json:174`);
  - "✓ Tu pedido ya tiene envío gratis" (`:29-32`; `TS/locales/es.default.json:175`);
  - en inglés: `TS/locales/en.json:174-175`.
- **Condición:**
  1. El carrito tiene ítems: `cart.item_count > 0` (`cart-drawer.liquid:40`, `main-cart.liquid:28`).
  2. `settings.cart_free_shipping_progress` **y** `threshold_cents > 0` **y** `cart.currency.iso_code == shop.currency` (`:17`).
- **¿Visible hoy?** **NO**, porque `cart_free_shipping_progress=false` (`TS/config/settings_data.json:24`). Tampoco lo reactiva el JS: ningún asset `.js` del theme menciona free, gratis ni threshold de envío (grep sobre `TS/assets/*.js`). El re-render usa Section Rendering, es decir el mismo Liquid.

### T5. Resumen del carrito: nota de envío

- **Archivo:** `TS/snippets/cart-summary.liquid:31`, renderizado en `cart-drawer.liquid:48` y `main-cart.liquid:46`.
- **Texto:** "El envío se confirma en el checkout." (`TS/locales/es.default.json:156`; en inglés, `TS/locales/en.json:156`).
- **Condición:** carrito con ítems.
- **¿Visible hoy?** **SÍ**. **No promete tarifa** y es compatible con Shopify, que calcula el envío en el checkout. No hace falta cambiarla.

### T6. Configuración del theme (solo en el Admin, no en la tienda)

- `TS/config/settings_schema.json:183-200`:
  - encabezado "Envío gratis" (`:185`);
  - checkbox `cart_free_shipping_progress` con default `false` (`:188-193`). Su ayuda dice: "Activar SOLO si Shopify tiene una tarifa de envío gratis con este mismo umbral…" (`:192`);
  - número `free_shipping_threshold` con **default 299900** (`:195-199`). Su ayuda dice: "Valor real actual: 299900 … Lo usan el carrito, el banner promocional y la ficha de producto." (`:199`).
- **Observación:** la advertencia de `:192` solo protege el carrito. El banner (T1) y la ficha (T2) no la respetan.
- `TS/sections/main-product.liquid:466`: la ayuda del campo "Texto adicional" dice que ese texto "Va después de 'Envío gratis en compras desde...'". Es solo para el editor.

### T7. Textos de locales (fuente de T1, T2, T4 y T5)

- `TS/locales/es.default.json`: `:80` (promo/ficha), `:81` ("Ver política de envíos"), `:156` (nota del carrito), `:173-175` (progreso), `:212` (link de política).
- `TS/locales/en.json`: las mismas claves en `:80-81`, `:156`, `:173-175` y `:212`.
- **Diferencia de copy:** en español dice "desde" (≥) y en inglés "over" (>). El real usa `>=` (`LIVE/lib/checkout/pricing.ts:45`). Solo afecta a `/en`.

### T8. Comentarios y documentación (no se renderizan)

- `TS/sections/promo-banner.liquid:9-11`, `TS/snippets/cart-free-shipping.liquid:1-13` y `TS/snippets/cart-summary.liquid:3-4`.
- `TS/README.md:157`, `:228`.

### T9. Revisado y sin promesas de envío

- `TS/sections/header-group.json:8`: la announcement bar dice "20% de descuento en toda la tienda". Es una promesa de descuento, no de envío, y queda fuera de alcance.
- `TS/sections/announcement-bar.liquid`, `TS/sections/footer.liquid`, `TS/sections/footer-group.json` y `TS/layout/*.liquid`: 0 coincidencias de envío, shipping o gratis.
- **No existe plantilla `page.envios.json`** en `TS/templates/`. Estaba planeada en `REP/theme-file-map.md:47` como "Template ALTERNATIVO porque tiene un dato dinámico (umbral…)". La página de envíos de Shopify va a ser contenido estático; ver R4 en § 6.
- `{{ product | structured_data }}` (`TS/sections/main-product.liquid:354`): no se verificó si el JSON-LD que genera Shopify incluye datos de envío. **NOT_AVAILABLE**.

### Tabla resumen del theme

| # | Ubicación | Promesa | Condición | Visible hoy (preview RC1.3) |
|---|---|---|---|---|
| T1 | `promo-banner.liquid:23-32` | Envío gratis desde $299.900 | sección en `index.json` + `threshold > 0` | **SÍ** |
| T2a | `main-product.liquid:286-290` | Envío gratis desde $299.900 | `threshold > 0` | **SÍ** (al abrir el acordeón) |
| T2b | `main-product.liquid:291` ← `product.json:26` | "Por debajo de ese monto, el valor del envío se informa antes del despacho…" | incondicional | **SÍ** (al abrir el acordeón) |
| T3 | `main-product.liquid:293-310` | Link a "Política de envíos" | existe `shop.shipping_policy` | NOT_AVAILABLE |
| T4 | `cart-free-shipping.liquid:17-42` | "Te faltan $X…" / "ya tiene envío gratis" | toggle + `threshold > 0` + moneda base | **NO** |
| T5 | `cart-summary.liquid:31` | "El envío se confirma en el checkout." | carrito con ítems | SÍ (neutral, sin cambios) |

### Riesgo adicional (inferido del código, no observado en la tienda)

T1 y T2 no tienen la guarda de moneda que sí tiene T4 (`cart-free-shipping.liquid:10-11`, `:17`). Estados Unidos sigue activo como mercado (`REP/03B-store-foundation-report.md:100`). Si ese mercado muestra otra moneda, `money` formatearía los 29.990.000 centavos en esa moneda y no los convertiría. El mismo comentario de `cart-free-shipping.liquid:10-11` explica por qué el carrito se oculta en ese caso. La moneda actual del mercado EE. UU. es **NOT_AVAILABLE**. La recomendación del § 4 (umbral 0) neutraliza este riesgo mientras dure.

---

## 3. Sitio real (Next.js): dónde vive la promesa y de dónde sale el dato

### 3.1 Fuente del dato

| Qué | Dónde |
|---|---|
| Columna `Settings.freeShippingThreshold Int @default(299900)`, "sobre el subtotal de productos ya con el cupón aplicado" | `LIVE/prisma/schema.prisma:1137-1142` |
| Migración que la crea con `DEFAULT 299900` | `LIVE/prisma/migrations/20260915000454_add_free_shipping_threshold/migration.sql:2` |
| Constante `DEFAULT_FREE_SHIPPING_THRESHOLD = 299900` | `LIVE/lib/checkout/pricing.ts:6` |
| Lectura con valor de respaldo | `LIVE/lib/checkout/free-shipping-actions.ts:13-26` |
| Respaldo si falla la lectura de settings | `LIVE/lib/currency/settings-actions.ts:188` |
| El umbral se expone en el DTO público | `LIVE/lib/currency/settings-actions.ts:217-235` |
| Edición en el admin: se acepta **≥ 0** | `LIVE/lib/currency/settings-actions.ts:638-680` (validación en `:650`) |
| Pantalla del admin | `LIVE/components/admin/settings-manager.tsx:152-176` |
| **Seed:** `LIVE/prisma/seed.ts` no toca `Settings` ni el umbral (0 coincidencias). `LIVE/scripts/` tampoco. El valor inicial sale del `@default` de Prisma. | grep en esta auditoría |
| **Valor real en la base de producción** | **NOT_AVAILABLE**: no se consultó la base |
| Regla: `subtotal - discount >= freeShippingThreshold` | `LIVE/lib/checkout/pricing.ts:40-46` |

### 3.2 Dónde se muestra en el sitio real

| # | Lugar | Texto | Condición |
|---|---|---|---|
| L1 | Home: `LIVE/components/home/promo-banner.tsx:35-42` (se monta en `LIVE/app/page.tsx:76`) | "Envío gratis en compras desde {monto}. Ver política de envíos." (link a `/envios`) | **Siempre**; no revisa si el umbral es 0 |
| L2 | Ficha: `LIVE/components/product-detail/product-detail.tsx:162-190` | "Envío gratis en compras desde {monto}. Por debajo de ese monto, el valor del envío se informa antes del despacho, según tu destino. Garantía de 12 meses…" (`:164-168`), más links a envíos, devoluciones y garantía (`:170-189`) | **Siempre** |
| L3 | Drawer del carrito: `LIVE/components/cart-drawer/cart-drawer.tsx:48-84` y `:197-200` | "Te faltan {monto} para envío gratis" (`:70-74`) / "✓ Tu pedido ya tiene envío gratis" (`:62`). El umbral arranca en 299900 y se actualiza al leer la base (`:97-101`) | Se oculta si el umbral es ≤ 0 (`:55`); compara sin cupón (`:59`) |
| L4 | Drawer: `LIVE/components/cart-drawer/cart-drawer.tsx:321-323` | "El envío se confirma en el checkout." | carrito con ítems |
| L5 | Checkout: `LIVE/components/checkout/cost-summary.tsx:29-55` | Fila "Envío" = "Gratis" o "Por confirmar" (`:38`); "Total" o "Total productos" (`:48`); nota: "El valor del envío se informa antes del despacho… En compras desde {monto}, el envío es gratis." (`:52-54`) | `qualifiesForFreeShipping` |
| L6 | Checkout: `LIVE/components/checkout/shipping-notice.tsx:14-41` | "Envío estándar gratis… dentro de Colombia" (`:17-19`) / "Envío por coordinar… En compras desde {monto} el envío estándar es gratis." (`:27-35`) | ídem |
| L7 | Cableado del checkout: `LIVE/components/checkout/checkout-content.tsx:132-137`, `:206-210`, `:692-703` | Umbral por defecto 299900 más lectura de la base. La regla usa el subtotal con cupón | — |
| L8 | Confirmación del pedido: `LIVE/components/checkout/order-confirmation.tsx:26`, `:91`, `:110-114`, `:212-221` | Reusa CostSummary y ShippingNotice | ídem |
| L9 | Página `/envios`: `LIVE/app/envios/page.tsx` | Descripción SEO (`:10`); "En compras iguales o superiores a {monto} COP… envío gratuito dentro de Colombia" (`:34-41`); Envia como transportadora (`:49-50`); **"Envío estándar: 3 a 5 días hábiles" / "Envío express: 24 a 48 horas"** (`:53-54`); coordinación del envío por debajo del umbral (`:64-73`); "aplica automáticamente cuando el subtotal (ya con el cupón…) alcanza {monto}" (`:162-164`) | Siempre |
| L10 | Métodos de envío: `LIVE/lib/checkout/shipping-methods.ts:8-21` | Estándar "3 a 5 días hábiles" y Express "24 a 48 horas", sin precio | Se muestran en el checkout |
| L11 | Correos: `LIVE/lib/email/templates.ts` | Admin: "GRATIS" o "POR COORDINAR CON CLIENTA" (`:261`). Clienta: "Gratis" o "Por coordinar" (`:354`); texto de `:442-446`, "Tu pedido califica para envío estándar gratis…" o "…en compras desde {monto} el envío estándar es gratis." | `qualifiesForFreeShipping` (`:186-190`, `:349-353`) |
| L12 | Admin de pedidos: `LIVE/components/admin/order-detail.tsx:94-101`, `:307-317`; `LIVE/components/admin/orders-table.tsx:209-215` | "ENVÍO ESTÁNDAR GRATIS" / "ENVÍO POR COORDINAR CON CLIENTA" / "Gratis" | Umbral guardado al crear el pedido |
| L13 | Otras políticas | `LIVE/app/terminos/page.tsx:74-77` (remite a /envios); `LIVE/app/devoluciones/page.tsx:81-88`, `:109-111` y `LIVE/app/garantia/page.tsx:65-68` (Radaelli paga el envío de devoluciones y garantías cubiertas). No mencionan el umbral | Siempre |

### 3.3 Diferencias entre el theme y el sitio real que importan para la recomendación

- **D1: qué significa umbral 0.**
  - En el real, 0 **no** apaga la promesa. El banner y la ficha la muestran siempre (L1, L2) y `qualifiesForFreeShipping` da gratis a **todo** pedido (`pricing.ts:45` con `>=`); el admin permite 0 (`settings-actions.ts:650`). Solo el drawer se oculta (`cart-drawer.tsx:55`).
  - En el theme, 0 **oculta** T1, T2a y T4 (`promo-banner.liquid:23`, `main-product.liquid:286`, `cart-free-shipping.liquid:17`).
  - Por eso, usar 0 como "apagado" es una convención **solo del theme**. Hay que documentarlo para que nadie lo lea como "envío gratis para todo" en Shopify.
- **D2: la barra del carrito.** En el real está siempre encendida (L3); en el theme está apagada por defecto (`REP/cart-report.md:321`).
- **D3: qué monto se compara en el carrito.** El drawer real compara el subtotal **sin** cupón (`cart-drawer.tsx:59`). El theme usa `cart.total_price`, que ya incluye los descuentos de carrito (`cart-free-shipping.liquid:23-24`). El checkout real sí descuenta el cupón (`checkout-content.tsx:206-210`; `app/envios/page.tsx:162-164`). Cómo evalúa la tarifa de Shopify este punto es **NOT_AVAILABLE**: hay que verificarlo al configurarla.
- **D4: tiempos de entrega.** En el real están en el código (L9, L10). En Shopify salen de las tarifas del Admin, que hoy no existen para Colombia.
- **D5: la frase "se informa antes del despacho".** En el real está respaldada por un flujo real: fila "Por confirmar" (`cost-summary.tsx:38`), aviso "Envío por coordinar" (`shipping-notice.tsx:27-31`) y contacto posterior (`app/envios/page.tsx:66-73`). En el Dev Store no hay ninguna tarifa que implemente ese modelo (§ 1). El theme no puede leer las tarifas (`REP/cart-report.md:150`; `TS/config/settings_schema.json:192`).

---

## 4. Recomendación: el cambio mínimo y reversible

### 4.1 Cambio propuesto: solo configuración, 0 líneas de Liquid

| # | Archivo:línea | Hoy | Propuesto | Efecto según el Liquid exacto |
|---|---|---|---|---|
| C1 | `TS/config/settings_data.json:25` | `"free_shipping_threshold": 299900` | `"free_shipping_threshold": 0` | `promo-banner.liquid:23`: `0 > 0` es falso, así que no se imprime el `<p class="section-promo__fine-print">` (`:26-31`) ni su link. El título "20% de descuento…" y el CTA siguen. `main-product.liquid:286`: falso, así que desaparece la frase "Envío gratis en compras desde…" (`:289`). `cart-free-shipping.liquid:17`: `threshold_cents` = 0, segundo cerrojo sobre T4. `cart-summary.liquid:31` no cambia. |
| C2 | `TS/templates/product.json:26` (bloque `shipping`, campo `content`) | "Por debajo de ese monto, el valor del envío se informa antes del despacho, según tu destino. Garantía de 12 meses por defectos de fabricación o calidad." | "Garantía de 12 meses por defectos de fabricación o calidad." (se quita la primera frase; no se agrega texto nuevo) | Sin C2, `main-product.liquid:291` seguiría imprimiendo "Por debajo de **ese monto**…" sin monto previo, y seguiría prometiendo que el envío "se informa antes del despacho", algo que Shopify no tiene configurado. Con C2, el acordeón muestra solo la garantía más los links de política, si existen (T3). |
| C3 | `TS/config/settings_data.json:24` | `"cart_free_shipping_progress": false` | **sin cambio** | Se mantiene el apagado de T4. |

Notas:
- **Por qué 0 y no dejarlo vacío:** el tipo `number` de `settings_schema.json:194-200` no define `min`, así que 0 es un valor válido y explícito. Vacío probablemente se comporte igual en Liquid, porque `nil > 0` es falso, pero es menos claro y no se verificó en la tienda.
- **Por qué no desactivar la sección o el bloque** (`"disabled": true` o el ojo del editor):
  - desactivar el `promo-banner` saca también el titular y el CTA;
  - desactivar el bloque `shipping` saca también la garantía y los links de políticas;
  - C1 y C2 cambian solo lo que promete envío.
- **Por qué no cambiar el Liquid ahora:** requiere un RC nuevo, Theme Check y la regresión. Queda como alternativa en § 5.

### 4.2 Qué verificar después del cambio (en el preview de RC1.3, sin publicar)

1. **Home:** `.section-promo__fine-print` no existe en el DOM, y el titular y el CTA siguen.
2. **Una ficha** (hay 29 productos, `REP/03C-catalog-import-report.md:6`): al abrir "Envíos, devoluciones y garantía" se lee solo "Garantía de 12 meses por defectos de fabricación o calidad." y, si hay políticas nativas, los links.
3. **Carrito con 1 ítem:** no aparece `.cart-free-shipping`, y sí "El envío se confirma en el checkout.".
4. **`/en`:** lo mismo que en español.
5. **Theme Check:** 0/0.
6. **Regresión offline:** la suite con Liquid real (45/45 en `REP/03C-catalog-import-report.md:158`) vive en el scratchpad de fases anteriores, fuera del repo (`REP/product-page-report.md:75`). Su ubicación exacta es **NOT_AVAILABLE** en el worktree. Hay que volver a correrla, porque alguna aserción podría esperar la letra chica del banner o de la ficha.

### 4.3 Dónde aplicarlo: en `theme-src` y push, no solo en el editor

- Los push al theme no publicado se hacen desde `theme-src` con `shopify theme push --theme 189072474431 --strict --path <theme-src> --ignore README.md` (`REP/03A-development-store-upload-report.md:61-62`). Ese comando sube `config/settings_data.json` y `templates/product.json`.
- Si C1 y C2 se hacen **solo en el Theme Editor**, el próximo push los **pisa**: el banner y la ficha vuelven a prometer $299.900.
- El plan del proyecto es versionar `settings_data.json` junto al theme (`REP/implementation-roadmap.md:9`).
- **Recomendación:** aplicar C1 y C2 en `theme-src`, empaquetarlo como RC nuevo o re-push al id `189072474431`, sin `--live` ni `--publish`, y documentarlo en el reporte de la fase.
- Si Daniela ya cambió algo a mano en el editor (§ 1, NOT_AVAILABLE), hay que hacer `theme pull` **antes** del push para no perder sus cambios.
- **Contradicción a corregir:** `REP/pre-development-store-checklist.md:28` indica configurar "umbral en 299900" en el editor. Hay que actualizarlo a "0 hasta que exista la tarifa".

### 4.4 Cómo volver a la paridad para el lanzamiento

Los valores originales quedan registrados en este documento y en el propio theme:
- el default del esquema es `299900` (`TS/config/settings_schema.json:198`);
- la ayuda dice "Valor real actual: 299900" (`:199`);
- el texto original de C2 está copiado arriba.

Orden sugerido:
1. **Decisión de negocio (NOT_AVAILABLE):** cómo modelar en Shopify las compras por debajo del umbral. El real no cobra el envío en el pago y lo coordina después (`LIVE/components/checkout/cost-summary.tsx:38`, `shipping-notice.tsx:27-31`, `app/envios/page.tsx:66-73`). No se propone una tarifa; es decisión de la dueña.
2. Configurar las tarifas de Colombia en el Admin de Shopify, con una tarifa **gratis condicionada a ≥ $299.900 COP**. Verificar con un checkout de prueba que:
   - un pedido de 299.900 o más da envío gratis y uno de menos no (el real usa `>=`, `pricing.ts:45`);
   - el criterio con cupón coincide con el del real (`app/envios/page.tsx:162-164`; ver D3).
3. Revertir C1 (`free_shipping_threshold: 0 → 299900`) y C2 (restaurar el texto original de `product.json:26`). Push desde `theme-src`.
4. Recién después de verificar el checkout, encender `cart_free_shipping_progress` (`REP/cart-report.md:331`; ayuda en `TS/config/settings_schema.json:192`).
5. Cargar la política de envíos en Shopify con el mismo umbral y los mismos tiempos que el real (`LIVE/app/envios/page.tsx:34-41`, `:53-54`), porque el theme no tiene la plantilla dinámica `page.envios` (T9). Esa política va a ser texto estático, así que hay que actualizarla a mano si cambia el umbral.
6. Opcional: alinear el copy en inglés de "over" a "from" (`TS/locales/en.json:80`) para que signifique ≥, como en español y en el real.

---

## 5. Alternativa con código (no recomendada para ahora)

Hacer que T1 (`promo-banner.liquid:23`) y T2a (`main-product.liquid:286`) dependan del **mismo** interruptor `settings.cart_free_shipping_progress`, que pasaría a significar "Shopify tiene la tarifa gratis configurada", y agregarles la guarda de moneda de `cart-free-shipping.liquid:17`.

- **A favor:**
  - un solo interruptor para las tres promesas;
  - el umbral se queda en 299900;
  - se cierra el riesgo del mercado EE. UU. del § 2.
- **En contra:**
  - cambia el Liquid y la semántica de un setting (label e info en `settings_schema.json:190-192`), así que requiere un RC nuevo, Theme Check y la regresión;
  - **igual necesita C2**, o una condición nueva sobre `block.settings.content`, porque la frase "Por debajo de ese monto…" se imprime siempre (`main-product.liquid:291`).

Tiene sentido considerarla antes del lanzamiento, no como parche de hoy.

---

## 6. Riesgos y pendientes

- **R1.** Mientras C1 y C2 no se apliquen, cualquier persona con acceso al preview ve promesas de envío que el checkout de Shopify no respalda (T1, T2a, T2b). El theme no está publicado y el preview requiere sesión en el Admin (`REP/03A-development-store-upload-report.md:76-78`), así que por ahora el riesgo queda limitado al staff.
- **R2.** Si C1 y C2 se hacen solo en el editor, un push desde `theme-src` los revierte (§ 4.3).
- **R3.** El 0 del theme significa "oculto", no "gratis para todo" como en el real (D1). Si alguien lo interpreta al revés, al lanzar podría faltar la promesa o prometerse envío gratis para todo.
- **R4.** El theme no tiene plantilla dinámica `page.envios` (T9). La política de Shopify va a ser texto fijo y puede desincronizarse del umbral.
- **R5.** No hay guarda de moneda en T1 y T2 con el mercado EE. UU. activo (§ 2). La moneda de ese mercado es NOT_AVAILABLE.
- **R6.** No se pudo verificar: el estado remoto actual del editor, las políticas nativas cargadas, el valor real del umbral en la base de producción y la ubicación de la suite de regresión offline. Todo es **NOT_AVAILABLE**.
- **Secretos:** en esta auditoría no se abrieron `.env` ni valores sensibles.
