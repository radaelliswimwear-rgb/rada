# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03F

PHASE: 03F — SONNET EFFICIENCY PASS + REDIRECTS/PERFORMANCE + OWNER-BLOCKER PREP
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION
FASE 03F — AVANZAR TODO LO INDEPENDIENTE MIENTRAS OWNER-ONLY SIGUE DIFERIDO

==================================================
MODEL SWITCH CONFIRMED
==================================================

Daniela confirmó a las 14:29 hora Colombia que Claude ya está en Sonnet 5.5.

Usar Sonnet para esta fase.

No cambiar de modelo salvo instrucción posterior.

==================================================
AUTONOMY — HIGHEST PRIORITY
==================================================

Daniela sigue ocupada.

NO pedirle ahora:
- login code;
- OAuth;
- Search & Discovery install;
- custom app install;
- legal approvals;
- media upload approval;
- shipping rate decision;
- payment activation;
- Wompi activation;
- analytics account connection;
- billing;
- business identity fields.

Todo eso queda como DEFERRED_OWNER_ONLY_BLOCKER.

Seguir trabajando en todo lo independiente.

No idle.

Cadencia actual de handoff:
+1 min → +2 min → +5 min.

==================================================
03E — REVIEWED AND APPROVED
==================================================

Estado confirmado:
- RC1.5 created and uploaded, unpublished.
- Horizon live and untouched.
- Search index 29/29.
- Search term MOSTAZA works with flat tag MOSTAZA.
- Checkout baseline opens with correct item/variant/subtotal.
- Wompi verdict: SUPPORTED VIA OFFICIAL APP/PROVIDER.
- Two launch-critical owner blockers measured live:
  C1: store/market resolves as United States.
  C2: Colombia catalog appears sold out because no Colombia shipping zone/location setup.
- Shipping threshold evidence: COP 299,900.
- Below-threshold shipping rate: NOT_SET.
- Legal migrated: Refund + Warranty.
- Four other legal pages prepared verbatim but blocked by permissions/approval.
- Media source mapping found for exact real assets.
- Redirect package prepared: 47 rows / 102 URLs classified.
- Analytics plan + disabled custom pixel skeleton prepared.
- Security and accessibility fixes applied.
- Wishlist app 0.1.1 package ready; 156/156 tests + 20/20 mutants.
- Theme regression 69/69.
- Theme Check 0/0.
- Responsive matrix 63/63.
- Catalog remains 29/98/95.
- Production/Staging/main untouched.

RC1.5 SHA-256:
1a506a41ae482d7c1426dc9228e5a16f4659631a338804c1680f5de1317cf2e2

Wishlist app 0.1.1 SHA-256:
f14f068a962a617d255c9cfba6a9ba581496c5c6b3c7dc4713ac2b4bb1be1de8

==================================================
OBJECTIVE
==================================================

Use Sonnet to finish all technical/mechanical work that does NOT require Daniela.

Primary targets:
A. import/test redirects in Dev if the authenticated Admin is usable;
B. complete real mobile/performance measurements;
C. harden launch scripts and one-shot owner workflows;
D. prepare exact reversible scripts/checklists for market/shipping/payment steps;
E. prepare Wompi sandbox activation runbook without activating;
F. prepare Search & Discovery post-install configuration package;
G. prepare media upload/wiring package completely;
H. prepare analytics activation package completely;
I. run final regression/security/SEO integrity after all independent changes;
J. leave owner manual batch as short as technically possible.

NO publish.
NO DNS.
NO real payments.
NO billing.
NO commercial store creation.

==================================================
1. REDIRECT IMPORT — DEV STORE
==================================================

Artifact already prepared:
shopify-migration/seo/shopify-redirects-import.csv

If Shopify Admin window is usable and this action is safe/reversible:
- import redirects into Development Store;
- validate all imported rows;
- detect duplicate/conflict/rewrite issues;
- test representative redirects;
- ensure no loops;
- ensure destinations are current Shopify Dev URLs.

If Admin cannot render or import is blocked:
- do not wait;
- leave import-ready artifact + exact 1-minute step.

Create/update:
shopify-migration/seo/03F-redirect-import-result.md

==================================================
2. PERFORMANCE — REAL MEASUREMENTS
==================================================

03E could not fully measure LCP/mobile because the window was backgrounded.

Now re-measure with visible/usable browser if possible:
- Home
- Collection
- PDP
- Search
- Cart

At:
- 390 mobile
- 1280 desktop

Capture:
- LCP approximation or browser performance timing available
- CLS
- asset failures
- blocking JS
- image oversized issues
- first-row eager behavior
- lazy loading behavior
- preview-bar artifacts separated from theme issues

Do not chase synthetic score for its own sake.

Update:
theme/03E-performance-baseline.md
or create:
theme/03F-performance-final.md

