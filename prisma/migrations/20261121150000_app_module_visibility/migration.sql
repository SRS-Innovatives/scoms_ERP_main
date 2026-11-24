-- CreateTable
CREATE TABLE "InstitutionAppModuleSetting" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "app" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionAppModuleSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstitutionAppModuleSetting_institutionId_app_idx" ON "InstitutionAppModuleSetting"("institutionId", "app");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionAppModuleSetting_institutionId_app_role_moduleKey_key" ON "InstitutionAppModuleSetting"("institutionId", "app", "role", "moduleKey");

-- AddForeignKey
ALTER TABLE "InstitutionAppModuleSetting" ADD CONSTRAINT "InstitutionAppModuleSetting_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
