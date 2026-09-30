# 03P — Mensaje para Soporte de Shopify (Partners): dueño final = el mismo correo de la cuenta de Partner

*Borrador preparado por Claude. **No enviado.** Lo manda Daniela por el chat/soporte de Shopify Partners o Dev Dashboard (Claude no contacta a Soporte a nombre de ella). Sin contraseñas, sin datos de tarjeta, sin URL de checkout. El correo aparece como `<CORREO-DEL-NEGOCIO>`; Daniela lo escribe al pegarlo.*

## Versión en inglés (para pegar)

**Subject:** Client Transfer Store — final merchant owner must be the same email as the Partner/creator account

Hello Shopify Partner Support,

I built a **Client Transfer Store** called **"Radaelli Swimwear"** (handle `radaelli-swimwear-colombia-launch-1jeqp0yj`, Colombia, COP) in my own Partner organization, and I need to hand it over to myself as the **merchant** (Store Owner).

- The email I must keep as the **final Store Owner / merchant login** is `<CORREO-DEL-NEGOCIO>`.
- That same email is currently my **Partner / organization owner** account and the **creator/account owner** of the client transfer store (it is the only user in the organization and holds the Organization owner role).
- In Dev Dashboard → Stores → (store) → **Transfer store**, which opens Settings → General → store transfer, entering that same email is **rejected**. No transfer has been sent; nothing irreversible has been done.
- I do **not** want to hand the store to a different email, because the merchant account that pays the plan must be `<CORREO-DEL-NEGOCIO>`.

**Desired outcome:** the store leaves the Partner organization and ends up owned by `<CORREO-DEL-NEGOCIO>` as **Store Owner**, with a paid plan that includes third-party carrier-calculated shipping.

**Questions:**
1. What is the **supported sequence** for this exact case (Partner and merchant are the same person/email)?
2. Is it supported to **separate or change the Partner account email/role first** (for example, changing the email of the current Shopify ID and then using the freed email as a new merchant Shopify ID)? Can the freed email be reused for a new Shopify ID?
3. Alternatively, can Support complete the ownership handoff to the same email, or is a temporary owner followed by "Change ownership" supported (recipient must already be a staff user)?
4. Will the store keep its data, apps (Wompi, Envia, Search & Discovery) and settings through whichever route you recommend?

Thank you. Please reply with the exact steps and any owner-only actions you need from me.

## Resumen en español (para la dueña)

Le pedimos a Shopify cuál es la forma oficial de que tu tienda quede a nombre del **mismo correo** con el que la creaste y con el que entras (hoy ese correo es la cuenta de Partner y la dueña de la organización, y la pantalla de transferencia lo rechaza). Preguntamos si se puede separar o cambiar primero el correo de la cuenta de Partner, si el correo liberado se puede reusar, y si hay otra ruta (dueño temporal y luego «cambiar propiedad»).

## Hechos verificados (sin datos personales)

- Tienda: «Radaelli Swimwear», tipo «Para transferir a clientes», País Colombia, COP.
- Organización del Dev Dashboard: 3 tiendas (la de lanzamiento y dos tiendas de pruebas de desarrollo); un solo usuario, con rol «Propietario de la organización» (y de tienda).
- Pantalla de transferencia oficial: Dev Dashboard → Tiendas → ⋮ → «Transferir tienda» (abre Configuración → General → store-transfer). Dice: invitación al nuevo propietario; debe actualizar facturación y formas de pago al completar; se recibe acceso de colaborador.
- Shopify documenta (no se ejecutó): cambiar el correo del Shopify ID se hace desde el perfil y **aplica a todas las tiendas vinculadas**, y exige la contraseña actual (la escribe solo Daniela). Cambiar de propietario a un usuario existente exige que ese usuario ya figure en «Configuración → Usuarios».
- La documentación oficial revisada **no** explica el caso «mismo correo» ni si un correo liberado puede reutilizarse: por eso se pregunta a Soporte.
