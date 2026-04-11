export interface SessionPayload {
  sub: string;
  email: string;
  role: string;
  tenantId?: string;
}

export function verifyToken(token: string): SessionPayload {
  // Placeholder for JWT verification
  // In production, use a proper JWT library like jsonwebtoken
  try {
    // Decode token (placeholder)
    return {
      sub: "user-id",
      email: "user@example.com",
      role: "USER",
    };
  } catch (error) {
    throw new Error("Invalid token");
  }
}

export function generateToken(payload: SessionPayload): string {
  // Placeholder for JWT generation
  return "token";
}
