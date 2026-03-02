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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Registration error:", errorMessage, error);
    
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    if (errorMessage.includes("Cannot read properties of undefined") || errorMessage.includes("db.collection is not a function")) {
      console.error("Firebase not initialized properly");
      return NextResponse.json(
        { error: "Database connection failed. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
