# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03B

==================================================
AUTONOMY OVERRIDE — HIGHEST PRIORITY
==================================================

Daniela explicitly does NOT want to act as operator for routine Shopify Admin work.

From this point onward, Claude must perform EVERY action it can legitimately perform itself using:
- Shopify CLI;
- the already-authorized Shopify Admin/browser session;
- official Shopify Admin UI;
- official Shopify APIs/tools available to the session;
- the local worktree and test harness.

ROUTINE ADMIN CONFIGURATION IS CLAUDE'S JOB, NOT DANIELA'S.

Examples that Claude MUST attempt itself before asking Daniela:
- change store language;
- change store currency;
- change timezone and units;
- create Shopify Pages;
- assign page templates;
- create/edit menus and navigation;
- edit theme settings;
- upload/update the unpublished theme;
- inspect storefront preview;
- create metafields/metaobjects when a later approved phase calls for them;
- import catalog/products when a later approved phase calls for them;
- configure test-only store settings that are explicitly authorized by the current phase.

DO NOT stop and ask Daniela to click through routine Admin screens merely because the CLI lacks a command.
If Claude has browser/computer access to the authenticated Admin, USE IT.

DO NOT ask Daniela to reply "LISTO" after routine configuration.
Complete the routine work yourself and continue through the phase.

Daniela should be interrupted ONLY when one of these is truly unavoidable:
1. Shopify login/authentication/MFA/device-code approval or email verification code;
2. acceptance of legal terms or permissions that must legally be accepted by the account owner;
3. a payment, paid plan, charge, billing approval, or purchase;
4. an irreversible production action such as publishing the final theme, moving the real domain, or enabling real payments;
5. a genuinely new business decision not already defined in project decisions;
6. a hard technical permission boundary where the available tools cannot perform the action.

If one of those occurs:
- ask for ONLY that single action;
- explain exactly why Claude cannot do it itself;
- resume immediately after the user completes it.

The current manual checklist previously shown for currency/language/Favorites/menus is superseded:
Claude must do those items itself if the authenticated Admin/browser session allows it.

CONTINUITY:
- do not pause between normal subtasks;
- do not pause after completing a normal phase if ChatGPT has already supplied the next READY_FOR_CLAUDE prompt;
- use the finite 1m + 2m + 5m handoff checks;
- keep progressing phase by phase until a TRUE manual boundary above is reached.


PHASE: 03B — DEVELOPMENT STORE FOUNDATION CONFIG + PASSWORD PAGE + CUSTOMER ACCOUNT REAL CHECK
MODEL: OPUS 5.5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 03B — CONFIGURACIÓN BASE REAL DE LA DEVELOPMENT STORE

==================================================
CONTEXTO CONFIRMADO
==================================================

03A terminó y fue revisada por ChatGPT.

Estado real confirmado:
- Development Store: Radaelli Swimwear Dev
- domain: radaelli-swimwear-dev.myshopify.com
- plan de prueba: Basic
- Horizon sigue LIVE
- Radaelli RC1 está UNPUBLISHED
- theme ID: 189072474431
- theme remoto equivale a RC1.1
- Shopify server-side validation final: 0 rechazos
- Theme Check: 0/0
- smoke real shell: PASS
- responsive real 320–1280: PASS
- New Customer Accounts vienen habilitadas en la Dev Store
- wishlist remote sync sigue OFF/inert
- 0 apps
- 0 productos importados
- 0 publicación
- Production/Staging/main untouched

RC1 fue reemplazado por RC1.1 después de corregir límites de schema y el overflow real de header.

==================================================
DECISIONES DE CONFIGURACIÓN YA TOMADAS
==================================================

Para esta Development Store:

1. Idioma principal:
   ESPAÑOL.

2. Mercado/base comercial:
   COLOMBIA.

3. Moneda base:
   COP.

4. Cuenta:
   mantener NEW CUSTOMER ACCOUNTS passwordless.

5. Soporte del theme:
   usar info@radaelliswimwear.com como theme_support_email.

6. Password page:
   SÍ debe existir una página de contraseña propia del theme, premium y simple, para que el theme sea autocontenido cuando la tienda esté protegida.
   No copiar Horizon.
   Debe respetar branding Radaelli y usar solo assets/theme settings disponibles.

==================================================
OBJETIVO DE 03B
==================================================

Dejar la Development Store correctamente configurada para Colombia/español y cerrar los primeros GO/NO-GO reales de Customer Accounts, SIN importar catálogo todavía.

