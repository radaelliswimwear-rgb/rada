PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03O
CURRENT_PHASE: 03P-LAB-CERTIFICATION
NEXT_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_MODEL: SONNET 5.5
STATUS: READY_FOR_CLAUDE_03P_LAB_CERT_DEV_STORE
USER_ABSENCE_MODE: INACTIVE
OWNER_INTERACTION_RULE: Claude performs all reversible testing/migration/configuration work on the free Shopify Dev Store laboratory under Daniela's Partner account. Daniela only handles owner-only authentication or approvals when unavoidable. Never ask for passwords, MFA codes, card details, API secrets, or Wompi keys in chat.

OWNER_DECISION_2026-10-01 — AUTHORITATIVE:
- The previously transferred/reclaimed Client Transfer Store is INACTIVE without a paid plan and is NOT the lab target anymore. DO NOT pay, subscribe, reactivate, publish, transfer, delete, or modify it except read-only reference/export if access permits.
- Daniela wants the TEST LAB under the Shopify Partner/Dev account that now uses daniradaelli01@gmail.com.
- Use a FREE Shopify Dev Store as the lab. First inspect the existing Dev Stores and choose the one with the best usable state for certification; if none is suitable, create a fresh Dev Store with Basic feature profile and deterministically recreate the validated state there.
- The Dev Store is for testing only and will NEVER become the production store.
- BEFORE creating the new normal Shopify merchant store, fully certify the Dev Store lab.
- DO NOT create/activate the new standard promo store until lab certification is complete and reviewed by ChatGPT.
- Final official commercial store will later be created by normal Shopify signup under radaelliswimwear@gmail.com, using the current new-store promo only if that store itself visibly shows it.
- Target commercial plan after promo: Shopify Basic monthly.
- Shipping launch strategy: subtotal < COP 299,900 => fixed standard shipping rates by Colombian region; subtotal >= COP 299,900 => free shipping. Envia is for fulfillment/labels and quote reference; live third-party CCS is not required.

VALIDATED SOURCE STATE TO RECREATE/CERTIFY:
- Colombia/COP/America-Bogota/kg.
- RC1.10 theme source/ZIP, parity 98/98, hash recorded.
- 29 products / 98 variants / 95 images.
- Inventory 98/98 tracked, 128 provisional units; XL KEEP.
- Collections/metafields/navigation/51 redirects prepared.
- Legal pages created; legal 404 count 0; Shopify Terms + Shipping Policy approved texts available.
- Search & Discovery smoke previously PASS.
- Wompi official route sandbox E2E previously PASS on source (#1002); Dev Store must get its own fresh test validation if technically supported.
- Envia configuration/reference data available; Dev Store should install/link if supported for testing.
- Free shipping >= COP 299,900 previously PASS.
- Regional flat-rate shipping strategy is the new launch target and must be certified in Dev Store.

OFFICIAL SHOPIFY DEV-STORE CONSTRAINTS VERIFIED 2026-10-01:
- Dev Stores support unlimited test orders and unlimited products.
- Test orders may use Shopify Test/Bogus gateway or a third-party payment provider in test mode; real transactions are prohibited.
- Password page cannot be removed; fine for lab use.
- Dev Stores cannot be converted/transferred to production stores.
- Third-party app availability can depend on app testing/billing support; record any app-specific limitation honestly as DEFERRED only if Shopify/App policy prevents testing.

LAB CERTIFICATION GOAL:
Prove every launch-critical behavior that can be safely proven on the free Dev Store BEFORE starting the promo clock on the official merchant store. Use ai-handoff/next-prompt.md. One active process only.