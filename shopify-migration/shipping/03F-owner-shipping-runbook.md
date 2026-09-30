# 03F — Runbook de la dueña: envío a Colombia (C2)

- **Fecha de redacción:** 2026-09-29. **Estado: NO EJECUTADO.** Este archivo solo documenta; no se tocó la tienda, el theme ni el repo.
- **Tienda:** Development Store `radaelli-swimwear-dev` (`radaelli-swimwear-dev.myshopify.com`). Admin: `https://admin.shopify.com/store/radaelli-swimwear-dev`.
- **Qué resuelve:** **C2** de `theme/03E-checkout-baseline-report.md` § 2: con país CO los 29 productos figuran **AGOTADOS** (`/cart/add.js` 422), porque el único perfil de envío tiene una zona "Domestic – Estados Unidos" y la sucursal está en EE. UU.
- **Runbook par:** `theme/03F-owner-market-colombia-runbook.md` (**C1**: mercado principal). Orden combinado en el § 2.
- **Quién hace qué:**
  - **La dueña** decide D1–D5 (§ 3) y hace los cambios en el Admin (§ 10). Claude no cambia configuración de la tienda por ella ni escribe datos en el checkout.
  - **Claude** corre los controles y el QA (§ 11) y, **solo al final**, enciende `free_shipping_rate_confirmed` (§ 13).
- **Este runbook NO recomienda ninguna opción de D2** (tarifa bajo el umbral): las presenta de forma neutral (§ 7).
- **Marcas usadas:**

| Marca | Significa |
|---|---|
| **MEDIDO-03E** | Medido en vivo en la Dev Store el 2026-09-29 |
| **LEÍDO-03B** | Leído en el Admin en 03B (puede haber cambiado) |
| **DOC** | Documentación oficial (help.shopify.com / shopify.dev) leída el 2026-09-29; URL en el § 17 |
| **CAPTURAR AL INICIO** | No se pudo leer sin el Admin renderizado. Se captura en el paso S0, antes de cambiar nada |
| **NOT_VERIFIED** | No confirmable con una fuente permitida. Se resuelve con una prueba de aceptación o al ejecutar |
| **NOT_SET / NOT_AVAILABLE** | NOT_SET: decisión pendiente de la dueña. NOT_AVAILABLE: dato que no existe en el repo |

---

## 1. Resumen en un minuto

**Objetivo:** que Colombia tenga una zona de envío para que el catálogo deje de figurar agotado, con **envío gratis desde $299.900 COP** y una decisión clara (D2) sobre qué pasa por debajo.

**Tres advertencias que no se pueden saltar:**

1. **Sin tarifa por debajo de $299.900 no se puede pagar una prenda suelta.** Todos los precios de venta (159.920, 167.920, 183.920 y 199.920) están por debajo del umbral. DOC: "If an order falls outside your tiers … then no rate applies and the customer receives a shipping error at checkout." Esa tarifa es la **decisión D2 (NOT_SET)**: no existe una fuente real de valor (`shipping/03E-shipping-source-of-truth.md` § 0).
2. **Precio vacío = gratis.** DOC: dejar el campo *Price* vacío o en 0 hace la tarifa gratuita. Nunca dejarlo vacío "para completar después".
3. **El orden importa:** primero sucursal y zona (S1–S6), luego el control G1, y **después** el mercado principal (runbook C1, paso M5). Al revés, todos los visitantes caen en Colombia y ven el catálogo agotado.

**Tiempo:** ~40–65 min de la dueña + ~1 h 15 min–1 h 45 min de Claude (QA y cerrojo), sin contar el runbook C1. Detalle en el § 14.

---

## 2. Orden combinado C1 + C2

| Orden | Runbook | Paso | Qué | Quién |
|---|---|---|---|---|
| 1 | C1 | M0 / **S0** | Snapshot ANTES | Claude (Admin visible) o dueña con capturas |
| 2 | C1 | M1 | Dirección de la tienda → Colombia | Dueña |
| 3 | **C2** | **S1** | Dirección de la sucursal → Colombia | Dueña |
| 4 | **C2** | **S2–S6** | Zona Colombia + tarifas (con D2 decidida) | Dueña |
| 5 | **C2** | **G1** | Con EE. UU. aún principal, forzar CO: 29/29 disponibles y add-to-cart 200 | Claude |
| 6 | C1 | M2–M9 | Mercados: Colombia activa y principal, respaldo, EE. UU. en Borrador | Dueña |
| 7 | C1 | M10 | Verificación de mercado | Claude |
| 8 | **C2** | **S7** | Zona de EE. UU.: dejar inerte o quitar (D4) | Dueña |
| 9 | **C2** | **S8–S10** | Cupones de prueba, QA T1..T12 | Dueña + Claude |
| 10 | **C2** | **S11** | Borrar cupones de prueba | Dueña |
| 11 | **C2** | **S12–S13** | Coherencia de textos y cerrojo `free_shipping_rate_confirmed` | Claude (+ dueña para textos) |

---

## 3. Decisiones de la dueña antes de tocar el Admin

| # | Decisión | Estado | Por qué importa |
|---|---|---|---|
| **D1** | Dirección real de despacho (sucursal) y de la tienda | **NOT_AVAILABLE** | Origen del envío. Hoy la sucursal "Shop location" está en EE. UU. |
| **D2** | **Qué cobra Shopify por debajo de $299.900** | **NOT_SET** | Sin esto, una compra de 1 prenda no tiene método de envío y **no puede pagarse** (§ 7.1). Opciones neutrales en el § 7 |
| **D3** | Express (24–48 h, ciudades principales en el sitio real): ¿se ofrece y a qué precio? | **NOT_SET** | El sitio real no le pone precio y no existe lista de ciudades. **Este runbook no crea Express**: sin precio ni lista de ciudades sería inventar |
| **D4** | Zona de EE. UU.: dejar inerte o quitar | Pendiente | § 8 |
| **D5** | Textos que dependen de D2: `threshold_note` de la ficha y `content/legal/envios.html` | Pendiente | § 13: hay que dejarlos coherentes **antes** de encender el cerrojo |

