import { NextRequest, NextResponse } from "next/server";

import { resetPassword } from "@/features/auth/service";
import { ResetPasswordSchema } from "@/features/auth/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await resetPassword(parsed.data);
    return NextResponse.json({ message: "Password updated. You can now sign in with your new password." });
  } catch (error) {
    console.error("Reset password error", error);
    return NextResponse.json({ error: "Unable to reset password" }, { status: 400 });
  }
}
