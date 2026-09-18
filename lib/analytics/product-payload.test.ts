import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProductPayload } from "./product-payload";

// E. view_item payload correcto.
test("E: producto sin descuento -> payload mínimo, sin base_price/discount", () => {
  const payload = buildProductPayload({
    id: "prod_1",
    name: "BIKINI FOAM",
    category: "Espuma de Ola",
    size: "M",
    price: 199900,
    slug: "bikini-foam",
    sku: "RAD-001",
    color: "Natural",
  });
  assert.equal(payload.item_id, "prod_1");
  assert.equal(payload.item_name, "BIKINI FOAM");
  assert.equal(payload.item_category, "Espuma de Ola");
  assert.equal(payload.item_variant, "M");
  assert.equal(payload.price, 199900);
  assert.equal(payload.currency, "COP");
  assert.equal(payload.base_price, undefined);
  assert.equal(payload.discount, undefined);
  assert.equal(payload.discount_percent, undefined);
});

test("producto con descuento activo -> base_price/discount/discount_percent presentes", () => {
  const payload = buildProductPayload({
    id: "prod_2",
    name: "ENTERO GOLDEN HOUR",
    price: 183920,
    basePrice: 229900,
  });
  assert.equal(payload.base_price, 229900);
  assert.equal(payload.final_price, 183920);
  assert.equal(payload.discount, 229900 - 183920);
  assert.equal(payload.discount_percent, 20);
});

test("currency por defecto es COP si no se especifica", () => {
  const payload = buildProductPayload({ id: "p", name: "n", price: 1000 });
  assert.equal(payload.currency, "COP");
});

test("quantity/collection/sku ausentes quedan undefined, no null falso", () => {
  const payload = buildProductPayload({ id: "p", name: "n", price: 1000 });
  assert.equal(payload.quantity, undefined);
  assert.equal(payload.collection, undefined);
  assert.equal(payload.sku, null);
});
