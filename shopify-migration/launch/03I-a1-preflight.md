# 03I — Preflight de A1 (envío y mercado de Colombia), solo lectura

**Fecha:** 2026-09-30 · **Método:** lectura del Admin de la Dev Store con la ventana de Chrome (capturas al 60 %, valores transcritos aquí; sin datos personales ni direcciones) y lectura del storefront con el verificador de esta fase. **No se cambió ningún ajuste**: no se guardó ningún formulario, no se creó ningún pedido ni checkout, no se instaló nada. Lo único que se escribió fue el texto del filtro de búsqueda de una lista de proveedores (`launch/03I-b1-preflight.md`, fila P4) y dos datos de **sesión** del navegador (país y carrito), restaurados al terminar.

Etiquetas: `[MEDIDO-03I]` (visto hoy) · `[MEDIDO-03G]` / `[LEÍDO-03B]` (fase anterior) · `NOT_VERIFIED`.

## 1. Estado actual, medido hoy

| # | Qué | Valor | Etiqueta |
|---|---|---|---|
| S1 | Perfil de envío | Un solo perfil, "Perfil general", con **1 zona: "Domestic – Estados Unidos"**; sucursal de despacho "Shop location", país **Estados Unidos**; opciones: **Express** 15,00 (1 a 2 días hábiles) y **Standard** 8,00 (3 a 5 días hábiles, gratis desde 70,00). La moneda de esos importes no se distingue en pantalla (`$`) | `[MEDIDO-03I]` (coincide con 03E) |
| S2 | Mercados | **Colombia: Activo** (una región: Colombia) y **United States: Activo**. El Admin sugiere crear "European Union" y "Mexico" (no se tocó) | `[MEDIDO-03I]` |
| S3 | Mercado Colombia, ficha | Moneda **Peso colombiano (COP)** (heredada); catálogo **Todos los productos**; descuentos "Todos los elegibles"; dominio/idioma `radaelli-swimwear-dev.myshopify.com` con **Inglés y Español**; impuestos **"Sin recaudación"**; tienda online **Horizon**; "Mercado principal: **Predeterminado de la tienda**"; **Envío: "Sin configurar" — "Sin tarifas de envío"** | `[MEDIDO-03I]` |
| S4 | Aviso del propio Admin en la ficha de Colombia | «**Las tarifas de envío no están configuradas.** Los clientes en Colombia no podrán pagar porque no hay tarifas de envío para este mercado. Crea una zona de envío para Colombia y agrega tarifas.» (botón "Gestionar envío") | `[MEDIDO-03I]` |
| S5 | Menú "Más acciones" de la ficha de Colombia | Solo: "Editar identificador del mercado", "Eliminar mercado" y "Ver tienda online". **No existe una acción "Convertir en mercado principal"** | `[MEDIDO-03I]` |
| S6 | Configuración > General | **Moneda de la tienda: COP**; **Región de copia de seguridad: Colombia**; zona horaria **(GMT-5) Bogotá**; sistema métrico; kg. **Información comercial: entidad "Radaelli Swimwear Dev – entity", país Estados Unidos** («se usa para productos financieros, mercados, apps e impuestos»); **Dirección de la tienda: Estados Unidos**; "Tienda en desarrollo, creada el 28 de septiembre de 2026" | `[MEDIDO-03I]` |
| S7 | Storefront con país CO forzado (verificador, modo G1) | `/products.json`: **0/29 productos y 0/98 variantes disponibles**; `/cart/add.js` → **422**; el país CO sí se aplica a la sesión (C01) y la moneda es COP (C02); `/` y `/en` responden 200 con `es` y `en` (C09); sesión restaurada (C11) | `[MEDIDO-03I]` (confirma 03E/03G) |
| S8 | Visitante nuevo | Con la Dev Store bloqueada por contraseña, una petición sin cookies devuelve la página de contraseña (país `null`): **no se puede medir** desde el navegador de Claude. **Borrar la cookie `localization` no sirve** (la sesión conserva el país en el servidor: dio un PASS falso en una prueba de 03I, ya corregido en el verificador). La sesión de Claude resuelve a **US / COP** | `[MEDIDO-03I]` |

## 2. Hallazgos que ajustan lo escrito en 03F (todos favorecen a la dueña: menos pasos)

