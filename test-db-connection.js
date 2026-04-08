// Simple database test script
// Run with: node test-db-connection.js

const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  console.log('=== TESTING DATABASE CONNECTION ===');
  
  const prisma = new PrismaClient();
  
  try {
    // Test 1: Connect to database
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test 2: Count courses
    console.log('\n2. Counting courses...');
    const courseCount = await prisma.course.count();
    console.log(`✅ Found ${courseCount} courses in database`);
    
    // Test 3: Get course details
    if (courseCount > 0) {
      console.log('\n3. Getting course details...');
      const courses = await prisma.course.findMany({
        select: {
          id: true,
          title: true,
          tagline: true,
          level: true,
          category: true,
          isFree: true,
          publishedAt: true,
          createdAt: true,
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        take: 5, // Limit to first 5 courses
      });
      
      console.log('✅ Course details:');
      courses.forEach((course, index) => {
        console.log(`\n${index + 1}. ${course.title}`);
        console.log(`   ID: ${course.id}`);
        console.log(`   Category: ${course.category || 'No category'}`);
        console.log(`   Level: ${course.level || 'No level'}`);
        console.log(`   Published: ${course.publishedAt ? 'Yes' : 'No'}`);
        console.log(`   Instructor: ${course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : 'No instructor'}`);
      });
    } else {
      console.log('❌ No courses found in database');
    }
    
    // Test 4: Count users
    console.log('\n4. Counting users...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Test 5: Look for your specific user
    console.log('\n5. Looking for your user account...');
    const yourUser = await prisma.user.findFirst({
      where: {
        email: 'onyedika.akoma@gmail.com',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
    
    if (yourUser) {
      console.log(`✅ Found your account: ${yourUser.firstName} ${yourUser.lastName} (${yourUser.role})`);
    } else {
      console.log('❌ Your user account not found');
    }
    
    // Test 6: Check enrollments
    console.log('\n6. Checking enrollments...');
    const enrollmentCount = await prisma.enrollment.count();
    console.log(`✅ Found ${enrollmentCount} enrollments in database`);
    
    if (yourUser && enrollmentCount > 0) {
      const yourEnrollments = await prisma.enrollment.findMany({
        where: {
          userId: yourUser.id,
        },
        include: {
          course: {
            select: {
              title: true,
              publishedAt: true,
            },
          },
        },
      });
      
      console.log(`✅ Your enrollments: ${yourEnrollments.length}`);
      yourEnrollments.forEach((enrollment, index) => {
        console.log(`   ${index + 1}. ${enrollment.course.title} (${enrollment.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Error type:', error.constructor.name);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== TEST COMPLETED ===');
  }
}

testDatabase();
