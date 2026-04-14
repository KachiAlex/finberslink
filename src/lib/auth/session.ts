import { cookies } from "next/headers";
import { verifyAccessToken } from "./jwt";

export async function getSessionFromCookies() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;
    const payload = await verifyAccessToken(token);
    return {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      // nested user shape for backward compat
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
      },
    };
  } catch {
    return null;
  }
}

export async function requireSession(_options?: { failureMode?: string }) {
  const session = await getSessionFromCookies();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
