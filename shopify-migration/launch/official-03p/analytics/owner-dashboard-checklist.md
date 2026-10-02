# Tablero semanal de la dueña — ¿la publicidad devuelve dinero?

**Cuándo:** cada lunes, semana lunes–domingo (America/Bogota), ~20 min. **Reglas fijas:** mismas fechas en Shopify y Meta; mismo ajuste de atribución en Ads Manager (7 días clic + 1 día vista, o el que se decida y no se cambie); los pedidos `interno` se restan. **Verdad del dinero = Shopify y Wompi; Meta es el diagnóstico de anuncios.**
**Estado hoy:** sin datos ni costos. Hasta completar `unit-economics-inputs.csv` (puerta B3) la pregunta 8 solo puede responder **“seguir probando”**: no hay equilibrio calculado.
Nombres de columnas de Meta en inglés/español aproximados; confirmarlos en la interfaz.

## 1. Captura de números (una vez por semana)

| Dato | Dónde leerlo | Esta semana | Anterior |
|---|---|---|---|
| **Gasto** `GASTO` | Ads Manager: *Amount spent / Importe gastado* | | |
| Impresiones · Alcance | *Impressions · Reach* | | |
| Clics en el enlace `CLICS` | *Link clicks* | | |
| Visitas a la página de destino `LPV` | *Landing page views* | | |
| Vistas de contenido `VC` | *Content views* (ViewContent) | | |
| Agregados al carrito `ATC_M` | *Adds to cart* | | |
| Pagos iniciados `IC_M` | *Checkouts initiated* | | |
| Compras Meta `COMPRAS_M` · Valor `VALOR_M` | *Purchases · Purchase conversion value* | | |
| Sesiones totales `SES` | Shopify > Analytics > Reports > Acquisition: *Sessions over time* | | |
| Sesiones desde Meta `SES_M` | Marketing: *Sessions attributed to marketing campaigns* (fuente `facebook`) | | |
| Sesiones con carrito `S_CART` · llegaron a checkout `S_CHK` · completaron `S_COMP` | Behavior: *Conversion rate breakdown* | | |
| Pedidos `PED` · Ventas netas `NETAS` · Ventas totales `TOTALES` | Sales over time (restar pedidos `interno`) | | |
| Pedidos atribuidos `PED_A` · Ventas atribuidas `VENTAS_A` | Marketing: *Sales attributed to marketing* / *Performance by UTM campaign* (`facebook` / `paid_social`) | | |
| Reembolsos y cancelaciones `REEMB` | Sales: devoluciones; Orders cancelados | | |
| Clientes nuevos `NUEVOS` | Customers: nuevos vs recurrentes | | |
| Wompi aprobados `N_W` | Panel Wompi > Transacciones (`APPROVED`) | | |
| Otros costos de adquisición `OTROS_ADQ` (creativos pagados, aliadas) | Dueña | | |

## 2. Las 8 preguntas

| # | Pregunta | Cómo se calcula | Dónde se lee |
|---|---|---|---|
| 1 | **¿Cuánto gasté?** | `GASTO` (+ `OTROS_ADQ` si se quiere costo total) | Ads Manager; cuadrar con el cobro de la tarjeta |
| 2 | **¿Cuánto dinero volvió?** | Atribuido: `VENTAS_A` · Total del negocio: `NETAS` · Lo que dice Meta: `VALOR_M` | Shopify (decide) vs Meta (compara). Ventas netas = bruto − descuentos − devoluciones |
| 3 | **¿Cuántas compras?** | `PED_A` (anuncios) · `PED` (todas) · `COMPRAS_M` (Meta) | Deben cuadrar con `N_W` (sección 4) |
| 4 | **¿CPA / CAC?** | **CPA** = `GASTO` / `PED_A` (si no hay atribución, `COMPRAS_M`) · **CAC** = (`GASTO` + `OTROS_ADQ`) / `NUEVOS` | Comparar con `be_cpa`, `be_cpa_full`, `target_cpa` del CSV |
| 5 | **¿ROAS?** | **ROAS Shopify** = `VENTAS_A` / `GASTO` · **ROAS Meta** = `VALOR_M` / `GASTO` · **ROAS neto** = (`VENTAS_A` − reembolsos atribuidos) / `GASTO` · **MER** = `NETAS` / `GASTO` | Comparar con `be_roas`, `be_roas_meta`, `be_roas_full`, `target_roas`. Resultado del dinero: `PED_A` × `contrib` − `GASTO` (¿gané o perdí con anuncios?) |
| 6 | **¿Dónde se escapa el embudo?** | Tabla de tasas abajo | Meta + Shopify |
| 7 | **¿Qué vende?** | Ranking por campaña, anuncio y producto (abajo) | Meta por nivel; Shopify *Performance by UTM campaign*, *Sales by product*, *Sessions by landing page* |
| 8 | **¿Pausar, seguir probando o escalar?** | Reglas de la sección 3 | Parámetros del CSV, sección K |

### 6. Tasas del embudo (fuga = la etapa que más cae contra la semana anterior)

