# 03Q — LAUNCH-TODAY FAST TRACK (prepared by Claude; NOTHING public executed; waits for ChatGPT + owner GO)

PREPARED: 2026-10-02 ~08:55 America/Bogota · Owner said at ~08:50: "quiero sacar la página hoy mismo".
STORE: `wgcvpd-ib.myshopify.com` (Basic monthly active, password protected, RC1.10 unpublished, Wompi TEST).
RULE: no domain/DNS, password removal, theme publish, Wompi LIVE or real payment happens without ChatGPT approval + explicit owner GO in chat.

## 1. Read-only recon of the current public site (no changes made)
| Item | Finding (public DNS/HTTP, 2026-10-02) |
|---|---|
| Domain | `radaelliswimwear.com` |
| Nameservers | `ns1.dns-parking.com`, `ns2.dns-parking.com` → **Hostinger DNS** (DNS editable in the owner's Hostinger hPanel) |
| Apex `@` | **A 216.150.1.1** (Vercel), TTL 300 |
| `www` | **CNAME e7eb3f32d99d3261.vercel-dns-017.com** (Vercel), TTL 300 |
| Mail | **MX mx1/mx2.hostinger.com** → `info@radaelliswimwear.com` lives at Hostinger; SPF `v=spf1 include:_spf.mail.hostinger.com ~all`; TXT google-site-verification + facebook-domain-verification |
| Current site | HTTP 200, `server: Vercel` (old custom Next.js site is LIVE) |
Consequences: (1) TTL is already 300 s → cutover and rollback propagate in ~5 min; (2) **do NOT touch MX/TXT** (email keeps working); (3) only two records change at launch.

## 2. Target DNS records — AUTHORITATIVE, read from Shopify Admin for THIS store on 2026-10-02 10:17 (domain connected non-publicly with owner authorization)
Admin > Settings > Domains > `radaelliswimwear.com` (id 179957956907, «Gestionado por Hostinger», estado «Requiere configuración»), «Actualiza estos registros existentes»:
| Tipo | Nombre | Valor actual (Vercel) | Actualizar a |
|---|---|---|---|
| A | @ | 216.150.1.1 | **23.227.38.65** |
| CNAME | www | e7eb3f32d99d3261.vercel-dns-017.com | **shops.myshopify.com** |
- Shopify listed **only these two** for this store. Public DNS (1.1.1.1) at 10:18: apex has **no AAAA** (SOA only) and `www` has no AAAA → no IPv6 record conflicts; the generic IPv6 `2620:0127:f00f:5::` is NOT required by this store's page (re-check the page right before cutover; if Shopify then lists an AAAA, add exactly what it shows).
- **Preserve (do not touch):** MX 5 mx1.hostinger.com / 10 mx2.hostinger.com; TXT `v=spf1 include:_spf.mail.hostinger.com ~all`; TXT `google-site-verification=…`; TXT `facebook-domain-verification=…` (Meta domain verification already exists — useful for L8); NS dns-parking.com.
- Shopify offers an automatic path («Hostinger → Iniciar sesión», Domain Connect): it needs the **owner's own Hostinger login** (owner-only). Manual alternative: edit the two records in hPanel > DNS Zone. Do NOT click «Actualicé los registros DNS» before the records really changed.
- The domain's current type is «**Redirige a wgcvpd-ib.myshopify.com**» (it is NOT primary): at S7, after DNS + SSL are green, change it to **Tienda principal / Principal** (and www → apex), otherwise visitors would be redirected to the myshopify.com URL.
- Public site untouched after the connection (10:18: apex HTTP 200 from Vercel; www 308 → apex).
**Rollback (restores the old site within ~5 min):** `A @ → 216.150.1.1`, `CNAME www → e7eb3f32d99d3261.vercel-dns-017.com`. Re-enable the storefront password in Shopify.
**Wompi events URL caveat for a FULL rollback (GAP-01 from the handover lane):** Wompi keeps ONE events URL per environment and it has pointed to Shopify since ~08:10; the previous value was not recorded. From the old site's code (`app/api/webhooks/wompi/route.ts`, `docs/API.md`) it was almost certainly `https://radaelliswimwear.com/api/webhooks/wompi` (inferred, not read from Wompi). If the old Vercel site must charge again, the owner must put that URL back in Wompi (production events URL) — and Shopify checkout payments would then stop confirming. Treat «minimal rollback» (password back ON, DNS untouched) as the first option; use full rollback only for a critical Shopify failure.

## 3. Sequence (target wall-clock ≈ 60–90 min after GO; most of it is DNS/SSL wait)
| Step | Who | Action | Time | Gate |
|---|---|---|---|---|
| S0 | ChatGPT + owner | **GO** in chat: authorizes cutover of `radaelliswimwear.com` from Vercel to Shopify today, the real payment smoke test and publication | 1 min | GO |
| S1 | owner | **Check the old site for in-flight/pending orders** (Claude never touches production DB) and decide how to honor them manually | 5 min | owner-only |
| S2 | owner | Wompi **LIVE**: Shopify Admin > Settings > Payments > Wompi > turn **test mode OFF** (production keys were entered at onboarding; if the app says keys are invalid, owner re-enters them herself) | 2 min | owner-only (Wompi LIVE) |
| S3 | Claude prepares / owner pays | **Real-money smoke test BEFORE opening the store** (storefront still password protected, staff preview session): Claude creates ONE hidden temporary product (COP 5.000 proposed; deleted afterwards); **BEFORE she pays Claude shows the exact amount and discloses that the test is NOT guaranteed cost-free** (per Wompi support a completed refund can leave the transaction commission + IVA on that commission charged to the merchant; a same-day immediate annulment may avoid settlement if the card network allows it); after approval/payment: attempt **immediate annulment first** when supported, otherwise refund + cancel/archive; temp product deleted; inventory baseline checked; any actual cost recorded as **LAUNCH TEST COST** (worst-case estimate for COP 5.000 with Wompi's public Plan Avanzado «2,65 % + $700 + IVA» ≈ COP 990; her contract may differ; card retenciones are tax withholdings, not cost) (Wompi commission IVA is a provider fee, distinct from customer IVA = 0) | 10 min | owner authorizes amount + fee caveat; card typed by owner |
| S4 | Claude | ✅ **DONE 2026-10-02 10:17 (owner authorized in chat: «Sí, conéctalo ahora»)** — Shopify Admin > Domains > Connect existing domain `radaelliswimwear.com` (non-public; not primary; DNS untouched). Exact records captured in section 2. **Re-read the page immediately before S5.** | done | done |
| S5 | owner (or Claude inside her logged-in Hostinger tab after GO) | Hostinger hPanel > Domains > DNS Zone: change **A @** and **CNAME www** to Shopify values (section 2). Nothing else | 5 min | owner login / DNS approval |
| S6 | Shopify (wait) | Verification + free SSL certificate; usually 5–30 min, can take up to 1 h. During this window HTTPS on the custom domain may warn/fail (old site is already off DNS) → schedule when the owner accepts a short window | 5–60 min | — |
| S7 | Claude | Set primary domain `radaelliswimwear.com` (www → apex redirect), **remove storefront password**, **publish RC1.10** (Horizon goes unpublished), confirm announcement bar decision (default keep) | 5 min | GO |
| S8 | Claude | Post-launch certification on the REAL domain: HTTPS apex/www, canonical/OG, sitemap/robots, 51 redirects, Home/collections/PDP samples, filters, cart→checkout (Wompi LIVE visible), social links, console/network, responsive; report | 15 min | — |
| S9 | owner (optional, post-launch) | Verified sender `info@radaelliswimwear.com`: add the DKIM/SPF records Shopify shows (second DNS edit at Hostinger; keep MX) + click the verification link in the info@ mailbox | 10 min | owner login |
| S10 | Claude + owner | Day-1 watch: first real order → email → Envia label purchase (owner funds Envia; real label = owner only) | ongoing | owner-only |

## 4. What Claude has ALREADY staged (no public impact)
Theme RC1.10 parity 98/98 (unpublished) · 29 products/98 variants/95 images · inventory 98/98 · 128 uds · shipping 5 zones + exact 299.899/299.900 proof · 51 redirects · filters Talla/Color/Price · Spanish default locale · policies/pages/menus · Wompi TEST sandbox E2E PASS (#1001 cancelled+archived, inventory restored) · notification events verified · PayPal Express disabled · Envia linked · report + evidence on `shopify-migration-backup`.

**S3 pre-staged 10:35 (non-public, reversible):** temporary product `prueba-lanzamiento-interna` — «PRUEBA DE LANZAMIENTO - NO COMPRAR», status **DRAFT** (not visible, not in `products.json`), product `gid://shopify/Product/15398037258539`, variant `gid://shopify/ProductVariant/67630080557355`, price COP 5.000 (**amount still needs the owner's explicit approval before she pays**), no shipping, taxable=false, inventory not tracked, tags `interno, prueba-lanzamiento`. At test time: publish to Online Store → cart/checkout link → owner pays → verify → annul/refund → **DELETE the product** (Admin count must return to 29 active / no temp artifacts) and tag the test order `interno`. Catalog baseline stays 29/98/95 while it is a draft.

## 5. Decisions that affect launch day (defaults apply if ChatGPT/owner do not answer)
1. **D8 IVA**: ✅ RESOLVED 2026-10-02 (owner is NO RESPONSABLE DE IVA): taxesIncluded=false, no tax rate, checkout shows zero customer IVA (03Q checkpoint 1).
2. **D9 seller identity** (razón social, NIT, address, phone) for «Información de contacto»/«Aviso legal» — recommended before opening to the public (Colombian consumer rules). Default: publish nothing new; footer keeps current legal pages.
3. **D1 announcement bar** `20% DE DESCUENTO EN TODA LA TIENDA`: default keep.
4. Historical data (D7): launch without; migrate later with a 3-order pilot.

## 6. Risks / watch-outs
- Old Vercel site disappears the moment DNS flips: confirm S1 first; keep the old project untouched for rollback.
- SSL provisioning window (S6) is the only unavoidable degraded period.
- Shopify 429 throttling during the live certification: pace requests.
- The first real Wompi payment is the first test of production keys + events URL: that is why S3 happens BEFORE S5.
