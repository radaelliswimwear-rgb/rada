# 09 — Credenciales, apps, servicios y costos

Para: Daniela. **Este documento NO contiene ninguna contraseña, llave ni código.** Solo dice dónde vive cada cosa y quién es dueño.
`PENDIENTE_DUEÑA` = solo tú sabes este dato; complétalo (no lo pegues en chats).

## 1. Quién es dueño de qué (cuentas)
| Cuenta / servicio | Para qué sirve | Quién es el dueño / con qué correo entra | Dónde guardas la clave | Recuperación |
|---|---|---|---|---|
| Shopify ID (cuenta del propietario de la tienda) | Entrar al Admin de `wgcvpd-ib` | Tu Gmail de la marca (el que creó la tienda). Entras con código por correo (al crear la tienda la passkey no estuvo disponible). Si el navegador tiene abierta OTRA cuenta de Shopify y un enlace dice que "no tiene permiso", pulsa "Cambiar de cuenta" y elige el Gmail de la marca (documento 10, sección 14.1) | Gestor de contraseñas (`PENDIENTE_DUEÑA`: cuál) | Correo de recuperación y 2FA: `PENDIENTE_DUEÑA` (GAP-16) |
| Gmail de la marca | Correo del propietario, avisos de Shopify, Drive | Tú | Gestor | Teléfono/recuperación de Google: `PENDIENTE_DUEÑA` |
| Panel de Wompi (`https://login.wompi.co`) | Transacciones, "Entradas contables", "Dinero enviado", llaves, URL de eventos | Titular de la cuenta Wompi: `PENDIENTE_DUEÑA`. Tú escribes tus credenciales y el captcha; la sesión caduca rápido | Gestor | Soporte de Wompi |
| Llaves de Wompi (pública/privada, producción y pruebas) | Conectar Shopify con Wompi | Las generas en Wompi > Desarrollo > Desarrolladores | **No se guardan en archivos.** Las ves en Wompi y las escribes tú en Shopify (Configuración > Pagos > Wompi) | Regenerar en el panel de Wompi si se filtran |
| Envia.com | Guías de envío y saldo | Cuenta que creaste tú | Gestor | Recuperar contraseña desde Envia (el enlace vence: úsalo pronto) |
| Hostinger (hPanel) | DNS del dominio (Dominios > DNS > "Editor de zona DNS"), correo `info@`, quizá registro del dominio. **La misma cuenta tiene otro dominio ajeno a la tienda: no tocarlo** | `PENDIENTE_DUEÑA` | Gestor | `PENDIENTE_DUEÑA` |
| Buzón `info@radaelliswimwear.com` | Correo de marca | Hostinger | Gestor | Restablecer desde hPanel |
| Meta (Facebook/Instagram/Business/Ads) | Redes y anuncios; dominio verificado por TXT; conexión del píxel/dataset con la app "Facebook & Instagram" (pendiente, la haces tú con tu inicio de sesión de Meta; GAP-14 y GAP-26) | `PENDIENTE_DUEÑA` | Gestor | `PENDIENTE_DUEÑA` |
| TikTok, WhatsApp Business | Redes y atención | `PENDIENTE_DUEÑA` | Gestor | `PENDIENTE_DUEÑA` |
| GitHub (`radaelliswimwear-rgb`) | Respaldos de la migración | `PENDIENTE_DUEÑA` | Gestor | `PENDIENTE_DUEÑA` |
| Vercel y base del sitio viejo | Sitio viejo y su base de datos | `PENDIENTE_DUEÑA` | Gestor | `PENDIENTE_DUEÑA` |
| Google Analytics / Search Console | Estadísticas y buscador | `PENDIENTE_DUEÑA` (existen según el sitio viejo: `google-site-verification`) | Gestor | `PENDIENTE_DUEÑA` |
| Suscripción de IA (hasta 2026-10-20) y su plan posterior | Ayuda técnica | Tú | Gestor | — |
| Tablero Radaelli Swimwear (página privada de tu cuenta de Claude: `https://claude.ai/artifact/Di9pTQW3cvGhCzG8eSV1GN`) | Ver las cifras de cada semana (Shopify, Meta, Wompi). Dice "seguir probando" mientras falten tus costos reales | Tu cuenta de Claude (privada: solo la ves tú mientras no la compartas) | Tu cuenta de Claude | Si la suscripción termina el 2026-10-20, copia las cifras antes (`CONFIRMAR_EN_ADMIN`: qué pasa con la página al cambiar de plan) |
| Sesiones del asistente (Shopify CLI) | El asistente entra con tu permiso por código | Se aprueban en tu navegador cuando el asistente lo pide | Nunca por chat | Se vuelve a pedir |

