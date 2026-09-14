-- CreateEnum
CREATE TYPE "CustomFieldEntityType" AS ENUM ('ADMISSION', 'STAFF_PROFILE');

-- CreateEnum
CREATE TYPE "InstitutionListType" AS ENUM ('LEAVE_TYPE', 'DISCIPLINE_CATEGORY', 'EXAM_TYPE');

-- DropIndex
DROP INDEX "AdmissionCustomField_institutionId_fieldKey_key";

-- DropIndex
DROP INDEX "AdmissionCustomField_institutionId_status_idx";

-- AlterTable
ALTER TABLE "AdmissionCustomField" ADD COLUMN     "entityType" "CustomFieldEntityType" NOT NULL DEFAULT 'ADMISSION';

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "customFields" JSONB;

-- CreateTable
CREATE TABLE "InstitutionCustomList" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "listType" "InstitutionListType" NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionCustomList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstitutionCustomList_institutionId_listType_idx" ON "InstitutionCustomList"("institutionId", "listType");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionCustomList_institutionId_listType_code_key" ON "InstitutionCustomList"("institutionId", "listType", "code");

-- CreateIndex
CREATE INDEX "AdmissionCustomField_institutionId_entityType_status_idx" ON "AdmissionCustomField"("institutionId", "entityType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionCustomField_institutionId_entityType_fieldKey_key" ON "AdmissionCustomField"("institutionId", "entityType", "fieldKey");

-- AddForeignKey
ALTER TABLE "InstitutionCustomList" ADD CONSTRAINT "InstitutionCustomList_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

