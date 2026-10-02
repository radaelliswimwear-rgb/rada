# OWNER ACTION BATCH — 03P (resto) + 03Q (preparación inmediata)

GENERATED: 2026-10-02 ~08:43 America/Bogota (global stopwatch start 07:36:21)
OWNER: Daniela Radaelli   |   STORE: `wgcvpd-ib.myshopify.com` (Radaelli Swimwear, plan Basic mensual activo, tienda privada con contraseña)
STATUS MARKER (see status.md): `OWNER_ACTION_BATCH_COMPLETE_READY_FOR_OWNER`
RULE: nunca enviar contraseñas, códigos MFA, llaves API/Wompi, PIN ni datos de tarjeta por chat ni GitHub. La dueña los escribe sola en la pantalla indicada.

Leyenda: **AHORA** = desbloquea trabajo de 03P y conviene hacerlo en cuanto la dueña vuelva · **03Q** = puede esperar a la certificación final/GO · **DECISIÓN** = Claude aplica el valor por defecto indicado si no hay respuesta.

---
## A. YA HECHO POR LA DUEÑA HOY (sin acción pendiente) — evidencia
| # | Qué | Hora aprox. | Resultado verificado |
|---|-----|-------------|----------------------|
| A1 | Código de verificación de inicio de sesión de radaelliswimwear@gmail.com | 07:35 | cuenta Shopify 345688222 abierta |
| A2 | Suscripción **Shopify Basic mensual** tras ver los términos exactos (hoy gratis, prueba de 3 días; 6-oct-2026 USD 1,00/mes con precio promocional «3-month trial»; 4-ene-2027 USD 25,00/mes + impuestos, renovación automática; monto a pagar USD 1,00 el 6-oct-2026 + impuestos; pago por tarjeta/PayPal/Google Pay ingresado por ella) | ~08:12 | API: plan `Basic`; el checkout ya funciona |
| A3 | Wompi Pagos conectado con llaves **de PRUEBA** (las tecleó ella) + modo de prueba ACTIVADO | ~08:08 | Admin > Pagos: Wompi «Modo de prueba» |
| A4 | URL de eventos en Wompi (producción y pruebas) = `https://wompi-event-shopify.conexa.ai/api/v1/shopify/webhooks/event` (idéntica a la documentación oficial de Wompi) | ~08:10–08:25 | confirmada por ella |
| A5 | Envia.com instalada y vinculada (auto-vinculó con su sesión: «Integración realizada», empresa #764546, saldo $0, sin guías compradas) | 07:51 | sin acción |

---
## B. ACCIONES QUE SOLO ELLA PUEDE HACER — **AHORA / al volver (≈3 min)**
### B1. ✅ HECHO por la dueña ~08:45 — pedido #1001 (test, PAGADO, Wompi, 169.820 COP); Claude lo canceló con reposición, lo archivó y verificó inventario 98/98·128. (Se conserva el detalle original abajo.)
### B1 (detalle original). Pago de PRUEBA con Wompi (sandbox) — única prueba que faltaba del checkout
- **Pantalla exacta:** pestaña de Chrome «Pantalla de pago – Radaelli Swimwear» (`wgcvpd-ib.myshopify.com/checkouts/...`). Claude la dejó preparada: producto BIKINI FOAM talla S, cliente ficticio `prueba.e2e@example.com`, envío Barranquilla «Envío estándar $9.900», **total $169.820 COP** (159.920 + 9.900), PayPal ya desactivado.
- **Qué hacer:** (1) bajar a «Pago», confirmar que dice Wompi; (2) pulsar «Pagar ahora»; (3) en la página de Wompi verificar que se vea **modo prueba/sandbox**; (4) elegir tarjeta y **escribir ella misma la tarjeta de prueba publicada por Wompi** (Visa 4242 4242 4242 4242, cualquier vencimiento futuro, CVC 123); (5) si Wompi pide aceptar términos/consentimientos del sandbox, aceptarlos solo ella; (6) aprobar y esperar que regrese a Shopify. **Si Wompi muestra producción/LIVE o pide dinero real: parar y avisar.**
- **Por qué solo ella:** Claude no escribe números de tarjeta ni acepta consentimientos de un proveedor de pagos, ni siquiera de prueba.
- **Qué desbloquea:** 1 pedido de prueba (G4), evidencia de notificación al cliente y al personal, prueba de decremento/restauración de inventario, cierre del pedido de prueba. Después Claude: archiva el pedido, restaura inventario a 128 uds exactas y verifica 0 dinero real.
- **Cuándo:** AHORA o apenas vuelva; no bloquea las demás líneas. Si la pestaña ya no existe, avisar y Claude la rearma en ~2 min.
- **Tiempo estimado dueña:** 3 min.

---
## C. PUEDEN ESPERAR A 03Q (después de la revisión de ChatGPT y el «GO» de la dueña)
| # | Acción owner-only | Pantalla exacta | Por qué | Desbloquea | Nota |
|---|-------------------|-----------------|---------|------------|------|
| C1 | **Dominio**: conectar/apuntar `radaelliswimwear.com` (login al registrador/DNS; decidir dominio principal y www) | Shopify Admin > Configuración > Dominios + panel DNS del registrador | publicar con la marca | URLs/redirecciones públicas, remitente verificado, crédito USD 20 de dominio | requiere GO de ChatGPT+dueña; NO hacer antes |
| C2 | **Remitente de correo verificado** (ahora los clientes ven `store+102428803371@shopifyemail.com` con respuesta a Gmail porque Gmail público no admite remitente personalizado; mensaje oficial de Shopify en Configuración > Notificaciones) | Configuración > Notificaciones > Correo electrónico del remitente | marca/entregabilidad | correos con `info@radaelliswimwear.com` | depende de C1 (dominio) y del buzón info@; dueña verifica el enlace en su bandeja (Claude no lee su correo) |
| C3 | **Wompi LIVE**: apagar modo de prueba y confirmar llaves de producción | Admin > Configuración > Pagos > Wompi | cobrar dinero real | ventas reales | solo con autorización explícita; luego 1 pago real mínimo autorizado por ella (opcional) |
| C4 | **Envia**: recargar saldo y comprar la primera guía real en el primer pedido real; confirmar origen/paquete por defecto | Envia.com > Cuenta/Configuración | guías reales cuestan dinero | despacho | Claude propone origen Calle 93 #72-71 Barranquilla y paquete 500 g 15×10×5 cm; compra real = solo ella |
| C5 | **Quitar contraseña de la tienda + publicar tema RC1.10** | Tienda online > Preferencias (contraseña) y Temas > Publicar | salir al público | lanzamiento | aprobación final ChatGPT+dueña |
| C6 | **Re-autenticación puntual** si Shopify/Wompi/Envia lo pide (código por correo/passkey) | la pantalla que muestre el aviso | Claude no puede autenticar por ella | continuar la tarea | solo si ocurre |
| C7 | Revisar **bandeja** de radaelliswimwear@gmail.com tras la prueba B1 (pedido nuevo + correos de prueba): ¿llegaron, no están en spam? | Gmail | Claude no lee su bandeja; única forma de probar entrega física | cerrar G5 con evidencia real | opcional pero recomendado antes de lanzar |

---
## D. DECISIONES DE NEGOCIO (si no responde, Claude aplica el **valor por defecto** = línea base certificada; todo reversible)
| # | Decisión | Estado actual / evidencia | Valor por defecto |
|---|----------|--------------------------|-------------------|
| D1 | Barra de anuncio «20% DE DESCUENTO EN TODA LA TIENDA» (el tema guarda `20% de descuento en toda la tienda`, el CSS la muestra en mayúsculas; el catálogo ya trae precio tachado y etiqueta -20%) | **Auditoría 03Q (evidencia):** 98/98 variantes (29/29 productos) llevan precio tachado y el precio vigente es **exactamente el 80 %** (199.900→159.920 ×18; 209.900→167.920 ×36; 229.900→183.920 ×32; 249.900→199.920 ×12); la oficial = laboratorio; el pedido de prueba #1001 sin descuentos (no se pudieron leer códigos de descuento: falta alcance `read_discounts`). Matiz: el 20 % está en el precio vs. tachado, no es un descuento de Shopify; sin fecha de fin; quitar solo la barra deja el banner, el tachado y las etiquetas «-20 %» (detalle y opciones keep/fecha/reformular/quitar en `launch/official-03p/laneK__announcement-bar-evidence.md`) | **mantener** (coherente con los precios) hasta que ella decida |
| D2 | Tono del texto de la tienda: voseo («Elegí una talla») vs tuteo colombiano | copia literal del sitio original | mantener voseo |
| D3 | Meta descriptions de Inicio, Destacados y Todos (vacías, igual que el laboratorio) | sin texto SEO | dejar vacías (sugerencia: usar el texto del footer) |
| D4 | Colección «Salidas de Baño» vacía y su enlace en el menú principal | 0 productos por diseño | mantener |
| D5 | Rótulo favoritos: «Agregar a favoritos» vs «Añadir a favoritos» | mezcla heredada | mantener |
| D6 | Renombrar handles heredados (`bikini-shadow-azul-marino`, `enterizo-shadow-palm-azul-marino` → título NEGRO; `marea-natural` → «…BEIGE») + redirecciones | conservados por paridad de URL | no renombrar |
| D7 | **Datos históricos** (clientes, pedidos, suscriptores de boletín con consentimiento, cupones, 3 artículos de blog de plantilla «Equipo LAGO»): requieren exportación **autorizada** de la base del sitio anterior (Claude no la toca) + permisos de Shopify (clientes/pedidos/descuentos; datos protegidos) + decisión sobre consentimiento (Ley 1581; la tabla de suscriptores no guarda texto/origen del consentimiento) | evaluación Lane J: todo BLOQUEADO; no bloquea el lanzamiento | lanzar sin históricos y migrarlos después con piloto de 3 pedidos |
| D8 | ✅ **RESUELTA 09:43** — la dueña es **NO RESPONSABLE DE IVA**: Claude apagó «Incluir impuesto sobre las ventas en el precio…» (Configuración > Impuestos y aranceles) → API `taxesIncluded=false` (= laboratorio), sin tasas, Colombia sin recaudación; checkout fresco: BRISA NATURAL BEIGE M 199.920 + envío 9.900 = **209.820, 0 líneas de impuesto**. Precios intactos | evidencia `launch/official-03p/03q-prelaunch-evidence.json` | mantener; si su estado fiscal cambia, se reconfigura |
| D9 | **Identidad del vendedor** para Colombia (razón social, NIT, dirección, teléfono): hoy «Información de contacto» y «Aviso legal» no están establecidos (igual que el laboratorio) y el teléfono de la tienda está vacío | **Auditoría 03Q:** ningún texto aprobado ni ajuste de Shopify identifica al vendedor (solo la marca y el WhatsApp); las políticas «Información de contacto» y «Aviso legal» no existen; teléfono y empresa de la tienda vacíos; footer sin correo; la página `/pages/contact` está vacía y en inglés. Huecos del texto aprobado: sin retracto en la política de envíos, la privacidad no nombra al Responsable ni procedimiento de reclamos y cita Resend/Cloudinary (stack anterior) y omite Shopify/Envia. **Datos que SOLO ella puede dar (F1–F19):** tipo de vendedor, razón social, NIT con dígito, dirección publicable, ciudad de domicilio, teléfono, confirmación del WhatsApp, correo público (candidato `info@`), canal PQR y plazo, contacto del responsable de datos, dónde publicar (+ opcionales: representante legal, matrícula mercantil, régimen). Plantillas con marcadores en `launch/official-03p/laneK__legal-identity-audit.md` §6–7 (referencias legales marcadas «[validar]», no es asesoría legal) | Claude NO inventa datos; con los F1–F19 publica las 2 políticas, el footer y el teléfono en ~10 min. Si no los entrega, se abre sin ellos (queda como riesgo documentado) |
| D10 | **PayPal Express**: Shopify lo activa por defecto en tiendas nuevas y mostraba un botón «PayPal» en el checkout aunque la cuenta no estaba configurada; no está en la línea base (solo Wompi) | **Claude lo DESACTIVÓ hoy (reversible, Configuración > Pagos > PayPal > Activar)** | dejar desactivado |
| D11 | Ajuste de checkout exigido por la documentación de Wompi: teléfono de envío «Obligatorio» y contacto por correo | **Claude lo aplicó hoy** | mantener |
| D12 | Destinatarios de «Nuevo pedido» (hoy solo radaelliswimwear@gmail.com, todos los pedidos). ¿Agregar `info@radaelliswimwear.com` cuando exista el buzón? | Configuración > Notificaciones > Notificaciones para empleados | dejar solo Gmail |

---
## D+. PROPUESTAS DE TEXTO PARA ACELERAR LAS DECISIONES (NO aplicadas; la dueña aprueba/edita)
- **D3 meta descriptions** (base: textos que ya usa el sitio): Inicio → «Radaelli Swimwear: trajes de baño pensados para mujeres auténticas, seguras y poderosas. Diseños que acompañan tu belleza natural con fuerza, libertad y estilo. Envíos a toda Colombia.» · Destacados → «Los trajes de baño Radaelli más elegidos: bikinis y enterizos diseñados con fuerza, libertad y estilo.» · Todos → «Todos los trajes de baño de Radaelli Swimwear: bikinis, enterizos y más. Compra online con envío a toda Colombia.»
- **D9 identidad del vendedor** (plantilla; faltan datos de la dueña): «Radaelli Swimwear — <razón social> · NIT <NIT> · Calle 93 #72-71, Barranquilla, Atlántico, Colombia · WhatsApp +57 313 535 9668 · info@radaelliswimwear.com». Con eso Claude completa «Información de contacto» y «Aviso legal» y el teléfono de la tienda.

---
## L. LANZAMIENTO HOY — acciones owner-only (detalle y orden en `ai-handoff/launch-today-runbook.md`)
La dueña pidió publicar hoy. Solo con **GO de ChatGPT + de ella** en el chat:
| # | Acción owner-only | Pantalla exacta | Por qué | Cuándo |
|---|-------------------|-----------------|---------|--------|
| L1 | Decir **GO** (autoriza cortar el sitio actual de Vercel y publicar Shopify hoy, incluida la prueba de pago real) | chat | decisión de negocio/irreversible | al volver |
| L2 | **Revisar pedidos pendientes/en curso del sitio antiguo** (Claude no toca su base de datos) y decidir cómo atenderlos | panel del sitio actual / Wompi | el sitio viejo deja de responder al cambiar el DNS | antes del DNS |
| L3 | **Wompi LIVE**: apagar el «Modo de prueba» (y, si Shopify dice que las llaves de producción no son válidas, reescribirlas ella) | Shopify Admin > Configuración > Pagos > Wompi | cobrar dinero real | después del GO |
| L4 | **Una compra real mínima con SU tarjeta** (Claude prepara un producto temporal oculto de COP 5.000) y reembolso posterior | enlace que le dará Claude | probar llaves de producción + eventos ANTES de abrir la tienda | antes del DNS |
| L5 | **DNS en Hostinger** (solo 2 registros: A @ → 23.227.38.65 y CNAME www → shops.myshopify.com; NO tocar MX/TXT) — o dejar su sesión de Hostinger abierta para que Claude lo haga tras el GO | hPanel > Dominios > Zona DNS | apuntar el dominio a Shopify | tras L1–L4 |
| L6 | (Opcional, post-lanzamiento) remitente verificado `info@radaelliswimwear.com`: 2.º cambio DNS que muestra Shopify + clic en el enlace de verificación del buzón info@ | Hostinger + correo | marca en los correos | después |
| L7 | ~~D8 (IVA)~~ ya resuelta. Falta **D9: datos del vendedor** (razón social, NIT o cédula, dirección, teléfono) si quiere publicarlos antes de abrir — Claude no inventa datos | chat | requisitos legales/confianza del cliente | antes de abrir (opcional) |

Rollback (≈5 min): devolver A @ → 216.150.1.1 y CNAME www → e7eb3f32d99d3261.vercel-dns-017.com; reactivar la contraseña en Shopify.

---
## E. LO QUE CLAUDE HACE SOLO (sin la dueña) — para que nada quede oculto
- Archivar el pedido de prueba y restaurar inventario 98/98 · 128 uds tras B1; verificar 0 pedidos reales.
- Reporte final `03P-new-standard-store-report.md`, tabla de tiempos, copia de evidencia a `shopify-migration-backup`, re-ejecutar paridad y escaneo de secretos.
- Si Shopify pide reautorizar la API del CLI: Claude lo hace (se concedió sin clic hoy).
- Cualquier ajuste determinista de paridad que aparezca.

## F. NUNCA por chat / GitHub
Contraseña de visitante, códigos de inicio de sesión, passkeys, llaves públicas/privadas de Wompi (prueba o producción), números de tarjeta, datos bancarios, PIN de soporte.

