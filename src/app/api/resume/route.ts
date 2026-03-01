import { NextRequest, NextResponse } from "next/server";

import { createResume, listUserResumes } from "@/features/resume/service";
import { verifyToken } from "@/lib/auth/jwt";
import { ResumeSchema } from "@/features/resume/schemas";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(accessToken);
    const resumes = await listUserResumes(user.sub);

    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("Resumes fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(accessToken);
    const body = await request.json();
    const parsed = ResumeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const resume = await createResume(parsed.data);
    return NextResponse.json(
      { message: "Resume created successfully", resume },
      { status: 201 }
    );
  } catch (error) {
    console.error("Resume creation error:", error);
    return NextResponse.json(
      { error: "Failed to create resume" },
      { status: 500 }
    );
  }
}
