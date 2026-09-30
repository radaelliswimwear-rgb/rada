# 03F: Search & Discovery, runbook de la dueña (Talla, Color y Precio)

- **Fecha:** 2026-09-29 (Bogotá). Las fuentes web se leyeron hoy (sección 12), salvo la marcada como leída solo en 03E.
- **Estado: SOLO DOCUMENTO.** No se instaló nada, no se aceptó ningún permiso, no se tocó la tienda. Los conteos se recalcularon contra `import/shopify-products-03c.csv` (sección 4).
- **Tienda:** Development Store `radaelli-swimwear-dev`. Theme Radaelli `189072474431` **sin publicar**. Horizon (`189072113983`) no se toca.
- **Documento base:** [`03E-search-discovery-prep.md`](03E-search-discovery-prep.md) ("prep"). Este runbook lo vuelve ejecutable y corrige lo que quedó desactualizado (sección 13).
- **Convenciones:**
  - `DOC` = leído hoy en fuente oficial.
  - `MEDIDO` = medido en la Dev Store por 03D o 03E.
  - `CODE` = repo, con `archivo:línea`.
  - `INFERENCIA` = deducido.
  - **`NOT_VERIFIED`** = no confirmable con una fuente permitida, siempre con la prueba que lo resuelve.
  - **`NOT_AVAILABLE`** = no existe.

---

## 0. Resumen

1. **Instalar la app es un consentimiento OAuth: solo Daniela** (sección 2). No hay vía sin la app para agregar Talla y Color (prep § 3).
2. **Filtros objetivo: Talla** (opción de producto `Talla`), **Color** (metafield `custom.color`) y **Precio**. **Sin Disponibilidad**: el inventario no se rastrea, así que Shopify marcaría todo "En existencia", y con país CO hoy todo figura agotado (C2).
3. **Los conteos del prep están bien.** Se recalcularon contra el CSV: S 29, M 29, L 28, XL 11 y "L y XL" 1 (suman las 98 variantes). Color: 12 valores, suman 29 productos.
4. **El theme no necesita cambios** (confirmado leyendo `snippets/collection-filters.liquid`, sección 6). No se editó nada.
5. **Correcciones al prep** (sección 13): los números de línea quedaron desplazados, los chips usan `aria-current` y no `aria-pressed`, y la prueba "XL + NEGRO" solo se alcanza editando la URL.
6. **Desinstalar:** la doc oficial no dice qué pasa con los filtros. Un indicio de Shopify de 2022 dice que siguen funcionando, pero es un indicio (sección 9).
7. **Los filtros de la app son de la tienda, no de un theme.** Horizon (el theme live) también los verá si su plantilla de colección usa filtros. No se edita, pero conviene saberlo (INFERENCIA, sección 10, NV12).

**Tiempo total estimado (estimación de Claude, no medida): ≈ 20 min de Daniela** (5 min de instalación y permisos + 15 min de configuración), **más ≈ 45–60 min de QA de Claude** (sección 8).

---

## 1. Estado de partida

| Punto | Estado | Evidencia |
|---|---|---|
| Search & Discovery instalada | **NO** (solo Translate & Adapt) | MEDIDO, 03E |
| Filtros nativos hoy | Disponibilidad (`filter.v.availability`) y Precio | MEDIDO, 03D |
| Disponibilidad en el theme | Oculta: `collection_show_availability_filter` = `false` | `theme-src/config/settings_data.json:38`; `snippets/collection-filters.liquid:113-115` |
| Filtros y orden activos | `collection_enable_filters` = `true`; `collection_enable_sorting` = `true` | `theme-src/config/settings_data.json:37`, `:39` |
| Inventario | No rastreado: la columna `Inventory tracker` está vacía en las 98 variantes | `import/shopify-products-03c.csv` (re-verificado hoy: valores = solo vacío) |
| Definición `custom.color` | Texto de una línea, 29/29 con valor | `theme/03C-catalog-import-report.md:76` |
| Moneda | COP | `theme/03B-store-foundation-report.md:91` |
| País de la sesión | Hoy resuelve a **US** (C1). Con país CO todo figura agotado (C2) | `theme/03E-checkout-baseline-report.md` |
| Filtros en la página de búsqueda | No se dibujan (`sections/main-search.liquid`); el sitio real tampoco los tiene | prep § 1 |

**Requisitos previos:**

- **Permisos de la persona que usa la app** (S4): Products, Online Store Search and Navigation y Reports. Daniela es la dueña y los tiene.
- **Theme compatible:** para que los filtros se vean, el theme debe soportarlos (S5). El theme Radaelli lee `collection.filters`, así que los soporta (`snippets/collection-filters.liquid:64`, `:112`).
- **Independiente del mercado Colombia:** esta instalación no depende de [`03F-owner-market-colombia-runbook.md`](03F-owner-market-colombia-runbook.md). Los conteos pueden variar entre US y CO por C2 (QA28), así que se repite el QA cuando ese runbook esté hecho.

---

## 2. OAuth de la dueña: permisos exactos según la ficha oficial

Fuente: la ficha de la app, leída hoy (S1). **Desarrollador: Shopify. Precio: gratis.** La ficha dice: "This app needs access to the following data to work on your store."

