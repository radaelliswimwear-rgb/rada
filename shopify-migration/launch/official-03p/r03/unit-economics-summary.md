# Unit economics Radaelli — resumen de la plantilla llenada (solo datos verificados)

Carril de análisis, solo lectura. Inicio 2026-10-02 12:03 (America/Bogota); fin: ver pie. Tienda `wgcvpd-ib.myshopify.com` (viva, COP). Nada se cambió en Shopify/Wompi/Envia/Meta/DNS; las consultas fueron GraphQL de solo lectura.
Etiquetas: **[V]** verificado (fuente oficial o consulta a la tienda hoy), **[NV]** no verificable / ambiguo / contradictorio, **[3P]** orientación de terceros (nunca entrada).

**Regla que se respeta:** con costos faltantes no se llama rentable nada a partir de un ROAS de ingresos, y no se inventa ningún umbral. Hoy `ok_core = FALTA_DATO` en todas las columnas reales: equilibrio, CPA máximo, ROAS de equilibrio y contribución tras publicidad = `FALTA_DATO`.

Archivos (carpeta `.../scratchpad/official/r03/`): `unit-economics-filled.csv` (mismo formato largo y mismas columnas que la plantilla; 134 parámetros, 568 fórmulas), `owner-cost-questions.md`, `eval_csv.js` (evaluador), `eval-output.txt` (salida de la última corrida), `build_csv.js` (generador), `catalog_raw.json` y `ship_raw.json` (lecturas crudas de la tienda).

## 1. Precios: los 4 niveles confirmados en vivo [V]
Consulta `products(first:100)` del 2026-10-02 ~12:03: 30 productos (29 activos + 1 interno archivado), 99 variantes (98 activas). Los 4 niveles son exactamente los esperados y TODAS las variantes están al 80% del tachado.

| Nivel | Tachado | Precio (con 20% incorporado) | Productos | Variantes | Unidades en inventario | Peso por inventario |
|---|---|---|---|---|---|---|
| 159.920 | 199.900 | 159.920 | 6 | 18 | 18 | 14,06% |
| 167.920 | 209.900 | 167.920 | 9 | 36 | 36 | 28,13% |
| 183.920 | 229.900 | 183.920 | 10 | 32 | 50 | 39,06% |
| 199.920 | 249.900 | 199.920 | 4 | 12 | 24 | 18,75% |
| **Total** | | | **29** | **98** | **128** | 100% |

Excluido: un producto interno ARCHIVADO (`prueba-lanzamiento-interna`, precio 5.000, inventario -1).

**Precio promedio GLOBAL (provisional) = 179.045 COP.** Cálculo: Σ(precio del nivel × unidades en inventario del nivel) / 128 = 22.917.760 / 128. Es la mezcla del INVENTARIO, no de las ventas; reemplazar por el precio promedio realmente vendido apenas haya pedidos. En el CSV es una fórmula (`SUMPRODUCT` sobre las filas `price` e `inv_units`). Referencias: promedio simple por variante 175.593; promedio simple de los 4 niveles 177.920; tachado ponderado 223.806.

