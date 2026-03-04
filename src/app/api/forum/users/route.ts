import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    const courseId = searchParams.get("courseId") ?? undefined;
    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const term = q.toLowerCase();
    const limit = courseId ? 12 : 8;
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { email: { contains: term, mode: "insensitive" } },
              { firstName: { contains: term, mode: "insensitive" } },
              { lastName: { contains: term, mode: "insensitive" } },
            ],
          },
          courseId
            ? {
                OR: [
                  { enrollments: { some: { courseId } } },
                  { coursesTaught: { some: { id: courseId } } },
                  { role: "ADMIN" },
                ],
              }
            : {},
        ],
      },
      take: limit,
      orderBy: [
        // Prefer tutors/admins when scoping by course, then students
        {
          role: "desc",
        },
        { firstName: "asc" },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("User mention lookup error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
