# Runbook: conexión oficial Shopify "Facebook & Instagram" (Meta) y prueba de atribución — Radaelli Swimwear

- **Fecha:** 2026-10-02 (Bogotá) · **Carril:** investigación, solo lectura. No se tocó Shopify, Meta, Wompi, DNS ni Vercel.
- **Tienda:** `wgcvpd-ib.myshopify.com` → https://radaelliswimwear.com · plan Basic · COP · Wompi LIVE (redirección) · tema RC1.10 · *Customer events* sin pixels.
- **Etiquetas:** **[V]** = leído hoy en página oficial (URL) · **[3P]** = tercero/comunidad · **[NV]** = no verificado (se resuelve con la prueba indicada).
- **Límite de método:** las páginas de ayuda de Meta (`facebook.com/business/help/...`) solo devolvieron el título al leerlas por herramienta; lo que dependa de ellas está marcado [NV]/[3P]. Las páginas de Shopify y de Meta for Developers sí devolvieron cuerpo. **Ninguna página oficial de Shopify mostró fecha de actualización**; fechas visibles al final (§9).

## 0. Lo más importante antes de tocar nada

1. **Colombia y "Shops":** Meta suspendió Facebook/Instagram Shopping en Colombia, Argentina y Chile desde 2023-08-10 [3P: Tiendanube]; las listas de países de terceros no incluyen Colombia; la lista oficial de Meta **no se pudo leer** [NV]. Las páginas oficiales de Shopify dicen que el canal exige estar en un país soportado para Shops [V]. El plan anterior decía lo contrario ("Colombia figura como soportado [3P]"). **Hay que asumir que el paso "Connect account" puede fallar con "Shops is only available in some countries" [3P]**; el objetivo real (pixel + Conversions API + datos) está en la función **Meta Marketing**, separada de Facebook Shop/Instagram Shopping [V]. Plan B en §2.
2. **Desde 2026-01-13 Shopify deja los pixels de apps en modo "Optimized"** y puede *pausar* el envío si no ve tráfico/ventas atribuidos [V]. En una tienda nueva sin campañas eso puede dejar el pixel de Meta mudo durante la prueba. Hay que poner **Always on** antes de validar (§3).
3. **#1002 no sirve para validar Meta** (se pagó antes de conectar Meta; no hay reenvío documentado). La validación del `Purchase` exige **un pedido real nuevo** (~COP 1.091 si es de COP 5.000) (§6).
4. **Meta Pixel Helper ya no existe con ese nombre:** se actualiza solo a **Meta Ads Data Advisor** (v5.8.2, actualizada 2026-10-02), con funciones de *configuración automática* que pueden tocar la conexión Shopify [V]. Usarlo solo para diagnosticar y **no ver como prueba suficiente** (no ve eventos de servidor y puede no ver el pixel sandbox) (§4).

## 1. Requisitos hoy y quién hace qué

| Requisito | Detalle | Fuente | Estado Radaelli |
|---|---|---|---|
| Tienda no privada | "can't be in private mode" | [V] help.shopify.com/en/manual/online-sales-channels/social-commerce/facebook-instagram-by-meta/requirements-and-considerations | Pública desde 03Q |
| Correo remitente válido | "Sender email … valid" | [V] misma | Verificar en Settings > Notifications |
| Plan | Sin requisito de plan; "free to use with all Shopify plans, subject to store eligibility" | [V] …/facebook-instagram-by-meta (página principal) | Basic vale |
| Permiso de staff | "Manage and install apps and channels" | [V] help.shopify.com/en/manual/promoting-marketing/pixels/app-pixels | Cuenta propietaria |
| País | "must be located in one of the Supported countries for Shops" | [V] requirements page; lista oficial [NV] | **Riesgo Colombia** |
| Cuenta Facebook | Control total del **business portfolio** y de la **Página** | [V] requirements page | **Solo la dueña** |
| Página | Publicada, conectada al portfolio | [V] | Por confirmar |
| Instagram | Solo si se vende en IG: cuenta profesional asociada a la Página | [V] | Opcional para pixel/anuncios |
| Cuenta publicitaria | "add an ad account to your business portfolio" si nunca hubo anuncios; método de pago | [V] (método de pago: [NV]) | **Solo la dueña** (tarjeta) |
| Dataset/pixel | Conectar existente ("Connect") o "Create new" | [V] help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-pixel | Decisión §2 |
| Dominio verificado | Productos comprables desde el dominio verificado | [V] requirements page | TXT ya en el apex (§7) |
| Impuestos | Desde 2025-08-26 el comerciante es responsable del impuesto de ventas de pedidos de Shops | [V] setup page | Solo aplica a Shops |

