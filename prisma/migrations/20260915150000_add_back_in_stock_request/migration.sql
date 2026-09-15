-- CreateEnum
CREATE TYPE "BackInStockStatus" AS ENUM ('PENDING', 'NOTIFIED', 'FAILED');

-- CreateTable
CREATE TABLE "BackInStockRequest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "status" "BackInStockStatus" NOT NULL DEFAULT 'PENDING',
    "notifiedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackInStockRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackInStockRequest_productId_size_status_idx" ON "BackInStockRequest"("productId", "size", "status");

-- CreateIndex
CREATE INDEX "BackInStockRequest_email_idx" ON "BackInStockRequest"("email");

-- CreateIndex
-- Único parcial: solo mientras la solicitud sigue activa (PENDING). Permite
-- pedir un aviso nuevo si la misma talla se agota otra vez en el futuro,
-- sin perder el historial de la solicitud anterior ya resuelta (NOTIFIED o
-- FAILED). Prisma no expresa "unique parcial" en schema.prisma, así que
-- este índice se agrega a mano acá (ver comentario del modelo BackInStockRequest).
CREATE UNIQUE INDEX "BackInStockRequest_active_unique" ON "BackInStockRequest"("productId", "size", "email") WHERE "status" = 'PENDING';

-- AddForeignKey
ALTER TABLE "BackInStockRequest" ADD CONSTRAINT "BackInStockRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackInStockRequest" ADD CONSTRAINT "BackInStockRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
