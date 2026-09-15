-- Auditoría de seguridad Wompi (Sprint 29)
-- reservedItems/stockReleased: reserva de inventario al cobrar, liberación si el pago falla/se cancela.
-- lastEventTimestamp: protección contra webhooks repetidos/fuera de orden.
-- updatedAt: trazabilidad general.
-- providerRef @unique: evita que dos Payment (y por lo tanto dos Order) queden asociados a la misma transacción real.
ALTER TABLE "Payment" ADD COLUMN "reservedItems" JSONB;
ALTER TABLE "Payment" ADD COLUMN "stockReleased" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Payment" ADD COLUMN "lastEventTimestamp" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");