| # | Hallazgo | Consecuencia para A1 |
|---|---|---|
| F1 | El mercado **Colombia ya existe, está Activo, en COP, con todo el catálogo**. Lo único que le falta es la tarifa de envío (S3, S4) | Los pasos **M2–M4** del runbook de mercado (confirmar/activar Colombia) **ya están cumplidos**: son solo lectura para Claude |
| F2 | **Moneda de la tienda = COP** y **región de respaldo = Colombia** ya están puestas (S6) | Se cae **M6** (región de respaldo) y **S2** (confirmar COP) del runbook de envío |
| F3 | El menú del mercado **no ofrece "Convertir en mercado principal"**; en el Admin actual la ficha de Colombia muestra "Mercado principal: Predeterminado de la tienda" y la lista tiene un nodo "Predeterminado de la tienda" (S2, S5) | **M5 y M7** del runbook de mercado (hacer principal a Colombia; pasar EE. UU. a Borrador) **no son ejecutables tal como están escritos**. Qué determina el mercado y el país de un visitante nuevo es **NOT_VERIFIED** (conjetura: la entidad comercial o la dirección de la tienda, ver F4). Se **mide** después de crear la zona, en lugar de suponer |
| F4 | Existe una **"entidad comercial" (país Estados Unidos)** que Shopify dice usar para «productos financieros, mercados, apps e impuestos» (S6), además de la "dirección de la tienda" (Estados Unidos) | El paso **M1** (cambiar la dirección de la tienda a Colombia) puede **no bastar** para cambiar mercado por defecto, impuestos o la lista de proveedores de pago. Dónde se cambia la entidad (Configuración de la organización) y si es reversible son **NOT_VERIFIED**: **no se pide ese cambio hasta medirlo** |
| F5 | La zona de EE. UU. y el mercado de EE. UU. pueden **quedar como están** (D4 = dejar inerte): no hay que eliminar nada ni pasar EE. UU. a Borrador para probar en Colombia | Menos riesgo y menos pasos; la decisión D4 queda para el final, sin bloquear |

## 3. Estado mínimo que debe existir después de A1 (para desbloquear el storefront)

1. **Sucursal "Shop location"** con la dirección real de despacho en Colombia (decisión SH-D1; conservar "Inventory … available to fulfill online orders" activado; **no** quitar ni reemplazar la sucursal del perfil).
2. **Zona "Colombia"** en el Perfil general, país completo, con tarifas en **COP** creadas nuevas (no reutilizar las de EE. UU.).
3. **Al menos una tarifa que cubra un carrito de 1 prenda** (159.920 a 199.920) además de la gratuita desde 299.900: depende de la decisión **SH-D2** (`shipping/03F-owner-shipping-runbook.md` § 7). Sin ella, 1 prenda no tiene método de envío y **no se puede pagar** (aunque el catálogo ya figure disponible).
4. (Condicional, después de medir con el verificador) **Dirección de la tienda → Colombia** (M1) y, si el visitante nuevo sigue resolviendo a EE. UU., lo que el Admin permita para el mercado por defecto (F3/F4).

**Nota de nombres:** en `theme/03F-owner-actions-minimal.md` «D1» y «D2» de la fila A1 son los del **runbook de envío** (dirección real y tarifa bajo el umbral) y chocan con «D1» (talla XL) y «D2» (inventario) de la sección D. En 03I se renombran **SH-D1** y **SH-D2** (SH = runbook de envío) y **SH-D3/SH-D4/SH-D5** para el resto.

## 4. Qué compuertas desbloquea A1 (`launch/03G-launch-acceptance-checklist.md`)

| Compuerta | Qué pasa con A1 | Cómo se verifica |
|---|---|---|
| **AC-01** Checkout en Colombia | Se desbloquea (catálogo disponible, `add.js` 200, checkout `es-co`) | Verificador C01–C04 + sonda del checkout (K1–K4) |
| **AC-03** Envíos | Se desbloquea la corrida T0–T12 y, al final, el cerrojo `free_shipping_rate_confirmed` | Verificador C05–C08 (T1, T3, T4, T8); T5–T7 y T10 en el checkout **con la dueña** (códigos de descuento y dirección de prueba) |
| **AC-04 a AC-10** (pagos, pedido, correo, reembolso) | **Precondición**: sin A1 no se llega a la pantalla de pago en Colombia | Ver `launch/03I-b1-preflight.md` |
| **AC-22** Móvil (checkout a 390 px) | Precondición | Requiere ventana visible o el teléfono de la dueña (CT-26) |
| **AC-21** Búsqueda con país CO; **HP-18/HP-21** recaptura de la Home con país CO | Se puede repetir con el catálogo disponible | Claude, sin entrada nueva de la dueña |
| **HP-16** letra chica de envío gratis | Se cierra al encender el cerrojo | Tras T1–T7 y T10 |

## 5. Verificador post-A1 (listo)

