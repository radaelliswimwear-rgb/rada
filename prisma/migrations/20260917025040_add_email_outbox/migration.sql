-- CreateEnum
CREATE TYPE "EmailOutboxType" AS ENUM ('ADMIN_NEW_ORDER', 'CUSTOMER_ORDER_CONFIRMATION');

-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "EmailOutboxType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "recipientNormalized" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "freeShippingThresholdSnapshot" INTEGER,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailOutbox_idempotencyKey_key" ON "EmailOutbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_attemptCount_idx" ON "EmailOutbox"("status", "attemptCount");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOutbox_orderId_type_recipientNormalized_key" ON "EmailOutbox"("orderId", "type", "recipientNormalized");

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