| Grupo (como lo muestra la ficha) | Detalle |
|---|---|
| **View staff and contributor data** | Dueña de la tienda: nombre, correo, teléfono y dirección física. Personal: nombre, correo y teléfono |
| **Edit products** | Productos y colecciones |
| **View staff accounts** | Cuentas del personal |
| **View Online Store** | Revisión de cookies web y píxeles de seguimiento de conversiones |
| **Edit custom data** | Definiciones de metaobjetos y metaobjetos |
| **View other services** | Apps |
| **Edit other data** | Discovery API, sinónimos de búsqueda de la tienda online, navegación de la tienda online, recomendaciones de productos, publicación de productos en canales de venta y datos privados de cuentas del personal |

- **Clientes y pedidos: no figuran en la ficha.** Es la señal de alerta principal.
- **Regla (recomendación de Claude):**
  1. Daniela captura la pantalla real **antes** de pulsar Instalar y la pasa a Claude.
  2. Se compara con esta tabla.
  3. Si coincide: instalar.
  4. Si pide algo que no está aquí, **en especial clientes o pedidos: no aceptar**, cancelar y avisar.
- **`NOT_VERIFIED`:** que la pantalla real coincida con la ficha. Se ve recién al instalar (prueba: la captura del paso S2).
- **Facturación:** la app es gratis. Si aparece cualquier pantalla de plan, cargo o método de pago: **parar**.

---

## 3. Pasos: instalación y configuración

**Tiempo total de Daniela: ≈ 20 min.** Quién: los pasos S1 a S3 son solo de Daniela (OAuth). Los pasos S4 a S11 los puede hacer Daniela, o Claude con la ventana del Admin abierta y un OK explícito en el chat.

Los nombres de botones siguen la doc en inglés. En el Admin en español pueden aparecer traducidos (`NOT_VERIFIED`).

| Paso | Dónde | Acción exacta | Resultado esperado | Rollback |
|---|---|---|---|---|
| S1 | Navegador con la sesión de la tienda `radaelli-swimwear-dev` | Abrir https://apps.shopify.com/search-and-discovery y pulsar **Install** (o buscar la app desde el Admin) | Aparece la pantalla de permisos de Shopify | Cerrar la pantalla sin aceptar |
| S2 | Pantalla de permisos | **Capturar sin aceptar** y enviar a Claude. Comparar con la tabla de la sección 2 | Coincide con la ficha | **Si no coincide o pide clientes o pedidos:** no aceptar, cancelar y avisar |
| S3 | Pantalla de permisos | Pulsar **Install** (Daniela) | La app aparece en Apps > Search & Discovery | Configuración > Apps > Search & Discovery > Desinstalar (sección 9). Reintentar una vez si falla y anotar el mensaje |
| S4 | Apps > Search & Discovery > **Filters** | **Capturar la lista inicial** de filtros, sin cambiar nada | Esperado: Availability y Price (S7, leída en 03E). Si además aparecen Category, Product type, Vendor o Tags: `NOT_VERIFIED` (prueba: esta captura) | No aplica |
| S5 | Ídem | Quitar **Availability** de la lista (menú del filtro > eliminar) | La lista deja de tener Availability | Volver a agregarlo con **Add filter** > Availability. El theme lo oculta igual (`collection-filters.liquid:113-115`). Si la app no deja quitarlo: dejarlo y anotarlo |
| S5b | Ídem | Si S4 mostró Category, Product type, Vendor o Tags: quitarlos. **Talla, Color y Precio son los únicos** (el sitio real no tiene otros) | La lista queda solo con Precio | Volver a agregarlos con **Add filter** |
| S6 | Filters > **Add filter** (Talla) | Source: **Product option** > la opción **Talla**. Filter label: **Talla**. Sort values: **Manual**, arrastrar en el orden **S, M, L, L y XL, XL**. Empty values: **Hide**. **No** agrupar "L y XL" (salvo decisión D1). **Save** | Filtro "Talla" con 5 valores en ese orden | Editar o quitar el filtro (Filters). **Si "Talla" no aparece como fuente:** esperar unos minutos y reintentar (índice de opciones; `NOT_VERIFIED`). **Si no aparece "Manual" para esta fuente:** dejar el orden automático y anotarlo (NV5). Con el automático, "Size" tiene un orden especial de tallas en la doc; que aplique a "Talla" es `NOT_VERIFIED` |
| S7 | Filters > **Add filter** (Color) | Source: **Product metafield** > **Color** (`custom.color`). Filter label: **Color**. Sort values: **Automatic**. Empty values: **Hide**. **No** renombrar ni agrupar valores. **Save** | Filtro "Color" con 12 valores en MAYÚSCULAS (sección 4.2) | Editar o quitar el filtro. **Si el metafield no aparece:** revisar Configuración > Metacampos y metaobjetos > Productos que exista la definición `custom.color` (`03C-catalog-import-report.md:76`) y que su acceso al Storefront esté activo |
| S8 | Filters | Confirmar que **Price** siga en la lista. Si no está: **Add filter** > Price | Precio en la lista | Volver a agregar Price |
| S9 | Filters | Ordenar la lista arrastrando: **Talla, Color, Precio** (el orden del sitio real, `components/catalog/catalog-filters.tsx:180-182`) | Orden guardado | Si la app no deja reordenar: aceptar el orden que dé y anotarlo |
| S10 | Apps > Search & Discovery | **No** tocar Search, Recommendations, Synonyms ni Boosts. No hay datos reales que cargar y no se inventan (prep § 4.6) | Sin cambios | No aplica |
| S11 | Navegador | Abrir `https://radaelli-swimwear-dev.myshopify.com/collections/oasis-natural?preview_theme_id=189072474431` y mirar a ojo | Se ven los grupos **Talla**, **Color** y **Precio**, sin Disponibilidad | Si no se ven: no editar nada; avisar a Claude con una captura |
| S12 | Chat | Enviar la captura final de la lista de Filters y escribir "S&D listo" | Claude corre el QA de la sección 8 | No aplica |

