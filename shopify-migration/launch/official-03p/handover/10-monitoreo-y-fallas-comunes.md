# 10 — Monitoreo después del lanzamiento y fallas comunes

Para: Daniela. Parte 1: qué mirar después de abrir. Parte 2: qué hacer cuando algo falla. Si dudas: la **Contención** (sección 5) siempre es seguro.

## PARTE 1 — Monitoreo

**Estado 2026-10-02 (tarde):** la tienda quedó abierta (T = ~11:23): DNS cambiado, dominio principal, contraseña quitada ("Lanzar tienda") y tema Radaelli RC1.10 publicado. El equipo corrió el primer monitoreo automático a las 12:19 y salió **TODO OK** (sección 4.1). Aún no hay pedidos reales de clientas.

### 1. Primera hora (T = momento en que la tienda queda abierta: DNS cambiado, dominio principal, sin contraseña y tema publicado)
Quién: el equipo con tu apoyo. Hora de cada revisión: anótala.
El equipo tiene además un kit técnico de certificación (scripts de navegador, solo para el asistente) y un monitor automático de solo lectura (sección 4.1). Tú no los necesitas: esta lista manual cubre lo esencial.
| Cuándo | Qué mirar | Bien si... | Si no |
|---|---|---|---|
| T+15 min | `https://radaelliswimwear.com` abre con candado, en celular y en datos móviles | Se ve la tienda Shopify | Documento 01 (verificar DNS; esperar SSL) |
| T+15 min | `www.radaelliswimwear.com` lleva al dominio principal | Redirige | Documento 01 |
| T+15 min | Página de inicio SIN pantalla de contraseña | Se ve la tienda | Sección 6 (contraseña) |
| T+15 min | Un producto: elegir talla, agregar, ir al pago (sin pagar) | Aparece Wompi, envío correcto | Sección 7 |
| T+15 min | Wompi "Activa" y en modo real; URL de eventos guardada | Sí | Documento 02 |
| T+30 min | Correo `info@` sigue recibiendo | Llega correo de prueba | Documento 01 (¿tocaron MX?) |
| T+1 h | Primer pedido real (si hay): flujo completo | Pedido pagado + aviso en tu Gmail | Documento 02, caso C |
| T+1 h | Filtros Talla/Color/Precio; búsqueda; páginas legales | Funcionan | Pide ayuda |
| T+1 h | Análisis: visitas y agregar al carrito | Hay datos | GAP-14 (medición). La app "Facebook & Instagram" ya está instalada; falta conectar el dataset de Meta (GAP-26) |

### 2. Primeras 24 horas
- T+4 h y T+24 h: repetir la lista de T+15 min.
- Cada pago aprobado en Wompi tiene su pedido (documento 02, sección 4).
- Pedidos > Checkouts abandonados: no hay pagos aprobados atascados.
- Inventario: no hay cantidades negativas (documento 04).
- Tu Gmail: llegan los avisos de pedido; revisa spam.
- Primer respaldo completo (documento 08) y otro a las 24 h.
- Si hay una visita grande o anuncios: observa cada hora.

### 3. Primera semana
- Cada día: rutina de 5 minutos (Manual, sección 3).
- Día 3: compara guías de Envia con envío cobrado (documento 03).
- Día 7: revisa Análisis, costos, devoluciones y preguntas de clientes; ajusta textos (documento 05).
- Día 7: revisa que las páginas viejas (51 redirecciones) no den error: abre 5 enlaces viejos al azar.
- Registra problemas en una hoja: fecha, qué pasó, qué se hizo.

### 4. Señales que exigen acción inmediata
- Un pago aprobado sin pedido pasadas 2 horas.
- Dos cobros por un pago.
- Nadie puede agregar al carrito o llegar al pago.
- El dominio muestra un aviso de seguridad.
- Cobro de Shopify rechazado.

