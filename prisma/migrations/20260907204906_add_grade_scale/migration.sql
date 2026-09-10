-- CreateTable
CREATE TABLE "GradeScale" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "minPercentage" DOUBLE PRECISION NOT NULL,
    "maxPercentage" DOUBLE PRECISION NOT NULL,
    "gradePoint" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeScale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeScale_institutionId_idx" ON "GradeScale"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeScale_institutionId_grade_key" ON "GradeScale"("institutionId", "grade");

-- AddForeignKey
ALTER TABLE "GradeScale" ADD CONSTRAINT "GradeScale_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

