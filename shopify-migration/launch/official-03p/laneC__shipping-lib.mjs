// Shared helpers for apply-shipping.mjs / verify-shipping.mjs (LANE C). No side effects at import time.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_STRUCTURE = path.join(DIR, "lab-shipping-structure.json");
// The inactive client-transfer 'launch' store must NEVER be touched by this lane.
export const FORBIDDEN_STORES = ["radaelli-swimwear-colombia-launch-1jeqp0yj.myshopify.com"];
const PREP_03L = "C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/tools/03l-migrate.mjs";

/** run fn; on a validation error print a clean message and exit 2 (no stack trace) */
export function guard(fn) { try { return fn(); } catch (e) { console.error("ERROR: " + e.message); process.exit(2); } }
export function argFlag(argv, name) { return argv.includes(name); }
export function argValue(argv, name) {
  const i = argv.findIndex((a) => a === name || a.startsWith(name + "="));
  if (i < 0) return null;
  return argv[i].includes("=") ? argv[i].split("=").slice(1).join("=") : argv[i + 1] ?? null;
}

// ---- target store (explicit, never defaulted: 03l-migrate's own default is the inactive 'launch' store) ----
export function requireTargetStore() {
  const s = (process.env.TARGET_STORE || "").trim().toLowerCase();
  if (!s) throw new Error("TARGET_STORE is required (e.g. TARGET_STORE=<handle>.myshopify.com). No default on purpose.");
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(s)) throw new Error(`TARGET_STORE must look like <handle>.myshopify.com, got '${s}'`);
  if (FORBIDDEN_STORES.includes(s)) throw new Error(`TARGET_STORE ${s} is the inactive 'launch' store: forbidden.`);
  process.env.TARGET_STORE = s; // 03l-migrate.mjs reads this at import time
  return s;
}

