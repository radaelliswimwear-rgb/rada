# 03O — Datos históricos: decisión y procedimiento (sin ejecutar)

**Decisión de la dueña (2026-09-30):** MIGRAR todo «como en la página anterior» (clientas, pedidos históricos, cupones, suscriptoras y blog).
**Estado:** decisión registrada; **nada migrado**. Condición de la fase: no se migran datos personales hasta tener a la vez «MIGRAR» explícito **y** una ruta de origen/exportación soportada y autorizada.

## Por qué no se ejecuta en 03O

1. El origen de clientas, pedidos, cupones y suscriptoras es la base de datos de la tienda anterior (producción). Por las reglas del proyecto, esta migración **no toca Producción, Staging, Neon ni Vercel**. Hace falta una **exportación autorizada por escrito** (de la dueña o de ChatGPT) entregada como archivos, sin acceso directo de Claude a la base.
2. No hay en el repositorio ningún archivo de datos de clientas (verificado en 03K: «no hay datos de clientas en el repositorio»).
3. La tienda de lanzamiento sigue siendo una Client Transfer Store, sin transacciones reales ni correos a clientas; importar datos personales conviene después de transferir y de fijar el plan.

## Recomendación por tipo (la dueña confirma solo lo de pedidos)

| Tipo | Recomendación | Cómo, cuando haya exportación |
|---|---|---|
| Clientas (nombre, correo, teléfono, direcciones) | MIGRAR | Importación CSV de clientas de Shopify (`customers`), después de transferir. Las contraseñas **no** se migran: cada clienta crea una nueva al entrar (la app anterior guardaba hashes propios). |
| Suscriptoras al boletín | MIGRAR solo con consentimiento registrado | CSV con `Accepts Marketing` = verdadero solo para quienes se suscribieron de forma voluntaria; el resto entra sin marketing. |
| Cupones | MIGRAR los vigentes | Crear descuentos por API (`discountCodeBasicCreate`) solo de los vigentes y técnicamente equivalentes (porcentaje/monto, vigencia, tope de usos). |
| Pedidos históricos | **MIGRAR COMO PEDIDOS REALES de Shopify** (decisión firme de la dueña, 2026-09-30, reiterada: no cambiar). El archivo de consulta queda **solo como respaldo**. | Ver «Pedidos históricos: método técnico y límites» abajo. |
| Blog/contenido | MIGRAR lo que use | Artículos por `articleCreate` desde el HTML existente; requiere inventario previo del contenido (no existe en el repositorio). |

## Reglas de privacidad

- Ningún dato personal va a GitHub ni al handoff: solo **conteos y hashes**.
- La exportación llega fuera del repositorio (carpeta local cifrada) y se borra tras verificar la importación.
- Se verifica por conteo: clientas importadas = filas válidas del archivo; suscriptoras con marketing = consentimientos registrados.

## Qué hará Claude cuando llegue la exportación (03P+)

1. Validar el archivo (columnas, duplicados, correos válidos) y contar filas, sin imprimir datos.
2. Importar clientas (CSV) y confirmar el conteo.
3. Crear cupones vigentes y contar.
4. Migrar artículos del blog y contar.
5. Dejar el resultado en el reporte solo con conteos.

**Clasificación:** POST-TRANSFER REQUIRED (con OWNER AUTH para autorizar la exportación). No bloquea la transferencia.

## Pedidos históricos: método técnico y límites (decisión de la dueña: MIGRAR como pedidos reales)

**Método correcto y seguro** (Admin GraphQL `orderCreate`, una orden por registro exportado, después de transferir y **antes** de publicar, con la tienda aún privada):

1. **Sin correos ni automatizaciones:** `sendReceipt: false`, `sendFulfillmentReceipt: false`; revisar que no haya flujos de Flow/apps que envíen mensajes al crear pedidos.
2. **Sin tocar el inventario actual:** `inventoryBehaviour: BYPASS` (las cantidades reales no se descuentan por ventas viejas).
3. **Fecha original:** `processedAt` con la fecha del pedido; estado financiero `PAID`/`REFUNDED` según el origen, con su transacción (`kind: SALE`, pasarela «manual», monto en COP).
4. **Clientas:** asociar cada pedido a la clienta importada por correo (se importan primero; PII solo en la tienda, nunca en GitHub).
5. **Líneas:** por SKU/variante existente; si un producto ya no existe, línea personalizada (título, SKU y precio originales).
6. **Envío, descuentos e impuestos:** `shippingLines`, `discountCode` y `taxLines` desde el origen en COP.
7. **Número original:** se guarda en una etiqueta (`hist-<número>`) y en `customAttributes` (el número de pedido de Shopify no se puede elegir).
8. **Verificación por conteo:** pedidos importados = filas válidas; suma de totales por mes = suma del origen. Sin imprimir datos personales.

**Límites que deben conocerse (se documentan, no cambian la decisión):**

- **Permisos:** `orderCreate` necesita el permiso `write_orders` y, para datos de clientas, **acceso a datos protegidos de clientas**; esto se autoriza una vez por OAuth en la tienda (queda en la lista de clics pendientes de la dueña).
- **Cuenta de la tienda:** solo en la tienda con su plan definitivo (los pedidos de una tienda de desarrollo o de transferencia cuentan y se numeran igual, pero conviene hacerlo tras el plan para no mezclar estados). La numeración real empieza en #1003; los pedidos históricos **consumirán números** (#1003 en adelante) antes que los nuevos.
- **Límites de velocidad:** la creación masiva de pedidos puede limitarse por minuto; se procesa por lotes con reintento.
- **Reportes:** los pedidos históricos aparecerán en reportes de ventas con su fecha original; puede etiquetarse `hist` para excluirlos.
- **Pedidos que no se puedan crear** (producto sin equivalente, datos incompletos, reembolsos parciales complejos): se crean como pedido simple con nota y etiqueta `hist-revisar`, o, si Shopify lo impide, se dejan **solo en el archivo de respaldo** y se reportan por conteo.
- **Origen:** sigue haciendo falta la **exportación autorizada** de la base del sitio anterior (Producción está fuera del alcance del proyecto).

**Estado:** método definido; nada ejecutado. Clasificación: POST-TRANSFER REQUIRED + OWNER AUTH (exportación y permiso `write_orders`/datos protegidos).
