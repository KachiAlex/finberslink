import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.DATABASE_URL;
  return NextResponse.json({
    present: !!url,
    startsWithPostgres: url?.startsWith("postgres") ?? false,
    head: url ? url.slice(0, 32) : null,
  });
}
