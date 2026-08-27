-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "gstin" TEXT;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "amount",
ADD COLUMN     "baseAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "billingPeriod" TEXT,
ADD COLUMN     "cgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 18,
ADD COLUMN     "igst" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "institutionGstin" TEXT,
ADD COLUMN     "paymentMode" TEXT,
ADD COLUMN     "placeOfSupply" TEXT,
ADD COLUMN     "planName" TEXT,
ADD COLUMN     "sacCode" TEXT NOT NULL DEFAULT '998313',
ADD COLUMN     "sgst" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "PlatformSetting" ADD COLUMN     "companyAddress" TEXT NOT NULL DEFAULT '100, Tech Park Road, Guindy, Chennai, Tamil Nadu - 600032',
ADD COLUMN     "companyGstin" TEXT NOT NULL DEFAULT '33AAAAA0000A1Z5',
ADD COLUMN     "companyName" TEXT NOT NULL DEFAULT 'SCOMS Educational Software Solutions Pvt. Ltd.',
ADD COLUMN     "companyState" TEXT NOT NULL DEFAULT 'Tamil Nadu';

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "sacCode" TEXT NOT NULL DEFAULT '998313';

-- CreateIndex
CREATE INDEX "Invoice_institutionId_idx" ON "Invoice"("institutionId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