### 4.1 Monitor automático de solo lectura (para quien te ayude; tú no necesitas correrlo)
- Es un script llamado `monitor.mjs` que **mira, no toca**: revisa que el sitio abra, el candado (SSL), el DNS, las redirecciones, el catálogo, precios, inventario, envíos y que los pedidos no tengan problemas. No cambia nada en Shopify, Wompi, Envia, Meta ni el DNS, no paga y no lee datos de clientas. No se programa solo: alguien lo corre a mano.
- **Dónde está:** carpeta `r03/monitor/` del paquete (`monitor.mjs`) y, copiado, en el repositorio del proyecto: `shopify-migration/launch/official-03p/r03/monitor/`. Su guía en español, escrita para ti y para cualquier asistente de IA, es **`monitoring-runbook-es.md`** (misma carpeta): explica cada chequeo, qué hacer ante cada falla y cómo registrar un incidente.
- **Cómo se corre** (lo hace quien te ayude, con Node instalado): `node monitor.mjs --full` = revisión completa (~40 segundos); `node monitor.mjs --quick` = rápida (DNS, candado, redirecciones, inicio). Resultado: TODO OK (código 0), AVISOS (1) o CRÍTICO (2). Espera al menos 10 minutos entre corridas completas.
- **Primera corrida real: 2026-10-02 a las 12:19 (Bogotá): TODO OK.**
- **Vigilancia reforzada:** del 2026-10-02 11:23 al 2026-10-05 11:23; la guía recomienda una completa a las 08:00 y a las 20:00 y una rápida cada 3 horas, más una corrida 5–10 minutos después de cada cambio (DNS, tema, precios, envío, Wompi) y de cada pedido real. Después, una completa al día.
- **Lo que el monitor NO puede ver (revísalo tú a mano):** que Wompi siga "Activa" y en modo real, que Wompi aparezca en la pantalla de pago, que lleguen los correos de la tienda y las tarifas de Envia. Por eso la rutina de 5 minutos (Manual, sección 3) sigue siendo necesaria.
- Si marca una alerta: no cambies nada por tu cuenta; repite una vez a los 5 minutos; si sigue, abre `monitoring-runbook-es.md` (sección 5) o la Parte 2 de este documento y pide ayuda.
- **Tablero semanal:** tu página privada "Tablero Radaelli Swimwear" (`https://claude.ai/artifact/Di9pTQW3cvGhCzG8eSV1GN`) muestra las cifras de la semana (Shopify, Meta, Wompi) y dice "seguir probando" mientras falten tus costos reales (documento 09).

## 5. CONTENCIÓN (parar nuevas ventas de forma segura)
Hay una sola forma segura y se deshace con un clic:
1. **Contraseña a la tienda:** Admin > Tienda online > Preferencias > activar protección con contraseña (o el selector Privado/Público de esa pantalla; `CONFIRMAR_EN_ADMIN`). Nadie ve la tienda; el dominio, el certificado y Wompi quedan intactos. Para volver a abrir: desactiva la contraseña en esa pantalla (o el botón "Lanzar tienda" si Shopify lo muestra). Es lo más visible.
Úsala solo si hay dinero en riesgo o nadie puede comprar; para fallas pequeñas no pauses toda la tienda.
**NO uses el botón rojo "Desactivar" de Wompi** (Configuración > Pagos > Wompi). Antes se recomendaba como contención; desde el 2026-10-02 es regla del equipo no pulsarlo: no se ha comprobado qué conserva Shopify al desactivar, y podrías perder la conexión con Wompi (llaves y URL de eventos) y tener que reconectarla. Wompi debe seguir "Activa".
Avisa a tus clientes por Instagram/WhatsApp si dura más de 30 minutos.

## PARTE 2 — Playbook de fallas

Formato: síntoma · **3 primeras cosas a revisar** · cuándo escalar.

### 6. Aparece la página de contraseña
(Desde el 2026-10-02 ~11:23 la tienda NO debe pedir contraseña: se quitó con "Lanzar tienda". Si aparece, algo la volvió a activar o el plan tiene un problema.)
1. Tienda online > Preferencias: ¿la contraseña está activada? Desactívala.
2. Configuración > Facturación: ¿hay un cobro rechazado? Una cuenta sin pago puede suspender la tienda.
3. ¿Lo ve solo una persona? Prueba en ventana privada o con datos móviles (puede ser caché).
Escalar: si la facturación está bien y sigue → Soporte de Shopify.

### 7. Error en el pago (checkout)
1. ¿Wompi está Activa? Configuración > Pagos.
2. ¿El producto está disponible? Prueba otro producto.
3. ¿Falla en todos los dispositivos? Prueba celular y computador.
Escalar: si nadie puede pagar → Contención (sección 5) y pide ayuda.

### 8. Wompi no aparece como método de pago
1. Configuración > Pagos: ¿Wompi figura "Activa"? (Desde el 2026-10-02 debe decir "Activa" y NO "Modo de prueba"; si dice "Modo de prueba" no cobrará dinero real. Nunca pulses el botón rojo "Desactivar".)
2. ¿Aparece algún aviso de facturación o límite en Shopify?
3. Configuración > Checkout: ¿contacto por correo y teléfono obligatorio siguen puestos? (Wompi los exige.)
Escalar: si no se resuelve en 15 min → Contención y soporte de Wompi.

### 9. Tarifa de envío equivocada o "no hay envío disponible"
1. ¿A qué departamento va el pedido? Compara con la tabla de zonas (sección 10).
2. ¿El subtotal está sobre $299.900? Con $299.899 paga $9.900 en Zona 1; con $299.900 es gratis.
3. Configuración > Envío y entrega > Perfil general: ¿están las 5 zonas con sus 2 tarifas? ¿Se incluyen los 29 productos? (`CONFIRMAR_EN_ADMIN`)
Escalar: si falta una zona o tarifa → pide ayuda. No inventes tarifas ni cambies el umbral.

