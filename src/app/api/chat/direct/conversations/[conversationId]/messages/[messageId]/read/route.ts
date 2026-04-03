import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../../../../_helpers";
import { markDirectMessageRead } from "@/features/chat/service";

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string; messageId: string } }
) {
  try {
    const user = requireAuth(req);
    const { conversationId, messageId } = params;

    if (!conversationId || !messageId) {
      return NextResponse.json(
        { error: "Missing conversationId or messageId" },
        { status: 400 }
      );
    }

    const read = await markDirectMessageRead({
      messageId,
      userId: user.sub,
    });

    return NextResponse.json({ read });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