**Solo la dueña (identidad/consentimiento):** inicio de sesión y MFA de Facebook; pantalla OAuth/permisos de Meta y elección de activos; aceptar los términos de Meta ("Accept the terms and conditions"); método de pago de la cuenta publicitaria; decisión de nivel de datos/privacidad; Vercel (secretos/variables de su cuenta). El asistente no teclea contraseñas ni tarjetas, y cada consentimiento/OAuth/aceptación de términos requiere un "sí" explícito en el chat.
**Puede hacer el asistente** (con la sesión ya iniciada por la dueña): pasos de Shopify Admin, *Customer events* > Always on, lectura de Events Manager (Overview/Test events/Diagnostics/History), pruebas en la tienda pública con UTM, lectura de reportes de Shopify.

## 2. Flujo soportado, decisiones y comprobación del sitio antiguo

**Flujo A (recomendado, "Shopify primero")** [V] help.shopify.com/en/manual/online-sales-channels/social-commerce/facebook-instagram-by-meta/setup — *ES entre corchetes = traducción no verificada [NV-ES]*:
1. Shopify Admin > **Settings > Sales channels** (Configuración > Canales de venta) > **Shopify App Store** > buscar **Facebook** > **Facebook & Instagram** (Meta; gratis) > **Add channel** (Añadir canal). El canal aparece en *Sales channels*, no en Apps.
2. **Start set up** (Iniciar configuración) en la función **Meta Marketing**; no activar Facebook Shop / Instagram Shopping (no aplica en Colombia, §0.1) [V lista de funciones].
3. **Connect account** (Conectar cuenta) → login de Facebook (**DUEÑA**) → conectar activos requeridos: business portfolio, Página, Instagram (opcional), cuenta publicitaria, pixel/dataset → **Accept the terms and conditions** → **Finish setup**.
4. **Sales channels > Facebook & Instagram > Settings > Data sharing settings** (Shopify escribe también "Share data settings" en otra página [V]): interruptor **Customer data-sharing** → **CHOOSE LEVEL** → **Maximum** → pixel: **Connect** existente o **Create new** → confirmar.
5. **Settings > Customer events** (Eventos de clientes): debe aparecer **un** pixel de app "Facebook & Instagram"; *Data* = **Always on**; ningún pixel personalizado.
6. Verificar dominio (§7).

**Plan B si el paso 3 devuelve "Shops is only available in some countries":** Events Manager > Connect data sources > Web > partner integration > **Shopify** ("Conectar una nueva fuente de datos" → "Configurar con integración de socio" [V: blog Shopify ES 2024-10-15]) vuelve a abrir la misma app de Shopify. Si tampoco, soporte desde Shopify ("Get Support" → tema "Account Connection and Permissions") [3P]. **No** usar la automatización de Meta Ads Data Advisor ("Connect a Shopify store") ni apps de terceros: duplican emisores [V: aviso de duplicados en la página meta-pixel].

**Decisiones reales (no son clics):**

| # | Decisión | Por defecto recomendado | Razón |
|---|---|---|---|
| D1 | Business portfolio | Reutilizar el que verificó el dominio (TXT `facebook-domain-verification` ya en el DNS) | La verificación de dominio vive en un solo portfolio; otro portfolio fragmenta activos y puede dar "domain already verified by another business" [3P] |
| D2 | Página | Reutilizar la Página publicada de Radaelli | Requisito [V]; no crear duplicados |
| D3 | Instagram | La cuenta profesional **de la marca**, solo si se quiere anunciar con ella; no la personal de la fundadora | Evita mezclar identidades; no es necesario para pixel/CAPI |
| D4 | Cuenta publicitaria | Reutilizar si ya tiene método de pago; si no, crear **dentro** del portfolio (la dueña pone la tarjeta) | [V] requisito |
| D5 | Dataset | Reutilizar el dataset …6037 **solo si** pasa las 4 comprobaciones de abajo; si no, "Create new" | Pixel ID = dataset ID [3P/V: developers.facebook.com/docs/marketing-api/conversions-api/]. Reutilizar conserva historial (casi nulo), pero hereda un emisor antiguo posible; un dataset nuevo no tiene ese riesgo |
| D6 | Nivel de datos | **Maximum** (sujeto a política de privacidad actualizada, §3) | Único con CAPI + tecnología más reciente [V] |

