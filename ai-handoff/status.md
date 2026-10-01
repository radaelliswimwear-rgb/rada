PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03O
CURRENT_PHASE: 03P-LAB-CERTIFICATION
NEXT_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_MODEL: SONNET 5.5
STATUS: READY_FOR_CLAUDE_03P_LAB_CERT
USER_ABSENCE_MODE: INACTIVE
OWNER_INTERACTION_RULE: Claude performs all reversible testing/configuration work on the existing private Client Transfer Store. Daniela only handles owner-only authentication or approvals when unavoidable. Never ask for passwords, MFA codes, card details, API secrets, or Wompi keys in chat.

OWNER_DECISION_2026-10-01:
- BEFORE creating the new normal Shopify store, fully certify the existing Client Transfer Store as the test laboratory.
- DO NOT transfer, subscribe, pay for, publish, delete, or convert the existing Client Transfer Store.
- DO NOT create/activate the new standard promo store until this lab-certification phase is complete and reviewed by ChatGPT.
- Final commercial strategy remains: NEW STANDARD Shopify store from normal signup, expected Colombia offer if actually shown: 3 days free then USD 1/month for 3 months; target plan Basic monthly after promo.
- Shipping launch strategy: subtotal < COP 299,900 => fixed standard shipping rates by Colombian region; subtotal >= COP 299,900 => free shipping. Envia is for fulfillment/labels and quote reference; live third-party CCS is not required.

SOURCE LAB BASELINE ALREADY PROVEN:
- Colombia/COP/America-Bogota/kg.
- RC1.10 unpublished, parity 98/98, hash recorded.
- 29 products / 98 variants / 95 images.
- Inventory 98/98 tracked, 128 provisional units; XL KEEP.
- Collections/metafields/navigation/51 redirects prepared.
- Legal pages created; legal 404 count 0; Shopify Terms + Shipping Policy fields filled later with approved text.
- Search & Discovery smoke PASS.
- Wompi official route sandbox E2E PASS on source (#1002), test mode, no real money.
- Envia linked on source.
- Free shipping >= COP 299,900 already PASS.
- Previous sub-threshold live Envia rate failed, which is now irrelevant to launch because Basic will use regional flat rates.

LAB CERTIFICATION GOAL:
Prove every launch-critical behavior that can be safely proven on the private test store BEFORE starting the promo clock on the new merchant store. Use ai-handoff/next-prompt.md. One active process only.