**Datos de apoyo disponibles para decidir D2 (sin recomendar):** transportadora del sitio real = **Envia**; tiempos: estándar 3–5 días hábiles, express 24–48 h; el sitio real cobra 0 y **coordina el costo a mano por pedido**; no existe tarifario, ni pesos, ni cotizaciones guardadas (filas reales de `Order.quotedShippingCost`: NOT_AVAILABLE, la base no se consultó).

---

## 4. Hechos de partida

| Hecho | Valor | Estado / fuente |
|---|---|---|
| Umbral de envío gratis | **299.900 COP** | `shipping/03E-shipping-source-of-truth.md` § 1.1 (código y HTML en vivo de `/envios`) |
| Regla del sitio real | `subtotal − cupón >= 299.900` (**≥**, después del cupón; el −20 % ya está dentro del precio) | ídem, U4–U6 |
| Tarifa por debajo del umbral | **NOT_SET** (el sitio real nunca cobra envío) | ídem § 0 |
| Precios de venta (1 unidad) | 159.920 · 167.920 · 183.920 · 199.920 → **todos < 299.900** | ídem § 3 |
| Carritos de ≥ 2 unidades sin cupón | mínimo 2 × 159.920 = **319.840** → siempre ≥ umbral | ídem § 3 |
| Pesos de producto | **No existen** (ni en Prisma ni en el CSV de 22 columnas) | ídem § 1.6 |
| `Requires shipping` | `true` en 98/98 variantes | CSV de importación |
| Inventario | **No rastreado** (`Inventory tracker` vacío, 98/98) | CSV; estado actual en el Admin: **CAPTURAR AL INICIO** |
| Perfil general | **Una** zona, "Domestic – Estados Unidos": Express 15,00, Standard 8,00, "gratis a partir de 70,00" | **MEDIDO-03E** (lectura del Admin) |
| Moneda de esas tarifas | **NOT_VERIFIED** | DOC: la moneda de una tarifa no se actualiza sola al cambiar la moneda de la tienda; la tienda pasó de USD a COP en 03B, así que lo más probable es que sigan en USD |
| Sucursal | "Shop location", en **EE. UU.** | **MEDIDO-03E** |
| Moneda de la tienda | COP | LEÍDO-03B |
| Unidad de peso | kg (sin pesos cargados) | LEÍDO-03B |

---

## 5. Snapshot ANTES (paso S0)

**Cuándo:** antes de cambiar nada. **Cómo:** Claude con el Admin visible (ventana de Chrome al frente) o la dueña con capturas pegadas en el chat. Todo es solo lectura.

| # | Dato | Dónde | Estado |
|---|---|---|---|
| E1 | Lista de **perfiles de envío**: ¿solo "Perfil general" o hay perfiles personalizados? ¿Qué productos tiene cada uno? | Configuración > Envío y entrega > Perfiles de envío | **CAPTURAR AL INICIO** |
| E2 | Perfil general: **cantidad de productos** y **"Envío desde"** (sucursal(es)) | Perfil general | **CAPTURAR AL INICIO** (se espera 29 y "Shop location") |
| E3 | Zona(s) actuales: nombre, países, y por tarifa: **nombre, tipo, precio con su moneda visible, condiciones, tiempo de tránsito** | Perfil general > zona "Domestic – Estados Unidos" | LEÍDO-03E; **re-capturar** (para poder recrearla y para resolver la moneda) |
| E4 | Sucursales: lista, dirección de "Shop location", **estado (activa)** y si "Inventory at this location is available to fulfill online orders" está activado | Configuración > Sucursales (nombre en español NOT_VERIFIED) | **CAPTURAR AL INICIO** |
| E5 | Moneda de la tienda | Configuración > General > Moneda de la tienda | LEÍDO-03B; re-capturar |
| E6 | Descuentos existentes (para no confundirlos con los cupones de QA; ver si hay un descuento automático de envío gratis) | Descuentos | **CAPTURAR AL INICIO** |
| E7 | Estado de mercados (Colombia, EE. UU.) | Mercados | Ver A4/A5 del runbook C1 |
| E8 | Storefront (Claude, sin Admin): V2, V3 + V4 y V5 del runbook C1 (§ 8) | Pestaña de la tienda | Se espera: visitante nuevo `US`; con CO forzado 0/29 y 422 |

---

## 6. Diseño de la zona Colombia

| Elemento | Diseño |
|---|---|
| Perfil | **Perfil general** (no crear uno personalizado). Debe incluir los 29 productos y "Envío desde" = la sucursal de S1 |
| Zona | Nombre **"Colombia"**; región: **Colombia, país completo** (todos los departamentos). Sin excepciones: el sitio real dice "dentro de Colombia"; la lista de municipios apartados con cargo adicional fue **retirada** (`03E-shipping-source-of-truth.md` § 1.7) |
| Moneda | **COP**, la de la tienda **al momento de crear** las tarifas. Se crean **nuevas**; no se editan las de EE. UU. (DOC: para corregir la moneda hay que borrar y recrear) |
| Tarifas por peso | **No.** No hay pesos. DOC: un producto sin peso cuenta como sin peso, así que todo carrito caería en el tramo más bajo |
| Tarifas de transportadora / app | **No** (exigen pesos; disponibilidad de Envia para Colombia: NOT_VERIFIED) |
| Express | **No se crea** (D3) |
| Tarifa gratis | Condición "monto del pedido >= 299.900 COP" (§ 6.1 y 6.2) |
| Tarifa por debajo | **NOT_SET (D2)**: § 7 |
| Formato de números | Escribir los importes **sin separador de miles** (`299900`) y **comprobar cómo los muestra el Admin al guardar**: el separador decimal y de miles del Admin en español puede interpretar "299.900" como 299,9 (**NOT_VERIFIED**) |
| Tiempo de tránsito | DOC: el campo *Transit time* admite "a custom range or a single value … such as `3-5 days`". El sitio real promete **3 a 5 días hábiles**: que el campo pueda expresar "hábiles" es **NOT_VERIFIED**. Opciones para la dueña: dejarlo vacío, o poner el texto en el **nombre** de la tarifa |

### 6.1 La condición del umbral: qué dice la documentación y qué se prueba

