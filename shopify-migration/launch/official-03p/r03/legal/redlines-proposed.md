# Propuestas legales 03R — textos y redlines (Radaelli Swimwear)

Fecha: 2026-10-02 (America/Bogotá). Redactor legal-operativo, **no abogado**: esto no es asesoría jurídica. Solo lectura sobre Shopify: **no se publicó ni se cambió nada**.
Tienda: https://radaelliswimwear.com (wgcvpd-ib.myshopify.com). Datos del vendedor: los aprobados por la dueña el 2026-10-02 (`public-seller-data-approved.md`), usados sin alterar.
Carpeta de entregables: `...\scratchpad\official\r03\legal\`

---

## 0. Cómo usar este paquete

| Archivo | Para qué sirve | Dónde se pega (cuando ChatGPT y la dueña den el visto bueno) |
|---|---|---|
| `refund-policy.html` | Retracto, garantía legal, producto distinto/dañado/no llegó, reversión del pago, cambio voluntario, cómo reclamar, SIC | Política nativa REFUND_POLICY (el pie del sitio enlaza `/policies/refund-policy`) |
| `shipping-policy.html` | Envíos con las tarifas reales, plazo, derechos | Política nativa SHIPPING_POLICY **y** página `/pages/envios` (el pie enlaza la página) |
| `terms-of-service.html` | Términos y condiciones generales mínimos | Política nativa TERMS_OF_SERVICE **y** página `/pages/terminos` |
| `garantia-page.html` | Alinea la página de garantía con la ley y con la política de devoluciones | Página `/pages/garantia` |
| `contact-information.html` | Agrega PQR con radicado y el enlace a la SIC | Política nativa CONTACT_INFORMATION **y** página `/pages/contact` |
| `sic-link-block.html` | Enlace a la SIC: línea para el pie del sitio y párrafos para políticas | Pie del tema (cambio de tema, no incluido) y políticas |
| `privacy-policy-v2.html` | Privacidad con los cambios de abajo (4.8) | Política nativa PRIVACY_POLICY **y** página `/pages/privacidad` |
| `cookie-policy-v2.html` | Cookies con los cambios de abajo (4.9) | Página `/pages/cookies` |
| `LEGAL_GAPS.md` | 21 LEGAL_GAP y los CHATGPT_REVIEW_REQUIRED_LEGAL | — |

Convenciones: `[DECISIÓN DUEÑA: …]` = dato que solo ella puede dar (con valor por defecto ya aplicado, ver sección 7). `LEGAL_GAP_n` y `CHATGPT_REVIEW_REQUIRED_LEGAL` están en `LEGAL_GAPS.md`. Los HTML usan tuteo, español claro y enlaces absolutos (la copia nativa de las políticas se muestra en `checkout.shopify.com`, donde los enlaces relativos se rompen). Único marcador pendiente en los HTML: `[FECHA DE PUBLICACIÓN]`.

---

## 1. Resumen ejecutivo

1. La política de devoluciones vigente **niega el retracto** por «higiene» y limita todo reclamo a 5 días hábiles. Contradice la Ley 1480 (art. 47 y arts. 7–11) y tiene cláusulas que reducen derechos. Se reescribe en cuatro derechos separados: retracto, garantía legal, reversión del pago y cambio voluntario.
2. La política de envíos vigente dice que la tarifa se «coordina» después de la compra y se paga a la transportadora, y promete «express 24 a 48 horas». El Admin muestra 5 zonas con tarifas fijas (9.900 / 12.900 / 17.900 / 21.900 / 44.900), envío gratis desde 299.900 y **ningún** método express. Se reescribe con la tabla real.
3. Faltan, y se agregan: reversión del pago (art. 51), PQR con número de radicado (art. 50 lit. g), enlace visible a la SIC (art. 50, parágrafo), plazo de entrega y derechos si no se cumple (art. 50 lit. h), identidad, condiciones generales accesibles (art. 50 lit. d).
4. Privacidad y cookies ya no mencionan Resend ni Cloudinary y ya dicen «solo si las aceptas». Los cambios son pocos: datos de devoluciones y reembolsos, Meta con la API de Conversiones (servidor), una sección sobre la categoría «Personalización» del banner y un enlace funcional para cambiar las preferencias de cookies. Además, la auditoría paralela encontró que la política de privacidad que sirve `/policies/privacy-policy` sigue siendo la automática de Shopify (ver 5.9): sin resolver eso, los cambios de privacidad no llegan a la clienta que viene del checkout o del banner.
5. Quedan abiertas dos decisiones de fondo para ChatGPT/abogado: si algún producto cae en «bienes de uso personal» (LEGAL_GAP_1) y cuánto se concreta «mismas condiciones» (LEGAL_GAP_2).

---

## 2. Fuentes oficiales verificadas

Todas leídas el 2026-10-02. El Gestor Normativo de la Función Pública no cargó con la herramienta de lectura (error de cadena de certificados); el texto se leyó en el Régimen Legal de Bogotá (Secretaría Jurídica Distrital), que reproduce el texto oficial con las notas de modificación. Quien revise puede abrir los enlaces del Gestor Normativo en un navegador.

| ID | Fuente | Qué se usó | URL |
|---|---|---|---|
| F1 | Ley 1480 de 2011 (Estatuto del Consumidor), arts. 5, 7, 8, 10, 11, 16, 26, 33, 34, 37, 38, 42–44, 46, 47, 48, 49, 50, 51, 52 | Retracto, garantía, precio, condiciones generales, comercio electrónico, reversión | https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=44306 · https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306 |
| F2 | Ley 2439 de 2024 (D.O. 52.975, 29-dic-2024), arts. 3, 4 y 5 | Devolución del dinero en máximo 15 días calendario (art. 3, modifica el art. 47 de la Ley 1480); PQR con radicado, plazo de entrega y reembolso en 15 días (art. 4, modifica el art. 50 lit. b, g, h; vigente cuatro meses después de la publicación); medio de pago que prefiera el consumidor (art. 5) | https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=257116 · copia PDF leída: https://portaldms.com/3/files/LEY_2439_DEL_19_DE_DICIEMBRE.pdf |
| F3 | Decreto 587 de 2016, incorporado al Decreto 1074 de 2015 como capítulo 51 (arts. 2.2.2.51.1 a 2.2.2.51.14) | Reversión del pago: causales, queja al proveedor en 5 días hábiles, aviso al emisor, 15 días hábiles para revertir | https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=65906 · https://www.mincit.gov.co/ministerio/normograma-sig/procesos-de-apoyo/gestion-juridica/decretos/decreto-587-de-2016.aspx |
| F4 | Ley 1581 de 2012, arts. 3, 8, 9, 12, 14, 15, 16 | Derechos del titular, consultas (10 días hábiles +5), reclamos (15 días hábiles +8), requisito de procedibilidad ante la SIC | https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=49981 |
| F5 | Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015, art. 2.2.2.25.3.1) | Contenido mínimo de la política de tratamiento; el silencio no es autorización | https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=53646 · https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=76608 |
| F6 | SIC, Concepto 25-310342 (27-ago-2025) | El enlace a la SIC es obligatorio en comercio electrónico; no hace falta el logotipo | https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/titulo-obligacion-de-incluir-enlace-la-superindustria-en-plataformas-de-comercio-electronico |
| F7 | SIC, Concepto Rad. 26-226272 (publicado 3-sep-2026) | «Bienes de uso personal» = cuidado, salubridad o higiene individual (ejemplos: ropa interior, cosméticos); cambio voluntario solo por política comercial; si hay defecto aplica la garantía; la SIC no resuelve casos particulares | https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/boletin/derecho-al-retracto-en-bienes-de-uso-personal-y-la-prohibicion-de-las-ventas-atadas |
| F8 | SIC, Concepto 20-48253 (colchones, 2020) | Interpretación restrictiva de «uso personal» (si fuera todo bien útil, no habría retracto sobre ningún bien) | https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/los-colchones-son-bienes-de-uso-personal |
| F9 | SIC, «Fallas en un producto, baja calidad e incumplimiento de garantías» | Garantía: exclusiones solo las causales legales; el costo de reparación y transporte es del proveedor; el cambio por «ya no lo quiero» solo existe como política comercial; retracto en 5 días hábiles | https://sedeelectronica.sic.gov.co/temas/proteccion-al-consumidor/derechos-y-deberes/fallas-en-un-producto |
| F10 | SIC, noticia «¿Se arrepintió de una compra…?» (6-oct-2021) | Retracto: mismos medios y condiciones; costos de devolución a cargo del consumidor; excepciones. **Su plazo de 30 días está superado por la Ley 2439** | https://sedeelectronica.sic.gov.co/noticias/se-arrepintio-de-una-compra-y-no-sabe-que-hacer |
| F11 | SIC, Concepto 20-43538 (políticas de tratamiento) | La política debe contener la información mínima del art. 2.2.2.25.3.1 del Decreto 1074 y ponerse en conocimiento de los titulares | https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/politicas-de-tratamiento-de-datos-personales |
| F12 | SIC, Concepto 16-172268 (9-ago-2016) | Las cookies que recogen datos personales pueden formar una base de datos y obligan a cumplir los principios de la Ley 1581 | https://www.sic.gov.co/recursos_user/boletin-juridico-sep2016/articulo/datos/tratamiento-datos-personales-a-traves-de-cookies.html |
| F13 | SIC, sitio oficial (comprobado: HTTP 200) | URL del enlace obligatorio | https://www.sic.gov.co/ · https://sedeelectronica.sic.gov.co/temas/proteccion-al-consumidor |
| F14 | Shopify Help, «Facebook data sharing» | Nivel Máximo comparte nombre, ubicación, correo, teléfono y comportamiento de navegación; la comerciante debe informarlo en su política | https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing |
| F15 | Script publicado del banner de Shopify de esta tienda | Un enlace cuyo destino termina en `#shopifyReshowConsentBanner` reabre las preferencias | https://radaelliswimwear.com/cdn/shopifycloud/privacy-banner/storefront-banner.js |
| F16 | MINCIT, proyecto de decreto sobre reversión de pagos (sep. 2025; estado no verificado) | Solo para advertir un posible cambio futuro | https://incp.org.co/publicaciones/infoincp-publicaciones/2025/09/mincit-propone-nuevas-reglas-para-la-reversion-de-pagos-en-el-comercio-electronico/ |
| F17 | SIC, Resolución 31470 de 2020 (considerandos) | Observó términos que eluden responsabilidad por inexactitudes de precios (medida temporal; se cita solo como refuerzo) | https://sisjur.bogotajuridica.gov.co/sisjur/normas/Norma1.jsp?i=94261 |

