import { NextRequest, NextResponse } from "next/server";

import { getAdminOverview } from "@/features/admin/service";
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
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const overview = await getAdminOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error("Admin overview fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin overview" },
      { status: 500 }
    );
  }
}
