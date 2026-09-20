-- CreateEnum
CREATE TYPE "IntegrationChannel" AS ENUM ('SMS', 'EMAIL', 'WHATSAPP', 'PAYMENT_GATEWAY', 'CLOUD_STORAGE', 'VIDEO_MEETING', 'BIOMETRIC', 'RFID', 'GPS_TRACKING');

-- CreateEnum
CREATE TYPE "IntegrationProviderStatus" AS ENUM ('LIVE', 'SIMULATED', 'NOT_IMPLEMENTED');

-- CreateTable
CREATE TABLE "IntegrationProvider" (
    "id" TEXT NOT NULL,
    "channel" "IntegrationChannel" NOT NULL,
    "providerName" TEXT NOT NULL,
    "status" "IntegrationProviderStatus" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrationProvider_channel_idx" ON "IntegrationProvider"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationProvider_channel_providerName_key" ON "IntegrationProvider"("channel", "providerName");

