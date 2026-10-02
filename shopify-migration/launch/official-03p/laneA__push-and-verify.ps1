<#
.SYNOPSIS
  Push the certified Radaelli RC1.10 theme UNPUBLISHED to a Shopify store and verify remote == ZIP (98/98).
  NEVER publishes. Windows PowerShell 5.1 and PowerShell 7 compatible. ASCII only.

.DESCRIPTION
  Phases (default All = Preflight, Auth, Push, Verify):
    Preflight  local only: ZIP SHA-256 gate, fresh extract (98 files), Theme Check (61 files, 0 offenses),
               announcement-bar string report. No network, no Shopify calls.
    Auth       shopify theme list --json  (read-only). First call on a new store triggers the one-time
               Shopify CLI device-code login -> the OWNER must approve the code in the browser (code expires fast).
               Saves themes-before.json and refuses to continue if a theme with the same name already exists.
    Push       shopify theme push --unpublished --theme "<name>" --strict --json   (creates a NEW unpublished theme)
    Verify     waits for processing=false, theme list (role must be unpublished, live theme id unchanged),
               shopify theme pull into an EMPTY folder, runs launch/tools/03k-theme-remote-parity.mjs (expects 98/98),
               final theme list (role still unpublished).

  Safety: forbidden flags (--publish, --live, --allow-live, -p, -l, -a) make Invoke-Cli throw. The lab store and the
  old 'launch' store are hard-blocked. -DryRun prints every Shopify command and runs NO Shopify call.

.EXAMPLE
  # rehearsal that touches nothing remote
  .\push-and-verify.ps1 -Store example-official.myshopify.com -DryRun

.EXAMPLE
  # real run (coordinator only)
  .\push-and-verify.ps1 -Store the-new-store.myshopify.com

.EXAMPLE
  # re-verify an already pushed theme (no push)
  .\push-and-verify.ps1 -Store the-new-store.myshopify.com -Phase Verify -ThemeId 123456789012

Exit code: 0 = PASS, 1 = FAIL, 2 = bad arguments.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Store,
  [ValidateSet('All', 'Preflight', 'Auth', 'Push', 'Verify')][string]$Phase = 'All',
  [string]$ThemeName = 'Radaelli RC1.10',
  [string]$Zip = 'C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/dist/radaelli-shopify-theme-rc1.10.zip',
  [string]$ExpectedSha256 = 'e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c',
  [string]$ParityTool = 'C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/tools/03k-theme-remote-parity.mjs',
  [string]$WorkDir = '',
  [string]$ThemeId = '',
  [string]$AuthAlias = '',
  [string]$Cli = 'shopify',
  [string[]]$CliPrefix = @(),
  [int]$ExpectedFiles = 98,
  [int]$ExpectedExact = 82,
  [int]$ExpectedSemantic = 16,
  [switch]$AllowDuplicate,
  [switch]$SkipThemeCheck,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$script:Failed = $false
$OkStatus = if ($DryRun) { 'DRYRUN-OK' } else { 'PASS' }
$script:Timing = New-Object System.Collections.ArrayList
$script:Result = [ordered]@{}