Hechos de la ley que sostienen el diseño:
- **Retracto** (F1, art. 47): 5 días hábiles desde la entrega; el consumidor devuelve el producto por los mismos medios y en las mismas condiciones en que lo recibió y paga el transporte y demás costos de la devolución; siete excepciones (num. 1 a 7, la 7 es «bienes de uso personal»).
- **Dinero del retracto** (F2, art. 3): máximo 15 días calendario desde que se ejerce el derecho y se cumplen (i) datos correctos y completos y (ii) devolución del producto; todos los actores, incluida la entidad financiera, cumplen el plazo; el proveedor informa «de manera clara, detallada y específica» las opciones que tiene. Art. 5: medio de pago que prefiera el consumidor.
- **Garantía** (F1, arts. 7, 8, 10, 11, 16): responsabilidad solidaria; término el anunciado (un año si no se anuncia); reparación gratuita incluido el transporte; si no se repara, reposición o dinero; solo se exonera por fuerza mayor o caso fortuito, hecho de un tercero, uso indebido o no seguir las instrucciones, y debe demostrar el nexo causal.
- **Comercio electrónico** (F1 art. 50 con F2 art. 4): identidad; información del producto; medios de pago, tiempo de entrega, retracto y su procedimiento; precio total con envío por separado; condiciones generales accesibles antes y después; resumen del pedido; acuse de recibo a más tardar el día calendario siguiente; PQR con radicado, fecha y hora y seguimiento; entrega en el plazo aceptado o, si no se fijó, en máximo 30 días calendario; devolución en 15 días calendario si no se entrega; enlace a la autoridad de protección al consumidor.
- **Reversión del pago** (F1 art. 51, F3): causales, queja al proveedor y aviso al emisor dentro de 5 días hábiles; 15 días hábiles para revertir.

---

## 3. Auditoría de los textos LIVE (2026-10-02)

Lectura por Admin GraphQL (`shopPolicies`, `pages`, `deliveryProfiles`) y de la portada pública. Gravedad: C crítica (contradice la ley o la realidad), A alta, M media, B baja.

