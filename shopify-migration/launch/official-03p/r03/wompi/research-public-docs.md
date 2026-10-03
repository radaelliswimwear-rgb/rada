# WOMPI + SHOPIFY: ANULACIONES, REEMBOLSOS Y REVERSIONES — INVESTIGACION EN DOCUMENTACION PUBLICA

Fecha de lectura de todas las fuentes: 2026-10-03 (America/Bogota, sabado).
Alcance: SOLO LECTURA web. No se inicio sesion en Wompi, Shopify, Nequi ni Bancolombia; no se uso ninguna llave; no se ejecuto ningun pago, anulacion, reembolso ni transferencia.
Caso de contraste: pedido Shopify #1002, COP 5.000, pagado por Nequi (Wompi LIVE) el 2026-10-02; reembolso en Shopify en PENDING > 24 h; sin boton "Anular" en el panel de Wompi; comision descontada 2,65 % + $700 + IVA 19 % sobre la comision, neto $4.009,33.

Convencion de etiquetas
- [OFICIAL: Sx] = afirmacion que consta en una fuente oficial (Wompi, Bancolombia, Shopify, norma colombiana). La URL completa, la fecha de la fuente y la fecha de lectura de cada Sx estan en la seccion 12.
- [NO CONFIRMADO] = no aparece en fuente oficial, o solo en fuente de terceros (se indica Tx), o hay contradiccion.
- [HECHO] = lo que dice la fuente. [INFERENCIA] = deduccion mia a partir de hechos; debe verificarse. Los hechos y las inferencias se separan siempre.
- Limitaciones de lectura: algunas paginas oficiales respondieron 403 (docs.wompi.co en rutas directas, ayuda.nequi.com.co, funcionpublica.gov.co por certificado TLS). Para Nequi se uso solo el resumen de los resultados de busqueda (se marca "snippet"). Los PDF (Reglamento de Comercios V4-2026, Reglamento de Pagadores, Decreto 587/2016, Ley 2439/2024) se leyeron literalmente con pdftotext; las paginas web se leyeron con extraccion automatica (puede resumir), por eso las citas textuales deben confirmarse en pantalla antes de usarlas en politica publica.

---------------------------------------------------------------------

## 1. RESUMEN EJECUTIVO (15 lineas)

1. Pago #1002 = Nequi. Wompi documenta la ANULACION solo para tarjeta (estado VOIDED "solo tarjeta"; "tarjeta, a diferencia de QR y Nequi, da la opcion de anular") [OFICIAL: S27, S33, S2]. Para Nequi no existe boton de anular: coincide con lo que ve Daniela.
2. REEMBOLSO por Wompi: los articulos de soporte (ambos de 2021-05-04) se contradicen: uno dice que solo aplica a tarjetas Visa/MC/Amex; otro menciona "API NEQUI y Boton Bancolombia solo reembolsos totales" [OFICIAL: S3, S4]. Para Nequi = [NO CONFIRMADO]; hay que preguntarlo a Wompi y verlo en el panel.
3. Para Nequi/PSE/Boton, el soporte de Wompi y Nequi dice que la devolucion es decision y gestion del comercio ("ni Nequi ni Wompi son responsables") [OFICIAL: S6, S7]; Bancolombia dice que el Boton Bancolombia no admite cancelar ni devolver y que el comercio debe hacer una nueva transferencia [OFICIAL: S50, 2026-07-16].
4. Reglamento de Comercios V4-2026 §6.11: el comercio "podra solicitar" un reembolso por la Wompi Cuenta u otros canales; Wompi no garantiza que sea exitoso y puede cobrar un costo adicional [OFICIAL: S22]. Comision + IVA de la comision NO se devuelven en un reembolso total [OFICIAL: S3]; exige saldo "Disponible" [OFICIAL: S3].
5. Modelo: casi seguro AGREGADOR [INFERENCIA fuerte: Wompi descuenta 2,65 % + $700 + IVA, tarifa publicada del Plan Avanzado Agregador; en Gateway Wompi no descuenta nada, Reglamento §7.1.4]. Verificar en el panel.
6. Existe una via oficial adicional: Wompi "Pagos a terceros" (Payouts) lista "Reembolsos a compradores" como caso de uso, con destinos Nequi/Daviplata/Bre-B/bancos, tarifa publicada $1.849 + 0,4 % + IVA por pago desde Wompi Cuenta; requiere activacion (2 a 5 dias habiles) [OFICIAL: S25, S32].
7. SHOPIFY: con una app de pagos de terceros, Shopify solo envia la solicitud a la app; el reembolso queda PENDING hasta que la app llame refundSessionResolve o refundSessionReject. La documentacion de Shopify NO define vencimiento; el comerciante no puede cancelar un reembolso ya iniciado [OFICIAL: S35, S36, S39, S43]. La documentacion de Wompi del plugin Shopify no menciona reembolsos [OFICIAL: S30]. Puede quedar PENDING indefinidamente [INFERENCIA].
8. Opciones del comerciante sin falsear estados: devolver el dinero por fuera y REGISTRAR en Shopify "reembolso procesado fuera de Shopify" (monto, nota en el motivo, sin reprocesar el pago si la casilla existe); o cancelar el pedido con la opcion "Despues" (no emite reembolso) [OFICIAL: S42, S44].
9. API Wompi: anulacion solo tarjeta con POST /v1/transactions/{id}/void y llave privada [OFICIAL: S27]; "Refunds V2" (POST /v1/refunds, total o parcial) aparece solo como SANDBOX; no hay prueba oficial de que exista en produccion para esta cuenta [OFICIAL: S28]. No recomendada con la integracion Shopify (desincroniza estados). No usarla.
10. Plazos legales (Colombia): retracto = 5 dias habiles tras la entrega; devolucion del dinero en comercio electronico <= 15 dias calendario desde que se ejerce y se cumplen las obligaciones; debe ir al medio de pago que prefiera el consumidor [OFICIAL: S48, S49]. Reversion art. 51: queja ante el proveedor y aviso al emisor en 5 dias habiles; participantes tienen 15 dias habiles [OFICIAL: S47].
11. Plazos Wompi: anulacion de tarjeta "en linea" el mismo dia; reversion de tarjeta via soporte maximo 10 dias habiles [OFICIAL: S1]; SLA de tickets 3 a 7 dias habiles; WhatsApp 20 min sin escalamiento [OFICIAL: S16].
12. Para #1002 la ruta que hoy esta respaldada por fuentes oficiales: (a) preguntar a soporte Wompi si Nequi admite reembolso desde Wompi Cuenta; (b) si no, transferencia manual a la Nequi del pagador desde la cuenta de Radaelli o via Payouts; (c) registrar en Shopify como reembolso externo y guardar comprobante. Los $990,68 de comision no son recuperables [INFERENCIA sobre S3; ver 3 y 8].
13. NO prometer en la politica publica devolucion automatica ni "al mismo medio" por Wompi: se puede prometer plazo (15 dias calendario) y "medio de pago que prefiera el consumidor o el acordado" (Ley 2439 arts. 3 y 5).
14. Dudas que solo se resuelven en la cuenta real: seccion 11 (14 puntos).

---------------------------------------------------------------------

## 2. MODELO DE LA CUENTA WOMPI Y QUE CAMBIA PARA DEVOLUCIONES

