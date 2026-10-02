# 01 — Dominio, DNS y cómo volver atrás (rollback)

Para: Daniela. Dominio: `radaelliswimwear.com`. Todas las horas son de Bogotá.

## 1. Qué es el DNS (en una frase)
Es la "agenda" que dice a qué servidor va tu dominio. Hoy va al sitio viejo (Vercel). Al lanzar, dos líneas de esa agenda se cambian para que vaya a Shopify. El correo no cambia.

## 2. Valores (leídos por el equipo el 2026-10-02, DNS público)

Los nameservers son `ns1.dns-parking.com` y `ns2.dns-parking.com`: el DNS se edita en **Hostinger hPanel**.

| Registro | Nombre | HOY (sitio viejo, Vercel) | DESPUÉS DEL LANZAMIENTO (Shopify) | ¿Se cambia? |
|---|---|---|---|---|
| A | `@` | `216.150.1.1` (TTL 300) | `23.227.38.65` | SÍ |
| CNAME | `www` | `e7eb3f32d99d3261.vercel-dns-017.com` (TTL 300) | `shops.myshopify.com` | SÍ |
| MX | `@` | `mx1.hostinger.com`, `mx2.hostinger.com` | igual | NO TOCAR |
| TXT (SPF) | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` | igual | NO TOCAR |
| TXT | `@` | `google-site-verification…` y `facebook-domain-verification…` | igual | NO TOCAR |

- A las 10:17 del 2026-10-02 el coordinador conectó `radaelliswimwear.com` en Shopify **sin tocar el DNS** (con tu autorización). Shopify mostró SOLO esos dos registros en "Actualiza estos registros existentes" y no hay registros AAAA (IPv6). Estado en Admin > Configuración > Dominios: "Redirige a wgcvpd-ib.myshopify.com", no principal, "Requiere configuración". El sitio público sigue siendo el viejo (Vercel).
- **Antes de editar, vuelve a leer esa pantalla de Shopify.** Si muestra valores distintos a esta tabla (por ejemplo un registro AAAA), mandan los de Shopify.
- Nunca borres MX ni TXT. Si los borras, `info@radaelliswimwear.com` deja de recibir correo.
- TTL 300 = 5 minutos. Déjalo en 300 mientras todo se estabiliza. Si Hostinger propone otro valor al guardar, vuelve a poner 300 (`CONFIRMAR_EN_ADMIN`, Hostinger).
- Dominio principal en Shopify: `radaelliswimwear.com`; `www` redirige al principal.

## 3. Dónde se edita en Hostinger
1. Entra a hPanel (hostinger.com > Iniciar sesión). Credenciales: tuyas, nunca por chat.
2. Dominios > elige `radaelliswimwear.com` > Administrar > DNS / Servidores de nombres > Registros DNS (`CONFIRMAR_EN_ADMIN`: Hostinger cambia nombres seguido; también se llama "Zona DNS").
3. Busca la fila A con nombre `@` > editar > pega el valor. Guarda.
4. Busca la fila CNAME con nombre `www` > editar > pega el valor. Guarda.
5. Verifica que NO quede otra fila A, AAAA ni CNAME para `@` o `www`. Si queda alguna, anótala y pregunta antes de borrar (`CONFIRMAR_EN_ADMIN`).

Camino rápido opcional: en Shopify, Configuración > Dominios > `radaelliswimwear.com` hay un botón "Hostinger > Iniciar sesión" (conexión automática). Necesita **tu propio** inicio de sesión en Hostinger. No pulses "Actualicé los registros DNS" hasta que los registros realmente hayan cambiado.

## 4. Cómo se verifica con herramientas públicas (sin saber de tecnología)
1. Abre `https://dnschecker.org`. Escribe `radaelliswimwear.com`, tipo **A**. Debe mostrar `23.227.38.65` en casi todos los países. (Durante 5–60 min algunos mostrarán el valor viejo: es normal.)
2. Repite con `www.radaelliswimwear.com`, tipo **CNAME**: debe decir `shops.myshopify.com`.
3. Repite con tipo **MX**: debe seguir diciendo `mx1.hostinger.com` y `mx2.hostinger.com`.
4. Opcional, en Windows (Símbolo del sistema): `nslookup radaelliswimwear.com 8.8.8.8`.
5. En el navegador (mejor en ventana privada o con datos móviles): abre `https://radaelliswimwear.com`. Debe verse el candado y la tienda Shopify.
6. En Shopify: Configuración > Dominios: el dominio ya no debe decir "Requiere configuración" y debe tener certificado SSL activo.
7. Cuando DNS y SSL estén en verde (y solo entonces), el dominio se cambia a **Tienda principal** (hoy está en "Redirige a wgcvpd-ib.myshopify.com": si no se cambia, los visitantes terminan en la dirección myshopify.com) y `www` redirige al dominio principal. Después se quita la contraseña y se publica el tema (lo hace el coordinador, con tu GO).

