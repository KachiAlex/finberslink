/**
 * Debug script for learning pathway API
 */

const { PrismaClient } = require('@prisma/client');

async function debugLearningPathwayAPI() {
  console.log('=== DEBUGGING LEARNING PATHWAY API ===');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  try {
    // Test 1: Check if we can connect to database
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   Database connection: OK');
    
    // Test 2: Check if student user exists
    console.log('2. Checking for student user...');
    const studentUser = await prisma.user.findFirst({
      where: { 
        email: "onyedika.akoma@gmail.com",
        role: "STUDENT"
      },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true 
      },
    });
    
    if (!studentUser) {
      console.log('   Student user NOT FOUND - this is the issue!');
      
      // Try to find any student user
      const anyStudent = await prisma.user.findFirst({
        where: { role: "STUDENT" },
        select: { id: true, firstName: true, lastName: true, email: true }
      });
      
      if (anyStudent) {
        console.log('   Found alternative student user:', anyStudent.email);
        console.log('   Consider updating the API to use:', anyStudent.email);
      } else {
        console.log('   No student users found in database!');
      }
    } else {
      console.log('   Student user found:', studentUser.email);
      
      // Test 3: Check enrollments for this user
      console.log('3. Checking enrollments for student...');
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: studentUser.id,
          status: "ACTIVE"
        },
        select: {
          id: true,
          userId: true,
          courseId: true,
          status: true,
          progressPercentage: true,
          lastAccessedAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      console.log(`   Found ${enrollments.length} active enrollments`);
      
      if (enrollments.length > 0) {
        // Test 4: Check course data for enrollments
        console.log('4. Checking course data...');
        const enrollmentWithCourse = await prisma.enrollment.findMany({
          where: {
            userId: studentUser.id,
            status: "ACTIVE"
          },
          select: {
            id: true,
            courseId: true,
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                tagline: true,
                level: true,
                category: true,
                instructorId: true
              }
            }
          },
          take: 1 // Just check first one
        });
        
        if (enrollmentWithCourse.length > 0) {
          console.log('   Course data found:', enrollmentWithCourse[0].course.title);
          
          // Test 5: Check instructor data
          if (enrollmentWithCourse[0].course.instructorId) {
            console.log('5. Checking instructor data...');
            const instructor = await prisma.user.findFirst({
              where: {
                id: enrollmentWithCourse[0].course.instructorId
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            });
            
            if (instructor) {
              console.log('   Instructor found:', `${instructor.firstName} ${instructor.lastName}`);
            } else {
              console.log('   Instructor NOT FOUND for ID:', enrollmentWithCourse[0].course.instructorId);
            }
          }
        } else {
          console.log('   No course data found for enrollments');
        }
      }
    }
    
    // Test 6: Check database schema
    console.log('6. Checking database schema...');
    const enrollmentFields = await prisma.enrollment.findFirst({
      select: {
        id: true,
        userId: true,
        courseId: true,
        status: true,
        progressPercentage: true,
        lastAccessedAt: true,
        createdAt: true,
        updatedAt: true
      },
      take: 1
    });
    
    if (enrollmentFields) {
      console.log('   Enrollment schema looks OK');
    } else {
      console.log('   No enrollment records to check schema');
    }
    
  } catch (error) {
    console.error('DEBUG ERROR:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugLearningPathwayAPI().catch(console.error);