**Comprobación de que el sitio antiguo (Next.js) ya no envía eventos — solo lectura, antes de reutilizar …6037:**
1. Events Manager > Data sources > dataset …6037 > **Overview** (Resumen): rango "últimos 90 días"; fijarse en eventos por **Browser/Server** y en "Last received". **0 eventos en 30 días = limpio.**
2. En *Test events* y en el detalle de eventos, buscar un segundo emisor: `event_source_url` distinto de radaelliswimwear.com (p. ej. `*.vercel.app`) o `event_id` con formato `purchase:<uuid>` (formato del código antiguo: `lib/analytics/purchase-event-id.ts`) → no deduplica con el `event_id` de Shopify y duplicaría el Purchase.
3. **History / Settings** del dataset (Historial/Configuración [NV-ES]): quién generó un token de Conversions API (sin crear ni copiar tokens).
4. DNS ya apunta a Shopify, así que el checkout antiguo no recibe tráfico; pero despliegues de vista previa de Vercel siguen existiendo [NV].

**Emisor de servidor antiguo (documentar, no tocar):** el código leía `NEXT_PUBLIC_META_PIXEL_ID` y `META_CAPI_ACCESS_TOKEN` (valores no copiados aquí) y solo emitía si `ANALYTICS_RUNTIME_ENABLED`, `ANALYTICS_BROWSER_ENABLED` y/o `ANALYTICS_SERVER_DELIVERY_ENABLED` eran exactamente `"true"`; en `.env.example` están `"false"`, pero el valor real en Vercel es [NV]. Si Events Manager muestra tráfico antiguo, la **dueña** debe en Vercel: dejar los tres flags distintos de `"true"` y retirar el token (o rotarlo desde Events Manager); si se elige dataset nuevo, el token queda huérfano y se retira por higiene.

## 3. Niveles de datos, consentimiento y privacidad

| Nivel | Qué envía | Fuente |
|---|---|---|
| **Standard** | Solo pixel del navegador; "A browser-based ad blocker can prevent the Meta pixel from sharing data" | [V] help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing |
| **Enhanced** | Pixel + **Conversions API** (compra de servidor a servidor) + datos del cliente: nombre, ubicación, correo, teléfono, comportamiento | [V] misma |
| **Maximum** | Lo de Enhanced + "Facebook's latest advertising technology" | [V] misma |

- Shopify **no recomienda un nivel** en esa página; enfatiza informar a los clientes y mantener la política de privacidad actualizada [V]. Guía de terceros: "Maximum is the right setting" [3P: fudge.ai, 2026-08-20]. **Recomendación: Maximum**, porque es el único que da servidor para compras si la clienta no vuelve de Wompi (mejora, no garantiza: §5).
- Meta exige que los parámetros de cliente (em, ph, fn, ln, ct, st, zp, country) viajen **hasheados**; IP, user agent, `fbp`, `fbc` sin hash [V: developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters].
- **Ley 1581 de 2012 (no es asesoría legal):** la SIC aplicó la Ley 1581 a datos recogidos por cookies en territorio colombiano (Res. 53593 de 2020-09-03, caso Google) [V: sedeelectronica.sic.gov.co, boletín jurídico]; el principio es autorización previa, expresa e informada [3P: OCH Group; texto de la ley no se pudo abrir]. Con Enhanced/Maximum se comparten datos personales con Meta (EE. UU.): hay que nombrar a Meta como encargado/tercero en la política y valorar la transferencia internacional [3P]. Decisión de la dueña/asesor (carril F).
- **Cómo Shopify condiciona el pixel:** el banner solo se activa por defecto para UK/EEE; en otras regiones "will not be active … by default" y las funciones corren sin pedir consentimiento [V: help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings]. Para activar Colombia: Settings > **Customer privacy** (Privacidad del cliente [NV-ES]) > Cookie banner > desactivar ajustes automáticos > **Regions > Edit** > agregar Colombia. Los pixels de app (sandbox *strict*) "honor the consent signals"; en regiones que exigen consentimiento sus callbacks "are executed only after consent is given" [V: shopify.dev/docs/apps/build/marketing-analytics/pixels]; un pixel solo carga si hay permiso para **todos** los ajustes que declara (analytics, marketing, preferences, sale_of_data) [V: shopify.dev/docs/api/web-pixels-api/pixel-privacy]. **No documentado** si el `Purchase` de servidor se envía a quien rechaza el banner [NV].
- **Data access del pixel de app:** *Optimized* (por defecto desde 2026-01-13) pausa el envío tras 7 días de gracia si ve "zero signals … over days or weeks"; se reanuda con señales [V: changelog.shopify.com/posts/new-default-setting-for-pixel-data-sharing]. Cambiar en Settings > Customer events > pestaña de apps > columna *Data* > **Always on** [3P: analyzify.com; [V] que el ajuste existe en help.shopify.com/en/manual/promoting-marketing/pixels/app-pixels]. Terceros dicen que las APIs de servidor (CAPI) no se ven afectadas [3P]. **Acción: Always on al conectar y durante la validación; la dueña decide si lo deja después.**

