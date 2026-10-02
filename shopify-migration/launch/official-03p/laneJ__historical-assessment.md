# Lane J — Datos históricos: evaluación (solo lectura, sin PII)

START 2026-10-02 08:03 (America/Bogota) · END ver final del archivo.
Fuentes: `prisma/schema.prisma` (solo esquema), `launch/03o/historical-data-procedure.md`, `03O-blocker-matrix.md` (D3), `03G-*`, `evidence/reference-docs/data-migration.md`, `lib/newsletter/*`, `components/checkout/shipping-address-form.tsx`, archivo 03O-result. Esta lane no llamó a Shopify, no tocó la base ni leyó datos: los scopes ya otorgados en la tienda oficial son `NOT_VERIFIED`.

## 1. Resumen ejecutivo

- **Nada de lo histórico está listo (0 READY).** Causa raíz única: no existe exportación autorizada de la base anterior (Neon/producción, fuera del alcance de Claude). No hay script de exportación ni función de exportar en el panel admin del sitio viejo.
- **No bloquea el lanzamiento** (03O: POST-TRANSFER REQUIRED + OWNER AUTH). Recomendación: lanzar sin históricos; importar después, en ventana tranquila.
- Conteos: **NOT_AVAILABLE** en toda la documentación (clientas, suscriptoras, cupones). Indicio indirecto: los números de pedido arrancan en 1000 y el más alto citado en código es #1058 (incluye pruebas y números quemados por intentos fallidos): orden de decenas, no miles.
- **Discrepancia a corregir:** `historical-data-procedure.md` registra decisión firme de la dueña (pedidos como PEDIDOS REALES de Shopify, no cambiar); `03O-blocker-matrix.md` (fila D3), 03O-result y `03m/owner-final-data-form.md` aún dicen "archivo de consulta / PENDING_OWNER". Prevalece el procedimiento; alinear esas filas.

## 2. Inventario del modelo anterior y mapeo a Shopify

| Dataset (modelo) | Campos clave (sin valores) | Objeto Shopify | Scopes | Estado |
|---|---|---|---|---|
| Clientas (`User`) | name, email (único), role, createdAt, emailVerifiedAt, passwordHash | `Customer` (`customerSet` por email, o CSV de Clientes) | read/write_customers; datos protegidos de cliente (nivel 2: nombre/correo/teléfono) `NOT_VERIFIED` para la app del CLI | BLOCKED |
| Direcciones (`Address`) | label, fullName, street, city, postalCode, province, country, phone, isDefault | Direcciones del Customer | ídem | BLOCKED |
| Pedidos (`Order`+`OrderItem`+`Payment`+`OrderStatusEvent`) | orderNumber, status, fulfillmentStatus, subtotal/shipping/tax/total, couponCode, discountValue, shippingAddress(JSON: fullName, email, phone, barrio...), shippingMethod, carrier/tracking/dispatchedAt, createdAt; ítems: name, size, qty, priceValue, sku, color, collection; pago: provider, status, amount, cardLast4 | `orderCreate` (processedAt, transactions manual, lineItems por SKU, shippingLines, taxLines, tags, customAttributes) | write_orders, read_orders (+read_all_orders para verificar tras 60 días), read_products, read_locations (fulfillment), write_customers; datos protegidos | BLOCKED |
| Cupones (`Coupon`) | code, type PERCENTAGE/FIXED, value, active, minSubtotal, maxUses, usedCount, expiresAt | `discountCodeBasicCreate` | read/write_discounts | BLOCKED (sin PII: el más fácil) |
| Suscriptoras (`NewsletterSubscriber`) | email, active, subscribedAt | Customer + `emailMarketingConsent` (`customerSet`/`customerEmailMarketingConsentUpdate`; CSV "Accepts Email Marketing") | write_customers | BLOCKED (consentimiento) |
| Blog (`BlogPost`) | slug, title, excerpt, content (Markdown), coverImage, tags, published, publishedAt, authorName | `blogCreate`/`articleCreate` | read/write_content | BLOCKED (decisión D15) |
| Favoritos (`Wishlist*`) | userId?, productId, createdAt | metafield `custom.wishlist` (app A5, no instalada) | write_customers | NOT_APPLICABLE (diferido; fuera de D3) |
| Reseñas | no existe modelo | — | — | NOT_APPLICABLE |
| Avísame cuando vuelva (`BackInStockRequest`) | productId, size, email, status | sin objeto nativo (E1 sin plataforma) | — | NOT_APPLICABLE |
| Campañas (`NewsletterCampaign`) | subject, body, status | ninguno | — | NOT_APPLICABLE (nunca se enviaron: "enviar" solo marcaba SENT) |
| Carritos, sesiones, tokens, AuthAttempt, tráfico interno, analytics, outboxes, logs, Settings, catálogo | — | — | — | NOT_APPLICABLE (efímero/operativo; catálogo ya migrado 98/98) |

