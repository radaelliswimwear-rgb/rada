# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_02K

PHASE: 02K — WISHLIST / FAVORITES
MODEL: OPUS 5.5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 02K — WISHLIST / FAVORITOS

==================================================
CONTEXTO CONFIRMADO
==================================================

La Fase 02J — Search + Predictive Search terminó correctamente y fue revisada por ChatGPT.

Resultado confirmado:
- Header search integration PASS
- no-JS fallback PASS
- Search Page implementada
- Predictive Search implementado porque sí existe en el sitio real
- endpoint nativo de Shopify
- debounce 250 ms
- mínimo 2 caracteres
- máximo 5 sugerencias
- AbortController/race handling
- cache de 20 consultas
- keyboard navigation PASS
- focus management PASS
- Product Card integration PASS
- desktop/mobile/320px PASS
- accessibility PASS
- interaction harness 20/20 + extras
- Theme Check 0 errors / 0 warnings
- JSON / Liquid / JS PASS
- secrets 0
- store-specific IDs/domains 0
- Production NO tocada
- Staging NO tocado
- Shopify Store NO creada
- Deploy NO
- Push main NO

02J además detectó:
- una discrepancia heredada: la grilla de catálogo quedó en 1 columna mobile, mientras la web real usa 2 columnas;
- la búsqueda por color en Shopify requiere tags o una decisión futura de indexación.

OBJETIVO DE 02K

Resolver la arquitectura y experiencia de WISHLIST / FAVORITOS del futuro theme Shopify de Radaelli, con fidelidad al comportamiento REAL actual y sin introducir dependencias prematuras.

Esta fase debe cubrir, según lo que realmente exista hoy:

- corazón/favorite trigger en Header
- corazón en Product Card
- corazón en PDP
- estado activo/inactivo
- persistencia
- contador si existe
- página/lista de favoritos si existe
- empty state
- eliminación desde favoritos
- sincronización entre múltiples triggers
- accesibilidad
- responsive
- performance
- degradación segura
- arquitectura preparada para una decisión posterior sobre Customer Accounts

NO construir todavía:
- Customer Accounts / login Shopify
- customer metafield writes
- app propia
- third-party wishlist app
- checkout/payment
- Wompi
- Shopify Store
- Development Store

==================================================
1. REAUDITORÍA OBLIGATORIA DEL WISHLIST REAL
==================================================

ANTES DE CODIFICAR:

Inspecciona directamente el código REAL actual.

Buscar y auditar como mínimo:
- todos los usos de "wishlist"
- "favorite" / "favourite"
- "favorito" / "favoritos"
- heart icons
- Header wishlist trigger
- Product Card wishlist trigger
- PDP wishlist trigger
- route/page de wishlist si existe
- store/state
- localStorage/sessionStorage/cookies
- backend persistence si existe
- customer/user relationship si existe
- count/badge si existe
- analytics hooks
- add/remove behavior
- toast/messages
- anonymous vs authenticated behavior
- hydration/loading behavior
- cross-tab behavior si existe
- empty state
- product rendering
- stale/deleted product behavior
- responsive
- accessibility

NO asumir que la wishlist es localStorage solo porque el frontend parece client-side.

Auditar también:
- server actions
- database models
- API routes
- user/account code
- tests
- comments que puedan estar obsoletos

El código ejecutable real manda sobre comentarios/documentación.

==================================================
2. DECISIÓN DE ARQUITECTURA — BASADA EN EVIDENCIA
==================================================

La arquitectura previa dejó Wishlist como DECISIÓN ABIERTA entre:
- localStorage
- metafields/customer-backed + app propia
- third-party app

Esta fase NO debe instalar apps ni crear backend nuevo.

Debes elegir la estrategia offline más fiel y portable BASÁNDOTE EN LA REAUDITORÍA.

REGLAS:

A. Si la wishlist real actual es guest/browser-local:
- implementar localStorage de forma robusta;
- sin inventar cuenta/sync remoto.

B. Si la wishlist real actual depende de usuario/backend:
- NO fingir sincronización remota;
- crear una capa/adapter clara para wishlist;
- permitir guest-local SOLO si eso no contradice el producto actual;
- documentar qué parte deberá decidirse al entrar a Customer Accounts.

C. Si el comportamiento actual es híbrido:
- documentar exactamente la prioridad/sync actual;
- implementar offline solo lo que pueda garantizarse sin store/app;
- dejar integración remota como dependencia explícita de 02L o fase posterior.

NO crear:
- customer metafield writes
- Admin API calls
- app proxy
- Storefront API mutation custom
- third-party dependency