Tiempos esperados:
- DNS: unos 5 minutos (TTL 300); algunos proveedores tardan hasta 1 hora.
- Certificado SSL gratis de Shopify: normalmente 5–60 min. Shopify indica que puede tardar más (hasta 48 h en casos raros).
- Durante la espera, `https://` puede mostrar aviso de certificado. No es un fallo definitivo.

## 5. Receta de ROLLBACK (volver al sitio viejo, ~5–10 minutos)

Cuándo: la tienda Shopify no abre en el dominio, el certificado no se activa después de más de 1 hora, o nadie puede pagar y no se resuelve rápido (documento 10).

1. **Frena las ventas en Shopify**: Tienda online > Preferencias > activa la protección con contraseña (`CONFIRMAR_EN_ADMIN`). Así nadie compra en dos sistemas a la vez.
2. En Hostinger (sección 3) cambia **A `@` → `216.150.1.1`**.
3. Cambia **CNAME `www` → `e7eb3f32d99d3261.vercel-dns-017.com`**.
4. NO toques MX ni TXT.
5. Verifica con la sección 4 (A debe volver a `216.150.1.1`; el sitio viejo responde con "server: Vercel").
6. **Pagos del sitio viejo**: el sitio viejo recibe avisos de Wompi en otra URL de eventos. Hoy esa URL en el panel de Wompi apunta a Shopify. Para que el sitio viejo cobre, hay que devolver la URL de eventos de **producción** al valor que usaba el sitio viejo. Ese valor anterior **no está registrado**: `PENDIENTE_DUEÑA` (GAP-01). Panel de Wompi > Desarrollo > Desarrolladores > Seguimiento de transacciones (`CONFIRMAR_EN_ADMIN`, Wompi). Si no se puede, no cobres en el sitio viejo con tarjeta: coordina por WhatsApp.
7. Pedidos creados en Shopify durante la ventana: Admin > Pedidos. Atiéndelos a mano (despachar o reembolsar). El rollback no los borra.
8. No borres el proyecto de Vercel ni el sitio viejo mientras exista posibilidad de rollback. Fecha de retiro: `PENDIENTE_DUEÑA` (GAP-17).
9. Anota el cambio en la tabla de la sección 7.

Para volver a poner Shopify otra vez (re-lanzar): repite la tabla de la sección 2 y quita la contraseña de la tienda.

## 6. QUÉ HACER / QUÉ NO HACER
- Haz una foto/captura de la pantalla DNS **antes** de cada cambio.
- Cambia solo las dos líneas indicadas.
- No cambies los nameservers (los `ns1/ns2 dns-parking.com`).
- No borres el dominio del Admin de Shopify mientras haya pedidos por cerrar.
- No hagas el cambio sin tener a mano esta página.
- No pegues contraseñas de Hostinger en ningún chat.

## 7. Registro de cambios DNS (lo llena quien ejecute el cambio)

| Fecha y hora (Bogotá) | Quién | Registro | Valor anterior | Valor nuevo | Verificado con |
|---|---|---|---|---|---|
| (lanzamiento) `PENDIENTE` | | A `@` | `216.150.1.1` | `23.227.38.65` | |
| (lanzamiento) `PENDIENTE` | | CNAME `www` | `e7eb3f32d99d3261.vercel-dns-017.com` | `shops.myshopify.com` | |

Estado al escribir (2026-10-02 ~10:20): dominio conectado en Shopify pero SIN cambios de DNS (el público sigue viendo el sitio viejo: apex responde 200 y `www` redirige al apex). El coordinador debe completar esta tabla tras el lanzamiento (GAP-20).

## 8. Dominio y proveedor: datos que faltan
- Registrador del dominio (¿Hostinger?): `PENDIENTE_DUEÑA`.
- Fecha de renovación del dominio y renovación automática: `PENDIENTE_DUEÑA` (GAP-08). Si el dominio vence, la tienda y el correo se caen.
- Plan de Hostinger (correo `info@`, DNS) y su fecha de renovación: `PENDIENTE_DUEÑA` (GAP-08).
- Correo `info@`: confirmar que el buzón existe y se puede abrir (webmail de Hostinger, `CONFIRMAR_EN_ADMIN`): necesario para el documento 07.
- Crédito de USD 20 de Shopify para dominio (promo de alta): no sabemos si aplica a un dominio externo conectado (`CONFIRMAR_EN_ADMIN`).

## 9. Cuándo pedir ayuda
- El dominio no abre después de 1 hora de cambiar el DNS.
- Aparece un registro que no reconoces.
- Dejó de llegar correo a `info@`.
- No encuentras la pantalla de Hostinger.
Lleva: captura de la zona DNS (completa), hora del cambio y resultado de dnschecker.
