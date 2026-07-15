import type { CartLine } from "./types";

// Versionada: si la forma de CartLine vuelve a cambiar, subir el número evita
// mezclar datos viejos incompatibles (mismo criterio que lib/wishlist).
const STORAGE_KEY = "lago-cart:v1";

function isCartLine(value: unknown): value is CartLine {
  const v = value as CartLine;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof v.id === "string" &&
    typeof v.productId === "string" &&
    typeof v.size === "string" &&
    typeof v.quantity === "number" &&
    typeof v.createdAt === "string"
  );
}

/**
 * Adaptador de persistencia del carrito.
 *
 * Hoy guarda en localStorage (sin backend ni cuenta de usuario todavía).
 * La API es async a propósito: cuando exista un usuario autenticado y una
 * base de datos (Postgres + Prisma), este es el único archivo a reemplazar
 * por llamadas a una API interna respaldada por Prisma —
 * components/cart-drawer/cart-store.tsx y todo lo que lo consume no
 * necesitan cambiar (ver docs/ARCHITECTURE.md).
 */
export const cartStorage = {
  async getAll(): Promise<CartLine[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isCartLine);
    } catch {
      return [];
    }
  },

  async save(lines: CartLine[]): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  },
};