==================================================
3. MOBILE CHECKOUT BASELINE
==================================================

If native checkout can be opened safely without creating an order:
- validate on mobile viewport;
- item;
- talla;
- subtotal;
- COP;
- locale;
- address-country behavior;
- return to cart;
- no double discount.

Do not complete payment.
Do not create a real order.

Document:
theme/03F-mobile-checkout-baseline.md

==================================================
4. MARKET / COUNTRY OWNER RUNBOOK
==================================================

Prepare exact owner-safe runbook to resolve C1 without executing it.

Need:
- current store address snapshot;
- current primary market snapshot;
- current fallback region;
- current storefront locale/currency behavior;
- desired post-change state for Colombia;
- exact steps;
- reversible checkpoints;
- what changes are destructive vs reversible;
- verification after change;
- effect on Wompi provider availability;
- effect on checkout locale;
- effect on existing Dev catalog.

Create:
theme/03F-owner-market-colombia-runbook.md

No change until Daniela explicitly starts manual batch.

==================================================
5. SHIPPING OWNER RUNBOOK
==================================================

Prepare exact runbook to resolve C2.

Need:
- current shipping profile;
- current location(s);
- Colombia zone design;
- free shipping >= 299900;
- below-threshold rate remains NOT_SET unless real source appears;
- no weight-based rates because weights are unavailable;
- how to avoid catalog showing sold out in Colombia;
- post-change QA;
- rollback steps.

Create:
shipping/03F-owner-shipping-runbook.md

Do NOT invent the under-threshold price.

==================================================
6. WOMPI ACTIVATION RUNBOOK
==================================================

Use official/current evidence already gathered.

Prepare:
payments/03F-wompi-owner-runbook.md

Include:
- exact prerequisite: store country/market corrected first;
- where Wompi should appear in Shopify;
- official app/provider flow;
- OAuth/permissions;
- sandbox/test credentials required;
- event/webhook URL requirements;
- return URL behavior;
- test-mode checklist;
- no production credentials in Dev;
- success/failure/pending/refund cases to test;
- Shopify third-party provider fee note;
- what is NOT_VERIFIED and must be checked in UI or with Wompi.

Do NOT activate.
Do NOT accept billing.
Do NOT insert secrets.

==================================================
7. SEARCH & DISCOVERY INSTALL PACKAGE
==================================================

Prepare:
theme/03F-search-discovery-owner-runbook.md

Target post-install filters:
- Talla
- Color from custom.color
- Precio
- NO Disponibilidad while inventory is untracked

Include:
- owner OAuth step;
- exact configuration;
- expected filter handles;
- QA matrix;
- rollback/remove app effect.

No install until Daniela explicitly starts owner batch.

==================================================
8. MEDIA PACKAGE — FULL PREPARATION
==================================================

Use existing media manifest.

Without downloading/uploading if approval is still required:
- validate all URLs;
- validate dimensions;
- validate filenames;
- validate which items exceed Shopify limits;
- precompute exact c_limit transformations needed;
- prepare expected hashes where possible from source metadata;
- prepare destination naming;
- prepare mapping to:
  Hero
  collection cards
  collection banners
  size guide

Create:
content/media/03F-media-owner-runbook.md

If source can be downloaded locally without any approval violation and prior instructions permit:
only do so if 03E explicitly allowed it.
Otherwise do not.

==================================================
9. MEDIA WIRING SCRIPT HARDENING
==================================================

Audit:
scripts/apply-media-wiring.mjs
and related mapping.

Add:
- dry-run mode;
- required-file validation;
- duplicate prevention;
- exact Shopify file IDs mapping validation;
- no partial writes if mapping incomplete;
- rollback snapshot where possible;
- clear output report.

Run with fake/synthetic mapping only.

No real file wiring without actual Shopify files.

==================================================
10. LEGAL ONE-SHOT PACKAGE
==================================================

Four pending legal pages are already verbatim.

Prepare one owner workflow:
theme/03F-legal-owner-runbook.md

For each:
- exact title;
- exact handle;
- exact source file;
- exact destination;
- dependencies on business identity;
- fields that must remain blank until Daniela supplies data;
- footer link target;
- QA after publish to Dev.

Do not rewrite the legal text.

==================================================
11. ANALYTICS OWNER PACKAGE
==================================================

Prepare:
analytics/03F-analytics-owner-runbook.md

Target:
- Google & YouTube app / GA4
- Facebook & Instagram / Meta
- optional Radaelli custom pixel for gaps only

Include:
- exact owner account connections needed;
- consent/customer privacy prerequisites;
- test event checklist;
- deduplication checklist;
- purchase event validation;
- no double firing;
- which IDs/secrets are required;
- what can remain off until commercial launch.

Keep custom pixel disabled.

==================================================
12. WISHLIST APP OWNER PACKAGE
==================================================