## 2. Costos de plataforma y pago
| Concepto | Valor | Etiqueta y fuente |
|---|---|---|
| Cargo Shopify por pasarela externa (Wompi), plan Basic | 2% | [V] shopify.com/pricing (Basic 2% por pasarela de terceros) y página de Wompi del admin ("Cargo por transacción de 2 %", confirmación recibida con el encargo, no re-verificada aquí). |
| Base del 2% | [(productos − descuentos) + impuestos + **envío cobrado**] × tasa; no incluye propinas | [V] help.shopify.com (third-party-transaction-fees). Con IVA al cliente = 0, base = producto + envío. |
| ¿Shopify devuelve el 2% en reembolsos? | **Contradicción** | [NV] third-party-transaction-fees: "no se devuelve". refunding-orders: si Shopify Payments no está disponible en el país de la tienda (Colombia no está en la lista [V]), se devuelve en proporción al reembolso hecho desde el admin. Modelo: conservador, NO se recupera. |
| Wompi, tarifa pública estándar (Plan Avanzado) | 2,65% + $700 + IVA por transacción exitosa | [V] wompi.com/es/co/planes-tarifas y soporte.wompi.co (planes, publicado 2026-01-07). **Es un escenario**: el contrato real de la dueña NO se conoce → `wpct/wfix/wiva` reales = `FALTA_DATO`. Base del % = valor cobrado (producto + envío) [NV: no es explícito]. QR 1% [V], no modelado. Promo "0% el primer mes" [V página, elegibilidad NV], no modelada. |
| IVA sobre la comisión de Wompi | 19% sobre el valor de la comisión (% + fijo) | [V] soporte.wompi.co. Costo del proveedor modelado; para una persona NO RESPONSABLE DE IVA es costo no descontable [NV: contador]. |
| Retenciones de Wompi (solo tarjeta, Modelo Agregador) | retefuente 1,5%, ICA 0,2%, reteIVA 15% (base ambigua), y 11% sobre la factura mensual de comisiones | [V] soporte.wompi.co. Son retenciones de impuestos (efecto de caja), **no costo**; reteIVA no se calcula [NV]. Filas `ret_*` y `pp_ret_*` solo informativas. |
| Wompi en reembolsos | La comisión y su IVA **no se devuelven** en un reembolso total (es una transacción independiente); reembolsos solo de tarjetas Visa/Mastercard/Amex (Redeban/Credibanco) | [V] soporte.wompi.co. Anulación: el artículo no dice si se cobra comisión [NV]. |
| IVA al cliente | 0 | [V declarado por la dueña; NV contador]. |
| Shopify plan | USD 1/mes hasta 2027-01-04; luego USD 25/mes + impuestos (USD 19 si se paga anual) | [V] dato del proyecto + shopify.com/pricing ("3 días gratis y luego USD 1/mes por 3 meses"). Tasa COP/USD = `FALTA_DATO` (se exige la de la dueña). |
| Tarifas de envío cobradas a la clienta | Zona 1 Barranquilla/Atlántico 9.900; Zona 2 resto del Caribe 12.900; Zona 3 ciudades principales 17.900; Zona 4 resto del país 21.900; Zona 5 San Andrés/Amazonía 44.900; **gratis desde 299.900** | [V] Admin > perfil de envío (condición `TOTAL_PRICE`; tarifas hasta 299.899), 33 departamentos cubiertos. [NV] si el umbral cuenta el precio antes o después de códigos. |
| Costo real de la guía Envia por zona | `FALTA_DATO` (5 filas `label_z1-5`) | Sin tarifa en vivo (plan/CCS pendiente). [3P] orientación, NO entrada: tarifario público de Coordinadora (hasta 5 kg, 1-2 kg; vigencia no indicada): local $9.000, regional $10.450, nacional $17.830, destinos especiales $42.150, +1% del valor declarado. Envia (app) puede traer tarifas distintas; no confundir con Envía Colvanes (envia.co). |

**Hallazgo de envío gratis:** 1 unidad nunca alcanza 299.900 (máximo 199.920); 2 unidades de cualquier nivel suman al menos 319.840 y siempre lo superan (`free_min_units = 2`). Todo pedido de 2 prendas implica subsidio de guía completo.

## 3. Líneas PARCIALES (escenario tarifa pública; por pedido de 1 unidad, sin envío; no necesitan ningún dato desconocido)
Fórmulas: Shopify = base × 2%; Wompi = (base × 2,65% + 700) × 1,19; contribución antes de producto y subsidio de envío = precio neto − (Shopify + Wompi con IVA). Base = precio neto (+ envío cobrado si se usa `pub_s`). `net_extra` (precio tras descuento adicional) = `FALTA_DATO`.

