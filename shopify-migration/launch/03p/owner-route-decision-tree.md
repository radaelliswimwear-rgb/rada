# 03P — Árbol de decisión: cómo dejar el Gmail de la dueña como Store Owner (NADA SE EJECUTA sin aprobación)

**Restricción de la dueña:** el dueño final (Store Owner) debe ser su Gmail actual. **No autoriza transferir a otro correo.** Hasta tener respuesta de Soporte: no transferir, no cambiar correos, no cambiar propietario, no plan, no pago, no DNS, no publicar, no Wompi en vivo.

**Estado verificado (solo lectura, 2026-09-30):** la organización de Dev Dashboard tiene 3 tiendas y **un solo usuario** (la dueña) con rol «Propietario de la organización» (y de tienda). La pantalla oficial de transferencia rechaza ese mismo correo. La documentación oficial de Shopify no describe el caso «mismo correo».

## Qué documenta Shopify (y qué no)

| Dato | Fuente oficial | Uso |
|---|---|---|
| Transferir = invitación por correo al nuevo propietario; vence a los 7 días; el cliente actualiza facturación y formas de pago; se conserva acceso de colaborador | shopify.dev «Client transfer stores» y la propia pantalla | Ruta normal |
| Cambiar el correo de un Shopify ID se hace desde el perfil, exige la contraseña actual y **se aplica a todas las tiendas vinculadas** | help.shopify.com «Manage your account» | Ruta A (no documenta si el correo liberado se puede reutilizar) |
| Cambiar propietario de una tienda a un **usuario que ya existe** en «Configuración → Usuarios» | help.shopify.com «Change or transfer ownership» | Ruta C |
| Transferir la propiedad de la organización: solo a usuarios internos; para externos hay que contactar a Soporte (Plus) | changelog de Shopify | Referencia |
| Caso «mismo correo» | **No documentado** | Preguntar a Soporte |

## Reglas comunes a todas las rutas
- Claude **no** pide ni usa la contraseña de la dueña; cualquier cambio de correo/contraseña/2FA lo hace solo ella.
- Antes de cualquier paso irreversible: Claude deja abierta la pantalla exacta, la dueña está presente y da **una** aprobación por escrito.
- La transferencia de la tienda de lanzamiento es **solo** de «Radaelli Swimwear»; las dos tiendas de pruebas de desarrollo no se tocan (pero el cambio de correo de un Shopify ID las afecta porque van al mismo ID: anotar).
- Tras cualquier ruta: Claude verifica dueño, plan y acceso de colaborador y sigue con el plan de 03P (CCS, Envia, pruebas).

## Rama A — Soporte: «cambia primero el correo de la cuenta de Partner»
1. Soporte confirma por escrito que el correo liberado **se puede reutilizar** para un Shopify ID nuevo de comerciante. (Sin esta confirmación, **no seguir**.)
2. Dueña (solo ella): cambia el correo del Shopify ID actual a otro correo **que controle** (temporal para la cuenta de Partner), con su contraseña y verificación por correo. *Efecto:* cambia el inicio de sesión del Dev Dashboard y de las 3 tiendas de esa organización; los OAuth de Claude (`shopify store auth`) pueden requerir repetirse.
3. Dueña: crea un Shopify ID nuevo con su Gmail (será la cuenta de comerciante). Verifica el correo.
4. Claude: en «Transferir tienda» escribe el Gmail; dueña acepta la invitación desde el Gmail; se completa la transferencia.
5. Dueña: facturación y plan. Claude: Pasos 4 a 9 de 03P.
- **Reversión antes de aceptar la transferencia:** cancelar la invitación pendiente y volver el correo original si Shopify lo permite.
- **Riesgo:** perder acceso si la verificación falla; por eso exige confirmación escrita de Soporte.

## Rama B — Soporte: «quita o cambia el rol de Partner primero»
1. Soporte indica exactamente qué rol/organización cambiar (por ejemplo, crear un segundo usuario/organización o quitar el rol de «Propietario de la organización» al correo).
2. Claude prepara la lista de pasos y de clics de la dueña; se ejecuta solo con su aprobación escrita y presente.
3. Se verifica que la tienda de lanzamiento sigue accesible y se repite el intento de transferencia al Gmail (un solo intento).
- **Reversión:** devolver el rol original. **Riesgo:** dejar la organización sin dueño; Soporte debe indicar el orden seguro.

## Rama C — Soporte confirma: «dueño temporal y luego cambiar propiedad»
**Requiere autorización escrita nueva de la dueña** (hoy NO autorizada) y confirmación de Soporte de que el Gmail puede figurar como **usuario del personal** de una tienda donde ya tendrá acceso de colaborador.
1. Dueña elige un correo temporal que ella controla y confirma por escrito.
2. Transferencia al correo temporal; dueña (desde ese correo) acepta y completa facturación/plan solo si Soporte lo exige.
3. Desde el correo temporal: invitar al Gmail como **usuario** con permisos completos (Configuración → Usuarios).
4. Desde el correo temporal: «Cambiar propiedad» al Gmail (el destinatario debe ser usuario existente; puede pedir reautenticación).
5. Claude verifica que el Gmail es Store Owner y continúa con plan/CCS/Envia.
- **Reversión:** si el Gmail no puede ser usuario, la tienda queda con el dueño temporal: **por eso no se ejecuta sin la confirmación de Soporte**.

## Rama D — Soporte: «el mismo correo no es posible»
Alternativa oficial: **tienda estándar nueva, propiedad del Gmail desde el inicio** (sin transferencia), y repetir la migración determinista.
1. Dueña crea la tienda nueva con su Gmail (paso de cuenta/plan de ella; no lo hace Claude).
2. Claude aplica el runbook `launch/03K-clean-store-bootstrap-runbook.md` (P01–P15) con las herramientas ya listas: olas `03l-migrate.mjs` (definiciones, colecciones, productos, membresía, publicación, páginas, políticas, menús, redirecciones, parity), subir RC1.10 **sin publicar**, peso 500 g (`03o-weights.mjs`), inventario (`03o-inventory-sheet.mjs` + `03m-post-decision.mjs`), 4 textos legales, ajustes de checkout/envío.
3. Dueña (solo ella): instalar Wompi y escribir sus llaves, la URL de eventos, autorizar apps (Envia, Search & Discovery) y el plan con CCS.
4. Claude: Envia, prueba de tarifa, parity y humo.
- **Coste:** repetir configuración manual (envíos, pagos, apps, política de privacidad, sucursal), más el plan desde el inicio.
- **Ventaja:** el dueño es el Gmail sin depender de soporte; los datos de la tienda actual no se pierden (siguen en la tienda de pruebas).

## Rama E — Soporte tarda
Sin respuesta en 24 h hábiles: la dueña decide entre esperar, insistir o la Rama D. Mientras tanto, Claude solo hace trabajo seguro (datos históricos en procedimiento, revisión de tarifas de plan en modo lectura).

## Qué hace Claude en cada caso cuando la dueña vuelve
1. Leer la respuesta de Soporte (la pega la dueña) y elegir la rama.
2. Mostrar los pasos exactos y los clics que son solo de ella.
3. Ejecutar únicamente lo aprobado por escrito, con ella presente.
4. Verificar dueño/plan/acceso y continuar el plan de 03P.
