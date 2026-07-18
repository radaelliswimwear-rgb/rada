-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "sku" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "promotionalViews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "realViews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "showViews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sku" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

