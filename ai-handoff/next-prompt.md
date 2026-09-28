# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_02L

PHASE: 02L — CUSTOMER ACCOUNTS + ACCOUNT WISHLIST ARCHITECTURE
MODEL: OPUS 5.5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 02L — CUSTOMER ACCOUNTS + FAVORITOS SINCRONIZADOS

==================================================
DECISIONES DE DANIELA — YA CERRADAS
==================================================

Daniela aprobó explícitamente:

1. ACCOUNT EXPERIENCE
   - Usar Shopify NEW CUSTOMER ACCOUNTS.
   - Login passwordless con código de verificación por email.
   - NO usar Classic / legacy password accounts.

2. FAVORITOS
   - La clienta puede usar favoritos como invitada sin login.
   - Cuando inicia sesión, los favoritos deben quedar asociados a su cuenta y sincronizados entre dispositivos.

3. MERGE AL LOGIN
   - Sí.
   - Los favoritos guest/browser deben unirse automáticamente con los favoritos de la cuenta.
   - Sin duplicados.
   - No perder favoritos si el merge remoto falla.

4. SOURCE OF TRUTH
   - Antes de login: navegador/local adapter.
   - Después de login y merge exitoso: cuenta de cliente / remote account store.

5. UX OBJETIVO
   - No obligar a iniciar sesión para tocar el corazón.
   - La experiencia debe sentirse ligera y premium.
   - Favoritos debe sentirse como parte de "Mi cuenta" cuando la clienta está autenticada.

6. ACCOUNT WISHLIST DESTINATION
   - Mantener la experiencia de "Mis favoritos" dentro del concepto de cuenta.
   - La URL exacta NO se debe forzar a /cuenta/favoritos si Shopify New Customer Accounts usa otra arquitectura.
   - Elegir la integración oficial más correcta y portable.
   - La página pública de Favoritos puede seguir existiendo como superficie guest/storefront, pero una clienta autenticada debe ver la misma lista sincronizada.

==================================================
CONTEXTO CONFIRMADO
==================================================

02K encontró que la web custom actual usa wishlist híbrida EN SERVIDOR:

- guest: cookie httpOnly lago-wishlist-id
- logged-in: Wishlist.userId en Postgres
- login/registro: merge guest → account
- favoritos sincronizados entre dispositivos
- product data siempre en vivo
- NO era localStorage aunque comentarios antiguos lo sugerían

02K implementó temporalmente para Shopify offline:

- guest wishlist vía localStorage
- adapter localAdapter
- key radaelli:wishlist v1
- Product Card integration PASS
- PDP integration PASS
- Header integration PASS
- Wishlist Page implementada
- multi-tab sync
- storage error recovery
- Section Rendering para producto actual
- Theme Check 0/0
- harness 20/20
- mobile catalog/search grid regresión corregida

Ese localAdapter fue diseñado deliberadamente para poder ser sustituido/complementado por una capa de cuenta en 02L.

==================================================
OBJETIVO DE 02L
==================================================

Diseñar y dejar preparada de forma HONESTA y PORTABLE la arquitectura de:

- Shopify New Customer Accounts
- login passwordless por email
- entrada desde Header
- account destination
- pedidos/perfil/datos cuando Shopify los gestione
- wishlist de cuenta sincronizada
- merge guest → account
- misma wishlist desde storefront y account
- estrategia para "Mis favoritos" dentro de Customer Accounts

IMPORTANTE:

NO fingir que Customer Accounts puede implementarse completamente offline dentro del theme si Shopify lo hospeda o requiere app/API.

La fase debe distinguir claramente entre:

A. lo que sí puede implementarse offline en el theme;
B. lo que requiere Development Store;
C. lo que requiere app/custom backend/customer-account extension;
D. lo que puede resolverse con APIs oficiales sin backend extra;
E. lo que NO debe construirse.

==================================================
1. REAUDITORÍA COMPLETA DE LA CUENTA CUSTOM REAL
==================================================

ANTES DE diseñar Shopify:

Auditar directamente toda la experiencia de cuenta actual.

Buscar:
- login
- register
- logout
- password reset
- session
- auth provider
- account page
- profile
- addresses
- orders
- order detail
- wishlist inside account
- guest wishlist merge
- customer data
- account navbar/header state
- mobile account links
- redirects
- session cookies
- server actions
- API routes
- tests
- Prisma models
- email flows
- security assumptions

Documentar exactamente qué funcionalidades del sistema custom actual existen y cuáles realmente se usan.