==================================================
3. STORAGE MODEL
==================================================

Si se usa localStorage:

Guardar solo identificadores mínimos y no sensibles.

Preferencia:
- product handle o stable product identifier apropiado para storefront
- schema version
- timestamp solo si realmente aporta valor

NO guardar:
- precio como fuente de verdad
- stock como fuente de verdad
- HTML snapshot como fuente de verdad
- customer data
- secretos
- full product object innecesario

Definir:
- storage key versionada
- máximo razonable de items si corresponde
- dedupe
- corrupt data recovery
- unavailable storage handling
- migration/version behavior

==================================================
4. FUENTE DE VERDAD DE PRODUCT DATA
==================================================

Muy importante:

Wishlist storage NO debe convertir precio/stock/título guardado en fuente de verdad.

Al renderizar favoritos:
usar datos actuales de Shopify siempre que sea técnicamente viable.

No mostrar precios/stock obsoletos solo porque quedaron en localStorage.

Elegir una estrategia portable y documentarla.

Opciones posibles:
- Section Rendering sobre product context
- endpoint product JSON para datos actuales
- otra estrategia nativa Shopify claramente justificada

NO duplicar manualmente todo Product Card si puede reutilizarse.

Prioridad:
reusar snippets/product-card.liquid o markup compartido.

==================================================
5. WISHLIST TRIGGER EN PRODUCT CARD
==================================================

02F dejó placeholder inerte.

02K debe convertirlo en funcional si la arquitectura elegida lo permite.

Debe:
- toggle add/remove
- reflejar estado actual
- aria-pressed
- accessible name dinámico
- keyboard
- tap target correcto
- no interferir con link de producto
- no nested anchors
- no doble evento
- sincronizar con otros triggers del mismo producto

No hacer reload de página para toggle local.

==================================================
6. WISHLIST TRIGGER EN PDP
==================================================

02H dejó hook/botón placeholder.

Integrarlo con la misma fuente de estado.

Debe:
- reflejar si el producto ya está guardado
- add/remove
- compartir evento/adapter con Product Card
- actualizar Header/count si existe
- no duplicar lógica

==================================================
7. HEADER WISHLIST
==================================================

Reauditar exactamente el Header real.

Si el Header actual tiene:
- heart icon
- count
- link a wishlist
- drawer/panel

replicarlo.

Si solo tiene link/icon:
no inventar badge.

Fallback sin JS:
debe navegar a una ruta/página razonable si existe arquitectura para ello.

No romper:
- search
- cart
- mobile menu
- sticky header

==================================================
8. WISHLIST PAGE / VIEW
==================================================

Solo si el sitio actual tiene una página/vista real de favoritos, o si el Header real lleva a una.

Construir una solución Shopify compatible.

Posibles archivos:
templates/page.wishlist.json
sections/main-wishlist.liquid
assets/wishlist.js
assets/section-wishlist.css

Nombres pueden variar si otra estructura es mejor.

Debe cubrir:
- heading
- product grid
- remove
- empty state
- stale/deleted products
- loading
- errors
- mobile/desktop

NO crear una ruta custom imposible en Shopify.

Usar template/page compatible con Shopify OS 2.0.

==================================================
9. PRODUCT RENDERING EN WISHLIST
==================================================

Reusar Product Card definitivo siempre que sea posible.

NO mantener dos diseños divergentes.

Si la naturaleza client-side exige una vía especial:
- conservar apariencia equivalente
- minimizar markup duplicado
- documentar por qué no puede renderizarse directamente con Liquid en primer paint

No fingir SSR de localStorage.

==================================================
10. HYDRATION / FIRST PAINT
==================================================

Si wishlist depende de localStorage:

evitar:
- flash incorrecto de corazones activos
- count falso
- layout shift notable

Preferir:
- neutral initial state
- upgrade rápido al cargar JS
- hidden count hasta conocer valor, si corresponde

No bloquear render de página esperando wishlist.

==================================================
11. EVENT ARCHITECTURE
==================================================

Definir un contrato único, por ejemplo:
- wishlist:updated

Payload mínimo y no sensible.

Todos los triggers deben responder al mismo evento.

No listeners individuales innecesarios por card si delegation funciona.

Evitar event storms.

==================================================
12. MULTI-TAB
==================================================

Si se usa localStorage:
usar evento "storage" para sincronizar pestañas SOLO si es sencillo y útil.

No crear BroadcastChannel si localStorage storage event basta.

Documentar comportamiento.

==================================================
13. ERROR / STORAGE UNAVAILABLE
==================================================

