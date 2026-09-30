# 03F — Checkout en móvil: línea base

**Estado: NO MEDIBLE en móvil en esta sesión, con lo que sí está verificado en escritorio (03E) y lo que hace falta para cerrarlo.**

## 1. Por qué no se midió en 390 px

- **No se pudo redimensionar la ventana de Chrome a un viewport móvil:** el ajuste no cambia `innerWidth` (queda en 1334 px), porque la ventana está oculta por otra (ver `theme/03F-performance-final.md` § 1).
- **El checkout no se puede renderizar en un iframe** (Shopify lo bloquea con `X-Frame-Options`), así que tampoco hay forma de mostrarlo a 390 px dentro de otra página.
- **No se creó ningún pedido ni se escribió ningún dato en el checkout,** por la regla de 03E/03F.
- **Además, hoy el catálogo figura AGOTADO para Colombia** (C2). Con el país en EE. UU. el checkout abre, pero con país Colombia ni siquiera se puede agregar un producto al carrito.

## 2. Lo verificado en 03E (mismo checkout, escritorio, sesión en EE. UU.)

| Chequeo | Resultado |
|---|---|
| Carrito → "Finalizar compra" | Abre `/checkouts/cn/<token>/es-us` |
| Ítem, variante y talla | BRISA NATURAL BEIGE / S: correctos, con imagen |
| Moneda | COP |
| Subtotal y total | $199.920: correcto |
| Doble descuento | No (`total_discount` = 0; el −20% está en el precio) |
| Envío / impuestos | "Introducir la dirección de envío" / sin impuestos antes de la dirección |
| Pago | "Esta tienda no puede aceptar pagos en este momento" |
| Volver al carrito | El ícono de la bolsa del encabezado del checkout enlaza a `/cart` |
| Idioma y país por defecto | `es-us` y "Estados Unidos" (C1) |

## 3. Por qué el móvil no debería sorprender

El checkout es **UI nativa de Shopify**, no del theme: el mismo HTML, con un diseño de una columna en móvil. El theme solo controla el carrito y el botón "Finalizar compra", que a 320–430 px ya están dentro de la matriz responsive real (63/63 sin overflow).

## 4. Para cerrarlo (2 min, cuando se pueda)

Después de resolver C1 y C2 (`theme/03F-owner-market-colombia-runbook.md` y `shipping/03F-owner-shipping-runbook.md`):

1. Con la ventana de Chrome visible y en 390 px (o el móvil real de Daniela con el enlace de vista previa), agregar 1 producto.
2. Abrir el checkout y comprobar: el resumen del pedido (ítem, talla, subtotal, COP), el idioma y el país por defecto (`es-co`, Colombia), el orden de los campos, el botón de pago y volver al carrito.
3. **No completar el pago ni crear un pedido.**
