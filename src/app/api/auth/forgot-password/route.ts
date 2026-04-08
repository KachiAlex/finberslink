import { NextRequest, NextResponse } from "next/server";

import { requestPasswordReset } from "@/features/auth/service";
import { ForgotPasswordSchema } from "@/features/auth/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await requestPasswordReset(parsed.data);

    return NextResponse.json({ message: "If an account exists for that email, a reset link is on its way." });
  } catch (error) {
    console.error("Forgot password error", error);
    return NextResponse.json({ error: "Unable to process request" }, { status: 500 });
  }
}
