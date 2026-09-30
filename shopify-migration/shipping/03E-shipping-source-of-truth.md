# 03E — Fuente de verdad del envío (sitio real → Shopify)

- **Fecha:** 2026-09-29. **Modo:** solo lectura.
  - No se tocó el Dev Store, la base de datos, `theme-src`, `app/`, `catalog/`, `import/` ni `dist/`.
  - No se abrieron archivos `.env*`.
  - Único archivo escrito: este.
- **Abreviaturas de rutas:**
  - `LIVE/` = `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/` (sitio real en Next.js);
  - `MIG/` = `…/.claude/worktrees/shopify-migration-prep/shopify-migration/`;
  - `TS/` = `MIG/theme-src/`.
- **Alcance de la búsqueda:**
  - `LIVE/app`, `components`, `lib` (incluido `lib/checkout/*`), `prisma/schema.prisma`, las 42 migraciones, `prisma/seed.ts`, `scripts/`, `docs/` y `tests/`;
  - el historial git de los archivos de envío;
  - en `MIG/`: `source-of-truth/`, `catalog/`, `import/`, `content/legal/` y los reportes `theme/*.md`.

---

## 0. Conclusión

> **Tarifa real por debajo del umbral: NO ENCONTRADA.**
> - `below_threshold_rate = NOT_SET`
> - `free_shipping_rate_confirmed = false` (se mantiene; `TS/config/settings_data.json:24`)

| Qué | Estado | Valor / motivo |
|---|---|---|
| Umbral de envío gratis | **ENCONTRADO** | **299.900 COP** (`LIVE/prisma/schema.prisma:1142`, `LIVE/lib/checkout/pricing.ts:6`). Confirmado en el HTML en vivo de `/envios` (`MIG/content/legal/envios.html:1`: "$ 299.900 COP") |
| Regla | **ENCONTRADA** | `subtotal - descuento >= umbral` (`LIVE/lib/checkout/pricing.ts:45`): **≥**, sobre el subtotal **con el cupón ya restado** |
| Tarifa por debajo del umbral | **NO ENCONTRADA** | El sitio real **nunca cobra envío**: `shippingCost: 0` en todo pedido (`LIVE/lib/orders/order-creation-core.ts:271`). Por debajo del umbral el envío queda "Por confirmar / por coordinar" y se cotiza a mano después de la compra. No existe tarifario (`LIVE/lib/checkout/shipping-methods.ts:3-7`; el tipo `ShippingMethod` no tiene campo de precio, `LIVE/lib/checkout/types.ts:6-11`) |
| Precio de Express | **NO ENCONTRADO** | Solo existe su tiempo de entrega (24 a 48 h). No tiene precio desde el 2026-09-14 (§ 1.7) |
| Transportadora | **ENCONTRADA** | **Envia**, "transportadora principal a nivel nacional" (`LIVE/app/envios/page.tsx:49-50`) |
| Tiempos | **ENCONTRADOS** | Estándar **3 a 5 días hábiles**. Express **24 a 48 horas, solo ciudades principales** (`LIVE/app/envios/page.tsx:53-54`) |
| Zonas | **ENCONTRADO (solo país)** | "dentro de Colombia" (`LIVE/app/envios/page.tsx:34-36`). No hay excepciones regionales vigentes; la lista de municipios apartados es histórica y fue retirada (§ 1.7) |
| Pesos de producto | **NO EXISTEN** | Ni en Prisma (§ 1.6) ni en el CSV de importación (22 columnas, ninguna de peso) |

**Por qué no hay tarifa y no se puede deducir:**
- El modelo del sitio real es "gratis desde 299.900, y por debajo **se cotiza por pedido**".
- Lo más parecido a un dato de costo es `Order.quotedShippingCost` (`LIVE/prisma/schema.prisma:491`). Pero es:
  - un monto que la dueña carga **a mano por pedido**;
  - "no un monto que participe en `total`" (`:487-490`);
  - un valor cuyas filas reales son **NOT_AVAILABLE**, porque no se consultó la base.

  Aunque existieran, serían cotizaciones sueltas de Envia por destino, no una tarifa. **Convertirlas en tarifa es una decisión de negocio (D2, § 5.1).**

---

## 1. Hallazgos con archivo:línea y valor exacto

### 1.1 Umbral y regla

