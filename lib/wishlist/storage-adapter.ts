import type { WishlistItem } from "./types";

// Versionada a propósito: el Sprint 4.5 guardaba un string[] bajo "lago-wishlist"
// en localStorage. Cambiar de clave evita mezclar ese formato viejo con el actual
// (objetos WishlistItem) en los navegadores que ya tenían datos guardados.
const STORAGE_KEY = "lago-wishlist:v1";

function isWishlistItem(value: unknown): value is WishlistItem {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as WishlistItem).productId === "string" &&
    typeof (value as WishlistItem).createdAt === "string"
  );
}

/**
 * Adaptador de persistencia de la wishlist.
 *
 * Hoy guarda en localStorage (sin backend ni cuenta de usuario todavía).
 * La API es async a propósito: cuando exista un usuario autenticado y una
 * base de datos (Postgres + Prisma), este es el único archivo a reemplazar
 * por llamadas a una API interna (ej. `fetch("/api/wishlist")`) respaldada
 * por Prisma. `components/wishlist/wishlist-store.tsx` y todo lo que la
 * consume (Navbar, tarjetas de producto, /favoritos) no necesitan cambiar.
 */
export const wishlistStorage = {
  async getAll(): Promise<WishlistItem[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Descarta cualquier entrada que no tenga la forma esperada
      // (datos corruptos, de una versión anterior, o editados a mano).
      return parsed.filter(isWishlistItem);
    } catch {
      return [];
    }
  },

  async save(items: WishlistItem[]): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },
};
