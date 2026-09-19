import { test, mock } from "node:test";
import assert from "node:assert/strict";

// Observabilidad (sep. 2026): logEvent es el único punto de entrada para
// loguear/alertar eventos críticos del sistema (ver el comentario largo en
// el propio archivo y en SystemLog, prisma/schema.prisma). Estos tests
// cubren exactamente las garantías que el proceso que originó este módulo
// pedía explícitamente: sanitización, no exposición de secretos/PII,
// dedupe/cooldown de alertas, y que un fallo de observabilidad NUNCA puede
// bloquear ni hacer fallar la operación que la llamó.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/observability/log.test.ts

type FakeLogRow = {
  id: string;
  dedupeKey: string | null;
  alertedAt: Date | null;
  createdAt: Date;
};

let rows: FakeLogRow[];
let nextId: number;
let createCalls: Array<Record<string, unknown>>;
let updateCalls: Array<{ id: string; data: Record<string, unknown> }>;
let createShouldThrow: boolean;
let findFirstShouldThrow: boolean;

let emailCalls: Array<{ to: string; subject: string; html: string }>;
let sendEmailShouldThrow: boolean;

const ADMIN_EMAILS = [
  "radaelliswimwear@gmail.com",
  "info@radaelliswimwear.com",
];

function resetStore(): void {
  rows = [];
  nextId = 1;
  createCalls = [];
  updateCalls = [];
  createShouldThrow = false;
  findFirstShouldThrow = false;
  emailCalls = [];
  sendEmailShouldThrow = false;
}

mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      systemLog: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          createCalls.push(data);
          if (createShouldThrow) throw new Error("DB caída (simulado)");
          const row: FakeLogRow = {
            id: `log_${nextId++}`,
            dedupeKey: (data.dedupeKey as string | null) ?? null,
            alertedAt: null,
            createdAt: new Date(),
          };
          rows.push(row);
          return row;
        },
        findFirst: async ({
          where,
        }: {
          where: { dedupeKey: string; alertedAt: { gte: Date } };
        }) => {
          if (findFirstShouldThrow) throw new Error("DB caída (simulado)");
          return (
            rows.find(
              (row) =>
                row.dedupeKey === where.dedupeKey &&
                row.alertedAt !== null &&
                row.alertedAt >= where.alertedAt.gte,
            ) ?? null
          );
        },
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          updateCalls.push({ id: where.id, data });
          const row = rows.find((r) => r.id === where.id);
          if (row && data.alertedAt instanceof Date) {
            row.alertedAt = data.alertedAt;
          }
          return row;
        },
      },
    },
  },
});

mock.module("lib/email/send", {
  namedExports: {
    sendEmail: async ({
      to,
      subject,
      html,
    }: {
      to: string;
      subject: string;
      html: string;
    }) => {
      if (sendEmailShouldThrow) throw new Error("Resend caído (simulado)");
      emailCalls.push({ to, subject, html });
      return { success: true };
    },
  },
});

mock.module("lib/email/admin-recipients", {
  namedExports: {
    getAdminNotificationEmails: () => ADMIN_EMAILS,
  },
});

test("logEvent persiste el evento con los campos dados y no alerta si alert no es true", async () => {
  resetStore();
  const { logEvent } = await import("./log");

  await logEvent({
    event: "payment.succeeded",
    severity: "info",
    paymentId: "pay_1",
  });

  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0]!.event, "payment.succeeded");
  assert.equal(createCalls[0]!.severity, "INFO");
  assert.equal(createCalls[0]!.paymentId, "pay_1");
  // Sin alert:true, dedupeKey nunca se persiste -- no hay nada que agrupar.
  assert.equal(createCalls[0]!.dedupeKey, null);
  assert.equal(
    emailCalls.length,
    0,
    "un evento sin alert:true nunca manda correo",
  );
});

test("logEvent trunca `reason` a un largo máximo -- no persiste ni alerta con texto arbitrariamente largo", async () => {
  resetStore();
  const { logEvent } = await import("./log");

  const hugeReason = "x".repeat(5000);
  await logEvent({
    event: "webhook.malformed",
    severity: "warn",
    reason: hugeReason,
  });

  const persistedReason = createCalls[0]!.reason as string;
  assert.ok(
    persistedReason.length <= 300,
    "reason debe truncarse a <= 300 caracteres",
  );
  assert.ok(persistedReason.length < hugeReason.length);
});

test("logEvent con alert:true y sin alerta previa manda un correo a cada admin y marca alertedAt", async () => {
  resetStore();
  const { logEvent } = await import("./log");

  await logEvent({
    event: "payment.flagged_for_review",
    severity: "critical",
    paymentId: "pay_2",
    reason: "APPROVED_LATE_STOCK_UNAVAILABLE",
    dedupeKey: "payment:pay_2:flagged",
    alert: true,
  });

  assert.equal(emailCalls.length, ADMIN_EMAILS.length);
  for (const call of emailCalls) {
    assert.ok(ADMIN_EMAILS.includes(call.to));
    assert.match(call.subject, /critical/);
    assert.match(call.subject, /payment\.flagged_for_review/);
  }
  assert.equal(updateCalls.length, 1);
  assert.ok(updateCalls[0]!.data.alertedAt instanceof Date);
});

