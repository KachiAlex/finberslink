import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // POC: do not persist to DB yet. Return a demo resume id.
    const resumeId = `demo-${uuidv4()}`;

    return NextResponse.json({ resumeId, draft: body.draft ?? null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
