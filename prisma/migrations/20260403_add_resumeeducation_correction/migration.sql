-- Corrective migration: add ResumeEducation table if missing
CREATE TABLE IF NOT EXISTS "ResumeEducation" (
  "id" TEXT NOT NULL,
  "resumeId" TEXT NOT NULL,
  "school" TEXT NOT NULL,
  "degree" TEXT,
  "field" TEXT,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ResumeEducation_pkey" PRIMARY KEY ("id")
);

-- Add FK to Resume (only if Resume exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Resume') THEN
    BEGIN
      ALTER TABLE "ResumeEducation" ADD CONSTRAINT "ResumeEducation_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      -- constraint already exists, ignore
      NULL;
    END;
  END IF;
END$$;
