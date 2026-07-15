import { getCartLinesAction, saveCartLinesAction } from "./cart-actions";

// Adaptador Prisma/Postgres (Sprint 12). Mismo contrato público que antes
// (localStorage, Sprint 8) — components/cart-drawer/cart-store.tsx no cambia.
export const cartStorage = {
  getAll: getCartLinesAction,
  save: saveCartLinesAction,
};
