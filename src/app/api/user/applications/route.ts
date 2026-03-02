import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(accessToken);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const where: any = { userId: user.sub };
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;
    const applications = await prisma.jobApplication.findMany({
      where,
      include: { opportunity: true, resume: true },
      skip,
      take: limit,
      orderBy: { submittedAt: 'desc' },
    });

    const total = await prisma.jobApplication.count({ where });

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get user applications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
