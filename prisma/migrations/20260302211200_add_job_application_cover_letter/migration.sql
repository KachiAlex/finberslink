-- Add missing coverLetter column to match schema.prisma
ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "coverLetter" TEXT;
