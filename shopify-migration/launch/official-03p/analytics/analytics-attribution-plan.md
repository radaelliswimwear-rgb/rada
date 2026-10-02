# Plan de analítica y atribución — Radaelli Swimwear (Shopify, Colombia)

- **Fecha:** 2026-10-02 · **Carril M** (diseño, solo lectura: no se configuró nada en Shopify, Meta ni Wompi).
- **Tienda:** `wgcvpd-ib.myshopify.com` · plan Basic · COP · pago Wompi con redirección · tema RC1.10 sin publicar.
- **Etiquetas:** **[V]** = documentación oficial leída hoy (fuentes en §9) · **[3P]** = fuente de terceros · **[NV]** = no verificado; se resuelve con una prueba indicada aquí.

## 0. Resumen para la dueña

1. **Camino estándar, sin código propio:** informes nativos de Shopify + app oficial **Facebook & Instagram** (pixel + Conversions API) en nivel **Máximo** (o Mejorado). Nada de GTM, pixels pegados en el tema ni el custom pixel de 03E (queda apagado).
2. **Riesgo principal:** Wompi cobra en una página externa. El `Purchase` del navegador depende de que la clienta **vuelva** a la página de gracias de Shopify. Por eso: (i) nivel Máximo/Mejorado (compra desde el servidor), (ii) una **prueba de “no regreso”** antes de abrir y (iii) **conciliación diaria Shopify ↔ Wompi ↔ Meta** (§3).
3. **Con la tienda con contraseña no se puede validar:** la app de Meta exige tienda no privada [V]; la verificación real ocurre en la ventana de lanzamiento (§8).
4. **No se escala el gasto** hasta pasar las puertas de §8; hoy faltan todos los costos de producto, Wompi y Envia (`unit-economics-inputs.csv`).

## 1. (a) Lo que Shopify mide solo, en Basic y sin apps

| Para responder | Dónde (Admin > Analytics > Reports) | Límite |
|---|---|---|
| Sesiones y visitantes | Acquisition: *Sessions over time*, *Visitors over time* [V] | Sesión = 30 min de inactividad, sin cortar a medianoche; filtra bots [V] |
| De dónde vienen | Acquisition: *Sessions by referrer*; Marketing: *Sessions attributed to marketing campaigns* [V] | Los navegadores internos de Instagram/Facebook suelen perder el referrer: sin UTM caen en “Directo” [3P] |
| Página de entrada | Behavior: *Sessions by landing page* [V] | — |
| Embudo | Behavior: *Conversion rate breakdown* (todas las sesiones → con carrito → llegaron a checkout → completaron) y *Conversion rate over time* [V] | **Vistas de producto:** la ayuda oficial no las lista como etapa **[NV]**; si no aparecen en su Admin, usar *Content views* de Meta y *Sessions by landing page* de las fichas |
| Ventas por campaña/UTM | Marketing: *Sales attributed to marketing*, *Performance by UTM campaign*, *Performance by referring channel* [V] | Último clic, ventana 30 días por defecto; hay otros modelos (primer clic, lineal…) [V]; datos hasta 24 h de retraso [V] |
| Origen de un pedido | Orders > pedido > *Conversion summary* (1.ª/última visita, UTM) [V] | Puede salir vacío [V] |
| Ventas, productos, devoluciones | Sales reports (por producto, por canal, devoluciones) | Base para AOV y reembolsos |

**Lo que Shopify NO da:** gasto, impresiones, alcance, CPM, CTR, CPC (solo Meta). Sus **sesiones no son** los clics ni las *landing page views* de Meta [V]. Guardar informes personalizados puede requerir un plan superior **[NV]** (terceros: Advanced+). Con banner en Colombia, quien rechace no se mide (esperable **[NV]**), pero el pedido sí queda en Shopify.

## 2. (b) Camino estándar de Meta

**App:** Sales channels > **Facebook & Instagram** > Settings > **Data sharing settings** [V].

| Nivel | Qué hace [V] | Uso |
|---|---|---|
| Standard | Solo pixel del navegador (bloqueable) | Solo como parche de horas; **no escalar con este nivel** |
| Enhanced | Pixel + Conversions API; comparte nombre, ubicación, correo y teléfono para emparejar | Válido |
| **Maximum** | Igual que Enhanced + la tecnología publicitaria más reciente de Meta | **Recomendado** una vez actualizada la política de privacidad (§7) |

Eventos que envía la app: PageView, ViewContent, Search, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase [V] (todo el embudo; “sesiones” = *Landing page views* en Meta).

