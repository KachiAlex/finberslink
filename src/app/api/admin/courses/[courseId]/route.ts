import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const UpdateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  coverImage: z.string().optional(),
  outcomes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  lessons: z.array(z.object({
    id: z.string(),
    title: z.string(),
    durationMinutes: z.number(),
    format: z.enum(["VIDEO", "READING", "QUIZ", "ASSIGNMENT", "PROJECT"]),
    summary: z.string().optional(),
    content: z.string().optional(),
    videoUrl: z.string().optional(),
    order: z.number(),
  })).optional(),
  resources: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(["PDF", "VIDEO", "IMAGE", "DOCUMENT", "LINK"]),
    url: z.string(),
  })).optional(),
  approvalStatus: z.enum(["DRAFT", "PENDING", "APPROVED", "CHANGES"]).optional(),
});

/**
 * PUT /api/admin/courses/[courseId]
 * Update a course (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = requireAuth(request);
    const courseId = params.courseId;

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { role: true }
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateCourseSchema.parse(body);

    // Update course basic info
    const updateData: any = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.tagline !== undefined) updateData.tagline = validatedData.tagline;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.level !== undefined) updateData.level = validatedData.level;
    if (validatedData.coverImage !== undefined) updateData.coverImage = validatedData.coverImage;
    if (validatedData.outcomes !== undefined) updateData.outcomes = validatedData.outcomes;
    if (validatedData.skills !== undefined) updateData.skills = validatedData.skills;
    if (validatedData.approvalStatus !== undefined) updateData.approvalStatus = validatedData.approvalStatus;

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });

    // Handle lessons if provided
    if (validatedData.lessons !== undefined) {
      // Delete existing lessons
      await prisma.lesson.deleteMany({
        where: { courseId }
      });

      // Create new lessons
      if (validatedData.lessons.length > 0) {
        await prisma.lesson.createMany({
          data: validatedData.lessons.map((lesson, index) => ({
            id: lesson.id,
            courseId,
            title: lesson.title,
            durationMinutes: lesson.durationMinutes,
            format: lesson.format,
            summary: lesson.summary,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            order: index,
          }))
        });
      }
    }

    // Handle resources if provided
    if (validatedData.resources !== undefined) {
      // Delete existing resources
      await prisma.resource.deleteMany({
        where: { 
          lessonId: {
            in: (await prisma.lesson.findMany({
              where: { courseId },
              select: { id: true }
            })).map(l => l.id)
          }
        }
      });

      // Create new resources (attach to first lesson or create a default lesson)
      if (validatedData.resources.length > 0) {
        const lessons = await prisma.lesson.findMany({
          where: { courseId },
          select: { id: true },
          orderBy: { order: 'asc' }
        });

        if (lessons.length > 0) {
          await prisma.resource.createMany({
            data: validatedData.resources.map(resource => ({
              id: resource.id,
              lessonId: lessons[0].id, // Attach to first lesson
              title: resource.title,
              type: resource.type,
              url: resource.url,
            }))
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      course: updatedCourse
    });

  } catch (error) {
    console.error("Error updating course:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data provided", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}
