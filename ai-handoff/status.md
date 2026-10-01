PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03O
CURRENT_PHASE: 03P-REPLAN
NEXT_PHASE: 03Q
CURRENT_MODEL: SONNET 5.5
STATUS: READY_FOR_CLAUDE_03P_NEW_STANDARD_STORE
USER_ABSENCE_MODE: INACTIVE
OWNER_INTERACTION_RULE: Claude performs all reversible migration/configuration work. Daniela only handles owner-only authentication, billing/payment entry, or irreversible approvals. Never ask for passwords, MFA codes, card details, API secrets, or Wompi keys in chat.

OWNER_DECISION_2026-10-01:
- DO NOT transfer or subscribe the existing Client Transfer Store.
- Daniela prefers a NEW STANDARD Shopify merchant store created from the normal Shopify signup so she can use the current Colombia offer if the new store actually shows it: 3 days free, then USD 1/month for 3 months.
- Target plan after promo: Shopify Basic monthly, standard price currently shown as USD 25/month.
- Final merchant/store-owner login remains radaelliswimwear@gmail.com.
- Existing Client Transfer Store remains PRIVATE and UNTRANSFERRED as rollback/reference until the new standard store reaches full parity and passes checkout tests.
- Shipping strategy changed: Basic plan + STANDARD FIXED SHIPPING RATES BY COLOMBIA REGION below COP 299,900; FREE SHIPPING >= COP 299,900. Envia remains for fulfillment/labels and quotations used to design regional flat rates. No third-party live CCS is required for launch.

OFFICIAL SHOPIFY FACTS VERIFIED BY CHATGPT TODAY:
- Shopify Colombia currently advertises 3 days free, then USD 1/month for 3 months for normal new-store signup.
- Client Transfer Stores are explicitly NOT eligible for promotions or free trials after transfer.
- Shopify officially supports uploading a theme ZIP to another store.
- Theme ZIP does NOT include products, collections, menus, pages, blog posts, store Files, or other store-level data; those must be migrated separately.
- Shopify supports moving products between stores by CSV, and the existing deterministic migration tooling/backups may be reused for products, variants, images, collections, metafields, navigation, redirects, pages, inventory and other store data.

CURRENT SOURCE / TEMPLATE STORE STATE TO REUSE:
- Client Transfer Store `Radaelli Swimwear`, Colombia/COP/America-Bogota/metric-kg.
- RC1.10 unpublished, SHA-256 e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c, parity 98/98.
- Catalog 29 products / 98 variants / 95 images.
- Inventory 98/98 tracked, 128 provisional units; XL KEEP.
- Collections/metafields/navigation/51 redirects already prepared.
- Legal pages Privacy / Terms / Shipping / Cookies approved; Shopify Terms of Service and Shipping Policy fields filled with approved text.
- Search & Discovery installed/configured in source store.
- Wompi sandbox flow previously proven on source store; new standard store will require fresh install/configuration and new test validation.
- Envia linked on source store; new standard store will require fresh install/link/configuration.
- Shipping package provisional 15 x 10 x 5 cm, 500 g/variant.
- Historical-data owner decision remains MIGRATE all; historical orders should be imported as Shopify orders where technically supported, with file/archive only as backup.

DO NOT:
- pay/subscribe/transfer the old Client Transfer Store;
- delete the old Client Transfer Store or QA Dev Stores;
- connect production DNS/domain yet;
- publish storefront yet;
- enable Wompi live or process real money;
- assume the promo applies until it is visibly confirmed in the NEW standard store signup/billing UI;
- assume theme ZIP alone duplicates the whole store.

Proceed using ai-handoff/next-prompt.md. One active process only.