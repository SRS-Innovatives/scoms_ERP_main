-- CreateEnum
CREATE TYPE "TextbookLanguage" AS ENUM ('TAMIL', 'ENGLISH');
-- CreateTable
CREATE TABLE "PlatformAiSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "apiKey" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformAiSettings_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "TextbookContent" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "classGrade" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "language" "TextbookLanguage" NOT NULL,
    "chapterTitle" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TextbookContent_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "TextbookContent_institutionId_classGrade_subject_language_idx" ON "TextbookContent"("institutionId", "classGrade", "subject", "language");
-- AddForeignKey
ALTER TABLE "TextbookContent" ADD CONSTRAINT "TextbookContent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "TextbookContent" ADD CONSTRAINT "TextbookContent_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