No confiar en nombres/comentarios.
Código ejecutable manda.

==================================================
2. INVESTIGAR ARQUITECTURA OFICIAL ACTUAL DE SHOPIFY
==================================================

Usar documentación oficial y actual de Shopify disponible desde el entorno/navegador.

Prioridad:
- Shopify Help Center oficial
- Shopify Dev docs oficiales

Verificar, no asumir:

- New Customer Accounts
- passwordless email code flow
- customer session behavior
- routes.account_url y account entry from Online Store
- qué templates Liquid siguen aplicando y cuáles NO
- account pages hosted by Shopify
- account navigation extensibility
- Customer Account UI Extensions
- Customer Account API
- app requirements
- authenticated customer identity/context
- supported extension targets
- order/account/profile capabilities nativas
- customer metafield read/write constraints
- Admin API requirements if relevant
- whether a theme alone can write account wishlist data
- whether app proxy is appropriate or not
- whether Customer Account API can solve storefront wishlist sync directly
- what requires an app backend

Citar URLs oficiales en el reporte técnico si puedes acceder a ellas.

NO usar blogs como fuente principal si la documentación oficial existe.

==================================================
3. NO IMPLEMENTAR LEGACY LOGIN
==================================================

Está prohibido construir:

- login/password forms legacy
- registration password forms
- forgot-password UX
- password-reset templates
- custom auth cookies
- custom credential storage

Daniela eligió New Customer Accounts.

Si el theme actual contiene account templates legacy:
documentar si quedan huérfanos/inútiles bajo New Customer Accounts.

No construirlos por "compatibilidad".

==================================================
4. HEADER ACCOUNT ENTRY
==================================================

Reauditar Header 02C/02J/02K.

Implementar la entrada a cuenta de forma compatible con New Customer Accounts.

Preferir:
- routes.account_url
- rutas Shopify nativas
- no URL hardcodeada

Debe funcionar:
- desktop
- mobile
- teclado
- no-JS

No romper:
- search
- wishlist
- cart
- sticky header
- mobile menu

Si Liquid permite conocer logged-in state de forma fiable con New Customer Accounts:
usar solo datos oficialmente soportados.

Si NO:
no inventar avatar/estado "logueada".

==================================================
5. EXPERIENCIA DE CUENTA — MAPEO
==================================================

Crear una matriz:

CUSTOM ACTUAL → SHOPIFY NEW CUSTOMER ACCOUNTS

Como mínimo:

- Sign in
- Sign out
- Registration/account creation
- Password reset
- Profile
- Addresses
- Orders
- Order details
- Wishlist
- Guest wishlist merge
- Cross-device favorites
- Account navigation
- Saved payment methods, si aplica
- Returns, si aplica

Clasificar cada fila:
- Native Shopify
- Customer Account extension
- Custom app/backend
- Not needed
- Not available / architectural change

==================================================
6. WISHLIST REMOTE SOURCE OF TRUTH
==================================================

Este es el punto central.

Investigar y decidir la solución MINIMAL, OFICIAL y PORTABLE para guardar favoritos por cliente.

Comparar seriamente, solo con capacidades reales:

A. customer metafields
B. app-owned data/backend
C. Customer Account API
D. Admin API through custom app
E. Customer Account UI Extension + app backend
F. other official Shopify-supported approach

Para cada opción evaluar:
- read from storefront
- write from storefront
- authenticated identity
- cross-device sync
- merge guest → account
- security
- portability
- Shopify plan dependency
- app requirement
- backend requirement
- rate limits
- data ownership
- maintenance
- risk of lock-in

NO elegir solo porque sea fácil.

Elegir una arquitectura recomendada basada en evidencia.

==================================================
7. NO THIRD-PARTY WISHLIST APP TODAVÍA
==================================================

NO:
- instalar app
- comprar app
- seleccionar vendor como dependencia final
- meter SDK third-party

Puedes documentar que existe la alternativa de app externa, pero la arquitectura preferida debe priorizar:
- control de Radaelli
- portabilidad
- mínimo lock-in
- experiencia premium

==================================================
8. ADAPTER CONTRACT
==================================================

02K ya dejó localAdapter.

Diseñar un contrato estable para poder tener:

- guest/local adapter
- account/remote adapter

Idealmente operaciones como:
- init
- load
- add
- remove
- has
- merge
- subscribe

No es obligatorio usar exactamente esos nombres.