| # | Archivo:línea | Valor exacto |
|---|---|---|
| U1 | `LIVE/prisma/schema.prisma:1137-1142` | `freeShippingThreshold Int @default(299900)`. Comentario: "sobre el subtotal de productos ya con el cupón aplicado… no hay tarifario de envío por ciudad todavía" |
| U2 | `LIVE/prisma/migrations/20260915000454_add_free_shipping_threshold/migration.sql:2` | `ADD COLUMN "freeShippingThreshold" INTEGER NOT NULL DEFAULT 299900` |
| U3 | `LIVE/lib/checkout/pricing.ts:6` | `export const DEFAULT_FREE_SHIPPING_THRESHOLD = 299900;` |
| U4 | `LIVE/lib/checkout/pricing.ts:40-46` | `qualifiesForFreeShipping(subtotal, discount, threshold)` devuelve `subtotal - discount >= freeShippingThreshold` |
| U5 | `LIVE/lib/checkout/pricing.ts:36-39` | El `subtotal` **ya incluye** el descuento automático de producto, categoría o sitio; `discount` es **solo el cupón** |
| U6 | `LIVE/lib/checkout/pricing.test.ts:12-44` | Casos que fijan la frontera:<br>- 299.899 → por coordinar;<br>- 299.900 → gratis;<br>- 310.000 − 15.000 → no califica;<br>- 310.000 − 10.100 = 299.900 → **sí** califica |
| U7 | `LIVE/lib/checkout/free-shipping-actions.ts:13-26` | Lee `Settings.freeShippingThreshold`. Si la fila no existe o la lectura falla, usa 299900 |
| U8 | `LIVE/lib/currency/settings-actions.ts:638-650` | El admin puede editar el umbral; acepta `>= 0` |
| U9 | `LIVE/components/checkout/checkout-content.tsx:135`, `:161-164`, `:206-210` | Default 299900; el checkout evalúa con `subtotal` y `discount` del cupón |
| U10 | `LIVE/lib/orders/order-creation-core.ts:259`, `:281` | El umbral vigente se congela en `Order.freeShippingThresholdSnapshot` (`schema.prisma:475`) |
| U11 | `MIG/content/legal/envios.html:1` (texto verbatim del `/envios` en vivo, 2026-09-29) | "iguales o superiores a $ 299.900 COP" y "ya con el cupón aplicado, si usaste uno) alcanza $ 299.900" |
| U12 | Valor en la base de producción | **NOT_AVAILABLE** (no se consultó). El HTML en vivo (U11) confirma 299.900 |

### 1.2 Por debajo del umbral: lógica de "envío por coordinar"

| # | Archivo:línea | Valor exacto / comportamiento |
|---|---|---|
| C1 | `LIVE/lib/orders/order-creation-core.ts:271` | `shippingCost: 0`: **todo** pedido se crea sin costo de envío |
| C2 | `LIVE/prisma/schema.prisma:427`, `:487-491` | `shippingCost Int // centavos`, "hoy siempre 0: el sitio no cobra envío". `quotedShippingCost Int?` es un dato "operativo informativo" |
| C3 | `LIVE/lib/checkout/pricing.ts:18-24` | "El envío tampoco se cobra acá: sin tarifario por ciudad" |
| C4 | `LIVE/components/checkout/cost-summary.tsx:38`, `:48`, `:52-54` | Fila "Envío" = `"Gratis"` o `"Por confirmar"`. Total = `"Total"` o `"Total productos"`. Nota: "El valor del envío se informa antes del despacho, según el destino" |
| C5 | `LIVE/components/checkout/shipping-notice.tsx:17-19`, `:27-35` | Si califica: "Envío estándar gratis… dentro de Colombia". Si no: "Envío por coordinar. El costo del envío no está incluido en este pago… nos comunicaremos contigo para cotizar y coordinar" |
| C6 | `LIVE/app/envios/page.tsx:64-72` | Por debajo de {umbral}: "nuestro equipo te contacta después de confirmada la compra… cuando corresponda, ese pago puede hacerse directamente a la transportadora al momento de la entrega o despacho" |
| C7 | `LIVE/lib/email/templates.ts:261`, `:354`, `:444-445` | Correo al admin: `"GRATIS"` / `"POR COORDINAR CON CLIENTA"`. Correo a la clienta: `"Gratis"` / `"Por coordinar"` + "Te contactaremos pronto para cotizar y coordinar el despacho según tu ciudad" |
| C8 | `LIVE/components/admin/order-detail.tsx:313`, `:317`; `LIVE/components/admin/orders-table.tsx:209-216` | "ENVÍO ESTÁNDAR GRATIS" / "ENVÍO POR COORDINAR CON CLIENTA" / "Gratis" / "Por coordinar" |
| C9 | `LIVE/lib/admin/orders-actions.ts:266-274`, `:307-320`; `LIVE/components/admin/order-detail.tsx:384-397` | "Costo de envío cotizado (COP, opcional)", cargado a mano por pedido. "No integra ninguna transportadora ni cobra envío" |

### 1.3 Métodos, tiempos y transportadora

| # | Archivo:línea | Valor exacto |
|---|---|---|
| M1 | `LIVE/lib/checkout/shipping-methods.ts:8-21` | Estándar: "Entrega en 3 a 5 días hábiles" / `etaLabel "3-5 días hábiles"` (`:12-13`). Express: "Entrega en 24 a 48 horas" / `"24-48 horas"` (`:18-19`). **Sin campo de precio** (`:3-7`) |
| M2 | `LIVE/components/checkout/shipping-method-selector.tsx:7-9` | El selector solo registra la **velocidad preferida**; la condición de costo vive en el resumen |
| M3 | `LIVE/prisma/schema.prisma:463`, `:532-535` | `shippingMethod ShippingMethod @default(STANDARD)`; enum `STANDARD`, `EXPRESS` |
| M4 | `LIVE/app/envios/page.tsx:49-50` | Transportadora: **Envia** |
| M5 | `LIVE/app/envios/page.tsx:53-54`, `:57-58` | Estándar: 3 a 5 días hábiles. Express: 24 a 48 horas "(disponible para ciudades principales)". La cobertura "puede variar según la zona" |
| M6 | `LIVE/app/envios/page.tsx:81-85` | Los tiempos cuentan desde el despacho y son estimados |
| M7 | `LIVE/app/envios/page.tsx:130-133` | Reenvío por dirección errada: el costo se informa antes de reenviar. Monto: **NOT_AVAILABLE** |
| M8 | `LIVE/app/devoluciones/page.tsx:80-87`; `LIVE/app/garantia/page.tsx:64-67` | El envío de devoluciones y garantías cubiertas corre por cuenta de Radaelli. No es una tarifa de venta |
| M9 | `LIVE/lib/region/config.ts:5`; `LIVE/lib/checkout/validation.ts:28` | País por defecto: "Colombia". El campo país solo exige no estar vacío |
| M10 | `LIVE/components/admin/order-detail.tsx:336` | `placeholder="Ej. Servientrega"`: es un **ejemplo de UI**, no una transportadora contratada |
| M11 | `LIVE/scripts/seed-staging-pentest.ts:515-516` | `shippingCarrier: "Servientrega"`, `trackingNumber: "PENTEST-TRACK-001"`: **fixture sintético del pentest**, no es un dato real |