Hechos [OFICIAL: S22 Reglamento de Comercios V4-2026, leido literal]
- Wompi puede actuar como Agregador (§3.1: recauda en nombre del comercio en cuenta de deposito de Wompi y desembolsa ingresos netos tras descuentos), Gateway (§3.2: entrega tecnologias de acceso; el comercio necesita afiliacion vigente de adquirencia/recaudo PSE/Nequi), Gestor de Pagos (SPT/Pagos a terceros), Factoring inverso (SFI) y Venta Presente.
- "Wompi Cuenta" NO es cuenta bancaria ni de deposito; es un registro virtual/dashboard; Wompi no es entidad financiera (§4.2).
- Adquirentes actuales: Bancolombia S.A. y Akua Colombia Acquiring S.A. (definicion "Entidad Adquirente").
- Descuentos = tarifa, costos financieros de desembolsos, reversiones, contracargos, impuestos, correcciones (§1 y §6.2).
- AGREGADOR: §6.10 la reversion la solicita el titular del instrumento; Wompi es ajeno; es "responsabilidad exclusiva" del comercio gestionarla, sin perjuicio de mediacion; si prospera, Wompi descuenta de los ingresos o factura al comercio. §6.11 reembolso (texto en seccion 4). §6.9.2: en venta no presente el riesgo y la responsabilidad frente a reclamaciones es del comercio.
- GATEWAY: §7.1.2 Wompi no recibe los ingresos; los abona la entidad adquirente/recaudadora. §7.1.4 Wompi no aplica descuentos por servicios que no presta. §7.3 contracargos, reversion, reembolsos y otras controversias "deberan ser gestionadas por ti directamente con la Entidad Adquirente". Soporte: en Gateway las reversiones se piden ante las redes (Mastercard: solicitudes@rbm.com.co con formato; Visa/Amex: formulario Credibanco) [OFICIAL: S5, 2023-08-10]. Contracargos: en Gateway con la red; en Agregador los gestiona Wompi como intermediario [OFICIAL: S13].
- Tarifa publicada Plan Avanzado Agregador: 2,65 % + $700 + IVA por transaccion exitosa (QR 1 %); desembolso "al siguiente dia habil" a cuenta Bancolombia o Nequi [OFICIAL: S24; S15 act. 2026-01-07]. Plan Gateway: "no tiene costo en Wompi" [OFICIAL: S15]. IVA 19 % se liquida sobre la comision en el modelo Agregador [OFICIAL: S14].
- Wompi factura sus comisiones aparte, mes vencido, el dia 4 de cada mes [OFICIAL: S19, 2024-03-13].

Inferencias [INFERENCIA]
- Radaelli = Agregador: (a) Wompi descuenta comision + IVA del pago (en Gateway no lo haria, §7.1.4); (b) el calculo del caso coincide exactamente con la tarifa publicada: 5.000 x 2,65 % = 132,50; + 700 = 832,50; IVA 19 % = 158,18; total 990,68; neto 4.009,33 (coincide con el neto observado).
- Consecuencia: en Agregador Wompi SI tiene un canal propio de reembolso/Payouts; en Gateway no (se iria a la red adquirente). Verificar plan en panel (seccion 11, punto 1).

---------------------------------------------------------------------

## 3. TABLA POR MEDIO DE PAGO

Lectura: "ANUL" = anulacion (antes de liquidar, mismo dia); "REEMB" = reembolso comercial total/parcial (despues de liquidar/desembolsar); "REVERS" = reversion de pago art. 51 Ley 1480 / Decreto 587/2016 (solicitada por el consumidor via su emisor; el proveedor ofrece constancia de la queja; participantes 15 dias habiles). Son tres figuras distintas y no deben mezclarse en politica ni en operacion.

Medios que Wompi lista en su API: CARD, BANCOLOMBIA_TRANSFER, BANCOLOMBIA_QR, NEQUI, PSE, BANCOLOMBIA_COLLECT (efectivo), PCOL (Puntos Colombia), BANCOLOMBIA_BNPL, DAVIPLATA, SU_PLUS [OFICIAL: S29]. El plugin Shopify lista tarjetas, PSE, Nequi, Daviplata, Bancolombia QR, Boton Bancolombia y corresponsal [OFICIAL: S30].

