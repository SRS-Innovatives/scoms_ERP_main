-- AddForeignKey
ALTER TABLE "SubjectTeacherMapping" ADD CONSTRAINT "SubjectTeacherMapping_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

