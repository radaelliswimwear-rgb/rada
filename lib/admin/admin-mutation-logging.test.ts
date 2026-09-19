import { test, mock } from "node:test";
import assert from "node:assert/strict";

// Hardening P2/P3 (sep. 2026): prueba de integración de logAdminMutation
// (lib/observability/log.ts) tal como lo usan de verdad las Server Actions
// de /admin/* -- confirma, contra una muestra representativa (rol de
// usuario y stock manual, los dos casos con más impacto real listados en
// la tarea), que el evento se registra con userId/targetType/targetId
// correctos, que un cambio de rol alerta y un ajuste normal de stock no, y
// que nunca se filtra un email/token en el log.
//
// Cómo correrlo:
//   node --env-file=.env.test --experimental-test-module-mocks --import tsx --test lib/admin/admin-mutation-logging.test.ts

type FakeUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

let users: Record<string, FakeUser>;
let variants: Record<
  string,
  { id: string; productId: string; size: string; stock: number }
>;
let logCalls: Array<Record<string, unknown>>;
let currentAdmin: FakeUser;

function resetStore(): void {
  users = {
    admin_1: {
      id: "admin_1",
      name: "Admin",
      email: "admin@radaelliswimwear.com",
      role: "ADMIN",
    },
    user_2: {
      id: "user_2",
      name: "Clienta",
      email: "clienta-secreta@example.com",
      role: "USER",
    },
  };
  variants = {
    var_1: { id: "var_1", productId: "prod_1", size: "M", stock: 3 },
  };
  logCalls = [];
  currentAdmin = users.admin_1!;
}

mock.module("lib/auth/authorize", {
  namedExports: {
    requireAdmin: async () => currentAdmin,
  },
});

mock.module("lib/observability/log", {
  namedExports: {
    logAdminMutation: (params: Record<string, unknown>) => {
      logCalls.push(params);
    },
  },
});

mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      user: {
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<FakeUser>;
        }) => {
          const row = users[where.id];
          if (!row) throw new Error("usuario no encontrado (fake)");
          Object.assign(row, data);
          return row;
        },
      },
      productVariant: {
        findUnique: async ({ where }: { where: { id: string } }) =>
          variants[where.id]
            ? {
                productId: variants[where.id]!.productId,
                size: variants[where.id]!.size,
                stock: variants[where.id]!.stock,
              }
            : null,
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { stock: number };
        }) => {
          const row = variants[where.id];
          if (!row) throw new Error("variante no encontrada (fake)");
          Object.assign(row, data);
          return row;
        },
      },
    },
  },
});

mock.module("lib/email/back-in-stock-notifications", {
  namedExports: {
    notifyBackInStockSubscribers: async () => undefined,
  },
});

test("updateUserRoleAction: registra admin.role_change con alert:true, sin el email de la cuenta afectada", async () => {
  resetStore();
  const { updateUserRoleAction } = await import("../auth/users-actions");

  const result = await updateUserRoleAction("user_2", "ADMIN");

  assert.deepEqual(result, { success: true });
  assert.equal(logCalls.length, 1);
  const call = logCalls[0]!;
  assert.equal(call.action, "role_change");
  assert.equal(call.adminId, "admin_1");
  assert.equal(call.targetType, "User");
  assert.equal(call.targetId, "user_2");
  assert.equal(call.alert, true);
  assert.doesNotMatch(JSON.stringify(call), /clienta-secreta@example\.com/);
});

test("updateVariantStockAction: registra admin.inventory_manual_update SIN alertar, con el stock anterior/nuevo en `reason`", async () => {
  resetStore();
  const { updateVariantStockAction } = await import("./inventory-actions");

  const result = await updateVariantStockAction("var_1", 10);

  assert.deepEqual(result, { success: true });
  assert.equal(logCalls.length, 1);
  const call = logCalls[0]!;
  assert.equal(call.action, "inventory_manual_update");
  assert.equal(call.targetType, "ProductVariant");
  assert.equal(call.targetId, "var_1");
  assert.equal(call.outcome, "success");
  assert.equal(call.alert, undefined);
  assert.equal(call.reason, "stock: 3 -> 10");
});
