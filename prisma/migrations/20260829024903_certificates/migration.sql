-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "details" JSONB,
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'BONAFIDE';

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

