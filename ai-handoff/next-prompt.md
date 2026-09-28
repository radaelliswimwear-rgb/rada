# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_02G

PHASE: 02G — COLLECTION PAGE
MODEL: SONNET 5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 02G — COLLECTION PAGE

CONTEXTO

La Fase 02F — Product Card terminó correctamente y fue revisada por ChatGPT.

Resultado confirmado:
- Product Card real reauditado contra 2 componentes distintos
- snippet definitivo creado: snippets/product-card.liquid
- placeholder eliminado
- 5 usos migrados
- primary image responsive nativa
- secondary image/hover opt-in
- 0 nested anchors
- price/compare-at/sale soportados
- sold-out soportado
- badges definidos sin inventar "Nuevo"
- wishlist sigue placeholder inerte
- Home integration PASS
- reusable for 02G: YES
- desktop/mobile/320px PASS
- accessibility/keyboard/contrast PASS
- Theme Check: 0 errores / 0 warnings
- JSON PASS
- Liquid PASS
- secrets 0
- store-specific IDs/domains 0
- Production NO tocada
- Staging NO tocado
- Shopify Store NO creada
- Deploy NO
- Push main NO

OBJETIVO

Construir la COLLECTION PAGE real y reusable del futuro theme Shopify de Radaelli Swimwear, con alta fidelidad respecto al catálogo/colecciones actuales y preparada para las colecciones objetivo:

- Oasis Natural
- Aurora Viva
- Espuma de Ola
- Salidas de Baño

Debe usar el Product Card definitivo de 02F.

NO construir todavía:
- Product Page (02H)
- Cart (02I)
- wishlist funcional
- Customer Accounts
- Checkout/Wompi
- Shopify Store
- Development Store

==================================================
1. REAUDITAR COLLECTION/CATALOG REAL
==================================================

Antes de implementar, inspecciona directamente el código real actual usado para:
- catálogo general
- páginas de colección
- collection hero/header
- grid
- filtros
- sorting
- selector 2/3/4 columnas si existe
- breadcrumb
- pagination/infinite load
- mobile filters
- empty states
- product count
- category text
- cover images
- cover image positioning/zoom
- collection description
- animation/entry
- wishlist/quick-view hooks
- responsive behavior

NO depender únicamente del blueprint.

Documentar diferencias entre:
- código real
- storefront-blueprint.md
- collection blueprint previo
- implementation roadmap

Si hay conflicto:
el código real actual es fuente prioritaria.

==================================================
2. COLLECTION TEMPLATE
==================================================

Actualizar:

templates/collection.json
sections/main-collection.liquid

o dividir main-collection en sections/snippets adicionales si mejora mantenibilidad.

La página debe incluir únicamente elementos reales justificados por el sitio actual.

==================================================
3. COLLECTION HEADER / HERO
==================================================

Auditar si cada colección actual usa:
- title
- description
- cover image
- overlay
- image position X/Y
- zoom
- text alignment
- breadcrumb
- product count

El blueprint propuso:
Collection.custom.cover_image
Collection.custom.image_pos_x
Collection.custom.image_pos_y
Collection.custom.zoom
Collection.custom.description_tone

Puede preparar lectura de esos metafields SOLO si encaja con la arquitectura ya aprobada.

Debe haber fallbacks seguros si no existen metafields.

No exigir datos todavía no importados.

==================================================
4. TAXONOMÍA OBJETIVO
==================================================

Las colecciones objetivo son:

- Oasis Natural
- Aurora Viva
- Espuma de Ola
- Salidas de Baño

NO crear dependencia funcional de handles hardcodeados.

NO incluir como colecciones objetivo:
- Accesorios
- Hombre
- Mujer
- Niños
- Calzado

La template debe ser genérica y reusable para cualquier collection Shopify válida.

==================================================
5. PRODUCT GRID
==================================================

Usar:

snippets/product-card.liquid

NO duplicar markup de Product Card dentro de main-collection.

Implementar grid de productos con:
- responsive columns
- spacing equivalente al real
- pagination nativa Shopify si corresponde
- sold-out/sale states heredados del card
- correct image loading strategy

==================================================
6. SELECTOR DE COLUMNAS 2/3/4
==================================================

El blueprint identificó el selector 2/3/4 columnas como interacción custom real.

REAUDITAR su comportamiento exacto.

Si existe realmente:
implementarlo.

Preferencia:
- vanilla JS mínimo
- Custom Element o patrón simple
- CSS classes/data attributes
- persistencia SOLO si el sitio actual realmente persiste la preferencia

NO inventar localStorage si el actual no lo usa.

Debe:
- funcionar desktop según comportamiento real
- degradar bien en mobile
- ser accesible
- tener aria-pressed o semántica equivalente
- no duplicar listeners

