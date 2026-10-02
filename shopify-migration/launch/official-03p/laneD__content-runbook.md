# Lane D runbook — navigation / pages / legal / redirects + Search & Discovery + notifications + SEO

Official Colombia store replica of the certified lab `radaelli-swimwear-dev.myshopify.com`.
Prepared READ-ONLY by Lane D (no mutation was run, no browser, no git). The coordinator runs every write.

- START_TIME 2026-10-02T07:35:16-05:00 (America/Bogota); END_TIME 2026-10-02T07:48:58-05:00 (about 14 min elapsed).
- Evidence tags: `[LAB]` read live from the lab in this session; `[ART]` read from prep artifacts; `[API]` confirmed by schema introspection of the lab Admin API; `[DOC]` Shopify behaviour from documentation/previous runbooks, NOT re-verified live; `NOT_VERIFIED`.
- Files: `lab-content-snapshot.json` (lab export), `tools/verify-laned.mjs` (read-only verifier for ANY store), `tools/export-lab.mjs`, `tools/build-snapshot.mjs`, `tools/gq.mjs` (read-only GraphQL helper; refuses any `mutation`).
- PREP = `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration`

---------------------------------------------------------------------------------------------------

## 1. Coverage verdict: does 03l-migrate (pages/policies/menus/redirects) reproduce the lab?

Result of comparing the lab export against the artifacts the waves read: **identical** `[LAB][ART]` (and `verify-laned.mjs` on the lab = 7/7 PASS).

| Lab item | Wave / artifact | Lab vs artifact |
|---|---|---|
| Pages privacidad, terminos, envios, cookies, garantia (published) | `pages` <- `content/legal/*.html` | bodies identical (whitespace-normalised) |
| Page favoritos (template `wishlist`, empty body) | `pages` | identical |
| Shopify policies: REFUND, PRIVACY, TERMS_OF_SERVICE, SHIPPING (4; no TERMS_OF_SALE/LEGAL_NOTICE/SUBSCRIPTION/CONTACT) | `policies` <- devoluciones/privacidad/terminos/envios.html | bodies identical |
| Menus main-menu (5), comprar (4), ayuda (6) | `menus` <- `content/navigation-final-store.json` | titles + urls identical |
| 51 URL redirects (29 products, 4 collections, 1 policy, 7 pages, 1 search, 9 account) | `redirects` <- `seo/shopify-redirects-import-final-store.csv` | 51 = 51, 0 differences, 0 duplicates |
| Announcement bar `20 % DE DESCUENTO EN TODA LA TIENDA` | NOT a content wave: theme file `sections/header-group.json` text `20% de descuento en toda la tienda` (rendered uppercase) inside RC1.10 ZIP (SHA-256 e0f67590...2410c) | replicated by Lane A theme push; nothing to do here. Business decision pending (no real discount exists) |

### Gaps (things the waves/artifacts do NOT reproduce)