| Etapa | Fórmula | Fuente |
|---|---|---|
| Impresión → clic | CTR enlace = `CLICS` / impresiones | Meta |
| Clic → visita | `LPV` / `CLICS` | Meta |
| Visita → sesión Shopify | `SES_M` / `LPV` (calidad de medición; brecha esperable por navegadores internos, bloqueadores y consentimiento) | Meta + Shopify |
| Sesión → ficha de producto | `VC` / `LPV` | Meta (la ayuda de Shopify no lista “vistas de producto” como etapa **[NV]**) |
| Ficha → carrito | Tasa de carrito = `S_CART` / `SES` · en Meta `ATC_M` / `VC` | Shopify / Meta |
| Carrito → checkout | Tasa de inicio de checkout = `S_CHK` / `S_CART` (y `S_CHK` / `SES`) | Shopify |
| Checkout → compra | Finalización = `S_COMP` / `S_CHK` · **vigilar Wompi:** `N_W` vs `PED` | Shopify + Wompi |
| Sesión → compra | Conversión = `PED` / `SES` (la “Conversion rate” de Shopify) | Shopify |
| Compra → reembolso | `REEMB` / `TOTALES` | Shopify |
| Valor del pedido | AOV = `NETAS` / `PED` (comparar con `C_total` del CSV) | Shopify |
| Medios | CPM = `GASTO` / impresiones × 1000 · CPC = `GASTO` / `CLICS` | Meta |

Cortes que ayudan a ubicar la fuga: *Sessions by device* (móvil vs escritorio: Wompi y checkout), *Sessions by landing page* (qué ficha no convierte), campaña/anuncio (Meta).
Benchmark propio por etapa (`BENCH_ETAPA`): **vacío**; se fija tras 2–4 semanas de datos propios. Mientras tanto se compara contra la semana anterior.

### 7. Ranking de lo que vende (una fila por campaña / anuncio / producto)

| Nivel | Nombre (UTM) | Gasto | Compras | Ventas | ROAS neto | CPA | Veredicto (sección 3) |
|---|---|---|---|---|---|---|---|
| Campaña (`utm_campaign`) | | | | | | | |
| Anuncio/creativo (`utm_content`) | | | | | | | |
| Producto (campaña = una ficha; *Sales by product*) | | | | | | | |

## 3. Reglas de decisión (cada fila se evalúa en orden; los parámetros están **vacíos** en el CSV, sección K)

| Orden | Condición | Decisión |
|---|---|---|
| R0 | Conciliación con diferencias sin explicar, **o** duplicados ≠ 0, **o** cobertura UTM < `MIN_COBERTURA_UTM` | **NO DECIDIR: arreglar la medición primero** |
| R1 | Compras < `MIN_COMPRAS_DECISION` **o** gasto < `MIN_GASTO_DECISION` | **SEGUIR PROBANDO** (muy pocos datos) |
| R2 | CPA > `be_cpa` **o** ROAS neto < `be_roas`, durante `SEMANAS_PARA_PAUSAR` semanas seguidas | **PAUSAR** y revisar creativo, oferta, ficha o fuga del embudo |
| R3 | `be_roas` ≤ ROAS neto < `target_roas` | **SEGUIR PROBANDO**: corregir la etapa que más fuga; nuevos creativos |
| R4 | ROAS neto ≥ `target_roas` **y** CPA ≤ `target_cpa` **y** tasa de reembolso ≤ `MAX_TASA_REEMBOLSO` | **ESCALAR** subiendo como máximo `PASO_ESCALA` cada `DIAS_ENTRE_ESCALAS` días; no tocar dos variables a la vez |
| Alerta global | MER < `be_roas_full` | El negocio pierde aun con ventas orgánicas: no escalar |

`be_cpa`, `be_roas`, `be_roas_full`, `target_cpa`, `target_roas` salen de `unit-economics-inputs.csv` (columna GLOBAL o la familia del producto). Si dicen `FALTA_DATO`, aplica R1 a todo.

## 4. Salud de los datos (5 min, antes de decidir)

- [ ] **Conciliación:** pedidos pagados de Shopify = `APPROVED` de Wompi (por referencia); cualquier pagado-sin-pedido se rescata (pedido manual pagado + nota). Detalle en el plan §3.
- [ ] **Duplicados:** Purchase de Meta (todas las fuentes) vs pedidos pagados: `Purchase > pedidos` = duplicados o pruebas.
- [ ] **UTM:** sesiones de anuncios con UTM / clics en el enlace de Meta ≥ `MIN_COBERTURA_UTM`.
- [ ] **Abandonados con pago:** *Orders > Abandoned checkouts* revisado contra Wompi (0 pagos sin pedido).
- [ ] **Internos restados:** pedidos `interno` y de prueba fuera de MER/ROAS.
- [ ] **Atribución:** Ads Manager con el mismo ajuste que la semana anterior.
- [ ] **Reembolsos:** `REEMB` actualizado (Meta no recibe reembolsos **[NV]**; por eso se usa ROAS neto de Shopify).
