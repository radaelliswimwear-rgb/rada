# SEO, Analytics/Meta y Emails

Parte de la [auditoría de viabilidad de migración a Shopify](../shopify-migration-feasibility-audit.md). Investigado el 2026-09-26 contra fuentes oficiales de Shopify.

---

## 9. Migración SEO

### Impacto sobre URLs

**HECHO OFICIAL (arquitectura de Shopify), corroborado por múltiples fuentes especializadas aunque sin una única página oficial que lo declare en esos términos exactos**: Shopify fuerza prefijos de ruta fijos en un theme Liquid estándar — productos siempre en `/products/<handle>`, colecciones en `/collections/<handle>`, páginas en `/pages/<handle>`, blog en `/blogs/<blog>/<articulo>`. Solo el `<handle>` (máx. 32 caracteres) es editable — **el prefijo de carpeta no se puede quitar ni renombrar** en un theme estándar.

**Excepción real**: Shopify **Hydrogen** (su framework oficial React/Remix para storefronts headless sobre la Storefront API) sí permite rutas 100% custom, igual que hoy — pero eso es esencialmente reconstruir el frontend actual apuntando a Shopify como backend, un proyecto distinto y considerablemente más caro que "usar un theme Liquid", que es el escenario que este audit evalúa.

**Consecuencia directa**: migrar de `/producto/[slug]` y `/[categoria-slug]` a `/products/<handle>`/`/collections/<handle>` en un theme estándar **no es evitable**. Esto requiere:

| URL actual | URL Shopify | Redirect necesario |
|---|---|---|
| `/producto/<slug>` | `/products/<handle>` | **SÍ** — mapeo 1:1, sin patrón/wildcard |
| `/<categoria-slug>` (ej. `/hombre`, `/mujer`) | `/collections/<handle>` | **SÍ** |
| `/blog/<slug>` | `/blogs/<blog>/<articulo>` | **SÍ** |
| `/envios`, `/devoluciones`, etc. | `/pages/<handle>` | **SÍ** (probablemente el mismo handle, pero confirmar) |
| `/buscar` | `/search` (nativo) | **SÍ** |
| `/sitemap.xml` | Autogenerado por Shopify | No aplica — se reemplaza, no se redirige |

**HECHO OFICIAL**: Shopify tiene una herramienta nativa de **URL Redirects** (Online Store → Navegación) con importación masiva por CSV. **REQUIERE CONFIRMACIÓN** el límite exacto (reportado como 100.000 redirects por tienda en fuentes no oficiales) y que no soporta patrones/wildcards — solo entradas exactas, lo que para un catálogo de ~30 productos actuales es perfectamente manejable, pero confirma que **no hay atajos**: cada URL indexada hoy necesita su propia entrada.

### Estrategia conceptual para minimizar pérdida SEO

1. Exportar de Google Search Console la lista completa de URLs indexadas hoy (fuente de verdad de qué está realmente posicionado, no solo lo que existe en el sitemap actual).
2. Congelar el catálogo (ver plan de migración paralela) y construir el mapeo 1:1 completo ANTES del corte de DNS.
3. Cargar todos los redirects vía CSV el mismo día del corte (nunca después — cada hora sin redirect es una URL indexada devolviendo 404).
4. Reenviar el sitemap nuevo a Google Search Console inmediatamente después del corte.
5. Monitorear Search Console por caídas de cobertura/errores 404 las semanas siguientes.
6. Actualizar cualquier enlace externo/backlink conocido (redes sociales, directorios) al nuevo dominio de rutas si es posible — los redirects cubren el resto.

**Riesgo real, no cosmético**: cualquier migración grande de URLs produce volatilidad temporal de ranking incluso con redirects perfectos — esto es un riesgo general de SEO bien documentado en la industria, no específico de Shopify, pero aplica de lleno acá porque **ningún prefijo de ruta actual sobrevive**.

---

## 10. Analytics + Meta

Hallazgo principal: **la cobertura nativa de Shopify acá es más fuerte de lo esperado.**

### GA4 + consentimiento

**HECHO OFICIAL**: Shopify tiene una **Web Pixels API** oficial (sandbox de pixels con acceso a eventos estándar: `page_viewed`, `product_viewed`, `checkout_started`, `checkout_completed`, etc.) y una **Customer Privacy API** nativa (`shouldShowBanner()`, `currentVisitorConsent()`, `setTrackingConsent()`) con un **banner de consentimiento nativo**, sin necesidad de ninguna app. Los pixels declarados vía "Customer Events" llevan asociada una categoría de consentimiento (Analytics/Marketing) y Shopify los gatea automáticamente según lo que el visitante haya aceptado — el equivalente nativo exacto de "gatear scripts por consentimiento".

