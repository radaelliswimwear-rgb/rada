import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// PROPUESTA (rama propuesta/checkout-wompi-alojado) — tests de lógica PURA:
// no tocan Prisma, no tocan la red y no necesitan ninguna base de datos. Las
// "credenciales" de abajo son strings inventados a mano en este archivo,
// nunca las reales.
//
// Auditoría go-live (sep. 2026): wompi-gateway.ts importa
// assertWompiConfigConsistencyOrThrow (lib/payments/guard-real-payments.ts),
// que ahora importa lib/observability/log (transitivamente lib/prisma) en
// su nuevo throw path -- un `import` ESTÁTICO de wompi-gateway.ts en este
// archivo evaluaría esa cadena ANTES de que cualquier mock.module() de acá
// pudiera registrarse (los imports estáticos se hoistean por sobre
// cualquier código de nivel de módulo), así que el archivo pasó a usar
// `import()` dinámico DESPUÉS de los mocks, mismo patrón que
// guard-real-payments.test.ts.
//
// Cómo correrlos:
//   npx tsx --test lib/payments/wompi-hosted-checkout.no-card-data.test.ts

process.env.WOMPI_PUBLIC_KEY = "pub_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_PRIVATE_KEY = "prv_test_LLAVE_FALSA_DE_TEST";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_FALSO";
// Hardening P2/P3 (sep. 2026): getCredentials() ahora cruza esto contra el
// prefijo pub_test_/prv_test_ de arriba (ver assertWompiConfigConsistencyOrThrow,
// lib/payments/guard-real-payments.ts) -- sin esto, unas llaves de sandbox
// con el flag apagado se ven (correctamente) como una configuración
// inconsistente y el guard lanza.
process.env.NEXT_PUBLIC_WOMPI_SANDBOX = "true";

mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      systemLog: {
        create: async () => ({ id: "log_1" }),
        findFirst: async () => null,
        update: async () => ({}),
      },
    },
  },
});
mock.module("lib/email/send", {
  namedExports: {
    sendEmail: async () => ({ success: true }),
  },
});

const loadGateway = () => import("./providers/wompi-gateway");

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
test("la URL del Checkout Web alojado no lleva ningún dato de tarjeta", async () => {
  const {
    WOMPI_HOSTED_CHECKOUT_URL,
    buildWompiHostedCheckoutParams,
    buildWompiHostedCheckoutUrl,
  } = await loadGateway();
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

test("la URL apunta al Checkout Web oficial y conserva la referencia lago-", async () => {
  const { buildWompiHostedCheckoutUrl } = await loadGateway();
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
  assert.equal(url.searchParams.get("expiration-time"), INPUT.expirationTime);
});

// Regresión sobre la fórmula documentada por Wompi (Step 3, "Generate an
// integrity signature" en docs.wompi.co/en/docs/colombia/widget-checkout-web):
// SHA-256 de referencia + monto_en_centavos + moneda + secreto_de_integridad,
// PERO cuando se usa expiration-time (como acá, INPUT siempre lo trae) hay
// que insertarlo ANTES del secreto: referencia+monto+moneda+expiration+secreto.
// El valor esperado se calcula acá con node:crypto directo, no llamando a la
// misma función que se está probando.
test("signature:integrity coincide con buildIntegritySignature y con la fórmula de Wompi (con expiration-time)", async () => {
  const { buildIntegritySignature, buildWompiHostedCheckoutParams } =
    await loadGateway();
  const params = buildWompiHostedCheckoutParams(INPUT);

  const esperado = createHash("sha256")
    .update(
      `${INPUT.reference}${INPUT.amountInCents}${INPUT.currency}${INPUT.expirationTime}${process.env.WOMPI_INTEGRITY_SECRET}`,
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
      INPUT.expirationTime,
    ),
  );
  assert.match(params["signature:integrity"]!, /^[0-9a-f]{64}$/);
});

// Sin expiration-time, la firma vuelve a los 4 valores originales (ningún
// llamador actual omite expirationTime, pero la función lo sigue permitiendo).
test("signature:integrity sin expiration-time usa la fórmula de 4 valores", async () => {
  const { buildIntegritySignature } = await loadGateway();
  const sinExpiracion = {
    reference: INPUT.reference,
    amountInCents: INPUT.amountInCents,
    currency: INPUT.currency,
  };
  const esperado = createHash("sha256")
    .update(
      `${sinExpiracion.reference}${sinExpiracion.amountInCents}${sinExpiracion.currency}${process.env.WOMPI_INTEGRITY_SECRET}`,
    )
    .digest("hex");
  assert.equal(
    buildIntegritySignature(
      sinExpiracion.reference,
      sinExpiracion.amountInCents,
      sinExpiracion.currency,
      process.env.WOMPI_INTEGRITY_SECRET!,
    ),
    esperado,
  );
});

test("la firma cambia si cambia el monto (no se puede reusar para cobrar otra cosa)", async () => {
  const { buildWompiHostedCheckoutParams } = await loadGateway();
  const firma = buildWompiHostedCheckoutParams(INPUT)["signature:integrity"];
  const otra = buildWompiHostedCheckoutParams({
    ...INPUT,
    amountInCents: 100,
  })["signature:integrity"];
  assert.notEqual(firma, otra);
});

test("rechaza montos que no sean enteros de centavos mayores a cero", async () => {
  const { buildWompiHostedCheckoutParams } = await loadGateway();
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
test("toWompiAmountInCents convierte pesos a centavos en el borde del adaptador", async () => {
  const { toWompiAmountInCents } = await loadGateway();
  assert.equal(toWompiAmountInCents(159900), 15990000);
  assert.equal(toWompiAmountInCents(0.5), 50);
});
