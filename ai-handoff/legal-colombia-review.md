# RADAELLI SWIMWEAR — REVISIÓN DE CUMPLIMIENTO COLOMBIA (03R)

Fecha: 2026-10-02
Estado: instrucciones de implementación para Claude basadas en fuentes oficiales colombianas. No sustituye representación jurídica ante una autoridad ni concepto profesional firmado.

## OBJETIVO
Dejar la tienda pública coherente con las obligaciones objetivas de comercio electrónico, protección al consumidor y tratamiento de datos aplicables en Colombia, sin inventar datos ni quitar derechos del consumidor.

## FUENTES OFICIALES BASE
- Ley 1480 de 2011 — Estatuto del Consumidor, arts. 46, 47, 49, 50 y 51 (Gestor Normativo Función Pública).
- Ley 2439 de 2024 — modificaciones de comercio electrónico y plazos de devolución.
- Ley 1581 de 2012 — protección de datos personales.
- Decreto 1074 de 2015 — contenido mínimo de políticas de tratamiento y ventas a distancia.
- Superintendencia de Industria y Comercio (SIC): conceptos y guías sobre políticas de tratamiento, cookies, retracto, reversión del pago y enlace obligatorio a la SIC.

## A. IDENTIDAD DEL VENDEDOR — YA RESUELTO, REVALIDAR
La tienda debe mostrar de forma clara y accesible, durante la oferta electrónica:
- nombre/razón social;
- NIT;
- dirección de notificación;
- teléfono;
- correo y demás contacto.

Claude: verificar que los datos aprobados por Daniela estén visibles y coherentes en Información de contacto / Aviso legal / página de contacto / footer según corresponda. No inventar datos.

## B. OBLIGACIONES DE COMERCIO ELECTRÓNICO — IMPLEMENTAR/VERIFICAR
Antes de marcar LEGAL PASS, comprobar:
1. Información suficiente de los productos: características relevantes, tallas, material/composición cuando esté disponible, cuidados y cualquier restricción importante.
2. Disponibilidad de producto/stock no engañosa.
3. Precio total claro; impuestos de cliente en cero mientras Daniela siga NO RESPONSABLE DE IVA según su instrucción; envío mostrado separadamente cuando aplique.
4. Medios de pago disponibles.
5. Tiempo/condiciones de entrega y cobertura.
6. Derecho de retracto y procedimiento, sin eliminar derechos por política comercial.
7. Reversión del pago en los casos legales (fraude, operación no solicitada, no recepción, producto distinto o defectuoso).
8. Condiciones generales accesibles antes y después de la transacción.
9. Mecanismo de PQR/reclamación que permita dejar constancia de fecha/hora y seguimiento cuando Shopify lo permita; si requiere solución complementaria, proponer la mínima nativa/estándar.
10. Enlace visible y fácilmente identificable hacia la Superintendencia de Industria y Comercio. La SIC ha reiterado que este enlace es obligatorio para comercio electrónico; no es necesario usar su logotipo.

## C. RETRACTO — REDACCIÓN CONSERVADORA
Ley 1480 art. 47: en ventas a distancia existe retracto dentro de 5 días hábiles desde la entrega, sujeto a excepciones legales. Ley 2439 de 2024 ajusta la devolución en comercio electrónico a máximo 15 días calendario una vez el consumidor ejerce el derecho y cumple sus obligaciones de devolución/datos.

IMPORTANTE PARA RADAELLI:
- NO afirmar automáticamente que todos los vestidos de baño están excluidos del retracto por ser “bienes de uso personal”.
- La SIC ha interpretado “bienes de uso personal” de forma restrictiva, refiriéndolos a bienes destinados al cuidado personal; por tanto la clasificación de swimwear no debe presumirse sin base específica.
- Sí se puede exigir que el bien sea devuelto en las mismas condiciones en que fue recibido cuando el retracto legal proceda.
- Diferenciar claramente: retracto ≠ garantía por defecto ≠ cambio voluntario de talla/estilo.
- La garantía legal por falta de calidad/idoneidad no debe eliminarse por una política de higiene o no-cambios.

