/**
 * Course Deduplication Script
 * Removes duplicate courses with same IDs from database
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

    // Get all courses with their details
    const allCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        instructorId: true,
        createdAt: true,
        archivedAt: true,
        approvalStatus: true,
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    console.log("All courses found:", allCourses.length);

    // Group by ID to find duplicates
    const courseGroups = new Map<string, any[]>();
    
    allCourses.forEach(course => {
      const id = course.id;
      if (!courseGroups.has(id)) {
        courseGroups.set(id, [course]);
      } else {
        courseGroups.get(id)!.push(course);
      }
    });

    // Find and remove duplicates
    const duplicatesToRemove: string[] = [];
    const uniqueCourses: string[] = [];
    
    courseGroups.forEach((courses, id) => {
      if (courses.length > 1) {
        console.log(`Found duplicate group for ID ${id}:`, courses.length, "courses");
        
        // Keep the most recently updated course
        courses.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        const [keep, ...toRemove] = courses;
        
        // Mark duplicates for removal
        toRemove.forEach(course => {
          duplicatesToRemove.push(course.id);
        });
        
        uniqueCourses.push(keep.id);
      } else {
        uniqueCourses.push(courses[0].id);
      }
    });

    console.log("Courses to keep:", uniqueCourses.length);
    console.log("Courses to remove:", duplicatesToRemove.length);

    // Remove duplicates in a transaction
    if (duplicatesToRemove.length > 0) {
      const result = await prisma.$transaction(async (tx) => {
        // First, delete enrollments for courses to be removed
        await tx.enrollment.deleteMany({
          where: { courseId: { in: duplicatesToRemove } }
        });

        // Delete course sections
        await tx.courseSection.deleteMany({
          where: { courseId: { in: duplicatesToRemove } }
        });

        // Delete lessons
        await tx.lesson.deleteMany({
          where: { courseId: { in: duplicatesToRemove } }
        });

        // Delete the duplicate courses
        const deleted = await tx.course.deleteMany({
          where: { id: { in: duplicatesToRemove } }
        });

        return deleted;
      });

      console.log("Removed duplicates:", result.count);
    }

    // Get final state
    const finalCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        instructorId: true,
        createdAt: true,
        archivedAt: true,
        approvalStatus: true,
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const finalStats = {
      total: finalCourses.length,
      archived: finalCourses.filter(c => c.archivedAt).length,
      approved: finalCourses.filter(c => c.approvalStatus === 'APPROVED' && !c.archivedAt).length,
      duplicatesRemoved: duplicatesToRemove.length
    };

    return NextResponse.json({
      success: true,
      message: `Removed ${duplicatesToRemove.length} duplicate courses`,
      stats: finalStats,
      duplicatesRemoved: duplicatesToRemove,
      uniqueCourses: uniqueCourses
    });

  } catch (error) {
    console.error("Deduplication error:", error);
    return NextResponse.json(
      { error: "Failed to deduplicate courses", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