| # | Gr. | Dónde | Hallazgo |
|---|---|---|---|
| 1 | C | REFUND_POLICY | «Por tratarse de prendas de baño e higiene íntima, no aceptamos devolución ni cambio cuando el cliente simplemente cambió de opinión» niega el retracto por categoría (Ley 1480 art. 47; LEGAL_GAP_1). |
| 2 | C | REFUND_POLICY | «Debes reportarlo dentro de los 5 días hábiles…» mezcla el retracto con la garantía y limita defectos a 5 días, cuando la garantía anunciada es de 12 meses (arts. 8 y 43 num. 1 y 2). |
| 3 | C | REFUND_POLICY | «Evaluamos cada caso antes de aprobar la devolución» y «desgaste normal» como exclusión: la garantía solo se exonera por las causales del art. 16 y con prueba del nexo causal. |
| 4 | A | REFUND_POLICY | No menciona retracto, plazo de 15 días calendario, medios de devolución del dinero, reversión del pago, número de radicado ni SIC. |
| 5 | A | REFUND_POLICY | Canal «WhatsApp o Instagram», sin constancia con radicado (art. 50 lit. g). |
| 6 | C | SHIPPING_POLICY y `/pages/envios` | «El costo del transporte no queda incluido en el pago del pedido: nuestro equipo te contacta… acordar cómo la pagas» contradice el Admin (5 tarifas fijas que se cobran en el checkout) y el art. 50 lit. c (envío informado por separado antes de comprar). |
| 7 | C | SHIPPING_POLICY | «Envío express: 24 a 48 horas» no existe en el Admin (solo «Envío estándar» y «Envío estándar gratis»). |
| 8 | A | SHIPPING_POLICY | «3 a 5 días hábiles… son estimados y pueden variar» no fija un plazo aceptado; el Admin no muestra plazo en ninguna tarifa (`description = null`); falta la regla de 30 días y el derecho a terminar y recibir el dinero (art. 50 lit. h). |
| 9 | M | SHIPPING_POLICY | «Envia como transportadora principal» no está verificado; enlaces relativos y `/#contacto`. |
| 10 | A | TERMS_OF_SERVICE y `/pages/terminos` | Sin identidad del vendedor, sin plazo de entrega, sin retracto/reversión, sin PQR/radicado, sin enlace a la SIC; la aceptación solo se presume por comprar (arts. 37, 48, 50 lit. d). |
| 11 | A | TERMS_OF_SERVICE | «Nos reservamos el derecho de corregir un precio publicado por error…»: el consumidor solo está obligado a pagar el precio anunciado (art. 26); CHATGPT_REVIEW_REQUIRED_LEGAL. |
| 12 | M | TERMS_OF_SERVICE | Medios de pago «tarjeta, PSE, Nequi o Bancolombia»: omite American Express y Daviplata, que sí figuran en el checkout (LEGAL_GAP_10); voseo («podés», «consultá»). |
| 13 | M | `/pages/garantia` | «Esta garantía es distinta a nuestra Política de devoluciones (para prenda equivocada o daño en el transporte)»; «desgaste normal» como exclusión; «evaluamos y te confirmamos si está cubierto». |
| 14 | A | CONTACT_INFORMATION y `/pages/contact` | PQR sin número de radicado ni seguimiento; sin formulario en el sitio; sin enlace a la SIC. |
| 15 | A | Pie del sitio (portada) | No hay enlace a la SIC ni enlace para reabrir las preferencias de cookies. Enlaces del pie: Envíos (página), Devoluciones (política nativa), Garantía, Términos (página), Privacidad (página), Cookies (página), Información de contacto, Aviso legal. |
| 16 | M | Portada | Formulario de suscripción sin aviso de autorización ni enlace a la política; voseo; promoción «20 % de descuento en toda la tienda» «por tiempo limitado» sin fecha. |
| 17 | B | PRIVACY_POLICY y `/pages/privacidad` | El cuerpo ya está corregido (sin Resend ni Cloudinary; Shopify, Wompi, Envia, Meta y derechos de la Ley 1581 presentes). Quedan los ajustes de 4.8. **Pero** la auditoría en vivo paralela (K1) muestra que `/policies/privacy-policy`, la que enlaza el checkout, sigue sirviendo el texto automático de Shopify; ver 5.9. |
| 18 | B | `/pages/cookies` | Ya corregida (dice «solo si las aceptas»; no dice que no use cookies de marketing). Quedan los ajustes de 4.9. El banner ofrece una categoría «Personalización» que la página no describe. |
| 19 | M | Estructura | Hay dos copias de cada política (nativa y página) que pueden quedar distintas (LEGAL_GAP_20). |
| 20 | A | Banner de cookies | El enlace «Política de privacidad» del banner apunta a `/es/policies/privacy-policy` (404, según la auditoría paralela); ver 5.9. |

Verificado sin hallazgos: identidad y contacto aprobados presentes en CONTACT_INFORMATION, LEGAL_NOTICE y la política de privacidad; ninguna referencia a Resend, Cloudinary ni Vercel en las políticas ni en las páginas leídas; cinco zonas que cubren las 33 provincias (32 departamentos y Bogotá, D.C.), cada una con su tarifa y su tarifa gratuita desde 299.900, en el Admin.

---

## 4. Redlines por documento

### 4.1 Política de devoluciones → `refund-policy.html`  (puntos a, b y c)

| Texto actual (cita corta) | Propuesta | Fuente |
|---|---|---|
| «Aceptamos devolución o cambio **únicamente** cuando el producto presenta: defecto…, una prenda distinta…, daño…» | Se reemplaza por cuatro derechos separados: retracto, garantía legal, reversión del pago y cambio voluntario, con una guía «cuál derecho aplica en cada caso». Se elimina «únicamente». | F1 arts. 7, 11, 43 num. 1–2, 47, 51 |
| «Debes reportarlo dentro de los 5 días hábiles… Evaluamos cada caso antes de aprobar la devolución.» | Los 5 días hábiles quedan **solo** para el retracto (art. 47) y para la queja de reversión (art. 51 y Decreto 587). La garantía dura 12 meses. «Evaluamos antes de aprobar» pasa a «revisamos tu caso y te respondemos por escrito». | F1 arts. 8, 43 num. 7, 47, 51; F3 art. 2.2.2.51.4 |
| «Por tratarse de prendas de baño e higiene íntima, no aceptamos devolución ni cambio cuando el cliente simplemente cambió de opinión…» | **Se elimina.** Nuevo texto: retracto «cuando legalmente proceda»; lista literal de las siete excepciones; «no aplica estas excepciones de forma automática ni por categoría… no considera que un traje de baño esté excluido solo por serlo»; si cree que aplica una, lo explica por escrito antes de negar. | F1 art. 47 num. 7; F7; F8; LEGAL_GAP_1 (CHATGPT_REVIEW_REQUIRED_LEGAL) |
| «La prenda fue usada (mar, piscina, playa) o lavada, o no conserva etiquetas originales y el protector de higiene intacto» | En el retracto: «en las mismas condiciones en que lo recibiste» = sin señales de uso, con etiquetas y protector de higiene si lo traía, en un empaque que lo proteja. En garantía no es una exclusión general: aplica solo «uso indebido» demostrado. | F1 art. 47 inc. 2, art. 16; LEGAL_GAP_2 (CHATGPT_REVIEW_REQUIRED_LEGAL) |
| «El daño es por mal uso, desgaste normal o cuidado inadecuado» | Solo las causales del art. 16, con prueba del nexo causal; «desgaste normal» se retira como exclusión propia. | F1 art. 16 y parágrafo; F9 |
| «El reporte se hace fuera del plazo de 5 días hábiles» | Se elimina para garantía y defectos. | F1 arts. 8 y 43 |
| «Costo de envío de la devolución… corre por cuenta de Radaelli Swimwear» (defecto, prenda distinta, transporte) | Se mantiene para garantía y producto distinto o dañado. En el retracto, por ley, el transporte lo asume la clienta (se dice expresamente). | F1 art. 11 num. 1; art. 47 inc. 2 |
| «Escríbenos por WhatsApp o Instagram con tu número de pedido…» | Canales: correo y WhatsApp (los publicados). Se pide: nombre, pedido, correo, derecho que usa, evidencia y, si quiere transferencia, datos de la cuenta. Respuesta con **número de radicado, fecha y hora**. | F1 art. 50 lit. g (F2 art. 4); F2 art. 3 (datos) |
| «Al recibir y verificar el producto, coordinamos el cambio o el reembolso» | Devolución del dinero en máximo 15 días calendario desde que se ejerce el derecho y se cumplen datos y devolución; opciones de devolución informadas; sin descontar comisiones; envío pagado se devuelve si devuelve todo el pedido. | F2 arts. 3 y 5; F1 art. 47 inc. 1; LEGAL_GAP_3, 4, 5 |
| (no existe) | **Sección «Reversión del pago»**: causales, 5 días hábiles, constancia, aviso al emisor, 15 días hábiles. | F1 art. 51; F3 arts. 2.2.2.51.1–2.2.2.51.8 |
| (no existe) | Producto distinto, dañado o que no llegó: la clienta elige producto correcto o dinero; no llega en plazo: terminar el contrato y dinero en 15 días. | F1 art. 50 lit. h (F2 art. 4); art. 7 y 11 |
| (no existe) | Enlace a la SIC. | F1 art. 50 parágrafo; F6 |
| `<a href="/pages/garantia">` (enlace relativo) | `https://radaelliswimwear.com/pages/garantia` | — |

