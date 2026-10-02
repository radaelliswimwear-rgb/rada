// Generates unit-economics-filled.csv from a row specification.
// Row numbers are assigned automatically so formulas stay consistent (file line N == spreadsheet row N, header = row 1).
// Tokens inside formula templates:  [id]  -> same column, row of `id`      (e.g. H9)
//                                   [$id] -> column G absolute, row of id  (e.g. $G21)
//                                   [$]   -> $G + current row               (inherit pattern)
const fs = require('fs');
const path = require('path');

const COLS = ['G', 'H', 'I', 'J', 'K', 'L'];
const TIERS = ['H', 'I', 'J', 'K'];
const HEADER = ['seccion', 'id', 'concepto', 'unidad', 'tipo', 'quien_aporta', 'GLOBAL', 'FAM_PRECIO_159920', 'FAM_PRECIO_167920', 'FAM_PRECIO_183920', 'FAM_PRECIO_199920', 'EXAMPLE_ONLY_valores_falsos', 'nota_fuente_o_formula'];
const FD = 'FALTA_DATO';

const SEC = {
  A: 'A. PRECIO Y DESCUENTOS',
  B: 'B. COSTO DE PRODUCTO',
  C: 'C. ENVÍO (subsidio de envío)',
  D: 'D. PAGOS Y PLATAFORMAS (se llenan solo en la columna GLOBAL)',
  E: 'E. DEVOLUCIONES Y CANCELACIONES',
  F: 'F. COSTOS FIJOS MENSUALES (solo columna GLOBAL)',
  G: 'G. PUENTE ENTRE ROAS DE META Y VENTAS DE SHOPIFY',
  H: 'H. OBJETIVO DE UTILIDAD (decisión de la dueña)',
  I: 'I. CONTROL DE DATOS COMPLETOS',
  J: 'J. CÁLCULOS (no editar)',
  K: 'K. PARÁMETROS DE DECISIÓN DEL TABLERO (solo GLOBAL; sin valor = FALTA_DATO: no se inventan, los fija la dueña con datos)',
  L: 'L. LÍNEAS PARCIALES CON TARIFA PÚBLICA DE WOMPI (escenario ilustrativo por pedido de 1 unidad; no usan costos desconocidos; NO indican rentabilidad)',
  M: 'M. SENSIBILIDAD ILUSTRATIVA (presupuesto de costos que deja el equilibrio a un ROAS dado; NO es umbral de decisión)',
};

const items = []; // {kind:'leeme'|'section'|'row', ...}
const LEEME = (t) => items.push({ kind: 'leeme', text: t });
const SECTION = (k) => items.push({ kind: 'section', name: SEC[k] });
// cells: object keyed by column letter; values: literal (number|string) or {f: 'template'} for formulas
const ROW = (sec, id, concepto, unidad, tipo, quien, cells, nota) =>
  items.push({ kind: 'row', sec: SEC[sec], id, concepto, unidad, tipo, quien, cells, nota });

const f = (tpl) => ({ f: tpl });
const fAll = (tpl) => ({ G: f(tpl), H: f(tpl), I: f(tpl), J: f(tpl), K: f(tpl), L: f(tpl) });
const inh = () => ({ H: f('IF([$]="","",[$])'), I: f('IF([$]="","",[$])'), J: f('IF([$]="","",[$])'), K: f('IF([$]="","",[$])') });
const tiers = (a, b, c, d) => ({ H: a, I: b, J: c, K: d });
const gOnlyFD = (extraL) => ({ G: FD, ...inh(), ...(extraL !== undefined ? { L: extraL } : {}) });

// ---------------------------------------------------------------- LEEME
LEEME('LEEME 1: formato largo. Cada FILA es un parámetro; cada COLUMNA es una familia de producto (GLOBAL = promedio de la tienda; FAM_PRECIO_* = los 4 niveles de precio reales del catálogo; EXAMPLE_ONLY = ejemplo FALSO).');
LEEME('LEEME 2: la dueña SOLO escribe en celdas de tipo ENTRADA_OBLIGATORIA o ENTRADA_GLOBAL_OBLIGATORIA que digan FALTA_DATO: reemplazar el texto FALTA_DATO por el número real (poner 0, no dejar vacío, cuando un costo no aplica). Nada está inventado: solo están llenas las celdas con etiqueta [V] (verificado en fuente oficial o consulta de solo lectura a la tienda el 2026-10-02).');
LEEME('LEEME 3: mientras falte un dato obligatorio, las fórmulas CORE (bloque J) muestran FALTA_DATO (no calculan nada parcial). Las líneas PARCIALES (bloques L y M) usan solo datos verificados y la tarifa pública de Wompi como ESCENARIO; no dicen si el negocio tiene utilidad. No decidir presupuesto con la columna EXAMPLE_ONLY.');
LEEME('LEEME 4: porcentajes como decimal (0.20 = 20%) y punto decimal. Fórmulas con coma como separador; si su Excel está en español y da error, reemplace comas por punto y coma (y, si los números aparecen como texto, importe el CSV con configuración regional en inglés o cambie el punto por coma). En Google Sheets: Archivo > Configuración > Configuración regional = Estados Unidos antes de importar.');
LEEME('LEEME 5: las columnas FAM_PRECIO_* son niveles de precio (ya con 20% de descuento incorporado: precio = 80% del tachado). Si los costos difieren por producto, copie una columna y renómbrela (bikini, enterizo, etc.).');
LEEME('LEEME 6: fuentes de verdad: costos de producto = taller/proveedores; Wompi = contrato y panel de Wompi (NO usar tarifas de blogs; la tarifa pública oficial solo se usa como escenario ilustrativo); Envia = cotización/guía real (los tarifarios de transportadoras son solo orientación [3P]); Shopify = factura y Analytics; IVA = contador (la dueña se declara NO RESPONSABLE DE IVA).');
LEEME('LEEME 7: etiquetas de evidencia en la columna nota: [V] verificado (fuente oficial o consulta de solo lectura a la tienda el 2026-10-02); [NV] no verificable, ambiguo o contradictorio (decidir con contador/proveedor); [3P] orientación de terceros (tarifarios públicos): NUNCA se usa como entrada.');
LEEME('LEEME 8: bloques L y M = escenario ILUSTRATIVO con la tarifa pública estándar de Wompi (Plan Avanzado). El contrato real de la dueña NO se conoce: wpct/wfix/wiva (reales) siguen en FALTA_DATO. Si el contrato es el estándar, la dueña puede copiar a wpct/wfix/wiva los valores de wpct_pub/wfix_pub/wiva_pub.');
LEEME('LEEME 9: cambios frente a la plantilla de laneM: filas nuevas (inv_variants, inv_units, inv_products, w_inv, subsidy, free_thr, free_min_units, ship_z1-5, label_z1-5, sub_z1-5, wpct_pub, wfix_pub, wiva_pub, wqr_pub, ret_fuente, ret_ica, ret_iva, ret_comm, cust_iva, plan_promo, plan_cop, plan_promo_cop, ok_pub, bloques L y M); builtin_disc ahora usa ISNUMBER; las celdas desconocidas dicen FALTA_DATO en vez de estar vacías; las fórmulas CORE de los bloques I y J no cambian (solo se verifican por id en el evaluador).');

