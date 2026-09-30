// 03G — arma launch/03G-dev-store-snapshot.json (SIN secretos) a partir de:
//  - launch/evidence/*.json(l)  (capturas de solo lectura de la Dev Store del 2026-09-29)
//  - theme-src/config/settings_data.json y dist/release-manifest-rc1.8.json
//  - "adminObservations": lecturas visuales del Admin (Configuración/Contenido) hechas el 2026-09-29
//    con la sesión de la dueña en Chrome; se transcriben aquí a mano y cada bloque dice su origen.
// Uso: node launch/tools/03g-build-dev-snapshot.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(here, "..", "..");
const rd = (p) => fs.readFileSync(path.join(MIG, p), "utf8");
const products = rd("launch/evidence/dev-products.jsonl").trim().split("\n").map((l) => JSON.parse(l));
const collections = JSON.parse(rd("launch/evidence/dev-collections.json")).collections;
const routes = JSON.parse(rd("launch/evidence/dev-routes.json"));
const settings = JSON.parse(rd("theme-src/config/settings_data.json")).presets.Default;
const manifest = JSON.parse(rd("dist/release-manifest-rc1.8.json"));
const appManifestZip = "dist/radaelli-wishlist-app-0.1.2.zip";

const byType = {};
for (const p of products) byType[p.ty] = (byType[p.ty] || 0) + 1;
const sizeSet = {};
for (const p of products) for (const o of p.opt) sizeSet[o] = (sizeSet[o] || 0) + 1;

