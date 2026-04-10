/**
 * Clear All Courses Script
 * Removes all courses and related data while preserving database structure
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../../lib/auth/session";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["ADMIN", "SUPER_ADMIN"],
      requireTenant: true,
      failureMode: "error",
    });

    console.log('🧹 Starting complete courses database cleanup...');

    // Get counts before deletion
    const beforeCounts = {
      courses: await prisma.course.count(),
      enrollments: await prisma.enrollment.count(),
      courseSections: await prisma.courseSection.count(),
      lessons: await prisma.lesson.count(),
      lessonProgress: await prisma.lessonProgress.count(),
      studentAchievements: await prisma.studentAchievement.count(),
      courseProgress: await prisma.courseProgress.count()
    };

    console.log('📊 Before cleanup counts:', beforeCounts);

    // Delete in proper order to respect foreign key constraints
    
    // 1. Delete lesson progress first
    const lessonProgressResult = await prisma.lessonProgress.deleteMany({});
    console.log(`🗑️ Deleted ${lessonProgressResult.count} lesson progress records`);

    // 2. Delete course progress
    const courseProgressResult = await prisma.courseProgress.deleteMany({});
    console.log(`🗑️ Deleted ${courseProgressResult.count} course progress records`);

    // 3. Delete student achievements related to courses
    const achievementsResult = await prisma.studentAchievement.deleteMany({
      where: {
        achievement: {
          category: {
            in: ["COMPLETION", "STREAK", "ENGAGEMENT", "COURSE"]
          }
        }
      }
    });
    console.log(`🗑️ Deleted ${achievementsResult.count} student achievements`);

    // 4. Delete enrollments
    const enrollmentsResult = await prisma.enrollment.deleteMany({});
    console.log(`🗑️ Deleted ${enrollmentsResult.count} enrollments`);

    // 5. Delete lessons
    const lessonsResult = await prisma.lesson.deleteMany({});
    console.log(`🗑️ Deleted ${lessonsResult.count} lessons`);

    // 6. Delete course sections
    const sectionsResult = await prisma.courseSection.deleteMany({});
    console.log(`🗑️ Deleted ${sectionsResult.count} course sections`);

    // 7. Finally delete courses
    const coursesResult = await prisma.course.deleteMany({});
    console.log(`🗑️ Deleted ${coursesResult.count} courses`);

    // Get counts after deletion
    const afterCounts = {
      courses: await prisma.course.count(),
      enrollments: await prisma.enrollment.count(),
      courseSections: await prisma.courseSection.count(),
      lessons: await prisma.lesson.count(),
      lessonProgress: await prisma.lessonProgress.count(),
      studentAchievements: await prisma.studentAchievement.count(),
      courseProgress: await prisma.courseProgress.count()
    };

    console.log('✅ After cleanup counts:', afterCounts);

    // Verify all course-related data is deleted
    const totalDeleted = Object.values(beforeCounts).reduce((sum, count) => sum + count, 0);
    const totalRemaining = Object.values(afterCounts).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      success: true,
      message: "Successfully cleared all courses and related data",
      beforeCounts,
      afterCounts,
      deletedRecords: {
        courses: coursesResult.count,
        enrollments: enrollmentsResult.count,
        courseSections: sectionsResult.count,
        lessons: lessonsResult.count,
        lessonProgress: lessonProgressResult.count,
        studentAchievements: achievementsResult.count,
        courseProgress: courseProgressResult.count
      },
      totalDeleted,
      totalRemaining,
      verification: totalRemaining === 0 ? "✅ All course data cleared" : "⚠️ Some data remains"
    });

  } catch (error) {
    console.error("❌ Failed to clear courses database:", error);
    return NextResponse.json(
      { 
        error: "Failed to clear courses database", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check current state
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["ADMIN", "SUPER_ADMIN"],
      requireTenant: true,
      failureMode: "error",
    });

    const currentCounts = {
      courses: await prisma.course.count(),
      enrollments: await prisma.enrollment.count(),
      courseSections: await prisma.courseSection.count(),
      lessons: await prisma.lesson.count(),
      lessonProgress: await prisma.lessonProgress.count(),
      studentAchievements: await prisma.studentAchievement.count(),
      courseProgress: await prisma.courseProgress.count()
    };

    // Get sample courses to verify
    const sampleCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        instructorId: true,
        approvalStatus: true,
        archivedAt: true,
        createdAt: true
      },
      take: 5
    });

    return NextResponse.json({
      message: "Current courses database state",
      counts: currentCounts,
      sampleCourses,
      isEmpty: currentCounts.courses === 0
    });

  } catch (error) {
    console.error("Failed to check courses state:", error);
    return NextResponse.json(
      { error: "Failed to check courses state" },
      { status: 500 }
    );
  }
}
