# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_02M

PHASE: 02M — OFFLINE RELEASE CANDIDATE + PACKAGING + PRE-DEVELOPMENT-STORE QA
MODEL: OPUS 5.5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 02M — CIERRE OFFLINE DEL THEME ANTES DE DEVELOPMENT STORE

==================================================
CONTEXTO CONFIRMADO
==================================================

La Fase 02L — Customer Accounts + Account Wishlist Architecture terminó correctamente y fue revisada por ChatGPT.

02L confirmó:
- New Customer Accounts
- login passwordless por código de email
- guest wishlist permitida
- wishlist de cuenta sincronizada entre dispositivos
- merge guest → account
- cuenta como source of truth después de merge exitoso
- "Mis favoritos" integrado conceptualmente a Customer Accounts
- arquitectura recomendada: customer metafield custom.wishlist + custom app mínima + app proxy + función stateless + Customer Account extension
- remote adapter implementado pero INERTE
- guest behavior sin regresión
- Theme Check 0/0
- harness 28/28 + mutation tests 6/6
- Production NO tocada
- Staging NO tocado
- Shopify Store NO creada
- Development Store NO creada
- app NO creada/instalada
- deploy NO
- main NO tocado

Bloqueadores reales que requieren Development Store quedaron documentados.

OBJETIVO DE 02M:

Convertir todo el trabajo offline 02A–02L en un RELEASE CANDIDATE limpio, reproducible, portable y auditable ANTES de crear una Development Store.

Esta fase debe:
- limpiar problemas estructurales heredados;
- empaquetar el theme correctamente;
- ejecutar una regresión global;
- verificar que no haya archivos huérfanos, referencias rotas ni dependencias accidentales;
- producir checklist de importación;
- dejar un ZIP reproducible;
- dejar manifiesto/hashes;
- dejar todos los pendientes de tienda/app claramente separados del theme.

NO crear Shopify Store.
NO crear Development Store.
NO login Shopify.
NO app.
NO deploy.

==================================================
1. REAUDITORÍA GLOBAL DEL WORKTREE
==================================================

Antes de modificar:

Inventariar TODO:
- layout
- templates
- sections
- snippets
- assets
- config
- locales
- docs/reportes
- cualquier archivo temporal/scratch accidental dentro del theme

Comparar contra:
- 02A–02L reports
- README
- templates actualmente referenciados
- assets cargados
- settings schema/data
- locale keys

Detectar:
- archivos huérfanos
- snippets no usados
- assets no usados
- referencias a archivos inexistentes
- settings muertos
- claves de locale huérfanas
- IDs duplicados
- nombres incompatibles con Shopify

No borrar algo solo porque parezca no usado si Shopify puede invocarlo dinámicamente.
Documentar criterio.

==================================================
2. FIX OBLIGATORIO DE LOCALES
==================================================

02L detectó:
- existen dos archivos *.default.json
- Shopify admite un solo default locale
- inglés debe quedar como locale no-default válido

Reauditar exactamente los nombres.

Corregir a una estructura Shopify válida, por ejemplo:
- es.default.json
- en.json

o equivalente si la arquitectura actual exige otro default.

Requisitos:
- una sola locale default
- todas las claves necesarias presentes
- fallback correcto
- JSON válido
- Theme Check 0/0

No traducir contenido nuevo innecesariamente.
No perder claves.

==================================================
3. THEME ROOT / PACKAGE STRUCTURE
==================================================

El ZIP de Shopify debe tener directamente en raíz:
- assets/
- config/
- layout/
- locales/
- sections/
- snippets/
- templates/

NO debe quedar una carpeta contenedora extra.

