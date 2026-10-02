$ErrorActionPreference = 'Stop'
$before = 'C:\Users\user\AppData\Local\Temp\claude\C--CLAUDE-rada-main-rada-main\34c11d0a-7250-45aa-b727-3081da1b069a\scratchpad\official\r03\legal\before'
Set-Location $before
$enc = New-Object System.Text.UTF8Encoding($false)

# checkout visible text
$h = [IO.File]::ReadAllText("$before\checkout-step0.html")
$h = [regex]::Replace($h, '(?s)<(script|style|svg|noscript|head)[^>]*>.*?</\1>', '')
$h = [regex]::Replace($h, '(?i)</(p|div|h[1-6]|li|tr|section|ul|ol|table|label|button|span)>', "`n")
$h = [regex]::Replace($h, '<[^>]+>', ' ')
$h = [System.Net.WebUtility]::HtmlDecode($h)
$h = [regex]::Replace($h, '[ \x09]+', ' ')
$h = [regex]::Replace($h, '(\s*\n\s*)+', "`n")
[IO.File]::WriteAllText("$before\checkout-step0-visible.txt", $h.Trim(), $enc)

# payment config extract
$raw = [System.Net.WebUtility]::HtmlDecode([IO.File]::ReadAllText("$before\checkout-step0.html"))
$m = [regex]::Match($raw, '"name":"Wompi","paymentBrands":\[[^\]]*\]')
$ex = "Extracto del payload del checkout (checkout-step0.html), solo lectura:`n" + $m.Value + "`n" + ([regex]::Match($raw, '"showRedirectionNotice":\w+').Value) + "`n" + ([regex]::Match($raw, '"taxesIncluded":\w+').Value)
[IO.File]::WriteAllText("$before\checkout-payment-config-extract.txt", $ex, $enc)
Write-Output $ex

# screenshots
$src = 'C:\Users\user\.claude\projects\C--CLAUDE-rada-main-rada-main-commerce-main-commerce-main--claude-worktrees-ai-handoff-bridge\34c11d0a-7250-45aa-b727-3081da1b069a\tool-results'
Get-ChildItem $src -Filter 'mcp-Claude_Browser-blob-1790969*' | ForEach-Object { Copy-Item $_.FullName ("$before\screenshot-" + $_.Name) }
Get-ChildItem "$before\screenshot-*" | Select-Object Name, Length
