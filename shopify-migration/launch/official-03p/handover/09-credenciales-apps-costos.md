# 09 — Credenciales, apps, servicios y costos

Para: Daniela. **Este documento NO contiene ninguna contraseña, llave ni código.** Solo dice dónde vive cada cosa y quién es dueño.
`PENDIENTE_DUEÑA` = solo tú sabes este dato; complétalo (no lo pegues en chats).

## 1. Quién es dueño de qué (cuentas)
| Cuenta / servicio | Para qué sirve | Quién es el dueño / con qué correo entra | Dónde guardas la clave | Recuperación |
|---|---|---|---|---|
| Shopify ID (cuenta del propietario de la tienda) | Entrar al Admin de `wgcvpd-ib` | Tu Gmail de la marca (el que creó la tienda). Entras con código por correo (al crear la tienda la passkey no estuvo disponible) | Gestor de contraseñas (`PENDIENTE_DUEÑA`: cuál) | Correo de recuperación y 2FA: `PENDIENTE_DUEÑA` (GAP-16) |
| Gmail de la marca | Correo del propietario, avisos de Shopify, Drive | Tú | Gestor | Teléfono/recuperación de Google: `PENDIENTE_DUEÑA` |
| Panel de Wompi | Transacciones, llaves, URL de eventos, reembolsos | Titular de la cuenta Wompi: `PENDIENTE_DUEÑA` | Gestor | Soporte de Wompi |
| Llaves de Wompi (pública/privada, producción y pruebas) | Conectar Shopify con Wompi | Las generas en Wompi > Desarrollo > Desarrolladores | **No se guardan en archivos.** Las ves en Wompi y las escribes tú en Shopify (Configuración > Pagos > Wompi) | Regenerar en el panel de Wompi si se filtran |
| Envia.com | Guías de envío y saldo | Cuenta que creaste tú | Gestor | Recuperar contraseña desde Envia (el enlace vence: úsalo pronto) |
| Hostinger (hPanel) | DNS, correo `info@`, quizá registro del dominio | `PENDIENTE_DUEÑA` | Gestor | `PENDIENTE_DUEÑA` |
| Buzón `info@radaelliswimwear.com` | Correo de marca | Hostinger | Gestor | Restablecer desde hPanel |
| Meta (Facebook/Instagram/Business/Ads) | Redes y anuncios; dominio verificado por TXT | `PENDIENTE_DUEÑA` | Gestor | `PENDIENTE_DUEÑA` |
| TikTok, WhatsApp Business | Redes y atención | `PENDIENTE_DUEÑA` | Gestor | `PENDIENTE_DUEÑA` |
| GitHub (`radaelliswimwear-rgb`) | Respaldos de la migración | `PENDIENTE_DUEÑA` | Gestor | `PENDIENTE_DUEÑA` |
| Vercel y base del sitio viejo | Sitio viejo y su base de datos | `PENDIENTE_DUEÑA` | Gestor | `PENDIENTE_DUEÑA` |
| Google Analytics / Search Console | Estadísticas y buscador | `PENDIENTE_DUEÑA` (existen según el sitio viejo: `google-site-verification`) | Gestor | `PENDIENTE_DUEÑA` |
| Suscripción de IA (hasta 2026-10-20) y su plan posterior | Ayuda técnica | Tú | Gestor | — |
| Sesiones del asistente (Shopify CLI) | El asistente entra con tu permiso por código | Se aprueban en tu navegador cuando el asistente lo pide | Nunca por chat | Se vuelve a pedir |

Reglas:
1. Usa un **gestor de contraseñas** y activa verificación en 2 pasos (Shopify, Google, Wompi, Hostinger, Meta). `PENDIENTE_DUEÑA`.
2. Guarda los **códigos de recuperación** impresos o en el gestor, nunca en el mismo Drive sin protección.
3. Anota quién más tiene acceso (staff, agencia). Configuración > Usuarios muestra el personal de Shopify (`CONFIRMAR_EN_ADMIN`).
4. Considera una **segunda persona de confianza** con acceso de recuperación (GAP-16).
5. Nunca envíes contraseñas, códigos de acceso, llaves de Wompi ni PIN de soporte por chat o GitHub (ni a la IA).
6. Si pierdes una clave: no la pidas por chat; recupérala en la pantalla oficial de cada servicio.

