// PRUEBA INTEGRADA contra Postgres real (Neon descartable): corre el
// handler GET real de app/api/cron/release-stale-payments/route.ts --no
// solo las funciones internas-- contra tres escenarios que las pruebas
// mockeadas no pueden demostrar del todo:
//   (A) recuperación de compra REGISTRADA (no invitada): el pedido
//       recuperado debe quedar con el userId real de la cuenta que pagó,
//       no con la cuenta invitada.
//   (B) recuperación después de un fallo real al crear el pedido: un pago
//       aprobado sin pendingOrderInput recuperable no se cancela ni se
//       inventa nada en la primera corrida; corregido el dato, una SEGUNDA
//       corrida del mismo cron sí lo recupera -- confirma que es
//       reintentable entre corridas, no un solo intento perdido para
//       siempre.
//   (C) pago sin wompiTransactionId conocido: se marca para revisión
//       manual (flaggedForReviewAt), nunca se cancela ni libera stock.
//
// Cómo correrlo (con CONFIRMED_DISPOSABLE_NEON_ENDPOINT apuntando al mismo
// host que DATABASE_URL, o DATABASE_URL en localhost):
//   DATABASE_URL="..." CONFIRMED_DISPOSABLE_NEON_ENDPOINT="..." CRON_SECRET="..." \
//     npx tsx tests/concurrency/cron-route-real-db-integration.ts
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";

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
if (!process.env.CRON_SECRET) {
  process.env.CRON_SECRET = "test_cron_secret_ficticio_integracion";
}
process.env.WOMPI_PUBLIC_KEY ??= "pub_test_ficticio_integracion";
process.env.WOMPI_PRIVATE_KEY ??= "prv_test_ficticio_integracion";
process.env.WOMPI_INTEGRITY_SECRET ??= "test_integrity_ficticio_integracion";

