# 03G — Plan de monitoreo de las primeras 24 h tras el corte (documento; NO ejecutar)

- **Fecha de redacción:** 2026-09-29, 18:00 (Bogotá). Este documento no escribe horas posteriores: todas las marcas son relativas a **T0**, el instante en que la dueña guarda el cambio de DNS (S15). La hora de T0 la fija la dueña (D-CT1) [DOC:launch/03G-cutover-runbook.md § 2 regla 3, § 4].
- **Estado: SOLO DOCUMENTO.** No se tocó ninguna tienda, DNS, Vercel, Wompi ni el sitio en producción. No se consultó Neon ni ninguna base de datos, no se hizo ningún POST y **no se hizo ningún GET** a `https://radaelliswimwear.com`: la evidencia guardada de 03G alcanzó.
- **Único script:** `launch/tools/03g-monitoring-404-baseline.mjs` (offline, determinista, solo lee `seo/` y `launch/evidence/`, escribe en la salida estándar). Comando: `node launch/tools/03g-monitoring-404-baseline.mjs`. Termina con `RESULTADO: OK` y código 0 (14 controles). Dos corridas seguidas dan la misma salida (SHA-256 de la salida `e8ce9c72…f403`); SHA-256 del script `8ea18325…5ea0`. Ambos hashes se recalcularon en la verificación adversarial (§ 13), porque el texto del primer salto esperado de `/checkout` cambió (MN-17).
- **Se lee junto con:** `launch/03G-cutover-runbook.md` (puntos T+15m, T+1h y T+24h de su § 6; criterios RB-01…RB-05 de su § 8.3) y `launch/03G-rollback-plan.md` (pasos `RP-##`, síntomas `SY-##`, decisiones `DR-##`, capturas `SR-##`). `launch/03G-launch-acceptance-checklist.md`, que ambos citan, **no existía al redactar**: este plan se apoya en sus propios IDs `MO-##.n`.
- **Etiquetas de evidencia:** `[MEDIDO-03G]` capturas del 2026-09-29 (`launch/03G-*`, `launch/evidence/**`, script de esta fase); `[DOC:<archivo>]` documento del repo; `[INFERIDO]` razonado (se dice el porqué); `[PRÁCTICA-GENERAL]` práctica técnica genérica, sin cifras de la marca; `[NOT_VERIFIED]` no se pudo comprobar; `NOT_AVAILABLE` el dato no existe en las fuentes; "a decidir por la dueña (D-MO#)" decisión de negocio sin fuente.
- **Identificadores propios:** `MO-##` área de monitoreo · `MO-##.n` chequeo · `LB-##` línea base previa al corte · `D-MO#` decisión de la dueña · `MN-##` hallazgo de este plan (§ 10) · `B20` fila de `launch/03G-reproducibility-gap-audit.md` (ajustes de checkout, impuestos, notificaciones, dominios y eventos del cliente: no se leyeron en 03G) · `G-04` brecha del § 15 del plan de rollback (inventario sin seguimiento; no es la compuerta G4 del cutover). **Niveles de anomalía:** `[A]` = **cualquier ocurrencia** (se actúa sin esperar); `[S]` = **señal**: comparación relativa (frente a una línea base `LB-##` o al punto de control anterior); se registra y decide la dueña con los umbrales de DR-02 (`NOT_AVAILABLE`).
- **Pasos canónicos:** S01 tienda comercial · S02 país/moneda/idioma/zona/mercado · S03 theme · S04 catálogo · S05 colecciones y metacampos · S06 menús, páginas y redirecciones · S07 media · S08 apps oficiales · S09 favoritos · S10 envíos · S11 Wompi · S12 analítica · S13 cuentas · S14 E2E · S15 dominio · S16 publicar · S17 post-lanzamiento. Los runbooks 03F usan numeraciones propias (`P0–P10`, `S0–S13`, `M0–M10`): cuando se citan va el nombre del runbook.

## 1. Resumen

1. **Hoy no hay nada que monitorear en producción** [MEDIDO-03G]: RC1.8 sin publicar, Horizon live en la Dev Store, pagos apagados, 0 pedidos creados por 03G, y el veredicto vigente del cutover es NO-GO [DOC:launch/03G-cutover-runbook.md § 1]. Este plan se ejecuta desde T0, no antes.
2. **Cuatro puntos de control:** T+15m, T+1h, T+4h y T+24h. T+15m, T+1h y T+24h coinciden con el cutover (CT-71…CT-75, CT-81…CT-86, CT-91…CT-96). **T+4h no existe en el cutover** y lo agrega este plan: Wompi reintenta un evento no confirmado a los 30 min, a las 3 h y a las 24 h [DOC:payments/03F-wompi-owner-runbook.md § 5.1], y el reintento de las 3 h no tenía punto de revisión (MN-01).
3. **12 áreas y 52 chequeos** (§ 6): dominio y HTTPS, checkout, pagos y estados, duplicados, inventario, 404, carrito, analítica, correos, cuentas, favoritos y rendimiento. Cada chequeo dice qué mirar, dónde (pantalla, informe o comando), cuándo, qué es anomalía sin inventar cifras, quién actúa y a qué paso de rollback lleva (`RP-##` / `RB-##` / `SY-##`).
4. **Sin KPIs.** No hay metas de ventas, conversión ni tiempos máximos en ninguna fuente: este plan solo usa "cualquier ocurrencia" y comparaciones relativas. Los umbrales que disparan un rollback son de la dueña (DR-02).
5. **El dinero se vigila cruzando tres fuentes** (Shopify, panel de Wompi y, si D-CT2 = B, el sitio actual). Dos riesgos no se pueden prevenir ni ver de forma directa: el cobro aprobado sin pedido (NV7) y el reembolso de Shopify que no llega a Wompi (NV6). El procesamiento de eventos lo hace el integrador y el comercio no lo ve [DOC:payments/03E-wompi-shopify-feasibility.md E10]. Por eso la conciliación (MO-02.2) es el chequeo central.
6. **Tres cosas no tienen línea base "del sitio actual"**: la analítica (SR-11 `NOT_AVAILABLE`), LCP/CLS reales (nunca medidos, ni en el sitio actual ni en Shopify) y el stock real por talla (el patrón de 25 unidades del sitio actual no está confirmado). Para esas, el plan usa Shopify y Wompi como verdad y la primera medición de la ventana como referencia; lo dice en cada fila.
7. **Inventario (D-MO1):** la Dev Store no rastrea inventario (98/98) [MEDIDO-03G]. Sin seguimiento, Shopify no limita la venta y el monitoreo no puede detectar sobreventa por sí mismo. El plan trae las dos ramas (§ 6, MO-04) y la decisión es de la dueña; es la misma que D-CT8 del cutover y DR-07 del rollback.
8. **Lo que sigue abierto después de T+24h** (§ 9.3): pagos pendientes de Wompi (hasta 3 días), Search Console (4 a 8 semanas), métricas personalizadas de GA4 (24 a 48 h) y el cierre con datos reales de NV5, NV6, NV7 y NV12. Pasan a S17.
9. **Se pierde la observabilidad propia del sitio actual** (`SystemLog` y sus alertas por correo con enfriamiento): Shopify solo ofrece registros básicos del Admin, sin equivalente comparable [DOC:launch/evidence/reference-docs/architecture-map.md § 1, § 3]. Que Shopify, Wompi, GA4 o Meta envíen alertas propias por correo: `[NOT_VERIFIED]`. Este plan no cuenta con ninguna alerta automática: todo lo que trae es lectura activa (MN-14).

**Fuera de alcance de este plan:** filtros de talla y color y búsqueda (se verifican en CT-84, T+1h), posicionamiento SEO más allá de la línea base de T+24h, y cualquier cifra de ventas o conversión.

## 2. Reglas del monitoreo

| # | Regla | Fuente |
|---|---|---|
| R-M1 | **Solo lectura.** El monitoreo no cambia nada. Toda corrección es un paso `RP-##` del plan de rollback o una corrección adelante del § 8.4 del cutover. Claude escribe en Shopify solo con OK explícito de la dueña en el chat, por acción | `[DOC:launch/03G-rollback-plan.md § 0]` |
| R-M2 | **Quién lee qué.** Admin de Shopify: Claude lee con la ventana de Chrome visible y la sesión de la dueña (con la ventana oculta 03G no pudo leer `settings/checkout` ni medir LCP), o la dueña lee y reporta. **Wompi, GA4, Meta y Search Console: los abre la dueña**; Claude solo observa lo que ella deja en pantalla, no entra ni escribe. Comandos `curl.exe`: Claude o la dueña. Sitio actual: la dueña entra por la URL propia del proyecto en Vercel (CT-14); Claude no consulta Neon | `[DOC:analytics/03F-analytics-owner-runbook.md § 2, § 15]` (Google y Meta); extensión a Wompi y Search Console `[INFERIDO]` por las reglas R2–R5 del runbook de Wompi y la regla 2 del cutover; `[MEDIDO-03G]` snapshot `_meta.limits` |
| R-M3 | **Sin datos personales en el registro.** Solo número de pedido, referencia de Wompi, SKU-talla, montos, estados, horas y nombre del archivo de evidencia. Sin correos, teléfonos, direcciones, tokens, llaves, URLs de checkout con token ni códigos de ingreso. La hoja llena vive **fuera del repo** | `[DOC:launch/03G-rollback-plan.md § 5]`, regla 5 de esta fase |
| R-M4 | **Dos niveles.** `[A]` cualquier ocurrencia; `[S]` señal relativa. Este plan no fija cifras: los umbrales son DR-02 | `[DOC:launch/03G-rollback-plan.md § 4 DR-02]` |
| R-M5 | **Referencia de comparación.** "Frente a la línea base" = `LB-##` de § 4. Si esa línea base es `NOT_AVAILABLE`, el chequeo se compara con el punto de control anterior de esta misma ventana, y la fila lo dice | § 4 |
| R-M6 | **Excluir de las anomalías, pero anotar con la marca `PROPIO`:** el pedido real de la dueña de CT-47 y su reembolso, los pedidos del equipo, y los humos de este plan (sin datos personales, sin pagar). La exclusión en GA4 y Meta es D-CT9 | `[DOC:launch/03G-cutover-runbook.md CT-47, D-CT9]` |
| R-M7 | **Sin cambios de base en la ventana:** país, idioma, mercados, zonas, tarifas y pagos no se tocan; una anomalía se contiene (C0) o se corrige adelante con un paso de RP | `[DOC:launch/03G-cutover-runbook.md § 2 regla 8]` |
| R-M8 | **Toda anomalía se registra aunque se cierre en minutos** (§ 8.4). Una `[A]` detectada entre puntos de control se atiende sin esperar al siguiente | — |
| R-M9 | **Orden dentro de un punto de control:** primero dinero (MO-02, MO-03), luego compra (MO-00, MO-01, MO-06) y luego el resto. Duración de cada punto: `NOT_AVAILABLE` (no hay medición) | `[INFERIDO]` por el riesgo de mayor impacto del registro de riesgos `[DOC:launch/evidence/reference-docs/migration-roadmap.md § 20]` |
| R-M10 | **Un chequeo que no se pudo ejecutar** (ventana oculta, acceso caído, dueña no disponible) se registra `NO EJECUTADO` con su causa; nunca se rellena con el resultado del punto anterior | — |
| R-M11 | **Horas:** T0 real y la hora real de cada lectura se anotan en el registro (Bogotá). Este plan no fija horas | — |

## 3. Decisiones de la dueña que afectan el monitoreo

Ninguna tiene valor en las fuentes. Las de otros documentos que este plan necesita van al final.

| Id | Decisión | Por qué se necesita | Estado |
|---|---|---|---|
| **D-MO1** | **Inventario: ¿se rastrea en Shopify antes del lanzamiento?** **A:** sí, con cantidades reales por talla confirmadas por la dueña. **B:** no, se vende sin límite y el stock se controla a mano | Cambia qué anomalías de inventario se pueden detectar (MO-04). Es la misma decisión que D-CT8 y DR-07: se responde una vez y vale para los tres documentos. Sin seguimiento "Shopify muestra todo en existencia" y hay sobreventa desde el primer pedido `[DOC:launch/03G-reproducibility-gap-audit.md C08, G02]` | `NOT_AVAILABLE` |
| D-MO2 | Quién ejecuta cada punto de control, quién está de guardia entre ellos y por qué canal se avisa una `[A]` (persona de decisión: DR-01) | Sin canal, una `[A]` entre puntos no llega a quien decide | `NOT_AVAILABLE` |
| D-MO3 | Canal por el que llegan los reportes de clientas durante la ventana (correo, redes, WhatsApp del sitio actual) y quién los registra | Es la única fuente de varios chequeos (MO-01.5, MO-06.3, MO-08, MO-09.3) | `NOT_AVAILABLE` |
| D-MO4 | GA4: excluir de los referidos el dominio de pago de Wompi y el dominio de cuentas de Shopify, para que no partan la sesión ni se lleven la atribución de la compra | `[PRÁCTICA-GENERAL]`: una redirección de pago puede atribuir la compra al dominio de destino. Que ocurra en esta tienda: `[NOT_VERIFIED]` (MO-07.5) | `NOT_AVAILABLE` |
| D-MO5 | Dónde y cuánto tiempo se archiva la hoja de registro y sus evidencias (números de pedido y referencias de pago: datos de compra) | No hay política de retención en las fuentes; no se consultaron fuentes legales | `NOT_AVAILABLE` |
| D-MO6 | Aviso interno de "pedido nuevo": ¿se activa y quién lo recibe? El sitio actual envía al admin un correo de pedido nuevo `[DOC:launch/evidence/reference-docs/seo-analytics.md § 11]` (contenido del correo: `[DOC:shipping/03E-shipping-source-of-truth.md C7]`); en Shopify no se probó | Sin ese aviso, detectar un pedido depende de abrir Pedidos (MO-08.3) | `NOT_AVAILABLE` |
| D-MO7 | ¿Se incorpora el punto T+4h al § 6 del cutover? | MN-01 | Pendiente |

**Decisiones ya definidas en otros documentos y necesarias aquí:** D-CT1 (T0 y ventana de decisión) · D-CT2 (pausar o no las ventas del sitio actual) · D-CT4 (apex o `www`) · D-CT6 (blog, `/accesorios`) · D-CT7 (destino de las 4 legales) · D-CT8 = D-MO1 · D-CT9 (nivel de Meta y exclusión de tráfico propio) · D-CT10 (favoritos de cuenta) · D-CT11 (comunicación a clientas) · D-CT12 (clientas e histórico) · DR-01 (quién autoriza un rollback) · DR-02 (umbrales) · DR-04 (qué hace el sitio actual) · DR-05 (método de contención) · D2 (tarifa bajo $ 299.900).

## 4. Líneas base antes de T0

Lo que hay que capturar antes del corte para que las comparaciones relativas signifiquen algo. Sin una `LB-##` el chequeo se compara con el punto anterior (R-M5).

