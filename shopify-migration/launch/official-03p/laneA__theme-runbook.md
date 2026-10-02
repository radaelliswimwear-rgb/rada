# LANE A - Theme runbook: Radaelli RC1.10 -> OFFICIAL store (UNPUBLISHED) + 98/98 parity

Prepared 2026-10-02 (America/Bogota) by Lane A (read-only). Nothing was pushed, published, created or written on Shopify.
Parameter: `$STORE` = `xxx.myshopify.com` (the new official store). Script: `push-and-verify.ps1` (same folder).

## 1. Certified artifacts (verified by Lane A)

| Item | Value |
|---|---|
| ZIP (use this) | `C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/dist/radaelli-shopify-theme-rc1.10.zip` (178,702 bytes) |
| ZIP SHA-256 | `e0f67590e29029f1d90bc79a1675f72b2e129aa4d40323e9d090e927be52410c` = MATCH (prep and backup worktrees both identical) |
| Manifest | `.../shopify-migration/dist/release-manifest-rc1.10.json` (= `release-manifest.json`): 98 files, zip sha256 same, themeCheck "0 errors / 0 warnings (61 files, theme-src)" |
| Source tree | `.../shopify-migration/theme-src/` (99 files = the 98 + `README.md`, which is excluded from the ZIP; do NOT push theme-src, push the extracted ZIP) |
| Scratch extract | `C:/Users/user/AppData/Local/Temp/claude/C--CLAUDE-rada-main-rada-main/34c11d0a-7250-45aa-b727-3081da1b069a/scratchpad/rc110-extract` = byte-identical to the ZIP (parity tool: 98 exact, 0 semantic, 0 different) |
| Fresh extract by Lane A | `.../scratchpad/official/laneA/zip-fresh` (98 exact vs rc110-extract) |
| Parity tool | `.../shopify-migration/launch/tools/03k-theme-remote-parity.mjs <zip-extract> <pull-dir> [--json]` |
| Lab reference | lab pull `.../scratchpad/rc110-pull-final` vs ZIP = 98 files, 82 exact + 16 JSON-semantic, 0 different, PASS (this is the expected shape for the official store too) |
| Lab theme | `Radaelli RC1.10` id 189149511999, unpublished (read-only `theme list` on the lab, 2026-10-02) |
| CLI | global Shopify CLI 4.8.3 (`shopify.cmd`), Node v24.19.0. 03A used 4.8.2 via npx; all flags below exist in 4.8.3 (`--help` verified) |

## 2. Results of the read-only checks (Lane A)

- Theme Check on the extracted ZIP (`shopify theme check --path <extract>`): **61 files inspected, no offenses found** (exit 0). PASS.
- SHA-256 gate: PASS. Extract = 98 files, dirs `assets config layout locales sections snippets templates`. PASS.
- Announcement bar (no change made):
  - The only place with the text is `sections/header-group.json` -> `"text": "20% de descuento en toda la tienda"` (bytes: `2 0 % <space> d e ...`: NO space between 20 and %, lowercase). `config/settings_data.json` and `templates/*` do not override it.
  - It is shown uppercase by CSS (`.announcement-bar { text-transform: uppercase }` in `assets/section-header.css`), i.e. `20% DE DESCUENTO EN TODA LA TIENDA`.
  - Every lab pull (2026-09-30, 10-01 09:56, 10-01 18:59) carries the identical string, so the lab storefront renders exactly what the theme says. The spaced form "20 % DE DESCUENTO" exists only as prose in `theme/03P-lab-certification-report.md` (finding 5); the 03G route-parity validator documents that the "20 %" space was an HTML artifact (`20<!-- -->%`) of the old Next.js site. So the owner-plan string `20 % DE DESCUENTO...` is NOT what the theme contains; keeping the theme unchanged = `20% de descuento en toda la tienda`.
  - Lab live render could not be read: the lab storefront returns 200 at `/password` (password page); the visitor password must not be handled. Source-level evidence above is conclusive for the theme.
- Lab store read-only list worked with the cached CLI session (JSON shape: array of `{id,name,processing,createdAtRuntime,role}`).

## 3. Auth prerequisite (plan the ONE owner click)

1. The CLI session cached on this machine is the one used for the lab (`radaelli-swimwear-dev`, Partner account of the lab). The official store belongs to `radaelliswimwear@gmail.com`. The first `theme list/push` against the new store will require Shopify CLI device-code login (03A: `accounts.shopify.com/activate-with-code`; "Manual auth required: YES").
2. The owner must approve the printed code **in a browser logged in to Shopify as the store owner (or a staff account with Themes permission)**. Codes expire fast (in 03A the first code expired unused) -> run `-Phase Auth` while the owner is ready, read the code from the console output and hand it over immediately.
3. Use `-AuthAlias radaelli-official` to keep this session separate from the lab session (avoid `shopify auth logout`, which would drop the lab session). Reuse the same alias on every call (the script passes it to list/push/pull).
4. Alternative (more owner clicks, usually not worth it): a Theme Access password or Admin-API token with `read_themes`/`write_themes` via env `SHOPIFY_CLI_THEME_TOKEN` (CLI flag `--password`); the script inherits the env var. Do not log it.
5. Check in advance that the store is reachable and the account has access: `shopify theme list --store $STORE --json` (read-only). Typically on a brand-new store: a single default theme with role `live` (not verified; the script records whatever is there and requires it to stay live/unchanged).
6. After the first approval the session persists; push, pull and the final list reuse it (no further clicks).

