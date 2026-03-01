import { NextRequest, NextResponse } from "next/server";

import { loginUser } from "@/features/auth/service";
import { LoginSchema } from "@/features/auth/schemas";
import { setAuthCookies } from "@/lib/auth/cookies";

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
    const response = NextResponse.json(
      { message: "Login successful", user: { email: parsed.data.email } },
      { status: 200 }
    );

    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    
    if (error instanceof Error && error.message === "Invalid credentials") {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