| Pregunta | Qué dice la DOC | Estado | Prueba de aceptación |
|---|---|---|---|
| ¿El mínimo es **inclusivo** (`>=`)? | La página de tarifas define *Minimum* y *Maximum* pero **no dice** si los límites son inclusivos. Su ejemplo (0–100,00 y 100,01–200,00) **sugiere** límites inclusivos con paso de un centavo, sin afirmarlo | **NOT_VERIFIED** | **T6** (carrito de exactamente 299.900 debe ser gratis) y **T7** (299.899 no) |
| ¿Se mide **antes o después de descuentos**? | Para tarifas por monto del pedido: "The checkout determines shipping rates based on the total value of the cart after applying discounts, but before applying taxes." y "a discount code can move a cart into a different rate." (troubleshooting) | **Documentado** para tarifas por monto (Forma B) | T5, T6, T7 |
| ¿Y para *Offer free shipping* con mínimo en una tarifa plana (Forma A)? | La página solo dice "enter the minimum amount for an order to qualify for free shipping"; **no dice** sobre qué valor se mide | **NOT_VERIFIED** | T5, T6, T7 |
| ¿Antes de impuestos? | Sí, en tarifas por monto (misma cita) | Documentado | — |
| ¿El −20 % del sitio se resta dos veces? | No: está dentro del *Price*; no es un descuento de Shopify (`total_discount` = 0, MEDIDO-03E) | Medido | T1 (leer `total_discount`) |

**Regla del sitio real que se replica:** `subtotal − cupón >= 299.900` (`pricing.ts:45`; casos que fijan la frontera en `pricing.test.ts`: 299.899 no, 299.900 sí, 310.000 − 15.000 no, 310.000 − 10.100 sí).

### 6.2 Formas de configurar el gratis (técnicas; no dependen de D2, salvo donde se indica)

| Forma | Configuración | Cuándo sirve | Riesgo |
|---|---|---|---|
| **A. Una opción plana + "Ofrecer envío gratis"** | Tipo **Plana** (Flat), *Name*, *Price* = tarifa de D2, **Offer free shipping** activado con mínimo **299900** | Cuando la tarifa de abajo y la de arriba se llaman igual | La DOC no dice sobre qué valor se mide el mínimo: se prueba con T5–T7 |
| **B. Dos opciones por monto del pedido** | Cada tarifa "Order amount" tiene **un solo rango** (DOC: "the minimum order value for this rate"). Opción 1: Min 0, Max 299899,99. Opción 2: Min 299900, Max **vacío**, Price 0 | Cuando cada tramo lleva **nombre distinto** (imprescindible si el tramo bajo se llama distinto, D2 opción b) | Si el Admin no acepta decimales en COP (NOT_VERIFIED), usar Max 299899 y comprobar T7. DOC: el tramo más alto sin *Maximum* evita huecos |
| **C. Respaldo: descuento automático de envío gratis** | Tarifa base + descuento de envío gratis con compra mínima 299900, limitado al país Colombia (DOC: el mínimo cuenta solo productos, a su precio ya descontado) | Solo si T6 falla en A y en B y no hay forma de acomodar el mínimo | La DOC tampoco dice si ese mínimo es inclusivo. Requiere sus propias pruebas |

**Si T6 falla (299.900 no sale gratis):** el mínimo es estricto. Cambiar el mínimo del tramo gratis a **299899,99** (o **299899** si el Admin no acepta decimales) y repetir T6 y T7. Con 299899,99, un carrito de 299.899 sigue sin ser gratis (T7) y uno de 299.900 sí (T6), sea el mínimo inclusivo o estricto.

---

## 7. D2: qué cobra Shopify por debajo de $299.900 (opciones neutrales)

### 7.1 Consecuencia de no decidirla

| Situación | Resultado |
|---|---|
| Zona Colombia con **solo** el tramo gratis (≥ 299.900) | Los carritos de ≥ 2 prendas tienen envío gratis; los de **1 prenda** (159.920–199.920) **no tienen ningún método de envío**: error de envío en el checkout y **no pueden pagarse**, aunque después se active un proveedor de pagos (DOC: cita del § 1; ahí se refiere a huecos entre tramos, que es lo que ocurre aquí) |
| Zona Colombia sin ninguna tarifa | Catálogo agotado para CO (C2) |
| ¿Los productos figuran disponibles con solo el tramo gratis? | **NOT_VERIFIED** (03E § 5.3 lo dejó abierto). Se mide en G1 |

**Modo QA parcial (solo si D2 sigue pendiente y la dueña quiere medir C2 ya):** crear únicamente la opción gratis (Order amount, Min 299900, Max vacío, Price 0). Sirve para medir disponibilidad y los carritos de ≥ 2 prendas. **No es lanzable**, `free_shipping_rate_confirmed` sigue en `false`, y hay que reemplazarla al decidir D2.

### 7.2 Las tres opciones (sin recomendar)

| | **a. Tarifa fija propia** | **b. Coordinación por WhatsApp, costo 0, con nombre honesto** | **c. Envío gratis para todos** |
|---|---|---|---|
| **Configuración** | Precio **X = NOT_SET** por debajo de 299.900 y gratis desde 299.900 (Forma A, o Forma B con dos opciones) | Forma B: opción 1 (Min 0, Max 299899,99, Price **0**) con un **nombre que diga que el envío se coordina después**, y opción 2 (Min 299900, Price 0) "Envío estándar gratis". El texto final del nombre lo decide la dueña; **no debe decir "gratis"** | Una sola opción plana, *Price* **0** escrito explícitamente, **sin condiciones** (DOC: "Free shipping applies to every order that the rate covers") |
| **Qué ve la clienta (esperado)** | Envío estándar con precio X; gratis si el pedido llega al umbral | Un método con el nombre elegido y valor 0 | "Envío estándar" gratis en todos los pedidos |
| **Cobro del transporte** | Dentro del pago de Shopify | **Fuera de Shopify**, coordinado después (como hoy en el sitio real) | Lo asume Radaelli |
| **Coherencia con el sitio real** | Cambia el modelo (hoy se cotiza por pedido y no se cobra en el pago) | Replica el flujo real | Elimina el concepto de umbral |
| **Textos y theme** | `threshold_note` ("…el valor del envío se informa antes del despacho…") deja de ser cierto; `envios.html` ("el costo del transporte no queda incluido en el pago") también | `threshold_note` y `envios.html` siguen siendo ciertos | Las promesas "desde $299.900" (banner, ficha, barra del carrito) pierden sentido: hay que decidir el copy **antes** del cerrojo |
| **NOT_VERIFIED / riesgos** | El valor X no tiene fuente (NOT_SET). Si se deja vacío, queda gratis | El checkout probablemente muestra "Gratis" o "$ 0" junto al nombre: puede leerse como envío gratis por debajo del umbral. **Se mide en T1/T2 y se decide con la captura** | Costo real de Envia: NOT_AVAILABLE. Sin fuente para estimar el impacto |