| Medio | ANUL | REEMB | REVERS (art. 51) | Canal | Plazo | Costos NO recuperables / notas |
|---|---|---|---|---|---|---|
| Tarjeta credito/debito Visa, Mastercard, Amex | SI, mismo dia y si la red lo permite; boton "Anular transaccion" en el detalle de la transaccion; debe hacerse de inmediato para que quede "en linea"; despues de aprobada puede no permitirla [OFICIAL: S1]. API: POST /v1/transactions/{id}/void [OFICIAL: S27] | SI en principio: "solo aplica a Tarjetas (Visa, MC, Amex) con autorizador Redeban/Credibanco", total; exige Disponible [OFICIAL: S3, 2021]. Parcial: no documentado en soporte [NO CONFIRMADO]; Refunds V2 sandbox dice "total o parcial" [OFICIAL: S28] | SI: es el caso tipico del art. 51 (e-commerce con tarjeta); la gestiona el titular con su emisor; en Agregador Wompi es ajeno y descuenta del ingreso [OFICIAL: S22 §6.10, S47]. Si la anulacion no es posible, Wompi pide al comercio abrir solicitud de reversion ante la red con: codigo de autorizacion, fecha, ultimos digitos, valor; puede ser rechazada si hay contracargo [OFICIAL: S1] | Panel (anular), soporte Wompi (reversion), emisor del titular (art. 51). Gateway: directo con Redeban/Credibanco [OFICIAL: S5] | Anulacion en linea el mismo dia. Reversion via soporte: maximo 10 dias habiles [OFICIAL: S1]. Art. 51: 15 dias habiles para hacerla efectiva [OFICIAL: S47] | Reembolso total: se devuelven impuestos al comercio EXCEPTO comision e IVA de la comision [OFICIAL: S3]. Costo adicional por procesar reembolso posible, monto no publicado [OFICIAL: S22 §6.11; monto NO CONFIRMADO]. Anulacion: "la liquidacion no se hace efectiva" [OFICIAL: S4]; si se devuelve la comision es [NO CONFIRMADO] |
| Nequi (cobro con push, API NEQUI) | NO: VOIDED aplica solo a tarjeta [OFICIAL: S27, S33]; "tarjeta, a diferencia de QR y Nequi, da la opcion de anular" (contexto App Wompi) [OFICIAL: S2] | CONTRADICTORIO: S3 "solo tarjetas"; S4 "API NEQUI ... solo reembolsos totales" [OFICIAL pero 2021]. Soporte Nequi/Wompi: "el comercio toma la decision de realizar la devolucion"; "ni Nequi ni Wompi son responsables" [OFICIAL: S6, S7]. Para Nequi via Wompi = [NO CONFIRMADO] | El art. 51 y el Decreto 587 cubren "cualquier otro instrumento de pago electronico" [OFICIAL: S47]; Nequi indica que desde Nequi no se reversan pagos hechos y debe acordarse con el comercio [OFICIAL: S52-S53, snippet, pagina no abierta por 403]. Procedimiento concreto Nequi->Wompi [NO CONFIRMADO] | Devolucion por el comercio: transferencia a la Nequi del pagador (desde cuenta del comercio o Payouts) [OFICIAL: S25 lista Nequi como destino]. Soporte Wompi para confirmar | Manual: inmediato en Nequi/Bancolombia/Bre-B segun Wompi ("Pagos inmediatos") [OFICIAL: S25]. Abono del cobro: siguiente dia habil [OFICIAL: S11] | Comision (2,65 % + $700 + IVA) se pierde [INFERENCIA con base en S3]. Payouts: $1.849 + 0,4 % + IVA por pago si se usa Wompi Cuenta [OFICIAL: S25] |
| PSE | NO (VOIDED solo tarjeta) [OFICIAL: S27] | Wompi: sin articulo especifico [NO CONFIRMADO]. Nequi (pagos Nequi por PSE): "los reembolsos no se hacen por PSE"; el comercio pide los datos de otro medio y devuelve [OFICIAL: S52, snippet]. PSE no hace reversiones; el pagador acude a su banco; codigo CUS [OFICIAL: S54] | SI, PSE esta expresamente nombrado en el art. 51/Decreto 587 [OFICIAL: S47]; el pagador va a su entidad financiera [OFICIAL: S54] | Transferencia manual del comercio al pagador; banco del pagador para reversion | Desembolso PSE "segun ciclo" [OFICIAL: S10, S11]. Plazo de devolucion manual: el de la transferencia usada [NO CONFIRMADO] | Comision perdida [INFERENCIA]. Guardar el comprobante de la entidad financiera [OFICIAL: S52, snippet] |
| Boton Bancolombia (transferencia) | NO [OFICIAL: S27] y Bancolombia: "las operaciones por Boton Bancolombia no tienen la opcion de ser canceladas" [OFICIAL: S50, 2026-07-16] | Bancolombia: no admite devoluciones parciales ni totales; el comercio hace una nueva transferencia a su cliente [OFICIAL: S50]. CONTRADICE a S4 (2021) que habla de reembolso total para Boton | Aplica el art. 51 (instrumento de pago electronico) [OFICIAL: S47]; tramite del pagador con Bancolombia [INFERENCIA] | Transferencia manual desde la cuenta Bancolombia del comercio | Abono del cobro "en linea" (Gateway) [OFICIAL: S11]; transferencia manual inmediata entre Bancolombia | Comision perdida [INFERENCIA] |
| Daviplata | NO (VOIDED solo tarjeta) [OFICIAL: S27] | [NO CONFIRMADO]: sin fuente oficial de reembolso; Davivienda autoriza las transacciones [OFICIAL: busqueda soporte topes Daviplata, no abierta] | Aplica art. 51 en teoria; procedimiento Daviplata [NO CONFIRMADO] | Manual (Payouts lista Daviplata como destino) [OFICIAL: S25] | [NO CONFIRMADO] | [NO CONFIRMADO] |
| Bancolombia QR | NO | "Actualmente no es posible realizar una reversion para el medio de pago de QR" [OFICIAL: S8, 2022-10-25]; Nequi QR: no es posible reembolsar [OFICIAL: S53, snippet] | Aplica art. 51 solo si hay e-commerce; QR presencial excluido (el Decreto excluye canales presenciales) [OFICIAL: S47] | Manual | [NO CONFIRMADO] | Tarifa QR 1 % [OFICIAL: S24]; comision perdida [INFERENCIA] |
| Efectivo (corresponsal, BANCOLOMBIA_COLLECT) | NO | [NO CONFIRMADO] | [NO CONFIRMADO] | Manual | - | - |
| BNPL Bancolombia | NO | Desconocimiento, reversion y reembolsos "deberan ser gestionadas por el Pagador directamente con Bancolombia" [OFICIAL: S23 §6.5] | idem | Bancolombia (pagador) | - | - |
| SU+ Pay | NO | [NO CONFIRMADO] | [NO CONFIRMADO] | Soporte Wompi | - | - |
| Puntos Colombia | - | Reverso de Puntos solo si se pago 100 % con Puntos; retracto: reintegro de Puntos solo si fue 100 % Puntos [OFICIAL: S22 anexo 3.6, 3.7] | - | - | - | Si hubo pago mixto no hay reverso de puntos |
| Bre-B (si estuviera habilitado) | NO | OP/TF liquidadas por Bre-B son irrevocables salvo mecanismos de reverso habilitados por el sistema (error operativo) [OFICIAL: S22 §11.5] | Reclamos del pagador los atiende el comercio [OFICIAL: S22 §11.5] | Manual | - | - |

Notas de la tabla
- [HECHO] La unica via de anulacion ofrecida por la API de Wompi es sobre tarjeta, con llave privada, "solo ciertos estados" [OFICIAL: S27].
- [HECHO] La definicion de reembolso/anulacion de Wompi: Anulacion = no se hace efectiva la liquidacion; Reembolso = la compra debio ser liquidada y desembolsada antes [OFICIAL: S4].
- [INFERENCIA] Que Nequi no admita anulacion ni boton en panel explica por que "no aparece Anular" en #1002.
- Ambiguedad textual [OFICIAL: S3 vs S4]: S3 dice que en un reembolso total los impuestos se devuelven AL COMERCIO (excepto comision e IVA de la comision); S4 dice que "los impuestos son devueltos al cliente comprador". Probablemente S4 se refiere a los impuestos del producto en el precio pagado, pero no esta explicado: [NO CONFIRMADO].

---------------------------------------------------------------------

## 4. SALDO "DISPONIBLE" Y DESEMBOLSO

Hechos
- Para que un reembolso se procese "el comercio debe tener saldo en 'Disponible' dentro de su cuenta en Wompi" [OFICIAL: S3, 2021-05-04].
- "El saldo disponible es el que tienes en la Wompi cuenta del que puedes disponer para pagos a uno o varios beneficiarios"; no incluye deducciones de comisiones del plan de facturacion [OFICIAL: S12, 2024-02-05].
- Agregador: abonos "al dia siguiente habil" (algunos BIN de tarjeta hasta 72 horas) [OFICIAL: S10, 2023-06-06]. Reglamento §6.5: ingresos netos disponibles en la Wompi Cuenta maximo 5 dias habiles desde la aprobacion; si el comercio desactiva el abono automatico, el dinero puede permanecer hasta 180 dias; "el primer desembolso se podra, a discrecion de WOMPI, ejecutar despues de transcurridos los primeros 30 dias calendario" desde la primera transaccion [OFICIAL: S22].
- Transacciones marcadas por contracargo o reversion antes del desembolso no se dispersan; Wompi devuelve el valor al titular via adquirente [OFICIAL: S22 §6.6.3]. Retencion hasta 180 dias ante contracargo/fraude y puede retener cuando el titular pide reversion [OFICIAL: S22 §6.7].
- §6.11: Wompi puede solicitar el debito de las cuentas de deposito inscritas del comercio para el reembolso [OFICIAL: S22]. No se explica el mecanismo operativo [NO CONFIRMADO].
- Refunds V2 (sandbox): estado DECLINED con mensaje "Tiempo limite sin encontrar fondos excedido" [OFICIAL: S28] [INFERENCIA: Wompi espera fondos hasta un limite de tiempo; si no hay, rechaza].
- "Recarga Wompi Cuenta" aparece en el menu de documentacion de Pagos a terceros [OFICIAL: S29]; "puedes recargar o ampliar tu capacidad de pago" [OFICIAL: S25]. Detalle [NO CONFIRMADO].

