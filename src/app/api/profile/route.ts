import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { getStudentProfile, upsertStudentProfile } from "@/features/profile/service";
import { invalidateDashboardInsights } from "@/features/dashboard/service";

type UpdateProfileRequest = {
  headline?: string;
  bio?: string;
  location?: string;
  certifications?: string[];
  education?: any;
};

export async function GET() {
  try {
    const session = await requireSession({
      allowedRoles: ["STUDENT"],
      failureMode: "error",
    });

    const profile = await getStudentProfile(session.sub);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession({
      allowedRoles: ["STUDENT"],
      failureMode: "error",
    });

    const body = (await request.json()) as UpdateProfileRequest;

    const profile = await upsertStudentProfile({
      userId: session.sub,
      headline: body.headline,
      bio: body.bio,
      location: body.location,
      certifications: Array.isArray(body.certifications) ? body.certifications : undefined,
      education: body.education !== undefined ? body.education : undefined,
    });

    await invalidateDashboardInsights(session.sub);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
