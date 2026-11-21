-- AlterEnum
ALTER TYPE "PaymentMode" ADD VALUE 'CREDIT';

-- AlterTable
ALTER TABLE "FeePayment" ADD COLUMN     "creditAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FeeStructure" ADD COLUMN     "policyOverride" JSONB;

-- CreateTable
CREATE TABLE "FeePolicy" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "partialPayment" TEXT NOT NULL DEFAULT 'ALLOWED',
    "minPaymentType" TEXT NOT NULL DEFAULT 'NONE',
    "minPaymentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "counterHeadChoice" BOOLEAN NOT NULL DEFAULT true,
    "lateFeeOrder" TEXT NOT NULL DEFAULT 'SEPARATE',
    "oldestFeeFirst" BOOLEAN NOT NULL DEFAULT false,
    "excessPayment" TEXT NOT NULL DEFAULT 'REJECT',
    "creditUse" TEXT NOT NULL DEFAULT 'MANUAL',
    "creditRefundable" BOOLEAN NOT NULL DEFAULT true,
    "creditSiblingTransfer" BOOLEAN NOT NULL DEFAULT false,
    "holds" JSONB,
    "holdTrigger" TEXT NOT NULL DEFAULT 'ANY_OVERDUE',
    "holdDays" INTEGER NOT NULL DEFAULT 0,
    "holdAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "holdIncludeLateFee" BOOLEAN NOT NULL DEFAULT true,
    "remindersEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderBeforeDays" INTEGER NOT NULL DEFAULT 3,
    "reminderOnDueDate" BOOLEAN NOT NULL DEFAULT true,
    "reminderAfterEveryDays" INTEGER NOT NULL DEFAULT 7,
    "reminderAfterMaxTimes" INTEGER NOT NULL DEFAULT 3,
    "reminderRecipients" TEXT NOT NULL DEFAULT 'BOTH',
    "reminderMessage" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeCredit" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "feePaymentId" TEXT,
    "reason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentFeeCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeHoldExemption" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "holdTypes" JSONB,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeHoldExemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeReminderLog" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "targetKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    "sentOn" TEXT NOT NULL,
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeePolicy_institutionId_key" ON "FeePolicy"("institutionId");

-- CreateIndex
CREATE INDEX "StudentFeeCredit_studentId_idx" ON "StudentFeeCredit"("studentId");

-- CreateIndex
CREATE INDEX "StudentFeeCredit_institutionId_createdAt_idx" ON "StudentFeeCredit"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX "FeeHoldExemption_studentId_idx" ON "FeeHoldExemption"("studentId");

-- CreateIndex
CREATE INDEX "FeeHoldExemption_institutionId_idx" ON "FeeHoldExemption"("institutionId");

-- CreateIndex
CREATE INDEX "FeeReminderLog_institutionId_createdAt_idx" ON "FeeReminderLog"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX "FeeReminderLog_assignmentId_idx" ON "FeeReminderLog"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeReminderLog_targetKey_kind_seq_key" ON "FeeReminderLog"("targetKey", "kind", "seq");

-- AddForeignKey
ALTER TABLE "StudentFeeCredit" ADD CONSTRAINT "StudentFeeCredit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeHoldExemption" ADD CONSTRAINT "FeeHoldExemption_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
