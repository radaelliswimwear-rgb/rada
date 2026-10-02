# Auditoría legal LIVE (solo lectura) - radaelliswimwear.com - 2026-10-02

Auditor: Claude (solo lectura). Zona horaria: America/Bogotá. Capturas ANTES: 14:26 a ~15:10 (ver `before/_INDEX.txt`, 100+ archivos con hora y sha256).
Alcance: contraste de las superficies públicas EN VIVO contra `ai-handoff/legal-colombia-review.md` (secciones A, B1-B10, C, D, E). No es concepto jurídico firmado. Las normas se citan según el texto de ChatGPT y una lectura web de Ley 1480 arts. 46, 47, 50, 51 y Ley 2439 de 2024 (Alcaldía de Bogotá SISJUR / Función Pública / SIC concepto "Obligación de incluir enlace a la Superindustria"); **validar con asesor colombiano**.

Qué NO hice (por reglas): no modifiqué nada en Shopify/DNS/temas/páginas/políticas; solo consultas GraphQL de lectura (`shopPolicies`, `pages`, `products`, `deliveryProfiles`, `shop`); no ingresé datos personales (el checkout se miró con 1 artículo en un carrito anónimo, sin dirección, y el carrito se vació); en el banner de cookies probé solo "Rechazar todo" y **no** "Aceptar" (para no enviar eventos de producción a Meta). Efecto residual: 1 carrito/checkout anónimo y 2 sesiones de navegador sin consentimiento (excluirlas si se lee analítica de 14:26-15:10).

Leyenda: PASS / FAIL / PARCIAL / DESCONOCIDO. Citas <15 palabras.

---

## 0. Resumen: lo más grave primero

1. **Política de reembolso contradice el retracto (art. 47 Ley 1480).** No menciona retracto; excluye por "higiene íntima" y por "cambió de opinión"; ata todo a un plazo de 5 días hábiles solo para defectos; condiciona a "evaluamos cada caso". No hay reversión del pago (art. 51) ni plazo de reembolso (15 días calendario). Es justo lo que ChatGPT pide NO hacer automáticamente.
2. **No hay enlace visible a la SIC en ninguna parte** (pie, contacto, términos, políticas, checkout). Solo aparece "www.sic.gov.co" como texto plano dentro de /pages/privacidad (parágrafo art. 50 Ley 1480).
3. **Dos políticas de privacidad distintas EN VIVO.** `/pages/privacidad` (texto colombiano, ya publicado) y `/policies/privacy-policy` (la que enlazan el checkout, `agents.md` y el banner) **sigue renderizando el texto genérico automático de Shopify**, con teléfono en blanco ("llámenos al ,"), referencias al EEE y sin Ley 1581/SIC. El cuerpo almacenado en Admin ya es el nuevo (9.356 caracteres de texto, idéntico al de la página) pero NO es lo que se sirve: casi seguro la política automática sigue activa (DESCONOCIDO: el interruptor solo se ve en la UI de Admin).
4. **El enlace "Política de privacidad" del banner de cookies da 404** (`/es/policies/privacy-policy`; todo el prefijo `/es/` da 404). Y las políticas prometen "el enlace de preferencias de cookies de la tienda" que **no existe** (no hay control visible para reabrir el banner).
5. **Política de envío contradice el checkout real**: dice que el transporte "no queda incluido en el pago" y se coordina después; el checkout cobra tarifa por zona (9.900/12.900/17.900/21.900/44.900; gratis desde 299.900). Además anuncia "Envío express 24 a 48 horas" y en Shopify solo existe "Envío estándar".
6. **Fichas de producto**: sin composición/material (solo "Tejido texturizado con forro interior" en 10 de 29), sin guía de medidas; mensaje de stock "Solo quedan 3 unidades" mostrado por talla cuando cada talla tiene 1 unidad.
7. **PQR**: un solo correo, sin constancia de fecha/hora ni plazo de respuesta (salvo datos personales); el reembolso/garantía se atiende por WhatsApp/Instagram (canal distinto).
8. **Promoción "20% de descuento en toda la tienda - Por tiempo limitado"** sin vigencia ni condiciones; "Compra de forma sostenible" sin soporte visible.
9. **Enlaces rotos desde las políticas alojadas en checkout.shopify.com** (`/pages/garantia`, `/pages/envios`, `/pages/privacidad`, `/#contacto` apuntan a checkout.shopify.com y dan 404).
10. Resto: voseo mezclado, textos duplicados (políticas nativas vs páginas), idioma `/en` con cuerpos en español, handle de producto distinto al color del título.

Lo que SÍ está bien: identidad (NIT, dirección, teléfono, correo) coherente en contacto/aviso legal/privacidad; ninguna referencia a Resend/Cloudinary/Vercel/Neon/Next.js/Prisma/Google Analytics en superficies vivas; la página de cookies y la de privacidad ya NO dicen "hoy no las usamos"; banner con Aceptar/Rechazar/Administrar y categorías sin marcar; con "Rechazar todo" no se cargó `fbq` ni hubo peticiones a Facebook; IVA/Impuestos $0.00 en checkout con envío en línea separada.