| LB | Qué capturar | Cuándo · quién | Estado hoy | Alimenta |
|---|---|---|---|---|
| LB-01 | URLs del sitio actual: rastreo, sitemap y sondeos | T-24h y T-1h (CT-03, CT-43, con copia previa de la carpeta) · Claude | **Existe la de 2026-09-29:** 58 URLs con 200 (54 del rastreo + 4 del sondeo), 17 rutas distintas con 404, sitemap de 45 URLs, 47 filas de redirección `[MEDIDO-03G]` (script de esta fase). Refrescar | MO-05 |
| LB-02 | Panel de Wompi de **producción**: transacciones de las 24 h previas por estado (`APPROVED`, `DECLINED`, `ERROR`, `PENDING`, `VOIDED`); que el panel filtre por estado y fecha o exporte la lista: `[NOT_VERIFIED]` (si no, se cuentan a mano); `/admin/pedidos` del sitio actual: último número de pedido y pedidos de las 24 h previas | T-1h: CT-41 con D-CT2 = A compara `/admin/pedidos` con el panel de Wompi, y CT-43 toma el último número de pedido (SR-10) con A o con B `[DOC:launch/03G-cutover-runbook.md CT-41, CT-43, § 5.4]` · dueña | `NOT_AVAILABLE` (SR-10) | MO-02.4, MO-03.3 |
| LB-03 | Stock real por SKU-talla (98 variantes) confirmado por la dueña; para la rama A se carga, para la rama B se compara | T-24h (CT-04, CT-43) · dueña | `NOT_AVAILABLE`. El sitio actual publica 25 por talla en 27 fichas, valor que "sugiere un valor de carga, no un conteo físico" `[INFERIDO]` `[DOC:launch/03G-reproducibility-gap-audit.md C08]`: **no usarlo como base** | MO-04 |
| LB-04 | PageSpeed Insights del sitio actual (5 páginas: Home, una colección, una ficha, búsqueda, carrito). Opcional: de `<TIENDA>.myshopify.com` en T-15m, cuando CT-51 ya quitó la contraseña `[INFERIDO]` | T-24h · dueña o Claude (PSI corre desde fuera) | `NOT_AVAILABLE`. LCP, FCP y CLS reales **no se han medido nunca** (ventana oculta) `[DOC:theme/03F-performance-final.md § 1]` | MO-11 |
| LB-05 | GA4 y Meta del sitio actual (embudo y compras de las 24 h previas) | T-24h · dueña | `NOT_AVAILABLE` (SR-11). Si el sitio actual manda datos hoy: `[NOT_VERIFIED]`; su política de cookies dice "Hoy no las usamos" `[DOC:analytics/03F-analytics-owner-runbook.md § 13]`. **Sin datos no hay comparación** (MN-03) | MO-01.3, MO-07 |
| LB-06 | Search Console: URLs indexadas, cobertura y 404 antes del corte (propiedad y verificación `NOT_AVAILABLE`) | T-24h · dueña | `NOT_AVAILABLE` `[DOC:seo/03E-redirect-plan.md § 5.5]` | MO-05.4 |
| LB-07 | Ajustes de Checkout (SR-07) y de Notificaciones de la tienda comercial | CT-47 (T-1h con D-CT2 = A; T+15m con B), donde el cutover manda cerrar SR-07 `[DOC:launch/03G-cutover-runbook.md CT-47, § 5.4]`; las notificaciones no tienen paso propio en el cutover: leerlas en el mismo momento `[INFERIDO]` · dueña, Claude lee | `NOT_VERIFIED`: `settings/checkout` no cargó en 03G y las notificaciones no se abrieron (B20) `[MEDIDO-03G]` | MO-01.4, MO-08 |
| LB-08 | Remitente, idioma y asunto del correo de confirmación y del código de ingreso, y cuánto tardó el código | CT-21 y CT-27 (T-4h: confirmación de un pedido de prueba y código de ingreso) y CT-47 (T-1h con D-CT2 = A; T+15m con B). CT-82 es posterior a T0: es la primera lectura de 08.2, no una línea base · dueña | `NOT_AVAILABLE`: 03G no probó el correo de confirmación de pedido (no creó ningún pedido) `[DOC:launch/03G-checkout-precondition-audit.md § 6]` | MO-08 |

**Valores de referencia fijos** (los chequeos comparan contra estos):

| Referencia | Valor | Fuente |
|---|---|---|
| Catálogo | 29 productos / 98 variantes / 95 imágenes (29 / 97 / 95 si CT-04 quita la XL de `alba-dorada-cafe-claro`, SKU `LG-AUR-000001-XL`) | `[MEDIDO-03G]` snapshot; `[DOC:launch/03G-cutover-runbook.md CT-04]` |
| Redirecciones | 47 filas (SHA-256 del CSV `ba369467…18b1d6`, verificado por el script); 51 con las 4 legales | `[MEDIDO-03G]`; `[DOC:launch/03G-cutover-runbook.md CT-06]` |
| Rutas | 58 con 200 hoy: 40 con redirección, 5 con equivalente directo, **13 sin redirección ni destino** (4 legales, 4 del blog, 5 colecciones no migradas) | `[MEDIDO-03G]` script; `[DOC:launch/03G-route-parity.md § 6]` |
| Moneda y formato | COP, `$ 199.920`, checkout `es-co` con país Colombia | `[DOC:launch/03G-cutover-runbook.md CT-07]` |
| Envío gratis | Desde $ 299.900, regla `>=`, después del cupón; tarifa bajo el umbral: D2 (`NOT_SET`) | `[DOC:shipping/03F-owner-shipping-runbook.md]` |
| Eventos | 11 de GA4 y 7 de Meta en el embudo; `AddShippingInfo` no existe en Meta | `[DOC:analytics/03F-analytics-owner-runbook.md § 7, § 8.2]` |
| Wompi | Estados `PENDING`, `APPROVED`, `DECLINED`, `VOIDED` (solo tarjetas), `ERROR`; montos en centavos ($ 159.920 = 15.992.000); reintentos de eventos a los 30 min, 3 h y 24 h (contados desde cada evento: § 5); un pendiente vence en 3 días como máximo (recomendación de Shopify para apps de pago; que la app de Wompi la use: `[NOT_VERIFIED]`, NV5) | `[DOC:payments/03F-wompi-owner-runbook.md § 5.1, § 9]`; `[DOC:payments/03E-wompi-shopify-feasibility.md E24]` |
| Release | Theme RC1.8 (`e893b386…9e67`, 96 archivos); app de favoritos 0.1.2 (`19c8c0df…e4b2`) | `[MEDIDO-03G]` snapshot |

## 5. Puntos de control

| Punto | Coincide con el cutover | Enfoque | Qué es normal en ese momento | Por qué ahí |
|---|---|---|---|---|
| **T+15m** | CT-71…CT-75; decisión G6 | El dominio ya sirve Shopify; redirecciones completas; humo de compra hasta el pago **sin pagar**; canonical y robots; ajustes de Pagos y URL de eventos | Casi ningún pedido. Durante la propagación conviven los dos sitios hasta que venza el TTL previo (SY-12) `[DOC:launch/03G-rollback-plan.md § 6]`. GA4 ya recibe `page_view` (contraseña quitada en CT-51); **Meta aún no**: se conecta en CT-74, dentro de este punto (MN-08) | Es la primera vez que se ve el sitio con tráfico real; RB-01 y RB-02 se deciden aquí |
| **T+1h** | CT-81…CT-86; decisión G7 | Primer pedido real seguido de punta a punta (CT-85); analítica completa; cuentas, favoritos; sitemap enviado | Los pagos de los primeros 30 min ya tuvieron su primer reintento de Wompi (30 min, contado desde cada evento: nota de abajo). GA4 y Meta con eventos reales | Cierra la "ventana crítica" del cutover (G7), pero **no** el monitoreo |
| **T+4h** | *No existe en el cutover* (MN-01, D-MO7) | Conciliación de los pagos a los que ya les venció el segundo reintento de Wompi (3 h); repetir humo de checkout y matriz de redirecciones; inventario; correos; duplicados | Pendientes de Wompi todavía abiertos; posibles pedidos que aparecieron tarde | El único punto entre T+1h y T+24h; sin él, un cobro sin pedido detectado a T+1h no tiene seguimiento hasta las 24 h |
| **T+24h** | CT-91…CT-96; decisión G8 | Conciliación final de los pagos a los que ya les venció el tercer reintento de Wompi (24 h); línea base de Search Console; PageSpeed; archivo y traspaso a S17 | Los pendientes que sigan abiertos vencen hasta 3 días después: no se cierran en este punto (§ 9.3) | Cierra la ventana (G8) |

**Los reintentos de Wompi se cuentan desde cada evento, no desde T0** `[INFERIDO]`: el runbook de Wompi mira 5 y 35 min después de cada pago de prueba porque el primer reintento es a los 30 min `[DOC:payments/03F-wompi-owner-runbook.md § 9 caso 5]`. Un pago aprobado en T+1h tiene su reintento de 3 h en T+4h y el de 24 h en T+25h, ya fuera de la ventana. Por eso, además de los puntos de control, cada fila de la hoja § 8.3 se vuelve a mirar después de sus propios reintentos (30 min, 3 h y 24 h contados desde su hora del `APPROVED`; el margen lo fija la dueña, D-MO2), y lo que venza después de T+24h pasa a S17 (§ 9.3). T+4h y T+24h cubren solo los pagos a los que ya les tocó ese reintento (MN-16).

**Entre puntos de control:** la dueña deja abiertos Pedidos y el panel de Wompi; cada pedido y cada transacción nueva se anota en la hoja de conciliación (§ 8.3) cuando aparece, sin esperar al punto siguiente. Una `[A]` entre puntos se registra y se atiende (R-M8).

## 6. Áreas de monitoreo

Columnas: **Cuándo** = puntos de control (`15m`, `1h`, `4h`, `24h`). **Actúa** = quién ejecuta el chequeo y, en itálica, quién corrige. **→ Rollback** = paso `RP-##` de `launch/03G-rollback-plan.md`, síntoma `SY-##` y criterio `RB-##` del cutover. Lo **irreversible** va en negrita con su razón (tabla del § 7). Todos los chequeos son lectura y reversibles; los humos no crean pedidos.

### MO-00 Dominio, HTTPS y quién sirve el sitio

**Ficha.** Paso: S15, S16 · Quién: Claude ejecuta los comandos; la dueña ve la pantalla de dominios y el TTL · Reversible: sí (lectura) · Depende de: CT-61…CT-64 · Evidencia de OK: 00.1 a 00.3 en OK en los cuatro puntos · Rollback: RB-01 → rollback total (plan de rollback § 12.2: RP-10, RP-11, RP-12, RP-13); SY-22 no es rollback.

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 00.1 | Quién sirve el dominio y que la Home no muestre la contraseña | `curl.exe -sI https://radaelliswimwear.com/producto/bikini-foam` (301 = Shopify, código exacto `[NOT_VERIFIED]`; 200 = sitio actual `[MEDIDO-03G]`) y `curl.exe -sI https://radaelliswimwear.com/` (200, sin `Location` a `/password`) | 15m · 1h · 4h · 24h | `[A]` respuesta 200 en la ficha **una vez vencido el TTL previo** (TTL `NOT_AVAILABLE`, D-CT3): mezcla persistente (SY-12). `[A]` la Home muestra la página de contraseña (SY-22). Durante la propagación la mezcla es esperable: se anota hora y resultado | Claude | SY-12: esperar el TTL; si persiste, RB-01 → rollback total en el orden del § 12.2 del plan de rollback (RP-10 y RP-11 antes de RP-12; después RP-13) (**RP-12: los pedidos, 301 servidos y correos ocurridos entre medias no se deshacen, I-03**). SY-22: acceso Público, no es rollback |
| 00.2 | HTTPS válido en apex y `www`, salto `http` a `https` y dominio primario | `curl.exe -sSI https://radaelliswimwear.com/` y con `www`, **sin `-k`**; `curl.exe -sI http://radaelliswimwear.com/`; pantalla de dominios de la tienda (nombre en español `[NOT_VERIFIED]`) | 15m · 1h · 4h · 24h | `[A]` cualquier error de certificado; `[A]` `http` responde 200 sin saltar; `[A]` la variante no primaria no salta al primario (D-CT4) o entra en bucle | Claude | RB-01 → rollback total (mismo orden: RP-10 y RP-11 antes de RP-12; después RP-13). Certificado tras devolver el DNS a Vercel: `[NOT_VERIFIED]` |
| 00.3 | `robots.txt`, sitemap y canonical del dominio real | `curl.exe -s https://radaelliswimwear.com/robots.txt` (Shopify 3.642 bytes en la Dev Store; el sitio actual 228 bytes con `Host:` y `Disallow: /admin` `[MEDIDO-03G]`); `/sitemap.xml` con 200; `/` (español) y `/en` (inglés) con 200 (V7 del runbook de mercado); canonical de la Home igual a `https://radaelliswimwear.com/` (o `www` si D-CT4) y `hreflang` `x-default`, `es`, `en`. `/en` y el `hreflang` `en` aplican solo si D-CT19 = publicar el inglés (con despublicarlo dejan de servirse y el `hreflang` cambia `[INFERIDO]`) `[DOC:launch/03G-cutover-runbook.md CT-73, D-CT19]` | 15m · 4h · 24h | `[A]` canonical en `*.myshopify.com`; `[A]` `robots.txt` del sitio actual; `[S]` regla `/policies/` bloqueada (`[NOT_VERIFIED]`: hace que `/devoluciones` deje de ser indexable) | Claude | Fix-forward: corregir el primario (CT-62). No es rollback |

### MO-01 Errores de checkout

**Ficha.** Paso: S02, S10, S11, S14 · Quién: Claude (ventana visible) con la dueña · Reversible: sí (lectura; el humo no paga y la dirección de prueba, si hace falta, la escribe la dueña) · Depende de: CT-72, S10 con D2 decidida, S11 · Evidencia de OK: 01.1 en OK con los tres carritos y 01.2 sin coincidencias con Wompi · Rollback: contención RP-01, RP-02 o RP-03 (DR-05); RB-02, SY-01…SY-03 y RB-03/RB-04 (01.2).

