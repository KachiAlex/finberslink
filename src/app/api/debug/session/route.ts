import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  // extract access_token value
  const parts = cookieHeader.split(";").map(p => p.trim());
  const access = parts.find(p => p.startsWith("access_token="));
  const token = access?.split("=")[1];

  if (!token) {
    return NextResponse.json({ ok: false, error: "no-token", cookieHeader }, { status: 200 });
  }

  try {
    const payload = verifyToken(token);
    return NextResponse.json({ ok: true, payload }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 200 });
  }
}
