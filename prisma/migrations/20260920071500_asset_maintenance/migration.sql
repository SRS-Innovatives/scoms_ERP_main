-- CreateEnum
CREATE TYPE "AssetMaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AssetMaintenanceRecord" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "completedDate" DATE,
    "cost" DOUBLE PRECISION,
    "vendorId" TEXT,
    "status" "AssetMaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetMaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssetMaintenanceRecord_assetId_status_idx" ON "AssetMaintenanceRecord"("assetId", "status");

-- AddForeignKey
ALTER TABLE "AssetMaintenanceRecord" ADD CONSTRAINT "AssetMaintenanceRecord_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenanceRecord" ADD CONSTRAINT "AssetMaintenanceRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

