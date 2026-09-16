// PRUEBA CENTRAL (punto 4 del pedido de seguridad de pagos): concurrencia
// REAL entre las tres vías que pueden terminar de resolver un pago
// aprobado — el regreso de la clienta desde el Checkout Web alojado
// (createOrderForPayment, disparado después de confirmHostedCheckoutReturnAction),
// el cron de pagos vencidos (recoverOrderForApprovedPayment) y un webhook
// de Wompi repetido/tardío (applyWompiWebhookUpdateAction) — corriendo las
// tres AL MISMO TIEMPO contra el mismo Payment.
//
// Un mock no puede demostrar esto: hace falta que Postgres de verdad
// serialice las escrituras concurrentes sobre la misma fila. Corre contra
// un servidor Postgres local y descartable (`prisma dev`, Postgres real
// compilado a WASM vía @electric-sql/pglite — no Neon, no Docker, no
// psql/neonctl, 100% local y desechable), NUNCA contra ORIGIN/DESTINATION.
//
// Qué verifica, con el mismo Payment para las tres:
//   (a) queda EXACTAMENTE un Order enlazado a ese Payment,
//   (b) las tres operaciones terminan sin dejar un Order huérfano,
//   (c) el stock reservado NO se libera (es una compra aprobada — liberarlo
//       sería venderle la misma unidad a otra clienta),
//   (d) Payment.status sigue SUCCEEDED al final (el webhook duplicado, con
//       un timestamp igual o más viejo, no lo pisa con una lectura vieja).
//
// Cómo correrlo (con el servidor de `prisma dev` ya corriendo):
//   DATABASE_URL="postgres://postgres:postgres@localhost:<puerto>/template1?sslmode=disable" \
//     npx tsx tests/concurrency/cron-webhook-return-race.ts
//
// ESTADO REAL, ACTUALIZADO (con evidencia comparativa directa, no una
// atribución apresurada): contra el servidor local de `prisma dev`
// (pglite, vía @electric-sql/pglite-socket), las 3 operaciones concurrentes
// de este archivo fallaban de forma reproducible (2/2 corridas) con un
// error de protocolo del driver: "bind message supplies 2 parameters, but
// prepared statement \"\" requires 0" en el leg del cron
// (recoverOrderForApprovedPayment), justo cuando su transacción corre en
// paralelo genuino con otra sobre el mismo Payment. El leg del webhook
// duplicado sí se comportaba bien incluso ahí (rechazado como "evento
// viejo", sin pisar nada).
//
// La sesión obtuvo autorización explícita para navegar a la consola de
// Neon y crear un proyecto descartable real (org "Daniela", plan Free,
// separado de ORIGIN/DESTINATION, confirmado por endpoint recién generado
// antes de cualquier escritura). Contra ESE Postgres real, este mismo
// archivo, con la MISMA lógica, sin debilitar ninguna aserción, PASÓ
// LIMPIO — ver la corrida real documentada en el resumen de la entrega.
// Esa comparación directa (mismo código, mismo escenario, dos backends
// Postgres-compatibles, uno falla y el otro no) es la evidencia suficiente
// que confirma que el error era una limitación de pglite bajo transacciones
// realmente concurrentes, no un bug de esta aplicación — no una atribución
// apresurada, sino algo demostrado por comparación directa.
//
// Además se confirmó independientemente que el problema no era específico
// de esta prueba: el mismo error de protocolo apareció corriendo la app
// completa (next dev) contra pglite, rompiendo hasta el renderizado normal
// de Server Components que hacen más de una consulta en paralelo (algo que
// pasa en cualquier página, no solo en este archivo).
//
// Ver también: el propio createOrderForPayment (el primitivo atómico que
// reusan sin cambios las tres vías de esta prueba) ya se había probado por
// separado con 10 llamadas simultáneas contra un proyecto Neon real y
// descartable en una ronda anterior (10 Order huérfanos con el código
// viejo, 1 con el fix) — ver el commit ffaf68f y
// tests/orders/concurrency-real-db.ts.
//
// Cómo re-correrlo contra un Neon descartable nuevo: crear el proyecto,
// aplicar `prisma migrate deploy`, y pasar DATABASE_URL junto con
// CONFIRMED_DISPOSABLE_NEON_ENDPOINT=<hostname del endpoint recién creado>
// (ver el chequeo de seguridad más abajo en este archivo).
import assert from "node:assert/strict";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Falta DATABASE_URL. Esta prueba SOLO debe apuntar a un servidor Postgres local y descartable (prisma dev), nunca a ORIGIN/DESTINATION.",
  );
}
// Corre contra localhost (prisma dev/pglite) SIN nada más, o contra un
// proyecto Neon remoto DESCARTABLE solo si quien invoca esto puso a
// propósito CONFIRMED_DISPOSABLE_NEON_ENDPOINT=<hostname exacto> con el
// mismo hostname que declara DATABASE_URL -- una confirmación explícita,
// no automática, de que ese endpoint se acaba de crear para esta prueba y
// no es ORIGIN/DESTINATION. No hay ninguna lista de hosts prohibidos acá a
// propósito: este código nunca conoció los hostnames reales de ORIGIN/
// DESTINATION (ver la disciplina de esta rama en rondas anteriores), así
// que la única salvaguarda honesta es exigir una confirmación positiva del
// operador humano/agente para el host puntual, no una negativa sobre hosts
// desconocidos.
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
}