Alcance:
- idioma principal;
- mercado/moneda;
- timezone/unidades si corresponde;
- soporte del theme;
- password page real;
- página Favoritos;
- navegación mínima coherente;
- verificación real de New Customer Accounts;
- pruebas de customer Liquid object después de login;
- smoke del theme RC1.1 después de configuración.

NO catálogo todavía.
NO metafields de producto todavía.
NO app wishlist todavía.
NO Wompi.
NO analytics.
NO publish.

==================================================
1. REVALIDAR SESIÓN Y STORE
==================================================

Antes de cambiar nada:

- shopify theme info --store radaelli-swimwear-dev --json
- shopify theme list --store radaelli-swimwear-dev

Confirmar:
- tienda exacta;
- Horizon live;
- Radaelli RC1 unpublished;
- sesión CLI todavía válida.

Si la sesión expiró:
usar auth oficial de Shopify CLI.
Si exige browser:
MANUAL STEP REQUIRED — SHOPIFY AUTHORIZATION

No cookies/tokens manuales.

==================================================
2. IDIOMA PRINCIPAL — ESPAÑOL
==================================================

Configurar la tienda para que el idioma principal del storefront sea ESPAÑOL.

Primero investigar cuál es el mecanismo oficial actual disponible para esta Dev Store:
- Admin UI;
- Shopify CLI/API oficial con sesión existente;
- otro método soportado.

NO inventar endpoint privado.

Si la CLI/API no permite el cambio, usar la sesión autenticada del Shopify Admin en navegador y hacerlo directamente.
Solo pedir ayuda a Daniela si Shopify exige autenticación/MFA/confirmación de propietaria que Claude no puede completar.

Criterio de éxito:
- storefront usa es.default.json;
- html lang correcto;
- textos nativos que dependan de idioma aparecen en español cuando Shopify los provea;
- el theme sigue manteniendo en.json como idioma secundario disponible.

No borrar inglés del theme.

==================================================
3. COLOMBIA + COP
==================================================

Configurar el contexto de la tienda para:
- país/mercado principal: Colombia;
- moneda base: COP.

Verificar de forma real:
- shop.currency = COP;
- formato money en storefront;
- Cart /cart.js currency;
- cualquier market context visible;
- la lógica del threshold de envío gratis queda expresada en COP cuando luego se active.

NO activar la barra de envío gratis todavía.

Si la CLI/API no permite el cambio, usar directamente el Shopify Admin autenticado en navegador.
NO pedir a Daniela que navegue Configuración por ti.
Solo usar MANUAL STEP REQUIRED si aparece autenticación/MFA/confirmación exclusiva de propietaria.

No configurar tarifas reales todavía.

==================================================
4. TIMEZONE / UNITS / STORE BASICS
==================================================

Revisar solo settings fundamentales que afectan pruebas:

- timezone: Colombia/Bogotá o equivalente oficial;
- unit system si Shopify lo expone;
- store contact/support details;
- store name debe seguir Radaelli Swimwear Dev.

NO tocar:
- dominio;
- taxes reales;
- shipping rates;
- payments.

Documentar cualquier default que se deja para fase posterior.

==================================================
5. THEME SUPPORT EMAIL
==================================================

Cambiar en theme source:
theme_support_email → info@radaelliswimwear.com

Revalidar:
- Theme Check;
- audit-theme-limits;
- JSON validity.

Push SOLO al theme unpublished ID 189072474431.

NO Horizon.
NO publish.

==================================================
6. PASSWORD PAGE — REAUDITORÍA OFICIAL
==================================================

Antes de crear archivos:

Verificar con docs Shopify actuales cuál es la arquitectura válida para password template en OS 2.0.

Determinar si se requiere:
- layout/password.liquid
- templates/password.json
- una section dedicada
- o la combinación oficial actual.

No usar el archivo mínimo de 48 bytes que Shopify generó como diseño final.
No copiar Horizon.

==================================================
7. PASSWORD PAGE — IMPLEMENTACIÓN
==================================================

Crear una página protegida sobria/premium de Radaelli.

Objetivo visual:
- Radaelli Swimwear
- fondo limpio/editorial
- logo configurable o nombre textual fallback
- mensaje breve de "Estamos preparando algo especial" o equivalente profesional
- form nativo de password de Shopify
- acceso para staff/store owner según flujo Shopify
- support/contact discreto si corresponde

NO:
- claims de lanzamiento;
- fecha inventada;
- countdown;
- popup;
- newsletter si no está justificado;
- assets externos;
- JS pesado.

Debe ser:
- responsive;
- accesible;
- keyboard;
- no horizontal overflow;
- no secret leakage;
- compatible con 320px.

==================================================
8. SERVER VALIDATION DEL PASSWORD TEMPLATE
==================================================

Después de implementarlo:

- Theme Check 0/0;
- audit-theme-limits;
- push al MISMO unpublished theme;
- verificar que Shopify acepta todos los archivos;
- probar ruta de password real en preview/store protection;
- no publicar theme.

Reportar cualquier diferencia entre offline y Shopify real.

==================================================
9. PÁGINA FAVORITOS
==================================================

Crear en Shopify Admin una Page:
- título: Favoritos
- handle preferido: favoritos
- template: page.wishlist

Usar método oficial.

Si la CLI no lo soporta o no hay API autorizada disponible:
hacerlo directamente en el Shopify Admin autenticado con browser/computer use.
NO pedir a Daniela que cree la página.
Solo escalar si aparece una barrera real de autenticación/permiso que Claude no puede completar.

Criterio de éxito:
- /pages/favoritos = 200 bajo preview_theme_id;
- usa page.wishlist;
- guest wishlist empty state renderiza;
- no sync remoto;
- no /apps.

==================================================
10. NAVEGACIÓN MÍNIMA
==================================================

No construir todavía el menú final de colecciones porque el catálogo no existe.

Sí dejar:
- Home
- Favoritos si corresponde al patrón real
- Cuenta mediante Shopify account component/link
- Search y Cart desde header

No crear links rotos a collections inexistentes.

Si el menú actual de ejemplo de Shopify contiene Catalog/Contact y no corresponde al diseño real:
documentarlo y reemplazar solo lo que sea seguro sin catálogo.

El menú final de colecciones se completa después de importar catálogo.

==================================================
11. NEW CUSTOMER ACCOUNTS — REAL LOGIN CHECK
==================================================

03A confirmó que New Customer Accounts están enabled y <shopify-account> renderiza.

Ahora probar el flujo REAL de login passwordless.

Usar una cuenta de prueba legítima de Daniela/Radaelli en esta Development Store.

NO usar datos de terceros.
NO enviar códigos a clientes reales.

Cuando Shopify solicite el código enviado por email:
MANUAL STEP REQUIRED — CUSTOMER ACCOUNT LOGIN CODE

Daniela introduce/aprueba el código en su Chrome real.
Claude no debe pedir que copie el código en chat si puede completarlo directamente en el navegador.

==================================================
12. CUSTOMER LIQUID OBJECT — GO/NO-GO
==================================================

Después del login real:

Probar en storefront PREVIEW del theme:
- si customer existe en Liquid;
- customer.id presente;
- qué datos se exponen;
- si <shopify-account> cambia a estado autenticado;
- logout;
- re-login;
- comportamiento en nueva pestaña;
- comportamiento después de pageshow.

No imprimir PII ni IDs completos en reportes públicos/handoff.
Puede reportar:
- PRESENT/ABSENT;
- type/shape;
- masked/synthetic values si necesita evidencia.

Este test cierra GO/NO-GO #1 de 02L.

==================================================
13. LEGACY CUSTOMER TEMPLATES — GO/NO-GO
==================================================