**Activos de Meta** (la dueña inicia sesión y da consentimiento; Claude nunca):

| Activo | Estado conocido |
|---|---|
| Cuenta de Facebook con **control total** del portafolio y la Página [V] | Dueña |
| **Business portfolio** (antes Business Manager) | El DNS actual ya tiene un TXT `facebook-domain-verification` → existe un portafolio que verificó `radaelliswimwear.com`; **confirmar cuál** |
| **Página de Facebook publicada** [V]; cuenta de Instagram (para anuncios en IG) | Por confirmar |
| **Cuenta publicitaria** con método de pago (solo la dueña) [V] | Por confirmar |
| **Dataset / Pixel** | El sitio antiguo usaba un pixel (ID termina en …6037) y un CAPI propio; en `.env.example` estaban apagados, el estado real en Vercel es **[NV]** |
| **Dominio verificado** [V: los productos deben poder comprarse desde el dominio verificado] | Al cambiar solo A y CNAME (runbook S5) el TXT se conserva. Si no figura verificado: añadir el TXT en Hostinger (preferible a la meta-etiqueta, que obliga a editar el tema), solo tras conectar el dominio |

**Decisión de dataset (dueña):** reutilizar portafolio, Página, cuenta y dominio; reutilizar el dataset **solo si** Events Manager > Overview confirma que el sitio antiguo ya no envía eventos de servidor (apagar `ANALYTICS_*`/token de CAPI en Vercel tras el corte). Si hay duda, dataset nuevo: no hay ventas históricas que preservar y evita mezclar emisores.

**Requisitos de Shopify** [V]: tienda sin contraseña, correo de remitente válido, negocio en país soportado para Shops (Colombia figura como soportado en fuentes de terceros **[3P]**; se comprueba al conectar).

**No duplicar:** un pixel pegado a mano además de la app deja datos duplicados [V]. El tema RC1.10 no contiene `fbq`, `gtag` ni código de consentimiento (revisado en la copia de trabajo; solo `content_for_header`); revisar también que *Settings > Customer events* no tenga pixels personalizados.

**Deduplicación:** Meta cuenta una vez navegador+servidor si `event_name` y `event_id` coinciden y llegan en 48 h; si solo un lado trae `event_id`, no deduplica [V]. Shopify no publica qué `event_id` usa (terceros: el id del pedido **[3P]**) → se verifica con la prueba de §5.

**Ads Manager:** leer siempre con el mismo ajuste de atribución (por defecto **7 días clic + 1 día vista** tras los cambios de enero de 2026 **[3P]**). Meta no recibe reembolsos **[NV]**.

## 3. (c) El riesgo Wompi (pago en página externa)

**Cadena de hechos**
1. El plugin de Wompi usa **redirección**: la clienta sale del checkout, paga en Wompi y vuelve [V].
2. El `Purchase` del pixel nace de `checkout_completed`, que ocurre normalmente en la página de gracias; **si esa página no carga, el evento no se dispara** [V].
3. Shopify documenta que con pasarelas externas, si la clienta cierra la pestaña o navega antes de volver, el pago puede fallar o quedar **cobrado en el proveedor sin pedido en Shopify** (suele verse como *checkout abandonado* [3P]); remedio documentado: verificar en el panel del proveedor y crear un pedido manual marcado como pagado [V].
4. Wompi no garantiza la redirección en su documentación y entrega el estado final por el webhook `transaction.updated` (reintenta a los 30 min, 3 h y 24 h) [V]. En Shopify ese webhook va a una URL de terceros (`conexa.ai`), ya configurada en pruebas y producción (A4).
5. **No está documentado** si este plugin crea el pedido al llegar el webhook cuando la clienta **no** volvió **[NV]**. Es lo primero que hay que medir.

**Escenarios**

| | Pedido en Shopify | Purchase en Meta | Efecto en la medición |
|---|---|---|---|
| **E1** el webhook crea el pedido | Sí | Con Máximo/Mejorado, desde el servidor al crearse el pedido **[3P/NV]**; **no** con Standard ni en GA4 | Subconteo solo si el nivel es Standard |
| **E2** no hay pedido hasta que vuelve | **No** (dinero en Wompi, carrito abandonado) | **No** | ROAS falsamente bajo y ventas perdidas si nadie concilia |

