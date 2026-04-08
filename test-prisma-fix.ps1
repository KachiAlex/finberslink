# Test script to verify Prisma can now access the enrollment table

Write-Host "TESTING PRISMA ENROLLMENT ACCESS" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

Write-Host "`nTesting Prisma enrollment table access..." -ForegroundColor Yellow

# Test Prisma connection and enrollment table access
$testQuery = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEnrollment() {
  try {
    console.log('Testing Prisma connection...');
    
    // Test if we can query enrollment table
    const count = await prisma.enrollment.count();
    console.log('Enrollment table accessible! Records found: ' + count);
    
    // Test if we can create a test enrollment
    console.log('Testing enrollment creation...');
    const testEnrollment = await prisma.enrollment.create({
      data: {
        id: 'test-' + Date.now(),
        userId: 'test-user',
        courseId: 'test-course',
        status: 'ACTIVE',
        totalStudyTime: 0,
        streakDays: 0,
        engagementScore: 0,
        progressPercentage: 0
      }
    });
    console.log('Test enrollment created successfully!');
    console.log('Enrollment data:', JSON.stringify(testEnrollment, null, 2));
    
    // Clean up test record
    await prisma.enrollment.delete({
      where: { id: testEnrollment.id }
    });
    console.log('Test record cleaned up successfully!');
    
    console.log('SUCCESS: Prisma enrollment table is working correctly!');
    process.exit(0);
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testEnrollment();
"@

# Save test script to temporary file
$testQuery | Out-File -FilePath "test-prisma-enrollment.js" -Encoding UTF8

# Run the test
node test-prisma-enrollment.js

# Clean up
Remove-Item test-prisma-enrollment.js -ErrorAction SilentlyContinue

Write-Host "`nPrisma test completed!" -ForegroundColor Green
