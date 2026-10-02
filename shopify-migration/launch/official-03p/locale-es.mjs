// Coordinator: replicate the lab language setup on the official store: es enabled+published, web presence default es, en alternate.
import { gql } from "file:///C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/tools/03l-migrate.mjs";
const WP = "gid://shopify/MarketWebPresence/75059364139";
const cur = gql(`query { shopLocales { locale published } }`);
console.log("before", JSON.stringify(cur.shopLocales));
if (!cur.shopLocales.some((l) => l.locale === "es")) {
  const a = gql(`mutation($l: String!) { shopLocaleEnable(locale: $l) { shopLocale { locale published } userErrors { field message } } }`, { l: "es" }, true);
  console.log("enable", JSON.stringify(a.shopLocaleEnable));
}
const b = gql(`mutation($l: String!, $in: ShopLocaleInput!) { shopLocaleUpdate(locale: $l, shopLocale: $in) { shopLocale { locale published } userErrors { field message } } }`, { l: "es", in: { published: true } }, true);
console.log("publish", JSON.stringify(b.shopLocaleUpdate));
const c = gql(`mutation($id: ID!, $in: WebPresenceUpdateInput!) { webPresenceUpdate(id: $id, input: $in) { webPresence { defaultLocale { locale } alternateLocales { locale } rootUrls { locale url } } userErrors { field message } } }`, { id: WP, in: { defaultLocale: "es", alternateLocales: ["en"] } }, true);
console.log("webPresence", JSON.stringify(c.webPresenceUpdate));
