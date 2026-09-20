-- CreateTable
CREATE TABLE "DynamicReportDefinition" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "filters" JSONB,
    "sortBy" TEXT,
    "sortDirection" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicReportDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DynamicReportDefinition_institutionId_idx" ON "DynamicReportDefinition"("institutionId");

-- AddForeignKey
ALTER TABLE "DynamicReportDefinition" ADD CONSTRAINT "DynamicReportDefinition_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

