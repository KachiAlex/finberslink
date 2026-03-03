import { NextRequest, NextResponse } from "next/server";

import { loginUser } from "@/features/auth/service";
import { LoginSchema } from "@/features/auth/schemas";
import { setAuthCookies } from "@/lib/auth/cookies";
import { verifyToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Login attempt with email:", body.email);
    
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation error:", parsed.error.issues);
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    console.log("Calling loginUser service...");
    const tokens = await loginUser(parsed.data);
    const payload = verifyToken(tokens.accessToken);
    console.log("Tokens generated successfully");
    
    const response = NextResponse.json(
      { message: "Login successful", user: { email: parsed.data.email, role: payload.role } },
      { status: 200 }
    );

    setAuthCookies(response, tokens);
    console.log("Auth cookies set, returning response");
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Login error:", errorMessage);
    console.error("Full error:", error);
    
    if (error instanceof Error && error.message === "Invalid credentials") {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (
      errorMessage.includes("Cannot read properties of undefined") ||
      errorMessage.includes("db.collection is not a function") ||
      errorMessage.includes("collection is not a function") ||
      errorMessage.includes("Firebase not initialized")
    ) {
      console.error("Firebase not initialized properly");
      return NextResponse.json(
        { error: "Database connection failed. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
