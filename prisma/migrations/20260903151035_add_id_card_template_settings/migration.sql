-- AlterTable
ALTER TABLE "InstitutionSettings" ADD COLUMN     "idCardOrientation" TEXT NOT NULL DEFAULT 'VERTICAL',
ADD COLUMN     "idCardTemplate" TEXT NOT NULL DEFAULT 'CLASSIC';
