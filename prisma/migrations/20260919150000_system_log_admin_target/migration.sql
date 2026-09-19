-- AlterTable
ALTER TABLE "SystemLog" ADD COLUMN     "targetType" TEXT,
ADD COLUMN     "targetId" TEXT;

-- CreateIndex
CREATE INDEX "SystemLog_targetType_targetId_idx" ON "SystemLog"("targetType", "targetId");