**Nota del humo (01.1):** llegar hasta la pantalla de pago **sin pagar**. Son dos lecturas distintas. (a) **Sin escribir nada en el checkout:** abrir `/checkout` con el carrito y leer la ruta, el idioma, los importes y el mensaje de pago, como en V6 del runbook de mercado; así se midió el checkout en 03G, sin crear pedido `[MEDIDO-03G]` `[DOC:theme/03F-owner-market-colombia-runbook.md § 8]`. (b) **Método de envío:** el checkout medido en 03G decía "Ingresa tu dirección de envío para ver los métodos disponibles" `[MEDIDO-03G]` `[DOC:launch/03G-checkout-precondition-audit.md § 1]`, así que el envío **no se ve sin dirección**. Se lee con `estimate()` (T1 a T4 del runbook de envío, sin checkout) y, en el checkout real, con una dirección de prueba que **escribe la dueña** (T10: "la dueña llega hasta la pantalla de pago sin pagar; Claude solo observa"; Claude no escribe datos en el checkout, S9) `[DOC:shipping/03F-owner-shipping-runbook.md § 10, § 11]`. Esa lectura puede dejar un checkout abandonado con datos de prueba de la dueña: se marca `PROPIO` y se excluye de 01.2, 01.3 y de toda comparación (R-M6) `[INFERIDO]`. Que la pantalla de pago (con Wompi) se vea sin escribir dirección: `[NOT_VERIFIED]`. El checkout a 390 px nunca se midió (`[DOC:theme/03F-mobile-checkout-baseline.md]`): la lectura de CT-26 en teléfono real es la referencia y los primeros checkouts móviles reales se comparan con ella.

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 01.1 | Humo con país Colombia, 3 carritos: 1 × `bikini-shadow-azul-marino` M (`$ 159.920`), 1 × `brisa-natural-beige` S (`$ 199.920`) y 2 × `bikini-shadow-azul-marino` M (`$ 319.840`, sobre el umbral) | Navegador con la ventana visible: `/cart.js` (moneda) y checkout `…/es-co`; mismos pasos de CT-72, V2 (visitante nuevo resuelve a CO), V4, V5 y V6 del runbook de mercado (`theme/03F-owner-market-colombia-runbook.md § 8`) y casos T1 a T4 y T10 del runbook de envío | 15m · 1h · 4h · 24h | `[A]` `POST /cart/add.js` 422 o "Producto agotado" con país CO (SY-01). `[A]` un visitante nuevo que no resuelve a CO. `[A]` un impuesto en el total (el sitio actual no cobra IVA `[DOC:launch/evidence/reference-docs/architecture-map.md]`; los ajustes de impuestos de la tienda comercial no se leyeron: `[NOT_VERIFIED]`, B20). `[A]` sin método de envío o error de envío, leído con `estimate()` o con la dirección de prueba de la dueña (SY-03). `[A]` "Esta tienda no puede aceptar pagos en este momento" (SY-02). `[A]` checkout en `es-us`, moneda distinta de COP o total con formato de EE. UU. (`COP $183,920.00`, CK-03). `[A]` Wompi no aparece en el paso de pago. `[A]` envío gratis ausente con el carrito de $ 319.840 o presente en los de 1 prenda con la opción de D2 que no lo prevé. Resultado esperado del envío bajo el umbral: el de la opción D2 elegida (`NOT_SET` hoy) | Claude · *dueña corrige* | SY-01 y SY-03: corregir adelante (S10/S02), con RP-02 solo si hay que contener; SY-02: reactivar S11 (RP-15 al revés); **RB-02** si nadie con Colombia puede comprar `[DOC:launch/03G-cutover-runbook.md § 8.3]` |
| 01.2 | Checkouts abandonados con pago intentado, frente al panel de Wompi | Admin > Pedidos > Checkouts abandonados (nombre en español `[NOT_VERIFIED]`) y panel de Wompi de producción | 1h · 4h · 24h | `[A]` un checkout abandonado (sin contar los del humo, `PROPIO`) cuyo contacto y monto tienen una transacción `APPROVED` en Wompi (patrón de RB-04: pedido "abandonado" pese al pago real `[DOC:launch/evidence/reference-docs/wompi-payments.md § 6E]`). `[S]` más checkouts abandonados que en la lectura anterior sin explicación: solo se registra el número | Claude lee · dueña abre Wompi | RB-03/RB-04 → C0 RP-01, luego RP-20 y RP-50 |
| 01.3 | Embudo por paso: `begin_checkout` → `add_shipping_info` → `add_payment_info` → `purchase` | Shopify Analytics (Admin > Análisis: informe de conversión o embudo y vista en vivo; nombres y disponibilidad por plan `[NOT_VERIFIED]`, plan `NOT_AVAILABLE`) `[PRÁCTICA-GENERAL]` y GA4 (DebugView o Realtime) | 1h · 4h · 24h | `[A]` un paso que sí ocurrió (lo confirma el humo del equipo o un pedido real) y no tiene su evento: bloqueo de ese paso. Con poco tráfico, un paso sin eventos por sí solo no prueba nada. `[S]` la caída entre pasos frente a la lectura anterior: sin umbral y **sin línea base del sitio actual** (LB-05) | Claude · dueña abre GA4 | Según el paso: envío → SY-03; pago → SY-02/RB-02 |
| 01.4 | Ajustes de Checkout sin cambios (contacto por correo, teléfono de envío requerido) | Admin > Configuración > Checkout, frente a LB-07/SR-07 y a lo fijado en P3.1 del runbook de Wompi (contacto por correo, teléfono de envío requerido) `[DOC:payments/03F-wompi-owner-runbook.md § 7]` | 15m · 24h | `[A]` un ajuste distinto del registrado sin un cambio anotado (R-M7) | Claude lee | RP-19 solo si la dueña decide restaurar |
| 01.5 | Reportes de clientas: "no puedo pagar", "no puedo agregar", "no aparece el envío" | Canal de D-MO3 | Continuo; se resume en cada punto | `[A]` cualquier reporte hasta descartarlo. Un reporte de "dónde está el pago por WhatsApp" se cuenta y no es anomalía: ese flujo no existe igual en Shopify (§ 9.4 del cutover) | Dueña recibe · Claude registra | Según la causa (SY-01…SY-03) |

### MO-02 Pagos y estados

**Ficha.** Paso: S11 · Quién: la dueña abre el panel de Wompi; Claude lee Pedidos y concilia · Reversible: sí (lectura) · Depende de: CT-46, CT-47 · Evidencia de OK: hoja de conciliación (§ 8.3) sin filas abiertas salvo pendientes registrados · Rollback: contención RP-01 (desactivar Wompi), luego RP-20 y RP-50; SY-02, SY-04, SY-05, SY-06; RB-03 y RB-04.

**Cómo se lee un estado** (`[DOC:payments/03F-wompi-owner-runbook.md § 9]`; lo marcado NOT_VERIFIED se mide en la ventana y se anota lo que ocurre):

| Wompi | Shopify esperado | Se confirma en producción | Anomalía |
|---|---|---|---|
| `APPROVED` (aprobado) | Un pedido nuevo con pago **Pagado**, COP y el mismo monto que Wompi (en centavos) | 1 pedido y 1 transacción por compra; monto y moneda | `[A]` `APPROVED` sin pedido (**bloqueante**, SY-04). `[A]` Pagado con monto o moneda distintos de Wompi. `[A]` Pagado sin `APPROVED` en el panel de **producción** (incluye un pago con llaves de prueba por error) |
| `DECLINED` o `ERROR` (rechazado) | Ningún pedido y un mensaje de error a la clienta; el checkout puede quedar en Checkouts abandonados (`[NOT_VERIFIED]`) | Ningún pedido asociado | `[A]` un pedido Pagado asociado a una transacción `DECLINED` o `ERROR`. `[S]` proporción de `DECLINED`/`ERROR` distinta de la de LB-02 (mismo panel, 24 h previas) |
| `PENDING` (pendiente) | Un pedido con pago **Pendiente** si la app usa el estado pendiente de Shopify (`[NOT_VERIFIED]`, NV5); mientras está pendiente Shopify puede impedir editarlo, cancelarlo o capturarlo; vence en 3 días como máximo | Lista abierta en cada punto; pasa a Pagado o se rechaza | `[A]` pedido Pendiente cuyo pago en Wompi ya es `APPROVED` o `DECLINED`. `[A]` `PENDING` sin pedido ni checkout asociado. **Un pendiente no es anomalía por sí solo** y no se cancela a mano antes de verificarlo en Wompi (solo los vencidos, RP-50 c) |
| `VOIDED` (anulado; solo tarjetas) | `[NOT_VERIFIED]` cómo lo muestra Shopify | Aparece solo si la dueña anuló o reembolsó | `[A]` `VOIDED` sin una acción de la dueña |
| Shopify "Reembolsado" o "Reembolsado parcialmente" | Wompi debería reflejarlo (anulación en tarjetas; reembolso de otros medios: `[NOT_VERIFIED]`, NV6) | Estado del pedido y transacción coherentes | `[A]` "Reembolsado" en Shopify sin rastro en Wompi: señal de riesgo del caso 4 (SY-05) |

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 02.1 | Wompi activo en **producción**, sin facturación por aceptar, y URL de eventos de producción apuntando a la de Shopify y sin cambios respecto de lo anotado (se cargó en CT-46 con D-CT2 = A y en T0 con D-CT2 = B) | Admin > Configuración > Pagos; panel de Wompi > Desarrolladores > Seguimiento de transacciones | 15m · 24h | `[A]` Wompi desactivado, con un indicador de modo prueba (`[NOT_VERIFIED]` que exista), o URL distinta de la anotada; `[A]` pantalla de facturación o cargo pendiente de aceptar (R3) | Claude lee · dueña abre Wompi | SY-02 → reactivar S11; RP-16 restaura la URL de eventos |
| 02.2 | **Conciliación de tres fuentes** por cada transacción y pedido: Shopify (Pedidos y pago), panel de Wompi de producción y, si D-CT2 = B, el sitio actual. Se anota la hora del `APPROVED`, la hora en que aparece el pedido, el monto y la moneda | Hoja de conciliación § 8.3; Admin > Pedidos; panel de Wompi > transacciones (nombre exacto `[NOT_VERIFIED]`) | 15m · 1h · 4h · 24h | `[A]` `APPROVED` sin pedido a los 5 min de aparecer (el tiempo de espera del caso 5 del runbook de Wompi, `[DOC:payments/03F-wompi-owner-runbook.md § 9]`; no es un umbral de negocio): se registra y se vuelve a mirar antes del punto siguiente (el evento puede llegar tarde). `[A]` **sigue sin pedido después del primer reintento de Wompi (30 min desde el `APPROVED`; el runbook mira a los 35 min)**: SY-04. `[A]` monto o moneda distintos. `[A]` fila que sigue abierta después de su segundo reintento (3 h) o de su tercero (24 h), contados desde su propio `APPROVED` (§ 5, nota). Cuántos cobros sin pedido se toleran: DR-02 (`NOT_AVAILABLE`) | Claude concilia · dueña decide | SY-04 → C0: RP-01, luego RP-20 y RP-50; RB-03 → rollback si no hay explicación inmediata (**RP-50: los cobros reales no se deshacen, solo se corrigen con nuevos movimientos, I-04**) |
| 02.3 | Pendientes abiertos | Admin > Pedidos (pago Pendiente) y transacciones `PENDING` de Wompi | 1h · 4h · 24h | `[A]` los de la tabla de estados. Al T+24h los pendientes abiertos pasan a S17 (§ 9.3) | Claude lee | RP-50 c: cancelar solo un pendiente vencido |
| 02.4 | Rechazadas y `ERROR` frente a la línea base | Panel de Wompi, misma lectura que LB-02 (filtro por estado: `[NOT_VERIFIED]`). GA4 y Meta no tienen un evento de pago fallido (`payment_failed` es un hueco de `[DOC:analytics/03E-analytics-plan.md § 10]`): solo el panel de Wompi lo muestra | 4h · 24h | `[S]` proporción de `DECLINED`/`ERROR` distinta de la de LB-02: se registra; una proporción de `ERROR` inusual hace sospechar de la configuración `[INFERIDO]` | Dueña | Si apunta a la configuración: SY-02 |
| 02.5 | Reembolsos y anulaciones hechos en la ventana (sin contar CT-47) | Admin > Pedidos (estado) y panel de Wompi (`VOIDED` o reembolso) | 4h · 24h | `[A]` "Reembolsado" sin rastro en Wompi (SY-05); `[A]` `VOIDED` sin acción de la dueña | Dueña | SY-05 → C0 RP-01; preguntar a Wompi (P3); RP-53 |
| 02.6 | Pedido Pagado sin `APPROVED` en producción | Pedidos frente al panel de **producción** | 1h · 4h · 24h | `[A]` cualquier ocurrencia | Claude concilia · dueña decide | RP-50 b: no despachar hasta aclarar con Wompi; C0 RP-01 si se repite |

### MO-03 Pedidos duplicados

**Ficha.** Paso: S11, S14, S16 · Quién: Claude lee y compara; la dueña confirma con la clienta · Reversible: sí (lectura) · Depende de: MO-02.2 · Evidencia de OK: 03.1 a 03.3 sin coincidencias · Rollback: contención RP-01, luego RP-50 d (reembolsar uno); SY-06 y SY-20 (RP-47…RP-52); RB-03.

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 03.1 | Dos pedidos con las mismas líneas, el mismo total y el mismo contacto que la clienta no pidió | Admin > Pedidos, ordenados por fecha; se confirma con la clienta por el canal de D-MO3 | 15m · 1h · 4h · 24h | `[A]` cualquier ocurrencia confirmada | Claude · *dueña* | SY-06 → C0 RP-01; RP-50 d (reembolsar uno; **el cobro duplicado no se deshace, solo se reembolsa, I-04**) |
| 03.2 | Dos transacciones `APPROVED` con la misma referencia, monto y comprador para un solo pedido | Panel de Wompi de producción | 15m · 1h · 4h · 24h | `[A]` cualquier ocurrencia (doble cobro, RB-03) | Dueña abre · Claude lee | RB-03; C0 RP-01; RP-50 d |
| 03.3 | Pedidos entrando en los dos sistemas | Admin de Shopify y `/admin/pedidos` del sitio actual por la URL propia del proyecto en Vercel (CT-14); incluye pedidos de WhatsApp pendientes (CT-41) | 15m · 1h · 4h · 24h | `[A]` un pedido nuevo en el sitio actual **con D-CT2 = A** (debería estar en pausa con `WRITES_PAUSED`). Con D-CT2 = B los rezagados son esperables hasta que venza el TTL previo: se atienden a mano y se anotan en la hoja (CT-75) | Dueña entra al panel · Claude registra | SY-20 → C0 en el sistema que no debe recibir; RP-47…RP-52 |

### MO-04 Anomalías de inventario

**Ficha.** Paso: S04, S10, S14 · Quién: Claude lee `/products.json` y Pedidos; la dueña aporta el stock real (LB-03) · Reversible: sí (lectura); activar seguimiento es reversible, **eliminar una variante o un handle no (CT-04, I-07)** · Depende de: D-MO1 · Evidencia de OK: 04.1 a 04.5 sin coincidencias · Rollback: despublicar en vez de eliminar (RP-43, RP-44); stock del sitio actual en un rollback total (RP-52); DR-07, G-04 y SY-19.

**Dos ramas según D-MO1.** Los chequeos dicen a cuál aplican.

