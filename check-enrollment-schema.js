// Quick schema verification test
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

require('dotenv').config({ path: '.env.local' });

const adapter = process.env.DATABASE_URL
  ? new PrismaPg({ connectionString: process.env.DATABASE_URL })
  : undefined;

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  ...(adapter ? { adapter } : {}),
});

async function checkEnrollmentSchema() {
  try {
    console.log('=== CHECKING ENROLLMENT TABLE SCHEMA ===');
    
    // Try to get one enrollment to see what fields exist
    const enrollment = await prisma.enrollment.findFirst({
      select: {
        id: true,
        userId: true,
        courseId: true,
        status: true,
        progressPercentage: true,
        lastAccessedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    console.log('✅ Enrollment schema check passed');
    console.log('Sample enrollment:', enrollment || 'No enrollments found');
    
    // Test the exact query from our API
    console.log('\n=== TESTING API QUERY ===');
    const studentUser = await prisma.user.findFirst({
      where: { 
        email: 'onyedika.akoma@gmail.com',
        role: 'STUDENT'
      },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true 
      },
    });
    
    if (studentUser) {
      console.log('Found student user:', studentUser.email);
      
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: studentUser.id,
        },
        select: {
          id: true,
          userId: true,
          courseId: true,
          status: true,
          progressPercentage: true,
          lastAccessedAt: true,
          createdAt: true,
          updatedAt: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              tagline: true,
              level: true,
              category: true,
              coverImage: true,
              publishedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      
      console.log(`✅ API query test passed - Found ${enrollments.length} enrollments`);
    } else {
      console.log('❌ Student user not found');
    }
    
  } catch (error) {
    console.error('❌ Schema test failed:', error.message);
    console.error('This indicates the database schema doesn\'t match our expectations');
  } finally {
    await prisma.$disconnect();
  }
}

checkEnrollmentSchema();
