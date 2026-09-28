# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_02F

PHASE: 02F — PRODUCT CARD
MODEL: SONNET 5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 02F — PRODUCT CARD

CONTEXTO

La Fase 02E — Home terminó correctamente y fue revisada por ChatGPT.

Resultado confirmado:
- Home reauditada contra código real
- 7 secciones reales encontradas
- 7 Shopify sections creadas
- orden de secciones preservado
- Hero implementado
- newsletter Home implementado
- carruseles implementados con mecanismo compartido
- responsive PASS
- accessibility PASS
- keyboard PASS
- reduced-motion PASS
- estimated visual fidelity ~90–95%
- Theme Check: 0 errores / 0 warnings
- JSON PASS
- Liquid PASS
- 0 secrets
- 0 store-specific IDs/domains
- Production NO tocada
- Staging NO tocado
- Shopify Store NO creada
- Deploy NO
- Push main NO

Además:
- product-card-placeholder.liquid fue evolucionado mínimamente en 02E
- NO se cerraron todavía hover-swap/favoritos
- 02F debe convertir esa foundation en el PRODUCT CARD definitivo y reusable

OBJETIVO

Construir el Product Card definitivo del theme Shopify, con alta fidelidad al componente real actual de Radaelli y reutilizable en:
- Home
- Collection
- recomendaciones futuras
- búsquedas futuras

NO construir todavía:
- Collection Page completa (02G)
- Product Page (02H)
- Cart (02I)
- wishlist funcional real
- search autocomplete
- customer accounts

==================================================
1. REAUDITAR EL PRODUCT CARD REAL
==================================================

Antes de implementar, inspecciona directamente el componente real actual.

Auditar:
- componente exacto usado por catálogo/home
- estructura DOM/React
- primary image
- secondary image / hover swap
- aspect ratio
- object-fit / object-position
- badges
- price
- compare-at / discounts
- product title
- color text
- favorite/heart trigger
- hover behavior
- overlay
- mobile behavior
- click target
- sold-out state
- sale state
- featured/new state si existe
- quick action si existe
- lazy loading
- image sizes
- accessibility
- animation/transition
- spacing
- card width/height

NO asumir lo que hace el componente.
Priorizar código real actual.

==================================================
2. PRODUCT CARD DEFINITIVO
==================================================

Crear/convertir un snippet definitivo, preferencia:

snippets/product-card.liquid

Puede reemplazar gradualmente product-card-placeholder.liquid si es seguro.

Debe aceptar parámetros claros y documentados, por ejemplo:
- product
- show_secondary_image
- show_badges
- show_color
- show_wishlist_placeholder
- image_ratio
- lazy_load
- context

Evitar una firma excesivamente compleja.

==================================================
3. IMÁGENES
==================================================

Implementar correctamente:
- primary image
- secondary image SOLO si existe y si el comportamiento real lo usa
- hover swap desktop si existe actualmente
- fallback si falta media
- responsive image_url/image_tag
- widths/srcset
- width/height o aspect-ratio
- loading lazy salvo cards críticas sobre fold
- object-fit correcto
- no CLS

No depender de Cloudinary SDK.

==================================================
4. CARD LINK / CLICK AREA
==================================================

La tarjeta debe ser navegable y accesible.

Usar product.url nativo.

Evitar HTML inválido con links anidados.

Si el card actual tiene:
- imagen clicable
- título clicable
- heart separado

preservar interacción equivalente sin nested anchors.

==================================================
5. TITLE / COLOR / META
==================================================

Mostrar solo los datos realmente presentes en el diseño actual.

Auditar si el color se obtiene de:
- product option
- metafield futuro
- vendor/title
- texto derivado

No inventar lógica frágil.

Si Product.custom.color ya está propuesto:
puede preparar soporte seguro/fallback,
pero no exigir que exista todavía.

==================================================
6. PRICE
==================================================

Reutilizar/ajustar snippet price existente.

