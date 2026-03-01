import { NextRequest, NextResponse } from "next/server";

import { getUserById, updateUserRole, updateUserStatus } from "@/features/admin/service";
import { verifyToken } from "@/lib/auth/jwt";
import { z } from "zod";
import { Role, UserStatus } from "@prisma/client";

const UpdateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

const UpdateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params;
    const userDetails = await getUserById(userId);

    if (!userDetails) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userDetails });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminUser = verifyToken(accessToken);
    if (adminUser.role !== "ADMIN" && adminUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const body = await request.json();

    // Determine what to update based on the payload
    if (body.role !== undefined) {
      const parsed = UpdateUserRoleSchema.safeParse({ role: body.role });
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid role", details: parsed.error.issues },
          { status: 400 }
        );
      }

      const updatedUser = await updateUserRole(userId, parsed.data.role);
      return NextResponse.json({
        message: "User role updated successfully",
        user: updatedUser,
      });
    }

    if (body.status !== undefined) {
      const parsed = UpdateUserStatusSchema.safeParse({ status: body.status });
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid status", details: parsed.error.issues },
          { status: 400 }
        );
      }

      const updatedUser = await updateUserStatus(userId, parsed.data.status);
      return NextResponse.json({
        message: "User status updated successfully",
        user: updatedUser,
      });
    }

    return NextResponse.json(
      { error: "No valid update field provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