// ---- gql(): same contract as 03l-migrate.mjs (shopify.cmd store execute; mutations need allow-mutations) ----
function inlineGql(store) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "laneC-"));
  let seq = 0;
  return function gql(query, variables = {}, mutation = false) {
    const n = ++seq;
    const qf = path.join(tmp, `q${n}.graphql`);
    const vf = path.join(tmp, `v${n}.json`);
    fs.writeFileSync(qf, query);
    fs.writeFileSync(vf, JSON.stringify(variables));
    const args = ["store", "execute", "--store", store, "--query-file", qf, "--variable-file", vf, "--json", "--no-color"];
    if (mutation) args.push("--allow-mutations");
    const r = spawnSync("shopify.cmd", args, { encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
    const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");
    const i = out.indexOf("{");
    if (r.status !== 0 || i < 0) throw new Error(`gql #${n} failed (exit ${r.status}): ${((r.stderr || "") + out).replace(/\u001b\[[0-9;]*[A-Za-z]/g, "").slice(0, 1500)}`);
    return JSON.parse(out.slice(i));
  };
}

/** Prefers the proven gql() of 03l-migrate.mjs (sibling file, GQL_MODULE env, or the prep worktree); falls back to an identical inline copy. */
export async function loadGql(store) {
  const candidates = [process.env.GQL_MODULE, path.join(DIR, "03l-migrate.mjs"), PREP_03L].filter(Boolean);
  for (const c of candidates) {
    try {
      if (!fs.existsSync(c)) continue;
      const m = await import(pathToFileURL(c).href);
      if (typeof m.gql === "function") return { gql: m.gql, source: c };
    } catch { /* try next */ }
  }
  return { gql: inlineGql(store), source: "inline" };
}

// ---- queries (read-only) ----
export const PROFILE_QUERY = `query {
  deliveryProfiles(first: 10) { nodes {
    id name default originLocationCount locationsWithoutRatesCount activeMethodDefinitionsCount zoneCountryCount
    profileLocationGroups {
      locationGroup { id locations(first: 20) { nodes { id name isActive address { city provinceCode countryCode } } } }
      locationGroupZones(first: 50) { nodes {
        zone { id name countries { code { countryCode restOfWorld } provinces { code name } } }
        methodDefinitions(first: 30) { nodes {
          id name active
          rateProvider { __typename ... on DeliveryRateDefinition { id price { amount currencyCode } } }
          methodConditions { id field operator conditionCriteria { __typename ... on MoneyV2 { amount currencyCode } ... on Weight { value unit } } }
        } }
      } }
    }
  } }
  shop { countriesInShippingZones { countryCodes includeRestOfWorld } shipsToCountries }
}`;

export const SHOP_MARKETS_QUERY = `query {
  shop { name currencyCode ianaTimezone weightUnit unitSystem enabledPresentmentCurrencies shopAddress { city provinceCode countryCodeV2 } }
  locations(first: 20, includeInactive: true) { nodes { id name isActive fulfillsOnlineOrders address { city provinceCode countryCode } } }
  markets(first: 25) { nodes { id name handle status type conditions { regionsCondition { applicationLevel regions(first: 50) { nodes { __typename name ... on MarketRegionCountry { code } } } } } } }
}`;

export const MUTATION = `mutation($id: ID!, $profile: DeliveryProfileInput!) { deliveryProfileUpdate(id: $id, profile: $profile) { profile { id } userErrors { field message } } }`;

// ---- structure ----
export function loadStructure(file = DEFAULT_STRUCTURE) {
  const s = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  const z = s.delivery_profile.zones;
  if (z.length !== 5) throw new Error("structure: expected 5 zones, got " + z.length);
  const prov = z.flatMap((x) => x.provinces.map((p) => p.code));
  if (prov.length !== 33 || new Set(prov).size !== 33) throw new Error("structure: expected 33 unique provinces, got " + prov.length);
  return s;
}

const num = (v) => (v === null || v === undefined ? null : Number(v));
const money = (a) => ({ amount: String(a), currencyCode: "COP" });

/** price-range of a rate from its conditions; min defaults to 0 (Shopify adds an implicit >= 0), max to null (= unbounded). */
function rangeOf(conds) {
  let min = 0, max = null; const other = [];
  for (const c of conds) {
    if (c.field !== "TOTAL_PRICE") { other.push(`${c.field} ${c.operator}`); continue; }
    const a = num(c.amount);
    if (c.operator === "GREATER_THAN_OR_EQUAL_TO") min = Math.max(min, a);
    else if (c.operator === "LESS_THAN_OR_EQUAL_TO") max = max === null ? a : Math.min(max, a);
    else other.push(`${c.field} ${c.operator} ${a}`);
  }
  return { min, max, other };
}

/** expected zones (normalised) from the structure JSON (uses the INTENT conditions). */
export function expectedZones(structure) {
  return structure.delivery_profile.zones.map((z) => ({
    name: z.name,
    country: z.country,
    provinces: z.provinces.map((p) => p.code).sort(),
    rates: z.rates.map((r) => ({ name: r.name, active: r.active, price: num(r.price.amount), ...rangeOf(r.conditions.map((c) => ({ field: c.field, operator: c.operator, amount: c.amount }))) })),
  }));
}

/** the profile + chosen location group + normalised zones from a PROFILE_QUERY result */
export function readState(data, { locationGroupId } = {}) {
  const profile = data.deliveryProfiles.nodes.find((p) => p.default);
  if (!profile) throw new Error("no default delivery profile found");
  const groups = profile.profileLocationGroups;
  let group = null;
  if (groups.length === 1) group = groups[0];
  else if (groups.length > 1) {
    group = groups.find((g) => g.locationGroup.id === locationGroupId) || null;
  }
  const zonesOf = (g) => g.locationGroupZones.nodes.map((n) => ({
    id: n.zone.id,
    name: n.zone.name,
    countries: n.zone.countries.map((c) => ({ code: c.code.restOfWorld ? "ROW" : c.code.countryCode, provinces: c.provinces.map((p) => p.code).sort() })),
    rates: n.methodDefinitions.nodes.map((m) => ({
      id: m.id, name: m.name, active: m.active,
      price: num(m.rateProvider?.price?.amount),
      currency: m.rateProvider?.price?.currencyCode,
      ...rangeOf(m.methodConditions.map((c) => ({ field: c.field, operator: c.operator, amount: c.conditionCriteria?.amount }))),
    })),
  }));
  return {
    profile: { id: profile.id, name: profile.name, originLocationCount: profile.originLocationCount, locationsWithoutRatesCount: profile.locationsWithoutRatesCount, activeMethodDefinitionsCount: profile.activeMethodDefinitionsCount, zoneCountryCount: profile.zoneCountryCount },
    groupCount: groups.length,
    group: group ? { id: group.locationGroup.id, locations: group.locationGroup.locations.nodes.map((l) => ({ name: l.name, isActive: l.isActive, countryCode: l.address?.countryCode, city: l.address?.city })), zones: zonesOf(group) } : null,
    allZones: groups.flatMap(zonesOf),
    shop: data.shop,
  };
}

/** list of human-readable differences between an expected zone and an actual one ([] = identical) */
export function zoneDiffs(exp, act) {
  const d = [];
  if (act.countries.length !== 1 || act.countries[0].code !== exp.country) d.push(`countries=${act.countries.map((c) => c.code).join("+")} (expected ${exp.country})`);
  const c0 = act.countries[0];
  if (c0) {
    const miss = exp.provinces.filter((p) => !c0.provinces.includes(p));
    const extra = c0.provinces.filter((p) => !exp.provinces.includes(p));
    if (miss.length) d.push(`missing provinces ${miss.join(",")}`);
    if (extra.length) d.push(`extra provinces ${extra.join(",")}`);
  }
  if (act.rates.length !== exp.rates.length) d.push(`rates=${act.rates.length} (expected ${exp.rates.length})`);
  for (const er of exp.rates) {
    const ar = act.rates.filter((r) => r.name === er.name);
    if (ar.length !== 1) { d.push(`rate '${er.name}' count=${ar.length}`); continue; }
    const r = ar[0];
    if (r.price !== er.price) d.push(`rate '${er.name}' price ${r.price} != ${er.price}`);
    if (r.active !== er.active) d.push(`rate '${er.name}' active ${r.active} != ${er.active}`);
    if (r.min !== er.min) d.push(`rate '${er.name}' min ${r.min} != ${er.min}`);
    if (r.max !== er.max) d.push(`rate '${er.name}' max ${r.max} != ${er.max}`);
    if (r.other.length) d.push(`rate '${er.name}' unexpected conditions ${r.other.join("; ")}`);
    if (r.currency && r.currency !== "COP") d.push(`rate '${er.name}' currency ${r.currency}`);
  }
  for (const r of act.rates) if (!exp.rates.some((er) => er.name === r.name)) d.push(`unexpected rate '${r.name}'`);
  return d;
}

/** idempotent diff: what must be deleted / created so that the group holds exactly the expected zones */
export function planChanges(structure, state, { keepStale = false } = {}) {
  const exp = expectedZones(structure);
  const zones = state.group.zones;
  const names = new Set(exp.map((e) => e.name));
  const ok = [], del = [], create = [], notes = [];
  for (const e of exp) {
    const same = zones.filter((z) => z.name === e.name);
    const exact = same.find((z) => zoneDiffs(e, z).length === 0);
    if (exact) {
      ok.push(e.name);
      for (const z of same) if (z !== exact) del.push({ id: z.id, name: z.name, reason: "duplicate of an already-correct zone" });
    } else {
      for (const z of same) del.push({ id: z.id, name: z.name, reason: "same name but differs: " + zoneDiffs(e, z).join("; ") });
      create.push(e);
    }
  }
  for (const z of zones) {
    if (names.has(z.name)) continue;
    if (keepStale) { notes.push(`kept stale zone '${z.name}' (--keep-stale); may collide with CO provinces`); continue; }
    del.push({ id: z.id, name: z.name, reason: "not part of the certified structure (stale/default zone: " + z.countries.map((c) => c.code).join("+") + ")" });
  }
  return { ok, del, create, notes, noop: del.length === 0 && create.length === 0 };
}

export function zoneInput(e) {
  return {
    name: e.name,
    countries: [{ code: e.country, provinces: e.provinces.map((c) => ({ code: c })) }],
    methodDefinitionsToCreate: e.rates.map((r) => ({
      name: r.name,
      active: r.active,
      rateDefinition: { price: money(r.price) },
      priceConditionsToCreate: [
        ...(r.min > 0 ? [{ operator: "GREATER_THAN_OR_EQUAL_TO", criteria: money(r.min) }] : []),
        ...(r.max !== null ? [{ operator: "LESS_THAN_OR_EQUAL_TO", criteria: money(r.max) }] : []),
      ],
    })),
  };
}

export function buildVariables(profileId, groupId, plan) {
  const profile = { locationGroupsToUpdate: [{ id: groupId, zonesToCreate: plan.create.map(zoneInput) }] };
  if (plan.del.length) profile.zonesToDelete = plan.del.map((d) => d.id);
  return { id: profileId, profile };
}

// ---- verification (shipping) ----
export function verifyShipping(structure, state) {
  const checks = [];
  const add = (id, pass, detail) => checks.push({ id, pass: !!pass, detail });
  const exp = expectedZones(structure);
  const tot = structure.expected_totals;
  add("default_profile_found", !!state.profile, state.profile?.name);
  if (!state.group) { add("location_group_resolved", false, `${state.groupCount} location group(s) on the default profile`); return checks; }
  add("location_group_has_CO_location", state.group.locations.some((l) => l.isActive && l.countryCode === "CO"), state.group.locations.map((l) => `${l.name}/${l.city}/${l.countryCode}`).join(", "));
  const zones = state.group.zones;
  add("zone_count_5", zones.length === tot.zones, `${zones.length} zones: ${zones.map((z) => z.name).join(" | ")}`);
  const provs = zones.flatMap((z) => z.countries.flatMap((c) => (c.code === "CO" ? c.provinces : [])));
  add("provinces_33_unique", provs.length === tot.provinces && new Set(provs).size === tot.provinces, `${provs.length} (${new Set(provs).size} unique)`);
  add("only_CO_countries", zones.every((z) => z.countries.length === 1 && z.countries[0].code === "CO"), zones.map((z) => z.countries.map((c) => c.code).join("+")).join(","));
  for (const e of exp) {
    const z = zones.find((x) => x.name === e.name);
    if (!z) { add(`zone '${e.name}'`, false, "missing"); continue; }
    const d = zoneDiffs(e, z);
    add(`zone '${e.name}'`, d.length === 0, d.length ? d.join("; ") : `${e.provinces.length} prov, paid ${e.rates.find((r) => r.price > 0).price}, free from ${e.rates.find((r) => r.price === 0).min}`);
  }
  const paid = exp.map((e) => zones.find((x) => x.name === e.name)?.rates.find((r) => r.price > 0)?.price ?? null);
  add("paid_rates_ordered", JSON.stringify(paid) === JSON.stringify(tot.paid_prices_cop), JSON.stringify(paid) + " expected " + JSON.stringify(tot.paid_prices_cop));
  const freeFrom = zones.flatMap((z) => z.rates.filter((r) => r.price === 0).map((r) => r.min));
  add("free_from_299900_everywhere", freeFrom.length === 5 && freeFrom.every((m) => m === tot.free_from_cop), JSON.stringify(freeFrom));
  const paidMax = zones.flatMap((z) => z.rates.filter((r) => r.price > 0).map((r) => r.max));
  add("paid_max_299899_everywhere", paidMax.length === 5 && paidMax.every((m) => m === tot.free_from_cop - 1), JSON.stringify(paidMax));
  add("profile_activeMethodDefinitionsCount", state.profile.activeMethodDefinitionsCount === tot.activeMethodDefinitionsCount, `${state.profile.activeMethodDefinitionsCount} expected ${tot.activeMethodDefinitionsCount}`);
  add("locationsWithoutRatesCount_0", state.profile.locationsWithoutRatesCount === 0, String(state.profile.locationsWithoutRatesCount));
  const sz = state.shop?.countriesInShippingZones;
  add("shop_ships_only_to_CO", !!sz && sz.countryCodes.length === 1 && sz.countryCodes[0] === "CO" && sz.includeRestOfWorld === false, JSON.stringify(sz));
  return checks;
}

// ---- verification (shop + markets) ----
export function verifyShopMarkets(structure, data) {
  const checks = [];
  const add = (id, pass, detail) => checks.push({ id, pass: !!pass, detail });
  const s = data.shop, want = structure.shop;
  add("currency_COP", s.currencyCode === want.currencyCode, s.currencyCode);
  add("presentment_currencies_only_COP", JSON.stringify(s.enabledPresentmentCurrencies) === JSON.stringify(want.enabledPresentmentCurrencies), JSON.stringify(s.enabledPresentmentCurrencies));
  add("timezone_America_Bogota", s.ianaTimezone === want.ianaTimezone, s.ianaTimezone);
  add("weight_unit_KILOGRAMS", s.weightUnit === want.weightUnit, s.weightUnit);
  add("unit_system_metric", s.unitSystem === want.unitSystem, s.unitSystem);
  add("shop_address_country_CO", s.shopAddress?.countryCodeV2 === "CO", `${s.shopAddress?.city}/${s.shopAddress?.provinceCode}/${s.shopAddress?.countryCodeV2}`);
  const mk = data.markets.nodes.map((m) => ({ ...m, regions: m.conditions?.regionsCondition?.regions.nodes.map((r) => r.code).filter(Boolean) || [] }));
  const co = mk.find((m) => m.regions.includes("CO"));
  add("market_colombia_ACTIVE", co?.status === "ACTIVE", co ? `${co.handle}:${co.status}` : "no market covers CO");
  const nonCoActive = mk.filter((m) => m.status === "ACTIVE" && m.regions.some((r) => r !== "CO"));
  add("no_ACTIVE_market_outside_CO", nonCoActive.length === 0, nonCoActive.length ? nonCoActive.map((m) => `${m.handle}:${m.regions}`).join(",") : mk.map((m) => `${m.handle}:${m.status}[${m.regions}]`).join(" | "));
  const loc = data.locations.nodes.filter((l) => l.isActive);
  add("active_CO_location_fulfills_online", loc.some((l) => l.address?.countryCode === "CO" && l.fulfillsOnlineOrders), loc.map((l) => `${l.name}/${l.address?.city}/${l.address?.countryCode}/online=${l.fulfillsOnlineOrders}`).join(", "));
  return checks;
}

export function printChecks(title, checks) {
  console.log(`\n== ${title}`);
  for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.id}${c.detail ? "  - " + c.detail : ""}`);
  const bad = checks.filter((c) => !c.pass).length;
  console.log(`-- ${checks.length - bad}/${checks.length} PASS`);
  return bad;
}
