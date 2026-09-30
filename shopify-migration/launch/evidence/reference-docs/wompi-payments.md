# Checkout y Wompi — análisis crítico

Parte de la [auditoría de viabilidad de migración a Shopify](../shopify-migration-feasibility-audit.md). Investigado el 2026-09-26 contra fuentes oficiales de Shopify y Wompi, con una segunda pasada de verificación independiente sobre cada afirmación de alto impacto. Todo lo marcado **HECHO OFICIAL** fue confirmado por al menos dos lecturas independientes de la fuente citada.

---

## 5. Qué pasa exactamente con nuestro checkout custom

**No se puede asumir que el checkout actual es migrable.** Esto se confirma, no se supone:

| Paso | HOY (custom) | EN SHOPIFY |
|---|---|---|
| Checkout UI | Página propia de un solo paso, dos métodos de pago (Wompi hosted + "Continuar por WhatsApp") | Checkout hosteado de Shopify. Personalización profunda (Information/Shipping/Payment steps) es **exclusiva de Shopify Plus** — **HECHO OFICIAL**, confirmado literal en la documentación de Shopify ("available only to stores on a Shopify Plus plan"). La página de Gracias/Estado del pedido SÍ es personalizable en cualquier plan pago. |
| Inicio de pago | Reserva stock y precio server-side en el mismo instante en que se crea el intento de pago (antes de que exista ningún cobro) | Shopify reserva inventario en su propio checkout, con su propia ventana de tiempo — no hay forma de replicar exactamente "reservar en el instante del intent" con la semántica actual |
| Confirmación de pago | Webhook HMAC + verificación cruzada contra la API real de Wompi + retorno del navegador + cron de recuperación — 3 caminos convergiendo en una sola función idempotente | La app "Wompi Pagos" maneja esto internamente, **sin visibilidad ni control desde nuestro lado** — es una caja cerrada |
| Creación del pedido | Solo se crea con `Payment.amount`/`reservedItems` ya verificados, nunca con datos del cliente | Shopify crea la orden según su propio flujo de checkout |
| Reserva de stock | Se libera automáticamente si el pago falla/expira, con re-reclamo si una aprobación llega tarde | Sin equivalente confirmado — ver más abajo, el bug documentado de "pedido abandonado" |
| Recuperación de pagos | Cron propio cada ejecución, re-consulta Wompi, nunca deja un pago huérfano sin resolver | **No existe automatización nativa equivalente** — ver más abajo |
| Emails | Outbox propio con reintentos e idempotencia hacia Resend | Notifications nativas de Shopify (ver seo-analytics.md) — sin visibilidad de reintentos |
| Webhooks | Verificación HMAC propia + rechazo de eventos viejos/duplicados + re-verificación contra la API | Los maneja la app de Wompi internamente — código cerrado desde la perspectiva del comerciante |

**Conclusión de la sección 5: NO, el checkout custom no se puede copiar.** Lo máximo posible es aceptar pagos con Wompi DENTRO del checkout de Shopify vía la app oficial, perdiendo el control fino sobre idempotencia, timing de reserva y recuperación automática que hoy existe.

---

## 6. Wompi + Shopify — investigación especial

### A) ¿Existe integración oficial/directa de Wompi con Shopify?

**HECHO OFICIAL.** Sí. Wompi Co (parte del grupo Bancolombia) publica una app llamada **"Wompi Pagos"** en la Shopify App Store:
- Listado: https://apps.shopify.com/wompi-pagos — desarrollador "Wompi Co", Medellín. Gratis de instalar (aplican comisiones de transacción). **Lanzada el 7 de septiembre de 2022. Cero reseñas, calificación 0.0, solo en español** (verificado en vivo hoy).
- Documentación oficial de Wompi: https://docs.wompi.co/en/docs/colombia/wompi-shopify-plugin/ — la describe explícitamente como "la integración oficial de Wompi para Shopify", con flujo de redirección (hosted) y una opción más nueva de "tarjetas on-site" (embebida), más un webhook ("Events URL") ya configurado hacia `wompi-event-shopify.conexa.ai`.
- **Curiosidad sin resolver (REQUIERE CONFIRMACIÓN)**: la página de partners de Wompi en Shopify (`apps.shopify.com/partners/wompi-co1`) muestra "0 apps", aunque el listado directo funciona — confirmar la instalabilidad real directamente desde un admin de Shopify antes de asumir nada.

