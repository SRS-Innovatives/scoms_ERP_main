-- AlterTable
ALTER TABLE "SubjectClassMapping" ADD COLUMN     "isElective" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "assessmentType" TEXT NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "internalExamIds" JSONB;

-- CreateTable
CREATE TABLE "StudentElective" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentElective_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentElective_subjectId_idx" ON "StudentElective"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentElective_studentId_subjectId_key" ON "StudentElective"("studentId", "subjectId");

-- AddForeignKey
ALTER TABLE "StudentElective" ADD CONSTRAINT "StudentElective_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentElective" ADD CONSTRAINT "StudentElective_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

