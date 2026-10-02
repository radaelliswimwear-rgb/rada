# CLAUDE DOWNGRADE READINESS — ¿se puede operar la tienda después del 2026-10-20?

Preparado: 2026-10-02 (viernes). Fecha límite: **2026-10-20 (martes)**, fin de la suscripción de alta capacidad.
Meta: dueña sola + ayuda ocasional de bajo costo (fallas, promociones, validación, mantenimiento).
Marcas: `GAP` = hueco a cerrar antes del 2026-10-20 · `PENDIENTE_DUEÑA` / `CONFIRMAR_EN_ADMIN` = dato no confirmado.

## 0. Lecturas de solo lectura hechas para este paquete (Admin API, tienda `wgcvpd-ib`, 2026-10-02 ~10:20)
- Plan Basic · COP · America/Bogota · `taxesIncluded=false` · 1 ubicación activa (Barranquilla) · mercado Colombia activo · `en` principal y `es` publicado.
- 29 productos · 98 variantes: 98 rastreadas, **128 unidades**, política "denegar" en 98, 500 g en 98, precio = 80 % del tachado en 98.
- Envío: 5 zonas × 2 tarifas (9.900/12.900/17.900/21.900/44.900 y gratis) · 51 redirecciones.
- Temas: Horizon (publicado) y Radaelli RC1.10 (sin publicar). RC1.10 trae APAGADOS los mensajes de envío gratis.
- Pedidos: 1 (prueba #1001 archivado). El token del asistente no tiene `read_discounts`, `read_draft_orders`, `read_customers` ni `read_privacy_settings`.
- Ninguna escritura. Laboratorio y tienda "launch" no se tocaron.
- Leído en los archivos de traspaso (10:20): el dominio ya está conectado en Shopify sin cambiar el DNS; el lanzamiento aún espera el GO de la dueña.

## A. Incidentes y ajustes rutinarios

**¿Sin código propio?** SÍ = solo Admin de Shopify/Wompi/Envia/Hostinger · PARCIAL = SÍ con una parte sin ensayar o que pide ayuda · NO = exige código o acceso del asistente. **Quién:** D = dueña sola · IA = dueña con IA de bajo costo guiando · A = asistente con acceso.

| ID | Escenario | Documento y sección | Pasos máx. | ¿Sin código propio? | Quién |
|---|---|---|---|---|---|
| R01 | Revisión diaria de pedidos, pagos e inventario | Manual §3; 04 §2 | 6 | SÍ | D |
| R02 | Primer pedido real hasta el despacho | Manual §4; 03 §4 | 12 | SÍ (UI de Envia, GAP-06) | D |
| R03 | Reponer inventario; sobreventa | 04 §3–4 | 5 | SÍ | D |
| R04 | Cancelar pedido de prueba con reposición | 04 §5 | 8 | SÍ | D |
| R05 | Pago aprobado sin pedido | 02 §5C | 8 | PARCIAL (pedido manual sin ensayar, GAP-04) | IA |
| R06 | Reembolso | 02 §6 | 5 | PARCIAL (Shopify→Wompi sin comprobar, GAP-03) | IA |
| R07 | Wompi prueba↔real; llaves inválidas; doble cobro | 02 §2, §5E–F | 4 | SÍ | D |
| R08 | Cambiar barra de anuncio o banner | 05 §2–3 | 8 | SÍ | D |
| R09 | Crear cupón o descuento automático | 05 §4 | ~8 | SÍ (nativo) | D |
| R10 | Cambiar % de la promo o terminarla (tachado en 98 variantes) | 05 §6–7 | 6 | PARCIAL (edición masiva; mecanismo propio, GAP-11) | IA |
| R11 | Encender mensajes de envío gratis | 05 §8 | 3 | SÍ (decisión, GAP-10) | D |
| R12 | Cambiar textos, colores o imágenes del tema | 06 §2–3 | 7 | SÍ | D |
| R13 | Restaurar tema desde copia / desde ZIP | 06 §5A–B | 3 / 7 | SÍ / PARCIAL (ZIP sin ensayar, GAP-02) | D |
| R14 | **Error de código del tema** | 06 §10 | — | **NO** (GAP-13) | A |
| R15 | Conectar dominio, cambiar y verificar DNS | 01 §2–4 | 5+6 | SÍ | D |
| R16 | Rollback a Vercel | 01 §5 | 9 | PARCIAL (falta URL anterior de eventos, GAP-01) | D/IA |
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
| R27 | **Devoluciones y cambios** | 12 | — | **PARCIAL** (borrador 10-02; faltan decisiones de la dueña, GAP-24) | IA |
| R28 | **Medición de anuncios (Meta/GA4, ROAS)** | **fuera de este paquete** | — | Por definir (GAP-14) | IA |

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
| 01 | URL anterior de eventos de Wompi (producción) del sitio viejo no registrada; desde ~08:10 del 10-02 apunta a Shopify y el sitio viejo puede no recibir confirmaciones. **Actualización 10-02 10:40: inferida del código viejo (`app/api/webhooks/wompi/route.ts`): `https://radaelliswimwear.com/api/webhooks/wompi` (no leída de Wompi); preferir el rollback MÍNIMO (contraseña ON, sin tocar DNS)** | Dueña + coordinador | **antes del corte DNS** |
| 02 | Ensayar restauración del tema por ZIP y dejar copia "RESPALDO CONGELADO" | Coordinador | 10-07 |
| 03 | Probar reembolso Shopify→Wompi con la compra real de lanzamiento | Coordinador + dueña | día del lanzamiento |
| 04 | Ensayar "pago sin pedido" (pedido manual, marcar pagado, cancelar) | Coordinador + dueña | 10-09 |
| 05 | Remitente `info@`: buzón, DKIM/SPF sin duplicar SPF | Dueña con IA | 10-12 |
| 06 | Datos de Envia (costos, recarga, sincronía, cancelación) y primeras 10 guías vs tarifas fijas | Dueña | 10-09 |
| 07 | Contactos de soporte (Wompi, Envia, Hostinger) | Dueña | 10-06 |
| 08 | Costos/renovaciones: dominio, Hostinger, tarifa Wompi, plan de IA | Dueña | 10-09 |
| 09 | Copia de respaldo en el Drive de la dueña (export completo + ZIP del respaldo) | Dueña + coordinador | 10-05 |
| 10 | Mensajes de envío gratis apagados en el tema; la tienda sí tiene envío gratis | Dueña decide; coordinador aplica | 10-09 |
| 11 | Promo sin fecha de fin; mecanismo de tachado; revisión con asesor (Ley 1480 art. 33, `[validar]`) | Dueña + asesor | 10-09 |
| 12 | **PARCIAL 10-02 10:38:** identidad mínima del vendedor (nombre/NIT/dirección/teléfono/correo aprobados por la dueña) ya publicada en «Información de contacto», «Aviso legal», página «Contacto» y enlaces del pie. **Sigue pendiente:** ciudad en la dirección (confirmar), política de privacidad (nombra proveedores del sitio viejo y omite Shopify, Envia y el integrador), retracto, política de envíos vs tarifas fijas | Dueña + asesor | 10-12 |
| 13 | Quién corrige errores de código del tema tras el 10-20 | Dueña decide; coordinador congela | 10-12 |
| 14 | Medición de anuncios: hoy no hay píxel (Configuración > Eventos de clientes vacío); falta app Facebook & Instagram con login de la dueña, verificar compras sin duplicar y tablero simple (gasto, ventas, CPA, ROAS) | Coordinador + dueña (login Meta) | antes de gastar en anuncios; máx. 10-16 |
| 15 | Aislar/archivar scripts (B2–B7); kit de recuperación; instrucciones de tarifas | Coordinador | 10-09 y 10-12 |
| 16 | Acceso: gestor de claves, 2 pasos/passkey, códigos de recuperación, persona de confianza (`CONFIRMAR_EN_ADMIN`: límite de usuarios) | Dueña | 10-09 |
| 17 | Retiro del sitio viejo: fecha, costo, datos históricos (D7) | Dueña | 10-16 |
| 18 | Simulacros: la dueña ejecuta sola R03, R08 y R13 | Dueña + IA de bajo costo | 10-16 |
| 19 | Verificar en el Admin los nombres de menú marcados `CONFIRMAR_EN_ADMIN` | Coordinador | 10-07 |
| 20 | Actualizar recuadros "estado al escribir" (docs 01, 02, 06, 10) con valores reales tras el lanzamiento | Coordinador | 24 h tras lanzar |
| 21 | Códigos de descuento no legibles por sistema: la dueña mira Descuentos | Dueña | día del lanzamiento |
| 22 | Plantillas de correo del personal en inglés; destinatario `info@` | Dueña | 10-16 |
| 23 | ✅ **ESCRITO 10-02 10:36** — `11-agregar-producto-nuevo.md` (falta revisión de la dueña y pruebas con IA de bajo costo, GAP-25). Antes: Documento "Agregar un producto nuevo" (opción Talla, color, colección, etiquetas, 500 g, inventario rastreado, canal Tienda online, envío) | Coordinador | 10-09 |
| 24 | ✅ **BORRADOR 10-02 10:36** — `12-devoluciones-y-cambios.md` (base = política publicada; deja `PENDIENTE_DUEÑA` las decisiones de retracto, plazos, envío de devolución, comisión Wompi). Antes: Documento "Devoluciones y cambios" | Coordinador + dueña | 10-12 |
| 25 | Probar el "paquete de ayuda" (sección D) una vez | Dueña | 10-16 |

## D. Pedir ayuda a una IA de bajo costo (sin acceso a tu tienda)
Pega al empezar: (1) "Tienda Shopify Radaelli Swimwear, Colombia, COP, plan Basic, sin IVA; sigo el documento [XX] de mi manual"; (2) qué quieres hacer y qué ves (captura sin claves ni datos de clientes); (3) qué ya probaste; (4) "no toques precios, impuestos, envíos ni DNS sin respaldo".
Esa IA no entra a tu Admin ni a tu DNS: tú haces los clics y ella te guía. Por eso los documentos usan solo pantallas del Admin y copiar/pegar.
Ayuda dentro de Shopify: Sidekick (asistente del Admin) y Soporte de Shopify (`CONFIRMAR_EN_ADMIN`: español y plan).

## E. Criterios para firmar el cambio de plan (antes del 10-20)
- [ ] 10 documentos revisados por la dueña (10-09).
- [ ] GAP-01 a 04 cerrados (10-09).
- [ ] Respaldo en el Drive y restauración del tema ensayada; menús verificados (10-07).
- [ ] Scripts aislados y kit de recuperación (10-12).
- [ ] 3 simulacros de la dueña (10-16).
- [ ] Filas NO de la tabla A resueltas o aceptadas por escrito (hoy NO: R14, R21, R26, R27).
- [ ] Firma final 10-19.

**Veredicto hoy:** listo para rutina diaria, pedidos y promociones; **NO listo** para recuperación total, errores de código del tema, alta de productos y devoluciones hasta cerrar esos GAPs.
Elaborado por el agente de redacción (lane N), solo lectura. Tiempos: ver mensaje final.
