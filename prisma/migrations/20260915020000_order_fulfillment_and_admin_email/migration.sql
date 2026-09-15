-- Sprint 30: estado logístico del pedido, numeración legible, e historial de estado.

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDIENTE_POR_PREPARAR', 'PREPARANDO', 'CLIENTE_CONTACTADO', 'ENTREGA_COORDINADA', 'DESPACHADO', 'ENTREGADO', 'CANCELADO', 'REEMBOLSADO');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable: fulfillmentStatus
ALTER TABLE "Order" ADD COLUMN "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'PENDIENTE_POR_PREPARAR';

-- AlterTable: orderNumber (correlativo legible, empieza en 1000)
CREATE SEQUENCE "Order_orderNumber_seq" AS INTEGER START WITH 1000;
ALTER TABLE "Order" ADD COLUMN "orderNumber" INTEGER NOT NULL DEFAULT nextval('"Order_orderNumber_seq"');
ALTER SEQUENCE "Order_orderNumber_seq" OWNED BY "Order"."orderNumber";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateTable: historial de cambios de estado logístico
CREATE TABLE "OrderStatusEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "FulfillmentStatus" NOT NULL,
    "changedByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderStatusEvent_orderId_createdAt_idx" ON "OrderStatusEvent"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
