-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0;
