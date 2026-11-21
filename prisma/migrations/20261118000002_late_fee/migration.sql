-- AlterTable
ALTER TABLE "FeeStructure" ADD COLUMN     "lateFeeGraceDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lateFeeMaxAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "StudentFeeAssignment" ADD COLUMN     "lateFeeCharged" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lateFeePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lateFeeWaived" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LateFeeEntry" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentFeeAssignmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMode" TEXT,
    "receiptNumber" TEXT,
    "reason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LateFeeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LateFeeEntry_receiptNumber_key" ON "LateFeeEntry"("receiptNumber");

-- CreateIndex
CREATE INDEX "LateFeeEntry_studentFeeAssignmentId_idx" ON "LateFeeEntry"("studentFeeAssignmentId");

-- CreateIndex
CREATE INDEX "LateFeeEntry_institutionId_createdAt_idx" ON "LateFeeEntry"("institutionId", "createdAt");

-- AddForeignKey
ALTER TABLE "LateFeeEntry" ADD CONSTRAINT "LateFeeEntry_studentFeeAssignmentId_fkey" FOREIGN KEY ("studentFeeAssignmentId") REFERENCES "StudentFeeAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