## 4. Eventos y sandbox; cómo observarlos de verdad

- **Eventos de Shopify (Web Pixels API)** [V: shopify.dev/docs/api/web-pixels-api/standard-events]: `page_viewed`, `product_viewed`, `collection_viewed`, `search_submitted`, `product_added_to_cart`, `cart_viewed`, `checkout_started`, `checkout_*_info_submitted`, `payment_info_submitted`, `checkout_completed`. Mapeo a Meta (PageView, ViewContent, Search, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase): **la ayuda oficial de hoy no lista los eventos que envía la app** [V: la página meta-pixel solo habla de "certain events"]; la lista es [3P] (fudge.ai, plan anterior). **AddPaymentInfo con pasarela externa puede no dispararse** (la doc de `payment_info_submitted` no cubre pagos fuera del sitio [V]; hilos de comunidad lo reportan [3P]) → no usarlo como puerta de pago.
- **Sandbox:** los pixels de **app** corren en sandbox *strict* con **web workers**; los **personalizados** en sandbox *lax* = `iframe` con `sandbox="allow-scripts allow-forms"` [V: shopify.dev/docs/apps/build/marketing-analytics/pixels]. (La premisa "iframe" es cierta solo para pixels personalizados.) Cargan en tienda, checkout, páginas post-compra [V] y en gracias/estado del pedido [V: help.shopify.com/en/manual/promoting-marketing/pixels/overview]. `checkout_completed` se dispara "once for each checkout, typically on the Thank you page" y **no se dispara si esa página no carga** [V: shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed].
- **¿Lo ve Meta Pixel Helper?** Ahora **Meta Ads Data Advisor** ("automatically updates"); no detecta eventos de servidor; con extensiones/bloqueadores y "button-click events may not be detected" [V: developers.facebook.com/docs/meta-pixel/support/pixel-helper/ y …/documentation/meta-pixel/support/meta-ads-data-advisor; Chrome Web Store v5.8.2, 2026-10-02]. Que detecte o no un pixel en worker/sandbox **no está documentado** [NV]; terceros dicen que no muestra checkout [3P: zotek.io, 2025-11-21] y hay hilos con pixel "no detectado" que sí funcionaba [3P: community.shopify.com, 2025-09]. Pide permisos amplios ("read and change all your data on all websites") y trae funciones de setup/arreglo automático: **instalarlo requiere permiso explícito de la dueña y se usa solo en modo diagnóstico**.
- **Observación fiable (en orden):**
  1. **Events Manager > Overview** del dataset: eventos recibidos por **Browser** y **Server**, conteos antes de deduplicar; Event Details > pestaña **Event Deduplication** [V: developers.facebook.com/documentation/ads-commerce/conversions-api/verifying-setup]. Los eventos aparecen en ~20 min [V].
  2. **Test events** (Probar eventos [3P-ES]): "Test browser events" con la URL de la tienda, sin bloqueador; muestra eventos de navegador con su detalle [3P: resúmenes de la ayuda de Meta; páginas oficiales no legibles]. Para eventos de **servidor**, el `test_event_code` lo pone quien envía; con la integración de Shopify **no se puede** inyectar → el servidor se ve en Overview, no en Test events [NV].
  3. **Diagnostics** (Diagnósticos): avisos de duplicado/falta de parámetros [3P].
  4. **DevTools > Network** filtrando `facebook.com/tr`: parámetros `ev` (evento), `eid` (event_id), `cd[value]`, `cd[currency]` [3P/NV; confirmar que se ven las peticiones del worker].
  5. **Shopify Pixel Helper** (Customer events > pixel > **Test**): la página de pixels de app dice que se pueden probar con él [V], otra página dice que sirve para pixels personalizados [V]: conflicto → probar en la UI y anotar resultado.

## 5. Deduplicación y fallos con pasarela externa

