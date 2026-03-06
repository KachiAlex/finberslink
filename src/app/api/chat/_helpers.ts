import { NextRequest } from "next/server";

import { verifyToken } from "@/lib/auth/jwt";

export function requireAuth(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    const error = new Error("UNAUTHORIZED");
    (error as any).status = 401;
    throw error;
  }
  return verifyToken(token);
}
