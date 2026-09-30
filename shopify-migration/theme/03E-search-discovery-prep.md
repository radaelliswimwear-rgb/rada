# 03E — Search & Discovery: paquete listo para la dueña

- **Fecha:** 2026-09-29 (Bogotá). Development Store `radaelli-swimwear-dev`, theme Radaelli `189072474431` **sin publicar**. Horizon (`189072113983`) no se toca.
- **Qué es:** todo lo necesario para que Daniela instale y configure la app oficial y gratuita **Shopify Search & Discovery** en una sola sesión (unos 15 minutos), con el resultado esperado en cada paso y el QA posterior.
- **Qué NO se hizo:** no se instaló nada, no se aceptaron permisos, no se usó la CLI ni el navegador. La instalación es un consentimiento OAuth: **solo la dueña**.
- **Nivel de evidencia:** `MEDIDO` (Dev Store, informes 03D/03E) · `CODE` (repo, `archivo:línea`) · `DOC` (fuente oficial, §11) · `INFERENCIA` · `NOT_VERIFIED` · `NOT_AVAILABLE`.

## Resumen

1. **No hay una vía sin OAuth documentada para agregar Talla y Color** (§3). Sin la app, la tienda ya tiene Disponibilidad y Precio (`MEDIDO` 03D).
2. **Filtros objetivo: Talla, Color y Precio.** Talla sale de la opción de variante `Talla`. Color sale del metafield de producto `custom.color` (texto de una línea), un tipo que la app **sí** admite (`DOC`). Precio ya está activo.
3. **Disponibilidad: NO.** El inventario no se rastrea, así que Shopify marca todo "En existencia". Además, con país CO hoy todo figura agotado (hallazgo C2 de 03E).
4. **El theme no necesita cambios.** Ya dibuja los filtros de lista como chips con links y oculta Disponibilidad (`snippets/collection-filters.liquid:100-181`).
5. **Una decisión pendiente para la dueña:** qué hacer con el valor de talla `L y XL` (1 producto; §4.1).

---

## 1. Estado medido hoy

| Punto | Estado | Evidencia |
|---|---|---|
| Search & Discovery instalada | **NO** | `MEDIDO`, dato de 03E (solo Translate & Adapt instalada) |
| Filtros nativos en colecciones | Disponibilidad (`filter.v.availability`, tipo list) + Precio (`price_range`) | `MEDIDO`, `theme/03D-search-accounts-wishlist-report.md` § B |
| Disponibilidad en el theme | Oculta: `collection_show_availability_filter` = `false` | `theme-src/config/settings_data.json:38`, `snippets/collection-filters.liquid:102-104` |
| Filtros activos en el theme | `collection_enable_filters` = `true`, `collection_enable_sorting` = `true` | `theme-src/config/settings_data.json:37`, `:39` |
| Filtros en la página de búsqueda | **No** se dibujan (`sections/main-search.liquid` no usa filtros: 0 coincidencias de `filter`) | `CODE`. El sitio real tampoco los tiene: `CatalogFilters` solo vive en el catálogo (`components/catalog/catalog-page.tsx:163` y el cajón `catalog-toolbar.tsx:168`); la búsqueda real `app/buscar/page.tsx` no los usa |
| Índice de búsqueda | 29/29 | `MEDIDO`, `theme/03E-search-final-report.md` § 1 |
| Moneda de la tienda | COP | `MEDIDO`, `theme/03B-store-foundation-report.md:91` |
| Definición `custom.color` | Texto de una línea con acceso Storefront, 29/29 con valor | `theme/03C-catalog-import-report.md:76` |
| Inventario | No rastreado (columna `Inventory tracker` vacía en las 98 variantes) | `import/shopify-products-03c.csv`; `import/README.md` (tabla de mapeo) |

---

## 2. Qué pide la app al instalar

