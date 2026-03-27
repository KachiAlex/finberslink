-- Add pending tutor-edit review and archive metadata to Course.
-- IF NOT EXISTS keeps this safe across environments that already received db push.
ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "pendingEdit" JSONB,
  ADD COLUMN IF NOT EXISTS "hasPendingEdit" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
