import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// PROPUESTA (rama propuesta/checkout-wompi-alojado) — el webhook de Wompi no
// necesitaba cambios de fondo para el Checkout Web alojado (la referencia se
// sigue generando igual, `lago-<24 hex>`, y sigue siendo Payment.providerRef),
// pero eso hay que verificarlo, no suponerlo: acá se manda un evento firmado
// con una referencia generada por el flujo nuevo y se comprueba que llega
// entero a applyWompiWebhookUpdate, y que uno con la firma mal se rechaza.
//
// No toca base de datos ni red: el repositorio de pagos está mockeado y el
// "secreto de eventos" es un string inventado en este archivo.
//
// Cómo correrlo (mock.module todavía es experimental en Node):
//   node --experimental-test-module-mocks --import tsx --test app/api/webhooks/wompi/route.test.ts

const EVENTS_SECRET = "test_events_secret_FALSO";
process.env.WOMPI_EVENTS_SECRET = EVENTS_SECRET;

// Referencia con el mismo formato que genera wompiGateway.createIntent y que
// usa el checkout alojado.
const REFERENCE = "lago-0123456789abcdef01234567";

const aplicados: { transaction: unknown; timestamp: number }[] = [];

mock.module("lib/auth/rate-limit", {
  namedExports: {
    checkRateLimit: async () => undefined,
    RateLimitError: class RateLimitError extends Error {},
  },
});
mock.module("lib/request/client-ip", {
  namedExports: { getClientIp: async () => "203.0.113.7" },
});
mock.module("lib/payments/payments-repository", {
  namedExports: {
    paymentsRepository: {
      applyWompiWebhookUpdate: async (
        transaction: unknown,
        timestamp: number,
      ) => {
        aplicados.push({ transaction, timestamp });
        return "applied" as const;
      },
    },
  },
});
// Observabilidad (sep. 2026): la ruta ahora llama a logEvent en la rama de
// firma inválida (lib/observability/log.ts), que importa lib/prisma y
// lib/email/send -- sin este mock, el test intentaría crear un PrismaClient
// real (DATABASE_URL no está definida en .env.test) solo por cargar ese
// módulo. Nunca se toca la base de verdad acá, igual que el resto de este
// archivo.
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      systemLog: {
        create: async () => ({ id: "log_test" }),
        findFirst: async () => null,
        update: async () => ({}),
      },
    },
  },
});
mock.module("lib/email/send", {
  namedExports: { sendEmail: async () => ({ success: true }) },
});

function buildEvent(checksum?: string) {
  const timestamp = 1_789_000_000;
  const transaction = {
    id: "113344-1699999-12345",
    reference: REFERENCE,
    status: "APPROVED",
    status_message: null,
    amount_in_cents: 15990000,
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
      checksum:
        checksum ??
        createHash("sha256")
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

test("evento firmado con una referencia del checkout alojado llega completo a applyWompiWebhookUpdate", async () => {
  const { POST } = await import("./route");
  const event = buildEvent();

  const response = await POST(fakeRequest(event));
  assert.equal(response.status, 200);

  assert.equal(aplicados.length, 1);
  assert.deepEqual(aplicados[0]!.transaction, {
    id: "113344-1699999-12345",
    reference: REFERENCE,
    status: "APPROVED",
    statusMessage: null,
    amountInCents: 15990000,
    currency: "COP",
  });
  // El timestamp del evento va en SEGUNDOS: es el mismo campo que compara
  // applyWompiWebhookUpdateAction contra Payment.lastEventTimestamp (un Int
  // de 32 bits), y por eso el flujo de retorno también le pasa segundos.
  assert.equal(aplicados[0]!.timestamp, 1_789_000_000);
  assert.ok(aplicados[0]!.timestamp < 2_147_483_647);
});

test("una firma que no corresponde se rechaza con 401 y no aplica nada", async () => {
  const { POST } = await import("./route");
  const antes = aplicados.length;

  const response = await POST(fakeRequest(buildEvent("0".repeat(64))));
  assert.equal(response.status, 401);
  assert.equal(aplicados.length, antes);
});