**Hallazgos de modelo que afectan la importación**
1. Pedidos de invitada cuelgan de un `User` seudo-cuenta (`userId="guest"`): NO importarlo como clienta; la identidad sale de `shippingAddress.email`. Los pedidos más antiguos pueden no traer correo real (antes se usaba uno genérico): quedan sin clienta asociada (pedido con nota/tag `hist-sin-correo`) o solo en respaldo.
2. Tres estados solapados: `Order.status` (legado), `fulfillmentStatus` (vigente), `Payment.status` (PENDING/SUCCEEDED/FAILED/CANCELLED/REFUNDED). Importar solo pedidos con pago SUCCEEDED/REFUNDED; excluir PENDING/FAILED/CANCELLED sin cobro, pedidos de prueba (`marketingExclusionReason` = e2e_test/internal_traffic, p. ej. #1005) y los `flaggedForReviewAt` sin resolver.
3. Unidad de dinero ambigua: el esquema dice "centavos" pero `formatCOP` no divide. Verificar con un pedido conocido contra el precio del catálogo antes de mapear (si está x100, dividir).
4. `passwordHash` NO migra (scrypt / SHA-256 sin sal): primer ingreso por código de Shopify. No migrar tampoco `userAgentSnapshot`, `attributionSnapshot` ni snapshots de consentimiento de analytics (sin finalidad en Shopify; minimización).
5. Cuentas `ADMIN`/demo/prueba: excluir. Direcciones antiguas no tienen barrio (solo el pedido lo guarda).

## 3. Bloqueos exactos

1. **Origen/exportación (todos los datasets):** solo la dueña puede autorizar por escrito; la hace la dueña o ChatGPT con rol de solo lectura de Neon (idealmente sobre una rama/PITR, nunca escribiendo en producción) hacia carpeta cifrada fuera del repo. Claude nunca recibe credenciales ni ve la base. Retención de backups de Neon `NOT_VERIFIED`: conservar la base vieja hasta verificar.
2. **Scopes (OAuth, un clic de la dueña):** el listado de la sección 2; hoy solo consta documentado lo de customers de la app de favoritos y policies de 03L. `read_orders` solo ve 60 días: la verificación posterior pide `read_all_orders`. Datos protegidos: la dueña lo aprueba en la pantalla de permisos si aparece.
3. **Plan/tienda final:** 03O manda importar en la tienda con su plan definitivo.
4. **Límites de Shopify:** `orderCreate` con `sendReceipt:false`, `sendFulfillmentReceipt:false`, `inventoryBehaviour:BYPASS`, `processedAt` original, transacción manual en COP, fulfillment con `notifyCustomer:false`. El número de pedido NO se elige: los históricos consumen la numeración (irreversible: el contador no retrocede) y quedan etiquetados `hist-<n>` + customAttribute. Posible límite de ritmo de creación de pedidos (≈5/min en planes bajos, `NOT_VERIFIED`: lotes con reintento). No hay importación nativa de pedidos (apps de terceros = mandar PII a otro encargado: no recomendado). Revisar que ninguna app/Flow dispare correos y que las notificaciones al personal no inunden a la dueña (cambio de ajustes: pedir OK).
5. **Consentimiento (Ley 1581/2012, Decreto 1377/2013; no es asesoría legal):** `NewsletterSubscriber` guarda solo email/active/fecha: no hay texto de consentimiento, versión, IP ni origen. El formulario del home pide solo el correo (sin casilla ni texto de marketing visible en el código); la casilla del checkout sí es explícita y desmarcada ("Quiero recibir ofertas y novedades de Radaelli por correo"), pero el origen no se guardó, así que no se distingue. La política de privacidad aprobada **no menciona el boletín** (03G) y no hay mecanismo de baja en el sitio viejo (ningún código pone `active=false`: verificar si existe alguna fila inactiva). Regla: **no inventar consentimiento.** Compradoras sin fila activa = NOT_SUBSCRIBED; `active=false` = UNSUBSCRIBED; filas activas = SUBSCRIBED con `SINGLE_OPT_IN` y `consentUpdatedAt = subscribedAt` solo si la dueña/asesor confirman que esa evidencia basta; si no, importar como NOT_SUBSCRIBED + tag `legacy-newsletter` y pedir re-permiso cuando exista plataforma de correo (E1 no existe). Además: la política debe cubrir a Shopify como encargado/transmisión internacional y el uso de correo comercial. Solicitudes "Avísame" son de finalidad única: no son consentimiento de marketing.
6. **Blog:** el contenido no está en el repo; 3 posts + índice (lastmod 2026-07-15) que parecen de plantilla (lana, lino, abrigo; autor "Equipo LAGO"; fotos de Unsplash con licencia por revisar). Fuente alternativa sin base de datos: las 3 URL públicas, con OK de la dueña. Importar sin publicar hasta su revisión.

## 4. Idempotencia y deduplicación
- Clave de clienta: correo normalizado (trim+minúsculas); fusionar User + invitada + suscriptora; `customerSet(identifier:{email})` es upsert. El teléfono también es único en Shopify: conflictos a un informe por conteo.
- Pedidos: `sourceName=radaelli-legacy`, `sourceIdentifier=<Order.id cuid>`, tag `hist-<orderNumber>`; consulta previa a crear y libro-registro local (legacyId→shopifyId, fuera del repo, solo ids/hashes). No confiar en idempotencia de la API.
- Cupones: consulta por código antes de crear; `usageLimit = maxUses − usedCount`; solo activos y vigentes.
- Blog: handle = slug; consulta previa.
- Cada lote lleva `batchId` (tag `hist-batch-<id>`) para revertir.

## 5. Plan seguro (orden y fases)
**Fase 0 (ahora, sin datos):** lanzar sin históricos. Claude prepara, sin PII: especificación de columnas mínimas de exportación, validador/transformador local que solo imprime conteos, y herramienta idempotente con `--dry-run`.
**Fase 1 (pre-importación):** decisiones D3 por dataset, exportación autorizada, OAuth, política de privacidad actualizada, notificaciones revisadas.
**Dry-run:** (a) fixtures SINTÉTICOS en la tienda QA (radaelli-swimwear-dev) o en la oficial con tag y borrado: verifican que no salen correos, el inventario no cambia, `processedAt` se respeta, totales cuadran, tags correctas; (b) validación offline del archivo real: filas válidas, duplicados, correos inválidos, unidad de dinero, suma de totales por mes = origen; (c) piloto de 3 pedidos reales con OK de la dueña antes del lote completo.
**Orden de importación:** 1) cupones y blog (sin PII; se puede hacer ya con lista manual de la dueña); 2) clientas + direcciones + consentimiento; 3) pedidos al final y en orden cronológico ascendente (así los números nuevos de Shopify siguen el orden original). Si la importación ocurre tras abrir ventas, los históricos recibirán números posteriores a los pedidos reales: la dueña lo acepta o no (única decisión de numeración).
**Verificación:** conteos (clientas = filas válidas; SUBSCRIBED = consentimientos confirmados; pedidos y suma mensual = origen), sin imprimir datos personales; reporte solo con conteos y hashes.
**Reversión:** clientas sin pedidos: `customerDelete` por tag de lote; consentimiento: revertir a NOT_SUBSCRIBED; cupones/artículos: borrar/despublicar. Pedidos: cancelar/archivar y `orderDelete` solo donde Shopify lo permita (`NOT_VERIFIED`); **irreversibles:** numeración consumida, ruido en reportes (filtrable por tag `hist`), cualquier correo enviado. Por eso piloto + dry-run obligatorios. Al verificar: borrar la exportación cifrada (03O).

