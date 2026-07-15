import {
  getWishlistItemsAction,
  saveWishlistItemsAction,
} from "./wishlist-actions";

// Adaptador Prisma/Postgres (Sprint 13). Mismo contrato público que antes
// (localStorage, Sprint 6) — components/wishlist/wishlist-store.tsx no
// cambia.
export const wishlistStorage = {
  getAll: getWishlistItemsAction,
  save: saveWishlistItemsAction,
};
