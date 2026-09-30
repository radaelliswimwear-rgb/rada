# 03I — Matriz de bloqueos (independiente vs. solo de la dueña)

*Generada por `launch/tools/03i-blocker-matrix.mjs` desde `launch/03I-blocker-matrix.json` (fuente única). No editar a mano: editar el JSON y volver a generar.*

**Fecha de los datos:** 2026-09-30. **Fuentes:** theme/03F-owner-actions-minimal.md; theme/03G-home-parity.md; launch/03G-launch-acceptance-checklist.md; launch/03G-reproducibility-gap-audit.md; launch/03G-commercial-store-migration-plan.md (decisiones D1-D20); launch/03G-responsive-sweep.md (H-01); theme/03H-theme-convergence-report.md; launch/03I-a1-preflight.md; launch/03I-b1-preflight.md.

## 1. Resultado

- Filas: **32**. Cubre 22 acciones/decisiones del lote (A1, A2, A3, A4, A5, B1, B2, B3, B4, C1, C2, C3, C4, C5, C6, C7, C8, D1, D2, D3, D4, D5), 17 hallazgos de paridad de Home aún abiertos, 21 brechas de reproducibilidad, 15 decisiones del plan (PD6 a PD20), 5 decisiones del runbook de envío (SH-D1 a SH-D5), H-01, y **32 compuertas de aceptación** no aprobadas (las 3 en PASS: AC-02, AC-11, AC-27).
- **Bloquean el lanzamiento: 18** filas → 13 necesitan a la dueña (acción, decisión, dato, OAuth, credencial o cambio irreversible), 3 solo su OK (lo demás lo hace Claude) y 2 no la necesitan (se miden o congelan sobre el RC final). 6 de ellas tienen una salida por decisión escrita de la dueña.
- Bloquean solo una función: 1. Diferibles: 12. Opcionales/trazabilidad: 1.
- Filas con motivo OAuth, credencial, irreversible o legal (Claude no puede hacerlas): **8**.
- Trabajo seguro de Claude **diferido a propósito** (no acorta ni desbloquea el lote): REL-01, VAL-01, HYG-01.
- Trabajo seguro e independiente **disponible hoy** que acorte o desbloquee el lote: **ninguno**.

**AUTONOMOUS_PRE_OWNER_WORK_EXHAUSTED = YES**

## 2. Orden recomendado de la dueña (por valor de desbloqueo y dependencia)

Una sola lista, una acción a la vez. **A1 → B1 → validación dependiente (la hace Claude)** y luego el resto. Las filas `PARALLEL_OK` solo cuestan un OK de ~1 minuto y liberan trabajo que Claude corre mientras la dueña sigue con la secuencia principal.

| # | ID | Carril | Qué | ¿Quién? | Bloquea |
|---|---|---|---|---|---|
| 1 | **A1** | LEAD | Envío y mercado de Colombia: sucursal, zona 'Colombia' y tarifas en COP (A1a); dirección de la tienda a Colombia solo si la medición lo exige (A1b) | YES (ACTION, DECISION, DATA) | LAUNCH |
| 2 | **B1** | LEAD | Pagos de prueba: pasarela de prueba de Shopify primero; Wompi (app oficial, llaves de prueba, URL de eventos) después, si aparece | YES (ACTION, OAUTH, CREDENTIAL) | LAUNCH (waiver) |
| 3 | **A4** | PARALLEL_OK | OK para descargar 12 archivos del Cloudinary propio (~15,6 a 20,7 MB) y subirlos a Contenido > Archivos; luego cablear media, logo y favicon en un RC nuevo | OK_ONLY (OK) | LAUNCH (waiver) |
| 4 | **D5** | PARALLEL_OK | OK para respaldar el trabajo de migración: rama dedicada + copia fuera de esta máquina + copia local de las 95 fotos (solo subcarpetas de producto) | OK_ONLY (OK) | LAUNCH |
| 5 | **D1** | THEN | Talla XL de alba-dorada-cafe-claro: ¿existe? (la Dev Store ofrece 98 variantes; el sitio actual muestra S, M y L) | YES (DECISION) | LAUNCH (waiver) |
| 6 | **D2** | THEN | Inventario: cantidades por variante (98) o decidir vender sin límite | YES (DATA, DECISION) | LAUNCH (waiver) |
| 7 | **B2** | THEN | Legales: aprobar las 4 páginas pendientes (Privacidad, Términos, Envíos, Cookies) y entregar razón social, NIT y dirección | YES (LEGAL, DATA, DECISION) | LAUNCH (waiver) |
| 8 | **A2** | THEN | Código de ingreso de clienta (llega por correo; lo escribe ella) | YES (ACTION, CREDENTIAL) | LAUNCH |
| 9 | **A3** | THEN | Instalar Search & Discovery (app oficial y gratuita; permisos OAuth) | YES (OAUTH) | LAUNCH |
| 10 | **C1** | THEN | Meta description de la Home (texto de la dueña) y título con sufijo de marca | YES (DECISION, DATA) | DEFERRABLE |
| 11 | **C2** | THEN | 'Recomendado para vos': curar una colección o dejar la sección oculta | YES (DECISION) | DEFERRABLE |
| 12 | **C3** | THEN | Voseo o tuteo para toda la interfaz (no solo los legales) | YES (DECISION) | DEFERRABLE |
| 13 | **C4** | THEN | Color de los botones blancos sobre arena (contraste 1,69:1, igual al sitio actual): texto oscuro, arena más oscuro o excepción firmada | YES (DECISION) | LAUNCH (waiver) |
| 14 | **C5** | THEN | Limpiar de la Tienda online las páginas y colecciones creadas por Shopify (/pages/contact en inglés, data-sharing-opt-out, colección 'Home page') | OK_ONLY (OK) | DEFERRABLE |
| 15 | **C6** | THEN | Orden de las colecciones y de 'Destacados': aceptar el de la Dev Store o igualar al del sitio actual | YES (DECISION) | DEFERRABLE |
| 16 | **C7** | THEN | Selector COP/USD del encabezado del sitio actual: ¿se conserva? ¿Las redes van también en la cabecera? | YES (DECISION) | DEFERRABLE |
| 17 | **C8** | THEN | Inglés (/en): despublicarlo o traducirlo | YES (DECISION) | DEFERRABLE |
| 18 | **D3** | THEN | Datos de clientas del sitio actual: decidir qué se migra o se archiva (clientas y direcciones, pedidos históricos, cupones y descuentos, suscriptores del newsletter, blog) | YES (DECISION, DATA) | LAUNCH |
| 19 | **D4** | THEN | Tienda comercial, dominio y corte: nueva o convertir la Dev Store; plan y facturación; nombre; español como idioma predeterminado desde el primer día; proveedor de DNS y acceso; ventana de corte y quién la ejecuta; retiro del sitio actual | YES (DECISION, DATA, IRREVERSIBLE, CREDENTIAL) | LAUNCH |
| 20 | **A5** | THEN | App de favoritos de cuenta: cuenta de desarrolladora, distribución personalizada (irreversible), instalar aceptando permisos, elegir dónde vive el backend | YES (ACTION, OAUTH, IRREVERSIBLE, DECISION) | FEATURE (waiver) |
| 21 | **B3** | THEN | Analítica: ID de medición de GA4, dataset de Meta e instalar las apps oficiales (OAuth) | YES (OAUTH, DATA, DECISION) | LAUNCH |
| 22 | **B4** | THEN | Publicar (al final): dominio, español principal, plantilla page.wishlist en Favoritos, redirecciones de la tienda comercial, remitente de correos, quitar la contraseña y apagar el sitio Next.js en la ventana de corte | YES (ACTION, IRREVERSIBLE, CREDENTIAL) | LAUNCH |
| 23 | **E1** | THEN | Correo de marketing y boletín (plataforma) y aviso 'Avísame' de reposición | YES (DECISION) | DEFERRABLE |

