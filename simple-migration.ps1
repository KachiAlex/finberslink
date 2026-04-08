# Simple PowerShell script for database migration

Write-Host "DATABASE MIGRATION - POWERSHELL + PSQL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Method 1: Using DATABASE_URL (recommended)
Write-Host "Method 1: Using DATABASE_URL" -ForegroundColor Yellow
Write-Host "Set your DATABASE_URL:" -ForegroundColor Cyan
Write-Host '$env:DATABASE_URL = "postgresql://username:password@host:port/database"' -ForegroundColor White
Write-Host "Then run:" -ForegroundColor Cyan
Write-Host 'psql $env:DATABASE_URL -f prisma/migrations/001_add_enrollment_fields.sql' -ForegroundColor White

Write-Host "`nMethod 2: Direct SQL commands" -ForegroundColor Yellow
Write-Host "Run these commands one by one:" -ForegroundColor Cyan

$commands = @(
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS totalStudyTime INTEGER DEFAULT 0;",
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS streakDays INTEGER DEFAULT 0;",
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS averageScore DOUBLE PRECISION;",
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS engagementScore DOUBLE PRECISION DEFAULT 0;",
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS lastStreakDate TIMESTAMP(3);",
    "ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS progressPercentage INTEGER DEFAULT 0;"
)

foreach ($cmd in $commands) {
    Write-Host "psql -h your-host -p 5432 -U your-user -d your-database -c `"$cmd`"" -ForegroundColor White
}

Write-Host "`nMethod 3: Using parameters" -ForegroundColor Yellow
Write-Host "psql -h your-host -p 5432 -U your-user -d your-database -f prisma/migrations/001_add_enrollment_fields.sql" -ForegroundColor White

Write-Host "`nVerification:" -ForegroundColor Yellow
Write-Host "psql -h your-host -p 5432 -U your-user -d your-database -c `"SELECT column_name FROM information_schema.columns WHERE table_name = 'enrollment' AND column_name IN ('totalStudyTime', 'streakDays', 'averageScore', 'engagementScore', 'lastStreakDate', 'progressPercentage');`"" -ForegroundColor White

Write-Host "`nReplace your-host, your-user, your-database with actual values" -ForegroundColor Red
