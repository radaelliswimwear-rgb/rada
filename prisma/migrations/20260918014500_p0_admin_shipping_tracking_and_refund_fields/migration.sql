-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dispatchedAt" TIMESTAMP(3),
ADD COLUMN     "freeShippingThresholdSnapshot" INTEGER,
ADD COLUMN     "quotedShippingCost" INTEGER,
ADD COLUMN     "shippingCarrier" TEXT,
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "trackingUrl" TEXT;
