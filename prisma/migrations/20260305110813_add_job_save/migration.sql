-- CreateTable
CREATE TABLE "JobSave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobOpportunityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobSave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobSave_userId_jobOpportunityId_key" ON "JobSave"("userId", "jobOpportunityId");

-- AddForeignKey
ALTER TABLE "JobSave" ADD CONSTRAINT "JobSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSave" ADD CONSTRAINT "JobSave_jobOpportunityId_fkey" FOREIGN KEY ("jobOpportunityId") REFERENCES "JobOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