**Sobre "recogida":** la recogida local es una función distinta de las tarifas de envío. La DOC dice que, si un país no tiene tarifas de envío pero sí retiro en tienda, el mercado muestra un error de "sin tarifas"; los detalles de su configuración y de cómo afecta la disponibilidad de productos son **NOT_VERIFIED** (la página consultada no los da). Por eso la opción b se define como **tarifa de costo 0 con nombre honesto**, no como recogida.

**Datos que aún faltan para decidir (no hay fuente en el repo):** costo real de despacho con Envia por destino, lista de ciudades con Express, política de reenvíos.

---

## 8. Zona de EE. UU. (D4)

| Combinación | Efecto |
|---|---|
| Mercado EE. UU. **Activo** + zona EE. UU. **existe** | Un visitante de EE. UU. podría comprar con las tarifas de fábrica. Su moneda es NOT_VERIFIED: si estuvieran en COP, cualquier pedido de más de "70" viajaría gratis (`03E-shipping-source-of-truth.md` § 5.1) |
| Mercado EE. UU. **Activo** + zona **eliminada** | El mercado muestra error de "sin métodos de entrega" para EE. UU. (DOC) y esos visitantes no pueden pagar |
| Mercado EE. UU. **Borrador** + zona **existe** | La zona queda **inerte**: nadie la usa (DOC: los clientes de mercados inactivos no completan compras). Es reversible |
| Mercado EE. UU. **Borrador** + zona **eliminada** | Configuración limpia. Para vender en EE. UU. habría que recrear zona y tarifas |

**Reglas técnicas:**

- **No reutilizar ni editar** las tarifas de EE. UU. para Colombia (moneda posiblemente USD; DOC: la moneda de una tarifa no se actualiza sola).
- La decisión se ejecuta en **S7**, **después** de que el runbook C1 esté verificado. Dejarla inerte hasta el final es lo más fácil de revertir; eliminarla es el único paso que exige recrear a mano.
- Antes de eliminarla, tener capturada la zona (E3): nombre, tarifas, moneda visible y condiciones.

---

## 9. Cómo evitar que el catálogo salga agotado en Colombia

**Mecanismo (MEDIDO-03E + DOC):**

- 03E midió 0/29 disponibles con país CO y 422 en `/cart/add.js`, con una única zona de EE. UU.
- DOC: "Customers can select a country at checkout only when it's included in both an active market and a shipping zone with available shipping rates."
- Que esa falta se traduzca en "Agotado" en la tienda es lo que **midió 03E**. La DOC solo describe el síntoma para apps de dropshipping (troubleshooting).
- No es stock: el inventario no se rastrea (CSV, 98/98).

**Orden correcto (con el porqué):**

1. **S1 sucursal en Colombia.**
2. **S4–S6 zona Colombia con al menos una tarifa que cubra el carrito** (Colombia debe pertenecer a un mercado para poder agregarla a una zona; DOC).
3. **G1 (Claude), con EE. UU. aún principal:** `POST /localization` con CO y medir disponibilidad y add-to-cart. Es la misma prueba que dio 0/29 en 03E, así que **C2 se verifica sin necesidad de C1**.
4. **Solo entonces**, runbook C1: activar Colombia (DOC: solo se activa para países con tarifas), convertirla en principal y dejar EE. UU. en Borrador.

**Si G1 sigue dando "agotado", revisar en este orden** (de más a menos probable):

| # | Revisión | Dónde |
|---|---|---|
| 1 | La zona incluye **todo Colombia** y tiene una tarifa que **cubre el valor del carrito de prueba** (sin huecos entre tramos) | Perfil general > zona Colombia |
| 2 | Los 29 productos están en el **Perfil general** (no en un perfil personalizado sin zona Colombia) y "Envío desde" es la sucursal correcta | Perfil general; E1–E2 |
| 3 | La sucursal está **activa** y con "Inventory at this location is available to fulfill online orders" activado (DOC: si no, faltan tarifas para esa ubicación) | Sucursales |
| 4 | Colombia está en un mercado **Activo** y los productos están en su catálogo (DOC: por defecto todos) | Mercados > Colombia |
| 5 | Los productos están publicados en la tienda online | Productos |
| 6 | Esperar unos minutos y repetir G1 (propagación: NOT_VERIFIED) | — |

**Advertencias (DOC):**

- **No quitar la sucursal del perfil ni reemplazarla por otra**: si se quita la última ubicación de un grupo, las zonas y tarifas de ese grupo **se eliminan**. Solo se **edita la dirección** de "Shop location".
- Una dirección de sucursal sin verificar "can prevent you from offering local delivery … or buying shipping labels". No se documenta que bloquee la disponibilidad de productos (NOT_VERIFIED).

---

## 10. Pasos (ejecución)

