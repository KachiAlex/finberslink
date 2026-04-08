# Verification script to check actual database structure

Write-Host "DATABASE VERIFICATION SCRIPT" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Database connection
$env:DATABASE_URL = "postgresql://neondb_owner:npg_udNGF8hZj9vO@ep-young-math-anf24idu-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

Write-Host "`nStep 1: Check if enrollment table exists..." -ForegroundColor Yellow

# Check if enrollment table exists
$tableCheck = psql $env:DATABASE_URL -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enrollment');" -t
$tableExists = $tableCheck.Trim()

Write-Host "Enrollment table exists: $tableExists" -ForegroundColor Cyan

if ($tableExists -eq "t") {
    Write-Host "`nStep 2: Check all columns in enrollment table..." -ForegroundColor Yellow
    
    # Get all columns with exact names
    $columnsQuery = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'enrollment' ORDER BY ordinal_position;"
    $columns = psql $env:DATABASE_URL -c $columnsQuery
    
    Write-Host "Columns in enrollment table:" -ForegroundColor Green
    Write-Host $columns
    
    Write-Host "`nStep 3: Check for totalStudyTime column specifically..." -ForegroundColor Yellow
    
    # Check for totalStudyTime with different casings
    $totalStudyTimeCheck = psql $env:DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'enrollment' AND column_name ILIKE 'totalstudytime';" -t
    $hasTotalStudyTime = $totalStudyTimeCheck.Trim()
    
    Write-Host "totalStudyTime column found: $hasTotalStudyTime" -ForegroundColor Cyan
    
    if ($hasTotalStudyTime) {
        Write-Host "Column exists with name: $hasTotalStudyTime" -ForegroundColor Green
    } else {
        Write-Host "totalStudyTime column NOT found - this is the problem!" -ForegroundColor Red
        
        Write-Host "`nStep 4: Add missing totalStudyTime column..." -ForegroundColor Yellow
        
        # Add the column
        try {
            psql $env:DATABASE_URL -c "ALTER TABLE enrollment ADD COLUMN totalStudyTime INTEGER DEFAULT 0;"
            Write-Host "totalStudyTime column added successfully!" -ForegroundColor Green
        } catch {
            Write-Host "Failed to add totalStudyTime column: $_" -ForegroundColor Red
        }
    }
    
    Write-Host "`nStep 5: Check other required columns..." -ForegroundColor Yellow
    
    $requiredColumns = @("streakDays", "averageScore", "engagementScore", "lastStreakDate", "progressPercentage")
    
    foreach ($col in $requiredColumns) {
        $colCheck = psql $env:DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'enrollment' AND column_name ILIKE '$col';" -t
        $hasColumn = $colCheck.Trim()
        
        if ($hasColumn) {
            Write-Host "Column '$col' exists: $hasColumn" -ForegroundColor Green
        } else {
            Write-Host "Column '$col' MISSING - adding it..." -ForegroundColor Yellow
            
            try {
                switch ($col) {
                    "streakDays" { psql $env:DATABASE_URL -c "ALTER TABLE enrollment ADD COLUMN streakDays INTEGER DEFAULT 0;" }
                    "averageScore" { psql $env:DATABASE_URL -c "ALTER TABLE enrollment ADD COLUMN averageScore DOUBLE PRECISION;" }
                    "engagementScore" { psql $env:DATABASE_URL -c "ALTER TABLE enrollment ADD COLUMN engagementScore DOUBLE PRECISION DEFAULT 0;" }
                    "lastStreakDate" { psql $env:DATABASE_URL -c "ALTER TABLE enrollment ADD COLUMN lastStreakDate TIMESTAMP(3);" }
                    "progressPercentage" { psql $env:DATABASE_URL -c "ALTER TABLE enrollment ADD COLUMN progressPercentage INTEGER DEFAULT 0;" }
                }
                Write-Host "Column '$col' added successfully!" -ForegroundColor Green
            } catch {
                Write-Host "Failed to add column '$col': $_" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "`nStep 6: Final verification..." -ForegroundColor Yellow
    
    # Show final table structure
    $finalCheck = psql $env:DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'enrollment' ORDER BY ordinal_position;"
    Write-Host "Final enrollment table structure:" -ForegroundColor Green
    Write-Host $finalCheck
    
} else {
    Write-Host "Enrollment table doesn't exist - need to create it first!" -ForegroundColor Red
}

Write-Host "`nVerification completed!" -ForegroundColor Green