| | **Rama A: se rastrea** | **Rama B: no se rastrea (estado de hoy)** |
|---|---|---|
| Qué protege Shopify | Deja de ofrecer la talla al llegar a 0. Con seguimiento, agregar más unidades que el stock da 422 `[DOC:launch/03G-reproducibility-gap-audit.md G02]` (propuesta; no medido en 03G) | Nada: todo figura en existencia; el mensaje "Cantidad máxima disponible…" del carrito no debería aparecer `[INFERIDO]` |
| Cómo se ve una venta | Cambia la cantidad en el Admin | Solo en las líneas de pedido `[DOC:launch/03G-rollback-plan.md § 8.10]` |
| Qué hay que tener | LB-03 cargado antes de T-1h (CT-43) | LB-03 en poder de la dueña para comparar |
| Riesgo residual | Diferencias entre el conteo de Shopify y el físico | **Sobreventa desde el primer pedido** `[DOC:launch/03G-reproducibility-gap-audit.md C08]` |

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 04.1 | Disponibilidad de las variantes con país Colombia | Sesión de prueba con `PUT /localization` a CO y `fetch('/products.json?limit=250')` (como en 03G y en V3 y V4 del runbook de mercado); Admin > Productos | 15m · 1h · 4h · 24h | `[A]` **rama B:** cualquier variante `available:false` (sin seguimiento todo debe estar disponible: apunta a S10/C2). **Rama A:** una variante `available:false` sin ventas que lo expliquen. `[A]` 0 de 29 productos disponibles con CO (SY-01) | Claude | SY-01 → corregir S10/S02; RP-02 solo para contener |
| 04.2 | Unidades vendidas por SKU-talla frente al stock real declarado (LB-03) | Admin > Pedidos (líneas por SKU-talla; exportación del Admin `[PRÁCTICA-GENERAL]`) y hoja de la dueña | 1h · 4h · 24h | `[A]` unidades vendidas de un SKU-talla mayores que el stock declarado (sobreventa). **Rama A:** además, cantidad en el Admin distinta de stock inicial menos vendidas | Claude compara · dueña decide | Despublicar la variante o el producto (RP-43, reversible; **eliminar no**) y contactar a la clienta; corrección adelante |
| 04.3 | Ventas de la variante XL de `alba-dorada-cafe-claro` (SKU `LG-AUR-000001-XL`) mientras F-01 siga abierto | Admin > Pedidos, búsqueda por SKU | 1h · 4h · 24h | `[A]` una línea de pedido con ese SKU (el sitio actual no ofrece la XL `[MEDIDO-03G]`) | Claude | SY-19 → corregir el dato en S04 (**quitar la variante es irreversible, CT-04**) |
| 04.4 | Pedidos rezagados en el sitio actual (D-CT2 = B) y su efecto en el stock | `/admin/pedidos` del sitio actual (URL del proyecto) | 15m · 1h · 4h · 24h | `[A]` un pedido del sitio actual después de T0: descuenta stock en el sitio actual y no en Shopify. Se ajusta el stock declarado (rama B) o el de Shopify (rama A) | Dueña · Claude registra | En un rollback total: RP-52 |
| 04.5 | **Rama A:** ajustes de inventario sin pedido que los explique | Admin > Productos > Inventario y su historial (nombre `[NOT_VERIFIED]`) | 4h · 24h | `[A]` un cambio de cantidad sin pedido ni ajuste registrado; `[A]` stock negativo | Claude lee | Corrección adelante; sin rollback |

### MO-05 404 y redirecciones

**Ficha.** Paso: S06, S15 · Quién: Claude corre los comandos; la dueña abre Search Console · Reversible: sí (lectura). Correcciones: una fila y reimportar son reversibles; **eliminar o renombrar handles no (I-07)** · Depende de: CT-06, CT-05, CT-45 · Evidencia de OK: matriz completa sin `[A]` y `RESULTADO: OK` del script de línea base · Rollback: RP-37 a RP-39 (reimportar o corregir filas), RP-44 (handles); SY-09, SY-10, SY-11, SY-21 (corregir adelante; no dispara rollback por sí solo `[DOC:launch/03G-cutover-runbook.md § 8.4]`).

**Lista de vigilancia** (`node launch/tools/03g-monitoring-404-baseline.mjs`; sale de los archivos guardados, sin peticiones):

| Grupo | URLs | Primer salto esperado en Shopify | Fuente |
|---|---:|---|---|
| Con redirección en el CSV que dan 200 hoy | 40 | 301 al destino del CSV y destino final 200; las 9 `/cuenta*` terminan en el dominio de cuentas de Shopify (2 saltos por diseño) | `[MEDIDO-03G]` script |
| Con equivalente directo (`/`, `/checkout`, `/search`, `/robots.txt`, `/sitemap.xml`) | 5 | `/`, `/search`, `/robots.txt` y `/sitemap.xml`: 200 (rutas nativas, medidas en la Dev Store). **`/checkout` no da 200:** con carrito, un GET redirige a `/checkouts/cn/<token>/es-us` (`es-co` tras A1) y sin carrito no se midió `[NOT_VERIFIED]`; se anota lo que responda y no es anomalía | `[MEDIDO-03G]` script; `[MEDIDO-03G]` `launch/evidence/dev-routes.json` |
| **Sin redirección ni destino: 4 legales** (`/envios`, `/terminos`, `/privacidad`, `/cookies`) | 4 | 301 y 200 **solo si CT-05 creó la página**; sin página es 404 y NO-GO antes de T0 | `[DOC:launch/03G-cutover-runbook.md CT-05]` |
| **Sin redirección ni destino: blog** (`/blog` y 3 posts) | 4 | 404 (D-CT6 pendiente) | `[MEDIDO-03G]` |
| **Sin redirección ni destino: colecciones no migradas** (`/accesorios`, `/hombre`, `/mujer`, `/ninos`, `/calzado`) | 5 | 404 | `[MEDIDO-03G]` |
| Origen del CSV que el rastreo no pidió (`/cuenta/pedidos`, `/cuenta/perfil`, `/cuenta/direcciones`, `/cuenta/registro`, `/cuenta/recuperar-contrasena`, `/cuenta/restablecer-contrasena`, `/cuenta/verificar-email`) | 7 | 301 a `/account*` | `[MEDIDO-03G]` script |
| 404 hoy en el sitio actual (17 rutas distintas: 16 del rastreo, incluido el literal `/blog/<slug>`, más `/producto/costa-esmeralda-azul` en minúsculas del sondeo) | 17 | Siguen en 404, salvo la de minúsculas, que en Shopify **sí** redirige (no distingue mayúsculas, medido en la Dev Store) | `[MEDIDO-03G]`; `[DOC:seo/03F-redirect-import-result.md § 3]` |
| Sitemap actual | 45 | 35 con redirección, 1 directa, 4 legales, 4 del blog, 1 no migrada | `[MEDIDO-03G]` script |

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 05.1 | Matriz de redirecciones completa: las 47 filas, las 4 legales, las 9 que deben dar 404 y las de plataforma | `node launch/tools/03g-cutover-redirect-matrix.mjs` (imprime los comandos) y `curl.exe -sI` de cada uno; el bucle sobre el CSV está en `seo/03E-redirect-plan.md § 7.4`. **15m: completa (CT-71). 1h: las 29 fichas, las 4 colecciones y las 13 sin destino. 4h y 24h: completa** | 15m · 1h · 4h · 24h | `[A]` 404, 302 o bucle en cualquiera de las 29 fichas o de las 4 colecciones. `[A]` primer salto distinto de 301 o `Location` distinto del CSV. `[A]` una de las 4 legales con 404 (debió bloquear G4). `[A]` una de las 9 "sin destino" que no da 404 (por ejemplo un 302 a la Home: Google desaconseja redirigir en masa a la Home `[DOC:seo/03E-redirect-plan.md § 4.1]`). `[A]` un salto de más frente a V-REDIR (1 salto; 2 en las `/cuenta*` por diseño; uno más por `www` a apex si D-CT4 lo exige) | Claude lee · *Claude corrige con OK* | RP-37 (una fila) o RP-38 + RP-39. **RP-38 (eliminar todas) solo con el DNS de vuelta en el sitio actual o para reimportar de inmediato: cada URL vieja indexada da 404 mientras no haya redirecciones**. No eliminar ni renombrar handles (RP-44) |
| 05.2 | Variantes de URL fuera del CSV: `/producto/costa-esmeralda-azul` y `/producto/COSTA-ESMERALDA-AZUL`; `/buscar?q=bikini`; `/producto/bikini-foam?utm_source=x`; `/oasis-natural/`; `http` y `www` | `curl.exe -sI` de cada una (comportamiento medido en la Dev Store: no distingue mayúsculas, conserva el query y acepta la barra final) | 15m · 24h | `[A]` cualquiera sin redirigir o que pierda el query. `http` a `https` y `www` a apex nunca se probaron en el sitio actual (`[NOT_VERIFIED]` la línea base). `[S]` `?talla=`, `?color=`, `?precio=`, `?orden=` abren la colección sin filtrar: diferencia conocida `[DOC:launch/03G-cutover-runbook.md V-BÚSQUEDA]`, no anomalía | Claude | RP-37/RP-39 |
| 05.3 | 404 reales de visitantes | GA4 > Reports > Engagement > Pages and screens (nombre en español `[NOT_VERIFIED]`; `[PRÁCTICA-GENERAL]`), filtrando por el título de la página 404 del theme (se verifica el título con la ruta de control `/cuenta-inexistente-xyz`, 404 medido en 03F) y mostrando la ruta. Que Shopify Analytics liste 404: `[NOT_VERIFIED]` | 1h · 4h · 24h | `[A]` un 404 visitado en una URL que estaba en el sitemap actual o en las 47 filas (debía redirigir). `[S]` otros 404: se anota la ruta y se decide si merece una fila (la base es la lista de 58) | Claude · dueña abre GA4 | RP-37/RP-39 (agregar fila). No es rollback (SY-10) |
| 05.4 | Search Console: sitemap enviado, "No encontrada (404)" y "Página con redirección" | Search Console > Páginas y Sitemaps (propiedad `NOT_AVAILABLE`) | 1h (estado del sitemap) · 24h (línea base, CT-92) | `[A]` sitemap con error. `[A]` 404 en una URL con redirección esperada. `[S]` 404 nuevos: en 24 h Google puede no haber rastreado aún `[PRÁCTICA-GENERAL]`; la vigilancia dura 4 a 8 semanas `[DOC:seo/03E-redirect-plan.md § 7]` | Dueña abre · Claude lee | SY-11: no dispara rollback por sí solo `[INFERIDO]`; sí si hay 404 masivos sin corregir (SY-09, SY-10) |
| 05.5 | Metaetiquetas de indexación | `curl.exe -s` de `/search`, `/pages/favoritos`, `/pages/favoritos?view=wishlist` y una ruta inexistente: `noindex`; ficha, colección y legales sin `noindex` | 15m · 24h | `[A]` `noindex` ausente donde corresponde o presente en fichas y colecciones | Claude | Fix-forward (theme, release nuevo) |

### MO-06 Errores de carrito

**Ficha.** Paso: S03, S10 · Quién: Claude (ventana visible) · Reversible: sí (lectura; el carrito de prueba se vacía con `cart/clear.js`) · Depende de: CT-45, CT-72 · Evidencia de OK: 06.1 a 06.4 sin coincidencias · Rollback: RP-05 o RP-06 (theme) y RP-21 (cerrojo de envío gratis); SY-07, SY-18, SY-01.

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 06.1 | Flujo del carrito con país Colombia: agregar desde la ficha y desde el cajón, cambiar cantidad, quitar, abrir `/cart` y "Finalizar compra" | Navegador con la ventana visible; consola sin errores propios (criterio de 03E: 0 errores de JS propios) | 15m · 1h · 4h · 24h | `[A]` "Añadir al carrito" no abre el cajón o no suma. `[A]` "Finalizar compra" no abre el checkout. `[A]` un error de consola propio | Claude | SY-07 → RP-05 o RP-06 (**publicar un theme: sus consecuencias públicas no se deshacen, I-02**) |
| 06.2 | Respuestas de `/cart/add.js` y `/cart/change.js` y el evento `cart:error` (`{source, message}`, contrato de `assets/cart.js`) | Pestaña Network con filtro `cart`; en la consola `document.addEventListener("cart:error", console.log)` | 15m · 1h · 4h · 24h | `[A]` estado distinto de 200 para un producto disponible con país CO. `[A]` un `cart:error` sin causa conocida (fuera de stock en rama A, o red caída) | Claude | SY-01, SY-07 |
| 06.3 | Textos de error que ve la clienta: "No pudimos añadir el producto. Intentá de nuevo.", "No pudimos actualizar tu carrito. Intentá de nuevo.", "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.", "Cantidad máxima disponible para este producto: N.", "Producto agotado" y "Talla agotada" (`theme-src/locales/es.default.json`) | Reportes de clientas (D-MO3) y observación de los humos. El evento `cart_error` de GA4 solo existe con el custom pixel y su puente, que están apagados (G-PUENTE sin aplicar) | 15m · 1h · 4h · 24h | `[A]` cualquier reporte o captura de esos textos en una compra que debía funcionar. "Cantidad máxima…" solo aparece con seguimiento de inventario `[INFERIDO]`: si aparece con D-MO1 = B, es anomalía | Claude · dueña recibe | SY-01, SY-07 |
| 06.4 | La promesa de envío gratis frente al checkout | Banner de la Home, acordeón de la ficha y barra del carrito frente al checkout (casos T11 y T12); ajustes `free_shipping_rate_confirmed` y `cart_free_shipping_progress` frente a CT-07 | 15m · 4h · 24h | `[A]` una promesa visible que el checkout no cumple (SY-18). Diferencia conocida y menor (T12): la barra usa `cart.total_price`, que no incluye los códigos escritos en el checkout: se registra, no es anomalía | Claude | RP-21 (cerrojo; Claude con OK) o RP-07 |

### MO-07 Analítica: eventos, no duplicación y atribución