| # | Gap | Kind | Exact way to do it |
|---|---|---|---|
| G1 | Privacy policy "automated/auto-managed" turned OFF (lab report: done in Admin UI) | UI, or API with extra scopes | **API** (needs owner re-consent adding `read_privacy_settings`,`write_privacy_settings`; stored token has neither `[LAB]`): read `{ privacySettings { privacyPolicy { autoManaged } dataSaleOptOutPage { autoManaged } banner { enabled autoManaged } } }`; write `mutation { privacyFeaturesDisable(featuresToDisable: [PRIVACY_POLICY]) { featuresDisabled userErrors { field message } } }` `[API]`. **UI** (no extra scope): Admin > Settings > Policies > Privacy policy: switch OFF the automatic/"managed by Shopify" option (exact label NOT_VERIFIED; look for "automatic"/"managed"), keep the approved text, Save. Do it BEFORE the `policies` wave if the toggle is available; if the wave's privacy update fails with a userError, do the toggle and re-run the wave. In both cases re-run check D2 at the end and again ~15 min later (detects Shopify regenerating the text). |
| G2 | Search & Discovery filters exactly Talla, Color, Precio (no Availability) | UI only `[API]` | See section 5. No Admin API exists (introspection: no filter-config types/mutations; `Shop.searchFilters` only returns legacy availability options). |
| G3 | Notification templates, staff recipients, sender email | UI only `[API]` | See section 6. Admin API has no notification operations (EMAIL_TEMPLATE exists only as a translatable resource; needs `read/write_translations`, also missing). |
| G4 | Home page title + meta description | UI only; **lab value is EMPTY** `[LAB]` (`shop.description = null`) | Parity = leave empty. Optional improvement (owner OK required): Online store > Preferences > Homepage title / meta description with `seo/03K-home-seo-values.json` (title "Trajes de baño de diseño en Colombia", description 109 chars). There is no `shopUpdate` mutation `[API]`. |
| G5 | Shopify-created defaults not in artifacts: page `contact` (template contact, empty), page `data-sharing-opt-out` (unpublished "Your Privacy Choices"), menus `footer` (Buscar, Your Privacy Choices) and `customer-account-main-menu` (Orders, Profile) | AUTO | Do NOT recreate. Just confirm they exist/behave like the lab (`verify-laned.mjs` INFO line). The theme footer uses `comprar` + `ayuda`, not `footer`. |
| G6 | Cookie banner / data-sale-opt-out page state (Settings > Customer privacy) | UNKNOWN in lab | Unreadable without `read_privacy_settings`. Before replicating, take a screenshot of lab Settings > Customer privacy and copy the same toggles; or read via `privacySettings` after re-consent. |
| G7 | Page `garantia` `templateSuffix`: lab=`page`, script creates `null` | cosmetic | Both render `templates/page.json` (no `page.page.json` exists). Leave `null`. |
| G8 | Sequencing: `menus` silently skips items whose target does not exist yet | process | See section 2. Run `menus` only after collections + pages + refund policy exist, else `ayuda` ends with 5 items (re-run fixes it, idempotent). |

Adjacent dependencies owned by other lanes that change what Lane D verification shows:
- Store name: lab is "Radaelli Swimwear Dev"; the official store must be "Radaelli Swimwear" (theme appends " – <shop name>" to titles; JSON-LD Organization name; email sender name). Confirm in Settings > General.
- Customer accounts = Optional with new customer accounts (`/account` targets of the 9 `/cuenta/*` redirects) `[LAB]`.
- Spanish (`es`) must be a published language and the storefront/checkout default for Colombia, otherwise the customer confirmation email can go out in English `[DOC]`.
- Collections (4 handles + destacados), 29 products and metafield `custom.color` + size option `Talla` come from Lane B waves (defs/collections/products/membership/publish).

---------------------------------------------------------------------------------------------------

## 2. Execution order, dependencies, parallel safety

Timing basis: one `shopify store execute` call = **5.9 s measured `[LAB]`**; waves are call-bound, so estimates are calls x 6 s. Admin GraphQL cost is tiny; running waves concurrently is safe (each process has its own temp dir; no shared state).

| Step | What | Depends on | Parallel-safe with | Calls / est. | Expected result |
|---|---|---|---|---|---|
| D-A | `pages` wave | nothing | D-B, D-C, all Lane A/B/C | ~12 calls, ~70 s | 6 pages created (`created:true`) or `existed:true`; final store has 6 + defaults |
| D-B | `policies` wave (+ G1 first if possible) | nothing (write_legal_policies OK) | D-A, D-C | ~10 calls, ~60 s | refund + privacy + terms + shipping updated or `ya idéntica`; exactly 4 policies |
| D-C | `redirects` wave | nothing (Shopify does not validate targets) | D-A, D-B | ~5 calls, ~30 s | `creadas: 51` (or `yaExistian` + remainder); `urlRedirectsCount = 51` |
| D-D | `menus` wave | collections (Lane B `collections` wave), D-A pages, D-B policies | D-C | ~19 calls, ~115 s | main-menu 5, comprar 4, ayuda 6 with `omitidos: []` |
| D-E | S&D install + filters (UI, section 5) | products imported + published, `custom.color` definition+values, option Talla (Lane B) | everything not touching products | ~10-15 min by hand (unmeasured estimate) | filters Talla, Color, Precio (that order), no Availability |
| D-F | Notifications / sender (UI, section 6) | store name set, es published, sender decision | D-E | ~10 min by hand (unmeasured) | checklist N1-N8 |
| D-G | Final verification (section 3) | D-A..D-D + Lane B | - | verify-laned ~57 s | 7/7 PASS |