**Límites oficiales que no se alcanzan** (S3): hasta 25 filtros por tienda; 100 valores mostrados por filtro; una misma fuente solo se usa una vez; las colecciones de más de 5.000 productos no muestran filtros. Radaelli usa 3 filtros, con 12 valores como máximo, en colecciones de hasta 12 productos.

---

## 4. Configuración objetivo y conteos verificados contra el CSV

Fuente: `import/shopify-products-03c.csv`. Recalculado hoy: **29 productos y 98 variantes**, todos activos y publicados. Todas las variantes usan una sola opción, `Talla`. Los conteos son de **productos**; como cada producto tiene una sola variante por talla, coinciden con los de variantes.

### 4.1 Talla (opción de producto `Talla`)

| Valor | Total | Oasis Natural (10) | Espuma de Ola (7) | Aurora Viva (12) | Destacados (7) |
|---|---|---|---|---|---|
| S | **29** | 10 | 7 | 12 | 7 |
| M | **29** | 10 | 7 | 12 | 7 |
| L | **28** | 10 | 7 | 11 | 7 |
| L y XL | **1** | — | — | 1 (`camiseta-solar-waves-negro`, que tiene S, M y "L y XL") | — |
| XL | **11** | — | — | 11 | 3 |

- **Confirmado contra el CSV:** S 29, M 29, L 28, XL 11 y "L y XL" 1. Suman 98, igual que las variantes.
- **Conjuntos de tallas por producto en el CSV:** `S/M/L`, `S/M/L/XL` y `S/M/L y XL`. No existe ningún otro.
- **Destacados** es una colección **manual** de 7 productos (4 de Espuma de Ola y 3 de Aurora Viva; `theme/03D-missing-assets-audit.md:146-156`). No está en la columna `Collection` del CSV; sus conteos se calcularon con esos 7 handles y coinciden con el prep.
- **Orden de valores:** S, M, L, L y XL, XL. Con **Manual** se respeta. Con automático saldría L, L y XL, M, S, XL (`NOT_VERIFIED`).
- **Decisión D1 (dueña):** qué hacer con "L y XL" (sección 11).

### 4.2 Color (metafield de producto `custom.color`)

| Valor (tal cual) | Total | Oasis Natural | Espuma de Ola | Aurora Viva | Destacados |
|---|---|---|---|---|---|
| NEGRO | 6 | 3 | 2 | 1 | 2 |
| BEIGE | 3 | 3 | — | — | — |
| BEIGE SUAVE | 3 | — | — | 3 | 1 |
| TERRACOTA | 3 | — | 1 | 2 | — |
| AZUL | 2 | 2 | — | — | — |
| AZUL OSCURO | 2 | — | — | 2 | 1 |
| NARANJA | 2 | 2 | — | — | — |
| LILA | 2 | — | — | 2 | 1 |
| CAFÉ CLARO | 2 | — | — | 2 | — |
| VERDE OLIVA | 2 | — | 2 | — | 1 |
| MOSTAZA | 1 | — | 1 | — | 1 |
| BLANCO | 1 | — | 1 | — | — |

- **12 valores, suman 29 productos.** Todos en MAYÚSCULAS, tal como están guardados.
- **Tipo soportado:** `single_line_text_field` es filtrable (S3, S6).
- **No se renombran ni se agrupan** valores (p. ej. BEIGE con BEIGE SUAVE): sería inventar una taxonomía de color (prep § 4.2).
- **Dato conocido (03C):** `bikini-shadow-azul-marino` y `enterizo-shadow-palm-azul-marino` tienen `custom.color` = NEGRO. El filtro los mostrará en NEGRO. Viene de la fuente de datos (decisión D3).

### 4.3 Precio (ya activo)

- Cuatro precios de producto: **$159.920 (6), $167.920 (9), $183.920 (10) y $199.920 (4)**. Recalculado hoy: coincide con el prep.
- **Por colección:** Oasis Natural, 6 a $183.920 y 4 a $199.920. Espuma de Ola, 5 a $159.920 y 2 a $183.920. Aurora Viva, 1 a $159.920, 9 a $167.920 y 2 a $183.920.
- **Condición oficial:** "The price filter doesn't display for currencies other than your shop's default currency" (S3). Hoy la moneda es COP.