**Ambigüedad de Express sobre el umbral (NOT_VERIFIED, decisión D3):**
- `cost-summary.tsx:38` muestra "Gratis" con cualquier método, porque `qualifiesForFreeShipping` no mira el método.
- En cambio, `shipping-notice.tsx:17`, `templates.ts:444` y `order-detail.tsx:313` dicen "envío **estándar** gratis".
- Hasta el 2026-09-14 el código solo daba gratis el estándar (§ 1.7, `getShippingCost` `:32`).

### 1.4 Cupones: interacción con el umbral

| # | Archivo:línea | Valor exacto |
|---|---|---|
| K1 | `LIVE/prisma/schema.prisma:1099-1116` | `Coupon`: `type` `PERCENTAGE \| FIXED`, `minSubtotal Int @default(0)` (`:1106`). **No existe cupón de envío gratis** |
| K2 | `LIVE/lib/checkout/server-order-totals.ts:105-110` | `subtotal < coupon.minSubtotal` → no aplica. Porcentaje = `round(subtotal*value/100)`. Fijo = `min(value, subtotal)` |
| K3 | `LIVE/lib/coupons/coupons-actions.ts:47-50` | Mismo mínimo, con el mensaje "Este cupón requiere un mínimo de…" |
| K4 | `LIVE/lib/checkout/pricing.ts:45` + `LIVE/app/envios/page.tsx:162-164` | El envío gratis se evalúa **después** del cupón. El umbral es `>=` |
| K5 | `LIVE/components/cart-drawer/cart-drawer.tsx:43-47`, `:59` | El drawer compara **sin** cupón (`qualifiesForFreeShipping(subtotal, 0, threshold)`), porque el cupón se aplica recién en el checkout. Diferencia ya registrada en `MIG/theme/03D-free-shipping-audit.md:215` |
| K6 | `LIVE/prisma/seed.ts:145-157` | Seed: `RADAELLI10`, PERCENTAGE 10, `minSubtotal 0`. Si existe en producción es **NOT_AVAILABLE** |

### 1.5 Promesas visibles del sitio real (para paridad)

- **Home:** "Envío gratis en compras desde {umbral}" (`LIVE/components/home/promo-banner.tsx:36-37`).
- **Ficha:** la misma frase, más "Por debajo de ese monto, el valor del envío se informa antes del despacho, según tu destino" (`LIVE/components/product-detail/product-detail.tsx:162-168`).
- **Checkout:** casilla obligatoria "He leído y acepto… Política de Envíos" (`LIVE/components/checkout/checkout-content.tsx:710-737`).

### 1.6 Pesos

| # | Dónde | Resultado |
|---|---|---|
| P1 | `LIVE/prisma/schema.prisma:211-256` (`Product`) y `:291-299` (`ProductVariant`) | Sin campo de peso. Los campos son precio, color, talla y stock, sin peso ni dimensiones |
| P2 | Grep `weight\|peso\|gram` en `LIVE/app`, `components`, `lib`, `prisma` y `scripts` | 0 coincidencias de peso de producto. Solo aparecen pesos de fuentes (`weight` en `app/layout.tsx:24`, `components/opengraph-image.tsx:59`), "peso colombiano" (moneda), peso de archivos (`lib/cloudinary/video-url.ts:4`, `components/product/gallery.tsx:18`) y falsos positivos (`monogram`, `instagram`) |
| P3 | `MIG/import/shopify-products-03c.csv` (SHA-256 `42b05500…c1f`, `MIG/import/checksums.txt:4`) | 22 columnas y **ninguna** es de peso (`Variant Grams`, `Weight` o similar). 99 filas: 98 variantes y 1 fila solo de imagen (`alba-dorada-cafe-claro`, posición 5). 29 handles |
| P4 | `MIG/import/README.md:45` | "Lo que NO se importa: Stock, **pesos**, códigos de barras…" |
| P5 | `MIG/source-of-truth/catalog-snapshot.json`, `MIG/catalog/products-master.csv`, `MIG/catalog/variants-master.csv` | Sin claves ni columnas de peso o envío |
| P6 | Mismo CSV, otras columnas | `Requires shipping = true` (98/98), `Fulfillment service = manual` (98/98), `Inventory tracker` vacío (98/98, **no rastreado**), `Continue selling when out of stock = deny` (98/98) |

