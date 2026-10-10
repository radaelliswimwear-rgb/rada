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

## Procedimiento seguro (una cancelación a la vez, con autorización expresa)
1. **Vercel (prioridad, antes del 17-oct):** Vercel → Settings → Billing → "Downgrade" a Hobby. No borrar proyectos, variables, dominios ni el repo. Verificar después que "Upcoming Invoice" quede en USD 0.
2. **Hostinger Hosting (sin urgencia, antes del 16-feb-2027):** hPanel → Facturación → Suscripciones → Single Web Hosting → apagar "Renovación automática". Antes, descargar respaldo del WordPress si hay algo que conservar. No tocar dominio ni correo.
3. **Resend / Cloudinary / GitHub:** verificar plan con sesión de Radaelli; si son Free, no hay cobro que evitar.
