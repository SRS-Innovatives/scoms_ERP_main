-- CreateTable
CREATE TABLE "MaterialDownload" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "openCount" INTEGER NOT NULL DEFAULT 1,
    "firstOpenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOpenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialDownload_institutionId_idx" ON "MaterialDownload"("institutionId");

-- CreateIndex
CREATE INDEX "MaterialDownload_studentId_idx" ON "MaterialDownload"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialDownload_materialId_studentId_key" ON "MaterialDownload"("materialId", "studentId");

-- AddForeignKey
ALTER TABLE "MaterialDownload" ADD CONSTRAINT "MaterialDownload_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "StudyMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDownload" ADD CONSTRAINT "MaterialDownload_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

