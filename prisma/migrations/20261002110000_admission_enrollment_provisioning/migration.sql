-- AlterEnum
ALTER TYPE "PreAdmissionStatus" ADD VALUE 'DOCUMENTS_VERIFIED';

-- AlterTable
ALTER TABLE "PreAdmissionApplication" ADD COLUMN     "documentChecklist" JSONB,
ADD COLUMN     "documentsVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "documentsVerifiedById" TEXT;

