import { SignJWT, jwtVerify } from "jose";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SessionPayload {
  sub: string;
  email: string;
  role: string;
  tenantId?: string;
}

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function generateAccessToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getAccessSecret());
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret(), { algorithms: ["HS256"] });
  return payload as unknown as SessionPayload;
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, getRefreshSecret(), { algorithms: ["HS256"] });
  return payload as unknown as { sub: string };
}

/** @deprecated Use verifyAccessToken instead */
export function verifyToken(token: string): SessionPayload {
  throw new Error("verifyToken is deprecated - use verifyAccessToken (async)");
}

/** @deprecated Use generateAccessToken instead */
export function generateToken(payload: SessionPayload): string {
  throw new Error("generateToken is deprecated - use generateAccessToken (async)");
}
