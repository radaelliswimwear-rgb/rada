# LEGAL_GAPS — Radaelli Swimwear (03R, revisión legal-operativa)

Fecha: 2026-10-02. Autor: redactor legal-operativo (no abogado; no es asesoría jurídica). Nada se publicó ni se modificó en Shopify.
Paquete: `redlines-proposed.md` (textos y redlines) y los HTML de esta carpeta.

Etiquetas:
- `LEGAL_GAP_<n>`: algo realmente incierto o sin dato verificable. Cada uno trae norma, riesgo, opción conservadora y qué dato falta.
- `CHATGPT_REVIEW_REQUIRED_LEGAL`: cláusula que podría reducir derechos del consumidor o que depende de interpretar una excepción legal. No se propone como texto listo para publicar sin esa revisión; en los HTML se dejó la opción conservadora.
- `[DECISIÓN DUEÑA]`: dato comercial que solo ella puede dar. Todos tienen un valor por defecto aplicado en los HTML (ver tabla en `redlines-proposed.md`, sección 7).

Marcador único que queda en los HTML: `[FECHA DE PUBLICACIÓN]` en la línea «Última actualización». Reemplazar al publicar y comprobar con una búsqueda de «[» antes de guardar.

**Aviso de numeración.** La numeración `LEGAL_GAP_<n>` de este archivo es propia de esta revisión de redacción. **No coincide** con la de `audit-live-2026-10-02.md` (auditoría de superficies en vivo hecha en paralelo, que también usa LEGAL_GAP_1 a 13 y R-1 a R-8). Equivalencias:

| Este archivo | `audit-live-2026-10-02.md` |
|---|---|
| 1 «Bienes de uso personal» | LEGAL_GAP_2 y R-1 |
| (eliminación de la ventana de 5 días para defectos; ver redlines 4.1) | LEGAL_GAP_3 y R-2 |
| 6 PQR con radicado | LEGAL_GAP_10 |
| 7 Plazo de entrega | LEGAL_GAP_4 |
| 11 Identidad legal | LEGAL_GAP_1 |
| 12 Garantía de 12 meses | LEGAL_GAP_13 |
| 15 Consentimiento y Meta | LEGAL_GAP_8 y 12, R-8 |
| 18 Promoción 20 % | LEGAL_GAP_5 |
| 19 Proveedores reales | LEGAL_GAP_9 |
| 20 Copias y política automática de privacidad | LEGAL_GAP_11, K1 y K8 |
| Cláusula de precio por error (CHATGPT_REVIEW 5) | R-5 |
| «Tu autorización» (CHATGPT_REVIEW 7) | R-7 |

Las afirmaciones sobre composición, medidas, «sostenible» y mensaje de stock de las fichas de producto (LEGAL_GAP_6 y 7 del otro documento) están fuera del alcance de este paquete.

---

## Resumen

| # | Tema | Marca | Gravedad si se publica tal cual |
|---|---|---|---|
| 1 | «Bienes de uso personal» y trajes de baño | CHATGPT_REVIEW_REQUIRED_LEGAL | Alta (decisión de fondo) |
| 2 | Alcance de «mismas condiciones en que lo recibió» | CHATGPT_REVIEW_REQUIRED_LEGAL | Media |
| 3 | Reembolso del envío original y retracto parcial | CHATGPT_REVIEW_REQUIRED_LEGAL | Media |
| 4 | Desde cuándo corre el plazo de 15 días calendario | LEGAL_GAP | Media |
| 5 | Medios de devolución del dinero vs. capacidad real de Wompi/Nequi | LEGAL_GAP | Alta (operativa) |
| 6 | PQR: canal en el sitio, radicado y plazo de respuesta | LEGAL_GAP | Alta |
| 7 | Plazo de entrega informado antes de pagar | LEGAL_GAP | Alta |
| 8 | Acuse de recibo del pedido con tiempo de entrega | LEGAL_GAP | Media |
| 9 | Prueba de aceptación de las condiciones generales | LEGAL_GAP | Media |
| 10 | Medios de pago a listar (marcas confirmadas en el payload del checkout; falta confirmar cuenta Wompi) | LEGAL_GAP | Baja |
| 11 | Identidad: «nombre o razón social» y «dirección de notificación judicial» | LEGAL_GAP | Media |
| 12 | Garantía de 12 meses e instrucciones de cuidado | LEGAL_GAP | Baja |
| 13 | Envío gratis: antes o después del descuento | LEGAL_GAP | Media |
| 14 | Reversión del pago: ámbito y proyecto de decreto | LEGAL_GAP | Media |
| 15 | Consentimiento: rechazo no probado y falta de enlace permanente | LEGAL_GAP | Alta |
| 16 | Aviso de autorización en el formulario de suscripción | LEGAL_GAP | Media |
| 17 | Edad de quien compra | LEGAL_GAP | Baja |
| 18 | Promoción «20 %» sin fecha de fin | LEGAL_GAP | Media |
| 19 | Proveedores y transferencias no verificados | LEGAL_GAP | Media |
| 20 | Copias duplicadas de políticas; la política de privacidad nativa sirve el texto automático de Shopify | LEGAL_GAP | Alta |
| 21 | Reforma de la Ley 1581 y RNBD (heredado) | LEGAL_GAP | Baja |

---

### LEGAL_GAP_1 — «Bienes de uso personal» y trajes de baño  [CHATGPT_REVIEW_REQUIRED_LEGAL]
- **Norma:** Ley 1480 de 2011, art. 47, numeral 7 (https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=44306). SIC, Concepto Rad. 26-226272 (boletín publicado el 3-sep-2026): los bienes de uso personal son los destinados exclusivamente al cuidado, la salubridad o la higiene individual; da como ejemplos la ropa interior y los cosméticos; dice que no resuelve casos particulares y que cada caso exige análisis probatorio (https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/boletin/derecho-al-retracto-en-bienes-de-uso-personal-y-la-prohibicion-de-las-ventas-atadas). SIC, Concepto 20-48253 (colchones, 2020): interpretación restrictiva (https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/los-colchones-son-bienes-de-uso-personal).
- **Riesgo:** dos riesgos opuestos. (a) Publicar «los trajes de baño no tienen retracto» es una cláusula que reduce un derecho (art. 43, num. 2) y la SIC no lo avala por categoría. (b) Aceptar el retracto de una prenda íntima devuelta usada pone en riesgo el inventario. Una parte inferior de bikini o un enterizo podrían compararse con la ropa interior, pero ninguna fuente oficial lo dice.
- **Opción conservadora (aplicada):** reconocer el retracto «cuando legalmente proceda», listar las siete excepciones de la ley sin ampliarlas, no invocar ninguna por categoría de producto, exigir que la prenda vuelva en las mismas condiciones y explicar por escrito, con motivo, antes de negar un caso concreto.
- **Qué falta:** criterio profesional (abogado de consumo o consulta formal a la SIC) sobre si algún producto concreto, por ejemplo una parte inferior con protector de higiene, encaja en el numeral 7; y la decisión de la dueña de asumir el riesgo operativo mientras tanto.
- **Dónde se refleja:** `refund-policy.html`, sección «Excepciones legales al retracto».

### LEGAL_GAP_2 — Alcance de «mismas condiciones en que lo recibió»  [CHATGPT_REVIEW_REQUIRED_LEGAL]
- **Norma:** Ley 1480, art. 47, inciso 2. La SIC solo repite «mismas condiciones» y explica que el uso posterior o el deterioro impide la devolución (Concepto 26-226272; noticia SIC https://sedeelectronica.sic.gov.co/noticias/se-arrepintio-de-una-compra-y-no-sabe-que-hacer).
- **Riesgo:** concretar la frase («sin señales de uso, con etiquetas, con protector de higiene, en un empaque que lo proteja») puede leerse como una exigencia adicional si se aplica con rigidez, por ejemplo para negar un retracto por haber perdido el empaque.
- **Opción conservadora (aplicada):** exigir solo ausencia de señales de uso, etiquetas y protector de higiene si lo traía; no exigir empaque original ni factura; no rechazar sin motivo escrito.
- **Qué falta:** que la dueña confirme si acepta que la clienta se pruebe la prenda sobre su ropa interior y cómo documenta el estado al despachar (fotos del producto empacado).

### LEGAL_GAP_3 — Reembolso del envío original y retracto parcial  [CHATGPT_REVIEW_REQUIRED_LEGAL]
- **Norma:** Ley 1480, art. 47, inciso 1 (resuelto el contrato, se reintegra «el dinero que el consumidor hubiese pagado»); el inciso final sobre la devolución fue sustituido por la Ley 2439 de 2024, art. 3, que no repite la frase «sin descuentos ni retenciones» del texto anterior. La noticia SIC de 2021 mantiene «sin descuentos».
- **Riesgo:** negarse a reembolsar el envío que la clienta pagó puede verse como una retención. Reembolsarlo cuesta entre $9.900 y $44.900 por pedido.
- **Opción conservadora (aplicada):** devolver el valor de los productos devueltos y, si se devuelve todo el pedido, también el envío pagado; no descontar comisiones de la pasarela. En una devolución parcial no se cobra después el envío que fue gratis (sin base legal expresa).
- **Qué falta:** pronunciamiento específico de la SIC o criterio profesional; decisión de la dueña.

### LEGAL_GAP_4 — Desde cuándo corre el plazo de 15 días calendario
- **Norma:** Ley 2439 de 2024, art. 3 (modifica el art. 47 de la Ley 1480): máximo 15 días calendario «desde el momento en que ejerció el derecho y haya cumplido» dos obligaciones: datos correctos y completos, y devolución del producto en los términos del artículo. Ley 1480, art. 47: 5 días hábiles para ejercer el derecho.
- **Riesgo:** la ley no aclara si «devolución del producto» es la entrega a la transportadora o la recepción en Barranquilla, ni fija plazo para enviar el producto después de avisar.
- **Opción conservadora (aplicada):** el HTML repite la redacción legal sin definir el punto de partida y no impone un plazo propio para despachar. Recomendación operativa: contar el plazo desde que la clienta despacha el paquete con guía.
- **Qué falta:** criterio de la SIC o de un profesional.

### LEGAL_GAP_5 — Medios de devolución del dinero vs. capacidad real de Wompi y Nequi
- **Norma:** Ley 2439 de 2024, art. 3 (el dinero se aplica al instrumento de pago original o por el medio acordado, y el proveedor debe informar «de manera clara, detallada y específica» las opciones que tiene) y art. 5 (la devolución se hace por el medio de pago que prefiera el consumidor); art. 3, parágrafo 1 (todos los actores, incluida la entidad financiera, cumplen el plazo). Fuente del texto: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=257116 (D.O. 52.975, 29-dic-2024).
- **Riesgo:** prometer reembolso por el medio original sin poder ejecutarlo. El handoff registra GAP-03: el reembolso del pedido #1002 hecho desde Shopify quedó PENDING en Wompi y el pago con Nequi no tenía botón «Anular». Eso pondría en riesgo el plazo de 15 días. Además hay tensión entre el art. 3 (medio original o acordado) y el art. 5 (el que prefiera el consumidor).
- **Opción conservadora (aplicada):** publicar dos opciones —medio original cuando la pasarela lo permita y transferencia a cuenta bancaria o Nequi a nombre de quien compró— y que la clienta elija; la dueña asume el costo de la transferencia.
- **Qué falta:** confirmación de la dueña de que puede ofrecer ambas; procedimiento operativo para reembolsar por método de pago desde el panel de Wompi; costo de cada opción.

### LEGAL_GAP_6 — PQR: canal en el sitio, radicado y plazo de respuesta
- **Norma:** Ley 1480, art. 50, literal g (modificado por la Ley 2439, art. 4): canales de fácil acceso en el mismo medio de comercio electrónico, trazabilidad, constancia mediante número de registro o radicado, con fecha y hora, y mecanismo de seguimiento. Vigente desde unos cuatro meses después del 29-dic-2024 (parágrafo transitorio del art. 4). Art. 46, num. 2: reclamaciones y devoluciones por los mismos medios de la transacción original. Decreto 1074 de 2015, art. 2.2.2.51.4: el proveedor emite constancia de la queja de reversión con fecha y causal.
- **Hallazgo:** `/pages/contact` solo tiene texto, sin formulario. El único formulario de la portada es el de suscripción. Los canales reales son correo (Gmail) y WhatsApp: guardan fecha y hora, pero no generan un número de radicado.
- **Riesgo:** incumplir el literal g. La Ley 1480 no fija un plazo de respuesta a las PQR del proveedor (no se encontró en las fuentes leídas), por eso no se promete uno.
- **Opción conservadora (aplicada):** responder siempre con un número de radicado asignado a mano (formato sugerido `PQR-AAAAMMDD-NNN`) en una hoja de control con radicado, fecha y hora de recibo, canal, tipo, estado y fecha de respuesta; y recomendar un formulario nativo de contacto de Shopify en `/pages/contact`.
- **Qué falta:** `[DECISIÓN DUEÑA]`: plazo de respuesta (sugerencia: 15 días hábiles, igual al de reclamos de datos de la Ley 1581; no es una exigencia de la Ley 1480) y quién opera la hoja de control.

### LEGAL_GAP_7 — Plazo de entrega informado antes de pagar
- **Norma:** Ley 1480, art. 50, literales c y h (modificado por la Ley 2439, art. 4): informar el tiempo de entrega; entregar dentro del plazo aceptado por el consumidor, informado antes de finalizar la transacción; si no se fijó, máximo 30 días calendario desde el día siguiente al pedido; si se excede, el consumidor puede terminar el contrato y recibir todo lo pagado en máximo 15 días calendario.
- **Hallazgo:** en el Admin, las 10 tarifas activas («Envío estándar» y «Envío estándar gratis» en 5 zonas) tienen `description = null`, es decir, sin plazo visible. La política vigente promete «3 a 5 días hábiles» y «express 24 a 48 horas». El handoff 03J dice que el 3–5 vino del sitio anterior. El método express no existe en el Admin.
- **Opción conservadora (aplicada):** publicar 30 días calendario como plazo máximo y retirar el express. No se inventó un plazo comercial.
- **Qué falta:** `[DECISIÓN DUEÑA]`: plazo de alistamiento y de tránsito por zona. Cuando lo decida, ponerlo en la descripción de cada tarifa («3 a 5 días hábiles después del despacho») y en la ficha de producto. Variante de texto en `redlines-proposed.md`, sección 5.4.

### LEGAL_GAP_8 — Acuse de recibo del pedido con tiempo de entrega
- **Norma:** Ley 1480, art. 50, literal d: acuse de recibo a más tardar el día calendario siguiente, con información precisa del tiempo de entrega, precio exacto, impuestos, gastos de envío y forma de pago.
- **Hallazgo:** no se pudo leer la plantilla «Confirmación del pedido» (solo lectura, sin pedido de prueba).
- **Opción conservadora (aplicada):** los términos prometen ese acuse con esos datos; revisar la plantilla en Configuración > Notificaciones.
- **Qué falta:** verificación en el Admin.

### LEGAL_GAP_9 — Prueba de aceptación de las condiciones generales
- **Norma:** Ley 1480, art. 37 num. 1 (informar anticipada y expresamente), art. 48 (dejar prueba de la aceptación del adherente) y art. 50 lit. d (aceptación expresa, inequívoca y verificable; no se presume por silencio).
- **Hallazgo:** el checkout de Shopify enlaza las políticas, pero no exige marcar una casilla.
- **Opción conservadora (aplicada):** los términos dicen «al hacer clic en el botón para pagar… aceptas». Recomendación: casilla obligatoria en el carrito (texto en `redlines-proposed.md`, sección 5.2).
- **Qué falta:** decisión de implementarlo en el tema (fuera de este paquete).

### LEGAL_GAP_10 — Medios de pago a listar
- **Norma:** Ley 1480, art. 50, literal c (informar los medios de pago).
- **Hallazgo:** en esta revisión no se abrió un checkout. La auditoría en vivo paralela sí lo hizo y extrajo del checkout el método «Wompi» con las marcas `visa, master, american_express, bancolombia, nequi, daviplata, pse` (`before/checkout-payment-config-extract.txt`); no pudo ver el paso de pago porque exige una dirección. Los términos vigentes listaban «tarjeta, PSE, Nequi o Bancolombia» (omitían American Express y Daviplata); la política de privacidad dice «tarjeta, PSE, Nequi y otros medios» (coincide y no se cambia). El pedido real #1002 se pagó con Nequi (handoff).
- **Opción conservadora (aplicada):** los términos v2 listan esas siete marcas y aclaran que «los medios disponibles son los que Wompi te muestra al pagar».
- **Qué falta:** confirmar en el panel de Wompi (o en un pago real) que cada medio está activo en la cuenta de la dueña. Gravedad baja.

### LEGAL_GAP_11 — Identidad: «nombre o razón social» y «dirección de notificación judicial»
- **Norma:** Ley 1480, art. 50, literal a.
- **Hallazgo:** los datos aprobados por la dueña son nombre comercial «Radaelli Swimwear», NIT, dirección, teléfono y correo, y se usaron sin alterar. La ley pide «nombre o razón social» y «dirección de notificación judicial»; los textos dicen «Dirección de notificaciones». Si el NIT corresponde a una persona natural, el nombre legal puede ser distinto del comercial.
- **Riesgo:** medio. La SIC podría considerar incompleta la identificación.
- **Opción conservadora (aplicada):** no se infirió ni se agregó ningún dato.
- **Qué falta:** decisión de la dueña, con su contador, sobre publicar su nombre completo junto al nombre comercial y confirmar que esa dirección sirve también para notificación judicial.

### LEGAL_GAP_12 — Garantía de 12 meses e instrucciones de cuidado
- **Norma:** Ley 1480, art. 8 (el término anunciado; un año para productos nuevos si no se anuncia), art. 16 num. 4 (no se puede alegar «no siguió las instrucciones» si no se dio manual en castellano), art. 50 lit. b (cuidado relevante).
- **Hallazgo:** 12 meses es lo publicado hoy. No se auditaron las fichas de producto ni las etiquetas.
- **Opción conservadora (aplicada):** mantener 12 meses y no alegar mal cuidado cuando no haya instrucciones visibles en castellano.
- **Qué falta:** que la dueña confirme los 12 meses y que cada ficha o etiqueta traiga el cuidado.

### LEGAL_GAP_13 — Envío gratis: antes o después del descuento
- **Hallazgo:** en el Admin la regla es «valor del pedido ≥ 299.900» en las 5 zonas. El documento `owner-cost-questions.md` dice que falta confirmar si un código de descuento cuenta antes o después del umbral. La política vigente decía «ya con el cupón aplicado».
- **Riesgo:** un texto distinto de la regla real es información engañosa.
- **Opción conservadora (aplicada):** «con los descuentos ya aplicados y antes del envío» (no sobreprometer).
- **Qué falta:** una prueba en un carrito real (no se hizo: solo lectura).

### LEGAL_GAP_14 — Reversión del pago: ámbito y proyecto de decreto
- **Norma:** Decreto 1074 de 2015, capítulo 51, arts. 2.2.2.51.1 a 2.2.2.51.14 (Decreto 587 de 2016; texto en https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=65906). Solo aplica si el vendedor y el emisor del instrumento de pago están domiciliados en Colombia (art. 2.2.2.51.1, parágrafo 1). El MINCIT publicó en septiembre de 2025 un proyecto de decreto con nuevas reglas (consulta hasta el 8-oct-2025; https://incp.org.co/publicaciones/infoincp-publicaciones/2025/09/mincit-propone-nuevas-reglas-para-la-reversion-de-pagos-en-el-comercio-electronico/). No se confirmó que se haya expedido.
- **Riesgo:** pasos y plazos distintos si el decreto nuevo ya rige; una billetera como Nequi puede no encajar como «instrumento de pago electrónico» frente a un emisor.
- **Opción conservadora (aplicada):** el texto usa la norma vigente verificada y dice «tarjeta u otro instrumento de pago electrónico» sin listar Nequi.
- **Qué falta:** confirmar antes de publicar que el decreto nuevo no se expidió; cómo recibe la dueña los avisos del emisor.

### LEGAL_GAP_15 — Consentimiento: rechazo no probado y falta de enlace permanente
- **Norma:** Ley 1581 de 2012, arts. 3(a), 4 y 9; Decreto 1377 de 2013, art. 7 (el silencio no es autorización) y art. 9 (revocación por mecanismos gratuitos y accesibles); SIC, Concepto 16-172268 (https://www.sic.gov.co/recursos_user/boletin-juridico-sep2016/articulo/datos/tratamiento-datos-personales-a-traves-de-cookies.html): las cookies pueden formar una base de datos y exigen cumplir los principios de la ley.
- **Hallazgos:** (a) el banner de Shopify está activo (se carga `storefront-banner.js`). (b) El pie del sitio no tiene un enlace para reabrir las preferencias. El script del banner reabre las preferencias con cualquier enlace cuyo destino termine en `#shopifyReshowConsentBanner` (leído en el script publicado); la política de cookies v2 usa ese enlace. (c) Del lado del navegador el rechazo sí se verificó en la auditoría en vivo paralela (`before/evidence-cookie-banner.txt`): tras «Rechazar todo», `fbq` quedó indefinido y no hubo peticiones a Facebook. Del lado del servidor no: con Meta en nivel Máximo, acceso «Optimizado» y `facebookCapiEnabled = true`, no se probó qué eventos de servidor salen cuando la visitante rechaza (el handoff 03R lo registra como decisión D13 y Purchase sin probar). Esa auditoría también observó telemetría de Shopify (`monorail-edge`, `otlp`) tras rechazar, de finalidad no confirmada. (d) El enlace «Política de privacidad» del propio banner apunta a `/es/policies/privacy-policy`, que da 404 (verificado por esa auditoría); es un ajuste de Shopify/redirecciones, no de texto (ver `redlines-proposed.md`, sección 5.9).
- **Riesgo:** los textos dicen «configuramos la tienda para que respete tu elección» sin una prueba positiva del rechazo en el servidor.
- **Opción conservadora (aplicada):** redacción en términos de configuración, no de garantía absoluta; no se afirma más de lo verificado. Estas frases (P7 y C2 en `redlines-proposed.md`) deben pasar por la revisión R-8 de la auditoría paralela antes de publicarse.
- **Qué falta:** prueba con navegador limpio: rechazar en el banner y comprobar en Meta Events Manager (Test events) que no llegan eventos del servidor; agregar el enlace «Cambiar mis preferencias de cookies» (ya está en la política de cookies v2) y probarlo. En esta revisión no se interactuó con el banner para no registrar consentimientos ni generar eventos.

### LEGAL_GAP_16 — Aviso de autorización en el formulario de suscripción
- **Norma:** Ley 1581, art. 12; Decreto 1377, arts. 5 y 14; si se envía publicidad por mensajes, Ley 2300 de 2023 (horarios; fuente secundaria, sin verificar aquí).
- **Hallazgo:** el formulario de la portada («Sé la primera en enterarte») no muestra finalidad ni enlace a la política, y tiene voseo («Dejá», «recibí»).
- **Opción conservadora:** texto propuesto en `redlines-proposed.md`, sección 5.3.
- **Qué falta:** aplicarlo en el tema (fuera de este paquete).

### LEGAL_GAP_17 — Edad de quien compra
- **Norma:** Ley 1480, art. 52: tomar las medidas posibles para verificar la edad y, si compra un menor, dejar constancia de la autorización expresa de los padres.
- **Hallazgo:** no hay verificación de edad. Los términos v2 dicen que la tienda vende a mayores de 18 años y que un menor necesita a su representante.
- **Riesgo:** bajo. **Falta:** decidir si se agrega algún paso adicional.

### LEGAL_GAP_18 — Promoción «20 % de descuento en toda la tienda» sin fecha de fin
- **Norma:** Ley 1480, art. 33 (si no se indica hasta cuándo rige, vale hasta que se anuncie su fin por los mismos medios e intensidad); art. 30 (publicidad engañosa).
- **Hallazgo:** la portada dice «Por tiempo limitado», sin fecha.
- **Opción conservadora (aplicada):** los términos reproducen la regla del art. 33.
- **Qué falta:** `[DECISIÓN DUEÑA]`: poner fecha de fin o quitar «por tiempo limitado».

### LEGAL_GAP_19 — Proveedores y transferencias no verificados
- **Norma:** Ley 1581, arts. 26 y 27; Decreto 1377, arts. 24 y 25.
- **Hallazgo:** la política solo describe el tratamiento en el exterior de Shopify y Meta. No está verificada la ubicación ni el rol exacto de Wompi, del servicio intermediario del complemento de pagos, de Envia ni de Google (Gmail). Envia está instalada y conectada, pero aún no se compró una guía real (handoff C4), por lo que su uso efectivo no está confirmado; el texto de envíos dice «gestionamos los envíos con Envia» y conviene confirmarlo con el primer despacho.
- **Opción conservadora (aplicada):** no se afirmó ninguna transferencia concreta nueva.
- **Qué falta:** ubicación y rol de cada proveedor, y si Shopify cumple como contrato de transmisión (abogado).

### LEGAL_GAP_20 — Copias duplicadas de políticas (nativa y página)
- **Hallazgo:** existen las políticas nativas (REFUND, SHIPPING, TERMS, PRIVACY, CONTACT) y las páginas `/pages/envios`, `/pages/terminos`, `/pages/privacidad` y `/pages/contact`. El pie del sitio enlaza páginas para envíos, términos y privacidad, y la política nativa para devoluciones. El checkout enlaza las nativas (en `checkout.shopify.com`). Además, según la auditoría en vivo paralela (K1 y LEGAL_GAP_11 de ese documento), `/policies/privacy-policy` **sigue sirviendo el texto genérico automático de Shopify** (con teléfono en blanco y referencias al EEE) aunque el cuerpo guardado en la política nativa ya es el texto colombiano; el interruptor de la política automática solo se ve en la interfaz del Admin. Por eso pegar `privacy-policy-v2.html` en PRIVACY_POLICY no cambiará lo que ve la clienta mientras la política automática siga activa. La lectura de esta revisión (API) devuelve el cuerpo guardado, no el servido.
- **Riesgo:** dos textos distintos = contradicción visible para la clienta y para la SIC; la política de privacidad que enlaza el checkout puede no ser la colombiana.
- **Opción conservadora:** publicar el mismo HTML en ambas copias el mismo día y con enlaces absolutos (`https://radaelliswimwear.com/...`), porque la copia nativa se muestra en otro dominio; y, antes de publicar privacidad, que la dueña o quien tenga acceso a la interfaz desactive la política generada automáticamente en Configuración > Políticas (CHG-1 de la auditoría paralela) y verifique que `/policies/privacy-policy` muestre «Quién es el responsable de tus datos».
- **Qué falta:** estado actual del interruptor y quién tiene acceso a esa pantalla.

### LEGAL_GAP_21 — Reforma de la Ley 1581 y RNBD (heredado de la investigación D13)
- **Hallazgo:** el Proyecto de Ley Estatutaria 282 de 2026 y la obligación de registro en el RNBD no se re-verificaron en esta tarea.
- **Opción conservadora:** mantener la política actual; revisar antes de cambiar la base legal del tratamiento.

---

## Resumen de CHATGPT_REVIEW_REQUIRED_LEGAL

1. **LEGAL_GAP_1** — excepción de «bienes de uso personal» aplicada a trajes de baño. Texto publicable: opción conservadora.
2. **LEGAL_GAP_2** — concreción de «mismas condiciones».
3. **LEGAL_GAP_3** — reembolso del envío original.
4. **Cambio voluntario con exclusión por higiene.** Si la dueña quiere excluir trajes de baño de cualquier cambio voluntario por higiene, es una política comercial que la SIC admite (https://sedeelectronica.sic.gov.co/temas/proteccion-al-consumidor/derechos-y-deberes/fallas-en-un-producto), pero su redacción puede confundirse con una negación del retracto. No se escribió; el HTML dice «por ahora no ofrecemos cambios voluntarios» y remite al retracto.
5. **Cláusula de corrección de precios** del texto vigente («Nos reservamos el derecho de corregir un precio publicado por error…»). Se retiró porque el consumidor solo está obligado a pagar el precio anunciado (Ley 1480, art. 26). Si la dueña quiere una cláusula de error de precio, requiere redacción profesional.
6. **Frases sobre el rechazo y Meta** (P7 en la política de privacidad v2 y C2 en la de cookies v2): «configuramos la tienda para que respete tu elección y no comparta esos datos con Meta». Dependen de la prueba de servidor de LEGAL_GAP_15 (R-8 de la auditoría paralela). Conservadora: si la prueba no se hace antes de publicar, dejar solo «si las aceptas… » y quitar la frase sobre el rechazo.
7. **Cláusula conservada sin cambios: «Tu autorización»** en la política de privacidad («Cuando compras, creas una cuenta, nos escribes o te suscribes, nos autorizas…»). Es autorización por conducta inequívoca (Decreto 1377, art. 7) y la auditoría paralela la marca R-7. No se modificó; queda pendiente su revisión.

Las demás eliminaciones del texto vigente (plazo de 5 días para defectos, «no devolución por higiene» general, «desgaste normal», «evaluamos antes de aprobar», pago directo a la transportadora, envío express) amplían derechos o corrigen contradicciones con la ley y con el Admin; se informan en `redlines-proposed.md` pero no requieren revisión previa para publicarse.

## Lo que no se hizo (límites de esta revisión)
- No se publicó ni se modificó nada en Shopify (solo consultas de lectura: `shopPolicies`, `pages`, `deliveryProfiles`).
- No se abrió ningún checkout ni se interactuó con el banner de cookies. Los hallazgos de checkout y de banner que se citan provienen de `audit-live-2026-10-02.md` y de su carpeta `before/` (hecha en paralelo, también de solo lectura).
- La página del Gestor Normativo de la Función Pública no cargó con la herramienta de lectura (error de cadena de certificados). El texto de la Ley 1480 y el Decreto 587/2016 se leyó en el Régimen Legal de Bogotá (Secretaría Jurídica Distrital), que reproduce el texto con las notas de modificación. La Ley 2439 de 2024 se leyó en una copia PDF del Diario Oficial 52.975 (portaldms.com), coherente con las notas de modificación del Régimen Legal de Bogotá. Conviene que quien revise abra los enlaces del Gestor Normativo en un navegador.
