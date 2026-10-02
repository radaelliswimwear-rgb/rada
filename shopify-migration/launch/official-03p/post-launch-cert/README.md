# Post-launch certification kit - radaelliswimwear.com (03Q)

Author: script lane L, 2026-10-02. Everything here is **read-only against the live store** except two cart
endpoints (`POST /cart/add.js`, `POST /cart/clear.js`, hard-guarded in code). No secrets, no Admin access, no git.

## Files

| File | What it is |
|---|---|
| `post-launch-cert-core.js` | In-page script. Exposes `window.__PL`, `__PLRUN(phase)`, `__PLSTATUS()`, `__PLSUMMARY()`, `__PLROWS()`, `__PLDUMP()`, `__PLRESET()`. Phases: `catalog routes search filters redirects links locale hostRedirect responsive cart` (+ `clean`, `all`). |
| `post-launch-cert-pdp-harness.js` | In-page script. 29 PDP / 98 variants / 95 images at an exact 390 px iframe. `__PDPRUN({HANDLES,LIMIT})`, `__PDPRETEST()`, `__PDPSTATUS()`, `__PDPSUMMARY()`, `__PDPROWS()`, `__PDPDUMP()`. |
| `dist/*.min.js` | Same scripts with whole-line comments/indentation stripped (about 15 percent fewer tokens to paste). Regenerate with `node post-launch-cert-assemble.mjs build`. Self-tests pass on both variants. |
| `post-launch-cert-assemble.mjs` | Offline assembler: `report` (builds the certification report + exit code), `redirects` (re-embeds the redirect list from an Admin export), `build`, `check`, `selftest`. |
| `rollback-and-health.md` | Rollback plan, 5-minute health checklist, read-only `curl.exe` / `Resolve-DnsName` commands. |
| `selftest/` | Offline mock storefront + DOM shim + tests (`core`, `pdp`, `e2e`). Never touches the network. |

Run the offline self-tests any time (about 20 s): `node selftest/core.selftest.mjs; node selftest/pdp.selftest.mjs; node selftest/e2e.selftest.mjs; node post-launch-cert-assemble.mjs selftest`
(last result: core 120/120, pdp 42/42, e2e 12/12, assembler 23/23, README snippets 29/29 via `node selftest/snippet-check.mjs`, `node --check` clean on all JS).

## Preconditions

1. DNS has been switched and `https://radaelliswimwear.com/` answers 200 with a valid certificate (do the curl/DNS checks of
   `rollback-and-health.md` first - they take 2 minutes and tell you whether the in-page run is worth starting).
2. The storefront password is OFF (the `routes` phase also detects a redirect to `/password` and `robots.txt` with a blanket `Disallow: /`).
3. One browser tab on the **primary** host (apex unless the owner chose www). The tab must stay **visible/foreground** during `responsive`
   and the PDP harness (a hidden tab throttles timers and keeps lazy images unloaded - that is the only source of false positives).
4. Do not navigate the tab while a phase runs (globals die with the navigation; results are saved to `sessionStorage` after every
   phase - re-paste with `window.__PLCFG={restore:true}` to get them back).
5. Never run the core script and the PDP harness at the same time, and never in two tabs: each paces independently, so two
   runners double the request rate (see the 429 rules).

## Exact order of execution

