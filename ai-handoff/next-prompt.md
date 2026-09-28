# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03A

PHASE: 03A — CONNECT DEVELOPMENT STORE + UPLOAD RC1 AS UNPUBLISHED THEME
MODEL: OPUS 5.5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 03A — CONEXIÓN REAL A DEVELOPMENT STORE + PRIMERA SUBIDA DEL THEME

==================================================
DEVELOPMENT STORE — CONFIRMADA POR DANIELA
==================================================

Daniela creó manualmente la Development Store correcta desde Shopify Dev Dashboard.

Datos confirmados visualmente:
- Store display name: Radaelli Swimwear Dev
- Store type: Dev
- Shopify plan selected for test environment: Basic
- Generate test data: NOT selected
- Feature preview: NOT selected
- Admin URL slug visible: radaelli-swimwear-dev
- Store is currently showing Shopify's default Horizon theme
- Development-store indicator "dev" visible in Admin

NO crear otra tienda.
NO iniciar una free trial.
NO publicar ningún theme.

==================================================
OBJETIVO DE 03A
==================================================

Esta fase es DELIBERADAMENTE ESTRECHA.

Solo:
1. conectar Shopify CLI a la Development Store existente;
2. autenticar de forma legítima con la cuenta autorizada;
3. verificar la identidad exacta de la tienda;
4. subir el RC1 como THEME UNPUBLISHED;
5. obtener preview/editor URL;
6. ejecutar smoke técnico inicial en Shopify real;
7. reportar cualquier incompatibilidad real.

NO:
- importar catálogo todavía;
- crear collections;
- configurar metafields/metaobjects;
- habilitar New Customer Accounts;
- crear app wishlist;
- tocar Wompi;
- tocar analytics;
- publicar el theme;
- tocar Production/Staging/Vercel/Neon/DNS/main.

==================================================
1. AUTENTICACIÓN
==================================================

Usar Shopify CLI oficial actual.

La CLI moderna no requiere un login separado previo: si una orden necesita autenticación, debe disparar el flujo oficial.

Usar el store identifier de la Development Store existente.

Preferencia:
- intentar con el store slug "radaelli-swimwear-dev" si Shopify CLI lo acepta;
- si requiere dominio completo, resolverlo mediante Shopify CLI/auth/store metadata;
- NO inventar credenciales;
- NO extraer cookies;
- NO pedir tokens manuales;
- NO usar Theme Access password si la autenticación interactiva normal funciona.

Si Shopify abre browser/login/authorization:
- detenerte en el punto exacto;
- mostrar a Daniela un mensaje corto:
  MANUAL STEP REQUIRED — SHOPIFY AUTHORIZATION
- incluir exactamente qué debe aprobar;
- esperar a que Daniela complete el login/autorización en su Chrome real;
- luego continuar en la misma sesión.

No hacer bypass de autenticación.

==================================================
2. STORE IDENTITY VERIFICATION
==================================================

Después de autenticar:

Verificar con Shopify CLI / API permitida:
- store domain exacto;
- store name;
- dev store status si CLI lo expone;
- current themes list;
- Horizon debe aparecer como theme existente/live en la dev store.

NO modificar Horizon.

Guardar en reporte:
- domain
- store name
- theme IDs/statuses
- account/org context si la CLI lo muestra sin secretos

No guardar tokens ni cookies.

==================================================
3. SOURCE TO UPLOAD
==================================================

Usar el theme source ya validado de:

shopify-migration/theme-src/

No subir desde ZIP si theme-src es la fuente equivalente y ya fue verificada.

Antes de push:
- ejecutar Theme Check una vez más;
- confirmar 0 errors / 0 warnings;
- confirmar que wishlist_account_sync = false;
- confirmar cart_free_shipping_progress = false;
- confirmar theme_support_email placeholder sigue pendiente pero no bloquea preview;
- confirmar un solo locale default.

==================================================
4. UPLOAD STRATEGY
==================================================

Subir como UNPUBLISHED THEME persistente.

Preferencia oficial:

shopify theme push --unpublished --theme "Radaelli RC1" --store <resolved-store> --strict --json

Si la sintaxis exacta actual difiere:
- verificar con Shopify CLI help/docs;
- usar la variante oficial equivalente.

NO usar:
- --live
- theme publish
- allow-live
- overwrite de Horizon
- development theme temporal como único destino final de esta fase

Razón:
queremos un theme persistente no publicado que Daniela/ChatGPT puedan inspeccionar después.

==================================================
5. POST-UPLOAD VERIFICATION
==================================================

Confirmar:
- push exitoso;
- role = unpublished;
- theme name = Radaelli RC1 o equivalente inequívoco;
- theme ID;
- editor URL;
- preview URL;
- live theme sigue siendo Horizon;
- ningún publish ocurrió.

