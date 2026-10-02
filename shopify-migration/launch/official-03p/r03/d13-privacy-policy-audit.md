# D13 - Audit of the PUBLISHED privacy and cookie texts vs. reality

Store: radaelliswimwear.com. Audit date: 2026-10-02 (America/Bogota). Method: read-only Admin GraphQL (`shop.shopPolicies`, `pages`), read-only HTTP GET of public pages (no browser), and the research in d13-colombia-consent-research.md. Quotes are <= 15 words. Not legal advice; legal references are to be validated with a Colombian lawyer.

---

## 1. What is actually published (and where)

| URL | Source | What it shows | Notes |
|---|---|---|---|
| /pages/privacidad (footer link "Privacidad") | Page `privacidad`, 1,697 chars | **Custom text, old-stack vendors** (Wompi, Resend, Cloudinary), voseo/tuteo mix | Identical body is also stored in the native policy `PRIVACY_POLICY` (same 1,697 chars) but is **not what that policy renders** |
| /policies/privacy-policy and `shopPolicies.url` (checkout.shopify.com/102428803371/policies/55627088171.html) | Native `PRIVACY_POLICY` | **Shopify auto-generated policy** "Última actualización: 2 de octubre de 2026" (sections: Información personal que recopilamos, Relación con Shopify, Transferencias internacionales, Contacto...) | Generic, translated "usted" register, US/EEA-oriented; **phone blank** in Contacto ("llámenos al , envíenos un correo..."); says Shopify supports personalised advertising |
| /pages/cookies (footer "Cookies") | Page `cookies`, 1,415 chars | Generic cookie text; analytics/marketing "Hoy no las usamos" | No native cookie policy exists |
| /policies/contact-information and /pages/contact | `CONTACT_INFORMATION` | Radaelli Swimwear, NIT 1110581909-1; address Calle 93 # 72 - 71 Ap 201 Tr 1 Cj Mirador del Parque, Barranquilla, Atlántico; WhatsApp/phone 3135359668; email radaelliswimwear@gmail.com; PQR channel = that email | Aligned with Ley 1480 art. 50 on its face (name, NIT, address, phone, email) |
| /policies/legal-notice | `LEGAL_NOTICE` | Titular/vendedor; says "El responsable del tratamiento de tus datos es Radaelli Swimwear" and links /pages/privacidad | Controller named here but not inside the policy |
| /pages/terminos, /policies/terms-of-service | Terms | Payment via Wompi; "coordinar tu compra directamente por WhatsApp" | No data-authorization sentence |

**Storefront finding that matters:** the home page has a newsletter form (tag `newsletter`) and a contact form with no notice/authorization text and no policy link at the point of collection.

## 2. Reality: who actually touches visitor/customer data (as of 2026-10-02)

