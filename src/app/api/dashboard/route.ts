import { NextRequest, NextResponse } from "next/server";

import { getStudentEnrollments, getStudentResumes, getStudentApplications } from "@/features/dashboard/service";
import { verifyToken } from "@/lib/auth/jwt";

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
    const [enrollments, resumes, applications] = await Promise.all([
      getStudentEnrollments(user.sub),
      getStudentResumes(user.sub),
      getStudentApplications(user.sub),
    ]);

    return NextResponse.json({
      enrollments,
      resumes,
      applications,
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
