-- CreateIndex
CREATE INDEX "AttendanceSession_institutionId_date_idx" ON "AttendanceSession"("institutionId", "date");

-- CreateIndex
CREATE INDEX "FeePayment_institutionId_paidAt_idx" ON "FeePayment"("institutionId", "paidAt");

