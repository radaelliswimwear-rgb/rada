import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (mejora arquitectónica post-E2E real con webhook) —
// finalizeApprovedPayment (lib/orders/order-recovery.ts) es ahora el único
// punto de entrada que usan webhook/return/cron para "terminar" un pago.
// Este archivo prueba SOLO su contrato de gateo (qué hace según el estado
// del Payment), no el reclamo atómico real (eso sigue viviendo, sin
// cambios, en createOrderForPayment — ver tests/orders/*) ni la
// recuperación en sí (recoverOrderForApprovedPayment ya tiene su propia
// prueba en order-recovery.identity.test.ts). Por eso createOrderForPayment
// se mockea acá: lo que importa es CUÁNDO finalizeApprovedPayment decide
// intentar crear el pedido, no cómo lo crea.
//
// P0 (corrección de leak de inventario, sep. 2026): finalizeApprovedPayment
// ahora SIEMPRE llama primero a reclaimReleasedStockForLateApproval (lib/
// checkout/server-order-totals.ts, con sus propias pruebas dedicadas en
// server-order-totals.abandoned-payment.test.ts) antes de intentar crear
// ningún pedido -- acá también se mockea, por el mismo motivo: lo que
// importa es que finalizeApprovedPayment reaccione bien a "held"/
// "reclaimed" (camino normal) vs. "unavailable"/"unknown-items" (nunca
// crear el pedido, marcar para revisión), no la mecánica atómica del
// reclamo en sí.
//
// Cómo correrlo (mock.module todavía es experimental en Node):
//   node --experimental-test-module-mocks --import tsx --test lib/orders/finalize-approved-payment.test.ts

const PENDING_ORDER_INPUT = {
  items: [
    {
      productId: "prod_1",
      name: "Traje ficticio",
      image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      size: "M",
      quantity: 1,
      priceValue: 180000,
    },
  ],
  shippingAddress: {
    fullName: "Clienta Ficticia",
    email: "clienta@ejemplo.test",
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

const PAGOS: Record<string, Record<string, unknown> | undefined> = {
  pay_succeeded_sin_order: {
    id: "pay_succeeded_sin_order",
    orderId: null,
    status: "SUCCEEDED",
    providerRef: "lago-succeeded-sin-order",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: null,
  },
  pay_con_order: {
    id: "pay_con_order",
    orderId: "order-existente-1",
    status: "SUCCEEDED",
    providerRef: "lago-con-order",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: null,
  },
  pay_pending: {
    id: "pay_pending",
    orderId: null,
    status: "PENDING",
    providerRef: "lago-pending",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: null,
  },
  pay_declined: {
    id: "pay_declined",
    orderId: null,
    status: "FAILED",
    providerRef: "lago-declined",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: null,
  },
};

const createCalls: { userId: string; input: unknown }[] = [];
const updateCalls: { where: unknown; data: unknown }[] = [];
const reclaimCalls: string[] = [];

// Por defecto (no listado acá) toda entrada de PAGOS reclama "held" -- el
// camino normal, sin liberar nunca su stock. Los tests de stock-unavailable
// de abajo sobreescriben la entrada puntual que necesitan.
const RECLAIM_RESULTS: Record<
  string,
  "held" | "reclaimed" | "unavailable" | "unknown-items"
> = {};

mock.module("lib/orders/order-creation-core", {
  namedExports: {
    createOrderForPayment: async (userId: string, input: unknown) => {
      createCalls.push({ userId, input });
      // Simula el efecto real del reclamo atómico ganado: el pago mockeado
      // queda enlazado a un Order. Sin esto, una segunda llamada de
      // finalizeApprovedPayment sobre el MISMO pago (simulando que otra vía
      // llega después) seguiría viendo orderId: null y volvería a intentar
      // crear -- justo lo que las pruebas de B/C/D/F de abajo necesitan
      // descartar con evidencia, no por suposición.
      const providerRef = (input as { payment: { transactionId: string } })
        .payment.transactionId;
      const entry = Object.values(PAGOS).find(
        (p) => p?.providerRef === providerRef,
      );
      if (entry) entry.orderId = "order_nuevo_ficticio";
      return { id: "order_nuevo_ficticio" };
    },
  },
});
mock.module("lib/checkout/server-order-totals", {
  namedExports: {
    reclaimReleasedStockForLateApproval: async (paymentId: string) => {
      reclaimCalls.push(paymentId);
      return RECLAIM_RESULTS[paymentId] ?? "held";
    },
  },
});
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      payment: {
        findUnique: async ({ where }: { where: { id: string } }) =>
          PAGOS[where.id] ?? null,
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: unknown;
        }) => {
          updateCalls.push({ where, data });
          return { id: where.id };
        },
      },
    },
  },
});

