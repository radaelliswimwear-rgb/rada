# CLAUDE DOWNGRADE READINESS — ¿se puede operar la tienda después del 2026-10-20?

Preparado: 2026-10-02 (viernes). Fecha límite: **2026-10-20 (martes)**, fin de la suscripción de alta capacidad.
Meta: dueña sola + ayuda ocasional de bajo costo (fallas, promociones, validación, mantenimiento).
Marcas: `GAP` = hueco a cerrar antes del 2026-10-20 · `PENDIENTE_DUEÑA` / `CONFIRMAR_EN_ADMIN` = dato no confirmado.

**Estado 2026-10-02 tarde (actualizado ~12:58 Bogotá):** la tienda es **pública** en `https://radaelliswimwear.com` desde ~11:23 (tema Radaelli RC1.10 publicado, Horizon en borrador, contraseña quitada, dominio principal conectado, certificado Let's Encrypt válido hasta 2026-12-31, DNS cambiado en Hostinger solo en el A `@` y el CNAME `www`). **Wompi está en LIVE** ("Activa", modo de prueba apagado) y un pago real de prueba (pedido #1002, $5.000 con Nequi, neto $4.009,33) funcionó; **el reembolso desde Shopify quedó PENDIENTE y no se completó en más de 40 minutos (GAP-03 redefinido: los reembolsos NO son automáticos)**. Privacidad y cookies se reemplazaron por textos actualizados (revisión de abogado pendiente); la dirección nativa de la política de privacidad aún mostraba el texto automático (GAP-27 nuevo). La app Facebook & Instagram está instalada pero falta que la dueña conecte el dataset de Meta (GAP-26 nuevo). El monitor de solo lectura (`monitor.mjs`) corrió a las 12:19: TODO OK. Aún no hay pedidos reales de clientas. Los números de la sección 0 son de ANTES del lanzamiento (~10:20); abajo están marcados los que cambiaron.

## 0. Lecturas de solo lectura hechas para este paquete (Admin API, tienda `wgcvpd-ib`, 2026-10-02 ~10:20, ANTES del lanzamiento)
- Plan Basic · COP · America/Bogota · `taxesIncluded=false` · 1 ubicación activa (Barranquilla) · mercado Colombia activo · `en` principal y `es` publicado.
- 29 productos · 98 variantes: 98 rastreadas, **128 unidades**, política "denegar" en 98, 500 g en 98, precio = 80 % del tachado en 98.
- Envío: 5 zonas × 2 tarifas (9.900/12.900/17.900/21.900/44.900 y gratis) · 51 redirecciones.
- Temas: Horizon (publicado) y Radaelli RC1.10 (sin publicar). RC1.10 trae APAGADOS los mensajes de envío gratis. **[Actualizado 10-02 tarde: RC1.10 publicado desde ~11:23; Horizon es borrador.]**
- Pedidos: 1 (prueba #1001 archivado). El token del asistente no tiene `read_discounts`, `read_draft_orders`, `read_customers` ni `read_privacy_settings`. **[Actualizado 10-02 tarde: existe además el #1002, compra real de prueba por $5.000 con Nequi, cancelado con reembolso pendiente; ningún pedido real de clientas.]**
- Ninguna escritura. Laboratorio y tienda "launch" no se tocaron.
- Leído en los archivos de traspaso (10:20): el dominio ya está conectado en Shopify sin cambiar el DNS; el lanzamiento aún espera el GO de la dueña. **[Actualizado 10-02 tarde: lanzado; ver el recuadro de estado arriba.]**

## A. Incidentes y ajustes rutinarios

**¿Sin código propio?** SÍ = solo Admin de Shopify/Wompi/Envia/Hostinger · PARCIAL = SÍ con una parte sin ensayar o que pide ayuda · NO = exige código o acceso del asistente. **Quién:** D = dueña sola · IA = dueña con IA de bajo costo guiando · A = asistente con acceso.

| ID | Escenario | Documento y sección | Pasos máx. | ¿Sin código propio? | Quién |
|---|---|---|---|---|---|
| R01 | Revisión diaria de pedidos, pagos e inventario | Manual §3; 04 §2 | 6 | SÍ | D |
| R02 | Primer pedido real hasta el despacho | Manual §4; 03 §4 | 12 | SÍ (UI de Envia, GAP-06) | D |
| R03 | Reponer inventario; sobreventa | 04 §3–4 | 5 | SÍ | D |
| R04 | Cancelar pedido de prueba con reposición | 04 §5 | 8 | SÍ | D |
| R05 | Pago aprobado sin pedido | 02 §5C | 8 | PARCIAL (pedido manual sin ensayar, GAP-04) | IA |
| R06 | Reembolso a una clienta (devolver el dinero por Wompi o transferencia + nota en el pedido) | 02 §6; 12 §3D | 6 | PARCIAL (el reembolso automático Shopify→Wompi NO está comprobado: quedó PENDIENTE >40 min el 10-02; el procedimiento manual se ensaya con dinero real solo cuando haya un caso, GAP-03) | IA |
| R07 | Wompi prueba↔real; llaves inválidas; doble cobro | 02 §2, §5E–F | 4 | SÍ | D |
| R08 | Cambiar barra de anuncio o banner | 05 §2–3 | 8 | SÍ | D |
| R09 | Crear cupón o descuento automático | 05 §4 | ~8 | SÍ (nativo) | D |
| R10 | Cambiar % de la promo o terminarla (tachado en 98 variantes) | 05 §6–7 | 6 | PARCIAL (edición masiva; mecanismo propio, GAP-11) | IA |
| R11 | Encender mensajes de envío gratis | 05 §8 | 3 | SÍ (decisión, GAP-10) | D |
| R12 | Cambiar textos, colores o imágenes del tema | 06 §2–3 | 7 | SÍ | D |
| R13 | Restaurar tema desde copia / desde ZIP | 06 §5A–B | 3 / 7 | SÍ / PARCIAL (ZIP sin ensayar, GAP-02) | D |
| R14 | **Error de código del tema** | 06 §10 | — | **NO** (GAP-13) | A |
| R15 | Conectar dominio, cambiar y verificar DNS | 01 §2–4 | 5+6 | SÍ | D |
| R16 | Rollback (mínimo: contraseña ON; completo: DNS a Vercel) | 01 §5.0–5.1 | 2 / 9 | SÍ el mínimo (contraseña ON, sin tocar DNS); PARCIAL el completo (la URL anterior de eventos de Wompi se infiere, no se leyó, GAP-01) | D / D+IA |
| R17 | Remitente `info@` y SPF/DKIM | 07 §2 | 9 | PARCIAL (un solo SPF, GAP-05) | IA |
| R18 | Probar correos; cliente sin correo | 07 §5–6 | 4 | SÍ | D |
| R19 | Respaldo semanal/mensual | 08 §3 | 5 | SÍ | D |
| R20 | Restauración parcial (productos por CSV) | 08 §5 paso 5 | 1 + ayuda | PARCIAL | IA |
| R21 | **Recuperación total** | 08 §5 | 11 | **NO** hoy (usa scripts, B2) | A |
| R22 | Tienda con contraseña/suspendida/no abre; 429; SSL | 10 §6, §12–14 | 3 c/u | SÍ | D |
| R23 | Error de pago; Wompi no aparece; producto agotado raro | 10 §7–8, §11 | 3 c/u | SÍ | D/IA |
| R24 | Tarifa de envío equivocada o cambiar umbral | 10 §9–10; 05 §8 | 3 | SÍ revisar; corregir = PARCIAL (10 tarifas + tema) | IA |
| R25 | Costos, renovaciones, cuentas | 09 | 4 | SÍ (datos PENDIENTE) | D |
| R26 | **Agregar producto o talla nuevos** | 11 | — | **PARCIAL** (escrito 10-02; falta revisión de la dueña y prueba con IA de bajo costo, GAP-23/25) | IA |
| R27 | **Devoluciones y cambios** | 12 | — | **PARCIAL** (borrador 10-02; faltan decisiones de la dueña, GAP-24; el reembolso es manual, GAP-03) | IA |
| R28 | **Medición de anuncios (Meta/GA4, ROAS)** | **fuera de este paquete** (tablero semanal y monitor: 09 §1, 10 §4.1) | — | Por definir: app Facebook & Instagram instalada; falta que la dueña conecte el dataset de Meta (GAP-14, GAP-26) | IA |
| R29 | Revisión del monitor de solo lectura (`monitor.mjs`) y lectura de sus alertas con la guía `monitoring-runbook-es.md` | 10 §4.1 | 3 | PARCIAL (el script lo corre quien tenga Node; la dueña sola lee el resultado y sigue 10 Parte 2) | IA / A |

## B. Dependencias de scripts o procesos propios

| ID | Dependencia | Uso | Propuesta | Fecha |
|---|---|---|---|---|
| B1 | Shopify CLI + sesión del asistente | Subir/bajar tema, consultas masivas | AISLAR (solo asistente). La dueña restaura por Admin con ZIP | 10-09 |
| B2 | `launch/tools/03l-migrate.mjs` (olas) | Migración y **recuperación total** | ESTANDARIZAR: kit de recuperación importable por el Admin (CSV de productos, redirecciones, textos); script marcado "SOLO RECUPERACIÓN" | 10-12 |
| B3 | `launch/official-03p/laneC__*.mjs` (verificar/aplicar envíos, umbral) | Reaplicar o verificar las 5 zonas | SIMPLIFICAR: prueba manual de 2 carritos y tabla de zonas (doc 10 §10). Scripts opcionales | 10-09 |
| B4 | `03o-inventory-verify.mjs`, `03o-inventory-sheet.mjs` | Comparar con la hoja de 98 filas | REEMPLAZAR por exportar + libro de inventario (doc 04) | 10-09 |
| B5 | Scripts "en página" (kit `launch/official-03p/post-launch-cert/`, `03p-final-audit-*.js`, `03k-surface-check.js`, `03i-checkout-probe.js`) | Certificación de lanzamiento (piden una herramienta que ejecute JavaScript en el navegador) | REEMPLAZAR por revisión manual de 10 puntos (doc 10 §1, doc 06 §6); el kit queda como evidencia y herramienta del asistente | 10-09 |
| B6 | `03g-*`, `03i-*`, `03k-*`, `03m/n/o-*` | Etapas de migración cerradas | ARCHIVAR en `ARCHIVO-NO-EJECUTAR` con README | 10-09 |
| B7 | `build-theme-rc.mjs`, `audit-theme-limits.mjs`, Theme Check | Construir una versión nueva del tema | AISLAR: solo si se cambia código. RC1.10 CONGELADO | 10-09 |
| B8 | Tema propio RC1.10 (Liquid/JS) | Todo el diseño | Congelar; solo editor; plan B Horizon; definir quién arregla código (GAP-13) | 10-12 |
| B9 | Promo "horneada" (precio = 80 % del tachado + texto manual) | Promo 20 % | Documentada (doc 05). Decidir pasar a descuento nativo con fecha de fin (GAP-11) | 10-09 |
| B10 | Integrador de eventos `conexa.ai` (de Wompi) | Crea pedidos al pagar | EXTERNO. Preguntar a Wompi quién es y qué datos recibe | 10-12 |
| B11 | App de favoritos de Radaelli | — | NO instalada; "Sincronizar favoritos" APAGADO | — |
| B12 | Rama `shopify-migration-backup` (GitHub) | Respaldo | Copia en el Drive de la dueña (GAP-09) | 10-05 |

## C. GAPs, responsable propuesto y fecha (2026)

| GAP | Qué falta | Responsable | Fecha |
|---|---|---|---|
| 01 | URL anterior de eventos de Wompi (producción) del sitio viejo no registrada; desde ~08:10 del 10-02 apunta a Shopify y el sitio viejo puede no recibir confirmaciones. **Actualización 10-02 10:40: inferida del código viejo (`app/api/webhooks/wompi/route.ts`): `https://radaelliswimwear.com/api/webhooks/wompi` (no leída de Wompi); preferir el rollback MÍNIMO (contraseña ON, sin tocar DNS).** **Estado 10-02 tarde: el corte de DNS YA se hizo (tienda pública ~11:23) y el valor sigue siendo INFERIDO, no confirmado en el panel de Wompi. Sigue abierto como riesgo de rollback completo; el rollback mínimo (documento 01, §5.0) no lo necesita.** | Dueña + coordinador | confirmar antes del retiro del sitio viejo (GAP-17); mínimo 10-16 |
| 02 | Ensayar restauración del tema por ZIP y dejar copia "RESPALDO CONGELADO" | Coordinador | 10-07 |
| 03 | **REDEFINIDO 10-02 tarde.** Antes: "probar reembolso Shopify→Wompi con la compra real de lanzamiento". Resultado de la prueba (pedido #1002, $5.000 con Nequi): al cancelar con reembolso desde Shopify se creó una transacción de REEMBOLSO en estado **PENDIENTE** que no se completó en más de 40 minutos y Wompi no mostró ningún reembolso; con Nequi el panel de Wompi no tiene "Anular". **Los reembolsos a clientas NO están comprobados como automáticos.** Procedimiento seguro documentado (02 §6; 12 §3D): decidir el reembolso, devolver el dinero por Wompi (si el panel lo ofrece) o por transferencia, y después cancelar/registrar en Shopify con nota de personal; la comisión no se devuelve. **Falta:** que soporte de Wompi/Shopify confirme si el reembolso pendiente se completa o se anula, y si existe vía de reembolso en el panel para tarjeta/PSE | Dueña (consulta a Wompi) + coordinador | consulta a Wompi/Shopify: 10-09; no se cierra hasta ver un reembolso completado |
| 04 | Ensayar "pago sin pedido" (pedido manual, marcar pagado, cancelar) | Coordinador + dueña | 10-09 |
| 05 | Remitente `info@`: buzón, DKIM/SPF sin duplicar SPF | Dueña con IA | 10-12 |
| 06 | Datos de Envia (costos, recarga, sincronía, cancelación) y primeras 10 guías vs tarifas fijas. **10-02 tarde:** integración de Shopify "Activo", dirección de origen configurada, saldo de Envia $0: la dueña debe recargar antes de la primera guía | Dueña | 10-09 |
| 07 | Contactos de soporte (Wompi, Envia, Hostinger) | Dueña | 10-06 |
| 08 | Costos/renovaciones: dominio, Hostinger, tarifa Wompi, plan de IA. **PARCIAL 10-02 tarde:** ya conocidos y documentados (09 §3): Shopify Basic (prueba de 3 días en curso; US$1/mes hasta 2027-01-04, luego US$25/mes), comisión de Shopify 2 % y comisión real de Wompi 2,65 % + $700 + IVA 19 % (medida con Nequi), app Facebook & Instagram gratis. **Siguen `PENDIENTE_DUEÑA`:** renovación y costo del dominio y de Hostinger, contrato de Wompi (si hay otra tarifa para tarjeta/PSE), costos de Envia, plan de IA posterior | Dueña | 10-09 |
| 09 | Copia de respaldo en el Drive de la dueña (export completo + ZIP del respaldo) | Dueña + coordinador | 10-05 |
| 10 | Mensajes de envío gratis apagados en el tema; la tienda sí tiene envío gratis | Dueña decide; coordinador aplica | 10-09 |
| 11 | Promo sin fecha de fin; mecanismo de tachado; revisión con asesor (Ley 1480 art. 33, `[validar]`) | Dueña + asesor | 10-09 |
| 12 | **PARCIAL 10-02 10:38:** identidad mínima del vendedor (nombre/NIT/dirección/teléfono/correo aprobados por la dueña) ya publicada en «Información de contacto», «Aviso legal», página «Contacto» y enlaces del pie. **Sigue pendiente (antes de 10-02 tarde):** ciudad en la dirección (confirmar), política de privacidad (nombra proveedores del sitio viejo y omite Shopify, Envia y el integrador), retracto, política de envíos vs tarifas fijas. **ACTUALIZACIÓN 10-02 tarde (PARCIALMENTE CERRADO):** la política de privacidad (`/pages/privacidad` y la política nativa en Admin) y la de cookies (`/pages/cookies`) se **reemplazaron** por textos exactos (Ley 1581 de 2012, derechos y plazos de 10/15 días hábiles; encargados: Shopify, Wompi y su servicio técnico, Envia/transportadora, Gmail, WhatsApp, hCaptcha y Meta si se aceptan cookies); los textos anteriores están respaldados. El banner de cookies está configurado (no automatizado; 31 regiones europeas + Colombia; Aceptar/Rechazar/Administrar preferencias). **Siguen pendientes:** revisión por un **abogado colombiano** (no es asesoría legal), ciudad en la dirección, retracto, política de envíos vs tarifas fijas, y GAP-27 (la dirección nativa de privacidad aún mostraba el texto automático) | Dueña + asesor | 10-12 |
| 13 | Quién corrige errores de código del tema tras el 10-20 | Dueña decide; coordinador congela | 10-12 |
| 14 | Medición de anuncios: antes no había píxel (Configuración > Eventos de clientes vacío). **10-02 tarde: la app Facebook & Instagram (de Meta) YA está instalada y el píxel "Facebook & Instagram" aparece en Eventos de clientes; la conexión del dataset de Meta está PENDIENTE de la dueña (GAP-26).** Falta además verificar compras sin duplicar y cerrar el tablero simple (gasto, ventas, CPA, ROAS); existe un tablero semanal privado (`https://claude.ai/artifact/Di9pTQW3cvGhCzG8eSV1GN`) que dice "seguir probando" mientras falten costos reales | Coordinador + dueña (login Meta) | antes de gastar en anuncios; máx. 10-16 |
| 15 | Aislar/archivar scripts (B2–B7); kit de recuperación; instrucciones de tarifas | Coordinador | 10-09 y 10-12 |
| 16 | Acceso: gestor de claves, 2 pasos/passkey, códigos de recuperación, persona de confianza (`CONFIRMAR_EN_ADMIN`: límite de usuarios) | Dueña | 10-09 |
| 17 | Retiro del sitio viejo: fecha, costo, datos históricos (D7). **10-02 tarde:** el sitio viejo (Vercel) ya no recibe tráfico del dominio (DNS cambiado); no lo borres mientras exista posibilidad de rollback completo (documento 01 §5.1) | Dueña | 10-16 |
| 18 | Simulacros: la dueña ejecuta sola R03, R08 y R13 | Dueña + IA de bajo costo | 10-16 |
| 19 | Verificar en el Admin los nombres de menú marcados `CONFIRMAR_EN_ADMIN` | Coordinador | 10-07 |
| 20 | Actualizar recuadros "estado al escribir" (docs 01, 02, 06, 10) con valores reales tras el lanzamiento. **HECHO 10-02 tarde** en el manual y en los docs 01, 02, 03, 04, 06, 07, 08 (una fila), 09, 10, 11 y 12. **Falta:** hora exacta y quién hizo el cambio de DNS (doc 01 §7), primer pedido real de una clienta (anotar número y fecha) y repetir la revisión T+24 h | Coordinador | 24 h tras lanzar (10-03) |
| 21 | Códigos de descuento no legibles por sistema: la dueña mira Descuentos | Dueña | día del lanzamiento |
| 22 | Plantillas de correo del personal en inglés; destinatario `info@` | Dueña | 10-16 |
| 23 | ✅ **ESCRITO 10-02 10:36** — `11-agregar-producto-nuevo.md` (falta revisión de la dueña y pruebas con IA de bajo costo, GAP-25). Antes: Documento "Agregar un producto nuevo" (opción Talla, color, colección, etiquetas, 500 g, inventario rastreado, canal Tienda online, envío) | Coordinador | 10-09 |
| 24 | ✅ **BORRADOR 10-02 10:36** — `12-devoluciones-y-cambios.md` (base = política publicada; deja `PENDIENTE_DUEÑA` las decisiones de retracto, plazos, envío de devolución, comisión Wompi). Antes: Documento "Devoluciones y cambios" | Coordinador + dueña | 10-12 |
| 25 | Probar el "paquete de ayuda" (sección D) una vez | Dueña | 10-16 |
| 26 | **NUEVO 10-02 tarde.** La conexión del dataset de Meta (píxel de la app Facebook & Instagram, ya instalada el 10-02) **exige un clic y el inicio de sesión de Meta de la dueña**; el equipo no puede hacerlo por ella. Sin esa conexión no hay medición de anuncios (GAP-14). `PENDIENTE_DUEÑA` | Dueña (con guía del coordinador) | antes de gastar en anuncios; máx. 10-16 |
| 27 | **NUEVO 10-02 tarde.** La dirección nativa `/policies/privacy-policy` todavía mostraba el texto **automático** de Shopify a las 12:50, aunque en el Admin figura el texto de la dueña y "Usar política automatizada" está APAGADO. La página `/pages/privacidad` sí tiene el texto nuevo. Abierto: volver a revisar; si persiste, volver a guardar la política y, si no cambia, consultar a Soporte de Shopify. Impacto: una página legal pública con un texto que no describe a Wompi/Envia/Meta hasta que se corrija | Coordinador (revisión) + dueña (soporte si hace falta) | revisar 10-03; cierre máx. 10-09 |

## D. Pedir ayuda a una IA de bajo costo (sin acceso a tu tienda)
Pega al empezar: (1) "Tienda Shopify Radaelli Swimwear, Colombia, COP, plan Basic, sin IVA; sigo el documento [XX] de mi manual"; (2) qué quieres hacer y qué ves (captura sin claves ni datos de clientes); (3) qué ya probaste; (4) "no toques precios, impuestos, envíos ni DNS sin respaldo".
Esa IA no entra a tu Admin ni a tu DNS: tú haces los clics y ella te guía. Por eso los documentos usan solo pantallas del Admin y copiar/pegar.
Ayuda dentro de Shopify: Sidekick (asistente del Admin) y Soporte de Shopify (`CONFIRMAR_EN_ADMIN`: español y plan).

## E. Criterios para firmar el cambio de plan (antes del 10-20)
- [ ] 10 documentos revisados por la dueña (10-09).
- [ ] GAP-01 a 04 cerrados (10-09). Estado 10-02 tarde: GAP-01 sigue con URL inferida; GAP-03 redefinido (reembolso no automático, falta respuesta de Wompi/Shopify); 02 y 04 sin ensayar.
- [ ] GAP-26 (dataset de Meta conectado) y GAP-27 (política nativa de privacidad corregida) cerrados antes de gastar en anuncios / 10-09.
- [ ] Respaldo en el Drive y restauración del tema ensayada; menús verificados (10-07).
- [ ] Scripts aislados y kit de recuperación (10-12).
- [ ] 3 simulacros de la dueña (10-16).
- [ ] Filas NO de la tabla A resueltas o aceptadas por escrito (hoy NO: R14, R21, R26, R27).
- [ ] Firma final 10-19.

**Veredicto hoy:** listo para rutina diaria, pedidos y promociones; **NO listo** para recuperación total, errores de código del tema, alta de productos y devoluciones hasta cerrar esos GAPs.
**Veredicto 2026-10-02 tarde (tienda ya pública):** se mantiene. Cambios: los **reembolsos no se pueden prometer como automáticos** (R06 y R27 dependen del procedimiento manual y de la respuesta de Wompi, GAP-03); el rollback **mínimo** (contraseña ON) es seguro y simple, el rollback completo sigue con la URL de eventos inferida (GAP-01); la medición de anuncios espera un clic de la dueña (GAP-26); y hay un texto legal nativo por corregir (GAP-27). Mejoras: DNS, certificado, Wompi LIVE y monitor automático ya funcionan; privacidad y cookies tienen textos actualizados.
Elaborado por el agente de redacción (lane N), solo lectura; actualizado el 2026-10-02 en la tarde (hora de Bogotá, ver mensaje final).
