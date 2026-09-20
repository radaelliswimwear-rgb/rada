// Auditoría go-live (sep. 2026): createOrderForPayment (lib/orders/
// order-creation-core.ts) es el sumidero server-side de los tres caminos
// de pago (tarjeta, WhatsApp, regreso del checkout alojado de Wompi).
// Antes, la validación de la dirección de envío (lib/checkout/validation.ts)
// solo corría en el cliente -- createOrderAction, un Server Action público,
// nunca la volvía a exigir, así que era invocable directo con una
// dirección vacía o mal formada. Ver el archivo hermano (mismo `input`
// fixture, pero válido) en create-marketing-outbox.test.ts para el camino
// feliz -- este archivo cubre solo el rechazo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupOrdersActionMocks } from "./setup";
import { input, makePayment, product } from "./fixtures";

setupOrdersActionMocks({
  payment: makePayment(),
  products: [product],
});

const loadAction = async () =>
  (await import("lib/orders/orders-actions")).createOrderAction;

test("dirección de envío sin nombre -- createOrderAction rechaza, no crea el pedido", async () => {
  const createOrderAction = await loadAction();
  const invalidInput = {
    ...input,
    shippingAddress: { ...input.shippingAddress, fullName: "" },
  };
  await assert.rejects(
    () => createOrderAction(invalidInput),
    /dirección de envío no es válida/,
  );
});

test("dirección de envío con email mal formado -- createOrderAction rechaza", async () => {
  const createOrderAction = await loadAction();
  const invalidInput = {
    ...input,
    shippingAddress: { ...input.shippingAddress, email: "no-es-un-email" },
  };
  await assert.rejects(
    () => createOrderAction(invalidInput),
    /dirección de envío no es válida/,
  );
});

test("dirección de envío con teléfono inválido -- createOrderAction rechaza", async () => {
  const createOrderAction = await loadAction();
  const invalidInput = {
    ...input,
    shippingAddress: { ...input.shippingAddress, phone: "123" },
  };
  await assert.rejects(
    () => createOrderAction(invalidInput),
    /dirección de envío no es válida/,
  );
});