test("Payment SUCCEEDED sin Order: intenta crear el pedido (created)", async () => {
  const { finalizeApprovedPayment } = await import("./order-recovery");
  const outcome = await finalizeApprovedPayment(
    "pay_succeeded_sin_order",
    "webhook",
  );
  assert.equal(outcome, "created");
  assert.equal(createCalls.length, 1);
});

test("Payment con Order ya enlazado: no intenta crear nada (existing)", async () => {
  const { finalizeApprovedPayment } = await import("./order-recovery");
  const antes = createCalls.length;
  const outcome = await finalizeApprovedPayment("pay_con_order", "return");
  assert.equal(outcome, "existing");
  assert.equal(
    createCalls.length,
    antes,
    "no debe intentar crear si el pedido ya existe",
  );
});

test("dos llamadas sucesivas sobre el mismo Payment con Order: ninguna reintenta crear, sin importar la vía", async () => {
  const { finalizeApprovedPayment } = await import("./order-recovery");
  const antes = createCalls.length;
  const r1 = await finalizeApprovedPayment("pay_con_order", "webhook");
  const r2 = await finalizeApprovedPayment("pay_con_order", "cron");
  assert.equal(r1, "existing");
  assert.equal(r2, "existing");
  assert.equal(
    createCalls.length,
    antes,
    "webhook y cron sobre un pago ya finalizado no deben tocar createOrderForPayment",
  );
});

test("Payment PENDING: no crea Order (not-approved), nunca llama a createOrderForPayment", async () => {
  const { finalizeApprovedPayment } = await import("./order-recovery");
  const antes = createCalls.length;
  const outcome = await finalizeApprovedPayment("pay_pending", "webhook");
  assert.equal(outcome, "not-approved");
  assert.equal(createCalls.length, antes);
});

test("Payment FAILED/DECLINED: no crea Order (not-approved)", async () => {
  const { finalizeApprovedPayment } = await import("./order-recovery");
  const antes = createCalls.length;
  const outcome = await finalizeApprovedPayment("pay_declined", "cron");
  assert.equal(outcome, "not-approved");
  assert.equal(createCalls.length, antes);
});

test("Payment inexistente: not-recoverable, no revienta", async () => {
  const { finalizeApprovedPayment } = await import("./order-recovery");
  const outcome = await finalizeApprovedPayment("pay_no_existe", "cron");
  assert.equal(outcome, "not-recoverable");
});

test("G: Payment SUCCEEDED + orderId null, finalizado por el cron: created", async () => {
  PAGOS["pay_para_cron"] = {
    id: "pay_para_cron",
    orderId: null,
    status: "SUCCEEDED",
    providerRef: "lago-para-cron",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: null,
  };
  const { finalizeApprovedPayment } = await import("./order-recovery");
  const outcome = await finalizeApprovedPayment("pay_para_cron", "cron");
  assert.equal(outcome, "created");
});