Soportar correctamente:
- precio regular
- compare_at_price
- sale
- rango de precios si variantes difieren, SOLO si aplica
- formato money de Shopify
- sold-out no debe confundirse con precio cero

NO implementar lógica de descuentos custom del backend actual fuera de lo que Shopify pueda representar de forma nativa en card.

Documentar cualquier diferencia.

==================================================
7. BADGES
==================================================

Auditar reglas reales.

Soportar solo las justificadas:
- Sale / descuento
- Sold out
- New / destacado SOLO si existe fuente real

No inventar reglas comerciales basadas en fecha si no existen.

Si un badge necesita metafield/collection/tag:
documentar fuente.

==================================================
8. WISHLIST PLACEHOLDER
==================================================

IMPORTANTE:
wishlist funcional sigue NO decidida.

El Product Card puede incluir:
- icono heart
- botón accesible
- data-wishlist-trigger
- product handle/id data attribute no sensible

Pero debe permanecer INERTE o claramente preparado para fase futura.

NO:
- localStorage
- metafields write
- app
- API
- customer account dependency

==================================================
9. HOVER / MOTION
==================================================

Replicar la sensación real con CSS cuando sea posible:
- secondary image swap
- image zoom leve
- overlay
- badge transitions

No usar Framer Motion.

Respetar prefers-reduced-motion.

Mobile no debe depender de hover para información crítica.

==================================================
10. RESPONSIVE
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
- título wrap
- precios
- badges
- heart
- image ratio
- card width
- gap
- touch targets
- no overflow

==================================================
11. ACCESSIBILITY
==================================================

Validar:
- link accessible name
- image alt
- heart button label
- aria-hidden en icons decorativos
- focus-visible
- keyboard
- sale/sold-out no solo por color
- contrast
- tap target >= 44px cuando corresponda

==================================================
12. PERFORMANCE
==================================================

Product Card aparecerá muchas veces.

Por tanto:
- no JS por card si CSS basta
- evitar listeners individuales
- no duplicar scripts
- no inline JS repetido
- imágenes responsivas
- snippets ligeros
- Liquid simple
- no N+1 conceptual por lógica redundante
- no renderizar markup oculto pesado innecesario

Registrar impacto aproximado.

==================================================
13. INTEGRAR EN HOME
==================================================

Reemplazar usos provisionales de product-card-placeholder por product-card definitivo donde corresponda.

Revalidar:
- featured-products
- recommended-products
- featured collection/editorial si usa cards
- carruseles

No cambiar el diseño general de 02E.

No duplicar card markup dentro de sections.

==================================================
14. PREPARAR PARA COLLECTION 02G
==================================================

El snippet debe poder reutilizarse en 02G sin cambios estructurales grandes.

Preparar parámetros suficientes para:
- grid collection
- sale/sold-out
- image loading strategy
- wishlist placeholder
- secondary image

Pero NO construir collection filtering/sorting todavía.

==================================================
15. CSS
==================================================

Preferencia:
refactorizar assets/component-card.css
y crear asset adicional solo si mejora claridad.

Eliminar estilos provisionales redundantes de 02E si ya quedan absorbidos.

No romper foundation global.

==================================================
16. JS
==================================================

Ideal:
0 JS nuevo.

Si el comportamiento real exige algo que CSS no puede resolver:
usar vanilla JS/Web Component mínimo y justificarlo.

NO implementar wishlist funcional.

==================================================
17. SHOPIFY EDITOR / SETTINGS
==================================================

Solo si realmente aporta valor global, considerar settings controlados:
- show secondary image
- show color
- show sale badge
- image ratio

Evitar que cada section duplique los mismos toggles si pueden centralizarse.

No sobreconfigurar.

==================================================
18. SEO / SEMANTICS
==================================================

Card debe:
- usar enlaces reales a product.url
- no generar heading hierarchy absurda
- evitar duplicar H1/H2 innecesariamente
- usar product.title textual
- no ocultar contenido esencial