Requisitos:
- UI no debe conocer detalles del backend
- Product Card/PDP/Header/Wishlist Page no deben duplicar lógica
- guest path sigue funcionando si remote service falla
- remote path solo se activa con auth real comprobada

==================================================
9. MERGE GUEST → ACCOUNT
==================================================

Definir algoritmo idempotente y seguro.

Objetivo:

guest = {A,B,C}
account = {B,D}

resultado:
{A,B,C,D}

Reglas:
- unión por identificador estable
- dedupe
- account data actual manda
- NO borrar local antes de confirmar éxito remoto
- tras éxito remoto, limpiar/marcar local como merged de forma segura
- si merge falla, conservar local
- retry seguro
- no duplicados en reintentos
- no race si login abre varias pestañas
- no perder datos si usuario cierra la pestaña

Documentar pseudoflujo exacto.

NO fingir ejecutar el merge real sin infraestructura remota.

==================================================
10. AUTH DETECTION
==================================================

Investigar cómo el storefront puede saber de forma OFICIAL que la clienta está autenticada bajo New Customer Accounts.

No asumir:
- window global inventado
- cookie legible
- customer Liquid object si docs no lo garantizan
- token accesible desde browser si no corresponde

Si el theme no puede obtener identidad suficiente para remote wishlist writes:
la arquitectura debe explicar dónde vive el bridge real.

==================================================
11. CUSTOMER ACCOUNT UI — "MIS FAVORITOS"
==================================================

Daniela quiere Favoritos como parte conceptual de la cuenta.

Investigar la mejor implementación oficial:

- Customer Account UI Extension
- account navigation extension/link
- full page extension
- block/page extension
- redirect/link back to storefront Wishlist Page

Elegir según soporte real.

Criterios:
- experiencia premium
- misma lista remota
- mínima duplicación
- accesibilidad
- mobile
- mantenimiento
- no romper account UX nativa

NO imponer /cuenta/favoritos si Shopify no lo soporta elegantemente.

==================================================
12. STORE FRONT WISHLIST DESPUÉS DE LOGIN
==================================================

La Wishlist Page pública/storefront de 02K debe seguir siendo útil.

Objetivo futuro:
- guest → local source
- logged-in → remote/account source
- after successful login → merge + remote source

Diseñar cómo se selecciona adapter.

No crear una UI diferente para guest y logged-in salvo copy/estado mínimo necesario.

==================================================
13. LOGOUT
==================================================

Definir comportamiento esperado:

Cuando una clienta autenticada sale:
- no copiar automáticamente toda la wishlist remota al navegador salvo razón clara
- proteger privacidad en computador compartido
- guest local list debe ser una decisión explícita y segura

Investigar patrón apropiado.

Documentar la decisión.

==================================================
14. PRIVACY / SECURITY
==================================================

Wishlist remota debe evitar:
- tokens en localStorage si Shopify no lo exige oficialmente
- Admin API token en browser
- secret keys client-side
- customer IDs confiados solo desde input del browser
- IDOR
- una clienta leyendo/escribiendo wishlist de otra
- email como authorization key
- PII innecesaria

Diseñar trust boundary.

Si propone app/backend:
explicar cómo verifica identidad del customer.

==================================================
15. DATA MODEL
==================================================

Proponer modelo mínimo.

Por ejemplo, evaluar:
- customer reference
- product gid/handle
- createdAt
- schema version

No guardar:
- price como source of truth
- stock como source of truth
- HTML
- duplicate product snapshots

Preferir Shopify stable identifiers.

Definir qué pasa si:
- producto borrado
- handle cambia
- producto archivado
- variante desaparece

==================================================
16. MIGRATION FROM CURRENT CUSTOM WISHLIST
==================================================

La web actual ya tiene Wishlist/WishlistItem en Postgres.

Diseñar estrategia de migración futura:

- qué registros pueden exportarse
- cómo mapear usuario custom → Shopify customer
- cómo mapear productId custom → Shopify product
- qué hacer con guest cookie wishlists
- qué hacer con clientes sin Shopify account todavía
- dedupe
- audit trail
- rollback/retry

NO ejecutar migración ahora.
NO tocar Neon/Postgres.

Solo plan verificable.

==================================================
17. ORDERS / PROFILE / ADDRESSES
==================================================

Para lo que Shopify New Customer Accounts ya resuelve nativamente:

NO reconstruirlo dentro del theme.

Documentar:
- qué desaparece del custom frontend
- qué se delega a Shopify
- qué branding/config se podrá ajustar después en Store/Admin