## 4. Run it

PowerShell (Windows PowerShell 5.1 or 7):

```powershell
$S = 'xxx.myshopify.com'            # the new official store
$A = 'C:/Users/user/AppData/Local/Temp/claude/C--CLAUDE-rada-main-rada-main/34c11d0a-7250-45aa-b727-3081da1b069a/scratchpad/official/laneA'
# 0) rehearsal, touches nothing remote (prints every command, self-tests the parity tool)
powershell -NoProfile -ExecutionPolicy Bypass -File "$A/push-and-verify.ps1" -Store $S -DryRun
# 1) local preflight only (ZIP SHA gate, extract, Theme Check)
powershell -NoProfile -ExecutionPolicy Bypass -File "$A/push-and-verify.ps1" -Store $S -Phase Preflight
# 2) auth + read-only list (owner approves device code here)
powershell -NoProfile -ExecutionPolicy Bypass -File "$A/push-and-verify.ps1" -Store $S -Phase Auth -AuthAlias radaelli-official
# 3) everything (preflight, auth, push unpublished, verify 98/98)
powershell -NoProfile -ExecutionPolicy Bypass -File "$A/push-and-verify.ps1" -Store $S -AuthAlias radaelli-official
# 4) re-verify only (after a partial failure or later): picks the single unpublished 'Radaelli RC1.10' or use -ThemeId
powershell -NoProfile -ExecutionPolicy Bypass -File "$A/push-and-verify.ps1" -Store $S -Phase Verify -ThemeId 123456789012 -AuthAlias radaelli-official
```

Each run writes `<WorkDir>/result.json` (status, per-step Bogota timestamps, theme id, parity numbers), `themes-before/after/final.json`, `push-result.json`, `parity.json` and `logs/*.stdout.txt` (default `WorkDir` = `.../official/laneA/run-<timestamp>`). Exit code 0 = PASS, 1 = FAIL, 2 = bad args.

Manual equivalent of what the script runs (for transparency; `$X` = extracted ZIP dir, `$P` = EMPTY pull dir):

```powershell
shopify theme check --path $X                                                             # 61 files, no offenses
shopify theme list  --store $S --json                                                     # before: 1 theme, live
shopify theme push  --store $S --path $X --unpublished --theme "Radaelli RC1.10" --strict --json
shopify theme list  --store $S --json                                                     # new theme: unpublished, processing=false
shopify theme pull  --store $S --theme <id> --path $P
node <prep>/launch/tools/03k-theme-remote-parity.mjs $X $P --json                         # ok:true
```

Note: the theme name is passed with `--theme "<name>"` (there is NO `--theme-name` flag; with `--unpublished`, `--theme` is the NEW theme's name). `--json` returns `{"theme":{"id","name","role","shop","editor_url","preview_url"}}`.

## 5. PASS criteria (what the script enforces)

1. ZIP SHA-256 = `e0f67590...e410c`; extract = 98 files.
2. Theme Check: "no offenses found".
3. Push JSON: `theme.role == "unpublished"`; theme id captured. A theme with the same name already present aborts the push (use `-Phase Verify -ThemeId` or `-AllowDuplicate`).
4. After push: `processing=false`, role `unpublished`, the pre-existing live theme id unchanged.
5. Pull into an empty folder + parity tool: `remote 98 / zip 98`, 0 only-zip, 0 only-remote, 0 different. Expected split on the lab: 82 exact + 16 semantic JSON (Shopify reserializes JSON; the script only WARNs if the split differs, it FAILs only on real differences).
6. Final `theme list`: target theme still `unpublished`. **The script never publishes**: any of `--publish -p --live -l --allow-live -a` makes it throw before the CLI is called; the lab and the old `launch` store are hard-blocked; a re-push by `-ThemeId` is refused unless that theme's role is `unpublished`.

## 6. Failure modes / hints

- Device code expired or wrong account ("not authorized"/no access): re-run `-Phase Auth` and have the owner approve a fresh code with the store-owner (or staff) identity; consider `-AuthAlias`.
- Push rejects files server-side (03A lesson: Shopify validates limits that Theme Check does not, e.g. setting header <= 50 chars, `theme_author` <= 25; stops at the first error per file). RC1.10 already pushed cleanly to the lab with 0 rejections, so a rejection on the new store would be new information: stop and report, do not edit the theme.
- If the push created the theme but failed afterwards: `theme list` -> take the id -> `-Phase Push -ThemeId <id>` (re-push by id, allowed only for role `unpublished`) -> `-Phase Verify`.
- 429 / "Un momento": back off several minutes (Shopify rate-limits bursts); the script makes few calls (3 lists, 1 push, 1 pull).
- Parity different on a JSON that is not semantically equal: inspect `parity.json` (`distintos`), do NOT publish.
- Rollback of a bad unpublished theme = delete that unpublished theme in Admin (Online Store > Themes) or `shopify theme delete` (a mutation: coordinator/owner decision, not scripted).

## 7. Out of scope here (kept for the coordinator)

Publishing the theme, assigning templates, wishlist embed, Wompi, shipping, DNS and the owner's pending decisions (announcement-bar wording, voseo vs tuteo) are NOT part of this lane. Lane A only certifies "unpublished theme on the official store == certified ZIP (98/98)".