### 4.4 Disponibilidad: NO

- Motivo 1: sin inventario rastreado, todo figuraría "En existencia" (`collection-filters.liquid:35-38`, comentario del snippet).
- Motivo 2: con país CO hoy **0 de 29** productos están disponibles (C2). Un filtro "En existencia" daría 0 resultados.
- Dos barreras independientes: se quita en la app (S5) y el theme la oculta aunque exista (`:113-115`).
- Se reconsidera cuando haya inventario real **y** exista la zona Colombia.

### 4.5 Colecciones y handles

| Colección | Handle | Productos (CSV) |
|---|---|---|
| Oasis Natural | `oasis-natural` | 10 |
| Espuma de Ola | `espuma-de-ola` | 7 |
| Aurora Viva | `aurora-viva` | 12 |
| Destacados (manual) | `destacados` | 7 |
| Salidas de Baño | `salidas-de-bano` | **0** (ningún producto la lista en el CSV; 03E la registra vacía) |

---

## 5. Handles y parámetros de URL esperados

Los nombres de parámetros siguen el formato oficial (S6). Los valores concretos, con tildes, espacios y mayúsculas, se anotan en la primera prueba.

| Filtro | Parámetro esperado | Qué dice la doc | Estado | Prueba que lo resuelve |
|---|---|---|---|---|
| Talla | `filter.v.option.talla` | Formato `filter.v.option.<name>`; el ejemplo oficial va en minúsculas (`filter.v.option.color`) | Formato **DOC**. Que "Talla" se normalice a `talla`: **NOT_VERIFIED** | QA4: tocar Talla S y leer la URL |
| Color | `filter.p.m.custom.color` | Formato `filter.p.m.<namespace>.<key>`. Es un filtro de producto (`p`), no de variante | Formato **DOC**. Es un filtro de **producto**: no depende de qué variante coincida | QA5 |
| Precio | `filter.v.price.gte` y `filter.v.price.lte` | El valor es "a single monetary value in the format of the shop's default currency" (por ejemplo `5` o `20.40`): unidades de moneda, en COP pesos | **DOC** + **MEDIDO** (03D: se envió `gte=200000` y Shopify devolvió 20000000, en centavos) | QA7 |
| Disponibilidad | `filter.v.availability=0` o `=1` | Formato oficial | Oculta | QA25 |
| Orden | `sort_by=<valor>` (esperado `price-ascending` para "Precio: menor a mayor") | Lo define `collection.sort_options` (9 opciones, 03D) | Valor concreto **NOT_VERIFIED** | QA6 (anotar el real) |
| Valores con espacios y tildes ("L y XL", "CAFÉ CLARO") | Codificados en la URL (p. ej. `L+y+XL` o `L%20y%20XL`) | La doc no especifica la codificación | **NOT_VERIFIED** | QA14 y QA12 |

**Lógica de combinación** (S6, DOC):

- **Dentro de un mismo filtro:** los valores se combinan con **O** (por ejemplo, `filter.v.option.color=red,blue` devuelve rojo O azul). Se admiten valores separados por coma o el parámetro repetido.
- **Entre filtros distintos:** se combinan con **Y**.
- Cuál de las dos formas de repetir usa `url_to_add` cuando hay dos valores del mismo grupo: **NOT_VERIFIED** (prueba: QA14).
- Esto coincide con el sitio real: O dentro de un grupo, Y entre grupos (`lib/catalog/catalog-actions.ts:90-113`, según prep § 4.5).

**El theme no depende de los nombres de parámetros:** usa `filter.param_name` y `value.url_to_add` / `url_to_remove` (`snippets/collection-filters.liquid:91`, `:121`, `:181`). Lo que se mide aquí es para documentar, no porque el theme lo necesite.

---

## 6. Qué cambia en el theme: nada (confirmado leyendo el snippet)

Leído hoy: `snippets/collection-filters.liquid` (194 líneas), `sections/main-collection.liquid` y `assets/collection-filters.js`. **No se editó ningún archivo.**

| Tipo que devuelve Shopify | Cómo lo dibuja el theme | Líneas actuales |
|---|---|---|
| `list` (Talla, Color) | Chips `<a>` con `url_to_add` / `url_to_remove`, `aria-current="true"` cuando están activos y texto `Etiqueta (conteo)`. **Oculta los valores con conteo 0 que no estén activos** | `collection-filters.liquid:174-191` (ocultar en `:179`; enlace en `:181`; `aria-current` en `:183`) |
| `price_range` (Precio) | Formulario Mínimo–Máximo en unidades (÷ 100), que conserva los demás filtros activos y el orden | `:116-158` (÷ 100 en `:137` y `:149`) |
| `boolean` | Chips | `:159-173` |
| `filter.v.availability` | Se salta salvo que `collection_show_availability_filter` sea `true` | `:113-115` |
| Orden (`sort_by`) | `select` con botón "Aplicar", que conserva filtros activos y rango de precio; se valida contra `collection.sort_options` | `:51-58`, `:78-109` |
| "Limpiar" | Vuelve a la colección y conserva `sort_by` si no es el predeterminado | `:59-62`, `:73-75` |
| Sin filtros en `collection.filters` | No se dibuja ningún grupo | comentario `:21-25` |
| Dónde se renderiza | Barra lateral (`main-collection.liquid:63-65`) y cajón móvil (`:91-111`), con ids únicos por contexto | `collection-filters.liquid:40-47` |
| Sin resultados | `collections.general.no_matches` | `main-collection.liquid:84-86` |

