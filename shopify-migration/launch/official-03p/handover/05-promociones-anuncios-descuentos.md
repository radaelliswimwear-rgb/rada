# 05 — Promociones, anuncios y descuentos

Para: Daniela. Aquí aprendes a cambiar la barra de anuncio, entender el "20 % de descuento" y lanzar otra promoción sin romper precios.

## 1. Cómo funciona HOY la promoción (hechos medidos el 2026-10-02)
- Las 98 variantes tienen **precio tachado** (precio de comparación) y el **precio actual es exactamente el 80 %** de ese tachado. Es decir, el 20 % está "dentro del precio", **no es un descuento de Shopify**.
- La etiqueta **-20 %** de cada prenda se calcula sola: (tachado − actual) / tachado. No hay un interruptor para ocultarla. Si quitas el precio tachado, desaparecen el tachado y la etiqueta.
- Tres lugares dicen "20 %":
  1. Barra negra de arriba: "20% DE DESCUENTO EN TODA LA TIENDA" (texto escrito a mano en el tema).
  2. Banner de la página de inicio: "Por tiempo limitado" + título "20% de descuento en toda la tienda".
  3. Precio tachado + etiqueta -20 % en tarjetas y fichas (el carrito solo muestra el precio actual).
- La promoción **no tiene fecha de fin**. La ley colombiana pide informar condiciones y fechas o unidades de una promoción (Ley 1480 de 2011, art. 33, `[validar]` con tu asesor). Recomendación: poner fecha de fin en el texto. Decisión tuya (GAP-11).
- Descuentos de Shopify (códigos o automáticos): no se pudieron leer por sistema. Mira Admin > **Descuentos** y anota cuáles hay (`CONFIRMAR_EN_ADMIN`).

### Los 4 pares de precios (guárdalos: sirven para volver atrás)
| Precio actual (80 %) | Precio tachado (lista) | Variantes |
|---|---|---|
| $159.920 | $199.900 | 18 |
| $167.920 | $209.900 | 36 |
| $183.920 | $229.900 | 32 |
| $199.920 | $249.900 | 12 |

## 2. Cambiar el texto de la barra de anuncio (la forma segura, 3 minutos)
1. Admin > Tienda online > Temas.
2. En el tema publicado (Radaelli RC1.10) pulsa **Personalizar**.
3. Arriba, en el selector de página, deja "Página de inicio".
4. En la barra izquierda, arriba del todo, abre el grupo de encabezado ("Header group") y entra a **Announcement bar**. (El nombre de la sección está en inglés; sus campos están en español.)
5. Campo **Texto**: escribe el nuevo mensaje. Se verá en mayúsculas automáticamente. Ejemplo: `20% de descuento hasta el 31 de octubre`.
6. Opcional: **Enlace**, **Color de fondo**, **Color de texto**, **Alineación**.
7. **Texto vacío = la barra desaparece.**
8. Pulsa **Guardar** (arriba a la derecha). Abre la tienda en el celular y revisa.

Antes de editar el tema publicado, duplica el tema (documento 06).

## 3. Cambiar el banner de la página de inicio
1. Mismo editor > página de inicio > sección **Promo banner**.
2. Campos: "Texto pequeño superior" (hoy "Por tiempo limitado"), "Título", "Texto del botón", "Link del botón".
3. Si no hay fecha de fin, borra "Por tiempo limitado" y deja el campo vacío (`CONFIRMAR_EN_ADMIN`: algunos campos vacíos vuelven al valor por defecto; revísalo en la vista previa).
4. Guardar y revisar.

## 4. Elegir qué promoción hacer (árbol de decisión)

| Quiero... | Qué hago | Dónde | Riesgo |
|---|---|---|---|
| Solo cambiar el mensaje (misma promo) | Sección 2 y 3 | Editor del tema | Bajo |
| Un cupón extra (ej. 10 % por código) | Descuento por código | Descuentos | El cupón se suma sobre el 20 % ya aplicado |
| Un descuento sin código | Descuento automático | Descuentos | Igual |
| Envío gratis por cupón | Descuento de tipo envío | Descuentos | Choca con el umbral de $299.900 |
| Cambiar el 20 % a otro % | Cambiar **precio actual** (no el tachado) en las 98 variantes | Productos (bulk) | Alto: ver sección 6 |
| Terminar la promoción | Quitar tachado o volver al precio de lista | Productos (bulk) | Alto: ver sección 7 |

