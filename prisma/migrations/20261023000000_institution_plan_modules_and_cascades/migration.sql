-- Catches the migration history up with schema.prisma: these changes existed in the
-- schema (applied locally via db push) but no migration created them, so a fresh
-- database (e.g. Supabase) was missing them. IF [NOT] EXISTS keeps this safe on
-- databases that already have them.

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN IF NOT EXISTS "modules" JSONB,
ADD COLUMN IF NOT EXISTS "planName" TEXT;

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_departmentId_fkey";
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_institutionId_fkey";
ALTER TABLE "Section" DROP CONSTRAINT IF EXISTS "Section_semesterId_fkey";
ALTER TABLE "Semester" DROP CONSTRAINT IF EXISTS "Semester_academicYearId_fkey";
ALTER TABLE "Semester" DROP CONSTRAINT IF EXISTS "Semester_courseId_fkey";
ALTER TABLE "SubjectTeacherMapping" DROP CONSTRAINT IF EXISTS "SubjectTeacherMapping_staffId_fkey";
ALTER TABLE "SubjectTeacherMapping" DROP CONSTRAINT IF EXISTS "SubjectTeacherMapping_subjectId_fkey";

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Section" ADD CONSTRAINT "Section_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubjectTeacherMapping" ADD CONSTRAINT "SubjectTeacherMapping_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubjectTeacherMapping" ADD CONSTRAINT "SubjectTeacherMapping_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
