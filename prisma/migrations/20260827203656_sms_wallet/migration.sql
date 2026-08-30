-- CreateTable
CREATE TABLE "PlatformSmsWallet" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalPurchased" INTEGER NOT NULL DEFAULT 0,
    "totalAllocated" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSmsWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsPurchase" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amountINR" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "purchasedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionSmsWallet" (
    "institutionId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalAllocated" INTEGER NOT NULL DEFAULT 0,
    "totalUsed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionSmsWallet_pkey" PRIMARY KEY ("institutionId")
);

-- CreateTable
CREATE TABLE "SmsAllocation" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "note" TEXT,
    "allocatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmsAllocation_institutionId_idx" ON "SmsAllocation"("institutionId");

-- AddForeignKey
ALTER TABLE "InstitutionSmsWallet" ADD CONSTRAINT "InstitutionSmsWallet_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsAllocation" ADD CONSTRAINT "SmsAllocation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

