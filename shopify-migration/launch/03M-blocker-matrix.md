# 03M — Matriz de bloqueos (8 categorías)

*Generada por `launch/tools/03m-blocker-matrix.mjs` desde `launch/03K-blocker-classification.json` + las correcciones de 03M (fuente única en la herramienta). No editar a mano.*

## 1. Resultado

- Filas: **39** (32 de 03I + 7 nuevas de 03M).

| Categoría | Filas | Ids |
|---|---:|---|
| **DONE** | 9 | D5, G03, HP-01, H-01, G15, GAP-CLOSED, N-02, N-04, N-07 |
| **POST-TRANSFER REQUIRED** | 3 | B1, N-03, N-05 |
| **OWNER FACT/DATA** | 2 | B2, N-06 |
| **OWNER DECISION** | 5 | A1, D1, D2, C4, D3 |
| **OWNER AUTH/OAUTH** | 5 | A4, A2, A3, B3, N-01 |
| **BILLING/PLAN** | 1 | D4 |
| **FINAL CUTOVER** | 3 | B4, REL-01, VAL-01 |
| **OPTIONAL/DEFERRABLE** | 11 | C1, C2, C3, C5, C6, C7, C8, A5, E1, HYG-01, HYG-02 |
| **Total** | **39** | |

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

