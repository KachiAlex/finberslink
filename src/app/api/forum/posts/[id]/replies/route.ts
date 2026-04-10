import { NextRequest, NextResponse } from "next/server";
import { listPostReplies } from "../../../../../../features/forum/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const cursor = searchParams.get("cursor") || undefined;

    const replies = await listPostReplies(id, { 
      limit,
      cursor: cursor || undefined,
    });

    const nextCursor = replies.length === limit ? replies[replies.length - 1]?.id : null;

    return NextResponse.json({
      replies,
      pagination: {
        nextCursor,
        hasMore: replies.length === limit,
      },
    });
  } catch (error) {
    console.error("Post replies fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post replies" },
      { status: 500 }
    );
  }
}
