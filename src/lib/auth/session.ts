import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { verifyToken, type SessionPayload } from "./jwt";

const NOT_AUTH_REDIRECT = "/login?reason=not-authenticated";

type FailureMode = "redirect" | "error";

export interface RequireSessionOptions {
  allowedRoles?: Role[];
  requireTenant?: boolean;
  redirectTo?: string;
  failureMode?: FailureMode;
}

const notAuthenticatedError = new Error("Not authenticated");
notAuthenticatedError.name = "NotAuthenticatedError";

function handleFailure(mode: FailureMode, redirectTarget?: string): never {
  if (mode === "redirect") {
    redirect(redirectTarget ?? NOT_AUTH_REDIRECT);
  }

  throw notAuthenticatedError;
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get("access_token")?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[session] verifyToken failed for access_token in server session", String(err));
    }
    return null;
  }
}

export async function requireSession(options: RequireSessionOptions = {}) {
  const {
    allowedRoles,
    requireTenant,
    redirectTo,
    failureMode = "redirect",
  } = options;

  const session = await getSessionFromCookies();

  if (!session) {
    handleFailure(failureMode, redirectTo);
  }

  if (allowedRoles?.length && !allowedRoles.includes(session.role)) {
    handleFailure(failureMode, redirectTo);
  }

  if (requireTenant && !session.tenantId) {
    handleFailure(failureMode, redirectTo);
  }

  return session;
}
