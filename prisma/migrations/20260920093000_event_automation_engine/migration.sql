-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('SEND_SMS', 'SEND_EMAIL', 'SEND_WHATSAPP');

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "actionType" "AutomationActionType" NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventLog_institutionId_eventType_createdAt_idx" ON "EventLog"("institutionId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AutomationRule_institutionId_triggerEvent_isActive_idx" ON "AutomationRule"("institutionId", "triggerEvent", "isActive");

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

