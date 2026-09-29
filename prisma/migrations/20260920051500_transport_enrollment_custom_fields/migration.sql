-- AlterEnum
ALTER TYPE "CustomFieldEntityType" ADD VALUE 'TRANSPORT_ENROLLMENT';

-- AlterTable
ALTER TABLE "StudentTransportMapping" ADD COLUMN     "customFields" JSONB;

