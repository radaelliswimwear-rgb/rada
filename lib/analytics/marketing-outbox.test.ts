import { test, mock } from "node:test";
import assert from "node:assert/strict";

// G (checklist Meta CAPI, sep. 2026): dos "workers" concurrentes
// (p. ej. el intento inmediato de createOrderForPayment carrera con una
// corrida futura de processMarketingEventOutboxBatch sobre el MISMO job
// FAILED reintentable) NUNCA deben entregar el mismo job dos veces.
// sendMarketingEventJob ya usa el mismo patrón de reclamo atómico
// (updateMany condicionado dentro de la claim) que releaseReservedStock/
// createOrderForPayment -- este test lo prueba con un fake de Prisma en
// memoria (mismo estilo que
// lib/checkout/server-order-totals.abandoned-payment.test.ts).
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/analytics/marketing-outbox.test.ts

process.env.ANALYTICS_RUNTIME_ENABLED = "true";
process.env.ANALYTICS_SERVER_DELIVERY_ENABLED = "true";

type FakeJob = {
  id: string;
  orderId: string;
  provider: string;
  eventName: string;
  eventId: string;
  payloadSnapshot: unknown;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "SKIPPED";
  attemptCount: number;
  lastAttemptAt: Date | null;
  sentAt: Date | null;
  lastError: string | null;
};

let jobs: Record<string, FakeJob>;
let deliveryCalls: number;
let deliveryOutcome: "success" | "failure" = "success";

function resetStore(): void {
  jobs = {};
  deliveryCalls = 0;
}

mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      marketingEventOutbox: {
        updateMany: async ({
          where,
          data,
        }: {
          where: {
            id: string;
            attemptCount?: { lt: number };
            OR?: Array<Record<string, unknown>>;
          };
          data: Partial<FakeJob>;
        }) => {
          const row = jobs[where.id];
          if (!row) return { count: 0 };
          if (
            where.attemptCount &&
            !(row.attemptCount < where.attemptCount.lt)
          ) {
            return { count: 0 };
          }
          const matchesOr = (where.OR ?? []).some((cond) => {
            if ("status" in cond && cond.status !== undefined) {
              if (row.status !== cond.status) return false;
              if (
                "lastAttemptAt" in cond &&
                (cond as { lastAttemptAt?: { lt: Date } }).lastAttemptAt
              ) {
                const cutoff = (cond as { lastAttemptAt: { lt: Date } })
                  .lastAttemptAt.lt;
                if (!row.lastAttemptAt || row.lastAttemptAt >= cutoff)
                  return false;
              }
              return true;
            }
            return false;
          });
          if (where.OR && !matchesOr) return { count: 0 };
          const { attemptCount, ...rest } = data;
          Object.assign(row, rest);
          if (
            attemptCount &&
            typeof attemptCount === "object" &&
            "increment" in attemptCount
          ) {
            row.attemptCount += (
              attemptCount as { increment: number }
            ).increment;
          } else if (typeof attemptCount === "number") {
            row.attemptCount = attemptCount;
          }
          return { count: 1 };
        },
        findUnique: async ({ where }: { where: { id: string } }) =>
          jobs[where.id] ?? null,
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<FakeJob>;
        }) => {
          const row = jobs[where.id];
          if (row) Object.assign(row, data);
          return row;
        },
      },
    },
  },
});

mock.module("lib/analytics/adapters/meta-capi", {
  namedExports: {
    sendMetaCapiPurchase: async () => {
      deliveryCalls++;
      // Simula trabajo real (I/O) para maximizar la ventana de carrera
      // entre las dos llamadas concurrentes del test de abajo.
      await new Promise((resolve) => setTimeout(resolve, 5));
      return deliveryOutcome === "success"
        ? { success: true }
        : { success: false, error: "fallo ficticio" };
    },
  },
});

test("G: dos llamadas concurrentes a sendMarketingEventJob sobre el MISMO job -> Meta CAPI se llama exactamente una vez", async () => {
  resetStore();
  deliveryOutcome = "success";
  jobs["job_concurrente"] = {
    id: "job_concurrente",
    orderId: "order_1",
    provider: "META",
    eventName: "PURCHASE",
    eventId: "purchase:order_1",
    payloadSnapshot: {
      eventId: "purchase:order_1",
      eventSourceUrl: null,
      value: 5000,
      currency: "COP",
      products: [],
      userAgentSnapshot: null,
    },
    status: "PENDING",
    attemptCount: 0,
    lastAttemptAt: null,
    sentAt: null,
    lastError: null,
  };

  const { sendMarketingEventJob } = await import("./marketing-outbox");
  const [resultA, resultB] = await Promise.all([
    sendMarketingEventJob("job_concurrente"),
    sendMarketingEventJob("job_concurrente"),
  ]);

  assert.equal(
    deliveryCalls,
    1,
    "Meta CAPI debe llamarse EXACTAMENTE una vez, nunca dos",
  );
  const results = [resultA, resultB].sort();
  assert.deepEqual(results, ["sent", "skipped"].sort());
  assert.equal(jobs["job_concurrente"]!.status, "SENT");
  assert.equal(jobs["job_concurrente"]!.attemptCount, 1);
});

test("un job ya SENT nunca se reclama de nuevo (idempotente ante una llamada posterior)", async () => {
  resetStore();
  jobs["job_ya_enviado"] = {
    id: "job_ya_enviado",
    orderId: "order_2",
    provider: "META",
    eventName: "PURCHASE",
    eventId: "purchase:order_2",
    payloadSnapshot: {
      eventId: "purchase:order_2",
      eventSourceUrl: null,
      value: 5000,
      currency: "COP",
      products: [],
      userAgentSnapshot: null,
    },
    status: "SENT",
    attemptCount: 1,
    lastAttemptAt: new Date(),
    sentAt: new Date(),
    lastError: null,
  };

  const { sendMarketingEventJob } = await import("./marketing-outbox");
  const result = await sendMarketingEventJob("job_ya_enviado");

  assert.equal(result, "skipped");
  assert.equal(
    deliveryCalls,
    0,
    "un job SENT nunca vuelve a llamar a Meta CAPI",
  );
});