Texto sobre cambio voluntario propuesto (por defecto, conservador): «Por ahora no ofrecemos cambios voluntarios de talla o estilo fuera de los casos de las secciones anteriores. Si quieres devolver tu compra por la talla o por cualquier otra razón, puedes usar tu derecho de retracto, cuando legalmente proceda, dentro de los 5 días hábiles siguientes a la entrega.» Fuente: F9 y F7 (el cambio voluntario solo existe como política comercial anunciada). Variante B en la sección 5.5.

### 4.2 Bloque «Reversión del pago» y PQR  (punto b)

**Reversión del pago** (ya incluido en `refund-policy.html`, sección 4; copia del texto aquí para revisión):

> Si pagaste con tarjeta de crédito, tarjeta débito u otro instrumento de pago electrónico, puedes pedir que se reverse el pago cuando: (1) fuiste víctima de fraude; (2) el cobro corresponde a una operación que no solicitaste; (3) no recibiste el producto; (4) el producto que recibiste no corresponde a lo que pediste o no tiene las características informadas; o (5) el producto llegó defectuoso. Si compraste varios productos, puedes pedir la reversión solo del valor de los productos con problema.
> 1. Preséntanos tu queja dentro de los **5 días hábiles** siguientes a la fecha en que supiste del fraude o del cobro no solicitado, en que debías recibir el producto, o en que lo recibiste defectuoso o distinto. Puedes hacerlo por escrito, de forma verbal o por los canales de esta página. Dinos las razones, la causal, el valor que pides reversar y la tarjeta, cuenta o instrumento al que se hizo el cargo.
> 2. Si se trata de un producto, dinos en esa misma queja que lo tienes a nuestra disposición para que lo recojamos en las mismas condiciones y en el mismo lugar en que lo recibiste. Con eso se entiende cumplida tu obligación de devolverlo.
> 3. Te damos una **constancia** de tu queja, con la fecha y la causal.
> 4. **Avisa a quien emitió tu tarjeta o instrumento de pago** dentro de esos mismos 5 días hábiles, por los canales de esa entidad, con la constancia de tu queja. Esa entidad y los demás participantes del pago tienen 15 días hábiles para hacer la reversión.
> La reversión aplica cuando nosotros y quien emitió tu instrumento de pago estamos domiciliados en Colombia. No reemplaza tu garantía ni tu derecho de retracto.

Fuente: Ley 1480 de 2011, art. 51 (F1); Decreto 1074 de 2015, arts. 2.2.2.51.1 (ámbito y domicilio en Colombia), 2.2.2.51.2 (causales, incluidas las de «no cumple las características informadas» y «defectuoso»), 2.2.2.51.3 (reversión parcial), 2.2.2.51.4 (queja en 5 días hábiles, por escrito, verbal o por el medio acordado; producto a disposición; constancia con fecha y causal), 2.2.2.51.5 (contenido de la queja), 2.2.2.51.6 (aviso al emisor en el mismo plazo), 2.2.2.51.8 (15 días hábiles) (F3). Riesgos: LEGAL_GAP_14.

**PQR** (ya incluido en `contact-information.html`; copia aquí):

> Puedes presentar una petición, queja o reclamo por correo electrónico (radaelliswimwear@gmail.com) o por WhatsApp (3135359668). Escríbenos con tu nombre, tu número de pedido (si tienes uno) y el motivo.
> 1. Cuando recibimos tu mensaje, te respondemos por el mismo canal con un **número de radicado**, la **fecha y la hora** en que lo recibimos y el tipo de solicitud. Ese mensaje es tu constancia.
> 2. Con ese número de radicado puedes pedirnos, cuando quieras, el estado de tu caso (seguimiento).
> 3. Te respondemos por escrito y te explicamos qué decidimos y por qué.

Fuente: Ley 1480, art. 50 lit. g (F1 con F2 art. 4: canal de fácil acceso, constancia con número de radicado, fecha y hora, y seguimiento); Decreto 1074 art. 2.2.2.51.4 (constancia de la queja de reversión) (F3).
**Plazo de respuesta:** no se encontró un plazo en la Ley 1480 para las PQR del proveedor, por eso el texto **no promete número de días**. `[DECISIÓN DUEÑA: plazo máximo de respuesta; opción sugerida 15 días hábiles, igual al de reclamos de datos (Ley 1581, art. 15), aunque no lo exige la Ley 1480]`. Si lo decide, agregar la línea: «Te respondemos en máximo [15] días hábiles.»
**Radicado mínimo y estándar:** hoja de cálculo con columnas `radicado` (formato `PQR-AAAAMMDD-NNN`), `fecha y hora de recibo`, `canal`, `tipo` (retracto, garantía, reversión, PQR, datos), `estado`, `fecha de respuesta`. Cada respuesta inicial incluye el radicado. Es manual; el formulario nativo de contacto de Shopify (sección 5.6) deja además fecha y hora en el correo de la tienda. Riesgo: LEGAL_GAP_6.

### 4.3 Enlace a la SIC  (punto c) → `sic-link-block.html`

- **Obligación:** Ley 1480, art. 50, parágrafo: enlace visible y fácilmente identificable a la página de la autoridad de protección al consumidor. La SIC confirma que es obligatorio en comercio electrónico y que **no** es obligatorio el logotipo (Concepto 25-310342, F6).
- **URL oficial verificada (HTTP 200, 2026-10-02):** https://www.sic.gov.co/ . De apoyo: https://sedeelectronica.sic.gov.co/temas/proteccion-al-consumidor .
- **Texto del enlace (solo texto, sin logotipo):** «Superintendencia de Industria y Comercio (SIC)». Párrafo para políticas: «La Superintendencia de Industria y Comercio (SIC) es la autoridad de protección al consumidor de Colombia. Si quieres conocer tus derechos como consumidor o presentar una queja, entra a la página de la Superintendencia de Industria y Comercio (SIC).»
- **Dónde:** línea en la columna «Ayuda» del pie del sitio (cambio de tema o de menú, sección 5.1) y párrafo en Información de contacto, devoluciones, garantía y términos (ya incluido en esos HTML).

### 4.4 Política de envíos → `shipping-policy.html`  (punto d)

Hechos del Admin (perfil «Perfil general», origen «Shop location», Barranquilla; 10 tarifas activas; condición `TOTAL_PRICE`):

| Zona en el Admin | Departamentos | Tarifa | Envío gratis |
|---|---|---|---|
| Zona 1 — Barranquilla y Atlántico | Atlántico | $9.900 | desde $299.900 |
| Zona 2 — Resto del Caribe | Bolívar, Cesar, Córdoba, La Guajira, Magdalena, Sucre | $12.900 | desde $299.900 |
| Zona 3 — Ciudades principales | Antioquia, Bogotá D.C., Caldas, Cundinamarca, Norte de Santander, Quindío, Risaralda, Santander, Valle del Cauca | $17.900 | desde $299.900 |
| Zona 4 — Resto del país | Arauca, Boyacá, Caquetá, Casanare, Cauca, Chocó, Huila, Meta, Nariño, Putumayo, Tolima | $21.900 | desde $299.900 |
| Zona 5 — San Andrés y Amazonía | Amazonas, Guainía, Guaviare, San Andrés y Providencia, Vaupés, Vichada | $44.900 | desde $299.900 |

