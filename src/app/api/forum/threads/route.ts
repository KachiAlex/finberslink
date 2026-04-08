import { NextRequest, NextResponse } from "next/server";

import { listForumThreads, createForumThread, getUnreadThreadCount, createThreadWithTags, listThreadsByTag, listThreadsByQuery, createForumPost } from "@/features/forum/service";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";

const CreateThreadSchema = z.object({
  title: z.string().min(1),
  courseId: z.string().min(1),
  tags: z.array(z.string()).optional(),
  content: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const tag = searchParams.get("tag");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const cursor = searchParams.get("cursor") || undefined;

    let threads;
    const q = searchParams.get("q");
    if (q) {
      threads = await listThreadsByQuery(q, limit);
    } else if (tag) {
      threads = await listThreadsByTag(tag, limit);
    } else {
      threads = await listForumThreads({ 
        courseId: courseId || undefined, 
        limit,
        cursor: cursor || undefined,
      });
    }

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

    let thread;
    if (parsed.data.tags && parsed.data.tags.length > 0) {
      thread = await createThreadWithTags({
        ...(parsed.data as any),
        authorId: user.sub,
      });
    } else {
      thread = await createForumThread({
        ...(parsed.data as any),
        authorId: user.sub,
      });
    }
    // If initial content provided, create an initial post and parse mentions
    if (parsed.data.content) {
      // extract mention handles like @handle
      const handles = Array.from(parsed.data.content.matchAll(/@([a-zA-Z0-9_]+)/g)).map(m => m[1]);
      try {
        await createForumPost({
          content: parsed.data.content,
          threadId: thread.id,
          authorId: user.sub,
          mentions: handles,
        });
      } catch (e) {
        console.error('Failed to create initial post for thread', e);
      }
    }

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
