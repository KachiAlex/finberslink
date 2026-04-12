import { NextRequest } from "next/server";
import { requireAuth as libRequireAuth } from "@/lib/auth/guards";

export async function requireAuth(request: NextRequest) {
  return libRequireAuth(request);
}