## 3. Matriz completa

Leyenda — **¿Claude hoy?** `AVAILABLE`: Trabajo seguro e independiente que acorta o desbloquea el lote de la dueña y todavía no está hecho (ninguno en 03I). · `PREP_DONE`: Toda la preparación segura ya está hecha (herramientas y documentos); solo falta la acción de la dueña. · `AFTER_OK`: Claude ejecuta el resto apenas la dueña da el OK o entrega el dato; hoy no hay nada seguro que hacer. · `NONE`: Nada seguro que Claude pueda hacer hoy (acción de la dueña, credencial, OAuth, decisión o irreversible). · `DONE_03I`: Cerrado en 03I. · `DEFERRED`: Trabajo seguro e independiente de Claude, pero que no acorta ni desbloquea el lote de la dueña y se ejecuta una sola vez en la fase que lo consume (ver deferReason).. **¿Dueña?** `YES`: La dueña es imprescindible (acción en el Admin, decisión, dato, credencial, OAuth o cambio irreversible). · `OK_ONLY`: Solo hace falta su OK explícito (p. ej. descargar, versionar, ejecutar); el resto lo hace Claude. · `NO`: No hace falta la dueña.. **Bloquea:** `LAUNCH`: Bloquea el lanzamiento (si dice 'waiver', existe una salida por decisión escrita de la dueña). · `FEATURE`: Bloquea solo una función (hay salida documentada de lanzar sin ella). · `DEFERRABLE`: Se puede lanzar sin esto (clasificación DIFFERENCE de 03G o equivalente); afecta calidad, no operación. · `OPTIONAL`: Nota u opcional..

### A1 — Envío y mercado de Colombia: sucursal, zona 'Colombia' y tarifas en COP (A1a); dirección de la tienda a Colombia solo si la medición lo exige (A1b)

| Campo | Valor |
|---|---|
| Estado actual | A1a + alineación a Colombia HECHOS en 03J (2026-09-30): sucursal «Shop location» en Barranquilla (Atlántico); zona «Colombia» (33/33 departamentos) con «Envío estándar gratis» desde $299.900 (3 a 5 días hábiles); y, con la dueña, la ENTIDAD COMERCIAL cambiada de Estados Unidos a Colombia (persona física; ella escribió sus datos personales y guardó) con lo que la dirección de la tienda pasó sola a Barranquilla, Colombia. Moneda COP, región de respaldo Colombia y zona horaria Bogotá intactas. Verificador post-A1 (antes y después de la alineación) = A1_UNLOCKED (modo G1, D2 pendiente): 29/29 productos y 98/98 variantes con país CO, add.js 200, checkout es-co. PENDIENTE: SH-D2 (tarifa por debajo de $299.900; la dueña averigua con su mensajería): hoy una prenda suelta no se puede pagar. El mercado de EE. UU. sigue Activo (informativo). |
| Dependencia exacta | Decisión SH-D2 (tarifa bajo $299.900: depende de la mensajería; ver «Opciones de mensajería» en theme/03J-owner-checkpoint-report.md). Debe ir ANTES que cualquier cambio de mercado. |
| ¿Claude puede hacer algo seguro hoy? | `PREP_DONE` — A1a ejecutado y verificado en 03J. Claude solo puede cargar la tarifa cuando la dueña decida SH-D2. |
| ¿La dueña es imprescindible? | `YES` — ACTION, DECISION, DATA |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | 03i-post-a1-verify.js (modo G1 tras la zona; modo AFTER al final) → A1_UNLOCKED; sonda 03i-checkout-probe.js + 03i-checkout-text-check.mjs --expect after-a1; T5-T7 y T10 en el checkout con la dueña. |
| Rollback / recuperación | Runbook de envío § 12: eliminar la zona/tarifas nuevas; reescribir la dirección capturada; nada es permanente si se sigue el orden (recrear a mano solo si se elimina la zona de EE. UU.). |
| Cubre | SH-D1, SH-D2, SH-D3, SH-D4, SH-D5, HP-16, HP-18, HP-21 · Compuertas: AC-01, AC-03, AC-22 |

