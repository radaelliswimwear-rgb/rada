-- CreateTable
CREATE TABLE "ProductViewer" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductViewer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductViewer_productId_lastSeenAt_idx" ON "ProductViewer"("productId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductViewer_productId_sessionId_key" ON "ProductViewer"("productId", "sessionId");

-- AddForeignKey
ALTER TABLE "ProductViewer" ADD CONSTRAINT "ProductViewer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