**Antes de empezar:** S0 completo, D1 y D2 decididas. **Nombres de la UI:** "Configuración > Envío y entrega" es el del menú en español; "Perfil general", "Domestic – Estados Unidos" y "Shop location" se vieron en vivo en 03E. Los demás nombres en español (Sucursales, Agregar zona, Agregar opción de envío, Tipo de tarifa, Ofrecer envío gratis, Tiempo de tránsito, Descuentos) son **NOT_VERIFIED** (la documentación oficial en español se sirve en inglés); entre paréntesis va el nombre oficial en inglés.

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback | ¿Reversible? |
|---|---|---|---|---|---|
| **S0** | Admin (solo lectura) | Capturar E1–E8 del § 5 | Snapshot completo | — | n/a |
| **S1** | Configuración > Sucursales (Settings > Locations) > "Shop location" > Dirección | Cambiar la dirección a la de despacho en Colombia (D1). **Mantener activada** "Inventory at this location is available to fulfill online orders". **No** desactivar, eliminar ni cambiar la sucursal del perfil | Dirección guardada; la sucursal sigue activa | Volver a escribir la dirección capturada en E4 | **Sí** |
| **S2** | Configuración > General > Moneda de la tienda | Confirmar **COP** (solo lectura). Si dijera otra cosa, **detenerse**: las tarifas quedarían en esa moneda | COP | — | n/a |
| **S3** | Configuración > Envío y entrega > Perfiles de envío > **Perfil general** | Verificar que incluye los **29 productos** y que "Envío desde" es la sucursal de S1 | 29 productos; sucursal correcta | — | n/a |
| **S4** | Perfil general > **Agregar zona** (Add zone) | *Zone name*: `Colombia`. *Regions*: **Colombia** (país completo, todos los departamentos). Confirmar. Si Colombia no se ofrece como país: no pertenece a ningún mercado; volver al runbook C1 (M2) | Zona "Colombia" creada, sin tarifas todavía | Menú `…` de la zona > Eliminar > Guardar (no hay nada que perder: es nueva) | **Sí** |
| **S5** | Zona Colombia > **Agregar opción de envío** (Add shipping option) | Crear las opciones según **D2** con los valores de la tabla siguiente. Escribir importes sin separador de miles. **Nunca dejar un *Price* vacío**. Nombres de tarifa: los decide la dueña | Opciones creadas con precio y moneda visibles (esperado: COP) | Menú `…` de cada tarifa > Eliminar > Guardar | **Sí** |
| **S6** | Perfil general | **Guardar** (Save) y capturar la zona: nombre, tarifas, precios, moneda, condiciones | Zona guardada sin errores de cobertura | Como S4/S5 | **Sí** |
| **G1** | (Claude) Storefront | Con EE. UU. aún principal: `POST /localization` con CO y correr V4 y V5 del runbook C1 (§ 8), más el estimador `estimate()` del § 11 | 29/29 productos disponibles y add-to-cart **200**. Si no: § 9, lista de revisión | — | n/a |
| — | Runbook C1 | **M2–M9** (mercado principal, respaldo, EE. UU. en Borrador) y **M10** (verificación) | Ver `theme/03F-owner-market-colombia-runbook.md` | Ver ese runbook | Sí |
| **S7** | Perfil general > zona "Domestic – Estados Unidos" | Según D4 (§ 8): **dejarla** (inerte) o menú `…` > Eliminar > Guardar. **Solo después** de que M10 esté verde | Zona inerte o eliminada | Recrear la zona con lo capturado en E3 | Dejar: **Sí**. Eliminar: **recrear a mano** |
| **S8** | Descuentos (Discounts) > Crear descuento > Código | Crear **3 códigos de prueba** de "monto en el pedido", sin compra mínima, sin límite de usos: `QA-PCT10` (10 %), `QA-FIJO-19940` (monto fijo 19.940 COP) y `QA-FIJO-19941` (monto fijo 19.941 COP). DOC: los descuentos de monto fijo se crean solo en la moneda por defecto (COP: correcto). Revisar E6 para que ningún otro descuento interfiera | 3 códigos activos | Eliminar los 3 códigos (S11) | **Sí** |
| **S9** | (Claude + dueña) Storefront | Preparar carritos con el ayudante del § 11. Claude **no escribe datos en el checkout**: la dueña escribe la dirección de prueba y aplica los códigos | Carritos listos | Vaciar carrito | **Sí** |
| **S10** | (Claude + dueña) | Correr **T1..T12** (§ 11) y completar la tabla | Todas en "Pasa", o defectos documentados | Ver § 12 | n/a |
| **S11** | Descuentos | Eliminar `QA-PCT10`, `QA-FIJO-19940` y `QA-FIJO-19941` | Lista de descuentos como en E6 | — | **Sí** (los códigos de prueba son desechables) |
| **S12** | (Claude + dueña) | Dejar coherentes los textos que dependen de D2 (`threshold_note`, `envios.html`; § 13) | Textos alineados con la opción elegida | Restaurar los textos anteriores | **Sí** |
| **S13** | (Claude) `theme-src` | Encender `free_shipping_rate_confirmed` según el § 13. **Solo aquí, al final** | Promesas de envío gratis visibles y ciertas | Apagarlo y empujar de nuevo | **Sí** |

### Valores de S5 según D2

| Opción de D2 | Opción(es) de envío a crear en la zona Colombia |
|---|---|
| **a. Tarifa fija (Forma A)** | 1 opción: tipo **Plana**; *Name* a elección (p. ej. "Envío estándar"); *Price* = **X (NOT_SET)**; **Offer free shipping** activado, mínimo **299900** |
| **a. Tarifa fija (Forma B)** | Opción 1: tipo **Order amount**; *Min* 0; *Max* 299899,99; *Price* = **X**. Opción 2: tipo **Order amount**; *Min* 299900; *Max* **vacío**; *Price* 0 |
| **b. Costo 0 con nombre honesto** | Opción 1: **Order amount**; *Name* = texto honesto de la dueña (que diga que se coordina y no diga "gratis"); *Min* 0; *Max* 299899,99; *Price* **0** (escrito). Opción 2: **Order amount**; *Name* "Envío estándar gratis"; *Min* 299900; *Max* vacío; *Price* 0 |
| **c. Gratis para todos** | 1 opción: tipo **Plana**; *Name* "Envío estándar"; *Price* **0** (escrito); sin condiciones |
| **D2 pendiente (modo QA parcial, § 7.1)** | Solo la opción 2 de la Forma B (Min 299900, Max vacío, Price 0). **No lanzable** |
| **Todas** | *Transit time*: opcional (ver § 6). No crear Express ni tarifas por peso |

---

## 11. QA posterior: casos T1..T12

**Productos de prueba** (precios de `import/shopify-products-03c.csv`): `brisa-natural-beige` talla S = **199.920**; `bikini-shadow-azul-marino` talla M = **159.920**.

**Ayudantes (los corre Claude en la pestaña del storefront):**

