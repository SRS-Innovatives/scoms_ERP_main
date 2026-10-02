-- CreateEnum
CREATE TYPE "ExamMarkStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED', 'APPROVED');

-- CreateEnum
CREATE TYPE "CorrectionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "ExamSchedule" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "markStatus" "ExamMarkStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "reviewRemarks" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedById" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- AlterTable
ALTER TABLE "InstitutionSettings" ADD COLUMN     "examApprovalRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MarkCorrectionRequest" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "examScheduleId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "oldMarks" DOUBLE PRECISION,
    "oldIsAbsent" BOOLEAN,
    "newMarks" DOUBLE PRECISION,
    "newIsAbsent" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "status" "CorrectionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkCorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarkCorrectionRequest_institutionId_status_idx" ON "MarkCorrectionRequest"("institutionId", "status");

-- CreateIndex
CREATE INDEX "MarkCorrectionRequest_examScheduleId_idx" ON "MarkCorrectionRequest"("examScheduleId");

-- CreateIndex
CREATE INDEX "ExamSchedule_markStatus_idx" ON "ExamSchedule"("markStatus");

-- AddForeignKey
ALTER TABLE "MarkCorrectionRequest" ADD CONSTRAINT "MarkCorrectionRequest_examScheduleId_fkey" FOREIGN KEY ("examScheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkCorrectionRequest" ADD CONSTRAINT "MarkCorrectionRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: results already published were, by definition, approved under the legacy flow
UPDATE "ExamSchedule" SET "markStatus" = 'APPROVED', "approvedAt" = "publishedAt" WHERE "isPublished" = true;
