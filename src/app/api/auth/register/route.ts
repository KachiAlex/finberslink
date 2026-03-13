import { NextRequest, NextResponse } from "next/server";

import { RegisterSchema } from "@/features/auth/schemas";
import { registerUser } from "@/features/auth/service";
import { setAuthCookies } from "@/lib/auth/cookies";
import { verifyToken } from "@/lib/auth/jwt";
import { getOrCreateDefaultTenant } from "@/features/tenant/service";

export const runtime = "nodejs";

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

    // Get default tenant for the registration
    const defaultTenant = await getOrCreateDefaultTenant();

    // Register user using auth service
    const tokens = await registerUser(parsed.data, defaultTenant.id);
    const payload = verifyToken(tokens.accessToken);

    const response = NextResponse.json(
      { message: "User registered successfully", user: { email: parsed.data.email } },
      { status: 201 }
    );

    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    const requestId = crypto.randomUUID();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId}] Registration error:`, errorMessage, error);
    
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    if (errorMessage.startsWith("Missing required environment variable:")) {
      return NextResponse.json(
        { error: "Server misconfiguration", requestId },
        { status: 500 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2021"
    ) {
      return NextResponse.json(
        { error: "Database schema not deployed", requestId },
        { status: 503 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
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
      { error: "Internal server error", requestId },
      { status: 500 }
    );
  }
}
