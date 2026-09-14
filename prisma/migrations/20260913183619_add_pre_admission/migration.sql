-- CreateEnum
CREATE TYPE "PreAdmissionStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'ENROLLED', 'REJECTED', 'CONVERTED');

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "preAdmissionApiKey" TEXT;

-- CreateTable
CREATE TABLE "PreAdmissionApplication" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "receiptNumber" TEXT,
    "studentFirstName" TEXT NOT NULL,
    "studentLastName" TEXT,
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "classAppliedFor" TEXT,
    "courseApplied" TEXT,
    "academicYear" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT NOT NULL,
    "parentEmail" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "previousSchool" TEXT,
    "previousClass" TEXT,
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "submittedFromIp" TEXT,
    "rawPayload" JSONB,
    "status" "PreAdmissionStatus" NOT NULL DEFAULT 'NEW',
    "enrolledAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "convertedStudentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreAdmissionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PreAdmissionApplication_institutionId_status_idx" ON "PreAdmissionApplication"("institutionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PreAdmissionApplication_institutionId_applicationNumber_key" ON "PreAdmissionApplication"("institutionId", "applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_preAdmissionApiKey_key" ON "Institution"("preAdmissionApiKey");

-- AddForeignKey
ALTER TABLE "PreAdmissionApplication" ADD CONSTRAINT "PreAdmissionApplication_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreAdmissionApplication" ADD CONSTRAINT "PreAdmissionApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

