# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_02I

PHASE: 02I — CART
MODEL: OPUS 5.5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 02I — CART + CART DRAWER

==================================================
START CONDITION
==================================================

Daniela ya decidió continuar con:

OPUS 5.5 ULTRACODE

Cuando Daniela diga:

CONTINUEMOS

debes:

1. leer origin/ai-handoff/session-state.md
2. leer origin/ai-handoff/status.md
3. leer origin/ai-handoff/next-prompt.md
4. ejecutar esta fase 02I exactamente
5. NO pedir autorización adicional para comenzar

NO reutilizar prompts antiguos.
NO volver a ejecutar 02H.

==================================================
CONTEXTO CONFIRMADO
==================================================

Completado:

- Phase 01 — catalog/source of truth
- Phase 02 — architecture/blueprint
- 02A — theme skeleton
- 02B — global styles
- 02C — header/navigation
- 02D — footer
- 02E — Home
- 02F — Product Card
- 02G — Collection Page
- 02H — Product Page

02H fue ejecutada con Opus 5.5 Ultracode y terminó con:

- Theme Check 0 errors / 0 warnings
- interaction harness 20/20
- PDP responsive/accessibility PASS
- variant picker
- size selector
- add-to-cart nativo
- product gallery
- lightbox
- zoom
- pinch zoom
- size guide
- recommendations
- hook cancelable:
  product:add-to-cart

El add-to-cart de 02H actualmente puede usar flujo estándar hacia /cart,
pero dejó un hook preparado específicamente para 02I.

OBJETIVO DE 02I:

Construir el CART REAL de la futura tienda Shopify de Radaelli con:

- Cart Drawer
- Cart Page
- AJAX cart interactions
- integración con el add-to-cart de PDP
- quantity changes
- remove
- subtotal
- estados loading/error/empty
- cart count sincronizado con Header
- accesibilidad
- responsive
- performance
- comportamiento equivalente al carrito actual donde Shopify lo permita

Esta fase NO implementa checkout/payment/Wompi.

==================================================
1. REAUDITORÍA OBLIGATORIA DEL CARRITO REAL ACTUAL
==================================================

ANTES DE CODIFICAR:

inspecciona directamente el carrito real del proyecto actual.

Buscar y auditar como mínimo:

- components/cart-drawer/*
- cart-store
- cart drawer
- cart icon / badge
- cart page
- add-to-cart handlers
- item structure
- variant/talla display
- quantity behavior
- remove behavior
- subtotal
- discounts shown in cart
- shipping messages
- free shipping threshold if any
- stock validation
- cart persistence
- cart opening behavior
- mini-cart behavior
- mobile behavior
- desktop behavior
- checkout CTA
- WhatsApp/payment-related cart actions
- analytics hooks
- error handling
- optimistic updates
- loading states
- accessibility
- focus behavior
- keyboard
- body scroll lock
- toast behavior
- stock reservation concepts
- any coupling to Wompi/orders/backend

Auditar también las llamadas reales desde:
- PDP
- Product Card
- Header

NO depender únicamente del blueprint.

Documentar diferencias entre:
- código actual real;
- cart architecture previa;
- Shopify native cart capabilities.

Si algo del carrito actual NO puede migrarse 1:1 a Shopify:
documentarlo con precisión y elegir la alternativa Shopify más segura.

==================================================
2. ARQUITECTURA OBJETIVO
==================================================

Preferencia:

Liquid server-rendered para markup inicial +
Shopify Ajax Cart API para actualizaciones dinámicas.

Usar arquitectura modular.

Posibles archivos, SOLO si ayudan realmente:

sections/cart-drawer.liquid
sections/main-cart.liquid
snippets/cart-item.liquid
snippets/cart-empty.liquid
snippets/cart-summary.liquid
assets/cart.js
assets/cart-drawer.js
assets/section-cart.css
assets/component-cart-drawer.css

No crear archivos triviales innecesarios.

NO React.
NO Next state store.
NO Zustand.
NO framework.

==================================================
3. SHOPIFY CART API
==================================================

Usar endpoints nativos según necesidad:

- /cart.js
- /cart/add.js
- /cart/change.js
- /cart/update.js

NO usar Storefront API si Ajax Cart API basta.

Implementar:
- add
- quantity change
- remove
- cart refresh
- count sync
- subtotal sync
- error handling

No inventar backend custom.

==================================================
4. INTEGRACIÓN CON PDP 02H
==================================================

El PDP de 02H dejó:

product:add-to-cart

como hook cancelable.

Auditar exactamente cómo quedó implementado.

Objetivo:

cuando Cart Drawer esté disponible:
- interceptar/usar ese hook de forma limpia;
- añadir el producto;
- abrir drawer;
- actualizar contenido;
- NO navegar a /cart en flujo JS exitoso.

Fallback obligatorio:

si JS falla o no carga:
el form nativo debe seguir funcionando y llevar al carrito estándar.

PROGRESSIVE ENHANCEMENT obligatorio.

==================================================
5. CART DRAWER
==================================================

Construir Cart Drawer real si el sitio actual lo usa.

Debe cubrir:

- abrir desde Header
- abrir después de add-to-cart
- cerrar botón
- cerrar overlay
- Escape
- focus trap
- return focus
- body scroll lock
- aria-expanded
- aria-controls
- role/dialog semantics apropiadas
- mobile full-height/near-full-height si coincide con diseño real
- desktop drawer width fiel
- safe-area support

No crear un drawer si el carrito real no lo usa.
Pero el proyecto actual sí tiene cart-drawer, por lo que debe reauditase y portarse.

==================================================
6. CART PAGE
==================================================

Construir/terminar:

templates/cart.json
sections/main-cart.liquid

Debe funcionar incluso sin JS.

Debe incluir solo lo real/justificado:

- items
- image
- title
- variant/talla
- price
- quantity
- remove
- line total si aplica
- subtotal
- checkout CTA
- continue shopping si existe
- empty state

No duplicar lógica innecesaria entre Cart Page y Drawer.

Reutilizar snippets compartidos cuando convenga.

==================================================
7. CART ITEMS
==================================================

Cada item debe soportar:

- product image
- product title
- selected variant/options
- quantity
- original/final line price cuando Shopify lo exponga
- discounts nativos cuando existan
- remove

Usar line_item object nativo.

NO hardcodear:
- talla
- color
- price
- SKU
- stock.

==================================================
8. QUANTITY CONTROL
==================================================

Reauditar el comportamiento actual.

Implementar:
- botón decrement
- input
- botón increment

Requisitos:
- mínimo válido
- keyboard
- aria-label
- tap targets
- loading state
- prevent rapid duplicate requests
- server response is source of truth
- rollback visual si request falla

No asumir stock ilimitado.

==================================================
9. REMOVE ITEM
==================================================

Implementar remove con:
quantity: 0
o patrón nativo equivalente.

Debe actualizar:
- drawer
- cart page si aplica
- cart count
- subtotal
- empty state

No requerir reload completo en JS mode.

Fallback sin JS debe seguir siendo funcional.

==================================================
10. CART COUNT
==================================================

El Header de 02C ya muestra cart count real.

02I debe sincronizarlo después de:
- add
- increment
- decrement
- remove

No duplicar múltiples badges desincronizados.

Usar data attributes o custom event único.

Preferencia:
evento global claro, por ejemplo:
cart:updated

Documentar contrato.

==================================================
11. SUBTOTAL / PRICES
==================================================

Usar valores devueltos por Shopify.

Mostrar:
- subtotal real
- line totals
- discounts nativos si los datos los proveen

NO portar la cascada custom de descuentos del backend Next si Shopify no la representa.

NO calcular money manualmente con floats.

Usar money formatting Shopify o formatter seguro basado en cart currency.

==================================================
12. DESCUENTOS
==================================================

Auditar exactamente qué muestra el carrito actual.

Distinguir:

A. descuento visual del producto
B. compare-at
C. discount allocation de Shopify
D. códigos/promociones del backend actual

02I debe usar solo lo que Shopify pueda representar de forma real.

NO implementar coupon engine custom.

Si el carrito actual muestra input de cupón:
documentar si Shopify checkout/cart permite equivalente en esta arquitectura.

NO fingir que un cupón fue aplicado si no existe mecanismo real.

==================================================
13. FREE SHIPPING / SHIPPING MESSAGING
==================================================

Auditar si existe actualmente.

Si existe un umbral:
determinar si es:
- fijo de negocio;
- configurable;
- derivado de shipping rates.

No inventarlo.

Si puede migrarse como mensaje visual:
hacerlo configurable en Theme Editor.

NO prometer envío gratis si la lógica real de Shopify aún no está configurada.

En caso de duda:
dejar feature desactivada por defecto y documentar dependencia.

==================================================
14. STOCK / RESERVATION
==================================================

MUY IMPORTANTE.

La web custom actual tiene lógica propia de stock/reserva alrededor del checkout/pago.

Shopify Cart NO equivale a reserva de inventario.

NO intentes recrear en 02I:
- reserve-before-pay
- order locks
- payment reservation
- Wompi reconciliation
- stock hold custom

El carrito Shopify debe operar con semántica nativa.

Documentar claramente:
"estar en el carrito no reserva inventario".

No introducir falsa garantía de stock.

==================================================
15. CHECKOUT CTA
==================================================

Implementar CTA nativo de Shopify:

/checkout
o form cart checkout según patrón soportado.

PERO:

NO configurar pagos.
NO Wompi.
NO checkout customization.
NO Shopify Plus assumptions.

La prueba real de checkout/Wompi pertenece a fase posterior.

==================================================
16. WHATSAPP-AS-PAYMENT / CUSTOM PAYMENT
==================================================

Auditar si el carrito actual tiene cualquier flujo:
- pagar por WhatsApp
- enviar pedido a WhatsApp
- payment method selector custom

NO migrarlo automáticamente.

Documentar:
- qué existe hoy;
- qué se pierde o cambia en Shopify;
- si podría existir como CTA secundario futuro.

No construirlo en 02I salvo que sea puramente informativo y esté explícitamente justificado.

==================================================
17. EMPTY STATE
==================================================

Implementar empty state coherente en:
- drawer
- cart page

Puede incluir:
- copy
- CTA continue shopping

NO inventar promociones.

==================================================
18. ERROR STATES
==================================================

Cubrir:
- add failure
- change failure
- sold out during update
- quantity rejected
- network failure
- invalid variant
- stale cart response

Mensajes:
- claros
- accesibles
- no técnicos
- con live region cuando corresponda

No ocultar errores silenciosamente.

==================================================
19. OPTIMISTIC UI
==================================================

Puede usar optimistic UI SOLO si rollback es robusto.

Preferencia:
- marcar loading
- request
- aplicar respuesta real del servidor

No priorizar sensación de velocidad sobre consistencia.

Shopify response es source of truth.

==================================================
20. RACE CONDITIONS
==================================================

Auditar interacción rápida:
- múltiples clicks +
- remove mientras update pendiente
- dos add-to-cart seguidos
- drawer open while request pending

Implementar:
- AbortController o request queue por line/item si ayuda
- anti-double-submit
- estado consistente

No crear arquitectura excesiva.

==================================================
21. SECTION RENDERING
==================================================

Evaluar si conviene usar Shopify Section Rendering API para refrescar:

- cart drawer
- cart icon bubble
- summary

Si mejora fidelidad/consistencia:
usarla.

Si un update DOM local es más simple y fiable:
puede usarlo.

Elegir una estrategia y documentarla.

Evitar dos fuentes de markup divergentes.

==================================================
22. CART DRAWER PERFORMANCE
==================================================

Objetivos:
- cargar HTML inicial ligero
- no fetch innecesario al abrir si ya está actualizado
- no listeners por line item si event delegation basta
- no library
- no heavy animation
- no layout thrashing

==================================================
23. ANIMACIONES
==================================================

Replicar sensación real con CSS:
- drawer slide
- overlay fade
- item remove/update si existe

Respetar:
prefers-reduced-motion

No Framer Motion.

==================================================
24. ACCESSIBILITY
==================================================

Validar específicamente:

- drawer name
- focus trap
- return focus
- Escape
- overlay behavior
- cart count accessible label
- line item titles
- quantity buttons
- quantity input label
- remove button label
- loading state
- live region
- error messages
- subtotal semantics
- checkout CTA
- keyboard
- focus-visible
- contrast
- tap targets
- reduced-motion

==================================================
25. RESPONSIVE
==================================================

Validar:

320
375
390
430
640
768
1024
1280
1440

Revisar:
- drawer width
- mobile height
- item image
- long titles
- variant text
- quantity
- prices
- subtotal
- CTA
- empty state
- no horizontal overflow
- safe-area bottom on mobile

==================================================
26. PERFORMANCE
==================================================

Reportar:
- CSS añadido aproximado
- JS añadido aproximado
- número de network requests por add
- número de network requests por quantity change
- strategy de rerender
- listeners strategy

Evitar:
- framework
- jQuery
- duplicated requests
- fetch polling
- unnecessary full cart fetch after response already contains cart data

==================================================
27. HEADER INTEGRATION
==================================================

Reauditar Header 02C.

El cart trigger del Header debe:
- abrir drawer con JS
- fallback a /cart si JS no funciona
- mostrar count sincronizado

No romper:
- mobile menu
- search
- sticky header

==================================================
28. HOME / COLLECTION / PRODUCT CARD INTEGRATION
==================================================

No romper:
- Home 02E
- Product Card 02F
- Collection 02G
- PDP 02H

Si Product Card tiene quick action/add hook real:
integrarlo SOLO si ya existe y es seguro.

No inventar Quick Add si el card real no lo tiene.

==================================================
29. THEME EDITOR
==================================================

Settings razonables, si corresponden:

- enable cart drawer
- cart drawer heading
- show vendor/variant
- show compare-at
- continue shopping link
- empty state copy
- free shipping message enable/threshold SOLO si validado

No sobreconfigurar.

==================================================
30. ANALYTICS HOOKS
==================================================

NO implementar GA/Meta real todavía.

Pero preservar hooks/eventos neutros para:
- cart opened
- item added
- quantity changed
- item removed
- begin checkout

NO hardcodear IDs.

==================================================
31. CART NOTE
==================================================

Auditar si la web actual usa note/instrucciones.

Si NO:
no inventarlo.

Si SÍ:
usar cart[note] nativo.

==================================================
32. ATTRIBUTES / LINE PROPERTIES
==================================================

Auditar si la web actual guarda datos extra en cart items.

Si no existen:
no inventarlos.

Si existen y tienen equivalente legítimo:
usar line item properties/cart attributes.

NO transportar datos internos sensibles.

==================================================
33. DOCUMENTACIÓN
==================================================

Crear:

shopify-migration/theme/cart-report.md

Debe documentar:

- cart actual auditado
- arquitectura elegida
- Drawer
- Cart Page
- add-to-cart integration
- Ajax API
- update/remove
- subtotal
- cart count
- discounts
- free shipping messaging
- stock/reservation differences
- checkout CTA
- WhatsApp/payment differences
- race condition handling
- progressive enhancement
- accessibility
- responsive
- performance
- divergencias inevitables
- visual fidelity estimate
- dependencias de fases siguientes

Actualizar:
shopify-migration/theme-src/README.md

==================================================
34. VALIDACIÓN
==================================================

Ejecutar:

npx @shopify/cli theme check

Objetivo:
0 errors
0 warnings

Validar además:
- JSON
- Liquid
- JS syntax
- section schema
- settings IDs
- locale keys
- asset refs
- snippets
- cart template refs
- no nested anchors
- no duplicate IDs
- no orphan snippets
- no inline secrets

==================================================
35. INTERACTION HARNESS / TESTS
==================================================

Sin Shopify Store todavía:

crear un harness local aislado o tests estructurales ligeros si ayudan.

Validar como mínimo:

1. open drawer
2. close button
3. overlay close
4. Escape close
5. focus return
6. add item success
7. add item error
8. increment
9. decrement
10. remove
11. empty state
12. subtotal update
13. cart count update
14. rapid double click protection
15. rejected quantity rollback/error
16. network failure
17. reduced motion
18. mobile drawer behavior
19. fallback form without JS
20. checkout CTA semantics

No instalar testing stack pesado.

NO lanzar accidentalmente el dev server de la app Next real.

IMPORTANTE:
en 02H hubo un incidente donde preview_start leyó el launch.json de la raíz y lanzó rada-dev por 9 segundos.

Por tanto:
ANTES de usar cualquier preview/harness:
- verificar qué launch config se ejecutará;
- no usar preview_start si apunta al proyecto real;
- preferir harness aislado explícito;
- no tocar Production DB;
- no tocar dev DB innecesariamente.

==================================================
36. SECURITY / PORTABILITY SCAN
==================================================

Buscar:
- secrets
- API keys
- tokens
- passwords
- myshopify domains
- store IDs
- theme IDs
- radaelliswimwear.com hardcodeado funcional
- emails/teléfonos hardcodeados
- Next imports
- React imports
- Prisma
- Neon
- Wompi
- Vercel
- Cloudinary SDK dependency

Resultado funcional esperado:
0.

==================================================
37. NO CHECKOUT/PAYMENTS TODAVÍA
==================================================

NO:
- Shopify Payments config
- Wompi app
- Wompi gateway
- checkout customization
- test payment
- real purchase
- commercial Shopify store
- Development Store
- product import
- app install

02I termina en Cart/Checkout handoff boundary.

==================================================
38. GIT / AISLAMIENTO
==================================================

Trabajar en el mismo worktree/branch Shopify aislado usado en 02A–02H.

NO:
- push main
- merge
- PR
- rebase
- reset
- tocar Production
- tocar Staging
- Vercel
- Neon
- Wompi
- DNS

El branch ai-handoff sigue siendo SOLO Markdown de coordinación.

==================================================
39. OPUS EVALUATION CONTINUES
==================================================

Seguir usando:
OPUS 5.5 ULTRACODE

Al final reportar:

- MODEL CONFIRMED
- approximate elapsed time
- exact usage only if interface exposes it
- otherwise UNAVAILABLE
- major self-corrections
- concrete Opus value observed

NO inventar métricas.

==================================================
40. HANDOFF PROTOCOL 1 / 2 / 5
==================================================

Al terminar 02I:

1. actualizar:
ai-handoff/claude-result.md

2. crear:
ai-handoff/archive/02I-result.md

3. actualizar status.md a:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 02I
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 02J
CURRENT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

4. push SOLO de handoff a:
origin/ai-handoff

5. activar ChatGPT enviando:

HANDOFF READY 02I

Después usar EXACTAMENTE este esquema FINITO:

CHECK 1
- esperar 1 minuto
- leer status.md + next-prompt.md
- si READY_FOR_CLAUDE_02J: continuar

CHECK 2
- solo si Check 1 no está listo
- esperar 2 minutos adicionales
- total aproximado: 3 minutos
- leer status.md + next-prompt.md
- si READY_FOR_CLAUDE_02J: continuar

CHECK 3
- solo si Check 2 no está listo
- esperar 5 minutos adicionales
- total aproximado: 8 minutos
- leer status.md + next-prompt.md
- si READY_FOR_CLAUDE_02J: continuar

Si después del tercer check NO está listo:

escribir:

MANUAL STEP REQUIRED — CHATGPT HANDOFF TIMEOUT AFTER 8 MINUTES

y DETENERSE.

NO cuarto intento.
NO loop.
NO watcher.
NO espera indefinida.

==================================================
41. NO INVENTAR 02J
==================================================

Aunque NEXT_PHASE sea 02J:

NO adivines el alcance.

Solo ejecuta 02J si ChatGPT reemplaza next-prompt.md y status queda:

READY_FOR_CLAUDE_02J

==================================================
42. INFORME FINAL
==================================================

claude-result.md debe incluir como mínimo:

1. model confirmed
2. approximate elapsed time
3. resource/usage indicator or UNAVAILABLE
4. cart real reauditado YES/NO
5. rutas/componentes auditados
6. Cart Drawer implemented YES/NO
7. Cart Page implemented YES/NO
8. PDP hook integration PASS/FAIL
9. no-JS fallback PASS/FAIL
10. Ajax Cart API endpoints used
11. add behavior
12. quantity behavior
13. remove behavior
14. subtotal behavior
15. cart count sync
16. Header integration PASS/FAIL
17. empty state
18. error states
19. loading states
20. race-condition handling
21. discount behavior
22. free shipping messaging status
23. stock/reservation difference documented YES/NO
24. checkout CTA status
25. WhatsApp/payment migration note
26. cart note status
27. cart attributes/properties status
28. Theme Editor settings
29. desktop responsive PASS/FAIL
30. mobile responsive PASS/FAIL
31. 320px safety
32. accessibility PASS/FAIL
33. keyboard PASS/FAIL
34. focus management PASS/FAIL
35. reduced-motion PASS/FAIL
36. visual fidelity estimate
37. CSS added
38. JS added
39. network request strategy
40. performance notes
41. interaction harness result
42. Theme Check errors
43. Theme Check warnings
44. JSON validation
45. Liquid validation
46. JS validation
47. nested anchors check
48. secrets 0
49. store-specific IDs/domains 0
50. Next/React refs funcionales 0
51. Production touched NO
52. Staging touched NO
53. Shopify Store created NO
54. Deploy NO
55. Push main NO
56. major self-corrections
57. concrete Opus value observed
58. READY FOR PHASE 02J YES/NO
59. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

==================================================
BACKGROUND RULE
==================================================

NO watchers detached.
NO loops infinitos.
NO indefinite waits.
NO long-lived background tasks.

Durante la fase trabaja normalmente.

Durante handoff:
solo los 3 checks finitos 1m + 2m + 5m.

Al finalizar la fase:
CERO TAREAS DE SEGUNDO PLANO ACTIVAS.