## 6. Checklist para Daniela (nunca secretos por chat)
1. Autorizar por escrito la exportación, dataset por dataset (clientas+direcciones, pedidos, cupones, suscriptoras, blog) y confirmar que quiere los pedidos como pedidos reales (decisión firme ya registrada).
2. Entregar los archivos solo por la ruta autorizada (carpeta cifrada fuera del repo); por chat solo conteos y hash. Credenciales de Neon: nunca en chat.
3. Indicar exclusiones: pedidos de prueba (p. ej. #1005), cuentas admin/demo, la cuenta "guest".
4. Decidir el consentimiento: ¿las suscriptoras activas se importan como SUBSCRIBED (con asesoría) o como NOT_SUBSCRIBED + re-permiso?; aprobar actualización de la política de privacidad (boletín, Shopify como encargado).
5. Aceptar la numeración: los históricos consumen números y, si se importan tras abrir ventas, quedan después de los pedidos reales.
6. Un clic de OAuth con los scopes de la sección 2 (más datos protegidos si se pide) en la tienda con plan definitivo.
7. OK para silenciar temporalmente notificaciones de pedido al personal durante el lote.
8. Blog: decidir D15 (migrar/omitir), revisar los 3 textos y licencias de imágenes.
9. Decidir la comunicación a clientas (D-CT11/D-CT12): primer ingreso por código, sin contraseñas.
10. Conservar la base vieja (Neon) intacta hasta verificar.

END_TIME: 2026-10-02T08:08:51-05:00
