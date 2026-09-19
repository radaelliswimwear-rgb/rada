"use server";

import { prisma } from "lib/prisma";
import { requireUser } from "lib/auth/authorize";
import type { Address, AddressInput } from "./types";

// Server Actions Prisma/Postgres. addresses-repository.ts conserva los
// mismos nombres que antes (Sprint 9, localStorage). Sprint 26: ya no
// reciben un userId/addressId "de confianza" desde el cliente — antes
// cualquiera podía llamar estas acciones con el id de otra clienta y
// leer/crear/editar/borrar sus direcciones (auditoría de seguridad). Ahora
// el dueño siempre se deriva de la sesión real, y update/remove verifican
// que la dirección le pertenezca antes de tocarla.
export async function listAddressesByUserAction(): Promise<Address[]> {
  const user = await requireUser();
  return prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { isDefault: "desc" },
  });
}

export async function createAddressAction(
  input: AddressInput,
): Promise<Address> {
  const user = await requireUser();
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }
    return tx.address.create({ data: { ...input, userId: user.id } });
  });
}

export async function updateAddressAction(
  addressId: string,
  input: Partial<AddressInput>,
): Promise<void> {
  const user = await requireUser();
  const target = await prisma.address.findUnique({ where: { id: addressId } });
  if (!target || target.userId !== user.id) return;

  await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId: target.userId },
        data: { isDefault: false },
      });
    }
    // Auditoría de seguridad (sep. 2026): antes se pasaba `input` crudo
    // como `data` -- AddressInput excluye `userId` solo a nivel de tipo
    // TypeScript (Omit<...>), que se borra en runtime. Una llamada RPC
    // directa a este Server Action (el Next-Action-Id es público en el
    // bundle del cliente) podía incluir un `userId` propio en el segundo
    // argumento y reasignar la fila a otra cuenta -- Prisma lo acepta
    // porque es un campo escalar real del modelo. Mismo patrón defensivo
    // que ya usa createAddressAction: el `userId` real se escribe SIEMPRE
    // después del spread, nunca confiado del payload.
    await tx.address.update({
      where: { id: addressId },
      data: { ...input, userId: target.userId },
    });
  });
}

export async function removeAddressAction(addressId: string): Promise<void> {
  const user = await requireUser();
  const target = await prisma.address.findUnique({ where: { id: addressId } });
  if (!target || target.userId !== user.id) return;
  await prisma.address.delete({ where: { id: addressId } }).catch(() => {});
}
