import { NextResponse } from "next/server";
import type { TokenPair } from "./jwt";

function resolveSecureCookieFlag() {
  const explicit = process.env.AUTH_COOKIE_SECURE?.toLowerCase();
  if (explicit === "true") {
    return true;
  }

  if (explicit === "false") {
    return false;
  }

  const appUrl =
    process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.PLAYWRIGHT_BASE_URL;

  if (appUrl) {
    return appUrl.startsWith("https://");
  }

  return Boolean(process.env.VERCEL);
}

const secureCookieFlag = resolveSecureCookieFlag();

function resolveSameSite(secure: boolean): "lax" | "none" {
  // Browsers reject SameSite=None unless Secure=true.
  return secure ? "none" : "lax";
}

export function setAuthCookies(response: NextResponse, tokens: TokenPair) {
  const secure = secureCookieFlag;
  const sameSite = resolveSameSite(secure);

  response.cookies.set("access_token", tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 60 * 15, // 15 minutes
    path: "/",
  });

  response.cookies.set("refresh_token", tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export function clearAuthCookies(response: NextResponse) {
  const secure = secureCookieFlag;
  const sameSite = resolveSameSite(secure);

  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 0,
    path: "/",
  });
}