// ---------------------------------------------------------------- A. PRECIO Y DESCUENTOS
SECTION('A');
ROW('A', 'price', 'Precio de venta vigente (ya con 20% de descuento incorporado)', 'COP/unidad', 'DATO_VERIFICADO (H-K) / FORMULA provisional (G)', 'Catálogo Shopify (consulta de solo lectura 2026-10-02); GLOBAL = ponderado por inventario',
  { G: f('IF(SUM(H[inv_units]:K[inv_units])>0,SUMPRODUCT(H[price]:K[price],H[inv_units]:K[inv_units])/SUM(H[inv_units]:K[inv_units]),"FALTA_DATO")'), ...tiers(159920, 167920, 183920, 199920), L: 100000 },
  '[V] H-K: 98 variantes activas en exactamente 4 precios (29 productos activos; se excluye 1 producto interno ARCHIVADO de COP 5.000 con inventario -1). G = suma(precio del nivel x unidades en inventario) / unidades totales (128) = 179.045: PROVISIONAL, es la mezcla del INVENTARIO, no de las ventas; reemplazar por el precio promedio realmente vendido (Shopify Analytics) cuando haya pedidos. Promedio simple por variante = 175.593; promedio simple de los 4 niveles = 177.920.');
ROW('A', 'compare_at', 'Precio de comparación (tachado)', 'COP/unidad', 'DATO_VERIFICADO (H-K) / FORMULA provisional (G)', 'Catálogo Shopify (consulta de solo lectura 2026-10-02)',
  { G: f('IF(SUM(H[inv_units]:K[inv_units])>0,SUMPRODUCT(H[compare_at]:K[compare_at],H[inv_units]:K[inv_units])/SUM(H[inv_units]:K[inv_units]),"FALTA_DATO")'), ...tiers(199900, 209900, 229900, 249900), L: 125000 },
  '[V] H-K: precio de comparación de las 98 variantes. G = mismo ponderado por inventario (223.806). Solo informativo para calcular el descuento incorporado.');
ROW('A', 'builtin_disc', 'Descuento incorporado en el precio', 'decimal', 'FORMULA', 'calculado', fAll('IF(AND(ISNUMBER([price]),ISNUMBER([compare_at])),1-[price]/[compare_at],"")'),
  'Cálculo: 1 - precio / tachado. [V] Da 0.20 en los 4 niveles y en GLOBAL (todas las variantes están al 80% del tachado).');
ROW('A', 'inv_variants', 'Variantes activas por nivel de precio (conteo)', 'variantes', 'DATO_VERIFICADO', 'Catálogo Shopify (consulta de solo lectura 2026-10-02)',
  { G: f('SUM(H[inv_variants]:K[inv_variants])'), ...tiers(18, 36, 32, 12) }, '[V] 18 + 36 + 32 + 12 = 98 variantes (talla/color) de 29 productos activos. Se excluye el producto interno archivado.');
ROW('A', 'inv_units', 'Unidades en inventario por nivel de precio', 'unidades', 'DATO_VERIFICADO', 'Catálogo Shopify (inventoryQuantity, consulta de solo lectura 2026-10-02 ~12:03 Bogotá)',
  { G: f('SUM(H[inv_units]:K[inv_units])'), ...tiers(18, 36, 50, 24) }, '[V] 18 + 36 + 50 + 24 = 128 unidades. Cambia con cada venta: es la foto del 2026-10-02, usada solo como peso del precio promedio GLOBAL provisional.');
ROW('A', 'inv_products', 'Productos activos por nivel de precio (conteo)', 'productos', 'DATO_VERIFICADO', 'Catálogo Shopify (consulta de solo lectura 2026-10-02)',
  { G: f('SUM(H[inv_products]:K[inv_products])'), ...tiers(6, 9, 10, 4) }, '[V] 6 + 9 + 10 + 4 = 29 productos activos (Oasis Natural 10, Espuma de Ola 7, Aurora Viva 12).');
ROW('A', 'w_inv', 'Peso del nivel en el inventario (unidades del nivel / unidades totales)', 'decimal', 'FORMULA', 'calculado',
  { G: f('SUM(H[w_inv]:K[w_inv])'), H: f('H[inv_units]/$G[inv_units]'), I: f('I[inv_units]/$G[inv_units]'), J: f('J[inv_units]/$G[inv_units]'), K: f('K[inv_units]/$G[inv_units]') },
  'Cálculo: unidades del nivel / 128. Es el peso usado para el precio GLOBAL provisional. Suma 1.');
ROW('A', 'extra', 'Descuento adicional promedio por pedido (códigos, promos, regalos)', 'decimal', 'ENTRADA_OBLIGATORIA', 'Dueña; luego Shopify Analytics > Sales > descuentos',
  { G: FD, H: FD, I: FD, J: FD, K: FD, L: 0.05 }, 'FALTA_DATO. 0 si no habrá códigos. Se aplica sobre el valor de producto. (No se pudo leer códigos de descuento en 03Q: falta alcance read_discounts.)');
ROW('A', 'units', 'Unidades por pedido (promedio)', 'unidades', 'ENTRADA_OBLIGATORIA', 'Dueña (estimación inicial); luego Shopify: unidades / pedidos',
  { G: FD, H: FD, I: FD, J: FD, K: FD, L: 1.2 }, 'FALTA_DATO. Pedidos de 2 piezas (bikini top + bottom vendidos por separado) suben este número. Ojo: un pedido de 2 unidades de cualquier nivel (>= 319.840) supera el umbral de envío gratis (ver free_min_units).');

// ---------------------------------------------------------------- B. COSTO DE PRODUCTO
SECTION('B');
ROW('B', 'cogs', 'Costo de producto por unidad (tela, confección, mano de obra, etiquetas, forro)', 'COP/unidad', 'ENTRADA_OBLIGATORIA', 'Dueña / taller',
  { G: FD, H: FD, I: FD, J: FD, K: FD, L: 30000 }, 'FALTA DATO REAL (no verificable desde la tienda: no hay costo cargado en Shopify). Incluir merma de producción si aplica.');
ROW('B', 'pack', 'Empaque por pedido (bolsa, caja, tarjeta, etiqueta)', 'COP/pedido', 'ENTRADA_OBLIGATORIA', 'Dueña',
  { G: FD, H: FD, I: FD, J: FD, K: FD, L: 2000 }, 'FALTA DATO REAL.');