const flag = (k) => settings[k];
const snapshot = {
  _meta: {
    phase: "03G",
    capturedAt: "2026-09-29, entre ~17:24 y ~18:10 (Bogotá)",
    store: "radaelli-swimwear-dev.myshopify.com (Development Store, plan de desarrollo)",
    secretsPolicy: "Sin secretos, tokens, cookies, correos ni teléfonos de personas. Los identificadores numéricos de la cuenta se omiten.",
    method: {
      storefront: "GET de solo lectura desde una pestaña de la Dev Store (sesión de vista previa del theme Radaelli RC1.8): /products.json, /collections.json, cada PDP y colección, la Home, rutas y redirecciones.",
      admin: "Lectura visual (capturas de pantalla / texto) de Configuración, Contenido, Mercados y Apps con la sesión de la dueña. No se escribió nada.",
      cli: "shopify theme list (roles de los themes).",
    },
    limits: [
      "La ventana de Chrome está oculta: no se midieron LCP/FCP/CLS.",
      "Ajustes de pantalla de pago (settings/checkout) no se pudieron leer (el Admin no terminó de cargar en la ventana oculta): NOT_VERIFIED.",
      "Formas de pago manuales, impuestos, dominios y eventos del cliente (píxeles personalizados) no se abrieron en 03G: NOT_VERIFIED; el estado de pagos se deduce de la pantalla Pagos y del checkout medido.",
      "Total de archivos de Contenido > Archivos no enumerado; solo se vio la primera página (50) con imágenes de productos.",
    ],
  },
  themes: [
    { id: 189072113983, name: "Horizon", role: "live", touched: false, source: "shopify theme list 2026-09-29" },
    {
      id: 189072474431,
      name: "Radaelli RC1",
      role: "unpublished",
      release: manifest.release,
      zipSha256: manifest.zip.sha256,
      zipBytes: manifest.zip.bytes,
      files: manifest.totalFiles,
      remoteEqualsZip: "96/96 (pull + comparación, 2026-09-29)",
      themeCheck: "0 errores / 0 warnings (60 archivos)",
    },
  ],
  onlineStore: { passwordProtected: true, source: "adminObservations (Páginas: 'Solo los visitantes que tengan la contraseña pueden acceder a tu tienda online')" },
  locales: {
    adminDefaultLanguage: "Inglés (Predeterminado)",
    published: ["Inglés (predeterminado, 1 dominio)", "Español (publicado, 'Sin traducciones', 1 dominio)"],
    storefrontServes: { "/": "es", "/en": "en" },
    hreflang: ["x-default /", "es /", "en /en"],
    translateAndAdapt: "instalada (app de Shopify)",
    note: "El theme trae es.default.json (idioma principal) y en.json. Al crear la tienda comercial, el idioma predeterminado debe ser Español (B4).",
    source: "adminObservations (Configuración > Idiomas) + storefront",
  },
  currency: { displayed: "COP (Peso colombiano)", format: "$ {{amount_no_decimals_with_comma_separator}}", cartCurrencyObserved: "COP", source: "adminObservations (General) + cart.js" },
  markets: {
    list: [
      { name: "Colombia", status: "Activo", includes: "Colombia" },
      { name: "United States", status: "Activo", includes: "Estados Unidos" },
    ],
    storeDefaultMarket: "Estados Unidos (el mercado principal sigue siendo EE. UU.; bloqueo owner A1)",
    backupRegion: "Colombia",
    businessEntityCountry: "Estados Unidos",
    storeAddressCountry: "Estados Unidos",
    sessionCountryObserved: "US",
    checkoutLocaleObserved: "es-us",
    source: "adminObservations (Mercados, General) + checkout medido",
  },
  shipping: {
    profiles: "1 perfil general ('Predeterminado de la tienda'): todos los productos, 1 sucursal, 1 zona",
    zones: "solo la zona de Estados Unidos (03E/03F); NO existe zona de Colombia",
    localDelivery: "Desactivado",
    storePickup: "Desactivado",
    carrierAccounts: "Ninguno",
    rates: "tarifa por debajo de $299.900: NOT_SET (decisión D2 de la dueña); free_shipping_rate_confirmed=false",
    source: "adminObservations (Envío y entrega) + docs 03E/03F",
  },
  payments: {
    activeProviders: "ninguno",
    shopifyPayments: "no configurado ('Completar configuración')",
    additionalProviders: "ninguno agregado",
    wompi: "no instalado",
    devStoreBanner: "Las tiendas en desarrollo solo pueden procesar pagos de prueba",
    checkoutMeasured: "'Esta tienda no puede aceptar pagos en este momento.'",
    source: "adminObservations (Pagos) + checkout medido 2026-09-29",
  },
  customerAccounts: {
    type: "Cuentas de cliente nuevas (Shopify-hosted, dominio de cuentas de Shopify)",
    showLoginLinks: true,
    selfServeReturns: false,
    storeCredit: true,
    loginByCodeTest: "DEFERRED_OWNER_ONLY_BLOCKER (A2)",
    source: "adminObservations (Cuentas de cliente)",
  },
  catalog: {
    products: products.length,
    variants: products.reduce((a, p) => a + p.vr.length, 0),
    images: products.reduce((a, p) => a + p.im.length, 0),
    published: products.filter((p) => p.pub).length,
    productTypes: byType,
    optionNames: sizeSet,
    tags: Object.fromEntries(products.filter((p) => p.tg.length).map((p) => [p.h, p.tg])),
    pdpStatus200: products.filter((p) => p.pdp === 200).length,
    wishlistHeart: products.filter((p) => p.heart).length,
    colorRendered: products.filter((p) => p.color).length,
    inventoryTracking: "NO rastreado (shopify-post-import-audit.csv)",
    source: "storefront /products.json + PDP",
  },
  collections: collections.map((c) => ({ handle: c.h, title: c.t, products: c.n, bannerImage: c.bannerImg, ...(c.note ? { note: c.note } : {}) })),
  pages: [
    { title: "Política de garantía", handle: "garantia", visible: true, note: "contenido verbatim (verificado por hash en 03D)" },
    { title: "Favoritos", handle: "favoritos", visible: true, note: "noindex por handle (RC1.6); plantilla page.wishlist no asignada aún" },
    { title: "Your Privacy Choices", handle: "data-sharing-opt-out", visible: true, note: "página por defecto de Shopify en inglés (C5)" },
    { title: "Contact", handle: "contact", visible: true, note: "página por defecto de Shopify en inglés (C5)" },
  ],
  policiesObserved: {
    "/policies/refund-policy": "200 (verbatim, 03D)",
    "/policies/privacy-policy": "200 (política AUTOGENERADA por Shopify, no el texto del sitio actual)",
    "/policies/terms-of-service": "404",
    "/policies/shipping-policy": "404",
    "/policies/contact-information": "404",
  },
  menus: [
    { name: "Main menu", items: ["Inicio", "Oasis Natural", "Aurora Viva", "Espuma de Ola", "Salidas de Baño"], usedByTheme: true },
    { name: "Comprar", items: ["Oasis Natural", "Aurora Viva", "Espuma de Ola", "Salidas de Baño"], usedByTheme: true, note: "columna del footer" },
    { name: "Ayuda", items: ["Devoluciones", "Garantía"], usedByTheme: true, note: "columna del footer (RC1.5)" },
    { name: "Footer menu", items: ["Buscar", "Your Privacy Choices"], usedByTheme: false, note: "menú por defecto de Shopify, sin uso (C5)" },
    { name: "Customer account main menu", items: ["Orders", "Profile"], usedByTheme: false, note: "menú de cuentas nuevas (Shopify)" },
  ],
  redirects: { count: 47, source: "Contenido > Menús > Redireccionamientos de URL (1-47)", csv: "seo/shopify-redirects-import.csv", destinations200Verified: routes.redirects.destination_200_verified },
  apps: { installed: ["Translate & Adapt (Shopify)"], notInstalled: ["Search & Discovery (A3)", "Wompi (B1)", "App de favoritos Radaelli (A5)", "Google & YouTube / Facebook & Instagram (B3)"], oauthAccepted: "ninguno en 03G" },
  wishlistApp: { package: appManifestZip, version: "0.1.2", installed: false, themeFlag_wishlist_enabled: flag("wishlist_enabled"), themeFlag_wishlist_account_sync: flag("wishlist_account_sync"), appProxy: "/apps/wishlist -> 404 (no instalada)" },
  metafieldDefinitions: {
    product: [
      { name: "Color", type: "single_line_text_field", usedBy: "29 productos" },
      { name: "Guía de tallas", type: "metaobject_reference", usedBy: "0 productos" },
    ],
    collection: [
      { name: "Description tone", type: "single_line_text_field", usedBy: "4 colecciones" },
      { name: "Cover image", type: "file_reference", usedBy: "0 colecciones" },
      { name: "Cover video", type: "file_reference", usedBy: "0 colecciones" },
      { name: "Zoom", type: "number_decimal", usedBy: "0 colecciones" },
      { name: "Image pos x", type: "number_decimal", usedBy: "0 colecciones" },
      { name: "Image pos y", type: "number_decimal", usedBy: "0 colecciones" },
    ],
    source: "adminObservations (Configuración > Metacampos y metaobjetos)",
  },
  metaobjectDefinitions: [{ name: "Guía de tallas", type: "size_guide", entries: 0, note: "sin contenido fuente (NOT_AVAILABLE)" }],
  files: { observed: "solo imágenes de productos en la primera página (50); sin hero, banners, categorías ni guía de tallas subidos (A4 pendiente)" },
  searchAndFilters: {
    searchDiscoveryApp: "no instalada (A3)",
    nativeFilters: "Precio (y Disponibilidad oculta por collection_show_availability_filter=false)",
    sortOptions: 9,
    searchIndex: "29/29 (búsqueda 'bikini' = 20 resultados; 'mostaza' = 1)",
    predictiveSearchEnabled: flag("predictive_search_enabled"),
  },
  themeFlags: {
    free_shipping_rate_confirmed: flag("free_shipping_rate_confirmed"),
    cart_free_shipping_progress: flag("cart_free_shipping_progress"),
    free_shipping_threshold_COP: flag("free_shipping_threshold"),
    wishlist_enabled: flag("wishlist_enabled"),
    wishlist_account_sync: flag("wishlist_account_sync"),
    cart_drawer_enabled: flag("cart_drawer_enabled"),
    collection_enable_filters: flag("collection_enable_filters"),
    collection_show_availability_filter: flag("collection_show_availability_filter"),
    collection_default_columns: flag("collection_default_columns"),
    show_availability_badge: flag("show_availability_badge"),
    customPixel: "APAGADO (ENABLED:false, IDs vacíos; analytics/custom-pixel/)",
  },
};

fs.writeFileSync(path.join(MIG, "launch", "03G-dev-store-snapshot.json"), JSON.stringify(snapshot, null, 2) + "\n");
console.log("snapshot escrito:", snapshot.catalog.products, snapshot.catalog.variants, snapshot.catalog.images, snapshot.redirects.count);
