$ErrorActionPreference = 'Stop'
$L = Split-Path -Parent $MyInvocation.MyCommand.Path
$cb = [guid]::NewGuid().ToString('N')
$stamp = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow,'SA Pacific Standard Time').ToString('yyyy-MM-dd HH:mm:ss')
New-Item -ItemType Directory -Force "$L\after2" | Out-Null
$S = [ordered]@{
  'refund-es'   = 'https://radaelliswimwear.com/policies/refund-policy'
  'refund-en'   = 'https://radaelliswimwear.com/en/policies/refund-policy'
  'refund-chk'  = 'https://checkout.shopify.com/102428803371/policies/55627383083.html?locale=es'
  'garantia-es' = 'https://radaelliswimwear.com/pages/garantia'
  'garantia-en' = 'https://radaelliswimwear.com/en/pages/garantia'
  'envios-es'   = 'https://radaelliswimwear.com/policies/shipping-policy'
  'envios-page' = 'https://radaelliswimwear.com/pages/envios'
  'envios-en'   = 'https://radaelliswimwear.com/en/policies/shipping-policy'
  'envios-chk'  = 'https://checkout.shopify.com/102428803371/policies/55627448619.html?locale=es'
  'terms-es'    = 'https://radaelliswimwear.com/policies/terms-of-service'
  'terms-page'  = 'https://radaelliswimwear.com/pages/terminos'
  'terms-en'    = 'https://radaelliswimwear.com/en/policies/terms-of-service'
  'terms-chk'   = 'https://checkout.shopify.com/102428803371/policies/55627415851.html?locale=es'
  'contact-es'  = 'https://radaelliswimwear.com/policies/contact-information'
  'contact-page'= 'https://radaelliswimwear.com/pages/contact'
  'contact-chk' = 'https://checkout.shopify.com/102428803371/policies/55629873451.html?locale=es'
  'legal-es'    = 'https://radaelliswimwear.com/policies/legal-notice'
  'privacy-es'  = 'https://radaelliswimwear.com/policies/privacy-policy'
  'privacy-en'  = 'https://radaelliswimwear.com/en/policies/privacy-policy'
  'privacy-chk' = 'https://checkout.shopify.com/102428803371/policies/55627088171.html?locale=es'
  'privacy-page'= 'https://radaelliswimwear.com/pages/privacidad'
  'cookies-page'= 'https://radaelliswimwear.com/pages/cookies'
  'home'        = 'https://radaelliswimwear.com/'
  'pdp'         = 'https://radaelliswimwear.com/products/brisa-natural-beige'
}
$txt = @{}; $rawm = @{}; $idx = @("Evidencia DESPUES lote 2 (resolucion legal de devoluciones) - $stamp America/Bogota")
foreach ($k in $S.Keys) {
  $u = $S[$k] + $(if ($S[$k] -match '\?') { '&' } else { '?' }) + 'cb=' + $cb
  $f = "$L\after2\$k.html"; curl.exe -s -L $u -o $f
  $raw = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8)
  $t = [regex]::Replace($raw, '(?s)<script.*?</script>|<style.*?</style>', ' '); $t = [regex]::Replace($t, '<[^>]+>', ' '); $t = [regex]::Replace($t, '\s+', ' ')
  $txt[$k] = $t; $rawm[$k] = $raw
  $idx += "{0,-13} {1}  sha256={2}  {3} bytes" -f $k, $S[$k], (Get-FileHash $f -Algorithm SHA256).Hash.Substring(0,16), (Get-Item $f).Length
}
[IO.File]::WriteAllLines("$L\after2\_INDEX.txt", $idx, (New-Object System.Text.UTF8Encoding($false)))