// ---------------------------------------------------------------- C. ENVÍO
SECTION('C');
ROW('C', 'ship', 'Envío cobrado a la clienta (promedio por pedido, incluye pedidos con envío gratis = 0)', 'COP/pedido', 'ENTRADA_OBLIGATORIA', 'Shopify (tarifas regionales 9.900-44.900; gratis desde 299.900)',
  { G: FD, H: FD, I: FD, J: FD, K: FD, L: 8000 }, 'FALTA_DATO (depende de la mezcla de zonas y de cuántos pedidos llegan al envío gratis). Promedio ponderado: tarifa pagada x % de pedidos que la pagan. Tras el lanzamiento: Analytics > Sales > envío cobrado / pedidos. Referencia [V] de las tarifas por zona en ship_z1-5.');
ROW('C', 'label', 'Costo real de la guía Envia por pedido (promedio)', 'COP/pedido', 'ENTRADA_OBLIGATORIA', 'Envia (cotización o guía real)',
  { G: FD, H: FD, I: FD, J: FD, K: FD, L: 12000 },
  'FALTA_DATO REAL: aún no se compró ninguna guía; la tarifa en vivo de Envia está pendiente (plan/CCS). [3P] Solo orientación, NO entrada: el tarifario público de Coordinadora (paquete hasta 5 kg, 1-2 kg, vigencia no indicada en la página) lista local $9.000, regional $10.450, nacional $17.830, destinos especiales $42.150, más 1% del valor declarado; las tarifas contratadas vía Envia pueden diferir. No confundir Envia (app de la tienda) con Envía Colvanes (envia.co), que es otra empresa.');
ROW('C', 'subsidy', 'Subsidio de envío promedio por pedido (guía - envío cobrado; negativo = la clienta paga más que la guía)', 'COP/pedido', 'FORMULA', 'calculado',
  fAll('IF(AND(ISNUMBER([label]),ISNUMBER([ship])),[label]-[ship],"FALTA_DATO")'), 'FUNCIÓN del subsidio: guía - envío cobrado. FALTA_DATO hasta que label y ship existan. Por zona: sub_z1-5 (si la clienta paga la tarifa) o label_zN (si el pedido llega al envío gratis).');
ROW('C', 'free_thr', 'Umbral de envío gratis (valor de los productos del pedido)', 'COP', 'DATO_VERIFICADO', 'Admin Shopify > perfil de envío (consulta de solo lectura 2026-10-02)',
  { G: 299900, ...inh(), L: 299900 }, '[V] Condición TOTAL_PRICE >= 299.900 en las 5 zonas: "Envío estándar gratis"; las tarifas de pago aplican hasta 299.899. [NV] si el umbral cuenta el precio antes o después de códigos de descuento.');
ROW('C', 'free_min_units', 'Unidades mínimas por pedido para envío gratis (a precio del nivel, sin descuento adicional)', 'unidades', 'FORMULA', 'calculado',
  fAll('IF(AND(ISNUMBER([price]),ISNUMBER([free_thr])),ROUNDUP([free_thr]/[price],0),"FALTA_DATO")'), 'Cálculo: umbral / precio, redondeado hacia arriba. Da 2 en los 4 niveles: 1 unidad nunca llega al envío gratis (máx 199.920) y 2 unidades siempre (mín 319.840).');
const zones = [
  ['z1', 'Zona 1 — Barranquilla y Atlántico', 9900],
  ['z2', 'Zona 2 — Resto del Caribe', 12900],
  ['z3', 'Zona 3 — Ciudades principales', 17900],
  ['z4', 'Zona 4 — Resto del país', 21900],
  ['z5', 'Zona 5 — San Andrés y Amazonía', 44900],
];
for (const [z, nm, rate] of zones) {
  ROW('C', 'ship_' + z, `Tarifa de envío cobrada a la clienta: ${nm}`, 'COP/pedido', 'DATO_VERIFICADO', 'Admin Shopify > perfil de envío (consulta de solo lectura 2026-10-02)',
    { G: rate, ...inh(), L: rate }, '[V] "Envío estándar" de la zona, para pedidos hasta 299.899; gratis desde 299.900.');
}
for (const [z, nm] of zones) {
  ROW('C', 'label_' + z, `Costo real de la guía Envia hacia: ${nm}`, 'COP/pedido', 'ENTRADA_GLOBAL_OBLIGATORIA', 'Envia (cotización real por ciudad/zona)',
    { G: FD, ...inh(), L: { z1: 8000, z2: 11000, z3: 14000, z4: 19000, z5: 40000 }[z] }, 'FALTA_DATO (valor L = ejemplo FALSO). [3P] sin entrada desde tarifarios públicos.');
}
for (const [z, nm] of zones) {
  ROW('C', 'sub_' + z, `Subsidio de envío si la clienta paga la tarifa: ${nm}`, 'COP/pedido', 'FORMULA', 'calculado',
    { G: f(`IF(AND(ISNUMBER([label_${z}]),ISNUMBER([ship_${z}])),[label_${z}]-[ship_${z}],"FALTA_DATO")`), ...inh(), L: f(`IF(AND(ISNUMBER([label_${z}]),ISNUMBER([ship_${z}])),[label_${z}]-[ship_${z}],"FALTA_DATO")`) },
    `FUNCIÓN: guía de la zona - tarifa cobrada. Si el pedido llega al envío gratis (>= free_thr) el subsidio es la guía completa (label_${z}), porque la clienta paga 0. Subsidio de un pedido = label_zona - (si total >= free_thr, 0; si no, ship_zona).`);
}

// ---------------------------------------------------------------- D. PAGOS Y PLATAFORMAS
SECTION('D');
ROW('D', 'wpct', 'Comisión Wompi, porcentaje sobre el cobro', 'decimal', 'ENTRADA_GLOBAL_OBLIGATORIA', 'Contrato / panel de Wompi',
  gOnlyFD(0.05), 'FALTA DATO REAL (contrato real de la dueña desconocido). Escenario con la tarifa pública en wpct_pub. Varía por método (tarjeta/PSE/Nequi/QR) y por plan: usar el promedio ponderado por mezcla de pagos o la peor tarifa. No usar tarifas de blogs.');
ROW('D', 'wfix', 'Comisión Wompi, valor fijo por transacción', 'COP/transacción', 'ENTRADA_GLOBAL_OBLIGATORIA', 'Contrato / panel de Wompi',
  gOnlyFD(500), 'FALTA DATO REAL (contrato). 0 si no aplica. Escenario público en wfix_pub.');
ROW('D', 'wiva', 'IVA sobre la comisión Wompi (si es costo para la dueña)', 'decimal', 'ENTRADA_GLOBAL_OBLIGATORIA', 'Contador',
  gOnlyFD(0.19), 'FALTA_DATO (depende del contrato y del contador). [V] Wompi cobra IVA 19% sobre el valor de la comisión (soporte.wompi.co). La dueña es NO RESPONSABLE DE IVA: ese IVA es costo no descontable [NV: confirmar con contador]; 0 si no aplica. Escenario en wiva_pub.');
