import jwt from "jsonwebtoken";
import { Role, UserStatus } from "@prisma/client";

import { env } from "@/lib/env";

export interface SessionPayload {
  sub: string;
  role: Role;
  status: UserStatus;
}

const ACCESS_TOKEN_EXPIRES_IN = "1h";
const REFRESH_TOKEN_EXPIRES_IN = "30d";

export function signAccessToken(payload: SessionPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function signRefreshToken(payload: SessionPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as SessionPayload;
}
