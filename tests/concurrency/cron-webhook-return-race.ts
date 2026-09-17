// PRUEBA CENTRAL (Sprint de hardening post-E2E real #1010/#1011, escenario
// E) — concurrencia REAL entre las dos vías que compiten con más frecuencia
// por resolver un mismo pago aprobado: el webhook de Wompi y el regreso de
// la clienta. Las dos convergen hoy en la MISMA función única
// (finalizeApprovedPayment, lib/orders/order-recovery.ts) — esta prueba la
// llama dos veces, genuinamente en paralelo (Promise.all sobre el MISMO
// paymentId, con source distinto), y verifica en Postgres real que el
// reclamo atómico de Payment.orderId (dentro de createOrderForPayment)
// sigue produciendo exactamente 1 Order, nunca dos, nunca un huérfano.
//
// Un mock no puede demostrar esto: hace falta que Postgres de verdad
// serialice las escrituras concurrentes sobre la misma fila. Corre contra
// un servidor Postgres local y descartable (`prisma dev`, Postgres real
// nativo -- no pglite/WASM en esta versión), NUNCA contra ORIGIN/DESTINATION.
//
// Corre N iteraciones INDEPENDIENTES (Payment/producto/referencia nuevos en
// cada una -- nunca se reusa un pago ya finalizado) para que una sola
// carrera "silenciosa" no oculte una race real. En cada iteración verifica:
//   (a) Orders relacionados con ese Payment === 1,
//   (b) Payment.orderId !== null y apunta exactamente a ese único Order,
//   (c) ningún Order huérfano (0 commiteados fuera del único ganador),
//   (d) stock final === stock inicial - cantidad comprada (nunca -2x),
//   (e) las dos llamadas terminan en una combinación válida
//       (created+existing, o existing+existing si ambas llegan después de
//       que la otra ya ganó) -- nunca created+created.
//
// Emails: NO se envía nada real. Este script no carga RESEND_API_KEY (no
// llama a dotenv en ningún momento), así que sendEmail (lib/email/send.ts)
// cae solo a su propio modo "sin proveedor configurado" y nunca hace un
// POST real a Resend -- sin necesidad de mockear la lógica transaccional
// de Order/inventario, que es justo lo que esta prueba necesita real.
//
// Cómo correrlo (con el servidor de `prisma dev` ya corriendo, DATABASE_URL
// pasada SOLO a este proceso, nunca escrita en .env.local):
//   DATABASE_URL="postgres://postgres:postgres@localhost:<puerto>/template1?sslmode=disable" \
//     npx tsx tests/concurrency/cron-webhook-return-race.ts [iteraciones]
import assert from "node:assert/strict";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Falta DATABASE_URL. Esta prueba SOLO debe apuntar a un servidor Postgres local y descartable (prisma dev), nunca a ORIGIN/DESTINATION.",
  );
}
// Corre contra localhost (prisma dev) SIN nada más, o contra un proyecto
// Neon remoto DESCARTABLE solo si quien invoca esto puso a propósito
// CONFIRMED_DISPOSABLE_NEON_ENDPOINT=<hostname exacto> con el mismo
// hostname que declara DATABASE_URL -- una confirmación explícita, no
// automática, de que ese endpoint se acaba de crear para esta prueba y no
// es ORIGIN/DESTINATION. No hay ninguna lista de hosts prohibidos acá a
// propósito: este código nunca conoció los hostnames reales de ORIGIN/
// DESTINATION, así que la única salvaguarda honesta es exigir una
// confirmación positiva del operador humano/agente para el host puntual,
// no una negativa sobre hosts desconocidos.
const esLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
if (!esLocal) {
  const confirmado = process.env.CONFIRMED_DISPOSABLE_NEON_ENDPOINT;
  if (!confirmado || !process.env.DATABASE_URL.includes(confirmado)) {
    throw new Error(
      "DATABASE_URL no es localhost y no hay CONFIRMED_DISPOSABLE_NEON_ENDPOINT que confirme que este host remoto es el proyecto Neon descartable recién creado -- abortando por seguridad.",
    );
  }
  console.log(
    `Corriendo contra Neon remoto DESCARTABLE, confirmado explícitamente: ${confirmado}`,
  );
} else {
  console.log("Corriendo contra Postgres local descartable (prisma dev).");
}

