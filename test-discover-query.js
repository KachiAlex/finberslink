// Test the discover API query step by step
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

async function testDiscoverQuery() {
  try {
    console.log('=== TESTING DISCOVER API QUERY ===');
    
    // Test 1: Simple course count
    const simpleCount = await prisma.course.count({
      where: {
        publishedAt: { not: null },
        archivedAt: null,
      },
    });
    console.log(`✅ Simple count: ${simpleCount} published courses`);
    
    // Test 2: Course query without instructor
    const coursesWithoutInstructor = await prisma.course.findMany({
      where: {
        publishedAt: { not: null },
        archivedAt: null,
      },
      select: {
        id: true,
        title: true,
        tagline: true,
        level: true,
        category: true,
        publishedAt: true,
        createdAt: true,
      },
      take: 3,
    });
    console.log(`✅ Courses without instructor: ${coursesWithoutInstructor.length}`);
    coursesWithoutInstructor.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.title} (${c.level})`);
    });
    
    // Test 3: Course query with instructor (this might fail)
    try {
      const coursesWithInstructor = await prisma.course.findMany({
        where: {
          publishedAt: { not: null },
          archivedAt: null,
        },
        select: {
          id: true,
          title: true,
          tagline: true,
          level: true,
          category: true,
          publishedAt: true,
          createdAt: true,
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        take: 3,
      });
      console.log(`✅ Courses with instructor: ${coursesWithInstructor.length}`);
      coursesWithInstructor.forEach((c, i) => {
        console.log(`  ${i+1}. ${c.title} - Instructor: ${c.instructor ? `${c.instructor.firstName} ${c.instructor.lastName}` : 'None'}`);
      });
    } catch (instructorError) {
      console.log('❌ Instructor relationship failed:', instructorError.message);
    }
    
    // Test 4: Check instructor relationship
    const firstCourse = await prisma.course.findFirst({
      where: {
        publishedAt: { not: null },
        archivedAt: null,
      },
      select: {
        id: true,
        instructorId: true,
      },
    });
    
    if (firstCourse && firstCourse.instructorId) {
      const instructor = await prisma.user.findUnique({
        where: { id: firstCourse.instructorId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });
      
      if (instructor) {
        console.log(`✅ Found instructor: ${instructor.firstName} ${instructor.lastName}`);
      } else {
        console.log('❌ Instructor not found for ID:', firstCourse.instructorId);
      }
    } else {
      console.log('❌ No courses found or no instructorId');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDiscoverQuery();
