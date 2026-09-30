# 03E — Checkout baseline (Development Store, sin pagar)

- **Cuándo y dónde:** 2026-09-29, 11:53–11:59 (Bogotá). Theme "Radaelli RC1" en preview (`189072474431`, sin publicar; contenido **RC1.4** en ese momento; los hallazgos no dependen del theme).
- **Reglas cumplidas:**
  - no se escribió **ningún dato** en el checkout (ni email, ni dirección, ni teléfono);
  - no se pagó ni se creó ningún pedido;
  - no se cambió ninguna configuración de la tienda.
- **Único cambio de la prueba:** la preferencia de país de **la propia sesión del navegador** (cookie de localización del storefront), que después se devolvió a su estado original (US) y se vació el carrito.

## 1. Resultado con la sesión como la resuelve hoy la tienda (país = US)

| Chequeo | Resultado |
|---|---|
| Carrito → "Finalizar compra" (botón real del theme, `form action=/cart name=checkout`) | Abre `/checkouts/cn/<token>/es-us` |
| Producto real | 1 × BRISA NATURAL BEIGE / S: correcto (ítem, talla, imagen) |
| Moneda | **COP** ("COP $199,920.00") |
| Subtotal / total | $199.920: correcto. Es el precio de venta; el compare-at de $249.900 no se descuenta de nuevo |
| Descuentos duplicados | No: `total_discount` = 0; el −20% está en el precio |
| Envío | "Introducir la dirección de envío". Métodos: "Ingresa tu dirección…" |
| Impuestos | Sin línea de impuestos antes de la dirección (sin configurar, fuera de alcance) |
| Pago | **"Esta tienda no puede aceptar pagos en este momento"**: no hay proveedor de pagos activo, así que es imposible completar un pedido (seguro) |
| Contacto | Campo email + casilla "Enviarme novedades y ofertas" (sin marcar) + "Iniciar sesión" (New Customer Accounts) |
| Volver al carrito | El ícono de bolsa del header del checkout enlaza a `/cart` |
| Consola / enlaces rotos | Sin errores observados; los enlaces del checkout apuntan a `/cart` |
| Mobile | **No medido**: la ventana de Chrome no permitió redimensionar. El checkout es UI nativa de Shopify (no del theme) |

## 2. Hallazgos críticos (bloquean el lanzamiento; owner-only)

### C1. La tienda resuelve a los visitantes a **Estados Unidos**

- `Shopify.country = "US"` para una sesión cuyo navegador Shopify detecta en **Colombia** (`/browsing_context_suggestions.json` → CO).
- El checkout abre en `es-us`: país por defecto "Estados Unidos", estados de EE. UU. y formato numérico de EE. UU. ("$199,920.00" en lugar de "$ 199.920").
- **Causa:** el mercado principal sigue siendo Estados Unidos (la tienda se creó en EN/USD; en 03B se agregó Colombia sin cambiar el principal). El theme no tiene selector de país, igual que el sitio real, que es solo Colombia.
- **Acción owner:**
  - Configuración > Mercados: Colombia como mercado principal;
  - desactivar o quitar Estados Unidos si no se va a vender allí;
  - Configuración > General: dirección de la tienda en Colombia.

### C2. Con país **Colombia**, **todo el catálogo figura AGOTADO**

- Medido con la sesión en CO (`/localization` → `country_code=CO`):
  - `/products/<handle>.js`: **0 de 29 productos disponibles**;
  - la ficha muestra "Producto agotado" con el botón deshabilitado;
  - `/cart/add.js` responde **422**: "El artículo 'BRISA NATURAL BEIGE - S' ya está agotado.";
  - la colección Oasis Natural muestra **10/10 tarjetas con el badge "Agotado"**.
- **Causa verificada, solo lectura en el Admin:** Configuración > Envío y entrega > Perfil general tiene **una sola zona, "Domestic – Estados Unidos"**:
  - Express 15,00 y Standard 8,00, "gratis a partir de 70,00": tarifas por defecto de una tienda nueva;
  - la sucursal de procesamiento "Shop location" está en **Estados Unidos**;
  - **no existe zona Colombia**, y Shopify no ofrece productos para un país sin zona de envío.
- **Por qué no se vio antes:** el QA de 03C/03D corrió con la sesión resuelta a US.
- **Acción owner (una sola sesión en el Admin):**
  - Sucursales: dirección en Colombia;
  - Envío y entrega:
    - crear la zona **Colombia** con las tarifas decididas (ver `shipping/03E-shipping-source-of-truth.md`);
    - quitar o ajustar las tarifas de EE. UU. si no se venderá allí.
- **Relación con el envío gratis:** además, `free_shipping_rate_confirmed` debe seguir en OFF hasta que exista la tarifa gratis desde $299.900 en esa zona.
- **No se tocó:** crear zonas o tarifas está en "DO NOT TOUCH" (tarifas de envío finales).

## 3. Qué se puede re-probar en cuanto la dueña haga C1 y C2

1. Visitante nuevo → `Shopify.country = CO` y ficha "Agregar al carrito" habilitada.
2. Carrito → checkout en `es-co`: país Colombia, departamentos de Colombia, formato "$ 199.920".
3. Con una dirección de prueba de la dueña: tarifas de la zona Colombia y la regla `>=` 299.900.
4. Pago: sigue imposible hasta activar un proveedor (ver `payments/03E-wompi-shopify-feasibility.md`).
