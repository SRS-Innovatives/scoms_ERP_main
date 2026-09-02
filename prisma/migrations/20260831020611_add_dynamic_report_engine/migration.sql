-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('STUDENT', 'STAFF', 'ACADEMIC', 'ATTENDANCE', 'EXAMINATION', 'FEES', 'FINANCE', 'LIBRARY', 'HOSTEL', 'TRANSPORT', 'ADMISSION', 'COMMUNICATION', 'ADMINISTRATION', 'ANALYTICS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReportVisibility" AS ENUM ('SYSTEM', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "FilterInputType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'DATE_RANGE', 'SELECT', 'MULTI_SELECT', 'SEARCH_SELECT', 'CHECKBOX', 'RADIO', 'BOOLEAN', 'ACADEMIC_YEAR', 'DEPARTMENT', 'COURSE', 'SEMESTER', 'SECTION', 'SUBJECT', 'STUDENT', 'STAFF', 'PAYMENT_MODE', 'STATUS');

-- CreateEnum
CREATE TYPE "ReportRunStatus" AS ENUM ('SUCCESS', 'FAILED', 'RUNNING');

-- CreateEnum
CREATE TYPE "ReportRequestStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'IN_DEVELOPMENT', 'READY', 'REJECTED');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ReportCategory" NOT NULL,
    "module" TEXT,
    "icon" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "ReportVisibility" NOT NULL DEFAULT 'SYSTEM',
    "version" INTEGER NOT NULL DEFAULT 1,
    "allowedRoles" JSONB,
    "allowedFormats" JSONB,
    "handlerKey" TEXT NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportFilter" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "inputType" "FilterInputType" NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'string',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "placeholder" TEXT,
    "options" JSONB,
    "source" TEXT,
    "dependsOn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReportFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportColumn" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'string',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortable" BOOLEAN NOT NULL DEFAULT true,
    "width" INTEGER,
    "format" TEXT,
    "aggregation" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReportColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionReport" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayName" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "allowedRoles" JSONB,
    "allowedFormats" JSONB,
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRun" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "generatedById" TEXT,
    "filters" JSONB,
    "format" TEXT NOT NULL DEFAULT 'PREVIEW',
    "status" "ReportRunStatus" NOT NULL DEFAULT 'SUCCESS',
    "rowCount" INTEGER,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedReport" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRequest" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "sampleFileUrl" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" "ReportRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "assignedToId" TEXT,
    "adminRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_code_key" ON "Report"("code");

-- CreateIndex
CREATE INDEX "Report_category_idx" ON "Report"("category");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "ReportFilter_reportId_idx" ON "ReportFilter"("reportId");

-- CreateIndex
CREATE INDEX "ReportColumn_reportId_idx" ON "ReportColumn"("reportId");

-- CreateIndex
CREATE INDEX "InstitutionReport_institutionId_idx" ON "InstitutionReport"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionReport_institutionId_reportId_key" ON "InstitutionReport"("institutionId", "reportId");

-- CreateIndex
CREATE INDEX "ReportRun_institutionId_reportId_idx" ON "ReportRun"("institutionId", "reportId");

-- CreateIndex
CREATE INDEX "ReportRun_startedAt_idx" ON "ReportRun"("startedAt");

-- CreateIndex
CREATE INDEX "SavedReport_institutionId_reportId_idx" ON "SavedReport"("institutionId", "reportId");

-- CreateIndex
CREATE INDEX "ReportRequest_institutionId_idx" ON "ReportRequest"("institutionId");

-- CreateIndex
CREATE INDEX "ReportRequest_status_idx" ON "ReportRequest"("status");

-- AddForeignKey
ALTER TABLE "ReportFilter" ADD CONSTRAINT "ReportFilter_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportColumn" ADD CONSTRAINT "ReportColumn_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionReport" ADD CONSTRAINT "InstitutionReport_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionReport" ADD CONSTRAINT "InstitutionReport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedReport" ADD CONSTRAINT "SavedReport_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedReport" ADD CONSTRAINT "SavedReport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedReport" ADD CONSTRAINT "SavedReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRequest" ADD CONSTRAINT "ReportRequest_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRequest" ADD CONSTRAINT "ReportRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRequest" ADD CONSTRAINT "ReportRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

