# Rollback plan, 5-minute health checklist and read-only commands - radaelliswimwear.com (03Q)

Everything in sections 3 and 4 is **read-only** (HTTP GET/HEAD, TLS handshake, DNS queries). The write steps of section 1 are done by the
**owner** in the DNS provider and in Shopify Admin (the owner types the storefront password and any provider credentials; they are never
given to the assistant or written to a file).

## 1. Rollback plan

### 1.1 Decide first (guideline for the owner; thresholds are judgement calls, not hard rules)

| Situation | Action |
|---|---|
| Site unreachable, or certificate invalid/mismatched, and Admin > Settings > Domains shows SSL **not** progressing after about 60 min | Rollback (full, 1.3). First read Admin: SSL "pending" right after the switch is normal and can take minutes to hours |
| Home / collections / PDP return 5xx, show the password page, show the wrong theme, or an empty catalog | Rollback |
| Checkout unreachable, no payment method, Wompi not LIVE, or prices/currency wrong at checkout | Stop selling immediately (minimal rollback, 1.2); then decide on 1.3 |
| `add to cart` fails for every product | Minimal rollback, then diagnose |
| MX/TXT damaged (email stops) | Fix the DNS mail records now; this is not a site rollback |
| Cosmetic issue, one product's content, soft warnings (`warns`), a social link, `/en/` | Do NOT roll back; fix forward |

### 1.2 Minimal rollback - stop customers from buying (about 2 minutes, reversible)

1. Shopify Admin > Online Store > Preferences > **Restrict access to visitors with password** > enable, set a password (owner), Save.
   Customers then see the password page on every host that still points to Shopify. Nothing else changes; orders stop.
2. Verify: `curl.exe -sS -o NUL -w '%{http_code} %{url_effective}' -L https://radaelliswimwear.com/` -> final URL ends with `/password`.

### 1.3 Full rollback - restore the pre-launch DNS and theme (owner; DNS propagation depends on the TTL)

Do 1.2 first (so nobody checks out while DNS flips). Then:

**DNS (at the DNS provider)** - restore exactly the pre-launch values:

| Type | Host | Restore to | Remove (the Shopify cutover value) |
|---|---|---|---|
| A | `@` | **216.150.1.1** | the Shopify A record (Shopify standard 23.227.38.65 - take the value you actually see in Admin) |
| CNAME | `www` | **e7eb3f32d99d3261.vercel-dns-017.com** | the Shopify CNAME (Shopify standard `shops.myshopify.com`) |

* Do **not** touch MX, TXT (SPF/DKIM/DMARC/verification), NS or CAA records.
* There must be exactly one A record for `@` and one CNAME for `www` after the change (no mixed Shopify + Vercel answers).
* Set the TTL of the two records to the minimum the provider allows (for example 300 s) while changing; resolvers that cached the Shopify
  answer keep it until the old TTL expires (`Resolve-DnsName ... | Select Name,Type,TTL` shows the remaining TTL).
* Save a text copy of the DNS zone *before* and *after* the change (the coordinator can attach it to the report).
* In Shopify the custom domain may stay listed (it will show a "not connected" warning). Leave it; removing it is not part of the rollback.

**Theme (Shopify Admin > Online Store > Themes)** - only if the launch changed the live theme:

* Shopify has no "unpublish" for the live theme: you *republish the previous one*, which unpublishes the current one.
  If Horizon was the live theme before launch and Radaelli RC1.10 was published over it, rollback = **Publish Horizon**
  (this unpublishes RC1.10; do not edit Horizon or delete RC1.10). Confirm the actual pre-launch state from the launch record
  (`launch/03o` / `03q` runbook) before clicking - do not assume.
* If the launch did not change themes, skip this step.

**Leave alone:** products, collections, the 51 URL redirects, markets/currency, shipping zones, Wompi keys (only the owner changes those), orders.

### 1.4 Verify the rollback (read-only)

```powershell
Resolve-DnsName radaelliswimwear.com -Type A -Server 1.1.1.1 -DnsOnly            # expect 216.150.1.1
Resolve-DnsName www.radaelliswimwear.com -Type CNAME -Server 8.8.8.8 -DnsOnly     # expect e7eb3f32d99d3261.vercel-dns-017.com
curl.exe -sSI https://radaelliswimwear.com/                                        # expect the Vercel site (server: Vercel), not x-shopid / x-shopify headers
```
Then: check Admin > Orders for orders placed during the window (refunds/cancellations are an owner decision), and write the incident note
(time of switch, trigger, time of rollback, what was seen).

