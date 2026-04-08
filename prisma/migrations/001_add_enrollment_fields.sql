-- Add missing columns to Enrollment table
-- This migration adds the fields that exist in Prisma schema but not in database

-- Add totalStudyTime column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollment' 
        AND column_name = 'totalStudyTime'
    ) THEN
        ALTER TABLE "enrollment" ADD COLUMN "totalStudyTime" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added totalStudyTime column';
    END IF;
END
$$;

-- Add streakDays column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollment' 
        AND column_name = 'streakDays'
    ) THEN
        ALTER TABLE "enrollment" ADD COLUMN "streakDays" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added streakDays column';
    END IF;
END
$$;

-- Add averageScore column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollment' 
        AND column_name = 'averageScore'
    ) THEN
        ALTER TABLE "enrollment" ADD COLUMN "averageScore" DOUBLE PRECISION;
        RAISE NOTICE 'Added averageScore column';
    END IF;
END
$$;

-- Add engagementScore column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollment' 
        AND column_name = 'engagementScore'
    ) THEN
        ALTER TABLE "enrollment" ADD COLUMN "engagementScore" DOUBLE PRECISION DEFAULT 0;
        RAISE NOTICE 'Added engagementScore column';
    END IF;
END
$$;

-- Add lastStreakDate column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollment' 
        AND column_name = 'lastStreakDate'
    ) THEN
        ALTER TABLE "enrollment" ADD COLUMN "lastStreakDate" TIMESTAMP(3);
        RAISE NOTICE 'Added lastStreakDate column';
    END IF;
END
$$;

-- Add progressPercentage column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollment' 
        AND column_name = 'progressPercentage'
    ) THEN
        ALTER TABLE "enrollment" ADD COLUMN "progressPercentage" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added progressPercentage column';
    END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_enrollment_user_status" ON "enrollment"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_enrollment_course_progress" ON "enrollment"("courseId", "progressPercentage");
CREATE INDEX IF NOT EXISTS "idx_enrollment_last_accessed" ON "enrollment"("lastAccessedAt");

-- Report completion
SELECT 'Enrollment table migration completed' as status;
