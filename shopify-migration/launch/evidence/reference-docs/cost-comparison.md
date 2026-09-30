# Plan de Shopify y modelo de costos

Parte de la [auditoría de viabilidad de migración a Shopify](../shopify-migration-feasibility-audit.md). Precios de Shopify investigados el 2026-09-26 directamente contra `shopify.com/pricing` (verificados carácter por carácter contra el HTML crudo de la página en una segunda pasada independiente). Precios en **USD**, que es como Shopify cobra sin importar el país del comercio.

---

## 7. Plan de Shopify requerido

### Requisitos evaluados
Dominio propio, theme 100% custom (Liquid), códigos de descuento, GA4 + Meta Pixel/CAPI, cuentas de cliente, un proveedor de pago externo (Wompi — obligatorio, ver abajo), volumen inicial bajo/medio, mínimo 2 cuentas de staff (fundadora + al menos una persona más), envíos solo dentro de Colombia, algo de personalización de checkout (deseable, no imprescindible).

### Tabla de planes (HECHO OFICIAL, shopify.com/pricing)

| Plan | Mensual | Anual (facturado) | Cuentas de staff | Comisión por proveedor externo | Personalización de checkout | Acceso a datos vía API |
|---|---|---|---|---|---|---|
| Starter | $5/mes | — | 0 | No aplica (no es tienda completa) | — | — |
| Basic | $25/mes | $19/mes | **0 adicionales** | 2.0% | Limitada | Limitado |
| **Grow** (antes "Shopify") | **$65/mes** | **$49/mes** | **5** | **1.0%** | Limitada | **Completo** |
| Advanced | $399/mes | $299/mes | 15 | 0.6% | Limitada | Completo |
| Plus | desde $2.300/mes (contrato 3 años) | — | Ilimitadas | 0.2% | **Completa** | Completo |

Themes/templates y códigos de descuento están **incluidos en todos los planes pagos** — confirmado directamente en la página oficial.

### Plan mínimo viable: **Grow**

**Basic queda descartado de entrada**: 0 cuentas de staff adicionales (solo el login de la dueña) — no cumple el requisito de "fundadora + al menos una persona más", sin ambigüedad. **Grow** ($65/mes, o $49/mes pagando anual) es el plan mínimo real: 5 cuentas de staff, theme custom, códigos de descuento, y funciona con un proveedor de pago externo (con el recargo del 1%, ver abajo).

Advanced solo se justificaría si el volumen creciera lo suficiente para que el 0.6% vs. 1% importe, o si se necesitaran más de 5 cuentas de staff — no aplica a un relanzamiento de bajo/medio volumen.

### ¿Hace falta Shopify Plus? **No.**

- El editor de checkout completo (Information/Shipping/Payment steps) es exclusivo de Plus — confirmado literalmente en la documentación de Shopify.
- La personalización de la página de Gracias/Estado del pedido SÍ está disponible en todos los planes excepto Starter.
- El editor básico de marca del checkout (logo, colores, fuentes) no aparece restringido a Plus en la documentación oficial revisada.
- `checkout.liquid` (personalización clásica de checkout) se está retirando de **toda la plataforma**, Plus incluido (ya venció para Plus, vence el 26/08/2026 para el resto) — ninguna opción, ni pagando Plus, ofrece ya la personalización "de código" clásica del checkout completo.
- Dado que "algo de personalización de checkout" era un "sería lindo tener", no un requisito duro, y que lo único exclusivo de Plus relevante acá es precisamente esa personalización profunda que Radaelli no pidió como imprescindible, **Plus sería sobredimensionado** para esta etapa — el salto de precio ($65 → $2.300+/mes) no se justifica.

### Comisión por proveedor externo — inevitable en Colombia

Como Shopify Payments no existe en Colombia (ver wompi-payments.md), la comisión de proveedor externo **siempre aplica**: **1% en Grow**, encima de lo que Wompi ya cobra por su cuenta. Esto no es evitable subiendo de plan salvo yendo a Advanced (0.6%) o Plus (0.2%) — ninguno de los dos se justifica solo por esto al volumen actual.