==================================================
7. FILTERS
==================================================

Auditar filtros reales actuales.

IMPORTANTE:
Shopify normalmente expone filtros vía storefront/filter objects cuando Search & Discovery/facets están configurados.

Implementar SOLO la UI/lógica nativa posible con collection.filters si corresponde.

Soportar únicamente filtros reales relevantes, por ejemplo:
- talla
- color
- disponibilidad
- precio

PERO no inventar filtros que el sitio actual no tenga.

Si la disponibilidad real de filtros depende de Shopify Search & Discovery o de configuración futura:
- implementar arquitectura compatible
- documentar dependencia
- no instalar app todavía

==================================================
8. SORTING
==================================================

Si el catálogo actual tiene sorting:
replicarlo usando collection.sort_options / sort_by nativo.

No inventar opciones custom.

Preservar query params correctamente.

Debe funcionar sin JS cuando sea razonable o usar JS mínimo para auto-submit si replica mejor UX.

==================================================
9. MOBILE FILTER DRAWER
==================================================

Si el sitio actual usa drawer/modal mobile:
replicarlo con vanilla JS/Custom Element.

Requisitos:
- open/close
- Escape
- overlay
- focus trap
- return focus
- body scroll lock
- aria-expanded
- aria-controls
- reduced-motion
- apply/reset behavior coherente con Shopify filters

No instalar librerías.

==================================================
10. DESKTOP FILTER UX
==================================================

Auditar si filtros son:
- sidebar
- toolbar
- dropdowns
- chips

Replicar estructura real.

No crear sidebar si no existe.

==================================================
11. ACTIVE FILTERS
==================================================

Si collection.filters lo permite:
mostrar filtros activos/chips y reset claro.

No duplicar parámetros manualmente.

URLs deben generarse usando objetos/filtros nativos de Shopify.

==================================================
12. PRODUCT COUNT
==================================================

Mostrar count si existe actualmente.

Usar collection.products_count / resultados filtrados según objeto disponible.

No inventar conteos.

==================================================
13. PAGINATION
==================================================

Auditar si el sitio actual usa:
- pagination
- load more
- infinite scroll

Elegir la estrategia más fiel que sea mantenible en Shopify.

Preferencia por paginate nativo si no existe una razón fuerte para JS.

Si el real usa infinite/load-more y replicarlo exige complejidad alta:
documentar tradeoff y usar la aproximación más segura sin sobreingeniería.

NO instalar librerías.

==================================================
14. EMPTY STATES
==================================================

Implementar:
- colección sin productos
- filtros sin resultados
- estado normal

Con copy accesible y consistente.

No inventar promociones.

==================================================
15. QUICK VIEW
==================================================

El Product Card real auditado tenía hook/vista rápida.

02G NO debe construir Product Page ni modal complejo si eso pertenece a otra fase.

Puedes:
- dejar trigger/hook preparado
- ocultarlo/inert si no puede funcionar correctamente aún
- documentar dependencia

NO construir un mini-PDP completo dentro de 02G.

==================================================
16. WISHLIST
==================================================

Sigue NO decidida.

Mantener heart placeholder inerte.

NO:
- localStorage
- app
- metafield writes
- customer dependency

==================================================
17. SEO / SEMANTICS
==================================================

Asegurar:
- H1 collection.title
- description semántica
- links reales a product.url
- pagination crawlable
- no hidden SEO text artificial
- canonical gestionado por theme.liquid
- headings coherentes
- alt text correcto

No crear JSON-LD extra si no está justificado.

==================================================
18. ACCESSIBILITY
==================================================

Validar:
- heading hierarchy
- filter labels
- fieldset/legend cuando aplique
- sort label
- keyboard
- focus-visible
- drawer focus trap
- close on Escape
- button labels
- aria-expanded
- aria-pressed grid selector
- active filter announcements si aplica
- contrast
- tap targets

==================================================
19. RESPONSIVE
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
- collection hero
- filter toolbar
- mobile drawer
- product grid
- 2/3/4 selector
- product card
- pagination
- chips
- title/description wrapping
- no horizontal overflow

==================================================
20. PERFORMANCE
==================================================

Collection puede renderizar muchas cards.

Objetivo:
- Liquid server-rendered
- Product Card ligero
- JS mínimo
- sin listeners por card
- imágenes responsive
- lazy loading fuera de primera fila
- primera fila con estrategia razonable
- no DOM duplicado para mobile/desktop si se puede evitar
- no librerías externas

Registrar:
- CSS nuevo aproximado
- JS nuevo aproximado
- cantidad de productos por página elegida y motivo

==================================================
21. THEME EDITOR
==================================================

Permitir settings razonables para:
- show description
- show collection image
- enable filters
- enable sorting
- products per page
- default grid columns si aplica

