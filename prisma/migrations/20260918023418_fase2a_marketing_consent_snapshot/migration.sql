-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "marketingConsentSnapshot" BOOLEAN;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "marketingConsentSnapshot" BOOLEAN;
