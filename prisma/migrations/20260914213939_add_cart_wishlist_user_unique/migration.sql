-- AlterTable: one Cart / one Wishlist per registered user (nulls stay
-- distinct in Postgres, so guest rows with userId=NULL are unaffected).
-- Verified no existing duplicate non-null userId values before this
-- migration was written.
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

CREATE UNIQUE INDEX "Wishlist_userId_key" ON "Wishlist"("userId");
