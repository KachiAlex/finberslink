-- Ensure the CourseApprovalStatus enum exists (older databases may not have it yet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'CourseApprovalStatus'
  ) THEN
    CREATE TYPE "CourseApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES');
  END IF;
END$$;

-- Add the missing approval status column required by the admin dashboard/courses views
ALTER TABLE "Course"
ADD COLUMN "approvalStatus" "CourseApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill existing rows with the default to avoid NULL issues
UPDATE "Course" SET "approvalStatus" = 'PENDING' WHERE "approvalStatus" IS NULL;
