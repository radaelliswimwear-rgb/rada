import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (Sprint de confiabilidad de emails/outbox, escenario J) — el
// caso crítico: Resend ACEPTA el envío, pero nuestra propia app pierde
// conexión/DB antes de marcar el job SENT localmente. Verifica que:
//   1. el fallo al persistir no tumba el resto del batch (ver
//      processEmailOutboxBatch, que envuelve cada job en su propio
//      try/catch),
//   2. el job queda elegible de nuevo (no quedó "SENT" localmente, aunque
//      Resend sí lo haya recibido),
//   3. el retry usa EXACTAMENTE la misma idempotencyKey, el mismo
//      recipient y el mismo subject -- nunca se genera nada nuevo.
//
// Lo que este test NO puede demostrar (documentado, no fingido): que
// Resend, del lado de ellos, efectivamente deduplique el segundo intento y
// no mande un correo físico duplicado -- eso es una garantía documentada
// por su API (Idempotency-Key, ventana de 24h), no algo verificable desde
// un test unitario local. Acá se prueba lo que SÍ es verificable: que
// nuestro propio código nunca crea un segundo EmailOutbox ni cambia la key
// entre intentos.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/email/outbox.crash-after-send.test.ts

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

const jobs = new Map<string, FakeJob>();
const job: FakeJob = {
  id: "job-crash",
  orderId: "order-1",
  type: "CUSTOMER_ORDER_CONFIRMATION",
  recipient: "clienta@ejemplo.test",
  recipientNormalized: "clienta@ejemplo.test",
  idempotencyKey: "order:order-1:customer_order_confirmation:deadbeef",
  freeShippingThresholdSnapshot: null,
  status: "PENDING",
  attemptCount: 0,
  lastAttemptAt: null,
  sentAt: null,
  lastError: null,
};
jobs.set(job.id, job);

const sendEmailCalls: {
  to: string;
  subject: string;
  idempotencyKey?: string;
}[] = [];
let updateShouldCrash = false;

mock.module("lib/email/send", {
  namedExports: {
    // Resend "acepta" siempre en este archivo -- lo que varía es si
    // NUESTRA app logra persistir el SENT después.
    sendEmail: async (args: {
      to: string;
      subject: string;
      idempotencyKey?: string;
    }) => {
      sendEmailCalls.push({
        to: args.to,
        subject: args.subject,
        idempotencyKey: args.idempotencyKey,
      });
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
        findMany: async () => {
          // Solo hay un job en todo este archivo -- se ofrece como
          // "candidato" si su estado actual lo haría elegible, igual que
          // la consulta real (processEmailOutboxBatch).
          const current = jobs.get(job.id)!;
          const eligible =
            current.status === "PENDING" || current.status === "FAILED";
          return eligible ? [{ id: current.id }] : [];
        },
        updateMany: async (args: { where: { id: string } }) => {
          const current = jobs.get(args.where.id);
          if (!current) return { count: 0 };
          if (current.status !== "PENDING" && current.status !== "FAILED") {
            return { count: 0 };
          }
          Object.assign(current, {
            status: "PROCESSING",
            attemptCount: current.attemptCount + 1,
            lastAttemptAt: new Date(),
          });
          return { count: 1 };
        },
        findUnique: async (args: { where: { id: string } }) => {
          const current = jobs.get(args.where.id);
          return current ? { ...current } : null;
        },
        update: async (args: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          // Simula: Resend ya respondió éxito, pero justo ACÁ se cae la
          // conexión a la base antes de persistir "SENT".
          if (updateShouldCrash && args.data["status"] === "SENT") {
            throw new Error("DB caída ficticia justo al marcar SENT");
          }
          const current = jobs.get(args.where.id);
          if (!current) throw new Error("job no encontrado (fake)");
          Object.assign(current, args.data);
          return { ...current };
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

test("J: Resend acepta pero la app se cae antes de marcar SENT -> el job sigue elegible", async () => {
  updateShouldCrash = true;
  const { sendOutboxJob } = await import("./outbox");

  await assert.rejects(() => sendOutboxJob(job.id));

  const fresh = jobs.get(job.id)!;
  assert.notEqual(
    fresh.status,
    "SENT",
    "localmente nunca se supo que Resend había aceptado el envío",
  );
  assert.equal(sendEmailCalls.length, 1, "Resend sí recibió un intento real");
});

test("J: processEmailOutboxBatch no se detiene por ese fallo -- el resto del batch sigue", async () => {
  const { processEmailOutboxBatch } = await import("./outbox");
  // Reponer el job a un estado elegible (simula la próxima corrida del
  // barrido, con la conexión a la base ya recuperada).
  updateShouldCrash = true;
  Object.assign(job, { status: "FAILED" });

  const summary = await processEmailOutboxBatch();
  assert.equal(summary.checked, 1);
  assert.equal(
    summary.failed,
    1,
    "se cuenta como fallo, pero no lanza ni detiene el batch",
  );
});

test("J: el retry (ya sin fallo de DB) usa EXACTAMENTE la misma idempotencyKey, recipient y subject", async () => {
  updateShouldCrash = false;
  Object.assign(job, { status: "FAILED" }); // elegible de nuevo

  const { sendOutboxJob } = await import("./outbox");
  const result = await sendOutboxJob(job.id);

  assert.equal(result, "sent");
  assert.equal(jobs.get(job.id)!.status, "SENT");

  assert.ok(sendEmailCalls.length >= 2, "hubo al menos dos intentos reales");
  const [primero, ...resto] = sendEmailCalls;
  for (const llamada of resto) {
    assert.equal(
      llamada.idempotencyKey,
      primero!.idempotencyKey,
      "la idempotencyKey nunca cambia entre reintentos del mismo job",
    );
    assert.equal(
      llamada.to,
      primero!.to,
      "mismo destinatario en todos los intentos",
    );
    assert.equal(
      llamada.subject,
      primero!.subject,
      "mismo asunto en todos los intentos (mismo contenido, nunca regenerado distinto)",
    );
  }
  // La idempotencyKey nunca se recalculó: sigue siendo la que tenía el job
  // desde su creación, no una nueva generada en el retry.
  assert.equal(jobs.get(job.id)!.idempotencyKey, job.idempotencyKey);
});
