# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03D

PHASE: 03D — SEARCH/FILTERS + ACCOUNT WISHLIST INFRASTRUCTURE + STOREFRONT COMPLETION
MODEL: OPUS 5.5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 03D — CERRAR FUNCIONES SHOPIFY NATIVAS Y WISHLIST DE CUENTA

==================================================
AUTONOMY / ACCELERATION — HIGHEST PRIORITY
==================================================

Daniela quiere máxima velocidad sin bajar calidad.

Hasta aproximadamente las 13:00 hora Colombia:
- NO pedir tareas manuales.
- Si aparece auth/MFA/email code/legal/billing/owner-only:
  DEFERRED_OWNER_ONLY_BLOCKER.
- NO esperar.
- Seguir todo lo independiente.
- Un bloqueo manual NO bloquea la fase.

Acelerar usando:
- Shopify CLI;
- Shopify Admin/browser autenticado;
- herramientas/APIs oficiales disponibles;
- scripts reproducibles;
- subagentes/workflows paralelos SOLO para tareas independientes;
- nunca hacer writes conflictivos en paralelo sobre el mismo objeto.

Mantener cadence actual de handoff:
+1 min → +2 min → +5 min.
NO activar 2/5/8 todavía; eso solo se activa cuando Daniela lo ordene de noche.

==================================================
03C — REVIEWED AND APPROVED
==================================================

03C terminó con éxito.

Estado confirmado:
- 29 productos
- 98 variantes
- 95 imágenes
- colecciones 10 / 12 / 7 / 0
- 29/29 custom.color
- inventario NO rastreado porque no existe snapshot de cantidades
- precios/compare-at reconciliados
- moneda COP sin decimales
- navegación real creada
- Home enlazada donde había fuente real
- PDP PASS
- Cart PASS
- Wishlist guest PASS
- Collection PASS
- Search PARCIAL solo por índice Shopify todavía incompleto
- Theme RC1.3
- Theme ID 189072474431
- Radaelli sigue UNPUBLISHED
- Horizon sigue LIVE y untouched
- Theme Check 0/0
- responsive matrix 78/78 PASS
- 0 fatal JS propios
- 0 fatal Liquid

RC1.3 SHA-256:
1aa125bb7a4a33b09ea972afea6a6eb3a39fb781584476a6d1e465c0e94a22c0

DEFERRED_OWNER_ONLY_BLOCKER:
- CUSTOMER ACCOUNT LOGIN CODE

==================================================
OBJETIVO DE 03D
==================================================

Cerrar la mayor cantidad posible de funciones faltantes sin pagos ni publicación final:

A. búsqueda e indexación real;
B. filtros Shopify;
C. Search & Discovery si es realmente necesario;
D. wishlist de cuenta / sync multi-dispositivo según arquitectura 02L;
E. app custom Radaelli mínima y segura si sigue siendo la vía oficial correcta;
F. Customer Account extension "Mis favoritos" si Shopify Dev Store lo permite;
G. migrar contenido/activos faltantes SOLO si existen realmente en repo/source;
H. QA end-to-end de storefront ya con catálogo real;
I. dejar owner-only blockers mínimos y aislados.

NO Wompi todavía.
NO publish.
NO DNS.
NO real payments.

==================================================
1. SEARCH INDEX — RE-TEST REAL
==================================================

Primero volver a probar el índice Shopify ahora que pasó más tiempo desde 03C.

Matriz mínima:
- title exacto
- title parcial
- bikini
- enterizo
- negro
- blanco
- mostaza
- beige
- naranja
- azul
- colección
- SKU si Shopify lo indexa

Comparar:
- /search
- predictive search
- resultado count
- handles correctos
- cards correctas

Crear:
shopify-migration/theme/03D-search-index-report.md

Si ya está completo:
documentar PASS y no tocar tags innecesariamente.

Si sigue incompleto:
continuar a Search & Discovery / tags controlados.

==================================================
2. SEARCH & DISCOVERY
==================================================

