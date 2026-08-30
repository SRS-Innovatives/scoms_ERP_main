-- AlterTable
ALTER TABLE "ExamSchedule" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3);

