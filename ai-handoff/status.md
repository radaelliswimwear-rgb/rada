PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03P-LAB-FINAL-DEEP-AUDIT
CURRENT_PHASE: 03P-NEW-STANDARD-STORE
NEXT_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_MODEL: SONNET 5.5
STATUS: 03P_IN_PROGRESS_MAX_PARALLEL
USER_ABSENCE_MODE: MINIMAL_OWNER_INTERVENTION

CHATGPT FINAL LAB APPROVAL
- 03P-LAB-FINAL-DEEP-AUDIT formally approved.
- Certified lab remains rollback/reference and must not be altered except read-only comparison.
- Baseline: RC1.10 unpublished; data parity 8/8; theme parity 98/98; 29 products / 98 variants / 95 images; inventory 128; 51 redirects; Colombia ACTIVE / US DRAFT; S&D, Envia, Wompi TEST, shipping and notifications evidence all documented.
- Backup source of truth: shopify-migration-backup head 3a13b02500bc7c44d95512d17bca088ac17872ed.

OWNER OPERATING MODE FOR 2026-10-02
- Daniela wants MAXIMUM PRIORITY and MAXIMUM SAFE PARALLELISM.
- Claude may deploy as many subagents/workers as are useful for independent workstreams, with ONE coordinator/orchestrator responsible for sequencing dependencies, reconciling results and enforcing gates.
- Daniela intervenes ONLY for unavoidable owner actions: login/authentication/Google/passkey approval, entering secrets directly into Shopify/Wompi/Envia, explicit billing/plan approval, domain/DNS approval, live-payment authorization, publication/password-removal approval, or an actual business-choice decision.
- Never ask Daniela to do routine navigation, data entry, verification, copying values, testing, screenshots or configuration that Claude can safely perform.
- Never request passwords, MFA codes, passkeys, recovery codes, card numbers, Wompi keys or other secrets in chat/GitHub.

MAX-PARALLELISM SAFETY RULES
- Parallelize ONLY independent tasks.
- ONE coordinator owns the global state machine and gate decisions.
- NEVER let two agents concurrently write the same Shopify object set, inventory quantity, payment configuration, shipping profile, theme settings file, or same GitHub handoff file.
- Serialize these critical operations: store creation, country/origin verification, billing/plan acceptance, inventory writes, shipping profile final write, Wompi configuration, domain/DNS, theme publication, password removal, live-payment activation.
- Read-only audits, source preparation, artifact comparison, image/media verification, SEO checks, report drafting, test-plan preparation and non-overlapping migration batches MAY run in parallel.
- If multiple agents prepare mutations, coordinator must review and apply them in a deterministic order with idempotency/duplicate checks.
- No agent may create another Shopify store, Dev Store, Client Transfer Store or replacement store.
- No agent may touch main/merge/PR.

TIMING — AUTHORITATIVE START CHANGED BY OWNER
- New official start time: **2026-10-02 07:30 America/Bogota**.
- DO NOT create/register the new official store before 07:30.
- At/after 07:30, create a NEW NORMAL merchant store under radaelliswimwear@gmail.com through standard Shopify signup.
- Do NOT use/create a Dev Store and do NOT reactivate/pay/touch the inactive transferred launch store.
- The earlier 08:00 instruction is superseded everywhere by 07:30.

STOPWATCH / PERFORMANCE TELEMETRY — MANDATORY
- Global stopwatch starts immediately before the first official-store signup action at 07:30.
- Coordinator must record timestamps in America/Bogota with seconds when available.
- For EVERY gate and material task/lane record: START_TIME, END_TIME, ELAPSED, ACTIVE_WORK_TIME if distinguishable, BLOCKED/WAIT_TIME, blocker reason, owner-wait time, Shopify/platform-wait time, retries, and outcome.
- Required timing rows at minimum: G0 signup + Colombia origin; promo capture; G1 clean baseline; theme; products/metafields; media; inventory; collections/navigation/legal/redirects; Search & Discovery; shipping; Envia; Wompi TEST setup; billing gate if reached; sandbox E2E; notifications/email; historical assessment; parity G6; storefront regression; final report/handoff.
- Parallel lanes each keep their own timer; coordinator also records wall-clock elapsed for the overall phase so parallel work is not double-counted as project duration.
- Record every avoidable delay or retry over 60 seconds and why it occurred.
- Optimize for speed, but NEVER skip a gate, safety check, parity check or evidence requirement merely to improve timing.
- Include a final timing table and TOTAL WALL-CLOCK TIME in `03P-new-standard-store-report.md`.

COLOMBIA ORIGIN GATE — ABSOLUTE HARD REQUIREMENT
- The official store MUST be created as a Colombia-based merchant store from the start. This is not a later cleanup item.
- Before any migration, app install, billing, payment setup or catalog import, verify and record that Shopify shows the business/store country or region as COLOMBIA.
- Also verify the initial operational settings align with Colombia: currency COP, timezone America/Bogota, weight kg, Colombia intended market ACTIVE, US market DRAFT/inactive.
- If Shopify signup or account defaults to another country/region, DO NOT continue migration and DO NOT accept billing. First correct the country/region to Colombia through the proper Shopify flow. If that cannot be corrected safely without owner action or account recreation, set `OWNER_ACTION_REQUIRED_COLOMBIA_ORIGIN` and report the exact blocker.
- Never create a second replacement store as a workaround without explicit ChatGPT + Daniela instruction.
- Evidence of Colombia origin/settings must be written to the official-store report before G1 can pass.

