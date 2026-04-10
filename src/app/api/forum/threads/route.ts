import { NextRequest, NextResponse } from "next/server";
import { listForumThreads, createForumThread, getUnreadThreadCount, createThreadWithTags, listThreadsByTag, listThreadsByQuery, createForumPost } from "@/features/forum/service";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";
import { ThreadCreateData } from "@/features/forum/types";

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
    const includeUnread = searchParams.get("includeUnread") === "true";
    const userId = searchParams.get("userId") || undefined;

    let result;
    const q = searchParams.get("q");
    if (q) {
      result = await listThreadsByQuery(q, limit, cursor);
    } else if (tag) {
      result = await listThreadsByTag(tag, limit, cursor);
    } else {
      result = await listForumThreads({ 
        courseId: courseId || undefined, 
        limit,
        cursor,
        includeUnread,
        userId,
      });
    }

    return NextResponse.json(result);
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
    const threadData: ThreadCreateData & { authorId: string } = {
      title: parsed.data.title,
      courseId: parsed.data.courseId,
      tags: parsed.data.tags,
      content: parsed.data.content,
      authorId: user.sub,
    };

    if (parsed.data.tags && parsed.data.tags.length > 0) {
      thread = await createThreadWithTags(threadData);
    } else {
      thread = await createForumThread(threadData);
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
