import fs from "node:fs";
import { gql } from "file:///C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/launch/tools/03l-migrate.mjs";
const ROOT = "C:/CLAUDE/rada-main/rada-main/commerce-main/commerce-main/.claude/worktrees/shopify-migration-prep/shopify-migration/";
const mode = process.argv[2];
if (mode === "pages") {
  const pg = gql(`query { pages(first: 20) { nodes { id handle templateSuffix isPublished body } } }`).pages.nodes;
  const gar = pg.find((p) => p.handle === "garantia");
  const want = fs.readFileSync(ROOT + "content/legal/garantia.html", "utf8").replace(/\r\n/g, "\n");
  const norm = (s) => String(s || "").replace(/\s+/g, "");
  console.log("garantia published:", gar?.isPublished, "igual:", norm(gar?.body) === norm(want), "len", gar?.body?.length, want.length);
  const fav = pg.find((p) => p.handle === "favoritos");
  console.log("favoritos template:", fav?.templateSuffix);
  if (gar && norm(gar.body) !== norm(want)) {
    const r = gql(`mutation($id: ID!, $p: PageUpdateInput!) { pageUpdate(id: $id, page: $p) { page { id } userErrors { message } } }`, { id: gar.id, p: { body: want, isPublished: true } }, true);
    console.log("garantia actualizada", JSON.stringify(r.pageUpdate.userErrors));
  }
  if (fav && fav.templateSuffix !== "wishlist") {
    const r = gql(`mutation($id: ID!, $p: PageUpdateInput!) { pageUpdate(id: $id, page: $p) { page { id } userErrors { message } } }`, { id: fav.id, p: { templateSuffix: "wishlist" } }, true);
    console.log("favoritos plantilla", JSON.stringify(r.pageUpdate.userErrors));
  }
}
if (mode === "collections") {
  const cs = gql(`query { collections(first: 20) { nodes { id handle sortOrder } } }`).collections.nodes;
  for (const c of cs) {
    if (c.handle === "frontpage") continue;
    if (c.sortOrder !== "MANUAL") {
      const r = gql(`mutation($i: CollectionInput!) { collectionUpdate(input: $i) { collection { handle sortOrder } userErrors { message } } }`, { i: { id: c.id, sortOrder: "MANUAL" } }, true);
      console.log(c.handle, JSON.stringify(r.collectionUpdate));
    } else console.log(c.handle, "ya MANUAL");
  }
}