Claude debe redactar una política que reconozca el retracto “cuando legalmente proceda”, liste las excepciones legales sin expandirlas, explique plazo y procedimiento, y mantenga garantía/reversión separadas.

## D. POLÍTICA DE PRIVACIDAD / TRATAMIENTO — CORREGIR STACK ACTUAL
Eliminar referencias obsoletas a proveedores del stack anterior (por ejemplo Resend/Cloudinary) si ya no participan realmente en ese tratamiento. No mencionar un proveedor solo porque históricamente existió.

La política debe incluir como mínimo, de forma clara y en español:
- identidad y datos de contacto del Responsable del Tratamiento;
- finalidades del tratamiento;
- derechos del titular (conocer, actualizar, rectificar, suprimir cuando proceda, revocar autorización cuando proceda, solicitar prueba/información);
- canal para consultas/reclamos y procedimiento/plazos aplicables;
- forma de acceder a la política;
- vigencia/fecha de entrada en vigor y reglas de actualización;
- categorías de terceros/encargados reales necesarios para operar la tienda (Shopify, pasarela Wompi, logística Envia y Meta cuando corresponda), descritos con precisión funcional; no inventar transferencias concretas si no están verificadas;
- información sobre analítica/marketing y finalidades de Meta si se activa.

## E. COOKIES / META — IMPLEMENTACIÓN PRUDENTE PARA COLOMBIA
Ley 1581 exige que el tratamiento de datos personales se rija por finalidad, libertad/consentimiento, transparencia, acceso restringido y seguridad. Shopify además advierte que los niveles Enhanced/Maximum de Meta pueden compartir nombre, ubicación, email, teléfono y comportamiento de navegación.

Para Radaelli, con Meta en nivel Máximo:
- mantener banner de cookies/consentimiento activo para Colombia;
- ofrecer Aceptar / Rechazar / Administrar de forma comprensible;
- mantener Shopify/Meta en modo que respete el consentimiento (`Optimizado` según checkpoint actual), NO “Always on” mientras no exista fundamento distinto revisado;
- verificar técnicamente que rechazar marketing impide o limita los eventos de marketing como corresponde;
- actualizar la política de cookies: ya no puede decir “hoy no usamos cookies analíticas/de marketing” si Meta está conectado;
- describir cookies esenciales, funcionales/analíticas y marketing sin afirmar más de lo verificado;
- informar que Meta puede recibir datos para medición/atribución/publicidad conforme al consentimiento y la configuración activa.

No aceptar el mensaje de Shopify “banner no obligatorio en tu región” como conclusión jurídica suficiente; es una configuración de plataforma, no una exención legal colombiana.

## F. META / PUBLICIDAD
Legal/compliance no impide promoción orgánica de la web.
Paid Meta Ads: mantener HOLD técnico hasta certificar Purchase con valor COP, una sola compra lógica (sin duplicados), UTM/source attribution y conciliación con orden Shopify. Este HOLD es de calidad de medición, no una prohibición jurídica de anunciar.

## G. RESULTADO EXIGIDO A CLAUDE
Claude debe:
1. auditar los textos LIVE actuales;
2. preparar redlines/cambios exactos;
3. implementar cambios objetivos y reversibles que no requieran una decisión jurídica incierta de la dueña;
4. no inventar identidad, plazos comerciales, proveedores ni derechos;
5. validar links y accesibilidad pública;
6. crear evidencia antes/después;
7. registrar cualquier cuestión realmente incierta como `LEGAL_GAP_<n>` con norma, riesgo, opción conservadora y qué dato falta;
8. reportar `CHATGPT_REVIEW_REQUIRED_LEGAL` antes de introducir una cláusula que reduzca derechos del consumidor o dependa de interpretar una excepción legal.

## ACEPTACIÓN LEGAL PRÁCTICA
No marcar `LEGAL_COMPLIANCE_READY` hasta que estén verificados:
- identidad/contacto;
- privacidad/tratamiento actualizada;
- cookies/Meta coherentes;
- retracto/reversión/garantía sin contradicciones;
- PQR/contacto;
- envío/plazos/medios de pago/total de compra;
- enlace visible a SIC;
- ausencia de referencias falsas al stack anterior.