**Veredicto: con Talla, Color y Precio, y sin Disponibilidad, el theme funciona tal cual.** Coincide con 03E.

### Observaciones (ninguna es un defecto que bloquee; no se editó nada)

| # | Observación | Dónde | Efecto |
|---|---|---|---|
| O1 | **En móvil, cada chip recarga la página y el cajón vuelve cerrado.** Los chips son enlaces (`<a href>`) y el cajón solo abre con el botón de la barra. Para sumar un segundo filtro hay que reabrirlo. Es coherente con la decisión 03D de "funcionan SIN JavaScript" | `collection-filters.liquid:181`; `assets/collection-filters.js:81-112` (no hay lógica de reapertura; el único cierre automático es en `pageshow`, `:182-199`) | Fricción de uso, no un error. Se prueba en QA20 y se anota. Cambiarlo sería una fase posterior |
| O2 | **El título de un grupo se dibuja aunque ningún chip sea visible.** Si todos los valores tuvieran conteo 0 e inactivos, quedaría un título vacío | `:176` (título) frente a `:179` (ocultar valores) | Con **Hide** en la app, Shopify oculta el filtro entero si todos sus valores están vacíos (S2, S3), así que no debería pasar. Se prueba en QA19 |
| O3 | `filter.label` se imprime sin `escape` (los rótulos de valores sí se escapan) | `:128`, `:161`, `:176` frente a `:169`, `:185` | La etiqueta la escribe la dueña en la app, no la visitante. No es explotable por una visitante. Solo informativo |

---

## 7. Cómo leer la matriz de QA

- **Base:** `https://radaelli-swimwear-dev.myshopify.com/collections/<handle>?preview_theme_id=189072474431`, en el preview del theme Radaelli y **nunca en Horizon**. Si al tocar un chip la tienda pasa a mostrar Horizon, se perdió el preview: reabrir con el parámetro y anotarlo (NV13).
- **Resoluciones:** 375 px (cajón móvil) y 1280 px (barra lateral).
- **País:** hoy la sesión resuelve a US (C1). Anotar `Shopify.country` en cada corrida (QA28).
- **Resultado:** columna en blanco para Claude.

---

## 8. Matriz de QA

**Tiempo estimado de Claude: 45–60 min** (estimación, no medida).

