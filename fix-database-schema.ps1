# PowerShell script to check database tables and create enrollment table if needed

Write-Host "DATABASE SCHEMA DIAGNOSTIC" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Database connection
$env:DATABASE_URL = "postgresql://neondb_owner:npg_udNGF8hZj9vO@ep-young-math-anf24idu-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

Write-Host "`nStep 1: Check what tables exist in the database..." -ForegroundColor Yellow

# Check existing tables
$tablesQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
psql $env:DATABASE_URL -c $tablesQuery

Write-Host "`nStep 2: If 'enrollment' table doesn't exist, create it..." -ForegroundColor Yellow

# Create enrollment table if it doesn't exist
$createTableSQL = @"
CREATE TABLE IF NOT EXISTS "enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "progressPercentage" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalStudyTime" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastStreakDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollment_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on userId and courseId
ALTER TABLE "enrollment" ADD CONSTRAINT IF NOT EXISTS "enrollment_userId_courseId_key" UNIQUE ("userId", "courseId");

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_enrollment_user_status" ON "enrollment"("userId", "status");
CREATE INDEX IF NOT EXISTS "idx_enrollment_course_progress" ON "enrollment"("courseId", "progressPercentage");
CREATE INDEX IF NOT EXISTS "idx_enrollment_last_accessed" ON "enrollment"("lastAccessedAt");
"@

psql $env:DATABASE_URL -c $createTableSQL

Write-Host "`nStep 3: Verify enrollment table was created..." -ForegroundColor Yellow

# Check if enrollment table exists now
$checkTableQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollment';"
psql $env:DATABASE_URL -c $checkTableQuery

Write-Host "`nStep 4: Check enrollment table structure..." -ForegroundColor Yellow

# Show table structure
$structureQuery = "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'enrollment' ORDER BY ordinal_position;"
psql $env:DATABASE_URL -c $structureQuery

Write-Host "`nDatabase schema diagnostic completed!" -ForegroundColor Green
Write-Host "Now you can try course assignment functionality." -ForegroundColor Yellow
