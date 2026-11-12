-- Circulars (official notices with PDF) and Houses (house/group system). Additive only:
-- two new feature tables, a points log, and an optional Student.houseId link.

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "houseId" TEXT;

-- CreateTable
CREATE TABLE "Circular" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "refNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "issuedBy" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "attachment" TEXT,
    "attachmentName" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Circular_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "House" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "description" TEXT,
    "mentorStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "House_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HousePointEntry" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "awardedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HousePointEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Circular_institutionId_issueDate_idx" ON "Circular"("institutionId", "issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Circular_institutionId_refNo_key" ON "Circular"("institutionId", "refNo");

-- CreateIndex
CREATE UNIQUE INDEX "House_institutionId_name_key" ON "House"("institutionId", "name");

-- CreateIndex
CREATE INDEX "HousePointEntry_houseId_createdAt_idx" ON "HousePointEntry"("houseId", "createdAt");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Circular" ADD CONSTRAINT "Circular_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "House" ADD CONSTRAINT "House_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "House" ADD CONSTRAINT "House_mentorStaffId_fkey" FOREIGN KEY ("mentorStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousePointEntry" ADD CONSTRAINT "HousePointEntry_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;

