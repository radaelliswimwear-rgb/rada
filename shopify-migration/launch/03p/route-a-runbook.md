# 03P — Runbook de la Ruta A (confirmada por Soporte): Gmail final = dueño de la tienda

**Estado:** preparado, **NO ejecutado**. Confirmación escrita de una persona de Soporte de Shopify para (a) la secuencia, (b) reutilización inmediata del correo original tras verificar el temporal, (c) las dos tiendas de desarrollo siguen funcionando y (d) el acceso de colaborador requiere aprobación del dueño nuevo. Ver `support-chat-summary.md`.

**Lo que define el resultado:** el Store Owner final es el Gmail de la dueña (`<GMAIL-DEL-NEGOCIO>`), y la cuenta de Partner (Dev Dashboard) pasa a usar un **correo temporal** que ella controla (`<CORREO-TEMPORAL>`).

## Qué cambia para la dueña (para que lo decida con esto claro)
- **Desde el Paso 2, el correo con el que entra hoy al Dev Dashboard, a la organización de Partner y a las dos tiendas de desarrollo será el temporal.** La contraseña puede seguir igual (la cambia solo ella si quiere).
- El Gmail original pasa a ser una **cuenta de comerciante nueva** (nuevo Shopify ID, contraseña nueva que ella define), y será el **Store Owner** de «Radaelli Swimwear» y quien paga el plan.
- Envia, Wompi y Search & Discovery se conservan (están en la tienda, no en el correo).
- Claude deberá **volver a autorizar** `shopify store auth` en la tienda y **pedir acceso de colaborador** (la dueña, ya como comerciante, lo aprueba).

## Decisión de la dueña (2026-09-30)
- **Ruta A APROBADA por escrito.** Correo temporal de la cuenta de Partner: el que ella indicó en el chat (`<CORREO-TEMPORAL>`; no se escribe en GitHub). Dueño final: su Gmail del negocio (`<GMAIL-DEL-NEGOCIO>`).
- Mientras esté remota: Claude **no** ejecuta ningún paso que pida contraseña, código, clave de acceso, aceptación de transferencia, plan ni aprobación de colaborador.

## Hallazgos de la preparación (2026-09-30, solo lectura)
1. **Pantalla del cambio de correo:** perfil de la cuenta de Shopify (accounts.shopify.com → «Perfil de cuenta», sección «Correo electrónico» → «Actualizar»).
2. **Verificación exigida:** Shopify pide la **clave de acceso** (passkey: huella, rostro o PIN del dispositivo). **Es solo de la dueña y no se toca.** La documentación mencionaba contraseña; esta cuenta usa clave de acceso.
3. **Inicio de sesión con Google conectado** a la cuenta actual (su Gmail). Riesgo: que ese vínculo con Google siga atado al Shopify ID viejo y estorbe el registro del Shopify ID nuevo con el mismo Gmail. El asistente automático recomendó desconectarlo antes y poner una contraseña de respaldo en la cuenta vieja; **lo confirma una persona de Soporte en el chat 2** (ver `support-chat-summary.md`).
4. El correo de contacto de la tienda («Radaelli Swimwear») ya es el Gmail; eso no es el inicio de sesión y no cambia.

## Pasos (todos los owner-only con la dueña presente; Claude prepara cada pantalla)
| # | Quién | Acción | Verificación / rollback |
|---|---|---|---|
| 0 | Dueña (texto) | Elegir el correo temporal que ella controla y aprobar por escrito la Ruta A | Sin respuesta = no se avanza |
| 1 | Claude | Repetir snapshot: parity 8/8, inventario, legales, RC1.10, Wompi TEST, backup | Backup `shopify-migration-backup` al día |
| 1a | Dueña | **Poner una contraseña de Shopify a la cuenta actual** como respaldo (Perfil → Seguridad), verificando con su clave de acceso | Confirmado por Soporte: las cuentas solo con Google y sin contraseña pueden quedar en un ciclo de inicio de sesión |
| 1b | Dueña | **Desconectar el inicio de sesión con Google** de la cuenta actual (Perfil → «Servicio de inicio de sesión» → Desconectar). Después puede entrar con su clave de acceso o la contraseña nueva | Confirmado por Soporte (segunda consulta): es lo más seguro antes del paso 5 |
| 2 | Dueña | Cambiar el correo del Shopify ID de Partner al temporal (Perfil → Correo electrónico → Actualizar; verificación con **clave de acceso**) | Claude no ve ni pide claves ni códigos |
| 3 | Dueña | **Abrir el correo de confirmación enviado al temporal y confirmarlo.** *No seguir antes.* | Si no llega: reenviar; no crear la cuenta nueva todavía |
| 4 | Claude | Verificar (sin contraseñas) que el Dev Dashboard abre con el correo nuevo, que las 3 tiendas siguen en la organización y que «Radaelli Swimwear» sigue como «Para transferir a clientes» | Si falla: detener y pedir ayuda a Soporte |
| 5 | Dueña | Crear un **Shopify ID nuevo con el Gmail original** en shopify.com como comerciante (no desde el Partner Dashboard); «Continuar con Google» está soportado una vez desconectado Google de la cuenta vieja | Si el registro falla: esperar a que el paso 3 esté verificado; contactar a Soporte |
| 6 | Claude | En Dev Dashboard → tienda → «Transferir tienda» escribe el Gmail y la envía (con la dueña presente y la aprobación escrita del paso irreversible) | La invitación vence a los 7 días; se puede cancelar mientras esté pendiente |
| 7 | Dueña | Aceptar la invitación desde el Gmail nuevo; completar facturación y **elegir plan** (Claude muestra antes la comparación y costos reales) | La elección del plan requiere su aprobación escrita aparte |
| 8 | Dueña | Aprobar la solicitud de **acceso de colaborador** de la organización de Partner | Sin ella, Claude no puede seguir |
| 9 | Claude | Verificar dueño, plan y CCS; Envia; prueba de tarifa < COP 299.900; Wompi sigue TEST; contraseña de tienda ON; RC1.10 sin publicar | Pasos 4 a 9 del prompt de 03P |

## Reversión
- Antes del paso 6: volver el correo de Partner al original solo si Shopify lo permite (verificar con Soporte antes; el Gmail ya estaría tomado si se hizo el paso 5).
- Después del paso 6 y antes de aceptar: cancelar la invitación pendiente.
- Después de aceptar: la tienda ya es de la dueña; los cambios posteriores siguen siendo reversibles salvo plan y facturación.

## Riesgos conocidos
1. Se pierde el acceso si el correo temporal no se puede abrir: **debe ser uno al que ella acceda siempre**.
2. El orden de los pasos 3 y 5 es obligatorio (Soporte).
3. Las dos tiendas de desarrollo quedan en la organización de Partner con el correo temporal.
