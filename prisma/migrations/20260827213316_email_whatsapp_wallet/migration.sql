-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'Simulated SMTP',
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SIMULATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformEmailWallet" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalPurchased" INTEGER NOT NULL DEFAULT 0,
    "totalAllocated" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformEmailWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailPurchase" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amountINR" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "purchasedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionEmailWallet" (
    "institutionId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalAllocated" INTEGER NOT NULL DEFAULT 0,
    "totalUsed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionEmailWallet_pkey" PRIMARY KEY ("institutionId")
);

-- CreateTable
CREATE TABLE "EmailAllocation" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "note" TEXT,
    "allocatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappLog" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "recipientPhone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'Simulated WABA',
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SIMULATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformWhatsappWallet" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalPurchased" INTEGER NOT NULL DEFAULT 0,
    "totalAllocated" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformWhatsappWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappPurchase" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amountINR" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "purchasedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionWhatsappWallet" (
    "institutionId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalAllocated" INTEGER NOT NULL DEFAULT 0,
    "totalUsed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionWhatsappWallet_pkey" PRIMARY KEY ("institutionId")
);

-- CreateTable
CREATE TABLE "WhatsappAllocation" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "note" TEXT,
    "allocatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_institutionId_createdAt_idx" ON "EmailLog"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailAllocation_institutionId_idx" ON "EmailAllocation"("institutionId");

-- CreateIndex
CREATE INDEX "WhatsappLog_institutionId_createdAt_idx" ON "WhatsappLog"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsappLog_status_idx" ON "WhatsappLog"("status");

-- CreateIndex
CREATE INDEX "WhatsappAllocation_institutionId_idx" ON "WhatsappAllocation"("institutionId");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionEmailWallet" ADD CONSTRAINT "InstitutionEmailWallet_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAllocation" ADD CONSTRAINT "EmailAllocation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappLog" ADD CONSTRAINT "WhatsappLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionWhatsappWallet" ADD CONSTRAINT "InstitutionWhatsappWallet_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappAllocation" ADD CONSTRAINT "WhatsappAllocation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

