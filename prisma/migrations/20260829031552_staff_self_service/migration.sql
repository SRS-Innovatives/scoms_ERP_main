-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'CASUAL';

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "altPhone" TEXT,
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankIfscCode" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "emergencyContactAddress" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelation" TEXT,
ADD COLUMN     "panNumber" TEXT;

