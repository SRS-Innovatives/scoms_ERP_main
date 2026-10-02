-- CreateEnum
CREATE TYPE "ConcessionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

-- CreateTable
CREATE TABLE "ConcessionScheme" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SCHOLARSHIP',
    "valueType" TEXT NOT NULL DEFAULT 'PERCENT',
    "value" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConcessionScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConcessionApplication" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeAssignmentId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceNo" TEXT,
    "status" "ConcessionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConcessionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConcessionScheme_institutionId_code_key" ON "ConcessionScheme"("institutionId", "code");

-- CreateIndex
CREATE INDEX "ConcessionApplication_institutionId_status_idx" ON "ConcessionApplication"("institutionId", "status");

-- CreateIndex
CREATE INDEX "ConcessionApplication_feeAssignmentId_idx" ON "ConcessionApplication"("feeAssignmentId");

-- AddForeignKey
ALTER TABLE "ConcessionApplication" ADD CONSTRAINT "ConcessionApplication_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "ConcessionScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcessionApplication" ADD CONSTRAINT "ConcessionApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcessionApplication" ADD CONSTRAINT "ConcessionApplication_feeAssignmentId_fkey" FOREIGN KEY ("feeAssignmentId") REFERENCES "StudentFeeAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

