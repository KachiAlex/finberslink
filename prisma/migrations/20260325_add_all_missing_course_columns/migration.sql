-- Add all missing Course columns to ensure schema is complete
ALTER TABLE "Course" ADD COLUMN "draftStructure" JSONB DEFAULT '{}';
ALTER TABLE "Course" ADD COLUMN "certificateAvailable" BOOLEAN NOT NULL DEFAULT false;
-- Array columns need special handling in PostgreSQL
ALTER TABLE "Course" ADD COLUMN "outcomes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Course" ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
