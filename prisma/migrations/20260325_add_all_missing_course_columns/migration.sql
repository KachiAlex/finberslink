-- Add all missing Course columns to ensure schema is complete
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "draftStructure" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "certificateAvailable" BOOLEAN NOT NULL DEFAULT false;
-- Array columns need special handling in PostgreSQL
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "outcomes" TEXT[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "skills" TEXT[] NOT NULL DEFAULT '{}'::text[];
