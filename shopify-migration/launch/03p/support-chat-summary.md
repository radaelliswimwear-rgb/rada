# 03P — Resumen del chat con Soporte de Shopify (2026-09-30) — sin datos personales ni contraseñas

**Canal:** chat del Centro de Ayuda de Shopify, iniciado por Claude con autorización escrita de la dueña («Sí, envíalo»). Claude se identificó como asistente de IA que escribe en nombre de la dueña; ella haría cada paso de propietaria. **No se hizo ningún cambio de correo, transferencia, plan ni pago.**

**Quién respondió:** primero el asistente automático de Shopify (IA, **no vinculante**) y después una persona de Soporte (Bhumi, «Shopify Support Advisor»), cuya confirmación escrita es la que cuenta.

## Confirmado por escrito por la persona de Soporte
| Punto | Respuesta |
|---|---|
| (a) ¿Es la ruta soportada cuando Partner y comerciante son la misma persona? | **Sí.** El rechazo ocurre porque el correo destino coincide con el de la cuenta de Partner; el sistema exige dos cuentas distintas. Ruta: 1) cambiar el correo de la cuenta de Partner a un correo temporal que ella pueda abrir (desde el perfil del Partner Dashboard); 2) crear una cuenta de comerciante nueva en shopify.com con el correo original (como comerciante normal, **no** desde el Partner Dashboard); 3) iniciar la transferencia desde el Dev Dashboard hacia el correo original; 4) aceptarla desde la cuenta nueva y elegir un plan de pago. Los datos, configuración y apps (Wompi, Envia, Search & Discovery) se conservan; la tienda no se borra. |
| (c) Las dos tiendas de desarrollo y el Dev Dashboard tras el cambio de correo | **Siguen funcionando igual** dentro de la misma organización de Partner. Cambiar el correo de acceso es una actualización de credenciales: no afecta la propiedad ni el acceso dentro de la organización; solo se entra con el correo nuevo. |
| (d) ¿La organización de Partner conserva acceso de colaborador a la tienda transferida? | **No automáticamente.** La tienda sale por completo de la organización y deja de aparecer en el Dev Dashboard; para seguir trabajando en ella, **el dueño nuevo debe aprobar una solicitud de acceso de colaborador** desde la organización de Partner. *(Nota: la pantalla de transferencia decía «recibirás acceso de colaborador automáticamente»; Soporte lo matiza. Se asume que hay que pedir y aprobar el acceso.)* |
| Precio | Una tienda de desarrollo transferida **no** es elegible para el precio promocional de 1 USD/mes; se aplica el precio estándar del plan. |

## (b) Confirmado por escrito después de consultar con su equipo
- **Una vez cambiado el correo del Shopify ID de Partner, no hay periodo de espera documentado:** cuando se completa el cambio y se **hace clic en el correo de confirmación enviado al correo temporal**, el correo original queda liberado y **se puede usar de inmediato** para registrar un Shopify ID nuevo en shopify.com.
- **Advertencia de orden:** hay que **esperar a que el cambio esté verificado** (recibir y abrir el correo de confirmación del correo temporal) **antes** de crear la cuenta de comerciante con el correo original; si se intenta antes, el registro puede fallar o bloquearse.
- Se pidió a Soporte una copia del chat por correo a la cuenta (no verificado que llegue).

## Consecuencias para el plan (no ejecutado)
1. Es la **Rama A** del árbol de decisión (`owner-route-decision-tree.md`) y ahora tiene **confirmación escrita de una persona de Soporte para (a), (b), (c) y (d)**. **Sigue sin ejecutarse:** cambiar el correo exige la contraseña y la verificación de la dueña (owner-only) y ella debe estar presente y aprobar por escrito; las dos tiendas de desarrollo y el Dev Dashboard pasarán a usar el correo temporal para entrar.
2. Tras la transferencia habrá que **pedir acceso de colaborador** (la dueña lo aprueba) para que Claude siga.
3. El plan se elige en la cuenta de comerciante nueva, con el precio estándar.