// B (webhook duplicado), C (webhook primero -> return después), D (return
// primero -> webhook después) y F (cron después de Order existente) son,
// para finalizeApprovedPayment, la MISMA situación vista desde distintos
// `source`: una vía ya creó el Order y cualquier otra que llegue después
// -- sea cual sea, en cualquier orden -- debe ver "existing" y NUNCA volver
// a llamar createOrderForPayment. Se prueban las cuatro combinaciones en
// una sola secuencia realista (el mock de createOrderForPayment de arriba
// sí enlaza el Order la primera vez, así que las llamadas siguientes ven
// un Payment que de verdad cambió, no una fila estática).
test("B+C+D+F: una vía crea el Order, las otras tres (en cualquier orden) solo ven 'existing' -- createOrderForPayment se llama UNA sola vez", async () => {
  const paymentId = "pay_secuencia_realista";
  PAGOS[paymentId] = {
    id: paymentId,
    orderId: null,
    status: "SUCCEEDED",
    providerRef: "lago-secuencia-realista",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: null,
  };
  const { finalizeApprovedPayment } = await import("./order-recovery");
  const antes = createCalls.length;

  // C: el webhook llega primero y gana -- crea el Order (y, dentro de
  // createOrderForPayment sin mockear, dispararía la única ronda de
  // emails -- eso ya está probado en tests/orders/*, no se repite acá).
  const webhookPrimero = await finalizeApprovedPayment(paymentId, "webhook");
  assert.equal(webhookPrimero, "created");
  assert.equal(createCalls.length, antes + 1);

  // D: el return llega después, sobre el mismo pago ya finalizado.
  const returnDespues = await finalizeApprovedPayment(paymentId, "return");
  assert.equal(returnDespues, "existing");

  // F: el cron pasa por acá más tarde (por ejemplo si el return nunca
  // llegó a completarse) y encuentra el Order que ya existe.
  const cronDespues = await finalizeApprovedPayment(paymentId, "cron");
  assert.equal(cronDespues, "existing");

  // B: un reintento/duplicado del propio webhook (Wompi reentrega el
  // mismo evento, o uno equivalente, después de todo lo anterior).
  const webhookDuplicado = await finalizeApprovedPayment(paymentId, "webhook");
  assert.equal(webhookDuplicado, "existing");

  assert.equal(
    createCalls.length,
    antes + 1,
    "las 4 llamadas (webhook, return, cron, webhook de nuevo) generaron una sola creación real",
  );
});

test("B+C+D+F, orden inverso (D primero): return gana, webhook/cron/return-de-nuevo solo ven 'existing'", async () => {
  const paymentId = "pay_secuencia_inversa";
  PAGOS[paymentId] = {
    id: paymentId,
    orderId: null,
    status: "SUCCEEDED",
    providerRef: "lago-secuencia-inversa",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: null,
  };
  const { finalizeApprovedPayment } = await import("./order-recovery");
  const antes = createCalls.length;

  // D: el return llega primero y gana.
  const returnPrimero = await finalizeApprovedPayment(paymentId, "return");
  assert.equal(returnPrimero, "created");
  assert.equal(createCalls.length, antes + 1);

  // C (visto desde el otro orden): el webhook llega después.
  const webhookDespues = await finalizeApprovedPayment(paymentId, "webhook");
  assert.equal(webhookDespues, "existing");

  // F: el cron también.
  const cronDespues = await finalizeApprovedPayment(paymentId, "cron");
  assert.equal(cronDespues, "existing");

  assert.equal(
    createCalls.length,
    antes + 1,
    "no importa el orden: siempre una sola creación real",
  );
});

