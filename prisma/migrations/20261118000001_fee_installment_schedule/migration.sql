-- AlterTable
ALTER TABLE "StudentFeeAssignment" ADD COLUMN     "installmentBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "installmentPlan" TEXT NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "FeeStructureInstallment" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "label" TEXT,
    "percent" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeStructureInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructureInstallment_feeStructureId_installmentNumber_key" ON "FeeStructureInstallment"("feeStructureId", "installmentNumber");

-- AddForeignKey
ALTER TABLE "FeeStructureInstallment" ADD CONSTRAINT "FeeStructureInstallment_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Existing per-student plans (made on Installment Setup) become CUSTOM plans. Their base is
-- what was paid outside those instalments, so each plan keeps covering exactly what it did.
UPDATE "StudentFeeAssignment" a
SET "installmentPlan" = 'CUSTOM',
    "installmentBase" = GREATEST(0, a."paidAmount" - COALESCE((SELECT SUM(i."paidAmount") FROM "FeeInstallment" i WHERE i."studentFeeAssignmentId" = a."id"), 0))
WHERE EXISTS (SELECT 1 FROM "FeeInstallment" i WHERE i."studentFeeAssignmentId" = a."id");