### Apps probablemente necesarias

Shopify no tiene wishlist nativa — es un requisito real de Radaelli hoy. Precios de apps de terceros (no son precios de Shopify, cambian con frecuencia, suelen escalar con volumen de pedidos):

| App | Rango de precio aproximado |
|---|---|
| Opciones freemium (ej. "Wishlist Hero") | Gratis hasta cierto volumen |
| Gama baja (ej. "Smart Wishlist") | ~$4-5 USD/mes |
| Gama media (ej. Swym Wishlist Plus, o Vitals como bundle de 40+ herramientas) | ~$30 USD/mes |
| Gama alta ligada a volumen (ej. Growave) | ~$49 USD/mes y sube con el volumen |

---

## 15. Modelo de costos

### CUSTOM ACTUAL (mensual, aproximado)

**No se inventan precios actuales de Vercel/Neon/Resend/Cloudinary** — estos dependen del plan específico que Radaelli ya tiene contratado hoy con cada proveedor, información que esta auditoría no tiene visibilidad para confirmar sin acceso a esas cuentas de facturación. Lo que sí se puede afirmar:

| Rubro | Clasificación | Nota |
|---|---|---|
| Vercel (hosting) | **MANDATORY** hoy | Plan actual desconocido para esta auditoría — confirmar con la cuenta real |
| Neon (Postgres) | **MANDATORY** hoy | Ídem |
| Resend (email) | **MANDATORY** hoy | Ídem |
| Cloudinary (imágenes) | **MANDATORY** hoy | Ídem |
| Dominio (`radaelliswimwear.com`) | **MANDATORY**, se mantiene igual en ambos escenarios | No cambia con la migración |
| Comisión de Wompi | **MANDATORY**, se mantiene igual en ambos escenarios (Wompi cobra lo mismo lo use quien lo use) | Confirmar tarifa vigente directamente con Wompi si hace falta un número exacto |

### SHOPIFY (mensual, aproximado)

| Rubro | Costo | Clasificación |
|---|---|---|
| Plan Shopify Grow | $65 USD/mes ($49 si se paga anual) | **MANDATORY** |
| Comisión adicional por proveedor externo (Wompi) | 1% de cada venta, encima de la comisión propia de Wompi | **MANDATORY** (estructural en Colombia) |
| App de wishlist | ~$0-30 USD/mes según la elegida | **LIKELY** (requisito funcional real, no cosmético) |
| Apps adicionales (reseñas, upsell, sincronización de email marketing) | Variable, no cotizado en este audit | **OPTIONAL**, a evaluar según necesidad real |
| Dominio | Igual que hoy | Sin cambio |
| Resend u otro ESP para marketing/emails con reintento garantizado | Depende de la decisión en seo-analytics.md | **LIKELY** (Shopify no cubre marketing ni da garantías de reintento) |
| Comisión de Wompi | Igual que hoy | Sin cambio — Wompi cobra lo mismo en ambos escenarios |
| Middleware/app custom para recuperación automática de pagos huérfanos (si se decide replicar esa garantía) | Costo de desarrollo, no de suscripción — ver migration-roadmap.md | **OPTIONAL pero recomendado** dado el hallazgo de wompi-payments.md |

**Conclusión de costos**: el piso mensual NUEVO y cuantificable de mover a Shopify es de aproximadamente **$65-95 USD/mes** (plan Grow + wishlist), más un **1% adicional sobre cada venta** que hoy no se paga. Esto se suma a lo que ya se paga por Wompi — no lo reemplaza. Lo que se AHORRARÍA en Vercel/Neon/Cloudinary/Resend depende enteramente del plan actual de cada uno, que esta auditoría no puede cuantificar sin acceso a esas facturas — es el dato que falta para tener una comparación de costos verdaderamente cerrada, y debería completarse antes de una decisión final.
