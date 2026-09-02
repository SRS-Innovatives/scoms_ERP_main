-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "attended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "attendedAt" TIMESTAMP(3);