Reglas:
1. Usa un **gestor de contraseñas** y activa verificación en 2 pasos (Shopify, Google, Wompi, Hostinger, Meta). `PENDIENTE_DUEÑA`.
2. Guarda los **códigos de recuperación** impresos o en el gestor, nunca en el mismo Drive sin protección.
3. Anota quién más tiene acceso (staff, agencia). Configuración > Usuarios muestra el personal de Shopify (`CONFIRMAR_EN_ADMIN`).
4. Considera una **segunda persona de confianza** con acceso de recuperación (GAP-16).
5. Nunca envíes contraseñas, códigos de acceso, llaves de Wompi ni PIN de soporte por chat o GitHub (ni a la IA).
6. Si pierdes una clave: no la pidas por chat; recupérala en la pantalla oficial de cada servicio.

## 2. Aplicaciones instaladas en Shopify (vistas el 2026-10-02, tarde)
| App | Estado | Para qué | Costo |
|---|---|---|---|
| Wompi Pagos (Wompi Co) | Instalada; **LIVE** ("Activa", modo de prueba apagado). No pulses el botón rojo "Desactivar" | Cobrar | Instalar gratis; comisiones por transacción (sección 3) |
| Envia Shipping and Fulfillment (Envia.com) | Instalada; integración de Shopify "Activo"; dirección de origen configurada; **saldo de Envia $0: lo recargas tú** antes de comprar la primera guía | Guías de envío | App sin costo conocido; guías pagadas con saldo (`CONFIRMAR_EN_ADMIN (Envia)`) |
| Search & Discovery | Instalada | Filtros Talla / Color / Precio (depende de "Network Intelligence", que se deja ENCENDIDO) | Gratis |
| **Facebook & Instagram (de Meta)** | **Instalada el 2026-10-02.** El píxel "Facebook & Instagram" ya aparece en Configuración > Eventos de clientes. **Falta que TÚ conectes el dataset de Meta con tu inicio de sesión** (GAP-26) | Conectar la tienda con Meta para medir anuncios (píxel/dataset) | **Gratis** (la app); los anuncios sí cuestan (Meta Ads, abajo) |
| Messaging | Instalada (aparece en tu Admin). Para qué sirve en tu tienda y si cobra: `CONFIRMAR_EN_ADMIN`. No la uses sin preguntar | `CONFIRMAR_EN_ADMIN` | `CONFIRMAR_EN_ADMIN` |
| Shopify CLI Connector App | Instalada; por su nombre es la conexión técnica de las herramientas del asistente (Shopify CLI; `CONFIRMAR_EN_ADMIN`). No la desinstales sin preguntar | Acceso técnico del asistente | Sin costo conocido |
| Otras preinstaladas por Shopify (Translate & Adapt, Shop, Inbox, etc.) | `CONFIRMAR_EN_ADMIN` | — | — |
| App de favoritos de Radaelli | **NO instalada** (favoritos funcionan por navegador) | — | — |
Lista real: Configuración > Aplicaciones y canales de venta. No instales apps nuevas sin pedir ayuda. Aún no hay pedidos reales de clientas.

