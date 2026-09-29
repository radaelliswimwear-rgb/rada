
==================================================
STOP AFTER 03E — OWNER MANUAL BATCH NEXT
==================================================

HIGHEST PRIORITY OVERRIDE FOR THIS PHASE:

When 03E finishes:
- DO NOT auto-continue to 03F.
- DO NOT wait for or consume a READY_FOR_CLAUDE_03F prompt.
- After writing the 03E handoff and sending HANDOFF READY 03E, STOP.
- Daniela will perform the consolidated owner-only/manual batch next.
- The next technical phase will be defined only AFTER that manual batch is completed and ChatGPT reviews the resulting state.

Therefore the finite +1m / +2m / +5m continuation checks are SUSPENDED at the end of 03E.
No fourth check, no watcher, no background continuation.

# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03E


==================================================
USER IS HOME BUT BUSY — DO NOT INTERRUPT
==================================================

Daniela is now home but explicitly says she is busy and wants autonomous work to continue.

This supersedes any instruction that starts asking her for owner-only steps merely because the clock passes 13:00.

Until Daniela explicitly says she is ready for the manual batch:
- DO NOT interrupt her for owner-only steps;
- defer auth/OAuth/login-code/legal/billing/approval/manual items;
- continue every independent safe task;
- consolidate all remaining owner actions into ONE prioritized batch;
- do not ask for scattered approvals;
- do not idle while a deferred owner action exists.

When Daniela explicitly says she is ready:
- execute the manual batch one action at a time, shortest/highest-unlock first.

PHASE: 03E — CHECKOUT/PAYMENTS FEASIBILITY + SHIPPING/LEGAL/SEO/ANALYTICS + LAUNCH PREP QA
MODEL: OPUS 5.5 ULTRACODE

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 03E — CERRAR PREPARACIÓN COMERCIAL Y DE LANZAMIENTO SIN PUBLICAR

==================================================
AUTONOMY / ACCELERATION — HIGHEST PRIORITY
==================================================

Daniela quiere máxima velocidad con calidad completa.

Hasta aproximadamente las 13:00 hora Colombia:
- NO pedir tareas manuales;
- si aparece auth/MFA/OAuth/owner-only/legal/billing/payment approval:
  DEFERRED_OWNER_ONLY_BLOCKER;
- NO esperar;
- seguir todo lo independiente;
- un bloqueo manual NO bloquea la fase.

Después de las 13:00, si Daniela vuelve y hay owner-only blockers todavía necesarios:
- consolidarlos en UNA sola lista;
- pedir solo lo estrictamente indispensable;
- continuar inmediatamente después.

Cadencia ACTUAL:
+1 min → +2 min → +5 min.
NO activar 2/5/8 todavía.

==================================================
03D — REVIEWED AND APPROVED
==================================================

03D terminó correctamente.

Confirmado:
- Search index llegó a 27/29 y seguía avanzando.
- Filtros de precio corregidos y Availability oculto por inventario no rastreado.
- Search & Discovery NO instalado por OAuth owner-only.
- Color tags experimentales solo en 2 productos.
- Arquitectura wishlist 02L sigue válida.
- App Radaelli wishlist construida OFFLINE.
- App tests: 156/156 PASS.
- App mutation tests: 19/19 PASS.
- Customer Account extension "Mis favoritos" construida offline.
- App NO instalada, owner-only.
- wishlist_account_sync = false.
- 13 assets exactos encontrados en Cloudinary propio, no subidos.
- Política de reembolso + Garantía migradas/verificadas.
- 4 páginas legales preparadas verbatim pero no escritas por hard permission boundary.
- Colección Destacados real = 7 productos, conectada a Home.
- Free-shipping claim protegido con free_shipping_rate_confirmed = false.
- RC1.4 creado.
- Theme Check 0/0.
- Offline regression 54/54.
- Responsive real 63/63.
- Catálogo intacto 29/98/95.
- Horizon live untouched.
- Radaelli unpublished.

RC1.4 SHA-256:
cba89ac9926ca2256c637139b2524ed5110196aefdfcd508ae3e9de258c5a9ca

App package:
dist/radaelli-wishlist-app-0.1.0.zip
SHA-256:
559c346a8121d822462f3622abfb77e38d55607a83cd263bde37d3421687296a

==================================================
OBJETIVO DE 03E
==================================================

Avanzar todo lo que falta para llevar la Development Store hacia 100% técnico/comercial SIN publicar todavía.