Cubrir:
- localStorage bloqueado
- quota error
- JSON corrupto
- product ya no existe
- product handle cambia
- fetch/render failure si la página necesita recuperar datos

UX:
- no romper navegación
- no lanzar excepciones al usuario
- estado accesible
- posibilidad de retirar item inválido

==================================================
14. ACCESSIBILITY
==================================================

Validar:
- aria-pressed en hearts toggle
- label dinámico "Agregar/Quitar de favoritos"
- focus-visible
- keyboard
- result/update announcement si corresponde
- empty state
- loading state
- count no leído dos veces
- contrast
- tap targets
- no información solo por color/icono

==================================================
15. RESPONSIVE
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
- Header heart
- Product Card heart
- PDP heart
- Wishlist grid
- empty state
- long titles
- no horizontal overflow

==================================================
16. PERFORMANCE
==================================================

Wishlist puede aparecer en muchas cards.

Objetivos:
- un solo módulo JS compartido
- event delegation
- no fetch por card solo para saber si está favorita
- storage read centralizada
- no polling
- no framework
- no library

Si Wishlist Page necesita recuperar productos:
- limitar concurrencia si hay múltiples fetches
- cache por sesión cuando sea útil
- no disparar requests duplicados

Reportar:
- JS added
- CSS added
- storage reads/writes strategy
- network strategy

==================================================
17. SECURITY / PRIVACY
==================================================

Wishlist local:
- no PII
- no auth tokens
- no email
- no customer ID si no es imprescindible
- no sensitive data

Si se detecta wishlist server-backed actual:
documentar privacidad y diferencia con Shopify.

==================================================
18. ANALYTICS HOOKS
==================================================

NO implementar GA/Meta real.

Puede dejar hooks neutrales para:
- wishlist add
- wishlist remove
- wishlist viewed

NO hardcodear IDs.

==================================================
19. CUSTOMER ACCOUNTS BOUNDARY
==================================================

IMPORTANTE:

02K NO debe empezar 02L.

02L está reservado para Customer Accounts y requiere un checkpoint explícito con Daniela porque Shopify Customer Accounts implica un cambio de UX/autenticación respecto al sistema custom actual.

Por tanto:
- preparar wishlist para futura integración si corresponde;
- NO crear login;
- NO redirigir a account;
- NO exigir autenticación salvo que el comportamiento real actual lo exija, en cuyo caso documentarlo y detener la parte que no pueda hacerse honestamente offline.

==================================================
20. REGRESSION FIX — MOBILE GRID
==================================================

02J detectó que Collection/Search quedó con 1 columna mobile mientras la web real usa 2.

Antes del cierre de 02K:

1. revalidar contra código real;
2. si está confirmado;
3. si el fix es aislado y seguro;
4. corregir el shared grid/Collection/Search para igualar 2 columnas mobile;
5. revalidar 320/375/390/430;
6. documentar el cambio.

NO tocar si la reauditoría demuestra que 1 columna era intencional.

==================================================
21. NO CAMBIAR SEARCH BY COLOR AHORA
==================================================

02J documentó que Predictive Search de Shopify no indexa custom.color de la misma forma y que color como tag es una dependencia de datos.

NO modificar catálogo/product tags en 02K.

Solo conservar nota para migración de datos.

==================================================
22. THEME EDITOR
==================================================

Solo settings razonables si de verdad aportan valor:
- enable wishlist
- wishlist page handle/link si se necesita
- empty state copy
- heading

No crear decenas de toggles.

Si feature queda desactivable:
fallback visual limpio.

==================================================
23. DOCUMENTACIÓN
==================================================

Crear:

shopify-migration/theme/wishlist-report.md

Debe documentar:
- wishlist real auditada
- arquitectura real encontrada
- decisión Shopify tomada
- por qué esa decisión
- storage/backend differences
- Product Card integration
- PDP integration
- Header integration
- Wishlist Page status
- rendering strategy
- event architecture
- multi-tab
- error behavior
- accessibility
- responsive
- performance
- privacidad
- dependencia de Customer Accounts
- regression mobile grid result
- visual fidelity estimate

Actualizar:
shopify-migration/theme-src/README.md

==================================================
24. VALIDACIÓN
==================================================

Ejecutar:

npx @shopify/cli theme check

Objetivo:
0 errors
0 warnings

Validar:
- JSON
- Liquid
- JS syntax
- template refs
- section schema
- locale keys
- asset refs
- no duplicate IDs
- no nested anchors
- no orphan snippets
- storage error handling