**Conclusión:**
- **No hay tarifas por peso posibles.** Shopify trata un producto sin peso como sin peso ([troubleshooting](https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/troubleshooting)), así que todo carrito caería en el tramo más bajo.
- Por la misma razón, **no** conviene usar tarifas calculadas por transportadora.

### 1.7 Historial git: valores obsoletos que NO se deben usar

| Commit (fecha) | Qué había | Estado |
|---|---|---|
| `76a32f9` (2026-07-15), Sprint 10 | Plantilla original: envío con precio y gratis "sobre 100€" (`LIVE/docs/sprints/SPRINT-10.md:9`) | Obsoleto (plantilla española) |
| `a8f8359` (2026-08-24) | `FREE_SHIPPING_THRESHOLD = 100 → 210000` | Obsoleto |
| `0716e0a^` (antes del 2026-09-14): `lib/checkout/shipping-methods.ts:12`, `:19`, `:24`, `:32` | `price: 4.95` (estándar), `price: 9.95` (express), umbral 210000, gratis **solo estándar** | **No son tarifas reales:** 4.95 y 9.95 son los mismos valores de la plantilla original (`76a32f9:lib/checkout/shipping-methods.ts:12`, `:19`, con umbral `100` = "100€") y nunca se cambiaron; solo el umbral pasó a 210000 en `a8f8359`. El commit `89f2b36` documenta el mismo patrón para los precios sembrados: montos "pensados como euros" reetiquetados como COP |
| `0716e0a^`: `app/envios/page.tsx:13-21`, `:56-60` | Lista de municipios apartados con "cargo adicional": Amazonas, Chocó, Vichada, San Andrés y Providencia, Guainía, Vaupés y Putumayo. Monto: nunca definido | Retirado. **No vigente** |
| `0716e0a^`: `app/envios/page.tsx:23`, `:44-48` | `FOCUS_CITIES`: Medellín, Barranquilla, Cartagena, Santa Marta, como destinos de "mayor volumen de despachos" del envío gratis | Retirado en `0716e0a`. **No vigente** y **no** es la lista de ciudades con Express |
| `0716e0a` (2026-09-14) | Se elimina el precio del envío y se crea el umbral configurable (299.900) | Vigente |
| `bc18b0c` (2026-09-17) | Texto actual de `/envios`, aviso "por coordinar" y casilla de aceptación | Vigente (= `MIG/content/legal/envios.html`) |

### 1.8 Lo que no existe en ninguna fuente

**NOT_AVAILABLE / NOT_SET:**
- tarifa por debajo del umbral;
- precio de Express;
- lista de "ciudades principales" con Express;
- costo de reenvío;
- dirección de despacho u origen;
- razón social, NIT y dirección (`MIG/theme/03D-legal-policies-inventory.md:23`, `:66`);
- cotizaciones reales guardadas en `Order.quotedShippingCost`;
- contrato o cuenta con Envia;
- pesos.

---

## 2. Qué dice Shopify (fuentes oficiales)

