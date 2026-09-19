-- AlterTable
-- El DEFAULT false se aplica por Postgres a TODA fila ya existente en el
-- momento de correr esta migración -- es el backfill completo (ninguna
-- fila histórica de MarketingEventOutbox queda elegible para batch/retry
-- automático), sin ningún UPDATE separado y sin tocar status/attemptCount/
-- lastError/eventId de ninguna fila existente.
ALTER TABLE "MarketingEventOutbox" ADD COLUMN     "eligibleForBatch" BOOLEAN NOT NULL DEFAULT false;

-- DropIndex
DROP INDEX "MarketingEventOutbox_status_attemptCount_idx";

-- CreateIndex
CREATE INDEX "MarketingEventOutbox_eligibleForBatch_status_attemptCount_idx" ON "MarketingEventOutbox"("eligibleForBatch", "status", "attemptCount");
