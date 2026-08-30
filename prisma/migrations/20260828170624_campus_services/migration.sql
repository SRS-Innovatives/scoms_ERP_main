-- AlterTable
ALTER TABLE "BookIssue" ADD COLUMN     "finePaid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Hostel" ADD COLUMN     "messType" TEXT,
ADD COLUMN     "warden" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "driverLicenseNumber" TEXT,
ADD COLUMN     "fcExpiryDate" TIMESTAMP(3),
ADD COLUMN     "gpsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "insuranceExpiryDate" TIMESTAMP(3),
ADD COLUMN     "licenseExpiryDate" TIMESTAMP(3),
ADD COLUMN     "vehicleType" TEXT NOT NULL DEFAULT 'BUS';

-- CreateTable
CREATE TABLE "VehicleTrip" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "tripDate" DATE NOT NULL,
    "session" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "VehicleTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelAttendance" (
    "id" TEXT NOT NULL,
    "hostelBedId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelVisitorLog" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "relationship" TEXT,
    "gatePassNo" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),

    CONSTRAINT "HostelVisitorLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleTrip_vehicleId_tripDate_session_key" ON "VehicleTrip"("vehicleId", "tripDate", "session");

-- CreateIndex
CREATE UNIQUE INDEX "HostelAttendance_hostelBedId_date_key" ON "HostelAttendance"("hostelBedId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HostelVisitorLog_gatePassNo_key" ON "HostelVisitorLog"("gatePassNo");

-- CreateIndex
CREATE UNIQUE INDEX "HostelBed_hostelId_roomNumber_bedNumber_key" ON "HostelBed"("hostelId", "roomNumber", "bedNumber");

-- AddForeignKey
ALTER TABLE "VehicleTrip" ADD CONSTRAINT "VehicleTrip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAttendance" ADD CONSTRAINT "HostelAttendance_hostelBedId_fkey" FOREIGN KEY ("hostelBedId") REFERENCES "HostelBed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelVisitorLog" ADD CONSTRAINT "HostelVisitorLog_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelVisitorLog" ADD CONSTRAINT "HostelVisitorLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

