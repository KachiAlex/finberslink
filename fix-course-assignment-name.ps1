# Fix CourseAssignment table name case issue

Write-Host "FIXING COURSE ASSIGNMENT TABLE NAME" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Database connection
$env:DATABASE_URL = "postgresql://neondb_owner:npg_udNGF8hZj9vO@ep-young-math-anf24idu-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

Write-Host "`nStep 1: Check actual table name..." -ForegroundColor Yellow

# Check exact table name
$actualName = psql $env:DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE 'courseassignment';" -t
Write-Host "Actual table name: '$actualName'" -ForegroundColor Cyan

Write-Host "`nStep 2: Check if table has data..." -ForegroundColor Yellow

# Check data in lowercase table name
try {
    $dataCheck = psql $env:DATABASE_URL -c "SELECT COUNT(*) FROM courseassignment;" -t
    $recordCount = $dataCheck.Trim()
    Write-Host "Records in courseassignment table: $recordCount" -ForegroundColor Green
    
    if ($recordCount -eq "0") {
        Write-Host "Table exists but has no data - this explains missing audit trail" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Cannot access courseassignment table - checking CourseAssignment..." -ForegroundColor Yellow
    
    try {
        $dataCheck2 = psql $env:DATABASE_URL -c "SELECT COUNT(*) FROM CourseAssignment;" -t
        $recordCount2 = $dataCheck2.Trim()
        Write-Host "Records in CourseAssignment table: $recordCount2" -ForegroundColor Green
    } catch {
        Write-Host "Cannot access either table name - creating proper table..." -ForegroundColor Red
    }
}

Write-Host "`nStep 3: Update Prisma schema to use correct table name..." -ForegroundColor Yellow

Write-Host "The issue is that Prisma expects 'CourseAssignment' but database has 'courseassignment'" -ForegroundColor Cyan
Write-Host "Need to add @@map('courseassignment') to Prisma schema" -ForegroundColor Cyan

Write-Host "`nStep 4: Check if we can query with correct name..." -ForegroundColor Yellow

# Test querying with lowercase name
try {
    $testQuery = psql $env:DATABASE_URL -c "SELECT id, courseId, studentId, status FROM courseassignment LIMIT 3;" -t
    Write-Host "Sample data from courseassignment:" -ForegroundColor Green
    Write-Host $testQuery
} catch {
    Write-Host "Cannot query courseassignment table" -ForegroundColor Red
}

Write-Host "`nCourseAssignment table name analysis completed!" -ForegroundColor Green
