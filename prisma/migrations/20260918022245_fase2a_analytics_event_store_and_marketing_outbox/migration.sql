-- CreateEnum
CREATE TYPE "AnalyticsEventName" AS ENUM ('PAGE_VIEW', 'VIEW_ITEM_LIST', 'SELECT_ITEM', 'VIEW_ITEM', 'ADD_TO_WISHLIST', 'ADD_TO_CART', 'VIEW_CART', 'REMOVE_FROM_CART', 'BEGIN_CHECKOUT', 'ADD_SHIPPING_INFO', 'ADD_PAYMENT_INFO', 'PURCHASE', 'SEARCH', 'SELECT_SIZE', 'CLICK_WHATSAPP', 'FILTER_USE', 'COUPON_APPLY', 'PAYMENT_FAILED');

-- CreateEnum
CREATE TYPE "DeviceCategory" AS ENUM ('MOBILE', 'DESKTOP', 'TABLET', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MarketingEventName" AS ENUM ('PURCHASE');

-- CreateEnum
CREATE TYPE "MarketingEventProvider" AS ENUM ('META');

-- CreateEnum
CREATE TYPE "MarketingEventOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventName" "AnalyticsEventName" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analyticsSessionId" TEXT,
    "productId" TEXT,
    "variant" TEXT,
    "quantity" INTEGER,
    "value" INTEGER,
    "currency" TEXT DEFAULT 'COP',
    "path" TEXT,
    "deviceCategory" "DeviceCategory",
    "attributionSnapshot" JSONB,
    "orderId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingEventOutbox" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventName" "MarketingEventName" NOT NULL,
    "provider" "MarketingEventProvider" NOT NULL,
    "eventId" TEXT NOT NULL,
    "payloadSnapshot" JSONB NOT NULL,
    "status" "MarketingEventOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingEventOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventName_occurredAt_idx" ON "AnalyticsEvent"("eventName", "occurredAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_analyticsSessionId_idx" ON "AnalyticsEvent"("analyticsSessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_productId_idx" ON "AnalyticsEvent"("productId");

-- CreateIndex
CREATE INDEX "MarketingEventOutbox_status_attemptCount_idx" ON "MarketingEventOutbox"("status", "attemptCount");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingEventOutbox_orderId_eventName_provider_key" ON "MarketingEventOutbox"("orderId", "eventName", "provider");

-- AddForeignKey
ALTER TABLE "MarketingEventOutbox" ADD CONSTRAINT "MarketingEventOutbox_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
