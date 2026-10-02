# D13 - Colombia: cookies, analytics and ad-pixel consent (research)

Store: radaelliswimwear.com (wgcvpd-ib.myshopify.com), Colombia, COP. Date of research: 2026-10-02 (America/Bogota).
Lane: read-only research + audit. Nothing was changed in Shopify/Meta/Wompi/DNS. No browser tool used.
**This is research, not legal advice. Where the law is ambiguous the text says "consult a Colombian lawyer".**

Label legend used throughout:
- **(a) LEGAL** = a rule in a statute/decree/binding authority, with citation.
- **(b) RECOMMENDATION** = SIC non-binding opinion, or market/law-firm practice.
- **(c) PLATFORM** = Shopify or Meta requirement/default (contractual or technical, not law).
- Confidence: HIGH (primary source read or multiple concordant sources), MEDIUM (secondary sources only), LOW (inferred / not verified).

---

## 0. Bottom line for D13

1. Colombia has **no cookie-specific statute and no mandatory "cookie banner" rule** (HIGH). Cookies/online identifiers are regulated only through the general habeas-data regime (Ley 1581/2012 + Decreto 1377/2013 compiled in Decreto 1074/2015 + SIC Circular Unica Titulo V) *when they collect personal data* (HIGH on the structure; MEDIUM on how strictly the SIC applies it to first-party analytics cookies).
2. The legal anchor is **"autorizacion previa, expresa e informada"** (Ley 1581 art. 3(a), 4(c), 9). Silence is not valid authorization (Decreto 1377 art. 7). Opt-in (a click on "Aceptar") is the clearest way to prove it; "keep browsing = consent" is the weakest. Whether first-party analytics cookies need that authorization is **ambiguous -> consult a Colombian lawyer**. No source I found creates an express "strictly necessary cookies" exemption in Colombian law.
3. For **advertising pixels (Meta Pixel / Conversions API)** the case for prior consent is much stronger: it is a disclosure of identifiers (and, at the Enhanced/Maximum levels, hashed contact data) to a third party abroad for advertising, and Meta's own Business Tools Terms put the lawful-basis/consent burden on the advertiser (c).
4. **Today's real exposure is not the missing banner; it is inaccurate/conflicting texts** (see d13-privacy-policy-audit.md): the cookie policy says analytics "Hoy no las usamos" while Shopify Analytics runs on the live site; the privacy page cites vendors of the old stack; a second, Shopify-generated privacy policy is live at /policies/privacy-policy and contradicts the custom one.
5. **Recommended default: Option C with gates** (accurate texts now; opt-in banner for Colombia switched on *before* the first Meta/ads connection). Medium confidence; see section 5.

---

## 1. (a) LEGAL REQUIREMENTS, with citations

