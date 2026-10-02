#!/usr/bin/env node
/**
 * LANE C — apply the certified regional shipping structure to a FRESH store (idempotent).
 *
 *   TARGET_STORE=<handle>.myshopify.com node apply-shipping.mjs                 # DRY-RUN (default): reads the store (read-only) and prints the intended mutation
 *   TARGET_STORE=<handle>.myshopify.com node apply-shipping.mjs --offline       # prints the intended mutation with placeholder GIDs; NO network at all
 *   TARGET_STORE=<handle>.myshopify.com node apply-shipping.mjs --apply --confirm-store=<handle>.myshopify.com
 *
 * Flags: --structure <file> (default ./lab-shipping-structure.json) | --keep-stale (do not delete zones outside the structure)
 *        --location-group <gid> (only when the default profile has >1 location group) | --json (machine-readable summary)
 *
 * Behaviour (re-running never creates duplicates):
 *   - reads the default delivery profile + location group + zones, compares each of the 5 certified zones (name, CO provinces, rate names/prices/active/price range);
 *   - identical zone -> left alone; same-name-but-different or duplicate -> deleted and recreated; zones outside the structure (Shopify defaults such as 'Domestic',
 *     'International' or 'Colombia') -> deleted (unless --keep-stale) because they would collide with the CO provinces;
 *   - ONE deliveryProfileUpdate call: zonesToDelete (profile level) + locationGroupsToUpdate[].zonesToCreate (the exact shape certified in the lab);
 *   - after --apply it re-reads the store and runs the same checks as verify-shipping.mjs; exit code 1 if anything differs.
 * Safety: TARGET_STORE is mandatory (no default), the inactive 'launch' store is refused, --apply additionally needs --confirm-store equal to TARGET_STORE.
 * Needs Admin scopes read_shipping, write_shipping, read_locations (+ read_markets/write_markets for the markets checklist).
 */
import { guard, argFlag, argValue, requireTargetStore, loadGql, loadStructure, PROFILE_QUERY, MUTATION, readState, planChanges, buildVariables, verifyShipping, printChecks, expectedZones, DEFAULT_STRUCTURE } from "./shipping-lib.mjs";

const argv = process.argv.slice(2);
const APPLY = argFlag(argv, "--apply");
const OFFLINE = argFlag(argv, "--offline");
const KEEP_STALE = argFlag(argv, "--keep-stale");
const JSON_OUT = argFlag(argv, "--json");
const structure = guard(() => loadStructure(argValue(argv, "--structure") || DEFAULT_STRUCTURE));
const log = (...a) => { if (!JSON_OUT) console.log(...a); };

if (APPLY && OFFLINE) { console.error("--apply and --offline are mutually exclusive"); process.exit(2); }
const store = guard(requireTargetStore);
if (APPLY && argValue(argv, "--confirm-store") !== store) { console.error(`--apply requires --confirm-store=${store}`); process.exit(2); }

if (OFFLINE) {
  // No Shopify access: print what a FRESH store would receive (all five zones created, nothing to delete).
  const plan = { ok: [], del: [], create: expectedZones(structure), notes: ["offline: existing zones unknown, zonesToDelete omitted"], noop: false };
  const vars = buildVariables("gid://shopify/DeliveryProfile/<DEFAULT_PROFILE_ID>", "gid://shopify/DeliveryLocationGroup/<LOCATION_GROUP_ID>", plan);
  console.log(JSON.stringify({ mode: "OFFLINE-DRY-RUN", store, mutation: MUTATION, variables: vars }, null, 2));
  process.exit(0);
}

const { gql, source } = await loadGql(store);
log(`[apply-shipping] store=${store} mode=${APPLY ? "APPLY" : "DRY-RUN"} gql=${source === "inline" ? "inline" : "03l-migrate.mjs"}`);

const state = readState(gql(PROFILE_QUERY), { locationGroupId: argValue(argv, "--location-group") });
if (state.groupCount === 0) {
  console.error("ABORT: the default delivery profile has no location group. The store needs an active location with a Colombian address that fulfils online orders (Settings > Locations, owner/UI or locationAdd). Create it first, then re-run.");
  process.exit(3);
}
if (!state.group) {
  console.error(`ABORT: the default profile has ${state.groupCount} location groups; pass --location-group <gid>.`);
  process.exit(3);
}
if (!state.group.locations.some((l) => l.isActive && l.countryCode === "CO")) {
  console.error("ABORT: the location group has no active location in Colombia (the lab origin was Barranquilla, CO). Fix the location address first.");
  process.exit(3);
}

const plan = planChanges(structure, state, { keepStale: KEEP_STALE });
const summary = {
  store, mode: APPLY ? "APPLY" : "DRY-RUN", profile: state.profile.id, locationGroup: state.group.id,
  existingZones: state.group.zones.map((z) => ({ name: z.name, countries: z.countries.map((c) => c.code), provinces: z.countries.reduce((n, c) => n + c.provinces.length, 0), rates: z.rates.length })),
  alreadyCorrect: plan.ok, toDelete: plan.del.map((d) => ({ name: d.name, id: d.id, reason: d.reason })), toCreate: plan.create.map((z) => z.name), notes: plan.notes, noop: plan.noop,
};
if (plan.noop) {
  log("NOOP: the store already has exactly the certified zones; nothing to create or delete.");
} else {
  const vars = buildVariables(state.profile.id, state.group.id, plan);
  summary.mutation = MUTATION;
  summary.variables = vars;
}
if (!JSON_OUT) console.log(JSON.stringify(summary, null, 2));

if (!APPLY) {
  if (JSON_OUT) console.log(JSON.stringify(summary));
  else log("\nDRY-RUN only: no mutation was sent. Re-run with --apply --confirm-store=" + store + " to execute.");
  process.exit(0);
}

if (!plan.noop) {
  const r = gql(MUTATION, summary.variables, true).deliveryProfileUpdate;
  log("deliveryProfileUpdate ->", JSON.stringify(r));
  if (r.userErrors?.length) { console.error("USER ERRORS:", JSON.stringify(r.userErrors)); process.exit(1); }
}

// post-apply read-back and verification (also covers the NOOP re-run)
const after = readState(gql(PROFILE_QUERY), { locationGroupId: argValue(argv, "--location-group") });
const checks = verifyShipping(structure, after);
const bad = JSON_OUT ? checks.filter((c) => !c.pass).length : printChecks("post-apply verification", checks);
if (JSON_OUT) console.log(JSON.stringify({ ...summary, applied: !plan.noop, verification: checks }));
process.exit(bad ? 1 : 0);