Foco:
A. cerrar search/index + tags;
B. investigar y decidir técnicamente Wompi/checkout en Shopify Colombia;
C. preparar entorno de checkout Dev Store;
D. reconstruir política de envíos desde fuentes reales;
E. cerrar SEO/redirects;
F. cerrar contenido legal/ayuda todo lo posible;
G. preparar analítica desde día 1;
H. preparar media upload package;
I. security/performance/launch readiness;
J. dejar un checklist mínimo de owner-only para ejecución manual cuando Daniela esté.

NO publicar.
NO DNS.
NO pagos reales.
NO facturación.
NO Shopify comercial todavía.

==================================================
1. RE-TEST SEARCH INDEX
==================================================

Al inicio:
- medir los 29 productos;
- confirmar si 29/29 ya indexaron;
- re-probar mostaza;
- re-probar blanco;
- título exacto/parcial;
- color terms;
- collection terms;
- SKU.

Si 29/29:
cerrar incidente de indexación.

Si no:
usar SOLO toque neto cero / mecanismo reversible documentado, sin contaminar data.

No crear tags extra salvo necesidad demostrada.

Actualizar:
theme/03D-search-index-report.md
o crear:
theme/03E-search-final-report.md

==================================================
2. SEARCH & DISCOVERY — PREP WITHOUT OWNER
==================================================

Sin instalar todavía si requiere OAuth:
- documentar exact permissions/scopes;
- capturar filtros que se habilitarían;
- preparar configuración objetivo:
  - Talla
  - Color
  - Precio
  - NO disponibilidad mientras inventory untracked
- preparar QA checklist post-install.

Si existe una vía oficial que NO requiere owner acceptance y es segura:
puede usarse.
Si requiere OAuth:
deferir.

==================================================
3. WOMPI ON SHOPIFY — CURRENT PLATFORM RESEARCH
==================================================

Investigar con fuentes oficiales y actuales:
- Shopify payment providers/gateways soportados en Colombia;
- Wompi oficial para Shopify si existe;
- Shopify App Store / Wompi docs;
- limitaciones por plan/país;
- si Wompi funciona como payment app/provider;
- si requiere custom payment app;
- si una app custom de pagos es permitida para merchants normales;
- si puede probarse en Development Store;
- test/sandbox support;
- checkout extensibility implications;
- webhook/return behavior;
- requisitos de activación/KYC;
- fees/currency;
- qué partes son owner-only.

NO asumir que la integración custom Next.js se puede reutilizar.

Crear:
shopify-migration/payments/03E-wompi-shopify-feasibility.md

Debe concluir con uno de:
- SUPPORTED DIRECTLY
- SUPPORTED VIA OFFICIAL APP/PROVIDER
- REQUIRES ALTERNATIVE
- NOT VERIFIED

==================================================
4. PAYMENT ARCHITECTURE DECISION TREE
==================================================

Preparar dos caminos si hace falta:

PATH A:
Wompi oficial/provider Shopify.

PATH B:
otra vía soportada si Wompi no puede integrarse de forma oficial.

NO elegir proveedor comercial alternativo sin Daniela.
Solo documentar opciones y exactos owner-only steps.

No activar nada.

==================================================
5. CHECKOUT DEV-STORE BASELINE
==================================================

Sin pagos reales:
- abrir checkout desde carrito con producto real;
- validar customer/email/address steps si Dev Store lo permite;
- COP presente;
- line item/variant correctos;
- subtotal correcto;
- descuentos no duplicados;
- envío state actual;
- taxes state actual;
- return-to-cart;
- mobile/desktop;
- no broken links.

NO completar payment.
NO crear order real si no hay un método de prueba seguro ya habilitado.

Crear:
theme/03E-checkout-baseline-report.md

==================================================
6. SHIPPING SOURCE RECON
==================================================

Buscar exhaustivamente en:
- repo custom site;
- source-of-truth;
- checkout code;
- settings;
- old Wompi/order code;
- current public storefront content;
- legal shipping page content;
- any constants/env-free config;
- docs/reports.

Objetivo:
encontrar si ya existe una tarifa real debajo de COP 299.900.

Si existe con evidencia clara:
documentar exacto valor/regla/origen.

Si NO:
NO inventar tarifa.
Mantener:
free_shipping_rate_confirmed = false.

Crear:
shopify-migration/shipping/03E-shipping-source-of-truth.md

==================================================
7. SHIPPING PROFILE PREP
==================================================

Sin configurar tarifa comercial no decidida:
- documentar exact Shopify shipping profile structure required;
- Colombia zones;
- threshold >= 299.900;
- below-threshold placeholder = NOT_SET;
- product weights absent → avoid weight-based rate;
- no international assumptions.

Preparar checklist/script/UI plan para owner step posterior.

==================================================
8. LEGAL CONTENT — CLOSE EVERYTHING POSSIBLE
==================================================

Usar SOLO contenido verbatim ya extraído.