ROW('D', 'sfee', 'Cargo de Shopify por pasarela de terceros (Wompi)', 'decimal', 'ENTRADA_GLOBAL_OBLIGATORIA (DATO_VERIFICADO)', 'Shopify',
  { G: 0.02, ...inh(), L: 0.02 },
  '[V] 2%: "Cargo por transacción de 2 %" en la página de Wompi del admin y shopify.com/pricing (Basic: 2% terceros). Base [V] (help.shopify.com, third-party-transaction-fees): [(productos - descuentos) + impuestos + envío cobrado] x tarifa; no incluye propinas; NO es solo el valor de producto. Reembolsos [NV, la ayuda se contradice]: third-party-transaction-fees dice que el cargo NO se devuelve; refunding-orders dice que, si Shopify Payments no existe en el país de la tienda (Colombia no está en la lista [V]), se devuelve en proporción al reembolso hecho desde el admin. Modelo conservador: NO se recupera. Confirmar en la primera factura.');
ROW('D', 'othervar', 'Otros costos variables por pedido (atención, regalo, comisión de aliada)', 'COP/pedido', 'ENTRADA_GLOBAL_OBLIGATORIA', 'Dueña',
  gOnlyFD(0), 'FALTA_DATO. Poner 0 si no hay.');
ROW('D', 'wpct_pub', 'ESCENARIO TARIFA PÚBLICA Wompi: porcentaje sobre el cobro (Plan Avanzado)', 'decimal', 'ESCENARIO_TARIFA_PUBLICA', 'wompi.com/es/co/planes-tarifas (consulta 2026-10-02)',
  { G: 0.0265, ...inh(), L: 0.0265 },
  '[V] Plan Avanzado: 2,65% + $700 + IVA por transacción exitosa (también soporte.wompi.co, artículo de planes, publicado 2026-01-07). ILUSTRATIVO: no es el contrato de la dueña. Base del % = valor de la transacción cobrada (producto + envío) [NV: no explícito en la documentación]. La página muestra una promoción "0% de comisión el primer mes" [V página; elegibilidad NV]; no se modela.');
ROW('D', 'wfix_pub', 'ESCENARIO TARIFA PÚBLICA Wompi: valor fijo por transacción', 'COP/transacción', 'ESCENARIO_TARIFA_PUBLICA', 'wompi.com/es/co/planes-tarifas (consulta 2026-10-02)',
  { G: 700, ...inh(), L: 700 }, '[V] $700 por transacción exitosa (una vez por pedido, no por unidad). IVA se suma (ver wiva_pub).');
ROW('D', 'wiva_pub', 'ESCENARIO TARIFA PÚBLICA Wompi: IVA sobre la comisión', 'decimal', 'ESCENARIO_TARIFA_PUBLICA', 'soporte.wompi.co: ¿Qué impuesto me cobra la Pasarela Wompi? (consulta 2026-10-02)',
  { G: 0.19, ...inh(), L: 0.19 }, '[V] IVA 19% liquidado sobre el valor de la comisión generada por cada transacción (comisión = % + fijo). Para una persona NO RESPONSABLE DE IVA es costo no descontable [NV: contador]. Es costo del proveedor modelado, no IVA al cliente.');
ROW('D', 'wqr_pub', 'INFORMATIVO tarifa pública Wompi con QR (no se usa en cálculos)', 'decimal', 'INFORMATIVO', 'wompi.com/es/co/planes-tarifas (consulta 2026-10-02)',
  { G: 0.01, ...inh(), L: 0.01 }, '[V] QR: 1% por transacción exitosa. [NV] si se suma IVA y si QR está habilitado en el checkout de la tienda. No incluido en ninguna fórmula.');
ROW('D', 'ret_fuente', 'INFORMATIVO retención en la fuente de Wompi sobre pagos con tarjeta (NO es costo)', 'decimal', 'INFORMATIVO', 'soporte.wompi.co: ¿Qué cobros adicionales se generan sobre las transacciones aprobadas? (consulta 2026-10-02)',
  { G: 0.015, ...inh(), L: 0.015 }, '[V] 1,5% sobre el valor de la venta antes de impuestos, solo tarjetas y solo en el Modelo Agregador; puede variar según RUT/régimen. Es retención de impuestos: reduce el efectivo recibido, no es costo de operación; su tratamiento (anticipo/crédito de renta) lo confirma el contador [NV].');
ROW('D', 'ret_ica', 'INFORMATIVO retención de ICA de Wompi sobre pagos con tarjeta (NO es costo)', 'decimal', 'INFORMATIVO', 'soporte.wompi.co: ¿Qué cobros adicionales...? (consulta 2026-10-02)',
  { G: 0.002, ...inh(), L: 0.002 }, '[V] 0,2%, solo tarjetas, modelo agregador. Retención, no costo.');
ROW('D', 'ret_iva', 'INFORMATIVO reteIVA de Wompi sobre pagos con tarjeta (NO es costo; no se usa en cálculos)', 'decimal', 'INFORMATIVO', 'soporte.wompi.co: ¿Wompi me cobra la retención del IVA? (consulta 2026-10-02)',
  { G: 0.15, ...inh(), L: 0.15 }, '[V] 15%, solo tarjetas y modelo agregador, "calculado sobre el valor sin impuestos". [NV] el texto es ambiguo (¿15% del valor de la venta o del IVA?): no se calcula. Retención, no costo.');
ROW('D', 'ret_comm', 'INFORMATIVO retefuente 11% sobre la factura mensual de comisiones de Wompi (NO es costo)', 'decimal', 'INFORMATIVO', 'soporte.wompi.co: retenciones practicadas sobre las facturas de la comisión (consulta 2026-10-02)',
  { G: 0.11, ...inh(), L: 0.11 }, '[V] 11% sobre el valor de la factura mensual de "Comisiones antes de IVA", para personas jurídicas y personas naturales comerciantes; las autorretenedoras o agentes retenedoras pueden pedir su devolución (~10 días hábiles). Retención, no costo; el contador define si aplica a la dueña [NV].');
ROW('D', 'cust_iva', 'IVA cobrado a la clienta (la dueña declara NO RESPONSABLE DE IVA)', 'decimal', 'DATO_DECLARADO', 'Dueña (declarado); contador a confirmar',
  { G: 0, ...inh(), L: 0 }, '[V declarado por la dueña; NV confirmación del contador] 0: el cobro total = producto + envío, sin impuestos. Todo el modelo asume impuestos al cliente = 0. El IVA de la comisión de Wompi SÍ es costo (wiva / wiva_pub).');

// ---------------------------------------------------------------- E. DEVOLUCIONES
SECTION('E');
ROW('E', 'rrate', '% de pedidos devueltos o cancelados con reembolso', 'decimal', 'ENTRADA_OBLIGATORIA', 'Dueña (estimación); luego Shopify Analytics > Sales > devoluciones',
  { G: FD, H: FD, I: FD, J: FD, K: FD, L: 0.08 },
  'FALTA DATO REAL. Reemplazar por el dato medido en cuanto haya pedidos. Comisión en reembolsos: Wompi [V] en un reembolso total la comisión de Wompi y su IVA NO se devuelven (el reembolso es una transacción independiente; solo tarjetas Visa/Mastercard/Amex vía Redeban/Credibanco); en anulación el artículo no dice si se cobra comisión [NV]. Shopify: ver sfee [NV]. El modelo asume ambas comisiones no recuperables.');
