-- CreateTable
CREATE TABLE "InstitutionSettings" (
    "institutionId" TEXT NOT NULL,
    "smtpHost" TEXT,
    "smtpPort" TEXT,
    "smtpFromEmail" TEXT,
    "smsProvider" TEXT,
    "smsSenderId" TEXT,
    "smsDltEntityId" TEXT,
    "paymentGatewayProvider" TEXT,
    "paymentKeyId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionSettings_pkey" PRIMARY KEY ("institutionId")
);

-- AddForeignKey
ALTER TABLE "InstitutionSettings" ADD CONSTRAINT "InstitutionSettings_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

