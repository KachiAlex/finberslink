-- backup via Neon UI if desired, then run:
ALTER TABLE "Resume"
ADD COLUMN IF NOT EXISTS template text NOT NULL DEFAULT 'modern';

-- verify
SELECT column_name
FROM information_schema.columns
WHERE table_schema='public' AND table_name='Resume' AND column_name='template';