Solo si estas opciones tienen sentido.

No crear decenas de toggles.

==================================================
22. METAFIELDS
==================================================

Puede soportar los metafields aprobados del blueprint:
- custom.cover_image
- custom.image_pos_x
- custom.image_pos_y
- custom.zoom
- custom.description_tone

Pero:
- fallbacks obligatorios
- no hard dependency
- no crear datos fake
- no crear metafields en Shopify Admin todavía

Documentar namespace/key y fallback.

==================================================
23. DOCUMENTACIÓN
==================================================

Crear:

shopify-migration/theme/collection-report.md

Documentar:
- collection actual auditada
- layout real
- hero
- grid
- filters
- sorting
- mobile UX
- selector 2/3/4
- pagination
- empty states
- metafields
- Product Card integration
- accessibility
- performance
- diferencias inevitables
- future dependencies
- fidelity estimate

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

Validar además:
- JSON
- Liquid
- section schema
- settings IDs
- locale keys
- snippets
- asset refs
- JS syntax
- query params
- no nested anchors
- no duplicate IDs
- no orphan snippets
- collection template references

==================================================
25. PORTABILITY / SECRET SCAN
==================================================

Buscar:
- secrets
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
26. LÍMITES DE FASE
==================================================

NO construir:
- Product Page
- Cart
- wishlist funcional
- Customer Accounts
- Checkout
- Wompi
- Search autocomplete
- Shopify Store
- Development Store

NO tocar:
- Production
- Staging
- main
- Vercel
- Neon
- DNS

==================================================
27. HANDOFF OBLIGATORIO AL TERMINAR 02G
==================================================

Al terminar 02G:

1. actualizar:
ai-handoff/claude-result.md

2. crear:
ai-handoff/archive/02G-result.md

3. actualizar status.md EXACTAMENTE a:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 02G
CURRENT_PHASE: WAITING_FOR_MODEL_SWITCH
NEXT_PHASE: 02H
CURRENT_MODEL: SONNET 5 ULTRACODE
STOP_AFTER_PHASE: 02G
NEXT_MODEL: OPUS 5.5 ULTRACODE
STATUS: WAITING_FOR_MODEL_SWITCH_TO_OPUS

4. push SOLO de handoff a:
origin/ai-handoff

5. NO push de código funcional Shopify a ai-handoff.
6. NO push a main.

7. Activar a ChatGPT enviando:

HANDOFF READY 02G

==================================================
28. STOP ABSOLUTO DESPUÉS DE 02G
==================================================

Después de publicar 02G y enviar HANDOFF READY 02G:

DETENTE.

NO ejecutar 02H.
NO leer/usar un prompt viejo de 02H.
NO generar Product Page.
NO cambiar modelo automáticamente.
NO asumir autorización.

Daniela debe intervenir manualmente para cambiar:

SONNET 5 ULTRACODE
→ OPUS 5.5 ULTRACODE

Solo después de ese cambio se podrá iniciar 02H.

==================================================
29. INFORME FINAL
==================================================

claude-result.md debe incluir:

1. Collection actual reauditada: YES/NO
2. rutas/componentes fuente auditados
3. collection header/hero implementado
4. collection image/metafield strategy
5. description strategy
6. Product Card integration PASS/FAIL
7. product grid implementation
8. grid selector 2/3/4 status
9. filters status
10. filters dependency notes
11. sorting status
12. mobile filter drawer status
13. active filters status
14. product count status
15. pagination/load-more strategy
16. empty states
17. quick-view hook status
18. wishlist placeholder status
19. metafields supported
20. Theme Editor settings
21. desktop responsive PASS/FAIL
22. mobile responsive PASS/FAIL
23. 320px safety
24. accessibility PASS/FAIL
25. keyboard PASS/FAIL
26. focus management PASS/FAIL
27. reduced-motion PASS/FAIL
28. estimated visual fidelity
29. CSS añadido
30. JS añadido
31. performance notes
32. products per page
33. Theme Check errors
34. Theme Check warnings
35. JSON validation
36. Liquid validation
37. nested anchors check
38. secrets: 0
39. store-specific IDs/domains: 0
40. Next/React refs funcionales: 0
41. Production tocada: NO
42. Staging tocado: NO
43. Shopify Store creada: NO
44. Deploy: NO
45. Push main: NO
46. READY FOR MODEL SWITCH TO OPUS: YES/NO
47. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

Después:
HANDOFF READY 02G
y STOP.

==================================================
BACKGROUND RULE
==================================================

NO watchers detached.
NO long sleeps.
NO background tasks que sobrevivan a la sesión.

Durante 02G trabaja normalmente.
Después de 02G NO hagas polling esperando 02H.
Debe quedar detenido en WAITING_FOR_MODEL_SWITCH_TO_OPUS.
