import { NextRequest, NextResponse } from "next/server";

import { loginUser } from "@/features/auth/service";
import { LoginSchema } from "@/features/auth/schemas";
import { setAuthCookies } from "@/lib/auth/cookies";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const contentType = (request.headers.get("content-type") || "").toLowerCase();

    if (contentType && !contentType.includes("application/json")) {
      return NextResponse.json({ error: "Expected application/json request" }, { status: 415 });
    }

    const raw = await request.text();
    const cleaned = raw.replace(/^\uFEFF/, "").trim();

    let reqBody: unknown = {};
    if (cleaned) {
      try {
        reqBody = JSON.parse(cleaned);
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
    }

    const parsed = LoginSchema.safeParse(reqBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const tokens = await loginUser(parsed.data);

    const response = NextResponse.json(
      { message: "Login successful", user: { email: tokens.user.email, role: tokens.user.role } },
      { status: 200 }
    );
    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "Invalid credentials") {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    console.error("Login error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
