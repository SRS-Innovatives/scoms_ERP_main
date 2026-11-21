-- CreateTable
CREATE TABLE "ExamDuty" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'INVIGILATOR',
    "roomLabel" TEXT,
    "remarks" TEXT,
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamDuty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamDuty_institutionId_idx" ON "ExamDuty"("institutionId");

-- CreateIndex
CREATE INDEX "ExamDuty_staffId_idx" ON "ExamDuty"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamDuty_scheduleId_staffId_key" ON "ExamDuty"("scheduleId", "staffId");

-- AddForeignKey
ALTER TABLE "ExamDuty" ADD CONSTRAINT "ExamDuty_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamDuty" ADD CONSTRAINT "ExamDuty_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

