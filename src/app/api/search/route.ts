import { NextRequest, NextResponse } from "next/server";

import { searchAll } from "@/features/search/service";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    // Optional: Require authentication for search
    const accessToken = request.cookies.get("access_token")?.value;
    if (accessToken) {
      verifyToken(accessToken);
    }

    const results = await searchAll(query, limit);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