**Ficha.** Paso: S12 · Quién: la dueña abre GA4 y Meta; Claude observa las sesiones que ella deja abiertas · Reversible: sí (lectura). **Lo ya enviado a Google o Meta no se retira (I-09)** · Depende de: CT-51, CT-74, G-BANNER, G-LEGAL · Evidencia de OK: 07.1 a 07.6 sin `[A]` y la tabla V1 a V9 del runbook de analítica (§ 10.2) llena para el primer pedido · Rollback: RP-28 a RP-31 (desconectar la app o el pixel, banner); SY-16; RB-05 (no es rollback de DNS).

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 07.1 | GA4: los 11 eventos del embudo, una vez por acción, `currency` = `COP`, sin datos personales | GA4 > Admin > DebugView con Google Tag Assistant (o Realtime si DebugView no captura el checkout: `[NOT_VERIFIED]`); Claude solo observa | **15m: se anota lo que ya llegue (como mínimo `page_view` y `view_item`); el embudo completo se exige desde 1h (CT-81).** 1h: los 11. 4h · 24h | `[A]` un evento duplicado. `[A]` moneda `USD` (C1 sin resolver). `[A]` correo, teléfono, dirección, token o `q=` en un parámetro o en `page_location` (RB-05). `[A]` un evento del embudo que falta mientras esos pasos sí ocurren (comparar con 01.3). Excepción documentada: que el alta y la baja AJAX del cajón disparen `add_to_cart` y `remove_from_cart` es `[NOT_VERIFIED]` `[DOC:analytics/03E-analytics-plan.md § 13]`: si faltan solo desde el cajón, se registra como resultado de esa prueba y no como un bloqueo | Dueña abre · Claude observa | SY-16 → RP-28 (GA4) o RP-30 (pixel). RB-05: desconectar y corregir; **no** es rollback de DNS |
| 07.2 | Meta: los 7 eventos, un solo pixel y la deduplicación | Events Manager > Data sources > el dataset > Test events, Overview y Diagnostics; extensión de Chrome de Meta ("Duplicate Pixel code") | **15m: solo confirmar el canal conectado (CT-74); aún no hay eventos.** 1h · 4h · 24h | `[A]` "Duplicate Pixel code" o dos pixeles. `[A]` `PageView` doble. `[A]` con nivel Mejorado o Máximo, `Purchase` que no figura por "Browser and Server" deduplicado (cómo lo hace la app: `[NOT_VERIFIED]`). No es anomalía: `AddShippingInfo` no existe en Meta | Dueña abre · Claude observa | RP-29 (volver a Standard o desconectar; **lo ya compartido con Meta no se recupera, I-09**) |
| 07.3 | `purchase`: `transaction_id` con valor, un solo `purchase` por pedido, la recarga de la página de agradecimiento no suma y `value` igual al total del pedido | GA4 (DebugView o Realtime) y el pedido en el Admin (V1 a V9 del runbook de analítica) | 1h · 4h · 24h | `[A]` `transaction_id` vacío (GA4 deduplica todos los vacíos juntos). `[A]` la recarga suma otro. `[A]` `value` distinto del total. `[S]` GA4 con menos compras que Shopify: **esperable** (R8: la clienta paga en Wompi y no vuelve a la página de agradecimiento; y la lista de eventos de la app no incluye `refund`): se anota | Dueña abre · Claude compara | SY-16 → RP-28 |
| 07.4 | Consentimiento con el banner de Colombia (K1 a K4) | Una visita desde Colombia; Tag Assistant | 15m · 24h | `[A]` sin banner con Colombia (rige "permitir todo"). `[A]` eventos en GA4 o Meta después de rechazar todo (K1) | Dueña · Claude observa | RP-28…RP-30 (desconectar) y luego RP-31 (ajustes automáticos del banner): no dejar las apps sin banner en Colombia |
| 07.5 | Atribución: que las visitas con `utm_*` conserven la fuente después de las redirecciones y que el pago no las parta | GA4 > Reports > Acquisition (fuente y medio) y Explore (nombres en español `[NOT_VERIFIED]`; `[PRÁCTICA-GENERAL]`); Events Manager. Medido en la Dev Store: la redirección conserva el query (`?utm_source=x`) `[MEDIDO-03G]` `[DOC:seo/03F-redirect-import-result.md § 3]` | 1h · 4h · 24h | `[A]` un `purchase` atribuido al dominio de Wompi o al de cuentas de Shopify como referido. `[S]` mucho tráfico "directo" o `(not set)` frente al punto anterior: sin línea base del sitio actual (LB-05) | Dueña abre · Claude observa | D-MO4 (exclusión de referidos, `[PRÁCTICA-GENERAL]`); fix-forward |
| 07.6 | Conciliación pedidos, `purchase` y `Purchase`, sin contar `PROPIO` | Hoja de conciliación § 8.3 (columnas de GA4 y Meta) | 4h (informativo) · 24h (CT-91) | `[A]` GA4 con **más** `purchase` que pedidos (duplicados). `[S]` GA4 o Meta con menos que Shopify: esperable por R8; se anota la diferencia | Claude · dueña abre | SY-16 |

**Limitaciones que se registran y no bloquean:** la lista de eventos de la app no incluye `refund` (los ingresos de GA4 no bajan al reembolsar); las métricas personalizadas de GA4 tardan 24 a 48 h en verse (`[DOC:analytics/03F-analytics-owner-runbook.md § 8.3]`); el custom pixel sigue apagado (`ENABLED:false`), así que no hay eventos de favoritos ni `cart_error` en GA4.

### MO-08 Fallas de correos

**Ficha.** Paso: S13, S14 · Quién: la dueña recibe en su buzón; Claude registra y lee el Admin · Reversible: sí (lectura). **Un correo enviado no se retira (I-08)** · Depende de: CT-47, CT-82 · Evidencia de OK: 08.1 a 08.5 sin `[A]` · Rollback: fix-forward (`[DOC:launch/03G-cutover-runbook.md § 8.4]`: un correo que no llega no dispara rollback por sí solo); SY-17 y RP-41 (ocultar los enlaces de ingreso) para el código de ingreso.

La auditoría de viabilidad no encontró documentación oficial de reintentos ni de una cola visible para el comercio en las notificaciones nativas de Shopify ("No confirmado / probable brecha"; "en la práctica, una caja negra") `[DOC:launch/evidence/reference-docs/seo-analytics.md § 11]`. Por eso la detección es indirecta: cronología del pedido, buzón propio y reportes de clientas.

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 08.1 | Correo de **confirmación de pedido** de cada pedido real | Cronología del pedido en el Admin (¿registra el envío de la notificación?: `[NOT_VERIFIED]`); buzón de la dueña solo para pedidos `PROPIO`; reportes de clientas. Se compara remitente e idioma con LB-08 | 1h · 4h · 24h | `[A]` un pedido real cuya clienta reporta no haberlo recibido, tras revisar spam. `[S]` remitente o idioma distintos de LB-08 | Dueña · Claude registra | Fix-forward: revisar la notificación en Admin > Configuración > Notificaciones (`[NOT_VERIFIED]`, B20) |
| 08.2 | **Código de ingreso**: llega y en cuánto tiempo | La dueña lo pide con su **correo propio**; Claude no lo ve ni lo escribe. Se anota hora de solicitud y de llegada | 1h · 24h (4h opcional) | `[A]` no llega tras revisar spam. `[S]` llega mucho más tarde que lo anotado en LB-08: sin umbral | Dueña · Claude registra | SY-17 → mitigar con RP-41 (ocultar enlaces de ingreso) y compra como invitada (`[NOT_VERIFIED]`); **RP-42: el tipo de cuenta no tiene rollback** |
| 08.3 | Aviso interno de "pedido nuevo" (si D-MO6 lo activó) | Buzón de la dueña frente a Pedidos | 1h · 4h · 24h | `[A]` un pedido creado sin aviso | Dueña | Fix-forward (notificaciones) |
| 08.4 | Correo de despacho, si se despacha algún pedido dentro de la ventana (el despacho es manual con la transportadora, `[DOC:shipping/03E-shipping-source-of-truth.md § 0]`) | Cronología del pedido; reporte de la clienta | 24h | `[A]` un despacho marcado sin que salga el correo, tras revisar spam | Dueña | Fix-forward |
| 08.5 | Correos en cola del sitio actual de pedidos anteriores a la pausa: con `WRITES_PAUSED` el cron `process-email-outbox` se salta la corrida `[DOC:launch/03G-cutover-runbook.md § 5.2]` (MN-10) | Panel `/admin` del sitio actual por la URL del proyecto (si muestra los correos: `[NOT_VERIFIED]`) | 15m · 24h | `[A]` correos de pedidos previos a la pausa que no salieron | Dueña | Se decide fuera de este plan (el código del sitio actual no se cambia en la ventana) |

### MO-09 Errores de cuenta

**Ficha.** Paso: S13 · Quién: la dueña con su correo propio; Claude observa · Reversible: sí (cerrar sesión) · Depende de: A2, CT-27, CT-82 · Evidencia de OK: 09.1 y 09.2 en OK · Rollback: SY-17; RP-41 (mitigación) y RP-42 (no hay rollback del tipo de cuenta).

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 09.1 | Ingreso por código y cierre de sesión en el dominio real: la cabecera muestra la sesión, `/account` abre la cuenta nueva, idioma español y región Colombia | Navegador de la dueña (V-CUENTAS) | 1h · 24h | `[A]` el código no llega (MO-08.2). `[A]` el ingreso cae en una plantilla antigua. `[A]` la interfaz sale en `es-US` en lugar de Colombia | Dueña · Claude observa | SY-17 → RP-41 |
| 09.2 | Rutas viejas: las 9 `/cuenta*` redirigen a `/account*` (código exacto `[NOT_VERIFIED]`; `fetch` solo mostró una redirección opaca); en ventana de incógnito `/account/login` y `/account/register` llevan a las páginas de Shopify; `/cuenta/recuperar-contrasena` termina en el ingreso por código | `curl.exe -sI` de las 9 (matriz de MO-05.1) y ventana de incógnito | 15m · 4h · 24h | `[A]` 404 en cualquiera de las 9; `[A]` una plantilla legacy | Claude | RP-37/RP-39 (fila) |
| 09.3 | Reportes de clientas de cuenta | Canal de D-MO3 | Continuo; se resume en cada punto | `[S]` "mi contraseña no funciona" o "no encuentro mi cuenta o mis pedidos": **esperado** (las contraseñas no se migran y las clientas no se migran salvo D-CT12) `[DOC:launch/evidence/reference-docs/data-migration.md]`: se cuenta, no es anomalía. `[A]` "no me llega el código" (= 08.2) | Dueña (comunicación: D-CT11) | SY-17 |

### MO-10 Errores de favoritos

**Ficha.** Paso: S09 · Quién: Claude observa la consola y Network; la dueña ve los logs del backend · Reversible: sí (lectura; el interruptor `wishlist_account_sync` es instantáneo). **Desinstalar la app no revierte la custom distribution (I-01)** · Depende de: D-CT10, CT-45 · Evidencia de OK: 10.1 y 10.2 en OK; 10.3 solo si D-CT10 = sí · Rollback: SY-13, SY-14 → RP-32…RP-36.

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 10.1 | Favoritos de invitada: corazón en las fichas, contador, la lista se conserva al recargar y `?view=wishlist` la muestra; **ninguna llamada a `/apps/radaelli`** con `wishlist_account_sync` en false | Navegador (V-FAVORITOS); Network con filtro `apps/radaelli` | 15m · 1h · 24h | `[A]` la lista se pierde al recargar. `[A]` una llamada a `/apps/radaelli` con la sincronización apagada | Claude | SY-13 → RP-32 |
| 10.2 | `/favoritos` y `/cuenta/favoritos` llevan a `/pages/favoritos` con la plantilla `page.wishlist` asignada (CT-45) | `curl.exe -sI` y la página | 15m · 4h · 24h | `[A]` plantilla genérica sin lista, 404, o página indexable (debe llevar `noindex`) | Claude · *dueña asigna la plantilla* | Fix-forward; RP-37 si es la fila |
| 10.3 | **Solo si D-CT10 = sí.** Errores de la función (backend de favoritos) y de la extensión | Logs JSON del hosting del backend (host `NOT_AVAILABLE`, se elige en el paso 5 del runbook de favoritos): `route`, `method`, `status`, `code`, latencia, `rid`, `subj`; y Network con sesión. **El proxy real es `/apps/radaelli/wishlist`** (MN-05) | 1h · 4h · 24h | `[A]` `401 no_customer`, `401 invalid_signature`, `415`, `400 missing_csrf_header`, `401 invalid_token` o `401 shop_not_allowed`: son criterios GO/NO-GO del runbook de favoritos (pasos 11 y 12; para `400 missing_csrf_header` el runbook documenta una mitigación, `REQUIRE_CSRF_HEADER=false`, que se anota) `[DOC:theme/03F-owner-wishlist-install-runbook.md § 3]`. `[S]` `502 admin_error`, `503 admin_throttled`, `504 upstream_timeout`, `429 rate_limited` o `409 conflict`: la app reintenta y no pierde datos `[DOC:app/README.md § 3]`; se registra la proporción frente al total de requests del mismo log | Claude + dueña | SY-13 → RP-32; SY-14 → RP-33, RP-34; RP-36 solo como último recurso (**la custom distribution no vuelve, I-01**) |

### MO-11 Rendimiento

**Ficha.** Paso: S03, S07 · Quién: la dueña o Claude corren PageSpeed Insights (mide desde fuera); Claude inspecciona el HTML servido · Reversible: sí (lectura) · Depende de: CT-12 (media), CT-45 · Evidencia de OK: 11.1 a 11.4 sin `[A]` y sin empeoramiento `[S]` sin causa · Rollback: fix-forward con un release nuevo (fuera de la ventana si no bloquea la compra); si rompe la compra, SY-07 y RP-05 (RC1.7 sin tocar el theme vivo) o RP-06 (**I-02**).

**Lo que se mide y con qué.** **Hoy LCP, FCP y CLS reales no están medidos** (ventana de Chrome oculta; solo un CLS de 0 en la Home, medido con esa misma limitación) `[DOC:theme/03F-performance-final.md § 1]` `[DOC:theme/03E-performance-baseline.md]`, así que **no existe una línea base**. La primera medición pública (T+15m) es la referencia de esta ventana, no una meta. En las primeras 24 h no habrá datos de campo del navegador `[PRÁCTICA-GENERAL]`: solo laboratorio.

| ID | Qué mirar | Dónde | Cuándo | Anomalía | Actúa | → Rollback |
|---|---|---|---|---|---|---|
| 11.1 | Laboratorio de Home, una colección, una ficha, búsqueda y carrito | PageSpeed Insights sobre la URL pública (la vía que indican 03E y 03F para el LCP real). Se registra **cada corrida**: la variación entre corridas es normal `[PRÁCTICA-GENERAL]` | 15m · 4h · 24h | `[S]` LCP, CLS o bloqueo peores que la primera medición de la ventana sin que haya cambiado nada (release congelado). Con el video del hero subido (CT-12), el LCP pasa a ser el póster o el video, no el texto `[DOC:theme/03F-performance-final.md § 2]`; el peso de la media viene de A4: transferencia de 15,6 MB con los videos servidos (H.264) frente a 23,6 MB con los originales HEVC `[DOC:content/media/03F-media-owner-runbook.md § 12 punto 2]`, y su efecto en el LCP nunca se midió (`INFERENCIA`, § 10 punto 6 del mismo runbook). `[A]` una página que no carga o responde con error | Claude/dueña | Fix-forward (theme, release nuevo); SY-07 si rompe la compra |
| 11.2 | Informe de velocidad de la tienda de Shopify | Admin > Tienda online > Temas (informe de velocidad; nombre y ubicación `[NOT_VERIFIED]`, no se abrió en 03G) `[PRÁCTICA-GENERAL]` | 4h · 24h | `[S]` puntuación inferior a la primera lectura, sin umbral | Dueña abre · Claude lee | Fix-forward |
| 11.3 | Regresión estructural del theme en el dominio real: 0 JS bloqueante en `<head>`; imágenes con `srcset`, `width`, `height` y `alt`; primera fila de colección y búsqueda `eager` y la de hover `lazy`; ficha con `fetchpriority=high`; sin desborde horizontal; sobredimensión de imágenes por debajo del umbral técnico de 03F (1,6×; máximo medido 1,34×); y el theme publicado sigue siendo RC1.8 | Inspección del HTML servido (lectura, sin pintar); `shopify theme list` y `pull` con comparación 96/96 salvo las diferencias admitidas, cada una con su hash anotado: `config/settings_data.json` y, si hubo cableado de media, `templates/index.json` y `templates/product.json` `[DOC:launch/03G-cutover-runbook.md § 5.3, CT-44, DIF-09]` | 15m · 24h | `[A]` JS bloqueante, imagen sin `srcset`, primera fila `lazy` o desborde. `[A]` un theme distinto del release congelado (RC1.8 o el que fije D-CT18) o un archivo distinto fuera de las diferencias admitidas, sin cambio anotado (R-M7). `[A]` sobredimensión sobre 1,6× (umbral técnico de 03F, no de negocio) | Claude | Fix-forward; RP-05 si rompe (**I-02**) |
| 11.4 | Errores de consola propios y recursos fallidos en las plantillas clave | Consola y Network con la ventana visible (03E: 0 errores de JS propios; solo el artefacto de la barra de vista previa) | 15m · 4h · 24h | `[A]` un error de JS propio o un recurso propio que falla (por ejemplo una imagen de Contenido > Archivos o de Cloudinary, o un video que no reproduce o que no responde 200 o 206 desde `cdn.shopify.com`: los 4 videos originales son HEVC, que Shopify los acepte y los reproduzca es `[NOT_VERIFIED]` y la variante servida (H.264) es la recomendada `[DOC:content/media/03F-media-owner-runbook.md § 6, § 10]`). Los scripts de apps (Google & YouTube, Meta, favoritos) no son del theme: se anotan aparte | Claude | SY-07 → RP-05/RP-06; o fix-forward |

