import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (Sprint de confiabilidad de emails/outbox) — el reclamo atómico
// de sendOutboxJob debe garantizar que, sea cual sea el estado elegible
// (PENDING/FAILED, o PROCESSING abandonado hace rato), dos intentos
// concurrentes de procesar el MISMO job nunca terminen los dos enviando de
// verdad. Igual que ya reconoce tests/orders/fake-prisma.ts para el reclamo
// de Payment.orderId: un mock no puede demostrar atomicidad REAL a nivel de
// fila de Postgres (eso ya está demostrado contra Neon real, ver
// tests/concurrency/cron-webhook-return-race.ts) — acá se verifica que la
// LÓGICA de decisión (el updateMany condicional) nunca deja pasar a dos
// llamadores a la vez cuando se ejecuta secuencialmente, que es lo que un
// entorno de un solo hilo puede probar con certeza.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/email/outbox.concurrent-claim.test.ts

type FakeJob = {
  id: string;
  orderId: string;
  type: "ADMIN_NEW_ORDER" | "CUSTOMER_ORDER_CONFIRMATION";
  recipient: string;
  recipientNormalized: string;
  idempotencyKey: string;
  freeShippingThresholdSnapshot: number | null;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  attemptCount: number;
  lastAttemptAt: Date | null;
  sentAt: Date | null;
  lastError: string | null;
};

const MAX_ATTEMPTS = 5;
const jobs = new Map<string, FakeJob>();

function makeJob(id: string, overrides: Partial<FakeJob> = {}): FakeJob {
  const job: FakeJob = {
    id,
    orderId: "order-1",
    type: "CUSTOMER_ORDER_CONFIRMATION",
    recipient: "clienta@ejemplo.test",
    recipientNormalized: "clienta@ejemplo.test",
    idempotencyKey: `order:order-1:customer_order_confirmation:${id}`,
    freeShippingThresholdSnapshot: null,
    status: "PENDING",
    attemptCount: 0,
    lastAttemptAt: null,
    sentAt: null,
    lastError: null,
    ...overrides,
  };
  jobs.set(id, job);
  return job;
}

const sendEmailCalls: string[] = [];

mock.module("lib/email/send", {
  namedExports: {
    sendEmail: async (args: { to: string }) => {
      sendEmailCalls.push(args.to);
      return { success: true };
    },
  },
});
mock.module("lib/email/templates", {
  namedExports: {
    adminNewOrderEmail: () => ({
      subject: "Nueva compra",
      html: "<p>admin</p>",
    }),
    customerOrderConfirmationEmail: () => ({
      subject: "Pedido confirmado",
      html: "<p>customer</p>",
    }),
  },
});
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      // Reclamo exactamente como en la implementación real (ver
      // lib/email/outbox.ts): PENDING, FAILED, o PROCESSING con
      // lastAttemptAt más viejo que el cutoff -- todo en una sola
      // condición, sin "leer y después decidir" en dos pasos separados.
      emailOutbox: {
        updateMany: async (args: {
          where: {
            id: string;
            attemptCount: { lt: number };
            OR: unknown[];
          };
          data: Record<string, unknown>;
        }) => {
          const job = jobs.get(args.where.id);
          if (!job) return { count: 0 };
          if (job.attemptCount >= MAX_ATTEMPTS) return { count: 0 };

          const staleCutoff = new Date(Date.now() - 10 * 60 * 1000);
          const eligible =
            job.status === "PENDING" ||
            job.status === "FAILED" ||
            (job.status === "PROCESSING" &&
              job.lastAttemptAt !== null &&
              job.lastAttemptAt.getTime() < staleCutoff.getTime());
          if (!eligible) return { count: 0 };

          Object.assign(job, {
            status: "PROCESSING",
            attemptCount: job.attemptCount + 1,
            lastAttemptAt: new Date(),
          });
          return { count: 1 };
        },
        findUnique: async (args: { where: { id: string } }) => {
          const job = jobs.get(args.where.id);
          return job ? { ...job } : null;
        },
        update: async (args: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          const job = jobs.get(args.where.id);
          if (!job) throw new Error("job no encontrado (fake)");
          Object.assign(job, args.data);
          return { ...job };
        },
      },
      order: {
        findUnique: async () => ({
          id: "order-1",
          orderNumber: 1000,
          createdAt: new Date("2026-09-16T12:00:00.000Z"),
          status: "PROCESANDO",
          fulfillmentStatus: "PENDIENTE_POR_PREPARAR",
          fulfillmentHistory: [],
          items: [],
          payment: null,
          subtotal: 50000,
          shippingCost: 0,
          tax: 0,
          total: 50000,
          shippingMethod: "STANDARD",
          shippingAddress: { email: "clienta@ejemplo.test" },
          couponCode: null,
          discountValue: 0,
        }),
      },
    },
  },
});

test("G: dos llamadas concurrentes sobre un job PENDING -> una sola gana el claim, un solo sendEmail real", async () => {
  const job = makeJob("job-g");
  const { sendOutboxJob } = await import("./outbox");

  const antes = sendEmailCalls.length;
  const [r1, r2] = await Promise.all([
    sendOutboxJob(job.id),
    sendOutboxJob(job.id),
  ]);

  const results = [r1, r2].sort();
  assert.deepEqual(
    results,
    ["sent", "skipped"],
    "una gana (sent), la otra se descarta (skipped) -- nunca las dos 'sent'",
  );
  assert.equal(
    sendEmailCalls.length,
    antes + 1,
    "sendEmail (el límite real hacia Resend) se llamó exactamente una vez",
  );
  assert.equal(jobs.get(job.id)!.status, "SENT");
});

test("K: dos llamadas concurrentes sobre un job PROCESSING stale -> una sola gana el claim", async () => {
  const staleTimestamp = new Date(Date.now() - 15 * 60 * 1000); // > 10 min
  const job = makeJob("job-k", {
    status: "PROCESSING",
    attemptCount: 1,
    lastAttemptAt: staleTimestamp,
  });
  const { sendOutboxJob } = await import("./outbox");

  const antes = sendEmailCalls.length;
  const [r1, r2] = await Promise.all([
    sendOutboxJob(job.id),
    sendOutboxJob(job.id),
  ]);

  const results = [r1, r2].sort();
  assert.deepEqual(
    results,
    ["sent", "skipped"],
    "el job PROCESSING abandonado se recupera una sola vez, nunca dos",
  );
  assert.equal(
    sendEmailCalls.length,
    antes + 1,
    "un solo envío real aunque dos workers compitan por el mismo PROCESSING stale",
  );
  assert.equal(
    jobs.get(job.id)!.attemptCount,
    2,
    "un solo intento adicional, no dos",
  );
});

test("un job PROCESSING reciente (no stale) no se reclama por ningún worker", async () => {
  const recentTimestamp = new Date(Date.now() - 2 * 60 * 1000); // < 10 min
  const job = makeJob("job-recent", {
    status: "PROCESSING",
    attemptCount: 1,
    lastAttemptAt: recentTimestamp,
  });
  const { sendOutboxJob } = await import("./outbox");

  const result = await sendOutboxJob(job.id);
  assert.equal(
    result,
    "skipped",
    "un worker todavía dentro de la ventana de gracia no debe ser interrumpido",
  );
  assert.equal(jobs.get(job.id)!.attemptCount, 1, "no se tocó el job");
});