### B) ¿Puede usarse Wompi DENTRO del checkout de Shopify, o siempre saca al cliente del sitio?

**HECHO OFICIAL.** El flujo documentado de Wompi es un **modelo de redirección**: el cliente confirma la compra, es llevado a la pasarela de Wompi, y vuelve automáticamente a la tienda. Existe una opción más nueva de tarjetas embebidas, pero la redirección sigue siendo el flujo por defecto documentado.

La personalización profunda del checkout (Information/Shipping/Payment) es exclusiva de Plus, pero esto **no aplica** a instalar un método de pago — eso funciona en cualquier plan pago.

### C) ¿Requiere una app, o desarrollo custom?

**HECHO OFICIAL.** Existe una app lista para usar (Wompi Pagos) — no hace falta construir nada desde cero. Construir una integración de pagos propia requeriría el estatus de **"Payments Partner"** de Shopify (acuerdo formal de reparto de ingresos con Shopify) — un programa orientado a empresas de pagos, no a comercios individuales. **No se encontraron** apps de terceros que envuelvan Wompi específicamente.

### D) Restricciones específicas de Colombia

**HECHO OFICIAL — Shopify Payments (el procesador propio de Shopify) NO está disponible en Colombia.** Lista oficial de países soportados: https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries — 39 países, Colombia no está. Colombia tampoco está en la lista de países bloqueados (Cuba, Irán, Corea del Norte, Siria, partes de Ucrania), así que puede operar una tienda Shopify normal.

**Consecuencia**: Radaelli está **estructuralmente forzada** a un proveedor externo (Wompi u otro) en cualquier plan — no hay forma de evitar esto ni de evitar el recargo de Shopify que viene con ello (ver G).

### E) ¿Se puede mantener el modelo actual de Wompi Hosted Checkout, y qué se pierde?

**Sí, estructuralmente** — vía la app Wompi Pagos (que ya implementa el patrón de redirección) o un método de pago manual custom.

**HALLAZGO DOCUMENTADO, el más importante de todo este análisis**: un hilo real de la comunidad de Shopify (en español, de un comercio usando Wompi+Shopify) documenta **exactamente** el problema que el cron de recuperación de Radaelli existe para resolver: *"El pedido queda como abandonado cuando el cliente paga [con] Wompi"* — pedidos que aparecen como carritos abandonados **aunque el cliente sí pagó**, porque el cliente no siempre vuelve a la tienda después de pagar en Wompi, y/o porque el webhook llega tarde. Fuente: https://community.shopify.com/c/shopify-payments/el-pedido-queda-como-abandonado-cuando-el-cliente-paga-wompi/td-p/1811306

La respuesta oficial de Shopify en ese hilo es reveladora: agregar un mensaje pidiéndole al cliente que vuelva a la tienda, y — de forma manual — recrear el pedido abandonado como borrador y marcarlo pagado a mano. **No existe ningún mecanismo de reconciliación automática ofrecido por Shopify ni por la app de Wompi** para esta clase de falla.

**Qué se perdería** (combinación de hecho documentado e inferencia razonada):
- Garantías de idempotencia — quedan a criterio de una app de terceros de código cerrado, sin reseñas públicas.
- El timing de reserva de stock "antes del cobro" no se replica automáticamente — se reintroduce exactamente la condición de carrera que el hilo de la comunidad documenta como un problema real y sin resolver.
- El cron de recuperación automática no tiene equivalente — la solución oficial de Shopify es reconciliación **manual**. Automatizarlo de verdad requeriría un middleware/app propio escuchando el webhook de Wompi y llamando a la Admin API de Shopify — es decir, reconstruir una porción del sistema actual encima de Shopify, no eliminarlo.

### F) Qué se pierde vs. qué se gana

