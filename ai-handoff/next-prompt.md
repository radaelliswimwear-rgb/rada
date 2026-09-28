# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_02H

PHASE: 02H — PRODUCT PAGE
MODEL: OPUS 5.5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 02H — PRODUCT PAGE (PDP)

IMPORTANTE — CHECKPOINT DE MODELO

Daniela ya cambió manualmente el modelo.

ANTES DE EMPEZAR:
verifica que esta sesión esté realmente ejecutándose con:

OPUS 5.5 ULTRACODE

Si NO puedes confirmarlo visualmente desde la interfaz:
NO inventes confirmación.

Escribe:
MODEL CONFIRMATION UNAVAILABLE

y continúa SOLO si la interfaz/entorno ya muestra claramente Opus 5.5 Ultracode.

Esta fase es además una PRUEBA DEL MODELO.

Al final debes reportar:
- modelo usado;
- duración aproximada de la fase;
- consumo/uso mostrado por la interfaz, SOLO si es visible;
- si el consumo exacto no es visible: decir UNAVAILABLE;
- número de correcciones/reintentos importantes;
- si Opus aportó alguna mejora técnica detectable frente al trabajo previo de Sonnet.

NO inventar métricas de tokens ni porcentajes.

==================================================
CONTEXTO
==================================================

Completado:

02 — Theme Architecture & Storefront Blueprint
02A — Theme Skeleton
02B — Global Styles
02C — Header & Navigation
02D — Footer
02E — Home
02F — Product Card
02G — Collection Page

Estado confirmado al cerrar 02G:

- Product Card definitivo reusable
- Collection Page real implementada
- filtros nativos
- sorting nativo
- selector grid 2/3/4
- mobile filter drawer
- metafields de collection preparados
- responsive PASS
- accessibility PASS
- Theme Check 0 errores / 0 warnings
- Production NO tocada
- Staging NO tocado
- Shopify Store NO creada
- Deploy NO
- Push main NO

Esta Fase 02H es deliberadamente una de las fases más complejas.

OBJETIVO:

Construir la PRODUCT DETAIL PAGE (PDP) real del futuro theme Shopify de Radaelli Swimwear con la máxima fidelidad razonable respecto a la web actual, usando Liquid + Shopify objects + vanilla JS/Web Components.

La PDP debe cubrir:

- galería real desktop/mobile;
- media principal;
- thumbnails;
- variantes;
- talla;
- color cuando corresponda;
- disponibilidad;
- precio;
- compare-at;
- badges;
- quantity;
- add to cart;
- estados sold-out/unavailable;
- size guide;
- detalles de producto;
- beneficios/información;
- lightbox;
- zoom;
- pinch zoom si es viable de forma robusta;
- sticky behavior si existe;
- recomendaciones relacionadas si existen;
- accesibilidad;
- responsive;
- performance;
- Theme Editor configurability.

NO construir todavía:
- Cart Drawer completo / Cart AJAX completo de 02I
- Customer Accounts
- Wishlist funcional
- Search autocomplete
- Checkout
- Wompi
- Shopify Store
- Development Store

==================================================
1. REAUDITORÍA OBLIGATORIA DE LA PDP REAL
==================================================

ANTES DE CODIFICAR:

Inspecciona directamente la implementación REAL actual.

Buscar y auditar:
- ruta product/PDP real;
- componentes importados;
- gallery;
- thumbnails;
- lightbox;
- zoom;
- pinch zoom;
- variant selector;
- size selector;
- color selector;
- availability logic;
- inventory display;
- price;
- compare-at/discount;
- quantity;
- add-to-cart;
- sticky info/CTA;
- size guide;
- description/details;
- benefits;
- shipping info;
- accordions;
- recommendations;
- product analytics hooks;
- responsive differences;
- animations;
- loading states;
- error states;
- accessibility behavior.

NO depender solo del blueprint.

Documentar divergencias entre:
- código actual real;
- storefront-blueprint.md;
- interaction-map.md;
- data-architecture.md;
- implementation-roadmap.md.

Si existe conflicto:
el código actual real es fuente prioritaria.

==================================================
2. ESTRUCTURA DE LA PDP
==================================================

Actualizar:

templates/product.json
sections/main-product.liquid

Puede crear snippets/sections auxiliares cuando aporten mantenibilidad.

Preferencia:
- main-product como orquestador;
- snippets especializados para gallery/media/variants/price/size guide/etc.;
- JS modular y por responsabilidad;
- CSS modular.

Evitar un único archivo Liquid gigantesco.

==================================================
3. PRODUCT OBJECT / VARIANTS
==================================================

Usar objetos nativos Shopify.