ROW('E', 'rshare', '% del valor de producto que se reembolsa en esos casos', 'decimal', 'ENTRADA_OBLIGATORIA', 'Dueña',
  { G: FD, H: FD, I: FD, J: FD, K: FD, L: 1 }, 'FALTA_DATO. 1 = reembolso total. El envío cobrado se asume no reembolsado.');
ROW('E', 'rresale', '% de unidades devueltas que se pueden revender', 'decimal', 'ENTRADA_OBLIGATORIA', 'Dueña',
  { G: FD, H: FD, I: FD, J: FD, K: FD, L: 0.5 }, 'FALTA_DATO. Por higiene, muchas prendas de baño no se revenden: decidir política de cambios. 0 si ninguna.');
ROW('E', 'rship', 'Costo logístico de la devolución por caso', 'COP/caso', 'ENTRADA_OBLIGATORIA', 'Dueña / Envia',
  { G: FD, H: FD, I: FD, J: FD, K: FD, L: 10000 }, 'FALTA_DATO. 0 si paga la clienta. Las comisiones de pago y la guía de ida se asumen no recuperables (criterio conservador).');

// ---------------------------------------------------------------- F. COSTOS FIJOS
SECTION('F');
ROW('F', 'plan', 'Plan Shopify Basic tras la promoción', 'USD/mes', 'ENTRADA_GLOBAL_OBLIGATORIA (DATO_VERIFICADO)', 'Shopify',
  { G: 25, ...inh(), L: 25 }, '[V] USD 25/mes + impuestos desde 2027-01-04 (plan mensual; shopify.com/pricing muestra USD 19/mes si se paga anual). Confirmar en la factura. Impuestos sobre la suscripción [NV].');
ROW('F', 'plan_promo', 'Plan Shopify Basic durante la promoción (hasta 2027-01-04)', 'USD/mes', 'DATO_VERIFICADO', 'Shopify (dato del proyecto) / shopify.com/pricing',
  { G: 1, ...inh(), L: 1 }, '[V] USD 1/mes hasta 2027-01-04 (shopify.com/pricing: "3 días gratis y luego USD 1/mes por 3 meses"). El modelo de costo fijo usa el plan POST-promoción (más conservador).');
ROW('F', 'fx', 'Tasa de cambio COP por USD que cobra su tarjeta', 'COP/USD', 'ENTRADA_GLOBAL_OBLIGATORIA', 'Dueña (extracto de la tarjeta)',
  gOnlyFD(4000), 'FALTA DATO REAL (se exige la tasa de la dueña; no se usa una tasa de mercado).');
ROW('F', 'plan_cop', 'Plan Shopify post-promoción en COP', 'COP/mes', 'FORMULA', 'calculado',
  { G: f('IF(AND(ISNUMBER([plan]),ISNUMBER([fx])),[plan]*[fx],"FALTA_DATO")'), ...inh(), L: f('IF(AND(ISNUMBER([plan]),ISNUMBER([fx])),[plan]*[fx],"FALTA_DATO")') }, 'FALTA_DATO hasta que exista fx. Cálculo: USD 25 x tasa.');
ROW('F', 'plan_promo_cop', 'Plan Shopify durante la promoción en COP', 'COP/mes', 'FORMULA', 'calculado',
  { G: f('IF(AND(ISNUMBER([plan_promo]),ISNUMBER([fx])),[plan_promo]*[fx],"FALTA_DATO")'), ...inh(), L: f('IF(AND(ISNUMBER([plan_promo]),ISNUMBER([fx])),[plan_promo]*[fx],"FALTA_DATO")') }, 'FALTA_DATO hasta que exista fx. Cálculo: USD 1 x tasa.');
ROW('F', 'apps', 'Apps y servicios mensuales (Wompi app, Envia, correo, dominio/12, otros)', 'COP/mes', 'ENTRADA_GLOBAL_OBLIGATORIA', 'Dueña (revisar cada app instalada)',
  gOnlyFD(10000), 'FALTA DATO REAL: verificar costo de cada app y del dominio. 0 si todo es gratis.');
ROW('F', 'otherfixed', 'Otros fijos mensuales (contenido/fotografía, herramientas, tiempo valorado)', 'COP/mes', 'ENTRADA_GLOBAL_OBLIGATORIA', 'Dueña',
  gOnlyFD(100000), 'FALTA_DATO. Opcional pero recomendado; 0 si no se valora.');
ROW('F', 'orders_m', 'Pedidos mensuales esperados (para repartir los fijos)', 'pedidos/mes', 'ENTRADA_GLOBAL_OBLIGATORIA', 'Dueña (estimación)',
  gOnlyFD(100), 'FALTA_DATO. Estimación; actualizar con datos reales a las 4 semanas.');

// ---------------------------------------------------------------- G. PUENTE META
SECTION('G');
ROW('G', 'mratio', 'Valor por compra que reporta Meta / cobro total del pedido en Shopify', 'ratio', 'ENTRADA_GLOBAL_OBLIGATORIA', 'Se mide con los primeros pedidos (Meta vs Shopify)',
  gOnlyFD(1), 'FALTA_DATO. No se asume: Shopify indica que Meta usa el precio total de los artículos (¿con envío/descuentos?). Medir en 5-10 pedidos reales.');

// ---------------------------------------------------------------- H. OBJETIVO
SECTION('H');
ROW('H', 'target_profit', 'Utilidad objetivo por pedido tras publicidad y costos fijos', 'COP/pedido', 'ENTRADA_GLOBAL_OBLIGATORIA', 'Dueña (decisión de negocio)',
  gOnlyFD(5000), 'FALTA_DATO. No se inventa. 0 = solo equilibrio.');

// ---------------------------------------------------------------- I. CONTROL
SECTION('I');
ROW('I', 'ok_core', 'Datos centrales completos', 'OK/FALTA_DATO', 'CONTROL', 'calculado',
  fAll('IF(COUNT([price],[extra],[units],[cogs],[pack],[ship],[label],[wpct],[wfix],[wiva],[sfee],[othervar],[rrate],[rshare],[rresale],[rship])=16,"OK","FALTA_DATO")'),
  'Cuenta que las 16 entradas centrales sean números (0 cuenta; el texto FALTA_DATO no cuenta).');
