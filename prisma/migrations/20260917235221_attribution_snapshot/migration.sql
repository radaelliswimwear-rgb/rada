-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "attributionSnapshot" JSONB;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "attributionSnapshot" JSONB;