- **Regla Meta** [V: developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events]: el `eventID` del pixel debe igualar el `event_id` de CAPI y `event`=`event_name`; solo se deduplica si Meta recibe el segundo evento dentro de **48 h** del primero; método alterno `event_name` + `fbp`/`external_id` solo navegador→servidor; con una sola fuente no hay dedupe.
- **event_id de Shopify para Purchase:** **no documentado** [NV]. Un experto de la comunidad (2026-05-25) dice que la app oficial "should already generate matching event_ids" [3P: community.shopify.com/t/meta-pixel-and-conversions-api-deduplication-issues-on-shopify/400958]; avisos "missing deduplication parameters" suelen venir de un segundo emisor (snippet en el tema, tracker de terceros) [3P]. RC1.10 no tiene `fbq` (revisado antes).
- **Cómo probar un solo Purchase lógico:** tras un pedido: Overview > Purchase > Event Details > **Event Deduplication**: "Rate of Deduplication Key Usage" ≈ 100 % en **ambas** fuentes y "Rate of Events Deduplicated" > 0 [V para esos nombres]; recibidos crudos Browser=1 y Server=1 por pedido, total deduplicado = 1; **valor = total del pedido de Shopify y moneda = COP** en el detalle del evento [V: Purchase exige `currency` y `value`, developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking]. Definición de "valor" (¿incluye envío/impuestos?) [NV]: con #1002-tipo (envío 0, impuesto 0) no se distingue; compararlo con el primer pedido real con envío.
- **Pasarela externa (Wompi, la clienta no vuelve):** el Purchase de navegador depende de `checkout_completed` en la página de gracias [V]. ¿Envía la integración Purchase de servidor al crearse el pedido aunque no haya regreso? Terceros dicen que sí ("orders/paid" automático) [3P], Shopify/Meta **no lo documentan** [NV]; y si Shopify ni siquiera crea el pedido sin regreso (escenario E2 del plan anterior) no habrá evento alguno: **la documentación de pagos fuera del sitio de shopify.dev no responde cuándo se crea el pedido** [V: shopify.dev/docs/apps/build/payments/processing]. Solo la prueba de "no regreso" (§6, T7) lo resuelve; mientras tanto, conciliación diaria Shopify↔Wompi↔Meta.
- **Otros modos de fallo:** modo *Optimized* (§3); banner/consentimiento en navegador; segundo emisor (dataset antiguo, §2); bloqueadores (solo afecta navegador); recargar la página de gracias (no dispara otro `checkout_completed` "once for each checkout" [V], recarga no documentada [NV] → probar); pedidos internos contaminan MER (se etiquetan, no se pueden borrar en Meta).

## 6. Plan de prueba (UTM sin datos personales)

**UTM de prueba:** `utm_source=test_meta&utm_medium=paid_social&utm_campaign=cmp_validacion_20261002&utm_content=cr_validacion_v1` (sin `utm_term`). Perfil de navegador limpio, sin bloqueadores, sin sesión de administrador. Orden: **conectar Meta + Always on → línea base → pruebas** (conectar *antes* de comprar; no hay reenvío de pedidos anteriores [NV]).

| ID | Acción | Esperado en Meta | Esperado en Shopify | Costo / quién |
|---|---|---|---|---|
| T0 | Línea base: Overview del dataset (conteos y "last received"); Customer events con 1 pixel, Always on | Sin eventos ajenos | — | $0 · asistente |
| T1 | Abrir `https://radaelliswimwear.com/?utm_…` (apex), luego `www`, y 3 de las 51 redirecciones antiguas con los UTM | PageView por carga | La URL final conserva `utm_*` [NV: no se probó que las redirecciones conserven la consulta]; sesión en *Marketing > Sessions attributed to marketing campaigns* | $0 · asistente |
| T2 | Aterrizar en una ficha con los UTM | ViewContent (+PageView) | Sesión con landing = ficha | $0 |
| T3 | Añadir al carrito | AddToCart | — | $0 |
| T4 | Ir a pagar, **sin escribir datos personales** y sin pagar | InitiateCheckout (AddPaymentInfo [NV]) | Sesión con paso a checkout en *Behavior > Conversion rate breakdown* (no habrá *Abandoned checkout* sin correo) | $0 |
| T5 | Compra real mínima, vuelta normal a la página de gracias | Purchase navegador 1 + servidor 1, deduplicado = 1; valor/moneda = total/COP; mismo `event_id` | Pedido con *Conversion summary* mostrando origen y UTM (hasta 48 h) [V]; etiquetas `interno,prueba-meta` | **≈ COP 1.091** si COP 5.000 · dueña paga, asistente verifica |
| T6 | Recargar la página de gracias 2 veces | Sin Purchase adicional | — | $0 |
| T7 | (Opcional) segunda compra mínima cerrando la pestaña de Wompi antes de volver | Si E1: solo Purchase de servidor (no prueba dedupe); si E2: nada | ¿Hay pedido? Revisar *Orders* y *Abandoned checkouts* a 10 y 40 min | otro ≈ COP 1.091; o esperar a los primeros pedidos reales y conciliar |
| T8 | Opcional: rechazar el banner (si se activa Colombia) y navegar | Sin eventos de navegador | — | $0 |

