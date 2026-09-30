# 03O — Matriz de bloqueos (8 categorías)

*Generada por `launch/tools/03o-blocker-matrix.mjs` (sobre 03m y 03n).json` + las correcciones de 03M (fuente única en la herramienta). No editar a mano.*

## 1. Resultado

- Filas: **41** (32 de 03I + 9 nuevas de 03M/03N).

| Categoría | Filas | Ids |
|---|---:|---|
| **DONE** | 17 | B1, D5, G03, D1, D2, B2, A3, HP-01, H-01, G15, GAP-CLOSED, N-02, N-04, N-06, N-07, N-08, N-09 |
| **POST-TRANSFER REQUIRED** | 5 | A1, D3, N-01, N-03, N-05 |
| **OWNER FACT/DATA** | 0 | — |
| **OWNER DECISION** | 0 | — |
| **OWNER AUTH/OAUTH** | 3 | A4, A2, B3 |
| **BILLING/PLAN** | 1 | D4 |
| **FINAL CUTOVER** | 3 | B4, REL-01, VAL-01 |
| **OPTIONAL/DEFERRABLE** | 12 | C1, C2, C3, C4, C5, C6, C7, C8, A5, E1, HYG-01, HYG-02 |
| **Total** | **41** | |

Leyenda:

- **DONE**: Hecho y verificado; ya no depende de nadie.
- **POST-TRANSFER REQUIRED**: Solo se puede hacer o comprobar cuando la tienda ya esté transferida a la dueña y con plan (o cuando Shopify o el proveedor lo habiliten).
- **OWNER FACT/DATA**: Un dato que solo la dueña conoce (razón social, NIT, dirección legal, pesos, cantidades).
- **OWNER DECISION**: Una elección de la dueña (sí/no o una de varias opciones).
- **OWNER AUTH/OAUTH**: Una autorización, ingreso a una cuenta o llave que solo la dueña puede dar.
- **BILLING/PLAN**: Plan de Shopify, facturación o costos.
- **FINAL CUTOVER**: Se hace una sola vez el día del corte (publicar, dominio).
- **OPTIONAL/DEFERRABLE**: No bloquea el lanzamiento; se decide o se hace cuando se pueda.

## 2. Detalle por fila

| Id | Categoría | También | Estado tras 03O | Qué necesita de la dueña |
|---|---|---|---|---|
| **A1** | POST-TRANSFER REQUIRED | BILLING/PLAN | Regla de la dueña ya decidida: subtotal ≥ COP 299.900 = envío gratis (PASS); por debajo, el cliente paga el envío REAL calculado (no una tarifa fija). Peso 500 g en las 98 variantes y paquete 15×10×5 cm cargados; la app de Envia está vinculada pero la tarifa en vivo aún no aparece (plan/CCS). Hoy un pedido bajo COP 299.900 no tiene método de envío. Se resuelve tras transferir y elegir un plan que admita CCS de terceros. | Al elegir plan: uno que admita envío calculado por transportista de terceros (ver runbook 03P). |
| **B1** | DONE | — | Wompi (ruta oficial A, proveedor «Wompi Pagos» de Wompi Co) INSTALADO y en MODO PRUEBA en la tienda de lanzamiento: la instalación directa sí funciona en una Client Transfer Store (no era «no disponible»; solo faltaba usar el enlace oficial). Checkout de prueba de punta a punta: pedido #1002, COP 367.840, envío gratis, pagado con el sandbox de Wompi, confirmación y pedido creado (archivado después). Las llaves las escribió la dueña directamente; no se leyeron ni se guardaron. Ruta B («Wompi Tarjetas»): ficha existente y gratuita, no instalada a propósito (Wompi pide configurar primero la tradicional). | Cuando Wompi sea instalable: instalar la integración oficial y escribir ella las llaves de PRUEBA en la pantalla oficial; producción solo con su aprobación. |
| **A4** | OWNER AUTH/OAUTH | — | Paquete de media listo (prepare-media-package.mjs, apply-media-wiring.mjs). Sin el OK de descarga no se baja nada. | OK para descargar 12 archivos del Cloudinary propio (~15,6 a 20,7 MB) y subirlos a Contenido > Archivos. |
| **D5** | DONE | — | Rama dedicada de respaldo creada y verificada en el remoto (sin secretos, sin PII, sin tocar main, sin PR). | — |
| **G03** | DONE | — | El repo de migración ya está versionado en la rama shopify-migration-backup (BACKUP-MANIFEST.json con SHA-256 por archivo). | — |
| **D1** | DONE | — | Talla XL de alba-dorada-cafe-claro: CONSERVAR (decisión de la dueña, 2026-09-30). Catálogo 98/98 variantes; parity 8/8. | — |
| **D2** | DONE | — | Inventario cargado con seguimiento en las 98 variantes y 128 unidades (Oasis Natural S2/M3/L1 por producto; resto 1 por talla como estándar provisional de la dueña). Verificado 98/98 contra la hoja aprobada. | — |
| **B2** | DONE | — | Los 4 textos legales (Privacidad, Términos, Envíos, Cookies) APROBADOS COMO ESTÁN por la dueña y publicados en la tienda privada; 0 redirecciones legales en 404; menú Ayuda con 6 ítems. No se publicó razón social, NIT ni dirección (no dados; el texto no los exige). La política de privacidad de Shopify (plantilla en inglés) fue reemplazada por el texto aprobado. | — |
| **A2** | OWNER AUTH/OAUTH | — | Solo aplica al probar cuentas de clienta; el código llega por correo y lo escribe ella. | Escribir el código de ingreso de clienta cuando se pruebe el registro. |
| **A3** | DONE | — | Search & Discovery INSTALADA (clic de la dueña) en la tienda de lanzamiento. Filtros por defecto activos (Disponibilidad y Precio). No se añadieron filtros: el editor embebido no respondió de forma fiable por automatización; es opcional. | Un clic en «Instalar» en la pantalla de permisos de Search & Discovery. |
| **C1** | OPTIONAL/DEFERRABLE | OWNER DECISION | Valores del sitio actual propuestos en seo/03K-home-seo-values.json (título y meta descripción); solo falta el sí de la dueña y la carga en Preferencias. | Un sí o un no a cada valor propuesto (opcional: no bloquea). |
| **C2** | OPTIONAL/DEFERRABLE | OWNER DECISION | La sección 'Recomendado para vos' puede quedar oculta. | — |
| **C3** | OPTIONAL/DEFERRABLE | OWNER DECISION | Voseo o tuteo de la interfaz; hoy conviven. | — |
| **C4** | OPTIONAL/DEFERRABLE | — | Decisión C de la dueña: dejar el aspecto igual que el sitio original. Sin cambio visual; riesgo de accesibilidad (1,69:1) aceptado y registrado. El parche de la opción A sigue preparado por si cambia de opinión. | — |
| **C5** | OPTIONAL/DEFERRABLE | OWNER DECISION | Siguen las páginas y colecciones por defecto de Shopify: página «Contact» (en inglés) y colección «Home page». Limpiarlas es trivial; no se borró nada sin OK. | OK para borrar la página «Contact» por defecto y la colección vacía «Home page». |
| **C6** | OPTIONAL/DEFERRABLE | OWNER DECISION | Orden de colecciones y de Destacados; hoy el de la Dev Store. | — |
| **C7** | OPTIONAL/DEFERRABLE | OWNER DECISION | Selector COP/USD y redes en el encabezado: se decide o se registra como no migrado. | — |
| **C8** | OPTIONAL/DEFERRABLE | OWNER DECISION | Inglés (/en): despublicar o traducir. | — |
| **D3** | POST-TRANSFER REQUIRED | OWNER AUTH/OAUTH | Decisión de la dueña: MIGRAR todo. No ejecutado: el origen es la base del sitio anterior (Producción), que este proyecto no toca; hace falta una exportación autorizada. Recomendación: pedidos históricos como archivo de consulta, no como pedidos de Shopify. Procedimiento listo en launch/03o/historical-data-procedure.md. | Autorizar por escrito la exportación de clientas, cupones, suscriptoras y blog (y confirmar que los pedidos queden como archivo de consulta). |
| **D4** | BILLING/PLAN | OWNER DECISION, FINAL CUTOVER, OWNER AUTH/OAUTH | Actualizado en 03L: la tienda de lanzamiento YA EXISTE (Client Transfer Store «Radaelli Swimwear Colombia Launch», país Colombia, sin transferir y sin plan de pago) y ya recibió el paquete (paridad 8/8). Las dos Dev Stores quedan como sandbox de QA. Falta solo lo que exige a la dueña: nombre comercial real, transferencia y plan al transferir, facturación, DNS y ventana de corte (runbook P13). | Nombre real de la tienda, plan de Shopify y facturación al transferir la tienda, proveedor de DNS y acceso, ventana de corte y quién la ejecuta. |
| **A5** | OPTIONAL/DEFERRABLE | OWNER AUTH/OAUTH | App de favoritos de cuenta: 156 pruebas y 20/20 mutantes; sin ella los favoritos de invitado siguen funcionando. Requiere cuenta de desarrolladora, distribución personalizada (irreversible) e instalación con OAuth. | — |
| **B3** | OWNER AUTH/OAUTH | POST-TRANSFER REQUIRED | Sin píxeles en la tienda de lanzamiento (Eventos de clientes vacío; verificado en 03M). Plan y runbook de analítica listos. | ID de medición de GA4, dataset de Meta e instalar las apps oficiales (OAuth) cuando la tienda sea pública. |
| **B4** | FINAL CUTOVER | OWNER AUTH/OAUTH | Runbook P13 a P15 listo. | Dominio, publicar el theme, quitar la contraseña y apagar el sitio actual en la ventana de corte. |
| **E1** | OPTIONAL/DEFERRABLE | OWNER DECISION | Plataforma de correo de marketing y aviso 'Avísame': ninguna se crea ni se conecta. | — |
| **HP-01** | DONE | — | Nombre visible cambiado a «Radaelli Swimwear» en la tienda de lanzamiento (API: shop.name). El identificador técnico (slug) no cambia hasta la transferencia. | — |
| **H-01** | DONE | — | Resuelto en RC1.10: la tarjeta de categoría sin imagen tiene fondo oscuro y contraste 17,9:1 (título) y 11,7:1 (descripción); prueba de regresión y mutante 73. | — |
| **G15** | DONE | — | El arnés de regresión vive en theme-harness/ y está en la rama de respaldo. | — |
| **REL-01** | FINAL CUTOVER | — | Congelar el RC final (hash y manifiesto) se hace una sola vez, con el theme que se publique: runbook P14. | — |
| **VAL-01** | FINAL CUTOVER | — | Las mediciones que se corren una sola vez sobre el RC final (barrido de ficha, superficies) se hacen al publicar; el checkout ya se probó en 03M con la pasarela de prueba. | — |
| **HYG-01** | OPTIONAL/DEFERRABLE | — | Especificación ejecutable de la evidencia de la Dev Store: launch/tools/03k-surface-check.js cubre las superficies; el resto es trazabilidad. | — |
| **HYG-02** | OPTIONAL/DEFERRABLE | — | Rutas absolutas en herramientas y evidencia ya aprobadas; se corrigen al reproducir en la tienda final (no cambia resultados). | — |
| **GAP-CLOSED** | DONE | — | Referencia cruzada de brechas cubiertas por filas propias. | — |
| **N-01** | POST-TRANSFER REQUIRED | BILLING/PLAN | Envia PRECONFIGURADA: la tienda aparece como «Tienda ya instalada» en la cuenta de Envia, paquete 15×10×5 cm cargado, peso 500 g en las 98 variantes. Las tarifas en vivo bajo COP 299.900 siguen sin aparecer («El envío no está disponible»); se atribuye al envío calculado por transportista (plan), sin confirmar. Se activa y prueba tras transferir y elegir plan (runbook 03P). | Ninguna antes de transferir; al elegir plan, elegir uno que admita envío calculado por transportista de terceros. |
| **N-02** | DONE | — | Checkout de punta a punta en la tienda de lanzamiento: carrito COP 367.840 (≥ 299.900), Colombia con departamentos, moneda COP, teléfono obligatorio, envío gratis, pago con la pasarela de prueba de Shopify, página de confirmación, pedido #1001 creado (pagado, no preparado), correo de confirmación disparado, inventario sin seguimiento (no descuenta); pedido archivado sin reembolso ni dinero real. | — |
| **N-03** | POST-TRANSFER REQUIRED | BILLING/PLAN | Idioma PRINCIPAL sigue en inglés (español publicado y por defecto en el dominio raíz). Cambiarlo aplica traducciones a «Pago y Sistema» y al tema, con efectos materiales sobre RC1.10; se dejó y se documentó para el corte. | Ninguna: se decide y ejecuta en el corte (runbook P13). |
| **N-04** | DONE | — | Checkout: contacto por correo; teléfono de la dirección de envío OBLIGATORIO (guía de Wompi); sin campo de empresa ni NIT inventado; zona horaria, moneda y unidades de Colombia verificadas (paridad 8/8). | — |
| **N-05** | POST-TRANSFER REQUIRED | BILLING/PLAN | La pasarela de prueba de Shopify queda activa en la tienda de lanzamiento (las tiendas de desarrollo solo procesan pagos de prueba). Al transferir hay que reemplazarla por un proveedor real; la contraseña de la tienda sigue puesta. | Ninguna ahora; en el corte se instala el proveedor real (Wompi u otro). |
| **N-06** | DONE | — | El lote de datos y decisiones previos a la transferencia fue respondido por la dueña y aplicado en 03O (legales, inventario, XL, datos históricos, contraste, peso, paquete, URL de eventos). | — |
| **N-07** | DONE | — | Las 4 únicas 404 intencionales: /envios, /terminos, /privacidad, /cookies (redirecciones a páginas que no existen hasta resolver F1-F4 y D2). Control de enlaces 9/9 PASS. | — |
| **N-08** | DONE | — | Peso de envío: 500 g en las 98 variantes (un peso estándar elegido por la dueña); paquete estándar 15×10×5 cm provisional (ella medirá el exacto). Sin valores inventados. | — |
| **N-09** | DONE | — | URL de eventos de Wompi guardada en PRODUCCIÓN: confirmado por la dueña («guardada»); Claude no la pudo verificar porque esa pantalla muestra llaves. Wompi sigue en modo prueba. | — |
