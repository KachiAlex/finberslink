import { NextRequest, NextResponse } from "next/server";

import { listAllUsers } from "@/features/admin/service";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";

const ListUsersSchema = z.object({
  role: z.enum(["STUDENT", "TUTOR", "ADMIN", "SUPER_ADMIN", "EMPLOYER"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INVITED"]).optional(),
  search: z.string().optional(),
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 20),
});

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

    const { searchParams } = new URL(request.url);
    const filters = ListUsersSchema.parse(Object.fromEntries(searchParams));

    const result = await listAllUsers(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
