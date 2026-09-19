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
// Hardening de outbox histórico (sep. 2026): agrega la cobertura del
// checklist obligatorio A-M -- ningún job con eligibleForBatch=false
// (cualquier fila creada antes de este deploy, incluido el pedido #1006)
// puede ser reclamado ni por el barrido periódico ni por una llamada
// directa a sendMarketingEventJob con su id, y la selección nunca modifica
// esas filas (ni status, ni attemptCount, ni lastError, ni eventId).
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
  eligibleForBatch: boolean;
};

let jobs: Record<string, FakeJob>;
let deliveryCalls: number;
let deliveryOutcome: "success" | "failure" = "success";
let findManyShouldThrow: boolean;

let logCalls: Array<{
  event: string;
  severity: string;
  alert?: boolean;
  outcome?: string;
}>;

function resetStore(): void {
  jobs = {};
  deliveryCalls = 0;
  findManyShouldThrow = false;
  logCalls = [];
}

function makeJob(overrides: Partial<FakeJob> & { id: string }): FakeJob {
  return {
    orderId: `order_${overrides.id}`,
    provider: "META",
    eventName: "PURCHASE",
    eventId: `purchase:order_${overrides.id}`,
    payloadSnapshot: {
      eventId: `purchase:order_${overrides.id}`,
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
    eligibleForBatch: true,
    ...overrides,
  };
}

// Misma forma de elegibilidad que usan de verdad updateMany/findMany/count
// en lib/analytics/marketing-outbox.ts -- un solo lugar para no duplicar
// (y desalinear sin querer) la lógica de matching entre los tres métodos
// fake de abajo.
function matchesEligibleShape(
  row: FakeJob,
  where: {
    attemptCount?: { lt: number };
    eligibleForBatch?: boolean;
    OR?: Array<{ status: string; lastAttemptAt?: { lt: Date } }>;
  },
): boolean {
  if (
    where.eligibleForBatch !== undefined &&
    row.eligibleForBatch !== where.eligibleForBatch
  ) {
    return false;
  }
  if (where.attemptCount && !(row.attemptCount < where.attemptCount.lt)) {
    return false;
  }
  if (where.OR) {
    const matchesOr = where.OR.some((cond) => {
      if (row.status !== cond.status) return false;
      if (cond.lastAttemptAt) {
        if (!row.lastAttemptAt || row.lastAttemptAt >= cond.lastAttemptAt.lt) {
          return false;
        }
      }
      return true;
    });
    if (!matchesOr) return false;
  }
  return true;
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
            eligibleForBatch?: boolean;
            attemptCount?: { lt: number };
            OR?: Array<Record<string, unknown>>;
          };
          data: Partial<FakeJob>;
        }) => {
          const row = jobs[where.id];
          if (!row) return { count: 0 };
          if (!matchesEligibleShape(row, where as never)) return { count: 0 };
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
        findMany: async ({
          where,
        }: {
          where: Parameters<typeof matchesEligibleShape>[1];
        }) => {
          if (findManyShouldThrow) throw new Error("DB caída (simulado)");
          return Object.values(jobs)
            .filter((row) => matchesEligibleShape(row, where))
            .map((row) => ({ id: row.id }));
        },
        count: async ({
          where,
        }: {
          where: Parameters<typeof matchesEligibleShape>[1];
        }) => {
          if (findManyShouldThrow) throw new Error("DB caída (simulado)");
          return Object.values(jobs).filter((row) =>
            matchesEligibleShape(row, where),
          ).length;
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

mock.module("lib/observability/log", {
  namedExports: {
    logEvent: async (input: {
      event: string;
      severity: string;
      alert?: boolean;
      outcome?: string;
    }) => {
      logCalls.push(input);
    },
  },
});

test("G: dos llamadas concurrentes a sendMarketingEventJob sobre el MISMO job -> Meta CAPI se llama exactamente una vez", async () => {
  resetStore();
  deliveryOutcome = "success";
  jobs["job_concurrente"] = makeJob({ id: "job_concurrente" });

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
  jobs["job_ya_enviado"] = makeJob({
    id: "job_ya_enviado",
    status: "SENT",
    attemptCount: 1,
    lastAttemptAt: new Date(),
    sentAt: new Date(),
  });

  const { sendMarketingEventJob } = await import("./marketing-outbox");
  const result = await sendMarketingEventJob("job_ya_enviado");

  assert.equal(result, "skipped");
  assert.equal(
    deliveryCalls,
    0,
    "un job SENT nunca vuelve a llamar a Meta CAPI",
  );
});

// ===========================================================================
// Checklist obligatorio del hardening de outbox histórico (A-M)
// ===========================================================================

test("A: histórico PENDING -- el batch lo ignora por completo", async () => {
  resetStore();
  deliveryOutcome = "success";
  jobs["hist_pending"] = makeJob({
    id: "hist_pending",
    status: "PENDING",
    eligibleForBatch: false,
  });

  const { processMarketingEventOutboxBatch } = await import(
    "./marketing-outbox"
  );
  const summary = await processMarketingEventOutboxBatch();

  assert.equal(summary.checked, 0);
  assert.equal(deliveryCalls, 0);
  assert.equal(jobs["hist_pending"]!.status, "PENDING");
});

test("B: histórico FAILED -- el batch lo ignora por completo", async () => {
  resetStore();
  deliveryOutcome = "success";
  jobs["hist_failed"] = makeJob({
    id: "hist_failed",
    status: "FAILED",
    attemptCount: 1,
    lastError: "fallo original de Meta CAPI (histórico)",
    eligibleForBatch: false,
  });

  const { processMarketingEventOutboxBatch } = await import(
    "./marketing-outbox"
  );
  const summary = await processMarketingEventOutboxBatch();

  assert.equal(summary.checked, 0);
  assert.equal(deliveryCalls, 0);
  assert.equal(jobs["hist_failed"]!.status, "FAILED");
});

test("C: histórico con intentos disponibles (attemptCount bajo) -- igual queda ignorado", async () => {
  resetStore();
  deliveryOutcome = "success";
  // Mismo caso que el pedido #1006: FAILED, con margen de reintentos
  // (attemptCount muy por debajo del máximo) -- justo el caso que, sin este
  // hardening, un cron nuevo reintentaría solo.
  jobs["job_1006"] = makeJob({
    id: "job_1006",
    orderId: "order_1006",
    status: "FAILED",
    attemptCount: 1,
    lastError: "Meta CAPI respondió 400: event_source_url faltante",
    eligibleForBatch: false,
  });

  const { processMarketingEventOutboxBatch } = await import(
    "./marketing-outbox"
  );
  const summary = await processMarketingEventOutboxBatch();

  assert.equal(summary.checked, 0);
  assert.equal(deliveryCalls, 0, "el pedido #1006 nunca debe reenviarse");
  assert.equal(jobs["job_1006"]!.status, "FAILED");
});

test("D: nuevo PENDING elegible -- el batch SÍ puede reclamarlo", async () => {
  resetStore();
  deliveryOutcome = "success";
  jobs["nuevo_pending"] = makeJob({
    id: "nuevo_pending",
    status: "PENDING",
    eligibleForBatch: true,
  });

  const { processMarketingEventOutboxBatch } = await import(
    "./marketing-outbox"
  );
  const summary = await processMarketingEventOutboxBatch();

  assert.equal(summary.checked, 1);
  assert.equal(summary.sent, 1);
  assert.equal(deliveryCalls, 1);
  assert.equal(jobs["nuevo_pending"]!.status, "SENT");
});

test("E: nuevo FAILED dentro del límite -- el batch puede reintentarlo", async () => {
  resetStore();
  deliveryOutcome = "success";
  jobs["nuevo_failed"] = makeJob({
    id: "nuevo_failed",
    status: "FAILED",
    attemptCount: 2,
    eligibleForBatch: true,
  });

  const { processMarketingEventOutboxBatch } = await import(
    "./marketing-outbox"
  );
  const summary = await processMarketingEventOutboxBatch();

  assert.equal(summary.sent, 1);
  assert.equal(jobs["nuevo_failed"]!.status, "SENT");
  assert.equal(jobs["nuevo_failed"]!.attemptCount, 3);
});

test("F: nuevo que ya agotó attemptCount -- el batch no lo reclama", async () => {
  resetStore();
  deliveryOutcome = "success";
  jobs["nuevo_agotado"] = makeJob({
    id: "nuevo_agotado",
    status: "FAILED",
    attemptCount: 5, // MAX_MARKETING_OUTBOX_ATTEMPTS
    eligibleForBatch: true,
  });

  const { processMarketingEventOutboxBatch } = await import(
    "./marketing-outbox"
  );
  const summary = await processMarketingEventOutboxBatch();

  assert.equal(summary.checked, 0);
  assert.equal(deliveryCalls, 0);
  assert.equal(jobs["nuevo_agotado"]!.attemptCount, 5);
});

test("G: el envío inmediato por jobId de un pedido nuevo sigue funcionando", async () => {
  resetStore();
  deliveryOutcome = "success";
  jobs["nuevo_inmediato"] = makeJob({
    id: "nuevo_inmediato",
    eligibleForBatch: true,
  });

  const { sendMarketingEventJob } = await import("./marketing-outbox");
  const result = await sendMarketingEventJob("nuevo_inmediato");

  assert.equal(result, "sent");
  assert.equal(deliveryCalls, 1);
});

test("G2: una llamada directa a sendMarketingEventJob con el id de un job histórico (ej. #1006) nunca lo envía", async () => {
  resetStore();
  deliveryOutcome = "success";
  jobs["job_1006"] = makeJob({
    id: "job_1006",
    status: "FAILED",
    attemptCount: 1,
    eligibleForBatch: false,
  });

  const { sendMarketingEventJob } = await import("./marketing-outbox");
  const result = await sendMarketingEventJob("job_1006");

  assert.equal(result, "skipped");
  assert.equal(
    deliveryCalls,
    0,
    "ni siquiera una llamada directa por id puede reenviar un job histórico",
  );
  assert.equal(jobs["job_1006"]!.status, "FAILED");
  assert.equal(jobs["job_1006"]!.attemptCount, 1);
});

test("H: dos workers de batch concurrentes -- el mismo job nunca se envía dos veces", async () => {
  resetStore();
  deliveryOutcome = "success";
  jobs["job_batch_concurrente"] = makeJob({
    id: "job_batch_concurrente",
    eligibleForBatch: true,
  });

  const { processMarketingEventOutboxBatch } = await import(
    "./marketing-outbox"
  );
  const [summaryA, summaryB] = await Promise.all([
    processMarketingEventOutboxBatch(),
    processMarketingEventOutboxBatch(),
  ]);

  assert.equal(deliveryCalls, 1);
  assert.equal(summaryA.sent + summaryB.sent, 1);
  assert.equal(jobs["job_batch_concurrente"]!.status, "SENT");
});

test("L: si la selección de candidatos falla (config/DB inválida), el batch falla cerrado -- no procesa nada y alerta", async () => {
  resetStore();
  deliveryOutcome = "success";
  findManyShouldThrow = true;
  jobs["nuevo_elegible_pero_no_llega"] = makeJob({
    id: "nuevo_elegible_pero_no_llega",
    eligibleForBatch: true,
  });

  const { processMarketingEventOutboxBatch } = await import(
    "./marketing-outbox"
  );
  const summary = await processMarketingEventOutboxBatch();

  assert.deepEqual(summary, { checked: 0, sent: 0, failed: 0, skipped: 0 });
  assert.equal(
    deliveryCalls,
    0,
    "fail-closed: ni siquiera un job nuevo y elegible se procesa si la selección falla",
  );
  const failClosedLog = logCalls.find(
    (call) => call.event === "marketing_outbox.fail_closed",
  );
  assert.ok(failClosedLog, "debe registrar marketing_outbox.fail_closed");
  assert.equal(failClosedLog!.alert, true);
});

test("M: la selección nunca modifica los jobs históricos (status/attemptCount/lastError/eventId intactos)", async () => {
  resetStore();
  deliveryOutcome = "success";
  const original = makeJob({
    id: "hist_intacto",
    status: "FAILED",
    attemptCount: 2,
    lastError: "error histórico original",
    eligibleForBatch: false,
  });
  jobs["hist_intacto"] = { ...original };

  const { processMarketingEventOutboxBatch } = await import(
    "./marketing-outbox"
  );
  await processMarketingEventOutboxBatch();

  assert.deepEqual(jobs["hist_intacto"], original);
});

test("historical_skipped_count se registra sin alertar cuando hay históricos ignorados", async () => {
  resetStore();
  deliveryOutcome = "success";
  jobs["hist_1"] = makeJob({ id: "hist_1", eligibleForBatch: false });
  jobs["hist_2"] = makeJob({ id: "hist_2", eligibleForBatch: false });

  const { processMarketingEventOutboxBatch } = await import(
    "./marketing-outbox"
  );
  await processMarketingEventOutboxBatch();

  const historicalLog = logCalls.find(
    (call) => call.event === "marketing_outbox.historical_skipped_count",
  );
  assert.ok(historicalLog);
  assert.equal(historicalLog!.outcome, "2");
  assert.notEqual(
    historicalLog!.alert,
    true,
    "un histórico ignorado nunca debe disparar un correo de alerta",
  );
});