| Rule | What it says (paraphrase) | Why it matters here | Confidence |
|---|---|---|---|
| Constitucion Politica art. 15 | Habeas data: right to know, update and rectify data held in databases | Foundation of the regime | HIGH |
| **Ley 1581 de 2012 art. 3(a)** | "Autorizacion" = consentimiento previo, expreso e informado del Titular. "Dato personal" = any information linked or linkable to one or more determined or determinable natural persons | Defines what must be obtained and what is in scope | HIGH (text read via alcaldiabogota.gov.co gestor normativo) |
| Ley 1581 art. 4 (principles) | Finalidad (legitimate, informed purpose), libertad (treatment only with prior, express, informed consent), transparencia (right to know) | Purposes must be stated; consent is the default basis | HIGH |
| **Ley 1581 art. 9** | Treatment requires prior and informed authorization, except art. 10 cases | Default rule | HIGH |
| Ley 1581 art. 10 | Exceptions: public-body/judicial orders, public data, medical emergency, historical/statistical/scientific, civil-registry data | **None of these covers analytics/advertising cookies or an e-commerce "contract performance" basis** (the pending reform would add contract execution, see 1.6) | HIGH |
| Ley 1581 art. 8 | Titular rights: know/update/rectify; request proof of authorization; be informed of use; complain to the SIC; revoke authorization and/or request deletion; free access | Must be listed in the policy and have a channel | HIGH |
| Ley 1581 art. 12 | Duty to inform at collection: purposes, optional nature of sensitive-data answers, rights, controller identification and contact | Checkout/contact forms | HIGH |
| Ley 1581 art. 14-15 | Consultas answered within 10 business days (+5 with reasons); reclamos within 15 business days (+8 with reasons) | Procedure to publish | HIGH (dates from the law text; sub-steps of art. 15 from memory -> MEDIUM) |
| Ley 1581 art. 16 | SIC complaint only after exhausting consulta/reclamo with the controller | Mention in policy | MEDIUM-HIGH |
| Ley 1581 art. 17 | Controller duties: obtain and keep proof of authorization, inform purposes, security, handle requests, adopt internal policies manual | Record-keeping duty | HIGH |
| **Ley 1581 art. 26-27** | International transfer of personal data prohibited to countries without adequate protection unless exceptions (e.g. express authorization, contract performance, etc.) | Shopify stores data in the US | HIGH on rule; see 1.4 for the US |
| Ley 1581 art. 23 | SIC sanctions incl. fines up to 2,000 SMMLV | Context of risk | MEDIUM (one secondary source repeated it; art. 23 text not re-read) |
| **Decreto 1377 de 2013 art. 5** | Controller must adopt procedures to request authorization at collection, stating which data and all purposes | | HIGH |
| **Decreto 1377 art. 7** | Authorization may be written, oral, or by *conductas inequivocas*; **silence is not unequivocal conduct** | Key: a banner that treats scrolling/ignoring as consent is not safe | HIGH |
| Decreto 1377 art. 8 | Controller must keep evidence of authorization | Consent log (Shopify logs consent changes in its activity log - c) | HIGH |
| Decreto 1377 art. 9 | Revocation/deletion available at any time through free, accessible mechanisms (except where a legal/contractual duty requires keeping the data) | "How to withdraw" must exist | HIGH |
| Decreto 1377 art. 11 | Retention limited to what the purposes and law require | Retention section | HIGH |
| Decreto 1377 art. 12 | Minors' data: prohibited except public data / parental authorization considering the child's opinion | Add "not directed at minors" statement | HIGH |
| **Decreto 1377 art. 13 = Decreto 1074/2015 art. 2.2.2.25.3.1** | Treatment policy must be in clear language and state at least: (1) name, domicilio, address, email, phone of the controller; (2) treatment and purpose; (3) titular rights; (4) person/area that handles queries and claims; (5) procedure to exercise rights and revoke; (6) effective date of the policy and period of validity of the database. Substantial changes must be communicated before applying them | **This is the checklist the privacy policy is measured against** | HIGH (items concordant in two readings of the decree; wording paraphrased) |
| Decreto 1377 art. 14-17 | Aviso de privacidad when the full policy cannot be given at collection: controller identity, treatment/purposes, rights, how to reach the full policy | Optional if the policy link is shown at collection | HIGH |
| **Decreto 1377 art. 24-25** | International *transmission* to an encargado (processor) needs neither notice nor consent if a transmission contract (art. 25) exists | Shopify is an encargado for store data; contract = Shopify's terms/DPA (not verified by me) | HIGH on rule; LOW on whether Shopify's terms satisfy art. 25 -> lawyer |
| SIC Circular Unica, Titulo V | Compiles the SIC rules: RNBD (Cap. 2), international transfers incl. the list of countries with adequate level (Cap. 3), accountability | Context | MEDIUM (could not open the PDF: certificate error on sic.gov.co; relied on secondary sources) |
| Decreto 090 de 2018 (amends Decreto 1074 arts. 2.2.2.26.1.2 and 2.2.2.26.3.1) | RNBD registration only for companies/non-profits with total assets >= 100,000 UVT, and public legal entities. Exempt entities still must comply with Ley 1581 | Radaelli is most likely under the threshold; **confirm legal form and assets with an accountant/lawyer** | MEDIUM-HIGH |
| **Ley 1480 de 2011 art. 50** | Online sellers must always give true, sufficient, clear, updated info: identity (name/razon social, NIT, notification address, phone, email), payment means, delivery time, retracto and procedure, order summary before closing, adequate transaction security | The published CONTACT_INFORMATION / LEGAL_NOTICE policies already carry name, NIT, address, phone, email -> looks aligned; wording "direccion de notificacion judicial" vs the published "Direccion de notificaciones" is a nuance -> lawyer | HIGH on the rule (several concordant sources incl. Mincit/Funcion Publica listings) |
| Ley 2300 de 2023 ("Dejen de fregar") | Sets channels/hours (Mon-Fri 7:00-19:00, Sat 8:00-15:00, no Sundays/holidays) and an excluded-numbers registry; per secondary sources its art. 5 extends the hour limits to advertising messages sent directly to consumers by sellers | Only relevant if Radaelli sends marketing by email/SMS/WhatsApp | MEDIUM (secondary sources) |

