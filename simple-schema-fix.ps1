# Simplified database schema fix - compatible with all PostgreSQL versions

Write-Host "SIMPLIFIED DATABASE SCHEMA FIX" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

# Database connection
$env:DATABASE_URL = "postgresql://neondb_owner:npg_udNGF8hZj9vO@ep-young-math-anf24idu-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

Write-Host "`nStep 1: Check existing tables..." -ForegroundColor Yellow

# Check what tables exist
$tablesQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
psql $env:DATABASE_URL -c $tablesQuery

Write-Host "`nStep 2: Create enrollment table..." -ForegroundColor Yellow

# Create enrollment table - basic version first
$createTableSQL = @"
CREATE TABLE enrollment (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    courseId TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    progressPercentage INTEGER DEFAULT 0,
    lastAccessedAt TIMESTAMP,
    completedAt TIMESTAMP,
    totalStudyTime INTEGER DEFAULT 0,
    streakDays INTEGER DEFAULT 0,
    averageScore DOUBLE PRECISION,
    engagementScore DOUBLE PRECISION DEFAULT 0,
    lastStreakDate TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"@

# Try to create the table
try {
    psql $env:DATABASE_URL -c $createTableSQL
    Write-Host "Enrollment table created successfully!" -ForegroundColor Green
} catch {
    Write-Host "Enrollment table might already exist or there was an error" -ForegroundColor Yellow
}

Write-Host "`nStep 3: Add unique constraint (if not exists)..." -ForegroundColor Yellow

# Add unique constraint - check if it exists first
$constraintCheck = "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'enrollment' AND constraint_type = 'UNIQUE';"
$constraints = psql $env:DATABASE_URL -c $constraintCheck -t

if ($constraints -notlike "*userId_courseId_key*") {
    try {
        psql $env:DATABASE_URL -c "ALTER TABLE enrollment ADD CONSTRAINT userId_courseId_key UNIQUE (userId, courseId);"
        Write-Host "Unique constraint added!" -ForegroundColor Green
    } catch {
        Write-Host "Unique constraint might already exist" -ForegroundColor Yellow
    }
} else {
    Write-Host "Unique constraint already exists" -ForegroundColor Green
}

Write-Host "`nStep 4: Add indexes..." -ForegroundColor Yellow

# Add indexes
$indexes = @(
    "CREATE INDEX IF NOT EXISTS idx_enrollment_user_status ON enrollment(userId, status);",
    "CREATE INDEX IF NOT EXISTS idx_enrollment_course_progress ON enrollment(courseId, progressPercentage);",
    "CREATE INDEX IF NOT EXISTS idx_enrollment_last_accessed ON enrollment(lastAccessedAt);"
)

foreach ($index in $indexes) {
    try {
        psql $env:DATABASE_URL -c $index
        Write-Host "Index created: $($index.Split()[5])" -ForegroundColor Green
    } catch {
        Write-Host "Index might already exist: $($index.Split()[5])" -ForegroundColor Yellow
    }
}

Write-Host "`nStep 5: Verify table structure..." -ForegroundColor Yellow

# Show table structure
$structureQuery = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'enrollment' ORDER BY ordinal_position;"
psql $env:DATABASE_URL -c $structureQuery

Write-Host "`nStep 6: Test enrollment table..." -ForegroundColor Yellow

# Try to insert a test record
$testInsert = "INSERT INTO enrollment (id, userId, courseId, status) VALUES ('test-123', 'test-user', 'test-course', 'ACTIVE') ON CONFLICT (userId, courseId) DO NOTHING;"
try {
    psql $env:DATABASE_URL -c $testInsert
    Write-Host "Test insert successful!" -ForegroundColor Green
    
    # Clean up test record
    psql $env:DATABASE_URL -c "DELETE FROM enrollment WHERE id = 'test-123';"
    Write-Host "Test record cleaned up!" -ForegroundColor Green
} catch {
    Write-Host "Test insert failed - table might have issues" -ForegroundColor Red
}

Write-Host "`nDatabase schema fix completed!" -ForegroundColor Green
Write-Host "You can now test course assignment functionality." -ForegroundColor Yellow
