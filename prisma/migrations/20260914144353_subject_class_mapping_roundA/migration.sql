-- DropIndex
DROP INDEX "Subject_courseId_code_key";

-- AlterTable
ALTER TABLE "ExamSchedule" ADD COLUMN     "courseId" TEXT;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "institutionId" TEXT,
ALTER COLUMN "courseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SubjectClassMapping" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectClassMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubjectClassMapping_courseId_idx" ON "SubjectClassMapping"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClassMapping_subjectId_courseId_key" ON "SubjectClassMapping"("subjectId", "courseId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectClassMapping" ADD CONSTRAINT "SubjectClassMapping_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectClassMapping" ADD CONSTRAINT "SubjectClassMapping_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

