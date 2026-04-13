import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/features/admin/service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdminUser();

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
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      allCourses: courses,
    });
  } catch (error) {
    console.error('Failed to fetch admin courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdminUser();

    const body = await request.json();
    
    const course = await prisma.course.create({
      data: {
        title: body.title,
        description: body.description,
        tagline: body.tagline,
        category: body.category,
        level: body.level,
        coverImage: body.coverImage,
        instructorId: body.instructorId,
        approvalStatus: body.approvalStatus || 'DRAFT',
      },
      include: {
        instructor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      course,
    });
  } catch (error) {
    console.error('Failed to create course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
