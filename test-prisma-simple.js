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