# hechos esperados por superficie (regex) -> debe estar presente (+) o ausente (-)
$checks = @(
  @{ fact='Retracto 5 dias habiles';            rx='cinco \(5\) días hábiles|5 días hábiles'; on=@('refund-es','refund-en','refund-chk','terms-es','terms-page','terms-en','terms-chk') },
  @{ fact='Reembolso max 15 dias calendario';   rx='quince \(15\) días calendario|15 días calendario'; on=@('refund-es','refund-en','refund-chk','terms-es','terms-page','envios-es') },
  @{ fact='Cambio voluntario 15 dias calendario'; rx='cambio voluntario'; on=@('refund-es','refund-en','refund-chk','terms-es','terms-page','garantia-es','pdp') },
  @{ fact='Garantia legal 1 ano';               rx='un \(1\) año'; on=@('refund-es','refund-en','refund-chk','garantia-es','garantia-en','terms-es','terms-page','pdp') },
  @{ fact='Reversion del pago (Decreto 587/2016)'; rx='Decreto 587|reversión del pago'; on=@('refund-es','refund-en','refund-chk','terms-es','terms-page') },
  @{ fact='Valor efectivamente pagado (cupones)'; rx='efectivamente pagado|efectivamente pagaste'; on=@('refund-es','refund-en','refund-chk','terms-es') },
  @{ fact='Preparacion mismo dia o siguiente dia habil'; rx='siguiente día hábil'; on=@('envios-es','envios-page','envios-en','envios-chk') },
  @{ fact='Entrega max 30 dias calendario (si no hay plazo distinto)'; rx='30 días calendario'; on=@('envios-es','envios-page','envios-en','envios-chk') },
  @{ fact='Tarifas 9.900 .. 44.900 y gratis 299.900'; rx='9\.900.*12\.900.*17\.900.*21\.900.*44\.900.*299\.900|299\.900.*9\.900'; on=@('envios-es','envios-page','envios-en','envios-chk') },
  @{ fact='PQR con radicado, fecha y hora';     rx='radicado'; on=@('refund-es','refund-chk','garantia-es','terms-es','terms-page','contact-es','contact-page','contact-chk') },
  @{ fact='Enlace SIC (sic.gov.co)';            rx='sic\.gov\.co'; on=@('refund-es','refund-chk','garantia-es','terms-es','terms-page','contact-es','contact-page','contact-chk','privacy-es','privacy-en','privacy-chk','privacy-page','cookies-page') },
  @{ fact='Correo radaelliswimwear@gmail.com';  rx='radaelliswimwear@gmail\.com'; on=@('refund-es','garantia-es','envios-es','terms-es','contact-es','contact-chk','legal-es','privacy-es','privacy-chk') },
  @{ fact='WhatsApp 3135359668';                rx='3135359668'; on=@('refund-es','garantia-es','envios-es','terms-es','contact-es','contact-chk','legal-es') },
  @{ fact='Privacidad colombiana (responsable del tratamiento)'; rx='responsable del tratamiento|Quién es el responsable'; on=@('privacy-es','privacy-en','privacy-chk','privacy-page') },
  @{ fact='Footer: SIC + Preferencias de cookies'; rx='Superintendencia de Industria y Comercio \(SIC\).*Preferencias de cookies'; on=@('home','pdp') },
  @{ fact='PDP acordeon alineado';               rx='Garantía legal de un \(1\) año'; on=@('pdp') }
)
$forbid = @(
  @{ fact='Sin exclusion por higiene'; rx='higiene íntima|no aceptamos devolución|trajes de baño no tienen retracto|Evaluamos cada caso|únicamente cuando el producto' },
  @{ fact='Sin "12 meses" (reemplazado por 1 ano)'; rx='12 meses|doce \(12\)' },
  @{ fact='Sin express ni cobro posterior de transporte'; rx='Envío express|24 a 48 horas|no queda incluido en el pago' },
  @{ fact='Sin texto automatico de privacidad (UE)'; rx='llámenos al ,|Espacio Económico Europeo' },
  @{ fact='Sin voseo'; rx='podés|consultá|Dejá tu|recibí aviso' },
  @{ fact='Sin referencias al stack anterior'; rx='Resend|Cloudinary|Vercel|Neon|Prisma' },
  @{ fact='PQR solo por WhatsApp/Instagram (canal antiguo)'; rx='WhatsApp o Instagram|Instagram o WhatsApp' }
)
$out = @("# Matriz de consistencia legal - $stamp America/Bogota", "", "Evidencia: after2/_INDEX.txt (sha256). PASS = presente donde corresponde y ausente donde esta prohibido.", "", "## Hechos que deben coincidir (presente en cada superficie)", "| Hecho | Superficies verificadas | Resultado |", "|---|---|---|")
$fail = 0
foreach ($c in $checks) { $miss = @(); foreach ($s in $c.on) { if (($txt[$s] -notmatch $c.rx) -and ($rawm[$s] -notmatch $c.rx)) { $miss += $s } }; $r = if ($miss.Count -eq 0) { 'PASS' } else { $fail++; 'FALLA: falta en ' + ($miss -join ', ') }; $out += "| {0} | {1} | {2} |" -f $c.fact, ($c.on -join ', '), $r }
$out += @("", "## Frases que NO deben aparecer en ninguna superficie", "| Regla | Resultado |", "|---|---|")
foreach ($f in $forbid) { $hit = @(); foreach ($s in $txt.Keys) { if ($txt[$s] -match $f.rx) { $hit += $s } }; $r = if ($hit.Count -eq 0) { 'PASS' } else { $fail++; 'FALLA: aparece en ' + ($hit -join ', ') }; $out += "| {0} | {1} |" -f $f.fact, $r }
$out += @("", "Fallos: $fail")
[IO.File]::WriteAllLines("$L\consistency-matrix-2026-10-03.md", $out, (New-Object System.Text.UTF8Encoding($false)))
$out
