# Migración de datos

Parte de la [auditoría de viabilidad de migración a Shopify](../shopify-migration-feasibility-audit.md). Basado en lectura directa de `prisma/schema.prisma` y `lib/auth/password.ts`.

Estado actual real de los datos: **etapa temprana / bajo volumen**. El propio `prisma/seed.ts` documenta que el 15/09/2026 se eliminaron cuentas demo porque el sitio ya está en producción real; los números de pedido (autoincrementales desde 1000, con ejemplos reales citados en comentarios de código como #1005, #1010, #1011, #1058) indican del orden de decenas a cientos de pedidos reales — no miles. Esto reduce significativamente el riesgo/esfuerzo de la migración de datos comparado con un comercio establecido de alto volumen.

---

## PRODUCTS

| Campo | Clasificación | Nota |
|---|---|---|
| Nombre, descripción, precio, color, categoría | **MIGRATE** | Mapea 1:1 a Product de Shopify |
| Tallas/variantes/stock | **MIGRATE** | Shopify Variants soporta esto nativamente (y hasta 3 ejes, más flexible que el modelo actual de un solo eje) |
| SKU | **MIGRATE** | Directo |
| Imágenes | **MIGRATE** | Re-subir a Shopify Files o mantener Cloudinary + referenciar URL (decisión de arquitectura, no de datos) |
| Colecciones (Category) | **MIGRATE** | Shopify Collections — perder el discountPercent a nivel categoría requiere rediseño (ver cascada de descuentos) |
| Campos SEO (si existen: meta title/description) | **MIGRATE** | Vía metafields SEO nativos de Shopify |
| Featured flag, vistas (realViews/promotionalViews) | **RECREATE / DO NOT MIGRATE** | "Featured" se reconstruye como colección manual o metafield; los contadores de vistas son datos de comportamiento de bajo valor histórico — no vale la pena migrarlos |

## CUSTOMERS

| Campo | Clasificación | Nota |
|---|---|---|
| Cuentas (nombre, email, rol) | **MIGRATE** | Shopify Customers vía CSV import nativo |
| Direcciones | **MIGRATE** | Shopify Customer Addresses |
| Historial de pedidos | **MIGRATE** (ver ORDERS) | Se importa junto con los pedidos, asociado por email |
| **Contraseñas** | **REQUIRES DECISION — NO se pueden migrar** | Ver análisis dedicado abajo |

### Contraseñas — análisis específico (obligatorio por el encargo)

**No se puede asumir que los hashes de Prisma se pueden importar a Shopify.** Confirmado leyendo `lib/auth/password.ts`:

- Cuentas nuevas: **scrypt** (nativo de Node, `crypto.scrypt`), salt aleatorio de 16 bytes, clave derivada de 64 bytes, formato `"salt:hash"`.
- Cuentas legadas (anteriores al Sprint 26, incluidas las 3 cuentas admin originales): **SHA-256 sin sal**, calculado originalmente del lado del cliente.

Ninguno de los dos formatos es compatible con el sistema de autenticación de Shopify (que además, en su versión actual de "Customer Accounts", usa login **sin contraseña, por código de un solo uso (OTP) enviado por email** — ver seo-analytics.md). Esto significa dos cosas independientes:

1. **Técnicamente imposible** transportar el hash — ni siquiera con conversión, porque el algoritmo/parámetros son propios de este código, y aunque lo fueran, Shopify no expone una forma de insertar un hash de contraseña pre-calculado para el login clásico, y el sistema nuevo de cuentas ni siquiera usa contraseña.
2. **Consecuencia operativa real**: cualquier migración fuerza a **todas las clientas con cuenta** a un flujo de "recuperá/configurá tu acceso de nuevo" — ya sea un reset de contraseña (si se usara un sistema con contraseña) o, más probablemente dado el modelo OTP nativo de Shopify, simplemente un primer login con el código que Shopify manda por email. Esto debe comunicarse a las clientas explícitamente (ej. un email de "creamos tu cuenta nueva, así entrás") — no es un blocker técnico, pero sí un punto de fricción de UX y de comunicación que hay que planear, no improvisar.

**REQUIERE DECISIÓN**: confirmar si Shopify permite importar clientes con una cuenta ya "existente pero sin contraseña establecida" (compatible con el modelo OTP) de forma nativa vía CSV/API, o si cada clienta simplemente se trata como cuenta nueva en su primer login post-migración.

## ORDERS

| Campo | Clasificación | Nota |
|---|---|---|
| Pedidos reales entregados/pagados | **MIGRATE** | Vía importación de "pedidos archivados" (draft orders marcados pagados/cumplidos, o apps de migración) — Shopify no tiene un import nativo de pedidos históricos tan directo como el de productos/clientes; **requiere decisión** sobre herramienta (Shopify tiene partners/apps para esto, o se hace vía Admin API con un script) |
| Números de pedido existentes | **REQUIRES DECISION** | Shopify numera sus propios pedidos secuencialmente; preservar el número exacto requiere configuración explícita al crear la tienda (Shopify permite fijar el número de inicio) |
| Metadata histórica de pago (proveedor, referencia, últimos 4 dígitos) | **ARCHIVE** | Se preserva como referencia/nota en el pedido importado, no como un `Payment` funcional (Shopify no puede "reabrir" un cobro ya hecho en Wompi fuera de su plataforma) |
| Pedidos de prueba/sintéticos (si quedara alguno) | **DO NOT MIGRATE** | Deben excluirse explícitamente antes de cualquier exportación |
| Pedidos con `flaggedForReviewAt` sin resolver | **REQUIRES DECISION** | Resolver manualmente ANTES de migrar — no tiene sentido arrastrar un caso pendiente de revisión a un sistema nuevo que no sabe qué es |

## COUPONS

| Campo | Clasificación | Nota |
|---|---|---|
| Código, tipo (porcentaje/fijo), monto mínimo | **MIGRATE** | Shopify Discounts vía API/CSV |
| Uso acumulado (`usedCount`) | **RECREATE** | Shopify empieza su propio contador — si el cupón sigue activo, se puede ajustar el límite restante manualmente para reflejar el uso ya ocurrido |
| Cupones expirados/inactivos | **DO NOT MIGRATE** | Sin valor, no migrar |

## CONTENT

| Campo | Clasificación | Nota |
|---|---|---|
| Páginas informativas (envíos, devoluciones, garantía, términos, privacidad, cookies) | **MIGRATE** | Copiar el contenido a páginas Liquid; ajustar la interpolación dinámica del umbral de envío gratis a un metaobject/Liquid |
| Blog | **MIGRATE** | Shopify Blog nativo, importar markdown → HTML |
| Metadata SEO de cada página/producto | **MIGRATE** | Vía metafields SEO nativos |
| Imágenes de contenido | **MIGRATE** | Re-subir o referenciar Cloudinary existente |

---

## Resumen de riesgo de esta sección

Ningún ítem de esta lista es un bloqueante técnico real — todo lo clasificado `MIGRATE` es trabajo estándar de migración de e-commerce, bien conocido. Los dos puntos que sí requieren una **decisión humana explícita antes de ejecutar** son: (1) el reset forzado de acceso de todas las clientas (comunicación, no tecnología) y (2) la herramienta/estrategia exacta para importar el historial de pedidos reales (Shopify no tiene un import de pedidos tan directo como el de productos).
