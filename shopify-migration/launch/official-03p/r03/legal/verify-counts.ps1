$before = 'C:\Users\user\AppData\Local\Temp\claude\C--CLAUDE-rada-main-rada-main\34c11d0a-7250-45aa-b727-3081da1b069a\scratchpad\official\r03\legal\before'
$d = [IO.File]::ReadAllText("$before\admin-products.json") | ConvertFrom-Json
$act = $d.products.nodes | Where-Object { $_.status -eq 'ACTIVE' }
('active products: {0}; sum totalInventory: {1}' -f @($act).Count, ($act | Measure-Object -Property totalInventory -Sum).Sum)
$tf = @($act | Where-Object { $_.descriptionHtml -match 'Tejido|forro' }).Count
('products with Tejido/forro: {0}' -f $tf)
$lc = Import-Csv "$before\link-check.csv"
('link-check rows: {0}; non-200: {1}' -f @($lc).Count, (($lc | Where-Object { $_.Code -ne '200' } | ForEach-Object { $_.Url + '=' + $_.Code }) -join '; '))
('files in before: {0}' -f @(Get-ChildItem $before -File).Count)
