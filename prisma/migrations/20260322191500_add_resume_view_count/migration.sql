-- Add viewCount column to Resume
ALTER TABLE "Resume"
ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