ROW('I', 'ok_meta', 'Puente Meta completo', 'OK/FALTA_DATO', 'CONTROL', 'calculado', fAll('IF(COUNT([mratio])=1,"OK","FALTA_DATO")'), '');
ROW('I', 'ok_fixed', 'Costos fijos completos', 'OK/FALTA_DATO', 'CONTROL', 'calculado', fAll('IF(COUNT([plan],[fx],[apps],[otherfixed],[orders_m])=5,"OK","FALTA_DATO")'), '');
ROW('I', 'ok_target', 'Utilidad objetivo definida', 'OK/FALTA_DATO', 'CONTROL', 'calculado', fAll('IF(COUNT([target_profit])=1,"OK","FALTA_DATO")'), '');
ROW('I', 'ok_pub', 'Datos de las líneas parciales completos (precio, 2% Shopify, tarifa pública Wompi, envío de ilustración)', 'OK/FALTA_DATO', 'CONTROL', 'calculado',
  fAll('IF(COUNT([price],[sfee],[wpct_pub],[wfix_pub],[wiva_pub],[pub_s])=6,"OK","FALTA_DATO")'), 'Las líneas de los bloques L y M solo exigen datos verificados + parámetros de ilustración; hoy están completos.');

// ---------------------------------------------------------------- J. CÁLCULOS (core, igual que la plantilla)
SECTION('J');
const OKC = '[ok_core]<>"OK"';
const OKCF = 'OR([ok_core]<>"OK",[ok_fixed]<>"OK")';
const core = (id, concepto, unidad, expr, nota, guard = OKC) =>
  ROW('J', id, concepto, unidad, 'FORMULA', 'calculado', fAll(`IF(${guard},"FALTA_DATO",${expr})`), nota);
core('A_prod', 'Valor de producto cobrado por pedido', 'COP/pedido', '[price]*[units]*(1-[extra])', 'Cálculo: precio x unidades x (1 - descuento adicional)');
core('C_total', 'Cobro total por pedido (≈ AOV esperado, sin IVA)', 'COP/pedido', '[A_prod]+[ship]', 'Cálculo: producto + envío cobrado. Base del cargo de pasarela (Shopify y Wompi cobran sobre el total incluido el envío). Comparar con el AOV real de Shopify.');
core('cogs_order', 'Costo de producto por pedido', 'COP/pedido', '[cogs]*[units]', 'Cálculo: costo unitario x unidades');
core('pay_fee', 'Comisión Wompi por pedido (con IVA de la comisión)', 'COP/pedido', '([C_total]*[wpct]+[wfix])*(1+[wiva])', 'Cálculo: (cobro total x % + fijo) x (1 + IVA de la comisión). Usa el contrato REAL (wpct/wfix/wiva), no el escenario público.');
core('shop_fee', 'Cargo Shopify por pasarela de terceros por pedido', 'COP/pedido', '[C_total]*[sfee]', 'Cálculo: cobro total x 2% (o el % ingresado)');
core('refunds_exp', 'Reembolsos esperados por pedido', 'COP/pedido', '[rrate]*[rshare]*[A_prod]', 'Cálculo: tasa de devolución x % reembolsado x producto cobrado');
core('recov_exp', 'Costo de producto recuperado por reventa (esperado)', 'COP/pedido', '[rrate]*[rresale]*[cogs_order]', 'Cálculo: tasa de devolución x % revendible x costo de producto del pedido');
core('retlog_exp', 'Logística de devoluciones esperada por pedido', 'COP/pedido', '[rrate]*[rship]', 'Cálculo: tasa de devolución x costo por caso');
core('contrib', 'Contribución por pedido ANTES de publicidad', 'COP/pedido', '[C_total]-[cogs_order]-[pack]-[label]-[pay_fee]-[shop_fee]-[othervar]-[refunds_exp]+[recov_exp]-[retlog_exp]', 'Cálculo: cobro total - producto - empaque - guía - comisión Wompi - cargo Shopify - otros - reembolsos + recuperado - logística de devoluciones');
core('contrib_pct', 'Contribución como % del cobro total', 'decimal', '[contrib]/[C_total]', '');
core('be_cpa', 'CPA MÁXIMO de equilibrio (solo costos variables)', 'COP/pedido', '[contrib]', 'Si cada pedido atribuido a anuncios cuesta más que esto, la publicidad pierde dinero antes de costos fijos.');
core('be_roas', 'ROAS DE EQUILIBRIO (base Shopify: cobro total / gasto)', 'x', 'IF([contrib]<=0,"CONTRIBUCION<=0",[C_total]/[contrib])', 'Cálculo: cobro total / contribución. Comparar con ventas atribuidas de Shopify / gasto.');
ROW('J', 'be_roas_meta', 'ROAS DE EQUILIBRIO en la columna “ROAS de compras” de Meta', 'x', 'FORMULA', 'calculado',
  fAll('IF(OR([ok_core]<>"OK",[ok_meta]<>"OK"),"FALTA_DATO",IF([contrib]<=0,"CONTRIBUCION<=0",[mratio]*[C_total]/[contrib]))'), 'Cálculo: razón Meta/Shopify x ROAS de equilibrio base Shopify.');
core('fixed_order', 'Costos fijos por pedido', 'COP/pedido', 'IF([orders_m]<=0,"FALTA_DATO",([plan]*[fx]+[apps]+[otherfixed])/[orders_m])', 'Cálculo: (plan USD x tasa + apps + otros fijos) / pedidos mensuales. Usa el plan post-promoción (conservador).', 'OR([ok_core]<>"OK",[ok_fixed]<>"OK")');
core('contrib_full', 'Contribución por pedido tras costos fijos, antes de publicidad', 'COP/pedido', '[contrib]-[fixed_order]', '', OKCF);
core('be_cpa_full', 'CPA MÁXIMO de equilibrio (costo completo)', 'COP/pedido', '[contrib_full]', 'Más exigente que be_cpa: incluye la parte de costos fijos.', OKCF);
core('be_roas_full', 'ROAS / MER DE EQUILIBRIO (costo completo)', 'x', 'IF([contrib_full]<=0,"CONTRIBUCION<=0",[C_total]/[contrib_full])', 'Sirve también como MER de equilibrio si el pedido orgánico se parece al pagado.', OKCF);
const OKT = 'OR([ok_core]<>"OK",[ok_fixed]<>"OK",[ok_target]<>"OK")';
core('target_cpa', 'CPA MÁXIMO para alcanzar la utilidad objetivo', 'COP/pedido', '[contrib_full]-[target_profit]', 'Cálculo: contribución tras fijos - utilidad objetivo', OKT);
core('target_roas', 'ROAS OBJETIVO (base Shopify)', 'x', 'IF([target_cpa]<=0,"OBJETIVO_INALCANZABLE",[C_total]/[target_cpa])', 'Cálculo: cobro total / CPA objetivo', OKT);

