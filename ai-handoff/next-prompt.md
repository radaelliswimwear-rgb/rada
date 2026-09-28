# NEXT PROMPT

STATUS: WAITING_FOR_CUSTOMER_ACCOUNTS_DECISION

LAST_COMPLETED_PHASE: 02K — WISHLIST / FAVORITES
NEXT_PHASE: 02L — CUSTOMER ACCOUNTS
CURRENT_MODEL: OPUS 5.5 ULTRACODE

02K was completed and reviewed by ChatGPT.

DO NOT START 02L YET.

Daniela must decide these four points before Customer Accounts work begins:

1. ACCOUNT EXPERIENCE
   - Shopify New Customer Accounts (email verification/code-based)
   - or Classic Customer Accounts (password-based, closer to current custom UX)

2. WISHLIST SYNC
   - browser-only wishlist
   - or account-synced wishlist across devices, which requires additional backend/app architecture

3. LOGIN MERGE
   - whether guest/browser favorites should merge into the signed-in customer wishlist

4. ACCOUNT WISHLIST ROUTE
   - whether /cuenta/favoritos should continue as a dedicated account destination
   - or whether the public Favorites page remains the canonical wishlist UI

Current 02K state:
- guest/browser wishlist works via localStorage adapter
- no fake account sync was implemented
- Product Card, PDP and Header wishlist integration PASS
- Wishlist page implemented
- mobile catalog/search grid regression fixed
- Theme Check 0 errors / 0 warnings
- no Production/Staging/main changes

Remain stopped until ChatGPT updates this file after Daniela's explicit Customer Accounts decision.