NO incluir dentro del ZIP:
- shopify-migration/theme/*.md
- reports
- catalog exports
- worktree metadata
- .git
- node_modules
- scratchpads
- test harness
- secrets
- logs
- launch.json
- source custom Next app

Verificar estructura del ZIP después de generarlo.

==================================================
4. RELEASE CANDIDATE VERSION
==================================================

Usar nombre neutral y portable:

radaelli-shopify-theme-rc1.zip

Guardarlo bajo un directorio de distribución offline claramente separado, por ejemplo:

shopify-migration/dist/

No hacer commit/push del ZIP a main.

Crear también:
shopify-migration/dist/release-manifest.json

Debe incluir:
- release name
- generated timestamp
- total theme files
- file paths
- SHA-256 por archivo
- SHA-256 del ZIP
- Theme Check result
- source worktree/branch identifier sin secretos
- phase baseline 02A–02L

Si timestamp impide reproducibilidad byte-for-byte del ZIP:
documentar.
Preferir ZIP determinista si es razonable.

==================================================
5. SETTINGS AUDIT
==================================================

Reauditar:
config/settings_schema.json
config/settings_data.json

Validar:
- IDs únicos
- IDs referenciados existen
- defaults válidos
- no settings muertos evidentes
- no references a development/store IDs
- no hardcoded domains
- account/wishlist flags seguros por defecto
- free shipping progress OFF por defecto
- account sync OFF por defecto hasta app real
- cualquier feature que dependa de tienda/app queda OFF por defecto

No desactivar features puramente offline que ya funcionan.

==================================================
6. TEMPLATE AUDIT
==================================================

Validar todos los JSON templates existentes:
- index
- collection
- product
- search
- cart
- page.wishlist
- article/blog/pages si existen
- 404/password/gift_card si existen
- cualquier template adicional

Cada section type debe existir.
No duplicate section IDs.
No references rotas.

Documentar templates que requieren crear una Page/Collection en Shopify Admin después.

==================================================
7. SECTION / SNIPPET AUDIT
==================================================

Verificar:
- cada render/include apunta a snippet real
- cada section_schema es válido
- no recursion accidental
- no nested forms inválidos
- no nested anchors
- no duplicate IDs previsibles
- bloques repetidos usan section.id/block.id correctamente
- app blocks/extensibility donde corresponda no están falsificados

Wishlist/account remote transport debe seguir INERTE hasta app real.

==================================================
8. ASSET AUDIT
==================================================

Validar:
- todos los stylesheet_tag/script_tag apuntan a assets reales
- CSS de página solo donde corresponde
- JS global solo si justificado
- no duplicate script loads
- no orphan JS/CSS
- no source maps accidentales
- no external CDN/library accidental
- no React/jQuery/Swiper/PhotoSwipe
- no next chunks

Reportar tamaños:
- CSS total
- JS total
- 5 assets más grandes
- gzip aproximado si es sencillo y exacto

==================================================
9. GLOBAL REGRESSION MATRIX
==================================================

Ejecutar una regresión offline de TODAS las superficies construidas:

A. Header/Nav
B. Footer
C. Home
D. Product Card
E. Collection
F. Product Page
G. Cart Drawer
H. Cart Page
I. Search
J. Predictive Search
K. Wishlist guest
L. Wishlist account layer inerte
M. Customer Account entry/fallback

Validar por estructura/harness donde sea razonable:
- no JS errors
- no broken asset refs
- keyboard
- focus
- reduced motion
- no horizontal overflow
- 320 / 375 / 390 / 430 / 640 / 768 / 1024 / 1280 / 1440
- Header integrations coexist
- search/cart/wishlist triggers no se pisan
- mobile menu coexistence
- dialog coexistence
- body scroll lock cleanup

No declarar "real Shopify PASS" para cosas que requieren Development Store.

==================================================
10. CROSS-FEATURE EVENT AUDIT
==================================================

Inventariar eventos custom definidos:
- product:add-to-cart
- cart:updated
- wishlist:updated
- wishlist:add/remove/view
- search hooks
- otros

Validar:
- nombres únicos
- payloads mínimos
- no PII
- no event loops
- no listener duplication
- documentación de contratos

Crear una pequeña tabla en reporte.

==================================================
11. NO-JS AUDIT
==================================================

Validar degradación sin JS para:
- Header navigation
- Search
- Product form
- Cart
- Wishlist page
- Account link

Wishlist toggle puede ocultarse sin JS como ya se diseñó.

No exigir que features AJAX funcionen sin JS si existe fallback correcto.

==================================================
12. ACCESSIBILITY GLOBAL
==================================================

Revisar de forma cruzada:
- headings
- landmarks
- dialogs
- forms
- labels
- focus-visible
- keyboard
- aria-expanded
- aria-controls
- aria-pressed
- live regions
- hidden semantics
- contrast
- tap targets
- reduced-motion

No hacer una reescritura grande si no hay fallo real.

Corregir solo issues verificables.

==================================================
13. SEO / URL / ROUTE AUDIT
==================================================

Validar:
- canonical/global SEO no roto
- product/collection/search URLs usan Shopify routes
- no hardcoded custom production routes funcionales
- wishlist public route queda documentada como page template
- customer account uses Shopify routes
- redirects requeridos para launch documentados, NO implementados en DNS/production

Crear listado de redirects futuros, sin aplicarlos.

==================================================
14. DATA DEPENDENCIES INVENTORY
==================================================

Crear inventario exacto de dependencias de datos que deberán configurarse en Development Store/Admin:

Por ejemplo:
- collections target
- product custom.color
- custom.size_guide
- collection metafields
- product tags para search por color
- wishlist customer metafield custom.wishlist
- navigation menus
- page Favoritos
- size guide metaobject
- free shipping threshold/tarifa
- any section content settings

Para cada una:
- namespace/key o entidad
- type
- required/optional
- fallback actual
- blocker YES/NO

==================================================
15. APP / CUSTOMER ACCOUNT DEPENDENCIES INVENTORY
==================================================

Separar completamente del theme:

- custom app
- app proxy
- stateless function
- Admin API scopes
- protected customer data
- customer account extension
- app embed
- metafield definition
- transport bridge

NO crear nada.
Solo checklist ordenado de implementación posterior.

==================================================
16. WISH / ACCOUNT SAFETY CHECK
==================================================

Confirmar:
- wishlist_account_sync default false
- remote adapter no hace network sin transport real
- no /apps endpoint hardcodeado
- no fake customer identity
- no Admin token
- no local persistence de account full wishlist
- guest behavior sigue intacto

==================================================
17. PORTABILITY / SECRET SCAN — GLOBAL
==================================================

Escanear TODO theme-src y dist antes de cerrar.

Buscar:
- secrets
- API keys
- tokens
- passwords
- DSNs
- database URLs
- myshopify domains
- store IDs
- theme IDs
- customer IDs
- emails internos hardcodeados
- teléfonos internos hardcodeados
- radaelliswimwear.com como dependencia funcional
- Next imports
- React imports
- Prisma
- Neon
- Wompi
- Vercel
- Cloudinary SDK
- localhost funcional
- test endpoints
- scratch refs

Resultado funcional esperado:
0.

Documentación puede mencionar tecnologías históricas, pero no deben estar dentro del ZIP funcional.

==================================================
18. THEME CHECK FINAL
==================================================

Ejecutar:

npx @shopify/cli theme check

sobre el theme final PRE-ZIP.

Objetivo:
0 errors
0 warnings

Luego verificar el contenido extraído del ZIP y ejecutar Theme Check allí también si es viable.

No asumir que porque source pasa, ZIP pasa.

==================================================
19. PACKAGE REPRODUCIBILITY
==================================================

Generar ZIP desde una lista explícita de directorios válidos.

Luego:
- listar su contenido
- verificar ausencia de carpetas extra
- verificar hash
- extraer a scratch temporal
- comparar tree contra theme-src esperado
- verificar que no falte ningún archivo
- verificar que no haya archivos extra

Eliminar scratch al terminar.

==================================================
20. PRE-DEVELOPMENT-STORE CHECKLIST
==================================================

Crear:

shopify-migration/theme/pre-development-store-checklist.md

Ordenar por fases manuales futuras:

A. Crear Development Store
B. Activar New Customer Accounts
C. Crear/importar catálogo
D. Crear collections
E. Crear metafields/metaobjects
F. Crear menus/pages
G. Subir theme RC
H. Configurar Theme Editor
I. Crear custom app wishlist
J. Customer Account extension
K. Wompi proof
L. Analytics
M. SEO redirects
N. QA
O. Commercial store/cutover

Cada paso:
- manual/Claude
- prerequisite
- risk level
- success criterion

No ejecutar ninguno.

==================================================
21. RELEASE REPORT
==================================================

Crear:

shopify-migration/theme/offline-release-candidate-report.md

Debe incluir:
- scope 02A–02L
- files/theme inventory
- fixes made in 02M
- locale correction
- settings audit
- templates audit
- asset audit
- event contracts
- no-JS
- accessibility
- responsive
- data dependencies
- app dependencies
- portability scan
- Theme Check source + extracted ZIP
- package SHA-256
- known blockers requiring Development Store
- known blockers requiring app
- known decisions pending Daniela
- GO/NO-GO for Development Store

==================================================
22. README
==================================================

Actualizar:
shopify-migration/theme-src/README.md

Añadir:
- RC1 packaging
- how to run Theme Check
- how to build ZIP reproducibly
- what not to include
- account/wishlist feature flags
- offline limitations
- next manual checkpoint

==================================================
23. NO IMPLEMENTAR NUEVAS FEATURES
==================================================

02M es cierre/QA/empaquetado.

NO agregar:
- reviews
- size recommender
- new account features
- new wishlist behavior
- checkout
- Wompi
- analytics
- blog redesign
- marketing popups
- app logic

Solo corregir bugs/referencias/regresiones verificables.

==================================================
24. NO STORE / NO DEPLOY
==================================================

NO:
- Shopify Store
- Development Store
- Shopify login
- theme upload
- app install
- app create
- product import
- metafield creation
- customer creation
- email code
- Wompi
- Production
- Staging
- Vercel
- Neon
- DNS
- deploy
- push main
- merge
- PR
- rebase/reset

==================================================
25. OPUS
==================================================

Continuar con:
OPUS 5.5 ULTRACODE

Reportar:
- model confirmed
- elapsed time aproximado
- usage exacto solo si visible
- si no: UNAVAILABLE
- major self-corrections
- concrete Opus value observed

No inventar.

==================================================
26. HANDOFF AL TERMINAR
==================================================

Al terminar 02M:

1. actualizar:
ai-handoff/claude-result.md

2. crear:
ai-handoff/archive/02M-result.md

3. actualizar status.md a:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 02M
CURRENT_PHASE: WAITING_FOR_DEVELOPMENT_STORE_CREATION
NEXT_PHASE: 03
CURRENT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

4. push SOLO handoff Markdown a:
origin/ai-handoff

5. enviar:
HANDOFF READY 02M

6. STOP.

==================================================
27. STOP OBLIGATORIO DESPUÉS DE 02M
==================================================

NO protocolo 1/2/5 para arrancar Phase 03.

NO iniciar Phase 03.

NO crear Development Store.

Después de:
HANDOFF READY 02M

STOP.

La siguiente etapa requiere acción manual de Daniela:
crear/conectar una Development Store o confirmar el mecanismo equivalente autorizado.

==================================================
28. INFORME FINAL
==================================================

claude-result.md debe incluir como mínimo:

1. model confirmed
2. approximate elapsed time
3. resource/usage or UNAVAILABLE
4. global worktree audit completed YES/NO
5. theme files total
6. orphan files found/fixed
7. locale structure before
8. locale structure after
9. exactly one default locale PASS/FAIL
10. settings audit PASS/FAIL
11. templates audit PASS/FAIL
12. sections/snippets audit PASS/FAIL
13. asset references PASS/FAIL
14. unused assets result
15. total CSS size
16. total JS size
17. five largest assets
18. global regression matrix result
19. responsive matrix result
20. accessibility global result
21. no-JS audit result
22. custom events inventory result
23. route/SEO audit result
24. data dependency inventory created YES/NO
25. app/account dependency inventory created YES/NO
26. wishlist/account safety PASS/FAIL
27. secret/portability scan 0/FAIL
28. Theme Check source errors
29. Theme Check source warnings
30. Theme Check extracted ZIP errors
31. Theme Check extracted ZIP warnings
32. release ZIP path
33. ZIP root structure PASS/FAIL
34. ZIP SHA-256
35. release manifest path
36. file/hash comparison PASS/FAIL
37. scratch cleanup PASS/FAIL
38. pre-development-store checklist created YES/NO
39. release report created YES/NO
40. README updated YES/NO
41. Production touched NO
42. Staging touched NO
43. Shopify Store created NO
44. Development Store created NO
45. theme uploaded NO
46. app created/installed NO
47. product import NO
48. deploy NO
49. push main NO
50. major self-corrections
51. concrete Opus value observed
52. GO FOR DEVELOPMENT STORE YES/NO
53. blockers before Development Store
54. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

==================================================
BACKGROUND RULE
==================================================

NO watchers detached.
NO loops infinitos.
NO indefinite waits.
NO long-lived background tasks.

Al finalizar:
HANDOFF READY 02M
y STOP.

CERO TAREAS DE SEGUNDO PLANO ACTIVAS.