Ya migrados:
- Reembolso
- Garantía

Pendientes preparados:
- Privacidad
- Términos
- Envíos
- Cookies

Reintentar escritura SOLO mediante métodos oficiales y permisos existentes:
- Admin UI autenticado;
- official tooling.

Si el hard permission boundary persiste:
deferir.

NO reescribir legal language.
NO inventar razón social/NIT/dirección.

Crear/actualizar:
theme/03D-legal-policies-inventory.md

==================================================
9. FOOTER / HELP INFORMATION ARCHITECTURE
==================================================

Sin inventar:
- mapear pages/policies existentes;
- preparar footer "Ayuda" exacto con destinos reales;
- solo activar links cuando URL existe;
- evitar dead links.

Si contenido de contacto real existe:
usar exact source.

No pedir decisión editorial antes de 13:00.

==================================================
10. MEDIA PACKAGE — PREP FOR ONE-SHOT OWNER ACTION
==================================================

Ya existen 13 assets exactos.

Preparar localmente:
- descargar desde Cloudinary propio;
- validar MIME/dimensiones/hash;
- aplicar SOLO c_limit a archivos que excedan Shopify limits, sin recorte ni edición;
- preservar source URL;
- generar upload manifest;
- crear carpeta lista para upload.

NO modificar visualmente media.

Crear:
content/media/prepared/
content/media/03E-upload-ready-manifest.csv

Si upload puede hacerse con herramienta oficial sin owner approval:
hacerlo.
Si hard boundary:
deferir.

==================================================
11. HERO / COLLECTION COVERS / SIZE GUIDE WIRING PREP
==================================================

Preparar mappings exactos:
- Hero video/poster
- 4 collection banners
- category cards
- size-guide image Oasis

No activar referencias Shopify file hasta que exista file object real.

Preparar los settings/metafield assignments para ejecutarse automáticamente después del upload.

==================================================
12. SEO REDIRECT PACKAGE
==================================================

Usar:
- current-url-inventory.csv
- shopify-handle-mapping.csv
- shopify-url-parity.csv
- legal URL inventory

Crear:
shopify-migration/seo/shopify-redirects-import.csv
shopify-migration/seo/03E-redirect-plan.md

Clasificar:
- exact preserved
- Shopify normalized
- redirect needed
- intentionally not migrated
- legal redirect pending
- no redirect needed

No crear redirect loops.
No redirect to unrelated content.
No touch Production.

Si Dev Store permite importar redirects safely:
puede probarse con subset reversible y luego full Dev mapping.
Documentar.

==================================================
13. CANONICAL / META / ROBOTS AUDIT
==================================================

Auditar:
- product canonical
- collection canonical
- search noindex behavior
- favorites ?view=wishlist canonical issue
- password environment
- duplicate /en
- title/meta descriptions from source only
- robots defaults Shopify
- sitemap availability in Dev Store

No inventar SEO copy.

Crear:
theme/03E-seo-technical-audit.md

==================================================
14. ANALYTICS DAY-1 ARCHITECTURE
==================================================

Objetivo futuro ya decidido:
medir:
ad → web visit → product view → add to cart → checkout → purchase.

Investigar arquitectura Shopify actual:
- Customer Events / Pixels
- GA4
- Meta Pixel
- consent/customer privacy
- Shopify native events
- custom pixel limitations
- checkout events availability by plan
- deduplication
- server-side options if applicable

No pedir IDs ahora.
No insertar IDs falsos.

Crear:
shopify-migration/analytics/03E-analytics-plan.md

Debe incluir event map:
- page_view
- view_item
- view_item_list
- search
- add_to_cart
- remove_from_cart
- view_cart
- begin_checkout
- add_shipping_info
- add_payment_info if available
- purchase
- wishlist add/remove if custom tracking allowed

Mapear Shopify source event → GA4/Meta equivalent.

==================================================
15. ANALYTICS IMPLEMENTATION PREP
==================================================

Si se puede construir sin IDs/secrets:
- preparar code/config skeleton;
- environment/settings placeholders;
- consent-aware;
- no duplicate firing;
- test harness.

NO conectar cuentas externas.
NO instalar paid apps.

==================================================
16. SECURITY RE-AUDIT FOR SHOPIFY SCOPE
==================================================

Auditar SOLO Shopify work:
- no secrets in theme/app ZIP;
- no customer PII logs;
- app proxy HMAC;
- session token validation;
- CSP implications;
- external assets;
- unsafe inline only where Shopify theme requires;
- open redirects;
- URL injection;
- Liquid escaping;
- cart/search XSS surfaces;
- legal HTML sanitization assumptions;
- file upload provenance.

No redo custom Next pentest.