Verificar que New Customer Accounts:
- no dependen de templates/customers/*;
- rutas legacy redirigen/son ignoradas según Shopify actual;
- nuestro theme no necesita esos templates.

No crear legacy templates.

Cerrar GO/NO-GO #9 si la evidencia real lo permite.

==================================================
14. ACCOUNT UX BASIC
==================================================

Verificar:
- login con código;
- orders landing nativa aunque esté vacía;
- profile/account surface;
- logout;
- return-to-store;
- account icon/header state.

No personalizar todavía Customer Account UI.
No crear extension.

==================================================
15. WISHLIST ACCOUNT SYNC SIGUE OFF
==================================================

Durante todo 03B:
- wishlist_account_sync = false;
- remote adapter no network;
- guest wishlist funciona antes y después de login;
- NO merge remoto todavía;
- NO customer metafield;
- NO app proxy;
- NO account extension.

Esto es intencional.

==================================================
16. SMOKE POST-CONFIG
==================================================

Probar con el theme unpublished:

- Home
- Search
- Cart
- Favoritos
- Password page
- Account entry
- login/logout flow
- desktop 1280
- mobile 390 y 320
- no horizontal overflow
- no fatal JS
- no fatal Liquid
- assets 0 failures propios
- locale español
- currency COP

No PDP/Collection funcional todavía porque no hay catálogo.

==================================================
17. SHOPIFY STATE SNAPSHOT
==================================================

Al final registrar, sin secretos:
- store language
- currency
- country/market
- timezone
- live theme
- unpublished theme
- New Customer Accounts status
- Favorites page status
- password template status
- menu status
- product count (debe seguir 0)
- app count relevante (debe seguir 0 custom wishlist apps)

==================================================
18. NO CATALOG YET
==================================================

NO:
- importar 29 productos;
- variantes;
- imágenes;
- collections;
- product metafields;
- size guide metaobject;
- tags de color;
- inventory;
- shipping;
- taxes;
- Wompi.

Eso será 03C después de revisión.

==================================================
19. SAFETY
==================================================

NO:
- publish;
- tocar Horizon;
- Production;
- Staging;
- Vercel;
- Neon;
- DNS;
- main;
- merge;
- PR;
- app install;
- custom app;
- real customer outreach;
- real commercial payment.

==================================================
20. REPORT
==================================================

Crear:
shopify-migration/theme/03B-store-foundation-report.md

Debe incluir:

1. model confirmed
2. elapsed time
3. usage exact or UNAVAILABLE
4. CLI session valid YES/NO
5. language before
6. language after
7. Spanish primary PASS/FAIL
8. currency before
9. currency after
10. COP PASS/FAIL
11. market/country status
12. timezone status
13. support email updated YES/NO
14. password architecture used
15. password files created
16. password server validation PASS/FAIL
17. password responsive/accessibility PASS/FAIL
18. Favorites page created YES/NO
19. Favorites URL 200 PASS/FAIL
20. Wishlist template active PASS/FAIL
21. navigation changes
22. New Customer Accounts enabled YES/NO
23. real passwordless login tested YES/NO
24. customer Liquid object after login PRESENT/ABSENT
25. account component authenticated state PASS/FAIL
26. logout PASS/FAIL
27. legacy customer templates required YES/NO
28. GO/NO-GO #1 result
29. GO/NO-GO #9 result
30. wishlist remote sync remains OFF YES/NO
31. guest wishlist regression PASS/FAIL
32. Home shell PASS/FAIL
33. Search shell PASS/FAIL
34. Cart shell PASS/FAIL
35. Favorites shell PASS/FAIL
36. locale Spanish in real preview PASS/FAIL
37. currency COP in real preview PASS/FAIL
38. desktop 1280 PASS/FAIL
39. mobile 390 PASS/FAIL
40. mobile 320 PASS/FAIL
41. fatal JS errors
42. fatal Liquid errors
43. Theme Check errors
44. Theme Check warnings
45. Shopify push rejected files count
46. live theme still Horizon YES/NO
47. Radaelli theme unpublished YES/NO
48. product count 0 YES/NO
49. app installed NO
50. Production/Staging/main touched NO
51. blockers for 03C
52. READY FOR 03C YES/NO
53. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

==================================================
21. HANDOFF
==================================================

Al terminar:

Actualizar:
ai-handoff/claude-result.md

Crear:
ai-handoff/archive/03B-result.md

Actualizar status.md:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03B
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 03C
CURRENT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

Push SOLO handoff Markdown a origin/ai-handoff.

Enviar:
HANDOFF READY 03B

Después NO detenerte inmediatamente.

Usar el protocolo FINITO de handoff para que Daniela no tenga que actuar como intermediaria:

CHECK 1
- esperar 1 minuto después de enviar HANDOFF READY 03B;
- leer origin/ai-handoff/status.md y origin/ai-handoff/next-prompt.md;
- si status = READY_FOR_CLAUDE_03C, leer el prompt nuevo y continuar 03C sin pedir permiso adicional.

CHECK 2
- solo si Check 1 no está listo;
- esperar 2 minutos adicionales;
- total aproximado desde HANDOFF READY: 3 minutos;
- leer status.md + next-prompt.md;
- si READY_FOR_CLAUDE_03C, continuar.

CHECK 3
- solo si Check 2 no está listo;
- esperar 5 minutos adicionales;
- total aproximado desde HANDOFF READY: 8 minutos;
- leer status.md + next-prompt.md;
- si READY_FOR_CLAUDE_03C, continuar.

Si después del Check 3 sigue sin estar listo:
MANUAL STEP REQUIRED — CHATGPT HANDOFF TIMEOUT AFTER 8 MINUTES
y STOP.

NO cuarto intento.
NO watcher.
NO loop infinito.
NO espera indefinida.

==================================================
BACKGROUND RULE
==================================================

NO watchers detached.
NO loops infinitos.
NO waits indefinidos.
NO background tasks persistentes.

Si aparece un paso manual de Shopify:
pedir SOLO ese paso, esperar a Daniela, y luego continuar.

Durante handoff:
solo 3 checks finitos: 1m + 2m + 5m.

Al finalizar cada fase:
CERO TAREAS DE SEGUNDO PLANO ACTIVAS fuera de esos checks finitos.
