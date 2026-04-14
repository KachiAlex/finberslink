import { NextRequest, NextResponse } from "next/server";

import { refreshSession } from "@/features/auth/service";
import { setAuthCookies } from "@/lib/auth/cookies";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const tokens = await refreshSession(refreshToken);

    const response = NextResponse.json({ message: "Token refreshed" }, { status: 200 });
    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Token refresh error:", message);
    return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
  }
}
