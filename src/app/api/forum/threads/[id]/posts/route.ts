import { NextRequest, NextResponse } from "next/server";
import { listThreadPosts } from "../../../../../../features/forum/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const cursor = searchParams.get("cursor") || undefined;

    const posts = await listThreadPosts(id, { 
      limit,
      cursor: cursor || undefined,
    });

    const nextCursor = posts.length === limit ? posts[posts.length - 1]?.id : null;

    return NextResponse.json({
      posts,
      pagination: {
        nextCursor,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    console.error("Thread posts fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread posts" },
      { status: 500 }
    );
  }
}
