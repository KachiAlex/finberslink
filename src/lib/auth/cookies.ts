import { NextResponse } from "next/server";
import type { TokenPair } from "@/lib/auth/jwt";

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

export function setAuthCookies(response: NextResponse, tokens: TokenPair) {
  response.cookies.set("access_token", tokens.accessToken, {
    httpOnly: true,
    secure: secureCookieFlag,
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutes
    path: "/",
  });

  response.cookies.set("refresh_token", tokens.refreshToken, {
    httpOnly: true,
    secure: secureCookieFlag,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
