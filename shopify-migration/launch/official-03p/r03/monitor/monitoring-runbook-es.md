# Radaelli Swimwear - Guía de monitoreo (primeras 72 horas y después)

Para la dueña de la tienda y para cualquier asistente de IA (incluso uno con poca capacidad). Escrita en lenguaje simple.
Tienda en vivo desde **2026-10-02 11:23 (hora Bogotá)**: https://radaelliswimwear.com — tienda Shopify `wgcvpd-ib.myshopify.com`.
Ventana de vigilancia reforzada: **2026-10-02 11:23 a 2026-10-05 11:23 (Bogotá)**.

## 1. Qué es esto en una frase

Un script (`monitor.mjs`) que **mira, no toca**: revisa que el sitio abra, que el candado (SSL) y el DNS estén bien, que los productos, precios, inventario y envíos no hayan cambiado, y que los pedidos no tengan problemas. Cada vez que corre deja un resultado claro: **todo bien (0)**, **avisos (1)** o **crítico (2)**.

Lo que **nunca** hace: no cambia nada en Shopify, Wompi, Envia, Meta ni DNS; no paga; no lee ni guarda datos de clientas (ni correos, ni nombres, ni direcciones); no se programa solo (hay que correrlo a mano o que alguien lo programe aparte).

## 2. Cómo correrlo (PowerShell, copiar y pegar)

Carpeta del script:
`C:\Users\user\AppData\Local\Temp\claude\C--CLAUDE-rada-main-rada-main\34c11d0a-7250-45aa-b727-3081da1b069a\scratchpad\official\r03\monitor`

| Qué quieres | Comando exacto | Dura |
|---|---|---|
| Revisión rápida (DNS, candado SSL, redirecciones, inicio, robots, sitemap) | `node "C:\Users\user\AppData\Local\Temp\claude\C--CLAUDE-rada-main-rada-main\34c11d0a-7250-45aa-b727-3081da1b069a\scratchpad\official\r03\monitor\monitor.mjs" --quick` | ~10-30 s |
| **Revisión completa** (todo lo anterior + 11 páginas + catálogo + redirecciones viejas + Admin de Shopify + comparación con la línea base) | `node "C:\Users\user\AppData\Local\Temp\claude\C--CLAUDE-rada-main-rada-main\34c11d0a-7250-45aa-b727-3081da1b069a\scratchpad\official\r03\monitor\monitor.mjs" --full` | ~40 s |
| Completa + prueba de checkout (agrega 1 prenda a un carrito desechable, abre `/checkout`, **no paga**, vacía el carrito) | `node "C:\Users\user\AppData\Local\Temp\claude\C--CLAUDE-rada-main-rada-main\34c11d0a-7250-45aa-b727-3081da1b069a\scratchpad\official\r03\monitor\monitor.mjs" --full --checkout` | ~55 s |

Después de correr, mira el código de salida: `$LASTEXITCODE` (0 = todo bien, 1 = avisos, 2 = crítico).

Cada corrida escribe dos archivos en la misma carpeta: `run-AAAAMMDD-HHMMSS.json` (datos) y `run-AAAAMMDD-HHMMSS.md` (tabla legible). La hora del nombre es **hora de Bogotá**.

Opciones útiles: `--out <carpeta>` (dónde guardar los logs), `--no-admin` (saltar Shopify Admin si el CLI no está autorizado), `--help`.

Reglas de uso: **una corrida a la vez**; esperar **al menos 10 minutos** entre corridas completas; el script ya espera 1,7 s entre peticiones y se detiene si Shopify responde 429 (demasiadas peticiones). Si sale un aviso de 429, **esperar 10 minutos y repetir una vez**, no en bucle.

## 3. Cómo leer el resultado

La primera línea dice `Result: ALL OK / WARNINGS / CRITICAL`. Luego hay una tabla (ID, qué se revisó, estado, detalle) y al final la lista **Findings** (solo lo que no está OK).