Existing:
app/OWNER-WORKFLOW.md

Audit and simplify it to a minimal sequence.

Prepare:
app/03F-owner-wishlist-install-runbook.md

Sequence should cover:
1. developer login
2. app link
3. custom distribution
4. install scopes
5. backend deploy target
6. env secrets
7. customer metafield custom.wishlist
8. app embed
9. account extension
10. real login code
11. guest-to-account merge
12. cross-device test
13. logout
14. uninstall/reinstall survivability where appropriate

No owner action now.

==================================================
13. APP PACKAGE FINAL RECHECK
==================================================

Re-run:
- 156/156 tests
- 20/20 mutants
- deterministic zip
- secret scan
- extension syntax/build checks possible without Shopify login
- config consistency
- README/runbook consistency

If code does not change:
keep 0.1.1 hash.

If code changes:
version 0.1.2 and deterministic package.

==================================================
14. THEME FINAL REGRESSION
==================================================

Re-run:
- Theme Check
- 69/69 regression
- current mutants relevant to changed files
- secret scan
- remote parity if theme changes

If no theme change:
RC1.5 remains current.

If theme changes:
create RC1.6 deterministic ZIP.

Never touch Horizon.

==================================================
15. SEO FINAL VALIDATION
==================================================

Validate:
- redirect CSV
- canonical
- noindex for search/favorites/404
- hreflang /en
- sitemap
- product URLs
- collection URLs
- legal URLs
- no loops
- no broken destination

No invented meta descriptions.

==================================================
16. OWNER BATCH MINIMIZATION
==================================================

Update/create:
theme/03F-owner-actions-minimal.md

Goal:
reduce owner work to the fewest clicks/decisions possible.

Separate into:

A. REQUIRED TO UNBLOCK DEV STORE
- Colombia market/address
- Colombia shipping zone/location
- login code
- Search & Discovery OAuth
- wishlist app OAuth/install
- media upload approval/action

B. REQUIRED BEFORE COMMERCIAL LAUNCH
- Wompi activation
- below-threshold shipping rate decision
- business identity/legal fields
- analytics account connections
- domain/publish later

C. OPTIONAL/EDITORIAL
- Home meta description
- recommended-for-you curation
- voseo/tuteo
- CTA contrast brand choice if still applicable

Each item:
- owner time estimate
- what it unlocks
- Claude follow-up immediately after

==================================================
17. DO NOT TOUCH
==================================================

NO:
- theme publish
- Horizon changes
- market/address change
- shipping profile writes
- payment activation
- Wompi install
- Search & Discovery install
- wishlist app install
- OAuth acceptance
- billing
- DNS/domain
- commercial Shopify store
- Production
- Staging
- Vercel
- Neon
- main
- merge
- PR

==================================================
18. REPORT
==================================================

Create:
shopify-migration/theme/03F-sonnet-independent-completion-report.md

Include:

1. model = Sonnet 5.5
2. elapsed
3. usage exact/UNAVAILABLE
4. redirects imported YES/NO
5. redirect QA
6. mobile performance result
7. desktop performance result
8. mobile checkout baseline
9. market runbook ready
10. shipping runbook ready
11. Wompi runbook ready
12. Search & Discovery runbook ready
13. media runbook ready
14. media wiring script hardened
15. legal runbook ready
16. analytics runbook ready
17. wishlist owner runbook ready
18. app tests
19. app mutants
20. app package/hash
21. Theme Check
22. theme regression
23. theme package/hash
24. SEO final validation
25. owner minimal batch created
26. owner critical blockers
27. catalog 29/98/95
28. Horizon untouched
29. Radaelli unpublished
30. payments activated NO
31. Production/Staging/main touched NO
32. blockers for 03G
33. READY FOR 03G YES/NO
34. CERO TAREAS DE SEGUNDO PLANO ACTIVAS

==================================================
19. HANDOFF
==================================================

At completion:

Update:
ai-handoff/claude-result.md

Create:
ai-handoff/archive/03F-result.md

Update status.md:

PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03F
CURRENT_PHASE: WAITING_FOR_CHATGPT
NEXT_PHASE: 03G
CURRENT_MODEL: SONNET 5.5
STATUS: READY_FOR_CHATGPT_REVIEW

Push ONLY handoff Markdown to origin/ai-handoff.

Send:
HANDOFF READY 03F

Then use:
Check 1: +1 minute
Check 2: +2 additional minutes
Check 3: +5 additional minutes

If READY_FOR_CLAUDE_03G appears:
continue immediately.

Do NOT ask Daniela for the owner batch unless she explicitly says she is ready.

==================================================
BACKGROUND RULE
==================================================

No detached watchers.
No infinite loops.
No indefinite waits.

Keep owner-only blockers deferred.
Continue all independent work.
