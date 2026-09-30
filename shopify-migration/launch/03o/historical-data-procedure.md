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
| Pedidos históricos | **ARCHIVAR como consulta (CSV) y no cargarlos como pedidos** | Shopify puede crear pedidos históricos por API, pero dispara correos/automatizaciones si no se silencian, ensucia reportes de ventas e inventario y exige una app. Se conservan como archivo cifrado fuera del repositorio. **La dueña debe confirmar.** |
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
