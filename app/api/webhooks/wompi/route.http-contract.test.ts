import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// PROPUESTA (hardening del contrato HTTP del webhook, post-E2E real
// #1010/#1011) — a diferencia de route.test.ts (que mockea todo
// lib/payments/payments-repository para probar solo firma/forma), este
// archivo deja pasar el evento hasta la implementación REAL de
// applyWompiWebhookUpdateAction, para probar que la ruta responde el
// código HTTP correcto según lo que de verdad pasó adentro:
//
//   - éxito, o cualquier descarte consciente (evento viejo, monto que no
//     coincide) -> 200 (Wompi no debe reintentar algo que nunca va a
//     cambiar);
//   - fallo real al re-verificar contra la API de Wompi (timeout, 5xx
//     transitorio) -> 502, para que Wompi SÍ reintente la entrega;
//   - un error verdaderamente inesperado (DB caída al actualizar el
//     Payment, finalizeApprovedPayment lanzando una excepción real) nunca
//     se atrapa acá a propósito -- se propaga tal cual, que es lo que hace
//     que el runtime real de Next responda 500.
//
// Nada de esto toca DB ni red real: Prisma, la API de Wompi y
// finalizeApprovedPayment están mockeados, controlables por test vía flags
// mutables (mock.module solo se puede instalar una vez por proceso, así
// que todos los escenarios comparten este único archivo).
//
// Cómo correrlo (mock.module todavía es experimental en Node):
//   node --experimental-test-module-mocks --import tsx --test app/api/webhooks/wompi/route.http-contract.test.ts

const EVENTS_SECRET = "test_events_secret_http_contract";
process.env.WOMPI_EVENTS_SECRET = EVENTS_SECRET;

const REFERENCE = "lago-http-contract-0123456789ab";

let verifyBehavior: "succeed" | "throw" = "succeed";
let liveStatus = "APPROVED";
let paymentUpdateBehavior: "succeed" | "throw" = "succeed";
let finalizeBehavior: "succeed" | "throw" = "succeed";
const finalizeCalls: string[] = [];

const payment: Record<string, unknown> = {
  id: "pay_http_contract",
  providerRef: REFERENCE,
  amount: 159900,
  currency: "COP",
  lastEventTimestamp: null,
  orderId: null,
};

mock.module("lib/auth/rate-limit", {
  namedExports: {
    checkRateLimit: async () => undefined,
    RateLimitError: class RateLimitError extends Error {},
  },
});
mock.module("lib/request/client-ip", {
  namedExports: { getClientIp: async () => "203.0.113.9" },
});
mock.module("lib/checkout/server-order-totals", {
  namedExports: { releaseReservedStock: async () => undefined },
});
mock.module("lib/payments/providers/wompi-gateway", {
  namedExports: {
    verifyWompiTransaction: async (id: string) => {
      if (verifyBehavior === "throw") {
        throw new Error("timeout ficticio contra Wompi");
      }
      return {
        id,
        status: liveStatus,
        status_message: null,
        amount_in_cents: 15990000,
        currency: "COP",
        reference: REFERENCE,
      };
    },
  },
});
mock.module("lib/orders/order-recovery", {
  namedExports: {
    finalizeApprovedPayment: async (paymentId: string) => {
      if (finalizeBehavior === "throw") {
        throw new Error(
          "fallo inesperado ficticio dentro de finalizeApprovedPayment",
        );
      }
      finalizeCalls.push(paymentId);
      return "created";
    },
  },
});
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      payment: {
        findFirst: async () => ({ ...payment }),
        update: async (args: { data: Record<string, unknown> }) => {
          if (paymentUpdateBehavior === "throw") {
            throw new Error("DB caída ficticia al actualizar el Payment");
          }
          Object.assign(payment, args.data);
          return { ...payment };
        },
      },
      order: { update: async () => ({}) },
    },
  },
});