### 1.4 International transfer to the US (Shopify)
- Shopify hosts the store and data are stored in the United States (observed in Admin > Customer privacy, 2026-10-02).
- SIC Circular Externa 005 de 2017 (incorporated into Circular Unica Titulo V) lists the United States among countries considered to have an adequate level of protection (reported by Ambito Juridico / Univ. Externado / Holland & Knight; MEDIUM). If that list still applies, art. 26 Ley 1581 does not block the transfer. **Validate the current list with a lawyer.** Treat Shopify's relationship also as a *transmission* to an encargado (Decreto 1377 arts. 24-25).
- Meta (if enabled) and Wompi/conexa.ai: location of conexa.ai processing is **not known** -> ask/verify before stating it.

### 1.5 What I could NOT find in the law
- No express rule on cookie banners, "strictly necessary" cookie exemption, cookie lifetime, or granularity of consent (HIGH that none exists in statute/decree; MEDIUM that no SIC circular added one - see 2).
- No binding rule that a Colombian shop must offer "reject all" - but valid authorization must be freely given and revocable (art. 9 Decreto 1377), which makes a symmetric Accept/Reject the cleanest design (b).

### 1.6 Pending reform (not in force)
- Proyecto de Ley Estatutaria 282 de 2026 (Camara) partially amends Ley 1581; the government filed it on 2025-08-28 (Presidencia) after announcing it on 2025-08-12 (SIC news). Reported content: wider extra-territorial scope, new legal bases (incl. contract execution and legal obligation), portability/limitation/objection rights, automated-decision rights, higher fines (reported up to 10,000 SMMLV or 5% of revenue). Secondary source (CiberLATAM) says it was **still pending**; I could not confirm status on 2026-10-02. Cookies/online identifiers are not mentioned in the summaries I read. MEDIUM. Re-check before relying on any "contract performance" basis.

---

## 2. (b) SIC / MARKET RECOMMENDATIONS

| Item | Content | Confidence |
|---|---|---|
| **SIC Concepto radicado 16-172268 (2016-08-09)**, republished in SIC Boletin Juridico Sept 2016 "Tratamiento de datos personales a traves de cookies" | Cookies are files that gather browsing habits of a user/device and can end up forming a "base de datos" in the sense of Ley 1581. If cookies collect data that qualify as personal, the site administrator is a *responsable del tratamiento* and must design, implement and communicate specific cookie policies via its Politica de Tratamiento and/or Aviso de Privacidad. A concepto is a non-binding interpretation. | MEDIUM-HIGH (read through SIC bulletin summary + 3 law-firm articles; SIC page itself returned certificate error) |
| SIC orders against large platforms (Google Res. 53593 de 2020 on cookies installed on Colombian devices; TikTok Res. 62132 de 2020; WhatsApp Res. 29826 de 2021) | SIC applied Ley 1581 to foreign platforms collecting data of Colombian residents through cookies; required demonstrable authorization mechanisms (esp. for minors). Resolutions 14010 and 60478 de 2021 confirmed on appeal | MEDIUM (resolution numbers via law-firm commentary; not opened) |
| "Resolucion 32126 de 2022" reported as the SIC's "first pronouncement on cookies", classifying cookies as persistent/first-party/third-party/supercookies and saying none is exempt from consent | Repeated by OCH Group, Lawwwing and a Nicholls O'Neill quote. **I could not open or confirm the resolution itself; treat as UNVERIFIED** | LOW |
| No dedicated SIC cookie guide | Law-firm commentary (Vanegas Morales) states the SIC has not issued a specific cookies guide; its position lives in concepts and orders. SIC's own website banner offers a single "ACEPTAR" for all categories - not a model of best practice | MEDIUM |
| 2024-2026 SIC output found | Circular Externa 002 de 2024 (2024-08-21; personal data in AI systems), CE 001 de 2025 (Sept 2025; fintech data), CE 002 de 2025 (2025-10-07; data in technology-transfer), electoral-context instructions (Jan 2026). **None addresses cookies/e-commerce banners as far as my searches show.** Search was not exhaustive (SIC site certificate errors prevented scanning the circular list). | MEDIUM that nothing cookie-specific exists; LOW that nothing exists at all |
| Market practice (Colombian law-firm commentary) | Essential cookies: disclosed in the policy, no banner needed. Preference/analytics/marketing cookies: prior, express, informed consent (opt-in), because "consentimiento tacito" is not accepted. Cookie information to be placed in the data-treatment policy or aviso de privacidad | MEDIUM |
| Authorization must separate necessary from accessory purposes | SIC position (boletin juridico summaries): distinguish purposes needed for the service from accessory ones such as advertising | MEDIUM |