| # | Caso | Pasos | Esperado | Resultado |
|---|---|---|---|---|
| QA1 | Grupos visibles en Oasis Natural, 1280 px | Abrir `/collections/oasis-natural` | Orden, **Talla**, **Color** y **Precio**, en ese orden. **Sin Disponibilidad** | |
| QA2 | Chips de Talla en Oasis Natural | Mirar el grupo Talla | S (10), M (10), L (10). **Sin** XL ni "L y XL" | |
| QA3 | Chips de Color en Oasis Natural | Mirar el grupo Color | AZUL (2), BEIGE (3), NARANJA (2), NEGRO (3) | |
| QA4 | Activar Talla S | Tocar el chip S | 10 productos. La URL suma el parámetro de talla (esperado `filter.v.option.talla=S`; **anotar el real**). El chip queda activo con **`aria-current="true"`**. Aparece "Limpiar" | |
| QA5 | Sumar Color NEGRO | Con QA4 activo, tocar NEGRO | 3 productos: `costa-esmeralda-negro`, `arena-dorada-negro`, `oasis-serena-negro`. La URL lleva los dos parámetros (esperado `filter.p.m.custom.color=NEGRO`; **anotar el real**) | |
| QA6 | Orden con filtros | Con QA5, elegir "Precio: menor a mayor" | Se conservan los dos filtros. Orden: los dos de $183.920 primero y `oasis-serena-negro` ($199.920) al final. Anotar el valor real de `sort_by` | |
| QA7 | Rango de precio | Con QA5, Mínimo 150000 y Máximo 190000, y aplicar | **2 productos** (`costa-esmeralda-negro` y `arena-dorada-negro`, ambos $183.920). Los campos muestran 150000 y 190000, **no** ×100. La URL lleva `filter.v.price.gte=150000` y `filter.v.price.lte=190000` | |
| QA8 | Limpiar | Tocar "Limpiar" | Vuelve a la colección sin filtros y conserva `sort_by` si no era el predeterminado | |
| QA9 | Atrás y adelante | Aplicar QA4 y QA5, y usar Atrás y Adelante del navegador | Chips, `select` y campos de precio coinciden con la URL en cada paso (`assets/collection-filters.js:182-199`) | |
| QA10 | O dentro de un grupo | En Oasis Natural, tocar Color AZUL y luego NARANJA | **4 productos** (2 + 2). Anotar cómo repite la URL el parámetro (coma o repetido) | |
| QA11 | Aurora Viva: chips de Talla | Abrir `/collections/aurora-viva` | S (12), M (12), L (11), **L y XL (1)**, XL (11), en ese orden si quedó **Manual** | |
| QA12 | Aurora Viva con XL activo | Tocar XL | 11 productos. Chips de Color: BEIGE SUAVE (3), LILA (2), AZUL OSCURO (2), TERRACOTA (2), CAFÉ CLARO (2) (suman 11). **No aparece NEGRO** (su conteo es 0 y el theme oculta los valores en 0, `:179`) | |
| QA13 | Y entre grupos, en 0 | **Escribir la URL a mano** con Talla XL y Color NEGRO (NEGRO no se puede tocar porque no se muestra, QA12) | **0 productos** y el texto de sin resultados (`main-collection.liquid:85`). Solo hay una camiseta NEGRO en Aurora Viva y su talla es "L y XL" | |
| QA14 | O con "L y XL" | En Aurora Viva, tocar L y luego "L y XL" | **12 productos** (11 + 1). Anotar cómo codifica la URL "L y XL" | |
| QA15 | Precio en Aurora Viva | Mínimo 160000 y Máximo 170000 | **9 productos** (los de $167.920). Con máximo 165000 y mínimo 150000: **1** (`camiseta-solar-waves-negro`, $159.920) | |
| QA16 | Espuma de Ola | Abrir `/collections/espuma-de-ola` | Talla: S (7), M (7), L (7), sin XL. Color: MOSTAZA (1), NEGRO (2), TERRACOTA (1), BLANCO (1), VERDE OLIVA (2). Mínimo 170000: **2** (`entero-golden-hour`, `enterizo-shadow-palm-azul-marino`) | |
| QA17 | Destacados | Abrir `/collections/destacados` | Talla: S (7), M (7), L (7), XL (3). Color: NEGRO (2), LILA (1), AZUL OSCURO (1), BEIGE SUAVE (1), VERDE OLIVA (1), MOSTAZA (1) | |
| QA18 | Total de la tienda (opcional) | Si existe `/collections/all`, abrirla | Talla: S (29), M (29), L (28), L y XL (1), XL (11). Color: 12 valores, NEGRO (6) | |
| QA19 | Colección vacía | Abrir `/collections/salidas-de-bano` (0 productos) | Texto de sin resultados. Con **Hide**, Shopify oculta Talla y Color (todos sus valores están vacíos). El grupo Precio puede verse (el theme dibuja el formulario sin mirar conteos, `:116-158`; que Shopify lo devuelva en una colección vacía es **NOT_VERIFIED**). **Anotar** si aparece un título Talla o Color **vacío** (observación O2) | |
| QA20 | Cajón móvil, 375 px | Abrir con el botón "Filtros", tocar un chip, reabrir | El cajón abre y cierra (Escape, botón cerrar, fondo). Al tocar un chip la página **recarga y el cajón vuelve cerrado** (observación O1: esperado según el diseño). El botón final "Ver N productos" coincide con el conteo filtrado (`main-collection.liquid:106`) y cierra el cajón. El foco vuelve al botón de la barra | |
| QA21 | Barra lateral, 1280 px | Repetir QA4 y QA5 | Mismo resultado que en móvil, sin cajón | |
| QA22 | Teclado | Con Tab llegar a los chips y al orden. Enter en un chip. En el `select` de orden, usar las flechas | Foco visible. Enter sigue el enlace. Las flechas **no** navegan; Enter o "Aplicar" sí (`assets/collection-filters.js:144-171`) | |
| QA23 | Orden conserva todo | Con Talla S, Color NEGRO y rango de precio activos, cambiar el orden | Se conservan Talla, Color y precio (campos ocultos `:81-94`, ÷ 100 en `:84` y `:87`) | |
| QA24 | Etiquetas y idioma | Mirar los títulos de grupo en la tienda en español y en `/en` | "Talla", "Color" y "Precio". **Si "Price" aparece en inglés en la versión en español:** anotarlo (NV10). Se corrige nombrando el filtro "Precio" en la app o traduciéndolo con Translate & Adapt (`NOT_VERIFIED` que este recurso exista) | |
| QA25 | Disponibilidad oculta | Escribir `?filter.v.availability=1` a mano | No hay chip de Disponibilidad. Anotar cuántos productos devuelve (con US y con CO) para documentar C2. Si la app quitó el filtro, el parámetro puede ignorarse (`NOT_VERIFIED`) | |
| QA26 | Búsqueda | Abrir `/search?q=negro` | **Sin** panel de filtros (esperado, prep § 1). Mismos resultados que antes de instalar (el predictivo daba 6, `03E-search-final-report.md` § 4) | |
| QA27 | Consola | Abrir la consola en QA1 a QA25 | 0 errores propios de JS. Ningún texto "Liquid error" en la página | |
| QA28 | País | Repetir QA2 y QA11 con `Shopify.country` = US y, cuando exista, = CO (después de [`03F-owner-market-colombia-runbook.md`](03F-owner-market-colombia-runbook.md)) | Los conteos por talla y color **no** deberían cambiar. Si cambian: anotarlo como efecto de C2, no del filtro | |
| QA29 | Horizon | Abrir una colección **sin** preview | Horizon (theme live) puede mostrar ahora Talla y Color si su plantilla usa filtros (INFERENCIA, NV12). Solo anotar; **no editar** | |
| QA30 | Integridad del catálogo | Revisar `/products.json` | Sigue **29 productos, 98 variantes, 95 imágenes** | |

