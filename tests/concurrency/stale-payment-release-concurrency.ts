// PRUEBA INTEGRADA contra Postgres real (Neon descartable) -- P0 (corrección
// de leak de inventario, sep. 2026), test C del pedido: "dos ejecuciones
// concurrentes intentan liberar: stock exactamente una vez". Un fake de
// Prisma en memoria (ver server-order-totals.abandoned-payment.test.ts) no
// puede demostrar esto -- la garantía real depende del lock de fila que
// solo un Postgres de verdad aplica quando dos transacciones intentan el
// MISMO UPDATE condicionado sobre la MISMA fila al mismo tiempo.
//
// Dispara DOS llamadas reales a cancelAbandonedPaymentAndReleaseStock sobre
// el MISMO Payment con Promise.all (máxima superposición posible desde un
// solo proceso Node) y confirma:
//   - exactamente una de las dos devuelve "cancelled", la otra "not-pending"
//     (el claim condicionado a status:"PENDING" solo puede ganarlo una)
//   - el stock reservado se suma EXACTAMENTE una vez, nunca dos
//
// Cómo correrlo (con CONFIRMED_DISPOSABLE_NEON_ENDPOINT apuntando al mismo
// host que DATABASE_URL, o DATABASE_URL en localhost):
//   DATABASE_URL="..." CONFIRMED_DISPOSABLE_NEON_ENDPOINT="..." \
//     npx tsx tests/concurrency/stale-payment-release-concurrency.ts
import assert from "node:assert/strict";

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL.");
}
const esLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
if (!esLocal) {
  const confirmado = process.env.CONFIRMED_DISPOSABLE_NEON_ENDPOINT;
  if (!confirmado || !process.env.DATABASE_URL.includes(confirmado)) {
    throw new Error(
      "DATABASE_URL remoto sin CONFIRMED_DISPOSABLE_NEON_ENDPOINT que lo confirme -- abortando.",
    );
  }
}

async function main() {
  const { prisma: appPrisma } = await import("lib/prisma");
  const { cancelAbandonedPaymentAndReleaseStock } = await import(
    "lib/checkout/server-order-totals"
  );

  console.log(
    "Sembrando datos ficticios (categoría, producto, variante con stock conocido)...",
  );
  const category = await appPrisma.category.upsert({
    where: { slug: "integracion-concurrencia-stale" },
    update: {},
    create: {
      slug: "integracion-concurrencia-stale",
      name: "Integración Concurrencia Stale",
    },
  });
  const product = await appPrisma.product.upsert({
    where: { slug: "producto-integracion-concurrencia-stale" },
    update: {},
    create: {
      slug: "producto-integracion-concurrencia-stale",
      name: "Producto Integración Concurrencia",
      categoryId: category.id,
      priceValue: 90000,
      color: "Blanco",
      description: "100% ficticio, solo para esta prueba.",
    },
  });
  await appPrisma.productVariant.upsert({
    where: { productId_size: { productId: product.id, size: "M" } },
    update: { stock: 5 },
    create: { productId: product.id, size: "M", stock: 5 },
  });

  const itemsSnapshot = [{ productId: product.id, size: "M", quantity: 2 }];
  const payment = await appPrisma.payment.upsert({
    where: { providerRef: "lago-integracion-concurrencia-stale" },
    update: {
      status: "PENDING",
      wompiTransactionId: null,
      stockReleased: false,
      failureReason: null,
    },
    create: {
      provider: "WOMPI",
      providerRef: "lago-integracion-concurrencia-stale",
      wompiTransactionId: null,
      amount: 90000 * 100,
      currency: "COP",
      status: "PENDING",
      reservedItems: itemsSnapshot,
    },
  });

  console.log(
    "\n== Disparando DOS llamadas concurrentes a cancelAbandonedPaymentAndReleaseStock sobre el MISMO Payment ==",
  );
  const [resultA, resultB] = await Promise.all([
    cancelAbandonedPaymentAndReleaseStock(
      payment.id,
      "Abandonado (llamada A, concurrente).",
    ),
    cancelAbandonedPaymentAndReleaseStock(
      payment.id,
      "Abandonado (llamada B, concurrente).",
    ),
  ]);
  console.log("Resultado A:", resultA, "| Resultado B:", resultB);

  const resultados = [resultA, resultB];
  assert.equal(
    resultados.filter((r) => r === "cancelled").length,
    1,
    "exactamente UNA de las dos llamadas concurrentes debe ganar el claim ('cancelled')",
  );
  assert.equal(
    resultados.filter((r) => r === "not-pending").length,
    1,
    "la otra debe perder la carrera ('not-pending'), nunca las dos ganar",
  );

  const freshPayment = await appPrisma.payment.findUnique({
    where: { id: payment.id },
  });
  assert.equal(freshPayment?.status, "CANCELLED");
  assert.equal(freshPayment?.stockReleased, true);

  const freshVariant = await appPrisma.productVariant.findUnique({
    where: { productId_size: { productId: product.id, size: "M" } },
  });
  assert.equal(
    freshVariant?.stock,
    7,
    "las 2 unidades reservadas deben sumarse EXACTAMENTE una vez (5 + 2 = 7), nunca 9 (dos veces)",
  );
  console.log(
    "✔ exactamente una liberación bajo dos ejecuciones concurrentes -- stock correcto, sin doble suma",
  );

  console.log(
    "\n✔ TODAS LAS ASERCIONES DE CONCURRENCIA PASARON (contra Postgres real)",
  );

  // Limpieza -- deja la base lista para volver a correr esta prueba.
  await appPrisma.payment.deleteMany({
    where: { providerRef: "lago-integracion-concurrencia-stale" },
  });
  await appPrisma.productVariant.deleteMany({
    where: { productId: product.id },
  });
  await appPrisma.product.delete({ where: { id: product.id } });
  await appPrisma.category.delete({ where: { id: category.id } });

  await appPrisma.$disconnect();
}

main().catch((error) => {
  console.error("\n✖ LA PRUEBA FALLÓ:", error);
  process.exit(1);
});