---

## 1. Tabla de ítems

### A. Identidad del vendedor

| Ítem | Estado | URL | Evidencia corta / nota |
|---|---|---|---|
| A1 Nombre/razón social | PARCIAL | /policies/contact-information | "Radaelli Swimwear, NIT 1110581909-1." Es nombre comercial; que coincida con el nombre/razón social del RUT = DESCONOCIDO (LEGAL_GAP_1) |
| A2 NIT | PASS | /policies/contact-information, /policies/legal-notice, /pages/contact, /pages/privacidad | "NIT 1110581909-1" idéntico en las 4 |
| A3 Dirección de notificación | PASS | /policies/legal-notice, /policies/contact-information | "Calle 93 # 72 - 71 Ap 201 Tr 1 Cj Mirador del Parque" |
| A4 Teléfono | PARCIAL | /policies/contact-information (ok); /policies/privacy-policy (FAIL) | Contacto: "Teléfono y WhatsApp: 3135359668". Privacidad nativa: "llámenos al , envíenos un correo" (en blanco). Pie: "WhatsApp +57 313 535 9668" |
| A5 Correo | PASS | todas | radaelliswimwear@gmail.com en contacto, aviso legal, privacidad, nativa |
| A6 Coherencia entre superficies | PARCIAL | / (pie) | Pie solo muestra WhatsApp y "Información de contacto" (sin NIT/dirección directos; accesible por 1 clic). Privacidad nativa sin NIT/dirección. Admin `billingAddress` = "Calle 93 #72-71" (sin Ap; no público) |

### B. Comercio electrónico (puntos 1-10)

| Ítem | Estado | URL | Evidencia corta / nota |
|---|---|---|---|
| B1 Info suficiente de producto | PARCIAL | /products/brisa-natural-beige, /products/entero-golden-hour, /products/bikini-shadow-azul-marino | Sí: tallas S/M/L (XL en algunos), color, cuidados ("Lavar a mano con agua fría"), garantía. Falta: composición (0 de 29 con fibras/%), medidas/guía de tallas; "Tejido texturizado con forro interior" solo en 10 de 29. Mismo texto no distingue restricciones de uso |
| B2 Disponibilidad no engañosa | PARCIAL | /products/entero-golden-hour | "Solo quedan 3 unidades" se muestra para S, M y L; Admin: S=1, M=1, L=1 (el tema usa el total del producto). Resto: "Disponible" coherente (29 productos activos, 128 uds en Admin) |
| B3 Precio total / impuestos / envío aparte | PARCIAL | /cart y /checkout | Carrito: "El envío se confirma en el checkout." Checkout: Subtotal, Envío, "Impuestos $0.00", Total en líneas separadas. Falta: ningún texto público dice "precios sin IVA/IVA 0"; Términos solo dicen "incluyen los descuentos vigentes". Envío visible solo tras ingresar dirección |
| B4 Medios de pago | PARCIAL | /pages/terminos, /policies/terms-of-service; payload checkout | Términos: "tarjeta, PSE, Nequi o Bancolombia". Checkout (Wompi): visa, master, american_express, bancolombia, nequi, daviplata, pse. Términos omiten AmEx y Daviplata; no hay íconos de pago en tienda. Paso de pago no verificado (exige dirección) = DESCONOCIDO |
| B5 Entrega y cobertura | FAIL | /policies/shipping-policy, /pages/envios | "El costo del transporte no queda incluido en el pago del pedido" (falso vs checkout). "Envío express: 24 a 48 horas" (no existe en Shopify). "Envío estándar: 3 a 5 días hábiles" = DESCONOCIDO (sin respaldo en Shopify). Falta tabla de zonas/tarifas. Cobertura "Colombia" coincide con `shipsToCountries: CO` |
| B6 Retracto y procedimiento | FAIL | /policies/refund-policy | "Aceptamos devolución o cambio únicamente cuando el producto presenta" (defecto/error/daño). Única mención de "retracto" = un título en /policies/shipping-policy sin contenido |
| B7 Reversión del pago (art. 51) | FAIL | todas | 0 apariciones de "reversión" en cualquier superficie |
| B8 Condiciones generales accesibles | PARCIAL | /policies/terms-of-service, /pages/terminos | Accesibles desde pie y checkout, pero los Términos (1.137 caracteres) no incluyen retracto, reversión, PQR, plazos ni SIC. Correos transaccionales/post-compra = DESCONOCIDO (no auditados) |
| B9 PQR con constancia/seguimiento | PARCIAL | /pages/contact, /policies/contact-information | "Escríbenos a radaelliswimwear@gmail.com indicando tu nombre, número de pedido y el motivo." Sin plazo, sin radicado ni confirmación de fecha/hora; devoluciones/garantía por "WhatsApp o Instagram". Datos personales sí tienen plazos (/pages/privacidad) |
| B10 Enlace visible a la SIC | FAIL | pie de / ; /pages/contact; /pages/terminos; checkout | 0 enlaces a sic.gov.co. Solo texto plano "www.sic.gov.co" en /pages/privacidad (queja por datos) |

