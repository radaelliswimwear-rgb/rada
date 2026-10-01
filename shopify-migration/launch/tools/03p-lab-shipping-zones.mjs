import fs from "node:fs";
import { gql } from "file:///C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/tools/03l-migrate.mjs";
const APPLY = process.argv.includes("--apply");
const FREE_MIN = 299900;
const ZONES = [
  { name: "Zona 1 — Barranquilla y Atlántico", price: 9900, prov: ["ATL"] },
  { name: "Zona 2 — Resto del Caribe", price: 12900, prov: ["BOL", "MAG", "COR", "SUC", "LAG", "CES"] },
  { name: "Zona 3 — Ciudades principales", price: 17900, prov: ["DC", "ANT", "VAC", "SAN", "RIS", "CAL", "QUI", "CUN", "NSA"] },
  { name: "Zona 4 — Resto del país", price: 21900, prov: ["BOY", "TOL", "HUI", "MET", "NAR", "CAU", "CAQ", "ARA", "CAS", "CHO", "PUT"] },
  { name: "Zona 5 — San Andrés y Amazonía", price: 44900, prov: ["SAP", "AMA", "VAU", "GUA", "GUV", "VID"] },
];
const money = (a) => ({ amount: String(a), currencyCode: "COP" });
const profile = {
  id: "gid://shopify/DeliveryProfile/134010306879",
  locationGroup: "gid://shopify/DeliveryLocationGroup/135721615679",
  delete: ["gid://shopify/DeliveryZone/585765847359", "gid://shopify/DeliveryZone/585665839423"],
};
const zonesToCreate = ZONES.map((z) => ({
  name: z.name,
  countries: [{ code: "CO", provinces: z.prov.map((c) => ({ code: c })) }],
  methodDefinitionsToCreate: [
    { name: "Envío estándar", active: true, rateDefinition: { price: money(z.price) }, priceConditionsToCreate: [{ operator: "LESS_THAN_OR_EQUAL_TO", criteria: money(FREE_MIN - 1) }] },
    { name: "Envío estándar gratis", active: true, rateDefinition: { price: money(0) }, priceConditionsToCreate: [{ operator: "GREATER_THAN_OR_EQUAL_TO", criteria: money(FREE_MIN) }] },
  ],
}));
const vars = { id: profile.id, profile: { zonesToDelete: profile.delete, locationGroupsToUpdate: [{ id: profile.locationGroup, zonesToCreate }] } };
console.log(JSON.stringify({ zonas: ZONES.map((z) => [z.name, z.price, z.prov.length]), provincias: ZONES.reduce((a, z) => a + z.prov.length, 0), apply: APPLY }));
if (!APPLY) process.exit(0);
const r = gql(`mutation($id: ID!, $profile: DeliveryProfileInput!) { deliveryProfileUpdate(id: $id, profile: $profile) { profile { id } userErrors { field message } } }`, vars, true);
console.log(JSON.stringify(r.deliveryProfileUpdate));
