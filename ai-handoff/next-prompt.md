# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03G
PHASE: 03G — LAUNCH REHEARSAL + PARITY AUDIT + COMMERCIAL MIGRATION PACKAGE
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

AUTONOMY:
Daniela sigue ocupada. No pedir acciones manuales ni approvals. Mantener owner-only blockers diferidos. No publicar, no DNS, no pagos reales, no instalar apps, no cambiar mercado/envíos, no tocar Production/Staging/Vercel/Neon/main.

03F APROBADA:
- Redirects 47/47 importados y probados.
- RC1.7 vigente, unpublished.
- RC1.7 SHA-256: 5bea536f102a80fd206de797b0c59dff4687558e75232d5833f541709cdc4b0b
- Wishlist app 0.1.2 SHA-256: 19c8c0df68a30533b6e3b953729d525afd784a4518e2dbb6691bc8ddc919e4b2
- Theme Check 0/0.
- Theme regression 70/70.
- App 156/156 tests, 20/20 mutants.
- Search 29/29.
- Catalog 29/98/95.
- Horizon live intacto.
- Radaelli unpublished.
- Pagos OFF.
- Bloqueo crítico owner-only A1: zona de envío Colombia y luego mercado principal Colombia.

OBJETIVO:
Hacer todo el trabajo independiente previo al lanzamiento y preparar un paquete reproducible Dev → tienda comercial, sin ejecutar cambios irreversibles.

1. AUDITORÍA READ-ONLY DEL SITIO CUSTOM ACTUAL
Inventariar Home, categorías/colecciones, productos, search, cart, legales/ayuda, header/footer, redirects públicos, CTA, precios, sale, media y responsive.
Crear:
shopify-migration/launch/03G-current-site-baseline.md

2. PARIDAD DE RUTAS
Comparar sitio actual vs Shopify Dev.
Crear:
shopify-migration/launch/03G-route-parity.csv
Campos:
surface,current_url,shopify_url,status,content_parity,function_parity,visual_parity,known_dependency,action_needed
Estados:
PASS, PASS_WITH_INTENTIONAL_CHANGE, BLOCKED_BY_OWNER, MISSING, NOT_APPLICABLE.

3. PARIDAD DE PRODUCTOS
Auditar los 29:
title, handle/redirect, collection, color, sizes, SKU, price, compare-at, image count/order, description, wishlist heart, PDP route.
Crear:
shopify-migration/launch/03G-product-parity.csv
Target 29/29 reconciliados.
No consultar Neon.

4. PARIDAD DE COLECCIONES
Validar:
Oasis 10
Aurora 12
Espuma 7
Salidas 0
Destacados 7
Comparar order cuando exista fuente, cards, precios, banners/fallback, sorting, filters, mobile grid.

5. PARIDAD HOME
Comparar:
announcement, hero, categories, editorial, destacados, recommended, promo, newsletter, footer.
Separar:
matched / sourced-but-owner-upload-pending / editorial-pending / intentionally-hidden.
Crear:
theme/03G-home-parity.md

6. SWEEP RESPONSIVE
Si browser usable:
320,375,390,430,768,1024,1280,1440.
Superficies:
Home, 4 colecciones, Destacados, 5 PDP, Search, Cart, Favorites, Garantía, Reembolso, Password.
Criterios:
0 overflow, 0 broken images, 0 untranslated keys, 0 invisible headings, 0 stale US/USD storefront copy.
Si la ventana no permite medición visual, usar DOM/layout determinista y documentar límite.

7. CHECKOUT PRECONDITION AUDIT
Sin ejecutar A1:
- documentar precondiciones Colombia;
- confirmar failure mode actual esperado;
- confirmar que no hay rutas legacy Wompi enlazadas desde el theme;
- documentar return-to-cart/checkout structure sin crear orden.
Crear:
launch/03G-checkout-precondition-audit.md

8. SNAPSHOT NO SECRETO DE DEV STORE
Crear:
shopify-migration/launch/03G-dev-store-snapshot.json
Incluir:
themes, locales, currency, market summary, catalog counts, collections, pages, redirects, menus, installed app summary, customer accounts state, critical theme flags, metafield/metaobject definitions, wishlist sync flag, free-shipping flag, search/filter state, payment state, shipping summary.
Sin secretos.

9. RELEASE FREEZE
Si no hay cambios de theme, congelar RC1.7.
Si se descubre bug real:
fix + tests + Theme Check + remote parity + RC1.8.
Crear:
launch/03G-release-freeze.md
Incluir hashes de theme, app, catalog artifacts, redirects, legal content, media manifest y scripts principales.

