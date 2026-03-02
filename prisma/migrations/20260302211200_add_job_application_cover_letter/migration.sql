-- Add missing coverLetter column to match schema.prisma
ALTER TABLE "JobApplication" ADD COLUMN "coverLetter" TEXT;