**Prueba obligatoria de “no regreso” (modo TEST, sin efecto público; la dueña escribe la tarjeta de prueba):** pagar en el sandbox de Wompi y **cerrar la pestaña en la página de Wompi** antes de la redirección; revisar *Orders* y *Orders > Abandoned checkouts* a los 10 y 40 min (Wompi reintenta a los 30 min); repetir con el botón “atrás”. Resultado = E1 o E2. Meta aún no estará conectada: si el `Purchase` de servidor llega sin regreso se confirma con los primeros pedidos reales (§8, pasos 10–11), y se anota si los pedidos de prueba generan `Purchase` **[NV]**.

**Mitigaciones sin código:** nivel Máximo/Mejorado; URL de eventos de Wompi también en **producción** al pasar a LIVE (entornos independientes [V]); texto “no cierres la ventana hasta volver a Radaelli” (carrito/FAQ/correo); revisar *Abandoned checkouts* 2 veces al día los primeros 14 días; preguntar a Wompi por tarjeta dentro del checkout sin redirección (la documentación del plugin la menciona; disponibilidad **[NV]**).

**Conciliación diaria** (día cerrado, America/Bogota 00:00–23:59)

| Paso | Fuente | Qué sacar |
|---|---|---|
| 1 | **Shopify** Orders: pagados del día, sin cancelados ni de prueba | `N_S` pedidos, `$_S` total, lista de números y referencia Wompi |
| 2 | **Wompi** panel > Transacciones: `APPROVED` del día (producción) | `N_W`, `$_W`, referencias |
| 3 | **Meta** Events Manager > dataset > Overview: Purchase del día, por Navegador/Servidor | `N_M`, `$_M` |
| 4 | Comparar `N_W` vs `N_S` por referencia | `W>S`: pagó y no hay pedido → revisar *Abandoned checkouts*, contactar a la clienta, crear pedido manual pagado con la referencia Wompi y anotarlo. `S>W`: pedido sin pago aprobado → **no despachar** (PSE/Nequi pendientes) |
| 5 | Comparar `N_M` vs `N_S` | `M<S`: pérdida (E1/E2, consentimiento, bloqueadores). `M>S`: duplicados o pedidos de prueba (§5) |
| 6 | Registrar | fecha · N_S · $_S · N_W · $_W · N_M · $_M · W−S · M−S · acción · resuelto |

Durante los primeros 20 pedidos se investiga **toda** diferencia; la tolerancia permanente (`TOL_RECONCILIACION`) se fija después con datos reales. Frecuencia: diaria 14 días; luego semanal y cada vez que el ROAS se vea raro.

## 4. (d) Convención de UTM

**Reglas:** minúsculas, sin espacios ni tildes, solo `a-z 0-9 _`; no etiquetar enlaces internos de la tienda (reinician la fuente); `utm_campaign` único por campaña. Los nombres de campaña y de anuncio de Meta siguen la misma regla porque alimentan los UTM.

| Canal | utm_source | utm_medium | utm_campaign | utm_content / term |
|---|---|---|---|---|
| Meta Ads (FB+IG) | `facebook` | `paid_social` | `{{campaign.name}}` = `cmp_<objetivo>_<producto>_<aaaamm>` | content `{{ad.name}}` = `cr_<producto>_<formato>_<gancho>_v<n>`; term `{{adset.name}}` |
| Instagram bio / stories | `instagram` | `social` | `bio` · `story_<aaaammdd>` | — |
| WhatsApp | `whatsapp` | `chat` | `catalogo` · `promo_<nombre>` | — |
| Email | `email` | `email` | `news_<aaaamm>` | — |
| Aliada/influencer | `<usuario>` | `influencer` | `<codigo>` | — |
| QR/impreso | `qr` | `offline` | `<lugar>` | — |

Cadena para el campo **URL parameters** del anuncio: `utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}` [3P: macros dinámicas de Meta].
**Producto por campaña:** como el cruce producto×campaña no es nativo en Basic, cada conjunto de anuncios apunta a **una ficha o colección** y el nombre de campaña lleva el producto.
**Lectura en Shopify:** *Marketing > Sales attributed to marketing / Performance by UTM campaign*, *Sessions attributed to marketing campaigns*, *Orders > Conversion summary* [V].
**Pruebas antes de pagar anuncios:** abrir una URL con `?utm_source=test&utm_medium=test&utm_campaign=test` en el apex, en `www`, en `/en/` y en 3 de las 51 redirecciones antiguas: el UTM debe llegar intacto a la página final **[NV: no se probó si las redirecciones conservan la consulta]**; luego comprobar que la sesión aparece en *Sessions attributed to marketing campaigns*.

## 5. (e) Verificación de compras duplicadas