**¿Se puede reutilizar #1002? No.** (a) Se pagó antes de conectar Meta: no hubo pixel ni CAPI emitiendo [evidencia local: `ai-handoff/claude-result.md`, pedido #1002 pagado COP 5.000, `test=false`, "Customer events still empty"]; (b) Shopify/Meta no documentan reenvío de pedidos históricos [NV]; (c) un `Purchase` de navegador no se puede reproducir; (d) técnicamente un envío manual por CAPI sería válido hasta 7 días después del `event_time` (hasta 2026-10-09) [V: …/parameters/server-event], pero sería un emisor *a medida* con token propio, su `event_id` no demostraría el de Shopify, y el pedido está etiquetado interno: **no recomendado**. Alternativa de $0 [NV]: pedido con 100 % de descuento (valida ruta y dedupe, **no** valor/moneda; Meta puede tratar valor 0 como incompleto; exige autorización de la dueña por la regla de no tocar descuentos).

**Costo estimado de T5 (COP 5.000):** Wompi plan Avanzado Agregador "2,65% + $700 + IVA" [V: wompi.com/es/co/planes-tarifas/; si el IVA recae en toda la comisión: 132,5 + 700 = 832,5; IVA 19 % ≈ 158,2 → ≈ 990,7] + comisión Shopify por pasarela externa Basic **2 %** = 100 [V: shopify.com/pricing] ⇒ **≈ COP 1.091** (cabe en el peor caso ya aprobado de ≈ COP 1.100). Requiere producto temporal nuevo y aprobación explícita de la dueña del monto exacto.

**Cómo leer los UTM en Shopify:** Orders > pedido > **Conversion summary** (puede tardar 48 h; vacío con navegadores privados/apps o pedidos de borrador [V: help.shopify.com/en/manual/fulfillment/managing-orders/analytics/conversion-summary]); Analytics > Reports > **Marketing**: *Sessions attributed to marketing campaigns*, *Sales attributed to marketing*, *Performance by UTM campaign* (último clic por defecto, ventana 30 días; retraso de segundos a ~1 min) [V: …/default-reports/marketing-reports]; Acquisition/Behavior para landing y embudo.
**Qué NO hay en Basic:** hoy **todos los planes** incluyen "200+ real-time reports, plus custom analytics" [V: shopify.com/pricing] y Basic tiene "all reports" + exploraciones personalizadas [V: help.shopify.com/en/manual/intro-to-shopify/pricing-plans/plans-features/basic-shopify-plan] → la salvedad del plan anterior queda sin efecto. Lo que Shopify **no** da en ningún plan: gasto/impresiones/CPC (solo Meta); "predicted values" es de Advanced [NV: solo en un resumen de búsqueda]; los planes se llaman ahora Basic/Grow/Advanced/Plus [V].

## 7. Dominio y puertas READY_FOR_PAID_MEDIA

- **Verificación de dominio** (Meta Business settings > **Brand safety > Domains** / Seguridad de marca > Dominios [NV-ES]): tres métodos: meta-tag en el `<head>`, archivo HTML, **TXT en DNS**; se agrega el dominio raíz sin prefijos; **una vez verificado se pueden quitar** meta-tag/TXT/archivo sin perder el estado [3P: resumen de búsqueda de la ayuda de Meta (facebook.com/business/help/321167023127050); la página no fue legible por herramienta]. El TXT del apex ya existe (no se tocó en el cutover DNS). **Comprobar:** `radaelliswimwear.com` figura "Verified" **en el mismo portfolio** que tendrá dataset y cuenta publicitaria; conservar el TXT. Preferir TXT sobre meta-tag (el tema no se edita).
- **Aggregated Event Measurement:** conflicto entre fuentes: páginas de ayuda de Meta indexadas aún dicen "8 eventos priorizados por dominio verificado" [3P, índice de búsqueda]; Adviso (2023-05-15) y guías 2025-2026 dicen que Meta eliminó la verificación obligatoria, la priorización de 8 eventos y la pestaña AEM [3P]. **[NV]:** al abrir Events Manager, anotar si existe la pestaña *Aggregated Event Measurement*; si existe y exige priorizar, la dueña prioriza `Purchase`, `InitiateCheckout`, `AddToCart`, `ViewContent`. El **dominio de seguimiento** es el real (radaelliswimwear.com): en Test events/`event_source_url` no debe aparecer `myshopify.com` como origen.