| # | Where | Action | Expected | Time |
|---|---|---|---|---|
| 0 | coordinator, shell | `rollback-and-health.md` section 3: DNS (A, CNAME, MX, TXT), TLS (`curl.exe -vI`), http->https, www redirect, home 200 not `/password` | all as listed there | 2-3 min |
| 1 | browser | Navigate the tab to `https://radaelliswimwear.com/` | Home renders | - |
| 2 | page | Paste `post-launch-cert-core.js` (or `dist/...min.js`). Optional first: `window.__PLCFG={gap:1600}` | returns `PL ready PL-1.0 base=https://radaelliswimwear.com ...` | - |
| 3 | page | `await window.__PLRUN('catalog')` | 29 products / 98 variants / 95 images | 5 s |
| 4 | page | `await window.__PLRUN('routes')` | 25 checks, 0 fail | 55 s |
| 5 | page | `await window.__PLRUN('search')` then `await window.__PLRUN('filters')` | search 2/2/3/0, XL 11, NEGRO 6, price filter = derived | 10 s + 10 s |
| 6 | page | `window.__PLRUN('redirects',{bg:true})`, poll `window.__PLSTATUS()` every 30-60 s | 51/51 (+2 inventory rows = 53 ok) | ~2 min |
| 7 | page | `await window.__PLRUN('links')`, `'locale'`, `'hostRedirect'` | 16 internal links 200 (14 + «Información de contacto» + «Aviso legal», D9), 4 social in DOM; es/en SEO; www redirects (browser fetch error = soft warn: confirm with `curl.exe -I`) | 30 s + 12 s + 8 s |
| 8 | page | `window.__PLRUN('responsive',{bg:true})`, poll | 18/18 (6 pages x 390/768/1440): 0 overflow, 0 broken img, 0 own console errors | ~3.5 min |
| 9 | page | **Save** `window.__PLSUMMARY()` and `window.__PLDUMP()` to `core.json` (coordinator copies the returned JSON string to a file) | `verdict: PASS` or `PASS_PARTIAL` (cart not run yet) | - |
| 10 | page | Paste `post-launch-cert-pdp-harness.js`; `window.__PDPRUN({})` (bg), poll `window.__PDPSTATUS()` every 60 s | 29 tested | ~8 min |
| 11 | page | `await window.__PDPRETEST()` (re-tests the lazy-image PDPs with an extended wait; run only if `lazyPendingNeedRetest` is not empty) | 0 pending / 0 broken | 0-5 min |
| 12 | page | `window.__PDPSUMMARY()` and `window.__PDPDUMP()` -> `pdp.json` | `verdict: PASS`, variants 98 (bad 0), images 95, `totalsOk: true` | - |
| 13a | page | Simple path: `await window.__PLRUN('cart')` (add 1 unit via `/cart/add.js`, verify `/cart.js`, price = catalog, currency COP, checkout button on /cart, then clear and verify empty) | 6-7 checks ok, `cartClean: true` | 20 s |
| 13b | page + coordinator | Checkout-reach path: `await window.__PLRUN('cart',{keep:true})` (leaves 1 unit; add `qty:2` if you want the cart above the 299.900 free-shipping threshold) -> **coordinator navigates to `/checkout`** and does the checkout checks below, **never pays** -> navigate back, re-paste core with `window.__PLCFG={restore:true}`, `await window.__PLRUN('clean')` | cart empty | 3-5 min |
| 14 | page | `window.__PLSUMMARY()` and `window.__PLDUMP()` again -> final `core.json` (it now includes `cart`) | `verdict: PASS`, `missing: []`, `cartClean: true` | - |
| 15 | coordinator | Fill `external.json` (checks outside the page, below) | all PASS | 10 min |
| 16 | coordinator, shell | `node post-launch-cert-assemble.mjs report --core core.json --pdp pdp.json --external external.json --out <dir>` | `verdict: CERTIFIED`, exit 0 | - |

Shortcut for steps 3-9 (+13a): `window.__PLRUN('all',{bg:true})` (about 9 minutes), poll `__PLSTATUS()`, then
`__PLSUMMARY()`. Use `window.__PLRUN('all',{bg:true,skip:['cart']})` when you want 13b instead of 13a.
Options per phase: `window.__PLRUN('all',{bg:true,opts:{cart:{keep:true}}})`.
A single failed row can be re-run alone: `await __PLRUN('routes',{only:['/collections/aurora-viva']})`,
`await __PLRUN('redirects',{only:['/devoluciones']})`, `await __PLRUN('responsive',{only:['PDP'],widths:[390]})`.

Standalone cart cleaner (works on any page of the origin, also after navigating back from checkout, no script needed):
`(async()=>{const r=await fetch('/cart/clear.js',{method:'POST',headers:{'X-Requested-With':'XMLHttpRequest'}});const c=await (await fetch('/cart.js',{cache:'no-store'})).json();return {clear:r.status,items:c.item_count}})()`

## Time estimate (gap 1.6 s, one runner at a time)

