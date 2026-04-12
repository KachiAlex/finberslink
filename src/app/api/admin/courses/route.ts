import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getSessionUser } from "@/lib/auth";
import { z } from 'zod';

// Validation schema for course creation
const createCourseSchema = z.object({
  title: z.string().min(1, 'Course title is required'),
  tagline: z.string().optional(),
  description: z.string().min(1, 'Course description is required'),
  category: z.string().min(1, 'Category is required'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  coverImage: z.string().optional(),
  outcomes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  lessons: z.array(z.object({
    id: z.string(),
    title: z.string(),
    durationMinutes: z.number(),
    format: z.enum(['VIDEO', 'READING', 'QUIZ', 'ASSIGNMENT', 'PROJECT']),
    summary: z.string().optional(),
    content: z.string().optional(),
    videoUrl: z.string().optional(),
    order: z.number(),
    resources: z.array(z.object({
      id: z.string(),
      title: z.string(),
      type: z.enum(['PDF', 'VIDEO', 'IMAGE', 'DOCUMENT', 'LINK']),
      url: z.string(),
    })).optional(),
  })).optional(),
  resources: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(['PDF', 'VIDEO', 'IMAGE', 'DOCUMENT', 'LINK']),
    url: z.string(),
  })).optional(),
  approvalStatus: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'CHANGES']).default('DRAFT'),
});

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication (tenant admin only)
    const session = requireAuth(request);
    requireRole(session, 'ADMIN');
    const adminUser = await getSessionUser(session);

    const body = await request.json();
    
    // Validate request body
    const validatedData = createCourseSchema.parse(body);

    // Generate a unique course ID
    const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the course
    const newCourse = await prisma.course.create({
      data: {
        id: courseId,
        title: validatedData.title,
        tagline: validatedData.tagline || null,
        description: validatedData.description,
        category: validatedData.category,
        level: validatedData.level,
        coverImage: validatedData.coverImage || null,
        instructorId: adminUser.id,
        approvalStatus: validatedData.approvalStatus,
        outcomes: validatedData.outcomes || [],
        skills: validatedData.skills || [],
      },
    });

    // Handle lessons if provided
    if (validatedData.lessons && validatedData.lessons.length > 0) {
      await prisma.lesson.createMany({
        data: validatedData.lessons.map((lesson, index) => ({
          id: lesson.id,
          courseId: newCourse.id,
          title: lesson.title,
          slug: lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `lesson-${index}`,
          durationMinutes: lesson.durationMinutes,
          format: lesson.format,
          summary: lesson.summary || null,
          content: lesson.content || null,
          videoUrl: lesson.videoUrl || null,
          order: index,
        }))
      });
    }

    // Handle resources if provided
    if (validatedData.resources && validatedData.resources.length > 0) {
      // First create lessons if not already created
      const lessons = await prisma.lesson.findMany({
        where: { courseId: newCourse.id },
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

    console.log('Course created successfully:', newCourse.id);

    return NextResponse.json({
      success: true,
      course: newCourse,
    });

  } catch (error) {
    console.error('Error creating course:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

// GET endpoint for listing courses (already exists in debug, but adding a proper one)
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication (tenant admin only)
    const session = requireAuth(request);
    requireRole(session, 'ADMIN');
    const adminUser = await getSessionUser(session);

    const courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            resources: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      courses,
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