// ---------------------------------------------------------------- K. PARÁMETROS DEL TABLERO
SECTION('K');
const kparams = [
  ['p_min_purchases', 'MIN_COMPRAS_DECISION: compras mínimas en la ventana antes de decidir pausar/escalar', 'compras', 'Debajo de esto la decisión es “seguir probando”.'],
  ['p_min_spend', 'MIN_GASTO_DECISION: gasto mínimo por campaña/anuncio antes de juzgarlo', 'COP', ''],
  ['p_weeks_pause', 'SEMANAS_PARA_PAUSAR: semanas seguidas bajo equilibrio para pausar', 'semanas', ''],
  ['p_scale_step', 'PASO_ESCALA: aumento máximo de presupuesto por paso', 'decimal', ''],
  ['p_scale_wait_days', 'DIAS_ENTRE_ESCALAS: días de espera entre aumentos', 'días', ''],
  ['p_max_refund_rate', 'MAX_TASA_REEMBOLSO: tasa de reembolso máxima tolerada', 'decimal', ''],
  ['p_min_utm', 'MIN_COBERTURA_UTM: % mínimo de sesiones de anuncios con UTM', 'decimal', 'Puerta B4 del plan.'],
  ['p_days_recon_ok', 'DIAS_CONCILIACION_OK: días seguidos de conciliación sin diferencias sin explicar', 'días', 'Puerta B1 del plan (sugerencia: 7).'],
  ['p_tol_recon', 'TOL_RECONCILIACION: diferencia tolerada Shopify vs Meta (fijar tras 20 pedidos)', 'decimal', 'Hasta entonces se investiga toda diferencia.'],
  ['p_test_budget', 'PRESUPUESTO_PRUEBA_DIARIO: gasto diario de las primeras 72 h', 'COP/día', 'Lo decide la dueña.'],
  ['p_bench_etapa', 'BENCH_ETAPA: referencia propia de tasa por etapa del embudo (se fija con 2-4 semanas de datos propios)', 'decimal por etapa', 'Mientras esté FALTA_DATO, el tablero compara contra la semana anterior.'],
];
for (const [id, c, u, n] of kparams) ROW('K', id, c, u, 'PARAMETRO_DECISION', 'Dueña (con asistencia)', { G: FD }, n);

// ---------------------------------------------------------------- L. PARCIALES
SECTION('L');
const OKP = '[ok_pub]<>"OK"';
const part = (id, concepto, unidad, expr, nota, tipo = 'FORMULA_PARCIAL') =>
  ROW('L', id, concepto, unidad, tipo, 'calculado', fAll(`IF(${OKP},"FALTA_DATO",${expr})`), nota);
ROW('L', 'pub_s', 'Envío cobrado usado en las líneas parciales (parámetro de ilustración; 0 = sin envío)', 'COP/pedido', 'PARAMETRO_ILUSTRATIVO', 'Parámetro (no es dato)',
  { G: 0, ...inh(), L: 0 }, '0 por defecto: las comisiones se calculan solo sobre el valor del producto. Cada COP de envío cobrado agrega 2% (Shopify) + 2,65% x 1,19 (Wompi público) = 5,15% de comisión adicional sobre ese envío. Probar con ship_z1-5.');
ROW('L', 'net_builtin', '(1) Precio neto tras el descuento incorporado del 20% (por unidad, sin descuentos adicionales)', 'COP/unidad', 'FORMULA_PARCIAL', 'calculado',
  fAll('IF(ISNUMBER([price]),[price],"FALTA_DATO")'), '[V] = precio vigente: el 20% ya está dentro del precio (precio = 80% del tachado). No incluye códigos/promos adicionales (extra).');
ROW('L', 'net_extra', '(1b) Precio neto tras descuento incorporado Y descuento adicional promedio', 'COP/unidad', 'FORMULA', 'calculado',
  fAll('IF(AND(ISNUMBER([price]),ISNUMBER([extra])),[price]*(1-[extra]),"FALTA_DATO")'), 'FALTA_DATO hasta que la dueña defina el descuento adicional promedio (extra).');
part('pp_base', 'Base de cobro del pedido de 1 unidad (precio neto + envío de ilustración)', 'COP/pedido', '[net_builtin]+[pub_s]', 'Base sobre la que Shopify (2%) y Wompi (%) cobran: producto + envío cobrado; impuestos = 0 (cust_iva).');
part('pp_shop', '(2) Cargo Shopify por pasarela de terceros (2%)', 'COP/pedido', '[pp_base]*[sfee]', '[V] 2% x base. Sin recuperación en reembolsos (conservador).');
part('pp_wcomm', 'Comisión Wompi escenario PÚBLICO sin IVA (% + fijo)', 'COP/pedido', '[pp_base]*[wpct_pub]+[wfix_pub]', '[V público] 2,65% x base + $700. ESCENARIO, no el contrato de la dueña.');
part('pp_wiva', 'IVA 19% sobre la comisión Wompi (costo del proveedor)', 'COP/pedido', '[pp_wcomm]*[wiva_pub]', '[V] 19% x comisión. Costo no descontable para una persona NO RESPONSABLE DE IVA [NV: contador].');
part('pp_wtot', '(3) Comisión Wompi escenario PÚBLICO incluido el IVA de la comisión', 'COP/pedido', '[pp_wcomm]+[pp_wiva]', 'Cálculo: (base x 2,65% + 700) x 1,19.');
part('pp_fees', 'Comisiones totales Shopify + Wompi (escenario público)', 'COP/pedido', '[pp_shop]+[pp_wtot]', '');
part('pp_fees_pct', 'Comisiones totales como % de la base de cobro', 'decimal', '[pp_fees]/[pp_base]', 'Cae al subir el precio porque los $700 fijos pesan menos; con envío cobrado sube hacia 5,15%.');
part('pp_contrib_pre', '(4) Contribución ANTES de costo de producto y de subsidio de envío = precio neto - comisiones', 'COP/pedido', '[net_builtin]-[pp_fees]', 'Ingreso de producto menos TODAS las comisiones del cobro (incluidas las del envío cobrado). El envío cobrado y la guía (subsidio) se netean aparte. NO es utilidad: faltan producto, empaque, guía, devoluciones, otros.');
part('pp_contrib_pre_pct', 'Contribución antes de producto y envío como % del precio neto', 'decimal', '[pp_contrib_pre]/[net_builtin]', '');
part('pp_cpa_ceiling', 'TECHO matemático del CPA de equilibrio (ignora TODOS los costos desconocidos)', 'COP/pedido', '[pp_contrib_pre]', 'NO es un umbral de decisión: el CPA de equilibrio real = este número - producto - empaque - subsidio de envío - devoluciones - otros, es decir MENOR. Si el CPA real supera este techo se pierde dinero seguro; si no lo supera, no se sabe.');
part('pp_roas_floor', 'PISO matemático del ROAS de equilibrio (ignora TODOS los costos desconocidos)', 'x', 'IF([pp_contrib_pre]<=0,"CONTRIBUCION<=0",[pp_base]/[pp_contrib_pre])', 'NO es un umbral: aun con producto gratis el ROAS (ingreso/gasto) debe ser al menos esto; el real es MAYOR. Un ROAS sobre este piso NO demuestra rentabilidad.');
part('pp_ret_cash', 'INFORMATIVO efectivo retenido por Wompi en un pago con tarjeta (retefuente 1,5% + ICA 0,2%; NO es costo)', 'COP/pedido', '[pp_base]*([ret_fuente]+[ret_ica])', 'Solo tarjeta y modelo agregador; base = valor de la venta antes de impuestos (producto + envío) [NV]. El reteIVA 15% no se calcula (base ambigua). Reduce el efectivo recibido; el contador define si es crédito de impuestos.');
part('pp_ret_comm', 'INFORMATIVO retención del 11% sobre la comisión de Wompi del pedido (NO es costo)', 'COP/pedido', '[pp_wcomm]*[ret_comm]', 'Se retiene de la factura mensual de comisiones (base: comisión antes de IVA); aplica según el tipo de persona [NV]. Efecto de caja, no de costo.', 'INFORMATIVO');
ROW('L', 'cpa_s1', 'CPA de muestra 1 (parámetro de ilustración)', 'COP/pedido', 'PARAMETRO_ILUSTRATIVO', 'Parámetro (no es dato)', { G: 10000, ...inh(), L: 10000 }, 'Valores de muestra pedidos por la dueña/ChatGPT para ver el efecto; NO son metas.');
ROW('L', 'cpa_s2', 'CPA de muestra 2 (parámetro de ilustración)', 'COP/pedido', 'PARAMETRO_ILUSTRATIVO', 'Parámetro (no es dato)', { G: 20000, ...inh(), L: 20000 }, '');
ROW('L', 'cpa_s3', 'CPA de muestra 3 (parámetro de ilustración)', 'COP/pedido', 'PARAMETRO_ILUSTRATIVO', 'Parámetro (no es dato)', { G: 30000, ...inh(), L: 30000 }, '');
ROW('L', 'cpa_s4', 'CPA de muestra 4 (parámetro de ilustración)', 'COP/pedido', 'PARAMETRO_ILUSTRATIVO', 'Parámetro (no es dato)', { G: 40000, ...inh(), L: 40000 }, '');
for (let k = 1; k <= 4; k++) {
  ROW('L', 'after_ads_' + k, `Contribución por pedido tras publicidad con el CPA de muestra ${k} (solo cuando hay datos completos)`, 'COP/pedido', 'FORMULA', 'calculado',
    fAll(`IF(${OKC},"FALTA_DATO",[contrib]-[cpa_s${k}])`), `Cálculo: contrib - cpa_s${k}. Muestra FALTA_DATO hasta que ok_core = OK; no hay versión parcial porque faltan producto, guía y devoluciones. Negativo = ese CPA pierde dinero.`);
}
for (let k = 1; k <= 4; k++) {
  part('roas_imp_' + k, `INFORMATIVO ROAS implícito con el CPA de muestra ${k} (ingreso de la base / CPA); NO indica rentabilidad`, 'x', `[pp_base]/[cpa_s${k}]`, 'Solo traduce CPA a ROAS para comparar con el equilibrio; sin costos completos no se puede decir si es rentable.', 'INFORMATIVO');
}