function buildEvent(
  overrides: { status?: string; amountInCents?: number } = {},
) {
  const timestamp = 1_789_500_000;
  const transaction = {
    id: "wompi-tx-http-contract",
    reference: REFERENCE,
    status: overrides.status ?? "APPROVED",
    status_message: null,
    amount_in_cents: overrides.amountInCents ?? 15990000,
    currency: "COP",
  };
  const properties = [
    "transaction.id",
    "transaction.status",
    "transaction.amount_in_cents",
  ];
  const concatenated = `${transaction.id}${transaction.status}${transaction.amount_in_cents}`;
  return {
    event: "transaction.updated",
    data: { transaction },
    timestamp,
    signature: {
      properties,
      checksum: createHash("sha256")
        .update(`${concatenated}${timestamp}${EVENTS_SECRET}`)
        .digest("hex"),
    },
  };
}

function fakeRequest(body: unknown) {
  return {
    json: async () => body,
    headers: { get: () => null },
  } as unknown as Parameters<Awaited<typeof import("./route")>["POST"]>[0];
}

test("evento válido, todo sale bien: 200", async () => {
  verifyBehavior = "succeed";
  liveStatus = "APPROVED";
  paymentUpdateBehavior = "succeed";
  finalizeBehavior = "succeed";
  payment.lastEventTimestamp = null;
  const antesFinalize = finalizeCalls.length;

  const { POST } = await import("./route");
  const response = await POST(fakeRequest(buildEvent()));

  assert.equal(response.status, 200);
  assert.equal(
    finalizeCalls.length,
    antesFinalize + 1,
    "un evento APPROVED procesado con éxito debe finalizar el pago",
  );
});

test("evento stale/duplicado: sigue 200, no revierte el Payment ni finaliza de nuevo", async () => {
  payment.lastEventTimestamp = 2_000_000_000; // más nuevo que el timestamp del evento de abajo
  const antes = { ...payment };
  const antesFinalize = finalizeCalls.length;

  const { POST } = await import("./route");
  const response = await POST(fakeRequest(buildEvent()));

  assert.equal(
    response.status,
    200,
    "un evento viejo/repetido sigue respondiendo 200 -- Wompi no debe reintentarlo",
  );
  assert.deepEqual(payment, antes, "no debe tocar nada del Payment");
  assert.equal(
    finalizeCalls.length,
    antesFinalize,
    "un evento descartado por stale nunca debe intentar finalizar",
  );
});

test("fallo al re-verificar contra Wompi (timeout/5xx transitorio): NO 200, responde 502", async () => {
  payment.lastEventTimestamp = null;
  verifyBehavior = "throw";

  const { POST } = await import("./route");
  const response = await POST(fakeRequest(buildEvent()));

  assert.equal(response.status, 502);
  assert.notEqual(
    response.status,
    200,
    "un fallo real de verificación nunca puede disfrazarse de éxito",
  );
  const body = await response.json();
  assert.equal(body.received, false);

  verifyBehavior = "succeed"; // restaurar para los tests siguientes
});

test("fallo inesperado al actualizar el Payment (DB caída): se propaga, nunca 200", async () => {
  payment.lastEventTimestamp = null;
  paymentUpdateBehavior = "throw";

  const { POST } = await import("./route");
  // Sin try/catch alrededor de esto a propósito: un fallo realmente
  // inesperado (DB caída) debe propagarse sin capturar -- es lo que hace
  // que el runtime real de Next.js responda 500 en vez de disfrazarlo de
  // 200. Acá se prueba que efectivamente se propaga (la promesa rechaza),
  // no que quede tragado en una respuesta exitosa.
  await assert.rejects(() => POST(fakeRequest(buildEvent())));

  paymentUpdateBehavior = "succeed";
});

test("fallo inesperado dentro de finalizeApprovedPayment: se propaga, nunca 200", async () => {
  payment.lastEventTimestamp = null;
  finalizeBehavior = "throw";

  const { POST } = await import("./route");
  await assert.rejects(() => POST(fakeRequest(buildEvent())));

  finalizeBehavior = "succeed";
});
