import { NextRequest, NextResponse } from "next/server";

export class AuthError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAuth(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  
  if (!token) {
    throw new AuthError("Missing authorization token");
  }

  try {
    // Verify token (placeholder - implement actual verification)
    return { userId: "user-id", role: "USER" };
  } catch (error) {
    throw new AuthError("Invalid token");
  }
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
  
  if (error instanceof Error && error.message.includes("Forbidden")) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}


export async function withAuth(request: NextRequest) {
  return requireAuth(request);
}