Takeaway: the SIC line is "if it is personal data, you need prior express informed authorization and a policy that says so"; the market reading is "opt-in for analytics and ads, disclose essential cookies". Whether Shopify's *first-party, aggregated* analytics cookies need a click is the truly ambiguous point -> **consult a Colombian lawyer**.

---

## 3. (c) PLATFORM: how Shopify's Customer privacy works today

Sources: help.shopify.com (Customer privacy settings), shopify.dev Customer Privacy API and Pixel Privacy, shopify.com/legal/cookies, Shopify Network Intelligence requirements page. Fetched 2026-10-02. Confidence MEDIUM-HIGH (read via summarizing fetch; wording paraphrased).

### 3.1 Admin controls (Settings > Customer privacy)
- **Cookie banner**: informs visitors and asks for consent; governs Shopify tools incl. cookies and **Shopify Pixels** (and apps that integrate with the Customer Privacy API). Shown on storefront, cart, checkout and customer-account pages.
- **Regions**: with **"Use automated settings" ON** (default for new stores) Shopify decides regions automatically; by default the banner appears in the UK and EEA if those are active markets. Outside those regions the banner does not activate. **To add Colombia you must turn automation OFF, then Regions > Edit > select Colombia > Done > Save.** Banner text is editable and translatable through "Localize" (Translate & Adapt).
- **Consent model inside banner regions = opt-in**: non-essential data (analytics, marketing, personalization) is collected only after consent. Shopify warns of reduced analytics/marketing data and "decreased session counts".
- **Data sale/sharing opt-out page**: a US-state-style page; the Global Privacy Control header triggers an opt-out automatically. Built for US laws; not a Colombian mechanism.
- **Consent categories (Customer Privacy API)**: `analytics`, `marketing`, `preferences`, `sale_of_data`. **In regions without a consent requirement "the default behavior is to allow all processing purposes"** (Customer Privacy API doc) - i.e. today, for Colombian visitors, everything non-essential runs without asking.
- **How the banner gates pixels**: an app/custom pixel declares `privacyPurposes` (analytics, marketing, preferences, sale_of_data); "Shopify's pixel manager will only load your pixel if there is visitor permission for all of the settings that your pixels declares as required." Consent changes are published through `visitorConsentCollected` (flags `analyticsProcessingAllowed`, `marketingAllowed`, `preferencesProcessingAllowed`, `saleOfDataAllowed`).
- Consent changes are logged in the store activity log; visitors can withdraw through the banner/"Cookie preferences" footer link or Shopify's privacy portal (privacy.shopify.com).
- Caution: help text says with automation ON Shopify "automatically updates" generated policy text as settings change. **Before toggling automation, verify in Settings > Policies what it does to the privacy policy** (see audit: Shopify's auto-generated policy is already live at /policies/privacy-policy).

### 3.2 Shopify Network Intelligence (observed ON)
- Pools customer-interaction data across merchants for "Enhanced Services" (improved products, personalization, **ad targeting**). Customers who opt out (banner, GPC, opt-out page, cookie restrictions) are excluded from advertising-type use; Shopify is then an **independent controller** for those purposes (it says so in its generated policy text and consumer policy).
- **Merchant obligations (c)**: link Shopify's Consumer Privacy Policy (https://www.shopify.com/legal/privacy/customers, last updated 2026-03-02) in your privacy policy; show the policy prominently; disclose that Shopify hosts the store and processes customer data; explain sharing with Shopify and third parties across countries; link Shopify's privacy portal.
- **Turning it OFF deactivates/uninstalls dependent features, including Shopify Search & Discovery** (and Shop channel, Audiences, Collabs, Collective, Messaging, Product Network, managed payment methods). Search & Discovery is installed on this store, so **recommended default: keep ON and disclose**.
- In Colombia, with no banner and no opt-out page, Colombian visitors currently have no on-site control over Shopify's own use; mitigation = disclose + link privacy.shopify.com + publish our email channel (all in the proposed texts).

### 3.3 Shopify cookies (per shopify.com/legal/cookies, grouped by Shopify)
- **Essential**: `_shopify_essential` (1 yr), `_shopify_test` (1 min), `_tracking_consent` (1 yr), `cart` (2 wk), `cart_currency` (2 wk), `discount_code` (session), `localization` (1 yr), `shopify_pay`, `storefront_digest`, `login_with_shop_finalize`, `__Host-Http-shop_binding`.
- **Analytics**: `_shopify_analytics` (1 yr), `_shopify_y` (1 yr), `_shopify_s` (30 min), `_landing_page` (2 wk), `_orig_referrer` (2 wk), `shop_analytics` (1 yr).
- **Marketing**: `_shopify_marketing` (1 yr).
- **Preferences**: `shopify_override_user_locale` (admin).
- Shopify's page does not say which categories require consent.

### 3.4 What the live store actually does (read-only HTTP GET of the public homepage, no browser, 2026-10-02)
- Loads Shopify's own analytics (`trekkie`, `ShopifyAnalytics.lib`, `monorail-edge.shopifysvc.com`) and Shopify's Web Pixels Manager with two containers: `shopify-app-pixel` and `shopify-custom-pixel`, both with `privacyPurposes ["ANALYTICS","MARKETING"]`. `isServerSideCookieWritingEnabled: true`.
- **No Meta, Google (GA/GTM/gtag), TikTok, Hotjar or Clarity scripts; no consent banner; no Customer Privacy API calls.** External hosts in the HTML: only shopify/cdn/monorail and the shop's own domain (plus outbound links to Instagram, Facebook, TikTok, WhatsApp).
- The first HTTP response sets only `localization`. The other Shopify cookies are written by Shopify scripts/endpoints after load; **I did not inspect them with DevTools** (no browser allowed) -> LOW-MEDIUM on the exact cookie inventory.
- The theme "Favoritos" wishlist stores guest items in browser `localStorage` under the key `radaelli:wishlist` (a "similar technology" the cookie policy does not mention).
- No Cloudinary or Resend host appears anywhere in the homepage HTML.
- Data-collection points on the homepage: (1) a **newsletter signup** ("Sé la primera en enterarte... Dejá tu correo y recibí aviso apenas lancemos nuevas colecciones, promociones y ofertas") that posts a Shopify `customer` form tagged `newsletter`, with **no authorization/purpose notice and no privacy-policy link at the field** (Ley 1581 art. 12 duty to inform; Decreto 1377 art. 14 aviso); (2) a contact form (`/contact#contact_form`); (3) account login ("Mi cuenta", customer accounts = OPTIONAL). Forms load Shopify's **hCaptcha** spam protection ("Protegido por hCaptcha") from cdn.shopify.com - a third-party service touching visitor data that no policy mentions.
- The native privacy policy (`shopPolicies.url` = checkout.shopify.com/102428803371/policies/55627088171.html, the URL Shopify's checkout uses for its policy links - standard Shopify behavior, not seen in a browser here) and https://radaelliswimwear.com/policies/privacy-policy both serve a **Shopify auto-generated** policy ("Ultima actualizacion: 2 de octubre de 2026"), not the custom /pages/privacidad text (see audit).

### 3.5 Meta's Shopify integration (not connected yet)
- Admin location: Sales channels > Facebook & Instagram > Settings > Data sharing settings. Shopify's help page: **Standard** = Meta pixel only (browser; ad blockers can stop it); **Enhanced** = pixel + Conversions API, sends name, location, email, phone plus browsing behavior (server-to-server); **Maximum** = Enhanced + "Facebook's latest advertising technology". The page puts on the merchant the duty to review Meta's privacy best practices and keep a privacy policy that discloses the practice. (c, HIGH)
- **Meta Business Tools Terms s.3(c)** (c, HIGH): advertiser must give clear, sufficiently visible notice on pages where the pixel runs (that Meta/third parties may collect data for measurement and ad targeting, how to opt out); **in jurisdictions that require consent for cookies/device storage (e.g. EU) the advertiser must obtain consent verifiably before Meta cookies are used**; advertiser warrants it has a lawful basis for the Business Tool Data. Colombia is not named; the lawful-basis warranty still applies, and under Ley 1581 the lawful basis is authorization (see 1).
- **Consent gating (c, MEDIUM-LOW - secondary blogs only, verify at connection time)**: the Shopify Meta pixel is an app pixel inside Shopify's pixel manager, so in banner regions it loads only after consent for the purposes it declares; for server-side events the Shopify Meta app reportedly marks declined events `opt_out: true`. Verify in Events Manager "Test events" before spending.
- **Limited Data Use (LDU)**: Meta's mechanism for certain US states (California, Colorado, Connecticut, and others per Meta docs). It is **not** a Colombian compliance mechanism; do not rely on it (c, HIGH).
- Customer data (name, email, phone) sent to Meta is a transfer abroad (Meta Platforms, US/Ireland) -> must be disclosed in the policy and covered by authorization.

---

## 4. Options for Colombia

| | **A - Minimal / no banner (today's state)** | **B - Opt-in banner for Colombia now** | **C - Accurate texts now; opt-in banner when Meta/ads go on (gated)** |
|---|---|---|---|
| Shopify config | Keep "Use automated settings" ON; banner "not required" | Automation OFF; add Colombia to Regions; Spanish banner text (Accept / Reject / Preferences) | Same as A until the Meta gate, then same as B |
| Legal posture (Colombia) | Weakest: analytics (Shopify) and Network Intelligence run without any click; relies on "first-party aggregated analytics isn't personal data / needs no authorization" (contestable, lawyer) | Cleanest: prior express authorization recorded in Shopify log; matches market practice | Intermediate until Meta; clean from the moment ads start |
| Ad measurement | Maximum events, but **unsafe to connect Meta this way** (Business Tools lawful-basis warranty; transfer of contact data abroad) | Events only from visitors who accept. Declined/ignored visits produce no pixel events (and reportedly opt-out-flagged server events). Expected loss is real but **I have no reliable Colombian figure - do not plan around a number; measure the accept rate in the first 2 weeks** | None lost today (no ad pixel). When the banner is enabled later, sessions/conversion rate in Shopify Analytics drop discontinuously -> enable it **at least 3 days before first ad spend** to get a clean baseline |
| UX / brand | Nothing visible | Small banner on first visit; mobile CTA overlap must be checked | Same as B later |
| Work | None (text fixes only) | ~15 min config + test on mobile + translate | Same, scheduled |
| Reversible | n/a | Yes, anytime | Yes |
| Residual risk | Interim exposure on analytics/NI; mitigated by accurate disclosure, privacy.shopify.com link, email channel for revocation | Lower | As A in the interim |

### Recommended configuration (default = Option C with hard gates)
1. **Now (no config change in Shopify):** publish accurate privacy + cookie texts (d13-proposed-texts-es.md, "version A - exacta hoy"): admit that Shopify Analytics is used, that Shopify may use data through Network Intelligence (link to Shopify's policy and privacy.shopify.com), that no third-party ad pixels are installed, and give the email channel for rights/withdrawal. Keep Network Intelligence ON (Search & Discovery depends on it).
2. **Gate 1 - before the Meta app connection:** switch "Use automated settings" OFF, add Colombia to the banner regions, publish Spanish banner text (provided), set Meta data sharing level deliberately (recommend Standard or Enhanced first; Maximum only after the policy block "version B" is live), then check Events Manager Test events with a declined and an accepted visit.
3. **Gate 2 - before the first ad spend:** banner live >= 3 days; privacy "bloque Meta" published; "No vendemos..." sentence replaced.
4. If the owner (or a lawyer) prefers the most conservative posture: **Option B today** - no downside except a small drop in measured Shopify sessions and a visible banner. Confidence in preferring C over B: **MEDIUM** (the legal difference between B-now and C is small and uncertain; the measurement/UX difference is also small today).
5. Never choose "Option A forever" if Meta/any ad pixel will be connected.

### The only decision that truly needs the owner (one question, plain Spanish)

> **¿Cuándo quieres que la tienda muestre el aviso de cookies con botones "Aceptar" y "Rechazar" a quienes la visitan desde Colombia?**
> 1. **Solo cuando conectemos Meta/publicidad** (recomendado; mientras tanto corregimos los textos legales y la tienda sigue sin aviso).
> 2. **Desde hoy** (más prudente legalmente; la tienda mostrará un aviso pequeño y Shopify medirá algunas visitas menos).
> 3. **Nunca** (no recomendado si vamos a usar Meta).

Everything else is a default I can apply without asking: keep Shopify Network Intelligence ON; use the published email as the rights channel; use tuteo; put the publication date as the policy's effective date. Items that still need the owner's factual confirmation are listed as `[DECISION DUENA]` inside the proposed texts, but each has a default so none blocks publishing.

---

## 5. Verification gaps and caveats
- sic.gov.co pages returned TLS certificate errors from the fetch tool; SIC concept 16-172268, Titulo V and Circular 005/2017 were read through secondary summaries -> MEDIUM.
- Res. 32126/2022 (SIC "first cookie pronouncement") is **unverified**; do not cite it in public texts.
- Installed-apps list could not be read (Admin GraphQL `appInstallations` -> ACCESS_DENIED for this token); app inventory relies on the earlier project handoffs (Wompi plugin via conexa.ai, Envia, Search & Discovery) and on what the live HTML shows.
- No DevTools cookie inventory was possible (browser forbidden in this lane). Recommend a 5-minute DevTools check of cookie names before publishing the cookie table.
- Re-check status of PL 282/2026 before relying on any "contract performance" legal basis.
- Not legal advice; **consult a Colombian lawyer** on: whether first-party analytics need authorization; the validity of Shopify's terms as an art. 25 transmission contract; the US adequacy list; RNBD exemption; Ley 2300 for any marketing messages.

## 6. Sources (all fetched 2026-10-02)
- Ley 1581 de 2012: https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=49981
- Decreto 1377 de 2013: https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=53646 (also funcionpublica.gov.co i=53646)
- Decreto 1074 de 2015 (Funcion Publica): https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=76608
- Decreto 090 de 2018 (SIC boletin): https://www.sic.gov.co/boletin-juridico-febrero-2018/ ; SIC news on reduced RNBD universe
- SIC Boletin Juridico Sept 2016 (cookies): https://www.sic.gov.co/recursos_user/boletin-juridico-sep2016/articulo/datos/tratamiento-datos-personales-a-traves-de-cookies.html
- Ley 1480 de 2011 art. 50: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306 ; https://leyes.co/el_estatuto_del_consumidor/50.htm
- SIC Circular Externa 005/2017 summaries: dernegocios.uexternado.edu.co, hklaw.com, ambitojuridico.com
- SIC reform news (2025-08-12): https://sedeelectronica.sic.gov.co/noticias/gobierno-nacional-impulsa-reforma-clave-de-la-ley-de-proteccion-de-datos-personales-en-colombia ; Presidencia 2025-08-28; CiberLATAM on PL 282/2026
- Secondary commentary: vanegasmorales.com (cookies Colombia/Spain/EU/Uruguay), ochgroup.co (cookies), vanguardia.com 2022-06-03
- Shopify: help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings ; .../shopify-network-intelligence-requirements ; shopify.dev/docs/api/customer-privacy ; shopify.dev/docs/api/web-pixels-api/pixel-privacy ; https://www.shopify.com/legal/cookies ; https://www.shopify.com/legal/privacy/customers ; help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing
- Meta: https://www.facebook.com/legal/technology_terms (Business Tools Terms s.3) ; https://developers.facebook.com/docs/app-events/guides/data-processing-options (LDU)
- Wompi Shopify plugin doc (event URL on conexa.ai): https://docs.wompi.co/en/docs/colombia/wompi-shopify-plugin/ ; Wompi privacy policy: https://wompi.com/es/co/politica-de-privacidad
