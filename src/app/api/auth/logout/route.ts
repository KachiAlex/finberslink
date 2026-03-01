import { NextRequest, NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  clearAuthCookies(response);
  return response;
}
