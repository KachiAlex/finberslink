import { NextRequest, NextResponse } from "next/server";

import { getForumThreadById, createForumPost, listThreadPosts, markThreadAsRead } from "@/features/forum/service";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";

const CreatePostSchema = z.object({
  content: z.string().min(1),
  lessonId: z.string().optional(),
  parentId: z.string().optional(),
  mentions: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const thread = await getForumThreadById(id);
    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    // Mark thread as read if user is authenticated
    const accessToken = request.cookies.get("access_token")?.value;
    if (accessToken) {
      try {
        const user = verifyToken(accessToken);
        await markThreadAsRead(user.sub, id);
      } catch (err) {
        // Silently ignore auth errors for marking as read
      }
    }

    // Optionally include posts
    let posts;
    if (searchParams.get("includePosts") === "true") {
      const limit = Math.min(parseInt(searchParams.get("postsLimit") || "50"), 100);
      const cursor = searchParams.get("postsCursor") || undefined;
      posts = await listThreadPosts(id, { limit, cursor: cursor || undefined });
    }

    return NextResponse.json({ 
      thread,
      ...(posts && { posts }),
    });
  } catch (error) {
    console.error("Thread fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const parsed = CreatePostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { id } = await params;
    const post = await createForumPost({
      ...parsed.data,
      threadId: id,
      authorId: user.sub,
      mentions: parsed.data.mentions,
    });

    return NextResponse.json(
      { message: "Reply posted successfully", post },
      { status: 201 }
    );
  } catch (error) {
    console.error("Reply creation error:", error);
    return NextResponse.json(
      { error: "Failed to post reply" },
      { status: 500 }
    );
  }
}