## 7. Escalamiento: de la anomalía al rollback

| Clase | Qué la dispara | Decide | Primer paso | Siguiente |
|---|---|---|---|---|
| **C0: dinero o datos en riesgo** | MO-02.2 (cobro sin pedido), 02.5, 02.6, 03.1, 03.2, 07.1 con datos personales (RB-05) | La dueña (DR-01, con DR-02) | **Dinero:** contener sin decidir aún el rollback con RP-01 (desactivar Wompi), RP-02 (quitar la zona Colombia) o RP-03 (tienda Privada), según DR-05. **Datos personales en analítica (07.1, RB-05):** el primer paso es RP-28…RP-30 (desconectar la app o el pixel que los manda); parar las ventas no frena esa fuga. Si se expuso un secreto, rotarlo `[PRÁCTICA-GENERAL]` `[DOC:launch/03G-rollback-plan.md § 6.1]` | Dinero: RP-20 (drenar pagos en vuelo), RP-49 y RP-50 (conciliar); rollback total si DR-02 lo exige (§ 12.2 del plan de rollback). RB-05 no es rollback de DNS |
| **Candidata a rollback** | RB-01 (00.1, 00.2), RB-02 (01.1: nadie puede comprar y no se corrige dentro de la ventana de D-CT1), RB-03 y RB-04 (02.2, 03.2, 01.2) | La dueña | Contener (C0) | Rollback total en el orden del § 12.2 del plan de rollback y del § 8.3 del cutover: RP-47, RP-48, RP-09, RP-15/RP-17 y RP-16 (= RP-11), **RP-10 y RP-52 antes de RP-12**, RP-12 y RP-13; después RP-20, RP-49 a RP-51, RP-53 y RP-54 (MN-15) |
| **Corregir adelante** | 404 y redirecciones (MO-05), analítica duplicada (MO-07.1 a 07.3 sin datos personales), correos (MO-08), rendimiento (MO-11), filtros, canonical | Claude propone · la dueña autoriza | La corrección del § 8.4 del cutover (reimportar la fila, desconectar la integración que duplica, release nuevo) | Se anota en el registro; no se toca el DNS |

**Acciones correctivas que este plan menciona y su reversibilidad** (`[DOC:launch/03G-rollback-plan.md § 9]`):

| Paso | Reversible | Por qué |
|---|---|---|
| RP-01, RP-02, RP-03, RP-15, RP-21, RP-32, RP-33, RP-37, RP-39, RP-41 | Sí | Se deshacen con el paso contrario (RP-02: recreando la zona a mano) |
| RP-38 (eliminar todas las redirecciones) | Sí, con efecto | Cada URL vieja indexada da 404 mientras no se reimporten |
| **RP-05, RP-06 (cambiar de theme)** | **El theme sí; sus consecuencias públicas no (I-02)** | Desde que la tienda es pública se indexa y se cachea |
| **RP-12 (devolver el DNS)** | **Técnicamente sí; lo ocurrido en la ventana no (I-03)** | Pedidos, 301 servidos y correos ya salidos |
| **RP-17 (desinstalar Wompi)** | **Con pérdida de configuración (I-10)** | Al reinstalar la configuración puede no restaurarse |
| **RP-36 (desinstalar favoritos)** | **La custom distribution no (I-01)** | Shopify no permite cambiar el método de distribución |
| **RP-43 y RP-44 (eliminar, renombrar handles)** | **No (I-07)** | Rompe SKU, redirecciones y URLs indexadas; despublicar sí es reversible |
| **RP-50 (cobros)** | **Los cobros reales no (I-04)** | Solo se corrigen con nuevos movimientos |
| **RP-28…RP-31 (analítica)** | **Lo ya enviado no (I-09)** | Desconectar frena solo lo futuro |
| **RP-54 (avisar a clientas)** | **No (I-08)** | Un mensaje enviado no se retira |

## 8. Plantilla de registro

La hoja llena vive **fuera del repo** (R-M3, D-MO5). Este archivo solo guarda la plantilla vacía. Convenciones de las celdas: `hh:mm · OK` / `ANOM` / `NM` (no medible) / `NE` (no ejecutado) `· E-nn` (archivo de evidencia). `—` = el chequeo no aplica en ese punto.

### 8.1 Encabezado

| Campo | Valor |
|---|---|
| T0 real (hora en que se guardó el cambio de DNS, Bogotá) | |
| Ventana de decisión (D-CT1) y persona que decide (DR-01) | |
| D-CT2 (A: ventas del sitio actual pausadas / B: no) | |
| D-MO1 (rama A o B de inventario) | |
| D-CT10 (favoritos de cuenta: sí / no) | |
| D-CT9 (nivel de Meta) y exclusión de tráfico propio | |
| Quién ejecuta cada punto de control (D-MO2) | T+15m: · T+1h: · T+4h: · T+24h: |
| Canal de reportes de clientas (D-MO3) | |
| Ventana de Chrome visible para Claude (sí / no, por punto) | |

### 8.2 Registro por chequeo

Una fila por chequeo de § 6; cada celda se llena con `hh:mm · resultado · E-nn`.

| ID | Chequeo | T+15m | T+1h | T+4h | T+24h |
|---|---|---|---|---|---|
| 00.1 | Quién sirve el dominio; Home sin contraseña | | | | |
| 00.2 | HTTPS, `http` a `https`, primario | | | | |
| 00.3 | `robots.txt`, sitemap, canonical | | — | | |
| 01.1 | Humo de checkout (3 carritos, país CO) | | | | |
| 01.2 | Checkouts abandonados frente a Wompi | — | | | |
| 01.3 | Embudo por paso | — | | | |
| 01.4 | Ajustes de Checkout sin cambios | | — | — | |
| 01.5 | Reportes de clientas de pago y envío | | | | |
| 02.1 | Wompi en producción y URL de eventos | | — | — | |
| 02.2 | Conciliación de tres fuentes | | | | |
| 02.3 | Pendientes abiertos | — | | | |
| 02.4 | Rechazadas y `ERROR` frente a LB-02 | — | — | | |
| 02.5 | Reembolsos y anulaciones | — | — | | |
| 02.6 | Pedido Pagado sin `APPROVED` | — | | | |
| 03.1 | Pedidos duplicados en Shopify | | | | |
| 03.2 | Cobros duplicados en Wompi | | | | |
| 03.3 | Pedidos en los dos sistemas | | | | |
| 04.1 | Disponibilidad con país CO | | | | |
| 04.2 | Unidades vendidas frente al stock declarado | — | | | |
| 04.3 | Ventas de `LG-AUR-000001-XL` | — | | | |
| 04.4 | Rezagados del sitio actual y stock | | | | |
| 04.5 | Rama A: ajustes de inventario sin pedido | — | — | | |
| 05.1 | Matriz de redirecciones (completa en 15m, 4h, 24h) | | | | |
| 05.2 | Variantes de URL fuera del CSV | | — | — | |
| 05.3 | 404 reales de visitantes (GA4) | — | | | |
| 05.4 | Search Console | — | | — | |
| 05.5 | Metaetiquetas de indexación | | — | — | |
| 06.1 | Flujo del carrito | | | | |
| 06.2 | `/cart/add.js`, `/cart/change.js`, `cart:error` | | | | |
| 06.3 | Textos de error del carrito | | | | |
| 06.4 | Promesa de envío gratis frente al checkout | | — | | |
| 07.1 | GA4: 11 eventos, `COP`, sin datos personales | (lo que llegue) | | | |
| 07.2 | Meta: 7 eventos, un pixel | (canal) | | | |
| 07.3 | `purchase`: `transaction_id`, recarga, monto | — | | | |
| 07.4 | Consentimiento K1 a K4 | | — | — | |
| 07.5 | Atribución | — | | | |
| 07.6 | Pedidos frente a `purchase` y `Purchase` | — | — | (informativo) | |
| 08.1 | Correo de confirmación de pedido | — | | | |
| 08.2 | Código de ingreso: llegada | — | | (opcional) | |
| 08.3 | Aviso interno de pedido nuevo | — | | | |
| 08.4 | Correo de despacho | — | — | — | |
| 08.5 | Cola de correos del sitio actual | | — | — | |
| 09.1 | Ingreso por código y cierre de sesión | — | | — | |
| 09.2 | Rutas viejas `/cuenta*` y plantillas legacy | | — | | |
| 09.3 | Reportes de clientas de cuenta | | | | |
| 10.1 | Favoritos de invitada | | | — | |
| 10.2 | `/favoritos` y `/cuenta/favoritos` | | — | | |
| 10.3 | Logs de la función (solo D-CT10 = sí) | — | | | |
| 11.1 | PageSpeed (registrar cada corrida) | | — | | |
| 11.2 | Informe de velocidad de Shopify | — | — | | |
| 11.3 | Regresión estructural y theme = RC1.8 | | — | — | |
| 11.4 | Errores de consola propios y recursos fallidos | | — | | |

**Resumen por punto de control** (se llena al cerrar cada punto; alimenta las decisiones G6, G7 y G8 del cutover):

