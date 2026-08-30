-- AlterTable
ALTER TABLE "TimetableEntry" DROP COLUMN "subjectName",
DROP COLUMN "teacherName",
ADD COLUMN     "label" TEXT,
ADD COLUMN     "staffId" TEXT,
ADD COLUMN     "subjectId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_institutionId_sectionId_key" ON "Timetable"("institutionId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableEntry_timetableId_dayOfWeek_period_key" ON "TimetableEntry"("timetableId", "dayOfWeek", "period");

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

