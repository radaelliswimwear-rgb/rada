-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "analyticsConsentSnapshot" BOOLEAN,
ADD COLUMN     "userAgentSnapshot" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "analyticsConsentSnapshot" BOOLEAN,
ADD COLUMN     "userAgentSnapshot" TEXT;
