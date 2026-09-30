// Cuenta marcadores en el HTML renderizado (verificación rápida del render real).
const B = "http://127.0.0.1:4178";
const checks = {
  "/": ["site-header__wishlist", "<shopify-account", 'slot="signed-out-avatar"', 'button button--outline" href="/account"', "data-wishlist-count", 'id="CartDrawer', "@font-face", "wishlist-account-state", 'id="MainContent"'],
  "/?customer=1&sync=1": ["wishlist-account-state", '"items":[{"id":101', 'slot="signed-out-avatar"'],
  "/?sync=1": ['"signedOut":true'],
  "/?accounts=0": ["<shopify-account", "site-header__account-link"],
  "/products/bikini-oasis-natural-arena": ["data-product-form", 'action="/cart/add"', 'name="id"', "data-wishlist-trigger", "product-gallery", "application/ld+json", "size-guide"],
  "/cart": ['data-line-key', "$159.900", 'name="checkout"'],
  "/collections/oasis-natural": ["product-card", "filter.v.option.talla", "pagination"],
  "/pages/favoritos": ["<wishlist-page", "data-wishlist-sync-notice"],
  "/search?q=bikini": ["product-card", "<predictive-search"],
};
(async () => {
  for (const [u, pats] of Object.entries(checks)) {
    const html = await (await fetch(B + u)).text();
    console.log(`== ${u}`);
    for (const p of pats) console.log(`   ${String(html.split(p).length - 1).padStart(3)}  ${p}`);
    if (u === "/?customer=1&sync=1") console.log("   owner64:", /"owner":"[a-f0-9]{64}"/.test(html));
  }
})();