## 3. Costos y renovaciones
| Servicio | Costo | Fecha / renovación | Estado |
|---|---|---|---|
| **Shopify Basic (mensual)** | Prueba gratis de 3 días. **Desde 2026-10-06: USD 1,00 al mes (+ impuestos)** durante el periodo promocional ("3-month trial"). **Desde 2027-01-04: USD 25,00 al mes (+ impuestos)**, renovación automática | Cobro 2026-10-06; cambio de precio 2027-01-04. La pantalla de alta mostró 3-ene-2027: la fecha válida es la de Configuración > Facturación (`CONFIRMAR_EN_ADMIN`). **Visto el 2026-10-02:** la tienda está en la prueba de 3 días, con el plan y la tarjeta ya registrados; el Admin dice "Próxima factura en 3 días" (la fecha exacta del primer cobro: `CONFIRMAR_EN_ADMIN`). Una vez apareció una página "Subscribe to Basic Plan": no se pulsó y los pagos reales funcionaron | Confirmado por ti con los términos en pantalla |
| Comisión de Shopify por proveedor externo (Wompi) | **2 %** en Basic sobre (productos − descuentos + impuestos + envío) por pedido. Lo muestra la pantalla de Wompi en tu Admin: "Cargo por transacción de 2 %" | Por cada pedido real | Confirmado en pantalla; el monto real se verá en la primera factura |
| Crédito de dominio de Shopify | USD 20 si compras/conectas dominio (promo de alta) | Condiciones: ver pantalla | `CONFIRMAR_EN_ADMIN`; no cuentes con él |
| **Wompi** | **2,65 % + $700 + IVA del 19 % sobre esa comisión**, por cada pago. Comprobado con el pago real #1002 (Nequi, $5.000): comisión $832,50 + IVA $158,17 = $990,67; neto $4.009,33 | Por cada pago real. Los reembolsos NO devuelven la comisión | Medido solo con Nequi; el contrato (por si hay otra tarifa para tarjeta/PSE): **`PENDIENTE_DUEÑA`** (GAP-08). Detalle y ejemplo de $100.000: documento 02, sección 7 |
| **Envia** | Por guía; recargas de saldo. Saldo hoy: $0 (la recarga la haces tú) | Cada envío | Precios `PENDIENTE_DUEÑA` (GAP-06) |
| **Facebook & Instagram (app de Meta en Shopify)** | Gratis | — | Instalada 2026-10-02; falta conectar el dataset (GAP-26) |
| **Dominio `radaelliswimwear.com`** | `PENDIENTE_DUEÑA` (costo anual y quién es el registrador) | Fecha de renovación `PENDIENTE_DUEÑA`. Hoy el dominio ya es la dirección pública de la tienda | **`PENDIENTE_DUEÑA`**. Alerta: si vence, se cae la tienda (ahora vende por ese dominio) y el correo (GAP-08). Apúntalo hoy en tu calendario |
| **Hostinger (plan, correo `info@`, DNS)** | `PENDIENTE_DUEÑA`. Aquí se edita el DNS y vive `info@`; la cuenta también tiene otro dominio ajeno a la tienda (no tocar) | Renovación `PENDIENTE_DUEÑA` | **`PENDIENTE_DUEÑA`** (GAP-08) |
| Meta Ads | Variable (tu presupuesto) | Según campaña | Definir tope diario |
| Vercel / sitio viejo | `PENDIENTE_DUEÑA` | Retiro `PENDIENTE_DUEÑA` | GAP-17 |
| Plan de IA posterior al 2026-10-20 | `PENDIENTE_DUEÑA` | — | — |
| GitHub | `PENDIENTE_DUEÑA` (probablemente gratis) | — | — |

### Calendario de fechas importantes
| Fecha | Qué |
|---|---|
| 2026-10-02 | Tienda pública en `https://radaelliswimwear.com` (~11:23). Prueba de 3 días de Shopify en curso ("Próxima factura en 3 días") |
| 2026-10-06 | Primer cobro de Shopify (USD 1,00 + impuestos). Confirma la fecha exacta en Configuración > Facturación (`CONFIRMAR_EN_ADMIN`; el Admin del 10-02 decía "en 3 días") |
| 2026-12-31 | Vence el certificado actual del dominio (Let's Encrypt, apex y `www`); Shopify debe renovarlo. Revisa Configuración > Dominios esa semana (`CONFIRMAR_EN_ADMIN`: renovación automática) |
| 2026-10-20 | Termina la suscripción de IA de alta capacidad |
| 2026-12-28 | Recordatorio tuyo: revisar el plan antes del aumento |
| 2027-01-04 | Shopify pasa a USD 25,00/mes (+ impuestos) |
| `PENDIENTE_DUEÑA` | Renovación del dominio |
| `PENDIENTE_DUEÑA` | Renovación de Hostinger |

## 4. Qué NO hacer con costos
- No cambies de plan ni pagues nada que no entiendas. Si aparece de nuevo la página "Subscribe to Basic Plan" o algún aviso que pida pagar: lee exactamente qué cobra, toma captura y pide ayuda antes de pulsar (el 2026-10-02 apareció una vez, no se pulsó y los pagos reales funcionaron).
- No instales apps de pago sin hacer cuentas.
- Si el cobro de Shopify falla, la tienda puede suspenderse (documento 10).
- Los cobros de Shopify son en dólares: revisa con tu banco la conversión y comisiones (`PENDIENTE_DUEÑA`).

## 5. Cuándo pedir ayuda
- Cobro de Shopify, Wompi, Envia o Hostinger que no esperabas.
- Alerta de "método de pago rechazado" en el Admin.
- Perdiste acceso a una cuenta de la lista.
- Alguien pide tus claves "por soporte": es una estafa hasta que se demuestre lo contrario.
