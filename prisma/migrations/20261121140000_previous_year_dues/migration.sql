-- AlterTable
ALTER TABLE "FeePolicy" ADD COLUMN     "carryForward" TEXT NOT NULL DEFAULT 'KEEP',
ADD COLUMN     "carryForwardLateFee" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "previousYearDues" TEXT NOT NULL DEFAULT 'ALLOW',
ADD COLUMN     "previousYearMinDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "previousYearOverride" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "promotionWithDues" TEXT NOT NULL DEFAULT 'WARN';

-- CreateTable
CREATE TABLE "FeeDuesException" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,

    CONSTRAINT "FeeDuesException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeeDuesException_institutionId_idx" ON "FeeDuesException"("institutionId");

-- CreateIndex
CREATE INDEX "FeeDuesException_studentId_idx" ON "FeeDuesException"("studentId");

-- AddForeignKey
ALTER TABLE "FeeDuesException" ADD CONSTRAINT "FeeDuesException_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