// D (P0, sep. 2026): late approval después de que el stock ya se había
// liberado por abandono, y al reclamarlo atómicamente ya no queda
// suficiente -- se vendió a otra clienta mientras tanto. NUNCA se crea un
// pedido acá (createOrderForPayment no debe llamarse ni una vez): el pago
// se marca para revisión humana en su lugar.
test("D: Payment SUCCEEDED con stock ya no disponible al reclamarlo (late approval): NUNCA crea Order, marca flaggedForReviewAt/Reason, outcome 'stock-unavailable'", async () => {
  PAGOS["pay_stock_no_disponible"] = {
    id: "pay_stock_no_disponible",
    orderId: null,
    status: "SUCCEEDED",
    providerRef: "lago-stock-no-disponible",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: null,
  };
  RECLAIM_RESULTS["pay_stock_no_disponible"] = "unavailable";

  const { finalizeApprovedPayment } = await import("./order-recovery");
  const antesCreate = createCalls.length;
  const antesUpdate = updateCalls.length;

  const outcome = await finalizeApprovedPayment(
    "pay_stock_no_disponible",
    "webhook",
  );

  assert.equal(outcome, "stock-unavailable");
  assert.equal(
    createCalls.length,
    antesCreate,
    "nunca debe llamar a createOrderForPayment sin stock reclamado",
  );
  assert.equal(updateCalls.length, antesUpdate + 1);
  const data = updateCalls[updateCalls.length - 1]!.data as Record<
    string,
    unknown
  >;
  assert.ok(data.flaggedForReviewAt instanceof Date);
  assert.equal(data.flaggedForReviewReason, "APPROVED_LATE_STOCK_UNAVAILABLE");
});

test("D (anomalía): Payment SUCCEEDED con stockReleased pero sin reservedItems ('unknown-items'): tampoco crea Order, marca con el motivo correcto", async () => {
  PAGOS["pay_sin_items_conocidos"] = {
    id: "pay_sin_items_conocidos",
    orderId: null,
    status: "SUCCEEDED",
    providerRef: "lago-sin-items-conocidos",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: null,
  };
  RECLAIM_RESULTS["pay_sin_items_conocidos"] = "unknown-items";

  const { finalizeApprovedPayment } = await import("./order-recovery");
  const antesCreate = createCalls.length;

  const outcome = await finalizeApprovedPayment(
    "pay_sin_items_conocidos",
    "cron",
  );

  assert.equal(outcome, "stock-unavailable");
  assert.equal(createCalls.length, antesCreate);
  const data = updateCalls[updateCalls.length - 1]!.data as Record<
    string,
    unknown
  >;
  assert.equal(
    data.flaggedForReviewReason,
    "APPROVED_LATE_MISSING_RESERVED_ITEMS",
  );
});

// E: el camino normal (stock nunca liberado) sigue intacto -- reclaim
// resuelve "held" (default de RECLAIM_RESULTS) y crea el pedido exactamente
// como antes de este cambio.
test("E: Payment normal (stock nunca liberado, wompiTransactionId conocido desde siempre): reclaim resuelve 'held', el flujo existente no se rompe", async () => {
  PAGOS["pay_flujo_normal"] = {
    id: "pay_flujo_normal",
    orderId: null,
    status: "SUCCEEDED",
    providerRef: "lago-flujo-normal",
    pendingOrderInput: PENDING_ORDER_INPUT,
    originalUserId: null,
  };
  // A propósito NO se pone en RECLAIM_RESULTS -- default "held".

  const { finalizeApprovedPayment } = await import("./order-recovery");
  const outcome = await finalizeApprovedPayment("pay_flujo_normal", "return");

  assert.equal(outcome, "created");
  assert.ok(reclaimCalls.includes("pay_flujo_normal"));
});

// Nota sobre inventario (relevante para B): finalizeApprovedPayment y
// createOrderForPayment nunca tocan ProductVariant.stock -- el descuento
// ocurre UNA sola vez, al reservar el carrito (reserveAndPriceCheckout,
// antes de que el pago exista siquiera), y la única función que lo toca
// después es releaseReservedStock (para pagos FAILED/CANCELLED, y suma,
// no resta). Por diseño de código, no hay ningún camino por el que llamar
// finalizeApprovedPayment más de una vez pueda descontar stock una segunda
// vez -- no hace falta (ni tendría sentido) un test que lo intente
// forzar; queda registrado acá como evidencia de auditoría, no como
// aserción ejecutable.