Evaluar la app oficial Shopify Search & Discovery.

Si:
- es oficial de Shopify;
- gratuita;
- no exige billing;
- y mejora filtros/search del storefront;

entonces instalar/configurar en la Dev Store usando Admin/browser autorizado.

NO third-party search app.

Configurar SOLO capacidades soportadas por data real:
- filtros por disponibilidad si Shopify lo expone de forma coherente;
- precio;
- color si puede derivarse oficialmente de custom.color o tags;
- otras opciones reales solo si existen.

No crear filtros ficticios.

Si su instalación exige owner-only acceptance y Daniela sigue ausente:
deferir esa aceptación, continuar todo lo demás.

==================================================
3. COLOR SEARCH — CONTROLLED DECISION
==================================================

03C dejó pendiente tags de color.

Hacer experimento controlado con 2–4 productos:
- uno cuyo título ya contiene color;
- entero-golden-hour (MOSTAZA);
- bikini-foam (BLANCO);
- un NEGRO cuyo handle histórico diga azul-marino.

Comparar antes/después si tags son necesarios.

Si tags mejoran búsqueda de forma comprobable:
usar convención determinista y mínima, por ejemplo:
color:NEGRO
color:BLANCO
etc.,
siempre verificando que Shopify native search realmente los indexa.

Aplicar a los 29 productos SOLO después del experimento.

No duplicar tags.
No meter términos SEO inventados.

Crear:
shopify-migration/catalog/color-search-tag-map.csv

==================================================
4. FILTER QA
==================================================

Con Search & Discovery o filtros nativos configurados:

Probar:
- collection filters
- mobile filter drawer
- apply/remove
- clear all
- price filter
- color filter si existe
- availability filter solo si no confunde por inventario no rastreado
- sort
- back/forward
- querystring persistence

Si availability sería engañoso por inventario no rastreado:
NO ofrecer ese filtro y documentar.

==================================================
5. RE-AUDIT 02L CUSTOMER ACCOUNTS ARCHITECTURE
==================================================

Leer:
- customer-accounts-report.md
- customer-accounts-decision.md
- wishlist.js/current theme
- cualquier contrato window.Radaelli.wishlist.connectAccount

Confirmar si la arquitectura recomendada sigue siendo válida en Shopify actual.

Target aprobado:
- New Customer Accounts
- passwordless email code
- guest wishlist sin login
- logged-in wishlist sync across devices
- guest favorites merge into account on login
- account wishlist source of truth después de merge
- "Mis favoritos" dentro de Customer Account UX
- no Classic Accounts

==================================================
6. CUSTOM RADAELLI APP — BUILD IF STILL REQUIRED
==================================================

Si la arquitectura 02L sigue requiriendo una app propia:

Crear una app Radaelli mínima para DEV, usando Shopify CLI y Partner org existente.

Objetivo:
- NO base de datos;
- backend stateless;
- Admin token SOLO server-side;
- no secrets en repo;
- dev env vars fuera del código;
- app proxy seguro;
- HMAC/signature validation;
- shop allowlist;
- timestamp window;
- no confiar customer ID/email enviados por browser.

NO publicar/distribuir comercialmente todavía.
NO billing.
NO paid services.

Si creación/instalación requiere una aceptación owner-only:
deferir SOLO esa aceptación y continuar scaffolding/tests/documentación.

==================================================
7. CUSTOMER METAFIELD FOR WISHLIST
==================================================

Target de 02L:
Customer metafield:
custom.wishlist
type:
list.product_reference
max new additions: 100

Verificar límites y comportamiento real Shopify actual.

Crear definición si la app/auth permite.

No usar $app-owned metafield si eso implica perder datos al desinstalar la app.

Necesidades:
- read bootstrap
- write with metafieldsSet
- compareDigest / CAS si soportado según API actual
- no silent truncation
- deterministic ordering

==================================================
8. APP PROXY / SERVER CONTRACT
==================================================

Implementar endpoint(s) mínimos para:

- read wishlist state if needed;
- write/update wishlist;
- merge guest → account;
- remove;
- reconcile compareDigest conflicts.

Security:
- validate Shopify signature/HMAC;
- validate shop;
- validate timestamp;
- customer identity from Shopify-signed context only;
- never accept raw customerId/email as authority from browser;
- rate-limit reasonably without external DB if feasible;
- JSON schema validation;
- max list 100;
- no arbitrary metafield writes.

No PII in logs.

==================================================
9. MERGE ALGORITHM
==================================================

Mantener decisión 02L:

guest {A,B,C} + account {B,D}
→ [B,D,A,C]

Requirements:
- account order first;
- add unique guest items;
- idempotent;
- CAS conflict retry;
- failure preserves guest local list;
- no destructive local clear until remote success;
- 401/expired session does not reload-loop;
- retry policy 2/8/30 sec if still current design;
- multi-tab safe with Web Lock where supported.

Unit + integration tests mandatory.

==================================================
10. THEME REMOTE ADAPTER
==================================================

Conectar la capa ya preparada de wishlist ONLY when real transport/bootstrap is ready.

Until then:
wishlist_account_sync stays false.

When ready in Dev:
- enable ONLY on Radaelli unpublished theme;
- test signed-out stays guest;
- signed-in switches account mode;
- no account list stored persistently in localStorage;
- pending outbox only as documented;
- cross-tab logout behavior;
- pageshow revalidation.

Do not touch Horizon.

==================================================
11. CUSTOMER ACCOUNT EXTENSION — MIS FAVORITOS
==================================================

If Shopify current platform supports the planned full-page Customer Account extension:

Build:
- "Mis favoritos"
- accessible
- responsive
- product cards/current product info
- remove favorite
- empty state
- unavailable product state
- deep link back to product
- no duplicated stale price/stock storage

Use native Customer Account extension architecture.

No legacy customers templates.

If extension cannot be installed/tested without owner-only step:
defer install, but finish code + tests + deployment package.

==================================================
12. REAL LOGIN TEST — ONLY IF POSSIBLE WITHOUT DANIELA
==================================================

Existing blocker:
CUSTOMER ACCOUNT LOGIN CODE

Before 13:00:
do NOT ask Daniela.

If current browser session somehow already has authenticated customer state legitimately:
use it.

Otherwise:
- keep deferred;
- do not wait;
- finish app/theme/account work with unit/integration/synthetic contracts;
- prepare exact 2-minute test script for Daniela later.

==================================================
13. SOURCE RECON — MISSING ASSETS/CONTENT
==================================================

03C marked as NOT_AVAILABLE:
- Hero asset(s)
- collection cover images/videos
- size guide image
- some Featured / Recommended curation

Search ONLY legitimate project/repo/source artifacts already available.

Look for:
- exact current-site hero media;
- exact collection cover media;
- exact size-guide image/content;
- exact hardcoded featured/recommended product selections.

If found with clear provenance:
migrate to Dev Store and wire to Radaelli unpublished theme.

If not found:
leave fallback.
DO NOT invent.
DO NOT generate new marketing assets in this phase.

Create:
shopify-migration/theme/03D-missing-assets-audit.md

==================================================
14. LEGAL / POLICY SOURCE RECON
==================================================

Search existing custom site/repo/source for exact current content:
- privacy
- terms
- returns/refunds/exchanges
- shipping
- contact/help
- data sharing/cookies if relevant

If exact existing content is found:
- inventory it;
- migrate to Dev as pages/policies when technically safe;
- preserve text, do not rewrite legal meaning;
- wire footer links only to real pages.

If NOT found:
document NOT_AVAILABLE.
Do NOT generate legal text from scratch.
Do NOT give legal advice.

==================================================
15. FREE SHIPPING CLAIM CONSISTENCY
==================================================

Theme/current site says free shipping from COP 299,900.

Audit all occurrences:
- promo banner
- PDP
- cart progress
- footer/FAQ if any

