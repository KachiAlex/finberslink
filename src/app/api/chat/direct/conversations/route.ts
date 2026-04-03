import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../_helpers";
import {
  listUserConversations,
  getOrCreateDirectConversation,
  createGroupConversation,
} from "@/features/chat/service";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const cursor = searchParams.get("cursor") || undefined;

    const conversations = await listUserConversations({
      userId: user.sub,
      limit,
      cursor,
    });

    return NextResponse.json({ conversations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const { type, targetUserId, name, participantUserIds } = body;

    if (!type) {
      return NextResponse.json({ error: "Missing type (DIRECT or GROUP)" }, { status: 400 });
    }

    if (type === "DIRECT") {
      if (!targetUserId) {
        return NextResponse.json({ error: "Missing targetUserId for DIRECT conversation" }, { status: 400 });
      }
      const conversation = await getOrCreateDirectConversation({
        userId: user.sub,
        targetUserId,
      });
      return NextResponse.json({ conversation });
    } else if (type === "GROUP") {
      if (!name) {
        return NextResponse.json({ error: "Missing name for GROUP conversation" }, { status: 400 });
      }
      if (!participantUserIds || !Array.isArray(participantUserIds)) {
        return NextResponse.json(
          { error: "Missing participantUserIds array for GROUP conversation" },
          { status: 400 }
        );
      }
      const conversation = await createGroupConversation({
        userId: user.sub,
        name,
        participantUserIds,
      });
      return NextResponse.json({ conversation });
    } else {
      return NextResponse.json({ error: "Invalid type (must be DIRECT or GROUP)" }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
