import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePendingOrderInput } from "./pending-order";

// PROPUESTA (rama propuesta/checkout-wompi-alojado) — tests de lógica PURA:
// sin Prisma, sin red, sin ninguna base de datos.
//
// Cómo correrlos:
//   npx tsx --test lib/checkout/pending-order.test.ts

const VALIDO = {
  items: [
    {
      productId: "p1",
      name: "Bikini Aurora",
      image: "https://cdn.test/bikini.jpg",
      size: "M",
      quantity: 1,
      priceValue: 159900,
      sku: "RAD-001",
    },
  ],
  shippingAddress: {
    fullName: "Clienta de Prueba",
    email: "clienta@ejemplo.test",
    street: "Calle 1 # 2-3",
    neighborhood: "Centro",
    city: "Medellín",
    postalCode: "050001",
    province: "Antioquia",
    country: "Colombia",
    phone: "3001234567",
  },
  shippingMethod: "standard",
  saveAddress: true,
  subscribeNewsletter: false,
};

test("acepta un pedido pendiente completo y devuelve solo los campos conocidos", () => {
  const parsed = parsePendingOrderInput(VALIDO);
  assert.ok(parsed);
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.shippingMethod, "standard");
  assert.equal(parsed.saveAddress, true);
  assert.equal(parsed.subscribeNewsletter, false);
  assert.deepEqual(Object.keys(parsed).sort(), [
    "items",
    "saveAddress",
    "shippingAddress",
    "shippingMethod",
    "subscribeNewsletter",
  ]);
});

// El punto entero de mover el cobro al Checkout Web alojado es que los datos
// de tarjeta no existan de este lado. Esto persiste en la base de datos
// (Payment.pendingOrderInput), así que además de que el tipo no los declara,
// el parser los tira explícitamente: aunque un cliente manipulado los mande
// junto al resto, nunca llegan a guardarse.
test("descarta cualquier dato de tarjeta que venga colado en el objeto", () => {
  const parsed = parsePendingOrderInput({
    ...VALIDO,
    cardNumber: "4242424242424242",
    cvc: "123",
    expiry: "12/30",
    items: [
      {
        ...VALIDO.items[0],
        cardNumber: "4242424242424242",
        cvc: "123",
      },
    ],
    shippingAddress: {
      ...VALIDO.shippingAddress,
      cardNumber: "4242424242424242",
    },
  });

  assert.ok(parsed);
  const serializado = JSON.stringify(parsed);
  assert.ok(
    !/4242424242424242/.test(serializado),
    "ningún número de tarjeta puede sobrevivir al parseo",
  );
  assert.ok(!/card|cvc|cvv|expiry/i.test(serializado));
});

test("rechaza lo que no alcanza para armar un pedido", () => {
  assert.equal(parsePendingOrderInput(null), null);
  assert.equal(parsePendingOrderInput("no soy un objeto"), null);
  assert.equal(parsePendingOrderInput({ ...VALIDO, items: [] }), null);
  assert.equal(
    parsePendingOrderInput({ ...VALIDO, shippingMethod: "dron" }),
    null,
  );
  assert.equal(
    parsePendingOrderInput({
      ...VALIDO,
      shippingAddress: { ...VALIDO.shippingAddress, phone: "" },
    }),
    null,
    "sin teléfono no se puede coordinar la entrega",
  );
  assert.equal(
    parsePendingOrderInput({
      ...VALIDO,
      items: [{ ...VALIDO.items[0], quantity: 0 }],
    }),
    null,
  );
  assert.equal(
    parsePendingOrderInput({
      ...VALIDO,
      items: [{ ...VALIDO.items[0], quantity: 999 }],
    }),
    null,
  );
});
