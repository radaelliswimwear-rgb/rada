#!/usr/bin/env node
/**
 * LANE C — READ-ONLY verification of a store against the certified lab structure (lab-shipping-structure.json).
 *
 *   TARGET_STORE=<handle>.myshopify.com node verify-shipping.mjs [--no-shop] [--json] [--structure <file>] [--location-group <gid>]
 *
 * Shipping checks: default profile, CO location, exactly 5 zones, 33 unique CO provinces, per-zone name/provinces/rates
 * (paid [9900,12900,17900,21900,44900] for subtotal <= 299899; 'Envío estándar gratis' price 0 for subtotal >= 299900),
 * profile counters (10 active rates, 0 locations without rates), shop ships only to CO.
 * Shop/markets checks (skip with --no-shop): COP, America/Bogota, KILOGRAMS/metric, CO address, Colombia market ACTIVE, no ACTIVE market outside CO (US DRAFT or absent).
 * Exit code 0 = all PASS, 1 = at least one FAIL. Sends only queries (no --allow-mutations).
 */
import { guard, argFlag, argValue, requireTargetStore, loadGql, loadStructure, PROFILE_QUERY, SHOP_MARKETS_QUERY, readState, verifyShipping, verifyShopMarkets, printChecks, DEFAULT_STRUCTURE } from "./shipping-lib.mjs";

const argv = process.argv.slice(2);
const JSON_OUT = argFlag(argv, "--json");
const structure = guard(() => loadStructure(argValue(argv, "--structure") || DEFAULT_STRUCTURE));
const store = guard(requireTargetStore);
const { gql, source } = await loadGql(store);
if (!JSON_OUT) console.log(`[verify-shipping] store=${store} (read-only) gql=${source === "inline" ? "inline" : "03l-migrate.mjs"}`);

const state = readState(gql(PROFILE_QUERY), { locationGroupId: argValue(argv, "--location-group") });
const ship = verifyShipping(structure, state);
let shop = [];
if (!argFlag(argv, "--no-shop")) shop = verifyShopMarkets(structure, gql(SHOP_MARKETS_QUERY));

let bad;
if (JSON_OUT) {
  bad = [...ship, ...shop].filter((c) => !c.pass).length;
  console.log(JSON.stringify({ store, ok: bad === 0, shipping: ship, shopMarkets: shop }));
} else {
  bad = printChecks("shipping", ship);
  if (shop.length) bad += printChecks("shop + markets", shop);
  console.log(`\nVERDICT: ${bad === 0 ? "SHIPPING_VERIFIED" : "SHIPPING_MISMATCH (" + bad + " failing check(s))"}`);
}
process.exit(bad ? 1 : 0);
