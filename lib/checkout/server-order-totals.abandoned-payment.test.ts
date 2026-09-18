import { test, mock } from "node:test";
import assert from "node:assert/strict";

// P0 (corrección de leak de inventario, sep. 2026) — pruebas dedicadas para
// las dos funciones nuevas de este archivo:
//   - cancelAbandonedPaymentAndReleaseStock: cierra un Payment PENDING sin
//     wompiTransactionId conocido, vencido por TTL (caso "(A)" del cron de
//     pagos vencidos) -- cancela y libera stock atómicamente.
//   - reclaimReleasedStockForLateApproval: red de seguridad para "late
//     approval" -- si un pago cuyo stock ya se liberó llega a SUCCEEDED
//     después, intenta re-reservar atómicamente antes de dejar que se cree
//     ningún pedido.
//
// Fake de Prisma en memoria (sin base real): $transaction ejecuta el
// callback contra el MISMO store compartido y, si el callback tira,
// restaura una copia previa del store -- suficiente para probar la lógica
// de las dos funciones (branches, reversión atómica) sin una base real.
// La garantía de "exactamente una vez bajo dos ejecuciones CONCURRENTES"
// (test C del pedido) depende del lock de fila real de Postgres, que un
// fake en memoria no puede demostrar -- ver
// tests/concurrency/stale-payment-release-concurrency.ts, pensado para
// correr a mano contra una base Neon descartable.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/checkout/server-order-totals.abandoned-payment.test.ts

type FakePayment = {
  id: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED";
  stockReleased: boolean;
  reservedItems: { productId: string; size: string; quantity: number }[] | null;
  failureReason: string | null;
  flaggedForReviewAt: Date | null;
  flaggedForReviewReason: string | null;
};

type FakeVariant = { productId: string; size: string; stock: number };

let payments: Record<string, FakePayment>;
let variants: Record<string, FakeVariant>;
const backInStockCalls: { productId: string; size: string }[] = [];

function variantKey(productId: string, size: string): string {
  return `${productId}::${size}`;
}

function resetStore(): void {
  payments = {};
  variants = {};
  backInStockCalls.length = 0;
}

function snapshot(): { payments: typeof payments; variants: typeof variants } {
  return {
    payments: JSON.parse(JSON.stringify(payments)),
    variants: JSON.parse(JSON.stringify(variants)),
  };
}

function restore(snap: ReturnType<typeof snapshot>): void {
  payments = snap.payments;
  variants = snap.variants;
}

function makeTx() {
  return {
    payment: {
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status?: string; stockReleased?: boolean };
        data: Partial<FakePayment>;
      }) => {
        const row = payments[where.id];
        if (!row) return { count: 0 };
        if (where.status !== undefined && row.status !== where.status) {
          return { count: 0 };
        }
        if (
          where.stockReleased !== undefined &&
          row.stockReleased !== where.stockReleased
        ) {
          return { count: 0 };
        }
        Object.assign(row, data);
        return { count: 1 };
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        payments[where.id] ?? null,
    },
    productVariant: {
      findUnique: async ({
        where,
      }: {
        where: { productId_size: { productId: string; size: string } };
      }) => {
        const v =
          variants[
            variantKey(
              where.productId_size.productId,
              where.productId_size.size,
            )
          ];
        return v ? { stock: v.stock } : null;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { productId: string; size: string; stock?: { gte: number } };
        data: { stock: { increment?: number; decrement?: number } };
      }) => {
        const key = variantKey(where.productId, where.size);
        const v = variants[key];
        if (!v) return { count: 0 };
        if (where.stock && v.stock < where.stock.gte) return { count: 0 };
        if (data.stock.increment !== undefined) v.stock += data.stock.increment;
        if (data.stock.decrement !== undefined) v.stock -= data.stock.decrement;
        return { count: 1 };
      },
    },
  };
}

mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      $transaction: async (
        callback: (tx: ReturnType<typeof makeTx>) => Promise<unknown>,
      ) => {
        const snap = snapshot();
        try {
          return await callback(makeTx());
        } catch (error) {
          restore(snap);
          throw error;
        }
      },
    },
  },
});
mock.module("lib/email/back-in-stock-notifications", {
  namedExports: {
    notifyBackInStockSubscribers: async (productId: string, size: string) => {
      backInStockCalls.push({ productId, size });
    },
  },
});
// G: un Payment abandonado NUNCA debe generar Order, EmailOutbox ni
// MarketingEventOutbox/Purchase -- guardas explícitas que revientan la
// prueba si alguna quedara conectada por error algún día. Hoy
// cancelAbandonedPaymentAndReleaseStock no importa ninguno de estos tres
// módulos (solo toca Payment/ProductVariant), así que estos mocks nunca se
// ejercen de verdad -- son una red de regresión, no evidencia de que se
// llamaron.
mock.module("lib/orders/order-creation-core", {
  namedExports: {
    createOrderForPayment: async () => {
      throw new Error(
        "G: un Payment abandonado NUNCA debe llegar a createOrderForPayment",
      );
    },
  },
});
mock.module("lib/email/outbox", {
  namedExports: {
    createEmailOutboxJobsForOrder: async () => {
      throw new Error(
        "G: un Payment abandonado NUNCA debe generar EmailOutbox",
      );
    },
    sendOutboxJob: async () => {
      throw new Error(
        "G: un Payment abandonado NUNCA debe generar EmailOutbox",
      );
    },
  },
});
mock.module("lib/analytics/marketing-outbox", {
  namedExports: {
    createMarketingEventJobsForOrder: async () => {
      throw new Error(
        "G: un Payment abandonado NUNCA debe generar MarketingEventOutbox/Purchase",
      );
    },
    sendMarketingEventJob: async () => {
      throw new Error(
        "G: un Payment abandonado NUNCA debe generar MarketingEventOutbox/Purchase",
      );
    },
  },
});

// ============================================================================
// A: Payment PENDING sin wompiTransactionId queda stale -> stock se libera
// una vez, stockReleased queda correcto, estado final correcto.
// ============================================================================
test("A: cancelAbandonedPaymentAndReleaseStock cancela el pago y libera exactamente el stock reservado", async () => {
  resetStore();
  payments["pay_abandonado"] = {
    id: "pay_abandonado",
    status: "PENDING",
    stockReleased: false,
    reservedItems: [{ productId: "prod_1", size: "M", quantity: 2 }],
    failureReason: null,
    flaggedForReviewAt: null,
    flaggedForReviewReason: null,
  };
  variants[variantKey("prod_1", "M")] = {
    productId: "prod_1",
    size: "M",
    stock: 3,
  };

  const { cancelAbandonedPaymentAndReleaseStock } = await import(
    "./server-order-totals"
  );
  const result = await cancelAbandonedPaymentAndReleaseStock(
    "pay_abandonado",
    "Abandonado: nunca se recibió ningún evento de Wompi antes de vencer el checkout (TTL).",
  );

  assert.equal(result, "cancelled");
  assert.equal(payments["pay_abandonado"]!.status, "CANCELLED");
  assert.equal(payments["pay_abandonado"]!.stockReleased, true);
  assert.ok(payments["pay_abandonado"]!.failureReason);
  assert.equal(
    variants[variantKey("prod_1", "M")]!.stock,
    5,
    "3 + 2 reservadas de vuelta",
  );
});

test("A: si la última unidad reservada vuelve a estar disponible (0 -> positivo), notifica 'avísame cuando vuelva'", async () => {
  resetStore();
  payments["pay_ultima_unidad"] = {
    id: "pay_ultima_unidad",
    status: "PENDING",
    stockReleased: false,
    reservedItems: [{ productId: "prod_2", size: "S", quantity: 1 }],
    failureReason: null,
    flaggedForReviewAt: null,
    flaggedForReviewReason: null,
  };
  variants[variantKey("prod_2", "S")] = {
    productId: "prod_2",
    size: "S",
    stock: 0,
  };

  const { cancelAbandonedPaymentAndReleaseStock } = await import(
    "./server-order-totals"
  );
  await cancelAbandonedPaymentAndReleaseStock(
    "pay_ultima_unidad",
    "Abandonado.",
  );

  assert.ok(
    backInStockCalls.some((c) => c.productId === "prod_2" && c.size === "S"),
  );
});

