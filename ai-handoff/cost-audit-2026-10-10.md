# Auditoría de gastos — infraestructura anterior de Radaelli Swimwear (2026-10-10)

Solo lectura. No se canceló, eliminó ni modificó nada. CeRa Tech Plus excluida (las sesiones de Chrome de Hostinger y GitHub abiertas al inicio eran de ceratechplus: no se tocaron).

## Evidencia técnica
- DNS público: NS `ns1/ns2.dns-parking.com` (Hostinger); `A radaelliswimwear.com = 23.227.38.65` (Shopify); `www CNAME shops.myshopify.com`; `MX mx1/mx2.hostinger.com`; SPF Hostinger; registros Resend (`resend._domainkey`, `send.`) y `_dmarc p=none`.
- HTML en vivo (home y /collections/oasis-natural): 0 referencias a cloudinary, vercel, neon, resend, hostinger, railway o render.
- Shopify: contacto de la tienda = radaelliswimwear@gmail.com; **remitente de notificaciones = info@radaelliswimwear.com (autenticado)** → las respuestas de clientas llegan al buzón de Hostinger.

## Tabla
| Servicio | Activo | Plan | Costo verificable | Próximo cobro | Función hoy | Dependencias | Clasificación |
|---|---|---|---|---|---|---|---|
| Vercel (team RADAELLI SWIMWEAR) | Sí | **Pro** | USD 20/mes (pagado 2026-09-17) | **2026-10-17, USD 20** | Proyectos `rada` y `rada-staging` de la web anterior; dominio agregado como "Third Party" pero el DNS ya apunta a Shopify | Ninguna (tienda, dominio y correo no dependen) | **CANCELAR** (bajar a Hobby antes del 17-oct) |
| Hostinger Single Web Hosting | Sí | Anual | Pagado USD 35,88 (2026-03-02); renovación USD 107,88 | 2027-02-16 (auto ON) | WordPress antiguo en radaelliswimwear.com, ya no se sirve | Ninguna detectada (DNS y correo son servicios aparte) | **CANCELAR** (apagar renovación; sin urgencia; antes confirmar que no hay nada que rescatar) |
| Hostinger Starter Business Email | Sí | Anual | Pagado USD 4,68 (2025-10-24); renovación USD 19,08 + impuestos | 2026-10-10/11 (auto ON) | Buzón info@radaelliswimwear.com | **Shopify lo usa como remitente** | **CONSERVAR** |
| Hostinger dominio .COM | Sí | Anual | USD 20,19 (2026-09-23) | 2027-09-23 (USD 19,99) | Dominio + DNS de la tienda | Shopify, correo, Meta (verificación) | **CONSERVAR** |
| Neon (org "Daniela's projects") | Sí | **Free** | USD 0 | — | 3 bases de staging/pruebas de la web anterior | Ninguna | **CONSERVAR** (sin costo; respaldo). Verificar si la base de producción vive en otra org |
| GitHub radaelliswimwear-rgb/rada | Sí | Probable Free (sin recibos en el correo) | USD 0 (no verificado en panel) | — | Código y respaldo de la web anterior | Ninguna | **CONSERVAR**; VERIFICAR plan con la sesión de Radaelli |
| Resend | Probable | Sin recibos en el correo | USD 0 (no verificado; requiere login) | — | Correos transaccionales de la web anterior | Ninguna (Shopify envía por su cuenta) | **VERIFICAR** |
| Cloudinary | Cuenta creada 2025-08-10 | Sin recibos | USD 0 (no verificado) | — | Imágenes/videos de la web anterior | Ninguna (la tienda ya no lo carga) | **VERIFICAR** (conservar como respaldo si es Free) |
| Railway / Render | No hay rastro de cuentas | — | — | — | Solo mencionados en documentación | — | Nada que hacer |
| Shopify | Sí | Plan actual | USD 1/mes hasta 2027-01-04; luego USD 25/mes + impuestos | Mensual | La tienda | — | **CONSERVAR** |

## Ahorro potencial verificable
- Vercel Pro: USD 240/año (USD 20/mes).
- Hostinger Single Web Hosting: USD 107,88/año (≈ USD 9/mes) desde 2027-02-16.
- **Total: ≈ USD 347,88/año (≈ USD 29/mes).**

## Otros hallazgos
- En la cuenta Hostinger de Radaelli hay un pedido ".COM Domain ceratechplus.com" con **Pago pendiente** (no cobrado). Es de CeRa Tech: no se tocó.
- Vercel avisa que el 23-oct reducirá la retención de despliegues a 30 días (informativo).

## Cancelación 1 — Vercel Pro → Hobby: HECHA (2026-10-10)
Autorización expresa de la dueña en el chat ("Autorizo bajar Vercel Pro de Radaelli Swimwear al plan Hobby gratuito...").
- Verificación previa: factura próxima = USD 20 solo por el mes Pro siguiente; consumo del periodo USD 5,95 cubierto por el crédito incluido (0 cargos on-demand); sin presupuesto excedido. Diálogo de Vercel: "RADAELLI SWIMWEAR will be downgraded to a free, Hobby plan. You will immediately lose access to Pro features and all payments will stop"; reembolso de USD 4,67 por los 7 días restantes. No menciona borrado de proyectos.
- Motivo de encuesta: "Switching to another provider: Shopify".
- Resultado: equipo en **Hobby**; ya no aparece "Upcoming Invoice" (no habrá cobro Pro el 17-oct); factura de septiembre marcada "Refunded" (reembolso prorrateado USD 4,67 a la tarjeta).
- Verificado después: proyectos `rada` (radaelliswimwear.com, repo radaelliswimwear-rgb/rada) y `rada-staging` siguen existiendo; no se tocaron repositorio, variables, dominio, Neon ni respaldos. Tienda en vivo: 200 servida por Shopify (home y /collections/oasis-natural).
- **Ahorro: USD 20/mes = USD 240/año**, más USD 4,67 de reembolso único.
- Siguiente (solo con nueva autorización): apagar renovación automática del Hostinger Single Web Hosting (USD 107,88/año, vence 2027-02-16). NO tocar correo, dominio ni nada de CeRa Tech Plus.

