-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "defaultCountry" TEXT NOT NULL DEFAULT 'Colombia',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'COP',
    "usdRate" DOUBLE PRECISION NOT NULL DEFAULT 4000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