// ============================================================================
// B: el cron vuelve a ejecutarse -> el stock NO aumenta otra vez.
// ============================================================================
test("B: llamar cancelAbandonedPaymentAndReleaseStock una segunda vez sobre el mismo pago ya cancelado no vuelve a sumar stock", async () => {
  resetStore();
  payments["pay_doble_corrida"] = {
    id: "pay_doble_corrida",
    status: "PENDING",
    stockReleased: false,
    reservedItems: [{ productId: "prod_3", size: "L", quantity: 4 }],
    failureReason: null,
    flaggedForReviewAt: null,
    flaggedForReviewReason: null,
  };
  variants[variantKey("prod_3", "L")] = {
    productId: "prod_3",
    size: "L",
    stock: 1,
  };

  const { cancelAbandonedPaymentAndReleaseStock } = await import(
    "./server-order-totals"
  );
  const first = await cancelAbandonedPaymentAndReleaseStock(
    "pay_doble_corrida",
    "Abandonado.",
  );
  assert.equal(first, "cancelled");
  assert.equal(variants[variantKey("prod_3", "L")]!.stock, 5);

  // Segunda "corrida" del cron sobre el mismo Payment (status ya CANCELLED).
  const second = await cancelAbandonedPaymentAndReleaseStock(
    "pay_doble_corrida",
    "Abandonado.",
  );
  assert.equal(
    second,
    "not-pending",
    "el claim condicionado a status PENDING ya no matchea",
  );
  assert.equal(
    variants[variantKey("prod_3", "L")]!.stock,
    5,
    "el stock NO debe sumarse una segunda vez",
  );
});

test("cancelAbandonedPaymentAndReleaseStock nunca toca un pago que ya no está PENDING (p. ej. un webhook lo aprobó primero)", async () => {
  resetStore();
  payments["pay_ya_aprobado"] = {
    id: "pay_ya_aprobado",
    status: "SUCCEEDED",
    stockReleased: false,
    reservedItems: [{ productId: "prod_4", size: "M", quantity: 1 }],
    failureReason: null,
    flaggedForReviewAt: null,
    flaggedForReviewReason: null,
  };
  variants[variantKey("prod_4", "M")] = {
    productId: "prod_4",
    size: "M",
    stock: 2,
  };

  const { cancelAbandonedPaymentAndReleaseStock } = await import(
    "./server-order-totals"
  );
  const result = await cancelAbandonedPaymentAndReleaseStock(
    "pay_ya_aprobado",
    "Abandonado.",
  );

  assert.equal(result, "not-pending");
  assert.equal(
    payments["pay_ya_aprobado"]!.status,
    "SUCCEEDED",
    "nunca debe pisar un status ya resuelto",
  );
  assert.equal(payments["pay_ya_aprobado"]!.stockReleased, false);
  assert.equal(
    variants[variantKey("prod_4", "M")]!.stock,
    2,
    "nunca debe liberar stock de un pago aprobado",
  );
});

// ============================================================================
// D: late APPROVED después de que la reserva fue liberada.
// ============================================================================
test("D: reclaimReleasedStockForLateApproval re-reserva atómicamente cuando SÍ hay stock disponible", async () => {
  resetStore();
  payments["pay_aprobado_tarde"] = {
    id: "pay_aprobado_tarde",
    status: "SUCCEEDED",
    stockReleased: true, // ya se había liberado por abandono
    reservedItems: [{ productId: "prod_5", size: "S", quantity: 1 }],
    failureReason: null,
    flaggedForReviewAt: null,
    flaggedForReviewReason: null,
  };
  variants[variantKey("prod_5", "S")] = {
    productId: "prod_5",
    size: "S",
    stock: 3,
  };

  const { reclaimReleasedStockForLateApproval } = await import(
    "./server-order-totals"
  );
  const result =
    await reclaimReleasedStockForLateApproval("pay_aprobado_tarde");

  assert.equal(result, "reclaimed");
  assert.equal(payments["pay_aprobado_tarde"]!.stockReleased, false);
  assert.equal(
    variants[variantKey("prod_5", "S")]!.stock,
    2,
    "vuelve a decrementarse exactamente 1",
  );
});

