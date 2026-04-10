import { NextResponse } from "next/server";
import { setAuthCookies } from "../../../../lib/auth/cookies";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: 'not-allowed' }, { status: 403 });
  }

  const url = new URL(request.url);
  const access = url.searchParams.get('access');
  const refresh = url.searchParams.get('refresh');
  const redirect = url.searchParams.get('redirect') || '/';

  if (!access || !refresh) {
    return NextResponse.json({ error: 'missing-tokens' }, { status: 400 });
  }

  const tokens = { accessToken: access, refreshToken: refresh };

  const response = NextResponse.redirect(new URL(redirect, url.origin));
  setAuthCookies(response as unknown as NextResponse, tokens as any);
  return response;
}
