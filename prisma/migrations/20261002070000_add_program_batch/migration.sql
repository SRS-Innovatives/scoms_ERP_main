-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "programId" TEXT;

-- AlterTable
ALTER TABLE "Semester" ADD COLUMN     "batchId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "batchId" TEXT;

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'UG',
    "durationYears" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Program_institutionId_code_key" ON "Program"("institutionId", "code");

-- CreateIndex
CREATE INDEX "Batch_institutionId_status_idx" ON "Batch"("institutionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_courseId_startYear_key" ON "Batch"("courseId", "startYear");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

