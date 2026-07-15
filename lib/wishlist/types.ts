// Forma pensada para mapear 1:1 a una futura tabla `Wishlist` en Postgres/Prisma:
// productId -> Wishlist.productId (FK a Product), createdAt -> Wishlist.createdAt.
export type WishlistItem = {
  productId: string;
  createdAt: string;
};
