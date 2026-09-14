-- CreateEnum
CREATE TYPE "DegreeStatus" AS ENUM ('PENDING', 'ISSUED', 'REVOKED');
-- CreateTable
CREATE TABLE "ResearchPublication" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publicationType" TEXT NOT NULL DEFAULT 'JOURNAL',
    "journalName" TEXT,
    "publicationDate" TIMESTAMP(3) NOT NULL,
    "doiOrLink" TEXT,
    "coAuthors" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResearchPublication_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "AlumniRecord" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT,
    "fullName" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "courseName" TEXT,
    "currentEmployer" TEXT,
    "currentDesignation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "testimonial" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AlumniRecord_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "DegreeRecord" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "degreeName" TEXT NOT NULL,
    "degreeNumber" TEXT,
    "convocationDate" TIMESTAMP(3),
    "issuedDate" TIMESTAMP(3),
    "status" "DegreeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DegreeRecord_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "ResearchPublication_institutionId_staffId_idx" ON "ResearchPublication"("institutionId", "staffId");
-- CreateIndex
CREATE UNIQUE INDEX "AlumniRecord_studentId_key" ON "AlumniRecord"("studentId");
-- CreateIndex
CREATE INDEX "AlumniRecord_institutionId_graduationYear_idx" ON "AlumniRecord"("institutionId", "graduationYear");
-- CreateIndex
CREATE INDEX "DegreeRecord_institutionId_status_idx" ON "DegreeRecord"("institutionId", "status");
-- CreateIndex
CREATE UNIQUE INDEX "DegreeRecord_studentId_degreeName_key" ON "DegreeRecord"("studentId", "degreeName");
-- AddForeignKey
ALTER TABLE "ResearchPublication" ADD CONSTRAINT "ResearchPublication_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ResearchPublication" ADD CONSTRAINT "ResearchPublication_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "AlumniRecord" ADD CONSTRAINT "AlumniRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "AlumniRecord" ADD CONSTRAINT "AlumniRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DegreeRecord" ADD CONSTRAINT "DegreeRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "DegreeRecord" ADD CONSTRAINT "DegreeRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
