-- Add viewCount column to Resume
ALTER TABLE "Resume"
ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
