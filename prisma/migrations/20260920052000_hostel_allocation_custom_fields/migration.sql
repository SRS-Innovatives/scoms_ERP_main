-- AlterEnum
ALTER TYPE "CustomFieldEntityType" ADD VALUE 'HOSTEL_ALLOCATION';

-- AlterTable
ALTER TABLE "HostelBed" ADD COLUMN     "customFields" JSONB;