| Puerta | Evidencia |
|---|---|
| G1 Meta conectada a los activos correctos | Captura de *Settings > Data sharing* con portfolio/Página/dataset; IDs enmascarados en el repo |
| G2 Dominio verificado | "Verified" en Brand safety > Domains, mismo portfolio |
| G3 ViewContent observado | T2 en Test events/Overview |
| G4 AddToCart observado | T3 |
| G5 InitiateCheckout observado | T4 |
| G6 Purchase con valor COP correcto | T5: Event Details = total Shopify |
| G7 Sin duplicados | T5/T6: Event Deduplication ≈ 100 % clave; 1 Purchase por pedido; conciliación 72 h |
| G8 Camino UTM | T1–T5: UTM en URL final, *Marketing* report y *Conversion summary* |
| G9 Conciliación Shopify↔evidencia | Pedido, valor, hora y `event_id` en tabla privada; internos etiquetados |
| G10 Tablero/flujo del dueño documentado | Carril D |
| G11 (nuevo) Data access = Always on o monitoreo de pausa | Customer events; Overview sin huecos |
| G12 (nuevo) Un solo emisor | Customer events con 1 pixel; dataset sin eventos `purchase:` ni `*.vercel.app` |

## 8. Riesgos y lista de la dueña

**Riesgos:** (1) Colombia sin Shops → conexión puede fallar [3P]; (2) Optimized pausa el pixel [V]; (3) Purchase de servidor sin regreso de Wompi [NV]; (4) segundo emisor (dataset antiguo/Vercel) [NV]; (5) `event_id` de Shopify no documentado [NV]; (6) consentimiento y Ley 1581 pendientes (banner de Colombia desactivado por defecto) [V/3P]; (7) Meta Ads Data Advisor puede modificar la conexión [V]; (8) pedidos de prueba contaminan MER; solo se etiquetan.

**Lo que debe hacer la dueña ella misma (en español sencillo):**
1. Iniciar sesión en Facebook/Meta (con verificación en dos pasos) cuando el asistente se lo pida.
2. Elegir y autorizar en Meta el portafolio, la Página, la cuenta publicitaria y el conjunto de datos de Radaelli; aceptar los términos de Meta.
3. Poner (o confirmar) el método de pago de la cuenta publicitaria; el asistente nunca teclea tarjetas.
4. Decidir el nivel de datos (recomendado: Máximo) y si se activa el aviso de cookies para Colombia.
5. Si Events Manager muestra tráfico viejo: en Vercel apagar las variables de analítica y retirar el token de Meta.
6. Aprobar el monto exacto (≈ $1.091 COP) de una compra real de prueba y pagarla; no se hará nada con dinero sin su "sí".
7. Dar permiso explícito si se quiere instalar la extensión Meta Ads Data Advisor.
8. No pagar anuncios hasta que el asistente confirme todas las puertas en verde.

## 9. Fuentes y fechas visibles (consultadas 2026-10-02)

