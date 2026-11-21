-- AlterTable
ALTER TABLE "FeePolicy" ADD COLUMN     "autoAdjustOnServiceChange" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoAssignOnAdmission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoAssignOnPromotion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "midYearChange" TEXT NOT NULL DEFAULT 'PRORATA',
ADD COLUMN     "onLeaving" TEXT NOT NULL DEFAULT 'KEEP';

-- AlterTable
ALTER TABLE "FeeStructureItem" ADD COLUMN     "rule" JSONB;

-- AlterTable
ALTER TABLE "StudentFeeItem" ADD COLUMN     "basisAmount" DOUBLE PRECISION,
ADD COLUMN     "note" TEXT;
