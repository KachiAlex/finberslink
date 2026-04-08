import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../../_helpers";
import { markConversationMessagesRead } from "@/features/chat/service";

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = requireAuth(req);
    const { conversationId } = params;

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const result = await markConversationMessagesRead({
      conversationId,
      userId: user.sub,
    });

    return NextResponse.json({ result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