**GO / NO-GO** (adaptado de prep § 9):

| # | Condición | GO | NO-GO |
|---|---|---|---|
| SD1 | La pantalla de permisos coincide con la sección 2 | Instalar | No instalar; revisar con Claude |
| SD2 | Talla y Color disponibles como fuente | Configurar | Esperar e investigar. No se inventan filtros a mano |
| SD3 | QA1 a QA19 sin fallos | Filtros listos para el lanzamiento | Documentar el caso que falla. El theme puede seguir con Precio solo |
| SD4 | QA19 (colección vacía) sin título vacío | OK | Ajuste menor de theme en una fase posterior (no bloquea) |

---

## 9. Rollback y desinstalación, y su efecto en los filtros

| Nivel | Cómo | Efecto en los filtros y en el theme |
|---|---|---|
| **1. Un filtro mal configurado** | Apps > Search & Discovery > Filters > editar o quitar ese filtro | El panel muestra solo lo que devuelve `collection.filters`. **Nada que revertir en el theme** (comentario `collection-filters.liquid:21-25`: si `collection.filters` está vacío, no se dibuja ningún grupo) |
| **2. Disponibilidad visible por error** | Quitarla en la app, o dejar `collection_show_availability_filter` en `false` (ya lo está) | Oculta por el theme |
| **3. Volver a Talla y Color fuera** | Quitar los filtros Talla y Color en la app | Quedan los que queden en la lista (Precio y, si se dejó, Disponibilidad oculta por el theme) |
| **4. Desinstalar la app** | Configuración > Apps > Search & Discovery > menú > Uninstall (S8) | **Qué pasa con los filtros: NOT_VERIFIED en la doc oficial.** Ver abajo |

**Sobre la desinstalación (evidencia, con su nivel de confianza):**

- **Lo que dice la doc general de Shopify** (S8, ALTA): al desinstalar una app, la configuración o los datos previos pueden no restaurarse si se reinstala.
- **Lo que dice un indicio** (S9, **BAJA/MEDIA**): en la ficha oficial de la app, un mensaje de respuesta del desarrollador (Shopify) del **18 de agosto de 2022** dice que se puede desinstalar y que los filtros "keep working as is", pero que para cambiar su configuración hay que reinstalar. **No está en la documentación oficial y tiene 4 años.**
- **Lo que no se encontró:** nada en las páginas de ayuda de Search & Discovery (S2, S3) ni en shopify.dev sobre este efecto.
- **Consecuencia para el theme:** ninguna. Si los filtros desaparecieran, el theme dibuja solo lo que devuelva `collection.filters`, sin error.
- **Recomendación de Claude:**
  1. **No usar la desinstalación como primer rollback.** Usar los niveles 1 a 3.
  2. Antes de desinstalar, capturar la lista de Filters (paso S12) para poder reconstruirla.
  3. Si se quiere saber qué pasa de verdad: desinstalar en esta Dev Store, mirar una colección y reinstalar. Es una prueba **reversible** pero pide un nuevo consentimiento OAuth (solo Daniela) y la configuración puede no volver (NV9).

---

## 10. NOT_VERIFIED y la prueba que lo resuelve

| ID | Qué no se pudo confirmar | Prueba o acción que lo resuelve |
|---|---|---|
| NV1 | Que la pantalla real de permisos coincida con la ficha | Captura en S2 |
| NV2 | Nombre exacto del parámetro de talla (`talla` en minúsculas) | QA4 |
| NV3 | Codificación en la URL de valores con espacios y tildes | QA12 y QA14 |
| NV4 | Si `url_to_add` repite el parámetro o usa coma dentro de un mismo grupo | QA10 y QA14 |
| NV5 | Que el orden **Manual** aparezca para la fuente "opción de producto". Y si el orden automático especial de "Size" aplica a "Talla" | Paso S6 |
| NV6 | Lista de filtros que trae la app recién instalada (¿solo Availability y Price?) | Captura en S4 |
| NV7 | Si Shopify devuelve el grupo Precio en una colección vacía | QA19 |
| NV8 | Si los conteos cambian según el país (C2) | QA28 |
| NV9 | Qué pasa con los filtros al desinstalar (solo un indicio de 2022) | Prueba de desinstalar y reinstalar (sección 9), solo si hace falta |
| NV10 | Si "Precio" y los rótulos salen en español, y si Translate & Adapt traduce rótulos de filtros | QA24 |
| NV11 | Etiquetas del Admin en español | Al ejecutar |
| NV12 | Si Horizon (theme live) muestra ahora los filtros nuevos | QA29 |
| NV13 | Si el preview del theme se conserva al navegar con `url_to_add` | Sección 7 y QA4 |

---

## 11. Decisiones de la dueña

