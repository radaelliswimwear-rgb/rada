-- CreateEnum
CREATE TYPE "LogSeverity" AS ENUM ('INFO', 'WARN', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "severity" "LogSeverity" NOT NULL,
    "environment" TEXT NOT NULL,
    "requestId" TEXT,
    "paymentId" TEXT,
    "orderId" TEXT,
    "userId" TEXT,
    "provider" TEXT,
    "outcome" TEXT,
    "reason" TEXT,
    "dedupeKey" TEXT,
    "alertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemLog_event_createdAt_idx" ON "SystemLog"("event", "createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_severity_createdAt_idx" ON "SystemLog"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_dedupeKey_alertedAt_idx" ON "SystemLog"("dedupeKey", "alertedAt");