| Id | Categoría | También | Estado tras 03M | Qué necesita de la dueña |
|---|---|---|---|---|
| **A1** | OWNER DECISION | BILLING/PLAN, POST-TRANSFER REQUIRED | HECHO en la tienda de lanzamiento (03M): zona Colombia con ÚNICA tarifa «Envío estándar gratis» desde COP 299.900 (verificado en un checkout real de prueba: pedido de COP 367.840 con envío 0). NO existe tarifa por debajo de 299.900 (no se inventó ningún importe). Cálculo en vivo con mensajería: la opción «Calculado por la empresa de transporte o la app» existe en esta tienda, pero exige la cuenta de Envia.com, peso y medidas de cada prenda (hoy 0,0 kg) y, en producción, que el plan lo permita (sin verificar; no se eligió plan). | D6: tarifa bajo $299.900 (cálculo en vivo con mensajería o importe fijo), y pesos/medidas de las prendas si es en vivo. |
| **B1** | POST-TRANSFER REQUIRED | OWNER AUTH/OAUTH | Wompi NO es instalable hoy: no está en la lista de proveedores de pago de la tienda ni en la App Store (búsqueda). No se pidieron ni se tocaron llaves. El checkout de punta a punta SÍ pasó con la pasarela de prueba de Shopify (pedido #1001 pagado, confirmación, correo disparado; ver 03M-checkout-e2e.json). | Cuando Wompi sea instalable: instalar la integración oficial y escribir ella las llaves de PRUEBA en la pantalla oficial; producción solo con su aprobación. |
| **A4** | OWNER AUTH/OAUTH | — | Paquete de media listo (prepare-media-package.mjs, apply-media-wiring.mjs). Sin el OK de descarga no se baja nada. | OK para descargar 12 archivos del Cloudinary propio (~15,6 a 20,7 MB) y subirlos a Contenido > Archivos. |
| **D5** | DONE | — | Rama dedicada de respaldo creada y verificada en el remoto (sin secretos, sin PII, sin tocar main, sin PR). | — |
| **G03** | DONE | — | El repo de migración ya está versionado en la rama shopify-migration-backup (BACKUP-MANIFEST.json con SHA-256 por archivo). | — |
| **D1** | OWNER DECISION | — | Marcador explícito import/xl-decision.json = PENDING_OWNER; nada se elimina ni se decide solo. | Talla XL de alba-dorada-cafe-claro: ¿existe (98 variantes) o no (97)? |
| **D2** | OWNER DECISION | — | Hoja import/inventory-template.csv lista (98 filas, sin cantidades inventadas). | Cantidades por variante (98) o decisión escrita de vender sin límite. |
| **B2** | OWNER FACT/DATA | OWNER DECISION | Los 6 HTML legales con texto verbatim del sitio actual y hash; content/legal/owner-fields.json con razón social, NIT y dirección en PENDING_OWNER (no se inventan). Redirecciones legales listas (51). | Aprobar los 4 textos pendientes (Privacidad, Términos, Envíos, Cookies) y entregar razón social, NIT y dirección legal. |
| **A2** | OWNER AUTH/OAUTH | — | Solo aplica al probar cuentas de clienta; el código llega por correo y lo escribe ella. | Escribir el código de ingreso de clienta cuando se pruebe el registro. |
| **A3** | OWNER AUTH/OAUTH | POST-TRANSFER REQUIRED | Search & Discovery: app gratuita de Shopify, llevada hasta su pantalla de permisos (03M). Falta el clic «Instalar» de la dueña (no instalada al cierre salvo que el reporte diga lo contrario). Reseñas públicas recientes reportan búsquedas irregulares en Colombia (dato de terceros, sin verificar). | Un clic en «Instalar» en la pantalla de permisos de Search & Discovery. |
| **C1** | OPTIONAL/DEFERRABLE | OWNER DECISION | Valores del sitio actual propuestos en seo/03K-home-seo-values.json (título y meta descripción); solo falta el sí de la dueña y la carga en Preferencias. | Un sí o un no a cada valor propuesto (opcional: no bloquea). |
| **C2** | OPTIONAL/DEFERRABLE | OWNER DECISION | La sección 'Recomendado para vos' puede quedar oculta. | — |
| **C3** | OPTIONAL/DEFERRABLE | OWNER DECISION | Voseo o tuteo de la interfaz; hoy conviven. | — |
| **C4** | OWNER DECISION | — | Botones blancos sobre arena (1,69:1, igual al sitio actual). Tres opciones documentadas: texto oscuro, arena más oscuro o excepción firmada. | Elegir una de las tres opciones de contraste de los botones (o firmar la excepción). |
| **C5** | OPTIONAL/DEFERRABLE | OWNER DECISION | Siguen las páginas y colecciones por defecto de Shopify: página «Contact» (en inglés) y colección «Home page». Limpiarlas es trivial; no se borró nada sin OK. | OK para borrar la página «Contact» por defecto y la colección vacía «Home page». |
| **C6** | OPTIONAL/DEFERRABLE | OWNER DECISION | Orden de colecciones y de Destacados; hoy el de la Dev Store. | — |
| **C7** | OPTIONAL/DEFERRABLE | OWNER DECISION | Selector COP/USD y redes en el encabezado: se decide o se registra como no migrado. | — |
| **C8** | OPTIONAL/DEFERRABLE | OWNER DECISION | Inglés (/en): despublicar o traducir. | — |
| **D3** | OWNER DECISION | — | No hay datos de clientas en el repositorio ni se tocan. | Qué se migra y qué se archiva del sitio actual: clientas y direcciones, pedidos históricos, cupones, suscriptores, blog. |
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
| **N-01** | OWNER AUTH/OAUTH | POST-TRANSFER REQUIRED | Envia.com: la app «Envia Shipping and Fulfillment» está INSTALADA (clic de la dueña). No configurada: falta ingresar/crear la cuenta de Envia.com (solo ella), dirección de origen y paquetes; sin cuenta no hay tarifas en vivo. No se compraron etiquetas ni se eligió plan. | Ingresar o crear su cuenta de Envia.com en la pestaña de la app (y, si quiere etiquetas, cargar saldo). |
| **N-02** | DONE | — | Checkout de punta a punta en la tienda de lanzamiento: carrito COP 367.840 (≥ 299.900), Colombia con departamentos, moneda COP, teléfono obligatorio, envío gratis, pago con la pasarela de prueba de Shopify, página de confirmación, pedido #1001 creado (pagado, no preparado), correo de confirmación disparado, inventario sin seguimiento (no descuenta); pedido archivado sin reembolso ni dinero real. | — |
| **N-03** | POST-TRANSFER REQUIRED | BILLING/PLAN | Idioma PRINCIPAL sigue en inglés (español publicado y por defecto en el dominio raíz). Cambiarlo aplica traducciones a «Pago y Sistema» y al tema, con efectos materiales sobre RC1.10; se dejó y se documentó para el corte. | Ninguna: se decide y ejecuta en el corte (runbook P13). |
| **N-04** | DONE | — | Checkout: contacto por correo; teléfono de la dirección de envío OBLIGATORIO (guía de Wompi); sin campo de empresa ni NIT inventado; zona horaria, moneda y unidades de Colombia verificadas (paridad 8/8). | — |
| **N-05** | POST-TRANSFER REQUIRED | BILLING/PLAN | La pasarela de prueba de Shopify queda activa en la tienda de lanzamiento (las tiendas de desarrollo solo procesan pagos de prueba). Al transferir hay que reemplazarla por un proveedor real; la contraseña de la tienda sigue puesta. | Ninguna ahora; en el corte se instala el proveedor real (Wompi u otro). |
| **N-06** | OWNER FACT/DATA | — | Formulario compacto de datos y decisiones listo (launch/03m/owner-final-data-form.md): razón social, NIT, dirección legal, representante, pesos y medidas, cantidades; NO se le presenta hasta que ella decida empezar. | Ver el formulario. |
| **N-07** | DONE | — | Las 4 únicas 404 intencionales: /envios, /terminos, /privacidad, /cookies (redirecciones a páginas que no existen hasta resolver F1-F4 y D2). Control de enlaces 9/9 PASS. | — |
