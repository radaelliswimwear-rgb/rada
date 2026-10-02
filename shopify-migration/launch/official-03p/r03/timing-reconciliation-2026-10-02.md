# Conciliación de tiempos — 2026-10-02 (America/Bogota)

**Regla:** reloj de pared (wall-clock), sin sumar el trabajo de agentes en paralelo; los solapes se asignan una sola vez. `≈` = estimación con ancla en commits/marcas de herramienta; no se inventa precisión. Fuentes: commits de `origin/ai-handoff` (hora local, UTC-5), marcas de herramientas de esta sesión, §11/§11b del informe, `claude-result.md`.
**Inicio oficial:** 07:30:00 (commit de ChatGPT 07:30:08 «Advance official store start to 07:30»; primera acción de Claude 07:36:21).
**Cortes:** 03P completa 08:51:42 · aprobada por ChatGPT 09:01:25 · 03Q publicada y certificada **11:55:39** (commit «03Q result») · 03R en curso (corte parcial al final).

## 1. Totales hasta el corte 03Q (07:30:00 → 11:55:39 = **4 h 25 min 39 s** de reloj de pared)
| Categoría | Tiempo | Cómo se obtiene |
|---|---|---|
| **TIEMPO MUERTO EVITABLE (sistema/orquestación)** | **37 m 44 s** (09:03:30 → 09:41:14) | Registrado; no se reclasifica. Claude cerró el turno con un resumen en lugar de seguir con trabajo seguro. |
| ESPERA DE LA DUEÑA / SUPERVISOR (ChatGPT) | ≈ 50 min | suma de las filas «owner/supervisor» de la tabla 2 (≈ 42 min dueña + ≈ 7 min revisión de ChatGPT) |
| ESPERA DE PLATAFORMA | ≈ 17 min | login del CLI, pausas anti-429, aprovisionamiento TLS (4 m 21 s), pestañas congeladas/CDP |
| TRABAJO ACTIVO (Claude + agentes en paralelo, sin sumar agentes) | ≈ 2 h 41 min | resto = 4:25:39 − 0:37:44 − ≈0:50 − ≈0:17 |
| COSTO DE PRUEBA DE LANZAMIENTO | **no es tiempo**: ver §4 | Wompi $990,67 + Shopify 2 % ≈ $100 |
La suma de las categorías cuadra con el reloj de pared por construcción (el trabajo activo es el residuo); la incertidumbre está en los ≈ de espera (±5 min).

