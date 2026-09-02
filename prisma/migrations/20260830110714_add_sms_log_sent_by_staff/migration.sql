-- AlterTable
ALTER TABLE "SmsLog" ADD COLUMN     "sentByStaffId" TEXT;

-- CreateIndex
CREATE INDEX "SmsLog_sentByStaffId_idx" ON "SmsLog"("sentByStaffId");

-- AddForeignKey
ALTER TABLE "SmsLog" ADD CONSTRAINT "SmsLog_sentByStaffId_fkey" FOREIGN KEY ("sentByStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

