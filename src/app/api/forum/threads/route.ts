import { NextRequest, NextResponse } from "next/server";

import { listForumThreads, createForumThread, getUnreadThreadCount } from "@/features/forum/service";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";

const CreateThreadSchema = z.object({
  title: z.string().min(1),
  courseId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const cursor = searchParams.get("cursor") || undefined;

    const threads = await listForumThreads({ 
      courseId: courseId || undefined, 
      limit,
      cursor: cursor || undefined,
    });
    
    const unreadCount = searchParams.get("includeUnread") === "true" 
      ? await getUnreadThreadCount(searchParams.get("userId") || "", courseId || undefined)
      : undefined;

    const nextCursor = threads.length === limit ? threads[threads.length - 1]?.id : null;

    return NextResponse.json({ 
      threads,
      pagination: {
        nextCursor,
        hasMore: threads.length === limit,
      },
      ...(unreadCount !== undefined && { unreadCount }),
    });
  } catch (error) {
    console.error("Forum threads fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch forum threads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(accessToken);
    const body = await request.json();
    const parsed = CreateThreadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const thread = await createForumThread({
      ...parsed.data,
      authorId: user.sub,
    });

    return NextResponse.json(
      { message: "Thread created successfully", thread },
      { status: 201 }
    );
  } catch (error) {
    console.error("Thread creation error:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}
