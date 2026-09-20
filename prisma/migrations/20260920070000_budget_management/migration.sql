-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "period" TEXT NOT NULL,
    "allocatedAmount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Budget_institutionId_category_period_key" ON "Budget"("institutionId", "category", "period");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