Fuente: ficha oficial en la App Store, consultada el 2026-09-29 (`DOC`, [apps.shopify.com/search-and-discovery](https://apps.shopify.com/search-and-discovery)). Desarrollador: Shopify. Precio: gratis.

| Grupo (según la ficha) | Detalle |
|---|---|
| **Ver** datos del personal y colaboradores | Dueña de la tienda: nombre, email, teléfono y dirección física. Personal: nombre, email y teléfono |
| **Editar** productos | Productos y colecciones |
| **Ver** cuentas del personal | Cuentas del personal |
| **Ver** tienda online | Revisión de cookies web y píxeles de seguimiento de conversiones |
| **Editar** datos personalizados | Definiciones de metaobjetos y metaobjetos |
| **Ver** otros servicios | Apps |
| **Editar** otros datos | Discovery API, sinónimos de búsqueda, navegación de la tienda online, recomendaciones de productos, publicación de productos en canales de venta y datos privados de cuentas del personal |

- La ficha **no lista** acceso a clientes ni a pedidos.
- Para usar la app, el personal necesita los permisos "Products", "Online Store Search and Navigation" y "Reports" (`DOC`, help.shopify.com, *Storefront search*). Daniela es la dueña, así que los tiene.
- **`NOT_VERIFIED`:** que la pantalla real de consentimiento coincida con esta lista. Se ve recién al instalar. **Regla:** si pide algo que no está en la tabla, en especial clientes o pedidos, **no aceptar** y avisar a Claude.

---

## 3. ¿Hay alguna vía sin OAuth para habilitar los filtros?

**Respuesta: no documentada.** Talla y Color solo se agregan desde la app.

| Pregunta | Qué dice la fuente oficial |
|---|---|
| ¿Qué filtros existen sin configurar? | La app trae por defecto solo disponibilidad y precio: "By default, the app enables filters for the availability and price filters." (`DOC`, shopify.dev, *Filter products in a collection*). Coincide con lo medido en la tienda en 03D |
| ¿Dónde se agregan otros filtros? | Se editan en Search & Discovery > Filters > Edit filters (misma página). Los pasos del Help Center empiezan en Apps > Search & Discovery (`DOC`) |
| ¿Hay API de Admin para crear filtros? | **`NOT_AVAILABLE`**: no se encontró ninguna mutación ni endpoint en shopify.dev (búsqueda del 2026-09-29). La API de Storefront solo **aplica** filtros que ya existen |
| ¿Vía del theme? | No. El theme solo lee `collection.filters` y **no puede crear** filtros (`snippets/collection-filters.liquid:21-25`) |

**Conclusión.** Para tener paridad con el sitio (Talla y Color) hace falta instalar la app, es decir, el consentimiento OAuth de la dueña. No hay alternativa técnica razonable sin la app. Reconstruir filtros a mano en Liquid contradice la decisión 02G de usar filtros nativos (`snippets/collection-filters.liquid:1-9`).

---

## 4. Filtros con el catálogo actual

Fuente de datos: `import/shopify-products-03c.csv` (29 productos, 98 variantes). Los conteos son **productos** por valor, calculados desde ese CSV. El catálogo en la tienda sigue 29/98/95 (`MEDIDO` 03D).

### 4.1 Talla (opción de variante `Talla`)

Todas las variantes usan `Option1 name` = `Talla` (1 sola opción en todo el catálogo).

| Valor | Total | Oasis Natural (10) | Espuma de Ola (7) | Aurora Viva (12) | Destacados (7) |
|---|---|---|---|---|---|
| S | 29 | 10 | 7 | 12 | 7 |
| M | 29 | 10 | 7 | 12 | 7 |
| L | 28 | 10 | 7 | 11 | 7 |
| XL | 11 | — | — | 11 | 3 |
| L y XL | 1 | — | — | 1 (`camiseta-solar-waves-negro`) | — |

- **Parámetro esperado:** `filter.v.option.talla` (`DOC`: formato `filter.v.option.<name>`; los ejemplos oficiales van en minúsculas).
  - Cómo normaliza Shopify el nombre en la URL: **`NOT_VERIFIED`**.
  - El theme **no depende** del nombre: usa `filter.param_name` y `value.url_to_add` / `url_to_remove` (`snippets/collection-filters.liquid:170`).
- **Decisión de la dueña (`REQUIRES_DECISION`): valor `L y XL`.**
  - **Opción A (recomendada por fidelidad; no inventa nada):** dejarlo como valor propio. Es exactamente lo que dice la variante (`import/README.md`: "L y XL" se preserva exacto).
  - **Opción B:** agruparlo con otro valor. La app permite agrupar valores de filtro (`DOC`). Pero decidir si "L y XL" cuenta como L, como XL o como ambas es una decisión de producto, no técnica.
- **Orden de valores sugerido:** S → M → L → L y XL → XL (orden de tallas del catálogo, `import/README.md`).
  - La app ofrece orden **Manual** ("select Manually" y arrastrar valores) (`DOC`, Help Center, *Filters*). La doc no restringe fuentes, pero tampoco lo confirma explícitamente para opciones de variante (`NOT_VERIFIED` hasta verlo en pantalla).
  - Hace falta: el orden automático es ascendente alfabético/numérico, así que daría L, L y XL, M, S, XL. La doc solo menciona un orden especial de tallas para filtros llamados "Size"; que aplique a "Talla" es `NOT_VERIFIED`.

### 4.2 Color (metafield de producto `custom.color`)

- **Soporte verificado:**
  - Los filtros por metafield admiten "Single line text" (Help Center, *Adding filters with Shopify Search & Discovery*).
  - shopify.dev (*Storefront filtering*) lista `single_line_text_field` entre los tipos filtrables.
  - Requisito: el filtro se basa en una **definición** de metafield, y la definición existe desde 03C (`03C-catalog-import-report.md:76`).
- **Parámetro esperado:** `filter.p.m.custom.color` (`DOC`: formato `filter.p.m.<namespace>.<key>`).

| Valor (tal cual en el metafield) | Total | Oasis Natural | Espuma de Ola | Aurora Viva | Destacados |
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

- **12 valores**, todos en MAYÚSCULAS (`import/color-mapping.csv`), muy por debajo del límite de 100 valores visibles por filtro (`DOC`).
- **No** se renombran ni se agrupan valores (por ejemplo, BEIGE con BEIGE SUAVE): hacerlo sería inventar una taxonomía de color.
- **Contradicción a tener en cuenta** (`MEDIDO` 03C): `bikini-shadow-azul-marino` y `enterizo-shadow-palm-azul-marino` tienen `custom.color` = NEGRO. El filtro los mostrará en NEGRO, no en un "azul marino". Viene de la fuente de datos, y se mantiene.

### 4.3 Precio (ya activo)

- Cuatro precios de producto: $159.920 (6), $167.920 (9), $183.920 (10) y $199.920 (4). Cada producto tiene un solo precio en todas sus tallas.
- **Por colección:**

| Colección | $159.920 | $167.920 | $183.920 | $199.920 |
|---|---|---|---|---|
| Oasis Natural | — | — | 6 | 4 |
| Espuma de Ola | 5 | — | 2 | — |
| Aurora Viva | 1 | 9 | 2 | — |

- El rango en centavos ya se corrigió en 03D (`snippets/collection-filters.liquid:27-32`, `:73-76`, `:126`, `:138`). Después de instalar, hay que volver a probarlo (§7).
- **Condición oficial:** "The price filter doesn't display for currencies other than your shop's default currency" (`DOC`). Hoy la moneda es COP. Si en el futuro se agrega otra moneda, el filtro de precio desaparece para esa moneda.

### 4.4 Disponibilidad: NO se muestra

- **Motivo 1:** el inventario no se rastrea, así que Shopify marca todo "En existencia" y eso promete un stock que la tienda no conoce (`snippets/collection-filters.liquid:35-38`; 03D § B).
- **Motivo 2** (`MEDIDO` 03E, C2): con país CO, **0 de 29** productos están disponibles, porque la única zona de envío es "Domestic – Estados Unidos". Con un filtro de disponibilidad, "En existencia" daría 0 resultados para una sesión en CO (hoy las visitantes resuelven a US, C1).
- **Configuración:** quitar Disponibilidad de la lista de filtros de la app (§5, paso 4). El theme ya la oculta aunque exista; las dos barreras son independientes.
- **Se reconsidera recién** cuando se rastree inventario real **y** exista la zona Colombia.

### 4.5 Paridad con el sitio real: el sitio tampoco filtra bien color ni precio

Esto es `INFERENCIA` a partir del código; no se midió en el sitio en vivo.

| Filtro del sitio | Código | Qué pasa con los datos reales |
|---|---|---|
| Talla | Opciones fijas `XS, S, M, L, XL, Única` (`lib/placeholder-data.ts:54`), coincidencia exacta (`lib/catalog/catalog-actions.ts:103`) | S, M, L y XL funcionan. **`L y XL` no se puede elegir** |
| Color | Opciones fijas en formato título: `Negro`, `Blanco`, `Beige`, `Camel`, `Gris`, `Azul Marino`, `Verde Oliva`, `Terracota` (`lib/placeholder-data.ts:56-65`), coincidencia exacta con `Product.color` (`catalog-actions.ts:104`) | Los colores guardados están en MAYÚSCULAS (NEGRO, BEIGE…) o son otros (Azul, Mostaza) (`import/color-mapping.csv`). Con coincidencia exacta, **ninguna opción coincide**: resultado esperado 0 productos |
| Precio | Rangos "Menos de $50" … "Más de $200" (`lib/placeholder-data.ts:67-72`), convertidos con `toSubunits`, que en COP es `Math.round` (`lib/currency/subunits.ts:16-17`; `catalog-actions.ts:105-111`) | Con precios de $159.920 a $199.920, "Más de $200" devuelve todo y los otros 3 rangos devuelven 0 |

**Consecuencia:** replicar las **opciones** del sitio sería replicar un defecto. Los filtros de Shopify se arman con los datos reales: muestran solo valores existentes, con conteo.

- Con el mismo nombre de grupo (Talla, Color, Precio), es una mejora deliberada.
- Se mantiene la lógica del sitio:
  - **O** dentro de un grupo (`in`, `catalog-actions.ts:103-104`);
  - **Y** entre grupos (condiciones combinadas en `buildWhere`, `catalog-actions.ts:90-113`).

### 4.6 Lo que NO se configura en esta fase

- Filtros de Tipo de producto, Proveedor, Etiquetas y Categoría: el sitio no los tiene.
- Sinónimos, promoción de productos (*boosts*) y recomendaciones de la app:
  - no hay datos reales para cargarlos;
  - inventar sinónimos o destacados va contra la regla de no inventar;
  - la búsqueda ya cubre 29/29 (03E).
- Filtros en la página de búsqueda: el theme no los dibuja y el sitio real tampoco los tiene (§1).

---

## 5. Configuración objetivo, paso a paso (Daniela, unos 15 minutos)

Los nombres de los botones siguen la doc en inglés. En el Admin en español pueden aparecer traducidos (`NOT_VERIFIED`).

| # | Acción | Resultado esperado | Si no pasa |
|---|---|---|---|
| 1 | Abrir [apps.shopify.com/search-and-discovery](https://apps.shopify.com/search-and-discovery) con la sesión de la tienda `radaelli-swimwear-dev` → **Install** | Pantalla de permisos | — |
| 2 | Comparar los permisos con la tabla del §2 | Coinciden | **No aceptar.** Cancelar y avisar a Claude con una captura |
| 3 | Aceptar e instalar | La app aparece en Apps > Search & Discovery | Reintentar una vez; si falla, anotar el mensaje |
| 4 | Apps > Search & Discovery > **Filters**. Quitar **Availability** (Disponibilidad) de la lista | Quedan solo los filtros elegidos. Precio sigue | Si la app no deja quitarlo: dejarlo. El theme igual lo oculta (`collection-filters.liquid:102-104`). Anotarlo |
| 5 | **Add filter** → Source: opción de producto **Talla** → nombre visible **Talla** → valores vacíos: **Hide** (ocultar) → orden de valores: **Manual**, con el orden del §4.1 → no agrupar "L y XL" (salvo decisión B) → **Save** | Filtro "Talla" guardado con 5 valores (S, M, L, L y XL, XL) | Si "Talla" no aparece como fuente: el índice de opciones puede tardar; esperar y reintentar (`NOT_VERIFIED`). Si no aparece "Manual" para esta fuente: dejar el automático y anotarlo |
| 6 | **Add filter** → Source: metafield de producto **Color** (`custom.color`) → nombre visible **Color** → valores vacíos: **Hide** → **Save** | Filtro "Color" con 12 valores | Si no aparece: revisar en Configuración > Metacampos y metaobjetos > Productos que la definición `custom.color` exista (03C:76) |
| 7 | Confirmar que **Price** (Precio) siga en la lista | Precio visible | Si desapareció: **Add filter** → Price |
| 8 | Ordenar la lista: **Talla, Color, Precio** (el mismo orden que el sitio, `components/catalog/catalog-filters.tsx:180-182`) | Orden guardado | Si la app no permite reordenar, se acepta el orden que dé (`NOT_VERIFIED`) |
| 9 | **No** tocar Search, Recommendations, Synonyms ni Boosts | — | — |
| 10 | Avisar a Claude: "S&D listo" | Claude corre el QA del §7 | — |

**Límites oficiales que no se alcanzan** (`DOC`): hasta 25 filtros por tienda; 100 valores visibles por filtro; las colecciones de más de 5.000 productos no muestran filtros. Radaelli usa 3 filtros, con 12 valores como máximo, en colecciones de hasta 12 productos.

---

## 6. Cómo lo dibuja el theme (sin cambios de código)

| Tipo que devuelve Shopify | Dibujo | Líneas |
|---|---|---|
| `list` (Talla, Color) | Chips `<a>` con `url_to_add` / `url_to_remove`, `aria-pressed`, texto `Etiqueta (conteo)`. Oculta valores con conteo 0 que no estén activos. Funciona sin JavaScript | `snippets/collection-filters.liquid:163-179` (conteo 0: `:168`) |
| `price_range` | Formulario Mínimo–Máximo en unidades (÷100); conserva los demás filtros y el orden | `:105-147` |
| `boolean` | Chips | `:148-162` |
| `filter.v.availability` | Se salta salvo que `collection_show_availability_filter` esté activo | `:102-104` |
| Orden | `select` que conserva todos los filtros activos | `:67-98` |
| "Limpiar" | Vuelve a la colección y conserva `sort_by` | `:48-51`, `:62-64` |

- Se renderiza en la barra lateral (`sections/main-collection.liquid:63-64`) y en el cajón mobile (`:91-106`), con ids únicos por contexto (`collection-filters.liquid:40-47`).
- Sin resultados: `collections.general.no_matches` (`sections/main-collection.liquid:85`).

---

## 7. QA después de instalar

Base: `https://radaelli-swimwear-dev.myshopify.com/collections/<handle>?preview_theme_id=189072474431`, en el preview del theme Radaelli y nunca en Horizon.

- **País de la sesión:** hoy la tienda resuelve a US (`MEDIDO` 03E, C1). Con país CO todo figura agotado (C2).
  - Anotar el país (`Shopify.country`) en cada corrida.
  - Si los conteos cambian entre US y CO, registrarlo: es un efecto de C2, no del filtro (`NOT_VERIFIED`).
- **Resoluciones:** 375 px (cajón mobile) y 1280 px (barra lateral).

| # | Caso | Esperado | Resultado |
|---|---|---|---|
| Q1 | `/collections/oasis-natural`: grupos visibles | Ordenar por, **Talla**, **Color** y **Precio**. **Sin** Disponibilidad | |
| Q2 | Chips de Talla en Oasis Natural | S (10), M (10), L (10). Sin XL | |
| Q3 | Chips de Color en Oasis Natural | AZUL (2), BEIGE (3), NARANJA (2), NEGRO (3) | |
| Q4 | Tocar Talla S | La URL suma el parámetro de talla (esperado `filter.v.option.talla=S`; anotar el real). 10 productos. El chip queda activo (`aria-pressed="true"`). Aparece "Limpiar" | |
| Q5 | Agregar Color NEGRO | 3 productos. La URL lleva los dos parámetros (el de color, esperado `filter.p.m.custom.color=NEGRO`) | |
| Q6 | Con Q5 activo, cambiar el orden a "Precio: menor a mayor" | Se conservan los dos filtros y el orden aplica (regresión de 03D) | |
| Q7 | Con Q5 activo, precio 150.000–190.000 | Oasis Natural NEGRO a $183.920: `costa-esmeralda-negro` y `arena-dorada-negro` = 2. Los inputs muestran 150000/190000, no ×100 | |
| Q8 | "Limpiar" | Vuelve a la colección sin filtros y conserva el orden si no era el predeterminado | |
| Q9 | Atrás y adelante del navegador | Los chips y el `select` coinciden con la URL (bfcache, 03D) | |
| Q10 | `/collections/aurora-viva`: Talla | S (12), M (12), L (11), L y XL (1), XL (11), en ese orden si quedó el orden Manual del paso 5 | |
| Q11 | Aurora Viva: Talla XL + Color NEGRO | **0** productos, con el texto de sin resultados (`main-collection.liquid:85`). La camiseta negra solo tiene "L y XL". Es la prueba de **Y** entre grupos | |
| Q12 | Aurora Viva: Talla L + Talla "L y XL" | 12 productos (**O** dentro del grupo) | |
| Q13 | `/collections/espuma-de-ola`: Color | MOSTAZA (1), NEGRO (2), TERRACOTA (1), BLANCO (1), VERDE OLIVA (2) | |
| Q14 | `/collections/destacados` | Talla S/M/L (7), XL (3). Color: 6 valores (§4.2) | |
| Q15 | `/collections/salidas-de-bano` (0 productos) | Sin grupos Talla ni Color: con **Hide**, "A filter is hidden entirely if all filter values are empty" (`DOC`). El grupo Precio puede verse igual (el theme dibuja el formulario de precio sin mirar conteos, `collection-filters.liquid:105-147`; que Shopify lo devuelva en una colección vacía es `NOT_VERIFIED`). Anotar si aparece un título "Talla"/"Color" **vacío**: solo pasaría si Shopify devolviera el filtro igual; el theme oculta los valores en 0 (`:168`) pero no el título (`:165`). No bloquea | |
| Q16 | Cajón mobile (375 px) | Abre y cierra; "Ver N productos" coincide con el conteo | |
| Q17 | Página de búsqueda `/search?q=negro` | Sin panel de filtros (esperado, §1). Mismos resultados que antes de instalar (el predictivo daba 6, `03E-search-final-report.md` § 4) | |
| Q18 | Consola del navegador | 0 errores propios de JS | |
| Q19 | Orden de los grupos | Talla, Color, Precio (o el que dé la app; anotar) | |
| Q20 | Etiquetas de los grupos | "Talla", "Color" y "Precio" en español (el theme usa `filter.label`) | |

---

## 8. Rollback

| Qué | Cómo | Efecto en el theme |
|---|---|---|
| Un filtro mal configurado | Apps > Search & Discovery > Filters > editar o quitar el filtro | El panel muestra solo lo que devuelve `collection.filters`. No hay nada que revertir en el theme |
| Toda la app | Configuración > Apps > Search & Discovery > Desinstalar | Qué pasa con los filtros guardados al desinstalar: **`NOT_VERIFIED`** (las páginas consultadas no lo dicen). Anotar el estado antes de desinstalar |
| Disponibilidad visible por error | Quitarla en la app, o dejar `collection_show_availability_filter` en `false` (ya lo está) | Oculta por el theme |

---

## 9. GO/NO-GO

| # | Condición | GO | NO-GO |
|---|---|---|---|
| SD1 | Pantalla de permisos = §2 | Instalar | No instalar. Revisar con Claude |
| SD2 | Talla y Color disponibles como fuente | Configurar | Esperar e investigar. Sin inventar filtros a mano |
| SD3 | QA Q1–Q13 | Filtros listos para el lanzamiento | Documentar el caso que falla. El theme puede seguir con Precio solo |
| SD4 | Q15 (colección vacía) | OK (esperado según la doc con **Hide**) | Solo si aparece un título vacío: ajuste de theme menor en la próxima fase (no bloquea) |

---

## 10. NOT_AVAILABLE / NOT_VERIFIED

- **`NOT_AVAILABLE`:** API de Admin para crear filtros. Una vía de configuración sin la app.
- **`NOT_VERIFIED`:**
  - la pantalla real de consentimiento;
  - el nombre exacto de los parámetros de la URL;
  - que el orden **Manual** (documentado en general) aparezca para la fuente "opción de producto", y si el orden automático especial de "Size" aplica a "Talla";
  - si Shopify devuelve el grupo Precio en una colección vacía (Q15);
  - si los conteos cambian según el país (C2);
  - qué pasa con la configuración al desinstalar;
  - las etiquetas del Admin en español.
- **Decisión de la dueña:** agrupar o no "L y XL" (§4.1).

---

## 11. Fuentes oficiales (consultadas el 2026-09-29)

- https://apps.shopify.com/search-and-discovery: acceso solicitado, precio, desarrollador.
- https://help.shopify.com/en/manual/online-store/storefront-search/search-and-discovery-filters: pasos, tipos de metafield, límites, moneda del filtro de precio, valores vacíos, agrupación.
- https://help.shopify.com/en/manual/online-store/search-and-discovery/filters: fuentes estándar y personalizadas, límites, orden Manual de valores y filtro oculto si todos sus valores están vacíos (re-consultada por el verificador el 2026-09-29).
- https://help.shopify.com/en/manual/online-store/storefront-search: permisos del personal para usar la app.
- https://help.shopify.com/en/manual/online-store/themes/customizing-themes/storefront-filters: el theme tiene que ser compatible.
- https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/storefront-filtering: formatos `filter.v.option.<name>` y `filter.p.m.<namespace>.<key>`, tipos filtrables.
- https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/filter-products: filtros por defecto de la app y dónde se editan.