Las tarifas pagadas son de $0 a $299.899 y la gratuita de $299.900 en adelante. Total: 32 departamentos y Bogotá, D.C. (33 provincias).

| Texto actual (cita corta) | Propuesta | Fuente |
|---|---|---|
| «Para compras inferiores a este valor, el costo del envío será asumido por el cliente y se informará antes del despacho, de acuerdo con el destino y la tarifa vigente de la transportadora» | Tabla con las 5 tarifas por departamento; «se muestra por separado… antes de que pagues». | F1 art. 50 lit. c; art. 26 inc. 2 |
| Sección «Coordinación del envío en compras inferiores a $299.900: …nuestro equipo te contacta después de confirmada la compra… pago directo a la transportadora» | **Se elimina** (contradice el checkout). | F1 art. 50 lit. c y d |
| «Envío estándar: 3 a 5 días hábiles. Envío express: 24 a 48 horas (ciudades principales)» | Se elimina el express (no existe en el Admin). Plazo: máximo 30 días calendario desde el día siguiente al pedido, con el derecho a terminar y recibir todo en 15 días calendario. `[DECISIÓN DUEÑA: plazo comercial]` (LEGAL_GAP_7); variante en 5.4. | F1 art. 50 lit. h (F2 art. 4) |
| «Los tiempos… son estimados y pueden variar por condiciones climáticas, temporada alta o factores ajenos…» | Se elimina: el plazo aceptado obliga; no se limita el derecho a terminar el contrato. | F1 art. 50 lit. h; art. 43 num. 1 |
| «Trabajamos con Envia como transportadora principal a nivel nacional» | «Gestionamos los envíos con Envia y las transportadoras con las que opera.» | Hecho: Envia es la app de logística conectada |
| «(ya con el cupón aplicado, si usaste uno)» | «con los descuentos ya aplicados y antes del envío». Verificar con carrito real. | LEGAL_GAP_13 |
| «Cuando la transportadora genera número de guía, te lo compartimos» | Se mantiene («cuando despachamos… te enviamos el número de guía»). | — |
| «Reenvíos… te informamos el costo del reenvío antes de despacharlo» | Se mantiene, acotado a dirección errada o incompleta. | F1 art. 26 inc. 2 |
| (no existe) | Producto no disponible: se informa de inmediato; segunda fecha a solicitud; terminar el contrato con devolución en 15 días. | F1 art. 50 lit. h |
| `<a href="/pages/garantia">`, `/policies/refund-policy`, `/#contacto` | URLs absolutas; contacto por correo y WhatsApp. | — |

### 4.5 Términos y condiciones → `terms-of-service.html`  (punto e)

Mínimo: condiciones generales accesibles, imprimibles y descargables antes y después de la compra (F1 art. 50 lit. d), sin cláusulas que reduzcan derechos (F1 arts. 34, 37, 38, 42, 43, 44).

| Texto actual (cita corta) | Propuesta | Fuente |
|---|---|---|
| «Al realizar una compra en este sitio aceptas estos términos…» | «Al hacer clic en el botón para pagar… confirmas que leíste y aceptas… Tu aceptación nunca se presume por tu silencio.» Recomendación de casilla en el carrito (5.2). | F1 arts. 37 num. 1, 48, 50 lit. d; LEGAL_GAP_9 |
| (no existe) | **Quién vende:** Radaelli Swimwear, NIT, dirección de notificación, teléfono, correo (datos aprobados, sin alterar). | F1 art. 50 lit. a; LEGAL_GAP_11 |
| «Los precios se muestran en pesos colombianos (COP) e incluyen los descuentos vigentes» | Se mantiene COP; se agrega: es no responsable de IVA, por eso no se cobra IVA; el envío se ve por separado antes de pagar; el total aparece en el resumen; solo se paga el precio anunciado. | F1 arts. 26 y 50 lit. c |
| «Nos reservamos el derecho de corregir un precio publicado por error antes de confirmar el pago» | **Se elimina** (CHATGPT_REVIEW_REQUIRED_LEGAL). Reemplazo: «Solo estás obligado a pagar el precio que se te anunció». | F1 art. 26; art. 43 num. 7; F17 |
| (no existe) | **Promociones:** los términos obligan; si no hay fecha de fin, rige hasta que se anuncie su fin por los mismos medios; los productos con descuento mantienen retracto, garantía y reversión. | F1 art. 33; art. 7 parágrafo; LEGAL_GAP_18 |
| «Los pagos con tarjeta, PSE, Nequi o Bancolombia se procesan a través de la pasarela segura de Wompi…» | «Puedes pagar con tarjetas Visa, Mastercard y American Express, y con PSE, Nequi, Bancolombia y Daviplata. Los medios disponibles son los que Wompi te muestra al pagar.» (marcas del payload del checkout, `before/checkout-payment-config-extract.txt`) | F1 art. 50 lit. c; LEGAL_GAP_10 |
| «También podés coordinar tu compra directamente por WhatsApp.» | «Si coordinas tu compra con nosotros por WhatsApp, estos mismos términos y tus mismos derechos aplican.» | F1 art. 43 num. 2 |
| «Para cambios, devoluciones y defectos de fábrica, consultá…» | Sección «Retracto, garantía y reversión del pago» con plazos (5 días hábiles; 15 días calendario; 12 meses; 5 días hábiles + 15 días hábiles) y «Ninguna cláusula… reduce esos derechos». | F1 arts. 47, 51; F2 art. 3; F3 |
| «Radaelli Swimwear se reserva el derecho de actualizar estos términos; los cambios aplican a pedidos realizados después de su publicación.» | Se mantiene, y se agrega: «no modifican los pedidos ya realizados; cada versión indica su fecha». | F1 art. 38 (no modificar unilateralmente el contrato) |
| (no existe) | Resumen del pedido, cancelar antes de concluir, acuse de recibo a más tardar el día calendario siguiente. | F1 art. 50 lit. d; LEGAL_GAP_8 |
| (no existe) | Plazo de entrega y derecho a terminar el contrato; producto no disponible. | F1 art. 50 lit. h (F2 art. 4) |
| (no existe) | PQR con radicado y enlace a la SIC. | F1 art. 50 lit. g y parágrafo |
| (no existe) | Mayoría de edad / menores con representante. | F1 art. 52; LEGAL_GAP_17 |
| (no existe) | Ley aplicable, interpretación favorable y cláusula de salvaguarda («si una cláusula limitara tus derechos, no se aplica»). | F1 arts. 34, 43, 44 |
| «¿Tienes dudas? /#contacto» | Enlaces a las políticas y canales con URLs absolutas. | — |

No se agregaron cláusulas de propiedad intelectual, límites de responsabilidad ni jurisdicción: no son obligatorias, y las de limitación de responsabilidad podrían ser abusivas (F1 art. 43 num. 1).

### 4.6 Garantía → `garantia-page.html`

