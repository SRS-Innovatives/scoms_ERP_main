-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "hallTicketsReleased" BOOLEAN NOT NULL DEFAULT false;


-- Keep today's behaviour for exams already running: they stay downloadable.
UPDATE "Exam" SET "hallTicketsReleased" = true WHERE "status" IN ('SCHEDULED', 'ONGOING');