10. PLAN DEV → TIENDA COMERCIAL
Crear:
launch/03G-commercial-store-migration-plan.md
Secuencia futura:
crear tienda comercial; base país/moneda/zona; theme; catálogo; colecciones/metafields/metaobjects; menús/páginas/redirects; media; apps oficiales; app wishlist; shipping; Wompi; analytics; accounts; E2E; dominio; publish; post-launch.
Para cada paso:
owner vs Claude, reversible vs irreversible, dependencia, evidencia, rollback.

11. AUDITORÍA DE REPRODUCIBILIDAD
Verificar si una tienda limpia puede reconstruirse con artefactos actuales.
Revisar:
catalog CSVs, media fixes, collection mappings, metafield definitions, redirects, menus, theme zip, app zip, legal content, media wiring, analytics skeleton.
Detectar cualquier estado que exista solo en Admin y no esté documentado.
Crear:
launch/03G-reproducibility-gap-audit.md

12. CUTOVER RUNBOOK
Crear:
launch/03G-cutover-runbook.md
Timeline:
T-24h, T-4h, T-1h, T-15m, T0, T+15m, T+1h, T+24h.
Incluir:
catalog freeze, redirects, DNS, SSL, payment smoke, order/email smoke, analytics smoke, rollback criteria.
No ejecutar.

13. ROLLBACK PLAN
Crear:
launch/03G-rollback-plan.md
Cubrir:
theme rollback, DNS rollback, payment disable, shipping disable, app disable, redirects rollback, retorno a sitio custom, preservación de órdenes y wishlist/account data.
No ejecutar.

14. LAUNCH ACCEPTANCE CHECKLIST
Crear:
launch/03G-launch-acceptance-checklist.md
Hard gates:
Colombia checkout, COP, shipping, Wompi test success/failure, pending behavior documented, order creation, confirmation email, 29/98/95, no broken images, redirects, analytics, login, guest wishlist, account wishlist sync, filters, search, legales, mobile, accessibility, performance, 0 fatal JS/Liquid, exact release hash, rollback ready.
Estado actual:
PASS / BLOCKED / PENDING OWNER / NOT YET EXECUTED.

15. POST-LAUNCH MONITORING
Crear:
launch/03G-post-launch-monitoring.md
Primeras 24h:
checkout errors, payment states, duplicate orders, inventory anomalies, 404s, cart errors, analytics, email failures, account errors, performance.
No inventar business KPI targets.

16. OWNER BATCH
Usar:
theme/03F-owner-actions-minimal.md
Actualizar solo si 03G descubre algo verdaderamente necesario.
NO presentarlo a Daniela todavía.

17. SECURITY/SECRET CHECK
Escanear theme zip, app zip, migration artifacts, launch docs, analytics skeleton, legal content.
Target:
0 secrets/tokens/cookies/private keys/customer PII.

18. FINAL REGRESSION
Re-run:
Theme Check, theme regression, critical mutants si hubo cambios, app tests/mutants, catalog counts, redirect count, SEO validators, media wiring tests, secret scan.
No bump de versión si no hubo cambios reales.

19. DO NOT TOUCH
No owner actions.
No market/shipping writes.
No apps/OAuth.
No payments/Wompi.
No analytics account connections.
No publish.
No commercial store.
No DNS.
No Production/Staging/Vercel/Neon/main/merge/PR.

20. REPORT
Crear:
shopify-migration/theme/03G-launch-rehearsal-report.md

Debe incluir:
1 model
2 elapsed
3 usage
4 current-site baseline
5 route parity
6 product parity 29/29
7 collection parity
8 Home parity
9 responsive sweep
10 checkout precondition
11 Dev snapshot
12 release freeze
13 commercial migration plan
14 reproducibility gaps
15 cutover runbook
16 rollback plan
17 launch acceptance checklist
18 post-launch monitoring
19 owner batch changed YES/NO
20 secret scan
21 Theme Check
22 theme regression
23 app tests
24 app mutants
25 catalog 29/98/95
26 redirects 47/47
27 Horizon untouched
28 Radaelli unpublished
29 payments activated NO
30 Production/Staging/main touched NO
31 blockers for 03H
32 READY FOR 03H YES/NO
33 CERO TAREAS DE SEGUNDO PLANO ACTIVAS

HANDOFF:
Actualizar claude-result.md.
Crear archive/03G-result.md.
Actualizar status.md a:
LAST_COMPLETED_PHASE: 03G
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 03H
CURRENT_MODEL: SONNET 5.5
STATUS: READY_FOR_CHATGPT_REVIEW

Enviar:
HANDOFF READY 03G

Luego checks finitos:
+1 min, +2 min adicionales, +5 min adicionales.
Si aparece READY_FOR_CLAUDE_03H, continuar.
No pedir owner batch salvo que Daniela diga explícitamente que está lista.

No watchers, no loops infinitos, no esperas indefinidas.