### C. Retracto - redacción conservadora

| Ítem | Estado | URL | Evidencia corta / nota |
|---|---|---|---|
| C1 Reconoce retracto (art. 47) cuando procede | FAIL | /policies/refund-policy | No aparece la palabra "retracto" |
| C2 No afirma exclusión automática por higiene | FAIL | /policies/refund-policy | "Por tratarse de prendas de baño e higiene íntima, no aceptamos devolución ni cambio" |
| C3 Distingue retracto / garantía / cambio voluntario | FAIL | /policies/refund-policy, /pages/garantia | Mezcla devolución=defecto; "Esta garantía es distinta a nuestra Política de devoluciones" (garantía vs devolución, no vs retracto); cambio voluntario no definido |
| C4 Plazo y procedimiento del retracto | FAIL | /policies/refund-policy | "Debes reportarlo dentro de los 5 días hábiles siguientes a la fecha de entrega" (el plazo existe pero aplicado solo a defectos) |
| C5 Reembolso en máx. 15 días calendario / medio de pago | FAIL | /policies/refund-policy | "coordinamos el cambio o el reembolso" sin plazo ni medio (0 hits "días calendario") |
| C6 Garantía y reversión separadas, sin eliminarse | PARCIAL | /pages/garantia vs /policies/refund-policy | Garantía: "garantía de 12 meses" (bien). Pero reembolso exige reporte en 5 días hábiles y excluye "desgaste normal"; reversión ausente |
| C7 "Evaluamos cada caso antes de aprobar" | FAIL | /policies/refund-policy | Aprobación discrecional no cabe en un derecho de retracto (CHATGPT_REVIEW_REQUIRED_LEGAL) |

### D. Privacidad / tratamiento

| Ítem | Estado | URL | Evidencia corta / nota |
|---|---|---|---|
| D1 Responsable identificado dentro de la política | PASS (página) / FAIL (nativa) | /pages/privacidad ; /policies/privacy-policy | Página: "El responsable del tratamiento ... es Radaelli Swimwear, NIT 1110581909-1". Nativa: sin NIT/dirección/teléfono |
| D2 Finalidades | PASS / FAIL | ídem | Página: finalidades necesarias y opcionales separadas (1-7). Nativa: genérica "Marketing y publicidad" |
| D3 Derechos del titular (art. 8 Ley 1581) | PASS / FAIL | ídem | Página: lista conocer/actualizar/rectificar/prueba/revocar/gratis/SIC. Nativa: "Derecho a la portabilidad de los datos." (estilo UE), sin revocación |
| D4 Canal y plazos consultas/reclamos | PASS / FAIL | ídem | Página: "Consultas: respondemos en máximo 10 días hábiles." / 15 reclamos. Nativa: "plazo razonable" |
| D5 Forma de acceder a la política | PARCIAL | pie, banner, checkout, aviso legal, agents.md | Pie y aviso legal -> /pages/privacidad (ok). Banner -> /es/policies/privacy-policy = **404**. Checkout y agents.md -> política nativa genérica |
| D6 Vigencia y reglas de actualización | PASS (página) | /pages/privacidad | "Esta política rige desde el 2 de octubre de 2026." Nativa: "Última actualización: 2 de octubre de 2026" (otro texto) |
| D7 Terceros/encargados reales | PASS (con reservas) | /pages/privacidad | Shopify, Wompi, complemento de pagos, "Envia.com" ("por ejemplo"), Gmail, WhatsApp, Meta, hCaptcha. Envia en uso real = DESCONOCIDO (LEGAL_GAP_9); servicio técnico del plugin sin nombre |
| D8 Sin referencias al stack anterior | PASS | todas las superficies y cuerpos Admin | 0 hits: Resend, Cloudinary, Vercel, Neon, Next.js, Prisma, Supabase, GA/gtag/GTM, fbq en HTML |
| D9 Analítica/marketing y Meta descritos | PASS (página) / FAIL (nativa) | /pages/privacidad ; /policies/privacy-policy | Página: sección "Publicidad y medición con Meta". Nativa: "publicidad personalizada" genérica sin Meta |
| D10 Una sola política canónica coherente | FAIL | /pages/privacidad vs /policies/privacy-policy | Dos textos distintos y contradictorios en vivo (ver sección 3) |
| D11 Aviso de autorización en puntos de captura | PARCIAL | / (formulario de boletín) | "Dejá tu correo y recibí aviso apenas lancemos nuevas colecciones" sin enlace a la política ni aviso. Checkout: casilla "Enviarme novedades y ofertas" sin marcar (bien). Login de cuenta: solo "aceptas nuestros Términos del servicio" |

