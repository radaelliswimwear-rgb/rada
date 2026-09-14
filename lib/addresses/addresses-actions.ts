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

export async function createAddressAction(input: AddressInput): Promise<Address> {
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
    await tx.address.update({ where: { id: addressId }, data: input });
  });
}

export async function removeAddressAction(addressId: string): Promise<void> {
  const user = await requireUser();
  const target = await prisma.address.findUnique({ where: { id: addressId } });
  if (!target || target.userId !== user.id) return;
  await prisma.address.delete({ where: { id: addressId } }).catch(() => {});
}