| Texto actual | Propuesta | Fuente |
|---|---|---|
| «garantía de 12 meses contados desde la fecha de entrega, por defectos de fabricación o de calidad» | Se mantiene (es el término anunciado). `[DECISIÓN DUEÑA: confirmar 12 meses]` | F1 art. 8 |
| «La garantía no cubre daños que resulten comprobadamente de un mal uso…, del desgaste normal por el uso, o de no seguir las indicaciones de cuidado» | Solo las cuatro causales del art. 16 y con prueba; se retira «desgaste normal». El cuidado solo se alega si se informó en castellano. | F1 art. 16; F9; LEGAL_GAP_12 |
| «Evaluamos el caso y te confirmamos si está cubierto» | «Revisamos tu caso con las pruebas… y te respondemos por escrito.» | F1 art. 43 num. 7 |
| «coordinamos la reparación, el cambio o el reembolso según corresponda» | Orden legal: reparación gratuita; si no se repara, cambio o dinero a elección; si se repite, a elección entre nueva reparación, devolución o cambio. Transporte a cargo de Radaelli. | F1 art. 11 num. 1–2; F9 |
| «Esta garantía es distinta a nuestra Política de devoluciones (para prenda equivocada o daño en el transporte)» | «Es distinta del derecho de retracto… y del cambio voluntario», con remisión a la política de devoluciones. | F1 arts. 7 y 47 |
| (no existe) | Número de radicado, enlace a la SIC. | F1 art. 50 lit. g y parágrafo |

### 4.7 Contacto → `contact-information.html`

| Texto actual | Propuesta | Fuente |
|---|---|---|
| «Escríbenos a radaelliswimwear@gmail.com indicando tu nombre, número de pedido y el motivo.» | Canales: correo y WhatsApp; respuesta con **número de radicado, fecha y hora**; seguimiento con ese número; respuesta por escrito. Plazo: `[DECISIÓN DUEÑA]` (4.2). | F1 art. 50 lit. g (F2 art. 4) |
| (no existe) | Párrafo y enlace a la SIC. | F1 art. 50 parágrafo; F6 |
| Datos de identidad (NIT, dirección, teléfono, correo) | Sin cambios. | F1 art. 50 lit. a; LEGAL_GAP_11 |

### 4.8 Política de privacidad → `privacy-policy-v2.html`  (punto f)

El texto vigente ya cumple el contenido mínimo del art. 2.2.2.25.3.1 del Decreto 1074 (responsable con NIT, domicilio, dirección, correo y teléfono; finalidades; derechos; área y procedimiento; vigencia) y ya no menciona Resend ni Cloudinary (F5, F11). Solo cambia lo que cambia:

| # | Texto actual | Texto propuesto | Motivo y fuente |
|---|---|---|---|
| P1 | «**No recibimos ni guardamos el número de tu tarjeta ni tus credenciales bancarias:** los escribes directamente en la página segura de Wompi.» | «**No recibimos ni guardamos el número de tu tarjeta ni tus claves bancarias:** los escribes… Wompi. Solo si eliges que te devolvamos dinero por transferencia, te pedimos el número de tu cuenta bancaria o de Nequi para enviártelo.» | La política de devoluciones v2 puede pedir datos de cuenta; hay que informarlo al recolectarlos (Ley 1581 art. 12; F4). |
| P2 | (no existe) | Nueva viñeta de datos: «**Datos de tus solicitudes** de retracto, garantía, reversión del pago o petición, queja o reclamo (PQR): tu mensaje, las fotos o videos, tu número de pedido, el número de radicado y la fecha y hora…» | Registro con radicado (F1 art. 50 lit. g); finalidad informada (F5). |
| P3 | «2. Atender tus consultas, cambios, devoluciones y garantías.» | «2. Atender tus consultas, cambios, devoluciones, garantías, retractos, reversiones del pago y PQR, llevar su registro con número de radicado, fecha y hora, y devolverte el dinero cuando corresponda.» | Finalidad explícita (Ley 1581 art. 4; F5). |
| P4 | «**Wompi**: procesa los pagos con tarjeta, PSE, Nequi y otros medios.» | **Sin cambio.** El payload del checkout declara visa, master, american_express, bancolombia, nequi, daviplata y pse, así que el texto vigente es compatible. | LEGAL_GAP_10 (gravedad baja). |
| P5 | «**La transportadora y el servicio de guías de envío** (por ejemplo, Envia.com)…» | «**Envia (aplicación de logística conectada a nuestra tienda en Shopify) y la transportadora que entrega tu paquete**…» | Descripción funcional precisa de un proveedor real (instrucción de ChatGPT, sección D). |
| P6 | «…compartimos con Meta Platforms los eventos de tu visita…: páginas y productos vistos, productos agregados al carrito y compras.» | «…: páginas y productos vistos, búsquedas, productos agregados al carrito, inicio del pago y compras (con su valor en pesos colombianos).» | Los eventos reales observados son PageView, ViewContent, AddToCart, InitiateCheckout (y Purchase, aún sin probar); la lista oficial de Shopify incluye Search (F14). |
| P7 | «Si no aceptas, no enviamos esos eventos a Meta desde tu navegador.» | «Si no aceptas o rechazas las cookies de marketing, configuramos la tienda para que respete tu elección y no comparta esos datos con Meta con fines de publicidad ni de medición.» | Con la API de Conversiones también hay envío desde servidor; el texto anterior solo hablaba del navegador. Redactado como configuración, no como garantía, porque el rechazo no está probado (LEGAL_GAP_15; F14). |
| P8 | «Puedes cambiar tu decisión cuando quieras desde el enlace de preferencias de cookies de la tienda…» | «…desde nuestra Política de cookies, con el enlace «Cambiar mis preferencias de cookies»…» | Hoy el pie no tiene ese enlace; la política de cookies v2 lo incluye con el mecanismo del banner (F15; Decreto 1377 art. 9). |
| P9 | «El detalle está en la Política de cookies.» | «El detalle, y cómo cambiar tu decisión, está en la Política de cookies.» | Coherencia. |
| P10 | «…una queja ante la SIC (www.sic.gov.co).» | Mismo texto con enlace a https://www.sic.gov.co/ | Ley 1581 art. 16 (F4); URL verificada. |
| P11 | «Mensajes de atención al cliente: el tiempo necesario para atender tu caso y la garantía.» | «Mensajes y solicitudes de atención al cliente (incluidos retractos, garantías, reversiones del pago y PQR): el tiempo necesario para atender tu caso y la garantía, y el que exijan las normas.» | Retención de datos de devoluciones (Decreto 1377 art. 11). |
| P12 | «Esta política rige desde el 2 de octubre de 2026. Si hacemos cambios sustanciales, te lo informaremos…» | Igual, más «Última actualización: [FECHA DE PUBLICACIÓN].» | Versión y vigencia (Decreto 1074 art. 2.2.2.25.3.1). |

Sin cambios, a propósito: la sección Shopify y su enlace de consumidores; la sección de transferencias (no se agregan países para Wompi, Envia ni Google porque no están verificados; LEGAL_GAP_19); derechos, procedimiento y plazos (Ley 1581 arts. 14, 15 y 16: 10 días hábiles +5 y 15 días hábiles +8; se verificaron en el texto de la ley); seguridad.
Pendiente fuera del texto: aviso de autorización en el formulario de suscripción (LEGAL_GAP_16; 5.3).

### 4.9 Política de cookies → `cookie-policy-v2.html`  (punto f)

El texto vigente ya no dice que no se usan cookies de estadísticas o de marketing: dice «solo si las aceptas». Cambios:

