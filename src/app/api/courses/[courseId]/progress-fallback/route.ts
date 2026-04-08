import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/courses/[courseId]/progress
 * Simple fallback progress API to prevent 404 errors
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    
    // Try to get session from cookies
    const token = request.cookies.get("access_token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Return mock progress data to prevent 404 errors
    const mockProgress = {
      courseId,
      userId: "current-user",
      status: "IN_PROGRESS",
      progressPercentage: 25,
      lessonsCompleted: 2,
      totalLessons: 8,
      timeSpentMinutes: 120,
      watchTimeSeconds: 7200,
      lastAccessedAt: new Date().toISOString(),
      engagementMetrics: {
        clicks: 15,
        scrolls: 8,
        pauses: 3,
        seeks: 2,
        resourceDownloads: 1,
      },
      lessons: [
        {
          id: "lesson-1",
          title: "Introduction",
          order: 1,
          status: "COMPLETED",
          progressPercentage: 100,
          timeSpentMinutes: 45,
        },
        {
          id: "lesson-2", 
          title: "Getting Started",
          order: 2,
          status: "COMPLETED",
          progressPercentage: 100,
          timeSpentMinutes: 75,
        },
        {
          id: "lesson-3",
          title: "Advanced Topics",
          order: 3,
          status: "IN_PROGRESS",
          progressPercentage: 50,
          timeSpentMinutes: 30,
        },
      ],
      predictions: {
        estimatedWeeksToComplete: 3,
        progressVelocity: 0.67,
        completionDate: new Date(Date.now() + 3 * 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    };

    return NextResponse.json(mockProgress);
  } catch (error) {
    console.error("Progress API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/courses/[courseId]/progress
 * Simple fallback to handle progress updates
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const body = await request.json();
    
    // Try to get session from cookies
    const token = request.cookies.get("access_token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Return success response for progress updates
    return NextResponse.json({
      success: true,
      courseId,
      status: body.status || "IN_PROGRESS",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
