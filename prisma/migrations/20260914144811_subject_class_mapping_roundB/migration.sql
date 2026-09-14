-- DropForeignKey
ALTER TABLE "ExamSchedule" DROP CONSTRAINT "ExamSchedule_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_courseId_fkey";

-- AlterTable
ALTER TABLE "ExamSchedule" ALTER COLUMN "courseId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "courseId",
ALTER COLUMN "institutionId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subject_institutionId_code_key" ON "Subject"("institutionId", "code");

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