process.env.WOMPI_PUBLIC_KEY = "pub_test_ficticio_concurrencia";
process.env.WOMPI_PRIVATE_KEY = "prv_test_ficticio_concurrencia";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_ficticio_concurrencia";

const DEFAULT_ITERATIONS = 15;

type IterationResult = {
  index: number;
  ordersForPayment: number;
  orphanOrders: number;
  stockBeforeReservation: number;
  stockAfterReservation: number;
  stockAfterFinalize: number;
  quantity: number;
  paymentOrderId: string | null;
  webhookOutcome: string;
  returnOutcome: string;
  bothCreated: boolean;
  errors: string[];
};

async function main() {
  const iterations = Number(process.argv[2] ?? DEFAULT_ITERATIONS);
  const { prisma: appPrisma } = await import("lib/prisma");
  const { finalizeApprovedPayment } = await import("lib/orders/order-recovery");
  const { GUEST_USER_ID } = await import("lib/checkout/types");
  // Estado PRE-carrera fiel a la arquitectura real: el stock se descuenta
  // UNA vez al reservar el carrito (reserveAndPriceCheckout, llamado hoy
  // desde createVerifiedPaymentIntentAction ANTES de que el pago exista
  // siquiera) -- nunca dentro de finalizeApprovedPayment/
  // createOrderForPayment. Se reusa la función real (no se inventa un
  // decremento manual) para que "stock después de la reserva" sea
  // exactamente lo que produciría un checkout real.
  const { reserveAndPriceCheckout } = await import(
    "lib/checkout/server-order-totals"
  );

  console.log(
    `Sembrando usuario invitada (compartida entre las ${iterations} iteraciones)...`,
  );
  await appPrisma.user.upsert({
    where: { id: GUEST_USER_ID },
    update: {},
    create: {
      id: GUEST_USER_ID,
      name: "Invitada",
      email: "guest-ficticio-concurrencia@ejemplo.test",
    },
  });

  const category = await appPrisma.category.create({
    data: {
      slug: `ficticia-concurrencia-${Date.now()}`,
      name: "Ficticia Concurrencia",
    },
  });

  const results: IterationResult[] = [];
  const createdProductIds: string[] = [];
  const createdPaymentIds: string[] = [];
  const createdOrderIds: string[] = [];

  for (let i = 0; i < iterations; i++) {
    const QUANTITY = 1;
    const STOCK_INICIAL = 5;

    const product = await appPrisma.product.create({
      data: {
        slug: `producto-ficticio-concurrencia-${Date.now()}-${i}`,
        name: `Traje Ficticio de Prueba #${i}`,
        categoryId: category.id,
        priceValue: 180000,
        color: "Negro",
        description: "Producto 100% ficticio, solo para esta prueba.",
        active: true,
      },
    });
    createdProductIds.push(product.id);
    await appPrisma.productVariant.create({
      data: { productId: product.id, size: "M", stock: STOCK_INICIAL },
    });

    const checkoutItems = [
      { productId: product.id, size: "M", quantity: QUANTITY },
    ];

    // Reserva REAL (mismo camino que createVerifiedPaymentIntentAction):
    // decrementa ProductVariant.stock exactamente una vez, ANTES de que el
    // Payment exista. `stockDespuesDeReserva` es el valor que la carrera de
    // abajo NUNCA debe volver a mover.
    const totals = await reserveAndPriceCheckout(checkoutItems, null);
    const stockDespuesDeReserva = (
      await appPrisma.productVariant.findFirst({
        where: { productId: product.id, size: "M" },
      })
    )?.stock;
    assert.equal(
      stockDespuesDeReserva,
      STOCK_INICIAL - QUANTITY,
      "la reserva real debe descontar exactamente la cantidad comprada",
    );

    const PENDING_ORDER_INPUT = {
      items: [
        {
          productId: product.id,
          name: product.name,
          image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          size: "M",
          quantity: QUANTITY,
          priceValue: 180000,
        },
      ],
      shippingAddress: {
        fullName: "Clienta Ficticia Concurrencia",
        email: "concurrencia@ejemplo.test",
        street: "Calle Falsa 123",
        neighborhood: "Barrio",
        postalCode: "",
        city: "Bogotá",
        province: "Cundinamarca",
        country: "Colombia",
        phone: "+573000000000",
      },
      shippingMethod: "standard",
      saveAddress: false,
      subscribeNewsletter: false,
    };

    const payment = await appPrisma.payment.create({
      data: {
        provider: "WOMPI",
        providerRef: `lago-race-concurrencia-${Date.now()}-${i}`,
        wompiTransactionId: `wompi-tx-race-concurrencia-${Date.now()}-${i}`,
        amount: totals.total * 100,
        currency: "COP",
        status: "SUCCEEDED", // ya lo confirmó un evento real anterior
        orderId: null,
        reservedItems: totals.reservedItems,
        pendingOrderInput: PENDING_ORDER_INPUT,
        originalUserId: GUEST_USER_ID,
        lastEventTimestamp: 1_800_000_000 + i,
      },
    });
    createdPaymentIds.push(payment.id);

    // Confirmación PRE-carrera del estado inicial, tal como lo pide la
    // auditoría: SUCCEEDED, orderId null, stock ya reservado (conocido).
    assert.equal(payment.status, "SUCCEEDED");
    assert.equal(payment.orderId, null);

    // Las dos llamadas GENUINAMENTE simultáneas: webhook y regreso de la
    // clienta, ambas a través de finalizeApprovedPayment -- la misma
    // función que usa la app real, sin atajos.
    const [webhookResult, returnResult] = await Promise.allSettled([
      finalizeApprovedPayment(payment.id, "webhook"),
      finalizeApprovedPayment(payment.id, "return"),
    ]);

    const errors: string[] = [];
    if (webhookResult.status === "rejected") {
      errors.push(`webhook rechazado: ${webhookResult.reason}`);
    }
    if (returnResult.status === "rejected") {
      errors.push(`return rechazado: ${returnResult.reason}`);
    }

    const orders = await appPrisma.order.findMany({
      where: { items: { some: { productId: product.id } } },
    });
    for (const o of orders) createdOrderIds.push(o.id);

    const freshPayment = await appPrisma.payment.findUnique({
      where: { id: payment.id },
    });
    const variant = await appPrisma.productVariant.findFirst({
      where: { productId: product.id, size: "M" },
    });

    const webhookOutcome =
      webhookResult.status === "fulfilled" ? webhookResult.value : "ERROR";
    const returnOutcome =
      returnResult.status === "fulfilled" ? returnResult.value : "ERROR";

    // Orders "huérfanos": cualquiera de los Orders encontrados para este
    // producto que NO sea el que Payment.orderId señala como el ganador.
    const orphanOrders = orders.filter(
      (o) => o.id !== freshPayment?.orderId,
    ).length;

    results.push({
      index: i,
      ordersForPayment: orders.length,
      orphanOrders,
      stockBeforeReservation: STOCK_INICIAL,
      stockAfterReservation: stockDespuesDeReserva ?? -1,
      stockAfterFinalize: variant?.stock ?? -1,
      quantity: QUANTITY,
      paymentOrderId: freshPayment?.orderId ?? null,
      webhookOutcome: String(webhookOutcome),
      returnOutcome: String(returnOutcome),
      bothCreated: webhookOutcome === "created" && returnOutcome === "created",
      errors,
    });

    const marker = errors.length > 0 || orders.length !== 1 ? "✖" : "✔";
    console.log(
      `${marker} iteración ${i}: orders=${orders.length} orphan=${orphanOrders} stock=${STOCK_INICIAL}->${stockDespuesDeReserva}->${variant?.stock} webhook=${webhookOutcome} return=${returnOutcome}`,
    );
  }

  // --- Verificación agregada de las 5 invariantes, sobre TODAS las
  // iteraciones, antes de imprimir el veredicto final. ---
  const fallos: string[] = [];
  for (const r of results) {
    if (r.errors.length > 0) {
      fallos.push(
        `iteración ${r.index}: excepción inesperada -- ${r.errors.join("; ")}`,
      );
      continue;
    }
    if (r.ordersForPayment !== 1) {
      fallos.push(
        `iteración ${r.index}: esperaba 1 Order, hubo ${r.ordersForPayment}`,
      );
    }
    if (r.paymentOrderId === null) {
      fallos.push(`iteración ${r.index}: Payment.orderId sigue null`);
    }
    if (r.orphanOrders !== 0) {
      fallos.push(
        `iteración ${r.index}: ${r.orphanOrders} Order(es) huérfano(s)`,
      );
    }
    // Invariante real (E del pedido): el stock después de la finalización
    // concurrente debe ser EXACTAMENTE el que quedó tras la reserva -- ni
    // un descuento adicional (webhook y return NUNCA tocan stock) ni una
    // reversión indebida.
    if (r.stockAfterFinalize !== r.stockAfterReservation) {
      const dobleDescuento = r.stockBeforeReservation - r.quantity * 2;
      fallos.push(
        `iteración ${r.index}: stock tras finalize ${r.stockAfterFinalize}, esperaba ${r.stockAfterReservation} (stock tras reserva)` +
          (r.stockAfterFinalize === dobleDescuento
            ? " -- esto ES un doble descuento real"
            : ""),
      );
    }
    if (r.bothCreated) {
      fallos.push(
        `iteración ${r.index}: AMBAS llamadas devolvieron "created" -- doble fulfillment real`,
      );
    }
    const combinacionValida =
      (r.webhookOutcome === "created" || r.webhookOutcome === "existing") &&
      (r.returnOutcome === "created" || r.returnOutcome === "existing") &&
      !r.bothCreated;
    if (!combinacionValida) {
      fallos.push(
        `iteración ${r.index}: combinación de resultados inesperada (webhook=${r.webhookOutcome}, return=${r.returnOutcome})`,
      );
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `RESULTADO: ${results.length - fallos.length}/${results.length} verificaciones de iteración sin fallos (${fallos.length} fallo(s) listados abajo, puede haber más de uno por iteración)`,
  );
  if (fallos.length > 0) {
    console.log("\nFALLOS ENCONTRADOS:");
    for (const f of fallos) console.log(`  - ${f}`);
  }

  // Limpieza -- se hace SIEMPRE, haya pasado o fallado la prueba, para no
  // dejar residuos en el Postgres descartable.
  console.log("\nLimpiando datos de la prueba...");
  for (const orderId of createdOrderIds) {
    await appPrisma.orderStatusEvent.deleteMany({ where: { orderId } });
    await appPrisma.orderItem.deleteMany({ where: { orderId } });
  }
  await appPrisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  await appPrisma.payment.deleteMany({
    where: { id: { in: createdPaymentIds } },
  });
  await appPrisma.productVariant.deleteMany({
    where: { productId: { in: createdProductIds } },
  });
  await appPrisma.product.deleteMany({
    where: { id: { in: createdProductIds } },
  });
  await appPrisma.category.delete({ where: { id: category.id } });

  await appPrisma.$disconnect();

  if (fallos.length > 0) {
    console.error(
      `\n✖ LA PRUEBA FALLÓ: ${fallos.length} problema(s) encontrados.`,
    );
    process.exit(1);
  }
  console.log(
    `\n✔ TODAS LAS INVARIANTES SE CUMPLIERON en ${results.length} carreras independientes.`,
  );
}

main().catch((error) => {
  console.error("\n✖ LA PRUEBA FALLÓ (error no controlado):", error);
  process.exit(1);
});