test("logEvent con alert:true respeta el cooldown -- una alerta reciente con el mismo dedupeKey no repite el correo", async () => {
  resetStore();
  const { logEvent } = await import("./log");

  await logEvent({
    event: "webhook.signature_invalid",
    severity: "error",
    dedupeKey: "webhook.signature_invalid",
    alert: true,
  });
  assert.equal(
    emailCalls.length,
    ADMIN_EMAILS.length,
    "primera alerta sí manda correo",
  );

  emailCalls = [];
  await logEvent({
    event: "webhook.signature_invalid",
    severity: "error",
    dedupeKey: "webhook.signature_invalid",
    alert: true,
  });
  assert.equal(
    emailCalls.length,
    0,
    "segunda alerta del mismo tipo dentro del cooldown no debe repetir el correo",
  );
});

test("un evento distinto (dedupeKey distinto) SÍ alerta aunque haya una alerta reciente de otro tipo", async () => {
  resetStore();
  const { logEvent } = await import("./log");

  await logEvent({
    event: "payment.flagged_for_review",
    severity: "critical",
    dedupeKey: "payment:pay_a:flagged",
    alert: true,
  });
  emailCalls = [];
  await logEvent({
    event: "payment.flagged_for_review",
    severity: "critical",
    dedupeKey: "payment:pay_b:flagged",
    alert: true,
  });

  assert.equal(
    emailCalls.length,
    ADMIN_EMAILS.length,
    "un dedupeKey distinto (otro pago) no debe quedar suprimido por el cooldown de otro",
  );
});

test("un fallo al persistir en SystemLog nunca hace fallar logEvent (no bloqueante)", async () => {
  resetStore();
  createShouldThrow = true;
  const { logEvent } = await import("./log");

  await assert.doesNotReject(() =>
    logEvent({
      event: "payment.succeeded",
      severity: "info",
      paymentId: "pay_3",
    }),
  );
});

test("un fallo al chequear el cooldown nunca hace fallar logEvent, y igual intenta alertar", async () => {
  resetStore();
  findFirstShouldThrow = true;
  const { logEvent } = await import("./log");

  await assert.doesNotReject(() =>
    logEvent({
      event: "payment.wompi_reverification_failed",
      severity: "error",
      dedupeKey: "payment.wompi_reverification_failed",
      alert: true,
    }),
  );
  assert.equal(
    emailCalls.length,
    ADMIN_EMAILS.length,
    "si no se puede confirmar el cooldown, mejor alertar de más que quedarse callado",
  );
});

test("un fallo al enviar el correo de alerta nunca hace fallar logEvent (no bloqueante)", async () => {
  resetStore();
  sendEmailShouldThrow = true;
  const { logEvent } = await import("./log");

  await assert.doesNotReject(() =>
    logEvent({
      event: "checkout.hosted_start_url_failed",
      severity: "critical",
      dedupeKey: "checkout.hosted_start_url_failed",
      alert: true,
    }),
  );
});

test("el correo de alerta nunca incluye campos que no se pasaron explícitamente", async () => {
  resetStore();
  const { logEvent } = await import("./log");

  await logEvent({
    event: "auth.unauthorized_admin_access",
    severity: "warn",
    userId: "user_1",
    dedupeKey: "unauthorized_admin_access:user_1",
    alert: true,
  });

  const html = emailCalls[0]!.html;
  assert.match(html, /user_1/);
  // Ningún campo que no se pasó (paymentId/orderId/provider) debe aparecer
  // como etiqueta en la tabla del correo.
  assert.doesNotMatch(html, />Payment</);
  assert.doesNotMatch(html, />Order</);
  assert.doesNotMatch(html, />Proveedor</);
});

// ===========================================================================
// logAdminMutation (hardening P2/P3, sep. 2026)
// ===========================================================================

test("logAdminMutation arma el evento admin.<action> con userId/targetType/targetId, sin alertar por defecto", async () => {
  resetStore();
  const { logAdminMutation } = await import("./log");

  logAdminMutation({
    adminId: "admin_1",
    action: "product_update",
    targetType: "Product",
    targetId: "prod_1",
    outcome: "success",
  });
  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0]!.event, "admin.product_update");
  assert.equal(createCalls[0]!.userId, "admin_1");
  assert.equal(createCalls[0]!.targetType, "Product");
  assert.equal(createCalls[0]!.targetId, "prod_1");
  assert.equal(createCalls[0]!.severity, "INFO");
  assert.equal(emailCalls.length, 0);
});

test("logAdminMutation con outcome:failure loguea en warn", async () => {
  resetStore();
  const { logAdminMutation } = await import("./log");

  logAdminMutation({
    adminId: "admin_1",
    action: "coupon_create",
    targetType: "Coupon",
    outcome: "failure",
    reason: "código duplicado",
  });
  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(createCalls[0]!.severity, "WARN");
});

test("logAdminMutation con alert:true SÍ manda alerta (ej. cambio de rol)", async () => {
  resetStore();
  const { logAdminMutation } = await import("./log");

  logAdminMutation({
    adminId: "admin_1",
    action: "role_change",
    targetType: "User",
    targetId: "user_2",
    outcome: "success",
    reason: "role: USER -> ADMIN",
    alert: true,
  });
  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(emailCalls.length, ADMIN_EMAILS.length);
});

test("logAdminMutation nunca bloquea a quien la llama, aunque falle la persistencia", async () => {
  resetStore();
  createShouldThrow = true;
  const { logAdminMutation } = await import("./log");

  // No debe lanzar de forma síncrona ni devolver una promesa que rechace --
  // se llama exactamente como se llamaría en código real (sin await).
  assert.doesNotThrow(() => {
    logAdminMutation({
      adminId: "admin_1",
      action: "product_delete",
      targetType: "Product",
      targetId: "prod_1",
      outcome: "success",
    });
  });
});