```js
async function addItem(handle, size, qty = 1) {
  const p = await fetch(`/products/${handle}.js`).then(r => r.json());
  const v = p.variants.find(x => x.title === size) ?? p.variants[0];
  const r = await fetch('/cart/add.js', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ id: v.id, quantity: qty }] })
  });
  return { handle, talla: v.title, precio_cop: v.price / 100, status: r.status };
}
async function clearCart() { await fetch('/cart/clear.js', { method: 'POST' }); }
async function cartInfo() {
  const c = await fetch('/cart.js', { cache: 'no-store' }).then(r => r.json());
  return { currency: c.currency, total_cop: c.total_price / 100, descuento_cop: c.total_discount / 100, items: c.item_count };
}
// Estimador de tarifas SIN escribir en el checkout (DOC: Ajax cart API)
async function estimate(province = 'Bogotá, D.C.', zip = '110111') {
  const q = new URLSearchParams({
    'shipping_address[zip]': zip, 'shipping_address[country]': 'Colombia', 'shipping_address[province]': province
  });
  await fetch('/cart/prepare_shipping_rates.json?' + q, { method: 'POST' });
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const r = await fetch('/cart/async_shipping_rates.json?' + q, { cache: 'no-store' });
    if (r.status === 200) {
      const j = await r.json();
      return (j.shipping_rates || []).map(x => ({ nombre: x.name, precio: x.price, dias: x.delivery_days }));
    }
  }
  return 'sin respuesta en 10 s';
}
```

- La escala ×100 es la que usa el theme (03B, punto 10); confirmar con el valor crudo de `v.price` la primera vez.
- Los endpoints `prepare_shipping_rates.json` y `async_shipping_rates.json` están en la documentación oficial (Ajax cart API). Aceptan `shipping_address[zip|country|province]`. **La DOC no dice si consideran descuentos**, y el formato exacto del nombre de país y de provincia para Colombia es **NOT_VERIFIED**. Por eso los casos con **código de descuento** (T5–T7) se prueban en el **checkout real, con la dueña escribiendo la dirección**.
- El estimador **no escribe datos personales**: solo país, provincia y código postal de ejemplo.

**Antes de cada caso:** sesión en CO (`await setCountry('CO')` del runbook C1, V3) y carrito vacío (`clearCart()`).

| # | País | Carrito | Valor tras descuentos | Cómo se prueba | Esperado |
|---|---|---|---|---|---|
| **T0 = G1** | CO forzado, EE. UU. aún principal | — | — | V4 y V5 del runbook C1 | 29/29 disponibles; add-to-cart 200 |
| **T1** | CO | 1 × `brisa-natural-beige` S | **199.920** | `addItem` + `estimate()`; luego checkout con la dueña. Leer `total_discount` (esperado 0) | **a:** una tarifa de precio X. **b:** una opción "por coordinar" de costo 0 (anotar cómo la muestra el checkout). **c:** gratis. **D2 pendiente:** **sin métodos / error de envío** (no se puede pagar) |
| **T2** | CO | 1 × `bikini-shadow-azul-marino` M | **159.920** (el precio más bajo del catálogo) | ídem T1 | Igual que T1 |
| **T3** | CO | 2 × `bikini-shadow-azul-marino` M | **319.840** | `addItem(…, 2)` + `estimate()` | **Envío gratis**; no aparece la tarifa de D2 (o aparece solo la gratis) |
| **T4** | CO | 1 × `brisa-natural-beige` S + 1 × `bikini-shadow-azul-marino` M | **359.840** | `estimate()` | **Envío gratis** |
| **T5** | CO | T3 + código `QA-PCT10` | **287.856** | Checkout, la dueña escribe dirección de prueba y aplica el código | **NO gratis**; aparece la tarifa de D2; **sin error**. Confirma que el cupón mueve el carrito de tramo (documentado para tarifas por monto) |
| **T6** | CO | T3 + código `QA-FIJO-19940` | **299.900** | ídem T5 | **Gratis** (mínimo inclusivo `>=`, igual que el real). **Si sale "no gratis":** § 6.2, mínimo 299899,99, y repetir T6 y T7 |
| **T7** | CO | T3 + código `QA-FIJO-19941` | **299.899** | ídem T5 | **NO gratis** y **sin error de envío** (sin hueco entre tramos) |
| **T8** | CO | T1 o T3 | — | `estimate('Amazonas', '')` y `estimate('San Andrés y Providencia', '')`. Nombres de provincia: **NOT_VERIFIED** | Mismo resultado que en Bogotá: la zona es país completo |
| **T9** | US (tras dejar EE. UU. en Borrador) | 1 × cualquiera | — | `setCountry('US')`, `addItem`, anotar; luego `setCountry('CO')` | **Solo registro**: lo que ocurra no está documentado (DOC: mercado inactivo → no completa compras y recibe la región de respaldo) |
| **T10** | CO | T3 | 319.840 | La dueña llega en el checkout **hasta la pantalla de pago sin pagar**; Claude solo observa | Ruta `…/es-co`; método de envío gratis y total 319.840; pago: "no puede aceptar pagos" hasta activar proveedor |
| **T11** | CO, **después del cerrojo** | Home, ficha, carrito con 1 ítem y con ≥ 299.900; `/en` | — | Leer DOM: letra chica del banner, acordeón de envío de la ficha, `.cart-free-shipping` | Promesas visibles y ciertas para la opción D2 elegida; en `/en`: "Free shipping on orders of … or more." |
| **T12** | CO | T5 con la barra del carrito | — | Comparar la barra con el checkout | La barra usa `cart.total_price`: incluye descuentos automáticos pero **no** códigos escritos en el checkout (`03E-shipping-source-of-truth.md` § 3, K5). **Registrar la diferencia** (menor) |

**Tabla de resultados a completar:**

| # | Esperado | Real | Pasa / Falla |
|---|---|---|---|
| T0–T12 | (arriba) | | |

---

## 12. Rollback paso a paso

Deshacer en **orden inverso**. Antes de eliminar la zona Colombia, **revertir el runbook C1**: con Colombia como país por defecto y sin zona, todo el catálogo vuelve a figurar agotado.

