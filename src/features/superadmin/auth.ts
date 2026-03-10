import { cookies } from "next/headers";

import { verifyToken } from "@/lib/auth/jwt";
import { requireSuperAdminUser } from "./service";

export async function requireSuperAdminSession() {
  const store = await cookies();
  const token = store.get("access_token")?.value;
  if (!token) {
    throw new Error("Not authorized");
  }

  const payload = verifyToken(token);
  return requireSuperAdminUser(payload.sub);
}
