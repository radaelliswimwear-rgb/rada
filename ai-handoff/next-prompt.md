# NEXT PROMPT

STATUS: READY_FOR_CLAUDE_03K
PHASE: 03K — ACCELERATED AUTONOMOUS COMPLETION BEFORE FINAL STORE CUTOVER
MODEL: SONNET 5.5

RADAELLI SWIMWEAR — SHOPIFY MIGRATION

USER OVERRIDE — HIGHEST PRIORITY
Daniela is explicitly frustrated by repeated manual questions and wants maximum forward progress NOW.

Effective immediately:
- DO NOT ask Daniela any more questions about Envia.com, shipping price, Wompi, Shopify plan, store transfer, legal entity, credentials, apps, OAuth, billing, domain, inventory, XL, or other owner decisions while meaningful safe autonomous work remains.
- DEFER every blocker that genuinely requires Daniela, credentials, billing, legal acceptance, paid plan selection, irreversible action or final merchant-store creation.
- Do NOT idle on a blocker. Move to the next independent task.
- Do NOT manufacture more manual checkpoints.
- Do NOT repeatedly research the same shipping/Wompi question.
- Do NOT install Envia.com or Wompi in the current Development Store.
- Do NOT create a paid Shopify commitment.
- Do NOT publish or cut over the domain.

The current `radaelli-swimwear-dev` remains a QA/build sandbox. It may be used for safe theme/catalog/content testing. It is NOT to be treated as the final merchant launch store.

IMPORTANT STRATEGIC RULE
Shipping integration and Wompi are now DEFERRED FINAL-STORE ITEMS.
If they cannot be fully validated in the current Dev Store without owner intervention or plan/payment commitments, record the blocker once and continue.
They will be completed on the real Colombia launch store at final cutover.

PRIMARY OBJECTIVE
Advance the project as far as technically possible without Daniela until the store package is genuinely launch-ready except for the smallest final owner-only/cutover batch.

ONE ACTIVE PROCESS ONLY
- No subagents.
- No workflows.
- No broad repeated crawls.
- No repeated 03G mega-audits.
- Use existing evidence and deterministic scripts.
- One write wave at a time.
- Verify after each write wave.

SOURCE OF TRUTH
Preserve and reuse:
- RC1.9 and its manifest;
- catalog 29 products / 98 variants / 95 images;
- collections/mappings;
- metafields/metaobjects;
- redirects 47/47;
- existing legal/page drafts;
- menus/navigation;
- wishlist app package and tests;
- 03G–03J launch/checklist/reproducibility artifacts;
- all deterministic validators and E2E evidence.

DO NOT REBUILD FROM SCRATCH.

WORKSTREAM A — FINISH ALL SAFE THEME/UI QUALITY WORK
Audit only the still-open theme/UI items already documented, not the whole site from zero.
Complete every change that does NOT require a new owner business decision.
Include, when safely sourced from existing evidence:
- unresolved Home parity items that are purely technical/content wiring;
- header/footer cleanup already sourced;
- SEO metadata wiring where values are already known;
- Open Graph/Twitter/JSON-LD implementation using existing brand/catalog data;
- accessibility fixes that are objective and non-editorial;
- mobile/responsive defects already documented;
- H-01 contrast if it remains open and can be fixed objectively;
- missing translation keys or locale fallbacks;
- broken/weak empty states;
- 404/error-state polish;
- cart/search/account/wishlist UX issues that do not require app installation/OAuth.

If these changes produce a new theme release:
- create RC1.10 (or next sequential RC only once);
- Theme Check 0/0;
- full regression 100% PASS;
- targeted mutants for changed behavior;
- deterministic build twice with same hash;
- upload only to unpublished Radaelli theme in Dev Store;
- verify remote = ZIP exact parity;
- preserve RC1.9 as rollback.

WORKSTREAM B — CONTENT / LEGAL / NAVIGATION PREPARATION
Without inventing legal facts:
- finish every page/menu/footer/navigation artifact whose exact content already exists in project evidence;
- prepare the four missing legal routes/pages as COMPLETE DRAFTS using only previously sourced current-site text;
- do NOT invent NIT, legal company name, physical legal address or policy commitments;
- where an owner field is missing, leave a clear placeholder token in the source artifact, not storefront production output;
- prepare exact redirect mapping for `/envios`, `/terminos`, `/privacidad`, `/cookies` so final-store import is deterministic;
- verify no broken links among all prepared pages/navigation.

