import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { prisma } from "@/lib/prisma";
import { loginUser } from "@/features/auth/service";
import { LoginSchema } from "@/features/auth/schemas";
import { setAuthCookies } from "@/lib/auth/cookies";
import { verifyPassword } from "@/lib/auth/password";
import { verifyToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let reqBody: unknown;
    const nowLog = new Date().toISOString();
    try {
      const debugPath = path.resolve(process.cwd(), 'tmp', 'auth-debug.log');
      fs.appendFileSync(debugPath, `${nowLog}\tLOGIN_HEADERS\t${JSON.stringify(Object.fromEntries(request.headers))}\n`);
    } catch (e) {
      // ignore debug logging errors
    }
    const contentType = (request.headers.get("content-type") || "").toLowerCase();
    const raw = await request.text();
    const cleaned = raw.replace(/^\uFEFF/, "").trim();

    // If the request is not JSON, log and return a clear 415 error
    if (contentType && !contentType.includes("application/json")) {
      try {
        const now = new Date().toISOString();
        const logPath = path.resolve(process.cwd(), 'tmp', 'login-non-json.log');
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        fs.appendFileSync(logPath, `${now}\tCONTENT_TYPE=${contentType}\t${raw}\n\n`);
      } catch (e) {
        // ignore logging errors
      }
      return NextResponse.json({ error: "Expected application/json request" }, { status: 415 });
    }

    if (cleaned) {
      try {
        reqBody = JSON.parse(cleaned);
      } catch (finalErr) {
        const now = new Date().toISOString();
        const logPath = path.resolve(process.cwd(), 'tmp', 'login-raw-body.log');
        try {
          fs.mkdirSync(path.dirname(logPath), { recursive: true });
          fs.appendFileSync(logPath, `${now}\t${raw}\n\n`);
        } catch (e) {
          // ignore logging errors
        }
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
    } else {
      reqBody = {};
    }
    const parsed = LoginSchema.safeParse(reqBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const tokens = await loginUser(parsed.data);
    const payload = verifyToken(tokens.accessToken);

    const body = { message: "Login successful", user: { email: parsed.data.email, role: payload.role } };

    // Build response and attach cookies
    const response = NextResponse.json(body, { status: 200 });
    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (error instanceof Error && error.message === "Invalid credentials") {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    try {
      const now = new Date().toISOString();
      const logPath = path.resolve(process.cwd(), 'tmp', 'login-error.log');
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      const stack = error instanceof Error ? error.stack : String(error);
      fs.appendFileSync(logPath, `${now}\tLOGIN_ERROR\t${errorMessage}\n${stack}\n\n`);
    } catch (e) {
      // ignore logging errors
    }

    console.error("Login error:", errorMessage);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
