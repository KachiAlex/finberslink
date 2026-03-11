-- CreateTable
CREATE TABLE "DashboardInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "focus" JSONB NOT NULL,
    "skills" JSONB,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardInsight_userId_key" ON "DashboardInsight"("userId");

-- AddForeignKey
ALTER TABLE "DashboardInsight" ADD CONSTRAINT "DashboardInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
