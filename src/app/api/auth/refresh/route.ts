import { NextRequest, NextResponse } from "next/server";

import { refreshSession } from "@/features/auth/service";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    const tokens = await refreshSession(refreshToken);
    const response = NextResponse.json(
      { message: "Session refreshed" },
      { status: 200 }
    );

    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    
    const response = NextResponse.json(
      { error: "Invalid or expired refresh token" },
      { status: 401 }
    );

    clearAuthCookies(response);
    return response;
  }
}