Soportar correctamente:
- product
- product.selected_or_first_available_variant
- product.options_with_values
- variant.available
- variant.price
- variant.compare_at_price
- variant.featured_media
- variant.id
- product.media
- product.metafields cuando estén definidos

NO hardcodear:
- product IDs;
- variant IDs;
- handles;
- tallas;
- colores;
- stock;
- precios.

==================================================
4. SELECTOR DE TALLAS
==================================================

Reauditar comportamiento real.

Implementar:
- tallas disponibles;
- tallas no disponibles;
- estado seleccionado;
- labels accesibles;
- actualización de variant;
- add-to-cart disabled si combinación no disponible.

Si Shopify options usan nombres diferentes:
no asumir siempre "Talla".
Detectar option position/name de forma robusta.

No convertir opciones de color en talla ni viceversa.

==================================================
5. COLOR / VARIANT OPTIONS
==================================================

Auditar si la PDP real presenta:
- color text;
- swatches;
- links entre productos-color;
- option selector nativo;
- metafield custom.color.

No inventar swatches si el diseño real hoy usa texto.

Usar:
Product.custom.color
solo como soporte/fallback si ya fue aprobado en data architecture.

No crear dependencia dura.

==================================================
6. VARIANT CHANGE ARCHITECTURE
==================================================

Implementar un Custom Element o módulo equivalente para manejar:

- selección options;
- resolver variant;
- actualizar variant ID;
- price;
- compare-at;
- availability;
- add-to-cart state;
- selected media;
- URL variant query cuando corresponda;
- accessible status messages.

No usar React.
No usar framework.
No usar Storefront API si Liquid/product JSON embebido basta.

Evitar duplicar todo el product JSON innecesariamente.

==================================================
7. PRICE
==================================================

Reutilizar patrones de price existentes cuando sea posible.

Debe actualizarse al cambiar variant.

Soportar:
- regular price;
- compare-at;
- sale state;
- money formatting;
- price range SOLO donde sea necesario antes de elegir variante.

No traer la cascada custom de descuentos del backend Next si Shopify no la representa nativamente.

Documentar diferencias comerciales.

==================================================
8. AVAILABILITY / STOCK
==================================================

Mostrar únicamente información fiable.

Usar:
variant.available

NO mostrar cantidad exacta de stock si Shopify no la expone/configura de forma segura.

No inventar mensajes como "quedan 2" si no hay dato real.

Si el diseño actual tiene low-stock messaging basado en cantidad:
documentar como dependencia futura en vez de falsificarlo.

==================================================
9. ADD TO CART
==================================================

02H debe implementar add-to-cart funcional estándar Shopify para PDP.

Preferencia:
- form 'product'
- variant ID correcto
- quantity
- accessible submit
- estados available/sold out

IMPORTANTE:
NO construir todavía el Cart Drawer completo de 02I.

Después de add-to-cart:
usar el comportamiento mínimo/estándar compatible con la arquitectura actual.

Puede:
- enviar al cart
o
- dejar hook preparado para 02I

Elegir según el comportamiento real y documentar.

NO construir el flujo AJAX final de carrito si pertenece a 02I.

==================================================
10. QUANTITY
==================================================

Si existe en la PDP real:
implementar.

Requisitos:
- min 1
- botones +/- accesibles
- input numérico
- keyboard
- no valores inválidos
- tap targets adecuados.

Si NO existe:
no inventarlo.

==================================================
11. PRODUCT MEDIA GALLERY
==================================================

Construir galería real con:
- images
- Shopify video si existe
- external video si Shopify object lo soporta
- model media si aplica, sin romper
- media principal
- thumbnails
- selección de media
- variant featured media sync

No asumir solo imágenes.

==================================================
12. DESKTOP GALLERY
==================================================

Replicar layout real:
- grid/carousel según actual;
- thumbnails position;
- image ratio;
- spacing;
- max heights;
- sticky behavior si existe.

No inventar layout editorial distinto.

==================================================
13. MOBILE GALLERY
==================================================

Reauditar si usa:
- horizontal swipe;
- dots;
- thumbnails;
- snap;
- arrows.

Implementar mobile-first con:
- touch;
- scroll snap o JS ligero;
- no bloqueo del scroll vertical;
- accesibilidad;
- indicators correctos.

==================================================
14. LIGHTBOX
==================================================

Esta interacción fue clasificada HARD.

Implementar un ProductLightbox real y robusto.

Requisitos mínimos:
- abrir media seleccionada;
- cerrar con botón;
- Escape;
- overlay;
- focus trap;
- return focus;
- next/previous;
- keyboard;
- mobile-safe;
- no body scroll;
- aria-modal/role dialog;
- reduced-motion.