==================================================
25. INTERACTION HARNESS
==================================================

Usar harness aislado si aporta valor.

NO usar preview_start que pueda abrir Next real.

Validar según arquitectura final, idealmente:
1. add favorite from Product Card
2. remove favorite from Product Card
3. PDP reflects same state
4. Header reflects same state/count if applicable
5. same product in two cards syncs
6. page reload persistence
7. second tab sync if implemented
8. localStorage unavailable
9. corrupt storage recovery
10. duplicate add
11. stale product on wishlist page
12. remove from wishlist page
13. empty state
14. keyboard toggle
15. aria-pressed
16. focus-visible
17. mobile width
18. no horizontal overflow
19. reduced-motion if animation exists
20. no-JS fallback behavior

No declarar pruebas que no pudiste ejecutar.

==================================================
26. PORTABILITY / SECRET SCAN
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
27. AISLAMIENTO
==================================================

NO:
- Production
- Staging
- Vercel
- Neon
- Wompi
- DNS
- Shopify Store
- Development Store
- app installs
- deploy
- push main
- merge
- PR
- rebase
- reset

Trabajar en el mismo worktree Shopify aislado.

==================================================
28. OPUS
==================================================

Continuar con:
OPUS 5.5 ULTRACODE

Al final reportar:
- model confirmed
- elapsed time aproximado
- usage exacto SOLO si visible
- si no: UNAVAILABLE
- major self-corrections
- concrete Opus value observed

NO inventar consumo.

==================================================
29. HANDOFF AL TERMINAR
==================================================

Al terminar 02K:

1. actualizar:
ai-handoff/claude-result.md

2. crear:
ai-handoff/archive/02K-result.md

3. actualizar status.md EXACTAMENTE a:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 02K
CURRENT_PHASE: WAITING_FOR_CUSTOMER_ACCOUNTS_DECISION
NEXT_PHASE: 02L
CURRENT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

4. push SOLO de handoff a:
origin/ai-handoff

5. enviar:

HANDOFF READY 02K

6. DETENERSE.

==================================================
30. STOP OBLIGATORIO ANTES DE 02L
==================================================

NO usar protocolo automático 1/2/5 para iniciar 02L.

NO iniciar 02L.

NO inventar un prompt de Customer Accounts.

Razón:
02L — Customer Accounts requiere decisión explícita de Daniela sobre la experiencia de autenticación Shopify.

Después de HANDOFF READY 02K:
STOP.

==================================================
31. INFORME FINAL
==================================================

claude-result.md debe incluir:

1. model confirmed
2. approximate elapsed time
3. resource/usage or UNAVAILABLE
4. wishlist real reauditada YES/NO
5. rutas/componentes/modelos auditados
6. arquitectura real actual encontrada
7. arquitectura Shopify elegida
8. rationale
9. storage strategy
10. remote/account dependency status
11. Product Card integration PASS/FAIL
12. PDP integration PASS/FAIL
13. Header integration PASS/FAIL
14. Header count status
15. Wishlist Page status
16. product rendering strategy
17. stale product handling
18. event architecture
19. multi-tab behavior
20. storage unavailable behavior
21. corrupt storage recovery
22. no-JS fallback behavior
23. empty state
24. loading/error states
25. desktop responsive PASS/FAIL
26. mobile responsive PASS/FAIL
27. 320px safety
28. accessibility PASS/FAIL
29. keyboard PASS/FAIL
30. aria-pressed sync PASS/FAIL
31. visual fidelity estimate
32. CSS added
33. JS added
34. network/storage performance notes
35. mobile grid regression confirmed YES/NO
36. mobile grid regression fixed YES/NO/NOT_APPLICABLE
37. Theme Editor settings
38. interaction harness result
39. Theme Check errors
40. Theme Check warnings
41. JSON validation
42. Liquid validation
43. JS validation
44. nested anchors check
45. secrets 0
46. store-specific IDs/domains 0
47. Next/React refs funcionales 0
48. Production touched NO
49. Staging touched NO
50. Shopify Store created NO
51. Deploy NO
52. Push main NO
53. major self-corrections
54. concrete Opus value observed
55. CUSTOMER ACCOUNTS DECISION REQUIRED YES
56. READY FOR 02L DECISION YES/NO
57. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

==================================================
BACKGROUND RULE
==================================================

NO watchers detached.
NO loops infinitos.
NO indefinite waits.
NO long-lived background tasks.

Al finalizar:
HANDOFF READY 02K
y STOP.

CERO TAREAS DE SEGUNDO PLANO ACTIVAS.
