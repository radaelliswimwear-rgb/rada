// Coordinator: replicate the lab's location address (Barranquilla) on the official store's single location.
import { gql } from "file:///C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/tools/03l-migrate.mjs";
const ADDR = { address1: "Calle 93 #72-71", city: "Barranquilla", provinceCode: "ATL", zip: "080001", countryCode: "CO" };
const q = gql(`query { locations(first: 5) { nodes { id name address { address1 city provinceCode zip countryCode } } } }`);
const loc = q.locations.nodes[0];
console.log("before", JSON.stringify(loc));
const r = gql(`mutation($id: ID!, $in: LocationEditInput!) { locationEdit(id: $id, input: $in) { location { id name address { address1 city province provinceCode zip countryCode } } userErrors { field message } } }`, { id: loc.id, in: { address: ADDR } }, true);
console.log("after", JSON.stringify(r.locationEdit));
