# CLAUDE RESULT

PHASE: 03M — PRE-LAUNCH INTEGRATIONS + BLOCKER BURN-DOWN
MODEL: SONNET 5.5
STATUS: READY_FOR_CHATGPT_REVIEW — Todo lo permitido y autónomo se hizo en la única tienda de lanzamiento (Client Transfer Store, ahora «Radaelli Swimwear»). Verificado: nombre visible cambiado; COP/America-Bogota/kg/Colombia intactos; checkout con correo y teléfono de envío OBLIGATORIO; zona Colombia con una sola tarifa «Envío estándar gratis» desde COP 299.900; **checkout de punta a punta PASÓ con la pasarela de prueba de Shopify** (pedido #1001 de COP 367.840, envío 0, confirmación, correo disparado, sin dinero real; pedido archivado); parity 8/8 y control de enlaces 9/9 tras los cambios. Bloqueado o pendiente por causa ajena: **Wompi no es instalable** hoy (ni en proveedores ni en la App Store); **Envia instalada** pero sin cuenta (solo la dueña) → sin tarifas en vivo; **Search & Discovery** llevada hasta la pantalla de permisos, falta el clic «Instalar» de la dueña. Idioma principal sigue en inglés (cambiarlo traduce Pago y Tema: efecto material, documentado para el corte).

Reporte completo: `shopify-migration/theme/03M-prelaunch-integrations-report.md` (versionado en `shopify-migration-backup`, commit 4ffdd5f; sin `main` ni PR). Este archivo es su copia íntegra (sin datos personales, sin llaves, sin tokens, sin contraseña de la tienda, sin URL de checkout ni de integración de Envia).

**PARA CHATGPT (lo que conviene saber antes de decidir 03N):**
1. **Riesgo principal (D6):** no existe tarifa de envío por debajo de COP 299.900 (no se inventó ningún importe; se borró la tarifa por defecto de Shopify). Hoy un pedido menor no tiene método de envío. Hay que decidir antes de publicar: cálculo en vivo (requiere cuenta de Envia, pesos y medidas de cada prenda —hoy 0,0 kg— y plan que lo permita, sin verificar) o importe fijo dado por la dueña.
2. **Wompi:** sin ruta de instalación en esta tienda. Recomendado: investigar en 03N si la instalación aparece tras la transferencia o si Wompi ofrece otra ruta; llaves solo por la dueña.
3. **Matriz (8 categorías de 03M):** `launch/03M-blocker-matrix.md`, 39 filas: DONE 9, POST-TRANSFER REQUIRED 3, OWNER FACT/DATA 2, OWNER DECISION 5, OWNER AUTH/OAUTH 5, BILLING/PLAN 1, FINAL CUTOVER 3, OPTIONAL/DEFERRABLE 11.
4. **404 legales intencionales: exactamente 4** (`/envios`, `/terminos`, `/privacidad`, `/cookies`).
5. **C4 (contraste):** parche preparado y NO aplicado (OWNER DECISION). Herramienta de inventario/XL lista (`03m-post-decision.mjs`), sin datos inventados.
6. **Clics de la dueña en 03M: 3** (instalar Envia, teclear la tarjeta de prueba y pagar, y —pendiente— instalar Search & Discovery). Ninguna pregunta rutinaria.
7. **Pasarela de prueba activa** en la tienda de lanzamiento (las tiendas de desarrollo solo procesan pagos de prueba); al transferir se reemplaza. Contraseña de la tienda puesta.
8. **No afirmado:** que Wompi funcione, que existan tarifas en vivo, que el correo llegue a una bandeja real (AC-08 pendiente), que la tienda esté lista para publicarse.

---

# 03M — Integraciones previas al lanzamiento y quema de bloqueos

**Tienda:** Client Transfer Store «Radaelli Swimwear» (lanzamiento). Sin transferir, sin plan de pago, contraseña de la tienda puesta.
**No se tocó:** Producción, Staging, Vercel, Neon, DNS, facturación, Horizon, `main`. **No se hizo:** transferir la tienda, elegir plan, ingresar tarjeta de facturación, quitar la contraseña, conectar dominio, publicar RC1.10, activar Wompi en vivo, mover dinero real, comprar etiquetas.

## 1. Respuestas explícitas

| Pregunta | Respuesta |
|---|---|
| ¿Envia instalada / configurada? | **Instalada** (clic de la dueña). **No configurada**: falta su cuenta de Envia.com (solo ella), origen y paquetes. |
| ¿Tarifas en vivo bajo $299.900 antes de transferir? | **No.** La opción «Calculado por la empresa de transporte o la app» existe en la tienda, pero necesita la cuenta de Envia, peso y medidas de cada prenda (hoy 0,0 kg) y, en producción, que el plan lo permita (sin verificar; no se eligió plan). |
| ¿Envío gratis desde $299.900 funciona? | **Sí**, verificado en un checkout real de prueba: COP 367.840, envío 0. |
| ¿Wompi instalado? | **No instalable hoy**: no está en la lista de proveedores de pago de la tienda ni en la App Store. Sin llaves pedidas ni tocadas. |
| ¿Wompi en modo prueba? | **No aplica** (no instalado). |
| ¿Checkout de punta a punta pasó? ¿Con qué pasarela? | **Sí**, con la **pasarela de prueba de Shopify** (Bogus). Pedido #1001. Evidencia: `launch/evidence/03M-checkout-e2e.json`. |
| ¿Search & Discovery instalada? | Ver §6: llevada hasta la pantalla de permisos; **falta el clic «Instalar» de la dueña** salvo que §6 diga lo contrario. |
| 404 legales intencionales | **Exactamente 4**: `/envios`, `/terminos`, `/privacidad`, `/cookies`. Control de enlaces 9/9 PASS. |
| Decisiones y datos que faltan | `launch/03m/owner-final-data-form.md` (F1–F6, D1–D6, acciones C1–C5). |
| Solo después de la transferencia | Proveedor de pago real, plan, idioma principal, pasarela de prueba fuera, contraseña de la tienda, DNS, publicar. |

## 2. Configuración de la tienda (paso 1)

- Nombre visible: **Radaelli Swimwear** (verificado por API; el identificador técnico no cambia hasta transferir).
- COP, America/Bogota, métrico/kg, país Colombia, un solo mercado (paridad Q8 PASS).
- Español publicado y por defecto en el dominio raíz. **Idioma principal sigue en inglés**: el cambio muestra que aplicaría traducciones a «Pago y Sistema» y a los temas (efecto material sobre RC1.10); se canceló y queda para el corte.
- Contraseña de la tienda: sigue puesta (no se leyó ni se escribió).

## 3. Checkout (paso 2)

Contacto por correo; teléfono de la dirección de envío **obligatorio**; sin campo de empresa (no se inventó NIT). En Envia, para Colombia, la etiqueta de empresa se renombra «Nit/CC» cuando la dueña dé el dato (F2).

## 4. Envíos (paso 3)

Perfil general, zona Colombia con **una sola tarifa**: «Envío estándar gratis», por importe del pedido ≥ COP 299.900, 3 a 5 días hábiles. Se eliminaron la tarifa por defecto de Shopify (importe inventado) y la zona internacional. **No existe tarifa bajo 299.900**: hoy un pedido menor no tiene método de envío hasta que la dueña decida (D6). Es una consecuencia consciente de no inventar precios; se marca para decidir antes de publicar.

## 5. Pagos y checkout de punta a punta (pasos 4 y 5)

Se activó la pasarela de prueba de Shopify (las tiendas de desarrollo solo procesan pagos de prueba). La dueña escribió ella el número de prueba; yo no escribí ninguna tarjeta. Resultado: país/departamentos, COP, teléfono requerido, envío gratis, pago, confirmación, pedido #1001 (pagado, no preparado, «pedido de prueba»), correo de confirmación disparado (línea de tiempo), variantes sin seguimiento (no descuenta stock). Limpieza: pedido **archivado** (sin reembolso ni eliminación), carrito vacío. La pasarela queda activa en la tienda porque es la única posible en esta etapa; al transferir se reemplaza.

## 6. Search & Discovery y wishlist (paso 6)

App gratuita de Shopify, llevada hasta su pantalla de permisos; el clic final es de la dueña (OAuth). Reseñas públicas recientes reportan búsquedas irregulares en Colombia (dato de terceros, sin verificar): conviene probarla antes de publicar. No se instaló ninguna app de pago. La sincronización de favoritos con cuenta (app personalizada) no se permite en tiendas de transferencia: **post-transferencia**; los favoritos de invitado siguen funcionando.

## 7. Analítica y correo (paso 7)

Sin píxeles en «Eventos de clientes» (vacío): el píxel personalizado sigue apagado y no hay fuga de datos personales por esa vía. La notificación de pedido se disparó (línea de tiempo). No se pide a la dueña confirmar bandeja: el pedido de prueba usó un correo @example.com sintético; AC-08 se hará con un pedido real de prueba cuando ella lo indique.

## 8. Legal y datos (pasos 8 y 9)

Nada inventado. Las páginas Privacidad/Términos/Envíos/Cookies siguen sin existir; los 4 redireccionamientos son los únicos 404 intencionales. Formulario compacto: `launch/03m/owner-final-data-form.md`. Inventario, XL y datos de clientas: siguen `PENDING_OWNER`; comandos deterministas listos en `launch/tools/03m-post-decision.mjs` (`inventory`, `unlimited`, `xl`; para escribir hay que repetir `shopify store auth` con permisos de inventario y sucursales).

## 9. Accesibilidad C4 (paso 10)

Parche preparado y **no aplicado**: `launch/03m/c4-contrast-option-a.patch` + `.md` (1,69:1 → 8,34:1; hover 21:1). Cambia una decisión de marca, así que es OWNER DECISION.

## 10. Verificación posterior

- `03l-migrate.mjs parity`: **8/8 PASS** (después de todos los cambios de 03M).
- `03k-content-links-check.mjs`: **9/9 PASS**.
- Matriz de bloqueos: `launch/03M-blocker-matrix.md` (39 filas: DONE 9, POST-TRANSFER REQUIRED 3, OWNER FACT/DATA 2, OWNER DECISION 5, OWNER AUTH/OAUTH 5, BILLING/PLAN 1, FINAL CUTOVER 3, OPTIONAL/DEFERRABLE 11), generada por `launch/tools/03m-blocker-matrix.mjs` (`--check`).

## 11. Riesgos y notas

1. **Sin método de envío para pedidos < COP 299.900** hasta D6. Es lo más importante que la dueña debe decidir antes de publicar.
2. Pasarela de prueba activa: no hay dinero real posible mientras la tienda sea de desarrollo; al transferir se instala el proveedor real.
3. El pedido #1001 quedó archivado (existe) en la tienda de lanzamiento; la numeración real empezará en #1002 salvo que la dueña lo pida distinto (no hay forma de reiniciar sin borrar).
4. Envia tiene permisos amplios (clientes, productos, pedidos). Se instaló por instrucción de la dueña; no se le dieron credenciales ni se compró nada.
