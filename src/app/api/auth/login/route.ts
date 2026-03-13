import { NextRequest, NextResponse } from "next/server";

import { loginUser } from "@/features/auth/service";
import { LoginSchema } from "@/features/auth/schemas";
import { setAuthCookies } from "@/lib/auth/cookies";
import { verifyToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const tokens = await loginUser(parsed.data);
    const payload = verifyToken(tokens.accessToken);
    
    const response = NextResponse.json(
      { message: "Login successful", user: { email: parsed.data.email, role: payload.role } },
      { status: 200 }
    );

    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (error instanceof Error && error.message === "Invalid credentials") {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.error("Login error:", errorMessage);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
