-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS     "archivedAt" TIMESTAMP(3);