==================================================
19. DOCUMENTACIÓN
==================================================

Crear:

shopify-migration/theme/product-card-report.md

Documentar:
- componente real auditado
- diferencias actuales
- snippet API
- image strategy
- hover strategy
- price behavior
- badge rules
- wishlist placeholder
- accessibility
- performance
- integration points
- dependencies for 02G/02H

Actualizar:
shopify-migration/theme-src/README.md

==================================================
20. VALIDACIÓN
==================================================

Ejecutar:

npx @shopify/cli theme check

Objetivo:
0 errors
0 warnings

Validar:
- JSON
- Liquid
- snippets
- asset refs
- locale keys
- no orphan snippets
- no duplicate IDs
- no broken renders en Home
- no nested anchors

==================================================
21. PORTABILITY / SECRET SCAN
==================================================

Buscar:
- secrets
- tokens
- passwords
- myshopify domains
- store IDs
- theme IDs
- radaelliswimwear.com hardcodeado funcional
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
22. LÍMITES DE FASE
==================================================

NO:
- Collection Page completa
- filtros/sorting
- Product Page
- Cart
- Search autocomplete
- Wishlist real
- Customer Accounts
- Checkout
- Wompi
- Shopify Store
- Development Store
- Production
- Staging
- main
- deploy

==================================================
23. HANDOFF OBLIGATORIO
==================================================

Al terminar 02F:

1. actualizar:
ai-handoff/claude-result.md

2. crear:
ai-handoff/archive/02F-result.md

3. actualizar status.md a:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 02F
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 02G
CURRENT_MODEL: SONNET 5 ULTRACODE
STOP_AFTER_PHASE: 02G
NEXT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

4. push SOLO de handoff a:
origin/ai-handoff

5. NO push de código funcional Shopify a ai-handoff.
6. NO push a main.

7. Activar inmediatamente a ChatGPT enviando:

HANDOFF READY 02F

8. Mantener ACTIVE CONTINUOUS MODE:
   revisar origin/ai-handoff/status.md y next-prompt.md cada 20–30 segundos
   hasta que ChatGPT deje READY_FOR_CLAUDE_02G.

9. En cuanto 02G quede lista:
   leer next-prompt.md y ejecutar 02G inmediatamente.

NO pedir autorización adicional a Daniela.

==================================================
24. INFORME FINAL
==================================================

claude-result.md debe incluir:

1. Product Card actual reauditado: YES/NO
2. snippet definitivo creado
3. placeholder reemplazado/eliminado status
4. primary image strategy
5. secondary image/hover status
6. card link semantics
7. title/color/meta behavior
8. regular price behavior
9. compare-at/sale behavior
10. sold-out behavior
11. badge rules
12. wishlist placeholder status
13. motion/reduced-motion
14. Home integration PASS/FAIL
15. reusable for 02G: YES/NO
16. desktop responsive PASS/FAIL
17. mobile responsive PASS/FAIL
18. 320px safety
19. accessibility PASS/FAIL
20. keyboard PASS/FAIL
21. contrast PASS/FAIL
22. JS nuevo
23. CSS impact
24. performance notes
25. Theme Check errors
26. Theme Check warnings
27. JSON validation
28. Liquid validation
29. nested anchors check
30. secrets: 0
31. store-specific IDs/domains: 0
32. Next/React refs funcionales: 0
33. Production tocada: NO
34. Staging tocado: NO
35. Shopify Store creada: NO
36. Deploy: NO
37. Push main: NO
38. READY FOR PHASE 02G — COLLECTION: YES/NO
39. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

Después continúa según ACTIVE CONTINUOUS MODE.

==================================================
BACKGROUND RULE
==================================================

NO watchers detached.
NO long sleeps.
NO background tasks que sobrevivan a la sesión.

El polling de handoff debe permanecer ligado a la sesión activa de Claude.
