-- AddColumn
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
