"use server";

import { prisma } from "lib/prisma";
import type { Address, AddressInput } from "./types";

// Server Actions Prisma/Postgres. addresses-repository.ts conserva los
// mismos nombres que antes (Sprint 9, localStorage) — la UI no cambia.
export async function listAddressesByUserAction(userId: string): Promise<Address[]> {
  return prisma.address.findMany({
    where: { userId },
    orderBy: { isDefault: "desc" },
  });
}

export async function createAddressAction(
  userId: string,
  input: AddressInput,
): Promise<Address> {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return tx.address.create({ data: { ...input, userId } });
  });
}

export async function updateAddressAction(
  addressId: string,
  input: Partial<AddressInput>,
): Promise<void> {
  const target = await prisma.address.findUnique({ where: { id: addressId } });
  if (!target) return;

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
  await prisma.address.delete({ where: { id: addressId } }).catch(() => {});
}