async function main() {
  const { prisma: appPrisma } = await import("lib/prisma");
  const { GUEST_USER_ID } = await import("lib/checkout/types");

  function fakeRequest() {
    return {
      headers: { get: () => `Bearer ${process.env.CRON_SECRET}` },
    } as unknown as Parameters<
      Awaited<typeof import("../../app/api/cron/release-stale-payments/route")>["GET"]
    >[0];
  }

  console.log("Sembrando datos ficticios (usuario registrado + invitada, categoría, producto)...");
  await appPrisma.user.upsert({
    where: { id: GUEST_USER_ID },
    update: {},
    create: { id: GUEST_USER_ID, name: "Invitada", email: "guest-integracion@ejemplo.test" },
  });
  const registeredUser = await appPrisma.user.upsert({
    where: { email: "clienta-registrada-integracion@ejemplo.test" },
    update: {},
    create: {
      name: "Clienta Registrada Ficticia",
      email: "clienta-registrada-integracion@ejemplo.test",
    },
  });

  const category = await appPrisma.category.upsert({
    where: { slug: "integracion-cron-real" },
    update: {},
    create: { slug: "integracion-cron-real", name: "Integración Cron Real" },
  });
  const product = await appPrisma.product.upsert({
    where: { slug: "producto-integracion-cron-real" },
    update: {},
    create: {
      slug: "producto-integracion-cron-real",
      name: "Producto Integración Cron",
      categoryId: category.id,
      priceValue: 90000,
      color: "Blanco",
      description: "100% ficticio, solo para esta prueba.",
    },
  });
  await appPrisma.productVariant.upsert({
    where: { productId_size: { productId: product.id, size: "S" } },
    update: { stock: 8 },
    create: { productId: product.id, size: "S", stock: 8 },
  });

  const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 60 min atrás, vencido para el cron (umbral 30 min)

  const itemsSnapshot = [{ productId: product.id, size: "S", quantity: 1 }];
  const PENDING_ORDER_INPUT_VALIDO = {
    items: [
      {
        productId: product.id,
        name: product.name,
        image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        size: "S",
        quantity: 1,
        priceValue: 90000,
      },
    ],
    shippingAddress: {
      fullName: "Clienta Registrada Ficticia",
      email: "clienta-registrada-integracion@ejemplo.test",
      street: "Avenida Falsa 456",
      neighborhood: "Barrio Norte",
      postalCode: "",
      city: "Medellín",
      province: "Antioquia",
      country: "Colombia",
      phone: "+573000000001",
    },
    shippingMethod: "standard",
    saveAddress: false,
    subscribeNewsletter: false,
  };

  // (A) Compra REGISTRADA, aprobada, sin pedido -> el cron debe recuperarla
  // asignándola al userId REAL, no a la invitada.
  const paymentRegistrada = await appPrisma.payment.upsert({
    where: { providerRef: "lago-integracion-registrada" },
    update: {
      status: "SUCCEEDED",
      orderId: null,
      pendingOrderInput: PENDING_ORDER_INPUT_VALIDO,
      originalUserId: registeredUser.id,
      reservedItems: itemsSnapshot,
      createdAt: pastDate,
    },
    create: {
      provider: "WOMPI",
      providerRef: "lago-integracion-registrada",
      wompiTransactionId: "wompi-tx-integracion-registrada",
      amount: 90000 * 100,
      currency: "COP",
      status: "SUCCEEDED",
      reservedItems: itemsSnapshot,
      pendingOrderInput: PENDING_ORDER_INPUT_VALIDO,
      originalUserId: registeredUser.id,
      createdAt: pastDate,
    },
  });

  // (B) Aprobado, SIN pendingOrderInput recuperable (falla real de creación
  // simulada) -> primera corrida no debe recuperar ni cancelar.
  const paymentSinSnapshot = await appPrisma.payment.upsert({
    where: { providerRef: "lago-integracion-sin-snapshot" },
    update: {
      status: "SUCCEEDED",
      orderId: null,
      pendingOrderInput: Prisma.JsonNull,
      reservedItems: itemsSnapshot,
      createdAt: pastDate,
    },
    create: {
      provider: "WOMPI",
      providerRef: "lago-integracion-sin-snapshot",
      wompiTransactionId: "wompi-tx-integracion-sin-snapshot",
      amount: 90000 * 100,
      currency: "COP",
      status: "SUCCEEDED",
      reservedItems: itemsSnapshot,
      pendingOrderInput: Prisma.JsonNull, // "falla" simulada: nunca se guardó el snapshot
      originalUserId: GUEST_USER_ID,
      createdAt: pastDate,
    },
  });

  // (C) PENDING, sin wompiTransactionId conocido -> debe marcarse para
  // revisión, nunca cancelarse.
  const paymentSinId = await appPrisma.payment.upsert({
    where: { providerRef: "lago-integracion-sin-id" },
    update: {
      status: "PENDING",
      wompiTransactionId: null,
      stockReleased: false,
      flaggedForReviewAt: null,
      createdAt: pastDate,
    },
    create: {
      provider: "WOMPI",
      providerRef: "lago-integracion-sin-id",
      wompiTransactionId: null,
      amount: 90000 * 100,
      currency: "COP",
      status: "PENDING",
      reservedItems: itemsSnapshot,
      originalUserId: GUEST_USER_ID,
      createdAt: pastDate,
    },
  });

  console.log("\n== Primera corrida del cron (route.ts GET real) ==");
  const { GET } = await import("../../app/api/cron/release-stale-payments/route");
  const response1 = await GET(fakeRequest());
  const body1 = await response1.json();
  console.log("Resumen:", body1);

  // --- (A) verificación: pedido recuperado con el userId REAL ---
  const freshRegistrada = await appPrisma.payment.findUnique({
    where: { id: paymentRegistrada.id },
  });
  assert.ok(freshRegistrada?.orderId, "(A) el pago registrado debería tener pedido tras la primera corrida");
  const orderRegistrada = await appPrisma.order.findUnique({
    where: { id: freshRegistrada!.orderId! },
  });
  assert.equal(
    orderRegistrada?.userId,
    registeredUser.id,
    "(A) el pedido recuperado debe quedar asignado al userId REAL de la cuenta registrada, no a la invitada",
  );
  console.log("✔ (A) compra registrada recuperada con el userId real:", registeredUser.id);

  // --- (B) verificación: primera corrida NO recupera (sin snapshot), no cancela ---
  const freshSinSnapshot1 = await appPrisma.payment.findUnique({
    where: { id: paymentSinSnapshot.id },
  });
  assert.equal(freshSinSnapshot1?.orderId, null, "(B) no debería haber pedido todavía");
  assert.equal(freshSinSnapshot1?.status, "SUCCEEDED", "(B) el pago sigue aprobado, no se cancela");
  assert.equal(freshSinSnapshot1?.stockReleased, false, "(B) el stock no se libera de un pago aprobado");
  console.log("✔ (B1) sin snapshot recuperable: no se recuperó, no se canceló, no se liberó stock");

  // --- (C) verificación: se marcó para revisión, no se canceló ---
  const freshSinId1 = await appPrisma.payment.findUnique({
    where: { id: paymentSinId.id },
  });
  assert.ok(freshSinId1?.flaggedForReviewAt, "(C) debería estar marcado para revisión manual");
  assert.equal(freshSinId1?.status, "PENDING", "(C) no debe cancelarse");
  assert.equal(freshSinId1?.stockReleased, false, "(C) no debe liberar stock");
  console.log("✔ (C) pago sin identificador: marcado para revisión, sin cancelar ni liberar stock");

  // --- (B2) "arreglamos" el dato faltante y corremos el cron una SEGUNDA vez ---
  console.log("\n== Arreglando el snapshot faltante y corriendo el cron una SEGUNDA vez ==");
  await appPrisma.payment.update({
    where: { id: paymentSinSnapshot.id },
    data: { pendingOrderInput: PENDING_ORDER_INPUT_VALIDO },
  });
  const response2 = await GET(fakeRequest());
  const body2 = await response2.json();
  console.log("Resumen (segunda corrida):", body2);

  const freshSinSnapshot2 = await appPrisma.payment.findUnique({
    where: { id: paymentSinSnapshot.id },
  });
  assert.ok(
    freshSinSnapshot2?.orderId,
    "(B2) con el snapshot ya corregido, la segunda corrida SÍ debe recuperar el pedido",
  );
  console.log("✔ (B2) recuperación reintentada con éxito en una corrida posterior, tras corregir el dato");

  console.log("\n✔ TODAS LAS ASERCIONES DE INTEGRACIÓN PASARON (contra Postgres real)");

  // Limpieza -- deja la base lista para volver a correr esta prueba.
  for (const p of [paymentRegistrada, paymentSinSnapshot, paymentSinId]) {
    const fresh = await appPrisma.payment.findUnique({ where: { id: p.id } });
    if (fresh?.orderId) {
      await appPrisma.orderStatusEvent.deleteMany({ where: { orderId: fresh.orderId } });
      await appPrisma.orderItem.deleteMany({ where: { orderId: fresh.orderId } });
      await appPrisma.order.deleteMany({ where: { id: fresh.orderId } });
    }
  }
  await appPrisma.payment.deleteMany({
    where: {
      providerRef: {
        in: [
          "lago-integracion-registrada",
          "lago-integracion-sin-snapshot",
          "lago-integracion-sin-id",
        ],
      },
    },
  });
  await appPrisma.productVariant.deleteMany({ where: { productId: product.id } });
  await appPrisma.product.delete({ where: { id: product.id } });
  await appPrisma.category.delete({ where: { id: category.id } });
  await appPrisma.user.delete({ where: { id: registeredUser.id } });

  await appPrisma.$disconnect();
}

main().catch((error) => {
  console.error("\n✖ LA PRUEBA FALLÓ:", error);
  process.exit(1);
});
