-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "preAdmissionFeeAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PreAdmissionApplication" ADD COLUMN     "feeAmount" DOUBLE PRECISION,
ADD COLUMN     "feePaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "feePaidAt" TIMESTAMP(3),
ADD COLUMN     "feePaymentId" TEXT;