| Estado | Significa | Qué hacer |
|---|---|---|
| **OK** | Está como debe. | Nada. |
| **INFO** | Dato informativo o algo que el script no puede leer. No es falla. | Nada, solo leer. |
| **WARN** | Algo se salió de lo esperado pero la tienda sigue vendiendo. | Revisar el mismo día. Si se repite en 2 corridas seguidas, tratarlo como incidente. |
| **DRIFT** | Un valor cambió respecto a la línea base (`baseline.json`). Cuenta como aviso (exit 1). | Preguntar: ¿alguien lo cambió a propósito? Si sí, actualizar la línea base (sección 7). Si no, tratarlo como incidente. |
| **CRIT** | Falla que puede costar ventas o dinero (sitio caído, contraseña puesta, IVA cobrado, etc.). | Actuar ya (sección 5) y registrar incidente. |
| **SKIP** | No se pudo revisar (por ejemplo, 429 repetido). | Repetir la corrida más tarde. |

## 4. Qué significa cada chequeo y qué tan grave es

| ID | Qué revisa | Si falla |
|---|---|---|
| `DNS-A` | El dominio sin www apunta a `23.227.38.65` (Shopify). Se pregunta al servidor oficial (`ns1.dns-parking.com`) y a 1.1.1.1 y 8.8.8.8. | **CRIT** si el servidor oficial no lo tiene. **WARN** si solo difieren los públicos (caché, se arregla solo en minutos). |
| `DNS-WWW` | `www` es un alias (CNAME) de `shops.myshopify.com`. | Igual que arriba. |
| `DNS-WWWPUB` | `www` resuelve a una IP de Shopify (23.227.38.x) en los resolvers públicos. | WARN. |
| `DNS-MX` | El correo (`mx1` y `mx2.hostinger.com`) sigue en su lugar. | CRIT si el oficial cambió (se dejaría de recibir correo). |
| `DNS-TXT` | Siguen los textos de verificación de Facebook y Google y hay **un solo** SPF de Hostinger. | WARN. |
| `DNS-NS` | Los servidores de nombres siguen siendo `ns1/ns2.dns-parking.com`. | WARN (si cambiaron, todo lo demás probablemente también falla). |
| `DNS-AAAA` | El dominio no tiene dirección IPv6 inesperada. | WARN. |
| `TLS-APEX` / `TLS-WWW` | El candado (certificado SSL) es válido, es del dominio correcto y le quedan 21 días o más. | **WARN** si quedan menos de 21 días. **CRIT** si está vencido, no es de confianza o es de otro nombre. |
| `HTTP-HTTP-APEX` / `HTTP-HTTP-WWW` | `http://` te lleva a `https://` con redirección 301. | CRIT si no redirige. |
| `HTTP-WWW` | `https://www...` te lleva a `https://radaelliswimwear.com` (301). | CRIT si falla; WARN si el tipo de redirección no es 301. |
| `HTTP-HOME` | El inicio abre (200) y **no** pide la contraseña de tienda. | **CRIT**: si dice `STOREFRONT PASSWORD IS ON`, nadie puede comprar. |
| `HTTP-THEME` | El tema que ven las clientas es `Radaelli RC1.10`. | CRIT si es otro. |
| `HTTP-ROBOTS` | `robots.txt` no bloquea todo (`Disallow: /`). | CRIT (Google dejaría de indexar). |
| `HTTP-SITEMAP` | `sitemap.xml` abre. | CRIT/WARN según el detalle. |
| `ROUTE-*` | Páginas clave abren con 200: `/collections/all`, 3 colecciones, un producto, `/cart`, `/search?q=marea`, políticas, `/pages/contact`. | CRIT si fallan las de compra (colecciones, producto, carrito, búsqueda). WARN si fallan políticas o contacto. Muy lenta (>4 s) = WARN. |
| `CATALOG-JSON` | `/products.json` muestra **29 productos / 98 variantes / 95 imágenes**. | WARN si difiere. (Un producto de prueba archivado puede existir en Admin y no aparecer aquí: es normal.) |
| `CATALOG-LEGACY1..3` | Tres enlaces viejos (`/oasis-natural`, `/producto/brisa-natural-beige`, `/devoluciones`) redirigen (301) a la página nueva y esta abre (200). | WARN; CRIT si terminan en `/password`. |
| `CHECKOUT-ADD` / `CHECKOUT-PAGE` / `CHECKOUT-CLEAR` | (solo con `--checkout`) Se puede agregar al carrito y `/checkout` crea una sesión de pago en el mismo dominio. | **CRIT** si no se crea la sesión de pago. |
| `CHECKOUT-PAYSECTION` / `WOMPI-HTTP` | Intenta ver la sección de pago y el nombre Wompi en el HTML. **Shopify bloquea con 403 a los programas que no son navegador** (protección anti-bots; el script no la evade), así que normalmente sale **INFO: "verificar en un navegador"**. | INFO. Revisar a ojo 1 vez al día (sección 6). |
| `ADMIN-SHOP` | Tienda en COP, zona horaria Bogotá, impuestos **no incluidos** en precios, sin impuesto de envío. | CRIT si la moneda cambió; WARN en lo demás. |
| `ADMIN-THEME` | El tema publicado se llama `Radaelli RC1.10`. | CRIT si publicaron otro. Si no hay permiso de lectura de temas sale INFO "not readable" (no es falla). |
| `ADMIN-ORD-24H` | Pedidos de las últimas 24 h: cantidad, estados, cuántos son de prueba (`test`), cuántos `interno`, cuántos **reales**, sumas en COP, pasarela usada. **Sin datos de clientas.** | OK/INFO. Es el número de ventas reales. |
| `ADMIN-ORD-INTERNO` | Pedidos con la etiqueta `interno` (pruebas internas del lanzamiento). | INFO. No cuentan como venta. |
| `ADMIN-ORD-PENDING` | Pedidos en estado PENDIENTE hace más de 60 minutos. | **WARN**: el pago no se confirmó (ver sección 5, "Pedido pendiente"). |
| `ADMIN-ORD-TAX` | **Ningún pedido con IVA/impuesto mayor a 0.** | **CRIT** si hay alguno. |
| `WOMPI-TESTMODE` | No hay pedidos de prueba (`test=true`) creados después del lanzamiento. | WARN: Wompi podría estar en modo de prueba. |
| `WOMPI-MANUAL` | Wompi en modo prueba o en vivo: el Admin no lo deja leer por API. | INFO fijo: **verificar a mano** (sección 6). La prueba indirecta es que haya pedidos reales con `test=false` y pasarela `Wompi`. |
| `ADMIN-PROD-STATUS` | 29 productos ACTIVOS y 98 variantes. | WARN si cambia. |
| `ADMIN-PROD-EXTRA` | Productos no activos (borrador/archivado). Hoy: `prueba-lanzamiento-interna` (ARCHIVADO). | INFO. |
| `ADMIN-INV-TRACK` | Las 98 variantes llevan control de inventario. | WARN. |
| `ADMIN-INV-NEG` | Ninguna variante con inventario negativo. | **CRIT** si hay (vendimos más de lo que hay). |
| `ADMIN-INV-TOTAL` | Unidades totales disponibles y diferencia contra la línea base (hoy 128). | INFO si cambió poco (normal si hubo ventas). **WARN si cambió 28 unidades o más** desde la línea base. |
| `ADMIN-PRICE` | Todas las variantes tienen precio = 80 % del precio tachado (compare-at). | WARN si alguna se salió. |
| `ADMIN-SHIP` | Envío: 5 zonas, tarifas 9.900 / 12.900 / 17.900 / 21.900 / 44.900 COP y envío gratis desde 299.900 COP. (Hoy son 10 métodos: 5 pagos + 5 gratis.) | WARN si cambia. |
| `BASE-*` | Compara con `baseline.json`: DNS, TLS, redirecciones, tienda/tema, catálogo, precios, envío, inventario por SKU. | **DRIFT** (aviso) si algo cambió. `BASE-INV` y `BASE-TLS` solo informan. |