Critical path for Lane D = Lane B `collections` wave -> D-D (menus). Everything else can start at 08:00 in parallel (D-A, D-B, D-C = ~70 s wall-clock if launched together).
Recommended launch (coordinator, PowerShell, from any cwd; dry first):

```powershell
$PREP='C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration'
$env:TARGET_STORE='<OFFICIAL>.myshopify.com'
# 0) read-only baseline of the new store (expect FAIL D1-D5 before the waves)
node "C:/Users/user/AppData/Local/Temp/claude/C--CLAUDE-rada-main-rada-main/34c11d0a-7250-45aa-b727-3081da1b069a/scratchpad/official/laneD/tools/verify-laned.mjs" --store=$env:TARGET_STORE
# 1) dry runs (read-only)
foreach($w in 'pages','policies','redirects'){ node "$PREP/launch/tools/03l-migrate.mjs" $w --dry }
# 2) parallel group (mutating): three background processes, one per wave
foreach($w in 'pages','policies','redirects'){ Start-Process node -ArgumentList "`"$PREP/launch/tools/03l-migrate.mjs`" $w" -NoNewWindow -RedirectStandardOutput "wave-$w.log" }
# 3) after Lane B collections exist AND pages+policies finished:
node "$PREP/launch/tools/03l-migrate.mjs" menus --dry ; node "$PREP/launch/tools/03l-migrate.mjs" menus
```
Idempotency: every wave checks existence first (`existed:true`); re-running is safe. `menus` updates existing menus in place (`menuUpdate`), including the default `main-menu`.

---------------------------------------------------------------------------------------------------

## 3. Verification (all read-only)

1. Lane D verifier (any store; needs only read_content/read_legal_policies/read_online_store_navigation/read_products):
   `node .../laneD/tools/verify-laned.mjs --store=<OFFICIAL>.myshopify.com --json=verify-official.json`
   Expected: `SUMMARY 7/7 PASS` (D1 pages, D2 policy bodies, D2b exactly 4 policies, D3 menus 5/4/6, D4 51 redirects == CSV, D5 every internal menu/redirect target exists, D6 no explicit SEO overrides). INFO line should list `defaultPagesPresent: contact, data-sharing-opt-out` and menus `main-menu(5) footer(2) customer-account-main-menu(2) comprar(4) ayuda(6)`, `homeMetaDescription: null`. D5 can only pass after the 29 products and 4 collections exist.
2. Repo parity (covers Q5 redirects, Q6 pages, Q7 menus + products/collections of other lanes): `node "$PREP/launch/tools/03l-migrate.mjs" parity` with `TARGET_STORE` set -> expect `8/8 PASS`. Note Q7 only requires `ayuda` order, so D3 here is stricter (all 6 items).
3. Counts one-liners (same helper): `{ urlRedirectsCount { count } pagesCount { count } menus(first:20){ nodes { handle items { title } } } }` -> 51 / 8 / as above.
4. Storefront (needs the visitor-password session; Claude must not handle the password): footer Ayuda links 6/6 -> 200 (`/pages/envios`, `/policies/refund-policy`, `/pages/garantia`, `/pages/terminos`, `/pages/privacidad`, `/pages/cookies`); header 5 links; 51 redirects land on 200 (the 9 `/cuenta/*` land on Shopify customer accounts, 302). Lab evidence: 51/51 PASS, 19/19 menu+footer links `[ART 03P]`.
5. Privacy auto-managed OFF: after G1, either `privacySettings.privacyPolicy.autoManaged == false` (needs scope) or UI screenshot. Re-run D2 15 min later.

---------------------------------------------------------------------------------------------------

## 4. SEO (parity = nothing to write)

Lab export `[LAB]`: no explicit SEO title/description on any of the 29 products, the 6 collections, or any page (`global.title_tag/description_tag` empty). Shopify falls back to title + body/description. Collections oasis-natural, aurora-viva, espuma-de-ola, salidas-de-bano have a description (72-76 chars of HTML) set by the `collections` wave, so they get a fallback meta description; **Home (`shop.description = null`), Destacados (no description) and Todos (`/collections/all`, built-in, no Admin record) have no meta description** (confirmed; matches 03P).
- Optional, owner-approved only: Home title/description (UI, G4); Destacados: `mutation { collectionUpdate(input: { id: "<gid>", seo: { description: "<owner text>" } }) { userErrors { field message } } }` (write_products OK; do not invent copy; 03P suggests reusing the footer text). Todos: only by theme/template change (not API).
- Technical SEO (canonical, JSON-LD, og:*) comes from the theme (Lane A). Sitemap/robots are Shopify-generated; indexing is meaningless while the password is on.

---------------------------------------------------------------------------------------------------

## 5. Search & Discovery checklist (UI only; coordinator drives the browser)

Target `[LAB][ART 03P/03F]`: app "Search & Discovery" (free) installed; Filters exactly **Talla** (Product option "Talla"; values S, M, L, L y XL, XL; manual order; empty values hidden), **Color** (Product metafield custom.color, 12 uppercase values, automatic order, empty hidden), **Precio** (Price); list order Talla, Color, Precio; **no Availability**; theme switch `collection_show_availability_filter=false` already travels with the theme.
Prerequisites: 29 products published with option Talla, `custom.color` definition (storefront PUBLIC_READ) populated on 29/29, Online Store sales channel. A freshly created option may take a few minutes to appear as a source.

| # | Step | Expected | Notes |
|---|---|---|---|
| S0 | Pre-check: Admin > Apps: is Search & Discovery already installed on the new store? | yes/no | Brand-new stores may ship it preinstalled `NOT_VERIFIED`; if yes skip S1-S3 |
| S1 | Admin > Apps > Shopify App Store > Search & Discovery > Install | permission screen | **OAuth grant = needs the user's explicit OK in chat.** Compare screen with 03F table: must NOT ask for customers or orders; any billing screen = stop |
| S2 | Apps > Search & Discovery > **Filters** | default list (often Availability, Price, others) | screenshot it |
| S3 | Remove Availability and any Category/Product type/Vendor/Tags | only Price left | |
| S4 | **Add filter** > Source: Product option > **Talla**; label Talla; Sort values **Manual**: S, M, L, L y XL, XL; Empty values **Hide**; do NOT group L y XL; Save | 5 values | If "Talla" missing: wait a few min/reload |
| S5 | **Add filter** > Source: Product metafield > **Color** (custom.color); label Color; Sort **Automatic**; Empty **Hide**; Save | 12 values | If not listed: check metafield definition + storefront access (Lane B defs) |
| S6 | Price: keep; confirm its heading shows **Precio** on the Spanish storefront (label text is NOT readable by API; lab shows "Precio") | Precio | If it shows "Price", edit its label / add the es translation (Translate & Adapt) |
| S7 | Drag order: Talla, Color, Precio; Save | order saved | |
| S8 | Do not touch Search/Recommendations/Synonyms/Boosts | untouched | |
| S9 | Storefront check (visitor session) `/collections/oasis-natural` desktop 1280 + mobile drawer | groups Talla, Color, Precio; no Availability | Lab numbers `[ART 03P]`: Talla XL = 11 and Color NEGRO = 6 on the full catalog (03F catalog counts: S 29, M 29, L 28, XL 11, "L y XL" 1); Oasis Natural has 10 products. Expected (03F QA7, not re-measured today): Oasis + talla S + NEGRO + price 150000-190000 -> 2 (costa-esmeralda-negro, arena-dorada-negro) |
| S10 | Empty collection `salidas-de-bano` shows no filters (by design) | 0 filters | |

Rollback: Filters > edit/remove the filter; the theme draws only what `collection.filters` returns (no theme change needed). If S&D cannot be configured in time, ship with Price only (acceptable degrade per 03F SD3).

---------------------------------------------------------------------------------------------------

## 6. Notifications and email-sender checklist (UI only)

State in lab `[LAB][ART 03P]`: customer order confirmation sent in es-CO (event logged for test order #1003); staff "new order" generated; staff template text in English (primary locale = en); recipients = lab owner's Gmail only; sender/contact email is a gmail.com address, **not verified as a custom sender**.

| # | Item | Where (Admin > Settings > Notifications) | Pass criterion | Who |
|---|---|---|---|---|
| N1 | Official store name = "Radaelli Swimwear" | Settings > General > Store name | name correct (appears as email sender name) | coordinator |
| N2 | Sender email decision (below) | Notifications > Sender email > Edit (also Settings > General) | status verified / or documented reply-to behaviour | owner |
| N3 | Customer **Order confirmation** in Spanish | Customer notifications > Order confirmation > switch editor language to Spanish > Preview | Spanish copy, COP amounts, store name; no English strings | coordinator checks, owner approves |
| N4 | Other customer templates still default (Shipping confirmation, Refund, Account invite/password reset) | same list | Spanish via es locale; no custom promises of delivery times/rates | coordinator |
| N5 | **Staff new-order recipients**: add `radaelliswimwear@gmail.com` and `info@radaelliswimwear.com` | Staff order notifications > New order > recipients > Add | both listed, email enabled | owner confirms addresses |
| N6 | Staff templates in English (lab = English) | Staff order notifications > New order > Edit code | Decision: keep English (exact replica) or localise. Optional minimal change: subject only, e.g. `[{{ shop.name }}] Pedido nuevo {{ order.name }}` (not applied in lab; owner approval; do not invent other copy). Changing primary language to es would localise staff mails but is a store-wide change deferred by 03N (C2) | owner |
| N7 | Delivery test | Wompi sandbox order (Lane payments) with customer email = an inbox the owner controls (`radaelliswimwear@gmail.com`) | confirmation arrives (inbox or spam) -> closes AC-08; staff new-order arrives at both staff addresses. "Send test" in Notifications only goes to the staff email, so it does not prove customer delivery | owner reads the inbox (Claude must not) |
| N8 | Marketing mail / "notify me" / newsletter platform | - | OPTIONAL/DEFERRED (03K E1); newsletter form server-side only creates a customer subscriber | owner |

### Verified sender: Gmail vs custom domain `[DOC]`, NOT_VERIFIED live (re-read Shopify screens)
| Option | Requirements | Effect | Recommendation |
|---|---|---|---|
| `radaelliswimwear@gmail.com` (Gmail, owner login of the official store) | Shopify sends a verification link to the address; click it from that mailbox | Gmail's domain cannot be DKIM-authenticated by Shopify, so mail is delivered via Shopify's own sending domain with the Gmail address as Reply-To (lab finding: "Gmail cannot be a custom sender") | Use for launch day: no DNS needed. Confirm the verification state on screen |
| `info@radaelliswimwear.com` | (1) the mailbox exists and can receive the verification mail; (2) DNS access to radaelliswimwear.com to add the records Shopify shows in the authenticate-domain screen (DKIM CNAMEs and SPF/DMARC suggestions: copy exactly from Shopify) | From shows the brand domain; best deliverability | Do AFTER the domain is connected (runbook P13-P15; DNS/password removal are "not today"). Until then it can still be a staff RECIPIENT (needs only a working mailbox); verify the mailbox exists first or alerts bounce silently |

---------------------------------------------------------------------------------------------------

## 7. Open decisions (owner) and risks

1. Privacy auto-management OFF (G1) and its label/path on the new store; re-check after ~15 min.
2. Announcement bar "20 % DE DESCUENTO EN TODA LA TIENDA": no discount configured; owner decides before publishing (theme file; not Lane D).
3. Home meta title/description proposal (G4) yes/no.
4. Staff templates English vs Spanish (N6); staff recipient list (N5); sender option (N2).
5. If re-consent for `read_privacy_settings`/`write_privacy_settings` (and optionally `read/write_translations` to read/translate S&D filter and email template labels) is wanted, it needs the owner's browser approval and must keep all existing scopes.
6. Verified here: the lab token scopes lack `read_themes`, `read_translations`, `read_privacy_settings` -> S&D config, template bodies and auto-managed flags could not be read; the checklists above rely on 03P/03F evidence for those three items.
