param([string]$Chain, [string]$Store = 'wgcvpd-ib.myshopify.com')
# Coordinator driver: runs 03l-migrate waves sequentially against the OFFICIAL store, logs timing per wave. ASCII only.
$ErrorActionPreference = 'Continue'
$env:TARGET_STORE = $Store
$ROOT = 'C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration'
$OUT = 'C:/Users/user/AppData/Local/Temp/claude/C--CLAUDE-rada-main-rada-main/34c11d0a-7250-45aa-b727-3081da1b069a/scratchpad/official/waves'
New-Item -ItemType Directory -Force $OUT | Out-Null
$tz = [System.TimeZoneInfo]::FindSystemTimeZoneById('SA Pacific Standard Time')
function Now { [System.TimeZoneInfo]::ConvertTime([DateTimeOffset]::UtcNow, $tz) }
$chains = @{
  'A' = @('defs', 'collections', 'products', 'membership', 'publish')
  'B' = @('pages', 'policies', 'redirects')
  'C' = @('menus')
  'D' = @('redirects')
  'E' = @('policies')
}
Set-Location $ROOT
foreach ($w in $chains[$Chain]) {
  $s = Now
  $log = "$OUT/$Chain-$w.log"
  & node launch/tools/03l-migrate.mjs $w 2>$null | Out-File -FilePath $log -Encoding utf8
  $code = $LASTEXITCODE
  $e = Now
  $line = "{0} wave={1} start={2} end={3} secs={4} exit={5}" -f $Chain, $w, $s.ToString('HH:mm:ss'), $e.ToString('HH:mm:ss'), [math]::Round(($e - $s).TotalSeconds, 1), $code
  Add-Content -Path "$OUT/timings.txt" -Value $line
  if ($code -ne 0) { Add-Content -Path "$OUT/timings.txt" -Value "$Chain STOPPED at $w"; break }
}
Add-Content -Path "$OUT/timings.txt" -Value ("{0} chain done {1}" -f $Chain, (Now).ToString('HH:mm:ss'))