No usar librerías externas salvo que exista una razón crítica y documentada.
Preferencia: vanilla JS / Web Component.

==================================================
15. ZOOM
==================================================

Reauditar el zoom real.

Objetivo:
replicar la experiencia, no necesariamente la implementación técnica.

Desktop:
- zoom/magnifier o click-to-zoom según actual.

Mobile:
- pinch zoom si puede implementarse de forma robusta y mantenible.

IMPORTANTE:
NO introducir una solución frágil solo para decir que existe pinch zoom.

Si pinch zoom nativo/Pointer Events resulta robusto:
implementar.

Si no:
implementar una degradación segura, documentar limitación y preservar lightbox/pan.

Debes probar:
- pointer interactions;
- double tap si se usa;
- bounds;
- reset;
- no bloquear navegación;
- reduced motion.

==================================================
16. SIZE GUIDE
==================================================

Blueprint aprobado:
Metaobject "Size Guide".

Actualmente existe una guía sitewide basada en imagen/texto.

En esta fase:
crear arquitectura de theme compatible con:
- metaobject futuro si es razonable;
- fallback a section/theme setting;
- imagen + texto.

NO crear metaobject real en Shopify Admin todavía.

La PDP debe poder abrir guía de talla accesible:
- modal o disclosure según comportamiento real;
- keyboard;
- Escape;
- focus management.

==================================================
17. DESCRIPTION / DETAILS
==================================================

Auditar contenido real:
- description;
- materials;
- care;
- shipping;
- fit;
- benefits;
- accordions.

Usar:
product.description
y metafields solo cuando estén definidos/aprobados.

No inventar contenido comercial.

==================================================
18. ACCORDIONS / DETAILS
==================================================

Si existen actualmente:
replicar.

Preferencia:
native <details>/<summary> cuando la fidelidad lo permita.

No usar JS si HTML nativo basta.

==================================================
19. STICKY PRODUCT INFO / CTA
==================================================

Auditar si desktop/mobile usan sticky information panel o sticky CTA.

Si existe:
replicar.

Si no:
NO inventarlo.

Asegurar que no choque con:
- header sticky;
- mobile viewport;
- safe areas;
- footer.

==================================================
20. PRODUCT RECOMMENDATIONS
==================================================

Auditar si PDP real tiene:
- relacionados;
- "También te puede gustar";
- colección relacionada.

Si existe:
crear section compatible con Shopify recommendation architecture o collection fallback.

NO instalar Search & Discovery adicional ni Storefront API custom en esta fase.

Si recommendations requieren endpoint Shopify y JS:
puede preparar arquitectura, pero no sobreconstruir.

Reutilizar:
snippets/product-card.liquid

NO duplicar card markup.

==================================================
21. WISHLIST
==================================================

Sigue NO decidida.

En PDP:
puede existir heart/button placeholder/hook.

NO:
- localStorage;
- metafields write;
- app;
- customer account dependency.

==================================================
22. PRODUCT URL / VARIANT URL
==================================================

Al cambiar variante:
si el comportamiento actual y Shopify best practice lo justifican,
actualizar query:
?variant=<id>

Usar history.replaceState, no navegación completa.

No romper back button.

==================================================
23. MEDIA + VARIANT SYNC
==================================================

Si una variante tiene featured_media:
al seleccionarla, mover la galería a ese media.

Debe funcionar:
- desktop;
- mobile;
- lightbox.

Evitar jumps/layout shift excesivos.

==================================================
24. FORM ERROR HANDLING
==================================================

Preparar estados:
- no variant selected;
- variant unavailable;
- add-to-cart error estándar;
- loading state;
- success state mínimo si no redirige.

No construir toasts globales complejos si pertenecen a 02I.

==================================================
25. ACCESSIBILITY
==================================================

Validar específicamente:
- heading hierarchy;
- product title H1;
- labels;
- option groups;
- radio semantics;
- disabled/unavailable states;
- live regions para price/availability;
- gallery controls;
- thumbnail labels;
- lightbox;
- focus trap;
- return focus;
- Escape;
- size guide;
- keyboard;
- contrast;
- tap targets;
- reduced-motion.

No depender solo de color para disponibilidad.

==================================================
26. RESPONSIVE
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
- gallery;
- thumbnail overflow;
- product title;
- price;
- option selectors;
- size buttons;
- add-to-cart;
- sticky behavior;
- accordions;
- size guide;
- lightbox;
- zoom;
- recommendations;
- no horizontal overflow.

==================================================
27. PERFORMANCE
==================================================