Que pasa si ya se desembolso [NO CONFIRMADO en detalle]
- Los textos oficiales dicen que el reembolso exige Disponible y que ocurre DESPUES de desembolsar; no explican si se obliga a recargar la Wompi Cuenta, si Wompi debita la cuenta del comercio (§6.11) o si rechaza. Preguntar a soporte.

Aplicado a #1002 [INFERENCIA]
- 2026-10-02 fue viernes; el siguiente dia habil es lunes 2026-10-05. Hoy (sabado) el neto de $4.009,33 posiblemente aun NO se ha abonado a la cuenta bancaria y podria seguir como saldo en Wompi Cuenta; ademas, si es la primera transaccion de la cuenta, Wompi puede retrasar el primer desembolso hasta 30 dias (§6.5). Verificar si aparece como "Disponible" (seccion 11, puntos 3 y 7). No asumir que esto habilita un reembolso para Nequi.

---------------------------------------------------------------------

## 5. SHOPIFY: REEMBOLSO CON PASARELA DE TERCEROS

### 5.1 Que integracion usa Radaelli
- Wompi publica dos integraciones para Shopify: (a) plugin de "checkout tradicional" (redireccion a la pasarela de Wompi), que se instala como proveedor de pago alternativo desde Shopify admin (ruta settings/payments/alternative-providers/11927553); (b) app "Wompi Tarjetas" (apps.shopify.com/wompi-native, desarrollador "Wompi Co", actualizada 2025-07-07) para tarjetas en el propio checkout [OFICIAL: S30, S34].
- Como #1002 fue Nequi, Radaelli usa (a) [INFERENCIA]. Confirmar nombre y desarrollador en Settings > Payments.
- La URL de eventos que Wompi pide configurar para Shopify apunta a wompi-event-shopify.conexa.ai [OFICIAL: S30]; que ese host sea de un tercero que opera el conector es [INFERENCIA] (dominio distinto de wompi.co). La guia dice "puedes verificar el estado de tus pedidos en Wompi y en Shopify" [OFICIAL: S30].
- La pagina de Wompi del plugin Shopify NO contiene informacion de reembolsos, anulaciones ni como un reembolso de Shopify se integra con Wompi [OFICIAL por ausencia: S30]; tampoco la ficha de "Wompi Tarjetas" [OFICIAL por ausencia: S34].

### 5.2 Como funciona un reembolso con app de pagos de terceros (hechos)
1. El comerciante solicita el reembolso en Shopify. 2. Shopify envia una solicitud backend a la app (refund_session_url) con id (clave de idempotencia), payment_id, monto y moneda. 3. La app responde HTTP 201 con cuerpo vacio. 4. La app finaliza el reembolso con la mutacion refundSessionResolve o refundSessionReject. 5. Shopify actualiza el estado [OFICIAL: S35, S39].
- Mientras la app no resuelva, la sesion queda abierta: RefundSession.state PENDING; las mutaciones son excluyentes (resolver impide rechazar y viceversa) [OFICIAL: S36, S37, S38]. Requieren scope write_payment_sessions [OFICIAL: S36].
- "Solo debes rechazar un reembolso ante errores finales e irrecuperables" [OFICIAL: S40].
- Si la solicitud de Shopify a la app falla, Shopify reintenta varias veces; si sigue fallando, el usuario debe reintentar manualmente el reembolso en el admin [OFICIAL: S39, S40].
- Las apps deben implementar reintentos (hasta 18 en 24 h) al llamar las mutaciones [OFICIAL: S41].
- OrderTransactionStatus PENDING = "la transaccion esta pendiente" [OFICIAL: S46].
- El proveedor devuelve a Shopify el estado del reembolso y el motivo de fallo [OFICIAL: S42].
- En el simulador de Shopify, un reembolso creado en el admin "debe completarse manualmente desde el panel de la app" [OFICIAL: S40]: confirma que la resolucion es responsabilidad de la app.

### 5.3 PENDING indefinido: que dice y que no dice la documentacion
- NO hay documentado plazo de vencimiento ni resolucion automatica de una RefundSession abierta; tampoco consecuencias por no responder mas alla de los reintentos [OFICIAL por ausencia: S39, S40, S41]. [NO CONFIRMADO] que Shopify la cierre sola.
- [INFERENCIA] Si el estado es PENDING (y no FAILURE/ERROR) es probable que Shopify recibio el 201 de la app y esta esperando resolve/reject; si la app/plugin de Wompi no implementa la resolucion para Nequi (Wompi no documenta reembolsos Nequi ni Refunds V2 en produccion), puede quedar PENDING indefinidamente.
- Evidencia de terceros (NO oficial): hilo de Shopify Community sobre Payfast, reembolsos "stuck as pending" porque "no van electronicamente" y no se puede marcar el pedido como reembolsado, sin respuesta oficial (2021) [T2]; Shopify staff: algunos reembolsos tardan 12-24+ h segun la pasarela (2026-01) [T3]. El "pending hasta 2 dias habiles" de la Ayuda de Shopify es de Shopify Payments, no de apps de terceros [OFICIAL: S42, S43].
- El comerciante NO puede cancelar ni revertir un reembolso despues de iniciarlo desde el admin de Shopify [OFICIAL: S43]. [INFERENCIA] Por eso un PENDING solo lo cierra la app/proveedor (Wompi/desarrollador del plugin) o Shopify Support; la capacidad de Shopify Support de cerrarlo [NO CONFIRMADO].

### 5.4 Opciones del comerciante sin falsear estados
- Reembolso hecho por fuera (transferencia): Shopify indica que "no se registra automaticamente"; el pedido puede seguir "pagado" hasta registrarlo; hay que ingresar el monto reembolsado por fuera, anotar en el motivo que se proceso fuera de Shopify y, si esta disponible, desmarcar la opcion de procesar el reembolso del pago para registrarlo sin reprocesarlo [OFICIAL: S42].
- Cancelar el pedido: al cancelar un pedido pagado, el comerciante elige: reembolso al medio original, credito de tienda o "Despues" (no se emite reembolso) [OFICIAL: S44]. "Despues" evita lanzar otro reembolso a la pasarela.
- Credito de tienda, gift card u otro medio manual son alternativas oficiales si no se puede devolver al medio original [OFICIAL: S42]; en Colombia el consumidor decide el medio (Ley 2439 art. 5), por lo que credito de tienda solo si el consumidor lo acepta [INFERENCIA legal; validar con abogada].
- orderCreateManualPayment registra PAGOS manuales, no reembolsos [OFICIAL: S45]; no sirve para registrar la devolucion.
- Riesgo de duplicidad [INFERENCIA]: no iniciar un segundo reembolso en Shopify ni transferir manualmente SIN antes aclarar con Wompi si el PENDING podria resolverse despues y mover dinero. Si la app resolviera el PENDING mas tarde, Shopify mostraria un reembolso exitoso del mismo monto que el ya hecho por transferencia. Documentar en la nota del pedido.
- Regla de honestidad de estados: el estado "Reembolsado" en Shopify solo cuando el dinero realmente se devolvio; mientras tanto el PENDING debe quedar visible y explicado en nota interna (no borrar ni "forzar" transacciones).
- Tip del comerciante de terceros: Wompi/WooCommerce "algunas versiones no soportan refund nativo; hacerlo desde el dashboard de Wompi" [T5: elsasto.com, 2026-09-03; es de WooCommerce, NO aplicable como oficial a Shopify].