### E. Cookies / Meta

| Ítem | Estado | URL | Evidencia corta / nota |
|---|---|---|---|
| E1 Banner activo para Colombia | PASS | / (visitante CO) | "Consentimiento para el uso de cookies" |
| E2 Aceptar / Rechazar / Administrar | PASS | / | Botones: "Administrar preferencias", "Aceptar", "Rechazar"; panel con Aceptar todo / Rechazar todo / Guardar |
| E3 Categorías no premarcadas | PASS | / panel | Personalización, Marketing, Analítica sin marcar; solo "Obligatorio" marcado |
| E4 Antes de decidir no se carga Meta | PASS | / | `typeof fbq` = undefined; trekkie = "awaiting-consent"; solo cookie `localization=CO` |
| E5 Rechazar limita eventos de marketing | PARCIAL | /products/entero-golden-hour | Tras "Rechazar todo": fbq undefined, 0 peticiones a facebook/fbevents. Server-side (CAPI, `facebookCapiEnabled: true`) = DESCONOCIDO (LEGAL_GAP_8). "Aceptar" no probado a propósito |
| E6 Modo Shopify/Meta "Optimizado" (no "Always on") | DESCONOCIDO | - | No verificable desde lo público ni con el token de lectura. Comportamiento observado compatible con respetar consentimiento |
| E7 Política de cookies actualizada | PASS | /pages/cookies | Ya no dice "Hoy no las usamos": "Si no las aceptas, no se envían esos datos a Meta desde tu navegador." |
| E8 Categorías sin afirmar más de lo verificado | PARCIAL | /pages/cookies | Tabla con duraciones "aproximadas" (bien). El banner ofrece "Personalización" y la página no la describe; telemetría Shopify (monorail/otlp) tras rechazar sin describir = DESCONOCIDO |
| E9 Informa que Meta recibe datos (medición/atribución/publicidad) | PASS | /pages/privacidad | "También compartimos tus datos de contacto (nombre, ubicación, correo y teléfono)" |
| E10 Enlace del banner a la política | FAIL | / (banner) | Enlace -> https://radaelliswimwear.com/es/policies/privacy-policy = HTTP 404; incluso corregido llevaría a la política genérica |
| E11 Poder cambiar la decisión después | FAIL | /pages/cookies, /pages/privacidad | Promesa: "desde el enlace de preferencias de cookies de la tienda" / "desde el aviso de cookies de la tienda". Realidad: tras decidir el banner desaparece y no hay enlace visible (existe `privacyBanner.showPreferences` pero ningún botón lo invoca) |

---

## 2. Búsquedas específicas pedidas

1. **Enlace a SIC**: FAIL. 0 enlaces a sic.gov.co en pie, menús, contacto, términos, políticas nativas, checkout. Solo texto plano en /pages/privacidad.
2. **Stack anterior**: PASS. 0 coincidencias de Resend, Cloudinary, Vercel, Neon, Next.js, Prisma, Supabase, Hostinger, Stripe, PayU, Mercado Pago, GA/GTM/gtag en HTML público, cuerpos Admin ni textos. "No usamos Google Analytics" (/pages/cookies) es verificable: sin GA/GTM en HTML.
3. **"Hoy no usamos cookies analíticas/de marketing"**: PASS (ya corregido). Ya no existe; la página describe Shopify Analytics y Meta como opcionales. Nuevo riesgo: las dos páginas prometen un control para cambiar la decisión que no existe (E11).
4. **Devoluciones**: ver sección C. Resultado: NO reconoce retracto; SÍ afirma exclusión por higiene; NO distingue retracto/garantía/cambio voluntario; NO menciona reversión del pago; contradice la garantía de 12 meses al fijar 5 días hábiles para defectos.
5. **PQR**: PARCIAL (B9). Canal = correo; plazos solo para datos personales; sin constancia.
6. **Envíos vs tarifas reales** (Admin `deliveryProfiles`, 2026-10-02): Zona 1 Atlántico 9.900; Zona 2 Bolívar, Cesar, Córdoba, La Guajira, Magdalena, Sucre 12.900; Zona 3 Antioquia, Bogotá, Caldas, Cundinamarca, Norte de Santander, Quindío, Risaralda, Santander, Valle 17.900; Zona 4 resto 21.900; Zona 5 Amazonas, Guainía, Guaviare, San Andrés, Vaupés, Vichada 44.900; todas "Envío estándar gratis" desde 299.900. `taxesIncluded: false`, `taxShipping: false`; checkout "Impuestos $0.00". La política NO publica zonas ni tarifas y describe un cobro posterior inexistente. El umbral de gratis (299.900) coincide: PASS.
7. **Contradicciones / enlaces**: ver secciones 3 y 4.
8. **Identidad del vendedor**: ver A. Coherente, salvo la política nativa de privacidad.

