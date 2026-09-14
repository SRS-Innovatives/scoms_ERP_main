-- CreateEnum
CREATE TYPE "CustomFieldStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'EMAIL', 'PHONE', 'TEXTAREA', 'SELECT', 'CHECKBOX');

-- AlterTable
ALTER TABLE "PreAdmissionApplication" ADD COLUMN     "customFields" JSONB;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "customFields" JSONB;

-- CreateTable
CREATE TABLE "AdmissionCustomField" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "CustomFieldType" NOT NULL DEFAULT 'TEXT',
    "section" TEXT NOT NULL DEFAULT 'Additional Information',
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "CustomFieldStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdmissionCustomField_institutionId_status_idx" ON "AdmissionCustomField"("institutionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionCustomField_institutionId_fieldKey_key" ON "AdmissionCustomField"("institutionId", "fieldKey");

-- AddForeignKey
ALTER TABLE "AdmissionCustomField" ADD CONSTRAINT "AdmissionCustomField_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