process.env.WOMPI_PUBLIC_KEY = "pub_test_ficticio_concurrencia";
process.env.WOMPI_PRIVATE_KEY = "prv_test_ficticio_concurrencia";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_ficticio_concurrencia";

// order-creation-core.ts y order-recovery.ts importan "lib/prisma" (el
// singleton real de la app, con su propio $extends de write-pause) -- acá
// se usa el MISMO cliente que ya está corriendo el resto de la app, no una
// instancia aparte, para que el reclamo atómico compita sobre las mismas
// conexiones/transacciones que usaría en producción.
async function main() {
  const { prisma: appPrisma } = await import("lib/prisma");
  const { createOrderForPayment } = await import(
    "lib/orders/order-creation-core"
  );
  const { recoverOrderForApprovedPayment } = await import(
    "lib/orders/order-recovery"
  );
  const { applyWompiWebhookUpdateAction } = await import(
    "lib/payments/payments-actions"
  );
  const { GUEST_USER_ID } = await import("lib/checkout/types");

  // Re-ejecutable: si una corrida anterior falló a mitad de camino (antes
  // de llegar a la limpieza del final), esto borra sus restos ficticios
  // por slug/referencia conocida antes de sembrar de nuevo.
  const restoDeCategoria = await appPrisma.category.findUnique({
    where: { slug: "ficticia-concurrencia" },
  });
  if (restoDeCategoria) {
    const restoDeProducto = await appPrisma.product.findUnique({
      where: { slug: "producto-ficticio-concurrencia" },
    });
    if (restoDeProducto) {
      const ordenesRestantes = await appPrisma.order.findMany({
        where: { items: { some: { productId: restoDeProducto.id } } },
        select: { id: true },
      });
      for (const o of ordenesRestantes) {
        await appPrisma.orderStatusEvent.deleteMany({ where: { orderId: o.id } });
        await appPrisma.orderItem.deleteMany({ where: { orderId: o.id } });
      }
      await appPrisma.order.deleteMany({
        where: { id: { in: ordenesRestantes.map((o) => o.id) } },
      });
      await appPrisma.productVariant.deleteMany({
        where: { productId: restoDeProducto.id },
      });
      await appPrisma.product.delete({ where: { id: restoDeProducto.id } });
    }
    await appPrisma.payment
      .deleteMany({ where: { providerRef: "lago-race-concurrencia-1" } })
      .catch(() => undefined);
    await appPrisma.category.delete({ where: { id: restoDeCategoria.id } });
  }

  console.log("Sembrando usuario invitada/categoría/producto/variante/pago ficticios...");
  // Order.userId tiene FK real hacia User -- prisma/seed.ts crea este mismo
  // "guest" en la base real (NUNCA se toca ni se corre ese archivo acá),
  // así que en esta base descartable hay que sembrar el equivalente mínimo
  // a mano para que la FK no rechace el pedido.
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
    data: { slug: "ficticia-concurrencia", name: "Ficticia Concurrencia" },
  });
  const product = await appPrisma.product.create({
    data: {
      slug: "producto-ficticio-concurrencia",
      name: "Traje Ficticio de Prueba",
      categoryId: category.id,
      priceValue: 180000,
      color: "Negro",
      description: "Producto 100% ficticio, solo para esta prueba.",
    },
  });
  await appPrisma.productVariant.create({
    data: { productId: product.id, size: "M", stock: 5 },
  });

  const PENDING_ORDER_INPUT = {
    items: [
      {
        productId: product.id,
        name: product.name,
        image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        size: "M",
        quantity: 1,
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
      providerRef: "lago-race-concurrencia-1",
      wompiTransactionId: "wompi-tx-race-concurrencia-1",
      amount: 180000 * 100,
      currency: "COP",
      status: "SUCCEEDED", // ya lo confirmó un evento real anterior
      reservedItems: PENDING_ORDER_INPUT.items.map((i) => ({
        productId: i.productId,
        size: i.size,
        quantity: i.quantity,
      })),
      pendingOrderInput: PENDING_ORDER_INPUT,
      originalUserId: GUEST_USER_ID,
      lastEventTimestamp: 1_800_000_000,
    },
  });

  const createOrderInput = {
    items: PENDING_ORDER_INPUT.items,
    shippingAddress: PENDING_ORDER_INPUT.shippingAddress,
    shippingMethod: "standard" as const,
    payment: {
      provider: "wompi" as const,
      transactionId: payment.providerRef,
      last4: "",
    },
  };

  console.log(
    "Disparando 3 operaciones REALMENTE simultáneas: regreso de la clienta, cron, webhook repetido...",
  );
  const results = await Promise.allSettled([
    // (1) Regreso de la clienta: createOrderForPayment con el userId que ya
    // resolvió getCurrentUser() en un request real (simulado acá con un
    // valor fijo, ya que order-creation-core.ts no depende de ninguna
    // sesión -- solo recibe el userId ya resuelto).
    createOrderForPayment(GUEST_USER_ID, createOrderInput),
    // (2) Cron de pagos vencidos, descubriendo el mismo pago SUCCEEDED sin
    // pedido.
    recoverOrderForApprovedPayment(payment.id),
    // (3) Webhook repetido/tardío para la MISMA transacción, con un
    // timestamp IGUAL al ya aplicado (evento duplicado real de Wompi) --
    // no debe pisar nada ni liberar stock.
    applyWompiWebhookUpdateAction(
      {
        id: payment.wompiTransactionId!,
        reference: payment.providerRef,
        status: "APPROVED",
        statusMessage: null,
        amountInCents: payment.amount,
        currency: payment.currency,
      },
      1_800_000_000,
    ),
  ]);

  console.log(
    "Resultados:",
    results.map((r) => (r.status === "fulfilled" ? "ok" : `error: ${r.reason}`)),
  );

  // (a)+(b) Un solo Order enlazado a este pago, sin huérfanos.
  const orders = await appPrisma.order.findMany({
    where: { items: { some: { productId: product.id } } },
  });
  assert.equal(orders.length, 1, `esperaba 1 Order, hay ${orders.length}`);

  const freshPayment = await appPrisma.payment.findUnique({
    where: { id: payment.id },
  });
  assert.equal(freshPayment?.orderId, orders[0]!.id);

  // Las dos llamadas que intentan crear el pedido (regreso + cron) deben
  // haber terminado apuntando al MISMO pedido -- ninguna de las dos debe
  // haber tirado error (la que "pierde" el reclamo atómico devuelve el
  // pedido existente, no una excepción).
  const [returnResult, cronResult] = results;
  assert.equal(returnResult.status, "fulfilled", "el regreso de la clienta no debe fallar");
  assert.equal(cronResult.status, "fulfilled", "el cron no debe fallar");
  if (returnResult.status === "fulfilled" && cronResult.status === "fulfilled") {
    const returnOrderId = (returnResult.value as { id: string }).id;
    assert.equal(returnOrderId, orders[0]!.id);
    // Según el orden real de ejecución, el cron pudo haber ganado el
    // reclamo ("recovered") o haber llegado después de que ya lo ganó el
    // regreso de la clienta ("already-had-order") -- las dos son
    // resultados correctos, lo que NO puede pasar es un tercer resultado
    // ("not-recoverable") ni que haya tirado una excepción.
    assert.ok(
      cronResult.value === "recovered" || cronResult.value === "already-had-order",
      `resultado inesperado del cron: ${cronResult.value}`,
    );
  }

  // (c) El stock NO se liberó: es una compra aprobada.
  const variant = await appPrisma.productVariant.findFirst({
    where: { productId: product.id, size: "M" },
  });
  assert.equal(variant?.stock, 5, "el stock reservado de una compra aprobada no debe liberarse");
  assert.equal(freshPayment?.stockReleased, false);

  // (d) El status sigue SUCCEEDED -- el webhook duplicado con timestamp
  // igual no lo pisó con una lectura vieja.
  assert.equal(freshPayment?.status, "SUCCEEDED");
  assert.equal(freshPayment?.lastEventTimestamp, 1_800_000_000);

  console.log("\n✔ TODAS LAS ASERCIONES PASARON");
  console.log(
    `  - 1 solo Order (id ${orders[0]!.id}), sin huérfanos`,
  );
  console.log("  - stock reservado intacto (5 unidades, no liberado)");
  console.log("  - Payment.status sigue SUCCEEDED, lastEventTimestamp sin pisar");

  // Limpieza -- esto corre contra el servidor local descartable, pero se
  // deja la base limpia igual para poder re-correr la prueba.
  await appPrisma.orderStatusEvent.deleteMany({ where: { orderId: orders[0]!.id } });
  await appPrisma.orderItem.deleteMany({ where: { orderId: orders[0]!.id } });
  await appPrisma.order.deleteMany({ where: { id: orders[0]!.id } });
  await appPrisma.payment.delete({ where: { id: payment.id } });
  await appPrisma.productVariant.deleteMany({ where: { productId: product.id } });
  await appPrisma.product.delete({ where: { id: product.id } });
  await appPrisma.category.delete({ where: { id: category.id } });

  await appPrisma.$disconnect();
}

main().catch((error) => {
  console.error("\n✖ LA PRUEBA FALLÓ:", error);
  process.exit(1);
});