## 2. 5-minute post-launch health checklist

Run right after the DNS switch / password removal. `T+` is minutes from the moment DNS is live. Sections 3 and 4 have the exact commands.
Stop at the first red item and go to section 1.1.

| T+ | Check | Green means |
|---|---|---|
| 0:00 | DNS: A @ and CNAME www from two public resolvers; MX/TXT unchanged | Shopify values on both resolvers; no Vercel residue; MX/TXT as before |
| 0:30 | `curl.exe -sSI http://radaelliswimwear.com/` | 301 to `https://radaelliswimwear.com/` |
| 1:00 | TLS on apex and www (`curl.exe -vI` or the .NET snippet) | subject covers the host, issuer present, not expired |
| 1:30 | `GET /` final URL and status | 200 on the primary host, final URL not `/password` |
| 2:00 | www host | 301 to the primary host and keeps the path (`/collections/all`) |
| 2:30 | Key pages loop: `/collections/all`, `/products/brisa-natural-beige`, `/cart`, `/pages/envios`, `/policies/refund-policy`, `/robots.txt`, `/sitemap.xml` | all 200 (404 only for `no-existe-xyz`) |
| 3:00 | Catalog: `products.json` count; 5 redirect spot checks | 29 products; `/producto/<h>` -> 301 `/products/<h>`; `/devoluciones` -> `/policies/refund-policy` |
| 3:30 | In the browser tab: add 1 unit, open `/checkout` (look, never pay) | page loads, Wompi LIVE offered, a shipping rate appears; then empty the cart |
| 4:30 | Admin read-only: Settings > Domains (primary + SSL active), Orders (none unexpected), Analytics > real-time (visits arrive) | as stated |
| 5:00 | Decision | GO (run the full in-page certification, `README.md`) / HOLD / ROLLBACK (1.3) |

After GO: re-check at T+30 min, T+2 h and T+24 h (home 200, one PDP, checkout reachable, Orders, 404 monitor); keep the rollback ready
until the first real order completes end to end.

## 3. Read-only command list (PowerShell; `curl.exe` is the real curl, not the `curl` alias)

Hosts: `$h='radaelliswimwear.com'`. Keep at least 1.6 s between requests to the store (loop with `Start-Sleep -Milliseconds 1700`).

### 3.1 HTTP status / redirects

```powershell
# final status, final URL, timing (follows redirects)
curl.exe -sS -o NUL -w '%{http_code} %{url_effective} %{time_total}s\n' -L https://radaelliswimwear.com/
# http -> https (expect HTTP 301 and location: https://radaelliswimwear.com/)
curl.exe -sSI http://radaelliswimwear.com/
# www host (expect 301 + location to the primary host, path kept)
curl.exe -sSI https://www.radaelliswimwear.com/collections/all
# the other direction, if www is the primary host
curl.exe -sSI https://radaelliswimwear.com/collections/all
# redirect spot checks (expect 301 and the location shown)
curl.exe -sSI https://radaelliswimwear.com/producto/bikini-foam            # -> /products/bikini-foam
curl.exe -sSI https://radaelliswimwear.com/devoluciones                    # -> /policies/refund-policy
curl.exe -sSI https://radaelliswimwear.com/cuenta/iniciar-sesion           # -> /account/login
curl.exe -sSI https://radaelliswimwear.com/oasis-natural                   # -> /collections/oasis-natural
curl.exe -sSI https://radaelliswimwear.com/cookies                         # -> /pages/cookies
# password page must be gone and a 404 must be a real 404
curl.exe -sS -o NUL -w '%{http_code}\n' https://radaelliswimwear.com/collections/no-existe-xyz   # 404
# headers: Shopify typically answers with x-shopid / x-shopify-stage (and a Cloudflare server header); Vercel with server: Vercel / x-vercel-id
curl.exe -sSI https://radaelliswimwear.com/ | Select-String -Pattern '^HTTP|server|x-shopid|x-shopify|x-vercel|location'
```

Key pages loop (one request every 1.7 s):

```powershell
$h='radaelliswimwear.com'
foreach($p in '/','/collections/all','/products/brisa-natural-beige','/cart','/pages/envios','/policies/refund-policy','/robots.txt','/sitemap.xml'){
  curl.exe -sS -o NUL -w "%{http_code} $p %{time_total}s`n" "https://$h$p"; Start-Sleep -Milliseconds 1700 }