### Descuentos: código vs automático
| | Código | Automático |
|---|---|---|
| El cliente | escribe el código en el pago | no hace nada |
| Cuándo usar | campañas, influencers, correo, WhatsApp | ofertas para todos |
| Control | límites de uso, un uso por cliente, fechas | fechas |
| Dónde | Descuentos > Crear descuento > Código de descuento | Descuentos > Crear descuento > Automático |
- Siempre define fecha de inicio **y de fin**.
- Define compra mínima y a qué productos aplica.
- Nombre del código: corto, sin tildes (ej. `BIENVENIDA10`).
- Antes de publicarlo, prueba un carrito (sin pagar): ¿el total es el esperado? ¿el envío gratis sigue en $299.900? (con cupones no está probado si el umbral cuenta el valor antes o después del cupón: `CONFIRMAR_EN_ADMIN`).
- Combinaciones (si puedes sumar dos descuentos): déjalas apagadas salvo que lo decidas.
- Margen: calcula el precio final contra tu costo, la comisión de Wompi (`PENDIENTE_DUEÑA`), el 2 % de Shopify y la guía.

## 5. Revisión rápida después de cualquier cambio
1. Vista previa en celular: barra, banner, un producto, el carrito.
2. ¿El mensaje de la barra coincide con lo que realmente se cobra?
3. Agrega un producto y llega al pago (no pagues): total correcto, Wompi visible.
4. Prueba un carrito de $299.899 y uno de $299.900 en Barranquilla: $9.900 y gratis.
5. Pon recordatorio para terminar la promo.

## 6. Cambiar el porcentaje del precio (ej. de 20 % a 30 %)
Solo con ayuda. Idea: el tachado se queda; el **precio actual** pasa a (1 − %) del tachado. Para 30 %:
$139.930 / $146.930 / $160.930 / $174.930 (ejemplo de cálculo, no recomendación).
1. Haz respaldo (documento 08: exportar productos).
2. Prepara con la IA una tabla: variante, precio nuevo.
3. Aplica en Productos > selecciona todo > Editar (editor en bloque). `CONFIRMAR_EN_ADMIN`
4. La etiqueta "-%" se actualiza sola.
5. Cambia el texto de la barra y del banner.
6. Revisa 5 productos de cada par de precios y el umbral de envío (con precios más bajos se necesitan más prendas para llegar a $299.900).

## 7. Quitar las etiquetas "-20 %" (terminar la promoción)
Dos formas (se hacen sobre las 98 variantes, con respaldo previo):
- **A. Dejar los precios actuales como precio normal**: borra todos los "Precio de comparación". Se van tachado y -20 %. Los precios se quedan en $159.920–$199.920.
- **B. Volver a precio de lista**: precio actual = antiguo tachado (sube 25 %) y borra el comparación. Usa la tabla de la sección 1.
Además:
1. Quita o cambia la barra (sección 2) y el banner (sección 3) en el mismo momento.
2. Revisa "Términos y condiciones": dice que los precios "incluyen los descuentos vigentes".
3. Revisa umbral de envío y carritos de prueba.
4. Solo quitar la barra NO quita el tachado ni las etiquetas.

## 8. Mensajes de envío gratis (decisión pendiente)
El tema trae apagados "La tarifa de envío gratis ya está configurada en Shopify" y "Mostrar el progreso de envío gratis en el carrito" (ambos APAGADOS hoy). La tienda sí tiene envío gratis desde $299.900. Si los enciendes: Editor > Configuración del tema > grupo "Cart" > esos dos interruptores; el valor "Umbral de envío gratis" debe decir 299900. Si algún día cambias el umbral en Configuración > Envío y entrega, debes cambiarlo en las 5 zonas (2 tarifas cada una) y en el tema: pide ayuda. Decisión tuya antes de lanzar o en la primera semana (GAP-10).

## 9. QUÉ HACER / QUÉ NO HACER
- Haz: respaldar productos antes de tocar precios.
- Haz: fecha de fin en toda promoción.
- Haz: probar un carrito antes y después.
- No hagas: editar precios uno por uno en horas de venta.
- No hagas: dejar la barra diciendo algo que ya no es cierto.
- No hagas: mezclar dos cupones sin probar.
- No hagas: borrar el precio de comparación "por probar".

## 10. Qué pedir a la IA (copia y pega)
- "Quiero cambiar la barra de anuncio a [texto] hasta [fecha]. Guíame con el documento 05 sección 2."
- "Quiero crear un cupón [nombre] de [X]% para [colección/todo] del [fecha] al [fecha]. Explícame los pasos en Descuentos y qué probar."
- "Quiero cambiar la promoción de 20 % a [X]%. Prepárame la tabla de precios nuevos de las 98 variantes y cómo cargarla con respaldo."
- "Terminó la promo: dame el plan para quitar tachado y etiquetas -20 % con las opciones A y B del documento 05."
Adjunta capturas sin datos privados.

## 11. Cuándo pedir ayuda
- Precios incoherentes tras un cambio.
- Un descuento se aplica donde no debía.
- El envío gratis falla con un cupón.
- No sabes si una promo cumple las reglas de publicidad: consulta a tu asesor.
