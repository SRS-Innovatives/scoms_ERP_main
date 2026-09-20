-- AlterEnum
ALTER TYPE "CustomFieldEntityType" ADD VALUE 'FEE_ASSIGNMENT';

-- AlterTable
ALTER TABLE "StudentFeeAssignment" ADD COLUMN     "customFields" JSONB;

