# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_02E

PHASE: 02E — HOME
MODEL: SONNET 5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 02E — HOME

CONTEXTO

La Fase 02D — Footer terminó correctamente y fue revisada por ChatGPT.

Resultado verificado en origin/ai-handoff:
- Footer implementado: YES
- Menús configurables: YES
- Logo configurable: YES
- Contacto configurable: YES
- Social configurable: YES
- Newsletter opcional con patrón nativo Shopify
- Copyright dinámico: YES
- Desktop responsive: PASS
- Mobile responsive: PASS
- 320px safety: PASS
- Accessibility: PASS
- Keyboard: PASS
- Contrast: PASS
- Theme Check: 0 errors / 0 warnings
- JSON validation: PASS
- Liquid validation: PASS
- Secrets: 0
- Store-specific IDs/domains: 0
- Production NO tocada
- Staging NO tocado
- Shopify Store NO creada
- Deploy NO
- Push main NO

OBJETIVO DE 02E

Construir la HOME REAL del futuro theme Shopify de Radaelli Swimwear con alta fidelidad visual respecto a la home actual, manteniendo portabilidad, Theme Editor configurability, performance y accesibilidad.

Esta fase debe construir la Home real, PERO no debe adelantar:
- Product Card definitivo de 02F salvo foundation mínima necesaria
- Collection Page de 02G
- Product Page de 02H
- Cart de 02I
- Search autocomplete
- Wishlist funcional
- Customer Accounts
- Checkout
- Wompi
- Apps

==================================================
1. REAUDITAR LA HOME ACTUAL
==================================================

Antes de implementar, inspecciona directamente la Home real actual y sus componentes.

NO dependas únicamente del blueprint previo.

Auditar:
- app/page.tsx o ruta real equivalente
- componentes importados por la Home
- Hero
- video/imágenes
- secciones editoriales
- colecciones
- carruseles
- productos destacados
- textos
- CTAs
- newsletter
- social proof si existe
- Instagram/social section si existe
- banners
- orden exacto de secciones
- fondos
- overlays
- alturas
- aspect ratios
- animaciones
- comportamiento responsive
- desktop/mobile differences
- lazy loading
- preload/prioridad de Hero
- cualquier interacción custom

Documentar cualquier diferencia entre:
- código real actual
- storefront-blueprint.md
- implementation-roadmap.md

Si existe conflicto:
el código real actual es la fuente visual/funcional prioritaria.

==================================================
2. INVENTARIO DE SECCIONES
==================================================

Antes de codificar, generar un inventario de la Home actual:

Para cada sección:
- nombre
- propósito
- contenido
- datos dinámicos
- assets
- desktop behavior
- mobile behavior
- interacción
- dificultad de migración
- equivalente Shopify propuesto

No inventar secciones nuevas.

==================================================
3. ARQUITECTURA ONLINE STORE 2.0
==================================================

Convertir la Home en sections reales y reordenables.

Preferir varias sections pequeñas y administrables en vez de un único bloque gigante.

Crear únicamente las sections que realmente correspondan a la Home actual.

Ejemplos posibles, SOLO si existen realmente:
- hero
- featured collection
- editorial banner
- collection cards
- image-with-text
- newsletter
- rich text
- featured products
- video banner

NO crear secciones hipotéticas que no existan.

Actualizar:
templates/index.json

para que represente la Home real en orden equivalente.

==================================================
4. HERO
==================================================

Reproducir el Hero actual con alta fidelidad.

Auditar si usa:
- video
- imagen
- video desktop/mobile diferente
- fallback image
- overlay
- heading
- subheading
- CTA
- múltiples CTAs
- position/alignment
- content max width
- object-position
- altura fija/min-height
- animations

Implementar settings controlados para lo realmente editable.

Prioridad:
- LCP
- performance
- responsive
- legibilidad del texto
- autoplay seguro si usa video
- muted / playsinline si corresponde
- poster/fallback
- prefers-reduced-motion

NO inventar carrusel Hero si no existe.

==================================================
5. ASSETS REALES
==================================================

Reutilizar conceptualmente los assets reales ya auditados.

NO hardcodear URLs externas cuando se pueda usar image_picker/video settings.

NO depender de Cloudinary SDK.