| # | Texto actual | Texto propuesto | Motivo y fuente |
|---|---|---|---|
| C1 | «No usamos Google Analytics.» | «Hoy no usamos Google Analytics. Si más adelante usamos otras herramientas de estadísticas o de publicidad, actualizaremos esta política antes de activarlas.» | GA4 no está conectado hoy (handoff 03R); el compromiso evita que el texto quede falso. |
| C2 | «…usamos el Píxel de Meta y la API de Conversiones… Si no las aceptas, no se envían esos datos a Meta desde tu navegador.» | «…el Píxel de Meta (en tu navegador) y la API de Conversiones (desde los servidores de Shopify)… Con la API de Conversiones, cuando haces una compra, Shopify también envía a Meta datos de contacto como tu nombre, ubicación, correo y teléfono. Si no las aceptas o las rechazas, configuramos la tienda para que respete tu elección y no comparta esos datos con Meta con fines de publicidad ni de medición.» | Nivel Máximo comparte esos datos (F14); acceso «Optimizado» respeta el consentimiento según el handoff 03R; sin prueba de rechazo (LEGAL_GAP_15). |
| C3 | Tabla: fila «Píxel de Meta (_fbp, _fbc)» | Se precisa «en tu navegador» y se agrega la fila «API de Conversiones de Meta (no usa cookies: envío entre servidores)». | Describir el segundo mecanismo sin afirmar más de lo verificado. |
| C4 | «Puedes aceptar, rechazar o cambiar tu decisión cuando quieras desde el aviso de cookies de la tienda.» | Enlace «Cambiar mis preferencias de cookies» (`href="#shopifyReshowConsentBanner"`) y alternativa «borra las cookies de este sitio… el aviso volverá a aparecer». | El pie no ofrece enlace; el mecanismo del banner se leyó en el script (F15). Probar el enlace en el navegador antes de publicar. |
| C5 | (no existe) | «Última actualización: [FECHA DE PUBLICACIÓN].» | Versión. |
| C6 | (no existe una sección de «Personalización») | Nueva sección «Cookies de personalización (solo si las aceptas)»: «El aviso de cookies también muestra la categoría «Personalización», que Shopify ofrece para recordar tus preferencias y adaptar la tienda a ti. Es opcional: si no la aceptas, la tienda funciona igual.» | El banner ofrece esa categoría (auditoría paralela, E8); no se afirma qué cookies concretas usa. |

Sin cambios: definición de cookies, categorías, duraciones aproximadas, mención de Wompi y hCaptcha, enlace a privacy.shopify.com. Las cookies necesarias se describen como «necesarias para el funcionamiento», sin afirmar que una norma colombiana las exima del consentimiento (F12; investigación D13).

---

## 5. Cambios fuera de los textos (no se aplicaron: son de tema o de ajustes de Shopify)

### 5.1 Enlace a la SIC en el pie
Agregar a la lista «Ayuda» una línea con el HTML de `sic-link-block.html` (USO 1). El pie actual: Envíos, Devoluciones, Garantía, Términos y condiciones, Privacidad, Cookies, Información de contacto, Aviso legal.

### 5.2 Casilla de aceptación en el carrito (LEGAL_GAP_9)
Texto propuesto: «He leído y acepto los [Términos y condiciones], la [Política de devoluciones] y la [Política de privacidad].» Obligatoria para continuar al pago. Alternativa sin casilla: la frase de los términos «al hacer clic en el botón para pagar… aceptas» (ya incluida), que es más débil como prueba.

### 5.3 Aviso de autorización en la suscripción (LEGAL_GAP_16)
Texto actual: «Dejá tu correo y recibí aviso apenas lancemos nuevas colecciones, promociones y ofertas — sin necesidad de crear una cuenta.»
Propuesta (tuteo + aviso): «Deja tu correo y recibe aviso apenas lancemos nuevas colecciones, promociones y ofertas — sin necesidad de crear una cuenta.» y, debajo del botón: «Al suscribirte autorizas que usemos tu correo para enviarte novedades, lanzamientos y promociones de Radaelli Swimwear, según nuestra [Política de privacidad]. Puedes cancelar cuando quieras.»

### 5.4 Plazo de entrega comercial (LEGAL_GAP_7)
Hoy el HTML publica el máximo legal (30 días calendario). Si la dueña decide un plazo menor, reemplazar el párrafo «Plazo de entrega» por: «Despachamos tu pedido en [X] días hábiles después de confirmado el pago. Una vez despachado, la entrega toma [Y a Z] días hábiles según el departamento. Si no te entregamos en ese plazo, puedes terminar el contrato y recibir todo lo que pagaste, sin retenciones ni descuentos, en máximo 15 días calendario.» Reglas: el plazo total no puede ser mayor que lo que la dueña esté dispuesta a cumplir; debe verse **antes de pagar** (descripción de cada tarifa en Envío y entrega, por ejemplo «Envío estándar (3 a 5 días hábiles después del despacho)», y en la ficha de producto); el sitio anterior decía 3 a 5 días hábiles y express 24 a 48 horas, y el express no existe en el Admin.

### 5.5 Variante B de cambio voluntario (si la dueña quiere ofrecerlo)
«Cambio voluntario de talla o estilo (política comercial de Radaelli Swimwear): puedes pedir un cambio de talla o estilo dentro de [N] días calendario desde la entrega, si la prenda está sin uso, con etiquetas y con el protector de higiene, y sujeto a disponibilidad. El costo de envío del cambio lo asume [quien decida la dueña]. Si no hay disponibilidad, te devolvemos el dinero. Esta política no limita tu retracto, tu garantía ni tu reversión del pago.»
Advertencia: cualquier frase que excluya trajes de baño de este cambio «por higiene» es política comercial válida según la SIC (F9), pero no debe redactarse de modo que parezca negar el retracto. Pasarla por CHATGPT_REVIEW_REQUIRED_LEGAL antes de publicar.

### 5.6 Formulario de PQR en el sitio (LEGAL_GAP_6)
Agregar el formulario de contacto nativo de Shopify a `/pages/contact` (hoy solo tiene texto), para que el canal esté «en el mismo medio» y el correo de la tienda guarde fecha y hora. El número de radicado sigue siendo manual en la respuesta.

### 5.7 Plantilla «Confirmación del pedido» (LEGAL_GAP_8)
Configuración > Notificaciones > Confirmación del pedido: comprobar que muestra tiempo de entrega, precio exacto, envío y forma de pago, y que sale el mismo día.

### 5.8 Enlace para reabrir preferencias de cookies en el pie (LEGAL_GAP_15)
Opcional además de la política de cookies v2: una línea del pie «Preferencias de cookies» con destino `#shopifyReshowConsentBanner` (el script del banner intercepta cualquier enlace cuyo destino termine así y abre las preferencias; F15). La auditoría paralela propone la alternativa de invocar `window.privacyBanner.showPreferences()` desde el tema; ambas son válidas. Probar en navegador limpio. Antes de afirmar en público que el rechazo se respeta, hacer la prueba descrita en LEGAL_GAP_15.

