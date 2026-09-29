-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('CORE', 'STANDARD', 'PLUGIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ModuleDefinitionStatus" AS ENUM ('DRAFT', 'TESTING', 'PUBLISHED', 'ACTIVE', 'SUSPENDED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "ModuleAssignmentStatus" AS ENUM ('AVAILABLE', 'INSTALLED', 'ENABLED', 'DISABLED', 'SUSPENDED', 'TRIAL', 'EXPIRED');

-- CreateTable
CREATE TABLE "ModuleDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "moduleType" "ModuleType" NOT NULL DEFAULT 'STANDARD',
    "status" "ModuleDefinitionStatus" NOT NULL DEFAULT 'ACTIVE',
    "icon" TEXT,
    "frontendRoute" TEXT,
    "backendRoutePrefix" TEXT,
    "currentVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleVersion" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelog" TEXT,
    "configSchema" JSONB,
    "requiredPermissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleDependency" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "dependsOnModuleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionModuleAssignment" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" "ModuleAssignmentStatus" NOT NULL DEFAULT 'ENABLED',
    "installedVersion" TEXT,
    "config" JSONB,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionModuleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModuleDefinition_key_key" ON "ModuleDefinition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleVersion_moduleId_version_key" ON "ModuleVersion"("moduleId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleDependency_moduleId_dependsOnModuleId_key" ON "ModuleDependency"("moduleId", "dependsOnModuleId");

-- CreateIndex
CREATE INDEX "InstitutionModuleAssignment_institutionId_status_idx" ON "InstitutionModuleAssignment"("institutionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionModuleAssignment_institutionId_moduleId_key" ON "InstitutionModuleAssignment"("institutionId", "moduleId");

-- AddForeignKey
ALTER TABLE "ModuleVersion" ADD CONSTRAINT "ModuleVersion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ModuleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleDependency" ADD CONSTRAINT "ModuleDependency_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ModuleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleDependency" ADD CONSTRAINT "ModuleDependency_dependsOnModuleId_fkey" FOREIGN KEY ("dependsOnModuleId") REFERENCES "ModuleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionModuleAssignment" ADD CONSTRAINT "InstitutionModuleAssignment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionModuleAssignment" ADD CONSTRAINT "InstitutionModuleAssignment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ModuleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

