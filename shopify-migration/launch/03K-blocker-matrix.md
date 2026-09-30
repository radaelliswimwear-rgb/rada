# 03K — Matriz de bloqueos reclasificada (mínimo de la dueña)

*Generada por `launch/tools/03k-blocker-classify.mjs` desde `launch/03K-blocker-classification.json` (fuente única) y `launch/03I-blocker-matrix.json`. No editar a mano: editar el JSON y volver a generar.*

## 1. Resultado

- Filas: **32** (las mismas 32 de 03I), cada una en exactamente **una** categoría.
- **Bloquean el lanzamiento y siguen abiertas: 16** (A1, B1, A4, D1, D2, B2, A2, A3, C4, D3, D4, B3, B4, HP-01, REL-01, VAL-01); las otras 2 que bloqueaban (D5 y G03, el respaldo) quedaron **DONE** en 03K.
- Ningún ítem de la tabla depende de trabajo autónomo que Claude aún pueda hacer: lo que queda es de la dueña, de la tienda final o del corte.

| Categoría | Filas | Ids |
|---|---:|---|
| **DONE** | 5 | D5, G03, H-01, G15, GAP-CLOSED |
| **FINAL-STORE ONLY** | 5 | A1, B1, C5, HP-01, VAL-01 |
| **OWNER DECISION** | 4 | D1, D2, C4, D3 |
| **OWNER AUTH/OAUTH** | 4 | A4, A2, A3, B3 |
| **BILLING/PLAN** | 1 | D4 |
| **LEGAL DATA** | 1 | B2 |
| **FINAL CUTOVER** | 2 | B4, REL-01 |
| **OPTIONAL/DEFERRABLE** | 10 | C1, C2, C3, C6, C7, C8, A5, E1, HYG-01, HYG-02 |
| **Total** | **32** | |

Leyenda:

- **DONE**: Hecho y verificado; no queda nada por hacer.
- **FINAL-STORE ONLY**: Solo se puede hacer o verificar en la tienda comercial final; el procedimiento y las herramientas ya están listos (launch/03K-clean-store-bootstrap-runbook.md).
- **OWNER DECISION**: Una decisión de negocio de la dueña; nadie más la puede tomar.
- **OWNER AUTH/OAUTH**: Un permiso, una autorización OAuth, una credencial o un código que solo ella puede dar o escribir.
- **BILLING/PLAN**: Plan de Shopify, facturación o compromiso de pago.
- **LEGAL DATA**: Datos o aprobación legal (razón social, NIT, dirección, textos).
- **FINAL CUTOVER**: Acción irreversible o de la ventana de corte (DNS, publicar, congelar el RC final).
- **OPTIONAL/DEFERRABLE**: Se puede lanzar sin esto; afecta calidad o una función, no la operación.

## 2. Lote mínimo de la dueña (consolidado, en orden)

Una sola lista, agrupada por momento. Nada de esto se le pide antes de que ella regrese y decida empezar.

| # | Cuándo | Qué | Ids |
|---:|---|---|---|
| 1 | Antes de crear la tienda final | (03L: la tienda de lanzamiento ya está creada.) Nombre comercial real de la tienda (que reemplaza a «Colombia Launch»), plan de Shopify y facturación al transferirla. | D4, HP-01 |
| 2 | Antes de crear la tienda final | Aprobar los 4 textos legales pendientes y entregar razón social, NIT y dirección legal. | B2 |
| 3 | Antes de importar el catálogo | Talla XL sí o no, y cantidades de inventario (98) o decisión escrita de vender sin límite. | D1, D2 |
| 4 | Antes de importar el catálogo | Qué datos de clientas, pedidos, cupones, suscriptores y blog se migran y cuáles se archivan. | D3 |
| 5 | Antes de publicar el theme | Elegir una de las tres opciones de contraste de los botones (o firmar la excepción). | C4 |
| 6 | Con la tienda final creada | SH-D2: tarifa bajo $299.900 (importe fijo en COP o cálculo en vivo). | A1 |
| 7 | Con la tienda final creada | Instalar Wompi (integración oficial) y escribir ella las llaves de prueba; producción solo con su aprobación. | B1 |
| 8 | Con la tienda final creada | Instalar Search & Discovery y las apps de analítica (OAuth, IDs) y escribir el código de ingreso de clienta cuando se pruebe. | A3, B3, A2 |
| 9 | Con la tienda final creada | OK para descargar 12 archivos (~15,6 a 20,7 MB) y subirlos a Contenido > Archivos. | A4 |
| 10 | En la ventana de corte | DNS, publicar, quitar la contraseña y apagar el sitio actual. | B4 |

