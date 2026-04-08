# FINAL MIGRATION SCRIPT - Ready to use
# Fill in your database details below

# ===== CONFIGURE YOUR DATABASE CONNECTION =====
# Database details extracted from your DATABASE_URL

$DB_HOST = "ep-young-math-anf24idu-pooler.c-6.us-east-1.aws.neon.tech"
$DB_PORT = "5432"
$DB_NAME = "neondb"
$DB_USER = "neondb_owner"
$DB_PASSWORD = "npg_udNGF8hZj9vO"

# ===== ALTERNATIVE: Use DATABASE_URL directly =====
# Uncomment the line below to use DATABASE_URL instead of individual parameters
$env:DATABASE_URL = "postgresql://neondb_owner:npg_udNGF8hZj9vO@ep-young-math-anf24idu-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

Write-Host "RUNNING DATABASE MIGRATION" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

Write-Host "`nDatabase: ${DB_HOST}:${DB_PORT}/${DB_NAME}" -ForegroundColor Yellow
Write-Host "User: $DB_USER" -ForegroundColor Yellow

Write-Host "`nExecuting migration commands..." -ForegroundColor Cyan

# Method 1: Using DATABASE_URL (recommended)
if ($env:DATABASE_URL) {
    Write-Host "Using DATABASE_URL method..." -ForegroundColor Green
    psql $env:DATABASE_URL -f "prisma/migrations/001_add_enrollment_fields.sql"
} else {
    Write-Host "Using individual parameters method..." -ForegroundColor Green
    
    # Set password environment variable
    $env:PGPASSWORD = $DB_PASSWORD
    
    # Run the migration file
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "prisma/migrations/001_add_enrollment_fields.sql"
}

Write-Host "`nVerifying migration..." -ForegroundColor Cyan

# Check if columns were added
$verifyQuery = "SELECT column_name FROM information_schema.columns WHERE table_name = 'enrollment' AND column_name IN ('totalStudyTime', 'streakDays', 'averageScore', 'engagementScore', 'lastStreakDate', 'progressPercentage') ORDER BY column_name;"

if ($env:DATABASE_URL) {
    psql $env:DATABASE_URL -c $verifyQuery
} else {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $verifyQuery
}

Write-Host "`nMigration completed!" -ForegroundColor Green
Write-Host "Test course assignment functionality now." -ForegroundColor Yellow

# Clean up password environment variable
$env:PGPASSWORD = $null
