-- Add tutorEditingLocked column to Course table (idempotent)
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "tutorEditingLocked" BOOLEAN NOT NULL DEFAULT false;
