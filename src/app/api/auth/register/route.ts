import { NextRequest, NextResponse } from "next/server";

import { RegisterSchema } from "@/features/auth/schemas";
import { prisma } from "@/lib/prisma";
import { setAuthCookies } from "@/lib/auth/cookies";
import { hashPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken, type SessionPayload } from "@/lib/auth/jwt";

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

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role ?? "STUDENT",
        status: "ACTIVE",
      },
    });

    const sessionPayload: SessionPayload = {
      sub: user.id,
      role: user.role as SessionPayload["role"],
      status: user.status as SessionPayload["status"],
    };

    const tokens = {
      accessToken: signAccessToken(sessionPayload),
      refreshToken: signRefreshToken(sessionPayload),
    };
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