| COP | 159.920 | 167.920 | 183.920 | 199.920 | GLOBAL 179.045 |
|---|---|---|---|---|---|
| (1) Precio neto tras el 20% incorporado (sin códigos adicionales) | 159.920 | 167.920 | 183.920 | 199.920 | 179.045 |
| (2) Shopify 2% | 3.198 | 3.358 | 3.678 | 3.998 | 3.581 |
| Wompi % + $700 (sin IVA) | 4.938 | 5.150 | 5.574 | 5.998 | 5.445 |
| IVA 19% de la comisión | 938 | 978 | 1.059 | 1.140 | 1.034 |
| (3) Wompi con IVA | 5.876 | 6.128 | 6.633 | 7.137 | 6.479 |
| Comisiones totales | 9.074 | 9.487 | 10.311 | 11.136 | 10.060 |
| Comisiones / base | 5,67% | 5,65% | 5,61% | 5,57% | 5,62% |
| (4) **Contribución antes de producto y subsidio de envío** | 150.846 | 158.433 | 173.609 | 188.784 | 168.985 |
| Techo matemático de CPA (ignora costos desconocidos) | 150.846 | 158.433 | 173.609 | 188.784 | 168.985 |
| Piso matemático de ROAS (aun con producto gratis) | 1,060 | 1,060 | 1,059 | 1,059 | 1,060 |

Lectura correcta: esas dos últimas filas son una **cota** (el CPA de equilibrio real es MENOR y el ROAS real MAYOR), **no un umbral**; no sirven para decidir. Efecto del envío cobrado: cada COP de envío agrega 2% + 2,65%×1,19 = 5,15% de comisión; p. ej. en el nivel 159.920 las comisiones pasan de 9.074 (sin envío) a 9.997 con envío de 17.900 y a 11.388 con 44.900. Retenciones informativas (caja, no costo) por pedido con tarjeta: 1,7% de la base (2.719 / 2.855 / 3.127 / 3.399; GLOBAL 3.044) y 11% de la comisión (543 / 566 / 613 / 660).

### CPA de muestra → ROAS implícito (informativo; NO indica rentabilidad)
| CPA | 159.920 | 167.920 | 183.920 | 199.920 | GLOBAL |
|---|---|---|---|---|---|
| 10.000 | 16,0 | 16,8 | 18,4 | 20,0 | 17,9 |
| 20.000 | 8,0 | 8,4 | 9,2 | 10,0 | 9,0 |
| 30.000 | 5,3 | 5,6 | 6,1 | 6,7 | 6,0 |
| 40.000 | 4,0 | 4,2 | 4,6 | 5,0 | 4,5 |

## 4. Fórmulas completas (muestran FALTA_DATO hasta que ok_core = OK)
- Cobro total C = precio × unidades × (1 − descuento adicional) + envío cobrado.
- **Contribución antes de publicidad** = C − costo×unidades − empaque − guía − (C×%Wompi + fijo)×(1+IVA) − C×2% − otros − reembolsos esperados + reventa recuperada − logística de devoluciones.
- **CPA máximo de equilibrio** = contribución; **ROAS de equilibrio** = C / contribución; **contribución tras publicidad con CPA de muestra** = contribución − CPA para 10.000 / 20.000 / 30.000 / 40.000 (filas `after_ads_1-4`).
- Con costos fijos: restar (plan USD × tasa + apps + otros) / pedidos al mes → `be_cpa_full`, `be_roas_full`; con utilidad objetivo → `target_cpa`, `target_roas`.
- **Subsidio de envío** (función): guía de la zona − (0 si el pedido llega a 299.900; si no, la tarifa de la zona). Promedio: `label − ship`. Filas `sub_z1-5` (si paga la tarifa) y `label_zN` (si es gratis).

## 5. Sensibilidad ilustrativa (NO es umbral)
"Presupuesto máximo por pedido de 1 unidad para costo de producto + empaque + subsidio de envío + devoluciones + otros que deja la contribución en 0 a ROAS X (base Shopify)". Fórmula: precio neto − comisiones − precio neto / X. Con envío 0, empaque, envío neto, devoluciones y otros en 0 es una **cota superior del costo de producto** admisible; el real es menor. Los valores de ROAS (2, 3, 4, 5) son parámetros de muestra editables, no metas.