| Block | Requests | Estimate |
|---|---|---|
| core `all` (catalog, routes, search, filters, redirects, links, locale, hostRedirect, responsive, cart) | about 120 paced requests + 18 iframe loads (9.5 s each) | 8-10 min |
| PDP harness (29 PDP, 98 variant clicks) | 59 paced requests + 29 iframe loads (about 15 s each) | 7-9 min |
| PDP re-test of lazy PDPs | 1 request + up to about 30 s per PDP | 0-5 min |
| Coordinator outside-the-page checks | - | 10-15 min |
| Total, including report | | about 30-40 min |

## Expected values (all must match; the run reports each one)

| Item | Expected |
|---|---|
| Products / PDP | **29** |
| Variants | **98** (tested by real clicks in the PDP harness) |
| Images | **95** (sum of `products.json` images; 95/95 load in the harness) |
| Redirects | **51** = 42 same-origin (200, final path = target, `redirected`) + 9 `/cuenta/*` -> `/account*` (`redirect:'manual'` -> `opaqueredirect`) |
| Collections (distinct `/products/` links in `main`) | oasis-natural **10**, aurora-viva **12**, espuma-de-ola **7**, salidas-de-bano **0**, destacados **7**; `/collections/all` **24** on page 1 + **5** on `?page=2` (29) |
| Search `q=` | marea **2**, verde **2**, terracota **3**, xyzqwerty **0** |
| Filters on `/collections/all` | `filter.v.option.talla=XL` **11**, `filter.p.m.custom.color=NEGRO` **6**, `filter.v.price.lte=160000` = count derived from `products.json` (6 at lab prices; soft check) |
| 404 | `/collections/`, `/pages/`, `/products/` `no-existe-xyz` -> HTTP 404 |
| Pages / policies | 200: `garantia envios terminos privacidad cookies favoritos`, policies `refund-policy privacy-policy terms-of-service shipping-policy`, `/cart`, `/search`; `/pages/contact` is a soft check |
| Header/footer internal links | **14** unique, all 200 (soft count; `/account*` accepted as `opaqueredirect`); 4 social links present in the Home DOM (instagram.com/Radaelli_swimwear, facebook.com/Radaelli_Swimwear, tiktok.com/@RadaelliSwimwear, wa.me/573135359668) |
| Locale / SEO | `/` `html lang=es`, canonical host = tab host, hreflang `x-default`, `es`, `en` on that host, `Shopify.locale=es`; `/en/` lang `en` (soft); `Shopify.currency.active=COP`; `robots.txt` without `Disallow: /`; `sitemap.xml` `<loc>` hosts = tab host |
| Host redirect | the non-primary host answers with a redirect (`opaqueredirect` type). Destination and 301 are confirmed with curl |
| Responsive | 6 pages x 390/768/1440: iframe `innerWidth` = width, `scrollWidth <= width+1`, 0 broken images, 0 own console errors (ignored artifacts: `storefrontBaseUrl`, `replaceState`, `Script error`) |
| Cart | add 1 unit -> `item_count` 1, line price = catalog price, currency COP, cleared to 0 |

## 429 pacing rules (Shopify anti-abuse)

* A global minimum of **1.6 s between any two requests** (`gap`), across all phases of the core script (a queue runs one phase at a time).
  The PDP harness uses the same gap on its own clock - **do not run both at once**.
* On HTTP **429** the request waits **60 s** and retries, up to 4 times; each retry is counted (`retries429`). If it still fails the row is
  marked `throttled (429 after retries)`: wait 5 minutes and re-run only that phase (`only:[...]`), optionally with a larger gap
  (`window.__PLCFG={gap:2500}` before re-pasting, only when idle).
