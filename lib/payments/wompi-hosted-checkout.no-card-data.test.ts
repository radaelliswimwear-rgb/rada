import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  WOMPI_HOSTED_CHECKOUT_URL,
  buildIntegritySignature,
  buildWompiHostedCheckoutParams,
  buildWompiHostedCheckoutUrl,
  toWompiAmountInCents,
} from "./providers/wompi-gateway";

// PROPUESTA (rama propuesta/checkout-wompi-alojado) — tests de lógica PURA:
// no tocan Prisma, no tocan la red y no necesitan ninguna base de datos. Las
// "credenciales" de abajo son strings inventados a mano en este archivo,
// nunca las reales.
//
// Cómo correrlos:
//   npx tsx --test lib/payments/wompi-hosted-checkout.no-card-data.test.ts

process.env.WOMPI_PUBLIC_KEY = "pub_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_PRIVATE_KEY = "prv_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_FALSO";

const INPUT = {
  reference: "lago-0123456789abcdef01234567",
  amountInCents: 15990000,
  currency: "COP",
  redirectUrl: "https://tienda.test/checkout/wompi/retorno",
  customerEmail: "clienta@ejemplo.test",
  expirationTime: "2026-09-16T18:30:00.000Z",
};

// El motivo entero del cambio: que ni el número de tarjeta ni el CVV pasen
// nunca por esta aplicación. Con el checkout alojado, lo único que sale de
// acá es una URL firmada con monto, moneda y referencia.
test("la URL del Checkout Web alojado no lleva ningún dato de tarjeta", () => {
  const params = buildWompiHostedCheckoutParams(INPUT);
  const url = buildWompiHostedCheckoutUrl(INPUT);

  const prohibido =
    /(card|tarjeta|number|numero|cvc|cvv|pan|expiry|exp_month|exp_year|cardholder|holder)/i;
  for (const key of Object.keys(params)) {
    assert.ok(
      !prohibido.test(key),
      `el parámetro "${key}" parece un dato de tarjeta y no debería existir`,
    );
  }
  assert.ok(
    !prohibido.test(url.replace(WOMPI_HOSTED_CHECKOUT_URL, "")),
    "la URL generada no debe mencionar ningún campo de tarjeta",
  );

  // Ningún valor con forma de PAN (13-19 dígitos seguidos) ni de CVV suelto.
  for (const [key, value] of Object.entries(params)) {
    assert.ok(
      !/\b\d{13,19}\b/.test(value),
      `el parámetro "${key}" contiene algo con forma de número de tarjeta`,
    );
  }

  // Exactamente los parámetros esperados, nada más.
  assert.deepEqual(Object.keys(params).sort(), [
    "amount-in-cents",
    "currency",
    "customer-data:email",
    "expiration-time",
    "public-key",
    "redirect-url",
    "reference",
    "signature:integrity",
  ]);
});

test("la URL apunta al Checkout Web oficial y conserva la referencia lago-", () => {
  const url = new URL(buildWompiHostedCheckoutUrl(INPUT));
  assert.equal(url.origin + url.pathname, "https://checkout.wompi.co/p/");
  assert.equal(url.searchParams.get("reference"), INPUT.reference);
  assert.match(url.searchParams.get("reference")!, /^lago-[0-9a-f]{24}$/);
  assert.equal(url.searchParams.get("currency"), "COP");
  assert.equal(
    url.searchParams.get("amount-in-cents"),
    String(INPUT.amountInCents),
  );
  assert.equal(url.searchParams.get("redirect-url"), INPUT.redirectUrl);
  assert.equal(
    url.searchParams.get("customer-data:email"),
    INPUT.customerEmail,
  );
  assert.equal(
    url.searchParams.get("expiration-time"),
    INPUT.expirationTime,
  );
});

// Regresión sobre la fórmula documentada por Wompi: SHA-256 de
// referencia + monto_en_centavos + moneda + secreto_de_integridad. El valor
// esperado se calcula acá con node:crypto directo, no llamando a la misma
// función que se está probando.
test("signature:integrity coincide con buildIntegritySignature y con la fórmula de Wompi", () => {
  const params = buildWompiHostedCheckoutParams(INPUT);

  const esperado = createHash("sha256")
    .update(
      `${INPUT.reference}${INPUT.amountInCents}${INPUT.currency}${process.env.WOMPI_INTEGRITY_SECRET}`,
    )
    .digest("hex");

  assert.equal(params["signature:integrity"], esperado);
  assert.equal(
    params["signature:integrity"],
    buildIntegritySignature(
      INPUT.reference,
      INPUT.amountInCents,
      INPUT.currency,
      process.env.WOMPI_INTEGRITY_SECRET!,
    ),
  );
  assert.match(params["signature:integrity"]!, /^[0-9a-f]{64}$/);
});

test("la firma cambia si cambia el monto (no se puede reusar para cobrar otra cosa)", () => {
  const firma = buildWompiHostedCheckoutParams(INPUT)["signature:integrity"];
  const otra = buildWompiHostedCheckoutParams({
    ...INPUT,
    amountInCents: 100,
  })["signature:integrity"];
  assert.notEqual(firma, otra);
});

test("rechaza montos que no sean enteros de centavos mayores a cero", () => {
  assert.throws(() =>
    buildWompiHostedCheckoutParams({ ...INPUT, amountInCents: 0 }),
  );
  assert.throws(() =>
    buildWompiHostedCheckoutParams({ ...INPUT, amountInCents: -500 }),
  );
  assert.throws(() =>
    buildWompiHostedCheckoutParams({ ...INPUT, amountInCents: 1500.5 }),
  );
});

// El peso colombiano se guarda internamente en pesos enteros (ver
// lib/currency/subunits.ts); Wompi cobra en "centavos".
test("toWompiAmountInCents convierte pesos a centavos en el borde del adaptador", () => {
  assert.equal(toWompiAmountInCents(159900), 15990000);
  assert.equal(toWompiAmountInCents(0.5), 50);
});