| Actor | Role / data | Evidence | In custom page? | In auto policy? | Action |
|---|---|---|---|---|---|
| **Shopify** (platform, hosting, checkout, customer accounts, analytics; storage in the US) | Processes everything on the store; also **independent controller** for Network Intelligence uses (ON) | Admin read 10:27; homepage HTML (trekkie, pixels manager) | **No** | Yes (generic, "Relación con Shopify") | Add (platform requirement + Dec. 1377 art. 24-25/Ley 1581 art. 26) |
| Shopify Search & Discovery | Shopify first-party app (search/filters); depends on Network Intelligence | Project handoffs; NI dependency per Shopify | No | n/a | Covered under Shopify |
| **Wompi** | Payment; buyer is redirected to Wompi's own page and card data are entered there; Wompi has its own privacy policy (wompi.com/es/co/politica-de-privacidad) | Terms text; Wompi plugin doc | Yes, one clause ("Wompi, para procesar los pagos") | Generic | Expand: role + link to Wompi's policy |
| **conexa.ai** | Webhook/event relay used by Wompi's Shopify plugin (event URL `wompi-event-shopify.conexa.ai`, per Wompi's doc) | docs.wompi.co Shopify plugin page | **No** | No | Add as technical intermediary for payment-status notifications; **confirm payload/location** |
| **Envia.com** | Shipping labels via Shopify app (recipient name, address, phone, email, parcel); **not yet used** | Project handoffs | No | Generic ("envíos") | Add conditional wording; activate when used |
| **Gmail / Google** | Mailbox of the public contact address radaelliswimwear@gmail.com; customer messages stored there | CONTACT_INFORMATION + shop email | No | No | Add (optional line) |
| **WhatsApp (Meta)** | Customer chats via wa.me link in header/footer/Terms | Footer + Terms | No | No | Add: "if you write to us on WhatsApp..." |
| **hCaptcha (via Shopify forms)** | Spam protection on newsletter/contact forms; loaded from cdn.shopify.com; "Protegido por hCaptcha" | Homepage HTML | No | No | Add one line (low severity) |
| Hostinger | Domain DNS + info@ mailbox (+ old hosting). Holds customer data **only if** customers write to info@ - which is **not** the published address | Brief; contact policy shows Gmail | No | No | Not needed now; add if info@ is ever published |
| Vercel (old site) | Old stack, "now unused" | Brief | No | No | **Confirm it is disabled**; confirm it holds no personal data |
| **Resend** | Old stack transactional email | Policy text only | **Yes (stale)** | No | **Remove** - but first confirm whether Resend still stores any customer emails; if yes, delete/close the account and then remove |
| **Cloudinary** | Old stack image host, "no personal data" | Policy text only; **no cloudinary host in live HTML** | **Yes (stale)** | No | Remove after confirming account closed |
| Meta (Pixel / Conversions API / Instagram ads) | **Not connected**. Planned | HTML scan: no fbq/facebook scripts | n/a | Auto policy claims ad personalization via Shopify | Keep out of the "today" text; use the "bloque Meta" at activation |
| Google (GA/GTM/Ads) | Only a `google-site-verification` TXT (ownership proof); **no GA/GTM in the HTML** | HTML scan + brief | n/a | n/a | Nothing to disclose today |
| Instagram / Facebook / TikTok | Outbound links only (no embeds/widgets found) | HTML | n/a | n/a | Optional "enlaces a terceros" line |
| Shopify Inbox / chat | Not present in homepage HTML (no `shopify-chat`) | HTML scan | n/a | n/a | n/a |

Not verifiable: the installed-apps list (Admin `appInstallations` returned ACCESS_DENIED for this token). App inventory above relies on project handoffs plus the public HTML.

## 3. Gap list

Severity: **C** critical (statement false or direct contradiction), **H** high (missing item the Colombian regime or a platform contract expects), **M** medium, **L** low.