## Cancelación 2 — Hostinger Single Web Hosting: renovación automática DESACTIVADA (2026-10-10)
Autorización expresa de la dueña en el chat ("Autorizo revisar los respaldos del WordPress antiguo... y... desactivar la renovación automática del hosting web").
- Revisión previa (solo lectura): sitio WordPress radaelliswimwear.com creado 2026-03-02 en plan "Single" (vence 2027-03-02). Respaldos automáticos semanales (último 2026-10-06 18:27, próximo 2026-10-13; respaldo completo = archivos + base de datos, descargable desde Archivos → Copias de seguridad → Restaurar y descargar). Base MySQL `u257482305_kH4kX` de 90 MB (creada 2026-05-10).
- Dependencias: ninguna para Shopify. El DNS se gestiona en el **dominio** (Dominios → DNS, nameservers dns-parking): `A @` y `www` → Shopify, DKIM de Shopify, MX/SPF/DKIM de correo Hostinger, Resend, verificaciones Meta/Google. Solo el registro `A ftp → 82.29.191.214` apunta al servidor del hosting (sin uso). El correo info@ es la suscripción aparte "Starter Business Email" (1/1 buzón, Emails → plan @radaelliswimwear.com); el hosting no tiene buzones propios, por lo que el aviso de Hostinger "los buzones de email asociados no envían ni reciben" no aplica (se verificó antes de confirmar).
- Acción: Facturación → Suscripciones → Single Web Hosting → interruptor de renovación automática OFF → "Cancelar suscripción". Hostinger: "La renovación automática está desactivada". Tras recargar: Single Web Hosting = OFF, "Expira 2027-03-02". Starter Business Email (ON) y .COM Domain radaelliswimwear.com (ON, 2027-09-23) intactos. No se eliminaron archivos, bases de datos ni respaldos; nada de CeRa Tech tocado (el pedido pendiente ceratechplus.com sigue igual).
- Resultado: **no habrá cobro de USD 107,88 el 2027-02-16**. El sitio y sus respaldos siguen disponibles hasta 2027-03-02.
- **Pendiente para la dueña antes de 2027-03-02:** descargar el respaldo completo del WordPress (puede contener datos de la tienda anterior en la base de 90 MB) y guardarlo fuera de Hostinger.
- **Ahorro: USD 107,88/año.** Ahorro acumulado hoy (Vercel + hosting): **≈ USD 347,88/año**.

## Revisión Shopify Facturación + Envia (2026-10-10, solo lectura)
- Shopify plan **Basic**: USD 1/mes hasta 2027-01-04, luego USD 25/mes. Factura #600424243 (2026-10-06) total USD 0,00 (cargo de suscripción USD 1 cubierto por descuentos). Próxima factura: USD 0,03 (cargos por transacción del pedido de prueba del 7-oct), se cobra el día 25 o al llegar a USD 60; aviso de posibles USD 19 en descuentos. Créditos: 0,5 % de ventas como crédito de suscripción hasta 2027-04-01 o USD 3.500 (se aplican desde USD 1.000 en ventas).
- Shopify Pagos: "Se aplica un cargo de 2 % a los pagos procesados a través de proveedores externos" → 2 % de cada venta pagada con Wompi. PayPal inactivo.
- Apps instaladas: Envia Shipping and Fulfillment, Messaging, Search & Discovery, Shopify CLI Connector App. Ningún cargo de app en la tabla de cargos.
- Envia (navegador interno, sesión de la dueña, Empresa #784546 = la misma vinculada a Shopify): sin plan ni mensualidad visibles; modelo prepago por guía; saldo USD/COP 0; recargas 0 y pagado 0 (2026-07-10 a 2026-10-11); 0 envíos. Cotización de ejemplo (solo cotizar, sin generar guía) Barranquilla → Bogotá, caja 25×20×5 cm, 1 kg, valor declarado mínimo: TCC COP 14.570; Interrapidísimo COP 16.940; Coordinadora COP 17.300 (estimados; suben con el valor declarado real/seguro).
- Wompi: tarifa real no verificada en su panel (escenario público: 2,65 % + COP 700 + IVA).
- Gastos adicionales eliminables hoy: ninguno confirmado. Ahorro adicional: USD 0 (el ahorro logrado sigue en ≈ USD 347,88/año).

## Procedimiento seguro (una cancelación a la vez, con autorización expresa)
1. **Vercel (prioridad, antes del 17-oct):** Vercel → Settings → Billing → "Downgrade" a Hobby. No borrar proyectos, variables, dominios ni el repo. Verificar después que "Upcoming Invoice" quede en USD 0.
2. **Hostinger Hosting (sin urgencia, antes del 16-feb-2027):** hPanel → Facturación → Suscripciones → Single Web Hosting → apagar "Renovación automática". Antes, descargar respaldo del WordPress si hay algo que conservar. No tocar dominio ni correo.
3. **Resend / Cloudinary / GitHub:** verificar plan con sesión de Radaelli; si son Free, no hay cobro que evitar.
