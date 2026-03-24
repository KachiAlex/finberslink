import { NextRequest, NextResponse } from "next/server";
import { markThreadAsRead } from "@/features/forum/service";
import { verifyToken } from "@/lib/auth/jwt";

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
    const { id } = await params;

    await markThreadAsRead(user.sub, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark thread as read error:", error);
    return NextResponse.json(
      { error: "Failed to mark thread as read" },
      { status: 500 }
    );
  }
}
