-- CreateEnum
CREATE TYPE "SubstituteStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SubstituteRequest" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "timetableEntryId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "originalStaffId" TEXT NOT NULL,
    "substituteStaffId" TEXT,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "SubstituteStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstituteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubstituteRequest_institutionId_status_idx" ON "SubstituteRequest"("institutionId", "status");

-- CreateIndex
CREATE INDEX "SubstituteRequest_substituteStaffId_date_idx" ON "SubstituteRequest"("substituteStaffId", "date");

-- AddForeignKey
ALTER TABLE "SubstituteRequest" ADD CONSTRAINT "SubstituteRequest_timetableEntryId_fkey" FOREIGN KEY ("timetableEntryId") REFERENCES "TimetableEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituteRequest" ADD CONSTRAINT "SubstituteRequest_originalStaffId_fkey" FOREIGN KEY ("originalStaffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituteRequest" ADD CONSTRAINT "SubstituteRequest_substituteStaffId_fkey" FOREIGN KEY ("substituteStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

