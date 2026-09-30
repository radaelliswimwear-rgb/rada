# 03O — Runbook de transferencia y plan para 03P (PREPARADO, NO EJECUTADO)

*03O no transfiere, no elige plan, no cobra y no publica. Esto es lo que 03P deberá hacer, con re-verificación en vivo de la pantalla de planes y de la documentación oficial en ese momento.*

## Antes de transferir (Claude)
1. Re-verificar línea base: Colombia/COP/Bogotá, RC1.10 sin publicar (parity 8/8), 29/98/95, inventario 98/98 con 128 unidades, 4 páginas legales (0 404), Wompi en modo prueba, pasarela de prueba de Shopify activa.
2. Respaldo final en `shopify-migration-backup` y exportación del tema RC1.10 (`shopify theme pull` del tema sin publicar).
3. Dejar por escrito los valores provisionales: paquete 15×10×5 cm, 500 g por variante.

## Durante la transferencia (solo la dueña)
1. Aceptar la transferencia de la tienda («Transferencia de cliente») desde su correo/cuenta.
2. **Elegir plan y facturación.** Reglas para la elección (verificar en la pantalla de planes del momento):
   - La dueña exige **tarifas de envío en vivo de un tercero (Envia) bajo COP 299.900**. Eso es «envío calculado por transportista» (CCS de terceros).
   - Según Shopify: incluido en **Advanced** y **Plus**; **Grow** solo con facturación anual o con un cargo mensual adicional; **Basic/Starter no lo incluyen**.
   - Comparar **solo** los planes y opciones que hoy admitan CCS de terceros: Grow anual o Grow + cargo de CCS (si se ofrece), y Advanced. Plus solo si de verdad aplica. No vender de más.
   - No elegir Basic/Starter mientras las tarifas en vivo sigan siendo obligatorias.
3. Tarjeta de facturación (solo ella).

## Inmediatamente después, antes de publicar (Claude, con OWNER AUTH puntual)
1. **Envia:** abrir la app; confirmar «Tienda ya instalada» y que el transportista se registra; ejecutar UNA prueba de checkout de 1 prenda (< COP 299.900, sin pagar) y verificar que aparece la tarifa en vivo. Si no aparece, revisar el plan/CCS y contactar a soporte de Envia.
2. **Wompi:** apagar el «Modo de prueba» (hoy encendido) y desactivar la pasarela de prueba de Shopify, **solo con aprobación escrita de la dueña**; las llaves de producción y la URL de eventos de producción ya las puso ella (confirmado por ella; no verificado por Claude). Un pago real mínimo solo con su aprobación escrita.
3. **Idioma principal:** si aún se desea español como principal, respaldo previo del tema y de las traducciones, cambiarlo, repetir parity 98/98 y Q8; si algo cambia, restaurar y volver a inglés.
4. **Datos históricos:** ver `launch/03o/historical-data-procedure.md` (exportación autorizada).
5. Quitar la contraseña de la tienda, conectar el dominio y publicar RC1.10: runbook P13–P15 (corte).

## Reversión
- Tema: RC1.9 y la Horizon original siguen como retorno.
- Envia: desinstalar la app si no se usa.
- Wompi: volver a modo prueba desde Configuración > Pagos.

## No olvidar
- La numeración real de pedidos empieza en #1003 (los #1001 y #1002 de prueba están archivados).
- Contraste de botones: riesgo de accesibilidad aceptado por la dueña (opción C); RC1.10 sin cambios visuales.