---

## 3. Contradicciones entre superficies

| # | Contradicción | Superficies |
|---|---|---|
| K1 | Texto de privacidad colombiano (almacenado) vs texto genérico automático (servido). Teléfono en blanco, "Espacio Económico Europeo", sin NIT/SIC | /pages/privacidad vs /policies/privacy-policy (y checkout.shopify.com/102428803371/policies/55627088171.html) |
| K2 | "garantía de 12 meses" vs "reportarlo dentro de los 5 días hábiles" para defectos | /pages/garantia vs /policies/refund-policy |
| K3 | Envío "no queda incluido en el pago" vs tarifa cobrada en checkout; express inexistente | /policies/shipping-policy vs checkout/Admin |
| K4 | Canal de reclamos: correo (contacto/PQR) vs WhatsApp/Instagram (devoluciones/garantía) | /pages/contact vs /policies/refund-policy |
| K5 | Promesa de cambiar preferencias de cookies vs ausencia de control | /pages/cookies, /pages/privacidad vs tienda |
| K6 | Términos: "También podés coordinar tu compra directamente por WhatsApp" (canal fuera del checkout) vs políticas pensadas para Shopify | /pages/terminos |
| K7 | Banner enlaza política que da 404; checkout y agents.md enlazan la política genérica; pie enlaza la colombiana | banner/checkout/pie |
| K8 | Textos duplicados nativo/página (envío, términos, contacto): hoy casi idénticos, derivarán al editar uno solo | /policies/* vs /pages/* |

---

## 4. Enlaces (HTTP, `before/link-check.csv`)

- Pie, menús, políticas y fichas: 41 destinos http(s) únicos; 40 responden 200 (incluye wa.me, redes, Wompi, Shopify, Facebook privacy). `/account` responde 406 a curl y en navegador redirige a shopify.com/authentication (login de cuentas nuevas) = funcional. Los enlaces `mailto:` no aplican a HTTP.
- **404 confirmados**: `https://radaelliswimwear.com/es/policies/privacy-policy` (enlace del banner; también `/es`, `/es/policies/refund-policy`, `/es/pages/cookies`). Páginas inexistentes que alguien podría esperar: /pages/devoluciones, /pages/cambios, /pages/retracto, /pages/pqr (404; no hay enlaces a ellas).
- **Rotos desde checkout.shopify.com** (cuerpos de políticas nativas con enlaces relativos): `/pages/garantia` (reembolso, envío, términos), `/pages/envios` (términos), `/pages/privacidad` (aviso legal), `/#contacto` (envío, términos). Verificado: `https://checkout.shopify.com/pages/garantia` = 404.
- `/en/...` responde 200 pero con cuerpos en español bajo títulos en inglés ("Refund policy").

---

## 5. Otras observaciones (bajo/medio)

- Voseo residual: "podés", "consultá" (Términos); "Dejá tu correo y recibí aviso", "Descubrí la colección y agregá tus favoritos" (inicio); "Guardá", "Recargá" (favoritos). El resto de la tienda usa tuteo.
- Handle/título de producto: `/products/bikini-shadow-azul-marino` muestra "BIKINI SHADOW NEGRO"; `enterizo-shadow-palm-azul-marino` aparece como "ENTERIZO SHADOW PALM NEGRO". Posible confusión de color en URL/compartidos.
- Garantía 12 meses: ¿cumple o supera la garantía legal para este bien? = DESCONOCIDO (no inventar plazo).
- `sitemap`/`agents.md` publican la política nativa genérica como "Política de privacidad".
- Producto en borrador `prueba-lanzamiento-interna` (DRAFT; no público).
- Términos: "Nos reservamos el derecho de corregir un precio publicado por error antes de confirmar el pago" (posible cláusula a revisar, ver R-5).

---

## 6. LEGAL_GAP (solo lo realmente incierto)

**LEGAL_GAP_1 - Identidad legal del vendedor.** Norma: Ley 1480 art. 50 (identificación). Riesgo: bajo-medio (se muestra nombre comercial + NIT). Conservadora: "Titular: <nombre completo según RUT>, NIT 1110581909-1, nombre comercial Radaelli Swimwear". Dato faltante: nombre/razón social exacta del RUT/registro mercantil y si hay establecimiento de comercio.

**LEGAL_GAP_2 - Retracto y "bienes de uso personal" en trajes de baño.** Norma: art. 47 Ley 1480 (excepción g) y criterio restrictivo de la SIC. Riesgo: alto (la política vigente niega el retracto). Conservadora: reconocer el retracto "cuando legalmente proceda", exigir devolución en las mismas condiciones y NO ampliar excepciones. Dato faltante: decisión de la dueña/asesor de invocar o no la excepción; ver R-1.

**LEGAL_GAP_3 - Ventana de 5 días hábiles para reportar defectos / error / daño de transporte.** Norma: garantía legal y art. 51; el plazo de 5 días hábiles del art. 47 es del retracto, no de la garantía. Riesgo: alto (reduce derechos; contradice "12 meses"). Conservadora: quitar el límite para garantía y remitir a /pages/garantia. Dato faltante: criterio de asesor sobre aviso de daño de transporte (art. 51 "producto defectuoso o distinto").

**LEGAL_GAP_4 - Plazos y servicios de entrega.** Norma: Ley 1480 art. 50 (plazo de entrega) y art. 46 (cerciorarse de la entrega). Riesgo: medio. "3 a 5 días hábiles", "express 24-48 horas" y "Envia como transportadora principal" no tienen respaldo verificable en Shopify. Conservadora: publicar solo lo confirmado, quitar express mientras no exista. Dato faltante: plazos reales por zona, si hay express, si Envia ya despacha.

**LEGAL_GAP_5 - Promoción "20% de descuento ... Por tiempo limitado" y "Precio anterior".** Norma: Ley 1480 art. 30 (publicidad engañosa) y art. 33 (condiciones de promociones: tiempo, modo, lugar, cantidades). Riesgo: medio. Conservadora: indicar vigencia y condiciones o retirar "por tiempo limitado"; confirmar que el precio anterior se cobró realmente. Dato faltante: fecha fin, stock/condiciones, historial de precio.

**LEGAL_GAP_6 - Afirmaciones "Compra de forma sostenible" / "materiales nobles".** Norma: info veraz y suficiente (Ley 1480 arts. 23 y 30). Riesgo: bajo-medio. Conservadora: retirar o sustentar. Dato faltante: soporte (certificación/ficha del proveedor).

**LEGAL_GAP_7 - Composición, etiquetado y medidas de las prendas.** Norma: art. 50 (características, composición) y eventual reglamento técnico de etiquetado de confecciones (aplicabilidad = DESCONOCIDO). Riesgo: medio. Conservadora: publicar composición real y medidas por talla. Dato faltante: composición de cada tela (etiqueta/proveedor), tabla de medidas.

**LEGAL_GAP_8 - Consentimiento y eventos server-side a Meta.** Norma: Ley 1581 (finalidad, libertad, consentimiento). Riesgo: medio. El texto dice "desde tu navegador"; con `facebookCapiEnabled: true` no está verificado que rechazar frene también la API de Conversiones. Conservadora: probar con "Rechazar" en Events Manager (Test Events) y ajustar el texto a lo comprobado. Dato faltante: resultado de esa prueba y nivel real de Meta (Optimizado / Máximo).

**LEGAL_GAP_9 - Terceros reales listados.** Norma: Decreto 1377/1074 (categorías de encargados). Riesgo: bajo. "Envia.com" ("por ejemplo") y el "servicio técnico del complemento de Wompi" (conexa.ai) no confirmados como activos. Conservadora: mantener redacción condicional. Dato faltante: qué usa hoy cada despacho/pago.

**LEGAL_GAP_10 - Mecanismo PQR con constancia de fecha/hora y seguimiento.** Norma: art. 50 Ley 1480. Riesgo: medio. Opciones mínimas nativas: formulario de contacto de Shopify (queda registro con fecha/hora) o correo con acuse y número de caso manual. Dato faltante: decisión de la dueña y plazo de respuesta que asumirá.

**LEGAL_GAP_11 - Interruptor de política automática de privacidad.** Riesgo: alto operativo (K1). No verificable con el token (solo UI de Admin: Configuración > Políticas / Privacidad del cliente). Dato faltante: estado actual del interruptor y quién tiene acceso a la UI.

**LEGAL_GAP_12 - Telemetría de Shopify tras rechazar** (monorail-edge / otlp). Riesgo: bajo. Dato faltante: confirmación de Shopify de que es operativa/no marketing; de ser analítica, ajustar texto de cookies.

**LEGAL_GAP_13 - Duración de la garantía comercial de 12 meses vs garantía legal.** Riesgo: bajo. Dato faltante: criterio de asesor.

---

## 7. Cambios objetivos y reversibles (NO aplicados)

Orden por impacto. "Dónde" = superficie Shopify.

**CHG-1 Servir el texto colombiano en /policies/privacy-policy.** Dónde: Admin > Configuración > Políticas > Política de privacidad (desactivar la política generada automáticamente / usar el cuerpo guardado). Texto: el ya almacenado (9.356 caracteres). Verificar después que `/policies/privacy-policy` y `checkout.shopify.com/.../55627088171.html` muestren "Quién es el responsable de tus datos". Reversible: reactivar automatización.

**CHG-2 Enlace 404 del banner.** Dónde: Admin > Tienda online > Navegación > Redirecciones. Crear redirección `/es/policies/privacy-policy` -> `/pages/privacidad` (o `/policies/privacy-policy` una vez hecho CHG-1). Reversible (borrar la redirección). DESCONOCIDO si Shopify permite redirigir el prefijo `/es/`; alternativa: cambiar el idioma/URL del banner desde la configuración de Privacidad del cliente.

**CHG-3 Enlace a la SIC.** Dónde: pie (columna "Ayuda"), /policies/contact-information, /pages/contact, /pages/terminos y /policies/terms-of-service. Texto exacto sugerido: "Superintendencia de Industria y Comercio (SIC) - Protección al consumidor" con `href="https://www.sic.gov.co"`, y en contacto/términos: "Autoridad de protección al consumidor: Superintendencia de Industria y Comercio (SIC), https://www.sic.gov.co". En /pages/privacidad convertir "www.sic.gov.co" en enlace. Sin logotipo (la SIC dice que no es necesario). Reversible.

**CHG-4 Reescritura de la política de reembolso** - SOLO tras `CHATGPT_REVIEW_REQUIRED_LEGAL` R-1 a R-4. Estructura propuesta (sin inventar plazos comerciales): (1) "Derecho de retracto: si compras a distancia puedes retractarte dentro de los 5 días hábiles siguientes a la entrega, cuando legalmente proceda, devolviendo el producto en las mismas condiciones en que lo recibiste. La ley prevé excepciones; no las ampliamos." (2) Reembolso: "máximo 15 días calendario desde que ejerces el derecho y nos das tus datos y el producto, por el mismo medio de pago o el que acordemos." (3) "Garantía legal por defecto o falta de calidad: ver Política de garantía; no depende del plazo del retracto." (4) "Cambio de talla o estilo (voluntario): [DECISIÓN DUEÑA: se ofrece o no, y condiciones]." (5) "Reversión del pago: fraude, operación no solicitada, no recepción, producto distinto o defectuoso; solicítala a tu entidad financiera dentro del plazo legal y avísanos." (6) Procedimiento y canal: correo y WhatsApp, con fecha/hora de tu mensaje como constancia. Eliminar: la frase "Por tratarse de prendas de baño e higiene íntima...", "Evaluamos cada caso antes de aprobar la devolución", y fijar costos de transporte del retracto según el art. 47 [confirmar].

**CHG-5 Política de envío (objetiva, con datos verificados en Admin).** Dónde: /policies/shipping-policy y /pages/envios (mismo texto). (a) Borrar la sección "Coordinación del envío en compras inferiores a $ 299.900" completa. (b) Reemplazar "el costo del envío será asumido por el cliente y se informará antes del despacho, de acuerdo con el destino y la tarifa vigente de la transportadora" por: "el costo se calcula en el checkout según tu departamento y se muestra por separado antes de pagar: Atlántico $9.900; Bolívar, Cesar, Córdoba, La Guajira, Magdalena y Sucre $12.900; Antioquia, Bogotá D.C., Caldas, Cundinamarca, Norte de Santander, Quindío, Risaralda, Santander y Valle del Cauca $17.900; Arauca, Boyacá, Caquetá, Casanare, Cauca, Chocó, Huila, Meta, Nariño, Putumayo y Tolima $21.900; Amazonas, Guainía, Guaviare, San Andrés, Providencia y Santa Catalina, Vaupés y Vichada $44.900. Envío gratis desde $299.900 de subtotal." (c) Quitar "Envío express: 24 a 48 horas..." hasta confirmar (LEGAL_GAP_4). (d) En "Garantías y derecho de retracto": añadir enlace a la sección de retracto de CHG-4. Reversible.

**CHG-6 Términos.** Dónde: /policies/terms-of-service y /pages/terminos. (a) Medios de pago: "tarjetas Visa, Mastercard y American Express, PSE, Nequi, Bancolombia y Daviplata, a través de Wompi" (según el payload del checkout; verificar en el paso de pago). (b) Añadir: "Retracto, reversión del pago y garantía: ver Política de devoluciones y Política de garantía." (c) Línea de SIC (CHG-3). (d) Voseo: "podés" -> "puedes", "consultá" -> "consulta". (e) Frase de IVA según instrucción de la dueña [DECISIÓN DUEÑA: p. ej. "Los precios no incluyen IVA porque el vendedor no es responsable de IVA", solo si es exacto]. Reversible.

**CHG-7 Contacto/PQR.** Dónde: /policies/contact-information y /pages/contact. Añadir: "Conserva el mensaje que nos envías: la fecha y la hora de envío te sirven de constancia." y "[Plazo de respuesta: DECISIÓN DUEÑA]". Unificar canal de devoluciones/garantía con el del contacto (correo + WhatsApp). Reversible.

**CHG-8 Cambiar preferencias de cookies.** Dónde: tema (pie) - añadir enlace "Preferencias de cookies" que invoque `window.privacyBanner.showPreferences()`; o, si no se implementa, quitar las dos frases que prometen el enlace. Frases exactas a corregir: /pages/cookies "Puedes aceptar, rechazar o cambiar tu decisión cuando quieras desde el aviso de cookies de la tienda." y /pages/privacidad "desde el enlace de preferencias de cookies de la tienda". Reversible.

**CHG-9 Aviso en el formulario de boletín.** Dónde: inicio, bajo el campo de correo. Texto: "Al suscribirte autorizas el uso de tu correo para enviarte novedades y promociones, según nuestra Política de privacidad. Puedes cancelar cuando quieras." con enlace a /pages/privacidad. Reversible.

**CHG-10 Enlaces relativos -> absolutos en cuerpos nativos.** Dónde: REFUND_POLICY, SHIPPING_POLICY, TERMS_OF_SERVICE, LEGAL_NOTICE. `/pages/garantia` -> `https://radaelliswimwear.com/pages/garantia`; `/pages/envios` -> `https://radaelliswimwear.com/pages/envios`; `/pages/privacidad` -> `https://radaelliswimwear.com/pages/privacidad`; `/#contacto` -> `https://radaelliswimwear.com/policies/contact-information`. Reversible.

**CHG-11 Mensaje de stock por talla.** Dónde: tema (ficha de producto). Mostrar el inventario de la variante seleccionada, o solo "Últimas unidades" sin número. Hoy "Solo quedan 3 unidades" con S=M=L=1. Reversible.

**CHG-12 Fichas de producto.** Añadir "Composición:" y "Medidas por talla" cuando la dueña entregue los datos (LEGAL_GAP_7). No inventar.

**CHG-13 Promoción.** Añadir vigencia/condiciones o retirar "Por tiempo limitado" (LEGAL_GAP_5). Retirar o sustentar "Compra de forma sostenible" (LEGAL_GAP_6).

**CHG-14 Voseo.** "Dejá tu correo y recibí aviso" -> "Deja tu correo y recibe aviso"; "Descubrí la colección y agregá tus favoritos" -> "Descubre la colección y agrega tus favoritos"; favoritos: "Guardá" -> "Guarda", "Recargá" -> "Recarga", "Revisá" -> "Revisa". Reversible.

---

## 8. CHATGPT_REVIEW_REQUIRED_LEGAL (revisar antes de publicar cualquier redacción)

- **R-1** Cualquier texto sobre "bienes de uso personal"/higiene (excepción g, art. 47) y la condición "protector de higiene intacto" como causal de rechazo: depende de interpretar una excepción legal.
- **R-2** La ventana de 5 días hábiles para reportar defectos, error de despacho o daño de transporte: reduce derechos frente a garantía legal y art. 51.
- **R-3** Quién paga el transporte de la devolución por retracto (art. 47 dice consumidor) frente a la práctica actual (la marca paga en defecto/error/daño): confirmar que la política no queda por debajo de la ley y qué conserva la marca como beneficio.
- **R-4** Exclusiones de garantía "desgaste normal / mal uso / cuidado inadecuado": contrastar con las causales legales de exoneración de garantía.
- **R-5** Cláusula "Nos reservamos el derecho de corregir un precio publicado por error antes de confirmar el pago" (posible cláusula abusiva / publicidad vinculante).
- **R-6** "Evaluamos cada caso antes de aprobar la devolución": un derecho de retracto no puede quedar sujeto a aprobación discrecional.
- **R-7** "Cuando compras, creas una cuenta, nos escribes o te suscribes, nos autorizas": autorización por conducta inequívoca; confirmar suficiencia (Ley 1581 / Decreto 1377).
- **R-8** Cualquier frase nueva sobre qué cookies/eventos se bloquean al rechazar (depende de la prueba de LEGAL_GAP_8).

---

## 9. Datos que debe aportar Daniela (todo lo demás está verificado)

1. Nombre/razón social del RUT. 2. Plazos reales de entrega por zona; si hay express; si Envia ya despacha. 3. Fecha fin y condiciones del 20%; si el "precio anterior" se cobró. 4. Composición y medidas por prenda. 5. Si ofrece cambio voluntario de talla/estilo y con qué condiciones. 6. Canal PQR preferido y plazo de respuesta que puede cumplir. 7. Quién puede abrir Configuración > Políticas en Admin (LEGAL_GAP_11). 8. Soporte de "sostenible/materiales nobles". 9. Texto exacto de IVA que autoriza publicar.

Evidencia: `before/_INDEX.txt` (índice), `before/*.html|txt` (superficies), `before/admin-*.json|html` (lecturas Admin), `before/evidence-cookie-banner.txt` y capturas, `before/link-check.csv`, `before/checkout-step0-visible.txt`, `before/checkout-payment-config-extract.txt`.