Crear:
theme/03E-shopify-security-readiness.md

==================================================
17. PERFORMANCE REAL BASELINE
==================================================

Con catálogo real, medir:
- Home
- representative Collection
- representative PDP
- Search
- Cart

Desktop + mobile.

Usar available browser metrics:
- LCP approximation
- CLS
- JS errors
- asset failures
- image dimensions/oversize
- total large assets
- lazy loading correctness

No perseguir un Lighthouse artificial si la preview bar distorsiona.
Separar artefactos Shopify preview de fallos reales del theme.

Crear:
theme/03E-performance-baseline.md

==================================================
18. ACCESSIBILITY FINAL PASS — CURRENT SCOPE
==================================================

Focused final audit:
- keyboard nav
- focus order
- drawers/dialogs
- predictive search
- filters
- size picker
- wishlist
- cart
- password
- legal pages
- contrast
- image alt coverage
- reduced motion where relevant

Fix only reproducible issues.

==================================================
19. CUSTOMER ACCOUNT / WISHLIST PACKAGE READINESS
==================================================

App still offline unless owner steps happen.

Re-run:
- 156/156 app tests
- 19/19 mutants
- packaging deterministic
- secret scan
- config schema validation
- extension syntax/build checks possible offline

Prepare ONE exact owner workflow:
1. login/link app
2. custom distribution
3. install/scopes
4. deploy backend
5. env secrets
6. metafield definition
7. enable app embed
8. real login
9. merge test
10. cross-device test

No ask before 13:00.

==================================================
20. MANUAL-BLOCKER CONSOLIDATION
==================================================

By end of 03E produce:
theme/03E-owner-actions-one-shot.md

Keep it SHORT and ordered by what unlocks most.

Possible current items:
- customer login code
- Search & Discovery OAuth
- custom app developer login/distribution/install
- upload media if still blocked
- legal page writes if still blocked
- shipping rate decision
- business identity/legal fields
- analytics account IDs/connectors
- Wompi/provider owner activation

Do not include routine tasks Claude can do.

==================================================
21. THEME FIXES / RELEASE
==================================================

If 03E exposes theme bugs:
- reproduce;
- fix;
- tests;
- Theme Check;
- push ONLY unpublished Radaelli theme;
- remote parity;
- create RC1.5 deterministic ZIP.

If no theme changes:
RC1.4 remains current.

Never touch Horizon.

==================================================
22. DO NOT TOUCH
==================================================

NO:
- publish theme
- domain/DNS
- commercial Shopify store creation
- Production
- Staging
- Vercel
- Neon
- real payment
- billing/charge approval
- Wompi activation
- tax activation
- final shipping rate if source/decision absent
- main
- merge
- PR

==================================================
23. REPORT
==================================================

Create:
shopify-migration/theme/03E-commercial-readiness-report.md

Include at minimum:

1. model
2. elapsed
3. usage
4. search index final coverage
5. mostaza result
6. Search & Discovery status
7. checkout baseline
8. Wompi Shopify feasibility verdict
9. payment owner blockers
10. shipping source recon result
11. free-shipping threshold evidence
12. below-threshold rate status
13. legal pages migrated count
14. legal blockers
15. media prepared count
16. media uploaded count
17. Hero wiring status
18. collection media wiring status
19. size guide media status
20. redirect plan rows
21. redirect Dev test
22. canonical audit
23. robots/sitemap audit
24. analytics architecture
25. analytics implementation prep
26. security audit result
27. secret scan
28. performance baseline
29. accessibility final pass
30. wishlist app re-test
31. wishlist package deterministic
32. owner one-shot file created
33. theme changed YES/NO
34. release/hash
35. Theme Check errors/warnings
36. regression suite
37. fatal JS
38. fatal Liquid
39. Horizon untouched
40. Radaelli unpublished
41. catalog 29/98/95
42. Production/Staging/main touched NO
43. payments activated NO
44. owner-only blockers
45. blockers for 03F
46. READY FOR 03F YES/NO
47. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

==================================================
24. HANDOFF
==================================================

At completion:

Update:
ai-handoff/claude-result.md

Create:
ai-handoff/archive/03E-result.md

Update status.md:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03E
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 03F
CURRENT_MODEL: OPUS 5.5 ULTRACODE
STATUS: READY_FOR_CHATGPT_REVIEW

Push ONLY handoff Markdown to origin/ai-handoff.

Send:
HANDOFF READY 03E

Use CURRENT cadence:
Check 1: +1 minute
Check 2: +2 additional minutes
Check 3: +5 additional minutes

If READY_FOR_CLAUDE_03F appears:
continue immediately.

If not ready after ~8 minutes:
stop only the handoff wait.
Do not invent 03F.

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
