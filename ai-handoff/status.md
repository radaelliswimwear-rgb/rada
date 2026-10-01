PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03P-LAB-CERTIFICATION
CURRENT_PHASE: 03P-NEW-STANDARD-STORE
NEXT_PHASE: 03Q-FINAL-LAUNCH-CERTIFICATION
CURRENT_MODEL: SONNET 5.5
STATUS: READY_FOR_CLAUDE_03P_NEW_STANDARD_STORE
USER_ABSENCE_MODE: INACTIVE
OWNER_INTERACTION_RULE: Claude performs all safe/reversible creation, migration, configuration and testing work it can. Daniela only handles unavoidable owner authentication, secret entry, billing approval, or irreversible publication actions. Never ask for passwords, MFA codes, card details, API secrets, Wompi keys, or payment credentials in chat.

CHATGPT FORMAL APPROVAL 2026-10-01:
- 03P-LAB-CERTIFICATION is formally APPROVED.
- LAB_CERTIFIED = YES.
- READY_FOR_NEW_STANDARD_STORE = YES.
- Remote evidence verified on GitHub.
- `shopify-migration-backup` head verified at `c232715c0515f862b66eb9b12641b34d0be6df7a`.
- Final report `shopify-migration/theme/03P-lab-certification-report.md` is remotely fetchable.
- Final microtests PASS: 4/4 external social links; true 390 px responsive evidence on 6 representative pages; exact shipping threshold checkout COP 299,899 => paid regional shipping and COP 299,900 => free shipping; temporary test artifacts removed; baseline restored to parity 8/8, 29 products / 98 variants / 95 images, inventory 128.
- No unresolved lab blocker remains.

CERTIFIED LAB BASELINE TO REPLICATE:
- Lab: `radaelli-swimwear-dev.myshopify.com` under Partner account `daniradaelli01@gmail.com`; remains free test-only lab and will NOT become production.
- Colombia / COP / America-Bogota / kg; US market DRAFT.
- RC1.10 unpublished; ZIP SHA-256 `e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c`; theme parity 98/98; data parity 8/8.
- 29 products / 98 variants / 95 images.
- Inventory 98/98 tracked, 128 units; weight 500 g x98; XL KEEP.
- Collections/manual order, metafields/size guide, menus, 51 redirects.
- Approved legal pages and Shopify policies.
- Search & Discovery installed: filters Talla, Color, Precio; no Disponibilidad.
- Envia installed and linked for quote/fulfillment reference, not live CCS.
- Wompi installed in TEST mode; sandbox E2E PASS with single test order #1003, no duplicate, zero real money.
- Shipping: subtotal < COP 299,900 => regional fixed rate; >= COP 299,900 => free shipping. Approved zones: ATL 9,900; resto Caribe 12,900; principales 17,900; resto país 21,900; San Andrés/Amazonía 44,900.
- 0 Theme Check offenses, 0 JS console errors, secret scan clean.

OWNER COMMERCIAL DECISION — AUTHORITATIVE:
- Do NOT pay/reactivate the inactive transferred `launch` store. Leave it untouched.
- Create a SEPARATE NEW NORMAL Shopify merchant store through standard Shopify signup under `radaelliswimwear@gmail.com`.
- This new store is the intended official commercial store.
- Current public Shopify Colombia offer observed by ChatGPT on 2026-10-01: 3-day free trial then 3 months at USD 1/month. This is NOT guaranteed account-specific eligibility. Before any paid commitment, Claude must verify the exact offer shown inside THIS new store/account UI. If the expected promo is absent or materially different, STOP and report before billing.
- Target paid plan after promo: Shopify Basic monthly unless owner later changes it.
- Do not select Grow/Advanced merely for carrier-calculated shipping; launch shipping uses fixed regional rates + free threshold and therefore does not require live third-party CCS.

OFFICIAL-STORE SAFETY RULES:
- One active process only. No subagents/workflows.
- No main/merge/PR.
- Keep store private/password-protected while migrating/testing.
- No production DNS/domain cutover yet.
- Wompi stays TEST until final explicit production authorization.
- No real customer order or real money during migration/testing.
- Do not purchase real Envia labels during this phase.
- Do not publish the RC theme until final launch authorization.
- Do not activate/select a paid plan or enter billing unless the exact promo/charge terms are visible and Daniela explicitly approves the billing step.
- Keep the certified Dev Store intact as rollback/reference until final launch passes.

KNOWN PRE-PUBLISH OWNER REVIEW:
- RC1.10 announcement bar currently says `20 % DE DESCUENTO EN TODA LA TIENDA`. Preserve during deterministic replication, but obtain Daniela's decision before public launch; do not silently change it.

DEFERRED ITEMS TO PROVE ON OFFICIAL STORE:
- New-store promotion/account-specific eligibility.
- Production domain/DNS and password removal.
- Wompi live mode / real transaction only when explicitly authorized in final launch phase.
- Real Envia label purchase only if explicitly authorized.
- Historical customers/orders migration, requiring authorized source export and Shopify customer/order permissions.

NEXT ACTION:
Use `ai-handoff/next-prompt.md` for 03P-NEW-STANDARD-STORE. Replicate deterministically from certified artifacts; do not rediscover or rebuild manually. One active process only.