1. **Un solo emisor:** *Settings > Customer events* solo con pixels de apps oficiales; sin GTM ni código en el tema.
2. **Meta Pixel Helper** (extensión de Chrome; el *Pixel Helper* del Admin de Shopify solo sirve para pixels personalizados y no funciona con contraseña [V]): un solo ID, sin aviso de pixel duplicado, un `PageView` por carga.
3. **Events Manager > Test events > Test browser events** con la URL de la tienda: ficha → carrito → checkout; cada evento una vez.
4. **Compra de prueba:** `Purchase` de “Navegador” y de “Servidor” que Meta muestra como **un** evento deduplicado; en el detalle, **mismo `event_id`** en ambos (si falta en uno no hay dedupe [V]). Recargar la página de gracias 2 veces: no suma otro.
5. **Conteo cruzado** (72 h y semanal): `Purchase` de Meta (Overview, todos los orígenes) vs pedidos pagados de Shopify. `Purchase > pedidos` = duplicados o pruebas; `<` = pérdida (§3).
6. **Pedidos internos:** los de la dueña y de prueba (incluida la compra real mínima) se etiquetan `interno`, se anota fecha/hora y se restan de MER/ROAS; un `Purchase` enviado a Meta no se borra.
7. **Aceptación:** la atribución es confiable solo con 0 duplicados en la ventana de la puerta B2 (§8).

## 6. (f) GA4 / Google (opcional)

No se instala el primer mes si solo se pauta en Meta: Shopify nativo + Meta cubren el embudo. **Vale la pena** cuando (i) haya un segundo canal pago (Google Ads, TikTok) y se necesite una vista neutral, o (ii) el tráfico orgánico/SEO sea relevante. Costos: otra capa de consentimiento, riesgo de doble conteo y el mismo problema Wompi (`purchase` también depende de la página de gracias). Si se instala: solo con la app **Google & YouTube**; GA4 no registra con la tienda en modo privado [V].

## 7. (g) Privacidad y consentimiento en Colombia (lista de verificación, **no es asesoría legal**; validar con asesor)

- [ ] **Política de tratamiento de datos / aviso de privacidad** con Responsable identificado (razón social, NIT, dirección, correo, canal de consultas y reclamos). Hoy faltan (D9 / F1–F19).
- [ ] **Política de cookies** actualizada: la heredada dice que las analíticas y de marketing “Hoy no las usamos”; deja de ser cierta al conectar Meta (y quizá ni con todo apagado, por cookies propias de Shopify).
- [ ] **Terceros declarados:** Shopify, Meta, Wompi, Envia; con Mejorado/Máximo se comparten con Meta nombre, ubicación, correo y teléfono [V].
- [ ] **Autorización previa, expresa e informada:** la SIC trata las cookies que recogen datos personales bajo la Ley 1581 de 2012 **[3P, validar]**. Operativamente: banner de Shopify activo en **Colombia** (*Settings > Customer privacy > Cookie banner*: desactivar ajustes automáticos, *Regions > Edit*, agregar Colombia y cada mercado activo, textos en español). Por defecto solo se activa para UK/EEE y donde no hay banner rige “permitir todo” [V].
- [ ] **Tema:** RC1.10 no trae banner ni enlace de preferencias propios; los pone Shopify con el banner activo (enlace en la sección de políticas [V]). Comprobarlo en la tienda pública.
- [ ] **Correo/WhatsApp de marketing:** consentimiento separado en el checkout; sin suscribir desde datos históricos sin autorización (D7).
- [ ] **Derechos del titular:** canal y plazos publicados; registro en el RNBD según umbral de activos **[validar]**.
- [ ] **Probar el banner:** rechazar → el navegador no envía a Meta (Pixel Helper); aceptar → envía; revocar → corte.

## 8. (h) Go-live por fases (quién hace qué)

**Leyenda:** **DUEÑA** = solo ella (login, consentimiento, tarjeta, DNS/Meta) · **COORD** = coordinador/Claude con herramientas existentes.

