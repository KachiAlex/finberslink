import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";

export const GET = async (request: NextRequest) => {
  try {
    // Check cookie from request
    const tokenFromRequest = request.cookies.get("access_token")?.value;
    
    // Check cookie from next/headers
    const cookieStore = cookies();
    const tokenFromHeaders = cookieStore.get("access_token")?.value;

    let payload = null;
    let error = null;
    
    const token = tokenFromRequest || tokenFromHeaders;
    if (token) {
      try {
        payload = await verifyAccessToken(token);
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    }

    return NextResponse.json({
      hasTokenFromRequest: !!tokenFromRequest,
      hasTokenFromHeaders: !!tokenFromHeaders,
      tokenLength: token?.length ?? 0,
      payload,
      error,
      allCookies: Object.fromEntries(
        request.cookies.getAll().map(c => [c.name, c.value.substring(0, 20) + '...'])
      ),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
};
