$ErrorActionPreference = 'Stop'
$before = 'C:\Users\user\AppData\Local\Temp\claude\C--CLAUDE-rada-main-rada-main\34c11d0a-7250-45aa-b727-3081da1b069a\scratchpad\official\r03\legal\before'
$tz = [System.TimeZoneInfo]::FindSystemTimeZoneById('SA Pacific Standard Time')
$enc = New-Object System.Text.UTF8Encoding($false)
$lines = @()
$lines += 'INDICE DE EVIDENCIA ANTES (solo lectura) - auditoria legal Radaelli - 2026-10-02'
$lines += 'Hora = America/Bogota (UTC-5), tomada de la fecha de escritura del archivo. Fuentes: curl.exe GET publico, Admin GraphQL de LECTURA (shop.shopPolicies, pages, products, deliveryProfiles), navegador del panel (solo lectura).'
$lines += 'Sin datos personales de clientas. No se guardo ninguna cookie ni credencial.'
$lines += ''
$lines += 'archivo | hora Bogota | bytes | sha256(12)'
Get-ChildItem $before -File | Where-Object { $_.Name -ne '_INDEX.txt' } | Sort-Object LastWriteTime | ForEach-Object {
  $t = [System.TimeZoneInfo]::ConvertTimeFromUtc($_.LastWriteTimeUtc, $tz).ToString('yyyy-MM-dd HH:mm:ss')
  $hs = (Get-FileHash $_.FullName -Algorithm SHA256).Hash.Substring(0, 12)
  $lines += ('{0} | {1} | {2} | {3}' -f $_.Name, $t, $_.Length, $hs)
}
$lines += ''
$lines += 'Mapa archivo -> URL publica:'
$lines += 'home.html -> https://radaelliswimwear.com/'
$lines += 'policy-refund -> /policies/refund-policy ; policy-shipping -> /policies/shipping-policy ; policy-terms -> /policies/terms-of-service ; policy-privacy -> /policies/privacy-policy ; policy-contact -> /policies/contact-information ; policy-legal-notice -> /policies/legal-notice'
$lines += 'page-contact -> /pages/contact ; page-garantia -> /pages/garantia ; page-privacidad -> /pages/privacidad ; page-terminos -> /pages/terminos ; page-envios -> /pages/envios ; page-cookies -> /pages/cookies ; page-favoritos -> /pages/favoritos'
$lines += 'page-devoluciones|cambios|retracto|pqr -> HTTP 404 (no existen; ver _http_log.txt)'
$lines += 'checkoutshopify-<TIPO> -> URLs checkout.shopify.com/102428803371/policies/<id>.html que enlaza el checkout'
$lines += 'admin-policy-<TIPO>.html / admin-page-<handle>.html -> cuerpo ALMACENADO segun Admin (puede diferir del renderizado: ver audit-live-2026-10-02.md, hallazgo privacidad nativa)'
$lines += 'product-<handle>.html/.txt/.js.json -> fichas muestra; admin-products.json -> inventario/descripciones (lectura)'
$lines += 'checkout-step0.html / checkout-step0-visible.txt / checkout-payment-config-extract.txt -> checkout con 1 articulo, SIN datos personales; link-check.csv -> HTTP de cada enlace'
$lines += 'evidence-cookie-banner.txt + screenshot-*.jpg -> banner de consentimiento'
[IO.File]::WriteAllText("$before\_INDEX.txt", ($lines -join "`r`n"), $enc)
Write-Output ($lines | Select-Object -First 12)
(Get-ChildItem $before -File).Count
