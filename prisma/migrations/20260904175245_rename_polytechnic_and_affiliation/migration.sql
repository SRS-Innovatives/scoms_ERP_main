-- AlterEnum
BEGIN;
CREATE TYPE "InstitutionType_new" AS ENUM ('SCHOOL', 'COLLEGE', 'AUTONOMOUS_COLLEGE', 'UNIVERSITY');
ALTER TABLE "Institution" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Institution" ALTER COLUMN "type" TYPE "InstitutionType_new" USING ("type"::text::"InstitutionType_new");
ALTER TYPE "InstitutionType" RENAME TO "InstitutionType_old";
ALTER TYPE "InstitutionType_new" RENAME TO "InstitutionType";
DROP TYPE "InstitutionType_old";
ALTER TABLE "Institution" ALTER COLUMN "type" SET DEFAULT 'SCHOOL';
COMMIT;
-- AlterTable
ALTER TABLE "DegreeRecord" ADD COLUMN     "issuingInstitutionId" TEXT;
-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "conductedByInstitutionId" TEXT;
-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "affiliatedUniversityId" TEXT;
-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_affiliatedUniversityId_fkey" FOREIGN KEY ("affiliatedUniversityId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_conductedByInstitutionId_fkey" FOREIGN KEY ("conductedByInstitutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DegreeRecord" ADD CONSTRAINT "DegreeRecord_issuingInstitutionId_fkey" FOREIGN KEY ("issuingInstitutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