### 5.9 Política de privacidad automática y enlace del banner (LEGAL_GAP_20 y 15)
Hallazgos de la auditoría en vivo paralela (`audit-live-2026-10-02.md`, K1, K7, CHG-1 y CHG-2):
- `/policies/privacy-policy` y la copia que enlaza el checkout siguen sirviendo el texto genérico automático de Shopify, aunque el cuerpo guardado ya es el colombiano. **Antes de pegar `privacy-policy-v2.html` en PRIVACY_POLICY hay que desactivar la política generada automáticamente** (Admin > Configuración > Políticas) y comprobar que la URL muestre «Quién es el responsable de tus datos». Solo se hace desde la interfaz del Admin.
- El enlace «Política de privacidad» del banner de cookies apunta a `https://radaelliswimwear.com/es/policies/privacy-policy` (404). Opciones: una redirección en Tienda online > Navegación > Redirecciones (no se sabe si Shopify admite el prefijo `/es/`), o cambiar la URL desde la configuración de Privacidad del cliente. Hasta corregirlo, el banner no lleva a una política válida.

### 5.10 Enlaces relativos dentro de las políticas nativas
Los cuerpos vigentes de REFUND, SHIPPING, TERMS y LEGAL_NOTICE usan enlaces relativos (`/pages/garantia`, `/pages/envios`, `/pages/privacidad`, `/#contacto`) que se rompen en `checkout.shopify.com` (la auditoría paralela lo verificó: 404). Los HTML de este paquete ya usan enlaces absolutos. LEGAL_NOTICE no se reescribe aquí: solo necesita pasar `/pages/privacidad` y `/policies/contact-information` a URL absoluta y, opcionalmente, agregar el párrafo del enlace a la SIC (USO 2 de `sic-link-block.html`).

---

## 6. Orden de publicación y comprobaciones

Publicar solo con visto bueno de ChatGPT y de la dueña (regla: GO en chat). Cuando se publique:
1. Reemplazar `[FECHA DE PUBLICACIÓN]` en `refund-policy`, `shipping-policy`, `terms-of-service`, `garantia-page`, `privacy-policy-v2` y `cookie-policy-v2`; buscar «[» antes de guardar.
2. Publicar el mismo HTML en la política nativa **y** en la página equivalente el mismo día (envíos, términos, privacidad, contacto). Tabla: REFUND_POLICY (solo nativa); SHIPPING_POLICY + `/pages/envios`; TERMS_OF_SERVICE + `/pages/terminos`; PRIVACY_POLICY + `/pages/privacidad`; CONTACT_INFORMATION + `/pages/contact`; `/pages/garantia`; `/pages/cookies`. Para privacidad, primero 5.9 (política automática).
3. Respaldar el HTML vigente antes de cambiar. Los cuerpos leídos hoy están en `...\r03\legal\work\policy-*.html` y `page-*.html` (lectura de las 14:30 aprox.); sacar una copia nueva justo antes de publicar.
4. Después: comprobar HTTP 200 de las URLs del pie y de las políticas; que no aparezca «Resend», «Cloudinary», «Vercel», «Hoy no las usamos», «express 24», «coordinar el costo», «únicamente cuando»; que no haya voseo; y que los enlaces a `https://www.sic.gov.co/` respondan.
5. Hacer las pruebas de LEGAL_GAP_13 (umbral de envío gratis en un carrito) y LEGAL_GAP_15 (rechazo y enlace de preferencias) y registrar el resultado.

---

## 7. Decisiones de la dueña (todas con valor por defecto ya aplicado en los HTML)

| # | `[DECISIÓN DUEÑA]` | Valor por defecto aplicado | Alternativa |
|---|---|---|---|
| D1 | Término de garantía | 12 meses desde la entrega (lo publicado hoy) | Otro término anunciado, no menor a lo que quiera cumplir; si no anuncia, la ley da 1 año en productos nuevos |
| D2 | Opciones de devolución del dinero | Medio original (si la pasarela lo permite) y transferencia a cuenta bancaria o Nequi a nombre de quien compró; sin costo para la clienta | Solo medio original (solo si Wompi puede hacerlo siempre); consultar LEGAL_GAP_5 |
| D3 | Envío pagado en el retracto | Se devuelve si devuelve todo el pedido | No devolverlo (riesgo de retención; revisar con abogado) |
| D4 | Excepciones del retracto | No se aplican por categoría; explicación escrita antes de negar | Aplicar «uso personal» a ciertos productos (solo con criterio profesional; LEGAL_GAP_1) |
| D5 | Cambio voluntario | No se ofrece por ahora | Variante B (5.5) |
| D6 | Producto distinto o dañado | La clienta elige: producto correcto (si hay) o dinero; envíos a cargo de Radaelli | Reposición obligatoria (más restrictivo para la clienta) |
| D7 | Plazo de entrega | Máximo 30 días calendario | Variante con plazo comercial (5.4) |
| D8 | Medios de pago a listar | Visa, Mastercard, American Express, PSE, Nequi, Bancolombia y Daviplata (marcas del checkout) y «los que Wompi te muestra al pagar» | Lista exacta del panel de Wompi |
| D9 | Plazo de respuesta a PQR | Sin número de días | «15 días hábiles» (4.2) |
| D10 | Formato del radicado | `PQR-AAAAMMDD-NNN` | Otro consecutivo |
| D11 | Publicar que es no responsable de IVA | Sí, con la frase «Radaelli Swimwear es no responsable de IVA. Por eso no se te cobra IVA…». La auditoría paralela pide que la dueña autorice el texto exacto antes de publicarlo; el checkout ya muestra «Impuestos $0.00» | Solo «el precio que ves, más el envío, es el total que pagas» (sin mencionar su condición tributaria) |
| D12 | Fecha de fin de la promoción 20 % | Sin fecha; aplica el art. 33 | Poner fecha de fin |
| D13 | Nombre legal junto al nombre comercial | Sin cambios (datos aprobados) | Agregar nombre completo |
| D14 | Pedidos por WhatsApp | Mismas condiciones y derechos | Eliminar la mención si no se acepta |
| D15 | Reenvío por dirección errada | Se informa el costo antes de reenviar | Reenvío gratis |

---

## 8. Límites de esta revisión
- Existe una auditoría en vivo hecha en paralelo, `audit-live-2026-10-02.md` (misma carpeta, con evidencia en `before/`). Es complementaria: audita las superficies públicas y propone cambios CHG-1 a CHG-14. Este paquete es la redacción lista para pegar y los redlines. Su numeración de LEGAL_GAP y de R-n **no coincide** con la de `LEGAL_GAPS.md` (hay una tabla de equivalencias al inicio de ese archivo). Los temas de fichas de producto (composición, medidas, «sostenible», mensaje de stock) quedaron en esa auditoría y fuera de este paquete.
- Solo lectura sobre Shopify: consultas `shopPolicies`, `pages` y `deliveryProfiles`; lectura pública de la portada, de las políticas y del script del banner. No se abrió un checkout, no se interactuó con el banner de cookies ni se tocó Meta, Wompi o Envia (los hechos de checkout y banner provienen de la auditoría paralela).
- No se verificó la plantilla de confirmación del pedido, las fichas de producto ni las etiquetas.
- Las fuentes del Gestor Normativo de la Función Pública se citan por URL; el texto se leyó en el Régimen Legal de Bogotá y, para la Ley 2439, en una copia PDF del Diario Oficial.
- Esto no sustituye el concepto de un abogado de consumo y datos personales, que se recomienda para LEGAL_GAP_1, 2, 3, 5, 11 y 15 antes de pauta paga.
