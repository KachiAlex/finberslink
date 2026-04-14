import { NextRequest, NextResponse } from "next/server";

import { RegisterSchema } from "@/features/auth/schemas";
import { registerUser } from "@/features/auth/service";
import { upsertStudentProfile } from "@/features/profile/service";
import { setAuthCookies } from "@/lib/auth/cookies";
import { getOrCreateDefaultTenant } from "@/features/tenant/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const contentType = (request.headers.get("content-type") || "").toLowerCase();

    if (contentType && !contentType.includes("application/json")) {
      return NextResponse.json({ error: "Expected application/json request" }, { status: 415 });
    }

    const raw = await request.text();
    const cleaned = raw.replace(/^\uFEFF/, "").trim();

    let body: unknown = {};
    if (cleaned) {
      try {
        body = JSON.parse(cleaned);
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
    }

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const defaultTenant = await getOrCreateDefaultTenant();
    const tokens = await registerUser(parsed.data, defaultTenant.id);

    // Create student profile after registration
    try {
      await upsertStudentProfile(tokens.user.id, {});
    } catch {
      // Non-fatal - profile can be created later
    }

    const response = NextResponse.json(
      { message: "User registered successfully", user: { email: tokens.user.email, role: tokens.user.role } },
      { status: 201 }
    );

    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    const requestId = crypto.randomUUID();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId}] Registration error:`, errorMessage);

    if (errorMessage === "User already exists") {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const code = (error as { code?: unknown })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }
    if (code === "P2021") {
      return NextResponse.json({ error: "Database schema not deployed", requestId }, { status: 503 });
    }

    return NextResponse.json({ error: "Internal server error", requestId }, { status: 500 });
  }
}