# ---------- helpers ----------
$BogotaTz = [System.TimeZoneInfo]::FindSystemTimeZoneById('SA Pacific Standard Time')
function Get-BogotaNow { [System.TimeZoneInfo]::ConvertTime([DateTimeOffset]::UtcNow, $BogotaTz) }
function Write-Log([string]$Message, [string]$Level = 'INFO') {
  Write-Host ("[{0}] {1,-5} {2}" -f (Get-BogotaNow).ToString('HH:mm:ss'), $Level, $Message)
}
function Write-Utf8NoBom([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}
function Fail([string]$Message) {
  $script:Failed = $true
  Write-Log $Message 'FAIL'
  throw $Message
}
function Start-Step([string]$Name) {
  $script:StepName = $Name
  $script:StepStart = Get-BogotaNow
  Write-Log "=== $Name : START" 'STEP'
}
function Stop-Step([string]$Status) {
  if (-not $script:StepName) { return }
  $end = Get-BogotaNow
  $secs = [math]::Round(($end - $script:StepStart).TotalSeconds, 1)
  [void]$script:Timing.Add([ordered]@{ step = $script:StepName; start = $script:StepStart.ToString('o'); end = $end.ToString('o'); seconds = $secs; status = $Status })
  Write-Log "=== $($script:StepName) : $Status ($secs s)" 'STEP'
  $script:StepName = $null
}
function ConvertFrom-CliJson([string]$Text) {
  # tolerate banners around the JSON payload
  $s = $Text.IndexOfAny([char[]]@('{', '['))
  if ($s -lt 0) { return $null }
  $e = $Text.LastIndexOfAny([char[]]@('}', ']'))
  if ($e -le $s) { return $null }
  try { return ($Text.Substring($s, $e - $s + 1) | ConvertFrom-Json) } catch { return $null }
}

# Resolve the CLI executable. Prefer shopify.cmd (avoids .ps1 execution-policy problems and stderr ErrorRecords).
$CliExe = $Cli
if ($Cli -eq 'shopify') {
  $cmd = Get-Command 'shopify.cmd' -ErrorAction SilentlyContinue
  if ($cmd) { $CliExe = $cmd.Source }
}

$Forbidden = @('--publish', '-p', '--live', '-l', '--allow-live', '-a')
function Invoke-Cli {
  param([Parameter(Mandatory = $true)][string[]]$CliArgs, [Parameter(Mandatory = $true)][string]$LogName)
  foreach ($a in $CliArgs) { if ($Forbidden -contains $a) { throw "NEVER-PUBLISH GUARD: forbidden flag '$a' in: $($CliArgs -join ' ')" } }
  $all = @($CliPrefix) + @($CliArgs)
  $shown = ($all | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' '
  Write-Log "RUN: $Cli $shown"
  if ($DryRun) { return [pscustomobject]@{ ExitCode = 0; Text = ''; DryRun = $true } }
  $lines = New-Object System.Collections.ArrayList
  # stderr is intentionally NOT redirected (PS 5.1 turns redirected native stderr into ErrorRecords); it streams to the console.
  & $CliExe @all | ForEach-Object { [void]$lines.Add([string]$_); Write-Host $_ }
  $code = $LASTEXITCODE
  $text = ($lines -join "`n")
  Write-Utf8NoBom (Join-Path $script:LogDir "$LogName.stdout.txt") $text
  return [pscustomobject]@{ ExitCode = $code; Text = $text; DryRun = $false }
}
function Add-AuthArgs([string[]]$a) {
  if ($AuthAlias) { return @($a) + @('--auth-alias', $AuthAlias) } else { return @($a) }
}
function Get-Themes([string]$LogName) {
  $r = Invoke-Cli -CliArgs (Add-AuthArgs @('theme', 'list', '--store', $script:StoreFqdn, '--json')) -LogName $LogName
  if ($r.DryRun) { return @() }
  if ($r.ExitCode -ne 0) { Fail "theme list failed (exit $($r.ExitCode)). If this is the first call on a new store the owner must approve the device code and the account needs Themes access." }
  $j = ConvertFrom-CliJson $r.Text
  if ($null -eq $j) { Fail 'theme list returned no parseable JSON' }
  if ($j -isnot [System.Array] -and $j.PSObject.Properties.Name -contains 'themes') { $j = $j.themes }
  Write-Utf8NoBom (Join-Path $script:WorkDir "$LogName.json") ($r.Text)
  return @($j)
}

# ---------- argument validation ----------
$s = $Store.Trim().ToLowerInvariant() -replace '^https?://', '' -replace '/.*$', ''
if ($s -notmatch '\.') { $s = "$s.myshopify.com" }
if ($s -notmatch '^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$') { Write-Host "Invalid -Store '$Store' (expected xxx.myshopify.com)"; exit 2 }
$Blocked = @('radaelli-swimwear-dev.myshopify.com', 'radaelli-swimwear-colombia-launch-1jeqp0yj.myshopify.com')
if ($Blocked -contains $s) { Write-Host "Store '$s' is hard-blocked (lab / old launch store). Aborting."; exit 2 }
if ($ThemeId -and $ThemeId -notmatch '^\d{6,20}$') { Write-Host "Invalid -ThemeId '$ThemeId'"; exit 2 }
$script:StoreFqdn = $s

if (-not $WorkDir) {
  $WorkDir = 'C:/Users/user/AppData/Local/Temp/claude/C--CLAUDE-rada-main-rada-main/34c11d0a-7250-45aa-b727-3081da1b069a/scratchpad/official/laneA/run-' + (Get-BogotaNow).ToString('yyyyMMdd-HHmmss')
}
$script:WorkDir = $WorkDir
$script:LogDir = Join-Path $WorkDir 'logs'
New-Item -ItemType Directory -Force $script:LogDir | Out-Null
$ThemeDir = Join-Path $WorkDir 'theme'
$PullDir = Join-Path $WorkDir 'remote-pull'
$overallStart = Get-BogotaNow
Write-Log "Store=$($script:StoreFqdn) Phase=$Phase ThemeName='$ThemeName' DryRun=$($DryRun.IsPresent) WorkDir=$WorkDir"
Write-Log "START_TIME_BOGOTA=$($overallStart.ToString('o'))"
$script:Result.store = $script:StoreFqdn
$script:Result.startBogota = $overallStart.ToString('o')
$script:Result.dryRun = $DryRun.IsPresent

$runPre = ($Phase -in 'All', 'Preflight')
$runAuth = ($Phase -in 'All', 'Auth', 'Push')
$runPush = ($Phase -in 'All', 'Push')
$runVer = ($Phase -in 'All', 'Verify')
$script:ThemesBefore = @()
$script:LiveBefore = $null
$script:TargetId = $ThemeId

try {
  # ===== Preflight (local) =====
  if ($runPre -or $runPush -or $runVer) {
    Start-Step 'Preflight: ZIP SHA-256 + extract'
    if (-not (Test-Path $Zip)) { Fail "ZIP not found: $Zip" }
    $sha = (Get-FileHash $Zip -Algorithm SHA256).Hash.ToLowerInvariant()
    $script:Result.zipSha256 = $sha
    if ($sha -ne $ExpectedSha256.ToLowerInvariant()) { Fail "ZIP SHA-256 mismatch: got $sha expected $ExpectedSha256" }
    Write-Log "ZIP SHA-256 OK: $sha" 'PASS'
    if (Test-Path $ThemeDir) { Remove-Item -Recurse -Force $ThemeDir }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($Zip, $ThemeDir)
    $files = @(Get-ChildItem $ThemeDir -Recurse -File)
    $script:Result.extractedFiles = $files.Count
    if ($files.Count -ne $ExpectedFiles) { Fail "Extracted $($files.Count) files, expected $ExpectedFiles" }
    $topDirs = @(Get-ChildItem $ThemeDir -Directory | ForEach-Object { $_.Name } | Sort-Object)
    Write-Log "Extracted $($files.Count) files; top dirs: $($topDirs -join ',')" 'PASS'
    Stop-Step $OkStatus

    # announcement-bar report (no change, informational)
    $hg = Join-Path $ThemeDir 'sections/header-group.json'
    $hgText = [System.IO.File]::ReadAllText($hg, [System.Text.Encoding]::UTF8)
    $m = [regex]::Match($hgText, '"text"\s*:\s*"([^"]*)"')
    if ($m.Success) { $script:Result.announcementBarSetting = $m.Groups[1].Value; Write-Log "Announcement bar setting (sections/header-group.json): '$($m.Groups[1].Value)' (CSS uppercases it on screen; NOT modified)" 'INFO' }
  }

  if ($runPre -and -not $SkipThemeCheck) {
    Start-Step 'Preflight: Theme Check'
    $r = Invoke-Cli -CliArgs @('theme', 'check', '--path', $ThemeDir) -LogName 'theme-check'
    if (-not $r.DryRun) {
      if ($r.ExitCode -ne 0 -or $r.Text -notmatch 'no offenses found') { Fail "Theme Check not clean (exit $($r.ExitCode))" }
      Write-Log 'Theme Check: no offenses found' 'PASS'
    }
    Stop-Step $OkStatus
  }

  # ===== Auth + list-before =====
  if ($runAuth) {
    Start-Step 'Auth + theme list (before)'
    Write-Log 'FIRST CALL ON A NEW STORE: Shopify CLI prints a device code + URL (accounts.shopify.com/activate-with-code). The store OWNER (or a staff account with Themes access) must approve it in the browser within a few minutes.' 'NOTE'
    $script:ThemesBefore = @(Get-Themes 'themes-before')
    if (-not $DryRun) {
      $script:LiveBefore = @($script:ThemesBefore | Where-Object { $_.role -eq 'live' })[0]
      Write-Log ("Themes before: {0}; live = {1} ({2})" -f $script:ThemesBefore.Count, $script:LiveBefore.id, $script:LiveBefore.name) 'INFO'
      $script:Result.themesBeforeCount = $script:ThemesBefore.Count
      $script:Result.liveBeforeId = [string]$script:LiveBefore.id
      $dups = @($script:ThemesBefore | Where-Object { $_.name -eq $ThemeName })
      if ($dups.Count -gt 0 -and $runPush -and -not $ThemeId -and -not $AllowDuplicate) {
        Fail ("A theme named '{0}' already exists (id {1}, role {2}). Re-run with -Phase Verify -ThemeId <id>, or -AllowDuplicate to create another." -f $ThemeName, $dups[0].id, $dups[0].role)
      }
    }
    Stop-Step $OkStatus
  }

  # ===== Push (UNPUBLISHED) =====
  if ($runPush) {
    Start-Step 'Push UNPUBLISHED'
    if ($ThemeId) {
      if (-not $DryRun) {
        $t = @($script:ThemesBefore | Where-Object { [string]$_.id -eq $ThemeId })[0]
        if (-not $t) { Fail "ThemeId $ThemeId not found in store" }
        if ($t.role -ne 'unpublished') { Fail "ThemeId $ThemeId role is '$($t.role)', refusing to push to a non-unpublished theme" }
      }
      $pushArgs = Add-AuthArgs @('theme', 'push', '--store', $script:StoreFqdn, '--path', $ThemeDir, '--theme', $ThemeId, '--strict', '--json')
    } else {
      $pushArgs = Add-AuthArgs @('theme', 'push', '--store', $script:StoreFqdn, '--path', $ThemeDir, '--unpublished', '--theme', $ThemeName, '--strict', '--json')
    }
    $r = Invoke-Cli -CliArgs $pushArgs -LogName 'theme-push'
    if (-not $r.DryRun) {
      $j = ConvertFrom-CliJson $r.Text
      if ($r.ExitCode -ne 0 -or $null -eq $j -or $null -eq $j.theme) {
        Fail "theme push failed (exit $($r.ExitCode)). If a theme was created anyway, find it with 'theme list' and re-push by id: -Phase Push -ThemeId <id>. See logs/theme-push.stdout.txt"
      }
      if ($j.theme.role -ne 'unpublished') { Fail "Pushed theme role is '$($j.theme.role)', expected unpublished. DO NOT PUBLISH." }
      $script:TargetId = [string]$j.theme.id
      $script:Result.pushedThemeId = $script:TargetId
      $script:Result.pushedThemeName = $j.theme.name
      $script:Result.pushedThemeRole = $j.theme.role
      $script:Result.editorUrl = $j.theme.editor_url
      $script:Result.previewUrl = $j.theme.preview_url
      Write-Utf8NoBom (Join-Path $script:WorkDir 'push-result.json') ($j | ConvertTo-Json -Depth 6)
      Write-Log "Pushed theme id=$($script:TargetId) name='$($j.theme.name)' role=$($j.theme.role)" 'PASS'
      Write-Log "Editor: $($j.theme.editor_url)" 'INFO'
      Write-Log "Preview: $($j.theme.preview_url)" 'INFO'
    } else { $script:TargetId = '<new-theme-id>' }
    Stop-Step $OkStatus
  }

  # ===== Verify =====
  if ($runVer) {
    Start-Step 'Verify: list + pull + parity'
    if ($Phase -eq 'Verify') { Write-Log 'Verify-only: first CLI call may trigger device-code login (see Auth note).' 'NOTE' }
    $themes = @(Get-Themes 'themes-after')
    if (-not $DryRun) {
      if (-not $script:TargetId) {
        $cand = @($themes | Where-Object { $_.name -eq $ThemeName -and $_.role -eq 'unpublished' })
        if ($cand.Count -ne 1) { Fail "Cannot pick the theme by name ('$ThemeName', unpublished): found $($cand.Count). Pass -ThemeId." }
        $script:TargetId = [string]$cand[0].id
      }
      # wait for processing=false
      $t = $null
      for ($i = 0; $i -lt 24; $i++) {
        $t = @($themes | Where-Object { [string]$_.id -eq $script:TargetId })[0]
        if (-not $t) { Fail "Theme $($script:TargetId) not in theme list" }
        if (-not $t.processing) { break }
        Write-Log "Theme still processing; waiting 5 s ($($i + 1)/24)" 'INFO'
        Start-Sleep -Seconds 5
        $themes = @(Get-Themes 'themes-after')
      }
      if ($t.processing) { Fail 'Theme still processing after 120 s' }
      if ($t.role -ne 'unpublished') { Fail "Theme $($script:TargetId) role is '$($t.role)', expected unpublished" }
      Write-Log "Theme $($script:TargetId) '$($t.name)' role=unpublished" 'PASS'
      $liveNow = @($themes | Where-Object { $_.role -eq 'live' })[0]
      if ($script:LiveBefore -and ([string]$liveNow.id -ne [string]$script:LiveBefore.id)) { Fail "LIVE THEME CHANGED: before $($script:LiveBefore.id), now $($liveNow.id)" }
      if ($script:LiveBefore) { Write-Log "Live theme unchanged ($($liveNow.id) '$($liveNow.name)')" 'PASS' }
      $script:Result.liveAfterId = [string]$liveNow.id
    }

    # pull into an EMPTY folder
    if (Test-Path $PullDir) { Remove-Item -Recurse -Force $PullDir }
    New-Item -ItemType Directory -Force $PullDir | Out-Null
    $pullId = $script:TargetId
    $r = Invoke-Cli -CliArgs (Add-AuthArgs @('theme', 'pull', '--store', $script:StoreFqdn, '--theme', $pullId, '--path', $PullDir)) -LogName 'theme-pull'
    if (-not $r.DryRun -and $r.ExitCode -ne 0) { Fail "theme pull failed (exit $($r.ExitCode))" }

    # parity (in DryRun: self-test of the tool, ThemeDir vs ThemeDir)
    $cmpDir = $PullDir
    if ($DryRun) { $cmpDir = $ThemeDir; Write-Log 'DryRun: parity tool self-test (extract vs itself)' 'NOTE' }
    $p = & node $ParityTool $ThemeDir $cmpDir --json
    $pcode = $LASTEXITCODE
    Write-Utf8NoBom (Join-Path $script:WorkDir 'parity.json') (($p | Out-String))
    $pj = ConvertFrom-CliJson (($p | Out-String))
    if ($null -eq $pj) { Fail 'parity tool returned no JSON' }
    $script:Result.parity = $pj
    Write-Log ("PARITY: zip={0} remote={1} exact={2} jsonSemantic={3} onlyZip={4} onlyRemote={5} different={6} ok={7}" -f $pj.zip, $pj.remote, $pj.exactos, $pj.jsonSemanticamenteIguales, @($pj.soloZip).Count, @($pj.soloRemoto).Count, @($pj.distintos).Count, $pj.ok)
    if ($pcode -ne 0 -or -not $pj.ok -or $pj.zip -ne $ExpectedFiles -or $pj.remote -ne $ExpectedFiles) { Fail 'PARITY FAIL (remote != ZIP)' }
    if ($pj.exactos -ne $ExpectedExact -or $pj.jsonSemanticamenteIguales -ne $ExpectedSemantic) {
      Write-Log "Parity OK but split differs from lab ($ExpectedExact exact + $ExpectedSemantic semantic JSON); review distintos list is empty - not a failure" 'WARN'
    }
    Write-Log "PARITY PASS: $ExpectedFiles/$ExpectedFiles" 'PASS'

    # final role re-check: never published
    if (-not $DryRun) {
      $fin = @(Get-Themes 'themes-final')
      $t2 = @($fin | Where-Object { [string]$_.id -eq $script:TargetId })[0]
      if (-not $t2 -or $t2.role -ne 'unpublished') { Fail "FINAL CHECK: theme not unpublished ($($t2.role))" }
      Write-Log "FINAL: theme $($script:TargetId) still unpublished. Nothing was published." 'PASS'
    }
    Stop-Step $OkStatus
  }
}
catch {
  $script:Failed = $true
  if ($script:StepName) { Stop-Step 'FAIL' }
  Write-Log "ABORTED: $($_.Exception.Message)" 'FAIL'
}

$overallEnd = Get-BogotaNow
$script:Result.endBogota = $overallEnd.ToString('o')
$script:Result.totalSeconds = [math]::Round(($overallEnd - $overallStart).TotalSeconds, 1)
$script:Result.targetThemeId = $script:TargetId
$script:Result.steps = $script:Timing
$script:Result.status = if ($script:Failed) { 'FAIL' } else { $OkStatus }
Write-Utf8NoBom (Join-Path $WorkDir 'result.json') ($script:Result | ConvertTo-Json -Depth 8)
Write-Log "END_TIME_BOGOTA=$($overallEnd.ToString('o')) total=$($script:Result.totalSeconds)s"
Write-Log "LANE_A_RESULT: $($script:Result.status)  (result.json in $WorkDir)"
if ($script:Failed) { exit 1 } else { exit 0 }
