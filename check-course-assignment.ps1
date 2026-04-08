# Check if CourseAssignment table exists in database

Write-Host "CHECKING COURSE ASSIGNMENT TABLE" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

# Database connection
$env:DATABASE_URL = "postgresql://neondb_owner:npg_udNGF8hZj9vO@ep-young-math-anf24idu-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

Write-Host "`nStep 1: Check if CourseAssignment table exists..." -ForegroundColor Yellow

# Check if CourseAssignment table exists
$tableCheck = psql $env:DATABASE_URL -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CourseAssignment');" -t
$tableExists = $tableCheck.Trim()

Write-Host "CourseAssignment table exists: $tableExists" -ForegroundColor Cyan

Write-Host "`nStep 2: List all tables in database..." -ForegroundColor Yellow

# List all tables
$allTables = psql $env:DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" -t
Write-Host "All tables in database:" -ForegroundColor Green
Write-Host $allTables

if ($tableExists -eq "f") {
    Write-Host "`nStep 3: CourseAssignment table is missing!" -ForegroundColor Red
    Write-Host "This explains both issues:" -ForegroundColor Yellow
    Write-Host "1. 'Assignment audit trail is temporarily unavailable' - fallback to enrollment table" -ForegroundColor White
    Write-Host "2. Student view modal not showing courses - no CourseAssignment records to fetch" -ForegroundColor White
    
    Write-Host "`nStep 4: Create CourseAssignment table..." -ForegroundColor Yellow
    
    # Create CourseAssignment table based on Prisma schema
    $createTableSQL = @"
CREATE TABLE "CourseAssignment" (
    id TEXT NOT NULL,
    courseId TEXT NOT NULL,
    studentId TEXT NOT NULL,
    assignedById TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    assignedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acceptedAt TIMESTAMP(3),
    declinedAt TIMESTAMP(3),
    revokedAt TIMESTAMP(3),
    notes TEXT,

    CONSTRAINT "CourseAssignment_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "CourseAssignment_courseId_idx" ON "CourseAssignment"("courseId");
CREATE INDEX "CourseAssignment_studentId_idx" ON "CourseAssignment"("studentId");
"@
    
    psql $env:DATABASE_URL -c $createTableSQL
    Write-Host "CourseAssignment table created successfully!" -ForegroundColor Green
    
} else {
    Write-Host "`nStep 3: CourseAssignment table exists - checking data..." -ForegroundColor Yellow
    
    # Check if there's any data in CourseAssignment table
    $countCheck = psql $env:DATABASE_URL -c "SELECT COUNT(*) FROM CourseAssignment;" -t
    $recordCount = $countCheck.Trim()
    
    Write-Host "CourseAssignment records: $recordCount" -ForegroundColor Cyan
    
    if ($recordCount -eq "0") {
        Write-Host "Table exists but has no data - this explains missing audit trail" -ForegroundColor Yellow
    }
}

Write-Host "`nCourseAssignment table check completed!" -ForegroundColor Green
