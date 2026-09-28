# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_02J

PHASE: 02J — SEARCH
MODEL: OPUS 5.5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 02J — SEARCH + PREDICTIVE SEARCH

==================================================
CONTEXTO CONFIRMADO
==================================================

La Fase 02I — Cart + Cart Drawer terminó correctamente y fue revisada por ChatGPT.

Resultado confirmado:
- Cart Drawer implementado
- Cart Page implementada
- PDP hook integrado
- no-JS fallback PASS
- Ajax Cart API + Section Rendering API
- quantity / remove / subtotal / count sync
- Header integration PASS
- empty / loading / error states
- race-condition handling
- progressive enhancement
- accessibility / keyboard / focus PASS
- mobile / desktop / 320px PASS
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

Además, 02I corrigió el umbral visual de envío gratis a $299.900 donde correspondía y dejó la barra desactivada por defecto hasta que la tarifa real exista en Shopify.

OBJETIVO DE 02J

Construir el SEARCH REAL del futuro theme Shopify de Radaelli Swimwear, incluyendo:

- trigger de búsqueda del Header
- Search UI desktop/mobile
- página /search
- predictive search / autocomplete SOLO si corresponde a la experiencia real y puede implementarse de forma nativa/robusta
- resultados de productos
- empty states
- loading/error states
- teclado/focus
- responsive
- performance
- integración con Product Card definitivo

NO construir todavía:
- Wishlist funcional
- Customer Accounts
- Checkout customization
- Wompi
- Shopify Store
- Development Store

==================================================
1. REAUDITORÍA OBLIGATORIA
==================================================

ANTES DE CODIFICAR:

Inspecciona directamente el search REAL del proyecto actual.

Buscar y auditar:
- Header search trigger de 02C
- componentes/rutas actuales de search
- search input
- desktop behavior
- mobile behavior
- overlay/dropdown/page behavior
- autocomplete/predictive results
- debounce
- minimum query length
- product results
- collection results
- page/article results si existen
- recent searches si existen
- keyboard navigation
- focus behavior
- Escape
- clear button
- loading state
- empty state
- error state
- URL/search params
- analytics hooks
- Product Card usage
- accessibility
- responsive

NO depender del blueprint.

Si el sitio actual NO tiene predictive search real:
NO inventar una experiencia compleja solo porque Shopify la permite.

Si existe search básico:
mantener fidelidad, y cualquier mejora debe quedar claramente documentada.

==================================================
2. HEADER SEARCH INTEGRATION
==================================================

La Fase 02C dejó un search trigger preparado.

Reauditar exactamente cómo quedó:
- trigger
- expanded form
- desktop
- mobile
- aria attributes
- focus

02J debe completar esa integración sin romper:
- sticky header
- mobile menu
- cart trigger/drawer
- account link
- wishlist placeholder

Con JS:
puede abrir panel/modal/dropdown según el comportamiento real.

Sin JS:
debe existir fallback funcional hacia /search.

==================================================
3. SEARCH PAGE
==================================================

Construir/terminar:

templates/search.json
sections/main-search.liquid

Debe funcionar server-rendered y sin JS.

Usar objetos nativos Shopify:
- search
- search.results
- search.terms
- search.performed

No usar Storefront API si no hace falta.

==================================================
4. RESULT TYPES
==================================================

Auditar qué tipos muestra la web real.

Prioridad:
PRODUCTS.

Solo incluir:
- collections
- pages
- articles

si realmente corresponden al diseño/arquitectura actual.

No ensuciar UX mostrando tipos irrelevantes.

Si la página final se decide product-only:
documentarlo.

==================================================
5. PRODUCT CARD
==================================================

Reutilizar:

snippets/product-card.liquid

NO duplicar markup.

Search results deben respetar:
- price
- sale/sold-out
- image strategy
- wishlist placeholder
- secondary image si corresponde
- accessibility

==================================================
6. PREDICTIVE SEARCH
==================================================

Primero auditar si existe equivalente real.

Si procede, usar Shopify Predictive Search nativo:
- /search/suggest
- resources[type]
- resources[limit]
- section rendering o respuesta soportada

Preferencia:
Liquid section/snippet + vanilla JS.

NO:
- Algolia
- Storefront API custom
- search library
- app
- fuzzy engine propio

Mantener implementación portable.

==================================================
7. QUERY / DEBOUNCE
==================================================

Si predictive search se implementa:

- no request con query vacía
- usar longitud mínima razonable basada en UX real
- debounce ligero
- AbortController para query anterior
- respuesta más reciente manda
- trim del input
- no polling

No sobre-optimizar.

==================================================
8. KEYBOARD
==================================================

Si existe dropdown predictivo:

Debe soportar:
- ArrowDown
- ArrowUp
- Enter
- Escape
- Tab normal
- focus return
- active descendant o roving focus correctamente implementado

No atrapar Tab innecesariamente.

==================================================
9. ACCESSIBILITY
==================================================

Validar:
- input label/accessibility name
- role search
- clear button label
- result count announcement
- loading announcement sin spam
- empty announcement
- keyboard
- focus-visible
- contrast
- tap targets
- Escape
- no información crítica solo por hover

Si usas combobox/listbox:
implementar semántica completa.

Si no es necesario:
preferir patrón más simple y robusto.

==================================================
10. SEARCH URL
==================================================

La página debe usar parámetros Shopify nativos.

No inventar rutas.

Preservar query al:
- enviar form
- paginar
- ordenar si aplica

No generar parámetros internos incompatibles.

==================================================
11. SEARCH FILTERING / SORTING
==================================================

Auditar si el search actual permite filtros/sort.

Si NO:
no reutilizar automáticamente toda la UI de Collection.

Si Shopify search filters ya son apropiados y el diseño real los necesita:
puedes reutilizar snippets/arquitectura de 02G de forma mantenible.

No duplicar código.

==================================================
12. SEARCH GRID
==================================================

Grid debe:
- reutilizar Product Card
- ser responsive
- tener loading/fallback estable
- no horizontal overflow
- mantener spacing de Collection/Home cuando corresponda

Validar:
320 / 375 / 390 / 430 / 640 / 768 / 1024 / 1280 / 1440.

==================================================
13. EMPTY STATES
==================================================

Cubrir como mínimo:
- search no ejecutado
- query sin resultados
- query con resultados

No inventar copy promocional.

Si el real sugiere colección/catálogo:
replicar solo si existe.

==================================================
14. CLEAR / CLOSE
==================================================

Si search UI expandida/modal:
- clear limpia input y resultados
- close restaura foco
- Escape cierra
- click fuera solo si coincide con UX real

No cerrar mientras el usuario interactúa con resultados.

==================================================
15. MOBILE SEARCH
==================================================

Reauditar flujo mobile real.

Validar:
- teclado virtual
- viewport pequeño
- safe areas
- scroll
- input visible
- close visible
- results scroll
- no overlap con Header
- no horizontal overflow

No reutilizar drawer de cart si la semántica no encaja.

==================================================
16. PERFORMANCE
==================================================

Objetivo:
- search page server-rendered
- predictive JS solo donde aplica
- debounce
- AbortController
- no framework
- no listeners por resultado
- event delegation
- Product Card optimizado
- no requests duplicados
- no full-page product data en predictive UI

Reportar:
- CSS añadido
- JS añadido
- requests por query
- debounce elegido
- max predictive results

==================================================
17. SECURITY / INPUT
==================================================

Tratar query como input no confiable.

No:
- innerHTML con texto crudo del usuario
- construir URLs inseguras manualmente
- inyectar query sin escape

Preferir markup renderizado por Shopify cuando sea posible.

==================================================
18. SEO
==================================================

Search page:
- no inventar SEO text
- heading semántico
- términos visibles de forma escapada
- pagination crawlable si aplica

No modificar canonical/global SEO fuera de alcance.

==================================================
19. ANALYTICS HOOKS
==================================================

NO implementar GA/Meta real.

Puede dejar hooks neutrales para:
- search submitted
- predictive result selected
- no results

NO IDs hardcodeados.

==================================================
20. THEME EDITOR
==================================================

Solo settings razonables, por ejemplo:
- enable predictive search
- predictive result limit
- show product price
- search page products per page

No sobreconfigurar.

==================================================
21. DOCUMENTACIÓN
==================================================

Crear:

shopify-migration/theme/search-report.md

Documentar:
- search actual auditado
- Header integration
- Search Page
- predictive search decision
- result types
- Product Card integration
- keyboard
- accessibility
- responsive
- performance
- differences
- fidelity estimate
- dependencies futuras

Actualizar:
shopify-migration/theme-src/README.md

==================================================
22. VALIDACIÓN
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
- search template refs
- section schema
- locale keys
- asset refs
- no duplicate IDs
- no nested anchors
- no orphan snippets