**Se gana** (inferencia razonada sobre hechos generales de la plataforma): admin maduro, ecosistema de apps (marketing/SEO/reseñas/suscripciones), infraestructura PCI del lado de Shopify para los rieles de tarjeta que sí pasan por Shopify, flujos nativos de carrito abandonado, analíticas, y menor carga de mantenimiento general — **excepto**, específicamente, en la reconciliación de pagos.

**Se pierde**: control total sobre la lógica de checkout/reconciliación (hecho documentado arriba); personalización profunda del paso de pago fuera de Plus; un recargo permanente de Shopify sobre cada transacción (ver G) que hoy no existe; y se gana dependencia de una app con **cero reseñas públicas** y un bug ya documentado por la comunidad — riesgo de soporte/fiabilidad real, no solo teórico.

### G) ¿Cobra Shopify una comisión extra por usar un proveedor externo?

**HECHO OFICIAL.** Sí, por plan: **Basic 2% · Grow 1% · Advanced 0.6% · Plus 0.2%** (fuente: shopify.com/pricing, confirmado carácter por carácter en el HTML crudo de la página). Como Shopify Payments no existe en Colombia, **esta comisión aplica siempre**, encima de lo que Wompi ya cobra por su cuenta.

**REQUIERE CONFIRMACIÓN**: si un método de pago 100% manual (sin ninguna app de procesamiento) escapa a esta comisión cuando Shopify Payments ni siquiera está disponible en el país — la documentación de Shopify dice que los pagos manuales no pagan la comisión, pero un hilo de la comunidad (de un comercio en Sudáfrica, país donde Shopify Payments tampoco existe) reporta que sí le cobraron. **Esto debe confirmarse directamente con soporte de Shopify antes de asumir cualquier ahorro por esta vía.**

### H) Opciones colombianas comparables

| Pasarela | Estado | Tipo |
|---|---|---|
| **Wompi** | App oficial propia, 0 reseñas, 2022 | Redirección + tarjeta embebida (nueva) |
| **PayU Latam** | App oficial "v2", documenta Colombia explícitamente | Redirección |
| **Mercado Pago** | App existe ("Mercadopago Checkout") pero construida por un tercero (Nabeyond Ltd), **no por Mercado Pago** | Embebida |
| **ePayco** | App oficial confirmada en verificación (`apps.shopify.com/epayco`, 0 reseñas) — el reporte inicial no la había encontrado | — |
| **PSE** | No es una pasarela Shopify independiente — se accede a través de Wompi/PayU/Mercado Pago | — |

Ninguna opción colombiana tiene más reseñas/madurez pública que Wompi — es una limitación del mercado, no específica de Wompi.

---

## Resumen de tags de confianza

- **HECHO OFICIAL**: app oficial de Wompi (redirección + tarjeta embebida); Shopify Payments no disponible en Colombia; Colombia no está bloqueada como mercado; tabla de comisiones por proveedor externo (2/1/0.6/0.2%); necesidad de aprobación "Payments Partner" para builds propios; PayU Latam y ePayco tienen apps oficiales para Colombia.
- **LIMITACIÓN DOCUMENTADA**: bug real y documentado por la comunidad de Shopify de pedidos marcados como abandonados pese a un pago real con Wompi, sin arreglo automático ofrecido; personalización de checkout limitada a Plus.
- **INFERENCIA**: instalar un método de pago (a diferencia de personalizar el checkout) probablemente no requiere Plus; el control de idempotencia/timing de reserva se reduce materialmente frente al sistema actual.
- **REQUIERE CONFIRMACIÓN**: si la app de Wompi sigue siendo instalable pese a la discrepancia en la página de partners; si un método manual escapa realmente a la comisión en un país sin Shopify Payments; fiabilidad real de la app de Wompi en producción a la escala de Radaelli.

**Recomendación concreta antes de decidir**: pedir confirmación por escrito a soporte de Shopify (comisión en método manual) y a soporte de Wompi (estado de instalación actual y garantías de idempotencia/reintento de webhook) — ambas son incógnitas que bloquean la decisión y que la documentación pública no resuelve.
