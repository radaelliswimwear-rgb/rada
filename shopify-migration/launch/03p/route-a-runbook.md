# 03P — Runbook de la Ruta A (confirmada por Soporte): Gmail final = dueño de la tienda

**Estado:** preparado, **NO ejecutado**. Confirmación escrita de una persona de Soporte de Shopify para (a) la secuencia, (b) reutilización inmediata del correo original tras verificar el temporal, (c) las dos tiendas de desarrollo siguen funcionando y (d) el acceso de colaborador requiere aprobación del dueño nuevo. Ver `support-chat-summary.md`.

**Lo que define el resultado:** el Store Owner final es el Gmail de la dueña (`<GMAIL-DEL-NEGOCIO>`), y la cuenta de Partner (Dev Dashboard) pasa a usar un **correo temporal** que ella controla (`<CORREO-TEMPORAL>`).

## Qué cambia para la dueña (para que lo decida con esto claro)
- **Desde el Paso 2, el correo con el que entra hoy al Dev Dashboard, a la organización de Partner y a las dos tiendas de desarrollo será el temporal.** La contraseña puede seguir igual (la cambia solo ella si quiere).
- El Gmail original pasa a ser una **cuenta de comerciante nueva** (nuevo Shopify ID, contraseña nueva que ella define), y será el **Store Owner** de «Radaelli Swimwear» y quien paga el plan.
- Envia, Wompi y Search & Discovery se conservan (están en la tienda, no en el correo).
- Claude deberá **volver a autorizar** `shopify store auth` en la tienda y **pedir acceso de colaborador** (la dueña, ya como comerciante, lo aprueba).

## Pasos (todos los owner-only con la dueña presente; Claude prepara cada pantalla)
| # | Quién | Acción | Verificación / rollback |
|---|---|---|---|
| 0 | Dueña (texto) | Elegir el correo temporal que ella controla y aprobar por escrito la Ruta A | Sin respuesta = no se avanza |
| 1 | Claude | Repetir snapshot: parity 8/8, inventario, legales, RC1.10, Wompi TEST, backup | Backup `shopify-migration-backup` al día |
| 2 | Dueña | Cambiar el correo del Shopify ID de Partner al temporal (perfil → Actualizar correo; pide su contraseña actual) | Claude no ve ni pide la contraseña |
| 3 | Dueña | **Abrir el correo de confirmación enviado al temporal y confirmarlo.** *No seguir antes.* | Si no llega: reenviar; no crear la cuenta nueva todavía |
| 4 | Claude | Verificar (sin contraseñas) que el Dev Dashboard abre con el correo nuevo, que las 3 tiendas siguen en la organización y que «Radaelli Swimwear» sigue como «Para transferir a clientes» | Si falla: detener y pedir ayuda a Soporte |
| 5 | Dueña | Crear un **Shopify ID nuevo con el Gmail original** en shopify.com como comerciante (no desde el Partner Dashboard) y verificar el correo | Si el registro falla: esperar a que el paso 3 esté verificado; contactar a Soporte |
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