PDP es crítica.

Objetivos:
- primary product media optimizada;
- image_url/image_tag;
- correct widths/srcset;
- priority/eager solo para media crítica;
- lazy loading secondary media;
- no cargar todos los full-res para lightbox si no hace falta;
- no framework;
- no jQuery;
- JS modular;
- event delegation cuando corresponda;
- no listeners duplicados;
- no massive product JSON;
- no layout thrashing.

Reportar:
- CSS nuevo aproximado;
- JS nuevo aproximado;
- mayor asset;
- media loading strategy.

==================================================
28. THEME EDITOR
==================================================

Permitir ajustes razonables, por ejemplo:
- show breadcrumbs;
- show size guide;
- show quantity;
- show compare-at;
- enable zoom;
- enable lightbox;
- enable sticky info si el comportamiento real lo justifica;
- show recommendations;
- recommendation heading.

No crear demasiados toggles.

==================================================
29. METAFIELDS / METAOBJECTS
==================================================

Reutilizar data architecture aprobada.

Product metafields:
- custom.color

Metaobject:
- Size Guide

Puede proponer otros metafields SOLO si encuentra una necesidad real en el código actual.

No crear campos arbitrarios.

Documentar:
namespace.key
tipo
fallback
si es required/optional.

==================================================
30. ANALYTICS HOOKS
==================================================

No implementar analytics real todavía.

Pero preservar data hooks razonables para:
- variant change;
- add to cart;
- gallery interaction;
- wishlist placeholder.

NO hardcodear GA/Meta IDs.

==================================================
31. CSS
==================================================

Preferencia:
- assets/section-product.css
- assets/component-product-gallery.css
- assets/component-product-lightbox.css
- assets/component-variant-picker.css

o estructura equivalente mantenible.

No meter cientos de líneas en base.css.

Usar tokens de 02B.

==================================================
32. JS
==================================================

Preferencia por módulos/Web Components separados:
- product-form.js
- product-variant-picker.js
- product-gallery.js
- product-lightbox.js
- product-zoom.js

SOLO si cada separación aporta claridad.

No crear 10 archivos triviales.

NO:
- React;
- Framer Motion;
- jQuery;
- Swiper;
- PhotoSwipe;
- librerías externas salvo justificación crítica.

==================================================
33. INTEGRACIÓN CON 02F / 02G
==================================================

No romper:
- product-card.liquid;
- Home;
- Collection;
- Header;
- Footer.

Recommendations si existen deben reutilizar product-card.

==================================================
34. DOCUMENTACIÓN
==================================================

Crear:

shopify-migration/theme/product-page-report.md

Debe incluir:
- componentes/rutas reales auditados;
- layout PDP real;
- gallery architecture;
- media types;
- variant architecture;
- size/color behavior;
- price;
- availability;
- add to cart;
- size guide;
- lightbox;
- zoom;
- pinch zoom result;
- sticky behavior;
- recommendations;
- metafields/metaobjects;
- accessibility;
- performance;
- divergencias inevitables;
- visual fidelity estimate;
- dependencias para 02I.

Actualizar:
shopify-migration/theme-src/README.md

==================================================
35. VALIDACIÓN OFFLINE
==================================================

Ejecutar:

npx @shopify/cli theme check

Objetivo:
0 errors
0 warnings

Validar además:
- JSON;
- Liquid;
- JS syntax;
- section schema;
- settings IDs;
- locale keys;
- asset refs;
- snippets;
- no orphan snippets;
- no nested anchors;
- product template refs;
- product form semantics;
- variant JSON integrity conceptual;
- no duplicate IDs;
- no obvious gallery/lightbox state bug.

==================================================
36. TESTS DE INTERACCIÓN OFFLINE
==================================================

Sin Shopify Store todavía, crear pruebas estructurales o harness local aislado si ayuda y no contamina la app principal.

Validar conceptualmente:
- selecting option resolves variant;
- unavailable combination disables CTA;
- variant change updates price;
- variant media sync;
- lightbox open/close;
- Escape;
- focus return;
- next/prev;
- zoom reset;
- reduced-motion;
- quantity bounds.

No instalar testing stack pesado solo para esta fase.

==================================================
37. SECRET / PORTABILITY SCAN
==================================================

Buscar:
- secrets;
- API keys;
- tokens;
- passwords;
- myshopify domains;
- store IDs;
- theme IDs;
- radaelliswimwear.com hardcodeado funcional;
- Next imports;
- React imports;
- Prisma;
- Neon;
- Wompi;
- Vercel;
- Cloudinary SDK dependency.

Resultado funcional esperado:
0.

