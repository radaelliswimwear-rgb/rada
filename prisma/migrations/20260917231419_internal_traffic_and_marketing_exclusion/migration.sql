-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "marketingExclusionReason" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "marketingExclusionReason" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "InternalTrafficActivationToken" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalTrafficActivationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalTrafficDevice" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "InternalTrafficDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternalTrafficActivationToken_tokenHash_key" ON "InternalTrafficActivationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "InternalTrafficActivationToken_expiresAt_idx" ON "InternalTrafficActivationToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "InternalTrafficDevice_tokenHash_key" ON "InternalTrafficDevice"("tokenHash");