Si Shopify retorna warnings/errores de server-side validation:
- NO esconderlos;
- corregir solo si pertenecen al theme y son seguros;
- repetir Theme Check;
- repetir push solo si hace falta.

==================================================
6. REAL SHOPIFY SMOKE — SIN CONFIGURAR DATOS
==================================================

Abrir preview del theme UNPUBLISHED usando el flujo oficial.

NO usar preview_start del proyecto Next.
NO iniciar rada-dev.
NO tocar puerto 3000.

Verificar únicamente lo que puede verificarse sin catálogo importado:

- theme carga;
- layout/theme renderiza;
- Header renderiza;
- Footer renderiza;
- Home no explota aun con colecciones/productos vacíos;
- Search route no lanza Liquid errors;
- Cart empty route no lanza Liquid errors;
- Wishlist page template existe en theme library aunque aún no haya Page asignada;
- no Liquid syntax error;
- no missing asset fatal;
- no 404 de assets propios;
- no JS exception fatal;
- responsive shell al menos desktop + mobile;
- account entry no rompe aunque New Customer Accounts todavía no esté habilitado/configurado;
- wishlist remote sync sigue inerte.

No declarar PDP/collection/product-card funcionalmente validados en Shopify real sin catálogo.

==================================================
7. SHOPIFY-SPECIFIC COMPATIBILITY CHECK
==================================================

Comparar lo que el renderer offline no podía garantizar:

- section schema accepted by Shopify;
- settings schema accepted by Shopify;
- locale acceptance;
- <shopify-account> parsing/render behavior in current store state;
- JSON templates accepted;
- Liquid filters/tags accepted;
- Section Rendering sections accepted;
- app-block placeholders, if any;
- unsupported/deprecated Liquid constructs.

Documentar cualquier divergencia.

==================================================
8. NO MANUAL IMPORT BUTTON
==================================================

Daniela está actualmente en:
Online Store → Themes.

NO pedirle que use "Importar" ni que suba el ZIP manualmente.

La subida debe hacerla Claude por Shopify CLI desde el worktree, salvo que la CLI falle por una limitación real.

==================================================
9. NO DATA SETUP YET
==================================================

03A termina ANTES de:
- productos;
- variantes;
- imágenes;
- collections;
- metafields;
- metaobjects;
- menus;
- page Favoritos;
- New Customer Accounts;
- app wishlist;
- Wompi.

Eso será 03B/03C según revisión.

==================================================
10. SAFETY
==================================================

NO:
- Production
- Staging
- Vercel
- Neon
- Wompi
- DNS
- main
- merge
- PR
- rebase/reset
- publish theme
- delete Horizon
- overwrite live theme
- install apps
- create customers
- send real customer login codes

==================================================
11. REPORT
==================================================

Crear:
shopify-migration/theme/03A-development-store-upload-report.md

Reportar:
1. model confirmed
2. elapsed time
3. exact usage or UNAVAILABLE
4. Shopify CLI version
5. auth method used
6. manual auth required YES/NO
7. exact store domain
8. exact store name
9. store/dev context confirmed
10. themes before upload
11. Theme Check before push errors/warnings
12. push command shape used (without secrets)
13. upload result
14. unpublished theme ID
15. theme name
16. editor URL
17. preview URL
18. live theme after upload
19. Horizon untouched YES/NO
20. Shopify validation errors/warnings
21. shell smoke Home PASS/FAIL
22. Header PASS/FAIL
23. Footer PASS/FAIL
24. Search empty shell PASS/FAIL
25. Cart empty shell PASS/FAIL
26. Wishlist template presence PASS/FAIL
27. asset load PASS/FAIL
28. JS fatal errors count
29. Liquid fatal errors count
30. desktop shell PASS/FAIL
31. mobile shell PASS/FAIL
32. account entry parse/render status
33. wishlist remote layer inert YES/NO
34. Production touched NO
35. Staging touched NO
36. main touched NO
37. theme published NO
38. app installed NO
39. data imported NO
40. blockers for 03B
41. READY FOR 03B YES/NO
42. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

==================================================
12. HANDOFF
==================================================

Al terminar:

Actualizar:
ai-handoff/claude-result.md

Crear:
ai-handoff/archive/03A-result.md

Actualizar status.md:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03A
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 03B
CURRENT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

Push SOLO handoff Markdown a origin/ai-handoff.

Enviar:
HANDOFF READY 03A

Después:
STOP.

No iniciar 03B automáticamente.
No usar protocolo 1/2/5 en esta primera fase conectada a Shopify.

==================================================
BACKGROUND RULE
==================================================

NO watchers.
NO loops infinitos.
NO waits indefinidos.
NO background tasks persistentes.

Si aparece autenticación:
MANUAL STEP REQUIRED — SHOPIFY AUTHORIZATION
y esperar interacción explícita de Daniela.

Al finalizar:
CERO TAREAS DE SEGUNDO PLANO ACTIVAS.