Si algunos assets todavía no existen dentro de Shopify:
- usar settings/image_picker
- dejar fallback estructural
- documentar exactamente qué asset deberá cargarse después

No subir imágenes a Shopify todavía.

==================================================
6. COLECCIONES EN HOME
==================================================

La taxonomía objetivo futura es:

- Oasis Natural
- Aurora Viva
- Espuma de Ola
- Salidas de Baño

NO introducir:
- Accesorios
- Hombre
- Mujer
- Niños
- Calzado

PERO:
no hardcodear handles como dependencia funcional.

Usar:
collection picker
o settings compatibles con Theme Editor.

Si la Home actual solo muestra algunas colecciones:
replicar únicamente esas.

==================================================
7. PRODUCTOS DESTACADOS
==================================================

Si la Home actual muestra productos:
crear una implementación suficiente para 02E SIN construir todavía el Product Card definitivo de 02F.

Puede reutilizar:
product-card-placeholder
o evolucionarlo mínimamente SOLO si es necesario para que Home sea funcional.

NO cerrar decisiones visuales del Product Card que pertenecen a 02F.

Dejar claramente documentado qué será reemplazado/refinado en 02F.

==================================================
8. BLOQUES EDITORIALES
==================================================

Para cada bloque editorial real:
- imagen/video
- eyebrow
- heading
- body
- CTA
- alignment
- overlay
- object position
- responsive behavior

Convertir contenido habitual a settings/blocks.

NO hacer todo editable si destruye consistencia de marca.

==================================================
9. NEWSLETTER DE HOME
==================================================

El reporte 02D confirmó que el newsletter actual vive fuera del Footer, en Home.

Por tanto:
REAUDITAR ese newsletter real.

Si existe actualmente:
implementarlo en esta fase.

Preferir:
{% form 'customer' %}

si encaja con el comportamiento real y Shopify estándar.

NO:
- Klaviyo
- Mailchimp
- Resend
- apps
- backend custom

Mantener:
- copy
- estructura visual
- estados básicos
- accesibilidad

==================================================
10. CARRUSELES / SLIDERS
==================================================

Si la Home real tiene carruseles:
replicar solo los que realmente existen.

Preferencia:
- CSS scroll snap
- vanilla JS mínimo
- Web Component si hace falta

NO instalar Swiper/Slick/u otra librería.

Requisitos:
- touch
- keyboard cuando corresponda
- reduced-motion
- no layout shift
- controles accesibles

==================================================
11. ANIMACIONES
==================================================

La web actual usa Framer Motion en algunos puntos.

NO migrar Framer Motion.

Para animaciones reales de Home:
usar CSS/IntersectionObserver/vanilla JS solamente si son necesarias para fidelidad.

NO sacrificar performance por animaciones.

Si alguna animación no puede reproducirse 1:1 sin sobreingeniería:
replicar la sensación, no el framework.

Documentar diferencias.

==================================================
12. RESPONSIVE
==================================================

Construir mobile-first.

Validar estructuralmente:
- 320
- 375
- 390
- 430
- 640
- 768
- 1024
- 1280
- 1440

Revisar especialmente:
- Hero
- crop
- text overlays
- CTA wrapping
- grids
- carruseles
- newsletter
- spacing vertical
- overflow horizontal

==================================================
13. PERFORMANCE
==================================================

Mantener presupuesto estricto.

Objetivos:
- Hero optimizado para LCP
- imágenes responsive con image_url/image_tag
- width/height o aspect-ratio para evitar CLS
- lazy loading fuera del primer viewport
- no JS innecesario
- no librerías externas
- no hydration framework
- preload/preconnect solo si realmente aplica
- videos con estrategia eficiente

Registrar:
- CSS nuevo aproximado
- JS nuevo aproximado
- número de sections nuevas

==================================================
14. ACCESSIBILITY
==================================================

Validar:
- heading hierarchy
- alt text
- CTA labels
- keyboard
- focus-visible
- carousel controls si existen
- contrast
- overlays
- reduced-motion
- form labels
- error/success state del newsletter
- tap targets

No esconder información crítica solo en hover.

==================================================
15. THEME EDITOR EXPERIENCE
==================================================

Daniela debe poder cambiar sin código lo que tenga sentido:

- hero media
- heading/subheading
- CTA text/link
- collection selectors
- editorial images/text
- newsletter text
- section ordering