Because final shipping rates are NOT configured yet:
- do not activate behavior that falsely promises a rate Shopify cannot honor;
- keep cart progress OFF unless actual rate configuration matches;
- document exact locations and launch dependency.

Do NOT invent below-threshold shipping price.

==================================================
16. FEATURED / RECOMMENDED
==================================================

Search current code/data for exact existing selections.

If exact source exists:
configure Home sections.

If not:
do not ask Daniela before 13:00.
Leave safe fallback and record one editorial decision for later.

No arbitrary selections.

==================================================
17. REGRESSION WITH APP/SEARCH CHANGES
==================================================

Run:
- Theme Check
- audit theme limits
- existing 45/45 suite
- all new wishlist/account tests
- search/filter tests
- mutation tests for new critical logic

Shopify real matrix:
- Home
- Collection
- PDP
- Search
- Cart
- Favorites
- Account entry
- account extension if installed

Widths:
320
375
390
430
768
1024
1280

No horizontal overflow.
No fatal JS.
No fatal Liquid.

==================================================
18. RELEASE
==================================================

If theme changes:
create RC1.4 deterministic ZIP + manifest.

If no theme changes:
keep RC1.3.

If app is created:
create reproducible app package/build documentation, but DO NOT expose secrets.

==================================================
19. DO NOT TOUCH
==================================================

NO:
- publish Radaelli theme
- modify Horizon
- Production
- Staging
- Vercel
- Neon
- Wompi
- real payments
- DNS/domain
- billing/charges
- taxes
- final shipping rates
- main
- merge
- PR
- customer outreach
- destructive catalog changes unrelated to this phase

==================================================
20. REPORT
==================================================

Create:
shopify-migration/theme/03D-search-accounts-wishlist-report.md

Include:

1. model confirmed
2. elapsed time
3. usage exact or UNAVAILABLE
4. search index completeness
5. Search & Discovery installed YES/NO
6. filters configured
7. color search experiment
8. color tags applied YES/NO
9. collection filter QA
10. 02L architecture still valid YES/NO
11. custom app created YES/NO
12. app install status
13. customer metafield definition status
14. app proxy status
15. HMAC/security tests
16. merge algorithm tests
17. CAS/conflict tests
18. remote adapter status
19. wishlist_account_sync final setting
20. Customer Account extension built YES/NO
21. extension installed/tested YES/NO
22. real passwordless login status
23. customer Liquid object status
24. guest→account merge real test status
25. cross-device/account sync test status
26. logout behavior
27. legacy account templates required NO
28. missing asset audit result
29. Hero asset result
30. collection covers result
31. size guide source result
32. featured/recommended source result
33. legal/policy source audit
34. pages/policies migrated
35. free shipping claim audit
36. theme code changed YES/NO
37. app code changed/created YES/NO
38. release version/hash
39. Theme Check errors/warnings
40. regression suite
41. real responsive matrix
42. fatal JS
43. fatal Liquid
44. Horizon untouched YES/NO
45. Radaelli unpublished YES/NO
46. catalog still 29/98/95 YES/NO
47. Production/Staging/main touched NO
48. payments/Wompi touched NO
49. owner-only blockers
50. blockers for 03E
51. READY FOR 03E YES/NO
52. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

==================================================
21. HANDOFF
==================================================

At completion:

Update:
ai-handoff/claude-result.md

Create:
ai-handoff/archive/03D-result.md

Update status.md:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03D
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 03E
CURRENT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

Push ONLY handoff Markdown to origin/ai-handoff.

Send:
HANDOFF READY 03D

Then use CURRENT DAY cadence:
Check 1: +1 minute
Check 2: +2 additional minutes
Check 3: +5 additional minutes

If READY_FOR_CLAUDE_03E appears:
continue immediately.

If not ready after ~8 minutes:
stop only handoff wait.
Do not invent 03E.

==================================================
BACKGROUND RULE
==================================================

No detached watchers.
No infinite loops.
No indefinite waits.

Before 13:00:
defer owner-only blockers and keep working.

At phase completion:
zero background tasks outside finite handoff checks.