1. **Cerrojo (S13):** `free_shipping_rate_confirmed: false` (y `cart_free_shipping_progress: false` si se encendió) en `theme-src/config/settings_data.json`; empujar al theme sin publicar.
2. **Textos (S12):** restaurar `threshold_note` y `envios.html` a su versión anterior.
3. **Cupones de prueba (S11):** eliminar los 3 códigos.
4. **Zona de EE. UU. (S7):** si se eliminó y se quiere volver a vender en EE. UU., recrearla con la captura E3 (de fábrica: Standard 8,00, Express 15,00, gratis desde 70,00; moneda a confirmar) y volver a **Activar** el mercado EE. UU. (runbook C1, rollback de M7).
5. **Runbook C1:** M7 al revés (EE. UU. Activo) y M5 al revés (EE. UU. principal). Ver su § 12.
6. **Zona Colombia (S4–S6):** solo si se quiere dejar la tienda sin envío a Colombia: menú `…` de la zona > Eliminar > Guardar. (Consecuencia: CO vuelve a figurar agotado.) Alternativa más suave: eliminar solo una tarifa.
7. **Sucursal (S1):** restaurar la dirección capturada en E4. **No** quitar la sucursal del grupo de ubicaciones.
8. **Verificar:** V2 y V4 del runbook C1 con el país US (disponible, 29/29) y con CO (agotado si se eliminó la zona).

**Qué no se puede deshacer:** nada de esto es permanente si se sigue el orden. Lo único que exige trabajo a mano es recrear la zona de EE. UU. o la zona Colombia.

---

## 13. Cerrojo `free_shipping_rate_confirmed` (lo enciende Claude, solo al final)

**Qué es:** ajuste del theme (`theme-src/config/settings_data.json:24`, hoy `false`). Mientras esté apagado, el theme **no promete envío gratis en ningún lado** (banner, ficha, carrito). Su texto de ayuda dice: "Encender solo cuando Shopify > Envío tenga una tarifa gratis para Colombia desde este mismo umbral." El umbral del theme (`free_shipping_threshold`) ya vale `299900`.

**Precondiciones (todas):**

- [ ] Runbook C1 verificado (tabla ANTES/DESPUÉS en verde).
- [ ] G1 verde y **T1–T7 y T10 con "Pasa"** para la opción D2 elegida (T6/T7 fijan la regla `>=`).
- [ ] D2 registrada (a, b o c) y **textos coherentes con ella** (S12):

| D2 | `threshold_note` (`theme-src/templates/product.json:26`): "Por debajo de ese monto, el valor del envío se informa antes del despacho, según tu destino." | `content/legal/envios.html` |
|---|---|---|
| a | **Deja de ser cierto**: reescribir (texto de la dueña) | Reescribir: el costo sí queda incluido en el pago |
| b | Sigue siendo cierto | Sigue siendo cierto; "Envío express" solo si D3 lo crea |
| c | Deja de encajar con "desde $299.900": la dueña decide el copy y si el cerrojo debe encenderse | Reescribir |

- [ ] Si la dueña tocó el theme en el editor, hacer `theme pull` **antes** de editar (`theme/03D-free-shipping-audit.md` § 4.3), para no pisar sus cambios.

**Pasos de Claude:**

1. Editar `theme-src/config/settings_data.json`: `"free_shipping_rate_confirmed": true`. Opcional, solo con OK de la dueña: `"cart_free_shipping_progress": true`. Dejar `free_shipping_threshold: 299900`.
2. Empujar **solo** al theme sin publicar `189072474431` (`shopify theme push --theme 189072474431 --strict --path <theme-src> --ignore README.md`, sin `--live` ni `--publish`). **Horizon (`189072113983`) no se toca.**
3. Verificar (T11): letra chica del banner, frase "Envío gratis en compras desde $299.900" en la ficha, barra del carrito con 1 ítem y con ≥ umbral, y `/en`. Correr Theme Check (0/0) y el arnés de regresión (69/69 en 03E).
4. Documentar en un reporte corto y actualizar el estado de C2.

**Rollback del cerrojo:** volver a `false` y empujar de nuevo (paso 1 del § 12).

---

## 14. Tiempo total estimado

| Bloque | Dueña | Claude |
|---|---|---|
| S0 snapshot | 0–10 min (capturas si Claude no ve el Admin) | 5–10 min |
| S1 sucursal | 4 min | — |
| S2–S3 (revisión) | 3 min | — |
| S4–S6 zona y tarifas (con D2 decidida) | 8–12 min | — |
| G1 | — | 5–10 min |
| Runbook C1 (M2–M10) | ~15 min (ver su § 13) | ~15 min |
| S7 zona EE. UU. | 3 min | — |
| S8 crear cupones de prueba | 6–8 min | — |
| S10 QA T1..T12 (la dueña tipea la dirección en T5–T7 y T10) | 10–15 min | 30–40 min |
| S11 borrar cupones | 2 min | — |
| S12–S13 textos y cerrojo | 5–10 min (textos) | 20–30 min (edición, push, verificación, reporte) |
| **Total (sin el runbook C1)** | **~40–65 min** | **~1 h 15 min–1 h 45 min** |

**Mínimo para desbloquear el catálogo (C2 solo):** S1 + S4–S6 + G1 = ~15–25 min de la dueña y ~10 min de Claude, siempre que D2 esté decidida (o con el modo QA parcial).

---

## 15. Qué hace Claude inmediatamente después

1. **Tras S6:** correr G1 (V4, V5, `estimate()`) y responder a la dueña "verde/rojo" con el detalle. Si es rojo, aplicar la lista de revisión del § 9, sin tocar el Admin.
2. **Tras el runbook C1:** repetir T0 con la tienda ya en Colombia (visitante nuevo, sin forzar país) y confirmar checkout `es-co`.
3. **Correr T1..T12** y completar la tabla de resultados. Los casos con códigos (T5–T7) y T10 requieren a la dueña en el checkout.
4. **Registrar cómo muestra el checkout la tarifa de costo 0** (si D2 = b) y compartir la captura para que la dueña confirme que el texto no se lee como "gratis".
5. Redactar el reporte de verificación de C2 (nombre a definir en la fase; no lo crea este runbook).
6. Con las precondiciones del § 13 en verde, **encender el cerrojo**, empujar al theme sin publicar, verificar T11 y reportar.
7. Recordarle a la dueña **borrar los cupones de prueba** si aún existen, y vaciar el carrito de pruebas.
8. Abrir el siguiente pendiente: pagos (Wompi o pasarela de prueba, `payments/03E-wompi-shopify-feasibility.md`), sin lo cual el checkout de prueba no puede completarse.