| # | Decisión | Opciones | Qué implica |
|---|---|---|---|
| D1 | Qué hacer con el valor de talla **"L y XL"** (1 producto: `camiseta-solar-waves-negro`) | **A (por defecto):** dejarlo como valor propio, exactamente como dice la variante. **B:** agruparlo con L o con XL (la app permite agrupar valores) | A no inventa nada. B es una decisión de producto: ¿cuenta como L, como XL o como ambas? Con A, alguien que filtre solo XL no ve esa camiseta |
| D2 | Mayúsculas de los colores (NEGRO, BEIGE…) | Dejarlas como están (por defecto) o renombrarlas con la agrupación de la app | Renombrar exige mantener una lista propia. No se hace sin decisión |
| D3 | `bikini-shadow-azul-marino` y `enterizo-shadow-palm-azul-marino` figuran como NEGRO (dato de 03C) | Dejarlos así o corregir el dato en el catálogo | El filtro NEGRO mostrará productos que se llaman "azul marino" |

---

## 12. Seguimiento inmediato de Claude

Cuando Daniela escriba "S&D listo":

1. **Verificar la instalación** en solo lectura: la app aparece instalada y la captura de permisos coincide con la sección 2.
2. **Correr el QA** de la sección 8 (QA1 a QA30), en 375 px y en 1280 px, anotando el país de cada corrida.
3. **Cerrar los NOT_VERIFIED** de la sección 10 con lo medido: parámetros reales, codificación, orden Manual, lista inicial de filtros.
4. **Confirmar que nada más cambió:** Horizon `live`, theme Radaelli `unpublished`, catálogo 29/98/95 y búsqueda 29/29.
5. **Registrar el resultado** en un documento nuevo. Los NOT_VERIFIED resueltos y las correcciones de la sección 13 quedan ahí; no se reescribe 03E.
6. **Si QA19 muestra un título de grupo vacío** (O2) o si O1 resulta molesta en móvil: proponer un ajuste de theme para una fase posterior, con archivo y línea. No se edita ahora.
7. **Repetir QA2, QA11 y QA28** cuando exista el mercado Colombia.
8. **Claude no** acepta permisos, no instala la app por Daniela y no configura nada sin un OK explícito en el chat.

---

## 13. Diferencias frente a `03E-search-discovery-prep.md`

| # | El prep decía | Hoy |
|---|---|---|
| 1 | Líneas de `collection-filters.liquid`: `:100-181`, `:102-104`, `:105-147`, `:148-162`, `:163-179`, `:67-98`, `:48-51` | El archivo cambió con RC1.5. Líneas actuales en la sección 6 (Disponibilidad `:113-115`, Precio `:116-158`, `boolean` `:159-173`, `list` `:174-191`, orden `:78-109`, "Limpiar" `:59-62`) |
| 2 | § 6 y Q4: chips con `aria-pressed` | Los chips usan **`aria-current="true"`** (`:167`, `:183`), como dice 03E § B ("`aria-current` en chips") |
| 3 | Q11: "Aurora Viva: Talla XL + Color NEGRO → 0 productos" | Con XL activo el chip NEGRO **no se muestra** (conteo 0, `:179`). Solo se alcanza **escribiendo la URL** (QA13) |
| 4 | § 8: qué pasa al desinstalar = NOT_VERIFIED | Sigue sin estar en la doc, pero hay un indicio dado por Shopify en 2022 (BAJA/MEDIA) y una advertencia general de que reinstalar puede no restaurar la configuración (sección 9) |
| 5 | Sin mención de Horizon | La configuración de la app es de la tienda: Horizon puede mostrar los filtros (QA29) |
| 6 | Sin mención del cajón móvil | El cajón se cierra tras cada chip (O1) |
| 7 | Pasos § 5 | Se agregaron capturas (S2, S4, S12) y el paso condicional S5b |

---

## 14. Fuentes (leídas el 2026-09-29)

| ID | URL | Se usó para |
|---|---|---|
| S1 | https://apps.shopify.com/search-and-discovery | Permisos exactos, desarrollador y precio |
| S2 | https://help.shopify.com/en/manual/online-store/search-and-discovery/filters | Pasos, fuentes, ordenar valores (Manual), valores vacíos (Hide), agrupación, límites |
| S3 | https://help.shopify.com/en/manual/online-store/storefront-search/search-and-discovery-filters | Tipos de metafield, condición de moneda del filtro de precio, filtro oculto si todos sus valores están vacíos, límites y filtros por defecto |
| S4 | https://help.shopify.com/en/manual/online-store/storefront-search | Permisos del personal (Products, Online Store Search and Navigation, Reports) |
| S5 | https://help.shopify.com/en/manual/online-store/themes/customizing-themes/common-customizations/storefront-filters | El theme debe ser compatible con los filtros |
| S6 | https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/storefront-filtering | Formato de parámetros de URL, lógica O/Y, formato del precio y tipos filtrables |
| S7 | https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/filter-products | Filtros por defecto de la app. **Leída en 03E, no releída hoy** |
| S8 | https://help.shopify.com/en/manual/apps/uninstalling-apps | Cómo desinstalar y advertencia sobre restaurar la configuración |
| S9 | https://apps.shopify.com/search-and-discovery/reviews?ratings%5B%5D=1&page=6 | Respuesta de Shopify del 18-08-2022 sobre desinstalar (indicio, no documentación) |
