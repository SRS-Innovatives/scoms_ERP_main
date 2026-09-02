-- CreateTable
CREATE TABLE "ParentMeetingNote" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "parentName" TEXT,
    "discussionNotes" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentMeetingNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParentMeetingNote_staffId_idx" ON "ParentMeetingNote"("staffId");

-- CreateIndex
CREATE INDEX "ParentMeetingNote_studentId_idx" ON "ParentMeetingNote"("studentId");

-- AddForeignKey
ALTER TABLE "ParentMeetingNote" ADD CONSTRAINT "ParentMeetingNote_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentMeetingNote" ADD CONSTRAINT "ParentMeetingNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentMeetingNote" ADD CONSTRAINT "ParentMeetingNote_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

