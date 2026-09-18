import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
} from "./product-json-ld";

const BASE_INPUT = {
  name: "BIKINI FOAM",
  description: "Bikini de espuma reciclada.",
  images: ["https://res.cloudinary.com/x/bikini-foam.jpg"],
  color: "Natural",
  category: "Espuma de Ola",
  priceValue: 199900,
  slug: "bikini-foam",
  siteUrl: "https://radaelliswimwear.com",
};

// price COP
test("price/currency: siempre COP, price con 2 decimales", () => {
  const json = buildProductJsonLd({ ...BASE_INPUT, sku: "RAD-001", totalStock: 5 }) as any;
  assert.equal(json.offers.priceCurrency, "COP");
  assert.equal(json.offers.price, "199900.00");
});

// availability
test("availability: InStock cuando totalStock > 0", () => {
  const json = buildProductJsonLd({ ...BASE_INPUT, totalStock: 3 }) as any;
  assert.equal(json.offers.availability, "https://schema.org/InStock");
});

test("availability: OutOfStock cuando totalStock es 0", () => {
  const json = buildProductJsonLd({ ...BASE_INPUT, totalStock: 0 }) as any;
  assert.equal(json.offers.availability, "https://schema.org/OutOfStock");
});

test("availability: OutOfStock cuando totalStock es undefined (sin dato confiable)", () => {
  const json = buildProductJsonLd({ ...BASE_INPUT }) as any;
  assert.equal(json.offers.availability, "https://schema.org/OutOfStock");
});

// sku real, nunca inventado
test("sku: se incluye tal cual cuando el producto lo tiene", () => {
  const json = buildProductJsonLd({ ...BASE_INPUT, sku: "RAD-FOAM-001" }) as any;
  assert.equal(json.sku, "RAD-FOAM-001");
});

test("sku: se OMITE (no se inventa) cuando el producto no tiene uno", () => {
  const json = buildProductJsonLd({ ...BASE_INPUT, sku: null }) as any;
  assert.equal("sku" in json, false);
});

test("sku: se omite igual si es undefined", () => {
  const json = buildProductJsonLd({ ...BASE_INPUT }) as any;
  assert.equal("sku" in json, false);
});

// no fake review/rating
test("nunca incluye reviews/ratings/aggregateRating/gtin/mpn inventados", () => {
  const json = buildProductJsonLd({ ...BASE_INPUT, sku: "RAD-001", totalStock: 5 }) as any;
  for (const forbiddenKey of ["review", "aggregateRating", "gtin", "mpn"]) {
    assert.equal(forbiddenKey in json, false, forbiddenKey);
  }
});

// structured data Product -- forma general
test("estructura general: @type Product, offers @type Offer, campos reales presentes", () => {
  const json = buildProductJsonLd({ ...BASE_INPUT, sku: "RAD-001", totalStock: 5 }) as any;
  assert.equal(json["@context"], "https://schema.org");
  assert.equal(json["@type"], "Product");
  assert.equal(json.name, BASE_INPUT.name);
  assert.equal(json.description, BASE_INPUT.description);
  assert.deepEqual(json.image, BASE_INPUT.images);
  assert.equal(json.color, BASE_INPUT.color);
  assert.equal(json.category, BASE_INPUT.category);
  assert.equal(json.offers["@type"], "Offer");
  assert.equal(json.offers.url, `${BASE_INPUT.siteUrl}/producto/${BASE_INPUT.slug}`);
});

// BreadcrumbList
test("breadcrumb: 3 niveles reales Inicio -> Categoría -> Producto", () => {
  const json = buildProductBreadcrumbJsonLd({
    siteUrl: "https://radaelliswimwear.com",
    categoryLabel: "Espuma de Ola",
    categorySlug: "espuma-de-ola",
    productName: "BIKINI FOAM",
    productSlug: "bikini-foam",
  }) as any;
  assert.equal(json["@type"], "BreadcrumbList");
  assert.equal(json.itemListElement.length, 3);
  assert.equal(json.itemListElement[0].name, "Inicio");
  assert.equal(json.itemListElement[0].item, "https://radaelliswimwear.com");
  assert.equal(json.itemListElement[1].name, "Espuma de Ola");
  assert.equal(
    json.itemListElement[1].item,
    "https://radaelliswimwear.com/espuma-de-ola",
  );
  assert.equal(json.itemListElement[2].name, "BIKINI FOAM");
  assert.equal(
    json.itemListElement[2].item,
    "https://radaelliswimwear.com/producto/bikini-foam",
  );
});
