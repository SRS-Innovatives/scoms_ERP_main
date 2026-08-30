-- CreateTable
CREATE TABLE "EquipmentIssue" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "EquipmentIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EquipmentIssue_assetId_idx" ON "EquipmentIssue"("assetId");

-- CreateIndex
CREATE INDEX "EquipmentIssue_studentId_idx" ON "EquipmentIssue"("studentId");

-- CreateIndex
CREATE INDEX "EquipmentIssue_staffId_idx" ON "EquipmentIssue"("staffId");

-- AddForeignKey
ALTER TABLE "EquipmentIssue" ADD CONSTRAINT "EquipmentIssue_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentIssue" ADD CONSTRAINT "EquipmentIssue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentIssue" ADD CONSTRAINT "EquipmentIssue_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