| Tema | Hecho | Fuente |
|---|---|---|
| **Cómo se evalúa el monto con descuentos** | Sección "Considerations for price-based rates": el checkout elige la tarifa "based on the total value of the cart after applying discounts", antes de impuestos. **Inferencia** (la página no lo dice con estas palabras): un código de descuento puede mover el carrito a otro tramo | [help.shopify.com/…/shipping-rates/troubleshooting](https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/troubleshooting) |
| **Moneda de las tarifas** | Misma sección: la moneda de una tarifa es la de la tienda **al crearla** y "doesn't automatically update" si después cambia la moneda de la tienda. Para corregirla hay que borrar las tarifas y crearlas de nuevo | ídem |
| Tramos por monto | Tipo de tarifa **Order amount**, con **Minimum**, **Maximum** y **Price** por tramo. Una opción con **Offer free shipping** y monto mínimo | [setting-up-shipping-rates](https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/setting-up-shipping-rates) |
| Precio vacío = gratis | Dejar el campo **Price** vacío o poner 0 hace la tarifa **gratis**. ⚠️ Nunca dejarlo vacío "para completar después" | ídem |
| Huecos entre tramos | Si un pedido cae fuera de todos los tramos, no aplica ninguna tarifa y la clienta ve un **error de envío** en el checkout. Recomendación oficial: el tramo más alto sin **Maximum** | ídem, "Conditional rates and free shipping coverage" |
| Si **Minimum** es inclusivo (≥) | **NOT_VERIFIED**: la página no lo dice. Hay que probarlo con un carrito de exactamente 299.900 (§ 6, T4) | — |
| País habilitado para comprar | Un país se puede elegir en el checkout solo si está en un **mercado activo** y en una **zona con tarifas** | [shipping-zones (markets)](https://help.shopify.com/en/manual/international/shipping/shipping-zones) |
| "Agotado" por falta de tarifas | El único caso documentado es el de una **app de dropshipping**: si sus productos se ven "out of stock", a la ubicación de la app "might be missing shipping rates". Que lo mismo explique el agotado de **toda** la tienda para un país sin zona es **inferencia** respaldada por la medición de 03E (§ 4), no una frase oficial | [troubleshooting](https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/troubleshooting) |
| Peso ausente | Un producto sin peso cuenta como sin peso: el carrito cae en un tramo de peso menor | ídem |
| Mercado principal | "From your Shopify admin, go to **Markets**" (menú principal del Admin, **no** dentro de Settings) > (mercado) > **More actions > Make primary market** > Save. Solo mercados de una región y sin subcarpetas. El mercado principal no se puede borrar | [managing-markets](https://help.shopify.com/en/manual/markets/getting-started/managing-markets) |
| Desactivar vs. borrar un mercado | Pasar a **Draft** conserva la configuración y es reversible. **Delete** es permanente | ídem |
| Alternativa: descuento de envío gratis | El mínimo de compra cuenta solo productos, **a su precio ya descontado**. Se puede limitar por país | [free-shipping discounts](https://help.shopify.com/en/manual/discounts/discount-types/free-shipping) |
| Dirección de la sucursal | Settings > Locations > (sucursal) > Address. La sucursal debe tener activo el cumplimiento de pedidos online | [setting-up-your-locations](https://help.shopify.com/en/manual/locations/setting-up-your-locations), [troubleshooting](https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/troubleshooting) |

---

## 3. Equivalencia de la regla con cupón: sitio real vs. Shopify

**Las dos reglas son equivalentes:**
- **Real:** `subtotal (con descuento automático) − cupón >= 299.900` (`pricing.ts:45`).
- **Shopify:** el valor del carrito después de descuentos, antes de impuestos (§ 2). La frase oficial está escrita para las tarifas **por monto** (Forma B). Para la Forma A (tarifa plana con "Offer free shipping"), la página no dice sobre qué valor se mide el monto mínimo: **NOT_VERIFIED**, lo cubren T3 a T5 (§ 6).
- El −20% del sitio está **dentro del `Price`** del producto, con `Compare-at` como tachado (`MIG/import/README.md`, fila `Price`/`Compare-at price`). No es un descuento de Shopify, así que **no se resta dos veces**. Esto ya se midió en 03E: `total_discount` = 0 (`MIG/theme/03E-checkout-baseline-report.md:17-18`).

**Consecuencia práctica con los precios importados** (`Price` de `MIG/import/shopify-products-03c.csv`: 159.920 / 167.920 / 183.920 / 199.920):
- **Toda compra de 1 unidad queda por debajo del umbral:** el máximo es 199.920 < 299.900. Sin tarifa por debajo, **ninguna compra de 1 prenda puede pagarse** en Shopify.
- **Toda compra de 2 o más unidades sin cupón califica:** el mínimo es 2 × 159.920 = 319.840.
- **Un cupón puede sacar del gratis a un carrito de 2 unidades:**
  - si descuenta más de 19.940 sobre 319.840 (≈ 6,23 %);
  - o más de 99.940 sobre 399.840 (≈ 25 %).
  - Ejemplo: 10 % sobre 2 × 159.920 = 287.856 → **no** es gratis, ni en el sitio real ni en Shopify.
- **La frontera exacta (299.900) solo se alcanza con cupón.** Por ejemplo, un cupón fijo de 19.940 sobre 319.840. Es el único modo de probar el `>=` (§ 6, T4).
- **Barra del carrito del theme:** usa `cart.total_price`, que ya incluye los descuentos del carrito (`TS/snippets/cart-free-shipping.liquid:25-31`). Coincide con Shopify, no con el drawer real, que compara sin cupón (K5). Es una diferencia menor y a favor de la exactitud.

---

## 4. Por qué hoy todo figura agotado en Colombia (hecho 2)

1. **Medido en 03E, con la sesión en CO:**
   - 0/29 productos disponibles;
   - `/cart/add.js` responde **422**;
   - en el Admin, el único perfil tiene **una sola zona, "Domestic – Estados Unidos"**, y la sucursal "Shop location" está en EE. UU.

   Fuente: `MIG/theme/03E-checkout-baseline-report.md:39-49`.
2. **No es stock.** El inventario **no se rastrea** según el CSV importado (P6: `Inventory tracker` vacío en 98/98; el estado actual en el Admin no se re-midió). Sin rastreo, Shopify no marca agotado por cantidad. Con la sesión en US, el mismo producto que en CO dio 422 se agregó al carrito y abrió el checkout (`03E-checkout-baseline-report.md:14-15`), y el QA de 03C/03D, que corrió en US, no vio agotados (`:50`). Un conteo 29/29 disponibles con sesión US **no** está en ese reporte.
3. **Es envío.** Los productos exigen envío (`Requires shipping = true`, 98/98), y para Colombia no hay zona ni tarifa desde ninguna sucursal. Shopify exige mercado activo **más** zona con tarifas para que el país se pueda elegir en el checkout (§ 2). Que la falta de zona se vea como "agotado" en la tienda es lo que midió 03E; la documentación oficial solo lo describe para el caso de dropshipping (§ 2).
4. **El mercado principal US es un problema aparte.** Explica por qué un visitante colombiano resuelve a US y el checkout abre en `es-US` (hecho 1). No causa el "agotado" en CO, pero hay que corregirlo en la misma sesión.

**Orden exacto de arreglo:** § 5.3.

---

## 5. Preparación del perfil de envío

### 5.1 Decisiones de la dueña (antes de tocar el Admin)

| # | Decisión | Estado | Por qué importa |
|---|---|---|---|
| D1 | Dirección real de despacho (sucursal) y dirección de la tienda | **NOT_AVAILABLE** | Origen del envío, de las etiquetas y de las devoluciones. Hoy está en EE. UU. |
| D2 | **Qué cobra Shopify por debajo de 299.900** | **NOT_SET** | Sin esta tarifa, **ninguna compra de 1 prenda puede pagarse** (§ 3), aun después de activar un proveedor de pagos (hoy no hay ninguno, hecho 3). Opciones en § 5.4 |
| D3 | Express: ¿se ofrece? ¿a qué precio? ¿es gratis desde 299.900 o solo el estándar? | **NOT_SET** | El sitio real lo ofrece sin precio, solo en ciudades principales, y la regla sobre el umbral es ambigua (§ 1.3) |
| D4 | Qué hacer con Estados Unidos: mercado y zona "Domestic" | Recomendado: **mercado en Draft + borrar la zona** | El sitio real vende solo en Colombia (M9, `envios.html:1`). Las tarifas US son las de fábrica: Standard 8,00, Express 15,00, "gratis a partir de 70,00" (`03E-checkout-baseline-report.md:47`). Su moneda en el Admin es **NOT_VERIFIED**. La tienda se creó en USD y luego pasó a COP (`03B-store-foundation-report.md:86-91`), y Shopify documenta que la moneda de una tarifa no se actualiza sola al cambiar la de la tienda (§ 2): lo más probable es que sigan en USD. Si estuvieran en COP, cualquier pedido US de más de COP 70 viajaría gratis. En ambos casos: **no reutilizarlas ni editarlas para Colombia**; borrarlas, o dejarlas inertes con el mercado US en Draft |
| D5 | Aprobar y publicar la política de envíos (`MIG/content/legal/envios.html`) | Pendiente (owner-only) | Su texto dice que el costo "no queda incluido en el pago". Si D2 es una tarifa cobrada en el checkout, **ese texto deja de ser cierto** y hay que ajustarlo antes de publicarlo (§ 7) |

### 5.2 Estructura objetivo en Shopify

```
Mercados (Markets: menú principal del Admin, no dentro de Configuración)
  Colombia ............ ACTIVO · PRINCIPAL (Make primary market) · moneda COP
  Estados Unidos ...... DRAFT (recomendado; reversible) — no "Delete"

Configuración > Sucursales (Locations)
  "Shop location" ..... dirección en Colombia = D1 (NOT_AVAILABLE)
                        "cumplir pedidos online" = activo

Configuración > Envío y entrega > Perfiles de envío > General (perfil general)
  Productos ........... los 29 (verificar el conteo)
  Envío desde ......... la sucursal de arriba
  Zona "Colombia"  (Regiones: Colombia, todos los departamentos)
    Opción "Envío estándar"   · tránsito personalizado "3-5 días hábiles"
      Forma A (preferida: no deja huecos):
        Tipo de tarifa: Plana (Flat)
        Precio: <D2 — NOT_SET>        ⚠ no dejar vacío: vacío = gratis
        Ofrecer envío gratis: SÍ · monto mínimo 299.900 COP
      Forma B (equivalente con tramos):
        Tipo de tarifa: Monto del pedido (Order amount)
        Tramo 1: Mín 0       · Máx 299.899,99 · Precio <D2 — NOT_SET>
        Tramo 2: Mín 299.900 · Máx (vacío)    · Precio 0
    Opción "Envío express"    · solo si D3 lo define (precio NOT_SET); si no, NO crearla
  Zona "Domestic – Estados Unidos" → borrar (D4) o dejar inerte con el mercado en Draft
  Tarifas por peso ........ NO (no hay pesos: § 1.6)
  Tarifas de transportadora NO (sin pesos; disponibilidad para CO = NOT_VERIFIED)
```

**Notas:**
- **Forma A vs. B:** con la A no hay monto que caiga entre tramos. Con la B, `Máx 299.899,99` evita el hueco que un cupón porcentual con centavos podría crear, si se usara `299.899`.
- **Nombres de la UI en español:** "Tipo de tarifa", "Ofrecer envío gratis", "Monto del pedido" y similares son **NOT_VERIFIED**. Los nombres en inglés son los de la documentación oficial (§ 2).
- **Moneda:** las tarifas se cargan en COP, la moneda de la tienda (`MIG/theme/03B-store-foundation-report.md:88-96`). Como la moneda de una tarifa queda fijada al crearla (§ 2), hay que **confirmar que la tienda está en COP antes de crear** la zona Colombia; la Forma A/B se crea nueva, nunca editando las tarifas US existentes.

### 5.3 Orden exacto de arreglo (sin pagos: el proveedor sigue inactivo, hecho 3)

1. **Sucursal a Colombia.**
   - Ruta: Configuración > Sucursales > "Shop location" > Dirección → D1.
   - Confirmar que siga activo "cumplir pedidos online".
2. **Mercados.**
   - Admin > **Mercados** (menú principal; la guía oficial dice "go to Markets", no Configuración) > Colombia > Más acciones > **Convertir en mercado principal** (Make primary market) > Guardar. El nombre exacto en español es NOT_VERIFIED.
   - Después, Estados Unidos > estado **Draft** (D4).
   - Confirmar en Configuración > General que la moneda de la tienda sigue en COP (antes del paso 4, § 5.2 "Moneda").
3. **Perfil general.**
   - Configuración > Envío y entrega > General.
   - Verificar que incluye los 29 productos y la sucursal del paso 1.
4. **Zona Colombia.**
   - Agregar zona "Colombia" (país completo).
   - Agregar la opción "Envío estándar" con la **Forma A o B** (§ 5.2), **una vez decidida D2**.
   - Express solo si D3 está decidida.
5. **Zona US.** Borrar "Domestic – Estados Unidos" (D4), o dejarla inerte si la dueña prefiere conservarla.
6. **Re-medir el storefront** con una sesión CO (lo puede hacer Claude, en solo lectura):
   - `Shopify.country = CO`;
   - `/products/<handle>.js` con `available: true`;
   - `/cart/add.js` responde 200.
7. **Checkout sin pagar:** § 6, T1 a T6.
8. **Recién después:**
   - encender `free_shipping_rate_confirmed` (Ajustes del tema > Envío gratis). **Hacerlo en `theme-src` y pushear, o hacer `theme pull` antes del próximo push** (`MIG/theme/03D-free-shipping-audit.md:248-254`);
   - opcionalmente, `cart_free_shipping_progress`.
9. **Crear `/pages/envios`** desde `MIG/content/legal/envios.html`, con el texto ajustado según D2 (D5).

**Paso intermedio opcional, solo para el QA del Dev Store (decide la dueña):**
- **Si D2 todavía no está decidida:** en el paso 4 se puede crear solo el tramo gratis (Monto del pedido, Mín 299.900, Máx vacío, Precio 0).
- **Efecto esperado:**
  - los carritos de 2 o más prendas obtienen envío gratis;
  - los de 1 prenda reciben **error de envío** (§ 2);
  - si los productos se ven disponibles en CO con una zona que solo cubre ≥ 299.900 es **NOT_VERIFIED**.
- **Límites:** no se puede lanzar así, y `free_shipping_rate_confirmed` sigue en **false**.

### 5.4 Opciones para D2 (sin valores: los decide la dueña)

| Opción | Cómo se ve en Shopify | Coherencia con el sitio real | Riesgos |
|---|---|---|---|
| **A. Tarifa plana pagada** | "Envío estándar $X" por debajo del umbral; gratis desde 299.900 | Cambia el modelo: el envío se cobra en el checkout, no "por coordinar" | Hay que reescribir `threshold_note` y `/envios` (§ 7). X = **NOT_SET** |
| **B. Tarifa en 0 con un nombre como "Envío por coordinar"** | Precio 0 por debajo del umbral; se cotiza después, como hoy | Replica el flujo real (C1-C6) | El checkout mostraría el envío como **gratis** junto a "por coordinar" (**NOT_VERIFIED**: probar). Contradice la promesa "gratis desde 299.900". El cobro queda fuera de Shopify |
| **C. Tarifa calculada por transportadora o app** | Precio por destino | Similar a "según tu ciudad" | Exige pesos (no existen), plan o app. Disponibilidad de Envia para Colombia en Shopify: **NOT_VERIFIED** |

---

## 6. Checklist de la dueña en el Admin y pruebas de aceptación

**Configuración (Admin `https://admin.shopify.com/store/radaelli-swimwear-dev`):**

- [ ] Decidir D1 a D5 (§ 5.1).
- [ ] `Settings > Locations` (Configuración > Sucursales) → "Shop location" → Address = dirección de despacho en Colombia; cumplimiento online activo.
- [ ] `Settings > General` (Configuración > General) → dirección de la tienda en Colombia; moneda COP.
- [ ] `Markets` (Mercados, en el menú principal del Admin) → Colombia → More actions → **Make primary market** → Save.
- [ ] `Markets` → Estados Unidos → estado **Draft**. No usar Delete, porque es permanente.
- [ ] `Settings > Shipping and delivery` (Configuración > Envío y entrega) → General → verificar 29 productos y la sucursal.
- [ ] Mismo lugar → **Add zone** "Colombia" → **Add shipping option** "Envío estándar", con la Forma A o B y tránsito "3-5 días hábiles". El precio por debajo del umbral **nunca vacío**.
- [ ] Opcional: "Envío express" (solo con D3 decidida).
- [ ] Borrar la zona "Domestic – Estados Unidos" (D4) → Save.
- [ ] Avisarle a Claude para la re-medición del storefront en CO (§ 5.3, paso 6).

**Pruebas de checkout, sin pagar:**
- Hoy no es posible pagar porque no hay proveedor activo (hecho 3).
- Los códigos de prueba los crea la dueña en `Discounts` y se **borran al terminar**.
- Direcciones de prueba: solo las que ponga la dueña. Claude no escribe datos en el checkout.

| # | Carrito | Valor tras descuentos | Esperado |
|---|---|---|---|
| T1 | 1 × producto de 199.920 | 199.920 | Tarifa D2 (no gratis). Con el paso intermedio: error de envío |
| T2 | 2 × 159.920 | 319.840 | Envío estándar **gratis** |
| T3 | T2 + código del 10 % | 287.856 | **No** gratis (igual que el sitio real: `pricing.test.ts:33-37`) |
| T4 | T2 + código fijo de 19.940 | **299.900** | **Gratis**: confirma que el mínimo es `>=` (igual que el real: `pricing.test.ts:42-44`) |
| T5 | T2 + código fijo de 19.941 | 299.899 | **No** gratis, y **sin error** de envío (no hay hueco entre tramos) |
| T6 | Cualquiera, sesión CO | — | Checkout en `es-CO`, país Colombia, departamentos y formato "$ 299.900" |

**Si T4 da "no gratis":** el mínimo de Shopify es estricto (>). Entonces hay que bajar el mínimo al valor inmediatamente inferior (p. ej., 299.899,99) para conservar la regla `>=` del sitio real.

---

## 7. Dependencias en el theme y en el contenido

- **`TS/config/settings_data.json:24`:** `free_shipping_rate_confirmed: false`. **Se mantiene** hasta que T1 a T5 pasen.
- **`TS/templates/product.json:26`, `threshold_note`:** "Por debajo de ese monto, el valor del envío se informa antes del despacho, según tu destino".
  - Es verdad con D2 = B (por coordinar).
  - Es **falso** con D2 = A (tarifa cobrada en el checkout): habría que cambiarlo antes de encender el cerrojo.
- **`MIG/content/legal/envios.html:1`:** "El costo del transporte no queda incluido en el pago del pedido…". Tiene la misma dependencia de D2. Además dice "Envío express: 24 a 48 horas", que solo es cierto si D3 crea la opción Express.
- **`TS/locales/en.json:80`:** "Free shipping on orders **over** {{ amount }}", que se lee como `>`. La regla real es `>=`; el español dice "desde" (`TS/locales/es.default.json:80`). Es un defecto menor de copy, ya anotado en `03D-free-shipping-audit.md:141`, y **sigue presente**. Se usa en `TS/sections/promo-banner.liquid:32` y `TS/sections/main-product.liquid:294`, solo en `/en` y solo con el cerrojo encendido. Arreglo mínimo: "Free shipping on orders of {{ amount }} or more."
- **Barra del carrito:** `TS/snippets/cart-free-shipping.liquid:19` exige el cerrojo, `cart_free_shipping_progress` y la moneda base. Con Colombia como mercado principal, la moneda del carrito para CO es COP y el guard se cumple. El "ya tienes envío gratis" sale con `remaining_cents <= 0` (`:31`), o sea `>=`, igual que la regla real.
- **Enlaces a la política de envíos (depende de D5):**
  - La ficha enlaza `shop.shipping_policy.url | default: block.settings.shipping_url` (`TS/sections/main-product.liquid:300`), y `shipping_url` está vacío (`TS/templates/product.json:28`).
  - El banner solo enlaza si `shipping_policy_url` tiene valor (`TS/sections/promo-banner.liquid:33`), y `TS/templates/index.json:64-69` no lo define.
  - Si D5 crea `/pages/envios` como **página** (así la enlazan los textos migrados, `MIG/content/legal/manifest.json`), ninguno de los dos enlaces aparece hasta poner `/pages/envios` en esos dos ajustes (en `theme-src` más push). Si en cambio se carga como política de envío en Configuración > Políticas, la ficha la toma sola, pero el banner igual necesita su ajuste.

---

## 8. Fuentes oficiales consultadas

- https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/troubleshooting
- https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/setting-up-shipping-rates
- https://help.shopify.com/en/manual/international/shipping/shipping-zones
- https://help.shopify.com/en/manual/markets/getting-started/managing-markets
- https://help.shopify.com/en/manual/discounts/discount-types/free-shipping
- https://help.shopify.com/en/manual/locations/setting-up-your-locations
- https://shopify.dev/docs/api/liquid/objects/cart (`cart.total_price`: "after discounts have been applied")

---

## 9. Verificación adversarial (2026-09-29)

- **Re-abiertas** todas las citas `archivo:línea` de §§ 0-7 contra `LIVE/`, `MIG/` y `TS/`, y el historial git de § 1.7. Coinciden.
- **Re-medido** el CSV de importación:
  - 22 columnas, 99 filas, 98 variantes, 29 handles;
  - `Requires shipping` true, `Fulfillment service` manual, `Inventory tracker` vacío y `Continue selling` deny en 98/98;
  - precios 159.920 (18), 167.920 (36), 183.920 (32) y 199.920 (12);
  - SHA-256 igual a `MIG/import/checksums.txt:4`.
- **Re-consultadas** las 6 páginas oficiales de § 8 y la de `cart` en shopify.dev.
- **Corregido en este archivo:**
  - la ruta de Mercados (menú principal del Admin, no Configuración);
  - la moneda de las tarifas US (regla oficial: no se actualiza al cambiar la moneda de la tienda);
  - "un código puede mover el carrito de tramo" pasó a inferencia;
  - el "agotado por falta de tarifas" quedó acotado al caso oficial (dropshipping) más la medición de 03E;
  - "29 productos disponibles con sesión US" no estaba en el reporte citado;
  - origen de 4.95/9.95 (plantilla `76a32f9`), `FOCUS_CITIES` histórico, detalle de P2 y "≈ 25 %";
  - la dependencia de los enlaces a la política de envíos (§ 7).
- **Veredicto sin cambios:** tarifa por debajo del umbral NO ENCONTRADA; `free_shipping_rate_confirmed` sigue en `false`.
