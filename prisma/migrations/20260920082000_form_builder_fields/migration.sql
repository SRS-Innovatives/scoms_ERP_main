-- AlterTable
ALTER TABLE "AdmissionCustomField" ADD COLUMN     "helpText" TEXT,
ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visibilityCondition" JSONB;

