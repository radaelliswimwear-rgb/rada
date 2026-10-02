# 01 — Dominio, DNS y cómo volver atrás (rollback)

Para: Daniela. Dominio: `radaelliswimwear.com`. Todas las horas son de Bogotá.

**ESTADO 2026-10-02 (tarde): HECHO.** El DNS ya apunta a Shopify, la tienda es pública en `https://radaelliswimwear.com` desde ~11:23, el dominio es el principal y el certificado (Let's Encrypt, apex y `www`) es válido hasta 2026-12-31. `http` redirige a `https` y `www` redirige al dominio sin `www`. Las secciones 2 a 4 quedan como referencia (y para re-lanzar); la sección 5 es la receta de rollback; la sección 7 registra lo que se cambió.

## 1. Qué es el DNS (en una frase)
Es la "agenda" que dice a qué servidor va tu dominio. Antes del lanzamiento iba al sitio viejo (Vercel). Al lanzar se cambiaron dos líneas de esa agenda para que vaya a Shopify (ya hecho, 2026-10-02). El correo no cambió.

## 2. Valores (leídos por el equipo el 2026-10-02, DNS público)

Los nameservers son `ns1.dns-parking.com` y `ns2.dns-parking.com`: el DNS se edita en **Hostinger hPanel**.

| Registro | Nombre | ANTES (sitio viejo, Vercel) = valores de ROLLBACK | AHORA (Shopify, cambiado el 2026-10-02) | ¿Se cambia? |
|---|---|---|---|---|
| A | `@` | `216.150.1.1` (TTL 300) | `23.227.38.65` | SÍ (ya hecho) |
| CNAME | `www` | `e7eb3f32d99d3261.vercel-dns-017.com` (TTL 300) | `shops.myshopify.com` (TTL 300) | SÍ (ya hecho) |
| MX | `@` | `mx1.hostinger.com`, `mx2.hostinger.com` | igual | NO TOCAR |
| TXT (SPF) | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` | igual | NO TOCAR |
| TXT | `@` | `google-site-verification…` y `facebook-domain-verification…` | igual | NO TOCAR |
| Otros: DKIM del correo de Hostinger (los CNAME `hostingermail…`), `resend._domainkey`, `_dmarc`, `autodiscover`, `ftp` | varios | tal cual estaban | igual | NO TOCAR |

- Solo se cambiaron DOS registros: el **A `@`** y el **CNAME `www`**. Todo lo demás (correo, SPF, verificaciones de Google y Facebook, DKIM, DMARC, autodiscover, ftp) quedó igual.
- A las 10:17 del 2026-10-02 el coordinador conectó `radaelliswimwear.com` en Shopify **sin tocar el DNS** (con tu autorización). Shopify mostró SOLO esos dos registros en "Actualiza estos registros existentes" y no hay registros AAAA (IPv6). Después se cambiaron en Hostinger (sección 3), el dominio pasó a **principal** y la tienda se hizo pública (~11:23).
- **Si algún día repites el cambio (re-lanzar), antes de editar vuelve a leer esa pantalla de Shopify** (Configuración > Dominios). Si muestra valores distintos a esta tabla (por ejemplo un registro AAAA), mandan los de Shopify.
- Nunca borres MX ni TXT. Si los borras, `info@radaelliswimwear.com` deja de recibir correo.
- TTL 300 = 5 minutos. Déjalo en 300 mientras todo se estabiliza. Si Hostinger propone otro valor al guardar, vuelve a poner 300 (`CONFIRMAR_EN_ADMIN`, Hostinger).
- Dominio principal en Shopify: `radaelliswimwear.com`; `www` redirige al principal.

## 3. Dónde se edita en Hostinger (camino exacto, comprobado el 2026-10-02)
1. Entra a hPanel (hostinger.com > Iniciar sesión). Credenciales: tuyas, nunca por chat.
2. En el menú: **Dominios > DNS** (la pantalla se llama **"Editor de zona DNS"**) > elige **`radaelliswimwear.com`** > botón **"Administrar registros DNS"**.
3. Busca la fila **A** con nombre `@` > pulsa el **icono del lápiz** de esa fila > cambia el valor > Guarda.
4. Busca la fila **CNAME** con nombre `www` > icono del lápiz > cambia el valor > Guarda. Deja TTL en 300.
5. Verifica que NO quede otra fila A, AAAA ni CNAME para `@` o `www`. Si queda alguna, anótala y pregunta antes de borrar.
6. Los nombres de Hostinger pueden cambiar con el tiempo: si no ves "Editor de zona DNS", usa la lupa de hPanel y escribe "DNS".

**Cuidado: esta misma cuenta de Hostinger tiene OTRO dominio que no es de la tienda.** No lo abras ni cambies nada en él. Antes de guardar cualquier cambio, mira en la parte de arriba que el nombre del dominio sea `radaelliswimwear.com`.

Camino rápido opcional: en Shopify, Configuración > Dominios > `radaelliswimwear.com` hay un botón "Hostinger > Iniciar sesión" (conexión automática). Necesita **tu propio** inicio de sesión en Hostinger. No pulses "Actualicé los registros DNS" hasta que los registros realmente hayan cambiado.

## 4. Cómo se verifica con herramientas públicas (sin saber de tecnología)
1. Abre `https://dnschecker.org`. Escribe `radaelliswimwear.com`, tipo **A**. Debe mostrar `23.227.38.65` en casi todos los países. (Durante 5–60 min algunos mostrarán el valor viejo: es normal.)
2. Repite con `www.radaelliswimwear.com`, tipo **CNAME**: debe decir `shops.myshopify.com`.
3. Repite con tipo **MX**: debe seguir diciendo `mx1.hostinger.com` y `mx2.hostinger.com`.
4. Opcional, en Windows (Símbolo del sistema): `nslookup radaelliswimwear.com 8.8.8.8`.
5. En el navegador (mejor en ventana privada o con datos móviles): abre `https://radaelliswimwear.com`. Debe verse el candado y la tienda Shopify.
6. En Shopify: Configuración > Dominios: el dominio ya no debe decir "Requiere configuración" y debe tener certificado SSL activo.
7. Cuando DNS y SSL estén en verde (y solo entonces), el dominio se cambia a **Tienda principal** (si no se cambia, los visitantes terminan en la dirección myshopify.com) y `www` redirige al dominio principal. Después se quita la contraseña y se publica el tema (lo hace el coordinador, con tu GO).
   - **Hecho el 2026-10-02:** dominio principal, certificado Let's Encrypt válido para el dominio y para `www` hasta 2026-12-31, `http` va a `https`, `www` va al dominio sin `www`, contraseña quitada ("Lanzar tienda" en Tienda online) y tema Radaelli RC1.10 publicado (Horizon quedó en borrador).

Tiempos esperados:
- DNS: unos 5 minutos (TTL 300); algunos proveedores tardan hasta 1 hora.
- Certificado SSL gratis de Shopify: normalmente 5–60 min. Shopify indica que puede tardar más (hasta 48 h en casos raros).
- Durante la espera, `https://` puede mostrar aviso de certificado. No es un fallo definitivo.

## 5. Receta de ROLLBACK (volver al sitio viejo, ~5–10 minutos)

Cuándo: la tienda Shopify no abre en el dominio, el certificado falla, o nadie puede pagar y no se resuelve rápido (documento 10).

### 5.0 Rollback MÍNIMO (preferido, 2 minutos, no toca el DNS)
Antes de devolver el DNS, prueba esto, que se deshace con un clic: **Admin > Tienda online > Preferencias > activa la protección con contraseña** (o el selector Privado/Público de esa pantalla). Los clientes dejan de comprar y ves la pantalla de contraseña; el dominio, el certificado y el DNS no se tocan. Para volver a abrir: desactiva la contraseña en esa misma pantalla (o el botón "Lanzar tienda", si Shopify lo vuelve a mostrar; `CONFIRMAR_EN_ADMIN`). **No uses el botón rojo "Desactivar" de Wompi** para frenar ventas (documento 10, sección 5). Solo si la tienda Shopify no puede reabrirse y necesitas el sitio viejo, sigue con el rollback completo:

### 5.1 Rollback COMPLETO (DNS de vuelta a Vercel)
1. **Frena las ventas en Shopify**: contraseña (5.0). Así nadie compra en dos sistemas a la vez.
2. En Hostinger (sección 3) cambia **A `@` → `216.150.1.1`**.
3. Cambia **CNAME `www` → `e7eb3f32d99d3261.vercel-dns-017.com`**.
4. NO toques MX ni TXT, ni el otro dominio de tu cuenta de Hostinger.
5. Verifica con la sección 4 (A debe volver a `216.150.1.1`; el sitio viejo responde con "server: Vercel").
6. **Pagos del sitio viejo**: el sitio viejo recibe avisos de Wompi en otra URL de eventos. Hoy esa URL en el panel de Wompi apunta a Shopify (el integrador de eventos de Wompi para Shopify). Para que el sitio viejo cobre, hay que devolver la URL de eventos de **producción** al valor que usaba el sitio viejo. Ese valor anterior **no está registrado ni se leyó de Wompi**. Lo más probable, inferido del código del sitio viejo (`app/api/webhooks/wompi/route.ts`), es `https://radaelliswimwear.com/api/webhooks/wompi` (GAP-01: sin confirmar en el panel; `PENDIENTE_DUEÑA`). Si cambias la URL de eventos de Wompi, Shopify deja de recibir pagos: por eso se prefiere el rollback mínimo (5.0). Panel de Wompi > Desarrollo > Desarrolladores > Seguimiento de transacciones (`CONFIRMAR_EN_ADMIN`, Wompi). Si no se puede, no cobres en el sitio viejo con tarjeta: coordina por WhatsApp.
7. Pedidos creados en Shopify durante la ventana: Admin > Pedidos. Atiéndelos a mano (despachar o reembolsar). El rollback no los borra.
8. No borres el proyecto de Vercel ni el sitio viejo mientras exista posibilidad de rollback. Fecha de retiro: `PENDIENTE_DUEÑA` (GAP-17).
9. Anota el cambio en la tabla de la sección 7.

Para volver a poner Shopify otra vez (re-lanzar): repite la tabla de la sección 2 (columna AHORA) y quita la contraseña de la tienda.

## 6. QUÉ HACER / QUÉ NO HACER
- Haz una foto/captura de la pantalla DNS **antes** de cada cambio.
- Cambia solo las dos líneas indicadas.
- No cambies los nameservers (los `ns1/ns2 dns-parking.com`).
- No abras ni cambies el otro dominio que vive en tu misma cuenta de Hostinger: no es de la tienda.
- No borres el dominio del Admin de Shopify mientras haya pedidos por cerrar.
- No hagas el cambio sin tener a mano esta página.
- No pegues contraseñas de Hostinger en ningún chat.

## 7. Registro de cambios DNS (lo llena quien ejecute el cambio)

| Fecha y hora (Bogotá) | Quién | Registro | Valor anterior | Valor nuevo | Verificado con |
|---|---|---|---|---|---|
| 2026-10-02, antes de ~11:23 (hora exacta no registrada) | Hostinger hPanel (quién hizo los clics: `PENDIENTE` de anotar) | A `@` | `216.150.1.1` | `23.227.38.65` | Dominio principal en Shopify, certificado y redirecciones comprobados por el equipo el 2026-10-02 |
| 2026-10-02, antes de ~11:23 (hora exacta no registrada) | igual | CNAME `www` (TTL 300) | `e7eb3f32d99d3261.vercel-dns-017.com` | `shops.myshopify.com` | `www` redirige al dominio sin `www` (comprobado) |

Estado al escribir, actualizado 2026-10-02 (tarde): cambio de DNS HECHO; tienda pública en `https://radaelliswimwear.com` desde ~11:23; certificado Let's Encrypt válido hasta 2026-12-31 (apex y `www`). Solo se tocaron esos dos registros. Quedan por anotar: la hora exacta y quién hizo el cambio (si lo recuerdas, escríbelo en la tabla). El primer monitoreo automático (2026-10-02 12:19) salió TODO OK (documento 10, sección 4.1). Antes de ese estado (2026-10-02 ~10:20) el dominio estaba conectado en Shopify pero sin cambios de DNS.

## 8. Dominio y proveedor: datos que faltan
- Registrador del dominio (¿Hostinger?): `PENDIENTE_DUEÑA`. Lo que sí se sabe: el DNS se edita en Hostinger hPanel (Dominios > DNS) y esa cuenta tiene además otro dominio que no es de la tienda.
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