| ROAS X | 159.920 | 167.920 | 183.920 | 199.920 | GLOBAL |
|---|---|---|---|---|---|
| 2 | 70.886 | 74.473 | 81.649 | 88.824 | 79.462 |
| 3 | 97.539 | 102.460 | 112.302 | 122.144 | 109.303 |
| 4 | 110.866 | 116.453 | 127.629 | 138.804 | 124.224 |
| 5 | 118.862 | 124.849 | 136.825 | 148.800 | 133.176 |

(Como % del precio neto: ≈ 44,3% / 61,0% / 69,3% / 74,3% para ROAS 2 / 3 / 4 / 5.)

## 6. Qué quedó lleno y qué quedó FALTA_DATO
Lleno [V]: `price`, `compare_at` (H-K; G por fórmula), conteos `inv_*`, `free_thr`, `ship_z1-5`, `sfee`, `plan`, `plan_promo`, escenario público `wpct_pub/wfix_pub/wiva_pub`, informativos `wqr_pub`, `ret_fuente/ret_ica/ret_iva/ret_comm`, `cust_iva` (declarado), parámetros de muestra (`pub_s`, `cpa_s1-4`, `roas_x1-4`).
`FALTA_DATO` (36 filas): `extra, units, cogs, pack, ship, label, label_z1-5, wpct, wfix, wiva, othervar, rrate, rshare, rresale, rship, fx, apps, otherfixed, orders_m, mratio, target_profit` y los 11 parámetros `p_*` de la sección K. Los 8 puntos mínimos para llenarlos están en `owner-cost-questions.md`.

## 7. Diferencias frente a la plantilla (laneM)
1. Las fórmulas CORE (bloques I y J, 186 fórmulas comparadas por id) son idénticas; solo cambió `builtin_disc` (ahora con `ISNUMBER`, sin efecto numérico).
2. Celdas desconocidas con el texto `FALTA_DATO` (la plantilla las dejaba vacías); el `COUNT` de los controles no las cuenta, igual que antes.
3. `price`/`compare_at` GLOBAL: la plantilla pedía el precio promedio vendido; ahora es el ponderado por inventario (provisional).
4. Filas nuevas: conteos de inventario, zonas de envío y subsidio, escenario público de Wompi, retenciones informativas, `plan_promo`, `cust_iva`, `ok_pub` y los bloques L y M.
5. Confirmado, sin diferencia: 4 niveles, 98 variantes, 128 unidades, 20% incorporado, 2% de Shopify (la plantilla ya cobraba el 2% sobre producto + envío, que es la base oficial).
6. Nuevo y no estaba en la plantilla: contradicción de Shopify sobre reembolso del 2% [NV]; Wompi no devuelve su comisión en reembolsos [V]; todo pedido de 2 prendas supera el envío gratis.
7. El tablero (`owner-dashboard-checklist.md`) no cambia: usa los mismos ids; hasta que `ok_core` sea OK aplica R1 ("seguir probando") y la puerta B3 sigue abierta. Las líneas parciales NO sustituyen `be_cpa` ni `be_roas`.

## 8. Verificación
`node eval_csv.js` carga el CSV, evalúa las 568 fórmulas (0 errores), compara las fórmulas CORE contra la plantilla por id, recalcula desde `catalog_raw.json` los conteos y precios, verifica con aritmética independiente las líneas parciales y el ejemplo, y prueba la propagación de `FALTA_DATO` (llenar los 15 datos de la columna GLOBAL con los valores del ejemplo: `ok_core` pasa a OK solo con el último y entonces coincide con la columna EXAMPLE_ONLY: contribución 53.226, ROAS de equilibrio 2,2921, tras publicidad con CPA 20.000 = 33.226). Resultado: `CHECKS: ALL PASSED`.

Fin del carril: 2026-10-02 12:16:50 (America/Bogota). Inicio: 2026-10-02 12:03.
