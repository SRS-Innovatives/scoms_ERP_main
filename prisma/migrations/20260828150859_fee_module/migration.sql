-- AlterTable
ALTER TABLE "FeePayment" ADD COLUMN     "installmentId" TEXT;

-- AlterTable
ALTER TABLE "FeeStructure" ADD COLUMN     "category" "FeeCategoryType" NOT NULL DEFAULT 'TUITION_FEE',
ADD COLUMN     "lateFeePerDay" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StudentFeeAssignment" ADD COLUMN     "scholarshipName" TEXT,
ADD COLUMN     "scholarshipRef" TEXT;

-- CreateTable
CREATE TABLE "FeeInstallment" (
    "id" TEXT NOT NULL,
    "studentFeeAssignmentId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeRefund" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "bankAccount" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeRefund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeeInstallment_studentFeeAssignmentId_installmentNumber_key" ON "FeeInstallment"("studentFeeAssignmentId", "installmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeAssignment_feeStructureId_studentId_key" ON "StudentFeeAssignment"("feeStructureId", "studentId");

-- AddForeignKey
ALTER TABLE "FeeInstallment" ADD CONSTRAINT "FeeInstallment_studentFeeAssignmentId_fkey" FOREIGN KEY ("studentFeeAssignmentId") REFERENCES "StudentFeeAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "FeeInstallment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRefund" ADD CONSTRAINT "FeeRefund_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRefund" ADD CONSTRAINT "FeeRefund_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

