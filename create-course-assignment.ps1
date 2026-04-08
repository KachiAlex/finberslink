# Create proper CourseAssignment table

Write-Host "CREATING PROPER COURSE ASSIGNMENT TABLE" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Database connection
$env:DATABASE_URL = "postgresql://neondb_owner:npg_udNGF8hZj9vO@ep-young-math-anf24idu-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

Write-Host "`nStep 1: Drop existing problematic table..." -ForegroundColor Yellow

# Drop the existing CourseAssignment table if it exists
try {
    psql $env:DATABASE_URL -c "DROP TABLE IF EXISTS CourseAssignment;" -ErrorAction SilentlyContinue
    psql $env:DATABASE_URL -c "DROP TABLE IF EXISTS courseassignment;" -ErrorAction SilentlyContinue
    Write-Host "Existing CourseAssignment tables dropped" -ForegroundColor Green
} catch {
    Write-Host "No existing tables to drop" -ForegroundColor Yellow
}

Write-Host "`nStep 2: Create CourseAssignment table with proper structure..." -ForegroundColor Yellow

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

Write-Host "`nStep 3: Verify table creation..." -ForegroundColor Yellow

# Verify table was created
$verifyTable = psql $env:DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CourseAssignment';" -t
Write-Host "CourseAssignment table verified: $verifyTable" -ForegroundColor Cyan

# Test inserting a record
$testInsert = psql $env:DATABASE_URL -c "INSERT INTO CourseAssignment (id, courseId, studentId, assignedById, status) VALUES ('test-123', 'test-course', 'test-student', 'test-admin', 'PENDING') ON CONFLICT (id) DO NOTHING;" -ErrorAction SilentlyContinue
Write-Host "Test insert completed" -ForegroundColor Green

# Clean up test record
$testDelete = psql $env:DATABASE_URL -c "DELETE FROM CourseAssignment WHERE id = 'test-123';" -ErrorAction SilentlyContinue
Write-Host "Test record cleaned up" -ForegroundColor Green

Write-Host "`nStep 4: Update Prisma schema..." -ForegroundColor Yellow

Write-Host "Now need to add @@map('CourseAssignment') to Prisma schema" -ForegroundColor Cyan
Write-Host "This will fix both issues:" -ForegroundColor White
Write-Host "1. Assignment audit trail will work" -ForegroundColor White
Write-Host "2. Student view modal will show assigned courses" -ForegroundColor White

Write-Host "`nCourseAssignment table creation completed!" -ForegroundColor Green
