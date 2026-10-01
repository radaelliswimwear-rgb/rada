PROJECT: RADAELLI SWIMWEAR SHOPIFY MIGRATION
LAST_COMPLETED_PHASE: 03O
CURRENT_PHASE: 03P-LAB-CERTIFICATION
NEXT_PHASE: 03P-NEW-STANDARD-STORE
CURRENT_MODEL: SONNET 5.5
STATUS: READY_FOR_CLAUDE_03P_LAB_CERT_EXISTING_STORE_FIRST
USER_ABSENCE_MODE: INACTIVE
OWNER_INTERACTION_RULE: Claude performs all reversible testing/migration/configuration work on the selected existing free Shopify Dev Store laboratory under Daniela's Partner account. Daniela only handles owner-only authentication or approvals when unavoidable. Never ask for passwords, MFA codes, card details, API secrets, or Wompi keys in chat.

OWNER_DECISION_2026-10-01 — AUTHORITATIVE:
- DO NOT CREATE ANY NEW STORE YET.
- Daniela remembers an existing Colombia-configured store and does not authorize creating another store until the existing store inventory is fully reconciled.
- FIRST enumerate every existing Shopify store visible under daniradaelli01@gmail.com / Partner-Dev Dashboard and record for each: exact display name, myshopify domain/identifier, store type (Dev / Client Transfer / normal merchant), country/region, currency, timezone if visible, status (active/inactive), whether admin is accessible without a paid plan, and whether it already contains Radaelli migration data.
- Identify specifically which store Daniela remembers as the Colombia store and whether it can serve as the FREE lab without payment.
- The previously reclaimed Client Transfer Store that is INACTIVE without a paid plan must NOT be paid/reactivated merely for testing.
- If an EXISTING free Dev Store can be configured/reconfigured to Colombia/COP/Bogota and support the needed lab tests, REUSE IT. Do not create a new Dev Store.
- ONLY if no existing free store is technically suitable may Claude propose creating a fresh Dev Store; STOP and ask Daniela for explicit approval BEFORE pressing Create store.
- The Dev Store lab is test-only and will NEVER become the production store.
- BEFORE creating the new normal Shopify merchant store, fully certify the selected existing Dev Store lab.
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
- Wompi official route sandbox E2E previously PASS on source (#1002); selected Dev Store must get its own fresh test validation if technically supported.
- Envia configuration/reference data available; selected Dev Store should install/link if supported for testing.
- Free shipping >= COP 299,900 previously PASS.
- Regional flat-rate shipping strategy is the new launch target and must be certified in the selected Dev Store.

OFFICIAL SHOPIFY DEV-STORE CONSTRAINTS VERIFIED 2026-10-01:
- Dev Stores support unlimited test orders and unlimited products.
- Test orders may use Shopify Test/Bogus gateway or a third-party payment provider in test mode; real transactions are prohibited.
- Password page cannot be removed; fine for lab use.
- Dev Stores cannot be converted/transferred to production stores.
- Third-party app availability can depend on app testing/billing support; record any app-specific limitation honestly as DEFERRED only if Shopify/App policy prevents testing.

LAB CERTIFICATION GOAL:
Prove every launch-critical behavior that can be safely proven on an EXISTING free Dev Store BEFORE starting the promo clock on the official merchant store. Use ai-handoff/next-prompt.md. One active process only.