==================================================
23. INTERACTION HARNESS
==================================================

Usar harness local aislado SOLO si es útil.

NO usar preview_start si puede abrir la app Next real.

Validar como mínimo si predictive UI existe:
1. search open
2. focus input
3. type query
4. debounce/request
5. stale request cancellation
6. results render
7. ArrowDown
8. ArrowUp
9. Enter
10. Escape
11. clear
12. close + focus return
13. no results
14. server/network error
15. fast typing race
16. mobile width
17. reduced motion
18. no-JS search form fallback
19. search page result links
20. Product Card integrity

Si predictive search NO se implementa porque no corresponde:
adaptar el harness a la arquitectura real y explicar por qué.

No declarar pruebas físicas que no hiciste.

==================================================
24. PORTABILITY / SECRET SCAN
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
25. AISLAMIENTO
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
26. OPUS
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
27. HANDOFF AL TERMINAR
==================================================

Al terminar 02J:

1. actualizar:
ai-handoff/claude-result.md

2. crear:
ai-handoff/archive/02J-result.md

3. actualizar status.md:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 02J
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 02K
CURRENT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

4. push SOLO de handoff a:
origin/ai-handoff

5. enviar a ChatGPT:

HANDOFF READY 02J

==================================================
28. PROTOCOLO FINITO 1 / 2 / 5
==================================================

Después de HANDOFF READY 02J:

CHECK 1:
- esperar 1 minuto
- leer status.md + next-prompt.md
- si READY_FOR_CLAUDE_02K: continuar

CHECK 2:
- solo si Check 1 no está listo
- esperar 2 minutos adicionales
- total aproximado 3 minutos
- leer de nuevo
- si READY_FOR_CLAUDE_02K: continuar

CHECK 3:
- solo si Check 2 no está listo
- esperar 5 minutos adicionales
- total aproximado 8 minutos
- leer una última vez
- si READY_FOR_CLAUDE_02K: continuar

Si después del tercer check sigue sin estar listo:

MANUAL STEP REQUIRED — CHATGPT HANDOFF TIMEOUT AFTER 8 MINUTES

y STOP.

NO cuarto intento.
NO loop.
NO watcher.
NO espera indefinida.

==================================================
29. NO INVENTAR 02K
==================================================

No asumas que 02K es Wishlist, Accounts u otra cosa.

Solo ejecuta 02K cuando:
- ChatGPT reemplace next-prompt.md
- status sea READY_FOR_CLAUDE_02K

==================================================
30. INFORME FINAL
==================================================

claude-result.md debe incluir:

1. model confirmed
2. approximate elapsed time
3. resource/usage or UNAVAILABLE
4. search real reauditado YES/NO
5. rutas/componentes auditados
6. Header search integration PASS/FAIL
7. no-JS fallback PASS/FAIL
8. Search Page implemented YES/NO
9. predictive search implemented YES/NO + rationale
10. predictive endpoint/strategy
11. result types
12. Product Card integration PASS/FAIL
13. debounce
14. AbortController/race handling
15. keyboard navigation PASS/FAIL
16. focus management PASS/FAIL
17. clear/close behavior
18. search URL behavior
19. empty states
20. loading states
21. error states
22. desktop responsive PASS/FAIL
23. mobile responsive PASS/FAIL
24. 320px safety
25. accessibility PASS/FAIL
26. reduced-motion PASS/FAIL
27. visual fidelity estimate
28. CSS added
29. JS added
30. requests/query strategy
31. performance notes
32. Theme Editor settings
33. interaction harness result
34. Theme Check errors
35. Theme Check warnings
36. JSON validation
37. Liquid validation
38. JS validation
39. nested anchors check
40. secrets 0
41. store-specific IDs/domains 0
42. Next/React refs funcionales 0
43. Production touched NO
44. Staging touched NO
45. Shopify Store created NO
46. Deploy NO
47. Push main NO
48. major self-corrections
49. concrete Opus value observed
50. READY FOR PHASE 02K YES/NO
51. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

==================================================
BACKGROUND RULE
==================================================

NO watchers detached.
NO loops infinitos.
NO indefinite waits.
NO long-lived background tasks.

Durante handoff:
solo 3 checks finitos: 1m + 2m + 5m.

Al finalizar:
CERO TAREAS DE SEGUNDO PLANO ACTIVAS.