SHOPIFY OFFER RULE
- Public Shopify Colombia pages checked by ChatGPT on 2026-10-02 still advertise 3 free days and promotional US$1/month for the first 3 months, but account-specific eligibility is not guaranteed.
- Shopify Help confirms the free trial starts when signup begins, not when work starts.
- Inside the new store, capture the exact account-specific trial/promo/plan terms BEFORE any billing commitment.
- If different/absent/materially worse, set OWNER_ACTION_REQUIRED_PROMO and STOP only the billing-dependent branch; continue any independent safe work.

AUTONOMOUS CONTROL PROTOCOL
- `ai-handoff/status.md` is the state machine.
- `ai-handoff/claude-result.md` is Claude's evidence/result log.
- `ai-handoff/next-prompt.md` is authoritative execution plan.
- `shopify-migration-backup` stores privacy-safe evidence/artifacts.
- Coordinator may keep multiple independent subagents active simultaneously.
- At each gate, consolidate evidence to GitHub before advancing dependent mutations.
- If a true owner-only action is required, set exact `OWNER_ACTION_REQUIRED_*` status, explain the one action needed, and continue every independent task that does not depend on it.
- If ChatGPT updates `next-prompt.md`, coordinator must adopt the newest remote instructions before the next irreversible/billing/live/public action.

LAUNCH-DAY GATES
G0 Signup/auth + Colombia-origin verification + promo capture.
G1 Clean-store snapshot + baseline settings.
G2 Deterministic migration from certified lab using parallel independent lanes where safe.
G3 Data/theme parity + storefront regression.
G4 Shipping + Envia + Wompi TEST + sandbox checkout if plan permits.
G5 Email/notification configuration + historical-data assessment.
G6 Billing/promo owner approval if required.
G7 Final pre-launch certification 03Q.
G8 Only after ChatGPT + owner GO: plan/domain/DNS/password/theme publish/Wompi live/real launch actions.

NO-SURPRISE HARD STOPS
- No migration if store country/region is not verified as Colombia.
- No paid-plan commitment without Daniela explicitly approving exact visible terms.
- No production DNS/domain cutover.
- No password removal/public storefront.
- No publishing RC1.10.
- No Wompi LIVE/production credentials use unless explicitly authorized at final launch.
- No real payment/order/Envia label.
- No deletion of certified lab or inactive launch store.
- No main/merge/PR.

PRE-PUBLISH OWNER DECISIONS TO KEEP VISIBLE
- Announcement bar: `20 % DE DESCUENTO EN TODA LA TIENDA` — keep unchanged during migration; owner decides before publication.
- Email verified sender + staff recipients.
- Copy tone (voseo/tuteo).
- Home/Destacados/Todos meta descriptions.
- Empty Salidas de Baño collection/menu choice.
- Optional legacy handle renames + redirects.
- Favorites wording.
- Historical customer/order/newsletter migration when authorized source/perms are available.

NEXT ACTION
At 07:30 America/Bogota, Claude starts the global stopwatch, starts one coordinator plus parallel independent agents, reads `ai-handoff/status.md` and `ai-handoff/next-prompt.md`, verifies COLOMBIA as the official store origin before any migration, and begins 03P-NEW-STANDARD-STORE at maximum safe parallelism. Daniela only performs owner-only actions when explicitly requested.
COORDINATOR_CHECKPOINT 08:03:34 (2026-10-02 America/Bogota): G0 PASS - official store created 07:36-07:40 (stopwatch start 07:36:21), handle wgcvpd-ib.myshopify.com, owner account radaelliswimwear@gmail.com, NORMAL trial store (Shopify trial plan, 3 days left, billing NOT submitted; offer seen in signup: 3 days free, then USD 1/month x3 months from Oct 5, Basic USD 25/month + tax renews Jan 3 2027, domain credit USD 20; card form skipped). Colombia origin: country CO, COP, weight kg, market 'co' ACTIVE (no US market exists), store name set to Radaelli Swimwear; timezone was America/New_York by default and was CORRECTED to America/Bogota before any migration. G1 clean snapshot captured; storefront password-protected; theme Horizon live untouched. DONE: Wave A theme RC1.10 UNPUBLISHED id 191904514347 parity 98/98 (82 exact + 16 semantic); locale es default + en alternate (like lab); shipping 5 zones/33 provinces rates 9900/12900/17900/21900/44900 free >=299900 verified 16/16; waves defs/collections/products(29 prod,98 var,95 img)/membership/publish/pages/policies/menus/redirects(51); inventory 98/98 tracked 128 units; weights 500g x98; S&D filters Talla,Color,Price (no Availability); Envia installed+linked (balance 0, no label); Home page collection emptied + MOSTAZA tag. NEXT: re-run parity, Wompi TEST, notifications, storefront regression, billing gate presentation. No publish/DNS/password removal/live Wompi/real money.

