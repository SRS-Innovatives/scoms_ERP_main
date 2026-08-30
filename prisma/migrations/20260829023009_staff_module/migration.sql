-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "staffType" TEXT NOT NULL DEFAULT 'TEACHING';

-- CreateTable
CREATE TABLE "StaffQualification" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "yearOfPassing" INTEGER NOT NULL,
    "grade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffExperience" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSalary" (
    "staffId" TEXT NOT NULL,
    "basicPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "da" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherAllowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSalary_pkey" PRIMARY KEY ("staffId")
);

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendance_staffId_date_key" ON "StaffAttendance"("staffId", "date");

-- AddForeignKey
ALTER TABLE "StaffQualification" ADD CONSTRAINT "StaffQualification_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffExperience" ADD CONSTRAINT "StaffExperience_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSalary" ADD CONSTRAINT "StaffSalary_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