---

## 16. NOT_VERIFIED de este runbook

| # | Tema | Cómo se resuelve |
|---|---|---|
| 1 | Nombres en español de la UI: Sucursales, Agregar zona, Agregar opción de envío, Tipo de tarifa, Ofrecer envío gratis, Tiempo de tránsito, Descuentos | Se ven al ejecutar |
| 2 | Si el **mínimo** de una tarifa es inclusivo (`>=`) | T6 / T7 |
| 3 | Sobre qué valor mide su mínimo **"Offer free shipping"** de una tarifa plana (Forma A), antes o después de descuentos | T5–T7 |
| 4 | Si el Admin acepta decimales en COP (299899,99) y cómo interpreta separadores | S5 (escribir sin separador y comprobar) |
| 5 | Si el tiempo de tránsito puede expresar "días hábiles" | S5 |
| 6 | Moneda con que quedaron las tarifas de EE. UU. (USD o COP) | S0 (E3) |
| 7 | Si los productos figuran disponibles con **solo** el tramo gratis (modo QA parcial) | G1 |
| 8 | Cómo muestra el checkout una tarifa de precio 0 con nombre "por coordinar" | T1/T2 (opción b) |
| 9 | Si `prepare_shipping_rates.json` / `async_shipping_rates.json` aceptan "Colombia" y los nombres de provincia, y si consideran descuentos | T1–T4, T8 |
| 10 | Detalles y efectos de la **recogida local** sobre disponibilidad de productos | No se usa |
| 11 | Que el Admin no marque error de cobertura al guardar las opciones | S6 |
| 12 | Tiempo de propagación tras crear la zona | G1 (reintentar) |
| 13 | Disponibilidad de tarifas de Envia por transportadora para Colombia en Shopify | No se usa (sin pesos) |

---

## 17. Fuentes oficiales (leídas el 2026-09-29)

- Zonas y tarifas (tipos, "Offer free shipping", Minimum/Maximum, cobertura, tránsito): https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/setting-up-shipping-rates
- Solución de problemas (monto tras descuentos, moneda de las tarifas, ubicaciones, pesos): https://help.shopify.com/en/manual/fulfillment/setup/shipping-rates/troubleshooting
- Perfiles de envío (perfil general no se elimina; "Agregar zona"/"Agregar opción"): https://help.shopify.com/en/manual/fulfillment/setup/shipping-profiles/setting-up-shipping-profiles
- Zonas de envío y mercados: https://help.shopify.com/en/manual/international/shipping/shipping-zones
- Sucursales: https://help.shopify.com/en/manual/locations/setting-up-your-locations
- Descuentos de envío gratis (mínimo de compra, límite por país): https://help.shopify.com/en/manual/discounts/discount-types/free-shipping
- Requisitos de mercados (tarifas de envío para activar; descuentos de monto fijo en la moneda por defecto): https://help.shopify.com/en/manual/markets/getting-started/requirements-and-considerations
- Cambio de moneda de la tienda (las tarifas de envío no se actualizan): https://help.shopify.com/en/manual/payments/shopify-payments/store-currency/changing-your-store-currency
- Ajax cart API (`/cart.js`, `prepare_shipping_rates.json`, `async_shipping_rates.json`): https://shopify.dev/docs/api/ajax/reference/cart
- Formulario `localization` (`country_code`): https://shopify.dev/docs/storefronts/themes/markets/multiple-currencies-languages

**Documentos del proyecto citados:** `theme/03E-commercial-readiness-report.md`, `theme/03E-checkout-baseline-report.md`, `theme/03E-owner-actions-one-shot.md`, `theme/03D-free-shipping-audit.md`, `theme/03B-store-foundation-report.md`, `shipping/03E-shipping-source-of-truth.md`, `payments/03E-wompi-shopify-feasibility.md`, `theme/03F-owner-market-colombia-runbook.md`.

---

## 18. Hallazgos de esta redacción que precisan 03E

| # | Hallazgo | Efecto sobre 03E |
|---|---|---|
| 1 | La DOC (troubleshooting) trae, para tarifas por monto, la frase "a discount code can move a cart into a different rate" y "the total value of the cart after applying discounts, but before applying taxes" | 03E (`03E-shipping-source-of-truth.md` § 2) lo marcaba como **inferencia**; pasa a **documentado para tarifas por monto (Forma B)**. Sigue sin documentarse para *Offer free shipping* (Forma A) |
| 2 | Cada tarifa "Order amount" es **un solo rango** (Min/Max); los tramos son opciones separadas | Confirma la Forma B de 03E; aclara que la opción D2-b exige la Forma B (nombres distintos por tramo) |
| 3 | El orden correcto es **zona antes de mercado** (DOC: un mercado solo se activa para países con tarifas; un país solo se agrega a una zona si pertenece a un mercado) | 03E § 5.3 ponía Mercados (paso 2) antes de la zona (paso 4); el informe SEO de 03E ya pedía "C2 antes o junto con C1" |
| 4 | El **estimador de tarifas** del Ajax cart API permite medir tarifas **sin escribir en el checkout** | Reduce el trabajo manual de la dueña, salvo en los casos con código de descuento |
| 5 | La recogida local **no** elimina el error de "sin tarifas" del mercado (DOC) | Por eso D2-b se define como tarifa de costo 0, no como recogida |
| 6 | Quitar la última sucursal de un grupo de ubicaciones **borra** sus zonas y tarifas (DOC) | Se cambia solo la dirección de "Shop location" |
| 7 | El tiempo de tránsito de Shopify se expresa en días ("3-5 days"); "hábiles" no está documentado | La promesa "3 a 5 días hábiles" quizá deba ir en el nombre de la tarifa |
| 8 | 03B reportó el mercado Colombia **activo** sin zona de envío | Choca con la regla de la DOC; se resuelve capturando el estado real en S0/M0 |
