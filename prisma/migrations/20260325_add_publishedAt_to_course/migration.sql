-- Add publishedAt column to Course table
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
