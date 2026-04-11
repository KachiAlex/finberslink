// REST API for chat memberships (Messenger-style scaffold)
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from "../_helpers";
import { upsertChatMembership } from "@/features/chat/service";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const chatSpaceId = searchParams.get("chatSpaceId");
    if (!chatSpaceId) return NextResponse.json({ error: "Missing chatSpaceId" }, { status: 400 });
    // For now, just return the current user's membership in the space
    // (Can be expanded to list all memberships if needed)
    const membership = await upsertChatMembership({ chatSpaceId, userId: user.sub });
    return NextResponse.json({ memberships: [membership] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const { chatSpaceId, userId, role } = body;
    if (!chatSpaceId || !userId) return NextResponse.json({ error: "Missing chatSpaceId or userId" }, { status: 400 });
    const membership = await upsertChatMembership({ chatSpaceId, userId, role });
    return NextResponse.json({ membership });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