### B1 — Pagos de prueba: pasarela de prueba de Shopify primero; Wompi (app oficial, llaves de prueba, URL de eventos) después, si aparece

| Campo | Valor |
|---|---|
| Estado actual | B1a HECHO en 03J (2026-09-30), dos veces: (1) con la entidad aún en EE. UU. y (2) DESPUÉS de alinear la entidad a Colombia, porque el cambio de entidad DESACTIVÓ la pasarela de prueba (había que reactivarla, con OK de la dueña) y cambió la lista de proveedores externos a la de Colombia. E2E con pasarela de prueba, 2 pedidos de prueba (#1001 reembolsado y #1002 pagado; COP 319.840, 2 prendas, envío estándar gratis): tarjeta 1 = pedido Pagado; tarjetas 2 y 3 = pago fallido sin pedido; reembolso total de #1001 = Reembolsado (pago neto 0; no repetido sobre #1002); correo de confirmación enviado por Shopify (llegada a la bandeja: sin confirmar); sin comisión visible. Evaluador = B1_E2E_VALIDATED_WITH_RECORDS. B1b (Wompi): NO aparece en la lista de proveedores externos, tampoco con entidad, dirección y sucursal en Colombia (la lista sí cambió con la entidad: filtra por país de la entidad); su vía por App Store no se exploró; no se instaló ni se pidió nada de Wompi. El estado actual de pagos: pasarela de prueba ACTIVA. |
| Dependencia exacta | A1a verificado (checkout es-co; cumplido en 03J). B1b (Wompi): hallar una vía de instalación, porque no aparece en la lista de proveedores externos ni con la entidad en Colombia (vía App Store de Wompi: NOT_VERIFIED), que la app permita conectar solo en modo prueba (G2) y resolver el conflicto de ambientes de la URL de eventos con el staging del pentest (G3). Bogus y Wompi no conviven: hay que desactivar uno para activar el otro. |
| ¿Claude puede hacer algo seguro hoy? | `PREP_DONE` — B1a ejecutado y verificado en 03J. Claude no instala apps, no escribe llaves ni datos de tarjeta (el número de tarjeta de prueba lo escribió la dueña) y su intento de escribir en el formulario de reembolso fue bloqueado por el clasificador: el reembolso lo pulsó la dueña. |
| ¿La dueña es imprescindible? | `YES` — ACTION, OAUTH, CREDENTIAL |
| ¿Qué bloquea? | `LAUNCH` — Salida: AC-04/05: si G1 o G2 de Wompi fallan, probar con la pasarela de prueba con el riesgo aceptado por escrito; AC-06: riesgo de 'pendiente' aceptado por escrito. |
| Verificación posterior | 03i-checkout-text-check.mjs --expect after-b1-testgateway\|after-b1-wompi; 03i-order-outcomes-check.mjs (casos T1-T3, TR, TC / W1-W6) → B1_E2E_VALIDATED[_WITH_RECORDS]; sin BLOCKING_RISK. |
| Rollback / recuperación | Desactivar el proveedor en Configuración > Pagos; cancelar/reembolsar pedidos de prueba; restaurar la URL de eventos de pruebas si fue la opción C de G3. |
| Cubre | PD8 · Compuertas: AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10 |

### A4 — OK para descargar 12 archivos del Cloudinary propio (~15,6 a 20,7 MB) y subirlos a Contenido > Archivos; luego cablear media, logo y favicon en un RC nuevo

| Campo | Valor |
|---|---|
| Estado actual | 0 archivos subidos; hero en variante de respaldo, 3 tarjetas de categoría con foto de producto y 'Salidas de Baño' sin imagen (contraste bajo, H-01). Logo y favicon: archivos locales en el repo, sin subir (settings.logo y favicon vacíos). |
| Dependencia exacta | OK explícito de descarga (nombre, origen y tamaño ya documentados). El cableado de logo/favicon exige RC nuevo (RC1.10), con su regresión, Theme Check y paridad remota. |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Todo el paquete está preparado (prepare-media-package.mjs, apply-media-wiring.mjs). Sin el OK no se descarga nada. |
| ¿La dueña es imprescindible? | `OK_ONLY` — OK |
| ¿Qué bloquea? | `LAUNCH` — Salida: AC-13: lanzar sin la media con decisión escrita (CT-12). |
| Verificación posterior | Home con media y colecciones con banner; sin imágenes rotas; hash del ZIP nuevo = remoto; H-01 resuelto por la imagen de M09. |
| Rollback / recuperación | apply-media-wiring.mjs --restore=<snapshot> y reponer el ZIP anterior. |
| Cubre | G04, G08, HP-02, HP-04, HP-05, PD13 · Compuertas: AC-13 |

### D5 — OK para respaldar el trabajo de migración: rama dedicada + copia fuera de esta máquina + copia local de las 95 fotos (solo subcarpetas de producto)

| Campo | Valor |
|---|---|
| Estado actual | shopify-migration/ no está versionado (git status: '?? shopify-migration/'); las 95 imágenes dependen del Cloudinary vivo; la carpeta OneDrive 'OASIS NATURAL' mezcla originales con archivos cuyo nombre indica códigos de recuperación (no se abren). |
| Dependencia exacta | OK de la dueña; para la copia de imágenes, además, que ella mueva los 2 .txt de códigos de recuperación a un gestor de credenciales (G21). |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Con el OK: commit en rama dedicada (sin scripts/node_modules, con dist/), etiqueta del freeze, manifiesto SHA-256. 03I no commitea nada fuera del handoff. |
| ¿La dueña es imprescindible? | `OK_ONLY` — OK |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | Manifiesto con hash de cada archivo, 108 filas sin faltantes; el repo clona limpio y las herramientas corren en la copia. |
| Rollback / recuperación | Borrar la rama y las copias locales. |
| Cubre | G21, G18 · Compuertas: AC-29 |

### G03 — El repo de migración no está versionado (los ZIP y ahora también theme-harness/ y las herramientas 03I viven solo en carpetas de esta máquina)

| Campo | Valor |
|---|---|
| Estado actual | CRÍTICO. `?? shopify-migration/`. 03I agregó theme-harness/ (G15) y herramientas nuevas, todo sin commit (regla de la fase: solo se sube el handoff). |
| Dependencia exacta | OK de D5. Resolver G18 (rutas absolutas de 2 herramientas de 03G) en el mismo commit. |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Se ejecuta con el OK de D5. |
| ¿La dueña es imprescindible? | `OK_ONLY` — OK |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | R11 y R12 de 03g-reproducibility-checks.mjs en PASS; clon limpio corre theme-harness (npm ci) y las herramientas. |
| Rollback / recuperación | Ninguno necesario (solo agrega una rama). |
| Cubre | — · Compuertas: — |

### D1 — Talla XL de alba-dorada-cafe-claro: ¿existe? (la Dev Store ofrece 98 variantes; el sitio actual muestra S, M y L)

| Campo | Valor |
|---|---|
| Estado actual | Diferencia F-01 de 03G sin causa demostrada; la hoja de inventario (03I) marca esa fila. |
| Dependencia exacta | Respuesta de la dueña (1 min). Eliminar la variante LG-AUR-000001-XL es irreversible: rompe SKU y enlaces. |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Con la respuesta, Claude ajusta y repite el rastreo y la paridad. |
| ¿La dueña es imprescindible? | `YES` — DECISION |
| ¿Qué bloquea? | `LAUNCH` — Salida: AC-12: decisión escrita sobre la XL y el inventario (CT-04). |
| Verificación posterior | 03g-product-parity.mjs y 03g-product-parity-verify.mjs con 98 o 97 variantes según la respuesta. |
| Rollback / recuperación | Recrear la variante (solo si se eliminó). |
| Cubre | G07, PD12 · Compuertas: AC-12 |

### D2 — Inventario: cantidades por variante (98) o decidir vender sin límite

| Campo | Valor |
|---|---|
| Estado actual | Ninguna fuente confirma stock (98/98 NOT_AVAILABLE); la Dev Store no rastrea inventario. NUEVO en 03I: import/inventory-template.csv (98 filas, cantidad_a_cargar vacía) lista para completar. |
| Dependencia exacta | Números de la dueña (o decisión escrita 'sin límite'); congelar pedidos en el sitio viejo durante la ventana de corte y cargar un snapshot final antes del DNS. |
| ¿Claude puede hacer algo seguro hoy? | `PREP_DONE` — Hoja generada y verificada (03i-build-inventory-template.mjs --check). Claude no inventa cantidades. El formato oficial de importación de inventario es NOT_VERIFIED y se convierte con la doc vigente al recibir la hoja completa. |
| ¿La dueña es imprescindible? | `YES` — DATA, DECISION |
| ¿Qué bloquea? | `LAUNCH` — Salida: Vender sin límite, por decisión escrita (AC-12). |
| Verificación posterior | 98/98 variantes con cantidad y seguimiento activado en una ubicación; checkout no vende de más (prueba de tope). |
| Rollback / recuperación | Desactivar el seguimiento de inventario. |
| Cubre | G02 · Compuertas: — |

### B2 — Legales: aprobar las 4 páginas pendientes (Privacidad, Términos, Envíos, Cookies) y entregar razón social, NIT y dirección

| Campo | Valor |
|---|---|
| Estado actual | 4 de 6 páginas pendientes; identidad legal NOT_AVAILABLE; menú 'Ayuda' incompleto; 4 redirecciones a agregar (51 en total). Un intento anterior de crear las páginas en el Admin fue rechazado por el clasificador de permisos: no se reintenta por otra vía. |
| Dependencia exacta | Aprobación de textos y datos legales de la dueña (LEGAL, DATA). Recuperar o archivar extract-legal-verbatim.cjs. |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Textos verbatim y verificación por hash listos; se pegan con la aprobación. |
| ¿La dueña es imprescindible? | `YES` — LEGAL, DATA, DECISION |
| ¿Qué bloquea? | `LAUNCH` — Salida: AC-15: renuncia escrita a una de las 4 legales. |
| Verificación posterior | 6/6 hashes de texto; redirects 200 (V-REDIR); enlaces en pie y checkout; política de privacidad no autogenerada (AC-16). |
| Rollback / recuperación | Despublicar la página. |
| Cubre | G09, HP-13, PD9, D-L2 · Compuertas: AC-14, AC-15, AC-16 |

### A2 — Código de ingreso de clienta (llega por correo; lo escribe ella)

| Campo | Valor |
|---|---|
| Estado actual | El login por código nunca se probó: DEFERRED_OWNER_ONLY_BLOCKER. Objeto customer sin sesión real. |
| Dependencia exacta | La dueña recibe y escribe el código (OTP). Claude nunca lo ve ni lo pide. |
| ¿Claude puede hacer algo seguro hoy? | `NONE` — Verifica cabecera, /account e incógnito solo DESPUÉS de que ella inicie sesión. |
| ¿La dueña es imprescindible? | `YES` — ACTION, CREDENTIAL |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | V-CUENTAS: cabecera con sesión, /account, cierre de sesión, incógnito. |
| Rollback / recuperación | Cerrar sesión. |
| Cubre | — · Compuertas: AC-17 |

### A3 — Instalar Search & Discovery (app oficial y gratuita; permisos OAuth)

| Campo | Valor |
|---|---|
| Estado actual | No instalada (solo Translate & Adapt); sin filtros de talla y color como el sitio actual. |
| Dependencia exacta | Aceptar permisos OAuth: solo la dueña (o Claude con su OK explícito por instalación). |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Con la app instalada, Claude configura Talla, Color y Precio (sin Disponibilidad) y corre la matriz de QA (45-60 min). |
| ¿La dueña es imprescindible? | `YES` — OAUTH |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | V-BÚSQUEDA: grupos Orden, Talla, Color y Precio; QA de la matriz. |
| Rollback / recuperación | Desinstalar la app. |
| Cubre | — · Compuertas: AC-20 |

### C1 — Meta description de la Home (texto de la dueña) y título con sufijo de marca

| Campo | Valor |
|---|---|
| Estado actual | Vacía (no se inventa). HP-11 y HP-23 son DIFFERENCE. |
| Dependencia exacta | Texto de la dueña. |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Se carga y se re-mide (og, JSON-LD, título). |
| ¿La dueña es imprescindible? | `YES` — DECISION, DATA |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | Matriz S16.b sobre el dominio real. |
| Rollback / recuperación | Vaciar el campo. |
| Cubre | HP-11, HP-23, PD17, G14 · Compuertas: AC-35 |

### C2 — 'Recomendado para vos': curar una colección o dejar la sección oculta

| Campo | Valor |
|---|---|
| Estado actual | Sección oculta y sin colección (HP-14 DIFFERENCE). |
| Dependencia exacta | Decisión de la dueña. |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Aplica la decisión. |
| ¿La dueña es imprescindible? | `YES` — DECISION |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | Home con o sin la vidriera, según la decisión. |
| Rollback / recuperación | Ocultar la sección. |
| Cubre | HP-14, PD20 · Compuertas: — |

### C3 — Voseo o tuteo para toda la interfaz (no solo los legales)

| Campo | Valor |
|---|---|
| Estado actual | Mezcla de ambos, heredada del sitio actual (HP-15 DIFFERENCE, 163 cadenas). |
| Dependencia exacta | Decisión de la dueña. |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Aplica en el locale (RC nuevo). |
| ¿La dueña es imprescindible? | `YES` — DECISION |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | Búsqueda de formas del otro registro en el locale y las plantillas. |
| Rollback / recuperación | Restaurar el locale anterior. |
| Cubre | HP-15 · Compuertas: — |

### C4 — Color de los botones blancos sobre arena (contraste 1,69:1, igual al sitio actual): texto oscuro, arena más oscuro o excepción firmada

| Campo | Valor |
|---|---|
| Estado actual | Accesibilidad AA con 1 excepción abierta. |
| Dependencia exacta | Decisión de la dueña. |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Aplica en el theme (RC nuevo) y repite el pase de contraste. |
| ¿La dueña es imprescindible? | `YES` — DECISION |
| ¿Qué bloquea? | `LAUNCH` — Salida: AC-23: cada excepción firmada por la dueña. |
| Verificación posterior | Pase de teclado y de contraste. |
| Rollback / recuperación | Restaurar el color anterior. |
| Cubre | — · Compuertas: AC-23 |

### C5 — Limpiar de la Tienda online las páginas y colecciones creadas por Shopify (/pages/contact en inglés, data-sharing-opt-out, colección 'Home page')

| Campo | Valor |
|---|---|
| Estado actual | Presentes en el sitemap. |
| Dependencia exacta | OK de la dueña (cambia contenido público). |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Ejecuta con OK. |
| ¿La dueña es imprescindible? | `OK_ONLY` — OK |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | Sitemap limpio; rutas 404 o redirigidas según la decisión. |
| Rollback / recuperación | Recrear la página. |
| Cubre | — · Compuertas: — |

### C6 — Orden de las colecciones y de 'Destacados': aceptar el de la Dev Store o igualar al del sitio actual

| Campo | Valor |
|---|---|
| Estado actual | 6 de 8 productos en común en la editorial y 0 de 8 posiciones (HP-06 DIFFERENCE). |
| Dependencia exacta | Decisión de la dueña (listas exactas en launch/03G-collection-parity.md C-02). |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Reordena en el Admin con OK y recaptura. |
| ¿La dueña es imprescindible? | `YES` — DECISION |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | 03g-collection-parity.mjs con la tabla T2 en IGUAL. |
| Rollback / recuperación | Reponer el orden previo (dev-collections.json). |
| Cubre | HP-06, G12 · Compuertas: AC-12 |

### C7 — Selector COP/USD del encabezado del sitio actual: ¿se conserva? ¿Las redes van también en la cabecera?

| Campo | Valor |
|---|---|
| Estado actual | Sin selector ni redes en la cabecera (HP-10 DIFFERENCE). Con un solo mercado en COP puede no hacer falta. |
| Dependencia exacta | Decisión de la dueña; conservar USD exige mercado y moneda en Shopify. |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Aplica en el theme si decide que sí. |
| ¿La dueña es imprescindible? | `YES` — DECISION |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | Cabecera a 320/390/768/1440. |
| Rollback / recuperación | Quitar el bloque. |
| Cubre | HP-10 · Compuertas: — |

### C8 — Inglés (/en): despublicarlo o traducirlo

| Campo | Valor |
|---|---|
| Estado actual | URLs en inglés con textos en español dentro del sitemap (HP-12 DIFFERENCE); hreflang x-default, es, en. |
| Dependencia exacta | Decisión de la dueña; traducir exige Translate & Adapt. |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Aplica la decisión y re-mide hreflang. |
| ¿La dueña es imprescindible? | `YES` — DECISION |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | V7 y V8 del runbook de mercado (03i-post-a1-verify C09 cubre / y /en). |
| Rollback / recuperación | Publicar de nuevo el idioma. |
| Cubre | HP-12, PD7 · Compuertas: — |

### D3 — Datos de clientas del sitio actual: decidir qué se migra o se archiva (clientas y direcciones, pedidos históricos, cupones y descuentos, suscriptores del newsletter, blog)

| Campo | Valor |
|---|---|
| Estado actual | CRÍTICO (G01). Viven solo en Postgres; el script de exportación no cubre User, Address, Order ni newsletter y nunca se corrió. Las contraseñas no se pueden importar (las clientas entrarían por código). El −20 % es un precio (compare-at), no una regla. |
| Dependencia exacta | Decisión por dominio de la dueña; luego exportación de solo lectura con un rol propio de Neon (fuera de alcance mientras no lo autorice). |
| ¿Claude puede hacer algo seguro hoy? | `NONE` — Sin acceso ni permiso a Neon ni a datos de clientas; no se consulta la base. |
| ¿La dueña es imprescindible? | `YES` — DECISION, DATA |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | Tabla C de la auditoría de brechas cerrada; conteos de migración = conteos de origen. |
| Rollback / recuperación | Los datos del sitio actual se conservan intactos hasta D18. |
| Cubre | G01, G11, HP-19, PD11, PD15, PD19 · Compuertas: — |

### D4 — Tienda comercial, dominio y corte: nueva o convertir la Dev Store; plan y facturación; nombre; español como idioma predeterminado desde el primer día; proveedor de DNS y acceso; ventana de corte y quién la ejecuta; retiro del sitio actual

| Campo | Valor |
|---|---|
| Estado actual | NOT_AVAILABLE: proveedor de DNS, registros, ventana y plan. País, moneda e idioma base de la tienda comercial son irreversibles en la práctica (condicionan pagos, impuestos y reescriben themes). Rollback y checklist de cutover: escritos, sin capturas SR ni umbrales DR. NUEVO en 03J (Admin, 2026-09-30): el Admin indica que la Dev Store NO se puede transferir («es una tienda en desarrollo creada para pruebas»), así que la tienda comercial será una tienda nueva; y la entidad comercial (persona física, Colombia) se definió en la Dev Store a partir de los datos personales de la dueña: en la tienda comercial habrá que elegir de nuevo el tipo de entidad (persona física o empresa) y sus datos legales. |
| Dependencia exacta | Decisiones y datos de la dueña; contraseña de la tienda se retira solo dentro de la ventana de corte. |
| ¿Claude puede hacer algo seguro hoy? | `NONE` — Los runbooks de corte, de vuelta atrás y de monitoreo están escritos y verificados (47/47 controles). Nada que ejecutar sin credenciales de DNS ni tienda comercial. |
| ¿La dueña es imprescindible? | `YES` — DECISION, DATA, IRREVERSIBLE, CREDENTIAL |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | V-DNS y V-SSL; CT-07 (T-24h) y CT-72 (T+15m); capturas SR-01 a SR-12 y umbrales DR completos. |
| Rollback / recuperación | launch/03G-rollback-plan.md: volver a apuntar el DNS a Vercel (solo si el sitio viejo sigue vivo); no se retiran visitas, pedidos ni URLs servidas entre medias. |
| Cubre | G06, G16, PD6, PD16, PD18 · Compuertas: AC-28, AC-30, AC-32 |

### A5 — App de favoritos de cuenta: cuenta de desarrolladora, distribución personalizada (irreversible), instalar aceptando permisos, elegir dónde vive el backend

| Campo | Valor |
|---|---|
| Estado actual | App 0.1.2 lista (156/156 pruebas, 20/20 mutantes); sin instalar; `wishlist_account_sync` apagado. Favoritos de invitada funcionan en el theme. |
| Dependencia exacta | Decisiones D1-D4 del runbook de favoritos y cuenta de desarrolladora; una app por tienda. |
| ¿Claude puede hacer algo seguro hoy? | `NONE` — Sin cuenta de desarrolladora ni hosting elegido; la distribución custom es irreversible y queda atada a la tienda. |
| ¿La dueña es imprescindible? | `YES` — ACTION, OAUTH, IRREVERSIBLE, DECISION |
| ¿Qué bloquea? | `FEATURE` — Salida: AC-19: lanzar 'solo invitada' con wishlist_account_sync en false (D-CT10 = no). |
| Verificación posterior | GO/NO-GO 1 a 15 y W1 del runbook de favoritos. |
| Rollback / recuperación | Interruptores por niveles (app/OWNER-WORKFLOW.md § 5). |
| Cubre | G10, PD14 · Compuertas: AC-19 |

### B3 — Analítica: ID de medición de GA4, dataset de Meta e instalar las apps oficiales (OAuth)

| Campo | Valor |
|---|---|
| Estado actual | Sin conectar. Solo tiene sentido después de A1 y B1. |
| Dependencia exacta | IDs y OAuth de la dueña; decidir arquitectura y nivel de datos de Meta (D10 del plan); banner/consentimiento (HP-17). |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Verifica cada evento y la no duplicación tras la conexión. |
| ¿La dueña es imprescindible? | `YES` — OAUTH, DATA, DECISION |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | V-ANALÍTICA: 11 eventos GA4 y 7 de Meta una vez por acción; consentimiento; sin duplicación. |
| Rollback / recuperación | Desinstalar las apps y quitar el píxel. |
| Cubre | HP-17, PD10 · Compuertas: AC-34 |

### B4 — Publicar (al final): dominio, español principal, plantilla page.wishlist en Favoritos, redirecciones de la tienda comercial, remitente de correos, quitar la contraseña y apagar el sitio Next.js en la ventana de corte

| Campo | Valor |
|---|---|
| Estado actual | No se publicó nada; Horizon sigue como theme publicado; Radaelli sin publicar; contraseña de la tienda activa. |
| Dependencia exacta | Todo lo anterior en verde en la tienda comercial. Publicar el theme y cambiar el DNS son irreversibles en sus efectos. |
| ¿Claude puede hacer algo seguro hoy? | `NONE` — Ni publicar, ni DNS, ni retirar la contraseña son acciones de Claude. |
| ¿La dueña es imprescindible? | `YES` — ACTION, IRREVERSIBLE, CREDENTIAL |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | curl -I de las redirecciones, matriz final S16.b, 'Liquid error' y consola. |
| Rollback / recuperación | launch/03G-rollback-plan.md. |
| Cubre | — · Compuertas: AC-31, AC-33 |

### E1 — Correo de marketing y boletín (plataforma) y aviso 'Avísame' de reposición

| Campo | Valor |
|---|---|
| Estado actual | Decisión documentada en el plan (D20, D11) y NO incluida en el lote de 03F. |
| Dependencia exacta | Decisión de la dueña (plataforma y qué se migra). |
| ¿Claude puede hacer algo seguro hoy? | `NONE` — Sin decisión no hay nada que preparar. |
| ¿La dueña es imprescindible? | `YES` — DECISION |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | Notificaciones nativas revisadas; formulario del boletín probado. |
| Rollback / recuperación | Desactivar el formulario. |
| Cubre | PD20 · Compuertas: — |

### HP-01 — El nombre 'Radaelli Swimwear Dev' sale en título, og:site_name, logo de texto, pie y copyright

| Campo | Valor |
|---|---|
| Estado actual | BLOCKER de la paridad de Home: todo lo indexable y la primera pantalla dicen 'Dev'. |
| Dependencia exacta | Renombrar la tienda a 'Radaelli Swimwear' al lanzar (ajuste de cuenta: solo la dueña, con OK). |
| ¿Claude puede hacer algo seguro hoy? | `NONE` — El theme ya usa brand_name/pie; el nombre de la tienda es un ajuste del Admin. |
| ¿La dueña es imprescindible? | `YES` — ACTION |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | Título, og:site_name, cabecera y pie sin 'Dev'. |
| Rollback / recuperación | Volver al nombre anterior. |
| Cubre | — · Compuertas: AC-35 |

### H-01 — Tarjeta de categoría sin imagen ('Salidas de Baño') con contraste bajo (≈ 2,9:1 en el título)

| Campo | Valor |
|---|---|
| Estado actual | Hallazgo del barrido responsive; opcional. Se resuelve con la imagen de M09 (A4), sin código. |
| Dependencia exacta | A4. Si la dueña decidiera lanzar sin esa imagen: ajuste de theme (RC nuevo). |
| ¿Claude puede hacer algo seguro hoy? | `NONE` — 03I no cambia el theme (RC1.9 se mantiene); esperar el resultado de A4 antes de tocar código. |
| ¿La dueña es imprescindible? | `NO` |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | Contraste ≥ 4,5:1 en la tarjeta 4 (con imagen o con el ajuste). |
| Rollback / recuperación | Restaurar el RC anterior. |
| Cubre | — · Compuertas: AC-23 |

### G15 — El arnés de regresión del theme no estaba en el repo

| Campo | Valor |
|---|---|
| Estado actual | CERRADO en 03I: shopify-migration/theme-harness/ (server, 80 pruebas, generador de 65 mutantes, README, lockfile); tests.js idéntico byte a byte; 6/6 PASS del bloque 03H y mutante 52 detectado desde la ubicación nueva. Los mutantes de píxel de 02M/03B NO se reubicaron (documentado). |
| Dependencia exacta | Ninguna. Queda sin versionar hasta G03. |
| ¿Claude puede hacer algo seguro hoy? | `DONE_03I` — Ver theme-harness/README.md. |
| ¿La dueña es imprescindible? | `NO` |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | cd theme-harness && npm ci && node server.js → /__rc/runner: 80/80. |
| Rollback / recuperación | Ninguno. |
| Cubre | — · Compuertas: — |

### REL-01 — Congelar el RC final (hash exacto y manifiesto) para el lanzamiento

| Campo | Valor |
|---|---|
| Estado actual | El RC vigente es RC1.9 (fa68a9a9…533c; 96 archivos; remoto = ZIP). La compuerta AC-27 en 03G quedó PASS para RC1.8 (histórica) y 03g-release-freeze.mjs y 03g-check-acceptance-checklist.mjs siguen fijos en RC1.8: en 03I ese verificador da 32/33 (su control C27, «theme-src coincide con el manifiesto RC1.8», falla por diseño desde que 03H produjo RC1.9). Comprobado hoy, de solo lectura: theme-src = manifiesto RC1.9 (96/96, sin archivos de más) y el ZIP conserva fa68a9a9…533c. |
| Dependencia exacta | El RC final se conoce solo después de A4 (logo/favicon → RC1.10), A1 (cerrojo de envío) y las decisiones C. |
| ¿Claude puede hacer algo seguro hoy? | `DEFERRED` — **Por qué se difiere:** Congelar RC1.9 ahora se rehace en cuanto A4/A1 cambien el theme; hacerlo una sola vez sobre el RC final. |
| ¿La dueña es imprescindible? | `NO` |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | SHA-256 del ZIP = manifiesto = remoto; Theme Check 0/0; regresión completa. |
| Rollback / recuperación | Ninguno. |
| Cubre | — · Compuertas: AC-27 |

### VAL-01 — Mediciones 'NOT YET EXECUTED' que se corren una sola vez sobre el RC final: barrido de fichas y media (AC-13), favoritos de invitada (AC-18), búsqueda con país CO (AC-21), rendimiento (AC-24), consola JS (AC-25), 'Liquid error' en las 29 fichas (AC-26)

| Campo | Valor |
|---|---|
| Estado actual | Sin ejecutar. 03I prohíbe rastreos amplios; AC-21 y AC-22 dependen de A1; AC-13 de A4; AC-24/AC-25 necesitan ventana visible o URL pública. |
| Dependencia exacta | RC final (A4, A1, C) y, para AC-24, una URL pública o una ventana visible. |
| ¿Claude puede hacer algo seguro hoy? | `DEFERRED` — **Por qué se difiere:** Medir sobre RC1.9 se repite tras el RC final; una medición única y válida evita 429 y trabajo doble. |
| ¿La dueña es imprescindible? | `NO` |
| ¿Qué bloquea? | `LAUNCH` |
| Verificación posterior | Ver cada compuerta en launch/03G-launch-acceptance-checklist.md. |
| Rollback / recuperación | Solo lectura. |
| Cubre | — · Compuertas: AC-13, AC-18, AC-21, AC-24, AC-25, AC-26 |

### HYG-01 — Reproducibilidad de la evidencia de la Dev Store: especificación ejecutable del estado del Admin y verificador (G05), CSV consolidado de imágenes (G13), capturador de solo lectura de dev-*.json (G19)

| Campo | Valor |
|---|---|
| Estado actual | Documentado en la auditoría de brechas; ninguna fase lo consume todavía. |
| Dependencia exacta | Sus salidas se usan al crear la tienda comercial (después de D4/A1) y en el congelamiento. |
| ¿Claude puede hacer algo seguro hoy? | `DEFERRED` — **Por qué se difiere:** Seguro e independiente, pero no acorta ni desbloquea el lote de la dueña; su valor aparece en la migración a la tienda comercial. Se puede ordenar como fase de higiene si ChatGPT lo pide. |
| ¿La dueña es imprescindible? | `NO` |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | R05, R21 y validadores de la auditoría de brechas. |
| Rollback / recuperación | Volver a los archivos actuales. |
| Cubre | G05, G13, G19 · Compuertas: — |

### HYG-02 — Higiene que modifica evidencia o documentos ya aprobados: rutas absolutas de 2 herramientas de 03G (G18), documentos desactualizados que pueden llevar a importar el archivo equivocado (G17), generated_at en catalog-snapshot.json (G20)

| Campo | Valor |
|---|---|
| Estado actual | Documentado; cambiarlos exige el OK de la dueña porque son herramientas ya usadas como evidencia. |
| Dependencia exacta | OK de la dueña y, para G18, el mismo commit que G03. |
| ¿Claude puede hacer algo seguro hoy? | `AFTER_OK` — Se ejecuta junto con G03. |
| ¿La dueña es imprescindible? | `OK_ONLY` — OK |
| ¿Qué bloquea? | `DEFERRABLE` |
| Verificación posterior | R19 y R02 sin ítems; herramientas corren en la copia limpia. |
| Rollback / recuperación | Restaurar el texto o el script anterior. |
| Cubre | G17, G20 · Compuertas: — |

### GAP-CLOSED — Brechas de la auditoría cubiertas por filas propias (referencia cruzada)

| Campo | Valor |
|---|---|
| Estado actual | G01→D3, G02→D2, G03→G03, G04→A4/D5, G05→HYG-01, G06→D4, G07→D1, G08→A4, G09→B2, G10→A5, G11→D3, G12→C6, G13→HYG-01, G14→C1/B2, G15→G15, G16→D4, G17/G18/G20→HYG-02, G19→HYG-01, G21→D5. |
| Dependencia exacta | — |
| ¿Claude puede hacer algo seguro hoy? | `NONE` — Fila de trazabilidad, sin trabajo propio. |
| ¿La dueña es imprescindible? | `NO` |
| ¿Qué bloquea? | `OPTIONAL` |
| Verificación posterior | 03i-blocker-matrix.mjs comprueba que ninguna brecha queda sin fila. |
| Rollback / recuperación | — |
| Cubre | — · Compuertas: — |