### Privacy policy (/pages/privacidad)
| # | Sev | Offending text (<=15 words) | Problem | What to do |
|---|---|---|---|---|
| 1 | **C** | *"Resend, para enviarte los correos transaccionales de tu pedido"* | Old-stack vendor. Shopify's native notifications are the normal sender of order emails on the live store (not verified in admin); no Resend integration is visible and no Resend/Cloudinary host appears in the live homepage HTML. | Remove after confirming no data remain there |
| 2 | **C** | *"Cloudinary, que aloja únicamente las imágenes de producto y no recibe datos personales tuyos"* | Same: stale; no cloudinary host appears in the live homepage HTML | Remove |
| 3 | **C** | *"No vendemos ni compartimos tus datos con terceros para fines publicitarios."* | Contradicted by the auto policy live at /policies/privacy-policy ("utilizamos Shopify para respaldar la publicidad personalizada...") and by Network Intelligence = ON (Shopify: ad targeting). Also becomes false the day Meta is connected | Rewrite: "No vendemos tus datos personales" + disclose Shopify's role; separate Meta block at activation |
| 4 | **C** | (two policies) Custom page vs auto policy at /policies/privacy-policy | Two different, mutually inconsistent privacy policies are live; the native one is what Shopify's checkout links; its **phone field is blank** ("llámenos al ,") | Pick one canonical text; turn off automation for the privacy policy (verify in Settings > Policies / Customer privacy) and publish the corrected text natively, or redirect; use **absolute URLs** in the body (relative links would break at checkout.shopify.com) |
| 5 | **H** | *"Compartimos datos únicamente con los proveedores que necesitamos para operar la tienda"* | **Shopify is never named** (platform, hosting, data stored in the US, Network Intelligence). Shopify requires merchants to disclose hosting/processing and link its Consumer Privacy Policy when NI is on | Add Shopify section with links (shopify.com/legal/privacy/customers, privacy.shopify.com) |
| 6 | **H** | *"Wompi, para procesar los pagos"* | Role not explained (redirect, card data typed on Wompi's page, Wompi's own policy); **conexa.ai** (event relay) and **Envia.com** (labels) missing; WhatsApp and Gmail not mentioned | Expand processors/third-party list |
| 7 | **H** | (absent) controller identification | Decreto 1377 art. 13(1) wants name, domicilio, address, email, phone **inside the policy**; here only "Radaelli Swimwear se reserva el derecho..." appears. NIT/address/phone live only in /policies/contact-information and the legal notice | Add "Responsable del tratamiento" with the exact published data |
| 8 | **H** | *"podés acceder, corregir o solicitar la eliminación de tus datos personales"* | Ley 1581 art. 8 list is incomplete (conocer, actualizar, rectificar, suprimir, **revocar** la autorización, **prueba de la autorización**, **queja ante la SIC**, acceso gratuito) | List all rights |
| 9 | **H** | *"escribinos por los canales de contacto de la tienda"* | No named channel, no responsible area, no procedure or time limits (consulta 10 días hábiles; reclamo 15 días hábiles). Dec. 1377 art. 13(4)-(5), Ley 1581 arts. 14-16 | Name the email, the area ("Atención al cliente"), the procedure and deadlines |
| 10 | **H** | *"recopilamos los datos necesarios para gestionarlo: nombre, dirección de entrega, teléfono y correo"* | Purposes are not separated (necessary vs optional); **no authorization statement**; no notice at the newsletter field ("Dejá tu correo y recibí aviso...") or contact form (Ley 1581 arts. 9 and 12; Dec. 1377 art. 5) | Add finalidades by category; authorization clause; microcopy under the newsletter field |
| 11 | **H** | (absent) international transfers | Data stored in the US (Shopify); no mention of transfer/transmission (Ley 1581 art. 26; Dec. 1377 arts. 24-25) | Add transfers section |
| 12 | **H** | *"Conservamos los datos de tus pedidos mientras sea necesario"* | Retention is open-ended; no vigencia date for the policy/database (Dec. 1377 art. 13(6), art. 11) | Add effective date and period [DECISIÓN DUEÑA] |
| 13 | M | *"Usamos cookies para que la tienda funcione correctamente."* | Says cookies are only for function; Shopify Analytics cookies are in use (see cookie gaps) | Rewrite with categories |
| 14 | M | *"Radaelli Swimwear se reserva el derecho de actualizar esta política"* | No date, no commitment to communicate substantial changes in advance (Dec. 1377 art. 13) | Add version date and notice commitment |
| 15 | M | (absent) minors / sensitive data | Dec. 1377 art. 12; sensitive-data statement expected | Add short statements [validar con asesor] |
| 16 | M | *"Si creás una cuenta en la tienda, también guardamos los datos"* | Mixed voseo ("creás", "podés", "consultá", "escribinos") vs tuteo ("¿Tienes dudas?", "Contáctanos"). Barranquilla audience and the contact/legal/terms policies use tuteo | Normalize to tuteo (also theme strings: "Dejá tu correo", "agregá tus favoritos") |
| 17 | L | *"¿Tienes dudas? Contáctanos"* (link `/#contacto`) | Works only because the footer has `id="contacto"` on the homepage; vague as a rights channel | Link to the email/contact page |

### Auto-generated policy at /policies/privacy-policy
| # | Sev | Text | Problem |
|---|---|---|---|
| 18 | **H** | *"llámenos al , envíenos un correo electrónico a radaelliswimwear@gmail.com"* | Blank phone number |
| 19 | **H** | *"Si transferimos su información personal fuera del Espacio Económico Europeo"* | EEA/UK transfer language; not Colombian; no Ley 1581/habeas-data wording, no SIC, no revocation right, no procedure, no controller NIT/address |
| 20 | M | *"Derecho a la portabilidad de los datos."* / "menores de 16" / "vendamos... (según la definición...)" | US/EU-style rights and age limits; Colombian rights and the under-18 rule are absent |
| 21 | M | register "usted" | Differs from the rest of the site (tuteo) |