No duplicar pedidos en un custom dashboard solo por conservar la UI anterior.

==================================================
18. THEME WORK PERMITIDO EN 02L
==================================================

Sí puedes modificar el theme offline cuando sea real y útil, por ejemplo:

- account links
- labels
- mobile navigation integration
- wishlist adapter abstraction/refactor
- hooks neutrales
- graceful states
- code boundaries

NO puedes implementar fake remote API.

Si una pieza requiere Development Store/app:
dejar interface/stub NO funcional claramente marcado, o solo documentarlo si un stub aumentaría riesgo.

No dejar botones que aparenten sincronizar cuando no sincronizan.

==================================================
19. NO SHOPIFY STORE TODAVÍA
==================================================

NO:
- crear Shopify Store
- Development Store
- login Shopify
- enable accounts in Admin
- install app
- create custom app
- create Customer Account extension
- request API scopes
- deploy backend
- deploy theme
- real customer creation
- send real login codes

02L es arquitectura + preparación offline honesta.

==================================================
20. NO WISHLIST REMOTE FAKE
==================================================

Prohibido:
- guardar "remote" en otro localStorage key
- simular login
- simular customer ID
- hardcodear email/customer
- mock en código productivo que parezca real

Mocks solo dentro de harness/tests claramente aislados.

==================================================
21. ACCESSIBILITY / UX
==================================================

Cualquier cambio de Header/account/wishlist debe mantener:

- keyboard
- focus-visible
- accessible labels
- 44px tap targets donde corresponda
- mobile
- reduced-motion
- no layout shift innecesario

==================================================
22. RESPONSIVE
==================================================

Validar cualquier cambio de theme en:

320
375
390
430
640
768
1024
1280
1440

No romper:
- search
- cart
- wishlist
- mobile menu
- Header sticky

==================================================
23. PERFORMANCE
==================================================

El adapter architecture no debe:
- polling
- request por corazón para initial state
- fetch duplicados
- global heavyweight SDK sin justificación

Diseñar:
- inicialización única
- batch/load once cuando sea posible
- event delegation existente
- cache de sesión donde sea seguro

==================================================
24. DOCUMENTACIÓN PRINCIPAL
==================================================

Crear:

shopify-migration/theme/customer-accounts-report.md

Debe incluir:

- cuenta custom real auditada
- features actuales
- New Customer Accounts official architecture
- fuentes oficiales consultadas
- custom → Shopify mapping
- Header integration
- auth detection
- wishlist persistence options comparison
- recommended remote wishlist architecture
- exact reasons
- adapter contract
- merge algorithm
- logout/privacy behavior
- Customer Account UI "Mis favoritos" strategy
- storefront Wishlist Page strategy
- data model
- security/trust boundary
- current wishlist migration plan
- what can be built offline
- what requires Development Store
- what requires custom app/backend
- what requires Customer Account extension
- plan/feature dependencies
- estimated maintenance/lock-in
- next implementation steps

Actualizar:
shopify-migration/theme-src/README.md

==================================================
25. DECISION RECORD
==================================================

Crear además un documento corto:

shopify-migration/theme/customer-accounts-decision.md

Debe dejar cristalino:

DECISION:
- New Customer Accounts
- passwordless email code
- guest wishlist allowed
- account wishlist cross-device
- merge guest → account
- account becomes source of truth after successful merge
- "Mis favoritos" integrated into account UX
- no Classic password accounts

Y:
- chosen technical architecture
- components required
- what remains blocked until Development Store/app setup

Este documento será el source of truth para fases posteriores.

==================================================
26. VALIDACIÓN
==================================================

Si modificas código:

npx @shopify/cli theme check

Objetivo:
0 errors
0 warnings

Además:
- JSON
- Liquid
- JS syntax
- section schema
- locale keys
- no broken Header refs
- no broken wishlist refs
- no nested anchors
- no duplicate IDs

Si 02L termina siendo casi totalmente arquitectura y no requiere cambios funcionales:
no inventar cambios solo para "tener código".

==================================================
27. HARNESS / TESTS
==================================================

Solo si hay cambios funcionales offline.

NO probar login real.

Puede probar:
- account link fallback
- adapter selection with isolated mocks
- merge algorithm idempotency
- merge failure preserves local
- dedupe
- logout state transition
- Product Card/PDP/Header remain synced under mock local/remote adapters

Mocks:
- solo harness
- claramente no productivos

