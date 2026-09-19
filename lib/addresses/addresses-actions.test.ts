import { test, mock } from "node:test";
import assert from "node:assert/strict";

// Auditoría de seguridad (sep. 2026) -- updateAddressAction pasaba `input`
// crudo como `data` a prisma.address.update: AddressInput excluye `userId`
// solo a nivel de TIPO (Omit<Address, "id" | "userId">), borrado en
// runtime. Una llamada RPC directa al Server Action (el Next-Action-Id es
// público en el bundle del cliente) podía incluir un `userId` propio en el
// payload y reasignar la fila de dirección a OTRA cuenta -- mass
// assignment / IDOR de escritura. El fix reusa el mismo patrón defensivo
// que ya usaba createAddressAction: el userId real se escribe SIEMPRE
// después del spread, nunca confiado del input.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/addresses/addresses-actions.test.ts

type FakeAddress = {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

let addresses: Record<string, FakeAddress>;
let currentUser: { id: string } | null;

function resetStore(): void {
  addresses = {};
}

mock.module("lib/auth/session", {
  namedExports: {
    getCurrentUser: async () => currentUser,
  },
});

mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      address: {
        findUnique: async ({ where }: { where: { id: string } }) =>
          addresses[where.id] ?? null,
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<FakeAddress>;
        }) => {
          const row = addresses[where.id];
          if (!row) throw new Error("no encontrado");
          Object.assign(row, data);
          return row;
        },
        updateMany: async () => ({ count: 0 }),
      },
      $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          address: {
            update: async ({
              where,
              data,
            }: {
              where: { id: string };
              data: Partial<FakeAddress>;
            }) => {
              const row = addresses[where.id];
              if (!row) throw new Error("no encontrado");
              Object.assign(row, data);
              return row;
            },
            updateMany: async () => ({ count: 0 }),
          },
        }),
    },
  },
});

test("mass assignment: un userId inyectado en el payload NUNCA reasigna la dirección a otra cuenta", async () => {
  resetStore();
  currentUser = { id: "user_atacante" };
  addresses["addr_del_atacante"] = {
    id: "addr_del_atacante",
    userId: "user_atacante",
    label: "Casa",
    fullName: "Atacante",
    street: "Calle 1",
    city: "Bogotá",
    postalCode: "110111",
    province: "Cundinamarca",
    country: "Colombia",
    phone: "+573000000000",
    isDefault: false,
  };

  const { updateAddressAction } = await import("./addresses-actions");

  // El propio dueño (user_atacante) llama a updateAddressAction sobre SU
  // PROPIA dirección, pero el payload incluye un `userId` de otra cuenta --
  // exactamente lo que una llamada RPC fabricada a mano podría mandar,
  // ignorando cualquier restricción de tipo de AddressInput.
  await updateAddressAction("addr_del_atacante", {
    label: "Casa hackeada",
    fullName: "Nombre inyectado",
    street: "Calle inyectada",
    city: "Bogotá",
    postalCode: "110111",
    province: "Cundinamarca",
    country: "Colombia",
    phone: "+573000000000",
    isDefault: false,
    // @ts-expect-error -- exactamente el campo que el tipo AddressInput
    // excluye, pero que runtime no puede impedir en una llamada RPC real.
    userId: "user_victima",
  });

  assert.equal(
    addresses["addr_del_atacante"]!.userId,
    "user_atacante",
    "el userId real NUNCA debe cambiar por un valor inyectado en el payload",
  );
  // El resto de los campos sí se actualiza normalmente -- el fix no rompe
  // la funcionalidad real de editar una dirección propia.
  assert.equal(addresses["addr_del_atacante"]!.label, "Casa hackeada");
});

test("edición normal: una clienta puede seguir editando su propia dirección sin userId en el payload", async () => {
  resetStore();
  currentUser = { id: "user_normal" };
  addresses["addr_normal"] = {
    id: "addr_normal",
    userId: "user_normal",
    label: "Casa",
    fullName: "Clienta",
    street: "Calle vieja",
    city: "Medellín",
    postalCode: "050021",
    province: "Antioquia",
    country: "Colombia",
    phone: "+573001112233",
    isDefault: false,
  };

  const { updateAddressAction } = await import("./addresses-actions");
  await updateAddressAction("addr_normal", {
    label: "Casa",
    fullName: "Clienta",
    street: "Calle nueva",
    city: "Medellín",
    postalCode: "050021",
    province: "Antioquia",
    country: "Colombia",
    phone: "+573001112233",
    isDefault: false,
  });

  assert.equal(addresses["addr_normal"]!.street, "Calle nueva");
  assert.equal(addresses["addr_normal"]!.userId, "user_normal");
});

test("IDOR ya existente sigue funcionando: no se puede editar la dirección de OTRA cuenta directamente", async () => {
  resetStore();
  currentUser = { id: "user_atacante" };
  addresses["addr_de_otra_cuenta"] = {
    id: "addr_de_otra_cuenta",
    userId: "user_victima",
    label: "Casa",
    fullName: "Víctima",
    street: "Calle víctima",
    city: "Cali",
    postalCode: "760001",
    province: "Valle del Cauca",
    country: "Colombia",
    phone: "+573009998888",
    isDefault: false,
  };

  const { updateAddressAction } = await import("./addresses-actions");
  await updateAddressAction("addr_de_otra_cuenta", {
    label: "Intento de edición ajena",
    fullName: "x",
    street: "x",
    city: "x",
    postalCode: "x",
    province: "x",
    country: "x",
    phone: "x",
    isDefault: false,
  });

  assert.equal(
    addresses["addr_de_otra_cuenta"]!.street,
    "Calle víctima",
    "el chequeo de pertenencia (target.userId !== user.id) debe seguir bloqueando esto",
  );
});
