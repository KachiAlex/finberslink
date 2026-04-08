# PowerShell script to run manual database migration
# Run this in PowerShell to add missing columns to enrollment table

Write-Host "DATABASE MIGRATION - POWERSHELL + PSQL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Database connection parameters
# Replace these with your actual database credentials
$DB_HOST = "your-database-host.rds.amazonaws.com"  # or your PostgreSQL host
$DB_PORT = "5432"
$DB_NAME = "your_database_name"
$DB_USER = "your_username"
$DB_PASSWORD = "your_password"

# Alternative: Use DATABASE_URL if you have it
# $DATABASE_URL = "postgresql://username:password@host:port/database"

Write-Host "`nStep 1: Preparing SQL commands..." -ForegroundColor Yellow

# Create temporary SQL file
$sqlContent = @"
-- Add missing columns to enrollment table
-- This migration adds fields that exist in Prisma schema but not in database

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

-- Report completion
SELECT 'Enrollment table migration completed' as status;
"@

# Save SQL to temporary file
$sqlContent | Out-File -FilePath "temp_migration.sql" -Encoding UTF8
Write-Host "SQL file created: temp_migration.sql" -ForegroundColor Green

Write-Host "`nStep 2: Choose your connection method:" -ForegroundColor Yellow

Write-Host "`nOption 1: Using individual parameters" -ForegroundColor Cyan
Write-Host "Run this command (replace with your actual credentials):"
Write-Host "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f temp_migration.sql" -ForegroundColor White

Write-Host "`nOption 2: Using DATABASE_URL" -ForegroundColor Cyan
Write-Host "Set your DATABASE_URL environment variable:"
Write-Host "`$env:DATABASE_URL = 'postgresql://username:password@host:port/database'" -ForegroundColor White
Write-Host "Then run:"
Write-Host "psql `$env:DATABASE_URL -f temp_migration.sql" -ForegroundColor White

Write-Host "`nOption 3: Interactive connection" -ForegroundColor Cyan
Write-Host "psql will prompt for password:"
Write-Host "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f temp_migration.sql" -ForegroundColor White

Write-Host "`nStep 3: Alternative - Run commands directly" -ForegroundColor Yellow

Write-Host "`nIf you prefer to run commands one by one:" -ForegroundColor Cyan
$commands = @(
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS `"totalStudyTime`" INTEGER DEFAULT 0;",
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS `"streakDays`" INTEGER DEFAULT 0;",
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS `"averageScore`" DOUBLE PRECISION;",
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS `"engagementScore`" DOUBLE PRECISION DEFAULT 0;",
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS `"lastStreakDate`" TIMESTAMP(3);",
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS `"progressPercentage`" INTEGER DEFAULT 0;"
)

foreach ($cmd in $commands) {
    Write-Host "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c `"$cmd`"" -ForegroundColor White
}

Write-Host "`nStep 4: Verification" -ForegroundColor Yellow
Write-Host "After running migration, verify columns were added:" -ForegroundColor Cyan
Write-Host "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c `"SELECT column_name FROM information_schema.columns WHERE table_name = 'enrollment' ORDER BY column_name;`" -ForegroundColor White

Write-Host "`nStep 5: Cleanup" -ForegroundColor Yellow
Write-Host "Remove temporary SQL file:" -ForegroundColor Cyan
Write-Host "Remove-Item temp_migration.sql" -ForegroundColor White

Write-Host "`nMigration script ready!" -ForegroundColor Green
Write-Host "Choose your connection method and execute the commands." -ForegroundColor Green