test("D: reclaimReleasedStockForLateApproval NUNCA oversellea -- si ya no hay stock suficiente, revierte todo y devuelve 'unavailable'", async () => {
  resetStore();
  payments["pay_sin_stock_ya"] = {
    id: "pay_sin_stock_ya",
    status: "SUCCEEDED",
    stockReleased: true,
    reservedItems: [
      { productId: "prod_6", size: "M", quantity: 1 },
      { productId: "prod_7", size: "L", quantity: 1 }, // esta talla ya no tiene stock
    ],
    failureReason: null,
    flaggedForReviewAt: null,
    flaggedForReviewReason: null,
  };
  variants[variantKey("prod_6", "M")] = {
    productId: "prod_6",
    size: "M",
    stock: 5,
  };
  variants[variantKey("prod_7", "L")] = {
    productId: "prod_7",
    size: "L",
    stock: 0,
  };

  const { reclaimReleasedStockForLateApproval } = await import(
    "./server-order-totals"
  );
  const result = await reclaimReleasedStockForLateApproval("pay_sin_stock_ya");

  assert.equal(result, "unavailable");
  // Revirtió TODO -- ni siquiera la primera línea (prod_6) quedó
  // decrementada a medias: o se reclaman todas, o ninguna.
  assert.equal(variants[variantKey("prod_6", "M")]!.stock, 5);
  assert.equal(variants[variantKey("prod_7", "L")]!.stock, 0);
  assert.equal(
    payments["pay_sin_stock_ya"]!.stockReleased,
    true,
    "la transacción revertida deja stockReleased tal como estaba (true)",
  );
});

test("D: reclaimReleasedStockForLateApproval sobre un Payment SUCCEEDED sin reservedItems -> 'unknown-items', nunca inventa una cantidad", async () => {
  resetStore();
  payments["pay_sin_snapshot_tarde"] = {
    id: "pay_sin_snapshot_tarde",
    status: "SUCCEEDED",
    stockReleased: true,
    reservedItems: null,
    failureReason: null,
    flaggedForReviewAt: null,
    flaggedForReviewReason: null,
  };

  const { reclaimReleasedStockForLateApproval } = await import(
    "./server-order-totals"
  );
  const result = await reclaimReleasedStockForLateApproval(
    "pay_sin_snapshot_tarde",
  );
  assert.equal(result, "unknown-items");
});

// ============================================================================
// E: el camino normal (stock nunca liberado) no cambia -- reclaim sale
// inmediato en "held", sin tocar stock ni intentar ningún decremento.
// ============================================================================
// ============================================================================
// G: Payment abandonado -> cero Order, cero emails, cero
// MarketingEventOutbox/Purchase.
// ============================================================================
test("G: cancelAbandonedPaymentAndReleaseStock sobre un pago abandonado no crea Order ni dispara ningún email/evento de marketing", async () => {
  resetStore();
  payments["pay_abandonado_g"] = {
    id: "pay_abandonado_g",
    status: "PENDING",
    stockReleased: false,
    reservedItems: [{ productId: "prod_9", size: "M", quantity: 1 }],
    failureReason: null,
    flaggedForReviewAt: null,
    flaggedForReviewReason: null,
  };
  variants[variantKey("prod_9", "M")] = {
    productId: "prod_9",
    size: "M",
    stock: 2,
  };

  const { cancelAbandonedPaymentAndReleaseStock } = await import(
    "./server-order-totals"
  );
  // Si esto llamara a cualquiera de los tres módulos mockeados arriba
  // (createOrderForPayment/EmailOutbox/MarketingEventOutbox), tiraría y la
  // prueba fallaría acá mismo.
  const result = await cancelAbandonedPaymentAndReleaseStock(
    "pay_abandonado_g",
    "Abandonado.",
  );

  assert.equal(result, "cancelled");
  assert.equal(payments["pay_abandonado_g"]!.status, "CANCELLED");
});

test("E: reclaimReleasedStockForLateApproval sobre un Payment cuyo stock NUNCA se liberó sale de inmediato en 'held', sin tocar ProductVariant", async () => {
  resetStore();
  payments["pay_normal"] = {
    id: "pay_normal",
    status: "SUCCEEDED",
    stockReleased: false,
    reservedItems: [{ productId: "prod_8", size: "S", quantity: 1 }],
    failureReason: null,
    flaggedForReviewAt: null,
    flaggedForReviewReason: null,
  };
  variants[variantKey("prod_8", "S")] = {
    productId: "prod_8",
    size: "S",
    stock: 4,
  };

  const { reclaimReleasedStockForLateApproval } = await import(
    "./server-order-totals"
  );
  const result = await reclaimReleasedStockForLateApproval("pay_normal");

  assert.equal(result, "held");
  assert.equal(
    variants[variantKey("prod_8", "S")]!.stock,
    4,
    "no debe tocar el stock del camino normal",
  );
});