### 10. Tabla de zonas y tarifas (para comparar)
| Zona | Departamentos | Tarifa (< $299.900) |
|---|---|---|
| 1 | Atlántico | $9.900 |
| 2 | Bolívar, Magdalena, Córdoba, Sucre, La Guajira, Cesar | $12.900 |
| 3 | Bogotá D.C., Antioquia, Valle del Cauca, Santander, Risaralda, Caldas, Quindío, Cundinamarca, Norte de Santander | $17.900 |
| 4 | Boyacá, Tolima, Huila, Meta, Nariño, Cauca, Caquetá, Arauca, Casanare, Chocó, Putumayo | $21.900 |
| 5 | San Andrés y Providencia, Amazonas, Vaupés, Guainía, Guaviare, Vichada | $44.900 |
Desde $299.900: "Envío estándar gratis" en todas las zonas.

### 11. Producto "agotado" o inventario raro
1. Productos > Inventario: ¿la talla tiene Disponible > 0? ¿Es negativo?
2. Si **todo** figura agotado: puede ser el envío (sin zona o sin tarifa) o el mercado Colombia desactivado. Revisa Configuración > Mercados > Colombia "Activo" y la sección 9.
3. Si un producto no aparece: ¿está Activo y publicado en "Tienda online"? Revisa Productos > el producto.
Escalar: todo agotado, o negativos repetidos.

### 12. Mensajes 429 / "Un momento..."
Shopify frena a quien hace muchas visitas seguidas desde la misma conexión.
1. Espera 2 minutos y no recargues repetidamente.
2. Prueba con otra conexión (datos móviles).
3. ¿Le pasa a clientes reales? Pregunta cuántos y desde cuándo.
Escalar: si varios clientes lo ven o hay una campaña de anuncios activa → soporte de Shopify (posible tráfico automático).

### 13. Aviso de seguridad / SSL en el dominio
(Estado 2026-10-02: certificado Let's Encrypt válido para el dominio y `www` hasta 2026-12-31; `http` va a `https`; `www` va al dominio sin `www`.)
1. Configuración > Dominios: ¿el dominio dice "Conectado" y SSL activo? Si dice pendiente, espera (hasta 1 h, rara vez más).
2. dnschecker.org: ¿A = `23.227.38.65` y www = `shops.myshopify.com`? (documento 01)
3. ¿Quedó otro registro A/AAAA para `@` en Hostinger? Pide ayuda antes de borrar.
Escalar: pasadas 2 horas sin candado → decide rollback (documento 01, sección 5).

### 14. La tienda no abre
1. Prueba `https://wgcvpd-ib.myshopify.com`. Si abre pero el dominio no: es DNS/SSL (sección 13).
2. Mira `shopifystatus.com`: ¿Shopify tiene una caída general?
3. ¿Contraseña activada o cobro rechazado? (sección 6)
Escalar: si ni la dirección myshopify abre → soporte de Shopify.

### 14.1 Al abrir un enlace del Admin dice que tu cuenta "no tiene permiso"
Pasa cuando el navegador tiene abierta otra cuenta de Shopify (por ejemplo una personal) distinta a la de la tienda.
1. En esa pantalla pulsa **"Cambiar de cuenta"**.
2. Elige el Gmail de la marca (`radaelliswimwear@gmail.com`), la cuenta dueña de la tienda.
3. Si sigue igual: abre una ventana privada y entra a `https://admin.shopify.com/store/wgcvpd-ib`.
No cambies permisos ni crees usuarios para "arreglarlo".

### 15. Pago aprobado sin pedido / correo que no llega
Documento 02 (caso C) y documento 07 (sección 6).

### 16. Después de cualquier incidente
1. Anota qué pasó y a qué hora.
2. Verifica con una compra de prueba sin pagar.
3. Si hubo dinero involucrado: concilia Wompi vs Shopify.
4. Si fue por un cambio tuyo: deshazlo (documento 06) y pide ayuda.

## 17. QUÉ HACER / QUÉ NO HACER en una falla
- Haz: respirar, anotar la hora, tomar capturas, contener si hay dinero en riesgo.
- Haz: cambiar una sola cosa a la vez y volver a probar.
- No hagas: cambiar precios, envíos, impuestos o DNS en medio de la falla.
- No hagas: borrar productos, pedidos, temas o el dominio de Shopify.
- No hagas: pedir o dar claves por chat.

## 18. Cuándo pedir ayuda y qué llevar
Siempre: hora, qué hiciste justo antes, captura (sin claves), documento que seguiste.
Escalar de inmediato (Shopify, Wompi o IA): nadie puede comprar, hay dinero en riesgo, hay un aviso de seguridad o la tienda muestra datos que no debe.
