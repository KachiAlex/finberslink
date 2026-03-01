import { NextRequest, NextResponse } from "next/server";

import { registerUser } from "@/features/auth/service";
import { RegisterSchema } from "@/features/auth/schemas";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const tokens = await registerUser(parsed.data);
    const response = NextResponse.json(
      { message: "User registered successfully", user: { email: parsed.data.email } },
      { status: 201 }
    );

    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