## 5. Primera respuesta para cada falla (qué hacer, en orden)

Regla general: **primero repetir la corrida una vez a los 5 minutos** (a veces es un fallo pasajero de red). Si el problema sigue, **registrar incidente** (sección 9) y actuar. Un asistente de IA **no cambia nada en Shopify, Wompi o DNS por su cuenta**: avisa a la dueña con el ID, el detalle exacto y esta guía. No pausar toda la tienda, no borrar datos.

**A. Contraseña de la tienda puesta** (`HTTP-HOME` dice `PASSWORD`, o `HTTP-ROBOTS` dice `Disallow: /`)
1. Admin de Shopify > **Tienda online > Preferencias > Protección con contraseña**. La casilla "Restringir el acceso con contraseña" debe estar **desmarcada**. Guardar.
2. Si ya estaba desmarcada: revisar que el plan de Shopify no esté pausado o vencido (Admin > Configuración > Plan).
3. Repetir `--quick`.

**B. DNS cambió** (`DNS-A`, `DNS-WWW`, `DNS-MX`, `DNS-TXT`, `DNS-NS`, `DNS-AAAA`, `BASE-DNS`)
1. Si solo difieren 1.1.1.1 / 8.8.8.8 y el servidor oficial (`auth`) está bien: es caché. Esperar 10-30 minutos y repetir `--quick`.
2. Si `auth` está mal: entrar a Hostinger (hPanel > Dominios > radaelliswimwear.com > **DNS / Zona DNS**) y **devolver los valores correctos**:

| Tipo | Nombre | Valor correcto |
|---|---|---|
| A | @ (el dominio) | `23.227.38.65` |
| CNAME | www | `shops.myshopify.com` |
| MX | @ | prioridad 5 `mx1.hostinger.com` y prioridad 10 `mx2.hostinger.com` |
| TXT | @ | SPF: `v=spf1 include:_spf.mail.hostinger.com ~all` (uno solo), más los textos `facebook-domain-verification=...` y `google-site-verification=...` (valores exactos en `baseline.json`, sección `dns.txt`) |
| NS | @ | `ns1.dns-parking.com` y `ns2.dns-parking.com` |

3. No borrar otros registros. No agregar registros AAAA (IPv6). Repetir `--quick` a los 10 minutos.

**C. Certificado SSL con menos de 21 días** (`TLS-APEX`/`TLS-WWW` en WARN)
Shopify lo **renueva solo** (certificados Let's Encrypt de 90 días). Hoy vencen el 2026-12-31, así que esto no debería pasar en la ventana de 72 h. Si ocurre: Admin > **Configuración > Dominios** y mirar el estado del SSL; si dice "pendiente" o "activo", esperar; si hay un error, revisar primero que el DNS esté bien (punto B). Si está vencido (CRIT), es urgente: DNS (B) y luego soporte de Shopify.

**D. Redirecciones rotas** (`HTTP-HTTP-*`, `HTTP-WWW`)
Admin > **Configuración > Dominios**: `radaelliswimwear.com` debe ser el dominio **principal** y `www` debe redirigir a él; el SSL debe estar activo.

**E. Una página da 404 o error** (`ROUTE-*`, `CATALOG-LEGACY*`)
1. Si es solo una página: Admin > Productos / Colecciones / Páginas / Configuración > Políticas: que esté **Activa/publicada** en "Tienda online".
2. Si fallan todas o dan 5xx: mirar https://www.shopifystatus.com y esperar 10 minutos; repetir.
3. No editar el código del tema.

**F. Tema cambiado** (`ADMIN-THEME`, `HTTP-THEME`)
Admin > **Tienda online > Temas**: el publicado debe ser **Radaelli RC1.10**. Si publicaron otro (por ejemplo Horizon), en "Radaelli RC1.10" usar Acciones > Publicar. Avisar a la dueña antes si el cambio fue intencional.

**G. Catálogo distinto** (`CATALOG-JSON`, `ADMIN-PROD-STATUS`, `BASE-CATALOG`)
Admin > **Productos**: filtrar por estado. Deben ser 29 activos con Tienda online marcada como canal de venta. Un producto en borrador, archivado o sin canal desaparece de la tienda. (`prueba-lanzamiento-interna` archivado es lo esperado.)

**H. Precio fuera del 80 %** (`ADMIN-PRICE`, `BASE-PRICE`)
Admin > Productos > abrir el producto > revisar precio y "Precio de comparación" por variante. Precio = 80 % del tachado. Si el cambio fue intencional (promoción), actualizar la línea base (sección 7).

**I. Inventario** (`ADMIN-INV-NEG`, `ADMIN-INV-TOTAL`, `BASE-INV`)
1. Negativo (CRIT): Admin > **Productos > Inventario**, buscar el SKU indicado, corregir la cantidad real contando prendas, y revisar el pedido que lo causó con la dueña.
2. Cambio de 28 o más unidades sin ventas que lo expliquen: abrir Inventario > el SKU > historial de ajustes para ver quién/cuándo.

**J. Pedido pendiente** (`ADMIN-ORD-PENDING`)
1. **No enviar** hasta que el pedido diga "Pagado".
2. Revisar en el panel de Wompi si la transacción está APROBADA, rechazada o sigue pendiente.
3. Si Wompi dice aprobada y Shopify sigue pendiente, puede ser la **URL de eventos** de Wompi (webhook): revisar que esté configurada.

**K. IVA mayor a 0 en un pedido** (`ADMIN-ORD-TAX`, CRIT) o `taxesIncluded` distinto (`ADMIN-SHOP`)
1. Admin > **Configuración > Impuestos y aranceles > Colombia**: no debe recaudarse impuesto; los precios no deben "incluir impuestos".
2. No reembolsar ni editar pedidos por cuenta propia: avisar a la dueña con el número de pedido.

**L. Pedido de prueba después del lanzamiento** (`WOMPI-TESTMODE`)
Puede significar que Wompi volvió a modo prueba. Admin > **Configuración > Pagos > Wompi > Administrar**: el modo de prueba debe estar **apagado**. (También puede ser una prueba intencional de la dueña.)

**M. Envío distinto** (`ADMIN-SHIP`, `BASE-SHIP`)
Admin > **Configuración > Envío y entrega > Perfil general**: 5 zonas con 9.900 / 12.900 / 17.900 / 21.900 / 44.900 COP, y envío gratis desde 299.900 COP en cada zona.

**N. Checkout** (`CHECKOUT-PAGE` en CRIT)
Probar a mano en un navegador (agregar al carrito > Finalizar compra). Revisar Admin > Configuración > Pagos (que haya un método de pago activo) y el estado de Shopify. Que `CHECKOUT-PAYSECTION` / `WOMPI-HTTP` salgan INFO con 403 **es normal** (protección anti-bots).

**O. Admin no responde** (`ADMIN-SHOP` en WARN "Admin API unreachable")
El CLI de Shopify perdió la autorización o no está instalado. El resto de chequeos (DNS, TLS, HTTP) siguen siendo válidos. Pedir a quien administra la cuenta que vuelva a autorizar el CLI de Shopify. Mientras tanto, revisar pedidos a mano en el Admin.

## 6. Cosas que el script NO puede ver (revisar a mano)

1. **Wompi en vivo (no prueba):** Admin > Configuración > Pagos > Wompi. Una vez al día en la ventana de 72 h.
2. **Que Wompi aparezca en el pago:** en un navegador, agregar un producto al carrito y llegar hasta la pantalla de pago (**sin pagar**). Una vez al día.
3. Correos de la tienda y de contacto llegando (Hostinger).
4. Envia / tarifas en vivo: según el estado del plan.

## 7. Línea base (`baseline.json`)

Es la foto de los valores buenos de hoy (2026-10-02 12:16 Bogotá): 29 productos / 98 variantes / 95 imágenes, tema `Radaelli RC1.10`, `taxesIncluded=false`, 128 unidades de inventario, valores de DNS, precios por SKU, zonas y tarifas de envío.

- Cada corrida `--full` se compara contra ella y marca **DRIFT** si algo cambió.
- Si un cambio fue **a propósito** (ej.: nueva promoción, nueva colección), actualizarla **después de verificar que todo está bien**:
  `node "...\monitor.mjs" --full --write-baseline --force`
  (el script guarda una copia de la anterior como `baseline.prev-<fecha>.json` y se niega a escribir si hay CRIT o si los valores acordados 29/98/95, IP, tema o impuestos no coinciden).
- Si el inventario baja porque se vendió, es normal: aparece como INFO. Para que la comparación de unidades empiece de nuevo, actualizar la línea base.

## 8. Cadencia recomendada para la ventana de 72 horas

| Qué | Cuándo | Comando |
|---|---|---|
| **Rápida** | Cada 3 horas entre 07:00 y 22:00 (07, 10, 13, 16, 19, 22 h Bogotá) | `--quick` |
| **Completa** | 2 veces al día: **08:00 y 20:00** | `--full` |
| **Checkout** | 1 vez al día, junto con la completa de las 08:00 | `--full --checkout` |
| **Extra** | 5-10 min después de **cualquier cambio** (DNS, tema, precios, envío, Wompi) y después de **cada pedido real** | `--full` |

Después del 2026-10-05 11:23: una completa al día y una rápida cada 6 horas es suficiente.
No programar nada automáticamente sin que la dueña lo decida; esta guía solo documenta.

## 9. Qué registrar como incidente

Abrir un incidente (una línea nueva en el registro de incidentes) cuando ocurra **cualquiera** de estos:
- Cualquier **CRIT**, aunque se arregle al repetir.
- Un **WARN o DRIFT que aparece en 2 corridas seguidas**.
- Un cambio que **nadie reconoce** haber hecho (precio, tema, DNS, envío, producto).
- Un pedido real **pendiente > 60 min**, con IVA > 0, o inventario negativo.

**No** es incidente: INFO, ni un WARN de DNS público que se corrige solo en la siguiente corrida (anotarlo igual en el registro), ni bajas de inventario que coinciden con pedidos reales.

Plantilla (copiar y llenar):
```
Incidente:    [fecha y hora Bogotá]
ID(s):        [ej. HTTP-HOME]   Estado: [WARN/CRIT/DRIFT]
Detalle:      [copiar el texto exacto de la columna Detalle]
Corrida:      [nombre del archivo run-AAAAMMDD-HHMMSS.json]
Primera respuesta: [qué se hizo, de la sección 5]
Repetición:   [hora y resultado de la nueva corrida]
Estado:       [abierto / resuelto a las HH:MM]   Avisó a: [persona]
```
Nunca escribir correos, nombres, direcciones ni teléfonos de clientas en el registro. Para hablar de un pedido usar solo su número (ej. #1002).

## 10. Valores esperados hoy (resumen de bolsillo)

- Dominio: `radaelliswimwear.com` -> A `23.227.38.65`; `www` -> CNAME `shops.myshopify.com`; MX `mx1`/`mx2.hostinger.com`; NS `ns1`/`ns2.dns-parking.com`; sin AAAA.
- SSL: Let's Encrypt, vence 2026-12-31 (renovación automática).
- Catálogo público: 29 productos / 98 variantes / 95 imágenes. En Admin hay 1 producto extra **archivado**: `prueba-lanzamiento-interna` (normal).
- Tema: `Radaelli RC1.10` (id 191904514347). Moneda COP, zona horaria America/Bogota, `taxesIncluded=false`.
- Pedidos existentes: **#1001** (prueba, `test=true`, 169.820 COP, cerrado) y **#1002** (etiquetas `interno`, `prueba-lanzamiento`, 5.000 COP, pagado con Wompi, no es de prueba). Ninguno tiene IVA. Ventas reales hasta ahora: **0**.
- Inventario: 128 unidades en 98 variantes. Precio = 80 % del tachado en las 98.
- Envío: 5 zonas (Barranquilla y Atlántico, Resto del Caribe, Ciudades principales, Resto del país, San Andrés y Amazonía) con 9.900 / 12.900 / 17.900 / 21.900 / 44.900 COP; gratis desde 299.900 COP.

## 11. Falsas alarmas y particularidades conocidas

- El servidor oficial de DNS (`ns1.dns-parking.com`), si se le pregunta por la **A de `www`**, devuelve una IP de Hostinger (`82.180.138.230`) en lugar de la de Shopify. Es una rareza de ese servidor al seguir el CNAME; los resolvers públicos resuelven bien (`23.227.38.74`). Por eso el script solo confía en el **CNAME** de `www` en el servidor oficial y revisa la IP de `www` en los resolvers públicos (`DNS-WWWPUB`).
- `/checkout` responde 403 a programas (no navegadores): es la protección anti-bots de Shopify. El script no la evade; la prueba válida es que Shopify cree una URL `/checkouts/cn/...` en el mismo dominio.
- El script se identifica como `RadaelliMonitor/1.0`. Las corridas con `--checkout` crean una sesión de carrito/checkout sintética (sin pedido, sin datos de clienta): tenerlo en cuenta al leer las estadísticas de la tienda (sesiones que llegaron al checkout).