**Brecha real vs. hoy**: la exclusión de tráfico interno (equipo/familia) es una bandera propia de este proyecto sin concepto nativo en Shopify — habría que reconstruirla como lógica custom dentro de un pixel personalizado (leyendo una cookie), o usar el filtro de tráfico interno propio de GA4 (mecanismo distinto, ya disponible independientemente de la plataforma).

### Meta Conversions API (server-side)

**HECHO OFICIAL**: Shopify tiene un canal nativo de **Facebook & Instagram** con un ajuste de "Data sharing" de 3 niveles; en el nivel **Maximum**, Shopify envía el evento Purchase vía Conversions API **servidor a servidor de forma nativa**, sin ninguna app de terceros, activable directo desde el admin.

**Brecha/incógnita real**: el mecanismo exacto de deduplicación (vía `event_id` compartido entre el Pixel del navegador y el evento server-side) está bien corroborado por fuentes de la comunidad/proveedores, pero **no está documentado en una página oficial de Shopify** encontrada en esta investigación — tratarlo como altamente probable, no como 100% confirmado. Tampoco se pudo confirmar si existe control granular para replicar el gate actual de "nunca disparar Purchase en un pedido de WhatsApp sin pago real" — aunque esto puede ser un no-problema si el flujo WhatsApp-como-pago no tiene equivalente en Shopify de todas formas (ver wompi-payments.md).

### Datos estructurados (JSON-LD)

**HECHO OFICIAL** (fuente: blog oficial de Shopify): el theme Dawn/Online Store 2.0 incluye JSON-LD de producto (`Product` schema.org) automáticamente en la página de producto vía el filtro Liquid `structured_data`. **No confirmado** si el schema `Organization`/`WebSite` (usado hoy para el sitelinks search box de Google) viene incluido por defecto — probablemente requiere agregarlo a mano en `theme.liquid`, trabajo menor.

---

## 11. Emails

Comparación: **Resend + `EmailOutbox` propio** (con reintentos, idempotencia hacia Resend, y 8 plantillas: verificación, reset de contraseña, contraseña cambiada, bienvenida, back-in-stock, nuevo suscriptor, aviso de pedido nuevo al admin, confirmación de pedido al cliente) vs. **Shopify Notifications** (nativo).

| Email actual | ¿Cubierto nativamente? | Nota |
|---|---|---|
| Confirmación de pedido | **Sí** — HECHO OFICIAL | Notificación nativa "Order confirmation" |
| Actualización de envío/despacho | **Sí** — HECHO OFICIAL | Notificaciones nativas de fulfillment |
| Reset de contraseña | **Cambia de modelo** | El sistema NUEVO de Customer Accounts de Shopify es **sin contraseña, por código OTP de un solo uso** enviado por email — no hay un "reset de contraseña" tradicional que migrar 1:1 |
| Verificación de email | **Cambia de modelo** | El login OTP funciona como verificación implícita (hay que poder leer el email para entrar), pero no es un email de "verificá tu cuenta" discreto como el actual |
| Bienvenida | Probablemente sí (notificación de invitación/bienvenida de cuenta) | Nombre exacto de la notificación por confirmar |
| Back-in-stock | **No nativo** | Sin equivalente — requeriría una app o Shopify Flow |
| Newsletter/marketing | **No es lo mismo sistema** | Shopify separa explícitamente "Notifications" (transaccional, gratis) de "Shopify Email" (marketing, otra herramienta) — confirma que **algo** para marketing sigue haciendo falta más allá de las notificaciones nativas |
| Reintentos/observabilidad de envío | **No confirmado / probable brecha** | No se encontró documentación oficial de un mecanismo de reintento/cola visible para el comerciante comparable al `EmailOutbox` propio — las notificaciones nativas son, en la práctica, una caja negra |

**Conclusión de la sección 11**: las notificaciones nativas de Shopify probablemente cubren bien lo transaccional core (confirmación, envío). El modelo de cuentas sin contraseña es un cambio de UX real, no solo técnico, que hay que comunicar a las clientas. **Resend (o un ESP equivalente) muy probablemente sigue siendo necesario** para marketing y para cualquier email que necesite garantías de reintento/observabilidad que Shopify no expone — no es una eliminación total de esa pieza de infraestructura, como se esperaría de entrada.

---

## Puntos que requieren confirmación directa antes de decidir

1. Declaración oficial explícita de que los prefijos `/products/`/`/collections/` no se pueden quitar en un theme estándar (ampliamente corroborado, sin una única página oficial que lo diga en esos términos).
2. Tope exacto y falta de wildcards en la herramienta de Redirects.
3. Si el sistema de Customer Accounts nuevo permite algún modo con contraseña clásica en vez de OTP.
4. Garantías (o ausencia de ellas) de reintento/reliability en las notificaciones nativas.
5. Si el schema Organization/WebSite viene por defecto en la versión actual de Dawn.
6. Mecanismo exacto de deduplicación Pixel/CAPI, desde una fuente oficial de Shopify o Meta.
