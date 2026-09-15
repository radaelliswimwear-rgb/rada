-- Snapshot de color/colección por línea de pedido (Sprint 30).
ALTER TABLE "OrderItem" ADD COLUMN "color" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "collection" TEXT;
