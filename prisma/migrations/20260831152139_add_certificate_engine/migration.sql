-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CertificateVisibility" AS ENUM ('SYSTEM', 'INSTITUTION');

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "renderedBody" TEXT,
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "icon" TEXT,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "CertificateVisibility" NOT NULL DEFAULT 'SYSTEM',
    "version" INTEGER NOT NULL DEFAULT 1,
    "headerTitle" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "footerNote" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'STUDENT',
    "inputType" TEXT NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "defaultValue" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CertificateField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionCertificateTemplate" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "customHeaderTitle" TEXT,
    "customBodyTemplate" TEXT,
    "customFooterNote" TEXT,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showSeal" BOOLEAN NOT NULL DEFAULT true,
    "showSignature" BOOLEAN NOT NULL DEFAULT true,
    "signatoryName" TEXT,
    "signatoryDesignation" TEXT,
    "issuePlace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionCertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CertificateTemplate_code_key" ON "CertificateTemplate"("code");

-- CreateIndex
CREATE INDEX "CertificateTemplate_status_idx" ON "CertificateTemplate"("status");

-- CreateIndex
CREATE INDEX "CertificateField_templateId_idx" ON "CertificateField"("templateId");

-- CreateIndex
CREATE INDEX "InstitutionCertificateTemplate_institutionId_idx" ON "InstitutionCertificateTemplate"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionCertificateTemplate_institutionId_templateId_key" ON "InstitutionCertificateTemplate"("institutionId", "templateId");

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateField" ADD CONSTRAINT "CertificateField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionCertificateTemplate" ADD CONSTRAINT "InstitutionCertificateTemplate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionCertificateTemplate" ADD CONSTRAINT "InstitutionCertificateTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