---------------------------------------------------------------------

## 6. API OFICIAL DE WOMPI PARA ANULACIONES/REEMBOLSOS (SOLO DESCRIPCION; NO USAR)

Ambientes y llaves [OFICIAL: S31]
- Produccion https://production.wompi.co/v1 ; sandbox https://sandbox.wompi.co/v1 . Llaves: publica pub_*, privada prv_*, de eventos y de integridad; en produccion prefijos pub_prod_, prv_prod_, prod_events_, prod_integrity_. Cada URL exige las llaves de su ambiente.

Anulacion (void) [OFICIAL: S27]
- POST /v1/transactions/{transaction_id}/void ; "para anular una transaccion con tarjeta (solo disponible para ciertos estados)"; Authorization: Bearer prv_prod_... ; sin cuerpo. Estado resultante VOIDED, "solo aplica a tarjeta credito/debito" [OFICIAL: S27, S33].
- Terceros (NO oficial, no verificado): un conector de codigo abierto reporta que Wompi confirmo por escrito que su API solo anula pagos con tarjeta, que no existe API de reembolso que un comercio pueda llamar, que la anulacion del mismo dia funciona (VOIDED segundos despues) y que a los 3 dias respondio ERROR "Original no encontrado" [T1: github.com/PXSOL/hyperswitch PR #53]. [NO CONFIRMADO].

Reembolsos V2 [OFICIAL: S28, pagina titulada "Refunds V2 (Sandbox)"]
- POST /v1/refunds ; base mostrada: https://sandbox.wompi.co ; llave privada como Bearer (prv_test_ en sandbox, prv_prod_ en produccion); una llave publica devuelve 401/403.
- Cuerpo: transaction_id (transaccion APROBADA), amount_in_cents (total o parcial), reason (opcional), reference ... reference_5 (opcionales). Respuesta: id, status, status_message, v2_refund_id, amount_in_cents, transaction_id, referencias, created_at. Estados: APPROVED, DECLINED ("Tiempo limite sin encontrar fondos excedido"), ERROR ("Error en la comunicacion con el autorizador"), CANCELLED (cancelacion del comercio, con cancelled_at). Regiones: Colombia (COP) y Panama (USD). Existe una version V1 legada: POST /v1/transactions/:id/refunds.
- La pagina NO dice si V2 esta disponible en produccion, si exige habilitacion adicional por Wompi, ni si aplica a Nequi/PSE/tarjeta solamente [OFICIAL por ausencia: S28]. "El simulador de sandbox aplica solo a V2".
- Pagos a terceros (Payouts) es OTRA API: autenticacion con API Key + Principal User ID desde el dashboard (no la llave privada), endpoints /payouts y /payouts/file; requiere activacion por el representante legal (revision de 2 a 5 dias habiles) [OFICIAL: S32, S25]. Los textos consultados no indican que tenga funcion especifica de reembolso: "Reembolsos a compradores" aparece como caso de uso de enviar dinero a un tercero [OFICIAL: S25].

Es apropiada con la integracion Shopify? [INFERENCIA]
- No recomendada: (1) el plugin/conector de Shopify no documenta reembolsos [S30]; un reembolso hecho directo por API quedaria en Wompi pero Shopify seguiria "pagado" o con el PENDING abierto, desincronizando estados y arriesgando duplicidad; (2) requiere compartir la llave privada de produccion (prohibido salvo orden expresa de la duenia); (3) Refunds V2 solo se documenta en sandbox; (4) para Nequi no hay prueba de soporte.
- Si algun dia se usa: solo con autorizacion expresa de Daniela, tras confirmacion escrita de Wompi de que V2 esta habilitado en produccion y cubre el medio del pago, y registrando el resultado en Shopify como reembolso externo.

---------------------------------------------------------------------

## 7. TIEMPOS ESPERADOS POR MEDIO Y POR CANAL

| Canal / figura | Plazo | Fuente |
|---|---|---|
| Anulacion tarjeta (panel/API) mismo dia | En linea, inmediata si se hace tras el pago | [OFICIAL: S1] |
| Reversion tarjeta via soporte Wompi | Maximo 10 dias habiles | [OFICIAL: S1] |
| Reversion art. 51 (participantes del pago) | 15 dias habiles desde que el consumidor presenta la solicitud ante el emisor | [OFICIAL: S47] |
| Queja del consumidor al proveedor + aviso al emisor | 5 dias habiles desde que tuvo noticia / debio recibir el producto | [OFICIAL: S47] |
| Retracto (ejercicio) | 5 dias habiles desde la entrega (bienes) | [OFICIAL: S49] |
| Devolucion del dinero por retracto (e-commerce) | No mas de 15 dias calendario desde que se ejerce el derecho y se cumplen obligaciones (datos correctos + devolucion del producto); todos los actores, incluida la entidad financiera, deben cumplirlo | [OFICIAL: S48 art. 3] |
| Entrega tardia / sin producto (e-commerce) | Si supera lo pactado o 30 dias calendario, el consumidor puede resolver y obtener devolucion; devolucion maximo 15 dias calendario, sin retencion ni descuento | [OFICIAL: S48 art. 4 lit. h] |
| Devolucion del dinero: medio | A traves del medio de pago que prefiera el consumidor (art. 5); aplicada al instrumento de pago o al medio acordado, informando las opciones (art. 3) | [OFICIAL: S48] |
| Soporte Wompi: tickets/correo | Aclaraciones 5 dias habiles; consultas/solicitudes 7; quejas 5; reclamos 3 | [OFICIAL: S16, 2025-12-11] |
| Soporte Wompi: WhatsApp corporativo | 20 min sin escalamiento; con escalamiento, los plazos del ticket | [OFICIAL: S16] |
| Contracargo (decision final en Wompi Cuenta) | Wompi tiene hasta 10 dias habiles tras el proceso del adquirente | [OFICIAL: S22 §6.12] |
| Reembolso Wompi (total) | No publicado | [NO CONFIRMADO] |
| Shopify Payments (solo referencia, NO aplica a Wompi) | PENDING hasta 2 dias habiles; hasta 10 dias habiles al banco del cliente | [OFICIAL: S42] |
| Transferencia manual Nequi/Bancolombia/Bre-B | "Pagos inmediatos" segun Wompi; otros bancos (ACH) por ciclo | [OFICIAL: S25 para inmediatos; ACH NO CONFIRMADO] |

Nota legal [INFERENCIA]: Radaelli ya ha preparado el paquete legal de retracto/garantia; este documento solo aporta lo que afecta a la operacion de pagos. Los 15 dias calendario corren "desde que ejercio el derecho y cumplio las obligaciones": los datos de la cuenta destino deben pedirse de inmediato por canal privado.

---------------------------------------------------------------------

## 8. PROCEDIMIENTO MANUAL RECOMENDADO Y EVIDENCIA (derivado de las fuentes; no ejecutar sin autorizacion)

Cuando toca devolver manualmente (transferencia desde la cuenta de Radaelli o Payouts) [INFERENCIA basada en S6, S7, S25, S50, S52]:
- pago con Nequi, PSE o Boton Bancolombia (Wompi no ofrece boton de anular y Bancolombia dice que se hace nueva transferencia);
- tarjeta cuando ya no se puede anular y la reversion via soporte/red no procede o el consumidor acepta otro medio;
- el reembolso por Wompi es rechazado, no hay Disponible o Wompi no responde en los plazos legales.

Pasos
1. Verificar pedido y titularidad: pedido Shopify, ID/referencia de la transaccion en Wompi, medio de pago, monto, fecha; que quien pide la devolucion sea el pagador (para Nequi, coincidir los ultimos digitos del celular).
2. Clasificar el caso: retracto, garantia/producto defectuoso, error, no entrega, reversion art. 51 solicitada por el consumidor, desistimiento voluntario. No mezclar figuras.
3. Emitir constancia de la solicitud al consumidor con fecha, hora y causal (el Decreto 587 art. 2.2.2.51.4 exige constancia del proveedor al recibir la queja) y numero de radicado/seguimiento (Ley 2439 art. 4 lit. g) [OFICIAL: S47, S48].
4. Pedir los datos de destino por canal privado (nunca GitHub ni canales publicos): para Nequi, el celular del pagador; si no se devuelve a Nequi, datos bancarios del titular. No pedir claves, tarjeta completa ni CVV.
5. Elegir canal en este orden [INFERENCIA]: (a) boton Anular/Reembolsar en panel si existe para esa transaccion; (b) soporte Wompi con los datos de la transaccion si el boton no existe; (c) Payouts "Reembolsos a compradores" si esta activado; (d) transferencia desde la cuenta bancaria o Nequi de Radaelli.
6. Monto: devolver el valor total pagado por el consumidor (sin restar la comision de Wompi) mientras no se confirme legalmente lo contrario; la Ley 1480 art. 47 (version consultada) habla de devolucion "sin descuentos ni retenciones por concepto alguno" en comercio electronico [OFICIAL: S49, leido via extraccion automatica; confirmar literal]. La comision de Wompi queda como costo del comercio.
7. Ejecutar la transferencia (con autorizacion explicita de Daniela para movimientos de dinero), guardar el comprobante emitido por la entidad financiera [OFICIAL: S52, snippet].
8. Registrar en Shopify: nota interna del pedido + etiqueta (convencion propia, p.ej. reembolso-manual-AAAAMMDD), y registrar el reembolso "procesado fuera de Shopify" con monto, motivo y nota (desmarcando el reprocesamiento del pago si aparece) [OFICIAL: S42 para el procedimiento; etiqueta y nombre: INFERENCIA]. Dejar escrito en la nota que existe una transaccion REFUND en PENDING y su explicacion.
9. Wompi: la transaccion permanece APROBADA; la comision sale en la factura mensual de Wompi (dia 4 del mes siguiente) [OFICIAL: S19]; conciliar abono vs factura [INFERENCIA]. No existe "registrar reembolso" en Wompi si se hizo por fuera [NO CONFIRMADO].
10. Contabilidad: si se emitio factura electronica de venta, la devolucion normalmente se soporta con nota credito electronica referenciando la factura [DIAN, S55: la nota credito es el instrumento derivado de la factura; casuistica NO CONFIRMADA aqui]; confirmar con contador. Wompi no es el receptor de las facturas: los soportes son para el cliente final [OFICIAL: S19].
11. Confirmar a la clienta por escrito (correo) con comprobante, fecha y monto.
12. Conservar el expediente: Wompi exige al comercio conservar 12 meses desde la venta los documentos soporte de las transacciones para responder reclamaciones [OFICIAL: S22 §12]; la retencion contable/tributaria puede ser mayor [NO CONFIRMADO; contador].

Evidencia a guardar (PQR, retracto, garantia, reversion)
- Capturas/PDF de: detalle de la transaccion en Wompi (ID, referencia, medio, estado, monto, comision), linea de tiempo del pedido en Shopify (incluida la transaccion REFUND PENDING), correo/WhatsApp de la solicitud del consumidor con fecha y hora, constancia de recibido y numero de radicado, politica de devoluciones vigente al momento de la compra, comprobante de entrega y fecha de entrega (para el conteo de 5 dias habiles), fotos del producto devuelto y guia, correspondencia con soporte Wompi (numero de ticket), comprobante bancario o de Nequi, confirmacion enviada a la clienta.
- Si hay reversion art. 51 en curso: el Decreto 587 reconoce que si el proveedor ya devolvio directamente el precio y el emisor igual revierte, el consumidor debe devolver esos recursos al proveedor (art. 2.2.2.51.10) [OFICIAL: S47]; por eso el comprobante propio es clave. Si hay controversia, Wompi puede pedir los soportes dentro de 5 dias habiles o el comercio debe reintegrar lo reclamado (§6.9.5) [OFICIAL: S22].
- Politica publica: el Reglamento obliga al comercio a "garantizar que sus politicas de devolucion o reembolso esten claramente informadas" a los pagadores [OFICIAL: S22 §12].

---------------------------------------------------------------------

## 9. CAMBIOS SUGERIDOS A POLITICA PUBLICA Y MANUAL (solo de lo que respaldan las fuentes)
- Politica: no prometer que el reembolso "siempre regresa automaticamente por Wompi/mismo medio". Redacciones sustentadas: plazo maximo de 15 dias calendario para retracto en compras en linea, tras recibir los datos y el producto; devolucion por el medio de pago que prefiera la clienta o el acordado, informando las opciones disponibles [OFICIAL: S48 arts. 3 y 5]; la comision de la pasarela la asume Radaelli [INFERENCIA operativa].
- Manual: incorporar el arbol de la seccion 8 y la lista de evidencia; prohibir pedir datos bancarios por GitHub o canales publicos; definir quien autoriza movimientos de dinero (Daniela).

---------------------------------------------------------------------

## 10. CONTACTO DE SOPORTE WOMPI (COMERCIOS) Y DATOS A ENTREGAR

Canales oficiales [OFICIAL: S16 act. 2025-12-11; S17 act. 2025-11-11; S18 act. 2024-07-11; S26]
- Formulario de solicitudes: https://soporte.wompi.co/hc/es-419/requests/new?ticket_form_id=360000591473 (boton "Escribenos" en wompi.com/es/co).
- WhatsApp: +57 322 280 4391.
- Chat en wompi.com/es/co (boton soporte).
- Horario de los tres: lunes a viernes (dia habil) 8 a.m. a 5 p.m., servicio continuo.
- Correo ayuda@wompi.co (aparece en el Reglamento como contacto del comercio) [OFICIAL: S22, S23].
- Estado de plataforma: https://wompi.statuspage.io/ [OFICIAL: S18].
- Linea telefonica 01 800 0912345 aparece solo en un articulo de 2022 sobre QR [OFICIAL pero antiguo: S8]; no usarla sin confirmar.
- Tiempos: tickets 3 a 7 dias habiles segun tipo; WhatsApp 20 min sin escalamiento [OFICIAL: S16].

Que entregar a Wompi (sin datos sensibles) [OFICIAL: S1 para tarjeta; resto INFERENCIA]
- Datos de la transaccion: ID de transaccion Wompi y referencia (numero de pedido Shopify), fecha y hora, valor, medio de pago, estado; para tarjeta: codigo de autorizacion y ultimos 4 digitos; para Nequi: ultimos digitos del celular.
- Datos del comercio: razon social/NIT/correo del Super Administrador, ID del comercio; motivo (reembolso comercial / anulacion / reversion).
- Pedir expresamente: si el medio admite reembolso desde Wompi Cuenta, si hay costo adicional (Reglamento §6.11), si se requiere recargar Disponible, tiempos, y que confirmen por escrito.
- NO enviar por canales publicos ni por GitHub: llaves (prv_), contrasenas, numero completo de tarjeta, CVV, datos bancarios completos de la clienta, cedulas. Para datos de la clienta usar el ticket autenticado o canal privado.

Preguntas concretas para soporte (Daniela decide si las envia)
1. Para pagos Nequi hechos por el plugin de Shopify en mi cuenta (modelo X), existe reembolso total/parcial desde Wompi Cuenta? Costo? Plazo? Requiere Disponible?
2. Esta habilitado Refunds V2 en produccion para mi cuenta? Aplica a Nequi?
3. El reembolso de Shopify en PENDING (pedido #1002): el conector lo resolvera algun dia? Hay riesgo de que mueva dinero? Quien puede cerrarlo (Wompi o el desarrollador del plugin)?
4. Si ya se desembolso, como se obtiene el Disponible (recarga, debito de cuenta inscrita)?

---------------------------------------------------------------------

## 11. DUDAS QUE SOLO SE RESUELVEN MIRANDO LA CUENTA REAL (checklist para Claude; solo lectura)

Wompi (panel, sesion autorizada por Daniela; no pulsar acciones que muevan dinero)
1. Modelo y plan: Agregador/Gateway; nombre del plan; ver si el panel muestra "Wompi Cuenta" con saldos y que etiquetas usa (Disponible, Por abonar, Retenido, etc.).
2. Medios habilitados: cuales estan activos en el plugin (tarjetas, Nequi, PSE, Boton, QR, Daviplata, efectivo, Bre-B).
3. Detalle de la transaccion #1002: ID, referencia, medio (NEQUI), estado, monto, comision, IVA, neto, fecha de abono, si ya se abono a la cuenta bancaria o sigue en Wompi Cuenta y si figura como Disponible.
4. Si el detalle muestra algun boton o menu de Anular/Reembolsar/Solicitar devolucion (capturar pantalla exacta) y para que medios aparece (comparar con una transaccion con tarjeta si existiera).
5. Si el panel tiene una seccion "Reembolsos" o un formulario de solicitud de reembolso y su texto (costos, plazos).
6. Pagos a terceros/Payouts: activo o no; plan y tarifa vigentes (en la web: $1.849 + 0,4 % + IVA con Wompi Cuenta); roles; limites; si permite pagar a Nequi; si existe "Recarga Wompi Cuenta"; si aparece "Reembolsos".
7. Reglas de desembolso: abono automatico activado; si aplica la regla de primer desembolso a 30 dias; fecha estimada de abono de #1002.
8. URL de eventos configurada (wompi-event-shopify.conexa.ai...) para produccion; ver si hay logs de eventos de #1002.
9. Si en el panel hay estado/refund asociado a #1002 originado por el intento de Shopify (por ejemplo un reembolso V2 CANCELLED/DECLINED/ERROR) o ninguno.
10. Facturacion de Wompi: si ya hay factura/detalle de comisiones y cuando llega (dia 4).

Shopify (admin, solo lectura; no reintentar ni crear otro reembolso)
11. Settings > Payments: nombre exacto de la app (Wompi checkout tradicional vs Wompi Tarjetas), desarrollador, y si hay opciones de reembolso en su configuracion.
12. Pedido #1002 > linea de tiempo y detalle de transacciones: tipo REFUND, estado PENDING, hora, gateway, mensajes de error, monto; si ofrece "reintentar", "cancelar" o "marcar"; estado financiero del pedido (pagado / reembolso pendiente).
13. Que opciones muestra la pantalla de reembolso (solo mirar): si ofrece desmarcar el reprocesamiento del pago, si bloquea otro reembolso mientras haya uno PENDING.
14. Si Shopify Support o el desarrollador del plugin pueden cerrar un PENDING (Daniela decide si abre caso).

---------------------------------------------------------------------

## 12. CONTRADICCIONES ENTRE FUENTES Y FECHAS

1. S3 (2021-05-04): reembolsos "solo aplican a Tarjetas Visa/MC/Amex con autorizador Redeban/Credibanco" vs S4 (2021-05-04): "para autorizadores RBM, API NEQUI y Boton Bancolombia solo reembolsos totales" -> sugiere reembolso para Nequi/Boton; no hay articulo posterior que lo aclare.
2. S4 (2021, Wompi, reembolso total para Boton Bancolombia) vs S50 (Bancolombia, 2026-07-16: el Boton no admite devoluciones; nueva transferencia). Prevalece lo mas reciente y del propietario del producto, pero [NO CONFIRMADO] hasta verlo en el panel.
3. Adquirentes: S3/S4 hablan de Redeban/Credibanco; el Reglamento V4-2026 nombra a Bancolombia S.A. y Akua Colombia Acquiring S.A. -> los articulos de 2021 pueden estar desactualizados.
4. Reglamento: el buscador indexa la version V3-2025; el PDF que se sirve hoy dice V4-2026. Se uso V4-2026 (leido hoy).
5. S3 dice que los impuestos se devuelven al comercio (salvo comision/IVA); S4 dice que se devuelven "al cliente comprador".
6. S2 (App Wompi, 2023): anulacion de tarjeta exige que el comprador este presente con el mismo celular/usuario; S1 (2024): "Anular transaccion" en el detalle de la transaccion. Son contextos distintos (Venta Presente vs pasarela); no mezclar.
7. S28 (Refunds V2 solo sandbox) vs S4/S3 (reembolsos operativos desde Wompi Cuenta) vs T1 (tercero: Wompi dijo que no hay API de reembolso para comercios). Estado real en produccion: [NO CONFIRMADO].
8. Ley 1480 art. 47: el plazo de devolucion pasa de 30 a 15 dias calendario por Ley 2439/2024 (D.O. 52.975, 2024-12-29, vigente desde su publicacion; los literales b, g, h del art. 50 entran 4 meses despues) [OFICIAL: S48]. Resumenes de terceros que dicen "30 dias habiles" estan desactualizados.
9. S6/S7 (Nequi, 2021: "ni Nequi ni Wompi son responsables... de mutuo acuerdo") vs Reglamento 2026 §6.11 (Wompi puede procesar reembolso): no se contradicen del todo (la decision es del comercio; Wompi solo ejecuta), pero el 2021 no menciona esa via.
10. El texto de la Ayuda de Shopify sobre PENDING "hasta 2 dias habiles" aplica a Shopify Payments, no a apps de terceros.
11. La busqueda web devolvio un parrafo que afirmaba "los reembolsos se gestionan desde el panel de Wompi y luego se actualiza Shopify a mano" para Shopify; rastreado, proviene de una guia de terceros sobre WooCommerce (T5), no de Wompi ni de Shopify. No se usa como oficial.

---------------------------------------------------------------------

## 13. FUENTES (URL, fecha de la fuente, fecha de lectura 2026-10-03)

Wompi soporte (soporte.wompi.co/hc/es-419/articles/...)
- S1 360046916653 "Como se gestiona la reversion de una transaccion con Tarjeta de credito" — act. 2024-06-19.
- S2 24298764333971 "Como puedo anular una trx con tarjeta" (seccion APP WOMPI) — act. 2023-12-19.
- S3 1500009267322 "Que es reembolso total y que pasa con los impuestos previamente liquidados" — 2021-05-04.
- S4 1500009267462 "Que pasa con los impuestos cuando hay reembolsos y anulaciones" — 2021-05-04.
- S5 360054848754 "Reversion ... modelo Gateway" — 2023-08-10.
- S6 1500007715282 "Si el cliente comprador me solicita la reversion de un pago (Nequi Gateway)" — 2021-04-21.
- S7 1500007683101 "Si deseo solicitar la reversion de un pago (Nequi)" — 2021-04-19.
- S8 10692726885651 "Puedo realizar una reversion para QR" — 2022-10-25.
- S9 10585899359891 "Bien o servicio llego malo ... reembolsen el dinero" — 2022-10-21.
- S10 360020766034 Desembolso por modelo — 2023-06-06.
- S11 16754899741331 Desembolso modelo Gateway — 2023-05-18.
- S12 25979088289299 Saldo disponible para dispersar — 2024-02-05.
- S13 4402148940435 Contracargos segun modelo — 2023-06-06.
- S14 1500009288841 Impuesto de la pasarela (IVA 19 % sobre comision) — 2023-06-06.
- S15 360020957133 Planes y tarifas — 2026-01-07.
- S16 360020766194 Horario y canales — 2025-12-11.
- S17 360020766994 Quejas y reclamos — 2025-11-11.
- S18 17104737976339 Donde comunicarme — 2024-07-11.
- S19 27372368075539 Documento a Wompi para sustentar ventas — 2024-03-13.
- (Medios de pago de la pasarela: 360020764334, 2023-06-06.)
Wompi legal y sitio
- S22 https://wompi.com/assets/downloadble/reglamento-Comercios-Colombia.pdf — "Reglamento de Comercios Wompi", marca V4-2026 (leido literal).
- S23 https://wompi.com/assets/downloadble/reglamento-Usuarios-Colombia.pdf — "Reglamento de Uso para los Pagadores", v-1.
- S24 https://wompi.com/es/co/planes-tarifas/plan-avanzado-agregador
- S25 https://wompi.com/es/co/soluciones/payouts
- S26 https://wompi.com/es/co/ayuda/
Wompi docs
- S27 https://docs.wompi.co/en/docs/colombia/transacciones/
- S28 https://docs.wompi.co/en/docs/colombia/reembolsos-sandbox/
- S29 https://docs.wompi.co/en/docs/colombia/metodos-de-pago/
- S30 https://docs.wompi.co/en/docs/colombia/wompi-shopify-plugin/
- S31 https://docs.wompi.co/en/docs/colombia/ambientes-y-llaves/
- S32 https://docs.wompi.co/en/docs/colombia/introduccion-pagos-a-terceros/ y .../que-es-pagos-a-terceros/
- S33 https://docs.wompi.co/en/docs/colombia/seguimiento-de-transacciones/
- S34 https://apps.shopify.com/wompi-native ("Wompi Tarjetas", Wompi Co, act. 2025-07-07)
Shopify
- S35 https://shopify.dev/docs/apps/build/payments/processing
- S36 https://shopify.dev/docs/api/payments-apps/latest/mutations/refundSessionResolve
- S37 https://shopify.dev/docs/api/payments-apps/latest/mutations/refundSessionReject
- S38 https://shopify.dev/docs/api/payments-apps/latest/objects/RefundSession
- S39 https://shopify.dev/docs/apps/build/payments/request-reference
- S40 https://shopify.dev/docs/apps/build/payments/alternative/build-an-alternative-payment-extension?framework=remix
- S41 https://shopify.dev/docs/apps/build/payments/considerations
- S42 https://help.shopify.com/en/manual/payments/shopify-payments/refunds-troubleshooting
- S43 https://help.shopify.com/en/manual/fulfillment/managing-orders/refunding-orders
- S44 https://help.shopify.com/en/manual/fulfillment/managing-orders/canceling-orders
- S45 https://shopify.dev/docs/api/admin-graphql/latest/mutations/orderCreateManualPayment
- S46 https://shopify.dev/docs/api/admin-graphql/latest/enums/OrderTransactionStatus
Normas colombianas
- S47 Decreto 587 de 2016 (D.O. 49.841, 2016-04-11), compilado en el Decreto 1074/2015 cap. 51 (arts. 2.2.2.51.1 a .14) — https://www.mincit.gov.co/ministerio/normograma-sig/procesos-de-apoyo/gestion-juridica/decretos/decreto-587-de-2016.aspx (PDF leido literal).
- S48 Ley 2439 de 2024 (D.O. 52.975, 2024-12-29) — copia https://portaldms.com/3/files/LEY_2439_DEL_19_DE_DICIEMBRE.pdf (PDF leido literal; confirmar en Diario Oficial/Senado).
- S49 Ley 1480 de 2011 arts. 47 y 51 — https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=44306 (extraccion automatica).
- S55 DIAN, Resolucion 165 de 2023 (nota credito como instrumento derivado de la factura) — https://normograma.dian.gov.co/dian/compilacion/docs/resolucion_dian_0165_2023.htm (solo definicion general leida).
Bancolombia / Nequi / PSE
- S50 https://www.bancolombia.com/centro-de-ayuda/preguntas-frecuentes/cancelacion-boton-bancolombia — act. 2026-07-16.
- S51 https://www.bancolombia.com/centro-de-ayuda/preguntas-frecuentes/saldo-devuelto-por-compras-reversadas — 2022-05-26.
- S52 https://ayuda.nequi.com.co/hc/es/articles/360048047132 y .../35211873761805 ("reembolso al pagar con Nequi por PSE") — 403, solo snippet.
- S53 https://ayuda.nequi.com.co/hc/es/articles/36759078770317 ("Es posible cancelar un pago desde Nequi") y .../35777355759245 (QR) — 403, solo snippet.
- S54 https://www.pse.com.co/persona-centro-de-ayuda
Terceros (NO oficiales)
- T1 https://github.com/PXSOL/hyperswitch/pull/53 (conector Wompi; afirma respuesta escrita de Wompi).
- T2 https://community.shopify.com/t/shopify-and-payfast-refunds-get-stuck-as-pending/42646 (2021).
- T3 https://community.shopify.dev/t/refund-is-still-showing-pending/28567 (2026-01; personal de Shopify).
- T4 https://community.shopify.dev/t/payments-app-refund-session-not-triggered-after-capturesessionreject-order-still-shows-as-refunded/36771
- T5 https://elsasto.com/blog/integrar-wompi-en-woocommerce (WooCommerce, 2026-09-03).
- T6 https://www.latamfintech.co/articles/wompi-lanza-click-to-pay-y-pagos-on-site-en-shopify-para-acelerar-ventas-online-en-colombia (2025-09-29; sin mencion de reembolsos).

Archivos de trabajo locales (texto literal extraido): reglamento-comercios-co.txt, reglamento-pagadores-co.txt, decreto587.txt, ley2439.txt en la misma carpeta que este informe.
