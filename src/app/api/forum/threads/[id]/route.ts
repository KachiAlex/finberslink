import { NextRequest, NextResponse } from "next/server";

import { getForumThreadById, createForumPost } from "@/features/forum/service";
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
    const thread = await getForumThreadById(id);
    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ thread });
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