| | T+15m | T+1h | T+4h | T+24h |
|---|---|---|---|---|
| Hora de inicio y de cierre (Bogotá) | | | | |
| Chequeos OK / ANOM / NM / NE | | | | |
| Anomalías `[A]` abiertas (ids de § 8.4) | | | | |
| Señales `[S]` registradas | | | | |
| Decisión (continuar / contener C0 / rollback RB-##), quién y hora | | | | |

### 8.3 Hoja de conciliación de pedidos

Columnas mínimas del plan de rollback (RP-49), más las de esta ventana. Prefijos `SHOP-` y `WEB-` para no confundir la numeración de los dos sistemas `[DOC:launch/03G-rollback-plan.md § 8.10]`. Una fila por pedido o por transacción; cada pedido y cada transacción aparecen una sola vez.

| Sistema (`SHOP-` / `WEB-`) | Número | Fecha y hora | Líneas (SKU-talla × cantidad) | Total COP | Estado de pago en Shopify | Referencia y estado en Wompi (`APPROVED`, `DECLINED`, `ERROR`, `PENDING`, `VOIDED`) | Monto en Wompi (centavos) | Hora del `APPROVED` → hora en que aparece el pedido | Cumplimiento | GA4 `purchase` (sí / no / duplicado) | Meta `Purchase` (sí / no / duplicado) | `PROPIO` (sí / no) | Fila abierta (motivo) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | | | |

La columna "hora del `APPROVED` → hora en que aparece el pedido" es el dato que cierra NV7 con mediciones reales y, junto con la columna de estado de pago, aporta a NV5 (§ 9.3).

### 8.4 Registro de anomalías

| Id | Hora | Punto | Chequeo (`MO-##.n`) | Nivel `[A]`/`[S]` | Síntoma | Evidencia (`E-nn`) | Ocurrencias | Decide | Acción (`RP-##` / `RB-##` / fix-forward) | Estado | Hora de cierre |
|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | |

### 8.5 Registro de decisiones y acciones ejecutadas

| Hora | Decisión (continuar, contener, rollback parcial o total) | Quién decide | Criterio que se disparó (`MO-##.n`, `SY-##`, `RB-##`) | Pasos ejecutados (`RP-##`) y quién los ejecutó | Evidencia de que quedó bien (`VR-##` del plan de rollback o el chequeo que pasó a OK) |
|---|---|---|---|---|---|
| | | | | | |

## 9. Cierre, archivo y traspaso a S17

### 9.1 Qué se archiva después de T+24h

| Qué | Contenido | Quién | Datos personales | Dónde y por cuánto tiempo |
|---|---|---|---|---|
| Hoja de registro completa (§ 8.1 a 8.5) | Los 52 chequeos por punto, anomalías y decisiones | Dueña, con Claude | No (R-M3) | D-MO5 (`NOT_AVAILABLE`) |
| Hoja de conciliación (§ 8.3) | Números de pedido, referencias de Wompi, montos, estados | Dueña | Datos de compra: fuera del repo, acceso restringido | D-MO5 |
| Evidencias `E-nn` | Capturas de pantalla **sin** datos personales, llaves ni tokens; salida de comandos (`curl.exe`) como texto, sin cookies; salidas de `03g-monitoring-404-baseline.mjs` y `03g-cutover-redirect-matrix.mjs` | Claude | No | Junto a la hoja |
| Exportaciones de Wompi y de Pedidos usadas para conciliar (que el panel de Wompi exporte: `[NOT_VERIFIED]`; si no, capturas sin datos personales) | CSV de transacciones y de pedidos | Dueña | **Sí** (compradores): fuera del repo | D-MO5 |
| Informes de GA4, Meta y PageSpeed | Capturas, y el reporte de cada corrida de PageSpeed | Dueña o Claude | No | Junto a la hoja |
| Línea base de Search Console de T+24h (CT-92) | Cobertura y lista de 404 con su origen | Dueña | No | Junto a la hoja |
| Logs de la función de favoritos del periodo | Líneas JSON sin datos personales por diseño `[DOC:app/README.md § 4]` | Dueña | No | El hosting del backend (`NOT_AVAILABLE`) |
| Hoja privada de rollback (§ 5.4 del cutover) actualizada | Valores previos de DNS, URL de eventos, `WRITES_PAUSED` y commit de Vercel | Dueña | No, pero sensible | Se conserva mientras dure la ventana de rollback (D-CT13) |

**Al repo** solo puede volver un resumen sin datos personales (conteos, `OK`/`ANOM`, hallazgos), en un documento nuevo y sin reescribir 03E ni 03F (la misma práctica que el runbook de Wompi fija para registrar resultados: `[DOC:payments/03F-wompi-owner-runbook.md § 14]`).

### 9.2 Criterio para cerrar el monitoreo de 24 h (decisión G8 del cutover)

Se cierra cuando: (a) todos los chequeos aplicables de la fila T+24h están `OK`, `NM` o `NE` con su causa (10.3 solo con D-CT10 = sí; 04.5 solo en la rama A de D-MO1); (b) no hay ninguna `[A]` abierta; (c) la hoja de conciliación no tiene filas abiertas salvo pendientes registrados y filas a las que su tercer reintento de Wompi (24 h desde su `APPROVED`) les vence después de T+24h (§ 5, nota; § 9.3); (d) la dueña dejó por escrito cuánto se conserva el sitio actual (D-CT13). Si (b) o (c) fallan, la ventana sigue abierta y se decide RB-03 según el cutover `[DOC:launch/03G-cutover-runbook.md G8]`.

### 9.3 Qué sigue abierto (traspaso a S17)

| Pendiente | Hasta cuándo | Fuente |
|---|---|---|
| Pagos `PENDING` de Wompi y pedidos con pago Pendiente | Vencen "3 días como máximo" (recomendación de Shopify para apps de pago; que la app de Wompi la use: `[NOT_VERIFIED]`, NV5); se vigilan hasta resolverse. No se cancelan a mano antes de verificarlos en Wompi | `[DOC:payments/03F-wompi-owner-runbook.md § 9 caso 3]` |
| Filas de la hoja § 8.3 con un `APPROVED` sin pedido cuyos reintentos de Wompi (3 h y 24 h desde su `APPROVED`) vencen después de T+24h | Hasta después de su reintento de 24 h; se siguen mirando y se concilian a mano (RP-50) si no aparece el pedido | `[DOC:payments/03F-wompi-owner-runbook.md § 5.1, § 9 caso 5]` `[INFERIDO]` |
| Cerrar con datos reales: NV5 (estado pendiente), NV6 (reembolsos hacia Wompi), NV7 (pedido cuando la clienta no vuelve), NV12 (etiqueta de prueba en pedidos), a partir de la columna de horas de § 8.3 | Al tener al menos un caso real de cada uno | `[DOC:payments/03F-wompi-owner-runbook.md § 12]` |
| Preguntas P1 a P9 a Wompi y primera factura de Shopify (comisión de proveedor externo, NV14) | Cuando lleguen las respuestas y la primera factura | `[DOC:launch/03G-cutover-runbook.md CT-96]` |
| Search Console: "No encontrada (404)" y "Página con redirección" | 4 a 8 semanas | `[DOC:seo/03E-redirect-plan.md § 7]` |
| No eliminar las 47 redirecciones como "limpieza" | Al menos 1 año una vez estable | `[DOC:seo/03E-redirect-plan.md § 7.6]` |
| Métricas personalizadas de GA4 y puente del custom pixel (G-PUENTE) | Las métricas tardan 24 a 48 h en verse; el pixel sigue apagado hasta decidirlo | `[DOC:analytics/03F-analytics-owner-runbook.md § 8.3, § 12]` |
| TTL del DNS: subirlo solo cuando el resultado sea estable | CT-94 (valor `NOT_AVAILABLE`) | `[DOC:launch/03G-cutover-runbook.md CT-94]` |
| Sitio actual conservado sin desmantelar; `WRITES_PAUSED` sigue o se retira | D-CT13 | `[DOC:launch/03G-cutover-runbook.md § 9.1]` |
| Datos sin migrar (clientas, histórico, newsletter) y comunicación | D-CT11, D-CT12 | `[DOC:launch/03G-reproducibility-gap-audit.md C01 a C05]` |

## 10. Coherencia con 03E, 03F, el cutover y el rollback: diferencias y hallazgos

| ID | Tipo | Hallazgo | Evidencia | Acción |
|---|---|---|---|---|
| MN-01 | DIFFERENCE | El § 6 del cutover trae T-24h, T-4h, T-1h, T-15m, T0, T+15m, T+1h y T+24h, pero **no T+4h**. Wompi reintenta a los 30 min, 3 h y 24 h, así que el reintento de las 3 h de los pagos de las primeras horas queda sin revisión entre T+1h y T+24h (los reintentos se cuentan desde cada evento: MN-16) | `[DOC:launch/03G-cutover-runbook.md § 6]`; `[DOC:payments/03F-wompi-owner-runbook.md § 5.1]` | Este plan agrega T+4h, de solo lectura y sin decisión G propia. D-MO7: la dueña decide si se incorpora al cutover |
| MN-02 | BLOCKER (owner) | **Inventario sin seguimiento (98/98).** Con la rama B de D-MO1, ni Shopify ni este plan pueden detectar una sobreventa por sí mismos; solo la comparación manual contra el stock real de la dueña (LB-03, `NOT_AVAILABLE`). El patrón de 25 unidades por talla del sitio actual no está confirmado | `[MEDIDO-03G]` snapshot `catalog.inventoryTracking`; `[DOC:launch/03G-reproducibility-gap-audit.md G02, C08]`; `[DOC:launch/03G-product-parity.md F-04]` | Ya es D-CT8 (bloquea G1) y DR-07: se responde una vez. Sin respuesta, MO-04 solo funciona con la rama B a mano |
| MN-03 | NOTE | **No hay línea base de analítica del sitio actual** (SR-11 `NOT_AVAILABLE`). La política de cookies dice "Hoy no las usamos"; en cambio la auditoría de viabilidad describe en el código del sitio actual un GA4 propio con consentimiento y una Conversions API de Meta `[DOC:launch/evidence/reference-docs/architecture-map.md § 1; seo-analytics.md § 10]`: si el sitio actual manda datos a GA4 o Meta hoy (banderas de producción): `[NOT_VERIFIED]`, dos fuentes en tensión. Los chequeos de embudo y atribución (01.3, 07.5) usan el punto anterior de la misma ventana y a Shopify y Wompi como verdad | `[DOC:launch/03G-rollback-plan.md § 5 SR-11]`; `[DOC:analytics/03F-analytics-owner-runbook.md § 13]` | La dueña puede aportar datos previos (LB-05); si no, se declara que no hay comparación |
| MN-04 | NOTE | **LCP, FCP y CLS reales no se han medido nunca**, ni en Shopify ni en el sitio actual. La primera medición pública es la referencia de la ventana; no hay datos de campo en las primeras 24 h `[PRÁCTICA-GENERAL]` | `[DOC:theme/03F-performance-final.md § 1]`; `[MEDIDO-03G]` snapshot `_meta.limits` | Medir en T+15m (o en T-15m sobre `*.myshopify.com`) y registrar cada corrida |
| MN-05 | DIFFERENCE | El snapshot y `dev-routes.json` miden `/apps/wishlist` (404), pero el app proxy real es `/apps/radaelli/wishlist`. Este plan usa la ruta real | `[MEDIDO-03G]` snapshot `wishlistApp.appProxy`; `[DOC:launch/03G-rollback-plan.md § 15 D-02]`; `[DOC:app/README.md § 3]` | Medir `/apps/radaelli/wishlist` en la próxima captura |
| MN-06 | NOTE | `launch/03G-launch-acceptance-checklist.md`, citado por el cutover y el rollback, no existía al redactar | Listado de `launch/` | Este plan se apoya en `MO-##.n`; al existir el checklist, cruzar los IDs |
| MN-07 | NOTE | **El comercio no ve el procesamiento de los eventos de Wompi** (lo hace el integrador). Los riesgos NV5, NV6 y NV7 no se pueden prevenir desde el monitoreo: solo se detectan por conciliación y se cierran con casos reales | `[DOC:payments/03E-wompi-shopify-feasibility.md E10]`; `[DOC:payments/03F-wompi-owner-runbook.md § 12]` | La columna de horas de § 8.3 produce el dato de NV7; la de estado de pago aporta a NV5 |
| MN-08 | NOTE | **Meta se conecta en CT-74 (T+15m)**, así que en T+15m no hay eventos de Meta y no es anomalía. GA4 no registra mientras la tienda tiene contraseña: el primer evento posible es después de CT-51 | `[DOC:launch/03G-cutover-runbook.md CT-74, CT-51]`; `[DOC:analytics/03F-analytics-owner-runbook.md § 2]` | MO-07.1 y MO-07.2 lo reflejan |
| MN-09 | DIFFERENCE | `dev-routes.json` cita "33 × `/producto/<slug>`" y el CSV tiene 29 filas de producto. Este plan usa las 29 del CSV, verificadas por el script. `03G-route-parity.md` F-15 ya lo resolvió: 33 = 29 productos + 4 colecciones y la etiqueta de `dev-routes.json` es imprecisa | `[MEDIDO-03G]` `dev-routes.json`; `[DOC:launch/03G-route-parity.md F-15]` | Ninguna |
| MN-10 | NOTE | Con `WRITES_PAUSED` el cron `process-email-outbox` se salta la corrida: los correos en cola del sitio actual no salen hasta reanudar | `[DOC:launch/03G-cutover-runbook.md § 5.2]` | MO-08.5 |
| MN-11 | DIFFERENCE | `launch/03G-route-parity.md` habla de **16** URLs con 404 hoy; el script cuenta **17** rutas distintas porque suma `/producto/costa-esmeralda-azul` (minúsculas), que el sondeo midió con 404 y que en Shopify sí redirige | `[MEDIDO-03G]` `launch/evidence/current-site-probe/index.json`; script de esta fase | Ninguna: no hay contradicción, la de minúsculas es del sondeo |
| MN-12 | NOTE | Los pendientes de Wompi (hasta 3 días) y las métricas personalizadas de GA4 (24 a 48 h) se extienden más allá de las 24 h del plan | § 9.3 | Traspaso a S17 |
| MN-13 | NOTE | Ninguna fuente trae KPIs, umbrales de conversión ni tiempos máximos. Todos los umbrales de este plan son "cualquier ocurrencia" o relativos; los numéricos que aparecen (1,6× de sobredimensión; 30 min, 3 h y 24 h; 3 días; 4 a 8 semanas) son de documentos previos y técnicos, no de negocio | `[DOC:launch/03G-rollback-plan.md § 1 punto 5]` | DR-02 |
| MN-14 | NOTE | **Sin alertas automáticas tras el corte.** El sitio actual tiene `SystemLog` con alertas por correo y enfriamiento; Shopify no tiene equivalente directo y en las notificaciones nativas no se halló documentación de reintentos ni de cola visible. Que Shopify, Wompi, GA4 o Meta envíen alertas propias: `[NOT_VERIFIED]`. Este plan no cuenta con alertas: un fallo solo se ve si alguien lo mira en un punto de control o si una clienta lo reporta | `[DOC:launch/evidence/reference-docs/architecture-map.md § 1, § 3]`; `[DOC:launch/evidence/reference-docs/seo-analytics.md § 11]` | D-MO2 (guardia y canal) y D-MO3 (reportes de clientas); D-MO6 (aviso interno de pedido nuevo) |
| MN-15 | DIFFERENCE | **Orden del rollback total frente al DNS.** La primera versión de este plan listaba RP-12 y RP-13 antes de RP-11, RP-52 y RP-10 (el orden que el cutover tenía antes de su corrección V-01). El cutover vigente (§ 5.2 fila "Rollback", § 8.3) y el plan de rollback (§ 12.2) ponen RP-10 y RP-52 **antes** de RP-12. Además, el plan de rollback sigue diciendo (§ 8.2 "Orden", § 12.2, § 12.4 y D-15) que el cutover ordena lo contrario: esa nota quedó desactualizada frente al cutover vigente | `[DOC:launch/03G-cutover-runbook.md § 5.2, § 8.3, § 12 V-01]`; `[DOC:launch/03G-rollback-plan.md § 8.2, § 12.2, § 15 D-15, § 18 fila 1]` | § 7 de este plan corregido al orden compartido por el cutover y § 12.2. Quien mantenga el plan de rollback debe cerrar D-15 (este plan no lo edita) |
| MN-16 | DIFFERENCE | **Los reintentos de Wompi (30 min, 3 h, 24 h) se cuentan desde cada evento, no desde T0.** La primera versión trataba T+4h como "el reintento de las 3 h" y T+24h como "el de 24 h" para todos los pagos. Un pago aprobado en T+1h tiene su reintento de 24 h en T+25h, fuera de la ventana. T+4h y T+24h cubren solo los pagos a los que ya les tocó ese reintento | `[DOC:payments/03F-wompi-owner-runbook.md § 5.1, § 9 caso 5]` (el runbook mira a los 5 y a los 35 min de cada pago); `[INFERIDO]` | § 5 (nota), 02.2, § 9.2 (c) y § 9.3 corregidos: cada fila de § 8.3 se vuelve a mirar tras sus propios reintentos y lo que venza después de T+24h pasa a S17. El margen de espera es de la dueña (D-MO2) |
| MN-17 | DIFFERENCE | **`/checkout` no responde 200 en Shopify.** El script y la primera versión de MO-05 lo listaban entre las rutas "nativas" con 200. La captura de la Dev Store midió que un GET redirige a `/checkouts/cn/<token>/es-us` (403 para `fetch`) y sin carrito no se midió. Las otras 4 rutas directas sí dan 200 | `[MEDIDO-03G]` `launch/evidence/dev-routes.json` (fila `/checkout`); `[MEDIDO-03G]` `launch/03G-route-parity.csv` (fila Checkout: `BLOCKED_BY_OWNER`, contenido y visual `NOT_MEASURED`) | § 6 MO-05 y la salida del script corregidos: `/checkout` se anota, no es anomalía |
| MN-18 | DIFFERENCE | **El humo de checkout "sin escribir dirección" no permite leer el método de envío.** El checkout medido en 03G dice "Ingresa tu dirección de envío para ver los métodos disponibles"; el runbook de envío lee el envío con `estimate()` (T1 a T4) y, en el checkout real, con una dirección que escribe la dueña (T10). La primera versión pedía T10 y a la vez prohibía escribir la dirección | `[MEDIDO-03G]` `launch/03G-checkout-precondition-audit.md § 1`; `[DOC:shipping/03F-owner-shipping-runbook.md § 10 S9, § 11 T1 a T4, T10]` | Nota de 01.1 corregida; los checkouts abandonados del humo se marcan `PROPIO` (R-M6) |
| MN-19 | NOTE | **El panel de Wompi no está descrito más allá de la URL de eventos y de las transacciones con su estado.** Que filtre por estado y fecha o exporte la lista: ninguna fuente lo dice | `[DOC:payments/03F-wompi-owner-runbook.md § 5.1, § 9]`; `[DOC:payments/03E-wompi-shopify-feasibility.md E10]` | Marcado `[NOT_VERIFIED]` en LB-02, 02.4 y § 9.1; si no filtra ni exporta, se cuenta a mano o con capturas sin datos personales |

## 11. Lo que no se pudo verificar o no existe

| Tema | Estado |
|---|---|
| T0, ventana de decisión, proveedor de DNS, registros y TTL | `NOT_AVAILABLE` (D-CT1, D-CT3) |
| Nombres exactos en español de las pantallas del Admin (Checkouts abandonados, Cronología del pedido, Notificaciones, Dominios, informe de velocidad, Análisis) | `[NOT_VERIFIED]` |
| Disponibilidad de los informes de Shopify Analytics (conversión, vista en vivo, velocidad) y si listan 404; plan de Shopify | `[NOT_VERIFIED]` / `NOT_AVAILABLE` |
| Que la cronología del pedido registre el envío o el rebote de una notificación; reintentos de las notificaciones nativas | `[NOT_VERIFIED]` (caja negra) |
| Cómo muestra Shopify una anulación (`VOIDED`) y un reembolso de otros medios que no son tarjeta | `[NOT_VERIFIED]` (NV6) |
| Estado pendiente de la app de Wompi, pedido cuando la clienta no vuelve, etiqueta de prueba | `[NOT_VERIFIED]` (NV5, NV7, NV12) |
| Que el panel de Wompi muestre el estado de entrega de los eventos; nombre exacto de su pantalla de transacciones; que filtre por estado y fecha o exporte la lista (MN-19) | `[NOT_VERIFIED]` |
| Respuesta de `/checkout` en Shopify sin carrito; que la pantalla de pago (con Wompi) se vea sin escribir dirección (el método de envío no se ve sin dirección: medido en 03G) | `[NOT_VERIFIED]` (MN-17, MN-18) |
| Alertas propias por correo de Shopify, Wompi, GA4 o Meta ante un fallo | `[NOT_VERIFIED]` (MN-14) |
| Indicador de modo prueba en el Admin con Wompi activo | `[NOT_VERIFIED]` |
| Si el sitio actual envía datos a GA4 y Meta hoy; datos previos de embudo y compras | `[NOT_VERIFIED]` / `NOT_AVAILABLE` (LB-05) |
| Stock real por SKU-talla | `NOT_AVAILABLE` (LB-03) |
| LCP, FCP y CLS reales, y su comportamiento con el video del hero | No medidos (LB-04) |
| Ajustes de `settings/checkout`, notificaciones, impuestos y dominios de la Dev Store | `[NOT_VERIFIED]` (B20) |
| Que DebugView capture el checkout | `[NOT_VERIFIED]` |
| Propiedad de Search Console y su verificación | `NOT_AVAILABLE` |
| Host de la función de favoritos | `NOT_AVAILABLE` (paso 5 del runbook de favoritos) |
| Que `http` a `https` y `www` a apex redirijan como se espera en Shopify; código exacto (301 o 302) de las redirecciones | `[NOT_VERIFIED]` hasta la primera corrida de MO-05 |
| Duración de cada punto de control y de cada lectura | `NOT_AVAILABLE` |
| Contenido de `launch/03G-launch-acceptance-checklist.md` | No existía al redactar |
| Que Shopify aplique el límite de 422 al agregar más unidades que el stock (rama A) | `[INFERIDO]`, propuesta de la auditoría de reproducibilidad; no medido |

## 12. Fuentes leídas y cómo se hizo

**Cómo se hizo:** lectura de los archivos citados y una sola herramienta nueva, `launch/tools/03g-monitoring-404-baseline.mjs`, que recalcula desde los archivos guardados las cifras de la lista de vigilancia de 404 (47 filas, 58 URLs con 200, 13 sin destino, 17 rutas con 404, sitemap de 45 URLs) y comprueba el SHA-256 del CSV. No hubo navegador, red ni escritura en tiendas. No se leyó ningún `.env`. El entregable y el script pasaron `launch/tools/03g-secret-scan.mjs` con 0 hallazgos (2 archivos). Las tablas de este documento se comprobaron por número de columnas y el registro de § 8.2 se cruzó con los 52 chequeos de § 6 (mismos IDs).

**Leídos completos o casi completos**

- `launch/03G-dev-store-snapshot.json`, `launch/03G-checkout-precondition-audit.md`, `launch/03G-cutover-runbook.md`, `launch/03G-rollback-plan.md`, `launch/03G-route-parity.md`.
- `payments/03F-wompi-owner-runbook.md`, `analytics/03F-analytics-owner-runbook.md` (§ 1 a § 5, la fase 6 del § 6 y § 7 a § 17), `seo/03F-redirect-import-result.md`, `seo/03F-seo-final-validation.md`.
- `theme/03F-performance-final.md`, `theme/03F-mobile-checkout-baseline.md`, `theme/03E-performance-baseline.md`, `theme/03E-checkout-baseline-report.md`, `theme/03E-commercial-readiness-report.md`, `theme/03F-sonnet-independent-completion-report.md`, `theme/03F-owner-actions-minimal.md`, `theme/03E-owner-actions-one-shot.md`.
- Los seis documentos de `launch/evidence/reference-docs/`: `architecture-map.md`, `cost-comparison.md`, `data-migration.md`, `migration-roadmap.md`, `seo-analytics.md`, `wompi-payments.md`.
- `source-of-truth/data-model-audit.md`, `launch/evidence/dev-routes.json`, `launch/evidence/current-site/index.json`, `launch/evidence/current-site/robots.txt.txt`, `launch/evidence/current-site/sitemap.xml.txt`, `launch/evidence/current-site-probe/index.json`, `seo/shopify-redirects-import.csv`.

**Leídos solo en las partes citadas**

- `launch/03G-current-site-baseline.md` (§ 1 a § 3 y § 6 a § 12), `launch/03G-product-parity.md` (inventario, F-01 y F-04), `launch/03G-reproducibility-gap-audit.md` (§ 1, § 5, § 6 y § 8), `launch/03G-responsive-sweep.md` (método y resultados).
- `shipping/03F-owner-shipping-runbook.md` (§ 7, § 8, § 11), `theme/03F-owner-wishlist-install-runbook.md` (pasos 10 a 14, § 5, § 7), `theme/03F-owner-market-colombia-runbook.md` (índice y las verificaciones V2 a V7 del § 8), `theme/03F-search-discovery-owner-runbook.md` y `theme/03F-legal-owner-runbook.md` (resumen y estado de partida), `content/media/03F-media-owner-runbook.md` (§ 0, § 6, § 10, § 12), `analytics/03E-analytics-plan.md` (§ 2.2, § 10, § 12, § 13), `seo/03E-redirect-plan.md` (§ 5 y § 7), `app/README.md` (§ 3 y § 4), `app/OWNER-WORKFLOW.md` (índice), `payments/03E-wompi-shopify-feasibility.md` (evidencias E10 a E37), `shipping/03E-shipping-source-of-truth.md` (índice y la fila C7), `import/README.md` y `import/shopify-products-03c.csv` (columnas de inventario), `theme-src/locales/es.default.json` y `theme-src/assets/cart.js` (contrato de `cart:error` y textos de error), `dist/release-manifest-rc1.8.json` (cabecera).

## 13. Registro de la verificación adversarial (2026-09-29, 18:00, Bogotá)

Un revisor independiente volvió a las fuentes, no al resumen del productor: `launch/03G-cutover-runbook.md` (casi completo), `launch/03G-rollback-plan.md` (completo), `payments/03F-wompi-owner-runbook.md` (completo), `analytics/03F-analytics-owner-runbook.md`, `shipping/03F-owner-shipping-runbook.md`, `theme/03F-owner-market-colombia-runbook.md` (§ 8), `theme/03F-owner-wishlist-install-runbook.md`, `app/README.md`, `content/media/03F-media-owner-runbook.md`, `theme/03F-performance-final.md`, `theme/03E-performance-baseline.md`, `theme/03F-mobile-checkout-baseline.md`, `seo/03E-redirect-plan.md`, `seo/03F-redirect-import-result.md`, `seo/03F-seo-final-validation.md`, `launch/03G-checkout-precondition-audit.md`, `launch/03G-route-parity.md` y su CSV, `launch/03G-reproducibility-gap-audit.md`, los seis documentos de `launch/evidence/reference-docs/`, `launch/evidence/dev-routes.json`, el snapshot y `theme-src/locales/es.default.json`. Solo lectura sobre todo lo demás; no hubo GET ni POST a ninguna tienda, DNS, Vercel, Wompi ni al sitio en producción. Se corrió dos veces `node launch/tools/03g-monitoring-404-baseline.mjs` (misma salida, `RESULTADO: OK`, 14 controles) y un cruce de la columna "Cuándo" de § 6 con las celdas "—" de § 8.2 (52 filas, sin diferencias salvo los chequeos continuos 01.5 y 09.3, que no tienen columna fija).

**Sin corrección (comprobado contra la fuente):** 12 áreas (MO-00 a MO-11) y 52 chequeos; los 11 eventos de GA4 y los 7 de Meta; `AddShippingInfo` inexistente en Meta; estados de Wompi y montos en centavos; reintentos de 30 min, 3 h y 24 h; "3 días como máximo"; "4 a 8 semanas" y "al menos 1 año"; 24 a 48 h de las métricas personalizadas; 1,6× y 1,34× de la sobredimensión; 15,6 MB y 23,6 MB de media; 3.642 y 228 bytes de `robots.txt`; los textos de error del carrito y el contrato `cart:error`; los códigos de error de la app de favoritos y los campos del log; T1 a T4, T10 a T12 del runbook de envío; V2 a V7 del de mercado; K1 a K4, D1 a D11 y V1 a V9 del de analítica; los IDs `CT-##`, `G1`–`G8`, `RB-01`…`RB-05`, `D-CT#`, `SR-##`, `SY-##`, `DR-##`, `RP-##`, `I-##` y `CU-##` citados; los 16 y 17 URLs con 404, las 58 con 200 y las 13 sin destino; que T+4h no existe en el § 6 del cutover; que no hay horas posteriores a 18:00, correos, teléfonos, tokens ni URLs de checkout con token.

| # | Dónde | Decía | Ahora | Evidencia |
|---|---|---|---|---|
| V-01 | § 7 fila "Candidata a rollback"; 00.1, 00.2 | Rollback total con RP-12/RP-13 antes de RP-11/RP-52/RP-10 | RP-10 y RP-52 antes de RP-12 (MN-15) | `launch/03G-cutover-runbook.md § 5.2, § 8.3`; `launch/03G-rollback-plan.md § 12.2` |
| V-02 | § 5, 02.2, § 9.2, § 9.3, MN-01 | T+4h y T+24h cubren "el reintento de 3 h" y "el de 24 h" de todos los pagos | Los reintentos se cuentan desde cada evento; cada fila se re-mira tras los suyos (MN-16) | `payments/03F-wompi-owner-runbook.md § 5.1, § 9 caso 5` |
| V-03 | MO-05 (fila de rutas directas); script | `/checkout` con 200 en Shopify | `/checkout` redirige y no se midió sin carrito; script y hashes recalculados (MN-17) | `launch/evidence/dev-routes.json` |
| V-04 | 01.1 (nota y ficha), 01.2 | Humo sin escribir dirección y con T10 | Envío por `estimate()` o con dirección escrita por la dueña; checkouts del humo `PROPIO` (MN-18) | `launch/03G-checkout-precondition-audit.md § 1`; `shipping/03F-owner-shipping-runbook.md § 10, § 11` |
| V-05 | 02.2 | "A los 5 min" sin fuente | Marcado como el tiempo de espera del caso 5 del runbook de Wompi, no como umbral de negocio | `payments/03F-wompi-owner-runbook.md § 9` |
| V-06 | LB-02, LB-07, LB-08, 02.4, § 9.1 | LB-02 "con D-CT2 = B, en T-24h" y LB-07 "T-4h" sin fuente; LB-08 con CT-82 (posterior a T0); filtro y exportación del panel de Wompi como hechos | Momentos alineados con CT-41, CT-43, CT-47, CT-21 y CT-27; filtro y exportación `[NOT_VERIFIED]` (MN-19); "nunca se recibió un correo" → "03G no lo probó" | `launch/03G-cutover-runbook.md § 5.4, CT-21, CT-27, CT-41, CT-43, CT-47`; `launch/03G-checkout-precondition-audit.md § 6` |
| V-07 | 11.3 | Comparación 96/96 y "theme distinto de RC1.8" | 96/96 salvo las diferencias admitidas de CT-44 y DIF-09; el release congelado puede ser el que fije D-CT18 | `launch/03G-cutover-runbook.md § 5.3, CT-44, DIF-09` |
| V-08 | 01.3 | `[A]` un paso con 0 eventos mientras el anterior tiene eventos | `[A]` solo si el paso ocurrió y no tiene su evento; con poco tráfico un paso vacío no prueba nada | `[INFERIDO]` |
| V-09 | 05.1 | `[A]` "cadena de más de 2 saltos" (cifra sin fuente) | Un salto de más frente a V-REDIR (1; 2 en `/cuenta*`; +1 por `www` si D-CT4) | `launch/03G-cutover-runbook.md V-REDIR` |
| V-10 | § 1 punto 9, MN-14, MO-08 | "No llegarán alertas automáticas"; notificaciones nativas "no muestran reintentos" | Alertas propias de Shopify, Wompi, GA4 y Meta: `[NOT_VERIFIED]`; para las notificaciones, "no se halló documentación" | `launch/evidence/reference-docs/seo-analytics.md § 11`; `architecture-map.md § 1` |
| V-11 | 07.1 (15m) | "Solo `page_view` y `view_item`" en T+15m | Se anota lo que llegue; el embudo completo se exige desde T+1h (CT-81) | `launch/03G-cutover-runbook.md CT-72, CT-81` |
| V-12 | § 7 fila C0 | Datos personales en analítica (07.1) contenidos con RP-01/RP-02/RP-03 | Primer paso RP-28…RP-30; parar ventas no frena esa fuga | `launch/03G-rollback-plan.md § 6.1 (RB-05)` |
| V-13 | 00.3 | `/en` y `hreflang` `en` siempre esperados | Solo si D-CT19 = publicar el inglés | `launch/03G-cutover-runbook.md CT-73, D-CT19` |
| V-14 | Fichas de MO-01 a MO-08, MO-11 | Enlace a `SY-##`/`RB-##` sin `RP-##` en la ficha | Cada ficha nombra sus pasos `RP-##` | `launch/03G-rollback-plan.md § 6, § 7, § 8` |
| V-15 | LB-07, 01.1, 08.1, MO-04; D-MO6; 01.4; 10.3; MN-03; MN-09; § 4; § 9.3; § 8.3 | `B20` y `G-04` sin definir; D-MO6 citaba solo el contenido del correo; 01.4 citaba CT-08; `400 missing_csrf_header` como NO-GO sin matiz; analítica del sitio actual solo por la política de cookies; F-15 sin citar su resolución; pendiente de 3 días sin NV5; la columna de horas "cierra NV5" | Definiciones y fuentes agregadas; NV7 (horas) y NV5 (estado de pago) separados | `launch/03G-reproducibility-gap-audit.md B20`; `launch/03G-rollback-plan.md § 15`; `launch/03G-route-parity.md F-15`; `theme/03F-owner-wishlist-install-runbook.md § 3` |

**Datos sin fuente quitados o marcados** (`inventedItems`): "cadena de más de 2 saltos", "a los 5 min" (ahora con su origen), "solo `page_view` y `view_item`" en T+15m, "no llegarán alertas automáticas", "con D-CT2 = B, en T-24h" (LB-02), "T-4h" (LB-07), filtro y exportación del panel de Wompi. Ninguna cifra de ventas, conversión, KPI, TTL, proveedor de DNS, IP, plan de Shopify ni hora posterior a 18:00 en el documento. Los numéricos que quedan (1,6×; 30 min, 3 h y 24 h; 3 días; 4 a 8 semanas; 24 a 48 h) son técnicos y vienen de documentos previos (MN-13).

**Lo que la revisión no pudo comprobar:** la lista original de "10 áreas pedidas" no estaba en la entrada de la revisión; las 12 áreas de § 6 cubren las que el resumen del productor enumera (checkout, pagos y estados, duplicados, inventario, 404 y redirecciones, carrito, analítica y atribución, correos, cuentas, favoritos, rendimiento, más dominio y HTTPS) `[NOT_VERIFIED]` frente al pedido original. Que las pantallas y los informes con nombre `[NOT_VERIFIED]` existan en Shopify, Wompi, GA4 o Meta con esos nombres tampoco se comprobó: ningún GET ni inicio de sesión.
