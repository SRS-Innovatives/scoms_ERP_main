-- CreateEnum
CREATE TYPE "StudentExitType" AS ENUM ('WITHDRAWAL', 'TRANSFER');

-- CreateEnum
CREATE TYPE "StudentExitStatus" AS ENUM ('REQUESTED', 'CLEARANCE_PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "StudentExitRecord" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "exitType" "StudentExitType" NOT NULL,
    "reason" TEXT NOT NULL,
    "transferToInstitution" TEXT,
    "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitDate" TIMESTAMP(3),
    "status" "StudentExitStatus" NOT NULL DEFAULT 'REQUESTED',
    "libraryCleared" BOOLEAN NOT NULL DEFAULT false,
    "feesCleared" BOOLEAN NOT NULL DEFAULT false,
    "hostelCleared" BOOLEAN NOT NULL DEFAULT false,
    "processedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentExitRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentExitRecord_institutionId_status_idx" ON "StudentExitRecord"("institutionId", "status");

-- CreateIndex
CREATE INDEX "StudentExitRecord_studentId_idx" ON "StudentExitRecord"("studentId");

-- AddForeignKey
ALTER TABLE "StudentExitRecord" ADD CONSTRAINT "StudentExitRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExitRecord" ADD CONSTRAINT "StudentExitRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