```

Catalog count (expect 29 products, 98 variants):

```powershell
$j = curl.exe -sS 'https://radaelliswimwear.com/products.json?limit=250' | ConvertFrom-Json
$j.products.Count; ($j.products | ForEach-Object { $_.variants.Count } | Measure-Object -Sum).Sum
```

Social destinations (Instagram/Facebook/TikTok may answer 3xx/429 to curl; WhatsApp redirects): 

```powershell
foreach($u in 'https://www.instagram.com/Radaelli_swimwear','https://www.facebook.com/Radaelli_Swimwear','https://www.tiktok.com/@RadaelliSwimwear','https://wa.me/573135359668'){
  curl.exe -sS -o NUL -w "%{http_code} $u`n" -L --max-time 20 -A 'Mozilla/5.0' $u; Start-Sleep -Milliseconds 1700 }
```

### 3.2 TLS certificate (subject / issuer / expiry)

```powershell
# verbose handshake; cmd /c avoids PowerShell 5.1 wrapping stderr lines in error records
cmd /c "curl.exe -vI https://radaelliswimwear.com 2>&1" | Select-String -Pattern 'subject:|issuer:|start date|expire date|SSL connection|TLSv|^< HTTP|certificate'
cmd /c "curl.exe -vI https://www.radaelliswimwear.com 2>&1" | Select-String -Pattern 'subject:|issuer:|start date|expire date|SSL connection|TLSv|^< HTTP|certificate'
# if only the revocation check fails on this network (diagnostic only, not a pass): add --ssl-no-revoke
```

Same data without curl (works for any build; prints subject, issuer, validity and the DNS names the certificate covers):

```powershell
foreach($hn in 'radaelliswimwear.com','www.radaelliswimwear.com'){
  $tcp = New-Object Net.Sockets.TcpClient($hn,443); $ssl = New-Object Net.Security.SslStream($tcp.GetStream(),$false,{$true})
  $ssl.AuthenticateAsClient($hn)
  $c = New-Object Security.Cryptography.X509Certificates.X509Certificate2($ssl.RemoteCertificate)
  $chain = New-Object Security.Cryptography.X509Certificates.X509Chain
  "== $hn  protocol=$($ssl.SslProtocol)"; "subject : $($c.Subject)"; "issuer  : $($c.Issuer)"; "valid   : $($c.NotBefore) -> $($c.NotAfter)"; "chain trusted by this PC: $($chain.Build($c))"
  ($c.Extensions | Where-Object { $_.Oid.FriendlyName -eq 'Subject Alternative Name' }).Format($true)
  $ssl.Dispose(); $tcp.Dispose() }
```
(The callback `{$true}` lets the handshake complete even for a bad certificate so you can read it; the **printed** evidence decides: the host must appear
in the SAN list, `NotAfter` must be in the future and `chain trusted by this PC` must be `True`.)

### 3.3 DNS (compare two public resolvers to see propagation)

```powershell
$h='radaelliswimwear.com'
foreach($s in '1.1.1.1','8.8.8.8'){
  "== resolver $s"
  Resolve-DnsName $h        -Type A     -Server $s -DnsOnly | Select-Object Name,Type,TTL,IPAddress
  Resolve-DnsName "www.$h"  -Type CNAME -Server $s -DnsOnly | Select-Object Name,Type,TTL,NameHost
  Resolve-DnsName $h        -Type MX    -Server $s -DnsOnly | Select-Object Name,Type,TTL,NameExchange,Preference
  Resolve-DnsName $h        -Type TXT   -Server $s -DnsOnly | Select-Object Name,Type,TTL,Strings
  Resolve-DnsName $h        -Type NS    -Server $s -DnsOnly | Select-Object Name,Type,TTL,NameHost
  Resolve-DnsName $h        -Type CAA   -Server $s -DnsOnly -ErrorAction SilentlyContinue | Select-Object Name,Type,TTL,Strings }
```

Expected after launch: `A @` = the Shopify IP shown in Admin (standard 23.227.38.65), `CNAME www` = `shops.myshopify.com` (standard), MX/TXT identical to the
pre-cutover snapshot, **no** `216.150.1.1` and **no** `*.vercel-dns-*.com`. A CAA record, if present, must allow the CA that Shopify uses to issue the
certificate (check Shopify's domain documentation before changing it). Expected after a rollback: `A @` = 216.150.1.1 and `CNAME www` = e7eb3f32d99d3261.vercel-dns-017.com.

### 3.4 In-page certification (after the 5-minute check is green)

See `README.md`: paste the core script on the primary host, `window.__PLRUN('all',{bg:true})`, then the PDP harness, then the assembler.
