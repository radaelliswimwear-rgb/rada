$before = 'C:\Users\user\AppData\Local\Temp\claude\C--CLAUDE-rada-main-rada-main\34c11d0a-7250-45aa-b727-3081da1b069a\scratchpad\official\r03\legal\before'
Set-Location $before
$terms = @('retracto','revers','5 d.as h.biles','Ley 1480','Estatuto del Consumidor','superintendencia','sic\.gov','express','3 a 5','higiene','reembolso','PQR|peticiones','radicado|constancia|seguimiento','d.as calendario','materiales nobles','sostenible')
foreach ($t in $terms) {
  $hits = Select-String -Path policy-*.txt, page-*.txt, product-*.txt, home-fulltext.txt -Pattern $t | ForEach-Object { $_.Filename } | Sort-Object -Unique
  ('{0,-34} -> {1}' -f $t, ($hits -join ', '))
}
function Strip($s) { $x = [regex]::Replace($s, '<[^>]+>', ' '); $x = [System.Net.WebUtility]::HtmlDecode($x); ([regex]::Replace($x, '\s+', ' ')).Trim() }
$a = Strip ([IO.File]::ReadAllText("$before\admin-policy-PRIVACY_POLICY.html"))
$b = Strip ([IO.File]::ReadAllText("$before\admin-page-privacidad.html"))
('native stored body text equals page body text: {0} ; lens {1} / {2}' -f ($a -eq $b), $a.Length, $b.Length)
('native stored begins: ' + $a.Substring(0, 110))
$r = Strip ([IO.File]::ReadAllText("$before\checkoutshopify-PRIVACY_POLICY.html"))
('checkout-hosted privacy begins: ' + $r.Substring(0, 160))