| Fase | Paso | Quién | Efecto público |
|---|---|---|---|
| **ANTES** (contraseña puesta) | 1. Confirmar activos de Meta (portafolio, Página, IG, cuenta publicitaria + método de pago, dataset, dominio verificado) y decidir dataset nuevo/reutilizado | **DUEÑA** (login Meta) | No |
| | 2. Completar `unit-economics-inputs.csv` (costos reales) | **DUEÑA** (+contador) | No |
| | 3. Prueba “no regreso” de Wompi en TEST (E1/E2) y revisar si los pedidos de prueba envían `Purchase` | COORD prepara; **DUEÑA** escribe la tarjeta de prueba | No |
| | 4. Redactar política de privacidad/cookies y configurar el banner con Colombia | COORD (con datos F1–F19 de la **DUEÑA**) | No (tienda privada) |
| | 5. Verificar *Customer events* vacío, tema sin pixels, UTM y redirecciones en el dominio `myshopify` | COORD | No |
| | 6. Hoja de enlaces UTM y nombres; borradores en Ads Manager **sin publicar** | **DUEÑA** (plantilla COORD) | No |
| | 7. Intentar instalar la app y conectar activos con la contraseña puesta (quizá Shopify solo deje terminar con tienda pública) | **DUEÑA** (OAuth) | No |
| **EN EL LANZAMIENTO** (tras GO: contraseña fuera, tema publicado, Wompi LIVE) | 8. Terminar la conexión Meta: dataset, **nivel Máximo**, permisos; verificar dominio si falta (TXT) | **DUEÑA** | Sí |
| | 9. Recorrido con Pixel Helper + Test events en el dominio real (§5.2–5.3) y clic en un enlace UTM de prueba | COORD | No |
| | 10. Compra real mínima: un `Purchase` deduplicado con el mismo `event_id`; etiquetar `interno` (la prueba S3 con contraseña puesta valida solo el pago; la analítica se valida aquí o con el primer pedido real) | **DUEÑA** paga; COORD verifica | Sí |
| **PRIMERAS 72 h** | 11. Conciliación diaria (§3), *Abandoned checkouts* 2 veces al día, Events Manager > Diagnostics, conteo de duplicados (§5.5) | COORD (+**DUEÑA** para contactar clientas/Wompi) | No |
| | 12. Gasto solo de prueba, sin escalar (monto: lo decide la dueña) | **DUEÑA** | Sí |
| **ANTES DE ESCALAR** | **Puertas (todas):** B1 conciliación Shopify=Wompi sin diferencias sin explicar durante `DIAS_CONCILIACION_OK` días (sugerencia: 7) · B2 0 duplicados en esa ventana · B3 CSV completo (sin `FALTA_DATO`) con CPA/ROAS de equilibrio · B4 UTM en el tráfico de anuncios (`MIN_COBERTURA_UTM`) · B5 mismo ajuste de atribución · B6 política, cookies y banner publicados · B7 reembolsos medidos al menos una vez | **DUEÑA** decide con el tablero | — |

**Solo la dueña:** login/consentimiento/OAuth de Meta; método de pago de la cuenta publicitaria; TXT de dominio en Hostinger; tarjetas (prueba y real); apagar el modo de prueba de Wompi; datos legales F1–F19; costos reales; decisiones de dataset, nivel de datos y presupuesto; publicar/pausar campañas.

## 9. Fuentes (consultadas 2026-10-02)

- Shopify Help (help.shopify.com/en/manual/…): `promoting-marketing/analyze-marketing/` [meta-data-sharing](https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing), [meta-pixel](https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-pixel), [marketing-performance](https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/marketing-performance) · [Facebook & Instagram requirements](https://help.shopify.com/en/manual/online-sales-channels/social-commerce/facebook-instagram-by-meta/requirements-and-considerations) · reportes `reports-and-analytics/shopify-reports/report-types/default-reports/`: [marketing](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/marketing-reports), [behaviour](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/behaviour-reports), [acquisition](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/acquisition-reports) · [session measurement](https://help.shopify.com/en/manual/reports-and-analytics/discrepancies/session-measurement-update) · [conversion summary](https://help.shopify.com/en/manual/fulfillment/managing-orders/analytics/conversion-summary) · [pixels overview](https://help.shopify.com/en/manual/promoting-marketing/pixels/overview), [testing](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/testing) · [customer privacy](https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings) · [troubleshooting payments](https://help.shopify.com/en/manual/checkout-settings/troubleshooting-checkout-payments)
- Shopify.dev: [checkout_completed](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed), [payment processing](https://shopify.dev/docs/apps/build/payments/processing) · Wompi: [plugin Shopify](https://docs.wompi.co/en/docs/colombia/wompi-shopify-plugin/), [eventos](https://docs.wompi.co/en/docs/colombia/eventos/), [redirect-url](https://docs.wompi.co/en/docs/colombia/widget-checkout-web/) · Meta: [deduplicación](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)
- [3P]: artículos sobre atribución de Meta (enero 2026), macros de URL dinámicas, boletín de la SIC sobre cookies (2016) y planes de informes de Shopify. Base previa: `03E-analytics-plan.md`, `03F-analytics-owner-runbook.md`.