No permitir una personalización ilimitada que rompa identidad.

==================================================
16. SEO
==================================================

No cambiar estrategia SEO global todavía.

Asegurar:
- un solo H1 útil en Home salvo que el código/arquitectura actual justifique otra cosa
- headings semánticos
- links crawlable
- imágenes con alt
- no texto importante solo en background-image
- no schema inventado

Si la Home actual incluye structured data específico:
documentarlo antes de migrarlo.

==================================================
17. NO HARDCODEAR
==================================================

No hardcodear:
- dominios
- store IDs
- theme IDs
- product IDs
- collection handles como dependencia obligatoria
- emails
- teléfonos
- social handles
- Cloudinary SDK URLs fijas salvo fallback temporal documentado
- secrets

==================================================
18. ARCHIVOS
==================================================

Crear/actualizar solo lo necesario dentro del theme Shopify aislado.

Preferencia para CSS:
assets/section-<nombre>.css
o archivos agrupados por section si mejora mantenibilidad.

Preferencia para JS:
assets/<interaction>.js
solo cuando exista interacción real.

No inflar theme.js.

==================================================
19. DOCUMENTACIÓN
==================================================

Crear:

shopify-migration/theme/home-report.md

Debe incluir:
- Home actual auditada
- orden real de secciones
- sections Shopify creadas
- assets requeridos
- settings/blocks
- diferencias visuales inevitables
- animations mapping
- responsive
- accessibility
- performance
- dependencias futuras con 02F
- fidelity estimate

Actualizar:
shopify-migration/theme-src/README.md

==================================================
20. VALIDACIÓN OFFLINE
==================================================

Ejecutar:

npx @shopify/cli theme check

Objetivo:
0 errors
0 warnings

Validar:
- JSON
- Liquid
- section schema
- settings IDs
- locale keys
- snippets
- asset references
- JS syntax
- no broken template refs

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

Resultado funcional esperado:
0.

==================================================
22. LÍMITES DE FASE
==================================================

NO construir todavía:
- Product Card definitivo (02F)
- Collection Page (02G)
- Product Page (02H)
- Cart (02I)
- Search autocomplete
- Wishlist
- Customer Accounts
- Checkout
- Wompi
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
23. HANDOFF OBLIGATORIO
==================================================

Al terminar 02E:

1. actualizar:
ai-handoff/claude-result.md

2. crear:
ai-handoff/archive/02E-result.md

3. actualizar status.md a:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 02E
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 02F
CURRENT_MODEL: SONNET 5 ULTRACODE
STOP_AFTER_PHASE: 02G
NEXT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

4. push SOLO de handoff a:
origin/ai-handoff

5. NO push de código funcional Shopify a ai-handoff.
6. NO push a main.
7. Activar inmediatamente a ChatGPT enviando en la misma conversación:

HANDOFF READY 02E

No pegar el informe completo en el chat.

==================================================
24. INFORME FINAL
==================================================

claude-result.md debe incluir:

1. Home actual reauditada: YES/NO
2. número de secciones reales encontradas
3. número de sections Shopify creadas
4. orden de sections
5. Hero implementado: YES/NO
6. Hero media strategy
7. collection sections implementadas
8. editorial sections implementadas
9. newsletter Home status
10. carruseles/sliders status
11. animations mapping
12. Product Card provisional dependency
13. Theme Editor configurability
14. desktop responsive PASS/FAIL
15. mobile responsive PASS/FAIL
16. 320px safety
17. accessibility PASS/FAIL
18. keyboard PASS/FAIL
19. reduced motion PASS/FAIL
20. estimated visual fidelity
21. CSS añadido
22. JS añadido
23. performance notes
24. Theme Check errors
25. Theme Check warnings
26. JSON validation
27. Liquid validation
28. secrets: 0
29. store-specific IDs/domains: 0
30. Next/React refs funcionales: 0
31. Production tocada: NO
32. Staging tocado: NO
33. Shopify Store creada: NO
34. Deploy: NO
35. Push main: NO
36. READY FOR PHASE 02F — PRODUCT CARD: YES/NO
37. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

Después DETENTE.

==================================================
BACKGROUND TASK RULE
==================================================

NO watchers.
NO loops.
NO long sleeps.
NO background monitoring.

CERO TAREAS DE SEGUNDO PLANO ACTIVAS.
