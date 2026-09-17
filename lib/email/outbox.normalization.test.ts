import { test, mock } from "node:test";
import assert from "node:assert/strict";

// PROPUESTA (Sprint de confiabilidad de emails/outbox, escenario L) —
// variantes de mayúsculas/espacios del mismo destinatario deben producir
// EXACTAMENTE el mismo recipientNormalized (y por lo tanto la misma
// idempotencyKey) para el mismo Order + tipo -- es lo que hace que el
// unique constraint real (@@unique([orderId, type, recipientNormalized]))
// los trate como el mismo job, nunca como dos. `recipient` (el valor real
// usado para enviar) nunca se toca ni se normaliza -- solo se prueba acá
// que no se altera.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/email/outbox.normalization.test.ts

process.env.ADMIN_NOTIFICATION_EMAIL_1 = "";
process.env.ADMIN_NOTIFICATION_EMAIL_2 = "";
// createEmailOutboxJobsForOrder recibe su propio `tx` como parámetro y
// nunca usa el `prisma` importado a nivel de módulo -- pero outbox.ts sí
// lo importa arriba, y ese módulo lanza si DATABASE_URL no está definida
// al cargarse. Mismo placeholder que outbox.idempotency-key.test.ts.
process.env.DATABASE_URL ??=
  "postgresql://user:pass@localhost:5432/placeholder";

mock.module("lib/email/admin-recipients", {
  namedExports: {
    // Sin admins en este archivo -- el foco es solo el destinatario
    // customer, que es el que de verdad viene de un formulario sin
    // normalizar.
    getAdminNotificationEmails: () => [],
  },
});

type CreatedRow = {
  orderId: string;
  type: string;
  recipient: string;
  recipientNormalized: string;
  idempotencyKey: string;
};

function makeFakeTx() {
  const created: CreatedRow[] = [];
  const tx = {
    emailOutbox: {
      create: async (args: { data: Record<string, unknown> }) => {
        created.push(args.data as unknown as CreatedRow);
        return { id: `job-${created.length}` };
      },
    },
  };
  return { tx, created };
}

test("L: variantes de mayúsculas/espacios del mismo email -> mismo recipientNormalized e idempotencyKey", async () => {
  const { createEmailOutboxJobsForOrder } = await import("./outbox");

  const variantes = [
    "cliente@ejemplo.test",
    "Cliente@Ejemplo.test",
    "  cliente@ejemplo.test  ",
    "CLIENTE@EJEMPLO.TEST",
  ];

  const normalizados = new Set<string>();
  const keys = new Set<string>();

  for (const variante of variantes) {
    const { tx, created } = makeFakeTx();
    await createEmailOutboxJobsForOrder(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx as any,
      "order-l",
      variante,
      0,
    );
    const customerRow = created.find(
      (r) => r.type === "CUSTOMER_ORDER_CONFIRMATION",
    )!;
    normalizados.add(customerRow.recipientNormalized);
    keys.add(customerRow.idempotencyKey);
    // `recipient` (el valor real para enviar) nunca se altera -- se guarda
    // tal cual llegó, sin trim ni lowercase.
    assert.equal(customerRow.recipient, variante);
  }

  assert.equal(
    normalizados.size,
    1,
    `las ${variantes.length} variantes deben normalizar al mismo valor, hubo ${normalizados.size} distintos`,
  );
  assert.equal(
    keys.size,
    1,
    "las mismas variantes deben producir la MISMA idempotencyKey (mismo hash del mismo normalizado)",
  );
  assert.equal([...normalizados][0], "cliente@ejemplo.test");
});