* The suite never sends over-stock requests (the 422 bursts that triggered the lab's «Un momento...» page); the cart phase sends exactly one add.
* Iframe pages load about 275 sub-resources from the CDN each; that is not rate limited, but it is why the harnesses run sequentially.
* Analytics beacons inside the test iframes are stubbed (`blockAnalytics`, default true) so the audit does not add fake sessions;
  third-party pixels that run in their own sandbox iframe cannot be stubbed, so a handful of test pageviews may still appear in analytics.
  Note the run window in the report.

## How to read the verdict

`__PLSUMMARY()` returns `{verdict, ran, missing, phases, fails, warns, totals, retries429, requests, cartClean}`:

* `PASS` - all 10 phases ran, 0 failures. `PASS_PARTIAL` - 0 failures but some phases not run (`missing`). `FAIL` - at least one failure
  or a phase errored. `RUNNING` - something is still queued/running. `NOT_RUN` - nothing run yet.
* `fails` entries read `phase: check - reason` (for example `routes: /collections/aurora-viva - 11 product links != 12`). Any entry = not certifiable.
* `warns` are **soft** checks (price-filter derived count, `/en/`, hreflang on `/en/`, `/pages/contact`, link count, pending lazy images in a
  hidden tab, suspicious text such as `translation missing`, www serving content instead of redirecting). They never fail the verdict but
  must be read and noted in the report; a `translation missing` warning is a real content bug.
* `cartClean: false` means the browser cart was left dirty - run `__PLRUN('clean')`.
* Rows: `__PLROWS('routes', true)` returns only failing rows with `why`. Full evidence: `__PLDUMP()`.
* PDP harness `__PDPSUMMARY()`: `PASS` (full run, 29/98/95 and no failures), `PASS_SUBSET` (HANDLES/LIMIT used - not certifiable),
  `FAIL_TOTALS` (all PDP fine but counts differ from 29/98/95 - catalog changed?), `FAIL`, `RUNNING`, `NOT_RUN`, `ERROR`.
  `lazyPendingNeedRetest` must be empty before certifying (run `__PDPRETEST()`; images still pending after the extended wait stay listed and block).
* The assembler combines core + PDP + external checks: `CERTIFIED` (exit 0), `NOT_CERTIFIED` (exit 1, any FAIL), `INCOMPLETE` (exit 2, something
  missing/pending). `N/A` is accepted for an external check only with a written reason.

## Checks the coordinator must do OUTSIDE the page (feed them to `external.json`)

The page cannot see these (cross-origin, TLS layer, Admin data, payment provider). Commands are in `rollback-and-health.md`.

| Id | Check | How |
|---|---|---|
| `tls_apex`, `tls_www` | Valid HTTPS certificate on both hosts: subject covers the host, issuer, not expired | `curl.exe -vI https://radaelliswimwear.com` / `https://www...` (or the .NET snippet) |
| `http_to_https` | `http://radaelliswimwear.com` -> 301 -> `https://` | `curl.exe -sSI http://radaelliswimwear.com/` |
| `www_redirect` | The non-primary host redirects (301) to the primary one, keeping the path | `curl.exe -sSI https://www.radaelliswimwear.com/collections/all` (the in-page `hostRedirect` only proves a redirect happens) |
| `dns_apex`, `dns_www` | A @ and CNAME www are the Shopify values shown in Admin > Settings > Domains (Shopify standard: A 23.227.38.65, CNAME shops.myshopify.com - confirm against Admin) | `Resolve-DnsName` against 1.1.1.1 and 8.8.8.8 |
| `dns_mail_txt` | MX and TXT (SPF/DKIM/DMARC/verification) unchanged from the pre-cutover snapshot | `Resolve-DnsName -Type MX/TXT` |
| `dns_no_residue` | No leftover Vercel records (A 216.150.1.1, CNAME e7eb3f32d99d3261.vercel-dns-017.com) | `Resolve-DnsName` |
| `primary_domain` | Admin: domain connected, SSL active, primary = the intended host | Admin > Settings > Domains (read only) |
| `password_off` | `GET /` is 200 and not `/password` (the in-page `routes` phase also fails on it) | `curl.exe -sS -o NUL -w '%{http_code} %{url_effective}' -L https://radaelliswimwear.com/` |
| `wompi_live` | Wompi shown in LIVE mode at checkout: option present, no test banner, no test-card hint. **Look only, never pay.** | browser, `/checkout` after `__PLRUN('cart',{keep:true})` |
| `shipping_rate` | Real shipping rate shows at checkout for a destination (zone rates 9.900-44.900; free from 299.900; 299.899 pays) | browser at checkout (use `qty:2` for the free case) |
| `inventory_admin` | 29 products, 98 variants, 128 units, all tracked with DENY | Admin GraphQL read |
| `theme_state` | Published theme = certified Radaelli RC1.10 (role MAIN); Horizon not modified | Admin GraphQL `themes` read |
| `redirects_admin` | `urlRedirectsCount` = 51 (the in-page list is the lab export; re-embed from the official export if it differs: `node post-launch-cert-assemble.mjs redirects --from <json> --write`) | Admin GraphQL read |
| `social_http` | The 4 destinations answer (Instagram/Facebook/TikTok may return 3xx/429 to curl: use a browser then and write `N/A` with the reason) | `curl.exe -sSI <url>` |
| `orders_clean` | No unintended orders/draft orders from the certification (cart was never taken past checkout) | Admin read |

`external.json` shape: `{"capturedAt":"2026-10-02 11:30 America/Bogota","checks":{"tls_apex":{"status":"PASS","evidence":"CN=radaelliswimwear.com issuer=... notAfter=..."}, ...}}`
with `status` one of `PASS`, `FAIL`, `N/A` (reason required in `evidence`). Missing ids count as PENDING (INCOMPLETE).

## Notes and limits (be honest in the report)

* `hostRedirect` runs cross-origin with `mode:'no-cors', redirect:'manual'`: only the response *type* is visible (`opaqueredirect` = it redirects;
  `opaque` = it serves content; a thrown error = unreachable/blocked). Status code and `Location` come from curl.
* External social URLs and cross-origin account pages cannot be fetched from the page; only the DOM links are verified there.
* The redirect list is the lab export (`lab-redirects.json`, 51 pairs). If the official store has a different list, re-embed it
  (`redirects --from`), otherwise the `redirects_admin` external check will show the difference.
* `search` counts product links in `main`; the empty-result message is informational. `/products.json` must be public (default).
* The PDP harness clicks real option inputs and accordions inside the iframe; it never adds to cart. Variant `available` is read live,
  so after real sales a sold-out variant is still verified coherently (button disabled iff `available=false`).
* Prices are compared against `/products/<h>.js` (cents), the same rule that certified the lab 29/29 and 98/98.

## Lecciones de la primera corrida real (2026-10-02, dominio radaelliswimwear.com)

- **Analytics stub:** `new Response("",{status:204})` lanza `TypeError` (cuerpo no nulo con estado 204) dentro de los iframes de prueba y marcaba falsos fallos «console 2» en las 18 páginas de `responsive`. Corregido a `new Response(null,{status:204})` en `post-launch-cert-core.js`, `post-launch-cert-pdp-harness.js` y sus `dist/*.min.js`. Los autotests con tienda simulada no lo detectaban (la simulación acepta cuerpo vacío): **siempre correr `responsive` en la tienda real tras cambiar el script**.
- **hostRedirect:** el `fetch` entre hosts (`no-cors`, `redirect:'manual'`) puede fallar en el navegador aunque `curl -I https://www.<dominio>/` muestre 301 al apex. Ahora es **aviso suave**; la verdad la da `curl.exe -I`.
- **internalLinks = 16:** 14 originales + «Información de contacto» y «Aviso legal» (menú Ayuda, publicados el 2026-10-02). Si se agregan enlaces al pie o al menú, ajustar `EXPECT.internalLinks` (por ejemplo `window.__PLCFG={EXPECT:{internalLinks:17}}`).
- Resultado de la primera corrida: catálogo 5/5, rutas 25/25, búsqueda 4/4, filtros 3/3, redirecciones 53/53, idioma/SEO 17/17 (incluye `robots.txt` sin `Disallow: /`, `sitemap.xml` y `canonical` en el dominio real), carrito 7/7, 0 errores HTTP 429, 118 solicitudes.
- **PDP harness (29 fichas / 98 variantes / 95 imágenes, 390 px):** en el dominio real, 29/29 fichas pasaron todas las comprobaciones funcionales (precio por variante, galería, botón, acordeones, canonical, JSON-LD, OG, sin desborde); 15 de 29 mostraban un único mensaje `undefined` en consola, que es un **artefacto del iframe `srcdoc`** (`history.replaceState` y el administrador de píxeles de Shopify no funcionan en `about:srcdoc`). En pestañas normales, recorrer todas las variantes de 3 de esas fichas dio 0 eventos de error. El arnés ahora lo reporta como aviso (`iframe-artifact`), no como fallo. Para dudas, comprobar la ficha en una pestaña normal con un `console.error` envuelto.