==================================================
38. NO STORE TODAVÍA
==================================================

NO:
- Shopify Store;
- Development Store;
- login Shopify;
- app install;
- product import;
- real metafield creation;
- deploy.

==================================================
39. GIT / AISLAMIENTO
==================================================

Trabajar en el mismo worktree/branch Shopify aislado usado en 02A–02G.

NO:
- push main;
- merge;
- PR;
- rebase;
- reset;
- tocar Production;
- tocar Staging.

El handoff sigue en origin/ai-handoff y contiene SOLO archivos Markdown de coordinación.

==================================================
40. EVALUACIÓN DE OPUS 5.5 ULTRACODE
==================================================

Esta fase es una prueba controlada.

Al final reportar honestamente:

A. MODEL CONFIRMED:
OPUS 5.5 ULTRACODE / UNAVAILABLE

B. APPROX ELAPSED TIME:
si puedes medirlo desde la sesión.

C. RESOURCE/USAGE INDICATOR:
- valor exacto SOLO si la interfaz lo muestra;
- si no se muestra: UNAVAILABLE.

D. MAJOR SELF-CORRECTIONS:
cantidad aproximada y descripción breve.

E. OPUS VALUE OBSERVED:
describir hechos concretos, por ejemplo:
- detectó una divergencia no documentada;
- simplificó arquitectura;
- evitó una librería;
- encontró un bug;
- produjo mejor test coverage.

NO escribir:
"Opus fue mejor" sin evidencia concreta.

==================================================
41. HANDOFF AL TERMINAR
==================================================

Al terminar 02H:

1. actualizar:
ai-handoff/claude-result.md

2. crear:
ai-handoff/archive/02H-result.md

3. actualizar status.md a:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 02H
CURRENT_PHASE: WAITING_FOR_OPUS_EVALUATION
NEXT_PHASE: 02I
CURRENT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

4. push SOLO de archivos handoff a:
origin/ai-handoff

5. activar a ChatGPT enviando:

HANDOFF READY 02H

6. DETENERSE.

==================================================
42. NO AUTO-CONTINUAR A 02I
==================================================

MUY IMPORTANTE:

Después de 02H:
NO iniciar 02I automáticamente.

Queremos evaluar:
- calidad de Opus;
- consumo;
- velocidad;
- resultado de Product Page.

ChatGPT y Daniela decidirán si:
- mantener Opus para 02I;
- volver a Sonnet;
- ajustar estrategia.

Por eso:
HANDOFF READY 02H
y STOP.

==================================================
INFORME FINAL
==================================================

claude-result.md debe incluir:

1. model confirmed
2. approximate elapsed time
3. resource/usage indicator or UNAVAILABLE
4. PDP real reauditada YES/NO
5. rutas/componentes auditados
6. layout PDP implementado
7. product template/section architecture
8. variant picker status
9. size selector status
10. color selector behavior
11. price update status
12. compare-at status
13. availability status
14. quantity status
15. add-to-cart status
16. add-to-cart behavior destination/hook
17. media gallery status
18. media types supported
19. desktop gallery status
20. mobile gallery status
21. thumbnails status
22. variant media sync status
23. lightbox status
24. keyboard lightbox PASS/FAIL
25. focus management PASS/FAIL
26. zoom status
27. pinch zoom status
28. size guide status
29. description/details status
30. accordions status
31. sticky behavior status
32. recommendations status
33. wishlist placeholder status
34. metafields/metaobjects supported
35. Theme Editor settings
36. desktop responsive PASS/FAIL
37. mobile responsive PASS/FAIL
38. 320px safety
39. accessibility PASS/FAIL
40. keyboard PASS/FAIL
41. reduced-motion PASS/FAIL
42. estimated visual fidelity
43. CSS added
44. JS added
45. performance notes
46. Theme Check errors
47. Theme Check warnings
48. JSON validation
49. Liquid validation
50. JS validation
51. nested anchors check
52. secrets 0
53. store-specific IDs/domains 0
54. Next/React refs funcionales 0
55. Production touched NO
56. Staging touched NO
57. Shopify Store created NO
58. Deploy NO
59. Push main NO
60. major self-corrections
61. concrete Opus value observed
62. READY FOR OPUS EVALUATION YES/NO
63. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

Después:
HANDOFF READY 02H
y STOP.

==================================================
BACKGROUND RULE
==================================================

NO watchers detached.
NO loops permanentes.
NO long sleeps.
NO background tasks que sobrevivan la sesión.

Esta fase puede tardar lo necesario para hacer bien la PDP,
pero al finalizar debe haber:

CERO TAREAS DE SEGUNDO PLANO ACTIVAS.