### Cookie policy (/pages/cookies)
| # | Sev | Offending text (<=15 words) | Problem | What to do |
|---|---|---|---|---|
| 22 | **C** | *"Opcionales, requieren tu consentimiento. Hoy no las usamos."* (analytics) | **Shopify Analytics is running**: `trekkie`/`ShopifyAnalytics` + `monorail-edge.shopifysvc.com` in the homepage HTML; Shopify classes `_shopify_analytics`, `_shopify_y`, `_shopify_s`, `_landing_page`, `_orig_referrer`, `shop_analytics` as analytics cookies; with no banner region, Shopify allows all purposes by default | State that Shopify Analytics is used today, and how to opt out |
| 23 | **C** | *"Podés cambiar tus preferencias de cookies analíticas y de marketing cuando quieras."* | Promises a control that **does not exist** (no banner, no preferences link, no Customer Privacy API UI) | Remove until the banner exists, or describe the real mechanism (browser settings + email) |
| 24 | M | *"Hoy no las usamos"* (marketing) | Accurate for third-party ad pixels (none in the HTML), but Shopify's own `_shopify_marketing` exists and Shopify pixel containers declare MARKETING purpose | Say "no instalamos píxeles de terceros (Meta, Google, TikTok)" instead of a blanket "no" |
| 25 | M | *"mantener tu carrito de compra, tu sesión si tenés una cuenta"* | Essential cookies not listed by name/duration; the wishlist uses `localStorage` (`radaelli:wishlist`), not mentioned; Wompi's own cookies on its page not mentioned; hCaptcha not mentioned | Add a short table of real cookies/technologies |
| 26 | M | *"Siempre activas — no requieren tu consentimiento"* | Fine for strictly necessary ones, but unsupported by an express Colombian rule (see research); soften to "necesarias para el funcionamiento" | Reword |
| 27 | L | Cookie policy is separate from the privacy policy | Privacy page says only "Usamos cookies para que la tienda funcione" while the SIC (concepto 16-172268) expects cookie policy communicated through the treatment policy/aviso | Cross-reference both ways |

### Platform / process gaps
| # | Sev | Item |
|---|---|---|
| 28 | H | Shopify Network Intelligence ON requires disclosure + link to Shopify's Consumer Privacy Policy (not present in the custom page; only the auto policy carries it) |
| 29 | M | No consent mechanism or log at all today for Colombian visitors (see D13 options), and no authorization text at the newsletter/contact forms or in the Terms, so evidence of authorization (Dec. 1377 art. 8) is thin |
| 30 | M | Contact email is a Gmail address; info@ (Hostinger) exists but is unpublished. Fine for now (rights channel = published email) but decide before Meta whether the domain mailbox should replace it |

## 4. TOP 8 gaps to fix first
1. **Two conflicting privacy policies live** (custom /pages/privacidad vs Shopify auto-generated at /policies/privacy-policy, with a blank phone) - choose one canonical text. (#4, #18)
2. **Cookie policy says analytics "Hoy no las usamos"** while Shopify Analytics runs, and promises preference controls that do not exist. (#22, #23)
3. **Stale vendors Resend/Cloudinary** named as current processors. (#1, #2)
4. **Shopify missing**: platform/hosting, US storage, Network Intelligence, link to Shopify's consumer policy. (#5, #11, #28)
5. **Decreto 1377 art. 13 minimum content missing**: controller identification inside the policy, area/channel, procedure and deadlines, effective date/vigencia. (#7, #9, #12)
6. **Rights list and authorization**: incomplete art. 8 rights, no authorization/purpose statement, nothing at the newsletter/contact forms. (#8, #10)
7. **"No vendemos ni compartimos... fines publicitarios"** is contradicted by Network Intelligence/auto policy and will be false once Meta is connected. (#3)
8. **Processors omitted**: conexa.ai, Envia.com, WhatsApp, Gmail, hCaptcha, plus Wompi's role. (#6)

## 5. Questions to confirm (defaults provided in d13-proposed-texts-es.md, none blocks publishing)
- Does any customer personal data still sit in Resend/Cloudinary/Vercel (old stack)? If yes, close/delete first, then remove from the policy.
- What exactly does conexa.ai receive and where is it hosted? (Wompi docs only show the event URL.)
- Is the mailbox that actually answers customers the Gmail address (assumed)?
- Will newsletter/WhatsApp marketing be sent? (then Ley 2300/2023 hours and an unsubscribe route apply.)
