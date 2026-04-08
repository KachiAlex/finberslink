import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../_helpers";
import { getConversation } from "@/features/chat/service";

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = requireAuth(req);
    const { conversationId } = params;

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const conversation = await getConversation({
      conversationId,
      userId: user.sub,
    });

    return NextResponse.json({ conversation });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