- **Archivo:** `launch/tools/03i-post-a1-verify.js` (se pega en la herramienta de JavaScript del navegador, en una pestaña del storefront con la contraseña de la Dev Store ya desbloqueada). Opciones: `globalThis.__A1_OPTS = { mode: 'G1' | 'AFTER', d2: 'pending' | 'a' | 'b' | 'c' | 'unknown', x: <precio COP> }`.
- **Modos:** `G1` = justo después de la zona de envío (compuerta G1 del runbook de envío); `AFTER` = al terminar todo A1 (exige además que un visitante nuevo resuelva a CO; en la Dev Store con contraseña ese chequeo (C10) da **REVIEW**, porque hay que leerlo en una ventana de incógnito de la dueña: `Shopify.country` en la consola).
- **Qué comprueba (12 chequeos):** C00 sesión y carrito vacío · C01 país CO aplicado · C02 moneda COP · C03 catálogo 29/29 y 98/98 · C04 agregar 1 prenda (200, COP, total = precio) · C05 tarifa para 1 prenda según SH-D2 · C06 y C07 envío gratis en carritos ≥ 299.900 (T3, T4) · C08 zona = país completo (Bogotá, Amazonas, San Andrés; nombres de provincia NOT_VERIFIED → REVIEW) · C09 `/` en español y `/en` en inglés · C10 visitante nuevo · C11 sesión restaurada. Veredictos: `A1_UNLOCKED`, `A1_UNLOCKED_REVIEW`, `A1_PARTIAL`, `A1_NOT_UNLOCKED`, `BLOCKED`.
- **Garantías (probadas por `03i-post-a1-verify.selftest.mjs`):** solo llama a 10 endpoints de lectura/sesión; **nunca** abre `/checkout`, ni el Admin, ni rutas de pedidos; no crea pedidos; no cambia mercado, envío ni pagos; se detiene sin tocar nada si el carrito ya tenía ítems o si el storefront está bloqueado; restaura país y carrito (con reintentos) también si Shopify limita las peticiones (429).
- **Pruebas del verificador:** autoprueba con storefront simulado, **17 escenarios / 579 aserciones, 0 fallas**; **16/16 mutantes detectados** (`03i-post-a1-verify.mutants.mjs`); corrida en vivo en la Dev Store: `A1_NOT_UNLOCKED`, coincide con el escenario "estado actual" (C03 y C04 en FAIL, C05–C08 dependientes en FAIL, C01/C02/C09/C11 en PASS).
- **Límite operativo medido:** dos corridas seguidas + cargas repetidas hicieron que Shopify respondiera **429 "Verifying your connection…"** a los `fetch` durante varios minutos; se cae con una navegación normal. **Correr el verificador como máximo 2 veces seguidas y esperar 10 a 15 minutos entre tandas.**
- **Lo que NO cubre:** códigos de descuento (T5–T7: se prueban en el checkout con la dueña), la pantalla del checkout (se lee **por navegación** con `03i-checkout-probe.js`, porque un `fetch` a `/checkout` da 403) y el móvil real.

## 6. Orden interno recomendado de A1 (por dependencia)

1. **A1a (dueña):** SH-D1 (dirección real de despacho) + SH-D2 (tarifa bajo el umbral) → sucursal (S1) → zona Colombia y tarifas (S4–S6).
2. **G1 (Claude):** verificador en modo `G1`. Debe dar `A1_UNLOCKED` (o `A1_UNLOCKED` con `d2: 'pending'` si SH-D2 aún no se decidió: entonces no es lanzable).
3. **Medición (Claude/dueña):** visitante nuevo en incógnito (C10). Solo si sigue en EE. UU. y el objetivo lo exige → **A1b:** dirección de la tienda a Colombia (M1), con el aviso de F4.
4. **Verificación final (Claude):** modo `AFTER` + sonda del checkout (`--expect after-a1`).

Por qué la zona va **antes** que la dirección: la regla documentada ("los mercados solo se activan con tarifas" y "los países solo entran a zonas si pertenecen a un mercado") y el control G1 del runbook de envío. Con la evidencia de hoy (F1–F4) el orden se **refuerza**: la zona es lo único que el propio Admin señala como faltante.

## 7. Límites de esta lectura

- No se abrió la ficha del mercado Estados Unidos, la lista de Sucursales (Configuración > Sucursales) ni la página de la organización (entidad comercial). Las direcciones no se transcriben (solo el país).
- La moneda de las tarifas de EE. UU. (`$ 15,00`, `$ 8,00`) sigue **NOT_VERIFIED** (mismo símbolo para COP y USD).
- Qué determina el país de un visitante nuevo en esta tienda es **NOT_VERIFIED** hasta medirlo en incógnito.