No usar preview_start que pueda lanzar Next real.

==================================================
28. PORTABILITY / SECRET SCAN
==================================================

Buscar:
- secrets
- Admin API tokens
- Storefront tokens
- customer tokens
- API keys
- passwords
- myshopify domains
- store IDs
- theme IDs
- hardcoded customer IDs
- radaelliswimwear.com funcional hardcodeado
- Next imports
- React imports
- Prisma
- Neon
- Wompi
- Vercel
- Cloudinary SDK dependency

En theme funcional:
0.

==================================================
29. AISLAMIENTO
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

Trabajar solo en worktree Shopify aislado.

==================================================
30. OPUS
==================================================

Continuar con:
OPUS 5.5 ULTRACODE

Al final:
- model confirmed
- elapsed time aproximado
- exact usage SOLO si visible
- si no: UNAVAILABLE
- major self-corrections
- concrete Opus value observed

NO inventar consumo.

==================================================
31. HANDOFF AL TERMINAR
==================================================

Al terminar 02L:

1. actualizar:
ai-handoff/claude-result.md

2. crear:
ai-handoff/archive/02L-result.md

3. actualizar status.md:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 02L
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 02M
CURRENT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

4. push SOLO handoff a:
origin/ai-handoff

5. enviar:
HANDOFF READY 02L

==================================================
32. PROTOCOLO FINITO 1 / 2 / 5
==================================================

Después de HANDOFF READY 02L:

CHECK 1
- esperar 1 minuto
- leer status.md + next-prompt.md
- si READY_FOR_CLAUDE_02M: continuar

CHECK 2
- solo si no está listo
- esperar 2 minutos adicionales
- total ~3 minutos
- leer de nuevo
- si READY_FOR_CLAUDE_02M: continuar

CHECK 3
- solo si no está listo
- esperar 5 minutos adicionales
- total ~8 minutos
- leer por última vez
- si READY_FOR_CLAUDE_02M: continuar

Si sigue sin estar listo:

MANUAL STEP REQUIRED — CHATGPT HANDOFF TIMEOUT AFTER 8 MINUTES

y STOP.

NO cuarto intento.
NO loop.
NO watcher.
NO espera indefinida.

==================================================
33. NO INVENTAR 02M
==================================================

No asumir alcance de 02M.

Solo ejecutar cuando:
- next-prompt.md sea reemplazado por ChatGPT
- status sea READY_FOR_CLAUDE_02M

==================================================
34. INFORME FINAL
==================================================

claude-result.md debe incluir como mínimo:

1. model confirmed
2. approximate elapsed time
3. resource/usage or UNAVAILABLE
4. current custom account reaudit YES/NO
5. files/components/models audited
6. official Shopify docs reviewed
7. New Customer Accounts confirmed architecture
8. passwordless flow mapping
9. Header account integration PASS/FAIL/NOT_CHANGED
10. native Shopify account features mapping
11. legacy templates needed YES/NO
12. authenticated storefront detection strategy
13. wishlist persistence options compared
14. recommended remote wishlist architecture
15. app required YES/NO
16. backend required YES/NO
17. Customer Account extension required/recommended YES/NO
18. customer metafields role
19. guest local adapter status
20. remote adapter contract status
21. merge algorithm defined YES/NO
22. merge idempotency strategy
23. merge failure preservation strategy
24. logout/privacy strategy
25. "Mis favoritos" account UX strategy
26. storefront wishlist strategy
27. data model
28. security/trust boundary
29. current wishlist migration plan
30. orders/profile/addresses mapping
31. offline code changed YES/NO + summary
32. Theme Check errors
33. Theme Check warnings
34. JSON/Liquid/JS validation if applicable
35. harness/tests result if applicable
36. secrets 0
37. store-specific IDs/domains 0
38. Production touched NO
39. Staging touched NO
40. Shopify Store created NO
41. Development Store created NO
42. app installed/created NO
43. deploy NO
44. push main NO
45. major self-corrections
46. concrete Opus value observed
47. blockers requiring Development Store
48. blockers requiring app/backend
49. READY FOR PHASE 02M YES/NO
50. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

==================================================
BACKGROUND RULE
==================================================

NO watchers detached.
NO loops infinitos.
NO indefinite waits.
NO long-lived background tasks.

Durante handoff:
solo 3 checks finitos 1m + 2m + 5m.

Al finalizar:
CERO TAREAS DE SEGUNDO PLANO ACTIVAS.