**Respuesta mínima suelta (AC-08):** ¿Llegó a tu bandeja o a spam el correo de confirmación del pedido #1001? (YES / NO / NOT_FOUND)

Fuera del lote (opcionales o diferibles, no bloquean): C1, C2, C3, C6, C7, C8, A5, E1, HYG-01, HYG-02.

## 3. Detalle por fila

| Id | Categoría | También | ¿Bloquea el lanzamiento? | Estado tras 03K | Qué necesita de la dueña |
|---|---|---|---|---|---|
| **A1** | FINAL-STORE ONLY | BILLING/PLAN, OWNER DECISION | Sí | A1a (sucursal, zona Colombia 33/33, envío gratis desde $299.900) y alineación de la entidad a Colombia HECHOS y verificados en la Dev Store (03J). Lo que falta es la tarifa por debajo de $299.900 (SH-D2): cálculo en vivo con mensajería o tarifa fija; ambas dependen de la tienda final y su plan. No se instala ni contrata nada en la Dev Store. | SH-D2: tarifa bajo $299.900 (un importe fijo en COP o cálculo en vivo con una mensajería y un plan que lo permita), cuando exista la tienda final. |
| **B1** | FINAL-STORE ONLY | OWNER AUTH/OAUTH | Sí | B1a (pasarela de prueba de Shopify) HECHO dos veces en la Dev Store: pedido pagado, pago rechazado y falla sin pedido, reembolso. Wompi: NO aparece en la lista de proveedores de la Dev Store; se prueba en modo prueba en la tienda final y solo después, con aprobación de la dueña, en producción. | Instalar la integración oficial de Wompi en la tienda final y escribir ella las llaves de prueba en la pantalla oficial; producción solo con su aprobación. |
| **A4** | OWNER AUTH/OAUTH | — | Sí | Paquete de media listo (prepare-media-package.mjs, apply-media-wiring.mjs). Sin el OK de descarga no se baja nada. | OK para descargar 12 archivos del Cloudinary propio (~15,6 a 20,7 MB) y subirlos a Contenido > Archivos. |
| **D5** | DONE | — | No (hecho) | Rama dedicada de respaldo creada y verificada en el remoto (sin secretos, sin PII, sin tocar main, sin PR). | — |
| **G03** | DONE | — | No (hecho) | El repo de migración ya está versionado en la rama shopify-migration-backup (BACKUP-MANIFEST.json con SHA-256 por archivo). | — |
| **D1** | OWNER DECISION | — | Sí | Marcador explícito import/xl-decision.json = PENDING_OWNER; nada se elimina ni se decide solo. | Talla XL de alba-dorada-cafe-claro: ¿existe (98 variantes) o no (97)? |
| **D2** | OWNER DECISION | — | Sí | Hoja import/inventory-template.csv lista (98 filas, sin cantidades inventadas). | Cantidades por variante (98) o decisión escrita de vender sin límite. |
| **B2** | LEGAL DATA | OWNER DECISION | Sí | Los 6 HTML legales con texto verbatim del sitio actual y hash; content/legal/owner-fields.json con razón social, NIT y dirección en PENDING_OWNER (no se inventan). Redirecciones legales listas (51). | Aprobar los 4 textos pendientes (Privacidad, Términos, Envíos, Cookies) y entregar razón social, NIT y dirección legal. |
| **A2** | OWNER AUTH/OAUTH | — | Sí | Solo aplica al probar cuentas de clienta; el código llega por correo y lo escribe ella. | Escribir el código de ingreso de clienta cuando se pruebe el registro. |
| **A3** | OWNER AUTH/OAUTH | FINAL-STORE ONLY | Sí | Runbook de Search & Discovery listo (theme/03F-search-discovery-owner-runbook.md). | Instalar la app oficial y gratuita Search & Discovery (permisos OAuth) en la tienda final. |
| **C1** | OPTIONAL/DEFERRABLE | OWNER DECISION | No | Valores del sitio actual propuestos en seo/03K-home-seo-values.json (título y meta descripción); solo falta el sí de la dueña y la carga en Preferencias. | Un sí o un no a cada valor propuesto (opcional: no bloquea). |
| **C2** | OPTIONAL/DEFERRABLE | OWNER DECISION | No | La sección 'Recomendado para vos' puede quedar oculta. | — |
| **C3** | OPTIONAL/DEFERRABLE | OWNER DECISION | No | Voseo o tuteo de la interfaz; hoy conviven. | — |
| **C4** | OWNER DECISION | — | Sí | Botones blancos sobre arena (1,69:1, igual al sitio actual). Tres opciones documentadas: texto oscuro, arena más oscuro o excepción firmada. | Elegir una de las tres opciones de contraste de los botones (o firmar la excepción). |
| **C5** | FINAL-STORE ONLY | — | No | Limpieza de páginas y colecciones que crea Shopify por defecto (contacto en inglés, data-sharing-opt-out, colección 'Home page'); se repite en la tienda final (runbook P05 y P06). | — |
| **C6** | OPTIONAL/DEFERRABLE | OWNER DECISION | No | Orden de colecciones y de Destacados; hoy el de la Dev Store. | — |
| **C7** | OPTIONAL/DEFERRABLE | OWNER DECISION | No | Selector COP/USD y redes en el encabezado: se decide o se registra como no migrado. | — |
| **C8** | OPTIONAL/DEFERRABLE | OWNER DECISION | No | Inglés (/en): despublicar o traducir. | — |
| **D3** | OWNER DECISION | — | Sí | No hay datos de clientas en el repositorio ni se tocan. | Qué se migra y qué se archiva del sitio actual: clientas y direcciones, pedidos históricos, cupones, suscriptores, blog. |
| **D4** | BILLING/PLAN | OWNER DECISION, FINAL CUTOVER, OWNER AUTH/OAUTH | Sí | Actualizado en 03L: la tienda de lanzamiento YA EXISTE (Client Transfer Store «Radaelli Swimwear Colombia Launch», país Colombia, sin transferir y sin plan de pago) y ya recibió el paquete (paridad 8/8). Las dos Dev Stores quedan como sandbox de QA. Falta solo lo que exige a la dueña: nombre comercial real, transferencia y plan al transferir, facturación, DNS y ventana de corte (runbook P13). | Nombre real de la tienda, plan de Shopify y facturación al transferir la tienda, proveedor de DNS y acceso, ventana de corte y quién la ejecuta. |
| **A5** | OPTIONAL/DEFERRABLE | OWNER AUTH/OAUTH | Solo una función | App de favoritos de cuenta: 156 pruebas y 20/20 mutantes; sin ella los favoritos de invitado siguen funcionando. Requiere cuenta de desarrolladora, distribución personalizada (irreversible) e instalación con OAuth. | — |
| **B3** | OWNER AUTH/OAUTH | FINAL-STORE ONLY | Sí | Plan, runbook y matriz de verificación listos (analytics/03K-final-store-event-verification.md); custom pixel apagado. | ID de medición de GA4, dataset de Meta e instalar las apps oficiales (OAuth) en la tienda final pública. |
| **B4** | FINAL CUTOVER | OWNER AUTH/OAUTH | Sí | Runbook P13 a P15 listo. | Dominio, publicar el theme, quitar la contraseña y apagar el sitio actual en la ventana de corte. |
| **E1** | OPTIONAL/DEFERRABLE | OWNER DECISION | No | Plataforma de correo de marketing y aviso 'Avísame': ninguna se crea ni se conecta. | — |
| **HP-01** | FINAL-STORE ONLY | — | Sí | El nombre 'Radaelli Swimwear Dev' desaparece al crear la tienda final con su nombre real; el theme no lo escribe a mano. | — |
| **H-01** | DONE | — | No (hecho) | Resuelto en RC1.10: la tarjeta de categoría sin imagen tiene fondo oscuro y contraste 17,9:1 (título) y 11,7:1 (descripción); prueba de regresión y mutante 73. | — |
| **G15** | DONE | — | No (hecho) | El arnés de regresión vive en theme-harness/ y está en la rama de respaldo. | — |
| **REL-01** | FINAL CUTOVER | — | Sí | Congelar el RC final (hash y manifiesto) se hace una sola vez, con el theme que se publique: runbook P14. | — |
| **VAL-01** | FINAL-STORE ONLY | — | Sí | Mediciones de la checklist que se corren una sola vez sobre el RC final en la tienda final: launch/tools/03k-surface-check.js y el checkout con Wompi. | — |
| **HYG-01** | OPTIONAL/DEFERRABLE | — | No | Especificación ejecutable de la evidencia de la Dev Store: launch/tools/03k-surface-check.js cubre las superficies; el resto es trazabilidad. | — |
| **HYG-02** | OPTIONAL/DEFERRABLE | — | No | Rutas absolutas en herramientas y evidencia ya aprobadas; se corrigen al reproducir en la tienda final (no cambia resultados). | — |
| **GAP-CLOSED** | DONE | — | No (hecho) | Referencia cruzada de brechas cubiertas por filas propias. | — |