Shopify Help (ninguna muestra fecha de actualización en el texto leído): [requirements](https://help.shopify.com/en/manual/online-sales-channels/social-commerce/facebook-instagram-by-meta/requirements-and-considerations) · [setup](https://help.shopify.com/en/manual/online-sales-channels/social-commerce/facebook-instagram-by-meta/setup) · [canal](https://help.shopify.com/en/manual/online-sales-channels/social-commerce/facebook-instagram-by-meta) · [meta-data-sharing](https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing) · [meta-pixel](https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-pixel) · [pixels overview](https://help.shopify.com/en/manual/promoting-marketing/pixels/overview) · [app pixels](https://help.shopify.com/en/manual/promoting-marketing/pixels/app-pixels) · [custom pixel testing](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/testing) · [customer privacy](https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings) · [marketing reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/marketing-reports) · [conversion summary](https://help.shopify.com/en/manual/fulfillment/managing-orders/analytics/conversion-summary) · [Basic plan](https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/plans-features/basic-shopify-plan) · [pricing](https://www.shopify.com/pricing) (sin fecha; tarifa 2 % Basic). Con fecha: [changelog Optimized](https://changelog.shopify.com/posts/new-default-setting-for-pixel-data-sharing) 2026-01-13; blog Shopify ES [tienda de Facebook](https://www.shopify.com/es/blog/tienda-de-facebook) 2026-05-24 y [Meta Pixel](https://www.shopify.com/es/blog/configurar-meta-pixel) 2024-10-15.
Shopify.dev (sin fecha): [pixels/sandbox](https://shopify.dev/docs/apps/build/marketing-analytics/pixels) · [pixel-privacy](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy) · [standard events](https://shopify.dev/docs/api/web-pixels-api/standard-events) · [checkout_completed](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed) · [payments processing](https://shopify.dev/docs/apps/build/payments/processing).
Meta for Developers: [deduplicación](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events) · [verifying setup](https://developers.facebook.com/documentation/ads-commerce/conversions-api/verifying-setup) · [using the API](https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api) · [server event](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event) · [customer info](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters) · [Meta Ads Data Advisor](https://developers.facebook.com/docs/meta-pixel/support/pixel-helper/) (menciona 2026-08-03) · [Chrome Web Store](https://chromewebstore.google.com/detail/meta-ads-data-advisor/fdgfkebogiimcoedlicjlajpkdmockpc) (v5.8.2, última actualización 2026-10-02).
Otros: [Wompi tarifas](https://wompi.com/es/co/planes-tarifas/) (sin fecha) · [SIC, Res. 53593](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/boletin/superindustria-ordena-google-llc-cumplir-con-la-ley-1581-de-2012) (2020-09-03, pub. 2020-10-01) · [3P] [Tiendanube](https://ayuda.tiendanube.com/es_CO/facebook-e-instagram-shopping/como-vender-por-instagram-y-facebook-con-mi-tiendanube), [Adviso AEM](https://www.adviso.ca/en/blog/evolution-aggregated-measurement-meta), [zotek](https://zotek.io/blog-pixel/pixel-helpers-dont-show-checkout-events-heres-why/), [fudge.ai](https://www.fudge.ai/guides/shopify-meta-capi/), hilos de comunidad Shopify.
Local (solo lectura): `ai-handoff/next-prompt.md`, `ai-handoff/claude-result.md`, `commerce-main/.env.example`, `lib/analytics/{purchase-event-id.ts,adapters/meta-capi.ts}`.

## Anexo. Contradicciones con `launch/official-03p/analytics/analytics-attribution-plan.md`

1. §2 dice "Colombia figura como soportado [3P]" para Shops → hoy hay evidencia 3P en contrario (suspensión 2023-08-10) y la lista oficial es [NV].
2. §5.2 dice que el Pixel Helper del Admin de Shopify solo sirve para pixels personalizados → la página de *app pixels* dice que también prueba pixels de app (Customer events > Test) [V]; las dos páginas de Shopify discrepan.
3. §5.2 y §8 nombran "Meta Pixel Helper" → es **Meta Ads Data Advisor** desde la actualización automática; trae automatizaciones de configuración.
4. El plan no menciona el modo **Optimized** de pixels de app (2026-01-13), que puede dejar mudo el pixel de Meta sin campañas.
5. §1 deja "guardar informes personalizados puede requerir plan superior [NV]" → hoy [V]: todos los planes incluyen reportes y análisis personalizado.
6. §2 marca los 7 eventos como [V]; hoy la ayuda oficial **no** los enumera ([3P]); además AddPaymentInfo puede faltar con Wompi.
7. §3 y §8.3 prevén la prueba de "no regreso" en modo TEST de Wompi; Wompi ya está LIVE y la tienda es pública: solo es posible con un pago real mínimo (~COP 1.091) o con pedidos reales.
8. §8 asume que la verificación ocurre "en el lanzamiento" y que con contraseña no se podía validar → la tienda ya es pública (03Q); la validación se puede hacer hoy tras conectar Meta.
9. §8.10 "compra real mínima" sigue vigente; #1002 **no** la sustituye (anterior a Meta).
10. §2 trata el dominio verificado como requisito duro y no cubre AEM → hoy hay fuentes en conflicto sobre AEM/8 eventos (§7).
11. El plan anterior da por verificado el 2 % de Shopify por pasarela externa y la tarifa Wompi como estimación; hoy ambos están leídos en fuente oficial (2 % Basic: shopify.com/pricing; Wompi "2,65% + $700 + IVA"), aunque el IVA sobre la comisión sigue sin detallarse [NV].
