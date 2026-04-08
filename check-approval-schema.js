// Check database schema for approval and assignment fields
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

async function checkSchema() {
  try {
    console.log('=== CHECKING COURSE SCHEMA ===');
    
    // Check what fields actually exist in the Course model
    const sampleCourse = await prisma.course.findFirst({
      select: {
        id: true,
        title: true,
        publishedAt: true,
        archivedAt: true,
        approvalStatus: true,
        instructorId: true,
      },
    });
    
    console.log('Sample course fields found:');
    Object.keys(sampleCourse || {}).forEach(key => {
      console.log(`- ${key}: ${sampleCourse[key]}`);
    });
    
    console.log('\n=== CHECKING ALL COURSES ===');
    const allCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        publishedAt: true,
        archivedAt: true,
        approvalStatus: true,
        instructorId: true,
      },
      take: 5,
    });
    
    console.log(`Found ${allCourses.length} courses:`);
    allCourses.forEach(course => {
      console.log(`- ${course.title}:`);
      console.log(`  publishedAt: ${course.publishedAt}`);
      console.log(`  archivedAt: ${course.archivedAt}`);
      console.log(`  approvalStatus: ${course.approvalStatus}`);
      console.log(`  instructorId: ${course.instructorId}`);
    });
    
    console.log('\n=== CHECKING ASSIGNMENT TABLE ===');
    try {
      const assignments = await prisma.courseAssignment.findMany({
        select: {
          id: true,
          studentId: true,
          courseId: true,
          status: true,
          assignedAt: true,
        },
        take: 3,
      });
      console.log(`Found ${assignments.length} assignments`);
      assignments.forEach(a => {
        console.log(`- Course ${a.courseId} -> Student ${a.studentId} (${a.status})`);
      });
    } catch (assignError) {
      console.log('CourseAssignment table error:', assignError.message);
    }
    
    console.log('\n=== CHECKING YOUR USER ===');
    const yourUser = await prisma.user.findFirst({
      where: { email: 'onyedika.akoma@gmail.com' },
      select: { id: true, email: true, role: true },
    });
    
    if (yourUser) {
      console.log(`Your user: ${yourUser.email} (${yourUser.role}) - ID: ${yourUser.id}`);
      
      // Check your enrollments
      const yourEnrollments = await prisma.enrollment.findMany({
        where: { userId: yourUser.id },
        select: {
          id: true,
          courseId: true,
          status: true,
          course: {
            select: { title: true },
          },
        },
      });
      console.log(`Your enrollments: ${yourEnrollments.length}`);
      yourEnrollments.forEach(e => {
        console.log(`- ${e.course.title} (${e.status})`);
      });
    }
    
  } catch (error) {
    console.error('Schema check error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
