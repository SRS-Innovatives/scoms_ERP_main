-- AlterTable
ALTER TABLE "InstitutionSettings" ADD COLUMN     "staffAttendanceSmsEnabled" BOOLEAN NOT NULL DEFAULT true;
-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "classTeacherId" TEXT;
-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
