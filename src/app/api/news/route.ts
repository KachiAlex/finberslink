import { NextRequest, NextResponse } from "next/server";

import { listNewsPosts, createNewsPost } from "@/features/news/service";
import { verifyToken } from "@/lib/auth/jwt";
import { CreateNewsSchema } from "@/features/news/schemas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    const posts = published 
      ? await (await import("@/features/news/service")).listPublishedNewsPosts(limit)
      : await listNewsPosts(limit);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
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
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = CreateNewsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const post = await createNewsPost({
      ...parsed.data,
      authorId: user.sub,
    });

    return NextResponse.json(
      { message: "News post created successfully", post },
      { status: 201 }
    );
  } catch (error) {
    console.error("News creation error:", error);
    return NextResponse.json(
      { error: "Failed to create news post" },
      { status: 500 }
    );
  }
}