Do not publish legal pages to a final commercial store because none exists yet. Safe Dev preview is allowed if it does not misrepresent missing owner facts.

WORKSTREAM C — SEO / DISCOVERABILITY PACKAGE
Finish everything that can be prepared offline or in the Dev theme without account integrations:
- canonical behavior;
- titles/descriptions from existing product/collection data;
- Open Graph/Twitter tags;
- product/collection/organization/breadcrumb structured data as appropriate;
- sitemap/robots assumptions documented for final Shopify store;
- 47 redirects validated;
- all current-site legacy routes classified;
- no indexable Dev/password-only artifacts accidentally treated as production evidence.

Run deterministic SEO validators and fix objective failures only.

WORKSTREAM D — PERFORMANCE / ACCESSIBILITY / RESPONSIVE FINAL PASS
Do a targeted final quality pass, not another huge exploratory audit.
Required surfaces:
- Home;
- four main collections + Destacados;
- representative PDPs across collections;
- Search;
- Cart;
- Favorites;
- Garantía/Reembolso/legal drafts;
- Password.

Required widths: 320, 390, 768, 1440.
Check:
- no horizontal overflow;
- no broken images;
- no fatal JS/Liquid;
- sensible heading hierarchy;
- keyboard/focus basics where measurable;
- contrast for known objective failures;
- image dimensions/alt where source exists;
- no stale US/USD storefront copy in Colombia context;
- no raw translation keys.

If browser paint metrics are unavailable, document that limit and use deterministic DOM/layout checks; do not block the phase solely on hidden Chrome limitations.

WORKSTREAM E — CATALOG / COLLECTION / DATA MIGRATION READINESS
Do NOT alter business decisions, inventory quantities or XL without owner input.
But finish all deterministic migration preparation:
- authoritative export/import package for 29/98/95;
- collection membership mapping;
- metafield/metaobject definitions;
- image/media mapping;
- price/compare-at validation;
- SKU validation;
- handles/redirect mappings;
- deterministic inventory template ready for later owner quantities;
- explicit decision placeholder for the one XL discrepancy;
- exact validation scripts for future clean-store import.

Goal: on the real Colombia store, migration should be a repeatable script/import process, not manual rebuilding.

WORKSTREAM F — WISHLIST / CUSTOMER ACCOUNT PACKAGE
Without installing/OAuth if blocked:
- finish code/package/tests for wishlist and account sync architecture;
- verify guest wishlist behavior in Dev;
- verify account-sync code paths offline/deterministically;
- package exact installation/configuration instructions for the real store;
- ensure secrets/config are externalized;
- document only the unavoidable owner/OAuth step.

Do not ask Daniela to install anything now.

WORKSTREAM G — ANALYTICS / EMAIL / OPERATIONS PREP
Without connecting real accounts:
- finish analytics event specification/data-layer skeleton already designed;
- define exact final-store verification for product view, add-to-cart, checkout start, purchase and relevant wishlist/account events;
- prepare email/notification QA checklist;
- confirm order-confirmation evidence already collected from test gateway and flag only inbox-delivery confirmation if still owner-only;
- prepare post-launch monitoring and rollback commands/checklists.

Do not create or connect paid analytics/email accounts.

WORKSTREAM H — REPOSITORY / REPRODUCIBILITY / BACKUP
Daniela's current instruction to advance and preserve work counts as authorization to create a SAFE DEDICATED BACKUP BRANCH for project artifacts, provided:
- NEVER push/merge to `main`;
- NEVER create a PR;
- NEVER include secrets, cookies, tokens, private keys, customer PII or full private address;
- run secret scan first;
- use a dedicated branch such as `shopify-migration-backup` or equivalent;
- commit the reproducible Shopify migration artifacts/code/docs needed to prevent local-only loss;
- exclude ephemeral browser/session evidence and anything sensitive;
- verify the branch exists remotely after push.

