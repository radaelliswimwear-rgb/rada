import type { Address, AddressInput } from "./types";

// Adaptador reemplazable por Prisma (tabla `Address`, FK a `User`) sin tocar
// components/account/addresses-manager.tsx — mismo patrón que lib/cart y
// lib/wishlist (ver docs/ARCHITECTURE.md).
const STORAGE_KEY = "lago-addresses:v1";

function isAddress(value: unknown): value is Address {
  const v = value as Address;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof v.id === "string" &&
    typeof v.userId === "string" &&
    typeof v.label === "string" &&
    typeof v.fullName === "string" &&
    typeof v.street === "string" &&
    typeof v.city === "string" &&
    typeof v.postalCode === "string" &&
    typeof v.province === "string" &&
    typeof v.country === "string" &&
    typeof v.phone === "string" &&
    typeof v.isDefault === "boolean"
  );
}

async function getAll(): Promise<Address[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAddress);
  } catch {
    return [];
  }
}

async function saveAll(addresses: Address[]): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
}

export const addressesRepository = {
  async listByUser(userId: string): Promise<Address[]> {
    const all = await getAll();
    return all.filter((address) => address.userId === userId);
  },

  async create(userId: string, input: AddressInput): Promise<Address> {
    const all = await getAll();
    const address: Address = { id: crypto.randomUUID(), userId, ...input };
    if (address.isDefault) {
      all.forEach((a) => {
        if (a.userId === userId) a.isDefault = false;
      });
    }
    all.push(address);
    await saveAll(all);
    return address;
  },

  async update(
    addressId: string,
    input: Partial<AddressInput>,
  ): Promise<void> {
    const all = await getAll();
    const target = all.find((a) => a.id === addressId);
    if (!target) return;
    if (input.isDefault) {
      all.forEach((a) => {
        if (a.userId === target.userId) a.isDefault = false;
      });
    }
    Object.assign(target, input);
    await saveAll(all);
  },

  async remove(addressId: string): Promise<void> {
    const all = await getAll();
    await saveAll(all.filter((a) => a.id !== addressId));
  },
};