## 2. Tabla por puerta/tarea (inicio · fin · duración · clase · fuente)
| Puerta / tarea | Inicio | Fin | Duración | Clase | Evidencia / fuente |
|---|---|---|---|---|---|
| Orientación + G0 Colombia (alta, origen, país) | 07:30:00 | 07:40:19 | 10 m 19 s | ACTIVO ≈ 8 m 49 s + ESPERA DUEÑA ≈ 1 m 30 s (código de login) | §11 G0; commit 07:30:08 |
| G1 línea base + olas A-F (tema, defs, colecciones, productos, membresía, publicación, páginas, políticas, redirecciones, menús) | 07:40:19 | ≈ 08:01 | ≈ 21 m | ACTIVO (≈ 1 m espera plataforma: login del CLI) | §11; commit 08:03:34 |
| Inventario, pesos 500 g, paridad G6 | 07:53:43 | ≈ 08:06 | ≈ 12 m (solapado con olas) | ACTIVO | §11 |
| Wompi TEST + facturación (llaves/URL de la dueña; plan Basic) | ≈ 08:00 | ≈ 08:12 | ≈ 12 m (solapado con paridad) | ESPERA DUEÑA ≈ 13 m acumulados (8 m llaves + 5 m pago del plan) | §11 filas 103–104 |
| Lote de acciones de la dueña (preparación) | ≈ 08:12 | 08:40:13 | ≈ 28 m | ACTIVO (Claude trabajando en regresión mientras tanto) | commits 08:11–08:40 |
| Regresión oficial (29 PDP/98 variantes, rutas, responsive, umbral) | ≈ 08:14 | ≈ 08:40 | ≈ 26 m | ACTIVO ≈ 22 m + PLATFORM ≈ 4 m (límites 429) | §11 filas 107–110 |
| Notificaciones/correos (ventana del navegador cerrada por la dueña) | ≈ 08:35 | ≈ 08:41 | ≈ 6 m | ACTIVO ≈ 4 m + ESPERA DUEÑA ≈ 2 m | §11 fila 105 |
| E2E sandbox #1001 (B1 de la dueña, cancelación y cierre) | ≈ 08:41 | 08:50 | ≈ 9 m | ACTIVO ≈ 6 m + ESPERA DUEÑA ≈ 3 m | §11 fila 111; commit 08:47:27 |
| **03P completa → handoff** | — | 08:51:42 | — | — | commit 08:51:42 |
| Revisión de ChatGPT (micro-verificación pedida) | 08:51:42 | 08:56:40 | ≈ 5 m | ESPERA SUPERVISOR (ChatGPT) | commits 08:56:40/08:56:54 |
| Micro-verificación (dirección, idioma, impuestos) | 08:56:54 | 08:59:46 | ≈ 3 m | ACTIVO | commit 08:59:46 |
| Aprobación de ChatGPT | 08:59:46 | 09:01:25 | ≈ 1 m 39 s | ESPERA SUPERVISOR | commit 09:01:25 |
| Lote de propuestas de texto (D3/D9) | 09:01:25 | 09:03:30 | ≈ 2 m | ACTIVO | commit 09:02:31 |
| **TIEMPO MUERTO EVITABLE** | **09:03:30** | **09:41:14** | **37 m 44 s** | **AVOIDABLE SYSTEM/ORCHESTRATION IDLE** | registro; no se oculta |
| 03Q: D8 IVA, salud previa, dominio (lectura) | 09:41:14 | 09:49:08 | 7 m 54 s | ACTIVO | commit 09:49:08 |
| 03Q: auditorías legal/barra 20 %/idle | 09:49:08 | 09:58:27 | 9 m 19 s | ACTIVO (agentes en paralelo) | commit 09:58:27 |
| 03Q: kit de certificación, plan de medición, manuales (3 agentes) | 09:58:27 | 10:23:25 | ≈ 25 m | ACTIVO ≈ 22 m + PLATFORM ≈ 3 m (pestaña congelada/CDP 45 s) | commits 10:13:30–10:24:36 |
| Conexión no pública del dominio (tras la autorización de la dueña) | ≈ 10:14 | 10:19:55 | ≈ 5 m | ACTIVO ≈ 4 m + ESPERA DUEÑA ≈ 1 m (respuesta) | commit 10:19:55 |
| D9 identidad mínima + script de aplicación + guías 11/12 | 10:27:32 | 10:38:24 | ≈ 11 m | ACTIVO | commits 10:27–10:38 |
| GO + ciudad + monto (preguntas en el chat) | ≈ 10:40 | ≈ 10:44 | ≈ 4 m | ESPERA DUEÑA (≈ 2 m) + ACTIVO (≈ 2 m: ciudad aplicada) | commit 10:44:23 |
| Wompi LIVE (apagar modo prueba) | 10:44:23 | ≈ 10:54 | ≈ 10 m | ESPERA DUEÑA | marca de la dueña; pedido #1002 a las 10:58:25 |
| Suscripción/«Subscribe» + checkout + pago real (dueña) | ≈ 10:54 | 10:58:25 | ≈ 4 m | ESPERA DUEÑA | pedido #1002 15:58:25Z |
| Verificación del pedido/limpieza/documentación de DNS | 10:58:25 | ≈ 11:08 | ≈ 10 m | ACTIVO | consultas Admin; commit 11:14:30 |
| Hostinger: ventana cerrada por la dueña, login, autorización explícita | ≈ 11:08 | ≈ 11:12 | ≈ 4 m | ESPERA DUEÑA | marcas de herramientas |
| Cambio de DNS (A @ y CNAME www) | ≈ 11:12 | ≈ 11:14 | ≈ 2 m | ACTIVO | commit 11:14:30; captura de Hostinger |
| **TLS (Let's Encrypt) aprovisionando** | ≈ 11:14:30 | **11:18:51** | **≈ 4 m 21 s** | **ESPERA DE PLATAFORMA** | sondeo curl 11:15:29→11:18:51 (200/302 con ssl_verify=0 a las 11:18:51) |
| Dominio principal, publicar RC1.10, quitar contraseña, comprobación externa | 11:18:51 | ≈ 11:24 | ≈ 5 m | ACTIVO | modal «Tema publicado»; curl 200 |
| Certificación PL-1.0 real (corrida 1, corrección del script, corrida 2) | 11:25:44 | ≈ 11:46 | ≈ 20 m | ACTIVO (ejecución automática con pausas de 1,6 s contra 429) | commit 11:26:24; informe §16 |
| Arnés de 29 PDP / 98 variantes | ≈ 11:48 | ≈ 11:58 | 585 s + análisis | ACTIVO | pdp-real-domain-2026-10-02.json |
| Informe, evidencia y handoff 03Q | ≈ 11:46 | **11:55:39** | ≈ 10 m (solapado) | ACTIVO | commits 11:54:54 / 11:55:39 |

## 3. 03R (12:01 → hora de corte de este documento)
| Tarea | Inicio | Fin | Duración | Clase | Fuente |
|---|---|---|---|---|---|
| Espera del siguiente prompt tras el handoff 03Q | 11:55:39 | ≈ 12:01:03 | ≈ 5 m 24 s | ESPERA DUEÑA/SUPERVISOR | mensaje de la dueña; commit 12:01:03 |
| Lectura de 03R + lanzamiento de 4 agentes (Meta docs, privacidad, unit economics, monitoreo) | 12:01:36 | ≈ 12:05 | ≈ 3 m | ACTIVO | tool marks |
| Meta, Wompi panel, Envia, privacidad, banner, tablero (trabajo en paralelo con agentes) | ≈ 12:05 | ≈ 12:50 | ≈ 45 m | ACTIVO ≈ 32 m · ESPERA DUEÑA ≈ 6 m (login Wompi, 3 aprobaciones) · PLATAFORMA ≈ 7 m (pestañas congeladas, CDP, cargas lentas del Admin) | status CHECKPOINT_1 (12:48:39) |
| Reembolso de #1002 | 12:08:12 (solicitud) | **sin completar a las 12:42+** | — | PLATAFORMA/PROVEEDOR (Wompi no procesa solo) | transacción REFUND PENDING |
| TIEMPO MUERTO EVITABLE en 03R | — | — | **0** | — | ningún intervalo sin carril seguro disponible |

## 4. Costo de prueba de lanzamiento (no es tiempo)
Compra real #1002, COP 5.000 por Nequi: comisión de Wompi **$832,50 + IVA $158,17 = $990,67** (Wompi, «Entradas contables»); comisión de Shopify por pasarela externa 2 % ≈ **$100** (se factura aparte). **Costo real no recuperable ≈ COP 1.090,67** (el reembolso solicitado a Wompi sigue pendiente; la comisión no se devuelve).

## 5. Solapes y supuestos explícitos
- Los 3-5 agentes en paralelo de cada ventana NO se suman: el reloj de pared de la ventana se cuenta una vez como ACTIVO (más las esperas que ocurrieron a la vez que ninguna lane segura estaba disponible).
- Cuando una espera de la dueña coincidió con trabajo activo de Claude (por ejemplo, regresión mientras ella pagaba el plan), se cuenta como ACTIVO y la espera solo se anota como «solape»; los totales de la tabla 1 usan únicamente los intervalos en que Claude no tenía otra tarea segura.
- Las duraciones «≈» provienen de marcas de herramienta y commits; el margen es ± 3 min por fila.