This resolves the critical G03 risk that `shopify-migration/` existed only locally.

WORKSTREAM I — CLEAN-STORE MIGRATION RUNBOOK
Prepare a single deterministic final-store bootstrap procedure for a Colombia merchant/transferable store:
1. create/identify correct Colombia store;
2. base locale/currency/timezone;
3. upload final RC theme unpublished;
4. import catalog 29/98/95;
5. collections/metafields/metaobjects;
6. pages/menus/redirects;
7. media;
8. wishlist/app installation only when owner authorizes;
9. shipping integration only when final store/plan chosen;
10. Wompi sandbox first, then production only after owner approval;
11. analytics;
12. E2E;
13. domain;
14. publish;
15. 24h monitoring.

For each step include command/tool, evidence, PASS criterion and rollback.
No invented credentials or business values.

WORKSTREAM J — FINAL BLOCKER MINIMIZATION
At the end, regenerate the blocker matrix and classify every remaining item as:
- DONE;
- FINAL-STORE ONLY;
- OWNER DECISION;
- OWNER AUTH/OAUTH;
- BILLING/PLAN;
- LEGAL DATA;
- FINAL CUTOVER;
- OPTIONAL/DEFERRABLE.

Target: reduce the owner batch to the fewest possible actions.

MANUAL-QUESTION RULE
During 03K, DO NOT ask Daniela anything unless ALL meaningful autonomous work above is complete and the phase literally cannot progress further.
If one workstream is blocked, continue another.
Only after exhausting all safe work may you present ONE consolidated, prioritized owner batch.
Do not interrupt her one question at a time during autonomous completion.

SHIPPING / WOMPI RULE
Do not continue the current conversation asking whether she has Envia.com.
Do not ask for a shipping price now.
Do not ask for Wompi keys now.
Do not install either now.
Record:
- Shipping dynamic calculation: FINAL-STORE ONLY / PLAN-DEPENDENT until final Colombia store and Shopify plan are selected.
- Wompi: FINAL-STORE ONLY / OWNER-AUTH until official Colombia store exists; sandbox must be tested there before production.

FINAL RELEASE SAFETY
Before handoff verify:
- current Dev Store preserved;
- Radaelli theme remains unpublished;
- no real payment provider enabled;
- no real money transaction;
- no DNS/domain change;
- no main/merge/PR;
- no commercial-store paid commitment;
- no background processes remain.

REPORT
Create `shopify-migration/theme/03K-autonomous-completion-report.md` and include at least:
1 model
2 elapsed
3 autonomous tasks completed
4 theme release current RC + hash
5 Theme Check
6 regression/mutants
7 responsive/accessibility result
8 SEO result
9 content/legal preparation result
10 catalog migration package result
11 wishlist/account package result
12 analytics/email prep result
13 backup branch created YES/NO + branch name (no secrets)
14 secret scan result
15 clean-store bootstrap runbook result
16 old Dev Store preserved YES/NO
17 shipping status = FINAL-STORE ONLY / other
18 Wompi status = FINAL-STORE ONLY / other
19 remaining blocker count by category
20 exact minimal owner batch remaining
21 percentage estimate: autonomous build readiness
22 READY FOR 03L YES/NO
23 CERO TAREAS DE SEGUNDO PLANO ACTIVAS

HANDOFF
When complete:
- update `ai-handoff/claude-result.md`;
- create `ai-handoff/archive/03K-result.md`;
- update status to LAST_COMPLETED_PHASE: 03K / CURRENT_PHASE: WAITING_FOR_CHATGPT / NEXT_PHASE: 03L / STATUS: READY_FOR_CHATGPT_REVIEW;
- push only handoff files to `ai-handoff` using the established bridge;
- send exactly `HANDOFF READY 03K`;
- perform finite +1 / +2 / +5 minute checks;
- continue only after ChatGPT publishes READY_FOR_CLAUDE_03L.

DO NOT STOP EARLY BECAUSE SHIPPING, WOMPI OR FINAL STORE CREATION IS BLOCKED.
The purpose of 03K is to finish EVERYTHING ELSE first.