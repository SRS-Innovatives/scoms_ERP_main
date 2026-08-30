-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_institutionId_fkey";

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "targetCourseId" TEXT,
ADD COLUMN     "targetSectionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "institutionId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Announcement_institutionId_createdAt_idx" ON "Announcement"("institutionId", "createdAt");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_targetCourseId_fkey" FOREIGN KEY ("targetCourseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_targetSectionId_fkey" FOREIGN KEY ("targetSectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