// ---------------------------------------------------------------- M. SENSIBILIDAD
SECTION('M');
const roasX = [2, 3, 4, 5];
roasX.forEach((x, i) => ROW('M', 'roas_x' + (i + 1), `ROAS de ilustración ${i + 1} (base Shopify: cobro / gasto)`, 'x', 'PARAMETRO_ILUSTRATIVO', 'Parámetro (no es dato)', { G: x, ...inh(), L: x }, 'Valor de muestra; NO es una meta ni un umbral. Editable.'));
roasX.forEach((x, i) => {
  const k = i + 1;
  part('sens_' + k, `Presupuesto MÁXIMO por pedido (1 unidad) para producto + empaque + guía neta + devoluciones + otros que deja contribución = 0 a ROAS de ilustración ${k}`, 'COP/pedido',
    `[pp_contrib_pre]+[pub_s]-[pp_base]/[roas_x${k}]`, 'ILUSTRATIVO: = precio neto - comisiones (Shopify 2% + Wompi público con IVA) + envío cobrado - (base / ROAS). Si el costo REAL conjunto (producto + empaque + subsidio + devoluciones + otros) es mayor, ese ROAS pierde dinero; si es menor, no se concluye nada sin los demás datos. Con pub_s = 0 es el costo de producto máximo si empaque, envío neto, devoluciones y otros fueran 0 (cota superior).', 'ILUSTRATIVO_NO_UMBRAL');
});
roasX.forEach((x, i) => {
  const k = i + 1;
  ROW('M', 'sens_pct_' + k, `Presupuesto del ROAS de ilustración ${k} como % del precio neto`, 'decimal', 'ILUSTRATIVO_NO_UMBRAL', 'calculado',
    fAll(`IF(ISNUMBER([sens_${k}]),[sens_${k}]/[net_builtin],"FALTA_DATO")`), '');
});

// ================================================================ materialize
let rowNo = 2; // header is row 1
const rowOf = {};
for (const it of items) {
  it.rowNo = rowNo++;
  if (it.kind === 'row') {
    if (rowOf[it.id]) throw new Error('duplicate id ' + it.id);
    rowOf[it.id] = it.rowNo;
  }
}
function resolve(tpl, col, selfRow) {
  return '=' + tpl.replace(/\[(\$?)([A-Za-z0-9_]*)\]/g, (m, abs, id) => {
    if (id === '') return '$G' + selfRow; // [$]
    const r = rowOf[id];
    if (!r) throw new Error('unknown id in formula: ' + id + ' :: ' + tpl);
    return (abs ? '$G' : col) + r;
  });
}
// ranges like H[inv_units]:K[inv_units]  -> handled: 'H[id]' means literal col H + row. Resolve separately.
function resolveFull(tpl, col, selfRow) {
  // explicit-column tokens first: X[id] where X is a column letter directly before '['
  let t = tpl.replace(/(\$?[A-Z])\[([A-Za-z0-9_]+)\]/g, (m, c, id) => {
    const r = rowOf[id];
    if (!r) throw new Error('unknown id in formula: ' + id);
    return c + r;
  });
  return resolve(t, col, selfRow);
}
const out = [HEADER];
for (const it of items) {
  if (it.kind === 'leeme') {
    out.push(['LEEME', '', it.text, '', '', '', '', '', '', '', '', '', '']);
  } else if (it.kind === 'section') {
    out.push([it.name, '', '', '', '', '', '', '', '', '', '', '', '']);
  } else {
    const cells = COLS.map((c) => {
      const v = it.cells[c];
      if (v === undefined) return '';
      if (typeof v === 'object' && v.f) return resolveFull(v.f, c, it.rowNo);
      return v;
    });
    out.push([it.sec, it.id, it.concepto, it.unidad, it.tipo, it.quien, ...cells, it.nota || '']);
  }
}
const esc = (v) => {
  const s = typeof v === 'number' ? String(v) : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const csv = '﻿' + out.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n';
const outFile = path.join(__dirname, 'unit-economics-filled.csv');
fs.writeFileSync(outFile, csv, 'utf8');
fs.writeFileSync(path.join(__dirname, 'row-map.json'), JSON.stringify(rowOf, null, 1));
console.log('wrote', outFile, 'rows (incl. header):', out.length, 'ids:', Object.keys(rowOf).length);