## 2. Aplicaciones instaladas en Shopify
| App | Estado | Para qué | Costo |
|---|---|---|---|
| Wompi Pagos (Wompi Co) | Instalada, modo prueba hasta el lanzamiento | Cobrar | Instalar gratis; comisiones por transacción (sección 3) |
| Envia.com | Instalada y vinculada | Guías de envío | App sin costo conocido; guías pagadas con saldo (`CONFIRMAR_EN_ADMIN (Envia)`) |
| Search & Discovery | Instalada | Filtros Talla / Color / Precio | Gratis |
| Otras preinstaladas por Shopify (Translate & Adapt, Shop, Inbox, etc.) | `CONFIRMAR_EN_ADMIN` | — | — |
| App de favoritos de Radaelli | **NO instalada** (favoritos funcionan por navegador) | — | — |
Lista real: Configuración > Aplicaciones y canales de venta. No instales apps nuevas sin pedir ayuda.

## 3. Costos y renovaciones
| Servicio | Costo | Fecha / renovación | Estado |
|---|---|---|---|
| **Shopify Basic (mensual)** | Prueba gratis de 3 días. **Desde 2026-10-06: USD 1,00 al mes (+ impuestos)** durante el periodo promocional ("3-month trial"). **Desde 2027-01-04: USD 25,00 al mes (+ impuestos)**, renovación automática | Cobro 2026-10-06; cambio de precio 2027-01-04. La pantalla de alta mostró 3-ene-2027: la fecha válida es la de Configuración > Facturación (`CONFIRMAR_EN_ADMIN`) | Confirmado por ti con los términos en pantalla |
| Comisión de Shopify por proveedor externo (Wompi) | 2 % en Basic sobre (productos − descuentos + impuestos + envío) por pedido | Por cada pedido real | Según la ayuda de Shopify; se verá en la primera factura |
| Crédito de dominio de Shopify | USD 20 si compras/conectas dominio (promo de alta) | Condiciones: ver pantalla | `CONFIRMAR_EN_ADMIN`; no cuentes con él |
| **Wompi** | Tarifa de tu contrato (comisión por transacción, fijo, IVA) | — | **`PENDIENTE_DUEÑA`** (GAP-08). La investigación pública mencionaba "2,65 % + $700 + IVA" como referencia; NO es tu tarifa confirmada |
| **Envia** | Por guía; recargas de saldo | Cada envío | Precios `PENDIENTE_DUEÑA` (GAP-06) |
| **Dominio `radaelliswimwear.com`** | `PENDIENTE_DUEÑA` | Fecha de renovación `PENDIENTE_DUEÑA` | Flag: si vence, se cae tienda y correo (GAP-08) |
| **Hostinger (plan, correo `info@`, DNS)** | `PENDIENTE_DUEÑA` | Renovación `PENDIENTE_DUEÑA` | GAP-08 |
| Meta Ads | Variable (tu presupuesto) | Según campaña | Definir tope diario |
| Vercel / sitio viejo | `PENDIENTE_DUEÑA` | Retiro `PENDIENTE_DUEÑA` | GAP-17 |
| Plan de IA posterior al 2026-10-20 | `PENDIENTE_DUEÑA` | — | — |
| GitHub | `PENDIENTE_DUEÑA` (probablemente gratis) | — | — |

### Calendario de fechas importantes
| Fecha | Qué |
|---|---|
| 2026-10-06 | Primer cobro de Shopify (USD 1,00 + impuestos) |
| 2026-10-20 | Termina la suscripción de IA de alta capacidad |
| 2026-12-28 | Recordatorio tuyo: revisar el plan antes del aumento |
| 2027-01-04 | Shopify pasa a USD 25,00/mes (+ impuestos) |
| `PENDIENTE_DUEÑA` | Renovación del dominio |
| `PENDIENTE_DUEÑA` | Renovación de Hostinger |

## 4. Qué NO hacer con costos
- No cambies de plan ni pagues nada que no entiendas.
- No instales apps de pago sin hacer cuentas.
- Si el cobro de Shopify falla, la tienda puede suspenderse (documento 10).
- Los cobros de Shopify son en dólares: revisa con tu banco la conversión y comisiones (`PENDIENTE_DUEÑA`).

## 5. Cuándo pedir ayuda
- Cobro de Shopify, Wompi, Envia o Hostinger que no esperabas.
- Alerta de "método de pago rechazado" en el Admin.
- Perdiste acceso a una cuenta de la lista.
- Alguien pide tus claves "por soporte": es una estafa hasta que se demuestre lo contrario.
