import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (Sprint de confiabilidad de emails/outbox) — ciclo de vida de
// UN job de EmailOutbox a través de sendOutboxJob: envío exitoso, envío
// fallido, retry posterior exitoso, y que un job ya SENT nunca se vuelva a
// tocar. No prueba concurrencia real (ver outbox.concurrent-claim.test.ts)
// ni la creación de jobs (ver tests/orders/create-happy-path.test.ts) — solo
// el procesamiento de un job puntual, con Prisma y sendEmail mockeados.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/email/outbox.send-and-retry.test.ts

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

let sendEmailBehavior: "success" | "failure" = "success";
const sendEmailCalls: { to: string; idempotencyKey?: string }[] = [];

mock.module("lib/email/send", {
  namedExports: {
    sendEmail: async (args: { to: string; idempotencyKey?: string }) => {
      sendEmailCalls.push({ to: args.to, idempotencyKey: args.idempotencyKey });
      if (sendEmailBehavior === "failure") {
        return { success: false, error: "fallo ficticio de Resend" };
      }
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
      emailOutbox: {
        updateMany: async (args: {
          where: { id: string; attemptCount: { lt: number } };
          data: Record<string, unknown>;
        }) => {
          const job = jobs.get(args.where.id);
          if (!job) return { count: 0 };
          if (job.attemptCount >= MAX_ATTEMPTS) return { count: 0 };
          if (job.status !== "PENDING" && job.status !== "FAILED") {
            return { count: 0 };
          }
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

test("C: send exitoso -> el job queda SENT con sentAt", async () => {
  sendEmailBehavior = "success";
  const job = makeJob("job-c");

  const { sendOutboxJob } = await import("./outbox");
  const result = await sendOutboxJob(job.id);

  assert.equal(result, "sent");
  const fresh = jobs.get(job.id)!;
  assert.equal(fresh.status, "SENT");
  assert.ok(fresh.sentAt);
  assert.equal(fresh.attemptCount, 1);
});

test("D: send falla -> el job queda FAILED, reintentable, con lastError seguro", async () => {
  sendEmailBehavior = "failure";
  const job = makeJob("job-d");

  const { sendOutboxJob } = await import("./outbox");
  const result = await sendOutboxJob(job.id);

  assert.equal(result, "failed");
  const fresh = jobs.get(job.id)!;
  assert.equal(fresh.status, "FAILED");
  assert.equal(fresh.sentAt, null);
  assert.equal(fresh.lastError, "fallo ficticio de Resend");
  assert.equal(fresh.attemptCount, 1);
});

test("E: retry exitoso sobre un job FAILED -> mismo job pasa a SENT", async () => {
  sendEmailBehavior = "failure";
  const job = makeJob("job-e");

  const { sendOutboxJob } = await import("./outbox");
  const first = await sendOutboxJob(job.id);
  assert.equal(first, "failed");
  assert.equal(jobs.get(job.id)!.status, "FAILED");

  sendEmailBehavior = "success";
  const second = await sendOutboxJob(job.id);
  assert.equal(second, "sent");
  const fresh = jobs.get(job.id)!;
  assert.equal(fresh.status, "SENT");
  assert.equal(
    fresh.attemptCount,
    2,
    "el segundo intento incrementa el contador",
  );
});

test("F: un job SENT nunca se vuelve a enviar", async () => {
  sendEmailBehavior = "success";
  const job = makeJob("job-f");

  const { sendOutboxJob } = await import("./outbox");
  const first = await sendOutboxJob(job.id);
  assert.equal(first, "sent");

  const antes = sendEmailCalls.length;
  const second = await sendOutboxJob(job.id);
  assert.equal(second, "skipped", "un job ya SENT no se reclama de nuevo");
  assert.equal(
    sendEmailCalls.length,
    antes,
    "no debe haber un segundo POST real a Resend",
  );
});
